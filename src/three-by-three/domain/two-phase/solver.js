// ============================================================
// solver.js — Two-Phase (Kociemba) IDA* Solver
// ============================================================
// Phase 1: reduce G → G1 using Twist, Flip, UDSlice coordinates
//          with 18 moves and IDA*
// Phase 2: reduce G1 → Identity using CornerPerm, EdgePerm,
//          UDSlicePerm coordinates with 10 moves and IDA*
//
// The solver tries increasing Phase 1 depths and for each
// Phase 1 solution, attempts Phase 2 within the remaining budget.
// ============================================================

import { CubieCube, MOVE_CUBES, MOVE_NAMES, PHASE2_MOVES, PHASE2_MOVE_COUNT } from "./cubie-cube.js";
import {
  UDSLICE_COUNT, UDSLICE_PERM_COUNT,
  getTwist, getFlip, getUDSlice,
  getCornerPerm, getEdgePerm, getUDSlicePerm,
} from "./coordinates.js";
import { generateMoveTables } from "./move-tables.js";
import { generatePruningTables } from "./pruning-tables.js";

// ============================================================
// Module-level state (initialized by initSolver)
// ============================================================

let twistMove, flipMove, udSliceMove;
let cornerPermMove, edgePermMove, udSlicePermMove;
let pruneTwistSlice, pruneFlipSlice;
let pruneCornerSlice, pruneEdgeSlice;
let initialized = false;

// ============================================================
// Initialization
// ============================================================

/**
 * Pre-compute all move tables and pruning tables.
 * Must be called once before solve(). Typically at worker load time.
 */
export function initSolver() {
  if (initialized) return;

  const mt = generateMoveTables();
  twistMove       = mt.twistMove;
  flipMove        = mt.flipMove;
  udSliceMove     = mt.udSliceMove;
  cornerPermMove  = mt.cornerPermMove;
  edgePermMove    = mt.edgePermMove;
  udSlicePermMove = mt.udSlicePermMove;

  const pt = generatePruningTables(mt);
  pruneTwistSlice  = pt.pruneTwistSlice;
  pruneFlipSlice   = pt.pruneFlipSlice;
  pruneCornerSlice = pt.pruneCornerSlice;
  pruneEdgeSlice   = pt.pruneEdgeSlice;

  initialized = true;
}

// ============================================================
// Move redundancy check
// ============================================================

/**
 * Returns true if move `m` can follow `lastMove` without redundancy.
 * Rules:
 *   - Can't repeat the same face (e.g., U U2 → should be U')
 *   - For opposite faces (U/D, R/L, F/B), enforce ordering to
 *     avoid equivalent sequences (e.g., allow U D but not D U)
 */
function canDoMove(m, lastMove) {
  if (lastMove === -1) return true;
  const face = Math.floor(m / 3);
  const lastFace = Math.floor(lastMove / 3);
  // Same face → redundant
  if (face === lastFace) return false;
  // Opposite faces (share axis: face%3 === lastFace%3 when face≠lastFace)
  // Enforce: lower face index must come first
  if (face % 3 === lastFace % 3 && face < lastFace) return false;
  return true;
}

// ============================================================
// Phase 1 IDA* search
// ============================================================

/**
 * Depth-limited DFS for Phase 1.
 * When a solution is found, calls onSolution(moveList).
 * If onSolution returns true, the search stops (prune).
 *
 * @returns {boolean} true if search should stop
 */
function phase1Search(twist, flip, udSlice, depth, lastMove, moves, onSolution) {
  // Pruning: heuristic exceeds remaining depth
  const h = Math.max(
    pruneTwistSlice[twist * UDSLICE_COUNT + udSlice],
    pruneFlipSlice[flip * UDSLICE_COUNT + udSlice]
  );
  if (h > depth) return false;

  // Goal check
  if (depth === 0) {
    if (twist === 0 && flip === 0 && udSlice === 0) {
      return onSolution(moves);
    }
    return false;
  }

  // Try all 18 moves
  for (let m = 0; m < 18; m++) {
    if (!canDoMove(m, lastMove)) continue;

    const newTwist   = twistMove[twist * 18 + m];
    const newFlip    = flipMove[flip * 18 + m];
    const newSlice   = udSliceMove[udSlice * 18 + m];

    moves.push(m);
    const stop = phase1Search(newTwist, newFlip, newSlice, depth - 1, m, moves, onSolution);
    moves.pop();
    if (stop) return true;
  }
  return false;
}

// ============================================================
// Phase 2 IDA* search
// ============================================================

/**
 * Depth-limited DFS for Phase 2.
 * @returns {number[]|null} move list if solution found, null otherwise
 */
function phase2Search(cp, ep, udsp, depth, lastMove, moves) {
  const h = Math.max(
    pruneCornerSlice[cp * UDSLICE_PERM_COUNT + udsp],
    pruneEdgeSlice[ep * UDSLICE_PERM_COUNT + udsp]
  );
  if (h > depth) return null;

  if (depth === 0) {
    if (cp === 0 && ep === 0 && udsp === 0) {
      return moves.slice();
    }
    return null;
  }

  for (let mi = 0; mi < PHASE2_MOVE_COUNT; mi++) {
    const m = PHASE2_MOVES[mi]; // actual move index (0–17)
    if (!canDoMove(m, lastMove)) continue;

    const newCp   = cornerPermMove[cp * PHASE2_MOVE_COUNT + mi];
    const newEp   = edgePermMove[ep * PHASE2_MOVE_COUNT + mi];
    const newUdsp = udSlicePermMove[udsp * PHASE2_MOVE_COUNT + mi];

    moves.push(m);
    const result = phase2Search(newCp, newEp, newUdsp, depth - 1, m, moves);
    if (result) return result;
    moves.pop();
  }
  return null;
}

/**
 * Try to solve Phase 2 from the given coordinates within maxDepth moves.
 * @param {number} lastP1Move  last move of Phase 1 (for redundancy check)
 */
function solvePhase2(cp, ep, udsp, maxDepth, lastP1Move) {
  // Start from the pruning lower bound
  const minDist = Math.max(
    pruneCornerSlice[cp * UDSLICE_PERM_COUNT + udsp],
    pruneEdgeSlice[ep * UDSLICE_PERM_COUNT + udsp]
  );

  for (let d = minDist; d <= maxDepth; d++) {
    const result = phase2Search(cp, ep, udsp, d, lastP1Move, []);
    if (result) return result;
  }
  return null;
}

// ============================================================
// Main solver
// ============================================================

/**
 * Solve a CubieCube using the Two-Phase algorithm.
 * @param {CubieCube} cubieCube  the scrambled cube state
 * @returns {string}  solution as a space-separated move string (e.g., "U R2 F' D L2 B")
 */
export function solve(cubieCube) {
  if (!initialized) {
    throw new Error("Solver not initialized. Call initSolver() first.");
  }

  if (cubieCube.isIdentity()) return "";

  // Phase 1 initial coordinates
  const twist0   = getTwist(cubieCube);
  const flip0    = getFlip(cubieCube);
  const udSlice0 = getUDSlice(cubieCube);

  let bestSolution = null;
  let bestLength = 23; // Upper bound for solution length

  // Try increasing Phase 1 depths (maximum distance to G1 is mathematically 12)
  const maxPhase1Depth = 12;
  for (let maxDepth1 = 0; maxDepth1 <= maxPhase1Depth; maxDepth1++) {
    if (bestSolution && maxDepth1 >= bestLength) break;

    const stop = phase1Search(twist0, flip0, udSlice0, maxDepth1, -1, [],
      (p1Moves) => {
        // Phase 1 solution found — try Phase 2
        const maxP2 = bestLength - p1Moves.length - 1;
        if (maxP2 < 0) return true; // can't improve, stop

        // Apply Phase 1 moves to original cube to get Phase 2 state
        let p2Cube = cubieCube.clone();
        for (const m of p1Moves) {
          p2Cube = p2Cube.multiply(MOVE_CUBES[m]);
        }

        const cp   = getCornerPerm(p2Cube);
        const ep   = getEdgePerm(p2Cube);
        const udsp = getUDSlicePerm(p2Cube);

        const lastP1Move = p1Moves.length > 0 ? p1Moves[p1Moves.length - 1] : -1;
        const p2Moves = solvePhase2(cp, ep, udsp, maxP2, lastP1Move);

        if (p2Moves !== null) {
          bestSolution = [...p1Moves, ...p2Moves];
          bestLength = bestSolution.length;
          // Don't stop — keep searching for shorter total solutions
          return false;
        }
        return false;
      }
    );
  }

  if (!bestSolution) return "";
  return bestSolution.map(m => MOVE_NAMES[m]).join(" ");
}

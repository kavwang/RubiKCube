// ============================================================
// pruning-tables.js — BFS-generated heuristic tables for IDA*
// ============================================================
// Each pruning table stores the minimum number of moves to reach
// the goal state (coordinate = 0) for a pair of coordinates.
// These serve as admissible heuristics for the IDA* search.
//
// Phase 1:
//   pruneTwistSlice[twist * 495 + udSlice]   — max depth ~9
//   pruneFlipSlice[flip * 495 + udSlice]     — max depth ~9
//
// Phase 2:
//   pruneCornerSlice[cp * 24 + udSlicePerm]  — max depth ~15
//   pruneEdgeSlice[ep * 24 + udSlicePerm]    — max depth ~15
// ============================================================

import {
  TWIST_COUNT, FLIP_COUNT, UDSLICE_COUNT,
  CORNER_PERM_COUNT, EDGE_PERM_COUNT, UDSLICE_PERM_COUNT,
} from "./coordinates.js";
import { PHASE2_MOVE_COUNT } from "./cubie-cube.js";

// ============================================================
// Generic BFS pruning table builder
// ============================================================

/**
 * Build a pruning table via BFS from the goal state.
 *
 * @param {number} sizeA    number of states for coordinate A
 * @param {number} sizeB    number of states for coordinate B
 * @param {TypedArray} moveTableA  flat move table for A: moveTableA[a * numMoves + m]
 * @param {TypedArray} moveTableB  flat move table for B: moveTableB[b * numMoves + m]
 * @param {number} numMoves number of moves (18 for Phase 1, 10 for Phase 2)
 * @returns {Uint8Array} pruning table of size sizeA * sizeB
 */
function buildPruningTable(sizeA, sizeB, moveTableA, moveTableB, numMoves) {
  const total = sizeA * sizeB;
  const table = new Uint8Array(total).fill(255); // 255 = unvisited

  // Queues to store coordinate components (a and b) for BFS
  const queueA = new Int32Array(total);
  const queueB = new Int32Array(total);
  let head = 0;
  let tail = 0;

  // Goal state: both coordinates = 0, depth = 0
  table[0] = 0;
  queueA[tail] = 0;
  queueB[tail] = 0;
  tail++;

  while (head < tail) {
    const a = queueA[head];
    const b = queueB[head];
    head++;

    const idx = a * sizeB + b;
    const depth = table[idx];

    const aOffset = a * numMoves;

    for (let m = 0; m < numMoves; m++) {
      const newA = moveTableA[aOffset + m];
      const newB = moveTableB[b * numMoves + m];
      const newIdx = newA * sizeB + newB;

      if (table[newIdx] === 255) {
        table[newIdx] = depth + 1;
        queueA[tail] = newA;
        queueB[tail] = newB;
        tail++;
      }
    }
  }

  return table;
}

// ============================================================
// Public API
// ============================================================

/**
 * Generate all pruning tables.
 * @param {{
 *   twistMove: Uint16Array,
 *   flipMove: Uint16Array,
 *   udSliceMove: Uint16Array,
 *   cornerPermMove: Uint16Array,
 *   edgePermMove: Uint16Array,
 *   udSlicePermMove: Uint8Array,
 * }} moveTables
 * @returns {{
 *   pruneTwistSlice: Uint8Array,
 *   pruneFlipSlice: Uint8Array,
 *   pruneCornerSlice: Uint8Array,
 *   pruneEdgeSlice: Uint8Array,
 * }}
 */
export function generatePruningTables(moveTables) {
  const pruneTwistSlice = buildPruningTable(
    TWIST_COUNT, UDSLICE_COUNT,
    moveTables.twistMove, moveTables.udSliceMove,
    18
  );

  const pruneFlipSlice = buildPruningTable(
    FLIP_COUNT, UDSLICE_COUNT,
    moveTables.flipMove, moveTables.udSliceMove,
    18
  );

  const pruneCornerSlice = buildPruningTable(
    CORNER_PERM_COUNT, UDSLICE_PERM_COUNT,
    moveTables.cornerPermMove, moveTables.udSlicePermMove,
    PHASE2_MOVE_COUNT
  );

  const pruneEdgeSlice = buildPruningTable(
    EDGE_PERM_COUNT, UDSLICE_PERM_COUNT,
    moveTables.edgePermMove, moveTables.udSlicePermMove,
    PHASE2_MOVE_COUNT
  );

  return {
    pruneTwistSlice,
    pruneFlipSlice,
    pruneCornerSlice,
    pruneEdgeSlice,
  };
}

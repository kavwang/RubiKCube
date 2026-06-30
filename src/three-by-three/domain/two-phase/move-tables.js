// ============================================================
// move-tables.js — Pre-computed coordinate transition tables
// ============================================================
// For each coordinate value and each move, stores the resulting
// coordinate value. This avoids recomputing coordinates from
// CubieCube objects during the IDA* search.
//
// Phase 1 tables (18 moves each):
//   twistMove[twist * 18 + m]       → new twist
//   flipMove[flip * 18 + m]         → new flip
//   udSliceMove[slice * 18 + m]     → new udSlice
//
// Phase 2 tables (10 moves each):
//   cornerPermMove[cp * 10 + m]     → new cornerPerm
//   edgePermMove[ep * 10 + m]       → new edgePerm
//   udSlicePermMove[sp * 10 + m]    → new udSlicePerm
// ============================================================

import { CubieCube, MOVE_CUBES, PHASE2_MOVES, PHASE2_MOVE_COUNT } from "./cubie-cube.js";
import {
  TWIST_COUNT, FLIP_COUNT, UDSLICE_COUNT,
  CORNER_PERM_COUNT, EDGE_PERM_COUNT, UDSLICE_PERM_COUNT,
  getTwist, setTwist,
  getFlip, setFlip,
  getUDSlice, setUDSlice,
  getCornerPerm, setCornerPerm,
  getEdgePerm, setEdgePerm,
  getUDSlicePerm, setUDSlicePerm,
} from "./coordinates.js";

// ============================================================
// Phase 1 move table generation
// ============================================================

function generateTwistMoveTable() {
  const table = new Uint16Array(TWIST_COUNT * 18);
  const cube = new CubieCube();

  for (let t = 0; t < TWIST_COUNT; t++) {
    setTwist(cube, t);
    for (let m = 0; m < 18; m++) {
      const moved = cube.multiply(MOVE_CUBES[m]);
      table[t * 18 + m] = getTwist(moved);
    }
    // Reset cp to identity for next iteration (setTwist only sets co)
    cube.cp = [0, 1, 2, 3, 4, 5, 6, 7];
  }
  return table;
}

function generateFlipMoveTable() {
  const table = new Uint16Array(FLIP_COUNT * 18);
  const cube = new CubieCube();

  for (let f = 0; f < FLIP_COUNT; f++) {
    setFlip(cube, f);
    for (let m = 0; m < 18; m++) {
      const moved = cube.multiply(MOVE_CUBES[m]);
      table[f * 18 + m] = getFlip(moved);
    }
    // Reset ep to identity for next iteration (setFlip only sets eo)
    cube.ep = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  }
  return table;
}

function generateUDSliceMoveTable() {
  const table = new Uint16Array(UDSLICE_COUNT * 18);
  const cube = new CubieCube();

  for (let s = 0; s < UDSLICE_COUNT; s++) {
    setUDSlice(cube, s);
    for (let m = 0; m < 18; m++) {
      const moved = cube.multiply(MOVE_CUBES[m]);
      table[s * 18 + m] = getUDSlice(moved);
    }
    // Reset eo to zeros (setUDSlice only sets ep)
    cube.eo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  }
  return table;
}

// ============================================================
// Phase 2 move table generation
// ============================================================

function generateCornerPermMoveTable() {
  const n = PHASE2_MOVE_COUNT;
  const table = new Uint16Array(CORNER_PERM_COUNT * n);
  const cube = new CubieCube();

  for (let c = 0; c < CORNER_PERM_COUNT; c++) {
    setCornerPerm(cube, c);
    for (let mi = 0; mi < n; mi++) {
      const m = PHASE2_MOVES[mi];
      const moved = cube.multiply(MOVE_CUBES[m]);
      table[c * n + mi] = getCornerPerm(moved);
    }
    // Reset co to zeros
    cube.co = [0, 0, 0, 0, 0, 0, 0, 0];
  }
  return table;
}

function generateEdgePermMoveTable() {
  const n = PHASE2_MOVE_COUNT;
  const table = new Uint16Array(EDGE_PERM_COUNT * n);
  const cube = new CubieCube();

  for (let e = 0; e < EDGE_PERM_COUNT; e++) {
    setEdgePerm(cube, e);
    for (let mi = 0; mi < n; mi++) {
      const m = PHASE2_MOVES[mi];
      const moved = cube.multiply(MOVE_CUBES[m]);
      table[e * n + mi] = getEdgePerm(moved);
    }
    // Reset eo to zeros
    cube.eo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  }
  return table;
}

function generateUDSlicePermMoveTable() {
  const n = PHASE2_MOVE_COUNT;
  const table = new Uint8Array(UDSLICE_PERM_COUNT * n);
  const cube = new CubieCube();

  for (let s = 0; s < UDSLICE_PERM_COUNT; s++) {
    setUDSlicePerm(cube, s);
    for (let mi = 0; mi < n; mi++) {
      const m = PHASE2_MOVES[mi];
      const moved = cube.multiply(MOVE_CUBES[m]);
      table[s * n + mi] = getUDSlicePerm(moved);
    }
    // Reset eo to zeros
    cube.eo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  }
  return table;
}

// ============================================================
// Public API
// ============================================================

/**
 * Generate all move tables.
 * @returns {{
 *   twistMove: Uint16Array,
 *   flipMove: Uint16Array,
 *   udSliceMove: Uint16Array,
 *   cornerPermMove: Uint16Array,
 *   edgePermMove: Uint16Array,
 *   udSlicePermMove: Uint8Array
 * }}
 */
export function generateMoveTables() {
  return {
    twistMove:        generateTwistMoveTable(),
    flipMove:         generateFlipMoveTable(),
    udSliceMove:      generateUDSliceMoveTable(),
    cornerPermMove:   generateCornerPermMoveTable(),
    edgePermMove:     generateEdgePermMoveTable(),
    udSlicePermMove:  generateUDSlicePermMoveTable(),
  };
}

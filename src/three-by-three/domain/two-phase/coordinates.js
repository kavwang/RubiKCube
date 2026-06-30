// ============================================================
// coordinates.js — Coordinate encoding/decoding for Two-Phase
// ============================================================
// Phase 1 coordinates:
//   Twist     (0–2186)  : corner orientation   — base-3 encoding of co[0..6]
//   Flip      (0–2047)  : edge orientation     — base-2 encoding of eo[0..10]
//   UDSlice   (0–494)   : UD-slice edge positions — C(12,4) combinatorial
//
// Phase 2 coordinates:
//   CornerPerm    (0–40319) : corner permutation   — Lehmer code of cp[0..7]
//   EdgePerm      (0–40319) : U/D edge permutation — Lehmer code of ep[0..7]
//   UDSlicePerm   (0–23)    : UD-slice edge perm   — Lehmer code of ep[8..11]
// ============================================================

import { CubieCube } from "./cubie-cube.js";

// ============================================================
// Binomial coefficient table  C(n, k) for n ≤ 12, k ≤ 4
// ============================================================
const CNK_TABLE = [];
for (let n = 0; n <= 12; n++) {
  CNK_TABLE[n] = new Array(13).fill(0);
  CNK_TABLE[n][0] = 1;
  for (let k = 1; k <= n; k++) {
    CNK_TABLE[n][k] = CNK_TABLE[n - 1][k - 1] + CNK_TABLE[n - 1][k];
  }
}

function cnk(n, k) {
  if (n < 0 || k < 0 || k > n) return 0;
  return CNK_TABLE[n][k];
}

// ============================================================
// Phase 1: Twist coordinate  (0–2186)
// ============================================================

/**
 * Encode corner orientations as a base-3 number (co[0]..co[6]).
 * co[7] is determined by the parity constraint: sum(co) ≡ 0 (mod 3).
 */
export function getTwist(cube) {
  let twist = 0;
  for (let i = 0; i < 7; i++) {
    twist = twist * 3 + cube.co[i];
  }
  return twist;
}

/** Decode twist coordinate → set cube.co[0..7]. */
export function setTwist(cube, twist) {
  let parity = 0;
  for (let i = 6; i >= 0; i--) {
    cube.co[i] = twist % 3;
    parity += cube.co[i];
    twist = Math.floor(twist / 3);
  }
  cube.co[7] = (3 - (parity % 3)) % 3;
}

export const TWIST_COUNT = 2187; // 3^7

// ============================================================
// Phase 1: Flip coordinate  (0–2047)
// ============================================================

/**
 * Encode edge orientations as a base-2 number (eo[0]..eo[10]).
 * eo[11] is determined by parity: sum(eo) ≡ 0 (mod 2).
 */
export function getFlip(cube) {
  let flip = 0;
  for (let i = 0; i < 11; i++) {
    flip = flip * 2 + cube.eo[i];
  }
  return flip;
}

/** Decode flip coordinate → set cube.eo[0..11]. */
export function setFlip(cube, flip) {
  let parity = 0;
  for (let i = 10; i >= 0; i--) {
    cube.eo[i] = flip % 2;
    parity += cube.eo[i];
    flip = Math.floor(flip / 2);
  }
  cube.eo[11] = parity % 2;
}

export const FLIP_COUNT = 2048; // 2^11

// ============================================================
// Phase 1: UDSlice coordinate  (0–494)
// ============================================================
// Tracks which 4 of 12 edge positions contain UD-slice edges
// (edges 8–11: FR, FL, BL, BR). Uses combinatorial number system.
// Solved state = 0 (slice edges at positions 8–11).
// ============================================================

export function getUDSlice(cube) {
  let a = 0;
  let x = 0;
  for (let j = 11; j >= 0; j--) {
    if (cube.ep[j] >= 8) {
      a += cnk(11 - j, x + 1);
      x++;
    }
  }
  return a;
}

/**
 * Decode UDSlice coordinate → set cube.ep.
 * Places UD-slice edges (8,9,10,11) at the decoded positions.
 * Non-slice edges (0..7) fill remaining positions in order.
 */
export function setUDSlice(cube, idx) {
  const isSlice = new Array(12).fill(false);

  let x = 4;
  for (let j = 11; j >= 0; j--) {
    const c = cnk(j, x);
    if (idx >= c) {
      idx -= c;
      isSlice[11 - j] = true;
      x--;
      if (x === 0) break;
    }
  }

  // Place edges
  let s = 8;  // UD-slice edges: 8, 9, 10, 11
  let o = 0;  // non-slice edges: 0, 1, ..., 7
  for (let i = 0; i < 12; i++) {
    if (isSlice[i]) {
      cube.ep[i] = s++;
    } else {
      cube.ep[i] = o++;
    }
  }
}

export const UDSLICE_COUNT = 495; // C(12, 4)

// ============================================================
// Permutation encoding / decoding  (Lehmer code)
// ============================================================

/**
 * Encode a permutation of n elements to its Lehmer index.
 * @param {number[]} perm  permutation array (values 0..n-1)
 * @param {number} n  number of elements
 * @returns {number}  index in [0, n!-1]
 */
function permToIndex(perm, n) {
  let idx = 0;
  for (let i = 0; i < n; i++) {
    idx *= (n - i);
    for (let j = i + 1; j < n; j++) {
      if (perm[j] < perm[i]) idx++;
    }
  }
  return idx;
}

/**
 * Decode a Lehmer index to a permutation of n elements.
 * @param {number} idx  index in [0, n!-1]
 * @param {number} n  number of elements
 * @returns {number[]}  permutation array
 */
function indexToPerm(idx, n) {
  const perm = new Array(n);
  perm[n - 1] = 0;
  for (let i = n - 2; i >= 0; i--) {
    perm[i] = idx % (n - i);
    idx = Math.floor(idx / (n - i));
    for (let j = i + 1; j < n; j++) {
      if (perm[j] >= perm[i]) perm[j]++;
    }
  }
  return perm;
}

// ============================================================
// Phase 2: CornerPerm coordinate  (0–40319)
// ============================================================

export function getCornerPerm(cube) {
  return permToIndex(cube.cp, 8);
}

export function setCornerPerm(cube, idx) {
  cube.cp = indexToPerm(idx, 8);
}

export const CORNER_PERM_COUNT = 40320; // 8!

// ============================================================
// Phase 2: EdgePerm coordinate  (0–40319)
// ============================================================
// Only encodes the permutation of edges 0–7 in positions 0–7.
// In G1, edges 8–11 are confined to positions 8–11.

export function getEdgePerm(cube) {
  return permToIndex(cube.ep.slice(0, 8), 8);
}

export function setEdgePerm(cube, idx) {
  const perm = indexToPerm(idx, 8);
  for (let i = 0; i < 8; i++) cube.ep[i] = perm[i];
  // Positions 8–11 default to UD-slice edges in order
  for (let i = 8; i < 12; i++) cube.ep[i] = i;
}

export const EDGE_PERM_COUNT = 40320; // 8!

// ============================================================
// Phase 2: UDSlicePerm coordinate  (0–23)
// ============================================================
// Encodes the permutation of edges 8–11 within positions 8–11.
// Uses a Lehmer code on the 4-element sub-permutation.

export function getUDSlicePerm(cube) {
  // Extract the sub-permutation of edges in positions 8–11
  // Normalize: edge 8 → 0, edge 9 → 1, edge 10 → 2, edge 11 → 3
  const sub = new Array(4);
  for (let i = 0; i < 4; i++) {
    sub[i] = cube.ep[i + 8] - 8;
  }
  return permToIndex(sub, 4);
}

export function setUDSlicePerm(cube, idx) {
  const sub = indexToPerm(idx, 4);
  for (let i = 0; i < 4; i++) {
    cube.ep[i + 8] = sub[i] + 8;
  }
  // Positions 0–7 default to non-slice edges in order
  for (let i = 0; i < 8; i++) cube.ep[i] = i;
}

export const UDSLICE_PERM_COUNT = 24; // 4!

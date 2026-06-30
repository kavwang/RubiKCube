// ============================================================
// facelet-parser.js — Convert 54-char facelet string → CubieCube
// ============================================================
// The facelet string has 54 characters in URFDLB order (9 per face).
// Each character is one of U, R, F, D, L, B indicating the sticker color.
//
// Face layout (indices):
//           U0 U1 U2              0  1  2
//           U3 U4 U5              3  4  5
//           U6 U7 U8              6  7  8
//  L0 L1 L2 F0 F1 F2 R0 R1 R2   36 37 38  18 19 20   9 10 11
//  L3 L4 L5 F3 F4 F5 R3 R4 R5   39 40 41  21 22 23  12 13 14
//  L6 L7 L8 F6 F7 F8 R6 R7 R8   42 43 44  24 25 26  15 16 17
//           D0 D1 D2             27 28 29
//           D3 D4 D5             30 31 32
//           D6 D7 D8             33 34 35
//  B0 B1 B2                     45 46 47
//  B3 B4 B5                     48 49 50
//  B6 B7 B8                     51 52 53
// ============================================================

import { CubieCube } from "./cubie-cube.js";

// ============================================================
// Corner facelet mapping
// ============================================================
// For each corner position, list the 3 facelet indices.
// The first index is the U/D facelet (defines orientation 0).
// The second and third go clockwise around the corner.

const CORNER_FACELETS = [
  [8,  9,  20],  // URF: U8, R0, F2
  [6,  18, 38],  // UFL: U6, F0, L2
  [0,  36, 47],  // ULB: U0, L0, B2
  [2,  45, 11],  // UBR: U2, B0, R2
  [29, 26, 15],  // DFR: D2, F8, R6
  [27, 44, 24],  // DLF: D0, L8, F6
  [33, 53, 42],  // DBL: D6, B8, L6
  [35, 17, 51],  // DRB: D8, R8, B6
];

// The colors of each corner piece (in orientation-0 order: U/D first, then CW)
const CORNER_COLORS = [
  "URF", "UFL", "ULB", "UBR", "DFR", "DLF", "DBL", "DRB",
];

// ============================================================
// Edge facelet mapping
// ============================================================
// For each edge position, list the 2 facelet indices.
// The first index is the "primary" facelet (defines orientation 0):
//   - For U/D layer edges (0–7): the U or D face sticker
//   - For middle layer edges (8–11): the F or B face sticker

const EDGE_FACELETS = [
  [5,  10],  // UR:  U5, R1
  [7,  19],  // UF:  U7, F1
  [3,  37],  // UL:  U3, L1
  [1,  46],  // UB:  U1, B1
  [32, 16],  // DR:  D5, R7
  [28, 25],  // DF:  D1, F7
  [30, 43],  // DL:  D3, L7
  [34, 52],  // DB:  D7, B7
  [23, 12],  // FR:  F5, R3
  [21, 41],  // FL:  F3, L5
  [50, 39],  // BL:  B5, L3
  [48, 14],  // BR:  B3, R5
];

// The colors of each edge piece (primary color first)
const EDGE_COLORS = [
  "UR", "UF", "UL", "UB", "DR", "DF", "DL", "DB", "FR", "FL", "BL", "BR",
];

// Primary color of each edge piece (used for orientation)
const EDGE_PRIMARY = ["U", "U", "U", "U", "D", "D", "D", "D", "F", "F", "B", "B"];

// ============================================================
// Conversion function
// ============================================================

/**
 * Convert a 54-character facelet string to a CubieCube.
 * @param {string} facelets  54 characters (URFDLB order, each char ∈ {U,R,F,D,L,B})
 * @returns {CubieCube}
 * @throws {Error} if the facelets are invalid
 */
export function facelets54ToCubieCube(facelets) {
  const cube = new CubieCube();

  // --- Decode corners ---
  for (let pos = 0; pos < 8; pos++) {
    const [f0, f1, f2] = CORNER_FACELETS[pos];
    const c0 = facelets[f0]; // U/D facelet
    const c1 = facelets[f1]; // CW facelet
    const c2 = facelets[f2]; // CW facelet

    // Find which corner piece this is
    let found = false;
    for (let piece = 0; piece < 8; piece++) {
      const colors = CORNER_COLORS[piece];
      // colors[0] = U/D color, colors[1] = CW1 color, colors[2] = CW2 color

      if (c0 === colors[0] && c1 === colors[1] && c2 === colors[2]) {
        cube.cp[pos] = piece;
        cube.co[pos] = 0;
        found = true;
        break;
      } else if (c1 === colors[0] && c2 === colors[1] && c0 === colors[2]) {
        cube.cp[pos] = piece;
        cube.co[pos] = 1;
        found = true;
        break;
      } else if (c2 === colors[0] && c0 === colors[1] && c1 === colors[2]) {
        cube.cp[pos] = piece;
        cube.co[pos] = 2;
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(`Invalid corner at position ${pos}: ${c0}${c1}${c2}`);
    }
  }

  // --- Decode edges ---
  for (let pos = 0; pos < 12; pos++) {
    const [f0, f1] = EDGE_FACELETS[pos];
    const c0 = facelets[f0]; // primary facelet
    const c1 = facelets[f1]; // secondary facelet

    let found = false;
    for (let piece = 0; piece < 12; piece++) {
      const colors = EDGE_COLORS[piece];
      const primary = EDGE_PRIMARY[piece];

      if (c0 === colors[0] && c1 === colors[1]) {
        // Primary color is at the primary facelet → eo = 0
        cube.ep[pos] = piece;
        cube.eo[pos] = 0;
        found = true;
        break;
      } else if (c0 === colors[1] && c1 === colors[0]) {
        // Primary color is at the secondary facelet → eo = 1
        cube.ep[pos] = piece;
        cube.eo[pos] = 1;
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(`Invalid edge at position ${pos}: ${c0}${c1}`);
    }
  }

  return cube;
}

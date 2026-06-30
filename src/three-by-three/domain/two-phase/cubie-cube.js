// ============================================================
// cubie-cube.js — Rubik's Cube cubie-level representation
// ============================================================
// Defines the CubieCube class (corner/edge permutation + orientation)
// and all 18 standard moves as CubieCube instances.
//
// Corner numbering:
//   0:URF  1:UFL  2:ULB  3:UBR  4:DFR  5:DLF  6:DBL  7:DRB
//
// Edge numbering:
//   0:UR  1:UF  2:UL  3:UB  4:DR  5:DF  6:DL  7:DB
//   8:FR  9:FL  10:BL  11:BR
//
// Orientation:
//   Corner orientation (co): 0, 1, 2 — twist relative to U/D axis
//   Edge orientation   (eo): 0, 1    — flip relative to F/B axis
// ============================================================

export class CubieCube {
  /**
   * @param {number[]} [cp] corner permutation (8 elements)
   * @param {number[]} [co] corner orientation (8 elements, values 0-2)
   * @param {number[]} [ep] edge permutation   (12 elements)
   * @param {number[]} [eo] edge orientation   (12 elements, values 0-1)
   */
  constructor(cp, co, ep, eo) {
    this.cp = cp ? cp.slice() : [0, 1, 2, 3, 4, 5, 6, 7];
    this.co = co ? co.slice() : [0, 0, 0, 0, 0, 0, 0, 0];
    this.ep = ep ? ep.slice() : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    this.eo = eo ? eo.slice() : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  }

  clone() {
    return new CubieCube(this.cp, this.co, this.ep, this.eo);
  }

  /**
   * Permutation multiplication: this × other.
   * Physically: first apply `this` state, then apply `other` move.
   * @param {CubieCube} other
   * @returns {CubieCube} new cube = this × other
   */
  multiply(other) {
    const rCp = new Array(8);
    const rCo = new Array(8);
    const rEp = new Array(12);
    const rEo = new Array(12);

    for (let i = 0; i < 8; i++) {
      rCp[i] = this.cp[other.cp[i]];
      rCo[i] = (this.co[other.cp[i]] + other.co[i]) % 3;
    }
    for (let i = 0; i < 12; i++) {
      rEp[i] = this.ep[other.ep[i]];
      rEo[i] = (this.eo[other.ep[i]] + other.eo[i]) % 2;
    }

    return new CubieCube(rCp, rCo, rEp, rEo);
  }

  /**
   * In-place multiply: this = this × other.
   * @param {CubieCube} other
   */
  multiplyInPlace(other) {
    const tmp = this.multiply(other);
    this.cp = tmp.cp;
    this.co = tmp.co;
    this.ep = tmp.ep;
    this.eo = tmp.eo;
  }

  /** Check if this cube is in the solved (identity) state. */
  isIdentity() {
    for (let i = 0; i < 8; i++) {
      if (this.cp[i] !== i || this.co[i] !== 0) return false;
    }
    for (let i = 0; i < 12; i++) {
      if (this.ep[i] !== i || this.eo[i] !== 0) return false;
    }
    return true;
  }
}

// ============================================================
// The 6 basic face moves (clockwise quarter turn)
// ============================================================
// Each move is defined by its effect on the SOLVED cube:
//   cp[i] = which corner PIECE is at position i after the move
//   co[i] = orientation change of the piece now at position i
//   ep[i] = which edge PIECE is at position i after the move
//   eo[i] = orientation change of the edge now at position i
// ============================================================

/** U move — clockwise rotation of the U face (viewed from above) */
const MOVE_U = new CubieCube(
  [3, 0, 1, 2, 4, 5, 6, 7],           // cp: UBR→URF, URF→UFL, UFL→ULB, ULB→UBR
  [0, 0, 0, 0, 0, 0, 0, 0],           // co: no twist
  [3, 0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11], // ep: UB→UR, UR→UF, UF→UL, UL→UB
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]   // eo: no flip
);

/** R move — clockwise rotation of the R face (viewed from the right) */
const MOVE_R = new CubieCube(
  [4, 1, 2, 0, 7, 5, 6, 3],           // cp: DFR→URF, URF→UBR, UBR→DRB, DRB→DFR
  [2, 0, 0, 1, 1, 0, 0, 2],           // co: twisted
  [8, 1, 2, 3, 11, 5, 6, 7, 4, 9, 10, 0], // ep: FR→UR, UR→BR, BR→DR, DR→FR
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]   // eo: no flip
);

/** F move — clockwise rotation of the F face (viewed from the front) */
const MOVE_F = new CubieCube(
  [1, 5, 2, 3, 0, 4, 6, 7],           // cp: UFL→URF, DLF→UFL, DFR→DLF, URF→DFR
  [1, 2, 0, 0, 2, 1, 0, 0],           // co: twisted
  [0, 9, 2, 3, 4, 8, 6, 7, 1, 5, 10, 11], // ep: FL→UF, UF→FR, FR→DF, DF→FL
  [0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0]   // eo: F flips involved edges
);

/** D move — clockwise rotation of the D face (viewed from below) */
const MOVE_D = new CubieCube(
  [0, 1, 2, 3, 5, 6, 7, 4],           // cp: DLF→DFR, DBL→DLF, DRB→DBL, DFR→DRB
  [0, 0, 0, 0, 0, 0, 0, 0],           // co: no twist
  [0, 1, 2, 3, 5, 6, 7, 4, 8, 9, 10, 11], // ep: DF→DR, DL→DF, DB→DL, DR→DB
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]   // eo: no flip
);

/** L move — clockwise rotation of the L face (viewed from the left) */
const MOVE_L = new CubieCube(
  [0, 2, 6, 3, 4, 1, 5, 7],           // cp: ULB→UFL, DBL→ULB, DLF→DBL, UFL→DLF
  [0, 1, 2, 0, 0, 2, 1, 0],           // co: twisted
  [0, 1, 10, 3, 4, 5, 9, 7, 8, 2, 6, 11], // ep: BL→UL, UL→FL, FL→DL, DL→BL
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]   // eo: no flip
);

/** B move — clockwise rotation of the B face (viewed from the back) */
const MOVE_B = new CubieCube(
  [0, 1, 3, 7, 4, 5, 2, 6],           // cp: UBR→ULB, DRB→UBR, DBL→DRB, ULB→DBL
  [0, 0, 1, 2, 0, 0, 2, 1],           // co: twisted
  [0, 1, 2, 11, 4, 5, 6, 10, 8, 9, 3, 7], // ep: BR→UB, UB→BL, BL→DB, DB→BR
  [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1]   // eo: B flips involved edges
);

// ============================================================
// Generate all 18 moves: 6 faces × 3 turns (CW, 180°, CCW)
// ============================================================
// Index scheme:  face * 3 + turn
//   face: 0=U, 1=R, 2=F, 3=D, 4=L, 5=B
//   turn: 0=CW(90°), 1=180°, 2=CCW(270°)
// ============================================================

const BASIC_MOVES = [MOVE_U, MOVE_R, MOVE_F, MOVE_D, MOVE_L, MOVE_B];

/** All 18 moves as CubieCube instances. */
export const MOVE_CUBES = new Array(18);

for (let face = 0; face < 6; face++) {
  const base = BASIC_MOVES[face];
  // CW (1× base)
  MOVE_CUBES[face * 3] = base;
  // 180° (2× base = base × base)
  MOVE_CUBES[face * 3 + 1] = base.multiply(base);
  // CCW (3× base = base × base × base)
  MOVE_CUBES[face * 3 + 2] = base.multiply(base).multiply(base);
}

/** Human-readable move names indexed same as MOVE_CUBES. */
export const MOVE_NAMES = [
  "U", "U2", "U'",
  "R", "R2", "R'",
  "F", "F2", "F'",
  "D", "D2", "D'",
  "L", "L2", "L'",
  "B", "B2", "B'",
];

/**
 * Phase 2 allowed moves (indices into the 18-move array).
 * Only U, U2, U', D, D2, D', and double turns of R, L, F, B.
 */
export const PHASE2_MOVES = [
  0, 1, 2,     // U, U2, U'
  9, 10, 11,   // D, D2, D'
  4,            // R2
  13,           // L2
  7,            // F2
  16,           // B2
];

export const PHASE2_MOVE_COUNT = PHASE2_MOVES.length; // 10

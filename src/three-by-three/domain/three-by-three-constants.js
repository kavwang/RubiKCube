export const FACE_ORDER = ["U", "R", "F", "D", "L", "B"];

export const FACE_COLORS = {
  U: "#ffffff",
  D: "#ffea00",
  F: "#00e676",
  B: "#2979ff",
  R: "#e63946",
  L: "#ff6d00"
};

export const FACE_INDEX = {
  U: 0,
  R: 9,
  F: 18,
  D: 27,
  L: 36,
  B: 45
};

export const LAYER = 1;
export const SPACING = 1.02;

export const MOVE_TOKENS = [
  "U", "U2", "U'",
  "R", "R2", "R'",
  "F", "F2", "F'",
  "D", "D2", "D'",
  "L", "L2", "L'",
  "B", "B2", "B'"
];

export const LAST_LAYER_EDGE_ORIENT = ["B", "R", "D", "R'", "D'", "B'"];
export const LAST_LAYER_EDGE_ORIENT_INV = ["B", "D", "R", "D'", "R'", "B'"];

export const LAST_LAYER_CORNER_ORIENT_A = ["R", "D", "R'", "D", "R", "D2", "R'"];
export const LAST_LAYER_CORNER_ORIENT_B = ["R", "D2", "R'", "D'", "R", "D'", "R'"];
export const LAST_LAYER_CORNER_T_PERM = ["R'", "D'", "R", "D", "R", "F'", "R2", "D", "R", "D", "R'", "D'", "R", "F"];
export const LAST_LAYER_CORNER_Y_PERM = ["F'", "R'", "D", "R", "D", "R'", "D'", "R", "F", "R'", "D'", "R", "D", "R", "F'", "R'", "F"];

export const LAST_LAYER_EDGE_PLL = ["B2", "D", "L", "R'", "B2", "L'", "R", "D", "B2"];
export const LAST_LAYER_EDGE_PLL_INV = ["B2", "D'", "R'", "L", "B2", "R", "L'", "D'", "B2"];

const idx = (face, row, col) => FACE_INDEX[face] + row * 3 + col;

export const CORNER_SLOTS = [
  [idx("U", 2, 2), idx("F", 0, 2), idx("R", 0, 0)],
  [idx("U", 0, 2), idx("R", 0, 2), idx("B", 0, 0)],
  [idx("U", 0, 0), idx("B", 0, 2), idx("L", 0, 0)],
  [idx("U", 2, 0), idx("L", 0, 2), idx("F", 0, 0)],
  [idx("D", 0, 2), idx("F", 2, 2), idx("R", 2, 0)],
  [idx("D", 2, 2), idx("R", 2, 2), idx("B", 2, 0)],
  [idx("D", 2, 0), idx("B", 2, 2), idx("L", 2, 0)],
  [idx("D", 0, 0), idx("L", 2, 2), idx("F", 2, 0)]
];

export const CORNER_SLOT_SIDE_FACES = [
  ["F", "R"],
  ["R", "B"],
  ["B", "L"],
  ["L", "F"]
];

export const BRING_DOWN_MOVES = {
  1: ["R'", "D'", "R"],
  2: ["B'", "D'", "B"],
  3: ["L'", "D'", "L"],
  4: ["F'", "D'", "F"]
};

export const LBL_TARGETS = {
  firstLayerEdges: [
    [idx("U", 2, 1), idx("F", 0, 1)],
    [idx("U", 1, 2), idx("R", 0, 1)],
    [idx("U", 0, 1), idx("B", 0, 1)],
    [idx("U", 1, 0), idx("L", 0, 1)]
  ],
  firstLayerCorners: CORNER_SLOTS.slice(0, 4),
  secondLayerEdges: [
    [idx("F", 1, 2), idx("R", 1, 0)],
    [idx("R", 1, 2), idx("B", 1, 0)],
    [idx("B", 1, 2), idx("L", 1, 0)],
    [idx("L", 1, 2), idx("F", 1, 0)]
  ],
  lastLayerEdgeOrientation: [idx("D", 0, 1), idx("D", 1, 0), idx("D", 1, 2), idx("D", 2, 1)],
  lastLayerCornerOrientation: [idx("D", 0, 0), idx("D", 0, 2), idx("D", 2, 0), idx("D", 2, 2)],
  lastLayerCornerPermutation: [
    idx("F", 2, 0), idx("F", 2, 2),
    idx("R", 2, 0), idx("R", 2, 2),
    idx("B", 2, 0), idx("B", 2, 2),
    idx("L", 2, 0), idx("L", 2, 2)
  ]
};

export const F2L_MACROS = [
  { id: "D", moves: ["D"] },
  { id: "D2", moves: ["D2"] },
  { id: "D'", moves: ["D'"] },
  { id: "FR_R", moves: ["D'", "R'", "D", "R", "D", "F", "D'", "F'"] },
  { id: "FR_L", moves: ["D", "F", "D'", "F'", "D'", "R'", "D", "R"] },
  { id: "RB_R", moves: ["D'", "B'", "D", "B", "D", "R", "D'", "R'"] },
  { id: "RB_L", moves: ["D", "R", "D'", "R'", "D'", "B'", "D", "B"] },
  { id: "BL_R", moves: ["D'", "L'", "D", "L", "D", "B", "D'", "B'"] },
  { id: "BL_L", moves: ["D", "B", "D'", "B'", "D'", "L'", "D", "L"] },
  { id: "LF_R", moves: ["D'", "F'", "D", "F", "D", "L", "D'", "L'"] },
  { id: "LF_L", moves: ["D", "L", "D'", "L'", "D'", "F'", "D", "F"] }
];


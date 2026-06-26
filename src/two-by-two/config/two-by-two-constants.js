export const FACE_STYLE = {
  U: { name: "白", color: "#ffffff" },
  R: { name: "紅", color: "#e63946" },
  F: { name: "綠", color: "#00e676" },
  D: { name: "黃", color: "#ffea00" },
  L: { name: "橘", color: "#ff6d00" },
  B: { name: "藍", color: "#2979ff" }
};

export const FACE_ORDER = ["U", "R", "F", "D", "L", "B"];
export const MOVE_FACE = ["U", "R", "F", "D", "L", "B"];
export const MOVE_SUFFIX = ["", "2", "'"];
export const OPPOSITE_FACE = [3, 4, 5, 0, 1, 2];

export const CORNERS = ["URF", "UFL", "ULB", "UBR", "DFR", "DLF", "DBL", "DRB"];
export const POS_FACES = {
  URF: ["U", "R", "F"],
  UFL: ["U", "F", "L"],
  ULB: ["U", "L", "B"],
  UBR: ["U", "B", "R"],
  DFR: ["D", "F", "R"],
  DLF: ["D", "L", "F"],
  DBL: ["D", "B", "L"],
  DRB: ["D", "R", "B"]
};

export const PIECE_COLORS = CORNERS.map((c) => POS_FACES[c]);

export const CP_MOVE = [
  [3, 0, 1, 2, 4, 5, 6, 7],
  [4, 1, 2, 0, 7, 5, 6, 3],
  [1, 5, 2, 3, 0, 4, 6, 7],
  [0, 1, 2, 3, 5, 6, 7, 4],
  [0, 2, 6, 3, 4, 1, 5, 7],
  [0, 1, 3, 7, 4, 5, 2, 6]
];

export const CO_MOVE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [2, 0, 0, 1, 1, 0, 0, 2],
  [1, 2, 0, 0, 2, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 2, 0, 0, 2, 1, 0],
  [0, 0, 1, 2, 0, 0, 2, 1]
];

export const FACT = [1, 1, 2, 6, 24, 120, 720, 5040, 40320];

export const LAYER_COORD = 0.5;

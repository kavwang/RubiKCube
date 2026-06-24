import {
  CORNERS,
  FACE_ORDER,
  FACE_STYLE,
  PIECE_COLORS,
  POS_FACES
} from "../config/two-by-two-constants.js";

export function rotateCornerColors(colors, ori) {
  if (ori === 0) return [colors[0], colors[1], colors[2]];
  if (ori === 1) return [colors[2], colors[0], colors[1]];
  return [colors[1], colors[2], colors[0]];
}

function eq3(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

export function makeSolvedStickerState() {
  const state = new Map();
  for (const corner of CORNERS) {
    for (const face of POS_FACES[corner]) {
      state.set(`${corner}_${face}`, face);
    }
  }
  return state;
}

export function cubieToStickerState(cp, co) {
  const state = new Map();
  for (let pos = 0; pos < 8; pos += 1) {
    const corner = CORNERS[pos];
    const faces = POS_FACES[corner];
    const colors = rotateCornerColors(PIECE_COLORS[cp[pos]], co[pos]);
    for (let i = 0; i < 3; i += 1) {
      state.set(`${corner}_${faces[i]}`, colors[i]);
    }
  }
  return state;
}

export function decodeCubeFromStickers(stickerState) {
  const counts = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 };
  for (const value of stickerState.values()) {
    if (!value) return { ok: false, message: "有貼紙尚未上色，請先填滿 24 個格子。" };
    counts[value] += 1;
  }

  for (const f of FACE_ORDER) {
    if (counts[f] !== 4) {
      return { ok: false, message: `${FACE_STYLE[f].name}色數量不是 4（目前 ${counts[f]}），請修正後再試。` };
    }
  }

  const cp = new Array(8).fill(-1);
  const co = new Array(8).fill(0);
  const usedPieces = new Set();

  for (let pos = 0; pos < 8; pos += 1) {
    const corner = CORNERS[pos];
    const faces = POS_FACES[corner];
    const obs = faces.map((face) => stickerState.get(`${corner}_${face}`));

    let found = false;
    for (let piece = 0; piece < 8 && !found; piece += 1) {
      for (let ori = 0; ori < 3 && !found; ori += 1) {
        if (eq3(rotateCornerColors(PIECE_COLORS[piece], ori), obs)) {
          cp[pos] = piece;
          co[pos] = ori;
          found = true;
        }
      }
    }

    if (!found) return { ok: false, message: `角塊 ${corner} 顏色組合不合法，請確認輸入。` };
    if (usedPieces.has(cp[pos])) return { ok: false, message: "偵測到重複角塊，顏色配置不可能出現在正常魔方。" };
    usedPieces.add(cp[pos]);
  }

  const twistSum = co.reduce((a, b) => a + b, 0) % 3;
  if (twistSum !== 0) return { ok: false, message: "角塊方向總和不合法，請重新檢查顏色輸入。" };

  return { ok: true, cp, co };
}

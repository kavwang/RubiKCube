import {
  CO_MOVE,
  CP_MOVE,
  FACT,
  MOVE_FACE,
  MOVE_SUFFIX
} from "../config/two-by-two-constants.js";

export function applyMoveCP(cp, mv) {
  const out = new Array(8);
  for (let i = 0; i < 8; i += 1) out[i] = cp[CP_MOVE[mv][i]];
  return out;
}

export function applyMoveCO(co, mv) {
  const out = new Array(8);
  for (let i = 0; i < 8; i += 1) {
    const j = CP_MOVE[mv][i];
    out[i] = (co[j] + CO_MOVE[mv][i]) % 3;
  }
  return out;
}

export function applyMoveCPMulti(cp, face, turns) {
  let out = cp;
  for (let i = 0; i < turns; i += 1) out = applyMoveCP(out, face);
  return out;
}

export function applyMoveCOMulti(co, face, turns) {
  let out = co;
  for (let i = 0; i < turns; i += 1) out = applyMoveCO(out, face);
  return out;
}

export function encodeOri(co) {
  let idx = 0;
  for (let i = 0; i < 7; i += 1) idx = idx * 3 + co[i];
  return idx;
}

export function decodeOri(idx) {
  const co = new Array(8).fill(0);
  let sum = 0;
  for (let i = 6; i >= 0; i -= 1) {
    co[i] = idx % 3;
    sum += co[i];
    idx = Math.floor(idx / 3);
  }
  co[7] = (3 - (sum % 3)) % 3;
  return co;
}

export function encodePerm(cp) {
  let idx = 0;
  for (let i = 0; i < 7; i += 1) {
    let smaller = 0;
    for (let j = i + 1; j < 8; j += 1) {
      if (cp[j] < cp[i]) smaller += 1;
    }
    idx += smaller * FACT[7 - i];
  }
  return idx;
}

export function decodePerm(idx) {
  const arr = new Array(8).fill(0);
  const temp = [0, 1, 2, 3, 4, 5, 6, 7];
  for (let i = 0; i < 8; i += 1) {
    const f = FACT[7 - i];
    const pos = Math.floor(idx / f);
    idx %= f;
    arr[i] = temp.splice(pos, 1)[0];
  }
  return arr;
}

export function moveToText(moveId) {
  const face = MOVE_FACE[Math.floor(moveId / 3)];
  const suffix = MOVE_SUFFIX[moveId % 3];
  return `${face}${suffix}`;
}

export function describeMove(moveId) {
  const face = MOVE_FACE[Math.floor(moveId / 3)];
  const t = moveId % 3;
  const faceName = { U: "上層", R: "右層", F: "前層", D: "下層", L: "左層", B: "後層" }[face];
  const turnText = t === 0 ? "順時針 90°" : t === 1 ? "180°" : "逆時針 90°";
  return `${moveToText(moveId)}：轉 ${faceName} ${turnText}`;
}

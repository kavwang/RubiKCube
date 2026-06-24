import { FACE_INDEX, FACE_ORDER, MOVE_TOKENS } from "./three-by-three-constants.js";

function solvedFacelets() {
  const out = new Array(54);
  for (const face of FACE_ORDER) {
    const off = FACE_INDEX[face];
    for (let i = 0; i < 9; i += 1) out[off + i] = face;
  }
  return out;
}

function identityPerm(n) {
  const p = new Array(n);
  for (let i = 0; i < n; i += 1) p[i] = i;
  return p;
}

function composePerm(a, b) {
  const out = new Array(a.length);
  for (let i = 0; i < a.length; i += 1) out[i] = a[b[i]];
  return out;
}

function applyPerm(state, perm) {
  const out = new Array(54);
  for (let i = 0; i < 54; i += 1) out[i] = state[perm[i]];
  return out;
}

function faceletKey(def) {
  return `${def.pos[0]},${def.pos[1]},${def.pos[2]}|${def.normal[0]},${def.normal[1]},${def.normal[2]}`;
}

function rotateVec([x, y, z], axis, sign) {
  if (axis === "x") return sign > 0 ? [x, -z, y] : [x, z, -y];
  if (axis === "y") return sign > 0 ? [z, y, -x] : [-z, y, x];
  return sign > 0 ? [-y, x, z] : [y, -x, z];
}

function rotateStickerForFace(def, face) {
  const [x, y, z] = def.pos;
  const [nx, ny, nz] = def.normal;

  const affected =
    (face === "U" && y === 1) ||
    (face === "D" && y === -1) ||
    (face === "R" && x === 1) ||
    (face === "L" && x === -1) ||
    (face === "F" && z === 1) ||
    (face === "B" && z === -1);

  if (!affected) return { pos: [x, y, z], normal: [nx, ny, nz] };

  const map = {
    U: { axis: "y", sign: -1 },
    D: { axis: "y", sign: 1 },
    R: { axis: "x", sign: -1 },
    L: { axis: "x", sign: 1 },
    F: { axis: "z", sign: -1 },
    B: { axis: "z", sign: 1 }
  }[face];

  return {
    pos: rotateVec([x, y, z], map.axis, map.sign),
    normal: rotateVec([nx, ny, nz], map.axis, map.sign)
  };
}

function buildFaceletDefs() {
  const defs = [];
  for (const face of FACE_ORDER) {
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        let x = 0;
        let y = 0;
        let z = 0;
        let nx = 0;
        let ny = 0;
        let nz = 0;

        if (face === "U") {
          x = col - 1;
          y = 1;
          z = row - 1;
          ny = 1;
        } else if (face === "R") {
          x = 1;
          y = 1 - row;
          z = 1 - col;
          nx = 1;
        } else if (face === "F") {
          x = col - 1;
          y = 1 - row;
          z = 1;
          nz = 1;
        } else if (face === "D") {
          x = col - 1;
          y = -1;
          z = 1 - row;
          ny = -1;
        } else if (face === "L") {
          x = -1;
          y = 1 - row;
          z = col - 1;
          nx = -1;
        } else {
          x = 1 - col;
          y = 1 - row;
          z = -1;
          nz = -1;
        }

        defs.push({ pos: [x, y, z], normal: [nx, ny, nz] });
      }
    }
  }
  return defs;
}

function buildQuarterPerm(face, faceletDefs, faceletIndexByKey) {
  const perm = new Array(54);
  for (let src = 0; src < 54; src += 1) {
    const moved = rotateStickerForFace(faceletDefs[src], face);
    const dest = faceletIndexByKey.get(faceletKey(moved));
    perm[dest] = src;
  }
  return perm;
}

function moveFromToken(token) {
  const face = token[0];
  const quarterTurns = token.endsWith("2") ? 2 : token.endsWith("'") ? 3 : 1;
  return { face, quarterTurns };
}

function buildMovePerm(token, quarterPermByFace) {
  const { face, quarterTurns } = moveFromToken(token);
  let perm = identityPerm(54);
  const quarter = quarterPermByFace[face];
  for (let i = 0; i < quarterTurns; i += 1) {
    perm = composePerm(perm, quarter);
  }
  return perm;
}

export function createCubeEngine() {
  const faceletDefs = buildFaceletDefs();
  const faceletIndexByKey = new Map();
  faceletDefs.forEach((d, i) => faceletIndexByKey.set(faceletKey(d), i));

  const quarterPermByFace = {
    U: buildQuarterPerm("U", faceletDefs, faceletIndexByKey),
    R: buildQuarterPerm("R", faceletDefs, faceletIndexByKey),
    F: buildQuarterPerm("F", faceletDefs, faceletIndexByKey),
    D: buildQuarterPerm("D", faceletDefs, faceletIndexByKey),
    L: buildQuarterPerm("L", faceletDefs, faceletIndexByKey),
    B: buildQuarterPerm("B", faceletDefs, faceletIndexByKey)
  };

  const SOLVED_FACELETS = solvedFacelets();
  const MOVE_DEFS = MOVE_TOKENS.map((token) => ({
    token,
    face: token[0],
    perm: buildMovePerm(token, quarterPermByFace)
  }));
  const MOVE_DEF_BY_TOKEN = new Map(MOVE_DEFS.map((m) => [m.token, m]));
  const MOVE_DEFS_NO_U = MOVE_DEFS.filter((m) => m.face !== "U");

  function applyMoveToken(state, token) {
    const def = MOVE_DEF_BY_TOKEN.get(token);
    return applyPerm(state, def.perm);
  }

  function applyMoveDef(state, def) {
    return applyPerm(state, def.perm);
  }

  function applyMoveTokens(state, tokens) {
    let out = state;
    for (const token of tokens) out = applyMoveToken(out, token);
    return out;
  }

  function applyMoveDefs(state, defs) {
    let out = state;
    for (const d of defs) out = applyMoveDef(out, d);
    return out;
  }

  function isCubeSolved(state) {
    for (let i = 0; i < 54; i += 1) {
      if (state[i] !== SOLVED_FACELETS[i]) return false;
    }
    return true;
  }

  function applyMovesToSolvedFacelets(moves) {
    let state = SOLVED_FACELETS.slice();
    for (const move of moves) state = applyMoveToken(state, move);
    return state;
  }

  function parseMoves(text) {
    const trimmed = text.trim();
    if (!trimmed) return { ok: true, moves: [] };

    const tokens = trimmed.split(/\s+/).filter(Boolean);
    const out = [];
    for (const token of tokens) {
      if (!/^[URFDLB](2|'|)$/.test(token)) {
        return {
          ok: false,
          message: `不支援的步驟記號：${token}（僅支援 U R F D L B + 2 或 '）`
        };
      }
      out.push(token);
    }
    return { ok: true, moves: out };
  }

  function makeRandomScramble(length = 20) {
    const suffixes = ["", "2", "'"];
    const out = [];
    let last = "";
    for (let i = 0; i < length; i += 1) {
      let face = FACE_ORDER[Math.floor(Math.random() * FACE_ORDER.length)];
      while (face === last) {
        face = FACE_ORDER[Math.floor(Math.random() * FACE_ORDER.length)];
      }
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      out.push(`${face}${suffix}`);
      last = face;
    }
    return out.join(" ");
  }

  function describeMove(move) {
    const face = move[0];
    const faceName = {
      U: "上層",
      R: "右層",
      F: "前層",
      D: "下層",
      L: "左層",
      B: "後層"
    }[face];
    let turnText = "順時針 90°";
    if (move.endsWith("2")) turnText = "180°";
    else if (move.endsWith("'")) turnText = "逆時針 90°";
    return `${move}（${faceName} ${turnText}）`;
  }

  return {
    FACE_ORDER,
    SOLVED_FACELETS,
    MOVE_TOKENS,
    MOVE_DEFS,
    MOVE_DEFS_NO_U,
    applyMoveToken,
    applyMoveDef,
    applyMoveTokens,
    applyMoveDefs,
    applyMovesToSolvedFacelets,
    isCubeSolved,
    parseMoves,
    makeRandomScramble,
    describeMove
  };
}


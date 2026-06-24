import {
  BRING_DOWN_MOVES,
  CORNER_SLOT_SIDE_FACES,
  CORNER_SLOTS,
  F2L_MACROS,
  LAST_LAYER_CORNER_ORIENT_A,
  LAST_LAYER_CORNER_ORIENT_B,
  LAST_LAYER_CORNER_T_PERM,
  LAST_LAYER_CORNER_Y_PERM,
  LAST_LAYER_EDGE_ORIENT,
  LAST_LAYER_EDGE_ORIENT_INV,
  LAST_LAYER_EDGE_PLL,
  LAST_LAYER_EDGE_PLL_INV,
  LBL_TARGETS
} from "./three-by-three-constants.js";

function findCornerPieceSlot(state, targetColors) {
  for (let slotIdx = 0; slotIdx < CORNER_SLOTS.length; slotIdx += 1) {
    const slotIndices = CORNER_SLOTS[slotIdx];
    const slotColors = new Set(slotIndices.map((index) => state[index]));
    let match = true;
    for (const color of targetColors) {
      if (!slotColors.has(color)) {
        match = false;
        break;
      }
    }
    if (match) return slotIdx + 1;
  }
  return -1;
}

function solveCrossEdgeBFS(startState, target, locked, engine) {
  const indices = [...target, ...locked];
  const isGoal = (state) => indices.every((i) => state[i] === engine.SOLVED_FACELETS[i]);
  if (isGoal(startState)) return { ok: true, moves: [] };

  const allowedTokens = engine.MOVE_TOKENS.filter((token) => !token.startsWith("U"));
  const queue = [{ state: startState, moves: [] }];
  const seen = new Set([startState.join("")]);
  let head = 0;

  while (head < queue.length) {
    const { state, moves } = queue[head];
    head += 1;

    if (moves.length >= 5) continue;
    const lastFace = moves.length ? moves[moves.length - 1][0] : "";

    for (const token of allowedTokens) {
      if (token[0] === lastFace) continue;
      const nextState = engine.applyMoveToken(state, token);
      const nextMoves = [...moves, token];

      if (isGoal(nextState)) return { ok: true, moves: nextMoves };

      const key = nextState.join("");
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ state: nextState, moves: nextMoves });
    }
  }

  return { ok: false, moves: [] };
}

function solveCornerBFS(startState, target, locked, allowedFaces, engine) {
  const indices = [...target, ...locked];
  const isGoal = (state) => indices.every((i) => state[i] === engine.SOLVED_FACELETS[i]);
  if (isGoal(startState)) return { ok: true, moves: [] };

  const allowedTokens = engine.MOVE_TOKENS.filter((token) => allowedFaces.includes(token[0]));
  const queue = [{ state: startState, moves: [] }];
  const seen = new Set([startState.join("")]);
  let head = 0;

  while (head < queue.length) {
    const { state, moves } = queue[head];
    head += 1;

    if (moves.length >= 6) continue;
    const lastFace = moves.length ? moves[moves.length - 1][0] : "";

    for (const token of allowedTokens) {
      if (token[0] === lastFace) continue;
      const nextState = engine.applyMoveToken(state, token);
      const nextMoves = [...moves, token];

      if (isGoal(nextState)) return { ok: true, moves: nextMoves };

      const key = nextState.join("");
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ state: nextState, moves: nextMoves });
    }
  }

  return { ok: false, moves: [] };
}

function solvePhase2BFS(startState, target, locked, engine) {
  const indices = [...target, ...locked];
  const isGoal = (state) => indices.every((i) => state[i] === engine.SOLVED_FACELETS[i]);
  if (isGoal(startState)) return { ok: true, moves: [] };

  const queue = [{ state: startState, moves: [], macroSeq: [] }];
  const seen = new Set([startState.join("")]);
  let head = 0;

  while (head < queue.length) {
    const { state, moves, macroSeq } = queue[head];
    head += 1;

    if (macroSeq.length >= 3) continue;
    const lastMacro = macroSeq.length ? macroSeq[macroSeq.length - 1] : "";

    for (const macro of F2L_MACROS) {
      if (macro.id === lastMacro) continue;

      const nextState = engine.applyMoveTokens(state, macro.moves);
      const nextMoves = [...moves, ...macro.moves];
      const nextMacroSeq = [...macroSeq, macro.id];

      if (isGoal(nextState)) return { ok: true, moves: nextMoves };

      const key = nextState.join("");
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ state: nextState, moves: nextMoves, macroSeq: nextMacroSeq });
    }
  }

  return { ok: false, moves: [] };
}

function solveWithMacros(startState, macros, goalFn, maxDepth, engine) {
  if (goalFn(startState)) return { ok: true, state: startState, moves: [] };

  const queue = [{ state: startState, moves: [], depth: 0 }];
  const seen = new Set([startState.join("")]);
  let head = 0;

  while (head < queue.length) {
    const { state, moves, depth } = queue[head];
    head += 1;

    if (depth >= maxDepth) continue;

    for (const macro of macros) {
      const nextState = engine.applyMoveTokens(state, macro.moves);
      const nextMoves = [...moves, ...macro.moves];

      if (goalFn(nextState)) return { ok: true, state: nextState, moves: nextMoves };

      const key = nextState.join("");
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ state: nextState, moves: nextMoves, depth: depth + 1 });
    }
  }

  return { ok: false, state: startState, moves: [] };
}

export function solveLblPlan(scrambleState, engine) {
  let state = scrambleState;
  const moves = [];
  const phases = [];
  const locked = new Set();

  const crossStart = moves.length;
  for (let i = 0; i < LBL_TARGETS.firstLayerEdges.length; i += 1) {
    const target = LBL_TARGETS.firstLayerEdges[i];
    const result = solveCrossEdgeBFS(state, target, [...locked], engine);
    if (!result.ok) {
      return { ok: false, message: `LBL 第一層十字第 ${i + 1} 塊失敗，請換一組打亂再試。` };
    }
    state = engine.applyMoveTokens(state, result.moves);
    moves.push(...result.moves);
    for (const idx of target) locked.add(idx);
  }
  if (moves.length > crossStart) {
    phases.push({ name: "第一層：白色十字", startIdx: crossStart, endIdx: moves.length });
  }

  const cornersStart = moves.length;
  for (let i = 0; i < LBL_TARGETS.firstLayerCorners.length; i += 1) {
    const target = LBL_TARGETS.firstLayerCorners[i];
    const targetColors = new Set(target.map((idx) => engine.SOLVED_FACELETS[idx]));
    const slot = findCornerPieceSlot(state, targetColors);
    if (slot === -1) {
      return { ok: false, message: `第一層角塊第 ${i + 1} 塊找不到。` };
    }

    const targetSlot = i + 1;
    if (slot <= 4 && slot !== targetSlot) {
      const preMoves = BRING_DOWN_MOVES[slot];
      state = engine.applyMoveTokens(state, preMoves);
      moves.push(...preMoves);
    }

    const allowedFaces = [...CORNER_SLOT_SIDE_FACES[i], "D"];
    const result = solveCornerBFS(state, target, [...locked], allowedFaces, engine);
    if (!result.ok) {
      return { ok: false, message: `LBL 第一層角塊第 ${i + 1} 塊失敗，請換一組打亂再試。` };
    }
    state = engine.applyMoveTokens(state, result.moves);
    moves.push(...result.moves);
    for (const idx of target) locked.add(idx);
  }
  if (moves.length > cornersStart) {
    phases.push({ name: "第一層：白色角塊", startIdx: cornersStart, endIdx: moves.length });
  }

  const middleStart = moves.length;
  for (let i = 0; i < LBL_TARGETS.secondLayerEdges.length; i += 1) {
    const target = LBL_TARGETS.secondLayerEdges[i];
    const result = solvePhase2BFS(state, target, [...locked], engine);
    if (!result.ok) {
      return { ok: false, message: `LBL 第二層稜塊第 ${i + 1} 塊失敗，請換一組打亂再試。` };
    }
    state = engine.applyMoveTokens(state, result.moves);
    moves.push(...result.moves);
    for (const idx of target) locked.add(idx);
  }
  if (moves.length > middleStart) {
    phases.push({ name: "第二層：中層稜塊", startIdx: middleStart, endIdx: moves.length });
  }

  const eoStart = moves.length;
  const eoGoalIndices = [...locked, ...LBL_TARGETS.lastLayerEdgeOrientation];
  const eoGoal = (s) => eoGoalIndices.every((idx) => s[idx] === engine.SOLVED_FACELETS[idx]);
  const eoMacros = [
    { id: "D", moves: ["D"] },
    { id: "D2", moves: ["D2"] },
    { id: "D'", moves: ["D'"] },
    { id: "EO", moves: LAST_LAYER_EDGE_ORIENT },
    { id: "EO_INV", moves: LAST_LAYER_EDGE_ORIENT_INV }
  ];
  const eoResult = solveWithMacros(state, eoMacros, eoGoal, 4, engine);
  if (!eoResult.ok) {
    return { ok: false, message: "LBL 第三層黃十字定向失敗，請換一組打亂再試。" };
  }
  state = eoResult.state;
  moves.push(...eoResult.moves);
  for (const idx of LBL_TARGETS.lastLayerEdgeOrientation) locked.add(idx);
  if (moves.length > eoStart) {
    phases.push({ name: "第三層：黃十字定向", startIdx: eoStart, endIdx: moves.length });
  }

  const coStart = moves.length;
  const coGoalIndices = [...locked, ...LBL_TARGETS.lastLayerCornerOrientation];
  const coGoal = (s) => coGoalIndices.every((idx) => s[idx] === engine.SOLVED_FACELETS[idx]);
  const coMacros = [
    { id: "D", moves: ["D"] },
    { id: "D2", moves: ["D2"] },
    { id: "D'", moves: ["D'"] },
    { id: "CO_A", moves: LAST_LAYER_CORNER_ORIENT_A },
    { id: "CO_B", moves: LAST_LAYER_CORNER_ORIENT_B }
  ];
  const coResult = solveWithMacros(state, coMacros, coGoal, 4, engine);
  if (!coResult.ok) {
    return { ok: false, message: "LBL 第三層黃角定向失敗，請換一組打亂再試。" };
  }
  state = coResult.state;
  moves.push(...coResult.moves);
  for (const idx of LBL_TARGETS.lastLayerCornerOrientation) locked.add(idx);
  if (moves.length > coStart) {
    phases.push({ name: "第三層：黃角定向", startIdx: coStart, endIdx: moves.length });
  }

  const cpStart = moves.length;
  const cpGoalIndices = [...locked, ...LBL_TARGETS.lastLayerCornerPermutation];
  const cpGoal = (s) => cpGoalIndices.every((idx) => s[idx] === engine.SOLVED_FACELETS[idx]);
  const cpMacros = [
    { id: "D", moves: ["D"] },
    { id: "D2", moves: ["D2"] },
    { id: "D'", moves: ["D'"] },
    { id: "CP_T", moves: LAST_LAYER_CORNER_T_PERM },
    { id: "CP_Y", moves: LAST_LAYER_CORNER_Y_PERM }
  ];
  const cpResult = solveWithMacros(state, cpMacros, cpGoal, 4, engine);
  if (!cpResult.ok) {
    return { ok: false, message: "LBL 第三層頂角置換失敗，請換一組打亂再試。" };
  }
  state = cpResult.state;
  moves.push(...cpResult.moves);
  for (const idx of LBL_TARGETS.lastLayerCornerPermutation) locked.add(idx);
  if (moves.length > cpStart) {
    phases.push({ name: "第三層：頂角置換", startIdx: cpStart, endIdx: moves.length });
  }

  const epStart = moves.length;
  const epMacros = [
    { id: "D", moves: ["D"] },
    { id: "D2", moves: ["D2"] },
    { id: "D'", moves: ["D'"] },
    { id: "EP_PLL", moves: LAST_LAYER_EDGE_PLL },
    { id: "EP_PLL_INV", moves: LAST_LAYER_EDGE_PLL_INV }
  ];
  const epResult = solveWithMacros(state, epMacros, engine.isCubeSolved, 4, engine);
  if (!epResult.ok) {
    return { ok: false, message: "LBL 第三層頂稜置換失敗，請換一組打亂再試。" };
  }
  state = epResult.state;
  moves.push(...epResult.moves);
  if (moves.length > epStart) {
    phases.push({ name: "第三層：頂稜置換", startIdx: epStart, endIdx: moves.length });
  }

  if (!engine.isCubeSolved(state)) {
    return { ok: false, message: "求解流程未收斂到復原狀態，請重新打亂再試。" };
  }

  return { ok: true, moves, phases };
}


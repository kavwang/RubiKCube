import { OPPOSITE_FACE } from "../config/two-by-two-constants.js";
import {
  applyMoveCO,
  applyMoveCOMulti,
  applyMoveCP,
  applyMoveCPMulti,
  encodeOri,
  encodePerm,
  moveToText
} from "./two-by-two-moves.js";
import { cubieToStickerState } from "./two-by-two-cube-state.js";

// Helper to parse standard move notation (e.g. "R", "D2", "F'") into move IDs (0..17)
function parseMove(m) {
  const faceMap = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 };
  const face = faceMap[m[0]];
  let suffix = 0;
  if (m.endsWith("2")) suffix = 1;
  else if (m.endsWith("'")) suffix = 2;
  return face * 3 + suffix;
}

function parseFormula(formula) {
  if (!formula) return [];
  return formula.trim().split(/\s+/).map(parseMove);
}

// 7 D-layer OLL algorithms (mirrored from standard U-layer OLLs)
const OLL_ALGS = [
  { name: "Sune (小魚 1)", formula: "R' D' R D' R' D2 R" },
  { name: "Anti-Sune (小魚 2)", formula: "R' D2 R D R' D R" },
  { name: "H (雙魚)", formula: "R2 D2 R' D2 R2" },
  { name: "Pi (十字)", formula: "R' D2 R2 D R2 D R2 D2 R'" },
  { name: "Headlights (U 字)", formula: "R' D' R D R F' R' F" },
  { name: "Chameleon (T 字)", formula: "F' R' D' R D F" },
  { name: "Bowtie (L 字)", formula: "F' R F R' D' R' D R" }
].map(alg => ({ name: alg.name, moves: parseFormula(alg.formula) }));

// 2 D-layer PLL algorithms (mirrored from standard U-layer PLLs)
const PLL_ALGS = [
  { name: "相鄰角塊交換 (T-perm)", moves: parseFormula("R' D' R D R F' R2 D R D R' D' R F") },
  { name: "對角角塊交換 (Y-perm)", moves: parseFormula("F' R' D R D R' D' R F R' D' R D R F' R' F") }
].map(alg => ({ name: alg.name, moves: alg.moves }));

// Apply a list of move IDs to a state
function applyMoveList(cp, co, moves) {
  let nextCP = cp;
  let nextCO = co;
  for (const mv of moves) {
    const face = Math.floor(mv / 3);
    const turns = (mv % 3) + 1;
    nextCP = applyMoveCPMulti(nextCP, face, turns);
    nextCO = applyMoveCOMulti(nextCO, face, turns);
  }
  return { cp: nextCP, co: nextCO };
}

// Phase 1: Solve U layer (corners 0, 1, 2, 3)
// Goal: U layer corners are at their home positions (cp[i] === i) and orientations (co[i] === 0)
function solvePhase1(cpStart, coStart) {
  const queue = [{ cp: cpStart, co: coStart, moves: [] }];
  const visited = new Set();
  
  const getKey = (cp, co) => {
    return `${cp[0]}_${cp[1]}_${cp[2]}_${cp[3]}_${co[0]}_${co[1]}_${co[2]}_${co[3]}`;
  };
  
  const targetKey = "0_1_2_3_0_0_0_0";
  
  if (getKey(cpStart, coStart) === targetKey) {
    return [];
  }
  
  visited.add(getKey(cpStart, coStart));
  let head = 0;
  
  while (head < queue.length) {
    const { cp, co, moves } = queue[head++];
    
    // U-layer in 2x2 is mathematically solvable in <= 6 moves.
    // We set a loose safety check of 10 moves to prevent infinite loops on invalid custom states.
    if (moves.length >= 10) continue;
    
    const lastFace = moves.length > 0 ? Math.floor(moves[moves.length - 1] / 3) : -1;
    
    for (let mv = 0; mv < 18; mv += 1) {
      const face = Math.floor(mv / 3);
      if (face === lastFace) continue;
      
      const turns = (mv % 3) + 1;
      const nextCP = applyMoveCPMulti(cp, face, turns);
      const nextCO = applyMoveCOMulti(co, face, turns);
      
      const key = getKey(nextCP, nextCO);
      if (key === targetKey) {
        return [...moves, mv];
      }
      
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({
          cp: nextCP,
          co: nextCO,
          moves: [...moves, mv]
        });
      }
    }
  }
  return null; // Should not happen for solvable cube
}

// Phase 2: Orient D layer (OLL) using D-turns and 7 standard D-layer OLL algorithms
// Goal: U layer is preserved, D layer orientation is fully solved (co === all 0)
function solvePhase2(cpStart, coStart) {
  const queue = [{ cp: cpStart, co: coStart, moves: [], transDepth: 0 }];
  const visited = new Set();
  
  const getKey = (cp, co) => {
    return `${co.join(",")}|${cp.join(",")}`;
  };
  
  const isTarget = (co) => co.every(v => v === 0);
  
  if (isTarget(coStart)) {
    return [];
  }
  
  visited.add(getKey(cpStart, coStart));
  let head = 0;
  
  // Transition actions in Phase 2
  const transitions = [
    { name: "D", moves: [9] },
    { name: "D2", moves: [10] },
    { name: "D'", moves: [11] },
    ...OLL_ALGS
  ];
  
  while (head < queue.length) {
    const { cp, co, moves, transDepth } = queue[head++];
    
    // OLL can always be aligned and solved in <= 2 macro transitions.
    // We set a strict transition depth limit of 4 to guarantee instant execution.
    if (transDepth >= 4) continue;
    
    for (const trans of transitions) {
      const nextState = applyMoveList(cp, co, trans.moves);
      const nextKey = getKey(nextState.cp, nextState.co);
      
      if (isTarget(nextState.co)) {
        return [...moves, ...trans.moves];
      }
      
      if (!visited.has(nextKey)) {
        visited.add(nextKey);
        queue.push({
          cp: nextState.cp,
          co: nextState.co,
          moves: [...moves, ...trans.moves]
        });
      }
    }
  }
  return null;
}

// Phase 3: Permute D layer (PLL) using D-turns and 2 standard D-layer PLL algorithms
// Goal: Cube fully solved (cp === [0,1,2,3,4,5,6,7], co === all 0)
function solvePhase3(cpStart, coStart) {
  const queue = [{ cp: cpStart, co: coStart, moves: [], transDepth: 0 }];
  const visited = new Set();
  
  const getKey = (cp) => cp.join(",");
  const isTarget = (cp) => cp.every((v, i) => v === i);
  
  if (isTarget(cpStart)) {
    return [];
  }
  
  visited.add(getKey(cpStart));
  let head = 0;
  
  // Transition actions in Phase 3
  const transitions = [
    { name: "D", moves: [9] },
    { name: "D2", moves: [10] },
    { name: "D'", moves: [11] },
    ...PLL_ALGS
  ];
  
  while (head < queue.length) {
    const { cp, co, moves, transDepth } = queue[head++];
    
    // PLL can always be aligned and solved in <= 3 macro transitions.
    // We set a strict transition depth limit of 4 to guarantee instant execution.
    if (transDepth >= 4) continue;
    
    for (const trans of transitions) {
      const nextState = applyMoveList(cp, co, trans.moves);
      const nextKey = getKey(nextState.cp);
      
      if (isTarget(nextState.cp)) {
        return [...moves, ...trans.moves];
      }
      
      if (!visited.has(nextKey)) {
        visited.add(nextKey);
        queue.push({
          cp: nextState.cp,
          co: nextState.co,
          moves: [...moves, ...trans.moves]
        });
      }
    }
  }
  return null;
}

// Self-check routine for sanity verification
function runSelfChecks(solver) {
  for (let t = 0; t < 50; t += 1) {
    const len = 8 + Math.floor(Math.random() * 12);
    let cp = [0, 1, 2, 3, 4, 5, 6, 7];
    let co = [0, 0, 0, 0, 0, 0, 0, 0];
    let lastFace = -1;
    for (let i = 0; i < len; i += 1) {
      let mv = Math.floor(Math.random() * 18);
      while (Math.floor(mv / 3) === lastFace) mv = Math.floor(Math.random() * 18);
      const face = Math.floor(mv / 3);
      const turns = (mv % 3) + 1;
      cp = applyMoveCPMulti(cp, face, turns);
      co = applyMoveCOMulti(co, face, turns);
      lastFace = face;
    }

    const result = solver.solve(cp, co);
    if (!result.ok) throw new Error("Self-check failed: LBL solver did not return a solution.");

    let xcp = cp.slice();
    let xco = co.slice();
    for (const mv of result.moves) {
      const face = Math.floor(mv / 3);
      const turns = (mv % 3) + 1;
      xcp = applyMoveCPMulti(xcp, face, turns);
      xco = applyMoveCOMulti(xco, face, turns);
    }

    if (encodePerm(xcp) !== 0 || encodeOri(xco) !== 0) {
      throw new Error("Self-check failed: LBL returned sequence does not solve the cube.");
    }
  }
}

// Generate random scramble and state
function generateRandomSolvableState() {
  let cp = [0, 1, 2, 3, 4, 5, 6, 7];
  let co = [0, 0, 0, 0, 0, 0, 0, 0];
  const scramble = [];
  const len = 10 + Math.floor(Math.random() * 6);
  let lastFace = -1;

  for (let i = 0; i < len; i += 1) {
    let move = Math.floor(Math.random() * 18);
    let face = Math.floor(move / 3);
    while (face === lastFace) {
      move = Math.floor(Math.random() * 18);
      face = Math.floor(move / 3);
    }
    scramble.push(moveToText(move));
    cp = applyMoveCPMulti(cp, face, (move % 3) + 1);
    co = applyMoveCOMulti(co, face, (move % 3) + 1);
    lastFace = face;
  }

  return { cp, co, scramble, state: cubieToStickerState(cp, co) };
}

export class SolverService {
  constructor() {
    this.ready = false;
  }

  init({ debug = false } = {}) {
    this.ready = true;
    if (debug) {
      runSelfChecks(this);
    }
  }

  solve(cp, co) {
    if (!this.ready) return { ok: false, message: "求解器尚未初始化。" };

    // Run Phase 1: Solve U layer
    const phase1Moves = solvePhase1(cp, co);
    if (!phase1Moves) {
      return { ok: false, message: "第一階段（復原第一層）求解失敗，請檢查顏色輸入。" };
    }

    // Apply Phase 1 moves to get start state of Phase 2
    const stateAfterP1 = applyMoveList(cp, co, phase1Moves);

    // Run Phase 2: Orient D layer
    const phase2Moves = solvePhase2(stateAfterP1.cp, stateAfterP1.co);
    if (!phase2Moves) {
      return { ok: false, message: "第二階段（頂面方向對齊）求解失敗，請檢查顏色輸入。" };
    }

    // Apply Phase 2 moves to get start state of Phase 3
    const stateAfterP2 = applyMoveList(stateAfterP1.cp, stateAfterP1.co, phase2Moves);

    // Run Phase 3: Permute D layer
    const phase3Moves = solvePhase3(stateAfterP2.cp, stateAfterP2.co);
    if (!phase3Moves) {
      return { ok: false, message: "第三階段（頂層角塊調整）求解失敗，請檢查顏色輸入。" };
    }

    const allMoves = [...phase1Moves, ...phase2Moves, ...phase3Moves];
    
    // Group moves by phases for UI tutorial steps
    const phases = [
      { name: "第一階段：復原第一層", startIdx: 0, endIdx: phase1Moves.length },
      { 
        name: "第二階段：對齊底面方向 (OLL)", 
        startIdx: phase1Moves.length, 
        endIdx: phase1Moves.length + phase2Moves.length 
      },
      { 
        name: "第三階段：調整底層位置 (PLL)", 
        startIdx: phase1Moves.length + phase2Moves.length, 
        endIdx: allMoves.length 
      }
    ];

    return {
      ok: true,
      moves: allMoves,
      phases
    };
  }

  randomState() {
    return generateRandomSolvableState();
  }
}

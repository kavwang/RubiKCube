import {
  applyMoveCOMulti,
  applyMoveCPMulti,
  encodeOri,
  encodePerm,
  moveToText
} from "./two-by-two-moves.js";
import { cubieToStickerState } from "./two-by-two-cube-state.js";
import { solveLbl2x2 } from "./two-by-two-lbl-solver.js";
import { solveFastest2x2 } from "./two-by-two-fastest-solver.js";

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

    const resultOpt = solver.solve(cp, co, "fastest");
    if (!resultOpt.ok) throw new Error("Self-check failed: Optimal solver did not return a solution.");
    let xcpOpt = cp.slice();
    let xcoOpt = co.slice();
    for (const mv of resultOpt.moves) {
      const face = Math.floor(mv / 3);
      const turns = (mv % 3) + 1;
      xcpOpt = applyMoveCPMulti(xcpOpt, face, turns);
      xcoOpt = applyMoveCOMulti(xcoOpt, face, turns);
    }
    if (encodePerm(xcpOpt) !== 0 || encodeOri(xcoOpt) !== 0) {
      throw new Error("Self-check failed: Optimal returned sequence does not solve the cube.");
    }
  }
}

// Generate random scramble and state
export function generateRandomSolvableState() {
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

  solve(cp, co, method = "lbl") {
    if (!this.ready) return { ok: false, message: "求解器尚未初始化。" };

    if (method === "fastest") {
      return solveFastest2x2(cp, co);
    }

    return solveLbl2x2(cp, co);
  }

  randomState() {
    return generateRandomSolvableState();
  }
}

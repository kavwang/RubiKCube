import { initSolver, solve } from "./two-phase/solver.js";
import { facelets54ToCubieCube } from "./two-phase/facelet-parser.js";

// Initialize Kociemba two-phase solver (pre-compute move & pruning tables)
initSolver();

export function solveFastestPlan(scrambleState, engine) {
  try {
    const stateString = scrambleState.join("");
    const cubieCube = facelets54ToCubieCube(stateString);
    const solution = solve(cubieCube);
    const moves = solution.split(" ").filter(Boolean);
    const phases = [{ name: "雙向最速解還原步驟", startIdx: 0, endIdx: moves.length }];
    return { ok: true, moves, phases };
  } catch (error) {
    return { ok: false, message: `最速解求解失敗：${error.message || error}` };
  }
}

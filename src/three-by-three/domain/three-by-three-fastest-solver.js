import Cube from "./cubejs.js";

// Initialize Kociemba solver pruning tables
Cube.initSolver();

export function solveFastestPlan(scrambleState, engine) {
  try {
    const stateString = scrambleState.join("");
    const cube = Cube.fromString(stateString);
    const solution = cube.solve();
    const moves = solution.split(" ").filter(Boolean);
    const phases = [{ name: "雙向最速解還原步驟", startIdx: 0, endIdx: moves.length }];
    return { ok: true, moves, phases };
  } catch (error) {
    return { ok: false, message: `最速解求解失敗：${error.message || error}` };
  }
}

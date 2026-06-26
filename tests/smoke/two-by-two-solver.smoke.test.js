import assert from "node:assert/strict";
import test from "node:test";
import { SolverService } from "../../src/two-by-two/domain/two-by-two-solver-service.js";
import { applyMoveCOMulti, applyMoveCPMulti, encodeOri, encodePerm } from "../../src/two-by-two/domain/two-by-two-moves.js";

test("2x2 LBL solver smoke test: random scrambles should be solvable", () => {
  const solver = new SolverService();
  solver.init();

  const rounds = 50;
  for (let i = 0; i < rounds; i += 1) {
    const randomObj = solver.randomState(); // returns { cp, co, scramble, state }
    const result = solver.solve(randomObj.cp, randomObj.co);
    assert.equal(result.ok, true, `solver failed at round ${i + 1}: ${result.message}`);

    // Verify it is solved
    let cp = randomObj.cp.slice();
    let co = randomObj.co.slice();
    for (const mv of result.moves) {
      const face = Math.floor(mv / 3);
      const turns = (mv % 3) + 1;
      cp = applyMoveCPMulti(cp, face, turns);
      co = applyMoveCOMulti(co, face, turns);
    }
    assert.equal(encodePerm(cp), 0, `Permutation not solved at round ${i + 1}`);
    assert.equal(encodeOri(co), 0, `Orientation not solved at round ${i + 1}`);

    // Verify phases structure
    if (result.phases?.length) {
      const last = result.phases[result.phases.length - 1];
      assert.equal(last.endIdx, result.moves.length, `Phases endIdx mismatch at round ${i + 1}`);
    }
  }
});

test("2x2 optimal solver smoke test: random scrambles should be solvable in fewer or equal moves", () => {
  const solver = new SolverService();
  solver.init();

  const rounds = 50;
  for (let i = 0; i < rounds; i += 1) {
    const randomObj = solver.randomState();
    const resultLbl = solver.solve(randomObj.cp, randomObj.co, "lbl");
    const resultOpt = solver.solve(randomObj.cp, randomObj.co, "fastest");

    assert.equal(resultOpt.ok, true, `Optimal solver failed at round ${i + 1}: ${resultOpt.message}`);
    assert.equal(resultLbl.ok, true, `LBL solver failed at round ${i + 1}: ${resultLbl.message}`);

    // Verify optimal path solves the cube
    let cp = randomObj.cp.slice();
    let co = randomObj.co.slice();
    for (const mv of resultOpt.moves) {
      const face = Math.floor(mv / 3);
      const turns = (mv % 3) + 1;
      cp = applyMoveCPMulti(cp, face, turns);
      co = applyMoveCOMulti(co, face, turns);
    }
    assert.equal(encodePerm(cp), 0, `Optimal Permutation not solved at round ${i + 1}`);
    assert.equal(encodeOri(co), 0, `Optimal Orientation not solved at round ${i + 1}`);

    // Assert that optimal solver finds a solution that is <= LBL solver
    assert.ok(resultOpt.moves.length <= resultLbl.moves.length, `Optimal solution (${resultOpt.moves.length} moves) was longer than LBL solution (${resultLbl.moves.length} moves) at round ${i + 1}`);
  }
});

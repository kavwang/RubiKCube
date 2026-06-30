import assert from "node:assert/strict";
import test from "node:test";

import { createCubeEngine } from "../../src/three-by-three/domain/three-by-three-cube-engine.js";
import { solveLblPlan } from "../../src/three-by-three/domain/three-by-three-lbl-solver.js";
import { solveFastestPlan } from "../../src/three-by-three/domain/three-by-three-fastest-solver.js";

test("LBL smoke: random scrambles should be solvable", () => {
  const engine = createCubeEngine();
  const rounds = 50;

  for (let i = 0; i < rounds; i += 1) {
    const scrambleText = engine.makeRandomScramble(20);
    const parsed = engine.parseMoves(scrambleText);
    assert.equal(parsed.ok, true, `parse failed at round ${i + 1}`);

    const scrambleState = engine.applyMovesToSolvedFacelets(parsed.moves);
    const plan = solveLblPlan(scrambleState, engine);

    assert.equal(plan.ok, true, `solver failed at round ${i + 1}: ${plan.message}`);

    const restored = engine.applyMoveTokens(scrambleState, plan.moves);
    assert.equal(engine.isCubeSolved(restored), true, `not solved at round ${i + 1}`);

    if (plan.phases?.length) {
      const last = plan.phases[plan.phases.length - 1];
      assert.equal(last.endIdx, plan.moves.length);
    }
  }
});

test("Fastest smoke: random scrambles should be solvable and faster on average than LBL", () => {
  const engine = createCubeEngine();
  const rounds = 50;
  let lblTotal = 0;
  let fastestTotal = 0;

  for (let i = 0; i < rounds; i += 1) {
    const scrambleText = engine.makeRandomScramble(20);
    const parsed = engine.parseMoves(scrambleText);
    assert.equal(parsed.ok, true, `parse failed at round ${i + 1}`);

    const scrambleState = engine.applyMovesToSolvedFacelets(parsed.moves);
    const planLbl = solveLblPlan(scrambleState, engine);
    const planFastest = solveFastestPlan(scrambleState, engine);

    assert.equal(planLbl.ok, true, `LBL solver failed at round ${i + 1}: ${planLbl.message}`);
    assert.equal(planFastest.ok, true, `Fastest solver failed at round ${i + 1}: ${planFastest.message}`);

    // Verify it is solved by fastest solver
    const restored = engine.applyMoveTokens(scrambleState, planFastest.moves);
    assert.equal(engine.isCubeSolved(restored), true, `Fastest solver did not solve at round ${i + 1}`);

    lblTotal += planLbl.moves.length;
    fastestTotal += planFastest.moves.length;

    // Verify phases structure
    if (planFastest.phases?.length) {
      const last = planFastest.phases[planFastest.phases.length - 1];
      assert.equal(last.endIdx, planFastest.moves.length);
    }
  }

  // Assert that on average, Fastest solver produces shorter solutions
  assert.ok(
    fastestTotal < lblTotal,
    `Fastest solver average moves (${fastestTotal / rounds}) was not shorter than LBL average moves (${lblTotal / rounds})`
  );
});



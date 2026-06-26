import assert from "node:assert/strict";
import test from "node:test";

import { createCubeEngine } from "../../src/three-by-three/domain/three-by-three-cube-engine.js";
import { solveLblPlan } from "../../src/three-by-three/domain/three-by-three-lbl-solver.js";

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


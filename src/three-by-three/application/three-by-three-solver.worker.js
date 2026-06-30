import { createCubeEngine } from "../domain/three-by-three-cube-engine.js";
import { solveLblPlan } from "../domain/three-by-three-lbl-solver.js";
import { solveFastestPlan } from "../domain/three-by-three-fastest-solver.js";

const engine = createCubeEngine();

self.onmessage = (e) => {
  const { scrambleState, method } = e.data;
  
  try {
    const plan = method === "lbl"
      ? solveLblPlan(scrambleState, engine)
      : solveFastestPlan(scrambleState, engine);
      
    self.postMessage(plan);
  } catch (error) {
    self.postMessage({ ok: false, message: error.message || "解題發生錯誤" });
  }
};

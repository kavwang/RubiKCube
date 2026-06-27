import { SolverService } from "../domain/two-by-two-solver-service.js";

const solver = new SolverService();

self.onmessage = (e) => {
  const { type, payload } = e.data;
  
  if (type === "init") {
    solver.init(payload);
    self.postMessage({ type: "init_done" });
  } else if (type === "solve") {
    const { cp, co, method } = payload;
    try {
      const result = solver.solve(cp, co, method);
      self.postMessage({ type: "solve_done", result });
    } catch (error) {
      self.postMessage({ type: "solve_done", result: { ok: false, message: error.message || "解題發生錯誤" }});
    }
  }
};

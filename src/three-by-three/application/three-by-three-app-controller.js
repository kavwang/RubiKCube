import { FACE_COLORS, FACE_ORDER } from "../domain/three-by-three-constants.js";
import { createCubeEngine } from "../domain/three-by-three-cube-engine.js";
import { solveLblPlan } from "../domain/three-by-three-lbl-solver.js";
import { ThreeByThreeCubeView } from "../infrastructure/three-by-three-cube-view.js";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ThreeByThreeAppController {
  constructor(doc = document) {
    this.doc = doc;
    this.engine = createCubeEngine();

    this.currentMode = "edit";
    this.selectedFace = "U";
    this.animationBusy = false;
    this.playing = false;
    this.scrambleMoves = [];
    this.solutionMoves = [];
    this.solutionPhases = [];
    this.currentStep = 0;
    this.stickerState = new Map();
    this.initialStickerState = null;
    this.solverMethod = "lbl";

    this.bindElements();
    this.view = new ThreeByThreeCubeView({
      viewerEl: this.viewerEl,
      onStickerClick: (key) => this.onStickerClick(key)
    });

    this.initStickerState();
    this.buildPalette();
    this.bindEvents();
    this.setStatus("請先輸入打亂公式，或按「隨機打亂」。");
  }

  bindElements() {
    const byId = (id) => this.doc.getElementById(id);
    this.scrambleInputEl = byId("scrambleInput");
    this.randomBtn = byId("randomBtn");
    this.applyBtn = byId("applyBtn");
    this.fillSolvedBtn = byId("fillSolvedBtn");
    this.clearBtn = byId("clearBtn");
    this.solveBtn = byId("solveBtn");
    this.resetBtn = byId("resetBtn");
    this.nextBtn = byId("nextBtn");
    this.autoBtn = byId("autoBtn");
    this.statusEl = byId("status");
    this.stepsListEl = byId("stepsList");
    this.stepCounterEl = byId("stepCounter");
    this.togglePanelBtn = byId("togglePanelBtn");
    this.controlPanel = byId("controlPanel");
    this.viewerEl = byId("viewer");
    this.editModeBtn = byId("editModeBtn");
    this.solveModeBtn = byId("solveModeBtn");
    this.editPanel = byId("editPanel");
    this.solvePanel = byId("solvePanel");
    this.paletteEl = byId("palette");
    this.lblBtn = byId("lblBtn");
    this.fastestBtn = byId("fastestBtn");
  }

  initStickerState() {
    this.stickerState = new Map();
    for (const [key, sticker] of this.view.stickerByKey.entries()) {
      this.stickerState.set(key, sticker.userData.face);
    }
  }

  bindEvents() {
    this.togglePanelBtn.addEventListener("click", () => {
      this.controlPanel.classList.toggle("collapsed");
      this.togglePanelBtn.textContent = this.controlPanel.classList.contains("collapsed") ? "展開選單" : "收合選單";
    });

    this.editModeBtn.addEventListener("click", () => {
      if (!this.animationBusy) this.setMode("edit");
    });

    this.solveModeBtn.addEventListener("click", () => {
      if (!this.animationBusy) this.setMode("solve");
    });

    this.lblBtn.addEventListener("click", () => {
      if (this.animationBusy) return;
      this.setSolverMethod("lbl");
    });

    this.fastestBtn.addEventListener("click", () => {
      if (this.animationBusy) return;
      this.setSolverMethod("fastest");
    });

    this.randomBtn.addEventListener("click", () => {
      this.scrambleInputEl.value = this.engine.makeRandomScramble(20);
      this.applyScrambleFromInput();
    });

    this.applyBtn.addEventListener("click", () => this.applyScrambleFromInput());

    this.fillSolvedBtn.addEventListener("click", () => {
      if (this.animationBusy) return;
      this.resetToSolvedState();
      this.clearSolutionView();
      this.setStatus("已填入復原顏色。");
    });

    this.clearBtn.addEventListener("click", () => {
      if (this.animationBusy) return;
      for (const key of this.stickerState.keys()) {
        this.stickerState.set(key, null);
      }
      this.view.setStickerState(this.stickerState);
      this.clearSolutionView();
      this.setStatus("已清空顏色。");
    });

    this.solveBtn.addEventListener("click", () => this.solveCurrentScramble());

    this.resetBtn.addEventListener("click", () => {
      if (this.animationBusy) return;
      this.resetToSolvedState();
      if (this.initialStickerState) {
        this.view.setStickerState(this.initialStickerState);
        this.stickerState = new Map(this.initialStickerState);
      } else {
        for (const move of this.scrambleMoves) this.view.applyMoveImmediate(move);
      }
      this.currentStep = 0;
      this.renderSteps();
      this.updateButtons();
      this.setStatus("已回到打亂狀態。");
    });

    this.nextBtn.addEventListener("click", () => this.playOneStep());

    this.autoBtn.addEventListener("click", async () => {
      if (this.animationBusy) return;
      if (!this.playing) {
        this.playing = true;
        this.autoBtn.textContent = "停止播放";
        while (this.playing && this.currentStep < this.solutionMoves.length) {
          await this.playOneStep();
          if (!this.playing) break;
          await wait(180);
        }
        this.playing = false;
        this.autoBtn.textContent = "自動播放";
        return;
      }
      this.stopAuto();
    });
  }

  buildPalette() {
    this.paletteEl.innerHTML = "";
    FACE_ORDER.forEach((face, idx) => {
      const btn = this.doc.createElement("button");
      btn.className = `color-btn${idx === 0 ? " active" : ""}`;
      btn.innerHTML = `<span class="swatch" style="background:${FACE_COLORS[face]}"></span><span>${face}</span>`;
      btn.addEventListener("click", () => {
        this.selectedFace = face;
        [...this.paletteEl.querySelectorAll(".color-btn")].forEach((el) => el.classList.remove("active"));
        btn.classList.add("active");
      });
      this.paletteEl.appendChild(btn);
    });
  }

  onStickerClick(key) {
    if (this.animationBusy || this.currentMode !== "edit") return;
    this.stickerState.set(key, this.selectedFace);
    this.view.setStickerFace(key, this.selectedFace);
    this.clearSolutionView();
  }

  setMode(mode) {
    this.currentMode = mode;
    if (mode === "edit") {
      this.editModeBtn.classList.add("active");
      this.solveModeBtn.classList.remove("active");
      this.editPanel.classList.remove("hidden");
      this.solvePanel.classList.add("hidden");
      this.setStatus("編輯模式：可上色、輸入打亂並套用。");
      return;
    }

    this.solveModeBtn.classList.add("active");
    this.editModeBtn.classList.remove("active");
    this.solvePanel.classList.remove("hidden");
    this.editPanel.classList.add("hidden");
    this.setStatus("解題模式：按「開始求解」後逐步播放。");
  }

  setSolverMethod(method) {
    this.solverMethod = method;
    const container = this.lblBtn.parentElement;
    if (method === "lbl") {
      this.lblBtn.classList.add("active");
      this.fastestBtn.classList.remove("active");
      container.classList.add("lbl-active");
      container.classList.remove("fastest-active");
    } else {
      this.fastestBtn.classList.add("active");
      this.lblBtn.classList.remove("active");
      container.classList.add("fastest-active");
      container.classList.remove("lbl-active");
    }
    this.clearSolutionView();
    this.setStatus(`已切換為：${method === "lbl" ? "LBL 分層解法" : "雙向最速解"}`);
  }

  resetToSolvedState() {
    this.view.resetToSolved();
    this.initStickerState();
  }

  applyScrambleFromInput() {
    if (this.animationBusy) return;
    const parsed = this.engine.parseMoves(this.scrambleInputEl.value);
    if (!parsed.ok) {
      this.setStatus(parsed.message);
      return;
    }

    this.scrambleMoves = parsed.moves;
    this.resetToSolvedState();
    for (const move of this.scrambleMoves) this.view.applyMoveImmediate(move);
    this.clearSolutionView();
    this.setStatus(`已套用打亂，共 ${this.scrambleMoves.length} 步。`);
  }

  solveCurrentScramble() {
    if (this.animationBusy) return;

    let scrambleState;
    if (this.currentMode === "edit") {
      const decoded = this.engine.decodeCubeFromStickers(this.stickerState);
      if (!decoded.ok) {
        this.setStatus(decoded.message);
        return;
      }
      scrambleState = decoded.state;
      this.initialStickerState = new Map(this.stickerState);
      this.scrambleMoves = [];
    } else {
      const parsed = this.engine.parseMoves(this.scrambleInputEl.value);
      if (!parsed.ok) {
        this.setStatus(parsed.message);
        return;
      }
      this.scrambleMoves = parsed.moves;
      this.resetToSolvedState();
      for (const move of this.scrambleMoves) this.view.applyMoveImmediate(move);
      scrambleState = this.engine.applyMovesToSolvedFacelets(this.scrambleMoves);
      this.initialStickerState = null;
    }

    const plan = solveLblPlan(scrambleState, this.engine);
    if (!plan.ok) {
      this.setStatus(plan.message);
      this.clearSolutionView();
      return;
    }

    this.solutionMoves = plan.moves;
    this.solutionPhases = plan.phases;
    this.currentStep = 0;
    this.renderSteps();
    this.updateButtons();

    if (!this.solutionMoves.length) {
      this.setStatus("目前已是復原狀態。");
    } else {
      this.setStatus(`已產生 LBL 解法，共 ${this.solutionMoves.length} 步。`);
    }
  }

  clearSolutionView() {
    this.stopAuto();
    this.solutionMoves = [];
    this.solutionPhases = [];
    this.currentStep = 0;
    this.initialStickerState = null;
    this.stepsListEl.innerHTML = "";
    this.stepCounterEl.textContent = "0 / 0";
    this.updateButtons();
  }

  renderSteps() {
    this.stepsListEl.innerHTML = "";

    let phaseIdx = 0;
    for (let i = 0; i < this.solutionMoves.length; i += 1) {
      while (phaseIdx < this.solutionPhases.length && i === this.solutionPhases[phaseIdx].startIdx) {
        const header = this.doc.createElement("div");
        header.className = "phase-header";
        header.textContent = this.solutionPhases[phaseIdx].name;
        this.stepsListEl.appendChild(header);
        phaseIdx += 1;
      }

      const li = this.doc.createElement("li");
      li.textContent = this.engine.describeMove(this.solutionMoves[i]);
      if (i === this.currentStep) {
        li.classList.add("active");
        setTimeout(() => li.scrollIntoView({ block: "nearest", behavior: "smooth" }), 10);
      }
      this.stepsListEl.appendChild(li);
    }

    this.stepCounterEl.textContent = `${this.currentStep} / ${this.solutionMoves.length}`;
  }

  updateButtons() {
    const hasSolution = this.solutionMoves.length > 0;
    this.nextBtn.disabled = !hasSolution || this.currentStep >= this.solutionMoves.length || this.animationBusy;
    this.autoBtn.disabled = !hasSolution || this.currentStep >= this.solutionMoves.length;
    this.resetBtn.disabled = (!this.scrambleMoves.length && !this.initialStickerState) || this.animationBusy;
  }

  async playOneStep() {
    if (this.animationBusy || this.currentStep >= this.solutionMoves.length) return;

    this.animationBusy = true;
    this.updateButtons();

    await this.view.animateMove(this.solutionMoves[this.currentStep], 270);
    this.currentStep += 1;
    this.renderSteps();

    if (this.currentStep >= this.solutionMoves.length) {
      this.setStatus("完成，3x3 已復原。");
      this.stopAuto();
    } else {
      this.setStatus(`第 ${this.currentStep} / ${this.solutionMoves.length} 步完成。`);
    }

    this.animationBusy = false;
    this.updateButtons();
  }

  stopAuto() {
    this.playing = false;
    this.autoBtn.textContent = "自動播放";
  }

  setStatus(text) {
    this.statusEl.textContent = text;
  }
}


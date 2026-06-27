import { CORNERS, FACE_ORDER, FACE_STYLE, POS_FACES } from "../config/two-by-two-constants.js";
import { cubieToStickerState, decodeCubeFromStickers, makeSolvedStickerState } from "../domain/two-by-two-cube-state.js";
import { applyMoveCOMulti, applyMoveCPMulti, describeMove } from "../domain/two-by-two-moves.js";
import { generateRandomSolvableState } from "../domain/two-by-two-solver-service.js";
import { CubeView } from "../infrastructure/two-by-two-cube-view.js";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class AppController {
  constructor(doc = document) {
    this.doc = doc;
    this.solverReady = false;

    this.solverWorker = new Worker(new URL("./two-by-two-solver.worker.js", import.meta.url), { type: "module" });
    this.solverWorker.onmessage = this.handleWorkerMessage.bind(this);

    this.solutionMoves = [];
    this.solutionPhases = [];
    this.currentStep = 0;
    this.initialStickerState = null;
    this.playbackCP = null;
    this.playbackCO = null;
    this.selectedFace = "U";
    this.currentMode = "edit";
    this.animationBusy = false;
    this.playing = false;
    this.solverMethod = "lbl";

    this.stickerState = makeSolvedStickerState();

    this.bindElements();
    this.view = new CubeView({
      viewerEl: this.viewerEl,
      corners: CORNERS,
      posFaces: POS_FACES,
      onStickerClick: (key) => this.onStickerClick(key),
      fpsCounterEl: this.fpsCounterEl
    });

    this.buildPalette();
    this.view.buildCubeFromState(this.stickerState);
    this.bindEvents();
    this.bootstrapSolver();
  }

  bindElements() {
    const byId = (id) => this.doc.getElementById(id);
    this.statusEl = byId("status");
    this.stepsListEl = byId("stepsList");
    this.stepCounterEl = byId("stepCounter");
    this.solveBtn = byId("solveBtn");
    this.nextBtn = byId("nextBtn");
    this.prevBtn = byId("prevBtn");
    this.autoBtn = byId("autoBtn");
    this.resetPlayBtn = byId("resetPlayBtn");
    this.fillSolvedBtn = byId("fillSolvedBtn");
    this.clearBtn = byId("clearBtn");
    this.randomBtn = byId("randomBtn");
    this.editModeBtn = byId("editModeBtn");
    this.solveModeBtn = byId("solveModeBtn");
    this.editPanel = byId("editPanel");
    this.solvePanel = byId("solvePanel");
    this.togglePanelBtn = byId("togglePanelBtn");
    this.controlPanel = byId("controlPanel");
    this.viewerEl = byId("viewer");
    this.paletteEl = byId("palette");
    this.lblBtn = byId("lblBtn");
    this.fastestBtn = byId("fastestBtn");
    this.fpsCounterEl = byId("fpsCounter");
  }

  bindEvents() {
    this.togglePanelBtn.addEventListener("click", () => {
      this.controlPanel.classList.toggle("collapsed");
      this.togglePanelBtn.textContent = this.controlPanel.classList.contains("collapsed") ? "展開選單" : "收合選單";
    });

    this.fillSolvedBtn.addEventListener("click", () => {
      if (this.animationBusy) return;
      this.stickerState = makeSolvedStickerState();
      this.view.buildCubeFromState(this.stickerState);
      this.clearSolutionView();
      this.setStatus("已填入復原狀態。請改成你手上的顏色後再求解。");
    });

    this.clearBtn.addEventListener("click", () => {
      if (this.animationBusy) return;
      const blank = new Map();
      for (const key of this.stickerState.keys()) blank.set(key, null);
      this.stickerState = blank;
      this.view.setStickerState(blank);
      this.clearSolutionView();
      this.setStatus("已清空。請選色後點擊貼紙上色。");
    });

    this.randomBtn.addEventListener("click", () => {
      if (this.animationBusy) return;
      if (!this.solverReady) {
        this.setStatus("求解器仍在初始化中，請稍後再試。");
        return;
      }
      const example = generateRandomSolvableState();
      this.stickerState = new Map(example.state);
      this.view.buildCubeFromState(this.stickerState);
      this.clearSolutionView();
      this.setStatus(`已產生隨機可解範例（打亂 ${example.scramble.length} 步）：${example.scramble.join(" ")}`);
    });

    this.solveBtn.addEventListener("click", () => this.solveCurrentState());
    this.prevBtn.addEventListener("click", () => this.playPrevStep());
    this.nextBtn.addEventListener("click", () => this.playOneStep());
    this.autoBtn.addEventListener("click", () => this.toggleAutoPlay());

    this.resetPlayBtn.addEventListener("click", () => {
      if (!this.initialStickerState || this.animationBusy) return;
      this.stopAuto();
      this.stickerState = new Map(this.initialStickerState);
      this.view.buildCubeFromState(this.stickerState);

      const decoded = decodeCubeFromStickers(this.stickerState);
      if (decoded.ok) {
        this.playbackCP = decoded.cp.slice();
        this.playbackCO = decoded.co.slice();
      } else {
        this.playbackCP = null;
        this.playbackCO = null;
      }

      this.currentStep = 0;
      this.renderSteps();
      this.updatePlayButtons();
      this.setStatus("已回到起始狀態。");
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
  }

  buildPalette() {
    this.paletteEl.innerHTML = "";
    FACE_ORDER.forEach((f, idx) => {
      const btn = this.doc.createElement("button");
      btn.className = `color-btn${idx === 0 ? " active" : ""}`;
      btn.innerHTML = `<span class="swatch" style="background:${FACE_STYLE[f].color}"></span><span>${FACE_STYLE[f].name} (${f})</span>`;
      btn.addEventListener("click", () => {
        this.selectedFace = f;
        [...this.paletteEl.querySelectorAll(".color-btn")].forEach((x) => x.classList.remove("active"));
        btn.classList.add("active");
      });
      this.paletteEl.appendChild(btn);
    });
  }

  onStickerClick(key) {
    if (this.animationBusy || this.currentMode !== "edit") return;
    this.stickerState.set(key, this.selectedFace);
    this.view.setSingleSticker(key, this.selectedFace);
    this.clearSolutionView();
  }

  setMode(mode) {
    this.currentMode = mode;
    if (mode === "edit") {
      this.editModeBtn.classList.add("active");
      this.solveModeBtn.classList.remove("active");
      this.editPanel.classList.remove("hidden");
      this.solvePanel.classList.add("hidden");
      this.view.setAutoRotateEnabled(false);
      this.clearSolutionView();
      this.setStatus("編輯模式：請選取色票並點擊方塊貼紙上色。");
      return;
    }

    this.solveModeBtn.classList.add("active");
    this.editModeBtn.classList.remove("active");
    this.solvePanel.classList.remove("hidden");
    this.editPanel.classList.add("hidden");
    this.view.resetRootRotation();
    this.view.setAutoRotateEnabled(false);
    this.setStatus("解題模式：請點擊「開始求解」開始分析。");
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

  bootstrapSolver() {
    this.setStatus("正在初始化求解器...");
    const debug = new URLSearchParams(window.location.search).has("debug");
    this.solverWorker.postMessage({ type: "init", payload: { debug } });
  }

  handleWorkerMessage(e) {
    const { type, result } = e.data;
    if (type === "init_done") {
      this.solverReady = true;
      this.setStatus("求解器已準備好。請先輸入顏色，再按「開始求解」。");
    } else if (type === "solve_done") {
      this.animationBusy = false;
      this.handleSolveResult(result);
    }
  }

  solveCurrentState() {
    if (!this.solverReady || this.animationBusy) return;

    const decoded = decodeCubeFromStickers(this.stickerState);
    if (!decoded.ok) {
      this.setStatus(decoded.message);
      return;
    }

    this._pendingDecoded = decoded; // Store for playback setup
    this.setStatus("正在計算解法中...");
    this.animationBusy = true; // prevent user interactions while calculating
    
    this.solverWorker.postMessage({
      type: "solve",
      payload: { cp: decoded.cp, co: decoded.co, method: this.solverMethod }
    });
  }

  handleSolveResult(result) {
    if (!result.ok) {
      this.setStatus(result.message);
      return;
    }

    this.solutionMoves = [];
    this.solutionPhases = [];
    let oldIdx = 0;
    let newIdx = 0;
    let currentPhase = 0;
    const resultPhases = result.phases || [];
    
    for (const moveId of result.moves) {
      if (currentPhase < resultPhases.length && resultPhases[currentPhase].startIdx === oldIdx) {
        this.solutionPhases.push({ name: resultPhases[currentPhase].name, startIdx: newIdx });
        currentPhase++;
      }
      if (moveId % 3 === 1) {
        const half = moveId - 1;
        this.solutionMoves.push(half, half);
        newIdx += 2;
      } else {
        this.solutionMoves.push(moveId);
        newIdx += 1;
      }
      oldIdx++;
    }
    if (currentPhase < resultPhases.length && resultPhases[currentPhase].startIdx === oldIdx) {
      this.solutionPhases.push({ name: resultPhases[currentPhase].name, startIdx: newIdx });
    }
    for (let i = 0; i < this.solutionPhases.length; i++) {
      this.solutionPhases[i].endIdx = (i < this.solutionPhases.length - 1) ? this.solutionPhases[i + 1].startIdx : newIdx;
    }

    this.currentStep = 0;
    this.initialStickerState = new Map(this.stickerState);
    this.playbackCP = this._pendingDecoded.cp.slice();
    this.playbackCO = this._pendingDecoded.co.slice();
    this.renderSteps();
    this.updatePlayButtons();

    if (this.solutionMoves.length === 0) {
      this.setStatus("目前已是復原狀態，不需要轉動。");
    } else {
      this.setStatus(`找到解法，共 ${this.solutionMoves.length} 步。按「下一步」開始。`);
    }
  }

  clearSolutionView() {
    this.stopAuto();
    this.solutionMoves = [];
    this.solutionPhases = [];
    this.currentStep = 0;
    this.initialStickerState = null;
    this.playbackCP = null;
    this.playbackCO = null;
    this.stepsListEl.innerHTML = "";
    this.stepCounterEl.textContent = "0 / 0";
    this.updatePlayButtons();
  }

  updatePlayButtons() {
    const hasSolution = this.solutionMoves.length > 0;
    this.nextBtn.disabled = !hasSolution || this.currentStep >= this.solutionMoves.length || this.animationBusy;
    this.prevBtn.disabled = !hasSolution || this.currentStep <= 0 || this.animationBusy;
    this.autoBtn.disabled = !hasSolution || this.currentStep >= this.solutionMoves.length;
    this.resetPlayBtn.disabled = !this.initialStickerState || this.animationBusy;
  }

  renderSteps() {
    this.stepsListEl.innerHTML = "";
    if (this.solutionPhases && this.solutionPhases.length > 0) {
      let currentPhaseIdx = 0;
      this.solutionMoves.forEach((mv, i) => {
        while (
          currentPhaseIdx < this.solutionPhases.length &&
          i === this.solutionPhases[currentPhaseIdx].startIdx
        ) {
          const phase = this.solutionPhases[currentPhaseIdx];
          if (phase.startIdx < phase.endIdx) {
            const header = this.doc.createElement("div");
            header.className = "phase-header";
            header.textContent = phase.name;
            this.stepsListEl.appendChild(header);
          }
          currentPhaseIdx += 1;
        }

        const li = this.doc.createElement("li");
        li.textContent = describeMove(mv);
        if (i === this.currentStep) {
          li.classList.add("active");
          setTimeout(() => {
            li.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }, 10);
        }
        li.addEventListener("click", () => this.jumpToStep(i));
        this.stepsListEl.appendChild(li);
      });
    } else {
      this.solutionMoves.forEach((mv, i) => {
        const li = this.doc.createElement("li");
        li.textContent = describeMove(mv);
        if (i === this.currentStep) {
          li.classList.add("active");
          setTimeout(() => {
            li.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }, 10);
        }
        li.addEventListener("click", () => this.jumpToStep(i));
        this.stepsListEl.appendChild(li);
      });
    }
    this.stepCounterEl.textContent = `${this.currentStep} / ${this.solutionMoves.length}`;
  }

  async playPrevStep() {
    if (this.animationBusy || this.currentStep <= 0) return;
    this.stopAuto();
    this.animationBusy = true;
    this.updatePlayButtons();

    this.currentStep -= 1;
    const moveId = this.solutionMoves[this.currentStep];
    const inverseMoveId = moveId % 3 === 0 ? moveId + 2 : (moveId % 3 === 2 ? moveId - 2 : moveId);
    
    await this.view.animateMove(inverseMoveId, 270);
    this.renderSteps();

    if (this.currentStep === 0) {
      this.setStatus("已回到起點。");
    } else {
      this.setStatus(`退回至第 ${this.currentStep} / ${this.solutionMoves.length} 步。`);
    }

    this.animationBusy = false;
    this.updatePlayButtons();
  }

  async jumpToStep(targetStep) {
    if (this.animationBusy || targetStep === this.currentStep) return;
    this.stopAuto();
    this.animationBusy = true;
    this.updatePlayButtons();

    this.view.buildCubeFromState(this.initialStickerState);
    for (let i = 0; i < targetStep; i++) {
      this.view.applyMoveImmediate(this.solutionMoves[i]);
    }

    this.currentStep = targetStep;
    this.renderSteps();

    if (this.currentStep === 0) {
      this.setStatus("已回到起點。");
    } else if (this.currentStep >= this.solutionMoves.length) {
      this.setStatus("完成，2x2 已復原。");
    } else {
      this.setStatus(`跳轉至第 ${this.currentStep} / ${this.solutionMoves.length} 步。`);
    }

    this.animationBusy = false;
    this.updatePlayButtons();
  }

  async playOneStep() {
    if (this.animationBusy || this.currentStep >= this.solutionMoves.length) return;
    if (!this.playbackCP || !this.playbackCO) {
      this.setStatus("目前缺少播放狀態，請重新按「開始求解」。");
      return;
    }

    this.animationBusy = true;
    this.updatePlayButtons();

    const move = this.solutionMoves[this.currentStep];
    await this.view.animateMove(move, 290);

    const face = Math.floor(move / 3);
    const turns = (move % 3) + 1;
    this.playbackCP = applyMoveCPMulti(this.playbackCP, face, turns);
    this.playbackCO = applyMoveCOMulti(this.playbackCO, face, turns);

    this.stickerState = cubieToStickerState(this.playbackCP, this.playbackCO);
    this.view.buildCubeFromState(this.stickerState);

    this.currentStep += 1;
    this.renderSteps();

    if (this.currentStep >= this.solutionMoves.length) {
      this.setStatus("完成。魔方已復原。");
      this.stopAuto();
    } else {
      this.setStatus(`第 ${this.currentStep} / ${this.solutionMoves.length} 步完成，請繼續。`);
    }

    this.animationBusy = false;
    this.updatePlayButtons();
  }

  async toggleAutoPlay() {
    if (this.animationBusy) return;
    if (!this.playing) {
      this.playing = true;
      this.autoBtn.textContent = "停止播放";
      while (this.playing && this.currentStep < this.solutionMoves.length) {
        await this.playOneStep();
        if (!this.playing) break;
        await wait(220);
      }
      this.playing = false;
      this.autoBtn.textContent = "自動播放";
      return;
    }

    this.stopAuto();
  }

  stopAuto() {
    this.playing = false;
    this.autoBtn.textContent = "自動播放";
  }

  setStatus(text) {
    this.statusEl.textContent = text;
  }
}

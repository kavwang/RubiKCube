import { CORNERS, FACE_ORDER, FACE_STYLE, POS_FACES } from "../config/two-by-two-constants.js";
import { cubieToStickerState, decodeCubeFromStickers, makeSolvedStickerState } from "../domain/two-by-two-cube-state.js";
import { applyMoveCOMulti, applyMoveCPMulti } from "../domain/two-by-two-moves.js";
import { generateRandomSolvableState } from "../domain/two-by-two-solver-service.js";
import { CubeView } from "../infrastructure/two-by-two-cube-view.js";

import i18n from "../../i18n/i18n.js";
import { byId, createElement } from "../../shared/utils/dom-helpers.js";
import { AppHeader } from "../../shared/components/AppHeader.js";
import { Panel } from "../../shared/components/Panel.js";
import { SegmentedControl } from "../../shared/components/SegmentedControl.js";
import { ColorPalette } from "../../shared/components/ColorPalette.js";
import { SolverToggle } from "../../shared/components/SolverToggle.js";
import { PlaybackControls } from "../../shared/components/PlaybackControls.js";
import { StepsList } from "../../shared/components/StepsList.js";
import { StatusBar } from "../../shared/components/StatusBar.js";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function translateDomainError(msg) {
  if (!msg) return "";
  if (msg.includes("角塊朝向") || msg.includes("方向錯誤")) {
    return i18n.t("status.wrongOrientations2x2");
  }
  if (msg.includes("尚未上色") || msg.includes("未填滿")) {
    return i18n.t("status.stickersEmpty");
  }
  if (msg.includes("數量不正確")) {
    return i18n.t("status.stickersEmpty");
  }
  return msg;
}

export class TwoByTwoPageController {
  constructor(doc = document) {
    this.doc = doc;
    this.solverReady = false;

    // Solver Web Worker
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

    // i18n Initial setup
    i18n.init();

    // Setup UI components
    this.setupUI();

    // Setup 3D Cube View
    this.view = new CubeView({
      viewerEl: byId("viewer", this.doc),
      corners: CORNERS,
      posFaces: POS_FACES,
      onStickerClick: (key) => this.onStickerClick(key),
      fpsCounterEl: byId("fpsCounter", this.doc)
    });

    this.view.buildCubeFromState(this.stickerState);
    this.bootstrapSolver();

    i18n.updateDOM(this.doc);
  }

  setupUI() {
    const headerContainer = byId("header-container", this.doc);
    const panelContainer = byId("panel-container", this.doc);

    // 1. App Header
    new AppHeader(headerContainer, {
      titleKey: "home.card2x2.title",
      showBackBtn: true
    });

    // 2. Panel Component
    this.panel = new Panel(panelContainer, {
      titleKey: "home.card2x2.title",
      onToggleCollapse: (collapsed) => {
        // Handle collapse callbacks if needed
      }
    });

    // 3. Segmented Control for mode selection
    this.modeControl = new SegmentedControl(this.panel.contentEl, {
      segments: [
        { id: "edit", textKey: "common.editMode" },
        { id: "solve", textKey: "common.solveMode" }
      ],
      activeId: "edit",
      onChange: (mode) => {
        if (!this.animationBusy) this.setMode(mode);
      }
    });

    // 4. Edit Panel Group
    this.editPanelEl = createElement("div", {
      className: "flex flex-col gap-5 w-full transition-all duration-300"
    });

    const editHint = createElement("p", {
      className: "text-xs text-text-secondary leading-relaxed",
      "data-i18n": "status.editReady"
    }, [i18n.t("status.editReady")]);
    this.editPanelEl.appendChild(editHint);

    this.palette = new ColorPalette(this.editPanelEl, {
      activeColor: "U",
      onColorSelect: (colorKey) => {
        this.selectedFace = colorKey;
      }
    });

    const editActions = createElement("div", {
      className: "flex flex-col gap-2.5 w-full mt-2"
    });

    this.randomBtn = createElement("button", {
      className: "btn-apple flex items-center justify-center gap-2 h-11 text-sm font-semibold rounded-xl border border-border-primary w-full",
      onclick: () => this.handleRandomScramble()
    }, [
      // Dice/random SVG
      this.createRandomIcon(),
      createElement("span", { "data-i18n": "common.randomScramble" }, [i18n.t("common.randomScramble")])
    ]);
    editActions.appendChild(this.randomBtn);

    const secondaryEditRow = createElement("div", {
      className: "grid grid-cols-2 gap-3 w-full"
    });

    this.fillSolvedBtn = createElement("button", {
      className: "btn-apple flex items-center justify-center gap-1.5 h-10 text-xs font-medium rounded-lg border border-border-primary",
      onclick: () => this.handleFillSolved()
    }, [
      createElement("span", { "data-i18n": "common.fillSolved" }, [i18n.t("common.fillSolved")])
    ]);

    this.clearBtn = createElement("button", {
      className: "btn-apple btn-apple-danger flex items-center justify-center gap-1.5 h-10 text-xs font-medium rounded-lg",
      onclick: () => this.handleClearColors()
    }, [
      createElement("span", { "data-i18n": "common.clearColors" }, [i18n.t("common.clearColors")])
    ]);

    secondaryEditRow.appendChild(this.fillSolvedBtn);
    secondaryEditRow.appendChild(this.clearBtn);
    editActions.appendChild(secondaryEditRow);
    this.editPanelEl.appendChild(editActions);

    this.panel.appendChild(this.editPanelEl);

    // 5. Solve Panel Group
    this.solvePanelEl = createElement("div", {
      className: "flex flex-col gap-5 w-full transition-all duration-300 hidden"
    });

    this.solverToggle = new SolverToggle(this.solvePanelEl, {
      method1Key: "solver.lbl",
      method2Key: "solver.fastest2x2",
      activeMethod: "lbl",
      onChange: (method) => {
        if (!this.animationBusy) this.setSolverMethod(method);
      }
    });

    this.solveBtn = createElement("button", {
      className: "btn-apple btn-apple-primary flex items-center justify-center gap-2 h-12 text-sm font-semibold rounded-xl w-full shadow-lg shadow-accent-blue/15",
      onclick: () => this.solveCurrentState()
    }, [
      createElement("span", { "data-i18n": "common.solve" }, [i18n.t("common.solve")])
    ]);
    this.solvePanelEl.appendChild(this.solveBtn);

    this.statusBar = new StatusBar(this.solvePanelEl, {
      initialKey: "status.initializing"
    });

    this.playbackControls = new PlaybackControls(this.solvePanelEl, {
      onReset: () => this.handleResetPlay(),
      onPrev: () => this.playPrevStep(),
      onNext: () => this.playOneStep(),
      onAutoToggle: () => this.toggleAutoPlay()
    });

    this.stepsList = new StepsList(this.solvePanelEl, {
      onStepClick: (stepIdx) => this.jumpToStep(stepIdx)
    });

    this.panel.appendChild(this.solvePanelEl);
  }

  bootstrapSolver() {
    this.statusBar.setStatus("status.initializing");
    const debug = new URLSearchParams(window.location.search).has("debug");
    this.solverWorker.postMessage({ type: "init", payload: { debug } });
  }

  handleWorkerMessage(e) {
    const { type, result } = e.data;
    if (type === "init_done") {
      this.solverReady = true;
      this.statusBar.setStatus("status.initializingDone");
    } else if (type === "solve_done") {
      this.animationBusy = false;
      this.handleSolveResult(result);
    }
  }

  onStickerClick(key) {
    if (this.animationBusy || this.currentMode !== "edit") return;
    this.stickerState.set(key, this.selectedFace);
    this.view.setSingleSticker(key, this.selectedFace);
    this.view.clearHighlights();
    this.clearSolutionView();
  }

  setMode(mode) {
    this.currentMode = mode;
    this.clearSolutionView();

    if (mode === "edit") {
      this.editPanelEl.classList.remove("hidden");
      this.solvePanelEl.classList.add("hidden");
      this.view.setAutoRotateEnabled(false);
    } else {
      this.solvePanelEl.classList.remove("hidden");
      this.editPanelEl.classList.add("hidden");
      this.view.resetRootRotation();
      this.view.setAutoRotateEnabled(false);
      this.statusBar.setStatus("status.solveReady");
    }
  }

  setSolverMethod(method) {
    this.solverMethod = method;
    this.clearSolutionView();
    const methodText = i18n.t(method === "lbl" ? "solver.lbl" : "solver.fastest2x2");
    this.statusBar.setRawText(i18n.t("status.initializingDone") + ` (${methodText})`);
  }

  handleRandomScramble() {
    if (this.animationBusy) return;
    if (!this.solverReady) {
      this.statusBar.setStatus("status.solverError", {}, "error");
      return;
    }
    const example = generateRandomSolvableState();
    this.stickerState = new Map(example.state);
    this.view.buildCubeFromState(this.stickerState);
    this.clearSolutionView();
    this.statusBar.setRawText(
      i18n.t("status.scrambleApplied", { n: example.scramble.length }) + `: ${example.scramble.join(" ")}`,
      "success"
    );
  }

  handleFillSolved() {
    if (this.animationBusy) return;
    this.stickerState = makeSolvedStickerState();
    this.view.buildCubeFromState(this.stickerState);
    this.clearSolutionView();
    this.statusBar.setStatus("status.manualSolveInfo", {}, "success");
  }

  handleClearColors() {
    if (this.animationBusy) return;
    const blank = new Map();
    for (const key of this.stickerState.keys()) blank.set(key, null);
    this.stickerState = blank;
    this.view.setStickerState(blank);
    this.clearSolutionView();
    this.statusBar.setStatus("status.clearedInfo", {}, "warning");
  }

  solveCurrentState() {
    if (!this.solverReady || this.animationBusy) return;

    const decoded = decodeCubeFromStickers(this.stickerState);
    if (!decoded.ok) {
      const translatedMsg = translateDomainError(decoded.message);
      this.statusBar.setRawText(translatedMsg, "error");
      if (decoded.twistedCorners && decoded.twistedCorners.length > 0) {
        this.view.highlightCorners(decoded.twistedCorners);
      }
      return;
    }

    this.view.clearHighlights();
    this._pendingDecoded = decoded;
    this.statusBar.setStatus("status.solving");
    this.animationBusy = true;
    this.updateControlsState();

    this.solverWorker.postMessage({
      type: "solve",
      payload: { cp: decoded.cp, co: decoded.co, method: this.solverMethod }
    });
  }

  handleSolveResult(result) {
    this.updateControlsState();

    if (!result.ok) {
      const translatedMsg = translateDomainError(result.message);
      this.statusBar.setRawText(translatedMsg, "error");
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
      // Expand double moves into two single moves for animation playback
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

    this.stepsList.setSteps(this.solutionMoves, this.solutionPhases, this.currentStep);
    this.updatePlayButtons();

    if (this.solutionMoves.length === 0) {
      this.statusBar.setStatus("status.solvedAlready", {}, "success");
    } else {
      const solverKey = this.solverMethod === "lbl" ? "status.solveDoneLBL" : "status.solveDoneOptimal";
      this.statusBar.setStatus(solverKey, { n: this.solutionMoves.length }, "success");
    }
  }

  clearSolutionView() {
    this.stopAuto();
    this.view?.clearHighlights();
    this.solutionMoves = [];
    this.solutionPhases = [];
    this.currentStep = 0;
    this.initialStickerState = null;
    this.playbackCP = null;
    this.playbackCO = null;
    
    this.stepsList.setSteps([], []);
    this.updatePlayButtons();
  }

  updatePlayButtons() {
    const hasSolution = this.solutionMoves.length > 0;
    this.playbackControls.setDisabled(!hasSolution);
    this.playbackControls.setPlaying(this.playing);
    this.playbackControls.updateUI();
  }

  updateControlsState() {
    // Disable inputs / controls when busy
    const elementsToDisable = [
      this.randomBtn, this.fillSolvedBtn, this.clearBtn, this.solveBtn
    ];
    elementsToDisable.forEach(el => {
      if (el) el.disabled = this.animationBusy;
    });

    this.playbackControls.setDisabled(this.animationBusy);
  }

  async handleResetPlay() {
    if (!this.initialStickerState || this.animationBusy) return;
    this.stopAuto();
    this.animationBusy = true;
    this.updateControlsState();

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
    this.stepsList.setCurrentStep(0);
    
    this.animationBusy = false;
    this.updateControlsState();
    this.updatePlayButtons();
    this.statusBar.setStatus("status.backToStart", {}, "success");
  }

  async playPrevStep() {
    if (this.animationBusy || this.currentStep <= 0) return;
    this.stopAuto();
    this.animationBusy = true;
    this.updateControlsState();

    this.currentStep -= 1;
    const moveId = this.solutionMoves[this.currentStep];
    // Invert the move
    const inverseMoveId = moveId % 3 === 0 ? moveId + 2 : (moveId % 3 === 2 ? moveId - 2 : moveId);
    
    await this.view.animateMove(inverseMoveId, 270);
    this.stepsList.setCurrentStep(this.currentStep);

    if (this.currentStep === 0) {
      this.statusBar.setStatus("status.backToStart", {}, "success");
    } else {
      this.statusBar.setStatus("status.backStep", { current: this.currentStep, total: this.solutionMoves.length });
    }

    this.animationBusy = false;
    this.updateControlsState();
    this.updatePlayButtons();
  }

  async jumpToStep(targetStep) {
    if (this.animationBusy || targetStep === this.currentStep) return;
    this.stopAuto();
    this.animationBusy = true;
    this.updateControlsState();

    this.view.buildCubeFromState(this.initialStickerState);
    for (let i = 0; i < targetStep; i++) {
      this.view.applyMoveImmediate(this.solutionMoves[i]);
    }

    this.currentStep = targetStep;
    this.stepsList.setCurrentStep(targetStep);

    if (this.currentStep === 0) {
      this.statusBar.setStatus("status.backToStart", {}, "success");
    } else if (this.currentStep >= this.solutionMoves.length) {
      this.statusBar.setStatus("status.solvedComplete", {}, "success");
    } else {
      this.statusBar.setStatus("status.forwardStep", { current: this.currentStep, total: this.solutionMoves.length });
    }

    this.animationBusy = false;
    this.updateControlsState();
    this.updatePlayButtons();
  }

  async playOneStep() {
    if (this.animationBusy || this.currentStep >= this.solutionMoves.length) return;
    if (!this.playbackCP || !this.playbackCO) {
      this.statusBar.setStatus("status.notScrambled", {}, "error");
      return;
    }

    this.animationBusy = true;
    this.updateControlsState();

    const move = this.solutionMoves[this.currentStep];
    await this.view.animateMove(move, 290);

    const face = Math.floor(move / 3);
    const turns = (move % 3) + 1;
    this.playbackCP = applyMoveCPMulti(this.playbackCP, face, turns);
    this.playbackCO = applyMoveCOMulti(this.playbackCO, face, turns);

    this.stickerState = cubieToStickerState(this.playbackCP, this.playbackCO);
    this.view.buildCubeFromState(this.stickerState);

    this.currentStep += 1;
    this.stepsList.setCurrentStep(this.currentStep);

    if (this.currentStep >= this.solutionMoves.length) {
      this.statusBar.setStatus("status.solvedComplete", {}, "success");
      this.stopAuto();
    } else {
      this.statusBar.setStatus("status.stepDescription", { current: this.currentStep, total: this.solutionMoves.length });
    }

    this.animationBusy = false;
    this.updateControlsState();
    this.updatePlayButtons();
  }

  async toggleAutoPlay() {
    if (this.animationBusy) return;
    if (!this.playing) {
      this.playing = true;
      this.updatePlayButtons();
      
      while (this.playing && this.currentStep < this.solutionMoves.length) {
        await this.playOneStep();
        if (!this.playing) break;
        await wait(220);
      }
      
      this.playing = false;
      this.updatePlayButtons();
      return;
    }

    this.stopAuto();
  }

  stopAuto() {
    this.playing = false;
    this.updatePlayButtons();
  }

  createRandomIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute("class", "w-4 h-4");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 4c.83 0 1.5.67 1.5 1.5S12.83 10 12 10s-1.5-.67-1.5-1.5S11.17 7 12 7zm0 10c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-5-5c-.83 0-1.5-.67-1.5-1.5S6.17 9 7 9s1.5.67 1.5 1.5S7.83 12 7 12zm10 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z");
    svg.appendChild(path);
    return svg;
  }
}
export default TwoByTwoPageController;

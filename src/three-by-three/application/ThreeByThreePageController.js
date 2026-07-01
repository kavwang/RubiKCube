import { FACE_COLORS, FACE_ORDER } from "../domain/three-by-three-constants.js";
import { createCubeEngine } from "../domain/three-by-three-cube-engine.js";
import { ThreeByThreeCubeView } from "../infrastructure/three-by-three-cube-view.js";

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

function translateDomainError3x3(msg) {
  if (!msg) return "";
  if (msg.includes("尚未上色") || msg.includes("未填滿")) {
    return i18n.t("status.stickersEmpty");
  }
  if (msg.includes("顏色數量不正確")) {
    const match = msg.match(/([UDFRBL])\s*面顏色數量不是\s*\d+\s*（目前為\s*(\d+)）/);
    if (match) {
      return i18n.t("status.invalidColorCounts", { face: match[1], count: match[2] });
    }
    return i18n.t("status.stickersEmpty");
  }
  if (msg.includes("不支援的步驟記號")) {
    const match = msg.match(/不支援的步驟記號：([^\s（]+)/);
    if (match) {
      return i18n.t("status.invalidScramble", { token: match[1] });
    }
    return i18n.t("status.pleaseScramble");
  }
  if (msg.includes("角塊朝向") || msg.includes("方向錯誤")) {
    return i18n.t("status.wrongOrientations");
  }
  return msg;
}

export class ThreeByThreePageController {
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
    this.cubeSource = "manual";

    // Solver Worker
    this.solverWorker = new Worker(new URL("./three-by-three-solver.worker.js", import.meta.url), { type: "module" });
    this.solverWorker.onmessage = this.handleSolverResponse.bind(this);

    // i18n setup
    i18n.init();

    // Setup UI components
    this.setupUI();

    // Setup 3D Cube View
    this.view = new ThreeByThreeCubeView({
      viewerEl: byId("viewer", this.doc),
      onStickerClick: (key) => this.onStickerClick(key),
      fpsCounterEl: byId("fpsCounter", this.doc)
    });

    this.initStickerState();
    this.statusBar.setStatus("status.pleaseScramble");

    i18n.updateDOM(this.doc);
  }

  initStickerState() {
    this.stickerState = new Map();
    for (const [key, sticker] of this.view.stickerByKey.entries()) {
      this.stickerState.set(key, sticker.userData.face);
    }
  }

  setupUI() {
    const headerContainer = byId("header-container", this.doc);
    const panelContainer = byId("panel-container", this.doc);

    // 1. App Header
    new AppHeader(headerContainer, {
      titleKey: "home.card3x3.title",
      showBackBtn: true
    });

    // 2. Panel component
    this.panel = new Panel(panelContainer, {
      titleKey: "home.card3x3.title"
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

    // Scramble formula section
    const scrambleGroup = createElement("div", {
      className: "flex flex-col gap-2 w-full"
    });

    const scrambleLabel = createElement("label", {
      className: "text-xs font-semibold text-text-secondary tracking-wide uppercase",
      "data-i18n": "common.formulaLabel"
    }, [i18n.t("common.formulaLabel")]);

    this.scrambleInput = createElement("textarea", {
      id: "scrambleInput",
      className: "input-apple w-full h-16 resize-none font-mono text-sm",
      "data-i18n-placeholder": "common.formulaPlaceholder",
      placeholder: i18n.t("common.formulaPlaceholder")
    });

    this.applyBtn = createElement("button", {
      className: "btn-apple flex items-center justify-center gap-2 h-10 text-xs font-medium rounded-lg border border-border-primary w-full",
      onclick: () => this.applyScrambleFromInput()
    }, [
      createElement("span", { "data-i18n": "common.applyFormula" }, [i18n.t("common.applyFormula")])
    ]);

    scrambleGroup.appendChild(scrambleLabel);
    scrambleGroup.appendChild(this.scrambleInput);
    scrambleGroup.appendChild(this.applyBtn);
    this.editPanelEl.appendChild(scrambleGroup);

    // Palette Section
    this.palette = new ColorPalette(this.editPanelEl, {
      activeColor: "U",
      onColorSelect: (colorKey) => {
        this.selectedFace = colorKey;
      }
    });

    // Edit actions row
    const editActions = createElement("div", {
      className: "flex flex-col gap-2.5 w-full mt-2"
    });

    this.randomBtn = createElement("button", {
      className: "btn-apple flex items-center justify-center gap-2 h-11 text-sm font-semibold rounded-xl border border-border-primary w-full",
      onclick: () => this.handleRandomScramble()
    }, [
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
      method2Key: "solver.fastest3x3",
      activeMethod: "lbl",
      onChange: (method) => {
        if (!this.animationBusy) this.setSolverMethod(method);
      }
    });

    this.solveBtn = createElement("button", {
      className: "btn-apple btn-apple-primary flex items-center justify-center gap-2 h-12 text-sm font-semibold rounded-xl w-full shadow-lg shadow-accent-blue/15",
      onclick: () => this.solveCurrentScramble()
    }, [
      createElement("span", { "data-i18n": "common.solve" }, [i18n.t("common.solve")])
    ]);
    this.solvePanelEl.appendChild(this.solveBtn);

    this.statusBar = new StatusBar(this.panel.footerEl, {
      initialKey: "status.pleaseScramble"
    });

    this.playbackControls = new PlaybackControls(this.panel.footerEl, {
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

  onStickerClick(key) {
    if (this.animationBusy || this.currentMode !== "edit") return;
    this.cubeSource = "manual";
    this.stickerState.set(key, this.selectedFace);
    this.view.setStickerFace(key, this.selectedFace);
    this.clearSolutionView();
  }

  setMode(mode) {
    this.currentMode = mode;
    this.clearSolutionView();

    if (mode === "edit") {
      this.editPanelEl.classList.remove("hidden");
      this.solvePanelEl.classList.add("hidden");
      this.panel.showFooter(false);
    } else {
      this.solvePanelEl.classList.remove("hidden");
      this.editPanelEl.classList.add("hidden");
      this.statusBar.setStatus("status.solveReady");
      this.panel.showFooter(true);
    }
  }

  setSolverMethod(method) {
    this.solverMethod = method;
    this.clearSolutionView();
    const methodText = i18n.t(method === "lbl" ? "solver.lbl" : "solver.fastest3x3");
    this.statusBar.setRawText(i18n.t("status.solveReady") + ` (${methodText})`);
  }

  handleRandomScramble() {
    this.scrambleInput.value = this.engine.makeRandomScramble(20);
    this.applyScrambleFromInput();
  }

  handleFillSolved() {
    if (this.animationBusy) return;
    this.cubeSource = "manual";
    this.resetToSolvedState();
    this.clearSolutionView();
    this.statusBar.setStatus("status.manualSolveInfo", {}, "success");
  }

  handleClearColors() {
    if (this.animationBusy) return;
    this.cubeSource = "manual";
    for (const key of this.stickerState.keys()) {
      this.stickerState.set(key, null);
    }
    this.view.setStickerState(this.stickerState);
    this.clearSolutionView();
    this.statusBar.setStatus("status.clearedInfo", {}, "warning");
  }

  resetToSolvedState() {
    this.view.resetToSolved();
    this.initStickerState();
  }

  applyScrambleFromInput() {
    if (this.animationBusy) return;
    const parsed = this.engine.parseMoves(this.scrambleInput.value);
    if (!parsed.ok) {
      this.statusBar.setRawText(translateDomainError3x3(parsed.message), "error");
      return;
    }

    this.scrambleMoves = parsed.moves;
    this.cubeSource = "formula";
    this.resetToSolvedState();
    for (const move of this.scrambleMoves) this.view.applyMoveImmediate(move);
    this.clearSolutionView();
    this.statusBar.setRawText(
      i18n.t("status.scrambleApplied", { n: this.scrambleMoves.length }),
      "success"
    );
  }

  solveCurrentScramble() {
    if (this.animationBusy) return;

    let scrambleState;
    if (this.cubeSource === "manual") {
      const decoded = this.engine.decodeCubeFromStickers(this.stickerState);
      if (!decoded.ok) {
        this.statusBar.setRawText(translateDomainError3x3(decoded.message), "error");
        return;
      }
      scrambleState = decoded.state;
      this.initialStickerState = new Map(this.stickerState);
      this.scrambleMoves = [];
    } else {
      const parsed = this.engine.parseMoves(this.scrambleInput.value);
      if (!parsed.ok) {
        this.statusBar.setRawText(translateDomainError3x3(parsed.message), "error");
        return;
      }
      this.scrambleMoves = parsed.moves;
      this.resetToSolvedState();
      for (const move of this.scrambleMoves) this.view.applyMoveImmediate(move);
      scrambleState = this.engine.applyMovesToSolvedFacelets(this.scrambleMoves);
      this.initialStickerState = null;
    }

    this.statusBar.setStatus("status.solving");
    this.animationBusy = true;
    this.updateControlsState();

    this.solverWorker.postMessage({
      scrambleState,
      method: this.solverMethod
    });
  }

  handleSolverResponse(e) {
    this.animationBusy = false;
    this.updateControlsState();

    const plan = e.data;
    if (!plan.ok) {
      this.statusBar.setRawText(translateDomainError3x3(plan.message), "error");
      this.clearSolutionView();
      return;
    }

    this.solutionMoves = [];
    this.solutionPhases = [];
    
    let oldIdx = 0;
    let newIdx = 0;
    let currentPhase = 0;
    const planPhases = plan.phases || [];

    for (const move of plan.moves) {
      if (currentPhase < planPhases.length && planPhases[currentPhase].startIdx === oldIdx) {
        this.solutionPhases.push({ name: planPhases[currentPhase].name, startIdx: newIdx });
        currentPhase++;
      }
      
      if (move.endsWith("2")) {
        const halfMove = move[0];
        this.solutionMoves.push(halfMove, halfMove);
        newIdx += 2;
      } else {
        this.solutionMoves.push(move);
        newIdx += 1;
      }
      oldIdx++;
    }
    
    if (currentPhase < planPhases.length && planPhases[currentPhase].startIdx === oldIdx) {
      this.solutionPhases.push({ name: planPhases[currentPhase].name, startIdx: newIdx });
    }

    this.currentStep = 0;
    this.stepsList.setSteps(this.solutionMoves, this.solutionPhases, this.currentStep);
    this.updatePlayButtons();

    if (!this.solutionMoves.length) {
      this.statusBar.setStatus("status.solvedAlready", {}, "success");
    } else {
      const solverKey = this.solverMethod === "lbl" ? "status.solveDoneLBL" : "status.solveDoneKociemba";
      this.statusBar.setStatus(solverKey, { n: this.solutionMoves.length }, "success");
    }
  }

  clearSolutionView() {
    this.stopAuto();
    this.solutionMoves = [];
    this.solutionPhases = [];
    this.currentStep = 0;
    this.initialStickerState = null;
    
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
    const elementsToDisable = [
      this.randomBtn, this.applyBtn, this.fillSolvedBtn, this.clearBtn, this.solveBtn
    ];
    elementsToDisable.forEach(el => {
      if (el) el.disabled = this.animationBusy;
    });

    this.playbackControls.setDisabled(this.animationBusy);
  }

  async handleResetPlay() {
    if (this.animationBusy) return;
    this.stopAuto();
    this.animationBusy = true;
    this.updateControlsState();

    this.resetToSolvedState();
    if (this.initialStickerState) {
      this.view.setStickerState(this.initialStickerState);
      this.stickerState = new Map(this.initialStickerState);
    } else {
      for (const move of this.scrambleMoves) this.view.applyMoveImmediate(move);
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
    const move = this.solutionMoves[this.currentStep];
    const inverseMove = move.endsWith("'") ? move[0] : move + "'";
    
    await this.view.animateMove(inverseMove, 270);
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

    this.resetToSolvedState();
    if (this.initialStickerState) {
      this.view.setStickerState(this.initialStickerState);
      this.stickerState = new Map(this.initialStickerState);
    } else {
      for (const move of this.scrambleMoves) this.view.applyMoveImmediate(move);
    }

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

    this.animationBusy = true;
    this.updateControlsState();

    await this.view.animateMove(this.solutionMoves[this.currentStep], 270);
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
        await wait(180);
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
export default ThreeByThreePageController;

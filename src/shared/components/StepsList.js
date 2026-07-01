import { createElement } from '../utils/dom-helpers.js';
import i18n from '../../i18n/i18n.js';
import { describeMove } from '../utils/move-description.js';

const PHASE_KEYS = {
  // 2x2 LBL
  "第一階段：復原第一層": "phases.lbl_2x2_p1",
  "第二階段：對齊底面方向 (OLL)": "phases.lbl_2x2_p2",
  "第三階段：調整底層位置 (PLL)": "phases.lbl_2x2_p3",
  "雙向尋優最速解": "phases.optimal_2x2",
  
  // 3x3 LBL
  "第一層：白色十字": "phases.lbl_3x3_p1",
  "第一層：白色角塊": "phases.lbl_3x3_p2",
  "第二層：中層稜塊": "phases.lbl_3x3_p3",
  "第三層：黃十字定向": "phases.lbl_3x3_p4",
  "第三層：黃角定向": "phases.lbl_3x3_p5",
  "第三層：頂角置換": "phases.lbl_3x3_p6",
  "第三層：頂稜置換": "phases.lbl_3x3_p7",
  
  // 3x3 Kociemba
  "雙向最速解還原步驟": "phases.optimal_3x3",
  "最速解還原步驟": "phases.optimal_3x3"
};

export class StepsList {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options; // onStepClick
    this.moves = [];
    this.phases = [];
    this.currentStep = 0;
    this.stepElements = [];
    this.init();
  }

  init() {
    this.render();
    i18n.onLanguageChange(() => this.updateUI());
  }

  setSteps(moves, phases, currentStep = 0) {
    this.moves = moves;
    this.phases = phases;
    this.currentStep = currentStep;
    this.renderList();
  }

  setCurrentStep(step) {
    this.currentStep = step;
    this.updateActiveStep();
  }

  render() {
    this.wrapper = createElement('div', {
      className: 'flex flex-col gap-3 w-full flex-1 overflow-hidden'
    });

    const header = createElement('div', {
      className: 'flex items-center justify-between'
    });

    const title = createElement('h3', {
      className: 'text-sm font-semibold text-text-secondary tracking-wide uppercase',
      'data-i18n': 'common.stepsTitle'
    }, [
      i18n.t('common.stepsTitle')
    ]);

    this.counter = createElement('span', {
      className: 'text-xs font-semibold px-2 py-0.5 bg-accent-blue/10 text-accent-blue rounded-full'
    }, ['0 / 0']);

    header.appendChild(title);
    header.appendChild(this.counter);
    this.wrapper.appendChild(header);

    // List container
    this.listContainer = createElement('div', {
      className: 'flex-1 overflow-y-auto border border-border-primary rounded-2xl bg-black/5 dark:bg-white/5 p-2 h-[200px] min-h-[150px]'
    });

    this.listEl = createElement('ol', {
      className: 'flex flex-col gap-1.5 list-none p-0 m-0'
    });

    this.listContainer.appendChild(this.listEl);
    this.wrapper.appendChild(this.listContainer);
    this.container.appendChild(this.wrapper);
  }

  renderList() {
    this.listEl.innerHTML = '';
    this.stepElements = [];

    if (this.moves.length === 0) {
      this.counter.textContent = '0 / 0';
      return;
    }

    this.counter.textContent = `${this.currentStep} / ${this.moves.length}`;

    let phaseIndex = 0;
    this.moves.forEach((move, idx) => {
      // Check if this index starts a new phase
      const currentPhase = this.phases.find(p => p.startIdx === idx);
      if (currentPhase) {
        const phaseName = PHASE_KEYS[currentPhase.name] 
          ? i18n.t(PHASE_KEYS[currentPhase.name]) 
          : currentPhase.name;

        const header = createElement('div', {
          className: 'text-xs font-bold text-accent-blue uppercase tracking-wider mt-3 mb-1.5 px-3 border-l-2 border-accent-blue'
        }, [phaseName]);
        this.listEl.appendChild(header);
      }

      // Step element
      const desc = describeMove(move, i18n);
      const li = createElement('li', {
        className: 'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all duration-200 hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary border border-transparent',
        onclick: () => this.options.onStepClick && this.options.onStepClick(idx + 1)
      }, [
        createElement('span', { className: 'flex-1 truncate' }, [`${idx + 1}. ${desc}`])
      ]);

      this.stepElements.push(li);
      this.listEl.appendChild(li);
    });

    this.updateActiveStep();
  }

  updateActiveStep() {
    this.counter.textContent = `${this.currentStep} / ${this.moves.length}`;

    this.stepElements.forEach((el, idx) => {
      if (idx === this.currentStep - 1) {
        el.classList.add('bg-accent-blue/15', 'text-accent-blue', 'border-accent-blue/20', 'font-semibold');
        el.classList.remove('text-text-secondary');
        
        // Scroll active step into view smoothly
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        el.classList.remove('bg-accent-blue/15', 'text-accent-blue', 'border-accent-blue/20', 'font-semibold');
        el.classList.add('text-text-secondary');
      }
    });
  }

  updateUI() {
    // Rerender list to apply new translations
    this.renderList();
  }
}

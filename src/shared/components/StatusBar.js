import { createElement } from '../utils/dom-helpers.js';
import i18n from '../../i18n/i18n.js';

export class StatusBar {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.statusKey = options.initialKey || 'status.initializing';
    this.statusVars = options.initialVars || {};
    this.customText = null;
    this.type = 'info'; // info, success, warning, error
    this.init();
  }

  init() {
    this.render();
    i18n.onLanguageChange(() => this.updateUI());
  }

  setStatus(key, variables = {}, type = 'info') {
    this.statusKey = key;
    this.statusVars = variables;
    this.customText = null;
    this.type = type;
    this.updateUI();
  }

  setRawText(text, type = 'info') {
    this.customText = text;
    this.statusKey = null;
    this.statusVars = {};
    this.type = type;
    this.updateUI();
  }

  render() {
    this.wrapper = createElement('div', {
      className: 'statusBar border border-border-primary rounded-2xl bg-black/5 dark:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all duration-300'
    });

    // Pulse dot
    this.dot = createElement('span', {
      className: 'w-2 h-2 rounded-full bg-accent-blue animate-pulse'
    });
    this.wrapper.appendChild(this.dot);

    // Text label
    this.textEl = createElement('p', {
      className: 'text-xs font-semibold text-text-primary m-0 leading-relaxed'
    });
    this.wrapper.appendChild(this.textEl);

    this.container.appendChild(this.wrapper);
    this.updateUI();
  }

  updateUI() {
    if (!this.textEl) return;

    // Apply color depending on type
    this.dot.className = 'w-2 h-2 rounded-full animate-pulse';
    this.wrapper.className = 'border rounded-2xl px-4 py-3 flex items-center gap-3 transition-all duration-300';

    if (this.type === 'error') {
      this.dot.classList.add('bg-red-500');
      this.wrapper.classList.add('border-red-500/20', 'bg-red-500/5');
    } else if (this.type === 'success') {
      this.dot.classList.add('bg-green-500');
      this.wrapper.classList.add('border-green-500/20', 'bg-green-500/5');
    } else if (this.type === 'warning') {
      this.dot.classList.add('bg-amber-500');
      this.wrapper.classList.add('border-amber-500/20', 'bg-amber-500/5');
    } else {
      // Info
      this.dot.classList.add('bg-accent-blue');
      this.wrapper.classList.add('border-border-primary', 'bg-black/5', 'dark:bg-white/5');
    }

    if (this.customText) {
      this.textEl.textContent = this.customText;
    } else if (this.statusKey) {
      this.textEl.textContent = i18n.t(this.statusKey, this.statusVars);
    }
  }
}

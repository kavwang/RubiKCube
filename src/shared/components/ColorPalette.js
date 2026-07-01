import { createElement } from '../utils/dom-helpers.js';
import i18n from '../../i18n/i18n.js';

export const PALETTE_COLORS = {
  U: { hex: "#ffffff", nameKey: "colors.white" },
  R: { hex: "#e63946", nameKey: "colors.red" },
  F: { hex: "#00e676", nameKey: "colors.green" },
  D: { hex: "#ffea00", nameKey: "colors.yellow" },
  L: { hex: "#ff6d00", nameKey: "colors.orange" },
  B: { hex: "#2979ff", nameKey: "colors.blue" }
};

export class ColorPalette {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options; // onColorSelect, activeColor
    this.activeColor = options.activeColor || 'U';
    this.buttons = {};
    this.init();
  }

  init() {
    this.render();
    i18n.onLanguageChange(() => this.updateLabels());
  }

  select(colorKey) {
    this.activeColor = colorKey;
    this.updateUI();
    if (this.options.onColorSelect) {
      this.options.onColorSelect(colorKey);
    }
  }

  render() {
    this.paletteEl = createElement('div', {
      className: 'grid grid-cols-3 gap-2 w-full'
    });

    Object.entries(PALETTE_COLORS).forEach(([key, info]) => {
      const swatch = createElement('span', {
        className: 'w-4 h-4 rounded border border-black/10 shrink-0 transition-transform duration-200',
        style: { backgroundColor: info.hex }
      });

      const label = createElement('span', {
        className: 'text-xs font-medium text-text-primary',
        'data-i18n': info.nameKey
      }, [
        `${i18n.t(info.nameKey)} (${key})`
      ]);

      const btn = createElement('button', {
        className: 'btn-apple flex items-center justify-start gap-2.5 px-3 py-2 rounded-xl border border-border-primary hover:border-accent-blue/30 transition-all duration-200',
        onclick: () => this.select(key)
      }, [
        swatch,
        label
      ]);

      this.buttons[key] = { btn, swatch, label };
      this.paletteEl.appendChild(btn);
    });

    this.updateUI();
    this.container.appendChild(this.paletteEl);
  }

  updateUI() {
    Object.entries(this.buttons).forEach(([key, { btn, swatch }]) => {
      if (key === this.activeColor) {
        btn.classList.add('border-accent-blue/60', 'bg-accent-blue/5', 'dark:bg-accent-blue/10');
        swatch.classList.add('scale-110');
      } else {
        btn.classList.remove('border-accent-blue/60', 'bg-accent-blue/5', 'dark:bg-accent-blue/10');
        swatch.classList.remove('scale-110');
      }
    });
  }

  updateLabels() {
    Object.entries(this.buttons).forEach(([key, { label }]) => {
      const info = PALETTE_COLORS[key];
      label.textContent = `${i18n.t(info.nameKey)} (${key})`;
    });
  }
}

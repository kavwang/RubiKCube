import { createElement } from '../utils/dom-helpers.js';
import i18n from '../../i18n/i18n.js';

export class SegmentedControl {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options; // segments [{ id, textKey }], onChange, activeId
    this.activeId = options.activeId || options.segments[0].id;
    this.buttons = {};
    this.init();
  }

  init() {
    this.render();
    i18n.onLanguageChange(() => this.updateLabels());
  }

  select(id) {
    if (this.activeId === id) return;
    this.activeId = id;
    this.updateUI();
    if (this.options.onChange) {
      this.options.onChange(id);
    }
  }

  render() {
    this.controlEl = createElement('div', {
      className: 'segmented-control w-full'
    });

    this.options.segments.forEach(seg => {
      const btn = createElement('button', {
        className: 'segmented-btn',
        'data-i18n': seg.textKey,
        onclick: () => this.select(seg.id)
      }, [
        i18n.t(seg.textKey)
      ]);

      this.buttons[seg.id] = btn;
      this.controlEl.appendChild(btn);
    });

    this.updateUI();
    this.container.appendChild(this.controlEl);
  }

  updateUI() {
    Object.entries(this.buttons).forEach(([id, btn]) => {
      if (id === this.activeId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  updateLabels() {
    this.options.segments.forEach(seg => {
      const btn = this.buttons[seg.id];
      if (btn) {
        btn.textContent = i18n.t(seg.textKey);
      }
    });
  }
}

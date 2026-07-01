import { createElement } from '../utils/dom-helpers.js';
import i18n from '../../i18n/i18n.js';

export class LanguageSwitcher {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.init();
  }

  init() {
    this.render();
    i18n.onLanguageChange(() => this.updateUI());
  }

  toggle() {
    const nextLocale = i18n.locale === 'zh-TW' ? 'en' : 'zh-TW';
    i18n.setLocale(nextLocale);
  }

  render() {
    this.button = createElement('button', {
      className: 'btn-apple text-xs font-semibold px-2.5 py-1.5 min-w-[50px] text-center border border-border-primary rounded-lg',
      'aria-label': 'Switch Language',
      'data-i18n-title': 'common.langToggle',
      onclick: () => this.toggle()
    });

    this.updateUI();
    this.container.appendChild(this.button);
  }

  updateUI() {
    if (!this.button) return;
    // Show the target language option
    this.button.textContent = i18n.locale === 'zh-TW' ? 'EN' : '繁中';
  }
}

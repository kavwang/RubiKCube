import { createElement } from '../utils/dom-helpers.js';

export class ThemeToggle {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.theme = 'light';
    this.init();
  }

  init() {
    // Detect theme
    const savedTheme = localStorage.getItem('rubik-theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      this.theme = savedTheme;
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.theme = prefersDark ? 'dark' : 'light';
    }

    this.applyTheme(this.theme);
    this.render();
  }

  applyTheme(theme) {
    this.theme = theme;
    localStorage.setItem('rubik-theme', theme);
    const htmlEl = document.documentElement;

    if (theme === 'dark') {
      htmlEl.classList.add('dark');
      htmlEl.classList.remove('light');
    } else {
      htmlEl.classList.add('light');
      htmlEl.classList.remove('dark');
    }

    // Fire custom themechange event
    const event = new CustomEvent('themechange', { detail: { theme } });
    window.dispatchEvent(event);
  }

  toggle() {
    const nextTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
    this.updateUI();
  }

  render() {
    this.button = createElement('button', {
      className: 'btn-apple w-10 h-10 flex items-center justify-center p-0 rounded-full',
      'aria-label': 'Toggle Theme',
      'data-i18n-title': 'common.themeToggle',
      onclick: () => this.toggle()
    });

    this.updateUI();
    this.container.appendChild(this.button);
  }

  updateUI() {
    if (!this.button) return;
    
    // Apple-style clean icons using SVG
    const sunIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m0 13.5V21M9.75 12h4.5M12 9.75h.008v.008H12v-.008zM17.657 6.343l-1.59 1.59M6.343 17.657l-1.59 1.59M21 12h-2.25M5.25 12H3m14.657 5.657l-1.59-1.59M6.343 6.343L4.753 4.753M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
      </svg>
    `;

    const moonIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
      </svg>
    `;

    this.button.innerHTML = this.theme === 'dark' ? sunIcon : moonIcon;
  }
}

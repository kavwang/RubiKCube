import { createElement } from '../utils/dom-helpers.js';
import { ThemeToggle } from './ThemeToggle.js';
import { LanguageSwitcher } from './LanguageSwitcher.js';
import i18n from '../../i18n/i18n.js';

export class AppHeader {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options; // titleKey, showBackBtn
    this.init();
  }

  init() {
    this.render();
  }

  render() {
    // Header container
    const header = createElement('header', {
      className: 'w-full px-6 py-4 flex items-center justify-between border-b border-border-primary bg-surface-panel/40 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300'
    });

    // Left side: Title and Back button
    const leftSide = createElement('div', {
      className: 'flex items-center gap-4'
    });

    if (this.options.showBackBtn) {
      const backBtn = createElement('a', {
        href: './index.html',
        className: 'btn-apple text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-primary',
        'data-i18n': 'common.backHome'
      }, [
        // Left arrow SVG
        createElement('span', { className: 'flex items-center' }, [
          this.createBackIcon()
        ]),
        i18n.t('common.backHome')
      ]);
      leftSide.appendChild(backBtn);
    }

    const title = createElement('h1', {
      className: 'text-lg font-semibold tracking-tight text-text-primary hidden sm:block',
      'data-i18n': this.options.titleKey
    }, [
      i18n.t(this.options.titleKey)
    ]);
    
    leftSide.appendChild(title);
    header.appendChild(leftSide);

    // Right side: Settings (Lang + Theme)
    const rightSide = createElement('div', {
      className: 'flex items-center gap-3'
    });

    new LanguageSwitcher(rightSide);
    new ThemeToggle(rightSide);

    header.appendChild(rightSide);
    this.container.appendChild(header);
  }

  createBackIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.5');
    svg.setAttribute('class', 'w-4 h-4');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('d', 'M15.75 19.5L8.25 12l7.5-7.5');
    
    svg.appendChild(path);
    return svg;
  }
}

import { createElement } from '../utils/dom-helpers.js';
import i18n from '../../i18n/i18n.js';

export class Panel {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options; // onToggleCollapse
    this.collapsed = false;
    this.init();
  }

  init() {
    this.render();
  }

  toggle() {
    this.collapsed = !this.collapsed;
    this.updateUI();
    if (this.options.onToggleCollapse) {
      this.options.onToggleCollapse(this.collapsed);
    }
  }

  render() {
    // Left side/bottom panel
    this.panelEl = createElement('section', {
      id: 'controlPanel',
      className: 'panel-apple flex flex-col w-full md:w-[380px] h-[52vh] md:h-[calc(100vh-76px)] fixed md:sticky bottom-0 left-0 md:top-[76px] z-40 rounded-t-3xl md:rounded-tr-3xl md:rounded-bl-none overflow-hidden transition-all duration-300'
    });

    // Header inside panel
    const panelHeader = createElement('div', {
      className: 'flex items-center justify-between px-5 py-4 border-b border-border-primary'
    });

    this.titleEl = createElement('span', {
      className: 'text-sm font-semibold text-text-secondary tracking-wide uppercase',
      'data-i18n': this.options.titleKey
    }, [
      i18n.t(this.options.titleKey)
    ]);
    panelHeader.appendChild(this.titleEl);

    // Toggle button for collapse (usually only visible on mobile or as a small tab)
    this.toggleBtn = createElement('button', {
      id: 'togglePanelBtn',
      className: 'btn-apple text-xs px-2.5 py-1 rounded-lg border border-border-primary md:hidden',
      onclick: () => this.toggle()
    });
    panelHeader.appendChild(this.toggleBtn);
    this.panelEl.appendChild(panelHeader);

    // Content area inside panel
    this.contentEl = createElement('div', {
      className: 'flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5 transition-opacity duration-200'
    });
    this.panelEl.appendChild(this.contentEl);

    this.updateUI();
    this.container.appendChild(this.panelEl);
  }

  updateUI() {
    if (!this.panelEl) return;

    if (this.collapsed) {
      // Mobile collapse: height 64px, hide contents
      this.panelEl.classList.add('h-[64px]', 'md:h-[64px]', 'md:w-[380px]');
      this.panelEl.classList.remove('h-[52vh]', 'md:h-[calc(100vh-76px)]');
      this.contentEl.classList.add('opacity-0', 'pointer-events-none');
      this.toggleBtn.textContent = i18n.t('common.expandPanel');
      this.toggleBtn.setAttribute('data-i18n', 'common.expandPanel');
    } else {
      // Expanded
      this.panelEl.classList.remove('h-[64px]', 'md:h-[64px]');
      this.panelEl.classList.add('h-[52vh]', 'md:h-[calc(100vh-76px)]', 'md:w-[380px]');
      this.contentEl.classList.remove('opacity-0', 'pointer-events-none');
      this.toggleBtn.textContent = i18n.t('common.collapsePanel');
      this.toggleBtn.setAttribute('data-i18n', 'common.collapsePanel');
    }
  }

  appendChild(el) {
    this.contentEl.appendChild(el);
  }
}

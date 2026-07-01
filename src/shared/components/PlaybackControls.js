import { createElement } from '../utils/dom-helpers.js';
import i18n from '../../i18n/i18n.js';

export class PlaybackControls {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options; // onReset, onPrev, onNext, onAutoToggle
    this.playing = false;
    this.disabled = false;
    this.init();
  }

  init() {
    this.render();
    i18n.onLanguageChange(() => this.updateLabels());
  }

  setPlaying(playing) {
    this.playing = playing;
    this.updateUI();
  }

  setDisabled(disabled) {
    this.disabled = disabled;
    this.updateUI();
  }

  render() {
    // Container for playback buttons
    this.wrapper = createElement('div', {
      className: 'flex flex-col gap-3 w-full'
    });

    // Sub-container for Next / Auto main actions
    const mainActions = createElement('div', {
      className: 'grid grid-cols-2 gap-3'
    });

    this.nextBtn = createElement('button', {
      className: 'btn-apple btn-apple-primary flex items-center justify-center gap-2 h-11 text-sm font-semibold rounded-xl',
      onclick: () => this.options.onNext && this.options.onNext()
    }, [
      this.createPlayIcon(),
      createElement('span', { 'data-i18n': 'common.nextStep' }, [i18n.t('common.nextStep')])
    ]);

    this.autoBtn = createElement('button', {
      className: 'btn-apple flex items-center justify-center gap-2 h-11 text-sm font-semibold rounded-xl border border-border-primary',
      onclick: () => this.options.onAutoToggle && this.options.onAutoToggle()
    }, [
      this.createAutoIcon(),
      createElement('span', { 'data-i18n': 'common.autoPlay' }, [i18n.t('common.autoPlay')])
    ]);

    mainActions.appendChild(this.nextBtn);
    mainActions.appendChild(this.autoBtn);
    this.wrapper.appendChild(mainActions);

    // Sub-container for Reset / Prev secondary actions
    const secondaryActions = createElement('div', {
      className: 'grid grid-cols-2 gap-3'
    });

    this.resetBtn = createElement('button', {
      className: 'btn-apple flex items-center justify-center gap-2 h-10 text-xs font-medium rounded-lg border border-border-primary',
      onclick: () => this.options.onReset && this.options.onReset()
    }, [
      this.createResetIcon(),
      createElement('span', { 'data-i18n': 'common.resetPlay' }, [i18n.t('common.resetPlay')])
    ]);

    this.prevBtn = createElement('button', {
      className: 'btn-apple flex items-center justify-center gap-2 h-10 text-xs font-medium rounded-lg border border-border-primary',
      onclick: () => this.options.onPrev && this.options.onPrev()
    }, [
      this.createPrevIcon(),
      createElement('span', { 'data-i18n': 'common.prevStep' }, [i18n.t('common.prevStep')])
    ]);

    secondaryActions.appendChild(this.resetBtn);
    secondaryActions.appendChild(this.prevBtn);
    this.wrapper.appendChild(secondaryActions);

    this.container.appendChild(this.wrapper);
    this.updateUI();
  }

  updateUI() {
    if (!this.nextBtn) return;

    // Disabled state
    this.nextBtn.disabled = this.disabled || this.playing;
    this.prevBtn.disabled = this.disabled || this.playing;
    this.resetBtn.disabled = this.disabled || this.playing;
    this.autoBtn.disabled = this.disabled;

    // Update Auto button text/style when playing
    const textSpan = this.autoBtn.querySelector('span');
    const iconContainer = this.autoBtn.querySelector('svg');

    if (this.playing) {
      if (textSpan) {
        textSpan.textContent = i18n.t('common.stopPlay');
        textSpan.setAttribute('data-i18n', 'common.stopPlay');
      }
      this.autoBtn.classList.add('bg-apple-danger', 'text-red-500', 'border-red-200/20');
      this.autoBtn.innerHTML = '';
      this.autoBtn.appendChild(this.createStopIcon());
      this.autoBtn.appendChild(textSpan);
    } else {
      if (textSpan) {
        textSpan.textContent = i18n.t('common.autoPlay');
        textSpan.setAttribute('data-i18n', 'common.autoPlay');
      }
      this.autoBtn.classList.remove('bg-apple-danger', 'text-red-500', 'border-red-200/20');
      this.autoBtn.innerHTML = '';
      this.autoBtn.appendChild(this.createAutoIcon());
      this.autoBtn.appendChild(textSpan);
    }
  }

  updateLabels() {
    if (!this.nextBtn) return;
    this.nextBtn.querySelector('span').textContent = i18n.t('common.nextStep');
    this.prevBtn.querySelector('span').textContent = i18n.t('common.prevStep');
    this.resetBtn.querySelector('span').textContent = i18n.t('common.resetPlay');
    
    const textSpan = this.autoBtn.querySelector('span');
    if (textSpan) {
      textSpan.textContent = this.playing ? i18n.t('common.stopPlay') : i18n.t('common.autoPlay');
    }
  }

  createPlayIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('class', 'w-4 h-4');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M5.055 7.06C3.805 6.347 2.25 7.25 2.25 8.69v8.122c0 1.44 1.555 2.343 2.805 1.628L12 14.471v2.34c0 1.44 1.555 2.343 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256L14.805 7.06C13.555 6.347 12 7.25 12 8.69v2.34L5.055 7.06z');
    svg.appendChild(path);
    return svg;
  }

  createAutoIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('class', 'w-4 h-4');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M8 5.14v14c0 .866-.464 1.16-1.127.766l-5.11-3.036c-.664-.395-.664-1.066 0-1.46l5.11-3.036c.663-.395 1.127-.1 1.127.766zM22.5 12c0 5.247-4.253 9.5-9.5 9.5a.75.75 0 010-1.5 8 8 0 100-16 .75.75 0 010-1.5c5.247 0 9.5 4.253 9.5 9.5z');
    svg.appendChild(path);
    return svg;
  }

  createStopIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('class', 'w-4 h-4 text-red-500');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M5.25 5.25h13.5v13.5H5.25z');
    svg.appendChild(path);
    return svg;
  }

  createResetIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.5');
    svg.setAttribute('class', 'w-3.5 h-3.5');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('d', 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99');
    svg.appendChild(path);
    return svg;
  }

  createPrevIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('class', 'w-3.5 h-3.5');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M9.195 18.44c1.25.713 2.805-.19 2.805-1.43V8.69c0-1.24-1.555-2.143-2.805-1.43L2.087 11.32c-1.26.72-1.26 2.536 0 3.256l7.108 3.861zm9-8.12v8.12c0 1.24-1.555 2.143-2.805 1.43L8.282 14.471c-1.26-.72-1.26-2.536 0-3.256L15.39 7.06c1.25-.713 2.805.19 2.805 1.43z');
    svg.appendChild(path);
    return svg;
  }
}

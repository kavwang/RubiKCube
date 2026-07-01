import { createElement } from '../utils/dom-helpers.js';
import { SegmentedControl } from './SegmentedControl.js';

export class SolverToggle {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options; // method1Key, method2Key, onChange, activeMethod
    this.init();
  }

  init() {
    this.wrapper = createElement('div', {
      className: 'flex flex-col gap-2 w-full'
    });

    this.segmented = new SegmentedControl(this.wrapper, {
      segments: [
        { id: 'lbl', textKey: this.options.method1Key },
        { id: 'fastest', textKey: this.options.method2Key }
      ],
      activeId: this.options.activeMethod || 'lbl',
      onChange: (id) => {
        if (this.options.onChange) {
          this.options.onChange(id);
        }
      }
    });

    this.container.appendChild(this.wrapper);
  }

  setMethod(method) {
    this.segmented.select(method);
  }
}

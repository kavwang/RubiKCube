import zhTW from './locales/zh-TW.json';
import en from './locales/en.json';

class I18n {
  constructor() {
    this.locales = {
      'zh-TW': zhTW,
      'en': en
    };
    this.locale = 'zh-TW';
    this.listeners = [];
  }

  init() {
    const saved = localStorage.getItem('rubik-lang');
    if (saved && this.locales[saved]) {
      this.locale = saved;
    } else {
      const sysLang = navigator.language;
      if (sysLang.startsWith('zh')) {
        this.locale = 'zh-TW';
      } else {
        this.locale = 'en';
      }
    }
    localStorage.setItem('rubik-lang', this.locale);
    document.documentElement.setAttribute('lang', this.locale);
  }

  setLocale(locale) {
    if (!this.locales[locale]) return;
    this.locale = locale;
    localStorage.setItem('rubik-lang', locale);
    document.documentElement.setAttribute('lang', locale);
    
    // Notify listeners
    this.listeners.forEach(fn => fn(locale));
    
    // Auto update page DOM
    this.updateDOM(document);
  }

  onLanguageChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(fn => fn !== callback);
    };
  }

  t(key, variables = {}) {
    const keys = key.split('.');
    let value = this.locales[this.locale];
    
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        // Fallback to English
        let fallbackValue = this.locales['en'];
        for (const fk of keys) {
          if (fallbackValue && fallbackValue[fk] !== undefined) {
            fallbackValue = fallbackValue[fk];
          } else {
            fallbackValue = null;
            break;
          }
        }
        return fallbackValue || key;
      }
    }

    if (typeof value !== 'string') return key;

    let result = value;
    Object.entries(variables).forEach(([k, v]) => {
      result = result.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g'), v);
    });

    return result;
  }

  updateDOM(root = document) {
    const elements = root.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = this.t(key);
      }
    });

    const placeholders = root.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.setAttribute('placeholder', this.t(key));
      }
    });

    const titles = root.querySelectorAll('[data-i18n-title]');
    titles.forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        el.setAttribute('title', this.t(key));
      }
    });
  }
}

export const i18n = new I18n();
export default i18n;

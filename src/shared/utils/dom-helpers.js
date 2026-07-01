export function byId(id, doc = document) {
  return doc.getElementById(id);
}

export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

export function qsa(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

export function createElement(tag, attrs = {}, children = [], doc = document) {
  const el = doc.createElement(tag);
  Object.entries(attrs).forEach(([key, val]) => {
    if (key === 'className') {
      el.className = val;
    } else if (key === 'style' && typeof val === 'object') {
      Object.assign(el.style, val);
    } else if (key.startsWith('on') && typeof val === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), val);
    } else {
      el.setAttribute(key, val);
    }
  });
  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(doc.createTextNode(child));
    } else if (child instanceof HTMLElement) {
      el.appendChild(child);
    }
  });
  return el;
}

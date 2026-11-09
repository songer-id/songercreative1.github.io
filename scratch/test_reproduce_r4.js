/**
 * test_reproduce_r4.js
 * Reproduce actual handlers for Terjual, Ikon Tiket, and Outline controls
 */

const fs = require('fs');

console.log('=== START REPRODUCTION SCRIPT: TASK 09C-R4 ===');

// Mock DOM
class MockClassList {
  constructor(initial = []) {
    this.classes = new Set(initial);
  }
  add(...cls) { cls.forEach(c => this.classes.add(c)); }
  remove(...cls) { cls.forEach(c => this.classes.delete(c)); }
  contains(cls) { return this.classes.has(cls); }
  toggle(cls, force) {
    if (force !== undefined) {
      if (force) this.classes.add(cls);
      else this.classes.delete(cls);
      return force;
    }
    if (this.classes.has(cls)) {
      this.classes.delete(cls);
      return false;
    }
    this.classes.add(cls);
    return true;
  }
}

class MockElement {
  constructor(id = '', tag = 'div') {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this.classList = new MockClassList();
    this.attributes = {};
    this.style = {};
    this.checked = false;
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.disabled = false;
    this.dataset = {};
    this._listeners = {};
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] || null; }
  removeAttribute(k) { delete this.attributes[k]; }
  closest(sel) {
    return new MockElement('closest-' + sel);
  }
  querySelector(sel) { return null; }
  querySelectorAll(sel) { return []; }
  addEventListener(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  }
  dispatchEvent(eventObj) {
    if (this._listeners[eventObj.type]) {
      this._listeners[eventObj.type].forEach(fn => fn(eventObj));
    }
  }
}

const elementMap = new Map();
function getOrCreate(id, tag = 'div') {
  if (!elementMap.has(id)) {
    elementMap.set(id, new MockElement(id, tag));
  }
  return elementMap.get(id);
}

// Setup basic window and document
global.window = {
  getComputedStyle: () => ({
    getPropertyValue: () => '#059669'
  }),
  lucide: { createIcons: () => {} },
  scrollTo: () => {},
  requestAnimationFrame: (cb) => { if (typeof cb === 'function') cb(); },
  innerWidth: 1200
};

global.document = {
  documentElement: new MockElement('html'),
  getElementById: (id) => elementMap.get(id) || null,
  querySelector: (sel) => null,
  querySelectorAll: (sel) => []
};

// Check pf code for actual functions
const pf = fs.readFileSync('js/product-form.js', 'utf8');
console.log('PF length:', pf.length);

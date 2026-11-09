const fs = require('fs');

// Create mock DOM for ProductForm
class MockClassList {
  constructor() { this.classes = new Set(); }
  add(c) { this.classes.add(c); }
  remove(c) { this.classes.delete(c); }
  contains(c) { return this.classes.has(c); }
}

class MockElement {
  constructor(id, tagName = 'div') {
    this.id = id;
    this.tagName = tagName;
    this.value = '';
    this.checked = false;
    this.textContent = '';
    this.innerHTML = '';
    this.className = '';
    this.classList = new MockClassList();
    this.listeners = {};
    this.style = {};
    this.attrs = {};
  }
  setAttribute(k, v) { this.attrs[k] = v; }
  getAttribute(k) { return this.attrs[k] || null; }
  addEventListener(evt, fn) {
    if (!this.listeners[evt]) this.listeners[evt] = [];
    this.listeners[evt].push(fn);
  }
  closest() { return this; }
  querySelectorAll() { return []; }
}

const elements = new Map();
function getEl(id) {
  if (!elements.has(id)) elements.set(id, new MockElement(id));
  return elements.get(id);
}

// Needed elements
['card-live-preview-box', 'desktop-preview-sidebar', 'desktop-preview-body', 'cfg-simulate-countdown-preview'].forEach(id => getEl(id));

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { href: '', search: '' },
  innerWidth: 1024,
  innerHeight: 768,
  requestAnimationFrame: (cb) => cb()
};
global.requestAnimationFrame = (cb) => cb();

global.document = {
  getElementById: (id) => getEl(id),
  querySelectorAll: () => [],
  querySelector: (sel) => {
    if (sel.includes('card_variant_radio')) return { value: 'A' };
    return null;
  },
  activeElement: null,
  addEventListener: () => {}
};

global.DB = {
  getSettings: () => ({}),
  getCategories: () => []
};

// Now load product-form.js and run!
try {
  require('../js/product-form.js');
  // Trigger updateProductCardLivePreview via syncEyeToggleIcons or handleApplyDefaultCardDesign or toggleCardAccordion
  console.log('Testing handleApplyDefaultCardDesign()...');
  global.window.ProductForm.handleApplyDefaultCardDesign();
  console.log('UNEXPECTED: No error thrown!');
} catch (err) {
  console.log('SUCCESSFULLY REPRODUCED ERROR:');
  console.log(err.name + ': ' + err.message);
  console.log(err.stack.split('\n').slice(0, 5).join('\n'));
}

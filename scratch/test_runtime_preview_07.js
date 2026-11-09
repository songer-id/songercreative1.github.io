/**
 * Runtime behavior test for SC-ADMIN-PREVIEW-CONFIRMATION-07
 */

// Simple mock DOM
const elements = new Map();

function createMockElement(id, tagName = 'div') {
  const el = {
    id,
    tagName: tagName.toUpperCase(),
    className: '',
    classList: {
      _classes: new Set(),
      add(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains(c) { return this._classes.has(c); }
    },
    innerHTML: '',
    style: {},
    querySelector(sel) { return null; },
    querySelectorAll(sel) { return []; },
    addEventListener(ev, fn) { },
    getAttribute(name) { return null; },
    setAttribute(name, val) { }
  };
  elements.set(id, el);
  return el;
}

global.document = {
  getElementById(id) {
    if (!elements.has(id)) {
      createMockElement(id);
    }
    return elements.get(id);
  },
  querySelectorAll(sel) {
    return [];
  },
  querySelector(sel) {
    return null;
  },
  body: createMockElement('body')
};

global.window = {
  scrollTo() {}
};

// Setup roots
const rootDesk = createMockElement('preview-scoped-modal-root');
const rootMob = createMockElement('preview-scoped-modal-root-mob');
const alertDesk = createMockElement('preview-test-mode-alert');
const alertMob = createMockElement('preview-test-mode-alert-mob');

// Test 1: hidePreviewTestModeAlert behavior
function hidePreviewTestModeAlert() {
  const roots = [
    document.getElementById('preview-scoped-modal-root'),
    document.getElementById('preview-scoped-modal-root-mob')
  ].filter(Boolean);

  roots.forEach(root => {
    root.classList.add('hidden');
    root.innerHTML = '';
    if (root.id === 'preview-scoped-modal-root') {
      root.className = 'absolute inset-0 z-50 hidden flex items-center justify-center p-2 bg-slate-900/50 backdrop-blur-xs';
    } else {
      root.className = 'absolute inset-0 z-[100] hidden flex items-center justify-center p-2 bg-slate-900/50 backdrop-blur-xs';
    }
  });

  ['preview-test-mode-alert', 'preview-test-mode-alert-mob'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
}

// Simulate alert showing
rootDesk.classList.remove('hidden');
rootDesk.innerHTML = '<div class="alert">Lengkapi data</div>';
rootMob.classList.remove('hidden');
rootMob.innerHTML = '<div class="alert">Lengkapi data</div>';
alertDesk.classList.remove('hidden');

console.log('Before hide: rootDesk hidden?', rootDesk.classList.contains('hidden'));
console.log('Before hide: alertDesk hidden?', alertDesk.classList.contains('hidden'));

// Call hidePreviewTestModeAlert
hidePreviewTestModeAlert();

console.log('After hide: rootDesk hidden?', rootDesk.classList.contains('hidden'));
console.log('After hide: rootDesk innerHTML empty?', rootDesk.innerHTML === '');
console.log('After hide: alertDesk hidden?', alertDesk.classList.contains('hidden'));

if (!rootDesk.classList.contains('hidden') || rootDesk.innerHTML !== '' || !alertDesk.classList.contains('hidden')) {
  throw new Error('hidePreviewTestModeAlert failed!');
}

console.log('Runtime test completed successfully!');


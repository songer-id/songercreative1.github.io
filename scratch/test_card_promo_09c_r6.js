/**
 * test_card_promo_09c_r6.js
 * Comprehensive Test Suite for TASK: SC-ADMIN-CARD-PROMO-CONTROLS-09C-R6
 */

const assert = require('assert');
const fs = require('fs');

console.log('=== RUNNING TEST SUITE: SC-ADMIN-CARD-PROMO-CONTROLS-09C-R6 ===');

const code = fs.readFileSync('js/product-form.js', 'utf8').replace(/\r\n/g, '\n');

// ==========================================
// SECTION 1: Static Code Verification
// ==========================================
console.log('\n--- 1. Static Code Verification ---');

// 1.1 Posisi Label Diskon Dropdown (Desktop & Mobile)
assert.ok(code.includes('id="cfg-discount-badge-pos-container"'), 'Desktop must have discount badge pos dropdown container');
assert.ok(code.includes('id="cfg-discount-badge-pos-container-mob"'), 'Mobile must have discount badge pos dropdown container');
assert.ok(code.includes('id="btn-discount-badge-pos"'), 'Desktop must have dropdown trigger button');
assert.ok(code.includes('id="btn-discount-badge-pos-mob"'), 'Mobile must have dropdown trigger button');
assert.ok(code.includes('id="lbl-discount-badge-pos"'), 'Desktop must have dropdown label display');
assert.ok(code.includes('id="lbl-discount-badge-pos-mob"'), 'Mobile must have dropdown label display');
assert.ok(code.includes('id="menu-discount-badge-pos"'), 'Desktop must have dropdown menu');
assert.ok(code.includes('id="menu-discount-badge-pos-mob"'), 'Mobile must have dropdown menu');
assert.ok(code.includes('id="cfg-discount-badge-position"'), 'Desktop hidden input must remain');
assert.ok(code.includes('id="cfg-discount-badge-position-mob"'), 'Mobile hidden input must remain');

// 1.2 Font Weight Verification (font-weight: 400 / font-normal pada elemen tools editor)
assert.ok(code.includes('id="btn-discount-badge-pos" aria-haspopup="listbox" aria-expanded="false" class="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-normal'), 'Dropdown trigger must be font-normal');
assert.ok(code.includes('id="lbl-discount-badge-pos" class="font-normal'), 'Dropdown label must be font-normal');

// 1.3 Uniform Promo Hints (4 Features)
assert.ok(code.includes('id="cfg-strike-promo-hint"'), 'Must have desktop strike promo hint');
assert.ok(code.includes('id="cfg-strike-promo-hint-mob"'), 'Must have mobile strike promo hint');
assert.ok(code.includes('id="cfg-discount-promo-hint"'), 'Must have desktop discount promo hint');
assert.ok(code.includes('id="cfg-discount-promo-hint-mob"'), 'Must have mobile discount promo hint');
assert.ok(code.includes('id="cfg-ticket-promo-hint"'), 'Must have desktop ticket promo hint');
assert.ok(code.includes('id="cfg-ticket-promo-hint-mob"'), 'Must have mobile ticket promo hint');
assert.ok(code.includes('id="cfg-countdown-promo-hint"'), 'Must have desktop countdown promo hint');
assert.ok(code.includes('id="cfg-countdown-promo-hint-mob"'), 'Must have mobile countdown promo hint');

const UNIFORM_TEXT = 'Tampil saat promo aktif atau Simulasi Diskon dinyalakan.';
assert.ok(code.includes(UNIFORM_TEXT), 'Must contain uniform promo hint text');

// 1.4 No Artificial Sample Prices when Promo & Sim are off
assert.ok(!code.includes('origStrikePrice = Math.round(basePrice * 1.3);'), 'Artificial strike price multiplier (1.3) must be removed');
assert.ok(code.includes('origStrikePrice = 0;\n      effFinalPrice = basePrice;'), 'Default strike price must be 0 when no promo/sim');

// 1.5 Countdown deadline validation & specific hint
const DEADLINE_HINT = 'Atur waktu berakhir promo untuk menampilkan countdown.';
assert.ok(code.includes(DEADLINE_HINT), 'Must contain specific countdown deadline hint');
assert.ok(code.includes('isDeadlineValid'), 'Must evaluate countdown deadline validity');

console.log('✓ Static Code Verification Passed!');

// ==========================================
// SECTION 2: Runtime DOM Simulation
// ==========================================
console.log('\n--- 2. Runtime DOM Simulation ---');

class MockClassList {
  constructor() {
    this.classes = new Set();
  }
  add(...cls) { cls.forEach(c => this.classes.add(c)); }
  remove(...cls) { cls.forEach(c => this.classes.delete(c)); }
  contains(c) { return this.classes.has(c); }
  toggle(c, force) {
    if (force !== undefined) {
      if (force) this.classes.add(c);
      else this.classes.delete(c);
    } else {
      if (this.classes.has(c)) this.classes.delete(c);
      else this.classes.add(c);
    }
  }
  toString() { return Array.from(this.classes).join(' '); }
}

class MockElement {
  constructor(tag, id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.classList = new MockClassList();
    this.attributes = {};
    this.style = {};
    this.children = [];
    this.innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.checked = false;
    this.dataset = {};
    this.listeners = {};
    this.parentElement = null;
  }
  get className() {
    return Array.from(this.classList.classes).join(' ');
  }
  set className(val) {
    this.classList.classes = new Set((val || '').split(/\s+/).filter(Boolean));
  }
  setAttribute(name, val) { this.attributes[name] = String(val); }
  getAttribute(name) { return this.attributes[name] || null; }
  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  removeEventListener(event, fn) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(f => f !== fn);
  }
  dispatchEvent(event) {
    const list = this.listeners[event.type] || [];
    list.forEach(fn => fn(event));
  }
  focus() { this._focused = true; }
  closest(sel) {
    let curr = this;
    while (curr) {
      if (sel.startsWith('.') && curr.classList.contains(sel.slice(1))) return curr;
      if (sel.startsWith('#') && curr.id === sel.slice(1)) return curr;
      if (curr.tagName && curr.tagName.toLowerCase() === sel.toLowerCase()) return curr;
      curr = curr.parentElement;
    }
    return new MockElement('closest-' + sel);
  }
  querySelectorAll(sel) {
    const res = [];
    const walk = (node) => {
      if (node !== this) {
        if (sel.startsWith('.') && node.classList.contains(sel.slice(1))) res.push(node);
        else if (sel.startsWith('#') && node.id === sel.slice(1)) res.push(node);
        else if (node.tagName.toLowerCase() === sel.toLowerCase()) res.push(node);
      }
      (node.children || []).forEach(walk);
    };
    walk(this);
    return res;
  }
  querySelector(sel) {
    const all = this.querySelectorAll(sel);
    return all[0] || null;
  }
  contains(target) {
    let curr = target;
    while (curr) {
      if (curr === this) return true;
      curr = curr.parentElement;
    }
    return false;
  }
}

const mockDoc = {
  elements: new Map(),
  body: new MockElement('body'),
  documentElement: new MockElement('html'),
  activeElement: null,
  docListeners: {},
  addEventListener(evt, fn) {
    if (!this.docListeners[evt]) this.docListeners[evt] = [];
    this.docListeners[evt].push(fn);
  },
  removeEventListener(evt, fn) {
    if (!this.docListeners[evt]) return;
    this.docListeners[evt] = this.docListeners[evt].filter(f => f !== fn);
  },
  dispatchEvent(evt) {
    const list = this.docListeners[evt.type] || [];
    list.forEach(fn => fn(evt));
  },
  getElementById(id) {
    return this.elements.get(id) || null;
  },
  createElement(tag) {
    return new MockElement(tag);
  },
  register(el) {
    if (el.id) this.elements.set(el.id, el);
    return el;
  },
  querySelectorAll(sel) {
    return this.body.querySelectorAll(sel);
  },
  querySelector(sel) {
    if (sel.includes('card_variant_radio')) {
      return this.elements.get('card-variant-a');
    }
    return this.body.querySelector(sel);
  }
};

global.document = mockDoc;
const winListeners = {};
global.window = {
  document: mockDoc,
  lucide: { createIcons: () => { } },
  addEventListener: (evt, fn) => {
    if (!winListeners[evt]) winListeners[evt] = [];
    winListeners[evt].push(fn);
  },
  removeEventListener: (evt, fn) => {
    if (!winListeners[evt]) return;
    winListeners[evt] = winListeners[evt].filter(f => f !== fn);
  },
  dispatchEvent: (evt) => {
    const list = winListeners[evt.type] || [];
    list.forEach(fn => fn(evt));
  }
};
global.getComputedStyle = () => ({
  getPropertyValue: () => '#059669'
});
global.requestAnimationFrame = (fn) => { if (typeof fn === 'function') fn(); };
global.window.requestAnimationFrame = global.requestAnimationFrame;

// Load DB mock
global.DB = {
  getSettings: () => ({}),
  DEFAULT_CARD_VARIANTS_CONFIG: {
    variant_a: { border_width: 1, border_radius: 16 },
    variant_b: { border_width: 1, border_radius: 16 },
    variant_c: { border_width: 1, border_radius: 16 }
  }
};

// Initialize elements needed for testing
function initMockDOM() {
  mockDoc.elements.clear();
  mockDoc.body.children = [];

  // Card Variant radio A
  const cardVarA = mockDoc.register(new MockElement('input', 'card-variant-a'));
  cardVarA.setAttribute('name', 'card_variant_radio');
  cardVarA.checked = true;
  cardVarA.value = 'A';
  mockDoc.body.children.push(cardVarA);

  // Dropdown containers & controls
  ['', '-mob'].forEach(suffix => {
    const container = mockDoc.register(new MockElement('div', `cfg-discount-badge-pos-container${suffix}`));
    const btn = mockDoc.register(new MockElement('button', `btn-discount-badge-pos${suffix}`));
    btn.setAttribute('aria-expanded', 'false');
    const lbl = mockDoc.register(new MockElement('span', `lbl-discount-badge-pos${suffix}`));
    lbl.textContent = 'Kanan Atas';
    const icon = mockDoc.register(new MockElement('i', `icon-discount-badge-pos-chevron${suffix}`));
    btn.children.push(lbl, icon);
    lbl.parentElement = btn;
    icon.parentElement = btn;

    const menu = mockDoc.register(new MockElement('div', `menu-discount-badge-pos${suffix}`));
    menu.classList.add('hidden');

    ['top-left', 'top-right', 'bottom-left', 'bottom-right'].forEach(pos => {
      const opt = new MockElement('button');
      opt.classList.add('btn-disc-pos');
      opt.dataset.pos = pos;
      menu.children.push(opt);
      opt.parentElement = menu;
    });

    const hiddenInp = mockDoc.register(new MockElement('input', `cfg-discount-badge-position${suffix}`));
    hiddenInp.value = 'top-right';

    container.children.push(btn, menu, hiddenInp);
    btn.parentElement = container;
    menu.parentElement = container;
    hiddenInp.parentElement = container;
    mockDoc.body.children.push(container);

    // Hints
    const strikeHint = mockDoc.register(new MockElement('p', `cfg-strike-promo-hint${suffix}`));
    strikeHint.classList.add('hidden');
    const discHint = mockDoc.register(new MockElement('p', `cfg-discount-promo-hint${suffix}`));
    discHint.classList.add('hidden');
    const ticketHint = mockDoc.register(new MockElement('p', `cfg-ticket-promo-hint${suffix}`));
    ticketHint.classList.add('hidden');
    const cdHint = mockDoc.register(new MockElement('p', `cfg-countdown-promo-hint${suffix}`));
    cdHint.classList.add('hidden');
    mockDoc.body.children.push(strikeHint, discHint, ticketHint, cdHint);

    // Toggles
    const tStrike = mockDoc.register(new MockElement('input', `cfg-show-strike${suffix}`));
    tStrike.checked = true;
    const tDisc = mockDoc.register(new MockElement('input', `cfg-show-discount-badge${suffix}`));
    tDisc.checked = true;
    const tTicket = mockDoc.register(new MockElement('input', `cfg-show-ticket-icon${suffix}`));
    tTicket.checked = true;
    const tCd = mockDoc.register(new MockElement('input', `cfg-enable-countdown${suffix}`));
    tCd.checked = true;
    const simCd = mockDoc.register(new MockElement('input', `cfg-simulate-countdown-preview${suffix}`));
    simCd.checked = false;
    mockDoc.body.children.push(tStrike, tDisc, tTicket, tCd, simCd);

    // Preview targets
    const prevCont = mockDoc.register(new MockElement('div', `product-card-preview-container${suffix}`));
    mockDoc.body.children.push(prevCont);
  });

  // Common inputs
  const pName = mockDoc.register(new MockElement('input', 'input-product-name'));
  pName.value = 'Kaos Polos Premium';
  const pPrice = mockDoc.register(new MockElement('input', 'input-single-price'));
  pPrice.value = '100000';
  const pEndDate = mockDoc.register(new MockElement('input', 'input-promo-end-date'));
  pEndDate.value = '';
  const toggleDaily = mockDoc.register(new MockElement('input', 'toggle-promo-daily'));
  toggleDaily.checked = false;
  mockDoc.body.children.push(pName, pPrice, pEndDate, toggleDaily);
}

initMockDOM();

// Load ProductForm module
require('../js/product-form.js');
const ProductForm = global.window.ProductForm;

// 2.1 Test setDiscountBadgePosition
console.log('\n--- 2.1 Testing setDiscountBadgePosition ---');
ProductForm.setDiscountBadgePosition('bottom-left');

const inpDesk = mockDoc.getElementById('cfg-discount-badge-position');
const inpMob = mockDoc.getElementById('cfg-discount-badge-position-mob');
const lblDesk = mockDoc.getElementById('lbl-discount-badge-pos');
const lblMob = mockDoc.getElementById('lbl-discount-badge-pos-mob');

assert.strictEqual(inpDesk.value, 'bottom-left', 'Desktop hidden input must be bottom-left');
assert.strictEqual(inpMob.value, 'bottom-left', 'Mobile hidden input must be bottom-left');
assert.strictEqual(lblDesk.textContent, 'Kiri Bawah', 'Desktop label must be Kiri Bawah');
assert.strictEqual(lblMob.textContent, 'Kiri Bawah', 'Mobile label must be Kiri Bawah');

const menuDesk = mockDoc.getElementById('menu-discount-badge-pos');
const optBL = menuDesk.querySelectorAll('.btn-disc-pos').find(b => b.dataset.pos === 'bottom-left');
const optTR = menuDesk.querySelectorAll('.btn-disc-pos').find(b => b.dataset.pos === 'top-right');
assert.strictEqual(optBL.getAttribute('aria-selected'), 'true', 'Selected option must have aria-selected true');
assert.strictEqual(optTR.getAttribute('aria-selected'), 'false', 'Unselected option must have aria-selected false');
assert.ok(optBL.classList.contains('text-emerald-700'), 'Selected option must have active styling');
console.log('✓ setDiscountBadgePosition works perfectly!');

// 2.2 Test Live Preview with Promo OFF & Sim OFF
console.log('\n--- 2.2 Testing Live Preview when Promo & Sim are OFF ---');
// Promo is inactive, sim is inactive, all 4 toggles are ON
ProductForm.updateProductCardLivePreview();

const strikeHint = mockDoc.getElementById('cfg-strike-promo-hint');
const discHint = mockDoc.getElementById('cfg-discount-promo-hint');
const ticketHint = mockDoc.getElementById('cfg-ticket-promo-hint');
const cdHint = mockDoc.getElementById('cfg-countdown-promo-hint');

assert.ok(!strikeHint.classList.contains('hidden'), 'Strike hint must be visible when toggle is ON but promo is OFF');
assert.ok(!discHint.classList.contains('hidden'), 'Discount hint must be visible when toggle is ON but promo is OFF');
assert.ok(!ticketHint.classList.contains('hidden'), 'Ticket hint must be visible when toggle is ON but promo is OFF');
assert.ok(!cdHint.classList.contains('hidden'), 'Countdown hint must be visible when toggle is ON but promo is OFF');

assert.strictEqual(strikeHint.textContent, UNIFORM_TEXT, 'Strike hint text must be uniform');
assert.strictEqual(discHint.textContent, UNIFORM_TEXT, 'Discount hint text must be uniform');
assert.strictEqual(ticketHint.textContent, UNIFORM_TEXT, 'Ticket hint text must be uniform');
assert.strictEqual(cdHint.textContent, UNIFORM_TEXT, 'Countdown hint text must be uniform when promo is OFF');

// Card preview contents
const prevDesk = mockDoc.getElementById('product-card-preview-container');
assert.ok(!prevDesk.innerHTML.includes('line-through'), 'Card must NOT show strike price when promo is OFF and sim is OFF');
assert.ok(!prevDesk.innerHTML.includes('ticket-check'), 'Card must NOT show ticket icon when promo is OFF and sim is OFF');
assert.ok(!prevDesk.innerHTML.includes('- % 50'), 'Card must NOT show artificial 50% discount badge when promo is OFF and sim is OFF');
console.log('✓ Live Preview correctly suppresses promo elements and displays hints when promo & sim are OFF!');

// 2.3 Test Live Preview with Simulation ON
console.log('\n--- 2.3 Testing Live Preview with Simulation ON ---');
mockDoc.getElementById('cfg-simulate-countdown-preview').checked = true;
ProductForm.updateProductCardLivePreview();

assert.ok(strikeHint.classList.contains('hidden'), 'Strike hint must be hidden when simulation is ON');
assert.ok(discHint.classList.contains('hidden'), 'Discount hint must be hidden when simulation is ON');
assert.ok(ticketHint.classList.contains('hidden'), 'Ticket hint must be hidden when simulation is ON');
assert.ok(cdHint.classList.contains('hidden'), 'Countdown hint must be hidden when simulation is ON');

assert.ok(prevDesk.innerHTML.includes('line-through'), 'Card MUST show strike price when simulation is ON');
assert.ok(prevDesk.innerHTML.includes('ticket-check'), 'Card MUST show ticket icon when simulation is ON');
assert.ok(prevDesk.innerHTML.includes('- % 50'), 'Card MUST show simulation discount badge when simulation is ON');
console.log('✓ Live Preview correctly renders simulated promo elements and hides hints!');

// 2.4 Test Live Preview with Real Promo ON but NO Valid Deadline
console.log('\n--- 2.4 Testing Live Preview with Real Promo ON (No Deadline) ---');
mockDoc.getElementById('cfg-simulate-countdown-preview').checked = false;
mockDoc.getElementById('toggle-promo-daily').checked = true;
const pDiscVal = mockDoc.register(new MockElement('input', 'input-promo-discount-value'));
pDiscVal.value = '20';
mockDoc.getElementById('input-promo-end-date').value = ''; // No deadline

ProductForm.updateProductCardLivePreview();

assert.ok(strikeHint.classList.contains('hidden'), 'Strike hint must be hidden when real promo is active');
assert.ok(discHint.classList.contains('hidden'), 'Discount hint must be hidden when real promo is active');
assert.ok(ticketHint.classList.contains('hidden'), 'Ticket hint must be hidden when real promo is active');

// Countdown must be suppressed and show DEADLINE_HINT
assert.ok(!cdHint.classList.contains('hidden'), 'Countdown hint must be visible when deadline is missing');
assert.strictEqual(cdHint.textContent, DEADLINE_HINT, 'Countdown hint must tell user to set promo end date');
assert.ok(!prevDesk.innerHTML.includes('ticket-percent'), 'Card must NOT show countdown badge when deadline is missing');

assert.ok(prevDesk.innerHTML.includes('line-through'), 'Card MUST show real strike price');
assert.ok(prevDesk.innerHTML.includes('- % 20'), 'Card MUST show real 20% discount badge');
assert.ok(prevDesk.innerHTML.includes('ticket-check'), 'Card MUST show ticket icon');
console.log('✓ Real promo correctly shows strike, badge, ticket, and guides user to set deadline for countdown!');

// 2.5 Test Live Preview after Valid Deadline is Set
console.log('\n--- 2.5 Testing Live Preview with Valid Deadline ---');
const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
const yyyy = tomorrow.getFullYear();
const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
const dd = String(tomorrow.getDate()).padStart(2, '0');
mockDoc.getElementById('input-promo-end-date').value = `${yyyy}-${mm}-${dd}`;

ProductForm.updateProductCardLivePreview();

assert.ok(cdHint.classList.contains('hidden'), 'Countdown hint must be hidden when deadline is valid');
assert.ok(prevDesk.innerHTML.includes('ticket-percent'), 'Card MUST show countdown badge when deadline is valid');
console.log('✓ Countdown badge appears and hint is hidden when valid future deadline is provided!');

// 2.6 Test Toggle OFF
console.log('\n--- 2.6 Testing Toggle OFF behavior ---');
mockDoc.getElementById('cfg-show-strike').checked = false;
mockDoc.getElementById('cfg-show-strike-mob').checked = false;
// Also turn off simulation and promo to verify that hint is hidden when toggle is OFF
mockDoc.getElementById('toggle-promo-daily').checked = false;
pDiscVal.value = '0';

ProductForm.updateProductCardLivePreview();

assert.ok(strikeHint.classList.contains('hidden'), 'Strike hint must be hidden when strike toggle is OFF');
console.log('✓ Disabling toggle hides the hint regardless of promo state!');

// 2.7 Test Dropdown Helpers & State Transitions
console.log('\n--- 2.7 Testing Dropdown UI Interactions ---');

const btnDesk = mockDoc.getElementById('btn-discount-badge-pos');
const menu = mockDoc.getElementById('menu-discount-badge-pos');

// 1. Open dropdown via toggleDiscountBadgePosDropdown
ProductForm.toggleDiscountBadgePosDropdown(true);
assert.ok(!menu.classList.contains('hidden'), 'Menu must not have hidden class when open');
assert.strictEqual(btnDesk.getAttribute('aria-expanded'), 'true', 'Trigger button must have aria-expanded true');

// 2. Select option via setDiscountBadgePosition
ProductForm.setDiscountBadgePosition('top-left');
assert.strictEqual(mockDoc.getElementById('lbl-discount-badge-pos').textContent, 'Kiri Atas', 'Label must update to Kiri Atas');
assert.strictEqual(mockDoc.getElementById('cfg-discount-badge-position').value, 'top-left', 'Hidden input must update to top-left');

// 3. Close dropdown via closeAllDiscountBadgePosDropdowns
ProductForm.closeAllDiscountBadgePosDropdowns();
assert.ok(menu.classList.contains('hidden'), 'Menu must have hidden class when closed');
assert.strictEqual(btnDesk.getAttribute('aria-expanded'), 'false', 'Trigger button must have aria-expanded false');

console.log('✓ Dropdown interactions and state transitions passed!');

console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');

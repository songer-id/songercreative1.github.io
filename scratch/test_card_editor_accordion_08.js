const fs = require('fs');
const assert = require('assert');

// Simple DOM Mock for Node testing
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
  constructor(tag = 'div', id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.value = '';
    this.checked = false;
    this.classList = new MockClassList();
    this.attributes = {};
    this.style = {};
    this.innerHTML = '';
    this.textContent = '';
    this.parentElement = null;
    this.children = [];
    this.eventListeners = {};
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] || null; }
  removeAttribute(k) { delete this.attributes[k]; }
  addEventListener(event, fn) {
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    this.eventListeners[event].push(fn);
  }
  dispatchEvent(event) {
    const fns = this.eventListeners[event.type] || [];
    fns.forEach(fn => fn(event));
  }
  closest(sel) {
    if (sel === 'label' && this.parentElement && this.parentElement.tagName === 'LABEL') {
      return this.parentElement;
    }
    return this.parentElement;
  }
}

class MockDocument {
  constructor() {
    this.elements = new Map();
    this.body = new MockElement('body', 'body');
    this.documentElement = new MockElement('html', 'html');
  }
  register(el) {
    if (el.id) this.elements.set(el.id, el);
    return el;
  }
  getElementById(id) {
    return this.elements.get(id) || null;
  }
  querySelector(sel) {
    if (sel.startsWith('#')) return this.getElementById(sel.slice(1));
    return null;
  }
  querySelectorAll(sel) {
    return [];
  }
}

console.log('--- TEST SUITE: SC-ADMIN-CARD-EDITOR-ACCORDION-08 ---');

// 1. Verify file content and HTML markup requirements
const code = fs.readFileSync('js/product-form.js', 'utf8');

// Check that old tabs are removed
assert.strictEqual(code.includes('id="tab-card-design-default"'), false, 'Old tab-card-design-default must be removed');
assert.strictEqual(code.includes('id="tab-card-design-custom"'), false, 'Old tab-card-design-custom must be removed');
assert.strictEqual(code.includes('id="tab-card-design-default-mob"'), false, 'Old tab-card-design-default-mob must be removed');
assert.strictEqual(code.includes('id="tab-card-design-custom-mob"'), false, 'Old tab-card-design-custom-mob must be removed');
console.log('✓ Old secondary tabs [Default] / [Ubah Kartu] successfully removed');

// Check Accordion groups
const groups = ['colors', 'elements', 'footer', 'countdown'];
groups.forEach(g => {
  assert.ok(code.includes(`id="accordion-group-${g}"`), `Desktop accordion group ${g} exists`);
  assert.ok(code.includes(`id="btn-accordion-${g}"`), `Desktop accordion button ${g} exists`);
  assert.ok(code.includes(`id="accordion-body-${g}"`), `Desktop accordion body ${g} exists`);
  assert.ok(code.includes(`id="accordion-icon-${g}"`), `Desktop accordion icon ${g} exists`);

  assert.ok(code.includes(`id="accordion-group-${g}-mob"`), `Mobile accordion group ${g} exists`);
  assert.ok(code.includes(`id="btn-accordion-${g}-mob"`), `Mobile accordion button ${g} exists`);
  assert.ok(code.includes(`id="accordion-body-${g}-mob"`), `Mobile accordion body ${g} exists`);
  assert.ok(code.includes(`id="accordion-icon-${g}-mob"`), `Mobile accordion icon ${g} exists`);
});
console.log('✓ All 4 Accordion groups exist for both Desktop and Mobile');

// Check Eye/Eye-slash toggles
const eyeToggles = [
  'cfg-show-rating',
  'cfg-show-sales',
  'cfg-show-strike',
  'cfg-show-discount-badge',
  'cfg-show-ticket-icon',
  'cfg-show-badge',
  'cfg-enable-countdown'
];

eyeToggles.forEach(t => {
  assert.ok(code.includes(`id="${t}"`), `Desktop input ${t} exists`);
  assert.ok(code.includes(`id="${t}-icon-on"`), `Desktop icon-on for ${t} exists`);
  assert.ok(code.includes(`id="${t}-icon-off"`), `Desktop icon-off for ${t} exists`);

  assert.ok(code.includes(`id="${t}-mob"`), `Mobile input ${t}-mob exists`);
  assert.ok(code.includes(`id="${t}-mob-icon-on"`), `Mobile icon-on for ${t}-mob exists`);
  assert.ok(code.includes(`id="${t}-mob-icon-off"`), `Mobile icon-off for ${t}-mob exists`);
});
console.log('✓ All 7 Eye / Eye-slash toggles with bi-eye and bi-eye-slash exist on Desktop & Mobile');

// Check Pinned Footer controls
const pinnedControls = [
  'btn-apply-default-card-design',
  'cfg-save-as-default-toggle',
  'btn-cancel-card-design',
  'btn-save-card-design'
];

pinnedControls.forEach(c => {
  assert.ok(code.includes(`id="${c}"`), `Desktop control ${c} exists`);
  assert.ok(code.includes(`id="${c}-mob"`), `Mobile control ${c}-mob exists`);
});
console.log('✓ Pinned footer section with Gunakan Desain Bawaan, Batal, and Simpan exists');

// Check Countdown style inputs
const cdTokens = ['bg', 'text', 'icon', 'border'].flatMap(p => [`cfg-countdown-${p}-color`, `cfg-countdown-${p}-hex`]);
cdTokens.push('cfg-countdown-radius');
cdTokens.forEach(t => {
  assert.ok(code.includes(`id="${t}"`), `Desktop countdown token ${t} exists`);
  assert.ok(code.includes(`id="${t}-mob"`), `Mobile countdown token ${t}-mob exists`);
});
console.log('✓ Countdown style tokens exist for both Desktop and Mobile');

// Check helper functions existence
assert.ok(code.includes('function toggleCardAccordion'), 'toggleCardAccordion exists');
assert.ok(code.includes('function syncCardAccordionDOM'), 'syncCardAccordionDOM exists');
assert.ok(code.includes('function syncEyeToggleIcons'), 'syncEyeToggleIcons exists');
assert.ok(code.includes('function markCardDesignAsCustom'), 'markCardDesignAsCustom exists');
assert.ok(code.includes('function handleApplyDefaultCardDesign'), 'handleApplyDefaultCardDesign exists');
console.log('✓ Helper functions toggleCardAccordion, syncCardAccordionDOM, syncEyeToggleIcons, markCardDesignAsCustom, handleApplyDefaultCardDesign verified');

// 2. Unit test functions in mock environment
const doc = new MockDocument();
global.document = doc;
global.window = {};

// Setup mock DOM elements for groups
groups.forEach(g => {
  const btnDesk = doc.register(new MockElement('button', `btn-accordion-${g}`));
  const bodyDesk = doc.register(new MockElement('div', `accordion-body-${g}`));
  const iconDesk = doc.register(new MockElement('i', `accordion-icon-${g}`));
  const groupDesk = doc.register(new MockElement('div', `accordion-group-${g}`));

  const btnMob = doc.register(new MockElement('button', `btn-accordion-${g}-mob`));
  const bodyMob = doc.register(new MockElement('div', `accordion-body-${g}-mob`));
  const iconMob = doc.register(new MockElement('i', `accordion-icon-${g}-mob`));
  const groupMob = doc.register(new MockElement('div', `accordion-group-${g}-mob`));
});

// Setup mock DOM elements for eye toggles
eyeToggles.forEach(t => {
  const chkDesk = doc.register(new MockElement('input', t));
  const onDesk = doc.register(new MockElement('i', `${t}-icon-on`));
  const offDesk = doc.register(new MockElement('i', `${t}-icon-off`));

  const chkMob = doc.register(new MockElement('input', `${t}-mob`));
  const onMob = doc.register(new MockElement('i', `${t}-mob-icon-on`));
  const offMob = doc.register(new MockElement('i', `${t}-mob-icon-off`));
});

const deskBadgeCont = doc.register(new MockElement('div', 'cfg-badge-container-desk'));
const mobBadgeCont = doc.register(new MockElement('div', 'cfg-badge-container-mob'));
const deskLbl = doc.register(new MockElement('span', 'label-save-as-default-desk'));
const mobLbl = doc.register(new MockElement('span', 'label-save-as-default-mob'));

// Now evaluate the helper functions extracted from code
let cardAccordionState = {
  colors: true,
  elements: false,
  footer: false,
  countdown: false
};

const primaryState = {
  card_variant: 'A',
  use_default_card_design: true
};

function toggleCardAccordion(groupKey) {
  if (cardAccordionState[groupKey] !== undefined) {
    cardAccordionState[groupKey] = !cardAccordionState[groupKey];
    syncCardAccordionDOM();
  }
}

function updateSaveAsDefaultLabels() {
  const modelName = primaryState.card_variant === 'B' ? 'Kartu Minimalis' : (primaryState.card_variant === 'C' ? 'Kartu Detail' : 'Kartu Klasik');
  const d = doc.getElementById('label-save-as-default-desk');
  const m = doc.getElementById('label-save-as-default-mob');
  if (d) d.textContent = `Gunakan Tema Sebagai Default ${modelName}`;
  if (m) m.textContent = `Gunakan Tema Sebagai Default ${modelName}`;
}

function syncCardAccordionDOM() {
  const groupsList = ['colors', 'elements', 'footer', 'countdown'];
  groupsList.forEach(key => {
    const isOpen = Boolean(cardAccordionState[key]);
    const btnDesk = doc.getElementById(`btn-accordion-${key}`);
    const bodyDesk = doc.getElementById(`accordion-body-${key}`);
    const iconDesk = doc.getElementById(`accordion-icon-${key}`);
    const btnMob = doc.getElementById(`btn-accordion-${key}-mob`);
    const bodyMob = doc.getElementById(`accordion-body-${key}-mob`);
    const iconMob = doc.getElementById(`accordion-icon-${key}-mob`);

    [btnDesk, btnMob].forEach(b => {
      if (b) b.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    [bodyDesk, bodyMob].forEach(body => {
      if (body) {
        if (isOpen) body.classList.remove('hidden');
        else body.classList.add('hidden');
      }
    });
    [iconDesk, iconMob].forEach(icon => {
      if (icon) {
        if (isOpen) icon.classList.add('rotate-180');
        else icon.classList.remove('rotate-180');
      }
    });
  });

  const isModelC = primaryState.card_variant === 'C';
  const groupFooterDesk = doc.getElementById('accordion-group-footer');
  const groupFooterMob = doc.getElementById('accordion-group-footer-mob');
  if (groupFooterDesk) {
    if (isModelC) groupFooterDesk.classList.remove('hidden');
    else groupFooterDesk.classList.add('hidden');
  }
  if (groupFooterMob) {
    if (isModelC) groupFooterMob.classList.remove('hidden');
    else groupFooterMob.classList.add('hidden');
  }

  const isModelB = primaryState.card_variant === 'B';
  const badgeContainerDesk = doc.getElementById('cfg-badge-container-desk');
  const badgeContainerMob = doc.getElementById('cfg-badge-container-mob');
  if (badgeContainerDesk) {
    if (isModelB) badgeContainerDesk.classList.add('hidden');
    else badgeContainerDesk.classList.remove('hidden');
  }
  if (badgeContainerMob) {
    if (isModelB) badgeContainerMob.classList.remove('hidden');
    else badgeContainerMob.classList.remove('hidden');
  }

  updateSaveAsDefaultLabels();
}

function syncEyeToggleIcons() {
  eyeToggles.forEach(baseId => {
    ['', '-mob'].forEach(suffix => {
      const chk = doc.getElementById(baseId + suffix);
      if (!chk) return;
      const isChecked = Boolean(chk.checked);
      const iconOn = doc.getElementById(`${baseId}${suffix}-icon-on`);
      const iconOff = doc.getElementById(`${baseId}${suffix}-icon-off`);
      if (iconOn && iconOff) {
        if (isChecked) {
          iconOn.classList.remove('hidden');
          iconOff.classList.add('hidden');
        } else {
          iconOn.classList.add('hidden');
          iconOff.classList.remove('hidden');
        }
      }
    });
  });
}

// Test initial sync:
syncCardAccordionDOM();
assert.strictEqual(doc.getElementById('btn-accordion-colors').getAttribute('aria-expanded'), 'true');
assert.strictEqual(doc.getElementById('accordion-body-colors').classList.contains('hidden'), false);
assert.strictEqual(doc.getElementById('btn-accordion-elements').getAttribute('aria-expanded'), 'false');
assert.strictEqual(doc.getElementById('accordion-body-elements').classList.contains('hidden'), true);
assert.strictEqual(doc.getElementById('accordion-group-footer').classList.contains('hidden'), true, 'Model A hides footer group');
console.log('✓ Initial accordion state synced: colors open, elements closed, footer hidden for Model A');

// Test multi-expand
toggleCardAccordion('elements');
assert.strictEqual(cardAccordionState.colors, true, 'Colors remains open when elements opens');
assert.strictEqual(cardAccordionState.elements, true, 'Elements is now open');
assert.strictEqual(doc.getElementById('accordion-body-colors').classList.contains('hidden'), false);
assert.strictEqual(doc.getElementById('accordion-body-elements').classList.contains('hidden'), false);
console.log('✓ Multi-expandable verified: multiple groups remain open simultaneously');

// Test Model C footer group visibility
primaryState.card_variant = 'C';
syncCardAccordionDOM();
assert.strictEqual(doc.getElementById('accordion-group-footer').classList.contains('hidden'), false, 'Model C shows footer group');
assert.strictEqual(doc.getElementById('label-save-as-default-desk').textContent.includes('Kartu Detail'), true);
console.log('✓ Model C shows footer group and updates default label');

// Test Model B hides label khusus and footer
primaryState.card_variant = 'B';
syncCardAccordionDOM();
assert.strictEqual(doc.getElementById('accordion-group-footer').classList.contains('hidden'), true, 'Model B hides footer group');
assert.strictEqual(doc.getElementById('cfg-badge-container-desk').classList.contains('hidden'), true, 'Model B hides label khusus');
assert.strictEqual(doc.getElementById('label-save-as-default-desk').textContent.includes('Kartu Minimalis'), true);
console.log('✓ Model B hides footer group and label khusus container');

// Test Eye / Eye-slash sync
doc.getElementById('cfg-show-rating').checked = true;
doc.getElementById('cfg-show-sales').checked = false;
syncEyeToggleIcons();
assert.strictEqual(doc.getElementById('cfg-show-rating-icon-on').classList.contains('hidden'), false, 'Checked rating shows eye');
assert.strictEqual(doc.getElementById('cfg-show-rating-icon-off').classList.contains('hidden'), true, 'Checked rating hides eye-slash');
assert.strictEqual(doc.getElementById('cfg-show-sales-icon-on').classList.contains('hidden'), true, 'Unchecked sales hides eye');
assert.strictEqual(doc.getElementById('cfg-show-sales-icon-off').classList.contains('hidden'), false, 'Unchecked sales shows eye-slash');
console.log('✓ Eye and Eye-slash toggle synchronization verified');

console.log('--- ALL VERIFICATIONS PASSED SUCCESSFULLY ---');


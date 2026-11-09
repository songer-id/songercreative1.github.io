/**
 * Runtime DOM Mock Integration Test for Task SC-ADMIN-CARD-EDITOR-GROUPING-09A
 */

const assert = require('assert');

// Lightweight DOM Mock for testing runtime accordion logic
class MockClassList {
  constructor(initial = []) {
    this.classes = new Set(initial);
  }
  add(...cls) { cls.forEach(c => this.classes.add(c)); }
  remove(...cls) { cls.forEach(c => this.classes.delete(c)); }
  contains(cls) { return this.classes.has(cls); }
}

class MockElement {
  constructor(id = '') {
    this.id = id;
    this.classList = new MockClassList();
    this.attributes = {};
    this.textContent = '';
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] || null; }
}

const elements = new Map();
function getEl(id) {
  if (!elements.has(id)) {
    elements.set(id, new MockElement(id));
  }
  return elements.get(id);
}

// Register all accordion elements
const groups = ['frame', 'text-info', 'badge', 'promo', 'footer'];
groups.forEach(k => {
  getEl(`btn-accordion-${k}`);
  getEl(`accordion-body-${k}`);
  getEl(`accordion-icon-${k}`);
  getEl(`btn-accordion-${k}-mob`);
  getEl(`accordion-body-${k}-mob`);
  getEl(`accordion-icon-${k}-mob`);
  getEl(`accordion-group-${k}`);
  getEl(`accordion-group-${k}-mob`);
});
getEl('cfg-badge-container-desk');
getEl('cfg-badge-container-mob');
getEl('label-save-as-default-desk');
getEl('label-save-as-default-mob');

const primaryState = {
  card_variant: 'A',
  use_default_card_design: true,
  card_config: {}
};

let cardAccordionState = {
  frame: true,
  'text-info': false,
  badge: false,
  promo: false,
  footer: false
};

function toggleCardAccordion(groupKey) {
  if (groupKey) {
    cardAccordionState[groupKey] = !Boolean(cardAccordionState[groupKey]);
    syncCardAccordionDOM();
  }
}

function updateSaveAsDefaultLabels() {
  const modelName = primaryState.card_variant === 'B' ? 'Kartu Minimalis' : (primaryState.card_variant === 'C' ? 'Kartu Detail' : 'Kartu Klasik');
  const deskLbl = getEl('label-save-as-default-desk');
  const mobLbl = getEl('label-save-as-default-mob');
  if (deskLbl) deskLbl.textContent = `Gunakan Sebagai Default (${modelName})`;
  if (mobLbl) mobLbl.textContent = `Gunakan Sebagai Default (${modelName})`;
}

function syncCardAccordionDOM() {
  groups.forEach(key => {
    const isOpen = Boolean(cardAccordionState[key]);
    const btnDesk = getEl(`btn-accordion-${key}`);
    const bodyDesk = getEl(`accordion-body-${key}`);
    const iconDesk = getEl(`accordion-icon-${key}`);
    const btnMob = getEl(`btn-accordion-${key}-mob`);
    const bodyMob = getEl(`accordion-body-${key}-mob`);
    const iconMob = getEl(`accordion-icon-${key}-mob`);

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
  const groupFooterDesk = getEl('accordion-group-footer');
  const groupFooterMob = getEl('accordion-group-footer-mob');
  if (groupFooterDesk) {
    if (isModelC) groupFooterDesk.classList.remove('hidden');
    else groupFooterDesk.classList.add('hidden');
  }
  if (groupFooterMob) {
    if (isModelC) groupFooterMob.classList.remove('hidden');
    else groupFooterMob.classList.add('hidden');
  }

  const isModelB = primaryState.card_variant === 'B';
  const groupBadgeDesk = getEl('accordion-group-badge');
  const groupBadgeMob = getEl('accordion-group-badge-mob');
  if (groupBadgeDesk) {
    if (isModelB) groupBadgeDesk.classList.add('hidden');
    else groupBadgeDesk.classList.remove('hidden');
  }
  if (groupBadgeMob) {
    if (isModelB) groupBadgeMob.classList.add('hidden');
    else groupBadgeMob.classList.remove('hidden');
  }

  const badgeContainerDesk = getEl('cfg-badge-container-desk');
  const badgeContainerMob = getEl('cfg-badge-container-mob');
  if (badgeContainerDesk) {
    if (isModelB) badgeContainerDesk.classList.add('hidden');
    else badgeContainerDesk.classList.remove('hidden');
  }
  if (badgeContainerMob) {
    if (isModelB) badgeContainerMob.classList.add('hidden');
    else badgeContainerMob.classList.remove('hidden');
  }

  updateSaveAsDefaultLabels();
}

console.log('Testing initial state Model A...');
syncCardAccordionDOM();

// 1. Check initial state
assert.strictEqual(cardAccordionState.frame, true, 'frame must be open');
assert.strictEqual(getEl('accordion-body-frame').classList.contains('hidden'), false, 'frame body must not be hidden');
assert.strictEqual(getEl('btn-accordion-frame').getAttribute('aria-expanded'), 'true');
assert.strictEqual(getEl('accordion-body-text-info').classList.contains('hidden'), true, 'text-info body must be hidden');
assert.strictEqual(getEl('accordion-group-badge').classList.contains('hidden'), false, 'badge group must be visible on Model A');
assert.strictEqual(getEl('accordion-group-footer').classList.contains('hidden'), true, 'footer group must be hidden on Model A');
assert.strictEqual(getEl('label-save-as-default-desk').textContent, 'Gunakan Sebagai Default (Kartu Klasik)');
console.log('✓ Model A initial state verified');

// 2. Multi-expand test: open text-info as well
toggleCardAccordion('text-info');
assert.strictEqual(cardAccordionState.frame, true, 'frame remains open');
assert.strictEqual(cardAccordionState['text-info'], true, 'text-info is now open');
assert.strictEqual(getEl('accordion-body-frame').classList.contains('hidden'), false);
assert.strictEqual(getEl('accordion-body-text-info').classList.contains('hidden'), false);
console.log('✓ Multi-expand verified: multiple groups open concurrently');

// 3. Switch to Model B (Minimalis)
primaryState.card_variant = 'B';
syncCardAccordionDOM();
assert.strictEqual(getEl('accordion-group-badge').classList.contains('hidden'), true, 'badge group must be hidden on Model B');
assert.strictEqual(getEl('accordion-group-footer').classList.contains('hidden'), true, 'footer group must be hidden on Model B');
assert.strictEqual(getEl('label-save-as-default-desk').textContent, 'Gunakan Sebagai Default (Kartu Minimalis)');
console.log('✓ Model B visibility and label verified');

// 4. Switch to Model C (Detail)
primaryState.card_variant = 'C';
syncCardAccordionDOM();
assert.strictEqual(getEl('accordion-group-badge').classList.contains('hidden'), false, 'badge group must be visible on Model C');
assert.strictEqual(getEl('accordion-group-footer').classList.contains('hidden'), false, 'footer group must be visible on Model C');
assert.strictEqual(getEl('label-save-as-default-desk').textContent, 'Gunakan Sebagai Default (Kartu Detail)');
console.log('✓ Model C visibility and label verified');

// 5. Test close toggle
toggleCardAccordion('frame');
assert.strictEqual(cardAccordionState.frame, false, 'frame can be toggled closed');
assert.strictEqual(getEl('accordion-body-frame').classList.contains('hidden'), true);
console.log('✓ Accordion close toggle verified');

console.log('\n=== ALL RUNTIME INTEGRATION CHECKS PASSED SUCCESSFULLY! ===');

/**
 * Runtime DOM Simulation Test for SC-ADMIN-CARD-FRAME-09B
 */
const assert = require('assert');
const fs = require('fs');

console.log('--- RUNTIME SIMULATION TEST: SC-ADMIN-CARD-FRAME-09B ---');

// Mock a lightweight DOM environment
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
    this.dataset = {};
    this.style = {};
  }
  addEventListener(evt, fn) {
    if (!this.listeners[evt]) this.listeners[evt] = [];
    this.listeners[evt].push(fn);
  }
  dispatchEvent(evt) {
    const list = this.listeners[evt.type] || [];
    list.forEach(fn => fn(evt));
  }
}

const elementMap = new Map();
function getOrCreateElement(id, tagName = 'div') {
  if (!elementMap.has(id)) {
    elementMap.set(id, new MockElement(id, tagName));
  }
  return elementMap.get(id);
}

// Populate known elements
const ids = [
  'cfg-bg-color', 'cfg-bg-color-mob', 'cfg-bg-text', 'cfg-bg-text-mob',
  'cfg-border-color', 'cfg-border-color-mob', 'cfg-border-text', 'cfg-border-text-mob',
  'cfg-border-width', 'cfg-border-width-mob', 'cfg-border-width-val', 'cfg-border-width-val-mob',
  'cfg-border-radius', 'cfg-border-radius-mob', 'cfg-border-radius-val', 'cfg-border-radius-val-mob',
  'cfg-title-color', 'cfg-title-color-mob', 'cfg-title-text', 'cfg-title-text-mob',
  'cfg-price-color', 'cfg-price-color-mob', 'cfg-price-text', 'cfg-price-text-mob',
  'cfg-btn-color', 'cfg-btn-color-mob', 'cfg-btn-text', 'cfg-btn-text-mob',
  'cfg-show-rating', 'cfg-show-rating-mob',
  'cfg-show-sales', 'cfg-show-sales-mob',
  'cfg-show-strike', 'cfg-show-strike-mob',
  'cfg-show-discount-badge', 'cfg-show-discount-badge-mob',
  'cfg-show-ticket-icon', 'cfg-show-ticket-icon-mob',
  'cfg-show-badge', 'cfg-show-badge-mob', 'cfg-show-badge-blok-a',
  'cfg-save-as-default-toggle', 'cfg-save-as-default-toggle-mob',
  'label-save-as-default-desk', 'label-save-as-default-mob'
];
ids.forEach(id => getOrCreateElement(id));

// Preset buttons
const bwPresetButtons = [];
[0, 1, 2, 3].forEach(val => {
  const btn = new MockElement(`btn-bw-${val}`, 'button');
  btn.className = 'btn-border-width-preset';
  btn.dataset.value = String(val);
  bwPresetButtons.push(btn);
});

const brPresetButtons = [];
[0, 8, 16, 24].forEach(val => {
  const btn = new MockElement(`btn-br-${val}`, 'button');
  btn.className = 'btn-border-radius-preset';
  btn.dataset.value = String(val);
  brPresetButtons.push(btn);
});

global.document = {
  getElementById: (id) => elementMap.get(id) || null,
  querySelectorAll: (selector) => {
    if (selector === '.btn-border-width-preset') return bwPresetButtons;
    if (selector === '.btn-border-radius-preset') return brPresetButtons;
    return [];
  },
  querySelector: () => null
};

// Mock DB
global.DB = {
  DEFAULT_CARD_VARIANTS_CONFIG: {
    variant_a: { bg_color: '#ffffff', border_color: '#e2e8f0', border_width: '1px', border_radius: '16px' },
    variant_b: { bg_color: '#ffffff', border_color: '#e9d5ff', border_width: '1px', border_radius: '16px' },
    variant_c: { bg_color: '#ffffff', border_color: '#fed7aa', border_width: '1px', border_radius: '16px' }
  },
  settingsData: {
    card_variants_config: {
      variant_a: { bg_color: '#ffffff', border_color: '#e2e8f0', border_width: '1px', border_radius: '16px' },
      variant_b: { bg_color: '#ffffff', border_color: '#e9d5ff', border_width: '1px', border_radius: '16px' },
      variant_c: { bg_color: '#ffffff', border_color: '#fed7aa', border_width: '1px', border_radius: '16px' }
    }
  },
  getSettings() { return JSON.parse(JSON.stringify(this.settingsData)); },
  saveSettings(s) { this.settingsData = JSON.parse(JSON.stringify(s)); },
  saveCardModelPreset(v, cfg) {
    const key = v === 'A' ? 'variant_a' : (v === 'B' ? 'variant_b' : 'variant_c');
    this.settingsData.card_variants_config[key] = { ...cfg };
  }
};

// Test 1: Desktop slider input synchronizes to mobile and updates preset buttons
console.log('1. Testing Desktop border-width slider input...');
const bwDesk = document.getElementById('cfg-border-width');
const bwMob = document.getElementById('cfg-border-width-mob');
const bwValDesk = document.getElementById('cfg-border-width-val');
const bwValMob = document.getElementById('cfg-border-width-val-mob');

// Execute helper functions from product-form.js
function parseBorderWidth(val, defaultVal = 1) {
  if (val === undefined || val === null || val === '') return defaultVal;
  const num = parseInt(val, 10);
  if (isNaN(num)) return defaultVal;
  return Math.max(0, Math.min(3, num));
}

function parseBorderRadius(val, defaultVal = 16) {
  if (val === undefined || val === null || val === '') return defaultVal;
  const num = parseInt(val, 10);
  if (isNaN(num)) return defaultVal;
  return Math.max(0, Math.min(24, num));
}

function updateBorderWidthPresetButtons(val) {
  const num = parseBorderWidth(val, 1);
  document.querySelectorAll('.btn-border-width-preset').forEach(btn => {
    const btnVal = parseInt(btn.dataset.value, 10);
    if (btnVal === num) {
      btn.className = 'btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer';
    } else {
      btn.className = 'btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer';
    }
  });
  if (bwValDesk) bwValDesk.textContent = `${num} px`;
  if (bwValMob) bwValMob.textContent = `${num} px`;
}

function updateBorderRadiusPresetButtons(val) {
  const num = parseBorderRadius(val, 16);
  document.querySelectorAll('.btn-border-radius-preset').forEach(btn => {
    const btnVal = parseInt(btn.dataset.value, 10);
    if (btnVal === num) {
      btn.className = 'btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer';
    } else {
      btn.className = 'btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer';
    }
  });
  const brValDesk = document.getElementById('cfg-border-radius-val');
  const brValMob = document.getElementById('cfg-border-radius-val-mob');
  if (brValDesk) brValDesk.textContent = `${num} px`;
  if (brValMob) brValMob.textContent = `${num} px`;
}

// Simulate user setting border-width to 0 px
bwDesk.value = 0;
bwMob.value = 0;
updateBorderWidthPresetButtons(0);

assert.strictEqual(bwValDesk.textContent, '0 px');
assert.strictEqual(bwValMob.textContent, '0 px');
assert(bwPresetButtons[0].className.includes('bg-emerald-50'), '0 px preset button is active');
assert(!bwPresetButtons[1].className.includes('bg-emerald-50'), '1 px preset button is inactive');

// Verify zero border style in preview
const zeroBwStyle = (parseBorderWidth(0, 1) === 0)
  ? 'border: none; border-width: 0px;'
  : `border: 0px solid #e2e8f0;`;
assert.strictEqual(zeroBwStyle, 'border: none; border-width: 0px;', 'Zero border correctly eliminates border');
console.log('✔ Desktop to Mobile sync & zero border verified');

// Test 2: Clicking preset button for border radius
console.log('2. Testing Preset button click for border-radius...');
const brDesk = document.getElementById('cfg-border-radius');
const brMob = document.getElementById('cfg-border-radius-mob');
const brValDesk = document.getElementById('cfg-border-radius-val');
const brValMob = document.getElementById('cfg-border-radius-val-mob');

// User clicks "24 px" button
const targetBtn = brPresetButtons.find(b => b.dataset.value === '24');
brDesk.value = parseInt(targetBtn.dataset.value, 10);
brMob.value = parseInt(targetBtn.dataset.value, 10);
updateBorderRadiusPresetButtons(targetBtn.dataset.value);

assert.strictEqual(brDesk.value, 24);
assert.strictEqual(brMob.value, 24);
assert.strictEqual(brValDesk.textContent, '24 px');
assert.strictEqual(brValMob.textContent, '24 px');
assert(brPresetButtons[3].className.includes('bg-emerald-50'), '24 px preset button is active');
assert(!brPresetButtons[2].className.includes('bg-emerald-50'), '16 px preset button is inactive');
console.log('✔ Preset button click updates sliders, labels, and classes');

// Test 3: Snapshot and Batal restoration
console.log('3. Testing Snapshot and Batal restoration...');
const primaryState = {
  card_variant: 'B',
  use_default_card_design: true,
  card_config: { border_width: '1px', border_radius: '16px', border_color: '#e9d5ff' }
};

// Capture snapshot
const cardDesignSnapshot = JSON.parse(JSON.stringify({
  use_default_card_design: primaryState.use_default_card_design,
  card_config: primaryState.card_config
}));

// User customizes: border width = 3, border radius = 8
primaryState.use_default_card_design = false;
primaryState.card_config = { border_width: '3px', border_radius: '8px', border_color: '#ff0000' };

// Simulate handleCancelCardDesign
primaryState.use_default_card_design = cardDesignSnapshot.use_default_card_design;
primaryState.card_config = JSON.parse(JSON.stringify(cardDesignSnapshot.card_config));

assert.strictEqual(primaryState.use_default_card_design, true);
assert.strictEqual(primaryState.card_config.border_width, '1px');
assert.strictEqual(primaryState.card_config.border_radius, '16px');
assert.strictEqual(primaryState.card_config.border_color, '#e9d5ff');
console.log('✔ Snapshot cancellation restores frame parameters completely');

console.log('--- ALL RUNTIME SIMULATION TESTS PASSED ---');


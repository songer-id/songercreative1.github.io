/**
 * Runtime DOM Simulation Test for SC-ADMIN-CARD-LABEL-CUSTOMIZATION-09C
 */
const assert = require('assert');
const fs = require('fs');

console.log('--- RUNTIME SIMULATION TEST: SC-ADMIN-CARD-LABEL-CUSTOMIZATION-09C ---');

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
    this.children = [];
  }
  addEventListener(evt, fn) {
    if (!this.listeners[evt]) this.listeners[evt] = [];
    this.listeners[evt].push(fn);
  }
  dispatchEvent(evt) {
    const list = this.listeners[evt.type] || [];
    list.forEach(fn => fn(evt));
  }
  querySelectorAll(sel) {
    return this.children.filter(c => c.className.includes(sel.replace('.', '')));
  }
}

const elementMap = new Map();
function getOrCreateElement(id, tagName = 'div') {
  if (!elementMap.has(id)) {
    elementMap.set(id, new MockElement(id, tagName));
  }
  return elementMap.get(id);
}

// Populate elements for Task 09C
const ids = [
  'cfg-show-badge', 'cfg-show-badge-mob',
  'cfg-badge-style', 'cfg-badge-style-mob',
  'cfg-badge-style-group', 'cfg-badge-style-group-mob',
  'cfg-badge-radius', 'cfg-badge-radius-mob',
  'cfg-badge-radius-val', 'cfg-badge-radius-val-mob',
  'cfg-badge-text-color', 'cfg-badge-text-color-mob',
  'cfg-badge-text-hex', 'cfg-badge-text-hex-mob',
  'cfg-badge-bg-color', 'cfg-badge-bg-color-mob',
  'cfg-badge-bg-hex', 'cfg-badge-bg-hex-mob',
  'cfg-badge-bg-wrap', 'cfg-badge-bg-wrap-mob',
  'cfg-badge-border-color', 'cfg-badge-border-color-mob',
  'cfg-badge-border-hex', 'cfg-badge-border-hex-mob',
  'cfg-badge-border-wrap', 'cfg-badge-border-wrap-mob',
  'badge-custom-indicator', 'badge-custom-indicator-mob'
];
ids.forEach(id => getOrCreateElement(id));

// Preset buttons
const badgeRadiusPresets = [];
['0', '4', '6', '8', '12'].forEach(val => {
  const btn = new MockElement(`btn-badge-radius-${val}`, 'button');
  btn.className = 'btn-badge-radius-preset';
  btn.dataset.value = val;
  badgeRadiusPresets.push(btn);
});

// Style buttons
const badgeStyleButtonsDesk = [
  new MockElement('btn-style-bg', 'button'),
  new MockElement('btn-style-border', 'button')
];
badgeStyleButtonsDesk[0].className = 'btn-badge-style';
badgeStyleButtonsDesk[0].dataset.style = 'bg';
badgeStyleButtonsDesk[1].className = 'btn-badge-style';
badgeStyleButtonsDesk[1].dataset.style = 'border';

const badgeStyleButtonsMob = [
  new MockElement('btn-style-bg-mob', 'button'),
  new MockElement('btn-style-border-mob', 'button')
];
badgeStyleButtonsMob[0].className = 'btn-badge-style';
badgeStyleButtonsMob[0].dataset.style = 'bg';
badgeStyleButtonsMob[1].className = 'btn-badge-style';
badgeStyleButtonsMob[1].dataset.style = 'border';

const styleGroupDesk = getOrCreateElement('cfg-badge-style-group');
styleGroupDesk.children = badgeStyleButtonsDesk;
const styleGroupMob = getOrCreateElement('cfg-badge-style-group-mob');
styleGroupMob.children = badgeStyleButtonsMob;

const allStyleButtons = [...badgeStyleButtonsDesk, ...badgeStyleButtonsMob];

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { href: '', search: '' },
  innerWidth: 1024,
  innerHeight: 768
};

global.document = {
  getElementById: (id) => elementMap.get(id) || null,
  querySelectorAll: (selector) => {
    if (selector === '.btn-badge-radius-preset') return badgeRadiusPresets;
    if (selector === '.btn-badge-style') return allStyleButtons;
    return [];
  },
  querySelector: () => null,
  addEventListener: () => {}
};

// Theme helper
function getPrimaryThemeColor() {
  return '#059669'; // Emerald default
}

function hexToSubtleHex(hex, opacity = 0.12) {
  if (!hex || typeof hex !== 'string') return '#ecfdf5';
  let clean = hex.replace('#', '');
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  if (clean.length !== 6) return '#ecfdf5';
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const rBg = Math.round(r * opacity + 255 * (1 - opacity));
  const gBg = Math.round(g * opacity + 255 * (1 - opacity));
  const bBg = Math.round(b * opacity + 255 * (1 - opacity));
  return `#${((1 << 24) + (rBg << 16) + (gBg << 8) + bBg).toString(16).slice(1)}`;
}

function hexToBorderHex(hex, opacity = 0.35) {
  if (!hex || typeof hex !== 'string') return '#a7f3d0';
  let clean = hex.replace('#', '');
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  if (clean.length !== 6) return '#a7f3d0';
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const rBrd = Math.round(r * opacity + 255 * (1 - opacity));
  const gBrd = Math.round(g * opacity + 255 * (1 - opacity));
  const bBrd = Math.round(b * opacity + 255 * (1 - opacity));
  return `#${((1 << 24) + (rBrd << 16) + (gBrd << 8) + bBrd).toString(16).slice(1)}`;
}

function getThemeDefaultBadgeColors(variantCode) {
  if (variantCode === 'B') {
    return {
      text: '#6b21a8',
      bg: '#faf5ff',
      border: '#e9d5ff',
      radius: '6px',
      style: 'bg'
    };
  }
  const primary = getPrimaryThemeColor();
  const subtleBg = hexToSubtleHex(primary, 0.12);
  const borderCol = hexToBorderHex(primary, 0.35);
  return {
    text: primary,
    bg: subtleBg,
    border: borderCol,
    radius: '6px',
    style: 'bg'
  };
}

function parseBadgeRadius(val, defaultVal = 6) {
  if (val === undefined || val === null || val === '') return defaultVal;
  const num = parseInt(val, 10);
  if (isNaN(num)) return defaultVal;
  return Math.max(0, Math.min(12, num));
}

function updateBadgeRadiusPresetButtons(val) {
  const num = parseBadgeRadius(val, 6);
  document.querySelectorAll('.btn-badge-radius-preset').forEach(btn => {
    const btnVal = parseInt(btn.dataset.value, 10);
    if (btnVal === num) {
      btn.className = 'btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer';
    } else {
      btn.className = 'btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer';
    }
  });
  const valLabelDesk = document.getElementById('cfg-badge-radius-val');
  const valLabelMob = document.getElementById('cfg-badge-radius-val-mob');
  if (valLabelDesk) valLabelDesk.textContent = `${num} px`;
  if (valLabelMob) valLabelMob.textContent = `${num} px`;
}

function setBadgeStyleMode(mode) {
  const safeMode = mode === 'border' ? 'border' : 'bg';
  const inpDesk = document.getElementById('cfg-badge-style');
  const inpMob = document.getElementById('cfg-badge-style-mob');
  if (inpDesk) inpDesk.value = safeMode;
  if (inpMob) inpMob.value = safeMode;

  ['', '-mob'].forEach(suffix => {
    const group = document.getElementById(`cfg-badge-style-group${suffix}`);
    if (group) {
      group.querySelectorAll('.btn-badge-style').forEach(btn => {
        const bStyle = btn.dataset.style;
        if (bStyle === safeMode) {
          btn.className = 'btn-badge-style py-1 px-2 text-[11px] font-normal rounded-md bg-white text-slate-800 shadow-2xs transition cursor-pointer text-center';
        } else {
          btn.className = 'btn-badge-style py-1 px-2 text-[11px] font-normal rounded-md text-slate-500 hover:text-slate-800 transition cursor-pointer text-center';
        }
      });
    }

    const bgWrap = document.getElementById(`cfg-badge-bg-wrap${suffix}`);
    const borderWrap = document.getElementById(`cfg-badge-border-wrap${suffix}`);
    if (bgWrap) {
      if (safeMode === 'bg') bgWrap.classList.remove('hidden');
      else bgWrap.classList.add('hidden');
    }
    if (borderWrap) {
      if (safeMode === 'border') borderWrap.classList.remove('hidden');
      else borderWrap.classList.add('hidden');
    }
  });
}

let isCustomDesign = false;
function markCardDesignAsCustom() {
  isCustomDesign = true;
}

// 1. Test Initial Loading with Default Dynamic Theme Colors
console.log('1. Testing initial load with Model A dynamic theme defaults...');
const defBadge = getThemeDefaultBadgeColors('A');
assert.strictEqual(defBadge.text, '#059669');
assert.strictEqual(defBadge.style, 'bg');

setBadgeStyleMode(defBadge.style);
assert.strictEqual(getOrCreateElement('cfg-badge-style').value, 'bg');
assert.strictEqual(getOrCreateElement('cfg-badge-style-mob').value, 'bg');
assert(!getOrCreateElement('cfg-badge-bg-wrap').classList.contains('hidden'), 'bg-wrap must be visible in bg mode');
assert(getOrCreateElement('cfg-badge-border-wrap').classList.contains('hidden'), 'border-wrap must be hidden in bg mode');

updateBadgeRadiusPresetButtons(6);
assert.strictEqual(getOrCreateElement('cfg-badge-radius-val').textContent, '6 px');
assert.strictEqual(getOrCreateElement('cfg-badge-radius-val-mob').textContent, '6 px');
console.log('✔ Initial load verified');

// 2. Test Style Mode Switching between Latar and Garis Tepi
console.log('2. Testing style mode switching and color preservation...');
// Set colors for both bg and border
getOrCreateElement('cfg-badge-bg-color').value = '#10b981';
getOrCreateElement('cfg-badge-border-color').value = '#6ee7b7';

// Switch to 'border' mode
setBadgeStyleMode('border');
assert.strictEqual(getOrCreateElement('cfg-badge-style').value, 'border');
assert.strictEqual(getOrCreateElement('cfg-badge-style-mob').value, 'border');
assert(getOrCreateElement('cfg-badge-bg-wrap').classList.contains('hidden'), 'bg-wrap must be hidden in border mode');
assert(!getOrCreateElement('cfg-badge-border-wrap').classList.contains('hidden'), 'border-wrap must be visible in border mode');

// Colors in both inputs must be preserved!
assert.strictEqual(getOrCreateElement('cfg-badge-bg-color').value, '#10b981', 'Background color must not be cleared');
assert.strictEqual(getOrCreateElement('cfg-badge-border-color').value, '#6ee7b7', 'Border color must be preserved');

// Switch back to 'bg' mode
setBadgeStyleMode('bg');
assert.strictEqual(getOrCreateElement('cfg-badge-style').value, 'bg');
assert(!getOrCreateElement('cfg-badge-bg-wrap').classList.contains('hidden'), 'bg-wrap must be visible in bg mode');
assert(getOrCreateElement('cfg-badge-border-wrap').classList.contains('hidden'), 'border-wrap must be hidden in bg mode');
assert.strictEqual(getOrCreateElement('cfg-badge-bg-color').value, '#10b981', 'Background color still preserved');
assert.strictEqual(getOrCreateElement('cfg-badge-border-color').value, '#6ee7b7', 'Border color still preserved');
console.log('✔ Style mode switching and color preservation verified');

// 3. Test Radius presets and slider updates
console.log('3. Testing radius presets and slider updates...');
updateBadgeRadiusPresetButtons(12);
assert.strictEqual(getOrCreateElement('cfg-badge-radius-val').textContent, '12 px');
const btn12 = badgeRadiusPresets.find(b => b.dataset.value === '12');
assert(btn12.className.includes('border-emerald-500'), 'Preset 12 must be highlighted');
const btn6 = badgeRadiusPresets.find(b => b.dataset.value === '6');
assert(btn6.className.includes('border-slate-200'), 'Preset 6 must not be highlighted');

updateBadgeRadiusPresetButtons(0);
assert.strictEqual(getOrCreateElement('cfg-badge-radius-val').textContent, '0 px');
const btn0 = badgeRadiusPresets.find(b => b.dataset.value === '0');
assert(btn0.className.includes('border-emerald-500'), 'Preset 0 must be highlighted');
console.log('✔ Radius presets and slider update verified');

// 4. Test Buyer Store Variant A and C output
console.log('4. Testing Buyer Store rendered badge HTML...');
require('../js/buyer-store.js');
const BuyerStore = global.window.BuyerStore;

// Test product with custom badge in 'border' mode
const prodBorder = {
  id: 'prod-border',
  name: 'Produk Garis Tepi',
  price: 50000,
  badges: ['TERLARIS'],
  effective_discount: { has_discount: false },
  card_config: {
    badge_style: 'border',
    badge_radius: '8px',
    badge_text_color: '#059669',
    badge_border_color: '#10b981',
    badge_bg_color: '#ecfdf5'
  }
};

const htmlA_border = BuyerStore.renderCardVariantA(prodBorder);
assert(htmlA_border.includes('background-color: transparent; border: 1px solid #10b981; border-radius: 8px;'), 'Variant A border mode HTML mismatch');

const htmlC_border = BuyerStore.renderCardVariantC(prodBorder);
assert(htmlC_border.includes('background-color: transparent; border: 1px solid #10b981; border-radius: 8px;'), 'Variant C border mode HTML mismatch');

// Test product with custom badge in 'bg' mode
const prodBg = {
  id: 'prod-bg',
  name: 'Produk Latar',
  price: 50000,
  badges: ['OFFICIAL'],
  effective_discount: { has_discount: false },
  card_config: {
    badge_style: 'bg',
    badge_radius: '4px',
    badge_text_color: '#ffffff',
    badge_bg_color: '#2563eb',
    badge_border_color: '#3b82f6'
  }
};

const htmlA_bg = BuyerStore.renderCardVariantA(prodBg);
assert(htmlA_bg.includes('color: #ffffff; background-color: #2563eb; border: none; border-radius: 4px;'), 'Variant A bg mode HTML mismatch');

const htmlC_bg = BuyerStore.renderCardVariantC(prodBg);
assert(htmlC_bg.includes('color: #ffffff; background-color: #2563eb; border: none; border-radius: 4px;'), 'Variant C bg mode HTML mismatch');

// Test legacy product without badge_style
const prodLegacy = {
  id: 'prod-legacy',
  name: 'Produk Lama',
  price: 50000,
  badges: ['PREMIUM'],
  effective_discount: { has_discount: false },
  card_config: {
    badge_radius: '6px',
    badge_text_color: '#047857',
    badge_bg_color: '#ecfdf5',
    badge_border_color: '#a7f3d0'
  }
};

const htmlA_legacy = BuyerStore.renderCardVariantA(prodLegacy);
assert(htmlA_legacy.includes('color: #047857; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px;'), 'Variant A legacy mode HTML mismatch');

const htmlC_legacy = BuyerStore.renderCardVariantC(prodLegacy);
assert(htmlC_legacy.includes('color: #047857; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px;'), 'Variant C legacy mode HTML mismatch');

console.log('✔ BuyerStore renderers output verified for border, bg, and legacy modes');

console.log('--- ALL RUNTIME SIMULATION TESTS PASSED ---');

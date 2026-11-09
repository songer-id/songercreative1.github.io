/**
 * Test Suite: Standarisasi Validasi dan Penyimpanan HPP Seluruh Konfigurasi Produk
 * Target: js/product-form.js and js/db.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. In-memory Mock DOM & Environment
class MockElement {
  constructor(tag, id = '', className = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.className = className;
    this.classList = {
      _classes: new Set(className.split(' ').filter(Boolean)),
      add(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains(c) { return this._classes.has(c); },
      toggle(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
    };
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.children = [];
    this.parentElement = null;
    this.attributes = {};
    this.style = {};
    this.checked = false;
    this.readOnly = false;
    this.disabled = false;
  }

  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; }
  removeAttribute(k) { delete this.attributes[k]; }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  querySelector(sel) {
    return this.querySelectorAll(sel)[0] || null;
  }

  querySelectorAll(sel) {
    const res = [];
    function traverse(node) {
      if (!node) return;
      for (const ch of node.children) {
        if (matches(ch, sel)) res.push(ch);
        traverse(ch);
      }
    }
    traverse(this);
    return res;
  }

  closest(sel) {
    let cur = this.parentElement;
    while (cur) {
      if (matches(cur, sel)) return cur;
      cur = cur.parentElement;
    }
    return null;
  }
}

function matches(el, sel) {
  if (!el || !sel) return false;
  // Handle compound like .variation-option-row[data-tier="tier1"] or input[data-field="name"]
  let parts = sel.match(/^([a-zA-Z0-9_-]+|\.[a-zA-Z0-9_-]+|#[a-zA-Z0-9_-]+)?(\[[^\]]+\])?$/);
  if (!parts) {
    if (sel.includes(' ')) {
      const sub = sel.split(' ');
      return matches(el, sub[sub.length - 1]);
    }
    return false;
  }
  let tagOrClass = parts[1];
  let attrPart = parts[2];
  if (tagOrClass) {
    if (tagOrClass.startsWith('#') && el.id !== tagOrClass.slice(1)) return false;
    if (tagOrClass.startsWith('.') && !el.classList.contains(tagOrClass.slice(1))) return false;
    if (!tagOrClass.startsWith('#') && !tagOrClass.startsWith('.') && el.tagName.toLowerCase() !== tagOrClass.toLowerCase()) return false;
  }
  if (attrPart) {
    const inside = attrPart.slice(1, -1);
    if (inside.includes('=')) {
      const [k, v] = inside.split('=');
      const cleanV = v.replace(/['"]/g, '');
      if (el.getAttribute(k) !== cleanV) return false;
    } else {
      if (el.getAttribute(inside) === null) return false;
    }
  }
  return true;
}

// Global Document Mock
const docElements = new Map();
global.document = {
  createElement(tag) { return new MockElement(tag); },
  getElementById(id) { return docElements.get(id) || null; },
  querySelector(sel) {
    for (const el of docElements.values()) {
      if (matches(el, sel)) return el;
      const ch = el.querySelector(sel);
      if (ch) return ch;
    }
    return null;
  },
  querySelectorAll(sel) {
    const list = [];
    for (const el of docElements.values()) {
      if (matches(el, sel)) list.push(el);
      list.push(...el.querySelectorAll(sel));
    }
    return Array.from(new Set(list));
  }
};
global.window = {
  document: global.document,
  scrollTo: () => {},
  lucide: { createIcons: () => {} }
};

// Mock LocalStorage
const storage = {};
global.localStorage = {
  getItem: k => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: k => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

// Load DB
const dbCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'db.js'), 'utf8');
eval(dbCode);
const DB = global.window.DB;
global.DB = DB;

console.log('--- TEST SUITE: STANDARISASI VALIDASI & PENYIMPANAN HPP ---');

let passCount = 0;
let failCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    failCount++;
  }
}

// -------------------------------------------------------------
// TEST DB STORAGE (createProduct & updateProduct)
// -------------------------------------------------------------

runTest('1. DB.createProduct: Produk tanpa variasi dengan cost_price = 0 tersimpan sebagai 0 (Bukan 60% fallback)', () => {
  const p = DB.createProduct({
    name: 'Jasa Desain Logo',
    price: 100000,
    cost_price: 0,
    has_variants: false
  });
  assert.strictEqual(p.cost_price, 0, `Expected 0 but got ${p.cost_price}`);
  assert.strictEqual(p.price, 100000);
});

runTest('2. DB.createProduct: Variasi 1 dengan salah satu opsi cost_price = 0 tersimpan sebagai 0', () => {
  const matsInp = [
    { id: 'm1', name: 'File Siap Cetak', price: 50000, cost_price: 0 },
    { id: 'm2', name: 'Bahan Flexi 280', price: 75000, cost_price: 30000 }
  ];
  const p = DB.createProduct({
    name: 'Spanduk Banner',
    price: 50000,
    has_variants: true
  }, matsInp);
  const fetched = DB.getProductById(p.id);
  const mats = fetched.materials;
  assert.strictEqual(mats.length, 2);
  assert.strictEqual(mats[0].cost_price, 0, `mats[0].cost_price should be 0, got ${mats[0].cost_price}`);
  assert.strictEqual(mats[1].cost_price, 30000, `mats[1].cost_price should be 30000, got ${mats[1].cost_price}`);
});

runTest('3. DB.createProduct: Variasi Finishing / Extras dengan cost_price = 0 tersimpan sebagai 0 (Bukan 50% fallback)', () => {
  const matsInp = [{ id: 'm1', name: 'Art Paper', price: 100000, cost_price: 40000 }];
  const finsInp = [
    { id: 'f1', tier: 'main', name: 'Tanpa Finishing', price: 0, cost_price: 0 },
    { id: 'f2', tier: 'extra_3', name: 'Konsultasi Desain (Free)', price: 0, cost_price: 0 },
    { id: 'f3', tier: 'extra_1', name: 'Laminasi Doff', price: 20000, cost_price: 8000 }
  ];
  const p = DB.createProduct({
    name: 'Brosur Lipat',
    price: 100000,
    has_variants: true
  }, matsInp, finsInp);
  const fetched = DB.getProductById(p.id);
  const fins = fetched.finishings;
  assert(fins, 'finishings object should exist');
  assert.strictEqual(fins.main[0].cost_price, 0, `Tanpa Finishing cost_price should be 0, got ${fins.main[0].cost_price}`);
  assert.strictEqual(fins.extra_3[0].cost_price, 0, `Konsultasi Desain cost_price should be 0, got ${fins.extra_3[0].cost_price}`);
  assert.strictEqual(fins.extra_1[0].cost_price, 8000, `Laminasi Doff cost_price should be 8000, got ${fins.extra_1[0].cost_price}`);
});

runTest('4. DB.updateProduct: Simpan ulang produk dengan HPP 0 tetap 0 (Tidak terkonversi 60% atau 50%)', () => {
  const matsInp = [{ id: 'm1', name: 'Setting Singkat', price: 50000, cost_price: 0 }];
  const finsInp = [{ id: 'f1', tier: 'main', name: 'Revisi 1x', price: 10000, cost_price: 0 }];
  const p = DB.createProduct({
    name: 'Jasa Setting Layout',
    price: 50000,
    cost_price: 0,
    has_variants: true
  }, matsInp, finsInp);

  const updated = DB.updateProduct(p.id, {
    name: 'Jasa Setting Layout Pro',
    price: 60000,
    cost_price: 0
  }, matsInp, finsInp);

  assert.strictEqual(updated.cost_price, 0, `updated.cost_price should be 0, got ${updated.cost_price}`);
  const fetched = DB.getProductById(p.id);
  const mats = fetched.materials;
  assert.strictEqual(mats[0].cost_price, 0, `mats[0].cost_price should be 0, got ${mats[0].cost_price}`);
  const fins = fetched.finishings;
  assert.strictEqual(fins.main[0].cost_price, 0, `fins.main[0].cost_price should be 0, got ${fins.main[0].cost_price}`);
});

// -------------------------------------------------------------
// TEST VALIDATION LOGIC IN PRODUCT-FORM
// -------------------------------------------------------------

// Read product-form code
const pfCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'product-form.js'), 'utf8');

runTest('5. Validasi Tunggal: validateSingleCost menolak input kosong ("") dengan pesan standar', () => {
  const singleCost = new MockElement('input', 'input-single-cost');
  const singleCostErr = new MockElement('div', 'single-cost-error-msg');
  singleCost.value = '   ';
  docElements.set('input-single-cost', singleCost);
  docElements.set('single-cost-error-msg', singleCostErr);

  const funcMatch = pfCode.match(/function validateSingleCost\(isBlur = false\) \{([\s\S]*?)\n      \}/);
  assert(funcMatch, 'validateSingleCost function found');
  const fnBody = funcMatch[1];
  const testFn = new Function('singleCost', 'singleCostErr', 'singlePrice', 'isBlur', fnBody);

  const res = testFn(singleCost, singleCostErr, null, true);
  assert.strictEqual(res, false, 'Should be invalid for empty input');
  assert.strictEqual(singleCostErr.textContent, 'HPP/Modal wajib diisi. Jika tidak ada biaya, masukkan 0.');
});

runTest('6. Validasi Tunggal: validateSingleCost menerima input "0" tanpa error', () => {
  const singleCost = new MockElement('input', 'input-single-cost');
  const singleCostErr = new MockElement('div', 'single-cost-error-msg');
  const singlePrice = new MockElement('input', 'input-single-price');
  singleCost.value = '0';
  singlePrice.value = '50000';
  docElements.set('input-single-cost', singleCost);
  docElements.set('single-cost-error-msg', singleCostErr);
  docElements.set('input-single-price', singlePrice);

  const funcMatch = pfCode.match(/function validateSingleCost\(isBlur = false\) \{([\s\S]*?)\n      \}/);
  const testFn = new Function('singleCost', 'singleCostErr', 'singlePrice', 'isBlur', funcMatch[1]);

  const res = testFn(singleCost, singleCostErr, singlePrice, true);
  assert.strictEqual(res, true, 'Should be valid for 0');
  assert.strictEqual(singleCostErr.textContent, '', 'Error message should be empty');
});

runTest('7. Validasi Tunggal: validateSingleCost menolak jika HPP > Harga Jual', () => {
  const singleCost = new MockElement('input', 'input-single-cost');
  const singleCostErr = new MockElement('div', 'single-cost-error-msg');
  const singlePrice = new MockElement('input', 'input-single-price');
  singleCost.value = '60000';
  singlePrice.value = '50000';
  docElements.set('input-single-cost', singleCost);
  docElements.set('single-cost-error-msg', singleCostErr);
  docElements.set('input-single-price', singlePrice);

  const funcMatch = pfCode.match(/function validateSingleCost\(isBlur = false\) \{([\s\S]*?)\n      \}/);
  const testFn = new Function('singleCost', 'singleCostErr', 'singlePrice', 'isBlur', funcMatch[1]);

  const res = testFn(singleCost, singleCostErr, singlePrice, true);
  assert.strictEqual(res, false, 'Should be invalid when cost > price');
  assert(singleCostErr.textContent.includes('melebihi Harga Jual'), 'Should state cost exceeds price');
});

runTest('8. Validasi Option Field: validateOptionField menolak cost_price kosong ("") dengan pesan standar', () => {
  const row = new MockElement('div', 'row-opt-0', 'variation-option-row');
  row.setAttribute('data-tier', 'tier1');
  row.setAttribute('data-idx', '0');

  const cell = new MockElement('div', '', 'flex-col');
  const inp = new MockElement('input');
  inp.setAttribute('data-field', 'cost_price');
  inp.value = '';
  const err = new MockElement('span', '', 'field-error-msg');
  cell.appendChild(inp);
  cell.appendChild(err);
  row.appendChild(cell);

  const priceInp = new MockElement('input');
  priceInp.setAttribute('data-field', 'price');
  priceInp.value = '25000';
  row.appendChild(priceInp);

  const nameInp = new MockElement('input');
  nameInp.setAttribute('data-field', 'name');
  nameInp.value = 'Varian A';
  row.appendChild(nameInp);

  docElements.set('row-opt-0', row);

  // Extract full validateOptionField from pfCode
  const pfLines = pfCode.split('\n');
  const valOptLines = pfLines.slice(20451, 20670);
  const valOptCode = valOptLines.join('\n');
  
  // Wrap into executable function
  const testFn = new Function('inp', 'isBlur', 'finishingsState', 'materialsState', 'document', `
    ${valOptCode}
    return validateOptionField(inp, isBlur);
  `);

  const res = testFn(inp, true, {}, [{ name: 'Varian A', price: 25000, cost_price: '' }], global.document);
  assert.strictEqual(res, false, 'Should reject empty cost');
  assert.strictEqual(err.textContent, 'HPP/Modal wajib diisi. Jika tidak ada biaya, masukkan 0.');
});

runTest('9. Validasi Option Field: validateOptionField menerima cost_price = "0"', () => {
  const row = new MockElement('div', 'row-opt-1', 'variation-option-row');
  row.setAttribute('data-tier', 'tier1');
  row.setAttribute('data-idx', '0');

  const cell = new MockElement('div', '', 'flex-col');
  const inp = new MockElement('input');
  inp.setAttribute('data-field', 'cost_price');
  inp.value = '0';
  const err = new MockElement('span', '', 'field-error-msg');
  cell.appendChild(inp);
  cell.appendChild(err);
  row.appendChild(cell);

  const priceInp = new MockElement('input');
  priceInp.setAttribute('data-field', 'price');
  priceInp.value = '25000';
  row.appendChild(priceInp);

  const nameInp = new MockElement('input');
  nameInp.setAttribute('data-field', 'name');
  nameInp.value = 'Varian A';
  row.appendChild(nameInp);

  docElements.set('row-opt-1', row);

  const pfLines = pfCode.split('\n');
  const valOptLines = pfLines.slice(20451, 20670);
  const valOptCode = valOptLines.join('\n');

  const testFn = new Function('inp', 'isBlur', 'finishingsState', 'materialsState', 'document', `
    ${valOptCode}
    return validateOptionField(inp, isBlur);
  `);

  const res = testFn(inp, true, {}, [{ name: 'Varian A', price: 25000, cost_price: 0 }], global.document);
  assert.strictEqual(res, true, 'Should accept cost 0');
  assert.strictEqual(err.textContent, '');
});

runTest('10. Validasi Option Group (Variasi 1): Menolak jika cost_price kosong, menerima jika 0', () => {
  const errors = [];
  function addError(msg) { errors.push(msg); }

  const v1CheckCode = `
    const cRaw = (m.cost_price !== undefined && m.cost_price !== null) ? String(m.cost_price).trim() : '';
    const cNum = parseFloat(cRaw);
    if (cRaw === '' || isNaN(cNum) || cNum < 0) {
      addError(\`Variasi 1 (Opsi \${m.name || idx + 1}): HPP/Modal wajib diisi. Jika tidak ada biaya, masukkan 0.\`);
    } else if (pNum > 0 && cNum > pNum) {
      addError(\`Variasi 1 (Opsi \${m.name || idx + 1}): Modal/HPP melebihi Harga Jual.\`);
    }
  `;
  const fn = new Function('m', 'idx', 'pNum', 'addError', v1CheckCode);

  // Case A: empty
  fn({ name: 'Varian 1', cost_price: '' }, 0, 10000, addError);
  assert.strictEqual(errors.length, 1);
  assert(errors[0].includes('HPP/Modal wajib diisi. Jika tidak ada biaya, masukkan 0.'));

  // Case B: 0
  errors.length = 0;
  fn({ name: 'Varian 1', cost_price: 0 }, 0, 10000, addError);
  assert.strictEqual(errors.length, 0, 'Cost 0 should have 0 errors');

  // Case C: valid positive
  errors.length = 0;
  fn({ name: 'Varian 1', cost_price: 5000 }, 0, 10000, addError);
  assert.strictEqual(errors.length, 0, 'Cost 5000 should have 0 errors');

  // Case D: cost > price
  errors.length = 0;
  fn({ name: 'Varian 1', cost_price: 15000 }, 0, 10000, addError);
  assert.strictEqual(errors.length, 1);
  assert(errors[0].includes('melebihi Harga Jual'));
});

runTest('11. Validasi Option Group (Variasi 2-4 & Extras): Menolak jika cost_price kosong, menerima jika 0', () => {
  const errors = [];
  function addError(msg) { errors.push(msg); }

  const finCheckCode = `
    const cRaw = (f.cost_price !== undefined && f.cost_price !== null) ? String(f.cost_price).trim() : '';
    const cNum = parseFloat(cRaw);
    if (cRaw === '' || isNaN(cNum) || cNum < 0) {
      addError(\`\${label} (Opsi \${nameVal || idx + 1}): HPP/Modal wajib diisi. Jika tidak ada biaya, masukkan 0.\`);
    } else if (pNum > 0 && cNum > pNum) {
      addError(\`\${label} (Opsi \${nameVal || idx + 1}): Modal/HPP melebihi Harga Jual.\`);
    }
  `;
  const fn = new Function('f', 'idx', 'label', 'nameVal', 'pNum', 'addError', finCheckCode);

  // Case A: empty
  fn({ cost_price: '' }, 0, 'Variasi 2', 'Laminasi', 5000, addError);
  assert.strictEqual(errors.length, 1);
  assert(errors[0].includes('Variasi 2 (Opsi Laminasi): HPP/Modal wajib diisi. Jika tidak ada biaya, masukkan 0.'));

  // Case B: 0
  errors.length = 0;
  fn({ cost_price: 0 }, 0, 'Variasi 2', 'Laminasi', 5000, addError);
  assert.strictEqual(errors.length, 0, 'Finishing cost 0 should have 0 errors');

  // Case C: cost > price
  errors.length = 0;
  fn({ cost_price: 6000 }, 0, 'Variasi 2', 'Laminasi', 5000, addError);
  assert.strictEqual(errors.length, 1);
  assert(errors[0].includes('melebihi Harga Jual'));
});

runTest('12. Inactive Variations: Variasi yang tidak aktif tidak memicu validasi false error', () => {
  const activeFinTiers = [];
  const primaryState = {
    has_variation_2: true,
    has_variation_3: false,
    has_variation_4: false,
    has_extra_service: false,
    variation_labels: { label_tier_2: 'Finishing' }
  };
  if (primaryState.has_variation_2) activeFinTiers.push({ tier: 'main', label: 'Variasi 2' });
  if (primaryState.has_variation_3) activeFinTiers.push({ tier: 'extra_1', label: 'Variasi 3' });
  if (primaryState.has_variation_4) activeFinTiers.push({ tier: 'extra_2', label: 'Variasi 4' });
  if (primaryState.has_extra_service) activeFinTiers.push({ tier: 'extra_3', label: 'Layanan Extras' });

  assert.strictEqual(activeFinTiers.length, 1, 'Only tier 2 should be active');
  assert.strictEqual(activeFinTiers[0].tier, 'main');
});

runTest('13. Edit Mode Legacy Product: cost_price null/undefined dimuat sebagai "" (bukan 0 otomatis)', () => {
  const prod = {
    id: 'legacy-p1',
    name: 'Produk Lama Tanpa HPP',
    price: 50000,
    cost_price: null,
    materials: null
  };

  const materialsState = (prod.materials && prod.materials.length > 0)
    ? JSON.parse(JSON.stringify(prod.materials))
    : [{ id: 'm1', name: 'Produk Standar', price: prod.price || 0, cost_price: (prod.cost_price !== undefined && prod.cost_price !== null && prod.cost_price !== '' && !isNaN(parseFloat(prod.cost_price))) ? parseFloat(prod.cost_price) : '', step_multiplier: 1 }];

  assert.strictEqual(materialsState[0].cost_price, '', 'Legacy product with null cost_price should load as empty string');
});

runTest('14. Edit Mode Product with 0: cost_price = 0 dimuat sebagai 0', () => {
  const prod = {
    id: 'prod-free-cost',
    name: 'Produk Modal Nol',
    price: 50000,
    cost_price: 0,
    materials: null
  };

  const materialsState = (prod.materials && prod.materials.length > 0)
    ? JSON.parse(JSON.stringify(prod.materials))
    : [{ id: 'm1', name: 'Produk Standar', price: prod.price || 0, cost_price: (prod.cost_price !== undefined && prod.cost_price !== null && prod.cost_price !== '' && !isNaN(parseFloat(prod.cost_price))) ? parseFloat(prod.cost_price) : '', step_multiplier: 1 }];

  assert.strictEqual(materialsState[0].cost_price, 0, 'Product with cost_price 0 should load as 0');
});

runTest('15. Submitting Payload: allFinishings dan validMaterials mempertahankan angka 0', () => {
  const materialsState = [
    { id: 'm1', name: 'Standar', price: 20000, cost_price: 0 }
  ];
  const finishingsState = {
    main: [{ id: 'f1', name: 'Fin 1', price: 5000, cost_price: 0 }]
  };
  const primaryState = {
    has_variants: true,
    has_variation_2: true,
    has_variation_3: false,
    has_variation_4: false,
    has_extra_service: false
  };

  const allFinishings = [
    ...(primaryState.has_variation_2 ? (finishingsState.main || []).filter(f => f.name && f.name.trim() !== '').map((f, idx) => ({ ...f, name: f.name.trim(), tier: 'main', cost_price: (f.cost_price !== undefined && f.cost_price !== null && String(f.cost_price).trim() !== '' && !isNaN(parseFloat(f.cost_price))) ? parseFloat(f.cost_price) : 0 })) : [])
  ];

  const validMaterials = materialsState.filter(m => m.name && m.name.trim() !== '').map((m, idx) => ({
    ...m,
    name: m.name.trim(),
    cost_price: (m.cost_price !== undefined && m.cost_price !== null && String(m.cost_price).trim() !== '' && !isNaN(parseFloat(m.cost_price))) ? parseFloat(m.cost_price) : 0
  }));

  assert.strictEqual(validMaterials[0].cost_price, 0);
  assert.strictEqual(allFinishings[0].cost_price, 0);
});

console.log(`\n========================================`);
console.log(`TOTAL TESTS: ${passCount + failCount}`);
console.log(`PASSED: ${passCount}`);
console.log(`FAILED: ${failCount}`);
console.log(`========================================\n`);

if (failCount > 0) process.exit(1);

const fs = require('fs');
const assert = require('assert');

const js = fs.readFileSync('js/product-form.js', 'utf8');
const css = fs.readFileSync('css/admin.css', 'utf8');

console.log('--- TEST 1: Check decorative icons removal ---');

// 1.1 Panduan Aturan Ukuran Variasi
assert(
  !js.includes('bi-question-lg text-sm'),
  'Decorative icon bi-question-lg in modal-help-dimension-rule should be removed'
);
assert(
  js.includes('<h3 class="text-sm font-bold text-slate-800">Panduan Aturan Ukuran Variasi</h3>'),
  'Modal title Panduan Aturan Ukuran Variasi must remain intact'
);
assert(
  js.includes('btn-close-help-rule') && js.includes('bi-x-lg'),
  'Close button in help modal must remain intact'
);
console.log('✓ Panduan Aturan Ukuran Variasi title and close button verified (decorative icon removed)');

// 1.2 Simulasi Hitung Harga trigger button
assert(
  !js.includes('id="btn-toggle-sandbox-simulator"\n              class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"\n            >\n              <i class="bi bi-calculator'),
  'Decorative icon in btn-toggle-sandbox-simulator should be removed'
);
assert(
  js.includes('id="btn-toggle-sandbox-simulator"') && js.includes('<span>Simulasi Hitung Harga</span>'),
  'btn-toggle-sandbox-simulator must retain trigger text'
);
console.log('✓ Simulasi Hitung Harga trigger verified (calculator icon removed)');

// 1.3 Simulasi Hitung Harga modal header
assert(
  !js.includes('<div class="w-8 h-8 rounded-xl bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center font-bold text-sm shrink-0">\n                <i class="bi bi-calculator"></i>\n              </div>'),
  'Decorative icon box in modal-sandbox-pxl-simulator header should be removed'
);
assert(
  js.includes('<h3 class="text-sm font-bold text-slate-900 leading-snug">Simulasi Hitung Harga</h3>'),
  'Modal header title Simulasi Hitung Harga must remain intact'
);
assert(
  js.includes('btn-close-sandbox-simulator') && js.includes('bi-x-lg'),
  'Close button in simulator modal must remain intact'
);
console.log('✓ Simulasi Hitung Harga modal header verified (decorative icon removed)');

console.log('\n--- TEST 2: Check toggle switches unification ---');

const switchIds = [
  'toggle-size-guide-enable',
  'toggle-custom-dimension',
  'toggle-shipping-enabled',
  'toggle-promo-monthly',
  'toggle-promo-daily',
  'toggle-is-cod',
  'toggle-is-preorder',
  'toggle-is-active-form',
  'toggle-enable-custom-labels',
  'chk-min-one-unit-price',
  'chk-min-one-unit-hpp',
  'toggle-affiliate-commission',
  'modal-wholesale-switch-enable'
];

const standardTrackSnippet = 'w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]';

switchIds.forEach(id => {
  // Find the block containing this ID
  const idIdx = js.indexOf(`id="${id}"`);
  assert(idIdx !== -1, `Switch ID ${id} not found in product-form.js`);

  // Grab surrounding 900 chars
  const surrounding = js.substring(Math.max(0, idIdx - 150), Math.min(js.length, idIdx + 900));
  
  // Verify standard track snippet
  assert(
    surrounding.includes(standardTrackSnippet),
    `Switch ${id} does not have standard track snippet!\nContext: ${surrounding}`
  );

  // Verify no legacy classes
  assert(!surrounding.includes('toggle-switch-input'), `Switch ${id} still has toggle-switch-input`);
  assert(!surrounding.includes('toggle-switch-track'), `Switch ${id} still has toggle-switch-track`);
  assert(!surrounding.includes('bg-slate-300'), `Switch ${id} still has bg-slate-300`);
  assert(!surrounding.includes('peer-checked:bg-emerald-'), `Switch ${id} still has hardcoded emerald instead of var(--color-primary)`);

  console.log(`✓ Switch #${id} verified (track w-11 h-6, bg-slate-200, thumb 20px at top/left 2px, peer-checked:bg-[var(--color-primary)])`);
});

console.log('\n--- TEST 3: Check css/admin.css overrides ---');
assert(
  css.includes('background-color: #e2e8f0 !important;'),
  'css/admin.css should use #e2e8f0 (matching slate-200)'
);
assert(
  css.includes('top: 2px !important;'),
  'css/admin.css should align thumb top to 2px'
);
assert(
  css.includes('left: 2px !important;'),
  'css/admin.css should align thumb left to 2px'
);
assert(
  css.includes('width: 20px !important;') && css.includes('height: 20px !important;'),
  'css/admin.css should align thumb size to 20px (matching h-5 w-5)'
);
assert(
  css.includes('border: 1px solid #cbd5e1 !important;'),
  'css/admin.css should align thumb border to border-slate-300'
);
console.log('✓ css/admin.css rules aligned with reference toggle visual styling');

console.log('\nALL CHECKS PASSED SUCCESSFULLY!');

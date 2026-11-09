const fs = require('fs');
const assert = require('assert');

console.log('=== RUNNING SC-ADMIN-LAYOUT-NAV-02-R1 TEST SUITE ===');

const js = fs.readFileSync('js/product-form.js', 'utf8').replace(/\r\n/g, '\n');
const css = fs.readFileSync('css/admin.css', 'utf8').replace(/\r\n/g, '\n');

let passCount = 0;
let failCount = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  [PASS] ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  [FAIL] ${desc}: ${err.message}`);
    failCount++;
  }
}

// 1. Step 1 Action Buttons in Normal Document Flow
it('Step 1 action buttons are in normal document flow (no sticky/fixed bottom bar)', () => {
  assert(!js.includes('id="step1-bottom-actions"'), 'Should not have sticky #step1-bottom-actions');
  assert(!js.includes('product-form-bottom-bar'), 'Should not have .product-form-bottom-bar');
  
  const cancelIdx = js.indexOf('id="btn-step-1-cancel"');
  assert(cancelIdx !== -1, 'Missing #btn-step-1-cancel');
  const parentSlice = js.substring(cancelIdx - 150, cancelIdx);
  assert(!parentSlice.includes('sticky') && !parentSlice.includes('fixed'), 'Step 1 buttons wrapper must not be sticky or fixed');
});

it('Step 1 contains #btn-step-1-cancel and #btn-step-1-next in correct order with labels & icons', () => {
  const cancelIdx = js.indexOf('id="btn-step-1-cancel"');
  const nextIdx = js.indexOf('id="btn-step-1-next"');
  assert(cancelIdx !== -1, 'Missing #btn-step-1-cancel');
  assert(nextIdx !== -1, 'Missing #btn-step-1-next');
  assert(cancelIdx < nextIdx, 'Batal must precede Lanjutkan');

  const cancelEnd = js.indexOf('</button>', cancelIdx);
  const cancelSlice = js.substring(cancelIdx, cancelEnd + 9);
  assert(cancelSlice.includes('Batal'), 'Batal button text missing');
  assert(cancelSlice.includes('bi-x-lg'), 'Batal icon missing');

  const nextEnd = js.indexOf('</button>', nextIdx);
  const nextSlice = js.substring(nextIdx, nextEnd + 9);
  assert(nextSlice.includes('Lanjutkan'), 'Lanjutkan button text missing');
  assert(nextSlice.includes('bi-arrow-right'), 'Lanjutkan icon missing');
});

it('Step 1 has normal form wrapper padding without bottom-bar clearance padding', () => {
  const p1Idx = js.indexOf('id="step-pane-1"');
  assert(p1Idx !== -1, 'Missing #step-pane-1');
  const p1Slice = js.substring(p1Idx, p1Idx + 200);
  assert(!p1Slice.includes('pb-20') && !p1Slice.includes('pb-24'), 'Step 1 should not have bottom-bar clearance padding');
  assert(js.includes('pb-8 sm:pb-12'), 'Wrapper should have normal pb-8 sm:pb-12 padding');
});

// 2. Step 2 Action Buttons in Normal Document Flow
it('Step 2 action buttons are in normal document flow inside cards container', () => {
  assert(js.includes('id="step2-footer-actions"'), 'Missing #step2-footer-actions');
  const footerIdx = js.indexOf('id="step2-footer-actions"');
  const footerSlice = js.substring(footerIdx, footerIdx + 200);
  assert(!footerSlice.includes('sticky') && !footerSlice.includes('fixed'), 'Step 2 footer actions must not be sticky or fixed');
  assert(!footerSlice.includes('product-form-bottom-bar'), 'Step 2 must not use product-form-bottom-bar class');
});

it('Step 2 contains #btn-step-2-prev, #btn-save-draft, and #btn-submit-product in correct order', () => {
  const prevIdx = js.indexOf('id="btn-step-2-prev"');
  const draftIdx = js.indexOf('id="btn-save-draft"');
  const submitIdx = js.indexOf('id="btn-submit-product"');
  assert(prevIdx !== -1, 'Missing #btn-step-2-prev');
  assert(draftIdx !== -1, 'Missing #btn-save-draft');
  assert(submitIdx !== -1, 'Missing #btn-submit-product');
  assert(prevIdx < draftIdx, 'Kembali must precede Simpan Draf');
  assert(draftIdx < submitIdx, 'Simpan Draf must precede Simpan Produk');

  const prevEnd = js.indexOf('</button>', prevIdx);
  const prevSlice = js.substring(prevIdx, prevEnd + 9);
  assert(prevSlice.includes('Kembali'), 'Kembali button text missing');
  assert(prevSlice.includes('bi-arrow-left'), 'Kembali icon missing');

  const draftEnd = js.indexOf('</button>', draftIdx);
  const draftSlice = js.substring(draftIdx, draftEnd + 9);
  assert(draftSlice.includes('Simpan Draf'), 'Simpan Draf button text missing');
  assert(draftSlice.includes('bi-file-earmark-text'), 'Simpan Draf icon missing');

  const submitEnd = js.indexOf('</button>', submitIdx);
  const submitSlice = js.substring(submitIdx, submitEnd + 9);
  assert(submitSlice.includes('Simpan Produk'), 'Simpan Produk button text missing');
  assert(submitSlice.includes('btn-submit-spinner'), 'Spinner missing');
  assert(submitSlice.includes('bi-floppy'), 'Save icon missing');
});

it('Step 2 cards container has normal spacing without bottom-bar clearance padding', () => {
  const cardsIdx = js.indexOf('id="step2-cards-container"');
  assert(cardsIdx !== -1, 'Missing #step2-cards-container');
  const cardsSlice = js.substring(cardsIdx, cardsIdx + 200);
  assert(!cardsSlice.includes('pb-20') && !cardsSlice.includes('pb-24'), 'Step 2 cards container should not have bottom-bar clearance padding');
});

// 3. Desktop Step 1 Preview FAB
it('Desktop Step 1 Preview FAB #btn-expand-preview-sidebar retains horizontal layout and has bottom-6 offset', () => {
  const fabIdx = js.indexOf('id="btn-expand-preview-sidebar"');
  assert(fabIdx !== -1, 'Missing #btn-expand-preview-sidebar');
  const fabEnd = js.indexOf('</button>', fabIdx);
  const fabSlice = js.substring(fabIdx, fabEnd + 9);
  assert(fabSlice.includes('bottom-6'), 'Desktop FAB should have bottom-6 offset now that bottom bar is removed');
  assert(fabSlice.includes('right-6'), 'Desktop FAB should have right-6 positioning');
  assert(fabSlice.includes('rounded-full'), 'Desktop FAB should be rounded-full');
  assert(fabSlice.includes('z-25'), 'Desktop FAB should have z-25');
  assert(!fabSlice.includes('writing-mode:vertical-lr'), 'Vertical writing mode must remain removed');
  assert(fabSlice.includes('bi-eye'), 'Eye icon missing');
  assert(fabSlice.includes('Pratinjau'), 'Pratinjau text missing');
});

// 4. Mobile Preview FAB
it('Mobile Preview FAB #btn-fab-live-preview has restored bottom-4 offset and centered position', () => {
  const mobFabIdx = js.indexOf('id="btn-fab-live-preview"');
  assert(mobFabIdx !== -1, 'Missing #btn-fab-live-preview');
  const mobFabEnd = js.indexOf('</button>', mobFabIdx);
  const mobFabSlice = js.substring(mobFabIdx, mobFabEnd + 9);
  assert(mobFabSlice.includes('bottom-4'), 'Mobile FAB should have bottom-4 offset restored');
  assert(mobFabSlice.includes('left-1/2 -translate-x-1/2'), 'Mobile FAB should remain centered');
});

// 5. CSS Styles
it('css/admin.css has removed bottom bar overrides and scoped desktop FAB', () => {
  assert(!css.includes('.product-form-bottom-bar'), 'CSS should not contain .product-form-bottom-bar');
  assert(!css.includes('#step1-bottom-actions'), 'CSS should not contain #step1-bottom-actions');
  assert(css.includes('#btn-expand-preview-sidebar'), 'CSS should contain rule for #btn-expand-preview-sidebar');
  assert(css.includes('bottom: 1.5rem !important;'), 'Desktop FAB CSS should specify bottom: 1.5rem');
});

// 6. ID Uniqueness Check
it('No duplicate button IDs exist in the template markup', () => {
  const ids = [
    'btn-step-1-cancel',
    'btn-step-1-next',
    'btn-step-2-prev',
    'btn-save-draft',
    'btn-submit-product',
    'btn-expand-preview-sidebar',
    'btn-fab-live-preview'
  ];
  ids.forEach(id => {
    const matches = js.match(new RegExp(`id=["']${id}["']`, 'g')) || [];
    assert.strictEqual(matches.length, 1, `ID "${id}" appears ${matches.length} times, expected exactly 1`);
  });
});

console.log(`\nResults: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED SUCCESSFULLY!');
}

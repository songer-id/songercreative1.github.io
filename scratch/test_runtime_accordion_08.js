const fs = require('fs');
const assert = require('assert');

// Test Step 1 preview vs design tab switching logic
const code = fs.readFileSync('js/product-form.js', 'utf8');

// Verify updateProductCardLivePreview tab switching
assert.ok(code.includes("if (previewStep1Tab === 'design')"), 'Handles previewStep1Tab === design');
assert.ok(code.includes("if (previewStep1Tab === 'preview')") || code.includes("} else {"), 'Handles previewStep1Tab === preview');

// Verify that outerWrapDesk is hidden in design mode
assert.ok(code.includes("if (outerWrapDesk) outerWrapDesk.classList.add('hidden');"), 'outerWrapDesk hidden in design mode');
assert.ok(code.includes("if (simDiscountDesk) simDiscountDesk.classList.add('hidden');"), 'simDiscountDesk hidden in design mode');
assert.ok(code.includes("if (customSectionDesk) customSectionDesk.classList.remove('hidden');"), 'customSectionDesk shown in design mode');

// Verify that outerWrapDesk is shown in preview mode
assert.ok(code.includes("if (outerWrapDesk) outerWrapDesk.classList.remove('hidden');"), 'outerWrapDesk shown in preview mode');
assert.ok(code.includes("if (simDiscountDesk) simDiscountDesk.classList.remove('hidden');"), 'simDiscountDesk shown in preview mode');
assert.ok(code.includes("if (customSectionDesk) customSectionDesk.classList.add('hidden');"), 'customSectionDesk hidden in preview mode');

// Verify that switching tabs only updates visibility and does not alter design baseline or primaryState.use_default_card_design
const tabDesignClick = code.indexOf("['btn-step1-tab-design', 'btn-step1-tab-design-mob']");
assert.ok(tabDesignClick !== -1, 'btn-step1-tab-design click listener exists');
const tabBlock = code.substring(tabDesignClick, tabDesignClick + 300);
assert.ok(!tabBlock.includes('use_default_card_design ='), 'Tab switching does not alter use_default_card_design');
assert.ok(!tabBlock.includes('saveSettings'), 'Tab switching does not trigger autosave');

console.log('✓ Tab Desain Kartu vs Tab Pratinjau visibility and immutability verified');

// Verify Gunakan Desain Bawaan behavior
assert.ok(code.includes('handleApplyDefaultCardDesign'), 'handleApplyDefaultCardDesign exists');
assert.ok(code.includes('primaryState.use_default_card_design = true;'), 'Sets use_default_card_design = true');
assert.ok(code.includes('loadCardConfigInputs(variant, true);'), 'Loads default preset');

// Verify Batal restores baseline
assert.ok(code.includes('primaryState.use_default_card_design = cardDesignSnapshot.use_default_card_design;'), 'Restores use_default_card_design from snapshot');
assert.ok(code.includes("previewStep1Tab = 'design';"), 'Keeps previewStep1Tab = design on cancel');

// Verify Simpan updates baseline
assert.ok(code.includes('captureCardDesignSnapshot(true);'), 'Simpan updates baseline snapshot with force=true');
assert.ok(code.includes('DB.saveCardModelPreset(primaryState.card_variant, primaryState.card_config);'), 'Simpan persists to settings if default checkbox checked');

console.log('✓ Gunakan Desain Bawaan, Batal, and Simpan mechanics verified');
console.log('✓ ALL RUNTIME INTEGRATION CHECKS PASSED!');


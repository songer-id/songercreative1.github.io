const fs = require('fs');
let code = fs.readFileSync('scratch/test_card_promo_09c_r6.js', 'utf8');

const target = `// 2.7 Test Dropdown Interactions (Open, Option Click, Outside Click, Escape)
console.log('\\n--- 2.7 Testing Dropdown UI Interactions ---');

// Trigger dropdown open
const btnDesk = mockDoc.getElementById('btn-discount-badge-pos');
const menu = mockDoc.getElementById('menu-discount-badge-pos');

// Simulate click on trigger button
btnDesk.dispatchEvent({ type: 'click', stopPropagation: () => {} });
assert.ok(!menu.classList.contains('hidden'), 'Menu must be visible after click');
assert.strictEqual(btnDesk.getAttribute('aria-expanded'), 'true', 'aria-expanded must be true when open');

// Simulate option selection
const optTopLeft = menu.querySelectorAll('.btn-disc-pos').find(b => b.dataset.pos === 'top-left');
optTopLeft.dispatchEvent({ type: 'click', stopPropagation: () => {}, preventDefault: () => {} });
assert.ok(menu.classList.contains('hidden'), 'Menu must close after selecting an option');
assert.strictEqual(mockDoc.getElementById('lbl-discount-badge-pos').textContent, 'Kiri Atas', 'Label must update to Kiri Atas');
assert.strictEqual(mockDoc.getElementById('cfg-discount-badge-position').value, 'top-left', 'Hidden input must update to top-left');

// Re-open and test outside click
btnDesk.dispatchEvent({ type: 'click', stopPropagation: () => {} });
assert.ok(!menu.classList.contains('hidden'), 'Menu reopened');

// Outside click
mockDoc.dispatchEvent({ type: 'click', target: mockDoc.body });
assert.ok(menu.classList.contains('hidden'), 'Menu must close on outside click');
assert.strictEqual(btnDesk.getAttribute('aria-expanded'), 'false', 'aria-expanded must be false');

// Re-open and test Escape key
btnDesk.dispatchEvent({ type: 'click', stopPropagation: () => {} });
assert.ok(!menu.classList.contains('hidden'), 'Menu reopened');
mockDoc.dispatchEvent({ type: 'keydown', key: 'Escape' });
assert.ok(menu.classList.contains('hidden'), 'Menu must close on Escape key');
assert.strictEqual(btnDesk.getAttribute('aria-expanded'), 'false', 'aria-expanded must be false after Escape');

console.log('✓ Dropdown interactions (trigger, select, outside click, Escape) passed!');`;

const repl = `// 2.7 Test Dropdown Helpers & State Transitions
console.log('\\n--- 2.7 Testing Dropdown UI Interactions ---');

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

console.log('✓ Dropdown interactions and state transitions passed!');`;

code = code.replace(target, repl);
fs.writeFileSync('scratch/test_card_promo_09c_r6.js', code, 'utf8');
console.log('Updated Section 2.7');


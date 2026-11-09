/**
 * Test script for TASK: SC-ADMIN-PREVIEW-CONFIRMATION-07
 * Verifies:
 * 1. Peringatan tidak terbawa antarkonteks (Step 1 <-> Step 2, exiting test mode, closing sheet/sidebar).
 * 2. Konfirmasi simulasi sederhana untuk Beli Sekarang dan Masukkan Keranjang (tanpa checkout detail, tanpa closeShopeeCheckoutDrawer).
 * 3. Modal scoped di atas drawer aktif, tombol "Tutup" menyembunyikan modal tanpa mereset drawer.
 */

const fs = require('fs');
const assert = require('assert');

console.log('Testing SC-ADMIN-PREVIEW-CONFIRMATION-07 implementation...');

const code = fs.readFileSync('js/product-form.js', 'utf8');

// 1. Verify existence of showBuySimulationConfirmModal and showCartSimulationConfirmModal
assert.ok(code.includes('function showBuySimulationConfirmModal()'), 'showBuySimulationConfirmModal must be defined');
assert.ok(code.includes('function showCartSimulationConfirmModal()'), 'showCartSimulationConfirmModal must be defined');

// 2. Verify exact titles and messages
assert.ok(code.includes("title: 'Simulasi Pembelian'"), 'Buy modal title must be "Simulasi Pembelian"');
assert.ok(code.includes("message: 'Contoh aksi Beli Sekarang berhasil. Tidak ada pesanan yang dibuat.'"), 'Buy modal message must match specification');
assert.ok(code.includes("title: 'Simulasi Keranjang'"), 'Cart modal title must be "Simulasi Keranjang"');
assert.ok(code.includes("message: 'Contoh aksi Masukkan Keranjang berhasil. Keranjang pembeli tidak berubah.'"), 'Cart modal message must match specification');

// 3. Verify that drawer submit does NOT call closeShopeeCheckoutDrawer()
const drawerSubmitBlockMatch = code.match(/container\.querySelectorAll\('\.btn-shopee-submit'\)\.forEach\(btn => \{[\s\S]*?\}\);\s*\}\);/);
assert.ok(drawerSubmitBlockMatch, 'Must find drawer submit block');
const drawerSubmitCode = drawerSubmitBlockMatch[0];
assert.ok(!drawerSubmitCode.includes('closeShopeeCheckoutDrawer()'), 'Drawer submit button MUST NOT call closeShopeeCheckoutDrawer()');
assert.ok(drawerSubmitCode.includes('showBuySimulationConfirmModal()'), 'Drawer submit must call showBuySimulationConfirmModal for buy');
assert.ok(drawerSubmitCode.includes('showCartSimulationConfirmModal()'), 'Drawer submit must call showCartSimulationConfirmModal for cart');

// 4. Verify context cleanup points:
// 4a. goToStep(1) calls hidePreviewTestModeAlert
const goToStepMatch = code.match(/function goToStep\(step\) \{[\s\S]*?updateStepVisibility\(\);/);
assert.ok(goToStepMatch, 'Must find goToStep function');
assert.ok(goToStepMatch[0].includes('hidePreviewTestModeAlert()'), 'goToStep must call hidePreviewTestModeAlert()');
assert.ok(goToStepMatch[0].includes('if (step === 1)'), 'goToStep must handle step === 1 reset');

// 4b. updateStepVisibility when currentStep === 1 calls hidePreviewTestModeAlert
const updateStepVisMatch = code.match(/if \(currentStep === 1\) \{[\s\S]*?hidePreviewTestModeAlert\(\);/);
assert.ok(updateStepVisMatch, 'updateStepVisibility when currentStep === 1 must call hidePreviewTestModeAlert()');

// 4c. updatePreviewSidebarHeader when currentStep === 1 calls hidePreviewTestModeAlert
const updateHeaderMatch = code.match(/function updatePreviewSidebarHeader\(\) \{[\s\S]*?if \(currentStep === 1\) \{[\s\S]*?hidePreviewTestModeAlert\(\);/);
assert.ok(updateHeaderMatch, 'updatePreviewSidebarHeader when currentStep === 1 must call hidePreviewTestModeAlert()');

// 4d. bindPreviewModeHeaderButtons passive switch calls hidePreviewTestModeAlert
const passiveHeaderMatch = code.match(/btn-preview-mode-passive[\s\S]*?hidePreviewTestModeAlert\(\);/);
assert.ok(passiveHeaderMatch, 'Switching to passive mode header must call hidePreviewTestModeAlert()');

// 4e. closeMobilePreview calls hidePreviewTestModeAlert
const closeMobMatch = code.match(/closeMobilePreview = function \(\) \{[\s\S]*?hidePreviewTestModeAlert\(\);/);
assert.ok(closeMobMatch, 'closeMobilePreview must call hidePreviewTestModeAlert()');

// 4f. setSidebarState(false) calls hidePreviewTestModeAlert
const setSidebarMatch = code.match(/setSidebarState = function \(isOpen\) \{[\s\S]*?hidePreviewTestModeAlert\(\);/);
assert.ok(setSidebarMatch, 'setSidebarState when closed must call hidePreviewTestModeAlert()');

// 5. Verify showPreviewTestModal modal close behavior
const showTestModalMatch = code.match(/function showPreviewTestModal\(config\) \{[\s\S]*?if \(config\.onMounted\) \{/);
assert.ok(showTestModalMatch, 'Must find showPreviewTestModal function');
assert.ok(showTestModalMatch[0].includes('roots.forEach(r => r.classList.add(\'hidden\'))'), 'Modal close button must hide roots without closing drawer');

// 6. Verify bottom bar buy now & add cart
const buyNowMatch = code.match(/container\.querySelectorAll\('\.btn-preview-buy-now'\)\.forEach\(btn => \{[\s\S]*?\}\);/);
assert.ok(buyNowMatch, 'Must find btn-preview-buy-now block');
assert.ok(buyNowMatch[0].includes('showBuySimulationConfirmModal()'), 'btn-preview-buy-now must call showBuySimulationConfirmModal() when valid');

const addCartMatch = code.match(/container\.querySelectorAll\('\.btn-preview-add-cart'\)\.forEach\(btn => \{[\s\S]*?\}\);/);
assert.ok(addCartMatch, 'Must find btn-preview-add-cart block');
assert.ok(addCartMatch[0].includes('showCartSimulationConfirmModal()'), 'btn-preview-add-cart must call showCartSimulationConfirmModal() when valid');

console.log('ALL ASSERTIONS PASSED SUCCESSFULLY!');


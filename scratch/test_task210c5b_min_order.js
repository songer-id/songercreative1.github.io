const { chromium } = require('playwright');
const path = require('path');

let passCount = 0;
let failCount = 0;
const errors = [];

function assert(desc, condition, details = '') {
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${desc} ${details ? '- ' + details : ''}`);
    errors.push(desc + (details ? ' (' + details : ''));
    failCount++;
  }
}

(async () => {
  console.log('=== TEST SUITE TASK 2.10C-5B: VALIDASI MINIMAL PESANAN PADA UJI COBA ===\n');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const fileUrl = 'file:///' + path.resolve(__dirname, '../admin.html').replace(/\\/g, '/');

  async function setupStep2(page, isMobile = false) {
    await page.setViewportSize(isMobile ? { width: 375, height: 667 } : { width: 1280, height: 800 });
    await page.goto(fileUrl, { waitUntil: 'load' });
    await page.waitForTimeout(400);

    await page.evaluate(() => {
      document.getElementById('admin-login-screen')?.classList.add('hidden');
      document.getElementById('admin-app')?.classList.remove('hidden');

      AdminApp.navigate('edit-product', DB.getProducts()[0].id);

      const toggleBadge = document.getElementById('toggle-enable-custom-labels');
      if (toggleBadge) toggleBadge.checked = false;
      const cfgBadge = document.getElementById('cfg-show-badge');
      if (cfgBadge) cfgBadge.checked = false;

      const p = ProductForm.getPrimaryState();
      p.show_badge = false;
      p.custom_labels = [];
      p.has_variants = false;
      p.is_unlimited_max_order = true;
      p.max_order = null;

      ProductForm.goToStep(2);
      ProductForm.setSidebarState(true);

      const minInp = document.getElementById('input-min-order');
      if (minInp) minInp.value = '1';
    });
    await page.waitForTimeout(300);
  }

  try {
    // -------------------------------------------------------------
    // SKENARIO 1: DESKTOP TEST
    // -------------------------------------------------------------
    console.log('--- TEST DESKTOP ---');
    const page = await browser.newPage();
    await setupStep2(page, false);

    // 1.1 Baseline: semua data valid dengan min_order = 1
    const resBase = await page.evaluate(() => ProductForm.canActivateTestMode());
    assert('1.1 canActivateTestMode lolos saat semua data valid & min_order = 1', resBase.allowed === true);

    // 1.2 Minimal Pesanan Kosong
    await page.evaluate(() => {
      const minInp = document.getElementById('input-min-order');
      if (minInp) minInp.value = '';
    });
    const resEmpty = await page.evaluate(() => ProductForm.canActivateTestMode());
    assert('1.2 canActivateTestMode ditolak saat Minimal Pesanan kosong', resEmpty.allowed === false);
    assert('1.2 missingItems mencakup Minimal Pesanan', Array.isArray(resEmpty.missingItems) && resEmpty.missingItems.some(item => item.toLowerCase().includes('minimal')));
    const isTargetMinInp = await page.evaluate(() => {
      const minInp = document.getElementById('input-min-order');
      const check = ProductForm.canActivateTestMode();
      return check.targetEl === minInp;
    });
    assert('1.2 targetEl mengarah ke #input-min-order', isTargetMinInp);

    // 1.3 Klik tombol Uji Coba memunculkan modal popup alert di Desktop
    await page.click('#btn-preview-mode-test');
    await page.waitForTimeout(200);

    const deskModalCheck = await page.evaluate(() => {
      const root = document.getElementById('preview-scoped-modal-root');
      const isVisible = root && !root.classList.contains('hidden');
      const text = root ? root.innerText : '';
      return { isVisible, text };
    });
    assert('1.3 Modal alert muncul di desktop saat Uji Coba diklik dengan min_order kosong', deskModalCheck.isVisible && deskModalCheck.text.includes('Mohon Lengkapi Bagian Berikut Untuk Mengaktifkan Simulasi Diskon'));

    // 1.4 Klik "OK / Mengerti" memicu auto-scroll dan focus ke #input-min-order
    await page.click('#preview-scoped-modal-root .btn-confirm-validation-ok');
    await page.waitForTimeout(400);

    const focusCheckDesk = await page.evaluate(() => {
      const minInp = document.getElementById('input-min-order');
      const isFocused = (document.activeElement === minInp);
      const hasRing = minInp.classList.contains('ring-amber-400') || minInp.classList.contains('ring-2');
      return { isFocused, hasRing };
    });
    assert('1.4 Fokus dan ring sorotan amber aktif pada #input-min-order setelah OK diklik', focusCheckDesk.isFocused || focusCheckDesk.hasRing);

    // 1.5 Nilai 0, negatif, desimal, huruf
    const testCases = [
      { val: '0', desc: 'Nilai 0 tidak valid' },
      { val: '-2', desc: 'Nilai negatif tidak valid' },
      { val: '1.5', desc: 'Nilai desimal tidak valid' },
      { val: 'abc', desc: 'Nilai teks/huruf tidak valid' },
      { val: '5', desc: 'Nilai 5 valid (angka bulat >= 1)', valid: true }
    ];

    for (const tc of testCases) {
      await page.evaluate((val) => {
        const minInp = document.getElementById('input-min-order');
        if (minInp) minInp.value = val;
      }, tc.val);
      const res = await page.evaluate(() => ProductForm.canActivateTestMode());
      if (tc.valid) {
        assert(`1.5 ${tc.desc}`, res.allowed === true);
      } else {
        assert(`1.5 ${tc.desc}`, res.allowed === false && res.missingItems.some(i => i.toLowerCase().includes('minimal')));
      }
    }

    // 1.6 Validasi Stok Lama Tidak Terganggu
    // Pastikan min_order = 1
    await page.evaluate(() => {
      document.getElementById('input-min-order').value = '1';
    });

    // Stok kosong -> ditolak
    await page.evaluate(() => {
      const s = document.getElementById('input-stock-qty');
      if (s) s.value = '';
      const p = ProductForm.getPrimaryState();
      p.is_unlimited_stock = false;
      p.stock = null;
    });
    const resStockEmpty = await page.evaluate(() => ProductForm.canActivateTestMode());
    assert('1.6 Stok kosong tetap ditolak', resStockEmpty.allowed === false && resStockEmpty.missingItems.includes('Stok Produk'));

    // Stok 0 -> valid
    await page.evaluate(() => {
      const s = document.getElementById('input-stock-qty');
      if (s) s.value = '0';
      const p = ProductForm.getPrimaryState();
      p.is_unlimited_stock = false;
      p.stock = 0;
    });
    const resStockZero = await page.evaluate(() => ProductForm.canActivateTestMode());
    assert('1.6 Stok 0 tetap valid', resStockZero.allowed === true);

    // Stok Unlimited -> valid
    await page.evaluate(() => {
      const s = document.getElementById('input-stock-qty');
      if (s) s.value = 'Unlimited';
      const p = ProductForm.getPrimaryState();
      p.is_unlimited_stock = true;
    });
    const resStockUnl = await page.evaluate(() => ProductForm.canActivateTestMode());
    assert('1.6 Stok Unlimited tetap valid', resStockUnl.allowed === true);

    await page.close();

    // -------------------------------------------------------------
    // SKENARIO 2: MOBILE TEST
    // -------------------------------------------------------------
    console.log('\n--- TEST MOBILE ---');
    const mobPage = await browser.newPage();
    await setupStep2(mobPage, true);

    // 2.1 Buka lembar pratinjau mobile
    await mobPage.evaluate(() => {
      if (typeof ProductForm.openMobilePreview === 'function') {
        ProductForm.openMobilePreview();
      } else {
        document.getElementById('btn-open-mobile-preview')?.click();
      }
      // Kosongkan minimal pesanan
      const minInp = document.getElementById('input-min-order');
      if (minInp) minInp.value = '';
    });
    await mobPage.waitForTimeout(350);

    // 2.2 Klik tombol Uji Coba pada header mobile
    await mobPage.click('#btn-preview-mode-test-mob');
    await mobPage.waitForTimeout(200);

    const mobModalCheck = await mobPage.evaluate(() => {
      const root = document.getElementById('preview-scoped-modal-root-mob');
      const isVisible = root && !root.classList.contains('hidden');
      const text = root ? root.innerText : '';
      return { isVisible, text };
    });
    assert('2.2 Modal alert muncul di mobile sheet (#preview-scoped-modal-root-mob)', mobModalCheck.isVisible && mobModalCheck.text.includes('Mohon Lengkapi Bagian Berikut Untuk Mengaktifkan Simulasi Diskon'));

    // 2.3 Klik OK / Mengerti di mobile menutup sheet dan scroll ke #input-min-order
    await mobPage.click('#preview-scoped-modal-root-mob .btn-confirm-validation-ok');
    await mobPage.waitForTimeout(500);

    const mobDismissCheck = await mobPage.evaluate(() => {
      const sheet = document.getElementById('mobile-preview-sheet');
      const isSheetClosed = sheet && sheet.classList.contains('translate-y-full');
      const minInp = document.getElementById('input-min-order');
      const isFocused = (document.activeElement === minInp);
      const hasRing = minInp.classList.contains('ring-amber-400') || minInp.classList.contains('ring-2');
      return { isSheetClosed, isFocused, hasRing };
    });
    assert('2.3 Sheet mobile tertutup otomatis saat dismiss modal', mobDismissCheck.isSheetClosed);
    assert('2.3 Fokus/ring sorotan aktif pada #input-min-order di mobile', mobDismissCheck.isFocused || mobDismissCheck.hasRing);

    await mobPage.close();

  } catch (err) {
    console.error('Fatal error during test:', err);
    failCount++;
  } finally {
    await browser.close();
  }

  console.log(`\n========================================`);
  console.log(`TOTAL: ${passCount + failCount} | PASS: ${passCount} | FAIL: ${failCount}`);
  console.log(`========================================\n`);

  if (failCount > 0) {
    console.error('Ada pengujian yang GAGAL:', errors);
    process.exit(1);
  } else {
    console.log('Semua pengujian Task 2.10C-5B BERHASIL (PASS)!');
    process.exit(0);
  }
})();

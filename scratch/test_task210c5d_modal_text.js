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
  console.log('=== TEST SUITE TASK 2.10C-5D: REVISI TEKS MODAL VALIDASI ===\n');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const fileUrl = 'file:///' + path.resolve(__dirname, '../admin.html').replace(/\\/g, '/');

  async function setupStep2(page, isMobile = false) {
    await page.setViewportSize(isMobile ? { width: 375, height: 667 } : { width: 1280, height: 800 });
    await page.goto(fileUrl, { waitUntil: 'load' });
    await page.waitForTimeout(400);

    await page.evaluate(() => {
      document.getElementById('admin-login-screen')?.classList.add('hidden');
      document.getElementById('admin-app')?.classList.remove('hidden');

      AdminApp.navigate('create-product');

      const p = ProductForm.getPrimaryState();
      p.product_type = 'physical';
      p.card_variant = 'A';
      p.image_url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      p.images = [p.image_url];
      p.name = 'Produk Test Modal Revisi';
      p.show_badge = false;
      p.has_custom_labels = false;
      p.category_id = DB.getCategories()[0].id;
      p.sub_category_determined = true;
      p.sub_category_id = null;
      p.has_variants = false;
      p.price = '';

      ProductForm.goToStep(2);
      ProductForm.setSidebarState(true);
    });
    await page.waitForTimeout(300);
  }

  try {
    const page = await browser.newPage();

    // =========================================================================
    // 1. MODAL UJI COBA (canActivateTestMode & showPreviewTestModeAlert)
    // =========================================================================
    console.log('--- 1. MODAL UJI COBA: TEKS DAN DINAMISME ITEM ---');
    await setupStep2(page, false);

    // 1.1 Invalidate multiple fields: Price empty, Stock empty, Min Order empty, Max Order invalid
    await page.evaluate(() => {
      const p = ProductForm.getPrimaryState();
      p.price = null;
      p.stock = null;
      p.is_unlimited_stock = false;
      p.min_order = null;
      p.max_order = 0;
      p.is_unlimited_max_order = false;
      p.max_order_type = 'per_order';

      const inpPrice = document.getElementById('input-single-price');
      if (inpPrice) inpPrice.value = '';
      const inpStock = document.getElementById('input-stock-qty');
      if (inpStock) inpStock.value = '';
      const inpMin = document.getElementById('input-min-order');
      if (inpMin) inpMin.value = '';
      const inpMax = document.getElementById('input-normal-max-order') || document.getElementById('input-max-order-qty');
      if (inpMax) inpMax.value = '0';
    });

    const testModeCheck1 = await page.evaluate(() => {
      const c = ProductForm.canActivateTestMode();
      return {
        allowed: c.allowed,
        title: c.title,
        missingItems: c.missingItems,
        targetId: c.targetEl?.id
      };
    });
    assert('1.1 canActivateTestMode mengembalikan title baru yang tepat', testModeCheck1.title === 'Mohon Lengkapi Bagian Berikut Untuk Mengaktifkan Simulasi Diskon');
    assert('1.1 canActivateTestMode mendeteksi Harga Jual', testModeCheck1.missingItems.includes('Harga Jual'));
    assert('1.1 canActivateTestMode mendeteksi Stok Produk', testModeCheck1.missingItems.includes('Stok Produk'));
    assert('1.1 canActivateTestMode mendeteksi Minimal Pesanan', testModeCheck1.missingItems.includes('Minimal Pesanan'));
    assert('1.1 canActivateTestMode mendeteksi Maksimal Pembelian', testModeCheck1.missingItems.includes('Maksimal Jumlah Pembelian'));

    // Trigger modal alert
    await page.evaluate(() => ProductForm.showPreviewTestModeAlert(ProductForm.canActivateTestMode()));
    await page.waitForTimeout(200);

    const modalRoot = page.locator('#preview-scoped-modal-root');
    assert('1.1 Modal alert Uji Coba tampil di preview-scoped-modal-root', await modalRoot.isVisible());

    const modalTitleText = await modalRoot.locator('h3').innerText();
    assert('1.1 Judul modal adalah "Mohon Lengkapi Bagian Berikut Untuk Mengaktifkan Simulasi Diskon"', modalTitleText.trim() === 'Mohon Lengkapi Bagian Berikut Untuk Mengaktifkan Simulasi Diskon');

    const fullModalHtml = await modalRoot.innerHTML();
    assert('1.1 Label "Bagian yang belum lengkap:" SUDAH DIHAPUS', !fullModalHtml.includes('Bagian yang belum lengkap:'));

    // Verify <ul> is present directly with items
    const listItems = await modalRoot.locator('ul li').allInnerTexts();
    assert('1.1 List item berisikan tepat 4 item yang belum valid', listItems.length === 4);
    assert('1.1 List item berisi "Harga Jual"', listItems.includes('Harga Jual'));
    assert('1.1 List item berisi "Stok Produk"', listItems.includes('Stok Produk'));
    assert('1.1 List item berisi "Minimal Pesanan"', listItems.includes('Minimal Pesanan'));
    assert('1.1 List item berisi "Maksimal Jumlah Pembelian"', listItems.includes('Maksimal Jumlah Pembelian'));

    // Close modal
    await page.click('#preview-scoped-modal-root .btn-confirm-validation-ok');
    await page.waitForTimeout(200);
    assert('1.1 Modal alert tertutup', !(await modalRoot.isVisible()));

    // 1.2 Dinamisme: Jika Harga Jual dan Min Order sudah valid, hanya Stok dan Max Order yang muncul
    console.log('-> 1.2 Dinamisme Uji Coba: perbaiki Harga Jual dan Minimal Pesanan');
    await page.evaluate(() => {
      const p = ProductForm.getPrimaryState();
      p.price = 75000;
      p.min_order = 1;
      const inpPrice = document.getElementById('input-single-price');
      if (inpPrice) inpPrice.value = '75000';
      const inpMin = document.getElementById('input-min-order');
      if (inpMin) inpMin.value = '1';
    });

    const testModeCheck2 = await page.evaluate(() => {
      const c = ProductForm.canActivateTestMode();
      return {
        allowed: c.allowed,
        title: c.title,
        missingItems: c.missingItems
      };
    });
    assert('1.2 "Harga Jual" TIDAK muncul karena sudah valid', !testModeCheck2.missingItems.includes('Harga Jual'));
    assert('1.2 "Minimal Pesanan" TIDAK muncul karena sudah valid', !testModeCheck2.missingItems.includes('Minimal Pesanan'));
    assert('1.2 "Stok Produk" tetap muncul karena belum valid', testModeCheck2.missingItems.includes('Stok Produk'));
    assert('1.2 "Maksimal Jumlah Pembelian" tetap muncul karena belum valid', testModeCheck2.missingItems.includes('Maksimal Jumlah Pembelian'));

    // 1.3 Dinamisme: Jika Stok dan Max Order diperbaiki juga, maka semua valid (allowed: true)
    console.log('-> 1.3 Dinamisme Uji Coba: seluruh field valid');
    await page.evaluate(() => {
      const p = ProductForm.getPrimaryState();
      p.stock = 50;
      p.is_unlimited_stock = false;
      p.max_order = 10;
      p.is_unlimited_max_order = false;
      const inpStock = document.getElementById('input-stock-qty');
      if (inpStock) inpStock.value = '50';
      const inpMax = document.getElementById('input-normal-max-order') || document.getElementById('input-max-order-qty');
      if (inpMax) inpMax.value = '10';
    });
    const testModeCheck3 = await page.evaluate(() => {
      const c = ProductForm.canActivateTestMode();
      return { allowed: c.allowed };
    });
    assert('1.3 canActivateTestMode lolos saat seluruh item valid', testModeCheck3.allowed === true);

    // =========================================================================
    // 2. MODAL SIMULASI DISKON STEP 2 (canActivateStep2DiscountSimulation)
    // =========================================================================
    console.log('\n--- 2. MODAL SIMULASI DISKON STEP 2: TEKS DAN DINAMISME ITEM ---');

    // 2.1 Skenario: Hanya Promo yang tidak valid (Harga Jual valid)
    console.log('-> 2.1 Skenario: Harga valid, kedua promo nonaktif');
    await page.evaluate(() => {
      const p = ProductForm.getPrimaryState();
      p.price = 100000;
      p.auto_monthly_promo = false;
      p.has_daily_promo = false;
      p.has_monthly_discount = false;

      const inpPrice = document.getElementById('input-single-price');
      if (inpPrice) inpPrice.value = '100000';
      const toggleMonthly = document.getElementById('toggle-promo-monthly');
      if (toggleMonthly) toggleMonthly.checked = false;
      const toggleDaily = document.getElementById('toggle-promo-daily');
      if (toggleDaily) toggleDaily.checked = false;
    });

    const simCheck1 = await page.evaluate(() => {
      const c = ProductForm.canActivateStep2DiscountSimulation();
      return {
        allowed: c.allowed,
        title: c.title,
        missingItems: c.missingItems
      };
    });
    assert('2.1 canActivateStep2DiscountSimulation allowed === false', simCheck1.allowed === false);
    assert('2.1 canActivateStep2DiscountSimulation memiliki judul baru yang tepat', simCheck1.title === 'Mohon Lengkapi Bagian Berikut Untuk Mengaktifkan Simulasi Diskon');
    assert('2.1 "Harga Jual" TIDAK muncul pada daftar', !simCheck1.missingItems.includes('Harga Jual'));
    assert('2.1 "Promo Bulanan atau Promo Harian" muncul pada daftar', simCheck1.missingItems.includes('Promo Bulanan atau Promo Harian'));
    assert('2.1 missingItems hanya memuat 1 item promo', simCheck1.missingItems.length === 1);

    // Click button Simulasi Diskon di desktop
    await page.click('#btn-simulate-discount-preview');
    await page.waitForTimeout(200);

    const simModalTitle1 = await modalRoot.locator('h3').innerText();
    assert('2.1 Judul modal simulasi diskon adalah "Mohon Lengkapi Bagian Berikut Untuk Mengaktifkan Simulasi Diskon"', simModalTitle1.trim() === 'Mohon Lengkapi Bagian Berikut Untuk Mengaktifkan Simulasi Diskon');
    const simModalHtml1 = await modalRoot.innerHTML();
    assert('2.1 Label "Bagian yang belum lengkap:" tidak ada pada modal simulasi diskon', !simModalHtml1.includes('Bagian yang belum lengkap:'));

    const simItems1 = await modalRoot.locator('ul li').allInnerTexts();
    assert('2.1 Daftar hanya berisi Promo Bulanan atau Promo Harian', simItems1.length === 1 && simItems1[0] === 'Promo Bulanan atau Promo Harian');

    await page.click('#preview-scoped-modal-root .btn-confirm-validation-ok');
    await page.waitForTimeout(200);

    // 2.2 Skenario: Hanya Harga Jual yang tidak valid (Promo Bulanan valid)
    console.log('-> 2.2 Skenario: Hanya Harga Jual tidak valid, Promo aktif');
    await page.evaluate(() => {
      const p = ProductForm.getPrimaryState();
      p.price = null;
      p.auto_monthly_promo = true;
      p.monthly_discount_type = 'percent';
      p.monthly_discount_value = 15;
      p.has_daily_promo = false;

      const inpPrice = document.getElementById('input-single-price');
      if (inpPrice) inpPrice.value = '';
      const toggleMonthly = document.getElementById('toggle-promo-monthly');
      if (toggleMonthly) toggleMonthly.checked = true;
      const inpMonthlyVal = document.getElementById('input-monthly-promo-value');
      if (inpMonthlyVal) inpMonthlyVal.value = '15';
    });

    const simCheck2 = await page.evaluate(() => {
      const c = ProductForm.canActivateStep2DiscountSimulation();
      return {
        allowed: c.allowed,
        title: c.title,
        missingItems: c.missingItems
      };
    });
    assert('2.2 "Harga Jual" muncul pada daftar', simCheck2.missingItems.includes('Harga Jual'));
    assert('2.2 "Promo Bulanan atau Promo Harian" TIDAK muncul karena promo sudah valid', !simCheck2.missingItems.includes('Promo Bulanan atau Promo Harian'));
    assert('2.2 missingItems hanya memuat 1 item harga', simCheck2.missingItems.length === 1);

    await page.click('#btn-simulate-discount-preview');
    await page.waitForTimeout(200);

    const simItems2 = await modalRoot.locator('ul li').allInnerTexts();
    assert('2.2 Modal hanya menampilkan "Harga Jual"', simItems2.length === 1 && simItems2[0] === 'Harga Jual');

    await page.click('#preview-scoped-modal-root .btn-confirm-validation-ok');
    await page.waitForTimeout(200);

    // 2.3 Skenario: Kedua syarat tidak valid (Harga Jual & Promo tidak valid)
    console.log('-> 2.3 Skenario: Kedua syarat tidak valid');
    await page.evaluate(() => {
      const p = ProductForm.getPrimaryState();
      p.price = null;
      p.auto_monthly_promo = false;
      p.has_daily_promo = false;

      const inpPrice = document.getElementById('input-single-price');
      if (inpPrice) inpPrice.value = '';
      const toggleMonthly = document.getElementById('toggle-promo-monthly');
      if (toggleMonthly) toggleMonthly.checked = false;
      const toggleDaily = document.getElementById('toggle-promo-daily');
      if (toggleDaily) toggleDaily.checked = false;
    });

    const simCheck3 = await page.evaluate(() => {
      const c = ProductForm.canActivateStep2DiscountSimulation();
      return {
        allowed: c.allowed,
        title: c.title,
        missingItems: c.missingItems
      };
    });
    assert('2.3 missingItems memuat kedua item kesalahan', simCheck3.missingItems.length === 2 && simCheck3.missingItems.includes('Harga Jual') && simCheck3.missingItems.includes('Promo Bulanan atau Promo Harian'));

    await page.click('#btn-simulate-discount-preview');
    await page.waitForTimeout(200);

    const simItems3 = await modalRoot.locator('ul li').allInnerTexts();
    assert('2.3 Modal menampilkan tepat 2 item: Harga Jual & Promo', simItems3.length === 2 && simItems3.includes('Harga Jual') && simItems3.includes('Promo Bulanan atau Promo Harian'));

    await page.click('#preview-scoped-modal-root .btn-confirm-validation-ok');
    await page.waitForTimeout(200);

    // =========================================================================
    // 3. MOBILE PARITY TEST
    // =========================================================================
    console.log('\n--- 3. MOBILE: MODAL ROOT MOBILE PARITY ---');
    await setupStep2(page, true);

    await page.evaluate(() => {
      const p = ProductForm.getPrimaryState();
      p.price = null;
      p.auto_monthly_promo = false;
      p.has_daily_promo = false;

      const inpPrice = document.getElementById('input-single-price');
      if (inpPrice) inpPrice.value = '';
      const toggleMonthly = document.getElementById('toggle-promo-monthly');
      if (toggleMonthly) toggleMonthly.checked = false;
      const toggleDaily = document.getElementById('toggle-promo-daily');
      if (toggleDaily) toggleDaily.checked = false;
    });

    // Buka mobile sheet
    await page.evaluate(() => {
      ProductForm.openMobilePreview();
    });
    await page.waitForTimeout(300);

    // Klik Simulasi Diskon di mobile preview
    await page.click('#btn-simulate-discount-preview-mob');
    await page.waitForTimeout(200);

    const mobModalRoot = page.locator('#preview-scoped-modal-root-mob');
    assert('3.1 Modal mobile tampil di #preview-scoped-modal-root-mob', await mobModalRoot.isVisible());

    const mobTitleText = await mobModalRoot.locator('h3').innerText();
    assert('3.1 Judul modal mobile adalah "Mohon Lengkapi Bagian Berikut Untuk Mengaktifkan Simulasi Diskon"', mobTitleText.trim() === 'Mohon Lengkapi Bagian Berikut Untuk Mengaktifkan Simulasi Diskon');

    const mobHtml = await mobModalRoot.innerHTML();
    assert('3.1 Modal mobile tidak memiliki teks "Bagian yang belum lengkap:"', !mobHtml.includes('Bagian yang belum lengkap:'));

    const mobItems = await mobModalRoot.locator('ul li').allInnerTexts();
    assert('3.1 Modal mobile mencantumkan kedua item kesalahan secara dinamis', mobItems.length === 2 && mobItems.includes('Harga Jual') && mobItems.includes('Promo Bulanan atau Promo Harian'));

    await page.close();
  } catch (err) {
    console.error('Unhandled test exception:', err);
    failCount++;
  } finally {
    await browser.close();
  }

  console.log('\n=============================================================');
  console.log(`TOTAL PASS: ${passCount}`);
  console.log(`TOTAL FAIL: ${failCount}`);
  console.log('=============================================================');

  if (failCount > 0) {
    process.exit(1);
  }
})();

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
    errors.push(desc + (details ? ' (' + details + ')' : ''));
    failCount++;
  }
}

(async () => {
  console.log('=== TEST SUITE TASK 2.10C-5C: VALIDASI SIMULASI DISKON PREVIEW DETAIL PRODUK STEP 2 ===\n');

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
      p.name = 'Produk Validasi Promo Step 1 Step 2';
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
    // =============================================================
    // 1. DESKTOP TEST: SYARAT HARGA & PROMO PADA SIMULASI DISKON STEP 2
    // =============================================================
    console.log('--- 1. DESKTOP: VALIDASI SIMULASI DISKON STEP 2 ---');
    const page = await browser.newPage();
    await setupStep2(page, false);

    // 1.1 Skenario 1: Harga Kosong, Promo Aktif -> Simulasi Step 2 Ditolak
    console.log('-> 1.1 Harga kosong, promo aktif -> ditolak, modal alert Harga Jual');
    await page.evaluate(() => {
      const p = ProductForm.getPrimaryState();
      p.price = '';
      p.auto_monthly_promo = true;
      p.monthly_discount_type = 'percent';
      p.monthly_discount_value = 10;
      p.has_daily_promo = false;

      const singlePriceInp = document.getElementById('input-single-price');
      if (singlePriceInp) singlePriceInp.value = '';
      const toggleMonthly = document.getElementById('toggle-promo-monthly');
      if (toggleMonthly) toggleMonthly.checked = true;
      const valMonthly = document.getElementById('input-monthly-promo-value');
      if (valMonthly) valMonthly.value = '10';
      const toggleDaily = document.getElementById('toggle-promo-daily');
      if (toggleDaily) toggleDaily.checked = false;

      ProductForm.updateProductCardLivePreview();
    });

    const check1 = await page.evaluate(() => ProductForm.canActivateStep2DiscountSimulation());
    assert('1.1 canActivateStep2DiscountSimulation menolak saat harga kosong', check1.allowed === false);
    assert('1.1 missingItems memuat "Harga Jual"', check1.missingItems && check1.missingItems.includes('Harga Jual'));

    // Klik tombol Simulasi Diskon di desktop
    await page.click('#btn-simulate-discount-preview');
    await page.waitForTimeout(200);

    const isSimActive1 = await page.evaluate(() => ProductForm.isSimulateDiscountActive());
    assert('1.1 Simulasi diskon tetap nonaktif di Step 2', isSimActive1 === false);

    const modalRoot1 = page.locator('#preview-scoped-modal-root');
    assert('1.1 Modal alert Uji Coba tampil di desktop', await modalRoot1.isVisible());
    const modalText1 = await modalRoot1.innerText();
    assert('1.1 Modal mencantumkan judul baru dan tidak memiliki label "Bagian yang belum lengkap:"', modalText1.includes('Mohon Lengkapi Bagian Berikut Untuk Mengaktifkan Simulasi Diskon') && modalText1.includes('Harga Jual') && !modalText1.includes('Bagian yang belum lengkap'));

    // Klik OK / Mengerti pada modal alert
    await page.click('#preview-scoped-modal-root .btn-confirm-validation-ok');
    await page.waitForTimeout(300);
    assert('1.1 Modal alert tertutup setelah klik OK', !(await modalRoot1.isVisible()));

    // Target input #input-single-price mendapat class highlight ring-amber-400
    const hasAmberRing1 = await page.evaluate(() => {
      const inp = document.getElementById('input-single-price');
      return inp && (inp.classList.contains('ring-amber-400') || inp.closest('.step2-section-card')?.classList.contains('ring-amber-400') || inp.closest('.form-group')?.classList.contains('ring-amber-400'));
    });
    assert('1.1 Target harga mendapat highlight ring amber', hasAmberRing1 === true);

    // 1.2 Skenario 2: Harga Valid Tetapi Kedua Promo Tidak Aktif -> Ditolak
    console.log('-> 1.2 Harga valid, kedua promo nonaktif -> ditolak, modal alert Promo Bulanan atau Promo Harian');
    await page.evaluate(() => {
      const p = ProductForm.getPrimaryState();
      p.price = 50000;
      p.auto_monthly_promo = false;
      p.has_daily_promo = false;
      p.has_monthly_discount = false;

      const singlePriceInp = document.getElementById('input-single-price');
      if (singlePriceInp) singlePriceInp.value = '50000';
      const toggleMonthly = document.getElementById('toggle-promo-monthly');
      if (toggleMonthly) toggleMonthly.checked = false;
      const toggleDaily = document.getElementById('toggle-promo-daily');
      if (toggleDaily) toggleDaily.checked = false;

      ProductForm.updateProductCardLivePreview();
    });

    const check2 = await page.evaluate(() => ProductForm.canActivateStep2DiscountSimulation());
    assert('1.2 canActivateStep2DiscountSimulation menolak saat kedua promo nonaktif', check2.allowed === false);
    assert('1.2 missingItems memuat "Promo Bulanan atau Promo Harian"', check2.missingItems && check2.missingItems.includes('Promo Bulanan atau Promo Harian'));

    await page.click('#btn-simulate-discount-preview');
    await page.waitForTimeout(200);

    const isSimActive2 = await page.evaluate(() => ProductForm.isSimulateDiscountActive());
    assert('1.2 Simulasi diskon tetap nonaktif di Step 2', isSimActive2 === false);
    assert('1.2 Modal alert tampil', await modalRoot1.isVisible());
    const modalText2 = await modalRoot1.innerText();
    assert('1.2 Modal mencantumkan "Promo Bulanan atau Promo Harian"', modalText2.includes('Promo Bulanan atau Promo Harian'));

    await page.click('#preview-scoped-modal-root .btn-confirm-validation-ok');
    await page.waitForTimeout(300);
    assert('1.2 Modal tertutup setelah OK', !(await modalRoot1.isVisible()));

    // 1.3 Skenario: Kedua Syarat (Harga & Promo) Sama-Sama Tidak Valid
    console.log('-> 1.3 Harga kosong DAN promo nonaktif -> ditolak, modal memuat 2 item, fokus ke Harga (DOM teratas)');
    await page.evaluate(() => {
      const p = ProductForm.getPrimaryState();
      p.price = '';
      p.auto_monthly_promo = false;
      p.has_daily_promo = false;

      const singlePriceInp = document.getElementById('input-single-price');
      if (singlePriceInp) singlePriceInp.value = '';
      const toggleMonthly = document.getElementById('toggle-promo-monthly');
      if (toggleMonthly) toggleMonthly.checked = false;
      const toggleDaily = document.getElementById('toggle-promo-daily');
      if (toggleDaily) toggleDaily.checked = false;

      ProductForm.updateProductCardLivePreview();
    });

    const check3 = await page.evaluate(() => {
      const c = ProductForm.canActivateStep2DiscountSimulation();
      return {
        allowed: c.allowed,
        missingItems: c.missingItems,
        targetId: c.targetEl?.id
      };
    });
    assert('1.3 canActivateStep2DiscountSimulation menolak', check3.allowed === false);
    assert('1.3 missingItems memiliki tepat 2 item', check3.missingItems && check3.missingItems.length === 2);
    assert('1.3 missingItems mencantumkan Harga Jual & Promo', check3.missingItems.includes('Harga Jual') && check3.missingItems.includes('Promo Bulanan atau Promo Harian'));
    assert('1.3 targetEl adalah input harga (posisi DOM teratas)', check3.targetId === 'input-single-price');

    await page.click('#btn-simulate-discount-preview');
    await page.waitForTimeout(200);
    assert('1.3 Modal alert menampilkan kedua item kesalahan', (await modalRoot1.innerText()).includes('Harga Jual') && (await modalRoot1.innerText()).includes('Promo Bulanan atau Promo Harian'));
    await page.click('#preview-scoped-modal-root .btn-confirm-validation-ok');
    await page.waitForTimeout(300);

    // 1.4 Skenario 3: Harga Valid dan Hanya Promo Bulanan Valid -> Berhasil
    console.log('-> 1.4 Harga valid & hanya Promo Bulanan valid -> Berhasil aktifkan simulasi');
    await page.evaluate(() => {
      const p = ProductForm.getPrimaryState();
      p.price = 100000;
      p.auto_monthly_promo = true;
      p.monthly_discount_type = 'percent';
      p.monthly_discount_value = 25;
      p.has_daily_promo = false;

      const singlePriceInp = document.getElementById('input-single-price');
      if (singlePriceInp) singlePriceInp.value = '100000';
      const toggleMonthly = document.getElementById('toggle-promo-monthly');
      if (toggleMonthly) toggleMonthly.checked = true;
      const valMonthly = document.getElementById('input-monthly-promo-value');
      if (valMonthly) valMonthly.value = '25';
      const toggleDaily = document.getElementById('toggle-promo-daily');
      if (toggleDaily) toggleDaily.checked = false;

      ProductForm.updateProductCardLivePreview();
    });

    const check4 = await page.evaluate(() => ProductForm.canActivateStep2DiscountSimulation());
    assert('1.4 canActivateStep2DiscountSimulation lolos', check4.allowed === true);

    await page.click('#btn-simulate-discount-preview');
    await page.waitForTimeout(200);

    const isSimActive4 = await page.evaluate(() => ProductForm.isSimulateDiscountActive());
    assert('1.4 Simulasi diskon Step 2 aktif', isSimActive4 === true);
    assert('1.4 Tidak ada modal alert muncul', !(await modalRoot1.isVisible()));

    const btnAriaPressed4 = await page.getAttribute('#btn-simulate-discount-preview', 'aria-pressed');
    assert('1.4 Tombol aria-pressed bernilai "true"', btnAriaPressed4 === 'true');

    // 1.5 Deaktivasi Simulasi Diskon di Step 2
    console.log('-> 1.5 Deaktivasi simulasi diskon Step 2');
    await page.click('#btn-simulate-discount-preview');
    await page.waitForTimeout(200);

    const isSimActive5 = await page.evaluate(() => ProductForm.isSimulateDiscountActive());
    assert('1.5 Simulasi diskon dinonaktifkan kembali', isSimActive5 === false);
    const btnAriaPressed5 = await page.getAttribute('#btn-simulate-discount-preview', 'aria-pressed');
    assert('1.5 Tombol aria-pressed bernilai "false"', btnAriaPressed5 === 'false');

    // 1.6 Skenario 4: Harga Valid dan Hanya Promo Harian Valid -> Berhasil
    console.log('-> 1.6 Harga valid & hanya Promo Harian valid -> Berhasil aktifkan simulasi');
    await page.evaluate(() => {
      const p = ProductForm.getPrimaryState();
      p.price = 80000;
      p.auto_monthly_promo = false;
      p.has_daily_promo = true;
      p.monthly_promo_label = 'Promo Flash Sale';
      p.discount_type = 'percent';
      p.discount_value = 15;

      const singlePriceInp = document.getElementById('input-single-price');
      if (singlePriceInp) singlePriceInp.value = '80000';
      const toggleMonthly = document.getElementById('toggle-promo-monthly');
      if (toggleMonthly) toggleMonthly.checked = false;
      const toggleDaily = document.getElementById('toggle-promo-daily');
      if (toggleDaily) toggleDaily.checked = true;
      const promoLabelInp = document.getElementById('input-promo-label');
      if (promoLabelInp) promoLabelInp.value = 'Promo Flash Sale';
      const promoValInp = document.getElementById('input-promo-discount-value');
      if (promoValInp) promoValInp.value = '15';

      ProductForm.updateProductCardLivePreview();
    });

    const check6 = await page.evaluate(() => ProductForm.canActivateStep2DiscountSimulation());
    assert('1.6 canActivateStep2DiscountSimulation lolos dengan Promo Harian', check6.allowed === true);

    await page.click('#btn-simulate-discount-preview');
    await page.waitForTimeout(200);

    const isSimActive6 = await page.evaluate(() => ProductForm.isSimulateDiscountActive());
    assert('1.6 Simulasi diskon Step 2 aktif dengan Promo Harian', isSimActive6 === true);

    // 1.7 Skenario 5: Kedua Promo Aktif -> Hanya Satu Digunakan (Tidak Gabung Diskon)
    console.log('-> 1.7 Kedua promo aktif -> Berhasil, Promo Harian diprioritaskan tanpa penggabungan');
    await page.evaluate(() => {
      const p = ProductForm.getPrimaryState();
      p.price = 100000;
      p.auto_monthly_promo = true;
      p.monthly_discount_type = 'percent';
      p.monthly_discount_value = 10; // 10%
      p.has_daily_promo = true;
      p.monthly_promo_label = 'Promo Kilat';
      p.discount_type = 'percent';
      p.discount_value = 30; // 30%

      const toggleMonthly = document.getElementById('toggle-promo-monthly');
      if (toggleMonthly) toggleMonthly.checked = true;
      const valMonthly = document.getElementById('input-monthly-promo-value');
      if (valMonthly) valMonthly.value = '10';

      const toggleDaily = document.getElementById('toggle-promo-daily');
      if (toggleDaily) toggleDaily.checked = true;
      const promoLabelInp = document.getElementById('input-promo-label');
      if (promoLabelInp) promoLabelInp.value = 'Promo Kilat';
      const promoValInp = document.getElementById('input-promo-discount-value');
      if (promoValInp) promoValInp.value = '30';

      ProductForm.updateProductCardLivePreview();
    });

    const promoInfo7 = await page.evaluate(() => ProductForm.getActivePromoValidationInfo());
    assert('1.7 Promo Harian diprioritaskan saat keduanya aktif', promoInfo7.activeType === 'daily');
    assert('1.7 Nilai diskon tetap 30% (bukan gabungan 40%)', promoInfo7.discountValue === 30);
    const discCalc7 = await page.evaluate(() => ProductForm.getActivePromoValidationInfo().calculateDiscount(100000));
    assert('1.7 Harga terdiskon adalah Rp70.000 (diskon 30% murni)', discCalc7.discountedPrice === 70000);

    await page.close();

    // =============================================================
    // 2. MOBILE TEST: VALIDASI & AUTO-SCROLL PADA MOBILE SHEET
    // =============================================================
    console.log('\n--- 2. MOBILE: VALIDASI, POPUP & DISMISS AUTO-SCROLL ---');
    const pageMob = await browser.newPage();
    await setupStep2(pageMob, true);

    // Buka Mobile Preview Sheet
    await pageMob.evaluate(() => {
      ProductForm.openMobilePreview();
      const p = ProductForm.getPrimaryState();
      p.price = ''; // Harga kosong
      p.auto_monthly_promo = true;
      p.monthly_discount_type = 'percent';
      p.monthly_discount_value = 10;
      const singlePriceInp = document.getElementById('input-single-price');
      if (singlePriceInp) singlePriceInp.value = '';
    });
    await pageMob.waitForTimeout(300);

    const sheetMob = pageMob.locator('#mobile-preview-sheet');
    assert('2.1 Mobile preview sheet terbuka', !(await sheetMob.evaluate(el => el.classList.contains('translate-y-full'))));

    // Klik Simulasi Diskon di Mobile
    await pageMob.click('#btn-simulate-discount-preview-mob');
    await pageMob.waitForTimeout(200);

    const modalRootMob = pageMob.locator('#preview-scoped-modal-root-mob');
    assert('2.2 Modal alert tampil di mobile (#preview-scoped-modal-root-mob)', await modalRootMob.isVisible());
    assert('2.2 Modal mobile memuat "Harga Jual"', (await modalRootMob.innerText()).includes('Harga Jual'));

    // Klik OK / Mengerti pada modal mobile
    await pageMob.click('#preview-scoped-modal-root-mob .btn-confirm-validation-ok');
    await pageMob.waitForTimeout(500);

    // Verifikasi mobile sheet otomatis tertutup agar form terlihat
    const isSheetClosed = await sheetMob.evaluate(el => el.classList.contains('translate-y-full'));
    assert('2.3 Mobile preview sheet otomatis tertutup setelah klik OK', isSheetClosed === true);

    await pageMob.close();

    // =============================================================
    // 3. STEP 1 INDEPENDENCE & DATA SYNC ON NAVIGATION
    // =============================================================
    console.log('\n--- 3. PERLINDUNGAN STEP 1 & SINKRONISASI NAVIGASI ---');
    const pageSync = await browser.newPage();
    await setupStep2(pageSync, false);

    // 3.1 Pindah kembali ke Step 1
    await pageSync.evaluate(() => {
      ProductForm.goToStep(1);
    });
    await pageSync.waitForTimeout(200);

    assert('3.1 Kembali ke Step 1', (await pageSync.evaluate(() => ProductForm.getCurrentStep())) === 1);

    // Di Step 1, harga aktual kosong / belum diatur
    await pageSync.evaluate(() => {
      ProductForm.getPrimaryState().price = '';
      ProductForm.getPrimaryState().auto_monthly_promo = false;
      ProductForm.getPrimaryState().has_daily_promo = false;
    });

    // Toggle Simulasi Diskon di Step 1
    await pageSync.click('#btn-simulate-discount-preview');
    await pageSync.waitForTimeout(200);

    const modalRootDesk = pageSync.locator('#preview-scoped-modal-root');
    assert('3.1 Step 1 TIDAK memunculkan modal alert validasi', !(await modalRootDesk.isVisible()));
    const isSimStep1Active = await pageSync.evaluate(() => ProductForm.isSimulateDiscountActive());
    assert('3.1 Simulasi Diskon Step 1 berhasil aktif demonstratif', isSimStep1Active === true);

    // Periksa bahwa fallback demonstrasi Step 1 tetap berfungsi (harga demo terdiskon)
    const cardPreviewScope = pageSync.locator('#card-live-preview-box');
    const cardText = await cardPreviewScope.innerText();
    assert('3.1 Kartu Step 1 menampilkan diskon simulasi demonstrasi', cardText.includes('Diskon') || cardText.includes('75.000') || cardText.includes('50%'));

    // 3.2 Beralih ke Step 2, edit data produk, lalu kembali ke Step 1
    console.log('-> 3.2 Edit data di Step 2 lalu kembali ke Step 1: preview tersinkronisasi, state simulasi Step 1 tetap independen');
    await pageSync.evaluate(() => {
      ProductForm.goToStep(2);
    });
    await pageSync.waitForTimeout(200);

    // Step 2: simulasi diskon dimulai nonaktif
    assert('3.2 Di Step 2 simulasi diskon independen (belum aktif)', (await pageSync.evaluate(() => ProductForm.isSimulateDiscountActive())) === false);

    // Update nama dan harga di Step 2
    await pageSync.evaluate(() => {
      const s2Name = document.getElementById('step2-input-name') || document.getElementById('input-prod-name');
      if (s2Name) {
        s2Name.value = 'Kaos Polos Premium Cotton Combed';
        s2Name.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const s2Price = document.getElementById('input-single-price');
      if (s2Price) {
        s2Price.value = '85000';
        s2Price.dispatchEvent(new Event('input', { bubbles: true }));
      }
      ProductForm.getPrimaryState().name = 'Kaos Polos Premium Cotton Combed';
      ProductForm.getPrimaryState().price = 85000;
    });

    // Kembali ke Step 1 via goToStep(1)
    await pageSync.evaluate(() => {
      ProductForm.goToStep(1);
    });
    await pageSync.waitForTimeout(300);

    assert('3.2 Berada di Step 1 kembali', (await pageSync.evaluate(() => ProductForm.getCurrentStep())) === 1);

    // Simulasi Step 1 tetap aktif sesuai state demonstrasi sebelumnya
    const isSimStep1Preserved = await pageSync.evaluate(() => ProductForm.isSimulateDiscountActive());
    assert('3.2 State simulasi demonstrasi Step 1 tetap independen dan terjaga', isSimStep1Preserved === true);

    // Kartu preview Step 1 menampilkan nama produk dan harga terbaru dari Step 2
    const updatedCardText = await cardPreviewScope.innerText();
    assert('3.2 Pratinjau Step 1 menampilkan nama terbaru dari Step 2', updatedCardText.includes('Kaos Polos Premium'));
    assert('3.2 Pratinjau Step 1 menampilkan harga terbaru dari Step 2', updatedCardText.includes('85.000') || updatedCardText.includes('42.500'));

    await pageSync.close();

  } catch (err) {
    console.error('Unhandled error during test run:', err);
    errors.push(err.message);
    failCount++;
  } finally {
    await browser.close();
  }

  console.log('\n=============================================================');
  console.log(`TOTAL PASS: ${passCount}`);
  console.log(`TOTAL FAIL: ${failCount}`);
  if (errors.length > 0) {
    console.log('FAILURES:');
    errors.forEach(e => console.log(' - ' + e));
  }
  console.log('=============================================================');

  process.exit(failCount === 0 ? 0 : 1);
})();

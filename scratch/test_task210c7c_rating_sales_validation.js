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
  console.log('=== TEST SUITE TASK 2.10C-7C: VALIDASI RATING & TEKS TERJUAL STEP 1 ===\n');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const fileUrl = 'file:///' + path.resolve(__dirname, '../admin.html').replace(/\\/g, '/');

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(fileUrl, { waitUntil: 'load' });
    await page.waitForTimeout(400);

    // Navigasi ke Form Tambah Produk
    await page.evaluate(() => {
      document.getElementById('admin-login-screen')?.classList.add('hidden');
      document.getElementById('admin-app')?.classList.remove('hidden');
      AdminApp.navigate('create-product');
    });
    await page.waitForTimeout(400);

    // Siapkan produk dasar valid di Step 1
    await page.evaluate(() => {
      const radType = document.querySelector('input[name="product_type_radio"][value="physical"]');
      if (radType) { radType.checked = true; radType.dispatchEvent(new Event('change')); }
      const radCard = document.querySelector('input[name="card_variant_radio"][value="A"]');
      if (radCard) { radCard.checked = true; radCard.dispatchEvent(new Event('change')); }

      const state = ProductForm.getPrimaryState();
      state.name = 'Kemeja Katun Pria Lengan Panjang';
      state.images = [{ id: 'img-1', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', is_primary: true }];
      state.image_url = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff';
      const nameInp = document.getElementById('input-prod-name');
      if (nameInp) nameInp.value = state.name;
      state.custom_labels = ['Terbaru'];
      const lblInp = document.getElementById('input-custom-label-1');
      if (lblInp) {
        lblInp.value = 'Terbaru';
        lblInp.dispatchEvent(new Event('input'));
      }
    });
    await page.waitForTimeout(300);

    // =========================================================================
    // 1. VERIFIKASI PENGHILANGAN IKON PADA TOMBOL SUMBER DATA
    // =========================================================================
    console.log('--- 1. PENGHILANGAN IKON PADA TOMBOL SUMBER DATA ---');
    const buttonIconCheck = await page.evaluate(() => {
      const ratingAuto = document.querySelector('#rating-source-selector-group button[data-source="auto"]');
      const ratingManual = document.querySelector('#rating-source-selector-group button[data-source="manual"]');
      const salesAuto = document.querySelector('#sales-source-selector-group button[data-source="auto"]');
      const salesManual = document.querySelector('#sales-source-selector-group button[data-source="manual"]');

      const countIcons = (el) => el ? el.querySelectorAll('i, svg').length : -1;
      const getText = (el) => el ? el.textContent.trim() : '';

      return {
        ratingAutoText: getText(ratingAuto),
        ratingAutoIcons: countIcons(ratingAuto),
        ratingManualText: getText(ratingManual),
        ratingManualIcons: countIcons(ratingManual),

        salesAutoText: getText(salesAuto),
        salesAutoIcons: countIcons(salesAuto),
        salesManualText: getText(salesManual),
        salesManualIcons: countIcons(salesManual)
      };
    });

    assert('1.1 Rating tombol Otomatis hanya teks "Otomatis" tanpa ikon', buttonIconCheck.ratingAutoText === 'Otomatis' && buttonIconCheck.ratingAutoIcons === 0);
    assert('1.2 Rating tombol Manual hanya teks "Manual" tanpa ikon', buttonIconCheck.ratingManualText === 'Manual' && buttonIconCheck.ratingManualIcons === 0);
    assert('1.3 Terjual tombol Otomatis hanya teks "Otomatis" tanpa ikon', buttonIconCheck.salesAutoText === 'Otomatis' && buttonIconCheck.salesAutoIcons === 0);
    assert('1.4 Terjual tombol Manual hanya teks "Manual" tanpa ikon', buttonIconCheck.salesManualText === 'Manual' && buttonIconCheck.salesManualIcons === 0);

    // =========================================================================
    // 2. PRODUK BARU: DEFAULT NULL DAN VALIDASI FITUR ON TANPA SUMBER
    // =========================================================================
    console.log('\n--- 2. VALIDASI FITUR ON TANPA SUMBER DATA ---');
    
    // Pastikan toggle Rating ON dan Terjual ON, tetapi sumber belum dipilih (null)
    await page.evaluate(() => {
      const chkRating = document.getElementById('cfg-show-rating');
      if (chkRating) { chkRating.checked = true; chkRating.dispatchEvent(new Event('change')); }
      const chkSales = document.getElementById('cfg-show-sales');
      if (chkSales) { chkSales.checked = true; chkSales.dispatchEvent(new Event('change')); }

      const metrics = ProductForm.getPreviewMetricsConfig();
      metrics.rating.source = null;
      metrics.rating.manual_value = null;
      metrics.sales.source = null;
      metrics.sales.manual_value = null;

      // Bersihkan class aktif pada tombol
      document.querySelectorAll('.btn-rating-src, .btn-sales-src').forEach(btn => {
        btn.classList.remove('border-emerald-500', 'bg-emerald-50', 'text-emerald-700', 'ring-1', 'ring-emerald-500');
        btn.classList.add('border-slate-200', 'bg-white', 'text-slate-700');
      });
    });
    await page.waitForTimeout(200);

    // Klik Lanjutkan
    await page.evaluate(() => document.getElementById('btn-step-1-next')?.click());
    await page.waitForTimeout(300);

    const checkNoSource = await page.evaluate(() => {
      const curStep = ProductForm.getCurrentStep();
      const banner = document.getElementById('form-error-banner');
      const bannerText = banner ? banner.innerText : '';
      const ratingGroup = document.getElementById('rating-source-selector-group');
      const salesGroup = document.getElementById('sales-source-selector-group');
      const allRings = Array.from(document.querySelectorAll('.ring-amber-400'));

      return {
        curStep,
        hasRatingMsg: bannerText.includes('Pilih Sumber Data Rating terlebih dahulu'),
        hasSalesMsg: bannerText.includes('Pilih Sumber Data Terjual terlebih dahulu'),
        ratingGroupHasRing: ratingGroup ? ratingGroup.classList.contains('ring-amber-400') : false,
        totalRings: allRings.length,
        ringId: allRings[0] ? allRings[0].id : null
      };
    });

    assert('2.1 Formulir tetap di Step 1 saat Rating/Terjual ON tanpa sumber data', checkNoSource.curStep === 1);
    assert('2.2 Pesan error validasi Rating muncul di banner', checkNoSource.hasRatingMsg);
    assert('2.3 Pesan error validasi Terjual muncul di banner', checkNoSource.hasSalesMsg);
    assert('2.4 Auto-scroll dan ring amber diarahkan ke kontrol Rating (urutan DOM teratas)', checkNoSource.ratingGroupHasRing && checkNoSource.ringId === 'rating-source-selector-group');

    // =========================================================================
    // 3. FITUR OFF: TIDAK WAJIB MEMILIH SUMBER DATA
    // =========================================================================
    console.log('\n--- 3. FITUR OFF: TIDAK WAJIB SUMBER DATA ---');

    await page.evaluate(() => {
      const chkRating = document.getElementById('cfg-show-rating');
      if (chkRating) { chkRating.checked = false; chkRating.dispatchEvent(new Event('change')); }
      const chkSales = document.getElementById('cfg-show-sales');
      if (chkSales) { chkSales.checked = false; chkSales.dispatchEvent(new Event('change')); }

      const metrics = ProductForm.getPreviewMetricsConfig();
      metrics.rating.source = null;
      metrics.sales.source = null;
    });
    await page.waitForTimeout(200);

    await page.evaluate(() => document.getElementById('btn-step-1-next')?.click());
    await page.waitForTimeout(400);

    const checkAllOff = await page.evaluate(() => {
      const curStep = ProductForm.getCurrentStep();
      return { curStep };
    });

    assert('3.1 Saat Rating OFF dan Terjual OFF, formulir berhasil lanjut ke Step 2 tanpa error', checkAllOff.curStep === 2);

    // Kembali ke Step 1 untuk pengujian berikutnya
    await page.evaluate(() => {
      goToStep(1);
    });
    await page.waitForTimeout(300);

    // =========================================================================
    // 4. SUMBER OTOMATIS: VALID TANPA INPUT MANUAL
    // =========================================================================
    console.log('\n--- 4. SUMBER OTOMATIS VALID ---');

    await page.evaluate(() => {
      const chkRating = document.getElementById('cfg-show-rating');
      if (chkRating) { chkRating.checked = true; chkRating.dispatchEvent(new Event('change')); }
      const chkSales = document.getElementById('cfg-show-sales');
      if (chkSales) { chkSales.checked = true; chkSales.dispatchEvent(new Event('change')); }

      ProductForm.setRatingSource('auto');
      ProductForm.setSalesSource('auto');
    });
    await page.waitForTimeout(200);

    await page.evaluate(() => document.getElementById('btn-step-1-next')?.click());
    await page.waitForTimeout(400);

    const checkAuto = await page.evaluate(() => {
      const curStep = ProductForm.getCurrentStep();
      return { curStep };
    });

    assert('4.1 Rating Otomatis & Terjual Otomatis berhasil lanjut ke Step 2', checkAuto.curStep === 2);

    // Kembali ke Step 1
    await page.evaluate(() => {
      goToStep(1);
    });
    await page.waitForTimeout(300);

    // =========================================================================
    // 5. VALIDASI SUMBER MANUAL: RATING (0–5)
    // =========================================================================
    console.log('\n--- 5. VALIDASI SUMBER MANUAL: RATING (0–5) ---');

    // 5.A Nilai kosong
    await page.evaluate(() => {
      ProductForm.setRatingSource('manual');
      const inp = document.getElementById('cfg-rating-manual-val');
      if (inp) { inp.value = ''; inp.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await page.evaluate(() => document.getElementById('btn-step-1-next')?.click());
    await page.waitForTimeout(300);

    const checkRatingEmpty = await page.evaluate(() => {
      const curStep = ProductForm.getCurrentStep();
      const banner = document.getElementById('form-error-banner');
      const bannerText = banner ? banner.innerText : '';
      const inp = document.getElementById('cfg-rating-manual-val');
      return {
        curStep,
        hasMsg: bannerText.includes('Nilai Rating manual wajib diisi antara 0 sampai 5'),
        hasRing: inp ? inp.classList.contains('ring-amber-400') : false
      };
    });
    assert('5.A.1 Rating manual kosong ditolak dengan pesan error', checkRatingEmpty.curStep === 1 && checkRatingEmpty.hasMsg);
    assert('5.A.2 Input rating manual menerima highlight ring amber', checkRatingEmpty.hasRing);

    // 5.B Nilai di luar rentang (> 5)
    await page.evaluate(() => {
      const inp = document.getElementById('cfg-rating-manual-val');
      if (inp) { inp.value = '5.5'; inp.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await page.evaluate(() => document.getElementById('btn-step-1-next')?.click());
    await page.waitForTimeout(300);

    const checkRatingOver = await page.evaluate(() => {
      const curStep = ProductForm.getCurrentStep();
      const banner = document.getElementById('form-error-banner');
      return {
        curStep,
        hasMsg: banner ? banner.innerText.includes('Nilai Rating manual wajib diisi antara 0 sampai 5') : false
      };
    });
    assert('5.B.1 Nilai rating > 5 (5.5) ditolak', checkRatingOver.curStep === 1 && checkRatingOver.hasMsg);

    // 5.C Nilai di luar rentang (< 0)
    await page.evaluate(() => {
      const inp = document.getElementById('cfg-rating-manual-val');
      if (inp) { inp.value = '-1'; inp.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await page.evaluate(() => document.getElementById('btn-step-1-next')?.click());
    await page.waitForTimeout(300);

    const checkRatingNeg = await page.evaluate(() => {
      const curStep = ProductForm.getCurrentStep();
      const banner = document.getElementById('form-error-banner');
      return {
        curStep,
        hasMsg: banner ? banner.innerText.includes('Nilai Rating manual wajib diisi antara 0 sampai 5') : false
      };
    });
    assert('5.C.1 Nilai rating negatif (-1) ditolak', checkRatingNeg.curStep === 1 && checkRatingNeg.hasMsg);

    // 5.D Nilai valid (misal 4.8 atau 0 atau 5)
    await page.evaluate(() => {
      const inp = document.getElementById('cfg-rating-manual-val');
      if (inp) { inp.value = '4.8'; inp.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await page.evaluate(() => document.getElementById('btn-step-1-next')?.click());
    await page.waitForTimeout(400);

    const checkRatingValid = await page.evaluate(() => {
      return { curStep: ProductForm.getCurrentStep() };
    });
    assert('5.D.1 Nilai rating valid (4.8) berhasil lolos validasi ke Step 2', checkRatingValid.curStep === 2);

    // Kembali ke Step 1
    await page.evaluate(() => {
      goToStep(1);
    });
    await page.waitForTimeout(300);

    // =========================================================================
    // 6. VALIDASI SUMBER MANUAL: TEKS TERJUAL (Angka bulat ≥ 0)
    // =========================================================================
    console.log('\n--- 6. VALIDASI SUMBER MANUAL: TEKS TERJUAL (≥ 0) ---');

    // 6.A Terjual kosong
    await page.evaluate(() => {
      ProductForm.setSalesSource('manual');
      const inp = document.getElementById('cfg-sales-manual-val');
      if (inp) { inp.value = ''; inp.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await page.evaluate(() => document.getElementById('btn-step-1-next')?.click());
    await page.waitForTimeout(300);

    const checkSalesEmpty = await page.evaluate(() => {
      const curStep = ProductForm.getCurrentStep();
      const banner = document.getElementById('form-error-banner');
      const bannerText = banner ? banner.innerText : '';
      const inp = document.getElementById('cfg-sales-manual-val');
      return {
        curStep,
        hasMsg: bannerText.includes('Jumlah Terjual manual wajib diisi angka bulat minimal 0'),
        hasRing: inp ? inp.classList.contains('ring-amber-400') : false
      };
    });
    assert('6.A.1 Terjual manual kosong ditolak dengan pesan error', checkSalesEmpty.curStep === 1 && checkSalesEmpty.hasMsg);
    assert('6.A.2 Input terjual manual menerima highlight ring amber', checkSalesEmpty.hasRing);

    // 6.B Terjual desimal (misal 10.5 atau 10,5)
    await page.evaluate(() => {
      const inp = document.getElementById('cfg-sales-manual-val');
      if (inp) { inp.value = '10.5'; inp.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await page.evaluate(() => document.getElementById('btn-step-1-next')?.click());
    await page.waitForTimeout(300);

    const checkSalesDec = await page.evaluate(() => {
      const curStep = ProductForm.getCurrentStep();
      const banner = document.getElementById('form-error-banner');
      return {
        curStep,
        hasMsg: banner ? banner.innerText.includes('Jumlah Terjual manual wajib diisi angka bulat minimal 0') : false
      };
    });
    assert('6.B.1 Jumlah terjual pecahan/desimal (10.5) ditolak', checkSalesDec.curStep === 1 && checkSalesDec.hasMsg);

    // 6.C Terjual negatif (misal -5)
    await page.evaluate(() => {
      const inp = document.getElementById('cfg-sales-manual-val');
      if (inp) { inp.value = '-5'; inp.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await page.evaluate(() => document.getElementById('btn-step-1-next')?.click());
    await page.waitForTimeout(300);

    const checkSalesNeg = await page.evaluate(() => {
      const curStep = ProductForm.getCurrentStep();
      const banner = document.getElementById('form-error-banner');
      return {
        curStep,
        hasMsg: banner ? banner.innerText.includes('Jumlah Terjual manual wajib diisi angka bulat minimal 0') : false
      };
    });
    assert('6.C.1 Jumlah terjual negatif (-5) ditolak', checkSalesNeg.curStep === 1 && checkSalesNeg.hasMsg);

    // 6.D Terjual valid: 0
    await page.evaluate(() => {
      const inp = document.getElementById('cfg-sales-manual-val');
      if (inp) { inp.value = '0'; inp.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await page.evaluate(() => document.getElementById('btn-step-1-next')?.click());
    await page.waitForTimeout(400);

    const checkSalesZero = await page.evaluate(() => {
      return { curStep: ProductForm.getCurrentStep() };
    });
    assert('6.D.1 Jumlah terjual 0 berhasil lolos validasi ke Step 2', checkSalesZero.curStep === 2);

    // Kembali ke Step 1
    await page.evaluate(() => {
      goToStep(1);
    });
    await page.waitForTimeout(300);

    // 6.E Terjual valid: 100 dan 1.000
    await page.evaluate(() => {
      const inp = document.getElementById('cfg-sales-manual-val');
      if (inp) { inp.value = '100'; inp.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await page.evaluate(() => document.getElementById('btn-step-1-next')?.click());
    await page.waitForTimeout(400);

    const checkSales100 = await page.evaluate(() => {
      return { curStep: ProductForm.getCurrentStep() };
    });
    assert('6.E.1 Jumlah terjual 100 berhasil lolos validasi ke Step 2', checkSales100.curStep === 2);

    // Kembali ke Step 1
    await page.evaluate(() => {
      goToStep(1);
    });
    await page.waitForTimeout(300);

    // =========================================================================
    // 7. ATURAN MODEL B (KARTU MINIMALIS)
    // =========================================================================
    console.log('\n--- 7. PRESERVASI ATURAN MODEL B (KARTU MINIMALIS) ---');

    await page.evaluate(() => {
      const radCardB = document.querySelector('input[name="card_variant_radio"][value="B"]');
      if (radCardB) { radCardB.checked = true; radCardB.dispatchEvent(new Event('change')); }

      // Aktifkan Rating ON
      const chkRating = document.getElementById('cfg-show-rating');
      if (chkRating) { chkRating.checked = true; chkRating.dispatchEvent(new Event('change')); }
      ProductForm.setRatingSource('auto');
    });
    await page.waitForTimeout(200);

    const checkModelB = await page.evaluate(() => {
      const chkRating = document.getElementById('cfg-show-rating');
      const chkSales = document.getElementById('cfg-show-sales');
      return {
        ratingChecked: chkRating ? chkRating.checked : false,
        salesChecked: chkSales ? chkSales.checked : false
      };
    });

    assert('7.1 Pada Model B, saat Rating ON, toggle Terjual otomatis OFF', checkModelB.ratingChecked === true && checkModelB.salesChecked === false);

    // Coba Lanjutkan (Rating Otomatis valid, Terjual OFF tidak divalidasi)
    await page.evaluate(() => document.getElementById('btn-step-1-next')?.click());
    await page.waitForTimeout(400);

    const checkModelBNext = await page.evaluate(() => {
      return { curStep: ProductForm.getCurrentStep() };
    });
    assert('7.2 Model B dengan Rating Otomatis & Terjual OFF berhasil lanjut ke Step 2', checkModelBNext.curStep === 2);

    await page.close();
  } catch (err) {
    console.error('Test runner encountered an error:', err);
    errors.push(err.message);
  } finally {
    await browser.close();
  }

  console.log('\n=== REKAP HASIL PENGUJIAN TASK 2.10C-7C ===');
  console.log(`PASS: ${passCount}`);
  console.log(`FAIL: ${failCount}`);
  if (errors.length > 0) {
    console.log('\nDetail Error:');
    errors.forEach(e => console.log(' - ' + e));
    process.exit(1);
  } else {
    console.log('\nSemua pengujian Task 2.10C-7C berhasil!');
    process.exit(0);
  }
})();

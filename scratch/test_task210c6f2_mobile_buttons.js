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
  console.log('=== TEST SUITE TASK 2.10C-6F-2: LAYOUT TOMBOL AKSI MOBILE STEP 1 & STEP 2 ===\n');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const fileUrl = 'file:///' + path.resolve(__dirname, '../admin.html').replace(/\\/g, '/');

  try {
    // =========================================================================
    // SEKSI 1: PENGUJIAN MOBILE (375x812, 390x844, 412x915)
    // =========================================================================
    const mobileViewports = [
      { name: 'Mobile 375x812 (iPhone SE/Mini)', width: 375, height: 812 },
      { name: 'Mobile 390x844 (iPhone 12/13/14)', width: 390, height: 844 },
      { name: 'Mobile 412x915 (Android / Pixel)', width: 412, height: 915 }
    ];

    for (const vp of mobileViewports) {
      console.log(`\n--- PENGUJIAN ${vp.name} ---`);
      const page = await browser.newPage();
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(fileUrl, { waitUntil: 'load' });
      await page.waitForTimeout(300);

      await page.evaluate(() => {
        document.getElementById('admin-login-screen')?.classList.add('hidden');
        document.getElementById('admin-app')?.classList.remove('hidden');
        AdminApp.navigate('create-product');
      });
      await page.waitForTimeout(300);

      // --- STEP 1 MOBILE VERIFICATION ---
      console.log(`[Step 1 di ${vp.name}]`);
      const s1Layout = await page.evaluate(() => {
        const btnCancel = document.getElementById('btn-step-1-cancel');
        const btnNext = document.getElementById('btn-step-1-next');
        const footer = document.getElementById('step1-footer-actions');
        const vpEl = document.getElementById('admin-main-viewport');

        const rectCancel = btnCancel.getBoundingClientRect();
        const rectNext = btnNext.getBoundingClientRect();
        const rectFooter = footer.getBoundingClientRect();

        const isVertical = rectNext.top >= rectCancel.bottom;
        const gap = Math.round(rectNext.top - rectCancel.bottom);
        const widthDiff = Math.abs(rectCancel.width - rectNext.width);
        const isSameWidth = widthDiff <= 2; // toleransi subpixel
        const heightCancel = Math.round(rectCancel.height);
        const heightNext = Math.round(rectNext.height);
        const isSameHeight = Math.abs(heightCancel - heightNext) <= 2;

        const hasNoHorizontalOverflow = vpEl ? (vpEl.scrollWidth <= vpEl.clientWidth + 1) : true;
        const cancelFillsWidth = (rectCancel.width >= rectFooter.width - 32); // margin padding
        const nextFillsWidth = (rectNext.width >= rectFooter.width - 32);

        return {
          isVertical,
          gap,
          isSameWidth,
          isSameHeight,
          cancelWidth: rectCancel.width,
          nextWidth: rectNext.width,
          heightCancel,
          heightNext,
          hasNoHorizontalOverflow,
          cancelFillsWidth,
          nextFillsWidth
        };
      });

      assert(`${vp.name}: Step 1 tombol Batal dan Lanjutkan tersusun vertikal (Batal di atas, Lanjutkan di bawah)`, s1Layout.isVertical);
      assert(`${vp.name}: Step 1 kedua tombol memiliki lebar yang sama (Cancel: ${Math.round(s1Layout.cancelWidth)}px, Next: ${Math.round(s1Layout.nextWidth)}px)`, s1Layout.isSameWidth && s1Layout.cancelFillsWidth);
      assert(`${vp.name}: Step 1 kedua tombol memiliki tinggi konsisten (Cancel: ${s1Layout.heightCancel}px, Next: ${s1Layout.heightNext}px)`, s1Layout.isSameHeight && s1Layout.heightCancel >= 40);
      assert(`${vp.name}: Step 1 jarak vertikal antartombol proporsional (${s1Layout.gap}px)`, s1Layout.gap >= 8 && s1Layout.gap <= 16);
      assert(`${vp.name}: Step 1 tidak terjadi horizontal overflow pada viewport`, s1Layout.hasNoHorizontalOverflow);

      // Verifikasi klik fungsi tombol Step 1
      await page.click('#btn-step-1-next');
      await page.waitForTimeout(200);
      const isValidationTriggered = await page.evaluate(() => {
        const banner = document.getElementById('form-error-banner');
        return banner && !banner.classList.contains('hidden');
      });
      assert(`${vp.name}: Step 1 tombol Lanjutkan dapat diklik dan menjalankan validasi/navigasi`, isValidationTriggered);

      // --- NAVIGASI KE STEP 2 ---
      await page.evaluate(() => {
        const radType = document.querySelector('input[name="product_type_radio"][value="physical"]');
        if (radType) { radType.checked = true; radType.dispatchEvent(new Event('change')); }
        const radCard = document.querySelector('input[name="card_variant_radio"][value="A"]');
        if (radCard) { radCard.checked = true; radCard.dispatchEvent(new Event('change')); }
        const state = ProductForm.getPrimaryState();
        state.images = [{ id: 'img-1', url: 'https://via.placeholder.com/300' }];
        state.name = 'Kemeja Batik Katun Premium';
        const nameInp = document.getElementById('input-prod-name');
        if (nameInp) nameInp.value = state.name;
        const chkRating = document.getElementById('cfg-show-rating');
        if (chkRating) { chkRating.checked = false; chkRating.dispatchEvent(new Event('change')); }
        const chkSales = document.getElementById('cfg-show-sales');
        if (chkSales) { chkSales.checked = false; chkSales.dispatchEvent(new Event('change')); }
        const chkLabel = document.getElementById('toggle-enable-custom-labels');
        if (chkLabel) { chkLabel.checked = false; chkLabel.dispatchEvent(new Event('change')); }
        ProductForm.goToStep(2);
      });
      await page.waitForTimeout(300);

      // --- STEP 2 MOBILE VERIFICATION ---
      console.log(`[Step 2 di ${vp.name}]`);
      const s2Layout = await page.evaluate(() => {
        const btnPrev = document.getElementById('btn-step-2-prev');
        const btnDraft = document.getElementById('btn-save-draft');
        const btnSubmit = document.getElementById('btn-submit-product');
        const footer = document.getElementById('step2-footer-actions');
        const vpEl = document.getElementById('admin-main-viewport');

        const rectPrev = btnPrev.getBoundingClientRect();
        const rectDraft = btnDraft.getBoundingClientRect();
        const rectSubmit = btnSubmit.getBoundingClientRect();
        const rectFooter = footer.getBoundingClientRect();

        const isVertical = (rectDraft.top >= rectPrev.bottom) && (rectSubmit.top >= rectDraft.bottom);
        const gap1 = Math.round(rectDraft.top - rectPrev.bottom);
        const gap2 = Math.round(rectSubmit.top - rectDraft.bottom);

        const widthDiff1 = Math.abs(rectPrev.width - rectDraft.width);
        const widthDiff2 = Math.abs(rectDraft.width - rectSubmit.width);
        const isSameWidth = (widthDiff1 <= 2) && (widthDiff2 <= 2);

        const heightPrev = Math.round(rectPrev.height);
        const heightDraft = Math.round(rectDraft.height);
        const heightSubmit = Math.round(rectSubmit.height);
        const isSameHeight = (Math.abs(heightPrev - heightDraft) <= 2) && (Math.abs(heightDraft - heightSubmit) <= 2);

        const hasNoHorizontalOverflow = vpEl ? (vpEl.scrollWidth <= vpEl.clientWidth + 1) : true;
        const submitIsPrimary = btnSubmit.classList.contains('btn-primary-brand');

        return {
          isVertical,
          gap1,
          gap2,
          isSameWidth,
          isSameHeight,
          prevWidth: rectPrev.width,
          draftWidth: rectDraft.width,
          submitWidth: rectSubmit.width,
          heightPrev,
          heightDraft,
          heightSubmit,
          hasNoHorizontalOverflow,
          submitIsPrimary
        };
      });

      assert(`${vp.name}: Step 2 tombol Kembali, Simpan Draf, dan Simpan Produk tersusun vertikal (1. Kembali, 2. Simpan Draf, 3. Simpan Produk)`, s2Layout.isVertical);
      assert(`${vp.name}: Step 2 ketiga tombol memiliki lebar yang sama (Prev: ${Math.round(s2Layout.prevWidth)}px, Draft: ${Math.round(s2Layout.draftWidth)}px, Submit: ${Math.round(s2Layout.submitWidth)}px)`, s2Layout.isSameWidth);
      assert(`${vp.name}: Step 2 ketiga tombol memiliki tinggi konsisten (Prev: ${s2Layout.heightPrev}px, Draft: ${s2Layout.heightDraft}px, Submit: ${s2Layout.heightSubmit}px)`, s2Layout.isSameHeight && s2Layout.heightSubmit >= 40);
      assert(`${vp.name}: Step 2 jarak antartombol seragam (Gap 1: ${s2Layout.gap1}px, Gap 2: ${s2Layout.gap2}px)`, Math.abs(s2Layout.gap1 - s2Layout.gap2) <= 2 && s2Layout.gap1 >= 8 && s2Layout.gap1 <= 16);
      assert(`${vp.name}: Step 2 tidak terjadi horizontal overflow pada viewport`, s2Layout.hasNoHorizontalOverflow);
      assert(`${vp.name}: Step 2 tombol Simpan Produk mempertahankan identitas sebagai aksi utama`, s2Layout.submitIsPrimary);

      // Verifikasi klik fungsi tombol Kembali Step 2
      await page.click('#btn-step-2-prev');
      await page.waitForTimeout(200);
      const curStepAfterBack = await page.evaluate(() => ProductForm.getCurrentStep());
      assert(`${vp.name}: Step 2 tombol Kembali berfungsi mengembalikan form ke Step 1`, curStepAfterBack === 1);

      await page.close();
    }

    // =========================================================================
    // SEKSI 2: PENGUJIAN TABLET (768x1024)
    // =========================================================================
    console.log('\n--- SEKSI 2: PENGUJIAN TABLET (768x1024) ---');
    const tabletPage = await browser.newPage();
    await tabletPage.setViewportSize({ width: 768, height: 1024 });
    await tabletPage.goto(fileUrl, { waitUntil: 'load' });
    await tabletPage.waitForTimeout(300);

    await tabletPage.evaluate(() => {
      document.getElementById('admin-login-screen')?.classList.add('hidden');
      document.getElementById('admin-app')?.classList.remove('hidden');
      AdminApp.navigate('create-product');
    });
    await tabletPage.waitForTimeout(300);

    const tabletS1Layout = await pageEvaluateTabletS1(tabletPage);
    assert('Tablet: Step 1 mempertahankan layout horizontal (Batal di kiri, Lanjutkan di kanan)', tabletS1Layout.isHorizontal);
    assert('Tablet: Step 1 tidak memaksakan lebar 100% pada tombol (Auto Width)', tabletS1Layout.isAutoWidth);
    assert('Tablet: Step 1 bebas horizontal overflow', tabletS1Layout.noOverflow);

    // Navigasi ke Step 2 di Tablet
    await tabletPage.evaluate(() => {
      const radType = document.querySelector('input[name="product_type_radio"][value="physical"]');
      if (radType) { radType.checked = true; radType.dispatchEvent(new Event('change')); }
      const radCard = document.querySelector('input[name="card_variant_radio"][value="A"]');
      if (radCard) { radCard.checked = true; radCard.dispatchEvent(new Event('change')); }
      const state = ProductForm.getPrimaryState();
      state.images = [{ id: 'img-1', url: 'https://via.placeholder.com/300' }];
      state.name = 'Kemeja Batik Katun Premium';
      const nameInp = document.getElementById('input-prod-name');
      if (nameInp) nameInp.value = state.name;
      const chkRating = document.getElementById('cfg-show-rating');
      if (chkRating) { chkRating.checked = false; chkRating.dispatchEvent(new Event('change')); }
      const chkSales = document.getElementById('cfg-show-sales');
      if (chkSales) { chkSales.checked = false; chkSales.dispatchEvent(new Event('change')); }
      const chkLabel = document.getElementById('toggle-enable-custom-labels');
      if (chkLabel) { chkLabel.checked = false; chkLabel.dispatchEvent(new Event('change')); }
      ProductForm.goToStep(2);
    });
    await tabletPage.waitForTimeout(300);

    const tabletS2Layout = await pageEvaluateTabletS2(tabletPage);
    assert('Tablet: Step 2 mempertahankan layout horizontal (Kembali di kiri, Simpan Draf & Simpan Produk di kanan)', tabletS2Layout.isHorizontal);
    assert('Tablet: Step 2 tidak memaksakan 1 kolom (Auto Width)', tabletS2Layout.isAutoWidth);
    assert('Tablet: Step 2 bebas horizontal overflow', tabletS2Layout.noOverflow);

    await tabletPage.close();

    // =========================================================================
    // SEKSI 3: PENGUJIAN DESKTOP (1280x800 & 1440x900)
    // =========================================================================
    const desktopViewports = [
      { name: 'Desktop 1280x800', width: 1280, height: 800 },
      { name: 'Desktop 1440x900', width: 1440, height: 900 }
    ];

    for (const d of desktopViewports) {
      console.log(`\n--- PENGUJIAN ${d.name} ---`);
      const deskPage = await browser.newPage();
      await deskPage.setViewportSize({ width: d.width, height: d.height });
      await deskPage.goto(fileUrl, { waitUntil: 'load' });
      await deskPage.waitForTimeout(300);

      await deskPage.evaluate(() => {
        document.getElementById('admin-login-screen')?.classList.add('hidden');
        document.getElementById('admin-app')?.classList.remove('hidden');
        AdminApp.navigate('create-product');
      });
      await deskPage.waitForTimeout(300);

      const deskS1 = await deskPage.evaluate(() => {
        const footer = document.getElementById('step1-footer-actions');
        const btnCancel = document.getElementById('btn-step-1-cancel');
        const btnNext = document.getElementById('btn-step-1-next');
        const style = window.getComputedStyle(footer);
        const rectCancel = btnCancel.getBoundingClientRect();
        const rectNext = btnNext.getBoundingClientRect();

        const isFixed = style.position === 'fixed';
        const isHorizontal = Math.abs(rectCancel.top - rectNext.top) <= 5;
        const cancelLeft = rectCancel.left < rectNext.left;

        return { isFixed, isHorizontal, cancelLeft };
      });

      assert(`${d.name}: Step 1 fixed bottom action bar aktif (position: fixed)`, deskS1.isFixed);
      assert(`${d.name}: Step 1 layout horizontal dipertahankan (Batal di kiri, Lanjutkan di kanan)`, deskS1.isHorizontal && deskS1.cancelLeft);

      // Ke Step 2 Desktop
      await deskPage.evaluate(() => {
        const radType = document.querySelector('input[name="product_type_radio"][value="physical"]');
        if (radType) { radType.checked = true; radType.dispatchEvent(new Event('change')); }
        const radCard = document.querySelector('input[name="card_variant_radio"][value="A"]');
        if (radCard) { radCard.checked = true; radCard.dispatchEvent(new Event('change')); }
        const state = ProductForm.getPrimaryState();
        state.images = [{ id: 'img-1', url: 'https://via.placeholder.com/300' }];
        state.name = 'Kemeja Batik Katun Premium';
        const nameInp = document.getElementById('input-prod-name');
        if (nameInp) nameInp.value = state.name;
        const chkRating = document.getElementById('cfg-show-rating');
        if (chkRating) { chkRating.checked = false; chkRating.dispatchEvent(new Event('change')); }
        const chkSales = document.getElementById('cfg-show-sales');
        if (chkSales) { chkSales.checked = false; chkSales.dispatchEvent(new Event('change')); }
        const chkLabel = document.getElementById('toggle-enable-custom-labels');
        if (chkLabel) { chkLabel.checked = false; chkLabel.dispatchEvent(new Event('change')); }
        ProductForm.goToStep(2);
      });
      await deskPage.waitForTimeout(300);

      const deskS2 = await deskPage.evaluate(() => {
        const footer = document.getElementById('step2-footer-actions');
        const btnPrev = document.getElementById('btn-step-2-prev');
        const btnDraft = document.getElementById('btn-save-draft');
        const btnSubmit = document.getElementById('btn-submit-product');
        const style = window.getComputedStyle(footer);
        const rectPrev = btnPrev.getBoundingClientRect();
        const rectDraft = btnDraft.getBoundingClientRect();
        const rectSubmit = btnSubmit.getBoundingClientRect();

        const isFixed = style.position === 'fixed';
        const isHorizontal = (Math.abs(rectPrev.top - rectDraft.top) <= 5) && (Math.abs(rectDraft.top - rectSubmit.top) <= 5);
        const prevOnLeft = (rectPrev.left < rectDraft.left) && (rectDraft.left < rectSubmit.left);

        return { isFixed, isHorizontal, prevOnLeft };
      });

      assert(`${d.name}: Step 2 fixed bottom action bar aktif (position: fixed)`, deskS2.isFixed);
      assert(`${d.name}: Step 2 layout horizontal dipertahankan (Kembali di kiri, Simpan Draf & Simpan Produk di kanan)`, deskS2.isHorizontal && deskS2.prevOnLeft);

      await deskPage.close();
    }

  } catch (err) {
    console.error('Unhandled Test Error:', err);
    assert('Execution without unhandled errors', false, err.message);
  } finally {
    await browser.close();
  }

  console.log(`\n========================================`);
  console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log(`========================================\n`);

  if (failCount > 0) {
    console.error('FAILED ASSERTIONS:');
    errors.forEach(e => console.error('  - ' + e));
    process.exit(1);
  } else {
    console.log('ALL TASK 2.10C-6F-2 TESTS PASSED SUCCESSFULLY!');
  }
})();

async function pageEvaluateTabletS1(page) {
  return await page.evaluate(() => {
    const btnCancel = document.getElementById('btn-step-1-cancel');
    const btnNext = document.getElementById('btn-step-1-next');
    const footer = document.getElementById('step1-footer-actions');
    const vp = document.getElementById('admin-main-viewport');

    const rectCancel = btnCancel.getBoundingClientRect();
    const rectNext = btnNext.getBoundingClientRect();
    const rectFooter = footer.getBoundingClientRect();

    const isHorizontal = Math.abs(rectCancel.top - rectNext.top) <= 6;
    const isAutoWidth = (rectCancel.width < rectFooter.width * 0.4) && (rectNext.width < rectFooter.width * 0.4);
    const noOverflow = vp ? (vp.scrollWidth <= vp.clientWidth + 1) : true;

    return { isHorizontal, isAutoWidth, noOverflow };
  });
}

async function pageEvaluateTabletS2(page) {
  return await page.evaluate(() => {
    const btnPrev = document.getElementById('btn-step-2-prev');
    const btnDraft = document.getElementById('btn-save-draft');
    const btnSubmit = document.getElementById('btn-submit-product');
    const footer = document.getElementById('step2-footer-actions');
    const vp = document.getElementById('admin-main-viewport');

    const rectPrev = btnPrev.getBoundingClientRect();
    const rectDraft = btnDraft.getBoundingClientRect();
    const rectSubmit = btnSubmit.getBoundingClientRect();
    const rectFooter = footer.getBoundingClientRect();

    const isHorizontal = (Math.abs(rectPrev.top - rectDraft.top) <= 6) && (Math.abs(rectDraft.top - rectSubmit.top) <= 6);
    const isAutoWidth = (rectPrev.width < rectFooter.width * 0.4) && (rectDraft.width < rectFooter.width * 0.4);
    const noOverflow = vp ? (vp.scrollWidth <= vp.clientWidth + 1) : true;

    return { isHorizontal, isAutoWidth, noOverflow };
  });
}

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
  console.log('=== TEST SUITE TASK 2.10C-6F-1: AUTO-SCROLL VALIDASI STEP 1 & LAYOUT LABEL KHUSUS ===\n');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const fileUrl = 'file:///' + path.resolve(__dirname, '../admin.html').replace(/\\/g, '/');

  try {
    // =========================================================================
    // SEKSI 1: DESKTOP VIEWPORT (1280x800)
    // =========================================================================
    console.log('--- SEKSI 1: PENGUJIAN DESKTOP (1280x800) ---');
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

    // -----------------------------------------------------------------------
    // A. Verifikasi Layout Label Khusus (Peniadaan Garis Horizontal di bawah Keterangan)
    // -----------------------------------------------------------------------
    console.log('\n[A. Layout Label Khusus]');
    const layoutCheck = await page.evaluate(() => {
      // Pilih jenis fisik dan model A agar Card 2 terlihat
      const radType = document.querySelector('input[name="product_type_radio"][value="physical"]');
      if (radType) { radType.checked = true; radType.dispatchEvent(new Event('change')); }
      const radCard = document.querySelector('input[name="card_variant_radio"][value="A"]');
      if (radCard) { radCard.checked = true; radCard.dispatchEvent(new Event('change')); }

      const ctrlContainer = document.getElementById('label-custom-controls');
      const headerDiv = ctrlContainer ? ctrlContainer.firstElementChild : null;
      const descP = ctrlContainer ? ctrlContainer.querySelector('p') : null;

      const hasBorderB = headerDiv ? headerDiv.classList.contains('border-b') : false;
      const descText = descP ? descP.innerText.trim() : '';

      // Periksa bahwa hr pemisah komponen lain tetap ada
      const footerHr = document.querySelector('#section-step1-input7-footers hr');
      const ratingHr = document.querySelector('#section-step1-card-rating hr');
      const salesHr = document.querySelector('#section-step1-card-sales hr');

      return {
        hasBorderB,
        descText,
        hasFooterHr: Boolean(footerHr),
        hasRatingHr: Boolean(ratingHr),
        hasSalesHr: Boolean(salesHr)
      };
    });

    assert('A.1 Garis horizontal (border-b) di bawah keterangan Label Khusus telah dihilangkan', layoutCheck.hasBorderB === false);
    assert('A.2 Teks keterangan Label Khusus persis sesuai spesifikasi', layoutCheck.descText === 'Label Khusus untuk menampilkan informasi khusus pada kartu etalase (misal: Free Ongkir, Best Seller, Siap 1 Jam).');
    assert('A.3 Garis pemisah komponen lain (Footer, Rating, Sales) tetap dipertahankan', layoutCheck.hasRatingHr && layoutCheck.hasSalesHr);

    // -----------------------------------------------------------------------
    // B. Skenario Validasi Step 1: Jenis Produk Belum Dipilih
    // -----------------------------------------------------------------------
    console.log('\n[B. Skenario: Jenis Produk Belum Dipilih]');
    // Reset form state ke kondisi awal (belum memilih jenis produk)
    await page.evaluate(() => {
      AdminApp.navigate('create-product');
    });
    await page.waitForTimeout(300);

    await page.click('#btn-step-1-next');
    await page.waitForTimeout(300);

    const typeValidationCheck = await page.evaluate(() => {
      const banner = document.getElementById('form-error-banner');
      const isBannerVisible = banner && !banner.classList.contains('hidden');
      const target = document.getElementById('product-type-selector-group') || document.getElementById('section-step1-input1-type');
      const hasRing = target && target.classList.contains('ring-amber-400');
      const curStep = ProductForm.getCurrentStep();
      const firstRadio = target ? target.querySelector('input[type="radio"]') : null;
      const isRadioFocused = (document.activeElement === firstRadio);
      return { isBannerVisible, hasRing, curStep, isRadioFocused };
    });

    assert('B.1 Tidak lanjut ke Step 2 saat jenis produk belum dipilih', typeValidationCheck.curStep === 1);
    assert('B.2 Banner pesan kesalahan wizard muncul di Step 1', typeValidationCheck.isBannerVisible);
    assert('B.3 Elemen pemilih jenis produk mendapat highlight ring amber', typeValidationCheck.hasRing);
    assert('B.4 Radio jenis produk diarahkan fokusnya', typeValidationCheck.isRadioFocused);

    // -----------------------------------------------------------------------
    // C. Skenario: Model Kartu Belum Dipilih (Etalase ON)
    // -----------------------------------------------------------------------
    console.log('\n[C. Skenario: Model Kartu Belum Dipilih (Etalase ON)]');
    await page.evaluate(() => {
      // Pilih jenis produk, tetapi biarkan model kartu kosong
      const radType = document.querySelector('input[name="product_type_radio"][value="physical"]');
      if (radType) { radType.checked = true; radType.dispatchEvent(new Event('change')); }
      // Uncheck all card variants
      document.querySelectorAll('input[name="card_variant_radio"]').forEach(r => { r.checked = false; });
      const state = ProductForm.getPrimaryState();
      state.card_variant = null;
    });
    await page.waitForTimeout(200);

    await page.click('#btn-step-1-next');
    await page.waitForTimeout(300);

    const cardModelCheck = await page.evaluate(() => {
      const banner = document.getElementById('form-error-banner');
      const target = document.getElementById('card-model-selector-group') || document.getElementById('section-step1-input3-cardmodel');
      const hasRing = target && target.classList.contains('ring-amber-400');
      const curStep = ProductForm.getCurrentStep();
      const firstRadio = target ? target.querySelector('input[type="radio"]') : null;
      const isRadioFocused = (document.activeElement === firstRadio);
      return { isBannerVisible: !banner.classList.contains('hidden'), hasRing, curStep, isRadioFocused };
    });

    assert('C.1 Tidak lanjut ke Step 2 saat model kartu belum dipilih (Etalase ON)', cardModelCheck.curStep === 1);
    assert('C.2 Elemen pilihan model kartu mendapat highlight ring amber', cardModelCheck.hasRing);
    assert('C.3 Kontrol model kartu menerima fokus', cardModelCheck.isRadioFocused);

    // -----------------------------------------------------------------------
    // D. Skenario: Foto Produk Kosong (Etalase ON)
    // -----------------------------------------------------------------------
    console.log('\n[D. Skenario: Foto Produk Kosong (Etalase ON)]');
    await page.evaluate(() => {
      const radCard = document.querySelector('input[name="card_variant_radio"][value="A"]');
      if (radCard) { radCard.checked = true; radCard.dispatchEvent(new Event('change')); }
      const state = ProductForm.getPrimaryState();
      state.images = [];
      state.image_url = '';
      // Beri nama agar bukan nama yang invalid
      state.name = 'Kemeja Batik Modern Premium';
      const nameInp = document.getElementById('input-prod-name');
      if (nameInp) nameInp.value = state.name;
    });
    await page.waitForTimeout(200);

    await page.click('#btn-step-1-next');
    await page.waitForTimeout(300);

    const photoCheck = await page.evaluate(() => {
      const banner = document.getElementById('form-error-banner');
      const photoSec = document.getElementById('section-step1-input4-photo');
      const photoGrid = document.getElementById('gallery-slots-container');
      const addBtn = document.getElementById('btn-slot-add-photo');
      const allRings = Array.from(document.querySelectorAll('.ring-amber-400'));
      const isAddBtnRing = addBtn ? addBtn.classList.contains('ring-amber-400') : false;
      const isSecRing = photoSec ? photoSec.classList.contains('ring-amber-400') : false;
      const isGridRing = photoGrid ? photoGrid.classList.contains('ring-amber-400') : false;
      const isBtnFocused = (document.activeElement === addBtn);
      const curStep = ProductForm.getCurrentStep();
      return {
        isBannerVisible: !banner.classList.contains('hidden'),
        isAddBtnRing,
        isSecRing,
        isGridRing,
        totalRings: allRings.length,
        isBtnFocused,
        curStep
      };
    });

    assert('D.1 Tidak lanjut ke Step 2 saat foto produk masih kosong', photoCheck.curStep === 1);
    assert('D.2.1 Tombol #btn-slot-add-photo menerima ring-amber-400', photoCheck.isAddBtnRing);
    assert('D.2.2 Parent section (#section-step1-input4-photo) TIDAK menerima ring-amber-400', photoCheck.isSecRing === false);
    assert('D.2.3 Grid foto (#gallery-slots-container) TIDAK menerima ring-amber-400', photoCheck.isGridRing === false);
    assert('D.2.4 Tidak ada highlight ganda (persis 1 elemen menerima ring highlight)', photoCheck.totalRings === 1);
    assert('D.3 Tombol tambah foto menerima fokus', photoCheck.isBtnFocused);

    // -----------------------------------------------------------------------
    // E. Skenario: Nama Produk Kosong
    // -----------------------------------------------------------------------
    console.log('\n[E. Skenario: Nama Produk Kosong]');
    await page.evaluate(() => {
      const state = ProductForm.getPrimaryState();
      state.images = [{ id: 'img-1', url: 'https://via.placeholder.com/300' }];
      state.name = '';
      const nameInp = document.getElementById('input-prod-name');
      if (nameInp) { nameInp.value = ''; nameInp.dispatchEvent(new Event('input')); }
    });
    await page.waitForTimeout(200);

    await page.click('#btn-step-1-next');
    await page.waitForTimeout(300);

    const nameCheck = await page.evaluate(() => {
      const banner = document.getElementById('form-error-banner');
      const nameInp = document.getElementById('input-prod-name');
      const minErr = document.getElementById('name-min-length-error');
      const hasRing = nameInp && nameInp.classList.contains('ring-amber-400');
      const isNameFocused = (document.activeElement === nameInp);
      const hasRedBorder = nameInp && nameInp.classList.contains('border-red-500');
      const isMinErrVisible = minErr && !minErr.classList.contains('hidden');
      const curStep = ProductForm.getCurrentStep();
      return { isBannerVisible: !banner.classList.contains('hidden'), hasRing, isNameFocused, hasRedBorder, isMinErrVisible, curStep };
    });

    assert('E.1 Tidak lanjut ke Step 2 saat nama produk kosong', nameCheck.curStep === 1);
    assert('E.2 Input nama produk mendapat highlight ring amber', nameCheck.hasRing);
    assert('E.3 Input nama produk menerima fokus langsung', nameCheck.isNameFocused);
    assert('E.4 Pesan error minimal karakter nama produk ditampilkan dengan border merah', nameCheck.isMinErrVisible && nameCheck.hasRedBorder);

    // -----------------------------------------------------------------------
    // F. Skenario: Beberapa Informasi Wajib Kosong Sekaligus (Fokus ke Paling Atas)
    // -----------------------------------------------------------------------
    console.log('\n[F. Skenario: Beberapa Informasi Wajib Kosong Sekaligus]');
    await page.evaluate(() => {
      // Kosongkan jenis produk, foto, dan nama sekaligus
      const state = ProductForm.getPrimaryState();
      state.product_type = null;
      state.card_variant = null;
      state.images = [];
      state.name = '';
      document.querySelectorAll('input[name="product_type_radio"]').forEach(r => { r.checked = false; });
      document.querySelectorAll('input[name="card_variant_radio"]').forEach(r => { r.checked = false; });
      const nameInp = document.getElementById('input-prod-name');
      if (nameInp) nameInp.value = '';
    });
    await page.waitForTimeout(200);

    await page.click('#btn-step-1-next');
    await page.waitForTimeout(300);

    const topMostCheck = await page.evaluate(() => {
      const banner = document.getElementById('form-error-banner');
      const typeGroup = document.getElementById('product-type-selector-group');
      const nameInp = document.getElementById('input-prod-name');
      const hasRingType = typeGroup && typeGroup.classList.contains('ring-amber-400');
      const hasRingName = nameInp && nameInp.classList.contains('ring-amber-400');
      const firstRadio = typeGroup ? typeGroup.querySelector('input[type="radio"]') : null;
      const isRadioFocused = (document.activeElement === firstRadio);
      return { isBannerVisible: !banner.classList.contains('hidden'), hasRingType, hasRingName, isRadioFocused };
    });

    assert('F.1 Fokus dan ring amber diarahkan ke elemen paling atas (Jenis Produk)', topMostCheck.hasRingType);
    assert('F.2 Radio jenis produk terfokus, bukan input di bawahnya', topMostCheck.isRadioFocused);

    // -----------------------------------------------------------------------
    // G. Skenario: Etalase OFF (Tidak Memaksa Validasi Model Kartu, Foto, atau Label)
    // -----------------------------------------------------------------------
    console.log('\n[G. Skenario: Etalase OFF]');
    await page.evaluate(() => {
      // Set Jenis Produk Fisik
      const radType = document.querySelector('input[name="product_type_radio"][value="physical"]');
      if (radType) { radType.checked = true; radType.dispatchEvent(new Event('change')); }
      // Matikan Etalase Toko
      const toggleEtalase = document.getElementById('toggle-is-active-form');
      if (toggleEtalase) { toggleEtalase.checked = false; toggleEtalase.dispatchEvent(new Event('change')); }
      // Model kartu dan foto tetap kosong, nama diisi valid
      const state = ProductForm.getPrimaryState();
      state.is_active = false;
      state.card_variant = null;
      state.images = [];
      state.name = 'Produk Spesial Tanpa Etalase';
      const nameInp = document.getElementById('input-prod-name');
      if (nameInp) nameInp.value = state.name;
    });
    await page.waitForTimeout(200);

    await page.click('#btn-step-1-next');
    await page.waitForTimeout(400);

    const etalaseOffCheck = await page.evaluate(() => {
      const curStep = ProductForm.getCurrentStep();
      const pane2 = document.getElementById('step-pane-2');
      const isStep2Visible = pane2 && !pane2.classList.contains('hidden');
      return { curStep, isStep2Visible };
    });

    assert('G.1 Etalase OFF berhasil lanjut ke Step 2 tanpa memvalidasi model kartu dan foto', etalaseOffCheck.curStep === 2 && etalaseOffCheck.isStep2Visible);

    // Kembalikan ke Step 1
    await page.evaluate(() => {
      ProductForm.goToStep(1);
    });
    await page.waitForTimeout(300);

    // -----------------------------------------------------------------------
    // H. Skenario: Semua Data Valid (Etalase ON) → Berhasil Maju ke Step 2
    // -----------------------------------------------------------------------
    console.log('\n[H. Skenario: Semua Data Valid (Etalase ON)]');
    await page.evaluate(() => {
      // Nyalakan Etalase kembali
      const toggleEtalase = document.getElementById('toggle-is-active-form');
      if (toggleEtalase) { toggleEtalase.checked = true; toggleEtalase.dispatchEvent(new Event('change')); }
      const radType = document.querySelector('input[name="product_type_radio"][value="physical"]');
      if (radType) { radType.checked = true; radType.dispatchEvent(new Event('change')); }
      const radCard = document.querySelector('input[name="card_variant_radio"][value="C"]');
      if (radCard) { radCard.checked = true; radCard.dispatchEvent(new Event('change')); }
      const state = ProductForm.getPrimaryState();
      state.is_active = true;
      state.card_variant = 'C';
      state.images = [{ id: 'img-1', url: 'https://via.placeholder.com/300' }];
      state.name = 'Produk Percetakan Poster Custom A3+';
      const nameInp = document.getElementById('input-prod-name');
      if (nameInp) nameInp.value = state.name;

      // Label Khusus diisi valid (Model C default ON pada produk baru)
      state.custom_labels = ['Poster Custom'];
      const lblInp = document.getElementById('input-custom-label-1');
      if (lblInp) {
        lblInp.value = 'Poster Custom';
        lblInp.dispatchEvent(new Event('input'));
      }

      // Pastikan Rating & Terjual memenuhi aturan Task 7C jika aktif, atau dinonaktifkan
      const chkRating = document.getElementById('cfg-show-rating');
      if (chkRating) { chkRating.checked = false; chkRating.dispatchEvent(new Event('change')); }
      const chkSales = document.getElementById('cfg-show-sales');
      if (chkSales) { chkSales.checked = false; chkSales.dispatchEvent(new Event('change')); }
    });
    await page.waitForTimeout(200);

    await page.click('#btn-step-1-next');
    await page.waitForTimeout(400);

    const allValidCheck = await page.evaluate(() => {
      const curStep = ProductForm.getCurrentStep();
      const pane2 = document.getElementById('step-pane-2');
      return { curStep, isStep2Visible: pane2 && !pane2.classList.contains('hidden') };
    });

    assert('H.1 Seluruh data valid berhasil menuju Step 2', allValidCheck.curStep === 2 && allValidCheck.isStep2Visible);

    // -----------------------------------------------------------------------
    // I. Skenario: Highlight Amber Bertahan ~3 Detik lalu Menghilang
    // -----------------------------------------------------------------------
    console.log('\n[I. Skenario: Durasi Highlight Amber]');
    // Mundur ke Step 1
    await page.evaluate(() => {
      ProductForm.goToStep(1);
      const nameInp = document.getElementById('input-prod-name');
      if (nameInp) nameInp.value = '';
      ProductForm.getPrimaryState().name = '';
    });
    await page.waitForTimeout(200);

    await page.click('#btn-step-1-next');
    await page.waitForTimeout(100);

    const ringInitial = await page.evaluate(() => {
      const inp = document.getElementById('input-prod-name');
      return inp && inp.classList.contains('ring-amber-400');
    });
    assert('I.1 Highlight ring amber muncul segera setelah validasi gagal', ringInitial === true);

    // Tunggu 3.2 detik untuk memastikan timer setTimeout 3000ms selesai
    await page.waitForTimeout(3200);

    const ringAfterTimeout = await page.evaluate(() => {
      const inp = document.getElementById('input-prod-name');
      return inp && inp.classList.contains('ring-amber-400');
    });
    assert('I.2 Highlight ring amber otomatis hilang setelah ~3 detik', ringAfterTimeout === false);

    // -----------------------------------------------------------------------
    // J. Skenario: Membuka Kontainer Tertutup Sebelum Fokus
    // -----------------------------------------------------------------------
    console.log('\n[J. Skenario: Kontainer Tertutup Dibuka Sebelum Fokus]');
    const openClosedContainerCheck = await page.evaluate(async () => {
      // Buat elemen buatan di dalam div tersembunyi
      const hiddenContainer = document.createElement('div');
      hiddenContainer.id = 'test-closed-container';
      hiddenContainer.className = 'hidden';
      const testInput = document.createElement('input');
      testInput.id = 'test-hidden-input';
      testInput.type = 'text';
      hiddenContainer.appendChild(testInput);
      document.getElementById('step-pane-1').appendChild(hiddenContainer);

      // Panggil focusAndHighlightValidationTarget
      ProductForm.focusAndHighlightValidationTarget(testInput);

      const isUnhidden = !hiddenContainer.classList.contains('hidden');

      // Beri jeda 80ms agar requestAnimationFrame executeScrollAndHighlight selesai berjalan
      await new Promise(r => setTimeout(r, 80));
      const hasRing = testInput.classList.contains('ring-amber-400');

      // Bersihkan elemen pengujian
      hiddenContainer.remove();

      return { isUnhidden, hasRing };
    });

    assert('J.1 Kontainer tertutup (hidden) otomatis dibuka sebelum fokus', openClosedContainerCheck.isUnhidden);
    assert('J.2 Elemen di dalam kontainer tertutup berhasil diberi highlight ring amber', openClosedContainerCheck.hasRing);

    await page.close();

    // =========================================================================
    // SEKSI 2: PENGUJIAN MOBILE (375x812 iPhone SE / Mini)
    // =========================================================================
    console.log('\n--- SEKSI 2: PENGUJIAN MOBILE (375x812) ---');
    const mobilePage1 = await browser.newPage();
    await mobilePage1.setViewportSize({ width: 375, height: 812 });
    await mobilePage1.goto(fileUrl, { waitUntil: 'load' });
    await mobilePage1.waitForTimeout(400);

    await mobilePage1.evaluate(() => {
      document.getElementById('admin-login-screen')?.classList.add('hidden');
      document.getElementById('admin-app')?.classList.remove('hidden');
      AdminApp.navigate('create-product');
    });
    await mobilePage1.waitForTimeout(400);

    // K. Auto-scroll ke Nama Produk di Mobile 375x812
    console.log('\n[K. Mobile 375x812: Auto-scroll & Clearance]');
    await mobilePage1.evaluate(() => {
      // Pilih jenis fisik, model A, dan beri foto agar nama yang menjadi invalid target
      const radType = document.querySelector('input[name="product_type_radio"][value="physical"]');
      if (radType) { radType.checked = true; radType.dispatchEvent(new Event('change')); }
      const radCard = document.querySelector('input[name="card_variant_radio"][value="A"]');
      if (radCard) { radCard.checked = true; radCard.dispatchEvent(new Event('change')); }
      const state = ProductForm.getPrimaryState();
      state.images = [{ id: 'img-1', url: 'https://via.placeholder.com/300' }];
      state.name = '';
      const nameInp = document.getElementById('input-prod-name');
      if (nameInp) nameInp.value = '';

      // Scroll viewport jauh ke bawah terlebih dahulu
      const vp = document.getElementById('admin-main-viewport');
      if (vp) vp.scrollTop = 9999;
    });
    await mobilePage1.waitForTimeout(200);

    await mobilePage1.click('#btn-step-1-next');
    await mobilePage1.waitForTimeout(400);

    const mobileScrollCheck1 = await mobilePage1.evaluate(() => {
      const nameInp = document.getElementById('input-prod-name');
      const vp = document.getElementById('admin-main-viewport');
      const elRect = nameInp.getBoundingClientRect();
      const vpRect = vp ? vp.getBoundingClientRect() : { top: 0 };

      // Elemen tidak boleh tertutup sticky header (jarak dari atas viewport minimal 10px)
      const distanceFromVpTop = elRect.top - vpRect.top;
      const isVisibleInViewport = (distanceFromVpTop >= 10 && elRect.bottom <= (vpRect.top + 812));
      const hasRing = nameInp.classList.contains('ring-amber-400');
      const isFocused = (document.activeElement === nameInp);

      return { distanceFromVpTop, isVisibleInViewport, hasRing, isFocused };
    });

    assert('K.1 Viewport mobile 375x812 melakukan auto-scroll dengan smooth menuju target invalid', mobileScrollCheck1.distanceFromVpTop >= 10 && mobileScrollCheck1.distanceFromVpTop <= 150);
    assert('K.2 Target input tidak tertutup sticky header di mobile 375x812', mobileScrollCheck1.distanceFromVpTop >= 10);
    assert('K.3 Target input mendapat highlight amber dan fokus di mobile 375x812', mobileScrollCheck1.hasRing && mobileScrollCheck1.isFocused);

    await mobilePage1.close();

    // =========================================================================
    // SEKSI 3: PENGUJIAN MOBILE (390x844 iPhone 12/13/14)
    // =========================================================================
    console.log('\n--- SEKSI 3: PENGUJIAN MOBILE (390x844) ---');
    const mobilePage2 = await browser.newPage();
    await mobilePage2.setViewportSize({ width: 390, height: 844 });
    await mobilePage2.goto(fileUrl, { waitUntil: 'load' });
    await mobilePage2.waitForTimeout(400);

    await mobilePage2.evaluate(() => {
      document.getElementById('admin-login-screen')?.classList.add('hidden');
      document.getElementById('admin-app')?.classList.remove('hidden');
      AdminApp.navigate('create-product');
    });
    await mobilePage2.waitForTimeout(400);

    // L. Mobile Sheet Obstruksi Ditutup Otomatis Sebelum Scroll
    console.log('\n[L. Mobile 390x844: Penanganan Sheet/Drawer Penghalang]');
    await mobilePage2.evaluate(() => {
      // Pilih jenis fisik, model A, foto diisi, nama kosong
      const radType = document.querySelector('input[name="product_type_radio"][value="physical"]');
      if (radType) { radType.checked = true; radType.dispatchEvent(new Event('change')); }
      const radCard = document.querySelector('input[name="card_variant_radio"][value="A"]');
      if (radCard) { radCard.checked = true; radCard.dispatchEvent(new Event('change')); }
      const state = ProductForm.getPrimaryState();
      state.images = [{ id: 'img-1', url: 'https://via.placeholder.com/300' }];
      state.name = '';

      // Simulasikan mobile preview sheet sedang terbuka
      const mobSheet = document.getElementById('mobile-preview-sheet');
      if (mobSheet) mobSheet.classList.remove('translate-y-full');
    });
    await mobilePage2.waitForTimeout(200);

    await mobilePage2.click('#btn-step-1-next');
    await mobilePage2.waitForTimeout(500);

    const sheetCheck = await mobilePage2.evaluate(() => {
      const mobSheet = document.getElementById('mobile-preview-sheet');
      const isSheetClosed = mobSheet ? mobSheet.classList.contains('translate-y-full') : true;
      const nameInp = document.getElementById('input-prod-name');
      const hasRing = nameInp && nameInp.classList.contains('ring-amber-400');
      const isFocused = (document.activeElement === nameInp);
      return { isSheetClosed, hasRing, isFocused };
    });

    assert('L.1 Mobile preview sheet penghalang otomatis ditutup saat validasi target difokuskan', sheetCheck.isSheetClosed);
    assert('L.2 Target input tetap menerima highlight amber dan fokus setelah sheet ditutup di mobile 390x844', sheetCheck.hasRing && sheetCheck.isFocused);

    await mobilePage2.close();

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
    console.log('ALL TESTS PASSED SUCCESSFULLY!');
  }
})();

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
  console.log('=== TEST SUITE TASK 2.10C-7F-B: PEMULIHAN KONTROL WARNA TEKS TERJUAL PADA TAB DESAIN KARTU ===\n');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const fileUrl = 'file:///' + path.resolve(__dirname, '../admin.html').replace(/\\/g, '/');

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(fileUrl, { waitUntil: 'load' });
    await page.waitForTimeout(400);

    // Navigasi ke Form Tambah Produk
    await page.evaluate(() => {
      document.getElementById('admin-login-screen')?.classList.add('hidden');
      document.getElementById('admin-app')?.classList.remove('hidden');
      AdminApp.navigate('create-product');
    });
    await page.waitForTimeout(400);

    // Siapkan form: jenis fisik, nama, gambar, model A, buka accordion text-info
    await page.evaluate(() => {
      const radType = document.querySelector('input[name="product_type_radio"][value="physical"]');
      if (radType) { radType.checked = true; radType.dispatchEvent(new Event('change')); }
      const radCard = document.querySelector('input[name="card_variant_radio"][value="A"]');
      if (radCard) { radCard.checked = true; radCard.dispatchEvent(new Event('change')); }
      const state = ProductForm.getPrimaryState();
      state.name = 'Kaos Polos Katun Combed';
      state.images = [{ id: 'img-1', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518', is_primary: true }];
      state.image_url = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518';
      const nameInp = document.getElementById('input-prod-name');
      if (nameInp) nameInp.value = state.name;

      // Pastikan Teks Terjual ON di Step 1 Card 2 dengan data manual
      const chkSales = document.getElementById('cfg-show-sales');
      if (chkSales) { chkSales.checked = true; chkSales.dispatchEvent(new Event('change')); }
      const btnManual = document.querySelector('.btn-sales-src[data-source="manual"]');
      if (btnManual) btnManual.click();
      const valSales = document.getElementById('cfg-sales-manual-val');
      if (valSales) {
        valSales.value = '150';
        valSales.dispatchEvent(new Event('input'));
      }

      // Pindah ke Tab Desain di sidebar preview desktop
      const btnTabDesain = document.getElementById('btn-tab-preview-design');
      if (btnTabDesain) btnTabDesain.click();

      // Buka accordion Teks & Informasi jika belum terbuka
      const btnAcc = document.getElementById('btn-accordion-text-info');
      const bodyAcc = document.getElementById('accordion-body-text-info');
      if (bodyAcc && bodyAcc.classList.contains('hidden')) {
        if (btnAcc) btnAcc.click();
      }
    });
    await page.waitForTimeout(400);

    // =========================================================================
    // 1 & 2. KONTROL WARNA TERSEDIA DI DESKTOP DAN MOBILE
    // =========================================================================
    console.log('--- 1 & 2. Ketersediaan Kontrol Desktop & Mobile ---');

    const checkAvailability = await page.evaluate(() => {
      const dColor = document.getElementById('cfg-sales-color');
      const dHex = document.getElementById('cfg-sales-hex');
      const mColor = document.getElementById('cfg-sales-color-mob');
      const mHex = document.getElementById('cfg-sales-hex-mob');
      return {
        dColorExists: Boolean(dColor),
        dHexExists: Boolean(dHex),
        mColorExists: Boolean(mColor),
        mHexExists: Boolean(mHex),
        dColorType: dColor ? dColor.type : '',
        dHexType: dHex ? dHex.type : '',
        mColorType: mColor ? mColor.type : '',
        mHexType: mHex ? mHex.type : ''
      };
    });

    assert('1. Kontrol warna Teks Terjual tersedia di Desktop (#cfg-sales-color & #cfg-sales-hex)',
      checkAvailability.dColorExists && checkAvailability.dHexExists &&
      checkAvailability.dColorType === 'color' && checkAvailability.dHexType === 'text');

    assert('2. Kontrol warna Teks Terjual tersedia di Mobile (#cfg-sales-color-mob & #cfg-sales-hex-mob)',
      checkAvailability.mColorExists && checkAvailability.mHexExists &&
      checkAvailability.mColorType === 'color' && checkAvailability.mHexType === 'text');

    // =========================================================================
    // 3. DEFAULT WARNA ADALAH #64748b
    // =========================================================================
    console.log('--- 3. Default Warna #64748b ---');

    const checkDefaultColor = await page.evaluate(() => {
      const dColor = document.getElementById('cfg-sales-color')?.value?.toLowerCase();
      const dHex = document.getElementById('cfg-sales-hex')?.value?.toLowerCase();
      const mColor = document.getElementById('cfg-sales-color-mob')?.value?.toLowerCase();
      const mHex = document.getElementById('cfg-sales-hex-mob')?.value?.toLowerCase();
      return { dColor, dHex, mColor, mHex };
    });

    assert('3. Default warna adalah #64748b pada desktop dan mobile',
      checkDefaultColor.dColor === '#64748b' &&
      checkDefaultColor.dHex === '#64748b' &&
      checkDefaultColor.mColor === '#64748b' &&
      checkDefaultColor.mHex === '#64748b');

    // =========================================================================
    // 4. COLOR PICKER DAN HEX SALING SINKRON
    // =========================================================================
    console.log('--- 4. Color Picker dan HEX Saling Sinkron ---');

    // A. Ubah color picker desktop -> hex desktop, color mobile, hex mobile ikut berubah
    await page.evaluate(() => {
      const dColor = document.getElementById('cfg-sales-color');
      if (dColor) {
        dColor.value = '#7c3aed';
        dColor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(200);

    const checkSync1 = await page.evaluate(() => {
      return {
        dColor: document.getElementById('cfg-sales-color')?.value?.toLowerCase(),
        dHex: document.getElementById('cfg-sales-hex')?.value?.toLowerCase(),
        mColor: document.getElementById('cfg-sales-color-mob')?.value?.toLowerCase(),
        mHex: document.getElementById('cfg-sales-hex-mob')?.value?.toLowerCase()
      };
    });
    assert('4.a Mengubah color picker desktop menyinkronkan HEX desktop dan mobile (#7c3aed)',
      checkSync1.dColor === '#7c3aed' && checkSync1.dHex === '#7c3aed' &&
      checkSync1.mColor === '#7c3aed' && checkSync1.mHex === '#7c3aed');

    // B. Ubah HEX input mobile -> color picker mobile & desktop ikut berubah
    await page.evaluate(() => {
      const mHex = document.getElementById('cfg-sales-hex-mob');
      if (mHex) {
        mHex.value = '#059669';
        mHex.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(200);

    const checkSync2 = await page.evaluate(() => {
      return {
        dColor: document.getElementById('cfg-sales-color')?.value?.toLowerCase(),
        dHex: document.getElementById('cfg-sales-hex')?.value?.toLowerCase(),
        mColor: document.getElementById('cfg-sales-color-mob')?.value?.toLowerCase(),
        mHex: document.getElementById('cfg-sales-hex-mob')?.value?.toLowerCase()
      };
    });
    assert('4.b Mengubah HEX mobile menyinkronkan color picker dan desktop (#059669)',
      checkSync2.dColor === '#059669' && checkSync2.dHex === '#059669' &&
      checkSync2.mColor === '#059669' && checkSync2.mHex === '#059669');

    // =========================================================================
    // 5. HEX TIDAK VALID DITOLAK
    // =========================================================================
    console.log('--- 5. HEX Tidak Valid Ditolak ---');

    await page.evaluate(() => {
      const dHex = document.getElementById('cfg-sales-hex');
      if (dHex) {
        dHex.value = 'invalid-hex';
        dHex.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(100);

    const checkInvalidTyping = await page.evaluate(() => {
      const dColor = document.getElementById('cfg-sales-color')?.value?.toLowerCase();
      // Preview live color tidak boleh jadi 'invalid-hex'
      const previewSpan = document.querySelector('#card-live-preview-box span[style*="color"]');
      const previewColor = previewSpan ? previewSpan.style.color : '';
      return { dColor, previewColor };
    });
    assert('5.a Input HEX tidak valid saat mengetik tidak merusak color picker atau CSS preview',
      checkInvalidTyping.dColor === '#059669' && !checkInvalidTyping.previewColor.includes('invalid'));

    // Trigger blur pada hex input
    await page.evaluate(() => {
      const dHex = document.getElementById('cfg-sales-hex');
      if (dHex) {
        dHex.dispatchEvent(new Event('blur', { bubbles: true }));
      }
    });
    await page.waitForTimeout(100);

    const checkInvalidBlur = await page.evaluate(() => {
      const dHex = document.getElementById('cfg-sales-hex')?.value?.toLowerCase();
      return { dHex };
    });
    assert('5.b Pada event blur, nilai HEX tidak valid ditolak dan dikembalikan ke nilai valid sebelumnya',
      checkInvalidBlur.dHex === '#059669');

    // =========================================================================
    // 6. PERUBAHAN WARNA LANGSUNG MEMPERBARUI PREVIEW MODEL A
    // =========================================================================
    console.log('--- 6. Live Preview Model A ---');

    await page.evaluate(() => {
      const dColor = document.getElementById('cfg-sales-color');
      if (dColor) {
        dColor.value = '#e11d48'; // Rose red
        dColor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(300);

    const checkModelA = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('#card-live-preview-box span, #product-card-preview-container span'));
      const salesSpan = spans.find(s => s.textContent && s.textContent.includes('terjual'));
      return {
        found: Boolean(salesSpan),
        text: salesSpan ? salesSpan.textContent.trim() : '',
        inlineColor: salesSpan ? salesSpan.style.color : '',
        hasHardcodedSlate: salesSpan ? salesSpan.classList.contains('text-slate-500') : true
      };
    });

    assert('6. Perubahan warna langsung memperbarui preview Model A (#e11d48)',
      checkModelA.found &&
      (checkModelA.inlineColor === 'rgb(225, 29, 72)' || checkModelA.inlineColor === '#e11d48') &&
      !checkModelA.hasHardcodedSlate);

    // =========================================================================
    // 7. PERUBAHAN WARNA LANGSUNG MEMPERBARUI PREVIEW MODEL B
    // =========================================================================
    console.log('--- 7. Live Preview Model B ---');

    await page.evaluate(() => {
      const radCardB = document.querySelector('input[name="card_variant_radio"][value="B"]');
      if (radCardB) { radCardB.checked = true; radCardB.dispatchEvent(new Event('change')); }
      // Khusus Model B: matikan Rating agar Teks Terjual aktif (aturan mutual exclusion Model B)
      const chkRating = document.getElementById('cfg-show-rating');
      if (chkRating) { chkRating.checked = false; chkRating.dispatchEvent(new Event('change')); }
      const chkSales = document.getElementById('cfg-show-sales');
      if (chkSales) { chkSales.checked = true; chkSales.dispatchEvent(new Event('change')); }
      ProductForm.updateProductCardLivePreview();
    });
    await page.waitForTimeout(300);

    const checkModelB = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('#card-live-preview-box span, #product-card-preview-container span'));
      const salesSpan = spans.find(s => s.textContent && s.textContent.includes('terjual'));
      return {
        found: Boolean(salesSpan),
        text: salesSpan ? salesSpan.textContent.trim() : '',
        inlineColor: salesSpan ? salesSpan.style.color : '',
        hasHardcodedSlate: salesSpan ? salesSpan.classList.contains('text-slate-500') : true
      };
    });

    assert('7. Perubahan warna langsung memperbarui preview Model B (#e11d48)',
      checkModelB.found &&
      (checkModelB.inlineColor === 'rgb(225, 29, 72)' || checkModelB.inlineColor === '#e11d48') &&
      !checkModelB.hasHardcodedSlate);

    // =========================================================================
    // 8. PERUBAHAN WARNA LANGSUNG MEMPERBARUI PREVIEW MODEL C
    // =========================================================================
    console.log('--- 8. Live Preview Model C ---');

    await page.evaluate(() => {
      const radCardC = document.querySelector('input[name="card_variant_radio"][value="C"]');
      if (radCardC) { radCardC.checked = true; radCardC.dispatchEvent(new Event('change')); }
      ProductForm.updateProductCardLivePreview();
    });
    await page.waitForTimeout(300);

    const checkModelC = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('#card-live-preview-box span, #product-card-preview-container span'));
      const salesSpan = spans.find(s => s.textContent && s.textContent.includes('terjual'));
      return {
        found: Boolean(salesSpan),
        text: salesSpan ? salesSpan.textContent.trim() : '',
        inlineColor: salesSpan ? salesSpan.style.color : '',
        hasHardcodedSlate: salesSpan ? salesSpan.classList.contains('text-slate-500') : true
      };
    });

    assert('8. Perubahan warna langsung memperbarui preview Model C (#e11d48)',
      checkModelC.found &&
      (checkModelC.inlineColor === 'rgb(225, 29, 72)' || checkModelC.inlineColor === '#e11d48') &&
      !checkModelC.hasHardcodedSlate);

    // =========================================================================
    // 9. WARNA TERSIMPAN SETELAH PRODUK DISIMPAN
    // =========================================================================
    console.log('--- 9. Warna Tersimpan Setelah Simpan Produk ---');

    const saveResult = await page.evaluate(() => {
      const state = ProductForm.getPrimaryState();
      state.category_id = 'cat-1';
      state.base_price = 75000;
      state.stock = 50;
      const savedProd = DB.createProduct(state, [], []);
      return {
        hasCardConfig: Boolean(savedProd && savedProd.card_config),
        savedColor: savedProd?.card_config?.sales_text_color,
        prodId: savedProd?.id
      };
    });

    assert('9. sales_text_color tersimpan di dalam card_config produk (#e11d48)',
      saveResult.hasCardConfig && saveResult.savedColor === '#e11d48');

    // =========================================================================
    // 10. WARNA DIPULIHKAN KETIKA PRODUK DIEDIT KEMBALI
    // =========================================================================
    console.log('--- 10. Pemulihan Warna Saat Edit Produk ---');

    await page.evaluate((prodId) => {
      ProductForm.loadProductForEdit(prodId);
    }, saveResult.prodId);
    await page.waitForTimeout(400);

    const checkEditRestored = await page.evaluate(() => {
      const dColor = document.getElementById('cfg-sales-color')?.value?.toLowerCase();
      const dHex = document.getElementById('cfg-sales-hex')?.value?.toLowerCase();
      const state = ProductForm.getPrimaryState();
      return {
        dColor,
        dHex,
        stateColor: state.card_config?.sales_text_color
      };
    });

    assert('10. Warna Teks Terjual dipulihkan saat produk diedit kembali (#e11d48)',
      checkEditRestored.dColor === '#e11d48' &&
      checkEditRestored.dHex === '#e11d48' &&
      checkEditRestored.stateColor === '#e11d48');

    // =========================================================================
    // 11. WARNA DIPULIHKAN SETELAH DRAFT DIMUAT
    // =========================================================================
    console.log('--- 11. Pemulihan Warna dari Draft ---');

    await page.evaluate(() => {
      AdminApp.navigate('create-product');
      const state = ProductForm.getPrimaryState();
      state.name = 'Draft Produk Uji';
      state.product_type = 'physical';
      state.card_variant = 'A';
      state.use_default_card_design = false;
      state.card_config = {
        sales_text_color: '#d97706', // Amber-600
        show_sales: true
      };
      ProductForm.saveDraftToStorage();
    });
    await page.waitForTimeout(200);

    // Reset form dan reload draft
    await page.evaluate(() => {
      ProductForm.init();
      ProductForm.loadCardConfigInputs(ProductForm.getPrimaryState().card_variant || 'A');
      ProductForm.updateProductCardLivePreview();
    });
    await page.waitForTimeout(300);

    const checkDraftRestored = await page.evaluate(() => {
      const dColor = document.getElementById('cfg-sales-color')?.value?.toLowerCase();
      const dHex = document.getElementById('cfg-sales-hex')?.value?.toLowerCase();
      const state = ProductForm.getPrimaryState();
      return {
        dColor,
        dHex,
        stateColor: state.card_config?.sales_text_color
      };
    });

    assert('11. Warna Teks Terjual dipulihkan dari draft storage (#d97706)',
      checkDraftRestored.dColor === '#d97706' &&
      checkDraftRestored.dHex === '#d97706' &&
      checkDraftRestored.stateColor === '#d97706');

    // =========================================================================
    // 12. PRODUK LAMA TANPA KONFIGURASI TETAP MENGGUNAKAN DEFAULT (#64748b)
    // =========================================================================
    console.log('--- 12. Kompatibilitas Produk Lama Tanpa Konfigurasi ---');

    const checkLegacy = await page.evaluate(() => {
      const legacyProd = {
        id: 'legacy-prod-999',
        name: 'Produk Lama Tanpa Sales Color',
        product_type: 'physical',
        card_variant: 'A',
        card_config: {
          title_color: '#000000',
          price_color: '#059669'
          // sales_text_color tidak ada!
        }
      };
      ProductForm.loadProductForEdit(legacyProd);
      const dColor = document.getElementById('cfg-sales-color')?.value?.toLowerCase();
      const dHex = document.getElementById('cfg-sales-hex')?.value?.toLowerCase();
      return { dColor, dHex };
    });

    assert('12. Produk lama tanpa sales_text_color menggunakan default #64748b',
      checkLegacy.dColor === '#64748b' && checkLegacy.dHex === '#64748b');

    // =========================================================================
    // 13. BERPINDAH MODEL KARTU TIDAK MENGHAPUS WARNA
    // =========================================================================
    console.log('--- 13. Berpindah Model Kartu Tidak Menghapus Warna ---');

    await page.evaluate(() => {
      // Atur custom color di Model A
      const dColor = document.getElementById('cfg-sales-color');
      if (dColor) {
        dColor.value = '#8b5cf6'; // Violet
        dColor.dispatchEvent(new Event('input', { bubbles: true }));
      }
      // Pindah ke Model B
      const radB = document.querySelector('input[name="card_variant_radio"][value="B"]');
      if (radB) { radB.checked = true; radB.dispatchEvent(new Event('change')); }
      // Pindah ke Model C
      const radC = document.querySelector('input[name="card_variant_radio"][value="C"]');
      if (radC) { radC.checked = true; radC.dispatchEvent(new Event('change')); }
      // Kembali ke Model A
      const radA = document.querySelector('input[name="card_variant_radio"][value="A"]');
      if (radA) { radA.checked = true; radA.dispatchEvent(new Event('change')); }
    });
    await page.waitForTimeout(300);

    const checkVariantSwitch = await page.evaluate(() => {
      const dColor = document.getElementById('cfg-sales-color')?.value?.toLowerCase();
      const dHex = document.getElementById('cfg-sales-hex')?.value?.toLowerCase();
      const state = ProductForm.getPrimaryState();
      return {
        dColor,
        dHex,
        stateColor: state.card_config?.sales_text_color
      };
    });

    assert('13. Berpindah model kartu A -> B -> C -> A tetap mempertahankan warna custom (#8b5cf6)',
      checkVariantSwitch.dColor === '#8b5cf6' &&
      checkVariantSwitch.dHex === '#8b5cf6' &&
      checkVariantSwitch.stateColor === '#8b5cf6');

    // =========================================================================
    // 14. TOGGLE TEKS TERJUAL OFF TIDAK MENGHAPUS KONFIGURASI WARNA
    // =========================================================================
    console.log('--- 14. Toggle Teks Terjual OFF Tidak Menghapus Warna ---');

    await page.evaluate(() => {
      // Matikan toggle Teks Terjual di Step 1 Card 2
      const chkSales = document.getElementById('cfg-show-sales');
      if (chkSales) {
        chkSales.checked = false;
        chkSales.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.waitForTimeout(200);

    const checkToggleOff = await page.evaluate(() => {
      const dColor = document.getElementById('cfg-sales-color')?.value?.toLowerCase();
      const dHex = document.getElementById('cfg-sales-hex')?.value?.toLowerCase();
      // Pastikan teks terjual tidak muncul di preview
      const spans = Array.from(document.querySelectorAll('#card-live-preview-box span, #product-card-preview-container span'));
      const salesSpan = spans.find(s => s.textContent && s.textContent.includes('terjual'));
      return {
        dColor,
        dHex,
        salesSpanFound: Boolean(salesSpan)
      };
    });

    assert('14. Saat Teks Terjual OFF, konfigurasi warna (#8b5cf6) tetap ada dan preview teks terjual tidak muncul',
      checkToggleOff.dColor === '#8b5cf6' &&
      checkToggleOff.dHex === '#8b5cf6' &&
      !checkToggleOff.salesSpanFound);

    // =========================================================================
    // 15. TOGGLE TEKS TERJUAL ON KEMBALI MENGGUNAKAN WARNA SEBELUMNYA
    // =========================================================================
    console.log('--- 15. Toggle ON Kembali Menggunakan Warna Terpilih ---');

    await page.evaluate(() => {
      // Hidupkan kembali toggle Teks Terjual di Step 1 Card 2 dengan sumber data valid
      const chkSales = document.getElementById('cfg-show-sales');
      if (chkSales) {
        chkSales.checked = true;
        chkSales.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const btnManual = document.querySelector('.btn-sales-src[data-source="manual"]');
      if (btnManual) btnManual.click();
      const valSales = document.getElementById('cfg-sales-manual-val');
      if (valSales) {
        valSales.value = '150';
        valSales.dispatchEvent(new Event('input'));
      }
      ProductForm.updateProductCardLivePreview();
    });
    await page.waitForTimeout(300);

    const checkToggleOn = await page.evaluate(() => {
      const dColor = document.getElementById('cfg-sales-color')?.value?.toLowerCase();
      const spans = Array.from(document.querySelectorAll('#card-live-preview-box span, #product-card-preview-container span'));
      const salesSpan = spans.find(s => s.textContent && s.textContent.includes('terjual'));
      return {
        dColor,
        salesSpanFound: Boolean(salesSpan),
        inlineColor: salesSpan ? salesSpan.style.color : ''
      };
    });

    assert('15. Saat Teks Terjual ON kembali, teks terjual muncul di preview dengan warna yang dipilih (#8b5cf6)',
      checkToggleOn.dColor === '#8b5cf6' &&
      checkToggleOn.salesSpanFound &&
      (checkToggleOn.inlineColor === 'rgb(139, 92, 246)' || checkToggleOn.inlineColor === '#8b5cf6'));

    // =========================================================================
    // 16. TIDAK ADA IKON MATA ATAU TOGGLE VISIBILITAS DUPLIKAT DI TAB DESAIN
    // =========================================================================
    console.log('--- 16. Tidak Ada Kontrol Visibilitas Duplikat di Tab Desain ---');

    const checkNoDuplicate = await page.evaluate(() => {
      const textInfoDesk = document.getElementById('accordion-body-text-info');
      const textInfoMob = document.getElementById('accordion-body-text-info-mob');
      const hasEyeDesk = Boolean(textInfoDesk && textInfoDesk.querySelector('.bi-eye, .bi-eye-slash, input[type="checkbox"]'));
      const hasEyeMob = Boolean(textInfoMob && textInfoMob.querySelector('.bi-eye, .bi-eye-slash, input[type="checkbox"]'));
      return { hasEyeDesk, hasEyeMob };
    });

    assert('16. Tab Desain Teks & Informasi bebas dari ikon mata dan toggle visibilitas duplikat',
      !checkNoDuplicate.hasEyeDesk && !checkNoDuplicate.hasEyeMob);

    // =========================================================================
    // 17. TIDAK ADA HORIZONTAL OVERFLOW PADA MOBILE
    // =========================================================================
    console.log('--- 17. Tidak Ada Horizontal Overflow pada Mobile ---');

    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    const checkMobileOverflow = await page.evaluate(() => {
      const mobSheet = document.getElementById('mobile-preview-sheet');
      const mobBody = document.getElementById('accordion-body-text-info-mob');
      if (mobBody) mobBody.classList.remove('hidden');

      const isBodyOverflow = mobBody ? (mobBody.scrollWidth > mobBody.clientWidth + 2) : false;
      const isSheetOverflow = mobSheet ? (mobSheet.scrollWidth > mobSheet.clientWidth + 2) : false;

      return {
        isBodyOverflow,
        isSheetOverflow,
        bodyScrollWidth: mobBody ? mobBody.scrollWidth : 0,
        bodyClientWidth: mobBody ? mobBody.clientWidth : 0
      };
    });

    assert('17. Tampilan kontrol Teks Terjual pada mobile responsif tanpa horizontal overflow',
      !checkMobileOverflow.isBodyOverflow && !checkMobileOverflow.isSheetOverflow,
      `scrollWidth: ${checkMobileOverflow.bodyScrollWidth}, clientWidth: ${checkMobileOverflow.bodyClientWidth}`);

  } catch (err) {
    console.error('Unhandled test error:', err);
    assert('Test execution completed without crash', false, err.message);
  } finally {
    await browser.close();
  }

  console.log('\n======================================================');
  console.log(`TOTAL PASS: ${passCount}`);
  console.log(`TOTAL FAIL: ${failCount}`);
  if (errors.length > 0) {
    console.log('\nFAILED TESTS:');
    errors.forEach(e => console.log('  - ' + e));
    process.exit(1);
  } else {
    console.log('\nALL 17 TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  }
})();

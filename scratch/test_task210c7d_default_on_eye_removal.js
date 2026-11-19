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
  console.log('=== TEST SUITE TASK 2.10C-7D: DEFAULT ON LABEL KHUSUS & PEMBERSIHAN KONTROL IKON MATA ===\n');

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

    // =========================================================================
    // A. DEFAULT LABEL KHUSUS (PRODUK BARU)
    // =========================================================================
    console.log('--- A. DEFAULT LABEL KHUSUS (PRODUK BARU) ---');

    // 1. Produk baru dibuka, default jenis/model belum dipilih -> Label Khusus belum aktif/belum dipaksa true (card_variant === '')
    const check1 = await page.evaluate(() => {
      const state = ProductForm.getPrimaryState();
      return {
        card_variant: state.card_variant,
        custom_labels_manually_toggled: state.custom_labels_manually_toggled,
        has_custom_labels: state.has_custom_labels
      };
    });
    assert('1. Produk baru dibuka, card_variant masih kosong & custom_labels_manually_toggled false',
      check1.card_variant === '' && check1.custom_labels_manually_toggled === false && check1.has_custom_labels !== true);

    // Siapkan tipe produk fisik
    await page.evaluate(() => {
      const radType = document.querySelector('input[name="product_type_radio"][value="physical"]');
      if (radType) { radType.checked = true; radType.dispatchEvent(new Event('change')); }
      const state = ProductForm.getPrimaryState();
      state.name = 'Kemeja Batik Premium';
      state.images = [{ id: 'img-1', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', is_primary: true }];
      state.image_url = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff';
      const nameInp = document.getElementById('input-prod-name');
      if (nameInp) nameInp.value = state.name;
    });
    await page.waitForTimeout(300);

    // 2 & 3. Seller memilih Model A -> toggle otomatis ON (checked) & container input terlihat
    await page.evaluate(() => {
      const radCard = document.querySelector('input[name="card_variant_radio"][value="A"]');
      if (radCard) { radCard.checked = true; radCard.dispatchEvent(new Event('change')); }
    });
    await page.waitForTimeout(300);

    const checkModelA = await page.evaluate(() => {
      const toggle = document.getElementById('toggle-enable-custom-labels');
      const container = document.getElementById('container-custom-labels-inputs');
      const state = ProductForm.getPrimaryState();
      return {
        checked: toggle ? toggle.checked : false,
        containerHidden: container ? container.classList.contains('hidden') : true,
        has_custom_labels: state.has_custom_labels,
        show_badge: state.show_badge
      };
    });
    assert('2. Seller memilih Model A -> #toggle-enable-custom-labels otomatis ON (checked)', checkModelA.checked === true);
    assert('3. Seller memilih Model A -> container input label (#container-custom-labels-inputs) terlihat', !checkModelA.containerHidden);

    // 4 & 5. Seller memilih Model C -> toggle otomatis ON (checked) & container input terlihat
    await page.evaluate(() => {
      ProductForm.resetDraft();
      const radType = document.querySelector('input[name="product_type_radio"][value="physical"]');
      if (radType) { radType.checked = true; radType.dispatchEvent(new Event('change')); }
      const radCard = document.querySelector('input[name="card_variant_radio"][value="C"]');
      if (radCard) { radCard.checked = true; radCard.dispatchEvent(new Event('change')); }
    });
    await page.waitForTimeout(300);

    const checkModelC = await page.evaluate(() => {
      const toggle = document.getElementById('toggle-enable-custom-labels');
      const container = document.getElementById('container-custom-labels-inputs');
      return {
        checked: toggle ? toggle.checked : false,
        containerHidden: container ? container.classList.contains('hidden') : true
      };
    });
    assert('4. Seller memilih Model C -> #toggle-enable-custom-labels otomatis ON (checked)', checkModelC.checked === true);
    assert('5. Seller memilih Model C -> container input label terlihat', !checkModelC.containerHidden);

    // 6 & 7. Seller memilih Model B -> toggle OFF (unchecked), container tersembunyi, pesan Model B tampil
    await page.evaluate(() => {
      ProductForm.resetDraft();
      const radType = document.querySelector('input[name="product_type_radio"][value="physical"]');
      if (radType) { radType.checked = true; radType.dispatchEvent(new Event('change')); }
      const radCard = document.querySelector('input[name="card_variant_radio"][value="B"]');
      if (radCard) { radCard.checked = true; radCard.dispatchEvent(new Event('change')); }
    });
    await page.waitForTimeout(300);

    const checkModelB = await page.evaluate(() => {
      const toggle = document.getElementById('toggle-enable-custom-labels');
      const container = document.getElementById('container-custom-labels-inputs');
      const notice = document.getElementById('label-custom-model-b-notice');
      const state = ProductForm.getPrimaryState();
      return {
        checked: toggle ? toggle.checked : false,
        containerHidden: container ? container.classList.contains('hidden') : false,
        noticeVisible: notice ? !notice.classList.contains('hidden') : false,
        has_custom_labels: state.has_custom_labels,
        show_badge: state.show_badge
      };
    });
    assert('6. Seller memilih Model B -> #toggle-enable-custom-labels OFF (unchecked)', checkModelB.checked === false);
    assert('7. Seller memilih Model B -> container tersembunyi & pesan Model B tampil', checkModelB.containerHidden && checkModelB.noticeVisible);

    // =========================================================================
    // B. INTERAKSI MANUAL SELLER
    // =========================================================================
    console.log('\n--- B. INTERAKSI MANUAL SELLER ---');

    // 8. Pada Model A, seller mematikan toggle Label Khusus secara manual (menjadi OFF) -> beralih ke Model C -> toggle tetap OFF
    await page.evaluate(() => {
      ProductForm.resetDraft();
      const radType = document.querySelector('input[name="product_type_radio"][value="physical"]');
      if (radType) { radType.checked = true; radType.dispatchEvent(new Event('change')); }
      const radCardA = document.querySelector('input[name="card_variant_radio"][value="A"]');
      if (radCardA) { radCardA.checked = true; radCardA.dispatchEvent(new Event('change')); }
    });
    await page.waitForTimeout(300);

    // Matikan secara manual
    await page.evaluate(() => {
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle) {
        toggle.checked = false;
        toggle.dispatchEvent(new Event('change'));
      }
    });
    await page.waitForTimeout(200);

    // Beralih ke Model C
    await page.evaluate(() => {
      const radCardC = document.querySelector('input[name="card_variant_radio"][value="C"]');
      if (radCardC) { radCardC.checked = true; radCardC.dispatchEvent(new Event('change')); }
    });
    await page.waitForTimeout(300);

    const check8 = await page.evaluate(() => {
      const toggle = document.getElementById('toggle-enable-custom-labels');
      const state = ProductForm.getPrimaryState();
      return {
        toggleChecked: toggle ? toggle.checked : false,
        manuallyToggled: state.custom_labels_manually_toggled,
        has_custom_labels: state.has_custom_labels
      };
    });
    assert('8. Seller matikan manual di Model A -> beralih ke Model C -> toggle tetap OFF (pilihan seller dihormati)',
      check8.toggleChecked === false && check8.manuallyToggled === true && check8.has_custom_labels === false);

    // 9. Pada Model A, seller mematikan toggle, lalu menyalakannya kembali secara manual (ON) -> beralih ke Model C -> toggle TETAP ON
    await page.evaluate(() => {
      const radCardA = document.querySelector('input[name="card_variant_radio"][value="A"]');
      if (radCardA) { radCardA.checked = true; radCardA.dispatchEvent(new Event('change')); }
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle) {
        toggle.checked = true;
        toggle.dispatchEvent(new Event('change'));
      }
      const radCardC = document.querySelector('input[name="card_variant_radio"][value="C"]');
      if (radCardC) { radCardC.checked = true; radCardC.dispatchEvent(new Event('change')); }
    });
    await page.waitForTimeout(300);

    const check9 = await page.evaluate(() => {
      const toggle = document.getElementById('toggle-enable-custom-labels');
      const state = ProductForm.getPrimaryState();
      return {
        toggleChecked: toggle ? toggle.checked : false,
        manuallyToggled: state.custom_labels_manually_toggled,
        has_custom_labels: state.has_custom_labels
      };
    });
    assert('9. Seller nyalakan manual di Model A -> beralih ke Model C -> toggle TETAP ON',
      check9.toggleChecked === true && check9.manuallyToggled === true && check9.has_custom_labels === true);

    // 10. Dari Model B (di mana Label Khusus nonaktif), seller beralih ke Model A tanpa pernah mematikan manual sebelumnya -> toggle Model A otomatis ON
    await page.evaluate(() => {
      ProductForm.resetDraft();
      const radType = document.querySelector('input[name="product_type_radio"][value="physical"]');
      if (radType) { radType.checked = true; radType.dispatchEvent(new Event('change')); }
      const radCardB = document.querySelector('input[name="card_variant_radio"][value="B"]');
      if (radCardB) { radCardB.checked = true; radCardB.dispatchEvent(new Event('change')); }
    });
    await page.waitForTimeout(300);

    // Beralih ke Model A
    await page.evaluate(() => {
      const radCardA = document.querySelector('input[name="card_variant_radio"][value="A"]');
      if (radCardA) { radCardA.checked = true; radCardA.dispatchEvent(new Event('change')); }
    });
    await page.waitForTimeout(300);

    const check10 = await page.evaluate(() => {
      const toggle = document.getElementById('toggle-enable-custom-labels');
      const state = ProductForm.getPrimaryState();
      return {
        toggleChecked: toggle ? toggle.checked : false,
        manuallyToggled: state.custom_labels_manually_toggled
      };
    });
    assert('10. Dari Model B ke Model A tanpa mematikan manual -> Model A otomatis ON',
      check10.toggleChecked === true && check10.manuallyToggled === false,
      JSON.stringify(check10));

    // 11. Seller mengisi teks label di Model A ("Promo Spesial"), pindah ke Model B, lalu kembali ke Model A -> teks tetap ada
    await page.evaluate(() => {
      const inp1 = document.getElementById('input-custom-label-1');
      if (inp1) {
        inp1.value = 'Promo Spesial';
        inp1.dispatchEvent(new Event('input'));
      }
      // Pindah ke Model B
      const radCardB = document.querySelector('input[name="card_variant_radio"][value="B"]');
      if (radCardB) { radCardB.checked = true; radCardB.dispatchEvent(new Event('change')); }
    });
    await page.waitForTimeout(300);

    // Pindah kembali ke Model A
    await page.evaluate(() => {
      const radCardA = document.querySelector('input[name="card_variant_radio"][value="A"]');
      if (radCardA) { radCardA.checked = true; radCardA.dispatchEvent(new Event('change')); }
    });
    await page.waitForTimeout(300);

    const check11 = await page.evaluate(() => {
      const inp1 = document.getElementById('input-custom-label-1');
      const state = ProductForm.getPrimaryState();
      return {
        inputValue: inp1 ? inp1.value : '',
        stateLabels: state.custom_labels
      };
    });
    assert('11. Seller isi teks label di Model A, ke Model B, lalu balik ke Model A -> teks "Promo Spesial" tetap ada',
      check11.inputValue === 'Promo Spesial' && Array.isArray(check11.stateLabels) && check11.stateLabels.includes('Promo Spesial'));

    // =========================================================================
    // C. KOMPATIBILITAS PRODUK LAMA
    // =========================================================================
    console.log('\n--- C. KOMPATIBILITAS PRODUK LAMA ---');

    // 12. Edit produk lama dengan has_custom_labels: false -> toggle Label Khusus Step 1 tetap OFF
    await page.evaluate(() => {
      ProductForm.resetDraft();
      const legacyProd = {
        id: 'prod-legacy-1',
        name: 'Produk Tanpa Label',
        product_type: 'physical',
        card_variant: 'A',
        has_custom_labels: false,
        show_badge: false,
        custom_labels: [],
        card_config: { show_badge: false }
      };
      ProductForm.loadProductForEdit(legacyProd);
    });
    await page.waitForTimeout(300);

    const check12 = await page.evaluate(() => {
      const toggle = document.getElementById('toggle-enable-custom-labels');
      const state = ProductForm.getPrimaryState();
      return {
        checked: toggle ? toggle.checked : false,
        has_custom_labels: state.has_custom_labels,
        manually_toggled: state.custom_labels_manually_toggled
      };
    });
    assert('12. Edit produk lama dengan has_custom_labels: false -> toggle Step 1 tetap OFF',
      check12.checked === false && check12.has_custom_labels === false && check12.manually_toggled === true);

    // 13. Edit produk lama dengan label aktif (custom_labels: ['Best Seller']) -> toggle ON, container terbuka, nilai terisi
    await page.evaluate(() => {
      ProductForm.resetDraft();
      const legacyProd2 = {
        id: 'prod-legacy-2',
        name: 'Produk Berlabel Best Seller',
        product_type: 'physical',
        card_variant: 'A',
        custom_labels: ['Best Seller'],
        card_config: { show_badge: true, badge_style: 'bg' }
      };
      ProductForm.loadProductForEdit(legacyProd2);
    });
    await page.waitForTimeout(300);

    const check13 = await page.evaluate(() => {
      const toggle = document.getElementById('toggle-enable-custom-labels');
      const container = document.getElementById('container-custom-labels-inputs');
      const inp1 = document.getElementById('input-custom-label-1');
      const state = ProductForm.getPrimaryState();
      return {
        checked: toggle ? toggle.checked : false,
        containerHidden: container ? container.classList.contains('hidden') : true,
        val1: inp1 ? inp1.value : '',
        has_custom_labels: state.has_custom_labels
      };
    });
    assert('13. Edit produk lama dengan custom_labels: ["Best Seller"] -> toggle ON, container terbuka, nilai terisi',
      check13.checked === true && !check13.containerHidden && check13.val1 === 'Best Seller' && check13.has_custom_labels === true);

    // 14. Edit produk lama tanpa properti baru tapi memiliki warna/radius badge -> styling tetap terisi
    await page.evaluate(() => {
      ProductForm.resetDraft();
      const legacyProd3 = {
        id: 'prod-legacy-3',
        name: 'Produk Custom Styling Badge',
        product_type: 'physical',
        card_variant: 'A',
        custom_labels: ['Siap Kirim'],
        card_config: {
          show_badge: true,
          badge_style: 'border',
          badge_radius: '12',
          badge_bg_color: '#ff5722',
          badge_text_color: '#ffffff'
        }
      };
      ProductForm.loadProductForEdit(legacyProd3);
    });
    await page.waitForTimeout(300);

    const check14 = await page.evaluate(() => {
      const state = ProductForm.getPrimaryState();
      const cfg = state.card_config || {};
      const radiusDesk = document.getElementById('cfg-badge-radius');
      const styleDesk = document.getElementById('cfg-badge-style');
      return {
        badge_style: cfg.badge_style,
        badge_radius: cfg.badge_radius,
        badge_bg_color: cfg.badge_bg_color,
        badge_text_color: cfg.badge_text_color,
        radiusDeskVal: radiusDesk ? radiusDesk.value : '',
        styleDeskVal: styleDesk ? styleDesk.value : ''
      };
    });
    assert('14. Edit produk lama dengan custom badge styling -> styling tersimpan dan terisi di kontrol',
      check14.badge_style === 'border' && check14.badge_radius === '12' &&
      check14.badge_bg_color === '#ff5722' && check14.radiusDeskVal === '12' && check14.styleDeskVal === 'border');

    // 15. Simpan draf atau simpan produk lama -> data tidak rusak / tersimpan dengan benar
    const check15 = await page.evaluate(() => {
      const payload = ProductForm.getPrimaryState();
      return {
        id: payload.id,
        has_custom_labels: payload.has_custom_labels,
        show_badge: payload.show_badge,
        custom_labels: payload.custom_labels,
        custom_labels_manually_toggled: payload.custom_labels_manually_toggled
      };
    });
    assert('15. Simpan draf atau simpan produk lama -> payload data valid dan konsisten',
      check15.has_custom_labels === true && check15.show_badge === true &&
      Array.isArray(check15.custom_labels) && check15.custom_labels[0] === 'Siap Kirim' && check15.custom_labels_manually_toggled === true);

    // =========================================================================
    // D. PEMBERSIHAN KONTROL DUPLIKAT (TAB DESAIN KARTU)
    // =========================================================================
    console.log('\n--- D. PEMBERSIHAN KONTROL DUPLIKAT (TAB DESAIN KARTU) ---');

    const checkD = await page.evaluate(() => {
      const badgeDesk = document.getElementById('cfg-show-badge');
      const badgeMob = document.getElementById('cfg-show-badge-mob');
      const strikeDesk = document.getElementById('cfg-show-strike');
      const strikeMob = document.getElementById('cfg-show-strike-mob');
      const badgeBlokA = document.getElementById('cfg-show-badge-blok-a');

      // Periksa header Label Khusus & Harga Coret
      const badgeHeaders = Array.from(document.querySelectorAll('span')).filter(s => s.textContent.trim() === 'Label Khusus');
      const strikeHeaders = Array.from(document.querySelectorAll('span')).filter(s => s.textContent.trim() === 'Harga Coret');

      // Pastikan tidak ada tombol mata (eye toggle) di dalam header parent
      const countEyeIcons = (elements) => {
        let count = 0;
        elements.forEach(el => {
          const parent = el.closest('div');
          if (parent && parent.querySelector('input[type="checkbox"], button.eye-toggle, i.bi-eye, i.bi-eye-slash')) {
            count++;
          }
        });
        return count;
      };

      return {
        hasBadgeDesk: !!badgeDesk,
        hasBadgeMob: !!badgeMob,
        hasStrikeDesk: !!strikeDesk,
        hasStrikeMob: !!strikeMob,
        hasBadgeBlokA: !!badgeBlokA,
        badgeEyeCount: countEyeIcons(badgeHeaders),
        strikeEyeCount: countEyeIcons(strikeHeaders)
      };
    });

    assert('16. #cfg-show-badge dan #cfg-show-badge-mob TIDAK ada di DOM', !checkD.hasBadgeDesk && !checkD.hasBadgeMob);
    assert('17. #cfg-show-strike dan #cfg-show-strike-mob TIDAK ada di DOM', !checkD.hasStrikeDesk && !checkD.hasStrikeMob);
    assert('18. Header Label Khusus di Tab Desain tidak memiliki toggle sakelar atau tombol mata', checkD.badgeEyeCount === 0);
    assert('19. Header Harga Coret di Tab Desain tidak memiliki toggle sakelar atau tombol mata', checkD.strikeEyeCount === 0);

    // =========================================================================
    // E. PERILAKU HARGA CORET
    // =========================================================================
    console.log('\n--- E. PERILAKU HARGA CORET ---');

    // 20. Produk dengan harga diskon/promo aktif -> Harga Coret tampil di preview
    await page.evaluate(() => {
      ProductForm.resetDraft();
      const radType = document.querySelector('input[name="product_type_radio"][value="physical"]');
      if (radType) { radType.checked = true; radType.dispatchEvent(new Event('change')); }
      const radCardA = document.querySelector('input[name="card_variant_radio"][value="A"]');
      if (radCardA) { radCardA.checked = true; radCardA.dispatchEvent(new Event('change')); }

      const state = ProductForm.getPrimaryState();
      state.name = 'Kemeja Diskon';
      state.price = 150000;
      state.auto_monthly_promo = true;
      state.monthly_discount_type = 'nominal';
      state.monthly_discount_value = 30000;
      const toggleMonthly = document.getElementById('toggle-promo-monthly');
      if (toggleMonthly) {
        toggleMonthly.checked = true;
        toggleMonthly.dispatchEvent(new Event('change'));
      }
      ProductForm.updateProductCardLivePreview();
    });
    await page.waitForTimeout(300);

    const check20 = await page.evaluate(() => {
      const box = document.getElementById('product-card-preview-container') || document.getElementById('card-live-preview-box');
      const text = box ? box.innerText : '';
      return {
        hasStrikeText: text.includes('150.000'),
        hasFinalPrice: text.includes('120.000')
      };
    });
    assert('20. Produk dengan diskon aktif -> Harga Coret (150.000) tampil di preview', check20.hasStrikeText && check20.hasFinalPrice);

    // 21. Produk tanpa diskon -> Harga Coret tidak tampil di preview
    await page.evaluate(() => {
      const state = ProductForm.getPrimaryState();
      state.auto_monthly_promo = false;
      state.has_daily_promo = false;
      const toggleMonthly = document.getElementById('toggle-promo-monthly');
      if (toggleMonthly) {
        toggleMonthly.checked = false;
        toggleMonthly.dispatchEvent(new Event('change'));
      }
      if (typeof toggleSimulateDiscount === 'function') {
        toggleSimulateDiscount(false);
      }
      ProductForm.updateProductCardLivePreview();
    });
    await page.waitForTimeout(300);

    const check21 = await page.evaluate(() => {
      const box = document.getElementById('product-card-preview-container') || document.getElementById('card-live-preview-box');
      const text = box ? box.innerText : '';
      return {
        hasOldStrike: text.includes('150.000') && text.includes('120.000')
      };
    });
    assert('21. Produk tanpa diskon -> Harga Coret tidak tampil di preview', !check21.hasOldStrike);

    // 22. Seller mengaktifkan simulasi diskon di Tab Desain -> Harga Coret simulasi tampil di preview
    await page.evaluate(() => {
      if (typeof toggleSimulateDiscount === 'function') {
        toggleSimulateDiscount(true);
      }
    });
    await page.waitForTimeout(300);

    const check22 = await page.evaluate(() => {
      const simToggle = document.getElementById('cfg-simulate-countdown-preview');
      const box = document.getElementById('product-card-preview-container') || document.getElementById('card-live-preview-box');
      const html = box ? box.innerHTML : '';
      return {
        simActive: simToggle ? simToggle.checked : false,
        hasLineThrough: html.includes('line-through')
      };
    });
    assert('22. Simulasi diskon aktif -> Harga Coret simulasi tampil di preview (line-through)', check22.hasLineThrough);

    // Matikan simulasi
    await page.evaluate(() => {
      if (typeof toggleSimulateDiscount === 'function') {
        toggleSimulateDiscount(false);
      }
    });
    await page.waitForTimeout(200);

    // 23. Produk lama dengan data show_strikethrough_price: false ketika diedit dan memiliki promo -> Harga Coret tetap tampil
    await page.evaluate(() => {
      ProductForm.resetDraft();
      const legacyProdWithPromo = {
        id: 'prod-legacy-promo',
        name: 'Produk Promo Lama',
        product_type: 'physical',
        card_variant: 'A',
        price: 200000,
        auto_monthly_promo: true,
        monthly_discount_type: 'percent',
        monthly_discount_value: 20,
        card_config: {
          show_strikethrough_price: false // Legacy false flag
        }
      };
      ProductForm.loadProductForEdit(legacyProdWithPromo);
      const toggleMonthly = document.getElementById('toggle-promo-monthly');
      if (toggleMonthly) {
        toggleMonthly.checked = true;
        toggleMonthly.dispatchEvent(new Event('change'));
      }
      ProductForm.updateProductCardLivePreview();
    });
    await page.waitForTimeout(300);

    const check23 = await page.evaluate(() => {
      const box = document.getElementById('product-card-preview-container') || document.getElementById('card-live-preview-box');
      const text = box ? box.innerText : '';
      return {
        hasStrike200: text.includes('200.000'),
        hasFinal160: text.includes('160.000')
      };
    });
    assert('23. Produk lama dengan show_strikethrough_price: false yang punya promo -> Harga Coret tetap tampil',
      check23.hasStrike200 && check23.hasFinal160);

    // 24. Kontrol styling harga coret (#cfg-strike-panel-desk) tetap dapat digunakan untuk mengubah warna harga coret
    const check24 = await page.evaluate(() => {
      const panelDesk = document.getElementById('cfg-strike-panel-desk');
      const colorInput = document.getElementById('cfg-strike-color');
      const isVisible = panelDesk ? !panelDesk.classList.contains('hidden') : false;
      if (colorInput) {
        colorInput.value = '#e11d48';
        colorInput.dispatchEvent(new Event('input'));
      }
      return {
        panelVisible: isVisible,
        colorVal: colorInput ? colorInput.value : ''
      };
    });
    assert('24. Kontrol styling harga coret (#cfg-strike-panel-desk) tetap tersedia dan dapat diubah',
      check24.panelVisible && check24.colorVal === '#e11d48');

    // =========================================================================
    // F. SINKRONISASI ANTAR-KOMPONEN
    // =========================================================================
    console.log('\n--- F. SINKRONISASI ANTAR-KOMPONEN ---');

    // 25. Mengaktifkan/menonaktifkan toggle Label Khusus di Step 1 langsung memperbarui live preview kartu dan panel styling di Tab Desain (#cfg-badge-panel-desk)
    await page.evaluate(() => {
      ProductForm.resetDraft();
      const radType = document.querySelector('input[name="product_type_radio"][value="physical"]');
      if (radType) { radType.checked = true; radType.dispatchEvent(new Event('change')); }
      const radCardA = document.querySelector('input[name="card_variant_radio"][value="A"]');
      if (radCardA) { radCardA.checked = true; radCardA.dispatchEvent(new Event('change')); }
      
      const inp1 = document.getElementById('input-custom-label-1');
      if (inp1) { inp1.value = 'Hot Deal'; inp1.dispatchEvent(new Event('input')); }
    });
    await page.waitForTimeout(300);

    const check25_on = await page.evaluate(() => {
      const panelDesk = document.getElementById('cfg-badge-panel-desk');
      const box = document.getElementById('product-card-preview-container') || document.getElementById('card-live-preview-box');
      return {
        panelVisible: panelDesk ? !panelDesk.classList.contains('hidden') : false,
        cardHasHotDeal: box ? box.innerText.includes('Hot Deal') : false
      };
    });

    // Sekarang toggle OFF
    await page.evaluate(() => {
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle) {
        toggle.checked = false;
        toggle.dispatchEvent(new Event('change'));
      }
    });
    await page.waitForTimeout(300);

    const check25_off = await page.evaluate(() => {
      const panelDesk = document.getElementById('cfg-badge-panel-desk');
      const box = document.getElementById('product-card-preview-container') || document.getElementById('card-live-preview-box');
      return {
        panelHidden: panelDesk ? panelDesk.classList.contains('hidden') : true,
        cardHasHotDeal: box ? box.innerText.includes('Hot Deal') : false
      };
    });

    assert('25. Toggle Step 1 ON/OFF langsung sinkron ke visibilitas styling panel dan live preview',
      check25_on.panelVisible && check25_on.cardHasHotDeal && check25_off.panelHidden && !check25_off.cardHasHotDeal,
      JSON.stringify({ on: check25_on, off: check25_off }));

    // 26. Mengubah warna badge di Tab Desain Desktop otomatis tersinkronisasi ke Mobile Drawer (dan sebaliknya)
    // Nyalakan kembali toggle
    await page.evaluate(() => {
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle) {
        toggle.checked = true;
        toggle.dispatchEvent(new Event('change'));
      }
      const bgDesk = document.getElementById('cfg-badge-bg-color');
      if (bgDesk) {
        bgDesk.value = '#10b981';
        bgDesk.dispatchEvent(new Event('input'));
      }
    });
    await page.waitForTimeout(200);

    const check26 = await page.evaluate(() => {
      const bgMob = document.getElementById('cfg-badge-bg-color-mob');
      const hexDesk = document.getElementById('cfg-badge-bg-hex');
      const hexMob = document.getElementById('cfg-badge-bg-hex-mob');
      return {
        bgMobVal: bgMob ? bgMob.value : '',
        hexDeskVal: hexDesk ? hexDesk.value : '',
        hexMobVal: hexMob ? hexMob.value : ''
      };
    });
    assert('26. Perubahan warna badge di Desktop otomatis tersinkronisasi ke Mobile Drawer (#10b981)',
      check26.bgMobVal === '#10b981' && check26.hexDeskVal.toLowerCase() === '#10b981' && check26.hexMobVal.toLowerCase() === '#10b981');

    console.log('\n======================================================');
    console.log(`TOTAL PASS: ${passCount} / ${passCount + failCount}`);
    console.log(`TOTAL FAIL: ${failCount} / ${passCount + failCount}`);
    console.log('======================================================');

    if (failCount > 0) {
      console.error('\nFAILURES:');
      errors.forEach(e => console.error(' - ' + e));
      process.exit(1);
    } else {
      console.log('\nALL 26 TESTS PASSED SUCCESSFULLY!');
      process.exit(0);
    }

  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

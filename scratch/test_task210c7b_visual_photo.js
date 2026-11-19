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
  console.log('=== TEST SUITE TASK 2.10C-7B: VISUAL FOOTER, RESPONSIF MOBILE, BRAND COLOR & HIGHLIGHT FOTO ===\n');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const fileUrl = 'file:///' + path.resolve(__dirname, '../admin.html').replace(/\\/g, '/');

  try {
    // =========================================================================
    // SEKSI 1: HEADER FOOTER & BRAND COLOR (DESKTOP 1280x800)
    // =========================================================================
    console.log('--- SEKSI 1: HEADER FOOTER KARTU & BRAND COLOR ---');
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

    // Aktifkan Jenis Fisik & Model C agar Footer Kartu muncul
    await page.evaluate(() => {
      const radType = document.querySelector('input[name="product_type_radio"][value="physical"]');
      if (radType) { radType.checked = true; radType.dispatchEvent(new Event('change')); }
      const radCard = document.querySelector('input[name="card_variant_radio"][value="C"]');
      if (radCard) { radCard.checked = true; radCard.dispatchEvent(new Event('change')); }
    });
    await page.waitForTimeout(300);

    // 1. Header Footer Kartu Check
    console.log('\n[1. Header Footer Kartu]');
    const headerCheck = await page.evaluate(() => {
      const footerSec = document.getElementById('section-step1-input7-footers');
      const headerLabel = footerSec ? footerSec.querySelector('label') : null;
      const text = headerLabel ? headerLabel.textContent.trim() : '';
      const hasLayersIcon = headerLabel ? Boolean(headerLabel.querySelector('.bi-layers, .bi-card-text')) : false;
      const hasDetailBadge = headerLabel ? Boolean(headerLabel.querySelector('span:not(:empty)')) : false;
      
      // Ikon seller pada Footer 1 & 2
      const iconF1Btn = document.getElementById('btn-footer-icon-picker-side');
      const iconF1Preview = document.getElementById('preview-footer-icon-side');
      const hasF1Icon = iconF1Preview ? Boolean(iconF1Preview.querySelector('svg, i')) : false;

      return {
        text,
        hasLayersIcon,
        hasDetailBadge,
        hasF1Btn: Boolean(iconF1Btn),
        hasF1Icon
      };
    });

    assert('1.1 Header judul Footer Kartu tepat "Footer Kartu"', headerCheck.text === 'Footer Kartu', `Actual text: "${headerCheck.text}"`);
    assert('1.2 Ikon dekoratif bi-layers / bi-card-text tidak ada pada header', headerCheck.hasLayersIcon === false);
    assert('1.3 Badge "Detail" tidak ada pada header', headerCheck.hasDetailBadge === false);
    assert('1.4 Ikon footer seller (Footer 1) tetap ada dan berfungsi', headerCheck.hasF1Btn && headerCheck.hasF1Icon);

    // 2. Brand Color untuk Hint Text
    console.log('\n[2. Teks Petunjuk Brand Color]');
    const brandColorCheck = await page.evaluate(() => {
      const hint = document.getElementById('card2-design-tab-hint');
      const text = hint ? hint.textContent.trim() : '';
      const inlineStyle = hint ? hint.getAttribute('style') : '';
      const computedColor = hint ? getComputedStyle(hint).color : '';
      
      // Ambil var(--color-primary) dari :root
      const rootColorPrimary = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();

      // Uji perubahan tema dinamis
      document.documentElement.style.setProperty('--color-primary', '#9333ea');
      const updatedColor = getComputedStyle(hint).color;
      // Kembalikan ke semula
      document.documentElement.style.setProperty('--color-primary', rootColorPrimary);

      return {
        text,
        inlineStyle,
        hasVarPrimary: inlineStyle.includes('var(--color-primary)'),
        computedColor,
        dynamicThemeWorked: updatedColor === 'rgb(147, 51, 234)', // #9333ea in rgb
        rootColorPrimary
      };
    });

    assert('2.1 Teks petunjuk tidak berubah kalimatnya', brandColorCheck.text === 'Buka Tab Desain Kartu pada Preview Kartu Produk, Untuk Mengubah Gaya/Desain Kartu Produk.');
    assert('2.2 Teks petunjuk menggunakan var(--color-primary)', brandColorCheck.hasVarPrimary);
    assert('2.3 Teks petunjuk dinamis mengikuti perubahan tema brand toko', brandColorCheck.dynamicThemeWorked);

    // =========================================================================
    // SEKSI 2: KONTROL FOOTER PADA MOBILE (375px, 390px, 412px)
    // =========================================================================
    console.log('\n--- SEKSI 2: KONTROL FOOTER PADA MOBILE ---');

    // Aktifkan Footer 2 juga agar kedua footer dapat diuji
    await page.evaluate(() => {
      const inpF1 = document.getElementById('input-card-footer-text-side');
      if (inpF1) {
        inpF1.value = 'Garansi Toko';
        inpF1.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const btnAddF2 = document.getElementById('btn-add-card-footer-2');
      if (btnAddF2) btnAddF2.click();
      const inpF2 = document.getElementById('input-card-footer-2-text-side');
      if (inpF2) {
        inpF2.value = 'Original 100%';
        inpF2.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(300);

    const mobileResolutions = [
      { name: '375px (iPhone SE/Mini)', width: 375, height: 812 },
      { name: '390px (iPhone 12/13/14)', width: 390, height: 844 },
      { name: '412px (Android Pixel/Galaxy)', width: 412, height: 915 }
    ];

    for (const res of mobileResolutions) {
      console.log(`\n[Pengujian Mobile ${res.name}]`);
      await page.setViewportSize({ width: res.width, height: res.height });
      await page.waitForTimeout(200);

      const resMetrics = await page.evaluate(() => {
        const btnF1Icon = document.getElementById('btn-footer-icon-picker-side');
        const colorF1Bg = document.getElementById('cfg-footer-bg-color-side');
        const hexF1Bg = document.getElementById('cfg-footer-bg-hex-side');
        const colorF1Text = document.getElementById('cfg-footer-text-color-side');
        const hexF1Text = document.getElementById('cfg-footer-text-hex-side');

        const btnF2Icon = document.getElementById('btn-footer-2-icon-picker-side');
        const colorF2Bg = document.getElementById('cfg-footer-2-bg-color-side');
        const hexF2Bg = document.getElementById('cfg-footer-2-bg-hex-side');
        const colorF2Text = document.getElementById('cfg-footer-2-text-color-side');
        const hexF2Text = document.getElementById('cfg-footer-2-text-hex-side');

        const card2 = document.getElementById('card-step1-card-info');
        const f1Grid = btnF1Icon ? btnF1Icon.closest('.grid') : null;
        const f2Grid = btnF2Icon ? btnF2Icon.closest('.grid') : null;

        const getH = (el) => el ? Math.round(el.getBoundingClientRect().height) : 0;
        const getW = (el) => el ? Math.round(el.getBoundingClientRect().width) : 0;
        const getBoxSizing = (el) => el ? getComputedStyle(el).boxSizing : '';

        // Cek horizontal overflow
        const isOverflow = (el) => el ? (el.scrollWidth > el.clientWidth + 1) : false;

        return {
          h_btnF1Icon: getH(btnF1Icon),
          h_colorF1Bg: getH(colorF1Bg),
          h_hexF1Bg: getH(hexF1Bg),
          h_colorF1Text: getH(colorF1Text),
          h_hexF1Text: getH(hexF1Text),

          h_btnF2Icon: getH(btnF2Icon),
          h_colorF2Bg: getH(colorF2Bg),
          h_hexF2Bg: getH(hexF2Bg),
          h_colorF2Text: getH(colorF2Text),
          h_hexF2Text: getH(hexF2Text),

          w_hexF1Bg: getW(hexF1Bg),
          w_hexF1Text: getW(hexF1Text),

          boxSizingHex: getBoxSizing(hexF1Bg),
          boxSizingSwatch: getBoxSizing(colorF1Bg),
          boxSizingBtn: getBoxSizing(btnF1Icon),

          overflowCard2: isOverflow(card2),
          overflowF1Grid: isOverflow(f1Grid),
          overflowF2Grid: isOverflow(f2Grid)
        };
      });

      assert(`${res.name}: Tinggi tombol ikon F1 tepat 28px`, resMetrics.h_btnF1Icon === 28, `Got ${resMetrics.h_btnF1Icon}px`);
      assert(`${res.name}: Tinggi swatch latar F1 tepat 28px`, resMetrics.h_colorF1Bg === 28, `Got ${resMetrics.h_colorF1Bg}px`);
      assert(`${res.name}: Tinggi input hex latar F1 tepat 28px`, resMetrics.h_hexF1Bg === 28, `Got ${resMetrics.h_hexF1Bg}px`);
      assert(`${res.name}: Tinggi swatch teks F1 tepat 28px`, resMetrics.h_colorF1Text === 28, `Got ${resMetrics.h_colorF1Text}px`);
      assert(`${res.name}: Tinggi input hex teks F1 tepat 28px`, resMetrics.h_hexF1Text === 28, `Got ${resMetrics.h_hexF1Text}px`);

      assert(`${res.name}: Tinggi tombol ikon F2 tepat 28px`, resMetrics.h_btnF2Icon === 28, `Got ${resMetrics.h_btnF2Icon}px`);
      assert(`${res.name}: Tinggi swatch latar F2 tepat 28px`, resMetrics.h_colorF2Bg === 28, `Got ${resMetrics.h_colorF2Bg}px`);
      assert(`${res.name}: Tinggi input hex latar F2 tepat 28px`, resMetrics.h_hexF2Bg === 28, `Got ${resMetrics.h_hexF2Bg}px`);
      assert(`${res.name}: Tinggi swatch teks F2 tepat 28px`, resMetrics.h_colorF2Text === 28, `Got ${resMetrics.h_colorF2Text}px`);
      assert(`${res.name}: Tinggi input hex teks F2 tepat 28px`, resMetrics.h_hexF2Text === 28, `Got ${resMetrics.h_hexF2Text}px`);

      assert(`${res.name}: box-sizing adalah border-box`, resMetrics.boxSizingHex === 'border-box' && resMetrics.boxSizingBtn === 'border-box');
      assert(`${res.name}: Lebar input HEX memadai untuk 7 karakter (> 50px)`, resMetrics.w_hexF1Bg >= 50 && resMetrics.w_hexF1Text >= 50, `Got bg: ${resMetrics.w_hexF1Bg}px, text: ${resMetrics.w_hexF1Text}px`);
      assert(`${res.name}: Tidak ada horizontal overflow pada Card 2`, resMetrics.overflowCard2 === false);
      assert(`${res.name}: Tidak ada horizontal overflow pada grid kontrol F1 & F2`, !resMetrics.overflowF1Grid && !resMetrics.overflowF2Grid);
    }

    // =========================================================================
    // SEKSI 3: PERBAIKAN HIGHLIGHT VALIDASI FOTO PRODUK
    // =========================================================================
    console.log('\n--- SEKSI 3: HIGHLIGHT VALIDASI FOTO PRODUK ---');

    // Kembalikan ke Desktop dan bersihkan foto untuk pengujian
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.evaluate(() => {
      // Bersihkan images di primaryState
      const state = (typeof ProductForm !== 'undefined' && ProductForm.getPrimaryState) ? ProductForm.getPrimaryState() : null;
      if (state) {
        state.images = [];
        state.image_url = '';
        state.name = 'Sepatu Olahraga Pria Original';
        state.custom_labels = ['Original'];
        const lInp = document.getElementById('input-custom-label-1');
        if (lInp) { lInp.value = 'Original'; lInp.dispatchEvent(new Event('input')); }
        const chkRating = document.getElementById('cfg-show-rating');
        if (chkRating) { chkRating.checked = false; chkRating.dispatchEvent(new Event('change')); }
        const chkSales = document.getElementById('cfg-show-sales');
        if (chkSales) { chkSales.checked = false; chkSales.dispatchEvent(new Event('change')); }
      }
      const nameInp = document.getElementById('input-prod-name');
      if (nameInp) {
        nameInp.value = 'Sepatu Olahraga Pria Original';
        nameInp.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(200);

    // 3.A Klik Lanjutkan saat foto kosong
    console.log('\n[3.A Validasi Foto Kosong - Klik Lanjutkan]');
    await page.evaluate(() => {
      const btnNext = document.getElementById('btn-step-1-next');
      if (btnNext) btnNext.click();
    });
    await page.waitForTimeout(400);

    const photoValCheck = await page.evaluate(() => {
      const uploadSlot = document.getElementById('btn-slot-add-photo');
      const photoSec = document.getElementById('section-step1-input4-photo');
      const galleryCont = document.getElementById('gallery-slots-container');
      const allRings = Array.from(document.querySelectorAll('.ring-amber-400'));

      return {
        slotHasRing: uploadSlot ? uploadSlot.classList.contains('ring-amber-400') : false,
        secHasRing: photoSec ? photoSec.classList.contains('ring-amber-400') : false,
        galleryContHasRing: galleryCont ? galleryCont.classList.contains('ring-amber-400') : false,
        totalRings: allRings.length,
        ringElementIds: allRings.map(el => el.id || el.tagName)
      };
    });

    assert('3.A.1 Kotak input upload foto (#btn-slot-add-photo) menerima ring-amber-400', photoValCheck.slotHasRing);
    assert('3.A.2 Seluruh section foto (#section-step1-input4-photo) TIDAK menerima ring-amber-400', photoValCheck.secHasRing === false);
    assert('3.A.3 Tidak ada highlight ganda (persis 1 elemen menerima ring highlight)', photoValCheck.totalRings === 1, `Total rings: ${photoValCheck.totalRings}, elements: ${photoValCheck.ringElementIds.join(', ')}`);

    // 3.B Uji pembersihan ring sebelumnya jika validasi dipicu ulang
    console.log('\n[3.B Pembersihan Ring Sebelumnya]');
    await page.evaluate(() => {
      // Panggil lagi klik Lanjutkan tanpa menunggu timeout
      const btnNext = document.getElementById('btn-step-1-next');
      if (btnNext) btnNext.click();
    });
    await page.waitForTimeout(200);

    const retriggerCheck = await page.evaluate(() => {
      const allRings = Array.from(document.querySelectorAll('.ring-amber-400'));
      return {
        totalRings: allRings.length,
        ringId: allRings[0] ? allRings[0].id : null
      };
    });

    assert('3.B.1 Saat re-trigger validasi, ring sebelumnya dibersihkan dan tetap hanya 1 ring', retriggerCheck.totalRings === 1 && retriggerCheck.ringId === 'btn-slot-add-photo');

    // 3.C Uji durasi highlight 3 detik
    console.log('\n[3.C Durasi Highlight 3 Detik]');
    await page.waitForTimeout(3200);
    const timeoutCheck = await page.evaluate(() => {
      const uploadSlot = document.getElementById('btn-slot-add-photo');
      const allRings = Array.from(document.querySelectorAll('.ring-amber-400'));
      return {
        slotHasRing: uploadSlot ? uploadSlot.classList.contains('ring-amber-400') : false,
        totalRings: allRings.length
      };
    });

    assert('3.C.1 Setelah 3 detik, ring highlight otomatis hilang', timeoutCheck.slotHasRing === false && timeoutCheck.totalRings === 0);

    // 3.D Uji foto valid (unggah foto berhasil)
    console.log('\n[3.D Validasi Berhasil Setelah Foto Ditambahkan]');
    await page.evaluate(() => {
      const state = (typeof ProductForm !== 'undefined' && ProductForm.getPrimaryState) ? ProductForm.getPrimaryState() : null;
      if (state) {
        state.images = [{ id: 'img-1', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', is_primary: true }];
        state.image_url = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff';
        state.name = 'Sepatu Olahraga Pria Original';
        state.custom_labels = ['Original'];
        const lInp = document.getElementById('input-custom-label-1');
        if (lInp) { lInp.value = 'Original'; lInp.dispatchEvent(new Event('input')); }
        const chkRating = document.getElementById('cfg-show-rating');
        if (chkRating) { chkRating.checked = false; chkRating.dispatchEvent(new Event('change')); }
        const chkSales = document.getElementById('cfg-show-sales');
        if (chkSales) { chkSales.checked = false; chkSales.dispatchEvent(new Event('change')); }
      }
      const btnNext = document.getElementById('btn-step-1-next');
      if (btnNext) btnNext.click();
    });
    await page.waitForTimeout(400);

    const step2Reached = await page.evaluate(() => {
      const curStep = (typeof ProductForm !== 'undefined' && ProductForm.getCurrentStep) ? ProductForm.getCurrentStep() : 0;
      const pane2 = document.getElementById('step-pane-2');
      return curStep === 2 || (pane2 && !pane2.classList.contains('hidden'));
    });

    assert('3.D.1 Dengan foto valid, seller berhasil lanjut ke Step 2 tanpa blokir foto', step2Reached);

    await page.close();
  } catch (err) {
    console.error('Test runner encountered an error:', err);
    errors.push(err.message);
  } finally {
    await browser.close();
  }

  console.log('\n=== REKAP HASIL PENGUJIAN TASK 2.10C-7B ===');
  console.log(`PASS: ${passCount}`);
  console.log(`FAIL: ${failCount}`);
  if (errors.length > 0) {
    console.log('\nDetail Error:');
    errors.forEach(e => console.log(' - ' + e));
    process.exit(1);
  } else {
    console.log('\nSemua pengujian Task 2.10C-7B berhasil!');
    process.exit(0);
  }
})();

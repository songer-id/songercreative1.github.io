const { test, expect } = require('@playwright/test');
const {
  TEST_TENANT,
  injectDeterministicStorage
} = require('./fixtures/test-data');

const DUMMY_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const VIEWPORTS = [
  { name: 'Desktop 1366x768', width: 1366, height: 768, isMobile: false },
  { name: 'Mobile 390x844 (iPhone 12/13/14)', width: 390, height: 844, isMobile: true }
];

for (const vp of VIEWPORTS) {
  test.describe(`TASK 2.10C-2 - Penyesuaian Default Outline dan Radius Kartu Produk Step 1 - Viewport: ${vp.name}`, () => {
    test.setTimeout(60000);
    test.use({ viewport: { width: vp.width, height: vp.height } });

    async function setupProductForm(page) {
      await injectDeterministicStorage(page, { authenticated: true });
      await page.goto('/admin.html');

      const loginScreen = page.locator('#admin-login-screen');
      if (await loginScreen.isVisible()) {
        await page.locator('#login-store-id').fill(TEST_TENANT.store_slug);
        await page.locator('#login-username').fill('admin');
        await page.locator('#login-password').fill('admin123');
        await page.locator('#btn-submit-login').click();
        await expect(loginScreen).toBeHidden();
      }

      await page.waitForSelector('#admin-main-viewport');

      // Pastikan sidebar admin mobile tidak menutupi area konten
      await page.evaluate(() => {
        const sb = document.getElementById('admin-main-sidebar');
        if (sb && window.innerWidth < 1024) {
          sb.classList.add('-translate-x-full');
          sb.style.pointerEvents = 'none';
          const bd = document.getElementById('sidebar-mobile-backdrop');
          if (bd) bd.classList.add('hidden');
        }
      });

      // Navigasi ke form tambah produk via AdminApp.navigate
      await page.evaluate(() => {
        AdminApp.navigate('create-product');
        const sb = document.getElementById('admin-main-sidebar');
        if (sb && window.innerWidth < 1024) {
          sb.classList.add('-translate-x-full');
          sb.style.pointerEvents = 'none';
          const bd = document.getElementById('sidebar-mobile-backdrop');
          if (bd) bd.classList.add('hidden');
        }
      });
      await expect(page.locator('#view-product-form')).toBeVisible();
      await expect(page.locator('#step-pane-1')).toBeVisible();

      // Isi field wajib Step 1
      await page.locator('label:has-text("Fisik")').first().click();
      await page.locator('label:has-text("Kartu Klasik")').first().click();
      await page.locator('#input-prod-image').setInputFiles({
        name: 'test-item.png',
        mimeType: 'image/png',
        buffer: DUMMY_PNG_BUFFER
      });
      await page.locator('#input-prod-name').fill('Produk Uji Coba Default Desain Kartu');
    }

    function getSuffix() {
      return vp.isMobile ? '-mob' : '';
    }

    // Helper untuk beralih ke tab Desain Kartu
    async function openCardDesignTab(page) {
      await page.evaluate((isMob) => {
        if (typeof ProductForm !== 'undefined') {
          ProductForm.setPreviewStep1Tab('design');
          if (isMob && typeof ProductForm.openMobilePreview === 'function') {
            ProductForm.openMobilePreview();
          }
          if (typeof ProductForm.updateProductCardLivePreview === 'function') {
            ProductForm.updateProductCardLivePreview();
          }
        }
      }, vp.isMobile);

      const section = vp.isMobile
        ? page.locator('#card-customization-section-mob')
        : page.locator('#card-customization-section');
      await expect(section).toBeVisible();
    }

    // Helper untuk memilih model kartu (A, B, C) dengan penanganan modal mobile
    async function selectCardModel(page, modelName, modelValue) {
      if (vp.isMobile) {
        await page.evaluate(() => {
          if (typeof ProductForm !== 'undefined' && ProductForm.closeMobilePreview) {
            ProductForm.closeMobilePreview();
          }
        });
        await page.waitForTimeout(150);
      }
      await page.locator(`label:has-text("${modelName}")`).first().click();
      await openCardDesignTab(page);
    }

    // Helper untuk membuka accordion Promo & Diskon
    async function openPromoAccordion(page) {
      const sfx = getSuffix();
      const body = page.locator(`#accordion-body-promo${sfx}`);
      if (await body.isHidden()) {
        await page.locator(`#btn-accordion-promo${sfx}`).click();
        await expect(body).toBeVisible();
      }
    }

    // Helper untuk membuka accordion Teks & Informasi
    async function openTextInfoAccordion(page) {
      const sfx = getSuffix();
      const body = page.locator(`#accordion-body-text-info${sfx}`);
      if (await body.isHidden()) {
        await page.locator(`#btn-accordion-text-info${sfx}`).click();
        await expect(body).toBeVisible();
      }
    }

    // Helper untuk mengambil preview container aktif
    function getPreviewScope(page) {
      return vp.isMobile
        ? page.locator('#mobile-card-preview-container')
        : page.locator('#card-live-preview-box');
    }

    // =========================================================================
    // Skenario 1, 2, 3: Default Outline Model A, B, C adalah Tanpa Garis (0px)
    // =========================================================================
    test('1, 2, 3. Default Outline Model A, B, dan C adalah Tanpa Garis (0px / border: none)', async ({ page }) => {
      await setupProductForm(page);
      const sfx = getSuffix();

      // Model A
      await selectCardModel(page, 'Kartu Klasik', 'A');
      const valA = await page.locator(`#cfg-border-width${sfx}`).inputValue();
      const lblA = await page.locator(`#lbl-border-width${sfx}`).innerText();
      expect(valA).toBe('0');
      expect(lblA.trim()).toBe('Tanpa Garis');

      const previewA = getPreviewScope(page);
      const cardElA = previewA.locator('> div').first();
      const styleA = await cardElA.getAttribute('style');
      expect(styleA).toContain('border: none; border-width: 0px;');

      // Model B
      await selectCardModel(page, 'Kartu Minimalis', 'B');
      const valB = await page.locator(`#cfg-border-width${sfx}`).inputValue();
      const lblB = await page.locator(`#lbl-border-width${sfx}`).innerText();
      expect(valB).toBe('0');
      expect(lblB.trim()).toBe('Tanpa Garis');

      const previewB = getPreviewScope(page);
      const cardElB = previewB.locator('> div').first();
      const styleB = await cardElB.getAttribute('style');
      expect(styleB).toContain('border: none; border-width: 0px;');

      // Model C
      await selectCardModel(page, 'Kartu Detail', 'C');
      const valC = await page.locator(`#cfg-border-width${sfx}`).inputValue();
      const lblC = await page.locator(`#lbl-border-width${sfx}`).innerText();
      expect(valC).toBe('0');
      expect(lblC.trim()).toBe('Tanpa Garis');

      const previewC = getPreviewScope(page);
      const cardElC = previewC.locator('> div').first();
      const styleC = await cardElC.getAttribute('style');
      expect(styleC).toContain('border: none; border-width: 0px;');
    });

    // =========================================================================
    // Skenario 4: Pilihan Saran Outline Tanpa Garis, Tipis, Sedang, Tebal (Tanpa satuan px)
    // =========================================================================
    test('4. Pilihan Saran Outline dropdown hanya memuat Tanpa Garis, Tipis, Sedang, Tebal (tanpa satuan px)', async ({ page }) => {
      await setupProductForm(page);
      await openCardDesignTab(page);
      const sfx = getSuffix();

      // Buka dropdown border width
      await page.locator(`#btn-border-width${sfx}`).click();
      const menu = page.locator(`#menu-border-width${sfx}`);
      await expect(menu).toBeVisible();

      const options = menu.locator('.card-preset-select-option');
      const count = await options.count();
      expect(count).toBe(4);

      const expectedLabels = ['Tanpa Garis', 'Tipis', 'Sedang', 'Tebal'];
      for (let i = 0; i < count; i++) {
        const text = (await options.nth(i).innerText()).trim();
        expect(text).toBe(expectedLabels[i]);
        expect(text).not.toContain('px');
        expect(text).not.toContain('0px');
        expect(text).not.toContain('1px');
        expect(text).not.toContain('2px');
        expect(text).not.toContain('3px');
      }

      // Tutup dropdown
      await page.keyboard.press('Escape');
    });

    // =========================================================================
    // Skenario 5, 6, 7: Pemilihan Tipis (1px), Sedang (2px), Tebal (3px)
    // =========================================================================
    test('5, 6, 7. Memilih saran Outline Tipis (1px), Sedang (2px), Tebal (3px) mengubah preview secara tepat', async ({ page }) => {
      await setupProductForm(page);
      await openCardDesignTab(page);
      const sfx = getSuffix();
      const preview = getPreviewScope(page);
      const cardEl = preview.locator('> div').first();

      // 5. Pilih Tipis (1px)
      await page.locator(`#btn-border-width${sfx}`).click();
      await page.locator(`#menu-border-width${sfx} .card-preset-select-option[data-value="1"]`).click();
      expect(await page.locator(`#cfg-border-width${sfx}`).inputValue()).toBe('1');
      expect((await page.locator(`#lbl-border-width${sfx}`).innerText()).trim()).toBe('Tipis');
      let style = await cardEl.getAttribute('style');
      expect(style).toContain('border: 1px solid');

      // 6. Pilih Sedang (2px)
      await page.locator(`#btn-border-width${sfx}`).click();
      await page.locator(`#menu-border-width${sfx} .card-preset-select-option[data-value="2"]`).click();
      expect(await page.locator(`#cfg-border-width${sfx}`).inputValue()).toBe('2');
      expect((await page.locator(`#lbl-border-width${sfx}`).innerText()).trim()).toBe('Sedang');
      style = await cardEl.getAttribute('style');
      expect(style).toContain('border: 2px solid');

      // 7. Pilih Tebal (3px)
      await page.locator(`#btn-border-width${sfx}`).click();
      await page.locator(`#menu-border-width${sfx} .card-preset-select-option[data-value="3"]`).click();
      expect(await page.locator(`#cfg-border-width${sfx}`).inputValue()).toBe('3');
      expect((await page.locator(`#lbl-border-width${sfx}`).innerText()).trim()).toBe('Tebal');
      style = await cardEl.getAttribute('style');
      expect(style).toContain('border: 3px solid');
    });

    // =========================================================================
    // Skenario 8, 9, 10: Default Radius Sudut (Diskon, Countdown, Label Khusus) adalah 4px
    // =========================================================================
    test('8, 9, 10. Default Radius Sudut Label Diskon, Countdown, dan Label Khusus adalah 4px', async ({ page }) => {
      await setupProductForm(page);
      await openCardDesignTab(page);
      const sfx = getSuffix();

      // Buka accordion Promo & Diskon
      await openPromoAccordion(page);

      // 8. Default Discount Badge Radius
      const discRadVal = await page.locator(`#cfg-discount-badge-radius${sfx}`).inputValue();
      const discRadLbl = (await page.locator(`#lbl-discount-badge-radius${sfx}`).innerText()).trim();
      expect(discRadVal).toBe('4');
      expect(discRadLbl).toBe('4 px');

      // 9. Default Countdown Radius
      const cdRadVal = await page.locator(`#cfg-countdown-radius${sfx}`).inputValue();
      const cdRadLbl = (await page.locator(`#lbl-countdown-radius${sfx}`).innerText()).trim();
      expect(cdRadVal).toBe('4');
      expect(cdRadLbl).toBe('4 px');

      // Buka accordion Teks & Informasi
      await openTextInfoAccordion(page);

      // 10. Default Special Label Radius
      const badgeRadVal = await page.locator(`#cfg-badge-radius${sfx}`).inputValue();
      const badgeRadLbl = (await page.locator(`#lbl-badge-radius${sfx}`).innerText()).trim();
      expect(badgeRadVal).toBe('4');
      expect(badgeRadLbl).toBe('4 px');

      // Aktifkan simulasi diskon untuk memunculkan badge diskon & countdown di preview
      await page.evaluate(() => {
        ProductForm.toggleSimulateDiscount(true);
      });

      const preview = getPreviewScope(page);

      // Verifikasi radius badge diskon di preview live
      const discBadge = preview.locator('span:has-text("Diskon 50%")').first();
      if (await discBadge.count() > 0) {
        const discStyle = await discBadge.getAttribute('style');
        expect(discStyle).toContain('border-radius: 4px');
      }

      // Verifikasi radius label khusus di preview live
      const customBadge = preview.locator('span:has-text("Label Khusus")').first();
      if (await customBadge.count() > 0) {
        const badgeStyle = await customBadge.getAttribute('style');
        expect(badgeStyle).toContain('border-radius: 4px');
      }

      // Verifikasi countdown di preview live
      const cdBadge = preview.locator('.bi-clock, [data-lucide="clock"]').first();
      if (await cdBadge.count() > 0) {
        const cdContainer = cdBadge.locator('..');
        const cdStyle = await cdContainer.getAttribute('style');
        if (cdStyle && cdStyle.includes('border-radius')) {
          expect(cdStyle).toContain('border-radius: 4px');
        }
      }
    });

    // =========================================================================
    // Skenario 11: Konsistensi Nilai Default saat Beralih Antar Model A, B, C
    // =========================================================================
    test('11. Konsistensi nilai default saat beralih antar Model A, B, dan C', async ({ page }) => {
      await setupProductForm(page);
      const sfx = getSuffix();

      const variants = [
        { label: 'Kartu Klasik', code: 'A' },
        { label: 'Kartu Minimalis', code: 'B' },
        { label: 'Kartu Detail', code: 'C' },
        { label: 'Kartu Klasik', code: 'A' }
      ];

      for (const v of variants) {
        await selectCardModel(page, v.label, v.code);
        await openPromoAccordion(page);
        await openTextInfoAccordion(page);

        expect(await page.locator(`#cfg-border-width${sfx}`).inputValue()).toBe('0');
        expect((await page.locator(`#lbl-border-width${sfx}`).innerText()).trim()).toBe('Tanpa Garis');

        expect(await page.locator(`#cfg-discount-badge-radius${sfx}`).inputValue()).toBe('4');
        expect((await page.locator(`#lbl-discount-badge-radius${sfx}`).innerText()).trim()).toBe('4 px');

        expect(await page.locator(`#cfg-countdown-radius${sfx}`).inputValue()).toBe('4');
        expect((await page.locator(`#lbl-countdown-radius${sfx}`).innerText()).trim()).toBe('4 px');

        expect(await page.locator(`#cfg-badge-radius${sfx}`).inputValue()).toBe('4');
        expect((await page.locator(`#lbl-badge-radius${sfx}`).innerText()).trim()).toBe('4 px');
      }
    });

    // =========================================================================
    // Skenario 12: Perlindungan Konfigurasi Kustom Lama (Seller Data Safety)
    // =========================================================================
    test('12. Konfigurasi kustom lama (misal: 2px outline, 8px radius) tetap dipertahankan saat diedit', async ({ page }) => {
      await setupProductForm(page);
      await openCardDesignTab(page);
      await openPromoAccordion(page);
      await openTextInfoAccordion(page);
      const sfx = getSuffix();

      // Mock produk dengan kustomisasi tersimpan
      const customProduct = {
        id: 'prod-legacy-custom-99',
        name: 'Produk Kustom Lama',
        type: 'physical',
        card_variant: 'A',
        use_default_card_design: false,
        card_config: {
          border_width: '2px',
          border_radius: '12px',
          discount_badge_radius: '8px',
          badge_radius: '8px',
          countdown_radius: '8px',
          bg_color: '#fafafa',
          border_color: '#3b82f6'
        },
        price: 120000,
        images: []
      };

      await page.evaluate((prod) => {
        ProductForm.loadProductForEdit(prod);
      }, customProduct);

      // Pastikan konfigurasi tersimpan seller TIDAK ter-overwrite oleh default baru
      expect(await page.locator(`#cfg-border-width${sfx}`).inputValue()).toBe('2');
      expect((await page.locator(`#lbl-border-width${sfx}`).innerText()).trim()).toBe('Sedang');

      expect(await page.locator(`#cfg-discount-badge-radius${sfx}`).inputValue()).toBe('8');
      expect((await page.locator(`#lbl-discount-badge-radius${sfx}`).innerText()).trim()).toBe('8 px');

      expect(await page.locator(`#cfg-badge-radius${sfx}`).inputValue()).toBe('8');
      expect((await page.locator(`#lbl-badge-radius${sfx}`).innerText()).trim()).toBe('8 px');

      expect(await page.locator(`#cfg-countdown-radius${sfx}`).inputValue()).toBe('8');
      expect((await page.locator(`#lbl-countdown-radius${sfx}`).innerText()).trim()).toBe('8 px');

      const preview = getPreviewScope(page);
      const cardEl = preview.locator('> div').first();
      const style = await cardEl.getAttribute('style');
      expect(style).toContain('border: 2px solid');
    });

    // =========================================================================
    // Skenario 13: Penyimpanan Preset Default Toko (Seller Store Preset Safety)
    // =========================================================================
    test('13. Seller dapat menyimpan preset toko baru ke card_variants_config tanpa merusak konfigurasi lama', async ({ page }) => {
      await setupProductForm(page);

      // Simulasikan penyimpanan preset toko kustom oleh seller
      const result = await page.evaluate(() => {
        const initialSets = DB.getSettings();
        const initialCfg = initialSets.card_variants_config || {};

        // Simpan preset khusus seller untuk variant_a
        const customStorePreset = {
          border_width: '3px',
          border_radius: '8px',
          discount_badge_radius: '12px',
          badge_radius: '8px',
          countdown_radius: '6px'
        };

        DB.saveCardModelPreset('variant_a', customStorePreset);

        const updatedSets = DB.getSettings();
        const savedCfgA = updatedSets.card_variants_config?.variant_a;
        const savedCfgB = updatedSets.card_variants_config?.variant_b;

        return {
          savedA_bw: savedCfgA?.border_width,
          savedA_disc: savedCfgA?.discount_badge_radius,
          savedA_cd: savedCfgA?.countdown_radius,
          // Pastikan variant_b tidak terkena dampak atau tetap valid
          variantB_intact: !savedCfgB || savedCfgB.border_width === '0px' || savedCfgB.border_width === undefined
        };
      });

      expect(result.savedA_bw).toBe('3px');
      expect(result.savedA_disc).toBe('12px');
      expect(result.savedA_cd).toBe('6px');
      expect(result.variantB_intact).toBe(true);
    });
  });
}

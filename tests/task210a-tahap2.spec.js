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
  test.describe(`TASK 2.10A Tahap 2 - Viewport: ${vp.name}`, () => {
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

      // Navigasi ke form tambah produk via AdminApp.navigate
      await page.evaluate(() => {
        AdminApp.navigate('create-product');
      });
      await expect(page.locator('#view-product-form')).toBeVisible();
      await expect(page.locator('#step-pane-1')).toBeVisible();

      // Isi Step 1 wajib
      await page.locator('label:has-text("Fisik")').first().click();
      await page.locator('label:has-text("Kartu Klasik")').first().click();
      await page.locator('#input-prod-image').setInputFiles({
        name: 'test-item.png',
        mimeType: 'image/png',
        buffer: DUMMY_PNG_BUFFER
      });
      await page.locator('#input-prod-name').fill('Produk Validasi Promo Step 1 Step 2');

      // Nonaktifkan toggle custom labels untuk transisi mulus ke Step 2
      await page.evaluate(() => {
        const toggle = document.getElementById('toggle-enable-custom-labels');
        if (toggle && toggle.checked) toggle.click();
        const p = ProductForm.getPrimaryState();
        p.show_badge = false;
        p.has_custom_labels = false;
      });
    }

    async function openStep2Form(page) {
      // Pindah ke Step 2
      await page.evaluate(() => {
        ProductForm.goToStep(2);
      });
      await expect(page.locator('#step-pane-2')).toBeVisible();

      // Buka gating kategori & subkategori
      await page.locator('#btn-step2-cat-trigger').click();
      await page.locator('.cat-option-item').first().click();
      await page.locator('#btn-step2-subcat-trigger').click();
      await page.locator('#opt-step2-subcat-none').click();
    }

    // Helper untuk mengambil container preview yang aktif (Desktop atau Mobile)
    function getPreviewScope(page) {
      return vp.isMobile
        ? page.locator('#mobile-card-preview-container')
        : page.locator('#card-live-preview-box');
    }

    // =========================================================================
    // Skenario 1, 2 & 9: Harga Kosong / Rp0 + Simulasi Step 1 Aktif -> Step 2 Bebas Diskon Palsu
    // =========================================================================
    test('1, 2 & 9. Non-variasi harga kosong / Rp0, simulasi Step 1 aktif -> Step 2 tidak tampilkan diskon palsu / demo 75rb', async ({ page }) => {
      await setupProductForm(page);

      // Aktifkan simulasi diskon di Step 1
      await page.evaluate(() => {
        ProductForm.toggleSimulateDiscount(true);
      });
      expect(await page.evaluate(() => ProductForm.isSimulateDiscountActive())).toBe(true);

      // Beralih ke Step 2
      await openStep2Form(page);

      // Pastikan harga single kosong
      await page.locator('#input-single-price').fill('');
      await page.evaluate(() => {
        ProductForm.getPrimaryState().price = '';
        ProductForm.updateProductCardLivePreview();
      });

      const previewScope = getPreviewScope(page);

      // Validasi Skenario 1: Harga kosong -> Step 2 TIDAK boleh menampilkan diskon
      const discBadgeEmpty = previewScope.locator('span:has-text("Diskon")');
      await expect(discBadgeEmpty).toHaveCount(0);
      const strikePriceEmpty = previewScope.locator('.line-through:not(.hidden)');
      await expect(strikePriceEmpty).toHaveCount(0);

      // Validasi Skenario 9: Tidak boleh ada harga demo Rp75.000 atau Rp150.000 bocor ke Step 2
      const textPreviewEmpty = await previewScope.innerText();
      expect(textPreviewEmpty).not.toContain('75.000');
      expect(textPreviewEmpty).not.toContain('150.000');

      // Validasi Skenario 2: Harga Rp0 -> Step 2 TIDAK boleh menampilkan diskon
      await page.locator('#input-single-price').fill('0');
      await page.evaluate(() => {
        ProductForm.getPrimaryState().price = 0;
        ProductForm.updateProductCardLivePreview();
      });

      const discBadgeZero = previewScope.locator('span:has-text("Diskon")');
      await expect(discBadgeZero).toHaveCount(0);
      const strikePriceZero = previewScope.locator('.line-through:not(.hidden)');
      await expect(strikePriceZero).toHaveCount(0);

      const textPreviewZero = await previewScope.innerText();
      expect(textPreviewZero).not.toContain('75.000');
      expect(textPreviewZero).not.toContain('150.000');
      expect(await page.evaluate(() => ProductForm.isActualProductPriceValid())).toBe(false);
    });

    // =========================================================================
    // Skenario 3: Harga Valid Tetapi Tidak Ada Promo Valid -> Tampilkan Harga Normal
    // =========================================================================
    test('3. Harga valid tetapi tidak ada promo valid -> Step 2 tampilkan harga normal tanpa diskon/coret', async ({ page }) => {
      await setupProductForm(page);
      await openStep2Form(page);

      // Isi harga valid Rp50.000
      await page.locator('#input-single-price').fill('50000');
      await page.evaluate(() => {
        ProductForm.getPrimaryState().price = 50000;
        // Pastikan promo nonaktif
        ProductForm.getPrimaryState().auto_monthly_promo = false;
        ProductForm.getPrimaryState().has_daily_promo = false;
        ProductForm.getPrimaryState().has_monthly_discount = false;
        ProductForm.updateProductCardLivePreview();
      });

      const previewScope = getPreviewScope(page);

      // Skenario 3.A: Promo OFF -> Harga Rp50.000 normal
      expect(await page.evaluate(() => ProductForm.isActualProductPriceValid())).toBe(true);
      expect(await page.evaluate(() => ProductForm.getActivePromoValidationInfo().isValid)).toBe(false);

      const priceEl = previewScope.locator('.mini-pdp-main-price');
      await expect(priceEl).toContainText('50.000');
      await expect(previewScope.locator('span:has-text("Diskon")')).toHaveCount(0);
      await expect(previewScope.locator('.line-through:not(.hidden)')).toHaveCount(0);

      // Skenario 3.B: Promo Harian ON tapi Label Kosong -> Tidak valid
      await page.evaluate(() => {
        const p = ProductForm.getPrimaryState();
        p.has_daily_promo = true;
        p.discount_type = 'percent';
        p.discount_value = 20;
        p.monthly_promo_label = ''; // Label kosong!
        ProductForm.updateProductCardLivePreview();
      });

      expect(await page.evaluate(() => ProductForm.getActivePromoValidationInfo().isValid)).toBe(false);
      await expect(previewScope.locator('span:has-text("Diskon")')).toHaveCount(0);
      await expect(previewScope.locator('.line-through:not(.hidden)')).toHaveCount(0);

      // Skenario 3.C: Promo Bulanan ON tapi Nilai 0 -> Tidak valid
      await page.evaluate(() => {
        const p = ProductForm.getPrimaryState();
        p.has_daily_promo = false;
        p.auto_monthly_promo = true;
        p.monthly_discount_type = 'percent';
        p.monthly_discount_value = 0; // Nilai 0!
        ProductForm.updateProductCardLivePreview();
      });

      expect(await page.evaluate(() => ProductForm.getActivePromoValidationInfo().isValid)).toBe(false);
      await expect(previewScope.locator('span:has-text("Diskon")')).toHaveCount(0);
      await expect(previewScope.locator('.line-through:not(.hidden)')).toHaveCount(0);

      // Skenario 3.D: Diskon Persen > 100% -> Tidak valid
      await page.evaluate(() => {
        const p = ProductForm.getPrimaryState();
        p.auto_monthly_promo = true;
        p.monthly_discount_type = 'percent';
        p.monthly_discount_value = 120; // > 100%!
        ProductForm.updateProductCardLivePreview();
      });

      expect(await page.evaluate(() => ProductForm.getActivePromoValidationInfo().isValid)).toBe(false);
      await expect(previewScope.locator('span:has-text("Diskon")')).toHaveCount(0);
      await expect(previewScope.locator('.line-through:not(.hidden)')).toHaveCount(0);
    });

    // =========================================================================
    // Skenario 4: Harga Valid dan Promo Bulanan Valid -> Tampilkan Diskon Aktual
    // =========================================================================
    test('4. Harga valid dan promo bulanan valid -> Step 2 tampilkan diskon aktual', async ({ page }) => {
      await setupProductForm(page);
      await openStep2Form(page);

      // Set harga valid Rp100.000 & promo bulanan 20%
      await page.locator('#input-single-price').fill('100000');
      await page.evaluate(() => {
        const p = ProductForm.getPrimaryState();
        p.price = 100000;
        p.auto_monthly_promo = true;
        p.monthly_discount_type = 'percent';
        p.monthly_discount_value = 20;
        p.has_daily_promo = false;
        p.has_monthly_discount = false;
        ProductForm.updateProductCardLivePreview();
      });

      expect(await page.evaluate(() => ProductForm.isActualProductPriceValid())).toBe(true);
      const promoInfo = await page.evaluate(() => ProductForm.getActivePromoValidationInfo());
      expect(promoInfo.isMonthlyValid).toBe(true);
      expect(promoInfo.isValid).toBe(true);

      const previewScope = getPreviewScope(page);

      // Harga akhir harus Rp80.000, harga coret Rp100.000, badge Diskon 20%
      const priceEl = previewScope.locator('.mini-pdp-main-price');
      await expect(priceEl).toContainText('80.000');

      const strikePriceEl = previewScope.locator('.line-through');
      await expect(strikePriceEl).toContainText('100.000');

      const badgeEl = previewScope.locator('span:has-text("Diskon 20%")');
      await expect(badgeEl).toBeVisible();
    });

    // =========================================================================
    // Skenario 5: Harga Valid dan Promo Harian Valid -> Tampilkan Diskon Aktual
    // =========================================================================
    test('5. Harga valid dan promo harian valid -> Step 2 tampilkan diskon aktual', async ({ page }) => {
      await setupProductForm(page);
      await openStep2Form(page);

      // Set harga valid Rp100.000 & promo harian 25% dengan label "Promo Kilat"
      await page.locator('#input-single-price').fill('100000');
      await page.evaluate(() => {
        const p = ProductForm.getPrimaryState();
        p.price = 100000;
        p.has_daily_promo = true;
        p.has_monthly_discount = true;
        p.discount_type = 'percent';
        p.discount_value = 25;
        p.monthly_promo_label = 'Promo Kilat';
        p.auto_monthly_promo = false;
        ProductForm.updateProductCardLivePreview();
      });

      expect(await page.evaluate(() => ProductForm.isActualProductPriceValid())).toBe(true);
      const promoInfo = await page.evaluate(() => ProductForm.getActivePromoValidationInfo());
      expect(promoInfo.isDailyValid).toBe(true);
      expect(promoInfo.isValid).toBe(true);

      const previewScope = getPreviewScope(page);

      // Harga akhir harus Rp75.000, harga coret Rp100.000, badge Diskon 25%
      const priceEl = previewScope.locator('.mini-pdp-main-price');
      await expect(priceEl).toContainText('75.000');

      const strikePriceEl = previewScope.locator('.line-through');
      await expect(strikePriceEl).toContainText('100.000');

      const badgeEl = previewScope.locator('span:has-text("Diskon 25%")');
      await expect(badgeEl).toBeVisible();
    });

    // =========================================================================
    // Skenario 6 & 7: Produk dengan Variasi (Satu Kombinasi > 0 vs Seluruhnya 0)
    // =========================================================================
    test('6 & 7. Variasi satu kombinasi > Rp0 memenuhi syarat, seluruhnya Rp0 tidak memenuhi syarat', async ({ page }) => {
      await setupProductForm(page);
      await openStep2Form(page);

      // Skenario 6: Variasi memiliki satu opsi Rp0 dan satu opsi Rp50.000 -> Memenuhi syarat valid!
      await page.evaluate(() => {
        const p = ProductForm.getPrimaryState();
        p.has_variants = true;
        p.auto_monthly_promo = true;
        p.monthly_discount_type = 'percent';
        p.monthly_discount_value = 20;

        const m = ProductForm.getMaterialsState();
        m.length = 0;
        m.push({ id: 'opt_zero', name: 'Ukuran S (Free)', price: 0, stock: 10 });
        m.push({ id: 'opt_paid', name: 'Ukuran M (Paid)', price: 50000, stock: 10 });

        ProductForm.updateProductCardLivePreview();
      });

      const isComboValid = await page.evaluate(() => ProductForm.isActualProductPriceValid());
      expect(isComboValid).toBe(true);

      const previewScope = getPreviewScope(page);
      // Diskon 20% aktif karena kombinasi valid > Rp0 ada
      const badgeEl = previewScope.locator('span:has-text("Diskon 20%")');
      await expect(badgeEl).toBeVisible();

      // Skenario 7: Seluruh kombinasi variasi menghasilkan Rp0 -> TIDAK memenuhi syarat valid!
      await page.evaluate(() => {
        const m = ProductForm.getMaterialsState();
        m[0].price = 0;
        m[1].price = 0;
        ProductForm.updateProductCardLivePreview();
      });

      const isAllZeroValid = await page.evaluate(() => ProductForm.isActualProductPriceValid());
      expect(isAllZeroValid).toBe(false);

      // Diskon badge dan harga coret TIDAK boleh tampil
      await expect(previewScope.locator('span:has-text("Diskon")')).toHaveCount(0);
      await expect(previewScope.locator('.line-through:not(.hidden)')).toHaveCount(0);
    });

    // =========================================================================
    // Skenario 8: Kembali dari Step 2 ke Step 1 -> Status Simulasi Step 1 Tetap Terjaga
    // =========================================================================
    test('8. Seller kembali dari Step 2 ke Step 1 -> status simulasi Step 1 tetap terjaga', async ({ page }) => {
      await setupProductForm(page);

      // 1. Nyalakan simulasi diskon di Step 1
      await page.evaluate(() => {
        ProductForm.toggleSimulateDiscount(true);
      });
      expect(await page.evaluate(() => ProductForm.isSimulateDiscountActive())).toBe(true);

      // 2. Pindah ke Step 2
      await openStep2Form(page);

      // 3. Kembali ke Step 1
      await page.evaluate(() => {
        ProductForm.goToStep(1);
      });
      await expect(page.locator('#step-pane-1')).toBeVisible();

      // Status simulasi di Step 1 harus tetap aktif (true)
      const isSimActive = await page.evaluate(() => ProductForm.isSimulateDiscountActive());
      expect(isSimActive).toBe(true);

      // Preview Step 1 tetap menampilkan badge countdown / simulasi
      const cardPreview = getPreviewScope(page);
      const text = await cardPreview.innerText();
      expect(text).toContain('50'); // Simulasi diskon 50% tetap berjalan di Step 1
      expect(text).toContain('75.000'); // Demo simulasi harga Rp75.000 tetap aktif di Step 1
    });
  });
}

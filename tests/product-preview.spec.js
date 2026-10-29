const { test, expect } = require('@playwright/test');
const {
  TEST_TENANT,
  TEST_CATEGORY,
  TEST_PRODUCT,
  injectDeterministicStorage
} = require('./fixtures/test-data');

// 1x1 transparent PNG buffer for deterministic image upload
const DUMMY_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

test.describe('POS Songer Creative - Tahap 6: E2E Product Preview & Test Mode', () => {

  // ===========================================================================
  // SKENARIO 1: PREVIEW CARD PRODUK (STEP 1)
  // ===========================================================================
  test('1. Preview Card Produk: Mengikuti nama, harga, gambar, promo, dan variasi model kartu', async ({ page }) => {
    await injectDeterministicStorage(page, { authenticated: true });
    await page.goto('/admin.html');
    await page.waitForSelector('#admin-main-viewport');

    // Navigasi ke Tambah Produk Baru
    await page.locator('#admin-nav-group-toko-btn').click();
    await page.locator('#admin-nav-add-product').click();
    await expect(page.locator('#step-pane-1')).toBeVisible();

    // 1. Pilih Jenis Produk: Fisik (Membuka pilihan model kartu)
    await page.locator('label:has-text("Fisik")').first().click();

    // 2. Pilih Model Kartu: Kartu Klasik (Membuka field Foto & Identitas Produk)
    await page.locator('label:has-text("Kartu Klasik")').first().click();

    // Pastikan bagian Nama Produk benar-benar terlihat dan aktif
    const nameInput = page.locator('#input-prod-name');
    await expect(nameInput).toBeVisible();

    const previewContainer = page.locator('#card-live-preview-box');
    await expect(previewContainer).toBeVisible();

    // 3. Verifikasi real-time update Nama Produk
    const productName = 'T-Shirt Sablon DTF Premium Distro';
    await nameInput.fill(productName);
    await expect(previewContainer).toContainText(productName);

    // 4. Verifikasi upload gambar memperbarui preview image
    await page.locator('#input-prod-image').setInputFiles({
      name: 'tshirt-preview.png',
      mimeType: 'image/png',
      buffer: DUMMY_PNG_BUFFER
    });
    await expect(previewContainer.locator('img').first()).toBeVisible();

    // 5. Verifikasi peralihan Model Kartu (A -> B -> C -> A)
    // Model B: Kartu Minimalis (Rasio 3:4)
    await page.locator('label:has-text("Kartu Minimalis")').first().click();
    const cardStateB = await page.evaluate(() => ProductForm.getPrimaryState().card_variant);
    expect(cardStateB).toBe('B');

    // Model C: Kartu Detail (Rasio 4:3)
    await page.locator('label:has-text("Kartu Detail")').first().click();
    const cardStateC = await page.evaluate(() => ProductForm.getPrimaryState().card_variant);
    expect(cardStateC).toBe('C');

    // Kembalikan ke Model A: Kartu Klasik (Rasio 1:1)
    await page.locator('label:has-text("Kartu Klasik")').first().click();
    const cardStateA = await page.evaluate(() => ProductForm.getPrimaryState().card_variant);
    expect(cardStateA).toBe('A');

    // 6. Verifikasi simulasi diskon promo ON
    const toggleSimulateDisc = page.locator('#cfg-simulate-countdown-preview');
    await toggleSimulateDisc.check();
    // Harga coret atau countdown atau diskon muncul di preview container
    await expect(previewContainer.locator('.line-through, [class*="line-through"], [data-lucide="ticket-percent"]').first()).toBeVisible();

    // Matikan simulasi diskon
    await toggleSimulateDisc.uncheck();
  });

  // ===========================================================================
  // SKENARIO 2: PREVIEW DETAIL PRODUK (STEP 2 - MODE PRATINJAU)
  // ===========================================================================
  test('2. Preview Detail Produk: Pilihan variasi tampil, harga dinamis, dan penolakan jika konfigurasi belum lengkap', async ({ page }) => {
    // Siapkan produk dengan variasi yang valid
    const variantProduct = {
      ...TEST_PRODUCT,
      id: 'prod-prev-detail-001',
      name: 'Kaos Polos Combed 30s Reaktif',
      product_type: 'physical',
      card_variant: 'A',
      has_variants: true,
      has_variation_2: false,
      has_wholesale: false,
      wholesale_tiers: [],
      has_order_multiple: false,
      min_order: 1,
      max_order: 100,
      show_badge: false,
      has_custom_labels: false,
      custom_labels: [],
      finishings: { main: [], extra_1: [], extra_2: [], extra_3: [] },
      materials: [
        { id: 'mat_red_01', name: 'Merah Cabe', price: 60000, cost_price: 30000, stock: 50, min_order: 1, max_order: 100 },
        { id: 'mat_blue_02', name: 'Biru Navy', price: 65000, cost_price: 32000, stock: 40, min_order: 1, max_order: 100 }
      ],
      shipping_config: { weight: 200, couriers: ['pickup'] }
    };

    await injectDeterministicStorage(page, { authenticated: true, product: variantProduct });
    await page.goto('/admin.html');
    await page.waitForSelector('#admin-main-viewport');

    // Buka edit produk dan sinkronkan Step 1 agar validasi terpenuhi secara sah
    await page.evaluate((pid) => {
      AdminApp.navigate('edit-product', pid);
      const p = ProductForm.getPrimaryState();
      p.show_badge = false;
      p.has_custom_labels = false;
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle) toggle.checked = false;
      ProductForm.goToStep(2);
    }, variantProduct.id);

    // Verifikasi benar-benar telah mencapai Step 2
    await expect(page.locator('#step-pane-2')).toBeVisible();

    // 1. Verifikasi mode default di Step 2 adalah Pratinjau (#btn-preview-mode-passive aktif)
    const btnPassive = page.locator('#btn-preview-mode-passive');
    await expect(btnPassive).toBeVisible();

    const previewContainer = page.locator('#card-live-preview-box');
    await expect(previewContainer).toBeVisible();

    // Opsi variasi 'Merah Cabe' dan 'Biru Navy' tampil di mini PDP
    await expect(previewContainer).toContainText('Merah Cabe');
    await expect(previewContainer).toContainText('Biru Navy');

    // 2. Data yang belum diatur tidak dianggap valid secara otomatis
    // Kosongkan harga pada tabel matriks kombinasi untuk mensimulasikan konfigurasi belum lengkap
    await page.evaluate(() => {
      const p = ProductForm.getPrimaryState();
      // Kosongkan nama produk untuk memicu penolakan Uji Coba
      p.name = '';
      const inp = document.getElementById('input-prod-name');
      if (inp) inp.value = '';
    });

    // Coba aktifkan mode Uji Coba: Harus ditolak dan menampilkan alert modal
    const btnTest = page.locator('#btn-preview-mode-test');
    await btnTest.click();

    const alertBanner = page.locator('#preview-scoped-modal-root');
    await expect(alertBanner).toBeVisible();
    await expect(alertBanner).toContainText('Silahkan Lengkapi Informasi Penjualan Terlebih Dahulu');

    // 3. Perbaiki kembali nama produk
    await page.evaluate((prodName) => {
      const p = ProductForm.getPrimaryState();
      p.name = prodName;
      const inp = document.getElementById('input-prod-name');
      if (inp) inp.value = prodName;
      const modal = document.getElementById('preview-scoped-modal-root');
      if (modal) modal.classList.add('hidden');
    }, variantProduct.name);

    // Klik Uji Coba sekarang harus diizinkan
    await btnTest.click();
    await expect(alertBanner).toBeHidden();
  });

  // ===========================================================================
  // SKENARIO 3: UJI COBA QTY DAN KELIPATAN (STEP 2 - MODE UJI COBA)
  // ===========================================================================
  test('3. Uji Coba Qty dan Kelipatan: Qty awal 1, stepper +/- berubah satuan, peringatan kelipatan, dan CTA terkunci/aktif', async ({ page }) => {
    // Siapkan produk dengan aturan kelipatan order = 5
    const multipleProduct = {
      ...TEST_PRODUCT,
      id: 'prod-multiple-e2e-001',
      name: 'Sticker Vinyl Cetak Die-Cut',
      price: 15000,
      cost_price: 7000,
      stock: 500,
      product_type: 'physical',
      card_variant: 'A',
      has_variants: false,
      has_wholesale: false,
      wholesale_tiers: [],
      has_order_multiple: true,
      order_multiple_value: 5,
      order_multiple_type: 'all',
      min_order: 1,
      max_order: 500,
      show_badge: false,
      has_custom_labels: false,
      custom_labels: [],
      finishings: { main: [], extra_1: [], extra_2: [], extra_3: [] },
      materials: [
        { id: 'mat_single_stick', name: 'Sticker Vinyl', price: 15000, cost_price: 7000, stock: 500, step_multiplier: 5, order_multiple: 5 }
      ],
      shipping_config: { weight: 100, couriers: ['pickup'] }
    };

    await injectDeterministicStorage(page, { authenticated: true, product: multipleProduct });
    await page.goto('/admin.html');
    await page.waitForSelector('#admin-main-viewport');

    await page.evaluate((pid) => {
      AdminApp.navigate('edit-product', pid);
      const p = ProductForm.getPrimaryState();
      p.show_badge = false;
      p.has_custom_labels = false;
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle) toggle.checked = false;
      ProductForm.goToStep(2);
    }, multipleProduct.id);

    // Verifikasi Step 2 benar-benar terlihat
    await expect(page.locator('#step-pane-2')).toBeVisible();

    // Aktifkan mode Uji Coba
    await page.locator('#btn-preview-mode-test').click();

    // Buka drawer checkout melalui tombol "Beli Sekarang"
    const btnBuyNow = page.locator('#card-live-preview-box .btn-preview-buy-now, .btn-preview-buy-now').first();
    await expect(btnBuyNow).toBeVisible();
    await btnBuyNow.click();

    const drawerSheet = page.locator('#card-live-preview-box .mini-pdp-drawer-sheet, .mini-pdp-drawer-sheet').first();
    await expect(drawerSheet).toBeVisible();

    // Stepper dan tombol drawer
    const qtyInput = drawerSheet.locator('#input-preview-test-qty');
    const btnMinus = drawerSheet.locator('.btn-shopee-qty-minus, #btn-shopee-qty-minus').first();
    const btnPlus = drawerSheet.locator('.btn-shopee-qty-plus, #btn-shopee-qty-plus').first();
    const noticeEl = drawerSheet.locator('#shopee-drawer-order-notice');
    const btnConfirm = drawerSheet.locator('#btn-shopee-drawer-confirm');

    // 1. Verifikasi Qty awal = 1
    await expect(qtyInput).toHaveValue('1');

    // 2. Tombol minus (-) disabled saat Qty = 1
    await expect(btnMinus).toBeDisabled();

    // 3. Qty 1: Peringatan kelipatan 5 tampil dan CTA confirm disabled
    await expect(noticeEl).toBeVisible();
    await expect(noticeEl).toContainText('kelipatan 5');
    await expect(btnConfirm).toBeDisabled();

    // 4. Klik tombol + menjadi 2: notice tampil & CTA disabled
    await btnPlus.click();
    await expect(qtyInput).toHaveValue('2');
    await expect(btnMinus).toBeEnabled();
    await expect(noticeEl).toBeVisible();
    await expect(btnConfirm).toBeDisabled();

    // 5. Klik tombol + menjadi 3: notice tampil & CTA disabled
    await btnPlus.click();
    await expect(qtyInput).toHaveValue('3');
    await expect(noticeEl).toBeVisible();
    await expect(btnConfirm).toBeDisabled();

    // 6. Klik tombol + menjadi 4: notice tampil & CTA disabled
    await btnPlus.click();
    await expect(qtyInput).toHaveValue('4');
    await expect(noticeEl).toBeVisible();
    await expect(btnConfirm).toBeDisabled();

    // 7. Klik tombol + menjadi 5: kelipatan terpenuhi, notice hilang & CTA enabled!
    await btnPlus.click();
    await expect(qtyInput).toHaveValue('5');
    await expect(noticeEl).toBeHidden();
    await expect(btnConfirm).toBeEnabled();

    // 8. Klik tombol + menjadi 6: peringatan kembali muncul & CTA disabled
    await btnPlus.click();
    await expect(qtyInput).toHaveValue('6');
    await expect(noticeEl).toBeVisible();
    await expect(btnConfirm).toBeDisabled();

    // 9. Tombol - mengurangi Qty tepat satu satuan (kembali ke 5)
    await btnMinus.click();
    await expect(qtyInput).toHaveValue('5');
    await expect(noticeEl).toBeHidden();
    await expect(btnConfirm).toBeEnabled();

    // 10. Turunkan bertahap sampai 1 dan verifikasi tidak bisa turun di bawah 1
    await btnMinus.click(); // 4
    await expect(qtyInput).toHaveValue('4');
    await btnMinus.click(); // 3
    await expect(qtyInput).toHaveValue('3');
    await btnMinus.click(); // 2
    await expect(qtyInput).toHaveValue('2');
    await btnMinus.click(); // 1
    await expect(qtyInput).toHaveValue('1');
    await expect(btnMinus).toBeDisabled();
  });

  // ===========================================================================
  // SKENARIO 4: UJI COBA HARGA GROSIR (STEP 2 - MODE UJI COBA)
  // ===========================================================================
  test('4. Uji Coba Harga Grosir: Menghitung tier harga grosir dan beralih variasi menghitung ulang dinamis', async ({ page }) => {
    // Siapkan produk dengan variasi dan tingkatan harga grosir
    // Tier Grosir: Min 10 pcs -> Potongan Rp5.000 / pcs
    const wholesaleProduct = {
      ...TEST_PRODUCT,
      id: 'prod-wholesale-e2e-001',
      name: 'Tumbler Custom Grafir Laser',
      product_type: 'physical',
      card_variant: 'A',
      has_variants: true,
      has_variation_2: false,
      has_wholesale: true,
      wholesale_mode: 'normal',
      wholesale_tiers: [
        { id: 'wt_01', min_qty: 10, max_qty: null, price: 5000, discount: 5000 }
      ],
      has_order_multiple: false,
      min_order: 1,
      max_order: 500,
      show_badge: false,
      has_custom_labels: false,
      custom_labels: [],
      finishings: { main: [], extra_1: [], extra_2: [], extra_3: [] },
      materials: [
        {
          id: 'mat_tumbler_silver',
          name: 'Silver Metalik',
          price: 50000,
          cost_price: 25000,
          stock: 100,
          min_order: 1,
          max_order: 500,
          wholesale_mode: 'normal',
          wholesale_tiers: [{ min_qty: 10, max_qty: null, price: 5000, discount: 5000 }]
        },
        {
          id: 'mat_tumbler_matte',
          name: 'Hitam Matte',
          price: 60000,
          cost_price: 30000,
          stock: 100,
          min_order: 1,
          max_order: 500,
          wholesale_mode: 'normal',
          wholesale_tiers: [{ min_qty: 10, max_qty: null, price: 5000, discount: 5000 }]
        }
      ],
      shipping_config: { weight: 350, couriers: ['pickup'] }
    };

    await injectDeterministicStorage(page, { authenticated: true, product: wholesaleProduct });
    await page.goto('/admin.html');
    await page.waitForSelector('#admin-main-viewport');

    await page.evaluate((pid) => {
      AdminApp.navigate('edit-product', pid);
      const p = ProductForm.getPrimaryState();
      p.show_badge = false;
      p.has_custom_labels = false;
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle) toggle.checked = false;
      ProductForm.goToStep(2);
    }, wholesaleProduct.id);

    // Verifikasi Step 2 terbuka
    await expect(page.locator('#step-pane-2')).toBeVisible();

    // Aktifkan mode Uji Coba dan buka drawer
    await page.locator('#btn-preview-mode-test').click();
    await page.locator('#card-live-preview-box .btn-preview-buy-now, .btn-preview-buy-now').first().click();

    const drawerSheet = page.locator('#card-live-preview-box .mini-pdp-drawer-sheet, .mini-pdp-drawer-sheet').first();
    await expect(drawerSheet).toBeVisible();

    const priceDisplay = drawerSheet.locator('.drawer-header-price');
    const btnPlus = drawerSheet.locator('.btn-shopee-qty-plus, #btn-shopee-qty-plus').first();
    const btnMinus = drawerSheet.locator('.btn-shopee-qty-minus, #btn-shopee-qty-minus').first();
    const qtyInput = drawerSheet.locator('#input-preview-test-qty');

    // 1. Pilih opsi 1: Silver Metalik (Harga normal: Rp50.000)
    await drawerSheet.locator('.btn-shopee-tier1[data-id="mat_tumbler_silver"]').click();
    await expect(priceDisplay).toContainText('50.000');

    // 2. Naikkan Qty ke 10 pcs menggunakan tombol stepper (+)
    for (let i = 1; i < 10; i++) {
      await btnPlus.click();
    }
    await expect(qtyInput).toHaveValue('10');

    // Verifikasi harga terdiskon grosir Rp5.000 -> Rp50.000 - Rp5.000 = Rp45.000
    await expect(priceDisplay).toContainText('45.000');

    // 3. Beralih variasi ke Hitam Matte (Harga normal: Rp60.000)
    // Dengan Qty 10 yang masih aktif, harga harus terhitung ulang secara dinamis menjadi Rp55.000 (Rp60.000 - Rp5.000)
    await drawerSheet.locator('.btn-shopee-tier1[data-id="mat_tumbler_matte"]').click();
    await expect(priceDisplay).toContainText('55.000');

    // 4. Turunkan Qty ke 9 pcs menggunakan tombol minus (-)
    await btnMinus.click();
    await expect(qtyInput).toHaveValue('9');
    // Karena Qty 9 di bawah batas minimal grosir (10 pcs), harga kembali normal Rp60.000
    await expect(priceDisplay).toContainText('60.000');

    // 5. Beralih kembali ke Silver Metalik pada Qty 9 -> harga kembali normal Rp50.000
    await drawerSheet.locator('.btn-shopee-tier1[data-id="mat_tumbler_silver"]').click();
    await expect(priceDisplay).toContainText('50.000');
  });

});

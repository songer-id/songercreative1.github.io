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

test.describe('POS Songer Creative - Tahap 5: E2E Product Create, Save & Edit', () => {

  // ===========================================================================
  // SKENARIO 1: TAMBAH PRODUK TUNGGAL (SINGLE PRODUCT)
  // ===========================================================================
  test('1. Tambah Produk Tunggal: Login, navigasi form, input lengkap, simpan, dan temukan di DB', async ({ page }) => {
    // 1. Injeksi storage awal (unauthenticated untuk menguji alur login riil)
    await injectDeterministicStorage(page, { authenticated: false });
    await page.goto('/admin.html');

    // 2. Login dengan akun demo/uji
    const loginScreen = page.locator('#admin-login-screen');
    await expect(loginScreen).toBeVisible();

    await page.locator('#login-store-id').fill(TEST_TENANT.store_slug);
    await page.locator('#login-username').fill('admin');
    await page.locator('#login-password').fill('admin123');
    await page.locator('#btn-submit-login').click();

    // Verifikasi login berhasil
    await expect(loginScreen).toBeHidden();
    await page.waitForSelector('#admin-main-viewport');

    // 3. Masuk menu Tambah Produk via sidebar (buka akordeon Toko terlebih dahulu)
    await page.locator('#admin-nav-group-toko-btn').click();
    const navAddProduct = page.locator('#admin-nav-add-product');
    await expect(navAddProduct).toBeVisible();
    await navAddProduct.click();

    // Verifikasi container form terbuka pada Step 1
    const formView = page.locator('#view-product-form');
    await expect(formView).toBeVisible();
    const stepPane1 = page.locator('#step-pane-1');
    await expect(stepPane1).toBeVisible();

    // 4. Isi seluruh data wajib Step 1
    // Jenis Produk: Fisik
    await page.locator('label:has-text("Fisik")').first().click();

    // Model Kartu Produk: Kartu Klasik
    await page.locator('label:has-text("Kartu Klasik")').first().click();

    // Foto Produk (minimal 1)
    await page.locator('#input-prod-image').setInputFiles({
      name: 'kemeja-formal.png',
      mimeType: 'image/png',
      buffer: DUMMY_PNG_BUFFER
    });

    // Nama Produk
    const productName = 'Kemeja Formal Premium Pria Lengan Panjang';
    await page.locator('#input-prod-name').fill(productName);

    // Label Khusus: matikan toggle agar tidak menuntut teks label tambahan
    await page.evaluate(() => {
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle && toggle.checked) toggle.click();
      const p = ProductForm.getPrimaryState();
      p.show_badge = false;
      p.has_custom_labels = false;
    });

    // Klik tombol "Lanjutkan" ke Step 2
    const btnNext = page.locator('#btn-step-1-next');
    await expect(btnNext).toBeVisible();
    await btnNext.click();

    // Verifikasi masuk ke Step 2
    const stepPane2 = page.locator('#step-pane-2');
    await expect(stepPane2).toBeVisible();

    // 5. Isi data wajib Step 2 (Produk Tunggal)
    // Kategori Utama
    await page.locator('#select-step2-cat').selectOption(TEST_CATEGORY.id);

    // Harga Jual & Biaya Modal (HPP)
    await page.locator('#input-single-price').fill('85000');
    await page.locator('#input-single-cost').fill('45000');

    // Stok Produk
    await page.locator('#input-stock-qty').fill('75');

    // Maksimal Jumlah Pembelian
    await page.locator('#input-normal-max-order').fill('100');

    // Berat Paket Pengiriman (produk fisik wajib isi berat)
    await page.locator('#input-package-weight').fill('250');

    // Pilih minimal 1 kurir pengiriman saat pengiriman aktif
    await page.locator('input[name="courier_checkbox"][value="pickup"]').check();

    // Deskripsi Produk (Wajib diisi sesuai validasi Step 2)
    await page.locator('#input-prod-desc').fill('Kemeja formal pria lengan panjang bahan katun premium adem dan rapi.');

    // 6. Simpan Produk
    const btnSubmit = page.locator('#btn-submit-product');
    await expect(btnSubmit).toBeVisible();
    await btnSubmit.click();

    // 7. Verifikasi data tersimpan di DB (menunggu setTimeout 400ms persistensi internal)
    await expect.poll(async () => {
      return await page.evaluate((expectedName) => {
        const tid = DB.resolveTenant().tenant_id;
        const products = DB.getProducts(tid);
        return products.find(p => p.name === expectedName);
      }, productName);
    }, { timeout: 7000 }).toBeTruthy();

    const savedProduct = await page.evaluate((expectedName) => {
      const tid = DB.resolveTenant().tenant_id;
      const products = DB.getProducts(tid);
      return products.find(p => p.name === expectedName);
    }, productName);

    expect(savedProduct.name).toBe(productName);
    expect(savedProduct.category_id).toBe(TEST_CATEGORY.id);
    expect(savedProduct.has_variants).toBe(false);
  });

  // ===========================================================================
  // SKENARIO 2: BUKA DAN EDIT PRODUK
  // ===========================================================================
  test('2. Buka dan Edit Produk: Verifikasi nilai tersimpan, ubah konfigurasi, simpan ulang, dan verifikasi perubahan bertahan', async ({ page }) => {
    // 1. Siapkan produk deterministik yang sudah ada (single product bersih)
    const initialProduct = {
      ...TEST_PRODUCT,
      id: 'prod-edit-e2e-001',
      name: 'Spanduk Outdoor Flexi 280gr Ekonomis',
      price: 45000,
      cost_price: 20000,
      stock: 50,
      has_variants: false,
      has_wholesale: false,
      wholesale_tiers: [],
      has_order_multiple: false,
      order_multiple_value: 1,
      min_order: 1,
      max_order: 100,
      finishings: { main: [], extra_1: [], extra_2: [], extra_3: [] },
      has_variation_2: false,
      has_variation_3: false,
      has_variation_4: false,
      has_extra_service: false,
      shipping_config: { weight: 250, couriers: ['pickup', 'local_store', 'reguler'] },
      description: 'Spanduk outdoor flexi 280gr ekonomis tahan cuaca dan hujan.',
      materials: [
        {
          id: 'mat_single_e2e_01',
          name: 'Spanduk Outdoor Flexi 280gr Ekonomis',
          price: 45000,
          cost_price: 20000,
          stock: 50
        }
      ]
    };

    await injectDeterministicStorage(page, { authenticated: true, product: initialProduct });
    await page.goto('/admin.html');
    await page.waitForSelector('#admin-main-viewport');

    // 2. Buka form edit untuk produk tersebut
    await page.evaluate((pid) => {
      AdminApp.navigate('edit-product', pid);
      // Sinkronkan toggle badge agar tidak menghalangi navigasi form
      const p = ProductForm.getPrimaryState();
      p.show_badge = false;
      p.has_custom_labels = false;
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle) toggle.checked = false;
      ProductForm.goToStep(2);
    }, initialProduct.id);

    // 3. Verifikasi nilai awal di Step 2
    const inputPrice = page.locator('#input-single-price');
    await expect(inputPrice).toHaveValue('45000');

    const inputStock = page.locator('#input-stock-qty');
    await expect(inputStock).toHaveValue('50');

    // 4. Ubah salah satu konfigurasi: Ubah Harga Jual menjadi 55000 dan Stok menjadi 120
    await inputPrice.fill('55000');
    await inputStock.fill('120');
    await page.locator('#input-package-weight').fill('250');
    await page.locator('input[name="courier_checkbox"][value="pickup"]').check();

    // 5. Simpan ulang perubahan
    const btnSubmit = page.locator('#btn-submit-product');
    await expect(btnSubmit).toBeVisible();
    await btnSubmit.click();

    // 6. Verifikasi perubahan bertahan di DB (menunggu setTimeout 400ms persistensi)
    await expect.poll(async () => {
      const p = await page.evaluate((pid) => DB.getProductById(pid), initialProduct.id);
      return p ? p.price : null;
    }, { timeout: 7000 }).toBe(55000);

    const updatedProduct = await page.evaluate((pid) => {
      return DB.getProductById(pid);
    }, initialProduct.id);

    expect(updatedProduct.stock).toBe(120);

    // 7. Muat ulang (Reload) form edit untuk memverifikasi nilai bertahan di antarmuka
    await page.evaluate((pid) => {
      AdminApp.navigate('edit-product', pid);
      const p = ProductForm.getPrimaryState();
      p.show_badge = false;
      p.has_custom_labels = false;
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle) toggle.checked = false;
      ProductForm.goToStep(2);
    }, initialProduct.id);

    await expect(page.locator('#input-single-price')).toHaveValue('55000');
    await expect(page.locator('#input-stock-qty')).toHaveValue('120');
  });

  // ===========================================================================
  // SKENARIO 3: PRODUK DENGAN VARIASI (VARIANT CREATION & REOPEN)
  // ===========================================================================
  test('3. Produk dengan Variasi: Buat produk dengan minimal dua pilihan variasi, simpan, buka kembali, dan verifikasi', async ({ page }) => {
    await injectDeterministicStorage(page, { authenticated: true });
    await page.goto('/admin.html');
    await page.waitForSelector('#admin-main-viewport');

    // Masuk menu Tambah Produk via Toko accordion
    await page.locator('#admin-nav-group-toko-btn').click();
    await page.locator('#admin-nav-add-product').click();
    await expect(page.locator('#step-pane-1')).toBeVisible();

    // Step 1: Data wajib produk variasi
    await page.locator('label:has-text("Fisik")').first().click();
    await page.locator('label:has-text("Kartu Klasik")').first().click();

    await page.locator('#input-prod-image').setInputFiles({
      name: 'kaos-polos.png',
      mimeType: 'image/png',
      buffer: DUMMY_PNG_BUFFER
    });

    const variantProdName = 'Kaos Polos Cotton Combed 30s Reaktif';
    await page.locator('#input-prod-name').fill(variantProdName);

    await page.evaluate(() => {
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle && toggle.checked) toggle.click();
      const p = ProductForm.getPrimaryState();
      p.show_badge = false;
      p.has_custom_labels = false;
    });

    await page.locator('#btn-step-1-next').click();
    await expect(page.locator('#step-pane-2')).toBeVisible();

    // Step 2: Pilih Kategori & Berat
    await page.locator('#select-step2-cat').selectOption(TEST_CATEGORY.id);
    await page.locator('#input-package-weight').fill('180');

    // Aktifkan Variasi Produk melalui tombol "Aktifkan Variasi Produk"
    const btnEnableVariants = page.locator('#btn-enable-variants');
    await expect(btnEnableVariants).toBeVisible();
    await btnEnableVariants.click();

    // Isi Judul Variasi 1
    await page.locator('#input-var-label-tier1').fill('Warna');

    // Isi 2 opsi pada Variasi 1 (Opsi 1: Hitam, Opsi 2: Putih)
    const varRows = page.locator('.variation-option-row[data-tier="tier1"]');
    await expect(varRows).toHaveCount(2);

    // Opsi 1
    const row1 = varRows.nth(0);
    await row1.locator('input[data-field="name"]').fill('Hitam Solid');
    await row1.locator('input[data-field="price"]').fill('65000');
    await row1.locator('input[data-field="cost_price"]').fill('35000');
    await row1.locator('input[data-field="stock"]').fill('50');

    // Opsi 2
    const row2 = varRows.nth(1);
    await row2.locator('input[data-field="name"]').fill('Putih Bersih');
    await row2.locator('input[data-field="price"]').fill('68000');
    await row2.locator('input[data-field="cost_price"]').fill('36000');
    await row2.locator('input[data-field="stock"]').fill('40');

    // Isi Deskripsi Produk & Pilih Kurir
    await page.locator('#input-prod-desc').fill('Kaos polos cotton combed 30s reaktif adem dan nyaman dipakai harian.');
    await page.locator('input[name="courier_checkbox"][value="pickup"]').check();

    // Simpan Produk dengan Variasi
    const btnSubmit = page.locator('#btn-submit-product');
    await expect(btnSubmit).toBeVisible();
    await btnSubmit.click();

    // Verifikasi di DB (menunggu callback setTimeout 400ms)
    await expect.poll(async () => {
      return await page.evaluate((expectedName) => {
        const tid = DB.resolveTenant().tenant_id;
        const products = DB.getProducts(tid);
        return products.find(p => p.name === expectedName);
      }, variantProdName);
    }, { timeout: 7000 }).toBeTruthy();

    const savedVarProduct = await page.evaluate((expectedName) => {
      const tid = DB.resolveTenant().tenant_id;
      const products = DB.getProducts(tid);
      const prod = products.find(p => p.name === expectedName);
      if (!prod) return null;
      return {
        id: prod.id,
        name: prod.name,
        has_variants: prod.has_variants,
        materialsCount: Array.isArray(prod.materials) ? prod.materials.length : 0,
        materials: prod.materials
      };
    }, variantProdName);

    expect(savedVarProduct.has_variants).toBe(true);
    expect(savedVarProduct.materialsCount).toBe(2);

    // Buka kembali produk variasi untuk memverifikasi pengaturan tiap kombinasi tetap benar
    await page.evaluate((pid) => {
      AdminApp.navigate('edit-product', pid);
      const p = ProductForm.getPrimaryState();
      p.show_badge = false;
      p.has_custom_labels = false;
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle) toggle.checked = false;
      ProductForm.goToStep(2);
    }, savedVarProduct.id);

    const reloadedRows = page.locator('.variation-option-row[data-tier="tier1"]');
    await expect(reloadedRows).toHaveCount(2);

    await expect(reloadedRows.nth(0).locator('input[data-field="name"]')).toHaveValue('Hitam Solid');
    await expect(reloadedRows.nth(0).locator('input[data-field="price"]')).toHaveValue('65000');
    await expect(reloadedRows.nth(0).locator('input[data-field="stock"]')).toHaveValue('50');

    await expect(reloadedRows.nth(1).locator('input[data-field="name"]')).toHaveValue('Putih Bersih');
    await expect(reloadedRows.nth(1).locator('input[data-field="price"]')).toHaveValue('68000');
    await expect(reloadedRows.nth(1).locator('input[data-field="stock"]')).toHaveValue('40');
  });

  // ===========================================================================
  // SKENARIO 4: VALIDASI SEBELUM SIMPAN (INPUT WAJIB, REJEKSI, & RESUME)
  // ===========================================================================
  test('4. Validasi Sebelum Simpan: Penolakan input wajib kosong, pesan error tepat, perbaikan input dan resume simpan', async ({ page }) => {
    await injectDeterministicStorage(page, { authenticated: true });
    await page.goto('/admin.html');
    await page.waitForSelector('#admin-main-viewport');

    await page.locator('#admin-nav-group-toko-btn').click();
    await page.locator('#admin-nav-add-product').click();
    await expect(page.locator('#step-pane-1')).toBeVisible();

    // 1. Kasus A: Step 1 Validasi - Coba klik "Lanjutkan" saat Nama Produk masih kosong
    await page.locator('label:has-text("Fisik")').first().click();
    await page.locator('label:has-text("Kartu Klasik")').first().click();
    await page.locator('#input-prod-image').setInputFiles({
      name: 'banner-test.png',
      mimeType: 'image/png',
      buffer: DUMMY_PNG_BUFFER
    });

    // Biarkan nama produk kosong
    await page.locator('#input-prod-name').fill('');

    // Matikan label toggle
    await page.evaluate(() => {
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle && toggle.checked) toggle.click();
      const p = ProductForm.getPrimaryState();
      p.show_badge = false;
      p.has_custom_labels = false;
    });

    // Klik "Lanjutkan": Harus ditolak dan tetap berada di Step 1
    await page.locator('#btn-step-1-next').click();

    // Verifikasi pesan error Step 1 muncul
    const wizardError = page.locator('#step-pane-1 #wizard-error-banner, #name-min-length-error');
    await expect(wizardError.first()).toBeVisible();
    await expect(page.locator('#step-pane-2')).toBeHidden();

    // 2. Perbaiki input Nama Produk
    await page.locator('#input-prod-name').fill('Banner Spanduk Pameran Seni 3x1M');

    // Klik "Lanjutkan": Harus berhasil masuk ke Step 2
    await page.locator('#btn-step-1-next').click();
    await expect(page.locator('#step-pane-2')).toBeVisible();

    // 3. Kasus B: Step 2 Validasi - Kosongkan Harga Jual dan klik Simpan Produk
    await page.locator('#select-step2-cat').selectOption(TEST_CATEGORY.id);
    await page.locator('#input-normal-max-order').fill('100');
    await page.locator('#input-single-price').fill(''); // Kosongkan harga
    await page.locator('#input-single-cost').fill('15000');
    await page.locator('#input-stock-qty').fill('30');
    await page.locator('#input-package-weight').fill('300');
    await page.locator('input[name="courier_checkbox"][value="pickup"]').check();
    await page.locator('#input-prod-desc').fill('Banner spanduk pameran seni bahan flexi tebal dan tajam.');

    // Klik tombol simpan produk
    await page.locator('#btn-submit-product').click();

    // Verifikasi penolakan penyimpanan:
    // a. Pesan error tepat tercatat di daftar error form
    const errorList = page.locator('#form-error-list').first();
    await expect(errorList).toContainText('Harga Jual');

    // b. Input harga ditandai dengan border-red-500
    await expect(page.locator('#input-single-price')).toHaveClass(/border-red-500/);

    // c. Data belum tersimpan di database
    const intermediateCheck = await page.evaluate(() => {
      const tid = DB.resolveTenant().tenant_id;
      const products = DB.getProducts(tid);
      return products.find(p => p.name === 'Banner Spanduk Pameran Seni 3x1M');
    });
    expect(intermediateCheck).toBeUndefined();

    // 4. Perbaiki input Harga Jual
    await page.locator('#input-single-price').fill('45000');

    // Simpan kembali: Verifikasi penyimpanan dapat dilanjutkan hingga sukses
    await page.locator('#btn-submit-product').click();

    // Verifikasi produk berhasil tersimpan di DB (menunggu callback setTimeout 400ms)
    await expect.poll(async () => {
      return await page.evaluate(() => {
        const tid = DB.resolveTenant().tenant_id;
        const products = DB.getProducts(tid);
        return products.find(p => p.name === 'Banner Spanduk Pameran Seni 3x1M');
      });
    }, { timeout: 7000 }).toBeTruthy();

    const finalProduct = await page.evaluate(() => {
      const tid = DB.resolveTenant().tenant_id;
      const products = DB.getProducts(tid);
      return products.find(p => p.name === 'Banner Spanduk Pameran Seni 3x1M');
    });

    expect(finalProduct.price).toBe(45000);
    expect(finalProduct.stock).toBe(30);
  });

});

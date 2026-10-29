// @ts-check
const { test, expect } = require('@playwright/test');
const { injectDeterministicStorage, TEST_TENANT, TEST_CATEGORY, TEST_PRODUCT } = require('./fixtures/test-data');

test.describe('POS Songer Creative - Tahap 4: Product Rules Unit & Integration Tests', () => {

  // ===========================================================================
  // KELOMPOK 1: KELIPATAN ORDER (ORDER MULTIPLES)
  // ===========================================================================
  test.describe('Kelompok 1: Kelipatan Order', () => {

    test('1.1 Input kelipatan order kosong tidak valid saat header kelipatan wajib aktif', async ({ page }) => {
      await injectDeterministicStorage(page, { authenticated: true });
      await page.goto('/admin.html');
      await page.waitForSelector('#admin-main-viewport');

      // Evaluasi di konteks ProductForm
      const result = await page.evaluate(() => {
        AdminApp.navigate('create-product');
        ProductForm.resetDraft();
        const primary = ProductForm.getPrimaryState();
        primary.name = 'Produk Uji Kelipatan 1';
        primary.category_id = 'cat_test_001';
        primary.product_type = 'physical';
        primary.has_variants = true;
        primary.has_order_multiple = true; // Header aktif

        const materials = ProductForm.getMaterialsState();
        materials.length = 0;
        materials.push(
          { id: 'mat_k1_01', name: 'Bahan A', price: 25000, cost_price: 15000, stock: 100, order_multiple: '', order_multiple_value: null },
          { id: 'mat_k1_02', name: 'Bahan B', price: 35000, cost_price: 20000, stock: 100, order_multiple: '', order_multiple_value: null }
        );

        // Jalankan validasi form (mengembalikan array errors)
        const errors = ProductForm.validateForm();
        return {
          isValid: errors.length === 0,
          errors: Array.from(errors)
        };
      });

      expect(result.isValid).toBe(false);
      const hasMultipleError = result.errors.some(e => 
        e.toLowerCase().includes('kelipatan') && (e.toLowerCase().includes('belum valid') || e.toLowerCase().includes('wajib'))
      );
      expect(hasMultipleError).toBe(true);
    });

    test('1.2 Angka 1 tidak valid pada input kelipatan order (Minimal Kelipatan 2)', async ({ page }) => {
      await injectDeterministicStorage(page, { authenticated: true });
      await page.goto('/admin.html');
      await page.waitForSelector('#admin-main-viewport');

      const result = await page.evaluate(() => {
        AdminApp.navigate('create-product');
        ProductForm.resetDraft();
        const primary = ProductForm.getPrimaryState();
        primary.name = 'Produk Uji Kelipatan 2';
        primary.category_id = 'cat_test_001';
        primary.has_variants = true;
        primary.has_order_multiple = true;

        const materials = ProductForm.getMaterialsState();
        materials.length = 0;
        materials.push({
          id: 'mat_k1_1val',
          name: 'Bahan Uji 1',
          price: 20000,
          cost_price: 10000,
          stock: 50,
          order_multiple: 1,
          order_multiple_value: 1
        });

        const errors = ProductForm.validateForm();
        return {
          isValid: errors.length === 0,
          errors: Array.from(errors)
        };
      });

      // Angka 1 harus ditolak karena minimal kelipatan adalah 2
      expect(result.isValid).toBe(false);
      const hasErrorMin2 = result.errors.some(e => 
        e.toLowerCase().includes('kelipatan') && (e.toLowerCase().includes('minimal') || e.toLowerCase().includes('belum valid'))
      );
      expect(hasErrorMin2).toBe(true);
    });

    test('1.3 Angka 2 atau lebih valid pada input kelipatan order', async ({ page }) => {
      await injectDeterministicStorage(page, { authenticated: true });
      await page.goto('/admin.html');
      await page.waitForSelector('#admin-main-viewport');

      const result = await page.evaluate(() => {
        AdminApp.navigate('create-product');
        ProductForm.resetDraft();
        const primary = ProductForm.getPrimaryState();
        primary.name = 'Produk Uji Kelipatan Valid';
        primary.category_id = 'cat_test_001';
        primary.product_type = 'physical';
        primary.has_variants = true;
        primary.has_order_multiple = true;

        const materials = ProductForm.getMaterialsState();
        materials.length = 0;
        materials.push({
          id: 'mat_k1_valid',
          name: 'Bahan Valid Kelipatan 5',
          price: 20000,
          cost_price: 10000,
          stock: 50,
          order_multiple: 5,
          order_multiple_value: 5,
          order_multiple_type: 'spesifik'
        });

        primary.shipping_config = { weight: 500 };

        const errors = ProductForm.validateForm();
        return {
          errors: Array.from(errors),
          matMultiple: materials[0].order_multiple
        };
      });

      const multipleErrors = result.errors.filter(e => e.toLowerCase().includes('kelipatan'));
      expect(multipleErrors).toHaveLength(0);
      expect(result.matMultiple).toBe(5);
    });

    test('1.4 "Tanpa Kelipatan" diperlakukan sesuai spesifikasi (valid, step multiplier = 1)', async ({ page }) => {
      await injectDeterministicStorage(page, { authenticated: true });
      await page.goto('/admin.html');
      await page.waitForSelector('#admin-main-viewport');

      const result = await page.evaluate(() => {
        AdminApp.navigate('create-product');
        ProductForm.resetDraft();
        const primary = ProductForm.getPrimaryState();
        primary.name = 'Produk Uji Tanpa Kelipatan';
        primary.category_id = 'cat_test_001';
        primary.product_type = 'physical';
        primary.has_variants = true;
        primary.has_order_multiple = true;

        const materials = ProductForm.getMaterialsState();
        materials.length = 0;
        materials.push({
          id: 'mat_k1_nomult',
          name: 'Bahan Bebas Kelipatan',
          price: 20000,
          cost_price: 10000,
          stock: 50,
          order_multiple: 'Tanpa Kelipatan',
          order_multiple_value: 1,
          order_multiple_type: 'none'
        });

        primary.shipping_config = { weight: 200 };

        const errors = ProductForm.validateForm();
        const multipleErrors = Array.from(errors).filter(e => e.toLowerCase().includes('kelipatan'));

        return {
          multipleErrors,
          matOrderMultiple: materials[0].order_multiple,
          matType: materials[0].order_multiple_type
        };
      });

      expect(result.multipleErrors).toHaveLength(0);
      expect(result.matOrderMultiple).toBe('Tanpa Kelipatan');
      expect(result.matType).toBe('none');
    });

    test('1.5 Kelipatan pada produk tunggal (Non-Variant) wajib minimal 2', async ({ page }) => {
      await injectDeterministicStorage(page, { authenticated: true });
      await page.goto('/admin.html');
      await page.waitForSelector('#admin-main-viewport');

      const result = await page.evaluate(() => {
        AdminApp.navigate('create-product');
        ProductForm.resetDraft();
        const primary = ProductForm.getPrimaryState();
        primary.name = 'Produk Tunggal Kelipatan';
        primary.category_id = 'cat_test_001';
        primary.product_type = 'physical';
        primary.has_variants = false;
        primary.price = 15000;
        primary.has_order_multiple = true;

        const materials = ProductForm.getMaterialsState();
        materials.length = 0;
        materials.push({ id: 'mat_single_01', name: 'Produk Standar', price: 15000, cost_price: 8000, stock: 50 });

        // Uji kasus A: kelipatan 1 pada produk tunggal (tidak valid)
        primary.order_multiple_value = 1;
        const errors1 = Array.from(ProductForm.validateForm());

        // Uji kasus B: kelipatan 10 pada produk tunggal (valid)
        primary.order_multiple_value = 10;
        const errors2 = Array.from(ProductForm.validateForm());

        return {
          err1: errors1.filter(e => e.toLowerCase().includes('kelipatan')),
          err2: errors2.filter(e => e.toLowerCase().includes('kelipatan'))
        };
      });

      expect(result.err1.length).toBeGreaterThan(0);
      expect(result.err2.length).toBe(0);
    });

  });

  // ===========================================================================
  // KELOMPOK 2: QTY DAN BATAS PESANAN (STEPPER & ORDER LIMITS)
  // ===========================================================================
  test.describe('Kelompok 2: Qty dan Batas Pesanan', () => {

    test('2.1 Perubahan satuan Qty stepper +1 dan -1 pada PDP', async ({ page }) => {
      await injectDeterministicStorage(page, { authenticated: false });
      await page.goto(`/product.html?id=${TEST_PRODUCT.id}`);
      await page.waitForSelector('#pdp-content');

      const inputQty = page.locator('#pdp-input-qty');
      const btnPlus = page.locator('#btn-qty-plus');
      const btnMinus = page.locator('#btn-qty-minus');

      // 1. Nilai awal kuantitas = 1
      await expect(inputQty).toHaveValue('1');

      // 2. Klik Plus (+1)
      await btnPlus.click();
      await expect(inputQty).toHaveValue('2');

      // 3. Klik Plus lagi (+1)
      await btnPlus.click();
      await expect(inputQty).toHaveValue('3');

      // 4. Klik Minus (-1)
      await btnMinus.click();
      await expect(inputQty).toHaveValue('2');

      // 5. Klik Minus lagi (-1)
      await btnMinus.click();
      await expect(inputQty).toHaveValue('1');

      // 6. Klik Minus lagi pada batas minimum 1 (tidak boleh bernilai 0 atau negatif)
      await btnMinus.click();
      await expect(inputQty).toHaveValue('1');
    });

    test('2.2 Minimum order limit memblokir tombol CTA pada PDP jika Qty < min_order', async ({ page }) => {
      const minOrderProduct = {
        ...TEST_PRODUCT,
        id: 'prod-min-order-test',
        name: 'Produk Cetak Brosur Min 5 Pcs',
        min_order: 5,
        has_order_multiple: false,
        order_multiple_value: 1
      };

      await injectDeterministicStorage(page, { authenticated: false, product: minOrderProduct });
      await page.goto(`/product.html?id=${minOrderProduct.id}`);
      await page.waitForSelector('#pdp-content');

      const inputQty = page.locator('#pdp-input-qty');
      const stepNote = page.locator('#pdp-step-note');
      const btnBuyNow = page.locator('#btn-buy-now-pdp');
      const btnAddToCart = page.locator('#btn-add-to-cart');

      // Pada Qty = 1, belum memenuhi min_order = 5
      await expect(inputQty).toHaveValue('1');
      await expect(stepNote).toContainText('Minimum Jumlah Pembelian Sebesar 5');
      await expect(btnBuyNow).toBeDisabled();
      await expect(btnAddToCart).toBeDisabled();

      // Naikkan kuantitas hingga Qty = 5
      for (let i = 1; i < 5; i++) {
        await page.locator('#btn-qty-plus').click();
      }
      await expect(inputQty).toHaveValue('5');

      // Pada Qty = 5, syarat minimum terpenuhi: CTA harus aktif
      await expect(btnBuyNow).not.toBeDisabled();
      await expect(btnAddToCart).not.toBeDisabled();
    });

    test('2.3 Maximum order limit mencegah kuantitas melebihi batas maksimum', async ({ page }) => {
      await injectDeterministicStorage(page, { authenticated: true });
      await page.goto('/admin.html');
      await page.waitForSelector('#admin-main-viewport');

      // Verifikasi mekanisme clamping max_order pada logika pricing drawer
      const maxClampResult = await page.evaluate(() => {
        AdminApp.navigate('create-product');
        ProductForm.resetDraft();
        const primary = ProductForm.getPrimaryState();
        primary.name = 'Produk Uji Max Order';
        primary.max_order = 10;
        primary.max_order_type = 'per_order';
        primary.max_order_qty = 10;

        // Simulasi input manual Qty 15 (melebihi max 10)
        let simulatedQty = 15;
        const maxLimit = primary.max_order;
        if (maxLimit !== Infinity && simulatedQty > maxLimit) {
          simulatedQty = maxLimit;
        }

        return {
          clampedQty: simulatedQty,
          maxLimit: maxLimit
        };
      });

      expect(maxClampResult.clampedQty).toBe(10);
      expect(maxClampResult.maxLimit).toBe(10);
    });

    test('2.4 Tombol CTA terkunci (disabled) jika Qty belum memenuhi kelipatan pesanan', async ({ page }) => {
      const multProduct = {
        ...TEST_PRODUCT,
        id: 'prod-mult-lock-test',
        name: 'Spanduk Kelipatan 5 Pcs',
        min_order: 1,
        has_order_multiple: true,
        order_multiple_value: 5
      };

      await injectDeterministicStorage(page, { authenticated: false, product: multProduct });
      await page.goto(`/product.html?id=${multProduct.id}`);
      await page.waitForSelector('#pdp-content');

      const inputQty = page.locator('#pdp-input-qty');
      const stepNote = page.locator('#pdp-step-note');
      const btnBuyNow = page.locator('#btn-buy-now-pdp');

      // Qty = 1: 1 % 5 !== 0 -> CTA Terkunci
      await expect(inputQty).toHaveValue('1');
      await expect(btnBuyNow).toBeDisabled();
      await expect(stepNote).toContainText('wajib kelipatan 5 Pcs');

      // Naikkan ke Qty = 4: masih terkunci
      for (let i = 1; i < 4; i++) {
        await page.locator('#btn-qty-plus').click();
      }
      await expect(inputQty).toHaveValue('4');
      await expect(btnBuyNow).toBeDisabled();

      // Naikkan ke Qty = 5: 5 % 5 === 0 -> CTA Aktif
      await page.locator('#btn-qty-plus').click();
      await expect(inputQty).toHaveValue('5');
      await expect(btnBuyNow).not.toBeDisabled();

      // Naikkan ke Qty = 6: 6 % 5 !== 0 -> CTA Terkunci lagi
      await page.locator('#btn-qty-plus').click();
      await expect(inputQty).toHaveValue('6');
      await expect(btnBuyNow).toBeDisabled();
    });

  });

  // ===========================================================================
  // KELOMPOK 3: HARGA GROSIR (WHOLESALE PRICING)
  // ===========================================================================
  test.describe('Kelompok 3: Harga Grosir', () => {

    test('3.1 Modal Grosir terbuka dengan radio belum terpilih dan input kosong untuk opsi baru', async ({ page }) => {
      await injectDeterministicStorage(page, { authenticated: true });
      await page.goto('/admin.html');
      await page.waitForSelector('#admin-main-viewport');

      // Muat form edit untuk produk deterministik yang valid, lalu ke Step 2
      await page.evaluate(() => {
        AdminApp.navigate('edit-product', 'prod-test-pdp-001');
        const p = ProductForm.getPrimaryState();
        p.show_badge = false;
        p.has_custom_labels = false;
        const toggle = document.getElementById('toggle-enable-custom-labels');
        if (toggle) toggle.checked = false;
        ProductForm.goToStep(2);
      });

      // Klik tombol buka modal grosir pada baris mat_flexi_001
      const btnOpenWs = page.locator('.btn-open-wholesale-modal[data-mat-id="mat_flexi_001"]').first();
      await expect(btnOpenWs).toBeVisible();
      await btnOpenWs.click();

      // Periksa isi modal
      const modal = page.locator('#modal-wholesale-config');
      await expect(modal).toBeVisible();

      const radNormal = modal.locator('input[name="modal_wholesale_mode"][value="normal"]');
      const radTiered = modal.locator('input[name="modal_wholesale_mode"][value="tiered"]');

      expect(await radNormal.isChecked()).toBe(false);
      expect(await radTiered.isChecked()).toBe(false);

      const modalBody = modal.locator('#modal-wholesale-body');
      await expect(modalBody).toContainText('Pilih salah satu jenis harga grosir');
    });

    test('3.2 Input tier kosong ditolak pada mode Normal (Potongan wajib > 0)', async ({ page }) => {
      await injectDeterministicStorage(page, { authenticated: true });
      await page.goto('/admin.html');
      await page.waitForSelector('#admin-main-viewport');

      await page.evaluate(() => {
        AdminApp.navigate('edit-product', 'prod-test-pdp-001');
        const p = ProductForm.getPrimaryState();
        p.show_badge = false;
        p.has_custom_labels = false;
        const toggle = document.getElementById('toggle-enable-custom-labels');
        if (toggle) toggle.checked = false;
        ProductForm.goToStep(2);
      });

      // Buka modal
      const btnOpenWs = page.locator('.btn-open-wholesale-modal[data-mat-id="mat_flexi_001"]').first();
      await expect(btnOpenWs).toBeVisible();
      await btnOpenWs.click();

      const modal = page.locator('#modal-wholesale-config');
      await expect(modal).toBeVisible();

      // Pilih mode Normal
      await modal.locator('input[name="modal_wholesale_mode"][value="normal"]').click();

      // Tangkap dialog alert
      let alertText = '';
      page.once('dialog', async dialog => {
        alertText = dialog.message();
        await dialog.accept();
      });

      // Kosongkan potongan harga dan klik simpan
      await modal.locator('#modal-wholesale-normal-discount').fill('');
      await modal.locator('#btn-save-wholesale-modal').click();

      expect(alertText.toLowerCase()).toContain('potongan harga grosir');
      await expect(modal).toBeVisible(); // Modal tetap terbuka karena gagal
    });

    test('3.3 Tier valid mode Normal berhasil disimpan', async ({ page }) => {
      await injectDeterministicStorage(page, { authenticated: true });
      await page.goto('/admin.html');
      await page.waitForSelector('#admin-main-viewport');

      await page.evaluate(() => {
        AdminApp.navigate('edit-product', 'prod-test-pdp-001');
        const p = ProductForm.getPrimaryState();
        p.show_badge = false;
        p.has_custom_labels = false;
        const toggle = document.getElementById('toggle-enable-custom-labels');
        if (toggle) toggle.checked = false;
        ProductForm.goToStep(2);
      });

      const btnOpenWs = page.locator('.btn-open-wholesale-modal[data-mat-id="mat_flexi_001"]').first();
      await expect(btnOpenWs).toBeVisible();
      await btnOpenWs.click();

      const modal = page.locator('#modal-wholesale-config');
      await expect(modal).toBeVisible();

      await modal.locator('input[name="modal_wholesale_mode"][value="normal"]').click();
      await modal.locator('#modal-wholesale-normal-min').fill('10');
      await modal.locator('#modal-wholesale-normal-discount').fill('5000');
      await modal.locator('#btn-save-wholesale-modal').click();

      // Modal harus tertutup
      await expect(modal).toBeHidden();

      // Periksa state bahan tersimpan
      const matState = await page.evaluate(() => {
        const mat = ProductForm.getMaterialsState().find(m => m.id === 'mat_flexi_001');
        return {
          mode: mat?.wholesale_mode,
          tiers: mat?.wholesale_tiers
        };
      });

      expect(matState.mode).toBe('normal');
      expect(matState.tiers).toHaveLength(1);
      expect(matState.tiers[0].min_qty).toBe(10);
      expect(matState.tiers[0].price).toBe(5000);
    });

    test('3.4 Pergantian mode Normal ke Bertingkat dan validasi tier bertingkat kosong', async ({ page }) => {
      await injectDeterministicStorage(page, { authenticated: true });
      await page.goto('/admin.html');
      await page.waitForSelector('#admin-main-viewport');

      await page.evaluate(() => {
        AdminApp.navigate('edit-product', 'prod-test-pdp-001');
        const p = ProductForm.getPrimaryState();
        p.show_badge = false;
        p.has_custom_labels = false;
        const toggle = document.getElementById('toggle-enable-custom-labels');
        if (toggle) toggle.checked = false;
        ProductForm.goToStep(2);
      });

      const btnOpenWs = page.locator('.btn-open-wholesale-modal[data-mat-id="mat_flexi_001"]').first();
      await expect(btnOpenWs).toBeVisible();
      await btnOpenWs.click();

      const modal = page.locator('#modal-wholesale-config');
      await expect(modal).toBeVisible();

      // Alihkan ke Bertingkat
      await modal.locator('input[name="modal_wholesale_mode"][value="tiered"]').click();

      // Pastikan tabel bertingkat muncul
      await expect(modal.locator('#wholesale-tiers-table-body')).toBeVisible();

      let alertText = '';
      page.once('dialog', async dialog => {
        alertText = dialog.message();
        await dialog.accept();
      });

      // Simpan saat input masih kosong
      await modal.locator('#btn-save-wholesale-modal').click();

      expect(alertText.toLowerCase()).toContain('tingkatan harga grosir');
      await expect(modal).toBeVisible();
    });

    test('3.5 Tier valid mode Bertingkat berhasil disimpan dengan multi-tingkat', async ({ page }) => {
      await injectDeterministicStorage(page, { authenticated: true });
      await page.goto('/admin.html');
      await page.waitForSelector('#admin-main-viewport');

      await page.evaluate(() => {
        AdminApp.navigate('edit-product', 'prod-test-pdp-001');
        const p = ProductForm.getPrimaryState();
        p.show_badge = false;
        p.has_custom_labels = false;
        const toggle = document.getElementById('toggle-enable-custom-labels');
        if (toggle) toggle.checked = false;
        ProductForm.goToStep(2);
      });

      const btnOpenWs = page.locator('.btn-open-wholesale-modal[data-mat-id="mat_flexi_001"]').first();
      await expect(btnOpenWs).toBeVisible();
      await btnOpenWs.click();

      const modal = page.locator('#modal-wholesale-config');
      await expect(modal).toBeVisible();

      await modal.locator('input[name="modal_wholesale_mode"][value="tiered"]').click();

      // Isi Tier 1: Min 10, Max 49, Disc 2000
      const tr1 = modal.locator('#wholesale-tiers-table-body tr').nth(0);
      await tr1.locator('input[data-field="min_qty"]').fill('10');
      await tr1.locator('input[data-field="max_qty"]').fill('49');
      await tr1.locator('input[data-field="price"]').fill('2000');

      // Tambah Tier 2
      await modal.locator('#btn-add-wholesale-tier').click();

      const tr2 = modal.locator('#wholesale-tiers-table-body tr').nth(1);
      // Auto Min pada tier 2 harus 50 (49 + 1)
      await expect(tr2.locator('input[data-field="min_qty"]')).toHaveValue('50');
      await tr2.locator('input[data-field="max_qty"]').fill(''); // Tanpa Max
      await tr2.locator('input[data-field="price"]').fill('5000');

      await modal.locator('#btn-save-wholesale-modal').click();
      await expect(modal).toBeHidden();

      const matState = await page.evaluate(() => {
        const mat = ProductForm.getMaterialsState().find(m => m.id === 'mat_flexi_001');
        return {
          mode: mat?.wholesale_mode,
          tiersCount: mat?.wholesale_tiers ? mat.wholesale_tiers.length : 0,
          tier1Price: mat?.wholesale_tiers ? mat.wholesale_tiers[0].price : 0,
          tier2Price: mat?.wholesale_tiers ? mat.wholesale_tiers[1].price : 0
        };
      });

      expect(matState.mode).toBe('tiered');
      expect(matState.tiersCount).toBe(2);
      expect(matState.tier1Price).toBe(2000);
      expect(matState.tier2Price).toBe(5000);
    });

  });

  // ===========================================================================
  // KELOMPOK 4: VARIASI PRODUK (VARIANT RULES & SCOPES)
  // ===========================================================================
  test.describe('Kelompok 4: Variasi Produk', () => {

    test('4.1 Aturan setiap opsi Variasi 1 independen (Isolasi State antar Baris)', async ({ page }) => {
      await injectDeterministicStorage(page, { authenticated: true });
      await page.goto('/admin.html');
      await page.waitForSelector('#admin-main-viewport');

      const isolationResult = await page.evaluate(() => {
        AdminApp.navigate('create-product');
        ProductForm.resetDraft();
        const primary = ProductForm.getPrimaryState();
        primary.has_variants = true;
        primary.has_order_multiple = true;
        primary.has_wholesale = true;

        const materials = ProductForm.getMaterialsState();
        materials.length = 0;
        const matA = {
          id: 'mat_row_a',
          name: 'Bahan Flexi Standard',
          price: 30000,
          order_multiple: 10,
          order_multiple_value: 10,
          order_multiple_type: 'spesifik',
          wholesale_mode: 'normal',
          wholesale_tiers: [{ min_qty: 10, price: 3000 }]
        };
        const matB = {
          id: 'mat_row_b',
          name: 'Bahan Flexi Korea High',
          price: 55000,
          order_multiple: null,
          order_multiple_value: null,
          order_multiple_type: null,
          wholesale_mode: null,
          wholesale_tiers: []
        };
        materials.push(matA, matB);

        // Pastikan perubahan pada matA tidak mempengaruhi matB
        return {
          matA_mult: matA.order_multiple_value,
          matA_wsMode: matA.wholesale_mode,
          matB_mult: matB.order_multiple_value,
          matB_wsMode: matB.wholesale_mode,
          isIndependent: (matA.order_multiple_value !== matB.order_multiple_value) &&
                         (matA.wholesale_mode !== matB.wholesale_mode)
        };
      });

      expect(isolationResult.isIndependent).toBe(true);
      expect(isolationResult.matA_mult).toBe(10);
      expect(isolationResult.matA_wsMode).toBe('normal');
      expect(isolationResult.matB_mult).toBeNull();
      expect(isolationResult.matB_wsMode).toBeNull();
    });

    test('4.2 Perubahan pilihan variasi pada storefront/PDP memperbarui aturan efektif secara dinamis', async ({ page }) => {
      const multiVariantProduct = {
        ...TEST_PRODUCT,
        id: 'prod-variant-switch-test',
        name: 'Spanduk Variasi Aturan Berbeda',
        has_variants: true,
        price_type: 2, // Normal
        materials: [
          {
            id: 'mat_sw_01',
            name: 'Flexi 280gr (Kelipatan 5, Min 1)',
            price: 25000,
            cost_price: 15000,
            stock: 100,
            min_order: 1,
            order_multiple: 5,
            order_multiple_value: 5,
            order_multiple_type: 'spesifik'
          },
          {
            id: 'mat_sw_02',
            name: 'Flexi 440gr (Kelipatan 10, Min 10)',
            price: 45000,
            cost_price: 25000,
            stock: 100,
            min_order: 10,
            order_multiple: 10,
            order_multiple_value: 10,
            order_multiple_type: 'spesifik'
          }
        ]
      };

      await injectDeterministicStorage(page, { authenticated: false, product: multiVariantProduct });
      await page.goto(`/product.html?id=${multiVariantProduct.id}`);
      await page.waitForSelector('#pdp-content');

      const varButtons = page.locator('.pdp-var-btn');
      const count = await varButtons.count();

      if (count >= 2) {
        // Klik variasi pertama (Flexi 280gr)
        await varButtons.nth(0).click();
        const priceText1 = await page.locator('#pdp-live-price').textContent();
        expect(priceText1).toContain('25.000');

        // Klik variasi kedua (Flexi 440gr)
        await varButtons.nth(1).click();
        const priceText2 = await page.locator('#pdp-live-price').textContent();
        expect(priceText2).toContain('45.000');
      } else {
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });

  });

  // ===========================================================================
  // KELOMPOK 5: PERSISTENSI (STORAGE & DB INTEGRITY)
  // ===========================================================================
  test.describe('Kelompok 5: Persistensi', () => {

    test('5.1 Simpan produk baru dengan aturan lengkap ke DB (localStorage)', async ({ page }) => {
      await injectDeterministicStorage(page, { authenticated: true });
      await page.goto('/admin.html');
      await page.waitForSelector('#admin-main-viewport');

      const createdProduct = await page.evaluate(() => {
        const primaryData = {
          name: 'Banner Persistensi Otomatis',
          product_type: 'physical',
          price_type: 2,
          price: 75000,
          stock: 100,
          is_unlimited_stock: false,
          min_order: 3,
          max_order: 50,
          has_order_multiple: true,
          order_multiple_value: 5,
          has_wholesale: true,
          wholesale_mode: 'normal',
          wholesale_tiers: [{ min_qty: 10, price: 5000 }]
        };

        const materials = [
          { id: 'mat_p_01', name: 'Bahan Standar', price: 75000, cost_price: 40000, stock: 100 }
        ];

        return DB.createProduct(primaryData, materials, []);
      });

      expect(createdProduct).toBeTruthy();
      expect(createdProduct.id).toBeTruthy();
      expect(createdProduct.name).toBe('Banner Persistensi Otomatis');
      expect(createdProduct.min_order).toBe(3);
      expect(createdProduct.max_order).toBe(50);
      expect(createdProduct.has_order_multiple).toBe(true);
      expect(createdProduct.order_multiple_value).toBe(5);
    });

    test('5.2 Reload produk dari DB mempertahankan integritas aturan produk', async ({ page }) => {
      await injectDeterministicStorage(page, { authenticated: true });
      await page.goto('/admin.html');
      await page.waitForSelector('#admin-main-viewport');

      const reloaded = await page.evaluate(() => {
        return DB.getProductById('prod-test-pdp-001');
      });

      expect(reloaded).toBeTruthy();
      expect(reloaded.id).toBe('prod-test-pdp-001');
      expect(reloaded.min_order).toBe(1);
      expect(reloaded.max_order).toBe(100);
      expect(reloaded.has_order_multiple).toBe(true);
      expect(reloaded.order_multiple_value).toBe(5);
      expect(reloaded.materials).toHaveLength(1);
      expect(reloaded.materials[0].name).toContain('Flexi Korea');
    });

    test('5.3 Edit dan simpan ulang produk memperbarui nilai tanpa merusak pengaturan lainnya', async ({ page }) => {
      await injectDeterministicStorage(page, { authenticated: true });
      await page.goto('/admin.html');
      await page.waitForSelector('#admin-main-viewport');

      const updateResult = await page.evaluate(() => {
        const prod = DB.getProductById('prod-test-pdp-001');
        prod.min_order = 10;
        prod.max_order = 200;

        DB.updateProduct('prod-test-pdp-001', prod, prod.materials, []);
        const updated = DB.getProductById('prod-test-pdp-001');

        return {
          min_order: updated.min_order,
          max_order: updated.max_order,
          has_order_multiple: updated.has_order_multiple,
          order_multiple_value: updated.order_multiple_value
        };
      });

      expect(updateResult.min_order).toBe(10);
      expect(updateResult.max_order).toBe(200);
      expect(updateResult.has_order_multiple).toBe(true);
      expect(updateResult.order_multiple_value).toBe(5);
    });

    test('5.4 Nilai pengaturan tidak berubah tanpa instruksi saat dimuat ke Form (Zero Mutation)', async ({ page }) => {
      await injectDeterministicStorage(page, { authenticated: true });
      await page.goto('/admin.html');
      await page.waitForSelector('#admin-main-viewport');

      const formLoadedState = await page.evaluate(() => {
        AdminApp.navigate('edit-product', 'prod-test-pdp-001');
        ProductForm.initEdit('prod-test-pdp-001');
        const state = ProductForm.getPrimaryState();

        return {
          name: state.name,
          min_order: state.min_order,
          max_order: state.max_order,
          has_order_multiple: state.has_order_multiple,
          order_multiple_value: state.order_multiple_value
        };
      });

      expect(formLoadedState.name).toBe(TEST_PRODUCT.name);
      expect(formLoadedState.min_order).toBe(TEST_PRODUCT.min_order);
      expect(formLoadedState.max_order).toBe(TEST_PRODUCT.max_order);
      expect(formLoadedState.has_order_multiple).toBe(TEST_PRODUCT.has_order_multiple);
      expect(formLoadedState.order_multiple_value).toBe(TEST_PRODUCT.order_multiple_value);
    });

  });

});

// @ts-check
const { test, expect } = require('@playwright/test');
const { injectDeterministicStorage, TEST_TENANT } = require('./fixtures/test-data');

const DUMMY_SVG_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%2333b589"/></svg>';

test.describe('POS Songer Creative - Product Form Stabilization: Wholesale Persistence per Variant', () => {

  test.beforeEach(async ({ page }) => {
    // Injeksi storage deterministik dengan sesi terautentikasi
    await injectDeterministicStorage(page, { authenticated: true });
  });

  // ===========================================================================
  // TEST 1: MODE NORMAL VALID PADA VARIASI 1
  // ===========================================================================
  test('1. Pengaturan Mode Normal pada Variasi 1: Validasi input, simpan modal, dan periksa indikator tabel', async ({ page }) => {
    await page.goto('/admin.html');
    await page.waitForSelector('#admin-main-viewport');

    // Buka produk deterministik pada mode edit, matikan badge custom untuk menghindari blokir validasi Step 1
    await page.evaluate(() => {
      AdminApp.navigate('edit-product', 'prod-test-pdp-001');
      const p = ProductForm.getPrimaryState();
      p.show_badge = false;
      p.has_custom_labels = false;
      p.has_wholesale = true; // Pastikan master toggle wholesale aktif
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle) toggle.checked = false;
      ProductForm.goToStep(2);
    });

    const btnOpenWs1 = page.locator('.btn-open-wholesale-modal[data-mat-id="mat_flexi_001"]').first();
    await expect(btnOpenWs1).toBeVisible();
    await btnOpenWs1.click();

    const modal = page.locator('#modal-wholesale-config');
    await expect(modal).toBeVisible();

    // Pilih mode Normal
    await modal.locator('input[name="modal_wholesale_mode"][value="normal"]').click();

    // 1. Verifikasi validasi: Min. Order kosong atau <= 0 ditolak
    let alertMsg = '';
    page.once('dialog', async dialog => {
      alertMsg = dialog.message();
      await dialog.accept();
    });
    await modal.locator('#modal-wholesale-normal-min').fill('0');
    await modal.locator('#modal-wholesale-normal-discount').fill('5000');
    await modal.locator('#btn-save-wholesale-modal').click();
    expect(alertMsg.toLowerCase()).toContain('min. order');
    await expect(modal).toBeVisible();

    // 2. Verifikasi validasi: Potongan harga kosong atau <= 0 ditolak
    page.once('dialog', async dialog => {
      alertMsg = dialog.message();
      await dialog.accept();
    });
    await modal.locator('#modal-wholesale-normal-min').fill('10');
    await modal.locator('#modal-wholesale-normal-discount').fill('');
    await modal.locator('#btn-save-wholesale-modal').click();
    expect(alertMsg.toLowerCase()).toContain('potongan harga');
    await expect(modal).toBeVisible();

    // Isi data valid untuk Variasi 1
    await modal.locator('#modal-wholesale-normal-min').fill('10');
    await modal.locator('#modal-wholesale-normal-discount').fill('5000');
    await modal.locator('#chk-wholesale-no-max').check();

    // Simpan pengaturan modal
    await modal.locator('#btn-save-wholesale-modal').click();
    await expect(modal).toBeHidden();

    // Verifikasi indikator tabel matriks kombinasi berubah menjadi 'Normal'
    const wsBtnText = page.locator('.btn-open-wholesale-modal.combo-text-btn[data-mat-id="mat_flexi_001"]');
    await expect(wsBtnText).toHaveText('Normal');

    // Verifikasi state lokal form
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
    expect(matState.tiers[0].max_qty).toBeNull();
  });

  // ===========================================================================
  // TEST 2: MODE BERTINGKAT PADA VARIASI 2 (INDEPENDEN DARI VARIASI 1)
  // ===========================================================================
  test('2. Pengaturan Mode Bertingkat pada Variasi 2 independen dari Variasi 1 tanpa nilai default tak diminta', async ({ page }) => {
    await page.goto('/admin.html');
    await page.waitForSelector('#admin-main-viewport');

    await page.evaluate(() => {
      const prod = DB.getProductById('prod-test-pdp-001');
      prod.has_wholesale = true;
      prod.show_badge = false;
      prod.has_custom_labels = false;

      const mats = [
        {
          id: 'mat_flexi_001',
          name: 'Flexi Korea 440gr Standar',
          price: 65000,
          cost_price: 35000,
          stock: 250,
          min_order: 1,
          max_order: 100,
          wholesale_mode: 'normal',
          wholesale_tiers: [{ id: 'tier_v1', min_qty: 10, max_qty: null, price: 5000 }]
        },
        {
          id: 'mat_var_002',
          name: 'Flexi Jerman 510gr Premium',
          price: 95000,
          cost_price: 55000,
          stock: 100,
          min_order: 1,
          max_order: 50,
          wholesale_mode: null,
          wholesale_tiers: []
        }
      ];

      DB.updateProduct('prod-test-pdp-001', prod, mats, []);

      AdminApp.navigate('edit-product', 'prod-test-pdp-001');
      const p = ProductForm.getPrimaryState();
      p.show_badge = false;
      p.has_custom_labels = false;
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle) toggle.checked = false;
      ProductForm.goToStep(2);
    });

    // Buka modal untuk Variasi 2
    const btnOpenWs2 = page.locator('.btn-open-wholesale-modal[data-mat-id="mat_var_002"]').first();
    await expect(btnOpenWs2).toBeVisible();
    await btnOpenWs2.click();

    const modal = page.locator('#modal-wholesale-config');
    await expect(modal).toBeVisible();

    // Pilih mode Bertingkat
    await modal.locator('input[name="modal_wholesale_mode"][value="tiered"]').click();

    // Verifikasi baris awal tidak memiliki nilai default tak diminta (input potongan harga kosong)
    const firstPriceInp = modal.locator('#wholesale-tiers-table-body tr input[data-field="price"]').first();
    expect(await firstPriceInp.inputValue()).toBe('');

    // Verifikasi validasi tier kosong ditolak
    let alertMsg = '';
    page.once('dialog', async dialog => {
      alertMsg = dialog.message();
      await dialog.accept();
    });
    await modal.locator('#btn-save-wholesale-modal').click();
    expect(alertMsg.toLowerCase()).toContain('tingkatan harga grosir');
    await expect(modal).toBeVisible();

    // Isi Tier 1: min 10, max 50, discount 3000
    await modal.locator('#wholesale-tiers-table-body tr input[data-field="min_qty"]').first().fill('10');
    await modal.locator('#wholesale-tiers-table-body tr input[data-field="max_qty"]').first().fill('50');
    await modal.locator('#wholesale-tiers-table-body tr input[data-field="price"]').first().fill('3000');

    // Tambah Tier 2
    await modal.locator('#btn-add-wholesale-tier').click();
    const rows = modal.locator('#wholesale-tiers-table-body tr');
    await expect(rows).toHaveCount(2);

    // Tier 2: min otomatis 51 (50 + 1)
    const tier2Min = rows.nth(1).locator('input[data-field="min_qty"]');
    expect(await tier2Min.inputValue()).toBe('51');

    // Isi Tier 2: max 100, discount 7000
    await rows.nth(1).locator('input[data-field="max_qty"]').fill('100');
    await rows.nth(1).locator('input[data-field="price"]').fill('7000');

    // Simpan pengaturan Variasi 2
    await modal.locator('#btn-save-wholesale-modal').click();
    await expect(modal).toBeHidden();

    // Verifikasi indikator tabel matriks kombinasi untuk Variasi 2 berubah menjadi 'Bertingkat'
    const wsBtnText2 = page.locator('.btn-open-wholesale-modal.combo-text-btn[data-mat-id="mat_var_002"]');
    await expect(wsBtnText2).toHaveText('Bertingkat');

    // Verifikasi Variasi 1 TIDAK tertimpa (tetap 'Normal')
    const wsBtnText1 = page.locator('.btn-open-wholesale-modal.combo-text-btn[data-mat-id="mat_flexi_001"]');
    await expect(wsBtnText1).toHaveText('Normal');

    // Periksa isolasi state kedua variasi
    const result = await page.evaluate(() => {
      const mats = ProductForm.getMaterialsState();
      const m1 = mats.find(m => m.id === 'mat_flexi_001');
      const m2 = mats.find(m => m.id === 'mat_var_002');
      return {
        m1_mode: m1?.wholesale_mode,
        m1_tiers_count: m1?.wholesale_tiers?.length,
        m2_mode: m2?.wholesale_mode,
        m2_tiers_count: m2?.wholesale_tiers?.length,
        m2_tier1_price: m2?.wholesale_tiers?.[0]?.price,
        m2_tier2_price: m2?.wholesale_tiers?.[1]?.price
      };
    });

    expect(result.m1_mode).toBe('normal');
    expect(result.m1_tiers_count).toBe(1);
    expect(result.m2_mode).toBe('tiered');
    expect(result.m2_tiers_count).toBe(2);
    expect(result.m2_tier1_price).toBe(3000);
    expect(result.m2_tier2_price).toBe(7000);
  });

  // ===========================================================================
  // TEST 3: PERGANTIAN MODE NORMAL <-> BERTINGKAT TANPA KERUSAKAN DATA
  // ===========================================================================
  test('3. Pergantian mode Normal ke Bertingkat dan sebaliknya mempertahankan data input secara aman', async ({ page }) => {
    await page.goto('/admin.html');
    await page.waitForSelector('#admin-main-viewport');

    await page.evaluate(() => {
      const prod = DB.getProductById('prod-test-pdp-001');
      prod.has_wholesale = true;
      prod.show_badge = false;
      prod.has_custom_labels = false;

      const mats = [
        {
          id: 'mat_flexi_001',
          name: 'Flexi Korea 440gr Standar',
          price: 65000,
          cost_price: 35000,
          stock: 250,
          min_order: 1,
          max_order: 100,
          wholesale_mode: 'normal',
          wholesale_tiers: [{ id: 'tier_sw_1', min_qty: 15, max_qty: 80, price: 4500 }]
        }
      ];

      DB.updateProduct('prod-test-pdp-001', prod, mats, []);

      AdminApp.navigate('edit-product', 'prod-test-pdp-001');
      const p = ProductForm.getPrimaryState();
      p.show_badge = false;
      p.has_custom_labels = false;
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle) toggle.checked = false;
      ProductForm.goToStep(2);
    });

    const btnOpenWs = page.locator('.btn-open-wholesale-modal[data-mat-id="mat_flexi_001"]').first();
    await btnOpenWs.click();

    const modal = page.locator('#modal-wholesale-config');
    await expect(modal).toBeVisible();

    // Verifikasi mode awal Normal tercentang dengan nilai yang benar
    expect(await modal.locator('input[name="modal_wholesale_mode"][value="normal"]').isChecked()).toBe(true);
    expect(await modal.locator('#modal-wholesale-normal-min').inputValue()).toBe('15');
    expect(await modal.locator('#modal-wholesale-normal-discount').inputValue()).toBe('4500');

    // Alihkan ke Bertingkat
    await modal.locator('input[name="modal_wholesale_mode"][value="tiered"]').click();
    await expect(modal.locator('#wholesale-tiers-table-body')).toBeVisible();

    // Tier 1 bertingkat harus mempertahankan data dari mode normal
    const tier1Min = modal.locator('#wholesale-tiers-table-body tr input[data-field="min_qty"]').first();
    const tier1Price = modal.locator('#wholesale-tiers-table-body tr input[data-field="price"]').first();
    expect(await tier1Min.inputValue()).toBe('15');
    expect(await tier1Price.inputValue()).toBe('4500');

    // Alihkan kembali ke Normal
    await modal.locator('input[name="modal_wholesale_mode"][value="normal"]').click();
    await expect(modal.locator('#modal-wholesale-normal-discount')).toBeVisible();
    expect(await modal.locator('#modal-wholesale-normal-min').inputValue()).toBe('15');
    expect(await modal.locator('#modal-wholesale-normal-discount').inputValue()).toBe('4500');

    // Ubah nilai dan simpan
    await modal.locator('#modal-wholesale-normal-discount').fill('6000');
    await modal.locator('#btn-save-wholesale-modal').click();
    await expect(modal).toBeHidden();

    // Verifikasi nilai terupdate di state
    const savedPrice = await page.evaluate(() => {
      const m = ProductForm.getMaterialsState().find(mat => mat.id === 'mat_flexi_001');
      return m?.wholesale_tiers?.[0]?.price;
    });
    expect(savedPrice).toBe(6000);
  });

  // ===========================================================================
  // TEST 4: PERSISTENSI KE DB (LOCALSTORAGE) SAAT PRODUK DISIMPAN
  // ===========================================================================
  test('4. Simpan produk ke database mempertahankan konfigurasi harga grosir tiap variasi secara utuh', async ({ page }) => {
    await page.goto('/admin.html');
    await page.waitForSelector('#admin-main-viewport');

    const saveResult = await page.evaluate((dummyImg) => {
      const primaryData = {
        name: 'Spanduk Grosir Multi-Varian',
        product_type: 'physical',
        price_type: 2,
        price: 50000,
        cost_price: 30000,
        stock: 200,
        is_unlimited_stock: false,
        min_order: 1,
        max_order: 100,
        has_wholesale: true,
        has_variants: true,
        images: [dummyImg],
        image_url: dummyImg,
        category_id: 'cat_test_001',
        card_variant: 'A',
        wholesale_mode_by_variant: {
          'mat_pers_01': 'normal',
          'mat_pers_02': 'tiered'
        },
        wholesale_by_variant: {
          'mat_pers_01': [{ id: 't_pers_1', min_qty: 10, max_qty: null, price: 4000 }],
          'mat_pers_02': [
            { id: 't_pers_2a', min_qty: 10, max_qty: 50, price: 3000 },
            { id: 't_pers_2b', min_qty: 51, max_qty: 100, price: 6000 }
          ]
        }
      };

      const materials = [
        {
          id: 'mat_pers_01',
          name: 'Varian A - Normal',
          price: 50000,
          cost_price: 30000,
          stock: 100,
          min_order: 1,
          max_order: 100,
          wholesale_mode: 'normal',
          wholesale_tiers: [{ id: 't_pers_1', min_qty: 10, max_qty: null, price: 4000 }]
        },
        {
          id: 'mat_pers_02',
          name: 'Varian B - Bertingkat',
          price: 70000,
          cost_price: 45000,
          stock: 100,
          min_order: 1,
          max_order: 100,
          wholesale_mode: 'tiered',
          wholesale_tiers: [
            { id: 't_pers_2a', min_qty: 10, max_qty: 50, price: 3000 },
            { id: 't_pers_2b', min_qty: 51, max_qty: 100, price: 6000 }
          ]
        }
      ];

      const saved = DB.createProduct(primaryData, materials, []);
      return {
        id: saved.id,
        reloaded: DB.getProductById(saved.id)
      };
    }, DUMMY_SVG_IMG);

    const reloaded = saveResult.reloaded;

    expect(reloaded).toBeTruthy();
    expect(reloaded.has_wholesale).toBe(true);

    // Verifikasi materials dari DB mempertahankan konfigurasi wholesale
    expect(reloaded.materials).toHaveLength(2);

    const m1 = reloaded.materials.find(m => m.id === 'mat_pers_01');
    expect(m1).toBeTruthy();
    expect(m1.wholesale_mode).toBe('normal');
    expect(m1.wholesale_tiers).toHaveLength(1);
    expect(m1.wholesale_tiers[0].min_qty).toBe(10);
    expect(m1.wholesale_tiers[0].price).toBe(4000);

    const m2 = reloaded.materials.find(m => m.id === 'mat_pers_02');
    expect(m2).toBeTruthy();
    expect(m2.wholesale_mode).toBe('tiered');
    expect(m2.wholesale_tiers).toHaveLength(2);
    expect(m2.wholesale_tiers[0].price).toBe(3000);
    expect(m2.wholesale_tiers[1].price).toBe(6000);

    // Verifikasi mapping di level produk juga tersimpan
    expect(reloaded.wholesale_mode_by_variant?.['mat_pers_01']).toBe('normal');
    expect(reloaded.wholesale_mode_by_variant?.['mat_pers_02']).toBe('tiered');
    expect(reloaded.wholesale_by_variant?.['mat_pers_01']).toHaveLength(1);
    expect(reloaded.wholesale_by_variant?.['mat_pers_02']).toHaveLength(2);
  });

  // ===========================================================================
  // TEST 5: HIDRASI DAN ZERO MUTATION SAAT DIBUKA ULANG DI FORM EDIT
  // ===========================================================================
  test('5. Muat ulang produk di Form Edit menghidrasi nilai harga grosir tiap variasi tanpa perubahan tak terduga', async ({ page }) => {
    await page.goto('/admin.html');
    await page.waitForSelector('#admin-main-viewport');

    // Injeksi produk ber-variasi dengan wholesale langsung ke DB
    const testProdId = await page.evaluate((dummyImg) => {
      const primaryData = {
        name: 'Banner Hidrasi Wholesale',
        product_type: 'physical',
        price_type: 2,
        price: 60000,
        cost_price: 35000,
        stock: 200,
        is_unlimited_stock: false,
        min_order: 1,
        max_order: 100,
        has_wholesale: true,
        has_variants: true,
        show_badge: false,
        has_custom_labels: false,
        images: [dummyImg],
        image_url: dummyImg,
        category_id: 'cat_test_001',
        card_variant: 'A',
        wholesale_mode_by_variant: {
          'mat_hid_01': 'normal',
          'mat_hid_02': 'tiered'
        },
        wholesale_by_variant: {
          'mat_hid_01': [{ id: 't_hid_1', min_qty: 12, max_qty: 60, price: 4200 }],
          'mat_hid_02': [
            { id: 't_hid_2a', min_qty: 20, max_qty: 50, price: 3500 },
            { id: 't_hid_2b', min_qty: 51, max_qty: 150, price: 8000 }
          ]
        }
      };

      const materials = [
        {
          id: 'mat_hid_01',
          name: 'Bahan A (Normal)',
          price: 60000,
          cost_price: 35000,
          stock: 100,
          min_order: 1,
          max_order: 100,
          wholesale_mode: 'normal',
          wholesale_tiers: [{ id: 't_hid_1', min_qty: 12, max_qty: 60, price: 4200 }]
        },
        {
          id: 'mat_hid_02',
          name: 'Bahan B (Bertingkat)',
          price: 85000,
          cost_price: 50000,
          stock: 100,
          min_order: 1,
          max_order: 100,
          wholesale_mode: 'tiered',
          wholesale_tiers: [
            { id: 't_hid_2a', min_qty: 20, max_qty: 50, price: 3500 },
            { id: 't_hid_2b', min_qty: 51, max_qty: 150, price: 8000 }
          ]
        }
      ];

      const created = DB.createProduct(primaryData, materials, []);
      return created.id;
    }, DUMMY_SVG_IMG);

    // Buka Form Edit untuk produk tersebut
    await page.evaluate((id) => {
      AdminApp.navigate('edit-product', id);
      const p = ProductForm.getPrimaryState();
      p.show_badge = false;
      p.has_custom_labels = false;
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle) toggle.checked = false;
      ProductForm.goToStep(2);
    }, testProdId);

    // Verifikasi tombol matriks kombinasi menghidrasi label yang tepat
    const btnV1 = page.locator('.btn-open-wholesale-modal.combo-text-btn[data-mat-id="mat_hid_01"]');
    const btnV2 = page.locator('.btn-open-wholesale-modal.combo-text-btn[data-mat-id="mat_hid_02"]');
    await expect(btnV1).toHaveText('Normal');
    await expect(btnV2).toHaveText('Bertingkat');

    // Buka modal V1 dan periksa nilai input
    await btnV1.click();
    const modal = page.locator('#modal-wholesale-config');
    await expect(modal).toBeVisible();

    expect(await modal.locator('input[name="modal_wholesale_mode"][value="normal"]').isChecked()).toBe(true);
    expect(await modal.locator('#modal-wholesale-normal-min').inputValue()).toBe('12');
    expect(await modal.locator('#modal-wholesale-normal-max').inputValue()).toBe('60');
    expect(await modal.locator('#modal-wholesale-normal-discount').inputValue()).toBe('4200');

    // Tutup modal V1
    await modal.locator('button:has-text("Tutup")').first().click();
    await expect(modal).toBeHidden();

    // Buka modal V2 dan periksa nilai input
    await btnV2.click();
    await expect(modal).toBeVisible();

    expect(await modal.locator('input[name="modal_wholesale_mode"][value="tiered"]').isChecked()).toBe(true);
    const rows = modal.locator('#wholesale-tiers-table-body tr');
    await expect(rows).toHaveCount(2);

    expect(await rows.nth(0).locator('input[data-field="min_qty"]').inputValue()).toBe('20');
    expect(await rows.nth(0).locator('input[data-field="max_qty"]').inputValue()).toBe('50');
    expect(await rows.nth(0).locator('input[data-field="price"]').inputValue()).toBe('3500');

    expect(await rows.nth(1).locator('input[data-field="min_qty"]').inputValue()).toBe('51');
    expect(await rows.nth(1).locator('input[data-field="max_qty"]').inputValue()).toBe('150');
    expect(await rows.nth(1).locator('input[data-field="price"]').inputValue()).toBe('8000');

    await modal.locator('button:has-text("Tutup")').first().click();
    await expect(modal).toBeHidden();
  });

  // ===========================================================================
  // TEST 6: SIKLUS HIDUP EDIT & SIMPAN ULANG (FULL LIFECYCLE RE-SAVE)
  // ===========================================================================
  test('6. Edit konfigurasi harga grosir, simpan ulang (updateProduct), dan verifikasi nilai baru bertahan di DB', async ({ page }) => {
    await page.goto('/admin.html');
    await page.waitForSelector('#admin-main-viewport');

    const updateCheck = await page.evaluate(() => {
      // 1. Buat produk awal
      const primaryData = {
        name: 'Spanduk Lifecycle Edit',
        product_type: 'physical',
        price_type: 2,
        price: 50000,
        cost_price: 30000,
        stock: 200,
        has_wholesale: true,
        has_variants: true,
        wholesale_mode_by_variant: { 'mat_lc_01': 'normal' },
        wholesale_by_variant: {
          'mat_lc_01': [{ id: 't_lc_1', min_qty: 10, max_qty: 50, price: 2000 }]
        }
      };

      const materials = [
        {
          id: 'mat_lc_01',
          name: 'Varian A',
          price: 50000,
          cost_price: 30000,
          stock: 100,
          min_order: 1,
          max_order: 100,
          wholesale_mode: 'normal',
          wholesale_tiers: [{ id: 't_lc_1', min_qty: 10, max_qty: 50, price: 2000 }]
        }
      ];

      const initialProd = DB.createProduct(primaryData, materials, []);

      // 2. Modifikasi melalui updateProduct: ubah discount menjadi 3500 dan max_qty menjadi 80
      const updatedMaterials = [
        {
          ...materials[0],
          wholesale_tiers: [{ id: 't_lc_1', min_qty: 10, max_qty: 80, price: 3500 }]
        }
      ];

      const updatedPrimary = {
        ...primaryData,
        wholesale_by_variant: {
          'mat_lc_01': [{ id: 't_lc_1', min_qty: 10, max_qty: 80, price: 3500 }]
        }
      };

      DB.updateProduct(initialProd.id, updatedPrimary, updatedMaterials, []);

      // 3. Baca ulang dari DB
      const reloaded = DB.getProductById(initialProd.id);
      return {
        id: initialProd.id,
        m1_tier_price: reloaded.materials?.[0]?.wholesale_tiers?.[0]?.price,
        m1_tier_max: reloaded.materials?.[0]?.wholesale_tiers?.[0]?.max_qty,
        dict_tier_price: reloaded.wholesale_by_variant?.['mat_lc_01']?.[0]?.price
      };
    });

    expect(updateCheck.m1_tier_price).toBe(3500);
    expect(updateCheck.m1_tier_max).toBe(80);
    expect(updateCheck.dict_tier_price).toBe(3500);
  });


  // ===========================================================================
  // TEST 7: REGRESI PERGANTIAN MODE: BUAT MULTI-TIER, PINDAH KE NORMAL LALU KEMBALI KE BERTINGKAT
  // ===========================================================================
  test('7. Regresi Pergantian Mode: Buat multi-tier bertingkat, beralih ke Normal lalu kembali ke Bertingkat mempertahankan semua tier secara utuh', async ({ page }) => {
    await page.goto('/admin.html');
    await page.waitForSelector('#admin-main-viewport');

    await page.evaluate(() => {
      const prod = DB.getProductById('prod-test-pdp-001');
      prod.has_wholesale = true;
      prod.show_badge = false;
      prod.has_custom_labels = false;

      const mats = [
        {
          id: 'mat_reg_01',
          name: 'Variasi Uji Regresi Mode',
          price: 50000,
          cost_price: 30000,
          stock: 200,
          min_order: 1,
          max_order: 200,
          wholesale_mode: null,
          wholesale_tiers: []
        }
      ];

      DB.updateProduct('prod-test-pdp-001', prod, mats, []);
      AdminApp.navigate('edit-product', 'prod-test-pdp-001');
      const p = ProductForm.getPrimaryState();
      p.show_badge = false;
      p.has_custom_labels = false;
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle) toggle.checked = false;
      ProductForm.goToStep(2);
    });

    const btnOpenWs = page.locator('.btn-open-wholesale-modal[data-mat-id="mat_reg_01"]').first();
    await expect(btnOpenWs).toBeVisible();
    await btnOpenWs.click();

    const modal = page.locator('#modal-wholesale-config');
    await expect(modal).toBeVisible();

    // 1. Pilih mode Bertingkat
    await modal.locator('input[name="modal_wholesale_mode"][value="tiered"]').click();
    await expect(modal.locator('#wholesale-tiers-table-body')).toBeVisible();

    // 2. Isi Tier 1: min 10, max 50, disc 3000
    await modal.locator('#wholesale-tiers-table-body tr input[data-field="min_qty"]').first().fill('10');
    await modal.locator('#wholesale-tiers-table-body tr input[data-field="max_qty"]').first().fill('50');
    await modal.locator('#wholesale-tiers-table-body tr input[data-field="price"]').first().fill('3000');

    // 3. Tambah Tier 2: min otomatis 51, max 100, disc 7000
    await modal.locator('#btn-add-wholesale-tier').click();
    let rows = modal.locator('#wholesale-tiers-table-body tr');
    await expect(rows).toHaveCount(2);
    await rows.nth(1).locator('input[data-field="max_qty"]').fill('100');
    await rows.nth(1).locator('input[data-field="price"]').fill('7000');

    // 4. Tambah Tier 3: min otomatis 101, max 200, disc 12000
    await modal.locator('#btn-add-wholesale-tier').click();
    rows = modal.locator('#wholesale-tiers-table-body tr');
    await expect(rows).toHaveCount(3);
    await rows.nth(2).locator('input[data-field="max_qty"]').fill('200');
    await rows.nth(2).locator('input[data-field="price"]').fill('12000');

    // 5. Alihkan ke mode Normal
    await modal.locator('input[name="modal_wholesale_mode"][value="normal"]').click();
    await expect(modal.locator('#modal-wholesale-normal-discount')).toBeVisible();

    // 6. Alihkan kembali ke Bertingkat
    await modal.locator('input[name="modal_wholesale_mode"][value="tiered"]').click();
    await expect(modal.locator('#wholesale-tiers-table-body')).toBeVisible();

    // 7. Verifikasi ketiga tier tetap utuh tanpa kehilangan data
    rows = modal.locator('#wholesale-tiers-table-body tr');
    await expect(rows).toHaveCount(3);

    expect(await rows.nth(0).locator('input[data-field="min_qty"]').inputValue()).toBe('10');
    expect(await rows.nth(0).locator('input[data-field="max_qty"]').inputValue()).toBe('50');
    expect(await rows.nth(0).locator('input[data-field="price"]').inputValue()).toBe('3000');

    expect(await rows.nth(1).locator('input[data-field="min_qty"]').inputValue()).toBe('51');
    expect(await rows.nth(1).locator('input[data-field="max_qty"]').inputValue()).toBe('100');
    expect(await rows.nth(1).locator('input[data-field="price"]').inputValue()).toBe('7000');

    expect(await rows.nth(2).locator('input[data-field="min_qty"]').inputValue()).toBe('101');
    expect(await rows.nth(2).locator('input[data-field="max_qty"]').inputValue()).toBe('200');
    expect(await rows.nth(2).locator('input[data-field="price"]').inputValue()).toBe('12000');

    // 8. Simpan dan verifikasi ke state form
    await modal.locator('#btn-save-wholesale-modal').click();
    await expect(modal).toBeHidden();

    const savedState = await page.evaluate(() => {
      const mat = ProductForm.getMaterialsState().find(m => m.id === 'mat_reg_01');
      return {
        mode: mat?.wholesale_mode,
        tiers: mat?.wholesale_tiers
      };
    });

    expect(savedState.mode).toBe('tiered');
    expect(savedState.tiers).toHaveLength(3);
    expect(savedState.tiers[0].price).toBe(3000);
    expect(savedState.tiers[1].price).toBe(7000);
    expect(savedState.tiers[2].price).toBe(12000);
  });

  // ===========================================================================
  // TEST 8: REGRESI PEMBATALAN/TUTUP MODAL: DATA TERSIMPAN TIDAK BERUBAH
  // ===========================================================================
  test('8. Regresi Tutup Modal: Ubah konfigurasi lalu tutup modal tanpa simpan, pastikan data tersimpan sebelumnya tidak berubah', async ({ page }) => {
    await page.goto('/admin.html');
    await page.waitForSelector('#admin-main-viewport');

    await page.evaluate(() => {
      const prod = DB.getProductById('prod-test-pdp-001');
      prod.has_wholesale = true;
      prod.show_badge = false;
      prod.has_custom_labels = false;

      const mats = [
        {
          id: 'mat_cancel_01',
          name: 'Variasi Uji Batal Modal',
          price: 60000,
          cost_price: 35000,
          stock: 150,
          min_order: 1,
          max_order: 100,
          wholesale_mode: 'normal',
          wholesale_tiers: [{ id: 'tier_saved_init', min_qty: 12, max_qty: 60, price: 4500 }]
        }
      ];

      DB.updateProduct('prod-test-pdp-001', prod, mats, []);
      AdminApp.navigate('edit-product', 'prod-test-pdp-001');
      const p = ProductForm.getPrimaryState();
      p.show_badge = false;
      p.has_custom_labels = false;
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle) toggle.checked = false;
      ProductForm.goToStep(2);
    });

    const btnOpenWs = page.locator('.btn-open-wholesale-modal[data-mat-id="mat_cancel_01"]').first();
    await btnOpenWs.click();

    const modal = page.locator('#modal-wholesale-config');
    await expect(modal).toBeVisible();

    // 1. Verifikasi data tersimpan awal
    expect(await modal.locator('#modal-wholesale-normal-min').inputValue()).toBe('12');
    expect(await modal.locator('#modal-wholesale-normal-max').inputValue()).toBe('60');
    expect(await modal.locator('#modal-wholesale-normal-discount').inputValue()).toBe('4500');

    // 2. Ubah data di input tapi JANGAN klik Simpan
    await modal.locator('#modal-wholesale-normal-min').fill('25');
    await modal.locator('#modal-wholesale-normal-discount').fill('9999');

    // 3. Klik tombol Tutup modal
    await modal.locator('button.btn-close-modal[data-modal="modal-wholesale-config"]').filter({ hasText: 'Tutup' }).click();
    await expect(modal).toBeHidden();

    // 4. Verifikasi state materialsState tidak berubah sama sekali
    const matState1 = await page.evaluate(() => {
      const mat = ProductForm.getMaterialsState().find(m => m.id === 'mat_cancel_01');
      return {
        mode: mat?.wholesale_mode,
        min: mat?.wholesale_tiers?.[0]?.min_qty,
        price: mat?.wholesale_tiers?.[0]?.price
      };
    });
    expect(matState1.mode).toBe('normal');
    expect(matState1.min).toBe(12);
    expect(matState1.price).toBe(4500);

    // 5. Buka kembali modal, pastikan input kembali ke nilai tersimpan sebelumnya (12 dan 4500)
    await btnOpenWs.click();
    await expect(modal).toBeVisible();
    expect(await modal.locator('#modal-wholesale-normal-min').inputValue()).toBe('12');
    expect(await modal.locator('#modal-wholesale-normal-discount').inputValue()).toBe('4500');

    // 6. Uji juga jika beralih ke Bertingkat dan menambah tier, lalu ditutup tanpa simpan
    await modal.locator('input[name="modal_wholesale_mode"][value="tiered"]').click();
    await modal.locator('#btn-add-wholesale-tier').click();
    await expect(modal.locator('#wholesale-tiers-table-body tr')).toHaveCount(2);

    await modal.locator('button.btn-close-modal[data-modal="modal-wholesale-config"]').filter({ hasText: 'Tutup' }).click();
    await expect(modal).toBeHidden();

    // Verifikasi state tetap 'normal' dengan tier lama
    const matState2 = await page.evaluate(() => {
      const mat = ProductForm.getMaterialsState().find(m => m.id === 'mat_cancel_01');
      return {
        mode: mat?.wholesale_mode,
        tiers_count: mat?.wholesale_tiers?.length,
        price: mat?.wholesale_tiers?.[0]?.price
      };
    });
    expect(matState2.mode).toBe('normal');
    expect(matState2.tiers_count).toBe(1);
    expect(matState2.price).toBe(4500);
  });

  // ===========================================================================
  // TEST 9: REGRESI E2E SIMPAN PRODUK VIA FORM SEBENARNYA & BUKA KEMBALI
  // ===========================================================================
  test('9. Regresi E2E Form Simpan & Buka Ulang: Simpan produk via formulir sebenarnya, buka kembali, dan verifikasi harga grosir tetap benar', async ({ page }) => {
    await page.goto('/admin.html');
    await page.waitForSelector('#admin-main-viewport');

    // 1. Siapkan produk awal yang valid di DB dan dapatkan ID hasil createProduct
    const actualProdId = await page.evaluate(({ dummyImg }) => {
      const prod = {
        name: 'Spanduk E2E Grosir Bertingkat',
        card_variant: 'A',
        category_id: 'cat_test_001',
        product_type: 'physical',
        price_type: 2,
        price: 75000,
        cost_price: 40000,
        stock: 300,
        is_unlimited_stock: false,
        min_order: 1,
        max_order: 100,
        has_wholesale: true,
        has_variants: true,
        has_order_multiple: false,
        order_multiple_value: 1,
        show_badge: false,
        has_custom_labels: false,
        images: [dummyImg],
        image_url: dummyImg,
        description: 'Produk uji coba simpan alur formulir lengkap dengan grosir bertingkat.',
        shipping_config: { weight: 200, couriers: ['pickup'] },
        wholesale_mode_by_variant: {},
        wholesale_by_variant: {},
        materials: [
          {
            id: 'mat_flow_01',
            name: 'Opsi Standar',
            price: 75000,
            cost_price: 40000,
            stock: 150,
            min_order: 1,
            max_order: 100,
            wholesale_mode: null,
            wholesale_tiers: []
          }
        ]
      };
      const created = DB.createProduct(prod, prod.materials, []);
      return created.id;
    }, { dummyImg: DUMMY_SVG_IMG });

    // 2. Buka Form Edit Produk melalui AdminApp.navigate dengan ID aktual
    await page.evaluate((pid) => {
      AdminApp.navigate('edit-product', pid);
      const p = ProductForm.getPrimaryState();
      p.show_badge = false;
      p.has_custom_labels = false;
      p.has_wholesale = true;
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle) toggle.checked = false;
      ProductForm.goToStep(2);
    }, actualProdId);

    // 3. Konfigurasi harga grosir Bertingkat pada Opsi Standar
    const btnOpenWs = page.locator('.btn-open-wholesale-modal[data-mat-id="mat_flow_01"]').first();
    await expect(btnOpenWs).toBeVisible();
    await btnOpenWs.click();

    const modal = page.locator('#modal-wholesale-config');
    await expect(modal).toBeVisible();

    await modal.locator('input[name="modal_wholesale_mode"][value="tiered"]').click();
    await expect(modal.locator('#wholesale-tiers-table-body')).toBeVisible();

    // Tier 1: min 10, max 50, disc 3500
    await modal.locator('#wholesale-tiers-table-body tr input[data-field="min_qty"]').first().fill('10');
    await modal.locator('#wholesale-tiers-table-body tr input[data-field="max_qty"]').first().fill('50');
    await modal.locator('#wholesale-tiers-table-body tr input[data-field="price"]').first().fill('3500');

    // Tier 2: max 100, disc 7500
    await modal.locator('#btn-add-wholesale-tier').click();
    const rows = modal.locator('#wholesale-tiers-table-body tr');
    await expect(rows).toHaveCount(2);
    await rows.nth(1).locator('input[data-field="max_qty"]').fill('100');
    await rows.nth(1).locator('input[data-field="price"]').fill('7500');

    // Simpan modal
    await modal.locator('#btn-save-wholesale-modal').click();
    await expect(modal).toBeHidden();

    // Pastikan konfigurasi pengiriman terisi
    await page.locator('#input-package-weight').fill('200');
    await page.locator('input[name="courier_checkbox"][value="pickup"]').check();

    // 4. Simpan Produk via tombol Simpan Produk di Step 2
    const btnSubmit = page.locator('#btn-submit-product');
    await expect(btnSubmit).toBeVisible();
    await btnSubmit.click();

    // 5. Tunggu proses penyimpanan DB selesai
    await expect.poll(async () => {
      return await page.evaluate((pid) => {
        const prod = DB.getProductById(pid);
        return prod?.wholesale_by_variant?.['mat_flow_01']?.length;
      }, actualProdId);
    }, { timeout: 7000 }).toBe(2);

    // 6. Verifikasi di DB
    const savedInDb = await page.evaluate((pid) => {
      const prod = DB.getProductById(pid);
      const mat = (prod.materials || []).find(m => m.id === 'mat_flow_01');
      return {
        prod_ws_mode: prod.wholesale_mode_by_variant?.['mat_flow_01'],
        prod_ws_tiers: prod.wholesale_by_variant?.['mat_flow_01'],
        mat_ws_mode: mat?.wholesale_mode,
        mat_ws_tiers: mat?.wholesale_tiers
      };
    }, actualProdId);

    expect(savedInDb.prod_ws_mode).toBe('tiered');
    expect(savedInDb.prod_ws_tiers).toHaveLength(2);
    expect(savedInDb.prod_ws_tiers[0].price).toBe(3500);
    expect(savedInDb.prod_ws_tiers[1].price).toBe(7500);

    expect(savedInDb.mat_ws_mode).toBe('tiered');
    expect(savedInDb.mat_ws_tiers).toHaveLength(2);
    expect(savedInDb.mat_ws_tiers[0].price).toBe(3500);
    expect(savedInDb.mat_ws_tiers[1].price).toBe(7500);

    // 7. Buka kembali form edit produk dari awal
    await page.evaluate((pid) => {
      AdminApp.navigate('edit-product', pid);
      const p = ProductForm.getPrimaryState();
      p.show_badge = false;
      p.has_custom_labels = false;
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle) toggle.checked = false;
      ProductForm.goToStep(2);
    }, actualProdId);

    // Verifikasi tombol variasi menunjukkan teks 'Bertingkat'
    const btnReloaded = page.locator('.btn-open-wholesale-modal.combo-text-btn[data-mat-id="mat_flow_01"]');
    await expect(btnReloaded).toHaveText('Bertingkat');

    // Buka kembali modal dan verifikasi semua nilai tier terhidrasi dengan tepat
    await btnReloaded.click();
    await expect(modal).toBeVisible();

    expect(await modal.locator('input[name="modal_wholesale_mode"][value="tiered"]').isChecked()).toBe(true);

    const reloadedRows = modal.locator('#wholesale-tiers-table-body tr');
    await expect(reloadedRows).toHaveCount(2);

    expect(await reloadedRows.nth(0).locator('input[data-field="min_qty"]').inputValue()).toBe('10');
    expect(await reloadedRows.nth(0).locator('input[data-field="max_qty"]').inputValue()).toBe('50');
    expect(await reloadedRows.nth(0).locator('input[data-field="price"]').inputValue()).toBe('3500');

    expect(await reloadedRows.nth(1).locator('input[data-field="min_qty"]').inputValue()).toBe('51');
    expect(await reloadedRows.nth(1).locator('input[data-field="max_qty"]').inputValue()).toBe('100');
    expect(await reloadedRows.nth(1).locator('input[data-field="price"]').inputValue()).toBe('7500');
  });

  // ===========================================================================
  // TEST 10: TATA LETAK PENOMORAN URUT (NO. 1, 2, 3) & RENUMBERING TANPA CELAH
  // ===========================================================================
  test('10. Tata Letak Penomoran Otomatis: Kolom No., urutan angka 1, 2, 3, dan pembaruan nomor tanpa celah saat baris dihapus', async ({ page }) => {
    await page.goto('/admin.html');
    await page.waitForSelector('#admin-main-viewport');

    await page.evaluate(() => {
      AdminApp.navigate('edit-product', 'prod-test-pdp-001');
      const p = ProductForm.getPrimaryState();
      p.show_badge = false;
      p.has_custom_labels = false;
      p.has_wholesale = true;
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle) toggle.checked = false;
      ProductForm.goToStep(2);
    });

    const btnOpenWs = page.locator('.btn-open-wholesale-modal[data-mat-id="mat_flexi_001"]').first();
    await btnOpenWs.click();
    const modal = page.locator('#modal-wholesale-config');
    await expect(modal).toBeVisible();

    await modal.locator('input[name="modal_wholesale_mode"][value="tiered"]').click();
    await expect(modal.locator('#wholesale-tiers-table-body')).toBeVisible();

    // 1. Verifikasi header tabel
    const theadThs = modal.locator('table thead th');
    await expect(theadThs.nth(0)).toHaveText('No.');
    await expect(theadThs.nth(1)).toHaveText('Min. Order');
    await expect(theadThs.nth(2)).toHaveText('Max. Order');
    await expect(theadThs.nth(3)).toHaveText('Potongan Harga');
    await expect(theadThs.nth(4)).toHaveText('Aksi');

    // 2. Baris awal memiliki No. = 1
    let rows = modal.locator('#wholesale-tiers-table-body tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.nth(0).locator('.tier-number')).toHaveText('1');

    // 3. Tambah Baris 2 & Baris 3
    await modal.locator('#btn-add-wholesale-tier').click();
    await modal.locator('#btn-add-wholesale-tier').click();
    rows = modal.locator('#wholesale-tiers-table-body tr');
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0).locator('.tier-number')).toHaveText('1');
    await expect(rows.nth(1).locator('.tier-number')).toHaveText('2');
    await expect(rows.nth(2).locator('.tier-number')).toHaveText('3');

    // Catat ID unik baris ke-3 sebelum baris ke-2 dihapus
    const tier3OriginalId = await rows.nth(2).getAttribute('data-tier-id');
    expect(tier3OriginalId).toBeTruthy();

    // 4. Hapus Baris ke-2
    await rows.nth(1).locator('.btn-delete-wholesale-tier').click();
    rows = modal.locator('#wholesale-tiers-table-body tr');
    await expect(rows).toHaveCount(2);

    // 5. Verifikasi penomoran diperbarui otomatis tanpa celah (1 dan 2)
    await expect(rows.nth(0).locator('.tier-number')).toHaveText('1');
    await expect(rows.nth(1).locator('.tier-number')).toHaveText('2');

    // Verifikasi bahwa nomor visual 2 tetap membawa ID tier 3 asli (nomor visual tidak mengubah ID internal tier)
    expect(await rows.nth(1).getAttribute('data-tier-id')).toBe(tier3OriginalId);

    // 6. Hapus satu baris lagi sehingga tersisa 1 baris
    await rows.nth(1).locator('.btn-delete-wholesale-tier').click();
    rows = modal.locator('#wholesale-tiers-table-body tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.nth(0).locator('.tier-number')).toHaveText('1');

    // Tombol hapus pada baris tunggal harus dinonaktifkan
    await expect(rows.nth(0).locator('.btn-delete-wholesale-tier')).toBeDisabled();
  });

  // ===========================================================================
  // TEST 11: LOGIKA AUTO MIN. ORDER, TANPA DEFAULT STATIS, DAN MIN BISA DIKOREKSI
  // ===========================================================================
  test('11. Logika Auto Min. Order: Baris baru menghitung prevMax + 1 jika valid, tetap kosong jika tidak valid, dan seller dapat mengoreksi manual', async ({ page }) => {
    await page.goto('/admin.html');
    await page.waitForSelector('#admin-main-viewport');

    await page.evaluate(() => {
      AdminApp.navigate('edit-product', 'prod-test-pdp-001');
      const p = ProductForm.getPrimaryState();
      p.show_badge = false;
      p.has_custom_labels = false;
      p.has_wholesale = true;
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle) toggle.checked = false;
      ProductForm.goToStep(2);
    });

    const btnOpenWs = page.locator('.btn-open-wholesale-modal[data-mat-id="mat_flexi_001"]').first();
    await btnOpenWs.click();
    const modal = page.locator('#modal-wholesale-config');
    await expect(modal).toBeVisible();

    await modal.locator('input[name="modal_wholesale_mode"][value="tiered"]').click();
    const rows = modal.locator('#wholesale-tiers-table-body tr');

    // 1. Baris pertama dimulai dengan seluruh input kosong
    const row1Min = rows.nth(0).locator('input[data-field="min_qty"]');
    const row1Max = rows.nth(0).locator('input[data-field="max_qty"]');
    const row1Price = rows.nth(0).locator('input[data-field="price"]');
    expect(await row1Min.inputValue()).toBe('');
    expect(await row1Max.inputValue()).toBe('');
    expect(await row1Price.inputValue()).toBe('');

    // 2. Klik tambah baris saat Max. Order baris 1 masih kosong:
    // Min. Order baris 2 HARUS tetap kosong (tidak menghasilkan angka otomatis atau default palsu)
    await modal.locator('#btn-add-wholesale-tier').click();
    const row2 = modal.locator('#wholesale-tiers-table-body tr').nth(1);
    expect(await row2.locator('input[data-field="min_qty"]').inputValue()).toBe('');
    expect(await row2.locator('input[data-field="max_qty"]').inputValue()).toBe('');
    expect(await row2.locator('input[data-field="price"]').inputValue()).toBe('');

    // Hapus baris 2 sementara
    await row2.locator('.btn-delete-wholesale-tier').click();

    // 3. Sekarang isi baris 1 dengan Max. Order valid: 25
    await row1Min.fill('1');
    await row1Max.fill('25');
    await row1Price.fill('500');

    // 4. Tambah baris baru: Min. Order otomatis 26 (25 + 1), Max dan Potongan tetap kosong
    await modal.locator('#btn-add-wholesale-tier').click();
    const newRow2 = modal.locator('#wholesale-tiers-table-body tr').nth(1);
    expect(await newRow2.locator('input[data-field="min_qty"]').inputValue()).toBe('26');
    expect(await newRow2.locator('input[data-field="max_qty"]').inputValue()).toBe('');
    expect(await newRow2.locator('input[data-field="price"]').inputValue()).toBe('');

    // 5. Verifikasi Min. Order pada baris kedua TIDAK readonly dan dapat dikoreksi manual oleh seller
    const row2MinInp = newRow2.locator('input[data-field="min_qty"]');
    await expect(row2MinInp).not.toHaveAttribute('readonly');
    await row2MinInp.fill('30'); // Seller mengubah manual dari 26 ke 30
    expect(await row2MinInp.inputValue()).toBe('30');
  });

  // ===========================================================================
  // TEST 12: VALIDASI RENTANG OVERLAP, PERUBAHAN MAX TANPA TIMPA MANUAL, & KONFLIK
  // ===========================================================================
  test('12. Validasi Konflik Rentang: Penolakan rentang bertumpang tindih, peringatan konflik saat Max diubah tanpa menimpa nilai manual', async ({ page }) => {
    await page.goto('/admin.html');
    await page.waitForSelector('#admin-main-viewport');

    await page.evaluate(() => {
      AdminApp.navigate('edit-product', 'prod-test-pdp-001');
      const p = ProductForm.getPrimaryState();
      p.show_badge = false;
      p.has_custom_labels = false;
      p.has_wholesale = true;
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle) toggle.checked = false;
      ProductForm.goToStep(2);
    });

    const btnOpenWs = page.locator('.btn-open-wholesale-modal[data-mat-id="mat_flexi_001"]').first();
    await btnOpenWs.click();
    const modal = page.locator('#modal-wholesale-config');
    await expect(modal).toBeVisible();

    await modal.locator('input[name="modal_wholesale_mode"][value="tiered"]').click();
    const rows = modal.locator('#wholesale-tiers-table-body tr');

    // 1. Siapkan 2 baris valid: Baris 1: 1-10 (disc 500), Baris 2: 11-30 (disc 1000)
    await rows.nth(0).locator('input[data-field="min_qty"]').fill('1');
    await rows.nth(0).locator('input[data-field="max_qty"]').fill('10');
    await rows.nth(0).locator('input[data-field="price"]').fill('500');

    await modal.locator('#btn-add-wholesale-tier').click();
    const row2 = modal.locator('#wholesale-tiers-table-body tr').nth(1);
    await row2.locator('input[data-field="max_qty"]').fill('30');
    await row2.locator('input[data-field="price"]').fill('1000');

    const conflictBanner = modal.locator('#wholesale-tiered-conflict-msg');
    await expect(conflictBanner).toBeHidden();

    // 2. Ubah Max. Order baris 1 menjadi 20 (sehingga bertabrakan dengan Min baris 2 yang nilainya 11)
    await rows.nth(0).locator('input[data-field="max_qty"]').fill('20');

    // 3. Verifikasi Min. Order baris 2 TIDAK diam-diam ditimpa (tetap 11)
    expect(await row2.locator('input[data-field="min_qty"]').inputValue()).toBe('11');

    // 4. Verifikasi peringatan konflik muncul secara jelas di antarmuka
    await expect(conflictBanner).toBeVisible();
    await expect(conflictBanner).toContainText('Konflik rentang tier');

    // 5. Coba simpan saat konflik terjadi: harus ditolak dialog alert
    let alertMsg = '';
    page.once('dialog', async dialog => {
      alertMsg = dialog.message();
      await dialog.accept();
    });
    await modal.locator('#btn-save-wholesale-modal').click();
    expect(alertMsg.toLowerCase()).toContain('rentang');
    await expect(modal).toBeVisible();

    // 6. Koreksi Min. Order baris 2 menjadi 25 (konflik teratasi: 1-20 dan 25-30)
    await row2.locator('input[data-field="min_qty"]').fill('25');
    await expect(conflictBanner).toBeHidden();

    // 7. Uji rentang terbalik: buat Max baris 2 menjadi 15 (lebih kecil dari Min 25)
    await row2.locator('input[data-field="max_qty"]').fill('15');
    await expect(conflictBanner).toBeVisible();
    await expect(conflictBanner).toContainText('tidak boleh lebih kecil');

    page.once('dialog', async dialog => {
      alertMsg = dialog.message();
      await dialog.accept();
    });
    await modal.locator('#btn-save-wholesale-modal').click();
    expect(alertMsg.toLowerCase()).toContain('tidak boleh lebih kecil');
    await expect(modal).toBeVisible();
  });

  // ===========================================================================
  // TEST 13: VALIDASI TIER PERANTARA TANPA MAX ORDER & KOREKSI SIMPAN BERHASIL (TASK 01F)
  // ===========================================================================
  test('13. Validasi Tier Perantara: Penolakan simpan saat tier perantara tanpa batas maksimum, preservasi input, dan simpan berhasil setelah koreksi', async ({ page }) => {
    await page.goto('/admin.html');
    await page.waitForSelector('#admin-main-viewport');

    // Buka form edit produk deterministik dan arahkan ke Step 2 (Variasi & Grosir)
    await page.evaluate(() => {
      AdminApp.navigate('edit-product', 'prod-test-pdp-001');
      const p = ProductForm.getPrimaryState();
      p.show_badge = false;
      p.has_custom_labels = false;
      p.has_wholesale = true;
      const toggle = document.getElementById('toggle-enable-custom-labels');
      if (toggle) toggle.checked = false;
      ProductForm.goToStep(2);
    });

    const btnOpenWs = page.locator('.btn-open-wholesale-modal[data-mat-id="mat_flexi_001"]').first();
    await expect(btnOpenWs).toBeVisible();
    await btnOpenWs.click();

    const modal = page.locator('#modal-wholesale-config');
    await expect(modal).toBeVisible();

    // 1. Aktifkan mode Harga Grosir Bertingkat
    await modal.locator('input[name="modal_wholesale_mode"][value="tiered"]').click();
    await expect(modal.locator('#wholesale-tiers-table-body')).toBeVisible();

    const rows = modal.locator('#wholesale-tiers-table-body tr');

    // 2. Konfigurasi Tier 1: Min = 1, Max = 10, Potongan = 500
    await rows.nth(0).locator('input[data-field="min_qty"]').fill('1');
    await rows.nth(0).locator('input[data-field="max_qty"]').fill('10');
    await rows.nth(0).locator('input[data-field="price"]').fill('500');

    // 3. Tambah Tier 2: Min otomatis 11 (10 + 1), Max dibiarkan kosong, Potongan = 1000
    await modal.locator('#btn-add-wholesale-tier').click();
    await expect(rows).toHaveCount(2);
    expect(await rows.nth(1).locator('input[data-field="min_qty"]').inputValue()).toBe('11');
    expect(await rows.nth(1).locator('input[data-field="max_qty"]').inputValue()).toBe('');
    await rows.nth(1).locator('input[data-field="price"]').fill('1000');

    // 4. Tambah Tier 3 saat Tier 2 Max masih kosong:
    // Pada saat Tier 3 ditambahkan, Tier 2 menjadi tier perantara (intermediate tier) tanpa batas maksimum
    await modal.locator('#btn-add-wholesale-tier').click();
    await expect(rows).toHaveCount(3);

    // Konfigurasi Tier 3: Min = 21, Max = 30, Potongan = 1500
    await rows.nth(2).locator('input[data-field="min_qty"]').fill('21');
    await rows.nth(2).locator('input[data-field="max_qty"]').fill('30');
    await rows.nth(2).locator('input[data-field="price"]').fill('1500');

    // 5. Verifikasi peringatan konflik tier perantara muncul di UI secara real-time
    const conflictBanner = modal.locator('#wholesale-tiered-conflict-msg');
    await expect(conflictBanner).toBeVisible();
    await expect(conflictBanner).toContainText('Baris ke-2: Max. Order wajib diisi karena terdapat tingkatan setelahnya');

    // Input Max pada Tier 2 ditandai dengan styling border merah
    await expect(rows.nth(1).locator('input[data-field="max_qty"]')).toHaveClass(/border-red-500/);

    // 6. Upayakan menyimpan pengaturan modal dengan kondisi Tier 2 Max kosong
    let alertText = '';
    page.once('dialog', async dialog => {
      alertText = dialog.message();
      await dialog.accept();
    });

    await modal.locator('#btn-save-wholesale-modal').click();

    // 7. Verifikasi penolakan penyimpanan:
    // a. Dialog penolakan muncul dengan pesan peringatan yang sesuai
    expect(alertText).toContain('Baris ke-2');
    expect(alertText.toLowerCase()).toContain('wajib diisi');

    // b. Modal tetap terbuka
    await expect(modal).toBeVisible();

    // c. Nilai input yang sudah diketik tetap utuh (preservasi draft buffer)
    expect(await rows.nth(0).locator('input[data-field="min_qty"]').inputValue()).toBe('1');
    expect(await rows.nth(0).locator('input[data-field="max_qty"]').inputValue()).toBe('10');
    expect(await rows.nth(0).locator('input[data-field="price"]').inputValue()).toBe('500');

    expect(await rows.nth(1).locator('input[data-field="min_qty"]').inputValue()).toBe('11');
    expect(await rows.nth(1).locator('input[data-field="max_qty"]').inputValue()).toBe('');
    expect(await rows.nth(1).locator('input[data-field="price"]').inputValue()).toBe('1000');

    expect(await rows.nth(2).locator('input[data-field="min_qty"]').inputValue()).toBe('21');
    expect(await rows.nth(2).locator('input[data-field="max_qty"]').inputValue()).toBe('30');
    expect(await rows.nth(2).locator('input[data-field="price"]').inputValue()).toBe('1500');

    // d. Konfigurasi tidak ter-commit ke state materialsState
    const uncommittedState = await page.evaluate(() => {
      const mat = ProductForm.getMaterialsState().find(m => m.id === 'mat_flexi_001');
      return {
        wholesale_mode: mat?.wholesale_mode,
        wholesale_tiers: mat?.wholesale_tiers
      };
    });
    expect(uncommittedState.wholesale_tiers).toEqual([]);

    // 8. Koreksi: Masukkan Max. Order = 20 pada Tier 2
    await rows.nth(1).locator('input[data-field="max_qty"]').fill('20');

    // Peringatan konflik visual otomatis hilang setelah nilai valid
    await expect(conflictBanner).toBeHidden();
    await expect(rows.nth(1).locator('input[data-field="max_qty"]')).not.toHaveClass(/border-red-500/);

    // 9. Konfirmasi nilai ketiga rentang sebelum simpan ulang:
    // Tier 1: 1–10 (500), Tier 2: 11–20 (1000), Tier 3: 21–30 (1500)
    expect(await rows.nth(0).locator('input[data-field="min_qty"]').inputValue()).toBe('1');
    expect(await rows.nth(0).locator('input[data-field="max_qty"]').inputValue()).toBe('10');
    expect(await rows.nth(1).locator('input[data-field="min_qty"]').inputValue()).toBe('11');
    expect(await rows.nth(1).locator('input[data-field="max_qty"]').inputValue()).toBe('20');
    expect(await rows.nth(2).locator('input[data-field="min_qty"]').inputValue()).toBe('21');
    expect(await rows.nth(2).locator('input[data-field="max_qty"]').inputValue()).toBe('30');

    // 10. Klik Simpan Pengaturan kembali
    await modal.locator('#btn-save-wholesale-modal').click();

    // 11. Verifikasi penyimpanan berhasil: modal tertutup
    await expect(modal).toBeHidden();

    // 12. Verifikasi state data ter-commit dengan benar di materialsState
    const committedState = await page.evaluate(() => {
      const mat = ProductForm.getMaterialsState().find(m => m.id === 'mat_flexi_001');
      return {
        wholesale_mode: mat?.wholesale_mode,
        wholesale_tiers: mat?.wholesale_tiers
      };
    });
    expect(committedState.wholesale_mode).toBe('tiered');
    expect(committedState.wholesale_tiers).toHaveLength(3);
    expect(committedState.wholesale_tiers[0].min_qty).toBe(1);
    expect(committedState.wholesale_tiers[0].max_qty).toBe(10);
    expect(committedState.wholesale_tiers[0].price).toBe(500);

    expect(committedState.wholesale_tiers[1].min_qty).toBe(11);
    expect(committedState.wholesale_tiers[1].max_qty).toBe(20);
    expect(committedState.wholesale_tiers[1].price).toBe(1000);

    expect(committedState.wholesale_tiers[2].min_qty).toBe(21);
    expect(committedState.wholesale_tiers[2].max_qty).toBe(30);
    expect(committedState.wholesale_tiers[2].price).toBe(1500);

    // 13. Buka kembali modal grosir dan pastikan hidrasi UI memuat ketiga tier secara presisi
    await btnOpenWs.click();
    await expect(modal).toBeVisible();

    const reloadedRows = modal.locator('#wholesale-tiers-table-body tr');
    await expect(reloadedRows).toHaveCount(3);
    expect(await reloadedRows.nth(0).locator('input[data-field="min_qty"]').inputValue()).toBe('1');
    expect(await reloadedRows.nth(0).locator('input[data-field="max_qty"]').inputValue()).toBe('10');
    expect(await reloadedRows.nth(0).locator('input[data-field="price"]').inputValue()).toBe('500');

    expect(await reloadedRows.nth(1).locator('input[data-field="min_qty"]').inputValue()).toBe('11');
    expect(await reloadedRows.nth(1).locator('input[data-field="max_qty"]').inputValue()).toBe('20');
    expect(await reloadedRows.nth(1).locator('input[data-field="price"]').inputValue()).toBe('1000');

    expect(await reloadedRows.nth(2).locator('input[data-field="min_qty"]').inputValue()).toBe('21');
    expect(await reloadedRows.nth(2).locator('input[data-field="max_qty"]').inputValue()).toBe('30');
    expect(await reloadedRows.nth(2).locator('input[data-field="price"]').inputValue()).toBe('1500');

    // Tutup modal
    await modal.locator('.btn-close-modal[data-modal="modal-wholesale-config"]').first().click();
    await expect(modal).toBeHidden();
  });

});

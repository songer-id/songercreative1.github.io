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
  test.describe(`TASK 2.10C-1 - Viewport: ${vp.name}`, () => {
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
        const ms = document.getElementById('mobile-preview-sheet');
        if (ms && window.innerWidth < 1024) {
          ms.classList.add('translate-y-full');
          ms.style.visibility = 'hidden';
          ms.style.pointerEvents = 'none';
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
      await page.locator('#input-prod-name').fill('Produk Uji Coba Spesifikasi Step 1');

      // Nonaktifkan toggle custom labels untuk uji transisi mulus
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

    test('1, 2, 5 & 11/12. Accordion Lainnya di Step 1: Input SKU dan Atribut Spesifikasi tampil & dapat digunakan', async ({ page }) => {
      await setupProductForm(page);

      // Skenario 1: Accordion Lainnya tersedia di Step 1
      const accordionGroup = page.locator('#accordion-group-others');
      await expect(accordionGroup).toBeVisible();

      const btnAccordion = page.locator('#btn-accordion-others');
      await expect(btnAccordion).toBeVisible();
      await expect(btnAccordion).toContainText('Lainnya');

      // Skenario 2: Komponen Atribut & Keterangan Spesifikasi Tambahan tampil
      const specsTable = page.locator('#custom-specs-table');
      await expect(specsTable).toBeAttached();

      const btnAddSpec = page.locator('#btn-add-spec-row');
      await expect(btnAddSpec).toBeVisible();
      await expect(btnAddSpec).toContainText('Tambah Baris Spesifikasi');

      const counter = page.locator('#custom-specs-counter');
      await expect(counter).toBeVisible();
      await expect(counter).toHaveText('0 / 10');

      // Skenario 5: Mengisi SKU di Step 1
      const inputSku = page.locator('#step-pane-1 #input-prod-sku');
      await expect(inputSku).toBeVisible();
      await inputSku.fill('SKU-KAOS-PREMIUM-001');

      const primaryStateSku = await page.evaluate(() => ProductForm.getPrimaryState().sku);
      expect(primaryStateSku).toBe('SKU-KAOS-PREMIUM-001');
    });

    test('3 & 4. Menambahkan dan menghapus atribut spesifikasi: state dan counter tersinkronisasi', async ({ page }) => {
      await setupProductForm(page);

      const btnAddSpec = page.locator('#btn-add-spec-row');
      const counter = page.locator('#custom-specs-counter');

      await expect(counter).toHaveText('0 / 10');

      // Tambah baris 1
      await btnAddSpec.click();
      await expect(counter).toHaveText('1 / 10');

      // Tambah baris 2
      await btnAddSpec.click();
      await expect(counter).toHaveText('2 / 10');

      // Isi baris 1: Bahan -> Katun Combed 30s
      const row0 = page.locator('#custom-specs-tbody tr.custom-spec-row').nth(0);
      await row0.locator('.input-spec-title').fill('Bahan');
      await row0.locator('.input-spec-value').fill('Katun Combed 30s');

      // Isi baris 2: Dimensi cetak -> A3+ Full Color
      const row1 = page.locator('#custom-specs-tbody tr.custom-spec-row').nth(1);
      await row1.locator('.input-spec-title').fill('Dimensi cetak');
      await row1.locator('.input-spec-value').fill('A3+ Full Color');

      // Skenario 3: Verifikasi state
      const stateSpecs = await page.evaluate(() => ProductForm.getPrimaryState().custom_specs);
      expect(stateSpecs.length).toBe(2);
      expect(stateSpecs[0]).toEqual({ title: 'Bahan', value: 'Katun Combed 30s' });
      expect(stateSpecs[1]).toEqual({ title: 'Dimensi cetak', value: 'A3+ Full Color' });

      // Skenario 4: Hapus baris 1 (Bahan)
      await row0.locator('.btn-delete-spec-row').click();
      await expect(counter).toHaveText('1 / 10');

      const stateAfterDelete = await page.evaluate(() => ProductForm.getPrimaryState().custom_specs);
      expect(stateAfterDelete.length).toBe(1);
      expect(stateAfterDelete[0]).toEqual({ title: 'Dimensi cetak', value: 'A3+ Full Color' });
    });

    test('6. Berpindah ke Step 2: Tidak ada editor spesifikasi atau SKU duplikat di Step 2 Card 6', async ({ page }) => {
      await setupProductForm(page);

      // Isi SKU dan satu spesifikasi di Step 1
      await page.locator('#step-pane-1 #input-prod-sku').fill('SKU-STEP1-TEST');
      await page.locator('#btn-add-spec-row').click();
      const row0 = page.locator('#custom-specs-tbody tr.custom-spec-row').nth(0);
      await row0.locator('.input-spec-title').fill('Bahan');
      await row0.locator('.input-spec-value').fill('Polyester');

      // Pindah ke Step 2
      await openStep2Form(page);

      // Periksa Card 6 Spesifikasi di Step 2
      const step2CardSpecs = page.locator('#card-step2-specs');
      await expect(step2CardSpecs).toBeVisible();

      // Verifikasi TIDAK ADA input SKU di dalam Step 2 Card 6
      const skuInStep2 = step2CardSpecs.locator('#input-prod-sku');
      await expect(skuInStep2).toHaveCount(0);

      // Verifikasi TIDAK ADA tabel custom specs atau tombol tambah di Step 2 Card 6
      const tableInStep2 = step2CardSpecs.locator('#custom-specs-table');
      await expect(tableInStep2).toHaveCount(0);

      const btnAddInStep2 = step2CardSpecs.locator('#btn-add-spec-row');
      await expect(btnAddInStep2).toHaveCount(0);

      // Verifikasi hanya ada tepat SATU input SKU di seluruh form (yaitu di Step 1)
      const allSkuInputs = page.locator('#input-prod-sku');
      await expect(allSkuInputs).toHaveCount(1);
    });

    test('7. Membuka drawer Spesifikasi di Step 2: Atribut dan SKU yang diisi pada Step 1 tampil', async ({ page }) => {
      await setupProductForm(page);

      // Isi SKU dan Atribut di Step 1
      await page.locator('#step-pane-1 #input-prod-sku').fill('SKU-IND-999');
      await page.locator('#btn-add-spec-row').click();
      const row0 = page.locator('#custom-specs-tbody tr.custom-spec-row').nth(0);
      await row0.locator('.input-spec-title').fill('Finishing Cetak');
      await row0.locator('.input-spec-value').fill('Laminasi Doff Panas');

      // Pindah ke Step 2
      await openStep2Form(page);

      if (vp.isMobile) {
        await page.evaluate(() => {
          ProductForm.openMobilePreview();
        });
        await page.waitForTimeout(300);
      }

      // Buka Drawer Spesifikasi via fungsi modul ProductForm
      await page.evaluate(() => {
        ProductForm.openProductSpecDrawer();
      });

      const drawerSheet = page.locator(vp.isMobile ? '#preview-scoped-modal-root-mob .spec-drawer-sheet' : '#preview-scoped-modal-root .spec-drawer-sheet');
      await expect(drawerSheet).toBeVisible();

      // Verifikasi SKU Induk tampil di dalam drawer spesifikasi
      await expect(drawerSheet).toContainText('SKU Induk');
      await expect(drawerSheet).toContainText('SKU-IND-999');

      // Verifikasi Finishing Cetak tampil di dalam drawer spesifikasi
      await expect(drawerSheet).toContainText('Finishing Cetak');
      await expect(drawerSheet).toContainText('Laminasi Doff Panas');

      // Tutup drawer
      await page.evaluate(() => {
        ProductForm.closeProductSpecDrawer();
        if (typeof ProductForm.closeMobilePreview === 'function') {
          ProductForm.closeMobilePreview();
        }
      });
      await expect(drawerSheet).toBeHidden();
    });

    test('8, 9 & 10. Siklus Penyimpanan, Edit, dan Proteksi Kebocoran Data Antarproduk', async ({ page }) => {
      await setupProductForm(page);

      // Skenario 8: Isi SKU dan spesifikasi di Step 1
      await page.locator('#step-pane-1 #input-prod-sku').fill('SKU-PROD-ALPHA');
      await page.locator('#btn-add-spec-row').click();
      const row0 = page.locator('#custom-specs-tbody tr.custom-spec-row').nth(0);
      await row0.locator('.input-spec-title').fill('Material Utama');
      await row0.locator('.input-spec-value').fill('Akrilik Marga Cipta 3mm');

      // Pindah ke Step 2 dan isi data penjualan minimal
      await openStep2Form(page);
      await page.locator('#input-single-price').fill('150000');
      await page.locator('#editor-prod-desc').fill('Deskripsi lengkap produk alpha spesifikasi.');

      // Simpan draf produk ke database via ProductForm.saveProduct(true)
      await page.evaluate(() => {
        ProductForm.saveProduct(true);
      });
      await page.waitForTimeout(600);

      const savedProduct = await page.evaluate(() => {
        const prods = DB.getProducts();
        return prods.find(p => p.sku === 'SKU-PROD-ALPHA') || prods[0];
      });

      expect(savedProduct).toBeTruthy();
      expect(savedProduct.sku).toBe('SKU-PROD-ALPHA');
      expect(savedProduct.custom_specs.length).toBe(1);
      expect(savedProduct.custom_specs[0]).toEqual({ title: 'Material Utama', value: 'Akrilik Marga Cipta 3mm' });

      // Skenario 9: Buka produk untuk diedit via AdminApp.navigate
      await page.evaluate((prodId) => {
        AdminApp.navigate('edit-product', prodId);
      }, savedProduct.id);

      await expect(page.locator('#view-product-form')).toBeVisible();
      const editSkuVal = await page.locator('#step-pane-1 #input-prod-sku').inputValue();
      expect(editSkuVal).toBe('SKU-PROD-ALPHA');

      const editCounter = await page.locator('#custom-specs-counter').innerText();
      expect(editCounter).toBe('1 / 10');

      const editTitleVal = await page.locator('#custom-specs-tbody tr.custom-spec-row .input-spec-title').inputValue();
      const editDescVal = await page.locator('#custom-specs-tbody tr.custom-spec-row .input-spec-value').inputValue();
      expect(editTitleVal).toBe('Material Utama');
      expect(editDescVal).toBe('Akrilik Marga Cipta 3mm');

      // Skenario 10: Membuka produk baru setelah mengedit produk lama -> TIDAK BOCOR
      await page.evaluate(() => {
        AdminApp.navigate('create-product');
      });

      const newProdSkuVal = await page.locator('#step-pane-1 #input-prod-sku').inputValue();
      expect(newProdSkuVal).toBe('');

      const newProdCounter = await page.locator('#custom-specs-counter').innerText();
      expect(newProdCounter).toBe('0 / 10');

      const newProdRows = await page.locator('#custom-specs-tbody tr.custom-spec-row').count();
      expect(newProdRows).toBe(0);

      const newPrimaryState = await page.evaluate(() => ProductForm.getPrimaryState());
      expect(newPrimaryState.sku).toBe('');
      expect(newPrimaryState.custom_specs).toEqual([]);
    });
  });
}

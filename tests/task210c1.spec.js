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
  test.describe(`REVISI TASK 2.10C-1 - Viewport: ${vp.name}`, () => {
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
      await page.locator('#input-prod-name').fill('Produk Uji Coba Spesifikasi Step 2');

      // Nonaktifkan toggle custom labels untuk uji transisi mulus
      await page.evaluate(() => {
        const toggle = document.getElementById('toggle-enable-custom-labels');
        if (toggle && toggle.checked) {
          toggle.click();
        }
        const p = ProductForm.getPrimaryState();
        if (p) {
          p.show_badge = false;
          p.has_custom_labels = false;
        }
      });
    }

    async function openStep2Form(page) {
      await page.evaluate(() => {
        const toggle = document.getElementById('toggle-enable-custom-labels');
        if (toggle && toggle.checked) {
          const l1 = document.getElementById('input-custom-label-1');
          if (!l1 || !l1.value.trim()) {
            toggle.click();
            const p = ProductForm.getPrimaryState();
            if (p) {
              p.show_badge = false;
              p.has_custom_labels = false;
            }
          }
        }
      });

      const btnNext = page.locator('#btn-step-1-next');
      if (await btnNext.isVisible()) {
        await btnNext.click();
      } else {
        await page.evaluate(() => {
          ProductForm.goToStep(2);
        });
      }
      await expect(page.locator('#step-pane-2')).toBeVisible();
      await expect(page.locator('#step-pane-1')).toBeHidden();

      // Buka gating kategori & subkategori agar Card 2 s/d Card 6 aktif
      const isCatDetermined = await page.evaluate(() => Boolean(ProductForm.getPrimaryState().category_id && ProductForm.getPrimaryState().sub_category_determined));
      if (!isCatDetermined) {
        await page.locator('#btn-step2-cat-trigger').click();
        await page.locator('.cat-option-item').first().click();
        await page.locator('#btn-step2-subcat-trigger').click();
        await page.locator('#opt-step2-subcat-none').click();
      }
    }

    test('1. Step 1 TIDAK memuat Accordion Lainnya atau SKU/Spesifikasi', async ({ page }) => {
      await setupProductForm(page);

      // Verifikasi section step1 input8 others TIDAK ADA
      const sectionOthers = page.locator('#section-step1-input8-others');
      await expect(sectionOthers).toHaveCount(0);

      const btnAccordionOthers = page.locator('#btn-accordion-others');
      await expect(btnAccordionOthers).toHaveCount(0);

      // Verifikasi SKU Induk tidak ada di Step 1
      const s1Sku = page.locator('#step-pane-1 #input-prod-sku');
      await expect(s1Sku).toHaveCount(0);

      // Verifikasi Custom Specs Table tidak ada di Step 1
      const s1SpecsTable = page.locator('#step-pane-1 #custom-specs-table');
      await expect(s1SpecsTable).toHaveCount(0);
    });

    test('2 & 3. Step 2 Card 6 Spesifikasi: SKU Induk dan Atribut Spesifikasi berada tepat di bawah Sistem PO', async ({ page }) => {
      await setupProductForm(page);
      await openStep2Form(page);

      const cardSpecs = page.locator('#card-step2-specs');
      await expect(cardSpecs).toBeVisible();

      // Input SKU Induk berada di Card 6 Spesifikasi
      const skuInput = cardSpecs.locator('#input-prod-sku');
      await expect(skuInput).toBeVisible();
      await skuInput.fill('SKU-CARD6-TEST');

      const primaryStateSku = await page.evaluate(() => ProductForm.getPrimaryState().sku);
      expect(primaryStateSku).toBe('SKU-CARD6-TEST');

      // Pre-Order toggle harus ada di Card 6
      const togglePreorder = cardSpecs.locator('#toggle-is-preorder');
      await expect(togglePreorder).toBeAttached();

      // Tabel Atribut & Spesifikasi Tambahan berada di Card 6 tepat di bawah Pre-Order
      const specsTable = cardSpecs.locator('#custom-specs-table');
      await expect(specsTable).toBeAttached();

      const btnAddSpec = cardSpecs.locator('#btn-add-spec-row');
      await expect(btnAddSpec).toBeVisible();

      const counter = cardSpecs.locator('#custom-specs-counter');
      await expect(counter).toBeVisible();
      await expect(counter).toHaveText('0 / 10');
    });

    test('4 & 5. Menambahkan, mengedit, dan menghapus baris spesifikasi di Step 2 Card 6', async ({ page }) => {
      await setupProductForm(page);
      await openStep2Form(page);

      const cardSpecs = page.locator('#card-step2-specs');
      const btnAddSpec = cardSpecs.locator('#btn-add-spec-row');
      const counter = cardSpecs.locator('#custom-specs-counter');

      await expect(counter).toHaveText('0 / 10');

      // Tambah baris 1
      await btnAddSpec.click();
      await expect(counter).toHaveText('1 / 10');

      // Tambah baris 2
      await btnAddSpec.click();
      await expect(counter).toHaveText('2 / 10');

      // Isi baris 1: Bahan -> Katun Combed 30s
      const row0 = cardSpecs.locator('#custom-specs-tbody tr.custom-spec-row').nth(0);
      await row0.locator('.input-spec-title').fill('Bahan');
      await row0.locator('.input-spec-value').fill('Katun Combed 30s');

      // Isi baris 2: Dimensi cetak -> A3+ Full Color
      const row1 = cardSpecs.locator('#custom-specs-tbody tr.custom-spec-row').nth(1);
      await row1.locator('.input-spec-title').fill('Dimensi cetak');
      await row1.locator('.input-spec-value').fill('A3+ Full Color');

      // Verifikasi state
      const stateSpecs = await page.evaluate(() => ProductForm.getPrimaryState().custom_specs);
      expect(stateSpecs.length).toBe(2);
      expect(stateSpecs[0]).toEqual({ title: 'Bahan', value: 'Katun Combed 30s' });
      expect(stateSpecs[1]).toEqual({ title: 'Dimensi cetak', value: 'A3+ Full Color' });

      // Hapus baris 1 (Bahan)
      await row0.locator('.btn-delete-spec-row').click();
      await expect(counter).toHaveText('1 / 10');

      const stateAfterDelete = await page.evaluate(() => ProductForm.getPrimaryState().custom_specs);
      expect(stateAfterDelete.length).toBe(1);
      expect(stateAfterDelete[0]).toEqual({ title: 'Dimensi cetak', value: 'A3+ Full Color' });
    });

    test('6. Membuka drawer Spesifikasi di Step 2: Atribut dan SKU tampil pada pratinjau', async ({ page }) => {
      await setupProductForm(page);
      await openStep2Form(page);

      const cardSpecs = page.locator('#card-step2-specs');
      await cardSpecs.locator('#input-prod-sku').fill('SKU-PREVIEW-999');

      await cardSpecs.locator('#btn-add-spec-row').click();
      const row0 = cardSpecs.locator('#custom-specs-tbody tr.custom-spec-row').nth(0);
      await row0.locator('.input-spec-title').fill('Finishing Cetak');
      await row0.locator('.input-spec-value').fill('Laminasi Doff Panas');

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
      await expect(drawerSheet).toContainText('SKU-PREVIEW-999');

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

    test('7. Siklus Penyimpanan, Edit Ulang, dan Proteksi Kebocoran Data', async ({ page }) => {
      await setupProductForm(page);
      await openStep2Form(page);

      const cardSpecs = page.locator('#card-step2-specs');
      await cardSpecs.locator('#input-prod-sku').fill('SKU-PROD-STEP2');

      await cardSpecs.locator('#btn-add-spec-row').click();
      const row0 = cardSpecs.locator('#custom-specs-tbody tr.custom-spec-row').nth(0);
      await row0.locator('.input-spec-title').fill('Material Utama');
      await row0.locator('.input-spec-value').fill('Akrilik 3mm');

      await page.locator('#input-single-price').fill('150000');
      await page.evaluate(() => {
        const ed = document.getElementById('editor-prod-desc');
        if (ed) {
          ed.innerHTML = '<p>Deskripsi produk step 2.</p>';
          ed.dispatchEvent(new Event('input', { bubbles: true }));
        }
        ProductForm.getPrimaryState().description = '<p>Deskripsi produk step 2.</p>';
        ProductForm.saveProduct(true);
      });
      await page.waitForTimeout(600);

      const savedProduct = await page.evaluate(() => {
        const prods = DB.getProducts();
        return prods.find(p => p.sku === 'SKU-PROD-STEP2') || prods[0];
      });

      expect(savedProduct).toBeTruthy();
      expect(savedProduct.sku).toBe('SKU-PROD-STEP2');
      expect(savedProduct.custom_specs.length).toBe(1);
      expect(savedProduct.custom_specs[0]).toEqual({ title: 'Material Utama', value: 'Akrilik 3mm' });

      // Edit produk
      await page.evaluate((prodId) => {
        AdminApp.navigate('edit-product', prodId);
        const p = ProductForm.getPrimaryState();
        if (p) {
          p.show_badge = false;
          p.has_custom_labels = false;
        }
      }, savedProduct.id);

      await expect(page.locator('#view-product-form')).toBeVisible();

      // Pindah ke Step 2 untuk melihat data yang diedit
      await openStep2Form(page);

      const editCardSpecs = page.locator('#card-step2-specs');
      const editSkuVal = await editCardSpecs.locator('#input-prod-sku').inputValue();
      expect(editSkuVal).toBe('SKU-PROD-STEP2');

      const editCounter = await editCardSpecs.locator('#custom-specs-counter').innerText();
      expect(editCounter).toBe('1 / 10');

      const editTitle = await editCardSpecs.locator('#custom-specs-tbody tr.custom-spec-row .input-spec-title').inputValue();
      const editVal = await editCardSpecs.locator('#custom-specs-tbody tr.custom-spec-row .input-spec-value').inputValue();
      expect(editTitle).toBe('Material Utama');
      expect(editVal).toBe('Akrilik 3mm');

      // Buka produk baru -> TIDAK BOCOR
      await page.evaluate(() => {
        AdminApp.navigate('create-product');
      });

      await expect(page.locator('#step-pane-1')).toBeVisible();

      // Isi field wajib Step 1 agar bisa ke Step 2
      await page.locator('label:has-text("Fisik")').first().click();
      await page.locator('label:has-text("Kartu Klasik")').first().click();
      await page.locator('#input-prod-image').setInputFiles({
        name: 'test-item-new.png',
        mimeType: 'image/png',
        buffer: DUMMY_PNG_BUFFER
      });
      await page.locator('#input-prod-name').fill('Produk Baru Segar Bebas Bocor');
      await page.evaluate(() => {
        const p = ProductForm.getPrimaryState();
        if (p) {
          p.show_badge = false;
          p.has_custom_labels = false;
        }
      });

      await openStep2Form(page);

      const newCardSpecs = page.locator('#card-step2-specs');
      const newSkuVal = await newCardSpecs.locator('#input-prod-sku').inputValue();
      expect(newSkuVal).toBe('');

      const newCounter = await newCardSpecs.locator('#custom-specs-counter').innerText();
      expect(newCounter).toBe('0 / 10');

      const newRows = await newCardSpecs.locator('#custom-specs-tbody tr.custom-spec-row').count();
      expect(newRows).toBe(0);

      const newPrimaryState = await page.evaluate(() => ProductForm.getPrimaryState());
      expect(newPrimaryState.sku).toBe('');
      expect(newPrimaryState.custom_specs).toEqual([]);
    });
  });
}

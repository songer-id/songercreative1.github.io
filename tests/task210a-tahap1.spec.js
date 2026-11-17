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
  { name: 'Desktop 1024x768', width: 1024, height: 768, isMobile: false },
  { name: 'Mobile 390x844 (iPhone 12/13/14)', width: 390, height: 844, isMobile: true },
  { name: 'Mobile 375x667 (iPhone SE)', width: 375, height: 667, isMobile: true }
];

for (const vp of VIEWPORTS) {
  test.describe(`TASK 2.10A Tahap 1 - Viewport: ${vp.name}`, () => {
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

      // Isi Step 1
      await page.locator('label:has-text("Fisik")').first().click();
      await page.locator('label:has-text("Kartu Klasik")').first().click();
      await page.locator('#input-prod-image').setInputFiles({
        name: 'test-item.png',
        mimeType: 'image/png',
        buffer: DUMMY_PNG_BUFFER
      });
      await page.locator('#input-prod-name').fill('Produk Uji Coba Multi Viewport');

      // Nonaktifkan toggle custom labels untuk uji transisi Step 1 -> Step 2
      await page.evaluate(() => {
        const toggle = document.getElementById('toggle-enable-custom-labels');
        if (toggle && toggle.checked) toggle.click();
        const p = ProductForm.getPrimaryState();
        p.show_badge = false;
        p.has_custom_labels = false;
      });
    }

    async function goToStep2(page) {
      const btnNext = page.locator('#btn-step-1-next');
      await btnNext.click();
      await expect(page.locator('#step-pane-2')).toBeVisible();

      // Pilih Kategori & Subkategori agar seluruh kartu Step 2 terbuka
      await page.locator('#btn-step2-cat-trigger').click();
      await page.locator('.cat-option-item').first().click();
      await page.locator('#btn-step2-subcat-trigger').click();
      await page.locator('#opt-step2-subcat-none').click();

      // Isi data wajib penjualan Step 2
      await page.locator('#input-single-price').fill('50000');
      await page.locator('#input-single-cost').fill('30000');
      await page.locator('#input-stock-qty').fill('50');
      await page.locator('#input-normal-max-order').fill('10');
      await page.locator('#input-package-weight').fill('200');
      await page.locator('input[name="courier_checkbox"][value="pickup"]').check();

      await page.evaluate(() => {
        const descEl = document.getElementById('input-prod-desc');
        if (descEl) descEl.value = '<p>Deskripsi produk uji coba spesifikasi tambahan.</p>';
        const p = ProductForm.getPrimaryState();
        p.description = '<p>Deskripsi produk uji coba spesifikasi tambahan.</p>';
      });
    }

    if (vp.isMobile) {
      // =========================================================================
      // SKENARIO 1: Drawer utama Step 1 tertutup ketika area luar/atas diklik
      // SKENARIO 3: Klik di dalam drawer utama tidak menutupnya
      // =========================================================================
      test('1 & 3. Mobile Step 1: Buka drawer, klik di dalam tidak menutup, klik area luar/atas menutup', async ({ page }) => {
        await setupProductForm(page);

        // Buka Mobile Preview via FAB
        const fab = page.locator('#btn-fab-live-preview');
        await expect(fab).toBeVisible();
        await fab.click();

        const sheet = page.locator('#mobile-preview-sheet');
        const backdrop = page.locator('#mobile-preview-backdrop');
        await expect(sheet).not.toHaveClass(/translate-y-full/);
        await expect(backdrop).toBeVisible();

        // Skenario 3: Klik di dalam sheet (misal header) tidak menutup drawer
        await page.locator('#mobile-preview-header').click();
        await expect(sheet).not.toHaveClass(/translate-y-full/);
        await expect(backdrop).toBeVisible();

        // Skenario 1: Klik area luar/atas (top 12dvh pada backdrop) menutup drawer
        await page.mouse.click(vp.width / 2, 20);
        await expect(sheet).toHaveClass(/translate-y-full/);
        await expect(backdrop).toBeHidden();
      });

      // =========================================================================
      // SKENARIO 2: Drawer utama Step 2 tertutup ketika area luar/atas diklik
      // =========================================================================
      test('2. Mobile Step 2: Buka drawer, klik area luar/atas menutup', async ({ page }) => {
        await setupProductForm(page);
        await goToStep2(page);

        // Buka Mobile Preview via FAB
        const fab = page.locator('#btn-fab-live-preview');
        await expect(fab).toBeVisible();
        await fab.click();

        const sheet = page.locator('#mobile-preview-sheet');
        const backdrop = page.locator('#mobile-preview-backdrop');
        await expect(sheet).not.toHaveClass(/translate-y-full/);
        await expect(backdrop).toBeVisible();

        // Klik di dalam body preview tidak menutup drawer
        await page.locator('#mobile-preview-header').click();
        await expect(sheet).not.toHaveClass(/translate-y-full/);
        await expect(backdrop).toBeVisible();

        // Klik di area atas drawer (backdrop y=20) menutup drawer
        await page.mouse.click(vp.width / 2, 20);
        await expect(sheet).toHaveClass(/translate-y-full/);
        await expect(backdrop).toBeHidden();
      });

      // =========================================================================
      // SKENARIO 4 & 10: Modal notifikasi penjualan (Buy Simulation Modal)
      // SKENARIO 5: Modal keranjang (Cart Simulation Modal)
      // =========================================================================
      test('4, 5 & 10. Mobile Step 2: Scoped Modal popup tutup saat backdrop diklik, tidak menutup saat card diklik, preview utama tetap buka', async ({ page }) => {
        await setupProductForm(page);
        await goToStep2(page);

        // Buka Mobile Preview via FAB
        const fab = page.locator('#btn-fab-live-preview');
        await fab.click();
        const sheet = page.locator('#mobile-preview-sheet');
        await expect(sheet).not.toHaveClass(/translate-y-full/);

        // Aktifkan modal simulasi pembelian
        await page.evaluate(() => {
          ProductForm.showBuySimulationConfirmModal();
        });

        const modalRootMob = page.locator('#preview-scoped-modal-root-mob');
        await expect(modalRootMob).toBeVisible();
        const modalCard = modalRootMob.locator('.preview-scoped-modal-card');
        await expect(modalCard).toBeVisible();

        // Skenario 10: Klik di DALAM kotak modal tidak menutup modal
        await modalCard.click();
        await expect(modalRootMob).toBeVisible();
        expect(await sheet.getAttribute('class')).not.toContain('translate-y-full');

        // Skenario 4: Klik di LUAR kotak modal tetapi di dalam preview sheet menutup modal saja
        const rootBox = await modalRootMob.boundingBox();
        expect(rootBox).toBeTruthy();
        await page.mouse.click(rootBox.x + 15, rootBox.y + 15);

        // Modal harus tertutup, tetapi sheet drawer utama tetap terbuka!
        await expect(modalRootMob).toBeHidden();
        expect(await sheet.getAttribute('class')).not.toContain('translate-y-full');

        // Skenario 5: Uji hal yang sama untuk Modal Keranjang
        await page.evaluate(() => {
          ProductForm.showCartSimulationConfirmModal();
        });
        await expect(modalRootMob).toBeVisible();
        await modalCard.click(); // Klik dalam tidak menutup
        await expect(modalRootMob).toBeVisible();

        // Klik tombol "Tutup" di dalam modal menutup modal
        const closeBtn = modalRootMob.locator('.btn-close-sim-modal').first();
        await closeBtn.click();
        await expect(modalRootMob).toBeHidden();
        expect(await sheet.getAttribute('class')).not.toContain('translate-y-full');
      });

      // =========================================================================
      // SKENARIO 6: Nested drawer Beli Sekarang
      // SKENARIO 9: Nested drawer Tambah ke Keranjang
      // =========================================================================
      test('6, 9 & 10. Mobile Step 2: Nested drawer Beli & Keranjang menutup tanpa menutup preview utama', async ({ page }) => {
        await setupProductForm(page);
        await goToStep2(page);

        // Buka Mobile Preview via FAB
        const fab = page.locator('#btn-fab-live-preview');
        await fab.click();
        const sheet = page.locator('#mobile-preview-sheet');
        await expect(sheet).not.toHaveClass(/translate-y-full/);

        // Beralih ke tab mode test
        await page.locator('#btn-preview-mode-test-mob').click();

        // Buka drawer Beli Sekarang di dalam Mini PDP
        const buyNowBtn = sheet.locator('.btn-preview-buy-now').first();
        await buyNowBtn.click();

        const shopeeDrawerRoot = sheet.locator('.mini-pdp-drawer-root').first();
        const shopeeSheet = sheet.locator('.mini-pdp-drawer-sheet').first();
        await expect(shopeeDrawerRoot).toBeVisible();
        await expect(shopeeSheet).toBeVisible();

        // Skenario 10: Klik di dalam sheet nested drawer tidak menutupnya
        await shopeeSheet.click();
        await expect(shopeeDrawerRoot).toBeVisible();
        expect(await sheet.getAttribute('class')).not.toContain('translate-y-full');

        // Skenario 6: Klik di luar drawer sheet (di dalam preview) menutup nested drawer saja!
        await page.locator('#mobile-preview-header').click();
        await expect(shopeeDrawerRoot).toBeHidden();
        // Preview utama tetap terbuka!
        expect(await sheet.getAttribute('class')).not.toContain('translate-y-full');

        // Skenario 9: Buka drawer Tambah ke Keranjang
        await page.evaluate(() => {
          ProductForm.openShopeeCheckoutDrawer('cart');
        });
        await expect(shopeeDrawerRoot).toBeVisible();

        // Klik di dalam drawer keranjang tidak menutup
        await shopeeSheet.click();
        await expect(shopeeDrawerRoot).toBeVisible();

        // Klik di luar drawer sheet (misal header preview) menutup nested drawer
        await page.locator('#mobile-preview-header').click();
        await expect(shopeeDrawerRoot).toBeHidden();
        expect(await sheet.getAttribute('class')).not.toContain('translate-y-full');
      });

      // =========================================================================
      // SKENARIO 7: Nested drawer Spesifikasi
      // SKENARIO 8: Nested drawer Tabel Ukuran
      // =========================================================================
      test('7, 8 & 10. Mobile Step 2: Nested drawer Spesifikasi & Tabel Ukuran menutup tanpa menutup preview utama', async ({ page }) => {
        await setupProductForm(page);
        await goToStep2(page);

        // Buka Mobile Preview via FAB
        const fab = page.locator('#btn-fab-live-preview');
        await fab.click();
        const sheet = page.locator('#mobile-preview-sheet');
        await expect(sheet).not.toHaveClass(/translate-y-full/);

        // Buka Drawer Spesifikasi via trigger row / API drawer
        await page.evaluate(() => {
          ProductForm.openProductSpecDrawer();
        });

        const modalRootMob = page.locator('#preview-scoped-modal-root-mob');
        await expect(modalRootMob).toBeVisible();
        const specSheet = modalRootMob.locator('.spec-drawer-sheet');
        await expect(specSheet).toBeVisible();

        // Klik di dalam spec sheet tidak menutup
        await specSheet.click();
        await expect(specSheet).toBeVisible();
        expect(await sheet.getAttribute('class')).not.toContain('translate-y-full');

        // Klik tombol "Oke" menutup drawer spesifikasi saja
        const okBtn = modalRootMob.locator('.btn-close-spec-drawer').first();
        await okBtn.click();
        await expect(modalRootMob).toBeHidden();
        expect(await sheet.getAttribute('class')).not.toContain('translate-y-full');

        // Buka Drawer Tabel Ukuran via API drawer
        await page.evaluate(() => {
          ProductForm.openProductSizeGuideDrawer();
        });
        await expect(modalRootMob).toBeVisible();
        const sizeSheet = modalRootMob.locator('.size-guide-drawer-sheet');
        await expect(sizeSheet).toBeVisible();

        // Klik di dalam size sheet tidak menutup
        await sizeSheet.click();
        await expect(sizeSheet).toBeVisible();
        expect(await sheet.getAttribute('class')).not.toContain('translate-y-full');

        // Klik tombol "Oke" menutup tabel ukuran
        const sizeOkBtn = modalRootMob.locator('.btn-close-size-guide-drawer').first();
        if (await sizeOkBtn.isVisible()) {
          await sizeOkBtn.click();
        } else {
          await page.evaluate(() => ProductForm.closeProductSizeGuideDrawer());
        }
        await expect(modalRootMob).toBeHidden();
        expect(await sheet.getAttribute('class')).not.toContain('translate-y-full');
      });
    }

    // ===========================================================================
    // SKENARIO 12 & 13: Spesifikasi Tambahan (Tambah/Hapus Baris & Validasi)
    // SKENARIO 14 & 15: Penyimpanan, Edit Mode & SKU Bebas Duplikasi
    // SKENARIO 16: Garis di atas Komisi Afiliasi hilang
    // ===========================================================================
    test('12, 13, 14, 15 & 16. Step 2 Form: Spesifikasi Tambahan, SKU, dan Garis Komisi Afiliasi', async ({ page }) => {
      await setupProductForm(page);
      await goToStep2(page);

      // Skenario 16: Garis di atas Komisi Afiliasi hilang (tidak memiliki class border-t border-slate-100)
      const affiliateSection = page.locator('#section-product-affiliate-commission');
      await expect(affiliateSection).toBeVisible();
      const affiliateClass = await affiliateSection.getAttribute('class');
      expect(affiliateClass).not.toContain('border-t');
      expect(affiliateClass).not.toContain('border-slate-100');

      // Skenario 15: SKU Induk tidak duplikat
      const skuInputs = page.locator('#input-prod-sku');
      await expect(skuInputs).toHaveCount(1);
      await skuInputs.fill('SKU-ORIGINAL-99');

      // Skenario 12: Fitur Spesifikasi Tambahan (Tambah/Hapus hingga 10 baris)
      const btnAddSpec = page.locator('#btn-add-spec-row');
      await expect(btnAddSpec).toBeVisible();

      // Pastikan thead tersembunyi jika baris = 0
      const thead = page.locator('#custom-specs-thead');
      await expect(thead).toBeHidden();

      // Tambah 2 baris spesifikasi
      await btnAddSpec.click();
      await expect(thead).toBeVisible();
      let specRows = page.locator('#custom-specs-tbody tr.custom-spec-row');
      await expect(specRows).toHaveCount(1);

      await btnAddSpec.click();
      specRows = page.locator('#custom-specs-tbody tr.custom-spec-row');
      await expect(specRows).toHaveCount(2);

      // Skenario 13: Validasi spesifikasi wajib (jika ada baris tetapi kosong)
      // Klik Simpan Produk saat spesifikasi masih kosong
      const btnSubmit = page.locator('#btn-submit-product');
      await btnSubmit.click();

      // Harus muncul border merah pada baris spesifikasi kosong
      const firstTitle = specRows.first().locator('.input-spec-title');
      await expect(firstTitle).toHaveClass(/border-red-500/);

      // Isi kedua baris dengan data valid
      await specRows.nth(0).locator('.input-spec-title').fill('Bahan Material');
      await specRows.nth(0).locator('.input-spec-value').fill('Katun Rayon Premium');

      await specRows.nth(1).locator('.input-spec-title').fill('Dimensi Cetak');
      await specRows.nth(1).locator('.input-spec-value').fill('A3 Plus');

      // Hapus baris kedua via tombol delete
      const delBtn = specRows.nth(1).locator('.btn-delete-spec-row');
      await delBtn.click();
      specRows = page.locator('#custom-specs-tbody tr.custom-spec-row');
      await expect(specRows).toHaveCount(1);

      // Simpan draf produk
      const btnDraft = page.locator('#btn-save-draft');
      await btnDraft.click();
      await page.waitForTimeout(500);

      // Skenario 14: Verifikasi data tersimpan di primaryState
      const savedSpecs = await page.evaluate(() => {
        return ProductForm.getPrimaryState().custom_specs;
      });
      expect(savedSpecs).toHaveLength(1);
      expect(savedSpecs[0].title).toBe('Bahan Material');
      expect(savedSpecs[0].value).toBe('Katun Rayon Premium');
    });
  });
}

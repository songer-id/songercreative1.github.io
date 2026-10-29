// @ts-check
const { test, expect } = require('@playwright/test');
const { injectDeterministicStorage, TEST_PRODUCT, TEST_TENANT } = require('./fixtures/test-data');

test.describe('POS Songer Creative - Smoke Tests (Tahap 3)', () => {

  /**
   * SMOKE TEST 1:
   * Memastikan Halaman Admin SPA dapat dimuat dengan sempurna,
   * viewport dan elemen navigasi pokok tersedia tanpa crash runtime.
   */
  test('Smoke Test 1: Halaman Admin dapat dimuat dan elemen utama tersedia', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => {
      // Catat unhandled exception dari window
      pageErrors.push(err.message);
    });

    // 1. Suntikkan sesi storage deterministik (terotentikasi)
    await injectDeterministicStorage(page, { authenticated: true });

    // 2. Buka halaman admin
    const response = await page.goto('/admin.html');
    expect(response?.status()).toBe(200);

    // 3. Verifikasi elemen struktural inti Admin SPA
    const mainViewport = page.locator('#admin-main-viewport');
    await expect(mainViewport).toBeVisible({ timeout: 10000 });

    const sidebar = page.locator('#admin-main-sidebar');
    await expect(sidebar).toBeVisible();

    // Verifikasi menu navigasi utama
    const navDashboard = page.locator('#admin-nav-dashboard');
    const navProducts = page.locator('#admin-nav-products');
    const navPos = page.locator('#admin-nav-pos');

    await expect(navDashboard).toBeAttached();
    await expect(navProducts).toBeAttached();
    await expect(navPos).toBeAttached();

    // 4. Pastikan tidak ada unhandled JavaScript runtime error yang merusak halaman
    expect(pageErrors, `Unhandled errors in Admin: ${pageErrors.join('; ')}`).toHaveLength(0);
  });

  /**
   * SMOKE TEST 2:
   * Memastikan Dedicated PDP (product.html) dapat dimuat dengan lancar
   * membaca data uji deterministik via query parameter (?id=...) tanpa error fatal.
   */
  test('Smoke Test 2: Halaman PDP dapat dimuat tanpa kesalahan fatal menggunakan data uji yang valid', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    // 1. Suntikkan data produk dan tenant deterministik ke localStorage
    await injectDeterministicStorage(page, { authenticated: false });

    // 2. Buka halaman PDP dengan ID produk uji yang valid
    const targetUrl = `/product.html?id=${TEST_PRODUCT.id}`;
    const response = await page.goto(targetUrl);
    expect(response?.status()).toBe(200);

    // 3. Verifikasi wadah konten PDP aktif
    const pdpContent = page.locator('#pdp-content');
    await expect(pdpContent).toBeVisible({ timeout: 10000 });

    // 4. Verifikasi judul produk ter-render sesuai data fixture
    const productTitle = page.locator('#pdp-product-title');
    await expect(productTitle).toBeVisible();
    await expect(productTitle).toContainText(TEST_PRODUCT.name);

    // 5. Verifikasi komponen live price dan input kuantitas
    const livePrice = page.locator('#pdp-live-price');
    await expect(livePrice).toBeVisible();

    const inputQty = page.locator('#pdp-input-qty');
    await expect(inputQty).toBeVisible();
    await expect(inputQty).toHaveValue('1');

    // 6. Verifikasi tombol CTA beli/keranjang terpasang di DOM
    const btnBuyNow = page.locator('#btn-buy-now-pdp');
    const btnAddToCart = page.locator('#btn-add-to-cart');
    await expect(btnBuyNow).toBeAttached();
    await expect(btnAddToCart).toBeAttached();

    // 7. Pastikan tidak ada unhandled runtime crash
    expect(pageErrors, `Unhandled errors in PDP: ${pageErrors.join('; ')}`).toHaveLength(0);
  });

});


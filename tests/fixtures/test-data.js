/**
 * POS BY SONGER CREATIVE - DETERMINISTIC TEST FIXTURES & DATA ISOLATION
 * Provides reproducible mock state for Playwright tests.
 * Isolates test data by injecting isolated localStorage & sessionStorage keys per test run.
 */

const TEST_TENANT = {
  tenant_id: 'tenant-test-e2e',
  store_slug: 'songer-test-store',
  store_name: 'Songer Test Percetakan',
  store_phone: '081234567890',
  store_address: 'Jl. Percetakan Uji No. 99, Yogyakarta',
  package: 'PAKET_B_PRO_CALCULATOR',
  status: 'active',
  created_at: '2026-10-01T00:00:00.000Z'
};

const TEST_CATEGORY = {
  id: 'cat_test_001',
  name: 'Spanduk & Banner Outdoor',
  slug: 'spanduk-banner-outdoor',
  order_index: 0,
  icon: 'printer',
  is_active: true
};

const TEST_PRODUCT = {
  id: 'prod-test-pdp-001',
  tenant_id: 'tenant-test-e2e',
  name: 'Spanduk Banner Flexi Korea 440gr Outdoor',
  slug: 'spanduk-banner-flexi-korea-440gr',
  category_id: 'cat_test_001',
  sub_category_id: null,
  card_variant: 'A',
  price_type: 1, // Meter PxL
  price: 65000,
  stock: 250,
  is_unlimited_stock: false,
  product_type: 'physical',
  min_order: 1,
  max_order: 100,
  has_order_multiple: true,
  order_multiple_value: 5,
  has_wholesale: true,
  wholesale_mode: null,
  wholesale_tiers: [],
  description: 'Spanduk Flexi Korea 440gr kualitas cetak outdoor 300 DPI tahan panas dan hujan.',
  image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%2333b589"/><text x="80" y="210" fill="white" font-size="28" font-family="sans-serif">Flexi Korea</text></svg>',
  images: [
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%2333b589"/><text x="80" y="210" fill="white" font-size="28" font-family="sans-serif">Flexi Korea</text></svg>'
  ],
  image_aspect_ratio: '1:1',
  has_variants: true,
  materials: [
    {
      id: 'mat_flexi_001',
      name: 'Flexi Korea 440gr Standar',
      price: 65000,
      cost_price: 35000,
      stock: 250,
      min_order: 1,
      max_order: 100,
      order_multiple: 5,
      order_multiple_value: 5,
      order_multiple_type: 'spesifik',
      wholesale_mode: null,
      wholesale_tiers: []
    }
  ],
  finishings: {
    main: [
      { id: 'fin_001', name: 'Mata Ayam Tiap Sudut', price: 5000, cost_price: 1500 }
    ],
    extra_1: [],
    extra_2: [],
    extra_3: []
  },
  custom_dim_config: {
    min_length: 10,
    min_width: 10,
    min_area_m2: 1.0,
    round_up_decimal: 2
  },
  is_active: true,
  status: 'published',
  created_at: '2026-10-25T00:00:00.000Z',
  updated_at: '2026-10-29T00:00:00.000Z'
};

const TEST_SETTINGS = {
  store_name: 'Songer Test Percetakan',
  store_phone: '081234567890',
  color_primary: '#33b589',
  color_secondary: '#f59e0b',
  printer_paper_width: '58mm',
  footer_nota_text: 'Terima kasih atas pesanan Anda di Songer Creative.',
  is_ppn_enabled: false,
  ppn_rate: 11
};

/**
 * Menyuntikkan data uji deterministik ke dalam localStorage & sessionStorage browser
 * sebelum halaman web memuat skrip aplikasi.
 * @param {import('@playwright/test').Page} page
 * @param {Object} [options]
 * @param {boolean} [options.authenticated=true] Set true untuk langsung mengotentikasi sesi admin
 */
async function injectDeterministicStorage(page, options = { authenticated: true }) {
  await page.addInitScript(({ tenant, category, product, settings, opts }) => {
    try {
      const tid = tenant.tenant_id;
      window.localStorage.clear();
      window.sessionStorage.clear();

      const prods = opts && opts.products ? opts.products : (opts && opts.product ? [opts.product] : [product]);
      const allMaterials = [];
      const allFinishings = [];

      prods.forEach(p => {
        if (Array.isArray(p.materials)) {
          p.materials.forEach(m => allMaterials.push({ ...m, product_id: p.id }));
        }
        if (p.finishings) {
          if (Array.isArray(p.finishings)) {
            p.finishings.forEach(f => allFinishings.push({ ...f, product_id: p.id }));
          } else {
            ['main', 'extra_1', 'extra_2', 'extra_3'].forEach(tier => {
              if (Array.isArray(p.finishings[tier])) {
                p.finishings[tier].forEach(f => allFinishings.push({ ...f, tier, product_id: p.id }));
              }
            });
          }
        }
      });

      window.localStorage.setItem('pos_current_tenant_slug', tenant.store_slug);
      window.localStorage.setItem('pos_tenants_registry', JSON.stringify([tenant]));
      window.localStorage.setItem(`pos_categories_${tid}`, JSON.stringify([category]));
      window.localStorage.setItem(`pos_products_${tid}`, JSON.stringify(prods));
      window.localStorage.setItem(`pos_materials_${tid}`, JSON.stringify(allMaterials));
      window.localStorage.setItem(`pos_finishings_${tid}`, JSON.stringify(allFinishings));
      window.localStorage.setItem(`pos_settings_${tid}`, JSON.stringify(settings));
      window.localStorage.setItem(`pos_orders_${tid}`, JSON.stringify([]));
      window.localStorage.setItem(`pos_customers_${tid}`, JSON.stringify([]));

      if (opts && opts.authenticated) {
        window.sessionStorage.setItem('pos_admin_logged_in', 'true');
        window.sessionStorage.setItem('pos_admin_store_slug', tenant.store_slug);
        window.localStorage.setItem('pos_admin_logged_in', 'true');
        window.localStorage.setItem('pos_admin_store_slug', tenant.store_slug);
      }
    } catch (e) {
      console.error('[TEST-FIXTURE] Gagal menyuntikkan storage:', e);
    }
  }, {
    tenant: TEST_TENANT,
    category: TEST_CATEGORY,
    product: TEST_PRODUCT,
    settings: TEST_SETTINGS,
    opts: options
  });
}

module.exports = {
  TEST_TENANT,
  TEST_CATEGORY,
  TEST_PRODUCT,
  TEST_SETTINGS,
  injectDeterministicStorage
};

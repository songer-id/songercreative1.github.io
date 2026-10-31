// @ts-check
const { test, expect } = require('@playwright/test');
const VariationEngine = require('../js/variation-engine');
const {
  TEST_TENANT,
  TEST_CATEGORY,
  TEST_PRODUCT,
  injectDeterministicStorage
} = require('./fixtures/test-data');

test.describe('POS Songer Creative - Task 02E: Seller Variation Dependency Configuration UI', () => {

  /**
   * Deterministic reference sticker product fixture with 4 variation tiers
   */
  function createReferenceProduct(overrides = {}) {
    return {
      ...TEST_PRODUCT,
      id: 'prod-config-sticker-001',
      name: 'Stiker Custom Multi-Variasi Config UI',
      product_type: 'physical',
      card_variant: 'A',
      show_badge: false,
      has_custom_labels: false,
      has_variants: true,
      has_variation_2: true,
      has_variation_3: true,
      has_variation_4: true,
      has_wholesale: false,
      has_order_multiple: false,
      has_extra_service: false,
      variation_labels: {
        label_product: 'Produk',
        label_tier_1: 'Variasi 1',
        label_tier_2: 'Variasi 2',
        label_extra_1: 'Variasi 3',
        label_extra_2: 'Variasi 4'
      },
      stock_mode_tiers: { tier1: 'same', main: 'same', extra_1: 'same', extra_2: 'same' },
      materials: [
        { id: 'v1_bontax', name: 'Bontax', price: 5000, cost_price: 2500, stock: 100, max_order: 1000 },
        { id: 'v1_vinyl', name: 'Vinyl', price: 7000, cost_price: 3500, stock: 100, max_order: 1000 },
        { id: 'v1_hologram', name: 'Hologram', price: 7000, cost_price: 3500, stock: 100, max_order: 1000 },
        { id: 'v1_transparan', name: 'Transparan', price: 8000, cost_price: 4000, stock: 100, max_order: 1000 }
      ],
      finishings: {
        main: [
          { id: 'v2_kisscut', name: 'Kisscut', price: 3000, cost_price: 1000, stock: 100 },
          { id: 'v2_diecut', name: 'Diecut', price: 4000, cost_price: 1500, stock: 100 },
          { id: 'v2_potong_biasa', name: 'Potong Biasa', price: 0, cost_price: 0, stock: 100 },
          { id: 'v2_lembaran', name: 'Lembaran', price: 0, cost_price: 0, stock: 100 }
        ],
        extra_1: [
          { id: 'v3_oval', name: 'Oval / Bulat', price: 0, cost_price: 0, stock: 100 },
          { id: 'v3_kotak', name: 'Kotak / Persegi Panjang', price: 0, cost_price: 0, stock: 100 },
          { id: 'v3_custom', name: 'Sesuai Pola', price: 500, cost_price: 200, stock: 100 },
          { id: 'v3_standar', name: 'Standar', price: 2000, cost_price: 800, stock: 100 },
          { id: 'v3_medium', name: 'Medium', price: 4000, cost_price: 1500, stock: 100 },
          { id: 'v3_large', name: 'Large', price: 1000, cost_price: 400, stock: 100 }
        ],
        extra_2: [
          { id: 'v4_glossy', name: 'Glossy', price: 1500, cost_price: 500, stock: 100 },
          { id: 'v4_doff', name: 'Doff', price: 1500, cost_price: 500, stock: 100 },
          { id: 'v4_tanpa_laminasi', name: 'Tanpa Laminasi', price: 0, cost_price: 0, stock: 100 }
        ],
        extra_3: []
      },
      variation_dependencies: {
        version: 2,
        options: {
          v3_standar: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_potong_biasa'] },
          v3_medium: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_potong_biasa'] },
          v3_large: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_potong_biasa'] },
          v3_oval: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_kisscut', 'v2_diecut'] },
          v3_kotak: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_kisscut', 'v2_diecut'] },
          v3_custom: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_kisscut', 'v2_diecut'] },
          v4_glossy: { mode: 'general' },
          v4_doff: { mode: 'general' },
          v4_tanpa_laminasi: { mode: 'general' }
        },
        skip_rules: [
          { parent_tier: 'main', trigger_ids: ['v2_lembaran'], target_tier: 'extra_1' }
        ]
      },
      ...overrides
    };
  }

  /**
   * Helper to open admin edit page in Step 2
   */
  async function openStep2Form(page, product) {
    await injectDeterministicStorage(page, { authenticated: true, product });
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
    }, product.id);

    await expect(page.locator('#step-pane-2')).toBeVisible();
  }

  // ===========================================================================
  // TEST 1: General Option Configuration (Umum)
  // ===========================================================================
  test('CFG-01: Switching specific option to General (Umum) updates state while gear has no text', async ({ page }) => {
    const product = createReferenceProduct();
    await openStep2Form(page, product);

    // v3_standar starts as specific with 1 trigger
    const row = page.locator('.variation-option-row[data-id="v3_standar"]');
    const indicatorBtn = row.locator('.btn-option-dependency-indicator');
    await expect(indicatorBtn).toBeVisible();
    await expect(indicatorBtn.locator('i.bi-gear')).toBeVisible();
    await expect(indicatorBtn).toHaveAttribute('aria-label', 'Atur ketersediaan opsi');

    // Row contains zero status labels
    await expect(row).not.toContainText('Umum');
    await expect(row).not.toContainText('Spesifik');
    await expect(row).not.toContainText('Pemicu');
    expect((await indicatorBtn.innerText()).trim()).toBe('');

    // Verify layout order on desktop: Stock -> Gear, with Estimasi Laba directly below row
    const stockBox = await row.locator('input[data-field="stock"]').boundingBox();
    const gearBox = await indicatorBtn.boundingBox();
    const profitBox = await row.locator('.opt-profit-info-wrapper').boundingBox();
    expect(gearBox.x).toBeGreaterThan(stockBox.x);
    expect(profitBox.y).toBeGreaterThan(gearBox.y);
    await expect(row.locator('.opt-profit-info-wrapper')).toContainText('Estimasi Laba');

    // Click indicator to open modal
    await indicatorBtn.click();
    const modal = page.locator('#modal-option-dependency');
    await expect(modal).toBeVisible();

    // Select "Umum"
    await page.locator('#lbl-dep-mode-umum').click();
    await expect(page.locator('#dep-specific-settings-panel')).toHaveClass(/hidden/);

    // Save
    await page.locator('#btn-dep-save').click();
    await expect(modal).toHaveClass(/hidden/);

    // Row still contains zero status labels
    await expect(row).not.toContainText('Umum');
    await expect(row).not.toContainText('Spesifik');
    expect((await indicatorBtn.innerText()).trim()).toBe('');

    // Verify state in ProductForm
    const stateRule = await page.evaluate(() => {
      return ProductForm.getPrimaryState().variation_dependencies.options['v3_standar'];
    });
    expect(stateRule.mode).toBe('general');
  });

  // ===========================================================================
  // TEST 2: Specific Option Configuration with Single Trigger
  // ===========================================================================
  test('CFG-02: Configuring specific option with single trigger updates state while gear has no text', async ({ page }) => {
    const product = createReferenceProduct({
      variation_dependencies: {
        version: 2,
        options: {
          v4_glossy: { mode: 'general' }
        },
        skip_rules: []
      }
    });
    await openStep2Form(page, product);

    const row = page.locator('.variation-option-row[data-id="v4_glossy"]');
    const indicatorBtn = row.locator('.btn-option-dependency-indicator');
    await expect(indicatorBtn).toBeVisible();
    await expect(row).not.toContainText('Umum');
    await expect(row).not.toContainText('Spesifik');

    // Open modal
    await indicatorBtn.click();
    const modal = page.locator('#modal-option-dependency');
    await expect(modal).toBeVisible();

    // Select "Spesifik"
    await page.locator('#lbl-dep-mode-spesifik').click();
    await expect(page.locator('#dep-specific-settings-panel')).not.toHaveClass(/hidden/);

    // Select parent tier: Variasi 2 (main)
    await page.locator('#dep-parent-tier-select').selectOption('main');

    // Check only 1 trigger: Kisscut
    const kisscutCb = page.locator('#dep-triggers-container input[data-id="v2_kisscut"]');
    await kisscutCb.check();

    // Save
    await page.locator('#btn-dep-save').click();
    await expect(modal).toHaveClass(/hidden/);

    // Row still contains ONLY the gear icon, no status text
    await expect(row).not.toContainText('Umum');
    await expect(row).not.toContainText('Spesifik');
    expect((await indicatorBtn.innerText()).trim()).toBe('');

    // Verify state
    const rule = await page.evaluate(() => ProductForm.getPrimaryState().variation_dependencies.options['v4_glossy']);
    expect(rule.mode).toBe('specific');
    expect(rule.parent_tier).toBe('main');
    expect(rule.trigger_ids).toEqual(['v2_kisscut']);
  });

  // ===========================================================================
  // TEST 3: Multiple OR Triggers with Select All and Deselect All
  // ===========================================================================
  test('CFG-03: Multiple OR triggers selection with Pilih Semua & Hapus Semua actions', async ({ page }) => {
    const product = createReferenceProduct();
    await openStep2Form(page, product);

    const indicatorBtn = page.locator('.btn-option-dependency-indicator[data-id="v3_oval"]');
    await indicatorBtn.click();
    const modal = page.locator('#modal-option-dependency');
    await expect(modal).toBeVisible();

    // Deselect all
    await page.locator('#btn-dep-deselect-all').click();
    const checkedCountAfterDeselect = await page.locator('#dep-triggers-container input:checked').count();
    expect(checkedCountAfterDeselect).toBe(0);

    // Select all
    await page.locator('#btn-dep-select-all').click();
    const totalCount = await page.locator('#dep-triggers-container input[type="checkbox"]').count();
    const checkedCountAfterSelectAll = await page.locator('#dep-triggers-container input:checked').count();
    expect(checkedCountAfterSelectAll).toBe(totalCount);
    expect(totalCount).toBeGreaterThan(1);

    // Deselect all and pick exactly 2
    await page.locator('#btn-dep-deselect-all').click();
    await page.locator('#dep-triggers-container input[data-id="v2_kisscut"]').check();
    await page.locator('#dep-triggers-container input[data-id="v2_diecut"]').check();

    // Save
    await page.locator('#btn-dep-save').click();
    await expect(modal).toHaveClass(/hidden/);

    // Row still contains ONLY the gear icon, no status text
    const row = page.locator('.variation-option-row[data-id="v3_oval"]');
    await expect(row).not.toContainText('Umum');
    await expect(row).not.toContainText('Spesifik');
    expect((await indicatorBtn.innerText()).trim()).toBe('');

    // Verify state
    const rule = await page.evaluate(() => ProductForm.getPrimaryState().variation_dependencies.options['v3_oval']);
    expect(rule.mode).toBe('specific');
    expect(rule.trigger_ids).toEqual(['v2_kisscut', 'v2_diecut']);
  });

  // ===========================================================================
  // TEST 4: Parent variation selection restricted to earlier tiers (Strict DAG)
  // ===========================================================================
  test('CFG-04: Parent tier selector strictly allows only earlier variation tiers', async ({ page }) => {
    const product = createReferenceProduct();
    await openStep2Form(page, product);

    // 1. Variasi 2 (main) option: parent should only allow tier1 (no self, no V3/V4)
    const v2Btn = page.locator('.btn-option-dependency-indicator[data-id="v2_kisscut"]');
    await v2Btn.click();
    const v2Parents = await page.locator('#dep-parent-tier-select option').allInnerTexts();
    expect(v2Parents.length).toBe(1);
    expect(v2Parents[0]).toContain('Variasi 1');
    await page.locator('#btn-dep-cancel').click();

    // 2. Variasi 3 (extra_1) option: parent should allow tier1 and main (no self, no V4)
    const v3Btn = page.locator('.btn-option-dependency-indicator[data-id="v3_oval"]');
    await v3Btn.click();
    const v3Parents = await page.locator('#dep-parent-tier-select option').allInnerTexts();
    expect(v3Parents.length).toBe(2);
    expect(v3Parents.some(t => t.includes('Variasi 1'))).toBe(true);
    expect(v3Parents.some(t => t.includes('Variasi 2'))).toBe(true);
    expect(v3Parents.some(t => t.includes('Variasi 3'))).toBe(false);
    expect(v3Parents.some(t => t.includes('Variasi 4'))).toBe(false);
    await page.locator('#btn-dep-cancel').click();

    // 3. Variasi 4 (extra_2) option: parent should allow tier1, main, extra_1 (no self)
    const v4Btn = page.locator('.btn-option-dependency-indicator[data-id="v4_glossy"]');
    await v4Btn.click();
    const v4Parents = await page.locator('#dep-parent-tier-select option').allInnerTexts();
    expect(v4Parents.length).toBe(3);
    expect(v4Parents.some(t => t.includes('Variasi 1'))).toBe(true);
    expect(v4Parents.some(t => t.includes('Variasi 2'))).toBe(true);
    expect(v4Parents.some(t => t.includes('Variasi 3'))).toBe(true);
    expect(v4Parents.some(t => t.includes('Variasi 4'))).toBe(false);
    await page.locator('#btn-dep-cancel').click();
  });

  // ===========================================================================
  // TEST 5: Conditional Skip Rule Creation and Deletion
  // ===========================================================================
  test('CFG-05: Adding and deleting skip rule in "Aturan Lewati Variasi Berikutnya"', async ({ page }) => {
    const product = createReferenceProduct({
      variation_dependencies: { version: 2, options: {}, skip_rules: [] }
    });
    await openStep2Form(page, product);

    const skipSection = page.locator('#section-skip-rules');
    await expect(skipSection).toBeVisible();

    // Initial badge: 0 Aturan
    await expect(page.locator('#skip-rules-count-badge')).toContainText('0 Aturan');
    await expect(page.locator('#skip-rules-empty-msg')).toBeVisible();

    // Select Parent: Variasi 2 (main)
    await page.locator('#select-skip-parent-tier').selectOption('main');

    // Select Trigger: Lembaran
    await page.locator('#select-skip-trigger-option').selectOption('v2_lembaran');

    // Select Target: Variasi 3 (extra_1)
    await page.locator('#select-skip-target-tier').selectOption('extra_1');

    // Click Add
    await page.locator('#btn-add-skip-rule').click();

    // Verify row added to table
    await expect(page.locator('#table-skip-rules')).toBeVisible();
    await expect(page.locator('#table-skip-rules tbody tr')).toHaveCount(1);
    await expect(page.locator('#skip-rules-count-badge')).toContainText('1 Aturan');

    // Verify state
    const rules = await page.evaluate(() => ProductForm.getPrimaryState().variation_dependencies.skip_rules);
    expect(rules.length).toBe(1);
    expect(rules[0].parent_tier).toBe('main');
    expect(rules[0].trigger_ids).toEqual(['v2_lembaran']);
    expect(rules[0].target_tier).toBe('extra_1');

    // Delete rule
    await page.locator('.btn-delete-skip-rule').first().click();

    // Verify empty state returned
    await expect(page.locator('#skip-rules-empty-msg')).toBeVisible();
    await expect(page.locator('#skip-rules-count-badge')).toContainText('0 Aturan');
    const rulesAfter = await page.evaluate(() => ProductForm.getPrimaryState().variation_dependencies.skip_rules);
    expect(rulesAfter.length).toBe(0);
  });

  // ===========================================================================
  // TEST 6: Invalid Dependency Rejection (0 Triggers Blocks Save)
  // ===========================================================================
  test('CFG-06: Specific option with 0 triggers is rejected with Indonesian validation feedback', async ({ page }) => {
    const product = createReferenceProduct();
    await openStep2Form(page, product);

    // 1. Modal validation rejection
    const indicatorBtn = page.locator('.btn-option-dependency-indicator[data-id="v3_standar"]');
    await indicatorBtn.click();
    const modal = page.locator('#modal-option-dependency');

    // Deselect all triggers while remaining Specific
    await page.locator('#btn-dep-deselect-all').click();

    // Click Save
    await page.locator('#btn-dep-save').click();

    // Modal must NOT close, and warning must be visible
    await expect(modal).toBeVisible();
    const errEl = page.locator('#dep-trigger-error-msg');
    await expect(errEl).toBeVisible();
    await expect(errEl).toContainText('Pilih minimal 1 opsi pemicu atau ubah ke Opsi Umum');

    // Cancel modal
    await page.locator('#btn-dep-cancel').click();
    await expect(modal).toHaveClass(/hidden/);

    // 2. Form submission rejection if corrupt specific option exists
    await page.evaluate(() => {
      ProductForm.getPrimaryState().variation_dependencies.options['v3_standar'] = {
        mode: 'specific',
        parent_tier: 'main',
        trigger_ids: [] // 0 triggers!
      };
    });

    // Submit form via submit button
    await page.locator('#btn-submit-product').click();

    // Error banner should be shown with clear error message
    const errorBanner = page.locator('#form-error-banner:visible');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('wajib memiliki minimal 1 pilihan pemicu');
  });

  // ===========================================================================
  // TEST 7: Save, Reload, and Edit Hydration Preserves Rules
  // ===========================================================================
  test('CFG-07: Saving product with dependencies, then reloading accurately hydrates all rules', async ({ page }) => {
    const product = createReferenceProduct();
    await openStep2Form(page, product);

    // Submit product form via submit button
    await page.locator('#btn-submit-product').click();

    // Wait for save & toast
    await page.waitForTimeout(600);
    const savedInDB = await page.evaluate((pid) => {
      return DB.getProductById(pid);
    }, product.id);

    expect(savedInDB).not.toBeNull();
    expect(savedInDB.variation_dependencies).not.toBeNull();
    expect(savedInDB.variation_dependencies.version).toBe(2);
    expect(savedInDB.variation_dependencies.options['v3_oval'].mode).toBe('specific');
    expect(savedInDB.variation_dependencies.skip_rules[0].target_tier).toBe('extra_1');

    // Reload page and re-open edit form
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
    }, product.id);

    await expect(page.locator('#step-pane-2')).toBeVisible();

    // Check indicator badge hydrated
    const ovalBtn = page.locator('.btn-option-dependency-indicator[data-id="v3_oval"]');
    await expect(ovalBtn).toBeVisible();
    await expect(ovalBtn).not.toContainText('Spesifik');
    // Open modal to verify hydrated rules
    await ovalBtn.click();
    await expect(page.locator('#modal-option-dependency')).toBeVisible();
    await expect(page.locator('#lbl-dep-mode-spesifik')).toHaveClass(/border-\[var\(--color-primary\)\]/);
    await page.locator('#btn-dep-cancel').click();

    // Check skip rules table hydrated
    await expect(page.locator('#table-skip-rules')).toBeVisible();
    await expect(page.locator('#skip-rules-count-badge')).toContainText('1 Aturan');
  });

  // ===========================================================================
  // TEST 8: Cancel Modal Discards Changes Without Mutating State
  // ===========================================================================
  test('CFG-08: Clicking Batal or ✕ in dependency modal discards working buffer without mutating saved state', async ({ page }) => {
    const product = createReferenceProduct({
      variation_dependencies: {
        version: 2,
        options: {
          v4_glossy: { mode: 'general' }
        },
        skip_rules: []
      }
    });
    await openStep2Form(page, product);

    const row = page.locator('.variation-option-row[data-id="v4_glossy"]');
    const indicatorBtn = row.locator('.btn-option-dependency-indicator');
    await expect(indicatorBtn).toBeVisible();
    await expect(row).not.toContainText('Umum');
    await expect(row).not.toContainText('Spesifik');

    // Open modal
    await indicatorBtn.click();
    const modal = page.locator('#modal-option-dependency');
    await expect(modal).toBeVisible();

    // Toggle to specific and check some triggers
    await page.locator('#lbl-dep-mode-spesifik').click();
    await page.locator('#btn-dep-select-all').click();

    // Click Batal
    await page.locator('#btn-dep-cancel').click();
    await expect(modal).toHaveClass(/hidden/);

    // Row must STILL have no status labels
    await expect(row).not.toContainText('Umum');
    await expect(row).not.toContainText('Spesifik');
    expect((await indicatorBtn.innerText()).trim()).toBe('');

    // State must remain "general"
    const rule = await page.evaluate(() => ProductForm.getPrimaryState().variation_dependencies.options['v4_glossy']);
    expect(rule.mode).toBe('general');
  });

  // ===========================================================================
  // TEST 9: Legacy Product Upgrade Preserves Existing Restrictions Faithfully
  // ===========================================================================
  test('CFG-09: Legacy product upgrade converts restrictions into equivalent V2 rules without opening combinations', async () => {
    const legacyProduct = {
      id: 'legacy-prod-001',
      name: 'Produk Stiker Lama',
      has_variants: true,
      has_variation_2: true,
      has_variation_3: false,
      has_variation_4: false,
      materials: [
        { id: 'mat_bontax', name: 'Bontax', variation_scopes: { main: 'spesifik' } },
        { id: 'mat_vinyl', name: 'Vinyl', variation_scopes: { main: 'umum' } }
      ],
      finishings: {
        main: [
          { id: 'fin_potong_biasa', name: 'Potong Biasa' },
          { id: 'fin_kisscut', name: 'Kisscut' }
        ]
      },
      specific_options_map: {
        mat_bontax: {
          main: ['fin_potong_biasa'] // Kisscut is NOT allowed for Bontax!
        }
      }
    };

    const converted = VariationEngine.convertLegacyToV2(legacyProduct);

    expect(converted).not.toBeNull();
    expect(converted.version).toBe(2);
    // fin_potong_biasa is allowed by both Bontax (in map) and Vinyl (umum) -> General!
    expect(converted.options['fin_potong_biasa'].mode).toBe('general');
    // fin_kisscut is NOT allowed by Bontax, only by Vinyl -> Specific with trigger ['mat_vinyl']!
    expect(converted.options['fin_kisscut'].mode).toBe('specific');
    expect(converted.options['fin_kisscut'].parent_tier).toBe('tier1');
    expect(converted.options['fin_kisscut'].trigger_ids).toEqual(['mat_vinyl']);

    // Verify evaluation equivalence:
    const pWithV2 = { ...legacyProduct, variation_dependencies: converted };
    const bontaxRes = VariationEngine.resolveEffectiveAllowedOptions(pWithV2, 'main', { tier1: 'mat_bontax' });
    expect(bontaxRes.allowedIds).toEqual(['fin_potong_biasa']);
    expect(bontaxRes.allowedIds.includes('fin_kisscut')).toBe(false);

    const vinylRes = VariationEngine.resolveEffectiveAllowedOptions(pWithV2, 'main', { tier1: 'mat_vinyl' });
    expect(vinylRes.allowedIds).toEqual(['fin_potong_biasa', 'fin_kisscut']);
  });

  // ===========================================================================
  // TEST 10: Storefront PDP Reflects Configured Rules and Skipped Tier Notice
  // ===========================================================================
  test('CFG-10: PDP storefront shows collapsed/disabled skipped tier with Indonesian explanatory notice', async ({ page }) => {
    const product = createReferenceProduct({
      finishings: {
        main: [
          { id: 'v2_potong_biasa', name: 'Potong Biasa', price: 0, cost_price: 0, stock: 100 },
          { id: 'v2_lembaran', name: 'Lembaran', price: 0, cost_price: 0, stock: 100 }
        ],
        extra_1: [
          { id: 'v3_oval', name: 'Oval / Bulat', price: 0, cost_price: 0, stock: 100 },
          { id: 'v3_kotak', name: 'Kotak / Persegi Panjang', price: 0, cost_price: 0, stock: 100 }
        ],
        extra_2: [],
        extra_3: []
      },
      variation_dependencies: {
        version: 2,
        options: {},
        skip_rules: [
          { parent_tier: 'main', trigger_ids: ['v2_lembaran'], target_tier: 'extra_1' }
        ]
      }
    });
    await injectDeterministicStorage(page, { authenticated: false, product });

    // Open Buyer PDP
    await page.goto(`/product.html?id=${product.id}`);
    await page.waitForSelector('#pdp-content');
    await page.waitForSelector('#pdp-main-finishing-section');

    // 1. Select Material Bontax
    const bontaxRadio = page.locator('input[name="pdp_material"][value="v1_bontax"]');
    await bontaxRadio.check();

    // 2. Select V2 Lembaran (which triggers skip rule for V3 / extra_1)
    const lembaranRadio = page.locator('input[name="pdp_main_finishing"][value="v2_lembaran"]');
    await lembaranRadio.check();

    // Wait for reactive cascading update
    await page.waitForTimeout(200);

    // 3. Verify V3 / Extra Finishing section has skipped notice in Indonesian
    const extraFinSec = page.locator('#pdp-extra-finishing-section');
    await expect(extraFinSec).toBeVisible();
    await expect(extraFinSec).toHaveClass(/is-skipped-tier/);

    const skipNotice = extraFinSec.locator('.pdp-tier-skipped-notice');
    await expect(skipNotice).toBeVisible();
    await expect(skipNotice).toContainText('Variasi ini dilewati untuk pilihan Anda saat ini');

    // 4. Switching to Potong Biasa un-skips V3 and hides the notice
    const potongRadio = page.locator('input[name="pdp_main_finishing"][value="v2_potong_biasa"]');
    await potongRadio.check();
    await page.waitForTimeout(200);

    await expect(extraFinSec).not.toHaveClass(/is-skipped-tier/);
    await expect(skipNotice).toHaveClass(/hidden/);
  });

  // ===========================================================================
  // TEST 11: Mobile Responsive View (375x667 Viewport)
  // ===========================================================================
  test('CFG-11: Dependency modal dialog renders and functions smoothly on mobile viewport (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const product = createReferenceProduct();
    await openStep2Form(page, product);

    const indicatorBtn = page.locator('.btn-option-dependency-indicator[data-id="v3_standar"]');
    await indicatorBtn.click();

    const modal = page.locator('#modal-option-dependency');
    await expect(modal).toBeVisible();

    // Verify modal content is not overflowing screen width
    const modalBox = await modal.locator('> div').boundingBox();
    expect(modalBox).not.toBeNull();
    if (modalBox) {
      expect(modalBox.width).toBeLessThanOrEqual(375);
    }

    // Capture mobile screenshot
    await page.screenshot({ path: 'docs/qa/screenshots/mobile-variation-gear-table.png' });

    // Toggle mode on mobile
    await page.locator('#lbl-dep-mode-umum').click();
    await page.locator('#btn-dep-save').click();

    await expect(modal).toHaveClass(/hidden/);
    const row = page.locator('.variation-option-row[data-id="v3_standar"]');
    await expect(row).not.toContainText('Umum');
    await expect(row).not.toContainText('Spesifik');
    expect((await indicatorBtn.innerText()).trim()).toBe('');
  });


  // ===========================================================================
  // TEST 12: Dynamic Indonesian Descriptions for General & Specific Modes
  // ===========================================================================
  test('CFG-12: Modal renders exact dynamic Indonesian descriptions with bold formatting', async ({ page }) => {
    const product = createReferenceProduct();
    await openStep2Form(page, product);

    // Open modal for v3_oval
    const indicatorBtn = page.locator('.btn-option-dependency-indicator[data-id="v3_oval"]');
    await indicatorBtn.click();
    const modal = page.locator('#modal-option-dependency');
    await expect(modal).toBeVisible();

    const descUmum = modal.locator('#dep-desc-umum');
    const descSpesifik = modal.locator('#dep-desc-spesifik');

    await expect(descUmum).toBeVisible();
    await expect(descSpesifik).toBeVisible();

    // Verify option name "Oval / Bulat" is wrapped in <strong>
    const strongUmum = descUmum.locator('strong');
    await expect(strongUmum.nth(0)).toHaveText('Oval / Bulat');
    await expect(strongUmum.nth(1)).toHaveText('Variasi 2');

    const strongSpesifik = descSpesifik.locator('strong');
    await expect(strongSpesifik.nth(0)).toHaveText('Oval / Bulat');
    await expect(strongSpesifik.nth(1)).toHaveText('Variasi 2');

    // Check full text content
    await expect(descUmum).toHaveText('Opsi Oval / Bulat ini ditampilkan dan digunakan sebagai pilihan di semua jenis opsi Variasi 2.');
    await expect(descSpesifik).toHaveText('Opsi Oval / Bulat ini hanya ditampilkan dan digunakan sebagai pilihan pada jenis opsi Variasi 2 yang Anda pilih.');
  });

  // ===========================================================================
  // TEST 13: Changing Parent Variation Dynamically Updates Descriptions in Real Time
  // ===========================================================================
  test('CFG-13: Changing parent variation dropdown dynamically updates descriptions', async ({ page }) => {
    const product = createReferenceProduct();
    await openStep2Form(page, product);

    // Open modal for v4_glossy (Variasi 4)
    const indicatorBtn = page.locator('.btn-option-dependency-indicator[data-id="v4_glossy"]');
    await indicatorBtn.click();

    const modal = page.locator('#modal-option-dependency');
    const descUmum = modal.locator('#dep-desc-umum');
    const descSpesifik = modal.locator('#dep-desc-spesifik');

    // Default parent for v4_glossy is Variasi 3
    await expect(descUmum.locator('strong').nth(1)).toHaveText('Variasi 3');
    await expect(descSpesifik.locator('strong').nth(1)).toHaveText('Variasi 3');

    // Switch to Spesifik mode to expose parent dropdown
    await page.locator('#lbl-dep-mode-spesifik').click();

    // Change parent dropdown to Variasi 1 (tier1)
    await page.locator('#dep-parent-tier-select').selectOption('tier1');

    // Description must immediately reflect Variasi 1!
    await expect(descUmum.locator('strong').nth(1)).toHaveText('Variasi 1');
    await expect(descSpesifik.locator('strong').nth(1)).toHaveText('Variasi 1');
    await expect(descUmum).toHaveText('Opsi Glossy ini ditampilkan dan digunakan sebagai pilihan di semua jenis opsi Variasi 1.');
    await expect(descSpesifik).toHaveText('Opsi Glossy ini hanya ditampilkan dan digunakan sebagai pilihan pada jenis opsi Variasi 1 yang Anda pilih.');

    // Switch parent to Variasi 2 (main)
    await page.locator('#dep-parent-tier-select').selectOption('main');
    await expect(descUmum.locator('strong').nth(1)).toHaveText('Variasi 2');
    await expect(descSpesifik.locator('strong').nth(1)).toHaveText('Variasi 2');
  });

  // ===========================================================================
  // TEST 14: Changing Option Name in Table Dynamically Updates Description
  // ===========================================================================
  test('CFG-14: Changing option name in table dynamically updates description in modal', async ({ page }) => {
    const product = createReferenceProduct();
    await openStep2Form(page, product);

    // Rename v3_custom to "Sesuai Bentuk Unik"
    const nameInput = page.locator('.variation-option-row[data-id="v3_custom"] input[data-field="name"]');
    await nameInput.fill('Sesuai Bentuk Unik');

    // Open modal for v3_custom
    const indicatorBtn = page.locator('.btn-option-dependency-indicator[data-id="v3_custom"]');
    await indicatorBtn.click();

    const modal = page.locator('#modal-option-dependency');
    const descUmum = modal.locator('#dep-desc-umum');
    const descSpesifik = modal.locator('#dep-desc-spesifik');

    // Must reflect the new name!
    await expect(descUmum.locator('strong').nth(0)).toHaveText('Sesuai Bentuk Unik');
    await expect(descSpesifik.locator('strong').nth(0)).toHaveText('Sesuai Bentuk Unik');
    await expect(descUmum).toHaveText('Opsi Sesuai Bentuk Unik ini ditampilkan dan digunakan sebagai pilihan di semua jenis opsi Variasi 2.');
  });

  // ===========================================================================
  // TEST 15: Variasi 2, 3, and 4 Context with Custom Labels
  // ===========================================================================
  test('CFG-15: Variasi 2, 3, and 4 correctly contextualize custom parent labels', async ({ page }) => {
    const product = createReferenceProduct({
      variation_labels: {
        label_product: 'Stiker',
        label_tier_1: 'Bahan Utama',
        label_tier_2: 'Jenis Potong',
        label_extra_1: 'Bentuk Pola',
        label_extra_2: 'Lapisan Akhir'
      }
    });
    await openStep2Form(page, product);

    // 1. Variasi 2 (main) option: parent is Bahan Utama
    const v2Btn = page.locator('.btn-option-dependency-indicator[data-id="v2_kisscut"]');
    await v2Btn.click();
    const modal = page.locator('#modal-option-dependency');
    await expect(modal.locator('#dep-desc-umum')).toHaveText('Opsi Kisscut ini ditampilkan dan digunakan sebagai pilihan di semua jenis opsi Bahan Utama.');
    await expect(modal.locator('#dep-desc-spesifik')).toHaveText('Opsi Kisscut ini hanya ditampilkan dan digunakan sebagai pilihan pada jenis opsi Bahan Utama yang Anda pilih.');
    await page.locator('#btn-dep-cancel').click();

    // 2. Variasi 3 (extra_1) option: parent default is Jenis Potong
    const v3Btn = page.locator('.btn-option-dependency-indicator[data-id="v3_oval"]');
    await v3Btn.click();
    await expect(modal.locator('#dep-desc-umum')).toHaveText('Opsi Oval / Bulat ini ditampilkan dan digunakan sebagai pilihan di semua jenis opsi Jenis Potong.');
    await expect(modal.locator('#dep-desc-spesifik')).toHaveText('Opsi Oval / Bulat ini hanya ditampilkan dan digunakan sebagai pilihan pada jenis opsi Jenis Potong yang Anda pilih.');
    await page.locator('#btn-dep-cancel').click();

    // 3. Variasi 4 (extra_2) option: parent default is Bentuk Pola
    const v4Btn = page.locator('.btn-option-dependency-indicator[data-id="v4_glossy"]');
    await v4Btn.click();
    await expect(modal.locator('#dep-desc-umum')).toHaveText('Opsi Glossy ini ditampilkan dan digunakan sebagai pilihan di semua jenis opsi Bentuk Pola.');
    await expect(modal.locator('#dep-desc-spesifik')).toHaveText('Opsi Glossy ini hanya ditampilkan dan digunakan sebagai pilihan pada jenis opsi Bentuk Pola yang Anda pilih.');
    await page.locator('#btn-dep-cancel').click();
  });

  // ===========================================================================
  // TEST 16: Selectable Cards / Buttons Toggle Seamlessly Without Traditional Radio Dots
  // ===========================================================================
  test('CFG-16: Selectable cards/buttons toggle seamlessly without traditional radio button dots', async ({ page }) => {
    const product = createReferenceProduct();
    await openStep2Form(page, product);

    const indicatorBtn = page.locator('.btn-option-dependency-indicator[data-id="v3_oval"]');
    await indicatorBtn.click();

    const cardUmum = page.locator('#lbl-dep-mode-umum');
    const cardSpesifik = page.locator('#lbl-dep-mode-spesifik');

    // Click Umum card directly
    await cardUmum.click();
    await expect(cardUmum).toHaveClass(/border-\[var\(--color-primary\)\]/);
    await expect(page.locator('#dep-specific-settings-panel')).toHaveClass(/hidden/);

    // Click Spesifik card directly
    await cardSpesifik.click();
    await expect(cardSpesifik).toHaveClass(/border-\[var\(--color-primary\)\]/);
    await expect(page.locator('#dep-specific-settings-panel')).not.toHaveClass(/hidden/);

    // Ensure radio inputs are visually hidden with sr-only
    await expect(page.locator('input[name="dep_modal_mode"][value="general"]')).toHaveClass(/sr-only/);
    await expect(page.locator('input[name="dep_modal_mode"][value="specific"]')).toHaveClass(/sr-only/);

    await page.locator('#btn-dep-cancel').click();
  });

  // ===========================================================================
  // TEST 17: Table Layout Verification: Dedicated Gear Column Follows Stock & Precedes Profit
  // ===========================================================================
  test('CFG-17: Table layout verification: gear immediately follows Stock, precedes Estimasi Laba, with zero status labels', async ({ page }) => {
    const product = createReferenceProduct();
    await openStep2Form(page, product);

    // 1. Verify desktop layout on Variasi 2, 3, and 4
    const tiers = ['main', 'extra_1', 'extra_2'];
    for (const tier of tiers) {
      const rows = page.locator(`.variation-option-row[data-tier="${tier}"]`);
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);

      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);

        // A. Exactly one gear per applicable row
        const gear = row.locator('.btn-option-dependency-indicator');
        await expect(gear).toHaveCount(1);
        await expect(gear.locator('i.bi-gear')).toBeVisible();
        await expect(gear).toHaveAttribute('aria-label', 'Atur ketersediaan opsi');

        // B. Zero visible status labels in the option row
        await expect(row).not.toContainText('Umum');
        await expect(row).not.toContainText('Spesifik');
        await expect(row).not.toContainText('Pemicu');
        expect((await gear.innerText()).trim()).toBe('');

        // C. Position: Stock -> Gear -> Estimasi Laba
        const stockInput = row.locator('input[data-field="stock"]');
        const profitWrap = row.locator('.opt-profit-info-wrapper');
        await expect(profitWrap).toBeVisible();
        await expect(profitWrap).toContainText('Laba');

        const stockBox = await stockInput.boundingBox();
        const gearBox = await gear.boundingBox();
        const profitBox = await profitWrap.boundingBox();

        expect(stockBox).not.toBeNull();
        expect(gearBox).not.toBeNull();
        expect(profitBox).not.toBeNull();

        // Gear is to the right of stock input
        expect(gearBox.x).toBeGreaterThan(stockBox.x);
        // Estimasi Laba is directly below the option row
        expect(profitBox.y).toBeGreaterThan(gearBox.y);
        await expect(profitWrap).toContainText('Estimasi Laba');
      }
    }

    // Capture desktop screenshot
    await page.screenshot({ path: 'docs/qa/screenshots/desktop-variation-gear-table.png' });
  });


  // ===========================================================================
  // TEST 18: Non-Variant Single Price & HPP Isolation and Non-Destructive Toggle
  // ===========================================================================
  test('CFG-18: Enabling variations does not copy single prices into V1 options, and disabling restores them', async ({ page }) => {
    // Start with a non-variant product with explicit single price & HPP
    const nonVariantProduct = {
      ...TEST_PRODUCT,
      id: 'prod-non-variant-isolated-001',
      name: 'Stiker Segel Tunggal',
      has_variants: false,
      price: 35000,
      cost_price: 15000,
      materials: [
        { id: 'mat-single-1', name: 'Produk Standar', price: 35000, cost_price: 15000, stock: 50 }
      ],
      finishings: { main: [], extra_1: [], extra_2: [], extra_3: [] }
    };

    await openStep2Form(page, nonVariantProduct);

    // Verify non-variant single price & cost inputs exist
    const singlePrice = page.locator('#input-single-price');
    const singleCost = page.locator('#input-single-cost');
    await expect(singlePrice).toHaveValue('35000');
    await expect(singleCost).toHaveValue('15000');

    // Click "Variasi Produk" to enable variations
    const btnEnableVariants = page.locator('#btn-enable-variants');
    await expect(btnEnableVariants).toBeVisible();
    await btnEnableVariants.click();

    // Verify Variasi 1 options are initialized blank (never copied 35000 / 15000)
    const v1Rows = page.locator('.variation-option-row[data-tier="tier1"]');
    await expect(v1Rows).toHaveCount(2);

    const firstOptName = v1Rows.nth(0).locator('input[data-field="name"]');
    const firstOptPrice = v1Rows.nth(0).locator('input[data-field="price"]');
    const firstOptCost = v1Rows.nth(0).locator('input[data-field="cost_price"]');

    expect(await firstOptName.inputValue()).toBe('');
    expect(await firstOptPrice.inputValue()).toBe('');
    expect(await firstOptCost.inputValue()).toBe('');

    // Verify second option is also blank
    const secondOptPrice = v1Rows.nth(1).locator('input[data-field="price"]');
    expect(await secondOptPrice.inputValue()).toBe('');

    // Now close Variasi 1 (disabling variants)
    const btnCloseVar1 = page.locator('#btn-close-var-tier-1');
    await btnCloseVar1.click();

    // Verify non-variant single price and cost are preserved and safely restored
    await expect(page.locator('#input-single-price')).toHaveValue('35000');
    await expect(page.locator('#input-single-cost')).toHaveValue('15000');

    // Re-enable variants: ensure prices still do NOT leak into variation options
    await page.locator('#btn-enable-variants').click();
    const reloadedV1Rows = page.locator('.variation-option-row[data-tier="tier1"]');
    expect(await reloadedV1Rows.nth(0).locator('input[data-field="price"]').inputValue()).toBe('');
    expect(await reloadedV1Rows.nth(0).locator('input[data-field="cost_price"]').inputValue()).toBe('');
  });

  // ===========================================================================
  // TEST 19: Settings Gear Activation State Based on Option Completeness
  // ===========================================================================
  test('CFG-19: Settings gear is disabled until name, price, cost, and stock are filled, including 0 values', async ({ page }) => {
    const product = createReferenceProduct();
    await openStep2Form(page, product);

    // Look at first option in Variasi 2 (Kisscut)
    const kisscutRow = page.locator('.variation-option-row[data-id="v2_kisscut"]');
    const kisscutGear = kisscutRow.locator('.btn-option-dependency-indicator');

    // It is complete: gear is enabled and clickable
    await expect(kisscutGear).not.toBeDisabled();
    await expect(kisscutGear).toHaveAttribute('title', 'Atur ketersediaan opsi');

    // Clear price field
    const priceInp = kisscutRow.locator('input[data-field="price"]');
    await priceInp.fill('');
    await priceInp.dispatchEvent('input');

    // Gear immediately becomes disabled with tooltip
    await expect(kisscutGear).toBeDisabled();
    await expect(kisscutGear).toHaveAttribute('title', 'Lengkapi nama opsi, harga jual, HPP, dan stok terlebih dahulu.');

    // Clicking disabled gear must NOT open modal
    await kisscutGear.click({ force: true });
    await expect(page.locator('#modal-option-dependency')).toBeHidden();

    // Fill numerical 0 (0 is considered filled)
    await priceInp.fill('0');
    await priceInp.dispatchEvent('input');

    // Gear immediately becomes active again
    await expect(kisscutGear).not.toBeDisabled();
    await expect(kisscutGear).toHaveAttribute('title', 'Atur ketersediaan opsi');

    // Clear name field
    const nameInp = kisscutRow.locator('input[data-field="name"]');
    await nameInp.fill('');
    await nameInp.dispatchEvent('input');

    // Gear disables again
    await expect(kisscutGear).toBeDisabled();

    // Restore name
    await nameInp.fill('Kisscut');
    await nameInp.dispatchEvent('input');
    await expect(kisscutGear).not.toBeDisabled();
  });

  // ===========================================================================
  // TEST 20: Redesigned Dependency Modal Heading, Selection Layout, & Trigger Header
  // ===========================================================================
  test('CFG-20: Redesigned dependency modal renders clean dynamic header and 2-column selection', async ({ page }) => {
    const product = createReferenceProduct();
    await openStep2Form(page, product);

    // Open modal for v2_kisscut
    const kisscutGear = page.locator('.btn-option-dependency-indicator[data-id="v2_kisscut"]');
    await kisscutGear.click();

    const modal = page.locator('#modal-option-dependency');
    await expect(modal).toBeVisible();

    // 1. Dynamic header: "Kisscut (Variasi 2)"
    const modalTitle = modal.locator('#dep-modal-title');
    await expect(modalTitle).toHaveText('Kisscut (Variasi 2)');
    await expect(modal).not.toContainText('Konfigurasi Keterkaitan Variasi');
    await expect(modal).not.toContainText('Tipe Ketersediaan Opsi:');

    // 2. Selection buttons layout
    const btnUmum = modal.locator('#lbl-dep-mode-umum');
    const btnSpesifik = modal.locator('#lbl-dep-mode-spesifik');
    await expect(btnUmum).toBeVisible();
    await expect(btnSpesifik).toBeVisible();
    await expect(btnUmum).toContainText('Umum');
    await expect(btnSpesifik).toContainText('Spesifik');

    // 3. Trigger section header when Spesifik is active
    await btnSpesifik.click();
    await expect(modal.locator('#dep-specific-settings-panel')).toBeVisible();
    await expect(modal).toContainText('Tentukan Jenis Opsi');
    await expect(modal).toContainText('Pilih jenis opsi pada variasi sebelumnya yang menentukan kapan pilihan ini tersedia bagi pelanggan.');

    // 4. Clean footer buttons
    await expect(modal.locator('#btn-dep-cancel')).toHaveText('Batal');
    await expect(modal.locator('#btn-dep-save')).toHaveText('Simpan');

    await modal.locator('#btn-dep-cancel').click();
    await expect(modal).toBeHidden();
  });

  // ===========================================================================
  // TEST 21: Mobile-First Responsiveness Verification Across Viewports
  // ===========================================================================
  test('CFG-21: Mobile viewports (375x667, 390x844, 430x932) render table and modal without overflow', async ({ page }) => {
    const product = createReferenceProduct();
    const viewports = [
      { width: 375, height: 667, name: '375x667' },
      { width: 390, height: 844, name: '390x844' },
      { width: 430, height: 932, name: '430x932' }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await openStep2Form(page, product);

      // Verify no horizontal document overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(vp.width + 1); // 1px allowable rounding margin

      // Verify option row exists and profit information is visible below row
      const firstRow = page.locator('.variation-option-row[data-tier="main"]').first();
      await expect(firstRow).toBeVisible();
      const profitWrap = firstRow.locator('.opt-profit-info-wrapper');
      await expect(profitWrap).toBeVisible();
      await expect(profitWrap).toContainText('Estimasi Laba');

      // Open modal in this viewport
      const gear = firstRow.locator('.btn-option-dependency-indicator');
      await gear.click();
      const modal = page.locator('#modal-option-dependency');
      await expect(modal).toBeVisible();

      // Ensure modal does not exceed viewport width
      const modalBox = await modal.locator('> div').boundingBox();
      expect(modalBox).not.toBeNull();
      expect(modalBox.width).toBeLessThanOrEqual(vp.width);

      // Capture screenshot
      await page.screenshot({ path: `docs/qa/screenshots/mobile-${vp.name}-variation-config.png` });

      // Close modal
      await page.locator('#btn-dep-cancel').click();
    }
  });

  // ===========================================================================
  // TEST 22: Variation 1 Multi-Option Creation (Auto-Append Stability)
  // ===========================================================================
  test('CFG-22: Adding multiple options to Variation 1 works smoothly without runtime errors', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    const nonVariantProduct = {
      ...TEST_PRODUCT,
      id: 'prod-test-v1-cfg22-add',
      name: 'Stiker Test V1 Multi Options CFG-22',
      has_variants: false,
      price: 35000,
      cost_price: 15000,
      materials: [
        { id: 'mat-single-1', name: 'Produk Standar', price: 35000, cost_price: 15000, stock: 50 }
      ],
      finishings: { main: [], extra_1: [], extra_2: [], extra_3: [] }
    };

    await openStep2Form(page, nonVariantProduct);

    // Enable variations
    const btnEnableVariants = page.locator('#btn-enable-variants');
    await btnEnableVariants.click();

    let v1Rows = page.locator('.variation-option-row[data-tier="tier1"]');
    await expect(v1Rows).toHaveCount(2);

    // Type in Row 0
    await v1Rows.nth(0).locator('input[data-field="name"]').fill('Bontax');
    await v1Rows.nth(0).locator('input[data-field="price"]').fill('5000');
    await v1Rows.nth(0).locator('input[data-field="cost_price"]').fill('2000');
    await v1Rows.nth(0).locator('input[data-field="stock"]').fill('50');

    // Type in Row 1 (the last row) -> Auto-appends Row 2
    v1Rows = page.locator('.variation-option-row[data-tier="tier1"]');
    await v1Rows.nth(1).locator('input[data-field="name"]').fill('Vinyl');
    await v1Rows.nth(1).locator('input[data-field="price"]').fill('7000');
    await v1Rows.nth(1).locator('input[data-field="cost_price"]').fill('3000');
    await v1Rows.nth(1).locator('input[data-field="stock"]').fill('100');

    // Verify Row 2 (3rd option) was auto-created
    v1Rows = page.locator('.variation-option-row[data-tier="tier1"]');
    await expect(v1Rows).toHaveCount(3);

    // Type in Row 2 -> Auto-appends Row 3
    await v1Rows.nth(2).locator('input[data-field="name"]').fill('Hologram');
    await v1Rows.nth(2).locator('input[data-field="price"]').fill('10000');
    await v1Rows.nth(2).locator('input[data-field="cost_price"]').fill('5000');
    await v1Rows.nth(2).locator('input[data-field="stock"]').fill('25');

    // Verify Row 3 (4th option) was auto-created
    v1Rows = page.locator('.variation-option-row[data-tier="tier1"]');
    await expect(v1Rows).toHaveCount(4);

    // Type in Row 3 -> Auto-appends Row 4 (5th option)
    await v1Rows.nth(3).locator('input[data-field="name"]').fill('Transparan');
    v1Rows = page.locator('.variation-option-row[data-tier="tier1"]');
    await expect(v1Rows).toHaveCount(5);

    // Ensure zero page runtime errors occurred
    expect(pageErrors).toEqual([]);
  });

});

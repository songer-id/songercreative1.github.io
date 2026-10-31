// @ts-check
const { test, expect } = require('@playwright/test');
const {
  TEST_TENANT,
  TEST_CATEGORY,
  TEST_PRODUCT,
  injectDeterministicStorage
} = require('./fixtures/test-data');

test.describe('POS Songer Creative - Task 02D: Variation Dependency Runtime Integration', () => {

  /**
   * Deterministic test fixture modeling the Reference Sticker Product
   * with Option-Level DAG rules and Conditional Tier Skipping.
   */
  function createReferenceProduct(overrides = {}) {
    return {
      ...TEST_PRODUCT,
      id: 'prod-runtime-sticker-001',
      name: 'Stiker Custom Multi-Variasi Runtime',
      product_type: 'physical',
      card_variant: 'A',
      has_variants: true,
      has_variation_2: true,
      has_variation_3: true,
      has_variation_4: true,
      has_wholesale: false,
      has_order_multiple: false,
      has_extra_service: false,
      stock_mode_tiers: { tier1: 'same', main: 'same', extra_1: 'same', extra_2: 'same' },
      materials: [
        { id: 'v1_bontax', name: 'Bontax', price: 5000, cost_price: 2500, stock: 100, max_order: 1000, variation_scopes: { main: 'umum', extra_1: 'umum', extra_2: 'umum' } },
        { id: 'v1_vinyl', name: 'Vinyl', price: 7000, cost_price: 3500, stock: 100, max_order: 1000, variation_scopes: { main: 'umum', extra_1: 'umum', extra_2: 'umum' } },
        { id: 'v1_hologram', name: 'Hologram', price: 7000, cost_price: 3500, stock: 100, max_order: 1000, variation_scopes: { main: 'umum', extra_1: 'umum', extra_2: 'umum' } },
        { id: 'v1_transparan', name: 'Transparan', price: 8000, cost_price: 4000, stock: 100, max_order: 1000, variation_scopes: { main: 'umum', extra_1: 'umum', extra_2: 'umum' } }
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
          v3_oval: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_kisscut', 'v2_diecut'] },
          v3_kotak: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_kisscut', 'v2_diecut'] },
          v3_custom: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_kisscut', 'v2_diecut'] },
          v3_standar: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_potong_biasa'] },
          v3_medium: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_potong_biasa'] },
          v3_large: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_potong_biasa'] },
          v4_glossy: { mode: 'general' },
          v4_doff: { mode: 'general' },
          v4_tanpa_laminasi: { mode: 'general' }
        },
        skip_rules: [
          { target_tier: 'extra_1', parent_tier: 'main', trigger_ids: ['v2_lembaran'] }
        ]
      },
      ...overrides
    };
  }

  /**
   * Helper to initialize Product Form Step 2 and open the Shopee-style preview drawer
   */
  async function setupPreviewDrawer(page, product) {
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

    // Verify test mode check passes
    const checkResult = await page.evaluate(() => {
      return ProductForm.canActivateTestMode ? ProductForm.canActivateTestMode() : { allowed: true };
    });
    if (!checkResult.allowed) {
      console.error('canActivateTestMode failed:', checkResult);
    }

    // Switch to Test Mode
    await page.locator('#btn-preview-mode-test').click();

    // Open Drawer
    await page.locator('#card-live-preview-box .btn-preview-buy-now, .btn-preview-buy-now').first().click();
    const drawer = page.locator('#card-live-preview-box .mini-pdp-drawer-sheet, .mini-pdp-drawer-sheet').first();
    await expect(drawer).toBeVisible();
    return drawer;
  }

  /**
   * Helper to click an option chip safely, opening its accordion if collapsed
   */
  async function selectOption(drawer, tier, id) {
    const chip = drawer.locator(`.btn-shopee-tier${tier}[data-id="${id}"]`);
    const tierKey = tier === 1 ? 'tier1' : (tier === 2 ? 'tier2' : (tier === 3 ? 'tier3' : 'tier4'));
    const accordionHeader = drawer.locator(`.btn-toggle-var-accordion[data-tier="${tierKey}"]`);
    if (await accordionHeader.count() > 0 && !await chip.isVisible()) {
      await accordionHeader.click();
    }
    await chip.click();
  }

  /**
   * Helper to ensure an accordion card is open for assertions
   */
  async function ensureAccordionOpen(drawer, tier) {
    const tierKey = tier === 1 ? 'tier1' : (tier === 2 ? 'tier2' : (tier === 3 ? 'tier3' : 'tier4'));
    const body = drawer.locator(`.var-accordion-card[data-tier="${tierKey}"] .var-accordion-body`);
    if (await body.count() > 0 && await body.evaluate(el => el.classList.contains('hidden'))) {
      const header = drawer.locator(`.btn-toggle-var-accordion[data-tier="${tierKey}"]`);
      await header.click();
    }
  }

  // ===========================================================================
  // RT-01: V2 Kisscut -> V3 shows Oval, Kotak, Sesuai Pola
  // ===========================================================================
  test('RT-01: V2 Kisscut enables Oval, Kotak, Sesuai Pola in V3 and disables Standar, Medium, Large', async ({ page }) => {
    const product = createReferenceProduct();
    const drawer = await setupPreviewDrawer(page, product);

    // Select V1 Bontax
    await selectOption(drawer, 1, 'v1_bontax');
    // Select V2 Kisscut
    await selectOption(drawer, 2, 'v2_kisscut');

    // Ensure V3 accordion is open
    await ensureAccordionOpen(drawer, 3);

    // V3: Oval, Kotak, Sesuai Pola must be enabled
    await expect(drawer.locator('.btn-shopee-tier3[data-id="v3_oval"]')).not.toHaveClass(/disabled/);
    await expect(drawer.locator('.btn-shopee-tier3[data-id="v3_kotak"]')).not.toHaveClass(/disabled/);
    await expect(drawer.locator('.btn-shopee-tier3[data-id="v3_custom"]')).not.toHaveClass(/disabled/);

    // V3: Standar, Medium, Large must be disabled
    await expect(drawer.locator('.btn-shopee-tier3[data-id="v3_standar"]')).toHaveClass(/disabled/);
    await expect(drawer.locator('.btn-shopee-tier3[data-id="v3_medium"]')).toHaveClass(/disabled/);
    await expect(drawer.locator('.btn-shopee-tier3[data-id="v3_large"]')).toHaveClass(/disabled/);
  });

  // ===========================================================================
  // RT-02: V2 Diecut -> V3 shows Oval, Kotak, Sesuai Pola
  // ===========================================================================
  test('RT-02: V2 Diecut enables Oval, Kotak, Sesuai Pola in V3 and disables Standar, Medium, Large', async ({ page }) => {
    const product = createReferenceProduct();
    const drawer = await setupPreviewDrawer(page, product);

    await selectOption(drawer, 1, 'v1_bontax');
    await selectOption(drawer, 2, 'v2_diecut');

    await ensureAccordionOpen(drawer, 3);

    // V3: Shape options enabled
    await expect(drawer.locator('.btn-shopee-tier3[data-id="v3_oval"]')).not.toHaveClass(/disabled/);
    await expect(drawer.locator('.btn-shopee-tier3[data-id="v3_kotak"]')).not.toHaveClass(/disabled/);
    await expect(drawer.locator('.btn-shopee-tier3[data-id="v3_custom"]')).not.toHaveClass(/disabled/);

    // V3: Complexity options disabled
    await expect(drawer.locator('.btn-shopee-tier3[data-id="v3_standar"]')).toHaveClass(/disabled/);
    await expect(drawer.locator('.btn-shopee-tier3[data-id="v3_medium"]')).toHaveClass(/disabled/);
    await expect(drawer.locator('.btn-shopee-tier3[data-id="v3_large"]')).toHaveClass(/disabled/);
  });

  // ===========================================================================
  // RT-03: V2 Potong Biasa -> V3 shows Standar, Medium, Large
  // ===========================================================================
  test('RT-03: V2 Potong Biasa enables Standar, Medium, Large in V3 and disables Oval, Kotak, Sesuai Pola', async ({ page }) => {
    const product = createReferenceProduct();
    const drawer = await setupPreviewDrawer(page, product);

    await selectOption(drawer, 1, 'v1_bontax');
    await selectOption(drawer, 2, 'v2_potong_biasa');

    await ensureAccordionOpen(drawer, 3);

    // V3: Complexity options enabled
    await expect(drawer.locator('.btn-shopee-tier3[data-id="v3_standar"]')).not.toHaveClass(/disabled/);
    await expect(drawer.locator('.btn-shopee-tier3[data-id="v3_medium"]')).not.toHaveClass(/disabled/);
    await expect(drawer.locator('.btn-shopee-tier3[data-id="v3_large"]')).not.toHaveClass(/disabled/);

    // V3: Shape options disabled
    await expect(drawer.locator('.btn-shopee-tier3[data-id="v3_oval"]')).toHaveClass(/disabled/);
    await expect(drawer.locator('.btn-shopee-tier3[data-id="v3_kotak"]')).toHaveClass(/disabled/);
    await expect(drawer.locator('.btn-shopee-tier3[data-id="v3_custom"]')).toHaveClass(/disabled/);
  });

  // ===========================================================================
  // RT-04: Change Potong Biasa to Kisscut -> Invalid Medium selection is cleared
  // ===========================================================================
  test('RT-04: Switching V2 from Potong Biasa to Kisscut clears invalid Medium selection to null', async ({ page }) => {
    const product = createReferenceProduct();
    const drawer = await setupPreviewDrawer(page, product);

    // Select Potong Biasa -> Medium
    await selectOption(drawer, 1, 'v1_bontax');
    await selectOption(drawer, 2, 'v2_potong_biasa');
    await selectOption(drawer, 3, 'v3_medium');

    const tier3ValBefore = await page.evaluate(() => ProductForm.getPreviewTestState().selectedTier3Id);
    expect(tier3ValBefore).toBe('v3_medium');

    // Switch V2 to Kisscut
    await selectOption(drawer, 2, 'v2_kisscut');

    // Verify V3 selection is cleared to null
    const tier3ValAfter = await page.evaluate(() => ProductForm.getPreviewTestState().selectedTier3Id);
    expect(tier3ValAfter).toBeNull();

    // Verify Medium chip no longer has is-active
    await ensureAccordionOpen(drawer, 3);
    await expect(drawer.locator('.btn-shopee-tier3[data-id="v3_medium"]')).not.toHaveClass(/is-active/);
  });

  // ===========================================================================
  // RT-05: Change Kisscut to Diecut -> Valid Oval selection is preserved
  // ===========================================================================
  test('RT-05: Switching V2 from Kisscut to Diecut preserves valid Oval selection', async ({ page }) => {
    const product = createReferenceProduct();
    const drawer = await setupPreviewDrawer(page, product);

    // Select Kisscut -> Oval
    await selectOption(drawer, 1, 'v1_bontax');
    await selectOption(drawer, 2, 'v2_kisscut');
    await selectOption(drawer, 3, 'v3_oval');

    const tier3ValBefore = await page.evaluate(() => ProductForm.getPreviewTestState().selectedTier3Id);
    expect(tier3ValBefore).toBe('v3_oval');

    // Switch V2 to Diecut (both Kisscut and Diecut trigger Oval)
    await selectOption(drawer, 2, 'v2_diecut');

    // Verify Oval selection is preserved
    const tier3ValAfter = await page.evaluate(() => ProductForm.getPreviewTestState().selectedTier3Id);
    expect(tier3ValAfter).toBe('v3_oval');
    await ensureAccordionOpen(drawer, 3);
    await expect(drawer.locator('.btn-shopee-tier3[data-id="v3_oval"]')).toHaveClass(/is-active/);
  });

  // ===========================================================================
  // RT-06: V2 Lembaran -> V3 is skipped according to explicit skip rule
  // ===========================================================================
  test('RT-06: Selecting V2 Lembaran triggers skip rule and hides V3 tier section', async ({ page }) => {
    const product = createReferenceProduct();
    const drawer = await setupPreviewDrawer(page, product);

    await selectOption(drawer, 1, 'v1_bontax');
    await selectOption(drawer, 2, 'v2_lembaran');

    // Verify V3 tier section is hidden
    const v3Section = drawer.locator('[data-tier="tier3"], [data-tier="extra_1"]').first();
    await expect(v3Section).toHaveClass(/hidden/);

    // Verify V3 selection in state is null
    const tier3Val = await page.evaluate(() => ProductForm.getPreviewTestState().selectedTier3Id);
    expect(tier3Val).toBeNull();
  });

  // ===========================================================================
  // RT-07: V3 skipped, V4 independent -> V4 remains available
  // ===========================================================================
  test('RT-07: When V3 is skipped via Lembaran, independent V4 options remain accessible and selectable', async ({ page }) => {
    const product = createReferenceProduct();
    const drawer = await setupPreviewDrawer(page, product);

    await selectOption(drawer, 1, 'v1_bontax');
    await selectOption(drawer, 2, 'v2_lembaran');

    // V4 tier must NOT be hidden
    const v4Section = drawer.locator('[data-tier="tier4"], [data-tier="extra_2"]').first();
    await expect(v4Section).not.toHaveClass(/hidden/);

    // Select V4 Glossy
    await selectOption(drawer, 4, 'v4_glossy');
    const tier4Val = await page.evaluate(() => ProductForm.getPreviewTestState().selectedTier4Id);
    expect(tier4Val).toBe('v4_glossy');
  });

  // ===========================================================================
  // RT-08: Empty allowed options without skip rule -> Checkout remains blocked
  // ===========================================================================
  test('RT-08: Empty allowed options without skip rule is treated as dead-end and blocks checkout', async ({ page }) => {
    // Configure product where Kisscut has NO triggers for V3 (dead-end) but no skip rule
    const deadEndProduct = createReferenceProduct({
      variation_dependencies: {
        version: 2,
        options: {
          v3_standar: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_potong_biasa'] },
          v3_medium: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_potong_biasa'] },
          v3_large: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_potong_biasa'] },
          v3_oval: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_diecut'] },
          v3_kotak: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_diecut'] },
          v3_custom: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_diecut'] },
          v4_glossy: { mode: 'general' },
          v4_doff: { mode: 'general' },
          v4_tanpa_laminasi: { mode: 'general' }
        },
        skip_rules: [] // No skip rules!
      }
    });

    const drawer = await setupPreviewDrawer(page, deadEndProduct);

    await selectOption(drawer, 1, 'v1_bontax');
    await selectOption(drawer, 2, 'v2_kisscut');
    await selectOption(drawer, 4, 'v4_glossy');

    // Check completion status: V3 has 0 allowed options and no skip rule -> must NOT be complete!
    const isComplete = await page.evaluate(() => {
      return ProductForm.checkAllVariationsSelected();
    });
    expect(isComplete).toBe(false);

    // Confirm button must be disabled
    const confirmBtn = drawer.locator('#btn-shopee-drawer-confirm');
    await expect(confirmBtn).toBeDisabled();
  });

  // ===========================================================================
  // RT-09: Zero-priced options -> Valid selection and checkout validation
  // ===========================================================================
  test('RT-09: Zero-priced options (Potong Biasa Rp0, Oval Rp0, Tanpa Laminasi Rp0) are valid selections and satisfy checkout', async ({ page }) => {
    const product = createReferenceProduct();
    const drawer = await setupPreviewDrawer(page, product);

    // Select Bontax (5000), Kisscut (3000), Oval (Rp0), Tanpa Laminasi (Rp0)
    await selectOption(drawer, 1, 'v1_bontax');
    await selectOption(drawer, 2, 'v2_kisscut');
    await selectOption(drawer, 3, 'v3_oval');
    await selectOption(drawer, 4, 'v4_tanpa_laminasi');

    // Verify all tiers selected and satisfied
    const isComplete = await page.evaluate(() => ProductForm.checkAllVariationsSelected());
    expect(isComplete).toBe(true);

    // Confirm button must be enabled
    const confirmBtn = drawer.locator('#btn-shopee-drawer-confirm');
    await expect(confirmBtn).not.toBeDisabled();

    // Price must accurately equal Bontax (5000) + Kisscut (3000) + Oval (0) + Tanpa Laminasi (0) = Rp8.000
    const priceDisplay = drawer.locator('.drawer-header-price');
    await expect(priceDisplay).toContainText('8.000');
  });

  // ===========================================================================
  // RT-10: V1 changes -> All affected descendant tiers are reevaluated
  // ===========================================================================
  test('RT-10: Changing V1 triggers cascading reevaluation across all downstream tiers', async ({ page }) => {
    const product = createReferenceProduct();
    const drawer = await setupPreviewDrawer(page, product);

    // Select V1 Bontax -> V2 Potong Biasa -> V3 Medium -> V4 Glossy
    await selectOption(drawer, 1, 'v1_bontax');
    await selectOption(drawer, 2, 'v2_potong_biasa');
    await selectOption(drawer, 3, 'v3_medium');
    await selectOption(drawer, 4, 'v4_glossy');

    // Verify complete
    let isComplete = await page.evaluate(() => ProductForm.checkAllVariationsSelected());
    expect(isComplete).toBe(true);

    // Change V1 to Vinyl
    await selectOption(drawer, 1, 'v1_vinyl');

    // Potong Biasa, Medium, and Glossy are still valid under Vinyl, so they should be preserved
    const stateAfter = await page.evaluate(() => ProductForm.getPreviewTestState());
    expect(stateAfter.selectedTier1Id).toBe('v1_vinyl');
    expect(stateAfter.selectedTier2Id).toBe('v2_potong_biasa');
    expect(stateAfter.selectedTier3Id).toBe('v3_medium');
    expect(stateAfter.selectedTier4Id).toBe('v4_glossy');
  });

  // ===========================================================================
  // RT-11: V4 depends on V1 -> V4 follows its own V1 dependency
  // ===========================================================================
  test('RT-11: Cross-level dependency: V4 option depending on V1 follows V1 trigger and clears when invalid', async ({ page }) => {
    // Configure V4 Glossy specifically depending on V1 Bontax and Vinyl only
    const crossProduct = createReferenceProduct({
      variation_dependencies: {
        version: 2,
        options: {
          v3_oval: { mode: 'general' },
          v3_kotak: { mode: 'general' },
          v3_custom: { mode: 'general' },
          v3_standar: { mode: 'general' },
          v3_medium: { mode: 'general' },
          v3_large: { mode: 'general' },
          v4_glossy: { mode: 'specific', parent_tier: 'tier1', trigger_ids: ['v1_bontax', 'v1_vinyl'] },
          v4_doff: { mode: 'general' },
          v4_tanpa_laminasi: { mode: 'general' }
        },
        skip_rules: []
      }
    });

    const drawer = await setupPreviewDrawer(page, crossProduct);

    // Select V1 Bontax -> V4 Glossy should be enabled
    await selectOption(drawer, 1, 'v1_bontax');
    await selectOption(drawer, 2, 'v2_kisscut');
    await selectOption(drawer, 3, 'v3_oval');
    await selectOption(drawer, 4, 'v4_glossy');

    expect(await page.evaluate(() => ProductForm.getPreviewTestState().selectedTier4Id)).toBe('v4_glossy');

    // Switch V1 to Hologram (not in trigger_ids ['v1_bontax', 'v1_vinyl'])
    await selectOption(drawer, 1, 'v1_hologram');

    // V4 Glossy must be cleared to null!
    const v4ValAfter = await page.evaluate(() => ProductForm.getPreviewTestState().selectedTier4Id);
    expect(v4ValAfter).toBeNull();

    // V4 Glossy chip must be disabled under Hologram
    await ensureAccordionOpen(drawer, 4);
    await expect(drawer.locator('.btn-shopee-tier4[data-id="v4_glossy"]')).toHaveClass(/disabled/);
  });

  // ===========================================================================
  // RT-12: Legacy product -> Existing legacy behavior remains functional
  // ===========================================================================
  test('RT-12: Legacy product without variation_dependencies falls back cleanly to specific_options_map', async ({ page }) => {
    const legacyProduct = {
      ...TEST_PRODUCT,
      id: 'prod-legacy-runtime-001',
      name: 'Banner Flexi Legacy Runtime',
      product_type: 'physical',
      card_variant: 'A',
      has_variants: true,
      has_variation_2: true,
      has_variation_3: false,
      has_variation_4: false,
      has_wholesale: false,
      has_order_multiple: false,
      has_extra_service: false,
      stock_mode_tiers: { tier1: 'same', main: 'same' },
      materials: [
        { id: 'mat_leg_01', name: 'Flexi Frontlite', price: 25000, stock: 100, max_order: 1000, variation_scopes: { main: 'spesifik' } },
        { id: 'mat_leg_02', name: 'Flexi Backlite', price: 40000, stock: 100, max_order: 1000, variation_scopes: { main: 'umum' } }
      ],
      finishings: {
        main: [
          { id: 'fin_leg_01', name: 'Mata Ayam Tiap Sudut', price: 5000, stock: 100 },
          { id: 'fin_leg_02', name: 'Lipat Pres Saja', price: 3000, stock: 100 }
        ],
        extra_1: [],
        extra_2: [],
        extra_3: []
      },
      specific_options_map: {
        mat_leg_01: { main: ['fin_leg_01'] }
      },
      variation_dependencies: null // Legacy: No V2
    };

    const drawer = await setupPreviewDrawer(page, legacyProduct);

    // Select Frontlite (spesifik -> only fin_leg_01 allowed)
    await selectOption(drawer, 1, 'mat_leg_01');

    await expect(drawer.locator('.btn-shopee-tier2[data-id="fin_leg_01"]')).not.toHaveClass(/disabled/);
    await expect(drawer.locator('.btn-shopee-tier2[data-id="fin_leg_02"]')).toHaveClass(/disabled/);

    // Switch to Backlite (umum -> both allowed)
    await selectOption(drawer, 1, 'mat_leg_02');
    await expect(drawer.locator('.btn-shopee-tier2[data-id="fin_leg_01"]')).not.toHaveClass(/disabled/);
    await expect(drawer.locator('.btn-shopee-tier2[data-id="fin_leg_02"]')).not.toHaveClass(/disabled/);
  });

  // ===========================================================================
  // RT-13: Stale pricing -> Invalid child price is removed immediately
  // ===========================================================================
  test('RT-13: Switching V2 immediately removes stale child price from drawer live pricing', async ({ page }) => {
    const product = createReferenceProduct();
    const drawer = await setupPreviewDrawer(page, product);

    // Initial configuration:
    // Bontax: Rp5.000
    // Potong Biasa: Rp0
    // Medium: Rp4.000
    // Tanpa Laminasi: Rp0
    // Total = Rp9.000
    await selectOption(drawer, 1, 'v1_bontax');
    await selectOption(drawer, 2, 'v2_potong_biasa');
    await selectOption(drawer, 3, 'v3_medium');
    await selectOption(drawer, 4, 'v4_tanpa_laminasi');

    const priceDisplay = drawer.locator('.drawer-header-price');
    await expect(priceDisplay).toContainText('9.000');

    // Switch V2 from Potong Biasa (0) to Kisscut (3000)
    // Medium (4000) is invalidated and cleared to null (Rp0)
    await selectOption(drawer, 2, 'v2_kisscut');

    // Verify V3 selection in state was cleared to null
    const tier3After = await page.evaluate(() => ProductForm.getPreviewTestState().selectedTier3Id);
    expect(tier3After).toBeNull();

    // Verify drawer header shows price range because V3 is now unselected (stale Medium price not retained)
    await expect(priceDisplay).toContainText('Rp5.000-Rp17.500');

    // Select Oval (Rp0) to complete the selection under Kisscut
    await selectOption(drawer, 3, 'v3_oval');

    // Now all 4 tiers are selected: Bontax (5000) + Kisscut (3000) + Oval (0) + Tanpa Laminasi (0) = Rp8.000
    await expect(priceDisplay).toContainText('8.000');
    expect(await priceDisplay.textContent()).not.toContain('12.000'); // No stale 5000+3000+4000
  });

  // ===========================================================================
  // RT-14: Save and reload -> V2 dependency configuration survives round-trip persistence
  // ===========================================================================
  test('RT-14: V2 variation_dependencies survives product save, reload, and editing round-trip', async ({ page }) => {
    const product = createReferenceProduct();
    await injectDeterministicStorage(page, { authenticated: true, product });
    await page.goto('/admin.html');
    await page.waitForSelector('#admin-main-viewport');

    // 1. Verify DB contains variation_dependencies
    const savedProdBefore = await page.evaluate((pid) => {
      const prods = DB.getProducts();
      return prods.find(p => p.id === pid);
    }, product.id);

    expect(savedProdBefore).toBeDefined();
    expect(savedProdBefore.variation_dependencies).toBeDefined();
    expect(savedProdBefore.variation_dependencies.version).toBe(2);
    expect(savedProdBefore.variation_dependencies.options['v3_oval'].trigger_ids).toEqual(['v2_kisscut', 'v2_diecut']);
    expect(savedProdBefore.variation_dependencies.skip_rules[0].target_tier).toBe('extra_1');

    // 2. Open edit product form and go to Step 2
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

    // Save product via submit button
    const btnSubmit = page.locator('#btn-submit-product');
    await expect(btnSubmit).toBeVisible();
    await btnSubmit.click();

    // 3. Reload from DB and verify dependencies remain fully intact
    await expect.poll(async () => {
      return await page.evaluate((pid) => {
        const prods = DB.getProducts();
        const p = prods.find(prod => prod.id === pid);
        return p && p.variation_dependencies && p.variation_dependencies.version === 2;
      }, product.id);
    }, { timeout: 7000 }).toBeTruthy();

    const savedProdAfter = await page.evaluate((pid) => {
      const prods = DB.getProducts();
      return prods.find(p => p.id === pid);
    }, product.id);

    expect(savedProdAfter.variation_dependencies).toBeDefined();
    expect(savedProdAfter.variation_dependencies.version).toBe(2);
    expect(savedProdAfter.variation_dependencies.options['v3_medium'].trigger_ids).toEqual(['v2_potong_biasa']);
    expect(savedProdAfter.variation_dependencies.skip_rules[0].trigger_ids).toEqual(['v2_lembaran']);
  });

});

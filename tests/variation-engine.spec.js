// @ts-check
const { test, expect } = require('@playwright/test');
const VariationEngine = require('../js/variation-engine');

test.describe('POS Songer Creative - Task 02C: Isolated Variation Dependency Engine', () => {

  /**
   * Deterministic test fixture modeling the Reference Sticker Product
   */
  function createReferenceProduct(overrides = {}) {
    return {
      id: 'prod-sticker-custom-test',
      name: 'Stiker Custom Komplit',
      has_variants: true,
      has_variation_2: true,
      has_variation_3: true,
      has_variation_4: true,
      materials: [
        { id: 'v1_bontax', name: 'Bontax', price: 5000, cost_price: 2500 },
        { id: 'v1_vinyl', name: 'Vinyl', price: 7000, cost_price: 3500 },
        { id: 'v1_hologram', name: 'Hologram', price: 7000, cost_price: 3500 },
        { id: 'v1_transparan', name: 'Transparan', price: 8000, cost_price: 4000 }
      ],
      finishings: {
        main: [
          { id: 'v2_kisscut', name: 'Kisscut', price: 3000, cost_price: 1000 },
          { id: 'v2_diecut', name: 'Diecut', price: 4000, cost_price: 1500 },
          { id: 'v2_potong_biasa', name: 'Potong Biasa', price: 0, cost_price: 0 },
          { id: 'v2_lembaran', name: 'Lembaran', price: 0, cost_price: 0 }
        ],
        extra_1: [
          { id: 'v3_oval', name: 'Oval / Bulat', price: 0, cost_price: 0 },
          { id: 'v3_kotak', name: 'Kotak / Persegi Panjang', price: 0, cost_price: 0 },
          { id: 'v3_custom', name: 'Sesuai Pola', price: 500, cost_price: 200 },
          { id: 'v3_standar', name: 'Standar', price: 2000, cost_price: 800 },
          { id: 'v3_medium', name: 'Medium', price: 4000, cost_price: 1500 },
          { id: 'v3_large', name: 'Large', price: 1000, cost_price: 400 }
        ],
        extra_2: [
          { id: 'v4_glossy', name: 'Glossy', price: 1500, cost_price: 500 },
          { id: 'v4_doff', name: 'Doff', price: 1500, cost_price: 500 },
          { id: 'v4_tanpa_laminasi', name: 'Tanpa Laminasi', price: 0, cost_price: 0 }
        ]
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

  // ===========================================================================
  // TEST 1: LEGACY-ONLY COMPATIBILITY
  // ===========================================================================
  test('1. Legacy compatibility: Older products without variation_dependencies retain legacy filtering', () => {
    const legacyProduct = {
      id: 'prod-legacy-001',
      has_variants: true,
      has_variation_2: true,
      has_variation_3: true,
      materials: [
        { id: 'mat_01', name: 'Flexi Standar', price: 25000, variation_scopes: { main: 'spesifik', extra_1: 'umum' } },
        { id: 'mat_02', name: 'Flexi Korchin', price: 35000, variation_scopes: { main: 'umum', extra_1: 'spesifik' } }
      ],
      finishings: {
        main: [
          { id: 'fin_m1', name: 'Mata Ayam' },
          { id: 'fin_m2', name: 'Kolong Kayu' }
        ],
        extra_1: [
          { id: 'fin_e1', name: 'Lipat Pres' },
          { id: 'fin_e2', name: 'Ramping' }
        ]
      },
      specific_options_map: {
        mat_01: { main: ['fin_m1'], extra_1: ['fin_e1', 'fin_e2'] },
        mat_02: { main: ['fin_m1', 'fin_m2'], extra_1: ['fin_e2'] }
      }
      // No variation_dependencies
    };

    // When mat_01 is selected: V2 main is restricted to ['fin_m1'], V3 extra_1 is unrestricted
    const resMat1 = VariationEngine.resolveEffectiveAllowedOptions(legacyProduct, 'main', { tier1: 'mat_01' });
    expect(resMat1.isSkipped).toBe(false);
    expect(resMat1.isSpecific).toBe(true);
    expect(resMat1.allowedIds).toEqual(['fin_m1']);

    const resMat1Extra = VariationEngine.resolveEffectiveAllowedOptions(legacyProduct, 'extra_1', { tier1: 'mat_01' });
    expect(resMat1Extra.allowedIds).toEqual(['fin_e1', 'fin_e2']);

    // When mat_02 is selected: V2 main is 'umum', V3 extra_1 is restricted to ['fin_e2']
    const resMat2 = VariationEngine.resolveEffectiveAllowedOptions(legacyProduct, 'main', { tier1: 'mat_02' });
    expect(resMat2.allowedIds).toEqual(['fin_m1', 'fin_m2']);

    const resMat2Extra = VariationEngine.resolveEffectiveAllowedOptions(legacyProduct, 'extra_1', { tier1: 'mat_02' });
    expect(resMat2Extra.allowedIds).toEqual(['fin_e2']);
  });

  // ===========================================================================
  // TEST 2: GENERAL OPTION VISIBILITY
  // ===========================================================================
  test('2. General options: Options with mode general remain available regardless of parent selection', () => {
    const product = createReferenceProduct();

    // V4 options are all general: should be available under Kisscut
    const resKisscut = VariationEngine.resolveEffectiveAllowedOptions(product, 'extra_2', { tier1: 'v1_bontax', main: 'v2_kisscut' });
    expect(resKisscut.allowedIds).toEqual(['v4_glossy', 'v4_doff', 'v4_tanpa_laminasi']);

    // Should also be available under Potong Biasa
    const resPotong = VariationEngine.resolveEffectiveAllowedOptions(product, 'extra_2', { tier1: 'v1_bontax', main: 'v2_potong_biasa' });
    expect(resPotong.allowedIds).toEqual(['v4_glossy', 'v4_doff', 'v4_tanpa_laminasi']);
  });

  // ===========================================================================
  // TEST 3: SPECIFIC OPTION WITH SINGLE TRIGGER
  // ===========================================================================
  test('3. Specific option with single trigger: Standar, Medium, Large visible only when V2 is Potong Biasa', () => {
    const product = createReferenceProduct();

    // When V2 = Potong Biasa
    const resPotong = VariationEngine.resolveEffectiveAllowedOptions(product, 'extra_1', { tier1: 'v1_bontax', main: 'v2_potong_biasa' });
    expect(resPotong.allowedIds).toEqual(['v3_standar', 'v3_medium', 'v3_large']);

    // When V2 = Kisscut, complexity options must NOT appear
    const resKisscut = VariationEngine.resolveEffectiveAllowedOptions(product, 'extra_1', { tier1: 'v1_bontax', main: 'v2_kisscut' });
    expect(resKisscut.allowedIds).not.toContain('v3_standar');
    expect(resKisscut.allowedIds).not.toContain('v3_medium');
    expect(resKisscut.allowedIds).not.toContain('v3_large');
  });

  // ===========================================================================
  // TEST 4: SPECIFIC OPTION WITH MULTIPLE OR TRIGGERS
  // ===========================================================================
  test('4. Specific option with multiple OR triggers: Oval, Kotak, Custom visible when V2 is Kisscut OR Diecut', () => {
    const product = createReferenceProduct();

    // When V2 = Kisscut
    const resKisscut = VariationEngine.resolveEffectiveAllowedOptions(product, 'extra_1', { tier1: 'v1_bontax', main: 'v2_kisscut' });
    expect(resKisscut.allowedIds).toEqual(['v3_oval', 'v3_kotak', 'v3_custom']);

    // When V2 = Diecut
    const resDiecut = VariationEngine.resolveEffectiveAllowedOptions(product, 'extra_1', { tier1: 'v1_bontax', main: 'v2_diecut' });
    expect(resDiecut.allowedIds).toEqual(['v3_oval', 'v3_kotak', 'v3_custom']);

    // Neither shape option should be allowed under Potong Biasa
    const resPotong = VariationEngine.resolveEffectiveAllowedOptions(product, 'extra_1', { tier1: 'v1_bontax', main: 'v2_potong_biasa' });
    expect(resPotong.allowedIds).not.toContain('v3_oval');
    expect(resPotong.allowedIds).not.toContain('v3_kotak');
    expect(resPotong.allowedIds).not.toContain('v3_custom');
  });

  // ===========================================================================
  // TEST 5: STRICT PRECEDENCE MODEL (V2 OVERRIDES LEGACY, LEGACY FALLBACK)
  // ===========================================================================
  test('5. Precedence model: variation_dependencies v2 takes precedence over legacy specific_options_map, with fallback to legacy when v2 absent', () => {
    const productWithV2 = createReferenceProduct({
      materials: [
        {
          id: 'v1_transparan',
          name: 'Transparan',
          price: 8000,
          variation_scopes: { extra_1: 'spesifik' }
        }
      ],
      specific_options_map: {
        v1_transparan: {
          // Legacy map only specifies Oval and Standar
          extra_1: ['v3_oval', 'v3_standar']
        }
      }
    });

    // 1. When variation_dependencies v2 is present, V2 rules take precedence:
    // v2 rules for Kisscut allow: ['v3_oval', 'v3_kotak', 'v3_custom']
    const resV2 = VariationEngine.resolveEffectiveAllowedOptions(productWithV2, 'extra_1', {
      tier1: 'v1_transparan',
      main: 'v2_kisscut'
    });
    expect(resV2.allowedIds).toEqual(['v3_oval', 'v3_kotak', 'v3_custom']);

    // 2. When variation_dependencies is absent/null, fallback to legacy specific_options_map:
    const legacyProduct = {
      ...productWithV2,
      variation_dependencies: null
    };
    const resLegacy = VariationEngine.resolveEffectiveAllowedOptions(legacyProduct, 'extra_1', {
      tier1: 'v1_transparan',
      main: 'v2_kisscut'
    });
    expect(resLegacy.allowedIds).toEqual(['v3_oval', 'v3_standar']);
  });

  // ===========================================================================
  // TEST 6: INVALID CHILD SELECTION CLEARING
  // ===========================================================================
  test('6. Selection cascade: Switching V2 from Potong Biasa to Kisscut clears Medium to null without auto-select', () => {
    const product = createReferenceProduct();
    const initialSelections = {
      tier1: 'v1_bontax',
      main: 'v2_potong_biasa',
      extra_1: 'v3_medium',
      extra_2: 'v4_tanpa_laminasi'
    };

    // User switches V2 to Kisscut
    const updatedInput = { ...initialSelections, main: 'v2_kisscut' };
    const cascadeResult = VariationEngine.validateAndAdjustSelections(product, updatedInput, 'main');

    // Medium is invalid under Kisscut: MUST BE CLEARED TO NULL
    expect(cascadeResult.selections.extra_1).toBeNull();
    expect(cascadeResult.clearedTiers).toContain('extra_1');

    // Must NOT auto-select the first option ('v3_oval')
    expect(cascadeResult.selections.extra_1).not.toBe('v3_oval');

    // V4 Tanpa Laminasi was general and valid: must remain intact
    expect(cascadeResult.selections.extra_2).toBe('v4_tanpa_laminasi');
    expect(cascadeResult.preservedTiers).toContain('extra_2');

    // Since V3 is now unselected (null), completion status is false
    expect(cascadeResult.isComplete).toBe(false);
  });

  // ===========================================================================
  // TEST 7: STILL-VALID CHILD PRESERVATION
  // ===========================================================================
  test('7. Selection cascade: Switching V2 from Kisscut to Diecut preserves Oval selection', () => {
    const product = createReferenceProduct();
    const initialSelections = {
      tier1: 'v1_bontax',
      main: 'v2_kisscut',
      extra_1: 'v3_oval',
      extra_2: 'v4_glossy'
    };

    // User switches V2 to Diecut (both Kisscut and Diecut allow Oval)
    const updatedInput = { ...initialSelections, main: 'v2_diecut' };
    const cascadeResult = VariationEngine.validateAndAdjustSelections(product, updatedInput, 'main');

    // Oval remains selected
    expect(cascadeResult.selections.extra_1).toBe('v3_oval');
    expect(cascadeResult.preservedTiers).toContain('extra_1');
    expect(cascadeResult.clearedTiers).not.toContain('extra_1');
    expect(cascadeResult.selections.extra_2).toBe('v4_glossy');
    expect(cascadeResult.isComplete).toBe(true);
  });

  // ===========================================================================
  // TEST 8: CONDITIONAL V3 SKIPPING
  // ===========================================================================
  test('8. Conditional skipping: V2 Lembaran explicitly skips V3 and marks selection satisfied as null', () => {
    const product = createReferenceProduct();
    const initialSelections = {
      tier1: 'v1_bontax',
      main: 'v2_potong_biasa',
      extra_1: 'v3_standar',
      extra_2: 'v4_tanpa_laminasi'
    };

    // Switch V2 to Lembaran
    const updatedInput = { ...initialSelections, main: 'v2_lembaran' };
    const cascadeResult = VariationEngine.validateAndAdjustSelections(product, updatedInput, 'main');

    // V3 must be explicitly marked as skipped and selection forced to null
    expect(cascadeResult.skippedTiers).toContain('extra_1');
    expect(cascadeResult.selections.extra_1).toBeNull();

    // Verify resolveEffectiveAllowedOptions reflects skipped status
    const v3Res = VariationEngine.resolveEffectiveAllowedOptions(product, 'extra_1', cascadeResult.selections);
    expect(v3Res.isSkipped).toBe(true);
    expect(v3Res.allowedIds).toEqual([]);

    // Since V3 is skipped and other active tiers are selected, isComplete is TRUE
    expect(cascadeResult.isComplete).toBe(true);
  });

  // ===========================================================================
  // TEST 9: V4 ACCESSIBILITY WHEN V3 IS SKIPPED
  // ===========================================================================
  test('9. Downstream access: V4 remains selectable and accessible when V3 is skipped', () => {
    const product = createReferenceProduct();
    const selections = {
      tier1: 'v1_bontax',
      main: 'v2_lembaran',
      extra_1: null,
      extra_2: 'v4_doff'
    };

    const v4Res = VariationEngine.resolveEffectiveAllowedOptions(product, 'extra_2', selections);
    expect(v4Res.isSkipped).toBe(false);
    expect(v4Res.allowedIds).toEqual(['v4_glossy', 'v4_doff', 'v4_tanpa_laminasi']);

    const snapshot = VariationEngine.getValidatedPricingSnapshot(product, selections);
    expect(snapshot.isValid).toBe(true);
    expect(snapshot.tierStatus.main.status).toBe('selected');
    expect(snapshot.tierStatus.extra_1.status).toBe('skipped');
    expect(snapshot.tierStatus.extra_2.status).toBe('selected');
    expect(snapshot.tierStatus.extra_2.optionId).toBe('v4_doff');
  });

  // ===========================================================================
  // TEST 10: REQUIRED BUT UNSELECTED TIER
  // ===========================================================================
  test('10. Validation gate: Required unselected tier produces isValid=false and lists tier in missingTiers', () => {
    const product = createReferenceProduct();
    const incompleteSelections = {
      tier1: 'v1_bontax',
      main: 'v2_kisscut',
      extra_1: null, // Required but unselected
      extra_2: 'v4_glossy'
    };

    const snapshot = VariationEngine.getValidatedPricingSnapshot(product, incompleteSelections);
    expect(snapshot.isValid).toBe(false);
    expect(snapshot.isComplete).toBe(false);
    expect(snapshot.missingTiers).toContain('extra_1');
    expect(snapshot.tierStatus.extra_1.status).toBe('unselected');
    expect(snapshot.tierStatus.extra_1.price).toBe(0);
  });

  // ===========================================================================
  // TEST 11: EMPTY ALLOWED-OPTION SET WITHOUT SKIP RULE (DEAD-END)
  // ===========================================================================
  test('11. Dead-end distinction: Empty allowed set without skip rule is NOT treated as skipped', () => {
    const product = createReferenceProduct({
      variation_dependencies: {
        version: 2,
        options: {
          // All V3 options are configured as specific to Diecut only; Kisscut has 0 options
          v3_oval: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_diecut'] },
          v3_kotak: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_diecut'] },
          v3_custom: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_diecut'] },
          v3_standar: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_diecut'] },
          v3_medium: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_diecut'] },
          v3_large: { mode: 'specific', parent_tier: 'main', trigger_ids: ['v2_diecut'] }
        },
        skip_rules: [] // No skip rule
      }
    });

    const resKisscut = VariationEngine.resolveEffectiveAllowedOptions(product, 'extra_1', {
      tier1: 'v1_bontax',
      main: 'v2_kisscut'
    });

    // Tier is NOT skipped, but allowedIds is empty!
    expect(resKisscut.isSkipped).toBe(false);
    expect(resKisscut.allowedIds).toEqual([]);

    // Selection snapshot treats this as incomplete/blocked, NOT satisfied
    const snapshot = VariationEngine.getValidatedPricingSnapshot(product, {
      tier1: 'v1_bontax',
      main: 'v2_kisscut',
      extra_1: null,
      extra_2: 'v4_glossy'
    });
    expect(snapshot.isValid).toBe(false);
    expect(snapshot.missingTiers).toContain('extra_1');
  });

  // ===========================================================================
  // TEST 12: ZERO-PRICED VALID OPTIONS
  // ===========================================================================
  test('12. Zero-priced options: Potong Biasa (0), Oval (0), and Tanpa Laminasi (0) are valid active selections', () => {
    const product = createReferenceProduct();

    // Scenario 12A: Bontax (5k) + Kisscut (3k) + Oval (0) + Tanpa Laminasi (0)
    const selA = {
      tier1: 'v1_bontax',
      main: 'v2_kisscut',
      extra_1: 'v3_oval',
      extra_2: 'v4_tanpa_laminasi'
    };
    const snapA = VariationEngine.getValidatedPricingSnapshot(product, selA);
    expect(snapA.isValid).toBe(true);
    expect(snapA.tierStatus.extra_1.status).toBe('selected');
    expect(snapA.tierStatus.extra_1.price).toBe(0);
    expect(snapA.tierStatus.extra_2.status).toBe('selected');
    expect(snapA.tierStatus.extra_2.price).toBe(0);
    expect(snapA.totalOptionPrice).toBe(8000); // 5000 + 3000 + 0 + 0

    // Scenario 12B: Bontax (5k) + Lembaran (0) + Skipped V3 (0) + Tanpa Laminasi (0)
    const selB = {
      tier1: 'v1_bontax',
      main: 'v2_lembaran',
      extra_1: null,
      extra_2: 'v4_tanpa_laminasi'
    };
    const snapB = VariationEngine.getValidatedPricingSnapshot(product, selB);
    expect(snapB.isValid).toBe(true);
    expect(snapB.tierStatus.main.price).toBe(0);
    expect(snapB.tierStatus.extra_1.status).toBe('skipped');
    expect(snapB.tierStatus.extra_1.price).toBe(0);
    expect(snapB.tierStatus.extra_2.price).toBe(0);
    expect(snapB.totalOptionPrice).toBe(5000); // 5000 + 0 + 0 + 0

    // Scenario 12C: Forbidden zero-priced combination (Potong Biasa + Oval)
    const forbiddenSel = {
      tier1: 'v1_bontax',
      main: 'v2_potong_biasa',
      extra_1: 'v3_oval',
      extra_2: 'v4_tanpa_laminasi'
    };
    const adjusted = VariationEngine.validateAndAdjustSelections(product, forbiddenSel, 'main');
    expect(adjusted.selections.extra_1).toBeNull(); // Oval cleared because Potong Biasa forbids it
  });

  // ===========================================================================
  // TEST 13: INVALID PARENT REFERENCES
  // ===========================================================================
  test('13. Reference integrity: Specific option referencing inactive or unknown parent tier is rejected', () => {
    const invalidProduct = createReferenceProduct({
      variation_dependencies: {
        version: 2,
        options: {
          v3_oval: { mode: 'specific', parent_tier: 'unknown_tier', trigger_ids: ['v2_kisscut'] }
        },
        skip_rules: []
      }
    });

    const dagRes = VariationEngine.validateDependencyDAG(invalidProduct);
    expect(dagRes.isValid).toBe(false);
    expect(dagRes.errors.length).toBeGreaterThan(0);
    expect(dagRes.errors[0]).toContain('tidak valid');
  });

  // ===========================================================================
  // TEST 14: FORWARD AND CIRCULAR DEPENDENCY PREVENTION (DAG ENFORCEMENT)
  // ===========================================================================
  test('14. Topological order: Forward and self dependencies (e.g. V2 depending on V3) are rejected', () => {
    // Attempting to make V2 (rank 2) depend on V3 (rank 3): Forward dependency!
    const cyclicProduct = createReferenceProduct({
      variation_dependencies: {
        version: 2,
        options: {
          v2_kisscut: { mode: 'specific', parent_tier: 'extra_1', trigger_ids: ['v3_oval'] }
        },
        skip_rules: []
      }
    });

    const dagRes = VariationEngine.validateDependencyDAG(cyclicProduct);
    expect(dagRes.isValid).toBe(false);
    expect(dagRes.errors.length).toBeGreaterThan(0);
    expect(dagRes.errors.some(e => e.includes('harus berada di atas'))).toBe(true);

    // Self dependency (V3 depending on V3)
    const selfDepProduct = createReferenceProduct({
      variation_dependencies: {
        version: 2,
        options: {
          v3_oval: { mode: 'specific', parent_tier: 'extra_1', trigger_ids: ['v3_kotak'] }
        },
        skip_rules: []
      }
    });
    const selfRes = VariationEngine.validateDependencyDAG(selfDepProduct);
    expect(selfRes.isValid).toBe(false);
    expect(selfRes.errors.some(e => e.includes('harus berada di atas'))).toBe(true);
  });

  // ===========================================================================
  // TEST 15: MISSING OR DELETED TRIGGER IDS
  // ===========================================================================
  test('15. Trigger validation: Specific option with empty triggers or non-existent parent IDs is rejected', () => {
    // 1. Specific option with empty triggers array
    const emptyTrigProduct = createReferenceProduct({
      variation_dependencies: {
        version: 2,
        options: {
          v3_oval: { mode: 'specific', parent_tier: 'main', trigger_ids: [] }
        },
        skip_rules: []
      }
    });
    const emptyRes = VariationEngine.validateDependencyDAG(emptyTrigProduct);
    expect(emptyRes.isValid).toBe(false);
    expect(emptyRes.errors.some(e => e.includes('minimal 1 pilihan pemicu'))).toBe(true);

    // 2. Specific option referencing a deleted/non-existent trigger ID
    const ghostTrigProduct = createReferenceProduct({
      variation_dependencies: {
        version: 2,
        options: {
          v3_oval: { mode: 'specific', parent_tier: 'main', trigger_ids: ['deleted_parent_id'] }
        },
        skip_rules: []
      }
    });
    const ghostRes = VariationEngine.validateDependencyDAG(ghostTrigProduct);
    expect(ghostRes.isValid).toBe(false);
    expect(ghostRes.errors.some(e => e.includes('tidak ditemukan'))).toBe(true);
  });

  // ===========================================================================
  // TEST 16: INPUT IMMUTABILITY
  // ===========================================================================
  test('16. Pure function immutability: Passing product and selections does not mutate input objects', () => {
    const product = createReferenceProduct();
    const selections = {
      tier1: 'v1_bontax',
      main: 'v2_potong_biasa',
      extra_1: 'v3_medium',
      extra_2: 'v4_tanpa_laminasi'
    };

    const productCopy = JSON.parse(JSON.stringify(product));
    const selectionsCopy = JSON.parse(JSON.stringify(selections));

    // Execute all public engine functions
    VariationEngine.resolveEffectiveAllowedOptions(product, 'extra_1', selections);
    VariationEngine.validateAndAdjustSelections(product, selections, 'main');
    VariationEngine.getValidatedPricingSnapshot(product, selections);
    VariationEngine.validateDependencyDAG(product);

    // Deep compare to original copies
    expect(product).toEqual(productCopy);
    expect(selections).toEqual(selectionsCopy);
  });

  // ===========================================================================
  // TEST 17: STALE SELECTION EXCLUSION FROM PRICING SNAPSHOT (REFERENCE FLOW)
  // ===========================================================================
  test('17. Stale price exclusion: Switching V2 clears invalid V3 price with verified net delta of -1,000', () => {
    const product = createReferenceProduct();

    // Step 1: Initial Selection
    // Bontax (5,000) + Potong Biasa (0) + Medium (4,000) + Tanpa Laminasi (0) = 9,000
    const step1Selections = {
      tier1: 'v1_bontax',
      main: 'v2_potong_biasa',
      extra_1: 'v3_medium',
      extra_2: 'v4_tanpa_laminasi'
    };
    const snap1 = VariationEngine.getValidatedPricingSnapshot(product, step1Selections);
    expect(snap1.isValid).toBe(true);
    expect(snap1.totalOptionPrice).toBe(9000);
    expect(snap1.tierStatus.extra_1.price).toBe(4000);

    // Step 2: Switch V2 to Kisscut (+3,000)
    // Medium is invalid under Kisscut -> resets to null (0)
    // New total: 5,000 + 3,000 + 0 + 0 = 8,000 (Net delta: -1,000)
    const step2Raw = { ...step1Selections, main: 'v2_kisscut' };
    const snap2 = VariationEngine.getValidatedPricingSnapshot(product, step2Raw);

    // V3 Medium price of 4,000 is COMPLETELY EXCLUDED
    expect(snap2.tierStatus.extra_1.status).toBe('unselected');
    expect(snap2.tierStatus.extra_1.price).toBe(0);
    expect(snap2.totalOptionPrice).toBe(8000);

    // Mathematical verification of net price delta
    const netDelta = snap2.totalOptionPrice - snap1.totalOptionPrice;
    expect(netDelta).toBe(-1000); // Exactly -Rp1,000

    // Step 3: Explicitly choose Sesuai Pola (+500)
    // Final total: 5,000 + 3,000 + 500 + 0 = 8,500
    const step3Selections = { ...snap2.selections, extra_1: 'v3_custom' };
    const snap3 = VariationEngine.getValidatedPricingSnapshot(product, step3Selections);
    expect(snap3.isValid).toBe(true);
    expect(snap3.tierStatus.extra_1.price).toBe(500);
    expect(snap3.totalOptionPrice).toBe(8500);
  });

});

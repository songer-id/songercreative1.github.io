/**
 * ==============================================================================
 * POS BY SONGER CREATIVE - VARIATION DEPENDENCY ENGINE (ISOLATED CORE)
 * Standalone pure-function engine for Option-Level Directed Acyclic Graph (DAG)
 * visibility rules, legacy material intersection, and reactive cascading resets.
 * ==============================================================================
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // Node.js CommonJS
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  } else {
    // Browser Global
    root.VariationEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Canonical variation tier ranks (DAG Topological Order)
  // Strict invariant: Parent tier rank MUST strictly precede child tier rank.
  const TIER_RANKS = Object.freeze({
    tier1: 1,
    main: 2,
    extra_1: 3,
    extra_2: 4
  });

  const CANONICAL_TIERS = Object.freeze(['tier1', 'main', 'extra_1', 'extra_2']);

  const DEFAULT_TIER_LABELS = Object.freeze({
    tier1: 'Variasi 1 (Bahan)',
    main: 'Variasi 2 (Finishing)',
    extra_1: 'Variasi 3 (Finishing Tambahan)',
    extra_2: 'Variasi 4 (Laminasi)'
  });

  /**
   * Normalizes arbitrary variation tier names to canonical keys.
   * @param {string} tierKey
   * @returns {'tier1' | 'main' | 'extra_1' | 'extra_2' | string}
   */
  function normalizeTierKey(tierKey) {
    if (!tierKey || typeof tierKey !== 'string') return '';
    const clean = tierKey.trim().toLowerCase();
    if (clean === 'tier1' || clean === 'materials' || clean === 'material' || clean === 'bahan') return 'tier1';
    if (clean === 'tier2' || clean === 'main' || clean === 'finishing') return 'main';
    if (clean === 'tier3' || clean === 'extra_1' || clean === 'finishing_tambahan') return 'extra_1';
    if (clean === 'tier4' || clean === 'extra_2' || clean === 'laminasi') return 'extra_2';
    return clean;
  }

  /**
   * Returns topological rank for a tier.
   * @param {string} tierKey
   * @returns {number} 1-4, or 0 if unknown
   */
  function getTierRank(tierKey) {
    const norm = normalizeTierKey(tierKey);
    return TIER_RANKS[norm] || 0;
  }

  /**
   * Checks whether a variation tier is currently active on the product.
   * @param {Object} product
   * @param {string} tierKey
   * @returns {boolean}
   */
  function isTierActive(product, tierKey) {
    if (!product) return false;
    const norm = normalizeTierKey(tierKey);
    if (norm === 'tier1') return Boolean(product.has_variants);
    if (norm === 'main') return Boolean(product.has_variation_2);
    if (norm === 'extra_1') return Boolean(product.has_variation_3);
    if (norm === 'extra_2') return Boolean(product.has_variation_4);
    return false;
  }

  /**
   * Retrieves defined options for a given tier in normalized array format.
   * Non-destructive, returns empty array if missing.
   * @param {Object} product
   * @param {string} tierKey
   * @returns {Array<{ id: string, name: string, price: number, cost_price?: number }>}
   */
  function getTierOptions(product, tierKey) {
    if (!product) return [];
    const norm = normalizeTierKey(tierKey);

    if (norm === 'tier1') {
      const mats = Array.isArray(product.materials) ? product.materials : [];
      return mats.filter(m => m && m.id && String(m.name || '').trim() !== '');
    }

    if (product.finishings) {
      if (typeof product.finishings === 'object' && !Array.isArray(product.finishings)) {
        const list = product.finishings[norm];
        return Array.isArray(list) ? list.filter(f => f && f.id && String(f.name || '').trim() !== '') : [];
      }
      if (Array.isArray(product.finishings)) {
        return product.finishings.filter(f => f && f.id && normalizeTierKey(f.tier) === norm && String(f.name || '').trim() !== '');
      }
    }

    return [];
  }

  /**
   * Resolves the human-readable display label for a variation tier.
   * @param {Object} product
   * @param {string} tierKey
   * @returns {string}
   */
  function getTierLabel(product, tierKey) {
    const norm = normalizeTierKey(tierKey);
    const customLabels = product?.variation_labels || {};
    if (norm === 'tier1') return customLabels.label_tier_1 || DEFAULT_TIER_LABELS.tier1;
    if (norm === 'main') return customLabels.label_tier_2 || DEFAULT_TIER_LABELS.main;
    if (norm === 'extra_1') return customLabels.label_extra_1 || DEFAULT_TIER_LABELS.extra_1;
    if (norm === 'extra_2') return customLabels.label_extra_2 || DEFAULT_TIER_LABELS.extra_2;
    return norm;
  }

  /**
   * Pure evaluation of conditional tier skipping.
   * If a parent selection matches a defined skip rule, target tier must be bypassed.
   * 
   * @param {Object} product
   * @param {string} tierKey - The tier being inspected (e.g. 'extra_1')
   * @param {Record<string, string | null>} currentSelections - { tier1: '...', main: '...', ... }
   * @returns {boolean}
   */
  function isTierSkipped(product, tierKey, currentSelections) {
    if (!product || !currentSelections) return false;
    const normTier = normalizeTierKey(tierKey);
    const deps = product.variation_dependencies;
    if (!deps || !Array.isArray(deps.skip_rules)) return false;

    for (const rule of deps.skip_rules) {
      if (!rule) continue;
      const targetNorm = normalizeTierKey(rule.target_tier);
      if (targetNorm !== normTier) continue;

      const parentNorm = normalizeTierKey(rule.parent_tier);
      const activeParentId = currentSelections[parentNorm];

      if (activeParentId && Array.isArray(rule.trigger_ids) && rule.trigger_ids.includes(activeParentId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Resolves effective allowed options using the Strict Precedence Model (Task 02B/02D):
   * 1. If tier is skipped via isTierSkipped: returns allowedIds = [], isSkipped = true.
   * 2. Highest priority: variation_dependencies version 2 (evaluates solely by V2 DAG rules).
   * 3. Fallback: legacy specific_options_map and variation_scopes when V2 schema is absent.
   * 4. Default: all defined options for that tier are available when neither is configured.
   * 
   * Invariants:
   * - Inputs are NEVER mutated.
   * - Deterministic output.
   * 
   * @param {Object} product
   * @param {string} tierKey
   * @param {Record<string, string | null>} currentSelections
   * @returns {{
   *   isSkipped: boolean,
   *   allowedIds: string[],
   *   allOptionIds: string[],
   *   isSpecific: boolean,
   *   mode: 'skipped' | 'general' | 'specific' | 'unrestricted'
   * }}
   */
  function resolveEffectiveAllowedOptions(product, tierKey, currentSelections) {
    const normTier = normalizeTierKey(tierKey);
    const selections = currentSelections || {};
    const allTierOptions = getTierOptions(product, normTier);
    const allOptionIds = allTierOptions.map(o => o.id);

    // 1. Check if the entire tier is conditionally skipped
    if (isTierSkipped(product, normTier, selections)) {
      return {
        isSkipped: true,
        allowedIds: [],
        allOptionIds: allOptionIds,
        isSpecific: true,
        mode: 'skipped'
      };
    }

    const deps = product?.variation_dependencies;

    // 2. PRECEDENCE LAYER 1: v2 DAG Rules (Highest Priority when version === 2)
    if (deps && deps.version === 2 && deps.options && typeof deps.options === 'object') {
      let hasV2Specific = false;
      const filteredV2 = [];

      for (const opt of allTierOptions) {
        const rule = deps.options[opt.id];

        // Case: No rule, Independent, or General -> Allowed whenever tier is active
        if (!rule || rule.mode === 'general' || rule.mode === 'independent') {
          filteredV2.push(opt.id);
        } else if (rule.mode === 'specific') {
          hasV2Specific = true;
          const parentTier = normalizeTierKey(rule.parent_tier);
          const activeParentId = selections[parentTier];

          // If parent is selected and matches any listed trigger ID:
          if (activeParentId && Array.isArray(rule.trigger_ids) && rule.trigger_ids.includes(activeParentId)) {
            filteredV2.push(opt.id);
          }
          // If parent is unselected, specific child is not available yet
        }
      }

      return {
        isSkipped: false,
        allowedIds: filteredV2,
        allOptionIds: allOptionIds,
        isSpecific: hasV2Specific,
        mode: hasV2Specific ? 'specific' : 'general'
      };
    }

    // 3. PRECEDENCE LAYER 2: Fallback to Legacy specific_options_map & variation_scopes
    const activeV1Id = selections.tier1;
    if (activeV1Id) {
      const mat = (product?.materials || []).find(m => m && m.id === activeV1Id);
      const legacyScope = (mat && mat.variation_scopes && mat.variation_scopes[normTier]) ||
                          (product?.variation_scopes_by_variant && product.variation_scopes_by_variant[activeV1Id] && product.variation_scopes_by_variant[activeV1Id][normTier]) ||
                          (product?.variation_scopes && product.variation_scopes[activeV1Id] && product.variation_scopes[activeV1Id][normTier]) ||
                          (product?.variation_scopes && product.variation_scopes[normTier]);

      if (legacyScope === 'spesifik') {
        const mapForMat = product?.specific_options_map && product.specific_options_map[activeV1Id];
        const rawAllowed = mapForMat ? (mapForMat[normTier] || mapForMat[tierKey]) : null;
        const legacyAllowed = Array.isArray(rawAllowed) ? rawAllowed.filter(id => allOptionIds.includes(id)) : [];

        return {
          isSkipped: false,
          allowedIds: legacyAllowed,
          allOptionIds: allOptionIds,
          isSpecific: true,
          mode: 'specific'
        };
      }
    }

    // 4. PRECEDENCE LAYER 3: Default when neither configuration exists -> all defined options are available
    return {
      isSkipped: false,
      allowedIds: allOptionIds,
      allOptionIds: allOptionIds,
      isSpecific: false,
      mode: 'general'
    };
  }

  /**
   * Pure selection adjustment and cascading evaluator.
   * When a parent selection changes, evaluates downstream tiers in topological order.
   * 
   * Invariants:
   * 1. Preserves child selections that remain valid.
   * 2. Clears invalid child selections to null.
   * 3. NEVER automatically selects the first valid replacement option.
   * 4. Treats skipped tiers as satisfied with selection = null.
   * 5. Input selections object is NEVER mutated.
   * 
   * @param {Object} product
   * @param {Record<string, string | null>} currentSelections
   * @param {string} changedTierKey - The tier that was modified ('tier1', 'main', etc.)
   * @returns {{
   *   selections: Record<string, string | null>,
   *   clearedTiers: string[],
   *   skippedTiers: string[],
   *   preservedTiers: string[],
   *   isComplete: boolean
   * }}
   */
  function validateAndAdjustSelections(product, currentSelections, changedTierKey) {
    const nextSelections = Object.assign({}, currentSelections || {});
    const clearedTiers = [];
    const skippedTiers = [];
    const preservedTiers = [];

    const normChanged = normalizeTierKey(changedTierKey || 'tier1');
    const startIdx = CANONICAL_TIERS.indexOf(normChanged);

    // Evaluate all downstream tiers in strict rank order
    for (let i = Math.max(1, startIdx + 1); i < CANONICAL_TIERS.length; i++) {
      const tier = CANONICAL_TIERS[i];
      if (!isTierActive(product, tier)) continue;

      const resolution = resolveEffectiveAllowedOptions(product, tier, nextSelections);

      if (resolution.isSkipped) {
        if (nextSelections[tier] !== null && nextSelections[tier] !== undefined) {
          nextSelections[tier] = null;
          clearedTiers.push(tier);
        }
        skippedTiers.push(tier);
        continue;
      }

      const currentSelectedId = nextSelections[tier];
      if (currentSelectedId) {
        const isStillValid = resolution.allowedIds.includes(currentSelectedId);
        if (isStillValid) {
          preservedTiers.push(tier);
        } else {
          // Clear invalid selection to null (do NOT auto-select replacement!)
          nextSelections[tier] = null;
          clearedTiers.push(tier);
        }
      }
    }

    // Determine completion status: all active tiers must be validly selected or skipped
    let isComplete = true;
    for (const tier of CANONICAL_TIERS) {
      if (!isTierActive(product, tier)) continue;

      const res = resolveEffectiveAllowedOptions(product, tier, nextSelections);
      if (res.isSkipped) continue; // Skipped tier is satisfied

      const val = nextSelections[tier];
      if (!val || !res.allowedIds.includes(val)) {
        isComplete = false;
        break;
      }
    }

    return {
      selections: nextSelections,
      clearedTiers: clearedTiers,
      skippedTiers: skippedTiers,
      preservedTiers: preservedTiers,
      isComplete: isComplete
    };
  }

  /**
   * Generates a validated selection snapshot for downstream pricing calculators.
   * Guarantees that hidden, invalid, or skipped options contribute 0 to prices.
   * 
   * Invariants:
   * 1. Does not rewrite PricingCalculator.
   * 2. Zero-priced options (price === 0) are legitimate valid selections.
   * 3. Skipped tiers contribute Rp0 and are satisfied.
   * 4. Unselected tiers contribute Rp0 and mark isValid = false.
   * 
   * @param {Object} product
   * @param {Record<string, string | null>} currentSelections
   * @returns {{
   *   isValid: boolean,
   *   isComplete: boolean,
   *   selections: {
   *     tier1: string | null,
   *     main: string | null,
   *     extra_1: string | null,
   *     extra_2: string | null
   *   },
   *   tierStatus: Record<string, {
   *     status: 'selected' | 'unselected' | 'skipped' | 'inactive',
   *     optionId: string | null,
   *     optionName: string | null,
   *     price: number,
   *     cost_price: number
   *   }>,
   *   missingTiers: string[],
   *   skippedTiers: string[],
   *   totalOptionPrice: number,
   *   totalOptionCost: number
   * }}
   */
  function getValidatedPricingSnapshot(product, currentSelections) {
    const rawSelections = currentSelections || {};
    const adjusted = validateAndAdjustSelections(product, rawSelections, 'tier1');
    const validSelections = adjusted.selections;

    const tierStatus = {};
    const missingTiers = [];
    const skippedTiers = [];
    let totalOptionPrice = 0;
    let totalOptionCost = 0;
    let allSatisfied = true;

    for (const tier of CANONICAL_TIERS) {
      const active = isTierActive(product, tier);
      if (!active) {
        tierStatus[tier] = {
          status: 'inactive',
          optionId: null,
          optionName: null,
          price: 0,
          cost_price: 0
        };
        continue;
      }

      const res = resolveEffectiveAllowedOptions(product, tier, validSelections);

      if (res.isSkipped) {
        skippedTiers.push(tier);
        tierStatus[tier] = {
          status: 'skipped',
          optionId: null,
          optionName: null,
          price: 0,
          cost_price: 0
        };
        continue;
      }

      const selId = validSelections[tier];
      if (!selId || !res.allowedIds.includes(selId)) {
        allSatisfied = false;
        missingTiers.push(tier);
        tierStatus[tier] = {
          status: 'unselected',
          optionId: null,
          optionName: null,
          price: 0,
          cost_price: 0
        };
      } else {
        const options = getTierOptions(product, tier);
        const opt = options.find(o => o && o.id === selId);
        const price = opt ? (parseFloat(opt.price) || 0) : 0;
        const costPrice = opt ? (parseFloat(opt.cost_price) || 0) : 0;

        totalOptionPrice += price;
        totalOptionCost += costPrice;

        tierStatus[tier] = {
          status: 'selected',
          optionId: selId,
          optionName: opt ? opt.name : null,
          price: price,
          cost_price: costPrice
        };
      }
    }

    return {
      isValid: allSatisfied,
      isComplete: adjusted.isComplete,
      selections: {
        tier1: validSelections.tier1 || null,
        main: validSelections.main || null,
        extra_1: validSelections.extra_1 || null,
        extra_2: validSelections.extra_2 || null
      },
      tierStatus: tierStatus,
      missingTiers: missingTiers,
      skippedTiers: skippedTiers,
      totalOptionPrice: totalOptionPrice,
      totalOptionCost: totalOptionCost
    };
  }

  /**
   * Reference Integrity and DAG Validator for Admin Product Save.
   * Rejects forward, self, or circular dependencies and orphaned references.
   * Returns validation errors in Bahasa Indonesia.
   * 
   * @param {Object} product
   * @returns {{
   *   isValid: boolean,
   *   errors: string[],
   *   warnings: string[]
   * }}
   */
  function validateDependencyDAG(product) {
    const errors = [];
    const warnings = [];
    if (!product) return { isValid: true, errors: [], warnings: [] };

    const deps = product.variation_dependencies;
    if (!deps || deps.version !== 2) {
      return { isValid: true, errors: [], warnings: [] };
    }

    // Helper: Find which tier an option ID belongs to
    function findTierOfOption(optId) {
      for (const t of CANONICAL_TIERS) {
        const options = getTierOptions(product, t);
        if (options.some(o => o && o.id === optId)) {
          return t;
        }
      }
      return null;
    }

    // 1. Validate Option Rules
    const optionRules = deps.options || {};
    for (const [optId, rule] of Object.entries(optionRules)) {
      if (!rule) continue;

      const targetTier = findTierOfOption(optId);
      if (!targetTier) {
        errors.push(`Aturan keterkaitan merujuk pada opsi "${optId}" yang tidak terdaftar pada variasi manapun.`);
        continue;
      }

      const targetRank = getTierRank(targetTier);
      const targetLabel = getTierLabel(product, targetTier);
      const targetOpt = getTierOptions(product, targetTier).find(o => o.id === optId);
      const optName = targetOpt ? targetOpt.name : optId;

      if (rule.mode === 'specific') {
        if (!rule.parent_tier) {
          errors.push(`Opsi "${optName}" pada ${targetLabel} bertipe Spesifik namun variasi induk belum dipilih.`);
          continue;
        }

        const parentTier = normalizeTierKey(rule.parent_tier);
        const parentRank = getTierRank(parentTier);
        const parentLabel = getTierLabel(product, parentTier);

        // DAG Strict Order Check: Parent must strictly precede target tier
        if (parentRank === 0) {
          errors.push(`Variasi induk "${rule.parent_tier}" pada opsi "${optName}" tidak valid.`);
        } else if (!isTierActive(product, parentTier)) {
          errors.push(`Variasi induk ${parentLabel} pada opsi "${optName}" dalam keadaan non-aktif.`);
        } else if (parentRank >= targetRank) {
          errors.push(`Aturan keterkaitan tidak valid pada opsi "${optName}": Variasi induk (${parentLabel}) harus berada di atas variasi target (${targetLabel}).`);
        }

        // Empty triggers check: Do NOT silently interpret as General!
        if (!Array.isArray(rule.trigger_ids) || rule.trigger_ids.length === 0) {
          errors.push(`Opsi spesifik "${optName}" pada ${targetLabel} wajib memiliki minimal 1 pilihan pemicu.`);
        } else {
          // Trigger validity check: Triggers must actually exist in parent tier
          const parentOptions = getTierOptions(product, parentTier);
          const parentOptionIds = parentOptions.map(p => p.id);

          for (const triggerId of rule.trigger_ids) {
            if (!parentOptionIds.includes(triggerId)) {
              errors.push(`Pilihan pemicu "${triggerId}" pada opsi "${optName}" tidak ditemukan pada ${parentLabel}.`);
            }
          }
        }
      }
    }

    // 2. Validate Skip Rules
    const skipRules = deps.skip_rules || [];
    for (let i = 0; i < skipRules.length; i++) {
      const skipRule = skipRules[i];
      if (!skipRule) continue;

      const targetTier = normalizeTierKey(skipRule.target_tier);
      const parentTier = normalizeTierKey(skipRule.parent_tier);
      const targetRank = getTierRank(targetTier);
      const parentRank = getTierRank(parentTier);
      const targetLabel = getTierLabel(product, targetTier);
      const parentLabel = getTierLabel(product, parentTier);

      if (targetRank <= 1) {
        errors.push(`Aturan lewati variasi baris ke-${i + 1} tidak valid: Variasi target (${targetLabel}) tidak boleh berupa Variasi Utama (Bahan).`);
      } else if (parentRank === 0 || targetRank === 0) {
        errors.push(`Aturan lewati variasi baris ke-${i + 1} memiliki tingkatan variasi yang tidak dikenali.`);
      } else if (parentRank >= targetRank) {
        errors.push(`Aturan lewati variasi baris ke-${i + 1} tidak valid: Variasi induk (${parentLabel}) harus berada di atas variasi target (${targetLabel}).`);
      }

      if (!Array.isArray(skipRule.trigger_ids) || skipRule.trigger_ids.length === 0) {
        errors.push(`Aturan lewati ${targetLabel} wajib memilih minimal 1 opsi pemicu pada ${parentLabel}.`);
      } else {
        const parentOptions = getTierOptions(product, parentTier);
        const parentOptionIds = parentOptions.map(p => p.id);
        for (const trigId of skipRule.trigger_ids) {
          if (!parentOptionIds.includes(trigId)) {
            errors.push(`Pemicu lewati "${trigId}" tidak ditemukan pada ${parentLabel}.`);
          }
        }
      }
    }

    // 3. Dead-end Combination Warnings
    // Warn if any parent option results in 0 allowed options in an active downstream tier that is not skipped
    for (let i = 0; i < CANONICAL_TIERS.length - 1; i++) {
      const pTier = CANONICAL_TIERS[i];
      if (!isTierActive(product, pTier)) continue;
      const cTier = CANONICAL_TIERS[i + 1];
      if (!isTierActive(product, cTier)) continue;

      const pOptions = getTierOptions(product, pTier);
      for (const pOpt of pOptions) {
        const simSelections = { [pTier]: pOpt.id };
        const simRes = resolveEffectiveAllowedOptions(product, cTier, simSelections);
        if (!simRes.isSkipped && simRes.allowedIds.length === 0) {
          const pLabel = getTierLabel(product, pTier);
          const cLabel = getTierLabel(product, cTier);
          warnings.push(`Kombinasi opsi "${pOpt.name}" pada ${pLabel} tidak memiliki satupun opsi yang dapat dipilih pada ${cLabel}.`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      warnings: warnings
    };
  }

  /**
   * Pure legacy migration helper.
   * Converts legacy specific_options_map & variation_scopes into equivalent V2 DAG configuration.
   * Ensures no combinations that were previously restricted are accidentally opened.
   * 
   * @param {Object} product
   * @returns {Object} v2 variation_dependencies object { version: 2, options: {}, skip_rules: [] }
   */
  function convertLegacyToV2(product) {
    if (!product) {
      return { version: 2, options: {}, skip_rules: [] };
    }

    // If product already has valid v2 dependencies, return deep clone
    if (product.variation_dependencies && product.variation_dependencies.version === 2) {
      return JSON.parse(JSON.stringify(product.variation_dependencies));
    }

    const v2Deps = {
      version: 2,
      options: {},
      skip_rules: []
    };

    const materials = getTierOptions(product, 'tier1');
    const childTiers = ['main', 'extra_1', 'extra_2'];

    for (const tier of childTiers) {
      if (!isTierActive(product, tier)) continue;
      const tierOptions = getTierOptions(product, tier);
      if (tierOptions.length === 0) continue;

      for (const opt of tierOptions) {
        if (materials.length === 0) {
          v2Deps.options[opt.id] = { mode: 'general' };
          continue;
        }

        const allowingMatIds = [];
        for (const mat of materials) {
          const matId = mat.id;
          const legacyScope = (mat.variation_scopes && mat.variation_scopes[tier]) ||
                              (product.variation_scopes_by_variant && product.variation_scopes_by_variant[matId] && product.variation_scopes_by_variant[matId][tier]) ||
                              (product.variation_scopes && product.variation_scopes[matId] && product.variation_scopes[matId][tier]) ||
                              (product.variation_scopes && product.variation_scopes[tier]);

          if (legacyScope === 'spesifik') {
            const mapForMat = product.specific_options_map && product.specific_options_map[matId];
            const rawAllowed = mapForMat ? (mapForMat[tier] || mapForMat[tier]) : null;
            if (Array.isArray(rawAllowed) && rawAllowed.includes(opt.id)) {
              allowingMatIds.push(matId);
            }
          } else {
            // 'umum' or undefined defaults to allowed
            allowingMatIds.push(matId);
          }
        }

        if (allowingMatIds.length === materials.length) {
          // Allowed for every material -> General
          v2Deps.options[opt.id] = {
            mode: 'general'
          };
        } else {
          // Restricted to subset of materials -> Specific
          v2Deps.options[opt.id] = {
            mode: 'specific',
            parent_tier: 'tier1',
            trigger_ids: allowingMatIds
          };
        }
      }
    }

    return v2Deps;
  }

  // Export public pure-function API
  return Object.freeze({
    TIER_RANKS: TIER_RANKS,
    CANONICAL_TIERS: CANONICAL_TIERS,
    normalizeTierKey: normalizeTierKey,
    getTierRank: getTierRank,
    isTierActive: isTierActive,
    getTierOptions: getTierOptions,
    getTierLabel: getTierLabel,
    isTierSkipped: isTierSkipped,
    resolveEffectiveAllowedOptions: resolveEffectiveAllowedOptions,
    validateAndAdjustSelections: validateAndAdjustSelections,
    getValidatedPricingSnapshot: getValidatedPricingSnapshot,
    validateDependencyDAG: validateDependencyDAG,
    convertLegacyToV2: convertLegacyToV2
  });
}));


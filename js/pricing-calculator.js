/**
 * ==============================================================================
 * POS BY SONGER CREATIVE - CORE PRICING ENGINE
 * Universal Pricing & Cost Calculation Engine (Storefront, PDP, Kasir POS & Product Form)
 * Locations:
 *  - D:\pos-songer-creative\src\lib\pricing-calculator.js (Node.js Backend)
 *  - D:\pos-songer-creative\js\pricing-calculator.js      (Browser Client)
 * ==============================================================================
 * 
 * ATURAN FORMULA HARGA (6 RUMUS AKTIF + VARIASI 1-4 & LAYANAN EXTRAS):
 *  1. Nilai Utama per Unit = Nilai Variasi 1 + Nilai Variasi 2 + Nilai Variasi 3 + Nilai Variasi 4
 *     HPP Utama per Unit   = HPP Variasi 1 + HPP Variasi 2 + HPP Variasi 3 + HPP Variasi 4
 *  2. Multiplier Satuan:
 *     - B1. Meter:       Luas m² = ((P x L) / 10000). Minimal hitungan 1.0 m².
 *                        Gross Utama = (Luas m² x Nilai Variasi 1) + Variasi (2+3+4).
 *     - B5. Kg:          (Bobot riil kg x Nilai Variasi 1) + Variasi (2+3+4).
 *     - B6. Lt:          (Volume cairan liter x Nilai Variasi 1) + Variasi (2+3+4).
 *     - B7. KombStep:    Wajib kelipatan kuantitas (step_quantity).
 *                        Gross Utama = (Variasi 1 x Batches) + (Variasi (2+3+4) x Qty).
 *     - B2. KombF/Norm:  (Variasi 1 + Variasi 2 + Variasi 3 + Variasi 4) x Qty.
 *  3. Layanan Extras (Di Luar Qty Utama / finishings.extra_3):
 *     - 'checkbox'/'checklist': 1 x Harga Satuan Ekstra.
 *     - 'qty': Harga Satuan Ekstra x Qty Mandiri Ekstra.
 *     - 'direct'/'langsung proses': otomatis ditambahkan flat 1 x Harga Satuan Ekstra.
 *  4. Total Gross = Subtotal Kombinasi Utama + Total Nilai Ekstra.
 *  5. Diskon:
 *     - Diskon Grosir: Mode Normal vs Mode Bertingkat (Tiered Wholesale).
 *     - Diskon Promo Bulanan (% atau Nominal IDR).
 *  6. Grand Total = max(0, Total Gross - Diskon).
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
    root.PricingCalculator = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Helper pemformat Rupiah
  function formatIDR(num) {
    if (isNaN(num) || num === null || num === undefined) return 'Rp0';
    return 'Rp' + Math.round(num).toLocaleString('id-ID');
  }

  /**
   * Menghitung luas meter persegi dari dimensi P x L (cm)
   * Dilengkapi aturan batas minimal cetak 1.0 m²
   * 
   * @param {number} lengthCm - Panjang dalam centimeter
   * @param {number} widthCm - Lebar dalam centimeter
   * @param {number} [minAreaM2=1.0] - Batas minimal luas yang ditagihkan
   * @returns {{ rawAreaM2: number, billedAreaM2: number, isMinApplied: boolean }}
   */
  function calculateBilledArea(lengthCm, widthCm, minAreaM2 = 1.0) {
    const l = Math.max(1, parseFloat(lengthCm) || 100);
    const w = Math.max(1, parseFloat(widthCm) || 100);
    const rawArea = (l * w) / 10000; // cm² ke m²
    const billedArea = Math.max(minAreaM2, rawArea);
    return {
      rawAreaM2: parseFloat(rawArea.toFixed(4)),
      billedAreaM2: parseFloat(billedArea.toFixed(4)),
      isMinApplied: rawArea < minAreaM2
    };
  }

  /**
   * Menghitung rincian harga utama sebuah produk berdasarkan variasi 1-4 & layanan extras
   * 
   * @param {Object} product - Objek data produk
   * @param {Object} options - Pilihan kustomisasi pembeli/kasir
   * @returns {Object} Hasil kalkulasi lengkap
   */
  function calculateProductPrice(product, options = {}) {
    if (!product) {
      throw new Error('[PricingCalculator] Data produk wajib disertakan.');
    }

    let priceType = parseInt(product.price_type, 10);
    if (isNaN(priceType) || !priceType) {
      if (product.pricing_model === 'size') {
        priceType = product.size_pricing_type === 'fixed' ? 2 : 1;
      } else if (product.pricing_model === 'weight') {
        priceType = 5;
      } else if (product.pricing_model === 'volume') {
        priceType = 6;
      } else {
        priceType = 2;
      }
    }
    let qty = Math.max(1, parseInt(options.qty, 10) || 1);

    // 1. Variasi 1: Opsi Terpilih dari product.materials
    const materials = Array.isArray(product.materials) ? product.materials : [];
    let selectedMaterial = null;
    if (options.materialId) {
      selectedMaterial = materials.find(m => String(m.id) === String(options.materialId));
    }
    if (!selectedMaterial && materials.length > 0) {
      selectedMaterial = materials.find(m => m.is_default) || materials[0];
    }

    const v1Price = selectedMaterial ? (parseFloat(selectedMaterial.price) || 0) : (parseFloat(product.base_price || product.price) || 0);
    const v1Cost = selectedMaterial ? (parseFloat(selectedMaterial.cost_price) || 0) : (parseFloat(product.cost_price) || 0);
    const v1Name = selectedMaterial ? selectedMaterial.name : 'Standar';

    // Normalisasi Daftar Finishings per Tingkat (Mendukung Objek Bertingkat maupun Array Flat)
    let t2List = [];
    let t3List = [];
    let t4List = [];
    let extraServicesList = [];

    if (product.finishings && typeof product.finishings === 'object' && !Array.isArray(product.finishings)) {
      t2List = Array.isArray(product.finishings.main) ? product.finishings.main : [];
      t3List = Array.isArray(product.finishings.extra_1) ? product.finishings.extra_1 : [];
      t4List = Array.isArray(product.finishings.extra_2) ? product.finishings.extra_2 : [];
      extraServicesList = Array.isArray(product.finishings.extra_3) ? product.finishings.extra_3 : [];
    } else if (Array.isArray(product.finishings)) {
      t2List = product.finishings.filter(f => f.tier === 'main' || !f.tier);
      t3List = product.finishings.filter(f => f.tier === 'extra_1');
      t4List = product.finishings.filter(f => f.tier === 'extra_2');
      extraServicesList = product.finishings.filter(f => f.tier === 'extra_3');
    }

    // 2. Variasi 2: finishings.main (dengan validasi Scope Umum vs Spesifik)
    let selectedV2 = null;
    if (t2List.length > 0) {
      const v2Id = options.variation2Id || options.finishingId;
      if (v2Id) {
        selectedV2 = t2List.find(f => String(f.id) === String(v2Id));
      }
      if (!selectedV2 && (product.has_variation_2 || t2List.some(f => f.is_default))) {
        selectedV2 = t2List.find(f => f.is_default) || t2List[0];
      }
    }
    const v2Price = selectedV2 ? (parseFloat(selectedV2.price) || 0) : 0;
    const v2Cost = selectedV2 ? (parseFloat(selectedV2.cost_price) || 0) : 0;

    // 3. Variasi 3: finishings.extra_1
    let selectedV3 = null;
    if (t3List.length > 0 && (product.has_variation_3 || options.variation3Id)) {
      const v3Id = options.variation3Id;
      if (v3Id) {
        selectedV3 = t3List.find(f => String(f.id) === String(v3Id));
      }
      if (!selectedV3 && product.has_variation_3) {
        selectedV3 = t3List.find(f => f.is_default) || t3List[0];
      }
    }
    const v3Price = selectedV3 ? (parseFloat(selectedV3.price) || 0) : 0;
    const v3Cost = selectedV3 ? (parseFloat(selectedV3.cost_price) || 0) : 0;

    // 4. Variasi 4: finishings.extra_2
    let selectedV4 = null;
    if (t4List.length > 0 && (product.has_variation_4 || options.variation4Id)) {
      const v4Id = options.variation4Id;
      if (v4Id) {
        selectedV4 = t4List.find(f => String(f.id) === String(v4Id));
      }
      if (!selectedV4 && product.has_variation_4) {
        selectedV4 = t4List.find(f => f.is_default) || t4List[0];
      }
    }
    const v4Price = selectedV4 ? (parseFloat(selectedV4.price) || 0) : 0;
    const v4Cost = selectedV4 ? (parseFloat(selectedV4.cost_price) || 0) : 0;

    // Akumulasi Biaya Variasi Pendukung (Variasi 2 s/d 4)
    const supportingVariationsPrice = v2Price + v3Price + v4Price;
    const supportingVariationsCost = v2Cost + v3Cost + v4Cost;

    // Kalkulasi Berdasarkan Multiplier Satuan / Tipe Rumus Cetak
    let unitGrossPrice = 0;
    let unitCostPrice = 0;
    let subtotalMainCombination = 0;
    let totalCostMainCombination = 0;
    let billedAreaM2 = null;
    let rawAreaM2 = null;
    let isMinAreaApplied = false;
    let stepBatches = null;
    let stepQuantity = Math.max(1, parseInt(product.step_quantity, 10) || 1);

    switch (priceType) {
      // B1. Meter (P x L cm) - Minimal 1.0 m²
      case 1: {
        let lengthCm = parseFloat(options.lengthCm);
        let widthCm = parseFloat(options.widthCm);
        if (isNaN(lengthCm) || !lengthCm) {
          const lInput = parseFloat(options.length) || 100;
          if (product.size_unit === 'M') lengthCm = lInput * 100;
          else if (product.size_unit === 'Dm') lengthCm = lInput * 10;
          else if (product.size_unit === 'Mm') lengthCm = lInput / 10;
          else lengthCm = lInput;
        }
        if (isNaN(widthCm) || !widthCm) {
          const wInput = parseFloat(options.width) || 100;
          if (product.size_unit === 'M') widthCm = wInput * 100;
          else if (product.size_unit === 'Dm') widthCm = wInput * 10;
          else if (product.size_unit === 'Mm') widthCm = wInput / 10;
          else widthCm = wInput;
        }
        const areaData = calculateBilledArea(lengthCm, widthCm, 1.0);
        rawAreaM2 = areaData.rawAreaM2;
        billedAreaM2 = areaData.billedAreaM2;
        isMinAreaApplied = areaData.isMinApplied;

        unitGrossPrice = (billedAreaM2 * v1Price) + supportingVariationsPrice;
        unitCostPrice = (billedAreaM2 * v1Cost) + supportingVariationsCost;

        subtotalMainCombination = unitGrossPrice * qty;
        totalCostMainCombination = unitCostPrice * qty;
        break;
      }

      // B5. Kg (Bobot Riil Kilogram)
      case 5: {
        let weightKg = parseFloat(options.weightKg);
        if (isNaN(weightKg) || !weightKg) {
          const wInput = parseFloat(options.weight) || 1.0;
          if (product.weight_unit === 'gram') weightKg = wInput / 1000;
          else if (product.weight_unit === 'ons') weightKg = wInput * 0.1;
          else weightKg = wInput;
        }
        weightKg = Math.max(0.001, weightKg);
        unitGrossPrice = (weightKg * v1Price) + supportingVariationsPrice;
        unitCostPrice = (weightKg * v1Cost) + supportingVariationsCost;

        subtotalMainCombination = unitGrossPrice * qty;
        totalCostMainCombination = unitCostPrice * qty;
        break;
      }

      // B6. Lt (Volume Cairan Liter)
      case 6: {
        let volumeLt = parseFloat(options.volumeLt);
        if (isNaN(volumeLt) || !volumeLt) {
          const vInput = parseFloat(options.volume) || 1.0;
          if (product.volume_unit === 'ml') volumeLt = vInput / 1000;
          else if (product.volume_unit === 'galon') volumeLt = vInput * 3.785;
          else volumeLt = vInput;
        }
        volumeLt = Math.max(0.001, volumeLt);
        unitGrossPrice = (volumeLt * v1Price) + supportingVariationsPrice;
        unitCostPrice = (volumeLt * v1Cost) + supportingVariationsCost;

        subtotalMainCombination = unitGrossPrice * qty;
        totalCostMainCombination = unitCostPrice * qty;
        break;
      }

      // B7. KombStep (Wajib Kelipatan Kuantitas)
      case 7: {
        stepBatches = Math.ceil(qty / stepQuantity);
        subtotalMainCombination = (v1Price * stepBatches) + (supportingVariationsPrice * qty);
        totalCostMainCombination = (v1Cost * stepBatches) + (supportingVariationsCost * qty);

        unitGrossPrice = subtotalMainCombination / qty;
        unitCostPrice = totalCostMainCombination / qty;
        break;
      }

      // Default, B2 KombF & Normal: (Nilai Variasi 1 + Variasi 2 + Variasi 3 + Variasi 4)
      default: {
        unitGrossPrice = v1Price + supportingVariationsPrice;
        unitCostPrice = v1Cost + supportingVariationsCost;

        subtotalMainCombination = unitGrossPrice * qty;
        totalCostMainCombination = unitCostPrice * qty;
        break;
      }
    }

    // 5. Layanan Extras (Terpisah di Luar Kuantitas Utama / finishings.extra_3)
    let totalExtraServicesPrice = 0;
    let totalExtraServicesCost = 0;
    const appliedExtraServices = [];

    if (extraServicesList.length > 0) {
      extraServicesList.forEach(ex => {
        const extraType = String(ex.extra_type || 'pilihan_ganda').toLowerCase().trim();
        const exPrice = parseFloat(ex.price) || 0;
        const exCost = parseFloat(ex.cost_price) || 0;
        let appliedQty = 0;

        if (extraType === 'direct' || extraType === 'langsung proses') {
          // Otomatis terhitung setelah kuantitas utama tercapai (flat 1x)
          appliedQty = 1;
        } else {
          // Periksa pilihan pembeli
          if (Array.isArray(options.selectedExtraServices)) {
            const found = options.selectedExtraServices.find(item => String(item.id || item) === String(ex.id));
            if (found) {
              if (typeof found === 'object' && found.checked === false) {
                appliedQty = 0;
              } else {
                appliedQty = extraType === 'qty' ? Math.max(1, parseInt(found.qty, 10) || 1) : 1;
              }
            }
          } else if (options.selectedExtraServices && typeof options.selectedExtraServices === 'object') {
            const val = options.selectedExtraServices[ex.id];
            if (val !== undefined && val !== null && val !== false) {
              appliedQty = extraType === 'qty' ? Math.max(1, parseInt(val, 10) || 1) : 1;
            }
          } else if (Array.isArray(options.extraFinishingIds) && options.extraFinishingIds.some(eid => String(eid) === String(ex.id))) {
            appliedQty = 1;
          }
        }

        if (appliedQty > 0) {
          const itemSubtotal = exPrice * appliedQty;
          const itemCost = exCost * appliedQty;
          totalExtraServicesPrice += itemSubtotal;
          totalExtraServicesCost += itemCost;
          appliedExtraServices.push({
            id: ex.id,
            name: ex.name,
            extra_type: extraType,
            unit_price: exPrice,
            cost_price: exCost,
            qty: appliedQty,
            subtotal: itemSubtotal
          });
        }
      });
    }

    // Total Gross Keseluruhan
    const totalGrossBeforeDiscount = subtotalMainCombination + totalExtraServicesPrice;
    const totalCostOverall = totalCostMainCombination + totalExtraServicesCost;

    // 6. Kalkulasi Diskon (Harga Grosir Normal / Bertingkat vs Diskon Promo Bulanan)
    let discountAmount = 0;
    let appliedDiscountNote = '';

    const wholesaleTiers = Array.isArray(product.wholesale_tiers) ? product.wholesale_tiers : [];
    if (product.has_wholesale && wholesaleTiers.length > 0) {
      const mode = product.wholesale_mode || 'normal';
      if (mode === 'tiered') {
        // Mode Bertingkat (Tiered Wholesale)
        const matchingTiers = wholesaleTiers.filter(t => {
          const minQ = parseInt(t.min_qty) || 1;
          const maxQ = (t.max_qty !== null && t.max_qty !== undefined && t.max_qty !== '' && parseInt(t.max_qty) > 0) ? parseInt(t.max_qty) : Infinity;
          return qty >= minQ && qty <= maxQ;
        });

        if (matchingTiers.length > 0) {
          const tier = matchingTiers.sort((a, b) => (parseInt(b.min_qty) || 0) - (parseInt(a.min_qty) || 0))[0];
          const discountPerPcs = parseFloat(tier.price) || 0;
          discountAmount = discountPerPcs * qty;
          appliedDiscountNote = `Grosir Bertingkat: Potongan ${formatIDR(discountPerPcs)}/pcs (Qty ${tier.min_qty} - ${tier.max_qty || 'dst'})`;
        }
      } else {
        // Mode Normal: Rentang min s.d max
        const tier1 = wholesaleTiers[0];
        if (tier1) {
          const minQ = parseInt(tier1.min_qty) || (parseInt(product.min_order) || 1);
          const maxQ = (tier1.max_qty !== null && tier1.max_qty !== undefined && tier1.max_qty !== '' && parseInt(tier1.max_qty) > 0) ? parseInt(tier1.max_qty) : Infinity;
          if (qty >= minQ && qty <= maxQ) {
            const discountPerPcs = parseFloat(tier1.price) || 0;
            discountAmount = discountPerPcs * qty;
            appliedDiscountNote = `Grosir: Potongan ${formatIDR(discountPerPcs)}/pcs (Pembelian ${minQ} s.d ${tier1.max_qty || 'ke atas'})`;
          }
        }
      }
    }

    // Jika tidak ada diskon grosir, periksa Diskon Promo Bulanan
    if (discountAmount === 0 && product.has_monthly_discount) {
      const discVal = parseFloat(product.discount_value) || 0;
      if (product.discount_type === 'percent') {
        discountAmount = subtotalMainCombination * (discVal / 100);
        appliedDiscountNote = `Promo Bulanan: Diskon ${discVal}%`;
      } else if (product.discount_type === 'nominal') {
        discountAmount = Math.min(subtotalMainCombination, discVal * qty);
        appliedDiscountNote = `Promo Bulanan: Potongan ${formatIDR(discVal)}/pcs`;
      }
    }

    // Batasi diskon agar tidak melebihi harga kotor
    discountAmount = Math.min(totalGrossBeforeDiscount, Math.max(0, Math.round(discountAmount)));
    const netPrice = Math.max(0, Math.round(totalGrossBeforeDiscount - discountAmount));

    // 7. Margin Laba Finansial
    const profitMargin = netPrice - totalCostOverall;
    const profitMarginPercent = netPrice > 0 ? parseFloat(((profitMargin / netPrice) * 100).toFixed(2)) : 0;

    return {
      success: true,
      priceType,
      qty,
      grossPrice: Math.round(totalGrossBeforeDiscount),
      subtotalMainCombination: Math.round(subtotalMainCombination),
      totalExtraServicesPrice: Math.round(totalExtraServicesPrice),
      discountAmount,
      netPrice,
      totalCostPrice: Math.round(totalCostOverall),
      profitMargin: Math.round(profitMargin),
      profitMarginPercent,
      unitGrossPrice: Math.round(unitGrossPrice),
      unitNetPrice: Math.round(netPrice / qty),
      unitCostPrice: Math.round(unitCostPrice),
      appliedDiscountNote,
      billedAreaM2,
      rawAreaM2,
      isMinAreaApplied,
      stepQuantity,
      stepBatches,
      breakdown: {
        material: {
          id: selectedMaterial ? selectedMaterial.id : null,
          name: v1Name,
          price: v1Price,
          costPrice: v1Cost
        },
        mainFinishing: selectedV2 ? {
          id: selectedV2.id,
          name: selectedV2.name,
          price: v2Price,
          costPrice: v2Cost,
          isIncluded: selectedV2.is_included || false
        } : null,
        extraFinishings: appliedExtraServices.map(ex => ({
          id: ex.id,
          name: ex.name,
          price: ex.unit_price,
          costPrice: ex.cost_price,
          isIncluded: false
        })),
        variations: {
          variation_1: { id: selectedMaterial ? selectedMaterial.id : null, name: v1Name, price: v1Price, cost_price: v1Cost },
          variation_2: selectedV2 ? { id: selectedV2.id, name: selectedV2.name, price: v2Price, cost_price: v2Cost } : null,
          variation_3: selectedV3 ? { id: selectedV3.id, name: selectedV3.name, price: v3Price, cost_price: v3Cost } : null,
          variation_4: selectedV4 ? { id: selectedV4.id, name: selectedV4.name, price: v4Price, cost_price: v4Cost } : null
        },
        extra_services: appliedExtraServices,
        unitSupportingPrice: supportingVariationsPrice,
        unitSupportingCost: supportingVariationsCost
      }
    };
  }

  // ----------------------------------------------------------------------------
  // EXPORTED PUBLIC API
  // ----------------------------------------------------------------------------
  return {
    formatIDR,
    calculateBilledArea,
    calculateProductPrice
  };
}));

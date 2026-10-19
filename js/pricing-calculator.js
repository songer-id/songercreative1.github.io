/**
 * ==============================================================================
 * POS BY SONGER CREATIVE - CORE PRICING ENGINE
 * Universal Pricing & Cost Calculation Engine (Storefront, PDP & Kasir POS)
 * Locations:
 *  - D:\pos-songer-creative\src\lib\pricing-calculator.js (Node.js Backend)
 *  - D:\pos-songer-creative\js\pricing-calculator.js      (Browser Client)
 * ==============================================================================
 * 
 * ATURAN FORMULA HARGA (6 RUMUS AKTIF):
 *  B1. Meter:       Luas m² = ((P x L) / 10000). Minimal hitungan 1.0 m².
 *                   Gross = (Luas m² x Harga Bahan) + Total Biaya Finishing.
 *  B2. KombF:       (Harga Bahan + Total Biaya Finishing).
 *  B4. Paket:       Harga Paket Bundle (Finishing default gratis, finishing ekstra berbayar).
 *  B5. Kg:          (Bobot riil kg x Harga per Kg) + Total Biaya Finishing.
 *  B6. Lt:          (Volume cairan liter x Harga per Liter) + Total Biaya Finishing.
 *  B7. KombStep:    Wajib kelipatan kuantitas (step_quantity).
 *                   Gross = (Harga Bahan x Math.ceil(Qty / step_quantity)) + (Total Finishing x Qty).
 *  (B3. Fixed:      Dinonaktifkan sementara dari pilihan).
 * 
 * DISKON & KALKULASI HPP:
 *  - Diskon Bulanan (% atau Nominal IDR)
 *  - Diskon Bertingkat Kuantitas (ProductDiscountTier)
 *  - Perhitungan HPP Modal Bahan & Modal Finishing
 *  - Margin Laba Kotor & Persentase Keuntungan
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
   * Menghitung rincian harga utama sebuah produk berdasarkan variasi & opsi yang dipilih
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

    // 1. Identifikasi Bahan (Material) Terpilih
    const materials = Array.isArray(product.materials) ? product.materials : [];
    let selectedMaterial = null;
    if (options.materialId) {
      selectedMaterial = materials.find(m => String(m.id) === String(options.materialId));
    }
    if (!selectedMaterial && materials.length > 0) {
      selectedMaterial = materials.find(m => m.is_default) || materials[0];
    }

    const materialPrice = selectedMaterial ? (parseFloat(selectedMaterial.price) || 0) : (parseFloat(product.base_price) || 0);
    const materialCostPrice = selectedMaterial ? (parseFloat(selectedMaterial.cost_price) || 0) : 0;
    const materialName = selectedMaterial ? selectedMaterial.name : 'Standar';

    // 2. Identifikasi Finishing Utama & Finishing Tambahan
    let finishings = [];
    if (Array.isArray(product.finishings)) {
      finishings = product.finishings;
    } else if (product.finishings && typeof product.finishings === 'object') {
      finishings = [
        ...(product.finishings.main || []),
        ...(product.finishings.extra_1 || []),
        ...(product.finishings.extra_2 || []),
        ...(product.finishings.extra_3 || [])
      ];
    }
    let selectedMainFinishing = null;
    if (options.finishingId) {
      selectedMainFinishing = finishings.find(f => String(f.id) === String(options.finishingId));
    } else if (finishings.length > 0) {
      selectedMainFinishing = finishings.find(f => f.is_default) || finishings[0] || null;
    }

    let extraFinishings = [];
    if (Array.isArray(options.extraFinishingIds) && options.extraFinishingIds.length > 0) {
      extraFinishings = finishings.filter(f => 
        options.extraFinishingIds.some(eid => String(eid) === String(f.id))
      );
    }

    // Hitung total harga & HPP finishing per unit
    let unitFinishingPrice = 0;
    let unitFinishingCost = 0;

    if (selectedMainFinishing) {
      // Pada tipe Paket (B4), finishing yang is_included = true adalah gratis
      const mainPrice = (priceType === 4 && selectedMainFinishing.is_included) ? 0 : (parseFloat(selectedMainFinishing.price) || 0);
      unitFinishingPrice += mainPrice;
      unitFinishingCost += parseFloat(selectedMainFinishing.cost_price) || 0;
    }

    extraFinishings.forEach(extra => {
      const extraPrice = (priceType === 4 && extra.is_included) ? 0 : (parseFloat(extra.price) || 0);
      unitFinishingPrice += extraPrice;
      unitFinishingCost += parseFloat(extra.cost_price) || 0;
    });

    // 3. Kalkulasi Berdasarkan 6 Tipe Rumus Cetak
    let unitGrossPrice = 0;
    let unitCostPrice = 0;
    let totalGrossPrice = 0;
    let totalCostPrice = 0;
    let billedAreaM2 = null;
    let rawAreaM2 = null;
    let isMinAreaApplied = false;
    let stepBatches = null;
    let stepQuantity = Math.max(1, parseInt(product.step_quantity, 10) || 1);

    switch (priceType) {
      // ------------------------------------------------------------------------
      // B1. METER (P x L cm) - Minimal 1.0 m²
      // ------------------------------------------------------------------------
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

        // Harga per unit pcs cetak
        const itemMaterialCost = billedAreaM2 * materialPrice;
        const itemHppCost = billedAreaM2 * materialCostPrice;

        unitGrossPrice = itemMaterialCost + unitFinishingPrice;
        unitCostPrice = itemHppCost + unitFinishingCost;

        totalGrossPrice = unitGrossPrice * qty;
        totalCostPrice = unitCostPrice * qty;
        break;
      }

      // ------------------------------------------------------------------------
      // B2. KOMBF (Kombinasi Bahan + Finishing Flat)
      // ------------------------------------------------------------------------
      case 2: {
        unitGrossPrice = materialPrice + unitFinishingPrice;
        unitCostPrice = materialCostPrice + unitFinishingCost;

        totalGrossPrice = unitGrossPrice * qty;
        totalCostPrice = unitCostPrice * qty;
        break;
      }

      // ------------------------------------------------------------------------
      // B4. PAKET (Bundle Promo dengan Opsi Finishing Termasuk / Ekstra)
      // ------------------------------------------------------------------------
      case 4: {
        unitGrossPrice = materialPrice + unitFinishingPrice;
        unitCostPrice = materialCostPrice + unitFinishingCost;

        totalGrossPrice = unitGrossPrice * qty;
        totalCostPrice = unitCostPrice * qty;
        break;
      }

      // ------------------------------------------------------------------------
      // B5. KG (Bobot Riil Kilogram)
      // ------------------------------------------------------------------------
      case 5: {
        let weightKg = parseFloat(options.weightKg);
        if (isNaN(weightKg) || !weightKg) {
          const wInput = parseFloat(options.weight) || 1.0;
          if (product.weight_unit === 'gram') weightKg = wInput / 1000;
          else if (product.weight_unit === 'ons') weightKg = wInput * 0.1;
          else weightKg = wInput;
        }
        weightKg = Math.max(0.001, weightKg);
        unitGrossPrice = (weightKg * materialPrice) + unitFinishingPrice;
        unitCostPrice = (weightKg * materialCostPrice) + unitFinishingCost;

        totalGrossPrice = unitGrossPrice * qty;
        totalCostPrice = unitCostPrice * qty;
        break;
      }

      // ------------------------------------------------------------------------
      // B6. LT (Volume Cairan Liter)
      // ------------------------------------------------------------------------
      case 6: {
        let volumeLt = parseFloat(options.volumeLt);
        if (isNaN(volumeLt) || !volumeLt) {
          const vInput = parseFloat(options.volume) || 1.0;
          if (product.volume_unit === 'ml') volumeLt = vInput / 1000;
          else if (product.volume_unit === 'galon') volumeLt = vInput * 3.785;
          else volumeLt = vInput;
        }
        volumeLt = Math.max(0.001, volumeLt);
        unitGrossPrice = (volumeLt * materialPrice) + unitFinishingPrice;
        unitCostPrice = (volumeLt * materialCostPrice) + unitFinishingCost;

        totalGrossPrice = unitGrossPrice * qty;
        totalCostPrice = unitCostPrice * qty;
        break;
      }

      // ------------------------------------------------------------------------
      // B7. KOMBSTEP (Wajib Kelipatan Kuantitas)
      // ------------------------------------------------------------------------
      case 7: {
        stepBatches = Math.ceil(qty / stepQuantity);
        const effectiveStepUnits = stepBatches * stepQuantity;

        totalGrossPrice = (materialPrice * stepBatches) + (unitFinishingPrice * qty);
        totalCostPrice = (materialCostPrice * stepBatches) + (unitFinishingCost * qty);

        unitGrossPrice = totalGrossPrice / qty;
        unitCostPrice = totalCostPrice / qty;
        break;
      }

      // Default fallback
      default: {
        unitGrossPrice = materialPrice + unitFinishingPrice;
        unitCostPrice = materialCostPrice + unitFinishingCost;
        totalGrossPrice = unitGrossPrice * qty;
        totalCostPrice = unitCostPrice * qty;
      }
    }

    // 4. Kalkulasi Diskon (Tier Diskon Qty vs Diskon Bulanan Toko)
    let discountAmount = 0;
    let appliedDiscountNote = '';

    // A. Cek Tier Diskon Kuantitas (ProductDiscountTier / wholesale_tiers)
    let discountTiers = Array.isArray(product.discount_tiers) ? product.discount_tiers : [];
    if (discountTiers.length === 0 && Array.isArray(product.wholesale_tiers) && product.wholesale_tiers.length > 0) {
      discountTiers = product.wholesale_tiers.map(wt => ({
        min_qty: parseInt(wt.min_qty) || 1,
        max_qty: wt.max_qty ? parseInt(wt.max_qty) : null,
        discount_type: 'fixed_price',
        discount_value: parseFloat(wt.price) || 0
      }));
    }
    if (discountTiers.length > 0) {
      // Urutkan dari min_qty terbesar
      const sortedTiers = [...discountTiers].sort((a, b) => b.min_qty - a.min_qty);
      const eligibleTier = sortedTiers.find(t => qty >= t.min_qty);

      if (eligibleTier) {
        if (eligibleTier.discount_type === 'fixed_price') {
          const tierFixedTotal = parseFloat(eligibleTier.discount_value) * qty;
          discountAmount = Math.max(0, totalGrossPrice - tierFixedTotal);
          appliedDiscountNote = `Grosir: Min ${eligibleTier.min_qty} pcs @ ${formatIDR(eligibleTier.discount_value)}`;
        } else if (eligibleTier.discount_type === 'percent') {
          discountAmount = totalGrossPrice * (parseFloat(eligibleTier.discount_value) / 100);
          appliedDiscountNote = `Grosir: Diskon ${eligibleTier.discount_value}% (Qty ≥ ${eligibleTier.min_qty})`;
        } else if (eligibleTier.discount_type === 'nominal') {
          discountAmount = parseFloat(eligibleTier.discount_value) * qty;
          appliedDiscountNote = `Grosir: Potongan ${formatIDR(eligibleTier.discount_value)}/pcs`;
        }
      }
    }

    // B. Jika tidak terkena Tier Qty, cek Diskon Bulanan Produk
    if (discountAmount === 0 && product.has_monthly_discount) {
      const discVal = parseFloat(product.discount_value) || 0;
      if (product.discount_type === 'percent') {
        discountAmount = totalGrossPrice * (discVal / 100);
        appliedDiscountNote = `Promo Bulanan: Diskon ${discVal}%`;
      } else if (product.discount_type === 'nominal') {
        discountAmount = Math.min(totalGrossPrice, discVal * qty);
        appliedDiscountNote = `Promo Bulanan: Potongan ${formatIDR(discVal)}/pcs`;
      }
    }

    // Batasi diskon agar tidak melebihi harga kotor
    discountAmount = Math.min(totalGrossPrice, Math.max(0, Math.round(discountAmount)));
    const netPrice = Math.max(0, Math.round(totalGrossPrice - discountAmount));

    // 5. Kalkulasi Profit & Margin Finansial
    const profitMargin = netPrice - totalCostPrice;
    const profitMarginPercent = netPrice > 0 ? parseFloat(((profitMargin / netPrice) * 100).toFixed(2)) : 0;

    return {
      success: true,
      priceType,
      qty,
      grossPrice: Math.round(totalGrossPrice),
      discountAmount,
      netPrice,
      totalCostPrice: Math.round(totalCostPrice),
      profitMargin: Math.round(profitMargin),
      profitMarginPercent,
      unitGrossPrice: Math.round(unitGrossPrice),
      unitNetPrice: Math.round(netPrice / qty),
      unitCostPrice: Math.round(unitCostPrice),
      appliedDiscountNote,
      // Metadata khusus
      billedAreaM2,
      rawAreaM2,
      isMinAreaApplied,
      stepQuantity,
      stepBatches,
      // Breakdown komponen
      breakdown: {
        material: {
          id: selectedMaterial ? selectedMaterial.id : null,
          name: materialName,
          price: materialPrice,
          costPrice: materialCostPrice
        },
        mainFinishing: selectedMainFinishing ? {
          id: selectedMainFinishing.id,
          name: selectedMainFinishing.name,
          price: selectedMainFinishing.price,
          costPrice: selectedMainFinishing.cost_price,
          isIncluded: selectedMainFinishing.is_included || false
        } : null,
        extraFinishings: extraFinishings.map(f => ({
          id: f.id,
          name: f.name,
          price: f.price,
          costPrice: f.cost_price,
          isIncluded: f.is_included || false
        })),
        unitFinishingPrice,
        unitFinishingCost
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

/**
 * ==============================================================================
 * POS BY SONGER CREATIVE - CENTRAL UTILITY SUITE (UTILS.JS)
 * Centralized Helpers: formatIDR, escapeHtml, hexToRgba, generateSlug, formatDateID
 * Location: D:\pos-songer-creative\js\utils.js
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
    const utils = factory();
    root.Utils = utils;

    // Global Safe Fallbacks: Hanya ekspos jika belum terdefinisi secara global
    if (typeof root.formatIDR === 'undefined') {
      root.formatIDR = utils.formatIDR;
    }
    if (typeof root.formatCurrency === 'undefined') {
      root.formatCurrency = utils.formatCurrency;
    }
    if (typeof root.escapeHtml === 'undefined') {
      root.escapeHtml = utils.escapeHtml;
    }
    if (typeof root.hexToRgba === 'undefined') {
      root.hexToRgba = utils.hexToRgba;
    }
    if (typeof root.generateSlug === 'undefined') {
      root.generateSlug = utils.generateSlug;
    }
    if (typeof root.formatDateID === 'undefined') {
      root.formatDateID = utils.formatDateID;
    }
    if (typeof root.adjustColorBrightness === 'undefined') {
      root.adjustColorBrightness = utils.adjustColorBrightness;
    }
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Format angka ke format Rupiah standar Indonesia
   * Tahan terhadap null, undefined, string non-numerik, NaN, dan angka negatif.
   * 
   * @param {number|string} number - Nilai angka atau string numerik
   * @returns {string} Contoh: "Rp25.000" atau "Rp0"
   */
  function formatIDR(number) {
    if (number === null || number === undefined || number === '') return 'Rp0';
    const num = Number(number);
    if (isNaN(num)) return 'Rp0';
    return 'Rp' + Math.round(num).toLocaleString('id-ID');
  }

  const formatCurrency = formatIDR;

  /**
   * Sanitasi string HTML untuk mencegah serangan Cross-Site Scripting (XSS)
   * 
   * @param {string} str - String mentah dari input pengguna / database
   * @returns {string} String yang aman di-render ke innerHTML
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const text = String(str);
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Konversi kode warna HEX (#RRGGBB atau #RGB) ke format CSS rgba(r, g, b, alpha)
   * 
   * @param {string} hex - Kode warna hex (misal: "#33b589" atau "33b589")
   * @param {number} [alpha=1] - Derajat transparansi antara 0 dan 1
   * @returns {string} Contoh: "rgba(51, 181, 137, 0.12)"
   */
  function hexToRgba(hex, alpha = 1) {
    if (!hex || typeof hex !== 'string') return `rgba(0, 0, 0, ${alpha})`;
    let cleanHex = hex.replace('#', '').trim();
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    if (cleanHex.length !== 6) {
      return `rgba(0, 0, 0, ${alpha})`;
    }
    const num = parseInt(cleanHex, 16);
    if (isNaN(num)) return `rgba(0, 0, 0, ${alpha})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    const a = Math.max(0, Math.min(1, parseFloat(alpha) || 0));
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  /**
   * Pembuat URL slug bersih dari teks judul atau nama produk/kategori
   * Menghapus karakter spesial dan mengganti spasi berlebih dengan tanda hubung tunggal.
   * 
   * @param {string} text - Teks judul (misal: "Spanduk & Banner Outdoor 280gsm")
   * @returns {string} Contoh: "spanduk-banner-outdoor-280gsm"
   */
  function generateSlug(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')     // Hapus karakter non-alfanumerik
      .replace(/[\s_-]+/g, '-')     // Ganti spasi/underscore dengan strip
      .replace(/^-+|-+$/g, '');     // Bersihkan strip di awal dan akhir
  }

  /**
   * Format tanggal ke Bahasa Indonesia baku yang ramah pengguna awam
   * 
   * @param {string|number|Date} dateInput - Input tanggal
   * @param {boolean} [includeTime=false] - Sertakan jam dan menit WIB
   * @returns {string} Contoh: "25 Oktober 2026" atau "25 Oktober 2026, 14:30 WIB"
   */
  function formatDateID(dateInput, includeTime = false) {
    if (!dateInput) return '-';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    if (!includeTime) {
      return `${day} ${month} ${year}`;
    }

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes} WIB`;
  }

  /**
   * Mengatur kecerahan warna HEX (menghasilkan warna lebih gelap untuk hover atau lebih terang)
   * 
   * @param {string} hex - Kode warna hex (misal: "#33b589" atau "33b589")
   * @param {number} percent - Persentase penyesuaian (misal: -15 untuk 15% lebih gelap)
   * @returns {string} Contoh: "#28916d"
   */
  function adjustColorBrightness(hex, percent = -15) {
    if (!hex || typeof hex !== 'string') return '#28916d';
    let cleanHex = hex.replace('#', '').trim();
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    if (cleanHex.length !== 6) {
      return '#28916d';
    }
    const num = parseInt(cleanHex, 16);
    if (isNaN(num)) return '#28916d';
    const factor = Number(percent) || -15;
    let r = (num >> 16) + Math.round(255 * (factor / 100));
    let g = ((num >> 8) & 255) + Math.round(255 * (factor / 100));
    let b = (num & 255) + Math.round(255 * (factor / 100));
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  /**
   * Format hirarki lokasi otomatis Seller vs Buyer untuk spesifikasi produk & pratinjau PDP
   * @param {Object} sellerLocation - Data lokasi toko seller { country, province, city, district, village, show_location }
   * @param {Object|null} buyerLocation - Data lokasi pembeli (jika tersedia / terdeteksi)
   * @returns {string} String representasi lokasi terformat
   */
  function formatDynamicSellerLocation(sellerLocation, buyerLocation) {
    if (!sellerLocation || typeof sellerLocation !== 'object') {
      return 'Indonesia';
    }

    const getVal = (obj, ...keys) => {
      if (!obj || typeof obj !== 'object') return '';
      for (const k of keys) {
        if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') {
          return String(obj[k]).trim();
        }
      }
      return '';
    };

    const sCountry = getVal(sellerLocation, 'country', 'store_country') || 'Indonesia';
    const sProvince = getVal(sellerLocation, 'province', 'store_province');
    const sCity = getVal(sellerLocation, 'city', 'store_city', 'address_city');
    const sDistrict = getVal(sellerLocation, 'district', 'store_district', 'subdistrict');
    const sVillage = getVal(sellerLocation, 'village', 'store_village', 'kelurahan', 'desa');

    const hasBuyerLocation = Boolean(
      buyerLocation && 
      typeof buyerLocation === 'object' && 
      (buyerLocation.country || buyerLocation.province || buyerLocation.city || buyerLocation.district || buyerLocation.village)
    );

    if (hasBuyerLocation) {
      const bCountry = getVal(buyerLocation, 'country') || 'Indonesia';
      const bProvince = getVal(buyerLocation, 'province');
      const bCity = getVal(buyerLocation, 'city');
      const bDistrict = getVal(buyerLocation, 'district', 'subdistrict');

      const norm = (str) => str.toLowerCase().replace(/^(kab\.?|kabupaten|kota|kec\.?|kecamatan|desa|kel\.?|kelurahan)\s+/i, '').trim();

      // 1. Luar Negara Seller -> Tampilkan Negara
      if (bCountry && sCountry && norm(bCountry) !== norm(sCountry)) {
        return sCountry;
      }

      // 2. Satu Negara, Luar Provinsi Seller -> Tampilkan Provinsi
      if (bProvince && sProvince && norm(bProvince) !== norm(sProvince)) {
        return sProvince;
      }

      // 3. Satu Provinsi, Beda Kota/Kabupaten -> Tampilkan Kota/Kabupaten
      if (bCity && sCity && norm(bCity) !== norm(sCity)) {
        return sCity;
      }

      // 4. Satu Kota/Kabupaten, Beda Kecamatan -> Tampilkan Kecamatan
      if (bDistrict && sDistrict && norm(bDistrict) !== norm(sDistrict)) {
        return sDistrict.startsWith('Kec.') ? sDistrict : `Kec. ${sDistrict}`;
      }

      // 5. Satu Kecamatan dengan Seller -> Tampilkan Desa/Kelurahan
      if (bDistrict && sDistrict && norm(bDistrict) === norm(sDistrict)) {
        if (sVillage) {
          return (sVillage.startsWith('Desa ') || sVillage.startsWith('Kel. ')) ? sVillage : `Desa ${sVillage}`;
        }
        return sDistrict.startsWith('Kec.') ? sDistrict : `Kec. ${sDistrict}`;
      }
    }

    // 6. Fallback Default (buyer location belum diketahui / mode pratinjau umum)
    if (sCity && sProvince) {
      return `${sCity}, ${sProvince}`;
    }
    if (sCity) return sCity;
    if (sProvince) return sProvince;
    return sCountry || 'Indonesia';
  }

  return {
    formatIDR,
    formatCurrency,
    escapeHtml,
    hexToRgba,
    generateSlug,
    formatDateID,
    adjustColorBrightness,
    formatDynamicSellerLocation
  };
}));

if (typeof window !== 'undefined') {
  window.formatDynamicSellerLocation = (typeof Utils !== 'undefined' && Utils.formatDynamicSellerLocation) ? Utils.formatDynamicSellerLocation : null;
}

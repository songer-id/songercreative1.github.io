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

  return {
    formatIDR,
    formatCurrency,
    escapeHtml,
    hexToRgba,
    generateSlug,
    formatDateID
  };
}));

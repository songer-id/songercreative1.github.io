/**
 * ==============================================================================
 * POS BY SONGER CREATIVE - SHARED-COUNTER INVOICE GENERATOR ENGINE
 * Multi-Channel & Race-Condition Safe | Web Storefront & POS Kasir Terpadu
 * Location: D:\pos-songer-creative\src\lib\invoice\invoice-generator.js
 * ==============================================================================
 * 
 * ATURAN FORMAT NOMOR FAKTUR / INVOICE:
 *  Format Standar: [Channel]-[PrefixLabel]-[Counter 5 Digit]-[MMYY]
 *  Contoh:
 *    - Transaksi Kasir POS Label DnC (Desain & Cetak): B-DnC-00001-1026
 *    - Transaksi Web Storefront Label CtK (Cetak):     A-CtK-00002-1026
 *    - Transaksi Manual / Tanpa Prefix:                B-00003-1026
 * 
 * JAMINAN ZERO-COLLISION (ANTI BENTROKAN NOMOR):
 *  1. Shared Global Counter: Counter 5-digit berjalan dalam 1 urutan global bersama
 *     antara Web (A) dan Kasir (B) dalam tenant yang sama pada periode bulan bersangkutan.
 *  2. Atomic Database Upsert: Pada PostgreSQL/Prisma, kenaikan nomor counter menggunakan
 *     upsert atomic increment { counter: { increment: 1 } } dengan row-level lock.
 *  3. Offline-Safe Fallback: Kasir offline memiliki alokasi prefix khusus 'OFF'
 *     (contoh: B-DnC-OFF0001-1026) yang akan direkonsiliasi otomatis saat terhubung kembali.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // Node.js / CommonJS
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  } else {
    // Browser Global
    root.InvoiceGenerator = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ----------------------------------------------------------------------------
  // 1. HELPER KONSTANTA & FORMATTER
  // ----------------------------------------------------------------------------

  const CHANNEL_CODES = {
    WEB: 'A',
    A_WEB: 'A',
    POS: 'B',
    B_POS: 'B',
    A: 'A',
    B: 'B'
  };

  /**
   * Mengambil kode periode bulan & tahun dalam format MMYY.
   * Contoh: Tanggal 7 Oktober 2026 -> '1026'
   * @param {Date|string|number} date
   * @returns {string} MMYY
   */
  function getMonthYearPeriod(date = new Date()) {
    const d = date instanceof Date ? date : new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${month}${year}`;
  }

  /**
   * Membersihkan kode channel menjadi single character 'A' atau 'B'.
   * @param {string} channel
   * @returns {'A'|'B'}
   */
  function normalizeChannel(channel) {
    if (!channel) return 'B'; // Default POS Kasir
    const upper = String(channel).trim().toUpperCase();
    return CHANNEL_CODES[upper] || (upper.startsWith('A') ? 'A' : 'B');
  }

  /**
   * Membersihkan kode prefix label order (misal: 'DnC', 'CtK', 'MANUAL').
   * Jika label bertipe manual atau kosong, return empty string agar format menjadi [A/B]-[Counter]-[MMYY].
   * @param {string} labelCode
   * @returns {string}
   */
  function normalizeLabelCode(labelCode) {
    if (!labelCode) return '';
    const clean = String(labelCode).trim();
    if (clean.toLowerCase() === 'manual' || clean === '-') {
      return '';
    }
    // Hanya izinkan karakter alfanumerik untuk label prefix invoice
    return clean.replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Format nomor urut menjadi minimal 5 digit dengan leading zero.
   * Contoh: 1 -> '00001', 42 -> '00042', 100005 -> '100005'
   * @param {number|string} counter
   * @returns {string}
   */
  function formatCounter(counter) {
    const num = Math.max(1, parseInt(counter, 10) || 1);
    return String(num).padStart(5, '0');
  }

  /**
   * Membentuk string nomor invoice final berdasarkan komponen.
   * 
   * @param {Object} params
   * @param {string} params.channel - 'A' / 'A_WEB' (Web Storefront) atau 'B' / 'B_POS' (Kasir)
   * @param {string} [params.labelCode] - Prefix label order ('DnC', 'CtK', dll). Kosongkan jika manual.
   * @param {number|string} params.counter - Nomor urut integer (contoh: 1 -> 00001)
   * @param {Date|string} [params.date] - Tanggal transaksi (default: waktu sekarang)
   * @param {boolean} [params.isOffline] - Flag apakah ini invoice sementara saat kasir offline
   * @returns {string} Nomor invoice terformat (misal: "B-DnC-00001-1026" atau "B-00001-1026")
   */
  function formatInvoiceNumber({
    channel = 'B_POS',
    labelCode = '',
    counter = 1,
    date = new Date(),
    isOffline = false
  }) {
    const channelChar = normalizeChannel(channel);
    const cleanLabel = normalizeLabelCode(labelCode);
    const period = getMonthYearPeriod(date);
    const counterStr = isOffline ? `OFF${formatCounter(counter).slice(-4)}` : formatCounter(counter);

    if (cleanLabel) {
      return `${channelChar}-${cleanLabel}-${counterStr}-${period}`;
    }
    return `${channelChar}-${counterStr}-${period}`;
  }

  /**
   * Membedah (parse) nomor invoice menjadi komponen-komponennya.
   * Mendukung baik format dengan label ("B-DnC-00001-1026") maupun manual ("B-00001-1026").
   * 
   * @param {string} invoiceNumber
   * @returns {Object} { isValid, channel, labelCode, counter, period, isOffline }
   */
  function parseInvoiceNumber(invoiceNumber) {
    if (!invoiceNumber || typeof invoiceNumber !== 'string') {
      return { isValid: false, error: 'Nomor invoice kosong atau bukan string' };
    }

    const trimmed = invoiceNumber.trim();
    // Pola 1: Dengan Label -> B-DnC-00001-1026 atau B-DnC-OFF0001-1026
    const withLabelRegex = /^([AB])-([a-zA-Z0-9]+)-(OFF\d+|\d+)-(\d{4})$/;
    // Pola 2: Manual Tanpa Label -> B-00001-1026 atau B-OFF0001-1026
    const withoutLabelRegex = /^([AB])-(OFF\d+|\d+)-(\d{4})$/;

    let match = trimmed.match(withLabelRegex);
    if (match) {
      const isOffline = match[3].startsWith('OFF');
      const counterVal = parseInt(match[3].replace('OFF', ''), 10);
      return {
        isValid: true,
        invoiceNumber: trimmed,
        channel: match[1],
        channelName: match[1] === 'A' ? 'Web Storefront' : 'Kasir POS',
        labelCode: match[2],
        counterRaw: match[3],
        counter: counterVal,
        period: match[4],
        isOffline
      };
    }

    match = trimmed.match(withoutLabelRegex);
    if (match) {
      const isOffline = match[2].startsWith('OFF');
      const counterVal = parseInt(match[2].replace('OFF', ''), 10);
      return {
        isValid: true,
        invoiceNumber: trimmed,
        channel: match[1],
        channelName: match[1] === 'A' ? 'Web Storefront' : 'Kasir POS',
        labelCode: 'MANUAL',
        counterRaw: match[2],
        counter: counterVal,
        period: match[3],
        isOffline
      };
    }

    return {
      isValid: false,
      invoiceNumber: trimmed,
      error: 'Format invoice tidak valid. Pola yang diharapkan: [A/B]-[Prefix]-[00001]-[MMYY] atau [A/B]-[00001]-[MMYY]'
    };
  }

  // ----------------------------------------------------------------------------
  // 2. ATOMIC SERVER-SIDE GENERATOR (PRISMA + POSTGRESQL TRANSAKSI)
  // ----------------------------------------------------------------------------

  /**
   * Menghasilkan nomor invoice berikutnya menggunakan transaksi atomic PostgreSQL Prisma.
   * Menjamin nomor urut shared-counter naik berurutan tanpa duplikasi meskipun terjadi
   * transaksi checkout Web dan Kasir secara bersamaan.
   * 
   * @param {Object} prisma - Instance PrismaClient
   * @param {Object} params
   * @param {string} params.tenantId - UUID Tenant
   * @param {string} params.channel - 'A_WEB' atau 'B_POS'
   * @param {string} [params.labelCode] - Kode label (misal: 'DnC')
   * @param {Date} [params.date] - Waktu transaksi
   * @returns {Promise<{ invoiceNumber: string, sequence: number, period: string }>}
   */
  async function generateNextInvoiceNumber(prisma, {
    tenantId,
    channel = 'B_POS',
    labelCode = '',
    date = new Date()
  }) {
    if (!prisma) {
      throw new Error('Prisma Client instance wajib disertakan untuk atomic generation.');
    }
    if (!tenantId) {
      throw new Error('tenantId wajib disertakan untuk multi-tenant invoice sequence.');
    }

    const period = getMonthYearPeriod(date);

    // Menjalankan kenaikan counter dalam transaksi atomic PostgreSQL
    return await prisma.$transaction(async (tx) => {
      // 1. Atomic Upsert pada tabel invoice_sequences
      // Menggunakan increment: 1 yang dijamin atomic oleh engine PostgreSQL (ON CONFLICT DO UPDATE)
      const sequenceRecord = await tx.invoiceSequence.upsert({
        where: {
          tenantId_period: {
            tenantId,
            period
          }
        },
        create: {
          tenantId,
          period,
          counter: 1
        },
        update: {
          counter: {
            increment: 1
          }
        }
      });

      const nextCounter = sequenceRecord.counter;

      // 2. Format string nomor invoice
      const invoiceNumber = formatInvoiceNumber({
        channel,
        labelCode,
        counter: nextCounter,
        date,
        isOffline: false
      });

      return {
        invoiceNumber,
        sequence: nextCounter,
        period,
        channel: normalizeChannel(channel),
        labelCode: normalizeLabelCode(labelCode) || 'MANUAL'
      };
    });
  }

  // ----------------------------------------------------------------------------
  // 3. CLIENT-SIDE / OFFLINE POS INVOICE GENERATOR (INDEXEDDB SAFE)
  // ----------------------------------------------------------------------------

  /**
   * Menghasilkan nomor invoice lokal saat Kasir POS sedang bekerja secara offline.
   * Menggunakan penyimpanan sequence lokal di IndexedDB dan menambahkan penanda
   * agar kasir tetap bisa mencetak struk thermal secara instan.
   * 
   * @param {Object} offlineDb - Instance IndexedDB helper (offline-db.js)
   * @param {Object} params
   * @param {string} params.channel - 'B_POS'
   * @param {string} [params.labelCode] - Prefix label
   * @param {Date} [params.date]
   * @returns {Promise<{ invoiceNumber: string, sequence: number, isOffline: boolean }>}
   */
  async function generateOfflineInvoiceNumber(offlineDb, {
    channel = 'B_POS',
    labelCode = '',
    date = new Date()
  } = {}) {
    const period = getMonthYearPeriod(date);
    let nextCounter = 1;

    try {
      if (offlineDb && typeof offlineDb.getNextOfflineCounter === 'function') {
        nextCounter = await offlineDb.getNextOfflineCounter(`counter_${period}`);
      } else if (typeof localStorage !== 'undefined') {
        const key = `pos_offline_counter_${period}`;
        const current = parseInt(localStorage.getItem(key) || '0', 10);
        nextCounter = current + 1;
        localStorage.setItem(key, String(nextCounter));
      }
    } catch (err) {
      console.warn('[InvoiceGenerator] Gagal membaca storage offline, fallback ke timestamp counter:', err);
      nextCounter = Math.floor((Date.now() % 100000));
    }

    const invoiceNumber = formatInvoiceNumber({
      channel,
      labelCode,
      counter: nextCounter,
      date,
      isOffline: true
    });

    return {
      invoiceNumber,
      sequence: nextCounter,
      period,
      channel: 'B',
      labelCode: normalizeLabelCode(labelCode) || 'MANUAL',
      isOffline: true
    };
  }

  // ----------------------------------------------------------------------------
  // 4. REKONSILIASI TRANSAKSI OFFLINE KE CLOUD (SYNC WORKER HELPER)
  // ----------------------------------------------------------------------------

  /**
   * Melakukan rekonsiliasi nomor invoice saat transaksi offline disinkronkan ke PostgreSQL.
   * Jika nomor offline tidak mengalami bentrokan, nomor dipertahankan. Jika terjadi tabrakan,
   * sistem menetapkan nomor urut resmi cloud dan menyimpan referensi offline di catatan.
   * 
   * @param {Object} prisma - Instance PrismaClient
   * @param {Object} offlineOrder - Payload pesanan dari IndexedDB
   * @returns {Promise<{ resolvedInvoiceNumber: string, reallocated: boolean }>}
   */
  async function reconcileOfflineInvoice(prisma, offlineOrder) {
    const { tenantId, invoiceNumber, channel, notes } = offlineOrder;

    // Cek apakah nomor invoice sudah terdaftar di PostgreSQL
    const existing = await prisma.order.findUnique({
      where: { invoiceNumber }
    });

    if (!existing) {
      // Nomor unik, aman digunakan langsung
      return {
        resolvedInvoiceNumber: invoiceNumber,
        reallocated: false
      };
    }

    // Terjadi bentrokan (misalnya transaksi offline lama yang tertunda lama),
    // alokasikan nomor urut baru yang sah dari Cloud.
    const parsed = parseInvoiceNumber(invoiceNumber);
    const freshSequence = await generateNextInvoiceNumber(prisma, {
      tenantId,
      channel: channel || 'B_POS',
      labelCode: parsed.labelCode !== 'MANUAL' ? parsed.labelCode : '',
      date: new Date()
    });

    return {
      resolvedInvoiceNumber: freshSequence.invoiceNumber,
      reallocated: true,
      originalOfflineInvoice: invoiceNumber,
      reconciliationNote: `[Rekonsiliasi Otomatis Cloud] Nomor Faktur dialokasikan ulang dari offline (${invoiceNumber}) ke (${freshSequence.invoiceNumber})`
    };
  }

  // ----------------------------------------------------------------------------
  // 5. PUBLIC API EXPORTS
  // ----------------------------------------------------------------------------

  return {
    getMonthYearPeriod,
    normalizeChannel,
    normalizeLabelCode,
    formatCounter,
    formatInvoiceNumber,
    parseInvoiceNumber,
    generateNextInvoiceNumber,
    generateOfflineInvoiceNumber,
    reconcileOfflineInvoice
  };
}));

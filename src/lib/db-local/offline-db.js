/**
 * POS BY SONGER CREATIVE - OFFLINE-FIRST LOCAL DATABASE ENGINE
 * Architecture: IndexedDB Wrapper (Dexie.js / Native IDB Fallback)
 * Location: D:\pos-songer-creative\src\lib\db-local\offline-db.js
 * 
 * Features:
 *  - Menyimpan transaksi kasir saat koneksi internet offline / putus
 *  - Mengelola antrean sinkronisasi (sync_queue) berstatus PENDING
 *  - Menyimpan cache katalog produk, variasi bahan & finishing untuk operasi offline
 *  - Auto-sync ke backend PostgreSQL / Cloud saat koneksi pulih (navigator.onLine)
 */

(function (global) {
  'use strict';

  const DB_NAME = 'PosSongerCreative_OfflineDB';
  const DB_VERSION = 1;

  let dbInstance = null;

  // ----------------------------------------------------------------------------
  // 1. INISIALISASI INDEXEDDB (NATIVE IDB PROMISE WRAPPER)
  // ----------------------------------------------------------------------------

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (dbInstance) {
        return resolve(dbInstance);
      }

      if (!('indexedDB' in window)) {
        return reject(new Error('Browser ini tidak mendukung IndexedDB untuk mode offline kasir.'));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function (event) {
        const db = event.target.result;

        // 1. Orders Store (Transaksi Offline)
        if (!db.objectStoreNames.contains('orders')) {
          const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
          orderStore.createIndex('invoiceNumber', 'invoiceNumber', { unique: true });
          orderStore.createIndex('channel', 'channel', { unique: false });
          orderStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          orderStore.createIndex('createdAt', 'createdAt', { unique: false });
          orderStore.createIndex('paymentStatus', 'paymentStatus', { unique: false });
        }

        // 2. Order Items Store (Rincian Item & Spesifikasi Cetak PxL)
        if (!db.objectStoreNames.contains('order_items')) {
          const itemStore = db.createObjectStore('order_items', { keyPath: 'id' });
          itemStore.createIndex('orderId', 'orderId', { unique: false });
          itemStore.createIndex('productId', 'productId', { unique: false });
        }

        // 3. Sync Queue Store (Antrean Sinkronisasi ke PostgreSQL Cloud)
        if (!db.objectStoreNames.contains('sync_queue')) {
          const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
          queueStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          queueStore.createIndex('entityType', 'entityType', { unique: false });
          queueStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 4. Cached Products Store (Katalog Offline Siap Transaksi)
        if (!db.objectStoreNames.contains('cached_products')) {
          const prodStore = db.createObjectStore('cached_products', { keyPath: 'id' });
          prodStore.createIndex('priceType', 'priceType', { unique: false });
          prodStore.createIndex('categoryId', 'categoryId', { unique: false });
          prodStore.createIndex('isActive', 'isActive', { unique: false });
        }

        // 5. Offline Counter & Settings Store (Penyimpanan Sequence Kasir)
        if (!db.objectStoreNames.contains('offline_settings')) {
          db.createObjectStore('offline_settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = function (event) {
        dbInstance = event.target.result;
        resolve(dbInstance);
      };

      request.onerror = function (event) {
        reject(event.target.error);
      };
    });
  }

  // ----------------------------------------------------------------------------
  // 2. HELPER TRANSAKSI DATABASE LOKAL
  // ----------------------------------------------------------------------------

  function executeTx(storeName, mode, callback) {
    return openDatabase().then(db => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        let result = null;

        tx.oncomplete = () => resolve(result);
        tx.onerror = (e) => reject(e.target.error);

        try {
          result = callback(store);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  // ----------------------------------------------------------------------------
  // 3. OFFLINE POS REPOSITORY API
  // ----------------------------------------------------------------------------

  const OfflineDB = {
    /**
     * Membuka koneksi basis data lokal
     */
    init: openDatabase,

    /**
     * Menyimpan transaksi pesanan offline saat kasir tidak terhubung ke internet.
     * Otomatis memasukkan payload ke dalam antrean sinkronisasi (sync_queue).
     */
    async saveOfflineOrder(orderData, orderItems = []) {
      const db = await openDatabase();
      const now = new Date().toISOString();

      const normalizedOrder = {
        id: orderData.id || ('off-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)),
        invoiceNumber: orderData.invoiceNumber,
        invoiceSequence: orderData.invoiceSequence || 0,
        channel: 'B_POS', // Kasir Offline
        cashierName: orderData.cashierName || 'Kasir Offline',
        terminalId: orderData.terminalId || 'POS-OFFLINE-01',
        customerName: orderData.customerName || 'Pelanggan Walk-in',
        customerPhone: orderData.customerPhone || '',
        productionStatus: orderData.productionStatus || 'ANTREAN_DESAIN',
        paymentStatus: orderData.paymentStatus || 'BELUM_BAYAR',
        paymentMethod: orderData.paymentMethod || 'CASH',
        downPaymentAmount: parseFloat(orderData.downPaymentAmount) || 0,
        remainingAmount: parseFloat(orderData.remainingAmount) || 0,
        subtotal: parseFloat(orderData.subtotal) || 0,
        totalDiscount: parseFloat(orderData.totalDiscount) || 0,
        grandTotal: parseFloat(orderData.grandTotal) || 0,
        totalCostHpp: parseFloat(orderData.totalCostHpp) || 0,
        grossProfit: parseFloat(orderData.grossProfit) || 0,
        notes: orderData.notes || '',
        syncStatus: 'PENDING', // Menunggu sinkronisasi ke PostgreSQL cloud
        createdAt: orderData.createdAt || now,
        updatedAt: now
      };

      return new Promise((resolve, reject) => {
        const tx = db.transaction(['orders', 'order_items', 'sync_queue'], 'readwrite');

        tx.oncomplete = () => {
          resolve({
            success: true,
            order: normalizedOrder,
            itemsCount: orderItems.length
          });
        };

        tx.onerror = (e) => reject(e.target.error);

        // 1. Simpan header order
        tx.objectStore('orders').put(normalizedOrder);

        // 2. Simpan setiap item produk
        const itemsStore = tx.objectStore('order_items');
        orderItems.forEach(item => {
          itemsStore.put({
            id: item.id || ('off-item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)),
            orderId: normalizedOrder.id,
            productId: item.productId,
            productName: item.productName,
            priceType: item.priceType,
            lengthCm: item.lengthCm || null,
            widthCm: item.widthCm || null,
            billedAreaM2: item.billedAreaM2 || null,
            materialName: item.materialName || '',
            materialPrice: parseFloat(item.materialPrice) || 0,
            materialCostPrice: parseFloat(item.materialCostPrice) || 0,
            mainFinishingName: item.mainFinishingName || '',
            mainFinishingPrice: parseFloat(item.mainFinishingPrice) || 0,
            extraFinishingsJson: item.extraFinishingsJson || [],
            qty: parseInt(item.qty) || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            subtotal: parseFloat(item.subtotal) || 0,
            itemCostHpp: parseFloat(item.itemCostHpp) || 0,
            itemGrossProfit: parseFloat(item.itemGrossProfit) || 0,
            designDriveLink: item.designDriveLink || '',
            designNotes: item.designNotes || ''
          });
        });

        // 3. Masukkan ke dalam antrean sinkronisasi (sync_queue)
        tx.objectStore('sync_queue').add({
          entityType: 'ORDER_CREATE',
          entityId: normalizedOrder.id,
          payload: {
            order: normalizedOrder,
            items: orderItems
          },
          syncStatus: 'PENDING',
          retryCount: 0,
          errorMessage: null,
          createdAt: now
        });
      });
    },

    /**
     * Mengambil seluruh antrean yang berstatus PENDING
     */
    async getPendingSyncQueue() {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('sync_queue', 'readonly');
        const store = tx.objectStore('sync_queue');
        const index = store.index('syncStatus');
        const req = index.getAll('PENDING');

        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    },

    /**
     * Menandai item antrean berhasil disinkronkan ke PostgreSQL Cloud
     */
    async markQueueItemSynced(queueId, remoteInvoiceData = null) {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(['sync_queue', 'orders'], 'readwrite');
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);

        const qStore = tx.objectStore('sync_queue');
        const getReq = qStore.get(queueId);

        getReq.onsuccess = () => {
          const item = getReq.result;
          if (item) {
            item.syncStatus = 'SYNCED';
            item.syncedAt = new Date().toISOString();
            qStore.put(item);

            // Update status di orders lokal jika ada
            if (item.entityId) {
              const oStore = tx.objectStore('orders');
              const oReq = oStore.get(item.entityId);
              oReq.onsuccess = () => {
                const order = oReq.result;
                if (order) {
                  order.syncStatus = 'SYNCED';
                  if (remoteInvoiceData && remoteInvoiceData.invoiceNumber) {
                    order.invoiceNumber = remoteInvoiceData.invoiceNumber;
                  }
                  oStore.put(order);
                }
              };
            }
          }
        };
      });
    },

    /**
     * Menyimpan / meng-cache katalog produk offline agar kasir tetap bisa memilih bahan,
     * finishing, dan menghitung rumus harga saat tanpa internet.
     */
    async cacheCatalogData(products = []) {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('cached_products', 'readwrite');
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);

        const store = tx.objectStore('cached_products');
        store.clear(); // Bersihkan cache usang
        products.forEach(p => store.put(p));
      });
    },

    /**
     * Mengambil daftar produk dari cache offline
     */
    async getCachedProducts() {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('cached_products', 'readonly');
        const req = tx.objectStore('cached_products').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    },

    /**
     * Mengambil dan menaikkan nomor urut kasir lokal di IndexedDB (offline_settings)
     */
    async getNextOfflineCounter(counterKey = 'default') {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('offline_settings', 'readwrite');
        const store = tx.objectStore('offline_settings');
        const getReq = store.get(counterKey);

        getReq.onsuccess = () => {
          const record = getReq.result || { key: counterKey, counter: 0 };
          const nextVal = (record.counter || 0) + 1;
          record.counter = nextVal;
          record.updatedAt = new Date().toISOString();
          store.put(record);
          resolve(nextVal);
        };

        getReq.onerror = () => reject(getReq.error);
        tx.onerror = () => reject(tx.error);
      });
    },

    /**
     * Memperbarui nomor urut kasir offline saat sinkronisasi selesai
     */
    async setOfflineCounter(counterKey, value) {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('offline_settings', 'readwrite');
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);

        const store = tx.objectStore('offline_settings');
        store.put({
          key: counterKey,
          counter: parseInt(value, 10) || 0,
          updatedAt: new Date().toISOString()
        });
      });
    },

    /**
     * Memeriksa status konektivitas internet kasir
     */
    isOnline() {
      return navigator.onLine;
    }
  };

  // Expose ke global window
  global.OfflineDB = OfflineDB;

  // Auto-listen event kembali online untuk memberi trigger sync
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      console.log('[OfflineDB] Koneksi internet kembali aktif. Siap sinkronisasi antrean...');
      if (global.App && typeof global.App.triggerAutoSync === 'function') {
        global.App.triggerAutoSync();
      }
    });
  }

})(typeof window !== 'undefined' ? window : this);

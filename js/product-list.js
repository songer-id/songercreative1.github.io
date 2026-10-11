/**
 * Songer Creative - Shopee Seller Center Product List Controller
 * Features:
 *  - Real-time search by name
 *  - Filter by Price Type (1-7), Order Category (Ctk, DnC, DsN, SpL), Main Category & Card Variant
 *  - Displays Order Category badge and Etalase Category
 *  - 50x50px Thumbnail
 *  - Real-time Toggle Switch for `is_active`
 *  - Edit & Delete Action with Modal Confirmation
 */

const ProductList = (() => {
  let filterState = {
    search: '',
    price_type: 'all',
    order_category: 'all',
    category_id: 'all',
    card_variant: 'all',
    status: 'all'
  };

  let productToDelete = null;

  function formatIDR(num) {
    if (isNaN(num) || num === null || num === undefined) return 'Rp 0';
    return 'Rp ' + Math.round(num).toLocaleString('id-ID');
  }

  function getBadgeClass(priceType) {
    switch (priceType) {
      case 1: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 2: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 3: return 'bg-purple-100 text-purple-800 border-purple-200';
      case 4: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 5: return 'bg-amber-100 text-amber-800 border-amber-200';
      case 6: return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 7: return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }

  function getOrderCategoryBadge(catCode) {
    if (!catCode || catCode === 'manual') {
      return 'bg-slate-100 text-slate-700 border-slate-200';
    }
    switch (catCode) {
      case 'Ctk': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'DnC': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'DsN': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SpL': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  }

  function renderList() {
    const container = document.getElementById('list-container');
    if (!container) return;

    // Preserve search input focus and cursor position across re-renders
    const activeEl = document.activeElement;
    const isSearchFocused = activeEl && activeEl.id === 'search-product-input';
    const cursorStart = isSearchFocused ? activeEl.selectionStart : null;
    const cursorEnd = isSearchFocused ? activeEl.selectionEnd : null;

    let products = [];
    let allProducts = [];
    let allCategories = [];

    try {
      if (window.DB && typeof DB.getProducts === 'function') {
        products = DB.getProducts(filterState) || [];
        allProducts = DB.getProducts() || [];
        allCategories = (typeof DB.getCategories === 'function') ? DB.getCategories() : [];
      }
    } catch (err) {
      console.error('[ProductList] Error fetching initial data from DB:', err);
    }

    // Defensive fallback: jika data produk masih kosong, pakai DEMO_PRODUCTS_MASTER
    const fallbackList = (window.DEMO_PRODUCTS_MASTER || (window.DB && DB.DEMO_PRODUCTS_MASTER) || []);
    if (!Array.isArray(products) || products.length === 0) {
      const hasActiveSearch = Boolean(filterState.search && filterState.search.trim() !== '');
      if (!hasActiveSearch) {
        products = [...fallbackList];
      }
    }
    if (!Array.isArray(allProducts) || allProducts.length === 0) {
      allProducts = [...fallbackList];
    }

    const totalCount = allProducts.length;
    const activeCount = allProducts.filter(p => p && p.is_active).length;
    const promoCount = allProducts.filter(p => p && p.has_monthly_discount).length;
    const kombStepCount = allProducts.filter(p => p && p.price_type === 7).length;

    try {
      container.innerHTML = `
        <div class="max-w-7xl mx-auto space-y-6">
          
          <!-- Header & Action Row -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Daftar Produk Percetakan</h1>
              <p class="text-xs text-slate-500 mt-0.5">Kelola katalog produk, kategori order invoice, dan varian card etalase.</p>
            </div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <!-- Tombol Darurat Reset Data Demo -->
              <button type="button" id="btn-quick-reset-demo" class="px-3.5 py-2.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5" title="Paksa muat ulang 12 produk demo jika tabel kosong">
                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-amber-600"></i>
                <span>↻ Reset Data Demo</span>
              </button>
              <button type="button" id="btn-export-sql" class="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-2">
                <i data-lucide="database" class="w-4 h-4 text-emerald-600"></i>
                <span>SQL Schema</span>
              </button>
              <button type="button" id="btn-add-product-main" class="btn-primary-brand px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-emerald-200/60 transition flex items-center gap-2">
                <i data-lucide="plus" class="w-4 h-4"></i>
                <span>+ Tambah Produk Baru</span>
              </button>
            </div>
          </div>

        <!-- Metric Summary Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <i data-lucide="package" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="text-[11px] font-medium text-slate-500">Total Produk</div>
              <div id="metric-total-count" class="text-xl font-bold text-slate-900">${totalCount} Item</div>
            </div>
          </div>
          <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <i data-lucide="eye" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="text-[11px] font-medium text-slate-500">Tampil di Web</div>
              <div id="metric-active-count" class="text-xl font-bold text-emerald-600">${activeCount} Aktif</div>
            </div>
          </div>
          <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <i data-lucide="tag" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="text-[11px] font-medium text-slate-500">Promo Diskon</div>
              <div id="metric-promo-count" class="text-xl font-bold text-amber-600">${promoCount} Promo</div>
            </div>
          </div>
          <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <i data-lucide="layers" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="text-[11px] font-medium text-slate-500">KombStep (Poin N)</div>
              <div id="metric-step-count" class="text-xl font-bold text-purple-600">${kombStepCount} Produk</div>
            </div>
          </div>
        </div>

        <!-- Filter & Search Bar Card -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <!-- Quick Status Filter Pills -->
          <div class="flex items-center gap-1.5 border-b border-slate-100 pb-2.5 overflow-x-auto scrollbar-none">
            <button type="button" class="quick-status-tab px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${filterState.status === 'all' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}" data-status="all">
              <span>Semua (${totalCount})</span>
            </button>
            <button type="button" class="quick-status-tab px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${filterState.status === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}" data-status="active">
              <span class="w-2 h-2 rounded-full ${filterState.status === 'active' ? 'bg-white' : 'bg-emerald-500'}"></span>
              <span>Tampil di Web (${activeCount})</span>
            </button>
            <button type="button" class="quick-status-tab px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${filterState.status === 'inactive' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}" data-status="inactive">
              <span class="w-2 h-2 rounded-full ${filterState.status === 'inactive' ? 'bg-white' : 'bg-slate-400'}"></span>
              <span>Disembunyikan (${totalCount - activeCount})</span>
            </button>
            <button type="button" class="quick-status-tab px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${filterState.status === 'promo' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}" data-status="promo">
              <i data-lucide="tag" class="w-3 h-3 ${filterState.status === 'promo' ? 'text-white' : 'text-amber-500'}"></i>
              <span>Ada Promo (${promoCount})</span>
            </button>
          </div>

          <div class="flex flex-col md:flex-row items-center gap-3 pt-1">
            <!-- Search Input -->
            <div class="relative flex-1 w-full">
              <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
              <input 
                type="text" 
                id="search-product-input" 
                value="${escapeHtml(filterState.search)}"
                placeholder="Cari nama produk, kategori, atau spesifikasi..." 
                class="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
              />
              ${filterState.search ? `
                <button type="button" id="btn-clear-search" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <i data-lucide="x" class="w-4 h-4"></i>
                </button>
              ` : ''}
            </div>

            <!-- Filter Order Category (Dinamis dari setting seller) -->
            <div class="w-full md:w-48">
              <select id="filter-order-category" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 outline-none bg-white">
                <option value="all" ${filterState.order_category === 'all' ? 'selected' : ''}>Semua Kategori Order</option>
                ${(DB.getOrderLabelSettings().custom_labels || []).map(lbl => `
                  <option value="${lbl}" ${filterState.order_category === lbl ? 'selected' : ''}>[${lbl}] Faktur: ${lbl}-00001</option>
                `).join('')}
                <option value="manual" ${filterState.order_category === 'manual' ? 'selected' : ''}>Manual (Faktur: 00001)</option>
              </select>
            </div>

            <!-- Filter Main Category Etalase -->
            <div class="w-full md:w-48">
              <select id="filter-category-id" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 outline-none bg-white">
                <option value="all" ${filterState.category_id === 'all' ? 'selected' : ''}>Semua Kategori Etalase</option>
                ${allCategories.map(c => `
                  <option value="${c.id}" ${filterState.category_id === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>
                `).join('')}
              </select>
            </div>

            <!-- Filter Card Variant -->
            <div class="w-full md:w-36">
              <select id="filter-card-variant" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 outline-none bg-white">
                <option value="all" ${filterState.card_variant === 'all' ? 'selected' : ''}>Semua Card</option>
                <option value="A" ${filterState.card_variant === 'A' ? 'selected' : ''}>Card A (Cetak)</option>
                <option value="B" ${filterState.card_variant === 'B' ? 'selected' : ''}>Card B (Desain)</option>
                <option value="C" ${filterState.card_variant === 'C' ? 'selected' : ''}>Card C (Retail)</option>
              </select>
            </div>

            <!-- Filter Status -->
            <div class="w-full md:w-32">
              <select id="filter-status" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 outline-none bg-white">
                <option value="all" ${filterState.status === 'all' ? 'selected' : ''}>Semua Status</option>
                <option value="active" ${filterState.status === 'active' ? 'selected' : ''}>Tampil Web</option>
                <option value="inactive" ${filterState.status === 'inactive' ? 'selected' : ''}>Nonaktif</option>
                <option value="promo" ${filterState.status === 'promo' ? 'selected' : ''}>Ada Promo</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Tabel Produk Shopee Seller Style -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                  <th class="p-4 w-12 text-center">Foto</th>
                  <th class="p-4 min-w-[240px]">Nama Produk & Kategori</th>
                  <th class="p-4 min-w-[140px]">Tipe Harga</th>
                  <th class="p-4 min-w-[150px]">Varian Bahan</th>
                  <th class="p-4 min-w-[110px]">Stok</th>
                  <th class="p-4 min-w-[140px] text-center">Status Web (Toggle)</th>
                  <th class="p-4 w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${renderProductRowsSafe(products)}
              </tbody>
            </table>
          </div>

          <!-- Table Footer Info -->
          <div class="p-4 bg-slate-50/60 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Menampilkan <strong>${products.length}</strong> dari <strong>${totalCount}</strong> produk</span>
            <span class="text-slate-400">Database Engine: Relational InMemory + LocalStorage Persistence</span>
          </div>
        </div>

      </div>

      <!-- DELETE CONFIRMATION MODAL -->
      <div id="modal-delete" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-scale-up">
          <div class="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
            <i data-lucide="trash-2" class="w-6 h-6"></i>
          </div>
          <h3 class="text-base font-bold text-slate-900">Hapus Produk Ini?</h3>
          <p class="text-xs text-slate-500 mt-1" id="delete-modal-msg">
            Tindakan ini akan menghapus produk beserta seluruh varian bahan, finishing, dan ulasan terkait secara permanen (CASCADE).
          </p>
          <div class="flex items-center justify-end gap-3 mt-6">
            <button type="button" id="btn-cancel-delete" class="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
              Batal
            </button>
            <button type="button" id="btn-confirm-delete" class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow transition">
              Ya, Hapus Produk
            </button>
          </div>
        </div>
      </div>

      <!-- SQL VIEWER MODAL -->
      <div id="modal-sql" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col p-6 animate-scale-up">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200">
            <div class="flex items-center gap-2">
              <i data-lucide="terminal" class="w-5 h-5 text-emerald-600"></i>
              <h3 class="text-base font-bold text-slate-900">Relational SQL Schema & Data Dump</h3>
            </div>
            <button type="button" id="btn-close-sql" class="text-slate-400 hover:text-slate-600 p-1">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
          <p class="text-xs text-slate-500 mt-2 mb-3">
            Skrip SQL yang digenerate langsung dari tabel <code>categories</code>, <code>products</code>, <code>product_materials</code>, <code>product_finishings</code>, dan <code>product_reviews</code>.
          </p>
          <div class="flex-1 overflow-y-auto bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs leading-relaxed select-all">
            <pre id="sql-dump-content"></pre>
          </div>
          <div class="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-slate-200">
            <button type="button" id="btn-copy-sql" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow transition flex items-center gap-1.5">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i> Salin SQL
            </button>
            <button type="button" id="btn-close-sql-btn" class="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition">
              Tutup
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    bindListEvents();

    // Restore search focus and cursor position seamlessly
    if (isSearchFocused) {
      const searchInp = document.getElementById('search-product-input');
      if (searchInp) {
        searchInp.focus();
        try {
          searchInp.setSelectionRange(cursorStart, cursorEnd);
        } catch (e) {}
      }
    }

    console.log('ProductList rendered successfully, count:', products.length);
  } catch (fatalErr) {
    console.error('[ProductList] Fatal render error:', fatalErr);
    container.innerHTML = `
      <div class="max-w-md mx-auto my-12 bg-white p-6 rounded-2xl border border-red-200 shadow-sm text-center space-y-4">
        <div class="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mx-auto">
          <i data-lucide="alert-triangle" class="w-6 h-6"></i>
        </div>
        <h3 class="font-bold text-slate-800 text-sm">Gagal Menampilkan Tabel Produk</h3>
        <p class="text-xs text-slate-500">${escapeHtml(fatalErr.message || 'Terjadi kesalahan sistem saat merender produk.')}</p>
        <div class="flex items-center justify-center gap-2 pt-2">
          <button type="button" id="btn-fatal-reset-demo" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5">
            <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
            <span>↻ Muat Ulang Data Demo</span>
          </button>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    const btnFatal = document.getElementById('btn-fatal-reset-demo');
    if (btnFatal) {
      btnFatal.addEventListener('click', () => {
        DB.forceResetDemoData();
        renderList();
      });
    }
  }
}

  function renderProductRowsSafe(productsList) {
    if (!Array.isArray(productsList) || productsList.length === 0) {
      return renderEmptyState();
    }
    const rowsHtml = [];
    for (let i = 0; i < productsList.length; i++) {
      const prod = productsList[i];
      if (!prod) continue;
      try {
        rowsHtml.push(renderProductRow(prod));
      } catch (rowErr) {
        console.error(`[ProductList] Gagal merender baris produk #${i} (ID: ${prod ? prod.id : 'unknown'}):`, rowErr, prod);
      }
    }
    if (rowsHtml.length === 0) {
      return renderEmptyState();
    }
    return rowsHtml.join('');
  }

  function renderProductRow(prod) {
    if (!prod) return '';

    const name = escapeHtml(prod.name || 'Tanpa Nama');
    const priceType = typeof prod.price_type === 'number' ? prod.price_type : 1;
    const ptMeta = prod.price_type_meta || { code: 'Tipe ' + priceType };
    const badgeColor = getBadgeClass(priceType);
    const orderCategory = prod.order_category || 'manual';
    const orderCatBadge = getOrderCategoryBadge(orderCategory);

    const materials = Array.isArray(prod.materials) ? prod.materials : [];
    const matsSummary = materials.length > 0
      ? `${materials.length} Bahan: ${materials.slice(0, 2).map(m => (m && m.name) ? m.name : 'Bahan').join(', ')}${materials.length > 2 ? ' ...' : ''}`
      : 'Belum ada bahan';

    let stockBadge = '';
    if (prod.is_unlimited_stock) {
      stockBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">Tanpa Batas</span>';
    } else {
      const stock = typeof prod.stock === 'number' ? prod.stock : 0;
      const isLow = stock <= 10;
      stockBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isLow ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}">${stock} Unit</span>`;
    }

    let discountBadge = '';
    if (prod.has_monthly_discount) {
      const discVal = typeof prod.discount_value === 'number' ? prod.discount_value : 0;
      const discStr = prod.discount_type === 'percent' ? `${discVal}% OFF` : `-${formatIDR(discVal)}`;
      discountBadge = `<span class="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
        <i data-lucide="tag" class="w-2.5 h-2.5"></i> ${discStr}
      </span>`;
    }

    const imgThumb = prod.image_url ? `
      <img src="${escapeHtml(prod.image_url)}" alt="${name}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2250%22%20height%3D%2250%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23f1f5f9%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%2394a3b8%22%20font-size%3D%2210%22%3ENo%20Img%3C%2Ftext%3E%3C%2Fsvg%3E';" />
    ` : `
      <div class="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
        <i data-lucide="image" class="w-5 h-5"></i>
      </div>
    `;

    const cardVariant = prod.card_variant || 'A';
    const cardVariantLabel = cardVariant === 'A' ? 'Cetak Kustom' : cardVariant === 'B' ? 'Jasa Desain' : 'Retail Shopee';
    const cardVariantClass = cardVariant === 'A' ? 'bg-blue-50 text-blue-700 border-blue-200' : cardVariant === 'B' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200';

    const categoryName = escapeHtml(prod.category_name || (prod.category && prod.category.name) || 'Umum');
    const subCategoryName = prod.sub_category_name ? ' > ' + escapeHtml(prod.sub_category_name) : (prod.sub_category && prod.sub_category.name ? ' > ' + escapeHtml(prod.sub_category.name) : '');
    const matsCount = typeof prod.materials_count === 'number' ? prod.materials_count : materials.length;
    const salesCount = typeof prod.sales_count === 'number' ? prod.sales_count : 0;
    const isActive = prod.is_active !== false;

    return `
      <tr class="hover:bg-slate-50/80 transition group" data-id="${prod.id}">
        <!-- Thumbnail (50x50px) -->
        <td class="p-4 text-center">
          <div class="w-[50px] h-[50px] rounded-xl border border-slate-200 overflow-hidden shadow-xs mx-auto shrink-0 bg-slate-100">
            ${imgThumb}
          </div>
        </td>

        <!-- Nama Produk & Kategori -->
        <td class="p-4">
          <div class="font-bold text-slate-900 group-hover:text-emerald-700 transition">
            ${name}
          </div>
          <div class="flex items-center flex-wrap gap-1.5 mt-1.5">
            <!-- Order Category Badge (Invoice) -->
            <span class="px-2 py-0.5 rounded-md text-[10px] font-black border ${orderCatBadge}" title="Kategori Order Kasir: ${orderCategory}">
              ${orderCategory === 'manual' ? '#00001 (Manual)' : orderCategory}
            </span>
            <!-- Price Type -->
            <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badgeColor}">
              ${ptMeta.code || 'Tipe ' + priceType}
            </span>
            ${discountBadge}
            <span class="text-[10px] text-slate-400">| ${categoryName}${subCategoryName}</span>
          </div>
        </td>

        <!-- Tipe Harga -->
        <td class="p-4">
          <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold border ${badgeColor}">
            ${ptMeta.label || ptMeta.code || 'Tipe ' + priceType}
          </span>
          <div class="text-[10px] text-slate-400 mt-1 font-medium">Card ${cardVariant}: ${cardVariantLabel}</div>
        </td>

        <!-- Varian Bahan -->
        <td class="p-4">
          <div class="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
            <i data-lucide="layers" class="w-3.5 h-3.5 text-slate-400"></i>
            <span>${matsCount} Bahan</span>
          </div>
          <div class="text-[10px] text-slate-500 truncate max-w-[200px] mt-0.5" title="${escapeHtml(matsSummary)}">
            ${escapeHtml(matsSummary)}
          </div>
        </td>

        <!-- Stok & Terjual -->
        <td class="p-4">
          <div>${stockBadge}</div>
          <div class="text-[10px] text-slate-400 mt-1 font-semibold">${salesCount} Terjual</div>
        </td>

        <!-- Status Tampil Web Switch -->
        <td class="p-4 text-center">
          <div class="flex flex-col items-center gap-1">
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                class="sr-only peer toggle-active-switch" 
                data-id="${prod.id}"
                ${isActive ? 'checked' : ''} 
              />
              <div class="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
            <span class="text-[10px] font-medium status-label-${prod.id} ${isActive ? 'text-emerald-600' : 'text-slate-400'}">
              ${isActive ? 'Aktif di Web' : 'Disembunyikan'}
            </span>
          </div>
        </td>

        <!-- Kolom Aksi -->
        <td class="p-4 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button 
              type="button" 
              class="btn-edit-product p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition border border-slate-200"
              data-id="${prod.id}" 
              title="Edit Produk"
            >
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            </button>
            <button 
              type="button" 
              class="btn-delete-product p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition border border-slate-200"
              data-id="${prod.id}" 
              data-name="${name}"
              title="Hapus Produk"
            >
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  function renderEmptyState() {
    return `
      <tr>
        <td colspan="7" class="p-10 text-center">
          <div class="max-w-md mx-auto flex flex-col items-center">
            <div class="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center mb-3 shadow-xs">
              <i data-lucide="inbox" class="w-8 h-8"></i>
            </div>
            <h4 class="font-bold text-slate-800 text-base">Belum Ada Produk Ditemukan</h4>
            <p class="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
              Katalog produk masih kosong atau tidak ada produk yang cocok dengan kata kunci dan filter saat ini.
            </p>
            <div class="flex flex-wrap items-center justify-center gap-3">
              <button type="button" id="btn-empty-add-product" class="btn-primary-brand px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:shadow-emerald-200/60 transition flex items-center gap-1.5">
                <i data-lucide="plus" class="w-4 h-4"></i>
                <span>Tambah Produk Baru</span>
              </button>
              <button type="button" id="btn-empty-reset-demo" class="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition flex items-center gap-1.5 shadow-xs">
                <i data-lucide="rotate-ccw" class="w-4 h-4 text-amber-600"></i>
                <span>Muat Ulang Data Demo</span>
              </button>
              <button type="button" id="btn-reset-filter" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition">
                Reset Filter
              </button>
            </div>
          </div>
        </td>
      </tr>
    `;
  }

  function bindListEvents() {
    // Tombol Darurat Reset Data Demo di Atas Tabel
    const btnQuickReset = document.getElementById('btn-quick-reset-demo');
    if (btnQuickReset) {
      btnQuickReset.addEventListener('click', () => {
        if (confirm('Muat ulang 12 produk demo lengkap ke dalam database toko ini?')) {
          DB.forceResetDemoData();
          const appObj = window.App || window.AdminApp;
          if (appObj && typeof appObj.showToast === 'function') {
            appObj.showToast('Data demo 12 produk berhasil dimuat ulang!', 'success');
          }
          renderList();
        }
      });
    }

    // Tombol Muat Ulang Data Demo di Empty State
    const btnEmptyReset = document.getElementById('btn-empty-reset-demo');
    if (btnEmptyReset) {
      btnEmptyReset.addEventListener('click', () => {
        DB.forceResetDemoData();
        const appObj = window.App || window.AdminApp;
        if (appObj && typeof appObj.showToast === 'function') {
          appObj.showToast('Data demo 12 produk berhasil dimuat ulang!', 'success');
        }
        renderList();
      });
    }

    // Tombol Tambah Produk di Empty State
    const btnEmptyAdd = document.getElementById('btn-empty-add-product');
    if (btnEmptyAdd) {
      btnEmptyAdd.addEventListener('click', () => {
        const appObj = window.App || window.AdminApp;
        if (appObj && typeof appObj.navigate === 'function') {
          appObj.navigate('create');
        }
      });
    }

    const btnAddMain = document.getElementById('btn-add-product-main');
    if (btnAddMain) {
      btnAddMain.addEventListener('click', () => {
        const appObj = window.App || window.AdminApp;
        if (appObj && typeof appObj.navigate === 'function') {
          appObj.navigate('create');
        }
      });
    }

    const searchInput = document.getElementById('search-product-input');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        filterState.search = e.target.value;
        renderList();
      });
    }

    const btnClearSearch = document.getElementById('btn-clear-search');
    if (btnClearSearch) {
      btnClearSearch.addEventListener('click', () => {
        filterState.search = '';
        renderList();
      });
    }

    // Filter Order Category
    const filterOrderCat = document.getElementById('filter-order-category');
    if (filterOrderCat) {
      filterOrderCat.addEventListener('change', e => {
        filterState.order_category = e.target.value;
        renderList();
      });
    }

    // Filter Main Category
    const filterCatId = document.getElementById('filter-category-id');
    if (filterCatId) {
      filterCatId.addEventListener('change', e => {
        filterState.category_id = e.target.value;
        renderList();
      });
    }

    // Filter Card Variant
    const filterCardVar = document.getElementById('filter-card-variant');
    if (filterCardVar) {
      filterCardVar.addEventListener('change', e => {
        filterState.card_variant = e.target.value;
        renderList();
      });
    }

    // Filter Status
    const filterStatus = document.getElementById('filter-status');
    if (filterStatus) {
      filterStatus.addEventListener('change', e => {
        filterState.status = e.target.value;
        renderList();
      });
    }

    // Reset filters
    const btnResetFilter = document.getElementById('btn-reset-filter');
    if (btnResetFilter) {
      btnResetFilter.addEventListener('click', () => {
        filterState = { search: '', price_type: 'all', order_category: 'all', category_id: 'all', card_variant: 'all', status: 'all' };
        renderList();
      });
    }

    // Quick Status Tabs
    document.querySelectorAll('.quick-status-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        filterState.status = tab.getAttribute('data-status');
        renderList();
      });
    });

    // Real-Time Toggle Active
    document.querySelectorAll('.toggle-active-switch').forEach(toggle => {
      toggle.addEventListener('change', e => {
        const id = e.target.getAttribute('data-id');
        const isChecked = e.target.checked;
        const success = DB.toggleActive(id, isChecked);

        if (success) {
          const label = document.querySelector(`.status-label-${id}`);
          if (label) {
            label.textContent = isChecked ? 'Aktif di Web' : 'Disembunyikan';
            label.className = `text-[10px] font-medium status-label-${id} ${isChecked ? 'text-emerald-600' : 'text-slate-400'}`;
          }
          const metricActive = document.getElementById('metric-active-count');
          if (metricActive) {
            const count = DB.getProducts().filter(p => p.is_active).length;
            metricActive.textContent = `${count} Aktif`;
          }
          App.showToast(isChecked ? 'Produk berhasil diaktifkan di web!' : 'Produk disembunyikan dari web publik.', 'info');
        }
      });
    });

    // Edit Product
    document.querySelectorAll('.btn-edit-product').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        App.navigate('edit', id);
      });
    });

    // Delete Product
    document.querySelectorAll('.btn-delete-product').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        productToDelete = id;

        const modal = document.getElementById('modal-delete');
        const msg = document.getElementById('delete-modal-msg');
        msg.textContent = `Apakah Anda yakin ingin menghapus "${name}"? Seluruh varian bahan, finishing, dan ulasan terkait akan terhapus permanen.`;
        modal.classList.remove('hidden');
      });
    });

    // Delete Modal Actions
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    const modalDelete = document.getElementById('modal-delete');

    if (btnCancelDelete && modalDelete) {
      btnCancelDelete.addEventListener('click', () => {
        modalDelete.classList.add('hidden');
        productToDelete = null;
      });
    }

    if (btnConfirmDelete && modalDelete) {
      btnConfirmDelete.addEventListener('click', () => {
        if (productToDelete) {
          DB.deleteProduct(productToDelete);
          modalDelete.classList.add('hidden');
          productToDelete = null;
          App.showToast('Produk berhasil dihapus!', 'success');
          renderList();
        }
      });
    }

    // SQL Viewer Modal triggers
    const btnExportSql = document.getElementById('btn-export-sql');
    const modalSql = document.getElementById('modal-sql');
    const sqlContent = document.getElementById('sql-dump-content');
    const btnCloseSql = document.getElementById('btn-close-sql');
    const btnCloseSqlBtn = document.getElementById('btn-close-sql-btn');
    const btnCopySql = document.getElementById('btn-copy-sql');

    if (btnExportSql && modalSql && sqlContent) {
      btnExportSql.addEventListener('click', () => {
        // Simple SQL dump string generator
        let sql = `-- SONGERSHOPP EXPORT DATABASE SQL\n-- Generated on ${new Date().toLocaleString('id-ID')}\n\n`;
        DB.getCategories().forEach(c => {
          sql += `INSERT INTO categories (id, name, slug) VALUES ('${c.id}', '${c.name.replace(/'/g, "''")}', '${c.slug}');\n`;
        });
        DB.getProducts().forEach(p => {
          sql += `INSERT INTO products (id, name, order_category, card_variant, price_type) VALUES ('${p.id}', '${p.name.replace(/'/g, "''")}', '${p.order_category}', '${p.card_variant}', ${p.price_type});\n`;
        });
        sqlContent.textContent = sql;
        modalSql.classList.remove('hidden');
      });
    }

    [btnCloseSql, btnCloseSqlBtn].forEach(b => {
      if (b && modalSql) {
        b.addEventListener('click', () => {
          modalSql.classList.add('hidden');
        });
      }
    });

    if (btnCopySql && sqlContent) {
      btnCopySql.addEventListener('click', () => {
        navigator.clipboard.writeText(sqlContent.textContent).then(() => {
          App.showToast('SQL berhasil disalin ke clipboard!', 'success');
        });
      });
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  return {
    init() {
      renderList();
    },
    render() {
      renderList();
    }
  };
})();

// Explicit global exposure to guarantee ProductList is accessible everywhere
if (typeof window !== 'undefined') {
  window.ProductList = ProductList;
}


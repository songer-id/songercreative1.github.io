/**
 * Songer Creative - Seller Category & Sub-Category Manager
 * Enhanced with Storefront Quick Filter Customizer & Standalone Live Preview
 */

const CategoryManager = (() => {
  let editingCategoryId = null;
  let editingSubCategoryId = null;

  function init() {
    render();
    bindEvents();
  }

  function render() {
    const container = document.getElementById('category-manager-container');
    if (!container) return;

    const categories = DB.getCategories();
    const subCategories = DB.getSubCategories();

    container.innerHTML = `
      <div class="space-y-6 max-w-6xl mx-auto pb-20">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 class="text-2xl font-black text-slate-900 tracking-tight">Kategori & Sub-Kategori Etalase</h1>
            <p class="text-xs text-slate-500 mt-0.5">Kelola struktur kategori produk serta kustomisasi model tampilan quick filter etalase toko untuk navigasi pembeli.</p>
          </div>
          <div class="flex items-center gap-2.5">
            <button type="button" id="btn-add-category" class="btn-primary-brand px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition">
              <i data-lucide="plus-circle" class="w-4 h-4"></i>
              <span>+ Kategori Utama</span>
            </button>
            <button type="button" id="btn-add-sub-category" class="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-xs flex items-center gap-1.5 transition">
              <i data-lucide="folder-plus" class="w-4 h-4 text-emerald-600"></i>
              <span>+ Sub-Kategori</span>
            </button>
          </div>
        </div>

        <!-- Pintasan Cepat (Quick Setting Bar) di Halaman Kategori -->
        ${renderQuickSettingBar()}

        <!-- Panel Konfigurasi Label Kategori Order & Penomoran Faktur Kasir -->
        ${renderOrderLabelConfig()}

        <!-- Info Card: Panduan Kategori Etalase -->
        <div class="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
          <i data-lucide="info" class="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"></i>
          <div class="space-y-1">
            <span class="font-bold">Kategori & Sub-Kategori Etalase Toko:</span>
            <p class="text-emerald-800 leading-relaxed">
              Kategori di bawah ini adalah <strong>Kategori Etalase Toko</strong> untuk pengelompokan produk bagi pembeli di web online. 
              Setiap kategori dapat memiliki gambar thumbnail transparan (PNG/WebP) dan icon tersendiri yang akan muncul di quick filter depan.
            </p>
          </div>
        </div>

        <!-- Category Grid & Tree -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${categories.map(renderCategoryCard).join('')}
        </div>

        <!-- MODUL KUSTOMISASI TAMPILAN QUICK FILTER ETALASE DENGAN LIVE PREVIEW MANDIRI (DI BAWAH TABEL INPUT KATEGORI) -->
        ${renderQuickFilterCustomizer(categories)}

      </div>

      <!-- MODAL TAMBAH / EDIT KATEGORI UTAMA (DILENGKAPI PICKER IKON, UPLOAD GAMBAR & TOGGLE QUICK ACTION) -->
      <div id="modal-category" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 hidden flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-up my-auto">
          <!-- Modal Header (Fixed at top) -->
          <div class="flex items-center justify-between p-5 pb-3 border-b border-slate-200 shrink-0">
            <div>
              <h3 class="font-black text-slate-900 text-sm" id="modal-category-title">Tambah Kategori Utama</h3>
              <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Katalog & Quick Action Etalase
              </span>
            </div>
            <button type="button" class="btn-close-cat-modal text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <!-- Modal Scrollable Body -->
          <div class="p-5 overflow-y-auto space-y-4 text-xs flex-1">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Nama Kategori Utama <span class="text-red-500">*</span></label>
              <input type="text" id="cat-input-name" placeholder="Contoh: Digital Printing / Souvenir Merchandise" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 font-semibold" />
            </div>
            
            <div>
              <label class="block font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
              <textarea id="cat-input-desc" rows="2" placeholder="Keterangan singkat kelompok produk ini..." class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 resize-none font-medium"></textarea>
            </div>

            <!-- 1. Pemilihan Ikon Kategori (Input teks/class picker dengan live preview kecil) -->
            <div id="cat-form-icon-section" class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div class="flex items-center justify-between">
                <label class="block font-bold text-slate-800 text-xs">1. Pemilihan Ikon Kategori (Mode Ikon):</label>
                <span class="text-[10px] text-slate-400">Bootstrap / Lucide Icons</span>
              </div>

              <!-- Baris Preview Terpilih & Input Manual -->
              <div class="flex items-center gap-2.5 pb-1 border-b border-slate-200">
                <div id="cat-icon-selected-preview" class="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-lg shrink-0 shadow-xs" title="Live Preview Ikon">
                  <i class="bi bi-grid-fill"></i>
                </div>
                <div class="flex-1">
                  <input type="text" id="cat-input-icon" value="bi-grid" placeholder="contoh: bi-grid, bi-printer, bi-palette..." class="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs font-bold text-slate-800 outline-none focus:border-emerald-500" />
                </div>
              </div>

              <!-- Saran Cepat Class Icon Populer -->
              <div class="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span class="text-[10px] text-slate-400 font-bold">Pilih Cepat:</span>
                <button type="button" class="btn-quick-icon-chip px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-mono text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition" data-icon="bi-grid">bi-grid</button>
                <button type="button" class="btn-quick-icon-chip px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-mono text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition" data-icon="bi-printer">bi-printer</button>
                <button type="button" class="btn-quick-icon-chip px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-mono text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition" data-icon="bi-palette">bi-palette</button>
                <button type="button" class="btn-quick-icon-chip px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-mono text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition" data-icon="bi-gift">bi-gift</button>
                <button type="button" class="btn-quick-icon-chip px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-mono text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition" data-icon="bi-box-seam">bi-box-seam</button>
                <button type="button" class="btn-quick-icon-chip px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-mono text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition" data-icon="bi-shop">bi-shop</button>
              </div>

              <!-- Grid Picker Ikon Visual Komprehensif -->
              <div id="cat-icon-picker-grid" class="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-white rounded-xl border border-slate-200">
                <!-- Di-generate otomatis oleh renderIconGrid() -->
              </div>
            </div>

            <!-- 2. Upload / URL Gambar Kategori (Thumbnail) -->
            <div id="cat-form-image-section" class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div class="flex items-center justify-between">
                <label class="block font-bold text-slate-800 text-xs">2. Upload / URL Gambar Kategori (Mode Gambar):</label>
                <span class="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">Rasio 1:1 Persegi</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-16 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-inner">
                  <img id="cat-img-preview" src="assets/images/logo-songer-creative.png" class="w-full h-full object-contain" alt="Preview" onerror="this.src='assets/images/logo-songer-creative.png'" />
                </div>
                <div class="flex-1 space-y-1.5">
                  <input type="text" id="cat-input-image-url" placeholder="Masukkan URL tautan gambar atau unggah berkas..." class="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-[11px] outline-none focus:border-emerald-500" />
                  <label class="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] cursor-pointer border border-slate-300 transition flex items-center justify-center gap-1.5 shadow-2xs">
                    <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                    <span>Unggah Berkas Gambar (Maks 500 KB)</span>
                    <input type="file" id="cat-input-image-file" accept="image/png, image/webp, image/jpeg" class="hidden" />
                  </label>
                </div>
              </div>
            </div>

            <!-- 3. Toggle Tampilkan di Quick Action -->
            <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div class="space-y-0.5 pr-3">
                <label for="cat-input-show-quick-nav" class="block font-bold text-slate-800 text-xs cursor-pointer">3. Tampilkan di Quick Action Etalase</label>
                <span class="text-[11px] text-slate-500 block">Aktifkan untuk memunculkan kategori ini pada barisan quick filter toko depan (show_in_quick_nav).</span>
              </div>
              <label class="relative inline-flex items-center cursor-pointer shrink-0">
                <input type="checkbox" id="cat-input-show-quick-nav" class="sr-only peer" checked />
                <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

          </div>

          <!-- Modal Footer (Fixed at bottom) -->
          <div class="flex items-center justify-end gap-2 p-4 pt-3 border-t border-slate-200 shrink-0 bg-slate-50/70">
            <button type="button" class="btn-close-cat-modal px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50">Batal</button>
            <button type="button" id="btn-save-category" class="btn-primary-brand px-5 py-2 rounded-xl text-xs font-bold text-white shadow">Simpan Kategori</button>
          </div>
        </div>
      </div>

      <!-- MODAL TAMBAH / EDIT SUB-KATEGORI -->
      <div id="modal-sub-category" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-scale-up space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 class="font-bold text-slate-900 text-sm" id="modal-sub-title">Tambah Sub-Kategori</h3>
            <button type="button" class="btn-close-sub-modal text-slate-400 hover:text-slate-600 p-1">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Kategori Utama Induk <span class="text-red-500">*</span></label>
              <select id="sub-input-parent" class="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 bg-white">
                ${categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Nama Sub-Kategori <span class="text-red-500">*</span></label>
              <input type="text" id="sub-input-name" placeholder="Contoh: Spanduk/Banner / Stiker A3+ / Ganci Akrilik" class="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Default Template Card Grid</label>
              <select id="sub-input-card-variant" class="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 bg-white font-medium">
                <option value="A">Variasi A: Cetak / Spesifikasi Kustom (Banner, Stiker, Brosur)</option>
                <option value="B">Variasi B: Jasa Kreatif / Desain Portofolio (Logo, Desain Medsos)</option>
                <option value="C">Variasi C: Retail / Souvenir (Shopee Style - Ganci, Mug, Kaos)</option>
              </select>
            </div>
          </div>
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button type="button" class="btn-close-sub-modal px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50">Batal</button>
            <button type="button" id="btn-save-sub-category" class="btn-primary-brand px-5 py-2 rounded-xl text-xs font-bold text-white shadow">Simpan Sub-Kategori</button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  // --------------------------------------------------------------------------
  // KOLEKSI IKON VISUAL UNTUK QUICK FILTER (DROPDOWN DENGAN IKON LANGSUNG)
  // --------------------------------------------------------------------------
  const QF_ICON_OPTIONS = [
    { id: 'layout-grid', name: 'Layout Grid' },
    { id: 'grid', name: 'Grid' },
    { id: 'layers', name: 'Layers' },
    { id: 'store', name: 'Toko / Store' },
    { id: 'shopping-bag', name: 'Shopping Bag' },
    { id: 'shopping-cart', name: 'Keranjang' },
    { id: 'package', name: 'Paket / Box' },
    { id: 'boxes', name: 'Boxes' },
    { id: 'list', name: 'List' },
    { id: 'compass', name: 'Explore' },
    { id: 'flame', name: 'Hot / Terlaris' },
    { id: 'star', name: 'Bintang' },
    { id: 'trending-up', name: 'Trending' },
    { id: 'zap', name: 'Kilat / Flash' },
    { id: 'award', name: 'Piala / Best' },
    { id: 'crown', name: 'Mahkota' },
    { id: 'heart', name: 'Favorit' },
    { id: 'thumbs-up', name: 'Rekomendasi' },
    { id: 'sparkles', name: 'Spesial' },
    { id: 'badge-check', name: 'Resmi' },
    { id: 'ticket-percent', name: 'Kupon Diskon' },
    { id: 'percent', name: 'Persen' },
    { id: 'badge-percent', name: 'Badge Diskon' },
    { id: 'tag', name: 'Tag Harga' },
    { id: 'tags', name: 'Multi Tags' },
    { id: 'gift', name: 'Hadiah / Souvenir' },
    { id: 'receipt', name: 'Kuitansi' },
    { id: 'coins', name: 'Koin' },
    { id: 'printer', name: 'Percetakan' },
    { id: 'palette', name: 'Desain' },
    { id: 'shirt', name: 'Kaos / Sablon' },
    { id: 'scissors', name: 'Finishing' },
    { id: 'camera', name: 'Foto' },
    { id: 'bookmark', name: 'Bookmark' },
    { id: 'check-circle', name: 'Check' }
  ];

  function renderQfIconPickerHtml(fieldId, currentIcon, defaultIcon, themeColorClass = 'text-emerald-600') {
    const iconVal = currentIcon || defaultIcon;
    return `
      <div class="space-y-1 relative qf-icon-picker-component" data-field="${fieldId}">
        <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ikon (Pilih Dropdown)</label>
        <input type="hidden" id="${fieldId}" value="${escapeHtml(iconVal)}" />
        <button type="button" class="btn-qf-icon-dropdown w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-between text-xs outline-none focus:border-emerald-500 transition shadow-2xs group cursor-pointer" data-field="${fieldId}">
          <span class="flex items-center gap-2 truncate">
            <span class="w-5 h-5 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
              <i data-lucide="${escapeHtml(iconVal)}" class="w-3.5 h-3.5 ${themeColorClass} qf-active-icon-preview"></i>
            </span>
            <span class="font-mono text-xs text-slate-800 font-semibold truncate qf-active-icon-label">${escapeHtml(iconVal)}</span>
          </span>
          <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition shrink-0 ml-1"></i>
        </button>

        <div class="menu-qf-icon-dropdown hidden absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2.5 space-y-2 min-w-[230px]">
          <div class="relative">
            <input type="text" placeholder="Cari ikon / ketik nama..." class="input-qf-icon-search w-full px-2 py-1.5 pl-6 rounded-lg border border-slate-200 text-[11px] bg-slate-50 outline-none focus:border-emerald-500 focus:bg-white font-mono" />
            <i data-lucide="search" class="w-3 h-3 text-slate-400 absolute left-2 top-2.5"></i>
          </div>
          <div class="grid-qf-icon-options grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto p-0.5"></div>
        </div>
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // SECTION: KUSTOMISASI TAMPILAN QUICK FILTER ETALASE & LIVE PREVIEW MANDIRI
  // --------------------------------------------------------------------------
  function renderQuickFilterCustomizer(categories) {
    const settings = DB.getSettings();
    const qf = settings.quick_filter_config || {
      model: 'icon_text',
      border_radius: '9999px',
      border_color: '#e2e8f0',
      bg_color: '#ffffff',
      icon_color: '#059669',
      text_color: '#0f172a'
    };

    const currentModel = qf.model || 'icon_text';
    const currentRadius = qf.border_radius || '9999px';
    const currentBorder = qf.border_color || '#e2e8f0';
    const currentBg = qf.bg_color || '#ffffff';
    const currentIcon = qf.icon_color || '#059669';
    const currentText = qf.text_color || '#0f172a';
    const currentQfContainerBg = settings.quick_filter_container_bg || settings.quick_filter_bg_color || '#f8fafc';
    const currentBodyBg = (typeof settings !== 'undefined' && settings.body_bg_color) ? settings.body_bg_color : '#f8fafc';

    return `
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
        
        <!-- Header Section -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2 text-xs text-emerald-700 font-bold mb-0.5">
              <i data-lucide="sliders" class="w-3.5 h-3.5"></i>
              <span>Etalase Toko Online</span>
            </div>
            <h2 class="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Kustomisasi Tampilan Quick Filter Etalase</h2>
            <p class="text-xs text-slate-500 mt-0.5">Pilih dari 5 variasi format tampilan kartu filter (Gambar, Ikon, Teks) dan atur radius sudut serta palet warna.</p>
          </div>
          <button type="button" id="btn-save-quick-filter" class="btn-primary-brand px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-2 hover:brightness-105 transition self-start sm:self-auto">
            <i data-lucide="save" class="w-4 h-4"></i>
            <span>Simpan Kustomisasi Filter</span>
          </button>
        </div>

        <!-- STANDALONE LIVE PREVIEW BOX (KOTAK PRATINJAU LANGSUNG) -->
        <div class="bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg space-y-3">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span class="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <i data-lucide="eye" class="w-3.5 h-3.5 text-emerald-400"></i>
              Pratinjau Mandiri Quick Filter di Etalase Toko
            </span>
            <span class="text-[11px] font-mono text-slate-500">Live Feedback</span>
          </div>

          <div id="qf-live-preview-backdrop" class="p-4 rounded-xl border border-slate-700/60 shadow-inner transition-colors duration-300 bg-transparent">
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Simulasi Navigasi Cepat Pembeli:</span>
            <!-- Live container for category chips -->
            <div id="qf-live-preview-track" class="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none transition-all duration-300">
              <!-- Rendered dynamically by updateQuickFilterLivePreview() -->
            </div>
          </div>
        </div>

        <!-- 5 PILIHAN MODEL CARD QUICK FILTER -->
        <div class="space-y-3">
          <label class="block font-black text-xs text-slate-800 uppercase tracking-wider">
            1. Pilih Format Tampilan Kartu Quick Filter (5 Model):
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            
            <!-- Model 1: Hanya Gambar -->
            <label class="qf-model-card p-3.5 rounded-2xl border ${currentModel === 'only_image' ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition space-y-1.5 block" data-model="only_image">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-900 flex items-center gap-1.5">
                  <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">1</span>
                  Hanya Gambar
                </span>
                <input type="radio" name="qf_model_radio" value="only_image" ${currentModel === 'only_image' ? 'checked' : ''} class="text-emerald-600" />
              </div>
              <p class="text-[10px] text-slate-500 leading-relaxed">
                Murni thumbnail gambar/logo kategori (saran rasio 3:2 landscape).
              </p>
            </label>

            <!-- Model 2: Hanya Ikon -->
            <label class="qf-model-card p-3.5 rounded-2xl border ${currentModel === 'only_icon' ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition space-y-1.5 block" data-model="only_icon">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-900 flex items-center gap-1.5">
                  <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">2</span>
                  Hanya Ikon
                </span>
                <input type="radio" name="qf_model_radio" value="only_icon" ${currentModel === 'only_icon' ? 'checked' : ''} class="text-emerald-600" />
              </div>
              <p class="text-[10px] text-slate-500 leading-relaxed">
                Tampilan simbolik minimalis hanya berupa ikon Lucide tanpa label teks.
              </p>
            </label>

            <!-- Model 3: Gambar dan Teks -->
            <label class="qf-model-card p-3.5 rounded-2xl border ${currentModel === 'image_text' ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition space-y-1.5 block" data-model="image_text">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-900 flex items-center gap-1.5">
                  <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">3</span>
                  Gambar & Teks
                </span>
                <input type="radio" name="qf_model_radio" value="image_text" ${currentModel === 'image_text' ? 'checked' : ''} class="text-emerald-600" />
              </div>
              <p class="text-[10px] text-slate-500 leading-relaxed">
                Kombinasi foto/thumbnail kategori berdampingan dengan label nama kategori (saran rasio 1:1 persegi/square).
              </p>
            </label>

            <!-- Model 4: Ikon dan Teks -->
            <label class="qf-model-card p-3.5 rounded-2xl border ${currentModel === 'icon_text' ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition space-y-1.5 block" data-model="icon_text">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-900 flex items-center gap-1.5">
                  <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">4</span>
                  Ikon & Teks
                </span>
                <input type="radio" name="qf_model_radio" value="icon_text" ${currentModel === 'icon_text' ? 'checked' : ''} class="text-emerald-600" />
              </div>
              <p class="text-[10px] text-slate-500 leading-relaxed">
                Model terpopuler: ikon vektor Lucide bersih diikuti nama kategori jelas.
              </p>
            </label>

            <!-- Model 5: Hanya Teks -->
            <label class="qf-model-card p-3.5 rounded-2xl border ${currentModel === 'only_text' ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition space-y-1.5 block" data-model="only_text">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-900 flex items-center gap-1.5">
                  <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">5</span>
                  Hanya Teks
                </span>
                <input type="radio" name="qf_model_radio" value="only_text" ${currentModel === 'only_text' ? 'checked' : ''} class="text-emerald-600" />
              </div>
              <p class="text-[10px] text-slate-500 leading-relaxed">
                Gaya teks ultra-minimalis tanpa gambar dan tanpa ikon untuk tampilan bersih.
              </p>
            </label>

          </div>
        </div>

        <!-- STYLING CONTROLS (RADIUS SUDUT & PALET WARNA) -->
        <div class="space-y-4 pt-4 border-t border-slate-100 text-xs">
          <label class="block font-black text-xs text-slate-800 uppercase tracking-wider">
            2. Pengaturan Gaya Kartu (Radius Sudut & Warna):
          </label>

          <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            
            <!-- Radius Sudut (4 Kolom) -->
            <div class="md:col-span-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label class="block font-bold text-slate-800">Bentuk Sudut (Corner Radius):</label>
              <select id="qf-ctrl-radius" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold outline-none focus:border-emerald-500 bg-white text-xs">
                <option value="0px" ${currentRadius === '0px' ? 'selected' : ''}>0px (Persegi Tajam / Kotak Tegas)</option>
                <option value="8px" ${currentRadius === '8px' ? 'selected' : ''}>8px (Rounded Halus Kecil)</option>
                <option value="12px" ${currentRadius === '12px' ? 'selected' : ''}>12px (Rounded Sedang)</option>
                <option value="16px" ${currentRadius === '16px' ? 'selected' : ''}>16px (Rounded Modern)</option>
                <option value="9999px" ${currentRadius === '9999px' ? 'selected' : ''}>9999px (Pill / Kapsul Bulat Penuh)</option>
              </select>
              <span class="text-[10px] text-slate-400 block">Pilih bentuk kelengkungan tombol kategori & quick filter</span>
            </div>

            <!-- Palet Warna Filter (4 Kolom) -->
            <div class="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
              
              <!-- Warna Garis Tepi (Border) -->
              <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span class="block font-bold text-slate-800 text-[11px]">Warna Border:</span>
                <div class="flex items-center gap-1.5">
                  <input type="color" id="qf-color-border" value="${currentBorder}" class="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white shrink-0" />
                  <input type="text" id="qf-hex-border" value="${currentBorder}" maxlength="7" class="w-full px-1.5 py-1 rounded-lg border border-slate-300 font-mono text-[11px] font-bold uppercase outline-none focus:border-emerald-500" />
                </div>
              </div>

              <!-- Warna Background Kartu Filter -->
              <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span class="block font-bold text-slate-800 text-[11px]">Warna Background:</span>
                <div class="flex items-center gap-1.5">
                  <input type="color" id="qf-color-bg" value="${currentBg}" class="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white shrink-0" />
                  <input type="text" id="qf-hex-bg" value="${currentBg}" maxlength="7" class="w-full px-1.5 py-1 rounded-lg border border-slate-300 font-mono text-[11px] font-bold uppercase outline-none focus:border-emerald-500" />
                </div>
              </div>

              <!-- Warna Ikon (Jika Mode Ikon Aktif) -->
              <div id="qf-color-icon-box" class="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 ${currentModel === 'only_image' || currentModel === 'only_text' ? 'opacity-40 pointer-events-none' : ''}">
                <span class="block font-bold text-slate-800 text-[11px]">Warna Ikon:</span>
                <div class="flex items-center gap-1.5">
                  <input type="color" id="qf-color-icon" value="${currentIcon}" class="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white shrink-0" />
                  <input type="text" id="qf-hex-icon" value="${currentIcon}" maxlength="7" class="w-full px-1.5 py-1 rounded-lg border border-slate-300 font-mono text-[11px] font-bold uppercase outline-none focus:border-emerald-500" />
                </div>
              </div>

              <!-- Warna Teks Kategori -->
              <div id="qf-color-text-box" class="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 ${currentModel === 'only_image' || currentModel === 'only_icon' ? 'opacity-40 pointer-events-none' : ''}">
                <span class="block font-bold text-slate-800 text-[11px]">Warna Teks:</span>
                <div class="flex items-center gap-1.5">
                  <input type="color" id="qf-color-text" value="${currentText}" class="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white shrink-0" />
                  <input type="text" id="qf-hex-text" value="${currentText}" maxlength="7" class="w-full px-1.5 py-1 rounded-lg border border-slate-300 font-mono text-[11px] font-bold uppercase outline-none focus:border-emerald-500" />
                </div>
              </div>

            </div>

          </div>

          <!-- Toggle Scrollbar Horizontal Versi Desktop -->
          <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div class="space-y-0.5">
              <span class="block font-bold text-slate-800 text-xs">Aktifkan Scrollbar Horizontal Versi Desktop:</span>
              <span class="text-[11px] text-slate-500">Menampilkan track scrollbar horizontal saat dibuka di laptop/komputer desktop. Versi mobile otomatis dapat di-swipe langsung.</span>
            </div>
            <label class="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" id="qf-ctrl-desktop-scrollbar" class="sr-only peer" ${qf.show_desktop_scrollbar ? 'checked' : ''} />
              <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        <!-- 3. KUSTOMISASI 3 QUICK ACTION UTAMA (TEKS & IKON) -->
        <div class="space-y-3 pt-4 border-t border-slate-100 text-xs">
          <div>
            <label class="block font-black text-xs text-slate-800 uppercase tracking-wider">
              3. Kustomisasi Teks & Ikon 3 Quick Action Utama:
            </label>
            <p class="text-[11px] text-slate-500 mt-0.5">
              Kustomisasi label teks dan ikon pada 3 tombol quick filter. Tombol <strong>"Semua"</strong> dipasang tetap (pinned di kiri), sedangkan filter <strong>"Terlaris"</strong>, <strong>"Promo"</strong>, dan kategori produk dapat digeser (swipe/scroll) bebas.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <!-- Filter 1: Semua (Tetap / Pinned) -->
            <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                  <i data-lucide="${escapeHtml(qf.filter_all_icon || 'layout-grid')}" class="w-3.5 h-3.5 text-emerald-600"></i>
                  Quick Filter 1 (Semua)
                </span>
                <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Pinned Tetap</span>
              </div>
              <div class="space-y-1">
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Label Teks</label>
                <input type="text" id="qf-text-all" value="${escapeHtml(qf.filter_all_text || 'Semua')}" placeholder="Semua / All..." class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-xs outline-none focus:border-emerald-500" />
              </div>
              ${renderQfIconPickerHtml('qf-icon-all', qf.filter_all_icon, 'layout-grid', 'text-emerald-600')}
            </div>

            <!-- Filter 2: Produk Terlaris (Ikut Swipe) -->
            <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                  <i data-lucide="${escapeHtml(qf.filter_bestseller_icon || 'flame')}" class="w-3.5 h-3.5 text-amber-500"></i>
                  Quick Filter 2 (Terlaris)
                </span>
                <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">Ikut Swipe</span>
              </div>
              <div class="space-y-1">
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Label Teks</label>
                <input type="text" id="qf-text-bestseller" value="${escapeHtml(qf.filter_bestseller_text || 'Produk Terlaris')}" placeholder="Produk Terlaris / Best Seller..." class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-xs outline-none focus:border-emerald-500" />
              </div>
              ${renderQfIconPickerHtml('qf-icon-bestseller', qf.filter_bestseller_icon, 'flame', 'text-amber-500')}
            </div>

            <!-- Filter 3: Sedang Promo (Ikut Swipe) -->
            <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                  <i data-lucide="${escapeHtml(qf.filter_promo_icon || 'ticket-percent')}" class="w-3.5 h-3.5 text-emerald-600"></i>
                  Quick Filter 3 (Promo)
                </span>
                <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">Ikut Swipe</span>
              </div>
              <div class="space-y-1">
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Label Teks</label>
                <input type="text" id="qf-text-promo" value="${escapeHtml(qf.filter_promo_text || 'Sedang Promo')}" placeholder="Sedang Promo / Diskon / Sale..." class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-xs outline-none focus:border-emerald-500" />
              </div>
              ${renderQfIconPickerHtml('qf-icon-promo', qf.filter_promo_icon, 'ticket-percent', 'text-emerald-600')}
            </div>
          </div>
        </div>

      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // PINTASAN CEPAT (QUICK SETTING BAR) DI HALAMAN KATEGORI
  // --------------------------------------------------------------------------
  function renderQuickSettingBar() {
    const settings = DB.getSettings();
    const modeDesktop = settings.category_nav_mode_desktop || 'icon_image';
    const modeMobile = settings.category_nav_mode_mobile || 'icon_image';
    const qfConfig = settings.quick_filter_config || {};
    const model = qfConfig.category_filter_model || 'icon_text';

    // Identifikasi mode aktif
    let activeKey = 'icon';
    let activeLabel = 'Mode Icon (Ikon & Teks)';
    let activeIcon = 'bi-grid-fill';

    if (modeDesktop === 'dropdown') {
      activeKey = 'dropdown';
      activeLabel = 'Mode Dropdown (Kompak)';
      activeIcon = 'bi-menu-button-wide';
    } else if (modeDesktop === 'pills_text') {
      activeKey = 'pill';
      activeLabel = 'Mode Pill (Kapsul Teks)';
      activeIcon = 'bi-capsule';
    } else if (model === 'image_text' || model === 'only_image') {
      activeKey = 'gambar';
      activeLabel = 'Mode Gambar (Thumbnail)';
      activeIcon = 'bi-image-fill';
    } else {
      activeKey = 'icon';
      activeLabel = 'Mode Icon (Ikon & Teks)';
      activeIcon = 'bi-grid-fill';
    }

    return `
      <div class="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-slate-50 to-white border border-emerald-200/80 shadow-xs space-y-3.5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-200/80">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <i class="bi bi-sliders2-vertical text-base"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-black text-xs sm:text-sm text-slate-900 tracking-tight">Pintasan Mode Quick Filter Etalase</h3>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">1-Klik Beralih</span>
              </div>
              <p class="text-[11px] text-slate-500">Ubah model quick filter etalase toko secara instan tanpa harus membuka menu Tema & Branding.</p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-[11px] font-bold text-slate-500">Status Aktif:</span>
            <span class="px-3 py-1 rounded-full text-xs font-black bg-white text-emerald-800 border border-emerald-300 shadow-2xs flex items-center gap-1.5">
              <i class="bi ${activeIcon} text-emerald-600"></i>
              <span>${activeLabel}</span>
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          <!-- 1. Mode Icon -->
          <button type="button" class="btn-quick-switch-mode p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer select-none ${activeKey === 'icon' ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/25 shadow-sm text-emerald-950 font-bold' : 'border-slate-200 bg-white/90 hover:bg-white text-slate-700 font-medium'}" data-mode="icon" title="Beralih ke Mode Icon (Ikon & Teks)">
            <div class="flex items-center justify-between w-full mb-1">
              <div class="w-7 h-7 rounded-xl ${activeKey === 'icon' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'} flex items-center justify-center text-sm shadow-2xs">
                <i class="bi bi-grid-fill"></i>
              </div>
              ${activeKey === 'icon' ? '<span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Aktif</span>' : '<span class="text-[10px] text-slate-400">Pilih</span>'}
            </div>
            <div>
              <span class="font-bold text-xs block text-slate-900">1. Mode Icon</span>
              <span class="text-[10px] text-slate-500 leading-tight block mt-0.5">Ikon vektor + teks kartu vertikal</span>
            </div>
          </button>

          <!-- 2. Mode Gambar -->
          <button type="button" class="btn-quick-switch-mode p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer select-none ${activeKey === 'gambar' ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/25 shadow-sm text-emerald-950 font-bold' : 'border-slate-200 bg-white/90 hover:bg-white text-slate-700 font-medium'}" data-mode="gambar" title="Beralih ke Mode Gambar (Thumbnail Foto)">
            <div class="flex items-center justify-between w-full mb-1">
              <div class="w-7 h-7 rounded-xl ${activeKey === 'gambar' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'} flex items-center justify-center text-sm shadow-2xs">
                <i class="bi bi-image-fill"></i>
              </div>
              ${activeKey === 'gambar' ? '<span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Aktif</span>' : '<span class="text-[10px] text-slate-400">Pilih</span>'}
            </div>
            <div>
              <span class="font-bold text-xs block text-slate-900">2. Mode Gambar</span>
              <span class="text-[10px] text-slate-500 leading-tight block mt-0.5">Thumbnail foto kategori + teks</span>
            </div>
          </button>

          <!-- 3. Mode Pill -->
          <button type="button" class="btn-quick-switch-mode p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer select-none ${activeKey === 'pill' ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/25 shadow-sm text-emerald-950 font-bold' : 'border-slate-200 bg-white/90 hover:bg-white text-slate-700 font-medium'}" data-mode="pill" title="Beralih ke Mode Pill (Kapsul Teks)">
            <div class="flex items-center justify-between w-full mb-1">
              <div class="w-7 h-7 rounded-xl ${activeKey === 'pill' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'} flex items-center justify-center text-sm shadow-2xs">
                <i class="bi bi-capsule"></i>
              </div>
              ${activeKey === 'pill' ? '<span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Aktif</span>' : '<span class="text-[10px] text-slate-400">Pilih</span>'}
            </div>
            <div>
              <span class="font-bold text-xs block text-slate-900">3. Mode Pill</span>
              <span class="text-[10px] text-slate-500 leading-tight block mt-0.5">Kapsul horizontal teks ringkas</span>
            </div>
          </button>

          <!-- 4. Mode Dropdown -->
          <button type="button" class="btn-quick-switch-mode p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer select-none ${activeKey === 'dropdown' ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/25 shadow-sm text-emerald-950 font-bold' : 'border-slate-200 bg-white/90 hover:bg-white text-slate-700 font-medium'}" data-mode="dropdown" title="Beralih ke Mode Dropdown (Select Menu)">
            <div class="flex items-center justify-between w-full mb-1">
              <div class="w-7 h-7 rounded-xl ${activeKey === 'dropdown' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'} flex items-center justify-center text-sm shadow-2xs">
                <i class="bi bi-menu-button-wide"></i>
              </div>
              ${activeKey === 'dropdown' ? '<span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Aktif</span>' : '<span class="text-[10px] text-slate-400">Pilih</span>'}
            </div>
            <div>
              <span class="font-bold text-xs block text-slate-900">4. Mode Dropdown</span>
              <span class="text-[10px] text-slate-500 leading-tight block mt-0.5">Select menu kompak & hemat ruang</span>
            </div>
          </button>
        </div>
      </div>
    `;
  }

  function renderCategoryCard(cat) {
    const subs = cat.sub_categories || [];
    const isQuickNav = (cat.show_in_quick_nav !== false);

    let iconHtml = '';
    if (cat.image) {
      iconHtml = `<img src="${cat.image}" class="w-10 h-10 rounded-xl object-contain shrink-0 border border-slate-200 p-1 bg-slate-50" alt="${escapeHtml(cat.name)}" onerror="this.src='assets/images/logo-songer-creative.png'" />`;
    } else {
      const iconStr = cat.icon || 'bi-grid';
      if (iconStr.startsWith('bi-') || iconStr.startsWith('bi ')) {
        const biClass = iconStr.replace(/^bi\s+/, '');
        iconHtml = `<div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 text-lg"><i class="bi ${biClass}"></i></div>`;
      } else {
        iconHtml = `<div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100"><i data-lucide="${iconStr}" class="w-5 h-5"></i></div>`;
      }
    }

    return `
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
        <div>
          <!-- Header Card -->
          <div class="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
            <div class="flex items-center gap-3">
              ${iconHtml}
              <div>
                <h3 class="font-bold text-slate-900 text-sm">${escapeHtml(cat.name)}</h3>
                <div class="flex items-center gap-1.5 flex-wrap mt-0.5">
                  <span class="text-[11px] text-slate-400 font-mono">${cat.slug} • ${cat.products_count} Produk</span>
                  ${isQuickNav
                    ? `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Quick Nav: Tampil</span>`
                    : `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">Quick Nav: Sembunyi</span>`
                  }
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button type="button" class="btn-edit-cat p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition" data-id="${cat.id}" title="Edit Kategori">
                <i data-lucide="edit-2" class="w-4 h-4"></i>
              </button>
              <button type="button" class="btn-del-cat p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition" data-id="${cat.id}" data-name="${escapeHtml(cat.name)}" title="Hapus Kategori">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <p class="text-xs text-slate-500 mt-2 mb-3">${escapeHtml(cat.description || 'Tidak ada deskripsi.')}</p>

          <!-- Sub-Categories List -->
          <div class="space-y-2 pt-2">
            <div class="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <span>Sub-Kategori (${subs.length}):</span>
              <button type="button" class="btn-quick-add-sub text-emerald-600 hover:underline font-bold lowercase" data-cat-id="${cat.id}">+ tambah sub</button>
            </div>

            <div class="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              ${subs.length === 0 ? `
                <div class="text-[11px] text-slate-400 italic p-2 bg-slate-50 rounded-lg text-center">Belum ada sub-kategori.</div>
              ` : subs.map(s => `
                <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 text-xs transition">
                  <div class="flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span class="font-medium text-slate-800">${escapeHtml(s.name)}</span>
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-700">Card ${s.default_card_variant || 'A'}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <button type="button" class="btn-edit-sub text-slate-400 hover:text-emerald-600 p-1" data-id="${s.id}" data-cat-id="${cat.id}" data-name="${escapeHtml(s.name)}" data-variant="${s.default_card_variant}">
                      <i data-lucide="edit" class="w-3.5 h-3.5"></i>
                    </button>
                    <button type="button" class="btn-del-sub text-slate-400 hover:text-red-600 p-1" data-id="${s.id}" data-name="${escapeHtml(s.name)}">
                      <i data-lucide="x" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Total Produk Terhubung: <strong>${cat.products_count}</strong></span>
          <span class="text-emerald-600 font-medium">Etalase Aktif</span>
        </div>
      </div>
    `;
  }

  function renderOrderLabelConfig() {
    const settings = DB.getOrderLabelSettings();
    const isManual = settings.mode === 'manual';
    const sampleInv = DB.formatInvoiceNumber(isManual ? 'manual' : (settings.custom_labels[0] || 'DnC'), 1);

    return `
      <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 class="font-bold text-sm text-slate-900 flex items-center gap-2">
              <i data-lucide="hash" class="w-4 h-4 text-emerald-600"></i>
              Konfigurasi Label Kategori Order & Penomoran Invoice Kasir
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Atur format penomoran faktur kasir: nomor urut manual murni (00001) atau label prefix khusus (DnC-00001, CtK-00001).
            </p>
          </div>
          <div class="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <span class="text-[11px] font-semibold text-emerald-800">Contoh Hasil Faktur:</span>
            <span class="font-mono font-bold text-xs text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-300 shadow-2xs">${sampleInv}</span>
          </div>
        </div>

        <!-- 2 Mode Pilihan -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          <!-- Mode 1: Format Manual (00001) -->
          <label class="p-3.5 rounded-xl border ${isManual ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500' : 'border-slate-200 hover:bg-slate-50'} cursor-pointer transition space-y-1 block">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-900 flex items-center gap-1.5">
                <i data-lucide="list-ordered" class="w-4 h-4 text-emerald-600"></i>
                Format Manual (Nomor Urut Kasir)
              </span>
              <input type="radio" name="order_numbering_mode_radio" value="manual" ${isManual ? 'checked' : ''} class="text-emerald-600" />
            </div>
            <p class="text-slate-500 text-[11px] leading-relaxed">
              Format faktur: <strong class="font-mono text-slate-700">00001, 00002, 00003</strong>. Cocok untuk mesin kasir konvensional.
            </p>
          </label>

          <!-- Mode 2: Label Prefix Khusus -->
          <label class="p-3.5 rounded-xl border ${!isManual ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500' : 'border-slate-200 hover:bg-slate-50'} cursor-pointer transition space-y-1 block">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-900 flex items-center gap-1.5">
                <i data-lucide="tag" class="w-4 h-4 text-emerald-600"></i>
                Format Label Khusus (Prefix Kategori)
              </span>
              <input type="radio" name="order_numbering_mode_radio" value="custom_label" ${!isManual ? 'checked' : ''} class="text-emerald-600" />
            </div>
            <p class="text-slate-500 text-[11px] leading-relaxed">
              Format faktur: <strong class="font-mono text-slate-700">DnC-00001, CtK-00001</strong>. Nomor faktur terorganisir per divisi kerja.
            </p>
          </label>

        </div>

        <!-- Kelola Daftar Label Khusus -->
        <div class="pt-3 border-t border-slate-100 space-y-2.5 ${isManual ? 'opacity-50 pointer-events-none' : ''}">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-700">Daftar Label Kategori Order Aktif:</span>
            <span class="text-[11px] text-slate-400">Pilih atau tambahkan kode prefix baru</span>
          </div>

          <!-- Chip list -->
          <div class="flex flex-wrap items-center gap-2">
            ${settings.custom_labels.map(lbl => `
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
                <span class="font-mono text-emerald-700">${escapeHtml(lbl)}</span>
                <button type="button" class="btn-remove-order-label text-slate-400 hover:text-red-600 transition" data-label="${escapeHtml(lbl)}" title="Hapus Label">
                  <i data-lucide="x" class="w-3 h-3"></i>
                </button>
              </div>
            `).join('')}
          </div>

          <!-- Tambah Label Form -->
          <div class="flex items-center gap-2 pt-1 max-w-sm">
            <input type="text" id="input-new-order-label" placeholder="Tambah label (contoh: ADV, SOUV)" class="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono uppercase outline-none focus:border-emerald-500" maxlength="10" />
            <button type="button" id="btn-add-order-label" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>Tambah</span>
            </button>
          </div>
        </div>

      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // KOLEKSI IKON VISUAL KOMPREHENSIF (BOOTSTRAP ICONS & LUCIDE)
  // --------------------------------------------------------------------------
  const CATEGORY_ICON_LIST = [
    { id: 'shop', name: 'Toko', bi: 'bi-shop' },
    { id: 'tag', name: 'Tag Label', bi: 'bi-tag-fill' },
    { id: 'grid', name: 'Katalog', bi: 'bi-grid-fill' },
    { id: 'layers', name: 'Layers', bi: 'bi-layers-fill' },
    { id: 'printer', name: 'Percetakan', bi: 'bi-printer-fill' },
    { id: 'palette', name: 'Desain', bi: 'bi-palette-fill' },
    { id: 'gift', name: 'Souvenir', bi: 'bi-gift-fill' },
    { id: 'bag', name: 'Tas Belanja', bi: 'bi-bag-fill' },
    { id: 'box', name: 'Packaging', bi: 'bi-box-seam-fill' },
    { id: 'shirt', name: 'Tekstil', bi: 'bi-person-badge-fill' },
    { id: 'scissors', name: 'Finishing', bi: 'bi-scissors' },
    { id: 'cup', name: 'Mug & Cup', bi: 'bi-cup-hot-fill' },
    { id: 'camera', name: 'Fotografi', bi: 'bi-camera-fill' },
    { id: 'star', name: 'Bintang', bi: 'bi-star-fill' },
    { id: 'heart', name: 'Favorit', bi: 'bi-heart-fill' },
    { id: 'percent', name: 'Diskon', bi: 'bi-percent' },
    { id: 'cart', name: 'Keranjang', bi: 'bi-cart-fill' },
    { id: 'truck', name: 'Ekspedisi', bi: 'bi-truck' },
    { id: 'qr-code', name: 'QR Code', bi: 'bi-qr-code' },
    { id: 'badge-check', name: 'Resmi', bi: 'bi-patch-check-fill' },
    { id: 'sparkles', name: 'Kreatif', bi: 'bi-stars' },
    { id: 'tool', name: 'Alat & Servis', bi: 'bi-tools' },
    { id: 'bookmark', name: 'Bookmark', bi: 'bi-bookmark-star-fill' },
    { id: 'file-text', name: 'Dokumen', bi: 'bi-file-earmark-text-fill' },
    { id: 'envelope', name: 'Undangan', bi: 'bi-envelope-paper-fill' },
    { id: 'credit-card', name: 'Kartu Nama', bi: 'bi-credit-card-2-front-fill' },
    { id: 'award', name: 'Plakat / Piala', bi: 'bi-award-fill' },
    { id: 'signpost', name: 'Banner / Spanduk', bi: 'bi-signpost-2-fill' },
    { id: 'stickies', name: 'Stiker & Label', bi: 'bi-stickies-fill' },
    { id: 'folder', name: 'Map & Folder', bi: 'bi-folder-fill' }
  ];

  function renderIconGrid(selectedId = 'layers') {
    const gridEl = document.getElementById('cat-icon-picker-grid');
    if (!gridEl) return;
    gridEl.innerHTML = CATEGORY_ICON_LIST.map(item => {
      const isSelected = item.id === selectedId;
      return `
        <button type="button" class="btn-icon-pick-item p-1.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${isSelected ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-xs' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700'}" data-icon="${item.id}" title="${item.name} (${item.id})">
          <i class="bi ${item.bi} text-lg"></i>
          <span class="text-[9px] truncate w-full block text-slate-500 leading-tight">${item.name}</span>
        </button>
      `;
    }).join('');

    gridEl.querySelectorAll('.btn-icon-pick-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const iconId = btn.getAttribute('data-icon');
        const iconInput = document.getElementById('cat-input-icon');
        if (iconInput) iconInput.value = iconId;
        updateSelectedIconPreview(iconId);
        renderIconGrid(iconId);
      });
    });
  }

  function updateSelectedIconPreview(iconId) {
    const prev = document.getElementById('cat-icon-selected-preview');
    if (!prev) return;
    let cleanId = (iconId || 'bi-grid').trim();
    if (cleanId.startsWith('bi ')) cleanId = cleanId.replace(/^bi\s+/, '');
    const found = CATEGORY_ICON_LIST.find(i => i.id === cleanId || i.bi === cleanId || i.bi === `bi-${cleanId}`);
    const biClass = found ? found.bi : (cleanId.startsWith('bi-') ? cleanId : `bi-${cleanId}`);
    prev.innerHTML = `<i class="bi ${biClass} text-lg"></i>`;
  }

  function syncCategoryModalFields() {
    const imgSection = document.getElementById('cat-form-image-section');
    const iconSection = document.getElementById('cat-form-icon-section');
    if (imgSection) imgSection.classList.remove('hidden');
    if (iconSection) iconSection.classList.remove('hidden');
  }

  // --------------------------------------------------------------------------
  // LIVE PREVIEW UPDATER FOR QUICK FILTER BUILDER
  // --------------------------------------------------------------------------
  function updateQuickFilterLivePreview() {
    const track = document.getElementById('qf-live-preview-track');
    if (!track) return;

    const selectedModel = document.querySelector('input[name="qf_model_radio"]:checked')?.value || 'icon_text';
    const radius = document.getElementById('qf-ctrl-radius')?.value || '9999px';
    const borderColor = document.getElementById('qf-hex-border')?.value || '#e2e8f0';
    const bgColor = document.getElementById('qf-hex-bg')?.value || '#ffffff';
    const iconColor = document.getElementById('qf-hex-icon')?.value || '#059669';
    const textColor = document.getElementById('qf-hex-text')?.value || '#0f172a';

    // 3 Quick Filters Custom Texts & Icons
    const allText = document.getElementById('qf-text-all')?.value.trim() || 'Semua';
    const allIcon = document.getElementById('qf-icon-all')?.value.trim() || 'layout-grid';
    const bestsellerText = document.getElementById('qf-text-bestseller')?.value.trim() || 'Produk Terlaris';
    const bestsellerIcon = document.getElementById('qf-icon-bestseller')?.value.trim() || 'flame';
    const promoText = document.getElementById('qf-text-promo')?.value.trim() || 'Sedang Promo';
    const promoIcon = document.getElementById('qf-icon-promo')?.value.trim() || 'ticket-percent';

    // Update active style on model cards
    document.querySelectorAll('.qf-model-card').forEach(card => {
      const m = card.getAttribute('data-model');
      if (m === selectedModel) {
        card.className = 'qf-model-card p-3.5 rounded-2xl border border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 cursor-pointer transition space-y-1.5 block';
      } else {
        card.className = 'qf-model-card p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition space-y-1.5 block';
      }
    });

    // Dim/undim color control boxes based on active model
    const iconBox = document.getElementById('qf-color-icon-box');
    const textBox = document.getElementById('qf-color-text-box');
    if (iconBox) {
      if (selectedModel === 'only_image' || selectedModel === 'only_text') {
        iconBox.classList.add('opacity-40', 'pointer-events-none');
      } else {
        iconBox.classList.remove('opacity-40', 'pointer-events-none');
      }
    }
    if (textBox) {
      if (selectedModel === 'only_image' || selectedModel === 'only_icon') {
        textBox.classList.add('opacity-40', 'pointer-events-none');
      } else {
        textBox.classList.remove('opacity-40', 'pointer-events-none');
      }
    }

    // Generate sample preview items
    const categories = DB.getCategories();
    const sampleList = categories.length > 0 ? categories : [
      { id: '1', name: 'Digital Printing', icon: 'printer', image: 'assets/images/logo-songer-creative.png' },
      { id: '2', name: 'Desain Grafis', icon: 'palette', image: 'assets/images/logo-songer-creative.png' },
      { id: '3', name: 'Souvenir & Retail', icon: 'gift', image: 'assets/images/logo-songer-creative.png' },
      { id: '4', name: 'Percetakan Offset', icon: 'box', image: 'assets/images/logo-songer-creative.png' }
    ];

    // Card style string
    const cardStyle = `background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: ${radius}; color: ${textColor};`;

    let html = `
      <!-- Quick Filter Pinned Left: HANYA 'Semua' yang Tetap (Tidak Ikut Swipe) -->
      <div class="flex items-center shrink-0 z-10 sticky left-0 pr-2 border-r border-slate-300 bg-white/95">
        <!-- Quick Action 1: Filter Semua (Aktif & Pinned) -->
        <div class="px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 shrink-0 bg-emerald-600 text-white shadow-xs cursor-pointer" style="border-radius: ${radius};" title="${escapeHtml(allText)}">
          <i data-lucide="${escapeHtml(allIcon)}" class="w-3.5 h-3.5"></i>
          <span>${escapeHtml(allText)}</span>
        </div>
      </div>

      <!-- Scrollable Track: Filter Terlaris, Sedang Promo & Kategori (Bisa Di-swipe Bebas) -->
      <div class="flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-none flex-1 min-w-0">
        <!-- Quick Action 2: Terlaris (Ikut Swipe) -->
        <div class="px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-2xs hover:brightness-95 cursor-pointer" style="${cardStyle}" title="${escapeHtml(bestsellerText)}">
          <i data-lucide="${escapeHtml(bestsellerIcon)}" class="w-3.5 h-3.5 shrink-0" style="color: ${iconColor};"></i>
          <span>${escapeHtml(bestsellerText)}</span>
        </div>

        <!-- Quick Action 3: Sedang Promo (Ikut Swipe) -->
        <div class="px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-2xs hover:brightness-95 cursor-pointer" style="${cardStyle}" title="${escapeHtml(promoText)}">
          <i data-lucide="${escapeHtml(promoIcon)}" class="w-3.5 h-3.5 shrink-0" style="color: ${iconColor};"></i>
          <span>${escapeHtml(promoText)}</span>
        </div>
    `;

    sampleList.forEach(c => {
      let inner = '';
      const imgPath = c.image || 'assets/images/logo-songer-creative.png';

      if (selectedModel === 'only_image') {
        inner = `
          <img src="${imgPath}" class="w-6 h-6 object-contain rounded-sm shrink-0" alt="${escapeHtml(c.name)}" onerror="this.src='assets/images/logo-songer-creative.png'" />
        `;
      } else if (selectedModel === 'only_icon') {
        inner = `
          <i data-lucide="${c.icon || 'layers'}" class="w-4 h-4 shrink-0" style="color: ${iconColor};"></i>
        `;
      } else if (selectedModel === 'image_text') {
        inner = `
          <img src="${imgPath}" class="w-5 h-5 object-contain rounded-xs shrink-0" alt="${escapeHtml(c.name)}" onerror="this.src='assets/images/logo-songer-creative.png'" />
          <span class="truncate">${escapeHtml(c.name)}</span>
        `;
      } else if (selectedModel === 'icon_text') {
        inner = `
          <i data-lucide="${c.icon || 'layers'}" class="w-3.5 h-3.5 shrink-0" style="color: ${iconColor};"></i>
          <span class="truncate">${escapeHtml(c.name)}</span>
        `;
      } else { // only_text
        inner = `
          <span class="truncate">${escapeHtml(c.name)}</span>
        `;
      }

      html += `
        <div class="px-4 py-2 text-xs font-bold transition flex items-center gap-2 whitespace-nowrap shrink-0 shadow-2xs hover:brightness-95 cursor-pointer" style="${cardStyle}" title="${escapeHtml(c.name)}">
          ${inner}
        </div>
      `;
    });

    html += `</div>`;

    track.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  }

  // --------------------------------------------------------------------------
  // DROPDOWN IKON INTERAKTIF UNTUK 3 QUICK ACTION
  // --------------------------------------------------------------------------
  function initQfIconDropdowns() {
    document.querySelectorAll('.qf-icon-picker-component').forEach(wrap => {
      const fieldId = wrap.getAttribute('data-field');
      const input = wrap.querySelector(`#${fieldId}`);
      const btn = wrap.querySelector('.btn-qf-icon-dropdown');
      const menu = wrap.querySelector('.menu-qf-icon-dropdown');
      const searchInput = wrap.querySelector('.input-qf-icon-search');
      const grid = wrap.querySelector('.grid-qf-icon-options');

      if (!btn || !menu || !grid || !input) return;

      function renderOptions(filterText = '') {
        const query = filterText.toLowerCase().trim();
        const filtered = query
          ? QF_ICON_OPTIONS.filter(o => o.id.toLowerCase().includes(query) || o.name.toLowerCase().includes(query))
          : QF_ICON_OPTIONS;

        let itemsHtml = filtered.map(opt => {
          const isSelected = opt.id === input.value;
          return `
            <button type="button" class="btn-qf-icon-choice p-1.5 rounded-xl border ${isSelected ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold' : 'border-slate-100 hover:border-emerald-300 hover:bg-slate-50 text-slate-700'} flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center" data-icon="${opt.id}" title="${opt.name}">
              <i data-lucide="${opt.id}" class="w-4 h-4 shrink-0"></i>
              <span class="text-[9px] font-mono truncate w-full text-slate-500 leading-tight">${opt.id}</span>
            </button>
          `;
        }).join('');

        if (filtered.length === 0 && query) {
          itemsHtml = `
            <div class="col-span-4 p-2 text-center space-y-1">
              <p class="text-[10px] text-slate-500">Ikon khusus:</p>
              <button type="button" class="btn-qf-icon-choice px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono font-bold flex items-center justify-center gap-1 mx-auto cursor-pointer" data-icon="${query}">
                <i data-lucide="${query}" class="w-3.5 h-3.5"></i>
                <span>${query}</span>
              </button>
            </div>
          `;
        }

        grid.innerHTML = itemsHtml;
        if (window.lucide) window.lucide.createIcons();

        grid.querySelectorAll('.btn-qf-icon-choice').forEach(choiceBtn => {
          choiceBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const pickedIcon = choiceBtn.getAttribute('data-icon');
            if (pickedIcon) {
              input.value = pickedIcon;
              const prevIcon = btn.querySelector('.qf-active-icon-preview');
              const prevLabel = btn.querySelector('.qf-active-icon-label');
              if (prevIcon) prevIcon.setAttribute('data-lucide', pickedIcon);
              if (prevLabel) prevLabel.textContent = pickedIcon;
              if (window.lucide) window.lucide.createIcons();

              menu.classList.add('hidden');
              updateQuickFilterLivePreview();
            }
          });
        });
      }

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.menu-qf-icon-dropdown').forEach(m => {
          if (m !== menu) m.classList.add('hidden');
        });

        const isHidden = menu.classList.contains('hidden');
        if (isHidden) {
          renderOptions(searchInput ? searchInput.value : '');
          menu.classList.remove('hidden');
          if (searchInput) {
            setTimeout(() => searchInput.focus(), 50);
          }
        } else {
          menu.classList.add('hidden');
        }
      });

      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          renderOptions(e.target.value);
        });
        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const val = searchInput.value.trim().toLowerCase();
            if (val) {
              input.value = val;
              const prevIcon = btn.querySelector('.qf-active-icon-preview');
              const prevLabel = btn.querySelector('.qf-active-icon-label');
              if (prevIcon) prevIcon.setAttribute('data-lucide', val);
              if (prevLabel) prevLabel.textContent = val;
              if (window.lucide) window.lucide.createIcons();
              menu.classList.add('hidden');
              updateQuickFilterLivePreview();
            }
          }
        });
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.qf-icon-picker-component')) {
        document.querySelectorAll('.menu-qf-icon-dropdown').forEach(m => m.classList.add('hidden'));
      }
    });
  }

  // --------------------------------------------------------------------------
  // BIND ALL EVENTS & INTERACTIVE LISTENERS
  // --------------------------------------------------------------------------
  function bindEvents() {
    // Two-way Color Binding for Quick Filter Customizer
    function bindQfColorPair(pickerId, hexId) {
      const picker = document.getElementById(pickerId);
      const hex = document.getElementById(hexId);
      if (!picker || !hex) return;

      picker.addEventListener('input', (e) => {
        hex.value = e.target.value.toUpperCase();
        updateQuickFilterLivePreview();
      });

      hex.addEventListener('input', (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          picker.value = val;
          updateQuickFilterLivePreview();
        }
      });
    }

    bindQfColorPair('qf-color-border', 'qf-hex-border');
    bindQfColorPair('qf-color-bg', 'qf-hex-bg');
    bindQfColorPair('qf-color-icon', 'qf-hex-icon');
    bindQfColorPair('qf-color-text', 'qf-hex-text');

    const radiusSelect = document.getElementById('qf-ctrl-radius');
    if (radiusSelect) {
      radiusSelect.addEventListener('change', updateQuickFilterLivePreview);
    }

    // Real-time live preview update on changing custom texts & icons
    const qfTextInputs = [
      'qf-text-all', 'qf-icon-all',
      'qf-text-bestseller', 'qf-icon-bestseller',
      'qf-text-promo', 'qf-icon-promo'
    ];
    qfTextInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', updateQuickFilterLivePreview);
      }
    });

    // Inisialisasi dropdown visual ikon untuk 3 quick action
    initQfIconDropdowns();

    const scrollbarToggle = document.getElementById('qf-ctrl-desktop-scrollbar');
    if (scrollbarToggle) {
      scrollbarToggle.addEventListener('change', updateQuickFilterLivePreview);
    }

    document.querySelectorAll('input[name="qf_model_radio"]').forEach(r => {
      r.addEventListener('change', () => {
        updateQuickFilterLivePreview();
        syncCategoryModalFields(r.value);
      });
    });

    document.querySelectorAll('input[name="modal_cat_type"]').forEach(r => {
      r.addEventListener('change', () => {
        syncCategoryModalFields(r.value);
      });
    });

    // Save Quick Filter Configuration Button
    const btnSaveQf = document.getElementById('btn-save-quick-filter');
    if (btnSaveQf) {
      btnSaveQf.addEventListener('click', () => {
        const selectedModel = document.querySelector('input[name="qf_model_radio"]:checked')?.value || 'icon_text';
        const radius = document.getElementById('qf-ctrl-radius')?.value || '9999px';
        const borderColor = document.getElementById('qf-hex-border')?.value.trim() || '#e2e8f0';
        const bgColor = document.getElementById('qf-hex-bg')?.value.trim() || '#ffffff';
        const iconColor = document.getElementById('qf-hex-icon')?.value.trim() || '#059669';
        const textColor = document.getElementById('qf-hex-text')?.value.trim() || '#0f172a';
        const showDesktopScrollbar = document.getElementById('qf-ctrl-desktop-scrollbar')?.checked || false;
        const filterAllText = document.getElementById('qf-text-all')?.value.trim() || 'Semua';
        const filterAllIcon = document.getElementById('qf-icon-all')?.value.trim() || 'layout-grid';
        const filterBestsellerText = document.getElementById('qf-text-bestseller')?.value.trim() || 'Produk Terlaris';
        const filterBestsellerIcon = document.getElementById('qf-icon-bestseller')?.value.trim() || 'flame';
        const filterPromoText = document.getElementById('qf-text-promo')?.value.trim() || 'Sedang Promo';
        const filterPromoIcon = document.getElementById('qf-icon-promo')?.value.trim() || 'ticket-percent';

        const settings = DB.getSettings();
        settings.quick_filter_config = {
          model: selectedModel,
          border_radius: radius,
          border_color: borderColor,
          bg_color: bgColor,
          icon_color: iconColor,
          text_color: textColor,
          show_desktop_scrollbar: showDesktopScrollbar,
          filter_all_text: filterAllText,
          filter_all_icon: filterAllIcon,
          filter_bestseller_text: filterBestsellerText,
          filter_bestseller_icon: filterBestsellerIcon,
          filter_promo_text: filterPromoText,
          filter_promo_icon: filterPromoIcon
        };

        DB.saveSettings(settings);
        App.showToast('Pengaturan Quick Filter berhasil disimpan!', 'success');
      });
    }

    // Modal Category - Image File Upload with 500 KB limit
    const catFileIn = document.getElementById('cat-input-image-file');
    const catUrlIn = document.getElementById('cat-input-image-url');
    const catImgPrev = document.getElementById('cat-img-preview');
    if (catFileIn) {
      catFileIn.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 500 * 1024) {
          App.showToast(`Ukuran berkas (${(file.size / 1024).toFixed(0)} KB) melebihi batas 500 KB!`, 'error');
          catFileIn.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = evt => {
          if (catUrlIn) catUrlIn.value = evt.target.result;
          if (catImgPrev) catImgPrev.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    if (catUrlIn && catImgPrev) {
      catUrlIn.addEventListener('input', e => {
        catImgPrev.src = e.target.value || 'assets/images/logo-songer-creative.png';
      });
    }

    // Modal Category - Visual Icon Input Sync
    const catIconText = document.getElementById('cat-input-icon');
    if (catIconText) {
      catIconText.addEventListener('input', e => {
        const val = e.target.value.trim() || 'bi-grid';
        updateSelectedIconPreview(val);
        renderIconGrid(val);
      });
    }

    // Quick Icon Chips
    document.querySelectorAll('.btn-quick-icon-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        const val = chip.getAttribute('data-icon');
        if (catIconText) {
          catIconText.value = val;
          updateSelectedIconPreview(val);
          renderIconGrid(val);
        }
      });
    });

    // Quick Setting Bar Mode Switcher
    document.querySelectorAll('.btn-quick-switch-mode').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        const settings = DB.getSettings();
        const qf = settings.quick_filter_config || {};
        let updates = {};
        let modeName = '';

        if (mode === 'icon') {
          updates = {
            category_nav_mode_desktop: 'icon_image',
            category_nav_mode_mobile: 'icon_image',
            quick_filter_config: { ...qf, category_filter_model: 'icon_text', model: 'icon_text' }
          };
          modeName = 'Mode Icon (Ikon & Teks)';
        } else if (mode === 'gambar') {
          updates = {
            category_nav_mode_desktop: 'icon_image',
            category_nav_mode_mobile: 'icon_image',
            quick_filter_config: { ...qf, category_filter_model: 'image_text', model: 'image_text' }
          };
          modeName = 'Mode Gambar (Thumbnail)';
        } else if (mode === 'pill') {
          updates = {
            category_nav_mode_desktop: 'pills_text',
            category_nav_mode_mobile: 'pills_text',
            quick_filter_config: { ...qf, category_filter_model: 'only_text', model: 'only_text' }
          };
          modeName = 'Mode Pill (Kapsul Teks)';
        } else if (mode === 'dropdown') {
          updates = {
            category_nav_mode_desktop: 'dropdown',
            category_nav_mode_mobile: 'dropdown'
          };
          modeName = 'Mode Dropdown (Kompak)';
        }

        DB.updateSettings(updates);
        if (window.App && typeof App.showToast === 'function') {
          App.showToast(`Mode Quick Filter etalase berhasil diubah ke: ${modeName}!`, 'success');
        }
        render();
        bindEvents();
      });
    });

    // Add Category
    const btnAddCat = document.getElementById('btn-add-category');
    if (btnAddCat) {
      btnAddCat.addEventListener('click', () => {
        editingCategoryId = null;
        document.getElementById('modal-category-title').textContent = 'Tambah Kategori Utama';
        document.getElementById('cat-input-name').value = '';
        document.getElementById('cat-input-desc').value = '';
        if (catIconText) catIconText.value = 'bi-grid';
        if (catUrlIn) catUrlIn.value = '';
        if (catImgPrev) catImgPrev.src = 'assets/images/logo-songer-creative.png';
        const quickNavIn = document.getElementById('cat-input-show-quick-nav');
        if (quickNavIn) quickNavIn.checked = true;
        syncCategoryModalFields();
        renderIconGrid('bi-grid');
        updateSelectedIconPreview('bi-grid');
        document.getElementById('modal-category').classList.remove('hidden');
      });
    }

    // Add Sub Category
    const btnAddSub = document.getElementById('btn-add-sub-category');
    if (btnAddSub) {
      btnAddSub.addEventListener('click', () => {
        editingSubCategoryId = null;
        document.getElementById('modal-sub-title').textContent = 'Tambah Sub-Kategori';
        document.getElementById('sub-input-name').value = '';
        document.getElementById('sub-input-card-variant').value = 'A';
        document.getElementById('modal-sub-category').classList.remove('hidden');
      });
    }

    // Quick Add Sub from Category Card
    document.querySelectorAll('.btn-quick-add-sub').forEach(btn => {
      btn.addEventListener('click', () => {
        const catId = btn.getAttribute('data-cat-id');
        editingSubCategoryId = null;
        document.getElementById('modal-sub-title').textContent = 'Tambah Sub-Kategori';
        document.getElementById('sub-input-parent').value = catId;
        document.getElementById('sub-input-name').value = '';
        document.getElementById('sub-input-card-variant').value = 'A';
        document.getElementById('modal-sub-category').classList.remove('hidden');
      });
    });

    // Close Modals
    document.querySelectorAll('.btn-close-cat-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('modal-category').classList.add('hidden');
      });
    });

    document.querySelectorAll('.btn-close-sub-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('modal-sub-category').classList.add('hidden');
      });
    });

    // Save Category
    const btnSaveCat = document.getElementById('btn-save-category');
    if (btnSaveCat) {
      btnSaveCat.addEventListener('click', () => {
        const name = document.getElementById('cat-input-name').value.trim();
        const desc = document.getElementById('cat-input-desc').value.trim();
        const icon = document.getElementById('cat-input-icon')?.value.trim() || 'bi-grid';
        const image = document.getElementById('cat-input-image-url')?.value.trim() || '';
        const show_in_quick_nav = document.getElementById('cat-input-show-quick-nav')?.checked !== false;

        if (!name) {
          alert('Nama kategori tidak boleh kosong!');
          return;
        }

        if (editingCategoryId) {
          DB.updateCategory(editingCategoryId, { name, description: desc, icon, image, show_in_quick_nav });
          App.showToast('Kategori utama berhasil diperbarui!', 'success');
        } else {
          DB.createCategory({ name, description: desc, icon, image, show_in_quick_nav });
          App.showToast('Kategori utama baru berhasil ditambahkan!', 'success');
        }

        document.getElementById('modal-category').classList.add('hidden');
        render();
        bindEvents();
      });
    }

    // Save Sub Category
    const btnSaveSub = document.getElementById('btn-save-sub-category');
    if (btnSaveSub) {
      btnSaveSub.addEventListener('click', () => {
        const catId = document.getElementById('sub-input-parent').value;
        const name = document.getElementById('sub-input-name').value.trim();
        const variant = document.getElementById('sub-input-card-variant').value;

        if (!name) {
          alert('Nama sub-kategori tidak boleh kosong!');
          return;
        }

        if (editingSubCategoryId) {
          DB.updateSubCategory(editingSubCategoryId, { category_id: catId, name, default_card_variant: variant });
          App.showToast('Sub-kategori berhasil diperbarui!', 'success');
        } else {
          DB.createSubCategory({ category_id: catId, name, default_card_variant: variant });
          App.showToast('Sub-kategori baru berhasil ditambahkan!', 'success');
        }

        document.getElementById('modal-sub-category').classList.add('hidden');
        render();
        bindEvents();
      });
    }

    // Edit Category
    document.querySelectorAll('.btn-edit-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const cat = DB.getCategoryById(id);
        if (!cat) return;

        editingCategoryId = id;
        document.getElementById('modal-category-title').textContent = 'Edit Kategori Utama';
        document.getElementById('cat-input-name').value = cat.name;
        document.getElementById('cat-input-desc').value = cat.description || '';
        const curIcon = cat.icon || 'bi-grid';
        if (catIconText) catIconText.value = curIcon;
        if (catUrlIn) catUrlIn.value = cat.image || '';
        if (catImgPrev) catImgPrev.src = cat.image || 'assets/images/logo-songer-creative.png';
        const quickNavIn = document.getElementById('cat-input-show-quick-nav');
        if (quickNavIn) quickNavIn.checked = cat.show_in_quick_nav !== false;
        syncCategoryModalFields();
        renderIconGrid(curIcon);
        updateSelectedIconPreview(curIcon);
        document.getElementById('modal-category').classList.remove('hidden');
      });
    });

    // Delete Category with Warning
    document.querySelectorAll('.btn-del-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        const impact = DB.getCategoryImpact(id);

        let warnMsg = `Hapus kategori "${name}"?`;
        if (impact.productsCount > 0) {
          warnMsg = `⚠️ PERINGATAN PENGHAPUSAN:\n\nKategori "${name}" memiliki ${impact.productsCount} produk dan ${impact.subCategoriesCount} sub-kategori terkait!\n\nMenghapus kategori ini AKAN MENGHAPUS SEMUA ${impact.productsCount} PRODUK di dalamnya dari sistem secara permanen.\n\nApakah Anda yakin ingin melanjutkan penghapusan?`;
        } else if (impact.subCategoriesCount > 0) {
          warnMsg = `Hapus kategori "${name}"? Seluruh ${impact.subCategoriesCount} sub-kategori di dalamnya juga akan terhapus.`;
        }

        if (confirm(warnMsg)) {
          const res = DB.deleteCategory(id, true);
          App.showToast(`Kategori "${name}" ${res.deletedProductsCount > 0 ? `dan ${res.deletedProductsCount} produk terkait ` : ''}berhasil dihapus.`, 'info');
          render();
          bindEvents();
        }
      });
    });

    // Edit Sub Category
    document.querySelectorAll('.btn-edit-sub').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const catId = btn.getAttribute('data-cat-id');
        const name = btn.getAttribute('data-name');
        const variant = btn.getAttribute('data-variant') || 'A';

        editingSubCategoryId = id;
        document.getElementById('modal-sub-title').textContent = 'Edit Sub-Kategori';
        document.getElementById('sub-input-parent').value = catId;
        document.getElementById('sub-input-name').value = name;
        document.getElementById('sub-input-card-variant').value = variant;
        document.getElementById('modal-sub-category').classList.remove('hidden');
      });
    });

    // Delete Sub Category with Warning
    document.querySelectorAll('.btn-del-sub').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        const impact = DB.getSubCategoryImpact(id);

        let warnMsg = `Hapus sub-kategori "${name}"?`;
        if (impact.productsCount > 0) {
          warnMsg = `⚠️ PERINGATAN PENGHAPUSAN:\n\nSub-kategori "${name}" memiliki ${impact.productsCount} produk terkait!\n\nMenghapus sub-kategori ini AKAN MENGHAPUS SEMUA ${impact.productsCount} PRODUK di dalamnya dari sistem secara permanen.\n\nApakah Anda yakin ingin melanjutkan penghapusan?`;
        }

        if (confirm(warnMsg)) {
          const res = DB.deleteSubCategory(id, true);
          App.showToast(`Sub-kategori "${name}" ${res.deletedProductsCount > 0 ? `dan ${res.deletedProductsCount} produk terkait ` : ''}berhasil dihapus.`, 'info');
          render();
          bindEvents();
        }
      });
    });

    // Order Numbering Mode Listeners
    document.querySelectorAll('input[name="order_numbering_mode_radio"]').forEach(r => {
      r.addEventListener('change', e => {
        const newMode = e.target.value;
        DB.updateOrderLabelSettings({ mode: newMode });
        App.showToast(`Mode penomoran diubah ke: ${newMode === 'manual' ? 'Format Manual (00001)' : 'Format Label Khusus'}`, 'info');
        render();
        bindEvents();
      });
    });

    // Add Custom Order Label
    const btnAddOrderLabel = document.getElementById('btn-add-order-label');
    const inputNewOrderLabel = document.getElementById('input-new-order-label');
    if (btnAddOrderLabel && inputNewOrderLabel) {
      btnAddOrderLabel.addEventListener('click', () => {
        const val = inputNewOrderLabel.value.trim().toUpperCase();
        if (!val) {
          alert('Masukkan kode label terlebih dahulu (contoh: SOUV, PRINT, ADV)!');
          return;
        }
        const success = DB.addCustomOrderLabel(val);
        if (success) {
          App.showToast(`Label khusus "${val}" berhasil ditambahkan!`, 'success');
          render();
          bindEvents();
        }
      });

      inputNewOrderLabel.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          btnAddOrderLabel.click();
        }
      });
    }

    // Remove Custom Order Label
    document.querySelectorAll('.btn-remove-order-label').forEach(btn => {
      btn.addEventListener('click', () => {
        const lbl = btn.getAttribute('data-label');
        if (confirm(`Hapus label khusus "${lbl}" dari daftar?`)) {
          DB.removeCustomOrderLabel(lbl);
          App.showToast(`Label "${lbl}" berhasil dihapus.`, 'info');
          render();
          bindEvents();
        }
      });
    });

    // Initial Live Preview update for Quick Filter
    updateQuickFilterLivePreview();
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
    init
  };
})();

window.CategoryManager = CategoryManager;

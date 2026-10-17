/**
 * Songer Creative - Advanced Product Form Controller
 * Mega Refactor Stage 4:
 *  - Removed Order Category from Product Form (determined in cashier/orders)
 *  - Multi-image upload with client-side HTML5 Canvas auto-compression (max 1200x1200px, WebP/JPEG)
 *  - Interactive AI Product Description Generator with smart context extraction and preview box
 *  - Monthly Promo option with toggle, custom label & [%] / [IDR] dropdown
 *  - Full Pricing repeaters (Meter, KombF, Fixed, Paket, Kg, Lt, KombStep)
 */

const ProductForm = (() => {
  let formMode = 'create'; // 'create' | 'edit'
  let currentEditingId = null;

  // Primary metadata state
  let primaryState = {
    name: '',
    order_category: 'Ctk', // Default operasional internal kasir
    category_id: null,     // Kategori Utama Etalase
    sub_category_id: null, // Sub-Kategori Etalase
    card_variant: 'A',     // 'A' | 'B' | 'C'
    price_type: 1,         // 1-7
    stock: null,
    is_unlimited_stock: true,
    has_monthly_discount: false,
    discount_type: 'percent', // 'percent' | 'nominal'
    discount_value: 0,
    monthly_promo_label: 'Promo Bulanan',
    min_order: 1,
    max_order: null,
    image_url: null,
    images: [],
    image_aspect_ratio: '1:1',
    description: '',
    card_footer_text: 'Proses Hanya Dalam 1Jam',
    footer_badge_icon: 'truck',
    footer_bg_color: '#059669',
    footer_text_color: '#ffffff',
    card_footer_2_text: 'Variasi Paket Tersedia/tidak tersedia',
    footer_2_badge_icon: 'minus',
    footer_2_bg_color: '#047857',
    footer_2_text_color: '#ffffff',
    enable_countdown: true,
    countdown_bg_color: '#059669',
    countdown_text_color: '#ffffff',
    countdown_border_color: '#059669',
    is_active: true
  };

  let materialsState = [];
  let finishingsState = {
    main: [],
    extra_1: [],
    extra_2: [],
    extra_3: []
  };

  function getLastProductFooterConfig() {
    try {
      const allProds = (typeof DB !== 'undefined' && DB.getProducts) ? DB.getProducts() : [];
      if (!Array.isArray(allProds) || allProds.length === 0) return null;
      // Sort by created_at descending (latest created product first)
      const sortedProds = [...allProds].sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeB - timeA;
      });
      for (const p of sortedProds) {
        if (p.custom_footer_1 || p.custom_footer_2 || p.card_footer_text || p.footer_bg_color) {
          const f1 = p.custom_footer_1 ? { ...p.custom_footer_1 } : {
            text: p.card_footer_text || 'Proses Hanya Dalam 1Jam',
            icon: p.footer_badge_icon || 'truck',
            bg_color: p.footer_bg_color || '#059669',
            text_color: p.footer_text_color || '#ffffff'
          };
          const f2 = p.custom_footer_2 ? { ...p.custom_footer_2 } : {
            text: p.card_footer_2_text || 'Variasi Paket Tersedia/tidak tersedia',
            icon: p.footer_2_badge_icon || 'minus',
            bg_color: p.footer_2_bg_color || '#047857',
            text_color: p.footer_2_text_color || '#ffffff'
          };
          return { f1, f2 };
        }
      }
    } catch (e) {
      console.warn('Error fetching last product footer config:', e);
    }
    return null;
  }

  // Helper: Penentuan Otomatis Model Kartu Berdasarkan Kategori Produk
  function getSuggestedCardVariantForCategory(categoryId) {
    if (!categoryId) return 'A';
    const categories = (typeof DB !== 'undefined' && DB.getCategories) ? DB.getCategories() : [];
    const cat = categories.find(c => String(c.id) === String(categoryId));
    if (!cat) return 'A';

    const text = `${cat.name || ''} ${cat.slug || ''} ${cat.description || ''}`.toLowerCase();

    // 1. Ritel, Fashion, Merchandise, Kuliner/F&B -> Model 3 ('C')
    const model3Keywords = ['ritel', 'retail', 'fashion', 'baju', 'kaos', 'pakaian', 'distro', 'hijab', 'merchandise', 'souvenir', 'kuliner', 'fnb', 'makanan', 'minuman', 'snack', 'kue', 'bakery', 'roti', 'kopi', 'coffee', 'mug', 'ganci'];
    if (model3Keywords.some(k => text.includes(k))) {
      return 'C';
    }

    // 2. Jasa, Layanan Profesional, Desain -> Model 2 ('B')
    const model2Keywords = ['jasa', 'layanan', 'desain', 'design', 'profesional', 'service', 'branding', 'logo', 'kursus', 'konsultasi'];
    if (model2Keywords.some(k => text.includes(k))) {
      return 'B';
    }

    // 3. Fisik Reguler, Cetak Dimensi (PxL) / Default -> Model 1 ('A')
    return 'A';
  }

  function resetFormState() {
    formMode = 'create';
    currentEditingId = null;

    const allCats = DB.getCategories();
    const defaultCatId = allCats.length > 0 ? allCats[0].id : null;
    const allSubs = defaultCatId ? DB.getSubCategories(defaultCatId) : [];
    const defaultSubId = allSubs.length > 0 ? allSubs[0].id : null;
    const initialCardVariant = getSuggestedCardVariantForCategory(defaultCatId);

    const inheritedFooter = getLastProductFooterConfig();
    const f1Default = inheritedFooter?.f1 || {
      text: 'Proses Hanya Dalam 1Jam',
      icon: 'truck',
      bg_color: '#059669',
      text_color: '#ffffff'
    };
    const f2Default = inheritedFooter?.f2 || {
      text: 'Variasi Paket Tersedia/tidak tersedia',
      icon: 'minus',
      bg_color: '#047857',
      text_color: '#ffffff'
    };

    primaryState = {
      name: '',
      order_category: 'Ctk',
      category_id: defaultCatId,
      sub_category_id: defaultSubId,
      card_variant: initialCardVariant,
      card_variant_manual_override: false,
      card_variant_override: true,
      custom_labels: [],
      custom_footer_1: { ...f1Default },
      custom_footer_2: { ...f2Default },
      card_footer_text: f1Default.text,
      footer_badge_icon: f1Default.icon,
      footer_bg_color: f1Default.bg_color,
      footer_text_color: f1Default.text_color,
      card_footer_2_text: f2Default.text,
      footer_2_badge_icon: f2Default.icon,
      footer_2_bg_color: f2Default.bg_color,
      footer_2_text_color: f2Default.text_color,
      enable_countdown: true,
      countdown_bg_color: '#059669',
      countdown_text_color: '#ffffff',
      countdown_border_color: '#059669',
      price_type: 1,
      stock: null,
      is_unlimited_stock: true,
      has_monthly_discount: false,
      discount_type: 'percent',
      discount_value: 0,
      monthly_promo_label: 'Promo Bulanan',
      min_order: 1,
      max_order: null,
      image_url: null,
      images: [],
      image_aspect_ratio: '1:1',
      description: '',
      is_active: true
    };

    materialsState = [
      { id: DB.generateUUID(), name: '', price: 0, cost_price: 0, step_multiplier: 1 }
    ];

    finishingsState = {
      main: [
        { id: DB.generateUUID(), tier: 'main', name: 'Tanpa Finishing / Standar', price: 0, cost_price: 0 }
      ],
      extra_1: [],
      extra_2: [],
      extra_3: []
    };
  }

  function loadProductForEdit(id) {
    const prod = DB.getProductById(id);
    if (!prod) {
      alert('Produk tidak ditemukan!');
      return false;
    }

    formMode = 'edit';
    currentEditingId = id;

    const imgs = Array.isArray(prod.images) && prod.images.length > 0 
      ? [...prod.images] 
      : (prod.image_url ? [prod.image_url] : []);

    const inheritedFooter = getLastProductFooterConfig();
    const f1Prod = prod.custom_footer_1 ? { ...prod.custom_footer_1 } : (
      (prod.card_footer_text || prod.footer_bg_color) ? {
        text: prod.card_footer_text || 'Proses Hanya Dalam 1Jam',
        icon: prod.footer_badge_icon || 'truck',
        bg_color: prod.footer_bg_color || '#059669',
        text_color: prod.footer_text_color || '#ffffff'
      } : (inheritedFooter?.f1 || {
        text: 'Proses Hanya Dalam 1Jam',
        icon: 'truck',
        bg_color: '#059669',
        text_color: '#ffffff'
      })
    );

    const f2Prod = prod.custom_footer_2 ? { ...prod.custom_footer_2 } : (
      (prod.card_footer_2_text || prod.footer_2_bg_color) ? {
        text: prod.card_footer_2_text || 'Variasi Paket Tersedia/tidak tersedia',
        icon: prod.footer_2_badge_icon || 'minus',
        bg_color: prod.footer_2_bg_color || '#047857',
        text_color: prod.footer_2_text_color || '#ffffff'
      } : (inheritedFooter?.f2 || {
        text: 'Variasi Paket Tersedia/tidak tersedia',
        icon: 'minus',
        bg_color: '#047857',
        text_color: '#ffffff'
      })
    );

    primaryState = {
      name: prod.name,
      order_category: prod.order_category || 'Ctk',
      category_id: prod.category_id || null,
      sub_category_id: prod.sub_category_id || null,
      card_variant: prod.card_variant || 'A',
      card_variant_override: prod.card_variant_override !== undefined ? prod.card_variant_override : true,
      custom_labels: Array.isArray(prod.custom_labels) ? [...prod.custom_labels] : (typeof prod.custom_labels === 'string' && prod.custom_labels.trim() ? prod.custom_labels.split(',').map(s => s.trim()).filter(Boolean) : []),
      custom_footer_1: f1Prod,
      custom_footer_2: f2Prod,
      card_footer_text: f1Prod.text,
      footer_badge_icon: f1Prod.icon,
      footer_bg_color: f1Prod.bg_color,
      footer_text_color: f1Prod.text_color,
      card_footer_2_text: f2Prod.text,
      footer_2_badge_icon: f2Prod.icon,
      footer_2_bg_color: f2Prod.bg_color,
      footer_2_text_color: f2Prod.text_color,
      enable_countdown: prod.enable_countdown !== undefined ? prod.enable_countdown : true,
      countdown_bg_color: prod.countdown_bg_color || '#059669',
      countdown_text_color: prod.countdown_text_color || '#ffffff',
      countdown_border_color: prod.countdown_border_color || '#059669',
      price_type: prod.price_type,
      stock: prod.stock,
      is_unlimited_stock: prod.is_unlimited_stock,
      has_monthly_discount: Boolean(prod.has_monthly_discount),
      discount_type: prod.discount_type || 'percent',
      discount_value: prod.discount_value || 0,
      monthly_promo_label: prod.monthly_promo_label || 'Promo Bulanan',
      min_order: prod.min_order || 1,
      max_order: prod.max_order || null,
      image_url: imgs.length > 0 ? imgs[0] : null,
      images: imgs,
      image_aspect_ratio: prod.image_aspect_ratio || (prod.card_variant === 'C' ? '4:3' : '1:1'),
      description: prod.description || '',
      is_active: prod.is_active
    };

    materialsState = (prod.materials && prod.materials.length > 0)
      ? JSON.parse(JSON.stringify(prod.materials))
      : [{ id: DB.generateUUID(), name: '', price: 0, cost_price: 0, step_multiplier: 1 }];

    const fins = prod.finishings || {};
    finishingsState = {
      main: (fins.main && Array.isArray(fins.main) && fins.main.length > 0)
        ? JSON.parse(JSON.stringify(fins.main))
        : (Array.isArray(fins) && fins.length > 0 ? JSON.parse(JSON.stringify(fins)) : [{ id: DB.generateUUID(), tier: 'main', name: 'Standar', price: 0, cost_price: 0 }]),
      extra_1: fins.extra_1 && Array.isArray(fins.extra_1) ? JSON.parse(JSON.stringify(fins.extra_1)) : [],
      extra_2: fins.extra_2 && Array.isArray(fins.extra_2) ? JSON.parse(JSON.stringify(fins.extra_2)) : [],
      extra_3: fins.extra_3 && Array.isArray(fins.extra_3) ? JSON.parse(JSON.stringify(fins.extra_3)) : []
    };

    renderForm();
    return true;
  }

  function renderForm() {
    const container = document.getElementById('form-container');
    if (!container) return;

    const isKombStep = primaryState.price_type === 7;
    const allCategories = DB.getCategories();
    const currentSubs = primaryState.category_id ? DB.getSubCategories(primaryState.category_id) : [];
    const customLabelsHistory = (typeof DB !== 'undefined' && DB.getCustomLabelsHistory) ? DB.getCustomLabelsHistory() : ['Best Seller', 'Produk Populer', 'Desain Custom', 'Promo Terbatas', 'Termurah', 'Premium Quality', 'Pengerjaan Cepat', 'Garansi 100%'];
    const footerTextsHistory = (typeof DB !== 'undefined' && DB.getFooterTextsHistory) ? DB.getFooterTextsHistory() : ['Proses Cepat & Garansi Presisi', 'Siap Kirim Seluruh Indonesia', 'Gratis Konsultasi Desain', 'Bahan Premium Tahan Cuaca', 'Garansi Uang Kembali Jika Cacat', 'Pengerjaan 1 Hari Jadi'];

    container.innerHTML = `
      <div class="max-w-5xl mx-auto space-y-8 pb-16">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <div class="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <button type="button" id="btn-back-to-list" class="hover:text-emerald-600 transition flex items-center gap-1 font-medium">
                <i data-lucide="arrow-left" class="w-4 h-4"></i> Daftar Produk
              </button>
              <span>/</span>
              <span class="text-slate-800 font-semibold">${formMode === 'edit' ? 'Edit Produk' : 'Tambah Produk Baru'}</span>
            </div>
            <h1 class="text-2xl font-bold text-slate-900">
              ${formMode === 'edit' ? 'Perbarui Informasi Produk' : 'Tambah Produk Baru'}
            </h1>
            <p class="text-sm text-slate-500 mt-0.5">Konfigurasi formula harga dinamis, kategori etalase, multi-foto produk, dan promo bulanan.</p>
          </div>
          <div class="flex items-center gap-3">
            <button type="button" id="btn-cancel-form" class="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm">
              Batal
            </button>
            <button type="button" id="btn-submit-product-top" class="btn-primary-brand px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-md flex items-center gap-2">
              <i data-lucide="check" class="w-4 h-4"></i> Simpan Produk
            </button>
          </div>
        </div>

        <!-- Visual Error Summary Container -->
        <div id="form-error-banner" class="hidden p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm animate-shake">
          <div class="flex items-center gap-2 font-semibold mb-1">
            <i data-lucide="alert-circle" class="w-5 h-5 text-red-600"></i> Mohon lengkapi formulir sebelum menyimpan:
          </div>
          <ul id="form-error-list" class="list-disc list-inside text-xs space-y-1 pl-1"></ul>
        </div>

        <!-- KARTU 1: INFORMASI POKOK PRODUK -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div class="border-b border-slate-100 pb-2 mb-4">
            <h2 class="text-sm font-bold text-slate-900">Informasi Pokok Produk</h2>
            <p class="text-xs text-slate-500 mt-0.5">Nama produk, deskripsi lengkap spesifikasi, dan kategori etalase.</p>
          </div>

          <!-- Judul / Nama Produk (Wajib) -->
          <div>
            <div class="flex justify-between items-center mb-1">
              <label for="input-prod-name" class="block text-sm font-semibold text-slate-800">
                Judul / Nama Produk <span class="text-red-500">*</span>
              </label>
              <span id="name-char-count" class="text-xs text-slate-400">0 / 150</span>
            </div>
            <input 
              type="text" 
              id="input-prod-name" 
              maxlength="150"
              value="${escapeHtml(primaryState.name)}"
              placeholder="Contoh: Kemeja Formal Pria, Paket Hampers, Custom Spanduk" 
              class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-slate-800 text-sm transition outline-none"
            />
          </div>

          <!-- Deskripsi Produk (Wajib) & AI Generator -->
          <div>
            <div class="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <label for="input-prod-desc" class="block text-sm font-semibold text-slate-800">
                Deskripsi Produk <span class="text-red-500">*</span>
              </label>
              <button 
                type="button" 
                id="btn-ai-generate-desc" 
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xs hover:shadow-emerald-200 transition cursor-pointer"
                title="Rangkai deskripsi produk secara otomatis dengan AI berdasarkan konteks formulir"
              >
                <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-300"></i>
                <span id="btn-ai-desc-text">✨ Buat Deskripsi dengan AI</span>
              </button>
            </div>
            <textarea 
              id="input-prod-desc" 
              rows="4" 
              placeholder="Jelaskan spesifikasi produk, keunggulan bahan, durasi pengerjaan, dan catatan penting untuk pemesan..."
              class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-slate-800 text-sm transition outline-none resize-y"
            >${escapeHtml(primaryState.description)}</textarea>

            <!-- Kontainer Pratinjau Hasil AI (Default Hidden) -->
            <div id="ai-description-preview-box" class="hidden mt-3 bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 space-y-3 transition">
              <div class="flex items-center justify-between pb-2 border-b border-emerald-100 flex-wrap gap-2">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs shadow-xs">
                    <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-300"></i>
                  </div>
                  <span class="text-xs font-bold text-slate-900">Hasil Rangkaian Deskripsi AI</span>
                </div>
                <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">Pratinjau Siap Digunakan</span>
              </div>

              <!-- Area Teks Pratinjau -->
              <div id="ai-description-preview-text" class="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-white/90 p-3.5 rounded-lg border border-emerald-100 max-h-64 overflow-y-auto font-sans selection:bg-emerald-100"></div>

              <!-- Tombol Aksi Gunakan / Batal -->
              <div class="flex items-center justify-end gap-2 pt-1 border-t border-emerald-100/60">
                <button type="button" id="btn-ai-desc-cancel" class="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition cursor-pointer">
                  Batal
                </button>
                <button type="button" id="btn-ai-desc-apply" class="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer">
                  <i data-lucide="check" class="w-3.5 h-3.5"></i>
                  <span>Gunakan Teks Ini</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Kategori & Sub-Kategori Etalase Pembeli -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div>
              <div class="flex items-center justify-between mb-1">
                <label for="select-prod-cat" class="block text-sm font-semibold text-slate-800">
                  Kategori Utama Etalase <span class="text-red-500">*</span>
                </label>
                <button type="button" id="btn-quick-add-category" class="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 transition cursor-pointer" title="Buka Menu Kategori untuk membuat kategori baru">
                  <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                  <span>+ Tambah Kategori Baru</span>
                </button>
              </div>
              <select id="select-prod-cat" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:border-emerald-500 outline-none bg-white">
                <option value="">-- Pilih Kategori Utama --</option>
                ${allCategories.map(c => `
                  <option value="${c.id}" ${primaryState.category_id === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>
                `).join('')}
              </select>
              <p class="text-[11px] text-slate-400 mt-1">Dikelola fleksibel di menu Kategori & Sub-Kategori.</p>
            </div>

            <div>
              <label for="select-prod-sub-cat" class="block text-sm font-semibold text-slate-800 mb-1">
                Sub-Kategori Etalase
              </label>
              <select id="select-prod-sub-cat" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:border-emerald-500 outline-none bg-white">
                <option value="">-- Tanpa Sub-Kategori (Umum) --</option>
                ${currentSubs.map(s => `
                  <option value="${s.id}" ${primaryState.sub_category_id === s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>
                `).join('')}
              </select>
              <p class="text-[11px] text-slate-400 mt-1">Terfilter otomatis sesuai Kategori Utama terpilih.</p>
            </div>
          </div>
        </div>

        <!-- KARTU 2: FOTO PRODUK (ALA SHOPEE) -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
          <div class="border-b border-slate-100 pb-3 space-y-2.5">
            <div>
              <h2 class="text-sm font-bold text-slate-900 flex items-center gap-1">
                Foto Produk <span class="text-emerald-600 font-bold">*</span>
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">Unggah foto produk terbaik Anda. Foto pertama otomatis dijadikan foto utama (cover).</p>
            </div>

            <!-- Selektor Rasio Aspek (1:1 vs 4:3) -->
            <div class="flex flex-wrap items-center gap-2.5 pt-0.5">
              <span class="text-xs font-semibold text-slate-700">Rasio Aspek:</span>
              <div class="flex items-center gap-2">
                <label id="ratio-label-1-1" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${primaryState.image_aspect_ratio !== '4:3' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 font-bold ring-1 ring-emerald-500/30' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium'} text-xs cursor-pointer transition select-none">
                  <input type="radio" name="photo_aspect_ratio" value="1:1" ${primaryState.image_aspect_ratio !== '4:3' ? 'checked' : ''} class="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500">
                  <span>Foto 1:1 (Persegi)</span>
                </label>
                <label id="ratio-label-4-3" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${primaryState.image_aspect_ratio === '4:3' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 font-bold ring-1 ring-emerald-500/30' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium'} text-xs cursor-pointer transition select-none">
                  <input type="radio" name="photo_aspect_ratio" value="4:3" ${primaryState.image_aspect_ratio === '4:3' ? 'checked' : ''} class="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500">
                  <span>Foto 4:3 (Lanskap)</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <div id="file-size-error-banner" class="hidden mb-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
              <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-600 shrink-0"></i>
              <span id="file-size-error-msg">Pemberitahuan pemrosesan gambar</span>
            </div>

            <!-- Hidden Multi-file input (dipicu klik Add Slot atau dropzone) -->
            <input type="file" id="input-prod-image" accept="image/png, image/jpeg, image/webp" multiple class="hidden" />

            <!-- Shopee 9-Slot Grid Container Responsif: Mobile grid-cols-3, Tablet grid-cols-4/5, Desktop grid-cols-5 -->
            <div id="image-gallery-container" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-2.5 sm:gap-3">
              ${renderGalleryThumbnails()}
            </div>
          </div>

          <!-- Status Aktif / Tampil di Etalase -->
          <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span class="text-sm font-semibold text-slate-800 block">Tampilkan di Etalase Toko Web</span>
              <span class="text-xs text-slate-400">Jika dimatikan, produk akan disembunyikan dari pembeli namun tetap tersimpan.</span>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                id="toggle-is-active-form" 
                ${primaryState.is_active ? 'checked' : ''} 
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        <!-- KARTU 3: BAHAN & OPSI FINISHING / TOPING (DAFTAR BERTINGKAT) -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div class="border-b border-slate-100 pb-2 mb-4">
            <h2 class="text-sm font-bold text-slate-900">Pilihan Varian, Bahan &amp; Opsi Tambahan Bertingkat</h2>
            <p class="text-xs text-slate-500 mt-0.5">Pengaturan variasi produk, pilihan wajib, opsi ekstra bertingkat, serta modal HPP.</p>
          </div>

          <!-- TABEL VARIAN / BAHAN UTAMA -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold text-slate-800">Pilihan Varian &amp; Bahan Utama</h3>
                <p class="text-xs text-slate-500">Minimal 1 varian/bahan wajib diisi. Tambahkan pilihan variasi rasa, ukuran, atau spesifikasi bahan.</p>
              </div>
              <button type="button" id="btn-add-material" class="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1 transition">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i> Tambah Varian / Bahan
              </button>
            </div>

            <div class="overflow-x-auto border border-slate-200 rounded-xl">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th class="p-3 w-12 text-center">#</th>
                    <th class="p-3">Nama Varian / Bahan <span class="text-red-500">*</span></th>
                    <th class="p-3 w-40">Harga Jual (Rp) <span class="text-red-500">*</span></th>
                    ${isKombStep ? '<th class="p-3 w-32 bg-amber-50 text-amber-900">Kelipatan Order *</th>' : ''}
                    <th class="p-3 w-40" title="Modal pokok digunakan untuk kalkulasi margin laba bersih di dashboard">Biaya Modal / HPP (Rp)</th>
                    <th class="p-3 w-16 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody id="materials-table-body" class="divide-y divide-slate-100">
                  ${renderMaterialsRows(isKombStep)}
                </tbody>
              </table>
            </div>
          </div>

          <!-- OPSI UTAMA / PILIHAN WAJIB PEMBELI -->
          <div class="space-y-3 pt-4 border-t border-slate-100">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold text-slate-800">Opsi Utama / Pilihan Wajib Pembeli</h3>
                <p class="text-xs text-slate-500">Pemesan wajib memilih salah satu opsi ini (misal: 'Standar / Tanpa Finishing', 'Level Kepedasan', 'Model Lengan').</p>
              </div>
              <button type="button" id="btn-add-finishing-main" class="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1 transition">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i> Tambah Pilihan Opsi
              </button>
            </div>

            <div class="overflow-x-auto border border-slate-200 rounded-xl">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th class="p-3 w-12 text-center">#</th>
                    <th class="p-3">Nama Opsi / Finishing <span class="text-red-500">*</span></th>
                    <th class="p-3 w-40">Biaya Tambahan (Rp)</th>
                    <th class="p-3 w-40">Modal HPP Ekstra (Rp)</th>
                    <th class="p-3 w-16 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody id="finishings-main-table-body" class="divide-y divide-slate-100">
                  ${renderFinishingRows('main')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- OPSI TAMBAHAN BERTINGKAT / ADD-ONS -->
          <div class="space-y-4 pt-4 border-t border-slate-100">
            <h3 class="text-sm font-bold text-slate-800">Opsi Tambahan Bertingkat (Add-ons / Layanan Ekstra)</h3>
            <p class="text-xs text-slate-500 -mt-2">Pilihan opsional yang dapat dicentang pemesan (misal: Topping Ekstra, Kemasan Kado, Laminasi Khusus, Garansi Tambahan).</p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Tier 1 -->
              ${renderFinishingExtraCard('extra_1', 'Opsi Tambahan Tingkat 1 (Level 1)', 'Contoh: Topping Keju / Laminasi Glossy')}
              <!-- Tier 2 -->
              ${renderFinishingExtraCard('extra_2', 'Opsi Tambahan Tingkat 2 (Level 2)', 'Contoh: Kemasan Box Kado / Cutting Presisi')}
              <!-- Tier 3 -->
              ${renderFinishingExtraCard('extra_3', 'Opsi Tambahan Tingkat 3 (Level 3)', 'Contoh: Kartu Ucapan / Bubble Wrap Ekstra')}
            </div>
          </div>
        </div>

        <!-- KARTU 4: TIPE HARGA -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div class="border-b border-slate-100 pb-2 mb-4">
            <h2 class="text-sm font-bold text-slate-900">Tipe Harga (Rumus Hitung)</h2>
            <p class="text-xs text-slate-500 mt-0.5">Pilih salah satu formula perhitungan harga yang sesuai model bisnis Anda.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            ${renderPriceTypeOptions(primaryState.price_type)}
          </div>

          <!-- Informasi Formula Dinamis Berdasarkan Tipe -->
          <div id="price-type-hint-box" class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
            <i data-lucide="info" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"></i>
            <div id="price-type-hint-text">
              ${getPriceTypeHint(primaryState.price_type)}
            </div>
          </div>
        </div>

        <!-- KARTU 5: MANAJEMEN STOK & DISKON PROMO BULANAN -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div class="border-b border-slate-100 pb-2 mb-4">
            <h2 class="text-sm font-bold text-slate-900">Manajemen Stok &amp; Diskon Promo Bulanan</h2>
            <p class="text-xs text-slate-500 mt-0.5">Batas stok fisik, minimal/maksimal pesanan, serta konfigurasi promo bulanan.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Batas Stok Produk -->
            <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-sm font-semibold text-slate-800">Batas Stok Fisik Produk</label>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-slate-500">Tanpa Batas</span>
                  <input 
                    type="checkbox" 
                    id="toggle-unlimited-stock" 
                    ${primaryState.is_unlimited_stock ? 'checked' : ''} 
                    class="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                </div>
              </div>

              <div id="stock-input-wrapper" class="${primaryState.is_unlimited_stock ? 'hidden' : 'block'}">
                <label for="input-stock-qty" class="block text-xs font-medium text-slate-600 mb-1">Jumlah Stok Tersedia:</label>
                <input 
                  type="number" 
                  id="input-stock-qty" 
                  min="0"
                  value="${primaryState.stock !== null ? primaryState.stock : 0}" 
                  class="w-full px-4 py-2 rounded-lg border border-slate-300 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition outline-none"
                />
              </div>
            </div>

            <!-- Program Promo & Diskon Spesial -->
            <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <label class="text-sm font-semibold text-slate-800">Program Promo &amp; Diskon Spesial</label>
                  <span class="text-[11px] text-slate-400 block">Aktifkan diskon berkala pada produk ini.</span>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="toggle-monthly-discount" 
                    ${primaryState.has_monthly_discount ? 'checked' : ''} 
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div id="discount-controls-area" class="${primaryState.has_monthly_discount ? 'block' : 'hidden'} space-y-3 pt-3 border-t border-slate-200">
                <!-- Label Promo Custom -->
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Label Teks Promo:</label>
                  <input 
                    type="text" 
                    id="input-monthly-promo-label" 
                    value="${escapeHtml(primaryState.monthly_promo_label || 'Promo Spesial')}"
                    placeholder="Promo Spesial"
                    class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:border-emerald-500 outline-none font-semibold"
                  />
                  <span class="text-[10px] text-slate-400 block mt-0.5">Label bawaan "Promo Spesial" (dapat diubah sesuai keinginan seller).</span>
                </div>

                <!-- Dropdown [%] atau [IDR] & Nilai (Auto-Convert Interaktif) -->
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Bentuk & Nilai Potongan Diskon:</label>
                  <div class="flex items-center gap-2">
                    <select id="select-monthly-discount-type" class="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none bg-white focus:border-emerald-500">
                      <option value="percent" ${primaryState.discount_type === 'percent' ? 'selected' : ''}>[%] Persen</option>
                      <option value="nominal" ${primaryState.discount_type === 'nominal' ? 'selected' : ''}>[IDR] Rupiah</option>
                    </select>
                    <input 
                      type="number" 
                      id="input-discount-val" 
                      min="1"
                      value="${primaryState.discount_value || 0}"
                      class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-emerald-700 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <!-- Auto-Convert Info Box -->
                  <div id="discount-auto-convert-box" class="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex items-center justify-between">
                    <div class="flex items-center gap-1.5 font-medium">
                      <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-emerald-600 shrink-0"></i>
                      <span id="discount-auto-convert-text">Sistem otomatis mengonversi antara [%] dan [IDR].</span>
                    </div>
                    <span id="discount-auto-convert-badge" class="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[10px]">
                      0%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Batasan Minimal & Maksimal Pesanan -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <label for="input-min-order" class="block text-sm font-semibold text-slate-800 mb-1">
                Minimal Pemesanan (Min. Order) <span class="text-red-500">*</span>
              </label>
              <input 
                type="number" 
                id="input-min-order" 
                min="1"
                value="${primaryState.min_order || 1}" 
                class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-slate-800 text-sm transition outline-none"
              />
            </div>
            <div>
              <label for="input-max-order" class="block text-sm font-semibold text-slate-800 mb-1">
                Maksimal Pemesanan (Max. Order)
              </label>
              <input 
                type="number" 
                id="input-max-order" 
                min="1"
                value="${primaryState.max_order !== null ? primaryState.max_order : ''}" 
                placeholder="Kosongkan jika tidak ada batasan"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-slate-800 text-sm transition outline-none"
              />
            </div>
          </div>
        </div>

        <!-- KARTU 6: DESAIN / MODEL CARD PRODUK -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div class="border-b border-slate-100 pb-2 mb-4">
            <h2 class="text-sm font-bold text-slate-900">Desain / Model Kartu Produk</h2>
            <p class="text-xs text-slate-500 mt-0.5">Pilih model kartu katalog, estetika visual badge, label fitur, serta konfigurasi footer strip.</p>
          </div>

          <!-- Variasi Desain Card di Grid Katalog -->
          <div>
            <label class="block text-sm font-semibold text-slate-800 mb-2">
              Model Tampilan Card di Grid Etalase <span class="text-red-500">*</span>
            </label>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              ${Object.values(DB.CARD_VARIANTS).map(cv => {
                const isChecked = primaryState.card_variant === cv.code;
                return `
                  <label class="p-3.5 rounded-xl border ${isChecked ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition space-y-1 block">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-xs ${isChecked ? 'text-emerald-800' : 'text-slate-800'}">${cv.label}</span>
                      <input type="radio" name="card_variant_radio" value="${cv.code}" ${isChecked ? 'checked' : ''} class="text-emerald-600 focus:ring-emerald-500" />
                    </div>
                    <p class="text-[11px] text-slate-500">${cv.desc}</p>
                  </label>
                `;
              }).join('')}
            </div>

            <!-- Card Visual Config & Live Preview -->
            <div class="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <!-- Left: Controls -->
              <div class="lg:col-span-8 space-y-4">
                <!-- PILIHAN DESAIN DEFAULT ATAU BUAT DESAIN BARU -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <h3 class="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <i data-lucide="palette" class="w-4 h-4 text-emerald-600"></i>
                      <span>Kustomisasi Visual Kartu</span> <span id="label-active-card-cfg" class="text-emerald-700">(${primaryState.card_variant || 'A'})</span>
                    </h3>
                    <p class="text-[11px] text-slate-500 mt-0.5">Pilih template default bawaan atau buat desain baru kustom manual.</p>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <button type="button" id="btn-card-use-default" class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-emerald-600 text-white shadow-xs">
                      <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                      <span>Gunakan Desain Default</span>
                    </button>
                    <button type="button" id="btn-card-custom-design" class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-white text-slate-700 border border-slate-300 hover:bg-slate-100">
                      <i data-lucide="sliders" class="w-3.5 h-3.5"></i>
                      <span>Buat Desain Baru</span>
                    </button>
                  </div>
                </div>

                <!-- TOGGLE SWITCH: SIMPAN SEBAGAI DESAIN DEFAULT UNTUK MODEL INI -->
                <div class="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <div class="space-y-0.5">
                    <label for="cfg-save-as-default-toggle" class="text-xs font-bold text-emerald-950 flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" id="cfg-save-as-default-toggle" class="w-4 h-4 text-emerald-600 rounded cursor-pointer" />
                      <span>Simpan Sebagai Desain Default untuk Model Ini</span>
                    </label>
                    <p class="text-[10px] text-emerald-700">Jika dicentang, token styling (Rating, Terjual, Coret, Badge Foto Diskon, Tiket, &amp; Countdown) disimpan sebagai template default model ini.</p>
                  </div>
                </div>
                
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Latar Belakang</label>
                    <div class="flex items-center gap-2">
                      <input type="color" id="cfg-bg-color" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-bg-text" class="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Warna Border</label>
                    <div class="flex items-center gap-2">
                      <input type="color" id="cfg-border-color" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-border-text" class="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Radius Sudut</label>
                    <select id="cfg-border-radius" class="w-full px-2 py-1.5 text-xs border border-slate-200 rounded outline-none">
                      <option value="0px">0px (Kotak)</option>
                      <option value="8px">8px (Kecil)</option>
                      <option value="16px">16px (Sedang)</option>
                      <option value="24px">24px (Besar)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Teks Judul</label>
                    <div class="flex items-center gap-2">
                      <input type="color" id="cfg-title-color" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-title-text" class="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Warna Harga</label>
                    <div class="flex items-center gap-2">
                      <input type="color" id="cfg-price-color" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-price-text" class="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tombol Keranjang</label>
                    <div class="flex items-center gap-2">
                      <input type="color" id="cfg-btn-color" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-btn-text" class="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded" />
                    </div>
                  </div>
                </div>

                <!-- Toggles Tampilan Kartu -->
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
                  <label class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input type="checkbox" id="cfg-show-rating" class="w-4 h-4 text-emerald-600 rounded" /> Rating Bintang
                  </label>
                  <label class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input type="checkbox" id="cfg-show-sales" class="w-4 h-4 text-emerald-600 rounded" /> Jumlah Terjual
                  </label>
                  <label class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input type="checkbox" id="cfg-show-strike" class="w-4 h-4 text-emerald-600 rounded" /> Harga Coret
                  </label>
                  <label class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input type="checkbox" id="cfg-show-discount-badge" class="w-4 h-4 text-emerald-600 rounded" /> Badge Diskon Foto (-50%)
                  </label>
                  <label class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input type="checkbox" id="cfg-show-ticket-icon" class="w-4 h-4 text-emerald-600 rounded" /> Ikon Tiket Harga
                  </label>
                </div>

                <!-- SUB-PANEL KUSTOMISASI BADGE DISKON FOTO (-50%) -->
                <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <i data-lucide="percent" class="w-4 h-4 text-emerald-600"></i>
                      <span class="text-xs font-bold text-slate-800">
                        Kustomisasi Badge Diskon Foto (-50%)
                      </span>
                    </div>
                    <span class="text-[10px] text-slate-400 font-medium">Kustomisasi Sudut, Teks, Latar & Border Badge Foto</span>
                  </div>

                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/80">
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Radius Badge</label>
                      <select id="cfg-discount-badge-radius" class="w-full px-2 py-1.5 text-xs border border-slate-200 rounded outline-none bg-white">
                        <option value="0px">0px (Kotak)</option>
                        <option value="4px">4px (Kecil)</option>
                        <option value="6px">6px (Sedang)</option>
                        <option value="8px">8px (Melengkung)</option>
                        <option value="9999px">9999px (Pill / Bulat)</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Warna Teks</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="cfg-discount-badge-text-color" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" id="cfg-discount-badge-text-hex" class="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Latar (Background)</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="cfg-discount-badge-bg-color" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" id="cfg-discount-badge-bg-hex" class="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Line / Border</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="cfg-discount-badge-border-color" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" id="cfg-discount-badge-border-hex" class="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- SUB-PANEL KUSTOMISASI LABEL KHUSUS (TERPISAH DARI DISKON) -->
                <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <input type="checkbox" id="cfg-show-badge" class="w-4 h-4 text-emerald-600 rounded cursor-pointer" />
                      <label for="cfg-show-badge" class="text-xs font-bold text-slate-800 cursor-pointer">
                        Tampilkan Label Khusus Produk (Card 1, 2, 3)
                      </label>
                    </div>
                    <span class="text-[10px] text-slate-400 font-medium">Kustomisasi Sudut, Teks, Latar & Border Label Khusus</span>
                  </div>

                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/80">
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Radius Badge</label>
                      <select id="cfg-badge-radius" class="w-full px-2 py-1.5 text-xs border border-slate-200 rounded outline-none bg-white">
                        <option value="0px">0px (Kotak)</option>
                        <option value="4px">4px (Kecil)</option>
                        <option value="6px">6px (Sedang)</option>
                        <option value="8px">8px (Melengkung)</option>
                        <option value="9999px">9999px (Pill / Bulat)</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Warna Teks</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="cfg-badge-text-color" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" id="cfg-badge-text-hex" class="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Latar (Background)</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="cfg-badge-bg-color" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" id="cfg-badge-bg-hex" class="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Line / Border</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="cfg-badge-border-color" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" id="cfg-badge-border-hex" class="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- SUB-PANEL KUSTOMISASI LABEL COUNTDOWN DISKON -->
                <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <input type="checkbox" id="cfg-enable-countdown" class="w-4 h-4 text-emerald-600 rounded cursor-pointer" ${primaryState.enable_countdown !== false ? 'checked' : ''} />
                      <label for="cfg-enable-countdown" class="text-xs font-bold text-slate-800 cursor-pointer">
                        Aktifkan Label Countdown Diskon (Promo Spesifik)
                      </label>
                    </div>
                    <span class="text-[10px] text-slate-400 font-medium">Ikon Ticket-Percent & Kustomisasi Bentuk</span>
                  </div>
                  <p class="text-[11px] text-slate-500">
                    Otomatis aktif jika produk terkena aturan diskon produk spesifik (menggantikan label khusus). Jika dinonaktifkan atau promo bulanan, label countdown tidak dimunculkan.
                  </p>

                  <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-200/80">
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Model / Bentuk</label>
                      <select id="cfg-countdown-radius" class="w-full px-2 py-1.5 text-xs border border-slate-200 rounded outline-none bg-white">
                        <option value="9999px">Pill / Kapsul (9999px)</option>
                        <option value="8px">Melengkung (8px)</option>
                        <option value="6px">Sedang (6px)</option>
                        <option value="4px">Kecil (4px)</option>
                        <option value="0px">Kotak (0px)</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Latar (Background)</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="cfg-countdown-bg-color" value="${primaryState.countdown_bg_color || '#059669'}" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" id="cfg-countdown-bg-hex" value="${primaryState.countdown_bg_color || '#059669'}" class="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Warna Teks</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="cfg-countdown-text-color" value="${primaryState.countdown_text_color || '#ffffff'}" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" id="cfg-countdown-text-hex" value="${primaryState.countdown_text_color || '#ffffff'}" class="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Warna Ikon</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="cfg-countdown-icon-color" value="${primaryState.countdown_icon_color || '#ffffff'}" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" id="cfg-countdown-icon-hex" value="${primaryState.countdown_icon_color || '#ffffff'}" class="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Line / Border</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="cfg-countdown-border-color" value="${primaryState.countdown_border_color || '#059669'}" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" id="cfg-countdown-border-hex" value="${primaryState.countdown_border_color || '#059669'}" class="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <!-- Right: Live Preview -->
              <div class="lg:col-span-4 border-l-0 lg:border-l border-slate-100 pl-0 lg:pl-6">
                <div class="space-y-2 mb-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <i data-lucide="eye" class="w-4 h-4 text-emerald-600"></i>
                      Pratinjau Live:
                    </span>
                    <span id="label-active-card-preview" class="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                      Variasi ${primaryState.card_variant || 'A'}
                    </span>
                  </div>
                  <label class="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-[11px] font-bold text-slate-700 cursor-pointer hover:bg-emerald-50/50 transition">
                    <input type="checkbox" id="cfg-simulate-countdown-preview" class="w-3.5 h-3.5 text-emerald-600 rounded cursor-pointer" />
                    <span>⚡ Simulasikan Diskon Countdown ON</span>
                  </label>
                </div>
                <div id="product-card-preview-container" class="max-w-[240px] mx-auto">
                  <div id="card-live-preview-box">
                    <!-- Rendered dynamically -->
                  </div>
                </div>
              </div>

            </div>

            <!-- Section Label Khusus & Footer Kartu Produk -->
            <div class="mt-6 pt-6 border-t border-slate-100 space-y-6">
              
              <!-- Header Section -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <i data-lucide="tags" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-slate-800">Label Khusus & Footer Kartu Produk</h3>
                    <p class="text-[11px] text-slate-500">Aksi penambahan label fitur (Card 1, 2, 3) dan konfigurasi teks & ikon footer strip bawah (khusus Card Versi 3).</p>
                  </div>
                </div>
                <div>
                  <span id="label-active-mode-badge" class="px-3 py-1 rounded-full text-xs font-bold ${primaryState.card_variant === 'C' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-2 ring-emerald-500/20' : 'bg-slate-100 text-slate-700 border border-slate-300'}">
                    Mode Aktif: Versi ${primaryState.card_variant === 'C' ? '3 (Pendek Lanskap + Footer)' : primaryState.card_variant === 'B' ? '2 (Teks Besar Ringkas)' : '1 (Standar Persegi)'}
                  </span>
                </div>
              </div>

              <!-- BLOK A: AKSI & KONTROL LABEL KHUSUS (Card Versi 1, Versi 2 & Versi 3) -->
              <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div class="flex items-center justify-between">
                  <div class="space-y-0.5">
                    <h4 class="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <i data-lucide="tag" class="w-3.5 h-3.5 text-emerald-600"></i>
                      <span>Aksi Tambah Label Khusus Produk (Card 1, 2, & 3)</span>
                    </h4>
                    <p class="text-[11px] text-slate-500">Tampil berdampingan dengan rating bintang (★ 4.9). Maksimal 2 label terpasang pada kartu etalase.</p>
                  </div>
                  <div class="flex items-center gap-3">
                    <label class="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                      <input type="checkbox" id="cfg-show-badge-blok-a" class="w-4 h-4 text-emerald-600 rounded cursor-pointer" />
                      <span>Tampilkan di Kartu</span>
                    </label>
                    <span id="custom-labels-counter" class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                      ${(primaryState.custom_labels || []).filter(Boolean).length}/2 Label
                    </span>
                  </div>
                </div>

                <!-- Tombol Preset Label Populer (1-Klik untuk Mengisi Slot 1 atau Slot 2) -->
                <div class="space-y-1.5 pt-1">
                  <span class="text-[11px] font-semibold text-slate-500">Pilih Preset Label Populer (1-Klik untuk Mengisi Slot 1 atau 2):</span>
                  <div class="flex flex-wrap gap-1.5">
                    <button type="button" class="btn-preset-label px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer" data-label="Free Ongkir">+ Free Ongkir</button>
                    <button type="button" class="btn-preset-label px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer" data-label="Best Seller">+ Best Seller</button>
                    <button type="button" class="btn-preset-label px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer" data-label="Paling Laris">+ Paling Laris</button>
                    <button type="button" class="btn-preset-label px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer" data-label="Garansi 100%">+ Garansi 100%</button>
                    <button type="button" class="btn-preset-label px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer" data-label="Siap 1 Jam">+ Siap 1 Jam</button>
                    <button type="button" class="btn-preset-label px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer" data-label="Free Sticker">+ Free Sticker</button>
                    <button type="button" class="btn-preset-label px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer" data-label="Free Potong">+ Free Potong</button>
                    <button type="button" class="btn-preset-label px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer" data-label="Diskon Spesial">+ Diskon Spesial</button>
                  </div>
                </div>

                <!-- Input Slot Terpisah (Sinkron Otomatis dengan Datalist Riwayat) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                  <div>
                    <label for="input-custom-label-1" class="block text-[11px] font-semibold text-slate-600 mb-1">
                      Slot Label 1:
                    </label>
                    <input 
                      type="text" 
                      id="input-custom-label-1" 
                      list="custom-labels-history-list"
                      value="${escapeHtml(primaryState.custom_labels?.[0] || '')}" 
                      placeholder="Slot 1 (misal: Free Ongkir)" 
                      class="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label for="input-custom-label-2" class="block text-[11px] font-semibold text-slate-600 mb-1">
                      Slot Label 2:
                    </label>
                    <input 
                      type="text" 
                      id="input-custom-label-2" 
                      list="custom-labels-history-list"
                      value="${escapeHtml(primaryState.custom_labels?.[1] || '')}" 
                      placeholder="Slot 2 (misal: Best Seller)" 
                      class="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none bg-white font-medium"
                    />
                  </div>
                </div>
              </div>

              <!-- BLOK B: FORM INPUT DUA STRIP FOOTER KARTU (HANYA MUNCUL PADA CARD VERSI 3) -->
              <div 
                id="section-card-footer-config" 
                class="p-4 sm:p-5 rounded-2xl border transition-all ${primaryState.card_variant === 'C' ? 'border-2 border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20' : 'hidden'} space-y-5"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      <i data-lucide="panel-bottom" class="w-4 h-4"></i>
                    </div>
                    <div>
                      <h4 class="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                        <span>Konfigurasi Dua Strip Footer Kartu Produk</span>
                        <span id="badge-footer-active" class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white">
                          Khusus Card Versi 3
                        </span>
                      </h4>
                      <p class="text-[11px] text-slate-500">Card Versi 3 memiliki 2 baris footer melintang agar tinggi kartu tetap sama presisi saat diskon aktif maupun nonaktif.</p>
                    </div>
                  </div>
                </div>

                <!-- SUB-SEKSI 1: FOOTER 1 (STRIP ATAS / PROSES CEPAT) -->
                <div class="p-3.5 rounded-xl bg-white border border-slate-200 space-y-3">
                  <div class="flex items-center justify-between pb-1 border-b border-slate-100">
                    <span class="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <i data-lucide="layers" class="w-3.5 h-3.5"></i>
                      Footer 1 (Strip Atas): Jaminan Kecepatan / Garansi
                    </span>
                    <span class="text-[10px] text-slate-400">Selalu tampil di atas Footer 2</span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div class="sm:col-span-7">
                      <label for="input-card-footer-text" class="block text-xs font-semibold text-slate-700 mb-1">
                        Teks Footer 1 <span class="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        id="input-card-footer-text" 
                        list="footer-texts-history-list"
                        value="${escapeHtml(primaryState.card_footer_text || 'Proses Hanya Dalam 1Jam')}" 
                        placeholder="Contoh: Proses Hanya Dalam 1Jam" 
                        class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none bg-white font-medium"
                      />
                    </div>
                    <div class="sm:col-span-5">
                      <label for="select-card-footer-icon" class="block text-xs font-semibold text-slate-700 mb-1">
                        Saran Ikon Footer 1
                      </label>
                      <select 
                        id="select-card-footer-icon" 
                        class="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 outline-none bg-white font-medium"
                      >
                        <option value="truck" ${primaryState.footer_badge_icon === 'truck' || !primaryState.footer_badge_icon ? 'selected' : ''}>🚚 Kirim Cepat (truck)</option>
                        <option value="clock" ${primaryState.footer_badge_icon === 'clock' ? 'selected' : ''}>⏱️ Jam / Waktu (clock)</option>
                        <option value="zap" ${primaryState.footer_badge_icon === 'zap' ? 'selected' : ''}>⚡ Kilat / Express (zap)</option>
                        <option value="shield-check" ${primaryState.footer_badge_icon === 'shield-check' ? 'selected' : ''}>🛡️ Garansi Presisi (shield-check)</option>
                        <option value="sparkles" ${primaryState.footer_badge_icon === 'sparkles' ? 'selected' : ''}>✨ Kualitas HD (sparkles)</option>
                        <option value="award" ${primaryState.footer_badge_icon === 'award' ? 'selected' : ''}>🏆 Terbaik (award)</option>
                        <option value="star" ${primaryState.footer_badge_icon === 'star' ? 'selected' : ''}>⭐ Rating Unggul (star)</option>
                        <option value="check-circle" ${primaryState.footer_badge_icon === 'check-circle' ? 'selected' : ''}> Terverifikasi (check-circle)</option>
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Latar Footer 1</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="cfg-footer-bg-color" value="${primaryState.footer_bg_color || '#059669'}" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" id="cfg-footer-bg-hex" value="${primaryState.footer_bg_color || '#059669'}" class="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Warna Teks & Ikon 1</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="cfg-footer-text-color" value="${primaryState.footer_text_color || '#ffffff'}" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" id="cfg-footer-text-hex" value="${primaryState.footer_text_color || '#ffffff'}" class="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white" />
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-wrap gap-1.5 pt-1">
                    <button type="button" class="btn-preset-footer px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition cursor-pointer" data-text="Proses Hanya Dalam 1Jam" data-icon="truck">🚚 Proses Hanya Dalam 1Jam</button>
                    <button type="button" class="btn-preset-footer px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition cursor-pointer" data-text="Proses Cepat & Garansi Presisi" data-icon="shield-check">🛡️ Garansi Presisi</button>
                    <button type="button" class="btn-preset-footer px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition cursor-pointer" data-text="Selesai Kilat Express" data-icon="zap">⚡ Kilat Express</button>
                  </div>
                </div>

                <!-- SUB-SEKSI 2: FOOTER 2 (STRIP BAWAH / VARIASI PAKET & WADAH COUNTDOWN) -->
                <div class="p-3.5 rounded-xl bg-white border border-slate-200 space-y-3">
                  <div class="flex items-center justify-between pb-1 border-b border-slate-100">
                    <span class="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <i data-lucide="panel-bottom" class="w-3.5 h-3.5"></i>
                      Footer 2 (Strip Bawah): Variasi Paket / Wadah Countdown
                    </span>
                    <span class="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Otomatis Jadi Countdown saat Diskon ON</span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div class="sm:col-span-7">
                      <label for="input-card-footer-2-text" class="block text-xs font-semibold text-slate-700 mb-1">
                        Teks Footer 2 (Saat Diskon Off) <span class="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        id="input-card-footer-2-text" 
                        list="footer-texts-history-list"
                        value="${escapeHtml(primaryState.card_footer_2_text || 'Variasi Paket Tersedia/tidak tersedia')}" 
                        placeholder="Contoh: Variasi Paket Tersedia/tidak tersedia" 
                        class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none bg-white font-medium"
                      />
                    </div>
                    <div class="sm:col-span-5">
                      <label for="select-card-footer-2-icon" class="block text-xs font-semibold text-slate-700 mb-1">
                        Saran Ikon Footer 2
                      </label>
                      <select 
                        id="select-card-footer-2-icon" 
                        class="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 outline-none bg-white font-medium"
                      >
                        <option value="minus" ${primaryState.footer_2_badge_icon === 'minus' || !primaryState.footer_2_badge_icon ? 'selected' : ''}>➖ Strip / Variasi (minus)</option>
                        <option value="layers" ${primaryState.footer_2_badge_icon === 'layers' ? 'selected' : ''}>📚 Pilihan Paket (layers)</option>
                        <option value="shield-check" ${primaryState.footer_2_badge_icon === 'shield-check' ? 'selected' : ''}>🛡️ Garansi Uang Kembali (shield-check)</option>
                        <option value="check-circle" ${primaryState.footer_2_badge_icon === 'check-circle' ? 'selected' : ''}> Siap Cetak (check-circle)</option>
                        <option value="box" ${primaryState.footer_2_badge_icon === 'box' ? 'selected' : ''}>📦 Packing Aman (box)</option>
                        <option value="award" ${primaryState.footer_2_badge_icon === 'award' ? 'selected' : ''}>🏆 Best Seller (award)</option>
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Latar Footer 2 (Saat Diskon Off)</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="cfg-footer-2-bg-color" value="${primaryState.footer_2_bg_color || '#047857'}" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" id="cfg-footer-2-bg-hex" value="${primaryState.footer_2_bg_color || '#047857'}" class="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Warna Teks & Ikon 2</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="cfg-footer-2-text-color" value="${primaryState.footer_2_text_color || '#ffffff'}" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" id="cfg-footer-2-text-hex" value="${primaryState.footer_2_text_color || '#ffffff'}" class="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white" />
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-wrap gap-1.5 pt-1">
                    <button type="button" class="btn-preset-footer-2 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition cursor-pointer" data-text="Variasi Paket Tersedia/tidak tersedia" data-icon="minus">➖ Variasi Paket Tersedia/tidak tersedia</button>
                    <button type="button" class="btn-preset-footer-2 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition cursor-pointer" data-text="Garansi Cetak Uang Kembali 100%" data-icon="shield-check">🛡️ Garansi Uang Kembali</button>
                    <button type="button" class="btn-preset-footer-2 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition cursor-pointer" data-text="Koleksi Bahan Terlengkap & Presisi" data-icon="layers">📚 Bahan Terlengkap</button>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

        <!-- Datalist Riwayat Dropdown Label Khusus & Footer -->
        <datalist id="custom-labels-history-list">
          ${customLabelsHistory.map(lbl => `<option value="${escapeHtml(lbl)}"></option>`).join('')}
        </datalist>
        <datalist id="footer-texts-history-list">
          ${footerTextsHistory.map(txt => `<option value="${escapeHtml(txt)}"></option>`).join('')}
        </datalist>

        <!-- Sticky Bottom Action Bar -->
        <div class="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl p-4 flex items-center justify-between">
          <div class="text-xs text-slate-500 hidden sm:block">
            Pastikan data bahan dan formula harga sudah terisi dengan benar.
          </div>
          <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button type="button" id="btn-cancel-form-bottom" class="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
              Batal
            </button>
            <button type="button" id="btn-submit-product" class="btn-primary-brand px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-2 transition">
              <span id="btn-submit-spinner" class="hidden w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <i id="btn-submit-icon" data-lucide="check" class="w-4 h-4"></i>
              <span id="btn-submit-text">${formMode === 'edit' ? 'Perbarui Produk' : 'Simpan Produk'}</span>
            </button>
          </div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    bindFormEvents();
    updateProductCardLivePreview();
  }

  function formatIDR(num) {
    if (isNaN(num) || num === null || num === undefined) return 'Rp0';
    return 'Rp' + Math.round(num).toLocaleString('id-ID');
  }

  function updateDesignChoiceButtonsState() {
    const btnUseDef = document.getElementById('btn-card-use-default');
    const btnCustom = document.getElementById('btn-card-custom-design');
    const isDef = primaryState.use_default_card_design !== false;
    if (btnUseDef) {
      btnUseDef.className = isDef
        ? 'px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-emerald-600 text-white shadow-xs'
        : 'px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-white text-slate-700 border border-slate-300 hover:bg-slate-100';
    }
    if (btnCustom) {
      btnCustom.className = !isDef
        ? 'px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-emerald-600 text-white shadow-xs'
        : 'px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-white text-slate-700 border border-slate-300 hover:bg-slate-100';
    }
  }

  function getCardConfigFromDOM() {
    const badgeMain = document.getElementById('cfg-show-badge');
    const badgeBlokA = document.getElementById('cfg-show-badge-blok-a');
    const showBadgeVal = badgeMain ? badgeMain.checked : (badgeBlokA ? badgeBlokA.checked : true);
    const enableCountdownVal = document.getElementById('cfg-enable-countdown')?.checked !== false;

    return {
      bg_color: document.getElementById('cfg-bg-color')?.value || '#ffffff',
      border_color: document.getElementById('cfg-border-color')?.value || '#e2e8f0',
      border_radius: document.getElementById('cfg-border-radius')?.value || '16px',
      title_color: document.getElementById('cfg-title-color')?.value || '#0f172a',
      price_color: document.getElementById('cfg-price-color')?.value || '#059669',
      btn_color: document.getElementById('cfg-btn-color')?.value || '#059669',
      show_rating: document.getElementById('cfg-show-rating')?.checked !== false,
      show_sales_count: document.getElementById('cfg-show-sales')?.checked !== false,
      show_strikethrough_price: document.getElementById('cfg-show-strike')?.checked !== false,
      show_discount_badge: document.getElementById('cfg-show-discount-badge')?.checked !== false,
      show_ticket_icon: document.getElementById('cfg-show-ticket-icon')?.checked !== false,
      show_badge: showBadgeVal,
      show_category_badge: showBadgeVal,
      discount_badge_radius: document.getElementById('cfg-discount-badge-radius')?.value || '8px',
      discount_badge_text_color: document.getElementById('cfg-discount-badge-text-color')?.value || '#ffffff',
      discount_badge_bg_color: document.getElementById('cfg-discount-badge-bg-color')?.value || '#059669',
      discount_badge_border_color: document.getElementById('cfg-discount-badge-border-color')?.value || '#059669',
      badge_radius: document.getElementById('cfg-badge-radius')?.value || '6px',
      badge_text_color: document.getElementById('cfg-badge-text-color')?.value || '#047857',
      badge_bg_color: document.getElementById('cfg-badge-bg-color')?.value || '#ecfdf5',
      badge_border_color: document.getElementById('cfg-badge-border-color')?.value || '#a7f3d0',
      enable_countdown: enableCountdownVal,
      countdown_radius: document.getElementById('cfg-countdown-radius')?.value || '9999px',
      countdown_bg_color: document.getElementById('cfg-countdown-bg-color')?.value || '#059669',
      countdown_text_color: document.getElementById('cfg-countdown-text-color')?.value || '#ffffff',
      countdown_icon_color: document.getElementById('cfg-countdown-icon-color')?.value || '#ffffff',
      countdown_border_color: document.getElementById('cfg-countdown-border-color')?.value || '#059669'
    };
  }

  function loadCardConfigInputs(variantCode, forceDefault = false) {
    const sets = DB.getSettings();
    const configGroup = sets.card_variants_config || {};
    const key = variantCode === 'A' ? 'variant_a' : variantCode === 'B' ? 'variant_b' : 'variant_c';
    
    const useDefault = forceDefault || primaryState.use_default_card_design !== false;
    primaryState.use_default_card_design = useDefault;

    const defaultCfg = configGroup[key] || {};
    const cfg = (!useDefault && primaryState.card_config) ? primaryState.card_config : defaultCfg;
    
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };
    const setChk = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.checked = val === true;
    };

    setVal('cfg-bg-color', cfg.bg_color || '#ffffff');
    setVal('cfg-bg-text', cfg.bg_color || '#ffffff');
    setVal('cfg-border-color', cfg.border_color || '#e2e8f0');
    setVal('cfg-border-text', cfg.border_color || '#e2e8f0');
    setVal('cfg-border-radius', cfg.border_radius || '16px');
    setVal('cfg-title-color', cfg.title_color || '#0f172a');
    setVal('cfg-title-text', cfg.title_color || '#0f172a');
    setVal('cfg-price-color', cfg.price_color || '#059669');
    setVal('cfg-price-text', cfg.price_color || '#059669');
    setVal('cfg-btn-color', cfg.btn_color || '#059669');
    setVal('cfg-btn-text', cfg.btn_color || '#059669');
    
    setChk('cfg-show-rating', cfg.show_rating !== false);
    setChk('cfg-show-sales', cfg.show_sales !== false && cfg.show_sales_count !== false);
    setChk('cfg-show-strike', cfg.show_strikethrough_price !== false);
    setChk('cfg-show-discount-badge', cfg.show_discount_badge !== false);
    setChk('cfg-show-ticket-icon', cfg.show_ticket_icon !== false);
    const showBadgeVal = cfg.show_badge !== false && cfg.show_category_badge !== false;
    setChk('cfg-show-badge', showBadgeVal);
    setChk('cfg-show-badge-blok-a', showBadgeVal);

    // Discount badge styling tokens (pada foto produk)
    setVal('cfg-discount-badge-radius', cfg.discount_badge_radius || '8px');
    setVal('cfg-discount-badge-text-color', cfg.discount_badge_text_color || '#ffffff');
    setVal('cfg-discount-badge-text-hex', cfg.discount_badge_text_color || '#ffffff');
    setVal('cfg-discount-badge-bg-color', cfg.discount_badge_bg_color || '#059669');
    setVal('cfg-discount-badge-bg-hex', cfg.discount_badge_bg_color || '#059669');
    setVal('cfg-discount-badge-border-color', cfg.discount_badge_border_color || '#059669');
    setVal('cfg-discount-badge-border-hex', cfg.discount_badge_border_color || '#059669');

    // Badge styling tokens
    const defBadgeText = variantCode === 'B' ? '#6b21a8' : '#047857';
    const defBadgeBg = variantCode === 'B' ? '#faf5ff' : '#ecfdf5';
    const defBadgeBorder = variantCode === 'B' ? '#e9d5ff' : '#a7f3d0';

    setVal('cfg-badge-radius', cfg.badge_radius || '6px');
    setVal('cfg-badge-text-color', cfg.badge_text_color || defBadgeText);
    setVal('cfg-badge-text-hex', cfg.badge_text_color || defBadgeText);
    setVal('cfg-badge-bg-color', cfg.badge_bg_color || defBadgeBg);
    setVal('cfg-badge-bg-hex', cfg.badge_bg_color || defBadgeBg);
    setVal('cfg-badge-border-color', cfg.badge_border_color || defBadgeBorder);
    setVal('cfg-badge-border-hex', cfg.badge_border_color || defBadgeBorder);

    // Countdown styling tokens
    const cRadius = primaryState.countdown_radius || cfg.countdown_radius || '9999px';
    const cBg = primaryState.countdown_bg_color || cfg.countdown_bg_color || '#059669';
    const cTxt = primaryState.countdown_text_color || cfg.countdown_text_color || '#ffffff';
    const cIco = primaryState.countdown_icon_color || cfg.countdown_icon_color || '#ffffff';
    const cBrd = primaryState.countdown_border_color || cfg.countdown_border_color || '#059669';
    setVal('cfg-countdown-radius', cRadius);
    setVal('cfg-countdown-bg-color', cBg);
    setVal('cfg-countdown-bg-hex', cBg);
    setVal('cfg-countdown-text-color', cTxt);
    setVal('cfg-countdown-text-hex', cTxt);
    setVal('cfg-countdown-icon-color', cIco);
    setVal('cfg-countdown-icon-hex', cIco);
    setVal('cfg-countdown-border-color', cBrd);
    setVal('cfg-countdown-border-hex', cBrd);
    setChk('cfg-enable-countdown', primaryState.enable_countdown !== false && cfg.enable_countdown !== false);

    // Footer 1 styling tokens (khusus Versi C)
    const fBg = primaryState.footer_bg_color || cfg.footer_bg_color || '#059669';
    const fTxt = primaryState.footer_text_color || cfg.footer_text_color || '#ffffff';
    setVal('cfg-footer-bg-color', fBg);
    setVal('cfg-footer-bg-hex', fBg);
    setVal('cfg-footer-text-color', fTxt);
    setVal('cfg-footer-text-hex', fTxt);

    // Footer 2 styling tokens (khusus Versi C)
    const f2Bg = primaryState.footer_2_bg_color || cfg.footer_2_bg_color || '#047857';
    const f2Txt = primaryState.footer_2_text_color || cfg.footer_2_text_color || '#ffffff';
    setVal('cfg-footer-2-bg-color', f2Bg);
    setVal('cfg-footer-2-bg-hex', f2Bg);
    setVal('cfg-footer-2-text-color', f2Txt);
    setVal('cfg-footer-2-text-hex', f2Txt);

    setChk('cfg-save-as-default-toggle', false);
    updateDesignChoiceButtonsState();
  }

  function saveCardConfigInputs(forceSaveAsDefault = false) {
    const variantCode = primaryState.card_variant || 'A';
    const key = variantCode === 'A' ? 'variant_a' : variantCode === 'B' ? 'variant_b' : 'variant_c';
    const sets = DB.getSettings();
    if (!sets.card_variants_config) sets.card_variants_config = {};
    if (!sets.card_variants_config[key]) sets.card_variants_config[key] = {};

    const cfg = getCardConfigFromDOM();

    if (primaryState.use_default_card_design === false) {
      primaryState.card_config = { ...cfg };
    } else {
      delete primaryState.card_config;
    }

    const shouldSaveDefault = forceSaveAsDefault || (document.getElementById('cfg-save-as-default-toggle')?.checked === true);
    if (shouldSaveDefault) {
      sets.card_variants_config[key] = {
        ...sets.card_variants_config[key],
        ...cfg
      };
      DB.saveSettings(sets);
    }
  }

  function updateProductCardLivePreview() {
    const previewContainer = document.getElementById('card-live-preview-box') || document.getElementById('product-card-preview-container');
    if (!previewContainer) return;

    // 1. Baca data langsung dari form DOM
    const nameInput = document.getElementById('input-prod-name');
    const name = (nameInput?.value || primaryState.name || '').trim() || 'Nama Produk Percetakan';

    const catSelect = document.getElementById('select-prod-cat');
    const catId = catSelect?.value || primaryState.category_id;
    const allCats = DB.getCategories ? DB.getCategories() : [];
    const matchedCat = allCats.find(c => c.id === catId);
    const catName = matchedCat ? matchedCat.name : 'Percetakan & Cetak';

    const variantRadio = document.querySelector('input[name="card_variant_radio"]:checked');
    const variant = variantRadio ? variantRadio.value : (primaryState.card_variant || 'A');

    // Update label varian di atas box
    const badgeLabel = document.getElementById('label-active-card-preview');
    if (badgeLabel) {
      badgeLabel.textContent = variant === 'A' ? 'Versi 1: Standar Persegi' : variant === 'B' ? 'Versi 2: Teks Besar Ringkas' : 'Versi 3: Pendek Lanskap 4:3';
    }

    // 2. Hitung harga dasar dari input materials
    let basePrice = 25000;
    const priceInputs = document.querySelectorAll('#materials-table-body input[data-field="price"]');
    if (priceInputs.length > 0) {
      const prices = Array.from(priceInputs).map(inp => parseFloat(inp.value) || 0).filter(p => p > 0);
      if (prices.length > 0) basePrice = Math.min(...prices);
    } else if (materialsState && materialsState.length > 0 && materialsState[0].price > 0) {
      basePrice = materialsState[0].price;
    }

    // 3. Hitung diskon promo bulanan & simulasi
    let hasDiscount = false;
    let discPercent = 0;
    let discountedPrice = basePrice;
    const toggleDisc = document.getElementById('toggle-monthly-discount');
    const isDiscChecked = toggleDisc ? toggleDisc.checked : primaryState.has_monthly_discount;
    if (isDiscChecked) {
      const discTypeSelect = document.getElementById('select-monthly-discount-type');
      const discValInput = document.getElementById('input-discount-val');
      const dType = discTypeSelect?.value || primaryState.discount_type || 'percent';
      const dVal = parseFloat(discValInput?.value) || primaryState.discount_value || 0;
      if (dVal > 0) {
        hasDiscount = true;
        if (dType === 'percent') {
          discPercent = Math.min(99, Math.round(dVal));
          discountedPrice = Math.round(basePrice * (1 - (discPercent / 100)));
        } else {
          discPercent = Math.min(99, Math.round((dVal / basePrice) * 100));
          discountedPrice = Math.max(0, basePrice - dVal);
        }
      }
    }

    // Countdown configs & simulation toggle
    const simulateCountdown = document.getElementById('cfg-simulate-countdown-preview')?.checked === true;
    const enableCountdown = document.getElementById('cfg-enable-countdown') ? document.getElementById('cfg-enable-countdown').checked : (primaryState.enable_countdown !== false);
    
    // Status apakah countdown aktif (aktor utama daripada label khusus)
    const isCountdownActive = simulateCountdown || (enableCountdown && hasDiscount && !primaryState.is_promo_monthly_only);
    const effHasDiscount = hasDiscount || simulateCountdown;
    const effDiscPercent = (hasDiscount && discPercent > 0) ? discPercent : 50;

    // Hitung harga normal, harga coret & harga final di live preview
    let origStrikePrice = basePrice;
    let effFinalPrice = basePrice;
    if (effHasDiscount) {
      if (hasDiscount && discountedPrice < basePrice) {
        origStrikePrice = basePrice;
        effFinalPrice = discountedPrice;
      } else {
        // Mode simulasi diskon 50%: harga normal misal Rp 50.000 dicoret menjadi Rp 25.000
        if (basePrice <= 25000) {
          origStrikePrice = 50000;
          effFinalPrice = basePrice > 0 ? basePrice : 25000;
        } else {
          origStrikePrice = basePrice;
          effFinalPrice = Math.round(basePrice * 0.5);
        }
      }
    }

    // 4. Label satuan harga berdasarkan price_type
    const ptRadio = document.querySelector('input[name="price_type_radio"]:checked');
    const curPt = ptRadio ? parseInt(ptRadio.value) : (primaryState.price_type || 1);
    let unitLabel = '/ pcs';
    if (curPt === 1) unitLabel = '/ m²';
    else if (curPt === 2) unitLabel = '/ lbr';
    else if (curPt === 5) unitLabel = '/ kg';
    else if (curPt === 6) unitLabel = '/ lt';

    // 5. Gambar produk
    const img = (primaryState.images && primaryState.images.length > 0)
      ? primaryState.images[0]
      : (primaryState.image_url || 'assets/images/logo-songer-creative.png');

    // 6. Config Styling & Display Toggles
    const showBadgeInput = document.getElementById('cfg-show-badge');
    const showBadgeBlokAInput = document.getElementById('cfg-show-badge-blok-a');
    const showBadgeChecked = showBadgeInput ? showBadgeInput.checked : (showBadgeBlokAInput ? showBadgeBlokAInput.checked : true);

    const cfg = {
      bg_color: document.getElementById('cfg-bg-color')?.value || '#ffffff',
      border_color: document.getElementById('cfg-border-color')?.value || '#e2e8f0',
      border_radius: document.getElementById('cfg-border-radius')?.value || '16px',
      title_color: document.getElementById('cfg-title-color')?.value || '#0f172a',
      price_color: document.getElementById('cfg-price-color')?.value || '#059669',
      btn_color: document.getElementById('cfg-btn-color')?.value || '#059669',
      show_rating: document.getElementById('cfg-show-rating')?.checked !== false,
      show_sales: document.getElementById('cfg-show-sales')?.checked !== false,
      show_strike: document.getElementById('cfg-show-strike')?.checked !== false,
      show_discount_badge: document.getElementById('cfg-show-discount-badge')?.checked !== false,
      show_ticket_icon: document.getElementById('cfg-show-ticket-icon')?.checked !== false,
      show_badge: showBadgeChecked
    };

    const cardStyle = `background-color: ${cfg.bg_color}; border-color: ${cfg.border_color}; border-radius: ${cfg.border_radius};`;
    const titleStyle = `color: ${cfg.title_color};`;
    const priceStyle = `color: ${cfg.price_color};`;

    // Discount Badge Custom Styles (pada foto produk)
    const discBadgeRadius = document.getElementById('cfg-discount-badge-radius')?.value || '8px';
    const discBadgeTextColor = document.getElementById('cfg-discount-badge-text-color')?.value || '#ffffff';
    const discBadgeBgColor = document.getElementById('cfg-discount-badge-bg-color')?.value || '#059669';
    const discBadgeBorderColor = document.getElementById('cfg-discount-badge-border-color')?.value || discBadgeBgColor;
    const discBadgeStyle = `background-color: ${discBadgeBgColor}; color: ${discBadgeTextColor}; border: 1px solid ${discBadgeBorderColor}; border-radius: ${discBadgeRadius};`;

    // Badge Custom Styles (label khusus)
    const badgeRadius = document.getElementById('cfg-badge-radius')?.value || '6px';
    const badgeTextColor = document.getElementById('cfg-badge-text-color')?.value || (variant === 'B' ? '#6b21a8' : '#047857');
    const badgeBgColor = document.getElementById('cfg-badge-bg-color')?.value || (variant === 'B' ? '#faf5ff' : '#ecfdf5');
    const badgeBorderColor = document.getElementById('cfg-badge-border-color')?.value || (variant === 'B' ? '#e9d5ff' : '#a7f3d0');
    const badgeStyle = `color: ${badgeTextColor}; background-color: ${badgeBgColor}; border: 1px solid ${badgeBorderColor}; border-radius: ${badgeRadius};`;

    // Countdown Badge Custom Styles
    const countdownRadius = document.getElementById('cfg-countdown-radius')?.value || primaryState.countdown_radius || '9999px';
    const countdownBgColor = document.getElementById('cfg-countdown-bg-color')?.value || primaryState.countdown_bg_color || '#059669';
    const countdownTextColor = document.getElementById('cfg-countdown-text-color')?.value || primaryState.countdown_text_color || '#ffffff';
    const countdownIconColor = document.getElementById('cfg-countdown-icon-color')?.value || primaryState.countdown_icon_color || '#ffffff';
    const countdownBorderColor = document.getElementById('cfg-countdown-border-color')?.value || primaryState.countdown_border_color || '#059669';
    const countdownStyle = `background-color: ${countdownBgColor}; color: ${countdownTextColor}; border: 1px solid ${countdownBorderColor}; border-radius: ${countdownRadius};`;

    // Footer 1 Custom Styles (Khusus Card C)
    const footerBgColor = document.getElementById('cfg-footer-bg-color')?.value || primaryState.footer_bg_color || '#059669';
    const footerTextColor = document.getElementById('cfg-footer-text-color')?.value || primaryState.footer_text_color || '#ffffff';
    const footerTextInput = document.getElementById('input-card-footer-text');
    const footerText = (footerTextInput?.value || primaryState.card_footer_text || 'Proses Hanya Dalam 1Jam').trim() || 'Proses Hanya Dalam 1Jam';
    const footerIconSelect = document.getElementById('select-card-footer-icon');
    const footerIcon = (footerIconSelect?.value || primaryState.footer_badge_icon || 'truck').trim() || 'truck';

    // Footer 2 Custom Styles (Khusus Card C)
    const footer2BgColor = document.getElementById('cfg-footer-2-bg-color')?.value || primaryState.footer_2_bg_color || '#047857';
    const footer2TextColor = document.getElementById('cfg-footer-2-text-color')?.value || primaryState.footer_2_text_color || '#ffffff';
    const footer2TextInput = document.getElementById('input-card-footer-2-text');
    const footer2Text = (footer2TextInput?.value || primaryState.card_footer_2_text || 'Variasi Paket Tersedia/tidak tersedia').trim() || 'Variasi Paket Tersedia/tidak tersedia';
    const footer2IconSelect = document.getElementById('select-card-footer-2-icon');
    const footer2Icon = (footer2IconSelect?.value || primaryState.footer_2_badge_icon || 'minus').trim() || 'minus';

    // Ambil maksimal 2 label kustom bersanding dari input DOM atau state
    const label1Input = document.getElementById('input-custom-label-1');
    const label2Input = document.getElementById('input-custom-label-2');
    const customLabel1 = (label1Input ? label1Input.value : (primaryState.custom_labels?.[0] || '')).trim();
    const customLabel2 = (label2Input ? label2Input.value : (primaryState.custom_labels?.[1] || '')).trim();
    let customBadges = [customLabel1, customLabel2].filter(Boolean);

    if (customBadges.length === 0) {
      if (Array.isArray(primaryState.custom_labels) && primaryState.custom_labels.length > 0) {
        customBadges = primaryState.custom_labels.filter(Boolean);
      } else if (typeof primaryState.custom_labels === 'string' && primaryState.custom_labels.trim()) {
        customBadges = primaryState.custom_labels.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    if (customBadges.length === 0) {
      customBadges.push('Free Potong');
      customBadges.push('Free Ongkir');
    }
    customBadges = customBadges.slice(0, 2);

    // 7. Render Card Preview identik dengan wireframe etalase
    let cardHtml = '';

    if (variant === 'B') {
      // CARD PRODUK VERSI 2: MINIMALIS 1 BARIS
      cardHtml = `
        <div class="h-full flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 group relative bg-white" style="${cardStyle}">
          <!-- Image Box (1:1 Persegi) -->
          <div class="relative w-full aspect-square bg-slate-100 overflow-hidden cursor-pointer shrink-0">
            <img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" alt="${escapeHtml(name)}" onerror="this.src='assets/images/logo-songer-creative.png'" />
            ${(effHasDiscount && cfg.show_discount_badge) ? `
              <div class="absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 shadow-md uppercase tracking-wider flex items-center justify-center z-10 leading-none" style="${discBadgeStyle}">
                <span>- % ${effDiscPercent}</span>
              </div>
            ` : ''}
          </div>

          <!-- Body -->
          <div class="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2">
            <div class="space-y-1">
              <!-- Judul Wajib 1 Baris Teks Besar Tebal -->
              <h4 class="truncate text-sm sm:text-base font-bold text-slate-900 leading-tight" style="${titleStyle}" title="${escapeHtml(name)}">
                ${escapeHtml(name)}
              </h4>

              <!-- Rating Bintang Berdampingan Langsung dengan Countdown (Jika Aktif) atau Label Khusus (Jika Nonaktif) -->
              <div class="flex items-center gap-1.5 pt-0.5 flex-wrap">
                ${cfg.show_rating ? `
                  <span class="text-amber-500 font-bold text-[10px] sm:text-[11px] flex items-center gap-0.5">
                    ★ 4.9
                  </span>
                ` : ''}
                ${isCountdownActive ? `
                  <span class="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 leading-none shrink-0 shadow-2xs" style="${countdownStyle}">
                    <i data-lucide="ticket-percent" class="w-3 h-3 shrink-0" style="color: ${countdownIconColor};"></i>
                    <span>Diskon Rp1,700RB b.... 1Hari</span>
                  </span>
                ` : (cfg.show_badge ? customBadges.map(b => `
                  <span class="inline-flex items-center text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 leading-none" style="${badgeStyle}">
                    ${escapeHtml(b)}
                  </span>
                `).join('') : '')}
              </div>
            </div>

            <!-- Baris Harga: Harga Coret di Atas, Harga Final + Ikon Tiket Cek di Bawah (Hanya jika Diskon Aktif) -->
            <div class="pt-2 border-t border-slate-100 flex items-end justify-between gap-1.5 mt-auto">
              <div class="flex flex-col justify-end min-w-0">
                ${(effHasDiscount && cfg.show_strike) ? `
                  <span class="text-[10px] sm:text-[11px] line-through text-slate-400 font-normal leading-none mb-1">
                    ${formatIDR(origStrikePrice)}
                  </span>
                ` : ''}
                <div class="flex items-center gap-1 min-w-0 leading-none">
                  <span class="text-xs sm:text-sm font-extrabold whitespace-nowrap" style="${priceStyle}">
                    ${formatIDR(effFinalPrice)}
                  </span>
                  ${(effHasDiscount && cfg.show_ticket_icon) ? `
                    <i data-lucide="ticket-check" class="w-3.5 h-3.5 inline shrink-0" style="color: ${cfg.price_color};"></i>
                  ` : ''}
                </div>
              </div>
              ${cfg.show_sales ? `
                <div class="ml-auto shrink-0 text-right leading-none pb-0.5">
                  <span class="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap hidden sm:inline">
                    1RB+ terjual
                  </span>
                  <span class="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap inline sm:hidden">
                    ${(effHasDiscount && cfg.show_ticket_icon && (effFinalPrice >= 1000000 || origStrikePrice >= 1000000)) ? '1RB+ ter' : '1RB+ terjual'}
                  </span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    } else if (variant === 'C') {
      // CARD PRODUK VERSI 3: LEBIH PENDEK (LANDSCAPE 4:3 + DUA FOOTER MELINTANG)
      cardHtml = `
        <div class="h-full flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 group relative bg-white" style="${cardStyle}">
          <!-- Image Box Rasio Lanskap 4:3 Lebih Pendek -->
          <div class="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer shrink-0 rounded-t-2xl">
            <img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" alt="${escapeHtml(name)}" onerror="this.src='assets/images/logo-songer-creative.png'" />
            ${(effHasDiscount && cfg.show_discount_badge) ? `
              <div class="absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 shadow-md uppercase tracking-wider flex items-center justify-center z-10 leading-none" style="${discBadgeStyle}">
                <span>- % ${effDiscPercent}</span>
              </div>
            ` : ''}
          </div>

          <!-- Body -->
          <div class="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-2">
            <div class="space-y-1">
              <!-- Judul Maksimal 2 Baris -->
              <h4 class="line-clamp-2 text-xs sm:text-sm font-semibold h-8 sm:h-9 leading-snug" style="${titleStyle}" title="${escapeHtml(name)}">
                ${escapeHtml(name)}
              </h4>

              <!-- Rating Bintang (+ Label Khusus hanya saat diskon off) -->
              <div class="flex items-center gap-1.5 pt-0.5 flex-wrap">
                ${cfg.show_rating ? `
                  <span class="text-amber-500 font-bold text-[10px] sm:text-[11px] flex items-center gap-0.5">
                    ★ 4.9
                  </span>
                ` : ''}
                ${(!isCountdownActive && cfg.show_badge) ? customBadges.map(b => `
                  <span class="inline-flex items-center text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 leading-none" style="${badgeStyle}">
                    ${escapeHtml(b)}
                  </span>
                `).join('') : ''}
              </div>
            </div>

            <!-- Baris Harga: TANPA IKON TIKET pada Versi 3 -->
            <div class="pt-2 border-t border-slate-100 flex items-end justify-between gap-1.5 mt-auto">
              <div class="flex flex-col justify-end min-w-0">
                ${(effHasDiscount && cfg.show_strike) ? `
                  <span class="text-[10px] sm:text-[11px] line-through text-slate-400 font-normal leading-none mb-1">
                    ${formatIDR(origStrikePrice)}
                  </span>
                ` : ''}
                <div class="flex items-center gap-1 min-w-0 leading-none">
                  <span class="text-xs sm:text-sm font-extrabold whitespace-nowrap" style="${priceStyle}">
                    ${formatIDR(effFinalPrice)}
                  </span>
                </div>
              </div>
              ${cfg.show_sales ? `
                <div class="ml-auto shrink-0 text-right leading-none pb-0.5">
                  <span class="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap hidden sm:inline">
                    1RB+ terjual
                  </span>
                  <span class="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap inline sm:hidden">
                    1RB+ terjual
                  </span>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Dua Baris Strip Footer Horizontal di Bagian Bawah Kartu -->
          <div class="w-full shrink-0 mt-auto flex flex-col">
            <!-- Footer 1 (Atas): Jaminan Kecepatan / Garansi -->
            <div class="w-full text-[10px] sm:text-[11px] font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5 tracking-wide shrink-0 border-b border-black/10" style="background-color: ${footerBgColor}; color: ${footerTextColor};">
              <i data-lucide="${escapeHtml(footerIcon)}" class="w-3.5 h-3.5 shrink-0"></i>
              <span class="truncate">${escapeHtml(footerText)}</span>
            </div>

            <!-- Footer 2 (Bawah): Otomatis Jadi Countdown saat Diskon Aktif, atau Info Paket saat Diskon Off -->
            ${isCountdownActive ? `
              <div class="w-full text-[10px] sm:text-[11px] font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5 rounded-b-2xl tracking-wide shrink-0" style="background-color: ${countdownBgColor}; color: ${countdownTextColor};">
                <i data-lucide="ticket-percent" class="w-3.5 h-3.5 shrink-0" style="color: ${countdownIconColor};"></i>
                <span class="truncate">% Diskon Rp1,700RB berakhir Dalam 1Jam</span>
              </div>
            ` : `
              <div class="w-full text-[10px] sm:text-[11px] font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5 rounded-b-2xl tracking-wide shrink-0" style="background-color: ${footer2BgColor}; color: ${footer2TextColor};">
                <i data-lucide="${escapeHtml(footer2Icon)}" class="w-3.5 h-3.5 shrink-0"></i>
                <span class="truncate">${escapeHtml(footer2Text)}</span>
              </div>
            `}
          </div>
        </div>
      `;
    } else {
      // CARD PRODUK VERSI 1: STANDARD SQUARE / PORTRAIT (Variasi A)
      cardHtml = `
        <div class="h-full flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 group relative bg-white" style="${cardStyle}">
          <!-- Image Box (1:1 Persegi) -->
          <div class="relative w-full aspect-square bg-slate-100 overflow-hidden cursor-pointer shrink-0">
            <img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" alt="${escapeHtml(name)}" onerror="this.src='assets/images/logo-songer-creative.png'" />
            ${(effHasDiscount && cfg.show_discount_badge) ? `
              <div class="absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 shadow-md uppercase tracking-wider flex items-center justify-center z-10 leading-none" style="${discBadgeStyle}">
                <span>- % ${effDiscPercent}</span>
              </div>
            ` : ''}
          </div>

          <!-- Body -->
          <div class="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2">
            <div class="space-y-1">
              <!-- Judul Maksimal 2 Baris Rapih -->
              <h4 class="line-clamp-2 text-xs sm:text-sm font-semibold h-8 sm:h-9 leading-snug" style="${titleStyle}" title="${escapeHtml(name)}">
                ${escapeHtml(name)}
              </h4>

              <!-- Rating Bintang + Countdown (Jika Aktif) atau Label Khusus (Jika Nonaktif) -->
              <div class="flex items-center gap-1.5 pt-0.5 flex-wrap">
                ${cfg.show_rating ? `
                  <span class="text-amber-500 font-bold text-[10px] sm:text-[11px] flex items-center gap-0.5">
                    ★ 4.9
                  </span>
                ` : ''}
                ${isCountdownActive ? `
                  <span class="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 leading-none shrink-0 shadow-2xs" style="${countdownStyle}">
                    <i data-lucide="ticket-percent" class="w-3.5 h-3.5 shrink-0" style="color: ${countdownIconColor};"></i>
                    <span>Diskon Rp1,700RB b.... 1Hari</span>
                  </span>
                ` : (cfg.show_badge ? customBadges.map(b => `
                  <span class="inline-flex items-center text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 leading-none" style="${badgeStyle}">
                    ${escapeHtml(b)}
                  </span>
                `).join('') : '')}
              </div>
            </div>

            <!-- Baris Harga: Harga Coret di Atas, Harga Final + Ikon Tiket Cek di Bawah (Hanya jika Diskon Aktif) -->
            <div class="pt-2 border-t border-slate-100 flex items-end justify-between gap-1.5 mt-auto">
              <div class="flex flex-col justify-end min-w-0">
                ${(effHasDiscount && cfg.show_strike) ? `
                  <span class="text-[10px] sm:text-[11px] line-through text-slate-400 font-normal leading-none mb-1">
                    ${formatIDR(origStrikePrice)}
                  </span>
                ` : ''}
                <div class="flex items-center gap-1 min-w-0 leading-none">
                  <span class="text-xs sm:text-sm font-extrabold whitespace-nowrap" style="${priceStyle}">
                    ${formatIDR(effFinalPrice)}
                  </span>
                  ${(effHasDiscount && cfg.show_ticket_icon) ? `
                    <i data-lucide="ticket-check" class="w-3.5 h-3.5 inline shrink-0" style="color: ${cfg.price_color};"></i>
                  ` : ''}
                </div>
              </div>
              ${cfg.show_sales ? `
                <div class="ml-auto shrink-0 text-right leading-none pb-0.5">
                  <span class="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap hidden sm:inline">
                    1RB+ terjual
                  </span>
                  <span class="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap inline sm:hidden">
                    ${(effHasDiscount && cfg.show_ticket_icon && (effFinalPrice >= 1000000 || origStrikePrice >= 1000000)) ? '1RB+ ter' : '1RB+ terjual'}
                  </span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }


    previewContainer.innerHTML = cardHtml;
    if (window.lucide) window.lucide.createIcons();
  }

  function renderGalleryThumbnails() {
    const images = Array.isArray(primaryState.images) ? primaryState.images : [];
    const isLandscape = primaryState.image_aspect_ratio === '4:3';
    const aspectClass = isLandscape ? 'aspect-[4/3]' : 'aspect-square';

    let html = '';

    images.slice(0, 9).forEach((imgSrc, idx) => {
      const isMain = idx === 0;
      const slotNum = idx + 1;
      const canMoveLeft = idx > 0;
      const canMoveRight = idx < images.length - 1;

      html += `
        <div class="relative ${aspectClass} rounded-2xl ${isMain ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/20' : 'border border-slate-200 hover:border-slate-300'} bg-slate-100 overflow-hidden group shadow-2xs select-none transition-all duration-200" data-index="${idx}">
          <!-- Gambar Slot -->
          <img src="${imgSrc}" class="w-full h-full object-cover select-none" alt="Foto ${slotNum}" loading="lazy" />

          <!-- Top Bar: Badge Cover / Counter & Tombol Hapus -->
          <div class="absolute top-1.5 inset-x-1.5 flex items-center justify-between pointer-events-none z-10">
            ${isMain ? `
              <span class="pointer-events-auto bg-emerald-600 text-white text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-md shadow flex items-center gap-1 tracking-tight">
                <i data-lucide="star" class="w-2.5 h-2.5 fill-white"></i> Foto Utama
              </span>
            ` : `
              <span class="pointer-events-auto bg-slate-900/80 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow font-mono">
                ${slotNum}/9
              </span>
            `}

            <!-- Tombol Hapus (Target Sentuh Nyaman min 28-32px) -->
            <button type="button" class="btn-delete-gallery-img pointer-events-auto w-7 h-7 flex items-center justify-center rounded-lg bg-black/60 hover:bg-red-600 active:bg-red-700 text-white backdrop-blur-xs transition shadow cursor-pointer ml-auto" data-idx="${idx}" title="Hapus foto ini">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <!-- Bottom Bar: Overlay Navigasi Slide & Jadikan Cover -->
          <div class="absolute bottom-0 inset-x-0 pt-6 pb-1.5 px-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between gap-1 z-10 sm:opacity-90 sm:group-hover:opacity-100 transition-opacity">
            <!-- Geser Kiri -->
            ${canMoveLeft ? `
              <button type="button" class="btn-move-left-image w-6 h-6 sm:w-6.5 sm:h-6.5 flex items-center justify-center rounded-md bg-white/20 hover:bg-white text-white hover:text-slate-900 backdrop-blur-xs transition cursor-pointer shrink-0" data-idx="${idx}" title="Geser ke kiri (urutan sebelumnya)">
                <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
              </button>
            ` : `
              <div class="w-6 shrink-0"></div>
            `}

            <!-- Tombol Jadikan Cover (Jika Bukan Foto #1) -->
            ${!isMain ? `
              <button type="button" class="btn-set-main-image flex-1 bg-white/95 hover:bg-emerald-500 text-slate-800 hover:text-white active:scale-95 text-[9px] sm:text-[10px] font-bold py-1 px-1 rounded-md shadow transition text-center truncate flex items-center justify-center gap-1 cursor-pointer" data-idx="${idx}" title="Jadikan foto ini sebagai Foto Utama / Cover">
                <i data-lucide="check" class="w-3 h-3 shrink-0"></i>
                <span class="truncate">Cover</span>
              </button>
            ` : `
              <span class="text-[9px] font-bold text-white/90 uppercase tracking-widest text-center truncate">1/9</span>
            `}

            <!-- Geser Kanan -->
            ${canMoveRight ? `
              <button type="button" class="btn-move-right-image w-6 h-6 sm:w-6.5 sm:h-6.5 flex items-center justify-center rounded-md bg-white/20 hover:bg-white text-white hover:text-slate-900 backdrop-blur-xs transition cursor-pointer shrink-0" data-idx="${idx}" title="Geser ke kanan (urutan berikutnya)">
                <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
              </button>
            ` : `
              <div class="w-6 shrink-0"></div>
            `}
          </div>
        </div>
      `;
    });

    // Kotak Slot Terakhir (Jika foto < 9): Menjadi tombol tambah / dropzone
    if (images.length < 9) {
      const isFirstSlot = images.length === 0;

      html += `
        <div id="btn-slot-add-photo" class="relative ${aspectClass} rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 bg-slate-50/70 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group text-center p-2.5 select-none shadow-2xs" title="Unggah foto produk baru (${images.length}/9)">
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white group-hover:bg-emerald-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-700 shadow-xs mb-1 transition-transform group-hover:scale-110">
            <i data-lucide="camera" class="w-4 h-4 sm:w-5 sm:h-5"></i>
          </div>
          <span class="text-xs font-bold text-slate-700 group-hover:text-emerald-800 transition leading-tight">
            ${isFirstSlot ? '+ Foto Utama' : '+ Tambah Foto'}
          </span>
          <span class="text-[10px] font-semibold text-slate-400 group-hover:text-emerald-600 transition font-mono mt-0.5">
            (${images.length}/9)
          </span>
        </div>
      `;
    }

    return html;
  }

  function renderPriceTypeOptions(selectedId) {
    return Object.values(DB.PRICE_TYPES).map(pt => {
      const isChecked = selectedId === pt.id;
      return `
        <label class="p-3 rounded-xl border ${isChecked ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20 shadow-xs' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition space-y-1 block">
          <div class="flex items-center justify-between">
            <span class="font-bold text-xs ${isChecked ? 'text-emerald-800' : 'text-slate-800'}">${pt.label}</span>
            <input 
              type="radio" 
              name="price_type_radio" 
              value="${pt.id}" 
              ${isChecked ? 'checked' : ''} 
              class="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
            />
          </div>
          <span class="text-[11px] text-slate-500 line-clamp-2">${pt.desc}</span>
        </label>
      `;
    }).join('');
  }

  function getPriceTypeHint(ptId) {
    switch (ptId) {
      case 1: return 'Tipe 1 (Meter): Luas dihitung (Panjang cm x Lebar cm) / 10000. Jika luas < 1 m², otomatis dihitung minimal 1 m². Finishing slongsong +18cm.';
      case 2: return 'Tipe 2 (KombF): Menghitung per lembar/pcs dengan menjumlahkan Harga Bahan + Finishing Utama + Finishing Tambahan.';
      case 3: return 'Tipe 3 (Fixed): Harga flat per unit item.';
      case 4: return 'Tipe 4 (Paket): Harga dasar paket bundling komplit dikurangi diskon promo.';
      case 5: return 'Tipe 5 (Kg): Harga jual dihitung berdasarkan bobot berat kilogram.';
      case 6: return 'Tipe 6 (Lt): Harga jual dihitung berdasarkan volume liter.';
      case 7: return 'Tipe 7 (KombStep): Wajib memenuhi batas kelipatan order! Kolom "Kelipatan" di tabel bahan otomatis aktif untuk mengatur step kelipatan.';
      default: return '';
    }
  }

  function renderMaterialsRows(isKombStep) {
    return materialsState.map((mat, idx) => {
      return `
        <tr class="hover:bg-slate-50 transition" data-id="${mat.id}">
          <td class="p-3 text-center font-medium text-slate-400">${idx + 1}</td>
          <td class="p-3">
            <input 
              type="text" 
              data-field="name" 
              value="${escapeHtml(mat.name)}"
              placeholder="Contoh: Fleksi China / Stiker Vinyl" 
              class="mat-input w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-emerald-500 text-xs outline-none"
            />
          </td>
          <td class="p-3">
            <input 
              type="number" 
              data-field="price" 
              min="0"
              value="${mat.price}" 
              class="mat-input w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-emerald-500 text-xs outline-none"
            />
          </td>
          ${isKombStep ? `
            <td class="p-3 bg-amber-50/50 border-x border-amber-200">
              <input 
                type="number" 
                data-field="step_multiplier" 
                min="1"
                value="${mat.step_multiplier || 1}" 
                title="Kelipatan wajib pemesanan bahan ini"
                class="mat-input w-full px-2.5 py-1.5 rounded-lg border border-amber-300 font-bold text-amber-900 focus:border-amber-500 text-xs outline-none"
              />
            </td>
          ` : ''}
          <td class="p-3">
            <input 
              type="number" 
              data-field="cost_price" 
              min="0"
              value="${mat.cost_price}" 
              placeholder="HPP Modal"
              class="mat-input w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-emerald-500 text-xs outline-none"
            />
          </td>
          <td class="p-3 text-center">
            <button 
              type="button" 
              class="btn-delete-mat text-slate-400 hover:text-red-600 transition p-1 disabled:opacity-30 disabled:hover:text-slate-400"
              ${materialsState.length <= 1 ? 'disabled title="Minimal harus ada 1 bahan"' : 'title="Hapus Bahan"'}
            >
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderFinishingRows(tier) {
    const list = finishingsState[tier] || [];
    return list.map((fin, idx) => {
      return `
        <tr class="hover:bg-slate-50 transition" data-tier="${tier}" data-id="${fin.id}">
          <td class="p-3 text-center font-medium text-slate-400">${idx + 1}</td>
          <td class="p-3">
            <input 
              type="text" 
              data-field="name" 
              value="${escapeHtml(fin.name)}"
              placeholder="Contoh: Mata Ayam / Potong Kisscut" 
              class="fin-input w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-emerald-500 text-xs outline-none"
            />
          </td>
          <td class="p-3">
            <input 
              type="number" 
              data-field="price" 
              min="0"
              value="${fin.price}" 
              class="fin-input w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-emerald-500 text-xs outline-none"
            />
          </td>
          <td class="p-3">
            <input 
              type="number" 
              data-field="cost_price" 
              min="0"
              value="${fin.cost_price}" 
              placeholder="HPP Modal"
              class="fin-input w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-emerald-500 text-xs outline-none"
            />
          </td>
          <td class="p-3 text-center">
            <button 
              type="button" 
              class="btn-delete-fin text-slate-400 hover:text-red-600 transition p-1 ${tier === 'main' && list.length <= 1 ? 'disabled:opacity-30' : ''}"
              data-tier="${tier}"
              title="Hapus Finishing"
            >
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderFinishingExtraCard(tier, title, placeholderDesc) {
    const list = finishingsState[tier] || [];
    return `
      <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-xs font-bold text-slate-800">${title}</h4>
            <span class="text-[10px] text-slate-400 block">${placeholderDesc}</span>
          </div>
          <button type="button" class="btn-add-extra-fin px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 transition" data-tier="${tier}">
            + Tambah
          </button>
        </div>

        <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
          ${list.length === 0 ? `
            <div class="text-center py-4 text-slate-400 text-[11px] border border-dashed border-slate-200 rounded-lg">
              Belum ada opsi ditambahkan.
            </div>
          ` : list.map(item => `
            <div class="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1.5" data-tier="${tier}" data-id="${item.id}">
              <div class="flex items-center justify-between">
                <input 
                  type="text" 
                  data-field="name" 
                  value="${escapeHtml(item.name)}" 
                  placeholder="Nama Opsi" 
                  class="font-semibold text-xs text-slate-800 border-b border-transparent focus:border-emerald-500 outline-none w-full"
                />
                <button type="button" class="btn-delete-fin text-slate-300 hover:text-red-600 p-0.5 ml-2" data-tier="${tier}">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              </div>
              <div class="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span class="text-[10px] text-slate-400 block">Jual (+Rp):</span>
                  <input type="number" data-field="price" min="0" value="${item.price}" class="w-full px-1.5 py-1 rounded border border-slate-200 text-xs outline-none" />
                </div>
                <div>
                  <span class="text-[10px] text-slate-400 block">Modal HPP:</span>
                  <input type="number" data-field="cost_price" min="0" value="${item.cost_price}" class="w-full px-1.5 py-1 rounded border border-slate-200 text-xs outline-none" />
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Mengompres berkas gambar menggunakan HTML5 Canvas
   * Menghasilkan string Base64 ringan (rata-rata 70-160 KB) dengan rasio aspek terjaga
   */
  async function compressProductImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
    if (typeof window !== 'undefined' && typeof window.autoCompressImage === 'function') {
      return window.autoCompressImage(file, maxWidth, maxHeight, quality);
    }
    if (typeof DB !== 'undefined' && typeof DB.autoCompressImage === 'function') {
      return DB.autoCompressImage(file, maxWidth, maxHeight, quality);
    }
    return new Promise((resolve, reject) => {
      if (!file || !file.type || !file.type.startsWith('image/')) {
        return reject(new Error('Format berkas bukan merupakan gambar yang didukung'));
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Gagal membaca data berkas gambar'));
      reader.onload = ev => {
        const img = new Image();
        img.onerror = () => reject(new Error('Gagal menginisialisasi objek gambar'));
        img.onload = () => {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          // Turunkan skala jika melebihi batas resolusi maksimum, pertahankan rasio aspek
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          // Inisialisasi elemen Canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          // Rendering berkualitas tinggi
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Ekspor ke format WebP dengan fallback ke JPEG
          let dataUrl = '';
          try {
            dataUrl = canvas.toDataURL('image/webp', quality);
            if (!dataUrl || !dataUrl.startsWith('data:image/webp')) {
              dataUrl = canvas.toDataURL('image/jpeg', quality);
            }
          } catch (e) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          resolve(dataUrl);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Modul generator deskripsi produk interaktif berbasis konteks formulir
   */
  async function generateAIDescription(context) {
    const { name, categoryName, subCategoryName, materials } = context;

    // Simulasi delay pemrosesan AI (600ms) untuk responsivitas visual yang mulus
    await new Promise(resolve => setTimeout(resolve, 600));

    const catBadge = subCategoryName ? `${categoryName} > ${subCategoryName}` : (categoryName || 'Katalog Pilihan');

    // Rangkum daftar bahan dari repeater
    let matsText = 'Material pilihan berkualitas tinggi dengan durabilitas prima';
    if (Array.isArray(materials) && materials.length > 0) {
      const validNames = materials.map(m => m.name).filter(Boolean);
      if (validNames.length > 0) {
        matsText = validNames.join(', ');
      }
    }

    return `✨ ${name} — Kualitas Terbaik & Desain Profesional

Hadirkan solusi terbaik untuk kebutuhan Anda dengan ${name}. Dikerjakan dengan teliti dan presisi tinggi menggunakan standar industri modern, produk ini dirancang untuk memberikan performa maksimal, estetika memikat, dan daya tahan optimal.

📋 SPESIFIKASI PRODUK:
• Kategori: ${catBadge}
• Pilihan Varian / Bahan: ${matsText}
• Standar Pengerjaan: Rapi, presisi, dan melalui tahap inspeksi kualitas (Quality Control) teliti sebelum dikemas.

💡 KEUNGGULAN PRODUK:
✔ Material pilihan berkualitas unggul, kuat, dan awet untuk pemakaian jangka panjang
✔ Hasil visual tajam, warna solid, dan detail rapi sesuai ekspektasi
✔ Fleksibel untuk berbagai keperluan personal, operasional bisnis, maupun promosi komersial
✔ Harga transparan dengan jaminan kepuasan pelanggan

📦 PANDUAN & KETENTUAN PEMESANAN:
1. Pastikan memilih varian bahan dan opsi finishing yang tepat sebelum melakukan checkout pesanan.
2. Setiap pesanan diproses secara higienis, aman, dan dikemas dengan proteksi terbaik agar sampai dalam kondisi sempurna.
3. Memerlukan konsultasi khusus atau pesanan dalam kuantitas besar? Hubungi layanan pelanggan kami melalui fitur chat yang tersedia.`;
  }

  function bindFormEvents() {
    // Back & Cancel
    const backBtn = document.getElementById('btn-back-to-list');
    const cancelBtn = document.getElementById('btn-cancel-form');
    const cancelBottom = document.getElementById('btn-cancel-form-bottom');

    [backBtn, cancelBtn, cancelBottom].forEach(b => {
      if (b) {
        b.addEventListener('click', () => {
          if (confirm('Tinggalkan formulir? Perubahan yang belum disimpan akan hilang.')) {
            App.navigate('list');
          }
        });
      }
    });

    // Poin A: Name
    const nameInput = document.getElementById('input-prod-name');
    const charCounter = document.getElementById('name-char-count');
    if (nameInput) {
      charCounter.textContent = `${nameInput.value.length} / 150`;
      nameInput.addEventListener('input', e => {
        primaryState.name = e.target.value;
        charCounter.textContent = `${e.target.value.length} / 150`;
        updateProductCardLivePreview();
      });
    }

    // Description & Interactive AI Generator
    const descInput = document.getElementById('input-prod-desc');
    if (descInput) {
      descInput.addEventListener('input', e => {
        primaryState.description = e.target.value;
      });
    }

    const btnAiGen = document.getElementById('btn-ai-generate-desc');
    const aiPreviewBox = document.getElementById('ai-description-preview-box');
    const aiPreviewText = document.getElementById('ai-description-preview-text');
    const btnAiApply = document.getElementById('btn-ai-desc-apply');
    const btnAiCancel = document.getElementById('btn-ai-desc-cancel');

    let currentGeneratedAIText = '';

    if (btnAiGen) {
      btnAiGen.addEventListener('click', async () => {
        const nameInput = document.getElementById('input-prod-name');
        const prodName = (nameInput ? nameInput.value : primaryState.name || '').trim();

        if (!prodName) {
          if (typeof App !== 'undefined' && App.showToast) {
            App.showToast('Silakan isi Judul / Nama Produk terlebih dahulu!', 'warning');
          } else {
            alert('Silakan isi Judul / Nama Produk terlebih dahulu!');
          }
          if (nameInput) nameInput.focus();
          return;
        }

        const catSelect = document.getElementById('select-prod-cat');
        const subCatSelect = document.getElementById('select-prod-sub-cat');
        const catId = catSelect ? catSelect.value : primaryState.category_id;

        const allCats = (typeof DB !== 'undefined' && DB.getCategories) ? DB.getCategories() : [];
        const matchedCat = allCats.find(c => c && String(c.id) === String(catId));
        const categoryName = matchedCat ? matchedCat.name : (catSelect?.options[catSelect.selectedIndex]?.text || '');

        let subCategoryName = '';
        if (subCatSelect && subCatSelect.selectedIndex > 0) {
          subCategoryName = subCatSelect.options[subCatSelect.selectedIndex].text;
        }

        btnAiGen.disabled = true;
        btnAiGen.classList.add('opacity-75', 'cursor-not-allowed');
        const originalBtnHTML = btnAiGen.innerHTML;
        btnAiGen.innerHTML = `
          <svg class="animate-spin w-3.5 h-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Sedang Merangkai Deskripsi...</span>
        `;

        try {
          const generated = await generateAIDescription({
            name: prodName,
            categoryName: categoryName || 'Katalog Produk',
            subCategoryName: subCategoryName,
            materials: materialsState
          });

          currentGeneratedAIText = generated;

          if (aiPreviewText && aiPreviewBox) {
            aiPreviewText.textContent = generated;
            aiPreviewBox.classList.remove('hidden');
            if (window.lucide) window.lucide.createIcons();
            aiPreviewBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }

          if (typeof App !== 'undefined' && App.showToast) {
            App.showToast('Deskripsi AI berhasil dirangkai! Silakan tinjau pratinjau di bawah.', 'success');
          }
        } catch (err) {
          console.error('[ProductForm] Gagal merangkai deskripsi AI:', err);
          if (typeof App !== 'undefined' && App.showToast) {
            App.showToast('Gagal merangkai deskripsi AI.', 'error');
          }
        } finally {
          btnAiGen.disabled = false;
          btnAiGen.classList.remove('opacity-75', 'cursor-not-allowed');
          btnAiGen.innerHTML = originalBtnHTML;
          if (window.lucide) window.lucide.createIcons();
        }
      });
    }

    if (btnAiApply) {
      btnAiApply.addEventListener('click', () => {
        if (!currentGeneratedAIText) return;

        if (descInput) {
          descInput.value = currentGeneratedAIText;
        }
        primaryState.description = currentGeneratedAIText;

        if (aiPreviewBox) {
          aiPreviewBox.classList.add('hidden');
        }

        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast('Deskripsi AI berhasil diterapkan ke formulir!', 'success');
        }
      });
    }

    if (btnAiCancel) {
      btnAiCancel.addEventListener('click', () => {
        if (aiPreviewBox) {
          aiPreviewBox.classList.add('hidden');
        }
        if (aiPreviewText) {
          aiPreviewText.textContent = '';
        }
        currentGeneratedAIText = '';
      });
    }

    // Helper: Penentuan Otomatis Model Kartu Berdasarkan Kategori Produk
    function getSuggestedCardVariantForCategory(categoryId) {
      if (!categoryId) return 'A';
      const categories = (typeof DB !== 'undefined' && DB.getCategories) ? DB.getCategories() : [];
      const cat = categories.find(c => String(c.id) === String(categoryId));
      if (!cat) return 'A';

      const text = `${cat.name || ''} ${cat.slug || ''} ${cat.description || ''}`.toLowerCase();

      // 1. Ritel, Fashion, Merchandise, Kuliner/F&B -> Model 3 ('C')
      const model3Keywords = ['ritel', 'retail', 'fashion', 'baju', 'kaos', 'pakaian', 'distro', 'hijab', 'merchandise', 'souvenir', 'kuliner', 'fnb', 'makanan', 'minuman', 'snack', 'kue', 'bakery', 'roti', 'kopi', 'coffee', 'mug', 'ganci'];
      if (model3Keywords.some(k => text.includes(k))) {
        return 'C';
      }

      // 2. Jasa, Layanan Profesional, Desain -> Model 2 ('B')
      const model2Keywords = ['jasa', 'layanan', 'desain', 'design', 'profesional', 'service', 'branding', 'logo', 'kursus', 'konsultasi'];
      if (model2Keywords.some(k => text.includes(k))) {
        return 'B';
      }

      // 3. Fisik Reguler, Cetak Dimensi (PxL) / Default -> Model 1 ('A')
      return 'A';
    }

    function applyCardVariant(variantCode, isManual = false) {
      primaryState.card_variant = variantCode;
      if (isManual) {
        primaryState.card_variant_manual_override = true;
      }

      const parentLabels = document.querySelectorAll('input[name="card_variant_radio"]');
      parentLabels.forEach(rad => {
        rad.checked = (rad.value === variantCode);
        const labelWrapper = rad.closest('label');
        if (labelWrapper) {
          if (rad.checked) {
            labelWrapper.className = 'p-3.5 rounded-xl border border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20 cursor-pointer transition space-y-1 block';
          } else {
            labelWrapper.className = 'p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition space-y-1 block';
          }
          const textSpan = labelWrapper.querySelector('span');
          if (textSpan) {
            textSpan.className = `font-bold text-xs ${rad.checked ? 'text-emerald-800' : 'text-slate-800'}`;
          }
        }
      });

      const badgeLabel = document.getElementById('label-active-card-preview');
      if (badgeLabel) badgeLabel.textContent = `Card Model ${variantCode === 'A' ? '1' : (variantCode === 'B' ? '2' : '3')}`;
      const cfgLabel = document.getElementById('label-active-card-cfg');
      if (cfgLabel) cfgLabel.textContent = `(Model ${variantCode === 'A' ? '1' : (variantCode === 'B' ? '2' : '3')})`;

      // Update Active Mode Badge
      const activeModeBadge = document.getElementById('label-active-mode-badge');
      if (activeModeBadge) {
        const map = {
          'A': '1: Modern Standard (Rasio 1:1)',
          'B': '2: Minimalis Bold (Teks Tebal 1 Baris)',
          'C': '3: Showcase Estetik (Rasio 4:3 + Footer)'
        };
        activeModeBadge.textContent = `Model Aktif: Model ${map[variantCode] || variantCode}`;
        activeModeBadge.className = `px-3 py-1 rounded-full text-xs font-bold ${variantCode === 'C' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-2 ring-emerald-500/20' : 'bg-slate-100 text-slate-700 border border-slate-300'}`;
      }

      // Toggle Footer Section Visibility (Khusus Card Model 3 / C)
      const footerSection = document.getElementById('section-card-footer-config');
      const footerBadge = document.getElementById('badge-footer-active');
      if (footerSection) {
        if (variantCode === 'C') {
          footerSection.className = 'p-4 sm:p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20 space-y-4 transition-all';
          if (footerBadge) {
            footerBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white';
            footerBadge.textContent = 'Khusus Model 3';
          }
        } else {
          footerSection.className = 'p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4 transition-all hidden';
          if (footerBadge) {
            footerBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-200 text-slate-600';
            footerBadge.textContent = 'Khusus Model 3';
          }
        }
      }

      // Auto-sinkronisasi rasio aspek foto sesuai Model Kartu:
      // Model 3 (Showcase 4:3) -> '4:3', Model 1 & 2 -> '1:1'
      const autoRatio = (variantCode === 'C') ? '4:3' : '1:1';
      setPhotoAspectRatio(autoRatio, false);

      loadCardConfigInputs(variantCode);
      updateProductCardLivePreview();
    }

    // Category Select Listener
    const catSelect = document.getElementById('select-prod-cat');
    const subCatSelect = document.getElementById('select-prod-sub-cat');

    if (catSelect) {
      catSelect.addEventListener('change', e => {
        primaryState.category_id = e.target.value || null;
        primaryState.sub_category_id = null;

        if (subCatSelect) {
          const subs = primaryState.category_id ? DB.getSubCategories(primaryState.category_id) : [];
          subCatSelect.innerHTML = `
            <option value="">-- Tanpa Sub-Kategori (Umum) --</option>
            ${subs.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}
          `;
        }

        // Otomatis tentukan default model kartu jika belum di-override manual oleh merchant
        if (!primaryState.card_variant_manual_override && primaryState.category_id) {
          const suggestedVariant = getSuggestedCardVariantForCategory(primaryState.category_id);
          applyCardVariant(suggestedVariant, false);
        } else {
          updateProductCardLivePreview();
        }
      });
    }

    if (subCatSelect) {
      subCatSelect.addEventListener('change', e => {
        primaryState.sub_category_id = e.target.value || null;
        updateProductCardLivePreview();
      });
    }

    // Quick Add Category CTA Button
    const btnQuickAddCat = document.getElementById('btn-quick-add-category');
    if (btnQuickAddCat) {
      btnQuickAddCat.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.AdminApp && typeof window.AdminApp.navigate === 'function') {
          window.AdminApp.navigate('categories');
        } else {
          document.getElementById('admin-nav-categories')?.click();
        }
      });
    }

    // Material Price and Name live listeners for live card preview
    document.querySelectorAll('#materials-table-body input[data-field="price"]').forEach(inp => {
      inp.addEventListener('input', () => {
        syncStateFromDOM();
        updateProductCardLivePreview();
      });
    });
    document.querySelectorAll('#materials-table-body input[data-field="name"]').forEach(inp => {
      inp.addEventListener('input', () => {
        syncStateFromDOM();
        updateProductCardLivePreview();
      });
    });

    // Card Variant Radios
    document.querySelectorAll('input[name="card_variant_radio"]').forEach(r => {
      r.addEventListener('change', e => {
        applyCardVariant(e.target.value, true);
      });
    });

    // Card Config Listeners
    const cfgInputs = ['bg', 'border', 'title', 'price', 'btn'].flatMap(prefix => [`cfg-${prefix}-color`, `cfg-${prefix}-text`]);
    cfgInputs.push('cfg-border-radius');
    cfgInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', (e) => {
          if (id.endsWith('-color')) {
            const textId = id.replace('-color', '-text');
            const textEl = document.getElementById(textId);
            if (textEl) textEl.value = e.target.value;
          } else if (id.endsWith('-text')) {
            const colorId = id.replace('-text', '-color');
            const colorEl = document.getElementById(colorId);
            if (colorEl) colorEl.value = e.target.value;
          }
          saveCardConfigInputs();
          updateProductCardLivePreview();
        });
      }
    });

    // Badge, Discount Badge, Countdown & Footer Styling Color Pickers & Hex Inputs
    [
      'discount-badge-text', 'discount-badge-bg', 'discount-badge-border',
      'badge-text', 'badge-bg', 'badge-border',
      'countdown-bg', 'countdown-text', 'countdown-icon', 'countdown-border',
      'footer-bg', 'footer-text', 'footer-2-bg', 'footer-2-text'
    ].forEach(prefix => {
      const colEl = document.getElementById(`cfg-${prefix}-color`);
      const hexEl = document.getElementById(`cfg-${prefix}-hex`);
      if (colEl && hexEl) {
        colEl.addEventListener('input', (e) => {
          hexEl.value = e.target.value;
          saveCardConfigInputs();
          updateProductCardLivePreview();
        });
        hexEl.addEventListener('input', (e) => {
          colEl.value = e.target.value;
          saveCardConfigInputs();
          updateProductCardLivePreview();
        });
      }
    });

    ['cfg-badge-radius', 'cfg-discount-badge-radius', 'cfg-countdown-radius'].forEach(selId => {
      const el = document.getElementById(selId);
      if (el) {
        el.addEventListener('change', () => {
          saveCardConfigInputs();
          updateProductCardLivePreview();
        });
      }
    });

    ['cfg-show-rating', 'cfg-show-sales', 'cfg-show-strike', 'cfg-show-discount-badge', 'cfg-show-ticket-icon', 'cfg-show-badge', 'cfg-show-badge-blok-a'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        ['change', 'click'].forEach(evt => {
          el.addEventListener(evt, (e) => {
            if (id === 'cfg-show-badge' || id === 'cfg-show-badge-blok-a') {
              const val = e.target.checked;
              ['cfg-show-badge', 'cfg-show-badge-blok-a'].forEach(otherId => {
                const oEl = document.getElementById(otherId);
                if (oEl) oEl.checked = val;
              });
            }
            saveCardConfigInputs();
            updateProductCardLivePreview();
          });
        });
      }
    });

    // Pilihan Mode Desain Kartu (Gunakan Default vs Buat Desain Baru)
    const btnUseDef = document.getElementById('btn-card-use-default');
    if (btnUseDef) {
      btnUseDef.addEventListener('click', () => {
        primaryState.use_default_card_design = true;
        delete primaryState.card_config;
        loadCardConfigInputs(primaryState.card_variant || 'A', true);
        updateDesignChoiceButtonsState();
        updateProductCardLivePreview();
        if (typeof App !== 'undefined' && App.showToast) App.showToast('Menggunakan template default kartu.', 'info');
      });
    }

    const btnCustomDesign = document.getElementById('btn-card-custom-design');
    if (btnCustomDesign) {
      btnCustomDesign.addEventListener('click', () => {
        primaryState.use_default_card_design = false;
        primaryState.card_config = getCardConfigFromDOM();
        updateDesignChoiceButtonsState();
        updateProductCardLivePreview();
        if (typeof App !== 'undefined' && App.showToast) App.showToast('Mode kustom desain aktif untuk produk ini.', 'success');
      });
    }

    // Toggle Simpan Sebagai Template Default
    const toggleSaveDef = document.getElementById('cfg-save-as-default-toggle');
    if (toggleSaveDef) {
      toggleSaveDef.addEventListener('change', (e) => {
        if (e.target.checked) {
          saveCardConfigInputs(true);
          if (typeof App !== 'undefined' && App.showToast) App.showToast('Styling kartu disimpan sebagai default untuk model kartu.', 'success');
        }
      });
    }

    // Countdown Toggle & Simulasi Live Preview
    const enableCdCheckbox = document.getElementById('cfg-enable-countdown');
    if (enableCdCheckbox) {
      ['change', 'click'].forEach(evt => {
        enableCdCheckbox.addEventListener(evt, (e) => {
          primaryState.enable_countdown = e.target.checked;
          saveCardConfigInputs();
          updateProductCardLivePreview();
        });
      });
    }

    const simCdCheckbox = document.getElementById('cfg-simulate-countdown-preview');
    if (simCdCheckbox) {
      ['change', 'click', 'input'].forEach(evt => {
        simCdCheckbox.addEventListener(evt, () => {
          updateProductCardLivePreview();
        });
      });
    }

    // --- INTERACTIVE CUSTOM LABELS CHIPS MANAGER ---
    function renderCustomLabelsChips() {
      const listContainer = document.getElementById('active-custom-labels-list');
      const counterBadge = document.getElementById('custom-labels-counter');
      if (!listContainer) return;

      const labels = Array.isArray(primaryState.custom_labels) ? primaryState.custom_labels.filter(Boolean) : [];
      if (counterBadge) counterBadge.textContent = `${labels.length}/2 Label`;

      if (labels.length === 0) {
        listContainer.innerHTML = `
          <span class="text-[11px] text-slate-400 italic">
            Belum ada label khusus. Klik tombol preset di atas atau ketik nama label lalu tekan "+ Tambah Label".
          </span>
        `;
        return;
      }

      listContainer.innerHTML = labels.map((lbl, idx) => `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
          <span>${escapeHtml(lbl)}</span>
          <button type="button" class="btn-remove-custom-label text-emerald-700 hover:text-red-600 font-black ml-0.5 cursor-pointer transition text-xs" data-index="${idx}" title="Hapus label ${escapeHtml(lbl)}">
            ✕
          </button>
        </span>
      `).join('');

      listContainer.querySelectorAll('.btn-remove-custom-label').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
          primaryState.custom_labels.splice(idx, 1);
          syncCustomLabelInputs();
          renderCustomLabelsChips();
          updateProductCardLivePreview();
        });
      });
    }

    function syncCustomLabelInputs() {
      const inp1 = document.getElementById('input-custom-label-1');
      const inp2 = document.getElementById('input-custom-label-2');
      if (inp1) inp1.value = primaryState.custom_labels?.[0] || '';
      if (inp2) inp2.value = primaryState.custom_labels?.[1] || '';
    }

    // Aksi Tombol "+ Tambah Label"
    const addCustomLabelAction = () => {
      const newInp = document.getElementById('input-new-custom-label');
      const val = (newInp?.value || '').trim();
      if (!val) {
        if (typeof App !== 'undefined' && App.showToast) App.showToast('Silakan ketik nama label terlebih dahulu!', 'warning');
        return;
      }
      if (!Array.isArray(primaryState.custom_labels)) primaryState.custom_labels = [];
      if (primaryState.custom_labels.length >= 2) {
        if (typeof App !== 'undefined' && App.showToast) App.showToast('Maksimal 2 label khusus! Hapus label lama jika ingin mengganti.', 'warning');
        else alert('Maksimal 2 label khusus! Hapus label lama jika ingin mengganti.');
        return;
      }
      if (primaryState.custom_labels.includes(val)) {
        if (typeof App !== 'undefined' && App.showToast) App.showToast(`Label "${val}" sudah terpasang!`, 'warning');
        return;
      }
      primaryState.custom_labels.push(val);
      if (newInp) newInp.value = '';
      syncCustomLabelInputs();
      renderCustomLabelsChips();
      updateProductCardLivePreview();
      if (typeof App !== 'undefined' && App.showToast) App.showToast(`Label "${val}" berhasil ditambahkan!`, 'success');
    };

    const btnAddCustomLabel = document.getElementById('btn-add-custom-label');
    if (btnAddCustomLabel) {
      btnAddCustomLabel.addEventListener('click', addCustomLabelAction);
    }
    const inputNewCustomLabel = document.getElementById('input-new-custom-label');
    if (inputNewCustomLabel) {
      inputNewCustomLabel.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addCustomLabelAction();
        }
      });
    }

    // Aksi Klik Preset Label Populer (1-Klik untuk Mengisi Slot 1 atau Slot 2)
    document.querySelectorAll('.btn-preset-label').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lbl = e.currentTarget.getAttribute('data-label');
        if (!lbl) return;
        if (!Array.isArray(primaryState.custom_labels)) primaryState.custom_labels = [];

        const inp1 = document.getElementById('input-custom-label-1');
        const inp2 = document.getElementById('input-custom-label-2');
        const val1 = (inp1 ? inp1.value : (primaryState.custom_labels[0] || '')).trim();
        const val2 = (inp2 ? inp2.value : (primaryState.custom_labels[1] || '')).trim();

        if (val1 === lbl || val2 === lbl) {
          if (typeof App !== 'undefined' && App.showToast) App.showToast(`Label "${lbl}" sudah terpasang!`, 'warning');
          return;
        }

        if (!val1) {
          if (inp1) inp1.value = lbl;
          primaryState.custom_labels[0] = lbl;
          if (val2) primaryState.custom_labels[1] = val2;
        } else if (!val2) {
          if (inp2) inp2.value = lbl;
          primaryState.custom_labels[0] = val1;
          primaryState.custom_labels[1] = lbl;
        } else {
          // Jika dua-duanya terisi, perbarui Slot 2
          if (inp2) inp2.value = lbl;
          primaryState.custom_labels[0] = val1;
          primaryState.custom_labels[1] = lbl;
        }
        primaryState.custom_labels = primaryState.custom_labels.filter(Boolean);
        renderCustomLabelsChips();
        updateProductCardLivePreview();
        if (typeof App !== 'undefined' && App.showToast) App.showToast(`Label "${lbl}" dimasukkan ke slot!`, 'success');
      });
    });

    // Sinkronisasi Input Manual Slot Label 1 & 2
    ['input-custom-label-1', 'input-custom-label-2'].forEach((id, idx) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', (e) => {
          if (!Array.isArray(primaryState.custom_labels)) primaryState.custom_labels = [];
          const val = e.target.value.trim();
          if (val) {
            primaryState.custom_labels[idx] = val;
          } else {
            primaryState.custom_labels.splice(idx, 1);
          }
          primaryState.custom_labels = primaryState.custom_labels.filter(Boolean);
          renderCustomLabelsChips();
          updateProductCardLivePreview();
        });
      }
    });

    // Listener Teks & Ikon Footer 1 Card Versi 3
    const inputCardFooter = document.getElementById('input-card-footer-text');
    if (inputCardFooter) {
      inputCardFooter.addEventListener('input', (e) => {
        primaryState.card_footer_text = e.target.value.trim() || 'Proses Hanya Dalam 1Jam';
        updateProductCardLivePreview();
      });
    }

    const selectCardFooterIcon = document.getElementById('select-card-footer-icon');
    if (selectCardFooterIcon) {
      selectCardFooterIcon.addEventListener('change', (e) => {
        primaryState.footer_badge_icon = e.target.value || 'truck';
        updateProductCardLivePreview();
      });
    }

    // Aksi Klik Preset Footer 1 Populer (1-Klik Isi Teks & Ikon)
    document.querySelectorAll('.btn-preset-footer').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const txt = e.currentTarget.getAttribute('data-text');
        const icon = e.currentTarget.getAttribute('data-icon');
        if (txt) {
          if (inputCardFooter) inputCardFooter.value = txt;
          primaryState.card_footer_text = txt;
        }
        if (icon) {
          if (selectCardFooterIcon) selectCardFooterIcon.value = icon;
          primaryState.footer_badge_icon = icon;
        }
        updateProductCardLivePreview();
        if (typeof App !== 'undefined' && App.showToast) App.showToast(`Preset footer 1 diterapkan: "${txt}"`, 'success');
      });
    });

    // Listener Teks & Ikon Footer 2 Card Versi 3
    const inputCardFooter2 = document.getElementById('input-card-footer-2-text');
    if (inputCardFooter2) {
      inputCardFooter2.addEventListener('input', (e) => {
        primaryState.card_footer_2_text = e.target.value.trim() || 'Variasi Paket Tersedia/tidak tersedia';
        updateProductCardLivePreview();
      });
    }

    const selectCardFooter2Icon = document.getElementById('select-card-footer-2-icon');
    if (selectCardFooter2Icon) {
      selectCardFooter2Icon.addEventListener('change', (e) => {
        primaryState.footer_2_badge_icon = e.target.value || 'minus';
        updateProductCardLivePreview();
      });
    }

    // Aksi Klik Preset Footer 2 Populer (1-Klik Isi Teks & Ikon)
    document.querySelectorAll('.btn-preset-footer-2').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const txt = e.currentTarget.getAttribute('data-text');
        const icon = e.currentTarget.getAttribute('data-icon');
        if (txt) {
          if (inputCardFooter2) inputCardFooter2.value = txt;
          primaryState.card_footer_2_text = txt;
        }
        if (icon) {
          if (selectCardFooter2Icon) selectCardFooter2Icon.value = icon;
          primaryState.footer_2_badge_icon = icon;
        }
        updateProductCardLivePreview();
        if (typeof App !== 'undefined' && App.showToast) App.showToast(`Preset footer 2 diterapkan: "${txt}"`, 'success');
      });
    });

    // Inisialisasi Tampilan Chip Label Khusus
    renderCustomLabelsChips();

    // Initial load card config
    loadCardConfigInputs(primaryState.card_variant || 'A');

    // Price Type Radios
    document.querySelectorAll('input[name="price_type_radio"]').forEach(r => {
      r.addEventListener('change', e => {
        syncStateFromDOM();
        primaryState.price_type = parseInt(e.target.value);
        renderForm();
      });
    });

    // Materials Repeaters: Add & Delete
    const btnAddMat = document.getElementById('btn-add-material');
    if (btnAddMat) {
      btnAddMat.addEventListener('click', () => {
        syncStateFromDOM();
        materialsState.push({
          id: DB.generateUUID(),
          name: '',
          price: 0,
          cost_price: 0,
          step_multiplier: primaryState.price_type === 7 ? 1 : 1
        });
        renderForm();
      });
    }

    document.querySelectorAll('.btn-delete-mat').forEach(btn => {
      btn.addEventListener('click', e => {
        if (materialsState.length <= 1) return;
        const row = e.target.closest('tr');
        const id = row.getAttribute('data-id');
        syncStateFromDOM();
        materialsState = materialsState.filter(m => m.id !== id);
        renderForm();
      });
    });

    // Main Finishing Repeaters
    const btnAddFinMain = document.getElementById('btn-add-finishing-main');
    if (btnAddFinMain) {
      btnAddFinMain.addEventListener('click', () => {
        syncStateFromDOM();
        finishingsState.main.push({
          id: DB.generateUUID(),
          tier: 'main',
          name: '',
          price: 0,
          cost_price: 0
        });
        renderForm();
      });
    }

    // Extra Finishing Repeaters
    document.querySelectorAll('.btn-add-extra-fin').forEach(btn => {
      btn.addEventListener('click', e => {
        const tier = e.target.closest('button').getAttribute('data-tier');
        syncStateFromDOM();
        finishingsState[tier].push({
          id: DB.generateUUID(),
          tier: tier,
          name: '',
          price: 0,
          cost_price: 0
        });
        renderForm();
      });
    });

    // Delete Finishing
    document.querySelectorAll('.btn-delete-fin').forEach(btn => {
      btn.addEventListener('click', e => {
        const tier = btn.getAttribute('data-tier');
        const el = btn.closest('[data-id]');
        const id = el.getAttribute('data-id');
        if (tier === 'main' && finishingsState.main.length <= 1) return;
        syncStateFromDOM();
        finishingsState[tier] = finishingsState[tier].filter(f => f.id !== id);
        renderForm();
      });
    });

    // Poin H: Stock Unlimited Toggle
    const toggleStock = document.getElementById('toggle-unlimited-stock');
    const stockWrapper = document.getElementById('stock-input-wrapper');
    if (toggleStock) {
      toggleStock.addEventListener('change', e => {
        primaryState.is_unlimited_stock = e.target.checked;
        if (e.target.checked) {
          stockWrapper.classList.add('hidden');
          primaryState.stock = null;
        } else {
          stockWrapper.classList.remove('hidden');
          const stockInput = document.getElementById('input-stock-qty');
          primaryState.stock = stockInput ? parseInt(stockInput.value) || 0 : 0;
        }
      });
    }

    // Poin I: Monthly Promo Toggle & Controls
    const toggleDiscount = document.getElementById('toggle-monthly-discount');
    const discountArea = document.getElementById('discount-controls-area');
    const selectDiscountType = document.getElementById('select-monthly-discount-type');
    const inputDiscountVal = document.getElementById('input-discount-val');
    const inputMonthlyPromoLabel = document.getElementById('input-monthly-promo-label');

    function updateDiscountAutoConvert() {
      const selectType = document.getElementById('select-monthly-discount-type');
      const inputVal = document.getElementById('input-discount-val');
      const infoText = document.getElementById('discount-auto-convert-text');
      const infoBadge = document.getElementById('discount-auto-convert-badge');
      if (!selectType || !inputVal || !infoText || !infoBadge) return;

      const val = parseFloat(inputVal.value) || 0;
      const type = selectType.value;
      const firstMatPrice = (materialsState.length > 0 && parseFloat(materialsState[0].price) > 0)
        ? parseFloat(materialsState[0].price)
        : 25000;

      if (val <= 0) {
        infoText.textContent = 'Masukkan nilai diskon untuk melihat kalkulasi auto-convert.';
        infoBadge.textContent = '0%';
        return;
      }

      if (type === 'percent') {
        const nominalEquiv = Math.round((firstMatPrice * val) / 100);
        infoText.textContent = `Diskon ${val}% setara potongan Rp${nominalEquiv.toLocaleString('id-ID')}/unit (Harga dasar: Rp${firstMatPrice.toLocaleString('id-ID')})`;
        infoBadge.textContent = `${Math.min(99, Math.round(val))}% OFF`;
      } else {
        const percentEquiv = Math.min(99, Math.round((val / firstMatPrice) * 100));
        infoText.textContent = `Potongan Rp${Math.round(val).toLocaleString('id-ID')} setara diskon ${percentEquiv}% (Harga dasar: Rp${firstMatPrice.toLocaleString('id-ID')})`;
        infoBadge.textContent = `${percentEquiv}% OFF`;
      }
    }

    if (toggleDiscount) {
      toggleDiscount.addEventListener('change', e => {
        primaryState.has_monthly_discount = e.target.checked;
        if (e.target.checked) {
          discountArea.classList.remove('hidden');
          updateDiscountAutoConvert();
        } else {
          discountArea.classList.add('hidden');
          primaryState.discount_value = 0;
        }
        updateProductCardLivePreview();
      });
    }

    if (selectDiscountType) {
      selectDiscountType.addEventListener('change', e => {
        const oldType = primaryState.discount_type;
        const newType = e.target.value;
        primaryState.discount_type = newType;

        const firstMatPrice = (materialsState.length > 0 && parseFloat(materialsState[0].price) > 0)
          ? parseFloat(materialsState[0].price)
          : 25000;

        let curVal = parseFloat(inputDiscountVal?.value) || 0;
        if (curVal > 0) {
          if (oldType === 'percent' && newType === 'nominal') {
            // Convert % to nominal IDR
            const converted = Math.round((firstMatPrice * curVal) / 100);
            if (inputDiscountVal) inputDiscountVal.value = converted;
            primaryState.discount_value = converted;
          } else if (oldType === 'nominal' && newType === 'percent') {
            // Convert nominal IDR to %
            const converted = Math.min(99, Math.round((curVal / firstMatPrice) * 100));
            if (inputDiscountVal) inputDiscountVal.value = converted;
            primaryState.discount_value = converted;
          }
        }
        updateDiscountAutoConvert();
        updateProductCardLivePreview();
      });
    }

    if (inputDiscountVal) {
      inputDiscountVal.addEventListener('input', e => {
        primaryState.discount_value = parseFloat(e.target.value) || 0;
        updateDiscountAutoConvert();
        updateProductCardLivePreview();
      });
    }

    if (inputMonthlyPromoLabel) {
      inputMonthlyPromoLabel.addEventListener('input', e => {
        primaryState.monthly_promo_label = e.target.value;
      });
    }

    // Panggil kalkulasi awal
    updateDiscountAutoConvert();

    // Poin J & K: Min & Max Order
    const inputMinOrder = document.getElementById('input-min-order');
    if (inputMinOrder) {
      inputMinOrder.addEventListener('input', e => {
        primaryState.min_order = parseInt(e.target.value) || 1;
      });
    }
    const inputMaxOrder = document.getElementById('input-max-order');
    if (inputMaxOrder) {
      inputMaxOrder.addEventListener('input', e => {
        primaryState.max_order = e.target.value === '' ? null : parseInt(e.target.value);
      });
    }

    // Selektor Rasio Aspek Foto (1:1 vs 4:3)
    document.querySelectorAll('input[name="photo_aspect_ratio"]').forEach(rad => {
      rad.addEventListener('change', e => {
        if (e.target.checked) {
          setPhotoAspectRatio(e.target.value, true);
        }
      });
    });

    // Multi-Image Upload dengan Canvas Auto-Compression (Silent Upload)
    const fileInput = document.getElementById('input-prod-image');
    if (fileInput) {
      fileInput.addEventListener('change', async e => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        await handleImageFilesSelected(files);
      });
    }

    // Drag and Drop Upload ke Grid Galeri
    const galleryContainer = document.getElementById('image-gallery-container');
    if (galleryContainer) {
      ['dragenter', 'dragover'].forEach(evt => {
        galleryContainer.addEventListener(evt, e => {
          e.preventDefault();
          galleryContainer.classList.add('ring-2', 'ring-emerald-500', 'bg-emerald-50/20', 'rounded-2xl');
        });
      });
      ['dragleave', 'drop'].forEach(evt => {
        galleryContainer.addEventListener(evt, e => {
          e.preventDefault();
          galleryContainer.classList.remove('ring-2', 'ring-emerald-500', 'bg-emerald-50/20', 'rounded-2xl');
        });
      });
      galleryContainer.addEventListener('drop', async e => {
        if (e.dataTransfer && e.dataTransfer.files) {
          await handleImageFilesSelected(Array.from(e.dataTransfer.files));
        }
      });
    }

    bindGalleryButtons();

    // Toggle Active
    const toggleIsActive = document.getElementById('toggle-is-active-form');
    if (toggleIsActive) {
      toggleIsActive.addEventListener('change', e => {
        primaryState.is_active = e.target.checked;
      });
    }

    // Submit Buttons
    const btnSubmit = document.getElementById('btn-submit-product');
    const btnSubmitTop = document.getElementById('btn-submit-product-top');

    [btnSubmit, btnSubmitTop].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', handleFormSubmit);
      }
    });
  }

  function setPhotoAspectRatio(ratio, isManual = false) {
    primaryState.image_aspect_ratio = ratio;
    if (isManual) {
      primaryState.image_aspect_ratio_manual = true;
    }

    const rads = document.querySelectorAll('input[name="photo_aspect_ratio"]');
    rads.forEach(rad => {
      rad.checked = (rad.value === ratio);
      const labelWrapper = rad.closest('label');
      if (labelWrapper) {
        if (rad.checked) {
          labelWrapper.className = 'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500 bg-emerald-50/50 text-emerald-800 font-bold ring-1 ring-emerald-500/30 text-xs cursor-pointer transition select-none';
        } else {
          labelWrapper.className = 'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium text-xs cursor-pointer transition select-none';
        }
      }
    });

    refreshGalleryDOM();
  }

  async function handleImageFilesSelected(files) {
    if (!files || files.length === 0) return;

    const errorBanner = document.getElementById('file-size-error-banner');
    const errorMsg = document.getElementById('file-size-error-msg');
    const fileInput = document.getElementById('input-prod-image');

    // Validasi format berkas gambar
    const imageFiles = files.filter(f => f.type && f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      if (errorMsg && errorBanner) {
        errorMsg.textContent = 'Berkas yang dipilih bukan berkas gambar yang didukung (JPG, PNG, WEBP).';
        errorBanner.classList.remove('hidden');
      }
      if (fileInput) fileInput.value = '';
      return;
    }

    if (errorBanner) errorBanner.classList.add('hidden');

    if (!Array.isArray(primaryState.images)) primaryState.images = [];

    // Maksimal 9 foto produk
    const remainingSlots = 9 - primaryState.images.length;
    if (remainingSlots <= 0) {
      if (errorMsg && errorBanner) {
        errorMsg.textContent = 'Maksimal 9 foto produk telah tercapai. Hapus beberapa foto untuk menambahkan foto baru.';
        errorBanner.classList.remove('hidden');
      }
      if (fileInput) fileInput.value = '';
      return;
    }

    const toProcess = imageFiles.slice(0, remainingSlots);

    try {
      for (const file of toProcess) {
        const compressedDataUrl = await compressProductImage(file, 1200, 1200, 0.8);
        primaryState.images.push(compressedDataUrl);
        if (!primaryState.image_url) {
          primaryState.image_url = compressedDataUrl;
        }
      }

      refreshGalleryDOM();
      updateProductCardLivePreview();
    } catch (err) {
      console.error('[ProductForm] Gagal memproses gambar:', err);
      if (errorMsg && errorBanner) {
        errorMsg.textContent = `Gagal memproses gambar: ${err.message || 'Format tidak valid'}`;
        errorBanner.classList.remove('hidden');
      }
    } finally {
      if (fileInput) fileInput.value = '';
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function bindGalleryButtons() {
    // Tombol Tambah Slot Foto
    const addSlotBtn = document.getElementById('btn-slot-add-photo');
    const fileInput = document.getElementById('input-prod-image');
    if (addSlotBtn && fileInput) {
      addSlotBtn.addEventListener('click', () => {
        fileInput.click();
      });
    }

    // Set Main Image (Cover)
    document.querySelectorAll('.btn-set-main-image').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'));
        if (isNaN(idx) || idx <= 0 || idx >= primaryState.images.length) return;
        const targetImg = primaryState.images.splice(idx, 1)[0];
        primaryState.images.unshift(targetImg);
        primaryState.image_url = primaryState.images[0];
        refreshGalleryDOM();
        updateProductCardLivePreview();
      });
    });

    // Geser Urutan ke Kiri (◀)
    document.querySelectorAll('.btn-move-left-image').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'));
        if (isNaN(idx) || idx <= 0 || idx >= primaryState.images.length) return;
        const temp = primaryState.images[idx];
        primaryState.images[idx] = primaryState.images[idx - 1];
        primaryState.images[idx - 1] = temp;
        primaryState.image_url = primaryState.images[0];
        refreshGalleryDOM();
        updateProductCardLivePreview();
      });
    });

    // Geser Urutan ke Kanan (▶)
    document.querySelectorAll('.btn-move-right-image').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'));
        if (isNaN(idx) || idx < 0 || idx >= primaryState.images.length - 1) return;
        const temp = primaryState.images[idx];
        primaryState.images[idx] = primaryState.images[idx + 1];
        primaryState.images[idx + 1] = temp;
        primaryState.image_url = primaryState.images[0];
        refreshGalleryDOM();
        updateProductCardLivePreview();
      });
    });

    // Hapus Foto dari Galeri (✕)
    document.querySelectorAll('.btn-delete-gallery-img').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'));
        if (isNaN(idx) || idx < 0 || idx >= primaryState.images.length) return;
        primaryState.images.splice(idx, 1);
        primaryState.image_url = primaryState.images.length > 0 ? primaryState.images[0] : null;
        refreshGalleryDOM();
        updateProductCardLivePreview();
      });
    });
  }

  function refreshGalleryDOM() {
    const galleryContainer = document.getElementById('image-gallery-container');
    if (galleryContainer) {
      galleryContainer.innerHTML = renderGalleryThumbnails();
      bindGalleryButtons();
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function syncStateFromDOM() {
    primaryState.name = document.getElementById('input-prod-name')?.value || primaryState.name;
    primaryState.description = document.getElementById('input-prod-desc')?.value || '';
    primaryState.category_id = document.getElementById('select-prod-cat')?.value || primaryState.category_id;
    primaryState.sub_category_id = document.getElementById('select-prod-sub-cat')?.value || primaryState.sub_category_id;
    const variantRad = document.querySelector('input[name="card_variant_radio"]:checked');
    if (variantRad) primaryState.card_variant = variantRad.value;
    primaryState.card_variant_override = true;
    const aspectRad = document.querySelector('input[name="photo_aspect_ratio"]:checked');
    if (aspectRad) primaryState.image_aspect_ratio = aspectRad.value;
    primaryState.monthly_promo_label = document.getElementById('input-monthly-promo-label')?.value || 'Promo Bulanan';
    primaryState.discount_type = document.getElementById('select-monthly-discount-type')?.value || 'percent';
    primaryState.discount_value = parseFloat(document.getElementById('input-discount-val')?.value) || 0;
    primaryState.min_order = parseInt(document.getElementById('input-min-order')?.value) || 1;
    primaryState.max_order = document.getElementById('input-max-order')?.value ? parseInt(document.getElementById('input-max-order').value) : null;
    primaryState.stock = document.getElementById('input-stock-qty')?.value ? parseInt(document.getElementById('input-stock-qty').value) : null;

    const label1Val = (document.getElementById('input-custom-label-1')?.value || '').trim();
    const label2Val = (document.getElementById('input-custom-label-2')?.value || '').trim();
    primaryState.custom_labels = [label1Val, label2Val].filter(Boolean);

    // Sync Countdown Settings
    const enableCdEl = document.getElementById('cfg-enable-countdown');
    if (enableCdEl) primaryState.enable_countdown = enableCdEl.checked;
    primaryState.countdown_bg_color = document.getElementById('cfg-countdown-bg-color')?.value || primaryState.countdown_bg_color || '#059669';
    primaryState.countdown_text_color = document.getElementById('cfg-countdown-text-color')?.value || primaryState.countdown_text_color || '#ffffff';
    primaryState.countdown_border_color = document.getElementById('cfg-countdown-border-color')?.value || primaryState.countdown_border_color || '#059669';

    // Sync Footer 1 Settings
    const cardFooterVal = (document.getElementById('input-card-footer-text')?.value || '').trim();
    primaryState.card_footer_text = cardFooterVal || 'Proses Hanya Dalam 1Jam';
    const cardFooterIconVal = (document.getElementById('select-card-footer-icon')?.value || '').trim();
    primaryState.footer_badge_icon = cardFooterIconVal || primaryState.footer_badge_icon || 'truck';
    primaryState.footer_bg_color = document.getElementById('cfg-footer-bg-color')?.value || primaryState.footer_bg_color || '#059669';
    primaryState.footer_text_color = document.getElementById('cfg-footer-text-color')?.value || primaryState.footer_text_color || '#ffffff';

    // Sync Footer 2 Settings
    const cardFooter2Val = (document.getElementById('input-card-footer-2-text')?.value || '').trim();
    primaryState.card_footer_2_text = cardFooter2Val || 'Variasi Paket Tersedia/tidak tersedia';
    const cardFooter2IconVal = (document.getElementById('select-card-footer-2-icon')?.value || '').trim();
    primaryState.footer_2_badge_icon = cardFooter2IconVal || primaryState.footer_2_badge_icon || 'minus';
    primaryState.footer_2_bg_color = document.getElementById('cfg-footer-2-bg-color')?.value || primaryState.footer_2_bg_color || '#047857';
    primaryState.footer_2_text_color = document.getElementById('cfg-footer-2-text-color')?.value || primaryState.footer_2_text_color || '#ffffff';

    const matRows = document.querySelectorAll('#materials-table-body tr');
    matRows.forEach(row => {
      const id = row.getAttribute('data-id');
      const item = materialsState.find(m => m.id === id);
      if (item) {
        const nameInp = row.querySelector('[data-field="name"]');
        const priceInp = row.querySelector('[data-field="price"]');
        const costInp = row.querySelector('[data-field="cost_price"]');
        const stepInp = row.querySelector('[data-field="step_multiplier"]');

        if (nameInp) item.name = nameInp.value;
        if (priceInp) item.price = parseFloat(priceInp.value) || 0;
        if (costInp) item.cost_price = parseFloat(costInp.value) || 0;
        if (stepInp) item.step_multiplier = Math.max(1, parseInt(stepInp.value) || 1);
      }
    });

    const finRows = document.querySelectorAll('#finishings-main-table-body tr');
    finRows.forEach(row => {
      const id = row.getAttribute('data-id');
      const item = finishingsState.main.find(f => f.id === id);
      if (item) {
        const nameInp = row.querySelector('[data-field="name"]');
        const priceInp = row.querySelector('[data-field="price"]');
        const costInp = row.querySelector('[data-field="cost_price"]');

        if (nameInp) item.name = nameInp.value;
        if (priceInp) item.price = parseFloat(priceInp.value) || 0;
        if (costInp) item.cost_price = parseFloat(costInp.value) || 0;
      }
    });

    ['extra_1', 'extra_2', 'extra_3'].forEach(tier => {
      const extraItems = document.querySelectorAll(`[data-tier="${tier}"][data-id]`);
      extraItems.forEach(el => {
        const id = el.getAttribute('data-id');
        const item = finishingsState[tier].find(f => f.id === id);
        if (item) {
          const nameInp = el.querySelector('[data-field="name"]');
          const priceInp = el.querySelector('[data-field="price"]');
          const costInp = el.querySelector('[data-field="cost_price"]');

          if (nameInp) item.name = nameInp.value;
          if (priceInp) item.price = parseFloat(priceInp.value) || 0;
          if (costInp) item.cost_price = parseFloat(costInp.value) || 0;
        }
      });
    });
  }

  function validateForm() {
    syncStateFromDOM();
    const errors = [];

    // 1. Informasi Pokok Produk
    if (!primaryState.name || primaryState.name.trim() === '') {
      errors.push('Nama / judul produk wajib diisi.');
    }
    if (!primaryState.description || primaryState.description.trim() === '') {
      errors.push('Deskripsi produk wajib diisi.');
    }

    // 2. Upload Gambar Produk (Wajib minimal 1)
    if (!primaryState.images || primaryState.images.length === 0) {
      errors.push('Foto produk wajib diunggah minimal 1 gambar.');
    }

    // 3. Varian / Bahan & Opsi Tambahan
    if (!materialsState || materialsState.length === 0) {
      errors.push('Minimal harus mengisi 1 pilihan varian / bahan dasar.');
    } else {
      let hasEmptyMatName = false;
      materialsState.forEach(m => {
        if (!m.name || m.name.trim() === '') hasEmptyMatName = true;
      });
      if (hasEmptyMatName) {
        errors.push('Semua baris varian/bahan wajib memiliki nama yang jelas.');
      }
    }

    if (!finishingsState.main || finishingsState.main.length === 0) {
      errors.push('Minimal harus mengisi 1 pilihan opsi utama / pilihan wajib.');
    } else {
      let hasEmptyFinName = false;
      finishingsState.main.forEach(f => {
        if (!f.name || f.name.trim() === '') hasEmptyFinName = true;
      });
      if (hasEmptyFinName) {
        errors.push('Semua baris opsi utama wajib memiliki nama.');
      }
    }

    // 4. Tipe Perhitungan Harga
    if (!primaryState.price_type || primaryState.price_type < 1 || primaryState.price_type > 7) {
      errors.push('Tipe perhitungan harga wajib dipilih.');
    }

    // 5. Manajemen Stok & Promo
    if (!primaryState.is_unlimited_stock && (primaryState.stock === null || isNaN(primaryState.stock))) {
      errors.push('Masukkan jumlah stok fisik yang valid jika batas stok aktif.');
    }

    if (primaryState.has_monthly_discount) {
      if (primaryState.discount_type === 'percent' && (primaryState.discount_value <= 0 || primaryState.discount_value > 100)) {
        errors.push('Persentase diskon harus di antara 1% dan 100%.');
      } else if (primaryState.discount_type === 'nominal' && primaryState.discount_value <= 0) {
        errors.push('Nominal potongan diskon IDR harus lebih besar dari 0.');
      }
    }

    if (primaryState.min_order < 1) {
      errors.push('Minimal pesanan minimal bernilai 1.');
    }
    if (primaryState.max_order !== null && primaryState.max_order < primaryState.min_order) {
      errors.push('Maksimal pesanan tidak boleh lebih kecil dari minimal pesanan.');
    }

    // Validasi Label Khusus: jika "Tampilkan di Kartu" dicentang, wajibkan minimal 1 slot terisi
    const isBadgeChecked = (document.getElementById('cfg-show-badge')?.checked === true) || 
                           (document.getElementById('cfg-show-badge-blok-a')?.checked === true) ||
                           (primaryState.show_badge === true && primaryState.show_custom_labels !== false);
    if (isBadgeChecked) {
      const slot1 = (document.getElementById('input-custom-label-1')?.value || primaryState.custom_labels?.[0] || '').trim();
      const slot2 = (document.getElementById('input-custom-label-2')?.value || primaryState.custom_labels?.[1] || '').trim();
      if (!slot1 && !slot2) {
        errors.push('Label Khusus: Opsi "Tampilkan di Kartu" dicentang, minimal 1 Slot Label (Slot 1 atau Slot 2) wajib diisi.');
      }
    }

    return errors;
  }

  function handleFormSubmit() {
    const errorBanner = document.getElementById('form-error-banner');
    const errorList = document.getElementById('form-error-list');
    const btnSubmit = document.getElementById('btn-submit-product');
    const spinner = document.getElementById('btn-submit-spinner');
    const icon = document.getElementById('btn-submit-icon');
    const submitText = document.getElementById('btn-submit-text');

    const errors = validateForm();

    if (errors.length > 0) {
      errorList.innerHTML = errors.map(err => `<li>${err}</li>`).join('');
      errorBanner.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    errorBanner.classList.add('hidden');

    if (btnSubmit) {
      btnSubmit.disabled = true;
      spinner.classList.remove('hidden');
      icon.classList.add('hidden');
      submitText.textContent = 'Menyimpan...';
    }

    const allFinishings = [
      ...finishingsState.main.map(f => ({ ...f, tier: 'main' })),
      ...finishingsState.extra_1.filter(f => f.name.trim() !== '').map(f => ({ ...f, tier: 'extra_1' })),
      ...finishingsState.extra_2.filter(f => f.name.trim() !== '').map(f => ({ ...f, tier: 'extra_2' })),
      ...finishingsState.extra_3.filter(f => f.name.trim() !== '').map(f => ({ ...f, tier: 'extra_3' }))
    ];

    const validMaterials = materialsState.filter(m => m.name.trim() !== '');

    // Ensure image_url is synchronized with images[0]
    if (Array.isArray(primaryState.images) && primaryState.images.length > 0) {
      primaryState.image_url = primaryState.images[0];
    }

    // Sync Footer Colors & Texts for Card Variant C
    const footer1Val = (document.getElementById('input-card-footer-text')?.value || primaryState.custom_footer_1?.text || primaryState.card_footer_text || 'Proses Hanya Dalam 1Jam').trim();
    const footer1IconVal = document.getElementById('select-card-footer-icon')?.value || primaryState.custom_footer_1?.icon || primaryState.footer_badge_icon || 'truck';
    const footer1BgVal = document.getElementById('cfg-footer-bg-color')?.value || primaryState.custom_footer_1?.bg_color || primaryState.footer_bg_color || '#059669';
    const footer1TextColVal = document.getElementById('cfg-footer-text-color')?.value || primaryState.custom_footer_1?.text_color || primaryState.footer_text_color || '#ffffff';

    const footer2Val = (document.getElementById('input-card-footer-2-text')?.value || primaryState.custom_footer_2?.text || primaryState.card_footer_2_text || 'Variasi Paket Tersedia/tidak tersedia').trim();
    const footer2IconVal = document.getElementById('select-card-footer-2-icon')?.value || primaryState.custom_footer_2?.icon || primaryState.footer_2_badge_icon || 'minus';
    const footer2BgVal = document.getElementById('cfg-footer-2-bg-color')?.value || primaryState.custom_footer_2?.bg_color || primaryState.footer_2_bg_color || '#047857';
    const footer2TextColVal = document.getElementById('cfg-footer-2-text-color')?.value || primaryState.custom_footer_2?.text_color || primaryState.footer_2_text_color || '#ffffff';

    primaryState.custom_footer_1 = {
      text: footer1Val,
      icon: footer1IconVal,
      bg_color: footer1BgVal,
      text_color: footer1TextColVal
    };
    primaryState.card_footer_text = footer1Val;
    primaryState.footer_badge_icon = footer1IconVal;
    primaryState.footer_bg_color = footer1BgVal;
    primaryState.footer_text_color = footer1TextColVal;

    primaryState.custom_footer_2 = {
      text: footer2Val,
      icon: footer2IconVal,
      bg_color: footer2BgVal,
      text_color: footer2TextColVal
    };
    primaryState.card_footer_2_text = footer2Val;
    primaryState.footer_2_badge_icon = footer2IconVal;
    primaryState.footer_2_bg_color = footer2BgVal;
    primaryState.footer_2_text_color = footer2TextColVal;

    // Save labels & footers to persistent history dropdown
    if (Array.isArray(primaryState.custom_labels)) {
      primaryState.custom_labels.forEach(lbl => {
        if (lbl && lbl.trim() && DB.saveCustomLabelToHistory) {
          DB.saveCustomLabelToHistory(lbl.trim());
        }
      });
    }
    if (primaryState.card_variant === 'C') {
      if (primaryState.card_footer_text && DB.saveFooterTextToHistory) {
        DB.saveFooterTextToHistory(primaryState.card_footer_text.trim());
      }
      if (primaryState.card_footer_2_text && DB.saveFooterTextToHistory) {
        DB.saveFooterTextToHistory(primaryState.card_footer_2_text.trim());
      }
    }

    setTimeout(() => {
      try {
        if (formMode === 'create') {
          DB.createProduct(primaryState, validMaterials, allFinishings);
          App.showToast('Produk baru berhasil disimpan ke katalog!', 'success');
        } else {
          DB.updateProduct(currentEditingId, primaryState, validMaterials, allFinishings);
          App.showToast('Perubahan produk berhasil diperbarui!', 'success');
        }
        App.navigate('list');
      } catch (err) {
        console.error(err);
        alert('Gagal menyimpan produk: ' + err.message);
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          spinner.classList.add('hidden');
          icon.classList.remove('hidden');
          submitText.textContent = formMode === 'edit' ? 'Perbarui Produk' : 'Simpan Produk';
        }
      }
    }, 400);
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
      resetFormState();
      renderForm();
    },
    initCreate() {
      resetFormState();
      renderForm();
    },
    initEdit(id) {
      return loadProductForEdit(id);
    },
    updateLiveCardPreview: updateProductCardLivePreview,
    updateProductCardLivePreview,
    getLastProductFooterConfig,
    validateForm,
    getPrimaryState: () => primaryState
  };
})();

window.ProductForm = ProductForm;

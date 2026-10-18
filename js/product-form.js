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

  let currentStep = 1; // 1 | 2 | 3
  let isLivePreviewOpen = true; // Desktop preview sidebar open/collapsed state

  // Primary metadata state
  let primaryState = {
    name: '',
    product_type: '', // 'physical' | 'non_physical' - default '' pada create
    show_shipping_for_non_physical: false,
    has_layer_3: false,
    show_badge: true,
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
    promo_start_date: null,
    promo_end_date: null,
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

    // 3. Produk Fisik Reguler & Ritel / Default -> Model 1 ('A')
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

    currentStep = 1;
    primaryState = {
      name: '',
      product_type: '', // Default '' pada mode tambah produk baru
      show_shipping_for_non_physical: false,
      has_layer_3: false,
      show_badge: true,
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
      promo_start_date: null,
      promo_end_date: null,
      min_order: 1,
      max_order: null,
      image_url: null,
      images: [],
      image_aspect_ratio: (initialCardVariant === 'C' ? '4:3' : '1:1'),
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
    currentStep = 1;

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
      product_type: prod.product_type || 'physical',
      show_shipping_for_non_physical: prod.show_shipping_for_non_physical || false,
      show_badge: prod.show_badge !== undefined ? prod.show_badge : true,
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
      promo_start_date: prod.promo_start_date || null,
      promo_end_date: prod.promo_end_date || null,
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
      : [{ id: DB.generateUUID(), name: '',
    product_type: 'physical', // 'physical' | 'non_physical'
    has_layer_3: false,
    show_badge: true, price: 0, cost_price: 0, step_multiplier: 1 }];

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
    const allCategories = (typeof DB !== 'undefined' && DB.getCategories) ? DB.getCategories() : [];
    const currentSubs = primaryState.category_id ? DB.getSubCategories(primaryState.category_id) : [];
    const customLabelsHistory = (typeof DB !== 'undefined' && DB.getCustomLabelsHistory) ? DB.getCustomLabelsHistory() : ['Best Seller', 'Produk Populer', 'Desain Custom', 'Promo Terbatas', 'Termurah', 'Premium Quality', 'Pengerjaan Cepat', 'Garansi 100%'];
    const footerTextsHistory = (typeof DB !== 'undefined' && DB.getFooterTextsHistory) ? DB.getFooterTextsHistory() : ['Proses Cepat & Garansi Kualitas', 'Siap Kirim Seluruh Indonesia', 'Layanan Pelanggan Ramah', 'Bahan Premium Berkualitas', 'Garansi Uang Kembali Jika Cacat', 'Pengiriman Cepat & Aman'];

    container.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6 pb-20">
        
        <!-- Header Top Bar (Tanpa Tombol Simpan/Batal Atas) -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
          <div>
            <div class="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <button type="button" id="btn-back-to-list" class="hover:text-emerald-600 transition flex items-center gap-1 font-medium cursor-pointer">
                <i data-lucide="arrow-left" class="w-4 h-4"></i> Daftar Produk
              </button>
              <span>/</span>
              <span class="text-slate-800 font-semibold">${formMode === 'edit' ? 'Edit Produk' : 'Tambah Produk Baru'}</span>
            </div>
            <h1 class="text-2xl font-bold text-slate-900">
              ${formMode === 'edit' ? 'Perbarui Informasi Produk' : 'Tambah Produk Baru'}
            </h1>
            <p class="text-sm text-slate-500 mt-0.5">Konfigurasi formula harga dinamis, galeri foto produk, variasi bahan, dan promo etalase.</p>
          </div>
        </div>

        <!-- FORM MAIN CONTAINER WITH RIGHT PADDING WHEN PREVIEW SIDEBAR IS OPEN -->
        <div class="w-full relative">
          
          <!-- WIZARD FORM COLUMN -->
          <div id="wizard-form-col" class="w-full ${isLivePreviewOpen && primaryState.is_active ? 'lg:pr-[400px] xl:pr-[440px]' : ''} space-y-6 transition-all duration-300">
            
            <!-- Visual Error Summary Container -->
            <div id="form-error-banner" class="hidden p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm animate-shake">
              <div class="flex items-center gap-2 font-semibold mb-1">
                <i data-lucide="alert-circle" class="w-5 h-5 text-red-600"></i> Mohon lengkapi formulir sebelum melanjutkan:
              </div>
              <ul id="form-error-list" class="list-disc list-inside text-xs space-y-1 pl-1"></ul>
            </div>

            <!-- ============================================== -->
            <!-- STEP 1 PANE: INFORMASI PRODUK -->
            <!-- ============================================== -->
            <div id="step-pane-1" class="space-y-6 ${currentStep === 1 ? 'block' : 'hidden'}">
              
              <!-- 1 KARTU UTAMA: INFORMASI PRODUK -->
              <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6">
                <!-- Header Card -->
                <div class="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h2 class="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                      <i class="bi bi-info-circle text-emerald-600"></i>
                      <span>Informasi Produk</span>
                    </h2>
                    <p class="text-xs text-slate-500 mt-0.5">Lengkapi identitas visual, format etalase, dan media utama penawaran produk Anda.</p>
                  </div>
                </div>

                <!-- Poin 1: Jenis Produk / Layanan ([Fisik] | [Non Fisik]) - Wajib Dipilih Dulu -->
                <div class="space-y-2.5 pt-1">
                  <div class="flex items-center justify-between">
                    <label class="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-black">1</span>
                      <span>Jenis Produk / Layanan</span> <span class="text-red-500">*</span>
                    </label>
                    <span class="text-[11px] text-slate-400">Pilih jenis produk terlebih dahulu</span>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" id="product-type-selector-group">
                    <!-- Fisik -->
                    <label class="p-3.5 rounded-xl border ${primaryState.product_type === 'physical' ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex items-center gap-3 block select-none">
                      <input type="radio" name="product_type_radio" value="physical" ${primaryState.product_type === 'physical' ? 'checked' : ''} class="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                      <div>
                        <span class="font-bold text-xs ${primaryState.product_type === 'physical' ? 'text-emerald-950 font-extrabold' : 'text-slate-800'} block">Fisik</span>
                        <span class="text-[11px] text-slate-500 block">Produk berwujud fisik dengan inventaris stok dan pengiriman kurir.</span>
                      </div>
                    </label>

                    <!-- Non Fisik -->
                    <label class="p-3.5 rounded-xl border ${primaryState.product_type === 'non_physical' ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex items-center gap-3 block select-none">
                      <input type="radio" name="product_type_radio" value="non_physical" ${primaryState.product_type === 'non_physical' ? 'checked' : ''} class="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                      <div>
                        <span class="font-bold text-xs ${primaryState.product_type === 'non_physical' ? 'text-emerald-950 font-extrabold' : 'text-slate-800'} block">Non Fisik</span>
                        <span class="text-[11px] text-slate-500 block">Jasa cetak custom, layanan desain grafis, produk digital tanpa stok fisik.</span>
                      </div>
                    </label>
                  </div>
                </div>

                <hr class="border-slate-100" />

                <!-- Poin 2: Aksi Tampilkan di Etalase Toko -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-black">2</span>
                        <span>Tampilkan di Etalase Toko</span>
                      </label>
                      <p class="text-xs text-slate-500 mt-0.5">Jika dinonaktifkan, produk disembunyikan dari pembeli namun tetap tersedia di kasir POS.</p>
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

                <hr class="border-slate-100" />

                <!-- Poin 3: Pilih Jenis Model Kartu Produk (Model 1 | Model 2 | Model 3) -->
                <div id="section-card-model-point3" class="${primaryState.is_active ? 'space-y-3' : 'hidden space-y-3'}">
                  <div class="border-b border-slate-100 pb-2">
                    <label class="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-black">3</span>
                      <span>Pilih Jenis Model Kartu Produk</span> <span class="text-red-500">*</span>
                    </label>
                    <p class="text-xs text-slate-500 mt-0.5">Format tampilan kartu produk di etalase web toko pembeli.</p>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <!-- Model 1 (Universal Standard) -->
                    <label class="p-3.5 rounded-xl border ${primaryState.card_variant === 'A' ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition space-y-1.5 block select-none">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-xs ${primaryState.card_variant === 'A' ? 'text-emerald-900' : 'text-slate-800'}">Model 1 (Universal Standard)</span>
                        <input type="radio" name="card_variant_radio" value="A" ${primaryState.card_variant === 'A' ? 'checked' : ''} class="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                      </div>
                      <p class="text-[11px] text-slate-500 leading-relaxed">
                        Format kartu seimbang untuk katalog ritel serbaguna dengan penonjolan ulasan kepuasan pembeli.
                      </p>
                    </label>

                    <!-- Model 2 (Bold & Clean) -->
                    <label class="p-3.5 rounded-xl border ${primaryState.card_variant === 'B' ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition space-y-1.5 block select-none">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-xs ${primaryState.card_variant === 'B' ? 'text-emerald-900' : 'text-slate-800'}">Model 2 (Bold & Clean)</span>
                        <input type="radio" name="card_variant_radio" value="B" ${primaryState.card_variant === 'B' ? 'checked' : ''} class="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                      </div>
                      <p class="text-[11px] text-slate-500 leading-relaxed">
                        Tata letak ringkas tanpa ornamen berlebih, mengedepankan nama penawaran dan transparansi biaya.
                      </p>
                    </label>

                    <!-- Model 3 (Informative Showcase) -->
                    <label class="p-3.5 rounded-xl border ${primaryState.card_variant === 'C' ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition space-y-1.5 block select-none">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-xs ${primaryState.card_variant === 'C' ? 'text-emerald-900' : 'text-slate-800'}">Model 3 (Informative Showcase)</span>
                        <input type="radio" name="card_variant_radio" value="C" ${primaryState.card_variant === 'C' ? 'checked' : ''} class="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                      </div>
                      <p class="text-[11px] text-slate-500 leading-relaxed">
                        Tampilan etalase modern dengan footer spesifikasi dinamis guna mempercepat keputusan transaksi pembeli.
                      </p>
                    </label>
                  </div>
                </div>

                <hr class="border-slate-100" />

                <!-- Poin 4: Foto Produk * (Galeri 10 Slot Terurut) -->
                <div class="space-y-3">
                  <div class="border-b border-slate-100 pb-2">
                    <label class="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-black">4</span>
                      <span>Foto Produk</span> <span class="text-red-500">*</span>
                      <span class="text-[11px] font-normal text-slate-500 ml-1">(Galeri Maksimal 10 Slot)</span>
                    </label>
                    <p class="text-xs text-slate-500 mt-0.5">Foto pertama otomatis menjadi Cover Utama. Urutkan posisi foto atau ganti cover dengan mudah.</p>
                  </div>

                  <div>
                    <div id="file-size-error-banner" class="hidden mb-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                      <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-600 shrink-0"></i>
                      <span id="file-size-error-msg">Pemberitahuan pemrosesan gambar</span>
                    </div>

                    <!-- Lock notice jika model kartu belum dipilih saat toko aktif -->
                    <div id="gallery-locked-notice" class="${(primaryState.is_active && !primaryState.card_variant) ? 'block' : 'hidden'} p-6 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 text-center space-y-2">
                      <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <i class="bi bi-lock text-lg"></i>
                      </div>
                      <p class="text-xs font-bold text-slate-700">Area Upload Foto Terkunci</p>
                      <p class="text-[11px] text-slate-400">Silakan pilih Model Kartu Produk di atas terlebih dahulu untuk membuka galeri foto.</p>
                    </div>

                    <!-- Hidden Multi-file input -->
                    <input type="file" id="input-prod-images-hidden" multiple accept="image/jpeg,image/png,image/webp" class="hidden" />
                    <input type="file" id="input-prod-image" multiple accept="image/jpeg,image/png,image/webp" class="hidden" />

                    <!-- 10-Slot Grid Container Responsif -->
                    <div id="gallery-slots-container" data-container="image-gallery-container" class="${(!primaryState.is_active || primaryState.card_variant) ? 'grid' : 'hidden'} grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-2.5 sm:gap-3">
                      ${renderGalleryThumbnails()}
                    </div>
                  </div>
                </div>

                <hr class="border-slate-100" />

                <!-- Poin 5: Nama Produk * -->
                <div class="space-y-3">
                  <div class="border-b border-slate-100 pb-2 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <label for="input-prod-name" class="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-black">5</span>
                        <span>Nama Produk</span> <span class="text-red-500">*</span>
                      </label>
                      <p class="text-xs text-slate-500 mt-0.5">Nama produk yang akan dilihat langsung oleh pelanggan di etalase web dan kasir.</p>
                    </div>
                    <!-- Dynamic Recommendation Badge -->
                    <span id="badge-title-recommendation" class="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                      ${primaryState.card_variant === 'B' ? 'Rekomendasi: 20 - 45 Karakter (1 Baris Ringkas & Tegas)' : 'Rekomendasi: 35 - 60 Karakter (2 Baris Seimbang)'}
                    </span>
                  </div>

                  <div>
                    <div class="flex justify-between items-center mb-1">
                      <label for="input-prod-name" class="block text-xs font-semibold text-slate-700">
                        Input Nama Lengkap Produk:
                      </label>
                      <span id="name-char-count" class="text-xs font-mono text-slate-400">0 / 150</span>
                    </div>
                    <input 
                      type="text" 
                      id="input-prod-name" 
                      maxlength="150"
                      value="${escapeHtml(primaryState.name)}"
                      placeholder="Contoh: Kemeja Formal Pria Premium, Tumbler Stainless Steel, Paket Hampers Spesial" 
                      class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-slate-800 text-sm font-medium transition outline-none"
                    />
                  </div>
                </div>

                <hr class="border-slate-100" />

                <!-- Poin 6: Tambah Label Khusus (Dilengkapi Ikon Mata, Tanpa Tombol 'Tampil di Kartu' Berteks) -->
                <div class="space-y-3">
                  <div class="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
                    <div>
                      <label class="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-black">6</span>
                        <span>Tambah Label Khusus</span>
                      </label>
                      <p class="text-[11px] text-slate-500 mt-0.5">Tampil berdampingan dengan rating bintang (4.9). Maksimal 2 slot terpasang.</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <button 
                        type="button" 
                        id="btn-toggle-badge-visibility" 
                        class="p-2 rounded-xl border transition cursor-pointer flex items-center justify-center ${primaryState.show_badge !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}"
                        title="Tampilkan / Sembunyikan Label di Kartu"
                      >
                        <i id="icon-badge-visibility" class="bi ${primaryState.show_badge !== false ? 'bi-eye' : 'bi-eye-slash'} text-base"></i>
                      </button>
                      <!-- Hidden sync input -->
                      <input type="checkbox" id="cfg-show-badge-blok-a" class="hidden" ${primaryState.show_badge !== false ? 'checked' : ''} />
                    </div>
                  </div>

                  <div class="space-y-1.5">
                    <span class="text-[11px] font-semibold text-slate-500">Preset Populer (1-Klik untuk Mengisi):</span>
                    <div class="flex flex-wrap gap-1.5">
                      <button type="button" class="btn-preset-label px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer" data-label="Free Ongkir">+ Free Ongkir</button>
                      <button type="button" class="btn-preset-label px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer" data-label="Best Seller">+ Best Seller</button>
                      <button type="button" class="btn-preset-label px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer" data-label="Paling Laris">+ Paling Laris</button>
                      <button type="button" class="btn-preset-label px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer" data-label="Garansi 100%">+ Garansi 100%</button>
                      <button type="button" class="btn-preset-label px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer" data-label="Siap 1 Jam">+ Siap 1 Jam</button>
                      <button type="button" class="btn-preset-label px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer" data-label="Diskon Spesial">+ Diskon Spesial</button>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                    <div>
                      <label for="input-custom-label-1" class="block text-[11px] font-semibold text-slate-600 mb-1">Slot Label 1:</label>
                      <input 
                        type="text" 
                        id="input-custom-label-1" 
                        list="custom-labels-history-list"
                        value="${escapeHtml(primaryState.custom_labels?.[0] || '')}" 
                        placeholder="Slot 1 (misal: Free Ongkir)" 
                        class="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 outline-none bg-white font-medium"
                      />
                    </div>
                    <div>
                      <label for="input-custom-label-2" class="block text-[11px] font-semibold text-slate-600 mb-1">Slot Label 2:</label>
                      <input 
                        type="text" 
                        id="input-custom-label-2" 
                        list="custom-labels-history-list"
                        value="${escapeHtml(primaryState.custom_labels?.[1] || '')}" 
                        placeholder="Slot 2 (misal: Best Seller)" 
                        class="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 outline-none bg-white font-medium"
                      />
                    </div>
                  </div>
                </div>

              </div>

              <!-- TOMBOL AKSI BAWAH STEP 1 -->
              <div class="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
                <button type="button" id="btn-step-1-cancel" class="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5">
                  <i class="bi bi-x-lg"></i>
                  <span>Batal</span>
                </button>
                <button type="button" id="btn-step-1-next" class="btn-primary-brand px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition cursor-pointer">
                  <span>Lanjutkan</span>
                  <i class="bi bi-arrow-right"></i>
                </button>
              </div>
            </div><!-- ============================================== -->
            <!-- STEP 2 PANE: PENETAPAN HARGA, VARIAN & INVENTARIS -->
            <!-- ============================================== -->
            <div id="step-pane-2" class="space-y-6 ${currentStep === 2 ? 'block' : 'hidden'}">
              
              <!-- KARTU 2.1: SKEMA FORMULA HARGA (WAJIB DITENTUKAN SEBAGAI GERBANG) -->
              <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
                <div class="border-b border-slate-100 pb-2">
                  <h2 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <i data-lucide="calculator" class="w-4 h-4 text-emerald-600"></i>
                    <span>Jenis Harga Produk</span> <span class="text-red-500">*</span>
                  </h2>
                  <p class="text-xs text-slate-500 mt-0.5">Tentukan formula perhitungan harga terlebih dahulu sebelum mengisi rincian varian produk.</p>
                </div>

                <div>
                  <select id="select-price-type" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:border-emerald-500 outline-none bg-white">
                    <option value="">-- Pilih Jenis Harga Produk --</option>
                    <option value="1" ${primaryState.price_type === 1 ? 'selected' : ''}>1. Meter (P x L cm) - Hitungan Luas Meter Persegi</option>
                    <option value="2" ${primaryState.price_type === 2 ? 'selected' : ''}>2. Kombinasi Bahan & Finishing (KombF)</option>
                    <option value="3" ${primaryState.price_type === 3 ? 'selected' : ''}>3. Harga Tetap Per Satuan / Fixed Unit</option>
                    <option value="4" ${primaryState.price_type === 4 ? 'selected' : ''}>4. Paket Bundel Layanan Komplit</option>
                    <option value="5" ${primaryState.price_type === 5 ? 'selected' : ''}>5. Bobot / Kilogram (Kg)</option>
                    <option value="6" ${primaryState.price_type === 6 ? 'selected' : ''}>6. Volume / Liter (Lt)</option>
                    <option value="7" ${primaryState.price_type === 7 ? 'selected' : ''}>7. Kuantitas Kelipatan Order (KombStep)</option>
                  </select>
                </div>

                <div id="price-type-hint-box" class="${primaryState.price_type ? 'block' : 'hidden'} p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                  <i data-lucide="info" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"></i>
                  <div id="price-type-hint-text">
                    ${getPriceTypeHint(primaryState.price_type || 1)}
                  </div>
                </div>

                <!-- Gate Notice jika harga belum ditentukan -->
                <div id="price-type-gate-notice" class="${primaryState.price_type ? 'hidden' : 'block'} p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                  <i class="bi bi-info-circle text-amber-600 shrink-0"></i>
                  <span>Silakan tentukan Jenis Harga Produk di atas terlebih dahulu untuk mengisi tabel varian dan inventaris.</span>
                </div>
              </div>

              <!-- KONTAINER GERBANG VARIAN: Tampil jika jenis harga telah dipilih -->
              <div id="step-2-variants-wrapper" class="${primaryState.price_type ? 'block' : 'hidden'} space-y-6">

                <!-- KARTU 2.2: TABEL VARIAN / BAHAN PRODUK (LAPISAN 1) -->
                <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                    <div>
                      <h3 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <i data-lucide="layers" class="w-4 h-4 text-emerald-600"></i>
                        <span>Jenis/Bahan Produk</span> <span class="text-red-500">*</span>
                      </h3>
                      <p class="text-xs text-slate-500 mt-0.5">Minimal 1 jenis/bahan wajib diisi. Masukkan harga jual dan biaya modal HPP.</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <button type="button" id="btn-apply-uniform-hpp" class="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer" title="Menyamakan nilai HPP baris pertama ke seluruh baris varian">
                        <i data-lucide="copy" class="w-3.5 h-3.5 text-emerald-600"></i>
                        <span>Terapkan HPP Sama Rata</span>
                      </button>
                      <button type="button" id="btn-add-material" class="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1 transition cursor-pointer">
                        <i data-lucide="plus" class="w-3.5 h-3.5"></i> Tambah Varian
                      </button>
                    </div>
                  </div>

                  <div class="overflow-x-auto border border-slate-200 rounded-xl">
                    <table class="w-full text-left text-xs">
                      <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th class="p-3 w-10 text-center">#</th>
                          <th class="p-3">Nama Varian / Bahan <span class="text-red-500">*</span></th>
                          <th class="p-3 w-36">Harga Jual (Rp) <span class="text-red-500">*</span></th>
                          ${isKombStep ? '<th class="p-3 w-28 bg-amber-50 text-amber-900">Kelipatan *</th>' : ''}
                          <th class="p-3 w-36" title="Biaya pokok HPP untuk kalkulasi margin keuntungan">Biaya Modal / HPP</th>
                          <th class="p-3 w-36 text-center" title="Margin keuntungan bersih per transaksi">Margin Laba</th>
                          <th class="p-3 w-14 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody id="materials-table-body" class="divide-y divide-slate-100">
                        ${renderMaterialsRows(isKombStep)}
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- KARTU 2.3: VARIASI PRODUK (LAPISAN 2) & ADD-ONS (LAPISAN 3) -->
                <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
                  <!-- Lapisan 2: Variasi Produk (Pilihan Wajib Pembeli) -->
                  <div class="space-y-3">
                    <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <h3 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i>
                          <span>Variasi Produk</span>
                        </h3>
                        <p class="text-xs text-slate-500 mt-0.5">'Standar / Tanpa Finishing', 'Level Kepedasan', 'Ukuran Lengan'</p>
                      </div>
                      <button type="button" id="btn-add-finishing-main" class="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1 transition cursor-pointer">
                        <i data-lucide="plus" class="w-3.5 h-3.5"></i> Tambah Variasi
                      </button>
                    </div>

                    <div class="overflow-x-auto border border-slate-200 rounded-xl">
                      <table class="w-full text-left text-xs">
                        <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <tr>
                            <th class="p-3 w-10 text-center">#</th>
                            <th class="p-3">Nama Variasi Wajib <span class="text-red-500">*</span></th>
                            <th class="p-3 w-36">Biaya Tambahan (Rp)</th>
                            <th class="p-3 w-36">Modal HPP Ekstra (Rp)</th>
                            <th class="p-3 w-14 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody id="finishings-main-table-body" class="divide-y divide-slate-100">
                          ${renderFinishingRows('main')}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <!-- Lapisan 3: Opsi Tambahan Bertingkat (Add-ons / Ekstra) dengan Trigger Checkbox -->
                  <div class="space-y-3 pt-4 border-t border-slate-100">
                    <div class="flex items-center justify-between">
                      <div>
                        <h3 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <i data-lucide="plus-square" class="w-4 h-4 text-emerald-600"></i>
                          <span>Lapisan 3 (Add-ons)</span>
                        </h3>
                        <p class="text-xs text-slate-500 mt-0.5">Pilihan opsional bebas dicentang pembeli (Kemasan Kotak Kado, Topping Ekstra, dsb.).</p>
                      </div>
                      <label class="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition select-none">
                        <input 
                          type="checkbox" 
                          id="toggle-has-layer-3" 
                          ${(finishingsState.extra_1?.length > 0 || finishingsState.extra_2?.length > 0 || finishingsState.extra_3?.length > 0 || primaryState.has_layer_3) ? 'checked' : ''} 
                          class="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                        />
                        <span>Buat Variasi tambahan lain</span>
                      </label>
                    </div>

                    <div id="layer-3-content-wrapper" class="${(finishingsState.extra_1?.length > 0 || finishingsState.extra_2?.length > 0 || finishingsState.extra_3?.length > 0 || primaryState.has_layer_3) ? 'grid' : 'hidden'} grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      ${renderFinishingExtraCard('extra_1', 'Ekstra Tingkat 1 (Level 1)', 'Contoh: Topping / Bungkus Kado')}
                      ${renderFinishingExtraCard('extra_2', 'Ekstra Tingkat 2 (Level 2)', 'Contoh: Box Kemasan Eksklusif / Sablon')}
                      ${renderFinishingExtraCard('extra_3', 'Ekstra Tingkat 3 (Level 3)', 'Contoh: Kartu Ucapan / Bubble Wrap')}
                    </div>
                  </div>
                </div>

                <!-- KARTU 2.4: JUMLAH PRODUK & BATAS MIN/MAX ORDER -->
                <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
                  <div class="border-b border-slate-100 pb-2">
                    <h2 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <i data-lucide="package" class="w-4 h-4 text-emerald-600"></i>
                      <span>Jumlah Produk & Batas Min/Max Order</span>
                    </h2>
                    <p class="text-xs text-slate-500 mt-0.5">Atur ketersediaan kuota inventaris dan batasan jumlah minimal/maksimal pemesanan.</p>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Batas Stok Produk -->
                    <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div class="flex items-center justify-between">
                        <div>
                          <label class="text-xs font-bold text-slate-800 block">Stok Fisik Produk</label>
                        </div>
                        <div class="flex items-center gap-2">
                          <span class="text-xs text-slate-600 font-medium">Tanpa Batas</span>
                          <input 
                            type="checkbox" 
                            id="toggle-unlimited-stock" 
                            ${primaryState.is_unlimited_stock ? 'checked' : ''} 
                            class="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div id="stock-input-wrapper" class="${primaryState.is_unlimited_stock ? 'hidden' : 'block'}">
                        <label for="input-stock-qty" class="block text-xs font-semibold text-slate-700 mb-1">Jumlah Kuota Stok Tersedia:</label>
                        <input 
                          type="number" 
                          id="input-stock-qty" 
                          min="0"
                          value="${primaryState.stock !== null ? primaryState.stock : 0}" 
                          class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold focus:border-emerald-500 outline-none bg-white"
                        />
                      </div>
                    </div>

                    <!-- Batasan Minimal & Maksimal Pesanan -->
                    <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label for="input-min-order" class="block text-xs font-bold text-slate-800 mb-1">
                            Min. Order <span class="text-red-500">*</span>
                          </label>
                          <input 
                            type="number" 
                            id="input-min-order" 
                            min="1"
                            value="${primaryState.min_order || 1}" 
                            class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold focus:border-emerald-500 outline-none bg-white"
                          />
                          <span class="text-[10px] text-slate-400 mt-0.5 block">Bawaan 1</span>
                        </div>
                        <div>
                          <label for="input-max-order" class="block text-xs font-bold text-slate-800 mb-1">
                            Max. Order (Opsional)
                          </label>
                          <input 
                            type="number" 
                            id="input-max-order" 
                            min="1"
                            value="${primaryState.max_order !== null ? primaryState.max_order : ''}" 
                            placeholder="Tak terbatas"
                            class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold focus:border-emerald-500 outline-none bg-white"
                          />
                          <span class="text-[10px] text-slate-400 mt-0.5 block">Kosongkan jika bebas</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <!-- KARTU 3.1: PROGRAM PROMO & JADWAL PROMO OTOMATIS -->
              <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
                <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h2 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <i data-lucide="badge-percent" class="w-4 h-4 text-emerald-600"></i>
                      <span>Program Promo, Diskon & Jadwal Otomatis</span>
                    </h2>
                    <p class="text-xs text-slate-500 mt-0.5">Aktifkan diskon berkala dengan potongan persentase (%) atau nominal tetap (Rp).</p>
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

                <div id="discount-controls-area" class="${primaryState.has_monthly_discount ? 'block' : 'hidden'} space-y-4 pt-1">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <!-- Label Promo Custom -->
                    <div>
                      <label for="input-monthly-promo-label" class="block text-xs font-semibold text-slate-700 mb-1">Label Teks Promo:</label>
                      <input 
                        type="text" 
                        id="input-monthly-promo-label" 
                        value="${escapeHtml(primaryState.monthly_promo_label || 'Promo Spesial')}"
                        placeholder="Promo Spesial"
                        class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-emerald-500 outline-none font-semibold"
                      />
                      <span class="text-[10px] text-slate-400 block mt-1">Label promo yang tampil di etalase pembeli.</span>
                    </div>

                    <!-- Bentuk & Nilai Potongan Diskon -->
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

                  <!-- JADWAL PROMO OTOMATIS -->
                  <div class="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2.5">
                    <div class="flex items-center gap-2">
                      <i data-lucide="calendar" class="w-4 h-4 text-emerald-700"></i>
                      <h4 class="text-xs font-bold text-emerald-950">Jadwal Promo Otomatis</h4>
                    </div>
                    <p class="text-[11px] text-emerald-800">
                      Tentukan rentang tanggal aktif promo. Promo otomatis nonaktif jika tanggal selesai telah lewat, tetapi tetap dapat dimatikan manual kapan saja.
                    </p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label for="input-promo-start-date" class="block text-[11px] font-bold text-slate-700 mb-1">
                          Tanggal Mulai Promo:
                        </label>
                        <input 
                          type="date" 
                          id="input-promo-start-date" 
                          value="${primaryState.promo_start_date || ''}" 
                          class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:border-emerald-500 outline-none bg-white"
                        />
                      </div>
                      <div>
                        <label for="input-promo-end-date" class="block text-[11px] font-bold text-slate-700 mb-1">
                          Tanggal Selesai Promo:
                        </label>
                        <input 
                          type="date" 
                          id="input-promo-end-date" 
                          value="${primaryState.promo_end_date || ''}" 
                          class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:border-emerald-500 outline-none bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- KARTU 3.2: KUSTOMISASI FOOTER KHUSUS (KHUSUS MODEL 3) -->
              <div 
                id="section-card-footer-config" 
                class="bg-white rounded-2xl border ${primaryState.card_variant === 'C' ? 'border-2 border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/10' : 'hidden'} shadow-xs p-5 space-y-4"
              >
                <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      <i data-lucide="panel-bottom" class="w-4 h-4"></i>
                    </div>
                    <div>
                      <h4 class="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>Kustomisasi Dua Strip Footer Kartu Produk</span>
                        <span id="badge-footer-active" class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white">
                          Khusus Model 3
                        </span>
                      </h4>
                      <p class="text-[11px] text-slate-500">Card Model 3 memiliki 2 baris footer melintang agar tinggi kartu etalase tetap sama presisi.</p>
                    </div>
                  </div>
                </div>

                <!-- Footer 1 (Strip Atas) -->
                <div class="p-3.5 rounded-xl bg-white border border-slate-200 space-y-3">
                  <div class="flex items-center justify-between pb-1 border-b border-slate-100">
                    <span class="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <i data-lucide="layers" class="w-3.5 h-3.5"></i>
                      Footer 1 (Strip Atas): Jaminan Kecepatan / Garansi
                    </span>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div class="sm:col-span-7">
                      <label for="input-card-footer-text" class="block text-xs font-semibold text-slate-700 mb-1">Teks Footer 1:</label>
                      <input 
                        type="text" 
                        id="input-card-footer-text" 
                        list="footer-texts-history-list"
                        value="${escapeHtml(primaryState.card_footer_text || 'Proses Hanya Dalam 1Jam')}" 
                        class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 outline-none bg-white font-medium"
                      />
                    </div>
                    <div class="sm:col-span-5">
                      <label for="select-card-footer-icon" class="block text-xs font-semibold text-slate-700 mb-1">Saran Ikon Footer 1:</label>
                      <select id="select-card-footer-icon" class="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 outline-none bg-white font-medium">
                        <option value="truck" ${primaryState.footer_badge_icon === 'truck' || !primaryState.footer_badge_icon ? 'selected' : ''}>Kirim Cepat (truck)</option>
                        <option value="clock" ${primaryState.footer_badge_icon === 'clock' ? 'selected' : ''}>Jam / Waktu (clock)</option>
                        <option value="zap" ${primaryState.footer_badge_icon === 'zap' ? 'selected' : ''}>Kilat / Express (zap)</option>
                        <option value="shield-check" ${primaryState.footer_badge_icon === 'shield-check' ? 'selected' : ''}>Garansi Presisi (shield-check)</option>
                        <option value="sparkles" ${primaryState.footer_badge_icon === 'sparkles' ? 'selected' : ''}>Kualitas HD (sparkles)</option>
                        <option value="award" ${primaryState.footer_badge_icon === 'award' ? 'selected' : ''}>Terbaik (award)</option>
                        <option value="star" ${primaryState.footer_badge_icon === 'star' ? 'selected' : ''}>Rating Unggul (star)</option>
                        <option value="check-circle" ${primaryState.footer_badge_icon === 'check-circle' ? 'selected' : ''}>Terverifikasi (check-circle)</option>
                      </select>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Latar Footer 1</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="cfg-footer-bg-color" value="${primaryState.footer_bg_color || '#059669'}" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" id="cfg-footer-bg-hex" value="${primaryState.footer_bg_color || '#059669'}" class="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Warna Teks 1</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="cfg-footer-text-color" value="${primaryState.footer_text_color || '#ffffff'}" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" id="cfg-footer-text-hex" value="${primaryState.footer_text_color || '#ffffff'}" class="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Footer 2 (Strip Bawah) -->
                <div class="p-3.5 rounded-xl bg-white border border-slate-200 space-y-3">
                  <div class="flex items-center justify-between pb-1 border-b border-slate-100">
                    <span class="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <i data-lucide="panel-bottom" class="w-3.5 h-3.5"></i>
                      Footer 2 (Strip Bawah): Variasi Paket / Wadah Countdown Diskon
                    </span>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div class="sm:col-span-7">
                      <label for="input-card-footer-2-text" class="block text-xs font-semibold text-slate-700 mb-1">Teks Footer 2:</label>
                      <input 
                        type="text" 
                        id="input-card-footer-2-text" 
                        list="footer-texts-history-list"
                        value="${escapeHtml(primaryState.card_footer_2_text || 'Variasi Paket Tersedia/tidak tersedia')}" 
                        class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 outline-none bg-white font-medium"
                      />
                    </div>
                    <div class="sm:col-span-5">
                      <label for="select-card-footer-2-icon" class="block text-xs font-semibold text-slate-700 mb-1">Saran Ikon Footer 2:</label>
                      <select id="select-card-footer-2-icon" class="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 outline-none bg-white font-medium">
                        <option value="minus" ${primaryState.footer_2_badge_icon === 'minus' || !primaryState.footer_2_badge_icon ? 'selected' : ''}>Strip / Variasi (minus)</option>
                        <option value="layers" ${primaryState.footer_2_badge_icon === 'layers' ? 'selected' : ''}>Pilihan Paket (layers)</option>
                        <option value="shield-check" ${primaryState.footer_2_badge_icon === 'shield-check' ? 'selected' : ''}>Garansi Uang Kembali (shield-check)</option>
                        <option value="check-circle" ${primaryState.footer_2_badge_icon === 'check-circle' ? 'selected' : ''}>Siap Kirim (check-circle)</option>
                        <option value="box" ${primaryState.footer_2_badge_icon === 'box' ? 'selected' : ''}>Packing Aman (box)</option>
                        <option value="award" ${primaryState.footer_2_badge_icon === 'award' ? 'selected' : ''}>Best Seller (award)</option>
                      </select>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Latar Footer 2</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="cfg-footer-2-bg-color" value="${primaryState.footer_2_bg_color || '#047857'}" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" id="cfg-footer-2-bg-hex" value="${primaryState.footer_2_bg_color || '#047857'}" class="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Warna Teks 2</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="cfg-footer-2-text-color" value="${primaryState.footer_2_text_color || '#ffffff'}" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" id="cfg-footer-2-text-hex" value="${primaryState.footer_2_text_color || '#ffffff'}" class="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- KARTU 3.4: DESKRIPSI PRODUK & AI GENERATOR (DITEMPATKAN DI AKHIR STEP 3) -->
              <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
                <div class="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
                  <div>
                    <h2 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <i data-lucide="file-text" class="w-4 h-4 text-emerald-600"></i>
                      <span>Deskripsi Produk & AI Generator</span> <span class="text-red-500">*</span>
                    </h2>
                    <p class="text-xs text-slate-500 mt-0.5">Sistem AI mengekstrak data nama, model etalase, varian bahan, dan promo yang telah Anda isi sebelumnya.</p>
                  </div>
                  <!-- AI Trigger Button: CLEAN BOOTSTRAP ICON, NO UNICODE SPARKLE -->
                  <button 
                    type="button" 
                    id="btn-ai-generate-desc" 
                    class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xs hover:shadow-emerald-200 transition cursor-pointer"
                    title="Rangkai deskripsi produk secara otomatis dengan AI berdasarkan konteks formulir"
                  >
                    <i class="bi bi-stars"></i>
                    <span id="btn-ai-desc-text">Buat Deskripsi dengan AI</span>
                  </button>
                </div>

                <div>
                  <textarea 
                    id="input-prod-desc" 
                    rows="5" 
                    placeholder="Jelaskan spesifikasi produk, keunggulan bahan, durasi pengerjaan, dan catatan penting untuk pemesan..."
                    class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-slate-800 text-sm transition outline-none resize-y"
                  >${escapeHtml(primaryState.description)}</textarea>

                  <!-- Kontainer Pratinjau Hasil AI (Default Hidden) -->
                  <div id="ai-description-preview-box" class="hidden mt-3 bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-3 transition">
                    <div class="flex items-center justify-between pb-2 border-b border-emerald-100 flex-wrap gap-2">
                      <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs shadow-xs">
                          <i class="bi bi-stars"></i>
                        </div>
                        <span class="text-xs font-bold text-slate-900">Hasil Rangkaian Deskripsi AI</span>
                      </div>
                      <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">Pratinjau Siap Digunakan</span>
                    </div>

                    <!-- Area Teks Pratinjau -->
                    <div id="ai-description-preview-text" class="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-white/95 p-3.5 rounded-lg border border-emerald-100 max-h-64 overflow-y-auto font-sans selection:bg-emerald-100"></div>

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
              </div>

              <!-- TOMBOL AKSI STEP 2 (AKHIR FORMULIR: KEMBALI & SIMPAN PRODUK) -->
              <div class="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
                <button type="button" id="btn-step-2-prev" class="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 cursor-pointer">
                  <i class="bi bi-arrow-left"></i>
                  <span>Kembali</span>
                </button>
                <button type="button" id="btn-submit-product" class="btn-primary-brand px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-2 transition cursor-pointer">
                  <span id="btn-submit-spinner" class="hidden w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <i id="btn-submit-icon" class="bi bi-floppy"></i>
                  <span id="btn-submit-text">Simpan Produk</span>
                </button>
              </div>

            </div>
          </div>
        </div>

        <!-- DESKTOP FIXED OFF-CANVAS PREVIEW SIDEBAR (DOCK KANAN SEJATI) -->
        <aside id="desktop-preview-sidebar" class="fixed right-0 top-16 h-[calc(100vh-4rem)] w-[380px] xl:w-[420px] bg-white border-l border-slate-200 shadow-none z-30 flex flex-col transition-transform duration-300 ease-in-out max-lg:hidden ${isLivePreviewOpen && primaryState.is_active ? 'translate-x-0' : 'translate-x-full'}">
          
          <!-- Sticky Header Sidebar -->
          <div class="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/90 shrink-0">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                <i data-lucide="eye" class="w-4 h-4 text-emerald-600"></i>
              </div>
              <span id="sidebar-preview-title" class="text-xs font-extrabold text-slate-800 leading-tight block">Preview<br>Kartu Produk</span>
            </div>
            <button type="button" id="btn-toggle-preview-sidebar" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer" title="Tutup Panel Preview">
              <i data-lucide="chevrons-right" class="w-4 h-4"></i>
            </button>
          </div>

          <!-- Body Sidebar (Scrollable) -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4">
            <!-- Checkbox Simulasi Diskon ON -->
            <label class="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-[11px] font-bold text-slate-700 cursor-pointer hover:bg-emerald-50/50 transition shadow-2xs">
              <input type="checkbox" id="cfg-simulate-countdown-preview" class="w-3.5 h-3.5 text-emerald-600 rounded cursor-pointer" />
              <span><i class="bi bi-lightning-charge text-amber-500 mr-1.5"></i> Simulasikan Diskon ON</span>
            </label>

            <!-- Card Live Box Container -->
            <div class="flex justify-center w-full py-3 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
              <div id="product-card-preview-container" class="w-full max-w-[240px]">
                <div id="card-live-preview-box">
                  <!-- Rendered dynamically -->
                </div>
              </div>
            </div>

            <!-- Visual Customization Controls: [Default] dan [Ubah Kartu] (Step 1 Only) -->
            <div id="card-customization-section" class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <i class="bi bi-palette text-emerald-600"></i>
                  Desain Kartu
                </span>
                <div class="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200">
                  <button type="button" id="tab-card-design-default" class="px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer bg-white text-emerald-800 shadow-2xs">
                    Default
                  </button>
                  <button type="button" id="tab-card-design-custom" class="px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer text-slate-600 hover:text-slate-900">
                    Ubah Kartu
                  </button>
                </div>
              </div>

              <!-- Customization Panel (Default Sembunyi, Tampil jika Ubah Kartu Aktif) -->
              <div id="panel-card-custom-content" class="hidden space-y-3.5 pt-1">
                <!-- Color Tokens -->
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Latar Belakang</label>
                    <div class="flex items-center gap-1.5">
                      <input type="color" id="cfg-bg-color" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-bg-text" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Border</label>
                    <div class="flex items-center gap-1.5">
                      <input type="color" id="cfg-border-color" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-border-text" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Judul</label>
                    <div class="flex items-center gap-1.5">
                      <input type="color" id="cfg-title-color" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-title-text" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Harga</label>
                    <div class="flex items-center gap-1.5">
                      <input type="color" id="cfg-price-color" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-price-text" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tombol Beli</label>
                    <div class="flex items-center gap-1.5">
                      <input type="color" id="cfg-btn-color" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-btn-text" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Radius Sudut</label>
                    <select id="cfg-border-radius" class="w-full px-1.5 py-1 text-[11px] border border-slate-200 rounded outline-none bg-white">
                      <option value="0px">0px (Kotak)</option>
                      <option value="8px">8px (Kecil)</option>
                      <option value="16px">16px (Sedang)</option>
                      <option value="24px">24px (Besar)</option>
                    </select
                  </div>
                </div>

                <!-- Feature Toggles -->
                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                  <label class="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
                    <input type="checkbox" id="cfg-show-rating" class="w-3.5 h-3.5 text-emerald-600 rounded" /> <span><i class="bi bi-star-fill text-amber-400 text-[10px] mr-1"></i>Rating</span>
                  </label>
                  <label class="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
                    <input type="checkbox" id="cfg-show-sales" class="w-3.5 h-3.5 text-emerald-600 rounded" /> Terjual
                  </label>
                  <label class="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
                    <input type="checkbox" id="cfg-show-strike" class="w-3.5 h-3.5 text-emerald-600 rounded" /> Harga Coret
                  </label>
                  <label class="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
                    <input type="checkbox" id="cfg-show-discount-badge" class="w-3.5 h-3.5 text-emerald-600 rounded" /> Diskon Foto
                  </label>
                  <label class="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
                    <input type="checkbox" id="cfg-show-ticket-icon" class="w-3.5 h-3.5 text-emerald-600 rounded" /> Ikon Tiket
                  </label>
                  <label class="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
                    <input type="checkbox" id="cfg-show-badge" class="w-3.5 h-3.5 text-emerald-600 rounded" /> Label Khusus
                  </label>
                </div>

                <!-- Footer Model 3 Styling (Tampil jika Model 3 Aktif di Desktop Sidebar) -->
                <div id="cfg-panel-footer-model3" class="${primaryState.card_variant === 'C' ? '' : 'hidden'} pt-2.5 border-t border-slate-100 space-y-2.5">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                      <i data-lucide="layers" class="w-3 h-3 text-emerald-600"></i>
                      Footer Dua Strip (Model 3)
                    </span>
                    <span class="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono">Model 3</span>
                  </div>
                  <!-- Strip 1 -->
                  <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div class="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                      <i data-lucide="panel-bottom" class="w-3 h-3 text-emerald-600"></i> Strip 1 (Atas)
                    </div>
                    <div>
                      <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Teks Footer 1</label>
                      <input type="text" id="input-card-footer-text-side" value="${escapeHtml(primaryState.card_footer_text || 'Proses Hanya Dalam 1Jam')}" class="w-full px-2 py-1 text-xs rounded border border-slate-200 focus:border-emerald-500 outline-none bg-white font-medium" />
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Latar Footer 1</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-footer-bg-color-side" value="${primaryState.footer_bg_color || '#059669'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-footer-bg-hex-side" value="${primaryState.footer_bg_color || '#059669'}" class="w-full px-1.5 py-0.5 text-[10px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Teks 1</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-footer-text-color-side" value="${primaryState.footer_text_color || '#ffffff'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-footer-text-hex-side" value="${primaryState.footer_text_color || '#ffffff'}" class="w-full px-1.5 py-0.5 text-[10px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <!-- Strip 2 -->
                  <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div class="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                      <i data-lucide="minus" class="w-3 h-3 text-emerald-600"></i> Strip 2 (Bawah)
                    </div>
                    <div>
                      <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Teks Footer 2</label>
                      <input type="text" id="input-card-footer-2-text-side" value="${escapeHtml(primaryState.card_footer_2_text || 'Variasi Paket Tersedia/tidak tersedia')}" class="w-full px-2 py-1 text-xs rounded border border-slate-200 focus:border-emerald-500 outline-none bg-white font-medium" />
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Latar Footer 2</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-footer-2-bg-color-side" value="${primaryState.footer_2_bg_color || '#047857'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-footer-2-bg-hex-side" value="${primaryState.footer_2_bg_color || '#047857'}" class="w-full px-1.5 py-0.5 text-[10px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Teks 2</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-footer-2-text-color-side" value="${primaryState.footer_2_text_color || '#ffffff'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-footer-2-text-hex-side" value="${primaryState.footer_2_text_color || '#ffffff'}" class="w-full px-1.5 py-0.5 text-[10px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Save as Default Options & Button -->
                <div class="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                  <label class="flex items-center gap-2 text-[11px] font-bold text-emerald-800 cursor-pointer select-none">
                    <input type="checkbox" id="cfg-save-as-default-toggle" class="w-3.5 h-3.5 text-emerald-600 rounded cursor-pointer" />
                    <span id="label-save-as-default-desk">Gunakan desain ini Sebagai Default kartu (${primaryState.card_variant === 'B' ? 'Model 2' : (primaryState.card_variant === 'C' ? 'Model 3' : 'Model 1')})</span>
                  </label>
                  <button type="button" id="btn-save-card-design" class="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
                    <i class="bi bi-check-lg"></i>
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </aside>

        <!-- FLOATING STRIP BUTTON TO EXPAND DESKTOP SIDEBAR WHEN CLOSED -->
        <button type="button" id="btn-expand-preview-sidebar" class="${isLivePreviewOpen || !primaryState.is_active ? 'hidden' : 'hidden lg:flex'} fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-3.5 px-2.5 rounded-l-2xl shadow-2xl flex flex-col items-center gap-2 cursor-pointer transition select-none group" title="Buka Live Preview">
          <i class="bi bi-eye text-base group-hover:scale-110 transition-transform"></i>
          <span class="text-[11px] font-extrabold uppercase tracking-wider" style="writing-mode: vertical-rl; text-orientation: mixed;">Live Preview</span>
        </button>
        <!-- MOBILE FLOATING ACTION BUTTON (FAB) -->
        <button type="button" id="btn-fab-live-preview" class="lg:hidden fixed bottom-6 right-6 z-40 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 active:scale-95 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-bold transition cursor-pointer">
          <i class="bi bi-eye text-base"></i>
          <span>Live Preview</span>
        </button>

        <!-- MOBILE BOTTOM SHEET / DRAWER -->
        <div id="mobile-preview-backdrop" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 hidden transition-opacity"></div>
        <div id="mobile-preview-sheet" class="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 max-h-[88vh] flex flex-col transform translate-y-full transition-transform duration-300 ease-out">
          <div class="p-4 pb-2 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                <i class="bi bi-eye"></i>
              </div>
              <div>
                <span id="mobile-preview-title" class="text-xs sm:text-sm font-extrabold text-slate-800 leading-tight block">Preview<br>Kartu Produk</span>
                <p class="text-[10px] text-slate-400 mt-0.5">Pratinjau tampilan di etalase web toko pembeli.</p>
              </div>
            </div>
            <button type="button" id="btn-close-mobile-preview" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
          <div class="overflow-y-auto p-4 space-y-4 flex flex-col items-center">
            <!-- Checkbox Simulasi Diskon Mobile -->
            <label class="w-full max-w-[260px] p-2 rounded-xl bg-white border border-slate-200 flex items-center gap-2 text-[11px] font-bold text-slate-700 cursor-pointer hover:bg-emerald-50/50 transition shadow-2xs">
              <input type="checkbox" id="cfg-simulate-countdown-preview-mob" class="w-3.5 h-3.5 text-emerald-600 rounded cursor-pointer" />
              <span><i class="bi bi-lightning-charge text-amber-500 mr-1.5"></i> Simulasikan Diskon ON</span>
            </label>

            <!-- Card Preview Box -->
            <div class="w-full max-w-[260px]">
              <div id="mobile-card-preview-container">
                <!-- Rendered dynamically -->
              </div>
            </div>

            <!-- Panel Kustomisasi Desain Mobile: [Default] dan [Ubah Kartu] (Step 1 Only) -->
            <div id="card-customization-section-mob" class="w-full max-w-[340px] bg-slate-50/70 rounded-2xl border border-slate-200 p-3.5 space-y-3 text-left">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <i class="bi bi-palette text-emerald-600"></i>
                  Desain Kartu
                </span>
                <div class="inline-flex p-0.5 rounded-lg bg-white border border-slate-200">
                  <button type="button" id="tab-card-design-default-mob" class="px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer bg-slate-100 text-emerald-800 shadow-2xs">
                    Default
                  </button>
                  <button type="button" id="tab-card-design-custom-mob" class="px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer text-slate-600 hover:text-slate-900">
                    Ubah Kartu
                  </button>
                </div>
              </div>

              <!-- Panel Kustomisasi Mobile (Default Sembunyi, Tampil jika Ubah Kartu Aktif) -->
              <div id="panel-card-custom-content-mob" class="hidden space-y-3.5 pt-1">
                <!-- Color Tokens Mobile -->
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Latar Belakang</label>
                    <div class="flex items-center gap-1.5">
                      <input type="color" id="cfg-bg-color-mob" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-bg-text-mob" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Border</label>
                    <div class="flex items-center gap-1.5">
                      <input type="color" id="cfg-border-color-mob" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-border-text-mob" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Judul</label>
                    <div class="flex items-center gap-1.5">
                      <input type="color" id="cfg-title-color-mob" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-title-text-mob" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Harga</label>
                    <div class="flex items-center gap-1.5">
                      <input type="color" id="cfg-price-color-mob" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-price-text-mob" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tombol Beli</label>
                    <div class="flex items-center gap-1.5">
                      <input type="color" id="cfg-btn-color-mob" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-btn-text-mob" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Radius Sudut</label>
                    <select id="cfg-border-radius-mob" class="w-full px-1.5 py-1 text-[11px] border border-slate-200 rounded outline-none bg-white">
                      <option value="0px">0px (Kotak)</option>
                      <option value="8px">8px (Kecil)</option>
                      <option value="16px">16px (Sedang)</option>
                      <option value="24px">24px (Besar)</option>
                    </select>
                  </div>
                </div>

                <!-- Feature Toggles Mobile -->
                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                  <label class="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
                    <input type="checkbox" id="cfg-show-rating-mob" class="w-3.5 h-3.5 text-emerald-600 rounded" />
                    <span><i class="bi bi-star-fill text-amber-400 text-[10px] mr-1"></i>Rating</span>
                  </label>
                  <label class="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
                    <input type="checkbox" id="cfg-show-sales-mob" class="w-3.5 h-3.5 text-emerald-600 rounded" />
                    <span>Terjual</span>
                  </label>
                  <label class="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
                    <input type="checkbox" id="cfg-show-strike-mob" class="w-3.5 h-3.5 text-emerald-600 rounded" />
                    <span>Harga Coret</span>
                  </label>
                  <label class="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
                    <input type="checkbox" id="cfg-show-discount-badge-mob" class="w-3.5 h-3.5 text-emerald-600 rounded" />
                    <span>Diskon Foto</span>
                  </label>
                  <label class="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
                    <input type="checkbox" id="cfg-show-ticket-icon-mob" class="w-3.5 h-3.5 text-emerald-600 rounded" />
                    <span>Ikon Tiket</span>
                  </label>
                  <label class="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
                    <input type="checkbox" id="cfg-show-badge-mob" class="w-3.5 h-3.5 text-emerald-600 rounded" />
                    <span>Label Khusus</span>
                  </label>
                </div>

                <!-- Footer Model 3 Styling Mobile (Tampil jika Model 3 Aktif) -->
                <div id="cfg-panel-footer-model3-mob" class="${primaryState.card_variant === 'C' ? '' : 'hidden'} pt-2.5 border-t border-slate-200 space-y-2.5">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                      <i data-lucide="layers" class="w-3 h-3 text-emerald-600"></i>
                      Footer Dua Strip (Model 3)
                    </span>
                    <span class="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono">Model 3</span>
                  </div>
                  <!-- Strip 1 -->
                  <div class="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2">
                    <div class="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                      <i data-lucide="panel-bottom" class="w-3 h-3 text-emerald-600"></i> Strip 1 (Atas)
                    </div>
                    <div>
                      <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Teks Footer 1</label>
                      <input type="text" id="input-card-footer-text-mob" value="${escapeHtml(primaryState.card_footer_text || 'Proses Hanya Dalam 1Jam')}" class="w-full px-2 py-1 text-xs rounded border border-slate-200 focus:border-emerald-500 outline-none bg-white font-medium" />
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Latar Footer 1</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-footer-bg-color-mob" value="${primaryState.footer_bg_color || '#059669'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-footer-bg-hex-mob" value="${primaryState.footer_bg_color || '#059669'}" class="w-full px-1.5 py-0.5 text-[10px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Teks 1</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-footer-text-color-mob" value="${primaryState.footer_text_color || '#ffffff'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-footer-text-hex-mob" value="${primaryState.footer_text_color || '#ffffff'}" class="w-full px-1.5 py-0.5 text-[10px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <!-- Strip 2 -->
                  <div class="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2">
                    <div class="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                      <i data-lucide="minus" class="w-3 h-3 text-emerald-600"></i> Strip 2 (Bawah)
                    </div>
                    <div>
                      <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Teks Footer 2</label>
                      <input type="text" id="input-card-footer-2-text-mob" value="${escapeHtml(primaryState.card_footer_2_text || 'Variasi Paket Tersedia/tidak tersedia')}" class="w-full px-2 py-1 text-xs rounded border border-slate-200 focus:border-emerald-500 outline-none bg-white font-medium" />
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Latar Footer 2</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-footer-2-bg-color-mob" value="${primaryState.footer_2_bg_color || '#047857'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-footer-2-bg-hex-mob" value="${primaryState.footer_2_bg_color || '#047857'}" class="w-full px-1.5 py-0.5 text-[10px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Teks 2</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="cfg-footer-2-text-color-mob" value="${primaryState.footer_2_text_color || '#ffffff'}" class="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                          <input type="text" id="cfg-footer-2-text-hex-mob" value="${primaryState.footer_2_text_color || '#ffffff'}" class="w-full px-1.5 py-0.5 text-[10px] font-mono border border-slate-200 rounded bg-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Save Default Options & Button Mobile -->
                <div class="pt-3 border-t border-slate-200 flex flex-col gap-2.5">
                  <label class="flex items-center gap-2 text-[11px] font-bold text-emerald-800 cursor-pointer select-none">
                    <input type="checkbox" id="cfg-save-as-default-toggle-mob" class="w-3.5 h-3.5 text-emerald-600 rounded cursor-pointer" />
                    <span id="label-save-as-default-mob">Gunakan desain ini Sebagai Default kartu (${primaryState.card_variant === 'B' ? 'Model 2' : (primaryState.card_variant === 'C' ? 'Model 3' : 'Model 1')})</span>
                  </label>
                  <button type="button" id="btn-save-card-design-mob" class="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
                    <i class="bi bi-check-lg"></i>
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- MODAL MINI: TAMBAH KATEGORI BARU CEPAT -->
        <div id="modal-quick-add-category" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 hidden">
          <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 sm:p-6 space-y-4 animate-scaleIn">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  <i data-lucide="folder-plus" class="w-4 h-4"></i>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-slate-900">Tambah Kategori Baru</h3>
                  <p class="text-[11px] text-slate-500">Buat kategori instan tanpa keluar dari formulir.</p>
                </div>
              </div>
              <button type="button" id="btn-close-quick-cat" class="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            </div>

            <div>
              <label for="input-quick-cat-name" class="block text-xs font-semibold text-slate-700 mb-1">
                Nama Kategori <span class="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                id="input-quick-cat-name" 
                placeholder="Contoh: Pakaian & Fashion / Elektronik / Makanan & Minuman" 
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-sm font-medium outline-none transition" 
              />
              <p id="quick-cat-error-msg" class="hidden text-[11px] font-semibold text-red-600 mt-1"></p>
            </div>

            <div class="flex items-center justify-end gap-2.5 pt-2">
              <button type="button" id="btn-cancel-quick-cat" class="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer">
                Batal
              </button>
              <button type="button" id="btn-save-quick-cat" class="btn-primary-brand px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition cursor-pointer">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
                <span>Simpan & Pilih</span>
              </button>
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
    const btnUseDefMob = document.getElementById('btn-card-use-default-mob');
    const btnCustomMob = document.getElementById('btn-card-custom-design-mob');
    const isDef = primaryState.use_default_card_design !== false;
    const defClass = 'px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-emerald-600 text-white shadow-xs';
    const nonDefClass = 'px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-white text-slate-700 border border-slate-300 hover:bg-slate-100';

    if (btnUseDef) btnUseDef.className = isDef ? defClass : nonDefClass;
    if (btnCustom) btnCustom.className = !isDef ? defClass : nonDefClass;
    if (btnUseDefMob) btnUseDefMob.className = isDef ? defClass : nonDefClass;
    if (btnCustomMob) btnCustomMob.className = !isDef ? defClass : nonDefClass;
  }

  function getCardConfigFromDOM() {
    const badgeMain = document.getElementById('cfg-show-badge');
    const badgeMob = document.getElementById('cfg-show-badge-mob');
    const badgeBlokA = document.getElementById('cfg-show-badge-blok-a');
    let showBadgeVal = true;
    if (badgeMain) showBadgeVal = badgeMain.checked;
    else if (badgeMob) showBadgeVal = badgeMob.checked;
    else if (badgeBlokA) showBadgeVal = badgeBlokA.checked;

    const enableCountdownVal = document.getElementById('cfg-enable-countdown')?.checked !== false;

    const getVal = (id1, id2, fallback) => {
      const el1 = document.getElementById(id1);
      if (el1 && el1.value) return el1.value;
      const el2 = document.getElementById(id2);
      if (el2 && el2.value) return el2.value;
      return fallback;
    };
    const getChk = (id1, id2) => {
      const el1 = document.getElementById(id1);
      if (el1) return el1.checked !== false;
      const el2 = document.getElementById(id2);
      if (el2) return el2.checked !== false;
      return true;
    };

    return {
      bg_color: getVal('cfg-bg-color', 'cfg-bg-color-mob', '#ffffff'),
      border_color: getVal('cfg-border-color', 'cfg-border-color-mob', '#e2e8f0'),
      border_radius: getVal('cfg-border-radius', 'cfg-border-radius-mob', '16px'),
      title_color: getVal('cfg-title-color', 'cfg-title-color-mob', '#0f172a'),
      price_color: getVal('cfg-price-color', 'cfg-price-color-mob', '#059669'),
      btn_color: getVal('cfg-btn-color', 'cfg-btn-color-mob', '#059669'),
      show_rating: getChk('cfg-show-rating', 'cfg-show-rating-mob'),
      show_sales_count: getChk('cfg-show-sales', 'cfg-show-sales-mob'),
      show_strikethrough_price: getChk('cfg-show-strike', 'cfg-show-strike-mob'),
      show_discount_badge: getChk('cfg-show-discount-badge', 'cfg-show-discount-badge-mob'),
      show_ticket_icon: getChk('cfg-show-ticket-icon', 'cfg-show-ticket-icon-mob'),
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

    const shouldSaveDefault = forceSaveAsDefault || (document.getElementById("cfg-save-as-default-toggle")?.checked === true) || (document.getElementById("cfg-save-as-default-toggle-mob")?.checked === true);
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
    const name = (nameInput?.value || primaryState.name || '').trim() || 'Nama Produk Unggulan';

    const catSelect = document.getElementById('select-prod-cat');
    const catId = catSelect?.value || primaryState.category_id;
    const allCats = DB.getCategories ? DB.getCategories() : [];
    const matchedCat = allCats.find(c => c.id === catId);
    const catName = matchedCat ? matchedCat.name : 'Katalog Pilihan';

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
    const simulateCountdown = (document.getElementById("cfg-simulate-countdown-preview")?.checked === true) || (document.getElementById("cfg-simulate-countdown-preview-mob")?.checked === true);
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
    if (curPt === 1) unitLabel = '/ m2';
    else if (curPt === 2) unitLabel = '/ lbr';
    else if (curPt === 5) unitLabel = '/ kg';
    else if (curPt === 6) unitLabel = '/ lt';

    // Dynamic Header Preview Title (Step 1: Kartu Produk, Step 2: Detail Produk)
    const sidebarTitle = document.getElementById('sidebar-preview-title');
    const mobileTitle = document.getElementById('mobile-preview-title');
    if (sidebarTitle) {
      sidebarTitle.innerHTML = currentStep === 2 ? 'Preview<br>Detail Produk' : 'Preview<br>Kartu Produk';
    }
    if (mobileTitle) {
      mobileTitle.innerHTML = currentStep === 2 ? 'Preview<br>Detail Produk' : 'Preview<br>Kartu Produk';
    }

    // Toggle Customization Section (Hanya tampil saat di Step 1)
    const cardCustomizationSection = document.getElementById('card-customization-section');
    const cardCustomizationSectionMob = document.getElementById('card-customization-section-mob');
    if (cardCustomizationSection) {
      if (currentStep === 2) cardCustomizationSection.classList.add('hidden');
      else cardCustomizationSection.classList.remove('hidden');
    }
    if (cardCustomizationSectionMob) {
      if (currentStep === 2) cardCustomizationSectionMob.classList.add('hidden');
      else cardCustomizationSectionMob.classList.remove('hidden');
    }

    // 5. Gambar produk & placeholder visual default <i class="bi bi-box-seam"></i>
    const hasPhoto = Boolean((primaryState.images && primaryState.images.length > 0) || primaryState.image_url);
    const img = (primaryState.images && primaryState.images.length > 0)
      ? primaryState.images[0]
      : (primaryState.image_url || null);

    const renderCardPhoto = (aspectRatioClass) => {
      if (hasPhoto && img) {
        return `
          <div class="relative w-full ${aspectRatioClass} bg-slate-100 overflow-hidden cursor-pointer shrink-0">
            <img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" alt="${escapeHtml(name)}" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400\\'><i class=\\'bi bi-box-seam text-4xl mb-1 text-slate-300\\'></i><span class=\\'text-[10px] font-semibold text-slate-400\\'>Foto Produk</span></div>';" />
            ${(effHasDiscount && cfg.show_discount_badge) ? `
              <div class="absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 shadow-md uppercase tracking-wider flex items-center justify-center z-10 leading-none" style="${discBadgeStyle}">
                <span>- % ${effDiscPercent}</span>
              </div>
            ` : ''}
          </div>
        `;
      } else {
        return `
          <div class="relative w-full ${aspectRatioClass} bg-slate-100 overflow-hidden flex flex-col items-center justify-center text-slate-400 shrink-0">
            <i class="bi bi-box-seam text-4xl mb-1 text-slate-300"></i>
            <span class="text-[10px] font-semibold text-slate-400">Foto Produk</span>
            ${(effHasDiscount && cfg.show_discount_badge) ? `
              <div class="absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 shadow-md uppercase tracking-wider flex items-center justify-center z-10 leading-none" style="${discBadgeStyle}">
                <span>- % ${effDiscPercent}</span>
              </div>
            ` : ''}
          </div>
        `;
      }
    };

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
          ${renderCardPhoto('aspect-square')}

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
                  <span class="text-amber-500 font-bold text-[10px] sm:text-[11px] flex items-center gap-0.5"><i class="bi bi-star-fill text-amber-400 text-[10px]"></i> 4.9</span>
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
          ${renderCardPhoto('aspect-[4/3] rounded-t-2xl')}

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
                  <span class="text-amber-500 font-bold text-[10px] sm:text-[11px] flex items-center gap-0.5"><i class="bi bi-star-fill text-amber-400 text-[10px]"></i> 4.9</span>
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
          ${renderCardPhoto('aspect-square')}

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
                  <span class="text-amber-500 font-bold text-[10px] sm:text-[11px] flex items-center gap-0.5"><i class="bi bi-star-fill text-amber-400 text-[10px]"></i> 4.9</span>
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


    // SIMULASI MINI PDP DETAIL PRODUK (KHUSUS STEP 2)
    if (currentStep === 2) {
      let accentColor = '#059669'; // Default Model 1 Emerald
      if (variant === 'B') {
        accentColor = '#0f172a'; // Model 2 Dark Slate
      } else if (variant === 'C') {
        accentColor = primaryState.footer_bg_color || '#047857'; // Model 3 Teal
      }
      if (cfg && cfg.btn_color) {
        accentColor = cfg.btn_color;
      }

      const miniPdpHtml = `
        <div class="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left flex flex-col font-sans transition-all">
          <!-- Foto Utama Produk -->
          <div class="relative w-full aspect-square bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
            ${(hasPhoto && img) ? `
              <img src="${img}" class="w-full h-full object-cover" alt="${escapeHtml(name)}" />
            ` : `
              <div class="flex flex-col items-center justify-center text-slate-300 gap-1.5 p-6 text-center">
                <i class="bi bi-box-seam text-4xl text-slate-300"></i>
                <span class="text-[10px] font-semibold text-slate-400">Belum ada foto</span>
              </div>
            `}
            ${effHasDiscount ? `
              <span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[10px] font-extrabold text-white shadow-xs leading-none" style="background-color: ${accentColor};">
                Diskon ${effDiscPercent}%
              </span>
            ` : ''}
            <span class="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-900/60 backdrop-blur-xs text-white">
              1 / ${Math.max(1, (primaryState.images || []).length)} Foto
            </span>
          </div>

          <div class="p-3.5 space-y-3">
            <!-- Judul & Harga -->
            <div>
              <h3 class="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                ${escapeHtml(name)}
              </h3>
              <div class="flex items-baseline gap-2 mt-1.5 flex-wrap">
                <span class="text-sm sm:text-base font-extrabold" style="color: ${accentColor};">
                  ${formatIDR(effFinalPrice)}
                </span>
                ${effHasDiscount ? `
                  <span class="text-[11px] line-through text-slate-400 font-normal">
                    ${formatIDR(origStrikePrice)}
                  </span>
                ` : ''}
              </div>
            </div>

            <!-- Pilihan Variasi / Bahan Dasar -->
            <div class="space-y-1.5 pt-2 border-t border-slate-100">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Pilihan Variasi / Bahan:</span>
              <div class="flex flex-wrap gap-1.5">
                ${(materialsState && materialsState.length > 0) ? materialsState.map((m, idx) => `
                  <span class="px-2 py-1 rounded-lg text-[10px] font-semibold transition ${idx === 0 ? 'text-white shadow-2xs' : 'bg-slate-100 text-slate-700 border border-slate-200'}" style="${idx === 0 ? `background-color: ${accentColor};` : ''}">
                    ${escapeHtml(m.name || `Pilihan ${idx + 1}`)}
                  </span>
                `).join('') : `
                  <span class="text-[10px] text-slate-400 italic">Belum ada bahan ditambahkan</span>
                `}
              </div>
            </div>

            <!-- Estimasi Pengiriman -->
            <div class="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-[10px] text-slate-600">
              <i class="bi bi-truck text-xs" style="color: ${accentColor};"></i>
              <span class="font-medium">${primaryState.product_type === 'non_physical' ? 'Layanan Digital / Tanpa Pengiriman Fisik' : 'Estimasi Pengiriman: 1-2 Hari Kerja'}</span>
            </div>

            <!-- Deskripsi Singkat -->
            <div class="space-y-1 pt-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Deskripsi Produk:</span>
              <p class="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                ${escapeHtml(primaryState.description ? primaryState.description.trim() : 'Deskripsi produk belum diisi. Informasi lengkap spesifikasi dan petunjuk pemesanan akan tampil di sini.')}
              </p>
            </div>

            <!-- Tombol Beli / Keranjang -->
            <div class="pt-2 flex gap-2">
              <button type="button" class="flex-1 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition flex items-center justify-center gap-1.5 cursor-default pointer-events-none" style="background-color: ${accentColor};">
                <i class="bi bi-cart-plus text-xs"></i>
                <span>Beli Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      `;

      previewContainer.innerHTML = miniPdpHtml;
      const mobilePreviewBox = document.getElementById('mobile-card-preview-container');
      if (mobilePreviewBox) {
        mobilePreviewBox.innerHTML = miniPdpHtml;
      }
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    previewContainer.innerHTML = cardHtml;
    const mobilePreviewBox = document.getElementById('mobile-card-preview-container');
    if (mobilePreviewBox) {
      mobilePreviewBox.innerHTML = cardHtml;
    }
    if (window.lucide) window.lucide.createIcons();
  }

  function renderGalleryThumbnails() {
    const images = Array.isArray(primaryState.images) ? primaryState.images : [];
    const isLandscape = primaryState.image_aspect_ratio === '4:3';
    const aspectClass = isLandscape ? 'aspect-[4/3]' : 'aspect-square';

    let html = '';

    images.slice(0, 10).forEach((imgSrc, idx) => {
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
                ${slotNum}/10
              </span>
            `}

            <!-- Tombol Hapus (Target Sentuh Nyaman min 28-32px) -->
            <button type="button" class="btn-delete-gallery-img pointer-events-auto w-7 h-7 flex items-center justify-center rounded-lg bg-black/60 hover:bg-red-600 active:bg-red-700 text-white backdrop-blur-xs transition shadow cursor-pointer ml-auto" data-action="delete-photo" data-idx="${idx}" title="Hapus foto ini">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <!-- Bottom Bar: Overlay Navigasi Slide & Jadikan Cover -->
          <div class="absolute bottom-0 inset-x-0 pt-6 pb-1.5 px-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between gap-1 z-10 sm:opacity-90 sm:group-hover:opacity-100 transition-opacity">
            <!-- Geser Kiri -->
            ${canMoveLeft ? `
              <button type="button" class="btn-move-left-image w-6 h-6 sm:w-6.5 sm:h-6.5 flex items-center justify-center rounded-md bg-white/20 hover:bg-white text-white hover:text-slate-900 backdrop-blur-xs transition cursor-pointer shrink-0" data-action="move-left" data-idx="${idx}" title="Geser ke kiri (urutan sebelumnya)">
                <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
              </button>
            ` : `
              <div class="w-6 shrink-0"></div>
            `}

            <!-- Tombol Jadikan Cover (Jika Bukan Foto #1) -->
            ${!isMain ? `
              <button type="button" class="btn-set-main-image flex-1 bg-white/95 hover:bg-emerald-500 text-slate-800 hover:text-white active:scale-95 text-[9px] sm:text-[10px] font-bold py-1 px-1 rounded-md shadow transition text-center truncate flex items-center justify-center gap-1 cursor-pointer" data-action="set-cover" data-idx="${idx}" title="Jadikan foto ini sebagai Foto Utama / Cover">
                <i data-lucide="check" class="w-3 h-3 shrink-0"></i>
                <span class="truncate">Cover</span>
              </button>
            ` : `
              <span class="text-[9px] font-bold text-white/90 uppercase tracking-widest text-center truncate">1/10</span>
            `}

            <!-- Geser Kanan -->
            ${canMoveRight ? `
              <button type="button" class="btn-move-right-image w-6 h-6 sm:w-6.5 sm:h-6.5 flex items-center justify-center rounded-md bg-white/20 hover:bg-white text-white hover:text-slate-900 backdrop-blur-xs transition cursor-pointer shrink-0" data-action="move-right" data-idx="${idx}" title="Geser ke kanan (urutan berikutnya)">
                <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
              </button>
            ` : `
              <div class="w-6 shrink-0"></div>
            `}
          </div>
        </div>
      `;
    });

    // Kotak Slot Terakhir (Jika foto < 10): Menjadi tombol tambah / dropzone
    if (images.length < 10) {
      const isFirstSlot = images.length === 0;

      html += `
        <div id="btn-slot-add-photo" data-action="add-photo" class="relative ${aspectClass} rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 bg-slate-50/70 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group text-center p-2.5 select-none shadow-2xs" title="Unggah foto produk baru (${images.length}/10)">
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white group-hover:bg-emerald-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-700 shadow-xs mb-1 transition-transform group-hover:scale-110">
            <i data-lucide="camera" class="w-4 h-4 sm:w-5 sm:h-5"></i>
          </div>
          <span class="text-xs font-bold text-slate-700 group-hover:text-emerald-800 transition leading-tight">
            ${isFirstSlot ? '+ Foto Utama' : '+ Tambah Foto'}
          </span>
          <span class="text-[10px] font-semibold text-slate-400 group-hover:text-emerald-600 transition font-mono mt-0.5">
            (${images.length}/10)
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
      case 1: return 'Tipe 1 (Meter): Luas dihitung (Panjang cm x Lebar cm) / 10000. Jika luas < 1 m2, otomatis dihitung minimal 1 m2. Finishing slongsong +18cm.';
      case 2: return 'Tipe 2 (KombF): Menghitung per lembar/pcs dengan menjumlahkan Harga Bahan + Finishing Utama + Finishing Tambahan.';
      case 3: return 'Tipe 3 (Fixed): Harga flat per unit item.';
      case 4: return 'Tipe 4 (Paket): Harga dasar paket bundling komplit dikurangi diskon promo.';
      case 5: return 'Tipe 5 (Kg): Harga jual dihitung berdasarkan bobot berat kilogram.';
      case 6: return 'Tipe 6 (Lt): Harga jual dihitung berdasarkan volume liter.';
      case 7: return 'Tipe 7 (KombStep): Wajib memenuhi batas kelipatan order! Kolom "Kelipatan" di tabel bahan otomatis aktif untuk mengatur step kelipatan.';
      default: return '';
    }
  }

  function calculateMarginBadge(price, cost) {
    const p = parseFloat(price) || 0;
    const c = parseFloat(cost) || 0;
    if (p <= 0 && c <= 0) {
      return `<span class="live-margin-badge px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[10px] font-medium">-</span>`;
    }
    const profit = p - c;
    const percent = p > 0 ? Math.round((profit / p) * 100) : 0;
    if (profit >= 0) {
      return `<span class="live-margin-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]" title="Margin Keuntungan Bersih: Rp ${profit.toLocaleString('id-ID')} (${percent}%)">Rp ${profit.toLocaleString('id-ID')} (${percent}%)</span>`;
    } else {
      return `<span class="live-margin-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 font-bold text-[10px]" title="Margin Negatif (Rugi): -Rp ${Math.abs(profit).toLocaleString('id-ID')} (${percent}%)">-Rp ${Math.abs(profit).toLocaleString('id-ID')} (${percent}%)</span>`;
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
              placeholder="Contoh: Katun Combed / Ukuran L / Warna Hitam" 
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
          <td class="p-3 text-center align-middle">
            <div class="row-margin-badge-container">
              ${calculateMarginBadge(mat.price, mat.cost_price)}
            </div>
          </td>
          <td class="p-3 text-center">
            <button 
              type="button" 
              class="btn-delete-mat text-slate-400 hover:text-red-600 transition p-1 disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
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
              placeholder="Contoh: Standar Pabrik / Kemasan Box / Custom Sablon" 
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
    const { name, categoryName, subCategoryName, materials, cardVariantName, startPriceText } = context;

    // Simulasi delay pemrosesan AI (500ms) untuk responsivitas visual yang mulus
    await new Promise(resolve => setTimeout(resolve, 500));

    const catBadge = subCategoryName ? `${categoryName} > ${subCategoryName}` : (categoryName || 'Katalog Pilihan');

    // Rangkum daftar bahan dari repeater
    let matsText = 'Material pilihan berkualitas tinggi dengan durabilitas prima';
    if (Array.isArray(materials) && materials.length > 0) {
      const validNames = materials.map(m => m.name).filter(Boolean);
      if (validNames.length > 0) {
        matsText = validNames.join(', ');
      }
    }

    const priceLine = startPriceText ? `\n- Estimasi Harga Mulai: ${startPriceText}` : '';
    const variantLine = cardVariantName ? `\n- Format Etalase: ${cardVariantName}` : '';

    return `${name} - Kualitas Terbaik & Desain Profesional

Hadirkan solusi terbaik untuk kebutuhan Anda dengan ${name}. Dikerjakan dengan teliti dan presisi tinggi menggunakan standar industri modern, produk ini dirancang untuk memberikan performa maksimal, estetika memikat, dan daya tahan optimal.

 SPESIFIKASI PRODUK:
- Kategori: ${catBadge}
- Pilihan Varian / Bahan: ${matsText}${priceLine}${variantLine}
- Standar Pengerjaan: Rapi, presisi, dan melalui tahap inspeksi kualitas (Quality Control) teliti sebelum dikemas.

 KEUNGGULAN PRODUK:
 Material pilihan berkualitas unggul, kuat, dan awet untuk pemakaian jangka panjang
 Hasil visual tajam, warna solid, dan detail rapi sesuai ekspektasi
 Fleksibel untuk berbagai keperluan personal, operasional bisnis, maupun promosi komersial
 Harga transparan dengan jaminan kepuasan pelanggan

 PANDUAN & KETENTUAN PEMESANAN:
1. Pastikan memilih varian bahan dan opsi finishing yang tepat sebelum melakukan checkout pesanan.
2. Setiap pesanan diproses secara higienis, aman, dan dikemas dengan proteksi terbaik agar sampai dalam kondisi sempurna.
3. Memerlukan konsultasi khusus atau pesanan dalam kuantitas besar? Hubungi layanan pelanggan kami melalui fitur chat yang tersedia.`;
  }

  function bindFormEvents() {
    // -------------------------------------------------------------
    // Helper: Validasi & Navigasi Antar-Langkah Wizard (Step 1-3)
    // -------------------------------------------------------------
    function showWizardErrorBanner(errors) {
      const errorBanner = document.getElementById('form-error-banner');
      const errorList = document.getElementById('form-error-list');
      if (errorBanner && errorList) {
        errorList.innerHTML = errors.map(e => `<li>${e}</li>`).join('');
        errorBanner.classList.remove('hidden');
        errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        if (window.lucide) window.lucide.createIcons();
      }
    }

    function hideWizardErrorBanner() {
      const errorBanner = document.getElementById('form-error-banner');
      if (errorBanner) errorBanner.classList.add('hidden');
    }

    function updateStepVisibility() {
      const p1 = document.getElementById('step-pane-1');
      const p2 = document.getElementById('step-pane-2');
      const p3 = document.getElementById('step-pane-3');
      if (p1) p1.className = `space-y-6 ${currentStep === 1 ? 'block' : 'hidden'}`;
      if (p2) p2.className = `space-y-6 ${currentStep === 2 ? 'block' : 'hidden'}`;
      if (p3) p3.className = 'hidden';

      if (window.lucide) window.lucide.createIcons();
      updateProductCardLivePreview();
    }

    function goToStep(step) {
      if (step < 1 || step > 2) return;

      if (step > currentStep) {
        if (currentStep === 1) {
          syncStateFromDOM();
          const s1Errors = [];
          
          // 1. Jenis Produk / Layanan wajib dipilih
          if (!primaryState.product_type || (primaryState.product_type !== 'physical' && primaryState.product_type !== 'non_physical')) {
            s1Errors.push('Pilih Jenis Produk / Layanan terlebih dahulu (Fisik atau Non Fisik).');
          }
          // 2. Jika is_active === true, Model Kartu wajib dipilih
          if (primaryState.is_active && !primaryState.card_variant) {
            s1Errors.push('Pilih Jenis Model Kartu Produk terlebih dahulu.');
          }
          // 3. Minimal 1 Foto Produk terunggah
          if (!primaryState.images || primaryState.images.length === 0) {
            s1Errors.push('Foto produk wajib diunggah minimal 1 foto sebagai cover.');
          }
          // 4. Nama Produk tidak boleh kosong
          if (!primaryState.name || primaryState.name.trim() === '') {
            s1Errors.push('Nama Produk wajib diisi.');
          }

          if (s1Errors.length > 0) {
            showWizardErrorBanner(s1Errors);
            return;
          }
        }
      }

      hideWizardErrorBanner();
      currentStep = step;
      updateStepVisibility();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Navigasi Tombol Aksi Step
    const btnStep1Next = document.getElementById('btn-step-1-next');
    if (btnStep1Next) btnStep1Next.addEventListener('click', () => goToStep(2));

    const btnStep1Cancel = document.getElementById('btn-step-1-cancel');
    if (btnStep1Cancel) {
      btnStep1Cancel.addEventListener('click', () => {
        if (confirm('Tinggalkan formulir? Perubahan yang belum disimpan akan hilang.')) {
          App.navigate('list');
        }
      });
    }

    const btnStep2Prev = document.getElementById('btn-step-2-prev');
    if (btnStep2Prev) btnStep2Prev.addEventListener('click', () => goToStep(1));

    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // Responsivitas Sidebar & Drawer Live Preview
    // -------------------------------------------------------------
    const btnToggleSidebar = document.getElementById('btn-toggle-preview-sidebar');
    const btnExpandSidebar = document.getElementById('btn-expand-preview-sidebar');
    const sidebar = document.getElementById('desktop-preview-sidebar');
    const wizardCol = document.getElementById('wizard-form-col');

    function setSidebarState(isOpen) {
      if (!primaryState.is_active && isOpen) return;
      isLivePreviewOpen = isOpen;
      if (isOpen) {
        if (sidebar) {
          sidebar.classList.remove('translate-x-full');
          sidebar.classList.add('translate-x-0');
        }
        if (btnExpandSidebar) {
          btnExpandSidebar.classList.add('hidden');
          btnExpandSidebar.classList.remove('lg:flex');
        }
        if (wizardCol) {
          wizardCol.classList.add('lg:pr-[400px]', 'xl:pr-[440px]');
        }
      } else {
        if (sidebar) {
          sidebar.classList.remove('translate-x-0');
          sidebar.classList.add('translate-x-full');
        }
        if (btnExpandSidebar) {
          if (primaryState.is_active) {
            btnExpandSidebar.classList.remove('hidden');
            btnExpandSidebar.classList.add('lg:flex');
          } else {
            btnExpandSidebar.classList.add('hidden');
            btnExpandSidebar.classList.remove('lg:flex');
          }
        }
        if (wizardCol) {
          wizardCol.classList.remove('lg:pr-[400px]', 'xl:pr-[440px]');
        }
      }
    }

    function updateStorefrontVisibility(isActive) {
      primaryState.is_active = Boolean(isActive);
      const fabMob = document.getElementById('btn-fab-live-preview');
      const sectionPoint3 = document.getElementById('section-card-model-point3');
      const galleryLock = document.getElementById('gallery-locked-notice');
      const gallerySlots = document.getElementById('gallery-slots-container');

      if (primaryState.is_active) {
        // ON: Tampilkan Poin 3 (Pilih Jenis Model Kartu)
        if (sectionPoint3) sectionPoint3.classList.remove('hidden');

        // Jika model kartu belum dipilih, kunci galeri; jika sudah, buka
        if (!primaryState.card_variant) {
          if (galleryLock) galleryLock.classList.remove('hidden');
          if (gallerySlots) {
            gallerySlots.classList.add('hidden');
            gallerySlots.classList.remove('grid');
          }
        } else {
          if (galleryLock) galleryLock.classList.add('hidden');
          if (gallerySlots) {
            gallerySlots.classList.remove('hidden');
            gallerySlots.classList.add('grid');
          }
        }

        if (fabMob) fabMob.classList.remove('hidden');
        if (isLivePreviewOpen) {
          setSidebarState(true);
        } else {
          if (btnExpandSidebar) {
            btnExpandSidebar.classList.remove('hidden');
            btnExpandSidebar.classList.add('lg:flex');
          }
        }
      } else {
        // OFF: Sembunyikan Poin 3 dan otomatis buka kunci galeri foto dengan rasio 1:1
        if (sectionPoint3) sectionPoint3.classList.add('hidden');
        if (galleryLock) galleryLock.classList.add('hidden');
        if (gallerySlots) {
          gallerySlots.classList.remove('hidden');
          gallerySlots.classList.add('grid');
        }
        setPhotoAspectRatio('1:1', false);

        // Langsung tutup paksa Sidebar Live Preview, sembunyikan tombol expand & FAB, tutup mobile drawer
        setSidebarState(false);
        if (btnExpandSidebar) {
          btnExpandSidebar.classList.add('hidden');
          btnExpandSidebar.classList.remove('lg:flex');
        }
        if (fabMob) {
          fabMob.classList.add('hidden');
        }
        closeMobilePreview();
      }
    }

    ProductForm.setSidebarState = setSidebarState;
    ProductForm.updateStorefrontVisibility = updateStorefrontVisibility;

    if (btnToggleSidebar) {
      btnToggleSidebar.addEventListener('click', () => setSidebarState(false));
    }
    if (btnExpandSidebar) {
      btnExpandSidebar.addEventListener('click', () => setSidebarState(true));
    }
    // Mobile Bottom Sheet / Drawer
    const btnFabLivePreview = document.getElementById('btn-fab-live-preview');
    const btnCloseMobilePreview = document.getElementById('btn-close-mobile-preview');
    const mobileBackdrop = document.getElementById('mobile-preview-backdrop');
    const mobileSheet = document.getElementById('mobile-preview-sheet');

    function openMobilePreview() { if (!primaryState.is_active) return;
      // Aturan Saling Tutup: Jika Sidebar Menu Toko sedang terbuka di layar kecil/mobile, otomatis tutup
      const sidebarEl = document.getElementById('admin-main-sidebar');
      const backdropSidebar = document.getElementById('sidebar-mobile-backdrop');
      if (sidebarEl && !sidebarEl.classList.contains('-translate-x-full')) {
        sidebarEl.classList.add('-translate-x-full');
      }
      if (backdropSidebar && !backdropSidebar.classList.contains('hidden')) {
        backdropSidebar.classList.add('hidden');
      }

      updateProductCardLivePreview();
      if (mobileBackdrop) mobileBackdrop.classList.remove('hidden');
      if (mobileSheet) mobileSheet.classList.remove('translate-y-full');
    }

    function closeMobilePreview() {
      if (mobileSheet) mobileSheet.classList.add('translate-y-full');
      if (mobileBackdrop) mobileBackdrop.classList.add('hidden');
    }

    if (btnFabLivePreview) btnFabLivePreview.addEventListener('click', openMobilePreview);
    if (btnCloseMobilePreview) btnCloseMobilePreview.addEventListener('click', closeMobilePreview);
    if (mobileBackdrop) mobileBackdrop.addEventListener('click', closeMobilePreview);

    // Aturan Saling Tutup: Jika hamburger sidebar utama diklik, otomatis tutup drawer preview jika sedang terbuka
    const btnHambDesk = document.getElementById('btn-sidebar-hamburger');
    const btnHambMob = document.getElementById('btn-sidebar-hamburger-mobile');
    [btnHambDesk, btnHambMob].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          closeMobilePreview();
        });
      }
    });

    // Expose closeMobilePreview globally for other modules (admin-app.js)
    ProductForm.closeMobilePreview = closeMobilePreview;

    // -------------------------------------------------------------
    // Modal Mini Quick Add Category (Tanpa Reload)
    // -------------------------------------------------------------
    const btnQuickCat = document.getElementById('btn-quick-add-category');
    const modalQuickCat = document.getElementById('modal-quick-add-category');
    const btnCloseQuickCat = document.getElementById('btn-close-quick-cat');
    const btnCancelQuickCat = document.getElementById('btn-cancel-quick-cat');
    const btnSaveQuickCat = document.getElementById('btn-save-quick-cat');
    const inputQuickCatName = document.getElementById('input-quick-cat-name');
    const errorQuickCat = document.getElementById('quick-cat-error-msg');

    function openQuickCatModal() {
      if (inputQuickCatName) inputQuickCatName.value = '';
      if (errorQuickCat) {
        errorQuickCat.textContent = '';
        errorQuickCat.classList.add('hidden');
      }
      if (modalQuickCat) modalQuickCat.classList.remove('hidden');
      setTimeout(() => { if (inputQuickCatName) inputQuickCatName.focus(); }, 100);
    }

    function closeQuickCatModal() {
      if (modalQuickCat) modalQuickCat.classList.add('hidden');
    }

    if (btnQuickCat) {
      btnQuickCat.addEventListener('click', (e) => {
        e.preventDefault();
        openQuickCatModal();
      });
    }
    if (btnCloseQuickCat) btnCloseQuickCat.addEventListener('click', closeQuickCatModal);
    if (btnCancelQuickCat) btnCancelQuickCat.addEventListener('click', closeQuickCatModal);
    if (modalQuickCat) {
      modalQuickCat.addEventListener('click', (e) => {
        if (e.target === modalQuickCat) closeQuickCatModal();
      });
    }

    if (btnSaveQuickCat) {
      btnSaveQuickCat.addEventListener('click', () => {
        const catName = (inputQuickCatName?.value || '').trim();
        if (!catName) {
          if (errorQuickCat) {
            errorQuickCat.textContent = 'Nama kategori tidak boleh kosong!';
            errorQuickCat.classList.remove('hidden');
          }
          return;
        }

        try {
          const newCat = DB.createCategory({ name: catName });
          const catSelect = document.getElementById('select-prod-cat');
          if (catSelect) {
            const opt = document.createElement('option');
            opt.value = newCat.id;
            opt.textContent = newCat.name;
            opt.selected = true;
            catSelect.appendChild(opt);
            primaryState.category_id = newCat.id;
            catSelect.dispatchEvent(new Event('change'));
          }
          closeQuickCatModal();
          if (typeof App !== 'undefined' && App.showToast) {
            App.showToast(`Kategori "${newCat.name}" berhasil dibuat dan dipilih!`, 'success');
          }
        } catch (err) {
          if (errorQuickCat) {
            errorQuickCat.textContent = err.message || 'Gagal menyimpan kategori baru';
            errorQuickCat.classList.remove('hidden');
          }
        }
      });
    }

    // -------------------------------------------------------------
    // Tombol: Terapkan HPP Sama Rata ke Semua Varian & Live Margins
    // -------------------------------------------------------------
    function bindMaterialInputsMarginLive() {
      document.querySelectorAll('#materials-table-body tr').forEach(row => {
        const priceInp = row.querySelector('[data-field="price"]');
        const costInp = row.querySelector('[data-field="cost_price"]');
        const badgeCont = row.querySelector('.row-margin-badge-container');

        const updateRowBadge = () => {
          if (badgeCont && priceInp && costInp) {
            badgeCont.innerHTML = calculateMarginBadge(priceInp.value, costInp.value);
          }
          syncStateFromDOM();
          updateProductCardLivePreview();
        };

        if (priceInp) priceInp.addEventListener('input', updateRowBadge);
        if (costInp) costInp.addEventListener('input', updateRowBadge);
      });
    }
    bindMaterialInputsMarginLive();

    const btnUniformHpp = document.getElementById('btn-apply-uniform-hpp');
    if (btnUniformHpp) {
      btnUniformHpp.addEventListener('click', () => {
        let sourceHPP = 0;
        const firstCostInp = document.querySelector('#materials-table-body tr:first-child [data-field="cost_price"]');
        if (firstCostInp && parseFloat(firstCostInp.value) > 0) {
          sourceHPP = parseFloat(firstCostInp.value);
        } else if (materialsState.length > 0 && materialsState[0].cost_price > 0) {
          sourceHPP = materialsState[0].cost_price;
        } else {
          const promptVal = prompt('Masukkan nominal Biaya Modal HPP yang akan diterapkan ke SEMUA varian (Rp):', '10000');
          if (promptVal === null) return;
          sourceHPP = parseFloat(promptVal.replace(/[^0-9]/g, '')) || 0;
        }

        materialsState.forEach(m => {
          m.cost_price = sourceHPP;
        });

        document.querySelectorAll('#materials-table-body tr').forEach(row => {
          const costInp = row.querySelector('[data-field="cost_price"]');
          if (costInp) costInp.value = sourceHPP;
          const priceInp = row.querySelector('[data-field="price"]');
          const badgeCont = row.querySelector('.row-margin-badge-container');
          if (badgeCont && priceInp) {
            badgeCont.innerHTML = calculateMarginBadge(priceInp.value, sourceHPP);
          }
        });

        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast(`Biaya Modal HPP Rp ${sourceHPP.toLocaleString('id-ID')} berhasil diseragamkan ke semua varian!`, 'success');
        }
      });
    }

    // -------------------------------------------------------------
    // Dynamic Title Recommendation Badge
    // -------------------------------------------------------------
    function updateTitleRecommendationBadge(variantCode) {
      const badge = document.getElementById('badge-title-recommendation');
      if (!badge) return;
      const v = variantCode || primaryState.card_variant || 'A';
      if (v === 'B') {
        badge.textContent = 'Rekomendasi: 20 - 45 Karakter (1 Baris Ringkas & Tegas)';
      } else {
        badge.textContent = 'Rekomendasi: 35 - 60 Karakter (2 Baris Seimbang)';
      }
    }

    // Back & Cancel Global
    const backBtn = document.getElementById('btn-back-to-list');
    const cancelBtn = document.getElementById('btn-cancel-form');

    [backBtn, cancelBtn].forEach(b => {
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

        const variantName = primaryState.card_variant === 'B' ? 'Model 2 (Bold & Clean)' : (primaryState.card_variant === 'C' ? 'Model 3 (Informative Showcase)' : 'Model 1 (Universal Standard)');
        let startPriceText = '';
        if (materialsState.length > 0 && materialsState[0].price > 0) {
          startPriceText = formatIDR(materialsState[0].price);
        }

        btnAiGen.disabled = true;
        btnAiGen.classList.add('opacity-75', 'cursor-not-allowed');
        const originalBtnHTML = '<i class="bi bi-stars"></i> <span id="btn-ai-desc-text">Buat Deskripsi dengan AI</span>';
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
            cardVariantName: variantName,
            startPriceText: startPriceText,
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

      // 3. Produk Fisik Reguler & Ritel / Default -> Model 1 ('A')
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
            labelWrapper.className = 'p-3.5 rounded-xl border border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 cursor-pointer transition space-y-1.5 block select-none';
          } else {
            labelWrapper.className = 'p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition space-y-1.5 block select-none';
          }
          const textSpan = labelWrapper.querySelector('span');
          if (textSpan) {
            textSpan.className = `font-bold text-xs ${rad.checked ? 'text-emerald-900' : 'text-slate-800'}`;
          }
        }
      });

      const badgeLabel = document.getElementById('label-active-card-preview');
      if (badgeLabel) badgeLabel.textContent = variantCode === 'A' ? 'Model 1' : variantCode === 'B' ? 'Model 2' : 'Model 3';
      const cfgLabel = document.getElementById('label-active-card-cfg');
      if (cfgLabel) cfgLabel.textContent = `(Model ${variantCode === 'A' ? '1' : (variantCode === 'B' ? '2' : '3')})`;

      // Toggle Footer Section Visibility (Khusus Card Model 3 / C)
      const footerSection = document.getElementById('section-card-footer-config');
      if (footerSection) {
        if (variantCode === 'C') {
          footerSection.className = 'bg-white rounded-2xl border-2 border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/10 shadow-xs p-5 space-y-4';
        } else {
          footerSection.className = 'hidden';
        }
      }
      const panelF3Desk = document.getElementById('cfg-panel-footer-model3');
      if (panelF3Desk) {
        if (variantCode === 'C') panelF3Desk.classList.remove('hidden');
        else panelF3Desk.classList.add('hidden');
      }
      const panelF3Mob = document.getElementById('cfg-panel-footer-model3-mob');
      if (panelF3Mob) {
        if (variantCode === 'C') panelF3Mob.classList.remove('hidden');
        else panelF3Mob.classList.add('hidden');
      }

      const autoRatio = (variantCode === 'C') ? '4:3' : '1:1';
      setPhotoAspectRatio(autoRatio, false);

      const ratioText = document.getElementById('gallery-ratio-text');
      if (ratioText) {
        ratioText.textContent = autoRatio === '4:3' ? '4:3 (Lanskap)' : '1:1 (Persegi)';
      }

      updateTitleRecommendationBadge(variantCode);
      loadCardConfigInputs(variantCode);

      // Update label dinamis default kartu di desktop & mobile
      const lblSaveDesk = document.getElementById('label-save-as-default-desk');
      const lblSaveMob = document.getElementById('label-save-as-default-mob');
      const modelNameText = variantCode === 'B' ? 'Model 2' : (variantCode === 'C' ? 'Model 3' : 'Model 1');
      if (lblSaveDesk) lblSaveDesk.textContent = `Gunakan desain ini Sebagai Default kartu (${modelNameText})`;
      if (lblSaveMob) lblSaveMob.textContent = `Gunakan desain ini Sebagai Default kartu (${modelNameText})`;

      // Pastikan checkbox default selalu false (unchecked) setiap kali model diubah
      const saveDefToggle = document.getElementById('cfg-save-as-default-toggle');
      const saveDefToggleMob = document.getElementById('cfg-save-as-default-toggle-mob');
      if (saveDefToggle) saveDefToggle.checked = false;
      if (saveDefToggleMob) saveDefToggleMob.checked = false;

      // Unlock photo gallery after card model selected
      const galleryLock = document.getElementById('gallery-locked-notice');
      const gallerySlots = document.getElementById('gallery-slots-container');
      if (galleryLock) galleryLock.classList.add('hidden');
      if (gallerySlots) {
        gallerySlots.classList.remove('hidden');
        gallerySlots.classList.add('grid');
      }

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

    // Material Price and Name live listeners for live card preview
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

    // Card Config Listeners (Desktop & Mobile Sync)
    const cfgInputs = ['bg', 'border', 'title', 'price', 'btn'].flatMap(prefix => [`cfg-${prefix}-color`, `cfg-${prefix}-text`]);
    cfgInputs.push('cfg-border-radius');
    cfgInputs.forEach(id => {
      const el = document.getElementById(id);
      const elMob = document.getElementById(`${id}-mob`);

      if (el) {
        el.addEventListener('input', (e) => {
          if (id.endsWith('-color')) {
            const textId = id.replace('-color', '-text');
            const textEl = document.getElementById(textId);
            if (textEl) textEl.value = e.target.value;
            const mobColor = document.getElementById(`${id}-mob`);
            if (mobColor) mobColor.value = e.target.value;
            const mobText = document.getElementById(`${textId}-mob`);
            if (mobText) mobText.value = e.target.value;
          } else if (id.endsWith('-text')) {
            const colorId = id.replace('-text', '-color');
            const colorEl = document.getElementById(colorId);
            if (colorEl) colorEl.value = e.target.value;
            const mobText = document.getElementById(`${id}-mob`);
            if (mobText) mobText.value = e.target.value;
            const mobColor = document.getElementById(`${colorId}-mob`);
            if (mobColor) mobColor.value = e.target.value;
          } else if (id === 'cfg-border-radius') {
            const mobRadius = document.getElementById('cfg-border-radius-mob');
            if (mobRadius) mobRadius.value = e.target.value;
          }
          saveCardConfigInputs();
          updateProductCardLivePreview();
        });
      }

      if (elMob) {
        elMob.addEventListener('input', (e) => {
          if (id.endsWith('-color')) {
            const textId = id.replace('-color', '-text');
            const mobText = document.getElementById(`${textId}-mob`);
            if (mobText) mobText.value = e.target.value;
            const deskColor = document.getElementById(id);
            if (deskColor) deskColor.value = e.target.value;
            const deskText = document.getElementById(textId);
            if (deskText) deskText.value = e.target.value;
          } else if (id.endsWith('-text')) {
            const colorId = id.replace('-text', '-color');
            const mobColor = document.getElementById(`${colorId}-mob`);
            if (mobColor) mobColor.value = e.target.value;
            const deskText = document.getElementById(id);
            if (deskText) deskText.value = e.target.value;
            const deskColor = document.getElementById(colorId);
            if (deskColor) deskColor.value = e.target.value;
          } else if (id === 'cfg-border-radius') {
            const deskRadius = document.getElementById('cfg-border-radius');
            if (deskRadius) deskRadius.value = e.target.value;
          }
          saveCardConfigInputs();
          updateProductCardLivePreview();
        });
      }
    });

    // Feature Toggles (Desktop & Mobile Sync)
    ['show-rating', 'show-sales', 'show-strike', 'show-discount-badge', 'show-ticket-icon', 'show-badge'].forEach(feat => {
      const el = document.getElementById(`cfg-${feat}`);
      const elMob = document.getElementById(`cfg-${feat}-mob`);

      if (el) {
        el.addEventListener('change', (e) => {
          if (elMob) elMob.checked = e.target.checked;
          if (feat === 'show-badge') {
            const bA = document.getElementById('cfg-show-badge-blok-a');
            if (bA) bA.checked = e.target.checked;
          }
          saveCardConfigInputs();
          updateProductCardLivePreview();
        });
      }

      if (elMob) {
        elMob.addEventListener('change', (e) => {
          if (el) el.checked = e.target.checked;
          if (feat === 'show-badge') {
            const bA = document.getElementById('cfg-show-badge-blok-a');
            if (bA) bA.checked = e.target.checked;
          }
          saveCardConfigInputs();
          updateProductCardLivePreview();
        });
      }
    });

    const badgeBlokA = document.getElementById('cfg-show-badge-blok-a');
    if (badgeBlokA) {
      badgeBlokA.addEventListener('change', e => {
        const bMain = document.getElementById('cfg-show-badge');
        const bMob = document.getElementById('cfg-show-badge-mob');
        if (bMain) bMain.checked = e.target.checked;
        if (bMob) bMob.checked = e.target.checked;
        saveCardConfigInputs();
        updateProductCardLivePreview();
      });
    }

    // Simulation Countdown Toggle (Desktop & Mobile Sync)
    const simCd = document.getElementById('cfg-simulate-countdown-preview');
    const simCdMob = document.getElementById('cfg-simulate-countdown-preview-mob');
    if (simCd) {
      simCd.addEventListener('change', () => {
        if (simCdMob) simCdMob.checked = simCd.checked;
        updateProductCardLivePreview();
      });
    }
    if (simCdMob) {
      simCdMob.addEventListener('change', () => {
        if (simCd) simCd.checked = simCdMob.checked;
        updateProductCardLivePreview();
      });
    }

    // Card Customization Design Panel: [Default] dan [Ubah Kartu] (Desktop & Mobile Sync)
    const tabDefDesk = document.getElementById('tab-card-design-default');
    const tabCustDesk = document.getElementById('tab-card-design-custom');
    const panelCustDesk = document.getElementById('panel-card-custom-content');
    const tabDefMob = document.getElementById('tab-card-design-default-mob');
    const tabCustMob = document.getElementById('tab-card-design-custom-mob');
    const panelCustMob = document.getElementById('panel-card-custom-content-mob');
    const btnSaveCardDesk = document.getElementById('btn-save-card-design');
    const btnSaveCardMob = document.getElementById('btn-save-card-design-mob');

    function setCardCustomizationView(isCustomMode) {
      const modelName = primaryState.card_variant === 'B' ? 'Model 2' : (primaryState.card_variant === 'C' ? 'Model 3' : 'Model 1');
      if (isCustomMode) {
        // [Ubah Kartu]: Menampilkan panel kustomisasi warna/elemen
        panelCustDesk?.classList.remove('hidden');
        panelCustMob?.classList.remove('hidden');

        tabCustDesk?.classList.remove('text-slate-600');
        tabCustDesk?.classList.add('bg-white', 'text-emerald-800', 'shadow-2xs');
        tabDefDesk?.classList.remove('bg-white', 'text-emerald-800', 'shadow-2xs');
        tabDefDesk?.classList.add('text-slate-600');

        tabCustMob?.classList.remove('text-slate-600');
        tabCustMob?.classList.add('bg-slate-100', 'text-emerald-800', 'shadow-2xs');
        tabDefMob?.classList.remove('bg-slate-100', 'text-emerald-800', 'shadow-2xs');
        tabDefMob?.classList.add('text-slate-600');

        // Pastikan checkbox default selalu false (unchecked)
        if (saveDefToggle) saveDefToggle.checked = false;
        if (saveDefToggleMob) saveDefToggleMob.checked = false;

        const deskLbl = document.getElementById('label-save-as-default-desk');
        const mobLbl = document.getElementById('label-save-as-default-mob');
        if (deskLbl) deskLbl.textContent = `Gunakan desain ini Sebagai Default kartu (${modelName})`;
        if (mobLbl) mobLbl.textContent = `Gunakan desain ini Sebagai Default kartu (${modelName})`;
      } else {
        // [Default]: Menyembunyikan panel kustomisasi
        panelCustDesk?.classList.add('hidden');
        panelCustMob?.classList.add('hidden');

        tabDefDesk?.classList.remove('text-slate-600');
        tabDefDesk?.classList.add('bg-white', 'text-emerald-800', 'shadow-2xs');
        tabCustDesk?.classList.remove('bg-white', 'text-emerald-800', 'shadow-2xs');
        tabCustDesk?.classList.add('text-slate-600');

        tabDefMob?.classList.remove('text-slate-600');
        tabDefMob?.classList.add('bg-slate-100', 'text-emerald-800', 'shadow-2xs');
        tabCustMob?.classList.remove('bg-slate-100', 'text-emerald-800', 'shadow-2xs');
        tabCustMob?.classList.add('text-slate-600');

        // Pastikan checkbox default selalu false (unchecked)
        if (saveDefToggle) saveDefToggle.checked = false;
        if (saveDefToggleMob) saveDefToggleMob.checked = false;

        // Reset to default preset
        primaryState.use_default_card_design = true;
        loadCardConfigInputs(primaryState.card_variant || 'A', true);
        saveCardConfigInputs();
        updateProductCardLivePreview();
      }
    }

    if (tabDefDesk) tabDefDesk.addEventListener('click', () => setCardCustomizationView(false));
    if (tabCustDesk) tabCustDesk.addEventListener('click', () => setCardCustomizationView(true));
    if (tabDefMob) tabDefMob.addEventListener('click', () => setCardCustomizationView(false));
    if (tabCustMob) tabCustMob.addEventListener('click', () => setCardCustomizationView(true));

    // Save as Default Toggle (Desktop & Mobile Sync)
    const saveDefToggle = document.getElementById('cfg-save-as-default-toggle');
    const saveDefToggleMob = document.getElementById('cfg-save-as-default-toggle-mob');
    if (saveDefToggle) {
      saveDefToggle.addEventListener('change', () => {
        if (saveDefToggleMob) saveDefToggleMob.checked = saveDefToggle.checked;
        saveCardConfigInputs();
      });
    }
    if (saveDefToggleMob) {
      saveDefToggleMob.addEventListener('change', () => {
        if (saveDefToggle) saveDefToggle.checked = saveDefToggleMob.checked;
        saveCardConfigInputs();
      });
    }

    function handleSaveCardDesign() {
      saveCardConfigInputs();
      const isSaveDefault = (saveDefToggle?.checked || saveDefToggleMob?.checked);
      if (isSaveDefault) {
        try {
          if (typeof DB !== 'undefined' && DB.saveCardModelPreset) {
            DB.saveCardModelPreset(primaryState.card_variant, primaryState.card_config);
          }
        } catch (e) {
          console.warn('Gagal menyimpan default model preset:', e);
        }
      }
      if (saveDefToggle) saveDefToggle.checked = false;
      if (saveDefToggleMob) saveDefToggleMob.checked = false;
      if (typeof App !== 'undefined' && App.showToast) {
        const mLabel = primaryState.card_variant === 'B' ? 'Model 2' : (primaryState.card_variant === 'C' ? 'Model 3' : 'Model 1');
        App.showToast(`Desain kartu ${mLabel} berhasil disimpan!`, 'success');
      }
      updateProductCardLivePreview();
    }

    if (btnSaveCardDesk) btnSaveCardDesk.addEventListener('click', handleSaveCardDesign);
    if (btnSaveCardMob) btnSaveCardMob.addEventListener('click', handleSaveCardDesign);
    // Preset Label Buttons
    document.querySelectorAll('.btn-preset-label').forEach(btn => {
      btn.addEventListener('click', () => {
        const labelText = btn.getAttribute('data-label');
        if (!labelText) return;

        const inp1 = document.getElementById('input-custom-label-1');
        const inp2 = document.getElementById('input-custom-label-2');
        if (!inp1?.value.trim()) {
          inp1.value = labelText;
        } else if (!inp2?.value.trim()) {
          inp2.value = labelText;
        } else {
          inp1.value = labelText;
        }

        const bA = document.getElementById('cfg-show-badge-blok-a');
        const bMain = document.getElementById('cfg-show-badge');
        const bMob = document.getElementById('cfg-show-badge-mob');
        if (bA) bA.checked = true;
        if (bMain) bMain.checked = true;
        if (bMob) bMob.checked = true;

        syncCustomLabelInputs();
        updateProductCardLivePreview();
      });
    });

    function syncCustomLabelInputs() {
      const inp1 = document.getElementById('input-custom-label-1');
      const inp2 = document.getElementById('input-custom-label-2');
      const l1 = (inp1?.value || '').trim();
      const l2 = (inp2?.value || '').trim();
      primaryState.custom_labels = [l1, l2].filter(Boolean);
    }

    const inpLbl1 = document.getElementById('input-custom-label-1');
    const inpLbl2 = document.getElementById('input-custom-label-2');
    [inpLbl1, inpLbl2].forEach(inp => {
      if (inp) {
        inp.addEventListener('input', () => {
          syncCustomLabelInputs();
          updateProductCardLivePreview();
        });
      }
    });

    // Footer 1 & 2 Inputs (Sinkronisasi Step 1, Desktop Sidebar & Mobile Drawer)
    const inpF1Text = document.getElementById('input-card-footer-text');
    const inpF1TextSide = document.getElementById('input-card-footer-text-side');
    const inpF1TextMob = document.getElementById('input-card-footer-text-mob');
    const selF1Icon = document.getElementById('select-card-footer-icon');

    const cfgF1Bg = document.getElementById('cfg-footer-bg-color');
    const cfgF1BgHex = document.getElementById('cfg-footer-bg-hex');
    const cfgF1BgSide = document.getElementById('cfg-footer-bg-color-side');
    const cfgF1BgHexSide = document.getElementById('cfg-footer-bg-hex-side');
    const cfgF1BgMob = document.getElementById('cfg-footer-bg-color-mob');
    const cfgF1BgHexMob = document.getElementById('cfg-footer-bg-hex-mob');

    const cfgF1Text = document.getElementById('cfg-footer-text-color');
    const cfgF1TextHex = document.getElementById('cfg-footer-text-hex');
    const cfgF1TextSide = document.getElementById('cfg-footer-text-color-side');
    const cfgF1TextHexSide = document.getElementById('cfg-footer-text-hex-side');
    const cfgF1TextMob = document.getElementById('cfg-footer-text-color-mob');
    const cfgF1TextHexMob = document.getElementById('cfg-footer-text-hex-mob');

    const syncF1Bg = (val) => {
      [cfgF1Bg, cfgF1BgHex, cfgF1BgSide, cfgF1BgHexSide, cfgF1BgMob, cfgF1BgHexMob].forEach(x => { if (x) x.value = val; });
      primaryState.footer_bg_color = val;
    };
    const syncF1TextCol = (val) => {
      [cfgF1Text, cfgF1TextHex, cfgF1TextSide, cfgF1TextHexSide, cfgF1TextMob, cfgF1TextHexMob].forEach(x => { if (x) x.value = val; });
      primaryState.footer_text_color = val;
    };
    const syncF1Str = (val) => {
      [inpF1Text, inpF1TextSide, inpF1TextMob].forEach(x => { if (x) x.value = val; });
      primaryState.card_footer_text = val;
    };

    [inpF1Text, inpF1TextSide, inpF1TextMob].forEach(el => {
      if (el) el.addEventListener('input', e => {
        syncF1Str(e.target.value);
        syncStateFromDOM();
        updateProductCardLivePreview();
      });
    });

    [cfgF1Bg, cfgF1BgHex, cfgF1BgSide, cfgF1BgHexSide, cfgF1BgMob, cfgF1BgHexMob].forEach(el => {
      if (el) el.addEventListener('input', e => {
        syncF1Bg(e.target.value);
        syncStateFromDOM();
        updateProductCardLivePreview();
      });
    });

    [cfgF1Text, cfgF1TextHex, cfgF1TextSide, cfgF1TextHexSide, cfgF1TextMob, cfgF1TextHexMob].forEach(el => {
      if (el) el.addEventListener('input', e => {
        syncF1TextCol(e.target.value);
        syncStateFromDOM();
        updateProductCardLivePreview();
      });
    });

    if (selF1Icon) {
      selF1Icon.addEventListener('change', () => {
        syncStateFromDOM();
        updateProductCardLivePreview();
      });
    }

    // Footer 2 Inputs (Sinkronisasi Step 1, Desktop Sidebar & Mobile Drawer)
    const inpF2Text = document.getElementById('input-card-footer-2-text');
    const inpF2TextSide = document.getElementById('input-card-footer-2-text-side');
    const inpF2TextMob = document.getElementById('input-card-footer-2-text-mob');
    const selF2Icon = document.getElementById('select-card-footer-2-icon');

    const cfgF2Bg = document.getElementById('cfg-footer-2-bg-color');
    const cfgF2BgHex = document.getElementById('cfg-footer-2-bg-hex');
    const cfgF2BgSide = document.getElementById('cfg-footer-2-bg-color-side');
    const cfgF2BgHexSide = document.getElementById('cfg-footer-2-bg-hex-side');
    const cfgF2BgMob = document.getElementById('cfg-footer-2-bg-color-mob');
    const cfgF2BgHexMob = document.getElementById('cfg-footer-2-bg-hex-mob');

    const cfgF2Text = document.getElementById('cfg-footer-2-text-color');
    const cfgF2TextHex = document.getElementById('cfg-footer-2-text-hex');
    const cfgF2TextSide = document.getElementById('cfg-footer-2-text-color-side');
    const cfgF2TextHexSide = document.getElementById('cfg-footer-2-text-hex-side');
    const cfgF2TextMob = document.getElementById('cfg-footer-2-text-color-mob');
    const cfgF2TextHexMob = document.getElementById('cfg-footer-2-text-hex-mob');

    const syncF2Bg = (val) => {
      [cfgF2Bg, cfgF2BgHex, cfgF2BgSide, cfgF2BgHexSide, cfgF2BgMob, cfgF2BgHexMob].forEach(x => { if (x) x.value = val; });
      primaryState.footer_2_bg_color = val;
    };
    const syncF2TextCol = (val) => {
      [cfgF2Text, cfgF2TextHex, cfgF2TextSide, cfgF2TextHexSide, cfgF2TextMob, cfgF2TextHexMob].forEach(x => { if (x) x.value = val; });
      primaryState.footer_2_text_color = val;
    };
    const syncF2Str = (val) => {
      [inpF2Text, inpF2TextSide, inpF2TextMob].forEach(x => { if (x) x.value = val; });
      primaryState.card_footer_2_text = val;
    };

    [inpF2Text, inpF2TextSide, inpF2TextMob].forEach(el => {
      if (el) el.addEventListener('input', e => {
        syncF2Str(e.target.value);
        syncStateFromDOM();
        updateProductCardLivePreview();
      });
    });

    [cfgF2Bg, cfgF2BgHex, cfgF2BgSide, cfgF2BgHexSide, cfgF2BgMob, cfgF2BgHexMob].forEach(el => {
      if (el) el.addEventListener('input', e => {
        syncF2Bg(e.target.value);
        syncStateFromDOM();
        updateProductCardLivePreview();
      });
    });

    [cfgF2Text, cfgF2TextHex, cfgF2TextSide, cfgF2TextHexSide, cfgF2TextMob, cfgF2TextHexMob].forEach(el => {
      if (el) el.addEventListener('input', e => {
        syncF2TextCol(e.target.value);
        syncStateFromDOM();
        updateProductCardLivePreview();
      });
    });

    if (selF2Icon) {
      selF2Icon.addEventListener('change', () => {
        syncStateFromDOM();
        updateProductCardLivePreview();
      });
    }

    // Preset Footer Buttons
    document.querySelectorAll('.btn-preset-footer').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-text');
        const icon = btn.getAttribute('data-icon');
        if (inpF1Text && text) syncF1Str(text);
        if (selF1Icon && icon) selF1Icon.value = icon;
        syncStateFromDOM();
        updateProductCardLivePreview();
      });
    });

    document.querySelectorAll('.btn-preset-footer-2').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-text');
        const icon = btn.getAttribute('data-icon');
        if (inpF2Text && text) syncF2Str(text);
        if (selF2Icon && icon) selF2Icon.value = icon;
        syncStateFromDOM();
        updateProductCardLivePreview();
      });
    });

    // Price Type Radios
    const priceTypeRadios = document.querySelectorAll('input[name="price_type_radio"]');
    priceTypeRadios.forEach(radio => {
      radio.addEventListener('change', e => {
        const selectedPt = parseInt(e.target.value);
        primaryState.price_type = selectedPt;

        priceTypeRadios.forEach(r => {
          const lbl = r.closest('label');
          if (lbl) {
            if (r.checked) {
              lbl.className = 'p-3 rounded-xl border border-emerald-500 bg-white ring-2 ring-emerald-500/20 shadow-xs cursor-pointer transition space-y-1 block';
            } else {
              lbl.className = 'p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition space-y-1 block';
            }
            const sp = lbl.querySelector('span');
            if (sp) sp.className = `font-bold text-xs ${r.checked ? 'text-emerald-800' : 'text-slate-800'}`;
          }
        });

        const hintBox = document.getElementById('price-type-hint-text');
        if (hintBox) hintBox.innerHTML = getPriceTypeHint(selectedPt);

        // Refresh tabel bahan jika Tipe 7 (KombStep)
        const isKombStep = selectedPt === 7;
        const matBody = document.getElementById('materials-table-body');
        if (matBody) {
          matBody.innerHTML = renderMaterialsRows(isKombStep);
          bindMaterialRowEvents();
          bindMaterialInputsMarginLive();
        }

        updateProductCardLivePreview();
      });
    });

    // Repeater: Materials
    const btnAddMat = document.getElementById('btn-add-material');
    if (btnAddMat) {
      btnAddMat.addEventListener('click', () => {
        materialsState.push({
          id: DB.generateUUID(),
          name: '',
    product_type: 'physical', // 'physical' | 'non_physical'
    has_layer_3: false,
    show_badge: true,
          price: 0,
          cost_price: 0,
          step_multiplier: 1
        });
        const isKombStep = primaryState.price_type === 7;
        const matBody = document.getElementById('materials-table-body');
        if (matBody) {
          matBody.innerHTML = renderMaterialsRows(isKombStep);
          bindMaterialRowEvents();
          bindMaterialInputsMarginLive();
          if (window.lucide) window.lucide.createIcons();
        }
      });
    }

    function bindMaterialRowEvents() {
      const matBody = document.getElementById('materials-table-body');
      if (!matBody) return;

      matBody.querySelectorAll('.btn-delete-mat').forEach(btn => {
        btn.addEventListener('click', e => {
          if (materialsState.length <= 1) return;
          const tr = e.target.closest('tr');
          const id = tr.getAttribute('data-id');
          materialsState = materialsState.filter(m => m.id !== id);
          const isKombStep = primaryState.price_type === 7;
          matBody.innerHTML = renderMaterialsRows(isKombStep);
          bindMaterialRowEvents();
          bindMaterialInputsMarginLive();
          if (window.lucide) window.lucide.createIcons();
          updateProductCardLivePreview();
        });
      });

      matBody.querySelectorAll('.mat-input').forEach(inp => {
        inp.addEventListener('input', e => {
          const tr = e.target.closest('tr');
          const id = tr.getAttribute('data-id');
          const field = e.target.getAttribute('data-field');
          const item = materialsState.find(m => m.id === id);
          if (item) {
            if (field === 'price' || field === 'cost_price') {
              item[field] = parseFloat(e.target.value) || 0;
            } else if (field === 'step_multiplier') {
              item[field] = Math.max(1, parseInt(e.target.value) || 1);
            } else {
              item[field] = e.target.value;
            }
          }
        });
      });
    }
    bindMaterialRowEvents();

    // Repeater: Finishings Main
    const btnAddFinMain = document.getElementById('btn-add-finishing-main');
    if (btnAddFinMain) {
      btnAddFinMain.addEventListener('click', () => {
        finishingsState.main.push({
          id: DB.generateUUID(),
          tier: 'main',
          name: '',
    product_type: 'physical', // 'physical' | 'non_physical'
    has_layer_3: false,
    show_badge: true,
          price: 0,
          cost_price: 0
        });
        const finBody = document.getElementById('finishings-main-table-body');
        if (finBody) {
          finBody.innerHTML = renderFinishingRows('main');
          bindFinishingMainEvents();
          if (window.lucide) window.lucide.createIcons();
        }
      });
    }

    function bindFinishingMainEvents() {
      const finBody = document.getElementById('finishings-main-table-body');
      if (!finBody) return;

      finBody.querySelectorAll('.btn-delete-fin').forEach(btn => {
        btn.addEventListener('click', e => {
          if (finishingsState.main.length <= 1) return;
          const tr = e.target.closest('tr');
          const id = tr.getAttribute('data-id');
          finishingsState.main = finishingsState.main.filter(f => f.id !== id);
          finBody.innerHTML = renderFinishingRows('main');
          bindFinishingMainEvents();
          if (window.lucide) window.lucide.createIcons();
        });
      });

      finBody.querySelectorAll('.fin-input').forEach(inp => {
        inp.addEventListener('input', e => {
          const tr = e.target.closest('tr');
          const id = tr.getAttribute('data-id');
          const field = e.target.getAttribute('data-field');
          const item = finishingsState.main.find(f => f.id === id);
          if (item) {
            if (field === 'price' || field === 'cost_price') {
              item[field] = parseFloat(e.target.value) || 0;
            } else {
              item[field] = e.target.value;
            }
          }
        });
      });
    }
    bindFinishingMainEvents();

    // Repeater: Finishings Extra 1/2/3
    document.querySelectorAll('.btn-add-extra-fin').forEach(btn => {
      btn.addEventListener('click', e => {
        const tier = e.target.getAttribute('data-tier');
        if (!finishingsState[tier]) finishingsState[tier] = [];
        finishingsState[tier].push({
          id: DB.generateUUID(),
          tier: tier,
          name: '',
    product_type: 'physical', // 'physical' | 'non_physical'
    has_layer_3: false,
    show_badge: true,
          price: 0,
          cost_price: 0
        });
        renderForm();
      });
    });

    document.querySelectorAll('.btn-delete-fin[data-tier^="extra"]').forEach(btn => {
      btn.addEventListener('click', e => {
        const card = e.target.closest('[data-id]');
        const id = card.getAttribute('data-id');
        const tier = card.getAttribute('data-tier');
        if (finishingsState[tier]) {
          finishingsState[tier] = finishingsState[tier].filter(f => f.id !== id);
          renderForm();
        }
      });
    });

    // Unlimited Stock Switch
    const toggleUnlStock = document.getElementById('toggle-unlimited-stock');
    const stockWrapper = document.getElementById('stock-input-wrapper');
    if (toggleUnlStock && stockWrapper) {
      toggleUnlStock.addEventListener('change', e => {
        primaryState.is_unlimited_stock = e.target.checked;
        stockWrapper.classList.toggle('hidden', e.target.checked);
      });
    }

    // Monthly Promo Toggle
    const toggleDisc = document.getElementById('toggle-monthly-discount');
    const discControls = document.getElementById('discount-controls-area');
    if (toggleDisc && discControls) {
      toggleDisc.addEventListener('change', e => {
        primaryState.has_monthly_discount = e.target.checked;
        discControls.classList.toggle('hidden', !e.target.checked);
        updateDiscountAutoConvert();
        updateProductCardLivePreview();
      });
    }

    // Auto Convert Promo Info
    function updateDiscountAutoConvert() {
      const typeSelect = document.getElementById('select-monthly-discount-type');
      const valInput = document.getElementById('input-discount-val');
      const textEl = document.getElementById('discount-auto-convert-text');
      const badgeEl = document.getElementById('discount-auto-convert-badge');
      if (!typeSelect || !valInput || !textEl || !badgeEl) return;

      const dType = typeSelect.value;
      const dVal = parseFloat(valInput.value) || 0;

      let basePrice = 25000;
      if (materialsState.length > 0 && materialsState[0].price > 0) {
        basePrice = materialsState[0].price;
      }

      if (dType === 'percent') {
        const nomPotongan = Math.round(basePrice * (dVal / 100));
        textEl.textContent = `Diskon ${dVal}% setara potongan sekitar Rp ${nomPotongan.toLocaleString('id-ID')} pada harga dasar ${formatIDR(basePrice)}.`;
        badgeEl.textContent = `${Math.min(100, Math.round(dVal))}%`;
      } else {
        const pct = basePrice > 0 ? Math.min(100, Math.round((dVal / basePrice) * 100)) : 0;
        textEl.textContent = `Potongan Rp ${dVal.toLocaleString('id-ID')} setara sekitar ${pct}% dari harga dasar ${formatIDR(basePrice)}.`;
        badgeEl.textContent = `${pct}%`;
      }
    }

    const discTypeSel = document.getElementById('select-monthly-discount-type');
    const discValInp = document.getElementById('input-discount-val');
    if (discTypeSel) discTypeSel.addEventListener('change', () => { updateDiscountAutoConvert(); updateProductCardLivePreview(); });
    if (discValInp) discValInp.addEventListener('input', () => { updateDiscountAutoConvert(); updateProductCardLivePreview(); });

    // Promo Dates Listeners
    const pStartInp = document.getElementById('input-promo-start-date');
    const pEndInp = document.getElementById('input-promo-end-date');
    if (pStartInp) pStartInp.addEventListener('change', e => { primaryState.promo_start_date = e.target.value || null; });
    if (pEndInp) pEndInp.addEventListener('change', e => { primaryState.promo_end_date = e.target.value || null; });

    // Multi-image Drag & Drop
    const galleryContainer = document.getElementById('gallery-slots-container') || document.getElementById('image-gallery-container');
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

    // Product Type Radios (Fisik / Non Fisik)
    document.querySelectorAll('input[name="product_type_radio"]').forEach(r => {
      r.addEventListener('change', e => {
        primaryState.product_type = e.target.value;
        document.querySelectorAll('input[name="product_type_radio"]').forEach(radio => {
          const lbl = radio.closest('label');
          if (lbl) {
            if (radio.checked) {
              lbl.className = 'p-3.5 rounded-xl border border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 cursor-pointer transition flex items-center gap-3 block select-none';
              const txt = lbl.querySelector('span');
              if (txt) txt.className = 'font-bold text-xs text-emerald-950 font-extrabold block';
            } else {
              lbl.className = 'p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition flex items-center gap-3 block select-none';
              const txt = lbl.querySelector('span');
              if (txt) txt.className = 'font-bold text-xs text-slate-800 block';
            }
          }
        });
        updateProductCardLivePreview();
      });
    });

    // Step 2: Jenis Harga Produk Gate Dropdown
    const selectPriceType = document.getElementById('select-price-type');
    const priceTypeHintBox = document.getElementById('price-type-hint-box');
    const priceTypeHintText = document.getElementById('price-type-hint-text');
    const priceTypeGateNotice = document.getElementById('price-type-gate-notice');
    const step2VariantsWrapper = document.getElementById('step-2-variants-wrapper');

    if (selectPriceType) {
      selectPriceType.addEventListener('change', e => {
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val >= 1 && val <= 7) {
          primaryState.price_type = val;
          if (priceTypeHintText) priceTypeHintText.innerHTML = getPriceTypeHint(val);
          if (priceTypeHintBox) priceTypeHintBox.classList.remove('hidden');
          if (priceTypeGateNotice) priceTypeGateNotice.classList.add('hidden');
          if (step2VariantsWrapper) step2VariantsWrapper.classList.remove('hidden');
        } else {
          primaryState.price_type = null;
          if (priceTypeHintBox) priceTypeHintBox.classList.add('hidden');
          if (priceTypeGateNotice) priceTypeGateNotice.classList.remove('hidden');
          if (step2VariantsWrapper) step2VariantsWrapper.classList.add('hidden');
        }
        updateProductCardLivePreview();
      });
    }

    // Step 2: Lapisan 3 Checkbox Trigger
    const toggleLayer3 = document.getElementById('toggle-has-layer-3');
    const layer3Wrapper = document.getElementById('layer-3-content-wrapper');
    if (toggleLayer3 && layer3Wrapper) {
      toggleLayer3.addEventListener('change', e => {
        primaryState.has_layer_3 = e.target.checked;
        if (e.target.checked) {
          layer3Wrapper.classList.remove('hidden');
          layer3Wrapper.classList.add('grid');
        } else {
          layer3Wrapper.classList.add('hidden');
          layer3Wrapper.classList.remove('grid');
        }
      });
    }

    // Step 1 Poin 6: Tambah Label Khusus Eye Toggle Button (Murni Ikon Mata)
    const btnToggleBadgeVis = document.getElementById('btn-toggle-badge-visibility');
    const iconBadgeVis = document.getElementById('icon-badge-visibility');

    if (btnToggleBadgeVis) {
      btnToggleBadgeVis.addEventListener('click', () => {
        primaryState.show_badge = !(primaryState.show_badge !== false);
        const isVisible = primaryState.show_badge;

        if (iconBadgeVis) {
          iconBadgeVis.className = `bi ${isVisible ? 'bi-eye' : 'bi-eye-slash'} text-base`;
        }
        btnToggleBadgeVis.className = `p-2 rounded-xl border transition cursor-pointer flex items-center justify-center ${isVisible ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`;
        btnToggleBadgeVis.title = isVisible ? 'Sembunyikan Label di Kartu' : 'Tampilkan Label di Kartu';

        const bA = document.getElementById('cfg-show-badge-blok-a');
        const bMain = document.getElementById('cfg-show-badge');
        const bMob = document.getElementById('cfg-show-badge-mob');
        if (bA) bA.checked = isVisible;
        if (bMain) bMain.checked = isVisible;
        if (bMob) bMob.checked = isVisible;

        saveCardConfigInputs();
        updateProductCardLivePreview();
      });
    }

    // Toggle Active & Storefront Visibility Integration
    const toggleIsActive = document.getElementById('toggle-is-active-form');
    if (toggleIsActive) {
      toggleIsActive.addEventListener('change', e => {
        primaryState.is_active = e.target.checked;
        updateStorefrontVisibility(primaryState.is_active);
      });
    }
    // Initialize Storefront visibility
    updateStorefrontVisibility(primaryState.is_active !== false);

    // Submit Button (Paling Akhir Step 2)
    const btnSubmit = document.getElementById('btn-submit-product');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', handleFormSubmit);
    }
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
    const fileInput = document.getElementById('input-prod-images-hidden') || document.getElementById('input-prod-image');

    // Validasi format berkas gambar
    const imageFiles = files.filter(f => f.type && f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      if (errorMsg && errorBanner) {
        errorMsg.textContent = 'Berkas yang dipilih bukan berkas gambar yang didukung (JPG, PNG, WEBP).';
        errorBanner.classList.remove('hidden');
      }
      const fi1 = document.getElementById('input-prod-images-hidden');
      if (fi1) fi1.value = '';
      const fi2 = document.getElementById('input-prod-image');
      if (fi2) fi2.value = '';
      return;
    }

    if (errorBanner) errorBanner.classList.add('hidden');

    if (!Array.isArray(primaryState.images)) primaryState.images = [];

    // Maksimal 10 foto produk
    const remainingSlots = 10 - primaryState.images.length;
    if (remainingSlots <= 0) {
      if (errorMsg && errorBanner) {
        errorMsg.textContent = 'Maksimal 10 foto produk telah tercapai. Hapus beberapa foto untuk menambahkan foto baru.';
        errorBanner.classList.remove('hidden');
      }
      const fi1 = document.getElementById('input-prod-images-hidden');
      if (fi1) fi1.value = '';
      const fi2 = document.getElementById('input-prod-image');
      if (fi2) fi2.value = '';
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
      const fi1 = document.getElementById('input-prod-images-hidden');
      if (fi1) fi1.value = '';
      const fi2 = document.getElementById('input-prod-image');
      if (fi2) fi2.value = '';
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function bindGalleryButtons() {
    // Tombol Tambah Slot Foto (Fallback direct listener)
    const addSlotBtn = document.getElementById('btn-slot-add-photo');
    const fileInput = document.getElementById('input-prod-images-hidden') || document.getElementById('input-prod-image');
    if (addSlotBtn && fileInput) {
      addSlotBtn.addEventListener('click', (e) => {
        e.preventDefault();
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

    // Geser Urutan ke Kiri ()
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

    // Geser Urutan ke Kanan ()
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

    // Hapus Foto dari Galeri ()
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
    const galleryContainer = document.getElementById('gallery-slots-container') || document.getElementById('image-gallery-container');
    if (galleryContainer) {
      galleryContainer.innerHTML = renderGalleryThumbnails();
      bindGalleryButtons();
      if (window.lucide) window.lucide.createIcons();
    }
  }

  // ========================================================================
  // EVENT DELEGATION GLOBAL: GALERI FOTO & PEMICU FILE PICKER (ANTI-LEPAS DOM)
  // ========================================================================
  if (typeof window !== 'undefined' && !window.__productFormGalleryDelegationBound) {
    window.__productFormGalleryDelegationBound = true;

    // Delegasi Klik File Picker & Aksi Galeri (Berlaku global di level document)
    document.addEventListener('click', (e) => {
      // 1. Pemicu dialog pilih berkas (Add Photo Slot)
      const addBtn = e.target.closest('#btn-slot-add-photo') || e.target.closest('[data-action="add-photo"]');
      if (addBtn) {
        e.preventDefault();
        const fileInput = document.getElementById('input-prod-images-hidden') || document.getElementById('input-prod-image');
        if (fileInput) fileInput.click();
        return;
      }

      // 2. Set Main Image (Cover)
      const coverBtn = e.target.closest('.btn-set-main-image') || e.target.closest('[data-action="set-cover"]');
      if (coverBtn) {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(coverBtn.getAttribute('data-idx'));
        if (!isNaN(idx) && idx > 0 && Array.isArray(primaryState.images) && idx < primaryState.images.length) {
          const targetImg = primaryState.images.splice(idx, 1)[0];
          primaryState.images.unshift(targetImg);
          primaryState.image_url = primaryState.images[0];
          refreshGalleryDOM();
          updateProductCardLivePreview();
        }
        return;
      }

      // 3. Geser Urutan ke Kiri ()
      const leftBtn = e.target.closest('.btn-move-left-image') || e.target.closest('[data-action="move-left"]');
      if (leftBtn) {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(leftBtn.getAttribute('data-idx'));
        if (!isNaN(idx) && idx > 0 && Array.isArray(primaryState.images) && idx < primaryState.images.length) {
          const temp = primaryState.images[idx];
          primaryState.images[idx] = primaryState.images[idx - 1];
          primaryState.images[idx - 1] = temp;
          primaryState.image_url = primaryState.images[0];
          refreshGalleryDOM();
          updateProductCardLivePreview();
        }
        return;
      }

      // 4. Geser Urutan ke Kanan ()
      const rightBtn = e.target.closest('.btn-move-right-image') || e.target.closest('[data-action="move-right"]');
      if (rightBtn) {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(rightBtn.getAttribute('data-idx'));
        if (!isNaN(idx) && idx >= 0 && Array.isArray(primaryState.images) && idx < primaryState.images.length - 1) {
          const temp = primaryState.images[idx];
          primaryState.images[idx] = primaryState.images[idx + 1];
          primaryState.images[idx + 1] = temp;
          primaryState.image_url = primaryState.images[0];
          refreshGalleryDOM();
          updateProductCardLivePreview();
        }
        return;
      }

      // 5. Hapus Foto dari Galeri ()
      const delBtn = e.target.closest('.btn-delete-gallery-img') || e.target.closest('[data-action="delete-photo"]');
      if (delBtn) {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(delBtn.getAttribute('data-idx'));
        if (!isNaN(idx) && idx >= 0 && Array.isArray(primaryState.images) && idx < primaryState.images.length) {
          primaryState.images.splice(idx, 1);
          primaryState.image_url = primaryState.images.length > 0 ? primaryState.images[0] : null;
          refreshGalleryDOM();
          updateProductCardLivePreview();
        }
        return;
      }
    });

    // Delegasi Event Perubahan File Input (Change Event Bubbling)
    document.addEventListener('change', async (e) => {
      if (e.target && (e.target.id === 'input-prod-images-hidden' || e.target.id === 'input-prod-image')) {
        if (e.target.files && e.target.files.length > 0) {
          await handleImageFilesSelected(Array.from(e.target.files));
          e.target.value = '';
        }
      }
    });
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
    const pStart = document.getElementById('input-promo-start-date')?.value;
    primaryState.promo_start_date = pStart ? pStart : null;
    const pEnd = document.getElementById('input-promo-end-date')?.value;
    primaryState.promo_end_date = pEnd ? pEnd : null;
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



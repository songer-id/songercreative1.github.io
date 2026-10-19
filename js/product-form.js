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
    product_type: '', // 'physical' | 'non_physical' - default '' pada create (wajib dipilih seller!)
    status: 'published', // 'published' | 'draft'
    is_active: true, // Tampilkan di Etalase Toko (default ON)
    show_shipping_for_non_physical: false,
    has_layer_2: false,
    has_layer_3: false,
    has_layer_4: false,
    has_layer_5: false,
    has_variation_2: false,
    has_variation_3: false,
    has_variation_4: false,
    has_extra_service: false,
    variation_scopes: {
      main: 'umum',
      extra_1: 'umum',
      extra_2: 'umum',
      extra_3: 'umum'
    },
    scope_main: 'umum',
    scope_extra_1: 'umum',
    scope_extra_2: 'umum',
    scope_extra_3: 'umum',
    wholesale_mode: 'normal', // 'normal' | 'tiered'
    same_price_tiers: { tier1: false, main: false, extra_1: false, extra_2: false, extra_3: false },
    same_cost_tiers: { tier1: false, main: false, extra_1: false, extra_2: false, extra_3: false },
    stock_mode_tiers: { tier1: '', main: '', extra_1: '', extra_2: '', extra_3: '' },
    specific_options_map: {}, // { [matId]: { main: [optIds], extra_1: [optIds], extra_2: [optIds] } }
    show_badge: true,
    order_category: 'Ctk', // Default operasional internal kasir
    category_id: '',     // Kategori Utama Etalase (default '' wajib dipilih seller!)
    sub_category_id: '', // Sub-Kategori Etalase
    card_variant: '',    // 'A' | 'B' | 'C' (default '' wajib dipilih seller!)
    price_type: 2,       // 1-7 (disinkronkan dengan pricing_model)
    // Variasi Bertumpuk Multi-Level (Stacked Variations) dengan Label Kustom Seller
    variation_labels: {
      label_product: 'Produk',
      label_tier_1: '',
      label_tier_2: '',
      label_extra_1: '',
      label_extra_2: '',
      label_extra_3: ''
    },
    // Step 2: Informasi Penjualan
    pricing_model: 'normal', // 'normal' | 'size' | 'weight' | 'volume'
    has_variants: false,     // Variasi Produk pada jenis Normal (false = produk tunggal)
    size_pricing_type: 'custom', // 'custom' | 'fixed'
    size_unit: 'Cm',         // 'M' | 'Dm' | 'Cm' | 'Mm'
    fixed_size_value: 'S',
    weight_unit: 'Kg',       // 'Kg' | 'gram' | 'ons' | 'ton'
    volume_unit: 'Liter',    // 'Liter' | 'ml' | 'galon' | 'drum' | 'cc'
    stock: null,
    is_unlimited_stock: true,
    min_order: 1,
    max_order: null,
    max_order_type: 'unlimited', // 'unlimited' | 'per_order' | 'per_period'
    max_order_qty: null,
    max_order_period: {
      start_date: '',
      max_qty: 10,
      days: 7,
      period_type: 'non_recurring', // 'non_recurring' | 'recurring'
      end_date: ''
    },
    has_wholesale: false,
    wholesale_tiers: [],     // [{ id, min_qty, max_qty, price }]
    has_order_multiple: false,
    order_multiple_type: 'all', // 'all' | 'per_variant'
    order_multiple_value: 1,
    order_multiples_by_variant: {}, // { [variantId]: 50 }
    // Step 3: Promo, Pengiriman & Deskripsi
    has_monthly_discount: false,
    discount_type: 'percent', // 'percent' | 'nominal'
    discount_value: 0,
    monthly_promo_label: 'Promo Bulanan',
    promo_start_date: null,
    promo_end_date: null,
    custom_labels: [],
    shipping_config: {
      is_cod: false,
      couriers: ['pickup', 'instant', 'reguler'],
      weight: 100,
      weight_unit: 'gram',
      length: 10,
      width: 10,
      height: 5
    },
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

  // Helper: Tanggal & Waktu Lokal untuk Pengaturan Periode Maksimal Order
  function getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  }

  function addDaysToDate(dateStr, days) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Kondisi Gerbang (Gating): Cek kelengkapan seluruh data wajib di Step 1
  function isStep1Complete() {
    // 1. Jenis Produk / Layanan (Fisik atau Non Fisik)
    if (!primaryState.product_type || (primaryState.product_type !== 'physical' && primaryState.product_type !== 'non_physical')) {
      return false;
    }
    // 2. Model Kartu (Wajib jika toko aktif)
    if (primaryState.is_active && !primaryState.card_variant) {
      return false;
    }
    // 3. Foto Produk (Minimal 1 foto sebagai cover)
    if (!primaryState.images || primaryState.images.length === 0) {
      if (!primaryState.image_url) return false;
    }
    // 4. Nama Produk
    if (!primaryState.name || primaryState.name.trim() === '') {
      return false;
    }
    // 5. Kategori Utama Etalase
    if (!primaryState.category_id || String(primaryState.category_id).trim() === '') {
      return false;
    }
    return true;
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
      product_type: '', // Default '' (kosong, seller wajib memilih sendiri!)
      status: 'published',
      is_active: true, // Default Tampilkan di Etalase Toko = ON
      show_shipping_for_non_physical: false,
      has_layer_3: false,
      show_badge: true,
      order_category: 'Ctk',
      category_id: '', // Default '' (kosong, seller wajib memilih sendiri!)
      sub_category_id: '',
      card_variant: '', // Default '' (kosong, seller wajib memilih sendiri!)
      card_variant_manual_override: false,
      card_variant_override: false,
    variation_labels: {
      label_product: 'Produk',
      label_tier_1: 'Jenis Produk',
      label_tier_2: 'Finishing / Variasi 2',
      label_extra_1: 'Topping / Tambahan 1',
      label_extra_2: 'Tambahan 2',
      label_extra_3: 'Tambahan 3'
    },
      // Step 2: Informasi Penjualan
      pricing_model: 'normal',
      has_variants: false,
      size_pricing_type: 'custom',
      size_unit: 'Cm',
      fixed_size_value: 'S',
      weight_unit: 'Kg',
      volume_unit: 'Liter',
      stock: null,
      is_unlimited_stock: true,
      min_order: 1,
      max_order: null,
      max_order_type: 'unlimited',
      max_order_qty: null,
      max_order_period: {
        start_date: getTodayDateString(),
        max_qty: 10,
        days: 7,
        period_type: 'non_recurring',
        end_date: ''
      },
      has_wholesale: false,
      wholesale_tiers: [],
      has_order_multiple: false,
      order_multiple_type: 'all',
      order_multiple_value: 1,
      order_multiples_by_variant: {},
      price_type: 2,
      // Step 3: Promo, Pengiriman & Deskripsi
      has_monthly_discount: false,
      discount_type: 'percent',
      discount_value: 0,
      monthly_promo_label: 'Promo Bulanan',
      promo_start_date: null,
      promo_end_date: null,
      custom_labels: [],
      shipping_config: {
        is_cod: false,
        couriers: ['pickup', 'instant', 'reguler'],
        weight: 100,
        weight_unit: 'gram',
        length: 10,
        width: 10,
        height: 5
      },
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
      image_url: null,
      images: [],
      image_aspect_ratio: (initialCardVariant === 'C' ? '4:3' : '1:1'),
      description: '',
      is_active: true,
      has_variants: false,
      has_variation_2: false,
      has_layer_2: false,
      has_variation_3: false,
      has_layer_3: false,
      has_variation_4: false,
      has_layer_4: false,
      has_extra_service: false,
      has_layer_5: false,
      variation_scopes: {
        main: 'umum',
        extra_1: 'umum',
        extra_2: 'umum',
        extra_3: 'umum'
      },
      scope_main: 'umum',
      scope_extra_1: 'umum',
      scope_extra_2: 'umum',
      scope_extra_3: 'umum',
      wholesale_mode: 'normal',
      same_price_tiers: { tier1: false, main: false, extra_1: false, extra_2: false, extra_3: false },
      same_cost_tiers: { tier1: false, main: false, extra_1: false, extra_2: false, extra_3: false },
      stock_mode_tiers: { tier1: '', main: '', extra_1: '', extra_2: '', extra_3: '' },
      specific_options_map: {},
      variation_labels: {
        label_product: 'Produk',
        label_tier_1: '',
        label_tier_2: '',
        label_extra_1: '',
        label_extra_2: '',
        label_extra_3: ''
      }
    };

    materialsState = [
      { id: DB.generateUUID(), name: 'Produk Standar', price: 0, cost_price: 0, step_multiplier: 1 }
    ];

    finishingsState = {
      main: [],
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
      status: prod.status || 'published',
      show_shipping_for_non_physical: prod.show_shipping_for_non_physical || false,
      has_layer_3: false,
      show_badge: prod.show_badge !== undefined ? prod.show_badge : true,
      order_category: prod.order_category || 'Ctk',
      category_id: prod.category_id || null,
      sub_category_id: prod.sub_category_id || null,
      card_variant: prod.card_variant || 'A',
      card_variant_override: prod.card_variant_override !== undefined ? prod.card_variant_override : true,
      variation_labels: prod.variation_labels || {
        label_product: 'Produk',
        label_tier_1: 'Jenis',
        label_tier_2: 'Finishing',
        label_extra_1: 'Finishing Tambahan 1',
        label_extra_2: 'Finishing Tambahan 2',
        label_extra_3: 'Finishing Tambahan 3'
      },
      // Step 2: Informasi Penjualan
      pricing_model: prod.pricing_model || (prod.price_type === 1 ? 'size' : (prod.price_type === 5 ? 'weight' : (prod.price_type === 6 ? 'volume' : 'normal'))),
      has_variants: prod.has_variants !== undefined ? Boolean(prod.has_variants) : ((prod.materials && prod.materials.length > 1) ? true : false),
      size_pricing_type: prod.size_pricing_type || 'custom',
      size_unit: prod.size_unit || 'Cm',
      fixed_size_value: prod.fixed_size_value || 'S',
      weight_unit: prod.weight_unit || 'Kg',
      volume_unit: prod.volume_unit || 'Liter',
      price_type: prod.price_type || 2,
      stock: prod.stock !== undefined ? prod.stock : null,
      is_unlimited_stock: prod.is_unlimited_stock !== undefined ? Boolean(prod.is_unlimited_stock) : (prod.stock === null || prod.stock === undefined),
      min_order: prod.min_order || 1,
      max_order: prod.max_order || null,
      max_order_type: prod.max_order_type || (prod.max_order ? 'per_order' : 'unlimited'),
      max_order_qty: prod.max_order_qty !== undefined ? prod.max_order_qty : (prod.max_order || null),
      max_order_period: prod.max_order_period || {
        start_date: getTodayDateString(),
        max_qty: 10,
        days: 7,
        period_type: 'non_recurring',
        end_date: ''
      },
      has_wholesale: prod.has_wholesale !== undefined ? Boolean(prod.has_wholesale) : (Array.isArray(prod.wholesale_tiers) && prod.wholesale_tiers.length > 0),
      wholesale_tiers: Array.isArray(prod.wholesale_tiers) ? JSON.parse(JSON.stringify(prod.wholesale_tiers)) : [],
      has_order_multiple: prod.has_order_multiple !== undefined ? Boolean(prod.has_order_multiple) : Boolean(prod.order_multiple_value > 1 || prod.step_quantity > 1),
      order_multiple_type: prod.order_multiple_type || 'all',
      order_multiple_value: prod.order_multiple_value || prod.step_quantity || 1,
      order_multiples_by_variant: prod.order_multiples_by_variant || {},
      // Step 3: Promo, Pengiriman & Deskripsi
      has_monthly_discount: Boolean(prod.has_monthly_discount),
      discount_type: prod.discount_type || 'percent',
      discount_value: prod.discount_value || 0,
      monthly_promo_label: prod.monthly_promo_label || 'Promo Bulanan',
      promo_start_date: prod.promo_start_date || null,
      promo_end_date: prod.promo_end_date || null,
      custom_labels: Array.isArray(prod.custom_labels) ? [...prod.custom_labels] : (typeof prod.custom_labels === 'string' && prod.custom_labels.trim() ? prod.custom_labels.split(',').map(s => s.trim()).filter(Boolean) : []),
      shipping_config: prod.shipping_config || {
        is_cod: false,
        couriers: ['pickup', 'instant', 'reguler'],
        weight: 100,
        weight_unit: 'gram',
        length: 10,
        width: 10,
        height: 5
      },
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
      image_url: imgs.length > 0 ? imgs[0] : null,
      images: imgs,
      image_aspect_ratio: prod.image_aspect_ratio || (prod.card_variant === 'C' ? '4:3' : '1:1'),
      description: prod.description || '',
      is_active: prod.is_active
    };

    materialsState = (prod.materials && prod.materials.length > 0)
      ? JSON.parse(JSON.stringify(prod.materials))
      : [{ id: DB.generateUUID(), name: 'Produk Standar', price: prod.price || 0, cost_price: prod.cost_price || 0, step_multiplier: 1 }];

    const fins = prod.finishings || {};
    finishingsState = {
      main: (fins.main && Array.isArray(fins.main) && fins.main.length > 0)
        ? JSON.parse(JSON.stringify(fins.main))
        : (Array.isArray(fins) && fins.length > 0 ? JSON.parse(JSON.stringify(fins)) : []),
      extra_1: fins.extra_1 && Array.isArray(fins.extra_1) ? JSON.parse(JSON.stringify(fins.extra_1)) : [],
      extra_2: fins.extra_2 && Array.isArray(fins.extra_2) ? JSON.parse(JSON.stringify(fins.extra_2)) : [],
      extra_3: fins.extra_3 && Array.isArray(fins.extra_3) ? JSON.parse(JSON.stringify(fins.extra_3)) : []
    };

    primaryState.has_variants = Boolean(prod.has_variants || (prod.materials && prod.materials.length > 1));
    primaryState.has_variation_2 = Boolean(prod.has_variation_2 || prod.has_layer_2 || finishingsState.main.length > 0);
    primaryState.has_layer_2 = primaryState.has_variation_2;
    primaryState.has_variation_3 = Boolean(prod.has_variation_3 || prod.has_layer_3 || finishingsState.extra_1.length > 0);
    primaryState.has_layer_3 = primaryState.has_variation_3;
    primaryState.has_variation_4 = Boolean(prod.has_variation_4 || prod.has_layer_4 || finishingsState.extra_2.length > 0);
    primaryState.has_layer_4 = primaryState.has_variation_4;
    primaryState.has_extra_service = Boolean(prod.has_extra_service || prod.has_layer_5 || finishingsState.extra_3.length > 0);
    primaryState.has_layer_5 = primaryState.has_extra_service;

    primaryState.variation_scopes = prod.variation_scopes || {
      main: prod.scope_main || 'umum',
      extra_1: prod.scope_extra_1 || 'umum',
      extra_2: prod.scope_extra_2 || 'umum',
      extra_3: prod.scope_extra_3 || 'umum'
    };
    primaryState.scope_main = primaryState.variation_scopes.main || 'umum';
    primaryState.scope_extra_1 = primaryState.variation_scopes.extra_1 || 'umum';
    primaryState.scope_extra_2 = primaryState.variation_scopes.extra_2 || 'umum';
    primaryState.scope_extra_3 = primaryState.variation_scopes.extra_3 || 'umum';
    primaryState.wholesale_mode = prod.wholesale_mode || 'normal';
    primaryState.same_price_tiers = prod.same_price_tiers || { tier1: false, main: false, extra_1: false, extra_2: false, extra_3: false };
    primaryState.same_cost_tiers = prod.same_cost_tiers || { tier1: false, main: false, extra_1: false, extra_2: false, extra_3: false };
    primaryState.stock_mode_tiers = prod.stock_mode_tiers || { tier1: '', main: '', extra_1: '', extra_2: '', extra_3: '' };
    primaryState.specific_options_map = prod.specific_options_map || {};

    if (prod.variation_labels) {
      primaryState.variation_labels = {
        label_product: prod.variation_labels.label_product || 'Produk',
        label_tier_1: prod.variation_labels.label_tier_1 || '',
        label_tier_2: prod.variation_labels.label_tier_2 || '',
        label_extra_1: prod.variation_labels.label_extra_1 || '',
        label_extra_2: prod.variation_labels.label_extra_2 || '',
        label_extra_3: prod.variation_labels.label_extra_3 || ''
      };
    }

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
        
        <!-- Header Top Bar (Hanya tampil di Step 1) -->
        <div id="product-form-top-bar" class="${currentStep === 2 ? 'hidden' : 'flex'} items-center justify-between border-b border-slate-200 pb-3 gap-3">
          <div class="flex items-center gap-2 text-sm text-slate-500">
            <button type="button" id="btn-back-to-list" class="hover:text-emerald-600 transition flex items-center gap-1 font-medium cursor-pointer">
              <i data-lucide="arrow-left" class="w-4 h-4"></i> Daftar Produk
            </button>
            <span>/</span>
            <span class="text-slate-800 font-semibold">${formMode === 'edit' ? 'Edit Produk' : 'Tambah Produk Baru'}</span>
          </div>
        </div>

        <!-- FORM MAIN CONTAINER WITH RIGHT PADDING WHEN PREVIEW SIDEBAR IS OPEN -->
        <div class="w-full relative">
          
          <!-- WIZARD FORM COLUMN -->
          <div id="wizard-form-col" class="w-full ${isLivePreviewOpen && primaryState.is_active ? 'lg:pr-[400px] xl:pr-[440px]' : ''} space-y-6 transition-all duration-300">
            
            <!-- Visual Error Summary Container -->
            <div id="form-error-banner" class="hidden p-4 rounded-md border border-red-200 bg-red-50 text-red-800 text-sm animate-shake">
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
              <div class="bg-white rounded-lg border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6">
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

                <!-- Input 1: Jenis Produk / Layanan ([Fisik] | [Non Fisik]) -->
                <div class="space-y-2.5 pt-1" id="section-step1-input1-type">
                  <div class="flex items-center justify-between">
                    <label class="block text-xs font-bold text-slate-800">
                      Jenis Produk / Layanan <span class="text-red-500">*</span>
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
                        <span class="text-[11px] text-slate-500 block">Layanan jasa profesional, produk digital, voucher, atau reservasi tanpa pengiriman fisik.</span>
                      </div>
                    </label>
                  </div>
                </div>

                <!-- State Terkunci Step 1: Belum Memilih Jenis Produk (Clean Shopee-Style Card Tanpa Gembok) -->
                <div id="step1-gated-placeholder" class="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 select-none mt-4 ${!primaryState.product_type ? 'block' : 'hidden'}">
                  <h3 class="text-base font-bold text-slate-400">Pengaturan Detail Produk</h3>
                  <p class="text-xs text-slate-400 mt-2">Tersedia setelah memilih jenis produk / layanan</p>
                </div>

                <!-- Bagian Lanjutan Step 1: Dibuka setelah Jenis Produk Terpilih -->
                <div id="step1-unlocked-fields" class="${!primaryState.product_type ? 'hidden' : 'block'} space-y-6">

                  <!-- Input 2: Tampilkan di Etalase Toko -->
                  <div id="section-step1-input2-etalase" class="space-y-2">
                    <hr class="border-slate-100" />
                    <div class="flex items-center justify-between pt-1">
                      <div>
                        <label class="block text-xs font-bold text-slate-800">
                          Tampilkan di Etalase Toko
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

                  <!-- Input 3: Pilih Jenis Model Kartu Produk (Hanya jika Etalase ON) -->
                  <div id="section-step1-input3-cardmodel" class="${!primaryState.is_active ? 'hidden' : 'space-y-3'}">
                    <hr class="border-slate-100" />
                    <div class="border-b border-slate-100 pb-2">
                      <label class="block text-xs font-bold text-slate-800">
                        Pilih Jenis Model Kartu Produk <span class="text-red-500">*</span>
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

                  <!-- State Terkunci Poin 4, 5, 6 jika Model Kartu Belum Dipilih (Etalase Aktif) -->
                  <div id="step1-cardmodel-gated-placeholder" class="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 select-none mt-4 ${primaryState.is_active && !primaryState.card_variant ? 'block' : 'hidden'}">
                    <h3 class="text-base font-bold text-slate-400">Foto & Identitas Produk</h3>
                    <p class="text-xs text-slate-400 mt-2">Tersedia setelah memilih model kartu produk</p>
                  </div>

                  <!-- Container Poin 4, 5, 6: Dibuka saat Model Kartu Dipilih (atau jika Etalase OFF) -->
                  <div id="step1-cardmodel-unlocked-fields" class="${primaryState.is_active && !primaryState.card_variant ? 'hidden' : 'block'} space-y-6">

                    <!-- Input 4: Foto Produk * (Hanya jika Etalase ON) -->
                    <div id="section-step1-input4-photo" class="${!primaryState.is_active ? 'hidden' : 'space-y-3'}">
                      <hr class="border-slate-100" />
                      <div class="border-b border-slate-100 pb-2">
                        <label class="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
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

                        <!-- Hidden Multi-file input -->
                        <input type="file" id="input-prod-images-hidden" multiple accept="image/jpeg,image/png,image/webp" class="hidden" />
                        <input type="file" id="input-prod-image" multiple accept="image/jpeg,image/png,image/webp" class="hidden" />

                        <!-- 10-Slot Grid Container Responsif -->
                        <div id="gallery-slots-container" data-container="image-gallery-container" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-2.5 sm:gap-3">
                          ${renderGalleryThumbnails()}
                        </div>
                      </div>
                    </div>

                    <!-- Input 5: Nama Produk * -->
                    <div id="section-step1-input5-name" class="space-y-3">
                      <hr class="border-slate-100" />
                      <div class="border-b border-slate-100 pb-2 flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <label for="input-prod-name" class="block text-xs font-bold text-slate-800">
                            Nama Produk <span class="text-red-500">*</span>
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

                    <!-- Input 6: Tambahkan Label Khusus -->
                    <div id="section-step1-input6-labels" class="space-y-4">
                      <hr class="border-slate-100" />
                      <div class="pb-2 border-b border-slate-100 flex items-center justify-between gap-3">
                        <div>
                          <label class="block text-xs font-bold text-slate-800">
                            Tambahkan Label Khusus
                          </label>
                          <p class="text-xs text-slate-500 mt-0.5">Label promosi khusus di kartu etalase (misal: Free Ongkir, Best Seller, Siap 1 Jam).</p>
                        </div>
                        <!-- TOGGLE SWITCH ON/OFF -->
                        <label class="relative inline-flex items-center cursor-pointer select-none">
                          <input type="checkbox" id="toggle-enable-custom-labels" class="sr-only peer" ${primaryState.show_badge !== false ? 'checked' : ''}>
                          <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>

                      <div id="container-custom-labels-inputs" class="${primaryState.show_badge !== false ? 'space-y-4' : 'hidden'}">
                        <p class="text-xs text-slate-500">Saran: Gunakan 1–2 kata singkat per label (maks. 10–12 karakter) agar seluruh label muat di kartu.</p>

                        <div class="space-y-2">
                          <span class="text-[11px] font-semibold text-slate-500">Preset Populer (1-Klik untuk Mengisi):</span>
                          <div class="flex flex-wrap gap-1.5">
                            <button type="button" class="btn-preset-label-step1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer" data-label="Free Ongkir">+ Free Ongkir</button>
                            <button type="button" class="btn-preset-label-step1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer" data-label="Best Seller">+ Best Seller</button>
                            <button type="button" class="btn-preset-label-step1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer" data-label="Paling Laris">+ Paling Laris</button>
                            <button type="button" class="btn-preset-label-step1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer" data-label="Garansi 100%">+ Garansi 100%</button>
                            <button type="button" class="btn-preset-label-step1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer" data-label="Siap 1 Jam">+ Siap 1 Jam</button>
                            <button type="button" class="btn-preset-label-step1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer" data-label="Diskon Spesial">+ Diskon Spesial</button>
                          </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                          <div>
                            <div class="flex items-center justify-between mb-1">
                              <label for="input-custom-label-1" class="block text-[11px] font-semibold text-slate-700">
                                Label 1 <span class="text-red-500">*</span>
                              </label>
                              <span id="char-count-label-1" class="text-[10px] font-mono text-slate-400">0/15</span>
                            </div>
                            <input 
                              type="text" 
                              id="input-custom-label-1" 
                              list="custom-labels-history-list"
                              value="${escapeHtml(primaryState.custom_labels?.[0] || '')}" 
                              placeholder="Slot 1 (misal: Free Ongkir)" 
                              class="input-custom-label-slot w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:border-emerald-500 outline-none bg-white font-medium"
                            />
                          </div>
                          <div>
                            <div class="flex items-center justify-between mb-1">
                              <label for="input-custom-label-2" class="block text-[11px] font-semibold text-slate-700">
                                Label 2 (Opsional)
                              </label>
                              <div id="warn-label-2" class="hidden"></div>
                            </div>
                            <input 
                              type="text" 
                              id="input-custom-label-2" 
                              list="custom-labels-history-list"
                              value="${escapeHtml(primaryState.custom_labels?.[1] || '')}" 
                              placeholder="Slot 2 (misal: Best Seller)" 
                              class="input-custom-label-slot w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:border-emerald-500 outline-none bg-white font-medium"
                            />
                          </div>
                          <div>
                            <div class="flex items-center justify-between mb-1">
                              <label for="input-custom-label-3" class="block text-[11px] font-semibold text-slate-700">
                                Label 3 (Opsional)
                              </label>
                              <div id="warn-label-3" class="hidden"></div>
                            </div>
                            <input 
                              type="text" 
                              id="input-custom-label-3" 
                              list="custom-labels-history-list"
                              value="${escapeHtml(primaryState.custom_labels?.[2] || '')}" 
                              placeholder="Slot 3 (misal: Garansi 100%)" 
                              class="input-custom-label-slot w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:border-emerald-500 outline-none bg-white font-medium"
                            />
                          </div>
                        </div>

                        <!-- Indikator Info Kapasitas Baris Label Pintar -->
                        <div id="custom-labels-capacity-info" class="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 pt-1">
                          ${getCustomLabelsCapacityMessage(primaryState.name, primaryState.custom_labels)}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              <!-- TOMBOL AKSI BAWAH STEP 1 -->
              <div class="bg-white/95 backdrop-blur-md rounded-lg border border-slate-200 shadow-sm p-4 flex items-center justify-between">
                <button type="button" id="btn-step-1-cancel" class="px-5 py-2.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5">
                  <i class="bi bi-x-lg"></i>
                  <span>Batal</span>
                </button>
                <button type="button" id="btn-step-1-next" class="btn-primary-brand px-6 py-2.5 rounded-md text-xs font-bold text-white shadow-md flex items-center gap-2 transition cursor-pointer">
                  <span>Lanjutkan</span>
                  <i class="bi bi-arrow-right"></i>
                </button>
              </div>
            </div>

            <!-- ============================================== -->
            <!-- STEP 2 PANE: MURNI STEP 2 DENGAN 6 CARD GATING -->
            <!-- ============================================== -->
            <div id="step-pane-2" class="space-y-6 ${currentStep === 2 ? 'block' : 'hidden'}">
              ${currentStep === 2 ? renderStep2Content() : ''}
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
            <div class="flex justify-center w-full py-3 bg-slate-50/60 rounded-lg border border-dashed border-slate-200">
              <div id="product-card-preview-container" class="w-full max-w-[240px]">
                <div id="card-live-preview-box">
                  <!-- Rendered dynamically -->
                </div>
              </div>
            </div>

            <!-- Visual Customization Controls: [Default] dan [Ubah Kartu] (Step 1 Only) -->
            <div id="card-customization-section" class="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-3">
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
                      <input type="color" id="cfg-bg-color" value="#ffffff" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-bg-text" value="#ffffff" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Border</label>
                    <div class="flex items-center gap-1.5">
                      <input type="color" id="cfg-border-color" value="#e2e8f0" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-border-text" value="#e2e8f0" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Judul</label>
                    <div class="flex items-center gap-1.5">
                      <input type="color" id="cfg-title-color" value="#0f172a" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-title-text" value="#0f172a" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Harga</label>
                    <div class="flex items-center gap-1.5">
                      <input type="color" id="cfg-price-color" value="#059669" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-price-text" value="#059669" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tombol Beli</label>
                    <div class="flex items-center gap-1.5">
                      <input type="color" id="cfg-btn-color" value="#059669" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-btn-text" value="#059669" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded" />
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
        <button type="button" id="btn-expand-preview-sidebar" class="${isLivePreviewOpen || !primaryState.is_active ? 'hidden' : 'hidden lg:flex'} fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-3.5 px-2.5 rounded-l-lg shadow-2xl flex flex-col items-center gap-2 cursor-pointer transition select-none group" title="Buka Live Preview">
          <i class="bi bi-eye text-base group-hover:scale-110 transition-transform"></i>
          <span class="text-[11px] font-extrabold uppercase tracking-wider" style="writing-mode: vertical-rl; text-orientation: mixed;">Live Preview</span>
        </button>
        <!-- MOBILE FLOATING ACTION BUTTON (FAB) (Posisikan di tengah bawah) -->
        <button type="button" id="btn-fab-live-preview" class="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 active:scale-95 text-white px-3.5 py-2 rounded-full shadow-lg flex items-center gap-1.5 text-xs font-bold transition-all duration-200 cursor-pointer select-none">
          <i class="bi bi-eye text-sm"></i>
          <span>Live Preview</span>
        </button>

        <!-- MOBILE BOTTOM SHEET / DRAWER -->
        <div id="mobile-preview-backdrop" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 hidden transition-opacity"></div>
        <div id="mobile-preview-sheet" class="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl border-t border-slate-200 max-h-[88vh] flex flex-col transform translate-y-full transition-transform duration-300 ease-out">
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
            <label class="w-full max-w-[260px] p-2 rounded-md bg-white border border-slate-200 flex items-center gap-2 text-[11px] font-bold text-slate-700 cursor-pointer hover:bg-emerald-50/50 transition shadow-2xs">
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
            <div id="card-customization-section-mob" class="w-full max-w-[340px] bg-slate-50/70 rounded-lg border border-slate-200 p-3.5 space-y-3 text-left">
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
                      <input type="color" id="cfg-bg-color-mob" value="#ffffff" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-bg-text-mob" value="#ffffff" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Border</label>
                    <div class="flex items-center gap-1.5">
                      <input type="color" id="cfg-border-color-mob" value="#e2e8f0" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-border-text-mob" value="#e2e8f0" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Judul</label>
                    <div class="flex items-center gap-1.5">
                      <input type="color" id="cfg-title-color-mob" value="#0f172a" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-title-text-mob" value="#0f172a" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Warna Harga</label>
                    <div class="flex items-center gap-1.5">
                      <input type="color" id="cfg-price-color-mob" value="#059669" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-price-text-mob" value="#059669" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tombol Beli</label>
                    <div class="flex items-center gap-1.5">
                      <input type="color" id="cfg-btn-color-mob" value="#059669" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                      <input type="text" id="cfg-btn-text-mob" value="#059669" class="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white" />
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

        <!-- MODAL MINI: TAMBAH KATEGORI / SUB-KATEGORI BARU CEPAT -->
        <div id="modal-quick-add-category" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 hidden">
          <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 sm:p-6 space-y-4 animate-scaleIn">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  <i class="bi bi-folder-plus"></i>
                </div>
                <div>
                  <h3 id="quick-cat-modal-title" class="text-sm font-bold text-slate-900">Tambah Kategori Baru</h3>
                  <p class="text-[11px] text-slate-500">Buat Kategori Utama atau Sub-Kategori langsung tanpa reload.</p>
                </div>
              </div>
              <button type="button" id="btn-close-quick-cat" class="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <!-- Pilihan Jenis: Kategori Utama vs Sub-Kategori -->
            <div class="space-y-1.5 text-xs">
              <label class="block font-bold text-slate-700">Tipe Kategori yang Ditambahkan:</label>
              <div class="grid grid-cols-2 gap-2">
                <label class="p-2.5 rounded-xl border border-slate-200 cursor-pointer flex items-center gap-2 bg-slate-50 hover:bg-emerald-50/40 transition">
                  <input type="radio" name="quick_cat_type_radio" value="main" checked class="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                  <span class="font-bold text-slate-800 text-xs">Kategori Utama</span>
                </label>
                <label class="p-2.5 rounded-xl border border-slate-200 cursor-pointer flex items-center gap-2 bg-slate-50 hover:bg-emerald-50/40 transition">
                  <input type="radio" name="quick_cat_type_radio" value="sub" class="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                  <span class="font-bold text-slate-800 text-xs">Sub-Kategori</span>
                </label>
              </div>
            </div>

            <!-- Parent Category Select (Muncul jika Sub-Kategori dipilih) -->
            <div id="quick-cat-parent-wrapper" class="hidden space-y-1.5 text-xs">
              <label for="select-quick-cat-parent" class="block font-bold text-slate-700">Pilih Kategori Utama Induk: <span class="text-red-500">*</span></label>
              <select id="select-quick-cat-parent" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:border-emerald-500 outline-none bg-white">
                ${allCategories.map(c => `<option value="${c.id}" ${String(primaryState.category_id) === String(c.id) ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
              </select>
            </div>

            <div class="space-y-1.5 text-xs">
              <label for="input-quick-cat-name" id="label-quick-cat-name" class="block font-bold text-slate-700">
                Nama Kategori Baru <span class="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                id="input-quick-cat-name" 
                placeholder="Contoh: Pakaian & Fashion, Elektronik, Makanan & Minuman..." 
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-xs font-medium outline-none transition" 
              />
              <p id="quick-cat-error-msg" class="hidden text-[11px] font-semibold text-red-600"></p>
            </div>

            <div class="flex items-center justify-end gap-2.5 pt-2">
              <button type="button" id="btn-cancel-quick-cat" class="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer">
                Batal
              </button>
              <button type="button" id="btn-save-quick-cat" class="btn-primary-brand px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition cursor-pointer">
                <i class="bi bi-check-lg"></i>
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

  // --- HELPER OTOMASI KAPASITAS BARIS LABEL PINTAR (2 vs 3 Label) ---
  function getSmartVisibleBadges(productName, labelsArray) {
    const validLabels = (Array.isArray(labelsArray) ? labelsArray : [])
      .map(l => String(l || '').trim())
      .filter(Boolean);
    if (validLabels.length === 0) return [];

    const nameLen = (productName || '').trim().length;
    const isShortName = nameLen <= 28;
    const totalLabelChars = validLabels.slice(0, 3).join('').length;

    // Aturan 1: Jika productName hanya 1 baris (<= 28 karakter)
    if (isShortName) {
      if (totalLabelChars > 24) {
        return validLabels.slice(0, 2);
      }
      return validLabels.slice(0, 3);
    } else {
      // Aturan 2: Jika productName mencapai 2 baris (> 28 karakter)
      if (validLabels.length >= 3 && totalLabelChars <= 16) {
        return validLabels.slice(0, 3);
      }
      return validLabels.slice(0, 2);
    }
  }

  function getCustomLabelsCapacityMessage(productName, labelsArray) {
    const valid = (Array.isArray(labelsArray) ? labelsArray : [])
      .map(l => String(l || '').trim())
      .filter(Boolean);
    if (valid.length === 0) {
      return '<i class="bi bi-info-circle text-slate-400"></i><span>Isi slot label di atas untuk menampilkan label promosi di kartu etalase.</span>';
    }
    const nameLen = (productName || '').trim().length;
    const isShortName = nameLen <= 28;
    const visible = getSmartVisibleBadges(productName, valid);

    if (visible.length === valid.length) {
      return `<i class="bi bi-check-circle-fill text-emerald-600"></i><span class="text-emerald-700">Menampilkan ${visible.length} label (teks singkat & muat di kartu)</span>`;
    } else {
      const reason = !isShortName ? 'judul produk 2 baris' : 'total teks melebihi kapasitas';
      return `<i class="bi bi-info-circle-fill text-amber-500"></i><span class="text-amber-700 font-medium">Menampilkan ${visible.length} dari ${valid.length} label (dibatasi otomatis agar rapi karena ${reason})</span>`;
    }
  }

  function updateProductCardLivePreview() {
    const previewContainer = document.getElementById('card-live-preview-box') || document.getElementById('product-card-preview-container');
    const mobilePreviewContainer = document.getElementById('mobile-card-preview-container');
    if (!previewContainer && !mobilePreviewContainer) return;

    const variantRadio = document.querySelector('input[name="card_variant_radio"]:checked');
    const variant = variantRadio ? variantRadio.value : (primaryState.card_variant || '');

    // Kotak Simulasikan Diskon ON & Panel Desain Kartu
    const simDiscountDesk = document.getElementById('cfg-simulate-countdown-preview')?.closest('label');
    const simDiscountMob = document.getElementById('cfg-simulate-countdown-preview-mob')?.closest('label');
    const customSectionDesk = document.getElementById('card-customization-section');
    const customSectionMob = document.getElementById('card-customization-section-mob');

    // Jika card_variant masih kosong (belum dipilih oleh seller):
    if (!variant) {
      if (simDiscountDesk) simDiscountDesk.classList.add('hidden');
      if (simDiscountMob) simDiscountMob.classList.add('hidden');
      if (customSectionDesk) customSectionDesk.classList.add('hidden');
      if (customSectionMob) customSectionMob.classList.add('hidden');

      const placeholderHtml = `
        <div class="p-8 rounded-lg border border-slate-200 bg-slate-50/70 text-center space-y-2 my-4">
          <div class="w-10 h-10 rounded-full bg-slate-200/70 text-slate-500 flex items-center justify-center mx-auto">
            <i class="bi bi-layout-wtf text-base"></i>
          </div>
          <p class="text-xs font-bold text-slate-700">Jenis Kartu Belum Ditentukan</p>
          <p class="text-[11px] text-slate-500 leading-relaxed">Pilih salah satu model kartu produk pada formulir di samping untuk menampilkan pratinjau kartu etalase.</p>
        </div>
      `;
      if (previewContainer) previewContainer.innerHTML = placeholderHtml;
      if (mobilePreviewContainer) mobilePreviewContainer.innerHTML = placeholderHtml;
      return;
    }

    if (simDiscountDesk) simDiscountDesk.classList.remove('hidden');
    if (simDiscountMob) simDiscountMob.classList.remove('hidden');
    if (customSectionDesk) customSectionDesk.classList.remove('hidden');
    if (customSectionMob) customSectionMob.classList.remove('hidden');

    // 1. Baca data langsung dari form DOM
    const nameInput = document.getElementById('input-prod-name');
    const name = (nameInput?.value || primaryState.name || '').trim() || 'Nama Produk Unggulan';

    const catSelect = document.getElementById('select-prod-cat');
    const catId = catSelect?.value || primaryState.category_id;
    const allCats = DB.getCategories ? DB.getCategories() : [];
    const matchedCat = allCats.find(c => c.id === catId);
    const catName = matchedCat ? matchedCat.name : 'Katalog Pilihan';

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

    // 6. Config Styling & Display Toggles (Perbaiki Bug Kartu Live Preview Berwarna Hitam)
    const showBadgeInput = document.getElementById('cfg-show-badge');
    const showBadgeBlokAInput = document.getElementById('cfg-show-badge-blok-a');
    const showBadgeChecked = showBadgeInput ? showBadgeInput.checked : (showBadgeBlokAInput ? showBadgeBlokAInput.checked : true);

    // Cek apakah panel kustomisasi kartu sedang aktif dalam mode Ubah Kartu
    const isCustomDesignActive = document.getElementById('panel-card-custom-content') && !document.getElementById('panel-card-custom-content').classList.contains('hidden');

    let rawBg = document.getElementById('cfg-bg-color')?.value;
    let rawBorder = document.getElementById('cfg-border-color')?.value;
    let rawTitle = document.getElementById('cfg-title-color')?.value;
    let rawPrice = document.getElementById('cfg-price-color')?.value;
    let rawBtn = document.getElementById('cfg-btn-color')?.value;

    // Pastikan jika mode default atau belum diubah, bg_color = #ffffff (putih bersih), tidak pernah #000000!
    const safeBg = (!isCustomDesignActive || !rawBg || rawBg.toLowerCase() === '#000000') ? '#ffffff' : rawBg;
    const safeBorder = (!isCustomDesignActive || !rawBorder || rawBorder.toLowerCase() === '#000000') ? '#e2e8f0' : rawBorder;
    const safeTitle = (!isCustomDesignActive || !rawTitle || rawTitle.toLowerCase() === '#000000') ? '#0f172a' : rawTitle;
    const safePrice = (!isCustomDesignActive || !rawPrice || rawPrice.toLowerCase() === '#000000') ? '#059669' : rawPrice;
    const safeBtn = (!isCustomDesignActive || !rawBtn || rawBtn.toLowerCase() === '#000000') ? '#059669' : rawBtn;

    const cfg = {
      bg_color: safeBg,
      border_color: safeBorder,
      border_radius: document.getElementById('cfg-border-radius')?.value || '16px',
      title_color: safeTitle,
      price_color: safePrice,
      btn_color: safeBtn,
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

    // Ambil maksimal 3 label kustom dari input DOM atau state
    const label1Input = document.getElementById('input-custom-label-1') || document.getElementById('step2-input-label-1');
    const label2Input = document.getElementById('input-custom-label-2') || document.getElementById('step2-input-label-2');
    const label3Input = document.getElementById('input-custom-label-3') || document.getElementById('step2-input-label-3');
    const customLabel1 = (label1Input ? label1Input.value : (primaryState.custom_labels?.[0] || '')).trim();
    const customLabel2 = (label2Input ? label2Input.value : (primaryState.custom_labels?.[1] || '')).trim();
    const customLabel3 = (label3Input ? label3Input.value : (primaryState.custom_labels?.[2] || '')).trim();
    let rawCustomLabels = [customLabel1, customLabel2, customLabel3].filter(Boolean);

    if (rawCustomLabels.length === 0 && Array.isArray(primaryState.custom_labels) && primaryState.custom_labels.length > 0) {
      rawCustomLabels = primaryState.custom_labels.filter(Boolean);
    }
    primaryState.custom_labels = rawCustomLabels.slice(0, 3);

    const customBadges = getSmartVisibleBadges(name, rawCustomLabels);

    const capInfoEl = document.getElementById('custom-labels-capacity-info');
    if (capInfoEl) {
      capInfoEl.innerHTML = getCustomLabelsCapacityMessage(name, rawCustomLabels);
    }

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

      // 1. Hitung harga utama per unit (Akumulasi Variasi 1 s/d Variasi 4)
      let v1Price = 0;
      if (materialsState && materialsState.length > 0) {
        v1Price = parseFloat(materialsState[0].price) || 0;
      }
      let v2Price = 0;
      if (primaryState.has_variation_2 && finishingsState.main && finishingsState.main.length > 0) {
        v2Price = parseFloat(finishingsState.main[0].price) || 0;
      }
      let v3Price = 0;
      if (primaryState.has_variation_3 && finishingsState.extra_1 && finishingsState.extra_1.length > 0) {
        v3Price = parseFloat(finishingsState.extra_1[0].price) || 0;
      }
      let v4Price = 0;
      if (primaryState.has_variation_4 && finishingsState.extra_2 && finishingsState.extra_2.length > 0) {
        v4Price = parseFloat(finishingsState.extra_2[0].price) || 0;
      }

      // Layanan Extras Direct / Otomatis
      let extraDirectPrice = 0;
      if (primaryState.has_extra_service && finishingsState.extra_3 && finishingsState.extra_3.length > 0) {
        finishingsState.extra_3.forEach(ex => {
          const xt = String(ex.extra_type || '').toLowerCase();
          if (xt === 'direct' || xt === 'langsung proses') {
            extraDirectPrice += parseFloat(ex.price) || 0;
          }
        });
      }

      const comboUnitBase = (v1Price + v2Price + v3Price + v4Price);
      const displayBasePrice = comboUnitBase > 0 ? (comboUnitBase + extraDirectPrice) : basePrice;

      let step2StrikePrice = displayBasePrice;
      let step2FinalPrice = displayBasePrice;
      if (effHasDiscount) {
        if (hasDiscount && discPercent > 0) {
          step2FinalPrice = Math.round(displayBasePrice * (1 - (discPercent / 100)));
        } else {
          step2FinalPrice = Math.round(displayBasePrice * 0.5);
          step2StrikePrice = displayBasePrice * 2;
        }
      }

      const miniPdpHtml = `
        <div class="w-full bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden text-left font-sans">
          <!-- Foto Utama Mini PDP -->
          <div class="relative w-full aspect-square bg-slate-100 overflow-hidden">
            ${hasPhoto && img ? `
              <img src="${img}" class="w-full h-full object-cover" alt="${escapeHtml(name)}" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center text-slate-300\\'><i class=\\'bi bi-box-seam text-4xl\\'></i></div>';" />
            ` : `
              <div class="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <i class="bi bi-box-seam text-4xl mb-1 text-slate-300"></i>
                <span class="text-[10px] font-semibold text-slate-400">Foto Cover</span>
              </div>
            `}
            ${effHasDiscount ? `
              <span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider text-white bg-red-500 shadow-sm leading-none">
                Diskon ${effDiscPercent}%
              </span>
            ` : ''}
            <span class="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-900/60 backdrop-blur-xs text-white">
              1 / ${Math.max(1, (primaryState.images || []).length)} Foto
            </span>
          </div>

          <div class="p-3.5 space-y-3">
            <!-- Judul & Harga Akumulasi -->
            <div>
              <h3 class="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                ${escapeHtml(name)}
              </h3>
              <div class="flex items-baseline gap-2 mt-1.5 flex-wrap">
                <span class="text-sm sm:text-base font-extrabold" style="color: ${accentColor};">
                  ${formatIDR(step2FinalPrice)}
                </span>
                ${effHasDiscount ? `
                  <span class="text-[11px] line-through text-slate-400 font-normal">
                    ${formatIDR(step2StrikePrice)}
                  </span>
                ` : ''}
                <span class="text-[10px] text-slate-500 font-medium">/ unit</span>
              </div>
            </div>

            <!-- Variasi 1 (Bahan Utama) -->
            <div class="space-y-1.5 pt-2 border-t border-slate-100">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">${escapeHtml(primaryState.variation_labels?.label_tier_1 || 'Variasi 1')}:</span>
              <div class="flex flex-wrap gap-1.5">
                ${(materialsState && materialsState.length > 0) ? materialsState.map((m, idx) => `
                  <span class="px-2 py-1 rounded-lg text-[10px] font-semibold transition ${idx === 0 ? 'text-white shadow-2xs' : 'bg-slate-100 text-slate-700 border border-slate-200'}" style="${idx === 0 ? `background-color: ${accentColor};` : ''}">
                    ${escapeHtml(m.name || `Opsi ${idx + 1}`)}
                  </span>
                `).join('') : `
                  <span class="text-[10px] text-slate-400 italic">Belum ada bahan ditambahkan</span>
                `}
              </div>
            </div>

            <!-- Variasi 2 (Jika Aktif) -->
            ${primaryState.has_variation_2 && finishingsState.main && finishingsState.main.length > 0 ? `
              <div class="space-y-1.5 pt-2 border-t border-slate-100">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">${escapeHtml(primaryState.variation_labels?.label_tier_2 || 'Variasi 2')}:</span>
                <div class="flex flex-wrap gap-1.5">
                  ${finishingsState.main.map((f, idx) => `
                    <span class="px-2 py-1 rounded-lg text-[10px] font-semibold transition ${idx === 0 ? 'text-white shadow-2xs' : 'bg-slate-100 text-slate-700 border border-slate-200'}" style="${idx === 0 ? `background-color: ${accentColor};` : ''}">
                      ${escapeHtml(f.name || `Opsi ${idx + 1}`)}
                    </span>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Variasi 3 (Jika Aktif) -->
            ${primaryState.has_variation_3 && finishingsState.extra_1 && finishingsState.extra_1.length > 0 ? `
              <div class="space-y-1.5 pt-2 border-t border-slate-100">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">${escapeHtml(primaryState.variation_labels?.label_extra_1 || 'Variasi 3')}:</span>
                <div class="flex flex-wrap gap-1.5">
                  ${finishingsState.extra_1.map((f, idx) => `
                    <span class="px-2 py-1 rounded-lg text-[10px] font-semibold transition ${idx === 0 ? 'text-white shadow-2xs' : 'bg-slate-100 text-slate-700 border border-slate-200'}" style="${idx === 0 ? `background-color: ${accentColor};` : ''}">
                      ${escapeHtml(f.name || `Opsi ${idx + 1}`)}
                    </span>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Variasi 4 (Jika Aktif) -->
            ${primaryState.has_variation_4 && finishingsState.extra_2 && finishingsState.extra_2.length > 0 ? `
              <div class="space-y-1.5 pt-2 border-t border-slate-100">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">${escapeHtml(primaryState.variation_labels?.label_extra_2 || 'Variasi 4')}:</span>
                <div class="flex flex-wrap gap-1.5">
                  ${finishingsState.extra_2.map((f, idx) => `
                    <span class="px-2 py-1 rounded-lg text-[10px] font-semibold transition ${idx === 0 ? 'text-white shadow-2xs' : 'bg-slate-100 text-slate-700 border border-slate-200'}" style="${idx === 0 ? `background-color: ${accentColor};` : ''}">
                      ${escapeHtml(f.name || `Opsi ${idx + 1}`)}
                    </span>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Layanan Extras (Jika Aktif) -->
            ${primaryState.has_extra_service && finishingsState.extra_3 && finishingsState.extra_3.length > 0 ? `
              <div class="space-y-1.5 pt-2 border-t border-slate-100">
                <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">${escapeHtml(primaryState.variation_labels?.label_extra_3 || 'Layanan Extras')}:</span>
                <div class="space-y-1">
                  ${finishingsState.extra_3.map(ex => `
                    <div class="flex items-center justify-between text-[10px] p-1.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                      <span class="font-semibold text-slate-800">${escapeHtml(ex.name || 'Layanan Tambahan')}</span>
                      <div class="flex items-center gap-1.5">
                        <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">${escapeHtml(ex.extra_type || 'Chekclis')}</span>
                        <span class="font-bold text-emerald-700">+${formatIDR(ex.price || 0)}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

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

  // ==========================================================================
  // RENDER STEP 2: INFORMASI PENJUALAN (CARD DENGAN GERBANG KELENGKAPAN STEP 1)
  // ==========================================================================
  // HELPER GATING STEP 2: FLASHBACK CHECKER & CARD RENDERER
  // ==========================================================================
  function getMissingLabelsForCard(cardIndex) {
    const missing = [];
    // Card 1 checks:
    if (!primaryState.name || !primaryState.name.trim()) missing.push('Nama Produk');
    if (primaryState.is_active && (!primaryState.images || primaryState.images.length === 0) && !primaryState.image_url) {
      missing.push('Foto Produk');
    }
    if (!primaryState.category_id || String(primaryState.category_id).trim() === '') {
      missing.push('Kategori Produk');
    }

    // Card 2 (Informasi Penjualan) s/d Card 6 (Lainnya) dibuka bersamaan mengikuti kelengkapan Card 1 (Informasi Produk)
    return missing;
  }

  function renderFlashbackCard(cardTitle, cardIcon, missingLabels, cardId) {
    const missingFieldsText = Array.isArray(missingLabels) ? missingLabels.join(', ') : missingLabels;
    return `
      <div class="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 select-none" id="${cardId}">
        <h3 class="text-base font-bold text-slate-400">${escapeHtml(cardTitle)}</h3>
        <p class="text-xs text-slate-400 mt-2">Tersedia setelah memilih ${missingFieldsText}</p>
      </div>
    `;
  }

  // ==========================================================================
  // RENDER STEP 2: STICKY SUB-NAVBAR & 6 PROGRESSIVE GATING CARDS
  // ==========================================================================
  function renderStep2Content() {
    const isPhysical = primaryState.product_type !== 'non_physical';
    const shippingCfg = primaryState.shipping_config || {
      is_cod: false,
      couriers: ['pickup', 'instant', 'reguler'],
      weight: 100,
      weight_unit: 'gram',
      length: 10,
      width: 10,
      height: 5
    };

    const allCategories = (typeof DB !== 'undefined' && DB.getCategories) ? DB.getCategories() : [];
    const currentSubs = primaryState.category_id ? DB.getSubCategories(primaryState.category_id) : [];

    const missingCard1 = getMissingLabelsForCard(2);
    const missingCard2 = getMissingLabelsForCard(3);
    const missingCard3 = getMissingLabelsForCard(4);
    const missingCard4 = getMissingLabelsForCard(5);
    const missingCard5 = getMissingLabelsForCard(6);

    const vLabels = primaryState.variation_labels || {
      label_product: 'Produk',
      label_tier_1: 'Varian Utama',
      label_tier_2: 'Opsi Utama',
      label_extra_1: 'Opsi Tambahan 1',
      label_extra_2: 'Opsi Tambahan 2',
      label_extra_3: 'Opsi Tambahan 3'
    };

    return `
      <!-- 1. FIXED SUB-NAVBAR ANCHOR (CLEAN SHOPEE STYLE) -->
      <div id="step2-subnav-fixed" class="fixed top-16 left-0 lg:left-[4.5rem] ${isLivePreviewOpen && primaryState.is_active ? 'lg:right-[380px] xl:right-[420px]' : 'right-0'} z-30 bg-white border-b border-slate-200/80 transition-all duration-300">
        <nav class="flex items-center overflow-x-auto scrollbar-none px-4 sm:px-6" id="step2-subnav-links">
          <button type="button" class="step2-nav-tab px-4 py-3.5 text-xs sm:text-sm font-bold text-emerald-600 border-b-2 border-emerald-600 transition-colors whitespace-nowrap cursor-pointer bg-transparent" data-target="card-step2-info">
            Informasi Produk
          </button>
          <button type="button" class="step2-nav-tab px-4 py-3.5 text-xs sm:text-sm font-medium text-slate-600 border-b-2 border-transparent hover:text-emerald-600 hover:border-emerald-600 transition-colors whitespace-nowrap cursor-pointer bg-transparent" data-target="card-step2-sales">
            Informasi Penjualan
          </button>
          <button type="button" class="step2-nav-tab px-4 py-3.5 text-xs sm:text-sm font-medium text-slate-600 border-b-2 border-transparent hover:text-emerald-600 hover:border-emerald-600 transition-colors whitespace-nowrap cursor-pointer bg-transparent" data-target="card-step2-shipping">
            Pengiriman
          </button>
          <button type="button" class="step2-nav-tab px-4 py-3.5 text-xs sm:text-sm font-medium text-slate-600 border-b-2 border-transparent hover:text-emerald-600 hover:border-emerald-600 transition-colors whitespace-nowrap cursor-pointer bg-transparent" data-target="card-step2-promo">
            Program Promo
          </button>
          <button type="button" class="step2-nav-tab px-4 py-3.5 text-xs sm:text-sm font-medium text-slate-600 border-b-2 border-transparent hover:text-emerald-600 hover:border-emerald-600 transition-colors whitespace-nowrap cursor-pointer bg-transparent" data-target="card-step2-description">
            Deskripsi Produk
          </button>
          <button type="button" class="step2-nav-tab px-4 py-3.5 text-xs sm:text-sm font-medium text-slate-600 border-b-2 border-transparent hover:text-emerald-600 hover:border-emerald-600 transition-colors whitespace-nowrap cursor-pointer bg-transparent" data-target="card-step2-others">
            Lainnya
          </button>
        </nav>
      </div>

      <!-- CONTAINER 6 KARTU PROGRESSIVE GATING (RAPAT & PROPORSIONAL DI BAWAH FIXED SUBNAV) -->
      <div class="space-y-6 pt-6">

        <!-- CARD 1: INFORMASI PRODUK (SELALU TERBUKA) -->
        <div class="bg-white rounded-lg border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6" id="card-step2-info">
          <div class="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 class="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <i class="bi bi-info-circle text-emerald-600"></i>
                <span>Informasi Produk</span>
              </h2>
            </div>
          </div>

          <!-- Input Nama Produk -->
          <div class="space-y-2">
            <label for="step2-input-name" class="block text-xs font-bold text-slate-800">
              Nama Produk <span class="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              id="step2-input-name" 
              maxlength="150"
              value="${escapeHtml(primaryState.name)}"
              placeholder="Contoh: Kemeja Formal Pria Premium, Tumbler Stainless Steel..." 
              class="w-full px-4 py-2.5 rounded-md border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-slate-800 text-sm font-medium transition outline-none"
            />
          </div>

          <!-- Input Kategori & Sub-Kategori Produk -->
          <div class="space-y-3 pt-1 border-t border-slate-100">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label class="block text-xs font-bold text-slate-800">
                  Kategori Produk <span class="text-red-500">*</span>
                </label>
                <p class="text-xs text-slate-500 mt-0.5">Pilih kategori utama atau buat kategori baru.</p>
              </div>
              <button type="button" id="btn-quick-add-category-step2" class="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 transition cursor-pointer" title="Tambah Kategori">
                <i class="bi bi-plus-circle"></i>
                <span>Tambah Kategori</span>
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="select-step2-cat" class="block text-[11px] font-semibold text-slate-700 mb-1">
                  Kategori Utama <span class="text-red-500">*</span>
                </label>
                <select id="select-step2-cat" class="w-full px-3.5 py-2.5 rounded-md border border-slate-300 text-xs font-semibold focus:border-emerald-500 outline-none bg-white">
                  <option value="">-- Pilih Kategori Produk --</option>
                  ${allCategories.map(c => `
                    <option value="${c.id}" ${String(primaryState.category_id) === String(c.id) ? 'selected' : ''}>${escapeHtml(c.name)}</option>
                  `).join('')}
                </select>
              </div>
              <div>
                <label for="select-step2-sub-cat" class="block text-[11px] font-semibold text-slate-700 mb-1">
                  Sub-Kategori (Opsional)
                </label>
                <select id="select-step2-sub-cat" class="w-full px-3.5 py-2.5 rounded-md border border-slate-300 text-xs font-semibold focus:border-emerald-500 outline-none bg-white">
                  <option value="">-- Tanpa Sub-Kategori --</option>
                  ${currentSubs.map(s => `
                    <option value="${s.id}" ${String(primaryState.sub_category_id) === String(s.id) ? 'selected' : ''}>${escapeHtml(s.name)}</option>
                  `).join('')}
                </select>
              </div>
            </div>
          </div>

          ${primaryState.is_active ? `
            <!-- Foto Produk Ringkas di Step 2 -->
            <div class="space-y-2 pt-1 border-t border-slate-100">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-bold text-slate-800">
                  Foto Produk <span class="text-red-500">*</span>
                </label>
                <span class="text-[11px] text-slate-500">Total: ${primaryState.images?.length || 0} Foto Diunggah</span>
              </div>
              <div class="flex items-center gap-2 overflow-x-auto pb-1">
                ${(primaryState.images || []).map((img, i) => `
                  <div class="w-14 h-14 rounded-md border border-slate-200 overflow-hidden shrink-0 relative bg-slate-50">
                    <img src="${img}" alt="Cover ${i+1}" class="w-full h-full object-cover" />
                    ${i === 0 ? '<span class="absolute bottom-0 inset-x-0 bg-emerald-600 text-[8px] text-white font-bold text-center py-0.5">Cover</span>' : ''}
                  </div>
                `).join('')}
                <button type="button" id="btn-step2-upload-more" class="w-14 h-14 rounded-md border-2 border-dashed border-slate-300 hover:border-emerald-500 text-slate-400 hover:text-emerald-600 flex flex-col items-center justify-center gap-0.5 shrink-0 transition cursor-pointer">
                  <i class="bi bi-plus text-base"></i>
                  <span class="text-[9px] font-bold">Foto</span>
                </button>
              </div>
            </div>
          ` : ''}

          <!-- Label Khusus Ringkas di Step 2 (Read-Only jika ON, Sembunyi jika OFF) -->
          ${primaryState.show_badge !== false ? `
            <div class="space-y-2 pt-1 border-t border-slate-100">
              <div>
                <label class="block text-xs font-bold text-slate-800">Label Khusus</label>
                <p class="text-xs text-slate-500 mt-0.5">Label khusus telah dikunci. Kembali ke langkah sebelumnya jika ingin mengubah label.</p>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                ${(primaryState.custom_labels || []).filter(Boolean).length > 0 ? (primaryState.custom_labels || []).filter(Boolean).map(lbl => `
                  <div class="px-3 py-2 text-xs rounded-md border border-slate-200 bg-slate-100 text-slate-700 font-medium select-none flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>${escapeHtml(lbl)}</span>
                  </div>
                `).join('') : `
                  <div class="px-3 py-2 text-xs rounded-md border border-slate-200 bg-slate-50 text-slate-400 italic">Tidak ada label khusus yang diisi</div>
                `}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- CARD 2: INFORMASI PENJUALAN (GATED) -->
        ${missingCard1.length > 0 ? renderFlashbackCard('Informasi Penjualan', 'bi-shop', missingCard1, 'card-step2-sales') : `
          <div class="bg-white rounded-lg border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6" id="card-step2-sales">
            <div class="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 class="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <i class="bi bi-shop text-emerald-600"></i>
                  <span>Informasi Penjualan</span>
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">Konfigurasi jenis harga produk, kuota stok fisik, batas pembelian, harga grosir bertingkat, dan kelipatan pemesanan.</p>
              </div>
            </div>



            <!-- Jenis Harga Produk -->
            <div class="space-y-3.5">
              <div class="border-b border-slate-100 pb-2 flex items-center justify-between flex-wrap gap-2">
                <label for="select-pricing-model" class="block text-xs font-bold text-slate-800">
                  Jenis Harga Produk <span class="text-red-500">*</span>
                </label>
                <span class="text-[11px] text-slate-400">Pilih formula penetapan harga dasar produk</span>
              </div>

              <div>
                <select id="select-pricing-model" class="w-full sm:w-72 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:border-emerald-500 outline-none bg-white">
                  <option value="normal" ${primaryState.pricing_model === 'normal' ? 'selected' : ''}>Normal</option>
                  <option value="size" ${primaryState.pricing_model === 'size' ? 'selected' : ''}>Berdasar Ukuran</option>
                  <option value="weight" ${primaryState.pricing_model === 'weight' ? 'selected' : ''}>Berdasar Berat</option>
                  <option value="volume" ${primaryState.pricing_model === 'volume' ? 'selected' : ''}>Berdasar Volume</option>
                </select>
              </div>

              <!-- Sub-Panel Interaktif Berdasarkan Pilihan Jenis Harga -->
              <div id="pricing-model-interactive-container">
                ${renderPricingModelSection()}
              </div>
            </div>

            <!-- Pengaturan Pembelian Khusus Produk Tunggal (Disembunyikan jika Menggunakan Variasi) -->
            <div id="single-product-purchase-settings" class="${(primaryState.pricing_model === 'normal' && !primaryState.has_variants) ? 'space-y-6' : 'hidden'}">
              <hr class="border-slate-100" />

              <!-- Stok Produk -->
              <div class="space-y-3">
                <div class="flex items-center justify-between pb-1 border-b border-slate-100">
                  <label class="block text-xs font-bold text-slate-800">Stok Produk</label>
                  <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 transition">
                    <input 
                      type="checkbox" 
                      id="toggle-unlimited-stock" 
                      ${primaryState.is_unlimited_stock ? 'checked' : ''} 
                      class="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Unlimited</span>
                  </label>
                </div>

                <div id="stock-input-wrapper" class="${primaryState.is_unlimited_stock ? 'hidden' : 'block'}">
                  <label for="input-stock-qty" class="block text-[11px] font-semibold text-slate-600 mb-1">Jumlah Kuota Stok Fisik Tersedia:</label>
                  <input 
                    type="number" 
                    id="input-stock-qty" 
                    min="0"
                    value="${primaryState.stock !== null ? primaryState.stock : 0}" 
                    class="w-full sm:w-64 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:border-emerald-500 outline-none bg-white"
                    placeholder="0"
                  />
                </div>
              </div>

              <hr class="border-slate-100" />

              <!-- Minimal Jumlah Pembelian -->
              <div class="space-y-2">
                <label for="input-min-order" class="block text-xs font-bold text-slate-800">
                  Minimal Jumlah Pembelian <span class="text-red-500">*</span>
                </label>
                <div class="w-full sm:w-64">
                  <input 
                    type="number" 
                    id="input-min-order" 
                    min="1"
                    value="${primaryState.min_order || 1}" 
                    class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:border-emerald-500 outline-none bg-white"
                  />
                  <span class="text-[10px] text-slate-400 mt-1 block">Bawaan standar: 1</span>
                </div>
              </div>

              <hr class="border-slate-100" />

              <!-- Maksimal Jumlah Pembelian (Combobox: Nilai Rekomendasi + Input Manual) -->
              <div class="space-y-3">
                <div class="flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <label for="input-normal-max-order" class="block text-xs font-bold text-slate-800">
                    Maksimal Jumlah Pembelian
                  </label>
                  <div class="group relative cursor-pointer inline-flex items-center text-slate-400 hover:text-slate-600">
                    <i class="bi bi-question-circle text-xs"></i>
                    <div class="hidden group-hover:block absolute left-5 top-0 z-50 w-72 p-2.5 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl pointer-events-none leading-relaxed">
                      Maks. jumlah pembelian diatur pada level produk. Pengaturan ini membatasi maks. jumlah produk yang dapat dibeli per pesanan. Pilih 'Tanpa Max Order' untuk pembelian tanpa batas.
                    </div>
                  </div>
                </div>

                <div class="custom-combobox-wrapper relative w-full sm:w-64">
                  <input 
                    type="text" 
                    id="input-normal-max-order" 
                    class="custom-combobox-input w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:border-emerald-500 outline-none bg-white text-slate-800" 
                    placeholder="Ketik atau pilih" 
                    value="${(primaryState.max_order === null || primaryState.max_order === 0 || primaryState.max_order === undefined || primaryState.max_order === '' || primaryState.max_order_type === 'unlimited') ? 'Tanpa Max Order' : primaryState.max_order}" 
                    autocomplete="off" 
                  />
                  <div class="custom-combobox-popover hidden absolute left-0 top-full mt-1 w-full bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 text-left">
                    <div class="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none border-b border-slate-100">Nilai yang direkomendasikan</div>
                    <div class="max-h-48 overflow-y-auto">
                      <div class="combobox-item px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer font-medium flex items-center justify-between transition" data-value="Tanpa Max Order">
                        <span>Tanpa Max Order</span>
                      </div>
                      <div class="combobox-item px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer font-medium flex items-center justify-between transition" data-value="10">
                        <span>10</span>
                      </div>
                      <div class="combobox-item px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer font-medium flex items-center justify-between transition" data-value="50">
                        <span>50</span>
                      </div>
                      <div class="combobox-item px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer font-medium flex items-center justify-between transition" data-value="100">
                        <span>100</span>
                      </div>
                    </div>
                  </div>
                </div>
                <span class="text-[10px] text-slate-400 block">Ketik angka maks. batas pesanan atau pilih "Tanpa Max Order"</span>
              </div>

              <hr class="border-slate-100" />

              <!-- Harga Grosir -->
              <div class="space-y-3">
                <div class="flex items-center justify-between pb-1 border-b border-slate-100 flex-wrap gap-2">
                  <div class="flex items-center gap-2">
                    <button 
                      type="button" 
                      id="btn-toggle-wholesale" 
                      class="px-3.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <i class="bi ${primaryState.has_wholesale ? 'bi-check2' : 'bi-plus-lg'}"></i>
                      <span>${primaryState.has_wholesale ? 'Harga Grosir Aktif' : 'Harga Grosir'}</span>
                    </button>
                  </div>
                  <span class="text-[11px] text-slate-400">Atur harga satuan lebih murah untuk pesanan bertingkat</span>
                </div>

                <div id="wholesale-table-wrapper" class="${primaryState.has_wholesale ? 'block' : 'hidden'} pt-1 space-y-3">
                  <!-- Mode Grosir: Normal vs Bertingkat (Inline) -->
                  <div class="grid grid-cols-2 gap-2 text-xs">
                    <label class="p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer font-bold ${primaryState.wholesale_mode !== 'tiered' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-300 text-slate-700'}">
                      <input type="radio" name="inline_wholesale_mode" value="normal" ${primaryState.wholesale_mode !== 'tiered' ? 'checked' : ''} class="accent-emerald-600 cursor-pointer" />
                      <span>Mode Normal</span>
                    </label>
                    <label class="p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer font-bold ${primaryState.wholesale_mode === 'tiered' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-300 text-slate-700'}">
                      <input type="radio" name="inline_wholesale_mode" value="tiered" ${primaryState.wholesale_mode === 'tiered' ? 'checked' : ''} class="accent-emerald-600 cursor-pointer" />
                      <span>Mode Bertingkat</span>
                    </label>
                  </div>
                  <div id="inline-wholesale-body" class="space-y-3">
                    ${renderWholesaleTable()}
                  </div>
                </div>
              </div>

              <hr class="border-slate-100" />

              <!-- Kelipatan Pesanan -->
              <div class="space-y-3">
                <div class="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-slate-100">
                  <div class="flex items-center gap-2">
                    <button 
                      type="button" 
                      id="btn-toggle-order-multiple" 
                      class="px-3.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <i class="bi ${primaryState.has_order_multiple ? 'bi-check2' : 'bi-plus-lg'}"></i>
                      <span>${primaryState.has_order_multiple ? 'Kelipatan Pesanan Aktif' : 'Kelipatan Pesanan'}</span>
                    </button>
                  </div>
                  <span class="text-[11px] text-slate-400">Wajib kelipatan kuantitas (misal kelipatan 50 pcs)</span>
                </div>

                <div id="order-multiple-wrapper" class="${primaryState.has_order_multiple ? 'block' : 'hidden'} pt-1 space-y-3">
                  ${renderOrderMultipleSection()}
                </div>
              </div>
            </div>

          </div>
        `}

        <!-- CARD 3: PENGIRIMAN (GATED) -->
        ${missingCard2.length > 0 ? renderFlashbackCard('Pengiriman', 'bi-truck', missingCard2, 'card-step2-shipping') : `
          <div id="card-step2-shipping" class="${isPhysical ? 'block' : 'hidden'} bg-white rounded-lg border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
            <div class="border-b border-slate-100 pb-2">
              <h2 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <i class="bi bi-truck text-emerald-600"></i>
                <span>Pengiriman & Dimensi Paket</span>
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">Pengaturan opsi pengiriman dan perkiraan berat paket produk.</p>
            </div>

            <div class="space-y-3">
              <!-- Checkbox COD -->
              <label class="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition select-none">
                <input 
                  type="checkbox" 
                  id="toggle-is-cod" 
                  ${shippingCfg.is_cod ? 'checked' : ''} 
                  class="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <span class="text-xs font-bold text-slate-800 block">Sistem COD (Bayar di Tempat)</span>
                  <span class="text-[11px] text-slate-500 block">Izinkan pembeli membayar pesanan secara tunai saat barang diterima.</span>
                </div>
              </label>

              <!-- Pilihan Kurir -->
              <div class="space-y-1.5 pt-1">
                <label class="block text-xs font-bold text-slate-700">Pilihan Kurir Tersedia:</label>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  <label class="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer flex items-center gap-2 select-none text-xs">
                    <input type="checkbox" name="courier_checkbox" value="pickup" ${(shippingCfg.couriers || []).includes('pickup') ? 'checked' : ''} class="w-4 h-4 text-emerald-600 rounded cursor-pointer" />
                    <span class="font-medium text-slate-800">Ambil di Toko (Pickup)</span>
                  </label>
                  <label class="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer flex items-center gap-2 select-none text-xs">
                    <input type="checkbox" name="courier_checkbox" value="instant" ${(shippingCfg.couriers || []).includes('instant') ? 'checked' : ''} class="w-4 h-4 text-emerald-600 rounded cursor-pointer" />
                    <span class="font-medium text-slate-800">Kurir Instan Lokal</span>
                  </label>
                  <label class="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer flex items-center gap-2 select-none text-xs">
                    <input type="checkbox" name="courier_checkbox" value="reguler" ${(shippingCfg.couriers || []).includes('reguler') ? 'checked' : ''} class="w-4 h-4 text-emerald-600 rounded cursor-pointer" />
                    <span class="font-medium text-slate-800">Reguler (J&T/JNE/SiCepat)</span>
                  </label>
                  <label class="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer flex items-center gap-2 select-none text-xs">
                    <input type="checkbox" name="courier_checkbox" value="cargo" ${(shippingCfg.couriers || []).includes('cargo') ? 'checked' : ''} class="w-4 h-4 text-emerald-600 rounded cursor-pointer" />
                    <span class="font-medium text-slate-800">Kargo (Trucking)</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Berat & Dimensi Paket -->
            <div class="space-y-3 pt-3 border-t border-slate-100">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-800 mb-1">Berat Paket <span class="text-red-500">*</span>:</label>
                  <div class="flex items-center gap-2">
                    <input 
                      type="number" 
                      id="input-package-weight" 
                      min="1"
                      value="${shippingCfg.weight || 100}" 
                      class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:border-emerald-500 outline-none bg-white"
                      placeholder="100"
                    />
                    <select id="select-package-weight-unit" class="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none bg-white focus:border-emerald-500">
                      <option value="gram" ${shippingCfg.weight_unit === 'gram' ? 'selected' : ''}>gram</option>
                      <option value="kg" ${shippingCfg.weight_unit === 'kg' ? 'selected' : ''}>kg</option>
                    </select>
                  </div>
                  <span class="text-[10px] text-slate-400 mt-1 block">Digunakan untuk kalkulasi tarif ekspedisi kiloan.</span>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-800 mb-1">Ukuran Dimensi Paket (Opsional):</label>
                  <div class="grid grid-cols-3 gap-1.5">
                    <div>
                      <input type="number" id="input-dim-length" min="1" value="${shippingCfg.length || ''}" placeholder="P" class="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs text-center font-bold focus:border-emerald-500 outline-none bg-white" />
                      <span class="text-[9px] text-slate-400 block text-center mt-0.5">P (cm)</span>
                    </div>
                    <div>
                      <input type="number" id="input-dim-width" min="1" value="${shippingCfg.width || ''}" placeholder="L" class="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs text-center font-bold focus:border-emerald-500 outline-none bg-white" />
                      <span class="text-[9px] text-slate-400 block text-center mt-0.5">L (cm)</span>
                    </div>
                    <div>
                      <input type="number" id="input-dim-height" min="1" value="${shippingCfg.height || ''}" placeholder="T" class="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs text-center font-bold focus:border-emerald-500 outline-none bg-white" />
                      <span class="text-[9px] text-slate-400 block text-center mt-0.5">T (cm)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `}

        <!-- CARD 4: PROGRAM PROMO (GATED) -->
        ${missingCard3.length > 0 ? renderFlashbackCard('Program Promo', 'bi-tag', missingCard3, 'card-step2-promo') : `
          <div class="bg-white rounded-lg border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4" id="card-step2-promo">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <i class="bi bi-tag text-emerald-600"></i>
                  <span>Program Promo</span>
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">Program Diskon (persen % atau nominal IDR) & Jadwal Tanggal Otomatis.</p>
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
                <div>
                  <label for="input-monthly-promo-label" class="block text-xs font-semibold text-slate-700 mb-1">Label Teks Promo:</label>
                  <input 
                    type="text" 
                    id="input-monthly-promo-label" 
                    value="${escapeHtml(primaryState.monthly_promo_label || 'Promo Spesial')}"
                    placeholder="Promo Spesial"
                    class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:border-emerald-500 outline-none font-semibold"
                  />
                </div>

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
                      min="0"
                      value="${primaryState.discount_value || 0}"
                      class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-emerald-700 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div id="discount-auto-convert-box" class="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex items-center justify-between">
                    <div class="flex items-center gap-1.5 font-medium">
                      <i class="bi bi-arrow-repeat text-emerald-600"></i>
                      <span id="discount-auto-convert-text">Sistem otomatis mengonversi antara [%] dan [IDR].</span>
                    </div>
                    <span id="discount-auto-convert-badge" class="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[10px]">
                      0%
                    </span>
                  </div>
                </div>
              </div>

              <!-- JADWAL PROMO -->
              <div class="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2.5">
                <div class="flex items-center gap-2">
                  <i class="bi bi-calendar-check text-emerald-700"></i>
                  <h4 class="text-xs font-bold text-emerald-950">Jadwal Promo Otomatis</h4>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label for="input-promo-start-date" class="block text-[11px] font-bold text-slate-700 mb-1">
                      Tanggal Mulai Promo:
                    </label>
                    <input 
                      type="date" 
                      id="input-promo-start-date" 
                      value="${primaryState.promo_start_date || ''}" 
                      class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:border-emerald-500 outline-none bg-white"
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
                      class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:border-emerald-500 outline-none bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        `}

        <!-- CARD 5: DESKRIPSI PRODUK (GATED) -->
        ${missingCard4.length > 0 ? renderFlashbackCard('Deskripsi Produk', 'bi-file-text', missingCard4, 'card-step2-description') : `
          <div class="bg-white rounded-lg border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4" id="card-step2-description">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
              <div>
                <h2 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <i class="bi bi-file-text text-emerald-600"></i>
                  <span>Deskripsi Produk & AI Generator</span> <span class="text-red-500">*</span>
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">Jelaskan fitur, bahan, dan nilai lebih produk kepada pembeli.</p>
              </div>
              <button 
                type="button" 
                id="btn-ai-generate-desc" 
                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xs transition cursor-pointer"
                title="Rangkai deskripsi produk secara otomatis dengan AI"
              >
                <i class="bi bi-stars"></i>
                <span id="btn-ai-desc-text">Buat Deskripsi dengan AI</span>
              </button>
            </div>

            <div>
              <textarea 
                id="input-prod-desc" 
                rows="5" 
                placeholder="Jelaskan spesifikasi produk, keunggulan bahan, kelengkapan, dan catatan penting untuk pemesan..."
                class="w-full px-4 py-2.5 rounded-md border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-slate-800 text-sm transition outline-none resize-y"
              >${escapeHtml(primaryState.description)}</textarea>

              <div id="ai-description-preview-box" class="hidden mt-3 bg-emerald-50/60 border border-emerald-200 rounded-md p-4 space-y-3 transition">
                <div class="flex items-center justify-between pb-2 border-b border-emerald-100 flex-wrap gap-2">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center text-xs shadow-xs">
                      <i class="bi bi-stars"></i>
                    </div>
                    <span class="text-xs font-bold text-slate-900">Hasil Rangkaian Deskripsi AI</span>
                  </div>
                  <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">Pratinjau Siap Digunakan</span>
                </div>
                <div id="ai-description-preview-text" class="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-white/95 p-3.5 rounded-md border border-emerald-100 max-h-64 overflow-y-auto font-sans"></div>
                <div class="flex items-center justify-end gap-2 pt-1 border-t border-emerald-100/60">
                  <button type="button" id="btn-ai-desc-cancel" class="px-3.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer">
                    Batal
                  </button>
                  <button type="button" id="btn-ai-desc-apply" class="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer">
                    <i class="bi bi-check-lg"></i>
                    <span>Gunakan Teks Ini</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `}

        <!-- CARD 6: LAINNYA (GATED) -->
        ${missingCard5.length > 0 ? renderFlashbackCard('Lainnya', 'bi-sliders', missingCard5, 'card-step2-others') : `
          <div class="bg-white rounded-lg border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5" id="card-step2-others">
            <div class="border-b border-slate-100 pb-2">
              <h2 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <i class="bi bi-sliders text-emerald-600"></i>
                <span>Lainnya & Konfigurasi Tambahan</span>
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">Pengaturan pre-order, kondisi produk, SKU & footer khusus.</p>
            </div>

            <!-- Footer Strip Khusus Model 3 -->
            <div 
              id="section-card-footer-config" 
              class="${primaryState.card_variant === 'C' ? 'block' : 'hidden'} p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 space-y-4"
            >
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <i class="bi bi-layout-text-window-reverse"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-slate-900">Dua Strip Footer Kartu Etalase (Khusus Model 3)</h4>
                  <p class="text-[10px] text-slate-500">Merapikan tinggi kartu etalase agar seragam presisi.</p>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <span class="text-xs font-bold text-emerald-800 block">Footer 1 (Strip Atas):</span>
                  <input type="text" id="input-card-footer-text" value="${escapeHtml(primaryState.card_footer_text || 'Proses Cepat')}" class="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 outline-none" />
                  <select id="select-card-footer-icon" class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 outline-none">
                    <option value="truck" ${primaryState.footer_badge_icon === 'truck' ? 'selected' : ''}>Kirim Cepat (truck)</option>
                    <option value="clock" ${primaryState.footer_badge_icon === 'clock' ? 'selected' : ''}>Jam / Waktu (clock)</option>
                    <option value="zap" ${primaryState.footer_badge_icon === 'zap' ? 'selected' : ''}>Kilat / Express (zap)</option>
                    <option value="shield-check" ${primaryState.footer_badge_icon === 'shield-check' ? 'selected' : ''}>Garansi (shield-check)</option>
                  </select>
                </div>
                <div class="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <span class="text-xs font-bold text-emerald-900 block">Footer 2 (Strip Bawah):</span>
                  <input type="text" id="input-card-footer-2-text" value="${escapeHtml(primaryState.card_footer_2_text || 'Variasi Tersedia')}" class="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 outline-none" />
                  <select id="select-card-footer-2-icon" class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 outline-none">
                    <option value="minus" ${primaryState.footer_2_badge_icon === 'minus' ? 'selected' : ''}>Strip / Variasi (minus)</option>
                    <option value="layers" ${primaryState.footer_2_badge_icon === 'layers' ? 'selected' : ''}>Pilihan Paket (layers)</option>
                    <option value="shield-check" ${primaryState.footer_2_badge_icon === 'shield-check' ? 'selected' : ''}>Garansi Uang Kembali (shield-check)</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Kondisi, Pre-Order, SKU -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
              <div>
                <label for="select-prod-condition" class="block text-xs font-bold text-slate-800 mb-1">Kondisi Produk:</label>
                <select id="select-prod-condition" class="w-full px-3 py-2 rounded-md border border-slate-300 text-xs font-bold outline-none bg-white">
                  <option value="new" ${primaryState.condition === 'new' ? 'selected' : ''}>Baru</option>
                  <option value="used" ${primaryState.condition === 'used' ? 'selected' : ''}>Pernah Dipakai / Bekas</option>
                </select>
              </div>

              <div>
                <label for="input-prod-sku" class="block text-xs font-bold text-slate-800 mb-1">SKU Induk (Opsional):</label>
                <input type="text" id="input-prod-sku" value="${escapeHtml(primaryState.sku || '')}" placeholder="SKU-XXXX" class="w-full px-3 py-2 rounded-md border border-slate-300 text-xs font-mono outline-none" />
              </div>

              <div>
                <label for="input-prod-barcode" class="block text-xs font-bold text-slate-800 mb-1">Barcode / EAN (Opsional):</label>
                <input type="text" id="input-prod-barcode" value="${escapeHtml(primaryState.barcode || '')}" placeholder="899..." class="w-full px-3 py-2 rounded-md border border-slate-300 text-xs font-mono outline-none" />
              </div>
            </div>
          </div>
        `}

      </div>

      <!-- TOMBOL AKSI BAWAH STEP 2: KEMBALI, SIMPAN DRAF, SIMPAN PRODUK -->
      <div class="bg-white/95 backdrop-blur-md rounded-lg border border-slate-200 shadow-sm p-4 flex items-center justify-between flex-wrap gap-3 mt-6">
        <button type="button" id="btn-step-2-prev" class="px-5 py-2.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 cursor-pointer">
          <i class="bi bi-arrow-left"></i>
          <span>Kembali</span>
        </button>

        <div class="flex items-center gap-3">
          <!-- Tombol Simpan Draf -->
          <button type="button" id="btn-save-draft" class="px-5 py-2.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer">
            <i class="bi bi-file-earmark-text"></i>
            <span>Simpan Draf</span>
          </button>

          <!-- Tombol Simpan Produk -->
          <button type="button" id="btn-submit-product" class="btn-primary-brand px-6 py-2.5 rounded-md text-xs font-bold text-white shadow-lg flex items-center gap-2 transition cursor-pointer">
            <span id="btn-submit-spinner" class="hidden w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <i id="btn-submit-icon" class="bi bi-floppy"></i>
            <span id="btn-submit-text">Simpan Produk</span>
          </button>
        </div>
      </div>
    `;
  }

  // Rekomendasi Nama Kelompok Variasi (Persis Gambar 1)
  function getVariationLabelRecommendations(tier) {
    if (tier === 'tier1') {
      return ['Bahan Utama', 'Ukuran', 'Warna', 'Jenis'];
    }
    if (tier === 'extra_3') {
      return ['Layanan Prioritas', 'Langsung Proses', 'Packaging Tambahan'];
    }
    return ['Finishing', 'Ukuran', 'Warna', 'Toping'];
  }

  // Helper Binding Custom Combobox Popover (Rekomendasi + Input Manual)
  function bindCustomComboboxes(root = document) {
    if (!root) return;
    root.querySelectorAll('.custom-combobox-wrapper').forEach(wrapper => {
      const input = wrapper.querySelector('.custom-combobox-input');
      const popover = wrapper.querySelector('.custom-combobox-popover');
      if (!input || !popover) return;

      const show = () => {
        document.querySelectorAll('.custom-combobox-popover').forEach(p => {
          if (p !== popover) p.classList.add('hidden');
        });
        popover.classList.remove('hidden');
      };

      input.onfocus = show;
      input.onclick = (e) => {
        e.stopPropagation();
        show();
      };

      input.oninput = (e) => {
        const q = e.target.value.toLowerCase().trim();
        popover.querySelectorAll('.combobox-item').forEach(item => {
          const val = (item.getAttribute('data-value') || '').toLowerCase();
          if (!q || val.includes(q)) {
            item.classList.remove('hidden');
          } else {
            item.classList.add('hidden');
          }
        });
        popover.classList.remove('hidden');
      };

      popover.querySelectorAll('.combobox-item').forEach(item => {
        item.onclick = (e) => {
          e.stopPropagation();
          const chosenVal = item.getAttribute('data-value');
          input.value = chosenVal;
          popover.classList.add('hidden');
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        };
      });
    });

    if (!window._comboboxGlobalClickListener) {
      window._comboboxGlobalClickListener = true;
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-combobox-wrapper')) {
          document.querySelectorAll('.custom-combobox-popover').forEach(p => p.classList.add('hidden'));
        }
      });
    }
  }

  function renderPricingModelSection() {
    const model = primaryState.pricing_model || 'normal';

    // Helper render kartu Variasi 1 s/d 4 (Persis Gambar 1, 2, 3, 4)
    function renderVariationCard(tier, tierNum, title, placeholderLabel, labelKey, tooltipText) {
      const isTier1 = tier === 'tier1';
      const labelVal = isTier1 ? (primaryState.variation_labels?.label_tier_1 || '') : (primaryState.variation_labels?.[labelKey] || '');
      const isSamePrice = Boolean(primaryState.same_price_tiers && primaryState.same_price_tiers[tier]);
      const isSameCost = Boolean(primaryState.same_cost_tiers && primaryState.same_cost_tiers[tier]);
      const stockMode = (primaryState.stock_mode_tiers && primaryState.stock_mode_tiers[tier]) || '';

      const closeBtnId = isTier1 ? 'btn-close-variasi-1' : `btn-close-variasi-${tierNum}`;
      const inputLabelId = isTier1 ? 'input-var-label-tier1' : `input-var-label-${tier}`;
      const rowsHtml = isTier1 ? renderMaterialsRows(false) : renderFinishingRows(tier);
      const containerId = isTier1 ? 'materials-rows-container' : `finishings-${tier}-rows-container`;

      return `
        <div class="bg-slate-50/70 rounded-lg border border-slate-300 p-4 sm:p-5 space-y-4 relative shadow-2xs" id="card-variasi-${tierNum}">
          <!-- Bagian Atas Kartu (2 Kolom Kiri & Kanan) -->
          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-2 border-b border-slate-200/80">
            <!-- Sisi Kiri: Judul, Input Nama Kelompok Variasi + (?) & Sub-label Opsi -->
            <div class="space-y-2 pr-8 sm:pr-0">
              <div class="text-base font-bold text-slate-900">${title}</div>
              <div class="flex items-center gap-2 flex-wrap">
                <div class="custom-combobox-wrapper relative w-full sm:w-64">
                  <input 
                    type="text" 
                    id="${inputLabelId}" 
                    data-tier="${tier}" 
                    data-label-key="${labelKey}" 
                    value="${escapeHtml(labelVal)}" 
                    placeholder="${placeholderLabel}" 
                    autocomplete="off" 
                    class="input-variation-label custom-combobox-input w-full px-3 py-2 rounded-md border border-slate-400 text-xs font-medium bg-white outline-none focus:border-emerald-500 shadow-2xs" 
                  />
                  <div class="custom-combobox-popover hidden absolute left-0 top-full mt-1 w-full bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 text-left">
                    <div class="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none border-b border-slate-100">Nilai yang direkomendasikan</div>
                    <div class="max-h-48 overflow-y-auto">
                      ${getVariationLabelRecommendations(tier).map(rec => `
                        <div class="combobox-item px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer font-medium flex items-center justify-between transition" data-value="${escapeHtml(rec)}">
                          <span>${escapeHtml(rec)}</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                </div>
                <div class="group relative inline-flex items-center text-slate-400 hover:text-slate-600 cursor-help" title="${escapeHtml(tooltipText)}">
                  <i class="bi bi-question-circle-fill text-sm"></i>
                  <div class="hidden group-hover:block absolute left-6 top-0 z-50 w-72 p-2.5 bg-slate-900 text-white text-[11px] rounded-lg shadow-xl pointer-events-none leading-relaxed">
                    ${escapeHtml(tooltipText)}
                  </div>
                </div>
              </div>
              <div class="text-xs font-bold text-slate-700 mt-2">Opsi</div>
            </div>

            <!-- Sisi Kanan — Panel "Ketentuan Tambahan :" & Tombol Tutup ✕ -->
            <div class="flex flex-col sm:items-end w-full sm:w-auto">
              <button 
                type="button" 
                id="${closeBtnId}" 
                class="btn-close-variation-card absolute top-3 right-3 sm:static text-slate-400 hover:text-red-500 text-lg cursor-pointer p-1 leading-none font-bold" 
                data-tier="${tier}" 
                data-tier-num="${tierNum}" 
                title="Tutup ${title}"
              >✕</button>

              <div class="w-full sm:w-auto bg-white/80 sm:bg-transparent p-2.5 sm:p-0 rounded-md border border-slate-200/80 sm:border-0 text-left sm:text-right space-y-1.5 text-xs">
                <div class="font-bold text-slate-700">Ketentuan Tambahan :</div>
                <label class="flex items-center justify-between sm:justify-end gap-2 cursor-pointer select-none">
                  <span class="text-[11px] text-slate-600">Semua Harga Jual Sama</span>
                  <input type="checkbox" class="sr-only peer toggle-same-price" data-tier="${tier}" ${isSamePrice ? 'checked' : ''}>
                  <div class="w-8 h-4 bg-slate-300 rounded-full peer peer-checked:bg-emerald-600 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:w-3 after:h-3 after:rounded-full after:transition-all peer-checked:after:translate-x-4 shrink-0"></div>
                </label>
                <label class="flex items-center justify-between sm:justify-end gap-2 cursor-pointer select-none">
                  <span class="text-[11px] text-slate-600">Semua Modal/Hpp Sama</span>
                  <input type="checkbox" class="sr-only peer toggle-same-cost" data-tier="${tier}" ${isSameCost ? 'checked' : ''}>
                  <div class="w-8 h-4 bg-slate-300 rounded-full peer peer-checked:bg-emerald-600 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:w-3 after:h-3 after:rounded-full after:transition-all peer-checked:after:translate-x-4 shrink-0"></div>
                </label>
                <div class="flex items-center justify-start sm:justify-end flex-wrap gap-x-4 gap-y-1.5 pt-1">
                  <label class="inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600">
                    <input type="radio" name="stock_mode_${tier}" value="unlimited" class="radio-stock-mode accent-emerald-600" data-tier="${tier}" ${stockMode === 'unlimited' ? 'checked' : ''}>
                    <span>Semua Stok Unlimited</span>
                  </label>
                  <label class="inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600">
                    <input type="radio" name="stock_mode_${tier}" value="same" class="radio-stock-mode accent-emerald-600" data-tier="${tier}" ${stockMode === 'same' ? 'checked' : ''}>
                    <span>Semua Stok Sama</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Strip Baris Opsi (Tanpa Header Tabel Atas — Persis Gambar 1–4) -->
          <div id="${containerId}" class="space-y-2">
            ${rowsHtml}
          </div>
        </div>
      `;
    }

    // Helper render kartu Layanan Extras (Persis Gambar 5)
    function renderExtraServiceCard() {
      const labelVal = primaryState.variation_labels?.label_extra_3 || '';
      const isSamePrice = Boolean(primaryState.same_price_tiers && primaryState.same_price_tiers.extra_3);
      const isSameCost = Boolean(primaryState.same_cost_tiers && primaryState.same_cost_tiers.extra_3);
      const stockMode = (primaryState.stock_mode_tiers && primaryState.stock_mode_tiers.extra_3) || '';

      return `
        <div class="bg-slate-50/70 rounded-lg border border-slate-300 p-4 sm:p-5 space-y-4 relative shadow-2xs" id="card-extra-service">
          <!-- Bagian Atas Kartu (2 Kolom Kiri & Kanan) -->
          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-2 border-b border-slate-200/80">
            <!-- Sisi Kiri: Judul, Input Nama Kelompok + (?) & Sub-label Opsi -->
            <div class="space-y-2 pr-8 sm:pr-0">
              <div class="text-base font-bold text-slate-900">Layanan Extras</div>
              <div class="flex items-center gap-2 flex-wrap">
                <div class="custom-combobox-wrapper relative w-full sm:w-64">
                  <input 
                    type="text" 
                    id="input-var-label-extra3" 
                    data-tier="extra_3" 
                    data-label-key="label_extra_3" 
                    value="${escapeHtml(labelVal)}" 
                    placeholder="Cth. Langsung Proses, Dll" 
                    autocomplete="off" 
                    class="input-variation-label custom-combobox-input w-full px-3 py-2 rounded-md border border-slate-400 text-xs font-medium bg-white outline-none focus:border-emerald-500 shadow-2xs" 
                  />
                  <div class="custom-combobox-popover hidden absolute left-0 top-full mt-1 w-full bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 text-left">
                    <div class="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none border-b border-slate-100">Nilai yang direkomendasikan</div>
                    <div class="max-h-48 overflow-y-auto">
                      ${getVariationLabelRecommendations('extra_3').map(rec => `
                        <div class="combobox-item px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer font-medium flex items-center justify-between transition" data-value="${escapeHtml(rec)}">
                          <span>${escapeHtml(rec)}</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                </div>
                <div class="group relative inline-flex items-center text-slate-400 hover:text-slate-600 cursor-help" title="Ubah nama label layanan ekstra di luar perhitungan qty. Contoh: Langsung Proses, Layanan Prioritas, Packaging Kayu">
                  <i class="bi bi-question-circle-fill text-sm"></i>
                  <div class="hidden group-hover:block absolute left-6 top-0 z-50 w-72 p-2.5 bg-slate-900 text-white text-[11px] rounded-lg shadow-xl pointer-events-none leading-relaxed">
                    Ubah nama label layanan ekstra di luar perhitungan qty. Contoh: Langsung Proses, Layanan Prioritas, Packaging Kayu
                  </div>
                </div>
              </div>
              <div class="text-xs font-bold text-slate-700 mt-2">Opsi</div>
            </div>

            <!-- Sisi Kanan — Panel Ketentuan Tambahan & Tombol Tutup ✕ -->
            <div class="flex flex-col sm:items-end w-full sm:w-auto">
              <button 
                type="button" 
                id="btn-close-extra-service" 
                class="btn-close-variation-card absolute top-3 right-3 sm:static text-slate-400 hover:text-red-500 text-lg cursor-pointer p-1 leading-none font-bold" 
                data-tier="extra_3" 
                title="Tutup Layanan Extras"
              >✕</button>

              <div class="w-full sm:w-auto bg-white/80 sm:bg-transparent p-2.5 sm:p-0 rounded-md border border-slate-200/80 sm:border-0 text-left sm:text-right space-y-1.5 text-xs">
                <div class="font-bold text-slate-700">Ketentuan Tambahan :</div>
                <label class="flex items-center justify-between sm:justify-end gap-2 cursor-pointer select-none">
                  <span class="text-[11px] text-slate-600">Semua Harga Jual Sama</span>
                  <input type="checkbox" class="sr-only peer toggle-same-price" data-tier="extra_3" ${isSamePrice ? 'checked' : ''}>
                  <div class="w-8 h-4 bg-slate-300 rounded-full peer peer-checked:bg-emerald-600 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:w-3 after:h-3 after:rounded-full after:transition-all peer-checked:after:translate-x-4 shrink-0"></div>
                </label>
                <label class="flex items-center justify-between sm:justify-end gap-2 cursor-pointer select-none">
                  <span class="text-[11px] text-slate-600">Semua Modal/Hpp Sama</span>
                  <input type="checkbox" class="sr-only peer toggle-same-cost" data-tier="extra_3" ${isSameCost ? 'checked' : ''}>
                  <div class="w-8 h-4 bg-slate-300 rounded-full peer peer-checked:bg-emerald-600 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:w-3 after:h-3 after:rounded-full after:transition-all peer-checked:after:translate-x-4 shrink-0"></div>
                </label>
                <div class="flex items-center justify-start sm:justify-end flex-wrap gap-x-4 gap-y-1.5 pt-1">
                  <label class="inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600">
                    <input type="radio" name="stock_mode_extra_3" value="unlimited" class="radio-stock-mode accent-emerald-600" data-tier="extra_3" ${stockMode === 'unlimited' ? 'checked' : ''}>
                    <span>Semua Stok Unlimited</span>
                  </label>
                  <label class="inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600">
                    <input type="radio" name="stock_mode_extra_3" value="same" class="radio-stock-mode accent-emerald-600" data-tier="extra_3" ${stockMode === 'same' ? 'checked' : ''}>
                    <span>Semua Stok Sama</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Strip Baris Opsi Layanan Extras -->
          <div id="finishings-extra_3-rows-container" class="space-y-2">
            ${renderFinishingRows('extra_3')}
          </div>
        </div>
      `;
    }



    // Helper render seluruh variasi bertumpuk & pemicu berjenjang
    function renderHierarchicalVariationsSection() {
      const isVar2Active = Boolean(primaryState.has_variation_2 || (finishingsState.main && finishingsState.main.length > 0));
      const isVar3Active = Boolean(isVar2Active && (primaryState.has_variation_3 || (finishingsState.extra_1 && finishingsState.extra_1.length > 0)));
      const isVar4Active = Boolean(isVar3Active && (primaryState.has_variation_4 || (finishingsState.extra_2 && finishingsState.extra_2.length > 0)));
      const isExtraServiceActive = Boolean(primaryState.has_extra_service || (finishingsState.extra_3 && finishingsState.extra_3.length > 0));

      const var1HasOption = materialsState.some(m => m.name && m.name.trim() !== '');

      return `
        <!-- Area Variasi Bertingkat (Variasi 1 s/d 4) -->
        <div class="space-y-4 pt-1" id="hierarchical-variations-container">
          <!-- Kartu Variasi 1 (Akar / Varian Utama) -->
          ${renderVariationCard('tier1', 1, 'Variasi 1', 'Cth. Bahan Utama, Dll', 'label_tier_1', 'Ubah nama label sebagai judul pilihan variasi utama produk Anda. Contoh: Bahan Utama, Ukuran, Warna')}

          <!-- Kartu Variasi 2 (Jika Aktif) -->
          ${isVar2Active ? renderVariationCard('main', 2, 'Variasi 2', 'Cth. Toping, Dll', 'label_tier_2', 'Ubah nama label sebagai judul pilihan variasi jenis produk Anda. Contoh: Toping, Ukuran, Model') : ''}

          <!-- Kartu Variasi 3 (Jika Aktif) -->
          ${isVar3Active ? renderVariationCard('extra_1', 3, 'Variasi 3', 'Cth. Toping, Dll', 'label_extra_1', 'Ubah nama label sebagai judul pilihan variasi pendukung produk Anda. Contoh: Toping, Finishing, Laminasi') : ''}

          <!-- Kartu Variasi 4 (Jika Aktif) -->
          ${isVar4Active ? renderVariationCard('extra_2', 4, 'Variasi 4', 'Cth. Toping, Dll', 'label_extra_2', 'Ubah nama label sebagai judul pilihan variasi tambahan produk Anda. Contoh: Toping, Kemasan, Aksesoris') : ''}

          <!-- Tombol Pemicu Tambah Variasi [2/3/4] -->
          <div class="pt-1">
            ${!isVar2Active ? `
              <button 
                type="button" 
                id="btn-trigger-variasi-2" 
                class="px-4 py-2 rounded-md border border-dashed border-emerald-500 text-emerald-600 hover:bg-emerald-50 text-xs font-bold inline-flex items-center gap-2 transition cursor-pointer ${!var1HasOption ? 'opacity-50 cursor-not-allowed' : ''}" 
                title="${!var1HasOption ? 'Isi minimal 1 opsi pada Variasi 1 sebelum menambah Variasi 2' : 'Tambah Variasi 2'}"
              >
                <i class="bi bi-plus-lg text-sm"></i>
                <span>Tambah Variasi 2</span>
              </button>
            ` : (!isVar3Active ? `
              <button 
                type="button" 
                id="btn-trigger-variasi-3" 
                class="px-4 py-2 rounded-md border border-dashed border-emerald-500 text-emerald-600 hover:bg-emerald-50 text-xs font-bold inline-flex items-center gap-2 transition cursor-pointer"
              >
                <i class="bi bi-plus-lg text-sm"></i>
                <span>Tambah Variasi 3</span>
              </button>
            ` : (!isVar4Active ? `
              <button 
                type="button" 
                id="btn-trigger-variasi-4" 
                class="px-4 py-2 rounded-md border border-dashed border-emerald-500 text-emerald-600 hover:bg-emerald-50 text-xs font-bold inline-flex items-center gap-2 transition cursor-pointer"
              >
                <i class="bi bi-plus-lg text-sm"></i>
                <span>Tambah Variasi 4</span>
              </button>
            ` : ''))}
          </div>

          <!-- Tabel Matriks Kombinasi di Bagian Bawah -->
          ${renderCombinationMatrixTable()}

          <!-- Area Layanan Extra (Diletakkan SETELAH Tabel Kombinasi) -->
          <div class="space-y-4 pt-2">
            ${!isExtraServiceActive ? `
              <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                <button type="button" id="btn-trigger-extra-service" class="px-3.5 py-1.5 rounded-md bg-[#33b589] hover:bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-2xs">
                  <i class="bi bi-plus-lg text-xs"></i>
                  <span>Layanan Extra</span>
                </button>
                <div class="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                  <i class="bi bi-exclamation-circle-fill text-slate-400 text-xs shrink-0"></i>
                  <span>Terhitung Setelah Jumlah Qty Cth. Layanan Prioritas, Langsung Di proses Dll</span>
                </div>
              </div>
            ` : ''}

            <!-- Kartu Layanan Extras (Jika Aktif) -->
            ${isExtraServiceActive ? renderExtraServiceCard() : ''}
          </div>

          <!-- Modals Terintegrasi -->
          ${renderWholesaleModalMarkup()}
          ${renderOrderMultipleModalMarkup()}
          ${renderSpecificOptionsModalMarkup()}
        </div>
      `;
    }

    // 1. NORMAL
    if (model === 'normal') {
      const hasVariants = Boolean(primaryState.has_variants);
      const firstMat = materialsState[0] || { price: 0, cost_price: 0, name: 'Produk Standar' };

      return `
        <div class="space-y-4 pt-1">
          ${!hasVariants ? `
            <!-- Opsi tombol Variasi Produk -->
            <div class="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <button 
                  type="button" 
                  id="btn-toggle-has-variants" 
                  class="px-3.5 py-1.5 rounded-md border transition cursor-pointer text-xs font-bold flex items-center gap-1.5 bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                >
                  <i class="bi bi-plus-lg"></i>
                  <span>Variasi Produk</span>
                </button>
              </div>
              <span class="text-[11px] text-slate-500">
                Produk tunggal (tanpa varian). Klik tombol untuk mengaktifkan varian.
              </span>
            </div>

            <!-- Produk Tunggal: Tabel Input Sederhana Harga Jual & HPP -->
            <div class="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="input-single-price" class="block text-xs font-bold text-slate-800 mb-1">
                    Harga Jual (Rp) <span class="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    id="input-single-price" 
                    min="0"
                    value="${firstMat.price !== undefined && firstMat.price !== null && firstMat.price !== '' ? firstMat.price : ''}" 
                    class="w-full px-3.5 py-2.5 rounded-md border border-slate-300 text-sm font-bold text-slate-900 focus:border-emerald-500 outline-none bg-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label for="input-single-cost" class="block text-xs font-bold text-slate-800 mb-1">
                    Biaya Modal / HPP (Rp)
                  </label>
                  <input 
                    type="number" 
                    id="input-single-cost" 
                    min="0"
                    value="${firstMat.cost_price !== undefined && firstMat.cost_price !== null && firstMat.cost_price !== '' ? firstMat.cost_price : ''}" 
                    class="w-full px-3.5 py-2.5 rounded-md border border-slate-300 text-sm font-bold text-slate-900 focus:border-emerald-500 outline-none bg-white"
                    placeholder="0"
                  />
                </div>
              </div>
              <div class="flex items-center justify-between pt-1 text-xs">
                <span class="text-slate-500 font-medium">Margin Keuntungan Bersih:</span>
                <div id="single-margin-badge">
                  ${calculateMarginBadge(firstMat.price || 0, firstMat.cost_price || 0)}
                </div>
              </div>
            </div>

            <!-- Area Layanan Extra (Produk Tunggal tanpa Variasi) -->
            <div class="space-y-4 pt-2">
              ${!primaryState.has_extra_service ? `
                <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                  <button type="button" id="btn-trigger-extra-service-normal" class="btn-trigger-extra-action px-3.5 py-1.5 rounded-md bg-[#33b589] hover:bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-2xs">
                    <i class="bi bi-plus-lg text-xs"></i>
                    <span>Layanan Extra</span>
                  </button>
                  <div class="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                    <i class="bi bi-exclamation-circle-fill text-slate-400 text-xs shrink-0"></i>
                    <span>Terhitung Setelah Jumlah Qty Cth. Layanan Prioritas, Langsung Di proses Dll</span>
                  </div>
                </div>
              ` : `
                <!-- Kartu Layanan Extras (Jika Aktif di Produk Tunggal) -->
                ${renderExtraServiceCard()}
              `}
            </div>
          ` : `
            <!-- Mode Variasi Bertingkat (Variasi 1 s/d 4 + Layanan Ekstra) -->
            ${renderHierarchicalVariationsSection()}
          `}
        </div>
      `;
    }

    // 2. BERDASAR UKURAN
    if (model === 'size') {
      const sizeType = primaryState.size_pricing_type || 'custom';
      const sizeUnit = primaryState.size_unit || 'Cm';

      return `
        <div class="space-y-4 pt-1">
          <!-- 2 Sub-pilihan: Ukuran Custom vs Ukuran Tetap -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label class="p-3 rounded-md border ${sizeType === 'custom' ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex items-center gap-3 block select-none">
              <input type="radio" name="size_pricing_type_radio" value="custom" ${sizeType === 'custom' ? 'checked' : ''} class="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
              <div>
                <span class="font-bold text-xs ${sizeType === 'custom' ? 'text-emerald-950 font-extrabold' : 'text-slate-800'} block">Ukuran Custom</span>
                <span class="text-[11px] text-slate-500 block">P x L dinamis dengan satuan M, Dm, Cm, atau Mm.</span>
              </div>
            </label>

            <label class="p-3 rounded-md border ${sizeType === 'fixed' ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex items-center gap-3 block select-none">
              <input type="radio" name="size_pricing_type_radio" value="fixed" ${sizeType === 'fixed' ? 'checked' : ''} class="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
              <div>
                <span class="font-bold text-xs ${sizeType === 'fixed' ? 'text-emerald-950 font-extrabold' : 'text-slate-800'} block">Ukuran Tetap</span>
                <span class="text-[11px] text-slate-500 block">Pilihan ukuran standar (S, M, L, XL, 2L, custom label).</span>
              </div>
            </label>
          </div>

          ${sizeType === 'custom' ? `
            <!-- Ukuran Custom: Dropdown Satuan Ukuran + Tabel Input Variasi -->
            <div class="space-y-3 p-4 rounded-md border border-slate-200 bg-slate-50/50">
              <div class="flex items-center gap-3 flex-wrap">
                <label for="select-size-unit" class="text-xs font-bold text-slate-800">Satuan Ukuran:</label>
                <select id="select-size-unit" class="px-3 py-1.5 rounded-md border border-slate-300 text-xs font-bold focus:border-emerald-500 outline-none bg-white">
                  <option value="M" ${sizeUnit === 'M' ? 'selected' : ''}>M (Meter)</option>
                  <option value="Dm" ${sizeUnit === 'Dm' ? 'selected' : ''}>Dm (Desimeter)</option>
                  <option value="Cm" ${sizeUnit === 'Cm' ? 'selected' : ''}>Cm (Sentimeter)</option>
                  <option value="Mm" ${sizeUnit === 'Mm' ? 'selected' : ''}>Mm (Milimeter)</option>
                </select>
                <span class="text-[11px] text-slate-400">Harga di bawah adalah tarif dasar per 1 satuan persegi</span>
              </div>

              ${renderHierarchicalVariationsSection()}
            </div>
          ` : `
            <!-- Ukuran Tetap: Saran Ukuran Umum + Tabel Input Variasi -->
            <div class="space-y-3 p-4 rounded-md border border-slate-200 bg-slate-50/50">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <label class="block text-xs font-bold text-slate-800">Saran Ukuran Cepat:</label>
                  <span class="text-[11px] text-slate-500">Klik untuk langsung menambahkan ukuran ke tabel variasi.</span>
                </div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <button type="button" class="btn-quick-add-size px-2.5 py-1 rounded-md text-xs font-bold bg-white border border-slate-300 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 transition cursor-pointer" data-size="S">S</button>
                  <button type="button" class="btn-quick-add-size px-2.5 py-1 rounded-md text-xs font-bold bg-white border border-slate-300 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 transition cursor-pointer" data-size="M">M</button>
                  <button type="button" class="btn-quick-add-size px-2.5 py-1 rounded-md text-xs font-bold bg-white border border-slate-300 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 transition cursor-pointer" data-size="L">L</button>
                  <button type="button" class="btn-quick-add-size px-2.5 py-1 rounded-md text-xs font-bold bg-white border border-slate-300 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 transition cursor-pointer" data-size="XL">XL</button>
                  <button type="button" class="btn-quick-add-size px-2.5 py-1 rounded-md text-xs font-bold bg-white border border-slate-300 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 transition cursor-pointer" data-size="2L">2L</button>
                  <button type="button" class="btn-quick-add-size px-2.5 py-1 rounded-md text-xs font-bold bg-white border border-slate-300 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 transition cursor-pointer" data-size="3L">3L</button>
                </div>
              </div>

              ${renderHierarchicalVariationsSection()}
            </div>
          `}
        </div>
      `;
    }

    // 3. BERDASAR BERAT
    if (model === 'weight') {
      const weightUnit = primaryState.weight_unit || 'Kg';
      return `
        <div class="space-y-4 pt-1 p-4 rounded-md border border-slate-200 bg-slate-50/50">
          <div class="flex items-center gap-3 flex-wrap">
            <label for="select-weight-unit" class="text-xs font-bold text-slate-800">Satuan Berat:</label>
            <select id="select-weight-unit" class="px-3 py-1.5 rounded-md border border-slate-300 text-xs font-bold focus:border-emerald-500 outline-none bg-white">
              <option value="Kg" ${weightUnit === 'Kg' ? 'selected' : ''}>Kg (Kilogram)</option>
              <option value="gram" ${weightUnit === 'gram' ? 'selected' : ''}>gram</option>
              <option value="ons" ${weightUnit === 'ons' ? 'selected' : ''}>ons</option>
              <option value="ton" ${weightUnit === 'ton' ? 'selected' : ''}>ton</option>
            </select>
            <span class="text-[11px] text-slate-400">Harga di bawah adalah tarif dasar per satuan berat terpilih</span>
          </div>

          ${renderHierarchicalVariationsSection()}
        </div>
      `;
    }

    // 4. BERDASAR VOLUME
    if (model === 'volume') {
      const volumeUnit = primaryState.volume_unit || 'Liter';
      return `
        <div class="space-y-4 pt-1 p-4 rounded-md border border-slate-200 bg-slate-50/50">
          <div class="flex items-center gap-3 flex-wrap">
            <label for="select-volume-unit" class="text-xs font-bold text-slate-800">Satuan Volume:</label>
            <select id="select-volume-unit" class="px-3 py-1.5 rounded-md border border-slate-300 text-xs font-bold focus:border-emerald-500 outline-none bg-white">
              <option value="Liter" ${volumeUnit === 'Liter' ? 'selected' : ''}>Liter</option>
              <option value="ml" ${volumeUnit === 'ml' ? 'selected' : ''}>ml (Mililiter)</option>
              <option value="galon" ${volumeUnit === 'galon' ? 'selected' : ''}>galon</option>
              <option value="drum" ${volumeUnit === 'drum' ? 'selected' : ''}>drum</option>
              <option value="cc" ${volumeUnit === 'cc' ? 'selected' : ''}>cc</option>
            </select>
            <span class="text-[11px] text-slate-400">Harga di bawah adalah tarif dasar per satuan volume terpilih</span>
          </div>

          ${renderHierarchicalVariationsSection()}
        </div>
      `;
    }

    return '';
  }

  // Sub-Renderer: Maksimal Order
  function renderMaxOrderSection() {
    if (primaryState.max_order_type === 'per_order') {
      return `
        <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
          <label for="input-max-order-qty" class="block text-xs font-semibold text-slate-700">
            Jumlah Maksimal Pembelian Per Pesanan <span class="text-red-500">*</span>:
          </label>
          <div class="flex items-center gap-2">
            <input 
              type="number" 
              id="input-max-order-qty" 
              min="1"
              value="${primaryState.max_order_qty || ''}" 
              placeholder="Contoh: 10" 
              class="w-48 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:border-emerald-500 outline-none bg-white"
            />
            <span class="text-xs text-slate-500 font-medium">produk per checkout</span>
          </div>
          <span class="text-[11px] text-slate-400 block">Pembeli tidak dapat memesan melebihi jumlah ini dalam 1 transaksi pesanan.</span>
        </div>
      `;
    }

    if (primaryState.max_order_type === 'per_period') {
      const period = primaryState.max_order_period || {
        start_date: getTodayDateString(),
        max_qty: 10,
        days: 7,
        period_type: 'non_recurring',
        end_date: ''
      };
      const startDate = period.start_date || getTodayDateString();
      const maxQty = period.max_qty || 10;
      const days = parseInt(period.days) || 7;
      const periodType = period.period_type || 'non_recurring';
      
      const singleCycleEnd = addDaysToDate(startDate, Math.max(1, days) - 1);
      
      const recurringOptions = [2, 3, 4, 5, 6, 8, 12].map(cycle => {
        const cycleEnd = addDaysToDate(startDate, (cycle * Math.max(1, days)) - 1);
        return {
          date: cycleEnd,
          label: `${formatDateDisplay(cycleEnd)} (${cycle} kali siklus / ${cycle * days} hari)`
        };
      });

      return `
        <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
          <!-- Tanggal Mulai -->
          <div>
            <label for="input-period-start-date" class="block text-xs font-semibold text-slate-700 mb-1">
              Tanggal Mulai <span class="text-red-500">*</span>:
            </label>
            <input 
              type="date" 
              id="input-period-start-date" 
              min="${getTodayDateString()}"
              value="${startDate}" 
              class="w-full sm:w-64 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:border-emerald-500 outline-none bg-white"
            />
            <span class="text-[10px] text-slate-400 mt-0.5 block">Tanggal di masa lalu otomatis dinonaktifkan.</span>
          </div>

          <!-- Input teks/angka Maks. Jumlah Pembelian [jumlah] produk untuk [jumlah] Hari -->
          <div class="flex items-center flex-wrap gap-2 text-xs font-semibold text-slate-800">
            <span>Maks. Jumlah Pembelian</span>
            <input 
              type="number" 
              id="input-period-max-qty" 
              min="1"
              value="${maxQty}" 
              class="w-24 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-center focus:border-emerald-500 outline-none bg-white"
            />
            <span>produk untuk</span>
            <input 
              type="number" 
              id="input-period-days" 
              min="1"
              value="${days}" 
              class="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-center focus:border-emerald-500 outline-none bg-white"
            />
            <span>Hari</span>
          </div>

          <!-- Pilihan Tipe Periode (Radio Button) -->
          <div class="space-y-3 pt-2 border-t border-slate-200/80">
            <label class="block text-xs font-bold text-slate-800">Pilihan Tipe Periode <span class="text-red-500">*</span>:</label>
            
            <div class="space-y-3">
              <!-- Tidak Berulang -->
              <div class="p-3 rounded-xl border ${periodType === 'non_recurring' ? 'border-emerald-500 bg-white ring-1 ring-emerald-500/20' : 'border-slate-200 bg-white'} space-y-2">
                <label class="flex items-center gap-2 cursor-pointer select-none">
                  <input type="radio" name="period_type_radio" value="non_recurring" ${periodType === 'non_recurring' ? 'checked' : ''} class="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                  <span class="text-xs font-bold text-slate-800">Tidak Berulang</span>
                  <div class="group relative cursor-pointer inline-flex items-center text-slate-400 hover:text-slate-600">
                    <i class="bi bi-question-circle text-xs"></i>
                    <div class="hidden group-hover:block absolute left-5 top-0 z-50 w-72 p-2.5 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl pointer-events-none leading-relaxed">
                      Maks. Jumlah Pembelian akan berakhir setelah periode yang ditentukan (dalam hari).
                    </div>
                  </div>
                </label>

                <!-- Dynamic note text -->
                <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed font-normal">
                  <span class="font-bold text-emerald-800">Catatan:</span> Batas pembelian akan berlaku mulai <span class="font-bold text-slate-900">${formatDateDisplay(startDate)} 00:00</span> dan setiap Pembeli hanya dapat membeli maks. <span class="font-bold text-slate-900">${maxQty} produk</span> ini setiap <span class="font-bold text-slate-900">${days} hari</span>. Pengaturan ini akan berulang 1 kali dan maks. batas pembelian akan berakhir pada <span class="font-bold text-slate-900">${formatDateDisplay(singleCycleEnd)} 23:59</span>.
                </div>
              </div>

              <!-- Berulang -->
              <div class="p-3 rounded-xl border ${periodType === 'recurring' ? 'border-emerald-500 bg-white ring-1 ring-emerald-500/20' : 'border-slate-200 bg-white'} space-y-3">
                <label class="flex items-center gap-2 cursor-pointer select-none">
                  <input type="radio" name="period_type_radio" value="recurring" ${periodType === 'recurring' ? 'checked' : ''} class="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                  <span class="text-xs font-bold text-slate-800">Berulang</span>
                  <div class="group relative cursor-pointer inline-flex items-center text-slate-400 hover:text-slate-600">
                    <i class="bi bi-question-circle text-xs"></i>
                    <div class="hidden group-hover:block absolute left-5 top-0 z-50 w-72 p-2.5 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl pointer-events-none leading-relaxed">
                      Maks. Jumlah Pembelian akan diulangi secara berurutan per periode yang ditentukan (dalam hari) hingga tanggal berakhir yang diatur di bawah ini.
                    </div>
                  </div>
                </label>

                <div id="recurring-end-date-wrapper" class="${periodType === 'recurring' ? 'block' : 'hidden'} pl-6 space-y-1.5">
                  <label for="select-period-end-date" class="block text-[11px] font-bold text-slate-700">Tanggal Berakhir:</label>
                  <select id="select-period-end-date" class="w-full sm:w-72 px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:border-emerald-500 outline-none bg-white">
                    ${recurringOptions.map(opt => `
                      <option value="${opt.date}" ${period.end_date === opt.date ? 'selected' : ''}>${opt.label}</option>
                    `).join('')}
                  </select>
                  <span class="text-[10px] text-slate-400 block">Pilihan tanggal dihitung otomatis berdasarkan kelipatan ${days} hari.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  }

  // Helper render Tabel Matriks Kombinasi di Bagian Bawah (Persis Gambar 1, 2, 3, 4)
  function renderCombinationMatrixTable() {
    const isVar2Active = Boolean(primaryState.has_variation_2 && finishingsState.main && finishingsState.main.length > 0);
    const isVar3Active = Boolean(isVar2Active && primaryState.has_variation_3 && finishingsState.extra_1 && finishingsState.extra_1.length > 0);
    const isVar4Active = Boolean(isVar3Active && primaryState.has_variation_4 && finishingsState.extra_2 && finishingsState.extra_2.length > 0);

    const labelVar1 = primaryState.variation_labels?.label_tier_1 || 'Variasi 1';
    const labelVar2 = primaryState.variation_labels?.label_tier_2 || 'Variasi 2';
    const labelVar3 = primaryState.variation_labels?.label_extra_1 || 'Variasi 3';
    const labelVar4 = primaryState.variation_labels?.label_extra_2 || 'Variasi 4';

    // FILTER materialsState: Hanya tampilkan baris yang namanya tidak kosong!
    // Sehingga jika penjual hanya membuat 2 variasi (misal: "A" dan "ba"), tabel kombinasi bawah HANYA menampilkan tepat 2 baris tersebut.
    const validMaterials = materialsState.filter(m => m && m.name && m.name.trim() !== '');
    const displayMaterials = validMaterials.length > 0 ? validMaterials : (materialsState.length > 0 ? [materialsState[0]] : []);

    const rows = displayMaterials.map((mat, idx) => {
      const var1Name = (mat.name && mat.name.trim() !== '') ? mat.name.trim() : `Opsi ${idx + 1}`;
      const minOrderVal = mat.min_order !== undefined && mat.min_order !== null ? mat.min_order : (primaryState.min_order || 1);
      const maxOrderVal = mat.max_order !== undefined && mat.max_order !== null && mat.max_order !== '' ? mat.max_order : 'Unlimited';

      function renderScopeCell(tier) {
        const scope = (primaryState.variation_scopes && primaryState.variation_scopes[tier]) || 'umum';
        const specificList = (primaryState.specific_options_map && primaryState.specific_options_map[mat.id] && primaryState.specific_options_map[mat.id][tier]) || [];
        const count = specificList.length;

        return `
          <div class="flex flex-col items-center gap-1">
            <select class="combo-scope-select px-3 py-1.5 rounded-full border border-slate-300 text-xs font-bold bg-white text-slate-700 outline-none cursor-pointer focus:border-emerald-500 shadow-2xs" data-tier="${tier}" data-mat-id="${mat.id}">
              <option value="umum" ${scope === 'umum' ? 'selected' : ''}>Umum</option>
              <option value="spesifik" ${scope === 'spesifik' ? 'selected' : ''}>Spesifik</option>
            </select>
            ${scope === 'spesifik' ? `
              <button type="button" class="btn-open-specific-modal px-2.5 py-1 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold cursor-pointer transition flex items-center gap-1 shadow-2xs" data-tier="${tier}" data-mat-id="${mat.id}" data-mat-name="${escapeHtml(var1Name)}">
                <span>${count > 0 ? `${count} Dipilih` : 'Pilih Opsi'}</span>
                <i class="bi bi-gear-fill text-[9px]"></i>
              </button>
            ` : ''}
          </div>
        `;
      }

      return `
        <tr class="hover:bg-slate-50 transition border-b border-slate-200" data-mat-id="${mat.id}">
          <!-- Kolom Variasi 1 (Foto Opsi + Teks Real-Time) -->
          <td class="p-3 align-middle text-center min-w-[120px]">
            <div class="flex flex-col items-center gap-1.5">
              <input type="file" accept="image/*" class="hidden combo-var1-file-input" data-id="${mat.id}" id="combo-img-${mat.id}" />
              <label for="combo-img-${mat.id}" class="w-12 h-10 border border-dashed border-emerald-500 rounded flex items-center justify-center cursor-pointer text-emerald-600 bg-emerald-50/40 hover:bg-emerald-50 transition overflow-hidden shadow-2xs" title="Unggah Foto Opsi">
                ${mat.image_url ? `<img src="${mat.image_url}" class="w-full h-full object-cover" />` : `<i class="bi bi-image text-sm"></i>`}
              </label>
              <span class="combo-var1-label text-xs font-bold text-slate-800 break-all" data-id="${mat.id}">${escapeHtml(var1Name)}</span>
            </div>
          </td>

          <!-- Kolom Variasi 2 (Jika Aktif) -->
          ${isVar2Active ? `<td class="p-3 align-middle text-center min-w-[130px]">${renderScopeCell('main')}</td>` : ''}

          <!-- Kolom Variasi 3 (Jika Aktif) -->
          ${isVar3Active ? `<td class="p-3 align-middle text-center min-w-[130px]">${renderScopeCell('extra_1')}</td>` : ''}

          <!-- Kolom Variasi 4 (Jika Aktif) -->
          ${isVar4Active ? `<td class="p-3 align-middle text-center min-w-[130px]">${renderScopeCell('extra_2')}</td>` : ''}

          <!-- Kolom Min. Order -->
          <td class="p-3 align-middle text-center min-w-[90px]">
            <input 
              type="number" 
              min="1" 
              class="combo-min-order-input w-20 px-3 py-1.5 rounded-full border border-slate-300 text-xs font-bold text-center bg-white text-slate-800 outline-none focus:border-emerald-500 shadow-2xs" 
              data-mat-id="${mat.id}" 
              value="${minOrderVal}" 
            />
          </td>

          <!-- Kolom Max. Order (Custom Combobox Popover) -->
          <td class="p-3 align-middle text-center min-w-[125px]">
            <div class="custom-combobox-wrapper relative inline-block w-28 sm:w-32">
              <input 
                type="text" 
                class="combo-max-order-input custom-combobox-input w-full px-2.5 py-1.5 rounded-full border border-slate-300 text-xs font-bold text-center bg-white text-slate-800 outline-none focus:border-emerald-500 shadow-2xs" 
                data-mat-id="${mat.id}" 
                value="${(mat.max_order === null || mat.max_order === 0 || mat.max_order === undefined || mat.max_order === '' || mat.max_order === 'Unlimited' || mat.max_order === 'Tanpa Max Order') ? 'Tanpa Max Order' : mat.max_order}" 
                placeholder="Ketik atau pilih" 
                autocomplete="off" 
              />
              <div class="custom-combobox-popover hidden absolute left-1/2 -translate-x-1/2 top-full mt-1 w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 text-left">
                <div class="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none border-b border-slate-100">Nilai yang direkomendasikan</div>
                <div class="max-h-48 overflow-y-auto">
                  <div class="combobox-item px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer font-medium flex items-center justify-between transition" data-value="Tanpa Max Order">
                    <span>Tanpa Max Order</span>
                  </div>
                  <div class="combobox-item px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer font-medium flex items-center justify-between transition" data-value="10">
                    <span>10</span>
                  </div>
                  <div class="combobox-item px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer font-medium flex items-center justify-between transition" data-value="50">
                    <span>50</span>
                  </div>
                  <div class="combobox-item px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer font-medium flex items-center justify-between transition" data-value="100">
                    <span>100</span>
                  </div>
                </div>
              </div>
            </div>
          </td>

          <!-- Kolom Harga Grosir -->
          <td class="p-3 align-middle text-center min-w-[140px]">
            ${!primaryState.has_wholesale ? `
              <div class="px-3 py-1.5 rounded-full bg-slate-200 text-slate-400 text-xs font-semibold text-center select-none pointer-events-none">Nonaktif</div>
            ` : `
              <button type="button" class="btn-open-wholesale-modal px-3 py-1.5 rounded-full bg-white border border-emerald-500 text-emerald-700 hover:bg-emerald-50 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-2xs transition" data-mat-id="${mat.id}">
                <i class="bi bi-tag-fill text-xs"></i>
                <span>${primaryState.wholesale_mode === 'tiered' ? 'Mode Bertingkat' : 'Mode Normal'}</span>
              </button>
            `}
          </td>

          <!-- Kolom Kelipatan Order -->
          <td class="p-3 align-middle text-center min-w-[140px]">
            ${!primaryState.has_order_multiple ? `
              <div class="px-3 py-1.5 rounded-full bg-slate-200 text-slate-400 text-xs font-semibold text-center select-none pointer-events-none">Nonaktif</div>
            ` : `
              <button type="button" class="btn-open-multiple-modal px-3 py-1.5 rounded-full bg-white border border-emerald-500 text-emerald-700 hover:bg-emerald-50 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-2xs transition" data-mat-id="${mat.id}">
                <i class="bi bi-layers-fill text-xs"></i>
                <span>${primaryState.order_multiple_type === 'per_variant' ? 'Mode Spesifik' : 'Mode Global'}</span>
              </button>
            `}
          </td>
        </tr>
      `;
    }).join('');

    return `
      <!-- Tabel Matriks Kombinasi Utama (Persis Gambar 1â€“4) -->
      <div class="mt-6 space-y-3" id="combination-matrix-section">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h4 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Tabel Kombinasi Variasi & Pengaturan Pembelian</span>
            <span class="text-xs font-normal text-slate-500">(${displayMaterials.length} Baris Varian)</span>
          </h4>
        </div>

        <div class="overflow-x-auto rounded-lg border border-slate-300 bg-white shadow-xs scrollbar-thin">
          <table class="combo-matrix-table w-full text-left text-xs border-collapse">
            <thead class="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
              <tr>
                <th class="p-3 text-center min-w-[120px]">${escapeHtml(labelVar1)}</th>
                ${isVar2Active ? `<th class="p-3 text-center min-w-[130px]">${escapeHtml(labelVar2)}</th>` : ''}
                ${isVar3Active ? `<th class="p-3 text-center min-w-[130px]">${escapeHtml(labelVar3)}</th>` : ''}
                ${isVar4Active ? `<th class="p-3 text-center min-w-[130px]">${escapeHtml(labelVar4)}</th>` : ''}
                <th class="p-3 text-center min-w-[90px]">Min. Order</th>
                <th class="p-3 text-center min-w-[110px]">Max. Order</th>
                <th class="p-3 text-center min-w-[140px]">
                  <label class="inline-flex items-center gap-1.5 cursor-pointer select-none">
                    <span>Harga Grosir</span>
                    <input type="checkbox" id="chk-combo-header-wholesale" class="accent-emerald-600 rounded cursor-pointer" ${primaryState.has_wholesale ? 'checked' : ''} />
                  </label>
                </th>
                <th class="p-3 text-center min-w-[140px]">
                  <label class="inline-flex items-center gap-1.5 cursor-pointer select-none">
                    <span>Kelipatan Order</span>
                    <input type="checkbox" id="chk-combo-header-order-multiple" class="accent-emerald-600 rounded cursor-pointer" ${primaryState.has_order_multiple ? 'checked' : ''} />
                  </label>
                </th>
              </tr>
            </thead>
            <tbody id="combo-matrix-table-body" class="divide-y divide-slate-200">
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // Modals Markup Helpers
  function renderWholesaleModalMarkup() {
    return `
      <div id="modal-wholesale-config" class="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <i class="bi bi-tag-fill text-emerald-600"></i>
              <span>Pengaturan Harga Grosir</span>
            </h3>
            <button type="button" class="btn-close-modal text-slate-400 hover:text-red-500 font-bold p-1 leading-none text-base cursor-pointer" data-modal="modal-wholesale-config">âœ•</button>
          </div>

          <!-- Mode Grosir: Normal vs Bertingkat -->
          <div class="grid grid-cols-2 gap-2 text-xs">
            <label class="p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer font-bold ${primaryState.wholesale_mode !== 'tiered' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-300 text-slate-700'}">
              <input type="radio" name="modal_wholesale_mode" value="normal" ${primaryState.wholesale_mode !== 'tiered' ? 'checked' : ''} class="accent-emerald-600 cursor-pointer" />
              <span>Mode Normal</span>
            </label>
            <label class="p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer font-bold ${primaryState.wholesale_mode === 'tiered' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-300 text-slate-700'}">
              <input type="radio" name="modal_wholesale_mode" value="tiered" ${primaryState.wholesale_mode === 'tiered' ? 'checked' : ''} class="accent-emerald-600 cursor-pointer" />
              <span>Mode Bertingkat</span>
            </label>
          </div>

          <div id="modal-wholesale-body" class="space-y-3">
            ${renderWholesaleTable()}
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button type="button" class="btn-close-modal px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer" data-modal="modal-wholesale-config">Tutup</button>
            <button type="button" id="btn-save-wholesale-modal" class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white cursor-pointer shadow-xs">Simpan Pengaturan</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderOrderMultipleModalMarkup() {
    return `
      <div id="modal-order-multiple-config" class="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <i class="bi bi-layers-fill text-emerald-600"></i>
              <span>Pengaturan Kelipatan Order</span>
            </h3>
            <button type="button" class="btn-close-modal text-slate-400 hover:text-red-500 font-bold p-1 leading-none text-base cursor-pointer" data-modal="modal-order-multiple-config">âœ•</button>
          </div>

          <div id="modal-order-multiple-body" class="space-y-3">
            ${renderOrderMultipleSection()}
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button type="button" class="btn-close-modal px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer" data-modal="modal-order-multiple-config">Tutup</button>
            <button type="button" id="btn-save-multiple-modal" class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white cursor-pointer shadow-xs">Simpan Pengaturan</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderSpecificOptionsModalMarkup() {
    return `
      <div id="modal-specific-options" class="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h3 class="text-sm font-bold text-slate-900" id="specific-modal-title">Pilih Opsi Spesifik</h3>
              <p class="text-[11px] text-slate-500" id="specific-modal-subtitle">Pilih opsi yang berlaku untuk baris ini</p>
            </div>
            <button type="button" class="btn-close-modal text-slate-400 hover:text-red-500 font-bold p-1 leading-none text-base cursor-pointer" data-modal="modal-specific-options">âœ•</button>
          </div>

          <div class="flex items-center justify-between py-1 text-xs font-semibold text-slate-700">
            <label class="inline-flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" id="chk-specific-select-all" class="accent-emerald-600 rounded cursor-pointer" />
              <span>Pilih Semua Opsi</span>
            </label>
            <span id="specific-selected-count" class="text-emerald-700 font-bold">0 dipilih</span>
          </div>

          <div id="specific-options-checklist-container" class="space-y-1.5 max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-2.5 bg-slate-50">
            <!-- Checklist items rendered dynamically -->
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button type="button" class="btn-close-modal px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer" data-modal="modal-specific-options">Batal</button>
            <button type="button" id="btn-apply-specific-modal" class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white cursor-pointer shadow-xs">Terapkan Opsi</button>
          </div>
        </div>
      </div>
    `;
  }

  // Wholesale Table Sub-Renderer
  function renderWholesaleTable() {
    const mode = primaryState.wholesale_mode || 'normal';
    const tiers = primaryState.wholesale_tiers || [];

    if (mode === 'normal') {
      const tier1 = tiers[0] || { min_qty: 10, max_qty: 50, price: 0 };
      const hasNoMax = tier1.max_qty === null || tier1.max_qty === undefined || tier1.max_qty === '' || tier1.max_qty === 0;
      const minQty = tier1.min_qty || primaryState.min_order || 1;
      const maxQty = hasNoMax ? '' : tier1.max_qty;
      const discount = tier1.price || 0;

      return `
        <div class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Min. Order</label>
              <input 
                type="number" 
                id="modal-wholesale-normal-min" 
                min="${primaryState.min_order || 1}" 
                value="${minQty}" 
                class="w-full px-3 py-2 rounded-md border border-slate-300 text-xs font-bold bg-white outline-none focus:border-emerald-500" 
              />
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-[11px] font-bold text-slate-700">Max. Order</label>
                <label class="inline-flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer">
                  <input type="checkbox" id="chk-wholesale-no-max" ${hasNoMax ? 'checked' : ''} class="accent-emerald-600" />
                  <span>Tanpa Max</span>
                </label>
              </div>
              <input 
                type="number" 
                id="modal-wholesale-normal-max" 
                min="${minQty}" 
                value="${maxQty}" 
                placeholder="Tanpa Max" 
                ${hasNoMax ? 'disabled' : ''} 
                class="w-full px-3 py-2 rounded-md border border-slate-300 text-xs font-bold bg-white outline-none focus:border-emerald-500 ${hasNoMax ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}" 
              />
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Potongan Harga (-Rp)</label>
              <input 
                type="number" 
                id="modal-wholesale-normal-discount" 
                min="0" 
                value="${discount}" 
                placeholder="Cth: 500" 
                class="w-full px-3 py-2 rounded-md border border-slate-300 text-xs font-bold text-emerald-700 bg-white outline-none focus:border-emerald-500" 
              />
            </div>
          </div>

          <!-- Teks Keterangan Otomatis di Bawah Tabel -->
          <div class="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed font-normal" id="wholesale-normal-note">
            Setiap pembelian <b>${minQty}</b> hingga <b>${hasNoMax ? 'seterusnya (tanpa batas)' : (maxQty || minQty)}</b> maka mendapatkan potongan <b>Rp${(discount || 0).toLocaleString('id-ID')}</b> per pcs.
          </div>
        </div>
      `;
    }

    // Mode Bertingkat (Tiered Wholesale)
    const tieredRows = tiers.length > 0 ? tiers : [
      { id: DB.generateUUID(), min_qty: 10, max_qty: 50, price: 500 },
      { id: DB.generateUUID(), min_qty: 51, max_qty: 100, price: 1000 }
    ];

    const firstTier = tieredRows[0] || { min_qty: 10, max_qty: 50, price: 500 };
    const firstMin = firstTier.min_qty || 10;
    const firstMax = firstTier.max_qty || 50;
    const firstDisc = firstTier.price || 0;

    return `
      <div class="space-y-3">
        <div class="overflow-x-auto border border-slate-200 rounded-lg">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th class="p-2.5 w-12 text-center">Tingkat</th>
                <th class="p-2.5">Min. Order</th>
                <th class="p-2.5">Max. Order</th>
                <th class="p-2.5">Potongan (-Rp)</th>
                <th class="p-2.5 w-10 text-center">Hapus</th>
              </tr>
            </thead>
            <tbody id="tiered-wholesale-table-body" class="divide-y divide-slate-200">
              ${tieredRows.map((t, tIdx) => `
                <tr data-tier-id="${t.id}" data-idx="${tIdx}">
                  <td class="p-2.5 text-center font-bold text-slate-700">${tIdx + 1}</td>
                  <td class="p-2.5">
                    <input 
                      type="number" 
                      data-field="min_qty" 
                      value="${t.min_qty}" 
                      ${tIdx > 0 ? 'readonly class="w-full px-2 py-1 rounded border border-slate-200 text-xs font-bold bg-slate-100 text-slate-500 cursor-not-allowed"' : 'class="w-full px-2 py-1 rounded border border-slate-300 text-xs font-bold bg-white focus:border-emerald-500"'} 
                    />
                  </td>
                  <td class="p-2.5">
                    <input 
                      type="number" 
                      data-field="max_qty" 
                      value="${t.max_qty || ''}" 
                      placeholder="Cth: 100" 
                      class="tiered-max-input w-full px-2 py-1 rounded border border-slate-300 text-xs font-bold bg-white focus:border-emerald-500" 
                    />
                  </td>
                  <td class="p-2.5">
                    <input 
                      type="number" 
                      data-field="price" 
                      value="${t.price || 0}" 
                      placeholder="Potongan Rp" 
                      class="tiered-price-input w-full px-2 py-1 rounded border border-slate-300 text-xs font-bold text-emerald-700 bg-white focus:border-emerald-500" 
                    />
                  </td>
                  <td class="p-2.5 text-center">
                    <button type="button" class="btn-delete-wholesale-tier p-1 text-slate-400 hover:text-red-600 cursor-pointer ${tieredRows.length <= 1 ? 'disabled opacity-30 cursor-not-allowed' : ''}" data-tier-id="${t.id}">
                      <i class="bi bi-trash3-fill"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <button type="button" id="btn-add-wholesale-tier" class="px-3 py-1.5 rounded-md border border-dashed border-emerald-500 text-emerald-600 hover:bg-emerald-50 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
          <i class="bi bi-plus-lg"></i>
          <span>Tambah Tingkat Grosir</span>
        </button>

        <!-- Teks Keterangan Otomatis di Bawah Tabel -->
        <div class="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed font-normal" id="wholesale-tiered-note">
          Pembelian diatas <b>${Math.max(0, firstMin - 1)}</b> hingga <b>${firstMax}</b> mendapatkan potongan <b>Rp${(firstDisc || 0).toLocaleString('id-ID')}</b>. (Berlaku kelipatan tingkat berikutnya untuk kuantitas di atasnya).
        </div>
      </div>
    `;
  }

  // Order Multiple Section Sub-Renderer
  function renderOrderMultipleSection() {
    const mode = primaryState.order_multiple_type || 'all';
    const globalVal = primaryState.order_multiple_value || 1;
    const variantMap = primaryState.order_multiples_by_variant || {};

    // Available options from Variasi 1
    const availableVariants = materialsState.map((m, idx) => ({
      id: m.id,
      name: m.name || `Opsi ${idx + 1}`
    }));

    const configuredIds = Object.keys(variantMap);
    const configuredRows = configuredIds.length > 0 ? configuredIds : (availableVariants[0] ? [availableVariants[0].id] : []);

    return `
      <div class="space-y-4">
        <!-- Pilihan Mode: Global vs Spesifik per Varian -->
        <div class="grid grid-cols-2 gap-2 text-xs">
          <label class="p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer font-bold ${mode === 'all' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-300 text-slate-700'}">
            <input type="radio" name="order_multiple_type_radio" value="all" ${mode === 'all' ? 'checked' : ''} class="accent-emerald-600" />
            <span>Mode Global (Semua Varian)</span>
          </label>
          <label class="p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer font-bold ${mode === 'per_variant' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-300 text-slate-700'}">
            <input type="radio" name="order_multiple_type_radio" value="per_variant" ${mode === 'per_variant' ? 'checked' : ''} class="accent-emerald-600" />
            <span>Mode Spesifik per Varian</span>
          </label>
        </div>

        ${mode === 'all' ? `
          <!-- Mode Global -->
          <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <label class="block text-xs font-bold text-slate-800">
              Kelipatan Pembelian Produk:
            </label>
            <div class="flex items-center gap-2">
              <input 
                type="number" 
                id="input-order-multiple-single" 
                min="1" 
                value="${globalVal}" 
                class="w-32 px-3 py-2 rounded-md border border-slate-300 text-xs font-bold text-center bg-white outline-none focus:border-emerald-500" 
              />
              <span class="text-xs text-slate-500 font-medium">pcs per transaksi</span>
            </div>
            <p class="text-[11px] text-slate-400">Contoh: Diatur 10, maka pembeli hanya dapat membeli 10, 20, 30, dst.</p>
          </div>
        ` : `
          <!-- Mode Spesifik per Varian (Deduplikasi Pilihan Varian) -->
          <div class="space-y-3">
            <p class="text-[11px] text-slate-500">Atur nilai kelipatan pesanan khusus untuk masing-masing opsi varian:</p>
            <div class="overflow-x-auto border border-slate-200 rounded-lg">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th class="p-2.5">Opsi Varian</th>
                    <th class="p-2.5 w-36">Kelipatan (Pcs)</th>
                    <th class="p-2.5 w-12 text-center">Hapus</th>
                  </tr>
                </thead>
                <tbody id="variant-multiples-table-body" class="divide-y divide-slate-200">
                  ${configuredRows.map((vId, rIdx) => {
                    const val = variantMap[vId] || 1;
                    // Filter: exclude options chosen by OTHER rows to prevent duplication!
                    const otherChosenIds = configuredRows.filter((id, i) => i !== rIdx);
                    const selectableOptions = availableVariants.filter(v => !otherChosenIds.includes(v.id) || v.id === vId);

                    return `
                      <tr data-variant-id="${vId}">
                        <td class="p-2.5">
                          <select class="select-variant-multiple-id w-full px-2 py-1.5 rounded border border-slate-300 text-xs font-medium bg-white focus:border-emerald-500 outline-none">
                            ${selectableOptions.map(opt => `
                              <option value="${opt.id}" ${opt.id === vId ? 'selected' : ''}>${escapeHtml(opt.name)}</option>
                            `).join('')}
                          </select>
                        </td>
                        <td class="p-2.5">
                          <input 
                            type="number" 
                            min="1" 
                            value="${val}" 
                            class="input-variant-multiple w-full px-2 py-1.5 rounded border border-slate-300 text-xs font-bold text-center bg-white focus:border-emerald-500 outline-none" 
                          />
                        </td>
                        <td class="p-2.5 text-center">
                          <button type="button" class="btn-delete-variant-multiple p-1 text-slate-400 hover:text-red-600 cursor-pointer ${configuredRows.length <= 1 ? 'disabled opacity-30 cursor-not-allowed' : ''}">
                            <i class="bi bi-trash3-fill"></i>
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            ${configuredRows.length < availableVariants.length ? `
              <button type="button" id="btn-add-variant-multiple-row" class="px-3 py-1.5 rounded-md border border-dashed border-emerald-500 text-emerald-600 hover:bg-emerald-50 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
                <i class="bi bi-plus-lg"></i>
                <span>Tambah Pengaturan Varian</span>
              </button>
            ` : ''}
          </div>
        `}
      </div>
    `;
  }

  // ==========================================================================
  // RENDER STEP 3: PROMO PRODUK, PENGIRIMAN & DESKRIPSI AI


  function renderMaterialsRows(isKombStep) {
    const isProtected = materialsState.length <= 1;
    const isSamePrice = Boolean(primaryState.same_price_tiers && primaryState.same_price_tiers.tier1);
    const isSameCost = Boolean(primaryState.same_cost_tiers && primaryState.same_cost_tiers.tier1);
    const stockMode = (primaryState.stock_mode_tiers && primaryState.stock_mode_tiers.tier1) || '';

    const firstPrice = materialsState[0]?.price ?? '';
    const firstCost = materialsState[0]?.cost_price ?? '';
    const firstStock = materialsState[0]?.stock ?? '';

    return materialsState.map((mat, idx) => {
      const placeholderName = `Opsi ${idx + 1}`;
      const priceVal = (isSamePrice && idx > 0) ? firstPrice : (mat.price !== undefined && mat.price !== null && mat.price !== '' ? mat.price : '');
      const costVal = (isSameCost && idx > 0) ? firstCost : (mat.cost_price !== undefined && mat.cost_price !== null && mat.cost_price !== '' ? mat.cost_price : '');
      const stockVal = stockMode === 'unlimited' ? 'Unlimited' : ((stockMode === 'same' && idx > 0) ? firstStock : (mat.stock !== undefined && mat.stock !== null && mat.stock !== '' ? mat.stock : ''));

      return `
        <div class="variation-option-row flex flex-col sm:flex-row items-stretch sm:items-center gap-2" data-id="${mat.id}" data-tier="tier1" data-idx="${idx}">
          <div style="border-radius: 0px !important;" class="flex-1 grid grid-cols-2 sm:grid-cols-12 bg-white border border-slate-400 rounded-none overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-slate-300 shadow-2xs">
            <!-- Kolom 1: Nama Opsi -->
            <input 
              type="text" 
              data-field="name" 
              value="${escapeHtml(mat.name || '')}" 
              placeholder="${placeholderName}" 
              style="border-radius: 0px !important;" 
              class="mat-input col-span-2 sm:col-span-3 px-3 py-2 text-xs outline-none bg-white font-medium text-slate-800 focus:bg-emerald-50/30 rounded-none" 
            />
            <!-- Kolom 2: Keterangan -->
            <input 
              type="text" 
              data-field="description" 
              value="${escapeHtml(mat.description || '')}" 
              placeholder="Keterangan" 
              style="border-radius: 0px !important;" 
              class="mat-input col-span-2 sm:col-span-3 px-3 py-2 text-xs outline-none bg-white text-slate-700 focus:bg-emerald-50/30 rounded-none" 
            />
            <!-- Kolom 3: Harga Jual -->
            <input 
              type="number" 
              min="0" 
              data-field="price" 
              value="${priceVal}" 
              placeholder="Harga Jual" 
              ${isSamePrice && idx > 0 ? 'readonly' : ''} 
              style="border-radius: 0px !important;" 
              class="mat-input col-span-1 sm:col-span-2 min-w-[100px] px-2.5 py-2 text-xs outline-none font-bold text-slate-900 focus:bg-emerald-50/30 rounded-none ${isSamePrice && idx > 0 ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}" 
            />
            <!-- Kolom 4: Modal/Hpp -->
            <input 
              type="number" 
              min="0" 
              data-field="cost_price" 
              value="${costVal}" 
              placeholder="Modal/Hpp" 
              ${isSameCost && idx > 0 ? 'readonly' : ''} 
              style="border-radius: 0px !important;" 
              class="mat-input col-span-1 sm:col-span-2 min-w-[100px] px-2.5 py-2 text-xs outline-none text-slate-700 focus:bg-emerald-50/30 rounded-none ${isSameCost && idx > 0 ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}" 
            />
            <!-- Kolom 5: Stok -->
            <input 
              type="${stockMode === 'unlimited' ? 'text' : 'number'}" 
              min="0" 
              data-field="stock" 
              value="${stockVal}" 
              placeholder="Stok" 
              ${stockMode === 'unlimited' || (stockMode === 'same' && idx > 0) ? 'readonly' : ''} 
              style="border-radius: 0px !important;" 
              class="mat-input col-span-2 sm:col-span-2 min-w-[95px] px-2.5 py-2 text-xs outline-none font-medium focus:bg-emerald-50/30 rounded-none ${stockMode === 'unlimited' || (stockMode === 'same' && idx > 0) ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-700'}" 
            />
          </div>

          <!-- Tombol Aksi di Luar Kotak: Hapus di Sisi Kiri, Handle Geser di Sisi Kanan -->
          <div class="flex items-center justify-end sm:justify-start gap-2 sm:gap-2.5 shrink-0 self-end sm:self-center">
            <button 
              type="button" 
              class="btn-delete-mat p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-xs" 
              data-tier="tier1" 
              data-id="${mat.id}" 
              ${isProtected ? 'disabled title="Minimal 1 opsi"' : 'title="Hapus Opsi"'}
            >
              <i class="bi bi-trash3-fill"></i>
            </button>
            <button 
              type="button" 
              class="btn-move-row btn-move-mat p-1.5 text-slate-400 hover:text-emerald-600 transition cursor-grab active:cursor-grabbing text-xs leading-none" 
              data-tier="tier1" 
              data-id="${mat.id}" 
              data-idx="${idx}" 
              title="Geser / Pindah Urutan Opsi"
            >
              <i class="bi bi-arrows-move"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderFinishingRows(tier) {
    const list = finishingsState[tier] || [];
    const isProtected = list.length <= 1;
    const isSamePrice = Boolean(primaryState.same_price_tiers && primaryState.same_price_tiers[tier]);
    const isSameCost = Boolean(primaryState.same_cost_tiers && primaryState.same_cost_tiers[tier]);
    const stockMode = (primaryState.stock_mode_tiers && primaryState.stock_mode_tiers[tier]) || '';

    const firstPrice = list[0]?.price ?? '';
    const firstCost = list[0]?.cost_price ?? '';
    const firstStock = list[0]?.stock ?? '';

    // Khusus Layanan Extras (Di Luar Qty) - 6 Bagian sesuai Gambar 5
    if (tier === 'extra_3') {
      return list.map((fin, idx) => {
        const placeholderName = `Opsi ${idx + 1}`;
        const priceVal = (isSamePrice && idx > 0) ? firstPrice : (fin.price !== undefined && fin.price !== null && fin.price !== '' ? fin.price : '');
        const costVal = (isSameCost && idx > 0) ? firstCost : (fin.cost_price !== undefined && fin.cost_price !== null && fin.cost_price !== '' ? fin.cost_price : '');
        const stockVal = stockMode === 'unlimited' ? 'Unlimited' : ((stockMode === 'same' && idx > 0) ? firstStock : (fin.stock !== undefined && fin.stock !== null && fin.stock !== '' ? fin.stock : ''));
        const extraType = fin.extra_type || 'checklist';

        return `
          <div class="variation-option-row flex flex-col sm:flex-row items-stretch sm:items-center gap-2" data-id="${fin.id}" data-tier="${tier}" data-idx="${idx}">
            <div style="border-radius: 0px !important;" class="flex-1 grid grid-cols-2 sm:grid-cols-12 bg-white border border-slate-400 rounded-none overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-slate-300 shadow-2xs">
              <!-- Bagian 1: Kotak Upload Gambar Kecil -->
              <div style="border-radius: 0px !important;" class="extra-img-cell col-span-2 sm:col-span-1 flex items-center justify-center p-1 bg-slate-50">
                <input type="file" accept="image/*" class="hidden extra-file-input" data-id="${fin.id}" id="extra-file-${fin.id}" />
                <label for="extra-file-${fin.id}" class="w-8 h-8 rounded border border-slate-300 flex items-center justify-center cursor-pointer overflow-hidden hover:border-emerald-500 text-emerald-600 bg-white" title="Unggah Foto Opsi">
                  ${fin.image_url ? `<img src="${fin.image_url}" class="w-full h-full object-cover" />` : `<i class="bi bi-image text-sm"></i>`}
                </label>
              </div>

              <!-- Bagian 2: Nama Opsi -->
              <input 
                type="text" 
                data-field="name" 
                value="${escapeHtml(fin.name || '')}" 
                placeholder="${placeholderName}" 
                style="border-radius: 0px !important;" 
                class="fin-input col-span-2 sm:col-span-3 px-3 py-2 text-xs outline-none bg-white font-medium text-slate-800 focus:bg-emerald-50/30 rounded-none" 
              />

              <!-- Bagian 3: Dropdown Tipe Input (Pilihan Ganda vs Input Qty) -->
              <select data-field="extra_type" style="border-radius: 0px !important;" class="fin-input col-span-2 sm:col-span-2 px-2 py-1.5 text-xs bg-white outline-none focus:bg-emerald-50 font-medium text-slate-700 rounded-none">
                <option value="" disabled ${!extraType ? 'selected' : ''}>Tipe Input</option>
                <option value="pilihan_ganda" ${extraType === 'pilihan_ganda' || extraType === 'checklist' ? 'selected' : ''}>Pilihan Ganda</option>
                <option value="qty" ${extraType === 'qty' ? 'selected' : ''}>Input Qty</option>
              </select>

              <!-- Bagian 4: Harga Satuan -->
              <input 
                type="number" 
                min="0" 
                data-field="price" 
                value="${priceVal}" 
                placeholder="Harga Satuan" 
                ${isSamePrice && idx > 0 ? 'readonly' : ''} 
                style="border-radius: 0px !important;" 
                class="fin-input col-span-1 sm:col-span-2 min-w-[100px] px-2.5 py-2 text-xs outline-none font-bold text-slate-900 focus:bg-emerald-50/30 rounded-none ${isSamePrice && idx > 0 ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}" 
              />

              <!-- Bagian 5: Modal/Hpp -->
              <input 
                type="number" 
                min="0" 
                data-field="cost_price" 
                value="${costVal}" 
                placeholder="Modal/Hpp" 
                ${isSameCost && idx > 0 ? 'readonly' : ''} 
                style="border-radius: 0px !important;" 
                class="fin-input col-span-1 sm:col-span-2 min-w-[100px] px-2.5 py-2 text-xs outline-none text-slate-700 focus:bg-emerald-50/30 rounded-none ${isSameCost && idx > 0 ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}" 
              />

              <!-- Bagian 6: Stok -->
              <input 
                type="${stockMode === 'unlimited' ? 'text' : 'number'}" 
                min="0" 
                data-field="stock" 
                value="${stockVal}" 
                placeholder="Stok" 
                ${stockMode === 'unlimited' || (stockMode === 'same' && idx > 0) ? 'readonly' : ''} 
                style="border-radius: 0px !important;" 
                class="fin-input col-span-2 sm:col-span-2 min-w-[95px] px-2.5 py-2 text-xs outline-none font-medium focus:bg-emerald-50/30 rounded-none ${stockMode === 'unlimited' || (stockMode === 'same' && idx > 0) ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-700'}" 
              />
            </div>

            <!-- Tombol Aksi di Luar Kotak: Hapus di Sisi Kiri, Handle Geser di Sisi Kanan -->
            <div class="flex items-center justify-end sm:justify-start gap-2 sm:gap-2.5 shrink-0 self-end sm:self-center">
              <button 
                type="button" 
                class="btn-delete-fin p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-xs" 
                data-tier="${tier}" 
                data-id="${fin.id}" 
                ${isProtected ? 'disabled title="Minimal 1 opsi"' : 'title="Hapus Opsi"'}
              >
                <i class="bi bi-trash3-fill"></i>
              </button>
              <button 
                type="button" 
                class="btn-move-row btn-move-fin p-1.5 text-slate-400 hover:text-emerald-600 transition cursor-grab active:cursor-grabbing text-xs leading-none" 
                data-tier="${tier}" 
                data-id="${fin.id}" 
                data-idx="${idx}" 
                title="Geser / Pindah Urutan Opsi"
              >
                <i class="bi bi-arrows-move"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // Variasi 2, 3, 4 (Pita Putih 5-Kolom Seragam)
    return list.map((fin, idx) => {
      const placeholderName = `Opsi ${idx + 1}`;
      const priceVal = (isSamePrice && idx > 0) ? firstPrice : (fin.price !== undefined && fin.price !== null && fin.price !== '' ? fin.price : '');
      const costVal = (isSameCost && idx > 0) ? firstCost : (fin.cost_price !== undefined && fin.cost_price !== null && fin.cost_price !== '' ? fin.cost_price : '');
      const stockVal = stockMode === 'unlimited' ? 'Unlimited' : ((stockMode === 'same' && idx > 0) ? firstStock : (fin.stock !== undefined && fin.stock !== null && fin.stock !== '' ? fin.stock : ''));

      return `
        <div class="variation-option-row flex flex-col sm:flex-row items-stretch sm:items-center gap-2" data-id="${fin.id}" data-tier="${tier}" data-idx="${idx}">
          <div class="flex-1 grid grid-cols-2 sm:grid-cols-12 bg-white border border-slate-400 rounded-none overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-slate-300 shadow-2xs">
            <!-- Kolom 1: Nama Opsi -->
            <input 
              type="text" 
              data-field="name" 
              value="${escapeHtml(fin.name || '')}" 
              placeholder="${placeholderName}" 
              style="border-radius: 0px !important;" 
              class="fin-input col-span-2 sm:col-span-3 px-3 py-2 text-xs outline-none bg-white font-medium text-slate-800 focus:bg-emerald-50/30 rounded-none" 
            />
            <!-- Kolom 2: Keterangan -->
            <input 
              type="text" 
              data-field="description" 
              value="${escapeHtml(fin.description || '')}" 
              placeholder="Keterangan" 
              style="border-radius: 0px !important;" 
              class="fin-input col-span-2 sm:col-span-3 px-3 py-2 text-xs outline-none bg-white text-slate-700 focus:bg-emerald-50/30 rounded-none" 
            />
            <!-- Kolom 3: Harga Jual -->
            <input 
              type="number" 
              min="0" 
              data-field="price" 
              value="${priceVal}" 
              placeholder="Harga Jual" 
              ${isSamePrice && idx > 0 ? 'readonly' : ''} 
              style="border-radius: 0px !important;" 
              class="fin-input col-span-1 sm:col-span-2 min-w-[100px] px-2.5 py-2 text-xs outline-none font-bold text-slate-900 focus:bg-emerald-50/30 rounded-none ${isSamePrice && idx > 0 ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}" 
            />
            <!-- Kolom 4: Modal/Hpp -->
            <input 
              type="number" 
              min="0" 
              data-field="cost_price" 
              value="${costVal}" 
              placeholder="Modal/Hpp" 
              ${isSameCost && idx > 0 ? 'readonly' : ''} 
              style="border-radius: 0px !important;" 
              class="fin-input col-span-1 sm:col-span-2 min-w-[100px] px-2.5 py-2 text-xs outline-none text-slate-700 focus:bg-emerald-50/30 rounded-none ${isSameCost && idx > 0 ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}" 
            />
            <!-- Kolom 5: Stok -->
            <input 
              type="${stockMode === 'unlimited' ? 'text' : 'number'}" 
              min="0" 
              data-field="stock" 
              value="${stockVal}" 
              placeholder="Stok" 
              ${stockMode === 'unlimited' || (stockMode === 'same' && idx > 0) ? 'readonly' : ''} 
              style="border-radius: 0px !important;" 
              class="fin-input col-span-2 sm:col-span-2 min-w-[95px] px-2.5 py-2 text-xs outline-none font-medium focus:bg-emerald-50/30 rounded-none ${stockMode === 'unlimited' || (stockMode === 'same' && idx > 0) ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-700'}" 
            />
          </div>

          <!-- Tombol Aksi di Luar Kotak: Hapus di Sisi Kiri, Handle Geser di Sisi Kanan -->
          <div class="flex items-center justify-end sm:justify-start gap-2 sm:gap-2.5 shrink-0 self-end sm:self-center">
            <button 
              type="button" 
              class="btn-delete-fin p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-xs" 
              data-tier="${tier}" 
              data-id="${fin.id}" 
              ${isProtected ? 'disabled title="Minimal 1 opsi"' : 'title="Hapus Opsi"'}
            >
              <i class="bi bi-trash3-fill"></i>
            </button>
            <button 
              type="button" 
              class="btn-move-row btn-move-fin p-1.5 text-slate-400 hover:text-emerald-600 transition cursor-grab active:cursor-grabbing text-xs leading-none" 
              data-tier="${tier}" 
              data-id="${fin.id}" 
              data-idx="${idx}" 
              title="Geser / Pindah Urutan Opsi"
            >
              <i class="bi bi-arrows-move"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
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
      const topBar = document.getElementById('product-form-top-bar');
      if (topBar) {
        if (currentStep === 2) {
          topBar.classList.add('hidden');
          topBar.classList.remove('flex');
        } else {
          topBar.classList.remove('hidden');
          topBar.classList.add('flex');
        }
      }

      if (p1) p1.className = `space-y-6 ${currentStep === 1 ? 'block' : 'hidden'}`;
      if (p2) {
        p2.className = `space-y-6 ${currentStep === 2 ? 'block' : 'hidden'}`;
        if (currentStep === 2) {
          p2.innerHTML = renderStep2Content();
          bindStep2InteractiveEvents();
          initStep2SubnavObserver();
        }
      }

      // Dynamic Header Preview Title
      const sidebarTitle = document.getElementById('sidebar-preview-step-title');
      const mobileTitle = document.getElementById('mobile-preview-step-title');
      if (sidebarTitle) {
        sidebarTitle.innerHTML = currentStep === 1 ? 'Preview<br>Kartu Produk' : 'Preview<br>Info Penjualan';
      }
      if (mobileTitle) {
        mobileTitle.innerHTML = currentStep === 1 ? 'Preview<br>Kartu Produk' : 'Preview<br>Info Penjualan';
      }

      if (window.lucide) window.lucide.createIcons();
      updateProductCardLivePreview();
    }

    function goToStep(step) {
      if (step < 1 || step > 2) return;

      if (step > currentStep) {
        syncStateFromDOM();

        // Validasi Step 1 jika ingin maju dari Step 1 ke Step 2
        if (currentStep === 1) {
          const s1Errors = [];
          if (!primaryState.product_type || (primaryState.product_type !== 'physical' && primaryState.product_type !== 'non_physical')) {
            s1Errors.push('Pilih Jenis Produk / Layanan terlebih dahulu (Fisik atau Non Fisik).');
          }
          if (primaryState.is_active && !primaryState.card_variant) {
            s1Errors.push('Pilih Jenis Model Kartu Produk terlebih dahulu.');
          }
          if (primaryState.is_active && (!primaryState.images || primaryState.images.length === 0) && !primaryState.image_url) {
            s1Errors.push('Foto produk wajib diunggah minimal 1 foto sebagai cover.');
          }
          if (!primaryState.name || primaryState.name.trim() === '') {
            s1Errors.push('Nama Produk wajib diisi.');
          }
          if (primaryState.show_badge !== false) {
            const l1 = (document.getElementById('input-custom-label-1')?.value || primaryState.custom_labels?.[0] || '').trim();
            if (!l1) {
              s1Errors.push('Label 1 wajib diisi jika Tambahkan Label Khusus diaktifkan.');
            }
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

    // GATING BERTAHAP DI STEP 1 (CLEAN SHOPEE-STYLE TANPA GEMBOK)
    function updateStep1SequentialGatingDOM() {
      const p1Placeholder = document.getElementById('step1-gated-placeholder');
      const p1Unlocked = document.getElementById('step1-unlocked-fields');
      const sec3 = document.getElementById('section-step1-input3-cardmodel');
      const cardModelPlaceholder = document.getElementById('step1-cardmodel-gated-placeholder');
      const cardModelUnlocked = document.getElementById('step1-cardmodel-unlocked-fields');
      const fabMob = document.getElementById('btn-fab-live-preview');

      const hasType = Boolean(primaryState.product_type);
      const isStoreOn = Boolean(primaryState.is_active);
      const hasVariant = Boolean(primaryState.card_variant);

      // 1. Gating Level 1: Jenis Produk
      if (!hasType) {
        if (p1Placeholder) p1Placeholder.classList.remove('hidden');
        if (p1Unlocked) p1Unlocked.classList.add('hidden');
        if (fabMob) fabMob.classList.add('hidden');
        setSidebarState(false);
        return;
      }

      // Jenis Produk sudah dipilih -> buka Level 1
      if (p1Placeholder) p1Placeholder.classList.add('hidden');
      if (p1Unlocked) p1Unlocked.classList.remove('hidden');

      // 2. Gating Level 2: Etalase ON vs OFF
      if (!isStoreOn) {
        // Etalase OFF: Sembunyikan Model Kartu & Placeholder
        if (sec3) sec3.classList.add('hidden');
        if (cardModelPlaceholder) cardModelPlaceholder.classList.add('hidden');
        if (cardModelUnlocked) cardModelUnlocked.classList.remove('hidden');

        // Sembunyikan Input Foto khusus etalase
        const sec4Photo = document.getElementById('section-step1-input4-photo');
        if (sec4Photo) sec4Photo.classList.add('hidden');

        setSidebarState(false);
        if (fabMob) fabMob.classList.add('hidden');
      } else {
        // Etalase ON: Tampilkan Model Kartu
        if (sec3) sec3.classList.remove('hidden');
        const sec4Photo = document.getElementById('section-step1-input4-photo');
        if (sec4Photo) sec4Photo.classList.remove('hidden');

        if (fabMob) fabMob.classList.remove('hidden');

        // Cek Model Kartu
        if (!hasVariant) {
          if (cardModelPlaceholder) cardModelPlaceholder.classList.remove('hidden');
          if (cardModelUnlocked) cardModelUnlocked.classList.add('hidden');
          setSidebarState(false);
        } else {
          if (cardModelPlaceholder) cardModelPlaceholder.classList.add('hidden');
          if (cardModelUnlocked) cardModelUnlocked.classList.remove('hidden');
          // Jika Jenis Produk, Etalase ON, dan Model Kartu sudah dipilih -> Otomatis Buka Sidebar Live Preview
          setSidebarState(true);
        }
      }

      updateProductCardLivePreview();
    }

    // UPDATE PROGRESSIVE GATING STEP 2 DOM
    let prevCard1Valid = false;
    function updateStep2CardGatingDOM(force = false) {
      if (currentStep !== 2) return;
      const isCard1Valid = (getMissingLabelsForCard(2).length === 0);
      if (force || isCard1Valid !== prevCard1Valid) {
        prevCard1Valid = isCard1Valid;
        const container = document.getElementById('step-pane-2');
        if (!container) return;
        const scrollY = window.scrollY;
        syncStateFromDOM();
        container.innerHTML = renderStep2Content();
        bindStep2InteractiveEvents();
        initStep2SubnavObserver();
        window.scrollTo(0, scrollY);
      }
    }

    // SUB-NAVBAR ANCHOR SCROLL SPY & OBSERVER
    function initStep2SubnavObserver() {
      const tabs = document.querySelectorAll('.step2-nav-tab');
      tabs.forEach(tab => {
        tab.onclick = (e) => {
          e.preventDefault();
          const targetId = tab.getAttribute('data-target');
          const el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        };
      });

      const cards = ['card-step2-info', 'card-step2-sales', 'card-step2-shipping', 'card-step2-promo', 'card-step2-description', 'card-step2-others'];
      const cardEls = cards.map(id => document.getElementById(id)).filter(Boolean);

      if ('IntersectionObserver' in window && cardEls.length > 0) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const activeId = entry.target.id;
              tabs.forEach(tab => {
                if (tab.getAttribute('data-target') === activeId) {
                  tab.className = 'step2-nav-tab px-4 py-3.5 text-xs sm:text-sm font-bold text-emerald-600 border-b-2 border-emerald-600 transition-colors whitespace-nowrap cursor-pointer bg-transparent';
                } else {
                  tab.className = 'step2-nav-tab px-4 py-3.5 text-xs sm:text-sm font-medium text-slate-600 border-b-2 border-transparent hover:text-emerald-600 hover:border-emerald-600 transition-colors whitespace-nowrap cursor-pointer bg-transparent';
                }
              });
            }
          });
        }, {
          threshold: 0.2,
          rootMargin: '-80px 0px -50% 0px'
        });

        cardEls.forEach(el => observer.observe(el));
      }
    }

    // BIND EVENT INTERAKTIF STEP 2
  function bindStep2InteractiveEvents() {
    // Tombol Aksi Bawah Step 2
    const btn2Prev = document.getElementById('btn-step-2-prev');
    if (btn2Prev) btn2Prev.onclick = () => goToStep(1);

    const btnDraft = document.getElementById('btn-save-draft');
    if (btnDraft) btnDraft.onclick = () => handleFormSubmit(true);

    const btnSubmit = document.getElementById('btn-submit-product');
    if (btnSubmit) btnSubmit.onclick = () => handleFormSubmit(false);

    // Card 1 Event Listeners di Step 2
    const step2Name = document.getElementById('step2-input-name');
    if (step2Name) {
      step2Name.oninput = (e) => {
        primaryState.name = e.target.value;
        const inputProdName = document.getElementById('input-prod-name');
        if (inputProdName) inputProdName.value = e.target.value;
        updateProductCardLivePreview();
        updateStep2CardGatingDOM();
      };
    }

    const step2Cat = document.getElementById('select-step2-cat');
    const step2SubCat = document.getElementById('select-step2-sub-cat');
    if (step2Cat) {
      step2Cat.onchange = (e) => {
        primaryState.category_id = e.target.value;
        if (step2SubCat) {
          const subs = primaryState.category_id && DB.getSubCategories ? DB.getSubCategories(primaryState.category_id) : [];
          step2SubCat.innerHTML = '<option value="">-- Tanpa Sub-Kategori --</option>' + subs.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
          primaryState.sub_category_id = '';
        }
        updateProductCardLivePreview();
        updateStep2CardGatingDOM(true);
      };
    }

    if (step2SubCat) {
      step2SubCat.onchange = (e) => {
        primaryState.sub_category_id = e.target.value;
        updateProductCardLivePreview();
      };
    }

    const btnQuickCatStep2 = document.getElementById('btn-quick-add-category-step2');
    if (btnQuickCatStep2) {
      btnQuickCatStep2.onclick = (e) => {
        e.preventDefault();
        openQuickCatModal();
      };
    }

    const btnStep2Upload = document.getElementById('btn-step2-upload-more');
    if (btnStep2Upload) {
      btnStep2Upload.onclick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
          if (e.isTrusted === false) return;
        }
        const fileInput = document.getElementById('input-prod-images-hidden') || document.getElementById('input-prod-image');
        if (fileInput) fileInput.click();
      };
    }

    // Pricing Model Selection (Normal, Size, Weight, Volume)
    const selectPricingModel = document.getElementById('select-pricing-model');
    if (selectPricingModel) {
      selectPricingModel.onchange = e => {
        primaryState.pricing_model = e.target.value;
        const container = document.getElementById('pricing-model-interactive-container');
        if (container) container.innerHTML = renderPricingModelSection();
        const singleSettings = document.getElementById('single-product-purchase-settings');
        if (singleSettings) {
          if (primaryState.pricing_model === 'normal' && !primaryState.has_variants) {
            singleSettings.classList.remove('hidden');
            singleSettings.className = 'space-y-6';
          } else {
            singleSettings.classList.add('hidden');
          }
        }
        bindStep2InteractiveEvents();
        updateProductCardLivePreview();
      };
    }

    // Tombol Variasi Produk: Buka Variasi 1 (Minimal 2 Baris Awal)
    const btnToggleVariants = document.getElementById('btn-toggle-has-variants');
    if (btnToggleVariants) {
      btnToggleVariants.onclick = () => {
        primaryState.has_variants = true;
        if (materialsState.length < 2) {
          const p = materialsState[0]?.price || '';
          const c = materialsState[0]?.cost_price || '';
          const n = (materialsState[0]?.name && materialsState[0].name !== 'Produk Standar') ? materialsState[0].name : '';
          materialsState = [
            { id: DB.generateUUID(), name: n, description: '', price: p, cost_price: c, stock: '', image_url: '', step_multiplier: 1 },
            { id: DB.generateUUID(), name: '', description: '', price: '', cost_price: '', stock: '', image_url: '', step_multiplier: 1 }
          ];
        }
        const singleSettings = document.getElementById('single-product-purchase-settings');
        if (singleSettings) singleSettings.classList.add('hidden');
        const container = document.getElementById('pricing-model-interactive-container');
        if (container) container.innerHTML = renderPricingModelSection();
        bindStep2InteractiveEvents();
        updateProductCardLivePreview();
        if (window.lucide) window.lucide.createIcons();
      };
    }

    // Tombol Tutup Variasi 1 (Kembali ke Produk Tunggal & Reset Varian Turunan)
    const btnCloseVar1 = document.getElementById('btn-close-variasi-1');
    if (btnCloseVar1) {
      btnCloseVar1.onclick = () => {
        primaryState.has_variants = false;
        primaryState.has_variation_2 = false;
        primaryState.has_layer_2 = false;
        finishingsState.main = [];
        primaryState.has_variation_3 = false;
        primaryState.has_layer_3 = false;
        finishingsState.extra_1 = [];
        primaryState.has_variation_4 = false;
        primaryState.has_layer_4 = false;
        finishingsState.extra_2 = [];

        materialsState = [{
          id: DB.generateUUID(),
          name: primaryState.name || 'Produk Standar',
          price: materialsState[0]?.price || 0,
          cost_price: materialsState[0]?.cost_price || 0,
          step_multiplier: 1
        }];

        const singleSettings = document.getElementById('single-product-purchase-settings');
        if (singleSettings && primaryState.pricing_model === 'normal') {
          singleSettings.classList.remove('hidden');
          singleSettings.className = 'space-y-6';
        }
        const container = document.getElementById('pricing-model-interactive-container');
        if (container) container.innerHTML = renderPricingModelSection();
        bindStep2InteractiveEvents();
        updateProductCardLivePreview();
        if (window.lucide) window.lucide.createIcons();
      };
    }

    // Single Price & Cost Inputs (Produk Tunggal)
    const singlePrice = document.getElementById('input-single-price');
    const singleCost = document.getElementById('input-single-cost');
    const singleBadge = document.getElementById('single-margin-badge');

    function updateSingleMargin() {
      const p = parseFloat(singlePrice?.value) || 0;
      const c = parseFloat(singleCost?.value) || 0;
      if (materialsState.length > 0) {
        materialsState[0].price = p;
        materialsState[0].cost_price = c;
        materialsState[0].name = primaryState.name || 'Produk Standar';
      }
      if (singleBadge) singleBadge.innerHTML = calculateMarginBadge(p, c);
      updateProductCardLivePreview();
    }

    if (singlePrice) singlePrice.oninput = updateSingleMargin;
    if (singleCost) singleCost.oninput = updateSingleMargin;

    // Kustomisasi Label Input pada Setiap Variasi
    document.querySelectorAll('.input-variation-label').forEach(inp => {
      inp.oninput = (e) => {
        const val = e.target.value.trim();
        const labelKey = inp.getAttribute('data-label-key');
        if (!primaryState.variation_labels) primaryState.variation_labels = {};
        if (labelKey) primaryState.variation_labels[labelKey] = val;
        // Update header pada tabel kombinasi bawah jika label berubah
        const comboSection = document.getElementById('combination-matrix-section');
        if (comboSection) {
          const comboVar1Th = comboSection.querySelector('th:first-child');
          if (comboVar1Th && labelKey === 'label_tier_1') comboVar1Th.textContent = val || 'Variasi 1';
        }
        updateProductCardLivePreview();
      };
    });

    // =====================================================================
    // RANTAI AKTIVASI & PENONAKTIFAN BERJENJANG (VARIASI 2, 3, 4 + LAYANAN EKSTRA)
    // =====================================================================

    // Pemicu Variasi 2
    const btnTriggerVar2 = document.getElementById('btn-trigger-variasi-2');
    if (btnTriggerVar2) {
      btnTriggerVar2.onclick = () => {
        const var1HasOption = materialsState.some(m => m.name && m.name.trim() !== '');
        if (!var1HasOption) {
          alert('Isi minimal 1 nama opsi pada Variasi 1 sebelum menambahkan Variasi 2.');
          return;
        }
        primaryState.has_variation_2 = true;
        primaryState.has_layer_2 = true;
        if (!finishingsState.main || finishingsState.main.length < 2) {
          finishingsState.main = [
            { id: DB.generateUUID(), tier: 'main', name: '', description: '', price: '', cost_price: '', stock: '', parent_id: '' },
            { id: DB.generateUUID(), tier: 'main', name: '', description: '', price: '', cost_price: '', stock: '', parent_id: '' }
          ];
        }
        const container = document.getElementById('pricing-model-interactive-container');
        if (container) container.innerHTML = renderPricingModelSection();
        bindStep2InteractiveEvents();
        updateProductCardLivePreview();
        if (window.lucide) window.lucide.createIcons();
      };
    }

    // Tutup Variasi 2 (Cascade nonaktifkan 3 & 4)
    const btnCloseVar2 = document.getElementById('btn-close-variasi-2');
    if (btnCloseVar2) {
      btnCloseVar2.onclick = () => {
        primaryState.has_variation_2 = false;
        primaryState.has_layer_2 = false;
        finishingsState.main = [];
        primaryState.has_variation_3 = false;
        primaryState.has_layer_3 = false;
        finishingsState.extra_1 = [];
        primaryState.has_variation_4 = false;
        primaryState.has_layer_4 = false;
        finishingsState.extra_2 = [];

        const container = document.getElementById('pricing-model-interactive-container');
        if (container) container.innerHTML = renderPricingModelSection();
        bindStep2InteractiveEvents();
        updateProductCardLivePreview();
        if (window.lucide) window.lucide.createIcons();
      };
    }

    // Pemicu Variasi 3
    const btnTriggerVar3 = document.getElementById('btn-trigger-variasi-3');
    if (btnTriggerVar3) {
      btnTriggerVar3.onclick = () => {
        primaryState.has_variation_3 = true;
        primaryState.has_layer_3 = true;
        if (!finishingsState.extra_1 || finishingsState.extra_1.length < 2) {
          finishingsState.extra_1 = [
            { id: DB.generateUUID(), tier: 'extra_1', name: '', description: '', price: '', cost_price: '', stock: '', parent_id: '' },
            { id: DB.generateUUID(), tier: 'extra_1', name: '', description: '', price: '', cost_price: '', stock: '', parent_id: '' }
          ];
        }
        const container = document.getElementById('pricing-model-interactive-container');
        if (container) container.innerHTML = renderPricingModelSection();
        bindStep2InteractiveEvents();
        updateProductCardLivePreview();
        if (window.lucide) window.lucide.createIcons();
      };
    }

    // Tutup Variasi 3 (Cascade nonaktifkan 4)
    const btnCloseVar3 = document.getElementById('btn-close-variasi-3');
    if (btnCloseVar3) {
      btnCloseVar3.onclick = () => {
        primaryState.has_variation_3 = false;
        primaryState.has_layer_3 = false;
        finishingsState.extra_1 = [];
        primaryState.has_variation_4 = false;
        primaryState.has_layer_4 = false;
        finishingsState.extra_2 = [];

        const container = document.getElementById('pricing-model-interactive-container');
        if (container) container.innerHTML = renderPricingModelSection();
        bindStep2InteractiveEvents();
        updateProductCardLivePreview();
        if (window.lucide) window.lucide.createIcons();
      };
    }

    // Pemicu Variasi 4
    const btnTriggerVar4 = document.getElementById('btn-trigger-variasi-4');
    if (btnTriggerVar4) {
      btnTriggerVar4.onclick = () => {
        primaryState.has_variation_4 = true;
        primaryState.has_layer_4 = true;
        if (!finishingsState.extra_2 || finishingsState.extra_2.length < 2) {
          finishingsState.extra_2 = [
            { id: DB.generateUUID(), tier: 'extra_2', name: '', description: '', price: '', cost_price: '', stock: '', parent_id: '' },
            { id: DB.generateUUID(), tier: 'extra_2', name: '', description: '', price: '', cost_price: '', stock: '', parent_id: '' }
          ];
        }
        const container = document.getElementById('pricing-model-interactive-container');
        if (container) container.innerHTML = renderPricingModelSection();
        bindStep2InteractiveEvents();
        updateProductCardLivePreview();
        if (window.lucide) window.lucide.createIcons();
      };
    }

    // Tutup Variasi 4
    const btnCloseVar4 = document.getElementById('btn-close-variasi-4');
    if (btnCloseVar4) {
      btnCloseVar4.onclick = () => {
        primaryState.has_variation_4 = false;
        primaryState.has_layer_4 = false;
        finishingsState.extra_2 = [];

        const container = document.getElementById('pricing-model-interactive-container');
        if (container) container.innerHTML = renderPricingModelSection();
        bindStep2InteractiveEvents();
        updateProductCardLivePreview();
        if (window.lucide) window.lucide.createIcons();
      };
    }

    // Pemicu Layanan Extras (Berlaku untuk Mode Variasi maupun Mode Normal / Produk Tunggal)
    const triggerExtraBtns = document.querySelectorAll('#btn-trigger-extra-service, #btn-trigger-extra-service-normal, .btn-trigger-extra-action');
    triggerExtraBtns.forEach(btn => {
      btn.onclick = () => {
        primaryState.has_extra_service = true;
        primaryState.has_layer_5 = true;
        if (!finishingsState.extra_3 || finishingsState.extra_3.length < 2) {
          finishingsState.extra_3 = [
            { id: DB.generateUUID(), tier: 'extra_3', name: '', description: '', price: '', cost_price: '', stock: '', extra_type: '' },
            { id: DB.generateUUID(), tier: 'extra_3', name: '', description: '', price: '', cost_price: '', stock: '', extra_type: '' }
          ];
        }
        const container = document.getElementById('pricing-model-interactive-container');
        if (container) container.innerHTML = renderPricingModelSection();
        bindStep2InteractiveEvents();
        updateProductCardLivePreview();
        if (window.lucide) window.lucide.createIcons();
      };
    });

    // Tutup Layanan Extras
    const btnCloseExtra = document.getElementById('btn-close-extra-service');
    if (btnCloseExtra) {
      btnCloseExtra.onclick = () => {
        primaryState.has_extra_service = false;
        primaryState.has_layer_5 = false;
        finishingsState.extra_3 = [];

        const container = document.getElementById('pricing-model-interactive-container');
        if (container) container.innerHTML = renderPricingModelSection();
        bindStep2InteractiveEvents();
        updateProductCardLivePreview();
        if (window.lucide) window.lucide.createIcons();
      };
    }

    // =====================================================================
    // KETENTUAN TAMBAHAN (GLOBAL TOGGLES PER KARTU)
    // =====================================================================
    function bindKetentuanTambahan() {
      // 1. Semua Harga Jual Sama (Flashback Restore)
      document.querySelectorAll('.toggle-same-price').forEach(chk => {
        chk.onchange = (e) => {
          const tier = e.target.getAttribute('data-tier');
          if (!primaryState.same_price_tiers) primaryState.same_price_tiers = {};
          const isChecked = e.target.checked;
          primaryState.same_price_tiers[tier] = isChecked;
          const list = tier === 'tier1' ? materialsState : finishingsState[tier];
          if (list && list.length > 0) {
            if (isChecked) {
              list.forEach(item => {
                item._prev_price = (item.price !== undefined && item.price !== null) ? item.price : '';
              });
              const firstVal = list[0]?.price ?? '';
              list.forEach((item, idx) => {
                if (idx > 0) item.price = firstVal;
              });
            } else {
              list.forEach(item => {
                if (item._prev_price !== undefined) {
                  item.price = item._prev_price;
                }
              });
            }
          }
          const container = document.getElementById(tier === 'tier1' ? 'materials-rows-container' : `finishings-${tier}-rows-container`);
          if (container) {
            container.innerHTML = tier === 'tier1' ? renderMaterialsRows(false) : renderFinishingRows(tier);
            if (tier === 'tier1') bindMaterialRowEvents(); else bindFinishingTierRows(tier);
          }
          updateProductCardLivePreview();
        };
      });

      // 2. Semua Modal/Hpp Sama (Flashback Restore)
      document.querySelectorAll('.toggle-same-cost').forEach(chk => {
        chk.onchange = (e) => {
          const tier = e.target.getAttribute('data-tier');
          if (!primaryState.same_cost_tiers) primaryState.same_cost_tiers = {};
          const isChecked = e.target.checked;
          primaryState.same_cost_tiers[tier] = isChecked;
          const list = tier === 'tier1' ? materialsState : finishingsState[tier];
          if (list && list.length > 0) {
            if (isChecked) {
              list.forEach(item => {
                item._prev_cost_price = (item.cost_price !== undefined && item.cost_price !== null) ? item.cost_price : '';
              });
              const firstVal = list[0]?.cost_price ?? '';
              list.forEach((item, idx) => {
                if (idx > 0) item.cost_price = firstVal;
              });
            } else {
              list.forEach(item => {
                if (item._prev_cost_price !== undefined) {
                  item.cost_price = item._prev_cost_price;
                }
              });
            }
          }
          const container = document.getElementById(tier === 'tier1' ? 'materials-rows-container' : `finishings-${tier}-rows-container`);
          if (container) {
            container.innerHTML = tier === 'tier1' ? renderMaterialsRows(false) : renderFinishingRows(tier);
            if (tier === 'tier1') bindMaterialRowEvents(); else bindFinishingTierRows(tier);
          }
          updateProductCardLivePreview();
        };
      });

      // 3. Radio Stock Mode (Unlimited vs Same vs Uncheck & Flashback Restore)
      document.querySelectorAll('.radio-stock-mode').forEach(rad => {
        rad.onclick = (e) => {
          const tier = rad.getAttribute('data-tier');
          const val = rad.value;
          if (!primaryState.stock_mode_tiers) primaryState.stock_mode_tiers = {};
          const currentMode = primaryState.stock_mode_tiers[tier] || '';
          const list = tier === 'tier1' ? materialsState : finishingsState[tier];

          if (currentMode === val) {
            // Uncheck: kembali ke kondisi normal (tanpa ketentuan stock global)
            rad.checked = false;
            primaryState.stock_mode_tiers[tier] = '';
            if (list) {
              list.forEach(item => {
                if (item._prev_stock !== undefined) {
                  item.stock = item._prev_stock;
                }
              });
            }
          } else {
            // Mode baru aktif: simpan snapshot stock jika belum ada
            if (!currentMode && list) {
              list.forEach(item => {
                if (item._prev_stock === undefined) {
                  item._prev_stock = (item.stock !== undefined && item.stock !== null) ? item.stock : '';
                }
              });
            }
            primaryState.stock_mode_tiers[tier] = val;
            if (val === 'same' && list && list.length > 0) {
              const firstVal = list[0]?.stock ?? '';
              list.forEach((item, idx) => {
                if (idx > 0) item.stock = firstVal;
              });
            } else if (val === 'unlimited' && list) {
              list.forEach(item => { item.stock = null; });
            }
          }

          const container = document.getElementById(tier === 'tier1' ? 'materials-rows-container' : `finishings-${tier}-rows-container`);
          if (container) {
            container.innerHTML = tier === 'tier1' ? renderMaterialsRows(false) : renderFinishingRows(tier);
            if (tier === 'tier1') bindMaterialRowEvents(); else bindFinishingTierRows(tier);
          }
          updateProductCardLivePreview();
        };
      });
    }
    bindKetentuanTambahan();

    // =====================================================================
    // EVENT BARIS VARIASI 1 (STRIP ROW + AUTO-APPEND + REAL-TIME NAME SYNC)
    // =====================================================================
    function bindMaterialRowEvents() {
      const container = document.getElementById('materials-rows-container');
      if (!container) return;

      // Hapus Opsi (Proteksi minimal 1 opsi)
      container.querySelectorAll('.btn-delete-mat').forEach(btn => {
        btn.onclick = (e) => {
          if (materialsState.length <= 1) return;
          const row = e.target.closest('.variation-option-row');
          if (!row) return;
          const id = row.getAttribute('data-id');
          materialsState = materialsState.filter(m => m.id !== id);
          container.innerHTML = renderMaterialsRows(false);
          bindMaterialRowEvents();
          refreshCombinationMatrixTable();
          updateProductCardLivePreview();
        };
      });

      // Geser / Drag & Drop dan Tukar Urutan Baris Variasi 1
      let draggedMatIdx = null;
      container.querySelectorAll('.variation-option-row').forEach(row => {
        row.setAttribute('draggable', 'true');
        row.ondragstart = (e) => {
          draggedMatIdx = parseInt(row.getAttribute('data-idx'));
          e.dataTransfer.effectAllowed = 'move';
          row.classList.add('opacity-50');
        };
        row.ondragend = () => {
          row.classList.remove('opacity-50');
          container.querySelectorAll('.variation-option-row').forEach(r => r.classList.remove('ring-2', 'ring-emerald-500'));
        };
        row.ondragover = (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          row.classList.add('ring-2', 'ring-emerald-500');
        };
        row.ondragleave = () => {
          row.classList.remove('ring-2', 'ring-emerald-500');
        };
        row.ondrop = (e) => {
          e.preventDefault();
          const targetIdx = parseInt(row.getAttribute('data-idx'));
          if (draggedMatIdx !== null && !isNaN(targetIdx) && draggedMatIdx !== targetIdx) {
            const item = materialsState.splice(draggedMatIdx, 1)[0];
            materialsState.splice(targetIdx, 0, item);
            container.innerHTML = renderMaterialsRows(false);
            bindMaterialRowEvents();
            refreshCombinationMatrixTable();
            updateProductCardLivePreview();
          }
        };
      });

      // Klik Tombol Geser (bi-arrows-move) untuk Tukar Urutan (Fallback Mobile)
      container.querySelectorAll('.btn-move-mat').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.getAttribute('data-idx'));
          if (isNaN(idx) || materialsState.length <= 1) return;
          const targetIdx = idx === materialsState.length - 1 ? idx - 1 : idx + 1;
          const temp = materialsState[idx];
          materialsState[idx] = materialsState[targetIdx];
          materialsState[targetIdx] = temp;
          container.innerHTML = renderMaterialsRows(false);
          bindMaterialRowEvents();
          refreshCombinationMatrixTable();
          updateProductCardLivePreview();
        };
      });

      // Input Per Baris (Auto-Append, Real-time propagation, & Sync to Combo Table)
      container.querySelectorAll('.mat-input').forEach(inp => {
        inp.oninput = (e) => {
          const row = e.target.closest('.variation-option-row');
          if (!row) return;
          const id = row.getAttribute('data-id');
          const field = e.target.getAttribute('data-field');
          const idx = parseInt(row.getAttribute('data-idx'));
          const item = materialsState.find(m => m.id === id);

          if (item) {
            if (field === 'price') {
              item.price = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);
              item._prev_price = item.price;
            } else if (field === 'cost_price') {
              item.cost_price = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);
              item._prev_cost_price = item.cost_price;
            } else if (field === 'stock') {
              item.stock = e.target.value === '' ? '' : (parseInt(e.target.value) || 0);
              item._prev_stock = item.stock;
            } else {
              item[field] = e.target.value;
            }
          }

          // Sinkronisasi Nama Real-Time ke Tabel Kombinasi di Bagian Bawah
          if (field === 'name') {
            const comboLabel = document.querySelector(`.combo-var1-label[data-id="${id}"]`);
            if (comboLabel) {
              comboLabel.textContent = e.target.value || `Opsi ${idx + 1}`;
            }
            // Update status tombol Tambah Variasi 2 jika nama mulai terisi
            const btnVar2 = document.getElementById('btn-trigger-variasi-2');
            if (btnVar2) {
              const hasAny = materialsState.some(m => m.name && m.name.trim() !== '');
              if (hasAny) {
                btnVar2.classList.remove('opacity-50', 'cursor-not-allowed');
                btnVar2.title = 'Tambah Variasi 2';
              }
            }
          }

          // Ketentuan Tambahan Real-Time Propagation dari Baris 0
          if (idx === 0) {
            if (field === 'price' && primaryState.same_price_tiers?.tier1) {
              const val = item.price;
              materialsState.forEach((m, mIdx) => { if (mIdx > 0) m.price = val; });
              container.querySelectorAll('.variation-option-row:not([data-idx="0"]) input[data-field="price"]').forEach(pi => { pi.value = val; });
            } else if (field === 'cost_price' && primaryState.same_cost_tiers?.tier1) {
              const val = item.cost_price;
              materialsState.forEach((m, mIdx) => { if (mIdx > 0) m.cost_price = val; });
              container.querySelectorAll('.variation-option-row:not([data-idx="0"]) input[data-field="cost_price"]').forEach(ci => { ci.value = val; });
            } else if (field === 'stock' && primaryState.stock_mode_tiers?.tier1 === 'same') {
              const val = item.stock;
              materialsState.forEach((m, mIdx) => { if (mIdx > 0) m.stock = val; });
              container.querySelectorAll('.variation-option-row:not([data-idx="0"]) input[data-field="stock"]').forEach(si => { si.value = val; });
            }
          }

          // Auto-Append Baris Baru jika Mengetik di Baris Paling Terakhir
          if (idx === materialsState.length - 1 && e.target.value.trim() !== '') {
            const newMat = {
              id: DB.generateUUID(),
              name: '',
              description: '',
              price: primaryState.same_price_tiers?.tier1 ? (materialsState[0]?.price ?? '') : '',
              cost_price: primaryState.same_cost_tiers?.tier1 ? (materialsState[0]?.cost_price ?? '') : '',
              stock: primaryState.stock_mode_tiers?.tier1 === 'unlimited' ? null : (primaryState.stock_mode_tiers?.tier1 === 'same' ? (materialsState[0]?.stock ?? '') : ''),
              image_url: '',
              step_multiplier: 1
            };
            materialsState.push(newMat);
            // Append row baru tanpa menghancurkan focus input saat ini
            container.innerHTML = renderMaterialsRows(false);
            bindMaterialRowEvents();
            refreshCombinationMatrixTable();
            // Restore focus ke input yang sedang diketik
            const activeInp = container.querySelector(`.variation-option-row[data-id="${id}"] input[data-field="${field}"]`);
            if (activeInp) {
              activeInp.focus();
              const valLen = activeInp.value.length;
              activeInp.setSelectionRange(valLen, valLen);
            }
          }

          updateProductCardLivePreview();
        };
      });
    }
    bindMaterialRowEvents();

    // =====================================================================
    // EVENT BARIS PENDUKUNG (VARIASI 2, 3, 4 + LAYANAN EXTRAS)
    // =====================================================================
    function bindFinishingTierRows(tier) {
      const container = document.getElementById(`finishings-${tier}-rows-container`);
      if (!container) return;

      const list = finishingsState[tier];
      if (!list) return;

      // Hapus Opsi (Proteksi minimal 1 opsi)
      container.querySelectorAll('.btn-delete-fin').forEach(btn => {
        btn.onclick = (e) => {
          if ((finishingsState[tier] || []).length <= 1) return;
          const row = e.target.closest('.variation-option-row');
          if (!row) return;
          const id = row.getAttribute('data-id');
          finishingsState[tier] = finishingsState[tier].filter(f => f.id !== id);
          container.innerHTML = renderFinishingRows(tier);
          bindFinishingTierRows(tier);
          updateProductCardLivePreview();
        };
      });

      // Geser / Drag & Drop dan Tukar Urutan Baris Finishing / Extras
      let draggedFinIdx = null;
      container.querySelectorAll('.variation-option-row').forEach(row => {
        row.setAttribute('draggable', 'true');
        row.ondragstart = (e) => {
          draggedFinIdx = parseInt(row.getAttribute('data-idx'));
          e.dataTransfer.effectAllowed = 'move';
          row.classList.add('opacity-50');
        };
        row.ondragend = () => {
          row.classList.remove('opacity-50');
          container.querySelectorAll('.variation-option-row').forEach(r => r.classList.remove('ring-2', 'ring-emerald-500'));
        };
        row.ondragover = (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          row.classList.add('ring-2', 'ring-emerald-500');
        };
        row.ondragleave = () => {
          row.classList.remove('ring-2', 'ring-emerald-500');
        };
        row.ondrop = (e) => {
          e.preventDefault();
          const targetIdx = parseInt(row.getAttribute('data-idx'));
          const currentList = finishingsState[tier];
          if (currentList && draggedFinIdx !== null && !isNaN(targetIdx) && draggedFinIdx !== targetIdx) {
            const item = currentList.splice(draggedFinIdx, 1)[0];
            currentList.splice(targetIdx, 0, item);
            container.innerHTML = renderFinishingRows(tier);
            bindFinishingTierRows(tier);
            updateProductCardLivePreview();
          }
        };
      });

      // Klik Tombol Geser (bi-arrows-move) untuk Tukar Urutan (Fallback Mobile)
      container.querySelectorAll('.btn-move-fin').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.getAttribute('data-idx'));
          const currentList = finishingsState[tier];
          if (!currentList || currentList.length <= 1 || isNaN(idx)) return;
          const targetIdx = idx === currentList.length - 1 ? idx - 1 : idx + 1;
          const temp = currentList[idx];
          currentList[idx] = currentList[targetIdx];
          currentList[targetIdx] = temp;
          container.innerHTML = renderFinishingRows(tier);
          bindFinishingTierRows(tier);
          updateProductCardLivePreview();
        };
      });

      // Upload Gambar untuk Layanan Extras
      if (tier === 'extra_3') {
        container.querySelectorAll('.extra-file-input').forEach(fileInp => {
          fileInp.onchange = async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const id = fileInp.getAttribute('data-id');
            try {
              const base64 = await compressProductImage(file, 800, 800, 0.8);
              const item = (finishingsState.extra_3 || []).find(f => f.id === id);
              if (item) item.image_url = base64;
              container.innerHTML = renderFinishingRows('extra_3');
              bindFinishingTierRows('extra_3');
              updateProductCardLivePreview();
            } catch (err) {
              console.warn('Gagal memproses foto layanan ekstra:', err);
            }
          };
        });
      }

      // Input Per Baris (Auto-Append & Ketentuan Tambahan Real-Time)
      container.querySelectorAll('.fin-input').forEach(inp => {
        inp.onchange = inp.oninput = (e) => {
          const row = e.target.closest('.variation-option-row');
          if (!row) return;
          const id = row.getAttribute('data-id');
          const field = e.target.getAttribute('data-field');
          const idx = parseInt(row.getAttribute('data-idx'));
          const currentList = finishingsState[tier];
          const item = (currentList || []).find(f => f.id === id);

          if (item) {
            if (field === 'price') {
              item.price = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);
              item._prev_price = item.price;
            } else if (field === 'cost_price') {
              item.cost_price = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);
              item._prev_cost_price = item.cost_price;
            } else if (field === 'stock') {
              item.stock = e.target.value === '' ? '' : (parseInt(e.target.value) || 0);
              item._prev_stock = item.stock;
            } else {
              item[field] = e.target.value;
            }
          }

          // Ketentuan Tambahan Propagation dari Baris 0
          if (idx === 0) {
            if (field === 'price' && primaryState.same_price_tiers?.[tier]) {
              const val = item.price;
              currentList.forEach((f, fIdx) => { if (fIdx > 0) f.price = val; });
              container.querySelectorAll('.variation-option-row:not([data-idx="0"]) input[data-field="price"]').forEach(pi => { pi.value = val; });
            } else if (field === 'cost_price' && primaryState.same_cost_tiers?.[tier]) {
              const val = item.cost_price;
              currentList.forEach((f, fIdx) => { if (fIdx > 0) f.cost_price = val; });
              container.querySelectorAll('.variation-option-row:not([data-idx="0"]) input[data-field="cost_price"]').forEach(ci => { ci.value = val; });
            } else if (field === 'stock' && primaryState.stock_mode_tiers?.[tier] === 'same') {
              const val = item.stock;
              currentList.forEach((f, fIdx) => { if (fIdx > 0) f.stock = val; });
              container.querySelectorAll('.variation-option-row:not([data-idx="0"]) input[data-field="stock"]').forEach(si => { si.value = val; });
            }
          }

          // Auto-Append Baris Baru jika Mengetik di Baris Paling Terakhir
          if (idx === currentList.length - 1 && e.target.value.trim() !== '') {
            const newFin = {
              id: DB.generateUUID(),
              tier: tier,
              name: '',
              description: '',
              price: primaryState.same_price_tiers?.[tier] ? (currentList[0]?.price ?? '') : '',
              cost_price: primaryState.same_cost_tiers?.[tier] ? (currentList[0]?.cost_price ?? '') : '',
              stock: primaryState.stock_mode_tiers?.[tier] === 'unlimited' ? null : (primaryState.stock_mode_tiers?.[tier] === 'same' ? (currentList[0]?.stock ?? '') : ''),
              extra_type: tier === 'extra_3' ? '' : undefined,
              parent_id: ''
            };
            currentList.push(newFin);
            container.innerHTML = renderFinishingRows(tier);
            bindFinishingTierRows(tier);
            // Restore focus
            const activeInp = container.querySelector(`.variation-option-row[data-id="${id}"] [data-field="${field}"]`);
            if (activeInp) {
              activeInp.focus();
              const valLen = activeInp.value.length;
              if (activeInp.setSelectionRange) activeInp.setSelectionRange(valLen, valLen);
            }
          }

          updateProductCardLivePreview();
        };
      });
    }

    ['main', 'extra_1', 'extra_2', 'extra_3'].forEach(tier => {
      bindFinishingTierRows(tier);
    });

    // =====================================================================
    // TABEL MATRIKS KOMBINASI BAWAH & MODAL GROSIR / KELIPATAN
    // =====================================================================
    function refreshCombinationMatrixTable() {
      const section = document.getElementById('combination-matrix-section');
      if (section) {
        section.outerHTML = renderCombinationMatrixTable();
        bindCombinationMatrixEvents();
      }
    }

    function bindCombinationMatrixEvents() {
      // 1. Upload Foto Variasi 1 dari Tabel Kombinasi
      document.querySelectorAll('.combo-var1-file-input').forEach(fileInp => {
        fileInp.onchange = async (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          const id = fileInp.getAttribute('data-id');
          try {
            const base64 = await compressProductImage(file, 800, 800, 0.8);
            const item = materialsState.find(m => m.id === id);
            if (item) item.image_url = base64;
            refreshCombinationMatrixTable();
            updateProductCardLivePreview();
          } catch (err) {
            console.warn('Gagal memproses gambar:', err);
          }
        };
      });

      // 2. Min. Order per Baris
      document.querySelectorAll('.combo-min-order-input').forEach(inp => {
        inp.oninput = (e) => {
          const matId = inp.getAttribute('data-mat-id');
          const item = materialsState.find(m => m.id === matId);
          if (item) item.min_order = Math.max(1, parseInt(e.target.value) || 1);
        };
      });

      // 3. Max. Order per Baris (Combobox: Mendukung 'Tanpa Max Order' / Angka)
      document.querySelectorAll('.combo-max-order-input').forEach(inp => {
        inp.oninput = (e) => {
          const matId = inp.getAttribute('data-mat-id');
          const item = materialsState.find(m => m.id === matId);
          if (item) {
            const raw = e.target.value.trim();
            if (!raw || raw.toLowerCase() === 'tanpa max order' || raw === '0' || raw.toLowerCase() === 'unlimited') {
              item.max_order = null;
            } else {
              item.max_order = parseInt(raw) || null;
            }
          }
        };
        inp.onblur = (e) => {
          const matId = inp.getAttribute('data-mat-id');
          const item = materialsState.find(m => m.id === matId);
          if (item && (!item.max_order || item.max_order === 0)) {
            inp.value = 'Tanpa Max Order';
          }
        };
      });

      // 4. Dropdown Scope (Umum vs Spesifik)
      document.querySelectorAll('.combo-scope-select').forEach(sel => {
        sel.onchange = (e) => {
          const tier = sel.getAttribute('data-tier');
          const matId = sel.getAttribute('data-mat-id');
          if (!primaryState.variation_scopes) primaryState.variation_scopes = {};
          primaryState.variation_scopes[tier] = e.target.value;
          refreshCombinationMatrixTable();
        };
      });

      // 5. Header Checkbox: Harga Grosir
      const chkWholesale = document.getElementById('chk-combo-header-wholesale');
      if (chkWholesale) {
        chkWholesale.onchange = (e) => {
          primaryState.has_wholesale = e.target.checked;
          if (primaryState.has_wholesale && (!primaryState.wholesale_tiers || primaryState.wholesale_tiers.length === 0)) {
            primaryState.wholesale_tiers = [{ id: DB.generateUUID(), min_qty: 10, max_qty: 50, price: 500 }];
          }
          refreshCombinationMatrixTable();
        };
      }

      // 6. Header Checkbox: Kelipatan Order
      const chkMultiple = document.getElementById('chk-combo-header-order-multiple');
      if (chkMultiple) {
        chkMultiple.onchange = (e) => {
          primaryState.has_order_multiple = e.target.checked;
          if (primaryState.has_order_multiple && !primaryState.order_multiple_value) {
            primaryState.order_multiple_value = 1;
          }
          refreshCombinationMatrixTable();
        };
      }

      // 7. Tombol Buka Modal Harga Grosir
      document.querySelectorAll('.btn-open-wholesale-modal').forEach(btn => {
        btn.onclick = () => {
          const modal = document.getElementById('modal-wholesale-config');
          if (modal) {
            modal.classList.remove('hidden');
            bindWholesaleModalEvents();
          }
        };
      });

      // 8. Tombol Buka Modal Kelipatan Order
      document.querySelectorAll('.btn-open-multiple-modal').forEach(btn => {
        btn.onclick = () => {
          const modal = document.getElementById('modal-order-multiple-config');
          if (modal) {
            modal.classList.remove('hidden');
            bindMultipleModalEvents();
          }
        };
      });

      // 9. Tombol Buka Modal Spesifik Options
      document.querySelectorAll('.btn-open-specific-modal').forEach(btn => {
        btn.onclick = () => {
          const tier = btn.getAttribute('data-tier');
          const matId = btn.getAttribute('data-mat-id');
          const matName = btn.getAttribute('data-mat-name');
          openSpecificOptionsModal(tier, matId, matName);
        };
      });
    }
    bindCombinationMatrixEvents();

    // =====================================================================
    // LOGIKA MODAL HARGA GROSIR (MODE NORMAL VS BERTINGKAT)
    // =====================================================================
    function bindWholesaleModalEvents() {
      const modal = document.getElementById('modal-wholesale-config');
      if (!modal) return;

      // Radio Mode Grosir (Normal vs Bertingkat)
      modal.querySelectorAll('input[name="modal_wholesale_mode"]').forEach(rad => {
        rad.onchange = (e) => {
          primaryState.wholesale_mode = e.target.value;
          const body = document.getElementById('modal-wholesale-body');
          if (body) {
            body.innerHTML = renderWholesaleTable();
            bindWholesaleModalEvents();
          }
        };
      });

      // Mode Normal: Input & Checkbox Tanpa Max
      const inpMin = document.getElementById('modal-wholesale-normal-min');
      const inpMax = document.getElementById('modal-wholesale-normal-max');
      const inpDisc = document.getElementById('modal-wholesale-normal-discount');
      const chkNoMax = document.getElementById('chk-wholesale-no-max');
      const noteNormal = document.getElementById('wholesale-normal-note');

      function updateNormalFormulaNote() {
        const minVal = parseInt(inpMin?.value) || 1;
        const noMax = chkNoMax?.checked;
        const maxVal = noMax ? '' : (parseInt(inpMax?.value) || minVal);
        const discVal = parseFloat(inpDisc?.value) || 0;

        if (noteNormal) {
          noteNormal.innerHTML = `Setiap pembelian <b>${minVal}</b> hingga <b>${noMax ? 'seterusnya (tanpa batas)' : maxVal}</b> maka mendapatkan potongan <b>Rp${discVal.toLocaleString('id-ID')}</b> per pcs.`;
        }
      }

      if (chkNoMax && inpMax) {
        chkNoMax.onchange = (e) => {
          inpMax.disabled = e.target.checked;
          if (e.target.checked) {
            inpMax.classList.add('bg-slate-100', 'text-slate-400', 'cursor-not-allowed');
            inpMax.value = '';
          } else {
            inpMax.classList.remove('bg-slate-100', 'text-slate-400', 'cursor-not-allowed');
          }
          updateNormalFormulaNote();
        };
      }

      if (inpMin) inpMin.oninput = updateNormalFormulaNote;
      if (inpMax) inpMax.oninput = updateNormalFormulaNote;
      if (inpDisc) inpDisc.oninput = updateNormalFormulaNote;

      // Mode Bertingkat: Tambah Tier Baru (Min Order 2 Terkunci = Max Order 1 + 1)
      const btnAddTier = document.getElementById('btn-add-wholesale-tier');
      if (btnAddTier) {
        btnAddTier.onclick = () => {
          if (!primaryState.wholesale_tiers) primaryState.wholesale_tiers = [];
          const lastTier = primaryState.wholesale_tiers[primaryState.wholesale_tiers.length - 1];
          const lastMax = (lastTier && lastTier.max_qty) ? parseInt(lastTier.max_qty) : 50;
          const newMin = lastMax + 1;
          const newMax = newMin + 50;
          const newPrice = (lastTier && lastTier.price) ? lastTier.price + 500 : 1000;

          primaryState.wholesale_tiers.push({
            id: DB.generateUUID(),
            min_qty: newMin,
            max_qty: newMax,
            price: newPrice
          });

          const body = document.getElementById('modal-wholesale-body');
          if (body) {
            body.innerHTML = renderWholesaleTable();
            bindWholesaleModalEvents();
          }
        };
      }

      // Mode Bertingkat: Hapus Tier
      modal.querySelectorAll('.btn-delete-wholesale-tier').forEach(btn => {
        btn.onclick = () => {
          if ((primaryState.wholesale_tiers || []).length <= 1) return;
          const tierId = btn.getAttribute('data-tier-id');
          primaryState.wholesale_tiers = primaryState.wholesale_tiers.filter(t => t.id !== tierId);
          const body = document.getElementById('modal-wholesale-body');
          if (body) {
            body.innerHTML = renderWholesaleTable();
            bindWholesaleModalEvents();
          }
        };
      });

      // Mode Bertingkat: Input Max Order auto update baris berikutnya
      modal.querySelectorAll('.tiered-max-input').forEach(inp => {
        inp.oninput = (e) => {
          const row = e.target.closest('tr');
          const idx = parseInt(row?.getAttribute('data-idx'));
          const maxVal = parseInt(e.target.value) || 0;
          if (primaryState.wholesale_tiers && primaryState.wholesale_tiers[idx]) {
            primaryState.wholesale_tiers[idx].max_qty = maxVal;
            // Kunci baris berikutnya: min_qty = maxVal + 1
            if (primaryState.wholesale_tiers[idx + 1]) {
              primaryState.wholesale_tiers[idx + 1].min_qty = maxVal + 1;
              const nextRow = modal.querySelector(`tr[data-idx="${idx + 1}"] input[data-field="min_qty"]`);
              if (nextRow) nextRow.value = maxVal + 1;
            }
          }
        };
      });

      // Tombol Simpan Pengaturan Grosir
      const btnSaveWholesale = document.getElementById('btn-save-wholesale-modal');
      if (btnSaveWholesale) {
        btnSaveWholesale.onclick = () => {
          if (primaryState.wholesale_mode === 'normal') {
            const minV = parseInt(inpMin?.value) || 1;
            const maxV = chkNoMax?.checked ? null : (parseInt(inpMax?.value) || null);
            const discV = parseFloat(inpDisc?.value) || 0;
            primaryState.wholesale_tiers = [{
              id: DB.generateUUID(),
              min_qty: minV,
              max_qty: maxV,
              price: discV
            }];
          }
          modal.classList.add('hidden');
          refreshCombinationMatrixTable();
        };
      }
    }

    // =====================================================================
    // LOGIKA MODAL KELIPATAN ORDER (MODE GLOBAL VS SPESIFIK PER VARIAN)
    // =====================================================================
    function bindMultipleModalEvents() {
      const modal = document.getElementById('modal-order-multiple-config');
      if (!modal) return;

      modal.querySelectorAll('input[name="order_multiple_type_radio"]').forEach(rad => {
        rad.onchange = (e) => {
          primaryState.order_multiple_type = e.target.value;
          const body = document.getElementById('modal-order-multiple-body');
          if (body) {
            body.innerHTML = renderOrderMultipleSection();
            bindMultipleModalEvents();
          }
        };
      });

      // Tambah Baris Varian
      const btnAddRow = document.getElementById('btn-add-variant-multiple-row');
      if (btnAddRow) {
        btnAddRow.onclick = () => {
          if (!primaryState.order_multiples_by_variant) primaryState.order_multiples_by_variant = {};
          const currentChosen = Object.keys(primaryState.order_multiples_by_variant);
          const nextAvail = materialsState.find(m => !currentChosen.includes(m.id));
          if (nextAvail) {
            primaryState.order_multiples_by_variant[nextAvail.id] = 1;
          }
          const body = document.getElementById('modal-order-multiple-body');
          if (body) {
            body.innerHTML = renderOrderMultipleSection();
            bindMultipleModalEvents();
          }
        };
      }

      // Hapus Baris Varian
      modal.querySelectorAll('.btn-delete-variant-multiple').forEach(btn => {
        btn.onclick = (e) => {
          const tr = e.target.closest('tr');
          const vId = tr?.getAttribute('data-variant-id');
          if (vId && primaryState.order_multiples_by_variant) {
            delete primaryState.order_multiples_by_variant[vId];
          }
          const body = document.getElementById('modal-order-multiple-body');
          if (body) {
            body.innerHTML = renderOrderMultipleSection();
            bindMultipleModalEvents();
          }
        };
      });

      // Ganti Pilihan Varian (Deduplikasi)
      modal.querySelectorAll('.select-variant-multiple-id').forEach(sel => {
        sel.onchange = (e) => {
          const tr = e.target.closest('tr');
          const oldId = tr?.getAttribute('data-variant-id');
          const newId = e.target.value;
          const currentVal = parseInt(tr?.querySelector('.input-variant-multiple')?.value) || 1;
          if (primaryState.order_multiples_by_variant) {
            if (oldId) delete primaryState.order_multiples_by_variant[oldId];
            primaryState.order_multiples_by_variant[newId] = currentVal;
          }
          const body = document.getElementById('modal-order-multiple-body');
          if (body) {
            body.innerHTML = renderOrderMultipleSection();
            bindMultipleModalEvents();
          }
        };
      });

      // Tombol Simpan Kelipatan
      const btnSaveMult = document.getElementById('btn-save-multiple-modal');
      if (btnSaveMult) {
        btnSaveMult.onclick = () => {
          if (primaryState.order_multiple_type === 'all') {
            const singleInp = document.getElementById('input-order-multiple-single');
            primaryState.order_multiple_value = parseInt(singleInp?.value) || 1;
          } else {
            const multiplesMap = {};
            modal.querySelectorAll('#variant-multiples-table-body tr').forEach(tr => {
              const vId = tr.querySelector('.select-variant-multiple-id')?.value;
              const val = parseInt(tr.querySelector('.input-variant-multiple')?.value) || 1;
              if (vId) multiplesMap[vId] = val;
            });
            primaryState.order_multiples_by_variant = multiplesMap;
          }
          modal.classList.add('hidden');
          refreshCombinationMatrixTable();
        };
      }
    }

    // =====================================================================
    // LOGIKA MODAL SPESIFIK OPTIONS (CHECKLIST POPOVER)
    // =====================================================================
    let currentSpecificContext = { tier: 'main', matId: null, matName: '' };

    function openSpecificOptionsModal(tier, matId, matName) {
      currentSpecificContext = { tier, matId, matName };
      const modal = document.getElementById('modal-specific-options');
      const title = document.getElementById('specific-modal-title');
      const subtitle = document.getElementById('specific-modal-subtitle');
      const container = document.getElementById('specific-options-checklist-container');
      const countEl = document.getElementById('specific-selected-count');
      const chkSelectAll = document.getElementById('chk-specific-select-all');

      if (!modal || !container) return;

      const tierLabels = {
        main: primaryState.variation_labels?.label_tier_2 || 'Variasi 2',
        extra_1: primaryState.variation_labels?.label_extra_1 || 'Variasi 3',
        extra_2: primaryState.variation_labels?.label_extra_2 || 'Variasi 4'
      };

      if (title) title.textContent = `Pilih ${tierLabels[tier] || 'Opsi Spesifik'}`;
      if (subtitle) subtitle.textContent = `Pilihan yang berlaku khusus untuk: ${matName}`;

      const optionsList = finishingsState[tier] || [];
      const currentSelected = (primaryState.specific_options_map && primaryState.specific_options_map[matId] && primaryState.specific_options_map[matId][tier]) || [];

      if (countEl) countEl.textContent = `${currentSelected.length} dipilih`;
      if (chkSelectAll) chkSelectAll.checked = optionsList.length > 0 && currentSelected.length === optionsList.length;

      container.innerHTML = optionsList.length === 0 ? `
        <div class="text-center py-4 text-slate-400 italic text-xs">Belum ada opsi pada variasi ini.</div>
      ` : optionsList.map((opt, oIdx) => {
        const isChecked = currentSelected.includes(opt.id);
        return `
          <label class="flex items-center justify-between p-2 rounded-md bg-white border border-slate-200 hover:border-emerald-500 cursor-pointer transition select-none text-xs">
            <span class="font-medium text-slate-800">${escapeHtml(opt.name || `Opsi ${oIdx + 1}`)}</span>
            <input type="checkbox" class="specific-opt-checkbox accent-emerald-600 rounded w-4 h-4 cursor-pointer" data-opt-id="${opt.id}" ${isChecked ? 'checked' : ''} />
          </label>
        `;
      }).join('');

      // Checkbox checklist listener
      container.querySelectorAll('.specific-opt-checkbox').forEach(chk => {
        chk.onchange = () => {
          const checkedCount = container.querySelectorAll('.specific-opt-checkbox:checked').length;
          if (countEl) countEl.textContent = `${checkedCount} dipilih`;
          if (chkSelectAll) chkSelectAll.checked = checkedCount === optionsList.length;
        };
      });

      // Pilih Semua Checkbox
      if (chkSelectAll) {
        chkSelectAll.onchange = (e) => {
          container.querySelectorAll('.specific-opt-checkbox').forEach(chk => {
            chk.checked = e.target.checked;
          });
          const checkedCount = e.target.checked ? optionsList.length : 0;
          if (countEl) countEl.textContent = `${checkedCount} dipilih`;
        };
      }

      modal.classList.remove('hidden');
    }

    const btnApplySpecific = document.getElementById('btn-apply-specific-modal');
    if (btnApplySpecific) {
      btnApplySpecific.onclick = () => {
        const modal = document.getElementById('modal-specific-options');
        const container = document.getElementById('specific-options-checklist-container');
        if (!container || !modal) return;

        const checkedIds = Array.from(container.querySelectorAll('.specific-opt-checkbox:checked')).map(c => c.getAttribute('data-opt-id'));
        const { tier, matId } = currentSpecificContext;

        if (!primaryState.specific_options_map) primaryState.specific_options_map = {};
        if (!primaryState.specific_options_map[matId]) primaryState.specific_options_map[matId] = {};
        primaryState.specific_options_map[matId][tier] = checkedIds;

        modal.classList.add('hidden');
        refreshCombinationMatrixTable();
      };
    }

    // Modal Close Buttons (✕ & Batal)
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.onclick = () => {
        const modalId = btn.getAttribute('data-modal');
        const modal = document.getElementById(modalId) || btn.closest('.fixed');
        if (modal) modal.classList.add('hidden');
      };
    });

    // =====================================================================
    // STEP 2 CONTROLS LAINNYA (STOK, PENGIRIMAN, PROMO, AI)
    // =====================================================================
    // Stok Unlimited Toggle
    const unlStock = document.getElementById('toggle-unlimited-stock');
    const stockWrap = document.getElementById('stock-input-wrapper');
    if (unlStock) {
      unlStock.onchange = e => {
        primaryState.is_unlimited_stock = e.target.checked;
        if (stockWrap) stockWrap.className = primaryState.is_unlimited_stock ? 'hidden' : 'block';
        updateProductCardLivePreview();
      };
    }

    // Maksimal Pembelian (Combobox Normal Mode)
    const normalMaxInp = document.getElementById('input-normal-max-order');
    if (normalMaxInp) {
      normalMaxInp.oninput = (e) => {
        const raw = e.target.value.trim();
        if (!raw || raw.toLowerCase() === 'tanpa max order' || raw === '0' || raw.toLowerCase() === 'unlimited') {
          primaryState.max_order = null;
          primaryState.max_order_qty = null;
          primaryState.max_order_type = 'unlimited';
        } else {
          const num = parseInt(raw) || null;
          primaryState.max_order = num;
          primaryState.max_order_qty = num;
          primaryState.max_order_type = num ? 'per_order' : 'unlimited';
        }
      };
      normalMaxInp.onblur = (e) => {
        if (!primaryState.max_order || primaryState.max_order === 0) {
          normalMaxInp.value = 'Tanpa Max Order';
        }
      };
    }

    const selMaxOrderType = document.getElementById('select-max-order-type');
    if (selMaxOrderType) {
      selMaxOrderType.onchange = e => {
        primaryState.max_order_type = e.target.value;
        const wrap = document.getElementById('max-order-conditional-wrapper');
        if (wrap) wrap.innerHTML = renderMaxOrderSection();
        bindStep2InteractiveEvents();
      };
    }

    // Helper Binding Harga Grosir Interaktif (Berfungsi untuk Inline & Modal)
    function bindInlineWholesaleEvents() {
      const wholesaleWrap = document.getElementById('wholesale-table-wrapper');
      if (!wholesaleWrap) return;

      wholesaleWrap.querySelectorAll('input[name="inline_wholesale_mode"]').forEach(rad => {
        rad.onchange = (e) => {
          primaryState.wholesale_mode = e.target.value;
          const body = document.getElementById('inline-wholesale-body');
          if (body) {
            body.innerHTML = renderWholesaleTable();
            bindInlineWholesaleEvents();
          }
        };
      });

      const inpMin = wholesaleWrap.querySelector('#modal-wholesale-normal-min');
      const inpMax = wholesaleWrap.querySelector('#modal-wholesale-normal-max');
      const inpDisc = wholesaleWrap.querySelector('#modal-wholesale-normal-discount');
      const chkNoMax = wholesaleWrap.querySelector('#chk-wholesale-no-max');
      const noteNormal = wholesaleWrap.querySelector('#wholesale-normal-note');

      function syncNormalWholesale() {
        const minVal = parseInt(inpMin?.value) || 1;
        const noMax = chkNoMax?.checked;
        const maxVal = noMax ? null : (parseInt(inpMax?.value) || minVal);
        const discVal = parseFloat(inpDisc?.value) || 0;
        primaryState.wholesale_tiers = [{
          id: DB.generateUUID(),
          min_qty: minVal,
          max_qty: maxVal,
          price: discVal
        }];
        if (noteNormal) {
          noteNormal.innerHTML = `Setiap pembelian <b>${minVal}</b> hingga <b>${noMax ? 'seterusnya (tanpa batas)' : (maxVal || minVal)}</b> maka mendapatkan potongan <b>Rp${discVal.toLocaleString('id-ID')}</b> per pcs.`;
        }
      }

      if (chkNoMax && inpMax) {
        chkNoMax.onchange = (e) => {
          inpMax.disabled = e.target.checked;
          if (e.target.checked) {
            inpMax.classList.add('bg-slate-100', 'text-slate-400', 'cursor-not-allowed');
            inpMax.value = '';
          } else {
            inpMax.classList.remove('bg-slate-100', 'text-slate-400', 'cursor-not-allowed');
          }
          syncNormalWholesale();
        };
      }
      if (inpMin) inpMin.oninput = syncNormalWholesale;
      if (inpMax) inpMax.oninput = syncNormalWholesale;
      if (inpDisc) inpDisc.oninput = syncNormalWholesale;

      const btnAddTier = wholesaleWrap.querySelector('#btn-add-wholesale-tier');
      if (btnAddTier) {
        btnAddTier.onclick = () => {
          if (!primaryState.wholesale_tiers || primaryState.wholesale_tiers.length === 0) {
            primaryState.wholesale_tiers = [{ id: DB.generateUUID(), min_qty: 10, max_qty: 50, price: 500 }];
          }
          const lastTier = primaryState.wholesale_tiers[primaryState.wholesale_tiers.length - 1];
          const nextMin = (parseInt(lastTier.max_qty) || 50) + 1;
          primaryState.wholesale_tiers.push({
            id: DB.generateUUID(),
            min_qty: nextMin,
            max_qty: nextMin + 50,
            price: (lastTier.price || 500) + 500
          });
          const body = document.getElementById('inline-wholesale-body');
          if (body) {
            body.innerHTML = renderWholesaleTable();
            bindInlineWholesaleEvents();
          }
        };
      }

      wholesaleWrap.querySelectorAll('.btn-delete-wholesale-tier').forEach(btn => {
        btn.onclick = () => {
          if ((primaryState.wholesale_tiers || []).length <= 1) return;
          const tierId = btn.getAttribute('data-tier-id');
          primaryState.wholesale_tiers = primaryState.wholesale_tiers.filter(t => t.id !== tierId);
          const body = document.getElementById('inline-wholesale-body');
          if (body) {
            body.innerHTML = renderWholesaleTable();
            bindInlineWholesaleEvents();
          }
        };
      });

      wholesaleWrap.querySelectorAll('.tiered-max-input').forEach(inp => {
        inp.oninput = (e) => {
          const row = e.target.closest('tr');
          const idx = parseInt(row?.getAttribute('data-idx'));
          const maxVal = parseInt(e.target.value) || 0;
          if (primaryState.wholesale_tiers && primaryState.wholesale_tiers[idx]) {
            primaryState.wholesale_tiers[idx].max_qty = maxVal;
            if (primaryState.wholesale_tiers[idx + 1]) {
              primaryState.wholesale_tiers[idx + 1].min_qty = maxVal + 1;
              const nextRow = wholesaleWrap.querySelector(`tr[data-idx="${idx + 1}"] input[data-field="min_qty"]`);
              if (nextRow) nextRow.value = maxVal + 1;
            }
          }
        };
      });

      wholesaleWrap.querySelectorAll('.tiered-price-input').forEach(inp => {
        inp.oninput = (e) => {
          const row = e.target.closest('tr');
          const idx = parseInt(row?.getAttribute('data-idx'));
          const priceVal = parseFloat(e.target.value) || 0;
          if (primaryState.wholesale_tiers && primaryState.wholesale_tiers[idx]) {
            primaryState.wholesale_tiers[idx].price = priceVal;
          }
        };
      });
    }

    // Helper Binding Kelipatan Pesanan Interaktif (Produk Tunggal)
    function bindInlineMultipleEvents() {
      const multipleWrap = document.getElementById('order-multiple-wrapper');
      if (!multipleWrap) return;

      const singleMultipleInp = multipleWrap.querySelector('#input-order-multiple-single');
      if (singleMultipleInp) {
        singleMultipleInp.oninput = singleMultipleInp.onchange = (e) => {
          primaryState.order_multiple_value = parseInt(e.target.value) || 1;
        };
      }

      multipleWrap.querySelectorAll('input[name="order_multiple_type_radio"]').forEach(rad => {
        rad.onchange = (e) => {
          primaryState.order_multiple_type = e.target.value;
          multipleWrap.innerHTML = renderOrderMultipleSection();
          bindInlineMultipleEvents();
        };
      });
    }

    // Tombol Toggle Harga Grosir (Produk Tunggal / Mode Normal)
    const btnToggleWholesale = document.getElementById('btn-toggle-wholesale');
    const wholesaleWrap = document.getElementById('wholesale-table-wrapper');
    if (btnToggleWholesale) {
      btnToggleWholesale.onclick = () => {
        primaryState.has_wholesale = !primaryState.has_wholesale;
        if (primaryState.has_wholesale && (!primaryState.wholesale_tiers || primaryState.wholesale_tiers.length === 0)) {
          primaryState.wholesale_tiers = [{ id: DB.generateUUID(), min_qty: 10, max_qty: 50, price: 500 }];
        }
        if (wholesaleWrap) {
          wholesaleWrap.classList.toggle('hidden', !primaryState.has_wholesale);
          wholesaleWrap.classList.toggle('block', primaryState.has_wholesale);
          if (primaryState.has_wholesale) {
            wholesaleWrap.innerHTML = `
              <div class="grid grid-cols-2 gap-2 text-xs mb-3">
                <label class="p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer font-bold ${primaryState.wholesale_mode !== 'tiered' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-300 text-slate-700'}">
                  <input type="radio" name="inline_wholesale_mode" value="normal" ${primaryState.wholesale_mode !== 'tiered' ? 'checked' : ''} class="accent-emerald-600 cursor-pointer" />
                  <span>Mode Normal</span>
                </label>
                <label class="p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer font-bold ${primaryState.wholesale_mode === 'tiered' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-300 text-slate-700'}">
                  <input type="radio" name="inline_wholesale_mode" value="tiered" ${primaryState.wholesale_mode === 'tiered' ? 'checked' : ''} class="accent-emerald-600 cursor-pointer" />
                  <span>Mode Bertingkat</span>
                </label>
              </div>
              <div id="inline-wholesale-body" class="space-y-3">
                ${renderWholesaleTable()}
              </div>
            `;
            bindInlineWholesaleEvents();
          }
        }
        btnToggleWholesale.innerHTML = `
          <i class="bi ${primaryState.has_wholesale ? 'bi-check2' : 'bi-plus-lg'}"></i>
          <span>${primaryState.has_wholesale ? 'Harga Grosir Aktif' : 'Harga Grosir'}</span>
        `;
      };
    }
    if (primaryState.has_wholesale && wholesaleWrap && !wholesaleWrap.classList.contains('hidden')) {
      bindInlineWholesaleEvents();
    }

    // Tombol Toggle Kelipatan Pesanan (Produk Tunggal / Mode Normal)
    const btnToggleMultiple = document.getElementById('btn-toggle-order-multiple');
    const multipleWrap = document.getElementById('order-multiple-wrapper');
    if (btnToggleMultiple) {
      btnToggleMultiple.onclick = () => {
        primaryState.has_order_multiple = !primaryState.has_order_multiple;
        if (multipleWrap) {
          multipleWrap.classList.toggle('hidden', !primaryState.has_order_multiple);
          multipleWrap.classList.toggle('block', primaryState.has_order_multiple);
          if (primaryState.has_order_multiple) {
            multipleWrap.innerHTML = renderOrderMultipleSection();
            bindInlineMultipleEvents();
          }
        }
        btnToggleMultiple.innerHTML = `
          <i class="bi ${primaryState.has_order_multiple ? 'bi-check2' : 'bi-plus-lg'}"></i>
          <span>${primaryState.has_order_multiple ? 'Kelipatan Pesanan Aktif' : 'Kelipatan Pesanan'}</span>
        `;
      };
    }
    if (primaryState.has_order_multiple && multipleWrap && !multipleWrap.classList.contains('hidden')) {
      bindInlineMultipleEvents();
    }

    // Bind Semua Custom Comboboxes Popovers
    bindCustomComboboxes(document.getElementById('card-step2-sales'));

    // Card 3: Pengiriman
    const toggleCod = document.getElementById('toggle-is-cod');
    if (toggleCod) {
      toggleCod.onchange = (e) => {
        if (!primaryState.shipping_config) primaryState.shipping_config = {};
        primaryState.shipping_config.is_cod = e.target.checked;
      };
    }

    // Card 4: Promo Diskon
    const togglePromo = document.getElementById('toggle-monthly-discount');
    const promoArea = document.getElementById('discount-controls-area');
    if (togglePromo) {
      togglePromo.onchange = e => {
        primaryState.has_monthly_discount = e.target.checked;
        if (promoArea) promoArea.className = primaryState.has_monthly_discount ? 'block space-y-4 pt-1' : 'hidden';
        updateProductCardLivePreview();
      };
    }

    const discValInp = document.getElementById('input-discount-val');
    const discTypeSel = document.getElementById('select-monthly-discount-type');
    const autoBadge = document.getElementById('discount-auto-convert-badge');
    const autoText = document.getElementById('discount-auto-convert-text');

    function updatePromoLive() {
      const val = parseFloat(discValInp?.value) || 0;
      const type = discTypeSel?.value || 'percent';
      primaryState.discount_value = val;
      primaryState.discount_type = type;
      if (autoBadge) autoBadge.textContent = type === 'percent' ? `${val}%` : `Rp${val.toLocaleString('id-ID')}`;
      if (autoText) autoText.textContent = type === 'percent' ? `Potongan diskon ${val}% dari harga dasar` : `Potongan langsung Rp${val.toLocaleString('id-ID')}/pcs`;
      updateProductCardLivePreview();
    }

    if (discValInp) discValInp.oninput = updatePromoLive;
    if (discTypeSel) discTypeSel.onchange = updatePromoLive;

    // Card 5: AI Description
    const btnAiGen = document.getElementById('btn-ai-generate-desc');
    const aiBox = document.getElementById('ai-description-preview-box');
    const aiText = document.getElementById('ai-description-preview-text');
    const btnAiApply = document.getElementById('btn-ai-desc-apply');
    const btnAiCancel = document.getElementById('btn-ai-desc-cancel');
    const descInput = document.getElementById('input-prod-desc');

    if (btnAiGen) {
      btnAiGen.onclick = async () => {
        const name = primaryState.name || 'Produk Unggulan';
        const cat = (DB.getCategories && primaryState.category_id) ? (DB.getCategories().find(c => String(c.id) === String(primaryState.category_id))?.name || 'Katalog') : 'Katalog';
        const generated = `Dapatkan ${name} kualitas terbaik dari kategori ${cat}. Dikerjakan dengan bahan premium dan standar presisi tinggi untuk menjamin kepuasan Anda. Cocok untuk kebutuhan usaha maupun personal.\n\nKeunggulan:\n- Kualitas produk terbaik dan tahan lama\n- Layanan pengerjaan rapi dan terpercaya\n- Garansi kepuasan pelanggan 100%`;
        if (aiText) aiText.textContent = generated;
        if (aiBox) aiBox.classList.remove('hidden');
      };
    }

    if (btnAiApply) {
      btnAiApply.onclick = () => {
        if (descInput && aiText) {
          descInput.value = aiText.textContent;
          primaryState.description = descInput.value;
        }
        if (aiBox) aiBox.classList.add('hidden');
      };
    }

    if (btnAiCancel) {
      btnAiCancel.onclick = () => {
        if (aiBox) aiBox.classList.add('hidden');
      };
    }
  }


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
        const subnavFixed = document.getElementById('step2-subnav-fixed');
        if (subnavFixed) {
          subnavFixed.classList.add('lg:right-[380px]', 'xl:right-[420px]');
          subnavFixed.classList.remove('right-0');
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
        const subnavFixed = document.getElementById('step2-subnav-fixed');
        if (subnavFixed) {
          subnavFixed.classList.remove('lg:right-[380px]', 'xl:right-[420px]');
          subnavFixed.classList.add('right-0');
        }
      }
    }

    function updateStorefrontVisibility(isActive) {
      primaryState.is_active = Boolean(isActive);
      const fabMob = document.getElementById('btn-fab-live-preview');
      const sectionPoint3 = document.getElementById('section-card-model-point3');
      const gallerySlots = document.getElementById('gallery-slots-container');

      if (primaryState.is_active) {
        // ON: Tampilkan Poin 3 (Pilih Jenis Model Kartu)
        if (sectionPoint3) sectionPoint3.classList.remove('hidden');

        if (!primaryState.card_variant) {
          if (gallerySlots) {
            gallerySlots.classList.add('hidden');
            gallerySlots.classList.remove('grid');
          }
        } else {
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
      updateStep1SequentialGatingDOM();
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
    // -------------------------------------------------------------
    // Modal Mini Quick Add Category (Mendukung Kategori Utama & Sub-Kategori)
    // -------------------------------------------------------------
    const btnQuickCat = document.getElementById('btn-quick-add-category');
    const modalQuickCat = document.getElementById('modal-quick-add-category');
    const btnCloseQuickCat = document.getElementById('btn-close-quick-cat');
    const btnCancelQuickCat = document.getElementById('btn-cancel-quick-cat');
    const btnSaveQuickCat = document.getElementById('btn-save-quick-cat');
    const inputQuickCatName = document.getElementById('input-quick-cat-name');
    const errorQuickCat = document.getElementById('quick-cat-error-msg');
    const parentCatWrapper = document.getElementById('quick-cat-parent-wrapper');
    const selectParentCat = document.getElementById('select-quick-cat-parent');
    const labelQuickCatName = document.getElementById('label-quick-cat-name');

    // Radio change: Main vs Sub
    document.querySelectorAll('input[name="quick_cat_type_radio"]').forEach(rad => {
      rad.onchange = (e) => {
        if (e.target.value === 'sub') {
          if (parentCatWrapper) parentCatWrapper.classList.remove('hidden');
          if (labelQuickCatName) labelQuickCatName.innerHTML = 'Nama Sub-Kategori Baru <span class="text-red-500">*</span>';
        } else {
          if (parentCatWrapper) parentCatWrapper.classList.add('hidden');
          if (labelQuickCatName) labelQuickCatName.innerHTML = 'Nama Kategori Baru <span class="text-red-500">*</span>';
        }
      };
    });

    function openQuickCatModal() {
      if (inputQuickCatName) inputQuickCatName.value = '';
      if (errorQuickCat) {
        errorQuickCat.textContent = '';
        errorQuickCat.classList.add('hidden');
      }
      if (selectParentCat && DB.getCategories) {
        const cats = DB.getCategories();
        selectParentCat.innerHTML = cats.map(c => `<option value="${c.id}" ${String(primaryState.category_id) === String(c.id) ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
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

        const isSub = document.querySelector('input[name="quick_cat_type_radio"]:checked')?.value === 'sub';

        try {
          if (isSub) {
            const parentId = selectParentCat?.value || primaryState.category_id;
            if (!parentId) {
              if (errorQuickCat) {
                errorQuickCat.textContent = 'Pilih Kategori Utama Induk terlebih dahulu!';
                errorQuickCat.classList.remove('hidden');
              }
              return;
            }
            const newSub = DB.createSubCategory({ category_id: parentId, name: catName });
            primaryState.category_id = parentId;
            primaryState.sub_category_id = newSub.id;

            const catSelect = document.getElementById('select-step2-cat');
            if (catSelect) catSelect.value = parentId;

            const subCatSelect = document.getElementById('select-step2-sub-cat');
            if (subCatSelect && DB.getSubCategories) {
              const subs = DB.getSubCategories(parentId);
              subCatSelect.innerHTML = '<option value="">-- Tanpa Sub-Kategori --</option>' + subs.map(s => `<option value="${s.id}" ${String(s.id) === String(newSub.id) ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('');
            }

            closeQuickCatModal();
            updateStep2CardGatingDOM();
            updateProductCardLivePreview();
            if (typeof App !== 'undefined' && App.showToast) {
              App.showToast(`Sub-Kategori "${newSub.name}" berhasil dibuat dan dipilih!`, 'success');
            }
          } else {
            const newCat = DB.createCategory({ name: catName });
            primaryState.category_id = newCat.id;
            primaryState.sub_category_id = '';

            const catSelect = document.getElementById('select-step2-cat') || document.getElementById('select-prod-cat');
            if (catSelect) {
              const opt = document.createElement('option');
              opt.value = newCat.id;
              opt.textContent = newCat.name;
              opt.selected = true;
              catSelect.appendChild(opt);
              catSelect.value = newCat.id;
            }

            const subCatSelect = document.getElementById('select-step2-sub-cat');
            if (subCatSelect) {
              subCatSelect.innerHTML = '<option value="" selected>-- Tanpa Sub-Kategori --</option>';
            }

            closeQuickCatModal();
            updateStep2CardGatingDOM();
            updateProductCardLivePreview();
            if (typeof App !== 'undefined' && App.showToast) {
              App.showToast(`Kategori "${newCat.name}" berhasil dibuat dan dipilih!`, 'success');
            }
          }
        } catch (err) {
          if (errorQuickCat) {
            errorQuickCat.textContent = err.message || 'Gagal menyimpan kategori';
            errorQuickCat.classList.remove('hidden');
          }
        }
      });
    }

        // -------------------------------------------------------------
    // Step 1: Navigasi & Event Binding Input Step 1
    // -------------------------------------------------------------
    const btnStep1Cancel = document.getElementById('btn-step-1-cancel');
    if (btnStep1Cancel) {
      btnStep1Cancel.addEventListener('click', () => {
        if (typeof App !== 'undefined' && App.navigate) {
          App.navigate('list');
        } else if (typeof AdminApp !== 'undefined' && AdminApp.navigateTo) {
          AdminApp.navigateTo('products');
        } else {
          const btnBack = document.getElementById('btn-back-to-list');
          if (btnBack) btnBack.click();
          else window.history.back();
        }
      });
    }

    const btnStep1Next = document.getElementById('btn-step-1-next');
    if (btnStep1Next) {
      btnStep1Next.addEventListener('click', () => goToStep(2));
    }

    // Radio Jenis Produk (Fisik vs Non Fisik)
    document.querySelectorAll('input[name="product_type_radio"]').forEach(rad => {
      rad.addEventListener('change', (e) => {
        primaryState.product_type = e.target.value;
        updateStep1SequentialGatingDOM();
      });
    });

    // Toggle Etalase Toko
    const toggleStoreActive = document.getElementById('toggle-is-active-form');
    if (toggleStoreActive) {
      toggleStoreActive.addEventListener('change', (e) => {
        primaryState.is_active = e.target.checked;
        updateStep1SequentialGatingDOM();
      });
    }

    // Radio Model Kartu
    document.querySelectorAll('input[name="card_variant_radio"]').forEach(rad => {
      rad.addEventListener('change', (e) => {
        primaryState.card_variant = e.target.value;
        applyCardVariant(e.target.value, true);
        updateStep1SequentialGatingDOM();
      });
    });

    // Step 1 Input Nama Produk
    const step1NameInput = document.getElementById('input-prod-name');
    if (step1NameInput) {
      step1NameInput.addEventListener('input', (e) => {
        primaryState.name = e.target.value;
        const countEl = document.getElementById('name-char-count');
        if (countEl) countEl.textContent = `${e.target.value.length} / 150`;
        updateCustomLabelsLockState();
        updateProductCardLivePreview();
      });
    }

    // -------------------------------------------------------------
    // LOGIKA OTOMASI PENGUNCIAN & VALIDASI PANJANG LABEL KHUSUS
    // -------------------------------------------------------------
    function updateCustomLabelsLockState() {
      const toggle = document.getElementById('toggle-enable-custom-labels');
      const container = document.getElementById('container-custom-labels-inputs');
      const input1 = document.getElementById('input-custom-label-1');
      const input2 = document.getElementById('input-custom-label-2');
      const input3 = document.getElementById('input-custom-label-3');
      const charCount1 = document.getElementById('char-count-label-1');
      const warn2 = document.getElementById('warn-label-2');
      const warn3 = document.getElementById('warn-label-3');

      if (toggle) {
        primaryState.show_badge = toggle.checked;
      }
      const isEnabled = primaryState.show_badge !== false;
      if (container) {
        if (isEnabled) container.classList.remove('hidden');
        else container.classList.add('hidden');
      }

      if (!input1) return;

      const val1 = (input1.value || '').trim();
      const len1 = val1.length;
      if (charCount1) charCount1.textContent = `${len1}/15`;

      const val2 = (input2 ? input2.value || '' : '').trim();
      const len2 = val2.length;
      const prodName = (primaryState.name || '').trim();

      // Aturan Otomasi Penguncian Berdasarkan Panjang Teks:
      // Label 1:
      // - val1 === 0: Label 2 & 3 disabled
      // - val1 > 15: Kunci/nonaktifkan Label 2 & 3, kosongkan nilainya, tampilkan (?) Label 1 terlalu panjang
      // - 1 <= val1 <= 15: Aktifkan input Label 2!
      if (len1 === 0) {
        if (input2) {
          input2.disabled = true;
          input2.className = 'input-custom-label-slot w-full px-3 py-2 text-xs rounded-md border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed font-medium';
        }
        if (input3) {
          input3.disabled = true;
          input3.className = 'input-custom-label-slot w-full px-3 py-2 text-xs rounded-md border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed font-medium';
        }
        if (warn2) warn2.classList.add('hidden');
        if (warn3) warn3.classList.add('hidden');
      } else if (len1 > 15) {
        if (input2) {
          input2.value = '';
          input2.disabled = true;
          input2.className = 'input-custom-label-slot w-full px-3 py-2 text-xs rounded-md border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed font-medium';
        }
        if (input3) {
          input3.value = '';
          input3.disabled = true;
          input3.className = 'input-custom-label-slot w-full px-3 py-2 text-xs rounded-md border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed font-medium';
        }
        if (warn2) {
          warn2.classList.remove('hidden');
          warn2.innerHTML = `<span class="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded cursor-help" title="Teks pada Label 1 melebihi 15 karakter sehingga ruang kartu penuh. Persingkat Label 1 menjadi maks. 15 karakter untuk mengaktifkan Label 2."><i class="bi bi-question-circle font-bold"></i> Label 1 terlalu panjang</span>`;
        }
        if (warn3) {
          warn3.classList.remove('hidden');
          warn3.innerHTML = `<span class="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded cursor-help" title="Teks pada Label 1 melebihi 15 karakter sehingga ruang kartu penuh. Persingkat Label 1 menjadi maks. 15 karakter untuk mengaktifkan Label 2."><i class="bi bi-question-circle font-bold"></i> Label 1 terlalu panjang</span>`;
        }
      } else {
        // 1 <= len1 <= 15 -> Aktifkan Label 2
        if (input2) {
          input2.disabled = false;
          input2.className = 'input-custom-label-slot w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:border-emerald-500 outline-none bg-white font-medium';
        }
        if (warn2) warn2.classList.add('hidden');

        // Label 2:
        // - val2 === 0: Label 3 disabled
        // - val2 > 12 ATAU len1 + len2 > 22 ATAU (prodName.length > 28 && len1 + len2 > 16):
        //   Kunci/nonaktifkan Label 3, kosongkan nilainya, tampilkan (?) Label 2 terlalu panjang
        // - len2 > 0 dan len1 + len2 <= 16: Aktifkan Label 3!
        const isLabel2TooLong = len2 > 12 || (len1 + len2 > 22) || (prodName.length > 28 && len1 + len2 > 16);

        if (len2 === 0) {
          if (input3) {
            input3.disabled = true;
            input3.className = 'input-custom-label-slot w-full px-3 py-2 text-xs rounded-md border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed font-medium';
          }
          if (warn3) warn3.classList.add('hidden');
        } else if (isLabel2TooLong) {
          if (input3) {
            input3.value = '';
            input3.disabled = true;
            input3.className = 'input-custom-label-slot w-full px-3 py-2 text-xs rounded-md border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed font-medium';
          }
          if (warn3) {
            warn3.classList.remove('hidden');
            warn3.innerHTML = `<span class="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded cursor-help" title="Kombinasi teks Label 1 dan Label 2 sudah memenuhi baris kartu. Persingkat teks label jika ingin menambahkan Label 3."><i class="bi bi-question-circle font-bold"></i> Label 2 terlalu panjang</span>`;
          }
        } else if (len1 + len2 <= 16) {
          if (input3) {
            input3.disabled = false;
            input3.className = 'input-custom-label-slot w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:border-emerald-500 outline-none bg-white font-medium';
          }
          if (warn3) warn3.classList.add('hidden');
        } else {
          // len1 + len2 > 16
          if (input3) {
            input3.value = '';
            input3.disabled = true;
            input3.className = 'input-custom-label-slot w-full px-3 py-2 text-xs rounded-md border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed font-medium';
          }
          if (warn3) {
            warn3.classList.remove('hidden');
            warn3.innerHTML = `<span class="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded cursor-help" title="Kombinasi teks Label 1 dan Label 2 sudah memenuhi baris kartu. Persingkat teks label jika ingin menambahkan Label 3."><i class="bi bi-question-circle font-bold"></i> Label 2 terlalu panjang</span>`;
          }
        }
      }

      // Update primaryState.custom_labels
      const l1 = input1 ? input1.value.trim() : '';
      const l2 = (input2 && !input2.disabled) ? input2.value.trim() : '';
      const l3 = (input3 && !input3.disabled) ? input3.value.trim() : '';
      primaryState.custom_labels = [l1, l2, l3].filter(Boolean);
      updateProductCardLivePreview();
    }

    // Toggle Tambahkan Label Khusus
    const toggleLabels = document.getElementById('toggle-enable-custom-labels');
    if (toggleLabels) {
      toggleLabels.addEventListener('change', () => {
        primaryState.show_badge = toggleLabels.checked;
        updateCustomLabelsLockState();
      });
    }

    // Step 1 Custom Label Slots Input Listeners
    ['input-custom-label-1', 'input-custom-label-2', 'input-custom-label-3'].forEach(id => {
      const inp = document.getElementById(id);
      if (inp) {
        inp.addEventListener('input', () => {
          updateCustomLabelsLockState();
        });
      }
    });

    // Step 1 Preset Label Buttons
    document.querySelectorAll('.btn-preset-label-step1').forEach(btn => {
      btn.addEventListener('click', () => {
        const lbl = btn.getAttribute('data-label') || '';
        const l1 = document.getElementById('input-custom-label-1');
        const l2 = document.getElementById('input-custom-label-2');
        const l3 = document.getElementById('input-custom-label-3');

        if (l1 && !l1.value.trim()) {
          l1.value = lbl;
        } else if (l2 && !l2.disabled && !l2.value.trim()) {
          l2.value = lbl;
        } else if (l3 && !l3.disabled && !l3.value.trim()) {
          l3.value = lbl;
        } else if (l1) {
          l1.value = lbl;
        }

        updateCustomLabelsLockState();
      });
    });

    // Mobile FAB Scroll Auto-hide saat mentok bawah (agar anti-menutupi tombol aksi)
    const fabMobEl = document.getElementById('btn-fab-live-preview');
    if (fabMobEl) {
      const handleFabScroll = () => {
        const vp = document.getElementById('admin-main-viewport') || document.documentElement;
        const distFromBottom = vp.scrollHeight - vp.scrollTop - vp.clientHeight;
        if (distFromBottom < 100) {
          fabMobEl.classList.add('opacity-0', 'pointer-events-none');
        } else {
          fabMobEl.classList.remove('opacity-0', 'pointer-events-none');
        }
      };
      const mainVp = document.getElementById('admin-main-viewport');
      if (mainVp) mainVp.addEventListener('scroll', handleFabScroll, { passive: true });
      window.addEventListener('scroll', handleFabScroll, { passive: true });
    }

    // Inisialisasi lock state label di awal
    updateCustomLabelsLockState();

    // Panggil inisialisasi gating step 1 di awal
    updateStep1SequentialGatingDOM();


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

    // Helper: Tanggal & Waktu Lokal untuk Pengaturan Periode Maksimal Order
  function getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  }

  function addDaysToDate(dateStr, days) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Kondisi Gerbang (Gating): Cek kelengkapan seluruh data wajib di Step 1
  function isStep1Complete() {
    // 1. Jenis Produk / Layanan (Fisik atau Non Fisik)
    if (!primaryState.product_type || (primaryState.product_type !== 'physical' && primaryState.product_type !== 'non_physical')) {
      return false;
    }
    // 2. Model Kartu (Wajib jika toko aktif)
    if (primaryState.is_active && !primaryState.card_variant) {
      return false;
    }
    // 3. Foto Produk (Minimal 1 foto sebagai cover)
    if (!primaryState.images || primaryState.images.length === 0) {
      if (!primaryState.image_url) return false;
    }
    // 4. Nama Produk
    if (!primaryState.name || primaryState.name.trim() === '') {
      return false;
    }
    // 5. Kategori Utama Etalase
    if (!primaryState.category_id || String(primaryState.category_id).trim() === '') {
      return false;
    }
    return true;
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
      const gallerySlots = document.getElementById('gallery-slots-container');
      if (gallerySlots) {
        gallerySlots.classList.remove('hidden');
        gallerySlots.classList.add('grid');
      }
      updateStep1SequentialGatingDOM();

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
        const inp3 = document.getElementById('input-custom-label-3');
        if (inp1 && !inp1.value.trim()) {
          inp1.value = labelText;
        } else if (inp2 && !inp2.disabled && !inp2.value.trim()) {
          inp2.value = labelText;
        } else if (inp3 && !inp3.disabled && !inp3.value.trim()) {
          inp3.value = labelText;
        } else if (inp1) {
          inp1.value = labelText;
        }

        const bA = document.getElementById('cfg-show-badge-blok-a');
        const bMain = document.getElementById('cfg-show-badge');
        const bMob = document.getElementById('cfg-show-badge-mob');
        if (bA) bA.checked = true;
        if (bMain) bMain.checked = true;
        if (bMob) bMob.checked = true;
        primaryState.show_badge = true;

        if (typeof updateCustomLabelsLockState === 'function') {
          updateCustomLabelsLockState();
        } else {
          updateProductCardLivePreview();
        }
      });
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

// btnToggleBadgeVis removed

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
    // Tombol Tambah Slot Foto dihandle via global delegation untuk mencegah double triggering

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
        e.stopPropagation();
        if (e.isTrusted === false) return;
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
    // Step 1 & Step 2 Card 1: Info Produk
    primaryState.name = document.getElementById('step2-input-name')?.value || document.getElementById('input-prod-name')?.value || primaryState.name;
    primaryState.description = document.getElementById('input-prod-desc')?.value || primaryState.description || '';
    primaryState.category_id = document.getElementById('select-step2-cat')?.value || document.getElementById('select-prod-cat')?.value || primaryState.category_id;
    primaryState.sub_category_id = document.getElementById('select-step2-sub-cat')?.value || document.getElementById('select-prod-sub-cat')?.value || primaryState.sub_category_id;
    
    const variantRad = document.querySelector('input[name="card_variant_radio"]:checked');
    if (variantRad) primaryState.card_variant = variantRad.value;
    primaryState.card_variant_override = true;
    
    const aspectRad = document.querySelector('input[name="photo_aspect_ratio"]:checked');
    if (aspectRad) primaryState.image_aspect_ratio = aspectRad.value;

    // Kustomisasi Label Variasi Bertumpuk
    if (!primaryState.variation_labels) primaryState.variation_labels = {};
    const vProd = document.getElementById('input-var-label-product');
    const vT1 = document.getElementById('input-var-label-tier1');
    const vT2 = document.getElementById('input-var-label-main') || document.getElementById('input-var-label-tier2');
    const vE1 = document.getElementById('input-var-label-extra_1') || document.getElementById('input-var-label-extra1');
    const vE2 = document.getElementById('input-var-label-extra_2') || document.getElementById('input-var-label-extra2');
    const vE3 = document.getElementById('input-var-label-extra_3') || document.getElementById('input-var-label-extra3');
    if (vProd) primaryState.variation_labels.label_product = vProd.value.trim();
    if (vT1) primaryState.variation_labels.label_tier_1 = vT1.value.trim();
    if (vT2) primaryState.variation_labels.label_tier_2 = vT2.value.trim();
    if (vE1) primaryState.variation_labels.label_extra_1 = vE1.value.trim();
    if (vE2) primaryState.variation_labels.label_extra_2 = vE2.value.trim();
    if (vE3) primaryState.variation_labels.label_extra_3 = vE3.value.trim();

    // Cakupan Opsi Pendukung (Scopes: Umum / Spesifik)
    if (!primaryState.variation_scopes) primaryState.variation_scopes = {};
    ['main', 'extra_1', 'extra_2', 'extra_3'].forEach(tier => {
      const checkedScope = document.querySelector(`input[name="scope_${tier}"]:checked`);
      if (checkedScope) {
        primaryState.variation_scopes[tier] = checkedScope.value;
        primaryState['scope_' + tier] = checkedScope.value;
      }
    });

    // Step 2: Informasi Penjualan
    const selectPricingModel = document.getElementById('select-pricing-model');
    if (selectPricingModel) primaryState.pricing_model = selectPricingModel.value;

    const sizeRad = document.querySelector('input[name="size_pricing_type_radio"]:checked');
    if (sizeRad) primaryState.size_pricing_type = sizeRad.value;

    const sizeUnitSel = document.getElementById('select-size-unit');
    if (sizeUnitSel) primaryState.size_unit = sizeUnitSel.value;

    const fixedSizeInp = document.getElementById('input-fixed-size');
    if (fixedSizeInp) primaryState.fixed_size_value = fixedSizeInp.value;

    const weightUnitSel = document.getElementById('select-weight-unit');
    if (weightUnitSel) primaryState.weight_unit = weightUnitSel.value;

    const volumeUnitSel = document.getElementById('select-volume-unit');
    if (volumeUnitSel) primaryState.volume_unit = volumeUnitSel.value;

    // Single Price & Cost for Normal Single
    const singlePriceInp = document.getElementById('input-single-price');
    const singleCostInp = document.getElementById('input-single-cost');
    if (singlePriceInp && materialsState.length > 0) {
      materialsState[0].price = parseFloat(singlePriceInp.value) || 0;
      materialsState[0].name = primaryState.name || 'Produk Standar';
    }
    if (singleCostInp && materialsState.length > 0) {
      materialsState[0].cost_price = parseFloat(singleCostInp.value) || 0;
    }

    // Stok
    const unlStockCheck = document.getElementById('toggle-unlimited-stock');
    if (unlStockCheck) primaryState.is_unlimited_stock = unlStockCheck.checked;
    const stockQtyInp = document.getElementById('input-stock-qty');
    if (stockQtyInp) {
      primaryState.stock = primaryState.is_unlimited_stock ? null : (parseInt(stockQtyInp.value) || 0);
    }

    // Min Order
    const minOrderInp = document.getElementById('input-min-order');
    if (minOrderInp) primaryState.min_order = Math.max(1, parseInt(minOrderInp.value) || 1);

    // Max Order (Combobox / Select Sync)
    const normalMaxInp = document.getElementById('input-normal-max-order');
    if (normalMaxInp) {
      const raw = normalMaxInp.value.trim();
      if (!raw || raw.toLowerCase() === 'tanpa max order' || raw === '0') {
        primaryState.max_order = null;
        primaryState.max_order_qty = null;
        primaryState.max_order_type = 'unlimited';
      } else {
        const num = parseInt(raw) || null;
        primaryState.max_order = num;
        primaryState.max_order_qty = num;
        primaryState.max_order_type = num ? 'per_order' : 'unlimited';
      }
    } else {
      const maxOrderTypeSel = document.getElementById('select-max-order-type');
      if (maxOrderTypeSel) primaryState.max_order_type = maxOrderTypeSel.value;
      const maxOrderQtyInp = document.getElementById('input-max-order-qty');
      if (maxOrderQtyInp) primaryState.max_order_qty = maxOrderQtyInp.value ? parseInt(maxOrderQtyInp.value) : null;
      primaryState.max_order = primaryState.max_order_qty;
    }

    // Max Order Period
    const pStartDate = document.getElementById('input-period-start-date')?.value;
    const pMaxQty = parseInt(document.getElementById('input-period-max-qty')?.value);
    const pDays = parseInt(document.getElementById('input-period-days')?.value);
    const pTypeRad = document.querySelector('input[name="period_type_radio"]:checked');
    const pEndDate = document.getElementById('select-period-end-date')?.value;

    if (!primaryState.max_order_period) primaryState.max_order_period = {};
    if (pStartDate) primaryState.max_order_period.start_date = pStartDate;
    if (!isNaN(pMaxQty)) primaryState.max_order_period.max_qty = pMaxQty;
    if (!isNaN(pDays)) primaryState.max_order_period.days = pDays;
    if (pTypeRad) primaryState.max_order_period.period_type = pTypeRad.value;
    if (pEndDate) primaryState.max_order_period.end_date = pEndDate;

    // Wholesale Tiers DOM sync
    const wholesaleRows = document.querySelectorAll('#wholesale-table-body tr[data-tier-id]');
    if (wholesaleRows.length > 0) {
      primaryState.wholesale_tiers = Array.from(wholesaleRows).map(row => {
        const id = row.getAttribute('data-tier-id');
        const minQty = parseInt(row.querySelector('[data-field="min_qty"]')?.value) || 0;
        const maxQty = parseInt(row.querySelector('[data-field="max_qty"]')?.value) || null;
        const price = parseFloat(row.querySelector('[data-field="price"]')?.value) || 0;
        return { id, min_qty: minQty, max_qty: maxQty, price };
      });
    }

    // Kelipatan Pesanan DOM sync
    const singleMultipleInp = document.getElementById('input-order-multiple-single');
    if (singleMultipleInp) {
      primaryState.order_multiple_value = parseInt(singleMultipleInp.value) || 1;
    }
    const variantMultRows = document.querySelectorAll('#variant-multiples-table-body tr[data-variant-id]');
    if (variantMultRows.length > 0) {
      const multiplesMap = {};
      variantMultRows.forEach(row => {
        const vId = row.getAttribute('data-variant-id');
        const multVal = parseInt(row.querySelector('.input-variant-multiple')?.value) || 1;
        multiplesMap[vId] = multVal;
      });
      primaryState.order_multiples_by_variant = multiplesMap;
    }

    // Materials / Variants rows DOM sync
    const matRows = document.querySelectorAll('#materials-table-body tr, #materials-table-body .variation-option-row');
    matRows.forEach(row => {
      const id = row.getAttribute('data-id');
      const item = materialsState.find(m => m.id === id);
      if (item) {
        const nameInp = row.querySelector('[data-field="name"]');
        const descInp = row.querySelector('[data-field="description"]');
        const priceInp = row.querySelector('[data-field="price"]');
        const costInp = row.querySelector('[data-field="cost_price"]');
        const stockInp = row.querySelector('[data-field="stock"]');
        const stepInp = row.querySelector('[data-field="step_multiplier"]');

        if (nameInp) item.name = nameInp.value;
        if (descInp) item.description = descInp.value;
        if (priceInp) item.price = priceInp.value === '' ? '' : (parseFloat(priceInp.value) || 0);
        if (costInp) item.cost_price = costInp.value === '' ? '' : (parseFloat(costInp.value) || 0);
        if (stockInp) item.stock = (stockInp.value === '' || stockInp.value === 'Unlimited') ? null : (parseInt(stockInp.value) || 0);
        if (stepInp) item.step_multiplier = Math.max(1, parseInt(stepInp.value) || 1);
      }
    });

    // Finishing / Supporting Variations rows DOM sync
    ['main', 'extra_1', 'extra_2', 'extra_3'].forEach(tier => {
      const finRows = document.querySelectorAll(`#finishings-${tier}-table-body tr, #finishings-${tier}-table-body .variation-option-row`);
      finRows.forEach(row => {
        const id = row.getAttribute('data-id');
        const item = (finishingsState[tier] || []).find(f => f.id === id);
        if (item) {
          const nameInp = row.querySelector('[data-field="name"]');
          const descInp = row.querySelector('[data-field="description"]');
          const priceInp = row.querySelector('[data-field="price"]');
          const costInp = row.querySelector('[data-field="cost_price"]');
          const stockInp = row.querySelector('[data-field="stock"]');
          const parentSel = row.querySelector('[data-field="parent_id"]');
          const extraTypeSel = row.querySelector('[data-field="extra_type"]');

          if (nameInp) item.name = nameInp.value;
          if (descInp) item.description = descInp.value;
          if (priceInp) item.price = priceInp.value === '' ? '' : (parseFloat(priceInp.value) || 0);
          if (costInp) item.cost_price = costInp.value === '' ? '' : (parseFloat(costInp.value) || 0);
          if (stockInp) item.stock = (stockInp.value === '' || stockInp.value === 'Unlimited') ? null : (parseInt(stockInp.value) || 0);
          if (parentSel) item.parent_id = parentSel.value || '';
          if (extraTypeSel) item.extra_type = extraTypeSel.value || 'checklist';
        }
      });
    });

    // Combination Table Matrix DOM sync
    const comboRows = document.querySelectorAll('.combo-matrix-row');
    comboRows.forEach(row => {
      const matId = row.getAttribute('data-mat-id');
      const mat = materialsState.find(m => m.id === matId);
      if (mat) {
        const minInp = row.querySelector('.combo-min-order-input');
        const maxInp = row.querySelector('.combo-max-order-input');
        if (minInp) mat.min_order = Math.max(1, parseInt(minInp.value) || 1);
        if (maxInp) mat.max_order = (maxInp.value === '' || maxInp.value === 'Unlimited') ? null : (parseInt(maxInp.value) || null);
      }
    });

    // Step 2 Card 4: Promo & Diskon
    const togglePromo = document.getElementById('toggle-monthly-discount');
    if (togglePromo) primaryState.has_monthly_discount = togglePromo.checked;
    primaryState.monthly_promo_label = document.getElementById('input-monthly-promo-label')?.value || 'Promo Spesial';
    primaryState.discount_type = document.getElementById('select-monthly-discount-type')?.value || 'percent';
    primaryState.discount_value = parseFloat(document.getElementById('input-discount-val')?.value) || 0;
    const pStart = document.getElementById('input-promo-start-date')?.value;
    primaryState.promo_start_date = pStart ? pStart : null;
    const pEnd = document.getElementById('input-promo-end-date')?.value;
    primaryState.promo_end_date = pEnd ? pEnd : null;

    // Step 2 Card 3: Pengiriman & Dimensi Paket
    if (!primaryState.shipping_config) primaryState.shipping_config = {};
    const codCheck = document.getElementById('toggle-is-cod') || document.getElementById('check-shipping-cod');
    if (codCheck) primaryState.shipping_config.is_cod = codCheck.checked;

    const courierBoxes = document.querySelectorAll('input[name="courier_checkbox"]:checked, .check-courier-service:checked');
    if (courierBoxes.length > 0) {
      primaryState.shipping_config.couriers = Array.from(courierBoxes).map(cb => cb.value);
    }

    const pkgWeightInp = document.getElementById('input-package-weight') || document.getElementById('input-pkg-weight');
    if (pkgWeightInp) primaryState.shipping_config.weight = parseFloat(pkgWeightInp.value) || 0;

    const pkgWeightUnitSel = document.getElementById('select-package-weight-unit') || document.getElementById('select-pkg-weight-unit');
    if (pkgWeightUnitSel) primaryState.shipping_config.weight_unit = pkgWeightUnitSel.value || 'gram';

    const pkgL = parseFloat(document.getElementById('input-dim-length')?.value || document.getElementById('input-pkg-length')?.value) || 0;
    const pkgW = parseFloat(document.getElementById('input-dim-width')?.value || document.getElementById('input-pkg-width')?.value) || 0;
    const pkgH = parseFloat(document.getElementById('input-dim-height')?.value || document.getElementById('input-pkg-height')?.value) || 0;
    primaryState.shipping_config.length_cm = pkgL;
    primaryState.shipping_config.width_cm = pkgW;
    primaryState.shipping_config.height_cm = pkgH;
    primaryState.shipping_config.length = pkgL;
    primaryState.shipping_config.width = pkgW;
    primaryState.shipping_config.height = pkgH;

    // Step 2 Card 6: Lainnya (Footer model 3, condition, sku, barcode)
    const footer1Inp = document.getElementById('input-card-footer-text');
    if (footer1Inp) primaryState.card_footer_text = footer1Inp.value.trim();
    const footer1IconSel = document.getElementById('select-card-footer-icon');
    if (footer1IconSel) primaryState.footer_badge_icon = footer1IconSel.value;

    const footer2Inp = document.getElementById('input-card-footer-2-text');
    if (footer2Inp) primaryState.card_footer_2_text = footer2Inp.value.trim();
    const footer2IconSel = document.getElementById('select-card-footer-2-icon');
    if (footer2IconSel) primaryState.footer_2_badge_icon = footer2IconSel.value;

    const condSel = document.getElementById('select-prod-condition');
    if (condSel) primaryState.condition = condSel.value;
    const skuInp = document.getElementById('input-prod-sku');
    if (skuInp) primaryState.sku = skuInp.value.trim();
    const barcodeInp = document.getElementById('input-prod-barcode');
    if (barcodeInp) primaryState.barcode = barcodeInp.value.trim();    // Custom Labels
    const toggleBadge = document.getElementById('toggle-enable-custom-labels');
    if (toggleBadge) {
      primaryState.show_badge = toggleBadge.checked;
    }
    const l1 = document.getElementById('input-custom-label-1')?.value?.trim();
    const l2 = document.getElementById('input-custom-label-2')?.value?.trim();
    const l3 = document.getElementById('input-custom-label-3')?.value?.trim();
    if (l1 !== undefined || l2 !== undefined || l3 !== undefined) {
      primaryState.custom_labels = [l1, l2, l3].filter(Boolean);
    }

    // Map price_type based on pricing_model
    if (primaryState.pricing_model === 'size') {
      primaryState.price_type = primaryState.size_pricing_type === 'fixed' ? 2 : 1;
    } else if (primaryState.pricing_model === 'weight') {
      primaryState.price_type = 5;
    } else if (primaryState.pricing_model === 'volume') {
      primaryState.price_type = 6;
    } else {
      primaryState.price_type = 2;
    }
  }

  function validateForm(isDraft = false) {
    syncStateFromDOM();
    const errors = [];

    // Jika Simpan Draf: hanya wajibkan Nama Produk
    if (isDraft) {
      if (!primaryState.name || primaryState.name.trim() === '') {
        errors.push('Nama Produk wajib diisi untuk menyimpan draf.');
      }
      return errors;
    }

    // 1. Validasi Step 1: Informasi Pokok Produk
    if (!primaryState.product_type || (primaryState.product_type !== 'physical' && primaryState.product_type !== 'non_physical')) {
      errors.push('Pilih Jenis Produk / Layanan terlebih dahulu (Fisik atau Non Fisik).');
    }
    if (primaryState.is_active && !primaryState.card_variant) {
      errors.push('Pilih Jenis Model Kartu Produk terlebih dahulu.');
    }
    if (!primaryState.images || primaryState.images.length === 0) {
      if (!primaryState.image_url) {
        errors.push('Foto produk wajib diunggah minimal 1 gambar sebagai cover.');
      }
    }
    if (!primaryState.name || primaryState.name.trim() === '') {
      errors.push('Nama / judul produk wajib diisi.');
    }
    if (primaryState.show_badge !== false) {
      const l1Val = (primaryState.custom_labels && primaryState.custom_labels[0]) ? primaryState.custom_labels[0].trim() : '';
      if (!l1Val) {
        errors.push('Label 1 wajib diisi jika Tambahkan Label Khusus diaktifkan.');
      }
    }
    if (!primaryState.category_id || String(primaryState.category_id).trim() === '') {
      errors.push('Kategori Utama Etalase wajib dipilih.');
    }

    // 2. Validasi Step 2: Informasi Penjualan
    if (primaryState.pricing_model === 'normal' && !primaryState.has_variants) {
      const firstMat = materialsState[0];
      if (!firstMat || isNaN(firstMat.price) || firstMat.price < 0) {
        errors.push('Harga jual produk wajib diisi angka valid.');
      }
    } else {
      if (!materialsState || materialsState.length === 0) {
        errors.push('Minimal harus mengisi 1 pilihan varian / bahan dasar.');
      } else if (primaryState.has_variants) {
        const validMats = materialsState.filter(m => m.name && m.name.trim() !== '');
        if (validMats.length < 1) {
          errors.push('Variasi 1 wajib memiliki minimal 1 opsi yang terisi namanya.');
        }
      }
    }

    if (primaryState.has_variation_2) {
      const validT2 = (finishingsState.main || []).filter(f => f.name && f.name.trim() !== '');
      if (validT2.length < 1) {
        errors.push('Variasi 2 wajib memiliki minimal 1 opsi yang terisi namanya.');
      }
    }
    if (primaryState.has_variation_3) {
      const validT3 = (finishingsState.extra_1 || []).filter(f => f.name && f.name.trim() !== '');
      if (validT3.length < 1) {
        errors.push('Variasi 3 wajib memiliki minimal 1 opsi yang terisi namanya.');
      }
    }
    if (primaryState.has_variation_4) {
      const validT4 = (finishingsState.extra_2 || []).filter(f => f.name && f.name.trim() !== '');
      if (validT4.length < 1) {
        errors.push('Variasi 4 wajib memiliki minimal 1 opsi yang terisi namanya.');
      }
    }
    if (primaryState.has_extra_service) {
      const validExtra = (finishingsState.extra_3 || []).filter(f => f.name && f.name.trim() !== '');
      if (validExtra.length < 1) {
        errors.push('Layanan Extras wajib memiliki minimal 1 opsi yang terisi namanya.');
      }
    }

    if (!primaryState.is_unlimited_stock && (primaryState.stock === null || isNaN(primaryState.stock) || primaryState.stock < 0)) {
      errors.push('Masukkan kuota stok fisik yang valid jika batas stok aktif.');
    }

    if (primaryState.min_order < 1) {
      errors.push('Minimal pesanan minimal bernilai 1.');
    }
    if (primaryState.max_order_type === 'per_order' && primaryState.max_order_qty !== null && primaryState.max_order_qty < primaryState.min_order) {
      errors.push('Maksimal pesanan per checkout tidak boleh lebih kecil dari minimal pesanan.');
    }

    // 3. Validasi Step 3: Promo & Deskripsi
    if (primaryState.has_monthly_discount) {
      if (primaryState.discount_type === 'percent' && (primaryState.discount_value <= 0 || primaryState.discount_value > 100)) {
        errors.push('Persentase diskon harus di antara 1% dan 100%.');
      } else if (primaryState.discount_type === 'nominal' && primaryState.discount_value <= 0) {
        errors.push('Nominal potongan diskon IDR harus lebih besar dari 0.');
      }
    }

    if (!primaryState.description || primaryState.description.trim() === '') {
      errors.push('Deskripsi produk wajib diisi.');
    }

    return errors;
  }

  function handleFormSubmit(isDraft = false) {
    const errorBanner = document.getElementById('form-error-banner');
    const errorList = document.getElementById('form-error-list');
    const btnSubmit = document.getElementById('btn-submit-product');
    const btnDraft = document.getElementById('btn-save-draft');
    const spinner = document.getElementById('btn-submit-spinner');
    const icon = document.getElementById('btn-submit-icon');
    const submitText = document.getElementById('btn-submit-text');

    primaryState.status = isDraft ? 'draft' : 'published';

    const errors = validateForm(isDraft);

    if (errors.length > 0) {
      if (errorList) errorList.innerHTML = errors.map(err => `<li>${err}</li>`).join('');
      if (errorBanner) errorBanner.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    if (errorBanner) errorBanner.classList.add('hidden');

    if (btnSubmit) btnSubmit.disabled = true;
    if (btnDraft) btnDraft.disabled = true;
    if (!isDraft && spinner && icon && submitText) {
      spinner.classList.remove('hidden');
      icon.classList.add('hidden');
      submitText.textContent = 'Menyimpan...';
    }

    const allFinishings = [
      ...(primaryState.has_variation_2 ? (finishingsState.main || []).filter(f => f.name && f.name.trim() !== '').map((f, idx) => ({ ...f, name: f.name.trim(), tier: 'main' })) : []),
      ...(primaryState.has_variation_3 ? (finishingsState.extra_1 || []).filter(f => f.name && f.name.trim() !== '').map((f, idx) => ({ ...f, name: f.name.trim(), tier: 'extra_1' })) : []),
      ...(primaryState.has_variation_4 ? (finishingsState.extra_2 || []).filter(f => f.name && f.name.trim() !== '').map((f, idx) => ({ ...f, name: f.name.trim(), tier: 'extra_2' })) : []),
      ...(primaryState.has_extra_service ? (finishingsState.extra_3 || []).filter(f => f.name && f.name.trim() !== '').map((f, idx) => ({ ...f, name: f.name.trim(), tier: 'extra_3' })) : [])
    ];

    let validMaterials = [];
    if (primaryState.has_variants) {
      validMaterials = materialsState.filter(m => m.name && m.name.trim() !== '').map((m, idx) => ({
        ...m,
        name: m.name.trim()
      }));
    } else {
      validMaterials = [{
        id: (materialsState[0] && materialsState[0].id) ? materialsState[0].id : DB.generateUUID(),
        name: primaryState.name || 'Produk Standar',
        price: parseFloat(document.getElementById('input-single-price')?.value ?? (materialsState[0]?.price || 0)) || 0,
        cost_price: parseFloat(document.getElementById('input-single-cost')?.value ?? (materialsState[0]?.cost_price || 0)) || 0,
        step_multiplier: 1
      }];
    }

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
          App.showToast(isDraft ? 'Draf produk berhasil disimpan!' : 'Produk baru berhasil disimpan ke katalog!', 'success');
        } else {
          DB.updateProduct(currentEditingId, primaryState, validMaterials, allFinishings);
          App.showToast(isDraft ? 'Perubahan draf berhasil disimpan!' : 'Perubahan produk berhasil diperbarui!', 'success');
        }
        App.navigate('list');
      } catch (err) {
        console.error(err);
        alert('Gagal menyimpan produk: ' + err.message);
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          if (spinner) spinner.classList.add('hidden');
          if (icon) icon.classList.remove('hidden');
          if (submitText) submitText.textContent = formMode === 'edit' ? 'Perbarui Produk' : 'Simpan Produk';
        }
        if (btnDraft) btnDraft.disabled = false;
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



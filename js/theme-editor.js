/**
 * Theme Studio Customizer - Shopify-Style Visual Editor Controller
 * Songer Creative - Standalone Fullscreen Customizer Engine
 * 
 * Features:
 * - Left Resizable Sidebar (280px - 520px) with iframe mouse-intercept protection
 * - Full Height 100% Viewport Canvas (No bottom empty space)
 * - Ultra-minimal 5px Custom Scrollbars
 * - Interactive Visual Edit Mode: Click section in preview -> smooth scrolls & flashes corresponding sidebar accordion
 * - Full parity with buyer-store etalase wireframe
 */

(function () {
  'use strict';

  // --- STATE ---
  let settings = {};
  let currentBanners = [];
  let updatePreviewTimer = null;
  let activeWidth = 1200;
  let isVisualEditActive = false;

  // Default fallback banners jika belum ada di database
  const DEFAULT_BANNERS = [
    'assets/images/logo-songer-creative.png',
    'assets/images/songer-logo.png'
  ];

  // ============================================================================
  // 1. INITIALIZATION & DATA LOADING
  // ============================================================================
  function init() {
    loadSettingsFromDB();
    setupAccordions();
    setupResizableSidebar();
    setupCanvasControls();
    setupColorPickers();
    setupLogoHandlers();
    setupBannerHandlers();
    setupFormChangeListeners();
    setupVisualEditToggle();
    setupSaveButton();
    setupPostMessageListener();

    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Buka accordion pertama secara default
    const firstAccordionBody = document.getElementById('body-top-bar') || document.getElementById('body-header-topbar');
    const firstAccordionHeader = document.querySelector('[data-target="body-top-bar"]') || document.querySelector('[data-target="body-header-topbar"]');
    if (firstAccordionBody && firstAccordionHeader) {
      firstAccordionBody.classList.remove('hidden');
      const chev = firstAccordionHeader.querySelector('.theme-accordion-chevron');
      if (chev) chev.classList.add('rotate-180');
    }

    // Terapkan default desktop view (100% edge-to-edge full height)
    applyCanvasWidth(1200, document.getElementById('btn-preset-desktop'));

    // Render preview perdana
    updateLivePreview();
  }

  function loadSettingsFromDB() {
    if (typeof DB !== 'undefined' && typeof DB.getSettings === 'function') {
      settings = DB.getSettings() || {};
    } else {
      console.warn('[ThemeEditor] DB.getSettings tidak tersedia, membaca localStorage langsung');
      try {
        settings = JSON.parse(localStorage.getItem('pos_store_settings') || '{}');
      } catch (e) {
        settings = {};
      }
    }

    // Inisialisasi daftar banner
    if (Array.isArray(settings.banners) && settings.banners.length > 0) {
      currentBanners = [...settings.banners];
    } else if (Array.isArray(settings.hero_banners) && settings.hero_banners.length > 0) {
      currentBanners = [...settings.hero_banners];
    } else {
      currentBanners = [...DEFAULT_BANNERS];
    }

    // 1. Top Bar & Sapaan
    const storeName = settings.store_name || 'Songer Creative';
    const storeTagline = settings.store_tagline || 'Digital Printing & Percetakan Terpadu';
    const storeLogo = settings.store_logo_url || settings.web_logo || 'assets/images/logo-songer-creative.png';
    const storeFavicon = settings.store_favicon_url || settings.favicon_url || 'assets/images/songer-logo.png';
    const navbarMode = settings.navbar_branding_mode || 'logo_landscape';
    const topBarBg = settings.top_bar_bg_color || '#0f172a';
    const topBarText = settings.top_bar_text_color || '#f8fafc';
    const navbarBg = settings.navbar_bg_color || '#ffffff';
    const navbarText = settings.navbar_text_color || '#0f172a';
    const cartIconColor = settings.cart_icon_color || '#334155';
    const cartBadgeColor = settings.cart_badge_color || '#f59e0b';
    const searchBgColor = settings.search_bg_color || '#f1f5f9';
    const loginBtnColor = settings.login_btn_color || '#f1f5f9';

    // Top Bar Controls
    const enableGreeting = settings.enable_customer_greeting !== false && settings.show_topbar_greeting !== false;
    const greetingText = settings.top_bar_greeting_text || settings.greeting_text || 'Selamat datang di ' + storeName;
    const enablePromo = settings.enable_promo_countdown !== false && settings.show_promo_countdown !== false;
    const promoLabel = settings.top_bar_promo_text || 'Promo Kilat Berakhir Dalam:';
    const promoEnd = settings.top_bar_promo_end || '02 Hari Lagi';

    setCheckboxValue('enable-greeting-toggle', enableGreeting);
    setInputValue('top-bar-greeting-text-input', greetingText);
    setCheckboxValue('enable-promo-countdown-toggle', enablePromo);
    setInputValue('top-bar-promo-text-input', promoLabel);
    setInputValue('top-bar-promo-end-input', promoEnd);

    setColorPair('ctrl-color-top-bar-bg', 'ctrl-hex-top-bar-bg', topBarBg);
    setColorPair('ctrl-color-top-bar-text', 'ctrl-hex-top-bar-text', topBarText);

    // 2. Navbar & Identitas Toko
    setInputValue('store-name-input', storeName);
    setInputValue('store-tagline-input', storeTagline);
    setInputValue('store-logo-url-input', storeLogo);
    setImageSrc('preview-store-logo-img', storeLogo);
    setInputValue('store-favicon-url-input', storeFavicon);
    setImageSrc('preview-store-favicon-img', storeFavicon);

    setSelectValue('navbar_branding_mode_select', navbarMode);
    setRadioValue('navbar_branding_mode_radio', navbarMode);
    const showDesktopName = settings.show_header_store_name !== false && settings.show_desktop_store_name !== false;
    setCheckboxValue('show-header-store-name-toggle', showDesktopName);
    syncNavbarFormVisibility();

    setColorPair('ctrl-color-navbar-bg', 'ctrl-hex-navbar-bg', navbarBg);
    setColorPair('ctrl-color-navbar-text', 'ctrl-hex-navbar-text', navbarText);
    // Sub-Menu 2: Tombol Keranjang (Cart)
    setSelectValue('cart_icon_select', settings.cart_icon || 'bi-bag-fill');
    setColorPair('ctrl-color-cart-icon', 'ctrl-hex-cart-icon', settings.cart_icon_color || settings.navbar_cart_icon_color || '#334155');
    setColorPair('ctrl-color-cart-bg', 'ctrl-hex-cart-bg', settings.cart_bg_color || '#f1f5f9');
    
    const cartBorderEnable = settings.cart_border_enable !== false;
    setCheckboxValue('cart_border_toggle', cartBorderEnable);
    const cartBorderBox = document.getElementById('cart_border_settings_box');
    if (cartBorderBox) cartBorderBox.classList.toggle('hidden', !cartBorderEnable);
    setColorPair('ctrl-color-cart-border', 'ctrl-hex-cart-border', settings.cart_border_color || settings.navbar_cart_border_color || '#e2e8f0');
    
    const cartRadius = settings.cart_border_radius !== undefined ? settings.cart_border_radius : 16;
    setInputValue('cart_border_radius_slider', cartRadius);
    const cartRadiusVal = document.getElementById('cart_border_radius_val');
    if (cartRadiusVal) cartRadiusVal.textContent = cartRadius == 24 ? '24px (Bulat)' : `${cartRadius}px`;

    setColorPair('ctrl-color-cart-badge', 'ctrl-hex-cart-badge', settings.cart_badge_color || settings.navbar_cart_badge_bg || '#f59e0b');
    setColorPair('ctrl-color-cart-badge-text', 'ctrl-hex-cart-badge-text', settings.cart_badge_text_color || settings.navbar_cart_badge_text || '#ffffff');

    // Sub-Menu 3: Kolom Pencarian (Search Bar)
    setSelectValue('search_icon_select', settings.search_icon || settings.navbar_search_icon || 'bi-search');
    setInputValue('search_placeholder_input', settings.search_placeholder || settings.navbar_search_placeholder || 'Cari banner, stiker, logo...');
    setColorPair('ctrl-color-search-icon', 'ctrl-hex-search-icon', settings.search_icon_color || settings.navbar_search_icon_color || '#94a3b8');
    setColorPair('ctrl-color-search-text', 'ctrl-hex-search-text', settings.search_text_color || settings.navbar_search_placeholder_color || '#94a3b8');

    const searchBgSolid = settings.search_bg_solid !== false;
    setCheckboxValue('search_bg_solid_toggle', searchBgSolid);
    const searchBgBox = document.getElementById('search_bg_color_box');
    if (searchBgBox) searchBgBox.classList.toggle('hidden', !searchBgSolid);
    setColorPair('ctrl-color-search-bg', 'ctrl-hex-search-bg', settings.search_bg_color || settings.navbar_search_input_bg || '#f1f5f9');

    const searchBorderEnable = settings.search_border_enable !== false;
    setCheckboxValue('search_border_toggle', searchBorderEnable);
    const searchBorderBox = document.getElementById('search_border_settings_box');
    if (searchBorderBox) searchBorderBox.classList.toggle('hidden', !searchBorderEnable);
    setColorPair('ctrl-color-search-border', 'ctrl-hex-search-border', settings.search_border_color || settings.navbar_search_border_color || '#e2e8f0');

    const searchRadius = settings.search_border_radius !== undefined ? settings.search_border_radius : 16;
    setInputValue('search_border_radius_slider', searchRadius);
    const searchRadiusVal = document.getElementById('search_border_radius_val');
    if (searchRadiusVal) searchRadiusVal.textContent = `${searchRadius}px`;

    // Sub-Menu 4: Tombol Login / Akun
    setSelectValue('login_btn_display_select', settings.login_btn_display || 'icon_text');
    setSelectValue('login_icon_select', settings.login_icon || settings.navbar_login_icon || 'bi-person-fill');
    setInputValue('login_btn_text_input', settings.login_btn_text || 'Login');
    setColorPair('ctrl-color-login-icon', 'ctrl-hex-login-icon', settings.login_icon_color || settings.navbar_login_icon_color || '#334155');
    setColorPair('ctrl-color-login-text', 'ctrl-hex-login-text', settings.login_text_color || settings.navbar_login_text_color || '#334155');
    setColorPair('ctrl-color-login-btn', 'ctrl-hex-login-btn', settings.login_btn_color || settings.navbar_login_btn_bg || '#f1f5f9');

    // 3. Hero Banner
    let heroModel = settings.hero_model || 'non_split';
    if (heroModel === 'model_2') heroModel = 'non_split';
    if (heroModel === 'model_4') heroModel = 'split';
    setSelectValue('hero_model_select', heroModel);
    setRadioValue('hero_model_radio', heroModel);
    syncHeroFormVisibility();

    setInputValue('hero-headline-input', settings.hero_headline || 'Cetak Banner, Desain & Souvenir Harga Instan');
    setInputValue('hero-subheadline-input', settings.hero_subheadline || 'Katalog terpadu dengan kalkulator instan: spesifikasi kustom meteran, jasa desain original, hingga souvenir retail siap kirim ke seluruh Indonesia.');
    setSelectValue('hero-slider-animation-select', settings.hero_slider_animation || 'slide_3s');

    // Render thumbnail multi-banner
    renderBannerThumbnails();

    // 4. Navigasi Kategori
    setRadioValue('category_nav_mode_mobile_radio', settings.category_nav_mode_mobile || 'icon_image');
    setRadioValue('category_nav_mode_desktop_radio', settings.category_nav_mode_desktop || 'icon_image');

    // 5. Gaya Kartu Produk
    setRadioValue('card_product_version_radio', settings.card_product_version || 'v1');

    // 6. Palet Warna & Latar Belakang
    setColorPair('ctrl-color-primary', 'ctrl-hex-primary', settings.primary_color || '#33b589');
    setColorPair('ctrl-color-secondary', 'ctrl-hex-secondary', settings.secondary_color || '#f59e0b');
    setColorPair('ctrl-color-body-bg', 'ctrl-hex-body-bg', settings.body_bg_color || '#f8fafc');
  }

  // ============================================================================
  // 2. ACCORDION CONTROLS (EXPAND & COLLAPSE)
  // ============================================================================
  function setupAccordions() {
    // Parent Main Accordions
    document.querySelectorAll('.theme-accordion-header').forEach(header => {
      header.addEventListener('click', () => {
        const targetId = header.getAttribute('data-target');
        const targetBody = document.getElementById(targetId);
        const chevron = header.querySelector('.theme-accordion-chevron');

        if (!targetBody) return;

        const isCurrentlyOpen = !targetBody.classList.contains('hidden');

        // Optional single-focus behavior
        document.querySelectorAll('.theme-accordion-body').forEach(b => {
          if (b.id !== targetId) b.classList.add('hidden');
        });
        document.querySelectorAll('.theme-accordion-chevron').forEach(c => {
          if (c !== chevron) c.classList.remove('rotate-180');
        });

        if (isCurrentlyOpen) {
          targetBody.classList.add('hidden');
          if (chevron) chevron.classList.remove('rotate-180');
        } else {
          targetBody.classList.remove('hidden');
          if (chevron) chevron.classList.add('rotate-180');
        }
      });
    });

    // Nested Sub-Accordions (Top Bar & Navbar Sub-Menus)
    document.querySelectorAll('.sub-accordion-header').forEach(subHeader => {
      subHeader.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = subHeader.getAttribute('data-target');
        const targetBody = document.getElementById(targetId);
        const chevron = subHeader.querySelector('.sub-accordion-chevron');

        if (!targetBody) return;

        const isCurrentlyOpen = !targetBody.classList.contains('hidden');

        if (isCurrentlyOpen) {
          targetBody.classList.add('hidden');
          if (chevron) chevron.classList.remove('rotate-180');
        } else {
          targetBody.classList.remove('hidden');
          if (chevron) chevron.classList.add('rotate-180');
        }
      });
    });
  }

  // ============================================================================
  // 3. RESIZABLE SIDEBAR (FIX IFRAME MOUSE INTERCEPT VIA BODY.IS-RESIZING)
  // ============================================================================
  function setupResizableSidebar() {
    const sidebar = document.getElementById('theme-editor-sidebar') || document.getElementById('theme-inspector-sidebar');
    const resizeHandle = document.getElementById('sidebar-resize-handle') || document.getElementById('inspector-drag-handle');
    if (!sidebar || !resizeHandle) return;

    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startWidth = sidebar.offsetWidth;
      document.body.classList.add('is-resizing');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const dx = e.clientX - startX; // Pastikan dx dideklarasikan di sini!
      // Batas minimum 280px dan maksimum 390px
      const newWidth = Math.min(Math.max(startWidth + dx, 280), 390);
      sidebar.style.width = `${newWidth}px`;
    });

    window.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.classList.remove('is-resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
  }

  // ============================================================================
  // 4. CANVAS VIEWPORT CONTROLS (FULL HEIGHT & RESPONSIVE FRAMING)
  // ============================================================================
  function setupCanvasControls() {
    const slider = document.getElementById('preview-width-slider');
    const display = document.getElementById('preview-width-display');

    const btnDesktop = document.getElementById('btn-preset-desktop');
    const btnTablet = document.getElementById('btn-preset-tablet');
    const btnMobile = document.getElementById('btn-preset-mobile');

    if (btnDesktop) {
      btnDesktop.addEventListener('click', () => applyCanvasWidth(1200, btnDesktop));
    }
    if (btnTablet) {
      btnTablet.addEventListener('click', () => applyCanvasWidth(768, btnTablet));
    }
    if (btnMobile) {
      btnMobile.addEventListener('click', () => applyCanvasWidth(390, btnMobile));
    }

    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        let matchedBtn = null;
        if (val === 1200) matchedBtn = btnDesktop;
        else if (val === 768) matchedBtn = btnTablet;
        else if (val === 390) matchedBtn = btnMobile;
        applyCanvasWidth(val, matchedBtn);
      });
    }
  }

  function applyCanvasWidth(widthPx, activeBtn = null) {
    const container = document.getElementById('preview-viewport-container');
    const wrapper = document.getElementById('theme-preview-wrapper');
    const iframe = document.getElementById('hero-preview-iframe');
    const slider = document.getElementById('preview-width-slider');
    const display = document.getElementById('preview-width-display');

    const btnDesktop = document.getElementById('btn-preset-desktop');
    const btnTablet = document.getElementById('btn-preset-tablet');
    const btnMobile = document.getElementById('btn-preset-mobile');
    const presetButtons = [btnDesktop, btnTablet, btnMobile];

    const clampedWidth = Math.min(Math.max(parseInt(widthPx, 10), 360), 1200);
    activeWidth = clampedWidth;

    if (slider) slider.value = clampedWidth;
    if (display) display.textContent = `${clampedWidth}px`;

    // Update active button state
    presetButtons.forEach(btn => {
      if (!btn) return;
      if (btn === activeBtn) {
        btn.classList.add('bg-white', 'text-slate-900', 'shadow-xs');
        btn.classList.remove('text-slate-600', 'hover:bg-white/60');
      } else {
        btn.classList.remove('bg-white', 'text-slate-900', 'shadow-xs');
        btn.classList.add('text-slate-600', 'hover:bg-white/60');
      }
    });

    if (!wrapper || !iframe) return;

    if (clampedWidth >= 1150) {
      // MODE DESKTOP: 100% Layar Penuh Edge-to-Edge tanpa frame abu-abu
      if (container) {
        container.classList.remove('p-4', 'sm:p-6', 'p-6');
        container.classList.add('p-0');
      }
      wrapper.style.width = '100%';
      wrapper.style.maxWidth = '100%';
      wrapper.style.height = '100%';
      wrapper.style.minHeight = 'calc(100vh - 3.5rem)';
      wrapper.className = 'preview-viewport-wrapper relative transition-all duration-150 ease-out flex justify-center w-full h-full m-0';

      iframe.className = 'w-full h-full border-0 bg-white';
      iframe.style.height = '100%';
      iframe.style.minHeight = 'calc(100vh - 3.5rem)';
    } else {
      // MODE TABLET & MOBILE: Terpusat di tengah dengan pembungkus berbingkai halus
      if (container) {
        container.classList.remove('p-0');
        container.classList.add('p-4', 'sm:p-6');
      }
      wrapper.style.width = `${clampedWidth}px`;
      wrapper.style.maxWidth = `${clampedWidth}px`;
      wrapper.style.height = '100%';
      wrapper.style.minHeight = 'calc(100vh - 3.5rem)';
      wrapper.className = 'preview-viewport-wrapper relative transition-all duration-150 ease-out flex justify-center shadow-2xl rounded-2xl border border-slate-300 bg-white overflow-hidden my-auto';

      iframe.className = 'w-full h-full border-0 bg-white rounded-2xl';
      iframe.style.height = '100%';
      iframe.style.minHeight = 'calc(100vh - 3.5rem)';
    }

    scheduleLivePreview();
  }

  // ============================================================================
  // 5. COLOR PICKERS & TWO-WAY BINDING
  // ============================================================================
  function setupColorPickers() {
    bindColorPair('ctrl-color-top-bar-bg', 'ctrl-hex-top-bar-bg');
    bindColorPair('ctrl-color-top-bar-text', 'ctrl-hex-top-bar-text');
    bindColorPair('ctrl-color-navbar-bg', 'ctrl-hex-navbar-bg');
    bindColorPair('ctrl-color-navbar-text', 'ctrl-hex-navbar-text');

    // Sub-Menu 2: Cart Colors
    bindColorPair('ctrl-color-cart-icon', 'ctrl-hex-cart-icon');
    bindColorPair('ctrl-color-cart-bg', 'ctrl-hex-cart-bg');
    bindColorPair('ctrl-color-cart-border', 'ctrl-hex-cart-border');
    bindColorPair('ctrl-color-cart-badge', 'ctrl-hex-cart-badge');
    bindColorPair('ctrl-color-cart-badge-text', 'ctrl-hex-cart-badge-text');

    // Sub-Menu 3: Search Colors
    bindColorPair('ctrl-color-search-icon', 'ctrl-hex-search-icon');
    bindColorPair('ctrl-color-search-text', 'ctrl-hex-search-text');
    bindColorPair('ctrl-color-search-bg', 'ctrl-hex-search-bg');
    bindColorPair('ctrl-color-search-border', 'ctrl-hex-search-border');

    // Sub-Menu 4: Login Colors
    bindColorPair('ctrl-color-login-icon', 'ctrl-hex-login-icon');
    bindColorPair('ctrl-color-login-text', 'ctrl-hex-login-text');
    bindColorPair('ctrl-color-login-btn', 'ctrl-hex-login-btn');

    // Global Theme Colors
    bindColorPair('ctrl-color-primary', 'ctrl-hex-primary');
    bindColorPair('ctrl-color-secondary', 'ctrl-hex-secondary');
    bindColorPair('ctrl-color-body-bg', 'ctrl-hex-body-bg');

    // Preset Cepat Body Background
    document.querySelectorAll('.btn-preset-body-bg').forEach(btn => {
      btn.addEventListener('click', () => {
        const hex = btn.getAttribute('data-color');
        if (hex) {
          setColorPair('ctrl-color-body-bg', 'ctrl-hex-body-bg', hex);
          scheduleLivePreview();
        }
      });
    });
  }

  function bindColorPair(pickerId, hexId) {
    const picker = document.getElementById(pickerId);
    const hexInput = document.getElementById(hexId);

    if (picker && hexInput) {
      picker.addEventListener('input', (e) => {
        hexInput.value = e.target.value.toUpperCase();
        scheduleLivePreview();
      });

      hexInput.addEventListener('input', (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          picker.value = val;
          scheduleLivePreview();
        }
      });
    }
  }

  function setColorPair(pickerId, hexId, colorHex) {
    if (!colorHex) return;
    const cleanHex = colorHex.startsWith('#') ? colorHex : '#' + colorHex;
    const picker = document.getElementById(pickerId);
    const hexInput = document.getElementById(hexId);

    if (picker && /^#[0-9A-Fa-f]{6}$/.test(cleanHex)) {
      picker.value = cleanHex;
    }
    if (hexInput) {
      hexInput.value = cleanHex.toUpperCase();
    }
  }

  // ============================================================================
  // 6. LOGO & FAVICON TOKO HANDLERS
  // ============================================================================
  function setupLogoHandlers() {
    const logoUrlInput = document.getElementById('store-logo-url-input');
    const logoFileInput = document.getElementById('store-logo-file-input');
    const logoPreviewImg = document.getElementById('preview-store-logo-img');

    if (logoUrlInput) {
      logoUrlInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (logoPreviewImg && val) {
          logoPreviewImg.src = val;
        }
        scheduleLivePreview();
      });
    }

    if (logoFileInput) {
      logoFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (file.size > 500 * 1024) {
          showToast('Ukuran logo maksimal 500 KB', 'warning');
          return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
          const base64 = ev.target.result;
          if (logoUrlInput) logoUrlInput.value = base64;
          if (logoPreviewImg) logoPreviewImg.src = base64;
          showToast('Logo toko berhasil diunggah', 'success');
          scheduleLivePreview();
        };
        reader.readAsDataURL(file);
      });
    }

    // Favicon Handlers
    const faviconUrlInput = document.getElementById('store-favicon-url-input');
    const faviconFileInput = document.getElementById('store-favicon-file-input');
    const faviconPreviewImg = document.getElementById('preview-store-favicon-img');

    if (faviconUrlInput) {
      faviconUrlInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (faviconPreviewImg && val) {
          faviconPreviewImg.src = val;
        }
        const appFav = document.getElementById('app-favicon');
        if (appFav && val) appFav.href = val;
        scheduleLivePreview();
      });
    }

    if (faviconFileInput) {
      faviconFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (file.size > 200 * 1024) {
          showToast('Ukuran favicon maksimal 200 KB', 'warning');
          return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
          const base64 = ev.target.result;
          if (faviconUrlInput) faviconUrlInput.value = base64;
          if (faviconPreviewImg) faviconPreviewImg.src = base64;
          const appFav = document.getElementById('app-favicon');
          if (appFav) appFav.href = base64;
          showToast('Favicon berhasil diunggah', 'success');
          scheduleLivePreview();
        };
        reader.readAsDataURL(file);
      });
    }
  }

  // ============================================================================
  // 7. MULTI-BANNER MANAGEMENT HANDLERS
  // ============================================================================
  function setupBannerHandlers() {
    const btnAddUrl = document.getElementById('btn-add-hero-banner-url');
    const urlInput = document.getElementById('hero-banner-url-paste-input');
    const fileInput = document.getElementById('hero-banner-dropzone-file-input');

    if (btnAddUrl && urlInput) {
      btnAddUrl.addEventListener('click', () => {
        const url = urlInput.value.trim();
        if (!url) {
          showToast('Masukkan URL banner terlebih dahulu', 'warning');
          return;
        }
        if (currentBanners.length >= 5) {
          showToast('Maksimal 5 banner diperbolehkan', 'warning');
          return;
        }
        currentBanners.push(url);
        urlInput.value = '';
        renderBannerThumbnails();
        showToast('Banner baru ditambahkan', 'success');
        scheduleLivePreview();
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (currentBanners.length >= 5) {
          showToast('Maksimal 5 banner diperbolehkan', 'warning');
          return;
        }

        if (file.size > 800 * 1024) {
          showToast('Ukuran banner maksimal 800 KB', 'warning');
          return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
          currentBanners.push(ev.target.result);
          renderBannerThumbnails();
          showToast('Banner berhasil diunggah', 'success');
          scheduleLivePreview();
        };
        reader.readAsDataURL(file);
      });
    }
  }

  function renderBannerThumbnails() {
    const grid = document.getElementById('hero-banner-thumb-grid');
    const countBadge = document.getElementById('hero-banner-count-badge');
    if (countBadge) countBadge.textContent = currentBanners.length;

    if (!grid) return;

    if (currentBanners.length === 0) {
      grid.innerHTML = `
        <div class="w-full py-3 text-center text-[10px] text-slate-400 font-medium">
          Belum ada banner. Tempel URL atau unggah gambar baru.
        </div>
      `;
      return;
    }

    grid.innerHTML = currentBanners.map((bannerUrl, idx) => `
      <div class="relative shrink-0 w-20 h-14 rounded-lg overflow-hidden border ${idx === 0 ? 'border-emerald-500 shadow-sm' : 'border-slate-300'} bg-slate-100 group">
        <img src="${bannerUrl}" alt="Banner ${idx + 1}" class="w-full h-full object-cover" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 text-xs\\'><i class=\\'bi bi-image\\'></i></div>';" />
        ${idx === 0 ? '<span class="absolute bottom-0 left-0 right-0 bg-emerald-600 text-white text-[8px] font-black text-center py-0.2">#1 UTAMA</span>' : ''}
        <button type="button" class="btn-remove-banner absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition shadow cursor-pointer" data-index="${idx}" title="Hapus Banner">
          <i class="bi bi-x"></i>
        </button>
      </div>
    `).join('');

    grid.querySelectorAll('.btn-remove-banner').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        if (!isNaN(idx) && idx >= 0 && idx < currentBanners.length) {
          currentBanners.splice(idx, 1);
          renderBannerThumbnails();
          showToast('Banner dihapus', 'info');
          scheduleLivePreview();
        }
      });
    });
  }

  // ============================================================================
  // 8. FORM CHANGE LISTENERS (REAL-TIME REACTIVITY)
  // ============================================================================
  function setupFormChangeListeners() {
    const form = document.getElementById('form-theme-editor');
    if (!form) return;

    // Input text & textarea
    form.querySelectorAll('input[type="text"], textarea').forEach(inp => {
      inp.addEventListener('input', scheduleLivePreview);
    });

    // Radio, Checkbox & Select inputs
    form.querySelectorAll('input[type="radio"], input[type="checkbox"], select').forEach(ctrl => {
      ctrl.addEventListener('change', scheduleLivePreview);
    });

    // Khusus sinkronisasi visibilitas navbar branding mode
    const navSelect = document.getElementById('navbar_branding_mode_select');
    if (navSelect) {
      navSelect.addEventListener('change', () => {
        syncNavbarFormVisibility();
        scheduleLivePreview();
      });
    }

    // Khusus sinkronisasi visibilitas model hero banner
    const heroSelect = document.getElementById('hero_model_select');
    if (heroSelect) {
      heroSelect.addEventListener('change', () => {
        syncHeroFormVisibility();
        scheduleLivePreview();
      });
    }

    // Sub-Menu 2: Cart Border Toggle & Radius Slider
    const cartBorderToggle = document.getElementById('cart_border_toggle');
    const cartBorderBox = document.getElementById('cart_border_settings_box');
    if (cartBorderToggle && cartBorderBox) {
      cartBorderToggle.addEventListener('change', () => {
        cartBorderBox.classList.toggle('hidden', !cartBorderToggle.checked);
        scheduleLivePreview();
      });
    }

    const cartRadiusSlider = document.getElementById('cart_border_radius_slider');
    const cartRadiusVal = document.getElementById('cart_border_radius_val');
    if (cartRadiusSlider && cartRadiusVal) {
      cartRadiusSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        cartRadiusVal.textContent = val === '24' ? '24px (Bulat)' : `${val}px`;
        scheduleLivePreview();
      });
    }

    // Sub-Menu 3: Search Solid BG Toggle
    const searchBgSolidToggle = document.getElementById('search_bg_solid_toggle');
    const searchBgBox = document.getElementById('search_bg_color_box');
    if (searchBgSolidToggle && searchBgBox) {
      searchBgSolidToggle.addEventListener('change', () => {
        searchBgBox.classList.toggle('hidden', !searchBgSolidToggle.checked);
        scheduleLivePreview();
      });
    }

    // Sub-Menu 3: Search Border Toggle & Radius Slider
    const searchBorderToggle = document.getElementById('search_border_toggle');
    const searchBorderBox = document.getElementById('search_border_settings_box');
    if (searchBorderToggle && searchBorderBox) {
      searchBorderToggle.addEventListener('change', () => {
        searchBorderBox.classList.toggle('hidden', !searchBorderToggle.checked);
        scheduleLivePreview();
      });
    }

    const searchRadiusSlider = document.getElementById('search_border_radius_slider');
    const searchRadiusVal = document.getElementById('search_border_radius_val');
    if (searchRadiusSlider && searchRadiusVal) {
      searchRadiusSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        searchRadiusVal.textContent = `${val}px`;
        scheduleLivePreview();
      });
    }
  }

  function syncNavbarFormVisibility() {
    const select = document.getElementById('navbar_branding_mode_select');
    const val = select ? select.value : 'logo_landscape';
    const nameToggleBox = document.getElementById('navbar-show-desktop-name-box');
    const logoUploadBox = document.getElementById('navbar-logo-upload-box');

    if (nameToggleBox) {
      if (val === 'text_only') {
        nameToggleBox.classList.add('hidden');
      } else {
        nameToggleBox.classList.remove('hidden');
      }
    }
    if (logoUploadBox) {
      if (val === 'text_only') {
        logoUploadBox.classList.add('opacity-50', 'pointer-events-none');
      } else {
        logoUploadBox.classList.remove('opacity-50', 'pointer-events-none');
      }
    }
  }

  function syncHeroFormVisibility() {
    const modelSelect = document.getElementById('hero_model_select');
    const val = modelSelect ? modelSelect.value : 'non_split';

    const textBox = document.getElementById('hero-text-fields-box');
    const bannerBox = document.getElementById('hero-banner-management-box');
    const animationBox = document.getElementById('hero-slider-animation-box');

    if (val === 'non_split') {
      if (textBox) textBox.classList.add('hidden');
      if (bannerBox) bannerBox.classList.remove('hidden');
      if (animationBox) animationBox.classList.remove('hidden');
    } else if (val === 'split') {
      if (textBox) textBox.classList.remove('hidden');
      if (bannerBox) bannerBox.classList.remove('hidden');
      if (animationBox) animationBox.classList.remove('hidden');
    } else if (val === 'model_1') {
      if (textBox) textBox.classList.remove('hidden');
      if (bannerBox) bannerBox.classList.add('hidden');
      if (animationBox) animationBox.classList.add('hidden');
    }
  }

  function scheduleLivePreview() {
    if (updatePreviewTimer) clearTimeout(updatePreviewTimer);
    updatePreviewTimer = setTimeout(() => {
      updateLivePreview();
    }, 100);
  }

  // ============================================================================
  // 9. VISUAL EDIT INTERACTION (SILENT: CLICK SECTION -> EXPAND ACCORDION TANPA TOAST)
  // ============================================================================
  function setupVisualEditToggle() {
    const btn = document.getElementById('btn-toggle-inspector');
    if (!btn) return;

    btn.addEventListener('click', () => {
      isVisualEditActive = !isVisualEditActive;
      syncVisualEditState();
    });
  }

  function syncVisualEditState() {
    const btn = document.getElementById('btn-toggle-inspector');
    const iframe = document.getElementById('hero-preview-iframe');

    if (btn) {
      if (isVisualEditActive) {
        btn.className = 'px-2.5 py-1.5 rounded-lg text-xs font-bold border border-emerald-400 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20 flex items-center gap-1.5 transition cursor-pointer shadow-xs';
        btn.innerHTML = '<i class="bi bi-cursor-fill text-emerald-600"></i><span>Edit Visual (Aktif)</span>';
        // Interaksi hening (silent): tidak menampilkan notifikasi/toast
      } else {
        btn.className = 'px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer shadow-2xs';
        btn.innerHTML = '<i class="bi bi-cursor-fill text-slate-500"></i><span>Edit Visual</span>';
      }
    }

    if (iframe && iframe.contentDocument && iframe.contentDocument.body) {
      iframe.contentDocument.body.classList.toggle('visual-edit-active', isVisualEditActive);
    }
  }

  function setupPostMessageListener() {
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'THEME_EDITOR_SELECT_SECTION') {
        openAccordionBySection(e.data.section);
      }
    });
  }

  function openAccordionBySection(section) {
    const sectionMap = {
      'topbar': { targetId: 'body-top-bar', accordionAttr: 'top-bar' },
      'header': { targetId: 'body-top-bar', accordionAttr: 'top-bar' },
      'navbar': { targetId: 'body-navbar-identity', accordionAttr: 'navbar-identity' },
      'navbar-cart': { targetId: 'body-navbar-identity', subTargetId: 'sub-body-navbar-cart', accordionAttr: 'navbar-identity' },
      'navbar-search': { targetId: 'body-navbar-identity', subTargetId: 'sub-body-navbar-search', accordionAttr: 'navbar-identity' },
      'navbar-login': { targetId: 'body-navbar-identity', subTargetId: 'sub-body-navbar-login', accordionAttr: 'navbar-identity' },
      'hero': { targetId: 'body-hero-banner', accordionAttr: 'hero-banner' },
      'category': { targetId: 'body-nav-category', accordionAttr: 'nav-category' },
      'products': { targetId: 'body-card-product', accordionAttr: 'card-product' },
      'colors': { targetId: 'body-color-palette', accordionAttr: 'color-palette' }
    };

    const item = sectionMap[section];
    if (!item) return;

    // Tutup akordeon lain & buka akordeon target
    document.querySelectorAll('.theme-accordion-body').forEach(b => {
      if (b.id === item.targetId) {
        b.classList.remove('hidden');
      } else {
        b.classList.add('hidden');
      }
    });

    document.querySelectorAll('.theme-accordion-item').forEach(acc => {
      const chev = acc.querySelector('.theme-accordion-chevron');
      if (acc.getAttribute('data-accordion') === item.accordionAttr) {
        if (chev) chev.classList.add('rotate-180');
        acc.classList.remove('accordion-flash-highlight');
        void acc.offsetWidth; // trigger reflow
        acc.classList.add('accordion-flash-highlight');
        acc.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        if (chev) chev.classList.remove('rotate-180');
      }
    });

    // Jika memiliki target sub-akordeon spesifik, buka sub-akordeon tersebut
    if (item.subTargetId) {
      const subBody = document.getElementById(item.subTargetId);
      if (subBody) {
        subBody.classList.remove('hidden');
        const subHeader = document.querySelector(`[data-target="${item.subTargetId}"]`);
        if (subHeader) {
          const subChev = subHeader.querySelector('.sub-accordion-chevron');
          if (subChev) subChev.classList.add('rotate-180');
          setTimeout(() => {
            subHeader.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
        }
      }
    }

    // Interaksi hening (silent): tidak memunculkan toast/pesan apa pun di layar
  }

  // ============================================================================
  // 10. LIVE PREVIEW ENGINE (SRCDOC GENERATOR & DATA-SECTION ENRICHMENT)
  // ============================================================================
  function updateLivePreview() {
    const iframe = document.getElementById('hero-preview-iframe');
    if (!iframe) return;

    // Form inputs
    const storeName = getInputValue('store-name-input') || 'Songer Creative';
    const storeTagline = getInputValue('store-tagline-input') || 'Digital Printing & Percetakan Terpadu';
    const storeLogo = getInputValue('store-logo-url-input') || 'assets/images/logo-songer-creative.png';
    const navbarMode = getSelectValue('navbar_branding_mode_select') || getRadioValue('navbar_branding_mode_radio') || 'logo_landscape';
    const showDesktopName = document.getElementById('show-header-store-name-toggle')?.checked !== false;

    const topBarBg = getInputValue('ctrl-hex-top-bar-bg') || '#0f172a';
    const topBarText = getInputValue('ctrl-hex-top-bar-text') || '#f8fafc';
    const navbarBg = getInputValue('ctrl-hex-navbar-bg') || '#ffffff';
    const navbarText = getInputValue('ctrl-hex-navbar-text') || '#0f172a';

    // Sub-Menu 2: Tombol Keranjang (Cart)
    const cartIcon = getSelectValue('cart_icon_select') || 'bi-bag-fill';
    const cartIconColor = getInputValue('ctrl-hex-cart-icon') || '#334155';
    const cartBgColor = getInputValue('ctrl-hex-cart-bg') || '#f1f5f9';
    const cartBorderEnable = document.getElementById('cart_border_toggle')?.checked !== false;
    const cartBorderColor = getInputValue('ctrl-hex-cart-border') || '#e2e8f0';
    const cartBorderRadius = getInputValue('cart_border_radius_slider') || '16';
    const cartBadgeColor = getInputValue('ctrl-hex-cart-badge') || '#f59e0b';
    const cartBadgeTextColor = getInputValue('ctrl-hex-cart-badge-text') || '#ffffff';

    // Sub-Menu 3: Kolom Pencarian (Search Bar)
    const searchIcon = getSelectValue('search_icon_select') || 'bi-search';
    const searchPlaceholder = getInputValue('search_placeholder_input') || 'Cari banner, stiker, logo...';
    const searchIconColor = getInputValue('ctrl-hex-search-icon') || '#94a3b8';
    const searchTextColor = getInputValue('ctrl-hex-search-text') || '#94a3b8';
    const searchBgSolid = document.getElementById('search_bg_solid_toggle')?.checked !== false;
    const searchBgColor = getInputValue('ctrl-hex-search-bg') || '#f1f5f9';
    const searchBorderEnable = document.getElementById('search_border_toggle')?.checked !== false;
    const searchBorderColor = getInputValue('ctrl-hex-search-border') || '#e2e8f0';
    const searchBorderRadius = getInputValue('search_border_radius_slider') || '16';

    // Sub-Menu 4: Tombol Login / Akun
    const loginBtnDisplay = getSelectValue('login_btn_display_select') || 'icon_text';
    const loginIcon = getSelectValue('login_icon_select') || 'bi-person-fill';
    const loginBtnText = getInputValue('login_btn_text_input') || 'Login';
    const loginIconColor = getInputValue('ctrl-hex-login-icon') || '#334155';
    const loginTextColor = getInputValue('ctrl-hex-login-text') || '#334155';
    const loginBtnColor = getInputValue('ctrl-hex-login-btn') || '#f1f5f9';

    const enableGreeting = document.getElementById('enable-greeting-toggle')?.checked !== false;
    const greetingText = getInputValue('top-bar-greeting-text-input') || ('Selamat datang di ' + storeName);
    const enablePromo = document.getElementById('enable-promo-countdown-toggle')?.checked !== false;
    const promoLabel = getInputValue('top-bar-promo-text-input') || 'Promo Kilat Berakhir Dalam:';
    const promoEnd = getInputValue('top-bar-promo-end-input') || '02 Hari Lagi';

    const heroModel = getSelectValue('hero_model_select') || getRadioValue('hero_model_radio') || 'non_split';
    const heroHeadline = getInputValue('hero-headline-input') || 'Cetak Banner, Desain & Souvenir Harga Instan';
    const heroSubheadline = getInputValue('hero-subheadline-input') || 'Katalog terpadu dengan kalkulator instan: spesifikasi kustom meteran, jasa desain original, hingga souvenir retail siap kirim ke seluruh Indonesia.';
    const sliderAnim = getSelectValue('hero-slider-animation-select') || 'slide_3s';

    const catModeMobile = getRadioValue('category_nav_mode_mobile_radio') || 'icon_image';
    const catModeDesktop = getRadioValue('category_nav_mode_desktop_radio') || 'icon_image';
    const cardVersion = getRadioValue('card_product_version_radio') || 'v1';

    const primaryColor = getInputValue('ctrl-hex-primary') || '#33b589';
    const secondaryColor = getInputValue('ctrl-hex-secondary') || '#f59e0b';
    const bodyBg = getInputValue('ctrl-hex-body-bg') || '#f8fafc';

    // Banners
    const banners = currentBanners.length > 0 ? currentBanners : DEFAULT_BANNERS;

    // --- A. TOP BAR HTML (Sapaan Kiri + Promo Countdown Kanan) ---
    let topBarHtml = '';
    if (enableGreeting || enablePromo) {
      topBarHtml = `
        <div class="w-full text-[11px] sm:text-xs py-1.5 px-3 sm:px-6 relative z-30 transition-colors border-b shrink-0 select-none" style="background-color: ${topBarBg}; color: ${topBarText}; border-color: rgba(255, 255, 255, 0.08);">
          <div class="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <!-- Sisi Kiri: Sapaan Pengunjung Dinamis -->
            <div class="flex items-center gap-2 min-w-0">
              ${enableGreeting ? `
                <span class="font-medium truncate tracking-tight">${escapeHtml(greetingText)}</span>
              ` : '<span></span>'}
            </div>

            <!-- Sisi Kanan: Hitung Mundur Promo Dinamis -->
            <div class="flex items-center gap-1.5 text-[10px] sm:text-[11px] shrink-0 font-medium">
              ${enablePromo ? `
                <i class="bi bi-stopwatch text-emerald-400 shrink-0"></i>
                <span class="truncate font-semibold">${escapeHtml(promoLabel)} <span class="text-emerald-300 font-bold">${escapeHtml(promoEnd)}</span></span>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }

    // --- B. NAVBAR HTML (Persis Etalase Asli index.html) ---
    const desktopStoreNameHtml = showDesktopName ? `
      <div class="border-l border-slate-200/80 pl-2.5 sm:pl-3 hidden sm:flex flex-col justify-center min-w-0 shrink-0">
        <span class="font-extrabold text-sm sm:text-base tracking-tight truncate leading-tight" style="color: ${navbarText};">${escapeHtml(storeName)}</span>
        <span class="text-[11px] text-slate-500 block truncate max-w-[200px] leading-tight mt-0.5">${escapeHtml(storeTagline)}</span>
      </div>
    ` : '';

    let brandHtml = '';
    if (navbarMode === 'text_only') {
      brandHtml = `
        <div class="flex flex-col justify-center min-w-0 shrink-0">
          <span class="font-black text-sm sm:text-base tracking-tight truncate leading-tight" style="color: ${navbarText};">${escapeHtml(storeName)}</span>
          <span class="text-[11px] text-slate-500 block truncate max-w-[200px] leading-tight mt-0.5">${escapeHtml(storeTagline)}</span>
        </div>
      `;
    } else if (navbarMode === 'logo_square') {
      brandHtml = `
        <div class="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <div class="h-10 flex items-center shrink-0">
            <img src="${storeLogo}" alt="Logo Toko" class="h-9 w-9 object-contain rounded-xl border border-slate-200/80 bg-white p-0.5 shadow-2xs" onerror="this.onerror=null; this.outerHTML='<span class=\\'font-black text-sm\\' style=\\'color: ${navbarText};\\'>${escapeHtml(storeName)}</span>';" />
          </div>
          ${desktopStoreNameHtml}
        </div>
      `;
    } else {
      // Landscape Logo (Default Etalase)
      brandHtml = `
        <div class="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <div class="h-10 flex items-center shrink-0">
            <img src="${storeLogo}" alt="Logo Toko" class="h-8 sm:h-9 w-auto max-w-[120px] sm:max-w-[160px] object-contain" onerror="this.onerror=null; this.outerHTML='<span class=\\'font-black text-base\\' style=\\'color: ${navbarText};\\'>${escapeHtml(storeName)}</span>';" />
          </div>
          ${desktopStoreNameHtml}
        </div>
      `;
    }

    // Sub-Menu 3: Search Bar Preview Element
    const searchBgValue = searchBgSolid ? searchBgColor : 'transparent';
    const searchBorderStyle = searchBorderEnable ? `border: 1px solid ${searchBorderColor};` : 'border: 1px solid transparent;';
    const searchRadiusStyle = `border-radius: ${searchBorderRadius}px;`;

    const searchInputHtml = `
      <div data-section="navbar-search" class="flex-1 min-w-0 max-w-lg mx-2 sm:mx-4 relative">
        <div class="relative w-full">
          <i class="bi ${searchIcon} text-xs absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style="color: ${searchIconColor};"></i>
          <div class="w-full text-xs pl-10 pr-4 py-2 sm:py-2.5 font-medium truncate shadow-inner select-none cursor-text transition-all" style="background-color: ${searchBgValue}; color: ${searchTextColor}; ${searchBorderStyle} ${searchRadiusStyle}">
            ${escapeHtml(searchPlaceholder)}
          </div>
        </div>
      </div>
    `;

    // Sub-Menu 4: Login Button Preview Element
    let loginContentHtml = '';
    if (loginBtnDisplay === 'icon_only') {
      loginContentHtml = `<i class="bi ${loginIcon} text-sm" style="color: ${loginIconColor};"></i>`;
    } else if (loginBtnDisplay === 'text_only') {
      loginContentHtml = `<span class="font-bold text-xs" style="color: ${loginTextColor};">${escapeHtml(loginBtnText)}</span>`;
    } else {
      // icon_text (default)
      loginContentHtml = `
        <i class="bi ${loginIcon} text-sm" style="color: ${loginIconColor};"></i>
        <span class="hidden sm:inline font-bold text-xs" style="color: ${loginTextColor};">${escapeHtml(loginBtnText)}</span>
      `;
    }

    const loginBtnHtml = `
      <div data-section="navbar-login" class="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-2xl text-xs font-bold border border-slate-200 shadow-xs shrink-0 cursor-pointer transition hover:opacity-95" style="background-color: ${loginBtnColor};">
        ${loginContentHtml}
      </div>
    `;

    // Sub-Menu 2: Cart Button Preview Element
    const cartBorderStyle = cartBorderEnable ? `border: 1px solid ${cartBorderColor};` : 'border: 1px solid transparent;';
    const cartRadiusStyle = `border-radius: ${cartBorderRadius}px;`;

    const cartBtnHtml = `
      <div data-section="navbar-cart" class="relative p-2 sm:p-2.5 flex items-center justify-center shadow-xs shrink-0 cursor-pointer transition hover:opacity-95" style="background-color: ${cartBgColor}; ${cartBorderStyle} ${cartRadiusStyle}">
        <div class="relative flex items-center justify-center">
          <i class="bi ${cartIcon} text-sm" style="color: ${cartIconColor};"></i>
          <span class="absolute -top-2.5 -right-2.5 font-black text-[10px] min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center shadow-md border-2 border-white" style="background-color: ${cartBadgeColor}; color: ${cartBadgeTextColor};">
            2
          </span>
        </div>
      </div>
    `;

    const navbarHtml = `
      <header class="border-b shadow-xs sticky top-0 z-40 transition-colors select-none" style="background-color: ${navbarBg}; border-color: rgba(148, 163, 184, 0.25);">
        <div class="px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2.5 sm:gap-6 max-w-7xl mx-auto w-full">
          <!-- Kiri: Brand Logo & Store Info -->
          ${brandHtml}

          <!-- Tengah: Input Pencarian Cerdas Desktop -->
          ${searchInputHtml}

          <!-- Kanan: Tombol Login & Ikon Keranjang Belanja -->
          <div class="flex items-center gap-1.5 sm:gap-3 shrink-0">
            ${loginBtnHtml}
            ${cartBtnHtml}
          </div>
        </div>
      </header>
    `;

    // --- C. HERO BANNER HTML (Non-split: Murni Banner Gambar + Dot Navigasi) ---
    let heroHtml = '';
    if (heroModel === 'non_split') {
      const slides = banners.map((b, i) => `
        <div class="hero-slide ${i === 0 ? 'block' : 'hidden'} absolute inset-0 transition-opacity duration-700" data-index="${i}">
          <img src="${b}" alt="Hero Banner ${i + 1}" class="w-full h-full object-cover" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-slate-800 text-white font-black text-xl\\'>Banner Promo Percetakan</div>';" />
        </div>
      `).join('');

      const dots = banners.map((_, i) => `
        <button type="button" class="hero-dot w-2 h-2 rounded-full transition-all cursor-pointer ${i === 0 ? 'w-6 bg-emerald-500' : 'bg-white/70 hover:bg-white'}" data-index="${i}"></button>
      `).join('');

      heroHtml = `
        <div class="relative w-full rounded-2xl overflow-hidden shadow-sm aspect-[16/5] sm:aspect-[16/5] md:aspect-[9/2] bg-slate-900 group">
          <div class="w-full h-full relative">
            ${slides}
          </div>
          <!-- Dot Navigasi Melayang Murni di Bawah Banner (Tanpa Tombol CTA Liar) -->
          <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 px-3 py-1 rounded-full bg-slate-950/30 backdrop-blur-xs">
            ${dots}
          </div>
        </div>
      `;
    } else if (heroModel === 'split') {
      const slides = banners.map((b, i) => `
        <div class="hero-slide ${i === 0 ? 'block' : 'hidden'} absolute inset-0 transition-opacity duration-700" data-index="${i}">
          <img src="${b}" alt="Banner ${i + 1}" class="w-full h-full object-cover rounded-xl" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 text-sm\\'><i class=\\'bi bi-image\\'></i></div>';" />
        </div>
      `).join('');

      const dots = banners.map((_, i) => `
        <button type="button" class="hero-dot w-2 h-2 rounded-full transition-all cursor-pointer ${i === 0 ? 'w-5 bg-emerald-500' : 'bg-slate-300'}" data-index="${i}"></button>
      `).join('');

      heroHtml = `
        <div class="w-full bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div class="md:col-span-5 space-y-3">
            <span class="inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200">
              Percetakan Digital Terpadu
            </span>
            <h2 class="font-black text-lg sm:text-2xl text-slate-900 leading-tight">${escapeHtml(heroHeadline)}</h2>
            <p class="text-xs text-slate-600 leading-relaxed">${escapeHtml(heroSubheadline)}</p>
            <div class="flex items-center gap-2 pt-1">
              <button class="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm hover:opacity-95 transition" style="background-color: ${primaryColor};">
                Katalog Lengkap
              </button>
              <button class="px-4 py-2 rounded-xl font-bold text-xs border border-slate-300 hover:bg-slate-50 transition text-slate-700">
                Pesan Custom
              </button>
            </div>
          </div>
          <div class="md:col-span-7">
            <div class="relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-sm bg-slate-100">
              ${slides}
              <div class="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 px-2 py-0.5 rounded-full bg-slate-950/30">
                ${dots}
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      // Model 1: Text-Only Promo
      heroHtml = `
        <div class="w-full rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 text-center space-y-2.5" style="background: linear-gradient(135deg, ${primaryColor}12, #ffffff 75%);">
          <span class="inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-white border border-emerald-200 shadow-2xs">
            Promo Spesial Percetakan
          </span>
          <h2 class="font-black text-xl sm:text-3xl text-slate-900 max-w-2xl mx-auto leading-tight">${escapeHtml(heroHeadline)}</h2>
          <p class="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">${escapeHtml(heroSubheadline)}</p>
          <div class="flex items-center justify-center gap-2 pt-1">
            <button class="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm transition hover:opacity-95" style="background-color: ${primaryColor};">
              Mulai Pesan Sekarang
            </button>
            <button class="px-4 py-2 rounded-xl font-bold text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition">
              Kalkulator Meteran PxL
            </button>
          </div>
        </div>
      `;
    }

    // --- D. NAVIGASI KATEGORI (Peeking Effect Persis Etalase Toko Asli) ---
    const storeCategories = [
      { name: 'Semua', icon: 'bi-grid-fill', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', active: true },
      { name: 'Produk Terlaris', icon: 'bi-fire', badge: 'bg-amber-50 text-amber-600 border-amber-200', active: false },
      { name: 'Sedang Promo', icon: 'bi-ticket-perforated-fill', badge: 'bg-rose-50 text-rose-600 border-rose-200', active: false },
      { name: 'Spanduk & Banner', icon: 'bi-aspect-ratio-fill', badge: 'bg-slate-50 text-slate-700 border-slate-200', active: false },
      { name: 'Stiker & Label', icon: 'bi-stickies-fill', badge: 'bg-slate-50 text-slate-700 border-slate-200', active: false },
      { name: 'Kartu Nama & Brosur', icon: 'bi-layers-fill', badge: 'bg-slate-50 text-slate-700 border-slate-200', active: false },
      { name: 'Merchandise Souvenir', icon: 'bi-gift-fill', badge: 'bg-slate-50 text-slate-700 border-slate-200', active: false },
      { name: 'Sablon & Konveksi', icon: 'bi-person-badge-fill', badge: 'bg-slate-50 text-slate-700 border-slate-200', active: false }
    ];

    let catNavHtml = '';
    if (catModeDesktop === 'pills_text' || catModeMobile === 'pills_text') {
      catNavHtml = `
        <div class="space-y-2">
          <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            ${storeCategories.map(c => `
              <button class="px-3.5 py-1.5 rounded-full font-bold text-xs shrink-0 transition ${c.active ? 'text-white shadow-2xs' : 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50'}" style="${c.active ? `background-color: ${primaryColor};` : ''}">
                ${c.name}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      // Icon Visual & Gambar dengan Peeking Effect Horizontal Scroll
      catNavHtml = `
        <div class="space-y-2">
          <div class="flex items-center gap-2.5 overflow-x-auto py-1 scrollbar-none">
            ${storeCategories.map(c => `
              <div class="shrink-0 flex flex-col items-center justify-center p-2.5 rounded-2xl border ${c.active ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-400/30' : 'border-slate-200 bg-white hover:border-slate-300'} transition cursor-pointer text-center group min-w-[85px] sm:min-w-[95px]">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-1 transition ${c.badge}">
                  <i class="bi ${c.icon}"></i>
                </div>
                <div class="font-bold text-[11px] text-slate-800 truncate max-w-[80px] sm:max-w-[90px]">${c.name}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // --- E. GRID PRODUK (6 Kolom Desktop / 2 Kolom Mobile + Footer Strip Ganda) ---
    const demoProducts = [
      { name: 'Spanduk Banner Fleksi Outdoor High-Res 280gsm', price: 'Rp 25.000', origPrice: 'Rp 30.000', sold: '312 terjual', rating: '4.9', discount: '- % 17', strip1: 'Proses Hanya Dalam 1Jam', strip2: 'Variasi Paket Tersedia', opt: '12 Pilihan', img: 'assets/images/logo-songer-creative.png' },
      { name: 'Stiker Label Kemasan Vinyl A3+ Waterproof Kisscut', price: 'Rp 15.000', origPrice: 'Rp 20.000', sold: '540 terjual', rating: '4.8', discount: '- % 25', strip1: 'Proses Cepat 1 Hari Jadi', strip2: 'Variasi Paket Tersedia', opt: '8 Pilihan', img: 'assets/images/logo-songer-creative.png' },
      { name: 'X-Banner Stand 60x160cm Komplit Rangka & Banner', price: 'Rp 65.000', origPrice: 'Rp 75.000', sold: '189 terjual', rating: '5.0', discount: '- % 13', strip1: 'Rangka Kuat Kokoh', strip2: 'Variasi Paket Tersedia', opt: '4 Pilihan', img: 'assets/images/logo-songer-creative.png' },
      { name: 'Kaos Sablon DTF Premium Cotton Combed 30s', price: 'Rp 55.000', origPrice: 'Rp 65.000', sold: '98 terjual', rating: '4.9', discount: '- % 15', strip1: 'Bahan Adem 100% Cotton', strip2: 'Variasi Ukuran S-XXL', opt: '6 Pilihan', img: 'assets/images/logo-songer-creative.png' },
      { name: 'Kartu Nama Bisnis Box 100 Pcs Finishing Doff', price: 'Rp 35.000', origPrice: 'Rp 45.000', sold: '420 terjual', rating: '4.9', discount: '- % 22', strip1: 'Bahan Tebal Art Cartoon', strip2: 'Free Box Transparan', opt: 'Gratis Desain', img: 'assets/images/logo-songer-creative.png' },
      { name: 'Brosur Promosi Art Paper 150gsm Cetak Full Color', price: 'Rp 120.000', origPrice: 'Rp 150.000', sold: '145 terjual', rating: '4.8', discount: '- % 20', strip1: 'Warna Tajam CMYK HD', strip2: 'Paket Hemat 500 Pcs', opt: 'Free Ongkir', img: 'assets/images/logo-songer-creative.png' }
    ];

    let productCardsHtml = '';
    if (cardVersion === 'v2') {
      // Versi 2: Bordered Minimalist
      productCardsHtml = demoProducts.map(p => `
        <div class="rounded-xl border border-slate-300 bg-white p-3 flex flex-col justify-between hover:border-slate-800 transition">
          <div class="space-y-2">
            <div class="w-full aspect-square rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-3xl font-bold">
              <i class="bi bi-box-seam"></i>
            </div>
            <div class="flex items-center justify-between text-[10px]">
              <span class="font-bold text-amber-500">★ ${p.rating}</span>
              <span class="text-slate-400">${p.sold}</span>
            </div>
            <div class="font-bold text-xs text-slate-900 line-clamp-2 leading-snug">${p.name}</div>
          </div>
          <div class="pt-2 border-t border-slate-100 mt-2">
            <span class="text-[10px] text-slate-400 line-through">${p.origPrice}</span>
            <div class="font-black text-xs text-slate-900">${p.price}</div>
          </div>
        </div>
      `).join('');
    } else {
      // Versi 1 & 3: Standard Square / Dual Footer Strip Grid (Persis Wireframe Etalase Pembeli)
      productCardsHtml = demoProducts.map(p => `
        <div class="h-full flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg transition-all cursor-pointer group relative">
          <!-- Image Box (1:1 Persegi) -->
          <div class="relative w-full aspect-square bg-slate-100 overflow-hidden shrink-0 rounded-t-2xl flex items-center justify-center">
            <img src="${p.img}" alt="${p.name}" class="w-full h-full object-cover transition group-hover:scale-105 duration-300" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 text-2xl font-bold\\'><i class=\\'bi bi-box-seam\\'></i></div>';" />
            <!-- Badge Diskon Pojok Kanan Atas Overlay Gambar -->
            <div class="absolute top-2 right-2 text-[10px] font-black px-1.5 py-0.5 rounded-lg shadow-md uppercase tracking-wider text-white" style="background-color: ${primaryColor};">
              <span>${p.discount}</span>
            </div>
          </div>

          <!-- Body -->
          <div class="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-2">
            <div class="space-y-1">
              <!-- Judul Produk: 2 Baris Rapi -->
              <h4 class="line-clamp-2 text-xs font-semibold h-8 leading-snug text-slate-800 group-hover:text-emerald-700 transition" title="${p.name}">
                ${p.name}
              </h4>

              <!-- Baris Fitur/Label: Rating Bintang + Label Khusus -->
              <div class="flex items-center gap-1.5 pt-0.5 flex-wrap">
                <span class="text-amber-500 font-bold text-[10px] flex items-center gap-0.5 shrink-0">
                  ★ ${p.rating}
                </span>
                <span class="inline-flex items-center text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Free Potong
                </span>
              </div>
            </div>

            <!-- Baris Harga: Harga Coret di Atas, Harga Final & Terjual di Bawah -->
            <div class="pt-1.5 border-t border-slate-100 flex items-end justify-between gap-1 mt-auto">
              <div class="flex flex-col justify-end min-w-0">
                <span class="text-[10px] line-through text-slate-400 leading-none mb-0.5">
                  ${p.origPrice}
                </span>
                <span class="text-xs sm:text-sm font-extrabold whitespace-nowrap text-emerald-700">
                  ${p.price}
                </span>
              </div>
              <div class="ml-auto shrink-0 text-right text-[10px] text-slate-500 font-medium">
                ${p.sold}
              </div>
            </div>
          </div>

          <!-- DUA STRIP FOOTER KARTU (Full Width di Sisi Terbawah) -->
          <div class="w-full shrink-0 border-t border-slate-100">
            <div class="w-full py-0.5 px-2 bg-emerald-50 text-[9px] font-bold text-emerald-700 border-t border-emerald-100/60 flex items-center justify-between">
              <span class="flex items-center gap-1 truncate"><i class="bi bi-clock-history text-[9px]"></i> ${p.strip1}</span>
            </div>
            <div class="w-full py-0.5 px-2 bg-amber-50 text-[9px] font-bold text-amber-800 border-t border-amber-100/60 flex items-center justify-between">
              <span class="truncate">${p.strip2}</span>
              <span class="text-[8px] text-amber-600 font-semibold shrink-0">${p.opt}</span>
            </div>
          </div>
        </div>
      `).join('');
    }

    const gridHtml = `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-black text-sm text-slate-900">Etalase Produk Percetakan</h3>
            <p class="text-[10px] text-slate-400">Dicetak dengan mesin digital printing beresolusi tinggi</p>
          </div>
          <span class="text-xs font-bold text-emerald-700 cursor-pointer hover:underline">Lihat Semua &rarr;</span>
        </div>

        <!-- 6 Kolom di Desktop / 2 Kolom di Mobile -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
          ${productCardsHtml}
        </div>
      </div>
    `;

    // --- SCRIPT ROTASI SLIDER & INTERAKSI EDIT VISUAL DI DALAM IFRAME ---
    const sliderIntervalMs = sliderAnim === 'slide_5s' ? 5000 : (sliderAnim === 'slide_3s' ? 3000 : (sliderAnim === 'fade_3s' ? 3000 : 0));
    const iframeScript = `
      (function() {
        // --- 1. HERO SLIDER LOGIC ---
        const slides = document.querySelectorAll('.hero-slide');
        const dots = document.querySelectorAll('.hero-dot');
        let currentIdx = 0;
        let timer = null;

        function showSlide(idx) {
          if (slides.length <= 1) return;
          slides.forEach((s, i) => {
            if (i === idx) {
              s.classList.remove('hidden');
              s.classList.add('block');
            } else {
              s.classList.add('hidden');
              s.classList.remove('block');
            }
          });
          dots.forEach((d, i) => {
            if (i === idx) {
              d.classList.add('w-6', 'bg-emerald-500');
              d.classList.remove('w-2', 'bg-white/70', 'bg-slate-300');
            } else {
              d.classList.remove('w-6', 'bg-emerald-500');
              d.classList.add('w-2', 'bg-white/70');
            }
          });
          currentIdx = idx;
        }

        dots.forEach((dot, idx) => {
          dot.addEventListener('click', () => {
            showSlide(idx);
            resetTimer();
          });
        });

        function nextSlide() {
          let next = (currentIdx + 1) % slides.length;
          showSlide(next);
        }

        function resetTimer() {
          if (timer) clearInterval(timer);
          if (${sliderIntervalMs} > 0 && slides.length > 1) {
            timer = setInterval(nextSlide, ${sliderIntervalMs});
          }
        }

        resetTimer();

        // --- 2. VISUAL EDIT INTERACTION LISTENER ---
        document.querySelectorAll('[data-section]').forEach(sec => {
          sec.addEventListener('click', (e) => {
            if (document.body.classList.contains('visual-edit-active')) {
              e.preventDefault();
              e.stopPropagation();
              const secName = sec.getAttribute('data-section');
              try {
                window.parent.postMessage({ type: 'THEME_EDITOR_SELECT_SECTION', section: secName }, '*');
              } catch (err) {
                console.error(err);
              }
            }
          });
        });
      })();
    `;

    // Dokumen HTML Lengkap untuk iframe.srcdoc dengan data-section enrichment
    const docHtml = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
          }
          body {
            background-color: ${bodyBg};
            font-family: 'Inter', -apple-system, sans-serif;
            overflow-x: hidden;
            overflow-y: auto;
            -webkit-font-smoothing: antialiased;
          }

          /* Scrollbar ultra-ramping & minimalis */
          ::-webkit-scrollbar {
            width: 5px;
            height: 5px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 9999px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }

          /* Mode Edit Visual Interaktif */
          body.visual-edit-active [data-section] {
            transition: outline 0.15s ease, box-shadow 0.15s ease;
            position: relative;
          }
          body.visual-edit-active [data-section]:hover {
            outline: 2px dashed #33b589 !important;
            outline-offset: -2px;
            cursor: pointer !important;
          }
        </style>
      </head>
      <body class="flex flex-col min-h-screen select-none ${isVisualEditActive ? 'visual-edit-active' : ''}">
        <!-- TOP GREETING & PROMO (DATA-SECTION="TOPBAR") -->
        ${topBarHtml ? `<div data-section="topbar" class="w-full shrink-0">${topBarHtml}</div>` : ''}

        <!-- NAVBAR TOKO & IDENTITAS (DATA-SECTION="NAVBAR") -->
        <div data-section="navbar" class="w-full shrink-0">
          ${navbarHtml}
        </div>

        <!-- MAIN STOREFRONT VIEWPORT -->
        <main class="flex-1 p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full space-y-5">
          <!-- Hero Banner Section (DATA-SECTION="HERO") -->
          <div data-section="hero" class="w-full">
            ${heroHtml}
          </div>

          <!-- Category Navigation (DATA-SECTION="CATEGORY") -->
          <div data-section="category" class="w-full">
            ${catNavHtml}
          </div>

          <!-- Product Grid Section (DATA-SECTION="PRODUCTS") -->
          <div data-section="products" class="w-full">
            ${gridHtml}
          </div>
        </main>

        <!-- FOOTER TOKO -->
        <footer class="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-auto shrink-0">
          <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-800">${escapeHtml(storeName)}</span>
              <span class="text-slate-300">•</span>
              <span>Sistem E-Commerce &amp; Percetakan Terpadu</span>
            </div>
            <div class="text-slate-400 text-[11px]">
              &copy; ${new Date().getFullYear()} ${escapeHtml(storeName)}. All rights reserved.
            </div>
          </div>
        </footer>

        <script>
          ${iframeScript}
        </script>
      </body>
      </html>
    `;

    iframe.srcdoc = docHtml;

    iframe.onload = () => {
      if (iframe.contentDocument && iframe.contentDocument.body) {
        iframe.contentDocument.body.classList.toggle('visual-edit-active', isVisualEditActive);
      }
    };
  }

  // ============================================================================
  // 11. SAVE TO DB ENGINE (DB.saveSettings)
  // ============================================================================
  function setupSaveButton() {
    const btnSave = document.getElementById('btn-save-theme-editor');
    if (!btnSave) return;

    btnSave.addEventListener('click', () => {
      const updatedSettings = {
        store_name: getInputValue('store-name-input'),
        store_tagline: getInputValue('store-tagline-input'),
        store_logo_url: getInputValue('store-logo-url-input'),
        store_favicon_url: getInputValue('store-favicon-url-input'),
        navbar_branding_mode: getSelectValue('navbar_branding_mode_select') || getRadioValue('navbar_branding_mode_radio') || 'logo_landscape',
        show_header_store_name: document.getElementById('show-header-store-name-toggle')?.checked !== false,
        show_desktop_store_name: document.getElementById('show-header-store-name-toggle')?.checked !== false,

        // Top Bar Settings
        enable_customer_greeting: document.getElementById('enable-greeting-toggle')?.checked !== false,
        show_topbar_greeting: document.getElementById('enable-greeting-toggle')?.checked !== false,
        top_bar_greeting_text: getInputValue('top-bar-greeting-text-input'),
        greeting_text: getInputValue('top-bar-greeting-text-input'),

        enable_promo_countdown: document.getElementById('enable-promo-countdown-toggle')?.checked !== false,
        show_promo_countdown: document.getElementById('enable-promo-countdown-toggle')?.checked !== false,
        top_bar_promo_text: getInputValue('top-bar-promo-text-input'),
        top_bar_promo_end: getInputValue('top-bar-promo-end-input'),

        top_bar_bg_color: getInputValue('ctrl-hex-top-bar-bg'),
        top_bar_text_color: getInputValue('ctrl-hex-top-bar-text'),
        navbar_bg_color: getInputValue('ctrl-hex-navbar-bg'),
        navbar_text_color: getInputValue('ctrl-hex-navbar-text'),

        // Sub-Menu 2: Tombol Keranjang (Cart)
        cart_icon: getSelectValue('cart_icon_select'),
        cart_icon_color: getInputValue('ctrl-hex-cart-icon'),
        navbar_cart_icon_color: getInputValue('ctrl-hex-cart-icon'),
        cart_bg_color: getInputValue('ctrl-hex-cart-bg'),
        cart_border_enable: document.getElementById('cart_border_toggle')?.checked !== false,
        cart_border_color: getInputValue('ctrl-hex-cart-border'),
        navbar_cart_border_color: getInputValue('ctrl-hex-cart-border'),
        cart_border_radius: parseInt(getInputValue('cart_border_radius_slider') || '16', 10),
        cart_badge_color: getInputValue('ctrl-hex-cart-badge'),
        navbar_cart_badge_bg: getInputValue('ctrl-hex-cart-badge'),
        cart_badge_text_color: getInputValue('ctrl-hex-cart-badge-text'),
        navbar_cart_badge_text: getInputValue('ctrl-hex-cart-badge-text'),

        // Sub-Menu 3: Kolom Pencarian (Search Bar)
        search_icon: getSelectValue('search_icon_select'),
        navbar_search_icon: getSelectValue('search_icon_select'),
        search_placeholder: getInputValue('search_placeholder_input'),
        navbar_search_placeholder: getInputValue('search_placeholder_input'),
        search_icon_color: getInputValue('ctrl-hex-search-icon'),
        navbar_search_icon_color: getInputValue('ctrl-hex-search-icon'),
        search_text_color: getInputValue('ctrl-hex-search-text'),
        navbar_search_placeholder_color: getInputValue('ctrl-hex-search-text'),
        search_bg_solid: document.getElementById('search_bg_solid_toggle')?.checked !== false,
        search_bg_color: getInputValue('ctrl-hex-search-bg'),
        navbar_search_input_bg: getInputValue('ctrl-hex-search-bg'),
        search_border_enable: document.getElementById('search_border_toggle')?.checked !== false,
        search_border_color: getInputValue('ctrl-hex-search-border'),
        navbar_search_border_color: getInputValue('ctrl-hex-search-border'),
        search_border_radius: parseInt(getInputValue('search_border_radius_slider') || '16', 10),

        // Sub-Menu 4: Tombol Login / Akun
        login_btn_display: getSelectValue('login_btn_display_select'),
        login_icon: getSelectValue('login_icon_select'),
        navbar_login_icon: getSelectValue('login_icon_select'),
        login_btn_text: getInputValue('login_btn_text_input'),
        login_icon_color: getInputValue('ctrl-hex-login-icon'),
        navbar_login_icon_color: getInputValue('ctrl-hex-login-icon'),
        login_text_color: getInputValue('ctrl-hex-login-text'),
        navbar_login_text_color: getInputValue('ctrl-hex-login-text'),
        login_btn_color: getInputValue('ctrl-hex-login-btn'),
        navbar_login_btn_bg: getInputValue('ctrl-hex-login-btn'),

        // Hero Banner Settings
        hero_model: getSelectValue('hero_model_select') || getRadioValue('hero_model_radio') || 'non_split',
        hero_headline: getInputValue('hero-headline-input'),
        hero_subheadline: getInputValue('hero-subheadline-input'),
        hero_slider_animation: getSelectValue('hero-slider-animation-select'),
        banners: [...currentBanners],
        hero_banners: [...currentBanners],

        // Categories & Products
        category_nav_mode_mobile: getRadioValue('category_nav_mode_mobile_radio'),
        category_nav_mode_desktop: getRadioValue('category_nav_mode_desktop_radio'),
        card_product_version: getRadioValue('card_product_version_radio'),

        // Colors
        primary_color: getInputValue('ctrl-hex-primary'),
        secondary_color: getInputValue('ctrl-hex-secondary'),
        body_bg_color: getInputValue('ctrl-hex-body-bg')
      };

      try {
        if (typeof DB !== 'undefined' && typeof DB.saveSettings === 'function') {
          DB.saveSettings(updatedSettings);
          settings = { ...settings, ...updatedSettings };
        } else {
          console.warn('[ThemeEditor] DB.saveSettings tidak tersedia, fallback simpan ke localStorage langsung');
          const cur = JSON.parse(localStorage.getItem('pos_store_settings') || '{}');
          localStorage.setItem('pos_store_settings', JSON.stringify({ ...cur, ...updatedSettings }));
        }

        showToast('Seluruh konfigurasi tema & branding berhasil disimpan!', 'success');
        updateLivePreview();
      } catch (err) {
        console.error('[ThemeEditor] Gagal menyimpan tema:', err);
        showToast('Gagal menyimpan pengaturan: ' + err.message, 'error');
      }
    });
  }

  // ============================================================================
  // 12. TOAST NOTIFICATION HELPER
  // ============================================================================
  function showToast(message, type = 'success') {
    const container = document.getElementById('editor-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all duration-300 transform translate-y-0 opacity-100 pointer-events-auto select-none ${
      type === 'success'
        ? 'bg-emerald-600 text-white'
        : type === 'warning'
        ? 'bg-amber-500 text-white'
        : type === 'info'
        ? 'bg-slate-800 text-white'
        : 'bg-red-600 text-white'
    }`;

    const iconClass =
      type === 'success'
        ? 'bi-check-circle-fill'
        : type === 'warning'
        ? 'bi-exclamation-triangle-fill'
        : type === 'info'
        ? 'bi-info-circle-fill'
        : 'bi-x-circle-fill';

    toast.innerHTML = `
      <i class="bi ${iconClass} text-sm"></i>
      <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('opacity-0', '-translate-y-2');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3000);
  }

  // ============================================================================
  // 13. UTILITY HELPERS
  // ============================================================================
  function getInputValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function setInputValue(id, val) {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== null) el.value = val;
  }

  function setCheckboxValue(id, checked) {
    const el = document.getElementById(id);
    if (el) el.checked = Boolean(checked);
  }

  function setImageSrc(id, src) {
    const el = document.getElementById(id);
    if (el && src) el.src = src;
  }

  function getRadioValue(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : '';
  }

  function setRadioValue(name, val) {
    if (!val) return;
    const radio = document.querySelector(`input[name="${name}"][value="${val}"]`);
    if (radio) radio.checked = true;
  }

  function getSelectValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function setSelectValue(id, val) {
    const el = document.getElementById(id);
    if (el && val) el.value = val;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

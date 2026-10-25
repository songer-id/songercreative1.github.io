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
  let storefrontSections = [];

  // --- DIRTY STATE (PERUBAHAN BELUM DITERAPKAN KE DATABASE) ---
  let isEditorDirty = false;

  function setEditorDirty(dirty) {
    isEditorDirty = !!dirty;
    const btnSave = document.getElementById('btn-save-theme-editor');
    if (btnSave) {
      if (isEditorDirty) {
        btnSave.classList.add('is-dirty');
        btnSave.classList.remove('bg-slate-900');
        btnSave.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
        btnSave.setAttribute('title', 'Terapkan Perubahan ke Halaman Toko (Ada Perubahan Belum Disimpan)');
      } else {
        btnSave.classList.remove('is-dirty');
        btnSave.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
        btnSave.classList.add('bg-slate-900');
        btnSave.setAttribute('title', 'Terapkan Perubahan ke Halaman Toko');
      }
    }
  }

  // --- STATE HISTORY STACK (UNDO / REDO SHOPIFY-STYLE) ---
  const HISTORY_MAX_DEPTH = 50;
  let historyStack = [];
  let historyIndex = -1;
  let isApplyingHistory = false;
  let historyDebounceTimer = null;

  // Default fallback banners jika belum ada di database
  const DEFAULT_BANNERS = [
    'assets/images/logo-songer-creative.png',
    'assets/images/songer-logo.png'
  ];

  // ============================================================================
  // UNIVERSAL ICON RENDERER (LUCIDE & BOOTSTRAP ICONS)
  // ============================================================================
  function renderNavIconHtml(iconKey, extraClass = '', styleAttr = '') {
    if (!iconKey) iconKey = '';
    const trimmed = String(iconKey).trim();
    if (trimmed.startsWith('lucide:')) {
      const name = trimmed.replace('lucide:', '').trim();
      return `<i data-lucide="${name}" class="${extraClass}" style="${styleAttr}"></i>`;
    } else {
      let bi = trimmed;
      if (!bi.startsWith('bi-') && !bi.startsWith('bi ')) {
        bi = 'bi-' + bi;
      }
      return `<i class="bi ${bi} ${extraClass}" style="${styleAttr}"></i>`;
    }
  }

  // ============================================================================
  // CUSTOM VISUAL ICON PICKER CONTROLLER
  // ============================================================================
  function getCleanIconOptionLabel(opt) {
    if (!opt) return '';
    const text = (opt.text || opt.innerText || '').trim();
    if (text.includes('(')) {
      const main = text.split('(')[0].trim();
      if (main && !main.startsWith('lucide:') && !main.startsWith('bi-')) {
        return main;
      }
      const match = text.match(/\(([^)]+)\)/);
      if (match && match[1]) {
        return match[1].split(' - ')[0].trim();
      }
    }
    return text.replace(/^lucide:|^bi-/, '').replace(/[-_]/g, ' ').trim();
  }

  function closeAllVisualIconPickers() {
    document.querySelectorAll('.visual-icon-picker-menu.is-open').forEach(m => {
      m.classList.remove('is-open', 'dropup');
      m.style.maxHeight = '';
      const p = m.closest('.visual-icon-picker');
      if (p) {
        p.classList.remove('is-open');
        p.querySelector('.visual-icon-picker-btn')?.classList.remove('is-open');
        p.closest('.sub-accordion-item')?.classList.remove('dropdown-active');
        p.closest('.theme-accordion-item')?.classList.remove('dropdown-active');
      }
    });
  }

  function openVisualIconPicker(picker, btn, menu) {
    picker.classList.add('is-open');
    btn.classList.add('is-open');
    menu.classList.add('is-open');

    const subAcc = picker.closest('.sub-accordion-item');
    const themeAcc = picker.closest('.theme-accordion-item');
    if (subAcc) subAcc.classList.add('dropdown-active');
    if (themeAcc) themeAcc.classList.add('dropdown-active');

    // Hitung posisi akurat terhadap batas viewport dan kontainer scroll sidebar
    const rect = picker.getBoundingClientRect();
    const scrollContainer = picker.closest('.overflow-y-auto') || picker.closest('#sidebar-detail-view') || document.body;
    const containerRect = scrollContainer.getBoundingClientRect();

    const spaceBelowViewport = window.innerHeight - rect.bottom;
    const spaceBelowContainer = containerRect.bottom - rect.bottom;
    const spaceBelow = Math.min(spaceBelowViewport, spaceBelowContainer);

    const spaceAboveViewport = rect.top;
    const spaceAboveContainer = rect.top - containerRect.top;
    const spaceAbove = Math.min(spaceAboveViewport, spaceAboveContainer);

    const isMobile = window.innerWidth < 768;
    const threshold = isMobile ? 200 : 230;

    if (spaceBelow < threshold && spaceAbove > 140) {
      menu.classList.add('dropup');
      const maxH = Math.max(130, Math.min(220, Math.floor(spaceAbove - 16)));
      menu.style.maxHeight = `${maxH}px`;
    } else {
      menu.classList.remove('dropup');
      const maxH = Math.max(130, Math.min(220, Math.floor(spaceBelow - 16)));
      menu.style.maxHeight = `${maxH}px`;
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function setupVisualIconPickers() {
    document.querySelectorAll('.visual-icon-picker').forEach(picker => {
      const selectId = picker.getAttribute('data-select');
      const selectEl = document.getElementById(selectId);
      if (!selectEl) return;

      const btn = picker.querySelector('.visual-icon-picker-btn');
      const menu = picker.querySelector('.visual-icon-picker-menu');
      if (!btn || !menu) return;

      // Populate dropdown menu items: pure visual icon tiles in grid, without raw code strings
      menu.innerHTML = Array.from(selectEl.options).map(opt => {
        const isSelected = opt.value === selectEl.value;
        const iconHtml = renderNavIconHtml(opt.value, 'text-base');
        const cleanTitle = getCleanIconOptionLabel(opt);
        return `
          <div class="visual-icon-picker-option ${isSelected ? 'is-selected' : ''}" data-value="${escapeHtml(opt.value)}" title="${escapeHtml(cleanTitle)}" aria-label="${escapeHtml(cleanTitle)}">
            <span class="vip-option-icon vip-icon-box">${iconHtml}</span>
          </div>
        `;
      }).join('');

      // Update button trigger initial presentation with clean icon & friendly label
      syncVisualIconPicker(selectId);

      // Toggle dropdown open/close on button click
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = menu.classList.contains('is-open');
        closeAllVisualIconPickers();

        if (!isOpen) {
          openVisualIconPicker(picker, btn, menu);
        }
      });

      // Handle item selection inside menu
      menu.querySelectorAll('.visual-icon-picker-option').forEach(optEl => {
        optEl.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const val = optEl.getAttribute('data-value');
          selectEl.value = val;
          syncVisualIconPicker(selectId);
          closeAllVisualIconPickers();
          selectEl.dispatchEvent(new Event('change', { bubbles: true }));
          scheduleLivePreview();
        });
      });
    });

    // Close any open visual icon picker when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.visual-icon-picker')) {
        closeAllVisualIconPickers();
      }
    });
  }

  function syncVisualIconPicker(selectId) {
    const selectEl = document.getElementById(selectId);
    if (!selectEl) return;
    const picker = document.querySelector(`.visual-icon-picker[data-select="${selectId}"]`);
    if (!picker) return;

    const currentVal = selectEl.value;
    const selectedOption = selectEl.options[selectEl.selectedIndex] || Array.from(selectEl.options).find(o => o.value === currentVal);
    const cleanLabel = getCleanIconOptionLabel(selectedOption) || currentVal.replace(/^lucide:|^bi-/, '').replace(/[-_]/g, ' ');

    const iconBox = picker.querySelector('.vip-left .vip-icon-box');
    const labelEl = picker.querySelector('.vip-left .vip-label');
    if (iconBox) {
      iconBox.innerHTML = renderNavIconHtml(currentVal, 'text-base');
    }
    if (labelEl) {
      labelEl.textContent = cleanLabel;
    }

    const menu = picker.querySelector('.visual-icon-picker-menu');
    if (menu) {
      menu.querySelectorAll('.visual-icon-picker-option').forEach(optEl => {
        const isSel = optEl.getAttribute('data-value') === currentVal;
        optEl.classList.toggle('is-selected', isSel);
      });
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // ============================================================================
  // VISIBILITY EYE BUTTONS CONTROLLER
  // ============================================================================
  function syncVisibilityEyeBtn(btn) {
    if (!btn) return;
    const forId = btn.getAttribute('data-for');
    const cb = document.getElementById(forId);
    if (!cb) return;
    const isChecked = cb.checked;
    if (isChecked) {
      btn.className = 'visibility-eye-btn w-6 h-6 rounded-md flex items-center justify-center transition cursor-pointer text-emerald-600 hover:bg-slate-100';
      btn.innerHTML = '<i class="bi bi-eye text-xs pointer-events-none"></i>';
      btn.title = 'Tampilkan / Aktif (Klik untuk sembunyikan)';
    } else {
      btn.className = 'visibility-eye-btn w-6 h-6 rounded-md flex items-center justify-center transition cursor-pointer text-slate-400 hover:bg-slate-100';
      btn.innerHTML = '<i class="bi bi-eye-slash text-xs pointer-events-none"></i>';
      btn.title = 'Sembunyi / Nonaktif (Klik untuk tampilkan)';
    }

    // Khusus Hero Banner Utama: Sembunyikan/tampilkan seluruh alur kustomisasi di bawahnya
    if (forId === 'hero-enable-toggle') {
      const heroConfigBody = document.getElementById('hero-configuration-body');
      if (heroConfigBody) {
        heroConfigBody.classList.toggle('hidden', !isChecked);
      }
    }

    // Jika button berada di dalam header baris lipat, jika bernilai false, sembunyikan sub-opsi di dalamnya
    const parentHeader = btn.closest('.sub-accordion-header') || btn.closest('.flat-collapse-header');
    if (parentHeader) {
      const targetId = parentHeader.getAttribute('data-target');
      const targetBody = document.getElementById(targetId);
      const chevron = parentHeader.querySelector('.sub-accordion-chevron') || parentHeader.querySelector('.flat-collapse-chevron');
      if (targetBody) {
        if (!isChecked) {
          targetBody.classList.add('hidden');
          parentHeader.classList.remove('is-open');
          if (chevron) {
            chevron.classList.remove('rotate-90');
          }
          targetBody.classList.add('opacity-40', 'pointer-events-none');
        } else {
          targetBody.classList.remove('opacity-40', 'pointer-events-none');
        }
      }
    }
  }

  function syncAllVisibilityEyeButtons() {
    document.querySelectorAll('.visibility-eye-btn').forEach(btn => {
      syncVisibilityEyeBtn(btn);
    });
  }

  function setupVisibilityEyeButtons() {
    document.querySelectorAll('.visibility-eye-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const forId = btn.getAttribute('data-for');
        const cb = document.getElementById(forId);
        if (cb) {
          cb.checked = !cb.checked;
          syncVisibilityEyeBtn(btn);
          cb.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
    syncAllVisibilityEyeButtons();
  }

  // ============================================================================
  // 1. INITIALIZATION & DATA LOADING
  // ============================================================================
  function init() {
    setupVisualIconPickers();
    loadSettingsFromDB();
    setupAccordions();
    setupTreeNavigation();
    setupDetailTabs();
    setupMobileDrawer();
    setupResizableSidebar();
    setupSidebarPositionToggle();
    setupCanvasControls();
    setupColorPickers();
    setupTypographyControls();
    setupLogoHandlers();
    setupBannerHandlers();
    setupHeroGranularControls();
    setupSectionBuilder();
    setupFooterGranularControls();
    setupThemeCategoryManager();
    setupFormChangeListeners();
    setupVisibilityEyeButtons();
    setupVisualEditToggle();
    setupSaveButton();
    setupUndoRedo();
    setupPostMessageListener();

    window.addEventListener('beforeunload', (e) => {
      if (isEditorDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Terapkan default viewport responsif sesuai ukuran layar perangkat
    if (window.innerWidth < 768) {
      applyCanvasWidth(390, document.getElementById('btn-preset-mobile'));
      closeMobileDrawer();
    } else if (window.innerWidth < 1024) {
      applyCanvasWidth(768, document.getElementById('btn-preset-tablet'));
    } else {
      applyCanvasWidth(1200, document.getElementById('btn-preset-desktop'));
    }

    // Render preview perdana
    updateLivePreview();

    // Rekam snapshot perdana ke state history stack
    pushHistorySnapshot(true);
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
    const enableGreeting = settings.topbar_show_greeting !== false && settings.enable_customer_greeting !== false && settings.show_topbar_greeting !== false;
    const greetingText = settings.top_bar_greeting_text || settings.greeting_text || 'Selamat datang di ' + storeName;
    const enablePromo = settings.topbar_show_countdown !== false && settings.enable_promo_countdown !== false && settings.show_promo_countdown !== false;
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
    setSelectValue('cart_icon_select', settings.cart_icon || 'lucide:shopping-cart');
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

    const cartIconSize = settings.cart_icon_size !== undefined ? settings.cart_icon_size : 16;
    setInputValue('cart_icon_size_slider', cartIconSize);
    const cartIconSizeVal = document.getElementById('cart_icon_size_val');
    if (cartIconSizeVal) cartIconSizeVal.textContent = `${cartIconSize}px`;

    const cartBoxSize = settings.cart_box_size !== undefined ? settings.cart_box_size : 38;
    setInputValue('cart_box_size_slider', cartBoxSize);
    const cartBoxSizeVal = document.getElementById('cart_box_size_val');
    if (cartBoxSizeVal) cartBoxSizeVal.textContent = `${cartBoxSize}px`;

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

    const loginIconSize = settings.login_icon_size !== undefined ? settings.login_icon_size : 16;
    setInputValue('login_icon_size_slider', loginIconSize);
    const loginIconSizeVal = document.getElementById('login_icon_size_val');
    if (loginIconSizeVal) loginIconSizeVal.textContent = `${loginIconSize}px`;

    const loginBoxSize = settings.login_box_size !== undefined ? settings.login_box_size : 38;
    setInputValue('login_box_size_slider', loginBoxSize);
    const loginBoxSizeVal = document.getElementById('login_box_size_val');
    if (loginBoxSizeVal) loginBoxSizeVal.textContent = `${loginBoxSize}px`;

    // 3. Hero Banner
    setCheckboxValue('hero-enable-toggle', settings.hero_enabled !== false && settings.enable_hero !== false);

    let heroModel = settings.hero_model || 'non_split';
    if (heroModel === 'model_2') heroModel = 'non_split';
    if (heroModel === 'model_4') heroModel = 'split';
    setSelectValue('hero_model_select', heroModel);
    setRadioValue('hero_model_radio', heroModel);

    setRadioValue('hero_width_layout_radio', settings.hero_width_layout || 'boxed');
    setRadioValue('hero_split_mobile_radio', settings.hero_split_mobile || 'image_top');
    setRadioValue('hero_split_desktop_pos_radio', settings.hero_split_desktop_pos || 'text_left');
    setSelectValue('hero-bg-type-select', settings.hero_bg_type || 'linear_gradient');
    setColorPair('hero-bg-color1-picker', 'hero-bg-color1-hex', settings.hero_bg_color1 || '#0f172a');
    setColorPair('hero-bg-color2-picker', 'hero-bg-color2-hex', settings.hero_bg_color2 || '#064e3b');
    setInputValue('hero-bg-angle-input', settings.hero_bg_angle !== undefined ? settings.hero_bg_angle : 135);
    const heroRad = parseInt(settings.hero_container_radius || '16', 10);
    setInputValue('hero-container-radius-slider', heroRad);
    setInputValue('hero-container-radius-number', heroRad);
    setSelectValue('hero-container-shadow-select', settings.hero_container_shadow || 'sm');

    // Hero Border Bottom
    setCheckboxValue('hero-border-bottom-toggle', Boolean(settings.hero_border_bottom_enable));
    setColorPair('hero-border-bottom-color-picker', 'hero-border-bottom-color-hex', settings.hero_border_bottom_color || '#e2e8f0');
    setSelectValue('hero-border-bottom-thickness-select', settings.hero_border_bottom_thickness || '1px');
    const heroBorderEyeBtn = document.querySelector('.visibility-eye-btn[data-for="hero-border-bottom-toggle"]');
    if (heroBorderEyeBtn && typeof syncVisibilityEyeBtn === 'function') {
      syncVisibilityEyeBtn(heroBorderEyeBtn);
    }

    setInputValue('hero-headline-input', settings.hero_headline || 'Cetak Banner, Desain & Souvenir Harga Instan');
    setColorPair('hero-title-color-picker', 'hero-title-color-hex', settings.hero_title_color || '#ffffff');
    setInputValue('hero-subheadline-input', settings.hero_subheadline || 'Katalog terpadu dengan kalkulator instan: spesifikasi kustom meteran, jasa desain original, hingga souvenir retail siap kirim ke seluruh Indonesia.');
    setColorPair('hero-desc-color-picker', 'hero-desc-color-hex', settings.hero_desc_color || '#cbd5e1');

    const heroImgRad = parseInt(settings.hero_image_radius || '12', 10);
    setInputValue('hero-image-radius-slider', heroImgRad);
    setInputValue('hero-image-radius-number', heroImgRad);
    setSelectValue('hero-image-shadow-select', settings.hero_image_shadow || 'sm');

    // Hero CTA Settings
    setSelectValue('hero_cta_count_mode', settings.hero_cta_count_mode || 'both');
    setCheckboxValue('hero_cta1_show_icon', settings.hero_cta1_show_icon !== false);
    setInputValue('hero_cta1_text', settings.hero_cta1_text || 'Lihat Produk');
    setSelectValue('hero_cta1_icon', settings.hero_cta1_icon || 'bi-arrow-down-short');
    setColorPair('hero_cta1_text_color_picker', 'hero_cta1_text_color_hex', settings.hero_cta1_text_color || '#ffffff');
    setColorPair('hero_cta1_icon_color_picker', 'hero_cta1_icon_color_hex', settings.hero_cta1_icon_color || '#ffffff');
    setColorPair('hero_cta1_bg_color_picker', 'hero_cta1_bg_color_hex', settings.hero_cta1_bg_color || settings.primary_color || '#33b589');
    setSelectValue('hero_cta1_radius_select', settings.hero_cta1_radius || '12px');
    setSelectValue('hero_cta1_shadow_select', settings.hero_cta1_shadow || 'sm');

    setCheckboxValue('hero_cta2_show_icon', settings.hero_cta2_show_icon !== false);
    setInputValue('hero_cta2_text', settings.hero_cta2_text || 'Konsultasi');
    setSelectValue('hero_cta2_icon', settings.hero_cta2_icon || 'bi-whatsapp');
    setInputValue('hero_cta2_wa_message', settings.hero_cta2_wa_message || 'Halo Admin *Nama Toko* saya ingin Konsultasi mengenai layanan/produk anda');
    setColorPair('hero_cta2_text_color_picker', 'hero_cta2_text_color_hex', settings.hero_cta2_text_color || '#0f172a');
    setColorPair('hero_cta2_icon_color_picker', 'hero_cta2_icon_color_hex', settings.hero_cta2_icon_color || '#10b981');
    setColorPair('hero_cta2_bg_color_picker', 'hero_cta2_bg_color_hex', settings.hero_cta2_bg_color || '#ffffff');
    setSelectValue('hero_cta2_radius_select', settings.hero_cta2_radius || '12px');
    setSelectValue('hero_cta2_shadow_select', settings.hero_cta2_shadow || 'sm');

    // Phone display for CTA 2
    const storePhoneVal = settings.store_phone || settings.footer_social_whatsapp || (typeof currentTenant !== 'undefined' && currentTenant ? currentTenant.phone : '') || '0888-5844-380';
    const phoneDisp = document.getElementById('hero-cta2-phone-display');
    if (phoneDisp) phoneDisp.textContent = storePhoneVal;

    // Multi-banner Slider / Dots / Arrows
    setColorPair('hero-dots-active-picker', 'hero-dots-active-hex', settings.hero_dots_active_color || '#10b981');
    setColorPair('hero-dots-inactive-picker', 'hero-dots-inactive-hex', settings.hero_dots_inactive_color || '#cbd5e1');
    setSelectValue('hero-slider-animation-select', settings.hero_slider_animation || 'slide_5s');
    setCheckboxValue('hero-show-arrows-toggle', settings.hero_show_arrows !== false);
    setRadioValue('hero_arrows_visibility_radio', settings.hero_arrows_visibility || 'hover');
    let heroArrowsBg = settings.hero_arrows_bg || '#0F172A';
    if (String(heroArrowsBg).startsWith('rgba')) heroArrowsBg = '#0F172A';
    setColorPair('hero-arrows-bg-picker', 'hero-arrows-bg', heroArrowsBg);

    let heroArrowsHoverBg = settings.hero_arrows_hover_bg || '#1E293B';
    if (String(heroArrowsHoverBg).startsWith('rgba')) heroArrowsHoverBg = '#1E293B';
    setColorPair('hero-arrows-hover-bg-picker', 'hero-arrows-hover-bg', heroArrowsHoverBg);

    setColorPair('hero-arrows-icon-color-picker', 'hero-arrows-icon-color', settings.hero_arrows_icon_color || '#ffffff');
    setSelectValue('hero-arrows-radius', settings.hero_arrows_radius || '9999px');
    setSelectValue('hero-arrows-shadow', settings.hero_arrows_shadow || 'sm');

    syncHeroFormVisibility();
    renderBannerThumbnails();

    // 4. Navigasi Kategori
    setRadioValue('category_nav_mode_mobile_radio', settings.category_nav_mode_mobile || 'icon_image');
    setRadioValue('category_nav_mode_desktop_radio', settings.category_nav_mode_desktop || 'icon_image');

    // 5. Tata Letak & Seksi Dinamis (Section Builder & Divider)
    const dividerEnabled = settings.divider_enabled !== false;
    setCheckboxValue('ctrl-divider-enabled', dividerEnabled);
    setColorPair('ctrl-divider-color', 'ctrl-divider-color-hex', settings.divider_color || '#e2e8f0');
    const dividerThick = settings.divider_thickness !== undefined ? settings.divider_thickness : 1;
    setInputValue('ctrl-divider-thickness-slider', dividerThick);
    const thickValEl = document.getElementById('ctrl-divider-thickness-val');
    if (thickValEl) thickValEl.textContent = `${dividerThick}px`;
    setSelectValue('ctrl-divider-width-select', settings.divider_width || '100%');
    const dividerMargin = settings.divider_margin_y !== undefined ? settings.divider_margin_y : 20;
    setInputValue('ctrl-divider-margin-slider', dividerMargin);
    const marginValEl = document.getElementById('ctrl-divider-margin-val');
    if (marginValEl) marginValEl.textContent = `${dividerMargin}px`;
    const dividerBoxEl = document.getElementById('section-divider-controls-box');
    if (dividerBoxEl) dividerBoxEl.classList.toggle('hidden', !dividerEnabled);

    if (Array.isArray(settings.storefront_sections) && settings.storefront_sections.length > 0) {
      storefrontSections = settings.storefront_sections.map(s => ({
        id: s.id || ('sec_' + Math.random().toString(36).substr(2, 9)),
        type: s.type || 'products_standard',
        name: s.name || s.title || (s.type === 'hero' ? 'Hero Banner' : (s.type === 'category' ? 'Navigasi Kategori (Quick Filter)' : 'Grid Produk Standar')),
        enabled: s.enabled !== false,
        locked: isSectionLocked(s)
      }));
    } else {
      storefrontSections = [
        { id: 'sec_hero', type: 'hero', name: 'Hero Banner', enabled: true, locked: true },
        { id: 'sec_category', type: 'category', name: 'Navigasi Kategori (Quick Filter)', enabled: true, locked: true },
        { id: 'sec_products_standard', type: 'products_standard', name: 'Grid Produk Standar', enabled: true, locked: false }
      ];
    }
    renderSectionBuilderList();

    // 6. Gaya Kartu Produk
    setRadioValue('card_product_version_radio', settings.card_product_version || 'v1');

    // 7. Palet Warna & Latar Belakang
    setColorPair('ctrl-color-primary', 'ctrl-hex-primary', settings.primary_color || '#33b589');
    setColorPair('ctrl-color-secondary', 'ctrl-hex-secondary', settings.secondary_color || '#f59e0b');
    setColorPair('ctrl-color-body-bg', 'ctrl-hex-body-bg', settings.body_bg_color || '#f8fafc');
    syncColorPresetActiveState();

    // 7b. Tipografi & Pilihan Font Toko (Google Fonts)
    setSelectValue('store_font_heading_select', settings.store_font_heading || 'Bricolage Grotesque');
    setSelectValue('store_font_body_select', settings.store_font_body || 'Inter');
    updateFontSamplePreviews();

    // 8. Footer & Media Sosial
    setSelectValue('ctrl-footer-layout', settings.footer_layout || 'multi_column');
    setInputValue('ctrl-footer-copyright', settings.footer_copyright_text || `© ${new Date().getFullYear()} ${storeName}. All rights reserved.`);
    setInputValue('ctrl-footer-hours-weekday', settings.footer_hours_weekday || 'Senin - Sabtu: 08:00 - 21:00 WIB');
    setInputValue('ctrl-footer-hours-weekend', settings.footer_hours_weekend || 'Minggu & Hari Libur: 09:00 - 17:00 WIB');

    // Footer Logo
    setCheckboxValue('ctrl-footer-show-logo', settings.footer_show_logo !== false);
    setRadioValue('ctrl-footer-logo-type', settings.footer_logo_type || 'main');
    const customFooterLogo = settings.footer_custom_logo_url || settings.store_logo_url || 'assets/images/logo-songer-creative.png';
    setInputValue('ctrl-footer-custom-logo-url', customFooterLogo);
    setImageSrc('preview-footer-logo-img', customFooterLogo);
    syncFooterLogoOptionsVisibility();

    // Store Name & Slogan
    setCheckboxValue('ctrl-footer-show-store-name', settings.footer_show_store_name !== false);
    setColorPair('ctrl-footer-store-name-color', 'ctrl-footer-store-name-hex', settings.footer_store_name_color || '#0f172a');
    setColorPair('ctrl-footer-tagline-color', 'ctrl-footer-tagline-hex', settings.footer_tagline_color || '#64748b');

    // Popular Categories
    setColorPair('ctrl-footer-cat-link-color', 'ctrl-footer-cat-link-hex', settings.footer_category_link_color || '#64748b');
    setColorPair('ctrl-footer-cat-hover-color', 'ctrl-footer-cat-hover-hex', settings.footer_category_hover_color || '#33b589');
    populateFooterCategoriesChecklist();
    renderThemeCategoryList();

    // Social accounts
    setCheckboxValue('ctrl-footer-social-tiktok-active', settings.footer_social_tiktok_active !== false);
    setCheckboxValue('ctrl-footer-social-instagram-active', settings.footer_social_instagram_active !== false);
    setCheckboxValue('ctrl-footer-social-youtube-active', settings.footer_social_youtube_active !== false);
    setCheckboxValue('ctrl-footer-social-facebook-active', settings.footer_social_facebook_active !== false);
    setCheckboxValue('ctrl-footer-social-email-active', settings.footer_social_email_active !== false);
    setCheckboxValue('ctrl-footer-social-whatsapp-active', settings.footer_social_whatsapp_active !== false);

    setInputValue('ctrl-footer-social-tiktok', settings.footer_social_tiktok || '');
    setInputValue('ctrl-footer-social-instagram', settings.footer_social_instagram || '');
    setInputValue('ctrl-footer-social-youtube', settings.footer_social_youtube || '');
    setInputValue('ctrl-footer-social-facebook', settings.footer_social_facebook || '');
    setInputValue('ctrl-footer-social-email', settings.footer_social_email || '');
    setInputValue('ctrl-footer-social-whatsapp', settings.footer_social_whatsapp || settings.store_phone || '');

    // Social button styling
    setColorPair('ctrl-footer-icon-color', 'ctrl-footer-icon-hex', settings.footer_social_btn_icon_color || settings.footer_social_icon_color || '#64748b');
    setColorPair('ctrl-footer-social-bg-color', 'ctrl-footer-social-bg-hex', settings.footer_social_btn_bg_color || '#f1f5f9');
    setColorPair('ctrl-footer-social-hover-bg', 'ctrl-footer-social-hover-bg-hex', settings.footer_social_btn_hover_bg_color || '#33b589');
    setColorPair('ctrl-footer-social-hover-color', 'ctrl-footer-social-hover-color-hex', settings.footer_social_btn_hover_icon_color || '#ffffff');
    const socBorderEnable = Boolean(settings.footer_social_btn_border_enable);
    setCheckboxValue('ctrl-footer-social-border-enable', socBorderEnable);
    const socBorderBox = document.getElementById('footer-social-border-color-box');
    if (socBorderBox) socBorderBox.classList.toggle('hidden', !socBorderEnable);
    setColorPair('ctrl-footer-social-border-color', 'ctrl-footer-social-border-hex', settings.footer_social_btn_border_color || '#e2e8f0');
    setSelectValue('ctrl-footer-social-radius-select', settings.footer_social_btn_radius || '9999px');
    setSelectValue('ctrl-footer-social-shadow-select', settings.footer_social_btn_shadow || 'none');

    // Base footer colors
    setColorPair('ctrl-footer-bg-color', 'ctrl-footer-bg-hex', settings.footer_bg_color || '#ffffff');
    setColorPair('ctrl-footer-text-color', 'ctrl-footer-text-hex', settings.footer_text_color || '#64748b');
    setColorPair('ctrl-footer-heading-color', 'ctrl-footer-heading-hex', settings.footer_heading_color || '#0f172a');
    setColorPair('ctrl-footer-border-color', 'ctrl-footer-border-hex', settings.footer_border_color || '#e2e8f0');

    // Sinkronisasi seluruh tombol mata visibilitas
    syncAllVisibilityEyeButtons();
  }

  // ============================================================================
  // 2. ACCORDION CONTROLS (EXPAND & COLLAPSE)
  // ============================================================================
  function setupAccordions() {
    // Parent Main Accordions
    document.querySelectorAll('.theme-accordion-header').forEach(header => {
      const targetId = header.getAttribute('data-target');
      const targetBody = document.getElementById(targetId);
      const chevron = header.querySelector('.theme-accordion-chevron');

      // Sync initial state
      if (targetBody && !targetBody.classList.contains('hidden')) {
        header.classList.add('is-open');
        if (chevron) {
          chevron.classList.add('rotate-90');
          chevron.classList.remove('rotate-180');
        }
      }

      header.addEventListener('click', () => {
        if (!targetBody) return;

        const isCurrentlyOpen = !targetBody.classList.contains('hidden');

        // Optional single-focus behavior
        document.querySelectorAll('.theme-accordion-body').forEach(b => {
          if (b.id !== targetId) b.classList.add('hidden');
        });
        document.querySelectorAll('.theme-accordion-header').forEach(h => {
          if (h !== header) h.classList.remove('is-open');
        });
        document.querySelectorAll('.theme-accordion-chevron').forEach(c => {
          if (c !== chevron) {
            c.classList.remove('rotate-90');
            c.classList.remove('rotate-180');
          }
        });

        if (isCurrentlyOpen) {
          targetBody.classList.add('hidden');
          header.classList.remove('is-open');
          if (chevron) {
            chevron.classList.remove('rotate-90');
            chevron.classList.remove('rotate-180');
          }
        } else {
          targetBody.classList.remove('hidden');
          header.classList.add('is-open');
          if (chevron) {
            chevron.classList.add('rotate-90');
            chevron.classList.remove('rotate-180');
          }
        }
      });
    });

    // Nested Sub-Accordions (Flat Collapsible Rows > ↓)
    document.querySelectorAll('.sub-accordion-header').forEach(subHeader => {
      const targetId = subHeader.getAttribute('data-target');
      const targetBody = document.getElementById(targetId);
      const chevron = subHeader.querySelector('.sub-accordion-chevron');
      const subItem = subHeader.closest('.sub-accordion-item');

      // Sync initial state
      if (targetBody && !targetBody.classList.contains('hidden')) {
        subHeader.classList.add('is-open');
        if (subItem) subItem.classList.add('is-open');
        if (chevron) {
          chevron.classList.add('rotate-90');
          chevron.classList.remove('rotate-180');
        }
      }

      subHeader.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!targetBody) return;

        const isCurrentlyOpen = !targetBody.classList.contains('hidden');

        if (isCurrentlyOpen) {
          targetBody.classList.add('hidden');
          subHeader.classList.remove('is-open');
          if (subItem) subItem.classList.remove('is-open');
          if (chevron) {
            chevron.classList.remove('rotate-90');
            chevron.classList.remove('rotate-180');
          }
        } else {
          targetBody.classList.remove('hidden');
          subHeader.classList.add('is-open');
          if (subItem) subItem.classList.add('is-open');
          if (chevron) {
            chevron.classList.add('rotate-90');
            chevron.classList.remove('rotate-180');
          }
        }
      });
    });
  }

  // ============================================================================
  // 2B. SHOPIFY TREE-VIEW & DRILL-DOWN NAVIGATION
  // ============================================================================
  const DRILL_PANEL_MAP = {
    'panel-top-bar': {
      accordionAttr: 'top-bar',
      targetBodyId: 'body-top-bar',
      title: 'Top Bar & Sapaan'
    },
    'panel-topbar-greeting': {
      accordionAttr: 'top-bar',
      targetBodyId: 'body-top-bar',
      subTargetId: 'sub-body-topbar-greeting',
      title: 'Sapaan Pengunjung'
    },
    'panel-topbar-promo': {
      accordionAttr: 'top-bar',
      targetBodyId: 'body-top-bar',
      subTargetId: 'sub-body-topbar-promo',
      title: 'Countdown Promo Kilat'
    },
    'panel-topbar-colors': {
      accordionAttr: 'top-bar',
      targetBodyId: 'body-top-bar',
      subTargetId: 'sub-body-topbar-colors',
      title: 'Skema Warna Top Bar'
    },
    'panel-navbar-identity': {
      accordionAttr: 'navbar-identity',
      targetBodyId: 'body-navbar-identity',
      title: 'Navbar & Identitas Toko'
    },
    'panel-navbar-brand': {
      accordionAttr: 'navbar-identity',
      targetBodyId: 'body-navbar-identity',
      subTargetId: 'sub-body-navbar-identitas',
      title: 'Identitas & Background'
    },
    'panel-navbar-cart': {
      accordionAttr: 'navbar-identity',
      targetBodyId: 'body-navbar-identity',
      subTargetId: 'sub-body-navbar-cart',
      title: 'Tombol Keranjang (Cart)'
    },
    'panel-navbar-search': {
      accordionAttr: 'navbar-identity',
      targetBodyId: 'body-navbar-identity',
      subTargetId: 'sub-body-navbar-search',
      title: 'Kolom Pencarian (Search Bar)'
    },
    'panel-navbar-login': {
      accordionAttr: 'navbar-identity',
      targetBodyId: 'body-navbar-identity',
      subTargetId: 'sub-body-navbar-login',
      title: 'Tombol Login / Akun'
    },
    'panel-hero-banner': {
      accordionAttr: 'hero-banner',
      targetBodyId: 'body-hero-banner',
      title: 'Hero Banner'
    },
    'panel-hero-border-bottom': {
      accordionAttr: 'hero-banner',
      targetBodyId: 'body-hero-banner',
      subTargetId: 'sub-body-hero-border-bottom',
      title: 'Garis Bawah Hero'
    },
    'panel-nav-category': {
      accordionAttr: 'nav-category',
      targetBodyId: 'body-nav-category',
      title: 'Navigasi Kategori'
    },
    'panel-section-builder': {
      accordionAttr: 'section-builder',
      targetBodyId: 'body-section-builder',
      title: 'Tata Letak & Seksi Dinamis'
    },
    'panel-card-product': {
      accordionAttr: 'card-product',
      targetBodyId: 'body-card-product',
      subTargetId: 'sub-body-card-product-style',
      title: 'Gaya Kartu Produk'
    },
    'panel-color-palette': {
      accordionAttr: 'color-palette',
      targetBodyId: 'body-color-palette',
      title: 'Pengaturan Tema Global'
    },
    'panel-color-presets': {
      accordionAttr: 'color-palette',
      targetBodyId: 'body-color-palette',
      subTargetId: 'sub-body-color-presets',
      title: 'Preset Palet Warna'
    },
    'panel-custom-colors': {
      accordionAttr: 'color-palette',
      targetBodyId: 'body-color-palette',
      subTargetId: 'sub-body-custom-colors',
      title: 'Penyesuaian Warna Mandiri'
    },
    'panel-typography': {
      accordionAttr: 'color-palette',
      targetBodyId: 'body-color-palette',
      subTargetId: 'sub-body-typography',
      title: 'Tipografi & Font Toko'
    },
    'panel-footer-social': {
      accordionAttr: 'footer-social',
      targetBodyId: 'body-footer-social',
      title: 'Footer & Media Sosial'
    },
    'panel-footer-logo': {
      accordionAttr: 'footer-social',
      targetBodyId: 'body-footer-social',
      subTargetId: 'sub-body-footer-logo',
      title: 'Logo Footer Toko'
    },
    'panel-footer-identity': {
      accordionAttr: 'footer-social',
      targetBodyId: 'body-footer-social',
      subTargetId: 'sub-body-footer-identity',
      title: 'Jam Operasional & Hak Cipta'
    },
    'panel-footer-categories': {
      accordionAttr: 'footer-social',
      targetBodyId: 'body-footer-social',
      subTargetId: 'sub-body-footer-categories',
      title: 'Kategori Populer Footer'
    },
    'panel-footer-social-links': {
      accordionAttr: 'footer-social',
      targetBodyId: 'body-footer-social',
      subTargetId: 'sub-body-footer-social-links',
      title: 'Tautan Media Sosial'
    },
    'panel-footer-layout': {
      accordionAttr: 'footer-social',
      targetBodyId: 'body-footer-social',
      subTargetId: 'sub-body-footer-layout',
      title: 'Model Layout Footer'
    },
    'panel-footer-colors': {
      accordionAttr: 'footer-social',
      targetBodyId: 'body-footer-social',
      subTargetId: 'sub-body-footer-colors',
      title: 'Skema Warna Dasar Footer'
    },
    'panel-footer-social-style': {
      accordionAttr: 'footer-social',
      targetBodyId: 'body-footer-social',
      subTargetId: 'sub-body-footer-social-style',
      title: 'Gaya Tombol Media Sosial'
    }
  };

  // ============================================================================
  // 2B. DETAIL VIEW TAB SWITCHER ([ KONTEN ] & [ PENGATURAN ])
  // ============================================================================
  let currentDetailTab = 'content'; // 'content' | 'settings'

  function setDetailTab(tabName) {
    if (tabName !== 'content' && tabName !== 'settings') tabName = 'content';
    currentDetailTab = tabName;

    const form = document.getElementById('form-theme-editor');
    if (form) {
      form.setAttribute('data-active-tab', tabName);
    }

    const btnContent = document.getElementById('tab-btn-content');
    const btnSettings = document.getElementById('tab-btn-settings');

    if (btnContent && btnSettings) {
      if (tabName === 'content') {
        btnContent.className = 'detail-tab-btn py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-slate-900 bg-white shadow-2xs cursor-pointer active';
        btnSettings.className = 'detail-tab-btn py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 text-slate-500 hover:text-slate-800 cursor-pointer';
      } else {
        btnSettings.className = 'detail-tab-btn py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-slate-900 bg-white shadow-2xs cursor-pointer active';
        btnContent.className = 'detail-tab-btn py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 text-slate-500 hover:text-slate-800 cursor-pointer';
      }
    }

    // Toggle all elements with [data-tab-pane]
    document.querySelectorAll('#form-theme-editor [data-tab-pane]').forEach(el => {
      const pane = el.getAttribute('data-tab-pane');
      if (pane === tabName) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });

    // Handle sub-accordions that don't have explicit data-tab-pane themselves
    document.querySelectorAll('#form-theme-editor .sub-accordion-item:not([data-tab-pane])').forEach(subItem => {
      const subBody = subItem.querySelector('.sub-accordion-body');
      if (subBody) {
        const directChildren = Array.from(subBody.children);
        const hasTabPanes = directChildren.some(c => c.hasAttribute('data-tab-pane'));
        if (hasTabPanes) {
          const visibleDirectChildren = directChildren.filter(c => !c.classList.contains('hidden'));
          if (visibleDirectChildren.length === 0) {
            subItem.classList.add('hidden');
          } else {
            subItem.classList.remove('hidden');
          }
        }
      }
    });

    // Sinkronisasi visibilitas granular model hero agar selalu sinkron saat tab berganti
    syncHeroFormVisibility();
  }

  function setupDetailTabs() {
    const btnContent = document.getElementById('tab-btn-content');
    const btnSettings = document.getElementById('tab-btn-settings');

    if (btnContent) {
      btnContent.addEventListener('click', (e) => {
        e.preventDefault();
        setDetailTab('content');
      });
    }

    if (btnSettings) {
      btnSettings.addEventListener('click', (e) => {
        e.preventDefault();
        setDetailTab('settings');
      });
    }

    document.querySelectorAll('.btn-switch-to-settings').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        setDetailTab('settings');
      });
    });
  }

  // ============================================================================
  // PRESET PALET WARNA PROFESIONAL (1-CLICK COLOR PRESETS)
  // ============================================================================
  const COLOR_PRESETS = {
    emerald_modern: { primary: '#33B589', secondary: '#F59E0B', bg: '#F8FAFC', title: 'Emerald Modern' },
    midnight_slate: { primary: '#0F172A', secondary: '#3B82F6', bg: '#F8FAFC', title: 'Midnight Slate' },
    royal_indigo: { primary: '#4F46E5', secondary: '#EC4899', bg: '#F9FAFB', title: 'Royal Indigo' },
    crimson_bold: { primary: '#E11D48', secondary: '#FACC15', bg: '#FFFDF9', title: 'Crimson Bold' },
    forest_luxury: { primary: '#14532D', secondary: '#D97706', bg: '#FAFAF9', title: 'Forest Luxury' }
  };

  function applyColorPreset(presetId) {
    const preset = COLOR_PRESETS[presetId];
    if (!preset) return;

    setColorPair('ctrl-color-primary', 'ctrl-hex-primary', preset.primary);
    setColorPair('ctrl-color-secondary', 'ctrl-hex-secondary', preset.secondary);
    setColorPair('ctrl-color-body-bg', 'ctrl-hex-body-bg', preset.bg);

    syncColorPresetActiveState();
    scheduleLivePreview();
    pushHistorySnapshot();
    showEditorToast(`Preset warna "${preset.title}" diterapkan!`);
  }

  function syncColorPresetActiveState() {
    const curPrimary = (getInputValue('ctrl-hex-primary') || '').toUpperCase();
    const curSecondary = (getInputValue('ctrl-hex-secondary') || '').toUpperCase();
    const curBg = (getInputValue('ctrl-hex-body-bg') || '').toUpperCase();

    let matchedId = null;
    Object.keys(COLOR_PRESETS).forEach(id => {
      const p = COLOR_PRESETS[id];
      if (p.primary.toUpperCase() === curPrimary &&
        p.secondary.toUpperCase() === curSecondary &&
        p.bg.toUpperCase() === curBg) {
        matchedId = id;
      }
    });

    document.querySelectorAll('.btn-color-preset').forEach(btn => {
      const pId = btn.getAttribute('data-preset-id');
      const isMatched = (pId === matchedId);
      btn.classList.toggle('active-preset', isMatched);
    });
  }

  // ============================================================================
  // TIPOGRAFI & GOOGLE FONTS PREVIEWS
  // ============================================================================
  function updateFontSamplePreviews() {
    const headingFont = getSelectValue('store_font_heading_select') || 'Bricolage Grotesque';
    const bodyFont = getSelectValue('store_font_body_select') || 'Inter';

    const sampleHeading = document.getElementById('preview-heading-font-sample');
    const sampleBody = document.getElementById('preview-body-font-sample');

    if (sampleHeading) {
      sampleHeading.style.fontFamily = `'${headingFont}', sans-serif`;
    }
    if (sampleBody) {
      sampleBody.style.fontFamily = `'${bodyFont}', sans-serif`;
    }
  }

  function setupTypographyControls() {
    const headingSelect = document.getElementById('store_font_heading_select');
    const bodySelect = document.getElementById('store_font_body_select');

    if (headingSelect) {
      headingSelect.addEventListener('change', () => {
        updateFontSamplePreviews();
        scheduleLivePreview();
        pushHistorySnapshot();
      });
    }

    if (bodySelect) {
      bodySelect.addEventListener('change', () => {
        updateFontSamplePreviews();
        scheduleLivePreview();
        pushHistorySnapshot();
      });
    }
  }

  function openDrillDown(drillKey, customTitle = null) {
    const treeView = document.getElementById('sidebar-tree-view');
    const detailView = document.getElementById('sidebar-detail-view');
    const titleEl = document.getElementById('detail-view-title');
    const btnModeSections = document.getElementById('btn-mode-sections');
    const btnModeSettings = document.getElementById('btn-mode-settings');

    const config = DRILL_PANEL_MAP[drillKey];
    if (!config) return;

    if (treeView) treeView.classList.add('hidden');
    if (detailView) detailView.classList.remove('hidden');

    if (titleEl) {
      titleEl.textContent = customTitle || config.title;
    }

    // Update Topbar mode button states
    if (btnModeSections && btnModeSettings) {
      if (drillKey === 'panel-color-palette') {
        btnModeSettings.className = 'w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center text-xs font-semibold cursor-pointer transition shadow-2xs';
        btnModeSections.className = 'w-8 h-8 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center text-xs font-semibold cursor-pointer transition';
      } else {
        btnModeSections.className = 'w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center text-xs font-semibold cursor-pointer transition shadow-2xs';
        btnModeSettings.className = 'w-8 h-8 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center text-xs font-semibold cursor-pointer transition';
      }
    }

    // Atur tab awal sesuai jenis panel yang dibuka
    const settingsKeys = [
      'panel-color-palette',
      'panel-color-presets',
      'panel-custom-colors',
      'panel-typography',
      'panel-topbar-colors',
      'panel-card-product',
      'panel-nav-category',
      'panel-hero-border-bottom',
      'panel-footer-layout',
      'panel-footer-colors',
      'panel-footer-social-style'
    ];
    if (settingsKeys.includes(drillKey)) {
      setDetailTab('settings');
    } else {
      setDetailTab('content');
    }

    // Hide all accordion items, show only the active one
    document.querySelectorAll('#form-theme-editor .theme-accordion-item').forEach(item => {
      if (item.getAttribute('data-accordion') === config.accordionAttr) {
        item.classList.remove('hidden');
        const bodyEl = item.querySelector('.theme-accordion-body');
        if (bodyEl) bodyEl.classList.remove('hidden');
        const headerEl = item.querySelector('.theme-accordion-header');
        if (headerEl) {
          headerEl.classList.add('is-open');
          const chev = headerEl.querySelector('.theme-accordion-chevron');
          if (chev) {
            chev.classList.remove('rotate-180');
            chev.classList.add('rotate-90');
          }
        }
        item.classList.remove('accordion-flash-highlight');
        void item.offsetWidth;
        item.classList.add('accordion-flash-highlight');
      } else {
        item.classList.add('hidden');
      }
    });

    // If there is a subTargetId, make sure that sub-accordion is expanded
    if (config.subTargetId) {
      const subBody = document.getElementById(config.subTargetId);
      if (subBody) {
        subBody.classList.remove('hidden');
        const subHeader = document.querySelector(`[data-target="${config.subTargetId}"]`);
        if (subHeader) {
          subHeader.classList.add('is-open');
          const subItem = subHeader.closest('.sub-accordion-item');
          if (subItem) subItem.classList.add('is-open');
          const subChev = subHeader.querySelector('.sub-accordion-chevron');
          if (subChev) {
            subChev.classList.remove('rotate-180');
            subChev.classList.add('rotate-90');
          }
          setTimeout(() => {
            subHeader.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 100);
        }
      }
    }

    // Ensure mobile drawer is open so user sees controls
    if (window.innerWidth < 768) {
      openMobileDrawer();
    }
  }

  function closeDrillDown() {
    const treeView = document.getElementById('sidebar-tree-view');
    const detailView = document.getElementById('sidebar-detail-view');
    const btnModeSections = document.getElementById('btn-mode-sections');
    const btnModeSettings = document.getElementById('btn-mode-settings');

    if (detailView) detailView.classList.add('hidden');
    if (treeView) treeView.classList.remove('hidden');

    if (btnModeSections && btnModeSettings) {
      btnModeSections.className = 'w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center text-xs font-semibold cursor-pointer transition shadow-2xs';
      btnModeSettings.className = 'w-8 h-8 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center text-xs font-semibold cursor-pointer transition';
    }
  }

  function setupTreeNavigation() {
    // Click on any tree-nav-item or tree-sub-nav-item
    document.querySelectorAll('[data-drill]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const drillKey = item.getAttribute('data-drill');
        openDrillDown(drillKey);
      });
    });

    // Back button in Lapis 2 header
    const btnBack = document.getElementById('btn-back-to-tree');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        closeDrillDown();
      });
    }

    // Tree + Tambah Seksi button
    const btnTreeAddSection = document.getElementById('btn-tree-add-section');
    if (btnTreeAddSection) {
      btnTreeAddSection.addEventListener('click', () => {
        closeAllVisualIconPickers();
        const modal = document.getElementById('modal-add-section');
        if (modal) modal.classList.remove('hidden');
      });
    }

    // Topbar Mode Switcher
    const btnModeSections = document.getElementById('btn-mode-sections');
    const btnModeSettings = document.getElementById('btn-mode-settings');

    if (btnModeSections) {
      btnModeSections.addEventListener('click', () => {
        closeDrillDown();
      });
    }

    if (btnModeSettings) {
      btnModeSettings.addEventListener('click', () => {
        openDrillDown('panel-color-palette', 'Pengaturan Tema Global');
      });
    }
  }

  // ============================================================================
  // 2C. MOBILE DRAWER CONTROLS (< 768px)
  // ============================================================================
  function openMobileDrawer() {
    const sidebar = document.getElementById('theme-editor-sidebar');
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    const btnOpen = document.getElementById('btn-mobile-open-drawer');
    const btnPreview = document.getElementById('btn-mobile-preview-mode');

    if (sidebar) sidebar.classList.add('mobile-drawer-open');
    if (backdrop) backdrop.classList.remove('hidden');

    if (btnOpen) {
      btnOpen.className = 'px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 bg-emerald-600 text-white shadow-xs cursor-pointer';
      const span = btnOpen.querySelector('span');
      if (span) span.classList.remove('hidden');
    }
    if (btnPreview) {
      btnPreview.className = 'w-9 h-9 rounded-full flex items-center justify-center transition text-slate-400 hover:text-white cursor-pointer';
      const span = btnPreview.querySelector('span');
      if (span) span.classList.add('hidden');
    }
  }

  function closeMobileDrawer() {
    const sidebar = document.getElementById('theme-editor-sidebar');
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    const btnOpen = document.getElementById('btn-mobile-open-drawer');
    const btnPreview = document.getElementById('btn-mobile-preview-mode');

    if (sidebar) sidebar.classList.remove('mobile-drawer-open');
    if (backdrop) backdrop.classList.add('hidden');

    if (btnOpen) {
      btnOpen.className = 'w-9 h-9 rounded-full flex items-center justify-center transition text-slate-400 hover:text-white cursor-pointer';
      const span = btnOpen.querySelector('span');
      if (span) span.classList.add('hidden');
    }
    if (btnPreview) {
      btnPreview.className = 'px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 bg-emerald-600 text-white shadow-xs cursor-pointer';
      const span = btnPreview.querySelector('span');
      if (span) span.classList.remove('hidden');
    }
  }

  function setupMobileDrawer() {
    const btnOpen = document.getElementById('btn-mobile-open-drawer');
    const btnPreview = document.getElementById('btn-mobile-preview-mode');
    const btnClose = document.getElementById('btn-close-mobile-drawer');
    const backdrop = document.getElementById('mobile-drawer-backdrop');

    if (btnOpen) btnOpen.addEventListener('click', openMobileDrawer);
    if (btnPreview) btnPreview.addEventListener('click', closeMobileDrawer);
    if (btnClose) btnClose.addEventListener('click', closeMobileDrawer);
    if (backdrop) backdrop.addEventListener('click', closeMobileDrawer);
  }

  // ============================================================================
  // 3. FIXED SIDEBAR WIDTH (300px STANDAR PROFESIONAL - DRAG RESIZE DINONAKTIFKAN)
  // ============================================================================
  function setupResizableSidebar() {
    const sidebar = document.getElementById('theme-editor-sidebar') || document.getElementById('theme-inspector-sidebar');
    if (sidebar) {
      sidebar.style.width = '300px';
    }
    const resizeHandle = document.getElementById('sidebar-resize-handle') || document.getElementById('inspector-drag-handle');
    if (resizeHandle) {
      resizeHandle.style.display = 'none';
      resizeHandle.style.pointerEvents = 'none';
    }
  }

  // ============================================================================
  // 3B. SIDEBAR POSITION CONTROLLER (PENGALIH POSISI KIRI / KANAN)
  // ============================================================================
  function setupSidebarPositionToggle() {
    const btn = document.getElementById('btn-toggle-sidebar-pos');
    const container = document.getElementById('theme-workspace-container');
    if (!btn || !container) return;

    // Baca preferensi tersimpan di localStorage (default: 'left')
    let currentPos = localStorage.getItem('theme_studio_sidebar_pos') || 'left';
    applySidebarPosition(currentPos);

    btn.addEventListener('click', () => {
      currentPos = currentPos === 'left' ? 'right' : 'left';
      localStorage.setItem('theme_studio_sidebar_pos', currentPos);
      applySidebarPosition(currentPos);
    });
  }

  function applySidebarPosition(position) {
    const btn = document.getElementById('btn-toggle-sidebar-pos');
    const icon = document.getElementById('icon-toggle-sidebar-pos');
    const container = document.getElementById('theme-workspace-container');
    if (!container) return;

    if (position === 'right') {
      container.classList.add('sidebar-position-right');
      if (btn) btn.setAttribute('title', 'Pindahkan Sidebar ke Sisi Kiri');
      if (icon) {
        icon.className = 'bi bi-layout-sidebar text-slate-600 text-sm';
      }
    } else {
      container.classList.remove('sidebar-position-right');
      if (btn) btn.setAttribute('title', 'Pindahkan Sidebar ke Sisi Kanan');
      if (icon) {
        icon.className = 'bi bi-layout-sidebar-reverse text-slate-600 text-sm';
      }
    }
  }

  // ============================================================================
  // 4. CANVAS VIEWPORT CONTROLS (FULL HEIGHT & RESPONSIVE FRAMING + NOTICE STATE)
  // ============================================================================
  function showDesktopNotice() {
    const notice = document.getElementById('desktop-notice-state');
    if (notice) notice.classList.remove('hidden');
  }

  function hideDesktopNotice() {
    const notice = document.getElementById('desktop-notice-state');
    if (notice) notice.classList.add('hidden');
  }

  function setupCanvasControls() {
    const slider = document.getElementById('preview-width-slider');
    const display = document.getElementById('preview-width-display');

    const btnDesktop = document.getElementById('btn-preset-desktop');
    const btnTablet = document.getElementById('btn-preset-tablet');
    const btnMobile = document.getElementById('btn-preset-mobile');
    const btnDismissNotice = document.getElementById('btn-dismiss-desktop-notice');

    if (btnDesktop) {
      btnDesktop.addEventListener('click', () => {
        if (window.innerWidth < 1024) {
          showDesktopNotice();
          [btnDesktop, btnTablet, btnMobile].forEach(btn => {
            if (!btn) return;
            if (btn === btnDesktop) {
              btn.classList.add('bg-white', 'text-slate-900', 'shadow-xs');
              btn.classList.remove('text-slate-600', 'hover:bg-white/60');
            } else {
              btn.classList.remove('bg-white', 'text-slate-900', 'shadow-xs');
              btn.classList.add('text-slate-600', 'hover:bg-white/60');
            }
          });
        } else {
          hideDesktopNotice();
          applyCanvasWidth(1200, btnDesktop);
        }
      });
    }
    if (btnTablet) {
      btnTablet.addEventListener('click', () => {
        hideDesktopNotice();
        applyCanvasWidth(768, btnTablet);
      });
    }
    if (btnMobile) {
      btnMobile.addEventListener('click', () => {
        hideDesktopNotice();
        applyCanvasWidth(390, btnMobile);
      });
    }

    if (btnDismissNotice) {
      btnDismissNotice.addEventListener('click', () => {
        hideDesktopNotice();
        if (window.innerWidth >= 768) {
          applyCanvasWidth(768, btnTablet);
        } else {
          applyCanvasWidth(390, btnMobile);
        }
      });
    }

    if (slider) {
      slider.addEventListener('input', (e) => {
        hideDesktopNotice();
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
    hideDesktopNotice();
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

    if (container) {
      container.classList.remove('p-4', 'sm:p-6', 'p-6');
      container.classList.add('p-0');
    }

    if (clampedWidth >= 1150) {
      // MODE DESKTOP: 100% Layar Penuh Edge-to-Edge tanpa frame abu-abu
      wrapper.style.width = '100%';
      wrapper.style.maxWidth = '100%';
      wrapper.style.height = '100%';
      wrapper.style.minHeight = 'calc(100vh - 3rem)';
      wrapper.className = 'preview-viewport-wrapper relative transition-all duration-150 ease-out flex justify-center w-full h-full m-0 bg-white shadow-none border-0 rounded-none';

      iframe.className = 'w-full h-full border-0 bg-white rounded-none';
      iframe.style.height = '100%';
      iframe.style.minHeight = 'calc(100vh - 3rem)';
    } else {
      // MODE MOBILE & TABLET: Bersih, selebar ukuran piksel responsif (390px / 768px), membentang vertikal penuh tanpa bingkai/shadow/border
      wrapper.style.width = `${clampedWidth}px`;
      wrapper.style.maxWidth = `${clampedWidth}px`;
      wrapper.style.height = '100%';
      wrapper.style.minHeight = 'calc(100vh - 3rem)';
      wrapper.className = 'preview-viewport-wrapper relative transition-all duration-150 ease-out flex justify-center h-full m-0 bg-white shadow-none border-0 rounded-none overflow-hidden';

      iframe.className = 'w-full h-full border-0 bg-white rounded-none';
      iframe.style.height = '100%';
      iframe.style.minHeight = 'calc(100vh - 3rem)';
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

    // Footer Colors
    bindColorPair('ctrl-footer-bg-color', 'ctrl-footer-bg-hex');
    bindColorPair('ctrl-footer-text-color', 'ctrl-footer-text-hex');
    bindColorPair('ctrl-footer-heading-color', 'ctrl-footer-heading-hex');
    bindColorPair('ctrl-footer-border-color', 'ctrl-footer-border-hex');
    bindColorPair('ctrl-footer-icon-color', 'ctrl-footer-icon-hex');

    // Preset Cepat Body Background
    document.querySelectorAll('.btn-preset-body-bg').forEach(btn => {
      btn.addEventListener('click', () => {
        const hex = btn.getAttribute('data-color');
        if (hex) {
          setColorPair('ctrl-color-body-bg', 'ctrl-hex-body-bg', hex);
          syncColorPresetActiveState();
          scheduleLivePreview();
          pushHistorySnapshot();
        }
      });
    });

    // 1-Click Preset Palet Warna Profesional
    document.querySelectorAll('.btn-color-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const pId = btn.getAttribute('data-preset-id');
        if (pId) applyColorPreset(pId);
      });
    });
  }

  function bindColorPair(pickerId, hexId) {
    const picker = document.getElementById(pickerId);
    const hexInput = document.getElementById(hexId);

    if (picker && hexInput) {
      picker.addEventListener('input', (e) => {
        hexInput.value = e.target.value.toUpperCase();
        if (pickerId.includes('primary') || pickerId.includes('secondary') || pickerId.includes('body-bg')) {
          syncColorPresetActiveState();
        }
        scheduleLivePreview();
      });

      hexInput.addEventListener('input', (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          picker.value = val;
          if (hexId.includes('primary') || hexId.includes('secondary') || hexId.includes('body-bg')) {
            syncColorPresetActiveState();
          }
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
  // 7. MULTI-BANNER MANAGEMENT HANDLERS (500 KB MAX, DRAG & DROP, MAX 5)
  // ============================================================================
  function setupBannerHandlers() {
    const btnAddUrl = document.getElementById('btn-add-hero-banner-url');
    const urlInput = document.getElementById('hero-banner-url-paste-input');
    const fileInput = document.getElementById('hero-banner-dropzone-file-input');
    const dropzone = document.getElementById('hero-banner-dropzone');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => {
        fileInput.click();
      });

      ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add('border-emerald-500', 'bg-emerald-50/40');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove('border-emerald-500', 'bg-emerald-50/40');
        });
      });

      dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt ? dt.files : null;
        if (files && files.length > 0) {
          handleIncomingBannerFiles(files);
        }
      });
    }

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
        const files = e.target.files;
        if (files && files.length > 0) {
          handleIncomingBannerFiles(files);
          fileInput.value = '';
        }
      });
    }
  }

  function handleIncomingBannerFiles(files) {
    const maxKb = 500;
    Array.from(files).forEach(file => {
      if (currentBanners.length >= 5) {
        showToast('Maksimal 5 banner diperbolehkan', 'warning');
        return;
      }
      if (file.size > maxKb * 1024) {
        showToast(`Ukuran berkas (${(file.size / 1024).toFixed(0)} KB) melebihi batas maksimal ${maxKb} KB!`, 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        currentBanners.push(ev.target.result);
        renderBannerThumbnails();
        scheduleLivePreview();
      };
      reader.readAsDataURL(file);
    });
    showToast('Banner berhasil diunggah', 'success');
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
  // 7B. COMPLETE HERO GRANULAR & CTA CONTROLS
  // ============================================================================
  function setupHeroGranularControls() {
    // 1. Hero Enable Toggle
    const heroEnableToggle = document.getElementById('hero-enable-toggle');
    if (heroEnableToggle) {
      heroEnableToggle.addEventListener('change', () => {
        syncHeroFormVisibility();
        scheduleLivePreview();
      });
    }

    // 2. Radio Hero Model & Model Choice Cards
    document.querySelectorAll('input[name="hero_model_radio"]').forEach(r => {
      r.addEventListener('change', () => {
        const sel = document.getElementById('hero_model_select');
        if (sel) sel.value = r.value;
        syncHeroFormVisibility();
        scheduleLivePreview();
      });
    });

    document.querySelectorAll('.hero-model-card').forEach(card => {
      card.addEventListener('click', () => {
        const mVal = card.getAttribute('data-model');
        if (mVal) {
          const radio = document.querySelector(`input[name="hero_model_radio"][value="${mVal}"]`);
          if (radio && !radio.checked) {
            radio.checked = true;
            const sel = document.getElementById('hero_model_select');
            if (sel) sel.value = mVal;
            syncHeroFormVisibility();
            scheduleLivePreview();
          }
        }
      });
    });

    // 3. Hero Width Layout
    document.querySelectorAll('input[name="hero_width_layout_radio"]').forEach(r => {
      r.addEventListener('change', () => {
        syncHeroFormVisibility();
        scheduleLivePreview();
      });
    });

    document.querySelectorAll('.hero-width-choice-card').forEach(card => {
      card.addEventListener('click', () => {
        const wVal = card.getAttribute('data-width');
        if (wVal) {
          const radio = document.querySelector(`input[name="hero_width_layout_radio"][value="${wVal}"]`);
          if (radio && !radio.checked) {
            radio.checked = true;
            syncHeroFormVisibility();
            scheduleLivePreview();
          }
        }
      });
    });

    // 4. Hero Split Mobile Layout
    document.querySelectorAll('input[name="hero_split_mobile_radio"]').forEach(r => {
      r.addEventListener('change', () => {
        syncHeroFormVisibility();
        scheduleLivePreview();
      });
    });

    document.querySelectorAll('.hero-split-mobile-choice-card').forEach(card => {
      card.addEventListener('click', () => {
        const smVal = card.getAttribute('data-split-mobile');
        if (smVal) {
          const radio = document.querySelector(`input[name="hero_split_mobile_radio"][value="${smVal}"]`);
          if (radio && !radio.checked) {
            radio.checked = true;
            syncHeroFormVisibility();
            scheduleLivePreview();
          }
        }
      });
    });

    // 5. Hero Split Desktop Position
    document.querySelectorAll('input[name="hero_split_desktop_pos_radio"]').forEach(r => {
      r.addEventListener('change', () => {
        syncHeroFormVisibility();
        scheduleLivePreview();
      });
    });

    document.querySelectorAll('.hero-split-desktop-choice-card').forEach(card => {
      card.addEventListener('click', () => {
        const sdVal = card.getAttribute('data-split-desktop');
        if (sdVal) {
          const radio = document.querySelector(`input[name="hero_split_desktop_pos_radio"][value="${sdVal}"]`);
          if (radio && !radio.checked) {
            radio.checked = true;
            syncHeroFormVisibility();
            scheduleLivePreview();
          }
        }
      });
    });

    // 6. Text Background Controls
    const bgTypeSelect = document.getElementById('hero-bg-type-select');
    if (bgTypeSelect) {
      bgTypeSelect.addEventListener('change', () => {
        syncHeroBgColor2Visibility();
        scheduleLivePreview();
      });
    }

    bindColorPair('hero-bg-color1-picker', 'hero-bg-color1-hex');
    bindColorPair('hero-bg-color2-picker', 'hero-bg-color2-hex');

    const angleInput = document.getElementById('hero-bg-angle-input');
    if (angleInput) {
      angleInput.addEventListener('input', scheduleLivePreview);
    }

    // 7. Hero Container Radius & Presets
    const radiusSlider = document.getElementById('hero-container-radius-slider');
    const radiusNumber = document.getElementById('hero-container-radius-number');
    if (radiusSlider && radiusNumber) {
      radiusSlider.addEventListener('input', (e) => {
        radiusNumber.value = e.target.value;
        scheduleLivePreview();
      });

      radiusNumber.addEventListener('input', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val)) val = 0;
        val = Math.max(0, Math.min(32, val));
        radiusSlider.value = val;
        scheduleLivePreview();
      });
    }

    document.querySelectorAll('.btn-hero-radius-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const r = btn.getAttribute('data-radius');
        if (radiusSlider) radiusSlider.value = r;
        if (radiusNumber) radiusNumber.value = r;
        document.querySelectorAll('.btn-hero-radius-preset').forEach(b => {
          b.className = (b === btn)
            ? 'btn-hero-radius-preset px-2 py-0.5 rounded bg-emerald-600 text-white font-bold cursor-pointer'
            : 'btn-hero-radius-preset px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer';
        });
        scheduleLivePreview();
      });
    });

    const shadowSelect = document.getElementById('hero-container-shadow-select');
    if (shadowSelect) {
      shadowSelect.addEventListener('change', scheduleLivePreview);
    }

    // Hero Border Bottom Controls
    bindColorPair('hero-border-bottom-color-picker', 'hero-border-bottom-color-hex');

    const heroBorderToggle = document.getElementById('hero-border-bottom-toggle');
    if (heroBorderToggle) {
      heroBorderToggle.addEventListener('change', scheduleLivePreview);
    }

    const heroBorderThicknessSelect = document.getElementById('hero-border-bottom-thickness-select');
    if (heroBorderThicknessSelect) {
      heroBorderThicknessSelect.addEventListener('change', scheduleLivePreview);
    }

    // 8. Typography & Text Colors
    bindColorPair('hero-title-color-picker', 'hero-title-color-hex');
    bindColorPair('hero-desc-color-picker', 'hero-desc-color-hex');

    // 9. Split Image Radius & Shadow
    const imgRadiusSlider = document.getElementById('hero-image-radius-slider');
    const imgRadiusNumber = document.getElementById('hero-image-radius-number');
    if (imgRadiusSlider && imgRadiusNumber) {
      imgRadiusSlider.addEventListener('input', (e) => {
        imgRadiusNumber.value = e.target.value;
        scheduleLivePreview();
      });
      imgRadiusNumber.addEventListener('input', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val)) val = 0;
        val = Math.max(0, Math.min(24, val));
        imgRadiusSlider.value = val;
        scheduleLivePreview();
      });
    }

    document.querySelectorAll('.btn-hero-image-radius-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const r = btn.getAttribute('data-radius');
        if (imgRadiusSlider) imgRadiusSlider.value = r;
        if (imgRadiusNumber) imgRadiusNumber.value = r;
        document.querySelectorAll('.btn-hero-image-radius-preset').forEach(b => {
          b.className = (b === btn)
            ? 'btn-hero-image-radius-preset px-2 py-0.5 rounded bg-emerald-600 text-white font-bold cursor-pointer'
            : 'btn-hero-image-radius-preset px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer';
        });
        scheduleLivePreview();
      });
    });

    const imgShadowSelect = document.getElementById('hero-image-shadow-select');
    if (imgShadowSelect) {
      imgShadowSelect.addEventListener('change', scheduleLivePreview);
    }

    // 10. CTA Count Mode & Toggles
    const ctaCountModeSelect = document.getElementById('hero_cta_count_mode');
    if (ctaCountModeSelect) {
      ctaCountModeSelect.addEventListener('change', () => {
        syncHeroCtaBoxesVisibility();
        scheduleLivePreview();
      });
    }

    const cta1IconToggle = document.getElementById('hero_cta1_show_icon');
    const cta1IconContainer = document.getElementById('hero-cta1-icon-container');
    if (cta1IconToggle && cta1IconContainer) {
      cta1IconToggle.addEventListener('change', () => {
        cta1IconContainer.classList.toggle('hidden', !cta1IconToggle.checked);
        scheduleLivePreview();
      });
    }

    bindColorPair('hero_cta1_text_color_picker', 'hero_cta1_text_color_hex');
    bindColorPair('hero_cta1_icon_color_picker', 'hero_cta1_icon_color_hex');
    bindColorPair('hero_cta1_bg_color_picker', 'hero_cta1_bg_color_hex');

    const cta2IconToggle = document.getElementById('hero_cta2_show_icon');
    const cta2IconContainer = document.getElementById('hero-cta2-icon-container');
    if (cta2IconToggle && cta2IconContainer) {
      cta2IconToggle.addEventListener('change', () => {
        cta2IconContainer.classList.toggle('hidden', !cta2IconToggle.checked);
        scheduleLivePreview();
      });
    }

    bindColorPair('hero_cta2_text_color_picker', 'hero_cta2_text_color_hex');
    bindColorPair('hero_cta2_icon_color_picker', 'hero_cta2_icon_color_hex');
    bindColorPair('hero_cta2_bg_color_picker', 'hero_cta2_bg_color_hex');

    // 11. Slider Dots & Navigation Controls
    bindColorPair('hero-dots-active-picker', 'hero-dots-active-hex');
    bindColorPair('hero-dots-inactive-picker', 'hero-dots-inactive-hex');

    const showArrowsToggle = document.getElementById('hero-show-arrows-toggle');
    const arrowsPanel = document.getElementById('hero-arrows-customization-panel');
    if (showArrowsToggle && arrowsPanel) {
      showArrowsToggle.addEventListener('change', () => {
        arrowsPanel.classList.toggle('hidden', !showArrowsToggle.checked);
        scheduleLivePreview();
      });
    }

    document.querySelectorAll('input[name="hero_arrows_visibility_radio"]').forEach(r => {
      r.addEventListener('change', () => {
        document.querySelectorAll('.hero-arrows-vis-label').forEach(lbl => {
          const radioInside = lbl.querySelector('input[type="radio"]');
          if (radioInside && radioInside.checked) {
            lbl.className = 'hero-arrows-vis-label flex items-center gap-1.5 p-2 rounded-md border border-emerald-500 bg-emerald-50/50 cursor-pointer font-bold text-emerald-900';
          } else {
            lbl.className = 'hero-arrows-vis-label flex items-center gap-1.5 p-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-slate-700';
          }
        });
        scheduleLivePreview();
      });
    });

    bindColorPair('hero-arrows-bg-picker', 'hero-arrows-bg');
    bindColorPair('hero-arrows-hover-bg-picker', 'hero-arrows-hover-bg');
    bindColorPair('hero-arrows-icon-color-picker', 'hero-arrows-icon-color');
  }

  function syncHeroCtaBoxesVisibility() {
    const countMode = document.getElementById('hero_cta_count_mode')?.value || 'both';
    const cta1Box = document.getElementById('hero-cta1-settings-box');
    const cta2Box = document.getElementById('hero-cta2-settings-box');

    if (cta1Box) {
      cta1Box.classList.toggle('hidden', countMode === 'cta2_only' || countMode === 'none');
    }
    if (cta2Box) {
      cta2Box.classList.toggle('hidden', countMode === 'cta1_only' || countMode === 'none');
    }
  }

  function syncHeroBgColor2Visibility() {
    const bgTypeSelect = document.getElementById('hero-bg-type-select');
    const val = bgTypeSelect ? bgTypeSelect.value : 'linear_gradient';
    const c2Container = document.getElementById('hero-bg-color2-container');
    if (c2Container) {
      c2Container.classList.toggle('hidden', val === 'solid');
    }
  }

  // ============================================================================
  // 7C. DYNAMIC SECTION BUILDER & DIVIDER CONTROLS
  // ============================================================================
  function isSectionLocked(sec) {
    if (!sec) return false;
    const type = sec.type;
    const id = sec.id;
    // HANYA seksi dasar Hero dan Navigasi Kategori utama yang bersifat locked: true
    return type === 'hero' || type === 'category' || id === 'sec_hero' || id === 'sec_category' || id === 'sec_cat';
  }

  function setupSectionBuilder() {
    const btnOpenModal = document.getElementById('btn-open-add-section-modal');
    const btnCloseModal = document.getElementById('btn-close-add-section-modal');
    const modal = document.getElementById('modal-add-section');

    if (btnOpenModal && modal) {
      btnOpenModal.addEventListener('click', () => {
        closeAllVisualIconPickers();
        modal.classList.remove('hidden');
      });
    }

    if (btnCloseModal && modal) {
      btnCloseModal.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
    }

    document.querySelectorAll('.btn-choose-section-type').forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const type = card.getAttribute('data-type');
        const title = card.getAttribute('data-title');
        const newSec = {
          id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          type: type,
          name: title,
          enabled: true,
          locked: false // Semua seksi baru dari modal selalu locked: false sehingga dapat dihapus
        };
        storefrontSections.push(newSec);
        if (modal) modal.classList.add('hidden');
        renderSectionBuilderList();
        scheduleLivePreview();
        recordHistoryDebounced();
        showToast(`Seksi "${title}" berhasil ditambahkan!`, 'success');
      });
    });

    // Divider controls
    const dividerToggle = document.getElementById('ctrl-divider-enabled');
    const dividerBox = document.getElementById('section-divider-controls-box');
    if (dividerToggle && dividerBox) {
      dividerToggle.addEventListener('change', () => {
        dividerBox.classList.toggle('hidden', !dividerToggle.checked);
        scheduleLivePreview();
      });
    }

    bindColorPair('ctrl-divider-color', 'ctrl-divider-color-hex');

    const thicknessSlider = document.getElementById('ctrl-divider-thickness-slider');
    const thicknessVal = document.getElementById('ctrl-divider-thickness-val');
    if (thicknessSlider && thicknessVal) {
      thicknessSlider.addEventListener('input', (e) => {
        thicknessVal.textContent = `${e.target.value}px`;
        scheduleLivePreview();
      });
    }

    const marginSlider = document.getElementById('ctrl-divider-margin-slider');
    const marginVal = document.getElementById('ctrl-divider-margin-val');
    if (marginSlider && marginVal) {
      marginSlider.addEventListener('input', (e) => {
        marginVal.textContent = `${e.target.value}px`;
        scheduleLivePreview();
      });
    }
  }

  function renderSectionBuilderList() {
    const container = document.getElementById('section-builder-list-container');
    if (!container) return;

    if (storefrontSections.length === 0) {
      container.innerHTML = `
        <div class="py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          Belum ada seksi. Klik tombol di atas untuk menambah seksi.
        </div>
      `;
      return;
    }

    const typeIcons = {
      'hero': 'bi-images text-emerald-600',
      'category': 'bi-grid-fill text-emerald-600',
      'products_standard': 'bi-grid-3x3-gap-fill text-emerald-600',
      'products_featured': 'bi-stars text-amber-600',
      'sponsor_slot': 'bi-badge-ad-fill text-blue-600',
      'promo_card': 'bi-ticket-perforated-fill text-rose-600',
      'static_banner': 'bi-aspect-ratio-fill text-purple-600'
    };

    container.innerHTML = storefrontSections.map((sec, idx) => {
      const iconClass = typeIcons[sec.type] || 'bi-layers-fill text-slate-600';
      const isFirst = idx === 0;
      const isLast = idx === storefrontSections.length - 1;
      const isEnabled = sec.enabled !== false;
      const locked = isSectionLocked(sec);
      sec.locked = locked;

      return `
        <div class="section-card-item flex items-center justify-between p-2.5 rounded-xl border ${isEnabled ? 'border-slate-200 bg-white' : 'border-slate-200/60 bg-slate-50 opacity-60'} shadow-2xs transition group" data-id="${sec.id}" data-index="${idx}">
          <!-- Sisi Kiri: Tombol Reorder Up / Down + Icon + Nama Seksi -->
          <div class="flex items-center gap-2 min-w-0">
            <div class="flex flex-col gap-0.5 shrink-0">
              <button type="button" class="btn-sec-move-up w-5 h-4 rounded flex items-center justify-center text-[10px] ${isFirst ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100 cursor-pointer'}" ${isFirst ? 'disabled' : ''} data-id="${sec.id}" data-index="${idx}" title="Pindah ke Atas">
                ▲
              </button>
              <button type="button" class="btn-sec-move-down w-5 h-4 rounded flex items-center justify-center text-[10px] ${isLast ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100 cursor-pointer'}" ${isLast ? 'disabled' : ''} data-id="${sec.id}" data-index="${idx}" title="Pindah ke Bawah">
                ▼
              </button>
            </div>

            <div class="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs shrink-0">
              <i class="bi ${iconClass}"></i>
            </div>

            <div class="min-w-0">
              <div class="font-bold text-xs text-slate-800 truncate">${escapeHtml(sec.name || sec.title || 'Seksi Toko')}</div>
              <div class="text-[9px] text-slate-400 font-mono">${sec.type}</div>
            </div>
          </div>

          <!-- Sisi Kanan: Tombol Mata Visibilitas & Delete Button (Tanpa Ikon Gembok) -->
          <div class="flex items-center gap-1.5 shrink-0">
            <button type="button" class="btn-sec-toggle-vis w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${isEnabled ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 shadow-2xs' : 'text-slate-400 bg-slate-100 hover:bg-slate-200 border border-slate-200 shadow-2xs'}" data-id="${sec.id}" data-index="${idx}" title="${isEnabled ? 'Sembunyikan Seksi (Aktif)' : 'Tampilkan Seksi (Nonaktif)'}">
              <i class="bi ${isEnabled ? 'bi-eye' : 'bi-eye-slash'} text-sm pointer-events-none"></i>
            </button>
            
            ${!locked ? `
              <button type="button" class="btn-sec-delete w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer" data-id="${sec.id}" data-index="${idx}" title="Hapus Seksi">
                <i class="bi bi-trash text-xs pointer-events-none"></i>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.btn-sec-move-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const secId = btn.getAttribute('data-id');
        let idx = parseInt(btn.getAttribute('data-index'), 10);
        if (secId) {
          const foundIdx = storefrontSections.findIndex(s => s.id === secId);
          if (foundIdx !== -1) idx = foundIdx;
        }
        if (idx > 0) {
          const temp = storefrontSections[idx];
          storefrontSections[idx] = storefrontSections[idx - 1];
          storefrontSections[idx - 1] = temp;
          renderSectionBuilderList();
          scheduleLivePreview();
          recordHistoryDebounced();
        }
      });
    });

    container.querySelectorAll('.btn-sec-move-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const secId = btn.getAttribute('data-id');
        let idx = parseInt(btn.getAttribute('data-index'), 10);
        if (secId) {
          const foundIdx = storefrontSections.findIndex(s => s.id === secId);
          if (foundIdx !== -1) idx = foundIdx;
        }
        if (idx < storefrontSections.length - 1) {
          const temp = storefrontSections[idx];
          storefrontSections[idx] = storefrontSections[idx + 1];
          storefrontSections[idx + 1] = temp;
          renderSectionBuilderList();
          scheduleLivePreview();
          recordHistoryDebounced();
        }
      });
    });

    container.querySelectorAll('.btn-sec-toggle-vis').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const secId = btn.getAttribute('data-id');
        let idx = parseInt(btn.getAttribute('data-index'), 10);
        if (secId) {
          const foundIdx = storefrontSections.findIndex(s => s.id === secId);
          if (foundIdx !== -1) idx = foundIdx;
        }
        if (storefrontSections[idx]) {
          storefrontSections[idx].enabled = storefrontSections[idx].enabled === false ? true : false;
          renderSectionBuilderList();
          scheduleLivePreview();
          recordHistoryDebounced();
        }
      });
    });

    container.querySelectorAll('.btn-sec-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const secId = btn.getAttribute('data-id');
        let idx = parseInt(btn.getAttribute('data-index'), 10);
        if (secId) {
          const foundIdx = storefrontSections.findIndex(s => s.id === secId);
          if (foundIdx !== -1) idx = foundIdx;
        }

        if (idx >= 0 && idx < storefrontSections.length) {
          const sec = storefrontSections[idx];
          if (!isSectionLocked(sec)) {
            const secName = sec.name || sec.title || 'Seksi';
            storefrontSections.splice(idx, 1);
            renderSectionBuilderList();
            scheduleLivePreview();
            recordHistoryDebounced();
            showToast(`Seksi "${secName}" berhasil dihapus`, 'info');
          }
        }
      });
    });
  }

  // ============================================================================
  // 7D. GRANULAR FOOTER & POPULAR CATEGORIES CONTROLS
  // ============================================================================
  function setupFooterGranularControls() {
    const footerLogoToggle = document.getElementById('ctrl-footer-show-logo');
    if (footerLogoToggle) {
      footerLogoToggle.addEventListener('change', () => {
        syncFooterLogoOptionsVisibility();
        scheduleLivePreview();
      });
    }

    document.querySelectorAll('input[name="ctrl-footer-logo-type"]').forEach(radio => {
      radio.addEventListener('change', () => {
        syncFooterLogoOptionsVisibility();
        scheduleLivePreview();
      });
    });

    const footerLogoFileInput = document.getElementById('ctrl-footer-custom-logo-file');
    const footerLogoUrlInput = document.getElementById('ctrl-footer-custom-logo-url');
    const footerLogoPreviewImg = document.getElementById('preview-footer-logo-img');

    if (footerLogoFileInput) {
      footerLogoFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (file.size > 500 * 1024) {
          showToast('Ukuran logo footer maksimal 500 KB', 'warning');
          return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
          const base64 = ev.target.result;
          if (footerLogoUrlInput) footerLogoUrlInput.value = base64;
          if (footerLogoPreviewImg) footerLogoPreviewImg.src = base64;
          showToast('Logo khusus footer berhasil diunggah', 'success');
          scheduleLivePreview();
        };
        reader.readAsDataURL(file);
      });
    }

    if (footerLogoUrlInput) {
      footerLogoUrlInput.addEventListener('input', (e) => {
        if (footerLogoPreviewImg && e.target.value.trim()) {
          footerLogoPreviewImg.src = e.target.value.trim();
        }
        scheduleLivePreview();
      });
    }

    bindColorPair('ctrl-footer-store-name-color', 'ctrl-footer-store-name-hex');
    bindColorPair('ctrl-footer-tagline-color', 'ctrl-footer-tagline-hex');
    bindColorPair('ctrl-footer-cat-link-color', 'ctrl-footer-cat-link-hex');
    bindColorPair('ctrl-footer-cat-hover-color', 'ctrl-footer-cat-hover-hex');

    bindColorPair('ctrl-footer-social-bg-color', 'ctrl-footer-social-bg-hex');
    bindColorPair('ctrl-footer-social-hover-bg', 'ctrl-footer-social-hover-bg-hex');
    bindColorPair('ctrl-footer-social-hover-color', 'ctrl-footer-social-hover-color-hex');

    const borderToggle = document.getElementById('ctrl-footer-social-border-enable');
    const borderBox = document.getElementById('footer-social-border-color-box');
    if (borderToggle && borderBox) {
      borderToggle.addEventListener('change', () => {
        borderBox.classList.toggle('hidden', !borderToggle.checked);
        scheduleLivePreview();
      });
    }

    bindColorPair('ctrl-footer-social-border-color', 'ctrl-footer-social-border-hex');
  }

  function syncFooterLogoOptionsVisibility() {
    const showLogo = document.getElementById('ctrl-footer-show-logo')?.checked !== false;
    const optionsBox = document.getElementById('footer-logo-options-box');
    const customUploadBox = document.getElementById('footer-custom-logo-upload-box');
    const logoType = getRadioValue('ctrl-footer-logo-type') || 'main';

    if (optionsBox) optionsBox.classList.toggle('hidden', !showLogo);
    if (customUploadBox) customUploadBox.classList.toggle('hidden', !showLogo || logoType !== 'custom');
  }

  function populateFooterCategoriesChecklist() {
    const container = document.getElementById('footer-categories-checklist-container');
    const badge = document.getElementById('footer-categories-count-badge');
    if (!container) return;

    let allCategories = [];
    if (typeof DB !== 'undefined' && typeof DB.getCategories === 'function') {
      allCategories = DB.getCategories() || [];
    }

    if (allCategories.length === 0) {
      allCategories = [
        { id: 'cat_print', name: 'Digital Printing & Banner' },
        { id: 'cat_sticker', name: 'Stiker Vinyl & Label Kemasan' },
        { id: 'cat_card', name: 'Kartu Nama & Brosur Promosi' },
        { id: 'cat_souvenir', name: 'Merchandise, Mug & Souvenir' }
      ];
    }

    const selectedCats = Array.isArray(settings.footer_selected_categories)
      ? settings.footer_selected_categories
      : allCategories.map(c => c.id);

    container.innerHTML = allCategories.map(cat => {
      const isChecked = selectedCats.includes(cat.id);
      return `
        <div class="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-100 transition select-none">
          <span class="text-xs text-slate-700 font-medium truncate pr-2">${escapeHtml(cat.name)}</span>
          <div class="inline-flex items-center shrink-0">
            <input type="checkbox" class="footer-cat-checkbox hidden" value="${cat.id}" ${isChecked ? 'checked' : ''} />
            <button type="button" class="btn-footer-cat-vis w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${isChecked ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 shadow-2xs' : 'text-slate-400 bg-slate-100 hover:bg-slate-200 border border-slate-200 shadow-2xs'}" title="${isChecked ? 'Tampilkan di Footer (Aktif)' : 'Sembunyikan dari Footer (Nonaktif)'}">
              <i class="bi ${isChecked ? 'bi-eye' : 'bi-eye-slash'} text-sm pointer-events-none"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    function updateBadge() {
      const checkedCount = container.querySelectorAll('.footer-cat-checkbox:checked').length;
      if (badge) badge.textContent = `${checkedCount} Dipilih`;
    }

    updateBadge();

    container.querySelectorAll('.btn-footer-cat-vis').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const wrapper = btn.closest('div');
        const cb = wrapper ? wrapper.querySelector('.footer-cat-checkbox') : null;
        if (cb) {
          cb.checked = !cb.checked;
          const isNowChecked = cb.checked;
          btn.className = `btn-footer-cat-vis w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${isNowChecked ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 shadow-2xs' : 'text-slate-400 bg-slate-100 hover:bg-slate-200 border border-slate-200 shadow-2xs'}`;
          btn.innerHTML = `<i class="bi ${isNowChecked ? 'bi-eye' : 'bi-eye-slash'} text-sm pointer-events-none"></i>`;
          btn.title = isNowChecked ? 'Tampilkan di Footer (Aktif)' : 'Sembunyikan dari Footer (Nonaktif)';
          updateBadge();
          scheduleLivePreview();
        }
      });
    });
  }

  // ============================================================================
  // 7E. STORE CATEGORY & SUB-CATEGORY MANAGER (TAB KONTEN NAVIGASI KATEGORI)
  // ============================================================================
  const THEME_CATEGORY_ICON_LIST = [
    { id: 'grid', name: 'Katalog', bi: 'bi-grid-fill' },
    { id: 'shop', name: 'Toko', bi: 'bi-shop' },
    { id: 'tag', name: 'Tag Label', bi: 'bi-tag-fill' },
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
    { id: 'signpost', name: 'Spanduk', bi: 'bi-signpost-2-fill' }
  ];

  let activeThemeSubCats = [];

  function updateThemeCatSelectedIconPreview(iconVal) {
    const prev = document.getElementById('theme-cat-icon-selected-preview');
    if (!prev) return;
    let cleanVal = (iconVal || 'bi-grid').trim();
    if (cleanVal.startsWith('bi ')) cleanVal = cleanVal.replace(/^bi\s+/, '');
    const found = THEME_CATEGORY_ICON_LIST.find(i => i.id === cleanVal || i.bi === cleanVal || i.bi === `bi-${cleanVal}`);
    const biClass = found ? found.bi : (cleanVal.startsWith('bi-') ? cleanVal : `bi-${cleanVal}`);
    prev.innerHTML = `<i class="bi ${biClass} text-sm"></i>`;
  }

  function renderThemeCatIconGrid(selectedVal = 'bi-grid') {
    const grid = document.getElementById('theme-cat-icon-picker-grid');
    if (!grid) return;
    let cleanVal = (selectedVal || 'bi-grid').trim();
    if (cleanVal.startsWith('bi ')) cleanVal = cleanVal.replace(/^bi\s+/, '');

    grid.innerHTML = THEME_CATEGORY_ICON_LIST.map(item => {
      const isSelected = item.id === cleanVal || item.bi === cleanVal || item.bi === `bi-${cleanVal}`;
      return `
        <button type="button" class="btn-theme-cat-pick-icon p-1 rounded-lg border text-center transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${isSelected ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-2xs' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700'}" data-icon="${item.bi}" title="${item.name} (${item.bi})">
          <i class="bi ${item.bi} text-sm"></i>
          <span class="text-[8px] truncate w-full block text-slate-500 leading-tight">${item.name}</span>
        </button>
      `;
    }).join('');

    grid.querySelectorAll('.btn-theme-cat-pick-icon').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const iconBi = btn.getAttribute('data-icon');
        const inputIcon = document.getElementById('input-new-cat-icon');
        if (inputIcon) inputIcon.value = iconBi;
        updateThemeCatSelectedIconPreview(iconBi);
        renderThemeCatIconGrid(iconBi);
      });
    });
  }

  function renderThemeSubCatChips() {
    const listEl = document.getElementById('theme-subcategories-chip-list');
    const badgeEl = document.getElementById('theme-subcat-count-badge');
    if (!listEl) return;

    if (badgeEl) badgeEl.textContent = `${activeThemeSubCats.length} Sub`;

    if (activeThemeSubCats.length === 0) {
      listEl.innerHTML = `<span class="text-[10px] text-slate-400 italic">Belum ada sub-kategori.</span>`;
      return;
    }

    listEl.innerHTML = activeThemeSubCats.map((sub, idx) => `
      <span class="theme-subcat-chip inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-semibold text-slate-700 transition">
        <span>${escapeHtml(sub.name)}</span>
        <button type="button" class="btn-remove-theme-subcat text-slate-400 hover:text-rose-600 transition cursor-pointer" data-index="${idx}" data-id="${sub.id || ''}" title="Hapus sub-kategori">
          <i class="bi bi-x text-xs pointer-events-none"></i>
        </button>
      </span>
    `).join('');

    listEl.querySelectorAll('.btn-remove-theme-subcat').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        const subId = btn.getAttribute('data-id');
        const editingCatId = document.getElementById('theme-cat-editing-id')?.value;

        if (editingCatId && subId && typeof DB !== 'undefined' && typeof DB.deleteSubCategory === 'function') {
          try {
            DB.deleteSubCategory(subId, false);
          } catch (err) {
            console.warn('[ThemeEditor] Gagal hapus sub dari DB:', err);
          }
        }

        activeThemeSubCats.splice(idx, 1);
        renderThemeSubCatChips();
        renderThemeCategoryList();
        scheduleLivePreview();
      });
    });
  }

  function setupThemeCategoryManager() {
    const btnToggleAdd = document.getElementById('btn-toggle-add-cat-form');
    const boxAdd = document.getElementById('box-add-new-category');
    const btnCloseAdd = document.getElementById('btn-close-add-cat-box');
    const btnCancelAdd = document.getElementById('btn-cancel-new-cat');
    const btnSaveAdd = document.getElementById('btn-save-new-cat');
    const inputName = document.getElementById('input-new-cat-name');
    const inputDesc = document.getElementById('input-new-cat-desc');
    const inputIcon = document.getElementById('input-new-cat-icon');
    const inputImage = document.getElementById('input-new-cat-image');
    const inputFile = document.getElementById('input-new-cat-file');
    const imgPreview = document.getElementById('theme-cat-img-preview');
    const inputSubName = document.getElementById('input-theme-subcat-name');
    const btnAddSub = document.getElementById('btn-add-theme-subcat');

    function closeAddBox() {
      if (boxAdd) boxAdd.classList.add('hidden');
      const editingIdEl = document.getElementById('theme-cat-editing-id');
      if (editingIdEl) editingIdEl.value = '';
      const formTitle = document.getElementById('theme-cat-form-title');
      if (formTitle) formTitle.textContent = 'Tambah Kategori Baru';
      if (inputName) inputName.value = '';
      if (inputDesc) inputDesc.value = '';
      if (inputIcon) inputIcon.value = 'bi-grid';
      updateThemeCatSelectedIconPreview('bi-grid');
      renderThemeCatIconGrid('bi-grid');
      if (inputImage) inputImage.value = '';
      if (inputFile) inputFile.value = '';
      if (imgPreview) imgPreview.src = 'assets/images/logo-songer-creative.png';
      activeThemeSubCats = [];
      renderThemeSubCatChips();
    }

    if (btnToggleAdd && boxAdd) {
      btnToggleAdd.addEventListener('click', (e) => {
        e.preventDefault();
        const isHidden = boxAdd.classList.contains('hidden');
        if (isHidden) {
          closeAddBox();
          boxAdd.classList.remove('hidden');
          if (inputName) inputName.focus();
        } else {
          closeAddBox();
        }
      });
    }

    if (btnCloseAdd) btnCloseAdd.addEventListener('click', closeAddBox);
    if (btnCancelAdd) btnCancelAdd.addEventListener('click', closeAddBox);

    // Bind file upload image preview & size validation (max 500 KB)
    if (inputFile) {
      inputFile.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (file.size > 500 * 1024) {
          showToast('Ukuran gambar melebihi batas maksimal 500 KB!', 'warning');
          inputFile.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = (re) => {
          const dataUrl = re.target.result;
          if (inputImage) inputImage.value = dataUrl;
          if (imgPreview) imgPreview.src = dataUrl;
          showToast('Gambar berhasil dimuat!', 'success');
        };
        reader.readAsDataURL(file);
      });
    }

    if (inputImage) {
      inputImage.addEventListener('input', () => {
        const val = inputImage.value.trim();
        if (imgPreview) {
          imgPreview.src = val || 'assets/images/logo-songer-creative.png';
        }
      });
    }

    // Quick chips
    document.querySelectorAll('.btn-theme-quick-icon').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const iconBi = btn.getAttribute('data-icon');
        if (inputIcon) inputIcon.value = iconBi;
        updateThemeCatSelectedIconPreview(iconBi);
        renderThemeCatIconGrid(iconBi);
      });
    });

    if (inputIcon) {
      inputIcon.addEventListener('input', () => {
        const val = inputIcon.value.trim();
        updateThemeCatSelectedIconPreview(val);
        renderThemeCatIconGrid(val);
      });
    }

    // Sub-category inline add
    function addSubCategory() {
      const subName = (inputSubName?.value || '').trim();
      if (!subName) return;

      const editingCatId = document.getElementById('theme-cat-editing-id')?.value;

      if (editingCatId && typeof DB !== 'undefined' && typeof DB.createSubCategory === 'function') {
        try {
          const newSub = DB.createSubCategory({
            category_id: editingCatId,
            name: subName,
            default_card_variant: 'A'
          });
          activeThemeSubCats.push({
            id: newSub.id,
            name: newSub.name,
            default_card_variant: newSub.default_card_variant || 'A'
          });
          renderThemeCategoryList();
          scheduleLivePreview();
        } catch (err) {
          console.error('[ThemeEditor] Gagal membuat sub-kategori:', err);
          showToast('Gagal membuat sub-kategori: ' + err.message, 'error');
          return;
        }
      } else {
        activeThemeSubCats.push({
          id: null,
          name: subName,
          default_card_variant: 'A'
        });
      }

      if (inputSubName) inputSubName.value = '';
      renderThemeSubCatChips();
      if (inputSubName) inputSubName.focus();
    }

    if (btnAddSub) {
      btnAddSub.addEventListener('click', (e) => {
        e.preventDefault();
        addSubCategory();
      });
    }

    if (inputSubName) {
      inputSubName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addSubCategory();
        }
      });
    }

    // Save Category (Add or Update)
    if (btnSaveAdd) {
      btnSaveAdd.addEventListener('click', () => {
        const name = (inputName?.value || '').trim();
        if (!name) {
          showToast('Nama kategori wajib diisi!', 'warning');
          if (inputName) inputName.focus();
          return;
        }

        const desc = (inputDesc?.value || '').trim();
        let icon = (inputIcon?.value || '').trim() || 'bi-grid';
        if (!icon.startsWith('bi-') && !icon.startsWith('bi ')) icon = 'bi-' + icon;
        const image = (inputImage?.value || '').trim();
        const editingId = document.getElementById('theme-cat-editing-id')?.value;

        try {
          if (editingId) {
            // Update Mode
            if (typeof DB !== 'undefined' && typeof DB.updateCategory === 'function') {
              DB.updateCategory(editingId, {
                name: name,
                description: desc,
                icon: icon,
                image: image
              });
            }
            showToast(`Kategori "${name}" berhasil diperbarui!`, 'success');
          } else {
            // Create Mode
            let newCat = null;
            if (typeof DB !== 'undefined' && typeof DB.createCategory === 'function') {
              newCat = DB.createCategory({
                name: name,
                description: desc,
                icon: icon,
                image: image,
                show_in_quick_nav: true
              });
            }

            if (newCat && newCat.id && activeThemeSubCats.length > 0 && typeof DB !== 'undefined' && typeof DB.createSubCategory === 'function') {
              activeThemeSubCats.forEach(sub => {
                if (!sub.id) {
                  DB.createSubCategory({
                    category_id: newCat.id,
                    name: sub.name,
                    default_card_variant: sub.default_card_variant || 'A'
                  });
                }
              });
            }
            showToast(`Kategori "${name}" berhasil ditambahkan!`, 'success');
          }

          closeAddBox();
          renderThemeCategoryList();
          populateFooterCategoriesChecklist();
          scheduleLivePreview();
        } catch (err) {
          console.error('[ThemeEditor] Gagal menyimpan kategori:', err);
          showToast('Gagal menyimpan kategori: ' + err.message, 'error');
        }
      });
    }

    // Render initial grid, preview, and category list
    renderThemeCatIconGrid('bi-grid');
    updateThemeCatSelectedIconPreview('bi-grid');
    renderThemeSubCatChips();
    renderThemeCategoryList();
  }

  function renderThemeCategoryList() {
    const container = document.getElementById('theme-category-list-container');
    const countBadge = document.getElementById('theme-cat-count-badge');
    if (!container) return;

    let categories = [];
    if (typeof DB !== 'undefined' && typeof DB.getCategories === 'function') {
      try {
        categories = DB.getCategories() || [];
      } catch (e) {
        categories = [];
      }
    }

    if (countBadge) countBadge.textContent = categories.length;

    if (categories.length === 0) {
      container.innerHTML = `
        <div class="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          Belum ada kategori toko. Klik <span class="font-bold text-emerald-600">+ Kategori</span> untuk menambahkan.
        </div>
      `;
      return;
    }

    container.innerHTML = categories.map(cat => {
      let iconOrImg = '';
      if (cat.image) {
        iconOrImg = `<img src="${escapeHtml(cat.image)}" class="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200" alt="" onerror="this.outerHTML='<div class=\\'w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100\\'><i class=\\'bi bi-tag text-xs\\'></i></div>';" />`;
      } else {
        let bi = cat.icon || 'bi-grid';
        if (!bi.startsWith('bi-') && !bi.startsWith('bi ')) bi = 'bi-' + bi;
        iconOrImg = `
          <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <i class="bi ${bi} text-xs"></i>
          </div>
        `;
      }

      const isQuickNav = cat.show_in_quick_nav !== false;

      let subCount = 0;
      if (typeof DB !== 'undefined' && typeof DB.getSubCategories === 'function') {
        try {
          subCount = (DB.getSubCategories(cat.id) || []).length;
        } catch (e) {
          subCount = (cat.sub_categories || []).length;
        }
      } else {
        subCount = (cat.sub_categories || []).length;
      }

      let prodCount = 0;
      if (typeof DB !== 'undefined' && typeof DB.getProducts === 'function') {
        try {
          prodCount = (DB.getProducts() || []).filter(p => p.category_id === cat.id).length;
        } catch (e) {
          prodCount = 0;
        }
      }

      return `
        <div class="theme-cat-card-item flex items-center justify-between p-2 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition gap-2 shadow-2xs">
          <div class="flex items-center gap-2 min-w-0">
            ${iconOrImg}
            <div class="min-w-0">
              <div class="font-bold text-xs text-slate-800 truncate leading-tight">${escapeHtml(cat.name)}</div>
              <span class="text-[10px] text-slate-400 block truncate font-medium">${subCount} Sub &bull; ${prodCount} Produk</span>
            </div>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <!-- Tombol Eye Visibility (Standar 32x32px / w-8 h-8) -->
            <button type="button" class="btn-theme-cat-vis w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${isQuickNav ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 shadow-2xs' : 'text-slate-400 bg-slate-100 hover:bg-slate-200 border border-slate-200 shadow-2xs'}" data-id="${cat.id}" title="${isQuickNav ? 'Tampilkan di Navigasi Cepat (Aktif)' : 'Sembunyikan dari Navigasi Cepat (Nonaktif)'}">
              <i class="bi ${isQuickNav ? 'bi-eye' : 'bi-eye-slash'} text-sm pointer-events-none"></i>
            </button>
            <!-- Tombol Edit Kategori (Standar 32x32px / w-8 h-8) -->
            <button type="button" class="btn-theme-cat-edit w-8 h-8 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 flex items-center justify-center transition cursor-pointer shadow-2xs" data-id="${cat.id}" title="Edit Kategori">
              <i class="bi bi-pencil text-sm pointer-events-none"></i>
            </button>
            <!-- Tombol Hapus Kategori (Standar 32x32px / w-8 h-8) -->
            <button type="button" class="btn-theme-cat-delete w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 flex items-center justify-center transition cursor-pointer shadow-2xs" data-id="${cat.id}" data-name="${escapeHtml(cat.name)}" title="Hapus Kategori">
              <i class="bi bi-trash text-sm pointer-events-none"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Bind event tombol eye toggle visibilitas
    container.querySelectorAll('.btn-theme-cat-vis').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const catId = btn.getAttribute('data-id');
        try {
          const cat = (typeof DB !== 'undefined' && DB.getCategoryById) ? DB.getCategoryById(catId) : null;
          const currentVis = cat ? (cat.show_in_quick_nav !== false) : true;
          const newVis = !currentVis;
          if (typeof DB !== 'undefined' && typeof DB.updateCategory === 'function') {
            DB.updateCategory(catId, { show_in_quick_nav: newVis });
          }
          btn.className = `btn-theme-cat-vis w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${newVis ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 shadow-2xs' : 'text-slate-400 bg-slate-100 hover:bg-slate-200 border border-slate-200 shadow-2xs'}`;
          btn.innerHTML = `<i class="bi ${newVis ? 'bi-eye' : 'bi-eye-slash'} text-sm pointer-events-none"></i>`;
          btn.title = newVis ? 'Tampilkan di Navigasi Cepat (Aktif)' : 'Sembunyikan dari Navigasi Cepat (Nonaktif)';
          scheduleLivePreview();
          showToast(`Kategori ${newVis ? 'ditampilkan di' : 'disembunyikan dari'} navigasi etalase`, 'info');
        } catch (err) {
          console.error('[ThemeEditor] Gagal update show_in_quick_nav:', err);
          showToast('Gagal memperbarui status: ' + err.message, 'error');
        }
      });
    });

    // Bind event tombol edit
    container.querySelectorAll('.btn-theme-cat-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const catId = btn.getAttribute('data-id');
        const cat = (typeof DB !== 'undefined' && DB.getCategoryById) ? DB.getCategoryById(catId) : null;
        if (!cat) return;

        const boxAdd = document.getElementById('box-add-new-category');
        if (boxAdd) boxAdd.classList.remove('hidden');

        const editingIdEl = document.getElementById('theme-cat-editing-id');
        if (editingIdEl) editingIdEl.value = cat.id;

        const formTitle = document.getElementById('theme-cat-form-title');
        if (formTitle) formTitle.textContent = `Edit Kategori: ${cat.name}`;

        const inputName = document.getElementById('input-new-cat-name');
        if (inputName) {
          inputName.value = cat.name || '';
          inputName.focus();
        }

        const inputDesc = document.getElementById('input-new-cat-desc');
        if (inputDesc) inputDesc.value = cat.description || '';

        const curIcon = cat.icon || 'bi-grid';
        const inputIcon = document.getElementById('input-new-cat-icon');
        if (inputIcon) inputIcon.value = curIcon;
        updateThemeCatSelectedIconPreview(curIcon);
        renderThemeCatIconGrid(curIcon);

        const inputImage = document.getElementById('input-new-cat-image');
        if (inputImage) inputImage.value = cat.image || '';

        const imgPrev = document.getElementById('theme-cat-img-preview');
        if (imgPrev) imgPrev.src = cat.image || 'assets/images/logo-songer-creative.png';

        // Load sub-categories
        let subs = [];
        if (typeof DB !== 'undefined' && typeof DB.getSubCategories === 'function') {
          try {
            subs = DB.getSubCategories(cat.id) || [];
          } catch (e) {
            subs = [];
          }
        }
        activeThemeSubCats = subs.map(s => ({
          id: s.id,
          name: s.name,
          default_card_variant: s.default_card_variant || 'A'
        }));
        renderThemeSubCatChips();

        if (boxAdd) {
          boxAdd.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    });

    // Bind event tombol hapus
    container.querySelectorAll('.btn-theme-cat-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const catId = btn.getAttribute('data-id');
        const catName = btn.getAttribute('data-name') || 'kategori';

        let impact = { productsCount: 0, subCategoriesCount: 0 };
        if (typeof DB !== 'undefined' && typeof DB.getCategoryImpact === 'function') {
          try {
            impact = DB.getCategoryImpact(catId);
          } catch (e) {
            impact = { productsCount: 0, subCategoriesCount: 0 };
          }
        }

        let warnMsg = `Apakah Anda yakin ingin menghapus kategori "${catName}"?`;
        if (impact.productsCount > 0) {
          warnMsg = `⚠️ PERINGATAN:\n\nKategori "${catName}" memiliki ${impact.productsCount} produk dan ${impact.subCategoriesCount} sub-kategori terkait!\n\nMenghapus kategori ini akan menghapus produk dan sub-kategori terkait dari sistem secara permanen.\n\nLanjutkan penghapusan?`;
        } else if (impact.subCategoriesCount > 0) {
          warnMsg = `Hapus kategori "${catName}"? Seluruh ${impact.subCategoriesCount} sub-kategori di dalamnya juga akan terhapus.`;
        }

        if (!confirm(warnMsg)) {
          return;
        }

        try {
          if (typeof DB !== 'undefined' && typeof DB.deleteCategory === 'function') {
            DB.deleteCategory(catId, true);
          }
          renderThemeCategoryList();
          populateFooterCategoriesChecklist();
          scheduleLivePreview();
          showToast(`Kategori "${catName}" berhasil dihapus`, 'info');
        } catch (err) {
          console.error('[ThemeEditor] Gagal menghapus kategori:', err);
          showToast('Gagal menghapus kategori: ' + err.message, 'error');
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

    const cartIconSizeSlider = document.getElementById('cart_icon_size_slider');
    const cartIconSizeVal = document.getElementById('cart_icon_size_val');
    if (cartIconSizeSlider && cartIconSizeVal) {
      cartIconSizeSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        cartIconSizeVal.textContent = `${val}px`;
        scheduleLivePreview();
      });
    }

    const cartBoxSizeSlider = document.getElementById('cart_box_size_slider');
    const cartBoxSizeVal = document.getElementById('cart_box_size_val');
    if (cartBoxSizeSlider && cartBoxSizeVal) {
      cartBoxSizeSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        cartBoxSizeVal.textContent = `${val}px`;
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

    // Sub-Menu 4: Login Icon Size & Box Size Sliders
    const loginIconSizeSlider = document.getElementById('login_icon_size_slider');
    const loginIconSizeVal = document.getElementById('login_icon_size_val');
    if (loginIconSizeSlider && loginIconSizeVal) {
      loginIconSizeSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        loginIconSizeVal.textContent = `${val}px`;
        scheduleLivePreview();
      });
    }

    const loginBoxSizeSlider = document.getElementById('login_box_size_slider');
    const loginBoxSizeVal = document.getElementById('login_box_size_val');
    if (loginBoxSizeSlider && loginBoxSizeVal) {
      loginBoxSizeSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        loginBoxSizeVal.textContent = `${val}px`;
        scheduleLivePreview();
      });
    }

    // Phone display for CTA 2 sync whenever footer WhatsApp phone is typed
    const waPhoneInput = document.getElementById('ctrl-footer-social-whatsapp');
    if (waPhoneInput) {
      waPhoneInput.addEventListener('input', () => {
        const phoneDisp = document.getElementById('hero-cta2-phone-display');
        if (phoneDisp) {
          phoneDisp.textContent = waPhoneInput.value.trim() || '0888-5844-380';
        }
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
    const heroEnableToggle = document.getElementById('hero-enable-toggle');
    const isHeroEnabled = heroEnableToggle ? heroEnableToggle.checked : true;
    const heroConfigWrapper = document.getElementById('hero-configuration-body');
    if (heroConfigWrapper) {
      heroConfigWrapper.classList.toggle('hidden', !isHeroEnabled);
    }

    const selectedModel = document.querySelector('input[name="hero_model_radio"]:checked')?.value || 'non_split';

    // Update active highlight pada kartu model hero
    document.querySelectorAll('.hero-model-card').forEach(card => {
      const m = card.getAttribute('data-model');
      const isActive = (m === selectedModel) ||
        (selectedModel === 'non_split' && m === 'model_2') ||
        (selectedModel === 'split' && m === 'model_4');
      if (isActive) {
        card.className = 'hero-model-card p-3 rounded-xl border border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20 cursor-pointer transition space-y-1 block';
      } else {
        card.className = 'hero-model-card p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition space-y-1 block';
      }
    });

    // Update styling highlight pada choice card varian lebar
    const selectedWidth = document.querySelector('input[name="hero_width_layout_radio"]:checked')?.value || 'boxed';
    document.querySelectorAll('.hero-width-choice-card').forEach(card => {
      const w = card.getAttribute('data-width');
      if (w === selectedWidth) {
        card.className = 'hero-width-choice-card flex flex-col gap-1 p-2.5 rounded-lg border border-emerald-500 bg-white ring-1 ring-emerald-500/20 cursor-pointer transition';
      } else {
        card.className = 'hero-width-choice-card flex flex-col gap-1 p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition';
      }
    });

    // Update styling highlight pada choice card split mobile
    const selectedSplitMobile = document.querySelector('input[name="hero_split_mobile_radio"]:checked')?.value || 'image_top';
    document.querySelectorAll('.hero-split-mobile-choice-card').forEach(card => {
      const sm = card.getAttribute('data-split-mobile');
      if (sm === selectedSplitMobile) {
        card.className = 'hero-split-mobile-choice-card p-2.5 rounded-lg border border-emerald-500 bg-white ring-1 ring-emerald-500/20 cursor-pointer transition flex items-center justify-between';
      } else {
        card.className = 'hero-split-mobile-choice-card p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition flex items-center justify-between';
      }
    });

    // Update styling highlight pada choice card split desktop
    const selectedSplitDesktop = document.querySelector('input[name="hero_split_desktop_pos_radio"]:checked')?.value || 'text_left';
    document.querySelectorAll('.hero-split-desktop-choice-card').forEach(card => {
      const sd = card.getAttribute('data-split-desktop');
      if (sd === selectedSplitDesktop) {
        card.className = 'hero-split-desktop-choice-card p-2.5 rounded-lg border border-emerald-500 bg-white ring-1 ring-emerald-500/20 cursor-pointer transition flex items-center justify-between';
      } else {
        card.className = 'hero-split-desktop-choice-card p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition flex items-center justify-between';
      }
    });

    const isNonSplit = (selectedModel === 'non_split' || selectedModel === 'model_2');
    const isSplit = (selectedModel === 'split' || selectedModel === 'model_4');
    const isModel1 = (selectedModel === 'model_1');

    // Section lebar aktif untuk SEMUA model Hero (Non-Split, Split, dan Teks & CTA)
    const widthSection = document.getElementById('hero-layout-width-section');
    const ratioSection = document.getElementById('hero-mobile-ratio-section');
    if (widthSection) widthSection.classList.remove('hidden');
    if (ratioSection) ratioSection.classList.toggle('hidden', !isNonSplit);

    // Section tata letak Split
    const splitMobileSec = document.getElementById('hero-split-mobile-layout-section');
    const splitDesktopSec = document.getElementById('hero-split-desktop-layout-section');
    if (splitMobileSec) splitMobileSec.classList.toggle('hidden', !isSplit);
    if (splitDesktopSec) splitDesktopSec.classList.toggle('hidden', !isSplit);

    // Section Kotak Gambar Split
    const splitImageSec = document.getElementById('hero-split-image-section');
    if (splitImageSec) splitImageSec.classList.toggle('hidden', !isSplit);

    // Section Background & Tipografi Teks (untuk Split & Model 1)
    const textBgSec = document.getElementById('hero-text-background-section');
    const typoSec = document.getElementById('hero-typography-section');
    if (textBgSec) textBgSec.classList.toggle('hidden', isNonSplit);
    if (typoSec) typoSec.classList.toggle('hidden', isNonSplit);

    // Section CTA Customization (untuk Split & Model 1)
    const ctaSec = document.getElementById('hero-cta-customization-section');
    if (ctaSec) {
      ctaSec.classList.toggle('hidden', isNonSplit);
      syncHeroCtaBoxesVisibility();
    }

    // Section Slider Controls & Multi-Banner Management (untuk Non-Split & Split, disembunyikan di Model 1)
    const bannerControlsSec = document.getElementById('hero-banner-controls-section');
    const bannerMgmtBox = document.getElementById('hero-banner-management-box');
    if (bannerControlsSec) bannerControlsSec.classList.toggle('hidden', isModel1);
    if (bannerMgmtBox) bannerMgmtBox.classList.toggle('hidden', isModel1);

    // Kontainer Hero Section (Radius & Shadow): disembunyikan jika Non-Split Full-Width
    const containerSec = document.getElementById('hero-container-customization-section');
    if (containerSec) {
      if (isNonSplit && selectedWidth === 'full') {
        containerSec.classList.add('hidden');
      } else {
        containerSec.classList.remove('hidden');
      }
    }

    syncHeroBgColor2Visibility();
  }

  // ============================================================================
  // UNIVERSAL HERO CTA BUTTONS HTML GENERATOR
  // ============================================================================
  function renderHeroCtaButtonsHtml(ctaOpts, storeName) {
    if (!ctaOpts) ctaOpts = {};
    const countMode = ctaOpts.hero_cta_count_mode || 'both';
    if (countMode === 'none') return '';

    const actualStoreName = storeName || getInputValue('store-name-input') || 'Songer Creative';

    let cta1Html = '';
    if (countMode === 'both' || countMode === 'cta1_only') {
      const showIcon = ctaOpts.hero_cta1_show_icon !== false;
      const text = ctaOpts.hero_cta1_text || 'Lihat Produk';
      const iconKey = ctaOpts.hero_cta1_icon || 'bi-arrow-down-short';
      const textColor = ctaOpts.hero_cta1_text_color || '#ffffff';
      const iconColor = ctaOpts.hero_cta1_icon_color || '#ffffff';
      const bgColor = ctaOpts.hero_cta1_bg_color || '#33b589';
      const radius = ctaOpts.hero_cta1_radius || '12px';
      const shadow = ctaOpts.hero_cta1_shadow || 'sm';
      const shadowClass = (shadow === 'none') ? 'shadow-none' : `shadow-${shadow} hero-shadow-${shadow}`;
      const iconHtml = showIcon ? renderNavIconHtml(iconKey, 'text-base shrink-0', `color: ${iconColor};`) : '';

      cta1Html = `
        <a href="#buyer-storefront-container" id="hero-btn-cta1" class="hero-cta-btn inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${shadowClass} hover:opacity-95 active:scale-95" style="background-color: ${bgColor}; color: ${textColor}; border-radius: ${radius};">
          ${iconHtml}
          <span>${escapeHtml(text)}</span>
        </a>
      `;
    }

    let cta2Html = '';
    if (countMode === 'both' || countMode === 'cta2_only') {
      const showIcon = ctaOpts.hero_cta2_show_icon !== false;
      const text = ctaOpts.hero_cta2_text || 'Konsultasi';
      const iconKey = ctaOpts.hero_cta2_icon || 'bi-whatsapp';
      const textColor = ctaOpts.hero_cta2_text_color || '#0f172a';
      const iconColor = ctaOpts.hero_cta2_icon_color || '#10b981';
      const bgColor = ctaOpts.hero_cta2_bg_color || '#ffffff';
      const radius = ctaOpts.hero_cta2_radius || '12px';
      const shadow = ctaOpts.hero_cta2_shadow || 'sm';
      const shadowClass = (shadow === 'none') ? 'shadow-none' : `shadow-${shadow} hero-shadow-${shadow}`;
      const iconHtml = showIcon ? renderNavIconHtml(iconKey, 'text-base shrink-0', `color: ${iconColor};`) : '';

      const rawPhone = ctaOpts.store_phone || '08885844380';
      let cleanPhone = String(rawPhone).replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.slice(1);
      }
      let rawMsg = ctaOpts.hero_cta2_wa_message || 'Halo Admin *Nama Toko* saya ingin Konsultasi mengenai layanan/produk anda';
      rawMsg = rawMsg.replace(/\*Nama Toko\*/gi, actualStoreName).replace(/\{nama_toko\}/gi, actualStoreName);
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(rawMsg)}`;

      cta2Html = `
        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" id="hero-btn-cta2" class="hero-cta-btn inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${shadowClass} hover:opacity-95 active:scale-95 border border-slate-200/60" style="background-color: ${bgColor}; color: ${textColor}; border-radius: ${radius};">
          ${iconHtml}
          <span>${escapeHtml(text)}</span>
        </a>
      `;
    }

    return `
      <div class="hero-cta-group flex flex-wrap items-center gap-2.5">
        ${cta1Html}
        ${cta2Html}
      </div>
    `;
  }

  function scheduleLivePreview() {
    setEditorDirty(true);
    recordHistoryDebounced();
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
        btn.className = 'w-8 h-8 rounded-lg border border-emerald-400 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20 flex items-center justify-center transition cursor-pointer shadow-xs';
        btn.innerHTML = '<i class="bi bi-cursor-fill text-emerald-600 text-sm"></i>';
      } else {
        btn.className = 'w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center justify-center transition cursor-pointer shadow-2xs';
        btn.innerHTML = '<i class="bi bi-cursor text-slate-600 text-sm"></i>';
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
      'topbar': 'panel-top-bar',
      'header': 'panel-top-bar',
      'greeting': 'panel-topbar-greeting',
      'promo': 'panel-topbar-promo',
      'navbar': 'panel-navbar-identity',
      'navbar-brand': 'panel-navbar-brand',
      'navbar-cart': 'panel-navbar-cart',
      'navbar-search': 'panel-navbar-search',
      'navbar-login': 'panel-navbar-login',
      'hero': 'panel-hero-banner',
      'category': 'panel-nav-category',
      'products': 'panel-card-product',
      'colors': 'panel-color-palette',
      'palette': 'panel-color-palette',
      'footer': 'panel-footer-social',
      'section-builder': 'panel-section-builder'
    };

    const targetKey = sectionMap[section] || 'panel-hero-banner';
    openDrillDown(targetKey);
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
    const cartIconSize = getInputValue('cart_icon_size_slider') || '16';
    const cartBoxSize = getInputValue('cart_box_size_slider') || '38';
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
    const loginIconSize = getInputValue('login_icon_size_slider') || '16';
    const loginBoxSize = getInputValue('login_box_size_slider') || '38';

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
    const fontHeading = getSelectValue('store_font_heading_select') || 'Bricolage Grotesque';
    const fontBody = getSelectValue('store_font_body_select') || 'Inter';

    // 7. Footer & Media Sosial
    const footerLayout = getSelectValue('ctrl-footer-layout') || 'multi_column';
    const footerCopyright = getInputValue('ctrl-footer-copyright') || `© ${new Date().getFullYear()} ${storeName}. All rights reserved.`;
    const footerHoursWeekday = getInputValue('ctrl-footer-hours-weekday') || 'Senin - Sabtu: 08:00 - 21:00 WIB';
    const footerHoursWeekend = getInputValue('ctrl-footer-hours-weekend') || 'Minggu & Hari Libur: 09:00 - 17:00 WIB';

    const footerSocialTiktok = getInputValue('ctrl-footer-social-tiktok') || '';
    const footerSocialInstagram = getInputValue('ctrl-footer-social-instagram') || '';
    const footerSocialYoutube = getInputValue('ctrl-footer-social-youtube') || '';
    const footerSocialFacebook = getInputValue('ctrl-footer-social-facebook') || '';
    const footerSocialEmail = getInputValue('ctrl-footer-social-email') || '';
    const footerSocialWhatsapp = getInputValue('ctrl-footer-social-whatsapp') || '';

    const footerBgColor = getInputValue('ctrl-footer-bg-hex') || '#ffffff';
    const footerTextColor = getInputValue('ctrl-footer-text-hex') || '#64748b';
    const footerHeadingColor = getInputValue('ctrl-footer-heading-hex') || '#0f172a';
    const footerBorderColor = getInputValue('ctrl-footer-border-hex') || '#e2e8f0';

    // Hero Granular Settings
    const heroWidthLayout = getRadioValue('hero_width_layout_radio') || 'boxed';
    const heroSplitMobile = getRadioValue('hero_split_mobile_radio') || 'image_top';
    const heroSplitDesktopPos = getRadioValue('hero_split_desktop_pos_radio') || 'text_left';
    const heroBgType = getSelectValue('hero-bg-type-select') || 'linear_gradient';
    const heroBgColor1 = getInputValue('hero-bg-color1-hex') || '#0f172a';
    const heroBgColor2 = getInputValue('hero-bg-color2-hex') || '#064e3b';
    const heroBgAngle = getInputValue('hero-bg-angle-input') || '135';
    const heroRadius = (getInputValue('hero-container-radius-number') || '16') + 'px';
    const heroShadow = getSelectValue('hero-container-shadow-select') || 'sm';

    let heroBgCss = '';
    if (heroBgType === 'solid') {
      heroBgCss = `background-color: ${heroBgColor1};`;
    } else if (heroBgType === 'radial_gradient') {
      heroBgCss = `background: radial-gradient(circle at center, ${heroBgColor1} 0%, ${heroBgColor2} 100%);`;
    } else {
      heroBgCss = `background: linear-gradient(${heroBgAngle}deg, ${heroBgColor1} 0%, ${heroBgColor2} 100%);`;
    }
    const heroShadowClass = (heroShadow === 'none') ? 'shadow-none' : `shadow-${heroShadow}`;

    // Hero Border Bottom Configuration
    const heroBorderBottomEnable = Boolean(document.getElementById('hero-border-bottom-toggle')?.checked);
    const heroBorderBottomColor = getInputValue('hero-border-bottom-color-hex') || '#e2e8f0';
    const heroBorderBottomThickness = getSelectValue('hero-border-bottom-thickness-select') || '1px';
    const heroBorderBottomStyle = heroBorderBottomEnable ? `border-bottom: ${heroBorderBottomThickness} solid ${heroBorderBottomColor};` : '';

    // Hero Slider Arrows & Navigation Configuration (Top-level scope)
    const heroShowArrows = document.getElementById('hero-show-arrows-toggle')?.checked !== false;
    const heroArrowsVisibility = getRadioValue('hero_arrows_visibility_radio') || 'hover';
    let heroArrowsBg = getInputValue('hero-arrows-bg') || '#0F172A';
    if (String(heroArrowsBg).startsWith('rgba')) heroArrowsBg = '#0F172A';
    let heroArrowsHoverBg = getInputValue('hero-arrows-hover-bg') || '#1E293B';
    if (String(heroArrowsHoverBg).startsWith('rgba')) heroArrowsHoverBg = '#1E293B';
    const heroArrowsIconColor = getInputValue('hero-arrows-icon-color') || '#ffffff';
    const heroArrowsRadius = getSelectValue('hero-arrows-radius') || '9999px';
    const heroArrowsShadow = getSelectValue('hero-arrows-shadow') || 'sm';
    const heroArrowsShadowClass = (heroArrowsShadow === 'none') ? 'shadow-none' : `shadow-${heroArrowsShadow}`;

    // Section Divider
    const dividerEnabled = document.getElementById('ctrl-divider-enabled')?.checked !== false;
    const dividerColor = getInputValue('ctrl-divider-color-hex') || '#e2e8f0';
    const dividerThickness = getInputValue('ctrl-divider-thickness-slider') || '1';
    const dividerWidth = getSelectValue('ctrl-divider-width-select') || '100%';
    const dividerMargin = getInputValue('ctrl-divider-margin-slider') || '20';

    const dividerHtml = dividerEnabled ? `
      <div class="w-full flex justify-center shrink-0 my-auto" style="margin-top: ${dividerMargin}px; margin-bottom: ${dividerMargin}px;">
        <div style="width: ${dividerWidth};">
          <hr style="border: 0; border-top: ${dividerThickness}px solid ${dividerColor}; margin: 0; width: 100%;" />
        </div>
      </div>
    ` : '';

    // Selected Categories for Footer
    const checkedCategoryIds = Array.from(document.querySelectorAll('#footer-categories-checklist-container .footer-cat-checkbox:checked')).map(cb => cb.value);

    const previewSettings = {
      store_name: storeName,
      store_tagline: storeTagline,
      store_logo_url: storeLogo,
      footer_layout: footerLayout,
      footer_copyright_text: footerCopyright,
      footer_hours_weekday: footerHoursWeekday,
      footer_hours_weekend: footerHoursWeekend,

      footer_show_logo: document.getElementById('ctrl-footer-show-logo')?.checked !== false,
      footer_logo_type: getRadioValue('ctrl-footer-logo-type') || 'main',
      footer_custom_logo_url: getInputValue('ctrl-footer-custom-logo-url'),

      footer_show_store_name: document.getElementById('ctrl-footer-show-store-name')?.checked !== false,
      footer_store_name_color: getInputValue('ctrl-footer-store-name-hex') || '#0f172a',
      footer_tagline_color: getInputValue('ctrl-footer-tagline-hex') || '#64748b',

      footer_selected_categories: checkedCategoryIds,
      footer_category_link_color: getInputValue('ctrl-footer-cat-link-hex') || '#64748b',
      footer_category_hover_color: getInputValue('ctrl-footer-cat-hover-hex') || '#33b589',

      footer_social_tiktok_active: document.getElementById('ctrl-footer-social-tiktok-active')?.checked !== false,
      footer_social_instagram_active: document.getElementById('ctrl-footer-social-instagram-active')?.checked !== false,
      footer_social_youtube_active: document.getElementById('ctrl-footer-social-youtube-active')?.checked !== false,
      footer_social_facebook_active: document.getElementById('ctrl-footer-social-facebook-active')?.checked !== false,
      footer_social_email_active: document.getElementById('ctrl-footer-social-email-active')?.checked !== false,
      footer_social_whatsapp_active: document.getElementById('ctrl-footer-social-whatsapp-active')?.checked !== false,

      footer_social_tiktok: footerSocialTiktok,
      footer_social_instagram: footerSocialInstagram,
      footer_social_youtube: footerSocialYoutube,
      footer_social_facebook: footerSocialFacebook,
      footer_social_email: footerSocialEmail,
      footer_social_whatsapp: footerSocialWhatsapp,

      footer_social_btn_icon_color: getInputValue('ctrl-footer-icon-hex') || '#64748b',
      footer_social_btn_bg_color: getInputValue('ctrl-footer-social-bg-hex') || '#f1f5f9',
      footer_social_btn_hover_bg_color: getInputValue('ctrl-footer-social-hover-bg-hex') || '#33b589',
      footer_social_btn_hover_icon_color: getInputValue('ctrl-footer-social-hover-color-hex') || '#ffffff',
      footer_social_btn_border_enable: document.getElementById('ctrl-footer-social-border-enable')?.checked === true,
      footer_social_btn_border_color: getInputValue('ctrl-footer-social-border-hex') || '#e2e8f0',
      footer_social_btn_radius: getSelectValue('ctrl-footer-social-radius-select') || '9999px',
      footer_social_btn_shadow: getSelectValue('ctrl-footer-social-shadow-select') || 'none',

      footer_bg_color: footerBgColor,
      footer_text_color: footerTextColor,
      footer_heading_color: footerHeadingColor,
      footer_border_color: footerBorderColor
    };

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
          ${renderNavIconHtml(searchIcon, 'text-xs absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none', `color: ${searchIconColor};`)}
          <div class="w-full text-xs pl-10 pr-4 py-2 sm:py-2.5 font-medium truncate shadow-inner select-none cursor-text transition-all" style="background-color: ${searchBgValue}; color: ${searchTextColor}; ${searchBorderStyle} ${searchRadiusStyle}">
            ${escapeHtml(searchPlaceholder)}
          </div>
        </div>
      </div>
    `;

    // Sub-Menu 4: Login Button Preview Element
    let loginContentHtml = '';
    const loginIconStyle = `color: ${loginIconColor}; font-size: ${loginIconSize}px; width: 1em; height: 1em;`;
    if (loginBtnDisplay === 'icon_only') {
      loginContentHtml = renderNavIconHtml(loginIcon, '', loginIconStyle);
    } else if (loginBtnDisplay === 'text_only') {
      loginContentHtml = `<span class="font-bold text-xs" style="color: ${loginTextColor};">${escapeHtml(loginBtnText)}</span>`;
    } else {
      loginContentHtml = `
        ${renderNavIconHtml(loginIcon, '', loginIconStyle)}
        <span class="hidden sm:inline font-bold text-xs" style="color: ${loginTextColor};">${escapeHtml(loginBtnText)}</span>
      `;
    }

    const loginBoxStyle = (loginBtnDisplay === 'icon_only')
      ? `width: ${loginBoxSize}px; height: ${loginBoxSize}px; min-width: ${loginBoxSize}px;`
      : `height: ${loginBoxSize}px; min-height: ${loginBoxSize}px; padding-left: 0.75rem; padding-right: 0.75rem;`;

    const loginBtnHtml = `
      <div data-section="navbar-login" class="inline-flex items-center justify-center gap-1.5 rounded-2xl text-xs font-bold border border-slate-200 shadow-xs shrink-0 cursor-pointer transition hover:opacity-95" style="background-color: ${loginBtnColor}; ${loginBoxStyle}">
        ${loginContentHtml}
      </div>
    `;

    // Sub-Menu 2: Cart Button Preview Element
    const cartBorderStyle = cartBorderEnable ? `border: 1px solid ${cartBorderColor};` : 'border: 1px solid transparent;';
    const cartRadiusStyle = `border-radius: ${cartBorderRadius}px;`;
    const cartBoxStyle = `width: ${cartBoxSize}px; height: ${cartBoxSize}px; min-width: ${cartBoxSize}px;`;

    const cartBtnHtml = `
      <div data-section="navbar-cart" class="relative flex items-center justify-center shadow-xs shrink-0 cursor-pointer transition hover:opacity-95" style="background-color: ${cartBgColor}; ${cartBorderStyle} ${cartRadiusStyle} ${cartBoxStyle}">
        <div class="relative flex items-center justify-center">
          ${renderNavIconHtml(cartIcon, '', `color: ${cartIconColor}; font-size: ${cartIconSize}px; width: 1em; height: 1em;`)}
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

    // --- C. HERO BANNER HTML (Standarisasi Desktop 9:2 & Mobile 16:5, Model 3 Teks & CTA, Split) ---
    const heroEnabled = document.getElementById('hero-enable-toggle')?.checked !== false;
    let heroHtml = '';

    if (heroEnabled) {
      const heroTitleColor = getInputValue('hero-title-color-hex') || '#ffffff';
      const heroDescColor = getInputValue('hero-desc-color-hex') || '#cbd5e1';
      const heroImgRad = (getInputValue('hero-image-radius-number') || '12') + 'px';
      const heroImgShadow = getSelectValue('hero-image-shadow-select') || 'sm';
      const heroImgShadowClass = (heroImgShadow === 'none') ? 'shadow-none' : `shadow-${heroImgShadow} hero-shadow-${heroImgShadow}`;

      const ctaSettings = {
        hero_cta_count_mode: getSelectValue('hero_cta_count_mode') || 'both',
        hero_cta1_show_icon: document.getElementById('hero_cta1_show_icon')?.checked !== false,
        hero_cta1_text: getInputValue('hero_cta1_text') || 'Lihat Produk',
        hero_cta1_icon: getSelectValue('hero_cta1_icon') || 'bi-arrow-down-short',
        hero_cta1_text_color: getInputValue('hero_cta1_text_color_hex') || '#ffffff',
        hero_cta1_icon_color: getInputValue('hero_cta1_icon_color_hex') || '#ffffff',
        hero_cta1_bg_color: getInputValue('hero_cta1_bg_color_hex') || primaryColor,
        hero_cta1_radius: getSelectValue('hero_cta1_radius_select') || '12px',
        hero_cta1_shadow: getSelectValue('hero_cta1_shadow_select') || 'sm',

        hero_cta2_show_icon: document.getElementById('hero_cta2_show_icon')?.checked !== false,
        hero_cta2_text: getInputValue('hero_cta2_text') || 'Konsultasi',
        hero_cta2_icon: getSelectValue('hero_cta2_icon') || 'bi-whatsapp',
        hero_cta2_wa_message: getInputValue('hero_cta2_wa_message') || 'Halo Admin *Nama Toko* saya ingin Konsultasi mengenai layanan/produk anda',
        hero_cta2_text_color: getInputValue('hero_cta2_text_color_hex') || '#0f172a',
        hero_cta2_icon_color: getInputValue('hero_cta2_icon_color_hex') || '#10b981',
        hero_cta2_bg_color: getInputValue('hero_cta2_bg_color_hex') || '#ffffff',
        hero_cta2_radius: getSelectValue('hero_cta2_radius_select') || '12px',
        hero_cta2_shadow: getSelectValue('hero_cta2_shadow_select') || 'sm',
        store_phone: getInputValue('ctrl-footer-social-whatsapp') || settings.store_phone || '0888-5844-380'
      };
      const heroCtaButtonsHtml = renderHeroCtaButtonsHtml(ctaSettings, storeName);

      const heroArrowsHtml = (heroShowArrows && banners.length > 1) ? `
        <button type="button" class="hero-prev-btn absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center transition-all duration-200 z-20 cursor-pointer ${heroArrowsVisibility === 'always' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} ${heroArrowsShadowClass}" style="background-color: ${heroArrowsBg}; color: ${heroArrowsIconColor}; border-radius: ${heroArrowsRadius};" title="Sebelumnya">
          <i class="bi bi-chevron-left text-xs sm:text-sm font-bold"></i>
        </button>
        <button type="button" class="hero-next-btn absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center transition-all duration-200 z-20 cursor-pointer ${heroArrowsVisibility === 'always' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} ${heroArrowsShadowClass}" style="background-color: ${heroArrowsBg}; color: ${heroArrowsIconColor}; border-radius: ${heroArrowsRadius};" title="Selanjutnya">
          <i class="bi bi-chevron-right text-xs sm:text-sm font-bold"></i>
        </button>
      ` : '';

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
          <div class="${heroWidthLayout === 'full' ? '-mx-3 sm:-mx-5 lg:-mx-6 -mt-3 sm:-mt-5 lg:-mt-6' : ''}">
            <div class="relative w-full overflow-hidden ${heroShadowClass} aspect-[16/5] sm:aspect-[16/5] md:aspect-[9/2] bg-slate-900 group" style="${heroWidthLayout === 'full' ? 'border-radius: 0;' : `border-radius: ${heroRadius};`} ${heroBorderBottomStyle}">
              <div class="w-full h-full relative">
                ${slides}
              </div>
              ${heroArrowsHtml}
              <!-- Dot Navigasi Melayang Murni di Bawah Banner -->
              <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 px-3 py-1 rounded-full bg-slate-950/30 backdrop-blur-xs">
                ${dots}
              </div>
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

        const mobileFlex = heroSplitMobile === 'image_bottom' ? 'flex flex-col-reverse md:flex-row' : 'flex flex-col md:flex-row';
        const imgOrder = heroSplitDesktopPos === 'image_left' ? 'md:order-1' : 'md:order-2';
        const textOrder = heroSplitDesktopPos === 'image_left' ? 'md:order-2' : 'md:order-1';

        heroHtml = `
          <div class="${heroWidthLayout === 'full' ? '-mx-3 sm:-mx-5 lg:-mx-6 -mt-3 sm:-mt-5 lg:-mt-6' : ''}">
            <div class="w-full overflow-hidden border border-slate-200/80 ${heroShadowClass} p-4 sm:p-6" style="${heroBgCss} ${heroWidthLayout === 'full' ? 'border-radius: 0; border-left: none; border-right: none;' : `border-radius: ${heroRadius};`} ${heroBorderBottomStyle}">
              <div class="${mobileFlex} gap-5 items-center">
                <div class="w-full md:w-5/12 ${textOrder} space-y-3">
                  <span class="inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-white/90 border border-emerald-200">
                    Percetakan Digital Terpadu
                  </span>
                  <h2 class="font-black text-lg sm:text-2xl leading-tight" style="color: ${heroTitleColor};">${escapeHtml(heroHeadline)}</h2>
                  <p class="text-xs leading-relaxed" style="color: ${heroDescColor};">${escapeHtml(heroSubheadline)}</p>
                  ${heroCtaButtonsHtml ? `<div class="pt-1">${heroCtaButtonsHtml}</div>` : ''}
                </div>
                <div class="w-full md:w-7/12 ${imgOrder}">
                  <div class="relative w-full aspect-[16/9] md:aspect-[16/9] overflow-hidden ${heroImgShadowClass} bg-slate-800 group" style="border-radius: ${heroImgRad};">
                    ${slides}
                    ${heroArrowsHtml}
                    <div class="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 px-2 py-0.5 rounded-full bg-slate-950/30">
                      ${dots}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      } else {
        // Model 1: Mode Teks & CTA
        heroHtml = `
          <div class="${heroWidthLayout === 'full' ? '-mx-3 sm:-mx-5 lg:-mx-6 -mt-3 sm:-mt-5 lg:-mt-6' : ''}">
            <div class="w-full border border-slate-200/80 ${heroShadowClass} p-6 sm:p-10 text-center space-y-3.5" style="${heroBgCss} ${heroWidthLayout === 'full' ? 'border-radius: 0; border-left: none; border-right: none;' : `border-radius: ${heroRadius};`} ${heroBorderBottomStyle}">
              <span class="inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-white border border-emerald-200 shadow-2xs">
                Promo Spesial Percetakan
              </span>
              <h2 class="font-black text-xl sm:text-3xl max-w-2xl mx-auto leading-tight" style="color: ${heroTitleColor};">${escapeHtml(heroHeadline)}</h2>
              <p class="text-xs sm:text-sm max-w-xl mx-auto leading-relaxed" style="color: ${heroDescColor};">${escapeHtml(heroSubheadline)}</p>
              ${heroCtaButtonsHtml ? `<div class="flex items-center justify-center pt-2">${heroCtaButtonsHtml}</div>` : ''}
            </div>
          </div>
        `;
      }
    }

    // --- D. NAVIGASI KATEGORI (Sinkronisasi Dinamis DB.getCategories) ---
    let dbCategories = [];
    if (typeof DB !== 'undefined' && typeof DB.getCategories === 'function') {
      try {
        dbCategories = DB.getCategories() || [];
      } catch (e) {
        dbCategories = [];
      }
    }
    const quickNavCategories = dbCategories.filter(c => c.show_in_quick_nav !== false);

    // Render Category Nav by Mode (Mobile & Desktop Decoupled)
    function renderPreviewCategoryNavByMode(mode, isDesktopView) {
      if (mode === 'dropdown') {
        const selectHtml = `
          <div class="relative w-full ${isDesktopView ? 'max-w-xs' : ''}">
            <i class="bi bi-grid-fill text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs"></i>
            <select class="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-8 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 shadow-2xs appearance-none">
              <option value="all">Semua Kategori</option>
              <option value="bestseller">Produk Terlaris</option>
              <option value="promo">Sedang Promo</option>
              ${quickNavCategories.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join('')}
            </select>
            <i class="bi bi-chevron-down text-slate-400 text-xs absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
          </div>
        `;

        if (isDesktopView) {
          return `
            <div class="flex items-center gap-3 w-full">
              ${selectHtml}
              <div class="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none flex-1 min-w-0">
                <button type="button" class="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs border text-white" style="background-color: ${primaryColor}; border-color: ${primaryColor};">
                  <i class="bi bi-grid-fill text-xs"></i>
                  <span>Semua</span>
                </button>
                <button type="button" class="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center shrink-0 shadow-xs border bg-white text-slate-800 border-slate-200 hover:bg-slate-50">
                  <span>Produk Terlaris</span>
                </button>
                <button type="button" class="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center shrink-0 shadow-xs border bg-white text-slate-800 border-slate-200 hover:bg-slate-50">
                  <span>Sedang Promo</span>
                </button>
              </div>
            </div>
          `;
        }

        return `
          <div class="w-full">
            ${selectHtml}
          </div>
        `;
      } else if (mode === 'pills_text') {
        return `
          <div class="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none w-full">
            <button type="button" class="px-3.5 py-1.5 rounded-full font-bold text-xs shrink-0 text-white shadow-2xs" style="background-color: ${primaryColor};">
              Semua
            </button>
            <button type="button" class="px-3.5 py-1.5 rounded-full font-bold text-xs shrink-0 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50">
              Terlaris
            </button>
            <button type="button" class="px-3.5 py-1.5 rounded-full font-bold text-xs shrink-0 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50">
              Promo
            </button>
            ${quickNavCategories.map(c => `
              <button type="button" class="px-3.5 py-1.5 rounded-full font-bold text-xs shrink-0 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50">
                ${escapeHtml(c.name)}
              </button>
            `).join('')}
          </div>
        `;
      } else {
        // Standar Icon & Gambar (cat-scroll-track & cat-item-peek: 10.5 item desktop, 5.5 item mobile)
        const allItemHtml = `
          <div class="cat-item-peek flex flex-col items-center justify-start text-center group cursor-pointer transition select-none shrink-0">
            <div class="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition group-hover:scale-105 group-hover:shadow-xs ring-2" style="background-color: ${primaryColor}; color: #ffffff; ring-color: ${primaryColor};">
              <i class="bi bi-grid-fill text-lg sm:text-xl md:text-2xl"></i>
            </div>
            <span class="text-[10px] sm:text-xs font-bold text-center line-clamp-2 mt-1.5 w-full break-words leading-tight" style="color: ${primaryColor};">
              Semua
            </span>
          </div>
        `;

        const bestItemHtml = `
          <div class="cat-item-peek flex flex-col items-center justify-start text-center group cursor-pointer transition select-none shrink-0">
            <div class="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition group-hover:scale-105 group-hover:shadow-xs border border-slate-200/80 bg-slate-100" style="background-color: #f1f5f9; color: #f59e0b;">
              <i class="bi bi-fire text-lg sm:text-xl md:text-2xl"></i>
            </div>
            <span class="text-[10px] sm:text-xs font-semibold text-center line-clamp-2 mt-1.5 w-full break-words leading-tight text-slate-700">
              Terlaris
            </span>
          </div>
        `;

        const promoItemHtml = `
          <div class="cat-item-peek flex flex-col items-center justify-start text-center group cursor-pointer transition select-none shrink-0">
            <div class="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition group-hover:scale-105 group-hover:shadow-xs border border-slate-200/80 bg-slate-100" style="background-color: #f1f5f9; color: #ef4444;">
              <i class="bi bi-ticket-perforated-fill text-lg sm:text-xl md:text-2xl"></i>
            </div>
            <span class="text-[10px] sm:text-xs font-semibold text-center line-clamp-2 mt-1.5 w-full break-words leading-tight text-slate-700">
              Promo
            </span>
          </div>
        `;

        const catsItemHtml = quickNavCategories.map(c => {
          let iconHtml;
          if (c.image) {
            iconHtml = `<img src="${c.image}" class="w-full h-full object-cover rounded-2xl" alt="${escapeHtml(c.name)}" onerror="this.onerror=null; this.outerHTML='<i class=\\'bi bi-tag-fill text-lg sm:text-xl md:text-2xl\\'></i>';" />`;
          } else {
            let bi = c.icon || 'bi-tag';
            if (!bi.startsWith('bi-') && !bi.startsWith('bi ')) bi = 'bi-' + bi;
            iconHtml = `<i class="bi ${bi} text-lg sm:text-xl md:text-2xl"></i>`;
          }
          return `
            <div class="cat-item-peek flex flex-col items-center justify-start text-center group cursor-pointer transition select-none shrink-0">
              <div class="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center overflow-hidden transition group-hover:scale-105 group-hover:shadow-xs border border-slate-200/80 bg-slate-100" style="background-color: #f1f5f9; color: ${primaryColor};">
                ${iconHtml}
              </div>
              <span class="text-[10px] sm:text-xs font-semibold text-center line-clamp-2 mt-1.5 w-full break-words leading-tight text-slate-700">
                ${escapeHtml(c.name)}
              </span>
            </div>
          `;
        }).join('');

        return `
          <div class="w-full relative">
            <div class="cat-scroll-track flex items-start justify-start gap-2 sm:gap-2.5 lg:gap-3 py-1 w-full">
              ${allItemHtml}
              ${bestItemHtml}
              ${promoItemHtml}
              ${catsItemHtml}
            </div>
          </div>
        `;
      }
    }

    const mobileCatNavHtml = renderPreviewCategoryNavByMode(catModeMobile, false);
    const desktopCatNavHtml = renderPreviewCategoryNavByMode(catModeDesktop, true);

    const catNavHtml = `
      <div id="quick-filter-container" class="w-full py-1">
        <!-- Mobile Viewport: Ditampilkan pada < lg -->
        <div class="block lg:hidden w-full">
          ${mobileCatNavHtml}
        </div>
        <!-- Desktop Viewport: Ditampilkan pada >= lg -->
        <div class="hidden lg:block w-full">
          ${desktopCatNavHtml}
        </div>
      </div>
    `;

    // --- E. GRID PRODUK STANDAR ---
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
      productCardsHtml = demoProducts.map(p => `
        <div class="h-full flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg transition-all cursor-pointer group relative">
          <div class="relative w-full aspect-square bg-slate-100 overflow-hidden shrink-0 rounded-t-2xl flex items-center justify-center">
            <img src="${p.img}" alt="${p.name}" class="w-full h-full object-cover transition group-hover:scale-105 duration-300" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 text-2xl font-bold\\'><i class=\\'bi bi-box-seam\\'></i></div>';" />
            <div class="absolute top-2 right-2 text-[10px] font-black px-1.5 py-0.5 rounded-lg shadow-md uppercase tracking-wider text-white" style="background-color: ${primaryColor};">
              <span>${p.discount}</span>
            </div>
          </div>
          <div class="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-2">
            <div class="space-y-1">
              <h4 class="line-clamp-2 text-xs font-semibold h-8 leading-snug text-slate-800 group-hover:text-emerald-700 transition" title="${p.name}">
                ${p.name}
              </h4>
              <div class="flex items-center gap-1.5 pt-0.5 flex-wrap">
                <span class="text-amber-500 font-bold text-[10px] flex items-center gap-0.5 shrink-0">
                  ★ ${p.rating}
                </span>
                <span class="inline-flex items-center text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Free Potong
                </span>
              </div>
            </div>
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
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
          ${productCardsHtml}
        </div>
      </div>
    `;

    // --- F. AUXILIARY SECTION HTML (FEATURED, SPONSOR, PROMO CARD, STATIC BANNER) ---
    const featuredHtml = `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <h3 class="font-extrabold text-sm text-slate-900 tracking-tight">Produk Unggulan &amp; Prioritas</h3>
          </div>
          <span class="text-xs font-bold text-amber-600 hover:underline cursor-pointer">Lihat Semua Unggulan &rarr;</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="rounded-2xl border-2 border-amber-300 bg-white p-4 shadow-sm hover:shadow-md transition space-y-3">
            <div class="w-full aspect-[16/9] rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden relative">
              <img src="assets/images/logo-songer-creative.png" class="h-16 w-auto object-contain" alt="Featured 1" />
              <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-500 text-white font-black text-[10px] uppercase">Paling Dicari</span>
            </div>
            <div>
              <h4 class="font-bold text-sm text-slate-900">Paket Branding Booth Usaha Komplit</h4>
              <p class="text-xs text-slate-500 mt-0.5">Spanduk 3x1m + Roll-up Banner + Brosur 500 pcs + Stiker Logo</p>
              <div class="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
                <span class="font-black text-sm text-emerald-700">Rp 350.000</span>
                <span class="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px]">Pesan Kilat</span>
              </div>
            </div>
          </div>
          <div class="rounded-2xl border-2 border-amber-300 bg-white p-4 shadow-sm hover:shadow-md transition space-y-3">
            <div class="w-full aspect-[16/9] rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden relative">
              <img src="assets/images/logo-songer-creative.png" class="h-16 w-auto object-contain" alt="Featured 2" />
              <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-500 text-white font-black text-[10px] uppercase">Best Seller</span>
            </div>
            <div>
              <h4 class="font-bold text-sm text-slate-900">Roll Up Banner Aluminium Luxury 85x200cm</h4>
              <p class="text-xs text-slate-500 mt-0.5">Rangka tebal anti-karat, bahan luster satin anti-kerut &amp; tas kanvas.</p>
              <div class="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
                <span class="font-black text-sm text-emerald-700">Rp 175.000</span>
                <span class="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px]">Pesan Kilat</span>
              </div>
            </div>
          </div>
          <div class="rounded-2xl border-2 border-amber-300 bg-white p-4 shadow-sm hover:shadow-md transition space-y-3 hidden lg:block">
            <div class="w-full aspect-[16/9] rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden relative">
              <img src="assets/images/logo-songer-creative.png" class="h-16 w-auto object-contain" alt="Featured 3" />
              <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-500 text-white font-black text-[10px] uppercase">Premium</span>
            </div>
            <div>
              <h4 class="font-bold text-sm text-slate-900">Neon Box Akrilik Custom LED Backlit</h4>
              <p class="text-xs text-slate-500 mt-0.5">Bentuk bulat / kotak presisi laser cut dengan modul LED Samsung hemat daya.</p>
              <div class="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
                <span class="font-black text-sm text-emerald-700">Rp 480.000</span>
                <span class="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px]">Pesan Kilat</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const sponsorHtml = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between shadow-sm">
          <div class="space-y-1">
            <span class="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-[10px] font-bold">Mitra Resmi Terverifikasi</span>
            <h4 class="font-black text-sm">Finishing Laminasi &amp; UV Spot HD</h4>
            <p class="text-[11px] text-blue-200">Katalog material premium dari distributor terpercaya</p>
          </div>
          <button class="px-3 py-1.5 rounded-xl bg-white text-blue-900 font-bold text-xs shadow hover:bg-blue-50 transition">Kunjungi</button>
        </div>
        <div class="p-4 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between shadow-sm">
          <div class="space-y-1">
            <span class="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-bold">Garansi Hasil CMYK</span>
            <h4 class="font-black text-sm">Mesin Cetak Konica Minolta 2026</h4>
            <p class="text-[11px] text-emerald-200">Presisi warna tajam hingga 2400 DPI</p>
          </div>
          <button class="px-3 py-1.5 rounded-xl bg-white text-emerald-900 font-bold text-xs shadow hover:bg-emerald-50 transition">Detail</button>
        </div>
      </div>
    `;

    const promoCardHtml = `
      <div class="p-5 rounded-2xl bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shrink-0">
            <i class="bi bi-ticket-perforated-fill"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-md bg-white text-rose-600 font-black text-[10px] uppercase">Flash Sale Terbatas</span>
              <span class="text-xs font-semibold text-rose-100 flex items-center gap-1"><i class="bi bi-clock"></i> Berakhir 02:45:10</span>
            </div>
            <h3 class="font-black text-base sm:text-lg mt-0.5">Diskon Hingga 35% Untuk Cetak Spanduk &amp; Stiker</h3>
          </div>
        </div>
        <button class="px-5 py-2.5 rounded-xl bg-white text-rose-600 font-extrabold text-xs shadow-lg hover:bg-rose-50 transition shrink-0 whitespace-nowrap">
          Klaim Diskon Sekarang &rarr;
        </button>
      </div>
    `;

    const staticBannerHtml = `
      <div class="w-full p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
        <div class="flex items-center gap-3">
          <i class="bi bi-shield-check text-emerald-400 text-2xl"></i>
          <div>
            <h4 class="font-bold text-xs sm:text-sm">Jaminan Cetak Ulang Gratis Jika Salah Ukuran / Warna Melenceng</h4>
            <p class="text-[11px] text-slate-400">Hubungi CS kami dalam 1x24 jam setelah barang diterima di workshop.</p>
          </div>
        </div>
        <span class="hidden sm:inline-block px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold">Syarat &amp; Ketentuan</span>
      </div>
    `;

    // SINKRONISASI DAFTAR SEKSI AKTIF & GARIS PEMISAH DINAMIS
    const activeSectionsList = (Array.isArray(storefrontSections) && storefrontSections.length > 0)
      ? storefrontSections
      : [
        { id: 'sec_hero', type: 'hero', enabled: true },
        { id: 'sec_category', type: 'category', enabled: true },
        { id: 'sec_products_standard', type: 'products_standard', enabled: true }
      ];

    const renderedSectionBlocks = [];
    activeSectionsList.forEach(sec => {
      if (sec.enabled === false) return;
      if (sec.type === 'hero') {
        renderedSectionBlocks.push(`<div data-section="hero" class="w-full">${heroHtml}</div>`);
      } else if (sec.type === 'category') {
        renderedSectionBlocks.push(`<div data-section="category" class="w-full">${catNavHtml}</div>`);
      } else if (sec.type === 'products_standard') {
        renderedSectionBlocks.push(`<div data-section="products" class="w-full">${gridHtml}</div>`);
      } else if (sec.type === 'products_featured') {
        renderedSectionBlocks.push(`<div data-section="products-featured" class="w-full">${featuredHtml}</div>`);
      } else if (sec.type === 'sponsor_slot') {
        renderedSectionBlocks.push(`<div data-section="sponsor-slot" class="w-full">${sponsorHtml}</div>`);
      } else if (sec.type === 'promo_card') {
        renderedSectionBlocks.push(`<div data-section="promo-card" class="w-full">${promoCardHtml}</div>`);
      } else if (sec.type === 'static_banner') {
        renderedSectionBlocks.push(`<div data-section="static-banner" class="w-full">${staticBannerHtml}</div>`);
      }
    });

    const mainSectionsHtml = renderedSectionBlocks.join(dividerHtml);

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
          if (slides.length <= 1) return;
          let next = (currentIdx + 1) % slides.length;
          showSlide(next);
        }

        function prevSlide() {
          if (slides.length <= 1) return;
          let prev = (currentIdx - 1 + slides.length) % slides.length;
          showSlide(prev);
        }

        document.querySelectorAll('.hero-prev-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            prevSlide();
            resetTimer();
          });
        });

        document.querySelectorAll('.hero-next-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            nextSlide();
            resetTimer();
          });
        });

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

        // --- 3. LUCIDE ICONS & CTA 1 SMOOTH SCROLL ---
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          window.lucide.createIcons();
        }

        const cta1Btn = document.getElementById('hero-btn-cta1');
        if (cta1Btn) {
          cta1Btn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById('buyer-storefront-container') || document.querySelector('main');
            if (target) {
              target.scrollIntoView({ behavior: 'smooth' });
            }
          });
        }
      })();
    `;

    function renderPreviewFooterHtml(settings, storeName) {
      const layout = settings.footer_layout || 'multi_column';
      const tagline = settings.store_tagline || 'Sistem E-Commerce & Percetakan Terpadu';
      const copyrightText = settings.footer_copyright_text || `© ${new Date().getFullYear()} ${storeName}. All rights reserved.`;
      const headingCol = settings.footer_heading_color || '#0f172a';
      const textCol = settings.footer_text_color || '#64748b';
      const borderCol = settings.footer_border_color || '#e2e8f0';

      // Logo Footer
      const showLogo = settings.footer_show_logo !== false;
      const logoUrl = (settings.footer_logo_type === 'custom' && settings.footer_custom_logo_url)
        ? settings.footer_custom_logo_url
        : (settings.store_logo_url || 'assets/images/logo-songer-creative.png');

      const logoHtml = showLogo ? `
        <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(storeName)}" class="h-8 w-auto object-contain shrink-0" onerror="this.onerror=null; this.outerHTML='<span class=\\'font-black text-sm\\' style=\\'color: ${headingCol};\\'>${escapeHtml(storeName)}</span>';" />
      ` : '';

      // Store name & slogan
      const showStoreName = settings.footer_show_store_name !== false;
      const storeNameCol = settings.footer_store_name_color || headingCol;
      const taglineCol = settings.footer_tagline_color || textCol;

      const storeNameHtml = showStoreName ? `
        <h4 class="font-extrabold text-sm" style="color: ${storeNameCol};">${escapeHtml(storeName)}</h4>
      ` : '';
      const taglineHtml = `<p class="text-[11px] leading-relaxed" style="color: ${taglineCol};">${escapeHtml(tagline)}</p>`;

      // Popular categories dynamic from DB & checklist
      const catLinkCol = settings.footer_category_link_color || textCol;
      const catHoverCol = settings.footer_category_hover_color || '#33b589';

      let categoriesToDisplay = [];
      if (Array.isArray(settings.footer_selected_categories) && settings.footer_selected_categories.length > 0) {
        let allDbCats = [];
        if (typeof DB !== 'undefined' && typeof DB.getCategories === 'function') {
          allDbCats = DB.getCategories() || [];
        }
        categoriesToDisplay = allDbCats.filter(c => settings.footer_selected_categories.includes(c.id));
      }
      if (categoriesToDisplay.length === 0) {
        categoriesToDisplay = [
          { name: 'Digital Printing & Banner' },
          { name: 'Stiker Vinyl & Label Kemasan' },
          { name: 'Kartu Nama & Brosur' },
          { name: 'Merchandise & Souvenir' }
        ];
      }

      const categoriesHtml = categoriesToDisplay.map(c => `
        <li><a href="javascript:void(0)" class="transition flex items-center gap-1.5 hover:underline" style="color: ${catLinkCol};" onmouseenter="this.style.color='${catHoverCol}'" onmouseleave="this.style.color='${catLinkCol}'"><i class="bi bi-chevron-right text-[10px]"></i> ${escapeHtml(c.name)}</a></li>
      `).join('');

      // Social buttons with individual toggles & custom styling
      const socIconCol = settings.footer_social_btn_icon_color || '#64748b';
      const socBgCol = settings.footer_social_btn_bg_color || '#f1f5f9';
      const socHoverBg = settings.footer_social_btn_hover_bg_color || '#33b589';
      const socHoverIcon = settings.footer_social_btn_hover_icon_color || '#ffffff';
      const socBorderEnable = Boolean(settings.footer_social_btn_border_enable);
      const socBorderCol = settings.footer_social_btn_border_color || '#e2e8f0';
      const socRadius = settings.footer_social_btn_radius || '9999px';
      const socShadow = (settings.footer_social_btn_shadow && settings.footer_social_btn_shadow !== 'none') ? `shadow-${settings.footer_social_btn_shadow}` : '';
      const socBorderStyle = socBorderEnable ? `border: 1px solid ${socBorderCol};` : 'border: none;';

      const activeSocials = [];
      if (settings.footer_social_tiktok_active !== false && settings.footer_social_tiktok) {
        activeSocials.push({ icon: 'bi-tiktok', label: 'TikTok', url: settings.footer_social_tiktok });
      }
      if (settings.footer_social_instagram_active !== false && settings.footer_social_instagram) {
        activeSocials.push({ icon: 'bi-instagram', label: 'Instagram', url: settings.footer_social_instagram });
      }
      if (settings.footer_social_youtube_active !== false && settings.footer_social_youtube) {
        activeSocials.push({ icon: 'bi-youtube', label: 'YouTube', url: settings.footer_social_youtube });
      }
      if (settings.footer_social_facebook_active !== false && settings.footer_social_facebook) {
        activeSocials.push({ icon: 'bi-facebook', label: 'Facebook', url: settings.footer_social_facebook });
      }
      if (settings.footer_social_email_active !== false && settings.footer_social_email) {
        activeSocials.push({ icon: 'bi-envelope-fill', label: 'Email', url: `mailto:${settings.footer_social_email}` });
      }
      if (settings.footer_social_whatsapp_active !== false && (settings.footer_social_whatsapp || settings.store_phone)) {
        const cleanWa = (settings.footer_social_whatsapp || settings.store_phone).replace(/[^0-9]/g, '');
        activeSocials.push({ icon: 'bi-whatsapp', label: 'WhatsApp', url: `https://wa.me/${cleanWa}` });
      }

      if (activeSocials.length === 0) {
        activeSocials.push(
          { icon: 'bi-instagram', label: 'Instagram', url: '#' },
          { icon: 'bi-tiktok', label: 'TikTok', url: '#' },
          { icon: 'bi-whatsapp', label: 'WhatsApp', url: '#' }
        );
      }

      const socialButtonsHtml = activeSocials.map(s => `
        <a href="${escapeHtml(s.url)}" target="_blank" class="w-8 h-8 flex items-center justify-center transition-all duration-200 cursor-pointer ${socShadow}" style="background-color: ${socBgCol}; color: ${socIconCol}; border-radius: ${socRadius}; ${socBorderStyle}" onmouseenter="this.style.backgroundColor='${socHoverBg}'; this.style.color='${socHoverIcon}';" onmouseleave="this.style.backgroundColor='${socBgCol}'; this.style.color='${socIconCol}';" title="${escapeHtml(s.label)}">
          <i class="bi ${s.icon} text-sm"></i>
        </a>
      `).join('');

      if (layout === 'minimalist') {
        return `
          <div class="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
              ${logoHtml}
              ${showStoreName ? `<span class="font-bold" style="color: ${storeNameCol};">${escapeHtml(storeName)}</span>` : ''}
              <span class="text-slate-300 hidden sm:inline">•</span>
              <span style="color: ${textCol};">${escapeHtml(copyrightText)}</span>
            </div>
            <div class="flex items-center gap-2">
              ${socialButtonsHtml}
            </div>
          </div>
        `;
      }

      if (layout === 'centered') {
        return `
          <div class="max-w-2xl mx-auto px-4 py-8 text-center space-y-3 text-xs">
            ${logoHtml ? `<div class="flex justify-center">${logoHtml}</div>` : ''}
            <div>
              ${storeNameHtml}
              ${taglineHtml}
            </div>
            <div class="flex items-center justify-center gap-2 pt-1">
              ${socialButtonsHtml}
            </div>
            <div class="pt-3 border-t text-[11px]" style="border-color: ${borderCol}; color: ${textCol};">
              ${escapeHtml(copyrightText)}
            </div>
          </div>
        `;
      }

      // Default: multi_column
      return `
        <div class="max-w-7xl mx-auto px-4 py-8 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="space-y-2">
              ${logoHtml}
              ${storeNameHtml}
              ${taglineHtml}
              <div class="pt-1">
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold">
                  <i class="bi bi-whatsapp"></i> CS WhatsApp
                </span>
              </div>
            </div>
            <div class="space-y-1.5">
              <h5 class="font-bold text-xs uppercase tracking-wider" style="color: ${headingCol};">Jam Operasional</h5>
              <div class="space-y-1 text-[11px]" style="color: ${textCol};">
                <p class="font-semibold" style="color: ${headingCol};">Hari Kerja:</p>
                <p>${escapeHtml(settings.footer_hours_weekday || 'Senin - Sabtu: 08:00 - 21:00 WIB')}</p>
                <p class="font-semibold pt-1" style="color: ${headingCol};">Akhir Pekan:</p>
                <p>${escapeHtml(settings.footer_hours_weekend || 'Minggu & Hari Libur: 09:00 - 17:00 WIB')}</p>
              </div>
            </div>
            <div class="space-y-1.5">
              <h5 class="font-bold text-xs uppercase tracking-wider" style="color: ${headingCol};">Kategori Populer</h5>
              <ul class="space-y-1 text-[11px]">
                ${categoriesHtml}
              </ul>
            </div>
            <div class="space-y-2">
              <h5 class="font-bold text-xs uppercase tracking-wider" style="color: ${headingCol};">Media Sosial Resmi</h5>
              <p class="text-[11px]" style="color: ${textCol};">Ikuti akun resmi kami untuk promo diskon:</p>
              <div class="flex items-center gap-1.5 flex-wrap">
                ${socialButtonsHtml}
              </div>
            </div>
          </div>
          <div class="mt-6 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]" style="border-color: ${borderCol}; color: ${textCol};">
            <p>${escapeHtml(copyrightText)}</p>
            <p class="opacity-75">Sistem POS &amp; E-Commerce Terpadu</p>
          </div>
        </div>
      `;
    }

    // Dokumen HTML Lengkap untuk iframe.srcdoc dengan data-section enrichment
    const docHtml = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: {
                  sans: ['var(--store-font-body)', 'sans-serif'],
                  heading: ['var(--store-font-heading)', 'sans-serif']
                }
              }
            }
          };
        </script>
        <script src="https://unpkg.com/lucide@latest"></script>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;600;700;800&family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&family=Montserrat:wght@400;500;600;700;800&family=Open+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          :root {
            --store-font-heading: '${fontHeading}', sans-serif;
            --store-font-body: '${fontBody}', sans-serif;
          }
          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
          }
          body {
            background-color: ${bodyBg};
            font-family: var(--store-font-body);
            overflow-x: hidden;
            overflow-y: auto;
            -webkit-font-smoothing: antialiased;
          }
          h1, h2, h3, h4, h5, h6, .font-heading, [class*="font-black"], [class*="font-extrabold"] {
            font-family: var(--store-font-heading);
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

          /* Hero Slider Arrow Hover */
          .hero-prev-btn:hover, .hero-next-btn:hover {
            background-color: ${heroArrowsHoverBg} !important;
          }

          /* Category Peeking (Desktop 10.5, Mobile 5.5 identik buyer-store) */
          .cat-scroll-track {
            display: flex;
            align-items: flex-start;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .cat-scroll-track::-webkit-scrollbar {
            display: none;
          }
          .cat-item-peek {
            --cat-gap: 8px;
            flex: 0 0 calc((100% - (5 * var(--cat-gap))) / 5.5);
            width: calc((100% - (5 * var(--cat-gap))) / 5.5);
            min-width: calc((100% - (5 * var(--cat-gap))) / 5.5);
          }
          @media (min-width: 640px) {
            .cat-item-peek {
              --cat-gap: 10px;
              flex: 0 0 calc((100% - (7 * var(--cat-gap))) / 7.5);
              width: calc((100% - (7 * var(--cat-gap))) / 7.5);
              min-width: calc((100% - (7 * var(--cat-gap))) / 7.5);
            }
          }
          @media (min-width: 1024px) {
            .cat-item-peek {
              --cat-gap: 12px;
              flex: 0 0 calc((100% - (10 * var(--cat-gap))) / 10.5);
              width: calc((100% - (10 * var(--cat-gap))) / 10.5);
              min-width: calc((100% - (10 * var(--cat-gap))) / 10.5);
            }
            .cat-scroll-track.justify-center {
              overflow-x: visible;
            }
          }

          /* Normalisasi Otomatis Ikon Lucide SVG vs Bootstrap Icons */
          svg.lucide, i.bi, i[data-lucide] {
            width: 1em !important;
            height: 1em !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            line-height: 1 !important;
            vertical-align: middle !important;
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

        <!-- MAIN STOREFRONT VIEWPORT DENGAN SECTION BUILDER & DIVIDER DINAMIS -->
        <main class="flex-1 p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full space-y-5">
          ${mainSectionsHtml}
        </main>

        <!-- FOOTER TOKO (DATA-SECTION="FOOTER-SOCIAL") -->
        <footer data-section="footer-social" class="w-full shrink-0 border-t transition-colors duration-200 cursor-pointer" style="background-color: ${footerBgColor}; border-color: ${footerBorderColor};">
          ${renderPreviewFooterHtml(previewSettings, storeName)}
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
        topbar_show_greeting: document.getElementById('enable-greeting-toggle')?.checked !== false,
        enable_customer_greeting: document.getElementById('enable-greeting-toggle')?.checked !== false,
        show_topbar_greeting: document.getElementById('enable-greeting-toggle')?.checked !== false,
        top_bar_greeting_text: getInputValue('top-bar-greeting-text-input'),
        greeting_text: getInputValue('top-bar-greeting-text-input'),

        topbar_show_countdown: document.getElementById('enable-promo-countdown-toggle')?.checked !== false,
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
        cart_icon_size: parseInt(getInputValue('cart_icon_size_slider') || '16', 10),
        cart_box_size: parseInt(getInputValue('cart_box_size_slider') || '38', 10),
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
        login_icon_size: parseInt(getInputValue('login_icon_size_slider') || '16', 10),
        login_box_size: parseInt(getInputValue('login_box_size_slider') || '38', 10),

        // Hero Banner Settings
        hero_enabled: document.getElementById('hero-enable-toggle')?.checked !== false,
        hero_model: document.querySelector('input[name="hero_model_radio"]:checked')?.value || getSelectValue('hero_model_select') || 'non_split',
        hero_headline: getInputValue('hero-headline-input'),
        hero_title_color: getInputValue('hero-title-color-hex') || '#ffffff',
        hero_subheadline: getInputValue('hero-subheadline-input'),
        hero_desc_color: getInputValue('hero-desc-color-hex') || '#cbd5e1',
        hero_slider_animation: getSelectValue('hero-slider-animation-select') || 'slide_5s',
        banners: [...currentBanners],
        hero_banners: [...currentBanners],

        // Hero Granular Settings
        hero_width_layout: getRadioValue('hero_width_layout_radio') || 'boxed',
        hero_split_mobile: getRadioValue('hero_split_mobile_radio') || 'image_top',
        hero_split_desktop_pos: getRadioValue('hero_split_desktop_pos_radio') || 'text_left',
        hero_bg_type: getSelectValue('hero-bg-type-select') || 'linear_gradient',
        hero_bg_color1: getInputValue('hero-bg-color1-hex') || '#0f172a',
        hero_bg_color2: getInputValue('hero-bg-color2-hex') || '#064e3b',
        hero_bg_angle: parseInt(getInputValue('hero-bg-angle-input') || '135', 10),
        hero_container_radius: (getInputValue('hero-container-radius-number') || '16') + 'px',
        hero_container_shadow: getSelectValue('hero-container-shadow-select') || 'sm',
        hero_border_bottom_enable: Boolean(document.getElementById('hero-border-bottom-toggle')?.checked),
        hero_border_bottom_color: getInputValue('hero-border-bottom-color-hex') || '#e2e8f0',
        hero_border_bottom_thickness: getSelectValue('hero-border-bottom-thickness-select') || '1px',
        hero_image_radius: (getInputValue('hero-image-radius-number') || '12') + 'px',
        hero_image_shadow: getSelectValue('hero-image-shadow-select') || 'sm',

        // Hero CTA Settings
        hero_cta_count_mode: getSelectValue('hero_cta_count_mode') || 'both',
        hero_cta1_show_icon: document.getElementById('hero_cta1_show_icon')?.checked !== false,
        hero_cta1_text: getInputValue('hero_cta1_text') || 'Lihat Produk',
        hero_cta1_icon: getSelectValue('hero_cta1_icon') || 'bi-arrow-down-short',
        hero_cta1_text_color: getInputValue('hero_cta1_text_color_hex') || '#ffffff',
        hero_cta1_icon_color: getInputValue('hero_cta1_icon_color_hex') || '#ffffff',
        hero_cta1_bg_color: getInputValue('hero_cta1_bg_color_hex') || '#33b589',
        hero_cta1_radius: getSelectValue('hero_cta1_radius_select') || '12px',
        hero_cta1_shadow: getSelectValue('hero_cta1_shadow_select') || 'sm',

        hero_cta2_show_icon: document.getElementById('hero_cta2_show_icon')?.checked !== false,
        hero_cta2_text: getInputValue('hero_cta2_text') || 'Konsultasi',
        hero_cta2_icon: getSelectValue('hero_cta2_icon') || 'bi-whatsapp',
        hero_cta2_wa_message: getInputValue('hero_cta2_wa_message') || 'Halo Admin *Nama Toko* saya ingin Konsultasi mengenai layanan/produk anda',
        hero_cta2_text_color: getInputValue('hero_cta2_text_color_hex') || '#0f172a',
        hero_cta2_icon_color: getInputValue('hero_cta2_icon_color_hex') || '#10b981',
        hero_cta2_bg_color: getInputValue('hero_cta2_bg_color_hex') || '#ffffff',
        hero_cta2_radius: getSelectValue('hero_cta2_radius_select') || '12px',
        hero_cta2_shadow: getSelectValue('hero_cta2_shadow_select') || 'sm',

        // Hero Slider Navigation & Arrows
        hero_dots_active_color: getInputValue('hero-dots-active-hex') || '#10b981',
        hero_dots_inactive_color: getInputValue('hero-dots-inactive-hex') || '#cbd5e1',
        hero_show_arrows: document.getElementById('hero-show-arrows-toggle')?.checked !== false,
        hero_arrows_visibility: getRadioValue('hero_arrows_visibility_radio') || 'hover',
        hero_arrows_bg: getInputValue('hero-arrows-bg') || '#0F172A',
        hero_arrows_hover_bg: getInputValue('hero-arrows-hover-bg') || '#1E293B',
        hero_arrows_icon_color: getInputValue('hero-arrows-icon-color') || '#ffffff',
        hero_arrows_radius: getSelectValue('hero-arrows-radius') || '9999px',
        hero_arrows_shadow: getSelectValue('hero-arrows-shadow') || 'sm',

        // Section Divider
        divider_enabled: document.getElementById('ctrl-divider-enabled')?.checked !== false,
        divider_color: getInputValue('ctrl-divider-color-hex') || '#e2e8f0',
        divider_thickness: parseInt(getInputValue('ctrl-divider-thickness-slider') || '1', 10),
        divider_width: getSelectValue('ctrl-divider-width-select') || '100%',
        divider_margin_y: parseInt(getInputValue('ctrl-divider-margin-slider') || '20', 10),

        // Section Builder
        storefront_sections: JSON.parse(JSON.stringify(storefrontSections)),

        // Categories & Products
        category_nav_mode_mobile: getRadioValue('category_nav_mode_mobile_radio'),
        category_nav_mode_desktop: getRadioValue('category_nav_mode_desktop_radio'),
        card_product_version: getRadioValue('card_product_version_radio'),

        // Colors
        primary_color: getInputValue('ctrl-hex-primary'),
        primary_hover_color: (typeof Utils !== 'undefined' && Utils.adjustColorBrightness) ? Utils.adjustColorBrightness(getInputValue('ctrl-hex-primary'), -15) : undefined,
        secondary_color: getInputValue('ctrl-hex-secondary'),
        secondary_hover_color: (typeof Utils !== 'undefined' && Utils.adjustColorBrightness) ? Utils.adjustColorBrightness(getInputValue('ctrl-hex-secondary'), -15) : undefined,
        body_bg_color: getInputValue('ctrl-hex-body-bg'),

        // Tipografi (Google Fonts)
        store_font_heading: getSelectValue('store_font_heading_select') || 'Bricolage Grotesque',
        store_font_body: getSelectValue('store_font_body_select') || 'Inter',

        // Footer & Media Sosial Settings
        footer_layout: getSelectValue('ctrl-footer-layout') || 'multi_column',
        footer_copyright_text: getInputValue('ctrl-footer-copyright'),
        footer_hours_weekday: getInputValue('ctrl-footer-hours-weekday'),
        footer_hours_weekend: getInputValue('ctrl-footer-hours-weekend'),

        footer_show_logo: document.getElementById('ctrl-footer-show-logo')?.checked !== false,
        footer_logo_type: getRadioValue('ctrl-footer-logo-type') || 'main',
        footer_custom_logo_url: getInputValue('ctrl-footer-custom-logo-url'),

        footer_show_store_name: document.getElementById('ctrl-footer-show-store-name')?.checked !== false,
        footer_store_name_color: getInputValue('ctrl-footer-store-name-hex') || '#0f172a',
        footer_tagline_color: getInputValue('ctrl-footer-tagline-hex') || '#64748b',

        footer_selected_categories: Array.from(document.querySelectorAll('#footer-categories-checklist-container .footer-cat-checkbox:checked')).map(cb => cb.value),
        footer_category_link_color: getInputValue('ctrl-footer-cat-link-hex') || '#64748b',
        footer_category_hover_color: getInputValue('ctrl-footer-cat-hover-hex') || '#33b589',

        footer_social_tiktok_active: document.getElementById('ctrl-footer-social-tiktok-active')?.checked !== false,
        footer_social_instagram_active: document.getElementById('ctrl-footer-social-instagram-active')?.checked !== false,
        footer_social_youtube_active: document.getElementById('ctrl-footer-social-youtube-active')?.checked !== false,
        footer_social_facebook_active: document.getElementById('ctrl-footer-social-facebook-active')?.checked !== false,
        footer_social_email_active: document.getElementById('ctrl-footer-social-email-active')?.checked !== false,
        footer_social_whatsapp_active: document.getElementById('ctrl-footer-social-whatsapp-active')?.checked !== false,

        footer_social_tiktok: getInputValue('ctrl-footer-social-tiktok'),
        footer_social_instagram: getInputValue('ctrl-footer-social-instagram'),
        footer_social_youtube: getInputValue('ctrl-footer-social-youtube'),
        footer_social_facebook: getInputValue('ctrl-footer-social-facebook'),
        footer_social_email: getInputValue('ctrl-footer-social-email'),
        footer_social_whatsapp: getInputValue('ctrl-footer-social-whatsapp'),

        footer_social_btn_icon_color: getInputValue('ctrl-footer-icon-hex') || '#64748b',
        footer_social_btn_bg_color: getInputValue('ctrl-footer-social-bg-hex') || '#f1f5f9',
        footer_social_btn_hover_bg_color: getInputValue('ctrl-footer-social-hover-bg-hex') || '#33b589',
        footer_social_btn_hover_icon_color: getInputValue('ctrl-footer-social-hover-color-hex') || '#ffffff',
        footer_social_btn_border_enable: document.getElementById('ctrl-footer-social-border-enable')?.checked === true,
        footer_social_btn_border_color: getInputValue('ctrl-footer-social-border-hex') || '#e2e8f0',
        footer_social_btn_radius: getSelectValue('ctrl-footer-social-radius-select') || '9999px',
        footer_social_btn_shadow: getSelectValue('ctrl-footer-social-shadow-select') || 'none',

        footer_bg_color: getInputValue('ctrl-footer-bg-hex'),
        footer_text_color: getInputValue('ctrl-footer-text-hex'),
        footer_heading_color: getInputValue('ctrl-footer-heading-hex'),
        footer_border_color: getInputValue('ctrl-footer-border-hex')
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

        setEditorDirty(false);
        showToast('Perubahan tema berhasil diterapkan ke toko!', 'success');
        updateLivePreview();
      } catch (err) {
        console.error('[ThemeEditor] Gagal menyimpan tema:', err);
        showToast('Gagal menyimpan pengaturan: ' + err.message, 'error');
      }
    });
  }

  // ============================================================================
  // 11B. STATE HISTORY ENGINE (SHOPIFY-STYLE UNDO / REDO)
  // ============================================================================
  function captureCurrentEditorSnapshot() {
    const form = document.getElementById('form-theme-editor');
    if (!form) return null;

    const elements = {};
    form.querySelectorAll('input, select, textarea').forEach(el => {
      if (el.id) {
        if (el.type === 'checkbox') {
          elements[el.id] = { type: 'checkbox', value: el.checked };
        } else if (el.type !== 'radio') {
          elements[el.id] = { type: 'value', value: el.value };
        }
      }
    });

    const radios = {};
    form.querySelectorAll('input[type="radio"]:checked').forEach(r => {
      if (r.name) radios[r.name] = r.value;
    });

    const footerCategories = Array.from(
      document.querySelectorAll('#footer-categories-checklist-container .footer-cat-checkbox:checked')
    ).map(cb => cb.value);

    return {
      elements,
      radios,
      footerCategories,
      currentBanners: [...currentBanners],
      storefrontSections: JSON.parse(JSON.stringify(storefrontSections || []))
    };
  }

  function recordHistoryDebounced() {
    if (isApplyingHistory) return;
    if (historyDebounceTimer) clearTimeout(historyDebounceTimer);
    historyDebounceTimer = setTimeout(() => {
      pushHistorySnapshot();
    }, 350);
  }

  function pushHistorySnapshot(force = false) {
    if (isApplyingHistory) return;
    const snapshot = captureCurrentEditorSnapshot();
    if (!snapshot) return;

    const snapshotJson = JSON.stringify(snapshot);

    // Hindari duplikasi state berturut-turut
    if (!force && historyIndex >= 0 && historyIndex < historyStack.length) {
      if (historyStack[historyIndex] === snapshotJson) {
        return;
      }
    }

    // Jika sedang berada di tengah riwayat dan terjadi perubahan baru, buang riwayat cabang depan
    if (historyIndex < historyStack.length - 1) {
      historyStack = historyStack.slice(0, historyIndex + 1);
    }

    historyStack.push(snapshotJson);
    if (historyStack.length > HISTORY_MAX_DEPTH) {
      historyStack.shift();
    }
    historyIndex = historyStack.length - 1;

    updateUndoRedoUI();
  }

  function applyEditorSnapshot(snapshot) {
    if (!snapshot) return;
    isApplyingHistory = true;

    try {
      if (snapshot.elements) {
        Object.keys(snapshot.elements).forEach(id => {
          const el = document.getElementById(id);
          if (!el) return;
          const data = snapshot.elements[id];
          if (data.type === 'checkbox') {
            el.checked = data.value;
          } else {
            el.value = data.value;
          }
        });
      }

      if (snapshot.radios) {
        Object.keys(snapshot.radios).forEach(name => {
          setRadioValue(name, snapshot.radios[name]);
        });
      }

      if (Array.isArray(snapshot.footerCategories)) {
        document.querySelectorAll('#footer-categories-checklist-container .footer-cat-checkbox').forEach(cb => {
          cb.checked = snapshot.footerCategories.includes(cb.value);
        });
        const badge = document.getElementById('footer-categories-count-badge');
        if (badge) badge.textContent = `${snapshot.footerCategories.length} Dipilih`;
      }

      if (Array.isArray(snapshot.currentBanners)) {
        currentBanners = [...snapshot.currentBanners];
        renderBannerThumbnails();
      }

      if (Array.isArray(snapshot.storefrontSections)) {
        storefrontSections = snapshot.storefrontSections.map(s => ({
          ...s,
          locked: isSectionLocked(s)
        }));
        renderSectionBuilderList();
      }

      // Sinkronisasi ikon picker visual
      document.querySelectorAll('.visual-icon-picker').forEach(picker => {
        const selectId = picker.getAttribute('data-select');
        if (selectId) syncVisualIconPicker(selectId);
      });

      // Sinkronisasi input color picker jika ada hex yang berubah
      document.querySelectorAll('input[type="text"][id$="-hex"]').forEach(hexInp => {
        let hexVal = hexInp.value.trim();
        if (hexVal && !hexVal.startsWith('#')) hexVal = '#' + hexVal;
        if (/^#[0-9A-Fa-f]{6}$/.test(hexVal)) {
          const pickerId = hexInp.id.replace('-hex', '-picker').replace('-color-hex', '-color');
          const picker = document.getElementById(pickerId);
          if (picker) picker.value = hexVal;
        }
      });

      // Sinkronisasi visibilitas kondisional
      syncNavbarFormVisibility();
      syncHeroFormVisibility();
      syncHeroBgColor2Visibility();
      syncFooterLogoOptionsVisibility();
      updateFontSamplePreviews();
      syncColorPresetActiveState();

      // Sinkronisasi toggle box spesifik
      const cartBorderToggle = document.getElementById('cart_border_toggle');
      const cartBorderBox = document.getElementById('cart_border_settings_box');
      if (cartBorderToggle && cartBorderBox) {
        cartBorderBox.classList.toggle('hidden', !cartBorderToggle.checked);
      }

      const searchBgSolidToggle = document.getElementById('search_bg_solid_toggle');
      const searchBgBox = document.getElementById('search_bg_color_box');
      if (searchBgSolidToggle && searchBgBox) {
        searchBgBox.classList.toggle('hidden', !searchBgSolidToggle.checked);
      }

      const searchBorderToggle = document.getElementById('search_border_toggle');
      const searchBorderBox = document.getElementById('search_border_settings_box');
      if (searchBorderToggle && searchBorderBox) {
        searchBorderBox.classList.toggle('hidden', !searchBorderToggle.checked);
      }

      const dividerEnabled = document.getElementById('ctrl-divider-enabled');
      const dividerBox = document.getElementById('section-divider-controls-box');
      if (dividerEnabled && dividerBox) {
        dividerBox.classList.toggle('hidden', !dividerEnabled.checked);
      }

      const socBorderEnable = document.getElementById('ctrl-footer-social-border-enable');
      const socBorderBox = document.getElementById('footer-social-border-color-box');
      if (socBorderEnable && socBorderBox) {
        socBorderBox.classList.toggle('hidden', !socBorderEnable.checked);
      }

      // Sinkronisasi label slider
      const cartRadiusSlider = document.getElementById('cart_border_radius_slider');
      const cartRadiusVal = document.getElementById('cart_border_radius_val');
      if (cartRadiusSlider && cartRadiusVal) {
        const val = cartRadiusSlider.value;
        cartRadiusVal.textContent = val === '24' ? '24px (Bulat)' : `${val}px`;
      }

      const cartIconSizeSlider = document.getElementById('cart_icon_size_slider');
      const cartIconSizeVal = document.getElementById('cart_icon_size_val');
      if (cartIconSizeSlider && cartIconSizeVal) {
        cartIconSizeVal.textContent = `${cartIconSizeSlider.value}px`;
      }

      const cartBoxSizeSlider = document.getElementById('cart_box_size_slider');
      const cartBoxSizeVal = document.getElementById('cart_box_size_val');
      if (cartBoxSizeSlider && cartBoxSizeVal) {
        cartBoxSizeVal.textContent = `${cartBoxSizeSlider.value}px`;
      }

      const loginIconSizeSlider = document.getElementById('login_icon_size_slider');
      const loginIconSizeVal = document.getElementById('login_icon_size_val');
      if (loginIconSizeSlider && loginIconSizeVal) {
        loginIconSizeVal.textContent = `${loginIconSizeSlider.value}px`;
      }

      const loginBoxSizeSlider = document.getElementById('login_box_size_slider');
      const loginBoxSizeVal = document.getElementById('login_box_size_val');
      if (loginBoxSizeSlider && loginBoxSizeVal) {
        loginBoxSizeVal.textContent = `${loginBoxSizeSlider.value}px`;
      }

      const searchRadiusSlider = document.getElementById('search_border_radius_slider');
      const searchRadiusVal = document.getElementById('search_border_radius_val');
      if (searchRadiusSlider && searchRadiusVal) {
        searchRadiusVal.textContent = `${searchRadiusSlider.value}px`;
      }

      const dividerThickSlider = document.getElementById('ctrl-divider-thickness-slider');
      const dividerThickVal = document.getElementById('ctrl-divider-thickness-val');
      if (dividerThickSlider && dividerThickVal) {
        dividerThickVal.textContent = `${dividerThickSlider.value}px`;
      }

      const dividerMarginSlider = document.getElementById('ctrl-divider-margin-slider');
      const dividerMarginVal = document.getElementById('ctrl-divider-margin-val');
      if (dividerMarginSlider && dividerMarginVal) {
        dividerMarginVal.textContent = `${dividerMarginSlider.value}px`;
      }

      // Sinkronisasi thumbnail preview gambar
      const storeLogoInput = document.getElementById('store-logo-url-input');
      if (storeLogoInput && storeLogoInput.value) setImageSrc('preview-store-logo-img', storeLogoInput.value);

      const storeFaviconInput = document.getElementById('store-favicon-url-input');
      if (storeFaviconInput && storeFaviconInput.value) setImageSrc('preview-store-favicon-img', storeFaviconInput.value);

      const footerLogoInput = document.getElementById('ctrl-footer-custom-logo-url');
      if (footerLogoInput && footerLogoInput.value) setImageSrc('preview-footer-logo-img', footerLogoInput.value);

      // Sinkronisasi status tombol mata visibilitas
      syncAllVisibilityEyeButtons();

      // Perbarui Live Preview Iframe secara instan
      updateLivePreview();
      setEditorDirty(true);
    } catch (e) {
      console.error('[ThemeEditor] Gagal memulihkan snapshot riwayat:', e);
    } finally {
      isApplyingHistory = false;
      updateUndoRedoUI();
    }
  }

  function undo() {
    if (historyDebounceTimer) {
      clearTimeout(historyDebounceTimer);
      historyDebounceTimer = null;
      pushHistorySnapshot();
    }
    if (historyIndex > 0) {
      historyIndex--;
      const snapshotJson = historyStack[historyIndex];
      if (snapshotJson) {
        try {
          applyEditorSnapshot(JSON.parse(snapshotJson));
        } catch (e) {
          console.error('[ThemeEditor] Error parsing snapshot on undo:', e);
        }
      }
      updateUndoRedoUI();
    }
  }

  function redo() {
    if (historyIndex >= 0 && historyIndex < historyStack.length - 1) {
      historyIndex++;
      const snapshotJson = historyStack[historyIndex];
      if (snapshotJson) {
        try {
          applyEditorSnapshot(JSON.parse(snapshotJson));
        } catch (e) {
          console.error('[ThemeEditor] Error parsing snapshot on redo:', e);
        }
      }
      updateUndoRedoUI();
    }
  }

  function updateUndoRedoUI() {
    const btnUndo = document.getElementById('btn-editor-undo');
    const btnRedo = document.getElementById('btn-editor-redo');

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex >= 0 && historyIndex < historyStack.length - 1;

    if (btnUndo) {
      btnUndo.disabled = !canUndo;
      if (canUndo) {
        btnUndo.className = 'w-7 h-7 rounded-md text-xs font-bold transition flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-white cursor-pointer shadow-2xs select-none active:scale-95';
        btnUndo.removeAttribute('disabled');
      } else {
        btnUndo.className = 'w-7 h-7 rounded-md text-xs font-bold transition flex items-center justify-center text-slate-400 cursor-not-allowed opacity-40 select-none';
        btnUndo.setAttribute('disabled', 'true');
      }
    }

    if (btnRedo) {
      btnRedo.disabled = !canRedo;
      if (canRedo) {
        btnRedo.className = 'w-7 h-7 rounded-md text-xs font-bold transition flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-white cursor-pointer shadow-2xs select-none active:scale-95';
        btnRedo.removeAttribute('disabled');
      } else {
        btnRedo.className = 'w-7 h-7 rounded-md text-xs font-bold transition flex items-center justify-center text-slate-400 cursor-not-allowed opacity-40 select-none';
        btnRedo.setAttribute('disabled', 'true');
      }
    }
  }

  function setupUndoRedo() {
    const btnUndo = document.getElementById('btn-editor-undo');
    const btnRedo = document.getElementById('btn-editor-redo');

    if (btnUndo) {
      btnUndo.addEventListener('click', (e) => {
        e.preventDefault();
        undo();
      });
    }

    if (btnRedo) {
      btnRedo.addEventListener('click', (e) => {
        e.preventDefault();
        redo();
      });
    }

    // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' || e.key === 'Z') {
          if (e.shiftKey) {
            e.preventDefault();
            redo();
          } else {
            e.preventDefault();
            undo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          redo();
        }
      }
    });

    updateUndoRedoUI();
  }

  // ============================================================================
  // 12. TOAST NOTIFICATION HELPER
  // ============================================================================
  function showToast(message, type = 'success') {
    const container = document.getElementById('editor-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all duration-300 transform translate-y-0 opacity-100 pointer-events-auto select-none ${type === 'success'
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
    if (el && val !== undefined && val !== null) {
      el.value = val;
      syncVisualIconPicker(id);
    }
  }

  function escapeHtml(str) {
    if (typeof Utils !== 'undefined' && typeof Utils.escapeHtml === 'function') {
      return Utils.escapeHtml(str);
    }
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

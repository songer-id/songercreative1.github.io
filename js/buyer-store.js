/**
 * Songer Creative - Advanced Buyer Storefront Controller
 * Mega Refactor Stage 4:
 *  - Quick Filter Bar: Semua, Terlaris, Sedang Diskon / Promo, Kategori Utama
 *  - Responsive Grid: Mobile wajib 2 kolom (50:50), Desktop 4-6 kolom
 *  - Interspersed Promo Cards (Only active if products.length > 10, interleaved):
 *      * Variasi 1: Banner Gambar + Realtime Countdown Timer
 *      * Variasi 2: Minimalis Elegan + UP TO [X]% + Dinamis Waktu
 *      * Kartu Iklan Sponsor
 *  - Product Cards Refinement:
 *      * Entire card clicks directly to product.html?id={id}
 *      * Strike-through normal price alongside highlighted promo price
 *      * Smart Add-to-cart button (+) beside price (multi-variant/Meter -> PDP, standard -> instant cart)
 *      * Real DB calculated metrics (sales_count, rating_avg, review_count)
 *  - Cart Drawer with Voucher Code Validation
 */

const BuyerStore = (() => {
  let cart = [];
  try {
    const savedCart = localStorage.getItem('songer_buyer_cart');
    if (savedCart) cart = JSON.parse(savedCart);
  } catch (e) {
    cart = [];
  }

  let activeQuickFilter = 'all'; // 'all' | 'bestseller' | 'discount'
  let activeMainCategoryId = 'all';
  let activeSubCategoryId = 'all';
  let activeSearchQuery = '';
  let appliedVoucher = null;
  let countdownInterval = null;

  function formatIDR(num) {
    if (typeof Utils !== 'undefined' && typeof Utils.formatIDR === 'function') {
      return Utils.formatIDR(num);
    }
    if (isNaN(num) || num === null || num === undefined) return 'Rp0';
    return 'Rp' + Math.round(num).toLocaleString('id-ID');
  }

  function saveCart() {
    try {
      localStorage.setItem('songer_buyer_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }

  // ----------------------------------------------------------------------------
  // UNIVERSAL ICON RENDERER (LUCIDE & BOOTSTRAP ICONS)
  // ----------------------------------------------------------------------------
  function renderNavIconHtml(iconKey, extraClass = '', styleAttr = '') {
    if (!iconKey) return '';
    const trimmed = String(iconKey).trim();
    if (!trimmed) return '';
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

  // ----------------------------------------------------------------------------
  // HELPER: PENENTUAN VISIBILITAS TOMBOL PANAH HERO BANNER (< DAN >)
  // ----------------------------------------------------------------------------
  function shouldShowNavArrows(sliderType, showArrowsToggle) {
    // Jika Geser Manual -> Wajib selalu muncul
    if (sliderType === 'manual' || sliderType === 'manual_swipe') {
      return true;
    }
    // Jika tipe animasi lain -> Bergantung pada toggle switch seller
    return Boolean(showArrowsToggle);
  }

  // ----------------------------------------------------------------------------
  // TOP GREETING BAR: LOGIKA SAPAAN DINAMIS & WAKTU PERANGKAT
  // ----------------------------------------------------------------------------
  function getActiveCustomerName() {
    let custName = '';
    try {
      const activeCust = DB.getActiveCustomer ? DB.getActiveCustomer() : null;
      if (activeCust && activeCust.name) custName = activeCust.name;
    } catch (_) { }

    if (!custName) {
      custName = localStorage.getItem('pos_last_customer_name') || '';
    }
    if (!custName) {
      try {
        const u = JSON.parse(localStorage.getItem('songer_customer_user') || '{}');
        if (u.name) custName = u.name;
      } catch (_) { }
    }
    if (!custName) {
      try {
        const activeSession = JSON.parse(localStorage.getItem('pos_customer_session') || '{}');
        if (activeSession && activeSession.name) custName = activeSession.name;
      } catch (_) { }
    }
    if (!custName) {
      try {
        const tenantId = (DB.getCurrentTenant ? DB.getCurrentTenant().id : 'songer-creative-01');
        const raw = localStorage.getItem(`pos_active_customer_${tenantId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          custName = parsed.name || raw;
        }
      } catch (_) { }
    }
    return (custName || '').trim();
  }

  function getTopGreetingText(settings) {
    const storeName = settings?.store_name || 'Songer Creative';
    const custName = getActiveCustomerName();

    // Jika Belum Ada Data Buyer/Pelanggan: "Selamat datang di [Nama Toko]"
    if (!custName) {
      return `Selamat datang di ${storeName}`;
    }

    // Jika Sudah Ada Data Buyer/Pelanggan: "Selamat [Waktu], [Nama Pelanggan]"
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeInMinutes = hours * 60 + minutes;

    // 04:00 - 10:59 -> "Selamat pagi"
    // 11:00 - 14:59 -> "Selamat siang"
    // 15:00 - 18:29 -> "Selamat sore"
    // 18:30 - 03:59 -> "Selamat malam"
    let greetingTime = 'Selamat malam';
    if (timeInMinutes >= 240 && timeInMinutes <= 659) {
      greetingTime = 'Selamat pagi';
    } else if (timeInMinutes >= 660 && timeInMinutes <= 899) {
      greetingTime = 'Selamat siang';
    } else if (timeInMinutes >= 900 && timeInMinutes <= 1109) {
      greetingTime = 'Selamat sore';
    } else {
      greetingTime = 'Selamat malam';
    }

    return `${greetingTime}, ${custName}`;
  }

  function updateTopGreetingBar(settings) {
    const bar = document.getElementById('top-greeting-bar');
    if (!bar) return;

    // Evaluasi 2 toggle independen dengan backward compatibility
    const showGreeting = settings ? (settings.topbar_show_greeting !== false && settings.enable_customer_greeting !== false && settings.show_topbar_greeting !== false) : true;
    const showCountdown = settings ? (settings.topbar_show_countdown !== false && settings.enable_promo_countdown !== false && settings.show_promo_countdown !== false) : true;

    const greetingContainer = document.getElementById('top-greeting-container') || document.getElementById('top-greeting-text')?.closest('div');
    const countdownContainer = document.getElementById('top-promo-countdown-container');

    if (greetingContainer) {
      if (showGreeting) {
        greetingContainer.classList.remove('hidden');
        greetingContainer.style.display = '';
      } else {
        greetingContainer.classList.add('hidden');
        greetingContainer.style.display = 'none';
      }
    }

    if (countdownContainer) {
      if (showCountdown) {
        countdownContainer.classList.remove('hidden');
        countdownContainer.style.display = '';
      } else {
        countdownContainer.classList.add('hidden');
        countdownContainer.style.display = 'none';
      }
    }

    // Jika kedua toggle nonaktif (false), sembunyikan seluruh kontainer Top Bar
    if (!showGreeting && !showCountdown) {
      bar.classList.add('hidden');
      bar.style.display = 'none';
    } else {
      bar.classList.remove('hidden');
      bar.style.display = '';
    }

    const textEl = document.getElementById('top-greeting-text');
    const greetingText = getTopGreetingText(settings);
    if (textEl && showGreeting) {
      textEl.textContent = greetingText;
    }

    if (settings) {
      const topBarBg = settings.top_bar_bg_color || '#0f172a';
      const topBarText = settings.top_bar_text_color || '#f8fafc';
      bar.style.backgroundColor = topBarBg;
      bar.style.color = topBarText;
    }
  }

  // ----------------------------------------------------------------------------
  // KUSTOMISASI WARNA & IKON ELEMEN NAVBAR SECARA DINAMIS
  // ----------------------------------------------------------------------------
  function applyNavbarElementColors(settings) {
    if (!settings) return;

    // 1. Cart Button Settings
    const cartIconKey = settings.cart_icon || 'lucide:shopping-cart';
    const cartIconColor = settings.cart_icon_color || settings.navbar_cart_icon_color || '#334155';
    const cartBgColor = settings.cart_bg_color || '';
    const cartBadgeBg = settings.cart_badge_color || settings.navbar_cart_badge_bg || '#f43f5e';
    const cartBadgeText = settings.cart_badge_text_color || settings.navbar_cart_badge_text || '#ffffff';
    const cartBorderEnable = settings.cart_border_enable !== false;
    const cartBorderColor = settings.cart_border_color || settings.navbar_cart_border_color || '#e2e8f0';
    const cartBorderRadius = settings.cart_border_radius !== undefined && settings.cart_border_radius !== null ? settings.cart_border_radius : '';
    const cartIconSize = settings.cart_icon_size || '16';
    const cartBoxSize = settings.cart_box_size || '38';

    // 2. Search Bar Settings
    const searchIconKey = settings.search_icon || settings.navbar_search_icon || 'bi-search';
    const searchIconColor = settings.search_icon_color || settings.navbar_search_icon_color || '#94a3b8';
    const searchPlaceholder = settings.search_placeholder || settings.navbar_search_placeholder;
    const searchTextColor = settings.search_text_color || settings.navbar_search_placeholder_color || '#0f172a';
    const searchBgSolid = settings.search_bg_solid !== false;
    const searchInputBg = searchBgSolid ? (settings.search_bg_color || settings.navbar_search_input_bg || '#f1f5f9') : 'transparent';
    const searchBorderEnable = settings.search_border_enable !== false;
    const searchBorderColor = settings.search_border_color || settings.navbar_search_border_color || '#e2e8f0';
    const searchBorderRadius = settings.search_border_radius !== undefined && settings.search_border_radius !== null ? settings.search_border_radius : '';

    // 3. Login Button Settings
    const loginDisplay = settings.login_btn_display || 'icon_text';
    const loginIconKey = settings.login_icon || settings.navbar_login_icon || 'bi-person-fill';
    const loginText = settings.login_btn_text || 'Login';
    const loginIconColor = settings.login_icon_color || settings.navbar_login_icon_color || '#334155';
    const loginTextColor = settings.login_text_color || settings.navbar_login_text_color || '#334155';
    const loginBtnBg = settings.login_btn_color || settings.navbar_login_btn_bg || '';
    const loginIconSize = settings.login_icon_size || '16';
    const loginBoxSize = settings.login_box_size || '38';

    const root = document.documentElement;
    root.style.setProperty('--navbar-cart-icon-color', cartIconColor);
    root.style.setProperty('--navbar-cart-badge-bg', cartBadgeBg);
    root.style.setProperty('--navbar-cart-badge-text', cartBadgeText);
    root.style.setProperty('--navbar-search-icon-color', searchIconColor);
    root.style.setProperty('--navbar-search-input-bg', searchInputBg);
    root.style.setProperty('--navbar-search-border-color', searchBorderColor);
    root.style.setProperty('--navbar-search-placeholder-color', searchTextColor);
    root.style.setProperty('--navbar-login-icon-color', loginIconColor);
    root.style.setProperty('--navbar-login-text-color', loginTextColor);

    // Terapkan ke Tombol Keranjang (Cart Drawer Trigger)
    const btnCart = document.getElementById('btn-open-cart-drawer');
    if (btnCart) {
      if (cartBgColor) btnCart.style.backgroundColor = cartBgColor;
      if (!cartBorderEnable) {
        btnCart.style.borderColor = 'transparent';
      } else if (cartBorderColor) {
        btnCart.style.borderColor = cartBorderColor;
      }
      if (cartBorderRadius !== '') {
        btnCart.style.borderRadius = `${cartBorderRadius}px`;
      }
      if (cartBoxSize) {
        btnCart.style.width = `${cartBoxSize}px`;
        btnCart.style.height = `${cartBoxSize}px`;
        btnCart.style.minWidth = `${cartBoxSize}px`;
        btnCart.style.minHeight = `${cartBoxSize}px`;
        btnCart.style.padding = '0';
      }
      const cartIconEl = btnCart.querySelector('.navbar-cart-icon-el');
      if (cartIconEl) {
        const newCartIcon = renderNavIconHtml(cartIconKey, 'transition navbar-cart-icon-el', `color: ${cartIconColor}; font-size: ${cartIconSize}px; width: ${cartIconSize}px; height: ${cartIconSize}px;`);
        cartIconEl.outerHTML = newCartIcon;
      }
    }

    document.querySelectorAll('.navbar-cart-badge-el, #cart-badge-count, #navbar-cart-count').forEach(el => {
      el.style.backgroundColor = cartBadgeBg;
      el.style.color = cartBadgeText;
    });

    // Terapkan ke Search Bar Desktop, Mobile, & Second Row
    const desktopSearchInput = document.getElementById('navbar-search-input');
    if (desktopSearchInput) {
      if (searchPlaceholder) desktopSearchInput.placeholder = searchPlaceholder;
      desktopSearchInput.style.backgroundColor = searchInputBg;
      desktopSearchInput.style.borderColor = searchBorderEnable ? searchBorderColor : 'transparent';
      desktopSearchInput.style.color = searchTextColor;
      if (searchBorderRadius !== '') {
        desktopSearchInput.style.borderRadius = `${searchBorderRadius}px`;
      }
    }

    const secondRowSearchInput = document.getElementById('navbar-second-search-input');
    if (secondRowSearchInput) {
      if (searchPlaceholder) secondRowSearchInput.placeholder = searchPlaceholder;
      secondRowSearchInput.style.backgroundColor = searchInputBg;
      secondRowSearchInput.style.borderColor = searchBorderEnable ? searchBorderColor : 'transparent';
      secondRowSearchInput.style.color = searchTextColor;
      if (searchBorderRadius !== '') {
        secondRowSearchInput.style.borderRadius = `${searchBorderRadius}px`;
      }
    }

    const mobileSearchInput = document.getElementById('navbar-search-input-mobile');
    if (mobileSearchInput) {
      if (searchPlaceholder) mobileSearchInput.placeholder = searchPlaceholder;
      mobileSearchInput.style.backgroundColor = searchInputBg;
      mobileSearchInput.style.borderColor = searchBorderEnable ? searchBorderColor : 'transparent';
      mobileSearchInput.style.color = searchTextColor;
      if (searchBorderRadius !== '') {
        mobileSearchInput.style.borderRadius = `${searchBorderRadius}px`;
      }
    }

    document.querySelectorAll('.navbar-search-icon-el').forEach(iconEl => {
      const isMobileBtn = iconEl.closest('#btn-mobile-search-toggle');
      const extraClass = isMobileBtn ? 'text-xs navbar-search-icon-el' : 'navbar-search-icon-el text-xs absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none';
      const newIconHtml = renderNavIconHtml(searchIconKey, extraClass, `color: ${searchIconColor};`);
      iconEl.outerHTML = newIconHtml;
    });

    // Terapkan ke Tombol Login
    const btnLogin = document.getElementById('btn-navbar-login');
    if (btnLogin) {
      if (loginBtnBg) btnLogin.style.backgroundColor = loginBtnBg;
      if (loginBoxSize) {
        btnLogin.style.height = `${loginBoxSize}px`;
        btnLogin.style.minHeight = `${loginBoxSize}px`;
        if (loginDisplay === 'icon_only') {
          btnLogin.style.width = `${loginBoxSize}px`;
          btnLogin.style.minWidth = `${loginBoxSize}px`;
          btnLogin.style.padding = '0';
        }
      }
      if (typeof updateNavbarLoginUI === 'function') {
        updateNavbarLoginUI();
      } else {
        const iconStyle = `color: ${loginIconColor}; font-size: ${loginIconSize}px; width: ${loginIconSize}px; height: ${loginIconSize}px;`;
        let loginInnerHtml = '';
        if (loginDisplay === 'icon_only') {
          loginInnerHtml = renderNavIconHtml(loginIconKey, 'navbar-login-icon-el', iconStyle);
        } else if (loginDisplay === 'text_only') {
          loginInnerHtml = `<span class="font-bold navbar-login-text-el" style="color: ${loginTextColor};">${escapeHtml(loginText)}</span>`;
        } else {
          loginInnerHtml = `
            ${renderNavIconHtml(loginIconKey, 'navbar-login-icon-el', iconStyle)}
            <span class="hidden sm:inline font-bold navbar-login-text-el" style="color: ${loginTextColor};">${escapeHtml(loginText)}</span>
          `;
        }
        btnLogin.innerHTML = loginInnerHtml;
      }
    }

    // 4. Notification Bell Icon Settings & Toggle Switch
    const notifContainer = document.getElementById('navbar-notif-container');
    if (notifContainer) {
      if (settings.navbar_show_notification === false) {
        notifContainer.classList.add('hidden');
      } else {
        notifContainer.classList.remove('hidden');
      }
    }
    const notifIconColor = settings.navbar_notif_icon_color || '#334155';
    document.querySelectorAll('.navbar-notif-icon-el').forEach(iconEl => {
      iconEl.style.color = notifIconColor;
    });

    // Inisialisasi ikon Lucide untuk elemen ikon yang baru dirender
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // ----------------------------------------------------------------------------
  // SMART SEARCH AUTOCOMPLETE, ENTER HANDLER, & HIGHLIGHT UTILITIES
  // ----------------------------------------------------------------------------

  function highlightProductCard(prodId) {
    setTimeout(() => {
      const cardEl = document.querySelector(`[data-id="${prodId}"]`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        cardEl.classList.add('ring-4', 'ring-emerald-400', 'border-emerald-500', 'scale-[1.02]', 'transition', 'duration-300');

        let blinkCount = 0;
        const blinkInterval = setInterval(() => {
          blinkCount++;
          cardEl.classList.toggle('ring-emerald-400');
          cardEl.classList.toggle('ring-emerald-200');
          if (blinkCount >= 6) {
            clearInterval(blinkInterval);
            cardEl.classList.remove('ring-4', 'ring-emerald-400', 'ring-emerald-200', 'border-emerald-500', 'scale-[1.02]');
          }
        }, 350);
      }
    }, 150);
  }

  function renderSearchSuggestionsHtml(query, matched) {
    if (matched.length === 0) {
      return `
        <div class="py-4 px-3 text-center text-slate-500 text-xs">
          Tidak ada produk yang cocok dengan "<strong>${escapeHtml(query)}</strong>"
        </div>
      `;
    }

    const headerHtml = `
      <div class="px-2.5 py-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100">
        <span>Saran Produk</span>
        <span class="text-[10px] text-slate-400 font-semibold">${matched.length} produk</span>
      </div>
    `;

    const itemsHtml = matched.map(p => {
      const startingPrice = getProductStartingPrice(p);
      const effDiscount = p.effective_discount || (typeof DB !== 'undefined' && DB.getProductEffectiveDiscount ? DB.getProductEffectiveDiscount(p) : { has_discount: false });
      const finalPrice = effDiscount.has_discount ? effDiscount.discounted_price : startingPrice;
      const img = (Array.isArray(p.images) && p.images[0]) || p.image_url || 'assets/images/logo-songer-creative.png';

      return `
        <div class="navbar-search-item border-b border-slate-100 last:border-b-0 rounded-none py-2.5 px-2 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition group" data-id="${p.id}">
          <img src="${img}" class="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0" alt="${escapeHtml(p.name)}" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 text-slate-400 text-xs\\'><i class=\\'bi bi-image\\'></i></div>';" />
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <h5 class="text-xs font-semibold text-slate-800 group-hover:text-emerald-600 truncate transition leading-tight">${escapeHtml(p.name)}</h5>
              <span class="text-xs font-bold text-slate-900 shrink-0">${formatIDR(finalPrice)}</span>
            </div>
            <div class="text-[11px] text-slate-400 truncate mt-0.5">
              ${escapeHtml(p.category_name || '')}
            </div>
          </div>
        </div>
      `;
    }).join('');

    return headerHtml + itemsHtml;
  }

  function handleSelectSearchProduct(prodId) {
    const desktopInput = document.getElementById('navbar-search-input');
    const secondInput = document.getElementById('navbar-second-search-input');
    const mobileInput = document.getElementById('navbar-search-input-mobile');
    const suggestionsBox = document.getElementById('navbar-search-suggestions');
    const suggestionsSecondBox = document.getElementById('navbar-second-search-suggestions');
    const suggestionsMobileBox = document.getElementById('navbar-search-suggestions-mobile');
    const overlay = document.getElementById('mobile-search-overlay');
    const searchBackdrop = document.getElementById('navbar-search-backdrop');

    if (suggestionsBox) {
      suggestionsBox.classList.add('hidden');
      suggestionsBox.innerHTML = '';
    }
    if (suggestionsSecondBox) {
      suggestionsSecondBox.classList.add('hidden');
      suggestionsSecondBox.innerHTML = '';
    }
    if (suggestionsMobileBox) {
      suggestionsMobileBox.classList.add('hidden');
      suggestionsMobileBox.innerHTML = '';
    }
    if (overlay) overlay.classList.add('hidden');
    if (searchBackdrop) searchBackdrop.classList.add('hidden');

    if (desktopInput) desktopInput.value = '';
    if (secondInput) secondInput.value = '';
    if (mobileInput) mobileInput.value = '';

    // Pastikan produk tampil di katalog: reset filter kategori & pencarian
    activeQuickFilter = 'all';
    activeMainCategoryId = 'all';
    activeSubCategoryId = 'all';
    activeSearchQuery = '';
    renderStorefront();
    bindStoreEvents();

    highlightProductCard(prodId);
  }

  function handleEnterSearchQuery(queryText, inputEl, suggestionsBoxEl) {
    const trimmed = (queryText || '').trim();
    const overlay = document.getElementById('mobile-search-overlay');
    const searchBackdrop = document.getElementById('navbar-search-backdrop');
    const desktopSuggestions = document.getElementById('navbar-search-suggestions');
    const mobileSuggestions = document.getElementById('navbar-search-suggestions-mobile');

    if (!trimmed) {
      activeSearchQuery = '';
      if (suggestionsBoxEl) {
        suggestionsBoxEl.classList.add('hidden');
        suggestionsBoxEl.innerHTML = '';
      }
      if (overlay) overlay.classList.add('hidden');
      if (searchBackdrop) searchBackdrop.classList.add('hidden');
      renderStorefront();
      bindStoreEvents();
      return;
    }

    const allActive = (typeof DB !== 'undefined' && DB.getProducts)
      ? DB.getProducts({ status: 'active' }).filter(p => p.is_active !== false)
      : [];
    const qLower = trimmed.toLowerCase();
    const matched = allActive.filter(p =>
      (p.name && p.name.toLowerCase().includes(qLower)) ||
      (p.description && p.description.toLowerCase().includes(qLower)) ||
      (p.category_name && p.category_name.toLowerCase().includes(qLower))
    );

    if (matched.length === 0) {
      // JIKA TIDAK ADA PRODUK COCOK:
      // JANGAN mengubah activeSearchQuery, JANGAN menampilkan chip Hasil Pencarian, JANGAN mengosongkan grid katalog!
      if (suggestionsBoxEl) {
        suggestionsBoxEl.innerHTML = renderSearchSuggestionsHtml(trimmed, []);
        suggestionsBoxEl.classList.remove('hidden');
      }
      if (searchBackdrop && !overlay) {
        searchBackdrop.classList.remove('hidden');
      }
      return;
    }

    // Jika ada 1 atau beberapa produk yang cocok saat Enter
    const secondSuggestions = document.getElementById('navbar-second-search-suggestions');
    if (desktopSuggestions) desktopSuggestions.classList.add('hidden');
    if (secondSuggestions) secondSuggestions.classList.add('hidden');
    if (mobileSuggestions) mobileSuggestions.classList.add('hidden');
    if (overlay) overlay.classList.add('hidden');
    if (searchBackdrop) searchBackdrop.classList.add('hidden');

    const targetProdId = matched[0].id;

    // Reset filter kategori agar produk tampil di katalog
    activeQuickFilter = 'all';
    activeMainCategoryId = 'all';
    activeSubCategoryId = 'all';
    activeSearchQuery = trimmed;
    renderStorefront();
    bindStoreEvents();

    highlightProductCard(targetProdId);
  }

  function handleSearchAutocompleteInput(inputEl, suggestionsBoxEl) {
    if (!inputEl || !suggestionsBoxEl) return;
    const q = inputEl.value.trim();
    if (!q) {
      suggestionsBoxEl.classList.add('hidden');
      suggestionsBoxEl.innerHTML = '';
      return;
    }

    const allActive = (typeof DB !== 'undefined' && DB.getProducts)
      ? DB.getProducts({ status: 'active' }).filter(p => p.is_active !== false)
      : [];
    const qLower = q.toLowerCase();
    const matched = allActive.filter(p =>
      (p.name && p.name.toLowerCase().includes(qLower)) ||
      (p.description && p.description.toLowerCase().includes(qLower)) ||
      (p.category_name && p.category_name.toLowerCase().includes(qLower))
    ).slice(0, 6);

    suggestionsBoxEl.innerHTML = renderSearchSuggestionsHtml(q, matched);
    suggestionsBoxEl.classList.remove('hidden');

    suggestionsBoxEl.querySelectorAll('.navbar-search-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const prodId = item.getAttribute('data-id');
        handleSelectSearchProduct(prodId);
      });
    });
  }

  // ----------------------------------------------------------------------------
  // RESPONSIVE SEARCH MOBILE & LOGIN BUTTON
  // ----------------------------------------------------------------------------
  function initMobileSearchOverlay() {
    const btnToggle = document.getElementById('btn-mobile-search-toggle');
    const overlay = document.getElementById('mobile-search-overlay');
    const btnClose = document.getElementById('btn-close-mobile-search');
    const mobileInput = document.getElementById('navbar-search-input-mobile');
    const desktopInput = document.getElementById('navbar-search-input');
    const secondInput = document.getElementById('navbar-second-search-input');
    const mobileSuggestions = document.getElementById('navbar-search-suggestions-mobile');

    if (btnToggle && overlay) {
      btnToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        overlay.classList.toggle('hidden');
        if (!overlay.classList.contains('hidden') && mobileInput) {
          mobileInput.focus();
          const activeVal = (desktopInput && desktopInput.value) || (secondInput && secondInput.value) || '';
          if (activeVal) {
            mobileInput.value = activeVal;
            handleSearchAutocompleteInput(mobileInput, mobileSuggestions);
          }
        }
      });
    }

    if (btnClose && overlay) {
      btnClose.addEventListener('click', () => {
        overlay.classList.add('hidden');
        if (mobileSuggestions) {
          mobileSuggestions.classList.add('hidden');
          mobileSuggestions.innerHTML = '';
        }
      });
    }

    if (mobileInput) {
      mobileInput.addEventListener('input', () => {
        if (desktopInput) desktopInput.value = mobileInput.value;
        if (secondInput) secondInput.value = mobileInput.value;
        if (mobileSuggestions) {
          handleSearchAutocompleteInput(mobileInput, mobileSuggestions);
        }
      });

      mobileInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (overlay) overlay.classList.add('hidden');
          if (mobileSuggestions) mobileSuggestions.classList.add('hidden');
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleEnterSearchQuery(mobileInput.value, mobileInput, mobileSuggestions);
        }
      });
    }
  }

  // ----------------------------------------------------------------------------
  // DYNAMIC TECHNICAL SEO & SCHEMA.ORG JSON-LD ARCHITECTURE
  // ----------------------------------------------------------------------------

  /**
   * 1. STRICT CANONICAL URL SANITIZER
   * Membersihkan transient query strings (?utm_*, ?fbclid, ?search, ?sort, #hash)
   * Mengembalikan URL kanonikal deterministik untuk Storefront atau Product Deep Link.
   */
  function getSanitizedCanonicalUrl(extraParams = {}) {
    try {
      const origin = window.location.origin || '';
      const pathname = window.location.pathname || '';
      const cleanBase = `${origin}${pathname}`.replace(/\/+$/, '') || '/';

      const currentParams = new URLSearchParams(window.location.search || '');
      const canonicalParams = new URLSearchParams();

      // Pertahankan routing multi-tenant yang sah (?store=slug atau ?tenant=id)
      const validRoutingKeys = ['store', 'tenant', 'tenant_id'];
      validRoutingKeys.forEach(k => {
        if (currentParams.has(k)) {
          canonicalParams.set(k, currentParams.get(k));
        }
      });

      // Tambahkan parameter kanonikal deterministik yang sah (misal ?p=slug atau ?category=slug)
      if (extraParams && typeof extraParams === 'object') {
        Object.keys(extraParams).forEach(k => {
          const val = extraParams[k];
          if (val !== undefined && val !== null && val !== '') {
            canonicalParams.set(k, String(val));
          }
        });
      }

      const queryString = canonicalParams.toString();
      return queryString ? `${cleanBase}?${queryString}` : cleanBase;
    } catch (e) {
      return (window.location.origin || '') + (window.location.pathname || '');
    }
  }

  /**
   * 2. INFERENSI TIPE ENTITAS SCHEMA.ORG DINAMIS
   * Memetakan @type ke ontologi Schema.org yang valid (F&B, Fashion, Elektronik, Jasa/Cetak, atau Ritel)
   * berbasis konfigurasi admin atau agregasi semantik katalog produk.
   */
  function inferBusinessSchemaType(settings, products = []) {
    // A. Prioritas 1: Setting eksplisit merchant jika tersedia
    const explicitType = (settings?.business_vertical || settings?.store_type || '').toLowerCase();
    if (explicitType === 'fnb' || explicitType === 'culinary' || explicitType === 'food' || explicitType === 'resto') {
      return ['Store', 'FoodEstablishment'];
    }
    if (explicitType === 'fashion' || explicitType === 'clothing' || explicitType === 'apparel') {
      return ['Store', 'ClothingStore'];
    }
    if (explicitType === 'electronics' || explicitType === 'gadget' || explicitType === 'it') {
      return ['Store', 'ElectronicsStore'];
    }
    if (explicitType === 'printing' || explicitType === 'percetakan' || explicitType === 'service') {
      return ['ProfessionalService', 'LocalBusiness'];
    }

    // B. Prioritas 2: Analisis Semantik Frekuensi Kata Kunci pada Kategori & Katalog
    const categoryCounts = { fnb: 0, fashion: 0, electronics: 0, printing: 0 };

    const fnbKeywords = ['makanan', 'kuliner', 'minuman', 'food', 'drink', 'resto', 'restaurant', 'cafe', 'kafe', 'snack', 'kue', 'bakery', 'roti', 'kopi', 'coffee', 'bento', 'catering'];
    const fashionKeywords = ['fashion', 'baju', 'pakaian', 'kaos', 't-shirt', 'distro', 'hijab', 'dress', 'sepatu', 'shoes', 'tas', 'bag', 'jaket', 'jacket', 'celana', 'outfit', 'butik', 'boutique'];
    const electronicsKeywords = ['elektronik', 'electronic', 'komputer', 'computer', 'laptop', 'gadget', 'handphone', 'smartphone', 'cctv', 'audio', 'kabel', 'hardware'];
    const printingKeywords = ['cetak', 'percetakan', 'printing', 'print', 'banner', 'spanduk', 'brosur', 'nota', 'stiker', 'sticker', 'desain', 'grafis', 'sablon', 'offset'];

    const testText = (str) => {
      if (!str || typeof str !== 'string') return;
      const lower = str.toLowerCase();
      fnbKeywords.forEach(k => { if (lower.includes(k)) categoryCounts.fnb++; });
      fashionKeywords.forEach(k => { if (lower.includes(k)) categoryCounts.fashion++; });
      electronicsKeywords.forEach(k => { if (lower.includes(k)) categoryCounts.electronics++; });
      printingKeywords.forEach(k => { if (lower.includes(k)) categoryCounts.printing++; });
    };

    testText(settings?.store_name);
    testText(settings?.store_tagline);
    testText(settings?.store_description);

    const categories = (typeof DB !== 'undefined' && DB.getCategories) ? DB.getCategories() : [];
    categories.forEach(c => {
      testText(c.name);
      testText(c.description);
    });

    products.slice(0, 25).forEach(p => {
      testText(p.name);
      testText(p.category_name);
      testText(p.description);
    });

    let maxCount = 0;
    let selectedType = ['Store', 'LocalBusiness']; // Fallback default universal

    if (categoryCounts.fnb > maxCount) {
      maxCount = categoryCounts.fnb;
      selectedType = ['Store', 'FoodEstablishment'];
    }
    if (categoryCounts.fashion > maxCount) {
      maxCount = categoryCounts.fashion;
      selectedType = ['Store', 'ClothingStore'];
    }
    if (categoryCounts.electronics > maxCount) {
      maxCount = categoryCounts.electronics;
      selectedType = ['Store', 'ElectronicsStore'];
    }
    if (categoryCounts.printing > maxCount) {
      maxCount = categoryCounts.printing;
      selectedType = ['ProfessionalService', 'LocalBusiness'];
    }

    return selectedType;
  }

  /**
   * 3. INJEKSI SKEMA BREADCRUMBLIST DINAMIS
   * Membangun hierarki taksonomi Schema.org: Beranda > Kategori > Produk (jika aktif)
   */
  function buildBreadcrumbListSchema(baseUrl, activeCategory = null, activeProduct = null) {
    const items = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Beranda',
        item: baseUrl
      }
    ];

    if (activeCategory && activeCategory.id !== 'all') {
      const catUrl = getSanitizedCanonicalUrl({ category: activeCategory.slug || activeCategory.id });
      items.push({
        '@type': 'ListItem',
        position: 2,
        name: activeCategory.name || 'Kategori',
        item: catUrl
      });
    }

    if (activeProduct) {
      const prodUrl = getSanitizedCanonicalUrl({ p: activeProduct.slug || activeProduct.id });
      items.push({
        '@type': 'ListItem',
        position: items.length + 1,
        name: activeProduct.name || 'Detail Produk',
        item: prodUrl
      });
    }

    return {
      '@type': 'BreadcrumbList',
      '@id': `${baseUrl}#breadcrumbs`,
      itemListElement: items
    };
  }

  /**
   * KOMPILASI SCHEMA.ORG JSON-LD GRAPH
   * Menyatukan WebSite, Store/LocalBusiness, BreadcrumbList, ItemList, dan Product tunggal (jika aktif)
   */
  function renderStoreSchemaGraph(activeProduct = null) {
    const schemaScript = document.getElementById('saas-store-schema-jsonld');
    if (!schemaScript) return;

    try {
      const settings = (typeof DB !== 'undefined' && DB.getSettings) ? (DB.getSettings() || {}) : {};
      const storeName = settings?.store_name || 'Toko Resmi';
      const storeTagline = settings?.store_tagline || 'Katalog & Layanan Terpadu';
      const storeDesc = settings?.store_description || `Katalog resmi ${storeName} dengan pilihan produk berkualitas dan transaksi aman terpercaya.`;

      const origin = window.location.origin || '';
      let rawLogo = settings?.web_logo || 'assets/images/logo-songer-creative.png';
      const logoUrl = rawLogo.startsWith('http') ? rawLogo : `${origin}/${rawLogo.replace(/^\/+/, '')}`;
      const canonicalStoreUrl = getSanitizedCanonicalUrl();
      const products = (typeof DB !== 'undefined' && DB.getProducts) ? DB.getProducts({ status: 'active' }).filter(p => p.is_active !== false) : [];

      // 1. WebSite Schema dengan SearchAction
      const websiteSchema = {
        '@type': 'WebSite',
        '@id': `${canonicalStoreUrl}#website`,
        url: canonicalStoreUrl,
        name: storeName,
        description: storeTagline,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${canonicalStoreUrl}?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      };

      // 2. Entitas Toko / Merchant Dinamis (Inferensi Subtipe)
      const inferredTypes = inferBusinessSchemaType(settings, products);
      const storeEntitySchema = {
        '@type': inferredTypes,
        '@id': `${canonicalStoreUrl}#store`,
        name: storeName,
        description: storeDesc,
        telephone: settings?.whatsapp_number || settings?.store_phone || '+6281234567890',
        email: settings?.store_email || 'kontak@tokoresmi.com',
        address: {
          '@type': 'PostalAddress',
          streetAddress: settings?.store_address || 'Jl. Niaga Raya No. 88',
          addressCountry: 'ID'
        },
        image: logoUrl,
        url: canonicalStoreUrl,
        priceRange: 'Rp 5.000 - Rp 10.000.000'
      };

      // 3. BreadcrumbList Schema Dinamis
      let activeCatObj = null;
      if (activeMainCategoryId && activeMainCategoryId !== 'all') {
        const categories = (typeof DB !== 'undefined' && DB.getCategories) ? DB.getCategories() : [];
        activeCatObj = categories.find(c => String(c.id) === String(activeMainCategoryId));
      }
      const breadcrumbSchema = buildBreadcrumbListSchema(canonicalStoreUrl, activeCatObj, activeProduct);

      // 4. ItemList Katalog Produk Unggulan (Top 10)
      const topProducts = products.slice(0, 10).map((p, idx) => {
        const minPrice = getProductStartingPrice(p);
        const eff = p.effective_discount || (typeof DB !== 'undefined' && DB.getProductEffectiveDiscount ? DB.getProductEffectiveDiscount(p) : { has_discount: false });
        const finalPrice = eff.has_discount ? eff.discounted_price : minPrice;
        let rawPImg = (Array.isArray(p.images) && p.images[0]) || p.image_url || logoUrl;
        const pImgUrl = rawPImg.startsWith('http') ? rawPImg : `${origin}/${rawPImg.replace(/^\/+/, '')}`;

        return {
          '@type': 'Product',
          position: idx + 1,
          name: p.name || 'Produk Unggulan',
          description: p.description || p.name,
          image: pImgUrl,
          offers: {
            '@type': 'Offer',
            priceCurrency: 'IDR',
            price: Number(finalPrice) || 0,
            availability: (p.stock === undefined || p.stock === null || p.stock > 0 || p.is_unlimited_stock)
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock'
          }
        };
      });

      const itemListSchema = {
        '@type': 'ItemList',
        name: `Katalog Unggulan ${storeName}`,
        itemListElement: topProducts
      };

      const graph = [websiteSchema, storeEntitySchema, breadcrumbSchema, itemListSchema];

      // 5. Entitas Mandiri @type: Product (jika sedang membuka produk spesifik / deep link)
      if (activeProduct) {
        const minPrice = getProductStartingPrice(activeProduct);
        const eff = activeProduct.effective_discount || (typeof DB !== 'undefined' && DB.getProductEffectiveDiscount ? DB.getProductEffectiveDiscount(activeProduct) : { has_discount: false });
        const finalPrice = eff.has_discount ? eff.discounted_price : minPrice;
        let rawActiveImg = (Array.isArray(activeProduct.images) && activeProduct.images[0]) || activeProduct.image_url || logoUrl;
        const activeImgUrl = rawActiveImg.startsWith('http') ? rawActiveImg : `${origin}/${rawActiveImg.replace(/^\/+/, '')}`;
        const pUrl = getSanitizedCanonicalUrl({ p: activeProduct.slug || activeProduct.id });

        const standaloneProductSchema = {
          '@type': 'Product',
          '@id': `${pUrl}#product`,
          name: activeProduct.name,
          description: activeProduct.description || activeProduct.name,
          image: [activeImgUrl],
          sku: activeProduct.sku || activeProduct.id,
          offers: {
            '@type': 'Offer',
            url: pUrl,
            priceCurrency: 'IDR',
            price: Number(finalPrice) || 0,
            priceValidUntil: '2027-12-31',
            availability: (activeProduct.stock === undefined || activeProduct.stock === null || activeProduct.stock > 0 || activeProduct.is_unlimited_stock)
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            seller: {
              '@type': 'Organization',
              name: storeName
            }
          },
          brand: {
            '@type': 'Brand',
            name: storeName
          }
        };

        graph.push(standaloneProductSchema);
      }

      schemaScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': graph
      }, null, 2);
    } catch (err) {
      console.warn('Gagal menyusun Schema.org JSON-LD:', err);
    }
  }

  /**
   * 4. MODULASI META TAG GRANULAR PADA LEVEL PRODUK (DEEP LINKING & SOCIAL SHARE)
   */
  let storefrontDefaultMetadata = null;

  function setProductMetaSEO(product) {
    if (!product) return;
    try {
      const settings = (typeof DB !== 'undefined' && DB.getSettings) ? (DB.getSettings() || {}) : {};
      const storeName = settings?.store_name || 'Songer Creative';
      const prodTitle = `${product.name} | ${storeName}`;
      const rawDesc = product.description || `Dapatkan ${product.name} harga terbaik dengan jaminan kualitas resmi di ${storeName}.`;
      const prodDesc = rawDesc.replace(/\s+/g, ' ').trim().slice(0, 160);

      const origin = window.location.origin || '';
      let rawImg = (Array.isArray(product.images) && product.images[0]) || product.image_url || settings?.web_logo || 'assets/images/logo-songer-creative.png';
      const prodImg = rawImg.startsWith('http') ? rawImg : `${origin}/${rawImg.replace(/^\/+/, '')}`;
      const prodUrl = getSanitizedCanonicalUrl({ p: product.slug || product.id });

      // Simpan backup state storefront awal jika belum tersimpan
      if (!storefrontDefaultMetadata) {
        storefrontDefaultMetadata = {
          title: document.title,
          description: document.getElementById('meta-description')?.getAttribute('content') || '',
          canonical: document.getElementById('canonical-url')?.getAttribute('href') || '',
          ogTitle: document.getElementById('og-title')?.getAttribute('content') || '',
          ogDesc: document.getElementById('og-description')?.getAttribute('content') || '',
          ogImage: document.getElementById('og-image')?.getAttribute('content') || '',
          ogUrl: document.getElementById('og-url')?.getAttribute('href') || '',
          twTitle: document.getElementById('twitter-title')?.getAttribute('content') || '',
          twDesc: document.getElementById('twitter-description')?.getAttribute('content') || '',
          twImage: document.getElementById('twitter-image')?.getAttribute('content') || ''
        };
      }

      // Mutasi Title & Deskripsi Meta
      document.title = prodTitle;
      const pageTitleEl = document.getElementById('page-title');
      if (pageTitleEl) pageTitleEl.textContent = prodTitle;

      const metaDesc = document.getElementById('meta-description');
      if (metaDesc) metaDesc.setAttribute('content', prodDesc);

      const canonicalEl = document.getElementById('canonical-url');
      if (canonicalEl) canonicalEl.setAttribute('href', prodUrl);

      // Mutasi Open Graph
      const ogTitle = document.getElementById('og-title');
      if (ogTitle) ogTitle.setAttribute('content', prodTitle);
      const ogDesc = document.getElementById('og-description');
      if (ogDesc) ogDesc.setAttribute('content', prodDesc);
      const ogImage = document.getElementById('og-image');
      if (ogImage) ogImage.setAttribute('content', prodImg);
      const ogUrl = document.getElementById('og-url');
      if (ogUrl) ogUrl.setAttribute('href', prodUrl);

      // Mutasi Twitter Card
      const twTitle = document.getElementById('twitter-title');
      if (twTitle) twTitle.setAttribute('content', prodTitle);
      const twDesc = document.getElementById('twitter-description');
      if (twDesc) twDesc.setAttribute('content', prodDesc);
      const twImage = document.getElementById('twitter-image');
      if (twImage) twImage.setAttribute('content', prodImg);

      // Mutasi Skema JSON-LD dengan Entitas Product
      renderStoreSchemaGraph(product);
    } catch (e) {
      console.warn('Gagal memutasi metadata SEO produk:', e);
    }
  }

  function restoreStorefrontSEO() {
    try {
      const settings = (typeof DB !== 'undefined' && DB.getSettings) ? (DB.getSettings() || {}) : {};
      const storeName = settings?.store_name || 'Songer Creative';
      const storeTagline = settings?.store_tagline || 'Katalog & Layanan Terpadu';
      const fullTitle = `${storeName} — ${storeTagline}`;
      const storeDesc = settings?.store_description || `Katalog resmi ${storeName} dengan pilihan produk berkualitas dan transaksi aman terpercaya.`;

      const origin = window.location.origin || '';
      let rawLogo = settings?.web_logo || 'assets/images/logo-songer-creative.png';
      const logoUrl = rawLogo.startsWith('http') ? rawLogo : `${origin}/${rawLogo.replace(/^\/+/, '')}`;
      const canonicalStoreUrl = getSanitizedCanonicalUrl();

      document.title = fullTitle;
      const pageTitleEl = document.getElementById('page-title');
      if (pageTitleEl) pageTitleEl.textContent = fullTitle;

      const metaDesc = document.getElementById('meta-description');
      if (metaDesc) metaDesc.setAttribute('content', storeDesc);

      const canonicalEl = document.getElementById('canonical-url');
      if (canonicalEl) canonicalEl.setAttribute('href', canonicalStoreUrl);

      // Open Graph Tags
      const ogTitle = document.getElementById('og-title');
      if (ogTitle) ogTitle.setAttribute('content', fullTitle);
      const ogDesc = document.getElementById('og-description');
      if (ogDesc) ogDesc.setAttribute('content', storeDesc);
      const ogImage = document.getElementById('og-image');
      if (ogImage) ogImage.setAttribute('content', logoUrl);
      const ogUrl = document.getElementById('og-url');
      if (ogUrl) ogUrl.setAttribute('href', canonicalStoreUrl);

      // Twitter Cards
      const twTitle = document.getElementById('twitter-title');
      if (twTitle) twTitle.setAttribute('content', fullTitle);
      const twDesc = document.getElementById('twitter-description');
      if (twDesc) twDesc.setAttribute('content', storeDesc);
      const twImage = document.getElementById('twitter-image');
      if (twImage) twImage.setAttribute('content', logoUrl);

      // Kembalikan Schema.org JSON-LD ke level toko
      renderStoreSchemaGraph(null);
    } catch (e) {
      console.warn('Gagal merestorasi SEO toko:', e);
    }
  }

  /**
   * KONTROLER MODAL DETAIL / QUICK VIEW PRODUK
   */
  function openProductDetailModal(productOrId) {
    const modal = document.getElementById('modal-product-detail');
    if (!modal) return;

    let prod = null;
    if (typeof productOrId === 'object' && productOrId) {
      prod = productOrId;
    } else if (typeof DB !== 'undefined' && DB.getProductById) {
      prod = DB.getProductById(productOrId);
    }
    if (!prod) return;

    const titleEl = document.getElementById('pdp-modal-title');
    const catEl = document.getElementById('pdp-modal-cat-badge');
    const descEl = document.getElementById('pdp-modal-desc');
    const priceEl = document.getElementById('pdp-modal-price');
    const strikeEl = document.getElementById('pdp-modal-strike-price');
    const imgEl = document.getElementById('pdp-modal-img');
    const discTagEl = document.getElementById('pdp-modal-discount-tag');
    const fullPdpBtn = document.getElementById('btn-pdp-modal-full-pdp');
    const addCartBtn = document.getElementById('btn-pdp-modal-add-cart');

    const minPrice = getProductStartingPrice(prod);
    const eff = prod.effective_discount || (typeof DB !== 'undefined' && DB.getProductEffectiveDiscount ? DB.getProductEffectiveDiscount(prod) : { has_discount: false });
    const finalPrice = eff.has_discount ? eff.discounted_price : minPrice;
    const img = (Array.isArray(prod.images) && prod.images[0]) || prod.image_url || 'assets/images/logo-songer-creative.png';

    if (titleEl) titleEl.textContent = prod.name;
    if (catEl) catEl.textContent = prod.category_name || 'Katalog';
    if (descEl) descEl.textContent = prod.description || 'Tidak ada deskripsi rinci.';
    if (priceEl) priceEl.textContent = formatIDR(finalPrice);

    if (strikeEl) {
      if (eff.has_discount && eff.original_price > finalPrice) {
        strikeEl.textContent = formatIDR(eff.original_price);
        strikeEl.classList.remove('hidden');
      } else {
        strikeEl.classList.add('hidden');
      }
    }

    if (discTagEl) {
      if (eff.has_discount && eff.percent > 0) {
        discTagEl.textContent = `-${eff.percent}%`;
        discTagEl.classList.remove('hidden');
      } else {
        discTagEl.classList.add('hidden');
      }
    }

    if (imgEl) {
      imgEl.src = img;
      imgEl.alt = prod.name;
    }

    if (fullPdpBtn) {
      fullPdpBtn.href = `product.html?id=${prod.id}`;
    }

    if (addCartBtn) {
      addCartBtn.onclick = (e) => {
        e.preventDefault();
        handleSmartAddToCart(prod.id);
        closeProductDetailModal();
      };
    }

    // Mutasi SEO ke produk
    setProductMetaSEO(prod);

    // Tampilkan modal
    modal.classList.remove('hidden');
    if (window.lucide && typeof lucide.createIcons === 'function') {
      lucide.createIcons();
    }
  }

  function closeProductDetailModal() {
    const modal = document.getElementById('modal-product-detail');
    if (!modal || modal.classList.contains('hidden')) return;
    modal.classList.add('hidden');

    // Kembalikan SEO ke level storefront
    restoreStorefrontSEO();
  }

  function initProductDetailModalEvents() {
    const modal = document.getElementById('modal-product-detail');
    const btnClose = document.getElementById('btn-close-product-modal');
    if (btnClose && !btnClose._hasEventListener) {
      btnClose._hasEventListener = true;
      btnClose.addEventListener('click', closeProductDetailModal);
    }
    if (modal && !modal._hasEventListener) {
      modal._hasEventListener = true;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeProductDetailModal();
      });
    }
    if (!document._hasPdpModalEscapeListener) {
      document._hasPdpModalEscapeListener = true;
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
          closeProductDetailModal();
        }
      });
    }
  }

  function initStorefrontSEO() {
    restoreStorefrontSEO();
    initProductDetailModalEvents();

    // Deteksi Deep-Link produk pada URL saat initial page load (?p=slug atau ?id=...)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const targetParam = urlParams.get('p') || urlParams.get('id');
      if (targetParam && typeof DB !== 'undefined') {
        const products = DB.getProducts ? DB.getProducts({ status: 'active' }) : [];
        const matched = products.find(p => String(p.id) === String(targetParam) || (p.slug && p.slug === targetParam));
        if (matched) {
          setTimeout(() => {
            openProductDetailModal(matched);
          }, 350);
        }
      }
    } catch (e) {}
  }

  // ----------------------------------------------------------------------------
  // NAVBAR CUSTOMER AUTHENTICATION & PROFILE MODAL
  // ----------------------------------------------------------------------------
  function updateNavbarLoginUI() {
    const btnLogin = document.getElementById('btn-navbar-login');
    if (!btnLogin) return;

    const customer = (typeof DB !== 'undefined' && DB.getActiveCustomer) ? DB.getActiveCustomer() : null;
    const settings = (typeof DB !== 'undefined' && DB.getSettings) ? DB.getSettings() : {};
    const loginTextColor = settings.login_text_color || settings.navbar_login_text_color || '#334155';
    const loginIconColor = settings.login_icon_color || settings.navbar_login_icon_color || '#334155';

    if (customer && customer.name) {
      // Poin 8: Saat SUDAH login -> SEMBUNYIKAN teks nama, tampilkan HANYA foto/avatar bulat pelanggan
      const boxSize = settings.login_box_size || '38';
      const avatarUrl = customer.avatar_url || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(customer.name) + '&background=059669&color=fff');
      const avatarHtml = `<img src="${avatarUrl}" alt="${escapeHtml(customer.name)}" class="w-full h-full object-cover rounded-full" onerror="this.onerror=null; this.outerHTML='<i class=\\'bi bi-person-circle text-lg text-emerald-600\\'></i>';" />`;

      btnLogin.innerHTML = avatarHtml;
      btnLogin.className = 'w-[38px] h-[38px] rounded-full overflow-hidden border-2 border-emerald-500 bg-white shadow-xs hover:ring-2 hover:ring-emerald-200 transition flex items-center justify-center p-0 shrink-0 cursor-pointer';
      btnLogin.style.width = `${boxSize}px`;
      btnLogin.style.height = `${boxSize}px`;
      btnLogin.style.minWidth = `${boxSize}px`;
      btnLogin.style.minHeight = `${boxSize}px`;
      btnLogin.style.padding = '0';
      btnLogin.title = `Profil: ${customer.name} (Klik untuk detail)`;
    } else {
      // Pelanggan BELUM login: tampilkan sesuai konfigurasi tema
      btnLogin.style.width = '';
      btnLogin.style.height = '';
      btnLogin.style.minWidth = '';
      btnLogin.style.minHeight = '';
      btnLogin.style.padding = '';
      btnLogin.className = 'inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition shrink-0 cursor-pointer';

      const loginDisplay = settings.login_btn_display || 'icon_text';
      const loginIconKey = settings.login_icon || settings.navbar_login_icon || 'bi-person-fill';
      const loginText = settings.login_btn_text || 'Login';
      const loginIconSize = settings.login_icon_size || '16';
      const loginBoxSize = settings.login_box_size || '38';
      const iconStyle = `color: ${loginIconColor}; font-size: ${loginIconSize}px; width: ${loginIconSize}px; height: ${loginIconSize}px;`;

      if (loginBoxSize) {
        btnLogin.style.height = `${loginBoxSize}px`;
        btnLogin.style.minHeight = `${loginBoxSize}px`;
        if (loginDisplay === 'icon_only') {
          btnLogin.style.width = `${loginBoxSize}px`;
          btnLogin.style.minWidth = `${loginBoxSize}px`;
          btnLogin.style.padding = '0';
        }
      }

      if (loginDisplay === 'icon_only') {
        btnLogin.innerHTML = renderNavIconHtml(loginIconKey, 'navbar-login-icon-el', iconStyle);
      } else if (loginDisplay === 'text_only') {
        btnLogin.innerHTML = `<span class="font-bold navbar-login-text-el" style="color: ${loginTextColor};">${escapeHtml(loginText)}</span>`;
      } else {
        btnLogin.innerHTML = `
          ${renderNavIconHtml(loginIconKey, 'navbar-login-icon-el', iconStyle)}
          <span class="hidden sm:inline font-bold navbar-login-text-el" style="color: ${loginTextColor};">${escapeHtml(loginText)}</span>
        `;
      }
      btnLogin.title = 'Masuk Akun';
    }
  }

  function prefillCustomerIntoCart(customer) {
    if (!customer) return;
    const nameEl = document.getElementById('cart-cust-name');
    const phoneEl = document.getElementById('cart-cust-phone');
    const emailEl = document.getElementById('cart-cust-email');
    const addrEl = document.getElementById('cart-cust-address');

    if (nameEl && customer.name && !nameEl.value) nameEl.value = customer.name;
    if (phoneEl && customer.phone && !phoneEl.value) phoneEl.value = customer.phone;
    if (emailEl && customer.email && !emailEl.value) emailEl.value = customer.email;
    if (addrEl && customer.address && !addrEl.value) addrEl.value = customer.address;
  }

  function initNavbarLogin() {
    const btnLogin = document.getElementById('btn-navbar-login');
    const modal = document.getElementById('modal-auth-customer');
    const btnClose = document.getElementById('btn-close-auth-modal');
    const form = document.getElementById('form-customer-auth');
    const btnGoogle = document.getElementById('btn-auth-google');
    const btnLogout = document.getElementById('btn-logout-customer');
    const btnEditProfile = document.getElementById('btn-edit-customer-profile');
    const loggedInBox = document.getElementById('auth-logged-in-box');
    const authUserName = document.getElementById('auth-user-name');
    const authUserPhoneText = document.getElementById('auth-user-phone-text');
    const authUserEmailText = document.getElementById('auth-user-email-text');
    const authUserAddressText = document.getElementById('auth-user-address-text');
    const authUserAvatar = document.getElementById('auth-user-avatar');
    const pointsCard = document.getElementById('auth-user-points-card');
    const pointsValEl = document.getElementById('auth-user-points-val');

    function syncModalState(forceEditMode = false) {
      const customer = (typeof DB !== 'undefined' && DB.getActiveCustomer) ? DB.getActiveCustomer() : null;

      if (customer && customer.name && !forceEditMode) {
        // Tampilkan Detail User yang diperkaya (Logged In View)
        if (form) form.classList.add('hidden');
        if (btnGoogle && btnGoogle.parentElement) btnGoogle.parentElement.classList.add('hidden');
        if (loggedInBox) {
          loggedInBox.classList.remove('hidden');
          if (authUserName) authUserName.textContent = customer.name;
          if (authUserPhoneText) authUserPhoneText.textContent = customer.phone || '-';
          if (authUserEmailText) authUserEmailText.textContent = customer.email || 'Email belum diisi';
          if (authUserAddressText) authUserAddressText.textContent = customer.address || 'Belum ada alamat pengiriman tercatat';
          if (authUserAvatar) {
            authUserAvatar.src = customer.avatar_url || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(customer.name) + '&background=059669&color=fff');
          }

          // Cek Validasi Ganda Hak Akses & Status Aktif Sistem Poin
          const isPointsActive = (typeof DB !== 'undefined' && DB.isCustomerPointsActive) ? DB.isCustomerPointsActive(customer) : false;
          if (pointsCard) {
            if (isPointsActive) {
              pointsCard.classList.remove('hidden');
              const pts = (typeof DB !== 'undefined' && DB.getCustomerPoints) ? DB.getCustomerPoints(customer) : 0;
              if (pointsValEl) pointsValEl.textContent = pts.toLocaleString('id-ID');
            } else {
              pointsCard.classList.add('hidden');
            }
          }
        }
      } else {
        // Tampilkan Form Input (Guest Login atau Edit Profile Mode)
        if (form) form.classList.remove('hidden');
        if (loggedInBox) loggedInBox.classList.add('hidden');

        if (customer && forceEditMode) {
          if (btnGoogle && btnGoogle.parentElement) btnGoogle.parentElement.classList.add('hidden');
          const submitBtn = document.getElementById('btn-save-customer-auth');
          if (submitBtn) {
            submitBtn.innerHTML = '<i class="bi bi-check2-circle text-base"></i><span>Perbarui Data Profil</span>';
          }
          const nameInput = document.getElementById('auth-cust-name');
          const phoneInput = document.getElementById('auth-cust-phone');
          const emailInput = document.getElementById('auth-cust-email');
          const addrInput = document.getElementById('auth-cust-address');
          if (nameInput) nameInput.value = customer.name || '';
          if (phoneInput) phoneInput.value = customer.phone || '';
          if (emailInput) emailInput.value = customer.email || '';
          if (addrInput) addrInput.value = customer.address || '';
        } else {
          if (btnGoogle && btnGoogle.parentElement) btnGoogle.parentElement.classList.remove('hidden');
          const submitBtn = document.getElementById('btn-save-customer-auth');
          if (submitBtn) {
            submitBtn.innerHTML = '<i class="bi bi-check2-circle text-base"></i><span>Simpan Profil &amp; Masuk</span>';
          }
          const nameInput = document.getElementById('auth-cust-name');
          const phoneInput = document.getElementById('auth-cust-phone');
          const cartName = document.getElementById('cart-cust-name')?.value;
          const cartPhone = document.getElementById('cart-cust-phone')?.value;
          if (nameInput && cartName && !nameInput.value) nameInput.value = cartName;
          if (phoneInput && cartPhone && !phoneInput.value) phoneInput.value = cartPhone;
        }
      }
    }

    function openAuthModal(editMode = false) {
      if (!modal) return;
      syncModalState(editMode);
      modal.classList.remove('hidden');
    }

    function closeAuthModal() {
      if (!modal) return;
      modal.classList.add('hidden');
    }

    if (btnLogin) {
      btnLogin.addEventListener('click', (e) => {
        e.preventDefault();
        openAuthModal(false);
      });
    }

    if (btnEditProfile) {
      btnEditProfile.addEventListener('click', (e) => {
        e.preventDefault();
        syncModalState(true);
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', closeAuthModal);
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAuthModal();
      });
    }

    // Google Sign-In Simulation
    if (btnGoogle) {
      btnGoogle.addEventListener('click', (e) => {
        e.preventDefault();
        const googleName = 'Budi Santoso';
        const googleEmail = 'budi.santoso@gmail.com';
        const googleAvatar = 'https://ui-avatars.com/api/?name=Budi+Santoso&background=4285F4&color=fff';
        const customerData = {
          name: googleName,
          email: googleEmail,
          phone: '081234567890',
          auth_provider: 'google',
          avatar_url: googleAvatar
        };

        if (typeof DB !== 'undefined' && DB.saveCustomer) {
          DB.saveCustomer(null, customerData);
        }

        prefillCustomerIntoCart(customerData);
        updateNavbarLoginUI();
        initNavbarNotifications();
        closeAuthModal();

        showToast(`Selamat datang, ${googleName}! Berhasil masuk dengan Google.`, 'success');
      });
    }

    // Manual Form Submission
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = (document.getElementById('auth-cust-name')?.value || '').trim();
        const phone = (document.getElementById('auth-cust-phone')?.value || '').trim();
        const email = (document.getElementById('auth-cust-email')?.value || '').trim();
        const address = (document.getElementById('auth-cust-address')?.value || '').trim();

        if (!name || name.length < 2) {
          showToast('Mohon isi nama lengkap dengan benar.', 'warning');
          return;
        }
        if (!phone || phone.replace(/\D/g, '').length < 9) {
          showToast('Mohon isi nomor WhatsApp aktif dengan benar (minimal 9 digit).', 'warning');
          return;
        }

        const existingCust = (typeof DB !== 'undefined' && DB.getActiveCustomer) ? DB.getActiveCustomer() : {};
        const customerData = {
          ...existingCust,
          name,
          phone,
          email,
          address,
          auth_provider: existingCust.auth_provider || 'manual',
          avatar_url: existingCust.avatar_url || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=059669&color=fff')
        };

        if (typeof DB !== 'undefined' && DB.saveCustomer) {
          DB.saveCustomer(null, customerData);
        }

        prefillCustomerIntoCart(customerData);
        updateNavbarLoginUI();
        initNavbarNotifications();
        syncModalState(false);

        showToast(`Profil ${name} berhasil disimpan!`, 'success');
      });
    }

    // Logout
    if (btnLogout) {
      btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof DB !== 'undefined' && DB.clearActiveCustomer) {
          DB.clearActiveCustomer();
        }
        updateNavbarLoginUI();
        initNavbarNotifications();
        closeAuthModal();
        showToast('Anda telah keluar dari akun pelanggan.', 'info');
      });
    }

    updateNavbarLoginUI();
  }

  // ----------------------------------------------------------------------------
  // NAVBAR REAL-TIME ORDER NOTIFICATION BELL & DROPDOWN (POIN 7 REVISI)
  // ----------------------------------------------------------------------------
  function initNavbarNotifications() {
    const btnNotif = document.getElementById('btn-navbar-notif');
    const dropdown = document.getElementById('navbar-notif-dropdown');
    const btnClose = document.getElementById('btn-close-notif-dropdown');
    const notifList = document.getElementById('navbar-notif-list');
    const badgeCount = document.getElementById('notif-badge-count');
    const headerUnreadBadge = document.getElementById('notif-header-unread-badge');

    function getSeenNotifOrderIds() {
      const tid = (typeof DB !== 'undefined' && DB.getCurrentTenant) ? (DB.getCurrentTenant()?.tenant_id || 'tenant-songer-001') : 'tenant-songer-001';
      try {
        const stored = localStorage.getItem(`pos_seen_notif_order_ids_${tid}`) || localStorage.getItem('pos_seen_notif_order_ids');
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    }

    function markNotifOrdersAsSeen(orderIds) {
      if (!Array.isArray(orderIds) || orderIds.length === 0) return;
      const tid = (typeof DB !== 'undefined' && DB.getCurrentTenant) ? (DB.getCurrentTenant()?.tenant_id || 'tenant-songer-001') : 'tenant-songer-001';
      try {
        const currentSeen = new Set(getSeenNotifOrderIds().map(String));
        orderIds.forEach(id => currentSeen.add(String(id)));
        const updated = Array.from(currentSeen);
        localStorage.setItem(`pos_seen_notif_order_ids_${tid}`, JSON.stringify(updated));
      } catch (e) {}
    }

    function updateNotifDropdownPosition() {
      if (!dropdown || dropdown.classList.contains('hidden')) return;
      const headerEl = document.getElementById('main-storefront-header');
      if (window.innerWidth < 640) {
        if (headerEl) {
          const rect = headerEl.getBoundingClientRect();
          dropdown.style.top = `${rect.bottom + 8}px`;
        } else {
          dropdown.style.top = '72px';
        }
      } else {
        dropdown.style.top = '';
      }
    }

    function refreshNotificationList(markSeenNow = false) {
      if (!notifList) return;
      const orders = (typeof DB !== 'undefined' && DB.getOrders) ? DB.getOrders() : [];
      const customer = (typeof DB !== 'undefined' && DB.getActiveCustomer) ? DB.getActiveCustomer() : null;

      let relevantOrders = [];
      if (customer) {
        const custPhone = (customer.phone || '').replace(/\D/g, '');
        const custEmail = (customer.email || '').trim().toLowerCase();
        const custName = (customer.name || '').trim().toLowerCase();

        relevantOrders = orders.filter(o => {
          const oPhone = (o.customer_phone || '').replace(/\D/g, '');
          const oEmail = (o.customer_email || '').trim().toLowerCase();
          const oName = (o.customer_name || '').trim().toLowerCase();
          return (custPhone && oPhone && oPhone === custPhone) ||
                 (custEmail && oEmail && oEmail === custEmail) ||
                 (custName && oName && oName === custName);
        });
      } else {
        relevantOrders = orders.slice(0, 5);
      }

      // Logika Unread: hitung pesanan yang ID-nya belum ada di localStorage
      const seenIds = new Set(getSeenNotifOrderIds().map(String));
      const unreadOrders = relevantOrders.filter(o => !seenIds.has(String(o.id)));
      const unreadCount = unreadOrders.length;

      // Update badge di lonceng navbar (HANYA tampil jika unreadCount > 0)
      if (badgeCount) {
        if (unreadCount > 0) {
          badgeCount.textContent = unreadCount > 9 ? '9+' : unreadCount;
          badgeCount.classList.remove('hidden');
        } else {
          badgeCount.classList.add('hidden');
        }
      }

      // Update badge unread di header dropdown
      if (headerUnreadBadge) {
        if (unreadCount > 0) {
          headerUnreadBadge.textContent = unreadCount > 99 ? '99+' : `${unreadCount} baru`;
          headerUnreadBadge.classList.remove('hidden');
        } else {
          headerUnreadBadge.classList.add('hidden');
        }
      }

      // Jika dropdown sedang dibuka oleh user, tandai pesanan sebagai sudah dilihat
      if (markSeenNow && relevantOrders.length > 0) {
        markNotifOrdersAsSeen(relevantOrders.map(o => o.id));
        if (badgeCount) badgeCount.classList.add('hidden');
        if (headerUnreadBadge) headerUnreadBadge.classList.add('hidden');
      }

      // Hitung kuota untuk 2 Menu Utama
      const activeOrdersCount = relevantOrders.filter(o => {
        const s = (o.status || '').toUpperCase();
        return s === 'PENDING' || s === 'MENUNGGU_PEMBAYARAN' || s === 'PROCESSING' || s === 'PROSES' || s === 'IN_PROGRESS';
      }).length;

      const completedOrdersCount = relevantOrders.filter(o => {
        const s = (o.status || '').toUpperCase();
        return s === 'COMPLETED' || s === 'PAID' || s === 'SELESAI';
      }).length;

      notifList.innerHTML = `
        <div class="space-y-2.5 py-1">
          <!-- 1. Menu Pesanan Saya -->
          <div id="btn-notif-menu-active" class="p-3 rounded-2xl border border-slate-200/80 hover:border-emerald-300 bg-slate-50/70 hover:bg-emerald-50/40 transition cursor-pointer flex items-center justify-between group shadow-2xs">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition shadow-2xs">
                <i class="bi bi-bag-check-fill text-lg"></i>
              </div>
              <div class="min-w-0">
                <h5 class="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition leading-tight">Pesanan Saya</h5>
                <p class="text-[11px] text-slate-500 mt-0.5 truncate">Sedang diproses &amp; menunggu pembayaran</p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-black ${activeOrdersCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200/80 text-slate-500'}">
                ${activeOrdersCount}
              </span>
              <i class="bi bi-chevron-right text-xs text-slate-400 group-hover:text-emerald-600 transition"></i>
            </div>
          </div>

          <!-- 2. Menu Riwayat Pesanan -->
          <div id="btn-notif-menu-history" class="p-3 rounded-2xl border border-slate-200/80 hover:border-emerald-300 bg-slate-50/70 hover:bg-emerald-50/40 transition cursor-pointer flex items-center justify-between group shadow-2xs">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition shadow-2xs">
                <i class="bi bi-clock-history text-lg"></i>
              </div>
              <div class="min-w-0">
                <h5 class="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition leading-tight">Riwayat Pesanan</h5>
                <p class="text-[11px] text-slate-500 mt-0.5 truncate">Pesanan selesai &amp; transaksi lunas</p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-black ${completedOrdersCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/80 text-slate-500'}">
                ${completedOrdersCount}
              </span>
              <i class="bi bi-chevron-right text-xs text-slate-400 group-hover:text-emerald-600 transition"></i>
            </div>
          </div>

          ${!customer ? `
            <div class="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-center">
              <p class="text-[11px] text-emerald-800 font-medium">Masuk akun untuk sinkronisasi pesanan antar perangkat.</p>
            </div>
          ` : ''}
        </div>
      `;

      // Event listener klik pada baris menu
      const btnActive = document.getElementById('btn-notif-menu-active');
      const btnHistory = document.getElementById('btn-notif-menu-history');

      if (btnActive) {
        btnActive.addEventListener('click', () => {
          dropdown.classList.add('hidden');
          if (!customer) {
            const authBtn = document.getElementById('btn-navbar-login');
            if (authBtn) authBtn.click();
            showToast('Silakan masuk akun untuk melihat rincian pesanan Anda.', 'info');
          } else {
            showToast(`Anda memiliki ${activeOrdersCount} pesanan aktif.`, 'info');
          }
        });
      }

      if (btnHistory) {
        btnHistory.addEventListener('click', () => {
          dropdown.classList.add('hidden');
          if (!customer) {
            const authBtn = document.getElementById('btn-navbar-login');
            if (authBtn) authBtn.click();
            showToast('Silakan masuk akun untuk melihat riwayat pesanan.', 'info');
          } else {
            showToast(`Total ${completedOrdersCount} pesanan selesai tercatat.`, 'info');
          }
        });
      }
    }

    if (btnNotif && dropdown) {
      btnNotif.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = dropdown.classList.contains('hidden');
        dropdown.classList.toggle('hidden');
        if (willOpen) {
          updateNotifDropdownPosition();
          refreshNotificationList(true);
        } else {
          dropdown.style.top = '';
        }
      });
    }

    if (btnClose && dropdown) {
      btnClose.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.add('hidden');
        dropdown.style.top = '';
      });
    }

    document.addEventListener('click', (e) => {
      if (dropdown && !dropdown.classList.contains('hidden')) {
        if (!dropdown.contains(e.target) && !btnNotif?.contains(e.target)) {
          dropdown.classList.add('hidden');
          dropdown.style.top = '';
        }
      }
    });

    window.addEventListener('resize', updateNotifDropdownPosition);
    window.addEventListener('scroll', updateNotifDropdownPosition, { passive: true });

    refreshNotificationList(false);
  }

  function applyHeaderBranding(settings) {
    const navLogo = document.getElementById('header-brand-logo');
    const logoContainer = document.getElementById('header-logo-container');
    const storeInfoBox = document.getElementById('header-store-info-box');
    const storeNameEl = document.getElementById('header-store-name');
    const storeTaglineEl = document.getElementById('header-store-tagline');

    const storeName = settings?.store_name || 'Songer Creative';
    const storeTagline = settings?.store_tagline || 'Digital Printing & Percetakan Terpadu';
    const webLogo = settings?.web_logo || 'assets/images/logo-songer-creative.png';

    if (storeNameEl) storeNameEl.textContent = storeName;
    if (storeTaglineEl) storeTaglineEl.textContent = storeTagline;
    if (navLogo && webLogo) navLogo.src = webLogo;

    // Hapus dot hijau jika masih ada di DOM
    const pulseDot = document.querySelector('#nav-brand-logo-btn .animate-pulse');
    if (pulseDot) pulseDot.remove();

    if (!logoContainer && !storeInfoBox) return;

    // Tentukan mode branding: 'logo_square' | 'logo_landscape' | 'text_only'
    let mode = settings?.navbar_branding_mode;
    if (!mode) {
      mode = settings?.header_use_logo === false ? 'text_only' : 'logo_landscape';
    }

    const storeNameColor = settings?.navbar_store_name_color || settings?.navbar_text_color || '#0f172a';
    const taglineColor = settings?.navbar_tagline_color || '#64748b';
    const showDesktopName = settings?.show_header_store_name !== false;

    if (mode === 'text_only') {
      // 1. OPSI 3: HANYA TEKS (Nama Toko & Tagline)
      // Sembunyikan logo gambar sepenuhnya
      if (logoContainer) {
        logoContainer.className = 'hidden';
      }
      // Posisikan kontainer teks tepat di slot posisi logo sebelumnya (sisi kiri navbar)
      if (storeInfoBox) {
        storeInfoBox.className = 'flex flex-col justify-center border-l-0 pl-0 shrink-0 min-w-0 max-w-[130px] sm:max-w-[220px]';
      }
      // Baris 1: Nama Toko (Font tegas / semi-bold, proporsional, warna dinamis)
      if (storeNameEl) {
        storeNameEl.style.color = storeNameColor;
        storeNameEl.className = 'font-bold sm:font-extrabold text-xs sm:text-base tracking-tight truncate leading-tight block';
      }
      // Baris 2: Tagline Toko (Font lebih kecil / regular di bawah nama toko, warna dinamis)
      if (storeTaglineEl) {
        storeTaglineEl.style.color = taglineColor;
        storeTaglineEl.className = 'text-[9px] sm:text-[11px] block truncate font-medium leading-tight mt-0.5 max-w-[130px] sm:max-w-[220px]';
      }
    } else if (mode === 'logo_square') {
      // 2. OPSI 1: LOGO PERSEGI / ICON (Kotak 1:1 di sisi kiri)
      if (logoContainer) {
        logoContainer.className = 'h-10 flex items-center shrink-0';
      }
      if (navLogo) {
        navLogo.className = 'h-9 w-9 sm:h-10 sm:w-10 max-w-[42px] max-h-[42px] aspect-square object-contain rounded-xl transition group-hover:opacity-90';
      }
      if (storeInfoBox) {
        if (showDesktopName) {
          storeInfoBox.className = 'border-l border-slate-200/80 pl-2.5 sm:pl-3 hidden sm:flex flex-col justify-center min-w-0 max-w-[200px]';
        } else {
          storeInfoBox.className = 'hidden';
        }
      }
      if (storeNameEl) {
        storeNameEl.style.color = '';
        storeNameEl.className = 'font-extrabold text-sm sm:text-base text-slate-900 tracking-tight truncate leading-tight block';
      }
      if (storeTaglineEl) {
        storeTaglineEl.style.color = '';
        storeTaglineEl.className = 'text-[11px] text-slate-500 block truncate max-w-[200px] leading-tight mt-0.5';
      }
    } else {
      // 3. OPSI 2: LOGO LANDSCAPE (Memanjang horizontal di sisi kiri)
      if (logoContainer) {
        logoContainer.className = 'h-10 flex items-center shrink-0';
      }
      if (navLogo) {
        navLogo.className = 'h-8 sm:h-9 w-auto max-w-[115px] sm:max-w-[165px] object-contain transition group-hover:opacity-90';
      }
      if (storeInfoBox) {
        if (showDesktopName) {
          storeInfoBox.className = 'border-l border-slate-200/80 pl-2.5 sm:pl-3 hidden sm:flex flex-col justify-center min-w-0 max-w-[200px]';
        } else {
          storeInfoBox.className = 'hidden';
        }
      }
      if (storeNameEl) {
        storeNameEl.style.color = '';
        storeNameEl.className = 'font-extrabold text-sm sm:text-base text-slate-900 tracking-tight truncate leading-tight block';
      }
      if (storeTaglineEl) {
        storeTaglineEl.style.color = '';
        storeTaglineEl.className = 'text-[11px] text-slate-500 block truncate max-w-[200px] leading-tight mt-0.5';
      }
    }

    // --- DYNAMIC NAVBAR ARCHITECTURE (STATIC VS STICKY & 1-ROW VS 2-ROWS) ---
    const headerEl = document.getElementById('main-storefront-header');
    if (headerEl) {
      // 1. Opsi Posisi Navbar: 'sticky' (default) vs 'static'
      const posMode = settings?.navbar_position_mode || 'sticky';
      if (posMode === 'static') {
        headerEl.classList.remove('sticky', 'top-0');
        headerEl.classList.add('relative');
      } else {
        headerEl.classList.add('sticky', 'top-0');
        headerEl.classList.remove('relative');
      }

      // 2. Opsi Baris Pencarian: '1_row' (default) vs '2_rows'
      const layoutRows = settings?.navbar_layout_rows || '1_row';
      const secondRowSearch = document.getElementById('navbar-second-row-search');
      const firstRowSearch = document.getElementById('navbar-search-desktop-container');

      if (layoutRows === '2_rows') {
        if (secondRowSearch) secondRowSearch.classList.remove('hidden');
        if (firstRowSearch) firstRowSearch.classList.add('hidden');
        headerEl.classList.add('h-auto');
      } else {
        if (secondRowSearch) secondRowSearch.classList.add('hidden');
        if (firstRowSearch) firstRowSearch.classList.remove('hidden');
        headerEl.classList.remove('h-auto');
      }

      // 3. Update CSS Variable --store-header-height dinamis
      const syncHeaderHeight = () => {
        const height = headerEl.offsetHeight || 64;
        document.documentElement.style.setProperty('--store-header-height', `${height}px`);
      };
      syncHeaderHeight();

      if (window.ResizeObserver && !headerEl._hasResizeObserver) {
        headerEl._hasResizeObserver = true;
        const ro = new ResizeObserver(() => syncHeaderHeight());
        ro.observe(headerEl);
      }
    }
  }

  function init() {
    // Sinkronisasi Navbar Logo, Favicon, & Skema Warna Toko
    const settings = DB.getSettings();
    const faviconEl = document.getElementById('app-favicon');
    if (faviconEl && settings.browser_icon) faviconEl.href = settings.browser_icon;

    // Top Dynamic Non-Sticky Greeting Bar
    updateTopGreetingBar(settings);

    // Sinkronisasi Header Navbar Branding (Aturan Responsive Desktop & Layar HP)
    applyHeaderBranding(settings);

    // Terapkan Kustomisasi Palet Warna Elemen Navbar
    applyNavbarElementColors(settings);

    // Terapkan warna Navbar Toko & Latar Belakang Body Toko
    const headerEl = document.getElementById('main-storefront-header') || document.querySelector('header');
    if (headerEl) {
      if (settings.navbar_bg_color) headerEl.style.backgroundColor = settings.navbar_bg_color;
      if (settings.navbar_text_color) headerEl.style.color = settings.navbar_text_color;
    }
    const currentBodyBg = (typeof settings !== 'undefined' && settings.body_bg_color) ? settings.body_bg_color : '#f8fafc';
    if (settings.body_bg_color) {
      document.body.style.backgroundColor = currentBodyBg;
    }

    // Terapkan Font Judul & Font Isi E-Commerce
    const fontHeading = settings.store_font_heading || 'Bricolage Grotesque';
    const fontBody = settings.store_font_body || 'Inter';
    document.documentElement.style.setProperty('--store-font-heading', fontHeading);
    document.documentElement.style.setProperty('--store-font-body', fontBody);
    document.body.style.fontFamily = `'${fontBody}', sans-serif`;

    renderStorefront();
    startCountdownTimer();
    initFloatingVoucher();
    bindStoreEvents();
    initStorefrontSEO();
    initNavbarSearchAutocomplete();
    initMobileSearchOverlay();
    initNavbarLogin();
    initNavbarNotifications();
    checkSellerSession();
    initHeroSlider();

    // Realtime sync jika seller mengubah tema/hero di tab admin
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.includes('settings')) {
        const updatedSettings = (typeof DB !== 'undefined' && DB.getSettings) ? DB.getSettings() : {};
        applyHeaderBranding(updatedSettings);
        applyNavbarElementColors(updatedSettings);
        updateTopGreetingBar(updatedSettings);
        if (updatedSettings.store_font_heading) {
          document.documentElement.style.setProperty('--store-font-heading', updatedSettings.store_font_heading);
        }
        if (updatedSettings.store_font_body) {
          document.documentElement.style.setProperty('--store-font-body', updatedSettings.store_font_body);
          document.body.style.fontFamily = `'${updatedSettings.store_font_body}', sans-serif`;
        }
        initStorefrontSEO();
        renderStorefront();
        initHeroSlider();
      }
    });
  }

  // ----------------------------------------------------------------------------
  // UNIVERSAL HERO CTA BUTTONS HTML GENERATOR
  // ----------------------------------------------------------------------------
  function renderHeroCtaButtonsHtml(settings, storeName) {
    if (!settings) settings = {};
    const countMode = settings.hero_cta_count_mode || 'both';
    if (countMode === 'none') return '';

    const actualStoreName = storeName || settings.store_name || 'Songer Creative';

    let cta1Html = '';
    if (countMode === 'both' || countMode === 'cta1_only') {
      const showIcon = settings.hero_cta1_show_icon !== false;
      const text = settings.hero_cta1_text || 'Lihat Produk';
      const iconKey = settings.hero_cta1_icon || 'bi-arrow-down-short';
      const textColor = settings.hero_cta1_text_color || '#ffffff';
      const iconColor = settings.hero_cta1_icon_color || '#ffffff';
      const bgColor = settings.hero_cta1_bg_color || settings.primary_color || '#33b589';
      const radius = settings.hero_cta1_radius || '12px';
      const shadow = settings.hero_cta1_shadow || 'sm';
      const shadowClass = (shadow === 'none') ? 'shadow-none hero-shadow-none' : `shadow-${shadow} hero-shadow-${shadow}`;
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
      const showIcon = settings.hero_cta2_show_icon !== false;
      const text = settings.hero_cta2_text || 'Konsultasi';
      const iconKey = settings.hero_cta2_icon || 'bi-whatsapp';
      const textColor = settings.hero_cta2_text_color || '#0f172a';
      const iconColor = settings.hero_cta2_icon_color || '#10b981';
      const bgColor = settings.hero_cta2_bg_color || '#ffffff';
      const radius = settings.hero_cta2_radius || '12px';
      const shadow = settings.hero_cta2_shadow || 'sm';
      const shadowClass = (shadow === 'none') ? 'shadow-none hero-shadow-none' : `shadow-${shadow} hero-shadow-${shadow}`;
      const iconHtml = showIcon ? renderNavIconHtml(iconKey, 'text-base shrink-0', `color: ${iconColor};`) : '';

      const rawPhone = settings.store_phone || settings.footer_social_whatsapp || (typeof currentTenant !== 'undefined' && currentTenant ? currentTenant.phone : '') || '08885844380';
      let cleanPhone = String(rawPhone).replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.slice(1);
      }
      let rawMsg = settings.hero_cta2_wa_message || 'Halo Admin *Nama Toko* saya ingin Konsultasi mengenai layanan/produk anda';
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

  // --- HERO SECTION GENERATOR (EXPORTABLE & REUSABLE) ---

  function generateHeroSectionHtml(settings) {
    if (!settings) settings = {};
    if (settings.hero_enabled === false || settings.enable_hero === false) {
      return '';
    }
    let heroSectionHtml = '';
    const heroBannerImg = settings.hero_banner_image || 'assets/images/banner-printing-hero.jpg';
    const heroBanners = (Array.isArray(settings.hero_banners) && settings.hero_banners.length > 0)
      ? settings.hero_banners.filter(Boolean)
      : (heroBannerImg ? [heroBannerImg] : []);

    let heroModel = settings.hero_model;
    if (!heroModel) {
      if (settings.hero_type === 'text') heroModel = 'model_1';
      else heroModel = 'non_split';
    }

    const animType = settings.hero_slider_animation || 'slide_3s';

    // Background styling calculation identical to admin live preview
    const heroBgType = settings.hero_bg_type || 'linear_gradient';
    const heroBgColor1 = settings.hero_bg_color1 || '#0f172a';
    const heroBgColor2 = settings.hero_bg_color2 || '#064e3b';
    const heroBgAngle = settings.hero_bg_angle !== undefined ? settings.hero_bg_angle : 135;

    let heroBgCss = '';
    if (heroBgType === 'solid') {
      heroBgCss = `background-color: ${heroBgColor1};`;
    } else if (heroBgType === 'radial_gradient') {
      heroBgCss = `background: radial-gradient(circle at center, ${heroBgColor1} 0%, ${heroBgColor2} 100%);`;
    } else {
      heroBgCss = `background: linear-gradient(${heroBgAngle}deg, ${heroBgColor1} 0%, ${heroBgColor2} 100%);`;
    }

    // Token Konfigurasi Hero Banner Baru
    const heroContainerRadius = settings.hero_container_radius || '16px';
    const heroContainerShadow = settings.hero_container_shadow || 'sm';
    const heroTitleColor = settings.hero_title_color || '#ffffff';
    const heroDescColor = settings.hero_desc_color || '#cbd5e1';
    const heroImageRadius = settings.hero_image_radius || '12px';
    const heroImageShadow = settings.hero_image_shadow || 'sm';
    const heroDotsActiveColor = settings.hero_dots_active_color || '#10b981';
    const heroDotsInactiveColor = settings.hero_dots_inactive_color || '#cbd5e1';

    // CTA Buttons generator
    const storeName = settings.store_name || 'Songer Creative';
    const heroCtaButtonsHtml = renderHeroCtaButtonsHtml(settings, storeName);

    // Kustomisasi Tombol Panah Slider & Geser Manual
    const heroArrowsBg = settings.hero_arrows_bg || 'rgba(0,0,0,0.45)';
    const heroArrowsHoverBg = settings.hero_arrows_hover_bg || 'rgba(0,0,0,0.75)';
    const heroArrowsIconColor = settings.hero_arrows_icon_color || '#ffffff';
    const heroArrowsRadius = settings.hero_arrows_radius || '9999px';
    const heroArrowsShadow = settings.hero_arrows_shadow || 'sm';

    // Hero Split Mobile Layout setting: 'image_top' (default) vs 'image_bottom'
    const heroSplitMobile = settings.hero_split_mobile || 'image_top';
    const heroSplitDesktopPos = settings.hero_split_desktop_pos || 'text_left';

    // STANDARISASI ASPEK RASIO BANNER HERO:
    // Desktop: Kunci rasio 9 : 2 (4.5 : 1) dengan aspect-[9/2] w-full object-cover
    // Mobile: Kunci rasio 16 : 5 (3.2 : 1) dengan aspect-[16/5] w-full object-cover
    const nonSplitAspectClass = 'aspect-[16/5] md:aspect-[9/2] w-full hero-responsive-aspect object-cover';
    const nonSplitAspectStyle = 'aspect-ratio: 16 / 5; width: 100%;';

    const heroWidthLayout = settings.hero_width_layout || 'boxed';
    const isFullWidth = (heroWidthLayout === 'full');
    const heroBorderBottomEnable = Boolean(settings.hero_border_bottom_enable);
    const heroBorderBottomColor = settings.hero_border_bottom_color || '#e2e8f0';
    const heroBorderBottomThickness = settings.hero_border_bottom_thickness || '1px';
    const heroBorderBottomStyle = heroBorderBottomEnable ? `border-bottom: ${heroBorderBottomThickness} solid ${heroBorderBottomColor};` : '';

    const heroShowArrows = shouldShowNavArrows(animType, settings.hero_show_arrows !== false);
    const isAlwaysVisible = (animType === 'manual' || animType === 'manual_swipe') || (settings.hero_arrows_visibility === 'always');
    const arrowVisibilityClass = isAlwaysVisible 
      ? 'opacity-100' 
      : 'opacity-0 group-hover:opacity-100 transition-opacity';

    // Helper: generate slides HTML Non-Split
    const slidesHtml = heroBanners.map((b, i) => `
      <div class="hero-slide-smooth ${i === 0 ? 'is-active' : 'is-hidden'}" data-index="${i}" style="border-radius: inherit; overflow: hidden;">
        <img src="${b}" alt="Hero Banner ${i + 1}" class="w-full h-full object-cover ${isFullWidth ? 'rounded-none' : ''}" style="border-radius: inherit;" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-3xl\\'><i class=\\'bi bi-images\\'></i></div>';" />
      </div>
    `).join('');

    // Helper: generate slides HTML Split (Menggunakan daftar heroBanners utama)
    const splitSlidesHtml = heroBanners.map((b, i) => `
      <div class="hero-slide-smooth ${i === 0 ? 'is-active' : 'is-hidden'}" data-index="${i}" style="border-radius: inherit; overflow: hidden;">
        <img src="${b}" alt="Hero Banner ${i + 1}" class="w-full h-full hero-split-image-cover" style="border-radius: inherit;" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-2xl\\'><i class=\\'bi bi-images\\'></i></div>';" />
      </div>
    `).join('');

    if (heroModel === 'model_1') {
      // [1] Model Teks & CTA: Card Elegan dengan Background, Radius, Shadow & Tombol CTA
      const isContainerShadowNone = heroContainerShadow === 'none' || !heroContainerShadow;
      const textBorderClass = isContainerShadowNone ? 'border-0 shadow-none hero-shadow-none' : `border border-white/10 hero-shadow-${heroContainerShadow}`;

      heroSectionHtml = `
        <div class="${isFullWidth ? '-mx-3 sm:-mx-4 lg:-mx-6 -mt-3 sm:-mt-4 lg:-mt-6' : ''}">
          <div class="relative overflow-hidden p-6 sm:p-12 ${isFullWidth ? 'rounded-none border-x-0' : textBorderClass}" style="${heroBgCss} ${isFullWidth ? 'border-radius: 0;' : 'border-radius: ' + heroContainerRadius + ';'} ${heroBorderBottomStyle}" id="hero-slider-container">
            <div class="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
            <div class="relative z-10 max-w-2xl space-y-3.5 sm:space-y-4">
              <h1 class="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight" style="color: ${heroTitleColor};">
                ${escapeHtml(settings.hero_headline || 'Cetak Banner, Desain & Souvenir Harga Instan')}
              </h1>
              <p class="text-xs sm:text-sm leading-relaxed" style="color: ${heroDescColor};">
                ${escapeHtml(settings.hero_subheadline || 'Katalog terpadu dengan kalkulator instan: spesifikasi kustom meteran, jasa desain original, hingga souvenir retail siap kirim ke seluruh Indonesia.')}
              </p>
              ${heroCtaButtonsHtml ? `<div class="pt-2 sm:pt-3">${heroCtaButtonsHtml}</div>` : ''}
            </div>
          </div>
        </div>
      `;
    } else if (heroModel === 'split' || heroModel === 'model_4') {
      // [2] VARIAN HERO SPLIT (Desktop: Teks 40% & Wadah Gambar 60% dengan opsi posisi Desktop; Mobile: Susunan Fleksibel)
      const isContainerShadowNone = heroContainerShadow === 'none' || !heroContainerShadow;
      const containerBorderClass = isContainerShadowNone ? 'border-0 shadow-none hero-shadow-none' : `border border-slate-200 dark:border-slate-800 hero-shadow-${heroContainerShadow}`;

      const isImageShadowNone = heroImageShadow === 'none' || !heroImageShadow;
      const splitBoxShadowClass = isImageShadowNone ? 'border-0 shadow-none hero-shadow-none' : `hero-shadow-${heroImageShadow} border border-slate-200/60 dark:border-slate-700/60`;
      const splitBoxRadiusStyle = `border-radius: ${heroImageRadius};`;

      const mobileFlexClass = heroSplitMobile === 'image_bottom' ? 'flex flex-col-reverse md:flex-row' : 'flex flex-col md:flex-row';
      const imgDesktopOrder = heroSplitDesktopPos === 'image_left' ? 'md:order-1' : 'md:order-2';
      const textDesktopOrder = heroSplitDesktopPos === 'image_left' ? 'md:order-2' : 'md:order-1';

      heroSectionHtml = `
        <div class="${isFullWidth ? '-mx-3 sm:-mx-4 lg:-mx-6 -mt-3 sm:-mt-4 lg:-mt-6' : ''}">
          <div class="relative overflow-hidden group ${animType.startsWith('fade') ? 'hero-anim-fade' : ''} ${isFullWidth ? 'rounded-none border-x-0' : containerBorderClass}" style="${isFullWidth ? 'border-radius: 0;' : 'border-radius: ' + heroContainerRadius + ';'} ${heroBorderBottomStyle} overflow: hidden;" id="hero-slider-container" data-anim="${animType}" data-count="${heroBanners.length}">
          <div class="w-full md:aspect-[9/2] flex items-center p-3 sm:p-5 md:p-6" style="${heroBgCss} border-radius: inherit;">
            <div class="${mobileFlexClass} items-stretch md:items-center gap-3 sm:gap-4 md:gap-6 w-full h-full">
              
              <!-- Kolom Gambar: Desktop 60% (order adaptif), Mobile Membentang Penuh Proporsional 16:5 -->
              <div class="w-full md:w-[60%] ${imgDesktopOrder} flex flex-col items-center justify-center shrink-0 min-w-0 aspect-[16/5] md:aspect-auto md:h-full hero-split-mobile-image">
                <div class="overflow-hidden w-full h-full relative group bg-slate-100 dark:bg-slate-800 ${splitBoxShadowClass}" style="${splitBoxRadiusStyle}; overflow: hidden;">
                  <div class="hero-slider-track w-full h-full relative" style="border-radius: inherit;">
                    ${splitSlidesHtml}
                  </div>
                  ${heroShowArrows ? `
                    <button type="button" class="hero-arrow-btn absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 hidden md:flex items-center justify-center z-20 ${arrowVisibilityClass} transition duration-200 pointer-events-auto backdrop-blur-sm active:scale-90 hero-shadow-${heroArrowsShadow}" id="hero-slide-prev" title="Slide Sebelumnya (&lt;)" style="background-color: ${heroArrowsBg}; color: ${heroArrowsIconColor}; border-radius: ${heroArrowsRadius};" onmouseenter="this.style.backgroundColor='${heroArrowsHoverBg}'" onmouseleave="this.style.backgroundColor='${heroArrowsBg}'"><i data-lucide="chevron-left" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i></button>
                    <button type="button" class="hero-arrow-btn absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 hidden md:flex items-center justify-center z-20 ${arrowVisibilityClass} transition duration-200 pointer-events-auto backdrop-blur-sm active:scale-90 hero-shadow-${heroArrowsShadow}" id="hero-slide-next" title="Slide Berikutnya (&gt;)" style="background-color: ${heroArrowsBg}; color: ${heroArrowsIconColor}; border-radius: ${heroArrowsRadius};" onmouseenter="this.style.backgroundColor='${heroArrowsHoverBg}'" onmouseleave="this.style.backgroundColor='${heroArrowsBg}'"><i data-lucide="chevron-right" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i></button>
                  ` : ''}
                  <!-- Indikator Slider Dots Melayang (Absolute di dalam kotak gambar) -->
                  ${heroBanners.length > 1 ? `
                    <div class="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 pointer-events-auto">
                      ${heroBanners.map((_, i) => `<button type="button" class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all hero-slide-dot cursor-pointer" data-index="${i}" style="background-color: ${i === 0 ? heroDotsActiveColor : heroDotsInactiveColor}; ${i === 0 ? 'transform: scale(1.25);' : ''}"></button>`).join('')}
                    </div>
                  ` : ''}
                </div>
              </div>

              <!-- Kolom Teks: Desktop 40% (order adaptif), Mobile Membentang Penuh -->
              <div class="w-full md:w-[40%] ${textDesktopOrder} flex flex-col justify-center min-w-0 pr-0 md:pr-4 h-auto md:h-full py-2 md:py-0">
                <h1 class="line-clamp-2 font-bold text-sm sm:text-base md:text-xl lg:text-2xl leading-snug tracking-tight" style="color: ${heroTitleColor};">
                  ${escapeHtml(settings.hero_headline || settings.store_name || 'Cetak Banner, Desain & Souvenir')}
                </h1>
                <p class="line-clamp-2 sm:line-clamp-3 text-[11px] sm:text-xs md:text-sm mt-1 sm:mt-1.5 leading-relaxed" style="color: ${heroDescColor};">
                  ${escapeHtml(settings.hero_subheadline || settings.store_tagline || 'Katalog terpadu dengan kalkulator instan: spesifikasi kustom meteran, jasa desain original, dan souvenir retail.')}
                </p>
                ${heroCtaButtonsHtml ? `<div class="pt-2 sm:pt-3">${heroCtaButtonsHtml}</div>` : ''}
              </div>

            </div>
          </div>
        </div>
      </div>
      `;
    } else if (heroModel === 'model_3') {
      // [3] Model Gambar DENGAN Teks Overlay (Tanpa CTA)
      const isContainerShadowNone = heroContainerShadow === 'none' || !heroContainerShadow;
      const containerBorderClass = isContainerShadowNone ? 'border-0 shadow-none hero-shadow-none' : `border border-white/10 hero-shadow-${heroContainerShadow}`;

      heroSectionHtml = `
        <div class="${isFullWidth ? '-mx-3 sm:-mx-4 lg:-mx-6 -mt-3 sm:-mt-4 lg:-mt-6' : ''}">
          <div class="relative overflow-hidden ${isFullWidth ? 'rounded-none border-x-0' : containerBorderClass} shadow-2xl group ${animType.startsWith('fade') ? 'hero-anim-fade' : ''}" style="${isFullWidth ? 'border-radius: 0;' : 'border-radius: ' + heroContainerRadius + ';'} ${heroBorderBottomStyle} overflow: hidden;" id="hero-slider-container" data-anim="${animType}" data-count="${heroBanners.length}">
            <div class="${nonSplitAspectClass} relative bg-slate-950 overflow-hidden flex items-center" style="${nonSplitAspectStyle}; border-radius: inherit;">
              <div class="hero-slider-track absolute inset-0 w-full h-full" style="border-radius: inherit;">
                ${slidesHtml}
              </div>
              <div class="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/40 z-10 pointer-events-none"></div>
              
              <div class="relative z-20 p-5 sm:p-10 md:p-12 max-w-2xl space-y-3 sm:space-y-3.5 text-white w-full">
                <h1 class="text-lg sm:text-3xl md:text-4xl font-black tracking-tight leading-snug sm:leading-tight" style="color: ${heroTitleColor};">
                  ${escapeHtml(settings.hero_headline || 'Cetak Banner, Desain & Souvenir Harga Instan')}
                </h1>
                <p class="text-xs sm:text-sm leading-relaxed max-w-xl line-clamp-2 sm:line-clamp-3" style="color: ${heroDescColor};">
                  ${escapeHtml(settings.hero_subheadline || 'Katalog terpadu dengan kalkulator instan: spesifikasi kustom meteran, jasa desain original, hingga souvenir retail siap kirim ke seluruh Indonesia.')}
                </p>
              </div>
              ${heroShowArrows && heroBanners.length > 1 ? `
                <button type="button" class="hero-arrow-btn absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 hidden md:flex items-center justify-center z-30 ${arrowVisibilityClass} transition duration-200 pointer-events-auto backdrop-blur-sm active:scale-90 hero-shadow-${heroArrowsShadow}" id="hero-slide-prev" title="Slide Sebelumnya (&lt;)" style="background-color: ${heroArrowsBg}; color: ${heroArrowsIconColor}; border-radius: ${heroArrowsRadius};" onmouseenter="this.style.backgroundColor='${heroArrowsHoverBg}'" onmouseleave="this.style.backgroundColor='${heroArrowsBg}'"><i data-lucide="chevron-left" class="w-4 h-4 sm:w-5 sm:h-5"></i></button>
                <button type="button" class="hero-arrow-btn absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 hidden md:flex items-center justify-center z-30 ${arrowVisibilityClass} transition duration-200 pointer-events-auto backdrop-blur-sm active:scale-90 hero-shadow-${heroArrowsShadow}" id="hero-slide-next" title="Slide Berikutnya (&gt;)" style="background-color: ${heroArrowsBg}; color: ${heroArrowsIconColor}; border-radius: ${heroArrowsRadius};" onmouseenter="this.style.backgroundColor='${heroArrowsHoverBg}'" onmouseleave="this.style.backgroundColor='${heroArrowsBg}'"><i data-lucide="chevron-right" class="w-4 h-4 sm:w-5 sm:h-5"></i></button>
              ` : ''}
              <!-- Indikator Slider Dots Melayang (Absolute di atas gambar banner) -->
              ${heroBanners.length > 1 ? `
                <div class="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 pointer-events-auto">
                  ${heroBanners.map((_, i) => `<button type="button" class="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full transition-all hero-slide-dot cursor-pointer" data-index="${i}" style="background-color: ${i === 0 ? heroDotsActiveColor : heroDotsInactiveColor}; ${i === 0 ? 'transform: scale(1.25);' : ''}"></button>`).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    } else {
      // [4] VARIAN HERO NON-SPLIT (GAMBAR PENUH) - DEFAULT & UTAMA
      // Desktop: Kunci rasio 9 : 2 (4.5 : 1)
      // Mobile: Kunci rasio 16 : 5 (3.2 : 1)
      // Mode Non-Split: Sembunyikan elemen tombol CTA di etalase!
      // Indikator Slider (...): Melayang (absolute) di atas bagian bawah gambar banner
      const isContainerShadowNone = heroContainerShadow === 'none' || !heroContainerShadow;
      const containerBorderClass = isContainerShadowNone ? 'border-0 shadow-none hero-shadow-none' : `border border-slate-200/80 dark:border-slate-800 hero-shadow-${heroContainerShadow}`;

      heroSectionHtml = `
        <div class="${isFullWidth ? '-mx-3 sm:-mx-4 lg:-mx-6 -mt-3 sm:-mt-4 lg:-mt-6' : ''}">
          <div class="relative overflow-hidden ${isFullWidth ? 'rounded-none border-x-0' : containerBorderClass} group ${animType.startsWith('fade') ? 'hero-anim-fade' : ''}" style="${isFullWidth ? 'border-radius: 0;' : 'border-radius: ' + heroContainerRadius + ';'} ${heroBorderBottomStyle} overflow: hidden;" id="hero-slider-container" data-anim="${animType}" data-count="${heroBanners.length}">
            <div class="${nonSplitAspectClass} relative bg-slate-900 overflow-hidden" style="${nonSplitAspectStyle}; border-radius: inherit;">
              <div class="hero-slider-track w-full h-full relative" style="border-radius: inherit;">
                ${slidesHtml}
              </div>
              ${heroShowArrows && heroBanners.length > 1 ? `
                <button type="button" class="hero-arrow-btn absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 hidden md:flex items-center justify-center z-30 ${arrowVisibilityClass} transition duration-200 pointer-events-auto backdrop-blur-sm active:scale-90 hero-shadow-${heroArrowsShadow}" id="hero-slide-prev" title="Slide Sebelumnya (&lt;)" style="background-color: ${heroArrowsBg}; color: ${heroArrowsIconColor}; border-radius: ${heroArrowsRadius};" onmouseenter="this.style.backgroundColor='${heroArrowsHoverBg}'" onmouseleave="this.style.backgroundColor='${heroArrowsBg}'"><i data-lucide="chevron-left" class="w-4 h-4 sm:w-5 sm:h-5"></i></button>
                <button type="button" class="hero-arrow-btn absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 hidden md:flex items-center justify-center z-30 ${arrowVisibilityClass} transition duration-200 pointer-events-auto backdrop-blur-sm active:scale-90 hero-shadow-${heroArrowsShadow}" id="hero-slide-next" title="Slide Berikutnya (&gt;)" style="background-color: ${heroArrowsBg}; color: ${heroArrowsIconColor}; border-radius: ${heroArrowsRadius};" onmouseenter="this.style.backgroundColor='${heroArrowsHoverBg}'" onmouseleave="this.style.backgroundColor='${heroArrowsBg}'"><i data-lucide="chevron-right" class="w-4 h-4 sm:w-5 sm:h-5"></i></button>
              ` : ''}
              <!-- Indikator Slider Dots Melayang (Absolute di atas gambar banner) -->
              ${heroBanners.length > 1 ? `
                <div class="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 pointer-events-auto">
                  ${heroBanners.map((_, i) => `<button type="button" class="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full transition-all hero-slide-dot cursor-pointer" data-index="${i}" style="background-color: ${i === 0 ? heroDotsActiveColor : heroDotsInactiveColor}; ${i === 0 ? 'transform: scale(1.25);' : ''}"></button>`).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }

    return heroSectionHtml;
  }

  // --- SECTION DIVIDER GENERATOR ---
  function renderSectionDividerHtml(settings = {}) {
    if (settings.divider_enabled === false) return '';
    const color = settings.divider_color || '#e2e8f0';
    const thickness = settings.divider_thickness || 1;
    const width = settings.divider_width || '100%';
    const marginY = settings.divider_margin_y !== undefined ? settings.divider_margin_y : 20;
    return `
      <div class="w-full flex justify-center shrink-0 my-auto" style="margin-top: ${marginY}px; margin-bottom: ${marginY}px;">
        <div style="width: ${width};">
          <hr style="border: 0; border-top: ${thickness}px solid ${color}; margin: 0; width: 100%;" />
        </div>
      </div>
    `;
  }

  // --- FEATURED PRODUCTS SECTION GENERATOR ---
  function renderFeaturedProductsSectionHtml(settings = {}, products = [], cardVariantsConfig = {}) {
    let featuredList = products.filter(p => p.is_featured === true || p.featured === true);
    if (featuredList.length === 0) {
      const sorted = [...products].sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0));
      featuredList = sorted.slice(0, 3);
    }
    if (featuredList.length === 0) return '';

    const cardsHtml = featuredList.slice(0, 3).map((prod, idx) => {
      const effDiscount = (typeof DB !== 'undefined' && DB.calculateEffectiveDiscount) 
        ? DB.calculateEffectiveDiscount(prod) 
        : (prod.effective_discount || { has_discount: false });
      const minPrice = (typeof DB !== 'undefined' && DB.getProductMinPrice) ? DB.getProductMinPrice(prod) : (prod.price || 0);
      const finalPrice = (effDiscount && effDiscount.has_discount) ? effDiscount.discounted_price : minPrice;
      const formattedPrice = (typeof DB !== 'undefined' && DB.formatRupiah) ? DB.formatRupiah(finalPrice) : `Rp ${finalPrice.toLocaleString('id-ID')}`;
      
      const badgeLabels = ['Paling Dicari', 'Best Seller', 'Prioritas Pilihan'];
      const currentBadge = badgeLabels[idx % badgeLabels.length];
      const prodImg = (prod.images && prod.images[0]) || prod.image || 'assets/images/logo-songer-creative.png';

      return `
        <div class="rounded-2xl border-2 border-amber-300/80 bg-white p-4 shadow-xs hover:shadow-md transition-all space-y-3 cursor-pointer group flex flex-col justify-between" onclick="window.location.href='product.html?id=${prod.id}'">
          <div class="space-y-3">
            <div class="w-full aspect-[16/9] rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden relative">
              <img src="${escapeHtml(prodImg)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="${escapeHtml(prod.name)}" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 text-xl font-bold\\'><i class=\\'bi bi-box-seam\\'></i></div>';" />
              <span class="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[10px] uppercase shadow-xs tracking-wider">${currentBadge}</span>
              ${effDiscount && effDiscount.has_discount ? `
                <span class="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] uppercase shadow-xs">-${effDiscount.percent}%</span>
              ` : ''}
            </div>
            <div>
              <h4 class="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition line-clamp-1 leading-snug">${escapeHtml(prod.name)}</h4>
              <p class="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">${escapeHtml(prod.description || 'Spesifikasi kustom presisi tinggi dengan jaminan kualitas warna terbaik.')}</p>
            </div>
          </div>
          <div class="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100">
            <div>
              <span class="text-[10px] text-slate-400 block">Harga Mulai</span>
              <span class="font-black text-sm text-emerald-700">${formattedPrice}</span>
            </div>
            <a href="product.html?id=${prod.id}" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition inline-flex items-center gap-1" onclick="event.stopPropagation();">
              <span>Pesan Kilat</span>
              <i class="bi bi-arrow-right text-[10px]"></i>
            </a>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div id="section-products-featured" class="space-y-3.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <h3 class="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">Produk Unggulan &amp; Prioritas</h3>
          </div>
          <span class="text-xs font-bold text-amber-600 hover:underline cursor-pointer" onclick="window.scrollTo({top: 400, behavior: 'smooth'});">Lihat Semua Unggulan &rarr;</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  // --- SPONSOR SLOT SECTION GENERATOR ---
  function renderSponsorSectionHtml(settings = {}) {
    const allSponsors = (typeof DB !== 'undefined' && DB.getSponsorList) ? (DB.getSponsorList() || []) : [];
    const activeSponsors = allSponsors.filter(s => {
      if (typeof DB !== 'undefined' && DB.isSponsorActive) return DB.isSponsorActive(s);
      return s.active !== false && s.is_active !== false;
    });

    if (activeSponsors.length >= 2) {
      const s1 = activeSponsors[0];
      const s2 = activeSponsors[1];
      return `
        <div id="section-sponsor-slot" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between shadow-sm">
            <div class="space-y-1">
              <span class="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-[10px] font-bold">Mitra Resmi Terverifikasi</span>
              <h4 class="font-black text-sm">${escapeHtml(s1.title || 'Finishing Laminasi & UV Spot HD')}</h4>
              <p class="text-[11px] text-blue-200">${escapeHtml(s1.subtitle || 'Katalog material premium dari distributor terpercaya')}</p>
            </div>
            ${s1.action_url ? `<a href="${escapeHtml(s1.action_url)}" target="_blank" class="px-3.5 py-1.5 rounded-xl bg-white text-blue-900 font-bold text-xs shadow hover:bg-blue-50 transition shrink-0 ml-3">Kunjungi</a>` : ''}
          </div>
          <div class="p-4 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between shadow-sm">
            <div class="space-y-1">
              <span class="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-bold">Garansi Hasil CMYK</span>
              <h4 class="font-black text-sm">${escapeHtml(s2.title || 'Mesin Cetak Konica Minolta 2026')}</h4>
              <p class="text-[11px] text-emerald-200">${escapeHtml(s2.subtitle || 'Presisi warna tajam hingga 2400 DPI')}</p>
            </div>
            ${s2.action_url ? `<a href="${escapeHtml(s2.action_url)}" target="_blank" class="px-3.5 py-1.5 rounded-xl bg-white text-emerald-900 font-bold text-xs shadow hover:bg-emerald-50 transition shrink-0 ml-3">Detail</a>` : ''}
          </div>
        </div>
      `;
    }

    return `
      <div id="section-sponsor-slot" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between shadow-sm">
          <div class="space-y-1">
            <span class="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-[10px] font-bold">Mitra Resmi Terverifikasi</span>
            <h4 class="font-black text-sm">Finishing Laminasi &amp; UV Spot HD</h4>
            <p class="text-[11px] text-blue-200">Katalog material premium dari distributor terpercaya</p>
          </div>
          <button type="button" class="px-3.5 py-1.5 rounded-xl bg-white text-blue-900 font-bold text-xs shadow hover:bg-blue-50 transition shrink-0 ml-3" onclick="window.scrollTo({top: 400, behavior: 'smooth'});">Kunjungi</button>
        </div>
        <div class="p-4 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between shadow-sm">
          <div class="space-y-1">
            <span class="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-bold">Garansi Hasil CMYK</span>
            <h4 class="font-black text-sm">Mesin Cetak Konica Minolta 2026</h4>
            <p class="text-[11px] text-emerald-200">Presisi warna tajam hingga 2400 DPI</p>
          </div>
          <button type="button" class="px-3.5 py-1.5 rounded-xl bg-white text-emerald-900 font-bold text-xs shadow hover:bg-emerald-50 transition shrink-0 ml-3" onclick="window.scrollTo({top: 400, behavior: 'smooth'});">Detail</button>
        </div>
      </div>
    `;
  }

  // --- PROMO CARD SECTION GENERATOR ---
  function renderPromoCardSectionHtml(settings = {}) {
    const activePromos = (typeof DB !== 'undefined' && DB.getPromoList) ? (DB.getPromoList() || []).filter(p => p.is_active === true) : [];
    if (activePromos.length > 0) {
      const promo = activePromos[0];
      return `
        <div id="section-promo-card" class="p-5 rounded-2xl bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shrink-0">
              <i class="bi bi-ticket-perforated-fill"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded-md bg-white text-rose-600 font-black text-[10px] uppercase">${escapeHtml(promo.badge || 'Flash Sale Terbatas')}</span>
                <span class="text-xs font-semibold text-rose-100 flex items-center gap-1"><i class="bi bi-clock"></i> ${escapeHtml(promo.countdown_text || 'Berakhir Hari Ini')}</span>
              </div>
              <h3 class="font-black text-base sm:text-lg mt-0.5">${escapeHtml(promo.title || 'Diskon Hingga 35% Untuk Cetak Spanduk & Stiker')}</h3>
            </div>
          </div>
          <button type="button" class="px-5 py-2.5 rounded-xl bg-white text-rose-600 font-extrabold text-xs shadow-lg hover:bg-rose-50 transition shrink-0 whitespace-nowrap" onclick="window.scrollTo({top: 500, behavior: 'smooth'});">
            ${escapeHtml(promo.cta_text || 'Klaim Diskon Sekarang')} &rarr;
          </button>
        </div>
      `;
    }

    return `
      <div id="section-promo-card" class="p-5 rounded-2xl bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
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
        <button type="button" class="px-5 py-2.5 rounded-xl bg-white text-rose-600 font-extrabold text-xs shadow-lg hover:bg-rose-50 transition shrink-0 whitespace-nowrap" onclick="window.scrollTo({top: 500, behavior: 'smooth'});">
          Klaim Diskon Sekarang &rarr;
        </button>
      </div>
    `;
  }

  // --- STATIC BANNER SECTION GENERATOR ---
  function renderStaticBannerSectionHtml(settings = {}) {
    return `
      <div id="section-static-banner" class="w-full p-4 sm:p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs border border-slate-800">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl shrink-0">
            <i class="bi bi-shield-check"></i>
          </div>
          <div>
            <h4 class="font-bold text-xs sm:text-sm">Jaminan Cetak Ulang Gratis Jika Salah Ukuran / Warna Melenceng</h4>
            <p class="text-[11px] text-slate-400">Hubungi CS kami dalam 1x24 jam setelah barang diterima di workshop.</p>
          </div>
        </div>
        <span class="px-3.5 py-1.5 rounded-xl bg-slate-800 text-emerald-400 text-xs font-bold shrink-0 border border-slate-700">Garansi 100% CMYK</span>
      </div>
    `;
  }

  // --- RENDER STOREFRONT MAIN VIEW ---

  function renderStorefront() {
    const container = document.getElementById('buyer-storefront-container');
    if (!container) return;

    const settings = DB.getSettings();
    const cardVariantsConfig = settings.card_variants_config || (DB.DEFAULT_CARD_VARIANTS_CONFIG || {});
    const allCategories = DB.getCategories();
    let allActiveProducts = DB.getProducts({ status: 'active' });

    // Filter by search
    if (activeSearchQuery.trim() !== '') {
      const q = activeSearchQuery.toLowerCase();
      allActiveProducts = allActiveProducts.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category_name && p.category_name.toLowerCase().includes(q))
      );
    }

    // Filter by quick filter tab
    if (activeQuickFilter === 'bestseller') {
      allActiveProducts.sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0));
    } else if (activeQuickFilter === 'discount') {
      allActiveProducts = allActiveProducts.filter(p => p.effective_discount && p.effective_discount.has_discount);
    }

    // Filter by main category
    if (activeMainCategoryId !== 'all') {
      allActiveProducts = allActiveProducts.filter(p => p.category_id === activeMainCategoryId);
    }

    // Filter by sub category
    if (activeSubCategoryId !== 'all') {
      allActiveProducts = allActiveProducts.filter(p => p.sub_category_id === activeSubCategoryId);
    }

    // Get subcategories of currently selected main category
    const activeSubCategories = activeMainCategoryId !== 'all' ? DB.getSubCategories(activeMainCategoryId) : [];

    // Sapaan pengunjung sudah tampil di #top-greeting-bar, hilangkan duplikasi kotak sapaan di atas Hero Banner
    let customerGreetingHtml = '';

    // --------------------------------------------------------------------------
    // REKONSTRUKSI 4 MODEL HERO SECTION ETALASE & SLIDER HALUS
    // --------------------------------------------------------------------------
    const heroSectionHtml = generateHeroSectionHtml(settings);

    // --------------------------------------------------------------------------
    // REFAKTOR NAVIGASI KATEGORI (QUICK ACTION FILTER: 3 VARIAN RESPONSIF)
    // --------------------------------------------------------------------------
    const catNavModeMobile = settings.category_nav_mode_mobile || 'icon_image';
    const catNavModeDesktop = settings.category_nav_mode_desktop || 'icon_image';

    const qfConfig = settings.quick_filter_config || {};
    const primColor = settings.primary_color || '#33b589';
    const filterAllText = qfConfig.filter_all_text || 'Semua';
    const filterBestsellerText = qfConfig.filter_bestseller_text || 'Produk Terlaris';
    const filterPromoText = qfConfig.filter_promo_text || 'Sedang Promo';

    function renderStoreCatIcon(iconName, sizeClass, color) {
      if (!iconName) iconName = 'layers';
      const biMap = {
        'shop': 'bi-shop', 'tag': 'bi-tag-fill', 'grid': 'bi-grid-fill', 'layers': 'bi-layers-fill',
        'printer': 'bi-printer-fill', 'palette': 'bi-palette-fill', 'gift': 'bi-gift-fill', 'bag': 'bi-bag-fill',
        'box': 'bi-box-seam-fill', 'shirt': 'bi-person-badge-fill', 'scissors': 'bi-scissors', 'cup': 'bi-cup-hot-fill',
        'camera': 'bi-camera-fill', 'star': 'bi-star-fill', 'heart': 'bi-heart-fill', 'percent': 'bi-percent',
        'cart': 'bi-cart-fill', 'truck': 'bi-truck', 'qr-code': 'bi-qr-code', 'badge-check': 'bi-patch-check-fill',
        'sparkles': 'bi-stars', 'tool': 'bi-tools', 'layout-grid': 'bi-grid-fill', 'flame': 'bi-fire',
        'ticket-percent': 'bi-ticket-perforated-fill', 'badge-percent': 'bi-percent'
      };
      if (biMap[iconName] || iconName.startsWith('bi-')) {
        const biClass = biMap[iconName] || iconName;
        return `<i class="bi ${biClass} ${sizeClass}" style="color: ${color};"></i>`;
      }
      return `<i data-lucide="${iconName}" class="${sizeClass}" style="color: ${color};"></i>`;
    }

    // Filter kategori etalase yang diizinkan tampil di quick action etalase
    const quickNavCategories = allCategories.filter(cat => cat.show_in_quick_nav !== false);

    // Builder 1: Mode Icon & Gambar (E-Commerce Style dengan Adaptif Alignment Desktop & Peeking Effect)
    function renderCategoryNavIconImage(isDesktopView) {
      const isAllActive = (activeQuickFilter === 'all' && activeMainCategoryId === 'all');
      const isBestsellerActive = (activeQuickFilter === 'bestseller');
      const isPromoActive = (activeQuickFilter === 'discount');
      const catCount = quickNavCategories.length;
      const totalItems = 3 + catCount;
      const isMoreThanTen = totalItems > 10;
      const trackId = isDesktopView ? 'cat-scroll-track-desktop' : 'cat-scroll-track-mobile';

      // Preferensi tampilan visual kategori (Icon vs Gambar)
      const preferIcon = (qfConfig.category_filter_model === 'icon_text' || qfConfig.category_filter_model === 'only_icon');
      const preferImage = (qfConfig.category_filter_model === 'image_text' || qfConfig.category_filter_model === 'only_image');

      // Tombol Semua (Mengalir di dalam track, tidak sticky di kiri)
      const allBtnHtml = `
        <button type="button" class="btn-quick-filter cat-item-peek flex flex-col items-center justify-start text-center group cursor-pointer transition select-none shrink-0" data-filter="all" title="${escapeHtml(filterAllText)}">
          <div class="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition group-hover:scale-105 group-hover:shadow-xs ${isAllActive ? 'ring-2' : 'border border-slate-200/80 bg-slate-100'}" style="${isAllActive ? `background-color: ${primColor}; color: #ffffff; ring-color: ${primColor};` : 'background-color: #f1f5f9; color: #475569;'}">
            <i class="bi bi-grid-fill text-lg sm:text-xl md:text-2xl"></i>
          </div>
          <span class="text-[10px] sm:text-xs font-semibold text-center line-clamp-2 mt-1.5 w-full break-words leading-tight ${isAllActive ? 'font-bold' : 'text-slate-700'}" style="${isAllActive ? `color: ${primColor};` : ''}">
            ${escapeHtml(filterAllText)}
          </span>
        </button>
      `;

      // Tombol Terlaris
      const bestBtnHtml = `
        <button type="button" class="btn-quick-filter cat-item-peek flex flex-col items-center justify-start text-center group cursor-pointer transition select-none shrink-0" data-filter="bestseller" title="${escapeHtml(filterBestsellerText)}">
          <div class="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition group-hover:scale-105 group-hover:shadow-xs ${isBestsellerActive ? 'ring-2' : 'border border-slate-200/80 bg-slate-100'}" style="${isBestsellerActive ? `background-color: ${primColor}; color: #ffffff; ring-color: ${primColor};` : 'background-color: #f1f5f9; color: #f59e0b;'}">
            <i class="bi bi-fire text-lg sm:text-xl md:text-2xl"></i>
          </div>
          <span class="text-[10px] sm:text-xs font-semibold text-center line-clamp-2 mt-1.5 w-full break-words leading-tight ${isBestsellerActive ? 'font-bold' : 'text-slate-700'}" style="${isBestsellerActive ? `color: ${primColor};` : ''}">
            ${escapeHtml(filterBestsellerText)}
          </span>
        </button>
      `;

      // Tombol Promo
      const promoBtnHtml = `
        <button type="button" class="btn-quick-filter cat-item-peek flex flex-col items-center justify-start text-center group cursor-pointer transition select-none shrink-0" data-filter="discount" title="${escapeHtml(filterPromoText)}">
          <div class="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition group-hover:scale-105 group-hover:shadow-xs ${isPromoActive ? 'ring-2' : 'border border-slate-200/80 bg-slate-100'}" style="${isPromoActive ? `background-color: ${primColor}; color: #ffffff; ring-color: ${primColor};` : 'background-color: #f1f5f9; color: #ef4444;'}">
            <i class="bi bi-ticket-perforated-fill text-lg sm:text-xl md:text-2xl"></i>
          </div>
          <span class="text-[10px] sm:text-xs font-semibold text-center line-clamp-2 mt-1.5 w-full break-words leading-tight ${isPromoActive ? 'font-bold' : 'text-slate-700'}" style="${isPromoActive ? `color: ${primColor};` : ''}">
            ${escapeHtml(filterPromoText)}
          </span>
        </button>
      `;

      // Kategori-Kategori Toko (Disaring hanya yang show_in_quick_nav !== false)
      const catsHtml = quickNavCategories.map(cat => {
        const isCatActive = (activeMainCategoryId === cat.id);
        const catImg = cat.image || '';

        let iconElement;
        if (preferIcon) {
          iconElement = renderStoreCatIcon(cat.icon || 'tag', 'text-lg sm:text-xl md:text-2xl', isCatActive ? '#ffffff' : primColor);
        } else if (catImg) {
          iconElement = `<img src="${catImg}" class="w-full h-full object-cover rounded-2xl" alt="${escapeHtml(cat.name)}" onerror="this.onerror=null; this.outerHTML='<i class=\\'bi bi-tag-fill text-lg sm:text-xl md:text-2xl\\'></i>';" />`;
        } else {
          iconElement = renderStoreCatIcon(cat.icon || 'tag', 'text-lg sm:text-xl md:text-2xl', isCatActive ? '#ffffff' : primColor);
        }

        return `
          <button type="button" class="btn-cat-filter cat-item-peek flex flex-col items-center justify-start text-center group cursor-pointer transition select-none shrink-0" data-cat="${cat.id}" title="${escapeHtml(cat.name)}">
            <div class="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center overflow-hidden transition group-hover:scale-105 group-hover:shadow-xs ${isCatActive ? 'ring-2' : 'border border-slate-200/80 bg-slate-100'}" style="${isCatActive ? `background-color: ${primColor}; color: #ffffff; ring-color: ${primColor};` : 'background-color: #f1f5f9; color: #475569;'}">
              ${iconElement}
            </div>
            <span class="text-[10px] sm:text-xs font-semibold text-center line-clamp-2 mt-1.5 w-full break-words leading-tight ${isCatActive ? 'font-bold' : 'text-slate-700'}" style="${isCatActive ? `color: ${primColor};` : ''}">
              ${escapeHtml(cat.name)}
            </span>
          </button>
        `;
      }).join('');

      let trackClasses = '';
      let showArrows = false;

      if (isDesktopView) {
        if (!isMoreThanTen) {
          trackClasses = 'cat-scroll-track flex items-start justify-center gap-2 sm:gap-2.5 lg:gap-3 py-1 scrollbar-none w-full mx-auto';
          showArrows = false;
        } else {
          trackClasses = 'cat-scroll-track flex items-start justify-start overflow-x-auto gap-2 sm:gap-2.5 lg:gap-3 py-1 scrollbar-none w-full';
          showArrows = true;
        }
      } else {
        trackClasses = 'cat-scroll-track flex items-start justify-start overflow-x-auto gap-2 sm:gap-2.5 lg:gap-3 py-1 scrollbar-none w-full';
        showArrows = false;
      }

      return `
        <div class="relative group/catnav w-full">
          ${showArrows ? `
            <button type="button" class="btn-cat-nav-prev cat-nav-hidden hidden lg:flex opacity-0 group-hover/catnav:opacity-100 transition-opacity absolute -left-3 top-8 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 shadow-md border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-white items-center justify-center cursor-pointer active:scale-95" data-target="${trackId}" title="Geser Kiri (<)" style="display: none;">
              <i class="bi bi-chevron-left text-xs"></i>
            </button>
            <button type="button" class="btn-cat-nav-next cat-nav-hidden hidden lg:flex opacity-0 group-hover/catnav:opacity-100 transition-opacity absolute -right-3 top-8 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 shadow-md border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-white items-center justify-center cursor-pointer active:scale-95" data-target="${trackId}" title="Geser Kanan (>)" style="display: none;">
              <i class="bi bi-chevron-right text-xs"></i>
            </button>
          ` : ''}

          <div id="${trackId}" class="${trackClasses}">
            ${allBtnHtml}
            ${bestBtnHtml}
            ${promoBtnHtml}
            ${catsHtml}
          </div>
        </div>
      `;
    }

    // Builder 2: Mode Pill Buttons Teks (Semua Mode Kategori Memiliki Pembungkus .relative.group/catnav & Tombol Pintar)
    function renderCategoryNavPillsText(isDesktopView) {
      const isAllActive = (activeQuickFilter === 'all' && activeMainCategoryId === 'all');
      const isBestsellerActive = (activeQuickFilter === 'bestseller');
      const isPromoActive = (activeQuickFilter === 'discount');

      const activePillStyle = `background-color: ${primColor}; color: #ffffff; border-color: ${primColor};`;
      const inactivePillStyle = `background-color: #ffffff; color: #1e293b; border-color: #e2e8f0;`;
      const trackId = isDesktopView ? 'cat-pills-track-desktop' : 'cat-pills-track-mobile';

      return `
        <div class="relative group/catnav w-full">
          ${isDesktopView ? `
            <button type="button" class="btn-cat-nav-prev cat-nav-hidden hidden lg:flex opacity-0 group-hover/catnav:opacity-100 transition-opacity absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 shadow-md border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-white items-center justify-center cursor-pointer active:scale-95" data-target="${trackId}" title="Geser Kiri (<)" style="display: none;">
              <i class="bi bi-chevron-left text-xs"></i>
            </button>
            <button type="button" class="btn-cat-nav-next cat-nav-hidden hidden lg:flex opacity-0 group-hover/catnav:opacity-100 transition-opacity absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 shadow-md border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-white items-center justify-center cursor-pointer active:scale-95" data-target="${trackId}" title="Geser Kanan (>)" style="display: none;">
              <i class="bi bi-chevron-right text-xs"></i>
            </button>
          ` : ''}

          <div id="${trackId}" class="cat-scroll-track flex items-center gap-2 overflow-x-auto py-1 scrollbar-none w-full">
            <button type="button" class="btn-quick-filter px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs border hover:brightness-95" style="${isAllActive ? activePillStyle : inactivePillStyle}" data-filter="all" title="${escapeHtml(filterAllText)}">
              <i class="bi bi-grid-fill text-xs"></i>
              <span>${escapeHtml(filterAllText)}</span>
            </button>
            <button type="button" class="btn-quick-filter px-4 py-2 rounded-full text-xs font-bold transition flex items-center shrink-0 shadow-xs border hover:brightness-95" style="${isBestsellerActive ? activePillStyle : inactivePillStyle}" data-filter="bestseller" title="${escapeHtml(filterBestsellerText)}">
              <span>${escapeHtml(filterBestsellerText)}</span>
            </button>
            <button type="button" class="btn-quick-filter px-4 py-2 rounded-full text-xs font-bold transition flex items-center shrink-0 shadow-xs border hover:brightness-95" style="${isPromoActive ? activePillStyle : inactivePillStyle}" data-filter="discount" title="${escapeHtml(filterPromoText)}">
              <span>${escapeHtml(filterPromoText)}</span>
            </button>
            ${quickNavCategories.map(cat => {
              const isCatActive = (activeMainCategoryId === cat.id);
              return `
                <button type="button" class="btn-cat-filter px-4 py-2 rounded-full text-xs font-bold transition flex items-center shrink-0 shadow-xs border hover:brightness-95" style="${isCatActive ? activePillStyle : inactivePillStyle}" data-cat="${cat.id}" title="${escapeHtml(cat.name)}">
                  <span>${escapeHtml(cat.name)}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // Builder 3: Mode Dropdown
    function renderCategoryNavDropdown(isDesktopView) {
      const isAllActive = (activeQuickFilter === 'all' && activeMainCategoryId === 'all');
      const isBestsellerActive = (activeQuickFilter === 'bestseller');
      const isPromoActive = (activeQuickFilter === 'discount');

      const selectHtml = `
        <div class="relative w-full ${isDesktopView ? 'max-w-xs' : ''}">
          <i class="bi bi-grid-fill text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs"></i>
          <select class="cat-select-dropdown w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-8 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 shadow-2xs appearance-none">
            <option value="all" ${isAllActive ? 'selected' : ''}>Semua Kategori</option>
            <option value="bestseller" ${isBestsellerActive ? 'selected' : ''}>🔥 Produk Terlaris</option>
            <option value="discount" ${isPromoActive ? 'selected' : ''}>🏷️ Sedang Promo</option>
            ${quickNavCategories.map(c => `
              <option value="cat_${c.id}" ${activeMainCategoryId === c.id ? 'selected' : ''}>
                ${escapeHtml(c.name)}
              </option>
            `).join('')}
          </select>
          <i class="bi bi-chevron-down text-slate-400 text-xs absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
        </div>
      `;

      if (isDesktopView) {
        const activePillStyle = `background-color: ${primColor}; color: #ffffff; border-color: ${primColor};`;
        const inactivePillStyle = `background-color: #ffffff; color: #1e293b; border-color: #e2e8f0;`;

        return `
          <div class="flex items-center gap-3 w-full">
            ${selectHtml}
            <div class="relative group/catnav flex-1 min-w-0">
              <button type="button" class="btn-cat-nav-prev cat-nav-hidden hidden lg:flex opacity-0 group-hover/catnav:opacity-100 transition-opacity absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/95 shadow-md border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-white items-center justify-center cursor-pointer active:scale-95" data-target="cat-dropdown-pills-track-desktop" title="Geser Kiri (<)" style="display: none;">
                <i class="bi bi-chevron-left text-xs"></i>
              </button>
              <button type="button" class="btn-cat-nav-next cat-nav-hidden hidden lg:flex opacity-0 group-hover/catnav:opacity-100 transition-opacity absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/95 shadow-md border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-white items-center justify-center cursor-pointer active:scale-95" data-target="cat-dropdown-pills-track-desktop" title="Geser Kanan (>)" style="display: none;">
                <i class="bi bi-chevron-right text-xs"></i>
              </button>
              <div id="cat-dropdown-pills-track-desktop" class="cat-scroll-track flex items-center gap-2 overflow-x-auto py-1 scrollbar-none w-full">
                <button type="button" class="btn-quick-filter px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs border hover:brightness-95" style="${isAllActive ? activePillStyle : inactivePillStyle}" data-filter="all">
                  <i class="bi bi-grid-fill text-xs"></i>
                  <span>${escapeHtml(filterAllText)}</span>
                </button>
                <button type="button" class="btn-quick-filter px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center shrink-0 shadow-xs border hover:brightness-95" style="${isBestsellerActive ? activePillStyle : inactivePillStyle}" data-filter="bestseller">
                  <span>${escapeHtml(filterBestsellerText)}</span>
                </button>
                <button type="button" class="btn-quick-filter px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center shrink-0 shadow-xs border hover:brightness-95" style="${isPromoActive ? activePillStyle : inactivePillStyle}" data-filter="discount">
                  <span>${escapeHtml(filterPromoText)}</span>
                </button>
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div class="w-full">
          ${selectHtml}
        </div>
      `;
    }

    function renderCategoryNavByMode(mode, isDesktopView) {
      if (mode === 'dropdown') return renderCategoryNavDropdown(isDesktopView);
      if (mode === 'pills_text') return renderCategoryNavPillsText(isDesktopView);
      return renderCategoryNavIconImage(isDesktopView);
    }

    // --- HTML BLOCKS SEKSI INDIVIDUAL ETALASE ---

    const categoryNavSectionHtml = `
      <div id="katalog-section" class="space-y-4">
        ${activeSearchQuery ? `
          <div class="flex items-center justify-between gap-3">
            <div class="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-1.5 rounded-xl shadow-xs">
              <span>Hasil Pencarian: "<strong>${escapeHtml(activeSearchQuery)}</strong>"</span>
              <button type="button" id="btn-clear-search-filter" class="hover:text-rose-600 font-bold ml-1 text-slate-400 hover:scale-110 transition" title="Hapus Filter Pencarian">✕</button>
            </div>
          </div>
        ` : ''}

        <!-- QUICK ACTION FILTER TRACK (BERDASARKAN PILIHAN VIEWPORT MOBILE & DESKTOP) -->
        <div id="quick-filter-container" class="w-full py-1">
          <!-- Mobile Viewport: Ditampilkan pada < lg -->
          <div class="block lg:hidden w-full">
            ${renderCategoryNavByMode(catNavModeMobile, false)}
          </div>

          <!-- Desktop Viewport: Ditampilkan pada >= lg -->
          <div class="hidden lg:block w-full">
            ${renderCategoryNavByMode(catNavModeDesktop, true)}
          </div>
        </div>

        <!-- Sub-Category Chips (If main category selected has children) -->
        ${activeSubCategories.length > 0 ? `
          <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Sub:</span>
            <button type="button" class="btn-sub-cat-chip px-3 py-1 rounded-lg text-[11px] font-medium transition shrink-0 ${activeSubCategoryId === 'all' ? 'bg-slate-800 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-id="all">
              Semua Sub
            </button>
            ${activeSubCategories.map(sub => `
              <button type="button" class="btn-sub-cat-chip px-3 py-1 rounded-lg text-[11px] font-medium transition shrink-0 ${activeSubCategoryId === sub.id ? 'bg-slate-800 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-id="${sub.id}">
                ${escapeHtml(sub.name)}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    const productsCatalogGridHtml = `
      <div id="products-catalog-section" class="space-y-4">
        ${allActiveProducts.length === 0 ? `
          <div class="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto">
            <div class="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <i data-lucide="package-search" class="w-8 h-8"></i>
            </div>
            <h3 class="font-bold text-slate-800 text-base">Tidak ada produk ditemukan</h3>
            <p class="text-xs text-slate-500 mt-1 mb-4">Coba reset filter atau ubah kata kunci pencarian Anda.</p>
            <button type="button" id="btn-reset-buyer-filters" class="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition">
              Tampilkan Semua Produk
            </button>
          </div>
        ` : `
          <!-- Responsive Grid: Mobile 2 Kolom, Tablet 4 Kolom, Desktop 6 Kolom Murni -->
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 items-stretch">
            ${renderProductGridWithBanners(allActiveProducts, cardVariantsConfig)}
          </div>
        `}
      </div>
    `;

    // SINKRONISASI DAFTAR SEKSI DINAMIS DENGAN DIVIDER
    const activeSectionsList = (Array.isArray(settings.storefront_sections) && settings.storefront_sections.length > 0)
      ? settings.storefront_sections
      : [
        { id: 'sec_hero', type: 'hero', enabled: true },
        { id: 'sec_category', type: 'category', enabled: true },
        { id: 'sec_products_standard', type: 'products_standard', enabled: true }
      ];

    const dividerHtml = renderSectionDividerHtml(settings);
    const renderedSectionBlocks = [];

    activeSectionsList.forEach(sec => {
      if (sec.enabled === false) return;
      if (sec.type === 'hero' && heroSectionHtml) {
        renderedSectionBlocks.push(heroSectionHtml);
      } else if (sec.type === 'category') {
        renderedSectionBlocks.push(categoryNavSectionHtml);
      } else if (sec.type === 'products_standard') {
        renderedSectionBlocks.push(productsCatalogGridHtml);
      } else if (sec.type === 'products_featured') {
        renderedSectionBlocks.push(renderFeaturedProductsSectionHtml(settings, allActiveProducts, cardVariantsConfig));
      } else if (sec.type === 'sponsor_slot') {
        renderedSectionBlocks.push(renderSponsorSectionHtml(settings));
      } else if (sec.type === 'promo_card') {
        renderedSectionBlocks.push(renderPromoCardSectionHtml(settings));
      } else if (sec.type === 'static_banner') {
        renderedSectionBlocks.push(renderStaticBannerSectionHtml(settings));
      }
    });

    const assembledSectionsHtml = renderedSectionBlocks.join(dividerHtml);

    container.innerHTML = `
      <div class="space-y-8 pb-20">
        <!-- Sapaan Pelanggan Dinamis (Personalized Greeting) -->
        ${customerGreetingHtml}

        <!-- Seksi-seksi Etalase Terpasang & Divider Dinamis -->
        ${assembledSectionsHtml}
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    updateCartBadge();
    initHeroSlider();
    initStoreSponsorCarousels();
    initStoreInternalSponsorCards();
    updateStoreFooter();

    // Update dinamis BreadcrumbList & Schema.org JSON-LD saat kategori/subkategori berganti (SPA Client-Side)
    if (typeof renderStoreSchemaGraph === 'function') {
      renderStoreSchemaGraph();
    }

    // Inisialisasi & pembaruan visibilitas panah kategori pintar setelah DOM selesai reflow
    requestAnimationFrame(() => {
      setTimeout(() => {
        initCategorySmartScroll();
      }, 80);
    });
  }

  // Intersperses Promotional & Sponsor Cards into Product Grid
  // Algoritma Interleaving Presisi & Auto-Layout Grid:
  // Desktop (6 Kolom): Slot 12 (Kanan), Slot 19 (Kiri), Slot 30 (Kanan), Slot 37 (Kiri), Slot 48 (Kanan)...
  // Tablet (4 Kolom): Slot 8 (Kanan), Slot 13 (Kiri), Slot 20 (Kanan), Slot 25 (Kiri), Slot 32 (Kanan)...
  // Mobile (2 Kolom): Slot 6 (Kanan), Slot 11 (Kiri), Slot 18 (Kanan), Slot 23 (Kiri), Slot 30 (Kanan)...
  // Zero-Gaps Fallback: Jika slot promo/sponsor kosong/off, fallback tipe lawan. Jika keduanya off, diisi produk.
  // Special Handling Double-Width (col-span-2):
  // - Posisi Kanan: disisipkan 1 slot lebih awal (Slot 11-12 Desktop setelah 10 produk, Slot 7-8 Tablet setelah 6 produk, Slot 5-6 Mobile setelah 4 produk).
  // - Posisi Kiri: langsung menempati 2 kolom pertama sisi kiri, dan kuota produk sebelum sisipan kanan berikutnya dikurangi 1.
  function renderProductGridWithBanners(products, cardVariantsConfig = {}) {
    let html = '';
    const settings = (typeof DB !== 'undefined' && DB.getSettings) ? DB.getSettings() : {};
    const promos = (typeof DB !== 'undefined' && DB.getPromos) ? DB.getPromos() : {};

    const varA = cardVariantsConfig.variant_a || {};
    const varB = cardVariantsConfig.variant_b || {};
    const varC = cardVariantsConfig.variant_c || {};
    const promo1 = cardVariantsConfig.promo_1 || {};
    const promo2 = cardVariantsConfig.promo_2 || {};
    const promoSponsorStyle = promos.sponsor_style || {};
    const baseSponsor1 = cardVariantsConfig.sponsor_1 || {};
    const sponsor1 = {
      ...baseSponsor1,
      ...(promoSponsorStyle.enabled ? promoSponsorStyle : {})
    };
    const sponsor2 = {
      ...(cardVariantsConfig.sponsor_2 || sponsor1),
      ...(promoSponsorStyle.enabled ? promoSponsorStyle : {})
    };

    // Saring promo aktif secara ketat dari database dengan validasi masa aktif
    const now = new Date();
    const rawPromoList = (typeof DB !== 'undefined' && DB.getPromoList) ? (DB.getPromoList() || []) : [];
    const activePromos = rawPromoList.filter(p => {
      if (p.active === false || p.is_active === false) return false;
      if (p.is_always_active === false) {
        if (p.start_datetime && p.end_datetime) {
          const s = new Date(p.start_datetime);
          const e = new Date(p.end_datetime);
          if (now < s || now > e) return false;
        }
      }
      return true;
    });

    const rawSponsorList = (typeof DB !== 'undefined' && DB.getSponsorList) ? (DB.getSponsorList() || []) : [];
    const activeSponsors = rawSponsorList.filter(s => {
      if (typeof DB !== 'undefined' && DB.isSponsorActive) {
        return DB.isSponsorActive(s, now);
      }
      return s.active !== false && s.is_active !== false;
    });

    // 1. Tentukan prioritas tipe sisipan pertama: bandingkan created_at / start_datetime paling awal
    function getEarliestTimestamp(item) {
      if (!item) return Infinity;
      const timeStr = item.start_datetime || item.created_at || item.updated_at || '';
      if (timeStr) {
        const t = new Date(timeStr).getTime();
        if (!isNaN(t)) return t;
      }
      return Infinity;
    }

    let initialPreferredType = 'promo';
    if (activePromos.length > 0 && activeSponsors.length > 0) {
      const pTime = getEarliestTimestamp(activePromos[0]);
      const sTime = getEarliestTimestamp(activeSponsors[0]);
      if (sTime < pTime) {
        initialPreferredType = 'sponsor';
      } else {
        initialPreferredType = 'promo';
      }
    } else if (activeSponsors.length > 0) {
      initialPreferredType = 'sponsor';
    } else {
      initialPreferredType = 'promo';
    }

    // Generator Kartu Promo (dengan pembobotan display_quota ketat)
    const promoGenerators = [];
    activePromos.forEach(p => {
      const quota = Math.max(1, parseInt(p.display_quota, 10) || 1);
      for (let q = 0; q < quota; q++) {
        promoGenerators.push(() => {
          const cardHtml = (p.card_model === 'variant_2')
            ? renderPromoCardVariation2(p, promo2)
            : renderPromoCardVariation1(p, promo1);
          return {
            type: 'promo',
            id: p.id,
            isDoubleWidth: false,
            html: cardHtml
          };
        });
      }
    });

    // Generator Kartu Sponsor (dengan pembobotan display_quota)
    function buildSponsorGenerators(sponsorsList) {
      const list = [];
      sponsorsList.forEach(s => {
        const quota = Math.max(1, parseInt(s.display_quota, 10) || 1);
        const isDouble = (s.type === 'double_width' || s.card_model === 'double_width');
        for (let q = 0; q < quota; q++) {
          list.push(() => {
            let cardHtml = '';
            if (isDouble) {
              cardHtml = renderSponsorDoubleWidthCard(s, s);
            } else if (s.type === 'carousel') {
              cardHtml = renderSponsorCarouselCard(s, s);
            } else if (s.type === 'internal') {
              cardHtml = renderSponsorInternalProductsCard({ sponsor_internal: s, internal_promo_title: s.title }, s);
            } else {
              cardHtml = renderSponsorAdCard(s, s);
            }
            return {
              type: 'sponsor',
              id: s.id,
              isDoubleWidth: isDouble,
              html: cardHtml
            };
          });
        }
      });
      return list;
    }

    const sponsorGeneratorsMobile = buildSponsorGenerators(activeSponsors);
    const sponsorGeneratorsDesktop = buildSponsorGenerators(activeSponsors.filter(s => !s.mobile_only_ready));

    // Factory Provider Kartu dengan Sistem Antrean Kuota Ketat (Strict Quota Consumption) & Fallback Zero-Gap
    function createBannerProvider(promoListGens, sponsorListGens, startType) {
      let promoCursor = 0;
      let sponsorCursor = 0;
      let lastInsertedType = null;

      return {
        peekNext() {
          const hasPromo = promoCursor < promoListGens.length;
          const hasSponsor = sponsorCursor < sponsorListGens.length;
          if (!hasPromo && !hasSponsor) return null;

          let targetType;
          if (lastInsertedType === null) {
            targetType = startType;
          } else if (lastInsertedType === 'promo') {
            targetType = 'sponsor';
          } else {
            targetType = 'promo';
          }

          if (targetType === 'promo') {
            if (hasPromo) return { type: 'promo', isDoubleWidth: false };
            if (hasSponsor) {
              const fn = sponsorListGens[sponsorCursor];
              const sample = fn();
              return { type: 'sponsor', isDoubleWidth: sample.isDoubleWidth };
            }
          } else {
            if (hasSponsor) {
              const fn = sponsorListGens[sponsorCursor];
              const sample = fn();
              return { type: 'sponsor', isDoubleWidth: sample.isDoubleWidth };
            }
            if (hasPromo) return { type: 'promo', isDoubleWidth: false };
          }
          return null;
        },

        getNext() {
          const hasPromo = promoCursor < promoListGens.length;
          const hasSponsor = sponsorCursor < sponsorListGens.length;
          if (!hasPromo && !hasSponsor) return null;

          let targetType;
          if (lastInsertedType === null) {
            targetType = startType;
          } else if (lastInsertedType === 'promo') {
            targetType = 'sponsor';
          } else {
            targetType = 'promo';
          }

          if (targetType === 'promo') {
            if (hasPromo) {
              const banner = promoListGens[promoCursor]();
              promoCursor++;
              lastInsertedType = 'promo';
              return banner;
            } else if (hasSponsor) {
              const banner = sponsorListGens[sponsorCursor]();
              sponsorCursor++;
              lastInsertedType = 'sponsor';
              return banner;
            }
          } else {
            if (hasSponsor) {
              const banner = sponsorListGens[sponsorCursor]();
              sponsorCursor++;
              lastInsertedType = 'sponsor';
              return banner;
            } else if (hasPromo) {
              const banner = promoListGens[promoCursor]();
              promoCursor++;
              lastInsertedType = 'promo';
              return banner;
            }
          }
          return null;
        }
      };
    }

    // Engine Simulasi Jadwal Penempatan Kartu per Viewport
    function buildViewportSchedule(cols, provider, totalProds) {
      const schedule = {};
      let prevAfterProd = 0;
      let prevSpan = 1;
      let isRight = true;

      for (let step = 0; step < 60; step++) {
        const peek = provider.peekNext();
        if (!peek) break;

        const isDouble = Boolean(peek.isDoubleWidth);
        const span = isDouble ? 2 : 1;

        let afterProd = 0;
        if (step === 0) {
          // Sisipan 1 (Posisi KANAN)
          if (cols === 6) {
            afterProd = isDouble ? 10 : 11;
          } else if (cols === 4) {
            afterProd = isDouble ? 6 : 7;
          } else if (cols === 2) {
            afterProd = isDouble ? 4 : 5;
          }
        } else if (isRight) {
          // Transisi dari KIRI ke KANAN
          if (cols === 2) {
            // Mobile: 2 baris jeda (4 produk)
            afterProd = prevAfterProd + (2 - prevSpan) + 4 + (2 - span);
          } else {
            // Desktop & Tablet:
            afterProd = prevAfterProd + (cols - prevSpan) + (cols - span);
          }
        } else {
          // Transisi dari KANAN ke KIRI
          if (cols === 2) {
            // Mobile: 2 baris jeda (4 produk)
            afterProd = prevAfterProd + 4;
          } else {
            // Desktop & Tablet: 1 baris jeda penuh produk
            afterProd = prevAfterProd + cols;
          }
        }

        if (afterProd > totalProds) break;

        const banner = provider.getNext();
        if (!banner) break;

        if (!schedule[afterProd]) {
          schedule[afterProd] = [];
        }
        schedule[afterProd].push(banner);

        prevAfterProd = afterProd;
        prevSpan = span;
        isRight = !isRight;
      }

      return schedule;
    }

    const totalProducts = products.length;
    const desktopProvider = createBannerProvider(promoGenerators, sponsorGeneratorsDesktop, initialPreferredType);
    const tabletProvider = createBannerProvider(promoGenerators, sponsorGeneratorsMobile, initialPreferredType);
    const mobileProvider = createBannerProvider(promoGenerators, sponsorGeneratorsMobile, initialPreferredType);

    const desktopSchedule = buildViewportSchedule(6, desktopProvider, totalProducts);
    const tabletSchedule = buildViewportSchedule(4, tabletProvider, totalProducts);
    const mobileSchedule = buildViewportSchedule(2, mobileProvider, totalProducts);

    products.forEach((prod, idx) => {
      const prodNum = idx + 1;

      // Render kartu produk
      const rawGlobalVer = (settings.card_product_version || 'v1').toString().toLowerCase().trim();
      let globalCardVer = 'v1';
      if (rawGlobalVer === 'v3' || rawGlobalVer === '3' || rawGlobalVer === 'c') globalCardVer = 'v3';
      else if (rawGlobalVer === 'v2' || rawGlobalVer === '2' || rawGlobalVer === 'b') globalCardVer = 'v2';
      else globalCardVer = 'v1';

      let cardVer = globalCardVer;
      if (prod.card_variant_override === true && prod.card_variant) {
        const pcv = prod.card_variant.toString().toLowerCase().trim();
        if (pcv === 'b' || pcv === 'v2' || pcv === '2') cardVer = 'v2';
        else if (pcv === 'c' || pcv === 'v3' || pcv === '3') cardVer = 'v3';
        else if (pcv === 'a' || pcv === 'v1' || pcv === '1') cardVer = 'v1';
      }

      if (cardVer === 'v2') {
        html += renderCardVariantB(prod, varB);
      } else if (cardVer === 'v3') {
        html += renderCardVariantC(prod, varC);
      } else {
        html += renderCardVariantA(prod, varA);
      }

      // Sisipan Mobile (Grid 2 Kolom)
      if (mobileSchedule[prodNum]) {
        mobileSchedule[prodNum].forEach(bannerObj => {
          const spanClass = bannerObj.isDoubleWidth ? 'col-span-2' : '';
          html += `<div class="block md:hidden ${spanClass} w-full h-full">${bannerObj.html}</div>`;
        });
      }

      // Sisipan Tablet (Grid 4 Kolom)
      if (tabletSchedule[prodNum]) {
        tabletSchedule[prodNum].forEach(bannerObj => {
          const spanClass = bannerObj.isDoubleWidth ? 'col-span-2' : '';
          html += `<div class="hidden md:block lg:hidden ${spanClass} w-full h-full">${bannerObj.html}</div>`;
        });
      }

      // Sisipan Desktop (Grid 6 Kolom)
      if (desktopSchedule[prodNum]) {
        desktopSchedule[prodNum].forEach(bannerObj => {
          const spanClass = bannerObj.isDoubleWidth ? 'col-span-2' : '';
          html += `<div class="hidden lg:block ${spanClass} w-full h-full">${bannerObj.html}</div>`;
        });
      }
    });

    return html;
  }

  // --- HELPER METRIK PENJUALAN & LABEL KHUSUS PRODUK ---
  function formatSalesCount(count, compact = false) {
    const num = parseInt(count, 10) || 0;
    const labelSuffix = compact ? 'ter' : 'terjual';
    if (num < 1000) {
      return `${num} ${labelSuffix}`;
    }
    const k = Math.floor(num / 1000);
    const isExact = (num % 1000 === 0);
    const valPrefix = isExact ? `${k}RB` : `${k}RB+`;
    return `${valPrefix} ${labelSuffix}`;
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

  function getProductCustomBadges(prod, effDiscount) {
    if (prod.show_custom_labels === false || prod.show_badge === false) {
      return [];
    }
    let labels = [];
    if (Array.isArray(prod.custom_labels) && prod.custom_labels.length > 0) {
      labels = prod.custom_labels.filter(Boolean);
    } else if (typeof prod.custom_labels === 'string' && prod.custom_labels.trim()) {
      labels = prod.custom_labels.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (labels.length === 0 && prod.show_custom_labels !== false && prod.show_badge !== false) {
      if (prod.order_category === 'Ctk') labels.push('Free Potong');
      else if (prod.order_category === 'DsN') labels.push('Free Revisi');
      else if (prod.order_category === 'DnC') labels.push('Paket Hemat');
      else labels.push('Free Sticker');

      if (prod.sales_count >= 100 || (prod.rating_avg && prod.rating_avg >= 4.9)) {
        labels.push('Paling Laris');
      } else {
        labels.push('Free Ongkir');
      }
    }

    return getSmartVisibleBadges(prod.name, labels);
  }

  // --- 1. PRODUCT CARD VARIANTS RENDERERS (WIREFRAME COMPLIANT) ---

  // CARD PRODUK VERSI 1: STANDARD SQUARE / PORTRAIT (Variasi A)
  // - Gambar: Rasio persegi 1:1 (aspect-square w-full object-cover)
  // - Badge Diskon Gambar: Pojok kanan atas overlay gambar - % [diskon] (tanpa ikon tiket)
  // - Judul Produk: Maksimal 2 baris (line-clamp-2 text-xs sm:text-sm font-semibold h-8 sm:h-9 leading-snug)
  // - Baris Fitur/Label: Rating bintang (★ 4.9) + Label Countdown (jika promo aktif) atau Label Khusus (jika diskon off)
  // - Baris Harga: Harga Coret di Atas, Harga Final + Ikon Tiket Cek di Bawah Sejajar Horizontal dengan Label Terjual
  // - Footer Tambahan: Tidak ada (clean bottom)
  function renderCardVariantA(prod, rawConfig = {}) {
    const config = (prod && prod.card_config) ? { ...rawConfig, ...prod.card_config } : rawConfig;
    const minPrice = getProductStartingPrice(prod);
    const effDiscount = prod.effective_discount || (typeof DB !== 'undefined' && DB.getProductEffectiveDiscount ? DB.getProductEffectiveDiscount(prod) : { has_discount: false });

    const bgColor = config.bg_color || '#ffffff';
    const borderColor = config.border_color || '#e2e8f0';
    const borderRadius = config.border_radius || '16px';
    const titleColor = config.title_color || '#0f172a';
    const priceColor = config.price_color || '#059669';

    const showRating = config.show_rating !== false;
    const showSales = config.show_sales_count !== false;
    const showStrike = config.show_strikethrough_price !== false;
    const showTicketIcon = config.show_ticket_icon !== false;
    const showBadge = (prod.show_badge !== false && prod.show_custom_labels !== false && config.show_badge !== false && config.show_category_badge !== false);
    const showDiscBadge = config.show_discount_badge !== false;

    // Discount badge styling on image
    const discBadgeRadius = config.discount_badge_radius || '8px';
    const discBadgeBg = config.discount_badge_bg_color || '#059669';
    const discBadgeText = config.discount_badge_text_color || '#ffffff';
    const discBadgeBorder = config.discount_badge_border_color || discBadgeBg;
    const discBadgeStyle = `background-color: ${discBadgeBg}; color: ${discBadgeText}; border: 1px solid ${discBadgeBorder}; border-radius: ${discBadgeRadius};`;

    const badgeRadius = config.badge_radius || '6px';
    const badgeTextColor = config.badge_text_color || '#047857';
    const badgeBgColor = config.badge_bg_color || '#ecfdf5';
    const badgeBorderColor = config.badge_border_color || '#a7f3d0';
    const badgeStyle = `color: ${badgeTextColor}; background-color: ${badgeBgColor}; border: 1px solid ${badgeBorderColor}; border-radius: ${badgeRadius};`;

    const customBadges = getProductCustomBadges(prod, effDiscount);

    // Evaluasi Countdown Promo Produk Spesifik (Aktor Utama menggantikan Label Khusus jika Aktif)
    const countdownInfo = (typeof DB !== 'undefined' && DB.getProductCountdownInfo) ? DB.getProductCountdownInfo(prod, effDiscount) : { is_active: false };
    const countdownRadius = config.countdown_radius || '9999px';
    const countdownBg = prod.countdown_bg_color || config.countdown_bg_color || '#059669';
    const countdownTextColor = prod.countdown_text_color || config.countdown_text_color || '#ffffff';
    const countdownIconColor = prod.countdown_icon_color || config.countdown_icon_color || countdownTextColor;
    const countdownBorder = prod.countdown_border_color || config.countdown_border_color || '#059669';
    const countdownStyle = `background-color: ${countdownBg}; color: ${countdownTextColor}; border: 1px solid ${countdownBorder}; border-radius: ${countdownRadius};`;

    const hasActiveDiscount = Boolean(effDiscount && effDiscount.has_discount);
    const effFinalPrice = hasActiveDiscount ? effDiscount.discounted_price : minPrice;
    const isNarrowPriceRow = Boolean(
      hasActiveDiscount &&
      showTicketIcon &&
      (effFinalPrice >= 1000000 || (showStrike && (effDiscount.original_price || 0) >= 1000000))
    );

    return `
      <div class="h-full flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-xs hover:shadow-lg transition-all cursor-pointer group relative" onclick="window.location.href='product.html?id=${prod.id}'" style="background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: ${borderRadius};" data-id="${prod.id}">
        <!-- Image Box (1:1 Persegi) -->
        <a href="product.html?id=${prod.id}" class="block relative w-full aspect-square bg-slate-100 overflow-hidden cursor-pointer shrink-0 rounded-t-2xl">
          ${renderProductImage(prod)}
          ${(effDiscount.has_discount && showDiscBadge) ? `
            <div class="absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 shadow-md uppercase tracking-wider flex items-center justify-center z-10 leading-none" style="${discBadgeStyle}">
              <span>- % ${effDiscount.percent}</span>
            </div>
          ` : ''}
        </a>

        <!-- Body -->
        <div class="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
          <div class="space-y-1.5">
            <!-- Judul Produk: Maksimal 2 Baris Rapih -->
            <a href="product.html?id=${prod.id}" class="block line-clamp-2 text-xs sm:text-sm font-semibold h-8 sm:h-9 leading-snug text-slate-800 group-hover:opacity-80 transition" style="${titleColor ? `color: ${titleColor};` : ''}" title="${escapeHtml(prod.name)}">
              ${escapeHtml(prod.name)}
            </a>

            <!-- Baris Fitur/Label: Rating Bintang + Label Countdown (jika aktif) atau Label Khusus -->
            <div class="flex items-center gap-1.5 pt-0.5 flex-wrap min-w-0">
              ${showRating ? `
                <span class="text-amber-500 font-bold text-[10px] sm:text-[11px] flex items-center gap-0.5 shrink-0">
                  ★ ${prod.rating_avg ? prod.rating_avg.toFixed(1) : '4.9'}
                </span>
              ` : ''}
              ${countdownInfo.is_active ? `
                <span class="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 leading-none whitespace-nowrap shadow-xs" style="${countdownStyle}" title="${escapeHtml(countdownInfo.label_full)}">
                  <i data-lucide="ticket-percent" class="w-3 h-3 shrink-0" style="color: ${countdownIconColor};"></i>
                  <span>${escapeHtml(countdownInfo.label_compact)}</span>
                </span>
              ` : (showBadge ? customBadges.map(b => `
                <span class="inline-flex items-center text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 leading-none" style="${badgeStyle}">
                  ${escapeHtml(b)}
                </span>
              `).join('') : '')}
            </div>
          </div>

          <!-- Baris Harga: Harga Coret di Atas, Harga Final + Ikon Tiket Cek di Bawah Sejajar Horizontal dengan Label Terjual -->
          <div class="pt-2 border-t border-slate-100 flex items-end justify-between gap-1.5 mt-auto">
            <div class="flex flex-col justify-end min-w-0">
              ${(effDiscount.has_discount && showStrike) ? `
                <span class="text-[10px] sm:text-[11px] line-through text-slate-400 font-normal leading-none mb-1">
                  ${formatIDR(effDiscount.original_price)}
                </span>
              ` : ''}
              <div class="flex items-center gap-1 min-w-0 leading-none">
                <span class="text-xs sm:text-sm font-extrabold whitespace-nowrap" style="color: ${priceColor};">
                  ${formatIDR(effDiscount.has_discount ? effDiscount.discounted_price : minPrice)}
                </span>
                ${(effDiscount.has_discount && showTicketIcon) ? `
                  <i data-lucide="ticket-check" class="w-3.5 h-3.5 inline shrink-0" style="color: ${priceColor};"></i>
                ` : ''}
              </div>
            </div>
            ${showSales ? `
              <div class="ml-auto shrink-0 text-right leading-none pb-0.5">
                <span class="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap hidden sm:inline">
                  ${formatSalesCount(prod.sales_count, false)}
                </span>
                <span class="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap inline sm:hidden">
                  ${formatSalesCount(prod.sales_count, isNarrowPriceRow)}
                </span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // CARD PRODUK VERSI 2: KARTU MINIMALIS 1 BARIS (Variasi B)
  // - Gambar: Rasio potrait 3:4 (aspect-[3/4] w-full object-cover rounded-t-lg)
  // - Badge Diskon Gambar: Pojok kanan atas - % [diskon] (tanpa ikon tiket)
  // - Judul Produk: 1 baris teks rapi (block truncate text-xs sm:text-sm font-semibold text-slate-800)
  // - Tanpa Countdown & Tanpa Label Khusus
  // - Metrik Eksklusif: Terjual ATAU Rating
  // - Baris Harga: Rapi & Ringkas dengan Otomasi Kepadatan Ruang
  function renderCardVariantB(prod, rawConfig = {}) {
    const config = (prod && prod.card_config) ? { ...rawConfig, ...prod.card_config } : rawConfig;
    const minPrice = getProductStartingPrice(prod);
    const effDiscount = prod.effective_discount || (typeof DB !== 'undefined' && DB.getProductEffectiveDiscount ? DB.getProductEffectiveDiscount(prod) : { has_discount: false });

    const bgColor = config.bg_color || '#ffffff';
    const borderColor = config.border_color || '#e2e8f0';
    const borderRadius = config.border_radius || '16px';
    const titleColor = config.title_color || '#0f172a';
    const priceColor = config.price_color || '#059669';

    // Model 2 Metric: Eksklusif Terjual ATAU Rating (Hanya salah satu)
    let showRating = false;
    let showSales = false;
    if (config.metric_display_mode === 'rating') {
      showRating = true;
    } else if (config.metric_display_mode === 'sales') {
      showSales = true;
    } else if (config.metric_display_mode === 'none') {
      showRating = false;
      showSales = false;
    } else {
      if (config.show_rating !== false && config.show_sales_count === false) {
        showRating = true;
      } else if (config.show_sales_count !== false) {
        showSales = true;
      } else if (config.show_rating !== false) {
        showRating = true;
      }
    }

    const showStrike = config.show_strikethrough_price !== false;
    const showTicketIcon = config.show_ticket_icon !== false;
    const showDiscBadge = config.show_discount_badge !== false;

    // Discount badge styling on image
    const discBadgeRadius = config.discount_badge_radius || '8px';
    const discBadgeBg = config.discount_badge_bg_color || '#059669';
    const discBadgeText = config.discount_badge_text_color || '#ffffff';
    const discBadgeBorder = config.discount_badge_border_color || discBadgeBg;
    const discBadgeStyle = `background-color: ${discBadgeBg}; color: ${discBadgeText}; border: 1px solid ${discBadgeBorder}; border-radius: ${discBadgeRadius};`;

    const hasActiveDiscount = Boolean(effDiscount && effDiscount.has_discount);
    const finalPrice = hasActiveDiscount ? effDiscount.discounted_price : minPrice;
    const origPrice = hasActiveDiscount ? (effDiscount.original_price || minPrice) : minPrice;

    // Smart Fit Automation
    const isExtremePrice = hasActiveDiscount && showTicketIcon && finalPrice >= 10000000;
    const isNarrowPriceRow = Boolean(
      hasActiveDiscount &&
      showTicketIcon &&
      (finalPrice >= 1000000 || (showStrike && origPrice >= 1000000))
    );

    let selectedMetricHtml = '';
    if (!isExtremePrice) {
      if (showRating) {
        selectedMetricHtml = `
          <span class="text-amber-500 font-bold text-[10px] sm:text-[11px] flex items-center gap-0.5 shrink-0 whitespace-nowrap">
            ★ ${prod.rating_avg ? prod.rating_avg.toFixed(1) : '4.9'}
          </span>
        `;
      } else if (showSales) {
        selectedMetricHtml = `
          <span class="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap text-right shrink-0">
            ${formatSalesCount(prod.sales_count, isNarrowPriceRow)}
          </span>
        `;
      }
    }

    return `
      <div class="h-full flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-xs hover:shadow-lg transition-all cursor-pointer group relative" onclick="window.location.href='product.html?id=${prod.id}'" style="background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: ${borderRadius};" data-id="${prod.id}">
        <!-- Image Box - Rasio 3:4 Portrait -->
        <a href="product.html?id=${prod.id}" class="block relative w-full aspect-[3/4] bg-slate-100 overflow-hidden cursor-pointer shrink-0 rounded-t-lg">
          ${renderProductImage(prod)}
          ${(hasActiveDiscount && showDiscBadge) ? `
            <div class="absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 shadow-md uppercase tracking-wider flex items-center justify-center z-10 leading-none" style="${discBadgeStyle}">
              <span>- % ${effDiscount.percent}</span>
            </div>
          ` : ''}
        </a>

        <!-- Body -->
        <div class="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-1.5">
          <!-- Judul Produk: 1 Baris Teks -->
          <a href="product.html?id=${prod.id}" class="block truncate text-xs sm:text-sm font-semibold text-slate-800 group-hover:opacity-80 transition leading-snug" style="${titleColor ? `color: ${titleColor};` : ''}" title="${escapeHtml(prod.name)}">
            ${escapeHtml(prod.name)}
          </a>

          <!-- Baris Harga: Normal vs Diskon -->
          ${!hasActiveDiscount ? `
            <div class="flex items-center justify-between gap-1.5 pt-1 mt-auto">
              <span class="text-xs sm:text-sm font-extrabold whitespace-nowrap" style="color: ${priceColor};">
                ${formatIDR(finalPrice)}
              </span>
              ${selectedMetricHtml}
            </div>
          ` : `
            <div class="pt-1 flex flex-col justify-end mt-auto space-y-0.5">
              ${showStrike ? `
                <span class="text-[10px] line-through text-slate-400 font-normal leading-none">
                  ${formatIDR(origPrice)}
                </span>
              ` : ''}
              <div class="flex items-center justify-between gap-1.5 leading-none">
                <div class="flex items-center gap-1 min-w-0">
                  <span class="text-xs sm:text-sm font-extrabold whitespace-nowrap" style="color: ${priceColor};">
                    ${formatIDR(finalPrice)}
                  </span>
                  ${showTicketIcon ? `
                    <i data-lucide="ticket-check" class="w-3.5 h-3.5 inline shrink-0" style="color: ${priceColor};"></i>
                  ` : ''}
                </div>
                ${selectedMetricHtml}
              </div>
            </div>
          `}
        </div>
      </div>
    `;
  }

  // CARD PRODUK VERSI 3: LEBIH PENDEK - LANDSCAPE 4:3 + DUA STRIP FOOTER (Variasi C)
  // - Karakteristik: Wadah gambar rasio lanskap 4:3 (aspect-[4/3] w-full object-cover shrink-0 relative overflow-hidden rounded-t-2xl)
  // - Badge Diskon Gambar: Pojok kanan atas - % [diskon] (tanpa ikon tiket)
  // - Judul Produk: Maksimal 2 baris (line-clamp-2 text-xs sm:text-sm font-semibold)
  // - Baris Fitur/Label: Rating bintang (★ 4.9). Label khusus disembunyikan saat diskon aktif agar rapi sesuai wireframe.
  // - Baris Harga: Harga final + Harga coret di atas (jika diskon ON) + TANPA IKON TIKET + • [x] Terjual
  // - DUA STRIP FOOTER KARTU (Full Width di Sisi Terbawah):
  //   * Footer 1 (Atas): "Proses Hanya Dalam 1Jam" (atau kustom seller)
  //   * Footer 2 (Bawah): Saat diskon on -> bilah diskon countdown (misal "% Diskon Rp1,700RB berakhir Dalam 1Jam"); Saat diskon off -> info paket (misal "- Variasi Paket Tersedia/tidak tersedia")
  //   -> Menjamin tinggi kartu selalu sama persis antara diskon off dan diskon on!
  function renderCardVariantC(prod, rawConfig = {}) {
    const config = (prod && prod.card_config) ? { ...rawConfig, ...prod.card_config } : rawConfig;
    const minPrice = getProductStartingPrice(prod);
    const effDiscount = prod.effective_discount || (typeof DB !== 'undefined' && DB.getProductEffectiveDiscount ? DB.getProductEffectiveDiscount(prod) : { has_discount: false });

    const bgColor = config.bg_color || '#ffffff';
    const borderColor = config.border_color || '#fed7aa';
    const borderRadius = config.border_radius || '16px';
    const titleColor = config.title_color || '#0f172a';
    const priceColor = config.price_color || '#059669';

    const showRating = config.show_rating !== false;
    const showSales = config.show_sales_count !== false;
    const showStrike = config.show_strikethrough_price !== false;
    const showBadge = (prod.show_badge !== false && prod.show_custom_labels !== false && config.show_badge !== false && config.show_category_badge !== false);
    const showDiscBadge = config.show_discount_badge !== false;

    // Discount badge styling on image
    const discBadgeRadius = config.discount_badge_radius || '8px';
    const discBadgeBg = config.discount_badge_bg_color || '#059669';
    const discBadgeText = config.discount_badge_text_color || '#ffffff';
    const discBadgeBorder = config.discount_badge_border_color || discBadgeBg;
    const discBadgeStyle = `background-color: ${discBadgeBg}; color: ${discBadgeText}; border: 1px solid ${discBadgeBorder}; border-radius: ${discBadgeRadius};`;

    const badgeRadius = config.badge_radius || '6px';
    const badgeTextColor = config.badge_text_color || '#047857';
    const badgeBgColor = config.badge_bg_color || '#ecfdf5';
    const badgeBorderColor = config.badge_border_color || '#a7f3d0';
    const badgeStyle = `color: ${badgeTextColor}; background-color: ${badgeBgColor}; border: 1px solid ${badgeBorderColor}; border-radius: ${badgeRadius};`;

    const customBadges = getProductCustomBadges(prod, effDiscount);

    // Evaluasi Countdown Promo Produk Spesifik
    const countdownInfo = (typeof DB !== 'undefined' && DB.getProductCountdownInfo) ? DB.getProductCountdownInfo(prod, effDiscount) : { is_active: false };
    const countdownBg = prod.countdown_bg_color || config.countdown_bg_color || '#059669';
    const countdownTextColor = prod.countdown_text_color || config.countdown_text_color || '#ffffff';
    const countdownIconColor = prod.countdown_icon_color || config.countdown_icon_color || countdownTextColor;
    const countdownBorder = prod.countdown_border_color || config.countdown_border_color || '#059669';

    // Konfigurasi Footer 1 (Strip Atas) - Utamakan custom_footer_1 per-produk
    const f1Obj = prod.custom_footer_1 || {};
    const footer1Text = f1Obj.text || prod.card_footer_text || prod.footer_badge_text || config.footer_text || 'Proses Hanya Dalam 1Jam';
    const footer1Icon = f1Obj.icon || prod.footer_badge_icon || config.footer_icon || 'truck';
    const footer1Bg = f1Obj.bg_color || prod.footer_bg_color || config.footer_bg_color || '#059669';
    const footer1TextColor = f1Obj.text_color || prod.footer_text_color || config.footer_text_color || '#ffffff';

    // Konfigurasi Footer 2 (Strip Bawah / Wadah Countdown) - Utamakan custom_footer_2 per-produk
    const f2Obj = prod.custom_footer_2 || {};
    const footer2Text = f2Obj.text || prod.card_footer_2_text || config.footer_2_text || 'Variasi Paket Tersedia/tidak tersedia';
    const footer2Icon = f2Obj.icon || prod.footer_2_badge_icon || config.footer_2_icon || 'minus';
    const footer2Bg = f2Obj.bg_color || prod.footer_2_bg_color || config.footer_2_bg_color || '#047857';
    const footer2TextColor = f2Obj.text_color || prod.footer_2_text_color || config.footer_2_text_color || '#ffffff';

    return `
      <div class="h-full flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-xs hover:shadow-lg transition-all cursor-pointer group relative" onclick="window.location.href='product.html?id=${prod.id}'" style="background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: ${borderRadius};" data-id="${prod.id}">
        <!-- Image Box - Wadah Gambar Rasio Lanskap 4:3 (Lebih Pendek) -->
        <a href="product.html?id=${prod.id}" class="block relative w-full aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer shrink-0 rounded-t-2xl">
          ${renderProductImage(prod)}
          ${(effDiscount.has_discount && showDiscBadge) ? `
            <div class="absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 shadow-md uppercase tracking-wider flex items-center justify-center z-10 leading-none" style="${discBadgeStyle}">
              <span>- % ${effDiscount.percent}</span>
            </div>
          ` : ''}
        </a>

        <!-- Body -->
        <div class="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-2">
          <div class="space-y-1">
            <!-- Judul Produk: Maksimal 2 Baris -->
            <a href="product.html?id=${prod.id}" class="block line-clamp-2 text-xs sm:text-sm font-semibold h-8 sm:h-9 leading-snug text-slate-800 group-hover:opacity-80 transition" style="${titleColor ? `color: ${titleColor};` : ''}" title="${escapeHtml(prod.name)}">
              ${escapeHtml(prod.name)}
            </a>

            <!-- Baris Fitur/Label: Rating Bintang (+ Label Khusus hanya saat diskon off) -->
            <div class="flex items-center gap-1.5 pt-0.5 flex-wrap">
              ${showRating ? `
                <span class="text-amber-500 font-bold text-[10px] sm:text-[11px] flex items-center gap-0.5">
                  ★ ${prod.rating_avg ? prod.rating_avg.toFixed(1) : '4.9'}
                </span>
              ` : ''}
              ${(!countdownInfo.is_active && showBadge) ? customBadges.map(b => `
                <span class="inline-flex items-center text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 leading-none" style="${badgeStyle}">
                  ${escapeHtml(b)}
                </span>
              `).join('') : ''}
            </div>
          </div>

          <!-- Baris Harga: Harga Coret di Atas, Harga Final di Bawah Sejajar Horizontal dengan Label Terjual (TANPA IKON TIKET) -->
          <div class="pt-2 border-t border-slate-100 flex items-end justify-between gap-1.5 mt-auto">
            <div class="flex flex-col justify-end min-w-0">
              ${(effDiscount.has_discount && showStrike) ? `
                <span class="text-[10px] sm:text-[11px] line-through text-slate-400 font-normal leading-none mb-1">
                  ${formatIDR(effDiscount.original_price)}
                </span>
              ` : ''}
              <div class="flex items-center gap-1 min-w-0 leading-none">
                <span class="text-xs sm:text-sm font-extrabold whitespace-nowrap" style="color: ${priceColor};">
                  ${formatIDR(effDiscount.has_discount ? effDiscount.discounted_price : minPrice)}
                </span>
              </div>
            </div>
            ${showSales ? `
              <div class="ml-auto shrink-0 text-right leading-none pb-0.5">
                <span class="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap">
                  ${formatSalesCount(prod.sales_count, false)}
                </span>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Dua Strip Horizontal Footer di Bagian Bawah Kartu (Tinggi Tetap Presisi Sama) -->
        <div class="w-full shrink-0 mt-auto flex flex-col">
          <!-- Footer 1 (Atas): Proses Cepat -->
          <div class="w-full text-[10px] sm:text-[11px] font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5 tracking-wide shrink-0 border-b border-black/10" style="background-color: ${footer1Bg}; color: ${footer1TextColor};">
            <i data-lucide="${escapeHtml(footer1Icon)}" class="w-3.5 h-3.5 shrink-0"></i>
            <span class="truncate">${escapeHtml(footer1Text)}</span>
          </div>

          <!-- Footer 2 (Bawah): Bilah Diskon Countdown saat Promo Aktif, atau Info Paket saat Promo Off -->
          ${countdownInfo.is_active ? `
            <div class="w-full text-[10px] sm:text-[11px] font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5 rounded-b-2xl tracking-wide shrink-0" style="background-color: ${countdownBg}; color: ${countdownTextColor};" title="${escapeHtml(countdownInfo.label_full)}">
              <i data-lucide="ticket-percent" class="w-3.5 h-3.5 shrink-0" style="color: ${countdownIconColor};"></i>
              <span class="truncate">${escapeHtml(countdownInfo.footer_label)}</span>
            </div>
          ` : `
            <div class="w-full text-[10px] sm:text-[11px] font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5 rounded-b-2xl tracking-wide shrink-0" style="background-color: ${footer2Bg}; color: ${footer2TextColor};">
              <i data-lucide="${escapeHtml(footer2Icon)}" class="w-3.5 h-3.5 shrink-0"></i>
              <span class="truncate">${escapeHtml(footer2Text)}</span>
            </div>
          `}
        </div>
      </div>
    `;
  }

  // --- 2. INTERSPERSED PROMO & SPONSOR CARDS (WIREFRAME GAMBAR 2 & 3 STANDARDIZED) ---

  // CARD PROMO VERSI GAMBAR (GAMBAR 2 - ATAS):
  // Rasio Area Gambar 3:4 (aspect-[3/4] w-full rounded-2xl object-cover overflow-hidden relative bleed to edge)
  // Sesuai Matriks: Deskripsi otomatis tampil jika 1 CTA, dan sembunyi jika 2 CTA.
  function renderPromoCardVariation1(promoOrPromos, config = {}) {
    const settings = (typeof DB !== 'undefined' && DB.getSettings) ? DB.getSettings() : {};
    let targetPromo = {};
    let isCardPaused = false;

    if (promoOrPromos && (promoOrPromos.card_model || promoOrPromos.label || promoOrPromos.id)) {
      targetPromo = promoOrPromos;
    } else {
      const collision = (typeof DB !== 'undefined' && DB.resolvePromoCollision) ? DB.resolvePromoCollision(promoOrPromos) : { activePromo: promoOrPromos?.twin_date, isPaused: false };
      targetPromo = collision.activePromo || promoOrPromos?.twin_date || {};
      if (targetPromo.card_model === 'variant_2' && collision.pausedPromo) {
        targetPromo = collision.pausedPromo;
        isCardPaused = true;
      } else if (collision.isPaused && collision.pausedPromo && collision.pausedPromo.id === targetPromo.id) {
        isCardPaused = true;
      }
    }

    // Preferensi Styling Mandiri Individual (promo.style)
    const pStyle = targetPromo.style || {};
    const promoImg = targetPromo.image_url || targetPromo.banner_image || config.image_url || '';
    const borderColor = pStyle.border_color || config.border_color || 'transparent';
    const borderRadius = pStyle.border_radius || targetPromo.border_radius || config.border_radius || '16px';
    const boxShadowClass = pStyle.box_shadow ? `shadow-${pStyle.box_shadow}` : 'shadow-xs hover:shadow-xl';

    // 2. OTOMASI COUNTDOWN (TOP BAR VS CARD PROMO):
    // Jika CD Top Bar aktif (true), maka Countdown di Card Promo otomatis DIPAKSA FALSE (mencegah duplikasi).
    // Jika CD Top Bar nonaktif (false), status CD mengikuti targetPromo.show_timer individual.
    const isTopBarCDActive = (settings.topbar_show_countdown !== false && settings.enable_promo_countdown !== false && settings.show_promo_countdown !== false);
    const isCD = isTopBarCDActive ? false : (targetPromo.show_timer !== false);

    // Mode CTA: 'dual' / '2_cta' (2 CTA) vs 'single' / '1_cta' / 'catalog_only' / 'consultation_only' (1 CTA)
    const ctaMode = targetPromo.cta_mode || 'dual';
    const isDualCTA = (ctaMode === 'dual' || ctaMode === '2_cta');

    // 3.A. MATRIKS VISIBILITAS DESKRIPSI:
    // Kondisi 1: CD = False & 2 CTA = True  --> Deskripsi = FALSE
    // Kondisi 2: CD = False & 1 CTA = True  --> Deskripsi = TRUE
    // Kondisi 3: CD = True  & 2 CTA = True  --> Deskripsi = FALSE
    // Kondisi 4: CD = True  & 1 CTA = True  --> Deskripsi = TRUE
    let showDescription = false;
    if (!isCD && isDualCTA) showDescription = false;
    else if (!isCD && !isDualCTA) showDescription = true;
    else if (isCD && isDualCTA) showDescription = false;
    else if (isCD && !isDualCTA) showDescription = true;

    // Background styling calculation
    const bgType = pStyle.bg_type || targetPromo.bg_type || 'solid';
    const bgColor1 = pStyle.bg_color1 || targetPromo.bg_color1 || config.bg_color || '#ffffff';
    const bgColor2 = pStyle.bg_color2 || targetPromo.bg_color2 || '#f8fafc';
    const bgAngle = (pStyle.bg_angle !== undefined) ? pStyle.bg_angle : (targetPromo.bg_angle !== undefined ? targetPromo.bg_angle : 135);
    let bgCss = `background-color: ${bgColor1};`;
    if (bgType === 'linear_gradient') {
      bgCss = `background: linear-gradient(${bgAngle}deg, ${bgColor1} 0%, ${bgColor2} 100%);`;
    } else if (bgType === 'radial_gradient') {
      bgCss = `background: radial-gradient(circle at center, ${bgColor1} 0%, ${bgColor2} 100%);`;
    }

    let discText = '';
    if (targetPromo.discount_type === 'nominal') {
      discText = `POTONGAN Rp${Math.round(targetPromo.discount_value || 0).toLocaleString('id-ID')}`;
    } else {
      discText = `HEMAT ${targetPromo.discount_value || 15}%`;
    }

    const badgeLabel = isCardPaused ? 'SEGERA HADIR' : discText;
    const badgeBg = isCardPaused ? 'bg-amber-600' : 'bg-rose-600';
    const timerStatusText = isCardPaused ? 'Segera Hadir:' : 'Berakhir Dalam:';
    const timerTextColor = isCardPaused ? 'text-amber-300' : 'text-emerald-300';
    const timerIconColor = isCardPaused ? 'text-amber-400' : 'text-emerald-400';

    const imgContainer = promoImg ? `
      <img src="${promoImg}" class="w-full h-full object-cover transition duration-500 group-hover:scale-105" alt="${escapeHtml(targetPromo.label || 'Promo')}" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2\\'><i class=\\'bi bi-images\\'></i></div>';" />
    ` : `
      <div class="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2"><i class="bi bi-images text-2xl"></i></div>
    `;

    const phone = (settings.store_phone || '0888-5844-380').replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const defaultWaUrl = `https://wa.me/${cleanPhone || '628885844380'}?text=${encodeURIComponent('Halo Songer Creative, saya ingin tanya info promo: ' + (targetPromo.label || targetPromo.name || 'Promo Spesial'))}`;

    const cta1Text = targetPromo.cta1_text || 'Ingatkan Saya';
    const cta1Link = targetPromo.cta1_link || '';
    const cta2Text = targetPromo.cta2_text || 'Tanya Admin';
    const cta2Link = targetPromo.cta2_link || defaultWaUrl;

    const cta1Btn = cta1Link ? `
      <a href="${escapeHtml(cta1Link)}" target="_blank" class="w-full py-1.5 sm:py-2 px-2.5 rounded-xl text-[10px] sm:text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-xs hover:brightness-95 bg-slate-900 text-white cursor-pointer">
        <i class="bi bi-bell-fill text-xs shrink-0 text-amber-300"></i>
        <span class="truncate">${escapeHtml(cta1Text)}</span>
      </a>
    ` : `
      <button type="button" class="btn-remind-promo w-full py-1.5 sm:py-2 px-2.5 rounded-xl text-[10px] sm:text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-xs hover:brightness-95 bg-slate-900 text-white cursor-pointer" data-promo="${escapeHtml(targetPromo.label || targetPromo.name || 'Promo Spesial')}">
        <i class="bi bi-bell-fill text-xs shrink-0 text-amber-300"></i>
        <span class="truncate">${escapeHtml(cta1Text)}</span>
      </button>
    `;

    const cta2Btn = `
      <a href="${escapeHtml(cta2Link)}" target="_blank" class="w-full py-1.5 sm:py-2 px-2.5 rounded-xl text-[10px] sm:text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-sm hover:brightness-105 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer">
        <i class="bi bi-whatsapp text-xs shrink-0"></i>
        <span class="truncate">${escapeHtml(cta2Text)}</span>
      </a>
    `;

    // 3.B. Pembersihan Garis & Tombol CTA Fleksibel
    let ctaSectionHtml = '';
    if (isDualCTA) {
      ctaSectionHtml = `
        <div class="mt-auto pt-2 flex flex-col gap-1.5">
          ${cta1Btn}
          ${cta2Btn}
        </div>
      `;
    } else {
      const singleBtn = (ctaMode === 'consultation_only' || ctaMode === 'whatsapp_only') ? cta2Btn : (cta1Link || cta1Text ? cta1Btn : cta2Btn);
      ctaSectionHtml = `
        <div class="mt-auto pt-2 flex flex-col gap-1.5">
          ${singleBtn}
        </div>
      `;
    }

    return `
      <div class="h-full flex flex-col justify-between overflow-hidden rounded-2xl border ${boxShadowClass} transition-all duration-300 group relative bg-white" style="border-color: ${borderColor}; border-radius: ${borderRadius}; ${bgCss}">
        <!-- Area Gambar Rasio 3:4 Bleed to Edge -->
        <div class="relative w-full aspect-[3/4] overflow-hidden bg-slate-100 shrink-0 block">
          ${imgContainer}
          <!-- Badge Diskon Melayang di Sudut Atas Kiri -->
          <span class="absolute top-2.5 left-2.5 ${badgeBg} text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-lg shadow-md uppercase tracking-wider z-10">
            ${badgeLabel}
          </span>
          <!-- Badge Timer Melayang di Bagian Bawah Gambar (Jika Varian CD) -->
          ${isCD ? `
            <div class="absolute bottom-2.5 left-2.5 right-2.5 inline-flex items-center justify-center gap-1.5 px-2 py-1 rounded-xl bg-black/75 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold shadow-md z-10">
              <i data-lucide="clock" class="w-3 h-3 ${timerIconColor} shrink-0"></i>
              <span class="text-slate-300 font-medium hidden sm:inline">${timerStatusText}</span>
              <span class="font-mono ${timerTextColor} interspersed-timer-val">23j : 59m : 59d</span>
            </div>
          ` : ''}
        </div>

        <!-- Area Bawah: Deskripsi (Jika 1 CTA sesuai matriks) + Tombol CTA Bersih Tanpa Border Divider -->
        <div class="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
          ${showDescription && targetPromo.description ? `
            <p class="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-2">
              ${escapeHtml(targetPromo.description)}
            </p>
          ` : ''}
          ${ctaSectionHtml}
        </div>
      </div>
    `;
  }

  // CARD PROMO VERSI NON-GAMBAR / TEKS (GAMBAR 2 - BAWAH):
  // Background solid/gradient berbingkai rapi tanpa garis pembatas dalam kartu
  function renderPromoCardVariation2(promoOrPromos, config = {}) {
    const settings = (typeof DB !== 'undefined' && DB.getSettings) ? DB.getSettings() : {};
    let targetPromo = {};
    let isCardPaused = false;

    if (promoOrPromos && (promoOrPromos.card_model || promoOrPromos.label || promoOrPromos.id)) {
      targetPromo = promoOrPromos;
    } else {
      const collision = (typeof DB !== 'undefined' && DB.resolvePromoCollision) ? DB.resolvePromoCollision(promoOrPromos) : { activePromo: promoOrPromos?.special, isPaused: false };
      targetPromo = collision.activePromo || promoOrPromos?.special || {};
      if (collision.isPaused && collision.pausedPromo) {
        if (targetPromo.card_model === 'variant_1') {
          targetPromo = collision.pausedPromo;
          isCardPaused = true;
        }
      }
    }

    // Preferensi Styling Mandiri Individual (promo.style)
    const pStyle = targetPromo.style || {};
    const borderColor = pStyle.border_color || config.border_color || 'transparent';
    const borderRadius = pStyle.border_radius || targetPromo.border_radius || config.border_radius || '16px';
    const titleColor = pStyle.title_color || targetPromo.title_color || config.title_color || '#ffffff';
    const descColor = pStyle.desc_color || targetPromo.desc_color || '#cbd5e1';
    const priceColor = pStyle.discount_color || targetPromo.discount_color || config.price_color || '#f59e0b';
    const boxShadowClass = pStyle.box_shadow ? `shadow-${pStyle.box_shadow}` : 'shadow-lg hover:shadow-2xl';

    // 2. OTOMASI COUNTDOWN (TOP BAR VS CARD PROMO):
    // Jika CD Top Bar aktif (true), maka Countdown di Card Promo otomatis DIPAKSA FALSE (mencegah duplikasi).
    // Jika CD Top Bar nonaktif (false), status CD mengikuti targetPromo.show_timer individual.
    const isTopBarCDActive = (settings.topbar_show_countdown !== false && settings.enable_promo_countdown !== false && settings.show_promo_countdown !== false);
    const isCD = isTopBarCDActive ? false : (targetPromo.show_timer !== false);

    // Mode CTA: 'dual' / '2_cta' (2 CTA) vs 'single' / '1_cta' (1 CTA)
    const ctaMode = targetPromo.cta_mode || 'dual';
    const isDualCTA = (ctaMode === 'dual' || ctaMode === '2_cta');

    // 3.A. MATRIKS VISIBILITAS DESKRIPSI:
    // Kondisi 1: CD = False & 2 CTA = True  --> Deskripsi = FALSE
    // Kondisi 2: CD = False & 1 CTA = True  --> Deskripsi = TRUE
    // Kondisi 3: CD = True  & 2 CTA = True  --> Deskripsi = FALSE
    // Kondisi 4: CD = True  & 1 CTA = True  --> Deskripsi = TRUE
    let showDescription = false;
    if (!isCD && isDualCTA) showDescription = false;
    else if (!isCD && !isDualCTA) showDescription = true;
    else if (isCD && isDualCTA) showDescription = false;
    else if (isCD && !isDualCTA) showDescription = true;

    // Background calculation
    const bgType = pStyle.bg_type || targetPromo.bg_type || 'linear_gradient';
    const bgColor1 = pStyle.bg_color1 || targetPromo.bg_color1 || config.bg_color || '#0f172a';
    const bgColor2 = pStyle.bg_color2 || targetPromo.bg_color2 || '#1e293b';
    const bgAngle = (pStyle.bg_angle !== undefined) ? pStyle.bg_angle : (targetPromo.bg_angle !== undefined ? targetPromo.bg_angle : 135);
    let bgCss = `background-color: ${bgColor1};`;
    if (bgType === 'linear_gradient') {
      bgCss = `background: linear-gradient(${bgAngle}deg, ${bgColor1} 0%, ${bgColor2} 100%);`;
    } else if (bgType === 'radial_gradient') {
      bgCss = `background: radial-gradient(circle at center, ${bgColor1} 0%, ${bgColor2} 100%);`;
    }

    const timerStatusText = isCardPaused ? 'Segera Hadir' : 'Berakhir Dalam:';

    const phone = (settings.store_phone || '0888-5844-380').replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const defaultWaUrl = `https://wa.me/${cleanPhone || '628885844380'}?text=${encodeURIComponent('Halo Songer Creative, saya ingin tanya info promo: ' + (targetPromo.label || targetPromo.name || 'Promo Spesial'))}`;

    const cta1Text = targetPromo.cta1_text || 'Ingatkan Saya';
    const cta1Link = targetPromo.cta1_link || '';
    const cta2Text = targetPromo.cta2_text || 'Konsultasi Desain & Cetak';
    const cta2Link = targetPromo.cta2_link || defaultWaUrl;

    const cta1Btn = cta1Link ? `
      <a href="${escapeHtml(cta1Link)}" target="_blank" class="w-full py-1.5 sm:py-2 px-2.5 rounded-xl text-[10px] sm:text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-xs bg-slate-900/80 hover:bg-slate-900 text-white cursor-pointer">
        <i class="bi bi-bell-fill text-xs shrink-0 text-amber-300"></i>
        <span class="truncate">${escapeHtml(cta1Text)}</span>
      </a>
    ` : `
      <button type="button" class="btn-remind-promo w-full py-1.5 sm:py-2 px-2.5 rounded-xl text-[10px] sm:text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-xs bg-slate-900/80 hover:bg-slate-900 text-white cursor-pointer" data-promo="${escapeHtml(targetPromo.label || targetPromo.name || 'Promo Spesial')}">
        <i class="bi bi-bell-fill text-xs shrink-0 text-amber-300"></i>
        <span class="truncate">${escapeHtml(cta1Text)}</span>
      </button>
    `;

    const cta2Btn = `
      <a href="${escapeHtml(cta2Link)}" target="_blank" class="w-full py-1.5 sm:py-2 px-2.5 rounded-xl text-[10px] sm:text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer">
        <i class="bi bi-whatsapp text-xs shrink-0"></i>
        <span class="truncate">${escapeHtml(cta2Text)}</span>
      </a>
    `;

    // 3.B. Pembersihan Garis Pembatas: TANPA border-t pemisah agar kartu menyatu, bersih, dan modern
    const ctaSectionHtml = isDualCTA ? `
      <div class="relative z-10 mt-auto pt-2.5 flex flex-col gap-1.5">
        ${cta1Btn}
        ${cta2Btn}
      </div>
    ` : `
      <div class="relative z-10 mt-auto pt-2.5 flex flex-col gap-1.5">
        ${(ctaMode === 'consultation_only' || ctaMode === 'whatsapp_only') ? cta2Btn : (cta1Link || cta1Text ? cta1Btn : cta2Btn)}
      </div>
    `;

    // Title Baris 1 & Sub-Judul Baris 2 Parsing
    const line1 = (targetPromo.title_line1 || (targetPromo.label ? targetPromo.label.split(/\s+/)[0] : 'PROMO')).trim();
    const line2 = (targetPromo.title_line2 || (targetPromo.label ? targetPromo.label.split(/\s+/).slice(1).join(' ') : 'BULAN OKTOBER')).trim();

    const hasDiscount = Boolean(targetPromo.discount_value && Number(targetPromo.discount_value) > 0);
    const discountHtml = hasDiscount ? `
      <div class="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-md" style="color: ${priceColor};">
        UPTO ${targetPromo.discount_value}%
      </div>
    ` : '';

    const pausedBadge = isCardPaused ? `
      <span class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border text-amber-400 bg-amber-950/60 border-amber-500/30">
        SEGERA HADIR
      </span>
    ` : '';

    let bodyContent = '';

    if (isCD) {
      bodyContent = `
        <div class="space-y-0.5">
          ${pausedBadge}
          <span class="text-[10px] font-black uppercase tracking-widest text-slate-300 block">
            ${escapeHtml(line1)}
          </span>
          <h4 class="font-extrabold text-sm sm:text-base text-white line-clamp-1 leading-tight" style="color: ${titleColor};">
            ${escapeHtml(line2)}
          </h4>
        </div>

        <div class="my-auto py-2">
          ${discountHtml}
          ${showDescription ? `
            <p class="text-[10px] sm:text-[11px] line-clamp-2 mt-1 leading-relaxed" style="color: ${descColor};">
              ${escapeHtml(targetPromo.description || 'Potongan harga berlaku untuk produk pilihan.')}
            </p>
          ` : ''}
        </div>

        <div class="p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-between text-[10px] font-mono ${isCardPaused ? 'text-amber-300' : 'text-emerald-300'}">
          <div class="flex items-center gap-1.5">
            <i data-lucide="clock" class="w-3.5 h-3.5 ${isCardPaused ? 'text-amber-400' : 'text-emerald-400'}"></i>
            <span class="text-slate-300 text-[10px] font-sans">${timerStatusText}</span>
          </div>
          <span class="interspersed-timer-val font-bold">23j : 59m : 59d</span>
        </div>
      `;
    } else {
      bodyContent = `
        <div class="space-y-0.5">
          <span class="text-[10px] font-black uppercase tracking-widest text-slate-300 block">
            ${escapeHtml(line1)}
          </span>
          <h4 class="font-extrabold text-sm sm:text-base text-white line-clamp-1 leading-tight" style="color: ${titleColor};">
            ${escapeHtml(line2)}
          </h4>
        </div>

        <div class="my-auto py-2">
          ${discountHtml}
          ${showDescription ? `
            <p class="text-[10px] sm:text-[11px] line-clamp-4 mt-2 leading-relaxed" style="color: ${descColor};">
              ${escapeHtml(targetPromo.description || 'Hemat hingga potongan maksimal untuk semua transaksi cetak dan desain pilihan di seluruh etalase toko.')}
            </p>
          ` : ''}
        </div>
      `;
    }

    return `
      <div class="h-full flex flex-col justify-between p-3.5 sm:p-4 overflow-hidden rounded-2xl border ${boxShadowClass} relative text-white group transition" style="${bgCss} border-color: ${borderColor}; border-radius: ${borderRadius};">
        <div class="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none"></div>
        <div class="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-amber-500/10 blur-xl pointer-events-none"></div>

        <div class="relative z-10 flex-1 flex flex-col justify-between">
          ${bodyContent}
        </div>

        ${ctaSectionHtml}
      </div>
    `;
  }

  // CARD SPONSOR SESUAI WIREFRAME (GAMBAR 1):
  // 1. Sponsor Statis 1 Image Non-Judul & Non-Deskripsi:
  //    Gambar rasio 3:4 Portrait (tinggi ~75% card sponsor) dengan badge SPONSOR.
  //    Di bagian bawah: 2 tombol aksi stacked [(Icon External Link) "Lihat Tawaran"] dan [(Icon WA) "Pasang Iklan"].
  function renderSponsorAdCard(ad = {}, config = {}) {
    const bgColor = (ad.bg_color !== undefined && ad.bg_color !== '') ? ad.bg_color : ((config.bg_color !== undefined && config.bg_color !== '') ? config.bg_color : 'transparent');
    const borderColor = ad.border_color || config.border_color || '#e2e8f0';
    const borderWidth = ad.border_width || config.border_width || '1px';
    const borderRadius = ad.border_radius || config.border_radius || '16px';
    const shadowPreset = ad.shadow || config.shadow || 'sm';
    const shadowClass = shadowPreset === 'none' ? 'sponsor-shadow-none' : `sponsor-shadow-${shadowPreset}`;
    const shadowStyle = shadowPreset === 'none' ? 'box-shadow: none !important;' : '';
    const animType = ad.animation || config.animation || 'none';
    const animClass = animType === 'fade' ? 'sponsor-anim-fade' : (animType === 'slide' ? 'sponsor-anim-slide' : (animType === 'zoom' ? 'sponsor-anim-zoom' : ''));

    const settings = (typeof DB !== 'undefined' && DB.getSettings) ? DB.getSettings() : {};
    const isInternalProduct = Boolean(ad.linked_product_id || ad.target_product_id);
    const prodTargetUrl = isInternalProduct ? `product.html?id=${ad.linked_product_id || ad.target_product_id}` : '';
    const targetUrl = ad.cta_target || prodTargetUrl || ad.link_url || 'https://songercreative.com';
    const targetAttr = (targetUrl && targetUrl.startsWith('product.html')) ? '' : 'target="_blank"';
    const primaryCtaLabel = ad.cta_label || (isInternalProduct ? 'Beli Sekarang' : 'Lihat Tawaran');
    const primaryCtaIcon = isInternalProduct ? 'bi-cart-fill' : 'bi-box-arrow-up-right';

    const phone = (settings.store_phone || '0888-5844-380').replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const sponsorWaUrl = `https://wa.me/${cleanPhone || '628885844380'}?text=${encodeURIComponent('Halo Admin Songer Creative, saya ingin pasang iklan sponsor di etalase toko.')}`;

    const imgContainer = ad.image_url ? `
      <img src="${ad.image_url}" class="aspect-[3/4] w-full h-full object-cover rounded-[inherit] group-hover:scale-105 transition duration-500" alt="Iklan Sponsor" onerror="this.onerror=null; this.outerHTML='<div class=\\'aspect-[3/4] w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-center p-3 rounded-[inherit]\\'><i class=\\'bi bi-badge-ad text-3xl mb-1 text-slate-300\\'></i><span class=\\'text-[10px] font-bold text-slate-400\\'>SPACE IKLAN AVAILABLE</span></div>';" />
    ` : `
      <div class="aspect-[3/4] w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-center p-3 rounded-[inherit]">
        <i class="bi bi-badge-ad text-3xl mb-1 text-slate-300"></i>
        <span class="text-[10px] font-bold text-slate-400">SPACE IKLAN AVAILABLE</span>
      </div>
    `;

    return `
      <!-- CARD SPONSOR VERSI 1 GAMBAR DENGAN 2 CTA (RASIO 3:4 PORTRAIT MURNI) -->
      <div class="h-full flex flex-col justify-between overflow-hidden transition-all duration-300 group relative ${shadowClass} ${animClass}" style="background-color: ${bgColor}; border: ${borderWidth} solid ${borderColor}; border-radius: ${borderRadius}; ${shadowStyle}" data-id="${ad.id || 'sponsor'}">
        <!-- Area Gambar Rasio 3:4 Portrait Murni -->
        <a href="${escapeHtml(targetUrl)}" ${targetAttr} class="relative w-full aspect-[3/4] bg-slate-100 overflow-hidden block shrink-0 cursor-pointer" style="border-top-left-radius: inherit; border-top-right-radius: inherit;" title="Buka Tawaran Sponsor">
          ${imgContainer}
          <div class="absolute inset-0 bg-black/10 group-hover:bg-transparent transition duration-300 pointer-events-none"></div>
          <span class="absolute top-2.5 left-2.5 bg-slate-900/85 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm z-10">
            SPONSOR
          </span>
        </a>

        <!-- Bagian Bawah: 2 Tombol Aksi Stacked Vertikal Sesuai Wireframe -->
        <div class="p-2 sm:p-2.5 flex-1 flex flex-col justify-end gap-1.5 mt-auto">
          <!-- Tombol 1: (Icon External Link atau Cart) Lihat Tawaran / Beli Sekarang -->
          <a href="${escapeHtml(targetUrl)}" ${targetAttr} class="w-full py-1.5 sm:py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] sm:text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-xs hover:brightness-110">
            <i class="${primaryCtaIcon} text-xs"></i>
            <span class="truncate">${escapeHtml(primaryCtaLabel)}</span>
          </a>
          <!-- Tombol 2: (Icon WA) Pasang Iklan -->
          <a href="${sponsorWaUrl}" target="_blank" class="w-full py-1.5 sm:py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] sm:text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-sm hover:brightness-110">
            <i class="bi bi-whatsapp text-xs"></i>
            <span class="truncate">Pasang Iklan</span>
          </a>
        </div>
      </div>
    `;
  }

  // 2. Sponsor Carousel Multi-Image (Maksimal 5 Foto):
  //    FULL IMG tanpa judul & deskripsi, TANPA TOMBOL CTA DI BAWAH.
  //    Tinggi serasi dan proporsional dengan kartu produk dalam baris yang sama.
  //    Dilengkapi dots navigasi dinamis: 1 slide = tanpa dots, 2-5 slide = 2-5 dots.
  function renderSponsorCarouselCard(carousel = {}, config = {}) {
    const bgColor = (carousel.bg_color !== undefined && carousel.bg_color !== '') ? carousel.bg_color : ((config.bg_color !== undefined && config.bg_color !== '') ? config.bg_color : 'transparent');
    const bgStyle = (bgColor && bgColor !== 'transparent') ? `background-color: ${bgColor};` : '';
    const borderColor = carousel.border_color || config.border_color || '#e2e8f0';
    const borderWidth = carousel.border_width || config.border_width || '1px';
    const borderRadius = carousel.border_radius || config.border_radius || '16px';
    const shadowPreset = carousel.shadow || config.shadow || 'sm';
    const shadowClass = shadowPreset === 'none' ? 'sponsor-shadow-none' : `sponsor-shadow-${shadowPreset}`;
    const shadowStyle = shadowPreset === 'none' ? 'box-shadow: none !important;' : '';
    const animTypeCard = carousel.animation || config.animation || 'none';
    const animClass = animTypeCard === 'fade' ? 'sponsor-anim-fade' : (animTypeCard === 'slide' ? 'sponsor-anim-slide' : (animTypeCard === 'zoom' ? 'sponsor-anim-zoom' : ''));

    const settings = (typeof DB !== 'undefined' && DB.getSettings) ? DB.getSettings() : {};
    const slides = Array.isArray(carousel.slides) ? carousel.slides.slice(0, 5) : [];
    const animType = carousel.animation_type || 'slide';
    const intervalTime = carousel.auto_slide_interval || 3500;

    const phone = (settings.store_phone || '0888-5844-380').replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const sponsorWaUrl = `https://wa.me/${cleanPhone || '628885844380'}?text=${encodeURIComponent('Halo Admin Songer Creative, saya ingin booking slot iklan sponsor carousel di etalase toko.')}`;

    const sliderId = 'sponsor-carousel-' + Math.random().toString(36).substring(2, 9);

    if (slides.length === 0) {
      return `
        <div class="h-full w-full flex flex-col justify-between overflow-hidden transition-all duration-300 group relative ${shadowClass} ${animClass}" style="${bgStyle} border: ${borderWidth} solid ${borderColor}; border-radius: ${borderRadius}; ${shadowStyle}">
          <!-- Area Placeholder Penuh (FULL IMG TANPA CTA) -->
          <a href="${sponsorWaUrl}" target="_blank" class="relative w-full h-full flex-1 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white cursor-pointer group" style="border-radius: inherit;">
            <span class="absolute top-2.5 left-2.5 bg-slate-900/85 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm z-10">
              SPONSOR
            </span>
            <div class="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-3 text-amber-400 group-hover:scale-110 transition duration-300">
              <i class="bi bi-badge-ad text-3xl"></i>
            </div>
            <span class="text-xs font-black tracking-widest text-white uppercase mb-1">SPACE IKLAN AVAILABLE</span>
            <p class="text-[11px] text-slate-300 max-w-[200px] leading-relaxed">Pasang banner sponsor carousel hingga 5 foto produk/brand bisnis Anda di sini.</p>
            <div class="mt-4 px-3 py-1.5 rounded-xl bg-emerald-600/90 text-white text-[10px] font-bold flex items-center gap-1.5 shadow-sm">
              <i class="bi bi-whatsapp"></i> Hubungi Pasang Iklan
            </div>
          </a>
        </div>
      `;
    }

    const slideCount = slides.length;
    const showDots = slideCount > 1;

    let slidesHtml = '';
    if (animType === 'fade' || animType === 'scale') {
      slidesHtml = slides.map((slide, idx) => `
        <div class="carousel-slide-item absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${idx === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}" data-slide="${idx}" style="border-radius: inherit;">
          <a href="${escapeHtml(slide.target_url || sponsorWaUrl)}" ${slide.target_url ? 'target="_blank"' : ''} class="w-full h-full block relative" title="Sponsor ${idx + 1}" style="border-radius: inherit;">
            <img src="${escapeHtml(slide.image_url)}" alt="Sponsor ${idx + 1}" class="w-full h-full object-cover group-hover:scale-105 transition duration-700" style="border-radius: inherit;" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-300 p-3\\'><i class=\\'bi bi-badge-ad text-3xl mb-1\\'></i><span class=\\'text-[10px] font-bold\\'>SPACE IKLAN AVAILABLE</span></div>';" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 group-hover:opacity-60 transition duration-300" style="border-radius: inherit;"></div>
          </a>
        </div>
      `).join('');
    } else {
      // Default: 'slide' horizontal
      slidesHtml = `
        <div class="slides-track flex w-full h-full transition-transform duration-500 ease-in-out" style="border-radius: inherit;">
          ${slides.map((slide, idx) => `
            <div class="w-full h-full shrink-0 relative block" style="width: 100%; height: 100%; border-radius: inherit;">
              <a href="${escapeHtml(slide.target_url || sponsorWaUrl)}" ${slide.target_url ? 'target="_blank"' : ''} class="w-full h-full block relative" title="Sponsor ${idx + 1}" style="border-radius: inherit;">
                <img src="${escapeHtml(slide.image_url)}" alt="Sponsor ${idx + 1}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" style="border-radius: inherit;" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-300 p-3\\'><i class=\\'bi bi-badge-ad text-3xl mb-1\\'></i><span class=\\'text-[10px] font-bold\\'>SPACE IKLAN AVAILABLE</span></div>';" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 group-hover:opacity-60 transition duration-300" style="border-radius: inherit;"></div>
              </a>
            </div>
          `).join('')}
        </div>
      `;
    }

    const dotsHtml = showDots ? slides.map((_, idx) => `
      <button type="button" class="carousel-dot-btn w-2 h-2 rounded-full ${idx === 0 ? 'bg-white scale-125 ring-2 ring-white/50' : 'bg-white/50 hover:bg-white/80'} transition-all cursor-pointer shadow-sm" data-idx="${idx}" aria-label="Slide ${idx + 1}"></button>
    `).join('') : '';

    return `
      <!-- CARD SPONSOR VERSI MAX 5 GAMBAR CAROUSEL TANPA CTA -->
      <div id="${sliderId}" class="sponsor-carousel-container h-full w-full flex flex-col justify-between overflow-hidden transition-all duration-300 group relative ${shadowClass} ${animClass}" style="${bgStyle} border: ${borderWidth} solid ${borderColor}; border-radius: ${borderRadius}; ${shadowStyle}" data-anim="${animType}" data-interval="${intervalTime}" data-total="${slideCount}">
        <!-- Area Gambar Penuh (FULL IMG) Mengisi Penuh Kartu Mengikuti Baris Grid & Proporsional -->
        <div class="relative w-full h-full flex-1 min-h-0 aspect-[3/4] sm:aspect-auto overflow-hidden bg-slate-900" style="border-radius: inherit;">
          ${slidesHtml}
          
          <!-- Badge SPONSOR di Sudut Kiri Atas -->
          <span class="absolute top-2.5 left-2.5 bg-slate-900/85 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm z-20 pointer-events-none">
            SPONSOR
          </span>

          <!-- Tombol Panah Navigasi Manual (< dan >) di Desktop (Muncul saat Hover) -->
          ${showDots ? `
            <button type="button" class="carousel-prev-btn absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-md cursor-pointer" aria-label="Slide Sebelumnya">
              <i class="bi bi-chevron-left text-sm"></i>
            </button>
            <button type="button" class="carousel-next-btn absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-md cursor-pointer" aria-label="Slide Berikutnya">
              <i class="bi bi-chevron-right text-sm"></i>
            </button>
          ` : ''}

          <!-- Dots Navigasi di Bagian Bawah Gambar (Hanya jika > 1 slide) -->
          ${showDots ? `
            <div class="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 z-20 pointer-events-auto">
              ${dotsHtml}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // --- CARD SPONSOR VERSI BARU: LEBAR 2 KOLOM (DOUBLE-WIDTH CAROUSEL) ---
  // - Dimensi: Membentang selebar 2 kolom produk (col-span-2), tinggi sejajar serasi dengan kartu produk.
  // - Multi-Gambar: Mendukung hingga maksimal 10 gambar slide.
  // - Mode Geser: Mode Otomatis (interval detik) vs Mode Manual (tombol panah < / > di desktop hover, swipe sentuh di mobile).
  // - Validasi & Kustomisasi CTA per-Gambar Independen: Upload/URL, Link Klik Gambar [On/Off], Tombol CTA [On/Off] posisi absolute.
  function renderSlideCtaButton(slide, defaultUrl) {
    if (!slide || !slide.cta_enabled) return '';
    const isInternalProduct = Boolean(slide.linked_product_id);
    const prodTargetUrl = isInternalProduct ? `product.html?id=${slide.linked_product_id}` : '';
    const ctaText = slide.cta_text || (isInternalProduct ? 'Beli Sekarang' : 'Lihat Penawaran');
    const ctaLink = slide.cta_link || prodTargetUrl || slide.target_url || defaultUrl;
    const ctaBg = slide.cta_bg_color || '#059669';
    const ctaTextCol = slide.cta_text_color || '#ffffff';
    const ctaRadius = slide.cta_border_radius || '12px';
    const ctaIcon = slide.cta_icon || (isInternalProduct ? 'bi-cart-fill' : 'bi-arrow-right');
    const shadowPreset = slide.cta_shadow || 'md';
    const shadowClass = shadowPreset === 'none' ? 'shadow-none' : `shadow-${shadowPreset}`;
    const targetAttr = (ctaLink && ctaLink.startsWith('product.html')) ? '' : 'target="_blank"';

    return `
      <a href="${escapeHtml(ctaLink)}" ${targetAttr} onclick="event.stopPropagation();" class="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold transition-all duration-200 hover:scale-105 hover:brightness-110 ${shadowClass}" style="background-color: ${ctaBg}; color: ${ctaTextCol}; border-radius: ${ctaRadius};">
        <span class="truncate">${escapeHtml(ctaText)}</span>
        <i class="${escapeHtml(ctaIcon)} text-xs shrink-0"></i>
      </a>
    `;
  }

  function renderSponsorDoubleWidthCard(sponsor = {}, config = {}) {
    const bgColor = (sponsor.bg_color !== undefined && sponsor.bg_color !== '') ? sponsor.bg_color : ((config.bg_color !== undefined && config.bg_color !== '') ? config.bg_color : 'transparent');
    const bgStyle = (bgColor && bgColor !== 'transparent') ? `background-color: ${bgColor};` : '';
    const borderColor = sponsor.border_color || config.border_color || '#e2e8f0';
    const borderWidth = sponsor.border_width || config.border_width || '1px';
    const borderRadius = sponsor.border_radius || config.border_radius || '16px';
    const shadowPreset = sponsor.shadow || config.shadow || 'sm';
    const shadowClass = shadowPreset === 'none' ? 'sponsor-shadow-none' : `sponsor-shadow-${shadowPreset}`;
    const shadowStyle = shadowPreset === 'none' ? 'box-shadow: none !important;' : '';
    const animTypeCard = sponsor.animation || config.animation || 'none';
    const animClass = animTypeCard === 'fade' ? 'sponsor-anim-fade' : (animTypeCard === 'slide' ? 'sponsor-anim-slide' : (animTypeCard === 'zoom' ? 'sponsor-anim-zoom' : ''));

    const settings = (typeof DB !== 'undefined' && DB.getSettings) ? DB.getSettings() : {};
    const slides = Array.isArray(sponsor.slides) ? sponsor.slides.slice(0, 10) : [];
    const animType = sponsor.animation_type || 'slide';
    const slideMode = sponsor.slide_mode || 'auto'; // 'auto' | 'manual'
    const intervalTime = sponsor.auto_slide_interval || 4000;

    const phone = (settings.store_phone || '0888-5844-380').replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const sponsorWaUrl = `https://wa.me/${cleanPhone || '628885844380'}?text=${encodeURIComponent('Halo Admin Songer Creative, saya ingin pasang iklan sponsor 2-kolom di etalase toko.')}`;

    const sliderId = 'sponsor-double-' + Math.random().toString(36).substring(2, 9);

    if (slides.length === 0) {
      return `
        <div class="col-span-2 h-full min-h-[300px] w-full flex flex-col justify-between overflow-hidden transition-all duration-300 group relative ${shadowClass} ${animClass}" style="${bgStyle} border: ${borderWidth} solid ${borderColor}; border-radius: ${borderRadius}; ${shadowStyle}">
          <a href="${sponsorWaUrl}" target="_blank" class="relative w-full h-full flex-1 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white cursor-pointer group" style="border-radius: inherit;">
            <span class="absolute top-2.5 left-2.5 bg-slate-900/85 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm z-10">
              SPONSOR
            </span>
            <div class="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-3 text-amber-400 group-hover:scale-110 transition duration-300">
              <i class="bi bi-badge-ad text-3xl"></i>
            </div>
            <span class="text-sm font-black tracking-widest text-white uppercase mb-1">SLOT IKLAN 2-KOLOM (DOUBLE-WIDTH) TERSEDIA</span>
            <p class="text-xs text-slate-300 max-w-md leading-relaxed">Pasang banner sponsor carousel hingga 10 foto produk/brand bisnis Anda dengan tombol aksi kustom mandiri.</p>
            <div class="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition">
              <i class="bi bi-whatsapp"></i> Hubungi Admin Pasang Iklan
            </div>
          </a>
        </div>
      `;
    }

    const slideCount = slides.length;
    const showDots = slideCount > 1;
    const showArrows = slideCount > 1;

    let slidesHtml = '';
    if (animType === 'fade' || animType === 'scale') {
      slidesHtml = slides.map((slide, idx) => {
        const isInternalProduct = Boolean(slide.linked_product_id);
        const prodTargetUrl = isInternalProduct ? `product.html?id=${slide.linked_product_id}` : '';
        const targetUrl = slide.target_url || prodTargetUrl || sponsorWaUrl;
        const clickImageEnabled = slide.click_image_enabled !== false && Boolean(targetUrl);
        const targetAttr = (targetUrl && targetUrl.startsWith('product.html')) ? '' : 'target="_blank"';
        const ctaBtnHtml = renderSlideCtaButton(slide, sponsorWaUrl);

        const content = `
          <img src="${escapeHtml(slide.image_url)}" alt="Slide ${idx + 1}" class="w-full h-full object-cover group-hover:scale-105 transition duration-700" style="border-radius: inherit;" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-300 p-4\\'><i class=\\'bi bi-badge-ad text-3xl mb-1\\'></i><span class=\\'text-xs font-bold\\'>SPACE IKLAN AVAILABLE</span></div>';" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 group-hover:opacity-75 transition duration-300 pointer-events-none" style="border-radius: inherit;"></div>
          ${ctaBtnHtml}
        `;

        return `
          <div class="carousel-slide-item absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${idx === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}" data-slide="${idx}" style="border-radius: inherit;">
            ${clickImageEnabled ? `
              <a href="${escapeHtml(targetUrl)}" ${targetAttr} class="w-full h-full block relative" title="Sponsor ${idx + 1}" style="border-radius: inherit;">
                ${content}
              </a>
            ` : `
              <div class="w-full h-full block relative" style="border-radius: inherit;">
                ${content}
              </div>
            `}
          </div>
        `;
      }).join('');
    } else {
      // Default: 'slide' horizontal
      slidesHtml = `
        <div class="slides-track flex w-full h-full transition-transform duration-500 ease-in-out" style="border-radius: inherit;">
          ${slides.map((slide, idx) => {
            const isInternalProduct = Boolean(slide.linked_product_id);
            const prodTargetUrl = isInternalProduct ? `product.html?id=${slide.linked_product_id}` : '';
            const targetUrl = slide.target_url || prodTargetUrl || sponsorWaUrl;
            const clickImageEnabled = slide.click_image_enabled !== false && Boolean(targetUrl);
            const targetAttr = (targetUrl && targetUrl.startsWith('product.html')) ? '' : 'target="_blank"';
            const ctaBtnHtml = renderSlideCtaButton(slide, sponsorWaUrl);

            const content = `
              <img src="${escapeHtml(slide.image_url)}" alt="Slide ${idx + 1}" class="w-full h-full object-cover group-hover:scale-105 transition duration-700" style="border-radius: inherit;" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-300 p-4\\'><i class=\\'bi bi-badge-ad text-3xl mb-1\\'></i><span class=\\'text-xs font-bold\\'>SPACE IKLAN AVAILABLE</span></div>';" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 group-hover:opacity-75 transition duration-300 pointer-events-none" style="border-radius: inherit;"></div>
              ${ctaBtnHtml}
            `;

            return `
              <div class="w-full h-full shrink-0 relative block" style="width: 100%; height: 100%; border-radius: inherit;">
                ${clickImageEnabled ? `
                  <a href="${escapeHtml(targetUrl)}" ${targetAttr} class="w-full h-full block relative" title="Sponsor ${idx + 1}" style="border-radius: inherit;">
                    ${content}
                  </a>
                ` : `
                  <div class="w-full h-full block relative" style="border-radius: inherit;">
                    ${content}
                  </div>
                `}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    const dotsHtml = showDots ? slides.map((_, idx) => `
      <button type="button" class="carousel-dot-btn w-2 h-2 rounded-full ${idx === 0 ? 'bg-white scale-125 ring-2 ring-white/50' : 'bg-white/50 hover:bg-white/80'} transition-all cursor-pointer shadow-sm" data-idx="${idx}" aria-label="Slide ${idx + 1}"></button>
    `).join('') : '';

    return `
      <!-- CARD SPONSOR 2-KOLOM (DOUBLE-WIDTH CAROUSEL HINGGA 10 SLIDE & CTA INDEPENDEN) -->
      <div id="${sliderId}" class="sponsor-carousel-container col-span-2 h-full w-full min-h-[300px] sm:min-h-[340px] flex flex-col justify-between overflow-hidden transition-all duration-300 group relative ${shadowClass} ${animClass}" style="${bgStyle} border: ${borderWidth} solid ${borderColor}; border-radius: ${borderRadius}; ${shadowStyle}" data-anim="${animType}" data-interval="${intervalTime}" data-total="${slideCount}" data-mode="${slideMode}">
        <div class="relative w-full h-full flex-1 min-h-0 overflow-hidden bg-slate-950" style="border-radius: inherit;">
          ${slidesHtml}

          <!-- Badge SPONSOR di Sudut Kiri Atas -->
          <span class="absolute top-2.5 left-2.5 bg-slate-900/85 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-0.5 rounded-lg shadow-sm z-20 pointer-events-none">
            SPONSOR
          </span>

          <!-- Tombol Panah Navigasi Manual (< dan >) di Desktop (Muncul saat Hover) -->
          ${showArrows ? `
            <button type="button" class="carousel-prev-btn absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-md cursor-pointer" aria-label="Slide Sebelumnya">
              <i class="bi bi-chevron-left text-sm"></i>
            </button>
            <button type="button" class="carousel-next-btn absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-md cursor-pointer" aria-label="Slide Berikutnya">
              <i class="bi bi-chevron-right text-sm"></i>
            </button>
          ` : ''}

          <!-- Dots Navigasi Slide di Bagian Bawah Gambar -->
          ${showDots ? `
            <div class="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 z-20 pointer-events-auto">
              ${dotsHtml}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // 3. Sponsor Internal Toko ("Untuk Produk Sendiri"):
  //    Header bersih: tanpa dot hijau, tanpa badge promo, tanpa border-b divider.
  //    Tinggi terkunci h-full flex flex-col justify-between serasi dengan kartu produk standar di mobile.
  //    Grid 2x2 mini card memiliki thumbnail aspect-square dan padding rapat agar tinggi kartu tidak melar melebihi kartu produk di smartphone.
  function renderSponsorInternalProductsCard(promos, config = {}) {
    const s = promos?.sponsor_internal || promos || {};
    if (s.active === false && s.is_active === false) return '';
    const allProducts = (typeof DB !== 'undefined' && DB.getProducts) ? DB.getProducts().filter(p => p.is_active !== false) : [];
    if (allProducts.length === 0) return '';

    const bgColor = (s.bg_color !== undefined && s.bg_color !== '') ? s.bg_color : ((config.bg_color !== undefined && config.bg_color !== '') ? config.bg_color : '#ffffff');
    const borderColor = s.border_color || config.border_color || '#e2e8f0';
    const borderWidth = s.border_width || config.border_width || '1px';
    const borderRadius = s.border_radius || config.border_radius || '16px';
    const shadowPreset = s.shadow || config.shadow || 'sm';
    const shadowClass = shadowPreset === 'none' ? 'sponsor-shadow-none' : `sponsor-shadow-${shadowPreset}`;
    const shadowStyle = shadowPreset === 'none' ? 'box-shadow: none !important;' : '';
    const animTypeCard = s.animation || config.animation || 'none';
    const animClass = animTypeCard === 'fade' ? 'sponsor-anim-fade' : (animTypeCard === 'slide' ? 'sponsor-anim-slide' : (animTypeCard === 'zoom' ? 'sponsor-anim-zoom' : ''));

    // Konfigurasi Animasi & Pergerakan Sponsor Internal Produk Sendiri
    const slideMode = s.slide_mode || config.slide_mode || 'auto';
    const autoSlideInterval = s.auto_slide_interval || config.auto_slide_interval || 4000;
    const animationType = s.animation_type || s.animation || config.animation_type || config.animation || 'slide';

    // Prioritaskan produk pilihan seller dari admin panel jika ada
    const selectedIds = s.product_ids || [];
    let displayProds = [];
    if (Array.isArray(selectedIds) && selectedIds.length > 0) {
      displayProds = selectedIds.map(id => allProducts.find(p => p.id === id)).filter(Boolean);
    }
    if (displayProds.length === 0) {
      const promoProds = allProducts.filter(p => p.has_monthly_discount || p.sales_count > 0);
      displayProds = promoProds.length >= 4 ? promoProds : allProducts;
    }

    // Batches of 4 products (up to 5 batches = 20 products)
    const batches = [];
    for (let i = 0; i < displayProds.length && batches.length < 5; i += 4) {
      const chunk = displayProds.slice(i, i + 4);
      if (chunk.length > 0) batches.push(chunk);
    }
    if (batches.length === 0) batches.push(allProducts.slice(0, 4));

    const totalBatches = batches.length;
    const showDots = totalBatches > 1;

    const cardId = 'sponsor-internal-' + Math.random().toString(36).substring(2, 9);
    const title = s.title || promos?.internal_promo_title || config.title || 'FLASH SALE 11.11';

    function renderMiniGrid(batchList) {
      return batchList.map(prod => {
        const effDiscount = prod.effective_discount || (typeof DB !== 'undefined' && DB.getProductEffectiveDiscount ? DB.getProductEffectiveDiscount(prod) : { has_discount: false });
        const minPrice = getProductStartingPrice(prod);
        const finalPrice = effDiscount.has_discount ? effDiscount.discounted_price : minPrice;
        const imgSrc = (Array.isArray(prod.images) && prod.images.length > 0) ? prod.images[0] : (prod.image_url || 'assets/images/logo-songer-creative.png');

        return `
          <a href="product.html?id=${prod.id}" class="group/mini block p-1 sm:p-1.5 rounded-xl border border-slate-200/90 hover:border-emerald-500 bg-white hover:shadow-md transition flex flex-col justify-between">
            <div class="relative w-full aspect-square rounded-lg overflow-hidden bg-slate-100 shrink-0 mb-0.5 sm:mb-1">
              <img src="${imgSrc}" class="w-full h-full object-cover group-hover/mini:scale-105 transition duration-300" alt="${escapeHtml(prod.name)}" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-xs\\'><i class=\\'bi bi-image\\'></i></div>';" />
              ${effDiscount.has_discount ? `
                <span class="absolute top-1 right-1 bg-rose-600 text-white text-[8px] font-black px-1 py-0.2 rounded shadow-xs">
                  ${effDiscount.percent}%
                </span>
              ` : ''}
            </div>
            <div>
              <p class="text-[9px] sm:text-[11px] font-bold text-slate-800 line-clamp-1 group-hover/mini:text-emerald-700 transition leading-tight" title="${escapeHtml(prod.name)}">${escapeHtml(prod.name)}</p>
              <p class="text-[9px] sm:text-[11px] font-black text-emerald-600 mt-0.5">${formatIDR(finalPrice)}</p>
            </div>
          </a>
        `;
      }).join('');
    }

    const dotsHtml = showDots ? `
      <div class="flex items-center justify-center gap-1.5 py-1 mt-auto">
        ${batches.map((_, idx) => `
          <button type="button" class="internal-batch-dot w-2 h-2 rounded-full ${idx === 0 ? 'bg-emerald-600 scale-125' : 'bg-slate-300 hover:bg-slate-400'} transition-all cursor-pointer" data-target="${cardId}" data-batch="${idx + 1}" aria-label="Batch ${idx + 1}"></button>
        `).join('')}
      </div>
    ` : '';

    return `
      <!-- CARD SPONSOR UNTUK PRODUK SENDIRI (HEADER BERSIH TANPA DOT, BADGE, & DIVIDER) -->
      <div id="${cardId}" class="sponsor-internal-card h-full flex flex-col justify-between p-2.5 sm:p-3.5 transition-all duration-300 group relative select-none ${shadowClass} ${animClass}" style="background-color: ${bgColor}; border: ${borderWidth} solid ${borderColor}; border-radius: ${borderRadius}; ${shadowStyle}" data-total-batches="${totalBatches}" data-mode="${slideMode}" data-interval="${autoSlideInterval}" data-anim="${animationType}">
        <!-- Header Judul Sponsor Bersih -->
        <div class="flex items-center justify-start pb-1 min-w-0">
          <h4 class="font-black text-xs sm:text-sm text-slate-900 tracking-tight uppercase truncate" title="${escapeHtml(title)}">${escapeHtml(title)}</h4>
        </div>

        <!-- Grid 2x2 Mini-Card Produk Internal (Batch Slides) -->
        <div class="relative flex-1 min-h-0 flex flex-col justify-center my-auto py-1">
          ${batches.map((batchList, idx) => `
            <div class="internal-batch-view batch-${idx + 1} grid grid-cols-2 gap-1.5 sm:gap-2 ${idx === 0 ? '' : 'hidden'} transition-all duration-300">
              ${renderMiniGrid(batchList)}
            </div>
          `).join('')}

          ${totalBatches > 1 ? `
            <button type="button" class="carousel-prev-btn absolute -left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/95 hover:bg-white text-slate-800 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md border border-slate-200 cursor-pointer" aria-label="Batch Sebelumnya">
              <i class="bi bi-chevron-left text-xs"></i>
            </button>
            <button type="button" class="carousel-next-btn absolute -right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/95 hover:bg-white text-slate-800 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md border border-slate-200 cursor-pointer" aria-label="Batch Berikutnya">
              <i class="bi bi-chevron-right text-xs"></i>
            </button>
          ` : ''}
        </div>

        <!-- Dynamic Dots Navigasi Slide -->
        ${dotsHtml}
      </div>
    `;
  }

  // Alias pembantu untuk kompatibilitas
  function renderSponsorCardVariation1(ad, config = {}) {
    return renderSponsorAdCard(ad, config);
  }
  function renderSponsorCardVariation2(ad, config = {}) {
    return renderSponsorAdCard(ad, config);
  }

  function renderProductImage(prod) {
    const imgSrc = (Array.isArray(prod.images) && prod.images.length > 0) ? prod.images[0] : prod.image_url;
    if (imgSrc) {
      return `<img src="${imgSrc}" alt="${escapeHtml(prod.name)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-3xl\\'><i class=\\'bi bi-images\\'></i></div>';" />`;
    }
    return `
      <div class="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-3xl">
        <i class="bi bi-images"></i>
      </div>
    `;
  }

  function getProductStartingPrice(prod) {
    if (prod.materials && prod.materials.length > 0) {
      return Math.min(...prod.materials.map(m => m.price));
    }
    return prod.price || 0;
  }

  function getPriceUnitLabel(priceType) {
    switch (priceType) {
      case 1: return '/ m²';
      case 2: return '/ pcs';
      case 3: return '/ unit';
      case 4: return '/ paket';
      case 5: return '/ kg';
      case 6: return '/ liter';
      case 7: return '/ pcs (kelipatan)';
      default: return '';
    }
  }

  // --- SMART ADD TO CART LOGIC ---
  function handleSmartAddToCart(productId) {
    const prod = DB.getProductById(productId);
    if (!prod) return;

    const hasMultipleMaterials = Array.isArray(prod.materials) && prod.materials.length > 1;
    const hasMultipleFinishings = (prod.finishings_count > 1) ||
      (prod.finishings && prod.finishings.main && prod.finishings.main.length > 1) ||
      (prod.finishings && (
        (prod.finishings.extra_1 && prod.finishings.extra_1.length > 0) ||
        (prod.finishings && prod.finishings.extra_2 && prod.finishings.extra_2.length > 0) ||
        (prod.finishings && prod.finishings.extra_3 && prod.finishings.extra_3.length > 0)
      ));
    const isMeterType = prod.price_type === 1;

    // Logika Cerdas:
    // Jika produk memiliki variasi bertingkat (bahan > 1, finishing > 1, atau tipe Meter)
    // otomatis arahkan ke halaman detail produk (PDP) untuk memilih ukuran / varian.
    if (hasMultipleMaterials || hasMultipleFinishings || isMeterType) {
      window.location.href = `product.html?id=${prod.id}`;
      return;
    }

    // Jika produk bersifat standar (hanya 1 bahan & 1 finishing tanpa input dimensi PxL),
    // langsung masukkan ke keranjang belanja lokal pembeli.
    const startingPrice = getProductStartingPrice(prod);
    const effDiscount = prod.effective_discount || DB.getProductEffectiveDiscount(prod);
    const finalPrice = effDiscount.has_discount ? effDiscount.discounted_price : startingPrice;
    const materialName = (prod.materials && prod.materials[0]) ? prod.materials[0].name : 'Standar';

    const cartItem = {
      id: DB.generateUUID(),
      productId: prod.id,
      productName: prod.name,
      orderCategory: prod.order_category || 'Ctk',
      priceType: prod.price_type,
      unitPrice: finalPrice,
      qty: prod.min_order || 1,
      subtotal: finalPrice * (prod.min_order || 1),
      materialName: materialName,
      finishingName: 'Standar',
      image: prod.image_url || null
    };

    cart.push(cartItem);
    saveCart();
    updateCartBadge();
    App.showToast(`"${prod.name}" berhasil ditambahkan ke keranjang!`, 'success');
  }

  // --- COUNTDOWN TIMERS ---
  function startCountdownTimer() {
    if (countdownInterval) clearInterval(countdownInterval);

    function update() {
      const now = new Date();
      const settings = (typeof DB !== 'undefined' && DB.getSettings) ? DB.getSettings() : {};
      const promoTitle = settings?.promo_countdown_title || 'Promo Kilat';

      // Tentukan target waktu promo: gunakan settings.hero_timer_end jika valid, atau akhir hari ini
      let targetDate = null;
      if (settings?.hero_timer_end) {
        const parsed = new Date(settings.hero_timer_end);
        if (!isNaN(parsed.getTime())) {
          targetDate = parsed;
        }
      }
      if (!targetDate || targetDate <= now) {
        targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        if (targetDate <= now) {
          targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59);
        }
      }

      const diff = targetDate.getTime() - now.getTime();
      const topPromoTextEl = document.getElementById('top-promo-countdown-text');

      if (diff <= 0) {
        if (topPromoTextEl) topPromoTextEl.textContent = `${promoTitle} Telah Berakhir`;
        document.querySelectorAll('.interspersed-timer-val, #store-countdown').forEach(el => {
          el.textContent = '00j : 00m : 00d';
        });
        return;
      }

      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
      const minsRemaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secsRemaining = Math.floor((diff % (1000 * 60)) / 1000);

      // Hitung string format Top Bar sesuai spesifikasi:
      // 1. >= 24 jam -> "[Judul Promo] Berakhir Dalam: XX Hari Lagi" (contoh: 02 Hari Lagi)
      // 2. 1 - 24 jam -> "[Judul Promo] Berakhir Dalam: XX Jam Lagi" (contoh: 01 Jam Lagi)
      // 3. < 1 jam -> "[Judul Promo] Berakhir Dalam: Menit XX" (contoh: Menit 30)
      let topBarCountdownStr = '';
      if (diff >= 24 * 60 * 60 * 1000) {
        const daysStr = String(totalDays).padStart(2, '0');
        topBarCountdownStr = `${promoTitle} Berakhir Dalam: ${daysStr} Hari Lagi`;
      } else if (diff >= 60 * 60 * 1000) {
        const hoursStr = String(totalHours).padStart(2, '0');
        topBarCountdownStr = `${promoTitle} Berakhir Dalam: ${hoursStr} Jam Lagi`;
      } else {
        const minsStr = String(minsRemaining).padStart(2, '0');
        topBarCountdownStr = `${promoTitle} Berakhir Dalam: Menit ${minsStr}`;
      }

      if (topPromoTextEl) {
        topPromoTextEl.textContent = topBarCountdownStr;
      }

      const standardStr = `${String(totalHours).padStart(2, '0')}j : ${String(minsRemaining).padStart(2, '0')}m : ${String(secsRemaining).padStart(2, '0')}d`;
      document.querySelectorAll('.interspersed-timer-val, #store-countdown').forEach(el => {
        el.textContent = standardStr;
      });
    }

    update();
    countdownInterval = setInterval(update, 1000);
  }

  // --- CART DRAWER & VOUCHER VALIDATION ---

  function updateCartBadge() {
    const count = cart.length;
    const navBadge = document.getElementById('cart-badge-count');
    if (navBadge) {
      navBadge.textContent = count;
      if (count > 0) {
        navBadge.classList.remove('hidden');
      } else {
        navBadge.classList.add('hidden');
      }
    }

    // Pastikan tombol keranjang melayang di pojok kanan bawah dihapus secara permanen
    const oldFloating = document.getElementById('btn-floating-cart');
    if (oldFloating) oldFloating.remove();
  }

  function openCartDrawer() {
    const drawer = document.getElementById('drawer-buyer-cart');
    if (drawer) {
      drawer.classList.remove('hidden');
      renderCartDrawerContent();

      // Auto-fill nama dan nomor telepon pemesan jika sudah login akun Google
      const customer = DB.getActiveCustomer();
      if (customer) {
        const custNameInput = document.getElementById('cart-cust-name');
        const custPhoneInput = document.getElementById('cart-cust-phone');
        if (custNameInput && !custNameInput.value) custNameInput.value = customer.name;
        if (custPhoneInput && !custPhoneInput.value && customer.phone) custPhoneInput.value = customer.phone;
      }

      if (window.lucide) window.lucide.createIcons();
    }
  }

  function closeCartDrawer() {
    const drawer = document.getElementById('drawer-buyer-cart');
    if (drawer) drawer.classList.add('hidden');
  }

  function renderCartDrawerContent() {
    const body = document.getElementById('cart-drawer-body');
    const totalEl = document.getElementById('cart-drawer-grand-total');
    if (!body) return;

    if (cart.length === 0) {
      body.innerHTML = `
        <div class="text-center py-12 text-slate-400">
          <i data-lucide="shopping-cart" class="w-12 h-12 mx-auto mb-2 opacity-40"></i>
          <p class="text-xs">Keranjang belanja Anda masih kosong.</p>
        </div>
      `;
      if (totalEl) totalEl.textContent = formatIDR(0);
      if (window.lucide && typeof lucide.createIcons === 'function') {
        lucide.createIcons();
      }
      return;
    }

    let subtotal = 0;
    body.innerHTML = `
      <!-- Cart Items -->
      <div class="space-y-2.5">
        ${cart.map((item) => {
      subtotal += item.subtotal;
      return `
            <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h4 class="font-bold text-slate-900">${escapeHtml(item.productName)}</h4>
                  <div class="text-[11px] text-slate-500 mt-0.5">
                    ${item.materialName || 'Standar'} • ${item.finishingName || 'Standar'}
                  </div>
                </div>
                <button type="button" class="btn-remove-cart-item text-slate-400 hover:text-red-600 p-1" data-id="${item.id}">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
              <div class="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                <span class="text-slate-500">${item.qty} pcs x ${formatIDR(item.unitPrice)}</span>
                <span class="font-extrabold text-emerald-600">${formatIDR(item.subtotal)}</span>
              </div>
            </div>
          `;
    }).join('')}
      </div>

      <!-- Voucher Input Form Section -->
      <div class="pt-3 border-t border-slate-200 space-y-2">
        <label class="block text-xs font-bold text-slate-700">Gunakan Kode Voucher:</label>
        <div class="flex items-center gap-2">
          <input type="text" id="cart-voucher-input" placeholder="Contoh: SONGERHEMAT" value="${appliedVoucher ? appliedVoucher.voucher.code : (sessionStorage.getItem('pending_voucher_code') || '')}" class="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs uppercase font-mono font-bold outline-none focus:border-emerald-500" />
          <button type="button" id="btn-apply-voucher" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition">
            Terapkan
          </button>
        </div>
        ${appliedVoucher ? `
          <div class="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
            <div>
              <span class="font-bold">[${appliedVoucher.voucher.code}]</span> Diskon: -${formatIDR(appliedVoucher.discountAmount)}
            </div>
            <button type="button" id="btn-remove-voucher" class="text-slate-400 hover:text-red-600 font-bold text-[10px]">
              Batal
            </button>
          </div>
        ` : ''}
      </div>
    `;

    // Kalkulasi Grand Total dengan Diskon Voucher
    const discount = appliedVoucher ? appliedVoucher.discountAmount : 0;
    const grandTotal = Math.max(0, subtotal - discount);

    if (totalEl) totalEl.textContent = formatIDR(grandTotal);

    // Bind remove item
    document.querySelectorAll('.btn-remove-cart-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        cart = cart.filter(c => c.id !== id);
        saveCart();
        renderCartDrawerContent();
        updateCartBadge();
      });
    });

    // Bind voucher apply
    const btnApplyVoucher = document.getElementById('btn-apply-voucher');
    const inputVoucher = document.getElementById('cart-voucher-input');
    if (btnApplyVoucher && inputVoucher) {
      btnApplyVoucher.addEventListener('click', () => {
        const code = inputVoucher.value.trim();
        if (!code) return;
        const res = DB.validateVoucher(code, cart, subtotal);
        if (res.valid) {
          appliedVoucher = res;
          try { sessionStorage.setItem('pending_voucher_code', code); } catch (e) { }
          App.showToast(res.message, 'success');
        } else {
          appliedVoucher = null;
          App.showToast(res.message, 'error');
        }
        renderCartDrawerContent();
      });
    }

    const btnRemoveVoucher = document.getElementById('btn-remove-voucher');
    if (btnRemoveVoucher) {
      btnRemoveVoucher.addEventListener('click', () => {
        appliedVoucher = null;
        try { sessionStorage.removeItem('pending_voucher_code'); } catch (e) { }
        App.showToast('Voucher dibatalkan.', 'info');
        renderCartDrawerContent();
      });
    }

    if (window.lucide && typeof lucide.createIcons === 'function') {
      lucide.createIcons();
    }
  }

  function checkoutWhatsAppCart() {
    if (cart.length === 0) {
      alert('Keranjang belanja Anda kosong!');
      return;
    }

    const custName = (document.getElementById('cart-cust-name')?.value || '').trim();
    const custPhone = (document.getElementById('cart-cust-phone')?.value || '').trim();

    if (!custName) {
      alert('Mohon lengkapi Nama Lengkap Pemesan.');
      document.getElementById('cart-cust-name')?.focus();
      return;
    }

    const settings = DB.getSettings();
    const phone = '628885844380';

    let subtotal = cart.reduce((acc, it) => acc + it.subtotal, 0);
    let discount = appliedVoucher ? appliedVoucher.discountAmount : 0;
    let grandTotal = Math.max(0, subtotal - discount);

    let msg = `Halo *${settings.store_name}*, saya ingin konfirmasi pesanan dari Toko Online:\n\n`;
    msg += `*Data Pemesan:*\n`;
    msg += `• Nama: ${custName}\n`;
    if (custPhone) msg += `• WhatsApp: ${custPhone}\n`;
    msg += `\n*Daftar Pesanan:*\n`;

    cart.forEach((item, idx) => {
      msg += `${idx + 1}. *${item.productName}*\n`;
      msg += `   • Bahan: ${item.materialName || 'Standar'}\n`;
      msg += `   • Qty: ${item.qty} pcs x ${formatIDR(item.unitPrice)} = ${formatIDR(item.subtotal)}\n\n`;
    });

    if (appliedVoucher) {
      msg += `*Subtotal:* ${formatIDR(subtotal)}\n`;
      msg += `*Voucher [${appliedVoucher.voucher.code}]:* -${formatIDR(discount)}\n`;
    }
    msg += `*Total Tagihan:* ${formatIDR(grandTotal)}\n\n`;
    msg += `Mohon segera diproses dan informasikan rekening pembayaran. Terima kasih!`;

    // 1. Simpan nama pelanggan di local storage untuk fitur Personalized Greeting
    localStorage.setItem('pos_last_customer_name', custName);
    try {
      const tenantId = DB.getCurrentTenant ? DB.getCurrentTenant().id : 'songer-creative-01';
      localStorage.setItem(`pos_active_customer_${tenantId}`, JSON.stringify({ name: custName, phone: custPhone }));
    } catch (e) { }

    // 2. Simpan order ke state Database lokal dengan kalkulasi HPP riil
    const newOrderId = DB.generateUUID ? DB.generateUUID() : 'ord-' + Date.now();
    const invoiceNum = 'INV-' + Date.now().toString().slice(-6);
    const allProducts = (window.DB && typeof DB.getProducts === 'function') ? DB.getProducts() : [];

    let totalHpp = 0;
    const orderItems = cart.map(it => {
      let costPerUnit = 0;
      const matchedProd = allProducts.find(p => p.id === it.productId || p.name === it.productName);
      if (typeof it.cost_price === 'number' && it.cost_price > 0) {
        costPerUnit = it.cost_price;
      } else if (matchedProd) {
        if (matchedProd.price_type === 1 && it.materialName && matchedProd.materials) {
          const mat = matchedProd.materials.find(m => m.name === it.materialName);
          costPerUnit = (mat && typeof mat.cost_price === 'number' && mat.cost_price > 0)
            ? mat.cost_price
            : Math.round((it.unitPrice || 0) * 0.6);
        } else if (matchedProd.options && it.materialName) {
          const opt = matchedProd.options.find(o => o.name === it.materialName);
          costPerUnit = (opt && typeof opt.cost_price === 'number' && opt.cost_price > 0)
            ? opt.cost_price
            : (typeof matchedProd.cost_price === 'number' && matchedProd.cost_price > 0 ? matchedProd.cost_price : Math.round((it.unitPrice || 0) * 0.6));
        } else {
          costPerUnit = (typeof matchedProd.cost_price === 'number' && matchedProd.cost_price > 0)
            ? matchedProd.cost_price
            : Math.round((it.unitPrice || 0) * 0.6);
        }
      } else {
        costPerUnit = Math.round((it.unitPrice || 0) * 0.6);
      }

      const totalItemCost = (typeof it.billableArea === 'number' && it.billableArea > 0)
        ? Math.round(costPerUnit * it.billableArea * it.qty)
        : Math.round(costPerUnit * it.qty);

      totalHpp += totalItemCost;

      return {
        productId: it.productId || (matchedProd ? matchedProd.id : null),
        productName: it.productName,
        materialName: it.materialName || 'Standar',
        finishingName: it.finishingName || '-',
        qty: it.qty,
        unitPrice: it.unitPrice,
        subtotal: it.subtotal,
        cost_price: costPerUnit,
        total_cost: totalItemCost
      };
    });

    if (window.DB && typeof DB.saveOrder === 'function') {
      DB.saveOrder({
        id: newOrderId,
        invoice_number: invoiceNum, // Match DB expected field
        customer_name: custName,
        customer_phone: custPhone || '-',
        channel: 'WEB_WA', // Matches ordersChannelFilter
        status: 'PENDING', // Standardized status
        payment_method: 'WhatsApp / Transfer',
        items: orderItems,
        subtotal: subtotal,
        total_hpp: totalHpp,
        discount: discount,
        total: grandTotal,
        receipt_footer: 'Pesanan Web Checkout WhatsApp'
      });
    }

    // 3. Reset keranjang belanja
    cart = [];
    appliedVoucher = null;
    saveCart();
    updateCartBadge();
    const drawer = document.getElementById('drawer-buyer-cart');
    if (drawer) drawer.classList.add('hidden');

    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  }

  // --- EVENTS BINDING ---

  function bindStoreEvents() {
    // Quick Filter Tabs (Semua, Terlaris, Sedang Diskon / Promo)
    document.querySelectorAll('.btn-quick-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        activeQuickFilter = btn.getAttribute('data-filter');
        activeMainCategoryId = 'all';
        activeSubCategoryId = 'all';
        renderStorefront();
        bindStoreEvents();
      });
    });

    // Sponsor Internal CTA Button ("Lihat Semua Promo" -> Switch filter ke "Sedang Diskon" + scroll)
    document.querySelectorAll('.btn-sponsor-filter-discount').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        activeQuickFilter = 'discount';
        activeMainCategoryId = 'all';
        activeSubCategoryId = 'all';
        renderStorefront();
        bindStoreEvents();
        const targetEl = document.getElementById('quick-filter-container') || document.getElementById('katalog-section');
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Category Tabs Filter
    document.querySelectorAll('.btn-cat-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        activeMainCategoryId = btn.getAttribute('data-cat');
        activeQuickFilter = 'all';
        activeSubCategoryId = 'all';
        renderStorefront();
        bindStoreEvents();
      });
    });

    // Sub-Category Chips
    document.querySelectorAll('.btn-sub-cat-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSubCategoryId = btn.getAttribute('data-id');
        renderStorefront();
        bindStoreEvents();
      });
    });

    // Navigasi Panah Kategori Desktop (< dan >)
    document.querySelectorAll('.btn-cat-nav-prev').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-target');
        const trackEl = targetId ? document.getElementById(targetId) : btn.closest('.group\\/catnav')?.querySelector('.cat-scroll-track');
        if (trackEl) {
          trackEl.scrollBy({ left: -320, behavior: 'smooth' }); // Geser 320px ke kiri
          const wrapper = btn.closest('.group\\/catnav') || trackEl.closest('.group\\/catnav');
          const nextBtn = wrapper?.querySelector('.btn-cat-nav-next');
          setTimeout(() => updateSmartScrollArrows(trackEl, btn, nextBtn), 150);
          setTimeout(() => updateSmartScrollArrows(trackEl, btn, nextBtn), 350);
        }
      });
    });

    // Tombol Panah Kanan (>)
    document.querySelectorAll('.btn-cat-nav-next').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-target');
        const trackEl = targetId ? document.getElementById(targetId) : btn.closest('.group\\/catnav')?.querySelector('.cat-scroll-track');
        if (trackEl) {
          trackEl.scrollBy({ left: 320, behavior: 'smooth' }); // Geser 320px ke kanan
          const wrapper = btn.closest('.group\\/catnav') || trackEl.closest('.group\\/catnav');
          const prevBtn = wrapper?.querySelector('.btn-cat-nav-prev');
          setTimeout(() => updateSmartScrollArrows(trackEl, prevBtn, btn), 150);
          setTimeout(() => updateSmartScrollArrows(trackEl, prevBtn, btn), 350);
        }
      });
    });

    // Inisialisasi Smart Scroll Arrows Kategori Desktop
    requestAnimationFrame(() => {
      setTimeout(() => {
        initCategorySmartScroll();
      }, 80);
    });

    // Dropdown Navigasi Kategori (Compact Select Menu)
    document.querySelectorAll('.cat-select-dropdown').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'all') {
          activeQuickFilter = 'all';
          activeMainCategoryId = 'all';
        } else if (val === 'bestseller') {
          activeQuickFilter = 'bestseller';
          activeMainCategoryId = 'all';
        } else if (val === 'discount') {
          activeQuickFilter = 'discount';
          activeMainCategoryId = 'all';
        } else if (val.startsWith('cat_')) {
          activeQuickFilter = 'all';
          activeMainCategoryId = val.replace('cat_', '');
        }
        activeSubCategoryId = 'all';
        renderStorefront();
        bindStoreEvents();
      });
    });

    // Clear Search Filter Button (jika sedang aktif)
    const btnClearSearch = document.getElementById('btn-clear-search-filter');
    if (btnClearSearch) {
      btnClearSearch.addEventListener('click', () => {
        activeSearchQuery = '';
        const navInput = document.getElementById('navbar-search-input');
        if (navInput) navInput.value = '';
        const secondNavInput = document.getElementById('navbar-second-search-input');
        if (secondNavInput) secondNavInput.value = '';
        const mobileNavInput = document.getElementById('navbar-search-input-mobile');
        if (mobileNavInput) mobileNavInput.value = '';
        renderStorefront();
        bindStoreEvents();
      });
    }

    // Reset Filter Button
    const btnReset = document.getElementById('btn-reset-buyer-filters');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        activeQuickFilter = 'all';
        activeMainCategoryId = 'all';
        activeSubCategoryId = 'all';
        activeSearchQuery = '';
        const navInput = document.getElementById('navbar-search-input');
        if (navInput) navInput.value = '';
        const secondNavInput = document.getElementById('navbar-second-search-input');
        if (secondNavInput) secondNavInput.value = '';
        const mobileNavInput = document.getElementById('navbar-search-input-mobile');
        if (mobileNavInput) mobileNavInput.value = '';
        renderStorefront();
        bindStoreEvents();
      });
    }

    // Smart Plus Button (+) on Product Cards
    document.querySelectorAll('.btn-smart-add-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        handleSmartAddToCart(id);
      });
    });

    // Remind Promo Button (Interspersed Cards)
    document.querySelectorAll('.btn-remind-promo').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const promoName = btn.getAttribute('data-promo') || 'Promo Spesial';
        showToast(`Pengingat untuk ${promoName} berhasil disetel!`, 'success');
      });
    });

    // Inisialisasi gestur sentuh & dots switcher kartu sponsor internal toko 2x2
    initStoreInternalSponsorCards();

    // Cart Drawer triggers
    const btnOpenCart = document.getElementById('btn-open-cart-drawer');
    const btnCloseCart = document.getElementById('btn-close-cart-drawer');
    const btnCheckoutWaCart = document.getElementById('btn-checkout-cart-wa');

    if (btnOpenCart) btnOpenCart.addEventListener('click', openCartDrawer);
    if (btnCloseCart) btnCloseCart.addEventListener('click', closeCartDrawer);
    if (btnCheckoutWaCart) btnCheckoutWaCart.addEventListener('click', checkoutWhatsAppCart);

    // Smooth scroll for Hero CTA 1 (Katalog)
    document.addEventListener('click', (e) => {
      const cta1 = e.target.closest('#hero-btn-cta1');
      if (cta1) {
        e.preventDefault();
        const target = document.getElementById('buyer-storefront-container') || document.querySelector('main');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }

  // --- SMART SCROLL ARROWS HELPER (CATEGORIES & TRACKS) ---
  function updateSmartScrollArrows(trackEl, prevBtn, nextBtn) {
    if (!trackEl) return;
    const scrollLeft = trackEl.scrollLeft;
    const scrollWidth = trackEl.scrollWidth;
    const clientWidth = trackEl.clientWidth;

    const hasOverflowLeft = scrollLeft > 4;
    const hasOverflowRight = (scrollWidth - clientWidth - scrollLeft) > 4;

    // Aturan 1 & 2: Sembunyikan sepenuhnya jika tidak overflow di kiri, izinkan tampil jika overflow kiri
    if (prevBtn) {
      if (!hasOverflowLeft) {
        prevBtn.style.display = 'none';
        prevBtn.classList.add('cat-nav-hidden');
      } else {
        prevBtn.style.display = '';
        prevBtn.classList.remove('cat-nav-hidden');
      }
    }

    // Aturan 3 & 4: Sembunyikan sepenuhnya jika tidak overflow di kanan, izinkan tampil jika overflow kanan
    if (nextBtn) {
      if (!hasOverflowRight) {
        nextBtn.style.display = 'none';
        nextBtn.classList.add('cat-nav-hidden');
      } else {
        nextBtn.style.display = '';
        nextBtn.classList.remove('cat-nav-hidden');
      }
    }
  }

  function initCategorySmartScroll() {
    document.querySelectorAll('.group\\/catnav').forEach(wrapper => {
      const trackEl = wrapper.querySelector('.cat-scroll-track');
      const prevBtn = wrapper.querySelector('.btn-cat-nav-prev');
      const nextBtn = wrapper.querySelector('.btn-cat-nav-next');
      if (!trackEl) return;

      const update = () => updateSmartScrollArrows(trackEl, prevBtn, nextBtn);
      update();

      if (trackEl._smartScrollHandler) {
        trackEl.removeEventListener('scroll', trackEl._smartScrollHandler);
      }
      trackEl._smartScrollHandler = update;
      trackEl.addEventListener('scroll', update, { passive: true });
    });
  }

  // Window resize listener untuk update smart category scroll arrows
  window.addEventListener('resize', () => {
    initCategorySmartScroll();
  });

  // --- SPONSOR SLIDER SMART BOUNDARY ARROWS HELPER ---
  function updateSponsorArrowBoundaries(currentIdx, total, prevBtn, nextBtn) {
    if (!prevBtn && !nextBtn) return;
    if (total <= 1) {
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      return;
    }

    // Saat berada di slide/batch pertama (currentIdx === 0): sembunyikan tombol < dan hanya tampilkan tombol >
    if (prevBtn) {
      prevBtn.style.display = (currentIdx <= 0) ? 'none' : '';
    }
    // Saat berada di slide/batch terakhir (currentIdx === total - 1): sembunyikan tombol > dan hanya tampilkan tombol <
    if (nextBtn) {
      nextBtn.style.display = (currentIdx >= total - 1) ? 'none' : '';
    }
  }

  // --- SMART NAVBAR SEARCH & AUTOCOMPLETE ---
  function initNavbarSearchAutocomplete() {
    const searchInput = document.getElementById('navbar-search-input');
    const suggestionsBox = document.getElementById('navbar-search-suggestions');
    const secondSearchInput = document.getElementById('navbar-second-search-input');
    const secondSuggestionsBox = document.getElementById('navbar-second-search-suggestions');
    const searchBackdrop = document.getElementById('navbar-search-backdrop');
    const mobileInput = document.getElementById('navbar-search-input-mobile');

    const hideSearchDropdown = () => {
      if (suggestionsBox) suggestionsBox.classList.add('hidden');
      if (secondSuggestionsBox) secondSuggestionsBox.classList.add('hidden');
      if (searchBackdrop) searchBackdrop.classList.add('hidden');
    };

    if (searchInput && suggestionsBox) {
      searchInput.addEventListener('input', () => {
        if (mobileInput) mobileInput.value = searchInput.value;
        if (secondSearchInput) secondSearchInput.value = searchInput.value;
        handleSearchAutocompleteInput(searchInput, suggestionsBox);
        if (searchBackdrop && !suggestionsBox.classList.contains('hidden')) {
          searchBackdrop.classList.remove('hidden');
        }
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleEnterSearchQuery(searchInput.value, searchInput, suggestionsBox);
        }
      });
    }

    if (secondSearchInput && secondSuggestionsBox) {
      secondSearchInput.addEventListener('input', () => {
        if (mobileInput) mobileInput.value = secondSearchInput.value;
        if (searchInput) searchInput.value = secondSearchInput.value;
        handleSearchAutocompleteInput(secondSearchInput, secondSuggestionsBox);
        if (searchBackdrop && !secondSuggestionsBox.classList.contains('hidden')) {
          searchBackdrop.classList.remove('hidden');
        }
      });

      secondSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleEnterSearchQuery(secondSearchInput.value, secondSearchInput, secondSuggestionsBox);
        }
      });
    }

    // Close suggestions when clicking outside or on mobile backdrop
    if (searchBackdrop) {
      searchBackdrop.addEventListener('click', hideSearchDropdown);
    }

    document.addEventListener('click', (e) => {
      const clickedDesktop = (searchInput && searchInput.contains(e.target)) || (suggestionsBox && suggestionsBox.contains(e.target));
      const clickedSecond = (secondSearchInput && secondSearchInput.contains(e.target)) || (secondSuggestionsBox && secondSuggestionsBox.contains(e.target));
      if (!clickedDesktop && !clickedSecond) {
        hideSearchDropdown();
      }
    });
  }

  // --- GOOGLE AUTHENTICATION & CUSTOMER DATA ISOLATION ---
  function initGoogleAuth() {
    const btnGoogleLogin = document.getElementById('btn-google-login');
    const userProfileMenu = document.getElementById('user-profile-menu');
    const btnToggleDropdown = document.getElementById('btn-toggle-user-dropdown');
    const userDropdownPanel = document.getElementById('user-dropdown-panel');
    const userAvatarImg = document.getElementById('user-avatar-img');
    const userNameLabel = document.getElementById('user-name-label');
    const userDropdownName = document.getElementById('user-dropdown-name');
    const userDropdownEmail = document.getElementById('user-dropdown-email');
    const btnLogout = document.getElementById('btn-customer-logout');
    const modal = document.getElementById('modal-google-auth');
    const btnCloseModal = document.getElementById('btn-close-google-auth');

    function refreshAuthUI() {
      const customer = DB.getActiveCustomer();
      if (customer) {
        if (btnGoogleLogin) btnGoogleLogin.classList.add('hidden');
        if (userProfileMenu) userProfileMenu.classList.remove('hidden');
        if (userAvatarImg) userAvatarImg.src = customer.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80';
        if (userNameLabel) userNameLabel.textContent = customer.name;
        if (userDropdownName) userDropdownName.textContent = customer.name;
        if (userDropdownEmail) userDropdownEmail.textContent = customer.email;

        // Auto-fill checkout fields in cart drawer
        const custNameInput = document.getElementById('cart-cust-name');
        const custPhoneInput = document.getElementById('cart-cust-phone');
        if (custNameInput && !custNameInput.value) custNameInput.value = customer.name;
        if (custPhoneInput && !custPhoneInput.value && customer.phone) custPhoneInput.value = customer.phone;
      } else {
        if (btnGoogleLogin) btnGoogleLogin.classList.remove('hidden');
        if (userProfileMenu) userProfileMenu.classList.add('hidden');
        if (userDropdownPanel) userDropdownPanel.classList.add('hidden');
      }
    }

    refreshAuthUI();

    // Toggle dropdown
    if (btnToggleDropdown && userDropdownPanel) {
      btnToggleDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdownPanel.classList.toggle('hidden');
      });
      document.addEventListener('click', () => {
        userDropdownPanel.classList.add('hidden');
      });
    }

    // Open modal
    if (btnGoogleLogin && modal) {
      btnGoogleLogin.addEventListener('click', () => {
        modal.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
      });
    }

    // Close modal
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

    // Select demo accounts
    document.querySelectorAll('.btn-select-google-account').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        const email = btn.getAttribute('data-email');
        const avatar = btn.getAttribute('data-avatar');

        const newCustomer = {
          id: DB.generateUUID(),
          name,
          email,
          avatar,
          phone: '08123456789',
          created_at: new Date().toISOString()
        };

        DB.saveCustomer(newCustomer);
        DB.setActiveCustomer(newCustomer);

        if (modal) modal.classList.add('hidden');
        refreshAuthUI();
        showToast(`Berhasil masuk sebagai ${name}!`, 'success');
      });
    });

    // Custom submit
    const btnCustomSubmit = document.getElementById('btn-custom-google-submit');
    if (btnCustomSubmit) {
      btnCustomSubmit.addEventListener('click', () => {
        const nameInput = document.getElementById('custom-google-name');
        const emailInput = document.getElementById('custom-google-email');

        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';

        if (!name || !email) {
          showToast('Nama dan Email wajib diisi!', 'error');
          return;
        }

        const newCustomer = {
          id: DB.generateUUID(),
          name,
          email,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
          phone: '',
          created_at: new Date().toISOString()
        };

        DB.saveCustomer(newCustomer);
        DB.setActiveCustomer(newCustomer);

        if (nameInput) nameInput.value = '';
        if (emailInput) emailInput.value = '';

        if (modal) modal.classList.add('hidden');
        refreshAuthUI();
        showToast(`Berhasil masuk sebagai ${name}!`, 'success');
      });
    }

    // Logout
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        DB.clearActiveCustomer();
        refreshAuthUI();
        showToast('Anda telah keluar dari akun.', 'info');
      });
    }
  }

  // --- HERO SLIDER LOGIC (SMOOTH HORIZONTAL & FADE TRANSITION + MANUAL SWIPE) ---
  function initHeroSlider() {
    const sliderContainer = document.getElementById('hero-slider-container');
    if (!sliderContainer) return;

    // Ambil data settings di baris paling atas agar dapat diakses fungsi internal slider
    const settings = (typeof DB !== 'undefined' && DB.getSettings) ? DB.getSettings() : {};

    const count = parseInt(sliderContainer.getAttribute('data-count') || '1', 10);
    if (count <= 1) return;

    const animType = sliderContainer.getAttribute('data-anim') || 'slide_3s';
    const isFade = animType.startsWith('fade');
    if (isFade) {
      sliderContainer.classList.add('hero-anim-fade');
    }

    const slides = Array.from(sliderContainer.querySelectorAll('.hero-slide-smooth'));
    const dots = Array.from(sliderContainer.querySelectorAll('.hero-slide-dot'));
    const totalSlides = slides.length;
    if (totalSlides <= 1) return;

    let currentIndex = 0;
    let isTransitioning = false;
    let slideInterval = null;

    function goToSlide(targetIndex, direction = 1) {
      if (isTransitioning) return;
      // Formula siklus infinite wrap-around
      const normalizedTarget = ((targetIndex % totalSlides) + totalSlides) % totalSlides;
      if (normalizedTarget === currentIndex) return;

      isTransitioning = true;
      if (slideInterval) {
        clearInterval(slideInterval);
        slideInterval = null;
      }

      const outgoingSlide = slides[currentIndex];
      const incomingSlide = slides[normalizedTarget];

      if (isFade) {
        // --- MODE FADE (Murni Cross-Fade, Tanpa Transform Translasi) ---
        if (outgoingSlide) {
          outgoingSlide.classList.remove('is-active', 'is-hidden');
          outgoingSlide.style.transform = 'none';
          outgoingSlide.style.zIndex = '5';
          outgoingSlide.style.transition = 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
          outgoingSlide.style.opacity = '0';
        }

        if (incomingSlide) {
          incomingSlide.classList.remove('is-hidden');
          incomingSlide.style.transform = 'none';
          incomingSlide.style.zIndex = '10';
          incomingSlide.style.opacity = '0';
          incomingSlide.style.visibility = 'visible';
          incomingSlide.style.transition = 'none';

          void incomingSlide.offsetWidth; // Paksa reflow

          incomingSlide.style.transition = 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
          incomingSlide.style.opacity = '1';
        }
      } else {
        // --- MODE SLIDE HORIZONTAL (Bebas Bug Terkunci / Bentrok Class) ---
        const startTranslate = direction > 0 ? 'translateX(100%)' : 'translateX(-100%)';
        const exitTranslate = direction > 0 ? 'translateX(-100%)' : 'translateX(100%)';

        if (incomingSlide) {
          incomingSlide.classList.remove('is-hidden', 'is-prev', 'is-next');
          incomingSlide.style.visibility = 'visible';
          incomingSlide.style.zIndex = '10';
          incomingSlide.style.transition = 'none';
          incomingSlide.style.transform = startTranslate;

          void incomingSlide.offsetWidth; // Paksa reflow untuk render koordinat awal

          incomingSlide.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
          incomingSlide.style.transform = 'translateX(0)';
        }

        if (outgoingSlide) {
          outgoingSlide.style.zIndex = '5';
          outgoingSlide.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
          outgoingSlide.style.transform = exitTranslate;
        }
      }

      // Update dots indicator
      const activeDotColor = settings.hero_dots_active_color || '#10b981';
      const inactiveDotColor = settings.hero_dots_inactive_color || '#cbd5e1';
      dots.forEach((dot, idx) => {
        if (idx === normalizedTarget) {
          dot.style.backgroundColor = activeDotColor;
          dot.style.transform = 'scale(1.25)';
        } else {
          dot.style.backgroundColor = inactiveDotColor;
          dot.style.transform = 'scale(1)';
        }
      });

      currentIndex = normalizedTarget;

      setTimeout(() => {
        try {
          slides.forEach((s, idx) => {
            if (idx === currentIndex) {
              s.className = 'hero-slide-smooth is-active';
              s.style.transition = '';
              s.style.transform = '';
              s.style.opacity = '';
              s.style.zIndex = '';
              s.style.visibility = '';
            } else {
              s.className = 'hero-slide-smooth is-hidden';
              s.style.transition = '';
              s.style.transform = '';
              s.style.opacity = '';
              s.style.zIndex = '';
              s.style.visibility = '';
            }
          });
        } finally {
          isTransitioning = false;
          // Jalankan kembali autoplay setelah animasi perpindahan gambar tuntas
          startTimer();
        }
      }, 620);
    }

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (idx === currentIndex) return;
        if (slideInterval) clearInterval(slideInterval);
        const dir = idx > currentIndex ? 1 : -1;
        goToSlide(idx, dir);
      });
    });

    const prevBtn = sliderContainer.querySelector('#hero-slide-prev');
    const nextBtn = sliderContainer.querySelector('#hero-slide-next');
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (slideInterval) clearInterval(slideInterval);
        goToSlide((currentIndex - 1 + totalSlides) % totalSlides, -1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (slideInterval) clearInterval(slideInterval);
        goToSlide((currentIndex + 1) % totalSlides, 1);
      });
    }

    // --- INTERAKSI GESTUR SWIPE (TOUCH MOBILE/TABLET & DRAG MOUSE DESKTOP) ---
    sliderContainer.style.touchAction = 'pan-y'; // Izinkan scrolling vertikal alami, tangkap gestur horizontal
    sliderContainer.style.userSelect = 'none';

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isHorizontalGesture = false;
    let hasDragged = false;
    const threshold = 30; // Ambang batas jarak minimal perpindahan slide (30px untuk responsivitas swipe optimal)

    function handleDragStart(x, y) {
      if (isTransitioning) return;
      isDragging = true;
      hasDragged = false;
      isHorizontalGesture = false;
      startX = x;
      startY = y;
      currentX = x;
      currentY = y;

      // Hentikan autoplay saat sentuhan / drag pertama terdeteksi
      if (slideInterval) {
        clearInterval(slideInterval);
        slideInterval = null;
      }
    }

    function handleDragMove(x, y, e) {
      if (!isDragging || isTransitioning) return;
      currentX = x;
      currentY = y;
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;

      if (!isHorizontalGesture) {
        if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
          isHorizontalGesture = true;
          hasDragged = true;
        } else if (Math.abs(deltaY) > 8 && Math.abs(deltaY) >= Math.abs(deltaX)) {
          // Scroll vertikal dominan terdeteksi: batalkan drag slider agar browser mengalirkan scroll halaman
          isDragging = false;
          return;
        }
      }

      if (isHorizontalGesture) {
        if (e && e.cancelable) e.preventDefault();
        sliderContainer.style.cursor = 'grabbing';

        // Feedback pergerakan visual real-time pada mode Slide
        if (!isFade && slides[currentIndex]) {
          slides[currentIndex].style.transition = 'none';
          slides[currentIndex].style.transform = `translateX(${deltaX}px)`;
        }
      }
    }

    function handleDragEnd() {
      if (!isDragging) return;
      isDragging = false;
      sliderContainer.style.cursor = '';

      const deltaX = currentX - startX;

      if (!isHorizontalGesture) {
        startTimer();
        return;
      }

      if (isFade) {
        // Logika Khusus Mode Fade Sesuai Spesifikasi:
        // - Geser ke Kanan (deltaX > threshold) -> Fade-in memunculkan slide berikutnya
        // - Geser ke Kiri (deltaX < -threshold) -> Fade-in memudarkan slide aktif & memunculkan slide sebelumnya
        if (deltaX > threshold) {
          goToSlide((currentIndex + 1) % totalSlides, 1);
        } else if (deltaX < -threshold) {
          goToSlide((currentIndex - 1 + totalSlides) % totalSlides, -1);
        } else {
          // Snap back: Jarak tidak mencapai threshold minimal, tidak ada pergantian slide
          startTimer();
        }
      } else {
        // Logika Mode Slide:
        // - Geser ke Kiri (deltaX < -threshold): Gambar bergerak dari kanan ke kiri untuk menampilkan slide berikutnya (Next Slide)
        // - Geser ke Kanan (deltaX > threshold): Gambar bergerak dari kiri ke kanan untuk menampilkan slide sebelumnya (Previous Slide)
        if (deltaX < -threshold) {
          if (slides[currentIndex]) {
            slides[currentIndex].style.transition = '';
            slides[currentIndex].style.transform = '';
          }
          goToSlide((currentIndex + 1) % totalSlides, 1);
        } else if (deltaX > threshold) {
          if (slides[currentIndex]) {
            slides[currentIndex].style.transition = '';
            slides[currentIndex].style.transform = '';
          }
          goToSlide((currentIndex - 1 + totalSlides) % totalSlides, -1);
        } else {
          // Snap back mulus ke indeks saat ini jika tidak mencapai threshold
          if (slides[currentIndex]) {
            slides[currentIndex].style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
            slides[currentIndex].style.transform = 'translateX(0)';
            setTimeout(() => {
              if (!isTransitioning && slides[currentIndex]) {
                slides[currentIndex].style.transition = '';
                slides[currentIndex].style.transform = '';
              }
            }, 300);
          }
          startTimer();
        }
      }
    }

    // Touch Event Listeners (Mobile & Tablet)
    sliderContainer.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    sliderContainer.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        handleDragMove(e.touches[0].clientX, e.touches[0].clientY, e);
      }
    }, { passive: false });

    sliderContainer.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        currentX = e.changedTouches[0].clientX;
        currentY = e.changedTouches[0].clientY;
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        if (!isHorizontalGesture && Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
          isHorizontalGesture = true;
        }
      }
      handleDragEnd();
    }, { passive: true });

    sliderContainer.addEventListener('touchcancel', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        currentX = e.changedTouches[0].clientX;
        currentY = e.changedTouches[0].clientY;
      }
      handleDragEnd();
    }, { passive: true });

    // Mouse Drag Event Listeners (Desktop)
    sliderContainer.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('#hero-slide-prev') || e.target.closest('#hero-slide-next') || e.target.closest('.hero-slide-dot')) return;
      handleDragStart(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        handleDragMove(e.clientX, e.clientY, e);
      }
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        handleDragEnd();
      }
    });

    // Cegah drag native browser pada gambar
    sliderContainer.querySelectorAll('img').forEach(img => {
      img.addEventListener('dragstart', (e) => e.preventDefault());
    });

    // Cegah klik CTA yang tidak disengaja saat gestur drag selesai
    sliderContainer.addEventListener('click', (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    }, true);

    function startTimer() {
      if (slideInterval) clearInterval(slideInterval);
      if (animType !== 'manual') {
        const delay = (animType === 'slide_5s' || animType === 'fade_5s') ? 5000 : 3000;
        slideInterval = setInterval(() => {
          goToSlide((currentIndex + 1) % totalSlides, 1);
        }, delay);
      }
    }

    startTimer();
  }

  // --- SPONSOR CAROUSEL SLIDER LOGIC (AUTOMATIC FADE & SLIDE INTERVAL) ---
  function initStoreSponsorCarousels() {
    const containers = document.querySelectorAll('.sponsor-carousel-container');
    containers.forEach(container => {
      if (container.dataset.initialized === 'true') return;
      container.dataset.initialized = 'true';

      const total = parseInt(container.getAttribute('data-total') || '1', 10);
      if (total <= 1) return;

      const track = container.querySelector('.slides-track');
      const fadeSlides = container.querySelectorAll('.carousel-slide-item');
      const dots = container.querySelectorAll('.carousel-dot-btn');
      const prevBtn = container.querySelector('.carousel-prev-btn');
      const nextBtn = container.querySelector('.carousel-next-btn');
      const intervalTime = parseInt(container.getAttribute('data-interval') || '3500', 10);
      const animType = container.getAttribute('data-anim') || 'slide';
      const slideMode = container.getAttribute('data-mode') || 'auto';

      let currentIdx = 0;
      let timer = null;

      function updateArrows() {
        updateSponsorArrowBoundaries(currentIdx, total, prevBtn, nextBtn);
      }

      function goToSlide(idx) {
        currentIdx = (idx + total) % total;
        if (track) {
          track.style.transform = `translateX(-${currentIdx * 100}%)`;
        }
        if (fadeSlides.length > 0) {
          fadeSlides.forEach((s, i) => {
            if (i === currentIdx) {
              s.className = 'carousel-slide-item absolute inset-0 w-full h-full transition-all duration-700 ease-in-out opacity-100 z-10';
            } else {
              s.className = 'carousel-slide-item absolute inset-0 w-full h-full transition-all duration-700 ease-in-out opacity-0 z-0 pointer-events-none';
            }
          });
        }
        dots.forEach((d, i) => {
          if (i === currentIdx) {
            d.className = 'carousel-dot-btn w-2 h-2 rounded-full bg-white scale-125 ring-2 ring-white/50 transition-all cursor-pointer shadow-sm';
          } else {
            d.className = 'carousel-dot-btn w-2 h-2 rounded-full bg-white/50 hover:bg-white/80 transition-all cursor-pointer shadow-sm';
          }
        });
        updateArrows();
      }

      updateArrows();

      function startAuto() {
        stopAuto();
        timer = setInterval(() => {
          goToSlide((currentIdx + 1) % total);
        }, intervalTime);
      }

      function stopAuto() {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      }

      dots.forEach((btn, idx) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          goToSlide(idx);
          if (slideMode === 'auto') startAuto();
        });
      });

      // Tombol Navigasi Manual (< dan >) dengan Logika Boundary Non-Looping
      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (currentIdx > 0) {
            goToSlide(currentIdx - 1);
            if (slideMode === 'auto') startAuto();
          }
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (currentIdx < total - 1) {
            goToSlide(currentIdx + 1);
            if (slideMode === 'auto') startAuto();
          }
        });
      }

      // Touch gesture swipe support for sponsor card
      let touchStartX = 0;
      container.addEventListener('touchstart', (e) => {
        if (e.changedTouches && e.changedTouches[0]) {
          touchStartX = e.changedTouches[0].clientX;
        }
      }, { passive: true });

      container.addEventListener('touchend', (e) => {
        if (e.changedTouches && e.changedTouches[0]) {
          const diffX = e.changedTouches[0].clientX - touchStartX;
          if (Math.abs(diffX) > 25) {
            if (diffX < 0) {
              if (currentIdx < total - 1) goToSlide(currentIdx + 1);
            } else {
              if (currentIdx > 0) goToSlide(currentIdx - 1);
            }
            if (slideMode === 'auto') startAuto();
          }
        }
      }, { passive: true });

      if (slideMode === 'auto') {
        container.addEventListener('mouseenter', stopAuto);
        container.addEventListener('mouseleave', startAuto);
        startAuto();
      }
    });

    // Inisialisasi gestur swipe kartu sponsor internal toko 2x2
    initStoreInternalSponsorCards();
  }

  // --- SPONSOR INTERNAL PRODUCTS 2X2 TOUCH SWIPE & BATCH SWITCHER ---
  function initStoreInternalSponsorCards() {
    const cards = document.querySelectorAll('.sponsor-internal-card, [id^="sponsor-internal-"]');
    cards.forEach(card => {
      if (card.dataset.swipeInitialized === 'true') return;
      card.dataset.swipeInitialized = 'true';

      const views = Array.from(card.querySelectorAll('.internal-batch-view'));
      const dots = Array.from(card.querySelectorAll('.internal-batch-dot'));
      const prevBtn = card.querySelector('.carousel-prev-btn');
      const nextBtn = card.querySelector('.carousel-next-btn');
      const total = views.length;
      if (total <= 1) {
        updateSponsorArrowBoundaries(0, total, prevBtn, nextBtn);
        return;
      }

      const slideMode = card.getAttribute('data-mode') || 'auto';
      const intervalTime = parseInt(card.getAttribute('data-interval') || '4000', 10);
      const animType = card.getAttribute('data-anim') || 'slide';

      let currentIdx = 0;
      let timer = null;

      function updateArrows() {
        updateSponsorArrowBoundaries(currentIdx, total, prevBtn, nextBtn);
      }

      function goToBatch(newIdx, direction) {
        const oldIdx = currentIdx;
        currentIdx = (newIdx + total) % total;
        const targetBatchNum = currentIdx + 1;
        const dir = direction || (currentIdx > oldIdx || (oldIdx === total - 1 && currentIdx === 0) ? 'next' : 'prev');

        views.forEach(v => {
          v.classList.remove('batch-slide-next', 'batch-slide-prev', 'batch-fade', 'batch-zoom');
          if (v.classList.contains(`batch-${targetBatchNum}`)) {
            v.classList.remove('hidden');
            if (animType === 'fade') {
              v.classList.add('batch-fade');
            } else if (animType === 'zoom' || animType === 'scale') {
              v.classList.add('batch-zoom');
            } else {
              v.classList.add(dir === 'next' ? 'batch-slide-next' : 'batch-slide-prev');
            }
          } else {
            v.classList.add('hidden');
          }
        });

        dots.forEach((d, i) => {
          if (i === currentIdx) {
            d.className = 'internal-batch-dot w-2 h-2 rounded-full bg-emerald-600 scale-125 transition-all cursor-pointer';
          } else {
            d.className = 'internal-batch-dot w-2 h-2 rounded-full bg-slate-300 hover:bg-slate-400 transition-all cursor-pointer';
          }
        });

        updateArrows();
      }

      updateArrows();

      function startAuto() {
        stopAuto();
        if (slideMode !== 'manual') {
          timer = setInterval(() => {
            goToBatch((currentIdx + 1) % total, 'next');
          }, intervalTime);
        }
      }

      function stopAuto() {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      }

      // Dot click
      dots.forEach((dot, idx) => {
        dot.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          goToBatch(idx);
          if (slideMode !== 'manual') startAuto();
        });
      });

      // Tombol Navigasi Manual Batch (< dan >)
      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (currentIdx > 0) {
            goToBatch(currentIdx - 1, 'prev');
            if (slideMode !== 'manual') startAuto();
          }
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (currentIdx < total - 1) {
            goToBatch(currentIdx + 1, 'next');
            if (slideMode !== 'manual') startAuto();
          }
        });
      }

      // Touch gesture swipe support for 2x2 internal sponsor card in mobile
      let touchStartX = 0;
      let touchStartY = 0;

      card.addEventListener('touchstart', (e) => {
        if (e.changedTouches && e.changedTouches[0]) {
          touchStartX = e.changedTouches[0].clientX;
          touchStartY = e.changedTouches[0].clientY;
        }
      }, { passive: true });

      card.addEventListener('touchend', (e) => {
        if (e.changedTouches && e.changedTouches[0]) {
          const diffX = e.changedTouches[0].clientX - touchStartX;
          const diffY = e.changedTouches[0].clientY - touchStartY;
          if (Math.abs(diffX) > 25 && Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX < 0) {
              if (currentIdx < total - 1) goToBatch(currentIdx + 1, 'next');
            } else {
              if (currentIdx > 0) goToBatch(currentIdx - 1, 'prev');
            }
            if (slideMode !== 'manual') startAuto();
          }
        }
      }, { passive: true });

      if (slideMode !== 'manual') {
        card.addEventListener('mouseenter', stopAuto);
        card.addEventListener('mouseleave', startAuto);
        startAuto();
      }
    });
  }

  // ----------------------------------------------------------------------------
  // MULTI-LAYOUT STOREFRONT FOOTER & SOSIAL MEDIA LENGKAP
  // ----------------------------------------------------------------------------
  function renderSocialIconsList(settings = {}) {
    const iconCol = settings.footer_social_btn_icon_color || settings.footer_social_icon_color || '#64748b';
    const bgCol = settings.footer_social_btn_bg_color || '#f1f5f9';
    const hoverBg = settings.footer_social_btn_hover_bg_color || '#33b589';
    const hoverIcon = settings.footer_social_btn_hover_icon_color || '#ffffff';
    const borderEnable = Boolean(settings.footer_social_btn_border_enable);
    const borderCol = settings.footer_social_btn_border_color || '#e2e8f0';
    const radius = settings.footer_social_btn_radius || '9999px';
    const shadow = (settings.footer_social_btn_shadow && settings.footer_social_btn_shadow !== 'none') ? `shadow-${settings.footer_social_btn_shadow}` : 'shadow-2xs';
    const borderStyle = borderEnable ? `border: 1px solid ${borderCol};` : 'border: none;';

    const links = [];

    if (settings.footer_social_tiktok_active !== false && settings.footer_social_tiktok) {
      links.push({ icon: 'bi-tiktok', label: 'TikTok', url: settings.footer_social_tiktok });
    }
    if (settings.footer_social_instagram_active !== false && settings.footer_social_instagram) {
      links.push({ icon: 'bi-instagram', label: 'Instagram', url: settings.footer_social_instagram });
    }
    if (settings.footer_social_youtube_active !== false && settings.footer_social_youtube) {
      links.push({ icon: 'bi-youtube', label: 'YouTube', url: settings.footer_social_youtube });
    }
    if (settings.footer_social_facebook_active !== false && settings.footer_social_facebook) {
      links.push({ icon: 'bi-facebook', label: 'Facebook', url: settings.footer_social_facebook });
    }
    if (settings.footer_social_email_active !== false && settings.footer_social_email) {
      const emailUrl = settings.footer_social_email.startsWith('mailto:') ? settings.footer_social_email : `mailto:${settings.footer_social_email}`;
      links.push({ icon: 'bi-envelope-fill', label: 'Email', url: emailUrl });
    }
    const wa = settings.footer_social_whatsapp || settings.store_phone;
    if (settings.footer_social_whatsapp_active !== false && wa) {
      const clean = wa.replace(/[^0-9]/g, '');
      const cleanWa = clean.startsWith('0') ? '62' + clean.slice(1) : clean;
      links.push({ icon: 'bi-whatsapp', label: 'WhatsApp', url: `https://wa.me/${cleanWa}` });
    }

    if (links.length === 0) {
      links.push(
        { icon: 'bi-instagram', label: 'Instagram', url: 'https://instagram.com' },
        { icon: 'bi-tiktok', label: 'TikTok', url: 'https://tiktok.com' },
        { icon: 'bi-whatsapp', label: 'WhatsApp', url: 'https://wa.me/628885844380' }
      );
    }

    return links.map(item => `
      <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="group/icon w-9 h-9 flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 ${shadow}" style="background-color: ${bgCol}; color: ${iconCol}; border-radius: ${radius}; ${borderStyle}" onmouseenter="this.style.backgroundColor='${hoverBg}'; this.style.color='${hoverIcon}';" onmouseleave="this.style.backgroundColor='${bgCol}'; this.style.color='${iconCol}';" title="${escapeHtml(item.label)}" aria-label="${escapeHtml(item.label)}">
        <i class="bi ${item.icon} text-base transition-colors duration-200"></i>
      </a>
    `).join('');
  }

  // Global helper agar klik tautan kategori pada footer langsung memicu filter
  window.filterBuyerCategory = function(catId) {
    activeMainCategoryId = catId;
    activeQuickFilter = 'all';
    activeSubCategoryId = 'all';
    renderStorefront();
    bindStoreEvents();
    const targetEl = document.getElementById('katalog-section') || document.getElementById('quick-filter-container');
    if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
  };

  function renderStoreFooterHtml(settings = {}) {
    const layout = settings.footer_layout || 'multi_column';
    const storeName = settings.store_name || 'Songer Creative';
    const tagline = settings.store_tagline || 'Sistem Katalog E-Commerce & Percetakan Terpadu';
    const copyrightText = settings.footer_copyright_text || `© ${new Date().getFullYear()} ${storeName}. All rights reserved.`;

    const bgCol = settings.footer_bg_color || '#ffffff';
    const textCol = settings.footer_text_color || '#64748b';
    const headingCol = settings.footer_heading_color || '#0f172a';
    const borderCol = settings.footer_border_color || '#e2e8f0';

    const phone = (settings.store_phone || '0888-5844-380').replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const socialIconsHtml = renderSocialIconsList(settings);

    // Kontrol Logo Footer Terperinci
    const showLogo = settings.footer_show_logo !== false;
    const logoUrl = (settings.footer_logo_type === 'custom' && settings.footer_custom_logo_url)
      ? settings.footer_custom_logo_url
      : (settings.store_logo_url || 'assets/images/logo-songer-creative.png');

    const logoHtml = showLogo ? `
      <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(storeName)}" class="h-8 w-auto object-contain shrink-0" onerror="this.onerror=null; this.outerHTML='<span class=\\'font-black text-sm text-slate-800 tracking-tight\\'>${escapeHtml(storeName)}</span>';" />
    ` : '';

    // Kontrol Nama Toko & Slogan
    const showStoreName = settings.footer_show_store_name !== false;
    const storeNameCol = settings.footer_store_name_color || headingCol;
    const taglineCol = settings.footer_tagline_color || textCol;

    // Kategori Populer Dinamis dari Database & Checklist
    let categoriesToDisplay = [];
    if (Array.isArray(settings.footer_selected_categories) && settings.footer_selected_categories.length > 0) {
      const allDbCats = (typeof DB !== 'undefined' && DB.getCategories) ? DB.getCategories() : [];
      categoriesToDisplay = allDbCats.filter(c => settings.footer_selected_categories.includes(c.id));
    }
    if (categoriesToDisplay.length === 0) {
      const allDbCats = (typeof DB !== 'undefined' && DB.getCategories) ? DB.getCategories() : [];
      if (allDbCats.length > 0) {
        categoriesToDisplay = allDbCats.slice(0, 4);
      } else {
        categoriesToDisplay = [
          { id: 'c1', name: 'Digital Printing & Banner' },
          { id: 'c2', name: 'Stiker Vinyl & Label Kemasan' },
          { id: 'c3', name: 'Kartu Nama & Brosur Promosi' },
          { id: 'c4', name: 'Merchandise, Mug & Gantungan Kunci' }
        ];
      }
    }
    const catLinkCol = settings.footer_category_link_color || textCol;
    const catHoverCol = settings.footer_category_hover_color || '#33b589';

    const categoriesHtml = categoriesToDisplay.map(cat => `
      <li>
        <a href="javascript:void(0)" onclick="if(window.filterBuyerCategory){window.filterBuyerCategory('${escapeHtml(cat.id)}');}else{window.scrollTo({top: 400, behavior: 'smooth'});}" class="transition flex items-center gap-1.5" style="color: ${catLinkCol};" onmouseenter="this.style.color='${catHoverCol}'" onmouseleave="this.style.color='${catLinkCol}'">
          <i class="bi bi-chevron-right text-[10px]"></i> ${escapeHtml(cat.name)}
        </a>
      </li>
    `).join('');

    // 1. Layout 1: Minimalist Modern
    if (layout === 'minimalist') {
      return `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3 flex-wrap justify-center md:justify-start">
            ${logoHtml}
            ${logoHtml && showStoreName ? '<span class="text-slate-300 hidden sm:inline">•</span>' : ''}
            <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-center md:text-left">
              ${showStoreName ? `<span class="font-bold" style="color: ${storeNameCol};">${escapeHtml(storeName)}</span>` : ''}
              ${showStoreName ? '<span class="hidden sm:inline text-slate-300">•</span>' : ''}
              <span style="color: ${textCol};">${escapeHtml(copyrightText)}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            ${socialIconsHtml}
          </div>
        </div>
      `;
    }

    // 3. Layout 3: Centered Brand-First
    if (layout === 'centered') {
      return `
        <div class="max-w-3xl mx-auto px-4 py-10 text-center space-y-4">
          ${logoHtml ? `<div class="flex justify-center">${logoHtml}</div>` : ''}
          <div class="space-y-1">
            ${showStoreName ? `<h3 class="text-base font-extrabold" style="color: ${storeNameCol};">${escapeHtml(storeName)}</h3>` : ''}
            <p class="text-xs max-w-md mx-auto leading-relaxed" style="color: ${taglineCol};">${escapeHtml(tagline)}</p>
          </div>
          <div class="flex items-center justify-center gap-2.5 pt-2">
            ${socialIconsHtml}
          </div>
          <hr class="w-24 mx-auto my-4 border-t" style="border-color: ${borderCol};">
          <p class="text-xs" style="color: ${textCol};">${escapeHtml(copyrightText)}</p>
        </div>
      `;
    }

    // 2. Layout 2: Multi-Column E-Commerce (Default)
    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <!-- Kolom 1: Profil Toko & WhatsApp CS -->
          <div class="space-y-3">
            ${logoHtml}
            ${showStoreName ? `<h4 class="font-extrabold text-sm" style="color: ${storeNameCol};">${escapeHtml(storeName)}</h4>` : ''}
            <p class="text-xs leading-relaxed" style="color: ${taglineCol};">${escapeHtml(tagline)}</p>
            <div class="pt-1">
              <a href="https://wa.me/${cleanPhone}" target="_blank" class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition">
                <i class="bi bi-whatsapp"></i>
                <span>Konsultasi CS WhatsApp</span>
              </a>
            </div>
          </div>

          <!-- Kolom 2: Jam Operasional Workshop -->
          <div class="space-y-3">
            <h4 class="font-bold text-xs uppercase tracking-wider" style="color: ${headingCol};">Jam Operasional</h4>
            <div class="space-y-2 text-xs" style="color: ${textCol};">
              <div class="flex items-start gap-2">
                <i class="bi bi-clock text-emerald-600 text-sm shrink-0 mt-0.5"></i>
                <div>
                  <p class="font-semibold" style="color: ${headingCol};">Hari Kerja:</p>
                  <p>${escapeHtml(settings.footer_hours_weekday || 'Senin - Sabtu: 08:00 - 21:00 WIB')}</p>
                </div>
              </div>
              <div class="flex items-start gap-2">
                <i class="bi bi-calendar-check text-emerald-600 text-sm shrink-0 mt-0.5"></i>
                <div>
                  <p class="font-semibold" style="color: ${headingCol};">Akhir Pekan:</p>
                  <p>${escapeHtml(settings.footer_hours_weekend || 'Minggu & Hari Libur: 09:00 - 17:00 WIB')}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Kolom 3: Tautan Kategori Cepat -->
          <div class="space-y-3">
            <h4 class="font-bold text-xs uppercase tracking-wider" style="color: ${headingCol};">Kategori Populer</h4>
            <ul class="space-y-1.5 text-xs">
              ${categoriesHtml}
            </ul>
          </div>

          <!-- Kolom 4: Ikon Sosial Media & Legalitas Hak Cipta -->
          <div class="space-y-3">
            <h4 class="font-bold text-xs uppercase tracking-wider" style="color: ${headingCol};">Media Sosial Resmi</h4>
            <p class="text-xs" style="color: ${textCol};">Ikuti akun resmi kami untuk promo diskon dan inspirasi desain:</p>
            <div class="flex items-center gap-2 flex-wrap pt-1">
              ${socialIconsHtml}
            </div>
            <div class="pt-2 text-[11px]" style="color: ${textCol};">
              <span class="inline-flex items-center gap-1 text-emerald-600 font-bold"><i class="bi bi-shield-check"></i> 100% CMYK Color Guarantee</span>
            </div>
          </div>
        </div>

        <div class="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style="border-color: ${borderCol}; color: ${textCol};">
          <p>${escapeHtml(copyrightText)}</p>
          <p class="text-[11px] opacity-80">Sistem POS Kasir &amp; E-Commerce Terpadu</p>
        </div>
      </div>
    `;
  }

  function updateStoreFooter(customSettings = null) {
    const footerEl = document.getElementById('store-main-footer');
    if (!footerEl) return;
    const settings = customSettings || ((typeof DB !== 'undefined' && DB.getSettings) ? DB.getSettings() : {});
    footerEl.innerHTML = renderStoreFooterHtml(settings);
    footerEl.style.backgroundColor = settings.footer_bg_color || '#ffffff';
    footerEl.style.borderColor = settings.footer_border_color || '#e2e8f0';
  }

  // --- AUTO-DETECT SELLER SESSION ---
  function checkSellerSession() {
    const isSellerLoggedIn = sessionStorage.getItem('pos_admin_logged_in') === 'true';
    const banner = document.getElementById('seller-session-banner');
    if (banner) {
      if (isSellerLoggedIn) {
        banner.classList.remove('hidden');
        const storeNameEl = document.getElementById('seller-banner-store-name');
        const settings = DB.getSettings();
        if (storeNameEl) storeNameEl.textContent = settings.store_name || 'Songer Creative';
      } else {
        banner.classList.add('hidden');
      }
    }
  }

  // --- TOAST NOTIFICATION HELPER ---
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) {
      console.log(`[Toast ${type}]`, message);
      return;
    }

    const toast = document.createElement('div');
    const isSuccess = type === 'success';
    const isInfo = type === 'info';

    toast.className = `flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl text-xs font-semibold animate-slide-in pointer-events-auto transition-all duration-300 ${isSuccess
      ? 'bg-slate-900 text-white border-emerald-500 shadow-emerald-950/20'
      : isInfo
        ? 'bg-slate-900 text-white border-slate-700 shadow-slate-950/20'
        : 'bg-red-950 text-white border-red-600 shadow-red-950/20'
      }`;

    toast.innerHTML = `
      <i data-lucide="${isSuccess ? 'check-circle' : isInfo ? 'info' : 'alert-circle'}" class="w-4 h-4 ${isSuccess ? 'text-emerald-400' : isInfo ? 'text-blue-400' : 'text-red-400'} shrink-0"></i>
      <span class="flex-1">${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Global App fallback compatibility
  window.App = window.App || { showToast };

  function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(() => fallbackCopyText(text));
    }
    return fallbackCopyText(text);
  }

  function fallbackCopyText(text) {
    return new Promise((resolve, reject) => {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        textArea.remove();
        if (success) resolve();
        else reject(new Error('Copy command failed'));
      } catch (err) {
        reject(err);
      }
    });
  }

  function initFloatingVoucher() {
    const floatingBtn = document.getElementById('floating-voucher-btn') || document.getElementById('btn-toggle-voucher-drawer');
    const minimizedBtn = document.getElementById('floating-voucher-minimized');
    const btnCloseCapsule = document.getElementById('btn-close-floating-voucher') || document.getElementById('btn-close-voucher-widget');
    const btnCloseDrawer = document.getElementById('btn-close-voucher-drawer');
    const overlay = document.getElementById('voucher-drawer-overlay');
    const modal = document.getElementById('voucher-drawer-modal');
    const listEl = document.getElementById('voucher-drawer-list');

    if (!floatingBtn || !modal) return;

    // Sinkronisasi status tersimpan (sessionStorage)
    try {
      if (sessionStorage.getItem('voucher_widget_minimized') === 'true' && minimizedBtn) {
        floatingBtn.classList.add('hidden');
        minimizedBtn.classList.remove('hidden');
      } else {
        floatingBtn.classList.remove('hidden');
        if (minimizedBtn) minimizedBtn.classList.add('hidden');
      }
    } catch (e) { }

    function renderVouchers() {
      if (!listEl) return;
      const vouchers = (typeof DB !== 'undefined' && DB.getVouchers)
        ? DB.getVouchers().filter(v => v.is_active)
        : [];
      let claimed = [];
      try {
        claimed = JSON.parse(localStorage.getItem('pos_claimed_vouchers') || '[]');
      } catch (e) { }

      if (vouchers.length === 0) {
        listEl.innerHTML = `
          <div class="text-center py-12 px-4 space-y-2">
            <div class="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <i data-lucide="ticket" class="w-6 h-6"></i>
            </div>
            <p class="text-slate-600 font-bold text-xs">Belum Ada Voucher Aktif</p>
            <p class="text-slate-400 text-[11px]">Nantikan kupon diskon dan penawaran menarik berikutnya!</p>
          </div>
        `;
        if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
        return;
      }

      listEl.innerHTML = vouchers.map(v => {
        const isClaimed = claimed.includes(v.code);
        const discText = v.discount_type === 'percent'
          ? `${v.discount_value}% OFF`
          : `${formatIDR(v.discount_value)} OFF`;
        const minSpendText = v.min_spend > 0 ? formatIDR(v.min_spend) : 'Tanpa Minimum';
        const expDate = v.end_date || 'Berlaku Seterusnya';

        return `
          <div class="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col gap-3 relative overflow-hidden">
            <div class="absolute -right-4 -top-4 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
            
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-1 flex-1">
                <span class="inline-block px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-600 font-black text-[10px] uppercase tracking-wider">
                  ${discText}
                </span>
                <h4 class="font-bold text-sm text-slate-900 leading-snug">${escapeHtml(v.name)}</h4>
                
                <!-- Kode Promo -->
                <div class="flex items-center gap-2 pt-1">
                  <span class="text-[10px] font-semibold text-slate-500">Kode:</span>
                  <span class="font-mono font-black text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg tracking-wider select-all">
                    ${escapeHtml(v.code)}
                  </span>
                </div>

                <!-- Syarat & Tanggal Kedaluwarsa -->
                <div class="pt-1.5 space-y-1 text-[11px] text-slate-500">
                  <div class="flex items-center gap-1.5">
                    <i data-lucide="shopping-bag" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
                    <span>Min. Belanja: <strong class="text-slate-700 font-semibold">${minSpendText}</strong></span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
                    <span>Berlaku s.d: <strong class="text-amber-600 font-semibold">${escapeHtml(expDate)}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tombol Klaim / Salin Kode -->
            <div class="pt-2.5 border-t border-slate-100 border-dashed">
              <button type="button" class="btn-claim-voucher w-full py-2.5 rounded-xl font-bold text-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${isClaimed
            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-orange-500/20'
          }" data-code="${escapeHtml(v.code)}">
                <i data-lucide="${isClaimed ? 'check-check' : 'ticket'}" class="w-4 h-4"></i>
                <span>${isClaimed ? 'Salin Kode Kupon (Sudah Diklaim)' : 'Klaim / Salin Kode'}</span>
              </button>
            </div>
          </div>
        `;
      }).join('');

      if (window.lucide && typeof lucide.createIcons === 'function') {
        lucide.createIcons();
      }

      listEl.querySelectorAll('.btn-claim-voucher').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const code = btn.getAttribute('data-code');
          if (!code) return;

          copyTextToClipboard(code).then(() => {
            showToast(`Kode voucher "${code}" berhasil disalin & diterapkan! 🎁`, 'success');

            let c = [];
            try { c = JSON.parse(localStorage.getItem('pos_claimed_vouchers') || '[]'); } catch (e) { }
            if (!c.includes(code)) {
              c.push(code);
              localStorage.setItem('pos_claimed_vouchers', JSON.stringify(c));
            }

            try { sessionStorage.setItem('pending_voucher_code', code); } catch (e) { }

            const voucherInput = document.getElementById('cart-voucher-input');
            const applyBtn = document.getElementById('btn-apply-voucher');
            if (voucherInput) {
              voucherInput.value = code;
              if (applyBtn) {
                applyBtn.click();
              }
            } else {
              const subtotal = cart.reduce((sum, item) => sum + (item.subtotal || 0), 0);
              if (typeof DB !== 'undefined' && DB.validateVoucher) {
                const valRes = DB.validateVoucher(code, cart, subtotal);
                if (valRes && valRes.valid) {
                  appliedVoucher = valRes;
                }
              }
            }

            renderVouchers();
            setTimeout(closeDrawer, 700);
          }).catch(() => {
            showToast(`Gagal menyalin kode: ${code}`, 'error');
          });
        });
      });
    }

    function openDrawer() {
      renderVouchers();
      if (overlay) overlay.classList.remove('hidden');
      modal.classList.remove('hidden', 'pointer-events-none');
      void modal.offsetWidth; // Force layout reflow
      requestAnimationFrame(() => {
        if (overlay) overlay.classList.remove('opacity-0');
        modal.classList.remove('translate-y-full');
      });
      if (window.lucide && typeof lucide.createIcons === 'function') {
        lucide.createIcons();
      }
    }

    function closeDrawer() {
      if (overlay) overlay.classList.add('opacity-0');
      modal.classList.add('translate-y-full');
      setTimeout(() => {
        if (overlay) overlay.classList.add('hidden');
        modal.classList.add('hidden', 'pointer-events-none');
      }, 300);
    }

    // Ketika tombol (x) pada kapsul ditekan:
    function minimizeWidget(e) {
      if (e) e.stopPropagation();
      floatingBtn.classList.add('hidden');
      if (minimizedBtn) minimizedBtn.classList.remove('hidden');
      try { sessionStorage.setItem('voucher_widget_minimized', 'true'); } catch (e) { }
    }

    // Ketika tombol bulat minimalis diklik:
    function expandWidget(e) {
      if (e) e.stopPropagation();
      floatingBtn.classList.remove('hidden');
      if (minimizedBtn) minimizedBtn.classList.add('hidden');
      try { sessionStorage.removeItem('voucher_widget_minimized'); } catch (e) { }
      openDrawer();
    }

    // Event listener kapsul utama (selain tombol x)
    floatingBtn.addEventListener('click', (e) => {
      if (e.target.closest('#btn-close-floating-voucher') || e.target.closest('#btn-close-voucher-widget')) {
        minimizeWidget(e);
        return;
      }
      openDrawer();
    });

    if (btnCloseCapsule) {
      btnCloseCapsule.addEventListener('click', minimizeWidget);
    }

    if (minimizedBtn) {
      minimizedBtn.addEventListener('click', expandWidget);
    }

    if (btnCloseDrawer) {
      btnCloseDrawer.addEventListener('click', closeDrawer);
    }

    if (overlay) {
      overlay.addEventListener('click', closeDrawer);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeDrawer();
      }
    });
  }

  function escapeHtml(str) {
    if (typeof Utils !== 'undefined' && typeof Utils.escapeHtml === 'function') {
      return Utils.escapeHtml(str);
    }
    if (!str) return '';
    return str.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  return {
    init,
    renderStorefront,
    generateHeroSectionHtml,
    openCartDrawer,
    closeCartDrawer,
    updateCartBadge,
    getCart: () => [...cart],
    renderCardVariantA,
    renderCardVariantB,
    renderCardVariantC,
    renderProductCardV1: renderCardVariantA,
    renderProductCardV2: renderCardVariantB,
    renderProductCardV3: renderCardVariantC,
    renderSponsorDoubleWidthCard,
    renderSectionDividerHtml,
    renderFeaturedProductsSectionHtml,
    renderSponsorSectionHtml,
    renderPromoCardSectionHtml,
    renderStaticBannerSectionHtml,
    renderSocialIconsList,
    renderStoreFooterHtml,
    updateStoreFooter,
    initStorefrontSEO,
    setProductMetaSEO,
    restoreStorefrontSEO,
    getSanitizedCanonicalUrl,
    inferBusinessSchemaType,
    openProductDetailModal,
    closeProductDetailModal,
    getSmartVisibleBadges,
    getProductCustomBadges
  };
})();

window.BuyerStore = BuyerStore;




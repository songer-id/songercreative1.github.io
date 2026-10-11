/**
 * ==============================================================================
 * SONGER CREATIVE - ADMIN & POS KASIR CONTROLLER (ADMIN-APP.JS)
 * Panel Seller Center Mandiri, POS Kasir Offline, Kalkulator PxL, & Cetak Struk
 * ==============================================================================
 */

const AdminApp = (() => {
  // Application State
  let currentTenant = null;
  let currentView = 'dashboard'; // 'dashboard' (default) | 'orders' | 'products' | 'pos' | 'create-product' | 'edit-product' | 'categories' | 'promos' | 'vouchers' | 'sponsors' | 'reviews' | 'theme-branding' | 'settings'
  let isAuthenticated = false;

  // Order & Dashboard Filter State
  let ordersSearchQuery = '';
  let ordersStatusFilter = 'all';
  let ordersChannelFilter = 'all';
  let activeDetailOrderId = null;

  // POS Cashier State
  let posCart = [];
  let posCategoryFilter = 'ALL';
  let posSearchQuery = '';
  let posOrderPrefix = 'DnC'; // 'DnC' | 'CtK' | 'DsN' | 'SpL' | 'MANUAL'
  let posAppliedVoucher = null;
  let posVoucherDiscount = 0;
  let posActiveProductForCalc = null;
  let posActiveReceiptData = null;

  // ----------------------------------------------------------------------------
  // 1. INITIALIZATION & AUTHENTICATION
  // ----------------------------------------------------------------------------
  function init() {
    // Global File Upload Guard (Max 500KB)
    document.addEventListener('change', function(e) {
      if (e.target && e.target.type === 'file') {
        const files = e.target.files;
        if (files) {
          for(let i = 0; i < files.length; i++) {
            if(files[i].size > 500 * 1024) { // 500 KB limit
              if(typeof showToast === 'function') showToast('Ukuran gambar terlalu besar! Maksimal ukuran file adalah 500 KB agar tidak memenuhi penyimpanan lokal.', 'error');
              else alert('Ukuran gambar terlalu besar! Maksimal ukuran file adalah 500 KB agar tidak memenuhi penyimpanan lokal.');
              e.target.value = '';
              e.stopPropagation();
              e.preventDefault();
              return false;
            }
          }
        }
      }
    }, true);

    // 1. Check existing session
    const savedLogin = sessionStorage.getItem('pos_admin_logged_in');
    const savedStoreSlug = sessionStorage.getItem('pos_admin_store_slug');

    const urlParams = new URLSearchParams(window.location.search);
    const hashView = window.location.hash ? window.location.hash.replace('#', '') : null;
    const initialView = urlParams.get('view') || hashView || 'dashboard';

    if (savedLogin === 'true' && savedStoreSlug) {
      currentTenant = DB.resolveTenant(savedStoreSlug);
      isAuthenticated = true;
      hideLoginScreen();
      syncHeaderAndTheme();
      bindEvents();
      navigate(initialView);
    } else {
      // Pre-resolve tenant and pre-render product catalog so container is never blank
      currentTenant = DB.resolveTenant();
      syncHeaderAndTheme();
      // Default: show login screen
      showLoginScreen();
      bindLoginEvents();
      bindEvents();
      navigate(initialView);
    }
  }

  function showLoginScreen() {
    const loginOverlay = document.getElementById('admin-login-screen');
    if (loginOverlay) {
      loginOverlay.classList.remove('hidden');
    }
  }

  function hideLoginScreen() {
    const loginOverlay = document.getElementById('admin-login-screen');
    if (loginOverlay) {
      loginOverlay.classList.add('hidden');
    }
  }

  function bindLoginEvents() {
    const formLogin = document.getElementById('form-admin-login');
    const btnAutofill = document.getElementById('btn-autofill-demo');
    const storeInput = document.getElementById('login-store-id');
    const userInput = document.getElementById('login-username');
    const passInput = document.getElementById('login-password');
    const errorMsg = document.getElementById('login-error-msg');
    const errorText = document.getElementById('login-error-text');

    if (btnAutofill) {
      btnAutofill.addEventListener('click', () => {
        if (storeInput) storeInput.value = 'songer-creative-01';
        if (userInput) userInput.value = 'admin';
        if (passInput) passInput.value = 'admin123';
        if (errorMsg) errorMsg.classList.add('hidden');
      });
    }

    if (formLogin) {
      formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const storeId = storeInput ? storeInput.value.trim() : '';
        const user = userInput ? userInput.value.trim() : '';
        const pass = passInput ? passInput.value.trim() : '';

        if (!storeId || !user || !pass) {
          if (errorMsg && errorText) {
            errorText.textContent = 'Harap isi ID Toko, Username, dan Password.';
            errorMsg.classList.remove('hidden');
          }
          return;
        }

        const authResult = DB.authenticateAdmin(storeId, user, pass);
        if (authResult.success) {
          currentTenant = authResult.tenant;
          isAuthenticated = true;
          sessionStorage.setItem('pos_admin_logged_in', 'true');
          sessionStorage.setItem('pos_admin_store_slug', currentTenant.store_slug);

          if (errorMsg) errorMsg.classList.add('hidden');
          hideLoginScreen();
          syncHeaderAndTheme();
          const urlParams = new URLSearchParams(window.location.search);
          const hashView = window.location.hash ? window.location.hash.replace('#', '') : null;
          const targetView = urlParams.get('view') || hashView || 'dashboard';
          navigate(targetView);
          showToast(`Selamat datang, Admin ${currentTenant.store_name}!`, 'success');
        } else {
          if (errorMsg && errorText) {
            errorText.textContent = authResult.message || 'Kredensial tidak valid.';
            errorMsg.classList.remove('hidden');
          }
        }
      });
    }
  }

  function logout() {
    if (confirm('Apakah Anda yakin ingin keluar dari Admin Panel?')) {
      sessionStorage.removeItem('pos_admin_logged_in');
      sessionStorage.removeItem('pos_admin_store_slug');
      isAuthenticated = false;
      showLoginScreen();
      showToast('Berhasil keluar dari sesi admin.', 'info');
    }
  }

  // ----------------------------------------------------------------------------
  // 2. HEADER & BRAND THEME SYNCHRONIZATION
  // ----------------------------------------------------------------------------
  function syncHeaderAndTheme() {
    if (!currentTenant) {
      currentTenant = DB.getCurrentTenant();
    }
    const settings = DB.getSettings();

    // Document title
    document.title = `Admin & POS - ${settings.store_name || currentTenant.store_name}`;

    // Header info
    const logoEl = document.getElementById('header-brand-logo');
    if (logoEl && settings.web_logo) {
      logoEl.src = settings.web_logo;
      logoEl.alt = settings.store_name || currentTenant.store_name;
    }

    const storeNameEl = document.getElementById('header-store-name');
    if (storeNameEl) storeNameEl.textContent = settings.store_name || currentTenant.store_name;

    const tenantBadgeEl = document.getElementById('header-tenant-badge');
    if (tenantBadgeEl) tenantBadgeEl.textContent = currentTenant.store_slug;

    const taglineEl = document.getElementById('header-store-tagline');
    if (taglineEl) taglineEl.textContent = settings.store_tagline || currentTenant.store_tagline || 'Digital Printing & Percetakan Terpadu';

    // Sinkronisasi Visibilitas Logo & Nama Toko di Top Header Admin
    const adminLogoContainer = document.getElementById('admin-header-logo-container');
    const adminStoreInfoBox = document.getElementById('admin-header-store-info-box');
    const brandingMode = settings.navbar_branding_mode || (settings.header_use_logo === false ? 'text_only' : 'logo_landscape');
    const showHeaderStoreName = settings.show_header_store_name !== false;

    if (adminLogoContainer) {
      if (brandingMode === 'text_only') {
        adminLogoContainer.className = 'hidden';
      } else {
        adminLogoContainer.className = 'h-10 flex items-center shrink-0';
        const adminLogoImg = adminLogoContainer.querySelector('img');
        if (adminLogoImg) {
          if (brandingMode === 'logo_square') {
            adminLogoImg.className = 'h-8 w-8 sm:h-9 sm:w-9 aspect-square object-contain rounded-lg';
          } else {
            adminLogoImg.className = 'h-8 sm:h-9 w-auto max-w-[130px] sm:max-w-[150px] object-contain';
          }
        }
      }
    }

    if (adminStoreInfoBox) {
      if (brandingMode === 'text_only') {
        adminStoreInfoBox.className = 'border-l-0 pl-0 block';
      } else if (showHeaderStoreName) {
        adminStoreInfoBox.className = 'border-l border-slate-200 pl-3 hidden md:block';
      } else {
        adminStoreInfoBox.className = 'hidden';
      }
    }

    // Sidebar footer
    const sbName = document.getElementById('sidebar-store-name');
    if (sbName) sbName.textContent = settings.store_name || currentTenant.store_name;

    const sbTenant = document.getElementById('sidebar-tenant-slug');
    if (sbTenant) sbTenant.textContent = `Tenant: ${currentTenant.store_slug}`;

    // "Lihat Web Toko" button: updates target link with ?store={currentTenant.store_slug}
    const btnViewStore = document.getElementById('btn-view-live-store');
    if (btnViewStore) {
      btnViewStore.href = `index.html?store=${encodeURIComponent(currentTenant.store_slug)}`;
      btnViewStore.target = '_blank';
    }

    // Favicon update
    const faviconEl = document.getElementById('app-favicon');
    if (faviconEl && settings.browser_icon) {
      faviconEl.href = settings.browser_icon;
    }

    // Dynamic brand color css variables
    applyBrandTheme(settings);
  }

  function applyBrandTheme(settings) {
    const primaryColor = settings.primary_color || '#33b589';
    const primaryHover = settings.primary_hover_color || adjustColorBrightness(primaryColor, -15);
    const primarySubtle = hexToRgba(primaryColor, 0.12);

    const secondaryColor = settings.secondary_color || '#f59e0b';
    const secondaryHover = settings.secondary_hover_color || adjustColorBrightness(secondaryColor, -15);
    const secondarySubtle = hexToRgba(secondaryColor, 0.14);

    const root = document.documentElement;
    root.style.setProperty('--color-primary', primaryColor);
    root.style.setProperty('--color-primary-hover', primaryHover);
    root.style.setProperty('--color-primary-subtle', primarySubtle);

    root.style.setProperty('--color-secondary', secondaryColor);
    root.style.setProperty('--color-secondary-hover', secondaryHover);
    root.style.setProperty('--color-secondary-subtle', secondarySubtle);
  }

  function adjustColorBrightness(hex, percent) {
    if (!hex || typeof hex !== 'string') return '#28916d';
    let clean = hex.replace('#', '');
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    if (clean.length !== 6) return '#28916d';
    const num = parseInt(clean, 16);
    let r = (num >> 16) + Math.round(255 * (percent / 100));
    let g = ((num >> 8) & 0x00FF) + Math.round(255 * (percent / 100));
    let b = (num & 0x0000FF) + Math.round(255 * (percent / 100));
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  function hexToRgba(hex, alpha = 0.12) {
    if (!hex || typeof hex !== 'string') return `rgba(51, 181, 137, ${alpha})`;
    let clean = hex.replace('#', '');
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    if (clean.length !== 6) return `rgba(51, 181, 137, ${alpha})`;
    const num = parseInt(clean, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // ----------------------------------------------------------------------------
  // 3. EVENT BINDINGS (SIDEBAR, MODALS, BUTTONS)
  // ----------------------------------------------------------------------------
  function bindEvents() {
    // Logout
    const btnLogout = document.getElementById('btn-admin-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', logout);
    }

    // Tenant Switcher Modal
    const btnSwitchStore = document.getElementById('btn-switch-store-modal');
    if (btnSwitchStore) {
      btnSwitchStore.addEventListener('click', openTenantManagerModal);
    }
    const btnCloseTenant = document.getElementById('btn-close-tenant-modal');
    if (btnCloseTenant) {
      btnCloseTenant.addEventListener('click', closeTenantManagerModal);
    }
    const btnCreateTenant = document.getElementById('btn-create-tenant-action');
    if (btnCreateTenant) {
      btnCreateTenant.addEventListener('click', handleCreateNewTenant);
    }

    // Mobile Hamburger and Drawer Backdrop Controls
    const btnHamburger = document.getElementById('btn-sidebar-hamburger');
    const btnCloseMobileSidebar = document.getElementById('btn-close-sidebar-mobile');
    const backdropSidebar = document.getElementById('sidebar-mobile-backdrop');
    const sidebarEl = document.getElementById('admin-main-sidebar');

    const openMobileSidebar = () => {
      if (sidebarEl) sidebarEl.classList.remove('-translate-x-full');
      if (backdropSidebar) backdropSidebar.classList.remove('hidden');
    };

    const closeMobileSidebar = () => {
      if (sidebarEl) sidebarEl.classList.add('-translate-x-full');
      if (backdropSidebar) backdropSidebar.classList.add('hidden');
    };

    if (btnHamburger) btnHamburger.addEventListener('click', openMobileSidebar);
    if (btnCloseMobileSidebar) btnCloseMobileSidebar.addEventListener('click', closeMobileSidebar);
    if (backdropSidebar) backdropSidebar.addEventListener('click', closeMobileSidebar);

    const collapseDesktopSidebar = () => {
      if (sidebarEl) sidebarEl.classList.remove('is-expanded');
    };

    const expandDesktopSidebar = () => {
      if (sidebarEl) sidebarEl.classList.add('is-expanded');
    };

    const btnCollapseSidebar = document.getElementById('btn-collapse-sidebar');
    if (btnCollapseSidebar) {
      btnCollapseSidebar.addEventListener('click', (e) => {
        e.stopPropagation();
        collapseDesktopSidebar();
      });
    }

    // Sidebar navigation items
    const navDashboard = document.getElementById('admin-nav-dashboard');
    const navOrders = document.getElementById('admin-nav-orders');
    const navPos = document.getElementById('admin-nav-pos');
    const navProducts = document.getElementById('admin-nav-products');
    const navAddProduct = document.getElementById('admin-nav-add-product');
    const navCategories = document.getElementById('admin-nav-categories');
    const navPromos = document.getElementById('admin-nav-promos');
    const navVouchers = document.getElementById('admin-nav-vouchers');
    const navSponsors = document.getElementById('admin-nav-sponsors');
    const navReviews = document.getElementById('admin-nav-reviews');
    const navThemeBranding = document.getElementById('admin-nav-theme-branding');
    const navBrandingHero = document.getElementById('admin-nav-branding-hero');
    const navSettings = document.getElementById('admin-nav-settings');

    const handleNavClick = (viewName) => {
      closeMobileSidebar();
      expandDesktopSidebar();
      navigate(viewName);
    };

    if (navDashboard) navDashboard.addEventListener('click', () => handleNavClick('dashboard'));
    if (navOrders) navOrders.addEventListener('click', () => handleNavClick('orders'));
    if (navPos) navPos.addEventListener('click', () => handleNavClick('pos'));
    if (navProducts) navProducts.addEventListener('click', () => handleNavClick('products'));
    if (navAddProduct) navAddProduct.addEventListener('click', () => handleNavClick('create-product'));
    if (navCategories) navCategories.addEventListener('click', () => handleNavClick('categories'));
    if (navPromos) navPromos.addEventListener('click', () => handleNavClick('promos'));
    if (navVouchers) navVouchers.addEventListener('click', () => handleNavClick('vouchers'));
    if (navSponsors) navSponsors.addEventListener('click', () => handleNavClick('sponsors'));
    if (navReviews) navReviews.addEventListener('click', () => handleNavClick('reviews'));
    if (navThemeBranding) navThemeBranding.addEventListener('click', () => handleNavClick('theme-branding'));
    if (navBrandingHero) navBrandingHero.addEventListener('click', () => handleNavClick('theme-branding'));
    if (navSettings) navSettings.addEventListener('click', () => handleNavClick('theme-branding'));

    // Accordion group headers (Toko & Marketing)
    document.querySelectorAll('.admin-nav-group-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        expandDesktopSidebar();
        const group = btn.getAttribute('data-group');
        const submenu = document.getElementById(`submenu-${group}`);
        if (submenu) {
          submenu.classList.toggle('is-expanded');
          const chevron = btn.querySelector('.nav-group-chevron');
          if (chevron) {
            chevron.classList.toggle('rotate-180');
          }
        }
      });
    });

    // Mobile navigation quick buttons
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.getAttribute('data-view');
        if (v) handleNavClick(v);
      });
    });

    // POS Calculator Modal buttons
    const btnCloseCalc = document.getElementById('btn-close-pos-calc');
    const btnCancelCalc = document.getElementById('btn-cancel-pos-calc');
    const btnConfirmCalc = document.getElementById('btn-confirm-pos-calc');

    if (btnCloseCalc) btnCloseCalc.addEventListener('click', closePosCalculator);
    if (btnCancelCalc) btnCancelCalc.addEventListener('click', closePosCalculator);
    if (btnConfirmCalc) btnConfirmCalc.addEventListener('click', handleConfirmPosCalculator);

    // Thermal Receipt Modal buttons
    const btnCloseReceipt = document.getElementById('btn-close-receipt-modal');
    const btnDoneReceipt = document.getElementById('btn-close-receipt-done');
    const btnPrintReceipt = document.getElementById('btn-print-receipt-action');

    if (btnCloseReceipt) btnCloseReceipt.addEventListener('click', closeReceiptModal);
    if (btnDoneReceipt) btnDoneReceipt.addEventListener('click', closeReceiptModal);
    if (btnPrintReceipt) btnPrintReceipt.addEventListener('click', executeThermalPrint);

    // Order Detail Modal Buttons
    const btnCloseDetail = document.getElementById('btn-close-order-detail');
    const btnCloseDetailBottom = document.getElementById('btn-close-order-detail-bottom');
    const btnSaveDetailStatus = document.getElementById('btn-order-detail-save-status');
    const btnPrintDetailReceipt = document.getElementById('btn-order-detail-print-receipt');

    if (btnCloseDetail) btnCloseDetail.addEventListener('click', closeOrderDetailModal);
    if (btnCloseDetailBottom) btnCloseDetailBottom.addEventListener('click', closeOrderDetailModal);
    if (btnSaveDetailStatus) btnSaveDetailStatus.addEventListener('click', handleSaveOrderDetailStatus);
    if (btnPrintDetailReceipt) btnPrintDetailReceipt.addEventListener('click', handlePrintOrderDetailReceipt);
  }

  // ----------------------------------------------------------------------------
  // 4. NAVIGATION CONTROLLER
  // ----------------------------------------------------------------------------
  function navigate(viewName, param = null) {
    currentView = viewName;

    // View containers
    const views = {
      'dashboard': document.getElementById('view-dashboard'),
      'orders': document.getElementById('view-orders'),
      'pos': document.getElementById('view-pos-cashier'),
      'products': document.getElementById('view-product-list'),
      'list': document.getElementById('view-product-list'),
      'create-product': document.getElementById('view-product-form'),
      'create': document.getElementById('view-product-form'),
      'edit-product': document.getElementById('view-product-form'),
      'edit': document.getElementById('view-product-form'),
      'categories': document.getElementById('view-category-manager'),
      'promos': document.getElementById('view-promo-manager'),
      'vouchers': document.getElementById('view-promo-manager'),
      'sponsors': document.getElementById('view-promo-manager'),
      'reviews': document.getElementById('view-review-manager'),
      'theme-branding': document.getElementById('view-theme-branding') || document.getElementById('view-branding-hero'),
      'branding-hero': document.getElementById('view-theme-branding') || document.getElementById('view-branding-hero'),
      'settings': document.getElementById('view-theme-branding') || document.getElementById('view-settings')
    };

    // Hide all views
    Object.values(views).forEach(v => {
      if (v) v.classList.add('hidden');
    });

    // Update sidebar navigation active style and badges
    updateSidebarNavActive(viewName);

    // Show selected view & initialize corresponding module
    if (viewName === 'dashboard') {
      if (views.dashboard) views.dashboard.classList.remove('hidden');
      renderDashboardView();
    } else if (viewName === 'orders') {
      if (views.orders) views.orders.classList.remove('hidden');
      renderOrdersView();
    } else if (viewName === 'pos') {
      if (views.pos) views.pos.classList.remove('hidden');
      renderPOSCashier();
    } else if (viewName === 'products' || viewName === 'list') {
      const viewSec = document.getElementById('view-product-list');
      if (viewSec) viewSec.classList.remove('hidden');
      if (views.products) views.products.classList.remove('hidden');

      if (window.ProductList) {
        if (typeof ProductList.render === 'function') {
          ProductList.render();
        } else if (typeof ProductList.init === 'function') {
          ProductList.init();
        }
      }

      // Verifikasi kontainer #list-container benar-benar terisi HTML
      const listContainer = document.getElementById('list-container');
      if (listContainer && (!listContainer.innerHTML || listContainer.innerHTML.trim() === '')) {
        console.warn('[AdminApp] #list-container kosong setelah render, memicu fallback rendering...');
        if (window.DB && typeof DB.forceResetDemoData === 'function') {
          DB.forceResetDemoData();
        }
        if (window.ProductList && typeof ProductList.render === 'function') {
          ProductList.render();
        }
      }

      const prodsCount = (window.DB && typeof DB.getProducts === 'function') ? DB.getProducts().length : (window.DEMO_PRODUCTS_MASTER ? window.DEMO_PRODUCTS_MASTER.length : 0);
      console.log('ProductList rendered successfully, count:', prodsCount);
    } else if (viewName === 'create-product' || viewName === 'create') {
      if (views['create-product']) views['create-product'].classList.remove('hidden');
      if (typeof window.ProductForm !== 'undefined' || typeof ProductForm !== 'undefined') {
        const pf = window.ProductForm || ProductForm;
        if (typeof pf.init === 'function') pf.init();
        else if (typeof pf.initCreate === 'function') pf.initCreate();
      }
    } else if (viewName === 'edit-product' || viewName === 'edit') {
      if (views['edit-product']) views['edit-product'].classList.remove('hidden');
      if (typeof window.ProductForm !== 'undefined' || typeof ProductForm !== 'undefined') {
        const pf = window.ProductForm || ProductForm;
        if (typeof pf.initEdit === 'function') pf.initEdit(param);
      }
    } else if (viewName === 'categories') {
      if (views.categories) views.categories.classList.remove('hidden');
      if (typeof window.CategoryManager !== 'undefined' || typeof CategoryManager !== 'undefined') {
        (window.CategoryManager || CategoryManager).init();
      }
    } else if (viewName === 'promos') {
      if (views.promos) views.promos.classList.remove('hidden');
      if (typeof window.PromoManager !== 'undefined' || typeof PromoManager !== 'undefined') {
        (window.PromoManager || PromoManager).init('promos');
      }
    } else if (viewName === 'vouchers') {
      if (views.vouchers) views.vouchers.classList.remove('hidden');
      if (typeof window.PromoManager !== 'undefined' || typeof PromoManager !== 'undefined') {
        (window.PromoManager || PromoManager).init('vouchers');
      }
    } else if (viewName === 'sponsors') {
      if (views.sponsors) views.sponsors.classList.remove('hidden');
      if (typeof window.PromoManager !== 'undefined' || typeof PromoManager !== 'undefined') {
        (window.PromoManager || PromoManager).init('sponsors');
      }
    } else if (viewName === 'reviews') {
      if (views.reviews) views.reviews.classList.remove('hidden');
      if (typeof window.ReviewManager !== 'undefined' || typeof ReviewManager !== 'undefined') {
        (window.ReviewManager || ReviewManager).init();
      }
    } else if (viewName === 'theme-branding' || viewName === 'branding-hero' || viewName === 'settings') {
      if (views['theme-branding']) views['theme-branding'].classList.remove('hidden');
      renderThemeBrandingView();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => {
      if (window.lucide) window.lucide.createIcons();
    }, 40);
  }

  function updateSidebarNavActive(viewName) {
    const navDashboard = document.getElementById('admin-nav-dashboard');
    const navOrders = document.getElementById('admin-nav-orders');
    const navThemeBranding = document.getElementById('admin-nav-theme-branding') || document.getElementById('admin-nav-branding-hero');
    const navPos = document.getElementById('admin-nav-pos');
    const navProducts = document.getElementById('admin-nav-products');
    const navAddProduct = document.getElementById('admin-nav-add-product');
    const navCategories = document.getElementById('admin-nav-categories');
    const navReviews = document.getElementById('admin-nav-reviews');
    const navPromos = document.getElementById('admin-nav-promos');
    const navVouchers = document.getElementById('admin-nav-vouchers');
    const navSponsors = document.getElementById('admin-nav-sponsors');

    const navMap = [
      { key: 'dashboard', el: navDashboard },
      { key: 'orders', el: navOrders },
      { key: 'theme-branding', el: navThemeBranding },
      { key: 'branding-hero', el: navThemeBranding },
      { key: 'settings', el: navThemeBranding },
      { key: 'pos', el: navPos },
      { key: 'products', el: navProducts },
      { key: 'list', el: navProducts },
      { key: 'create-product', el: navAddProduct },
      { key: 'create', el: navAddProduct },
      { key: 'categories', el: navCategories },
      { key: 'reviews', el: navReviews },
      { key: 'promos', el: navPromos },
      { key: 'vouchers', el: navVouchers },
      { key: 'sponsors', el: navSponsors }
    ];

    // Determine auto-contrast based on sidebar background
    const sidebarEl = document.getElementById('admin-main-sidebar');
    const isDarkSidebar = sidebarEl && (sidebarEl.classList.contains('bg-slate-900') || sidebarEl.classList.contains('bg-slate-800'));
    const activeClass = isDarkSidebar ? 'is-active-dark' : 'is-active-light';
    const activeTailwind = isDarkSidebar 
      ? ['bg-emerald-600/20', 'text-emerald-400', 'font-bold', 'rounded-2xl', 'shadow-xs'] 
      : ['bg-emerald-50', 'text-emerald-700', 'font-bold', 'rounded-2xl', 'shadow-xs'];
    const obsoleteClasses = [
      'bg-emerald-50', 'text-emerald-700', 'text-emerald-800',
      'bg-emerald-600/20', 'text-emerald-400', 'bg-white/10', 'text-white',
      'font-black', 'font-bold', 'shadow-xs',
      'border-l-4', 'border-l-2', 'border-r-4', 'border-r-2', 'border-white', 'border-emerald-600', 'border-transparent',
      'is-active-dark', 'is-active-light'
    ];

    navMap.forEach(item => {
      if (item.el) {
        const isSelected = item.key === viewName || (viewName === 'edit' && item.key === 'products');
        const iconEl = item.el.querySelector('.nav-icon') || item.el.querySelector('i');
        if (isSelected) {
          item.el.classList.remove(...obsoleteClasses, 'text-slate-600', 'font-medium', 'hover:bg-slate-100', 'hover:text-slate-900');
          item.el.classList.add(...activeTailwind, activeClass);
          if (iconEl) {
            iconEl.classList.remove('text-slate-400', 'text-slate-500', 'text-slate-600');
            iconEl.classList.add('text-emerald-600');
          }
          
          // Auto-expand group submenu
          const parentSubmenu = item.el.closest('.nav-submenu');
          if (parentSubmenu) {
            parentSubmenu.classList.add('is-expanded');
          }
        } else {
          item.el.classList.remove(...obsoleteClasses);
          item.el.classList.add('text-slate-600', 'font-medium', 'rounded-2xl', 'hover:bg-slate-100', 'hover:text-slate-900');
          if (iconEl) {
            iconEl.classList.remove('text-emerald-600', 'text-emerald-400');
            iconEl.classList.add('text-slate-500');
          }
        }
      }
    });

    // SINKRONISASI INDUK SUBMENU: Menu Induk ("Toko" dan "Marketing & Promosi") WAJIB ikut menyala saat submenunya aktif
    const isTokoActive = ['products', 'list', 'create-product', 'create', 'categories', 'reviews', 'edit'].includes(viewName);
    const isMarketingActive = ['promos', 'vouchers', 'sponsors'].includes(viewName);

    const tokoGroupBtn = document.getElementById('admin-nav-group-toko-btn');
    const tokoGroupIcon = document.getElementById('admin-nav-group-toko-icon');
    if (tokoGroupBtn && tokoGroupIcon) {
      if (isTokoActive) {
        tokoGroupIcon.classList.remove('text-slate-600', 'text-slate-400');
        tokoGroupIcon.classList.add('text-emerald-600');
        tokoGroupBtn.classList.add('text-emerald-700');
        tokoGroupBtn.classList.remove('text-slate-700');
      } else {
        tokoGroupIcon.classList.remove('text-emerald-600');
        tokoGroupIcon.classList.add('text-slate-600');
        tokoGroupBtn.classList.remove('text-emerald-700');
        tokoGroupBtn.classList.add('text-slate-700');
      }
    }

    const mktGroupBtn = document.getElementById('admin-nav-group-marketing-btn');
    const mktGroupIcon = document.getElementById('admin-nav-group-marketing-icon');
    if (mktGroupBtn && mktGroupIcon) {
      if (isMarketingActive) {
        mktGroupIcon.classList.remove('text-slate-600', 'text-slate-400');
        mktGroupIcon.classList.add('text-emerald-600');
        mktGroupBtn.classList.add('text-emerald-700');
        mktGroupBtn.classList.remove('text-slate-700');
      } else {
        mktGroupIcon.classList.remove('text-emerald-600');
        mktGroupIcon.classList.add('text-slate-600');
        mktGroupBtn.classList.remove('text-emerald-700');
        mktGroupBtn.classList.add('text-slate-700');
      }
    }

    // Also update mobile quick nav buttons
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      const v = btn.getAttribute('data-view');
      const isMatch = v === viewName || 
                      (viewName === 'edit' && v === 'products') || 
                      (viewName === 'list' && v === 'products') ||
                      (viewName === 'create' && v === 'create-product') ||
                      (v === 'theme-branding' && (viewName === 'branding-hero' || viewName === 'settings'));
      if (isMatch) {
        btn.classList.add('bg-emerald-50', 'text-emerald-700', 'font-bold');
        btn.classList.remove('text-slate-600', 'font-medium', 'hover:bg-slate-100');
      } else {
        btn.classList.remove('bg-emerald-50', 'text-emerald-700', 'font-bold');
        btn.classList.add('text-slate-600', 'font-medium', 'hover:bg-slate-100');
      }
    });

    // Update real-time sidebar badges
    try {
      const allOrders = DB.getOrders();
      const pendingOrders = allOrders.filter(o => o.status === 'PENDING' || o.status === 'WAITING' || !o.status);
      const badgeDashboard = document.getElementById('sidebar-badge-orders-dashboard');
      const badgeOrders = document.getElementById('sidebar-badge-orders');
      if (badgeDashboard) {
        if (pendingOrders.length > 0) {
          badgeDashboard.textContent = pendingOrders.length;
          badgeDashboard.classList.remove('hidden');
        } else {
          badgeDashboard.classList.add('hidden');
        }
      }
      if (badgeOrders) {
        if (pendingOrders.length > 0) {
          badgeOrders.textContent = pendingOrders.length;
          badgeOrders.classList.remove('hidden');
        } else {
          badgeOrders.classList.add('hidden');
        }
      }

      const allReviews = DB.getReviews(null, false);
      const pendingReviews = allReviews.filter(r => !r.is_approved && r.status !== 'rejected');
      const badgeReviews = document.getElementById('sidebar-badge-reviews');
      if (badgeReviews) {
        badgeReviews.textContent = `Ulasan [ ${pendingReviews.length} ]`;
        if (pendingReviews.length > 0) {
          badgeReviews.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800';
        } else {
          badgeReviews.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500';
        }
      }
    } catch (e) {
      console.warn('Error updating sidebar badges:', e);
    }
  }

  // ----------------------------------------------------------------------------
  // 5. POS KASIR OFFLINE & TRANSACTION ENGINE
  // ----------------------------------------------------------------------------
  function renderPOSCashier() {
    const container = document.getElementById('pos-cashier-container');
    if (!container) return;

    const categories = DB.getCategories();
    const settings = DB.getSettings();
    const currentCounter = DB.getNextOrderCounter();
    const dateNow = new Date();
    const invoicePreview = window.InvoiceGenerator
      ? InvoiceGenerator.formatInvoiceNumber({
          channel: 'B_POS',
          labelCode: posOrderPrefix,
          counter: currentCounter,
          date: dateNow
        })
      : `B-${posOrderPrefix}-${String(currentCounter).padStart(5, '0')}-${String(dateNow.getMonth() + 1).padStart(2, '0')}${String(dateNow.getFullYear()).slice(-2)}`;

    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- LEFT COLUMN: PRODUCT TOUCH CATALOG (7 COLS) -->
        <div class="lg:col-span-7 space-y-4">
          
          <!-- Top Filter Bar -->
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div class="flex items-center justify-between gap-3">
              <div class="relative flex-1">
                <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                <input type="text" id="pos-search-input" value="${escapeHtml(posSearchQuery)}" placeholder="Cari nama produk / SKU kasir..." class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition" />
              </div>
              <button type="button" id="pos-btn-clear-search" class="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition ${posSearchQuery ? '' : 'hidden'}">
                Reset
              </button>
            </div>

            <!-- Category Pills -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <button type="button" class="pos-cat-pill px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${posCategoryFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-cat-id="ALL">
                Semua (${DB.getActiveProducts().length})
              </button>
              ${categories.map(c => `
                <button type="button" class="pos-cat-pill px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${posCategoryFilter === c.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-cat-id="${c.id}">
                  ${escapeHtml(c.name)}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Product Touch Grid -->
          <div id="pos-product-grid" class="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            <!-- Dynamic products rendered via renderPosProductsGrid() -->
          </div>

        </div>

        <!-- RIGHT COLUMN: CASHIER REGISTER & INVOICE TICKET (5 COLS) -->
        <div class="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-lg p-5 space-y-4">
          
          <!-- Invoice Header & Category Prefix Picker -->
          <div class="pb-3 border-b border-slate-100 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Faktur Penjualan Kasir</span>
                <span id="pos-invoice-code-preview" class="font-mono font-black text-sm text-emerald-800 tracking-tight">${invoicePreview}</span>
              </div>
              <div class="text-right">
                <span class="text-[10px] text-slate-400 block">Kanal Transaksi</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase">POS Offline (B)</span>
              </div>
            </div>

            <!-- Order Prefix Selector -->
            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-1">Prefix Label Order / Faktur:</label>
              <select id="pos-select-order-prefix" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-slate-50 text-slate-800 outline-none focus:border-emerald-500">
                <option value="DnC" ${posOrderPrefix === 'DnC' ? 'selected' : ''}>DnC - Desain & Cetak</option>
                <option value="CtK" ${posOrderPrefix === 'CtK' ? 'selected' : ''}>CtK - Cetak Saja (File Siap)</option>
                <option value="DsN" ${posOrderPrefix === 'DsN' ? 'selected' : ''}>DsN - Jasa Desain Saja</option>
                <option value="SpL" ${posOrderPrefix === 'SpL' ? 'selected' : ''}>SpL - Souvenir & Display</option>
                <option value="MANUAL" ${posOrderPrefix === 'MANUAL' ? 'selected' : ''}>MANUAL - Tanpa Prefix (Standard)</option>
              </select>
            </div>

            <!-- Customer Identity -->
            <div class="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label class="block text-[10px] font-semibold text-slate-500 mb-0.5">Nama Pembeli:</label>
                <input type="text" id="pos-customer-name" placeholder="Pelanggan Umum" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold text-slate-500 mb-0.5">No. WhatsApp / HP:</label>
                <input type="text" id="pos-customer-phone" placeholder="08..." class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono outline-none focus:border-emerald-500" />
              </div>
            </div>
          </div>

          <!-- Items Basket List -->
          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Item Pesanan (<span id="pos-cart-count">${posCart.length}</span>)</span>
              ${posCart.length > 0 ? `
                <button type="button" id="pos-btn-clear-cart" class="text-red-500 hover:text-red-700 text-[11px] font-semibold">
                  Kosongkan
                </button>
              ` : ''}
            </div>

            <div id="pos-cart-items-container" class="space-y-2 max-h-56 overflow-y-auto pr-1">
              <!-- Cart items rendered via renderPosCartItems() -->
            </div>
          </div>

          <!-- Financial Calculation & Voucher -->
          <div class="pt-3 border-t border-slate-100 space-y-2.5 text-xs">
            
            <!-- Voucher Field -->
            <div class="flex items-center gap-2">
              <input type="text" id="pos-voucher-input" placeholder="Kode Voucher Promo" class="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono uppercase font-bold outline-none focus:border-emerald-500" />
              <button type="button" id="pos-btn-apply-voucher" class="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition">
                Terapkan
              </button>
            </div>
            ${posAppliedVoucher ? `
              <div class="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 flex items-center justify-between">
                <span>Voucher <strong>${escapeHtml(posAppliedVoucher.code)}</strong> aktif</span>
                <button type="button" id="pos-btn-cancel-voucher" class="text-red-600 font-bold hover:underline">Hapus</button>
              </div>
            ` : ''}

            <!-- Subtotal & Grand Total -->
            <div class="space-y-1 text-slate-600">
              <div class="flex justify-between">
                <span>Subtotal Item:</span>
                <span id="pos-summary-subtotal" class="font-mono font-bold text-slate-800">Rp 0</span>
              </div>
              <div class="flex justify-between text-emerald-600 ${posVoucherDiscount > 0 ? '' : 'hidden'}" id="pos-row-discount">
                <span>Diskon Voucher:</span>
                <span id="pos-summary-discount" class="font-mono font-bold">-Rp 0</span>
              </div>
              <div class="flex justify-between pt-1 border-t border-slate-200 text-sm font-extrabold text-slate-900">
                <span>Grand Total:</span>
                <span id="pos-summary-grand-total" class="font-mono text-emerald-700 text-base">Rp 0</span>
              </div>
            </div>

            <!-- Cash Payment Section -->
            <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div class="flex items-center justify-between">
                <label class="text-[11px] font-bold text-slate-700">Uang Diterima (Tunai):</label>
                <div class="relative w-36">
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">Rp</span>
                  <input type="number" id="pos-cash-input" min="0" placeholder="0" class="w-full pl-8 pr-2 py-1 rounded-lg border border-slate-300 font-mono text-xs font-black text-right outline-none focus:border-emerald-500" />
                </div>
              </div>

              <!-- Quick Cash Chips -->
              <div class="flex items-center gap-1.5 flex-wrap">
                <button type="button" class="pos-chip-cash px-2 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100 transition" data-amount="PAS">Uang Pas</button>
                <button type="button" class="pos-chip-cash px-2 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100 transition" data-amount="50000">50.000</button>
                <button type="button" class="pos-chip-cash px-2 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100 transition" data-amount="100000">100.000</button>
                <button type="button" class="pos-chip-cash px-2 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100 transition" data-amount="200000">200.000</button>
                <button type="button" class="pos-chip-cash px-2 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-100 transition" data-amount="500000">500.000</button>
              </div>

              <!-- Change calculation -->
              <div class="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
                <span class="font-bold text-slate-700">Kembalian:</span>
                <span id="pos-change-display" class="font-mono font-black text-emerald-700 text-sm">Rp 0</span>
              </div>
            </div>

            <!-- Process & Print Receipt Action Button -->
            <button type="button" id="pos-btn-submit-order" class="w-full py-3 rounded-2xl btn-primary-brand text-white text-xs font-bold shadow-lg flex items-center justify-center gap-2 hover:shadow-emerald-200/50 transition">
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span>Proses Bayar & Pratinjau Struk Thermal</span>
            </button>

          </div>

        </div>

        <!-- PENGATURAN FORMAT STRUK THERMAL KASIR (DIPINDAHKAN KE OPERASIONAL KASIR) -->
        <div class="lg:col-span-12 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <i data-lucide="printer" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="font-extrabold text-sm sm:text-base text-slate-900">Pengaturan Format Cetak Struk Kasir</h3>
                <p class="text-xs text-slate-500">Sesuaikan lebar kertas printer thermal Bluetooth/USB, judul kepala nota, dan footer struk.</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" id="pos-btn-test-receipt" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5">
                <i data-lucide="file-text" class="w-4 h-4"></i>
                <span>Tes Contoh Struk</span>
              </button>
              <button type="button" id="pos-btn-save-receipt-settings" class="btn-primary-brand px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition hover:brightness-105">
                <i data-lucide="save" class="w-4 h-4"></i>
                <span>Simpan Pengaturan Struk</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Lebar Kertas Printer:</label>
              <select id="pos-setting-paper-width" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold outline-none focus:border-emerald-500 bg-white">
                <option value="58mm" ${(settings.printer_paper_width || '58mm') === '58mm' ? 'selected' : ''}>Thermal 58mm (Kompak - 32 Karakter)</option>
                <option value="80mm" ${(settings.printer_paper_width || '58mm') === '80mm' ? 'selected' : ''}>Thermal 80mm (Lebar - 44 Karakter)</option>
              </select>
              <span class="text-[10px] text-slate-400 block mt-1">Standar printer kasir mini bluetooth (58mm) atau desktop POS (80mm).</span>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Header Nota (Kepala Struk):</label>
              <input type="text" id="pos-setting-receipt-header" value="${escapeHtml(settings.receipt_header || settings.store_name || 'Songer Creative')}" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold outline-none focus:border-emerald-500" placeholder="Songer Creative" />
              <span class="text-[10px] text-slate-400 block mt-1">Dicetak di baris paling atas struk.</span>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Footer Nota (Catatan Kaki Struk):</label>
              <input type="text" id="pos-setting-receipt-footer" value="${escapeHtml(settings.receipt_footer || 'Terima kasih atas pesanan Anda!')}" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-medium outline-none focus:border-emerald-500" placeholder="Terima kasih atas pesanan Anda!" />
              <span class="text-[10px] text-slate-400 block mt-1">Dicetak di bagian penutup struk bukti pembayaran.</span>
            </div>
          </div>
        </div>

      </div>
    `;

    bindPosEvents();
    renderPosProductsGrid();
    renderPosCartItems();
    updatePosFinancialSummary();

    if (window.lucide) window.lucide.createIcons();
  }

  function bindPosEvents() {
    // Search input
    const searchInput = document.getElementById('pos-search-input');
    const btnClearSearch = document.getElementById('pos-btn-clear-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        posSearchQuery = e.target.value.toLowerCase().trim();
        if (btnClearSearch) {
          if (posSearchQuery) btnClearSearch.classList.remove('hidden');
          else btnClearSearch.classList.add('hidden');
        }
        renderPosProductsGrid();
      });
    }

    if (btnClearSearch) {
      btnClearSearch.addEventListener('click', () => {
        posSearchQuery = '';
        if (searchInput) searchInput.value = '';
        btnClearSearch.classList.add('hidden');
        renderPosProductsGrid();
      });
    }

    // Category pills
    const pills = document.querySelectorAll('.pos-cat-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        posCategoryFilter = pill.getAttribute('data-cat-id');
        pills.forEach(p => {
          if (p.getAttribute('data-cat-id') === posCategoryFilter) {
            p.className = 'pos-cat-pill px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap bg-slate-900 text-white';
          } else {
            p.className = 'pos-cat-pill px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap bg-slate-100 text-slate-600 hover:bg-slate-200';
          }
        });
        renderPosProductsGrid();
      });
    });

    // Order prefix selector
    const selectPrefix = document.getElementById('pos-select-order-prefix');
    if (selectPrefix) {
      selectPrefix.addEventListener('change', (e) => {
        posOrderPrefix = e.target.value;
        const currentCounter = DB.getNextOrderCounter();
        const dateNow = new Date();
        const invoicePreview = window.InvoiceGenerator
          ? InvoiceGenerator.formatInvoiceNumber({
              channel: 'B_POS',
              labelCode: posOrderPrefix,
              counter: currentCounter,
              date: dateNow
            })
          : `B-${posOrderPrefix}-${String(currentCounter).padStart(5, '0')}`;
        const previewEl = document.getElementById('pos-invoice-code-preview');
        if (previewEl) previewEl.textContent = invoicePreview;
      });
    }

    // Clear cart
    const btnClearCart = document.getElementById('pos-btn-clear-cart');
    if (btnClearCart) {
      btnClearCart.addEventListener('click', () => {
        if (confirm('Kosongkan semua item di keranjang kasir?')) {
          posCart = [];
          posAppliedVoucher = null;
          posVoucherDiscount = 0;
          renderPosCartItems();
          updatePosFinancialSummary();
          showToast('Keranjang kasir telah dikosongkan.', 'info');
        }
      });
    }

    // Voucher apply
    const btnApplyVoucher = document.getElementById('pos-btn-apply-voucher');
    const voucherInput = document.getElementById('pos-voucher-input');
    if (btnApplyVoucher && voucherInput) {
      btnApplyVoucher.addEventListener('click', () => {
        const code = voucherInput.value.trim().toUpperCase();
        if (!code) {
          showToast('Masukkan kode voucher promo terlebih dahulu.', 'error');
          return;
        }
        applyVoucherCode(code);
      });
    }

    const btnCancelVoucher = document.getElementById('pos-btn-cancel-voucher');
    if (btnCancelVoucher) {
      btnCancelVoucher.addEventListener('click', () => {
        posAppliedVoucher = null;
        posVoucherDiscount = 0;
        updatePosFinancialSummary();
        renderPOSCashier();
        showToast('Voucher belanja dibatalkan.', 'info');
      });
    }

    // Cash Input
    const cashInput = document.getElementById('pos-cash-input');
    if (cashInput) {
      cashInput.addEventListener('input', updatePosFinancialSummary);
    }

    // Quick Cash Chips
    const cashChips = document.querySelectorAll('.pos-chip-cash');
    cashChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const amountType = chip.getAttribute('data-amount');
        const grandTotal = calculateGrandTotal();
        if (amountType === 'PAS') {
          if (cashInput) cashInput.value = grandTotal;
        } else {
          const val = parseInt(amountType, 10) || 0;
          if (cashInput) cashInput.value = val;
        }
        updatePosFinancialSummary();
      });
    });

    // Process & Print Receipt Action
    const btnSubmitOrder = document.getElementById('pos-btn-submit-order');
    if (btnSubmitOrder) {
      btnSubmitOrder.addEventListener('click', handleProcessOrderAndPreviewReceipt);
    }

    // Save thermal receipt settings
    const btnSaveReceipt = document.getElementById('pos-btn-save-receipt-settings');
    if (btnSaveReceipt) {
      btnSaveReceipt.addEventListener('click', () => {
        const curSettings = DB.getSettings();
        const paperWidth = document.getElementById('pos-setting-paper-width')?.value || '58mm';
        const header = document.getElementById('pos-setting-receipt-header')?.value.trim() || curSettings.store_name;
        const footer = document.getElementById('pos-setting-receipt-footer')?.value.trim() || 'Terima kasih atas pesanan Anda!';

        DB.saveSettings({
          ...curSettings,
          printer_paper_width: paperWidth,
          receipt_header: header,
          receipt_footer: footer
        });
        showToast('Pengaturan format struk thermal kasir berhasil disimpan!', 'success');
      });
    }

    // Test print sample receipt
    const btnTestReceipt = document.getElementById('pos-btn-test-receipt');
    if (btnTestReceipt) {
      btnTestReceipt.addEventListener('click', () => {
        const curSettings = DB.getSettings();
        const paperWidth = document.getElementById('pos-setting-paper-width')?.value || curSettings.printer_paper_width || '58mm';
        const header = document.getElementById('pos-setting-receipt-header')?.value.trim() || curSettings.store_name;
        const footer = document.getElementById('pos-setting-receipt-footer')?.value.trim() || 'Terima kasih atas pesanan Anda!';

        posActiveReceiptData = {
          invoice_number: 'B-DnC-00001',
          order_prefix: 'DnC',
          channel: 'B_POS',
          customer_name: 'Budi Santoso (Pelanggan Contoh)',
          customer_phone: '0812-3456-7890',
          items: [
            {
              name: 'Spanduk Banner Fleksi 280gsm',
              orderCategory: 'DnC',
              specsText: '300x100cm (3.00m²) | Standar Fleksi | Mata Ayam 4 Sudut',
              unitPrice: 90000,
              qty: 1,
              subtotal: 90000
            },
            {
              name: 'Kartu Nama Bisnis Premium 1 Box',
              orderCategory: 'Ctk',
              specsText: 'Art Carton 310gsm Laminasi Doff',
              unitPrice: 45000,
              qty: 2,
              subtotal: 90000
            }
          ],
          subtotal: 180000,
          discount: 20000,
          voucher_code: 'HEMAT20',
          total: 160000,
          cash: 200000,
          change: 40000,
          payment_method: 'CASH',
          status: 'PAID',
          paper_width: paperWidth,
          store_name: header,
          store_address: curSettings.store_address || 'Jl. Percetakan Terpadu No. 1',
          store_phone: curSettings.store_phone || '0888-5844-380',
          receipt_footer: footer,
          created_at: new Date().toISOString()
        };

        renderThermalReceiptText(posActiveReceiptData);
        const modal = document.getElementById('modal-thermal-receipt');
        if (modal) modal.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
      });
    }
  }

  function renderPosProductsGrid() {
    const grid = document.getElementById('pos-product-grid');
    if (!grid) return;

    let products = DB.getActiveProducts();

    // Filter by Category
    if (posCategoryFilter !== 'ALL') {
      products = products.filter(p => p.category_id === posCategoryFilter);
    }

    // Filter by Search Query
    if (posSearchQuery) {
      products = products.filter(p => 
        (p.name || '').toLowerCase().includes(posSearchQuery) ||
        (p.order_category || '').toLowerCase().includes(posSearchQuery) ||
        (p.description || '').toLowerCase().includes(posSearchQuery)
      );
    }

    if (products.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
          <p class="text-xs font-semibold">Tidak ada produk ditemukan di kategori ini.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    grid.innerHTML = products.map(prod => {
      const priceText = formatProductDisplayPrice(prod);
      const isCustomMeter = prod.price_type === 1; // Meteran PxL
      const hasOptions = prod.options && prod.options.length > 0;

      return `
        <div class="pos-product-card bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition p-2.5 flex flex-col justify-between cursor-pointer group" data-product-id="${prod.id}">
          <div class="space-y-2">
            <div class="aspect-square w-full rounded-xl overflow-hidden bg-slate-100 relative">
              <img src="${escapeHtml(prod.image_url || 'assets/images/logo-songer-creative.png')}" alt="${escapeHtml(prod.name)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" onerror="this.src='assets/images/logo-songer-creative.png'" />
              <span class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                ${escapeHtml(prod.order_category || 'Ctk')}
              </span>
              ${isCustomMeter ? `
                <span class="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-600 text-white shadow-xs">
                  Meteran PxL
                </span>
              ` : ''}
            </div>
            <div>
              <h4 class="font-bold text-xs text-slate-800 line-clamp-2 leading-tight group-hover:text-emerald-700 transition">
                ${escapeHtml(prod.name)}
              </h4>
            </div>
          </div>

          <div class="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
            <span class="font-mono font-extrabold text-xs text-emerald-700">
              ${priceText}
            </span>
            <button type="button" class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition shadow-xs">
              <i data-lucide="${isCustomMeter || hasOptions ? 'calculator' : 'plus'}" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Bind card click event
    const cards = grid.querySelectorAll('.pos-product-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const prodId = card.getAttribute('data-product-id');
        const prod = DB.getProductById(prodId);
        if (!prod) return;

        if (prod.price_type === 1 || (prod.options && prod.options.length > 0)) {
          // Open custom meter / options calculator modal
          openPosCalculator(prod);
        } else {
          // Direct add fixed price item to cashier cart
          addFixedItemToCart(prod);
        }
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function formatProductDisplayPrice(prod) {
    if (prod.price_type === 1) {
      const minPrice = prod.materials && prod.materials.length > 0 ? Math.min(...prod.materials.map(m => m.price_per_m2)) : 25000;
      return `Rp ${minPrice.toLocaleString('id-ID')}/m²`;
    }
    if (prod.price_type === 2 && prod.quantity_tiers && prod.quantity_tiers.length > 0) {
      return `Rp ${prod.quantity_tiers[0].price_per_unit.toLocaleString('id-ID')}/lbr`;
    }
    if (prod.price_type === 3 && prod.options && prod.options.length > 0) {
      return `Rp ${prod.options[0].price.toLocaleString('id-ID')}`;
    }
    if (prod.price_type === 4 && prod.packages && prod.packages.length > 0) {
      return `Rp ${prod.packages[0].price.toLocaleString('id-ID')}`;
    }
    return `Rp ${(prod.price || 0).toLocaleString('id-ID')}`;
  }

  function addFixedItemToCart(prod) {
    let unitPrice = prod.price || 0;
    if (prod.price_type === 3 && prod.options && prod.options.length > 0) {
      unitPrice = prod.options[0].price;
    } else if (prod.price_type === 4 && prod.packages && prod.packages.length > 0) {
      unitPrice = prod.packages[0].price;
    } else if (prod.price_type === 2 && prod.quantity_tiers && prod.quantity_tiers.length > 0) {
      unitPrice = prod.quantity_tiers[0].price_per_unit;
    }

    // Apply active monthly discount if any
    let finalUnitPrice = unitPrice;
    if (prod.has_monthly_discount && prod.discount_value > 0) {
      if (prod.discount_type === 'percent') {
        finalUnitPrice = Math.round(unitPrice * (1 - (prod.discount_value / 100)));
      } else {
        finalUnitPrice = Math.max(0, unitPrice - prod.discount_value);
      }
    }

    // Check if already in cart
    const existingIndex = posCart.findIndex(item => item.productId === prod.id && !item.isCustomMeter);
    if (existingIndex > -1) {
      posCart[existingIndex].qty += 1;
      posCart[existingIndex].subtotal = posCart[existingIndex].qty * posCart[existingIndex].unitPrice;
    } else {
      posCart.push({
        id: generateUUID(),
        productId: prod.id,
        name: prod.name,
        orderCategory: prod.order_category || 'Ctk',
        specsText: 'Item Standar / Ready',
        unitPrice: finalUnitPrice,
        qty: 1,
        subtotal: finalUnitPrice,
        isCustomMeter: false
      });
    }

    renderPosCartItems();
    updatePosFinancialSummary();
    showToast(`"${prod.name}" ditambahkan ke keranjang kasir.`, 'success');
  }

  // ----------------------------------------------------------------------------
  // 6. POS CUSTOM CALCULATOR MODAL (PXL METERAN & FINISHING)
  // ----------------------------------------------------------------------------
  function openPosCalculator(prod) {
    posActiveProductForCalc = prod;

    const modal = document.getElementById('modal-pos-calculator');
    const titleEl = document.getElementById('pos-calc-modal-title');
    const dimArea = document.getElementById('pos-calc-dimensions-area');
    const matSelect = document.getElementById('pos-calc-material');
    const finishSelect = document.getElementById('pos-calc-finishing');
    const lengthInput = document.getElementById('pos-calc-length');
    const widthInput = document.getElementById('pos-calc-width');
    const qtyInput = document.getElementById('pos-calc-qty');

    if (titleEl) titleEl.textContent = `Kalkulator: ${prod.name}`;

    // Populate materials
    if (matSelect) {
      matSelect.innerHTML = '';
      if (prod.materials && prod.materials.length > 0) {
        prod.materials.forEach((m, idx) => {
          const opt = document.createElement('option');
          opt.value = idx;
          opt.textContent = `${m.name} (+Rp ${m.price_per_m2.toLocaleString('id-ID')}/m²)`;
          matSelect.appendChild(opt);
        });
      } else if (prod.options && prod.options.length > 0) {
        prod.options.forEach((o, idx) => {
          const opt = document.createElement('option');
          opt.value = idx;
          opt.textContent = `${o.name} (Rp ${o.price.toLocaleString('id-ID')})`;
          matSelect.appendChild(opt);
        });
      } else {
        const opt = document.createElement('option');
        opt.value = 0;
        opt.textContent = 'Standar Percetakan (Rp 30.000/m²)';
        matSelect.appendChild(opt);
      }
    }

    // Populate finishings
    if (finishSelect) {
      finishSelect.innerHTML = '';
      if (prod.finishings && prod.finishings.length > 0) {
        prod.finishings.forEach((f, idx) => {
          const opt = document.createElement('option');
          opt.value = idx;
          opt.textContent = `${f.name} (+Rp ${f.price.toLocaleString('id-ID')})`;
          finishSelect.appendChild(opt);
        });
      } else {
        const opt1 = document.createElement('option');
        opt1.value = 0;
        opt1.textContent = 'Mata Ayam 4 Sudut (Gratis)';
        finishSelect.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = 5000;
        opt2.textContent = 'Selongsong Kiri-Kanan (+Rp 5.000)';
        finishSelect.appendChild(opt2);

        const opt3 = document.createElement('option');
        opt3.value = 10000;
        opt3.textContent = 'Laminasi Doff/Glossy (+Rp 10.000)';
        finishSelect.appendChild(opt3);
      }
    }

    // Defaults
    if (lengthInput) lengthInput.value = 100;
    if (widthInput) widthInput.value = 100;
    if (qtyInput) qtyInput.value = 1;

    // Show dimensions input if meteran
    if (dimArea) {
      dimArea.style.display = prod.price_type === 1 ? 'grid' : 'none';
    }

    // Bind real-time calculation inside modal
    [lengthInput, widthInput, qtyInput, matSelect, finishSelect].forEach(el => {
      if (el) {
        el.oninput = recalculateModalPreview;
        el.onchange = recalculateModalPreview;
      }
    });

    recalculateModalPreview();

    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  function closePosCalculator() {
    const modal = document.getElementById('modal-pos-calculator');
    if (modal) modal.classList.add('hidden');
    posActiveProductForCalc = null;
  }

  function recalculateModalPreview() {
    if (!posActiveProductForCalc) return;
    const prod = posActiveProductForCalc;

    const length = parseFloat(document.getElementById('pos-calc-length')?.value) || 100;
    const width = parseFloat(document.getElementById('pos-calc-width')?.value) || 100;
    const qty = parseInt(document.getElementById('pos-calc-qty')?.value, 10) || 1;
    const matSelect = document.getElementById('pos-calc-material');
    const finishSelect = document.getElementById('pos-calc-finishing');

    const areaM2 = (length * width) / 10000;
    const billableArea = Math.max(1.0, areaM2);

    const areaLabel = document.getElementById('pos-calc-area-label');
    if (areaLabel) {
      areaLabel.textContent = `${areaM2.toFixed(2)} m² (Dihitung ${billableArea.toFixed(2)} m²)`;
    }

    let unitPrice = 0;
    if (prod.price_type === 1) {
      const matIdx = parseInt(matSelect?.value || '0', 10);
      const matPrice = prod.materials && prod.materials[matIdx] ? prod.materials[matIdx].price_per_m2 : 30000;
      
      const finIdx = parseInt(finishSelect?.value || '0', 10);
      let finPrice = 0;
      if (prod.finishings && prod.finishings[finIdx]) {
        finPrice = prod.finishings[finIdx].price;
      } else {
        finPrice = parseInt(finishSelect?.value || '0', 10);
      }

      unitPrice = Math.round((billableArea * matPrice) + finPrice);
    } else {
      const matIdx = parseInt(matSelect?.value || '0', 10);
      if (prod.options && prod.options[matIdx]) {
        unitPrice = prod.options[matIdx].price;
      } else {
        unitPrice = prod.price || 50000;
      }
    }

    const total = unitPrice * qty;
    const previewTotal = document.getElementById('pos-calc-total-preview');
    if (previewTotal) {
      previewTotal.textContent = `Rp ${total.toLocaleString('id-ID')}`;
    }
  }

  function handleConfirmPosCalculator() {
    if (!posActiveProductForCalc) return;
    const prod = posActiveProductForCalc;

    const length = parseFloat(document.getElementById('pos-calc-length')?.value) || 100;
    const width = parseFloat(document.getElementById('pos-calc-width')?.value) || 100;
    const qty = parseInt(document.getElementById('pos-calc-qty')?.value, 10) || 1;
    const matSelect = document.getElementById('pos-calc-material');
    const finishSelect = document.getElementById('pos-calc-finishing');

    const areaM2 = (length * width) / 10000;
    const billableArea = Math.max(1.0, areaM2);

    let unitPrice = 0;
    let specsText = '';

    if (prod.price_type === 1) {
      const matIdx = parseInt(matSelect?.value || '0', 10);
      const selectedMat = prod.materials && prod.materials[matIdx] ? prod.materials[matIdx] : { name: 'Standar Fleksi', price_per_m2: 30000 };
      
      const finIdx = parseInt(finishSelect?.value || '0', 10);
      let finName = 'Standar';
      let finPrice = 0;
      if (prod.finishings && prod.finishings[finIdx]) {
        finName = prod.finishings[finIdx].name;
        finPrice = prod.finishings[finIdx].price;
      } else {
        finName = finishSelect?.options[finishSelect.selectedIndex]?.text || 'Standar';
        finPrice = parseInt(finishSelect?.value || '0', 10);
      }

      unitPrice = Math.round((billableArea * selectedMat.price_per_m2) + finPrice);
      specsText = `${length}x${width}cm (${billableArea.toFixed(2)}m²) | ${selectedMat.name} | ${finName}`;
    } else {
      const matIdx = parseInt(matSelect?.value || '0', 10);
      if (prod.options && prod.options[matIdx]) {
        unitPrice = prod.options[matIdx].price;
        specsText = `Varian: ${prod.options[matIdx].name}`;
      } else {
        unitPrice = prod.price || 50000;
        specsText = 'Item Custom Spesifikasi';
      }
    }

    const subtotal = unitPrice * qty;

    posCart.push({
      id: generateUUID(),
      productId: prod.id,
      name: prod.name,
      orderCategory: prod.order_category || 'Ctk',
      specsText: specsText,
      unitPrice: unitPrice,
      qty: qty,
      subtotal: subtotal,
      isCustomMeter: prod.price_type === 1,
      length: length,
      width: width,
      area: billableArea
    });

    closePosCalculator();
    renderPosCartItems();
    updatePosFinancialSummary();
    showToast(`"${prod.name}" (${qty} pcs) berhasil ditambahkan ke keranjang kasir!`, 'success');
  }

  // ----------------------------------------------------------------------------
  // 7. POS CART & FINANCIAL CALCULATIONS
  // ----------------------------------------------------------------------------
  function renderPosCartItems() {
    const container = document.getElementById('pos-cart-items-container');
    const countEl = document.getElementById('pos-cart-count');
    if (!container) return;

    if (countEl) countEl.textContent = posCart.length;

    if (posCart.length === 0) {
      container.innerHTML = `
        <div class="py-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <i data-lucide="shopping-cart" class="w-6 h-6 mx-auto mb-1.5 opacity-40"></i>
          <p class="text-[11px] font-medium">Keranjang kasir kosong.</p>
          <span class="text-[10px] text-slate-400">Pilih produk di katalog sebelah kiri.</span>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = posCart.map((item, index) => `
      <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-2 text-xs">
        <div class="space-y-0.5 flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-slate-800 truncate">${escapeHtml(item.name)}</span>
            <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-200 text-slate-700">${escapeHtml(item.orderCategory)}</span>
          </div>
          <p class="text-[10px] text-slate-500 font-mono truncate">${escapeHtml(item.specsText)}</p>
          <div class="font-mono text-[11px] font-bold text-emerald-700">
            Rp ${item.unitPrice.toLocaleString('id-ID')} x ${item.qty} = <span class="font-black">Rp ${item.subtotal.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <!-- Qty Controls & Remove -->
        <div class="flex items-center gap-1 shrink-0 pt-1">
          <button type="button" class="pos-qty-minus w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold" data-index="${index}">-</button>
          <span class="w-6 text-center font-mono font-bold text-xs">${item.qty}</span>
          <button type="button" class="pos-qty-plus w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold" data-index="${index}">+</button>
          <button type="button" class="pos-item-remove p-1 text-slate-400 hover:text-red-600 transition" data-index="${index}" title="Hapus Item">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `).join('');

    // Bind controls
    container.querySelectorAll('.pos-qty-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        if (posCart[idx]) {
          if (posCart[idx].qty > 1) {
            posCart[idx].qty -= 1;
            posCart[idx].subtotal = posCart[idx].qty * posCart[idx].unitPrice;
          } else {
            posCart.splice(idx, 1);
          }
          renderPosCartItems();
          updatePosFinancialSummary();
        }
      });
    });

    container.querySelectorAll('.pos-qty-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        if (posCart[idx]) {
          posCart[idx].qty += 1;
          posCart[idx].subtotal = posCart[idx].qty * posCart[idx].unitPrice;
          renderPosCartItems();
          updatePosFinancialSummary();
        }
      });
    });

    container.querySelectorAll('.pos-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        if (posCart[idx]) {
          posCart.splice(idx, 1);
          renderPosCartItems();
          updatePosFinancialSummary();
        }
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function calculateSubtotal() {
    return posCart.reduce((acc, item) => acc + (item.subtotal || 0), 0);
  }

  function calculateGrandTotal() {
    const subtotal = calculateSubtotal();
    return Math.max(0, subtotal - posVoucherDiscount);
  }

  function updatePosFinancialSummary() {
    const subtotal = calculateSubtotal();
    const grandTotal = calculateGrandTotal();

    const subtotalEl = document.getElementById('pos-summary-subtotal');
    if (subtotalEl) subtotalEl.textContent = `Rp ${subtotal.toLocaleString('id-ID')}`;

    const discountRow = document.getElementById('pos-row-discount');
    const discountEl = document.getElementById('pos-summary-discount');
    if (posVoucherDiscount > 0) {
      if (discountRow) discountRow.classList.remove('hidden');
      if (discountEl) discountEl.textContent = `-Rp ${posVoucherDiscount.toLocaleString('id-ID')}`;
    } else {
      if (discountRow) discountRow.classList.add('hidden');
    }

    const grandTotalEl = document.getElementById('pos-summary-grand-total');
    if (grandTotalEl) grandTotalEl.textContent = `Rp ${grandTotal.toLocaleString('id-ID')}`;

    // Calculate change
    const cashInput = document.getElementById('pos-cash-input');
    const cashVal = parseFloat(cashInput?.value) || 0;
    const change = cashVal - grandTotal;

    const changeEl = document.getElementById('pos-change-display');
    if (changeEl) {
      if (cashVal === 0) {
        changeEl.textContent = 'Rp 0';
        changeEl.className = 'font-mono font-black text-slate-700 text-sm';
      } else if (change >= 0) {
        changeEl.textContent = `Rp ${change.toLocaleString('id-ID')}`;
        changeEl.className = 'font-mono font-black text-emerald-700 text-sm';
      } else {
        changeEl.textContent = `Kurang Rp ${Math.abs(change).toLocaleString('id-ID')}`;
        changeEl.className = 'font-mono font-black text-red-600 text-sm';
      }
    }
  }

  function applyVoucherCode(code) {
    const promos = DB.getPromos();
    const vouchers = promos.vouchers || [];
    const found = vouchers.find(v => v.code.toUpperCase() === code && v.is_active);

    if (!found) {
      showToast(`Voucher [${code}] tidak ditemukan atau sudah tidak aktif.`, 'error');
      return;
    }

    const subtotal = calculateSubtotal();
    if (found.min_purchase && subtotal < found.min_purchase) {
      showToast(`Minimum belanja untuk voucher ini adalah Rp ${found.min_purchase.toLocaleString('id-ID')}`, 'error');
      return;
    }

    let discount = 0;
    if (found.discount_type === 'percent') {
      discount = Math.round(subtotal * (found.discount_value / 100));
      if (found.max_discount && discount > found.max_discount) {
        discount = found.max_discount;
      }
    } else {
      discount = found.discount_value;
    }

    posAppliedVoucher = found;
    posVoucherDiscount = discount;

    renderPOSCashier();
    showToast(`Voucher [${code}] berhasil diterapkan! Hemat Rp ${discount.toLocaleString('id-ID')}`, 'success');
  }

  // ----------------------------------------------------------------------------
  // 8. ORDER PROCESS & THERMAL RECEIPT GENERATOR (58MM & 80MM)
  // ----------------------------------------------------------------------------
  function handleProcessOrderAndPreviewReceipt() {
    if (posCart.length === 0) {
      showToast('Keranjang kasir masih kosong. Tambahkan produk terlebih dahulu.', 'error');
      return;
    }

    const subtotal = calculateSubtotal();
    const grandTotal = calculateGrandTotal();
    const cashInput = document.getElementById('pos-cash-input');
    const cashVal = parseFloat(cashInput?.value) || 0;

    if (cashVal < grandTotal) {
      showToast(`Uang tunai kurang! Total transaksi: Rp ${grandTotal.toLocaleString('id-ID')}, uang diterima: Rp ${cashVal.toLocaleString('id-ID')}`, 'error');
      return;
    }

    const change = cashVal - grandTotal;
    const custName = document.getElementById('pos-customer-name')?.value.trim() || 'Pelanggan Umum';
    const custPhone = document.getElementById('pos-customer-phone')?.value.trim() || '-';
    const settings = DB.getSettings();

    // Generate Invoice Number via InvoiceGenerator
    const currentCounter = DB.getNextOrderCounter();
    const now = new Date();
    const invoiceNumber = window.InvoiceGenerator
      ? InvoiceGenerator.formatInvoiceNumber({
          channel: 'B_POS',
          labelCode: posOrderPrefix,
          counter: currentCounter,
          date: now
        })
      : `B-${posOrderPrefix}-${String(currentCounter).padStart(5, '0')}`;

    // Build Receipt Data Object
    posActiveReceiptData = {
      invoice_number: invoiceNumber,
      order_prefix: posOrderPrefix,
      channel: 'B_POS',
      customer_name: custName,
      customer_phone: custPhone,
      items: JSON.parse(JSON.stringify(posCart)),
      subtotal: subtotal,
      discount: posVoucherDiscount,
      voucher_code: posAppliedVoucher ? posAppliedVoucher.code : null,
      total: grandTotal,
      cash: cashVal,
      change: change,
      payment_method: 'CASH',
      status: 'PAID',
      paper_width: settings.printer_paper_width || '58mm',
      store_name: settings.store_name || currentTenant.store_name,
      store_address: settings.store_address || 'Jl. Percetakan Terpadu No. 1',
      store_phone: settings.store_phone || '0812-3456-7890',
      receipt_footer: settings.receipt_footer || 'Terima kasih atas pesanan Anda!',
      created_at: now.toISOString()
    };

    // Render receipt text preview
    renderThermalReceiptText(posActiveReceiptData);

    // Open Modal
    const modal = document.getElementById('modal-thermal-receipt');
    if (modal) modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  function renderThermalReceiptText(data) {
    const previewContainer = document.getElementById('thermal-receipt-preview-content');
    if (!previewContainer) return;

    const width = data.paper_width === '80mm' ? 44 : 32;
    const divider = '='.repeat(width);
    const subDivider = '-'.repeat(width);

    const padCenter = (str, len) => {
      const s = String(str || '');
      if (s.length >= len) return s.slice(0, len);
      const left = Math.floor((len - s.length) / 2);
      const right = len - s.length - left;
      return ' '.repeat(left) + s + ' '.repeat(right);
    };

    const padRow = (left, right, len) => {
      const l = String(left || '');
      const r = String(right || '');
      const spaceNeeded = len - l.length - r.length;
      if (spaceNeeded <= 0) return `${l} ${r}`;
      return l + ' '.repeat(spaceNeeded) + r;
    };

    const d = new Date(data.created_at);
    const dateFormatted = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    let receiptLines = [];
    receiptLines.push(divider);
    receiptLines.push(padCenter(data.store_name.toUpperCase(), width));
    receiptLines.push(padCenter(data.store_address, width));
    receiptLines.push(padCenter(`Telp: ${data.store_phone}`, width));
    receiptLines.push(divider);
    receiptLines.push(`No. Faktur : ${data.invoice_number}`);
    receiptLines.push(`Tanggal    : ${dateFormatted}`);
    receiptLines.push(`Kasir      : ${currentTenant.admin_username || 'Admin'}`);
    receiptLines.push(`Pelanggan  : ${data.customer_name} (${data.customer_phone})`);
    receiptLines.push(subDivider);

    // Items list
    data.items.forEach(item => {
      receiptLines.push(item.name);
      if (item.specsText && item.specsText !== 'Item Standar / Ready') {
        receiptLines.push(`  ${item.specsText}`);
      }
      const qtyLine = `  ${item.qty} pcs x Rp ${item.unitPrice.toLocaleString('id-ID')}`;
      const totalLine = `Rp ${item.subtotal.toLocaleString('id-ID')}`;
      receiptLines.push(padRow(qtyLine, totalLine, width));
    });

    receiptLines.push(subDivider);
    receiptLines.push(padRow('Subtotal:', `Rp ${data.subtotal.toLocaleString('id-ID')}`, width));
    if (data.discount > 0) {
      receiptLines.push(padRow(`Diskon (${data.voucher_code || 'Voucher'}):`, `-Rp ${data.discount.toLocaleString('id-ID')}`, width));
    }
    receiptLines.push(padRow('GRAND TOTAL:', `Rp ${data.total.toLocaleString('id-ID')}`, width));
    receiptLines.push(padRow('Tunai (Diterima):', `Rp ${data.cash.toLocaleString('id-ID')}`, width));
    receiptLines.push(padRow('KEMBALIAN:', `Rp ${data.change.toLocaleString('id-ID')}`, width));
    receiptLines.push(subDivider);
    receiptLines.push(`Metode : ${data.payment_method}`);
    receiptLines.push(`Status : ${data.status} (LUNAS)`);
    receiptLines.push(divider);
    receiptLines.push(padCenter(data.receipt_footer, width));
    receiptLines.push(padCenter('Simpan struk ini sebagai bukti bayar.', width));
    receiptLines.push(divider);

    const fullReceiptText = receiptLines.join('\n');
    previewContainer.textContent = fullReceiptText;
  }

  function executeThermalPrint() {
    if (!posActiveReceiptData) return;

    // 1. Save order to Local Storage Database
    DB.saveOrder(posActiveReceiptData);

    // 2. Prepare print container
    const printContainer = document.getElementById('thermal-print-container');
    const previewContent = document.getElementById('thermal-receipt-preview-content');
    if (printContainer && previewContent) {
      printContainer.innerHTML = `<pre class="font-mono text-xs leading-none whitespace-pre-wrap select-none">${escapeHtml(previewContent.textContent)}</pre>`;
    }

    // 3. Clear Cashier Basket
    posCart = [];
    posAppliedVoucher = null;
    posVoucherDiscount = 0;
    const cashInput = document.getElementById('pos-cash-input');
    if (cashInput) cashInput.value = '';
    const custName = document.getElementById('pos-customer-name');
    if (custName) custName.value = '';
    const custPhone = document.getElementById('pos-customer-phone');
    if (custPhone) custPhone.value = '';

    renderPosCartItems();
    updatePosFinancialSummary();

    // 4. Trigger print
    window.print();

    // 5. Close modal
    closeReceiptModal();
    showToast(`Transaksi ${posActiveReceiptData.invoice_number} berhasil disimpan dan dicetak!`, 'success');
  }

  function closeReceiptModal() {
    const modal = document.getElementById('modal-thermal-receipt');
    if (modal) modal.classList.add('hidden');
    posActiveReceiptData = null;
  }

  // ----------------------------------------------------------------------------
  // 10. STORE SETTINGS & RECEIPT CONFIGURATION VIEW
  // ----------------------------------------------------------------------------
  function renderSettingsView() {
    const container = document.getElementById('settings-view-container');
    if (!container) return;

    const settings = DB.getSettings();

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">
        
        <!-- Header Section -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 class="text-xl font-black text-slate-900 tracking-tight">Konfigurasi Toko & Format Struk</h2>
            <p class="text-xs text-slate-500">Atur identitas percetakan, tema warna 2-warna, dan spesifikasi printer thermal 58mm/80mm.</p>
          </div>
          <button type="button" id="btn-save-settings" class="btn-primary-brand px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-2 hover:shadow-emerald-200/50 transition">
            <i data-lucide="save" class="w-4 h-4"></i>
            <span>Simpan Perubahan</span>
          </button>
        </div>

        <form id="form-store-settings" class="space-y-6" onsubmit="event.preventDefault();">
          
          <!-- Card 1: Identitas Toko -->
          <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 class="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <i data-lucide="store" class="w-4 h-4 text-emerald-600"></i>
              <span>Profil & Identitas Percetakan</span>
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Nama Toko:</label>
                <input type="text" id="setting-store-name" value="${escapeHtml(settings.store_name || currentTenant.store_name)}" class="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Tagline / Slogan:</label>
                <input type="text" id="setting-store-tagline" value="${escapeHtml(settings.store_tagline || currentTenant.store_tagline || '')}" class="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Nomor WhatsApp / CS Toko:</label>
                <input type="text" id="setting-store-phone" value="${escapeHtml(settings.store_phone || '0812-3456-7890')}" class="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Alamat Fisik / Workshop:</label>
                <input type="text" id="setting-store-address" value="${escapeHtml(settings.store_address || 'Jl. Percetakan Terpadu No. 1')}" class="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-emerald-500" />
              </div>
            </div>
          </div>

          <!-- Card 2: Branding Tema 2-Warna -->
          <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 class="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <i data-lucide="palette" class="w-4 h-4 text-emerald-600"></i>
              <span>Tema Branding 2-Warna Toko</span>
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span class="block font-bold text-slate-800">Warna Primer (Primary):</span>
                  <span class="text-[11px] text-slate-400">Header, tombol aksi, badge utama</span>
                </div>
                <div class="flex items-center gap-2">
                  <input type="color" id="setting-color-primary" value="${settings.primary_color || '#33b589'}" class="w-9 h-9 rounded-lg cursor-pointer border-0" />
                  <span id="setting-label-primary" class="font-mono font-bold text-slate-700">${settings.primary_color || '#33b589'}</span>
                </div>
              </div>

              <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span class="block font-bold text-slate-800">Warna Sekunder (Secondary):</span>
                  <span class="text-[11px] text-slate-400">Tombol beli/CTA, promo diskon, rating</span>
                </div>
                <div class="flex items-center gap-2">
                  <input type="color" id="setting-color-secondary" value="${settings.secondary_color || '#f59e0b'}" class="w-9 h-9 rounded-lg cursor-pointer border-0" />
                  <span id="setting-label-secondary" class="font-mono font-bold text-slate-700">${settings.secondary_color || '#f59e0b'}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Card 3: Konfigurasi Printer & Struk Thermal -->
          <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 class="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <i data-lucide="printer" class="w-4 h-4 text-emerald-600"></i>
              <span>Format Struk Thermal Kasir</span>
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Lebar Kertas Printer Kasir:</label>
                <select id="setting-paper-width" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold outline-none focus:border-emerald-500 bg-white">
                  <option value="58mm" ${(settings.printer_paper_width || '58mm') === '58mm' ? 'selected' : ''}>Thermal 58mm (Kompak - 32 Karakter)</option>
                  <option value="80mm" ${(settings.printer_paper_width || '58mm') === '80mm' ? 'selected' : ''}>Thermal 80mm (Lebar - 44 Karakter)</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Pesan Catatan Kaki (Footer):</label>
                <input type="text" id="setting-receipt-footer" value="${escapeHtml(settings.receipt_footer || 'Terima kasih atas pesanan Anda!')}" class="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-emerald-500" />
              </div>
            </div>
          </div>

          <!-- Reset Database Default -->
          <div class="p-4 bg-red-50 rounded-2xl border border-red-200 flex items-center justify-between">
            <div>
              <h4 class="font-bold text-xs text-red-900">Reset Data Toko ke Contoh Bawaan</h4>
              <p class="text-[11px] text-red-600">Mengembalikan katalog produk, kategori, dan promo ke data awal percetakan.</p>
            </div>
            <button type="button" id="btn-reset-demo-data" class="px-4 py-2 rounded-xl bg-white border border-red-300 text-red-700 hover:bg-red-100 text-xs font-bold transition">
              Reset Data
            </button>
          </div>

        </form>
      </div>
    `;

    // Bind real-time color inputs
    const primInput = document.getElementById('setting-color-primary');
    const primLabel = document.getElementById('setting-label-primary');
    if (primInput && primLabel) {
      primInput.addEventListener('input', (e) => {
        primLabel.textContent = e.target.value;
      });
    }

    const secInput = document.getElementById('setting-color-secondary');
    const secLabel = document.getElementById('setting-label-secondary');
    if (secInput && secLabel) {
      secInput.addEventListener('input', (e) => {
        secLabel.textContent = e.target.value;
      });
    }

    // Save Settings
    const btnSave = document.getElementById('btn-save-settings');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        const storeName = document.getElementById('setting-store-name')?.value.trim();
        const tagline = document.getElementById('setting-store-tagline')?.value.trim();
        const phone = document.getElementById('setting-store-phone')?.value.trim();
        const address = document.getElementById('setting-store-address')?.value.trim();
        const primaryColor = primInput?.value || '#33b589';
        const secondaryColor = secInput?.value || '#f59e0b';
        const paperWidth = document.getElementById('setting-paper-width')?.value || '58mm';
        const footer = document.getElementById('setting-receipt-footer')?.value.trim();

        const updatedSettings = {
          ...settings,
          store_name: storeName || currentTenant.store_name,
          store_tagline: tagline,
          store_phone: phone,
          store_address: address,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          printer_paper_width: paperWidth,
          receipt_footer: footer
        };

        DB.saveSettings(updatedSettings);
        syncHeaderAndTheme();
        showToast('Konfigurasi toko dan format struk berhasil disimpan!', 'success');
      });
    }

    // Reset Database
    const btnReset = document.getElementById('btn-reset-demo-data');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin me-reset seluruh data katalog toko ke contoh awal? Semua perubahan lokal akan dikembalikan.')) {
          DB.reset();
          syncHeaderAndTheme();
          renderSettingsView();
          showToast('Data database toko telah di-reset ke default.', 'info');
        }
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }





  // ----------------------------------------------------------------------------
  // 10. TENANT MANAGER MODAL (MULTI-TENANT & AUTO-SLUG)
  // ----------------------------------------------------------------------------
  function openTenantManagerModal() {
    const modal = document.getElementById('modal-tenant-manager');
    const listContainer = document.getElementById('tenant-list-container');
    if (!modal) return;

    const tenants = DB.getTenants();

    if (listContainer) {
      listContainer.innerHTML = tenants.map(t => {
        const isCurrent = t.tenant_id === currentTenant.tenant_id;
        return `
          <div class="p-2.5 rounded-xl border flex items-center justify-between text-xs ${isCurrent ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'}">
            <div>
              <span class="block">${escapeHtml(t.store_name)}</span>
              <span class="text-[10px] font-mono opacity-60">Slug: ${escapeHtml(t.store_slug)}</span>
            </div>
            ${isCurrent ? `
              <span class="px-2 py-0.5 rounded-full text-[9px] bg-emerald-600 text-white font-bold">Sedang Aktif</span>
            ` : `
              <button type="button" class="btn-switch-tenant px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-[11px] font-semibold text-slate-800 transition" data-slug="${escapeHtml(t.store_slug)}">
                Ganti ke Toko Ini
              </button>
            `}
          </div>
        `;
      }).join('');

      listContainer.querySelectorAll('.btn-switch-tenant').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetSlug = btn.getAttribute('data-slug');
          currentTenant = DB.resolveTenant(targetSlug);
          sessionStorage.setItem('pos_admin_store_slug', currentTenant.store_slug);
          syncHeaderAndTheme();
          closeTenantManagerModal();
          navigate('pos');
          showToast(`Berhasil beralih ke toko: ${currentTenant.store_name}`, 'success');
        });
      });
    }

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  function closeTenantManagerModal() {
    const modal = document.getElementById('modal-tenant-manager');
    if (modal) modal.classList.add('hidden');
  }

  function handleCreateNewTenant() {
    const input = document.getElementById('new-store-name-input');
    const storeName = input?.value.trim();

    if (!storeName) {
      showToast('Masukkan nama toko baru terlebih dahulu.', 'error');
      return;
    }

    const createdTenant = DB.createTenant({
      store_name: storeName,
      admin_username: 'admin',
      admin_password: 'admin123',
      store_tagline: 'Cabang Digital Printing & Percetakan'
    });

    if (input) input.value = '';

    currentTenant = DB.resolveTenant(createdTenant.store_slug);
    sessionStorage.setItem('pos_admin_store_slug', currentTenant.store_slug);
    syncHeaderAndTheme();
    closeTenantManagerModal();
    navigate('pos');
    showToast(`Tenant baru "${createdTenant.store_name}" (Slug: ${createdTenant.store_slug}) berhasil dibuat!`, 'success');
  }

  // ----------------------------------------------------------------------------
  // 11. TOAST NOTIFICATION SYSTEM
  // ----------------------------------------------------------------------------
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const isSuccess = type === 'success';
    const isInfo = type === 'info';

    toast.className = `flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl text-xs font-semibold animate-slide-in pointer-events-auto transition-all duration-300 ${
      isSuccess 
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

  // ----------------------------------------------------------------------------
  // 11. DASHBOARD VIEW (METRICS, 6-MONTH CHART & INCOMING ORDERS)
  // ----------------------------------------------------------------------------
  function renderDashboardView() {
    const container = document.getElementById('dashboard-view-container');
    if (!container) return;

    const metrics = DB.getDashboardMetrics();
    const formatIDR = (num) => 'Rp ' + Math.round(num || 0).toLocaleString('id-ID');

    // 6-Month historical chart calculation
    const trends = metrics.monthlyTrends || [];
    const maxRev = Math.max(...trends.map(t => t.revenue), 1000000);
    const chartMaxY = Math.ceil(maxRev / 2000000) * 2000000;

    // SVG coordinate mapping
    const svgWidth = 600;
    const svgHeight = 220;
    const padX = 60;
    const padTop = 30;
    const padBottom = 40;
    const plotHeight = svgHeight - padTop - padBottom;
    const plotWidth = svgWidth - padX - 30;
    const stepX = plotWidth / (trends.length - 1 || 1);

    // Build SVG bar & area elements
    let barsHtml = '';
    let xLabelsHtml = '';
    trends.forEach((t, i) => {
      const cx = padX + i * stepX;
      const barH = (t.revenue / chartMaxY) * plotHeight;
      const barY = padTop + (plotHeight - barH);
      const bW = 28;
      const profitH = (t.profit / chartMaxY) * plotHeight;
      const profitY = padTop + (plotHeight - profitH);

      const isCurrentMonth = i === trends.length - 1;
      const fillId = isCurrentMonth ? 'url(#barGradActive)' : 'url(#barGradNormal)';

      barsHtml += `
        <g class="chart-bar-group cursor-pointer group" data-month="${t.month}" data-rev="${t.revenue}" data-ord="${t.orders}" data-prof="${t.profit}">
          <!-- Background hover track -->
          <rect x="${cx - bW / 2 - 6}" y="${padTop}" width="${bW + 12}" height="${plotHeight}" fill="rgba(241, 245, 249, 0.6)" rx="8" class="opacity-0 group-hover:opacity-100 transition-opacity" />
          <!-- Revenue Bar -->
          <rect x="${cx - bW / 2}" y="${barY}" width="${bW}" height="${barH}" fill="${fillId}" rx="6" ry="6" class="transition-all duration-300 group-hover:opacity-90">
            <title>${t.month} ${t.year}: Omzet ${formatIDR(t.revenue)} (${t.orders} Pesanan) | Laba Est. ${formatIDR(t.profit)}</title>
          </rect>
          <!-- Profit Accent Dot/Line -->
          <rect x="${cx - bW / 2 + 4}" y="${profitY}" width="${bW - 8}" height="3" fill="#f59e0b" rx="1.5" class="opacity-80" />
          <!-- Label Value Above Bar -->
          <text x="${cx}" y="${barY - 8}" font-size="9" font-weight="700" fill="${isCurrentMonth ? '#059669' : '#64748b'}" text-anchor="middle" class="font-mono">
            ${(t.revenue / 1000000).toFixed(1)}Jt
          </text>
        </g>
      `;

      xLabelsHtml += `
        <text x="${cx}" y="${svgHeight - 14}" font-size="10" font-weight="${isCurrentMonth ? '800' : '600'}" fill="${isCurrentMonth ? '#0f172a' : '#64748b'}" text-anchor="middle">
          ${t.month} ${isCurrentMonth ? '●' : ''}
        </text>
      `;
    });

    // Y Grid lines
    const yGridSteps = [0, 0.33, 0.66, 1];
    let yGridHtml = '';
    yGridSteps.forEach(ratio => {
      const yPos = padTop + plotHeight * (1 - ratio);
      const val = chartMaxY * ratio;
      const label = val >= 1000000 ? `${(val / 1000000).toFixed(0)}Jt` : val.toLocaleString('id-ID');
      yGridHtml += `
        <line x1="${padX}" y1="${yPos}" x2="${svgWidth - 20}" y2="${yPos}" stroke="#e2e8f0" stroke-dasharray="3,3" stroke-width="1" />
        <text x="${padX - 8}" y="${yPos + 3}" font-size="9" font-weight="600" fill="#94a3b8" text-anchor="end" class="font-mono">${label}</text>
      `;
    });

    const totalRev = metrics.totalRevenueMonth !== undefined ? metrics.totalRevenueMonth : (metrics.totalTurnoverMonth || 0);
    const totalOrders = metrics.totalOrdersMonth !== undefined ? metrics.totalOrdersMonth : 0;
    const webOrders = metrics.webOrdersCount !== undefined ? metrics.webOrdersCount : (metrics.webOrdersMonth !== undefined ? metrics.webOrdersMonth : 0);
    const posOrders = metrics.posOrdersCount !== undefined ? metrics.posOrdersCount : (metrics.posOrdersMonth !== undefined ? metrics.posOrdersMonth : 0);
    const estProfit = metrics.estimatedNetProfit !== undefined ? metrics.estimatedNetProfit : Math.round(totalRev * 0.42);
    const topProdName = metrics.bestsellerName || (metrics.topProduct ? metrics.topProduct.name : 'Spanduk Banner Fleksi Outdoor');
    const topProdSold = metrics.bestsellerCount !== undefined ? metrics.bestsellerCount : (metrics.topProduct ? metrics.topProduct.sold_count : 32);

    // Hitung Pendapatan Iklan Sponsor dari Slot Sponsor yang Aktif
    const sponsors = (typeof DB !== 'undefined' && DB.getSponsorList) ? DB.getSponsorList() : [];
    const activeSponsors = sponsors.filter(s => s.is_active === true || s.active === true);
    const defaultPrices = { ad1: 500000, carousel: 750000, internal: 350000 };
    const sponsorRevenue = activeSponsors.reduce((sum, s) => {
      const p = (typeof s.price === 'number' && s.price > 0) ? s.price : (s.slot_price || defaultPrices[s.type] || 500000);
      return sum + p;
    }, 0);
    const activeSponsorCount = activeSponsors.length;

    container.innerHTML = `
      <div class="space-y-6 max-w-7xl mx-auto pb-12">
        
        <!-- Dashboard Header & Real-time Indicator (Clean No-CTA) -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
              <span>Admin Panel</span> <span>/</span> <span class="text-slate-800 font-bold">Ringkasan Bisnis</span>
            </div>
            <h1 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Dashboard Toko Percetakan</span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Sinkron
              </span>
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">Ringkasan metrik penjualan, tren omzet 6 bulan, dan analitik performa toko Anda.</p>
          </div>
        </div>

        <!-- 1. METRIC CARDS (5 CARDS: OMZET, PESANAN, LABA, PRODUK TERLARIS & PENDAPATAN IKLAN SPONSOR) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          
          <!-- Metric 1: Total Omzet Bulan Ini -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-emerald-300 transition">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Omzet (Bulan Ini)</span>
                <div class="text-2xl font-black text-slate-900 mt-1 font-mono">${formatIDR(totalRev)}</div>
              </div>
              <div class="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <i data-lucide="wallet" class="w-5 h-5"></i>
              </div>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span class="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                <i data-lucide="trending-up" class="w-3 h-3 mr-0.5 inline"></i> +18.4%
              </span>
              <span class="text-[11px] text-slate-400">vs bulan September</span>
            </div>
          </div>

          <!-- Metric 2: Total Pesanan Masuk -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-blue-300 transition">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pesanan Masuk</span>
                <div class="text-2xl font-black text-slate-900 mt-1 font-mono">${totalOrders} Pesanan</div>
              </div>
              <div class="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <i data-lucide="shopping-bag" class="w-5 h-5"></i>
              </div>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
              <span class="text-emerald-700 font-bold">${webOrders} Web WA</span>
              <span class="text-slate-300">•</span>
              <span class="text-indigo-700 font-bold">${posOrders} Kasir POS</span>
            </div>
          </div>

          <!-- Metric 3: Estimasi Laba Bersih -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-amber-300 transition">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Estimasi Laba Bersih</span>
                <div class="text-2xl font-black text-amber-600 mt-1 font-mono">${formatIDR(estProfit)}</div>
              </div>
              <div class="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                <i data-lucide="coins" class="w-5 h-5"></i>
              </div>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span class="text-[11px] text-slate-400">Total Omzet - Estimasi HPP Modal</span>
              <span class="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">~42% Margin</span>
            </div>
          </div>

          <!-- Metric 4: Produk Terlaris Bulan Ini -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-rose-300 transition">
            <div class="flex items-start justify-between">
              <div class="min-w-0 pr-2">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Produk Terlaris</span>
                <div class="text-sm sm:text-base font-black text-slate-900 mt-1 truncate" title="${escapeHtml(topProdName)}">
                  ${escapeHtml(topProdName)}
                </div>
              </div>
              <div class="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                <i data-lucide="flame" class="w-5 h-5"></i>
              </div>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span class="text-rose-600 font-bold font-mono">${topProdSold} Pcs Terjual</span>
              <span class="text-[11px] text-slate-400">bulan ini</span>
            </div>
          </div>

          <!-- Metric 5: Pendapatan Iklan Sponsor (Slot Sponsor Aktif) -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-purple-300 transition">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pendapatan Iklan Sponsor</span>
                <div class="text-2xl font-black text-purple-700 mt-1 font-mono">${formatIDR(sponsorRevenue)}</div>
              </div>
              <div class="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                <i data-lucide="megaphone" class="w-5 h-5"></i>
              </div>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
              <span class="inline-flex items-center text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md">
                <i data-lucide="sparkles" class="w-3 h-3 mr-0.5 inline"></i> ${activeSponsorCount} Slot Aktif
              </span>
              <span class="text-[11px] text-slate-400">Monetisasi etalase</span>
            </div>
          </div>

        </div>

        <!-- 2. DIAGRAM PENJUALAN BULANAN (SVG CHART ANALYTICS) -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <div class="flex items-center gap-2">
                <i data-lucide="bar-chart-3" class="w-5 h-5 text-emerald-600"></i>
                <h3 class="font-extrabold text-base text-slate-900 tracking-tight">Tren Penjualan 6 Bulan Terakhir</h3>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">Grafik batang analitik performa omzet dan estimasi laba kotor toko berjalan.</p>
            </div>
            <!-- Legend Indicators -->
            <div class="flex items-center gap-4 text-xs font-semibold">
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-md bg-emerald-500 inline-block"></span>
                <span class="text-slate-700">Total Omzet Penjualan</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                <span class="text-slate-700">Estimasi Laba Kotor</span>
              </div>
            </div>
          </div>

          <!-- Responsive SVG Bar Chart -->
          <div class="w-full overflow-x-auto">
            <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="w-full h-56 sm:h-64 select-none">
              <defs>
                <linearGradient id="barGradNormal" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#34d399" />
                  <stop offset="100%" stop-color="#059669" />
                </linearGradient>
                <linearGradient id="barGradActive" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#10b981" />
                  <stop offset="100%" stop-color="#047857" />
                </linearGradient>
              </defs>

              <!-- Y-Axis Grid Lines & Labels -->
              ${yGridHtml}

              <!-- Bars for each month -->
              ${barsHtml}

              <!-- Month X-Labels -->
              ${xLabelsHtml}
            </svg>
          </div>

          <!-- Summary Strip under chart -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span class="text-[10px] text-slate-400 font-bold block uppercase">Rata-Rata Omzet Bulanan</span>
              <span class="text-sm font-black text-slate-800 font-mono">
                ${formatIDR(trends.reduce((a, b) => a + b.revenue, 0) / (trends.length || 1))}
              </span>
            </div>
            <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span class="text-[10px] text-slate-400 font-bold block uppercase">Bulan Penjualan Tertinggi (Peak)</span>
              <span class="text-sm font-black text-emerald-700 font-mono">
                September 2026 (${formatIDR(13500000)})
              </span>
            </div>
            <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span class="text-[10px] text-slate-400 font-bold block uppercase">Tingkat Penyelesaian Transaksi</span>
              <span class="text-sm font-black text-blue-700 font-mono">
                95.8% Lunas / Sukses
              </span>
            </div>
          </div>
        </div>

      </div>
    `;

    // Event bindings for dashboard elements
    const btnQuickOrders = document.getElementById('btn-quick-to-orders');
    if (btnQuickOrders) btnQuickOrders.addEventListener('click', () => navigate('orders'));

    const btnQuickPos = document.getElementById('btn-quick-to-pos');
    if (btnQuickPos) btnQuickPos.addEventListener('click', () => navigate('pos'));

    if (window.lucide) window.lucide.createIcons();
  }

  function renderOrderTableRow(ord) {
    const isWeb = ord.channel === 'WEB_WA';
    const d = new Date(ord.created_at);
    const dateFormatted = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const formatIDR = (num) => 'Rp ' + Math.round(num || 0).toLocaleString('id-ID');

    let statusBadge = '';
    const st = (ord.status || 'PENDING').toUpperCase();
    if (st === 'COMPLETED' || st === 'PAID') {
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
          <i data-lucide="check-circle" class="w-3 h-3 text-emerald-600"></i>
          Selesai / Lunas
        </span>
      `;
    } else if (st === 'PROCESSING') {
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
          <i data-lucide="loader" class="w-3 h-3 text-blue-600 animate-spin"></i>
          Sedang Diproses
        </span>
      `;
    } else if (st === 'CANCELLED') {
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
          <i data-lucide="x-circle" class="w-3 h-3 text-rose-600"></i>
          Dibatalkan
        </span>
      `;
    } else {
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
          <i data-lucide="clock" class="w-3 h-3 text-amber-600"></i>
          Menunggu Konfirmasi
        </span>
      `;
    }

    return `
      <tr class="hover:bg-slate-50/80 transition cursor-pointer order-table-row" data-id="${ord.id}">
        <!-- Invoice ID -->
        <td class="p-4 font-mono font-bold text-slate-900">
          <span class="text-emerald-700">${escapeHtml(ord.invoice_number)}</span>
        </td>

        <!-- Tanggal -->
        <td class="p-4 text-slate-500 font-mono text-[11px]">
          ${dateFormatted}
        </td>

        <!-- Nama Pelanggan -->
        <td class="p-4">
          <div class="font-bold text-slate-900">${escapeHtml(ord.customer_name || 'Pelanggan Umum')}</div>
          <div class="text-[11px] text-slate-400 font-mono">${escapeHtml(ord.customer_phone || '-')}</div>
        </td>

        <!-- Sumber Pesanan -->
        <td class="p-4">
          ${isWeb ? `
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              <i data-lucide="message-square" class="w-3 h-3 text-teal-600"></i>
              Web Checkout
            </span>
          ` : `
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
              <i data-lucide="monitor" class="w-3 h-3 text-slate-600"></i>
              Kasir POS
            </span>
          `}
        </td>

        <!-- Total Tagihan -->
        <td class="p-4 font-bold text-slate-900 font-mono">
          ${formatIDR(ord.total)}
        </td>

        <!-- Status -->
        <td class="p-4 text-center">
          ${statusBadge}
        </td>

        <!-- Aksi -->
        <td class="p-4 text-center" onclick="event.stopPropagation()">
          <div class="flex items-center justify-center gap-1.5">
            <select class="select-order-status px-2 py-1.5 rounded-xl border border-slate-300 text-[10px] font-bold outline-none cursor-pointer bg-white text-slate-700" data-id="${ord.id}">
              <option value="PENDING" ${st === 'PENDING' ? 'selected' : ''}>Menunggu</option>
              <option value="PROCESSING" ${st === 'PROCESSING' ? 'selected' : ''}>Diproses</option>
              <option value="COMPLETED" ${st === 'COMPLETED' || st === 'PAID' ? 'selected' : ''}>Selesai</option>
              <option value="CANCELLED" ${st === 'CANCELLED' ? 'selected' : ''}>Dibatalkan</option>
            </select>
            <button type="button" class="btn-print-order-receipt px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition font-bold text-[10px] flex items-center gap-1" data-id="${ord.id}" title="Cetak Struk Thermal 58mm/80mm">
              <i data-lucide="printer" class="w-3 h-3 text-emerald-600"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  function bindOrderTableActionButtons(container) {
    if (!container) return;

    container.querySelectorAll('tr.order-table-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-id');
        if (id) openOrderDetailModal(id);
      });
    });

    container.querySelectorAll('.select-order-status').forEach(select => {
      select.addEventListener('change', (e) => {
        const id = select.getAttribute('data-id');
        const newStatus = e.target.value;
        if (id) {
          if (typeof window.DB.updateOrderStatus === 'function') {
            DB.updateOrderStatus(id, newStatus);
          } else if (typeof window.DB.updateOrder === 'function') {
            DB.updateOrder(id, { status: newStatus });
          }
          
          if (currentView === 'orders') {
            renderOrdersView();
          } else if (currentView === 'dashboard') {
            renderDashboardView();
          }
          updateSidebarNavActive(currentView);
        }
      });
    });

    container.querySelectorAll('.btn-print-order-receipt').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) printOrderReceipt(id);
      });
    });
  }

  // ----------------------------------------------------------------------------
  // 12. RIWAYAT TRANSAKSI & PESANAN LENGKAP VIEW (VIEW-ORDERS)
  // ----------------------------------------------------------------------------
  function renderOrdersView() {
    const container = document.getElementById('orders-view-container');
    if (!container) return;

    const allOrders = DB.getOrders();
    const formatIDR = (num) => 'Rp ' + Math.round(num || 0).toLocaleString('id-ID');

    // Filter by search query
    let filteredOrders = [...allOrders];
    if (ordersSearchQuery.trim() !== '') {
      const q = ordersSearchQuery.toLowerCase();
      filteredOrders = filteredOrders.filter(o => 
        (o.invoice_number && o.invoice_number.toLowerCase().includes(q)) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
        (o.customer_phone && o.customer_phone.toLowerCase().includes(q))
      );
    }

    // Filter by status
    if (ordersStatusFilter !== 'all') {
      filteredOrders = filteredOrders.filter(o => (o.status || 'PENDING').toUpperCase() === ordersStatusFilter);
    }

    // Filter by channel
    if (ordersChannelFilter !== 'all') {
      filteredOrders = filteredOrders.filter(o => o.channel === ordersChannelFilter);
    }

    const pendingCount = allOrders.filter(o => (o.status || 'PENDING') === 'PENDING').length;
    const processingCount = allOrders.filter(o => o.status === 'PROCESSING').length;
    const completedCount = allOrders.filter(o => o.status === 'COMPLETED' || o.status === 'PAID').length;

    container.innerHTML = `
      <div class="space-y-6 max-w-7xl mx-auto pb-12">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
              <span>Admin Panel</span> <span>/</span> <span class="text-slate-800 font-bold">Transaksi</span>
            </div>
            <h1 class="text-2xl font-black text-slate-900 tracking-tight">Pesanan & Riwayat Transaksi</h1>
            <p class="text-xs text-slate-500 mt-0.5">Kelola seluruh riwayat transaksi masuk dari web toko online dan kasir POS offline.</p>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" id="btn-back-to-dashboard" class="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition flex items-center gap-1.5">
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
              <span>Kembali ke Dashboard</span>
            </button>
          </div>
        </div>

        <!-- Filter Controls -->
        <div class="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <!-- Search Input -->
            <div class="relative sm:col-span-1">
              <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
              <input type="text" id="input-orders-search" value="${escapeHtml(ordersSearchQuery)}" placeholder="Cari No. Faktur / Nama Pembeli..." class="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-500 font-medium" />
            </div>

            <!-- Status Tabs -->
            <div class="flex items-center gap-1 overflow-x-auto scrollbar-none sm:col-span-1">
              <button type="button" class="btn-orders-status-tab px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${ordersStatusFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-status="all">Semua (${allOrders.length})</button>
              <button type="button" class="btn-orders-status-tab px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${ordersStatusFilter === 'PENDING' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-status="PENDING">Menunggu (${pendingCount})</button>
              <button type="button" class="btn-orders-status-tab px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${ordersStatusFilter === 'PROCESSING' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-status="PROCESSING">Diproses (${processingCount})</button>
              <button type="button" class="btn-orders-status-tab px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${ordersStatusFilter === 'COMPLETED' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-status="COMPLETED">Selesai (${completedCount})</button>
            </div>

            <!-- Channel Filter -->
            <div class="flex items-center justify-end gap-2 text-xs sm:col-span-1">
              <span class="font-bold text-slate-500 whitespace-nowrap">Sumber:</span>
              <select id="select-orders-channel" class="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none bg-white focus:border-emerald-500 w-full sm:w-auto">
                <option value="all" ${ordersChannelFilter === 'all' ? 'selected' : ''}>Semua Saluran</option>
                <option value="WEB_WA" ${ordersChannelFilter === 'WEB_WA' ? 'selected' : ''}>Web Checkout WA</option>
                <option value="B_POS" ${ordersChannelFilter === 'B_POS' ? 'selected' : ''}>Kasir POS Offline</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Orders Table -->
        <div class="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                  <th class="p-4 w-40">No. Faktur / Invoice</th>
                  <th class="p-4 w-36">Waktu & Tanggal</th>
                  <th class="p-4">Nama Pelanggan</th>
                  <th class="p-4 w-32">Sumber</th>
                  <th class="p-4 w-32">Total Tagihan</th>
                  <th class="p-4 w-32 text-center">Status</th>
                  <th class="p-4 w-44 text-center">Aksi Transaksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${filteredOrders.length === 0 ? `
                  <tr>
                    <td colspan="7" class="p-10 text-center text-slate-400 text-xs">
                      Tidak ada pesanan yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ` : filteredOrders.map(ord => renderOrderTableRow(ord)).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    // Event bindings
    const btnBackDash = document.getElementById('btn-back-to-dashboard');
    if (btnBackDash) btnBackDash.addEventListener('click', () => navigate('dashboard'));

    const searchInput = document.getElementById('input-orders-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        ordersSearchQuery = e.target.value;
        renderOrdersView();
      });
    }

    container.querySelectorAll('.btn-orders-status-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        ordersStatusFilter = tab.getAttribute('data-status') || 'all';
        renderOrdersView();
      });
    });

    const channelSelect = document.getElementById('select-orders-channel');
    if (channelSelect) {
      channelSelect.addEventListener('change', (e) => {
        ordersChannelFilter = e.target.value;
        renderOrdersView();
      });
    }

    bindOrderTableActionButtons(container);

    if (window.lucide) window.lucide.createIcons();
  }

  // ----------------------------------------------------------------------------
  // 13. ORDER DETAIL MODAL & THERMAL PRINT HANDLERS
  // ----------------------------------------------------------------------------
  function openOrderDetailModal(orderId) {
    const order = DB.getOrderById(orderId);
    if (!order) {
      showToast('Pesanan tidak ditemukan.', 'error');
      return;
    }

    activeDetailOrderId = orderId;
    const modal = document.getElementById('modal-order-detail');
    const titleEl = document.getElementById('order-detail-title');
    const invoiceIdEl = document.getElementById('order-detail-invoice-id');
    const bodyEl = document.getElementById('order-detail-body');
    if (!modal || !bodyEl) return;

    if (titleEl) titleEl.textContent = `Faktur Pesanan - ${order.customer_name || 'Pelanggan'}`;
    if (invoiceIdEl) invoiceIdEl.textContent = `#${order.invoice_number}`;

    const formatIDR = (num) => 'Rp ' + Math.round(num || 0).toLocaleString('id-ID');
    const d = new Date(order.created_at);
    const dateFormatted = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    const items = order.items || [];

    bodyEl.innerHTML = `
      <div class="space-y-4">
        <!-- Customer & Order Meta -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
          <div>
            <span class="text-[10px] text-slate-400 font-bold uppercase block">Data Pemesan</span>
            <span class="font-extrabold text-slate-900 text-sm block">${escapeHtml(order.customer_name || 'Pelanggan Umum')}</span>
            <span class="text-slate-500 font-mono text-[11px] block">WhatsApp: ${escapeHtml(order.customer_phone || '-')}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 font-bold uppercase block">Waktu & Saluran Transaksi</span>
            <span class="font-mono font-bold text-slate-700 block">${dateFormatted}</span>
            <span class="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${order.channel === 'WEB_WA' ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-800'}">
              ${order.channel === 'WEB_WA' ? 'Web Checkout WhatsApp' : 'Kasir POS Offline'}
            </span>
          </div>
        </div>

        <!-- Status Selector -->
        <div class="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span class="block font-bold text-emerald-950">Status Pengerjaan Pesanan:</span>
            <span class="text-[11px] text-emerald-700">Perbarui status produksi atau pembayaran pesanan ini.</span>
          </div>
          <select id="detail-order-status-select" class="px-3 py-2 rounded-xl border border-emerald-300 bg-white font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-400">
            <option value="PENDING" ${(order.status || 'PENDING') === 'PENDING' ? 'selected' : ''}>Menunggu Konfirmasi</option>
            <option value="PROCESSING" ${order.status === 'PROCESSING' ? 'selected' : ''}>Sedang Diproses / Dicetak</option>
            <option value="COMPLETED" ${order.status === 'COMPLETED' || order.status === 'PAID' ? 'selected' : ''}>Selesai / Lunas</option>
            <option value="CANCELLED" ${order.status === 'CANCELLED' ? 'selected' : ''}>Dibatalkan</option>
          </select>
        </div>

        <!-- Items Table -->
        <div class="rounded-2xl border border-slate-200 overflow-hidden">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-100/80 font-bold text-slate-700">
              <tr>
                <th class="p-2.5">Produk & Spesifikasi</th>
                <th class="p-2.5 text-center w-16">Qty</th>
                <th class="p-2.5 text-right w-28">Harga</th>
                <th class="p-2.5 text-right w-32">Subtotal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-mono">
              ${items.map(it => `
                <tr>
                  <td class="p-2.5 font-sans font-medium text-slate-900">
                    <div class="font-bold">${escapeHtml(it.name || it.productName)}</div>
                    ${it.specsText ? `<div class="text-[11px] text-slate-400 font-normal">${escapeHtml(it.specsText)}</div>` : ''}
                  </td>
                  <td class="p-2.5 text-center font-bold text-slate-700">${it.qty}</td>
                  <td class="p-2.5 text-right text-slate-600">${formatIDR(it.unitPrice)}</td>
                  <td class="p-2.5 text-right font-bold text-slate-900">${formatIDR(it.subtotal)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Financial Summary -->
        <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs font-mono">
          <div class="flex justify-between text-slate-600">
            <span>Subtotal Item:</span>
            <span>${formatIDR(order.subtotal || order.total)}</span>
          </div>
          ${order.discount > 0 ? `
            <div class="flex justify-between text-rose-600 font-bold">
              <span>Diskon (${order.voucher_code || 'Voucher'}):</span>
              <span>-${formatIDR(order.discount)}</span>
            </div>
          ` : ''}
          <div class="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
            <span>TOTAL TAGIHAN:</span>
            <span class="text-emerald-700">${formatIDR(order.total)}</span>
          </div>
          <div class="flex justify-between text-[11px] text-slate-400 pt-1">
            <span>Metode Bayar:</span>
            <span class="uppercase">${escapeHtml(order.payment_method || 'Tunai (CASH)')}</span>
          </div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  function closeOrderDetailModal() {
    const modal = document.getElementById('modal-order-detail');
    if (modal) modal.classList.add('hidden');
    activeDetailOrderId = null;
  }

  function handleSaveOrderDetailStatus() {
    if (!activeDetailOrderId) return;
    const statusSelect = document.getElementById('detail-order-status-select');
    const newStatus = statusSelect?.value || 'PENDING';

    DB.updateOrderStatus(activeDetailOrderId, newStatus);
    showToast(`Status pesanan berhasil diperbarui ke: ${newStatus}`, 'success');
    closeOrderDetailModal();

    // Re-render current view if dashboard or orders
    if (currentView === 'dashboard') renderDashboardView();
    if (currentView === 'orders') renderOrdersView();
    updateSidebarNavActive(currentView);
  }

  function handlePrintOrderDetailReceipt() {
    if (!activeDetailOrderId) return;
    const orderId = activeDetailOrderId;
    closeOrderDetailModal();
    printOrderReceipt(orderId);
  }

  function printOrderReceipt(orderId) {
    const order = DB.getOrderById(orderId);
    if (!order) {
      showToast('Pesanan tidak ditemukan.', 'error');
      return;
    }

    const settings = DB.getSettings();
    posActiveReceiptData = {
      invoice_number: order.invoice_number,
      order_prefix: order.order_prefix || 'DnC',
      channel: order.channel || 'B_POS',
      customer_name: order.customer_name || 'Pelanggan Umum',
      customer_phone: order.customer_phone || '-',
      items: order.items || [],
      subtotal: order.subtotal || order.total || 0,
      discount: order.discount || 0,
      voucher_code: order.voucher_code || null,
      total: order.total || 0,
      cash: order.cash || order.total || 0,
      change: order.change || 0,
      payment_method: order.payment_method || 'CASH',
      status: order.status || 'PAID',
      paper_width: settings.printer_paper_width || '58mm',
      store_name: settings.store_name || currentTenant.store_name,
      store_address: settings.store_address || 'Jl. Percetakan Terpadu No. 1',
      store_phone: settings.store_phone || '0812-3456-7890',
      receipt_footer: settings.receipt_footer || 'Terima kasih atas pesanan Anda!',
      created_at: order.created_at || new Date().toISOString()
    };

    renderThermalReceiptText(posActiveReceiptData);
    const modal = document.getElementById('modal-thermal-receipt');
    if (modal) modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  // ----------------------------------------------------------------------------
  // 14. TEMA & BRANDING VIEW (IDENTITAS TOKO + HERO STOREFRONT)
  // ----------------------------------------------------------------------------
  function renderThemeBrandingView() {
    const container = document.getElementById('theme-branding-container') || document.getElementById('branding-hero-view-container');
    if (!container) return;

    const settings = DB.getSettings();

    const navbarBgColor = settings.navbar_bg_color || '#ffffff';
    const navbarTextColor = settings.navbar_text_color || '#0f172a';
    const bodyBgColor = settings.body_bg_color || '#f8fafc';
    const currentBodyBg = (typeof settings !== 'undefined' && settings.body_bg_color) ? settings.body_bg_color : '#f8fafc';
    const primaryColor = settings.primary_color || '#33b589';
    const secondaryColor = settings.secondary_color || '#f59e0b';

    // Hero Background & Styling Settings
    const heroBgType = settings.hero_bg_type || 'linear_gradient';
    const heroBgColor1 = settings.hero_bg_color1 || '#0f172a';
    const heroBgColor2 = settings.hero_bg_color2 || '#064e3b';
    const heroBgAngle = settings.hero_bg_angle !== undefined ? settings.hero_bg_angle : 135;
    const heroTitleColor = settings.hero_title_color || '#ffffff';
    const heroSubtitleColor = settings.hero_subtitle_color || '#cbd5e1';
    const heroShowTimer = settings.hero_show_timer !== false;
    const heroCtaMode = settings.hero_cta_mode || 'dual';
    const heroCta1Text = settings.hero_cta1_text || settings.hero_cta_text || 'Lihat Semua Katalog';
    const heroCta1Bg = settings.hero_cta1_bg || primaryColor;
    const heroCta1TextColor = settings.hero_cta1_text_color || '#ffffff';
    const heroCta1IconColor = settings.hero_cta1_icon_color || '#ffffff';
    const heroCta2Text = settings.hero_cta2_text || 'Konsultasi Desain & Cetak';
    const heroCta2Bg = settings.hero_cta2_bg || '#25d366';
    const heroCta2TextColor = settings.hero_cta2_text_color || '#ffffff';
    const heroCta2IconColor = settings.hero_cta2_icon_color || '#ffffff';
    const heroCtaUseThemeDefault = settings.hero_cta_use_theme_default === true;

    // Map backwards-compatible hero model
    let heroModel = settings.hero_model;
    if (!heroModel) {
      if (settings.hero_type === 'text') heroModel = 'model_1';
      else heroModel = 'model_2';
    }
    const heroWidthLayout = settings.hero_width_layout || 'boxed';
    const heroShowArrows = settings.hero_show_arrows !== false;
    const cardProductVersion = settings.card_product_version || 'v1';

    // Navbar Branding Mode & Custom Text Colors
    const navbarBrandingMode = settings.navbar_branding_mode || (settings.header_use_logo === false ? 'text_only' : 'logo_landscape');
    const navbarStoreNameColor = settings.navbar_store_name_color || navbarTextColor;
    const navbarTaglineColor = settings.navbar_tagline_color || '#64748b';

    const heroBanners = (settings.hero_banners && settings.hero_banners.length > 0)
      ? settings.hero_banners
      : (settings.hero_banner_image ? [settings.hero_banner_image] : ['assets/images/banner1.jpg']);

    const heroAnimation = settings.hero_slider_animation || 'slide_3s';

    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-6 pb-20">
        
        <!-- Header Section -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
              <span>Konfigurasi Toko</span> <span>/</span> <span class="text-slate-800 font-bold">Tema & Branding</span>
            </div>
            <h1 class="text-2xl font-black text-slate-900 tracking-tight">Tema & Branding Toko</h1>
            <p class="text-xs text-slate-500 mt-0.5">Kelola identitas visual, warna navbar & body, model hero banner, dan pantau melalui Live Preview Toko real-time.</p>
          </div>
          <button type="button" id="btn-save-theme-branding" class="btn-primary-brand px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-2 hover:brightness-105 transition">
            <i data-lucide="save" class="w-4 h-4"></i>
            <span>Simpan Tema & Branding</span>
          </button>
        </div>

        <!-- DEDICATED LIVE PREVIEW HERO BANNER (ISOLASI IFRAME & RESPONSIF DINAMIS) -->
        <div class="bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-800 space-y-4">
          <div class="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
              <span class="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span class="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span class="ml-2 font-bold text-xs text-white flex items-center gap-2">
                <i data-lucide="eye" class="w-4 h-4 text-emerald-400"></i>
                <span>Live Preview Toko: Navbar & Hero Banner</span>
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Isolasi Komponen
              </span>
            </div>

            <!-- CONTROLS: GREETING TOGGLE, 3 RESOLUTION PRESETS & MANUAL RESIZE SLIDER -->
            <div class="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <!-- TOGGLE TAMPILKAN SAPAAN HERO -->
              <div class="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                <span class="font-bold text-[11px] text-slate-300">Sapaan:</span>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="hero-greeting-preview-toggle" ${settings.hero_greeting_enabled !== false ? 'checked' : ''} class="sr-only peer" />
                  <div class="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <!-- 3 PRESET RESOLUSI (DESKTOP, TAB, MOBILE) -->
              <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
                <button type="button" id="btn-hero-preset-desktop" class="hero-preset-btn px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 bg-emerald-600 text-white shadow-xs cursor-pointer" data-width="1200" title="Preset Resolusi Layar Desktop (1200px)">
                  <i data-lucide="monitor" class="w-3.5 h-3.5"></i>
                  <span>Desktop</span>
                </button>
                <button type="button" id="btn-hero-preset-tablet" class="hero-preset-btn px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer" data-width="768" title="Preset Resolusi Layar Tablet (768px)">
                  <i data-lucide="tablet" class="w-3.5 h-3.5"></i>
                  <span>Tab</span>
                </button>
                <button type="button" id="btn-hero-preset-mobile" class="hero-preset-btn px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer" data-width="390" title="Preset Resolusi Layar Mobile (390px)">
                  <i data-lucide="smartphone" class="w-3.5 h-3.5"></i>
                  <span>Mobile</span>
                </button>
              </div>

              <!-- MANUAL RESIZE SLIDER & PX DISPLAY -->
              <div class="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <span class="text-[10px] font-bold text-slate-400">Lebar:</span>
                <input type="range" id="hero-preview-width-slider" min="360" max="1200" value="1200" step="5" class="w-20 sm:w-28 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-ew-resize accent-emerald-500" title="Geser untuk resize lebar preview secara dinamis" />
                <span id="hero-preview-width-display" class="font-mono text-[11px] font-black text-emerald-400 min-w-[50px] text-right">1200px</span>
              </div>
            </div>
          </div>

          <!-- ISOLATED CONTAINER WRAPPER WITH DYNAMIC RESIZE HANDLE & IFRAME -->
          <div class="w-full flex justify-center overflow-x-auto py-2">
            <div id="hero-preview-resizable-wrapper" class="preview-viewport-wrapper relative transition-[width] duration-150 ease-out flex justify-center w-full max-w-[1200px]">
              
              <!-- IFRAME ISOLASI (MEDIA QUERY & CSS LAYOUT 100% IDENTIK TANPA DISTORSI) -->
              <iframe id="hero-preview-iframe" class="w-full rounded-2xl shadow-2xl border border-slate-800 bg-white" scrolling="auto"></iframe>

              <!-- MANUAL RESIZE HANDLE (DRAGGABLE SLIDER/HANDLE DI TEPI KANAN) -->
              <div id="hero-preview-drag-handle" class="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-14 bg-slate-800 hover:bg-emerald-600 border border-slate-600 hover:border-emerald-400 rounded-full flex flex-col items-center justify-center gap-1 cursor-ew-resize shadow-lg z-30 transition-colors group select-none" title="Tarik ke kiri/kanan untuk resize bebas">
                <span class="w-1 h-1 rounded-full bg-slate-400 group-hover:bg-white"></span>
                <span class="w-1 h-1 rounded-full bg-slate-400 group-hover:bg-white"></span>
                <span class="w-1 h-1 rounded-full bg-slate-400 group-hover:bg-white"></span>
              </div>
            </div>
          </div>
        </div>

        <form id="form-theme-branding" class="space-y-6" onsubmit="event.preventDefault();">
          
          <!-- BAGIAN 1: KONTROL WARNA LENGKAP (NAVBAR, BODY, & TEMA) -->
          <div class="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm">
                1
              </div>
              <div>
                <h3 class="font-extrabold text-sm sm:text-base text-slate-900">Skema Warna & Tampilan Toko</h3>
                <p class="text-xs text-slate-500">Sesuaikan warna navbar etalase, latar belakang halaman body toko, serta warna aksen tema primer & sekunder.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              <!-- 1. Warna Navbar Toko -->
              <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div>
                  <span class="block font-bold text-slate-900">Warna Latar Navbar Toko:</span>
                  <p class="text-[11px] text-slate-400">Header navigasi atas storefront</p>
                </div>
                <div class="flex items-center gap-2.5">
                  <input type="color" id="ctrl-color-navbar-bg" value="${navbarBgColor}" class="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white shadow-xs" />
                  <input type="text" id="ctrl-hex-navbar-bg" value="${navbarBgColor}" maxlength="7" class="w-24 px-2.5 py-2 rounded-xl border border-slate-300 font-mono text-xs font-bold uppercase text-slate-800 outline-none focus:border-emerald-500" placeholder="#FFFFFF" />
                </div>
              </div>

              <!-- 2. Warna Teks Navbar Toko -->
              <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div>
                  <span class="block font-bold text-slate-900">Warna Teks & Ikon Navbar:</span>
                  <p class="text-[11px] text-slate-400">Teks menu dan ikon header</p>
                </div>
                <div class="flex items-center gap-2.5">
                  <input type="color" id="ctrl-color-navbar-text" value="${navbarTextColor}" class="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white shadow-xs" />
                  <input type="text" id="ctrl-hex-navbar-text" value="${navbarTextColor}" maxlength="7" class="w-24 px-2.5 py-2 rounded-xl border border-slate-300 font-mono text-xs font-bold uppercase text-slate-800 outline-none focus:border-emerald-500" placeholder="#0F172A" />
                </div>
              </div>

              <!-- 3. Warna Body Toko -->
              <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div>
                  <span class="block font-bold text-slate-900">Warna Latar Body Toko:</span>
                  <p class="text-[11px] text-slate-400">Background seluruh halaman etalase</p>
                </div>
                <div class="flex items-center gap-2.5">
                  <input type="color" id="ctrl-color-body-bg" value="${bodyBgColor}" class="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white shadow-xs" />
                  <input type="text" id="ctrl-hex-body-bg" value="${bodyBgColor}" maxlength="7" class="w-24 px-2.5 py-2 rounded-xl border border-slate-300 font-mono text-xs font-bold uppercase text-slate-800 outline-none focus:border-emerald-500" placeholder="#F8FAFC" />
                </div>
              </div>

              <!-- 4. Warna Primer Toko -->
              <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div>
                  <span class="block font-bold text-slate-900">Warna Primer Toko:</span>
                  <p class="text-[11px] text-slate-400">Tombol CTA, badge utama & sorotan</p>
                </div>
                <div class="flex items-center gap-2.5">
                  <input type="color" id="ctrl-color-primary" value="${primaryColor}" class="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white shadow-xs" />
                  <input type="text" id="ctrl-hex-primary" value="${primaryColor}" maxlength="7" class="w-24 px-2.5 py-2 rounded-xl border border-slate-300 font-mono text-xs font-bold uppercase text-slate-800 outline-none focus:border-emerald-500" placeholder="#33B589" />
                </div>
              </div>

              <!-- 5. Warna Sekunder Toko -->
              <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 md:col-span-2">
                <div>
                  <span class="block font-bold text-slate-900">Warna Sekunder & Aksen:</span>
                  <p class="text-[11px] text-slate-400">Aksen diskon, rating ulasan bintang & elemen pendukung</p>
                </div>
                <div class="flex items-center gap-2.5">
                  <input type="color" id="ctrl-color-secondary" value="${secondaryColor}" class="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white shadow-xs" />
                  <input type="text" id="ctrl-hex-secondary" value="${secondaryColor}" maxlength="7" class="w-24 px-2.5 py-2 rounded-xl border border-slate-300 font-mono text-xs font-bold uppercase text-slate-800 outline-none focus:border-emerald-500" placeholder="#F59E0B" />
                </div>
              </div>

            </div>
          </div>

          <!-- BAGIAN 2: IDENTITAS TOKO & LOGO -->
          <div class="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm">
                2
              </div>
              <div>
                <h3 class="font-extrabold text-sm sm:text-base text-slate-900">Identitas Toko & Logo</h3>
                <p class="text-xs text-slate-500">Logo utama, nama toko, slogan percetakan, dan kontak resmi.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start text-xs">
              
              <!-- Logo Upload & Preview (4 cols) -->
              <div class="md:col-span-4 space-y-4">
                <div class="space-y-3">
                  <label class="block font-bold text-slate-700">Logo Utama Toko:</label>
                  <div class="w-full aspect-[4/3] rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 relative group overflow-hidden shadow-inner">
                    <img id="preview-store-logo-img" src="${settings.web_logo || 'assets/images/logo-songer-creative.png'}" class="max-h-24 w-auto object-contain transition duration-300 group-hover:scale-105" alt="Preview Logo" onerror="this.src='assets/images/logo-songer-creative.png'" />
                  </div>
                  <div class="space-y-2">
                    <input type="text" id="store-logo-url-input" value="${escapeHtml(settings.web_logo || 'assets/images/logo-songer-creative.png')}" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-[11px] outline-none focus:border-emerald-500" placeholder="Path logo atau URL gambar" />
                    <label class="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer border border-slate-200 transition flex items-center justify-center gap-1.5">
                      <i data-lucide="upload" class="w-4 h-4"></i>
                      <span>Unggah Logo (Maks 500 KB)</span>
                      <input type="file" id="store-logo-file-input" accept="image/*" class="hidden" />
                    </label>
                  </div>
                </div>

                <div class="space-y-3 pt-4 border-t border-slate-100">
                  <label class="block font-bold text-slate-700">Icon Browser / Favicon:</label>
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center p-2 relative overflow-hidden shadow-inner shrink-0">
                      <img id="preview-store-favicon-img" src="${settings.browser_icon || 'assets/images/favicon.png'}" class="w-full h-full object-contain" alt="Preview Favicon" onerror="this.src='assets/images/favicon.png'" />
                    </div>
                    <div class="flex-1 space-y-2">
                      <input type="text" id="store-favicon-url-input" value="${escapeHtml(settings.browser_icon || 'assets/images/favicon.png')}" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-[11px] outline-none focus:border-emerald-500" placeholder="Path favicon atau URL" />
                      <label class="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer border border-slate-200 transition flex items-center justify-center gap-1.5">
                        <i data-lucide="image" class="w-3.5 h-3.5"></i>
                        <span>Unggah Favicon (Maks 500 KB)</span>
                        <input type="file" id="store-favicon-file-input" accept="image/png, image/x-icon, image/webp" class="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Store Details Form (8 cols) -->
              <div class="md:col-span-8 space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Nama Toko / Brand <span class="text-red-500">*</span>:</label>
                    <input type="text" id="store-name-input" value="${escapeHtml(settings.store_name || currentTenant.store_name || 'Songer Creative')}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 outline-none focus:border-emerald-500" required />
                  </div>
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Nomor WhatsApp CS Toko:</label>
                    <input type="text" id="store-phone-input" value="${escapeHtml(settings.store_phone || '0888-5844-380')}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono outline-none focus:border-emerald-500 font-semibold" placeholder="0888-5844-380" />
                  </div>
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1">Slogan / Tagline Toko:</label>
                  <input type="text" id="store-tagline-input" value="${escapeHtml(settings.store_tagline || 'Digital Printing & Percetakan Terpadu')}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 font-medium" placeholder="Digital Printing & Percetakan Terpadu" />
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1">Alamat Workshop / Kantor Toko:</label>
                  <textarea id="store-address-input" rows="2" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 leading-relaxed font-medium" placeholder="Alamat lengkap workshop percetakan">${escapeHtml(settings.store_address || 'Jl. Raya Percetakan Kreatif No. 88, Kota Anda')}</textarea>
                </div>

                <!-- KONFIGURASI HEADER BRANDING NAVBAR (3 OPSI MODEL BRANDING) -->
                <div class="pt-4 border-t border-slate-100 space-y-4">
                  <div class="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div>
                      <h4 class="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                        <i data-lucide="layout-template" class="w-4 h-4 text-emerald-600"></i>
                        <span>Format Tampilan Identitas Navbar Toko</span>
                      </h4>
                      <p class="text-[11px] text-slate-500">Pilih bagaimana logo atau nama toko ditampilkan pada bar navigasi atas etalase.</p>
                    </div>
                  </div>

                  <!-- 3 PILIHAN MODEL BRANDING NAVBAR SESUAI WIREFRAME -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    <!-- [1] Logo Persegi / Icon -->
                    <label class="navbar-branding-choice-card p-3.5 rounded-2xl border ${navbarBrandingMode === 'logo_square' ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex flex-col justify-between gap-2.5" data-mode="logo_square">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-slate-900 text-xs flex items-center gap-2">
                          <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">1</span>
                          <span>Logo Persegi / Icon</span>
                        </span>
                        <input type="radio" name="navbar_branding_mode_radio" value="logo_square" ${navbarBrandingMode === 'logo_square' ? 'checked' : ''} class="text-emerald-600" />
                      </div>
                      <div class="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto my-1">
                        <i data-lucide="square" class="w-5 h-5 text-slate-500"></i>
                      </div>
                      <p class="text-slate-500 text-[10px] leading-relaxed">
                        Kotak persegi (1:1) di sisi kiri navbar, minimalis dan modern.
                      </p>
                    </label>

                    <!-- [2] Logo Landscape -->
                    <label class="navbar-branding-choice-card p-3.5 rounded-2xl border ${navbarBrandingMode === 'logo_landscape' ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex flex-col justify-between gap-2.5" data-mode="logo_landscape">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-slate-900 text-xs flex items-center gap-2">
                          <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">2</span>
                          <span>Logo Landscape</span>
                        </span>
                        <input type="radio" name="navbar_branding_mode_radio" value="logo_landscape" ${navbarBrandingMode === 'logo_landscape' ? 'checked' : ''} class="text-emerald-600" />
                      </div>
                      <div class="w-20 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto my-2">
                        <i data-lucide="rectangle-horizontal" class="w-5 h-5 text-slate-500"></i>
                      </div>
                      <p class="text-slate-500 text-[10px] leading-relaxed">
                        Memanjang horizontal di sisi kiri navbar, pas untuk logo teks/wide.
                      </p>
                    </label>

                    <!-- [3] Hanya Teks (Nama Toko & Tagline) -->
                    <label class="navbar-branding-choice-card p-3.5 rounded-2xl border ${navbarBrandingMode === 'text_only' ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex flex-col justify-between gap-2.5" data-mode="text_only">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-slate-900 text-xs flex items-center gap-2">
                          <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">3</span>
                          <span>Hanya Teks</span>
                        </span>
                        <input type="radio" name="navbar_branding_mode_radio" value="text_only" ${navbarBrandingMode === 'text_only' ? 'checked' : ''} class="text-emerald-600" />
                      </div>
                      <div class="py-1 px-2 text-center my-auto">
                        <span class="block font-black text-slate-900 text-xs tracking-tight truncate leading-tight">NAMA TOKO</span>
                        <span class="block text-slate-400 text-[9px] truncate leading-tight">Tagline percetakan</span>
                      </div>
                      <p class="text-slate-500 text-[10px] leading-relaxed">
                        Tanpa logo gambar. Nama toko & slogan tersusun rapi 2 baris.
                      </p>
                    </label>

                  </div>

                  <!-- INPUT WARNA KONDISIONAL (HANYA MUNCUL PADA MODE HANYA TEKS) -->
                  <div id="navbar-text-only-colors-container" class="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 ${navbarBrandingMode === 'text_only' ? '' : 'hidden'} transition-all">
                    <div class="flex items-center gap-2 pb-1 border-b border-slate-200/60">
                      <i data-lucide="palette" class="w-4 h-4 text-emerald-600"></i>
                      <span class="font-bold text-slate-800 text-xs">Pengaturan Warna Teks Branding Navbar:</span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <!-- 1. Warna Nama Toko -->
                      <div class="space-y-1.5">
                        <label class="block font-bold text-slate-700 text-xs">1. Warna Nama Toko:</label>
                        <div class="flex items-center gap-2.5">
                          <input type="color" id="ctrl-color-navbar-store-name" value="${navbarStoreNameColor}" class="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white shadow-xs shrink-0" />
                          <input type="text" id="ctrl-hex-navbar-store-name" value="${navbarStoreNameColor}" maxlength="7" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs uppercase font-semibold text-slate-800 outline-none focus:border-emerald-500 bg-white" placeholder="#0F172A" />
                        </div>
                        <p class="text-[10px] text-slate-400">Default: gelap (#0F172A) atau sesuai tema navbar.</p>
                      </div>

                      <!-- 2. Warna Tagline Toko -->
                      <div class="space-y-1.5">
                        <label class="block font-bold text-slate-700 text-xs">2. Warna Tagline Toko:</label>
                        <div class="flex items-center gap-2.5">
                          <input type="color" id="ctrl-color-navbar-tagline" value="${navbarTaglineColor}" class="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white shadow-xs shrink-0" />
                          <input type="text" id="ctrl-hex-navbar-tagline" value="${navbarTaglineColor}" maxlength="7" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs uppercase font-semibold text-slate-800 outline-none focus:border-emerald-500 bg-white" placeholder="#64748B" />
                        </div>
                        <p class="text-[10px] text-slate-400">Default: abu-abu (#64748B).</p>
                      </div>
                    </div>
                  </div>

                  <!-- TOGGLE OPSIONAL DESKTOP (JIKA LOGO PERSEGI ATAU LANDSCAPE AKTIF) -->
                  <div id="navbar-logo-desktop-name-toggle-container" class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 ${navbarBrandingMode === 'text_only' ? 'hidden' : ''}">
                    <div>
                      <div class="flex items-center gap-1.5">
                        <span class="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 font-bold text-[10px]">💻 Layar Desktop</span>
                        <label class="block font-bold text-slate-800 text-xs">Tampilkan Nama & Slogan Toko di Samping Logo (Desktop):</label>
                      </div>
                      <p class="text-[11px] text-slate-500 mt-0.5">Jika aktif, layar desktop menampilkan <strong>[Logo] | [Nama & Slogan]</strong>. Jika nonaktif, desktop murni menampilkan logo saja (sesuai wireframe).</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" id="ctrl-toggle-show-header-store-name" ${settings.show_header_store_name !== false ? 'checked' : ''} class="sr-only peer" />
                      <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- BAGIAN 3: 4 PILIHAN MODEL HERO SECTION & ANIMASI SLIDER -->
          <div class="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm">
                3
              </div>
              <div>
                <h3 class="font-extrabold text-sm sm:text-base text-slate-900">4 Model Tampilan Hero Section & Slider Banner</h3>
                <p class="text-xs text-slate-500">Pilih dari 4 variasi layout hero banner etalase sesuai konsep brand toko Anda.</p>
              </div>
            </div>

            <!-- GRID 4 PILIHAN MODEL HERO -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              <!-- [1] Model 1: Teks Headline Saja + CTA (Tanpa Banner Gambar) -->
              <label class="hero-model-card p-4 rounded-2xl border ${heroModel === 'model_1' ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition space-y-2 block" data-model="model_1">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-900 flex items-center gap-2">
                    <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">1</span>
                    Model Teks Headline Saja + CTA
                  </span>
                  <input type="radio" name="hero_model_radio" value="model_1" ${heroModel === 'model_1' ? 'checked' : ''} class="text-emerald-600" />
                </div>
                <p class="text-slate-500 text-[11px] leading-relaxed">
                  Tampilan minimalis elegan berfokus pada teks judul promosi besar, subheadline, serta tombol aksi (CTA) tanpa banner gambar.
                </p>
              </label>

              <!-- [2] Model 2: Full-Width Gambar 100% (Murni Gambar Penuh, Tanpa Teks & CTA) -->
              <label class="hero-model-card p-4 rounded-2xl border ${heroModel === 'model_2' ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition space-y-2 block" data-model="model_2">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-900 flex items-center gap-2">
                    <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">2</span>
                    Model Full-Width Gambar 100%
                  </span>
                  <input type="radio" name="hero_model_radio" value="model_2" ${heroModel === 'model_2' ? 'checked' : ''} class="text-emerald-600" />
                </div>
                <p class="text-slate-500 text-[11px] leading-relaxed">
                  Murni gambar banner penuh 100% layar (slider mulus horizontal) tanpa teks judul dan tanpa tombol overlay.
                </p>
              </label>

              <!-- [3] Model 3: Full-Width Gambar 100% DENGAN Teks & CTA Overlay -->
              <label class="hero-model-card p-4 rounded-2xl border ${heroModel === 'model_3' ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition space-y-2 block" data-model="model_3">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-900 flex items-center gap-2">
                    <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">3</span>
                    Model Full-Width Gambar + Overlay Teks & CTA
                  </span>
                  <input type="radio" name="hero_model_radio" value="model_3" ${heroModel === 'model_3' ? 'checked' : ''} class="text-emerald-600" />
                </div>
                <p class="text-slate-500 text-[11px] leading-relaxed">
                  Banner visual grafis layar penuh dengan overlay kontras tinggi di atasnya berisi teks headline, subheadline, dan tombol CTA.
                </p>
              </label>

              <!-- [4] Model 4: Split / Berdampingan (2 Kolom: Kiri Teks Judul & CTA, Kanan Slider Multi-Gambar) -->
              <label class="hero-model-card p-4 rounded-2xl border ${heroModel === 'model_4' ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition space-y-2 block" data-model="model_4">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-900 flex items-center gap-2">
                    <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">4</span>
                    Model Split 2 Kolom Berdampingan
                  </span>
                  <input type="radio" name="hero_model_radio" value="model_4" ${heroModel === 'model_4' ? 'checked' : ''} class="text-emerald-600" />
                </div>
                <p class="text-slate-500 text-[11px] leading-relaxed">
                  Layout modern split 2 kolom: sisi kiri menampilkan teks judul promosi & CTA, sisi kanan menampilkan slider multi-gambar dinamis.
                </p>
              </label>

            </div>

            <!-- PILIHAN VARIAN LEBAR LAYOUT HERO (KHUSUS UNTUK 'HANYA GAMBAR' & 'GAMBAR & TEKS') -->
            <div id="hero-layout-width-section" class="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 ${(heroModel === 'model_2' || heroModel === 'model_3') ? '' : 'hidden'}">
              <div class="flex items-center gap-2">
                <i data-lucide="layout" class="w-4 h-4 text-emerald-600"></i>
                <h4 class="font-extrabold text-xs sm:text-sm text-slate-900">Pilih Varian Lebar Layout Tampilan Hero:</h4>
              </div>
              <p class="text-[11px] text-slate-500">Tentukan format lebar banner etalase toko sebelum mengisi pengaturan konfigurasi lanjutan:</p>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <!-- Pilihan 1: Lebar Penuh (100vw) -->
                <label class="hero-width-choice-card p-3.5 rounded-xl border ${heroWidthLayout === 'full' ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex flex-col gap-1.5" data-width="full">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <i data-lucide="maximize-2" class="w-3.5 h-3.5 text-emerald-600"></i>
                      <span>Pilihan 1: Lebar Penuh (Full-width / 100vw)</span>
                    </span>
                    <input type="radio" name="hero_width_layout_radio" value="full" ${heroWidthLayout === 'full' ? 'checked' : ''} class="text-emerald-600" />
                  </div>
                  <p class="text-slate-500 text-[11px] leading-relaxed">
                    Banner membentang penuh dari ujung tepi kiri ke ujung kanan layar tanpa batas margin container (Edge-to-Edge).
                  </p>
                </label>

                <!-- Pilihan 2: Lebar Standar / Kontainer -->
                <label class="hero-width-choice-card p-3.5 rounded-xl border ${heroWidthLayout === 'boxed' ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex flex-col gap-1.5" data-width="boxed">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <i data-lucide="box" class="w-3.5 h-3.5 text-blue-600"></i>
                      <span>Pilihan 2: Lebar Standar / Kontainer (Boxed)</span>
                    </span>
                    <input type="radio" name="hero_width_layout_radio" value="boxed" ${heroWidthLayout === 'boxed' ? 'checked' : ''} class="text-emerald-600" />
                  </div>
                  <p class="text-slate-500 text-[11px] leading-relaxed">
                    Banner berada rapi di dalam kotak kontainer standar toko dengan sudut melengkung modern rounded-3xl.
                  </p>
                </label>
              </div>
            </div>

            <!-- Pesan Gating jika model 2 atau 3 dipilih namun layout belum ditentukan -->
            <div id="hero-layout-unselected-msg" class="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5 hidden">
              <i data-lucide="info" class="w-4 h-4 text-amber-600 shrink-0"></i>
              <span>Silakan tentukan salah satu pilihan varian layout (Lebar Penuh atau Lebar Standar) di atas terlebih dahulu untuk membuka formulir konfigurasi banner lanjutan.</span>
            </div>

            <!-- FORM KONDISIONAL TEKS HEADLINE, BACKGROUND GRADASI & DUAL CTA (Aktif untuk Model 1, 3, dan 4) -->
            <div id="hero-text-controls-section" class="space-y-5 pt-4 border-t border-slate-100 text-xs ${heroModel === 'model_2' ? 'hidden' : ''}">
              <div class="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <i data-lucide="sliders" class="w-4 h-4 text-emerald-600"></i>
                <span>Kontrol Visual Background Hero, Tipografi, & Dual CTA</span>
              </div>

              <!-- KONTROL VISUAL SAPAAN HERO (BADGE DI ATAS HEADLINE HERO) -->
              <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <span class="font-bold text-slate-800 flex items-center gap-1.5">
                      <i data-lucide="sparkles" class="w-4 h-4 text-emerald-600"></i>
                      Kustomisasi Sapaan Hero (Badge di Atas Judul):
                    </span>
                    <p class="text-[11px] text-slate-400">Badge teks sapaan personal tanpa animasi titik berkedip.</p>
                  </div>
                </div>

                <div class="space-y-1">
                  <label class="block font-bold text-slate-700">Teks Sapaan Hero:</label>
                  <input type="text" id="hero-greeting-text-input" value="${escapeHtml(settings.hero_greeting_text || `${settings.store_name || 'Songer Creative'} Official`)}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 font-semibold" placeholder="Contoh: Selamat Datang di Songer Creative" />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600 mb-1">Warna Teks Sapaan:</label>
                    <div class="flex items-center gap-2">
                      <input type="color" id="hero-greeting-text-color-picker" value="${settings.hero_greeting_text_color || '#ffffff'}" class="w-8 h-8 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                      <input type="text" id="hero-greeting-text-color-hex" value="${settings.hero_greeting_text_color || '#ffffff'}" class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono text-xs uppercase" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600 mb-1">Warna Background Sapaan:</label>
                    <div class="flex items-center gap-2">
                      <input type="color" id="hero-greeting-bg-color-picker" value="${settings.hero_greeting_bg_color || 'rgba(255, 255, 255, 0.15)'}" class="w-8 h-8 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                      <input type="text" id="hero-greeting-bg-color-hex" value="${settings.hero_greeting_bg_color || 'rgba(255, 255, 255, 0.15)'}" class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono text-xs uppercase" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600 mb-1">Warna Border Sapaan:</label>
                    <div class="flex items-center gap-2">
                      <input type="color" id="hero-greeting-border-color-picker" value="${settings.hero_greeting_border_color || 'rgba(255, 255, 255, 0.20)'}" class="w-8 h-8 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                      <input type="text" id="hero-greeting-border-color-hex" value="${settings.hero_greeting_border_color || 'rgba(255, 255, 255, 0.20)'}" class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono text-xs uppercase" />
                    </div>
                  </div>
                </div>

                <div class="pt-1">
                  <label class="block text-[11px] font-semibold text-slate-600 mb-1">Radius Sudut Sapaan:</label>
                  <select id="hero-greeting-radius-select" class="w-full sm:w-60 px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs outline-none focus:border-emerald-500">
                    <option value="0px" ${(settings.hero_greeting_radius === '0px') ? 'selected' : ''}>0px (Kotak Tegak)</option>
                    <option value="8px" ${(settings.hero_greeting_radius === '8px') ? 'selected' : ''}>8px (Membulat Halus)</option>
                    <option value="16px" ${(settings.hero_greeting_radius === '16px') ? 'selected' : ''}>16px (Membulat Sedang)</option>
                    <option value="9999px" ${(settings.hero_greeting_radius === '9999px' || !settings.hero_greeting_radius) ? 'selected' : ''}>9999px (Pill Bulat Penuh)</option>
                  </select>
                </div>
              </div>

              <!-- 1. KONTROL TEKS HEADLINE & SUBHEADLINE -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="block font-bold text-slate-700">Judul Headline Toko:</label>
                  <input type="text" id="hero-headline-input" value="${escapeHtml(settings.hero_headline || 'Cetak Banner, Desain & Souvenir Harga Instan')}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 font-semibold" placeholder="Contoh: Cetak Banner & Desain Grafis Harga Instan" />
                </div>
                <div class="space-y-1">
                  <label class="block font-bold text-slate-700">Warna Judul Headline:</label>
                  <div class="flex items-center gap-2">
                    <input type="color" id="hero-title-color-picker" value="${heroTitleColor}" class="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                    <input type="text" id="hero-title-color-hex" value="${heroTitleColor}" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs uppercase" />
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="block font-bold text-slate-700">Deskripsi / Slogan Percetakan:</label>
                  <textarea id="hero-subheadline-input" rows="2" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 leading-relaxed font-medium" placeholder="Jelaskan keunggulan toko Anda...">${escapeHtml(settings.hero_subheadline || 'Katalog terpadu dengan kalkulator instan: spesifikasi kustom meteran, jasa desain original, hingga souvenir retail siap kirim ke seluruh Indonesia.')}</textarea>
                </div>
                <div class="space-y-1">
                  <label class="block font-bold text-slate-700">Warna Deskripsi / Subheadline:</label>
                  <div class="flex items-center gap-2">
                    <input type="color" id="hero-subtitle-color-picker" value="${heroSubtitleColor}" class="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                    <input type="text" id="hero-subtitle-color-hex" value="${heroSubtitleColor}" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs uppercase" />
                  </div>
                </div>
              </div>

              <!-- 2. KONTROL WARNA & GRADASI BACKGROUND HERO -->
              <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span class="font-bold text-slate-800 flex items-center gap-1.5">
                  <i data-lucide="palette" class="w-4 h-4 text-emerald-600"></i>
                  Latar Belakang Kontainer Hero (Background Styling):
                </span>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Tipe Latar:</label>
                    <select id="hero-bg-type-select" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold outline-none focus:border-emerald-500 bg-white text-xs">
                      <option value="solid" ${heroBgType === 'solid' ? 'selected' : ''}>Solid Color</option>
                      <option value="linear_gradient" ${heroBgType === 'linear_gradient' ? 'selected' : ''}>Linier Gradient</option>
                      <option value="radial_gradient" ${heroBgType === 'radial_gradient' ? 'selected' : ''}>Radial Gradient</option>
                    </select>
                  </div>
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Warna Utama (Warna 1):</label>
                    <div class="flex items-center gap-2">
                      <input type="color" id="hero-bg-color1-picker" value="${heroBgColor1}" class="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                      <input type="text" id="hero-bg-color1-hex" value="${heroBgColor1}" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs uppercase" />
                    </div>
                  </div>
                  <div id="hero-gradient-extra-col" class="${heroBgType === 'solid' ? 'hidden' : ''}">
                    <label class="block font-bold text-slate-700 mb-1">Warna Gradasi 2 & Sudut:</label>
                    <div class="flex items-center gap-2">
                      <input type="color" id="hero-bg-color2-picker" value="${heroBgColor2}" class="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                      <input type="text" id="hero-bg-color2-hex" value="${heroBgColor2}" class="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs uppercase" />
                      <input type="number" id="hero-bg-angle-input" value="${heroBgAngle}" min="0" max="360" class="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs text-center" placeholder="135°" title="Sudut arah gradasi (deg)" />
                    </div>
                  </div>
                </div>

                <!-- SWITCH COUNTDOWN TIMER DI HERO -->
                <div class="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <div class="space-y-0.5">
                    <span class="font-bold text-slate-800 flex items-center gap-1.5">
                      <i data-lucide="clock" class="w-3.5 h-3.5 text-emerald-600"></i>
                      Tampilkan Countdown Timer di Hero Section
                    </span>
                    <p class="text-[10px] text-slate-500">Tampilkan widget hitung mundur promo secara interaktif di etalase hero.</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" id="hero-show-timer-toggle" ${heroShowTimer ? 'checked' : ''} class="sr-only peer" />
                    <div class="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              <!-- 3. KONTROL DUAL CTA: KATALOG & KONSULTASI WHATSAPP -->
              <div class="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-2">
                  <span class="font-bold text-emerald-950 flex items-center gap-1.5 text-sm">
                    <i data-lucide="mouse-pointer-click" class="w-4 h-4 text-emerald-700"></i>
                    Sistem Tombol Aksi (Dual CTA Options)
                  </span>
                  <label class="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-900">
                    <input type="checkbox" id="hero-cta-use-theme-toggle" ${heroCtaUseThemeDefault ? 'checked' : ''} class="rounded text-emerald-600" />
                    <span>Jadikan Warna Default Tema</span>
                  </label>
                </div>

                <div class="space-y-2">
                  <label class="block font-bold text-slate-700">Pilihan Penggunaan Tombol:</label>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label class="p-2.5 rounded-xl border ${heroCtaMode === 'dual' ? 'border-emerald-500 bg-white ring-1 ring-emerald-500/20' : 'border-slate-200 bg-slate-50'} cursor-pointer flex items-center gap-2">
                      <input type="radio" name="hero_cta_mode_radio" value="dual" ${heroCtaMode === 'dual' ? 'checked' : ''} class="text-emerald-600" />
                      <span class="font-bold text-slate-800">Gunakan Kedua Tombol</span>
                    </label>
                    <label class="p-2.5 rounded-xl border ${heroCtaMode === 'catalog_only' ? 'border-emerald-500 bg-white ring-1 ring-emerald-500/20' : 'border-slate-200 bg-slate-50'} cursor-pointer flex items-center gap-2">
                      <input type="radio" name="hero_cta_mode_radio" value="catalog_only" ${heroCtaMode === 'catalog_only' ? 'checked' : ''} class="text-emerald-600" />
                      <span class="font-bold text-slate-800">Hanya Tombol Katalog</span>
                    </label>
                    <label class="p-2.5 rounded-xl border ${heroCtaMode === 'consultation_only' ? 'border-emerald-500 bg-white ring-1 ring-emerald-500/20' : 'border-slate-200 bg-slate-50'} cursor-pointer flex items-center gap-2">
                      <input type="radio" name="hero_cta_mode_radio" value="consultation_only" ${heroCtaMode === 'consultation_only' ? 'checked' : ''} class="text-emerald-600" />
                      <span class="font-bold text-slate-800">Hanya Konsultasi WA</span>
                    </label>
                  </div>
                </div>

                <!-- DETAIL TOMBOL 1: KATALOG -->
                <div class="p-3 bg-white rounded-xl border border-emerald-100 space-y-2">
                  <span class="font-bold text-slate-800 block text-xs">CTA 1: Tombol Katalog</span>
                  <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div class="sm:col-span-1">
                      <label class="block text-[10px] font-bold text-slate-500 mb-0.5">Teks Tombol:</label>
                      <input type="text" id="hero-cta1-text-input" value="${escapeHtml(heroCta1Text)}" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold text-xs" />
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 mb-0.5">Latar Tombol:</label>
                      <div class="flex items-center gap-1.5">
                        <input type="color" id="hero-cta1-bg-picker" value="${heroCta1Bg}" class="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                        <input type="text" id="hero-cta1-bg-hex" value="${heroCta1Bg}" class="w-full px-2 py-1 rounded border border-slate-300 font-mono text-[11px] uppercase" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 mb-0.5">Warna Teks:</label>
                      <div class="flex items-center gap-1.5">
                        <input type="color" id="hero-cta1-text-picker" value="${heroCta1TextColor}" class="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                        <input type="text" id="hero-cta1-text-hex" value="${heroCta1TextColor}" class="w-full px-2 py-1 rounded border border-slate-300 font-mono text-[11px] uppercase" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 mb-0.5">Warna Ikon:</label>
                      <div class="flex items-center gap-1.5">
                        <input type="color" id="hero-cta1-icon-picker" value="${heroCta1IconColor}" class="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                        <input type="text" id="hero-cta1-icon-hex" value="${heroCta1IconColor}" class="w-full px-2 py-1 rounded border border-slate-300 font-mono text-[11px] uppercase" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- DETAIL TOMBOL 2: KONSULTASI WHATSAPP -->
                <div class="p-3 bg-white rounded-xl border border-emerald-100 space-y-2">
                  <span class="font-bold text-slate-800 block text-xs">CTA 2: Tombol Konsultasi WhatsApp</span>
                  <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div class="sm:col-span-1">
                      <label class="block text-[10px] font-bold text-slate-500 mb-0.5">Teks Tombol:</label>
                      <input type="text" id="hero-cta2-text-input" value="${escapeHtml(heroCta2Text)}" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold text-xs" />
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 mb-0.5">Latar Tombol:</label>
                      <div class="flex items-center gap-1.5">
                        <input type="color" id="hero-cta2-bg-picker" value="${heroCta2Bg}" class="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                        <input type="text" id="hero-cta2-bg-hex" value="${heroCta2Bg}" class="w-full px-2 py-1 rounded border border-slate-300 font-mono text-[11px] uppercase" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 mb-0.5">Warna Teks:</label>
                      <div class="flex items-center gap-1.5">
                        <input type="color" id="hero-cta2-text-picker" value="${heroCta2TextColor}" class="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                        <input type="text" id="hero-cta2-text-hex" value="${heroCta2TextColor}" class="w-full px-2 py-1 rounded border border-slate-300 font-mono text-[11px] uppercase" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 mb-0.5">Warna Ikon:</label>
                      <div class="flex items-center gap-1.5">
                        <input type="color" id="hero-cta2-icon-picker" value="${heroCta2IconColor}" class="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                        <input type="text" id="hero-cta2-icon-hex" value="${heroCta2IconColor}" class="w-full px-2 py-1 rounded border border-slate-300 font-mono text-[11px] uppercase" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <!-- FORM KONDISIONAL SLIDER MULTI-GAMBAR (Aktif untuk Model 2, 3, dan 4) -->
            <div id="hero-banner-controls-section" class="space-y-4 pt-4 border-t border-slate-100 text-xs ${heroModel === 'model_1' ? 'hidden' : ''}">
              <div class="flex items-center gap-2 text-slate-700 font-bold">
                <i data-lucide="images" class="w-4 h-4 text-emerald-600"></i>
                <span>Pengaturan Slider Multi-Gambar Banner (Hingga 5 Gambar)</span>
              </div>

              <!-- DROPDOWN ANIMASI SLIDER (Hanya tampil jika gambar > 1) -->
              <div id="hero-animation-dropdown-container" class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 transition">
                <label class="block font-bold text-slate-800">Pilihan Animasi / Transisi Slider:</label>
                <select id="hero-slider-animation-select" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold outline-none focus:border-emerald-500 bg-white">
                  <option value="slide_5s" ${heroAnimation === 'slide_5s' ? 'selected' : ''}>Slide Otomatis 5s (Transisi Geser Halus) - [Default]</option>
                  <option value="slide_3s" ${heroAnimation === 'slide_3s' ? 'selected' : ''}>Slide Otomatis 3s (Transisi Geser Cepat)</option>
                  <option value="fade_5s" ${heroAnimation === 'fade_5s' ? 'selected' : ''}>Fade Otomatis 5s (Transisi Memudar Halus)</option>
                  <option value="fade_3s" ${heroAnimation === 'fade_3s' ? 'selected' : ''}>Fade Otomatis 3s (Transisi Memudar Cepat)</option>
                  <option value="manual" ${heroAnimation === 'manual' ? 'selected' : ''}>Manual Panah & Dots (Navigasi Tombol Saja)</option>


                <!-- TOGGLE TOMBOL PANAH NAVIGASI (< dan >) -->
                <div class="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <div class="space-y-0.5">
                    <span class="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      <i data-lucide="chevron-left-right" class="w-3.5 h-3.5 text-emerald-600"></i>
                      <span>Tampilkan Tombol Panah Navigasi (&lt; dan &gt;)</span>
                    </span>
                    <p class="text-[10px] text-slate-500">Tombol panah navigasi manual dapat dipilih untuk ditampilkan atau disembunyikan saat total banner > 1.</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" id="hero-show-arrows-toggle" ${heroShowArrows ? 'checked' : ''} class="sr-only peer" />
                    <div class="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <p class="text-[10px] text-slate-400">Otomatis aktif karena terdeteksi lebih dari 1 gambar banner.</p>
              </div>

              <div class="space-y-3">
                <div class="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
                  <i data-lucide="info" class="w-4 h-4 text-amber-700 shrink-0 mt-0.5"></i>
                  <div>
                    <span class="font-bold">Panduan Berkas Banner:</span>
                    Rekomendasi rasio 21:9 atau 3:1 (Resolusi ideal 1200x400 hingga 1600x500 px, format PNG/JPG/WebP, <strong>maksimal 500 KB per berkas</strong>).
                  </div>
                </div>

                <!-- DROPZONE UPLOADER MULTI-GAMBAR SESUAI GAMBAR 2 -->
                <div id="hero-banner-dropzone" class="border-2 border-dashed border-slate-300 rounded-3xl p-6 sm:p-7 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/20 transition group bg-white shadow-2xs">
                  <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition">
                    <i data-lucide="cloud-upload" class="w-6 h-6"></i>
                  </div>
                  <h4 class="font-bold text-slate-800 text-xs sm:text-sm mb-1">Pilih Berkas Gambar atau Tarik & Lepas Gambar ke Sini</h4>
                  <p class="text-[11px] text-slate-500">Format didukung: JPG, PNG, WEBP (Maksimal 500 KB per berkas)</p>
                  <input type="file" id="hero-banner-dropzone-file-input" accept="image/jpeg,image/png,image/webp" multiple class="hidden" />
                </div>

                <!-- Input Tempel URL Gambar Tambahan -->
                <div class="flex items-center gap-2">
                  <div class="relative flex-1">
                    <i data-lucide="link" class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
                    <input type="text" id="hero-banner-url-paste-input" placeholder="Atau tempel link URL gambar langsung (https://...)" class="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 font-mono text-[11px] outline-none focus:border-emerald-500 bg-white" />
                  </div>
                  <button type="button" id="btn-add-hero-banner-url" class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer">
                    <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                    <span>Tambah URL</span>
                  </button>
                </div>

                <!-- Preview Thumbnails List (Hingga 5 Gambar) -->
                <div class="space-y-1.5 pt-1">
                  <div class="flex items-center justify-between text-slate-700 font-bold text-xs">
                    <span class="flex items-center gap-1.5">
                      <i data-lucide="images" class="w-3.5 h-3.5 text-emerald-600"></i>
                      <span>Daftar Gambar Banner (<span id="hero-banner-count-badge">0</span> / 5):</span>
                    </span>
                    <span class="text-[10px] text-slate-400 font-normal">Foto pertama otomatis menjadi foto utama</span>
                  </div>
                  <div id="hero-banner-thumb-grid" class="flex items-center gap-2.5 overflow-x-auto py-2 px-1 scrollbar-none min-h-[90px] bg-slate-50/60 rounded-2xl border border-slate-200/80">
                    <!-- Populated by initHeroBannerUploader -->
                  </div>
                </div>
              </div>
            </div>

            <!-- Switch Sapaan Personal Pelanggan -->
            <div class="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-4">
              <div class="space-y-0.5">
                <span class="font-bold flex items-center gap-1.5 text-emerald-950">
                  <i data-lucide="user-check" class="w-4 h-4 text-emerald-700"></i>
                  Fitur Sapaan Personal Pelanggan (Personalized Greeting):
                </span>
                <p class="text-[11px] text-emerald-800">
                  Tampilkan sapaan ramah di bagian atas web saat pelanggan lama/langganan membuka kembali toko.
                </p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer shrink-0">
                <input type="checkbox" id="ctrl-toggle-greeting" ${settings.enable_customer_greeting !== false ? 'checked' : ''} class="sr-only peer" />
                <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

          </div>

        </form>
      </div>
    `;

    // --------------------------------------------------------------------------
    // DYNAMIC CONDITIONAL VISIBILITY & LIVE PREVIEW ENGINE
    // --------------------------------------------------------------------------
    let currentHeroBanners = (settings.hero_banners && settings.hero_banners.length > 0)
      ? [...settings.hero_banners].slice(0, 5)
      : (settings.hero_banner_image ? [settings.hero_banner_image] : ['assets/images/banner1.jpg']);

    function getActiveBannersList() {
      if (!Array.isArray(currentHeroBanners)) return [];
      return currentHeroBanners.filter(Boolean);
    }

    function renderHeroBannerThumbs() {
      const grid = document.getElementById('hero-banner-thumb-grid');
      const countBadge = document.getElementById('hero-banner-count-badge');
      if (countBadge) countBadge.textContent = currentHeroBanners.length;
      if (!grid) return;

      if (currentHeroBanners.length === 0) {
        grid.innerHTML = `<span class="text-[11px] text-slate-400 italic py-3 px-3">Belum ada gambar banner. Silakan pilih berkas atau tempel URL.</span>`;
        return;
      }

      grid.innerHTML = currentHeroBanners.map((url, idx) => `
        <div class="relative w-24 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs group shrink-0">
          <img src="${escapeHtml(url)}" class="w-full h-full object-cover" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-xs\\'><i class=\\'bi bi-image\\'></i></div>';" />
          <span class="absolute bottom-1 left-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.2 rounded pointer-events-none">
            #${idx + 1}
          </span>
          ${idx === 0 ? `
            <span class="absolute top-1 left-1 bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded shadow-xs pointer-events-none z-10">
              Utama
            </span>
          ` : ''}
          <button type="button" class="btn-remove-hero-thumb absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md transition z-20 cursor-pointer" data-idx="${idx}" title="Hapus Banner">
            <i data-lucide="x" class="w-3 h-3"></i>
          </button>
        </div>
      `).join('');

      if (window.lucide) window.lucide.createIcons();

      grid.querySelectorAll('.btn-remove-hero-thumb').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const removeIdx = parseInt(btn.getAttribute('data-idx'), 10);
          currentHeroBanners.splice(removeIdx, 1);
          renderHeroBannerThumbs();
          syncHeroFormVisibility();
          updateStorefrontLivePreview();
        });
      });
    }

    function initHeroBannerUploader() {
      const dropzone = document.getElementById('hero-banner-dropzone');
      const fileInput = document.getElementById('hero-banner-dropzone-file-input');
      const urlInput = document.getElementById('hero-banner-url-paste-input');
      const btnAddUrl = document.getElementById('btn-add-hero-banner-url');

      if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => {
          if (currentHeroBanners.length >= 5) {
            App.showToast('Maksimal 5 gambar banner tercapai. Hapus salah satu gambar untuk menambahkan gambar baru.', 'error');
            return;
          }
          fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
          const files = Array.from(e.target.files || []);
          if (files.length === 0) return;

          for (const file of files) {
            if (currentHeroBanners.length >= 5) {
              App.showToast('Maksimal 5 gambar banner tercapai.', 'warning');
              break;
            }
            if (file.size > 500 * 1024) {
              App.showToast(`Ukuran berkas "${file.name}" (${(file.size / 1024).toFixed(0)} KB) melebihi batas maksimal 500 KB!`, 'error');
              continue;
            }
            const reader = new FileReader();
            reader.onload = (evt) => {
              if (currentHeroBanners.length < 5) {
                currentHeroBanners.push(evt.target.result);
                renderHeroBannerThumbs();
                syncHeroFormVisibility();
                updateStorefrontLivePreview();
              }
            };
            reader.readAsDataURL(file);
          }
          fileInput.value = '';
        });

        // Drag & drop
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
          const files = Array.from(dt.files || []);
          if (files.length === 0) return;

          for (const file of files) {
            if (currentHeroBanners.length >= 5) {
              App.showToast('Maksimal 5 gambar banner tercapai.', 'warning');
              break;
            }
            if (file.size > 500 * 1024) {
              App.showToast(`Ukuran berkas "${file.name}" (${(file.size / 1024).toFixed(0)} KB) melebihi 500 KB!`, 'error');
              continue;
            }
            const reader = new FileReader();
            reader.onload = (evt) => {
              if (currentHeroBanners.length < 5) {
                currentHeroBanners.push(evt.target.result);
                renderHeroBannerThumbs();
                syncHeroFormVisibility();
                updateStorefrontLivePreview();
              }
            };
            reader.readAsDataURL(file);
          }
        });
      }

      if (btnAddUrl && urlInput) {
        btnAddUrl.addEventListener('click', () => {
          const u = urlInput.value.trim();
          if (!u) {
            App.showToast('Silakan masukkan link URL gambar.', 'error');
            return;
          }
          if (currentHeroBanners.length >= 5) {
            App.showToast('Maksimal 5 gambar banner tercapai.', 'error');
            return;
          }
          currentHeroBanners.push(u);
          urlInput.value = '';
          renderHeroBannerThumbs();
          syncHeroFormVisibility();
          updateStorefrontLivePreview();
          App.showToast('URL gambar banner berhasil ditambahkan!', 'success');
        });

        urlInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            btnAddUrl.click();
          }
        });
      }

      renderHeroBannerThumbs();
    }

    let currentPreviewWidth = 1200;

    function setHeroPreviewWidth(widthPx) {
      currentPreviewWidth = Math.min(1200, Math.max(360, Math.round(widthPx)));
      const wrapper = document.getElementById('hero-preview-resizable-wrapper');
      const slider = document.getElementById('hero-preview-width-slider');
      const display = document.getElementById('hero-preview-width-display');
      const btnDesk = document.getElementById('btn-hero-preset-desktop');
      const btnTab = document.getElementById('btn-hero-preset-tablet');
      const btnMob = document.getElementById('btn-hero-preset-mobile');

      if (wrapper) wrapper.style.width = currentPreviewWidth + 'px';
      if (slider) slider.value = currentPreviewWidth;
      if (display) display.textContent = currentPreviewWidth + 'px';

      // Update styling active pada 3 tombol preset
      const activeBtnClass = 'hero-preset-btn px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 bg-emerald-600 text-white shadow-xs cursor-pointer';
      const inactiveBtnClass = 'hero-preset-btn px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer';

      if (btnDesk) btnDesk.className = (currentPreviewWidth >= 1100) ? activeBtnClass : inactiveBtnClass;
      if (btnTab) btnTab.className = (currentPreviewWidth >= 700 && currentPreviewWidth < 900) ? activeBtnClass : inactiveBtnClass;
      if (btnMob) btnMob.className = (currentPreviewWidth <= 450) ? activeBtnClass : inactiveBtnClass;
    }

    function initHeroPreviewDragHandle() {
      const handle = document.getElementById('hero-preview-drag-handle');
      const wrapper = document.getElementById('hero-preview-resizable-wrapper');
      if (!handle || !wrapper) return;

      let isDragging = false;
      let startX = 0;
      let startWidth = 1200;

      const onPointerDown = (e) => {
        isDragging = true;
        startX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        startWidth = wrapper.offsetWidth;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'ew-resize';
      };

      const onPointerMove = (e) => {
        if (!isDragging) return;
        const currentX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const diffX = (currentX - startX) * 2;
        const newWidth = Math.min(1200, Math.max(360, startWidth + diffX));
        setHeroPreviewWidth(newWidth);
      };

      const onPointerUp = () => {
        if (isDragging) {
          isDragging = false;
          document.body.style.userSelect = '';
          document.body.style.cursor = '';
        }
      };

      handle.addEventListener('mousedown', onPointerDown);
      handle.addEventListener('touchstart', onPointerDown, { passive: true });
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('touchmove', onPointerMove, { passive: true });
      window.addEventListener('mouseup', onPointerUp);
      window.addEventListener('touchend', onPointerUp);
    }

    function syncHeroFormVisibility() {
      const selectedModel = document.querySelector('input[name="hero_model_radio"]:checked')?.value || 'model_2';
      
      // Update radio cards active styles
      document.querySelectorAll('.hero-model-card').forEach(card => {
        const m = card.getAttribute('data-model');
        if (m === selectedModel) {
          card.className = 'hero-model-card p-4 rounded-2xl border border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 cursor-pointer transition space-y-2 block';
        } else {
          card.className = 'hero-model-card p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition space-y-2 block';
        }
      });

      const widthSection = document.getElementById('hero-layout-width-section');
      const unselectedMsg = document.getElementById('hero-layout-unselected-msg');
      const selectedWidth = document.querySelector('input[name="hero_width_layout_radio"]:checked')?.value;

      // Update styling highlight pada radio card layout width
      document.querySelectorAll('.hero-width-choice-card').forEach(card => {
        const w = card.getAttribute('data-width');
        if (w === selectedWidth) {
          card.className = 'hero-width-choice-card p-3.5 rounded-xl border border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 cursor-pointer transition flex flex-col gap-1.5';
        } else {
          card.className = 'hero-width-choice-card p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition flex flex-col gap-1.5';
        }
      });

      const textControls = document.getElementById('hero-text-controls-section');
      const bannerControls = document.getElementById('hero-banner-controls-section');
      const animContainer = document.getElementById('hero-animation-dropdown-container');

      const isModelWithLayoutOption = (selectedModel === 'model_2' || selectedModel === 'model_3');

      // GATING ALUR FORM:
      // Hanya model 2 dan 3 yang membutuhkan penentuan varian layout terlebih dahulu
      if (isModelWithLayoutOption) {
        if (widthSection) widthSection.classList.remove('hidden');
        if (!selectedWidth) {
          // Layout belum dipilih -> Sembunyikan formulir lanjutan
          if (unselectedMsg) unselectedMsg.classList.remove('hidden');
          if (textControls) textControls.classList.add('hidden');
          if (bannerControls) bannerControls.classList.add('hidden');
          updateStorefrontLivePreview();
          return;
        } else {
          if (unselectedMsg) unselectedMsg.classList.add('hidden');
        }
      } else {
        // Model 1 ("Teks Saja") & Model 4 ("Split"): Kecualikan dari opsi layout
        if (widthSection) widthSection.classList.add('hidden');
        if (unselectedMsg) unselectedMsg.classList.add('hidden');
      }

      // Rule: Model 2 menyembunyikan kontrol teks; Model 1, 3, 4 menampilkan kontrol teks
      if (textControls) {
        if (selectedModel === 'model_2') {
          textControls.classList.add('hidden');
        } else {
          textControls.classList.remove('hidden');
        }
      }

      // Rule: Model 1 menyembunyikan kontrol banner; Model 2, 3, 4 menampilkan kontrol banner
      if (bannerControls) {
        if (selectedModel === 'model_1') {
          bannerControls.classList.add('hidden');
        } else {
          bannerControls.classList.remove('hidden');
        }
      }

      // Rule untuk Dropdown Animasi Slider:
      // Tampilkan HANYA jika total banner > 1 dan bukan Model 1 (Teks Saja)
      const activeBanners = (typeof getActiveBannersList === 'function' ? getActiveBannersList() : []) || [];
      if (animContainer) {
        if (selectedModel !== 'model_1' && activeBanners.length > 1) {
          animContainer.classList.remove('hidden');
        } else {
          animContainer.classList.add('hidden');
        }
      }

      updateStorefrontLivePreview();
    }

    function updateStorefrontLivePreview() {
      const iframe = document.getElementById('hero-preview-iframe');
      if (!iframe) return;

      const bodyBg = document.getElementById('ctrl-hex-body-bg')?.value || '#f8fafc';
      const primColor = document.getElementById('ctrl-hex-primary')?.value || '#33b589';
      const navbarBg = document.getElementById('ctrl-hex-navbar-bg')?.value || '#ffffff';
      const navbarText = document.getElementById('ctrl-hex-navbar-text')?.value || '#0f172a';
      const webLogo = document.getElementById('store-logo-url-input')?.value || settings.web_logo || 'assets/images/logo-songer-creative.png';
      const storeTagline = document.getElementById('store-tagline-input')?.value || settings.store_tagline || 'Digital Printing & Percetakan Terpadu';

      const storeName = document.getElementById('store-name-input')?.value || 'Songer Creative';
      const selectedModel = document.querySelector('input[name="hero_model_radio"]:checked')?.value || 'model_2';
      const selectedWidth = document.querySelector('input[name="hero_width_layout_radio"]:checked')?.value || 'boxed';
      const isFullWidth = (selectedModel === 'model_2' || selectedModel === 'model_3') && (selectedWidth === 'full');

      const headline = document.getElementById('hero-headline-input')?.value || 'Cetak Banner, Desain & Souvenir Harga Instan';
      const subheadline = document.getElementById('hero-subheadline-input')?.value || 'Katalog terpadu dengan kalkulator instan: spesifikasi kustom meteran, jasa desain original, hingga souvenir retail siap kirim ke seluruh Indonesia.';
      
      const titleColor = document.getElementById('hero-title-color-hex')?.value || '#ffffff';
      const subtitleColor = document.getElementById('hero-subtitle-color-hex')?.value || '#cbd5e1';
      const bgType = document.getElementById('hero-bg-type-select')?.value || 'linear_gradient';
      const bgColor1 = document.getElementById('hero-bg-color1-hex')?.value || '#0f172a';
      const bgColor2 = document.getElementById('hero-bg-color2-hex')?.value || '#064e3b';
      const bgAngle = parseInt(document.getElementById('hero-bg-angle-input')?.value || '135', 10);
      const showTimer = document.getElementById('hero-show-timer-toggle')?.checked !== false;

      // Handle extra column for gradient
      const gradCol = document.getElementById('hero-gradient-extra-col');
      if (gradCol) {
        if (bgType === 'solid') gradCol.classList.add('hidden');
        else gradCol.classList.remove('hidden');
      }

      const ctaMode = document.querySelector('input[name="hero_cta_mode_radio"]:checked')?.value || 'dual';
      const useTheme = document.getElementById('hero-cta-use-theme-toggle')?.checked === true;
      
      const cta1Text = document.getElementById('hero-cta1-text-input')?.value || 'Lihat Semua Katalog';
      const cta1Bg = useTheme ? primColor : (document.getElementById('hero-cta1-bg-hex')?.value || primColor);
      const cta1TextCol = useTheme ? '#ffffff' : (document.getElementById('hero-cta1-text-hex')?.value || '#ffffff');
      const cta1IconCol = useTheme ? '#ffffff' : (document.getElementById('hero-cta1-icon-hex')?.value || '#ffffff');

      const cta2Text = document.getElementById('hero-cta2-text-input')?.value || 'Konsultasi Desain & Cetak';
      const cta2Bg = useTheme ? '#25d366' : (document.getElementById('hero-cta2-bg-hex')?.value || '#25d366');
      const cta2TextCol = useTheme ? '#ffffff' : (document.getElementById('hero-cta2-text-hex')?.value || '#ffffff');
      const cta2IconCol = useTheme ? '#ffffff' : (document.getElementById('hero-cta2-icon-hex')?.value || '#ffffff');

      const banners = getActiveBannersList();
      const firstBanner = banners[0] || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80';
      const animType = document.getElementById('hero-slider-animation-select')?.value || 'slide_3s';
      const showArrows = (document.getElementById('hero-show-arrows-toggle')?.checked !== false) && (banners.length > 1);

      // Generate background CSS style
      let heroBgCss = '';
      if (bgType === 'solid') {
        heroBgCss = `background-color: ${bgColor1};`;
      } else if (bgType === 'radial_gradient') {
        heroBgCss = `background: radial-gradient(circle at center, ${bgColor1} 0%, ${bgColor2} 100%);`;
      } else {
        heroBgCss = `background: linear-gradient(${bgAngle}deg, ${bgColor1} 0%, ${bgColor2} 100%);`;
      }

      // Responsive CTA buttons preview (1 CTA & 2 CTA: full width & stacked on mobile, row on tablet/desktop)
      let dualCtaHtml = '';
      if (ctaMode === 'dual' || ctaMode === 'catalog_only') {
        dualCtaHtml += `
          <a href="#katalog-section" class="w-full sm:w-auto justify-center px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-2xl text-xs font-bold shadow-lg inline-flex items-center gap-2 hover:brightness-105 transition text-center whitespace-normal" style="background-color: ${cta1Bg}; color: ${cta1TextCol};">
            <span>${escapeHtml(cta1Text)}</span>
            <i data-lucide="arrow-down" class="w-3.5 h-3.5 shrink-0" style="color: ${cta1IconCol};"></i>
          </a>
        `;
      }
      if (ctaMode === 'dual' || ctaMode === 'consultation_only') {
        dualCtaHtml += `
          <a href="#" class="w-full sm:w-auto justify-center px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-2xl text-xs font-bold shadow-lg inline-flex items-center gap-2 hover:brightness-105 transition text-center whitespace-normal" style="background-color: ${cta2Bg}; color: ${cta2TextCol};">
            <i class="bi bi-whatsapp text-sm shrink-0" style="color: ${cta2IconCol};"></i>
            <span>${escapeHtml(cta2Text)}</span>
          </a>
        `;
      }

      let timerHtml = '';
      if (showTimer) {
        timerHtml = `
          <div class="flex items-center justify-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl border border-white/10 text-[11px] sm:text-xs text-white w-full sm:w-auto">
            <i data-lucide="clock" class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0"></i>
            <span class="font-medium text-slate-200">Promo Berakhir:</span>
            <span class="font-mono font-bold text-emerald-400">23j : 59m : 59d</span>
          </div>
        `;
      }

      // Sapaan Hero Kustomisasi
      const greetingEnabled = document.getElementById('hero-greeting-preview-toggle')?.checked ?? (settings.hero_greeting_enabled !== false);
      const greetingText = document.getElementById('hero-greeting-text-input')?.value.trim() || settings.hero_greeting_text || `${storeName} Official`;
      const greetingTextCol = document.getElementById('hero-greeting-text-color-hex')?.value || settings.hero_greeting_text_color || '#ffffff';
      const greetingBgCol = document.getElementById('hero-greeting-bg-color-hex')?.value || settings.hero_greeting_bg_color || 'rgba(255, 255, 255, 0.15)';
      const greetingBorderCol = document.getElementById('hero-greeting-border-color-hex')?.value || settings.hero_greeting_border_color || 'rgba(255, 255, 255, 0.20)';
      const greetingRadius = document.getElementById('hero-greeting-radius-select')?.value || settings.hero_greeting_radius || '9999px';

      const customGreetingBadge = greetingEnabled ? `
        <div class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold shadow-xs select-none" style="background-color: ${greetingBgCol}; color: ${greetingTextCol}; border: 1px solid ${greetingBorderCol}; border-radius: ${greetingRadius};">
          <span>${escapeHtml(greetingText)}</span>
        </div>
      ` : '';

      // Helper untuk Slides HTML
      const slidesHtml = banners.map((b, i) => `
        <div class="hero-slide-smooth ${i === 0 ? 'is-active' : 'is-hidden'}" data-index="${i}">
          <img src="${b}" alt="Hero Banner ${i + 1}" class="w-full h-full object-cover ${isFullWidth ? 'rounded-none' : 'rounded-3xl'}" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-3xl\\'><i class=\\'bi bi-images\\'></i></div>';" />
        </div>
      `).join('');

      // Helper untuk Controls HTML (Arrows, Dots) - Tanpa Icon Swipe Manual floating badge
      let controlsHtml = '';
      if (banners.length > 1) {
        controlsHtml = `
          <div class="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 pointer-events-auto">
            ${banners.map((_, i) => `<button type="button" class="w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-emerald-500 scale-125' : 'bg-white/60 hover:bg-white'} transition-all hero-slide-dot" data-index="${i}"></button>`).join('')}
          </div>
          ${showArrows ? `
            <button type="button" class="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/45 hover:bg-black/75 text-white flex items-center justify-center z-30 transition pointer-events-auto backdrop-blur-sm active:scale-90" id="hero-slide-prev" title="Slide Sebelumnya (&lt;)"><i data-lucide="chevron-left" class="w-4 h-4 sm:w-5 sm:h-5"></i></button>
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/45 hover:bg-black/75 text-white flex items-center justify-center z-30 transition pointer-events-auto backdrop-blur-sm active:scale-90" id="hero-slide-next" title="Slide Berikutnya (&gt;)"><i data-lucide="chevron-right" class="w-4 h-4 sm:w-5 sm:h-5"></i></button>
          ` : ''}
        `;
      }

      let heroBannerHtml = '';
      if (selectedModel === 'model_1') {
        // [1] Model Teks Headline Saja + CTA (Tanpa Gambar Banner)
        heroBannerHtml = `
          <div class="relative overflow-hidden rounded-3xl p-5 sm:p-12 shadow-2xl border border-white/10" style="${heroBgCss}" id="hero-slider-container">
            <div class="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
            <div class="relative z-10 max-w-2xl space-y-3.5 sm:space-y-4">
              ${customGreetingBadge}
              <h1 class="text-xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-snug sm:leading-tight" style="color: ${titleColor};">
                ${escapeHtml(headline)}
              </h1>
              <p class="text-xs sm:text-sm leading-relaxed" style="color: ${subtitleColor};">
                ${escapeHtml(subheadline)}
              </p>
              <div class="pt-2 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full">
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                  ${dualCtaHtml}
                </div>
                ${timerHtml}
                <div class="flex items-center gap-1.5 text-xs text-white/80 pt-1 sm:pt-0">
                  <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400 shrink-0"></i>
                  <span>Kualitas CMYK Tajam & Garansi Cetak</span>
                </div>
              </div>
            </div>
          </div>
        `;
      } else if (selectedModel === 'model_2') {
        // [2] Model Hanya Gambar (Full-Width atau Boxed Container)
        heroBannerHtml = `
          <div class="space-y-3">
            ${greetingEnabled ? `
              <div class="flex items-center px-1">
                <div class="inline-flex items-center gap-1.5 px-3.5 py-1.5 font-bold text-xs shadow-xs select-none bg-white/95 backdrop-blur-md text-slate-800 border border-slate-200/80 rounded-full">
                  <span>${escapeHtml(greetingText)}</span>
                </div>
              </div>
            ` : ''}
            <div class="relative overflow-hidden ${isFullWidth ? 'rounded-none border-x-0' : 'rounded-3xl border border-slate-200/80'} shadow-xl group ${animType.startsWith('fade') ? 'hero-anim-fade' : ''}" id="hero-slider-container" data-anim="${animType}" data-count="${banners.length}">
              <div class="aspect-[21/9] sm:aspect-[24/9] md:aspect-[3/1] w-full relative bg-slate-900 overflow-hidden ${isFullWidth ? 'rounded-none' : 'rounded-3xl'}">
                <div class="hero-slider-track w-full h-full relative">
                  ${slidesHtml}
                </div>
                ${controlsHtml}
              </div>
            </div>
          </div>
        `;
      } else if (selectedModel === 'model_3') {
        // [3] Model Gambar & Teks Overlay (Full-Width atau Boxed Container)
        // Gunakan min-h-[380px] pada mobile agar teks dan tombol CTA 1 & 2 bernapas lega dan tidak terpotong
        heroBannerHtml = `
          <div class="relative overflow-hidden ${isFullWidth ? 'rounded-none border-x-0' : 'rounded-3xl border border-white/10'} shadow-2xl group ${animType.startsWith('fade') ? 'hero-anim-fade' : ''}" id="hero-slider-container" data-anim="${animType}" data-count="${banners.length}">
            <div class="min-h-[380px] sm:min-h-0 sm:aspect-[21/9] md:aspect-[24/9] w-full relative bg-slate-950 overflow-hidden ${isFullWidth ? 'rounded-none' : 'rounded-3xl'} flex items-center">
              <div class="hero-slider-track absolute inset-0 w-full h-full">
                ${slidesHtml}
              </div>
              <div class="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/40 z-10 pointer-events-none"></div>
              
              <div class="relative z-20 p-5 sm:p-10 md:p-12 max-w-2xl space-y-3 sm:space-y-3.5 text-white w-full">
                ${customGreetingBadge}
                <h1 class="text-lg sm:text-3xl md:text-4xl font-black tracking-tight leading-snug sm:leading-tight" style="color: ${titleColor};">
                  ${escapeHtml(headline)}
                </h1>
                <p class="text-xs sm:text-sm leading-relaxed max-w-xl line-clamp-2 sm:line-clamp-3" style="color: ${subtitleColor};">
                  ${escapeHtml(subheadline)}
                </p>
                <div class="pt-2 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full">
                  <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                    ${dualCtaHtml}
                  </div>
                  ${timerHtml}
                </div>
              </div>
              ${controlsHtml}
            </div>
          </div>
        `;
      } else {
        // [4] Model Split 2 Kolom Berdampingan
        heroBannerHtml = `
          <div class="relative overflow-hidden rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xl border border-white/10 ${animType.startsWith('fade') ? 'hero-anim-fade' : ''}" style="${heroBgCss}" id="hero-slider-container" data-anim="${animType}" data-count="${banners.length}">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              <div class="lg:col-span-7 space-y-3.5 sm:space-y-4">
                ${customGreetingBadge}
                <h1 class="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-snug sm:leading-tight" style="color: ${titleColor};">
                  ${escapeHtml(headline)}
                </h1>
                <p class="text-xs sm:text-sm leading-relaxed max-w-xl" style="color: ${subtitleColor};">
                  ${escapeHtml(subheadline)}
                </p>
                <div class="pt-2 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full">
                  <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                    ${dualCtaHtml}
                  </div>
                  ${timerHtml}
                </div>
              </div>
              <div class="lg:col-span-5 relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3] rounded-2xl overflow-hidden shadow-md border border-white/15 bg-slate-900">
                <div class="hero-slider-track w-full h-full relative">
                  ${slidesHtml}
                </div>
                ${controlsHtml}
              </div>
            </div>
          </div>
        `;
      }

      // Script interaktif hero slider di dalam iframe isolasi (Termasuk Fade In/Out mulus, panah navigasi & touch swipe)
      const iframeScript = `
        (function() {
          if (window.lucide) window.lucide.createIcons();

          const sliderContainer = document.getElementById('hero-slider-container');
          if (!sliderContainer) return;

          const count = parseInt(sliderContainer.getAttribute('data-count') || '1', 10);
          if (count <= 1) return;

          const animType = sliderContainer.getAttribute('data-anim') || 'slide_3s';
          const isFade = animType.startsWith('fade');
          const slides = Array.from(sliderContainer.querySelectorAll('.hero-slide-smooth'));
          const dots = Array.from(sliderContainer.querySelectorAll('.hero-slide-dot'));
          if (slides.length <= 1) return;

          let currentIndex = 0;
          let isTransitioning = false;
          let slideInterval = null;

          function goToSlide(targetIndex, direction = 1) {
            if (isTransitioning) return;
            const normalizedTarget = (targetIndex + count) % count;
            if (normalizedTarget === currentIndex) return;

            isTransitioning = true;
            const outgoingSlide = slides[currentIndex];
            const incomingSlide = slides[normalizedTarget];

            if (isFade) {
              if (direction < 0) {
                // Klik < (Mundur): Slide aktif memudar di atas, memunculkan kembali slide sebelumnya secara mulus
                incomingSlide.classList.remove('is-hidden', 'is-fading-out', 'is-fading-out-top', 'is-prev', 'is-next');
                incomingSlide.classList.add('is-active');
                outgoingSlide.classList.remove('is-active');
                outgoingSlide.classList.add('is-fading-out-top');
              } else {
                // Klik > (Maju): Fade-in memunculkan slide berikutnya
                outgoingSlide.classList.remove('is-active');
                outgoingSlide.classList.add('is-fading-out');
                incomingSlide.classList.remove('is-hidden', 'is-fading-out', 'is-fading-out-top', 'is-prev', 'is-next');
                incomingSlide.classList.add('is-active');
              }
            } else {
              incomingSlide.classList.remove('is-active', 'is-prev', 'is-next');
              incomingSlide.classList.add(direction > 0 ? 'is-next' : 'is-prev');
              void incomingSlide.offsetWidth;

              outgoingSlide.classList.remove('is-active');
              outgoingSlide.classList.add(direction > 0 ? 'is-prev' : 'is-next');

              incomingSlide.classList.remove('is-prev', 'is-next', 'is-hidden');
              incomingSlide.classList.add('is-active');
            }

            dots.forEach((dot, idx) => {
              if (idx === normalizedTarget) {
                dot.classList.add('bg-emerald-500', 'scale-125');
                dot.classList.remove('bg-white/60');
              } else {
                dot.classList.remove('bg-emerald-500', 'scale-125');
                dot.classList.add('bg-white/60');
              }
            });

            currentIndex = normalizedTarget;

            setTimeout(() => {
              slides.forEach((s, idx) => {
                if (idx !== currentIndex) {
                  s.classList.remove('is-active', 'is-prev', 'is-next', 'is-fading-out', 'is-fading-out-top');
                  s.classList.add('is-hidden');
                }
              });
              isTransitioning = false;
            }, isFade ? 680 : 620);
          }

          dots.forEach((dot, idx) => {
            dot.addEventListener('click', (e) => {
              e.preventDefault();
              if (slideInterval) clearInterval(slideInterval);
              const dir = idx >= currentIndex ? 1 : -1;
              goToSlide(idx, dir);
              startTimer();
            });
          });

          const prevBtn = sliderContainer.querySelector('#hero-slide-prev');
          const nextBtn = sliderContainer.querySelector('#hero-slide-next');
          if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
              e.preventDefault();
              if (slideInterval) clearInterval(slideInterval);
              goToSlide(currentIndex - 1, -1);
              startTimer();
            });
          }
          if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
              e.preventDefault();
              if (slideInterval) clearInterval(slideInterval);
              goToSlide(currentIndex + 1, 1);
              startTimer();
            });
          }



          // Touch gesture swipe support
          let touchStartX = 0, touchStartY = 0;
          sliderContainer.addEventListener('touchstart', (e) => {
            if (e.changedTouches && e.changedTouches[0]) {
              touchStartX = e.changedTouches[0].clientX;
              touchStartY = e.changedTouches[0].clientY;
            }
          }, { passive: true });

          sliderContainer.addEventListener('touchend', (e) => {
            if (e.changedTouches && e.changedTouches[0]) {
              const diffX = e.changedTouches[0].clientX - touchStartX;
              const diffY = e.changedTouches[0].clientY - touchStartY;
              if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
                if (slideInterval) clearInterval(slideInterval);
                if (diffX < 0) goToSlide(currentIndex + 1, 1); // Geser kiri -> maju
                else goToSlide(currentIndex - 1, -1); // Geser kanan -> mundur
                startTimer();
              }
            }
          }, { passive: true });

          function startTimer() {
            if (animType !== 'manual') {
              const delay = (animType === 'slide_5s' || animType === 'fade_5s') ? 5000 : 3000;
              slideInterval = setInterval(() => {
                goToSlide(currentIndex + 1, 1);
              }, delay);
            }
          }

          startTimer();
        })();
      `;

      // Format Tampilan Branding Navbar Preview (Logo Persegi / Landscape / Hanya Teks)
      const brandingMode = document.querySelector('input[name="navbar_branding_mode_radio"]:checked')?.value || settings.navbar_branding_mode || 'logo_landscape';
      const storeNameColor = document.getElementById('ctrl-hex-navbar-store-name')?.value || settings.navbar_store_name_color || navbarText;
      const taglineColor = document.getElementById('ctrl-hex-navbar-tagline')?.value || settings.navbar_tagline_color || '#64748b';
      const showDesktopName = document.getElementById('ctrl-toggle-show-header-store-name')?.checked !== false;

      let previewBrandHtml = '';
      if (brandingMode === 'text_only') {
        previewBrandHtml = `
          <div class="flex flex-col justify-center shrink-0 min-w-0 max-w-[130px] sm:max-w-[220px]">
            <span class="font-bold sm:font-extrabold text-xs sm:text-sm tracking-tight truncate leading-tight block" style="color: ${storeNameColor};">
              ${escapeHtml(storeName)}
            </span>
            <span class="text-[9px] sm:text-[10px] block truncate font-medium leading-tight mt-0.5" style="color: ${taglineColor};">
              ${escapeHtml(storeTagline)}
            </span>
          </div>
        `;
      } else if (brandingMode === 'logo_square') {
        previewBrandHtml = `
          <div class="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <img src="${escapeHtml(webLogo)}" alt="Logo" class="h-8 w-8 sm:h-9 sm:w-9 max-w-[38px] max-h-[38px] aspect-square object-contain rounded-lg shrink-0" onerror="this.src='assets/images/logo-songer-creative.png'" />
            ${showDesktopName ? `
              <div class="border-l pl-2 sm:pl-3 hidden sm:flex flex-col justify-center min-w-0" style="border-color: rgba(148, 163, 184, 0.35);">
                <span class="font-extrabold text-xs sm:text-sm tracking-tight truncate max-w-[160px] leading-tight block" style="color: ${navbarText};">${escapeHtml(storeName)}</span>
                <span class="text-[9px] sm:text-[10px] text-slate-400 block truncate max-w-[160px] leading-tight mt-0.5">${escapeHtml(storeTagline)}</span>
              </div>
            ` : ''}
          </div>
        `;
      } else {
        previewBrandHtml = `
          <div class="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <img src="${escapeHtml(webLogo)}" alt="Logo" class="h-7 sm:h-8 w-auto max-w-[110px] sm:max-w-[160px] object-contain shrink-0" onerror="this.src='assets/images/logo-songer-creative.png'" />
            ${showDesktopName ? `
              <div class="border-l pl-2 sm:pl-3 hidden sm:flex flex-col justify-center min-w-0" style="border-color: rgba(148, 163, 184, 0.35);">
                <span class="font-extrabold text-xs sm:text-sm tracking-tight truncate max-w-[160px] leading-tight block" style="color: ${navbarText};">${escapeHtml(storeName)}</span>
                <span class="text-[9px] sm:text-[10px] text-slate-400 block truncate max-w-[160px] leading-tight mt-0.5">${escapeHtml(storeTagline)}</span>
              </div>
            ` : ''}
          </div>
        `;
      }

      // Rakit dokumen HTML lengkap untuk srcdoc iframe (Framing Presisi: Navbar + Hero Banner)
      const docHtml = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <script src="https://unpkg.com/lucide@latest"></script>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
          <link rel="stylesheet" href="css/style.css?v=3.3">
          <style>
            body {
              background-color: ${bodyBg};
              margin: 0;
              padding: 0;
              overflow-x: hidden;
              overflow-y: auto;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
          </style>
        </head>
        <body class="flex flex-col min-h-full">
          <!-- FRAMED MINI NAVBAR TOKO PREVIEW -->
          <header class="border-b shadow-xs transition-colors px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 select-none shrink-0" style="background-color: ${navbarBg}; color: ${navbarText}; border-color: rgba(148, 163, 184, 0.25);">
            <!-- Left: Identitas Toko (Logo Square / Landscape / Text Only) -->
            ${previewBrandHtml}

            <!-- Center: Dummy Search Bar -->
            <div class="flex-1 max-w-xs sm:max-w-sm mx-1 sm:mx-2">
              <div class="relative w-full">
                <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                <div class="w-full bg-slate-100/90 text-slate-400 text-[11px] pl-8 pr-3 py-1.5 rounded-xl border border-slate-200/80 truncate">Cari produk cetak...</div>
              </div>
            </div>

            <!-- Right: Dummy Keranjang & Akun -->
            <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div class="px-2.5 py-1.5 rounded-xl border border-slate-200/80 bg-white/90 text-slate-700 text-xs flex items-center gap-1.5 shadow-2xs font-semibold">
                <i data-lucide="shopping-cart" class="w-3.5 h-3.5 text-emerald-600"></i>
                <span class="text-[10px] font-bold px-1 rounded-full bg-emerald-100 text-emerald-800">0</span>
              </div>
            </div>
          </header>

          <!-- FRAMED HERO BANNER -->
          <div class="w-full ${isFullWidth ? '' : 'p-3 sm:p-5'}">
            ${heroBannerHtml}
          </div>

          <script>
            ${iframeScript}
          </script>
        </body>
        </html>
      `;

      iframe.srcdoc = docHtml;
    }

    // --------------------------------------------------------------------------
    // EVENT LISTENERS & TWO-WAY COLOR BINDING
    // --------------------------------------------------------------------------
    function bindColorPair(pickerId, hexId) {
      const picker = document.getElementById(pickerId);
      const hex = document.getElementById(hexId);
      if (!picker || !hex) return;

      picker.addEventListener('input', (e) => {
        hex.value = e.target.value.toUpperCase();
        updateStorefrontLivePreview();
      });

      hex.addEventListener('input', (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          picker.value = val;
          updateStorefrontLivePreview();
        }
      });
    }

    bindColorPair('ctrl-color-navbar-bg', 'ctrl-hex-navbar-bg');
    bindColorPair('ctrl-color-navbar-text', 'ctrl-hex-navbar-text');
    bindColorPair('ctrl-color-body-bg', 'ctrl-hex-body-bg');
    bindColorPair('ctrl-color-primary', 'ctrl-hex-primary');
    bindColorPair('ctrl-color-secondary', 'ctrl-hex-secondary');

    // Hero Typography & Background Color Pair Bindings
    bindColorPair('hero-title-color-picker', 'hero-title-color-hex');
    bindColorPair('hero-subtitle-color-picker', 'hero-subtitle-color-hex');
    bindColorPair('hero-bg-color1-picker', 'hero-bg-color1-hex');
    bindColorPair('hero-bg-color2-picker', 'hero-bg-color2-hex');

    // Dual CTA Color Pair Bindings
    bindColorPair('hero-cta1-bg-picker', 'hero-cta1-bg-hex');
    bindColorPair('hero-cta1-text-picker', 'hero-cta1-text-hex');
    bindColorPair('hero-cta1-icon-picker', 'hero-cta1-icon-hex');
    bindColorPair('hero-cta2-bg-picker', 'hero-cta2-bg-hex');
    bindColorPair('hero-cta2-text-picker', 'hero-cta2-text-hex');
    bindColorPair('hero-cta2-icon-picker', 'hero-cta2-icon-hex');

    // Sapaan Hero Color Pair Bindings
    bindColorPair('hero-greeting-text-color-picker', 'hero-greeting-text-color-hex');
    bindColorPair('hero-greeting-bg-color-picker', 'hero-greeting-bg-color-hex');
    bindColorPair('hero-greeting-border-color-picker', 'hero-greeting-border-color-hex');

    // Navbar Text-Only Color Pair Bindings
    bindColorPair('ctrl-color-navbar-store-name', 'ctrl-hex-navbar-store-name');
    bindColorPair('ctrl-color-navbar-tagline', 'ctrl-hex-navbar-tagline');

    // Live typing on text inputs
    ['store-name-input', 'store-tagline-input', 'store-logo-url-input', 'hero-headline-input', 'hero-subheadline-input', 'hero-bg-angle-input', 'hero-cta1-text-input', 'hero-cta2-text-input', 'hero-greeting-text-input', 'ctrl-hex-navbar-store-name', 'ctrl-hex-navbar-tagline'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', updateStorefrontLivePreview);
    });

    // Select & Checkbox Change Events
    ['hero-bg-type-select', 'hero-show-timer-toggle', 'hero-cta-use-theme-toggle', 'hero-greeting-radius-select', 'hero-greeting-preview-toggle', 'ctrl-toggle-show-header-store-name'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', updateStorefrontLivePreview);
    });

    document.querySelectorAll('input[name="hero_cta_mode_radio"]').forEach(r => {
      r.addEventListener('change', updateStorefrontLivePreview);
    });



    // Radio Hero Model Change
    document.querySelectorAll('input[name="hero_model_radio"]').forEach(r => {
      r.addEventListener('change', syncHeroFormVisibility);
    });

    // Hero Slider Animation Select Change
    const animSelect = document.getElementById('hero-slider-animation-select');
    if (animSelect) {
      animSelect.addEventListener('change', () => {
        syncHeroFormVisibility();
        updateStorefrontLivePreview();
      });
    }

    // File Uploads with 500 KB validation
    const handleFileUpload = (fileInput, targetUrlInput, previewImg, maxKb = 500) => {
      if (!fileInput) return;
      fileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > maxKb * 1024) {
          showToast(`Ukuran berkas (${(file.size / 1024).toFixed(0)} KB) melebihi batas maksimal ${maxKb} KB!`, 'error');
          fileInput.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = evt => {
          if (targetUrlInput) targetUrlInput.value = evt.target.result;
          if (previewImg) previewImg.src = evt.target.result;
          syncHeroFormVisibility();
        };
        reader.readAsDataURL(file);
      });
    };

    handleFileUpload(
      document.getElementById('store-logo-file-input'),
      document.getElementById('store-logo-url-input'),
      document.getElementById('preview-store-logo-img'),
      500
    );

    handleFileUpload(
      document.getElementById('store-favicon-file-input'),
      document.getElementById('store-favicon-url-input'),
      document.getElementById('preview-store-favicon-img'),
      500
    );

    initHeroBannerUploader();
    initHeroPreviewDragHandle();

    // Auto-Save & Live Sync Helper untuk Pengaturan Format Branding Navbar (3 Model: Persegi, Landscape, Hanya Teks)
    function autoSaveHeaderBrandingSettings(showToastNotify = true) {
      const brandingMode = document.querySelector('input[name="navbar_branding_mode_radio"]:checked')?.value || 'logo_landscape';
      const storeNameColor = document.getElementById('ctrl-hex-navbar-store-name')?.value.trim() || '#0f172a';
      const taglineColor = document.getElementById('ctrl-hex-navbar-tagline')?.value.trim() || '#64748b';
      const showHeaderStoreName = document.getElementById('ctrl-toggle-show-header-store-name')?.checked !== false;

      // Update styling highlight cards
      document.querySelectorAll('.navbar-branding-choice-card').forEach(card => {
        const mode = card.getAttribute('data-mode');
        if (mode === brandingMode) {
          card.className = 'navbar-branding-choice-card p-3.5 rounded-2xl border border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 cursor-pointer transition flex flex-col justify-between gap-2.5';
        } else {
          card.className = 'navbar-branding-choice-card p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition flex flex-col justify-between gap-2.5';
        }
      });

      // Tampilkan input warna hanya jika mode 'text_only'
      const colorsContainer = document.getElementById('navbar-text-only-colors-container');
      if (colorsContainer) {
        if (brandingMode === 'text_only') colorsContainer.classList.remove('hidden');
        else colorsContainer.classList.add('hidden');
      }

      // Sembunyikan toggle nama desktop jika 'text_only' (karena teks selalu tampil)
      const desktopToggleContainer = document.getElementById('navbar-logo-desktop-name-toggle-container');
      if (desktopToggleContainer) {
        if (brandingMode === 'text_only') desktopToggleContainer.classList.add('hidden');
        else desktopToggleContainer.classList.remove('hidden');
      }

      // Simpan langsung ke database/localStorage
      DB.updateSettings({
        navbar_branding_mode: brandingMode,
        navbar_store_name_color: storeNameColor,
        navbar_tagline_color: taglineColor,
        header_use_logo: brandingMode !== 'text_only',
        show_header_store_name: showHeaderStoreName
      });

      // Sinkronisasi live preview & admin top bar
      syncHeaderAndTheme();
      updateStorefrontLivePreview();

      if (showToastNotify) {
        showToast('Pengaturan format identitas navbar toko berhasil disimpan!', 'success');
      }
    }

    document.querySelectorAll('input[name="navbar_branding_mode_radio"]').forEach(r => {
      r.addEventListener('change', () => autoSaveHeaderBrandingSettings(false));
    });

    const toggleHeaderName = document.getElementById('ctrl-toggle-show-header-store-name');
    if (toggleHeaderName) {
      toggleHeaderName.addEventListener('change', () => autoSaveHeaderBrandingSettings(false));
    }

    // Hero Live Preview 3 Preset Buttons (Desktop, Tab, Mobile)
    const btnPresetDesk = document.getElementById('btn-hero-preset-desktop');
    if (btnPresetDesk) {
      btnPresetDesk.addEventListener('click', () => setHeroPreviewWidth(1200));
    }
    const btnPresetTab = document.getElementById('btn-hero-preset-tablet');
    if (btnPresetTab) {
      btnPresetTab.addEventListener('click', () => setHeroPreviewWidth(768));
    }
    const btnPresetMob = document.getElementById('btn-hero-preset-mobile');
    if (btnPresetMob) {
      btnPresetMob.addEventListener('click', () => setHeroPreviewWidth(390));
    }

    // Hero Live Preview Manual Resize Slider
    const previewSlider = document.getElementById('hero-preview-width-slider');
    if (previewSlider) {
      previewSlider.addEventListener('input', (e) => {
        setHeroPreviewWidth(parseFloat(e.target.value));
      });
    }

    // Radio Hero Width Layout Change (Pilihan 1: Full-width vs Pilihan 2: Boxed)
    document.querySelectorAll('input[name="hero_width_layout_radio"]').forEach(r => {
      r.addEventListener('change', () => {
        syncHeroFormVisibility();
        updateStorefrontLivePreview();
      });
    });

    // Hero Show Arrows Toggle
    const toggleArrows = document.getElementById('hero-show-arrows-toggle');
    if (toggleArrows) {
      toggleArrows.addEventListener('change', updateStorefrontLivePreview);
    }

    // Save Theme & Branding Button
    const btnSave = document.getElementById('btn-save-theme-branding');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        const storeName = document.getElementById('store-name-input')?.value.trim() || settings.store_name || 'Songer Creative';
        const storeTagline = document.getElementById('store-tagline-input')?.value.trim() || settings.store_tagline || '';
        const storePhone = document.getElementById('store-phone-input')?.value.trim() || settings.store_phone || '';
        const storeAddress = document.getElementById('store-address-input')?.value.trim() || settings.store_address || '';
        const webLogo = document.getElementById('store-logo-url-input')?.value.trim() || settings.web_logo || 'assets/images/logo-songer-creative.png';
        const browserIcon = document.getElementById('store-favicon-url-input')?.value.trim() || settings.browser_icon || 'assets/images/favicon.png';

        const navbarBg = document.getElementById('ctrl-hex-navbar-bg')?.value.trim() || '#ffffff';
        const navbarText = document.getElementById('ctrl-hex-navbar-text')?.value.trim() || '#0f172a';
        const bodyBg = document.getElementById('ctrl-hex-body-bg')?.value.trim() || '#f8fafc';
        const primColor = document.getElementById('ctrl-hex-primary')?.value.trim() || '#33b589';
        const secColor = document.getElementById('ctrl-hex-secondary')?.value.trim() || '#f59e0b';

        const selectedHeroModel = document.querySelector('input[name="hero_model_radio"]:checked')?.value || 'model_2';
        const selectedHeroWidthLayout = document.querySelector('input[name="hero_width_layout_radio"]:checked')?.value || 'boxed';
        const heroShowArrowsVal = document.getElementById('hero-show-arrows-toggle')?.checked !== false;

        const headline = document.getElementById('hero-headline-input')?.value.trim() || '';
        const subheadline = document.getElementById('hero-subheadline-input')?.value.trim() || '';
        
        // Hero Background & Styling Values
        const heroBgTypeVal = document.getElementById('hero-bg-type-select')?.value || 'linear_gradient';
        const heroBgColor1Val = document.getElementById('hero-bg-color1-hex')?.value.trim() || '#0f172a';
        const heroBgColor2Val = document.getElementById('hero-bg-color2-hex')?.value.trim() || '#064e3b';
        const heroBgAngleVal = parseInt(document.getElementById('hero-bg-angle-input')?.value || '135', 10);
        const heroTitleColorVal = document.getElementById('hero-title-color-hex')?.value.trim() || '#ffffff';
        const heroSubtitleColorVal = document.getElementById('hero-subtitle-color-hex')?.value.trim() || '#cbd5e1';
        const heroShowTimerVal = document.getElementById('hero-show-timer-toggle')?.checked !== false;

        // Dual CTA Values
        const heroCtaModeVal = document.querySelector('input[name="hero_cta_mode_radio"]:checked')?.value || 'dual';
        const heroCtaUseThemeVal = document.getElementById('hero-cta-use-theme-toggle')?.checked === true;
        const heroCta1TextVal = document.getElementById('hero-cta1-text-input')?.value.trim() || 'Lihat Semua Katalog';
        const heroCta1BgVal = document.getElementById('hero-cta1-bg-hex')?.value.trim() || primColor;
        const heroCta1TextColVal = document.getElementById('hero-cta1-text-hex')?.value.trim() || '#ffffff';
        const heroCta1IconColVal = document.getElementById('hero-cta1-icon-hex')?.value.trim() || '#ffffff';

        const heroCta2TextVal = document.getElementById('hero-cta2-text-input')?.value.trim() || 'Konsultasi Desain & Cetak';
        const heroCta2BgVal = document.getElementById('hero-cta2-bg-hex')?.value.trim() || '#25d366';
        const heroCta2TextColVal = document.getElementById('hero-cta2-text-hex')?.value.trim() || '#ffffff';
        const heroCta2IconColVal = document.getElementById('hero-cta2-icon-hex')?.value.trim() || '#ffffff';

        // Sapaan Hero Values
        const heroGreetingEnabledVal = document.getElementById('hero-greeting-preview-toggle')?.checked ?? true;
        const heroGreetingTextVal = document.getElementById('hero-greeting-text-input')?.value.trim() || `${storeName} Official`;
        const heroGreetingTextColVal = document.getElementById('hero-greeting-text-color-hex')?.value || '#ffffff';
        const heroGreetingBgColVal = document.getElementById('hero-greeting-bg-color-hex')?.value || 'rgba(255, 255, 255, 0.15)';
        const heroGreetingBorderColVal = document.getElementById('hero-greeting-border-color-hex')?.value || 'rgba(255, 255, 255, 0.20)';
        const heroGreetingRadiusVal = document.getElementById('hero-greeting-radius-select')?.value || '9999px';

        // Navbar Header Branding Rules
        const navbarBrandingModeVal = document.querySelector('input[name="navbar_branding_mode_radio"]:checked')?.value || settings.navbar_branding_mode || 'logo_landscape';
        const navbarStoreNameColorVal = document.getElementById('ctrl-hex-navbar-store-name')?.value.trim() || settings.navbar_store_name_color || '#0f172a';
        const navbarTaglineColorVal = document.getElementById('ctrl-hex-navbar-tagline')?.value.trim() || settings.navbar_tagline_color || '#64748b';
        const showHeaderStoreNameVal = document.getElementById('ctrl-toggle-show-header-store-name')?.checked !== false;

        // Card Product Version (Pertahankan nilai yang ada)
        const cardProductVersionVal = settings.card_product_version || 'v1';

        const sliderAnimation = document.getElementById('hero-slider-animation-select')?.value || 'slide_3s';
        const enableGreeting = document.getElementById('ctrl-toggle-greeting')?.checked !== false;

        const heroBanners = getActiveBannersList();
        const bannerImg = heroBanners[0] || '';

        const updatedSettings = {
          ...settings,
          store_name: storeName,
          store_tagline: storeTagline,
          store_phone: storePhone,
          store_address: storeAddress,
          web_logo: webLogo,
          browser_icon: browserIcon,
          navbar_bg_color: navbarBg,
          navbar_text_color: navbarText,
          body_bg_color: bodyBg,
          primary_color: primColor,
          secondary_color: secColor,
          card_product_version: cardProductVersionVal,
          hero_model: selectedHeroModel,
          hero_width_layout: selectedHeroWidthLayout,
          hero_show_arrows: heroShowArrowsVal,
          hero_type: selectedHeroModel === 'model_1' ? 'text' : 'banner', // backward compat
          hero_headline: headline,
          hero_subheadline: subheadline,
          hero_cta_text: heroCta1TextVal,
          // Hero Background & Text styling
          hero_bg_type: heroBgTypeVal,
          hero_bg_color1: heroBgColor1Val,
          hero_bg_color2: heroBgColor2Val,
          hero_bg_angle: heroBgAngleVal,
          hero_title_color: heroTitleColorVal,
          hero_subtitle_color: heroSubtitleColorVal,
          hero_show_timer: heroShowTimerVal,
          // Dual CTA
          hero_cta_mode: heroCtaModeVal,
          hero_cta_use_theme_default: heroCtaUseThemeVal,
          hero_cta1_text: heroCta1TextVal,
          hero_cta1_bg: heroCta1BgVal,
          hero_cta1_text_color: heroCta1TextColVal,
          hero_cta1_icon_color: heroCta1IconColVal,
          hero_cta2_text: heroCta2TextVal,
          hero_cta2_bg: heroCta2BgVal,
          hero_cta2_text_color: heroCta2TextColVal,
          hero_cta2_icon_color: heroCta2IconColVal,
          // Sapaan Hero Customization
          hero_greeting_enabled: heroGreetingEnabledVal,
          hero_greeting_text: heroGreetingTextVal,
          hero_greeting_text_color: heroGreetingTextColVal,
          hero_greeting_bg_color: heroGreetingBgColVal,
          hero_greeting_border_color: heroGreetingBorderColVal,
          hero_greeting_radius: heroGreetingRadiusVal,
          // Header Navbar Branding Rules
          navbar_branding_mode: navbarBrandingModeVal,
          navbar_store_name_color: navbarStoreNameColorVal,
          navbar_tagline_color: navbarTaglineColorVal,
          header_use_logo: navbarBrandingModeVal !== 'text_only',
          show_header_store_name: showHeaderStoreNameVal,
          hero_banner_image: bannerImg,
          hero_banners: heroBanners,
          hero_slider_animation: sliderAnimation,
          enable_customer_greeting: enableGreeting
        };

        DB.saveSettings(updatedSettings);
        syncHeaderAndTheme();
        showToast('Tema, Warna Toko, Gradasi Background Hero, & Dual CTA berhasil disimpan!', 'success');
      });
    }

    // Initial sync
    syncHeroFormVisibility();
    setHeroPreviewWidth(1200);
    if (window.lucide) window.lucide.createIcons();
  }

  // ----------------------------------------------------------------------------
  // 15. UTILITY HELPERS
  // ----------------------------------------------------------------------------
  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Public API
  return {
    init,
    navigate,
    showToast,
    logout,
    syncHeaderAndTheme,
    renderPOSCashier,
    renderDashboardView,
    renderOrdersView,
    openOrderDetailModal,
    closeOrderDetailModal,
    printOrderReceipt,
    renderThemeBrandingView,
    renderBrandingHeroView: renderThemeBrandingView,
    renderSettingsView: renderThemeBrandingView
  };
})();

// Compatibility bridging: make AdminApp accessible globally as both `AdminApp` and `App`
window.AdminApp = AdminApp;
window.App = AdminApp;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  AdminApp.init();
});


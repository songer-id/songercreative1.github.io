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

  // Helper penentuan visibilitas tombol panah hero banner (< dan >)
  function shouldShowNavArrows(sliderType, showArrowsToggle) {
    if (sliderType === 'manual' || sliderType === 'manual_swipe') {
      return true;
    }
    return Boolean(showArrowsToggle);
  }

  // 4. Kesiapan Validasi Fitur Seller (SaaS Feature Flags Hook)
  function checkFeatureAccess(featureKey) {
    const tenant = (typeof DB !== 'undefined' && DB.getCurrentTenant) ? DB.getCurrentTenant() : {};
    const features = tenant.features || {
      custom_theme_colors: true,
      hero_banner: true,
      allowed_product_cards: ['v1', 'v2', 'v3'],
      manage_sponsor_ads: true
    };
    return features[featureKey] !== false;
  }

  // ----------------------------------------------------------------------------
  // 1. INITIALIZATION & AUTHENTICATION
  // ----------------------------------------------------------------------------
  function init() {
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
  function formatStoreNameWithLineBreak(name) {
    if (!name) return '';
    const cleanName = String(name).trim();
    const words = cleanName.split(/\s+/).filter(Boolean);
    if (words.length <= 1) {
      return `<span class="block truncate max-w-[130px]" title="${escapeHtml(cleanName)}">${escapeHtml(cleanName)}</span>`;
    }
    let topText = '';
    let bottomText = '';
    if (words.length === 2) {
      topText = words[0];
      bottomText = words[1];
    } else {
      // 3 or 4 or more words: 2 words on top line, remaining below
      topText = words.slice(0, 2).join(' ');
      bottomText = words.slice(2).join(' ');
    }
    return `<span class="block truncate max-w-[130px]" title="${escapeHtml(topText)}">${escapeHtml(topText)}</span>` +
           `<span class="block truncate max-w-[130px] text-slate-600 font-bold" title="${escapeHtml(bottomText)}">${escapeHtml(bottomText)}</span>`;
  }

  function updateBrandLogoAndTitle(logoUrl, storeName) {
    const logoImg = document.getElementById('sidebar-logo-img');
    const logoBox = document.getElementById('sidebar-logo-box');
    const brandTextBox = document.getElementById('sidebar-brand-text');
    const storeTitleEl = document.getElementById('sidebar-store-title');

    const resolvedLogo = logoUrl || 'assets/images/songer-logo.png';

    if (!logoImg) return;

    const applyAspectRules = (nw, nh) => {
      const ratio = (nh > 0) ? (nw / nh) : 1;
      const isLandscape = ratio >= 1.4;

      if (isLandscape) {
        // Landscape Logo (rasio >= 1.4): HANYA tampilkan logo landscape, SEMBUNYIKAN teks nama toko di sampingnya
        if (logoBox) {
          logoBox.className = 'h-9 max-w-[170px] flex items-center justify-start overflow-hidden bg-transparent border-0 p-0 shrink-0';
        }
        logoImg.className = 'h-full w-auto max-h-9 max-w-[170px] object-contain object-left';
        if (brandTextBox) {
          brandTextBox.style.display = 'none';
        }
      } else {
        // Square / Compact Icon (1:1 / rasio < 1.4): Tampilkan icon + nama toko terformat 2 baris
        if (logoBox) {
          logoBox.className = 'w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center p-1.5 shadow-2xs shrink-0';
        }
        logoImg.className = 'w-full h-full object-contain';
        if (brandTextBox) {
          brandTextBox.style.display = 'flex';
        }
        if (storeTitleEl) {
          storeTitleEl.innerHTML = formatStoreNameWithLineBreak(storeName);
        }
      }
    };

    // Preload image offscreen to get natural dimensions accurately
    const probe = new Image();
    probe.onload = () => {
      applyAspectRules(probe.naturalWidth, probe.naturalHeight);
    };
    probe.onerror = () => {
      applyAspectRules(1, 1);
    };
    probe.src = resolvedLogo;

    if (logoImg.getAttribute('src') !== resolvedLogo) {
      logoImg.src = resolvedLogo;
    }

    if (logoImg.complete && logoImg.naturalWidth > 0) {
      applyAspectRules(logoImg.naturalWidth, logoImg.naturalHeight);
    } else {
      logoImg.onload = () => {
        applyAspectRules(logoImg.naturalWidth, logoImg.naturalHeight);
      };
      logoImg.onerror = () => {
        logoImg.src = 'assets/images/songer-logo.png';
        applyAspectRules(1, 1);
      };
    }
  }

  function syncHeaderAndTheme() {
    if (!currentTenant) {
      currentTenant = DB.getCurrentTenant();
    }
    const settings = DB.getSettings();

    // Document title
    document.title = `Admin & POS - ${settings.store_name || currentTenant.store_name}`;

    // Header info (Selalu terlihat di Topbar samping sidebar)
    const storeNameEl = document.getElementById('header-store-name');
    if (storeNameEl) storeNameEl.textContent = settings.store_name || currentTenant.store_name || 'Songer Creative';

    // Otomatisasi Logo Sidebar & Baris Nama Toko
    const activeLogo = settings.web_logo || currentTenant.web_logo || 'assets/images/songer-logo.png';
    const activeStoreName = settings.store_name || currentTenant.store_name || 'Songer Creative';
    updateBrandLogoAndTitle(activeLogo, activeStoreName);

    const tenantBadgeEl = document.getElementById('header-tenant-badge');
    if (tenantBadgeEl) tenantBadgeEl.textContent = currentTenant.store_slug || currentTenant.id || 'songer-creative-01';

    const taglineEl = document.getElementById('header-store-tagline');
    if (taglineEl) taglineEl.textContent = settings.store_tagline || currentTenant.store_tagline || 'Digital Printing & Percetakan Terpadu';

    // Synchronize Floating Profile Menu & Avatar
    const profileStoreName = document.getElementById('profile-dropdown-store-name');
    if (profileStoreName) profileStoreName.textContent = settings.store_name || currentTenant.store_name || 'Songer Creative';

    const profileStoreId = document.getElementById('profile-dropdown-store-id');
    if (profileStoreId) profileStoreId.textContent = `ID: ${currentTenant.store_slug || currentTenant.id || 'songer-creative-01'}`;

    const profileEmail = document.getElementById('header-profile-email');
    if (profileEmail) profileEmail.textContent = settings.store_email || currentTenant.email || 'admin@songercreative.com';

    const profileAvatar = document.getElementById('header-profile-avatar');
    if (profileAvatar) {
      const sName = settings.store_name || currentTenant.store_name || 'Songer Creative';
      const letters = sName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'SC';

      const user = (typeof DB !== 'undefined' && DB.getCurrentUser) ? DB.getCurrentUser() : null;
      const avatarUrl = (user && (user.avatar_url || user.avatar || user.picture)) ||
                        settings.avatar_url || settings.avatar ||
                        (currentTenant && (currentTenant.avatar_url || currentTenant.avatar));

      if (avatarUrl) {
        profileAvatar.innerHTML = `<img src="${avatarUrl}" alt="Avatar" class="w-8 h-8 rounded-full object-cover border border-slate-200" onerror="this.onerror=null; this.parentElement.innerHTML='${escapeHtml(letters)}'; this.parentElement.className='w-8 h-8 rounded-full bg-[#33b589] text-white flex items-center justify-center font-bold text-xs shadow-xs';">`;
        profileAvatar.className = 'w-8 h-8 rounded-full flex items-center justify-center shadow-xs overflow-hidden';
      } else {
        profileAvatar.textContent = letters;
        profileAvatar.className = 'w-8 h-8 rounded-full bg-[#33b589] text-white flex items-center justify-center font-bold text-xs shadow-xs';
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
    if (typeof Utils !== 'undefined' && typeof Utils.hexToRgba === 'function') {
      return Utils.hexToRgba(hex, alpha);
    }
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

    // Sidebar Hamburger, Close Button, and Drawer Backdrop Controls
    const btnHamburger = document.getElementById('btn-sidebar-hamburger');
    const btnHamburgerMobile = document.getElementById('btn-sidebar-hamburger-mobile');
    const btnCloseSidebar = document.getElementById('btn-close-sidebar');
    const btnCloseMobileSidebar = document.getElementById('btn-close-sidebar-mobile');
    const backdropSidebar = document.getElementById('sidebar-mobile-backdrop');
    const sidebarEl = document.getElementById('admin-main-sidebar');

    const openMobileSidebar = () => {
      // Aturan Saling Tutup: Jika Drawer Live Preview sedang terbuka, otomatis tutup
      const mobileSheet = document.getElementById('mobile-preview-sheet');
      const mobileBackdrop = document.getElementById('mobile-preview-backdrop');
      if (mobileSheet && !mobileSheet.classList.contains('translate-y-full')) {
        mobileSheet.classList.add('translate-y-full');
      }
      if (mobileBackdrop && !mobileBackdrop.classList.contains('hidden')) {
        mobileBackdrop.classList.add('hidden');
      }
      if (window.ProductForm && typeof window.ProductForm.closeMobilePreview === 'function') {
        window.ProductForm.closeMobilePreview();
      }

      if (sidebarEl) sidebarEl.classList.remove('-translate-x-full');
      if (backdropSidebar) backdropSidebar.classList.remove('hidden');
    };

    const closeMobileSidebar = () => {
      if (sidebarEl) sidebarEl.classList.add('-translate-x-full');
      if (backdropSidebar) backdropSidebar.classList.add('hidden');
    };

    const toggleSidebar = () => {
      if (window.innerWidth >= 1024) {
        if (sidebarEl) sidebarEl.classList.toggle('is-expanded');
      } else {
        if (sidebarEl && !sidebarEl.classList.contains('-translate-x-full')) {
          closeMobileSidebar();
        } else {
          openMobileSidebar();
        }
      }
    };

    const collapseDesktopSidebar = () => {
      if (sidebarEl) sidebarEl.classList.remove('is-expanded');
      closeMobileSidebar();
    };

    const expandDesktopSidebar = () => {
      if (sidebarEl) sidebarEl.classList.add('is-expanded');
    };

    if (btnHamburger) btnHamburger.addEventListener('click', toggleSidebar);
    if (btnHamburgerMobile) btnHamburgerMobile.addEventListener('click', toggleSidebar);
    if (btnCloseSidebar) btnCloseSidebar.addEventListener('click', collapseDesktopSidebar);
    if (btnCloseMobileSidebar) btnCloseMobileSidebar.addEventListener('click', closeMobileSidebar);
    if (backdropSidebar) backdropSidebar.addEventListener('click', closeMobileSidebar);

    // Floating Profile Menu Dropdown in Topbar (Gambar 5)
    const btnProfileDropdown = document.getElementById('btn-profile-dropdown');
    const profileFloatingMenu = document.getElementById('profile-floating-menu');
    const profileChevron = document.getElementById('header-profile-chevron');
    const btnProfileLink = document.getElementById('btn-dropdown-profile-link');
    const btnTopbarNotif = document.getElementById('btn-topbar-notifications');

    if (btnProfileDropdown && profileFloatingMenu) {
      btnProfileDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = profileFloatingMenu.classList.toggle('hidden');
        if (profileChevron) {
          if (!isHidden) {
            profileChevron.classList.add('rotate-180');
          } else {
            profileChevron.classList.remove('rotate-180');
          }
        }
      });

      document.addEventListener('click', (e) => {
        if (!profileFloatingMenu.contains(e.target) && !btnProfileDropdown.contains(e.target)) {
          profileFloatingMenu.classList.add('hidden');
          if (profileChevron) {
            profileChevron.classList.remove('rotate-180');
          }
        }
      });
    }

    if (btnProfileLink) {
      btnProfileLink.addEventListener('click', () => {
        if (profileFloatingMenu) profileFloatingMenu.classList.add('hidden');
        if (profileChevron) profileChevron.classList.remove('rotate-180');
        navigate('account');
      });
    }

    if (btnTopbarNotif) {
      btnTopbarNotif.addEventListener('click', () => {
        navigate('orders');
      });
    }

    // Quick Search Input in Topbar
    const topbarQuickSearch = document.getElementById('topbar-quick-search');
    if (topbarQuickSearch) {
      topbarQuickSearch.addEventListener('input', (e) => {
        ordersSearchQuery = e.target.value;
        if (currentView !== 'orders') {
          navigate('orders');
        } else {
          renderOrdersView();
        }
      });
    }

    // Official Sidebar Navigation Items (8 Menu Resmi)
    const navDashboard = document.getElementById('admin-nav-dashboard');
    const navThemeBranding = document.getElementById('admin-nav-theme-branding');
    const navOrders = document.getElementById('admin-nav-orders');
    const navProducts = document.getElementById('admin-nav-products');
    const navAddProduct = document.getElementById('admin-nav-add-product');
    const navCategories = document.getElementById('admin-nav-categories');
    const navPos = document.getElementById('admin-nav-pos');
    const navCustomers = document.getElementById('admin-nav-customers');
    const navAccount = document.getElementById('admin-nav-account');
    const navSettingsTheme = document.getElementById('admin-nav-settings-theme');
    const navSettingsPrint = document.getElementById('admin-nav-settings-print');

    // Menu Tambahan Marketing & Ulasan
    const navPromos = document.getElementById('admin-nav-promos');
    const navVouchers = document.getElementById('admin-nav-vouchers');
    const navSponsors = document.getElementById('admin-nav-sponsors');
    const navReviews = document.getElementById('admin-nav-reviews');

    const handleNavClick = (viewName) => {
      closeMobileSidebar();
      navigate(viewName);
    };

    if (navDashboard) navDashboard.addEventListener('click', () => handleNavClick('dashboard'));
    if (navThemeBranding) navThemeBranding.addEventListener('click', () => handleNavClick('theme-branding'));
    if (navOrders) navOrders.addEventListener('click', () => handleNavClick('orders'));
    if (navProducts) navProducts.addEventListener('click', () => handleNavClick('products'));
    if (navAddProduct) navAddProduct.addEventListener('click', () => handleNavClick('create-product'));
    if (navCategories) navCategories.addEventListener('click', () => handleNavClick('categories'));
    if (navPos) navPos.addEventListener('click', () => handleNavClick('pos'));
    if (navCustomers) navCustomers.addEventListener('click', () => handleNavClick('customers'));
    if (navAccount) navAccount.addEventListener('click', () => handleNavClick('account'));
    if (navSettingsTheme) navSettingsTheme.addEventListener('click', (e) => { e.preventDefault(); window.open('theme-editor.html', '_blank'); });
    if (navSettingsPrint) navSettingsPrint.addEventListener('click', () => {
      closeMobileSidebar();
      openReceiptModal();
    });

    if (navPromos) navPromos.addEventListener('click', () => handleNavClick('promos'));
    if (navVouchers) navVouchers.addEventListener('click', () => handleNavClick('vouchers'));
    if (navSponsors) navSponsors.addEventListener('click', () => handleNavClick('sponsors'));
    if (navReviews) navReviews.addEventListener('click', () => handleNavClick('reviews'));

    // Accordion group headers (Toko, Pengaturan & Marketing)
    document.querySelectorAll('.admin-nav-group-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        expandDesktopSidebar();
        const group = btn.getAttribute('data-group');
        const submenu = document.getElementById(`submenu-${group}`);
        if (submenu) {
          submenu.classList.remove('hidden');
          const isExpanded = submenu.classList.toggle('is-expanded');
          const chevron = btn.querySelector('.nav-group-chevron');
          if (chevron) {
            chevron.classList.toggle('rotate-180', isExpanded);
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
    if (btnDoneReceipt) btnDoneReceipt.addEventListener('click', handleCompleteReceiptWithoutPrint);
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
      'customers': document.getElementById('view-customers'),
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
      'settings': document.getElementById('view-theme-branding') || document.getElementById('view-settings'),
      'account': document.getElementById('view-account')
    };

    // Hide all views
    Object.values(views).forEach(v => {
      if (v) v.classList.add('hidden');
    });

    // Control viewport padding for Shopify studio customizer mode vs standard view
    const mainViewport = document.getElementById('admin-main-viewport');
    if (mainViewport) {
      if (viewName === 'theme-branding' || viewName === 'branding-hero') {
        mainViewport.classList.remove('p-4', 'sm:p-6', 'lg:p-8', 'overflow-y-auto');
        mainViewport.classList.add('p-0', 'overflow-hidden');
      } else {
        mainViewport.classList.remove('p-0', 'overflow-hidden');
        mainViewport.classList.add('p-4', 'sm:p-6', 'lg:p-8', 'overflow-y-auto');
      }
    }

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
    } else if (viewName === 'customers') {
      if (views.customers) views.customers.classList.remove('hidden');
      if (typeof window.CustomerManager !== 'undefined' || typeof CustomerManager !== 'undefined') {
        (window.CustomerManager || CustomerManager).init();
      }
    } else if (viewName === 'theme-branding' || viewName === 'branding-hero') {
      if (views['theme-branding']) views['theme-branding'].classList.remove('hidden');
      renderThemeBrandingView();
    } else if (viewName === 'account') {
      if (views.account) views.account.classList.remove('hidden');
      renderAccountView();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => {
      if (window.lucide) window.lucide.createIcons();
    }, 40);
  }

  // ----------------------------------------------------------------------------
  // 4B. RENDER ACCOUNT & PROFIL VIEW
  // ----------------------------------------------------------------------------
  function renderAccountView() {
    const container = document.getElementById('account-view-container');
    if (!container) return;

    const tenant = (typeof DB !== 'undefined' && DB.getCurrentTenant) ? DB.getCurrentTenant() : (currentTenant || {});
    const settings = (typeof DB !== 'undefined' && DB.getSettings) ? DB.getSettings() : {};

    const storeName = settings.store_name || tenant.store_name || 'Songer Creative';
    const storeSlug = tenant.store_slug || tenant.id || 'songer-creative-01';
    const email = settings.store_email || tenant.email || 'admin@songercreative.com';
    const phone = settings.store_phone || tenant.phone || '0812-3456-7890';
    const address = settings.store_address || tenant.address || 'Jl. Raya Percetakan No. 1, Kota Surabaya';

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
              <span>Admin Center</span> <span>/</span> <span class="text-slate-800 font-bold">Profil Akun & Toko</span>
            </div>
            <h1 class="text-2xl font-black text-slate-900 tracking-tight">Akun Pengguna & Profil Toko</h1>
            <p class="text-xs text-slate-500 mt-0.5">Informasi akun seller, hak akses tenant aktif, serta preferensi operasional toko Anda.</p>
          </div>
          <button type="button" id="btn-account-logout" class="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition flex items-center gap-2 cursor-pointer">
            <i data-lucide="log-out" class="w-4 h-4"></i>
            <span>Logout Akun</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Profil Card -->
          <div class="md:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col items-center text-center space-y-4">
            <div class="w-24 h-24 rounded-3xl bg-emerald-600 text-white flex items-center justify-center font-black text-2xl shadow-md border-4 border-emerald-50">
              ${escapeHtml((storeName || 'SC').slice(0, 2).toUpperCase())}
            </div>
            <div>
              <h2 class="text-base font-extrabold text-slate-900">${escapeHtml(storeName)}</h2>
              <span class="inline-block mt-1 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-900 text-emerald-400">
                ${escapeHtml(storeSlug)}
              </span>
            </div>
            <div class="w-full pt-4 border-t border-slate-100 text-xs space-y-2 text-slate-600">
              <div class="flex justify-between py-1 border-b border-slate-50">
                <span class="text-slate-400">Role:</span>
                <span class="font-bold text-slate-800">Owner & Administrator</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-50">
                <span class="text-slate-400">Status Toko:</span>
                <span class="font-bold text-emerald-600 flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  Aktif / Online
                </span>
              </div>
              <div class="flex justify-between py-1">
                <span class="text-slate-400">Multi-tenant ID:</span>
                <span class="font-mono text-slate-700">${escapeHtml(storeSlug)}</span>
              </div>
            </div>
            <a href="index.html?store=${encodeURIComponent(storeSlug)}" target="_blank" class="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center justify-center gap-2 border border-emerald-200 shadow-2xs">
              <i data-lucide="external-link" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>Buka Storefront Pembeli</span>
            </a>
          </div>

          <!-- Detail & Feature Flags Card -->
          <div class="md:col-span-2 space-y-6">
            <!-- Informasi Kontak -->
            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 class="font-extrabold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                <i data-lucide="contact" class="w-4 h-4 text-emerald-600"></i>
                <span>Informasi Kontak Resmi Toko</span>
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span class="block text-slate-400 text-[11px] mb-1">Email Toko Terdaftar:</span>
                  <span class="font-bold text-slate-800 font-mono">${escapeHtml(email)}</span>
                </div>
                <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span class="block text-slate-400 text-[11px] mb-1">No. WhatsApp / Telepon:</span>
                  <span class="font-bold text-slate-800 font-mono">${escapeHtml(phone)}</span>
                </div>
                <div class="sm:col-span-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span class="block text-slate-400 text-[11px] mb-1">Alamat Outlet / Workshop Percetakan:</span>
                  <span class="font-semibold text-slate-800">${escapeHtml(address)}</span>
                </div>
              </div>
            </div>

            <!-- Hak Akses Fitur Seller (SaaS Feature Flags) -->
            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 class="font-extrabold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i>
                <span>Hak Akses Fitur Seller (SaaS Feature Flags)</span>
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div class="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <span class="font-semibold text-slate-800">Custom Theme &amp; Colors:</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <i data-lucide="check" class="w-3 h-3 text-emerald-600"></i> Aktif
                  </span>
                </div>
                <div class="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <span class="font-semibold text-slate-800">Hero Banner &amp; Slider Studio:</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <i data-lucide="check" class="w-3 h-3 text-emerald-600"></i> Aktif
                  </span>
                </div>
                <div class="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <span class="font-semibold text-slate-800">Model Kartu Produk (v1, v2, v3):</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <i data-lucide="check" class="w-3 h-3 text-emerald-600"></i> Penuh (3 Model)
                  </span>
                </div>
                <div class="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <span class="font-semibold text-slate-800">Iklan Promosi &amp; Sponsor Ads:</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <i data-lucide="check" class="w-3 h-3 text-emerald-600"></i> Aktif
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const btnLogout = document.getElementById('btn-account-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', handleLogout);
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // ----------------------------------------------------------------------------
  // 4C. UPDATE SIDEBAR NAV ACTIVE STYLING (EMERALD BRAND GREEN)
  // ----------------------------------------------------------------------------
  function updateSidebarNavActive(viewName) {
    const navDashboard = document.getElementById('admin-nav-dashboard');
    const navThemeBranding = document.getElementById('admin-nav-theme-branding');
    const navOrders = document.getElementById('admin-nav-orders');
    const navProducts = document.getElementById('admin-nav-products');
    const navAddProduct = document.getElementById('admin-nav-add-product');
    const navCategories = document.getElementById('admin-nav-categories');
    const navPos = document.getElementById('admin-nav-pos');
    const navCustomers = document.getElementById('admin-nav-customers');
    const navAccount = document.getElementById('admin-nav-account');
    const navSettingsTheme = document.getElementById('admin-nav-settings-theme');
    const navSettingsPrint = document.getElementById('admin-nav-settings-print');

    const navPromos = document.getElementById('admin-nav-promos');
    const navVouchers = document.getElementById('admin-nav-vouchers');
    const navSponsors = document.getElementById('admin-nav-sponsors');
    const navReviews = document.getElementById('admin-nav-reviews');

    const navMap = [
      { key: 'dashboard', el: navDashboard },
      { key: 'theme-branding', el: navThemeBranding },
      { key: 'branding-hero', el: navThemeBranding },
      { key: 'orders', el: navOrders },
      { key: 'products', el: navProducts },
      { key: 'list', el: navProducts },
      { key: 'create-product', el: navAddProduct },
      { key: 'create', el: navAddProduct },
      { key: 'categories', el: navCategories },
      { key: 'pos', el: navPos },
      { key: 'customers', el: navCustomers },
      { key: 'account', el: navAccount },
      { key: 'settings', el: navSettingsTheme },
      { key: 'promos', el: navPromos },
      { key: 'vouchers', el: navVouchers },
      { key: 'sponsors', el: navSponsors },
      { key: 'reviews', el: navReviews }
    ];

    const activeClasses = ['bg-emerald-50', 'text-[#33b589]', 'font-bold', 'rounded-lg', 'is-nav-active', 'border', 'border-transparent'];
    const inactiveClasses = ['text-slate-600', 'border', 'border-transparent', 'hover:bg-slate-100', 'hover:text-[#0e281f]', 'rounded-lg'];

    const submenuActiveClasses = ['bg-emerald-50', 'text-[#33b589]', 'font-bold', 'rounded-lg', 'is-nav-active', 'border', 'border-transparent'];
    const submenuInactiveClasses = ['text-slate-600', 'border', 'border-transparent', 'hover:bg-slate-100', 'hover:text-[#0e281f]', 'rounded-lg', 'bg-transparent'];

    navMap.forEach(item => {
      if (item.el) {
        const isSelected = item.key === viewName || (viewName === 'edit' && item.key === 'products');
        const iconEl = item.el.querySelector('.nav-icon') || item.el.querySelector('i');
        const labelEl = item.el.querySelector('.nav-label-text');
        const isSubmenuItem = Boolean(item.el.closest('.nav-submenu'));

        const targetActive = isSubmenuItem ? submenuActiveClasses : activeClasses;
        const targetInactive = isSubmenuItem ? submenuInactiveClasses : inactiveClasses;

        if (isSelected) {
          item.el.classList.remove(...inactiveClasses, ...submenuInactiveClasses, 'rounded-2xl', 'rounded-xl', 'border-emerald-200/60', 'hover:border-slate-200/80', 'text-white/90', 'text-white/80', 'text-white/70', 'hover:bg-white/20', 'hover:text-white', 'text-slate-600', 'text-slate-500', 'hover:bg-slate-100/80', 'hover:text-slate-900', 'bg-white', 'text-emerald-700');
          item.el.classList.add(...targetActive);
          if (iconEl) {
            iconEl.classList.remove('text-white/90', 'text-white/80', 'text-white/70', 'text-white', 'text-emerald-100', 'text-slate-500', 'text-slate-600', 'text-emerald-700');
            iconEl.classList.add('text-[#33b589]', 'font-bold');
          }
          if (labelEl) {
            labelEl.classList.remove('text-white/90', 'text-white/80', 'text-white/70', 'text-white', 'text-slate-600', 'text-slate-500', 'text-emerald-700');
            labelEl.classList.add('text-emerald-700', 'font-bold');
          }

          // Auto-expand group submenu
          const parentSubmenu = item.el.closest('.nav-submenu');
          if (parentSubmenu) {
            parentSubmenu.classList.remove('hidden');
            parentSubmenu.classList.add('is-expanded');
            const groupToggleBtn = document.querySelector(`.admin-nav-group-toggle[data-group="${parentSubmenu.id.replace('submenu-', '')}"]`);
            const chevron = groupToggleBtn?.querySelector('.nav-group-chevron');
            if (chevron) {
              chevron.classList.add('rotate-180');
            }
          }
        } else {
          item.el.classList.remove(...activeClasses, ...submenuActiveClasses, 'rounded-2xl', 'rounded-xl', 'border-emerald-200/60', 'hover:border-slate-200/80', 'bg-white', 'text-emerald-700', 'is-nav-active');
          item.el.classList.add(...targetInactive);
          if (iconEl) {
            iconEl.classList.remove('text-[#33b589]', 'text-emerald-700', 'font-bold');
            iconEl.classList.add('text-slate-500');
          }
          if (labelEl) {
            labelEl.classList.remove('text-[#33b589]', 'text-emerald-700', 'font-bold');
            labelEl.classList.add('text-slate-600');
          }
        }
      }
    });

    // Sync all group chevrons with submenu is-expanded state
    ['toko', 'settings', 'marketing'].forEach(grp => {
      const sub = document.getElementById(`submenu-${grp}`);
      const btn = document.querySelector(`.admin-nav-group-toggle[data-group="${grp}"]`);
      const chev = btn?.querySelector('.nav-group-chevron');
      if (chev && sub) {
        chev.classList.toggle('rotate-180', sub.classList.contains('is-expanded'));
      }
    });

    // Sync notification badge count in topbar and sidebar
    const ordersCount = (typeof DB !== 'undefined' && DB.getOrders) ? DB.getOrders().length : 0;
    const badgeEl = document.getElementById('sidebar-badge-orders');
    if (badgeEl) {
      badgeEl.textContent = ordersCount;
      if (ordersCount > 0) badgeEl.classList.remove('hidden');
    }

    // SINKRONISASI INDUK SUBMENU: Menu Induk ("Toko", "Pengaturan" dan "Marketing & Promosi") WAJIB ikut menyala saat submenunya aktif
    const isTokoActive = ['products', 'list', 'create-product', 'create', 'categories', 'reviews', 'edit'].includes(viewName);
    const isSettingsActive = ['settings'].includes(viewName);
    const isMarketingActive = ['promos', 'vouchers', 'sponsors'].includes(viewName);

    const tokoGroupBtn = document.getElementById('admin-nav-group-toko-btn');
    const tokoGroupIcon = document.getElementById('admin-nav-group-toko-icon');
    if (tokoGroupBtn && tokoGroupIcon) {
      if (isTokoActive) {
        tokoGroupIcon.classList.remove('text-slate-600', 'text-slate-500', 'text-slate-400');
        tokoGroupIcon.classList.add('text-[#33b589]');
        tokoGroupBtn.classList.add('text-[#33b589]', 'font-bold');
        tokoGroupBtn.classList.remove('text-slate-600');
      } else {
        tokoGroupIcon.classList.remove('text-[#33b589]', 'text-emerald-600');
        tokoGroupIcon.classList.add('text-slate-500');
        tokoGroupBtn.classList.remove('text-[#33b589]', 'text-emerald-700', 'font-bold');
        tokoGroupBtn.classList.add('text-slate-600');
      }
    }

    const settingsGroupBtn = document.getElementById('admin-nav-group-settings-btn');
    const settingsGroupIcon = document.getElementById('admin-nav-group-settings-icon');
    if (settingsGroupBtn && settingsGroupIcon) {
      if (isSettingsActive) {
        settingsGroupIcon.classList.remove('text-slate-600', 'text-slate-500', 'text-slate-400');
        settingsGroupIcon.classList.add('text-[#33b589]');
        settingsGroupBtn.classList.add('text-[#33b589]', 'font-bold');
        settingsGroupBtn.classList.remove('text-slate-600');
      } else {
        settingsGroupIcon.classList.remove('text-[#33b589]', 'text-emerald-600');
        settingsGroupIcon.classList.add('text-slate-500');
        settingsGroupBtn.classList.remove('text-[#33b589]', 'text-emerald-700', 'font-bold');
        settingsGroupBtn.classList.add('text-slate-600');
      }
    }

    const mktGroupBtn = document.getElementById('admin-nav-group-marketing-btn');
    const mktGroupIcon = document.getElementById('admin-nav-group-marketing-icon');
    if (mktGroupBtn && mktGroupIcon) {
      if (isMarketingActive) {
        mktGroupIcon.classList.remove('text-slate-600', 'text-slate-500', 'text-slate-400');
        mktGroupIcon.classList.add('text-[#33b589]');
        mktGroupBtn.classList.add('text-[#33b589]', 'font-bold');
        mktGroupBtn.classList.remove('text-slate-600');
      } else {
        mktGroupIcon.classList.remove('text-[#33b589]', 'text-emerald-600');
        mktGroupIcon.classList.add('text-slate-500');
        mktGroupBtn.classList.remove('text-[#33b589]', 'text-emerald-700', 'font-bold');
        mktGroupBtn.classList.add('text-slate-600');
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
      posCart[existingIndex].total_cost = posCart[existingIndex].qty * (posCart[existingIndex].cost_price || Math.round(posCart[existingIndex].unitPrice * 0.6));
    } else {
      const baseCost = (typeof prod.cost_price === 'number' && prod.cost_price > 0)
        ? prod.cost_price
        : Math.round(finalUnitPrice * 0.6);
      posCart.push({
        id: generateUUID(),
        productId: prod.id,
        name: prod.name,
        orderCategory: prod.order_category || 'Ctk',
        specsText: 'Item Standar / Ready',
        unitPrice: finalUnitPrice,
        cost_price: baseCost,
        total_cost: baseCost * 1,
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

      const matCostPerM2 = (typeof selectedMat.cost_price === 'number' && selectedMat.cost_price > 0)
        ? selectedMat.cost_price
        : Math.round((selectedMat.price_per_m2 || 30000) * 0.6);
      const finCost = (prod.finishings && prod.finishings[finIdx] && typeof prod.finishings[finIdx].cost_price === 'number')
        ? prod.finishings[finIdx].cost_price
        : Math.round(finPrice * 0.5);
      costPerUnit = Math.round((billableArea * matCostPerM2) + finCost);
    } else {
      const matIdx = parseInt(matSelect?.value || '0', 10);
      if (prod.options && prod.options[matIdx]) {
        unitPrice = prod.options[matIdx].price;
        specsText = `Varian: ${prod.options[matIdx].name}`;
        costPerUnit = (typeof prod.options[matIdx].cost_price === 'number' && prod.options[matIdx].cost_price > 0)
          ? prod.options[matIdx].cost_price
          : Math.round(unitPrice * 0.6);
      } else {
        unitPrice = prod.price || 50000;
        specsText = 'Item Custom Spesifikasi';
        costPerUnit = (typeof prod.cost_price === 'number' && prod.cost_price > 0)
          ? prod.cost_price
          : Math.round(unitPrice * 0.6);
      }
    }

    const subtotal = unitPrice * qty;
    const totalCost = costPerUnit * qty;

    posCart.push({
      id: generateUUID(),
      productId: prod.id,
      name: prod.name,
      orderCategory: prod.order_category || 'Ctk',
      specsText: specsText,
      unitPrice: unitPrice,
      cost_price: costPerUnit,
      total_cost: totalCost,
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
            posCart[idx].total_cost = posCart[idx].qty * (posCart[idx].cost_price || Math.round(posCart[idx].unitPrice * 0.6));
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
          posCart[idx].total_cost = posCart[idx].qty * (posCart[idx].cost_price || Math.round(posCart[idx].unitPrice * 0.6));
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
        changeEl.textContent = 'Rp0';
        changeEl.className = 'font-mono font-black text-slate-700 text-sm';
      } else if (change >= 0) {
        changeEl.textContent = `Rp${change.toLocaleString('id-ID')}`;
        changeEl.className = 'font-mono font-black text-emerald-700 text-sm';
      } else {
        changeEl.textContent = `Kurang Rp${Math.abs(change).toLocaleString('id-ID')}`;
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
    const orderTotalCost = posCart.reduce((sum, item) => sum + (item.total_cost || ((item.cost_price || 0) * item.qty)), 0);

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
      total_cost: orderTotalCost,
      net_profit: Math.max(0, grandTotal - orderTotalCost),
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

  function handleCompleteReceiptWithoutPrint() {
    if (!posActiveReceiptData) {
      closeReceiptModal();
      return;
    }

    const savedInvoiceNumber = posActiveReceiptData.invoice_number;

    // 1. Save order to Local Storage Database
    DB.saveOrder(posActiveReceiptData);

    // 1B. Record Customer in CRM Pelanggan
    if (typeof window.CustomerManager !== 'undefined' && typeof CustomerManager.recordCustomerOrder === 'function') {
      try {
        CustomerManager.recordCustomerOrder(posActiveReceiptData);
      } catch (err) {
        console.warn('[CRM] Gagal mencatat pesanan pelanggan:', err);
      }
    }

    // 2. Clear Cashier Basket
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

    // 3. Close modal
    closeReceiptModal();
    showToast(`Transaksi ${savedInvoiceNumber} berhasil disimpan!`, 'success');
  }

  function executeThermalPrint() {
    if (!posActiveReceiptData) return;

    const savedInvoiceNumber = posActiveReceiptData.invoice_number;

    // 1. Save order to Local Storage Database
    DB.saveOrder(posActiveReceiptData);

    // 1B. Record Customer in CRM Pelanggan
    if (typeof window.CustomerManager !== 'undefined' && typeof CustomerManager.recordCustomerOrder === 'function') {
      try {
        CustomerManager.recordCustomerOrder(posActiveReceiptData);
      } catch (err) {
        console.warn('[CRM] Gagal mencatat pesanan pelanggan:', err);
      }
    }

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
    showToast(`Transaksi ${savedInvoiceNumber} berhasil disimpan dan dicetak!`, 'success');
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

  // ----------------------------------------------------------------------------
  // 11. DASHBOARD VIEW (METRICS, 6-MONTH CHART & INCOMING ORDERS)
  // ----------------------------------------------------------------------------
  function renderDashboardView() {
    const container = document.getElementById('dashboard-view-container');
    if (!container) return;

    const metrics = DB.getDashboardMetrics();
    const formatIDR = (num) => 'Rp' + Math.round(num || 0).toLocaleString('id-ID');

    // 6-Month historical chart calculation
    // 6-Month historical chart calculation
    const trends = metrics.monthlyTrends || [];
    const maxRev = Math.max(...trends.map(t => t.revenue), 1000000);
    const chartMaxY = Math.ceil(maxRev / 2000000) * 2000000;

    // SVG coordinate mapping
    const svgWidth = 600;
    const svgHeight = 240;
    const padX = 55;
    const padTop = 25;
    const padBottom = 40;
    const plotHeight = svgHeight - padTop - padBottom;
    const plotWidth = svgWidth - padX - 25;
    const stepX = plotWidth / (trends.length - 1 || 1);
    const bW = 22; // Proporsional 22px width

    // Build SVG bar & area elements
    let barsHtml = '';
    let xLabelsHtml = '';
    trends.forEach((t, i) => {
      const cx = padX + i * stepX;
      const barH = Math.max(4, (t.revenue / chartMaxY) * plotHeight);
      const barY = padTop + (plotHeight - barH);

      const isCurrentMonth = i === trends.length - 1;
      const fillId = isCurrentMonth ? 'url(#barGradActive)' : 'url(#barGradNormal)';

      barsHtml += `
        <g class="chart-bar-group cursor-pointer group">
          <title>${t.month} ${t.year}: Omzet ${formatIDR(t.revenue)} (${t.orders} Pesanan) • Laba Est. ${formatIDR(t.profit)}</title>
          <!-- Background hover vertical track -->
          <rect x="${cx - 16}" y="${padTop}" width="32" height="${plotHeight}" fill="#f1f5f9" class="opacity-0 group-hover:opacity-70 transition-opacity" rx="4" />
          <!-- Main bar with smooth top radius rx=4 ry=4 and flat bottom -->
          <rect x="${cx - bW / 2}" y="${barY}" width="${bW}" height="${barH}" fill="${fillId}" rx="4" ry="4" class="transition-all duration-300 group-hover:opacity-90" />
          ${barH > 8 ? `<rect x="${cx - bW / 2}" y="${barY + barH - 4}" width="${bW}" height="4" fill="${fillId}" />` : ''}
        </g>
      `;

      xLabelsHtml += `
        <text x="${cx}" y="${svgHeight - 14}" font-size="11" font-weight="${isCurrentMonth ? '700' : '500'}" fill="${isCurrentMonth ? '#0f172a' : '#64748b'}" text-anchor="middle" class="font-sans">
          ${t.month}
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
        <line x1="${padX}" y1="${yPos}" x2="${svgWidth - 20}" y2="${yPos}" stroke="#f1f5f9" stroke-width="1" />
        <text x="${padX - 8}" y="${yPos + 3}" font-size="9" font-weight="600" fill="#94a3b8" text-anchor="end" class="font-mono">${label}</text>
      `;
    });

    const totalRev = metrics.totalRevenueMonth !== undefined ? metrics.totalRevenueMonth : (metrics.totalTurnoverMonth || 0);
    const totalOrders = metrics.totalOrdersMonth !== undefined ? metrics.totalOrdersMonth : 0;
    const webOrders = metrics.webOrdersCount !== undefined ? metrics.webOrdersCount : (metrics.webOrdersMonth !== undefined ? metrics.webOrdersMonth : 0);
    const posOrders = metrics.posOrdersCount !== undefined ? metrics.posOrdersCount : (metrics.posOrdersMonth !== undefined ? metrics.posOrdersMonth : 0);
    const estProfit = metrics.estimatedNetProfit !== undefined ? metrics.estimatedNetProfit : Math.round(totalRev * 0.42);
    const topProdName = metrics.bestsellerName || (metrics.topProduct ? metrics.topProduct.name : 'Produk Populer');
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
    const profitColorClass = estProfit > 0 ? 'text-slate-900' : 'text-slate-800';

    container.innerHTML = `
      <div class="space-y-6 max-w-7xl mx-auto pb-12">
        
        <!-- Dashboard Header & Real-time Indicator (Clean Modern) -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
              <span>Admin Center</span> <span>/</span> <span class="text-slate-800 font-bold">Ringkasan Bisnis</span>
            </div>
            <h1 class="text-2xl font-black text-slate-900 tracking-tight">
              Ringkasan Bisnis &amp; Penjualan
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">Ringkasan performa omzet penjualan, metrik operasional, dan analitik toko Anda.</p>
          </div>
        </div>

        <!-- 1. METRIC CARDS (5 CARDS: STRIPE / SHOPIFY MODERN STANDARD) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          
          <!-- Metric 1: Total Omzet -->
          <div class="border border-slate-200/80 bg-white rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-3 relative overflow-hidden transition hover:border-slate-300">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-xs font-semibold text-slate-500 block">Total Omzet</span>
                <div class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1 font-mono">${formatIDR(totalRev)}</div>
              </div>
              <div class="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center shrink-0">
                <i data-lucide="wallet" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span class="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                <i data-lucide="trending-up" class="w-3 h-3 mr-0.5 inline"></i> +18.4%
              </span>
              <span class="text-[11px] text-slate-400">vs bulan lalu</span>
            </div>
          </div>

          <!-- Metric 2: Pesanan Masuk -->
          <div class="border border-slate-200/80 bg-white rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-3 relative overflow-hidden transition hover:border-slate-300">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-xs font-semibold text-slate-500 block">Pesanan Masuk</span>
                <div class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1 font-mono">${totalOrders} Pesanan</div>
              </div>
              <div class="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center shrink-0">
                <i data-lucide="shopping-bag" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
              <span class="text-emerald-700 font-semibold">${webOrders} Web WA</span>
              <span class="text-slate-300">•</span>
              <span class="text-slate-700 font-semibold">${posOrders} Kasir POS</span>
            </div>
          </div>

          <!-- Metric 3: Estimasi Laba -->
          <div class="border border-slate-200/80 bg-white rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-3 relative overflow-hidden transition hover:border-slate-300">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-xs font-semibold text-slate-500 block">Estimasi Laba</span>
                <div class="text-xl sm:text-2xl font-bold tracking-tight ${profitColorClass} mt-1 font-mono">${formatIDR(estProfit)}</div>
              </div>
              <div class="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center shrink-0">
                <i data-lucide="coins" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span class="text-[11px] text-slate-400">Margin operasional</span>
              <span class="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-mono">
                ${totalRev > 0 ? Math.round((estProfit / totalRev) * 100) : 0}% Margin
              </span>
            </div>
          </div>

          <!-- Metric 4: Produk Terpopuler -->
          <div class="border border-slate-200/80 bg-white rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-3 relative overflow-hidden transition hover:border-slate-300">
            <div class="flex items-start justify-between">
              <div class="min-w-0 pr-2">
                <span class="text-xs font-semibold text-slate-500 block">Produk Terpopuler</span>
                <div class="text-base sm:text-lg font-bold tracking-tight text-slate-900 mt-1 truncate" title="${escapeHtml(topProdName)}">
                  ${escapeHtml(topProdName)}
                </div>
              </div>
              <div class="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center shrink-0">
                <i data-lucide="flame" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span class="inline-flex items-center text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                ${topProdSold} Terjual
              </span>
              <span class="text-[11px] text-slate-400">bulan ini</span>
            </div>
          </div>

          <!-- Metric 5: Sponsor Aktif -->
          <div class="border border-slate-200/80 bg-white rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-3 relative overflow-hidden transition hover:border-slate-300">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-xs font-semibold text-slate-500 block">Sponsor Aktif</span>
                <div class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1 font-mono">${formatIDR(sponsorRevenue)}</div>
              </div>
              <div class="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center shrink-0">
                <i data-lucide="megaphone" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
              <span class="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                ${activeSponsorCount} Slot Aktif
              </span>
              <span class="text-[11px] text-slate-400">Monetisasi etalase</span>
            </div>
          </div>

        </div>

        <!-- 2. DIAGRAM PENJUALAN BULANAN (SVG CHART ANALYTICS MODERN) -->
        <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div class="flex items-center gap-2">
                <i data-lucide="bar-chart-3" class="w-4 h-4 text-emerald-600"></i>
                <h3 class="font-bold text-sm text-slate-900 tracking-tight">Tren Penjualan 6 Bulan Terakhir</h3>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">Grafik batang performa omzet dan estimasi laba kotor toko berjalan.</p>
            </div>
            <!-- Legend Indicators -->
            <div class="flex items-center gap-4 text-xs font-medium">
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block"></span>
                <span class="text-slate-600 text-xs">Total Omzet Penjualan</span>
              </div>
            </div>
          </div>

          <!-- Responsive SVG Bar Chart -->
          <div class="w-full overflow-x-auto">
            <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="w-full h-56 sm:h-64 select-none">
              <defs>
                <linearGradient id="barGradNormal" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#33b589" />
                  <stop offset="100%" stop-color="#249670" />
                </linearGradient>
                <linearGradient id="barGradActive" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#38c495" />
                  <stop offset="100%" stop-color="#1e7e5e" />
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
    const formatIDR = (num) => 'Rp' + Math.round(num || 0).toLocaleString('id-ID');

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
      <tr class="hover:bg-slate-50/80 transition cursor-pointer order-table-row border-b border-slate-100 last:border-b-0" data-id="${ord.id}">
        <!-- Invoice ID -->
        <td class="px-5 py-4.5 font-mono font-bold text-slate-900">
          <span class="text-emerald-700 font-extrabold">${escapeHtml(ord.invoice_number)}</span>
        </td>

        <!-- Tanggal -->
        <td class="px-5 py-4.5 text-slate-500 font-mono text-[11px]">
          ${dateFormatted}
        </td>

        <!-- Nama Pelanggan -->
        <td class="px-5 py-4.5">
          <div class="font-bold text-slate-900 text-xs sm:text-sm">${escapeHtml(ord.customer_name || 'Pelanggan Umum')}</div>
          <div class="text-[11px] text-slate-400 font-mono mt-0.5">${escapeHtml(ord.customer_phone || '-')}</div>
        </td>

        <!-- Sumber Pesanan -->
        <td class="px-5 py-4.5">
          ${isWeb ? `
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              <i data-lucide="message-square" class="w-3 h-3 text-teal-600"></i>
              Web Checkout
            </span>
          ` : `
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
              <i data-lucide="monitor" class="w-3 h-3 text-slate-600"></i>
              Kasir POS
            </span>
          `}
        </td>

        <!-- Total Tagihan -->
        <td class="px-5 py-4.5 font-bold text-slate-900 font-mono text-sm">
          ${formatIDR(ord.total)}
        </td>

        <!-- Status -->
        <td class="px-5 py-4.5 text-center">
          ${statusBadge}
        </td>

        <!-- Aksi -->
        <td class="px-5 py-4.5 text-center" onclick="event.stopPropagation()">
          <div class="flex items-center justify-center gap-2">
            <select class="select-order-status px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold outline-none cursor-pointer bg-white text-slate-700 focus:border-emerald-500 shadow-2xs" data-id="${ord.id}">
              <option value="PENDING" ${st === 'PENDING' ? 'selected' : ''}>Menunggu</option>
              <option value="PROCESSING" ${st === 'PROCESSING' ? 'selected' : ''}>Diproses</option>
              <option value="COMPLETED" ${st === 'COMPLETED' || st === 'PAID' ? 'selected' : ''}>Selesai</option>
              <option value="CANCELLED" ${st === 'CANCELLED' ? 'selected' : ''}>Dibatalkan</option>
            </select>
            <button type="button" class="btn-print-order-receipt p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition font-bold text-xs flex items-center justify-center shadow-2xs" data-id="${ord.id}" title="Cetak Struk Thermal 58mm/80mm">
              <i data-lucide="printer" class="w-3.5 h-3.5 text-emerald-600"></i>
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
    const formatIDR = (num) => 'Rp' + Math.round(num || 0).toLocaleString('id-ID');

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
        <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <!-- Search Input -->
            <div class="relative flex-1 max-w-sm">
              <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
              <input type="text" id="input-orders-search" value="${escapeHtml(ordersSearchQuery)}" placeholder="Cari No. Faktur / Nama Pembeli..." class="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs outline-none focus:border-emerald-500 focus:bg-white font-medium transition" />
            </div>

            <!-- Status Tabs (Sesuai Gambar 8) -->
            <div class="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              <button type="button" class="btn-orders-status-tab px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${ordersStatusFilter === 'all' ? 'bg-[#33b589] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-status="all">Semua Pesanan (${allOrders.length})</button>
              <button type="button" class="btn-orders-status-tab px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${ordersStatusFilter === 'PENDING' ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-status="PENDING">Menunggu Konfirmasi (${pendingCount})</button>
              <button type="button" class="btn-orders-status-tab px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${ordersStatusFilter === 'PROCESSING' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-status="PROCESSING">Diproses (${processingCount})</button>
              <button type="button" class="btn-orders-status-tab px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${ordersStatusFilter === 'COMPLETED' ? 'bg-[#33b589] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-status="COMPLETED">Selesai (${completedCount})</button>
            </div>

            <!-- Channel Filter -->
            <div class="flex items-center gap-2 text-xs">
              <span class="font-bold text-slate-500 whitespace-nowrap">Sumber:</span>
              <select id="select-orders-channel" class="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none bg-slate-50 focus:bg-white focus:border-emerald-500 cursor-pointer">
                <option value="all" ${ordersChannelFilter === 'all' ? 'selected' : ''}>Semua Saluran</option>
                <option value="WEB_WA" ${ordersChannelFilter === 'WEB_WA' ? 'selected' : ''}>Web Checkout WA</option>
                <option value="B_POS" ${ordersChannelFilter === 'B_POS' ? 'selected' : ''}>Kasir POS Offline</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Orders Table -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-50/90 text-slate-700 font-bold border-b border-slate-200/80 text-[11px] tracking-wide uppercase">
                  <th class="px-5 py-4 w-44">No. Faktur / Invoice</th>
                  <th class="px-5 py-4 w-36">Waktu & Tanggal</th>
                  <th class="px-5 py-4">Nama Pelanggan</th>
                  <th class="px-5 py-4 w-32">Sumber</th>
                  <th class="px-5 py-4 w-36">Total Tagihan</th>
                  <th class="px-5 py-4 w-36 text-center">Status</th>
                  <th class="px-5 py-4 w-44 text-center">Aksi Transaksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${filteredOrders.length === 0 ? `
                  <tr>
                    <td colspan="7" class="p-12 text-center text-slate-400 text-xs">
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

    const formatIDR = (num) => 'Rp' + Math.round(num || 0).toLocaleString('id-ID');
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

    // Top Bar Background & Text Colors
    const topBarBgColor = settings.top_bar_bg_color || '#0f172a';
    const topBarTextColor = settings.top_bar_text_color || '#f8fafc';

    // Varian Navigasi Kategori (Quick Filter)
    const categoryNavModeMobile = settings.category_nav_mode_mobile || 'icon_image';
    const categoryNavModeDesktop = settings.category_nav_mode_desktop || 'icon_image';

    // Hero Background & Styling Settings
    const heroBgType = settings.hero_bg_type || 'linear_gradient';
    const heroBgColor1 = settings.hero_bg_color1 || '#0f172a';
    const heroBgColor2 = settings.hero_bg_color2 || '#064e3b';
    const heroBgAngle = settings.hero_bg_angle !== undefined ? settings.hero_bg_angle : 135;
    const heroTitleColor = settings.hero_title_color || '#0f172a';
    const heroDescColor = settings.hero_desc_color || settings.hero_subtitle_color || '#475569';
    const heroSubtitleColor = heroDescColor;

    // Hero Container Customization (Boxed mode)
    const heroContainerRadiusRaw = settings.hero_container_radius || '16px';
    const heroContainerRadiusNum = parseInt(heroContainerRadiusRaw, 10) || 16;
    const heroContainerShadow = settings.hero_container_shadow || 'sm';

    // Hero Image Box Customization (Split mode)
    const heroImageRadiusRaw = settings.hero_image_radius || '12px';
    const heroImageRadiusNum = parseInt(heroImageRadiusRaw, 10) || 12;
    const heroImageShadow = settings.hero_image_shadow || 'sm';

    // Hero Dots Navigation Customization
    const heroDotsActiveColor = settings.hero_dots_active_color || '#10b981';
    const heroDotsInactiveColor = settings.hero_dots_inactive_color || '#cbd5e1';

    // Hero Manual Arrows Navigation Customization
    const heroArrowsBg = settings.hero_arrows_bg || 'rgba(0,0,0,0.45)';
    const heroArrowsHoverBg = settings.hero_arrows_hover_bg || 'rgba(0,0,0,0.75)';
    const heroArrowsIconColor = settings.hero_arrows_icon_color || '#ffffff';
    const heroArrowsRadius = settings.hero_arrows_radius || '9999px';
    const heroArrowsShadow = settings.hero_arrows_shadow || 'sm';
    const heroArrowsVisibility = settings.hero_arrows_visibility || 'hover';

    // Map backwards-compatible hero model & mobile ratio
    let heroModel = settings.hero_model || 'non_split';
    if (heroModel === 'model_2') heroModel = 'non_split';
    if (heroModel === 'model_4') heroModel = 'split';
    const heroMobileRatio = settings.hero_mobile_ratio || '16:5';
    const heroWidthLayout = settings.hero_width_layout || 'boxed';
    const heroSplitMobile = settings.hero_split_mobile || 'image_top';
    const heroShowArrows = settings.hero_show_arrows !== false;
    const heroEnabled = settings.hero_enabled !== false && settings.enable_hero !== false;
    const heroSplitDesktopPos = settings.hero_split_desktop_pos || 'text_left';
    const cardProductVersion = settings.card_product_version || 'v1';

    // Navbar Branding Mode & Custom Text Colors
    const navbarBrandingMode = settings.navbar_branding_mode || (settings.header_use_logo === false ? 'text_only' : 'logo_landscape');
    const navbarStoreNameColor = settings.navbar_store_name_color || navbarTextColor;
    const navbarTaglineColor = settings.navbar_tagline_color || '#64748b';

    // Kustomisasi Warna Elemen Navbar Toko
    const navbarCartIconColor = settings.navbar_cart_icon_color || '#334155';
    const navbarCartBadgeBg = settings.navbar_cart_badge_bg || '#f43f5e';
    const navbarCartBadgeText = settings.navbar_cart_badge_text || '#ffffff';
    const navbarSearchIconColor = settings.navbar_search_icon_color || '#94a3b8';
    const navbarSearchInputBg = settings.navbar_search_input_bg || '#f1f5f9';
    const navbarSearchBorderColor = settings.navbar_search_border_color || '#e2e8f0';
    const navbarSearchPlaceholderColor = settings.navbar_search_placeholder_color || '#94a3b8';
    const navbarLoginIconColor = settings.navbar_login_icon_color || '#334155';
    const navbarLoginTextColor = settings.navbar_login_text_color || '#334155';

    const heroBanners = (settings.hero_banners && settings.hero_banners.length > 0)
      ? settings.hero_banners
      : (settings.hero_banner_image ? [settings.hero_banner_image] : ['assets/images/banner1.jpg']);

    const heroAnimation = settings.hero_slider_animation || 'slide_3s';

    container.innerHTML = `
      <div class="theme-customizer-studio h-full w-full">

        <!-- Mobile Tab Switcher (< 768px) -->
        <div class="theme-studio-mobile-tabs hidden max-md:flex md:hidden bg-slate-900 border-b border-slate-800 p-2 items-center justify-center gap-2 shrink-0">
          <button type="button" id="btn-theme-tab-tools" class="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-emerald-600 text-white shadow-xs cursor-pointer">
            <i data-lucide="sliders" class="w-4 h-4"></i>
            <span>Tab 1: Pengaturan Tools</span>
          </button>
          <button type="button" id="btn-theme-tab-preview" class="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
            <i data-lucide="eye" class="w-4 h-4"></i>
            <span>Tab 2: Pratinjau Toko</span>
          </button>
        </div>

        <!-- CENTER / LEFT LIVE CANVAS STOREFRONT -->
        <div class="theme-studio-canvas-col is-tab-hidden" id="theme-canvas-container">
          <!-- Canvas Toolbar Header -->
          <div class="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
              <span class="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span class="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span class="ml-2 font-black text-xs text-white tracking-tight flex items-center gap-1.5">
                <i data-lucide="layout-template" class="w-4 h-4 text-emerald-400"></i>
                <span>Live Canvas Storefront</span>
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Real-Time Sync
              </span>
            </div>

            <!-- CONTROLS: 3 RESOLUTION PRESETS & MANUAL RESIZE SLIDER -->
            <div class="flex items-center gap-2">
              <!-- 3 PRESET RESOLUSI (DESKTOP, TAB, MOBILE) -->
              <div class="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner">
                <button type="button" id="btn-hero-preset-desktop" class="hero-preset-btn px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 bg-emerald-600 text-white shadow-xs cursor-pointer" data-width="1200" title="Preset Resolusi Layar Desktop (1200px)">
                  <i data-lucide="monitor" class="w-3.5 h-3.5"></i>
                  <span>[ 💻 Desktop ]</span>
                </button>
                <button type="button" id="btn-hero-preset-tablet" class="hero-preset-btn px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer" data-width="768" title="Preset Resolusi Layar Tablet (768px)">
                  <i data-lucide="tablet" class="w-3.5 h-3.5"></i>
                  <span>[ 📱 Tab ]</span>
                </button>
                <button type="button" id="btn-hero-preset-mobile" class="hero-preset-btn px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer" data-width="390" title="Preset Resolusi Layar Mobile (390px)">
                  <i data-lucide="smartphone" class="w-3.5 h-3.5"></i>
                  <span>[ 📲 Mobile ]</span>
                </button>
              </div>

              <!-- MANUAL RESIZE SLIDER & PX DISPLAY -->
              <div class="hidden sm:flex items-center gap-2 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                <input type="range" id="hero-preview-width-slider" min="360" max="1200" value="1200" step="5" class="w-20 lg:w-28 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-ew-resize accent-emerald-500" title="Geser untuk resize lebar preview secara dinamis" />
                <span id="hero-preview-width-display" class="font-mono text-[11px] font-black text-emerald-400 min-w-[45px] text-right">1200px</span>
              </div>
            </div>
          </div>

          <!-- Canvas Interactive Viewport Area -->
          <div class="flex-1 w-full overflow-y-auto overflow-x-hidden p-3 sm:p-5 flex justify-center items-start bg-slate-900/95">
            <div id="hero-preview-resizable-wrapper" class="preview-viewport-wrapper relative transition-[width] duration-150 ease-out flex justify-center w-full max-w-[1200px]">
              
              <!-- IFRAME ISOLASI (MEDIA QUERY & CSS LAYOUT 100% IDENTIK TANPA DISTORSI) -->
              <iframe id="hero-preview-iframe" class="w-full rounded-2xl shadow-2xl border border-slate-800 bg-white" scrolling="auto" style="min-height: 650px; height: 100%;"></iframe>

              <!-- MANUAL RESIZE HANDLE (DRAGGABLE SLIDER/HANDLE DI TEPI KANAN) -->
              <div id="hero-preview-drag-handle" class="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-14 bg-slate-800 hover:bg-emerald-600 border border-slate-600 hover:border-emerald-400 rounded-full flex-col items-center justify-center gap-1 cursor-ew-resize shadow-lg z-30 transition-colors group select-none" title="Tarik ke kiri/kanan untuk resize bebas">
                <span class="w-1 h-1 rounded-full bg-slate-400 group-hover:bg-white"></span>
                <span class="w-1 h-1 rounded-full bg-slate-400 group-hover:bg-white"></span>
                <span class="w-1 h-1 rounded-full bg-slate-400 group-hover:bg-white"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT INSPECTOR TOOLS PANEL (w-96 / 24rem) -->
        <div class="theme-studio-inspector-col flex flex-col h-full bg-white border-l border-slate-200" id="theme-inspector-container">
          
          <!-- Inspector Header -->
          <div class="p-4 border-b border-slate-200 bg-white shrink-0 flex items-center justify-between">
            <div>
              <h2 class="font-black text-sm text-slate-900 flex items-center gap-2">
                <i data-lucide="sliders" class="w-4 h-4 text-emerald-600"></i>
                <span>Inspektor Desain Toko</span>
              </h2>
              <p class="text-[11px] text-slate-400">Atur kustomisasi tema &amp; tampilan etalase toko</p>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
              Shopify Studio
            </span>
          </div>

          <!-- Inspector Scrollable Accordions Form -->
          <div class="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 scrollbar-thin">
            <form id="form-theme-branding" class="space-y-3" onsubmit="event.preventDefault();">
          
              <!-- ========================================================
                   ACCORDION 1: HEADER & TOP BAR
                   ======================================================== -->
              <div class="theme-accordion-item" data-accordion="header-topbar">
                <div class="theme-accordion-header is-open cursor-pointer select-none" data-target="body-header-topbar">
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">
                      1
                    </div>
                    <div>
                      <h4 class="font-bold text-xs text-slate-900">Header &amp; Top Bar</h4>
                      <p class="text-[10px] text-slate-400 font-normal">Identitas toko, navbar, logo, &amp; warna header</p>
                    </div>
                  </div>
                  <i class="bi bi-chevron-down theme-accordion-chevron text-xs text-slate-400"></i>
                </div>
                <div class="theme-accordion-body space-y-4" id="body-header-topbar">
                  
                  <!-- Identitas Toko & Logo -->
                  <div class="space-y-3">
                    <span class="block font-bold text-slate-800 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-100">
                      <i data-lucide="store" class="w-3.5 h-3.5 text-emerald-600"></i>
                      <span>Identitas &amp; Logo Toko:</span>
                    </span>

                    <div class="space-y-2.5">
                      <!-- Logo Utama -->
                      <div>
                        <label class="block font-bold text-slate-700 text-[11px] mb-1">Logo Utama Toko:</label>
                        <div class="w-full aspect-[4/2] rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-2 relative group overflow-hidden mb-1.5">
                          <img id="preview-store-logo-img" src="${settings.web_logo || 'assets/images/logo-songer-creative.png'}" class="max-h-16 w-auto object-contain transition duration-300 group-hover:scale-105" alt="Preview Logo" onerror="this.src='assets/images/logo-songer-creative.png'" />
                        </div>
                        <input type="text" id="store-logo-url-input" value="${escapeHtml(settings.web_logo || 'assets/images/logo-songer-creative.png')}" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-[10px] outline-none focus:border-emerald-500 mb-1" placeholder="Path logo atau URL gambar" />
                        <label class="w-full py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] cursor-pointer border border-slate-200 transition flex items-center justify-center gap-1">
                          <i data-lucide="upload" class="w-3 h-3"></i>
                          <span>Unggah Logo (Maks 500 KB)</span>
                          <input type="file" id="store-logo-file-input" accept="image/*" class="hidden" />
                        </label>
                      </div>

                      <!-- Icon Browser / Favicon -->
                      <div class="pt-2 border-t border-slate-100">
                        <label class="block font-bold text-slate-700 text-[11px] mb-1">Favicon Toko:</label>
                        <div class="flex items-center gap-2">
                          <div class="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 shrink-0">
                            <img id="preview-store-favicon-img" src="${settings.browser_icon || 'assets/images/favicon.png'}" class="w-full h-full object-contain" alt="Favicon" onerror="this.src='assets/images/favicon.png'" />
                          </div>
                          <div class="flex-1 space-y-1">
                            <input type="text" id="store-favicon-url-input" value="${escapeHtml(settings.browser_icon || 'assets/images/favicon.png')}" class="w-full px-2 py-1 rounded-lg border border-slate-300 font-mono text-[10px] outline-none focus:border-emerald-500" placeholder="Path favicon" />
                            <label class="py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[9px] cursor-pointer border border-slate-200 transition inline-flex items-center gap-1">
                              <i data-lucide="image" class="w-3 h-3"></i>
                              <span>Unggah Favicon</span>
                              <input type="file" id="store-favicon-file-input" accept="image/png, image/x-icon, image/webp" class="hidden" />
                            </label>
                          </div>
                        </div>
                      </div>

                      <!-- Nama Toko & Kontak -->
                      <div class="space-y-2 pt-2 border-t border-slate-100">
                        <div>
                          <label class="block font-bold text-slate-700 text-[11px] mb-0.5">Nama Toko / Brand <span class="text-red-500">*</span>:</label>
                          <input type="text" id="store-name-input" value="${escapeHtml(settings.store_name || currentTenant.store_name || 'Songer Creative')}" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-xs text-slate-900 outline-none focus:border-emerald-500" required />
                        </div>
                        <div>
                          <label class="block font-bold text-slate-700 text-[11px] mb-0.5">Slogan / Tagline Toko:</label>
                          <input type="text" id="store-tagline-input" value="${escapeHtml(settings.store_tagline || 'Digital Printing & Percetakan Terpadu')}" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 outline-none focus:border-emerald-500 font-medium text-xs" />
                        </div>
                        <div>
                          <label class="block font-bold text-slate-700 text-[11px] mb-0.5">WhatsApp CS:</label>
                          <input type="text" id="store-phone-input" value="${escapeHtml(settings.store_phone || '0888-5844-380')}" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono outline-none focus:border-emerald-500 text-xs font-semibold" />
                        </div>
                        <div>
                          <label class="block font-bold text-slate-700 text-[11px] mb-0.5">Alamat Workshop / Toko:</label>
                          <textarea id="store-address-input" rows="2" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 outline-none focus:border-emerald-500 text-xs leading-relaxed font-medium">${escapeHtml(settings.store_address || 'Jl. Raya Percetakan Kreatif No. 88, Kota Anda')}</textarea>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Format Tampilan Identitas Navbar Toko -->
                  <div class="space-y-2.5 pt-2 border-t border-slate-100">
                    <span class="block font-bold text-slate-800 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-100">
                      <i data-lucide="layout-template" class="w-3.5 h-3.5 text-emerald-600"></i>
                      <span>Format Identitas Navbar:</span>
                    </span>

                    <div class="grid grid-cols-1 gap-2">
                      <!-- [1] Logo Persegi -->
                      <label class="navbar-branding-choice-card p-2.5 rounded-xl border ${navbarBrandingMode === 'logo_square' ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex items-center justify-between" data-mode="logo_square">
                        <div class="flex items-center gap-2">
                          <input type="radio" name="navbar_branding_mode_radio" value="logo_square" ${navbarBrandingMode === 'logo_square' ? 'checked' : ''} class="text-emerald-600" />
                          <span class="font-bold text-slate-800 text-[11px]">1. Logo Persegi (1:1 Icon)</span>
                        </div>
                        <i data-lucide="square" class="w-4 h-4 text-slate-400"></i>
                      </label>

                      <!-- [2] Logo Landscape -->
                      <label class="navbar-branding-choice-card p-2.5 rounded-xl border ${navbarBrandingMode === 'logo_landscape' ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex items-center justify-between" data-mode="logo_landscape">
                        <div class="flex items-center gap-2">
                          <input type="radio" name="navbar_branding_mode_radio" value="logo_landscape" ${navbarBrandingMode === 'logo_landscape' ? 'checked' : ''} class="text-emerald-600" />
                          <span class="font-bold text-slate-800 text-[11px]">2. Logo Landscape (Memanjang)</span>
                        </div>
                        <i data-lucide="rectangle-horizontal" class="w-4 h-4 text-slate-400"></i>
                      </label>

                      <!-- [3] Hanya Teks -->
                      <label class="navbar-branding-choice-card p-2.5 rounded-xl border ${navbarBrandingMode === 'text_only' ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex items-center justify-between" data-mode="text_only">
                        <div class="flex items-center gap-2">
                          <input type="radio" name="navbar_branding_mode_radio" value="text_only" ${navbarBrandingMode === 'text_only' ? 'checked' : ''} class="text-emerald-600" />
                          <span class="font-bold text-slate-800 text-[11px]">3. Hanya Teks (Nama Toko &amp; Tagline)</span>
                        </div>
                        <i data-lucide="type" class="w-4 h-4 text-slate-400"></i>
                      </label>
                    </div>

                    <!-- Input Warna Kondisional (Jika Hanya Teks) -->
                    <div id="navbar-text-only-colors-container" class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 ${navbarBrandingMode === 'text_only' ? '' : 'hidden'}">
                      <div class="space-y-1">
                        <label class="block font-bold text-slate-700 text-[10px]">Warna Nama Toko:</label>
                        <div class="flex items-center gap-2">
                          <input type="color" id="ctrl-color-navbar-store-name" value="${navbarStoreNameColor}" class="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                          <input type="text" id="ctrl-hex-navbar-store-name" value="${navbarStoreNameColor}" maxlength="7" class="w-full px-2 py-1 rounded-lg border border-slate-300 font-mono text-[11px] uppercase outline-none focus:border-emerald-500" />
                        </div>
                      </div>
                      <div class="space-y-1">
                        <label class="block font-bold text-slate-700 text-[10px]">Warna Tagline Toko:</label>
                        <div class="flex items-center gap-2">
                          <input type="color" id="ctrl-color-navbar-tagline" value="${navbarTaglineColor}" class="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                          <input type="text" id="ctrl-hex-navbar-tagline" value="${navbarTaglineColor}" maxlength="7" class="w-full px-2 py-1 rounded-lg border border-slate-300 font-mono text-[11px] uppercase outline-none focus:border-emerald-500" />
                        </div>
                      </div>
                    </div>

                    <!-- Toggle Nama Toko di Desktop jika Logo Aktif -->
                    <div id="navbar-logo-desktop-name-toggle-container" class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 ${navbarBrandingMode === 'text_only' ? 'hidden' : ''}">
                      <div>
                        <span class="block font-bold text-slate-800 text-[11px]">Tampilkan Nama di Desktop:</span>
                        <p class="text-[10px] text-slate-400">Teks di samping logo layar PC</p>
                      </div>
                      <label class="relative inline-flex items-center cursor-pointer shrink-0">
                        <input type="checkbox" id="ctrl-toggle-show-header-store-name" ${settings.show_header_store_name !== false ? 'checked' : ''} class="sr-only peer" />
                        <div class="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  </div>

                  <!-- Warna Top Bar (Sapaan & Countdown) -->
                  <div class="space-y-2.5 pt-2 border-t border-slate-100">
                    <span class="block font-bold text-slate-800 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-100">
                      <i data-lucide="stopwatch" class="w-3.5 h-3.5 text-emerald-600"></i>
                      <span>Top Bar &amp; Sapaan:</span>
                    </span>

                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <div class="space-y-1">
                        <label class="block font-bold text-slate-700 text-[10px]">Warna Latar Top Bar:</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="ctrl-color-top-bar-bg" value="${topBarBgColor}" class="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                          <input type="text" id="ctrl-hex-top-bar-bg" value="${topBarBgColor}" maxlength="7" class="w-full px-2 py-1 rounded-lg border border-slate-300 font-mono text-[10px] uppercase font-bold" />
                        </div>
                      </div>
                      <div class="space-y-1">
                        <label class="block font-bold text-slate-700 text-[10px]">Warna Teks Top Bar:</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="ctrl-color-top-bar-text" value="${topBarTextColor}" class="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                          <input type="text" id="ctrl-hex-top-bar-text" value="${topBarTextColor}" maxlength="7" class="w-full px-2 py-1 rounded-lg border border-slate-300 font-mono text-[10px] uppercase font-bold" />
                        </div>
                      </div>
                    </div>

                    <!-- Switch Sapaan Personal Pelanggan -->
                    <div class="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs flex items-center justify-between gap-2">
                      <div class="space-y-0.5">
                        <span class="font-bold text-emerald-950 text-[11px] block">Sapaan Personal Pelanggan</span>
                        <p class="text-[10px] text-emerald-800">Sapaan hangat pelanggan lama</p>
                      </div>
                      <label class="relative inline-flex items-center cursor-pointer shrink-0">
                        <input type="checkbox" id="ctrl-toggle-greeting" ${settings.enable_customer_greeting !== false ? 'checked' : ''} class="sr-only peer" />
                        <div class="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  </div>

                  <!-- Warna Latar & Teks Navbar Toko -->
                  <div class="space-y-2.5 pt-2 border-t border-slate-100">
                    <span class="block font-bold text-slate-800 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-100">
                      <i data-lucide="palette" class="w-3.5 h-3.5 text-emerald-600"></i>
                      <span>Warna Bar Navigasi (Navbar):</span>
                    </span>

                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <div class="space-y-1">
                        <label class="block font-bold text-slate-700 text-[10px]">Warna Latar Navbar:</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="ctrl-color-navbar-bg" value="${navbarBgColor}" class="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                          <input type="text" id="ctrl-hex-navbar-bg" value="${navbarBgColor}" maxlength="7" class="w-full px-2 py-1 rounded-lg border border-slate-300 font-mono text-[10px] uppercase font-bold" />
                        </div>
                      </div>
                      <div class="space-y-1">
                        <label class="block font-bold text-slate-700 text-[10px]">Warna Teks &amp; Ikon Navbar:</label>
                        <div class="flex items-center gap-1.5">
                          <input type="color" id="ctrl-color-navbar-text" value="${navbarTextColor}" class="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                          <input type="text" id="ctrl-hex-navbar-text" value="${navbarTextColor}" maxlength="7" class="w-full px-2 py-1 rounded-lg border border-slate-300 font-mono text-[10px] uppercase font-bold" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Kustomisasi Warna Elemen Navbar (Cart, Badge, Search, Login) -->
                  <div class="space-y-2.5 pt-2 border-t border-slate-100">
                    <span class="block font-bold text-slate-800 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-100">
                      <i data-lucide="sliders-horizontal" class="w-3.5 h-3.5 text-emerald-600"></i>
                      <span>Warna Elemen Spesifik Navbar:</span>
                    </span>

                    <!-- Cart & Badge -->
                    <div class="grid grid-cols-3 gap-2">
                      <div class="space-y-1">
                        <label class="block text-[9px] font-bold text-slate-600 truncate">Ikon Cart:</label>
                        <div class="flex items-center gap-1">
                          <input type="color" id="ctrl-color-navbar-cart-icon" value="${navbarCartIconColor}" class="w-6 h-6 rounded border cursor-pointer p-0 shrink-0" />
                          <input type="text" id="ctrl-hex-navbar-cart-icon" value="${navbarCartIconColor}" maxlength="7" class="w-full px-1 py-0.5 rounded border text-[9px] font-mono uppercase" />
                        </div>
                      </div>
                      <div class="space-y-1">
                        <label class="block text-[9px] font-bold text-slate-600 truncate">Badge BG:</label>
                        <div class="flex items-center gap-1">
                          <input type="color" id="ctrl-color-navbar-cart-badge-bg" value="${navbarCartBadgeBg}" class="w-6 h-6 rounded border cursor-pointer p-0 shrink-0" />
                          <input type="text" id="ctrl-hex-navbar-cart-badge-bg" value="${navbarCartBadgeBg}" maxlength="7" class="w-full px-1 py-0.5 rounded border text-[9px] font-mono uppercase" />
                        </div>
                      </div>
                      <div class="space-y-1">
                        <label class="block text-[9px] font-bold text-slate-600 truncate">Badge Teks:</label>
                        <div class="flex items-center gap-1">
                          <input type="color" id="ctrl-color-navbar-cart-badge-text" value="${navbarCartBadgeText}" class="w-6 h-6 rounded border cursor-pointer p-0 shrink-0" />
                          <input type="text" id="ctrl-hex-navbar-cart-badge-text" value="${navbarCartBadgeText}" maxlength="7" class="w-full px-1 py-0.5 rounded border text-[9px] font-mono uppercase" />
                        </div>
                      </div>
                    </div>

                    <!-- Search Input & Border -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div class="space-y-1">
                        <label class="block text-[9px] font-bold text-slate-600 truncate">Ikon Cari:</label>
                        <div class="flex items-center gap-1">
                          <input type="color" id="ctrl-color-navbar-search-icon" value="${navbarSearchIconColor}" class="w-6 h-6 rounded border cursor-pointer p-0 shrink-0" />
                          <input type="text" id="ctrl-hex-navbar-search-icon" value="${navbarSearchIconColor}" maxlength="7" class="w-full px-1 py-0.5 rounded border text-[9px] font-mono uppercase" />
                        </div>
                      </div>
                      <div class="space-y-1">
                        <label class="block text-[9px] font-bold text-slate-600 truncate">Cari BG:</label>
                        <div class="flex items-center gap-1">
                          <input type="color" id="ctrl-color-navbar-search-input-bg" value="${navbarSearchInputBg}" class="w-6 h-6 rounded border cursor-pointer p-0 shrink-0" />
                          <input type="text" id="ctrl-hex-navbar-search-input-bg" value="${navbarSearchInputBg}" maxlength="7" class="w-full px-1 py-0.5 rounded border text-[9px] font-mono uppercase" />
                        </div>
                      </div>
                      <div class="space-y-1">
                        <label class="block text-[9px] font-bold text-slate-600 truncate">Border Cari:</label>
                        <div class="flex items-center gap-1">
                          <input type="color" id="ctrl-color-navbar-search-border" value="${navbarSearchBorderColor}" class="w-6 h-6 rounded border cursor-pointer p-0 shrink-0" />
                          <input type="text" id="ctrl-hex-navbar-search-border" value="${navbarSearchBorderColor}" maxlength="7" class="w-full px-1 py-0.5 rounded border text-[9px] font-mono uppercase" />
                        </div>
                      </div>
                      <div class="space-y-1">
                        <label class="block text-[9px] font-bold text-slate-600 truncate">Placeholder:</label>
                        <div class="flex items-center gap-1">
                          <input type="color" id="ctrl-color-navbar-search-placeholder" value="${navbarSearchPlaceholderColor}" class="w-6 h-6 rounded border cursor-pointer p-0 shrink-0" />
                          <input type="text" id="ctrl-hex-navbar-search-placeholder" value="${navbarSearchPlaceholderColor}" maxlength="7" class="w-full px-1 py-0.5 rounded border text-[9px] font-mono uppercase" />
                        </div>
                      </div>
                    </div>

                    <!-- Login -->
                    <div class="grid grid-cols-2 gap-2 pt-1">
                      <div class="space-y-1">
                        <label class="block text-[9px] font-bold text-slate-600 truncate">Ikon Login:</label>
                        <div class="flex items-center gap-1">
                          <input type="color" id="ctrl-color-navbar-login-icon" value="${navbarLoginIconColor}" class="w-6 h-6 rounded border cursor-pointer p-0 shrink-0" />
                          <input type="text" id="ctrl-hex-navbar-login-icon" value="${navbarLoginIconColor}" maxlength="7" class="w-full px-1 py-0.5 rounded border text-[9px] font-mono uppercase" />
                        </div>
                      </div>
                      <div class="space-y-1">
                        <label class="block text-[9px] font-bold text-slate-600 truncate">Teks Login:</label>
                        <div class="flex items-center gap-1">
                          <input type="color" id="ctrl-color-navbar-login-text" value="${navbarLoginTextColor}" class="w-6 h-6 rounded border cursor-pointer p-0 shrink-0" />
                          <input type="text" id="ctrl-hex-navbar-login-text" value="${navbarLoginTextColor}" maxlength="7" class="w-full px-1 py-0.5 rounded border text-[9px] font-mono uppercase" />
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              </div>

              <!-- ========================================================
                   ACCORDION 2: HERO BANNER
                   ======================================================== -->
              <div class="theme-accordion-item" data-accordion="hero-banner">
                <div class="theme-accordion-header cursor-pointer select-none" data-target="body-hero-banner">
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">
                      2
                    </div>
                    <div>
                      <h4 class="font-bold text-xs text-slate-900">Hero Banner</h4>
                      <p class="text-[10px] text-slate-400 font-normal">Model banner, slider, rasio &amp; upload gambar</p>
                    </div>
                  </div>
                  <i class="bi bi-chevron-down theme-accordion-chevron text-xs text-slate-400"></i>
                </div>
                <div class="theme-accordion-body is-collapsed space-y-3.5" id="body-hero-banner">
                  <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span class="block font-bold text-slate-800 text-xs">Hero Banner Toggle</span>
                      <p class="text-[10px] text-slate-400">Aktifkan atau sembunyikan banner di etalase</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" id="hero-enable-toggle" class="sr-only peer" ${heroEnabled ? 'checked' : ''} />
                      <div class="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <!-- CONTAINER KONFIGURASI HERO BANNER -->
                  <div id="hero-configuration-body" class="${heroEnabled ? 'space-y-4' : 'hidden space-y-4'}">

            <!-- PILIHAN UTAMA: 3 MODEL HERO BANNER SESUAI SPESIFIKASI -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              
              <!-- [1] Mode Normal / Non-Split (Gambar Penuh) -->
              <label class="hero-model-card p-4 rounded-2xl border ${(heroModel === 'non_split' || heroModel === 'model_2' || (!heroModel && heroModel !== 'split' && heroModel !== 'model_1')) ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition space-y-2 block" data-model="non_split">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-900 flex items-center gap-2">
                    <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">1</span>
                    Mode Normal (Gambar Penuh)
                  </span>
                  <input type="radio" name="hero_model_radio" value="non_split" ${(heroModel === 'non_split' || heroModel === 'model_2' || (!heroModel && heroModel !== 'split' && heroModel !== 'model_1')) ? 'checked' : ''} class="text-emerald-600" />
                </div>
                <p class="text-slate-500 text-[11px] leading-relaxed">
                  Gambar banner memenuhi kontainer secara penuh (Desktop 9:2 / 4.5:1 &amp; Mobile 16:5 / 3.2:1).
                </p>
              </label>

              <!-- [2] Mode Split (Teks Kiri 40% + Wadah Gambar Kanan 60%) -->
              <label class="hero-model-card p-4 rounded-2xl border ${(heroModel === 'split' || heroModel === 'model_4') ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition space-y-2 block" data-model="split">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-900 flex items-center gap-2">
                    <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">2</span>
                    Mode Split (Teks &amp; Gambar)
                  </span>
                  <input type="radio" name="hero_model_radio" value="split" ${(heroModel === 'split' || heroModel === 'model_4') ? 'checked' : ''} class="text-emerald-600" />
                </div>
                <p class="text-slate-500 text-[11px] leading-relaxed">
                  Desktop: Teks 40% di kiri dan Gambar 60% di kanan. Mobile: susunan fleksibel atas/bawah.
                </p>
              </label>

              <!-- [3] Mode Hanya Teks (Text-Only) -->
              <label class="hero-model-card p-4 rounded-2xl border ${(heroModel === 'model_1') ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition space-y-2 block" data-model="model_1">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-900 flex items-center gap-2">
                    <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">3</span>
                    Mode Hanya Teks (Text-Only)
                  </span>
                  <input type="radio" name="hero_model_radio" value="model_1" ${(heroModel === 'model_1') ? 'checked' : ''} class="text-emerald-600" />
                </div>
                <p class="text-slate-500 text-[11px] leading-relaxed">
                  Kartu headline promo elegan tanpa gambar. Warna solid / gradien, sudut &amp; bayangan dapat diatur.
                </p>
              </label>

            </div>

            <!-- PENGATURAN TATA LETAK HERO SPLIT DI MOBILE (< 768px) -->
            <div id="hero-split-mobile-layout-section" class="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 ${(heroModel === 'split' || heroModel === 'model_4') ? '' : 'hidden'}">
              <div class="flex items-center gap-2">
                <i data-lucide="smartphone" class="w-4 h-4 text-emerald-600"></i>
                <h4 class="font-extrabold text-xs sm:text-sm text-slate-900">Tata Letak Hero Split di Layar Ponsel / Mobile (&lt; 768px):</h4>
              </div>
              <p class="text-[11px] text-slate-500">Pilih susunan vertikal kolom pada smartphone agar tampilan etalase proporsional dan mudah dibaca:</p>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <!-- Opsi 1: Gambar di Atas Teks (flex flex-col) -->
                <label class="hero-split-mobile-choice-card p-3.5 rounded-xl border ${heroSplitMobile === 'image_top' ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex flex-col gap-1.5" data-split-mobile="image_top">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">1</span>
                      <span>Gambar di Atas Teks (flex flex-col)</span>
                    </span>
                    <input type="radio" name="hero_split_mobile_radio" value="image_top" ${heroSplitMobile === 'image_top' ? 'checked' : ''} class="text-emerald-600" />
                  </div>
                  <p class="text-slate-500 text-[11px] leading-relaxed">
                    Gambar tampil di bagian atas memenuhi lebar layar secara proporsional, diikuti teks judul &amp; deskripsi di bawahnya.
                  </p>
                </label>

                <!-- Opsi 2: Gambar di Bawah Teks (flex flex-col-reverse) -->
                <label class="hero-split-mobile-choice-card p-3.5 rounded-xl border ${heroSplitMobile === 'image_bottom' ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex flex-col gap-1.5" data-split-mobile="image_bottom">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">2</span>
                      <span>Gambar di Bawah Teks (flex flex-col-reverse)</span>
                    </span>
                    <input type="radio" name="hero_split_mobile_radio" value="image_bottom" ${heroSplitMobile === 'image_bottom' ? 'checked' : ''} class="text-emerald-600" />
                  </div>
                  <p class="text-slate-500 text-[11px] leading-relaxed">
                    Teks judul promosi &amp; deskripsi tampil lebih dulu di atas, lalu kotak gambar membentang di bagian bawahnya.
                  </p>
                </label>
              </div>
            </div>

            <!-- PENGATURAN POSISI HERO SPLIT DI DESKTOP (>= 768px) -->
            <div id="hero-split-desktop-layout-section" class="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 ${(heroModel === 'split' || heroModel === 'model_4') ? '' : 'hidden'}">
              <div class="flex items-center gap-2">
                <i data-lucide="monitor" class="w-4 h-4 text-emerald-600"></i>
                <h4 class="font-extrabold text-xs sm:text-sm text-slate-900">Posisi Hero Split di Layar Desktop (≥ 768px):</h4>
              </div>
              <p class="text-[11px] text-slate-500">Teks 40% dan Gambar 60%, tentukan posisi tata letak horizontal di layar desktop:</p>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <!-- Opsi 1: Teks di Kiri (40%) & Gambar di Kanan (60%) -->
                <label class="hero-split-desktop-choice-card p-3.5 rounded-xl border ${heroSplitDesktopPos === 'text_left' ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex flex-col gap-1.5" data-split-desktop="text_left">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">1</span>
                      <span>Teks di Kiri (40%) &amp; Gambar di Kanan (60%)</span>
                    </span>
                    <input type="radio" name="hero_split_desktop_pos_radio" value="text_left" ${heroSplitDesktopPos === 'text_left' ? 'checked' : ''} class="text-emerald-600" />
                  </div>
                  <p class="text-slate-500 text-[11px] leading-relaxed">
                    Kolom teks judul promosi berada di sebelah kiri dan wadah slider gambar membentang di sebelah kanan.
                  </p>
                </label>

                <!-- Opsi 2: Gambar di Kiri (60%) & Teks di Kanan (40%) -->
                <label class="hero-split-desktop-choice-card p-3.5 rounded-xl border ${heroSplitDesktopPos === 'image_left' ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex flex-col gap-1.5" data-split-desktop="image_left">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">2</span>
                      <span>Gambar di Kiri (60%) &amp; Teks di Kanan (40%)</span>
                    </span>
                    <input type="radio" name="hero_split_desktop_pos_radio" value="image_left" ${heroSplitDesktopPos === 'image_left' ? 'checked' : ''} class="text-emerald-600" />
                  </div>
                  <p class="text-slate-500 text-[11px] leading-relaxed">
                    Wadah slider gambar berada di sebelah kiri dan kolom teks judul promosi berada di sebelah kanan.
                  </p>
                </label>
              </div>
            </div>

            <!-- PANEL KUSTOMISASI LATAR BELAKANG KARTU (Mode Hanya Teks & Split) -->
            <div id="hero-text-background-section" class="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 ${(heroModel === 'model_1' || heroModel === 'split' || heroModel === 'model_4') ? '' : 'hidden'}">
              <div class="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm">
                <i data-lucide="paint-bucket" class="w-4 h-4 text-emerald-600"></i>
                <span>Warna Latar Kartu Hero (Mode Teks &amp; Split)</span>
              </div>
              <p class="text-[11px] text-slate-500">Pilih warna solid atau kombinasi gradien untuk kartu teks promosi etalase toko:</p>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <!-- Tipe Background -->
                <div class="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                  <label class="block font-bold text-slate-700">Tipe Latar Belakang:</label>
                  <select id="hero-bg-type-select" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold outline-none focus:border-emerald-500 bg-white text-xs">
                    <option value="solid" ${heroBgType === 'solid' ? 'selected' : ''}>Warna Solid Tunggal</option>
                    <option value="linear_gradient" ${heroBgType === 'linear_gradient' ? 'selected' : ''}>Gradien Linear (Linear)</option>
                    <option value="radial_gradient" ${heroBgType === 'radial_gradient' ? 'selected' : ''}>Gradien Radial (Radial)</option>
                  </select>
                </div>

                <!-- Warna 1 -->
                <div class="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                  <label class="block font-bold text-slate-700">Warna Utama (Warna 1):</label>
                  <div class="flex items-center gap-2">
                    <input type="color" id="hero-bg-color1-picker" value="${heroBgColor1}" class="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                    <input type="text" id="hero-bg-color1-hex" value="${heroBgColor1}" maxlength="7" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs uppercase" />
                  </div>
                </div>

                <!-- Warna 2 (Untuk Gradien) -->
                <div id="hero-gradient-extra-col" class="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-2xs ${heroBgType === 'solid' ? 'hidden' : ''}">
                  <label class="block font-bold text-slate-700">Warna Kedua &amp; Sudut:</label>
                  <div class="flex items-center gap-2">
                    <input type="color" id="hero-bg-color2-picker" value="${heroBgColor2}" class="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                    <input type="text" id="hero-bg-color2-hex" value="${heroBgColor2}" maxlength="7" class="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs uppercase" />
                    <input type="number" id="hero-bg-angle-input" min="0" max="360" value="${heroBgAngle}" class="w-14 px-1.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs text-right font-bold" title="Sudut Gradien (°)" />
                    <span class="text-slate-400 font-mono text-xs">°</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- STANDARISASI ASPEK RASIO BANNER HERO -->
            <div id="hero-mobile-ratio-section" class="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 ${heroModel === 'model_1' ? 'hidden' : ''}">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i data-lucide="scan-line" class="w-4 h-4 text-emerald-600"></i>
                  <h4 class="font-extrabold text-xs sm:text-sm text-slate-900">Standarisasi Aspek Rasio Hero Banner:</h4>
                </div>
                <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Terkunci Standar Resmi
                </span>
              </div>
              <p class="text-[11px] text-slate-500">Rasio aspek hero banner telah distandarisasi secara responsif untuk kenyamanan visual etalase toko:</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div class="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5 shadow-2xs">
                  <i data-lucide="monitor" class="w-4 h-4 text-blue-600 shrink-0"></i>
                  <div>
                    <span class="font-bold text-slate-800 block text-xs">Desktop: 9 : 2 (4.5 : 1)</span>
                    <span class="text-[10px] text-slate-400">aspect-[9/2] w-full object-cover</span>
                  </div>
                </div>
                <div class="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5 shadow-2xs">
                  <i data-lucide="smartphone" class="w-4 h-4 text-emerald-600 shrink-0"></i>
                  <div>
                    <span class="font-bold text-slate-800 block text-xs">Mobile: 16 : 5 (3.2 : 1)</span>
                    <span class="text-[10px] text-slate-400">aspect-[16/5] w-full object-cover</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- PILIHAN VARIAN LEBAR LAYOUT HERO -->
            <div id="hero-layout-width-section" class="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 ${(heroModel === 'split' || heroModel === 'model_4' || heroModel === 'model_1') ? 'hidden' : ''}">
              <div class="flex items-center gap-2">
                <i data-lucide="layout" class="w-4 h-4 text-emerald-600"></i>
                <h4 class="font-extrabold text-xs sm:text-sm text-slate-900">Pilih Varian Lebar Layout Hero:</h4>
              </div>
              <p class="text-[11px] text-slate-500">Tentukan format lebar kontainer hero banner toko:</p>
              
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
                    Banner membentang penuh ujung ke ujung tanpa batas margin (Edge-to-Edge). Sudut lengkung &amp; bayangan otomatis dinonaktifkan.
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
                    Banner berada di dalam kotak kontainer standar toko dengan kustomisasi sudut lengkung (0-32px) dan efek bayangan.
                  </p>
                </label>
              </div>
            </div>

            <!-- PANEL 1: KUSTOMISASI KONTAINER HERO (Khusus Varian Boxed / Standar & Mode Teks) -->
            <div id="hero-container-customization-section" class="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 ${(heroWidthLayout === 'full' && (heroModel === 'non_split' || heroModel === 'model_2')) ? 'hidden' : ''}">
              <div class="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm">
                <i data-lucide="square" class="w-4 h-4 text-emerald-600"></i>
                <span>1. Kontainer &amp; Sudut Hero (Border Radius &amp; Shadow)</span>
              </div>
              <p class="text-[11px] text-slate-500">Atur kelengkungan sudut kontainer (0–32px) dan efek bayangan luar untuk varian standar atau mode teks:</p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <!-- Sudut Lengkung Kontainer (0px - 32px) -->
                <div class="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
                  <div class="flex items-center justify-between">
                    <label class="font-bold text-slate-800">Sudut Lengkung Kontainer:</label>
                    <div class="flex items-center gap-1">
                      <input type="number" id="hero-container-radius-number" min="0" max="32" value="${heroContainerRadiusNum}" class="w-14 px-2 py-1 rounded-lg border border-slate-300 font-mono text-xs font-bold text-right" />
                      <span class="text-slate-400 font-mono text-xs">px</span>
                    </div>
                  </div>
                  <input type="range" id="hero-container-radius-slider" min="0" max="32" value="${heroContainerRadiusNum}" class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                  <!-- Preset Tombol Cepat: 0px, 8px, 16px, 24px, 32px -->
                  <div class="flex flex-wrap items-center gap-1.5 pt-1">
                    <span class="text-[10px] text-slate-400 font-semibold mr-1">Preset:</span>
                    <button type="button" class="hero-container-radius-preset px-2 py-0.5 rounded-lg text-[10px] font-bold ${heroContainerRadiusNum === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} transition cursor-pointer" data-radius="0">0px (Siku)</button>
                    <button type="button" class="hero-container-radius-preset px-2 py-0.5 rounded-lg text-[10px] font-bold ${heroContainerRadiusNum === 8 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} transition cursor-pointer" data-radius="8">8px (Kecil)</button>
                    <button type="button" class="hero-container-radius-preset px-2 py-0.5 rounded-lg text-[10px] font-bold ${heroContainerRadiusNum === 16 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} transition cursor-pointer" data-radius="16">16px (Standar)</button>
                    <button type="button" class="hero-container-radius-preset px-2 py-0.5 rounded-lg text-[10px] font-bold ${heroContainerRadiusNum === 24 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} transition cursor-pointer" data-radius="24">24px (Bulat)</button>
                    <button type="button" class="hero-container-radius-preset px-2 py-0.5 rounded-lg text-[10px] font-bold ${heroContainerRadiusNum === 32 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} transition cursor-pointer" data-radius="32">32px (Maks)</button>
                  </div>
                </div>

                <!-- Efek Bayangan Kontainer -->
                <div class="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
                  <label class="font-bold text-slate-800 block">Efek Bayangan Kontainer (Shadow):</label>
                  <select id="hero-container-shadow-select" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold outline-none focus:border-emerald-500 bg-white text-xs">
                    <option value="none" ${heroContainerShadow === 'none' ? 'selected' : ''}>none (Tanpa Bayangan)</option>
                    <option value="sm" ${heroContainerShadow === 'sm' ? 'selected' : ''}>sm (Tipis / Halus)</option>
                    <option value="md" ${heroContainerShadow === 'md' ? 'selected' : ''}>md (Sedang - Rekomendasi)</option>
                    <option value="lg" ${heroContainerShadow === 'lg' ? 'selected' : ''}>lg (Tebal Elegan)</option>
                    <option value="xl" ${heroContainerShadow === 'xl' ? 'selected' : ''}>xl (Maksimal Melayang)</option>
                  </select>
                  <p class="text-[10px] text-slate-400">Pilihan efek bayangan preset untuk elevasi visual kartu hero etalase.</p>
                </div>
              </div>
            </div>

            <!-- PANEL 2: TIPOGRAFI & TEKS HERO (Mode Split & Text-Only) -->
            <div id="hero-typography-section" class="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 ${(heroModel === 'non_split' || heroModel === 'model_2') ? 'hidden' : ''}">
              <div class="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm">
                <i data-lucide="type" class="w-4 h-4 text-emerald-600"></i>
                <span>2. Tipografi &amp; Teks Hero (Mode Split &amp; Text-Only)</span>
              </div>
              <p class="text-[11px] text-slate-500">Sesuaikan kalimat promosi dan warna teks judul headline serta deskripsi hero:</p>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div class="space-y-1.5 p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <label class="block font-bold text-slate-700">Judul Headline Toko:</label>
                  <input type="text" id="hero-headline-input" value="${escapeHtml(settings.hero_headline || 'Cetak Banner, Desain & Souvenir Harga Instan')}" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold outline-none focus:border-emerald-500" placeholder="Judul headline promo..." />
                  <div class="pt-2 flex items-center justify-between">
                    <span class="text-[11px] font-bold text-slate-600">Warna Teks Judul (Headline):</span>
                    <div class="flex items-center gap-2">
                      <input type="color" id="hero-title-color-picker" value="${heroTitleColor}" class="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                      <input type="text" id="hero-title-color-hex" value="${heroTitleColor}" maxlength="7" class="w-20 px-2 py-1 rounded-lg border border-slate-300 font-mono text-xs uppercase" />
                    </div>
                  </div>
                </div>

                <div class="space-y-1.5 p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <label class="block font-bold text-slate-700">Deskripsi / Slogan Percetakan:</label>
                  <textarea id="hero-subheadline-input" rows="2" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium outline-none focus:border-emerald-500 text-xs leading-relaxed" placeholder="Deskripsi ringkas keunggulan toko...">${escapeHtml(settings.hero_subheadline || 'Katalog terpadu dengan kalkulator instan: spesifikasi kustom meteran, jasa desain original, hingga souvenir retail siap kirim ke seluruh Indonesia.')}</textarea>
                  <div class="pt-2 flex items-center justify-between">
                    <span class="text-[11px] font-bold text-slate-600">Warna Teks Deskripsi:</span>
                    <div class="flex items-center gap-2">
                      <input type="color" id="hero-desc-color-picker" value="${heroDescColor}" class="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                      <input type="text" id="hero-desc-color-hex" value="${heroDescColor}" maxlength="7" class="w-20 px-2 py-1 rounded-lg border border-slate-300 font-mono text-xs uppercase" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- PANEL 3: KOTAK GAMBAR HERO (Khusus Mode Split) -->
            <div id="hero-split-image-section" class="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 ${(heroModel === 'split' || heroModel === 'model_4') ? '' : 'hidden'}">
              <div class="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm">
                <i data-lucide="image" class="w-4 h-4 text-emerald-600"></i>
                <span>3. Kotak Gambar Hero (Mode Split)</span>
              </div>
              <p class="text-[11px] text-slate-500">Wadah gambar terisolasi di sisi kanan (~60% lebar desktop). Gambar banner utama otomatis dipotong rapi secara seimbang di sisi kiri dan kanan (cover &amp; center).</p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <!-- Sudut Lengkung Gambar (0px - 24px) -->
                <div class="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
                  <div class="flex items-center justify-between">
                    <label class="font-bold text-slate-800">Sudut Lengkung Gambar:</label>
                    <div class="flex items-center gap-1">
                      <input type="number" id="hero-image-radius-number" min="0" max="24" value="${heroImageRadiusNum}" class="w-14 px-2 py-1 rounded-lg border border-slate-300 font-mono text-xs font-bold text-right" />
                      <span class="text-slate-400 font-mono text-xs">px</span>
                    </div>
                  </div>
                  <input type="range" id="hero-image-radius-slider" min="0" max="24" value="${heroImageRadiusNum}" class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                  <div class="flex flex-wrap items-center gap-1.5 pt-1">
                    <span class="text-[10px] text-slate-400 font-semibold mr-1">Preset:</span>
                    <button type="button" class="hero-image-radius-preset px-2 py-0.5 rounded-lg text-[10px] font-bold ${heroImageRadiusNum === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} transition cursor-pointer" data-radius="0">0px</button>
                    <button type="button" class="hero-image-radius-preset px-2 py-0.5 rounded-lg text-[10px] font-bold ${heroImageRadiusNum === 6 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} transition cursor-pointer" data-radius="6">6px</button>
                    <button type="button" class="hero-image-radius-preset px-2 py-0.5 rounded-lg text-[10px] font-bold ${heroImageRadiusNum === 12 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} transition cursor-pointer" data-radius="12">12px (Standar)</button>
                    <button type="button" class="hero-image-radius-preset px-2 py-0.5 rounded-lg text-[10px] font-bold ${heroImageRadiusNum === 18 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} transition cursor-pointer" data-radius="18">18px</button>
                    <button type="button" class="hero-image-radius-preset px-2 py-0.5 rounded-lg text-[10px] font-bold ${heroImageRadiusNum === 24 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} transition cursor-pointer" data-radius="24">24px</button>
                  </div>
                </div>

                <!-- Efek Bayangan Gambar -->
                <div class="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
                  <label class="font-bold text-slate-800 block">Efek Bayangan Gambar (Shadow):</label>
                  <select id="hero-image-shadow-select" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold outline-none focus:border-emerald-500 bg-white text-xs">
                    <option value="none" ${heroImageShadow === 'none' ? 'selected' : ''}>none (Tanpa Bayangan)</option>
                    <option value="sm" ${heroImageShadow === 'sm' ? 'selected' : ''}>sm (Tipis / Halus)</option>
                    <option value="md" ${heroImageShadow === 'md' ? 'selected' : ''}>md (Sedang - Rekomendasi)</option>
                    <option value="lg" ${heroImageShadow === 'lg' ? 'selected' : ''}>lg (Tebal Menonjol)</option>
                  </select>
                  <p class="text-[10px] text-slate-400">Efek bayangan memberikan isolasi visual pada kotak gambar split.</p>
                </div>
              </div>
            </div>

            <!-- PANEL 4: NAVIGASI INDIKATOR TITIK (DOTS) & SLIDER BANNER -->
            <div id="hero-banner-controls-section" class="space-y-4 pt-4 border-t border-slate-100 text-xs ${heroModel === 'model_1' ? 'hidden' : ''}">
              <div class="flex items-center gap-2 text-slate-700 font-bold">
                <i data-lucide="images" class="w-4 h-4 text-emerald-600"></i>
                <span>4. Navigasi Indikator Titik (Dots) &amp; Slider Multi-Gambar</span>
              </div>

              <!-- Pemilih Warna Dot Aktif & Inaktif -->
              <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span class="font-bold text-slate-800 block text-xs">Navigasi Indikator Titik (Dots):</span>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                    <div>
                      <span class="font-bold text-slate-700 block text-xs">Warna Dot Aktif:</span>
                      <span class="text-[10px] text-slate-400">Slide yang sedang aktif</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <input type="color" id="hero-dots-active-picker" value="${heroDotsActiveColor}" class="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                      <input type="text" id="hero-dots-active-hex" value="${heroDotsActiveColor}" maxlength="7" class="w-20 px-2 py-1 rounded-lg border border-slate-300 font-mono text-xs uppercase" />
                    </div>
                  </div>

                  <div class="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                    <div>
                      <span class="font-bold text-slate-700 block text-xs">Warna Dot Tidak Aktif:</span>
                      <span class="text-[10px] text-slate-400">Slide lainnya yang tidak aktif</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <input type="color" id="hero-dots-inactive-picker" value="${heroDotsInactiveColor}" class="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                      <input type="text" id="hero-dots-inactive-hex" value="${heroDotsInactiveColor}" maxlength="7" class="w-20 px-2 py-1 rounded-lg border border-slate-300 font-mono text-xs uppercase" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- DROPDOWN ANIMASI SLIDER -->
              <div id="hero-animation-dropdown-container" class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 transition">
                <label class="block font-bold text-slate-800">Pilihan Animasi / Transisi Slider:</label>
                <select id="hero-slider-animation-select" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold outline-none focus:border-emerald-500 bg-white">
                  <option value="slide_5s" ${heroAnimation === 'slide_5s' ? 'selected' : ''}>Slide Otomatis 5s (Transisi Geser Halus) - [Default]</option>
                  <option value="slide_3s" ${heroAnimation === 'slide_3s' ? 'selected' : ''}>Slide Otomatis 3s (Transisi Geser Cepat)</option>
                  <option value="fade_5s" ${heroAnimation === 'fade_5s' ? 'selected' : ''}>Fade Otomatis 5s (Transisi Memudar Halus)</option>
                  <option value="fade_3s" ${heroAnimation === 'fade_3s' ? 'selected' : ''}>Fade Otomatis 3s (Transisi Memudar Cepat)</option>
                  <option value="manual" ${heroAnimation === 'manual' ? 'selected' : ''}>Geser Manual (Navigasi Tombol Panah &amp; Gesture Saja)</option>
                </select>

                <div id="hero-show-arrows-toggle-container" class="pt-2 border-t border-slate-200/80 space-y-3">
                  <div id="hero-show-arrows-toggle-row" class="flex items-center justify-between ${heroAnimation === 'manual' ? 'hidden' : ''}">
                    <div class="space-y-0.5">
                      <span class="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                        <i data-lucide="chevron-left-right" class="w-3.5 h-3.5 text-emerald-600"></i>
                        <span>Dapat Di Geser Manual</span>
                      </span>
                      <p class="text-[10px] text-slate-500">Di desktop memunculkan tombol navigasi panah (&lt; / &gt;), di mobile otomatis dapat digeser swipe sentuh.</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" id="hero-show-arrows-toggle" ${heroShowArrows ? 'checked' : ''} class="sr-only peer" />
                      <div class="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <!-- Sub-panel Kustomisasi Tombol Panah (tampil jika toggle aktif atau mode manual) -->
                  <div id="hero-arrows-customization-panel" class="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3 shadow-2xs ${(heroShowArrows || heroAnimation === 'manual') ? '' : 'hidden'}">
                    <span class="font-bold text-slate-800 block text-xs">Kustomisasi Tampilan Tombol Panah:</span>

                    <!-- Pilihan Visibilitas Panah Desktop (Hover vs Selalu Tampil) -->
                    <div id="hero-arrows-visibility-container" class="space-y-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 ${heroAnimation === 'manual' ? 'hidden' : ''}">
                      <label class="block font-bold text-slate-700 text-[11px]">Mode Tampilan Panah Desktop:</label>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <label class="hero-arrows-vis-label flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${heroArrowsVisibility === 'hover' ? 'border-emerald-500 bg-emerald-50/50 font-bold text-emerald-900 ring-1 ring-emerald-500/20' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'}">
                          <input type="radio" name="hero_arrows_visibility_radio" value="hover" ${heroArrowsVisibility === 'hover' ? 'checked' : ''} class="text-emerald-600" />
                          <div>
                            <span class="block font-bold">Tampil Saat Hover</span>
                            <span class="block text-[10px] text-slate-400 font-normal">Muncul saat kursor diarahkan ke banner</span>
                          </div>
                        </label>
                        <label class="hero-arrows-vis-label flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${heroArrowsVisibility === 'always' ? 'border-emerald-500 bg-emerald-50/50 font-bold text-emerald-900 ring-1 ring-emerald-500/20' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'}">
                          <input type="radio" name="hero_arrows_visibility_radio" value="always" ${heroArrowsVisibility === 'always' ? 'checked' : ''} class="text-emerald-600" />
                          <div>
                            <span class="block font-bold">Selalu Tampil</span>
                            <span class="block text-[10px] text-slate-400 font-normal">Selalu terlihat tanpa perlu mouse hover</span>
                          </div>
                        </label>
                      </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      
                      <!-- Warna Background Tombol -->
                      <div class="space-y-1">
                        <label class="block font-bold text-slate-700 text-[11px]">Warna Background:</label>
                        <div class="flex items-center gap-2">
                          <input type="color" id="hero-arrows-bg-picker" value="${heroArrowsBg.startsWith('#') && heroArrowsBg.length === 7 ? heroArrowsBg : '#000000'}" class="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                          <input type="text" id="hero-arrows-bg" value="${heroArrowsBg}" class="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-mono text-[11px]" placeholder="rgba(0,0,0,0.45)" />
                        </div>
                      </div>

                      <!-- Warna Hover Background -->
                      <div class="space-y-1">
                        <label class="block font-bold text-slate-700 text-[11px]">Warna Hover Background:</label>
                        <div class="flex items-center gap-2">
                          <input type="color" id="hero-arrows-hover-bg-picker" value="${heroArrowsHoverBg.startsWith('#') && heroArrowsHoverBg.length === 7 ? heroArrowsHoverBg : '#1f2937'}" class="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                          <input type="text" id="hero-arrows-hover-bg" value="${heroArrowsHoverBg}" class="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-mono text-[11px]" placeholder="rgba(0,0,0,0.75)" />
                        </div>
                      </div>

                      <!-- Warna Ikon Panah -->
                      <div class="space-y-1">
                        <label class="block font-bold text-slate-700 text-[11px]">Warna Ikon Panah:</label>
                        <div class="flex items-center gap-2">
                          <input type="color" id="hero-arrows-icon-color-picker" value="${heroArrowsIconColor.startsWith('#') && heroArrowsIconColor.length === 7 ? heroArrowsIconColor : '#ffffff'}" class="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                          <input type="text" id="hero-arrows-icon-color" value="${heroArrowsIconColor}" class="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-mono text-[11px] uppercase" placeholder="#FFFFFF" />
                        </div>
                      </div>

                      <!-- Sudut Lengkung (Radius) -->
                      <div class="space-y-1">
                        <label class="block font-bold text-slate-700 text-[11px]">Sudut Lengkung (Radius):</label>
                        <select id="hero-arrows-radius" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold outline-none focus:border-emerald-500 bg-white text-xs">
                          <option value="0px" ${heroArrowsRadius === '0px' ? 'selected' : ''}>0px (Persegi Lancip)</option>
                          <option value="8px" ${heroArrowsRadius === '8px' ? 'selected' : ''}>8px (Membulat Halus)</option>
                          <option value="16px" ${heroArrowsRadius === '16px' ? 'selected' : ''}>16px (Membulat Sedang)</option>
                          <option value="9999px" ${(heroArrowsRadius === '9999px' || !['0px', '8px', '16px'].includes(heroArrowsRadius)) ? 'selected' : ''}>9999px / Bulat (Lingkaran Penuh)</option>
                        </select>
                      </div>

                      <!-- Bayangan (Shadow) -->
                      <div class="space-y-1">
                        <label class="block font-bold text-slate-700 text-[11px]">Bayangan (Shadow):</label>
                        <select id="hero-arrows-shadow" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold outline-none focus:border-emerald-500 bg-white text-xs">
                          <option value="none" ${heroArrowsShadow === 'none' ? 'selected' : ''}>none (Tanpa Bayangan)</option>
                          <option value="sm" ${heroArrowsShadow === 'sm' ? 'selected' : ''}>sm (Tipis / Halus)</option>
                          <option value="md" ${heroArrowsShadow === 'md' ? 'selected' : ''}>md (Sedang)</option>
                          <option value="lg" ${heroArrowsShadow === 'lg' ? 'selected' : ''}>lg (Tebal Menonjol)</option>
                        </select>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              <!-- MULTI BANNER UPLOAD DROPZONE -->
              <div class="space-y-3">
                <div class="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
                  <i data-lucide="info" class="w-4 h-4 text-amber-700 shrink-0 mt-0.5"></i>
                  <div>
                    <span class="font-bold">Panduan Berkas Banner:</span>
                    Rekomendasi rasio 9:2 (Desktop) &amp; 16:5 (Mobile). Format PNG/JPG/WebP, <strong>maksimal 500 KB per berkas</strong>.
                  </div>
                </div>

                <div id="hero-banner-dropzone" class="border-2 border-dashed border-slate-300 rounded-3xl p-6 sm:p-7 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/20 transition group bg-white shadow-2xs">
                  <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition">
                    <i data-lucide="cloud-upload" class="w-6 h-6"></i>
                  </div>
                  <h4 class="font-bold text-slate-800 text-xs sm:text-sm mb-1">Pilih Berkas Gambar atau Tarik &amp; Lepas Gambar ke Sini</h4>
                  <p class="text-[11px] text-slate-500">Format didukung: JPG, PNG, WEBP (Maksimal 500 KB per berkas)</p>
                  <input type="file" id="hero-banner-dropzone-file-input" accept="image/jpeg,image/png,image/webp" multiple class="hidden" />
                </div>

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

                  </div>
                </div>
              </div>

              <!-- ========================================================
                   ACCORDION 3: NAVIGASI KATEGORI
                   ======================================================== -->
              <div class="theme-accordion-item" data-accordion="cat-nav">
                <div class="theme-accordion-header cursor-pointer select-none" data-target="body-cat-nav">
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">
                      3
                    </div>
                    <div>
                      <h4 class="font-bold text-xs text-slate-900">Navigasi Kategori</h4>
                      <p class="text-[10px] text-slate-400 font-normal">Format filter kategori di Mobile &amp; Desktop</p>
                    </div>
                  </div>
                  <i class="bi bi-chevron-down theme-accordion-chevron text-xs text-slate-400"></i>
                </div>
                <div class="theme-accordion-body is-collapsed space-y-4" id="body-cat-nav">

            <!-- TAMPILAN VIEWPORT MOBILE -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <h4 class="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                  <i data-lucide="smartphone" class="w-4 h-4 text-emerald-600"></i>
                  <span>Format Viewport Ponsel / Mobile (Layar &lt; 1024px)</span>
                </h4>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                <!-- 1. Mode Icon & Gambar (Mobile) -->
                <label class="cat-nav-mode-card relative flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition select-none ${categoryNavModeMobile === 'icon_image' ? 'border-emerald-500 bg-emerald-50/20 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-white'}">
                  <input type="radio" name="category_nav_mode_mobile_radio" value="icon_image" ${categoryNavModeMobile === 'icon_image' ? 'checked' : ''} class="sr-only" />
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-bold text-slate-900">1. Mode Icon & Gambar (Rekomendasi)</span>
                    <div class="radio-indicator w-4 h-4 rounded-full border-2 flex items-center justify-center ${categoryNavModeMobile === 'icon_image' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}">
                      <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                  </div>
                  <p class="text-[11px] text-slate-500 mb-3 leading-relaxed">Scroll horizontal dengan efek mengintip <strong>5.5 item</strong> (5 penuh + item ke-6 terlihat 50% di tepi kanan). Menggunakan icon / gambar kategori di wadah rounded atas dan nama kategori di bawah.</p>
                  <div class="mt-auto p-2 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-1.5 overflow-hidden">
                    <div class="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs"><i class="bi bi-grid-fill text-xs"></i></div>
                    <div class="w-7 h-7 rounded-lg bg-slate-200 text-amber-600 flex items-center justify-center shrink-0"><i class="bi bi-fire text-xs"></i></div>
                    <div class="w-7 h-7 rounded-lg bg-slate-200 text-rose-500 flex items-center justify-center shrink-0"><i class="bi bi-ticket-perforated-fill text-xs"></i></div>
                    <div class="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0"><i class="bi bi-printer-fill text-xs"></i></div>
                    <div class="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0"><i class="bi bi-palette-fill text-xs"></i></div>
                    <div class="w-7 h-7 rounded-lg bg-slate-200 text-slate-400 opacity-50 flex items-center justify-center shrink-0"><i class="bi bi-gift-fill text-xs"></i></div>
                  </div>
                </label>

                <!-- 2. Mode Pill Buttons Teks (Mobile) -->
                <label class="cat-nav-mode-card relative flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition select-none ${categoryNavModeMobile === 'pills_text' ? 'border-emerald-500 bg-emerald-50/20 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-white'}">
                  <input type="radio" name="category_nav_mode_mobile_radio" value="pills_text" ${categoryNavModeMobile === 'pills_text' ? 'checked' : ''} class="sr-only" />
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-bold text-slate-900">2. Mode Pill Buttons Teks</span>
                    <div class="radio-indicator w-4 h-4 rounded-full border-2 flex items-center justify-center ${categoryNavModeMobile === 'pills_text' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}">
                      <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                  </div>
                  <p class="text-[11px] text-slate-500 mb-3 leading-relaxed">Barisan horizontal kapsul teks tanpa icon (kecuali tombol "Semua" yang memiliki icon grid). Sangat ringkas dan mudah digeser dengan satu jari.</p>
                  <div class="mt-auto p-2 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-1.5 overflow-hidden">
                    <span class="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 shrink-0"><i class="bi bi-grid-fill text-[9px]"></i> Semua</span>
                    <span class="px-2.5 py-1 rounded-xl bg-white border border-slate-300 text-slate-700 text-[10px] font-semibold shrink-0">Terlaris</span>
                    <span class="px-2.5 py-1 rounded-xl bg-white border border-slate-300 text-slate-700 text-[10px] font-semibold shrink-0">Promo</span>
                    <span class="px-2.5 py-1 rounded-xl bg-white border border-slate-300 text-slate-700 text-[10px] font-semibold shrink-0">Printing</span>
                  </div>
                </label>

                <!-- 3. Mode Dropdown (Mobile) -->
                <label class="cat-nav-mode-card relative flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition select-none ${categoryNavModeMobile === 'dropdown' ? 'border-emerald-500 bg-emerald-50/20 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-white'}">
                  <input type="radio" name="category_nav_mode_mobile_radio" value="dropdown" ${categoryNavModeMobile === 'dropdown' ? 'checked' : ''} class="sr-only" />
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-bold text-slate-900">3. Mode Dropdown</span>
                    <div class="radio-indicator w-4 h-4 rounded-full border-2 flex items-center justify-center ${categoryNavModeMobile === 'dropdown' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}">
                      <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                  </div>
                  <p class="text-[11px] text-slate-500 mb-3 leading-relaxed">Menu pilihan dropdown / select kompak satu baris. Sangat hemat tempat vertikal pada layar smartphone yang memiliki banyak kategori.</p>
                  <div class="mt-auto p-2 bg-slate-50 rounded-xl border border-slate-200/70">
                    <div class="px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                      <span class="truncate">Semua Kategori (Pilih...)</span>
                      <i class="bi bi-chevron-down text-[10px] text-slate-400"></i>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <!-- TAMPILAN VIEWPORT DESKTOP -->
            <div class="space-y-3 pt-4 border-t border-slate-100">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                <h4 class="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                  <i data-lucide="monitor" class="w-4 h-4 text-blue-600"></i>
                  <span>Format Viewport Komputer / Desktop (Layar &ge; 1024px)</span>
                </h4>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                <!-- 1. Mode Icon & Gambar (Desktop) -->
                <label class="cat-nav-mode-card relative flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition select-none ${categoryNavModeDesktop === 'icon_image' ? 'border-emerald-500 bg-emerald-50/20 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-white'}">
                  <input type="radio" name="category_nav_mode_desktop_radio" value="icon_image" ${categoryNavModeDesktop === 'icon_image' ? 'checked' : ''} class="sr-only" />
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-bold text-slate-900">1. Mode Icon & Gambar (Rekomendasi)</span>
                    <div class="radio-indicator w-4 h-4 rounded-full border-2 flex items-center justify-center ${categoryNavModeDesktop === 'icon_image' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}">
                      <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                  </div>
                  <p class="text-[11px] text-slate-500 mb-3 leading-relaxed">Carousel horizontal dengan <strong>10 item tampil penuh dan item ke-11 terlihat 50%</strong>. Dilengkapi navigasi panah &lt; dan &gt; mengambang saat area di-hover jika jumlah kategori &gt; 10.</p>
                  <div class="mt-auto p-2 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-1 overflow-hidden">
                    <div class="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0"><i class="bi bi-grid-fill text-[8px]"></i></div>
                    <div class="w-5 h-5 rounded-md bg-slate-200 text-amber-600 flex items-center justify-center shrink-0"><i class="bi bi-fire text-[8px]"></i></div>
                    <div class="w-5 h-5 rounded-md bg-slate-200 text-rose-500 flex items-center justify-center shrink-0"><i class="bi bi-ticket-perforated-fill text-[8px]"></i></div>
                    <div class="w-5 h-5 rounded-md bg-slate-200 text-slate-600 flex items-center justify-center shrink-0"><i class="bi bi-printer-fill text-[8px]"></i></div>
                    <div class="w-5 h-5 rounded-md bg-slate-200 text-slate-600 flex items-center justify-center shrink-0"><i class="bi bi-palette-fill text-[8px]"></i></div>
                    <div class="w-5 h-5 rounded-md bg-slate-200 text-slate-600 flex items-center justify-center shrink-0"><i class="bi bi-gift-fill text-[8px]"></i></div>
                    <div class="w-5 h-5 rounded-md bg-slate-200 text-slate-600 flex items-center justify-center shrink-0"><i class="bi bi-box-seam-fill text-[8px]"></i></div>
                    <div class="w-5 h-5 rounded-md bg-slate-200 text-slate-600 flex items-center justify-center shrink-0"><i class="bi bi-scissors text-[8px]"></i></div>
                    <div class="w-5 h-5 rounded-md bg-slate-200 text-slate-600 flex items-center justify-center shrink-0"><i class="bi bi-stars text-[8px]"></i></div>
                    <div class="w-5 h-5 rounded-md bg-slate-200 text-slate-600 flex items-center justify-center shrink-0"><i class="bi bi-tag-fill text-[8px]"></i></div>
                    <div class="w-5 h-5 rounded-md bg-slate-200 opacity-50 shrink-0"></div>
                  </div>
                </label>

                <!-- 2. Mode Pill Buttons Teks (Desktop) -->
                <label class="cat-nav-mode-card relative flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition select-none ${categoryNavModeDesktop === 'pills_text' ? 'border-emerald-500 bg-emerald-50/20 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-white'}">
                  <input type="radio" name="category_nav_mode_desktop_radio" value="pills_text" ${categoryNavModeDesktop === 'pills_text' ? 'checked' : ''} class="sr-only" />
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-bold text-slate-900">2. Mode Pill Buttons Teks</span>
                    <div class="radio-indicator w-4 h-4 rounded-full border-2 flex items-center justify-center ${categoryNavModeDesktop === 'pills_text' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}">
                      <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                  </div>
                  <p class="text-[11px] text-slate-500 mb-3 leading-relaxed">Tombol kapsul teks elegan tanpa icon (kecuali tombol "Semua"). Memberikan kesan minimalis dan modern bagi toko percetakan profesional.</p>
                  <div class="mt-auto p-2 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-1.5 overflow-hidden">
                    <span class="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 shrink-0"><i class="bi bi-grid-fill text-[9px]"></i> Semua</span>
                    <span class="px-2.5 py-1 rounded-xl bg-white border border-slate-300 text-slate-700 text-[10px] font-semibold shrink-0">Terlaris</span>
                    <span class="px-2.5 py-1 rounded-xl bg-white border border-slate-300 text-slate-700 text-[10px] font-semibold shrink-0">Promo</span>
                    <span class="px-2.5 py-1 rounded-xl bg-white border border-slate-300 text-slate-700 text-[10px] font-semibold shrink-0">Digital Printing & Banner</span>
                  </div>
                </label>

                <!-- 3. Mode Dropdown / Filter Kategori (Desktop) -->
                <label class="cat-nav-mode-card relative flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition select-none ${categoryNavModeDesktop === 'dropdown' ? 'border-emerald-500 bg-emerald-50/20 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-white'}">
                  <input type="radio" name="category_nav_mode_desktop_radio" value="dropdown" ${categoryNavModeDesktop === 'dropdown' ? 'checked' : ''} class="sr-only" />
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-bold text-slate-900">3. Mode Dropdown / Filter Kategori</span>
                    <div class="radio-indicator w-4 h-4 rounded-full border-2 flex items-center justify-center ${categoryNavModeDesktop === 'dropdown' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}">
                      <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                  </div>
                  <p class="text-[11px] text-slate-500 mb-3 leading-relaxed">Menu dropdown terpadu yang didampingi deretan tombol cepat teks ("Semua", "Terlaris", "Promo"). Desain fungsional dan terstruktur.</p>
                  <div class="mt-auto p-2 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-2">
                    <div class="flex-1 px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                      <span class="truncate">Semua Kategori (Pilih...)</span>
                      <i class="bi bi-chevron-down text-[10px] text-slate-400"></i>
                    </div>
                    <span class="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[10px] font-bold shrink-0">Semua</span>
                  </div>
                </label>
              </div>
                </div>
              </div>

              <!-- ========================================================
                   ACCORDION 4: GAYA KARTU PRODUK
                   ======================================================== -->
              <div class="theme-accordion-item" data-accordion="product-cards">
                <div class="theme-accordion-header cursor-pointer select-none" data-target="body-product-cards">
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">
                      4
                    </div>
                    <div>
                      <h4 class="font-bold text-xs text-slate-900">Gaya Kartu Produk</h4>
                      <p class="text-[10px] text-slate-400 font-normal">Pilih model layout kartu etalase katalog</p>
                    </div>
                  </div>
                  <i class="bi bi-chevron-down theme-accordion-chevron text-xs text-slate-400"></i>
                </div>
                <div class="theme-accordion-body is-collapsed space-y-3" id="body-product-cards">
                  <p class="text-[11px] text-slate-500 leading-relaxed">
                    Pilih tata letak kartu produk untuk katalog etalase toko. Pratinjau langsung akan diperbarui di layar tengah.
                  </p>

                  <div class="grid grid-cols-1 gap-2.5">
                    <!-- [v1] Versi 1: Kartu Klasik -->
                    <label class="card-style-choice-card p-3 rounded-2xl border-2 ${(cardProductVersion === 'v1' || !cardProductVersion) ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex items-start gap-3" data-card-ver="v1">
                      <input type="radio" name="card_product_version_radio" value="v1" ${(cardProductVersion === 'v1' || !cardProductVersion) ? 'checked' : ''} class="mt-0.5 text-emerald-600 focus:ring-emerald-500 shrink-0" />
                      <div class="space-y-1 flex-1">
                        <div class="flex items-center justify-between">
                          <span class="font-bold text-slate-900 text-xs">Kartu Klasik</span>
                          <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600">Default</span>
                        </div>
                        <p class="text-[10px] text-slate-500 leading-relaxed">
                          Format seimbang dengan penonjolan ulasan kepuasan pembeli. Cocok untuk: Berbagai macam produk ritel umum.
                        </p>
                        <div class="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-2">
                          <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold shrink-0">v1</div>
                          <div class="text-[10px] text-slate-600 truncate flex-1">
                            <span class="font-bold block truncate">Brosur A4 Full Color</span>
                            <span class="text-emerald-700 font-extrabold">Rp 150.000</span>
                          </div>
                        </div>
                      </div>
                    </label>

                    <!-- [v2] Versi 2: Kartu Minimalis -->
                    <label class="card-style-choice-card p-3 rounded-2xl border-2 ${cardProductVersion === 'v2' ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex items-start gap-3" data-card-ver="v2">
                      <input type="radio" name="card_product_version_radio" value="v2" ${cardProductVersion === 'v2' ? 'checked' : ''} class="mt-0.5 text-emerald-600 focus:ring-emerald-500 shrink-0" />
                      <div class="space-y-1 flex-1">
                        <div class="flex items-center justify-between">
                          <span class="font-bold text-slate-900 text-xs">Kartu Minimalis</span>
                          <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600">Modern</span>
                        </div>
                        <p class="text-[10px] text-slate-500 leading-relaxed">
                          Tata letak ringkas dan lugas tanpa ornamen berlebih Dengan Skala Gambar 3:4. Cocok Untuk: Produk Fashion, Pakaian Dan Lainnya.
                        </p>
                        <div class="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-2">
                          <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">v2</div>
                          <div class="text-[10px] text-slate-600 truncate flex-1">
                            <span class="font-bold block truncate">Kemeja Formal Pria</span>
                            <span class="text-slate-900 font-bold">Rp 125.000</span>
                          </div>
                        </div>
                      </div>
                    </label>

                    <!-- [v3] Versi 3: Kartu Detail -->
                    <label class="card-style-choice-card p-3 rounded-2xl border-2 ${cardProductVersion === 'v3' ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex items-start gap-3" data-card-ver="v3">
                      <input type="radio" name="card_product_version_radio" value="v3" ${cardProductVersion === 'v3' ? 'checked' : ''} class="mt-0.5 text-emerald-600 focus:ring-emerald-500 shrink-0" />
                      <div class="space-y-1 flex-1">
                        <div class="flex items-center justify-between">
                          <span class="font-bold text-slate-900 text-xs">Kartu Detail</span>
                          <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700">Premium</span>
                        </div>
                        <p class="text-[10px] text-slate-500 leading-relaxed">
                          Tampilan etalase modern dengan footer spesifikasi dinamis, Untuk mempercepat keputusan pembeli. Cocok untuk: Jasa Atau Layanan spesifik.
                        </p>
                        <div class="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-2">
                          <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 text-xs font-bold shrink-0">v3</div>
                          <div class="text-[10px] text-slate-600 truncate flex-1">
                            <span class="font-bold block truncate">Kartu Nama Premium Doff</span>
                            <span class="text-emerald-700 font-extrabold">Rp 45.000 <span class="text-[8px] text-slate-400 font-normal">/box</span></span>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <!-- ========================================================
                   ACCORDION 5: WARNA & LATAR BELAKANG
                   ======================================================== -->
              <div class="theme-accordion-item" data-accordion="theme-colors">
                <div class="theme-accordion-header cursor-pointer select-none" data-target="body-theme-colors">
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">
                      5
                    </div>
                    <div>
                      <h4 class="font-bold text-xs text-slate-900">Warna &amp; Latar Belakang</h4>
                      <p class="text-[10px] text-slate-400 font-normal">Kustomisasi palet warna global etalase toko</p>
                    </div>
                  </div>
                  <i class="bi bi-chevron-down theme-accordion-chevron text-xs text-slate-400"></i>
                </div>
                <div class="theme-accordion-body is-collapsed space-y-3.5" id="body-theme-colors">
                  <div class="space-y-3">
                    <!-- 1. Warna Latar Toko (Body Background) -->
                    <div class="space-y-1">
                      <label class="block font-bold text-slate-700 text-[11px]">Warna Latar Halaman (Body Background):</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="ctrl-color-body-bg" value="${bodyBgColor}" class="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                        <input type="text" id="ctrl-hex-body-bg" value="${bodyBgColor}" maxlength="7" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs uppercase outline-none focus:border-emerald-500 font-semibold" />
                      </div>
                    </div>

                    <!-- 2. Warna Brand Utama (Primary Color) -->
                    <div class="space-y-1">
                      <label class="block font-bold text-slate-700 text-[11px]">Warna Aksen Utama / Brand (Primary):</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="ctrl-color-primary" value="${primaryColor}" class="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                        <input type="text" id="ctrl-hex-primary" value="${primaryColor}" maxlength="7" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs uppercase outline-none focus:border-emerald-500 font-semibold" />
                      </div>
                    </div>

                    <!-- 3. Warna Aksen Sekunder (Secondary Color) -->
                    <div class="space-y-1">
                      <label class="block font-bold text-slate-700 text-[11px]">Warna Aksen Sekunder (Secondary):</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="ctrl-color-secondary" value="${secondaryColor}" class="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0" />
                        <input type="text" id="ctrl-hex-secondary" value="${secondaryColor}" maxlength="7" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs uppercase outline-none focus:border-emerald-500 font-semibold" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </form>
          </div>

          <!-- Sticky Inspector Footer: Save Button -->
          <div class="p-3.5 bg-white border-t border-slate-200 sticky bottom-0 z-10 shrink-0">
            <button type="button" id="btn-save-theme-branding" class="w-full py-2.5 px-4 rounded-xl bg-[#33b589] hover:bg-[#2aa27a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98] cursor-pointer">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>
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

        fileInput.addEventListener('change', async (e) => {
          const files = Array.from(e.target.files || []);
          if (files.length === 0) return;

          const compressFn = window.autoCompressImage || (typeof DB !== 'undefined' && DB.autoCompressImage);

          for (const file of files) {
            if (currentHeroBanners.length >= 5) {
              App.showToast('Maksimal 5 gambar banner tercapai.', 'warning');
              break;
            }
            try {
              const base64 = compressFn ? await compressFn(file, 1600, 900, 0.8) : await new Promise(res => {
                const r = new FileReader();
                r.onload = ev => res(ev.target.result);
                r.readAsDataURL(file);
              });
              if (currentHeroBanners.length < 5) {
                currentHeroBanners.push(base64);
                renderHeroBannerThumbs();
                syncHeroFormVisibility();
                updateStorefrontLivePreview();
              }
            } catch (err) {
              console.error('[AdminApp] Gagal memproses banner:', err);
            }
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

        dropzone.addEventListener('drop', async (e) => {
          const dt = e.dataTransfer;
          const files = Array.from(dt.files || []);
          if (files.length === 0) return;

          const compressFn = window.autoCompressImage || (typeof DB !== 'undefined' && DB.autoCompressImage);

          for (const file of files) {
            if (currentHeroBanners.length >= 5) {
              App.showToast('Maksimal 5 gambar banner tercapai.', 'warning');
              break;
            }
            try {
              const base64 = compressFn ? await compressFn(file, 1600, 900, 0.8) : await new Promise(res => {
                const r = new FileReader();
                r.onload = ev => res(ev.target.result);
                r.readAsDataURL(file);
              });
              if (currentHeroBanners.length < 5) {
                currentHeroBanners.push(base64);
                renderHeroBannerThumbs();
                syncHeroFormVisibility();
                updateStorefrontLivePreview();
              }
            } catch (err) {
              console.error('[AdminApp] Gagal memproses banner drop:', err);
            }
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
      const heroEnableToggle = document.getElementById('hero-enable-toggle');
      const isHeroEnabled = heroEnableToggle ? heroEnableToggle.checked : true;
      const heroConfigWrapper = document.getElementById('hero-configuration-body');
      if (heroConfigWrapper) {
        if (!isHeroEnabled) heroConfigWrapper.classList.add('hidden');
        else heroConfigWrapper.classList.remove('hidden');
      }

      const selectedModel = document.querySelector('input[name="hero_model_radio"]:checked')?.value || 'non_split';

      // Update radio cards active styles
      document.querySelectorAll('.hero-model-card').forEach(card => {
        const m = card.getAttribute('data-model');
        const isActive = (m === selectedModel) ||
          (selectedModel === 'non_split' && m === 'model_2') ||
          (selectedModel === 'split' && m === 'model_4');
        if (isActive) {
          card.className = 'hero-model-card p-4 rounded-2xl border border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 cursor-pointer transition space-y-2 block';
        } else {
          card.className = 'hero-model-card p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition space-y-2 block';
        }
      });

      const widthSection = document.getElementById('hero-layout-width-section');
      const ratioSection = document.getElementById('hero-mobile-ratio-section');
      const unselectedMsg = document.getElementById('hero-layout-unselected-msg');
      const selectedWidth = document.querySelector('input[name="hero_width_layout_radio"]:checked')?.value || 'boxed';

      // Update styling highlight pada radio card layout width
      document.querySelectorAll('.hero-width-choice-card').forEach(card => {
        const w = card.getAttribute('data-width');
        if (w === selectedWidth) {
          card.className = 'hero-width-choice-card p-3.5 rounded-xl border border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 cursor-pointer transition flex flex-col gap-1.5';
        } else {
          card.className = 'hero-width-choice-card p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition flex flex-col gap-1.5';
        }
      });

      // Update styling highlight pada radio card hero split mobile
      const selectedSplitMobile = document.querySelector('input[name="hero_split_mobile_radio"]:checked')?.value || 'image_top';
      document.querySelectorAll('.hero-split-mobile-choice-card').forEach(card => {
        const sm = card.getAttribute('data-split-mobile');
        if (sm === selectedSplitMobile) {
          card.className = 'hero-split-mobile-choice-card p-3.5 rounded-xl border border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 cursor-pointer transition flex flex-col gap-1.5';
        } else {
          card.className = 'hero-split-mobile-choice-card p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition flex flex-col gap-1.5';
        }
      });

      // Update styling highlight pada radio card hero split desktop
      const selectedSplitDesktop = document.querySelector('input[name="hero_split_desktop_pos_radio"]:checked')?.value || 'text_left';
      document.querySelectorAll('.hero-split-desktop-choice-card').forEach(card => {
        const sd = card.getAttribute('data-split-desktop');
        if (sd === selectedSplitDesktop) {
          card.className = 'hero-split-desktop-choice-card p-3.5 rounded-xl border border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 cursor-pointer transition flex flex-col gap-1.5';
        } else {
          card.className = 'hero-split-desktop-choice-card p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition flex flex-col gap-1.5';
        }
      });

      const isModelWithLayoutOption = (selectedModel === 'non_split' || selectedModel === 'model_2' || selectedModel === 'model_3');

      // GATING ALUR FORM:
      // Hanya model Non-Split / Gambar yang membutuhkan penentuan varian layout (full/boxed) & aspek rasio
      if (isModelWithLayoutOption) {
        if (widthSection) widthSection.classList.remove('hidden');
        if (ratioSection) ratioSection.classList.remove('hidden');
        if (!selectedWidth) {
          if (unselectedMsg) unselectedMsg.classList.remove('hidden');
        } else {
          if (unselectedMsg) unselectedMsg.classList.add('hidden');
        }
      } else {
        if (widthSection) widthSection.classList.add('hidden');
        if (ratioSection) ratioSection.classList.add('hidden');
        if (unselectedMsg) unselectedMsg.classList.add('hidden');
      }

      // [1] Hero Split Mobile Section (Khusus Mode Split)
      const splitMobileSection = document.getElementById('hero-split-mobile-layout-section');
      if (splitMobileSection) {
        if (selectedModel === 'split' || selectedModel === 'model_4') {
          splitMobileSection.classList.remove('hidden');
        } else {
          splitMobileSection.classList.add('hidden');
        }
      }

      // [1b] Hero Split Desktop Section (Khusus Mode Split)
      const splitDesktopSection = document.getElementById('hero-split-desktop-layout-section');
      if (splitDesktopSection) {
        if (selectedModel === 'split' || selectedModel === 'model_4') {
          splitDesktopSection.classList.remove('hidden');
        } else {
          splitDesktopSection.classList.add('hidden');
        }
      }

      // [2] Hero Text Background Section (Mode Text-Only & Mode Split)
      const textBgSection = document.getElementById('hero-text-background-section');
      if (textBgSection) {
        if (selectedModel === 'model_1' || selectedModel === 'split' || selectedModel === 'model_4') {
          textBgSection.classList.remove('hidden');
        } else {
          textBgSection.classList.add('hidden');
        }
      }

      // [3] Kontainer Hero Section (Border Radius & Shadow)
      // Tampil pada Mode Text-Only, Mode Split, atau Mode Non-Split yang bertipe Boxed
      const containerCustomSection = document.getElementById('hero-container-customization-section');
      if (containerCustomSection) {
        if (selectedWidth === 'full' && isModelWithLayoutOption) {
          containerCustomSection.classList.add('hidden');
        } else {
          containerCustomSection.classList.remove('hidden');
        }
      }

      // [4] Tipografi & Teks Hero (Mode Split & Text-Only; Non-Split murni disembunyikan)
      const typographySection = document.getElementById('hero-typography-section');
      if (typographySection) {
        if (selectedModel === 'non_split' || selectedModel === 'model_2') {
          typographySection.classList.add('hidden');
        } else {
          typographySection.classList.remove('hidden');
        }
      }

      // [5] Kotak Gambar Hero (Mode Split saja)
      const splitImageSection = document.getElementById('hero-split-image-section');
      if (splitImageSection) {
        if (selectedModel === 'split' || selectedModel === 'model_4') {
          splitImageSection.classList.remove('hidden');
        } else {
          splitImageSection.classList.add('hidden');
        }
      }

      // [6] Multi-Banner Controls & Dropdown Animasi Slider (Disembunyikan pada model_1)
      const bannerControls = document.getElementById('hero-banner-controls-section');
      const animContainer = document.getElementById('hero-animation-dropdown-container');
      if (bannerControls) {
        if (selectedModel === 'model_1') {
          bannerControls.classList.add('hidden');
        } else {
          bannerControls.classList.remove('hidden');
        }
      }

      const activeBanners = (typeof getActiveBannersList === 'function' ? getActiveBannersList() : []) || [];
      const animSelectEl = document.getElementById('hero-slider-animation-select');
      const showArrowsToggleContainer = document.getElementById('hero-show-arrows-toggle-container');
      const showArrowsToggleRow = document.getElementById('hero-show-arrows-toggle-row');
      const showArrowsToggle = document.getElementById('hero-show-arrows-toggle');
      const arrowsPanel = document.getElementById('hero-arrows-customization-panel');
      const arrowsVisibilityContainer = document.getElementById('hero-arrows-visibility-container');
      const currentAnimationType = animSelectEl?.value || 'slide_5s';
      const isManualAnim = (currentAnimationType === 'manual' || currentAnimationType === 'manual_swipe');

      if (animContainer) {
        if (selectedModel !== 'model_1' && activeBanners.length > 1) {
          animContainer.classList.remove('hidden');
          if (showArrowsToggleContainer) {
            showArrowsToggleContainer.classList.remove('hidden');
          }
          if (showArrowsToggleRow) {
            if (isManualAnim) {
              showArrowsToggleRow.classList.add('hidden');
            } else {
              showArrowsToggleRow.classList.remove('hidden');
            }
          }
          if (arrowsPanel) {
            if (isManualAnim || (showArrowsToggle && showArrowsToggle.checked)) {
              arrowsPanel.classList.remove('hidden');
            } else {
              arrowsPanel.classList.add('hidden');
            }
          }
          if (arrowsVisibilityContainer) {
            if (isManualAnim) {
              arrowsVisibilityContainer.classList.add('hidden');
              const alwaysRadio = document.querySelector('input[name="hero_arrows_visibility_radio"][value="always"]');
              if (alwaysRadio) alwaysRadio.checked = true;
            } else {
              arrowsVisibilityContainer.classList.remove('hidden');
            }
          }
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

      // Warna Elemen Kustom Navbar Toko
      const cartIconColor = document.getElementById('ctrl-hex-navbar-cart-icon')?.value || settings.navbar_cart_icon_color || '#334155';
      const cartBadgeBg = document.getElementById('ctrl-hex-navbar-cart-badge-bg')?.value || settings.navbar_cart_badge_bg || '#f43f5e';
      const cartBadgeText = document.getElementById('ctrl-hex-navbar-cart-badge-text')?.value || settings.navbar_cart_badge_text || '#ffffff';
      const searchIconColor = document.getElementById('ctrl-hex-navbar-search-icon')?.value || settings.navbar_search_icon_color || '#94a3b8';
      const searchInputBg = document.getElementById('ctrl-hex-navbar-search-input-bg')?.value || settings.navbar_search_input_bg || '#f1f5f9';
      const searchBorderColor = document.getElementById('ctrl-hex-navbar-search-border')?.value || settings.navbar_search_border_color || '#e2e8f0';
      const searchPlaceholderColor = document.getElementById('ctrl-hex-navbar-search-placeholder')?.value || settings.navbar_search_placeholder_color || '#94a3b8';
      const loginIconColor = document.getElementById('ctrl-hex-navbar-login-icon')?.value || settings.navbar_login_icon_color || '#334155';
      const loginTextColor = document.getElementById('ctrl-hex-navbar-login-text')?.value || settings.navbar_login_text_color || '#334155';

      const storeName = document.getElementById('store-name-input')?.value || 'Songer Creative';
      const selectedModel = document.querySelector('input[name="hero_model_radio"]:checked')?.value || 'non_split';
      const selectedWidth = document.querySelector('input[name="hero_width_layout_radio"]:checked')?.value || 'boxed';
      const isFullWidth = (selectedModel === 'non_split' || selectedModel === 'model_2' || selectedModel === 'model_3') && (selectedWidth === 'full');

      // Nilai Konfigurasi Kustomisasi Hero Lengkap
      const containerRadiusVal = (document.getElementById('hero-container-radius-number')?.value ?? '16') + 'px';
      const containerShadowVal = document.getElementById('hero-container-shadow-select')?.value || 'sm';
      const heroHeadlineVal = document.getElementById('hero-headline-input')?.value || 'Cetak Banner, Desain & Souvenir Harga Instan';
      const heroSubheadlineVal = document.getElementById('hero-subheadline-input')?.value || 'Katalog terpadu dengan kalkulator instan: spesifikasi kustom meteran, jasa desain original, hingga souvenir retail siap kirim ke seluruh Indonesia.';
      const heroTitleColorVal = document.getElementById('hero-title-color-hex')?.value || '#0f172a';
      const heroDescColorVal = document.getElementById('hero-desc-color-hex')?.value || '#475569';
      const heroImageRadiusVal = (document.getElementById('hero-image-radius-number')?.value ?? '12') + 'px';
      const heroImageShadowVal = document.getElementById('hero-image-shadow-select')?.value || 'sm';

      const heroDotsActiveColorVal = document.getElementById('hero-dots-active-hex')?.value || '#10b981';
      const heroDotsInactiveColorVal = document.getElementById('hero-dots-inactive-hex')?.value || '#cbd5e1';

      // Standarisasi Aspek Rasio Hero Banner: Desktop 9:2 (4.5:1) & Mobile 16:5 (3.2:1)
      const nonSplitAspectClass = 'aspect-[16/5] md:aspect-[9/2] w-full hero-responsive-aspect object-cover';
      const nonSplitAspectStyle = 'aspect-ratio: 16 / 5; width: 100%;';

      const bgType = document.getElementById('hero-bg-type-select')?.value || 'linear_gradient';
      const bgColor1 = document.getElementById('hero-bg-color1-hex')?.value || '#0f172a';
      const bgColor2 = document.getElementById('hero-bg-color2-hex')?.value || '#064e3b';
      const bgAngle = parseInt(document.getElementById('hero-bg-angle-input')?.value || '135', 10);

      // Handle extra column for gradient
      const gradCol = document.getElementById('hero-gradient-extra-col');
      if (gradCol) {
        if (bgType === 'solid') gradCol.classList.add('hidden');
        else gradCol.classList.remove('hidden');
      }

      const topBarBg = document.getElementById('ctrl-hex-top-bar-bg')?.value || settings.top_bar_bg_color || '#0f172a';
      const topBarText = document.getElementById('ctrl-hex-top-bar-text')?.value || settings.top_bar_text_color || '#f8fafc';

      const banners = getActiveBannersList();
      const animType = document.getElementById('hero-slider-animation-select')?.value || 'slide_3s';
      const showArrowsToggleVal = document.getElementById('hero-show-arrows-toggle')?.checked !== false;
      const showArrows = shouldShowNavArrows(animType, showArrowsToggleVal) && (banners.length > 1);

      // Hero Manual Arrows Style Values
      const heroArrowsBgVal = document.getElementById('hero-arrows-bg')?.value.trim() || 'rgba(0,0,0,0.45)';
      const heroArrowsHoverBgVal = document.getElementById('hero-arrows-hover-bg')?.value.trim() || 'rgba(0,0,0,0.75)';
      const heroArrowsIconColorVal = document.getElementById('hero-arrows-icon-color')?.value.trim() || '#ffffff';
      const heroArrowsRadiusVal = document.getElementById('hero-arrows-radius')?.value || '9999px';
      const heroArrowsShadowVal = document.getElementById('hero-arrows-shadow')?.value || 'sm';
      const heroArrowsVisibilityVal = document.querySelector('input[name="hero_arrows_visibility_radio"]:checked')?.value || settings.hero_arrows_visibility || 'hover';
      const isAlwaysVisible = (animType === 'manual' || animType === 'manual_swipe') || (heroArrowsVisibilityVal === 'always');
      const arrowVisibilityClass = isAlwaysVisible 
        ? 'opacity-100' 
        : 'opacity-0 group-hover:opacity-100 transition-opacity';

      // Generate background CSS style
      let heroBgCss = '';
      if (bgType === 'solid') {
        heroBgCss = `background-color: ${bgColor1};`;
      } else if (bgType === 'radial_gradient') {
        heroBgCss = `background: radial-gradient(circle at center, ${bgColor1} 0%, ${bgColor2} 100%);`;
      } else {
        heroBgCss = `background: linear-gradient(${bgAngle}deg, ${bgColor1} 0%, ${bgColor2} 100%);`;
      }

      // Helper untuk Slides HTML Non-Split
      const slidesHtml = banners.map((b, i) => `
        <div class="hero-slide-smooth ${i === 0 ? 'is-active' : 'is-hidden'}" data-index="${i}" style="border-radius: inherit; overflow: hidden;">
          <img src="${b}" alt="Hero Banner ${i + 1}" class="w-full h-full object-cover ${isFullWidth ? 'rounded-none' : ''}" style="border-radius: inherit;" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-3xl\\'><i class=\\'bi bi-images\\'></i></div>';" />
        </div>
      `).join('');

      // Helper untuk Slides HTML Split (Menggunakan daftar banner utama)
      const splitSlidesHtml = banners.map((b, i) => `
        <div class="hero-slide-smooth ${i === 0 ? 'is-active' : 'is-hidden'}" data-index="${i}" style="border-radius: inherit; overflow: hidden;">
          <img src="${b}" alt="Hero Banner ${i + 1}" class="w-full h-full hero-split-image-cover" style="border-radius: inherit;" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-2xl\\'><i class=\\'bi bi-images\\'></i></div>';" />
        </div>
      `).join('');

      const isContainerShadowNone = containerShadowVal === 'none' || !containerShadowVal;
      const containerBorderClass = isContainerShadowNone ? 'border-0 shadow-none hero-shadow-none' : 'border border-slate-200/80 dark:border-slate-800 hero-shadow-' + containerShadowVal;

      const heroEnabled = document.getElementById('hero-enable-toggle') ? document.getElementById('hero-enable-toggle').checked : (settings.hero_enabled !== false && settings.enable_hero !== false);
      let heroBannerHtml = '';
      if (!heroEnabled) {
        heroBannerHtml = '';
      } else if (selectedModel === 'model_1') {
        // [1] Model Teks Headline Saja (Tanpa Gambar Banner & Tanpa CTA)
        heroBannerHtml = `
          <div class="relative overflow-hidden p-6 sm:p-12 ${isFullWidth ? 'rounded-none border-x-0' : containerBorderClass}" style="${heroBgCss} ${isFullWidth ? '' : 'border-radius: ' + containerRadiusVal + ';'}" id="hero-slider-container">
            <div class="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
            <div class="relative z-10 max-w-2xl space-y-3.5 sm:space-y-4">
              <h1 class="text-xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-snug sm:leading-tight" style="color: ${heroTitleColorVal};">
                ${escapeHtml(heroHeadlineVal)}
              </h1>
              <p class="text-xs sm:text-sm leading-relaxed" style="color: ${heroDescColorVal};">
                ${escapeHtml(heroSubheadlineVal)}
              </p>
            </div>
          </div>
        `;
      } else if (selectedModel === 'split' || selectedModel === 'model_4') {
        // [2] VARIAN HERO SPLIT (Desktop: Teks 40% & Gambar 60% dengan opsi orientasi desktop; Mobile: Susunan Fleksibel 16:5)
        const isImageShadowNone = heroImageShadowVal === 'none' || !heroImageShadowVal;
        const splitBoxShadowClass = isImageShadowNone ? 'border-0 shadow-none hero-shadow-none' : 'hero-shadow-' + heroImageShadowVal + ' border border-slate-200/60 dark:border-slate-700/60';
        const splitBoxRadiusStyle = `border-radius: ${heroImageRadiusVal};`;
        const selectedSplitMobile = document.querySelector('input[name="hero_split_mobile_radio"]:checked')?.value || 'image_top';
        const mobileFlexClass = selectedSplitMobile === 'image_bottom' ? 'flex flex-col-reverse md:flex-row' : 'flex flex-col md:flex-row';
        const selectedSplitDesktop = document.querySelector('input[name="hero_split_desktop_pos_radio"]:checked')?.value || 'text_left';
        const imgDesktopOrder = selectedSplitDesktop === 'image_left' ? 'md:order-1' : 'md:order-2';
        const textDesktopOrder = selectedSplitDesktop === 'image_left' ? 'md:order-2' : 'md:order-1';

        heroBannerHtml = `
          <div class="relative overflow-hidden ${animType.startsWith('fade') ? 'hero-anim-fade' : ''} ${isFullWidth ? 'rounded-none border-x-0' : containerBorderClass}" style="${isFullWidth ? '' : 'border-radius: ' + containerRadiusVal + '; overflow: hidden;'}" id="hero-slider-container" data-anim="${animType}" data-count="${banners.length}">
            <div class="w-full md:aspect-[9/2] flex items-center p-3 sm:p-5 md:p-6" style="${heroBgCss} border-radius: inherit;">
              <div class="${mobileFlexClass} items-stretch md:items-center gap-3 sm:gap-4 md:gap-6 w-full h-full">
                
                <!-- Kolom Gambar: Desktop 60% (order adaptif), Mobile Membentang Penuh Proporsional 16:5 -->
                <div class="w-full md:w-[60%] ${imgDesktopOrder} flex flex-col items-center justify-center shrink-0 min-w-0 aspect-[16/5] md:aspect-auto md:h-full hero-split-mobile-image">
                  <div class="overflow-hidden w-full h-full relative group bg-slate-100 dark:bg-slate-800 ${splitBoxShadowClass}" style="${splitBoxRadiusStyle}; overflow: hidden;">
                    <div class="hero-slider-track w-full h-full relative" style="border-radius: inherit;">
                      ${splitSlidesHtml}
                    </div>
                    ${showArrows ? `
                      <button type="button" class="hero-arrow-btn absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 hidden md:flex items-center justify-center z-20 ${arrowVisibilityClass} transition duration-200 pointer-events-auto backdrop-blur-sm active:scale-90 hero-shadow-${heroArrowsShadowVal}" id="hero-slide-prev" title="Slide Sebelumnya (&lt;)" style="background-color: ${heroArrowsBgVal}; color: ${heroArrowsIconColorVal}; border-radius: ${heroArrowsRadiusVal};" onmouseenter="this.style.backgroundColor='${heroArrowsHoverBgVal}'" onmouseleave="this.style.backgroundColor='${heroArrowsBgVal}'"><i data-lucide="chevron-left" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i></button>
                      <button type="button" class="hero-arrow-btn absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 hidden md:flex items-center justify-center z-20 ${arrowVisibilityClass} transition duration-200 pointer-events-auto backdrop-blur-sm active:scale-90 hero-shadow-${heroArrowsShadowVal}" id="hero-slide-next" title="Slide Berikutnya (&gt;)" style="background-color: ${heroArrowsBgVal}; color: ${heroArrowsIconColorVal}; border-radius: ${heroArrowsRadiusVal};" onmouseenter="this.style.backgroundColor='${heroArrowsHoverBgVal}'" onmouseleave="this.style.backgroundColor='${heroArrowsBgVal}'"><i data-lucide="chevron-right" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i></button>
                    ` : ''}
                    <!-- Indikator Slider Dots Melayang (Absolute di dalam kotak gambar) -->
                    ${banners.length > 1 ? `
                      <div class="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 pointer-events-auto">
                        ${banners.map((_, i) => `<button type="button" class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all hero-slide-dot cursor-pointer" data-index="${i}" style="background-color: ${i === 0 ? heroDotsActiveColorVal : heroDotsInactiveColorVal}; ${i === 0 ? 'transform: scale(1.25);' : ''}"></button>`).join('')}
                      </div>
                    ` : ''}
                  </div>
                </div>

                <!-- Kolom Teks: Desktop 40% (order adaptif), Mobile Membentang Penuh -->
                <div class="w-full md:w-[40%] ${textDesktopOrder} flex flex-col justify-center min-w-0 pr-0 md:pr-4 h-auto md:h-full py-2 md:py-0">
                  <h1 class="line-clamp-2 font-bold text-xs sm:text-base md:text-xl lg:text-2xl leading-snug tracking-tight" style="color: ${heroTitleColorVal};">
                    ${escapeHtml(heroHeadlineVal)}
                  </h1>
                  <p class="line-clamp-2 sm:line-clamp-3 text-[10px] sm:text-xs md:text-sm mt-1 sm:mt-1.5 leading-relaxed" style="color: ${heroDescColorVal};">
                    ${escapeHtml(heroSubheadlineVal)}
                  </p>
                </div>

              </div>
            </div>
          </div>
        `;
      } else if (selectedModel === 'model_3') {
        // [3] Model Gambar & Teks Overlay (Tanpa CTA)
        heroBannerHtml = `
          <div class="${isFullWidth ? '-mx-3 sm:-mx-4 lg:-mx-6 -mt-3 sm:-mt-4 lg:-mt-6' : ''}">
            <div class="relative overflow-hidden ${isFullWidth ? 'rounded-none border-x-0' : containerBorderClass} shadow-2xl group ${animType.startsWith('fade') ? 'hero-anim-fade' : ''}" style="${isFullWidth ? '' : 'border-radius: ' + containerRadiusVal + '; overflow: hidden;'}" id="hero-slider-container" data-anim="${animType}" data-count="${banners.length}">
              <div class="${nonSplitAspectClass} relative bg-slate-950 overflow-hidden flex items-center" style="${nonSplitAspectStyle}; border-radius: inherit;">
                <div class="hero-slider-track absolute inset-0 w-full h-full" style="border-radius: inherit;">
                  ${slidesHtml}
                </div>
                <div class="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/40 z-10 pointer-events-none"></div>
                
                <div class="relative z-20 p-5 sm:p-10 md:p-12 max-w-2xl space-y-3 sm:space-y-3.5 text-white w-full">
                  <h1 class="text-lg sm:text-3xl md:text-4xl font-black tracking-tight leading-snug sm:leading-tight" style="color: ${heroTitleColorVal};">
                    ${escapeHtml(heroHeadlineVal)}
                  </h1>
                  <p class="text-xs sm:text-sm leading-relaxed max-w-xl line-clamp-2 sm:line-clamp-3" style="color: ${heroDescColorVal};">
                    ${escapeHtml(heroSubheadlineVal)}
                  </p>
                </div>
                ${showArrows ? `
                  <button type="button" class="hero-arrow-btn absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 hidden md:flex items-center justify-center z-30 ${arrowVisibilityClass} transition duration-200 pointer-events-auto backdrop-blur-sm active:scale-90 hero-shadow-${heroArrowsShadowVal}" id="hero-slide-prev" title="Slide Sebelumnya (&lt;)" style="background-color: ${heroArrowsBgVal}; color: ${heroArrowsIconColorVal}; border-radius: ${heroArrowsRadiusVal};" onmouseenter="this.style.backgroundColor='${heroArrowsHoverBgVal}'" onmouseleave="this.style.backgroundColor='${heroArrowsBgVal}'"><i data-lucide="chevron-left" class="w-4 h-4 sm:w-5 sm:h-5"></i></button>
                  <button type="button" class="hero-arrow-btn absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 hidden md:flex items-center justify-center z-30 ${arrowVisibilityClass} transition duration-200 pointer-events-auto backdrop-blur-sm active:scale-90 hero-shadow-${heroArrowsShadowVal}" id="hero-slide-next" title="Slide Berikutnya (&gt;)" style="background-color: ${heroArrowsBgVal}; color: ${heroArrowsIconColorVal}; border-radius: ${heroArrowsRadiusVal};" onmouseenter="this.style.backgroundColor='${heroArrowsHoverBgVal}'" onmouseleave="this.style.backgroundColor='${heroArrowsBgVal}'"><i data-lucide="chevron-right" class="w-4 h-4 sm:w-5 sm:h-5"></i></button>
                ` : ''}
                <!-- Indikator Slider Dots Melayang (Absolute di atas gambar banner) -->
                ${banners.length > 1 ? `
                  <div class="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 pointer-events-auto">
                    ${banners.map((_, i) => `<button type="button" class="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full transition-all hero-slide-dot cursor-pointer" data-index="${i}" style="background-color: ${i === 0 ? heroDotsActiveColorVal : heroDotsInactiveColorVal}; ${i === 0 ? 'transform: scale(1.25);' : ''}"></button>`).join('')}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      } else {
        // [4] VARIAN HERO NON-SPLIT (GAMBAR PENUH) - DEFAULT & UTAMA
        // Desktop: Rasio 9 : 2 (4.5 : 1)
        // Mobile: Rasio 16 : 5 (3.2 : 1)
        // Sembunyikan elemen tombol CTA di etalase dan pratinjau!
        // Indikator Slider (...): Melayang (absolute) di atas bagian bawah gambar banner
        heroBannerHtml = `
          <div class="${isFullWidth ? '-mx-3 sm:-mx-4 lg:-mx-6 -mt-3 sm:-mt-4 lg:-mt-6' : ''}">
            <div class="relative overflow-hidden ${isFullWidth ? 'rounded-none border-x-0' : containerBorderClass} group ${animType.startsWith('fade') ? 'hero-anim-fade' : ''}" style="${isFullWidth ? '' : 'border-radius: ' + containerRadiusVal + '; overflow: hidden;'}" id="hero-slider-container" data-anim="${animType}" data-count="${banners.length}">
              <div class="${nonSplitAspectClass} relative bg-slate-900 overflow-hidden" style="${nonSplitAspectStyle}; border-radius: inherit;">
                <div class="hero-slider-track w-full h-full relative" style="border-radius: inherit;">
                  ${slidesHtml}
                </div>
                ${showArrows ? `
                  <button type="button" class="hero-arrow-btn absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 hidden md:flex items-center justify-center z-30 ${arrowVisibilityClass} transition duration-200 pointer-events-auto backdrop-blur-sm active:scale-90 hero-shadow-${heroArrowsShadowVal}" id="hero-slide-prev" title="Slide Sebelumnya (&lt;)" style="background-color: ${heroArrowsBgVal}; color: ${heroArrowsIconColorVal}; border-radius: ${heroArrowsRadiusVal};" onmouseenter="this.style.backgroundColor='${heroArrowsHoverBgVal}'" onmouseleave="this.style.backgroundColor='${heroArrowsBgVal}'"><i data-lucide="chevron-left" class="w-4 h-4 sm:w-5 sm:h-5"></i></button>
                  <button type="button" class="hero-arrow-btn absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 hidden md:flex items-center justify-center z-30 ${arrowVisibilityClass} transition duration-200 pointer-events-auto backdrop-blur-sm active:scale-90 hero-shadow-${heroArrowsShadowVal}" id="hero-slide-next" title="Slide Berikutnya (&gt;)" style="background-color: ${heroArrowsBgVal}; color: ${heroArrowsIconColorVal}; border-radius: ${heroArrowsRadiusVal};" onmouseenter="this.style.backgroundColor='${heroArrowsHoverBgVal}'" onmouseleave="this.style.backgroundColor='${heroArrowsBgVal}'"><i data-lucide="chevron-right" class="w-4 h-4 sm:w-5 sm:h-5"></i></button>
                ` : ''}
                <!-- Indikator Slider Dots Melayang (Absolute di atas gambar banner) -->
                ${banners.length > 1 ? `
                  <div class="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 pointer-events-auto">
                    ${banners.map((_, i) => `<button type="button" class="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full transition-all hero-slide-dot cursor-pointer" data-index="${i}" style="background-color: ${i === 0 ? heroDotsActiveColorVal : heroDotsInactiveColorVal}; ${i === 0 ? 'transform: scale(1.25);' : ''}"></button>`).join('')}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }

      // Generator Preview Navigasi Kategori (Quick Filter)
      const selectedCatNavMobile = document.querySelector('input[name="category_nav_mode_mobile_radio"]:checked')?.value || settings.category_nav_mode_mobile || 'icon_image';
      const selectedCatNavDesktop = document.querySelector('input[name="category_nav_mode_desktop_radio"]:checked')?.value || settings.category_nav_mode_desktop || 'icon_image';

      function renderPreviewCatNav(mode, isDesktop) {
        if (mode === 'dropdown') {
          return `
            <div class="w-full flex items-center justify-between gap-2.5 py-1.5 px-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <i class="bi bi-filter-circle text-slate-400 text-sm"></i>
                <select class="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer py-1 truncate">
                  <option selected>Semua Kategori (Pilih Katalog...)</option>
                  <option>🔥 Produk Terlaris</option>
                  <option>🎟️ Sedang Promo</option>
                  <option>Digital Printing & Banner</option>
                  <option>Graphic Design & Branding</option>
                  <option>Souvenir, Merchandise & Apparel</option>
                </select>
              </div>
              ${isDesktop ? `
                <div class="flex items-center gap-1.5 shrink-0 pl-2 border-l border-slate-200">
                  <span class="px-2.5 py-1 rounded-xl text-[11px] font-bold text-white shadow-2xs" style="background-color: ${primColor};">Semua</span>
                  <span class="px-2.5 py-1 rounded-xl text-[11px] font-semibold text-slate-600 bg-slate-100">Terlaris</span>
                  <span class="px-2.5 py-1 rounded-xl text-[11px] font-semibold text-slate-600 bg-slate-100">Promo</span>
                </div>
              ` : ''}
            </div>
          `;
        }

        if (mode === 'pills_text') {
          return `
            <div class="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none w-full">
              <button class="px-3.5 py-2 rounded-2xl text-xs font-bold text-white flex items-center gap-1.5 shrink-0 shadow-xs" style="background-color: ${primColor};">
                <i class="bi bi-grid-fill text-xs"></i>
                <span>Semua</span>
              </button>
              <button class="px-3.5 py-2 rounded-2xl text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 shrink-0">Produk Terlaris</button>
              <button class="px-3.5 py-2 rounded-2xl text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 shrink-0">Sedang Promo</button>
              <button class="px-3.5 py-2 rounded-2xl text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 shrink-0">Digital Printing & Banner</button>
              <button class="px-3.5 py-2 rounded-2xl text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 shrink-0">Graphic Design</button>
              <button class="px-3.5 py-2 rounded-2xl text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 shrink-0">Souvenir</button>
            </div>
          `;
        }

        // Mode icon_image (Default)
        const realCats = (typeof DB !== 'undefined' && DB.getCategories) ? DB.getCategories().filter(c => c.show_in_quick_nav !== false) : [];
        let dummyItems = [];
        if (realCats.length > 0) {
          dummyItems = [
            { name: 'Semua', icon: 'bi-grid-fill', active: true, color: '#ffffff' },
            { name: 'Terlaris', icon: 'bi-fire', color: '#f59e0b' },
            { name: 'Promo', icon: 'bi-ticket-perforated-fill', color: '#ef4444' },
            ...realCats.map(c => ({
              name: c.name,
              icon: (c.icon && c.icon.startsWith('bi-')) ? c.icon : `bi-${c.icon || 'grid-fill'}`,
              image: c.image || '',
              color: primColor
            }))
          ];
        } else {
          dummyItems = [
            { name: 'Semua', icon: 'bi-grid-fill', active: true, color: '#ffffff' },
            { name: 'Terlaris', icon: 'bi-fire', color: '#f59e0b' },
            { name: 'Promo', icon: 'bi-ticket-perforated-fill', color: '#ef4444' },
            { name: 'Printing', icon: 'bi-printer-fill', color: '#3b82f6' },
            { name: 'Branding', icon: 'bi-palette-fill', color: '#8b5cf6' },
            { name: 'Souvenir', icon: 'bi-gift-fill', color: '#ec4899' },
            { name: 'Packaging', icon: 'bi-box-seam-fill', color: '#06b6d4' }
          ];
        }

        const catCount = realCats.length > 0 ? realCats.length : (dummyItems.length - 3);
        const hasMoreThanTen = isDesktop && (catCount > 10);
        const trackClasses = (isDesktop && !hasMoreThanTen)
          ? 'cat-scroll-track flex items-start justify-center gap-2 sm:gap-2.5 lg:gap-3 py-1 scrollbar-none w-full mx-auto'
          : 'cat-scroll-track flex items-start justify-start overflow-x-auto gap-2 sm:gap-2.5 lg:gap-3 py-1 scrollbar-none w-full';

        return `
          <div class="relative group/catnav w-full">
            ${hasMoreThanTen ? `
              <button type="button" class="hidden lg:flex opacity-0 group-hover/catnav:opacity-100 transition-opacity absolute -left-2.5 top-7 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 text-slate-700 items-center justify-center cursor-pointer">
                <i class="bi bi-chevron-left text-[11px]"></i>
              </button>
              <button type="button" class="hidden lg:flex opacity-0 group-hover/catnav:opacity-100 transition-opacity absolute -right-2.5 top-7 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 text-slate-700 items-center justify-center cursor-pointer">
                <i class="bi bi-chevron-right text-[11px]"></i>
              </button>
            ` : ''}
            <div class="${trackClasses}">
              ${dummyItems.map(item => `
                <div class="cat-item-peek flex flex-col items-center justify-start text-center select-none shrink-0 cursor-pointer">
                  <div class="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition shadow-2xs ${item.active ? 'ring-2' : 'border border-slate-200/80 bg-slate-100'} overflow-hidden" style="${item.active ? `background-color: ${primColor}; color: #ffffff; ring-color: ${primColor};` : `background-color: #f8fafc; color: ${item.color};`}">
                    ${item.image ? `<img src="${item.image}" class="w-full h-full object-cover rounded-2xl" onerror="this.outerHTML='<i class=\\'bi bi-tag-fill text-lg sm:text-xl md:text-2xl\\'></i>';" />` : `<i class="bi ${item.icon} text-lg sm:text-xl md:text-2xl"></i>`}
                  </div>
                  <span class="text-[10px] sm:text-xs font-semibold text-center line-clamp-2 mt-1.5 w-full break-words leading-tight ${item.active ? 'font-bold' : 'text-slate-700'}" style="${item.active ? `color: ${primColor};` : ''}">
                    ${item.name}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      const previewCatNavHtml = `
        <div class="w-full space-y-2 mt-4 pt-3 border-t border-slate-200/80">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-800">Navigasi Kategori Toko (Live Simulation)</span>
            <span class="text-[10px] text-slate-400">Efek intip responsif aktif</span>
          </div>
          <div class="block lg:hidden w-full">
            ${renderPreviewCatNav(selectedCatNavMobile, false)}
          </div>
          <div class="hidden lg:block w-full">
            ${renderPreviewCatNav(selectedCatNavDesktop, true)}
          </div>
        </div>
      `;

      // Generator Preview Produk (Sesuai Gaya Kartu v1, v2, v3)
      const cardVer = document.querySelector('input[name="card_product_version_radio"]:checked')?.value || settings.card_product_version || 'v1';

      function renderPreviewProductCards(version) {
        const dummyProducts = [
          { name: 'Brosur A4 Full Color', price: 'Rp 150.000', cat: 'Digital Printing', badge: 'Terlaris', img: 'assets/images/banner1.jpg', rating: '4.9' },
          { name: 'Spanduk Flexy 280gr', price: 'Rp 25.000/m', cat: 'Outdoor', badge: 'Diskon 10%', img: 'assets/images/banner1.jpg', rating: '4.8' },
          { name: 'Kartu Nama Eksklusif', price: 'Rp 45.000', cat: 'Branding', badge: 'Siap Kirim', img: 'assets/images/banner1.jpg', rating: '5.0' },
          { name: 'Mug Keramik Custom', price: 'Rp 22.500', cat: 'Merchandise', badge: 'Promo', img: 'assets/images/banner1.jpg', rating: '4.7' }
        ];

        if (version === 'v2') {
          return `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 mt-2.5">
              ${dummyProducts.map(p => `
                <div class="bg-white rounded-2xl overflow-hidden shadow-xs border border-slate-100 flex flex-col group">
                  <div class="aspect-square w-full relative overflow-hidden bg-slate-100">
                    <img src="${p.img}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" onerror="this.src='assets/images/banner1.jpg'" />
                    <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-xs" style="background-color: ${primColor};">${p.badge}</span>
                    <button type="button" class="absolute bottom-2 right-2 w-7 h-7 rounded-full text-white flex items-center justify-center shadow-md" style="background-color: ${primColor};">
                      <i class="bi bi-cart-plus text-xs"></i>
                    </button>
                  </div>
                  <div class="p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <span class="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block">${p.cat}</span>
                      <h4 class="font-bold text-slate-800 text-[11px] line-clamp-2 mt-0.5">${p.name}</h4>
                    </div>
                    <div class="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                      <span class="font-black text-xs text-slate-900">${p.price}</span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        }

        if (version === 'v3') {
          return `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 mt-2.5">
              ${dummyProducts.map(p => `
                <div class="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs flex flex-col group">
                  <div class="aspect-[4/3] w-full relative overflow-hidden bg-slate-100">
                    <img src="${p.img}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" onerror="this.src='assets/images/banner1.jpg'" />
                    <div class="absolute top-2 right-2 bg-white/95 px-2 py-0.5 rounded-lg text-[9px] font-bold text-slate-700 shadow-2xs border border-slate-200/60">
                      ${p.badge}
                    </div>
                  </div>
                  <div class="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <div class="flex items-center gap-1 text-[10px] text-amber-500 mb-0.5">
                        <i class="bi bi-star-fill text-[9px]"></i>
                        <span class="font-bold text-slate-600">${p.rating}</span>
                      </div>
                      <h4 class="font-bold text-slate-800 text-[11px] line-clamp-2 leading-tight">${p.name}</h4>
                    </div>
                    <div>
                      <div class="font-black text-xs" style="color: ${primColor};">${p.price}</div>
                      <button type="button" class="w-full mt-2 py-1.5 rounded-xl text-white font-bold text-[10px] flex items-center justify-center gap-1 shadow-2xs" style="background-color: ${primColor};">
                        <i class="bi bi-bag-plus"></i>
                        <span>Lihat Opsi</span>
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        }

        // v1 (Default Compact Klasik)
        return `
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mt-2.5">
            ${dummyProducts.map(p => `
              <div class="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
                <div class="aspect-square w-full relative bg-slate-100 overflow-hidden">
                  <img src="${p.img}" alt="${p.name}" class="w-full h-full object-cover" onerror="this.src='assets/images/banner1.jpg'" />
                  <span class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[8px] font-bold">${p.badge}</span>
                </div>
                <div class="p-2 flex-1 flex flex-col justify-between">
                  <h4 class="font-semibold text-slate-800 text-[10px] line-clamp-2 leading-tight">${p.name}</h4>
                  <div class="mt-2 flex items-center justify-between gap-1">
                    <span class="font-bold text-[11px] text-slate-900">${p.price}</span>
                    <button type="button" class="px-2 py-1 rounded-lg text-white font-bold text-[9px] shrink-0" style="background-color: ${primColor};">Pesan</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      const previewProductsHtml = `
        <div class="w-full space-y-1.5 mt-4 pt-3 border-t border-slate-200/80">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-800">Katalog Produk (Gaya ${cardVer.toUpperCase()})</span>
            <span class="text-[10px] text-slate-400">Simulasi Kartu Produk</span>
          </div>
          ${renderPreviewProductCards(cardVer)}
        </div>
      `;

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
          const totalSlides = slides.length;
          if (totalSlides <= 1) return;

          let currentIndex = 0;
          let isTransitioning = false;
          let slideInterval = null;

          function goToSlide(targetIndex, direction = 1) {
            if (isTransitioning) return;
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

                void incomingSlide.offsetWidth;

                incomingSlide.style.transition = 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                incomingSlide.style.opacity = '1';
              }
            } else {
              const startTranslate = direction > 0 ? 'translateX(100%)' : 'translateX(-100%)';
              const exitTranslate = direction > 0 ? 'translateX(-100%)' : 'translateX(100%)';

              if (incomingSlide) {
                incomingSlide.classList.remove('is-hidden', 'is-prev', 'is-next');
                incomingSlide.style.visibility = 'visible';
                incomingSlide.style.zIndex = '10';
                incomingSlide.style.transition = 'none';
                incomingSlide.style.transform = startTranslate;

                void incomingSlide.offsetWidth;

                incomingSlide.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
                incomingSlide.style.transform = 'translateX(0)';
              }

              if (outgoingSlide) {
                outgoingSlide.style.zIndex = '5';
                outgoingSlide.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
                outgoingSlide.style.transform = exitTranslate;
              }
            }

            dots.forEach((dot, idx) => {
              if (idx === normalizedTarget) {
                dot.classList.add('bg-emerald-500', 'scale-125');
                dot.classList.remove('bg-white/60', 'bg-white/50', 'bg-slate-300', 'dark:bg-slate-600');
              } else {
                dot.classList.remove('bg-emerald-500', 'scale-125');
                if (dot.classList.contains('bg-white/60') || dot.classList.contains('bg-white/50')) {
                  dot.classList.add('bg-white/60');
                } else {
                  dot.classList.add('bg-slate-300');
                }
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
                startTimer();
              }
            }, 620);
          }

          dots.forEach((dot, idx) => {
            dot.addEventListener('click', (e) => {
              e.preventDefault();
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
              if (slideInterval) clearInterval(slideInterval);
              goToSlide((currentIndex - 1 + totalSlides) % totalSlides, -1);
            });
          }
          if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
              e.preventDefault();
              if (slideInterval) clearInterval(slideInterval);
              goToSlide((currentIndex + 1) % totalSlides, 1);
            });
          }

          // Gesture Swipe & Drag Support (Mobile Touch & Desktop Mouse Drag)
          sliderContainer.style.touchAction = 'pan-y';
          sliderContainer.style.userSelect = 'none';

          let isDragging = false;
          let startX = 0, startY = 0, currentX = 0, currentY = 0;
          let isHorizontalGesture = false, hasDragged = false;
          const threshold = 45;

          function handleDragStart(x, y) {
            if (isTransitioning) return;
            isDragging = true;
            hasDragged = false;
            isHorizontalGesture = false;
            startX = x; startY = y;
            currentX = x; currentY = y;
            if (slideInterval) {
              clearInterval(slideInterval);
              slideInterval = null;
            }
          }

          function handleDragMove(x, y, e) {
            if (!isDragging || isTransitioning) return;
            currentX = x; currentY = y;
            const deltaX = currentX - startX;
            const deltaY = currentY - startY;

            if (!isHorizontalGesture) {
              if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
                isHorizontalGesture = true;
                hasDragged = true;
              } else if (Math.abs(deltaY) > 8 && Math.abs(deltaY) >= Math.abs(deltaX)) {
                isDragging = false;
                return;
              }
            }

            if (isHorizontalGesture) {
              if (e && e.cancelable) e.preventDefault();
              sliderContainer.style.cursor = 'grabbing';
              if (!isFade && slides[currentIndex]) {
                slides[currentIndex].style.transition = 'none';
                slides[currentIndex].style.transform = 'translateX(' + deltaX + 'px)';
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
              if (deltaX > threshold) {
                goToSlide((currentIndex + 1) % totalSlides, 1);
              } else if (deltaX < -threshold) {
                goToSlide((currentIndex - 1 + totalSlides) % totalSlides, -1);
              } else {
                startTimer();
              }
            } else {
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

          sliderContainer.addEventListener('touchend', () => { handleDragEnd(); }, { passive: true });
          sliderContainer.addEventListener('touchcancel', () => { handleDragEnd(); }, { passive: true });

          sliderContainer.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            if (e.target.closest('#hero-slide-prev') || e.target.closest('#hero-slide-next') || e.target.closest('.hero-slide-dot')) return;
            handleDragStart(e.clientX, e.clientY);
          });

          window.addEventListener('mousemove', (e) => {
            if (isDragging) handleDragMove(e.clientX, e.clientY, e);
          });

          window.addEventListener('mouseup', () => {
            if (isDragging) handleDragEnd();
          });

          sliderContainer.querySelectorAll('img').forEach(img => {
            img.addEventListener('dragstart', (e) => e.preventDefault());
          });

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
          <!-- MINI TOP BAR SAPAAN & PROMO COUNTDOWN PREVIEW -->
          <div class="px-3 sm:px-6 py-1.5 flex items-center justify-between text-[11px] sm:text-xs font-medium select-none border-b shrink-0 transition-colors" style="background-color: ${topBarBg}; color: ${topBarText}; border-color: rgba(255, 255, 255, 0.08);">
            <div class="truncate max-w-[55%]">
              Selamat datang di <span class="font-bold">${escapeHtml(storeName)}</span>
            </div>
            <div class="flex items-center gap-1.5 font-semibold text-[10px] sm:text-[11px] shrink-0">
              <i class="bi bi-stopwatch text-emerald-400"></i>
              <span>Promo Kilat Berakhir Dalam: 02 Hari Lagi</span>
            </div>
          </div>

          <!-- FRAMED MINI NAVBAR TOKO PREVIEW -->
          <header class="border-b shadow-xs transition-colors px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 select-none shrink-0" style="background-color: ${navbarBg}; color: ${navbarText}; border-color: rgba(148, 163, 184, 0.25);">
            <!-- Left: Identitas Toko (Logo Square / Landscape / Text Only) -->
            ${previewBrandHtml}

            <!-- Center: Dummy Search Bar with Custom Colors -->
            <div class="flex-1 max-w-xs sm:max-w-sm mx-1 sm:mx-2">
              <div class="relative w-full">
                <i class="bi bi-search text-xs absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style="color: ${searchIconColor};"></i>
                <div class="w-full text-[11px] pl-7 pr-3 py-1.5 rounded-xl border truncate" style="background-color: ${searchInputBg}; border-color: ${searchBorderColor}; color: ${searchPlaceholderColor};">Cari produk cetak...</div>
              </div>
            </div>

            <!-- Right: Dummy Keranjang & Login with Custom Colors -->
            <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div class="px-2.5 py-1.5 rounded-xl border border-slate-200/80 bg-white/90 text-xs flex items-center gap-1.5 shadow-2xs font-semibold cursor-pointer">
                <i class="bi bi-bag-fill text-sm" style="color: ${cartIconColor};"></i>
                <span class="text-[10px] font-bold px-1.5 py-0.2 rounded-full" style="background-color: ${cartBadgeBg}; color: ${cartBadgeText};">0</span>
              </div>
              <div class="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200/60 bg-white/60" style="color: ${loginTextColor};">
                <i class="bi bi-person-fill text-sm" style="color: ${loginIconColor};"></i>
                <span>Login</span>
              </div>
            </div>
          </header>

          <!-- FRAMED HERO BANNER & CATALOG PREVIEW -->
          <div class="w-full ${isFullWidth ? '' : 'p-3 sm:p-5'} space-y-4">
            ${heroBannerHtml}
            ${previewCatNavHtml}
            ${previewProductsHtml}
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

    // Top Bar Background & Text Color Pair Bindings
    bindColorPair('ctrl-color-top-bar-bg', 'ctrl-hex-top-bar-bg');
    bindColorPair('ctrl-color-top-bar-text', 'ctrl-hex-top-bar-text');

    // Hero Typography & Background Color Pair Bindings
    bindColorPair('hero-title-color-picker', 'hero-title-color-hex');
    bindColorPair('hero-desc-color-picker', 'hero-desc-color-hex');
    bindColorPair('hero-subtitle-color-picker', 'hero-subtitle-color-hex');
    bindColorPair('hero-bg-color1-picker', 'hero-bg-color1-hex');
    bindColorPair('hero-bg-color2-picker', 'hero-bg-color2-hex');

    // Hero Dots Navigation Color Pair Bindings
    bindColorPair('hero-dots-active-picker', 'hero-dots-active-hex');
    bindColorPair('hero-dots-inactive-picker', 'hero-dots-inactive-hex');

    // Radius Slider + Input Number + Presets Two-Way Interactive Synchronizer
    function bindRadiusControl(sliderId, numberId, presetClass) {
      const slider = document.getElementById(sliderId);
      const num = document.getElementById(numberId);
      const presets = document.querySelectorAll(`.${presetClass}`);

      function updateActivePreset(val) {
        presets.forEach(p => {
          const r = parseInt(p.getAttribute('data-radius'), 10);
          if (r === parseInt(val, 10)) {
            p.className = `${presetClass} px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-600 text-white transition cursor-pointer`;
          } else {
            p.className = `${presetClass} px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer`;
          }
        });
      }

      if (slider && num) {
        slider.addEventListener('input', (e) => {
          num.value = e.target.value;
          updateActivePreset(e.target.value);
          updateStorefrontLivePreview();
        });

        num.addEventListener('input', (e) => {
          let val = parseInt(e.target.value, 10);
          if (isNaN(val)) val = 0;
          const max = parseInt(slider.max, 10) || 32;
          const min = parseInt(slider.min, 10) || 0;
          if (val > max) val = max;
          if (val < min) val = min;
          slider.value = val;
          updateActivePreset(val);
          updateStorefrontLivePreview();
        });
      }

      presets.forEach(p => {
        p.addEventListener('click', () => {
          const r = p.getAttribute('data-radius');
          if (slider) slider.value = r;
          if (num) num.value = r;
          updateActivePreset(r);
          updateStorefrontLivePreview();
        });
      });
    }

    bindRadiusControl('hero-container-radius-slider', 'hero-container-radius-number', 'hero-container-radius-preset');
    bindRadiusControl('hero-image-radius-slider', 'hero-image-radius-number', 'hero-image-radius-preset');

    // Shadow Select Dropdowns
    ['hero-container-shadow-select', 'hero-image-shadow-select'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', updateStorefrontLivePreview);
    });

    // Hero Arrows Navigation Color & Style Bindings
    bindColorPair('hero-arrows-bg-picker', 'hero-arrows-bg');
    bindColorPair('hero-arrows-hover-bg-picker', 'hero-arrows-hover-bg');
    bindColorPair('hero-arrows-icon-color-picker', 'hero-arrows-icon-color');

    ['hero-arrows-bg', 'hero-arrows-hover-bg', 'hero-arrows-icon-color'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', updateStorefrontLivePreview);
    });

    ['hero-arrows-radius', 'hero-arrows-shadow'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', updateStorefrontLivePreview);
    });

    // Hero Arrows Desktop Visibility Radio Change
    document.querySelectorAll('input[name="hero_arrows_visibility_radio"]').forEach(r => {
      r.addEventListener('change', () => {
        document.querySelectorAll('input[name="hero_arrows_visibility_radio"]').forEach(input => {
          const label = input.closest('.hero-arrows-vis-label');
          if (input.checked) {
            label?.classList.add('border-emerald-500', 'bg-emerald-50/50', 'font-bold', 'text-emerald-900', 'ring-1', 'ring-emerald-500/20');
            label?.classList.remove('border-slate-200', 'bg-white', 'text-slate-700');
          } else {
            label?.classList.remove('border-emerald-500', 'bg-emerald-50/50', 'font-bold', 'text-emerald-900', 'ring-1', 'ring-emerald-500/20');
            label?.classList.add('border-slate-200', 'bg-white', 'text-slate-700');
          }
        });
        updateStorefrontLivePreview();
      });
    });

    // Navbar Text-Only Color Pair Bindings
    bindColorPair('ctrl-color-navbar-store-name', 'ctrl-hex-navbar-store-name');
    bindColorPair('ctrl-color-navbar-tagline', 'ctrl-hex-navbar-tagline');

    // Navbar Element Color Pair Bindings (Cart, Badge, Search, Login)
    bindColorPair('ctrl-color-navbar-cart-icon', 'ctrl-hex-navbar-cart-icon');
    bindColorPair('ctrl-color-navbar-cart-badge-bg', 'ctrl-hex-navbar-cart-badge-bg');
    bindColorPair('ctrl-color-navbar-cart-badge-text', 'ctrl-hex-navbar-cart-badge-text');
    bindColorPair('ctrl-color-navbar-search-icon', 'ctrl-hex-navbar-search-icon');
    bindColorPair('ctrl-color-navbar-search-input-bg', 'ctrl-hex-navbar-search-input-bg');
    bindColorPair('ctrl-color-navbar-search-border', 'ctrl-hex-navbar-search-border');
    bindColorPair('ctrl-color-navbar-search-placeholder', 'ctrl-hex-navbar-search-placeholder');
    bindColorPair('ctrl-color-navbar-login-icon', 'ctrl-hex-navbar-login-icon');
    bindColorPair('ctrl-color-navbar-login-text', 'ctrl-hex-navbar-login-text');

    // Live typing on text inputs
    ['store-name-input', 'store-tagline-input', 'store-logo-url-input', 'hero-headline-input', 'hero-subheadline-input', 'hero-bg-angle-input', 'ctrl-hex-top-bar-bg', 'ctrl-hex-top-bar-text', 'ctrl-hex-navbar-store-name', 'ctrl-hex-navbar-tagline', 'ctrl-hex-navbar-cart-icon', 'ctrl-hex-navbar-cart-badge-bg', 'ctrl-hex-navbar-cart-badge-text', 'ctrl-hex-navbar-search-icon', 'ctrl-hex-navbar-search-input-bg', 'ctrl-hex-navbar-search-border', 'ctrl-hex-navbar-search-placeholder', 'ctrl-hex-navbar-login-icon', 'ctrl-hex-navbar-login-text'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', updateStorefrontLivePreview);
    });

    // Select & Checkbox Change Events
    ['hero-bg-type-select', 'hero-show-timer-toggle', 'ctrl-toggle-show-header-store-name'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', updateStorefrontLivePreview);
    });

    // Radio Listeners: Navigasi Kategori (Mobile & Desktop)
    ['category_nav_mode_mobile_radio', 'category_nav_mode_desktop_radio'].forEach(radioName => {
      document.querySelectorAll(`input[name="${radioName}"]`).forEach(r => {
        r.addEventListener('change', () => {
          document.querySelectorAll(`input[name="${radioName}"]`).forEach(input => {
            const card = input.closest('.cat-nav-mode-card');
            const ind = card?.querySelector('.radio-indicator');
            if (input.checked) {
              card?.classList.add('border-emerald-500', 'bg-emerald-50/20', 'shadow-xs');
              card?.classList.remove('border-slate-200', 'bg-white');
              ind?.classList.add('border-emerald-600', 'bg-emerald-600');
              ind?.classList.remove('border-slate-300');
            } else {
              card?.classList.remove('border-emerald-500', 'bg-emerald-50/20', 'shadow-xs');
              card?.classList.add('border-slate-200', 'bg-white');
              ind?.classList.remove('border-emerald-600', 'bg-emerald-600');
              ind?.classList.add('border-slate-300');
            }
          });
          updateStorefrontLivePreview();
        });
      });
    });



    // Radio Hero Model Change
    document.querySelectorAll('input[name="hero_model_radio"]').forEach(r => {
      r.addEventListener('change', syncHeroFormVisibility);
    });

    // Click handler pada kartu pilihan Hero Model
    document.querySelectorAll('.hero-model-card').forEach(card => {
      card.addEventListener('click', () => {
        const mVal = card.getAttribute('data-model');
        if (mVal) {
          const radio = document.querySelector(`input[name="hero_model_radio"][value="${mVal}"]`);
          if (radio && !radio.checked) {
            radio.checked = true;
            syncHeroFormVisibility();
          }
        }
      });
    });

    // Toggle Hero Enable/Disable
    const heroEnableToggleEl = document.getElementById('hero-enable-toggle');
    if (heroEnableToggleEl) {
      heroEnableToggleEl.addEventListener('change', () => {
        syncHeroFormVisibility();
        updateStorefrontLivePreview();
      });
    }

    // Radio Hero Split Desktop Position Change
    document.querySelectorAll('input[name="hero_split_desktop_pos_radio"]').forEach(r => {
      r.addEventListener('change', () => {
        syncHeroFormVisibility();
        updateStorefrontLivePreview();
      });
    });

    // Click handler pada kartu pilihan tata letak hero split desktop
    document.querySelectorAll('.hero-split-desktop-choice-card').forEach(card => {
      card.addEventListener('click', () => {
        const sdVal = card.getAttribute('data-split-desktop');
        if (sdVal) {
          const radio = document.querySelector(`input[name="hero_split_desktop_pos_radio"][value="${sdVal}"]`);
          if (radio && !radio.checked) {
            radio.checked = true;
            syncHeroFormVisibility();
            updateStorefrontLivePreview();
          }
        }
      });
    });

    // Radio Hero Split Mobile Direction Change
    document.querySelectorAll('input[name="hero_split_mobile_radio"]').forEach(r => {
      r.addEventListener('change', () => {
        syncHeroFormVisibility();
        updateStorefrontLivePreview();
      });
    });

    // Click handler pada kartu pilihan tata letak hero split mobile
    document.querySelectorAll('.hero-split-mobile-choice-card').forEach(card => {
      card.addEventListener('click', () => {
        const smVal = card.getAttribute('data-split-mobile');
        if (smVal) {
          const radio = document.querySelector(`input[name="hero_split_mobile_radio"][value="${smVal}"]`);
          if (radio && !radio.checked) {
            radio.checked = true;
            syncHeroFormVisibility();
            updateStorefrontLivePreview();
          }
        }
      });
    });

    // Radio Hero Mobile Ratio Change
    document.querySelectorAll('input[name="hero_mobile_ratio_radio"]').forEach(r => {
      r.addEventListener('change', (e) => {
        const sel = document.getElementById('hero-mobile-ratio-select');
        if (sel) sel.value = e.target.value;
        syncHeroFormVisibility();
        updateStorefrontLivePreview();
      });
    });

    // Dropdown Hero Mobile Ratio Change
    const heroMobileRatioSelect = document.getElementById('hero-mobile-ratio-select');
    if (heroMobileRatioSelect) {
      heroMobileRatioSelect.addEventListener('change', (e) => {
        const radio = document.querySelector(`input[name="hero_mobile_ratio_radio"][value="${e.target.value}"]`);
        if (radio) radio.checked = true;
        syncHeroFormVisibility();
        updateStorefrontLivePreview();
      });
    }

    // Click handler pada kartu pilihan rasio mobile
    document.querySelectorAll('.hero-ratio-choice-card').forEach(card => {
      card.addEventListener('click', () => {
        const rVal = card.getAttribute('data-ratio');
        if (rVal) {
          const radio = document.querySelector(`input[name="hero_mobile_ratio_radio"][value="${rVal}"]`);
          if (radio) radio.checked = true;
          const sel = document.getElementById('hero-mobile-ratio-select');
          if (sel) sel.value = rVal;
          syncHeroFormVisibility();
          updateStorefrontLivePreview();
        }
      });
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
        show_header_store_name: showHeaderStoreName,
        navbar_cart_icon_color: document.getElementById('ctrl-hex-navbar-cart-icon')?.value.trim() || settings.navbar_cart_icon_color || '#334155',
        navbar_cart_badge_bg: document.getElementById('ctrl-hex-navbar-cart-badge-bg')?.value.trim() || settings.navbar_cart_badge_bg || '#f43f5e',
        navbar_cart_badge_text: document.getElementById('ctrl-hex-navbar-cart-badge-text')?.value.trim() || settings.navbar_cart_badge_text || '#ffffff',
        navbar_search_icon_color: document.getElementById('ctrl-hex-navbar-search-icon')?.value.trim() || settings.navbar_search_icon_color || '#94a3b8',
        navbar_search_input_bg: document.getElementById('ctrl-hex-navbar-search-input-bg')?.value.trim() || settings.navbar_search_input_bg || '#f1f5f9',
        navbar_search_border_color: document.getElementById('ctrl-hex-navbar-search-border')?.value.trim() || settings.navbar_search_border_color || '#e2e8f0',
        navbar_search_placeholder_color: document.getElementById('ctrl-hex-navbar-search-placeholder')?.value.trim() || settings.navbar_search_placeholder_color || '#94a3b8',
        navbar_login_icon_color: document.getElementById('ctrl-hex-navbar-login-icon')?.value.trim() || settings.navbar_login_icon_color || '#334155',
        navbar_login_text_color: document.getElementById('ctrl-hex-navbar-login-text')?.value.trim() || settings.navbar_login_text_color || '#334155'
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
      toggleArrows.addEventListener('change', () => {
        const panel = document.getElementById('hero-arrows-customization-panel');
        if (panel) {
          if (toggleArrows.checked) panel.classList.remove('hidden');
          else panel.classList.add('hidden');
        }
        updateStorefrontLivePreview();
      });
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

        const topBarBg = document.getElementById('ctrl-hex-top-bar-bg')?.value.trim() || '#0f172a';
        const topBarText = document.getElementById('ctrl-hex-top-bar-text')?.value.trim() || '#f8fafc';
        const categoryNavModeMobile = document.querySelector('input[name="category_nav_mode_mobile_radio"]:checked')?.value || 'icon_image';
        const categoryNavModeDesktop = document.querySelector('input[name="category_nav_mode_desktop_radio"]:checked')?.value || 'icon_image';

        const navbarBg = document.getElementById('ctrl-hex-navbar-bg')?.value.trim() || '#ffffff';
        const navbarText = document.getElementById('ctrl-hex-navbar-text')?.value.trim() || '#0f172a';
        const bodyBg = document.getElementById('ctrl-hex-body-bg')?.value.trim() || '#f8fafc';
        const primColor = document.getElementById('ctrl-hex-primary')?.value.trim() || '#33b589';
        const secColor = document.getElementById('ctrl-hex-secondary')?.value.trim() || '#f59e0b';

        const selectedHeroModel = document.querySelector('input[name="hero_model_radio"]:checked')?.value || 'non_split';
        const heroEnabledVal = document.getElementById('hero-enable-toggle')?.checked !== false;
        const selectedHeroWidthLayout = document.querySelector('input[name="hero_width_layout_radio"]:checked')?.value || 'boxed';
        const selectedHeroSplitMobile = document.querySelector('input[name="hero_split_mobile_radio"]:checked')?.value || 'image_top';
        const selectedHeroSplitDesktop = document.querySelector('input[name="hero_split_desktop_pos_radio"]:checked')?.value || 'text_left';
        const heroShowArrowsVal = document.getElementById('hero-show-arrows-toggle')?.checked !== false;

        const headline = document.getElementById('hero-headline-input')?.value.trim() || '';
        const subheadline = document.getElementById('hero-subheadline-input')?.value.trim() || '';

        // Hero Background & Styling Values
        const heroBgTypeVal = document.getElementById('hero-bg-type-select')?.value || 'linear_gradient';
        const heroBgColor1Val = document.getElementById('hero-bg-color1-hex')?.value.trim() || '#0f172a';
        const heroBgColor2Val = document.getElementById('hero-bg-color2-hex')?.value.trim() || '#064e3b';
        const heroBgAngleVal = parseInt(document.getElementById('hero-bg-angle-input')?.value || '135', 10);
        const heroTitleColorVal = document.getElementById('hero-title-color-hex')?.value.trim() || '#0f172a';
        const heroDescColorVal = document.getElementById('hero-desc-color-hex')?.value.trim() || '#475569';
        const heroSubtitleColorVal = document.getElementById('hero-subtitle-color-hex')?.value.trim() || heroDescColorVal;
        const heroShowTimerVal = document.getElementById('hero-show-timer-toggle')?.checked !== false;

        // Hero Container Customization (0px - 32px & shadow)
        const heroContainerRadiusVal = (document.getElementById('hero-container-radius-number')?.value ?? '16') + 'px';
        const heroContainerShadowVal = document.getElementById('hero-container-shadow-select')?.value || 'sm';

        // Hero Split Image Box Customization (0px - 24px & shadow)
        const heroImageRadiusVal = (document.getElementById('hero-image-radius-number')?.value ?? '12') + 'px';
        const heroImageShadowVal = document.getElementById('hero-image-shadow-select')?.value || 'sm';

        // Hero Manual Arrows Navigation Customization
        const heroArrowsBgVal = document.getElementById('hero-arrows-bg')?.value.trim() || 'rgba(0,0,0,0.45)';
        const heroArrowsHoverBgVal = document.getElementById('hero-arrows-hover-bg')?.value.trim() || 'rgba(0,0,0,0.75)';
        const heroArrowsIconColorVal = document.getElementById('hero-arrows-icon-color')?.value.trim() || '#ffffff';
        const heroArrowsRadiusVal = document.getElementById('hero-arrows-radius')?.value || '9999px';
        const heroArrowsShadowVal = document.getElementById('hero-arrows-shadow')?.value || 'sm';
        const heroArrowsVisibilityVal = document.querySelector('input[name="hero_arrows_visibility_radio"]:checked')?.value || 'hover';

        // Hero Dots Navigation Colors
        const heroDotsActiveColorVal = document.getElementById('hero-dots-active-hex')?.value.trim() || '#10b981';
        const heroDotsInactiveColorVal = document.getElementById('hero-dots-inactive-hex')?.value.trim() || '#cbd5e1';

        // Navbar Header Branding Rules
        const navbarBrandingModeVal = document.querySelector('input[name="navbar_branding_mode_radio"]:checked')?.value || settings.navbar_branding_mode || 'logo_landscape';
        const navbarStoreNameColorVal = document.getElementById('ctrl-hex-navbar-store-name')?.value.trim() || settings.navbar_store_name_color || '#0f172a';
        const navbarTaglineColorVal = document.getElementById('ctrl-hex-navbar-tagline')?.value.trim() || settings.navbar_tagline_color || '#64748b';
        const showHeaderStoreNameVal = document.getElementById('ctrl-toggle-show-header-store-name')?.checked !== false;

        // Card Product Version
        const cardProductVersionVal = document.querySelector('input[name="card_product_version_radio"]:checked')?.value || settings.card_product_version || 'v1';

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
          top_bar_bg_color: topBarBg,
          top_bar_text_color: topBarText,
          category_nav_mode_mobile: categoryNavModeMobile,
          category_nav_mode_desktop: categoryNavModeDesktop,
          navbar_bg_color: navbarBg,
          navbar_text_color: navbarText,
          body_bg_color: bodyBg,
          primary_color: primColor,
          secondary_color: secColor,
          card_product_version: cardProductVersionVal,
          hero_enabled: heroEnabledVal,
          enable_hero: heroEnabledVal,
          hero_model: selectedHeroModel,
          hero_mobile_ratio: '16:5',
          hero_width_layout: selectedHeroWidthLayout,
          hero_split_mobile: selectedHeroSplitMobile,
          hero_split_desktop_pos: selectedHeroSplitDesktop,
          hero_show_arrows: heroShowArrowsVal,
          hero_arrows_bg: heroArrowsBgVal,
          hero_arrows_hover_bg: heroArrowsHoverBgVal,
          hero_arrows_icon_color: heroArrowsIconColorVal,
          hero_arrows_radius: heroArrowsRadiusVal,
          hero_arrows_shadow: heroArrowsShadowVal,
          hero_arrows_visibility: heroArrowsVisibilityVal,
          hero_type: selectedHeroModel === 'model_1' ? 'text' : 'banner', // backward compat
          hero_headline: headline,
          hero_subheadline: subheadline,
          hero_container_radius: heroContainerRadiusVal,
          hero_container_shadow: heroContainerShadowVal,
          hero_title_color: heroTitleColorVal,
          hero_desc_color: heroDescColorVal,
          hero_image_radius: heroImageRadiusVal,
          hero_image_shadow: heroImageShadowVal,
          hero_dots_active_color: heroDotsActiveColorVal,
          hero_dots_inactive_color: heroDotsInactiveColorVal,
          // Hero Background & Text styling
          hero_bg_type: heroBgTypeVal,
          hero_bg_color1: heroBgColor1Val,
          hero_bg_color2: heroBgColor2Val,
          hero_bg_angle: heroBgAngleVal,
          hero_subtitle_color: heroSubtitleColorVal,
          hero_show_timer: heroShowTimerVal,
          // Header Navbar Branding Rules
          navbar_branding_mode: navbarBrandingModeVal,
          navbar_store_name_color: navbarStoreNameColorVal,
          navbar_tagline_color: navbarTaglineColorVal,
          header_use_logo: navbarBrandingModeVal !== 'text_only',
          show_header_store_name: showHeaderStoreNameVal,
          // Kustomisasi Warna Elemen Navbar Toko
          navbar_cart_icon_color: document.getElementById('ctrl-hex-navbar-cart-icon')?.value.trim() || settings.navbar_cart_icon_color || '#334155',
          navbar_cart_badge_bg: document.getElementById('ctrl-hex-navbar-cart-badge-bg')?.value.trim() || settings.navbar_cart_badge_bg || '#f43f5e',
          navbar_cart_badge_text: document.getElementById('ctrl-hex-navbar-cart-badge-text')?.value.trim() || settings.navbar_cart_badge_text || '#ffffff',
          navbar_search_icon_color: document.getElementById('ctrl-hex-navbar-search-icon')?.value.trim() || settings.navbar_search_icon_color || '#94a3b8',
          navbar_search_input_bg: document.getElementById('ctrl-hex-navbar-search-input-bg')?.value.trim() || settings.navbar_search_input_bg || '#f1f5f9',
          navbar_search_border_color: document.getElementById('ctrl-hex-navbar-search-border')?.value.trim() || settings.navbar_search_border_color || '#e2e8f0',
          navbar_search_placeholder_color: document.getElementById('ctrl-hex-navbar-search-placeholder')?.value.trim() || settings.navbar_search_placeholder_color || '#94a3b8',
          navbar_login_icon_color: document.getElementById('ctrl-hex-navbar-login-icon')?.value.trim() || settings.navbar_login_icon_color || '#334155',
          navbar_login_text_color: document.getElementById('ctrl-hex-navbar-login-text')?.value.trim() || settings.navbar_login_text_color || '#334155',
          hero_banner_image: bannerImg,
          hero_banners: heroBanners,
          hero_slider_animation: sliderAnimation,
          enable_customer_greeting: enableGreeting
        };

        DB.saveSettings(updatedSettings);
        syncHeaderAndTheme();
        showToast('Tema, Warna Toko, Navigasi Kategori & Hero Banner berhasil disimpan!', 'success');
      });
    }

    // Accordion Header Toggle
    document.querySelectorAll('.theme-accordion-header').forEach(hdr => {
      hdr.addEventListener('click', () => {
        const targetId = hdr.getAttribute('data-target');
        const bodyEl = document.getElementById(targetId);
        if (!bodyEl) return;
        const isOpen = hdr.classList.contains('is-open');
        if (isOpen) {
          hdr.classList.remove('is-open');
          bodyEl.classList.add('is-collapsed');
        } else {
          hdr.classList.add('is-open');
          bodyEl.classList.remove('is-collapsed');
        }
      });
    });

    // Mobile Tab Switcher (< 768px): Pengaturan Tools vs Pratinjau Toko
    const btnThemeTabTools = document.getElementById('btn-theme-tab-tools');
    const btnThemeTabPreview = document.getElementById('btn-theme-tab-preview');
    const themeCanvasCol = document.getElementById('theme-canvas-container');
    const themeInspectorCol = document.getElementById('theme-inspector-container');

    if (btnThemeTabTools && btnThemeTabPreview && themeCanvasCol && themeInspectorCol) {
      btnThemeTabTools.addEventListener('click', () => {
        btnThemeTabTools.className = 'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-emerald-600 text-white shadow-xs cursor-pointer';
        btnThemeTabPreview.className = 'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer';
        themeInspectorCol.classList.remove('is-tab-hidden');
        themeCanvasCol.classList.add('is-tab-hidden');
      });

      btnThemeTabPreview.addEventListener('click', () => {
        btnThemeTabPreview.className = 'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-emerald-600 text-white shadow-xs cursor-pointer';
        btnThemeTabTools.className = 'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer';
        themeCanvasCol.classList.remove('is-tab-hidden');
        themeInspectorCol.classList.add('is-tab-hidden');
        updateStorefrontLivePreview();
      });
    }

    // Product Card Style Selection Handlers
    document.querySelectorAll('input[name="card_product_version_radio"]').forEach(r => {
      r.addEventListener('change', (e) => {
        const val = e.target.value;
        document.querySelectorAll('.card-style-choice-card').forEach(card => {
          const cVer = card.getAttribute('data-card-ver');
          if (cVer === val) {
            card.className = 'card-style-choice-card p-3 rounded-2xl border-2 border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500/20 cursor-pointer transition flex items-start gap-3';
          } else {
            card.className = 'card-style-choice-card p-3 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition flex items-start gap-3';
          }
        });
        updateStorefrontLivePreview();
      });
    });

    document.querySelectorAll('.card-style-choice-card').forEach(card => {
      card.addEventListener('click', () => {
        const radio = card.querySelector('input[name="card_product_version_radio"]');
        if (radio && !radio.checked) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change'));
        }
      });
    });

    // Category Nav Radios Live Update
    document.querySelectorAll('input[name="category_nav_mode_mobile_radio"], input[name="category_nav_mode_desktop_radio"]').forEach(r => {
      r.addEventListener('change', () => {
        updateStorefrontLivePreview();
      });
    });

    // Initial sync
    syncHeroFormVisibility();
    setHeroPreviewWidth(1200);
    if (window.lucide) window.lucide.createIcons();
  }


  // ----------------------------------------------------------------------------
  // 15. UTILITY HELPERS
  // ----------------------------------------------------------------------------
  function escapeHtml(text) {
    if (typeof Utils !== 'undefined' && typeof Utils.escapeHtml === 'function') {
      return Utils.escapeHtml(text);
    }
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatIDR(num) {
    if (typeof Utils !== 'undefined' && typeof Utils.formatIDR === 'function') {
      return Utils.formatIDR(num);
    }
    return 'Rp' + Math.round(num || 0).toLocaleString('id-ID');
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
    checkFeatureAccess,
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


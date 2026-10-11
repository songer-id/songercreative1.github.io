/**
 * Songer Creative - Main Application Orchestrator & View Controller
 * Dual Mode Switcher: Mode Pembeli (Storefront) & Seller Center
 */

const App = (() => {
  let appMode = 'buyer'; // 'buyer' | 'seller'
  let currentSellerView = 'list'; // 'list' | 'create' | 'edit' | 'categories' | 'promos' | 'reviews'

  function init() {
    // 1. Initial Settings Synchronization
    applySettings();

    // 2. Global Header Mode Switcher Listeners
    const btnModeBuyer = document.getElementById('btn-mode-buyer');
    const btnModeSeller = document.getElementById('btn-mode-seller');
    const brandLogoBtn = document.getElementById('nav-brand-logo-btn');

    if (btnModeBuyer) {
      btnModeBuyer.addEventListener('click', () => switchMode('buyer'));
    }

    if (btnModeSeller) {
      btnModeSeller.addEventListener('click', () => switchMode('seller'));
    }

    if (brandLogoBtn) {
      brandLogoBtn.addEventListener('click', () => switchMode('buyer'));
    }

    // 3. Seller Navigation Listeners
    const btnNavList = document.getElementById('nav-menu-products');
    const btnNavAdd = document.getElementById('nav-menu-add-product');
    const btnNavCategories = document.getElementById('nav-menu-categories');
    const btnNavPromos = document.getElementById('nav-menu-promos');
    const btnNavReviews = document.getElementById('nav-menu-reviews');
    const btnResetDb = document.getElementById('btn-reset-db');

    if (btnNavList) {
      btnNavList.addEventListener('click', e => {
        e.preventDefault();
        navigate('list');
      });
    }

    if (btnNavAdd) {
      btnNavAdd.addEventListener('click', e => {
        e.preventDefault();
        navigate('create');
      });
    }

    if (btnNavCategories) {
      btnNavCategories.addEventListener('click', e => {
        e.preventDefault();
        navigate('categories');
      });
    }

    if (btnNavPromos) {
      btnNavPromos.addEventListener('click', e => {
        e.preventDefault();
        navigate('promos');
      });
    }

    if (btnNavReviews) {
      btnNavReviews.addEventListener('click', e => {
        e.preventDefault();
        navigate('reviews');
      });
    }

    if (btnResetDb) {
      btnResetDb.addEventListener('click', () => {
        if (confirm('Reset database ke data awal contoh percetakan? Semua produk modifikasi akan dikembalikan ke default.')) {
          DB.reset();
          applySettings();
          showToast('Database berhasil di-reset ke data bawaan.', 'info');
          if (appMode === 'buyer') {
            BuyerStore.init();
          } else {
            navigate('list');
          }
        }
      });
    }

    // 4. Store Settings & Logo Modal Listeners
    bindSettingsModalEvents();

    // 5. Default start in Buyer Mode
    switchMode('buyer');
  }

  // Switch between Buyer Storefront and Seller Center
  function switchMode(mode) {
    appMode = mode;

    const workspaceBuyer = document.getElementById('workspace-buyer');
    const workspaceSeller = document.getElementById('workspace-seller');
    const btnModeBuyer = document.getElementById('btn-mode-buyer');
    const btnModeSeller = document.getElementById('btn-mode-seller');
    const modeBadge = document.getElementById('header-mode-badge');

    if (mode === 'buyer') {
      if (workspaceBuyer) workspaceBuyer.classList.remove('hidden');
      if (workspaceSeller) workspaceSeller.classList.add('hidden');

      if (btnModeBuyer) {
        btnModeBuyer.className = 'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs bg-white text-emerald-700';
      }
      if (btnModeSeller) {
        btnModeSeller.className = 'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition text-slate-600 hover:text-slate-900';
      }
      if (modeBadge) {
        modeBadge.textContent = 'Mode Pembeli';
        modeBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide';
      }

      BuyerStore.init();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (workspaceBuyer) workspaceBuyer.classList.add('hidden');
      if (workspaceSeller) workspaceSeller.classList.remove('hidden');

      if (btnModeSeller) {
        btnModeSeller.className = 'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs bg-white text-emerald-700';
      }
      if (btnModeBuyer) {
        btnModeBuyer.className = 'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition text-slate-600 hover:text-slate-900';
      }
      if (modeBadge) {
        modeBadge.textContent = 'Seller Center';
        modeBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-emerald-400 uppercase tracking-wide';
      }

      navigate(currentSellerView || 'list');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // Synchronize store name, tagline, and logo images across UI
  function applySettings() {
    const settings = DB.getSettings();

    // Document title
    document.title = `${settings.store_name} - Toko Online & POS Percetakan`;

    // Browser Favicon
    const faviconEl = document.getElementById('app-favicon');
    if (faviconEl && settings.browser_icon) {
      faviconEl.href = settings.browser_icon;
    }

    // Header Web Logo
    const headerLogoEl = document.getElementById('header-brand-logo');
    if (headerLogoEl && settings.web_logo) {
      headerLogoEl.src = settings.web_logo;
      headerLogoEl.alt = settings.store_name;
    }

    // Header Text
    const storeNameEl = document.getElementById('header-store-name');
    if (storeNameEl) storeNameEl.textContent = settings.store_name;

    const taglineEl = document.getElementById('header-store-tagline');
    if (taglineEl) taglineEl.textContent = settings.store_tagline;

    // Sidebar text
    const sidebarNameEl = document.getElementById('sidebar-store-name');
    if (sidebarNameEl) sidebarNameEl.textContent = settings.store_name;

    // Dynamic Dual-Color Brand Theme (:root CSS variables)
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

  function bindSettingsModalEvents() {
    const btnOpenHeader = document.getElementById('btn-open-settings');
    const btnOpenSidebar = document.getElementById('sidebar-btn-settings');
    [btnOpenHeader, btnOpenSidebar].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', (e) => {
          window.location.href = 'settings.html';
        });
      }
    });
  }

  function navigate(view, param = null) {
    currentSellerView = view;

    const listView = document.getElementById('view-product-list');
    const formView = document.getElementById('view-product-form');
    const catView = document.getElementById('view-category-manager');
    const promoView = document.getElementById('view-promo-manager');
    const revView = document.getElementById('view-review-manager');

    // Hide all seller views first
    [listView, formView, catView, promoView, revView].forEach(v => {
      if (v) v.classList.add('hidden');
    });

    // Sidebar active state highlight reset
    const navList = document.getElementById('nav-menu-products');
    const navAdd = document.getElementById('nav-menu-add-product');
    const navCat = document.getElementById('nav-menu-categories');
    const navPromo = document.getElementById('nav-menu-promos');
    const navRev = document.getElementById('nav-menu-reviews');

    const navItems = [
      { id: 'list', el: navList },
      { id: 'create', el: navAdd },
      { id: 'categories', el: navCat },
      { id: 'promos', el: navPromo },
      { id: 'reviews', el: navRev }
    ];

    navItems.forEach(item => {
      if (item.el) {
        if (item.id === view || (item.id === 'create' && view === 'edit')) {
          item.el.classList.add('bg-emerald-50', 'text-emerald-700', 'font-bold');
          item.el.classList.remove('text-slate-600');
        } else {
          item.el.classList.remove('bg-emerald-50', 'text-emerald-700', 'font-bold');
          item.el.classList.add('text-slate-600');
        }
      }
    });

    if (view === 'list') {
      if (listView) listView.classList.remove('hidden');
      ProductList.init();
    } else if (view === 'create') {
      if (formView) formView.classList.remove('hidden');
      ProductForm.initCreate();
    } else if (view === 'edit') {
      if (formView) formView.classList.remove('hidden');
      ProductForm.initEdit(param);
    } else if (view === 'categories') {
      if (catView) catView.classList.remove('hidden');
      if (window.CategoryManager) CategoryManager.init();
    } else if (view === 'promos') {
      if (promoView) promoView.classList.remove('hidden');
      if (window.PromoManager) PromoManager.init();
    } else if (view === 'reviews') {
      if (revView) revView.classList.remove('hidden');
      if (window.ReviewManager) ReviewManager.init();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.lucide) window.lucide.createIcons();
  }

  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const isSuccess = type === 'success';
    const isInfo = type === 'info';

    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-xs font-semibold animate-slide-in pointer-events-auto transition-all duration-300 ${
      isSuccess 
        ? 'bg-emerald-900 text-white border-emerald-700 shadow-emerald-950/20' 
        : isInfo
        ? 'bg-slate-900 text-white border-slate-700 shadow-slate-950/20'
        : 'bg-red-900 text-white border-red-700 shadow-red-950/20'
    }`;

    toast.innerHTML = `
      <i data-lucide="${isSuccess ? 'check-circle' : isInfo ? 'info' : 'alert-circle'}" class="w-4 h-4 text-emerald-400 shrink-0"></i>
      <span class="flex-1">${message}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  return {
    init,
    switchMode,
    navigate,
    showToast,
    applySettings
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

/**
 * ==============================================================================
 * POS BY SONGER CREATIVE - DEDICATED PRODUCT DETAIL PAGE (PDP) CONTROLLER
 * Realtime Configurator, Interactive Gallery, Pricing Engine, Tabs & Mobile Bar
 * Location: D:\pos-songer-creative\js\pdp.js
 * ==============================================================================
 */

(function () {
  'use strict';

  let currentProduct = null;
  let allProducts = [];
  let cart = [];
  let visibleSimilarCount = 4;

  // State Konfigurator Aktif
  const configState = {
    selectedMaterialId: null,
    selectedFinishingId: null,
    extraFinishingIds: [],
    lengthCm: 100,
    widthCm: 100,
    qty: 1,
    driveLink: '',
    notes: '',
    selectedStarRating: 5
  };

  // ----------------------------------------------------------------------------
  // 1. INISIALISASI & LOAD PRODUK
  // ----------------------------------------------------------------------------

  let currentStoreSlug = 'songer-creative-01';

  function init() {
    loadCartFromStorage();

    // 1. Resolve Tenant from URL (?store=...)
    const urlParams = new URLSearchParams(window.location.search);
    const storeParam = urlParams.get('store');
    const tenant = DB.resolveTenant(storeParam);
    currentStoreSlug = tenant ? tenant.store_slug : 'songer-creative-01';

    applyStoreBranding();

    // Update navigation links to retain store slug
    document.querySelectorAll('a[href="index.html"]').forEach(a => {
      a.href = `index.html?store=${currentStoreSlug}`;
    });

    const searchForm = document.querySelector('form[action="index.html"]');
    if (searchForm) {
      searchForm.action = `index.html?store=${currentStoreSlug}`;
    }

    // 2. Ambil ID Produk dari URL Query Parameter (?id=...)
    const productId = urlParams.get('id');

    if (!productId) {
      showNotFound();
      return;
    }

    // 3. Ambil seluruh produk & temukan produk target
    allProducts = DB.getAllProducts({ status: 'active' });
    currentProduct = DB.getProductById(productId);

    if (!currentProduct) {
      showNotFound();
      return;
    }

    // 3. Render Komponen PDP
    renderProductHeader();
    renderGallery();
    renderConfigurator();
    renderTabs();
    renderReviews();
    renderSimilarProducts();
    renderBestSeller();

    // 4. Hitung Harga Awal
    recalculatePrice();

    // 5. Bind Global Events
    bindPDPEvents();

    // Sembunyikan loading, tampilkan konten
    document.getElementById('pdp-loading').classList.add('hidden');
    document.getElementById('pdp-content').classList.remove('hidden');

    if (window.lucide) window.lucide.createIcons();
  }

  function showNotFound() {
    const loading = document.getElementById('pdp-loading');
    const notFound = document.getElementById('pdp-not-found');
    if (loading) loading.classList.add('hidden');
    if (notFound) notFound.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  function loadCartFromStorage() {
    try {
      const saved = localStorage.getItem('songer_buyer_cart');
      if (saved) cart = JSON.parse(saved);
    } catch (e) {
      cart = [];
    }
    updateCartBadge();
  }

  function saveCartToStorage() {
    try {
      localStorage.setItem('songer_buyer_cart', JSON.stringify(cart));
    } catch (e) {}
    updateCartBadge();
  }

  function applyHeaderBranding(settings) {
    const navLogo = document.getElementById('header-brand-logo');
    const logoContainer = document.getElementById('header-logo-container');
    const storeInfoBox = document.getElementById('header-store-info-box');
    const storeNameEl = document.getElementById('header-store-name');
    const storeTaglineEl = document.getElementById('header-store-tagline');

    if (storeNameEl) storeNameEl.textContent = settings.store_name || 'Songer Creative';
    if (storeTaglineEl) storeTaglineEl.textContent = settings.store_tagline || 'Digital Printing & Percetakan Terpadu';
    if (navLogo && settings.web_logo) navLogo.src = settings.web_logo;

    if (!logoContainer && !storeInfoBox) return;

    const useLogo = settings.header_use_logo !== false && !!settings.web_logo;
    const showDesktopName = settings.show_header_store_name !== false;
    const mobileDisplay = settings.header_mobile_display || 'logo'; // 'logo' | 'name'

    if (!useLogo) {
      // 1. MODE TANPA LOGO: Baik Mobile maupun Desktop HANYA menampilkan Nama Toko secara rapi tanpa logo
      if (logoContainer) {
        logoContainer.className = 'hidden';
      }
      if (storeInfoBox) {
        storeInfoBox.className = 'flex flex-col justify-center border-l-0 pl-0';
      }
      if (storeTaglineEl) {
        storeTaglineEl.className = 'text-[10px] text-slate-500 block truncate max-w-[200px] hidden sm:block';
      }
    } else {
      // 2. MODE MENGGUNAKAN LOGO:
      // Aturan Versi Mobile (< sm): HANYA BOLEH salah satu (Logo saja ATAU Nama saja)
      // Aturan Versi Desktop (>= sm): Bisa Logo saja ATAU Logo + Nama Toko
      if (mobileDisplay === 'name') {
        // Mobile: Nama Toko Saja (Logo sembunyi di HP)
        if (logoContainer) {
          logoContainer.className = 'h-10 hidden sm:flex items-center';
        }
        if (storeInfoBox) {
          if (showDesktopName) {
            // Desktop: Logo + Nama Toko. Mobile: Nama Toko Saja (tanpa border di mobile)
            storeInfoBox.className = 'flex flex-col justify-center border-l-0 pl-0 sm:border-l sm:border-slate-200 sm:pl-3';
          } else {
            // Desktop: Logo Saja. Mobile: Nama Toko Saja.
            storeInfoBox.className = 'flex flex-col justify-center border-l-0 pl-0 sm:hidden';
          }
        }
      } else {
        // Mobile: Logo Saja (Default) (Nama Toko sembunyi di HP)
        if (logoContainer) {
          logoContainer.className = 'h-10 flex items-center';
        }
        if (storeInfoBox) {
          if (showDesktopName) {
            // Desktop: Logo + Nama Toko. Mobile: Nama Toko sembunyi
            storeInfoBox.className = 'border-l border-slate-200 pl-3 hidden sm:flex flex-col justify-center';
          } else {
            // Desktop: Logo Saja. Mobile: Logo Saja. Teks nama toko tidak tampil sama sekali!
            storeInfoBox.className = 'hidden';
          }
        }
      }
    }
  }

  function applyStoreBranding() {
    const settings = DB.getSettings();

    // Injeksi Dual-Color Theme ke CSS Variables Root
    const primaryColor = settings.primary_color || '#33b589';
    const primaryHover = (typeof adjustColorBrightness === 'function')
      ? adjustColorBrightness(primaryColor, -15)
      : ((typeof Utils !== 'undefined' && Utils.adjustColorBrightness) ? Utils.adjustColorBrightness(primaryColor, -15) : (settings.primary_hover_color || primaryColor));
    const secondaryColor = settings.secondary_color || '#f59e0b';
    const secondaryHover = (typeof adjustColorBrightness === 'function')
      ? adjustColorBrightness(secondaryColor, -15)
      : ((typeof Utils !== 'undefined' && Utils.adjustColorBrightness) ? Utils.adjustColorBrightness(secondaryColor, -15) : (settings.secondary_hover_color || secondaryColor));

    const root = document.documentElement;
    root.style.setProperty('--color-primary', primaryColor);
    root.style.setProperty('--color-primary-hover', primaryHover);
    root.style.setProperty('--color-primary-subtle', hexToRgba(primaryColor, 0.12));

    root.style.setProperty('--color-secondary', secondaryColor);
    root.style.setProperty('--color-secondary-hover', secondaryHover);
    root.style.setProperty('--color-secondary-subtle', hexToRgba(secondaryColor, 0.14));

    // Logo & Header Toko
    const brandLogo = document.getElementById('header-brand-logo');
    if (brandLogo && settings.web_logo) brandLogo.src = settings.web_logo;

    const favicon = document.getElementById('app-favicon');
    if (favicon && settings.browser_icon) favicon.href = settings.browser_icon;

    // Sinkronisasi Header Navbar Branding (Aturan Responsive Desktop & Layar HP)
    applyHeaderBranding(settings);

    // Nomor WhatsApp Seller untuk Mobile Button
    const mobileWaBtn = document.getElementById('btn-mobile-wa');
    if (mobileWaBtn) {
      mobileWaBtn.href = `https://wa.me/628885844380?text=${encodeURIComponent('Halo ' + settings.store_name + ', saya ingin bertanya seputar produk...')}`;
    }
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
  // 3. RENDER HEADER PRODUK & BREADCRUMBS
  // ----------------------------------------------------------------------------

  function renderProductHeader() {
    const prod = currentProduct;
    document.title = `${prod.name} - ${DB.getSettings().store_name}`;

    // Breadcrumbs
    const bcCat = document.getElementById('breadcrumb-category');
    if (bcCat) bcCat.textContent = prod.category_name || 'Percetakan';

    const bcSub = document.getElementById('breadcrumb-subcategory');
    if (bcSub) bcSub.textContent = prod.sub_category_name || 'Produk';

    const bcTitle = document.getElementById('breadcrumb-product-name');
    if (bcTitle) bcTitle.textContent = prod.name;

    // Title & Category Tag
    const titleEl = document.getElementById('pdp-product-title');
    if (titleEl) titleEl.textContent = prod.name;

    const catTag = document.getElementById('pdp-category-tag');
    if (catTag) catTag.textContent = prod.category_name || 'Digital Printing';

    // Stock Badge
    const stockBadge = document.getElementById('pdp-stock-badge');
    if (stockBadge) {
      if (prod.is_unlimited_stock) {
        stockBadge.textContent = 'Stok Siap Cetak';
        stockBadge.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200';
      } else {
        stockBadge.textContent = `Sisa ${prod.stock || 0} unit`;
        stockBadge.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200';
      }
    }

    // Rating & Terjual
    const ratingAvg = document.getElementById('pdp-rating-avg');
    if (ratingAvg) ratingAvg.textContent = Number(prod.rating_avg || 5.0).toFixed(1);

    const reviewCount = document.getElementById('pdp-review-count');
    if (reviewCount) reviewCount.textContent = `(${prod.reviews ? prod.reviews.length : 0} ulasan)`;

    const salesCount = document.getElementById('pdp-sales-count');
    if (salesCount) salesCount.textContent = `${prod.sales_count || 120}+`;

    // Formula Badge
    const formulaName = document.getElementById('pdp-formula-name');
    if (formulaName) {
      const typeLabels = {
        1: '1. Meter (P x L cm)',
        2: '2. KombF (Bahan + Finishing)',
        4: '4. Paket (Bundle Promo)',
        5: '5. Kg (Bobot Riil)',
        6: '6. Lt (Volume Liter)',
        7: '7. KombStep (Kelipatan Qty)'
      };
      formulaName.textContent = typeLabels[prod.price_type] || 'Kustom Cetak';
    }
  }

  // ----------------------------------------------------------------------------
  // 4. RENDER GALERI & THUMBNAIL INTERAKTIF
  // ----------------------------------------------------------------------------

  function renderGallery() {
    const prod = currentProduct;
    const mainImg = document.getElementById('pdp-main-image');
    const thumbContainer = document.getElementById('pdp-thumbnails-container');

    const defaultImg = prod.image_url || 'assets/images/logo-songer-creative.png';
    if (mainImg) {
      mainImg.src = defaultImg;
      mainImg.alt = prod.name;
    }

    // Discount Badge Overlay
    const discBadge = document.getElementById('pdp-discount-badge');
    if (discBadge) {
      if (prod.has_monthly_discount) {
        const discTxt = prod.discount_type === 'percent' 
          ? `${prod.discount_value}% OFF` 
          : `-${PricingCalculator.formatIDR(prod.discount_value)}`;
        discBadge.textContent = discTxt;
        discBadge.classList.remove('hidden');
      } else {
        discBadge.classList.add('hidden');
      }
    }

    // Variant Badge Overlay
    const variantBadge = document.getElementById('pdp-variant-badge');
    if (variantBadge) {
      const variantMap = {
        'A': { icon: 'calculator', text: 'Hitungan Meter & Kustom' },
        'B': { icon: 'palette', text: 'Jasa Desain Portofolio' },
        'C': { icon: 'tag', text: 'Grosir & Retail Ready' }
      };
      const v = variantMap[prod.card_variant] || variantMap['A'];
      variantBadge.innerHTML = `<i data-lucide="${v.icon}" class="w-3.5 h-3.5 text-emerald-600"></i><span>${v.text}</span>`;
    }

    // Bangun Daftar Thumbnail (Semua Foto Produk + Foto Bahan Tambahan)
    let imagesList = [];
    if (Array.isArray(prod.images) && prod.images.length > 0) {
      imagesList = [...prod.images];
    } else if (defaultImg) {
      imagesList = [defaultImg];
    }
    if (Array.isArray(prod.materials)) {
      prod.materials.forEach(m => {
        if (m.sample_image && !imagesList.includes(m.sample_image)) {
          imagesList.push(m.sample_image);
        }
      });
    }

    if (thumbContainer) {
      thumbContainer.innerHTML = imagesList.map((src, idx) => `
        <button type="button" class="pdp-thumbnail-btn w-16 h-16 rounded-2xl bg-white border-2 border-slate-200 overflow-hidden shrink-0 transition hover:border-emerald-500 ${idx === 0 ? 'pdp-thumbnail-active' : ''}" data-src="${src}">
          <img src="${src}" alt="Thumbnail ${idx + 1}" class="w-full h-full object-cover" />
        </button>
      `).join('');

      // Event Listener Ganti Gambar Utama Saat Thumbnail Diklik
      thumbContainer.querySelectorAll('.pdp-thumbnail-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const newSrc = btn.getAttribute('data-src');
          if (mainImg) {
            mainImg.style.opacity = '0.5';
            setTimeout(() => {
              mainImg.src = newSrc;
              mainImg.style.opacity = '1';
            }, 100);
          }
          thumbContainer.querySelectorAll('.pdp-thumbnail-btn').forEach(b => b.classList.remove('pdp-thumbnail-active'));
          btn.classList.add('pdp-thumbnail-active');
        });
      });
    }
  }

  // ----------------------------------------------------------------------------
  // 5. RENDER FORM KONFIGURATOR REALTIME
  // ----------------------------------------------------------------------------

  function renderConfigurator() {
    const prod = currentProduct;
    let updateFinishingAllowedState = () => {};

    // 1. Pilihan Bahan (Materials Radio Pills)
    const matsList = document.getElementById('pdp-materials-list');
    const materials = Array.isArray(prod.materials) ? prod.materials : [];

    if (materials.length > 0) {
      configState.selectedMaterialId = materials[0].id; // Default material pertama
      if (matsList) {
        matsList.innerHTML = materials.map((m, idx) => `
          <label class="pdp-material-option p-3 rounded-2xl border-2 border-slate-200 bg-white hover:border-slate-300 cursor-pointer flex items-center justify-between transition ${idx === 0 ? 'configurator-pill-active' : ''}">
            <div class="flex items-center gap-2.5">
              <input type="radio" name="pdp_material" value="${m.id}" ${idx === 0 ? 'checked' : ''} class="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
              <div>
                <span class="font-bold text-xs text-slate-800 block">${escapeHtml(m.name)}</span>
                <span class="text-[10px] text-slate-400">Harga: ${PricingCalculator.formatIDR(m.price)}</span>
              </div>
            </div>
            <span class="text-[11px] font-extrabold text-primary-brand">${PricingCalculator.formatIDR(m.price)}</span>
          </label>
        `).join('');

        matsList.querySelectorAll('input[name="pdp_material"]').forEach(radio => {
          radio.addEventListener('change', (e) => {
            configState.selectedMaterialId = e.target.value;
            matsList.querySelectorAll('.pdp-material-option').forEach(el => el.classList.remove('configurator-pill-active'));
            radio.closest('.pdp-material-option').classList.add('configurator-pill-active');
            updateFinishingAllowedState(e.target.value);
            recalculatePrice();
          });
        });
      }
    } else {
      configState.selectedMaterialId = null;
      if (matsList) {
        matsList.innerHTML = `<p class="text-xs text-slate-400 italic">Bahan standar bawaan produk.</p>`;
      }
    }

    // 2. Dimensi P x L (cm) - HANYA MUNCUL JIKA TIPE 1: METER
    const dimSection = document.getElementById('pdp-dimension-section');
    if (prod.price_type === 1) {
      if (dimSection) dimSection.classList.remove('hidden');
      configState.lengthCm = 100;
      configState.widthCm = 100;

      const inputL = document.getElementById('pdp-input-length');
      const inputW = document.getElementById('pdp-input-width');

      if (inputL) {
        inputL.value = configState.lengthCm;
        inputL.addEventListener('input', (e) => {
          configState.lengthCm = Math.max(1, parseFloat(e.target.value) || 100);
          recalculatePrice();
        });
      }

      if (inputW) {
        inputW.value = configState.widthCm;
        inputW.addEventListener('input', (e) => {
          configState.widthCm = Math.max(1, parseFloat(e.target.value) || 100);
          recalculatePrice();
        });
      }

      // Quick Dimension Presets
      document.querySelectorAll('.btn-preset-dim').forEach(btn => {
        btn.addEventListener('click', () => {
          const l = parseFloat(btn.getAttribute('data-l'));
          const w = parseFloat(btn.getAttribute('data-w'));
          configState.lengthCm = l;
          configState.widthCm = w;
          if (inputL) inputL.value = l;
          if (inputW) inputW.value = w;
          recalculatePrice();
        });
      });
    } else {
      if (dimSection) dimSection.classList.add('hidden');
    }

    // 3. Finishing Utama
    const mainFinSec = document.getElementById('pdp-main-finishing-section');
    const mainFinList = document.getElementById('pdp-main-finishing-list');
    const finishings = Array.isArray(prod.finishings) ? prod.finishings : [];

    updateFinishingAllowedState = (selectedMatId) => {
      if (!prod || !prod.specific_options_map || !selectedMatId || !mainFinList) return;
      const isMainSpecific = Boolean(
        prod.variation_scopes?.main === 'spesifik' ||
        prod.variation_scopes?.[selectedMatId]?.main === 'spesifik'
      );
      if (!isMainSpecific) {
        mainFinList.querySelectorAll('input[name="pdp_main_finishing"]').forEach(radio => {
          radio.disabled = false;
          radio.closest('.pdp-finishing-option')?.classList.remove('opacity-40', 'line-through', 'cursor-not-allowed', 'pointer-events-none');
        });
        return;
      }

      const allowedIds = prod.specific_options_map[selectedMatId]?.main || [];
      let curFinValid = false;
      mainFinList.querySelectorAll('input[name="pdp_main_finishing"]').forEach(radio => {
        const isAllowed = allowedIds.includes(radio.value);
        radio.disabled = !isAllowed;
        const optEl = radio.closest('.pdp-finishing-option');
        if (optEl) {
          if (!isAllowed) {
            optEl.classList.add('opacity-40', 'line-through', 'cursor-not-allowed', 'pointer-events-none');
          } else {
            optEl.classList.remove('opacity-40', 'line-through', 'cursor-not-allowed', 'pointer-events-none');
          }
        }
        if (radio.value === configState.selectedFinishingId && isAllowed) {
          curFinValid = true;
        }
      });

      if (!curFinValid && allowedIds.length > 0) {
        const firstValidRadio = mainFinList.querySelector(`input[name="pdp_main_finishing"][value="${allowedIds[0]}"]`);
        if (firstValidRadio) {
          firstValidRadio.checked = true;
          configState.selectedFinishingId = allowedIds[0];
          mainFinList.querySelectorAll('.pdp-finishing-option').forEach(el => {
            el.className = 'pdp-finishing-option p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 cursor-pointer flex items-center justify-between text-xs transition';
          });
          firstValidRadio.closest('.pdp-finishing-option').className = 'pdp-finishing-option p-2.5 rounded-xl border border-emerald-500 bg-emerald-50/40 font-bold text-emerald-900 cursor-pointer flex items-center justify-between text-xs transition';
        }
      }
    };

    const mainOptions = finishings.filter(f => !f.tier || f.tier === 'main');
    if (mainOptions.length > 0) {
      if (mainFinSec) mainFinSec.classList.remove('hidden');
      configState.selectedFinishingId = mainOptions[0].id;

      if (mainFinList) {
        mainFinList.innerHTML = mainOptions.map((f, idx) => `
          <label class="pdp-finishing-option p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 cursor-pointer flex items-center justify-between text-xs transition ${idx === 0 ? 'border-emerald-500 bg-emerald-50/40 font-bold text-emerald-900' : ''}">
            <div class="flex items-center gap-2">
              <input type="radio" name="pdp_main_finishing" value="${f.id}" ${idx === 0 ? 'checked' : ''} class="text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
              <span>${escapeHtml(f.name)}</span>
            </div>
            <span class="text-[11px] font-bold text-slate-600">${f.price > 0 ? '+' + PricingCalculator.formatIDR(f.price) : 'Gratis'}</span>
          </label>
        `).join('');

        mainFinList.querySelectorAll('input[name="pdp_main_finishing"]').forEach(radio => {
          radio.addEventListener('change', (e) => {
            configState.selectedFinishingId = e.target.value;
            mainFinList.querySelectorAll('.pdp-finishing-option').forEach(el => {
              el.className = 'pdp-finishing-option p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 cursor-pointer flex items-center justify-between text-xs transition';
            });
            radio.closest('.pdp-finishing-option').className = 'pdp-finishing-option p-2.5 rounded-xl border border-emerald-500 bg-emerald-50/40 font-bold text-emerald-900 cursor-pointer flex items-center justify-between text-xs transition';
            recalculatePrice();
          });
        });

        // Terapkan filter aturan spesifik untuk finishing terhadap material yang aktif
        updateFinishingAllowedState(configState.selectedMaterialId);
      }
    } else {
      if (mainFinSec) mainFinSec.classList.add('hidden');
      configState.selectedFinishingId = null;
    }

    // 4. Finishing Ekstra
    const extraFinSec = document.getElementById('pdp-extra-finishing-section');
    const extraFinList = document.getElementById('pdp-extra-finishing-list');
    const extraOptions = finishings.filter(f => f.tier && f.tier !== 'main');

    if (extraOptions.length > 0) {
      if (extraFinSec) extraFinSec.classList.remove('hidden');
      configState.extraFinishingIds = [];

      if (extraFinList) {
        extraFinList.innerHTML = extraOptions.map(f => `
          <label class="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs transition">
            <div class="flex items-center gap-2">
              <input type="checkbox" name="pdp_extra_finishing" value="${f.id}" class="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
              <span class="text-slate-800 font-medium">${escapeHtml(f.name)}</span>
            </div>
            <span class="text-[11px] font-bold text-emerald-700">+${PricingCalculator.formatIDR(f.price)}</span>
          </label>
        `).join('');

        extraFinList.querySelectorAll('input[name="pdp_extra_finishing"]').forEach(cb => {
          cb.addEventListener('change', () => {
            const checked = [];
            extraFinList.querySelectorAll('input[name="pdp_extra_finishing"]:checked').forEach(c => checked.push(c.value));
            configState.extraFinishingIds = checked;
            recalculatePrice();
          });
        });
      }
    } else {
      if (extraFinSec) extraFinSec.classList.add('hidden');
      configState.extraFinishingIds = [];
    }

    // 5. Qty Selector & Step Note
    const stepQuantity = Math.max(1, parseInt(prod.step_quantity, 10) || 1);
    configState.qty = prod.min_order || (prod.price_type === 7 ? stepQuantity : 1);

    const inputQty = document.getElementById('pdp-input-qty');
    const stepNote = document.getElementById('pdp-step-note');

    if (inputQty) {
      inputQty.value = configState.qty;
      inputQty.min = prod.min_order || 1;
    }

    if (stepNote) {
      if (prod.price_type === 7 && stepQuantity > 1) {
        stepNote.textContent = `Wajib kelipatan: ${stepQuantity} pcs (Tipe KombStep)`;
        stepNote.className = 'text-[10px] text-amber-600 font-bold block';
      } else {
        stepNote.textContent = `Minimal pemesanan: ${prod.min_order || 1} pcs`;
      }
    }

    const btnMinus = document.getElementById('btn-qty-minus');
    const btnPlus = document.getElementById('btn-qty-plus');

    if (btnMinus) {
      btnMinus.addEventListener('click', () => {
        const step = (prod.price_type === 7) ? stepQuantity : 1;
        const minOrder = prod.min_order || 1;
        let newQty = configState.qty - step;
        if (newQty < minOrder) newQty = minOrder;
        configState.qty = newQty;
        if (inputQty) inputQty.value = newQty;
        recalculatePrice();
      });
    }

    if (btnPlus) {
      btnPlus.addEventListener('click', () => {
        const step = (prod.price_type === 7) ? stepQuantity : 1;
        configState.qty += step;
        if (inputQty) inputQty.value = configState.qty;
        recalculatePrice();
      });
    }

    if (inputQty) {
      inputQty.addEventListener('change', (e) => {
        let val = parseInt(e.target.value, 10) || 1;
        const minOrder = prod.min_order || 1;
        if (val < minOrder) val = minOrder;
        configState.qty = val;
        inputQty.value = val;
        recalculatePrice();
      });
    }

    // Link & Notes Listeners
    const driveLinkEl = document.getElementById('pdp-input-drive-link');
    if (driveLinkEl) {
      driveLinkEl.addEventListener('input', e => configState.driveLink = e.target.value.trim());
    }

    const notesEl = document.getElementById('pdp-input-notes');
    if (notesEl) {
      notesEl.addEventListener('input', e => configState.notes = e.target.value.trim());
    }
  }

  // ----------------------------------------------------------------------------
  // 6. REKALKULASI HARGA REALTIME DENGAN PRICING ENGINE
  // ----------------------------------------------------------------------------

  function recalculatePrice() {
    if (!currentProduct || !window.PricingCalculator) return;

    const calcResult = PricingCalculator.calculateProductPrice(currentProduct, {
      materialId: configState.selectedMaterialId,
      finishingId: configState.selectedFinishingId,
      extraFinishingIds: configState.extraFinishingIds,
      lengthCm: configState.lengthCm,
      widthCm: configState.widthCm,
      qty: configState.qty
    });

    // Update Tampilan Harga Utama
    const livePriceEl = document.getElementById('pdp-live-price');
    const strikePriceEl = document.getElementById('pdp-gross-price-strike');
    const discNoteEl = document.getElementById('pdp-discount-note');
    const mobilePriceEl = document.getElementById('pdp-mobile-price');

    if (livePriceEl) {
      livePriceEl.textContent = PricingCalculator.formatIDR(calcResult.netPrice);
    }
    if (mobilePriceEl) {
      mobilePriceEl.textContent = PricingCalculator.formatIDR(calcResult.netPrice);
    }

    if (calcResult.discountAmount > 0) {
      if (strikePriceEl) {
        strikePriceEl.textContent = PricingCalculator.formatIDR(calcResult.grossPrice);
        strikePriceEl.classList.remove('hidden');
      }
      if (discNoteEl) {
        discNoteEl.textContent = `Hemat: -${PricingCalculator.formatIDR(calcResult.discountAmount)} (${calcResult.appliedDiscountNote || 'Promo'})`;
        discNoteEl.classList.remove('hidden');
      }
    } else {
      if (strikePriceEl) strikePriceEl.classList.add('hidden');
      if (discNoteEl) discNoteEl.classList.add('hidden');
    }

    // Update Area Feedback (Khusus Tipe 1: Meter)
    const areaFeedback = document.getElementById('pdp-area-feedback');
    if (areaFeedback && currentProduct.price_type === 1) {
      const raw = calcResult.rawAreaM2 || 1.0;
      const billed = calcResult.billedAreaM2 || 1.0;
      if (calcResult.isMinAreaApplied) {
        areaFeedback.innerHTML = `<span>Ukuran: ${raw.toFixed(2)} m²</span><span class="text-amber-700 font-bold">Minimal hitungan cetak berlaku: 1.00 m²</span>`;
        areaFeedback.className = 'text-[11px] font-bold text-amber-900 bg-amber-50 p-2 rounded-xl border border-amber-200 flex items-center justify-between';
      } else {
        areaFeedback.innerHTML = `<span>Luas Cetak: ${billed.toFixed(2)} m²</span><span class="text-emerald-700 font-semibold">Dihitung penuh ${billed.toFixed(2)} m²</span>`;
        areaFeedback.className = 'text-[11px] font-bold text-emerald-900 bg-emerald-50/80 p-2 rounded-xl border border-emerald-200 flex items-center justify-between';
      }
    }

    // Update Rincian Biaya Bawah Form
    const sumGross = document.getElementById('pdp-summary-gross');
    const sumDiscRow = document.getElementById('pdp-summary-discount-row');
    const sumDisc = document.getElementById('pdp-summary-discount');
    const sumNet = document.getElementById('pdp-summary-net');

    if (sumGross) sumGross.textContent = PricingCalculator.formatIDR(calcResult.grossPrice);
    if (sumNet) sumNet.textContent = PricingCalculator.formatIDR(calcResult.netPrice);

    if (calcResult.discountAmount > 0) {
      if (sumDiscRow) sumDiscRow.classList.remove('hidden');
      if (sumDisc) sumDisc.textContent = `-${PricingCalculator.formatIDR(calcResult.discountAmount)}`;
    } else {
      if (sumDiscRow) sumDiscRow.classList.add('hidden');
    }

    // Simpan hasil kalkulasi terakhir di state
    configState.lastCalculation = calcResult;
  }

  // ----------------------------------------------------------------------------
  // 7. RENDER TABS & ULASAN PEMBELI
  // ----------------------------------------------------------------------------

  function renderTabs() {
    const prod = currentProduct;

    // Deskripsi
    const descEl = document.getElementById('pdp-full-description');
    if (descEl) {
      descEl.textContent = prod.description || 'Produk percetakan berkualitas tinggi dengan hasil cetak tajam, warna solid, dan daya tahan maksimal.';
    }

    // Spesifikasi Produk Tab
    const specsEl = document.getElementById('tab-content-specs');
    if (specsEl) {
      const settings = (typeof DB !== 'undefined' && DB.getSettings) ? (DB.getSettings() || {}) : {};
      const sellerLocation = (typeof Utils !== 'undefined' && Utils.formatDynamicSellerLocation) 
        ? Utils.formatDynamicSellerLocation(settings, null) 
        : (settings.city || 'Indonesia');

      const originVal = (prod.product_origin && prod.product_origin.trim()) ? escapeHtml(prod.product_origin.trim()) : '-';
      const brandVal = (prod.brand && prod.brand.trim()) ? escapeHtml(prod.brand.trim()) : '-';
      const warrantyPeriod = (prod.warranty_period && prod.warranty_period.trim()) ? prod.warranty_period.trim() : 'Tidak Ada Garansi';
      const warrantyType = (prod.warranty_type && prod.warranty_type.trim()) ? prod.warranty_type.trim() : 'Garansi Toko';

      // 1. Stok
      let isAvailable = false;
      if (prod.is_unlimited_stock || prod.stock === null || prod.stock === undefined || prod.stock_status === 'unlimited') {
        isAvailable = true;
      } else {
        isAvailable = (parseInt(prod.stock) || 0) > 0;
      }
      const stockVal = isAvailable ? 'Tersedia' : 'Habis';

      // 2. Merek (brandVal sudah dideklarasikan di atas)

      // 3. Jenis Garansi & 4. Masa Garansi
      const hasWarranty = warrantyPeriod !== 'Tidak Ada Garansi' && warrantyPeriod !== 'Tidak Garansi' && warrantyPeriod !== '' && warrantyPeriod !== '-';

      // 5. Produk Custom
      const isCustomProd = Boolean(prod.has_custom_dimension || prod.has_extra_service);

      // KELOMPOK A & B — Kumpulkan Seluruh Baris Spesifikasi selain "Dikirim Dari" (Maks 9 Baris Sebelum Dikirim Dari):
      const otherRows = [
        { label: 'Stok', val: stockVal },
        { label: 'Merek', val: brandVal },
        { label: 'Jenis Garansi', val: escapeHtml(hasWarranty ? warrantyType : 'Tidak Ada Garansi') },
        ...(hasWarranty ? [{ label: 'Masa Garansi', val: escapeHtml(warrantyPeriod) }] : []),
        { label: 'Produk Custom', val: isCustomProd ? 'Ya' : 'Tidak' }
      ];

      // KELOMPOK B — Baris Kondisional & Tabel Manual:
      // 6. Kondisi Produk (Baru / Bekas)
      const conditionVal = (prod.condition === 'used' || prod.condition === 'bekas') ? 'Bekas' : 'Baru';
      otherRows.push({ label: 'Kondisi Produk', val: conditionVal });

      // 7. Pre-Order: durasi harinya saja, tanpa kata Ya/Tidak
      if (Boolean(prod.is_preorder)) {
        otherRows.push({ label: 'Pre-Order', val: `${prod.preorder_days || 7} Hari` });
      }

      // 8. Min. Pembelian
      if (parseInt(prod.min_order) > 1) {
        otherRows.push({ label: 'Min. Pembelian', val: `${prod.min_order} pcs` });
      }

      // 9. Harga Grosir
      if (prod.has_wholesale) {
        otherRows.push({ label: 'Harga Grosir', val: 'Tersedia' });
      }

      // 10. Kelipatan Pembelian
      if (prod.has_order_multiple && parseInt(prod.order_multiple_value) > 1) {
        otherRows.push({ label: 'Kelipatan Pembelian', val: `Kelipatan ${prod.order_multiple_value} pcs` });
      }

      // 11. Asal Produk
      if (prod.product_origin && prod.product_origin.trim()) {
        otherRows.push({ label: 'Asal Produk', val: escapeHtml(prod.product_origin.trim()) });
      }

      // 12. SKU Induk
      const skuVal = (prod.sku || prod.parent_sku || '').trim();
      if (skuVal) {
        otherRows.push({ label: 'SKU Induk', val: escapeHtml(skuVal) });
      }

      // 13. Tabel Spesifikasi Manual Seller
      if (Array.isArray(prod.custom_specs) && prod.custom_specs.length > 0) {
        prod.custom_specs.forEach(cs => {
          if (cs && cs.title && cs.title.trim() && cs.value && cs.value.trim()) {
            const existing = otherRows.find(r => r.label.toLowerCase() === cs.title.trim().toLowerCase());
            if (!existing) {
              otherRows.push({ label: escapeHtml(cs.title.trim()), val: escapeHtml(cs.value.trim()) });
            }
          }
        });
      }

      // Kunci Batas Jumlah Baris: Potong maksimal 9 baris pertama, lalu tambahkan "Dikirim Dari" di posisi paling bawah
      const finalSpecsRows = otherRows.slice(0, 9);
      finalSpecsRows.push({ label: 'Dikirim Dari', val: escapeHtml(sellerLocation) });

      specsEl.innerHTML = `
        <div class="space-y-4">
          <div>
            <h4 class="font-bold text-slate-900 text-sm mb-3">Spesifikasi Produk:</h4>
            <div class="bg-slate-50/70 rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              ${finalSpecsRows.map(r => `
                <div class="flex items-center py-2.5 px-4 text-xs">
                  <span class="text-slate-500 w-1/3 shrink-0">${r.label}</span>
                  <span class="text-slate-800 font-semibold w-2/3">${r.val}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="pt-2">
            <h4 class="font-bold text-slate-900 text-sm mb-2">Panduan Menyiapkan File Cetak:</h4>
            <ul class="space-y-1.5 list-disc pl-5 text-xs text-slate-600">
              <li>Format file yang didukung: <strong>PDF, TIFF, CDR, AI, PSD, atau JPG kualitas tinggi</strong>.</li>
              <li>Gunakan profil warna <strong>CMYK</strong> untuk hasil cetak yang akurat (bukan RGB).</li>
              <li>Resolusi file minimal <strong>150 - 300 DPI</strong> dengan skala 1:1.</li>
              <li>Pastikan seluruh teks telah di-convert ke kurva/outline agar font tidak hilang.</li>
            </ul>
          </div>
        </div>
      `;
    }

    // Tab Review Count
    const tabCount = document.getElementById('pdp-tab-review-count');
    if (tabCount) {
      const approvedCount = (prod.reviews || []).filter(r => r.is_approved).length;
      tabCount.textContent = approvedCount;
    }

    // Tab Switcher Listener
    document.querySelectorAll('.btn-pdp-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');

        document.querySelectorAll('.btn-pdp-tab').forEach(b => {
          b.className = 'btn-pdp-tab px-6 py-4 text-xs font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition whitespace-nowrap';
        });
        btn.className = 'btn-pdp-tab active px-6 py-4 text-xs font-bold border-b-2 border-primary-brand text-primary-brand transition whitespace-nowrap';

        document.querySelectorAll('.pdp-tab-pane').forEach(p => p.classList.add('hidden'));
        const activePane = document.getElementById(`tab-content-${targetTab}`);
        if (activePane) activePane.classList.remove('hidden');

        if (window.lucide) window.lucide.createIcons();
      });
    });
  }

  function renderReviews() {
    const prod = currentProduct;
    const revList = document.getElementById('pdp-reviews-list');
    if (!revList) return;

    // Ambil ulasan dari prod.reviews dan DB lokal yang sudah berstatus approved
    const dbReviews = window.DB ? DB.getReviews(prod.id, true) : [];
    const approvedReviews = [...(prod.reviews || []).filter(r => r.is_approved)];
    dbReviews.forEach(dbr => {
      const existingIdx = approvedReviews.findIndex(m => m.id === dbr.id);
      if (existingIdx !== -1) {
        approvedReviews[existingIdx] = { ...approvedReviews[existingIdx], ...dbr };
      } else {
        approvedReviews.push(dbr);
      }
    });

    if (approvedReviews.length === 0) {
      revList.innerHTML = `
        <div class="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-2">
          <i data-lucide="message-square" class="w-8 h-8 text-slate-400 mx-auto"></i>
          <p class="text-xs font-bold text-slate-700">Belum ada ulasan yang disetujui untuk produk ini.</p>
          <p class="text-[11px] text-slate-400">Jadilah pelanggan pertama yang memberikan ulasan dan rating kepuasan cetak!</p>
        </div>
      `;
      return;
    }

    revList.innerHTML = approvedReviews.map(r => `
      <div class="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-xs">
              ${escapeHtml(r.customer_name ? r.customer_name.charAt(0).toUpperCase() : 'U')}
            </div>
            <div>
              <span class="font-bold text-slate-900 text-xs block">${escapeHtml(r.customer_name)}</span>
              <span class="text-[10px] text-slate-400">${new Date(r.created_at || Date.now()).toLocaleDateString('id-ID')}</span>
            </div>
          </div>
          <span class="text-secondary-accent font-black text-sm">
            ${'★'.repeat(r.rating || 5)}${'☆'.repeat(5 - (r.rating || 5))}
          </span>
        </div>
        <p class="text-xs text-slate-700 leading-relaxed">${escapeHtml(r.comment)}</p>
        ${r.seller_reply ? `
          <div class="mt-2.5 p-3 bg-white rounded-xl border border-emerald-200 space-y-1 shadow-xs">
            <div class="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
              <i data-lucide="badge-check" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>Tanggapan Penjual:</span>
              <span class="text-[10px] text-slate-400 font-normal ml-auto">
                ${r.seller_reply_at ? new Date(r.seller_reply_at).toLocaleDateString('id-ID') : ''}
              </span>
            </div>
            <p class="text-xs text-slate-700 leading-relaxed">${escapeHtml(r.seller_reply)}</p>
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  // ----------------------------------------------------------------------------
  // 8. RENDER PRODUK SERUPA & PRODUK TERLARIS (RECOMMENDATIONS)
  // ----------------------------------------------------------------------------

  function renderSimilarProducts() {
    const grid = document.getElementById('pdp-similar-products-grid');
    const loadMoreContainer = document.getElementById('pdp-similar-load-more');
    if (!grid) return;

    // Cari produk dengan sub_category_id atau category_id yang sama (selain produk aktif)
    let similar = allProducts.filter(p => p.id !== currentProduct.id && (p.sub_category_id === currentProduct.sub_category_id || p.category_id === currentProduct.category_id));

    // Fallback jika < 4 produk: ambil produk aktif lainnya
    if (similar.length < 4) {
      const others = allProducts.filter(p => p.id !== currentProduct.id && !similar.some(s => s.id === p.id));
      similar = similar.concat(others);
    }

    const itemsToRender = similar.slice(0, visibleSimilarCount);

    grid.innerHTML = itemsToRender.map(p => `
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition flex flex-col justify-between group">
        <a href="product.html?id=${p.id}&store=${currentStoreSlug}" class="block aspect-square bg-slate-100 overflow-hidden cursor-pointer relative">
          <img src="${p.image_url || 'assets/images/logo-songer-creative.png'}" alt="${escapeHtml(p.name)}" class="w-full h-full object-cover group-hover:scale-105 transition" />
          <span class="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-700 shadow-xs">
            ${p.category_name || 'Cetak'}
          </span>
        </a>
        <div class="p-4 space-y-3 flex-1 flex flex-col justify-between">
          <div class="space-y-1">
            <a href="product.html?id=${p.id}&store=${currentStoreSlug}" class="font-bold text-xs text-slate-900 group-hover:text-primary-brand transition line-clamp-2 leading-snug">
              ${escapeHtml(p.name)}
            </a>
            <div class="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span class="text-secondary-accent font-bold">★ ${p.rating_avg || '5.0'}</span>
              <span>•</span>
              <span>${p.sales_count || 50}+ Terjual</span>
            </div>
          </div>
          <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span class="text-[9px] text-slate-400 block">Mulai:</span>
              <span class="text-xs font-black text-primary-brand">${PricingCalculator.formatIDR(p.base_price || 25000)}</span>
            </div>
            <a href="product.html?id=${p.id}&store=${currentStoreSlug}" class="btn-primary-brand px-3 py-1.5 rounded-xl text-[11px] font-bold text-white shadow-xs">
              Pesan
            </a>
          </div>
        </div>
      </div>
    `).join('');

    // Tampilkan tombol muat lebih jika masih ada produk serupa
    if (loadMoreContainer) {
      if (similar.length > visibleSimilarCount) {
        loadMoreContainer.classList.remove('hidden');
      } else {
        loadMoreContainer.classList.add('hidden');
      }
    }
  }

  function renderBestSeller() {
    const titleEl = document.getElementById('pdp-bestseller-title');
    const descEl = document.getElementById('pdp-bestseller-desc');
    const linkEl = document.getElementById('pdp-bestseller-link');

    // Cari produk kategori lain dengan sales_count tertinggi
    const bestSeller = allProducts
      .filter(p => p.category_id !== currentProduct.category_id)
      .sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))[0] || allProducts.find(p => p.id !== currentProduct.id);

    if (bestSeller && titleEl && linkEl) {
      titleEl.textContent = bestSeller.name;
      if (descEl) descEl.textContent = bestSeller.description || 'Paling banyak diminati dan dipesan berulang oleh pelanggan kami.';
      linkEl.href = `product.html?id=${bestSeller.id}&store=${currentStoreSlug}`;
    }
  }

  // ----------------------------------------------------------------------------
  // 9. EVENT LISTENERS PDP & TRANSAKSI
  // ----------------------------------------------------------------------------

  function bindPDPEvents() {
    // 1. Tambah ke Keranjang Desktop
    const btnAddCart = document.getElementById('btn-add-to-cart') || document.getElementById('btn-add-to-cart-pdp');
    if (btnAddCart) {
      btnAddCart.addEventListener('click', () => {
        addItemToCart();
      });
    }

    // 2. Beli Sekarang Desktop & Mobile (WhatsApp Checkout Langsung)
    const btnBuyNow = document.getElementById('btn-buy-now-pdp');
    const btnMobileBuyNow = document.getElementById('btn-mobile-buy-now');

    [btnBuyNow, btnMobileBuyNow].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          directWhatsAppCheckout();
        });
      }
    });

    // 3. Tombol Bagikan Link (Auto-Copy to Clipboard)
    const btnShare = document.getElementById('btn-share-product');
    if (btnShare) {
      btnShare.addEventListener('click', () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
          showToast('Tautan produk berhasil disalin ke clipboard!', 'success');
        }).catch(() => {
          showToast('Gagal menyalin tautan.', 'error');
        });
      });
    }

    // 4. Cart Drawer Triggers
    const btnOpenCart = document.getElementById('btn-open-cart-drawer');
    const btnMobileCart = document.getElementById('btn-mobile-cart');
    const btnCloseCart = document.getElementById('btn-close-cart-drawer');
    const btnCheckoutWaCart = document.getElementById('btn-checkout-cart-wa');

    [btnOpenCart, btnMobileCart].forEach(btn => {
      if (btn) btn.addEventListener('click', openCartDrawer);
    });

    if (btnCloseCart) btnCloseCart.addEventListener('click', closeCartDrawer);
    if (btnCheckoutWaCart) btnCheckoutWaCart.addEventListener('click', checkoutWhatsAppCart);

    // 5. Muat Lebih Banyak Produk Serupa
    const btnLoadMore = document.getElementById('btn-load-more-similar');
    if (btnLoadMore) {
      btnLoadMore.addEventListener('click', () => {
        visibleSimilarCount += 4;
        renderSimilarProducts();
      });
    }

    // 6. Modal Tulis Ulasan
    const btnOpenReviewModal = document.getElementById('btn-open-review-form-pdp');
    const modalReview = document.getElementById('modal-pdp-review');
    const btnCloseReview = document.getElementById('btn-close-review-modal');
    const btnCancelReview = document.getElementById('btn-cancel-review');
    const formReview = document.getElementById('form-pdp-new-review');

    if (btnOpenReviewModal) {
      btnOpenReviewModal.addEventListener('click', () => {
        if (modalReview) modalReview.classList.remove('hidden');
      });
    }

    [btnCloseReview, btnCancelReview].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          if (modalReview) modalReview.classList.add('hidden');
        });
      }
    });

    // Star Picker Listener
    const starItems = document.querySelectorAll('#pdp-star-picker .star-item');
    starItems.forEach(star => {
      star.addEventListener('click', () => {
        const val = parseInt(star.getAttribute('data-star'), 10) || 5;
        configState.selectedStarRating = val;
        starItems.forEach(s => {
          const sVal = parseInt(s.getAttribute('data-star'), 10);
          s.style.opacity = sVal <= val ? '1' : '0.3';
        });
      });
    });

    // Submit Review
    if (formReview) {
      formReview.addEventListener('submit', (e) => {
        e.preventDefault();
        const rawName = document.getElementById('pdp-review-name').value.trim();
        const isAnonymous = document.getElementById('pdp-review-anonymous')?.checked || false;
        const comment = document.getElementById('pdp-review-comment').value.trim();

        if (!comment) {
          alert('Mohon tulis komentar ulasan Anda.');
          return;
        }

        DB.createReview({
          productId: currentProduct.id,
          customer_name: rawName || 'Pembeli',
          rating: configState.selectedStarRating,
          comment: comment,
          is_anonymous: isAnonymous,
          is_approved: false // Wajib moderasi seller
        });

        if (modalReview) modalReview.classList.add('hidden');
        formReview.reset();
        showToast('Ulasan Anda berhasil dikirim (Menunggu moderasi seller)!', 'info');
      });
    }

    // Tombol Settings Toko (Buka index.html atau redirect ke admin)
    const btnSettings = document.getElementById('btn-open-settings');
    if (btnSettings) {
      btnSettings.addEventListener('click', () => {
        window.location.href = 'admin.html#account';
      });
    }
  }

  // ----------------------------------------------------------------------------
  // 10. KERANJANG & CHECKOUT WHATSAPP
  // ----------------------------------------------------------------------------

  function addItemToCart() {
    const calc = configState.lastCalculation;
    if (!calc) return;

    const cartItem = {
      id: DB.generateUUID(),
      productId: currentProduct.id,
      productName: currentProduct.name,
      orderCategory: currentProduct.order_category || 'Ctk',
      materialName: calc.breakdown.material.name,
      finishingName: calc.breakdown.mainFinishing ? calc.breakdown.mainFinishing.name : 'Standar',
      extraFinishings: calc.breakdown.extraFinishings,
      lengthCm: currentProduct.price_type === 1 ? configState.lengthCm : null,
      widthCm: currentProduct.price_type === 1 ? configState.widthCm : null,
      billedAreaM2: currentProduct.price_type === 1 ? calc.billedAreaM2 : null,
      qty: configState.qty,
      unitPrice: calc.unitNetPrice,
      subtotal: calc.netPrice,
      driveLink: configState.driveLink,
      notes: configState.notes
    };

    cart.push(cartItem);
    saveCartToStorage();
    showToast(`"${currentProduct.name}" berhasil ditambahkan ke keranjang!`, 'success');
  }

  function updateCartBadge() {
    const badges = document.querySelectorAll('.cart-badge-count');
    badges.forEach(b => {
      b.textContent = cart.length;
      if (cart.length > 0) b.classList.remove('hidden');
      else b.classList.add('hidden');
    });
  }

  function openCartDrawer() {
    const drawer = document.getElementById('drawer-buyer-cart');
    const itemsList = document.getElementById('cart-drawer-items-list');
    const totalEl = document.getElementById('cart-drawer-total-amount');

    if (!drawer) return;

    if (itemsList) {
      if (cart.length === 0) {
        itemsList.innerHTML = `
          <div class="text-center py-16 space-y-3">
            <i data-lucide="shopping-cart" class="w-12 h-12 text-slate-300 mx-auto"></i>
            <p class="text-xs font-bold text-slate-600">Keranjang belanja Anda masih kosong</p>
            <p class="text-[11px] text-slate-400">Pilih bahan dan masukkan ukuran pesanan Anda.</p>
          </div>
        `;
      } else {
        itemsList.innerHTML = cart.map((item, idx) => `
          <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div class="flex items-start justify-between gap-2">
              <div>
                <h5 class="font-bold text-xs text-slate-900">${escapeHtml(item.productName)}</h5>
                <p class="text-[10px] text-slate-500">Bahan: ${escapeHtml(item.materialName)} | Fin: ${escapeHtml(item.finishingName)}</p>
                ${item.lengthCm ? `<p class="text-[10px] text-slate-500">Ukuran: ${item.lengthCm}x${item.widthCm} cm (${item.billedAreaM2} m²)</p>` : ''}
              </div>
              <button type="button" class="btn-remove-cart-item text-slate-400 hover:text-red-500 p-1" data-index="${idx}">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
            <div class="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
              <span class="text-slate-500">Qty: <strong>${item.qty} pcs</strong></span>
              <span class="font-black text-primary-brand">${PricingCalculator.formatIDR(item.subtotal)}</span>
            </div>
          </div>
        `).join('');

        itemsList.querySelectorAll('.btn-remove-cart-item').forEach(btn => {
          btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-index'), 10);
            cart.splice(index, 1);
            saveCartToStorage();
            openCartDrawer();
          });
        });
      }
    }

    if (totalEl) {
      const grandTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
      totalEl.textContent = PricingCalculator.formatIDR(grandTotal);
    }

    drawer.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  function closeCartDrawer() {
    const drawer = document.getElementById('drawer-buyer-cart');
    if (drawer) drawer.classList.add('hidden');
  }

  // Direct WhatsApp Checkout
  function directWhatsAppCheckout() {
    const calc = configState.lastCalculation;
    if (!calc) return;

    let custName = prompt("Silakan masukkan nama Anda untuk pendataan pesanan:");
    if (!custName || custName.trim() === '') {
      custName = localStorage.getItem('pos_last_customer_name') || 'Guest';
    } else {
      localStorage.setItem('pos_last_customer_name', custName.trim());
    }

    const inv = 'INV-' + Date.now().toString().slice(-6);
    
    DB.saveOrder({
      id: inv,
      date: new Date().toISOString(),
      customer_name: custName,
      customer_contact: 'Website',
      total: calc.netPrice,
      status: 'PENDING',
      channel: 'WEB_WA',
      items: [{
        product_id: currentProduct.id,
        product_name: currentProduct.name,
        material_name: calc.breakdown.material.name,
        finishing_name: calc.breakdown.mainFinishing ? calc.breakdown.mainFinishing.name : '',
        qty: configState.qty,
        unit_price: calc.netPrice / configState.qty,
        subtotal: calc.netPrice,
        length_cm: currentProduct.price_type === 1 ? configState.lengthCm : null,
        width_cm: currentProduct.price_type === 1 ? configState.widthCm : null,
        file_url: configState.driveLink
      }]
    });

    const settings = DB.getSettings();
    const phone = '628885844380';

    let msg = `Halo *${settings.store_name}*, saya ingin memesan produk via website:\n\n`;
    msg += `📦 *Produk:* ${currentProduct.name}\n`;
    msg += `📄 *Bahan:* ${calc.breakdown.material.name}\n`;
    if (calc.breakdown.mainFinishing) {
      msg += `✨ *Finishing:* ${calc.breakdown.mainFinishing.name}\n`;
    }
    if (currentProduct.price_type === 1) {
      msg += `📐 *Ukuran:* ${configState.lengthCm} x ${configState.widthCm} cm (${calc.billedAreaM2} m²)\n`;
    }
    msg += `🔢 *Jumlah:* ${configState.qty} pcs\n`;
    msg += `💰 *Total Estimasi:* *${PricingCalculator.formatIDR(calc.netPrice)}*\n`;

    if (configState.driveLink) {
      msg += `🔗 *Link File Cetak:* ${configState.driveLink}\n`;
    }
    if (configState.notes) {
      msg += `📝 *Catatan:* ${configState.notes}\n`;
    }

    msg += `\nMohon konfirmasi pesanan dan nomor rekening toko. Terima kasih! 🙏`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  // Cart WhatsApp Checkout
  function checkoutWhatsAppCart() {
    if (cart.length === 0) {
      alert('Keranjang belanja Anda masih kosong.');
      return;
    }

    let custName = prompt("Silakan masukkan nama Anda untuk pendataan pesanan:");
    if (!custName || custName.trim() === '') {
      custName = localStorage.getItem('pos_last_customer_name') || 'Guest';
    } else {
      localStorage.setItem('pos_last_customer_name', custName.trim());
    }

    let total = 0;
    cart.forEach(c => total += c.subtotal);

    const inv = 'INV-' + Date.now().toString().slice(-6);
    
    DB.saveOrder({
      id: inv,
      date: new Date().toISOString(),
      customer_name: custName,
      customer_contact: 'Website',
      total: total,
      status: 'PENDING',
      channel: 'WEB_WA',
      items: cart.map(c => ({
        product_id: c.productId,
        product_name: c.productName,
        material_name: c.materialName,
        finishing_name: c.finishingName,
        qty: c.qty,
        unit_price: c.subtotal / c.qty,
        subtotal: c.subtotal,
        length_cm: c.lengthCm || null,
        width_cm: c.widthCm || null,
        file_url: c.driveLink
      }))
    });

    const settings = DB.getSettings();
    const phone = '628885844380';
    total = 0;

    let msg = `Halo *${settings.store_name}*, saya ingin memesan daftar pesanan berikut:\n\n`;

    cart.forEach((c, idx) => {
      total += c.subtotal;
      msg += `${idx + 1}. *${c.productName}*\n`;
      msg += `   • Bahan: ${c.materialName} | Fin: ${c.finishingName}\n`;
      if (c.lengthCm) msg += `   • Ukuran: ${c.lengthCm}x${c.widthCm} cm (${c.billedAreaM2} m²)\n`;
      msg += `   • Qty: ${c.qty} pcs = *${PricingCalculator.formatIDR(c.subtotal)}*\n`;
      if (c.driveLink) msg += `   • File: ${c.driveLink}\n`;
    });

    msg += `\n💰 *TOTAL BELANJA:* *${PricingCalculator.formatIDR(total)}*\n`;
    msg += `\nMohon info ketersediaan antrean dan nomor rekening toko. Terima kasih! 🙏`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');

    cart = [];
    saveCartToStorage();
    closeCartDrawer();
  }

  // Toast Notification
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const colorClass = type === 'success' ? 'bg-emerald-600 text-white' : type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white';

    toast.className = `p-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold animate-slide-in pointer-events-auto ${colorClass}`;
    toast.innerHTML = `
      <i data-lucide="${type === 'success' ? 'check-circle' : 'info'}" class="w-4 h-4 shrink-0"></i>
      <span class="flex-1">${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
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

  // Jalankan saat DOM siap
  document.addEventListener('DOMContentLoaded', init);

})();


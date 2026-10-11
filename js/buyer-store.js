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
    if (isNaN(num) || num === null || num === undefined) return 'Rp 0';
    return 'Rp ' + Math.round(num).toLocaleString('id-ID');
  }

  function saveCart() {
    try {
      localStorage.setItem('songer_buyer_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
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
        storeTaglineEl.className = 'text-[11px] text-slate-500 block truncate max-w-[200px] hidden sm:block';
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

  function init() {
    // Sinkronisasi Navbar Logo, Favicon, & Skema Warna Toko
    const settings = DB.getSettings();
    const faviconEl = document.getElementById('app-favicon');
    if (faviconEl && settings.browser_icon) faviconEl.href = settings.browser_icon;

    // Sinkronisasi Header Navbar Branding (Aturan Responsive Desktop & Layar HP)
    applyHeaderBranding(settings);

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

    renderStorefront();
    startCountdownTimer();
    initFloatingVoucher();
    bindStoreEvents();
    initNavbarSearchAutocomplete();
    initGoogleAuth();
    checkSellerSession();
    initHeroSlider();
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

    // Cek Customer Session untuk Personalized Greeting
    let customerGreetingHtml = '';
    if (settings.enable_customer_greeting !== false) {
      let custName = '';
      try {
        const activeCust = DB.getActiveCustomer ? DB.getActiveCustomer() : null;
        if (activeCust && activeCust.name) custName = activeCust.name;
      } catch (e) { }

      if (!custName) {
        custName = localStorage.getItem('pos_last_customer_name') || '';
      }
      if (!custName) {
        try {
          const u = JSON.parse(localStorage.getItem('songer_customer_user') || '{}');
          if (u.name) custName = u.name;
        } catch (e) { }
      }
      if (!custName) {
        try {
          const tenantId = DB.getCurrentTenant ? DB.getCurrentTenant().id : 'songer-creative-01';
          const raw = localStorage.getItem(`pos_active_customer_${tenantId}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            custName = parsed.name || raw;
          }
        } catch (e) { }
      }

      if (custName) {
        customerGreetingHtml = `
          <div class="p-3.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs animate-fade-in">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                👋
              </div>
              <div>
                <span class="font-bold text-emerald-950">Halo, <strong class="text-emerald-700">${escapeHtml(custName)}</strong>!</span>
                <span class="text-slate-600 ml-1">Selamat berbelanja kembali di <strong>${escapeHtml(settings.store_name || 'Songer Creative')}</strong>. Siap memesan kebutuhan cetak Anda?</span>
              </div>
            </div>
            <span class="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full whitespace-nowrap">
              <i data-lucide="sparkles" class="w-3 h-3 text-emerald-600"></i> Pelanggan Setia
            </span>
          </div>
        `;
      }
    }

    // --------------------------------------------------------------------------
    // REKONSTRUKSI 4 MODEL HERO SECTION ETALASE & SLIDER HALUS
    // --------------------------------------------------------------------------
    let heroSectionHtml = '';
    const heroBannerImg = settings.hero_banner_image || 'assets/images/banner-printing-hero.jpg';
    const heroBanners = (settings.hero_banners && settings.hero_banners.length > 0)
      ? settings.hero_banners
      : [heroBannerImg];

    let heroModel = settings.hero_model;
    if (!heroModel) {
      if (settings.hero_type === 'text') heroModel = 'model_1';
      else heroModel = 'model_2';
    }

    const animType = settings.hero_slider_animation || 'slide_3s';

    // Background styling calculation identical to admin live preview
    const heroBgType = settings.hero_bg_type || 'linear_gradient';
    const heroBgColor1 = settings.hero_bg_color1 || '#0f172a';
    const heroBgColor2 = settings.hero_bg_color2 || '#064e3b';
    const heroBgAngle = settings.hero_bg_angle !== undefined ? settings.hero_bg_angle : 135;
    const heroTitleColor = settings.hero_title_color || '#ffffff';
    const heroSubtitleColor = settings.hero_subtitle_color || '#cbd5e1';
    const heroShowTimer = settings.hero_show_timer !== false;

    let heroBgCss = '';
    if (heroBgType === 'solid') {
      heroBgCss = `background-color: ${heroBgColor1};`;
    } else if (heroBgType === 'radial_gradient') {
      heroBgCss = `background: radial-gradient(circle at center, ${heroBgColor1} 0%, ${heroBgColor2} 100%);`;
    } else {
      heroBgCss = `background: linear-gradient(${heroBgAngle}deg, ${heroBgColor1} 0%, ${heroBgColor2} 100%);`;
    }

    // Helper: render Dual CTA Buttons in storefront
    const heroCtaMode = settings.hero_cta_mode || 'dual';
    const heroUseTheme = settings.hero_cta_use_theme_default;
    const heroPrimColor = settings.primary_color || '#33b589';

    const heroCta1Text = settings.hero_cta1_text || settings.hero_cta_text || 'Lihat Semua Katalog';
    const heroCta1Bg = heroUseTheme ? heroPrimColor : (settings.hero_cta1_bg || heroPrimColor);
    const heroCta1TextColor = heroUseTheme ? '#ffffff' : (settings.hero_cta1_text_color || '#ffffff');
    const heroCta1IconColor = heroUseTheme ? '#ffffff' : (settings.hero_cta1_icon_color || '#ffffff');

    const heroCta2Text = settings.hero_cta2_text || 'Konsultasi Desain & Cetak';
    const heroCta2Bg = heroUseTheme ? '#25d366' : (settings.hero_cta2_bg || '#25d366');
    const heroCta2TextColor = heroUseTheme ? '#ffffff' : (settings.hero_cta2_text_color || '#ffffff');
    const heroCta2IconColor = heroUseTheme ? '#ffffff' : (settings.hero_cta2_icon_color || '#ffffff');

    const heroStorePhone = (settings.store_phone || '0888-5844-380').replace(/[^0-9]/g, '');
    const heroCleanPhone = heroStorePhone.startsWith('0') ? '62' + heroStorePhone.slice(1) : heroStorePhone;
    const heroWaUrl = `https://wa.me/${heroCleanPhone || '628885844380'}?text=${encodeURIComponent('Halo ' + (settings.store_name || 'Songer Creative') + ', saya ingin konsultasi desain & cetak.')}`;

    let heroDualCtaHtml = '';
    if (heroCtaMode === 'dual' || heroCtaMode === 'catalog_only') {
      heroDualCtaHtml += `
        <a href="#katalog-section" class="w-full sm:w-auto justify-center px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-2xl text-xs font-bold shadow-lg inline-flex items-center gap-2 hover:brightness-105 transition active:scale-95 text-center whitespace-normal" style="background-color: ${heroCta1Bg}; color: ${heroCta1TextColor};">
          <span>${escapeHtml(heroCta1Text)}</span>
          <i data-lucide="arrow-down" class="w-3.5 h-3.5 shrink-0" style="color: ${heroCta1IconColor};"></i>
        </a>
      `;
    }
    if (heroCtaMode === 'dual' || heroCtaMode === 'consultation_only') {
      heroDualCtaHtml += `
        <a href="${heroWaUrl}" target="_blank" class="w-full sm:w-auto justify-center px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-2xl text-xs font-bold shadow-lg inline-flex items-center gap-2 hover:brightness-105 transition active:scale-95 text-center whitespace-normal" style="background-color: ${heroCta2Bg}; color: ${heroCta2TextColor};">
          <i class="bi bi-whatsapp text-sm shrink-0" style="color: ${heroCta2IconColor};"></i>
          <span>${escapeHtml(heroCta2Text)}</span>
        </a>
      `;
    }

    let heroTimerHtml = '';
    if (heroShowTimer) {
      heroTimerHtml = `
        <div class="flex items-center justify-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-xs text-white w-full sm:w-auto">
          <i data-lucide="clock" class="w-4 h-4 text-emerald-400 shrink-0"></i>
          <span class="font-medium text-slate-200">Promo Berakhir:</span>
          <span id="store-countdown" class="font-mono font-bold text-emerald-400 text-xs sm:text-sm">23j : 59m : 59d</span>
        </div>
      `;
    }

    const heroWidthLayout = settings.hero_width_layout || 'boxed';
    const isFullWidth = (heroModel === 'model_2' || heroModel === 'model_3') && (heroWidthLayout === 'full');
    const heroShowArrows = (settings.hero_show_arrows !== false);

    // Helper: generate slides HTML with .hero-slide-smooth & Bootstrap Icons Fallback
    const slidesHtml = heroBanners.map((b, i) => `
      <div class="hero-slide-smooth ${i === 0 ? 'is-active' : 'is-hidden'}" data-index="${i}">
        <img src="${b}" alt="Hero Banner ${i + 1}" class="w-full h-full object-cover ${isFullWidth ? 'rounded-none' : 'rounded-3xl'}" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-3xl\\'><i class=\\'bi bi-images\\'></i></div>';" />
      </div>
    `).join('');

    let controlsHtml = '';
    if (heroBanners.length > 1) {
      controlsHtml = `
        <div class="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 pointer-events-auto">
          ${heroBanners.map((_, i) => `<button type="button" class="w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-emerald-500 scale-125' : 'bg-white/60 hover:bg-white'} transition-all hero-slide-dot" data-index="${i}"></button>`).join('')}
        </div>
        ${heroShowArrows ? `
          <button type="button" class="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/45 hover:bg-black/75 text-white flex items-center justify-center z-20 transition pointer-events-auto backdrop-blur-sm active:scale-90" id="hero-slide-prev" title="Slide Sebelumnya (&lt;)"><i data-lucide="chevron-left" class="w-4 h-4 sm:w-5 sm:h-5"></i></button>
          <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/45 hover:bg-black/75 text-white flex items-center justify-center z-20 transition pointer-events-auto backdrop-blur-sm active:scale-90" id="hero-slide-next" title="Slide Berikutnya (&gt;)"><i data-lucide="chevron-right" class="w-4 h-4 sm:w-5 sm:h-5"></i></button>
        ` : ''}
      `;
    }

    function getDynamicCustomerGreeting(settings) {
      let customerName = (localStorage.getItem('pos_last_customer_name') || '').trim();
      if (!customerName) {
        try {
          const activeSession = JSON.parse(localStorage.getItem('pos_customer_session') || '{}');
          if (activeSession && activeSession.name) customerName = activeSession.name.trim();
        } catch (_) { }
      }

      const storeName = settings?.store_name || 'Songer Creative';

      if (!customerName) {
        return `Selamat Datang di ${storeName}`;
      }

      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const timeInDecimal = hour + minute / 60;

      let timeGreeting = 'Selamat Datang';
      if (timeInDecimal >= 4.0 && timeInDecimal < 11.0) {
        timeGreeting = 'Selamat Pagi';
      } else if (timeInDecimal >= 11.0 && timeInDecimal < 15.0) {
        timeGreeting = 'Selamat Siang';
      } else if (timeInDecimal >= 15.0 && timeInDecimal < 18.0) {
        timeGreeting = 'Selamat Sore';
      } else {
        timeGreeting = 'Selamat Malam';
      }

      return `${timeGreeting}, ${customerName} 👋`;
    }

    // Custom Sapaan Hero Personal Berbasis Waktu & Status Pelanggan
    const heroGreetingEnabled = settings.hero_greeting_enabled !== false;
    const dynamicGreetingText = getDynamicCustomerGreeting(settings);
    const heroGreetingBg = settings.hero_greeting_bg_color || 'rgba(255, 255, 255, 0.15)';
    const heroGreetingTextColor = settings.hero_greeting_text_color || '#ffffff';
    const heroGreetingBorder = settings.hero_greeting_border_color || 'rgba(255, 255, 255, 0.20)';
    const heroGreetingRadius = settings.hero_greeting_radius || '9999px';

    const heroGreetingBadgeHtml = heroGreetingEnabled ? `
      <div class="inline-flex items-center gap-1.5 px-3 py-1 font-bold text-xs shadow-xs select-none" style="background-color: ${heroGreetingBg}; color: ${heroGreetingTextColor}; border: 1px solid ${heroGreetingBorder}; border-radius: ${heroGreetingRadius};">
        <span>${escapeHtml(dynamicGreetingText)}</span>
      </div>
    ` : '';

    if (heroModel === 'model_1') {
      // [1] Model Teks Headline Saja + CTA (Tanpa Gambar Banner, 100% Identik Live Preview)
      heroSectionHtml = `
        <div class="relative overflow-hidden rounded-3xl p-6 sm:p-12 shadow-2xl border border-white/10" style="${heroBgCss}" id="hero-slider-container">
          <div class="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
          <div class="relative z-10 max-w-2xl space-y-4">
            ${heroGreetingBadgeHtml}
            <h1 class="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight" style="color: ${heroTitleColor};">
              ${escapeHtml(settings.hero_headline || 'Cetak Banner, Desain & Souvenir Harga Instan')}
            </h1>
            <p class="text-xs sm:text-sm leading-relaxed" style="color: ${heroSubtitleColor};">
              ${escapeHtml(settings.hero_subheadline || 'Katalog terpadu dengan kalkulator instan: spesifikasi kustom meteran, jasa desain original, hingga souvenir retail siap kirim ke seluruh Indonesia.')}
            </p>
            <div class="pt-2 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full">
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                ${heroDualCtaHtml}
              </div>
              ${heroTimerHtml}
              <div class="flex items-center gap-1.5 text-xs text-white/80 pt-1 sm:pt-0">
                <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400 shrink-0"></i>
                <span>Kualitas CMYK Tajam & Garansi Cetak</span>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (heroModel === 'model_2') {
      // [2] Model Full-Width Gambar 100% / 100vw atau Boxed (Murni Gambar Penuh, Tanpa Teks & Tanpa CTA)
      heroSectionHtml = `
        <div class="space-y-3 ${isFullWidth ? '-mx-3 sm:-mx-4 lg:-mx-6 -mt-3 sm:-mt-4 lg:-mt-6' : ''}">
          ${heroGreetingEnabled ? `
            <div class="flex items-center px-3 sm:px-4 lg:px-6">
              <div class="inline-flex items-center gap-1.5 px-3.5 py-1.5 font-bold text-xs shadow-xs select-none bg-white/95 backdrop-blur-md text-slate-800 border border-slate-200/80 rounded-full">
                <span>${escapeHtml(dynamicGreetingText)}</span>
              </div>
            </div>
          ` : ''}
          <div class="relative overflow-hidden ${isFullWidth ? 'rounded-none border-x-0' : 'rounded-3xl border border-slate-200/80'} shadow-xl group ${animType.startsWith('fade') ? 'hero-anim-fade' : ''}" id="hero-slider-container" data-anim="${animType}" data-count="${heroBanners.length}">
            <div class="aspect-[21/9] sm:aspect-[24/9] md:aspect-[3/1] w-full relative bg-slate-900 overflow-hidden ${isFullWidth ? 'rounded-none' : 'rounded-3xl'}">
              <div class="hero-slider-track w-full h-full relative">
                ${slidesHtml}
              </div>
              ${controlsHtml}
            </div>
          </div>
        </div>
      `;
    } else if (heroModel === 'model_3') {
      // [3] Model Gambar DENGAN Teks & CTA Overlay (Full-Width atau Boxed Container)
      heroSectionHtml = `
        <div class="${isFullWidth ? '-mx-3 sm:-mx-4 lg:-mx-6 -mt-3 sm:-mt-4 lg:-mt-6' : ''}">
          <div class="relative overflow-hidden ${isFullWidth ? 'rounded-none border-x-0' : 'rounded-3xl border border-white/10'} shadow-2xl group ${animType.startsWith('fade') ? 'hero-anim-fade' : ''}" id="hero-slider-container" data-anim="${animType}" data-count="${heroBanners.length}">
            <div class="min-h-[380px] sm:min-h-0 sm:aspect-[21/9] md:aspect-[24/9] w-full relative bg-slate-950 overflow-hidden ${isFullWidth ? 'rounded-none' : 'rounded-3xl'} flex items-center">
              <div class="hero-slider-track absolute inset-0 w-full h-full">
                ${slidesHtml}
              </div>
              <div class="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/40 z-10 pointer-events-none"></div>
              
              <div class="relative z-20 p-5 sm:p-10 md:p-12 max-w-2xl space-y-3 sm:space-y-3.5 text-white w-full">
                ${heroGreetingBadgeHtml}
                <h1 class="text-lg sm:text-3xl md:text-4xl font-black tracking-tight leading-snug sm:leading-tight" style="color: ${heroTitleColor};">
                  ${escapeHtml(settings.hero_headline || 'Cetak Banner, Desain & Souvenir Harga Instan')}
                </h1>
                <p class="text-xs sm:text-sm leading-relaxed max-w-xl line-clamp-2 sm:line-clamp-3" style="color: ${heroSubtitleColor};">
                  ${escapeHtml(settings.hero_subheadline || 'Katalog terpadu dengan kalkulator instan: spesifikasi kustom meteran, jasa desain original, hingga souvenir retail siap kirim ke seluruh Indonesia.')}
                </p>
                <div class="pt-2 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full">
                  <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                    ${heroDualCtaHtml}
                  </div>
                  ${heroTimerHtml}
                </div>
              </div>
              ${controlsHtml}
            </div>
          </div>
        </div>
      `;
    } else {
      // [4] Model Split / Berdampingan (2 Kolom: Kiri Teks Judul & CTA, Kanan Slider Multi-Gambar, Rounded-3xl)
      heroSectionHtml = `
        <div class="relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl border border-white/10 ${animType.startsWith('fade') ? 'hero-anim-fade' : ''}" style="${heroBgCss}" id="hero-slider-container" data-anim="${animType}" data-count="${heroBanners.length}">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            <div class="lg:col-span-7 space-y-4">
              ${heroGreetingBadgeHtml}
              <h1 class="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-snug sm:leading-tight" style="color: ${heroTitleColor};">
                ${escapeHtml(settings.hero_headline || 'Cetak Banner, Desain & Souvenir Harga Instan')}
              </h1>
              <p class="text-xs sm:text-sm leading-relaxed max-w-xl" style="color: ${heroSubtitleColor};">
                ${escapeHtml(settings.hero_subheadline || 'Katalog terpadu dengan kalkulator instan: spesifikasi kustom meteran, jasa desain original, hingga souvenir retail siap kirim ke seluruh Indonesia.')}
              </p>
              <div class="pt-2 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full">
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                  ${heroDualCtaHtml}
                </div>
                ${heroTimerHtml}
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

    // --------------------------------------------------------------------------
    // CONFIG QUICK FILTER KATEGORI (5 MODEL TAMPILAN & STYLING MANDIRI)
    // --------------------------------------------------------------------------
    const qfConfig = settings.quick_filter_config || {
      model: 'icon_text',
      border_radius: '9999px',
      border_color: '#e2e8f0',
      bg_color: '#ffffff',
      icon_color: '#059669',
      text_color: '#0f172a',
      show_desktop_scrollbar: false,
      filter_all_text: 'Semua',
      filter_all_icon: 'layout-grid',
      filter_bestseller_text: 'Produk Terlaris',
      filter_bestseller_icon: 'flame',
      filter_promo_text: 'Sedang Promo',
      filter_promo_icon: 'ticket-percent'
    };
    const qfRadius = qfConfig.border_radius || '9999px';
    const qfBorder = qfConfig.border_color || '#e2e8f0';
    const qfBg = qfConfig.bg_color || '#ffffff';
    const qfIcon = qfConfig.icon_color || '#059669';
    const qfText = qfConfig.text_color || '#0f172a';
    const primColor = settings.primary_color || '#33b589';
    const qfContainerBg = settings.quick_filter_container_bg || settings.quick_filter_bg_color || '';
    const showDesktopScrollbar = !!qfConfig.show_desktop_scrollbar;
    const filterAllText = qfConfig.filter_all_text || 'Semua';
    const filterAllIcon = qfConfig.filter_all_icon || 'layout-grid';
    const filterBestsellerText = qfConfig.filter_bestseller_text || 'Produk Terlaris';
    const filterBestsellerIcon = qfConfig.filter_bestseller_icon || 'flame';
    const filterPromoText = qfConfig.filter_promo_text || 'Sedang Promo';
    const filterPromoIcon = qfConfig.filter_promo_icon || 'ticket-percent';

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

    function renderCategoryFilterButton(cat) {
      const isActive = activeMainCategoryId === cat.id;
      const model = qfConfig.model || 'icon_text';

      let innerContent = '';
      let btnPadding = 'px-4 py-2';

      if (model === 'only_image') {
        btnPadding = 'p-1.5';
        const imgSrc = cat.image || '';
        if (imgSrc) {
          innerContent = `
            <img src="${imgSrc}" class="w-12 h-12 object-contain rounded-xl shrink-0" alt="${escapeHtml(cat.name)}" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100 text-slate-400 text-xl\\'><i class=\\'bi bi-images\\'></i></div>';" />
          `;
        } else {
          innerContent = `
            <div class="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100 text-slate-400 text-xl shrink-0"><i class="bi bi-images"></i></div>
          `;
        }
      } else if (model === 'only_icon') {
        innerContent = `
          ${renderStoreCatIcon(cat.icon, 'text-base shrink-0', isActive ? '#ffffff' : qfIcon)}
        `;
      } else if (model === 'image_text') {
        const imgSrc = cat.image || '';
        const imgHtml = imgSrc
          ? `<img src="${imgSrc}" class="w-8 h-8 object-contain rounded-lg shrink-0" alt="${escapeHtml(cat.name)}" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 text-slate-400 text-xs\\'><i class=\\'bi bi-images\\'></i></div>';" />`
          : `<div class="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 text-slate-400 text-xs shrink-0"><i class="bi bi-images"></i></div>`;
        innerContent = `
          ${imgHtml}
          <span class="truncate">${escapeHtml(cat.name)}</span>
        `;
      } else if (model === 'icon_text') {
        innerContent = `
          ${renderStoreCatIcon(cat.icon, 'text-sm shrink-0', isActive ? '#ffffff' : qfIcon)}
          <span class="truncate">${escapeHtml(cat.name)}</span>
        `;
      } else { // only_text
        innerContent = `
          <span class="truncate">${escapeHtml(cat.name)}</span>
        `;
      }

      const activeStyle = `background-color: ${primColor}; color: #ffffff; border-color: ${primColor}; border-radius: ${qfRadius};`;
      const inactiveStyle = `background-color: ${qfBg}; color: ${qfText}; border: 1px solid ${qfBorder}; border-radius: ${qfRadius};`;

      return `
        <button type="button" class="btn-cat-filter ${btnPadding} text-xs font-bold transition flex items-center gap-2 whitespace-nowrap shrink-0 shadow-xs hover:brightness-95" style="${isActive ? activeStyle : inactiveStyle}" data-cat="${cat.id}" title="${escapeHtml(cat.name)}">
          ${innerContent}
        </button>
      `;
    }

    const activeStyle = `background-color: ${primColor}; color: #ffffff; border: 1px solid ${primColor}; border-radius: ${qfRadius};`;
    const inactiveStyle = `background-color: ${qfBg}; color: ${qfText}; border: 1px solid ${qfBorder}; border-radius: ${qfRadius};`;

    container.innerHTML = `
      <div class="space-y-8 pb-20">
        
        <!-- Sapaan Pelanggan Dinamis (Personalized Greeting) -->
        ${customerGreetingHtml}

        <!-- Hero Section Dinamis -->
        ${heroSectionHtml}

        <!-- CATALOG TITLE & QUICK FILTERS -->
        <div id="katalog-section" class="space-y-4">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 class="text-xl font-bold text-slate-900 tracking-tight">Katalog Produk & Layanan</h2>
              <p class="text-xs text-slate-500">Pilih kategori etalase atau cari produk yang Anda butuhkan melalui pencarian di atas.</p>
            </div>
            ${activeSearchQuery ? `
              <div class="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-1.5 rounded-xl shadow-xs">
                <span>Hasil Pencarian: "<strong>${escapeHtml(activeSearchQuery)}</strong>"</span>
                <button type="button" id="btn-clear-search-filter" class="hover:text-rose-600 font-bold ml-1 text-slate-400 hover:scale-110 transition" title="Hapus Filter Pencarian">✕</button>
              </div>
            ` : ''}
          </div>

          <!-- QUICK FILTER BAR: HANYA 'Semua' Tetap (Pinned / Tidak Ikut Swipe) & Sisanya Ikut Geser/Swipe -->
          <div id="quick-filter-container" class="p-1 sm:p-1.5 rounded-2xl flex items-center gap-2 max-w-full overflow-hidden bg-transparent">
            
            <!-- Pinned Quick Filter: HANYA 'Semua' - TIDAK IKUT TER-SCROLL / SWIPE -->
            <div class="flex items-center shrink-0 z-10 sticky left-0 pr-1.5 sm:pr-2 border-r border-slate-200/80 bg-slate-100/95 backdrop-blur-xs">
              <!-- Filter: Semua -->
              <button type="button" class="btn-quick-filter px-3 sm:px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs hover:brightness-95" style="${(activeQuickFilter === 'all' && activeMainCategoryId === 'all') ? activeStyle : inactiveStyle}" data-filter="all" title="${escapeHtml(filterAllText)}">
                ${renderStoreCatIcon(filterAllIcon, 'text-xs shrink-0', (activeQuickFilter === 'all' && activeMainCategoryId === 'all') ? '#ffffff' : qfIcon)}
                <span>${escapeHtml(filterAllText)}</span>
              </button>
            </div>

            <!-- Category Filter Tabs & Filter Terlaris + Diskon (Bisa di-swipe / di-scroll bebas) -->
            <div class="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto py-1 ${showDesktopScrollbar ? 'desktop-scrollbar-visible' : 'scrollbar-none'}">
              <!-- Filter: Terlaris (Ikut Swipe) -->
              <button type="button" class="btn-quick-filter px-3 sm:px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs hover:brightness-95" style="${activeQuickFilter === 'bestseller' ? activeStyle : inactiveStyle}" data-filter="bestseller" title="${escapeHtml(filterBestsellerText)}">
                ${renderStoreCatIcon(filterBestsellerIcon, 'text-xs shrink-0', activeQuickFilter === 'bestseller' ? '#ffffff' : qfIcon)}
                <span>${escapeHtml(filterBestsellerText)}</span>
              </button>

              <!-- Filter: Sedang Diskon / Promo (Ikut Swipe) -->
              <button type="button" class="btn-quick-filter px-3 sm:px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs hover:brightness-95" style="${activeQuickFilter === 'discount' ? activeStyle : inactiveStyle}" data-filter="discount" title="${escapeHtml(filterPromoText)}">
                ${renderStoreCatIcon(filterPromoIcon, 'text-xs shrink-0', activeQuickFilter === 'discount' ? '#ffffff' : qfIcon)}
                <span>${escapeHtml(filterPromoText)}</span>
              </button>

              ${allCategories.map(cat => renderCategoryFilterButton(cat)).join('')}
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

        <!-- PRODUCT CATALOG GRID WITH RESPONSIVE LAYOUT & INTERSPERSED PROMO BANNERS -->
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
          <!-- Responsive Grid: Mobile 2 Kolom, Tablet 3 Kolom, Desktop 6 Kolom Murni -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 items-stretch">
            ${renderProductGridWithBanners(allActiveProducts, cardVariantsConfig)}
          </div>
        `}

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    updateCartBadge();
    initHeroSlider();
    initStoreSponsorCarousels();
  }

  // Intersperses Promotional & Sponsor Cards into Product Grid
  // Strict Edge Placement: Dilarang di Baris 1; Hanya di Kolom 6 baris genap (Desktop 6 Kolom) & Kolom 2 baris genap mulai baris 3 (Mobile 2 Kolom)
  // Rasio Seimbang (50:50): Promo -> Sponsor -> Promo -> Sponsor bergantian
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

    // Saring antrean secara ketat dari database (Hapus total pemanggilan fallback/dummy statis lama)
    const activePromos = (typeof DB !== 'undefined' && DB.getPromoList) ? (DB.getPromoList() || []).filter(p => p.is_active === true) : [];
    const activeSponsors = (typeof DB !== 'undefined' && DB.getSponsorList) ? (DB.getSponsorList() || []).filter(s => s.is_active === true) : [];

    const promoGenerators = activePromos.map(p => {
      if (p.card_model === 'variant_2') {
        return () => renderPromoCardVariation2(p, promo2);
      }
      return () => renderPromoCardVariation1(p, promo1);
    });

    const sponsorGenerators = activeSponsors.map(s => {
      if (s.type === 'carousel') {
        return () => renderSponsorCarouselCard(s, sponsor1);
      } else if (s.type === 'internal') {
        return () => renderSponsorInternalProductsCard({ sponsor_internal: s, internal_promo_title: s.title }, sponsor2);
      } else {
        return () => renderSponsorAdCard(s, sponsor1);
      }
    });

    // Aturan Penempatan Banner di Slot Grid:
    // 1. JIKA activePromos KOSONG dan activeSponsors ADA: Banner slot WAJIB merender item dari activeSponsors (contoh: Sponsor Produk Sendiri Grid 2x2).
    // 2. JIKA KEDUANYA KOSONG: JANGAN render banner kartu apa pun di grid etalase (hanya tampilkan kartu produk riil).
    // 3. JIKA KEDUANYA ADA: Sisipkan berselang-seling (Promo -> Sponsor -> Promo, dst.).
    let bannerGenerators = [];
    if (promoGenerators.length === 0 && sponsorGenerators.length > 0) {
      bannerGenerators = sponsorGenerators;
    } else if (promoGenerators.length > 0 && sponsorGenerators.length === 0) {
      bannerGenerators = promoGenerators;
    } else if (promoGenerators.length > 0 && sponsorGenerators.length > 0) {
      const maxLen = Math.max(promoGenerators.length, sponsorGenerators.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < promoGenerators.length) bannerGenerators.push(promoGenerators[i]);
        if (i < sponsorGenerators.length) bannerGenerators.push(sponsorGenerators[i]);
      }
    }

    let bannerMobileIndex = 0;
    let bannerDesktopIndex = 0;

    products.forEach((prod, idx) => {
      // Tentukan versi kartu produk:
      // Prioritaskan preferensi toko global (settings.card_product_version: 'v1' | 'v2' | 'v3')
      // namun tetap mendukung override jika produk diset eksplisit (prod.card_variant_override === true)
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

      // STRICT EDGE PLACEMENT (Hanya jika terdapat banner aktif):
      if (bannerGenerators.length > 0) {
        // Mobile (2 Kolom): Banner PERTAMA muncul di Posisi ke-6 (Row 3, Kolom 2). Banner berikutnya berjarak 3 produk.
        if ((idx + 1) >= 5 && ((idx + 1) - 5) % 3 === 0) {
          const renderBanner = bannerGenerators[bannerMobileIndex % bannerGenerators.length];
          html += `<div class="block lg:hidden w-full h-full">${renderBanner()}</div>`;
          bannerMobileIndex++;
        }

        // Desktop (6 Kolom): Banner PERTAMA muncul di Posisi ke-12 (Row 2, Kolom 6 - setelah 11 produk).
        if ((idx + 1) >= 11 && ((idx + 1) - 11) % 11 === 0) {
          const renderBanner = bannerGenerators[bannerDesktopIndex % bannerGenerators.length];
          html += `<div class="hidden lg:block w-full h-full">${renderBanner()}</div>`;
          bannerDesktopIndex++;
        }
      }
    });

    return html;
  }

  // --- HELPER METRIK PENJUALAN & LABEL KHUSUS PRODUK ---
  function formatSalesCount(count, compact = false) {
    const num = parseInt(count, 10) || 0;
    if (num < 1000) {
      return compact ? `${num}` : `${num} Terjual`;
    }
    const k = Math.floor(num / 1000);
    const isExact = (num % 1000 === 0);
    const label = isExact ? `${k}RB` : `${k}RB+`;
    return compact ? label : `${label} Terjual`;
  }

  function getProductCustomBadges(prod, effDiscount) {
    let labels = [];
    if (Array.isArray(prod.custom_labels) && prod.custom_labels.length > 0) {
      labels = prod.custom_labels.filter(Boolean);
    } else if (typeof prod.custom_labels === 'string' && prod.custom_labels.trim()) {
      labels = prod.custom_labels.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (labels.length === 0) {
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

    return labels.slice(0, 2);
  }

  // --- 1. PRODUCT CARD VARIANTS RENDERERS (WIREFRAME COMPLIANT) ---

  // CARD PRODUK VERSI 1: STANDARD SQUARE / PORTRAIT (Variasi A)
  // - Gambar: Rasio persegi 1:1 (aspect-square w-full object-cover)
  // - Badge Diskon Gambar: Pojok kanan atas overlay gambar - % [diskon] (tanpa ikon tiket)
  // - Judul Produk: Maksimal 2 baris (line-clamp-2 text-xs sm:text-sm font-semibold h-8 sm:h-9 leading-snug)
  // - Baris Fitur/Label: Rating bintang (★ 4.9) + Label Countdown (jika promo aktif) atau Label Khusus (jika diskon off)
  // - Baris Harga: Harga Coret di Atas, Harga Final + Ikon Tiket Cek di Bawah Sejajar Horizontal dengan Label Terjual
  // - Footer Tambahan: Tidak ada (clean bottom)
  function renderCardVariantA(prod, config = {}) {
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
    const showBadge = config.show_badge !== false && config.show_category_badge !== false;
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
                  • ${formatSalesCount(prod.sales_count, false)}
                </span>
                <span class="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap inline sm:hidden">
                  • ${formatSalesCount(prod.sales_count, true)}
                </span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // CARD PRODUK VERSI 2: MINIMALIS 1 BARIS (Variasi B)
  // - Gambar: Rasio persegi 1:1 (aspect-square w-full object-cover rounded-t-2xl)
  // - Badge Diskon Gambar: Pojok kanan atas - % [diskon] (tanpa ikon tiket)
  // - Judul Produk: Wajib 1 baris teks besar tebal (truncate text-sm sm:text-base font-bold text-slate-900)
  // - Baris Fitur/Label: Rating bintang (★ 4.9) + Label Countdown (jika aktif) atau Label Khusus
  // - Baris Harga: Harga Coret di Atas, Harga Final + Ikon Tiket Cek di Bawah Sejajar Horizontal dengan Label Terjual
  // - Footer Tambahan: Tidak ada (clean bottom tanpa cart button)
  function renderCardVariantB(prod, config = {}) {
    const minPrice = getProductStartingPrice(prod);
    const effDiscount = prod.effective_discount || (typeof DB !== 'undefined' && DB.getProductEffectiveDiscount ? DB.getProductEffectiveDiscount(prod) : { has_discount: false });

    const bgColor = config.bg_color || '#ffffff';
    const borderColor = config.border_color || '#e9d5ff';
    const borderRadius = config.border_radius || '16px';
    const titleColor = config.title_color || '#0f172a';
    const priceColor = config.price_color || '#059669';

    const showRating = config.show_rating !== false;
    const showSales = config.show_sales_count !== false;
    const showStrike = config.show_strikethrough_price !== false;
    const showTicketIcon = config.show_ticket_icon !== false;
    const showBadge = config.show_badge !== false && config.show_category_badge !== false;
    const showDiscBadge = config.show_discount_badge !== false;

    // Discount badge styling on image
    const discBadgeRadius = config.discount_badge_radius || '8px';
    const discBadgeBg = config.discount_badge_bg_color || '#059669';
    const discBadgeText = config.discount_badge_text_color || '#ffffff';
    const discBadgeBorder = config.discount_badge_border_color || discBadgeBg;
    const discBadgeStyle = `background-color: ${discBadgeBg}; color: ${discBadgeText}; border: 1px solid ${discBadgeBorder}; border-radius: ${discBadgeRadius};`;

    const badgeRadius = config.badge_radius || '6px';
    const badgeTextColor = config.badge_text_color || '#6b21a8';
    const badgeBgColor = config.badge_bg_color || '#faf5ff';
    const badgeBorderColor = config.badge_border_color || '#e9d5ff';
    const badgeStyle = `color: ${badgeTextColor}; background-color: ${badgeBgColor}; border: 1px solid ${badgeBorderColor}; border-radius: ${badgeRadius};`;

    const customBadges = getProductCustomBadges(prod, effDiscount);

    // Evaluasi Countdown Promo Produk Spesifik
    const countdownInfo = (typeof DB !== 'undefined' && DB.getProductCountdownInfo) ? DB.getProductCountdownInfo(prod, effDiscount) : { is_active: false };
    const countdownRadius = config.countdown_radius || '9999px';
    const countdownBg = prod.countdown_bg_color || config.countdown_bg_color || '#059669';
    const countdownTextColor = prod.countdown_text_color || config.countdown_text_color || '#ffffff';
    const countdownIconColor = prod.countdown_icon_color || config.countdown_icon_color || countdownTextColor;
    const countdownBorder = prod.countdown_border_color || config.countdown_border_color || '#059669';
    const countdownStyle = `background-color: ${countdownBg}; color: ${countdownTextColor}; border: 1px solid ${countdownBorder}; border-radius: ${countdownRadius};`;

    return `
      <div class="h-full flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-xs hover:shadow-lg transition-all cursor-pointer group relative" onclick="window.location.href='product.html?id=${prod.id}'" style="background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: ${borderRadius};" data-id="${prod.id}">
        <!-- Image Box - Rasio 1:1 Persegi -->
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
            <!-- Judul Produk: Wajib 1 Baris Teks Besar Tebal -->
            <a href="product.html?id=${prod.id}" class="block truncate text-sm sm:text-base font-bold text-slate-900 group-hover:opacity-80 transition leading-snug" style="${titleColor ? `color: ${titleColor};` : ''}" title="${escapeHtml(prod.name)}">
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
                  • ${formatSalesCount(prod.sales_count, false)}
                </span>
                <span class="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap inline sm:hidden">
                  • ${formatSalesCount(prod.sales_count, true)}
                </span>
              </div>
            ` : ''}
          </div>
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
  function renderCardVariantC(prod, config = {}) {
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
    const showBadge = config.show_badge !== false && config.show_category_badge !== false;
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

    // Konfigurasi Footer 1 (Strip Atas)
    const footer1Text = prod.card_footer_text || prod.footer_badge_text || config.footer_text || 'Proses Hanya Dalam 1Jam';
    const footer1Icon = prod.footer_badge_icon || config.footer_icon || 'truck';
    const footer1Bg = prod.footer_bg_color || config.footer_bg_color || '#059669';
    const footer1TextColor = prod.footer_text_color || config.footer_text_color || '#ffffff';

    // Konfigurasi Footer 2 (Strip Bawah / Wadah Countdown)
    const footer2Text = prod.card_footer_2_text || config.footer_2_text || 'Variasi Paket Tersedia/tidak tersedia';
    const footer2Icon = prod.footer_2_badge_icon || config.footer_2_icon || 'minus';
    const footer2Bg = prod.footer_2_bg_color || config.footer_2_bg_color || '#047857';
    const footer2TextColor = prod.footer_2_text_color || config.footer_2_text_color || '#ffffff';

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
                <span class="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap hidden sm:inline">
                  • ${formatSalesCount(prod.sales_count, false)}
                </span>
                <span class="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap inline sm:hidden">
                  • ${formatSalesCount(prod.sales_count, true)}
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
  // Sesuai Wireframe: TANPA elemen judul teks di bawah gambar. HANYA tombol CTA di bawah gambar.
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

    const promoImg = targetPromo.image_url || targetPromo.banner_image || config.image_url || '';
    const borderColor = config.border_color || '#e2e8f0';
    const borderRadius = config.border_radius || '16px';

    // Apakah Countdown aktif? (CD vs Non-CD)
    const isCD = targetPromo.show_timer !== false;
    // Mode CTA: 'dual' (2 CTA) vs 'single' / 'catalog_only' / 'consultation_only' (1 CTA)
    const ctaMode = targetPromo.cta_mode || 'dual';
    const isDualCTA = ctaMode === 'dual';

    // Background styling calculation
    const bgType = targetPromo.bg_type || 'solid';
    const bgColor1 = targetPromo.bg_color1 || config.bg_color || '#ffffff';
    const bgColor2 = targetPromo.bg_color2 || '#f8fafc';
    const bgAngle = targetPromo.bg_angle !== undefined ? targetPromo.bg_angle : 135;
    let bgCss = `background-color: ${bgColor1};`;
    if (bgType === 'linear_gradient') {
      bgCss = `background: linear-gradient(${bgAngle}deg, ${bgColor1} 0%, ${bgColor2} 100%);`;
    } else if (bgType === 'radial_gradient') {
      bgCss = `background: radial-gradient(circle at center, ${bgColor1} 0%, ${bgColor2} 100%);`;
    }

    let discText = '';
    if (targetPromo.discount_type === 'nominal') {
      discText = `POTONGAN Rp ${Math.round(targetPromo.discount_value || 0).toLocaleString('id-ID')}`;
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
    const waUrl = `https://wa.me/${cleanPhone || '628885844380'}?text=${encodeURIComponent('Halo Songer Creative, saya ingin tanya info promo: ' + (targetPromo.label || targetPromo.name || 'Promo Spesial'))}`;

    const cta1Text = targetPromo.cta1_text || 'Ingatkan Saya';
    const cta2Text = targetPromo.cta2_text || 'Tanya Admin';

    const cta1Btn = `
      <button type="button" class="btn-remind-promo w-full py-1.5 sm:py-2 px-2.5 rounded-xl text-[10px] sm:text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-xs hover:brightness-95 border border-black/5 bg-slate-900 text-white cursor-pointer" data-promo="${escapeHtml(targetPromo.label || targetPromo.name || 'Promo Spesial')}">
        <i class="bi bi-bell-fill text-xs shrink-0 text-amber-300"></i>
        <span class="truncate">${escapeHtml(cta1Text)}</span>
      </button>
    `;

    const cta2Btn = `
      <a href="${waUrl}" target="_blank" class="w-full py-1.5 sm:py-2 px-2.5 rounded-xl text-[10px] sm:text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-sm hover:brightness-105 border border-black/5 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer">
        <i class="bi bi-whatsapp text-xs shrink-0"></i>
        <span class="truncate">${escapeHtml(cta2Text)}</span>
      </a>
    `;

    let ctaSectionHtml = '';
    if (isDualCTA) {
      ctaSectionHtml = `
        <div class="mt-auto pt-2 flex flex-col gap-1.5">
          ${cta1Btn}
          ${cta2Btn}
        </div>
      `;
    } else {
      const singleBtn = ctaMode === 'consultation_only' ? cta2Btn : cta1Btn;
      ctaSectionHtml = `
        <div class="mt-auto pt-2 flex flex-col gap-1.5">
          ${singleBtn}
        </div>
      `;
    }

    return `
      <div class="h-full flex flex-col justify-between overflow-hidden rounded-2xl border shadow-xs hover:shadow-xl transition-all duration-300 group relative bg-white" style="border-color: ${borderColor}; border-radius: ${borderRadius}; ${bgCss}">
        <!-- Area Gambar Rasio 3:4 Bleed to Edge (Menempel Penuh ke Batas Tepi Atas, Kiri, dan Kanan) -->
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

        <!-- Area Bawah: HANYA Tombol CTA Tanpa Judul Teks Sesuai Wireframe -->
        <div class="p-3 sm:p-3.5 flex-1 flex flex-col justify-end">
          ${ctaSectionHtml}
        </div>
      </div>
    `;
  }

  // CARD PROMO VERSI NON-GAMBAR / TEKS (GAMBAR 2 - BAWAH):
  // Background solid/gradient berbingkai rapi
  // 4 Varian:
  // 1. Varian 2 CTA + CD: Judul Baris 1 & Sub-Judul Baris 2, Kotak Countdown, 2 CTA vertikal
  // 2. Varian 2 CTA Non-CD: Judul Baris 1, Sub-Judul Baris 2, Deskripsi, 2 CTA
  // 3. Varian 1 CTA + CD: Judul Baris 1 & Sub-Judul Baris 2, Kotak Countdown, 1 CTA
  // 4. Varian 1 CTA Non-CD: Judul Baris 1, Sub-Judul Baris 2, Deskripsi, 1 CTA
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

    const borderColor = config.border_color || '#334155';
    const borderRadius = config.border_radius || '16px';
    const titleColor = targetPromo.title_color || config.title_color || '#ffffff';
    const priceColor = targetPromo.discount_color || config.price_color || '#f59e0b';

    // Apakah Countdown aktif? (CD vs Non-CD)
    const isCD = targetPromo.show_timer !== false;
    // Apakah Dual CTA?
    const ctaMode = targetPromo.cta_mode || 'dual';
    const isDualCTA = ctaMode === 'dual';

    // Background calculation
    const bgType = targetPromo.bg_type || 'linear_gradient';
    const bgColor1 = targetPromo.bg_color1 || config.bg_color || '#0f172a';
    const bgColor2 = targetPromo.bg_color2 || '#1e293b';
    const bgAngle = targetPromo.bg_angle !== undefined ? targetPromo.bg_angle : 135;
    let bgCss = `background-color: ${bgColor1};`;
    if (bgType === 'linear_gradient') {
      bgCss = `background: linear-gradient(${bgAngle}deg, ${bgColor1} 0%, ${bgColor2} 100%);`;
    } else if (bgType === 'radial_gradient') {
      bgCss = `background: radial-gradient(circle at center, ${bgColor1} 0%, ${bgColor2} 100%);`;
    }

    const timerStatusText = isCardPaused ? 'Segera Hadir' : 'Berakhir Dalam:';

    const phone = (settings.store_phone || '0888-5844-380').replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const waUrl = `https://wa.me/${cleanPhone || '628885844380'}?text=${encodeURIComponent('Halo Songer Creative, saya ingin tanya info promo: ' + (targetPromo.label || targetPromo.name || 'Promo Spesial'))}`;

    const cta1Text = targetPromo.cta1_text || 'Ingatkan Saya';
    const cta2Text = targetPromo.cta2_text || 'Konsultasi Desain & Cetak';

    const cta1Btn = `
      <button type="button" class="btn-remind-promo w-full py-1.5 sm:py-2 px-2.5 rounded-xl text-[10px] sm:text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-xs border border-white/10 bg-slate-900/80 hover:bg-slate-900 text-white cursor-pointer" data-promo="${escapeHtml(targetPromo.label || targetPromo.name || 'Promo Spesial')}">
        <i class="bi bi-bell-fill text-xs shrink-0 text-amber-300"></i>
        <span class="truncate">${escapeHtml(cta1Text)}</span>
      </button>
    `;

    const cta2Btn = `
      <a href="${waUrl}" target="_blank" class="w-full py-1.5 sm:py-2 px-2.5 rounded-xl text-[10px] sm:text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-sm border border-white/10 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer">
        <i class="bi bi-whatsapp text-xs shrink-0"></i>
        <span class="truncate">${escapeHtml(cta2Text)}</span>
      </a>
    `;

    const ctaSectionHtml = isDualCTA ? `
      <div class="relative z-10 mt-auto pt-2.5 flex flex-col gap-1.5 border-t border-slate-700/60">
        ${cta1Btn}
        ${cta2Btn}
      </div>
    ` : `
      <div class="relative z-10 mt-auto pt-2.5 flex flex-col gap-1.5 border-t border-slate-700/60">
        ${ctaMode === 'consultation_only' ? cta2Btn : cta1Btn}
      </div>
    `;

    // Title Baris 1 & Sub-Judul Baris 2 Parsing
    const line1 = (targetPromo.title_line1 || (targetPromo.label ? targetPromo.label.split(/\s+/)[0] : 'PROMO')).trim();
    const line2 = (targetPromo.title_line2 || (targetPromo.label ? targetPromo.label.split(/\s+/).slice(1).join(' ') : 'BULAN OKTOBER')).trim();

    // Nilai diskon: hilangkan jika tidak diisi/diinginkan seller (bersih sesuai wireframe)
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
      // Varian CD: Judul (2 Baris), Diskon (Opsional), Deskripsi, Kotak Countdown
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
          <p class="text-[10px] sm:text-[11px] text-slate-300 line-clamp-2 mt-1 leading-relaxed">
            ${escapeHtml(targetPromo.description || 'Potongan harga berlaku untuk produk pilihan.')}
          </p>
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
      // Varian Non-CD Sesuai Wireframe:
      // Judul Baris 1, Sub-Judul Baris 2, Diskon (Opsional), Deskripsi
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
          <p class="text-[10px] sm:text-[11px] text-slate-300 line-clamp-4 mt-2 leading-relaxed">
            ${escapeHtml(targetPromo.description || 'Hemat hingga potongan maksimal untuk semua transaksi cetak dan desain pilihan di seluruh etalase toko.')}
          </p>
        </div>
      `;
    }

    return `
      <div class="h-full flex flex-col justify-between p-3.5 sm:p-4 overflow-hidden rounded-2xl border shadow-lg relative text-white group transition hover:shadow-2xl" style="${bgCss} border-color: ${borderColor}; border-radius: ${borderRadius};">
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
    const bgColor = (config.bg_color !== undefined && config.bg_color !== '') ? config.bg_color : 'transparent';
    const borderColor = (config.border_color !== undefined && config.border_color !== '') ? config.border_color : '#e2e8f0';
    const borderRadius = config.border_radius || '16px';
    const settings = (typeof DB !== 'undefined' && DB.getSettings) ? DB.getSettings() : {};

    const targetUrl = ad.cta_target || ad.link_url || 'https://songercreative.com';
    const phone = (settings.store_phone || '0888-5844-380').replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const sponsorWaUrl = `https://wa.me/${cleanPhone || '628885844380'}?text=${encodeURIComponent('Halo Admin Songer Creative, saya ingin pasang iklan sponsor di etalase toko.')}`;

    const imgContainer = ad.image_url ? `
      <img src="${ad.image_url}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="Iklan Sponsor" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-center p-3\\'><i class=\\'bi bi-badge-ad text-3xl mb-1 text-slate-300\\'></i><span class=\\'text-[10px] font-bold text-slate-400\\'>SPACE IKLAN AVAILABLE</span></div>';" />
    ` : `
      <div class="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-center p-3">
        <i class="bi bi-badge-ad text-3xl mb-1 text-slate-300"></i>
        <span class="text-[10px] font-bold text-slate-400">SPACE IKLAN AVAILABLE</span>
      </div>
    `;

    return `
      <!-- CARD SPONSOR VERSI 1 GAMBAR DENGAN 2 CTA (WIREFRAME GAMBAR 1 & 2) -->
      <div class="h-full flex flex-col justify-between overflow-hidden rounded-2xl border shadow-xs hover:shadow-xl transition-all duration-300 group relative" style="background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: ${borderRadius};" data-id="${ad.id || 'sponsor'}">
        <!-- Area Gambar Rasio 3:4 Portrait (75% Tinggi Card Sponsor) -->
        <a href="${escapeHtml(targetUrl)}" target="_blank" class="relative w-full aspect-[3/4] bg-slate-100 overflow-hidden block shrink-0 cursor-pointer" title="Buka Tawaran Sponsor">
          ${imgContainer}
          <div class="absolute inset-0 bg-black/10 group-hover:bg-transparent transition duration-300 pointer-events-none"></div>
          <span class="absolute top-2.5 left-2.5 bg-slate-900/85 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm z-10">
            SPONSOR
          </span>
        </a>

        <!-- Bagian Bawah: 2 Tombol Aksi Stacked Vertikal Sesuai Wireframe Gambar 1 & 2 (~25% Tinggi Card) -->
        <div class="p-2 sm:p-2.5 flex-1 flex flex-col justify-end gap-1.5 mt-auto">
          <!-- Tombol 1: (Icon External Link) Lihat Tawaran -->
          <a href="${escapeHtml(targetUrl)}" target="_blank" class="w-full py-1.5 sm:py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] sm:text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-xs hover:brightness-110">
            <i class="bi bi-box-arrow-up-right text-xs"></i>
            <span class="truncate">${escapeHtml(ad.cta_label || 'Lihat Tawaran')}</span>
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

  // 2. Sponsor Carousel Multi-Image (Maksimal 5 Foto - Wireframe Gambar 1 #2):
  //    FULL IMG tanpa judul & deskripsi, TANPA TOMBOL CTA DI BAWAH.
  //    Tinggi serasi dan proporsional dengan kartu produk dalam baris yang sama.
  //    Dilengkapi dots navigasi dinamis: 1 slide = tanpa dots, 2-5 slide = 2-5 dots.
  function renderSponsorCarouselCard(carousel = {}, config = {}) {
    const bgColor = (config.bg_color !== undefined && config.bg_color !== '') ? config.bg_color : 'transparent';
    const borderColor = (config.border_color !== undefined && config.border_color !== '') ? config.border_color : '#e2e8f0';
    const borderRadius = config.border_radius || '16px';
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
        <div class="h-full w-full flex flex-col justify-between overflow-hidden rounded-2xl border shadow-xs hover:shadow-xl transition-all duration-300 group relative" style="background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: ${borderRadius};">
          <!-- Area Placeholder Penuh Sesuai Wireframe (FULL IMG TANPA CTA) -->
          <a href="${sponsorWaUrl}" target="_blank" class="relative w-full h-full flex-1 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white cursor-pointer group">
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
    // Dynamic Dots: jika 1 tidak ada dots, jika 2 hanya ada 2 dots, jika 3 maka 3, jika 4 maka 4, jika 5 maka 5
    const showDots = slideCount > 1;

    let slidesHtml = '';
    if (animType === 'fade' || animType === 'scale') {
      slidesHtml = slides.map((slide, idx) => `
        <div class="carousel-slide-item absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${idx === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}" data-slide="${idx}">
          <a href="${escapeHtml(slide.target_url || sponsorWaUrl)}" ${slide.target_url ? 'target="_blank"' : ''} class="w-full h-full block relative" title="Sponsor ${idx + 1}">
            <img src="${escapeHtml(slide.image_url)}" alt="Sponsor ${idx + 1}" class="w-full h-full object-cover group-hover:scale-105 transition duration-700" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-300 p-3\\'><i class=\\'bi bi-badge-ad text-3xl mb-1\\'></i><span class=\\'text-[10px] font-bold\\'>SPACE IKLAN AVAILABLE</span></div>';" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 group-hover:opacity-60 transition duration-300"></div>
          </a>
        </div>
      `).join('');
    } else {
      // Default: 'slide' horizontal
      slidesHtml = `
        <div class="slides-track flex w-full h-full transition-transform duration-500 ease-in-out">
          ${slides.map((slide, idx) => `
            <div class="w-full h-full shrink-0 relative block" style="width: 100%; height: 100%;">
              <a href="${escapeHtml(slide.target_url || sponsorWaUrl)}" ${slide.target_url ? 'target="_blank"' : ''} class="w-full h-full block relative" title="Sponsor ${idx + 1}">
                <img src="${escapeHtml(slide.image_url)}" alt="Sponsor ${idx + 1}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-300 p-3\\'><i class=\\'bi bi-badge-ad text-3xl mb-1\\'></i><span class=\\'text-[10px] font-bold\\'>SPACE IKLAN AVAILABLE</span></div>';" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 group-hover:opacity-60 transition duration-300"></div>
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
      <!-- CARD SPONSOR VERSI MAX 5 GAMBAR CAROUSEL TANPA CTA (WIREFRAME GAMBAR 1 & 2) -->
      <div id="${sliderId}" class="sponsor-carousel-container h-full w-full flex flex-col justify-between overflow-hidden rounded-2xl border shadow-xs hover:shadow-xl transition-all duration-300 group relative" style="background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: ${borderRadius};" data-anim="${animType}" data-interval="${intervalTime}" data-total="${slideCount}">
        <!-- Area Gambar Penuh (FULL IMG) Mengisi Penuh Kartu Mengikuti Baris Grid -->
        <div class="relative w-full h-full flex-1 min-h-0 overflow-hidden bg-slate-900">
          ${slidesHtml}
          
          <!-- Badge SPONSOR di Sudut Kiri Atas -->
          <span class="absolute top-2.5 left-2.5 bg-slate-900/85 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm z-20 pointer-events-none">
            SPONSOR
          </span>

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

  // 3. Sponsor Internal Toko ("Untuk Produk Sendiri" - Wireframe Gambar 1 #3):
  //    Menampilkan Judul Promo kustom di header (misal: "FLASH SALE 11.11").
  //    Di dalamnya terdapat grid 2x2 mini-card produk internal (4 mini card produk per batch slide).
  //    Dilengkapi dots dinamis: 1 batch = tanpa dots, 2-5 batch = 2-5 dots.
  //    Tinggi serasi dan proporsional dengan kartu produk dalam baris grid.
  function renderSponsorInternalProductsCard(promos, config = {}) {
    if (promos?.sponsor_internal && promos.sponsor_internal.active === false) return '';
    const allProducts = (typeof DB !== 'undefined' && DB.getProducts) ? DB.getProducts().filter(p => p.is_active !== false) : [];
    if (allProducts.length === 0) return '';

    const bgColor = (config.bg_color !== undefined && config.bg_color !== '') ? config.bg_color : 'transparent';
    const borderColor = (config.border_color !== undefined && config.border_color !== '') ? config.border_color : '#e2e8f0';
    const borderRadius = config.border_radius || '16px';

    // Prioritaskan produk pilihan seller dari admin panel jika ada
    const selectedIds = promos?.sponsor_internal?.product_ids || [];
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
    const title = promos?.sponsor_internal?.title || promos?.internal_promo_title || config.title || 'FLASH SALE 11.11';

    function renderMiniGrid(batchList) {
      return batchList.map(prod => {
        const effDiscount = prod.effective_discount || (typeof DB !== 'undefined' && DB.getProductEffectiveDiscount ? DB.getProductEffectiveDiscount(prod) : { has_discount: false });
        const minPrice = getProductStartingPrice(prod);
        const finalPrice = effDiscount.has_discount ? effDiscount.discounted_price : minPrice;
        const imgSrc = (Array.isArray(prod.images) && prod.images.length > 0) ? prod.images[0] : (prod.image_url || 'assets/images/logo-songer-creative.png');

        return `
          <a href="product.html?id=${prod.id}" class="group/mini block p-1.5 rounded-xl border border-slate-200/90 hover:border-emerald-500 bg-white hover:shadow-md transition flex flex-col justify-between">
            <div class="relative w-full aspect-square rounded-lg overflow-hidden bg-slate-100 shrink-0 mb-1">
              <img src="${imgSrc}" class="w-full h-full object-cover group-hover/mini:scale-105 transition duration-300" alt="${escapeHtml(prod.name)}" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-xs\\'><i class=\\'bi bi-image\\'></i></div>';" />
              ${effDiscount.has_discount ? `
                <span class="absolute top-1 right-1 bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-xs">
                  ${effDiscount.percent}%
                </span>
              ` : ''}
            </div>
            <div>
              <p class="text-[10px] sm:text-[11px] font-bold text-slate-800 line-clamp-1 group-hover/mini:text-emerald-700 transition leading-tight" title="${escapeHtml(prod.name)}">${escapeHtml(prod.name)}</p>
              <p class="text-[10px] sm:text-[11px] font-black text-emerald-600 mt-0.5">${formatIDR(finalPrice)}</p>
            </div>
          </a>
        `;
      }).join('');
    }

    const dotsHtml = showDots ? `
      <div class="flex items-center justify-center gap-1.5 py-1.5 mt-auto">
        ${batches.map((_, idx) => `
          <button type="button" class="internal-batch-dot w-2 h-2 rounded-full ${idx === 0 ? 'bg-emerald-600 scale-125' : 'bg-slate-300 hover:bg-slate-400'} transition-all cursor-pointer" data-target="${cardId}" data-batch="${idx + 1}" aria-label="Batch ${idx + 1}"></button>
        `).join('')}
      </div>
    ` : '';

    return `
      <!-- CARD SPONSOR UNTUK PRODUK SENDIRI (WIREFRAME GAMBAR 1 & 2) -->
      <div id="${cardId}" class="h-full flex flex-col justify-between p-3 sm:p-3.5 rounded-2xl border shadow-xs hover:shadow-xl transition-all duration-300 group relative" style="background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: ${borderRadius};">
        <!-- Header Judul Promo Sesuai Wireframe Gambar 1 (#3) -->
        <div class="flex items-center justify-between pb-2 border-b border-slate-200/80">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
            <h4 class="font-black text-xs sm:text-sm text-slate-900 tracking-tight uppercase truncate" title="${escapeHtml(title)}">${escapeHtml(title)}</h4>
          </div>
          <span class="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider shrink-0">PROMO</span>
        </div>

        <!-- Grid 2x2 Mini-Card Produk Internal (Batch Slides) -->
        <div class="relative flex-1 min-h-0 flex flex-col justify-center my-auto py-1.5">
          ${batches.map((batchList, idx) => `
            <div class="internal-batch-view batch-${idx + 1} grid grid-cols-2 gap-2 ${idx === 0 ? '' : 'hidden'} transition-all duration-300">
              ${renderMiniGrid(batchList)}
            </div>
          `).join('')}
        </div>

        <!-- Dynamic Dots Navigasi Slide Sesuai Jumlah Batch (1 batch = tanpa dots, 2-5 batch = 2-5 dots) -->
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
      // Hitung sisa jam hari ini sampai 23:59:59
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const diff = endOfDay - now;

      if (diff <= 0) {
        document.querySelectorAll('.interspersed-timer-val, #store-countdown').forEach(el => {
          el.textContent = '00j : 00m : 00d';
        });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const str = `${String(hours).padStart(2, '0')}j : ${String(mins).padStart(2, '0')}m : ${String(secs).padStart(2, '0')}d`;

      const storeCd = document.getElementById('store-countdown');
      if (storeCd) storeCd.textContent = str;

      document.querySelectorAll('.interspersed-timer-val').forEach(el => {
        el.textContent = str;
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

    // 2. Simpan order ke state Database lokal
    const newOrderId = DB.generateUUID ? DB.generateUUID() : 'ord-' + Date.now();
    const invoiceNum = 'INV-' + Date.now().toString().slice(-6);
    const orderItems = cart.map(it => ({
      productName: it.productName,
      materialName: it.materialName || 'Standar',
      finishingName: it.finishingName || '-',
      qty: it.qty,
      unitPrice: it.unitPrice,
      subtotal: it.subtotal,
      cost_price: Math.round(it.subtotal * 0.55)
    }));

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

    // Clear Search Filter Button (jika sedang aktif)
    const btnClearSearch = document.getElementById('btn-clear-search-filter');
    if (btnClearSearch) {
      btnClearSearch.addEventListener('click', () => {
        activeSearchQuery = '';
        const navInput = document.getElementById('navbar-search-input');
        if (navInput) navInput.value = '';
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

    // Internal Sponsor Mini-Cards Batch Switcher (Dinamis 1 hingga 5 Batches)
    document.querySelectorAll('.internal-batch-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const cardId = dot.getAttribute('data-target');
        const batchNum = dot.getAttribute('data-batch');
        const card = document.getElementById(cardId);
        if (!card) return;

        // Tampilkan batch yang dipilih dan sembunyikan batch lainnya
        card.querySelectorAll('.internal-batch-view').forEach(view => {
          if (view.classList.contains(`batch-${batchNum}`)) {
            view.classList.remove('hidden');
          } else {
            view.classList.add('hidden');
          }
        });

        // Perbarui highlight dot aktif
        card.querySelectorAll('.internal-batch-dot').forEach(d => {
          if (d.getAttribute('data-batch') === batchNum) {
            d.className = 'internal-batch-dot w-2 h-2 rounded-full bg-emerald-600 scale-125 transition-all cursor-pointer';
          } else {
            d.className = 'internal-batch-dot w-2 h-2 rounded-full bg-slate-300 hover:bg-slate-400 transition-all cursor-pointer';
          }
        });
      });
    });

    // Cart Drawer triggers
    const btnOpenCart = document.getElementById('btn-open-cart-drawer');
    const btnCloseCart = document.getElementById('btn-close-cart-drawer');
    const btnCheckoutWaCart = document.getElementById('btn-checkout-cart-wa');

    if (btnOpenCart) btnOpenCart.addEventListener('click', openCartDrawer);
    if (btnCloseCart) btnCloseCart.addEventListener('click', closeCartDrawer);
    if (btnCheckoutWaCart) btnCheckoutWaCart.addEventListener('click', checkoutWhatsAppCart);
  }

  // --- SMART NAVBAR SEARCH & AUTOCOMPLETE ---
  function initNavbarSearchAutocomplete() {
    const searchInput = document.getElementById('navbar-search-input');
    const suggestionsBox = document.getElementById('navbar-search-suggestions');
    const searchBackdrop = document.getElementById('navbar-search-backdrop');
    if (!searchInput || !suggestionsBox) return;

    const hideSearchDropdown = () => {
      suggestionsBox.classList.add('hidden');
      if (searchBackdrop) searchBackdrop.classList.add('hidden');
    };

    const showSearchDropdown = () => {
      suggestionsBox.classList.remove('hidden');
      if (searchBackdrop) searchBackdrop.classList.remove('hidden');
    };

    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) {
        hideSearchDropdown();
        suggestionsBox.innerHTML = '';
        return;
      }

      const allActiveProducts = DB.getProducts({ status: 'active' });
      const matched = allActiveProducts.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category_name && p.category_name.toLowerCase().includes(q))
      ).slice(0, 6);

      if (matched.length === 0) {
        suggestionsBox.innerHTML = `
          <div class="p-4 text-center text-slate-400 text-xs">
            <i class="bi bi-search text-xl block mb-1 text-slate-300"></i>
            Tidak ada produk yang cocok dengan "<strong>${escapeHtml(e.target.value)}</strong>"
          </div>
        `;
        showSearchDropdown();
        return;
      }

      const headerHtml = `
        <div class="px-3 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 bg-slate-50/80 rounded-t-xl mb-1">
          <span>Rekomendasi Produk</span>
          <span class="text-[10px] font-semibold text-emerald-600 lowercase">${matched.length} produk ditemukan</span>
        </div>
      `;

      const itemsHtml = matched.map(p => {
        const startingPrice = getProductStartingPrice(p);
        const effDiscount = p.effective_discount || DB.getProductEffectiveDiscount(p);
        const finalPrice = effDiscount.has_discount ? effDiscount.discounted_price : startingPrice;
        const img = (Array.isArray(p.images) && p.images[0]) || p.image_url || 'assets/images/logo-songer-creative.png';

        return `
          <div class="navbar-search-item p-2.5 rounded-xl hover:bg-emerald-50/70 cursor-pointer flex items-center gap-3 transition border-b border-slate-100 last:border-0 group" data-id="${p.id}">
            <img src="${img}" class="w-11 h-11 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200 shadow-2xs" alt="${escapeHtml(p.name)}" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-11 h-11 rounded-xl flex items-center justify-center bg-slate-100 text-slate-400 text-xs border border-slate-200\\'><i class=\\'bi bi-image\\'></i></div>';" />
            <div class="flex-1 min-w-0">
              <h5 class="text-xs font-bold text-slate-800 group-hover:text-emerald-700 truncate transition">${escapeHtml(p.name)}</h5>
              <div class="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                <span class="text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded uppercase">${escapeHtml(p.category_name || 'Percetakan')}</span>
                <span>•</span>
                <span class="font-extrabold text-slate-800">${formatIDR(finalPrice)}</span>
              </div>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 group-hover:text-emerald-500 shrink-0 transition"></i>
          </div>
        `;
      }).join('');

      suggestionsBox.innerHTML = headerHtml + itemsHtml;
      showSearchDropdown();
      if (window.lucide) window.lucide.createIcons();

      // Bind click on each suggestion item
      suggestionsBox.querySelectorAll('.navbar-search-item').forEach(item => {
        item.addEventListener('click', () => {
          const prodId = item.getAttribute('data-id');
          hideSearchDropdown();
          searchInput.value = '';

          // Reset filters so product is guaranteed visible in DOM
          activeQuickFilter = 'all';
          activeMainCategoryId = 'all';
          activeSubCategoryId = 'all';
          activeSearchQuery = '';
          renderStorefront();
          bindStoreEvents();

          // Smooth scroll to product card with highlight effect
          setTimeout(() => {
            const cardEl = document.querySelector(`[data-id="${prodId}"]`);
            if (cardEl) {
              cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

              // Blinking highlight border effect
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
        });
      });
    });

    // Close suggestions when clicking outside or on mobile backdrop
    if (searchBackdrop) {
      searchBackdrop.addEventListener('click', hideSearchDropdown);
    }

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        hideSearchDropdown();
      }
    });

    // Handle Enter key on search input: filter storefront
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        activeSearchQuery = searchInput.value.trim();
        hideSearchDropdown();
        renderStorefront();
        bindStoreEvents();
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

    const count = parseInt(sliderContainer.getAttribute('data-count') || '1', 10);
    if (count <= 1) return;

    const animType = sliderContainer.getAttribute('data-anim') || 'slide_3s';
    const isFade = animType.startsWith('fade');
    if (isFade) {
      sliderContainer.classList.add('hero-anim-fade');
    }

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
        // Horizontal slide transform
        incomingSlide.classList.remove('is-active', 'is-prev', 'is-next');
        incomingSlide.classList.add(direction > 0 ? 'is-next' : 'is-prev');
        void incomingSlide.offsetWidth; // Force synchronous reflow

        outgoingSlide.classList.remove('is-active');
        outgoingSlide.classList.add(direction > 0 ? 'is-prev' : 'is-next');

        incomingSlide.classList.remove('is-prev', 'is-next', 'is-hidden');
        incomingSlide.classList.add('is-active');
      }

      // Update dots indicator
      dots.forEach((dot, idx) => {
        if (idx === normalizedTarget) {
          dot.classList.add('bg-emerald-500', 'scale-125');
          dot.classList.remove('bg-white/60', 'bg-white/50');
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



    // Touch Swipe Manual Gesture Support (Mobile / Tablet)
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    sliderContainer.addEventListener('touchstart', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        touchStartX = e.changedTouches[0].clientX;
        touchStartY = e.changedTouches[0].clientY;
      }
    }, { passive: true });

    sliderContainer.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        // Hanya picu swipe horizontal jika gerakan dominan horizontal dan jarak > 35px
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
          if (slideInterval) clearInterval(slideInterval);
          if (diffX < 0) {
            goToSlide(currentIndex + 1, 1); // Swipe ke kiri -> slide berikutnya
          } else {
            goToSlide(currentIndex - 1, -1); // Swipe ke kanan -> slide sebelumnya
          }
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
      const intervalTime = parseInt(container.getAttribute('data-interval') || '3500', 10);
      const animType = container.getAttribute('data-anim') || 'slide';

      let currentIdx = 0;
      let timer = null;

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
      }

      function startAuto() {
        stopAuto();
        timer = setInterval(() => {
          goToSlide(currentIdx + 1);
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
          startAuto();
        });
      });

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
            if (diffX < 0) goToSlide(currentIdx + 1);
            else goToSlide(currentIdx - 1);
            startAuto();
          }
        }
      }, { passive: true });

      container.addEventListener('mouseenter', stopAuto);
      container.addEventListener('mouseleave', startAuto);
      startAuto();
    });
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
    openCartDrawer,
    closeCartDrawer,
    updateCartBadge,
    getCart: () => [...cart],
    renderCardVariantA,
    renderCardVariantB,
    renderCardVariantC,
    renderProductCardV1: renderCardVariantA,
    renderProductCardV2: renderCardVariantB,
    renderProductCardV3: renderCardVariantC
  };
})();




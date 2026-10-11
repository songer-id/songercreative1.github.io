/**
 * Songer Creative - Centralized Promo, Discount & Voucher Engine (Seller Center)
 * Mega Refactor Stage 4 - Complete Marketing Submenus Overhaul
 */

const PromoManager = (() => {
  let activeTab = 'promos'; // 'promos' | 'vouchers' | 'sponsors'
  let activePromoId = null; 
  let activeSponsorId = null;
  let activePromoType = 'twin'; // 'twin' | 'special' | 'monthly'
  let activeSponsorType = 'ad1'; // 'ad1' | 'carousel' | 'internal'
  let currentEditingPromoId = null;
  let currentEditingSponsorId = null;
  let currentPromoImages = [];
  let currentSponsorAdImages = [];
  let currentCarouselSlides = [];
  let currentInternalProductIds = [];
  let sponsorCarouselPreviewTimer = null;

  function clearSponsorPreviewTimer() {
    if (sponsorCarouselPreviewTimer) {
      clearInterval(sponsorCarouselPreviewTimer);
      sponsorCarouselPreviewTimer = null;
    }
  }

  // ============================================================================
  // UNIFIED IMAGE UPLOADER COMPONENT (STANDARISASI PROMO & SPONSOR)
  // ============================================================================
  function renderUnifiedUploaderHtml({ id, images = [], isMulti = false, placeholder = '' }) {
    const safeImages = Array.isArray(images) ? images.filter(Boolean) : (images ? [images] : []);
    return `
      <div id="${id}-wrapper" class="space-y-3">
        <!-- a. Kotak Unggah Area Putus-Putus (Dashed Dropzone) -->
        <div id="${id}-dropzone" class="border-2 border-dashed border-slate-300 rounded-3xl p-6 text-center hover:bg-slate-50 transition cursor-pointer bg-white group">
          <i data-lucide="upload-cloud" class="w-8 h-8 text-slate-400 group-hover:text-emerald-500 mx-auto mb-2 transition"></i>
          <span class="text-xs font-bold text-slate-700 block">Pilih Berkas Gambar atau Tarik & Lepas Gambar ke Sini</span>
          <span class="text-[11px] text-slate-400 mt-1 block">Format didukung: JPG, PNG, WEBP (Maksimal 500 KB per berkas)</span>
          <input type="file" id="${id}-file-input" accept="image/png, image/jpeg, image/webp" ${isMulti ? 'multiple' : ''} class="hidden" />
        </div>

        <!-- b. Opsi Fleksibel (Upload Berkas ATAU Tempel URL) -->
        <div class="flex items-center gap-2">
          <input type="text" id="${id}-url-input" placeholder="${placeholder || 'Atau tempel link URL gambar (https://...)'}" class="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono outline-none focus:border-emerald-500 bg-white" />
          <button type="button" id="${id}-btn-use-url" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs">
            <i data-lucide="link" class="w-3.5 h-3.5"></i>
            <span>Gunakan URL</span>
          </button>
        </div>

        <!-- c. Galeri Pratinjau Thumbnail (Thumbnail Grid) -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-slate-700">Pratinjau Thumbnail (<span id="${id}-thumb-count">${safeImages.length}</span> Gambar):</span>
            <span class="text-[10px] text-slate-400">${isMulti ? 'Maksimal 10 slide gambar' : 'Foto sampul kartu di etalase'}</span>
          </div>
          <div id="${id}-thumb-grid" class="flex flex-wrap gap-2.5 min-h-[5rem] p-2 bg-slate-50/70 border border-slate-100 rounded-2xl items-center">
            <!-- Rendered by initUnifiedUploader -->
          </div>
        </div>
      </div>
    `;
  }

  function initUnifiedUploader({ id, initialImages = [], isMulti = false, onChange }) {
    let images = Array.isArray(initialImages) ? [...initialImages].filter(Boolean) : (initialImages ? [initialImages] : []);

    const dropzone = document.getElementById(`${id}-dropzone`);
    const fileInput = document.getElementById(`${id}-file-input`);
    const urlInput = document.getElementById(`${id}-url-input`);
    const btnUseUrl = document.getElementById(`${id}-btn-use-url`);
    const thumbGrid = document.getElementById(`${id}-thumb-grid`);
    const thumbCount = document.getElementById(`${id}-thumb-count`);

    const toastWarning = (msg) => {
      if (window.AdminApp && typeof window.AdminApp.showToast === 'function') {
        window.AdminApp.showToast(msg, 'error');
      } else if (window.App && typeof window.App.showToast === 'function') {
        window.App.showToast(msg, 'error');
      } else if (typeof showToast === 'function') {
        showToast(msg, 'error');
      } else {
        alert(msg);
      }
    };

    const renderThumbs = () => {
      if (!thumbGrid) return;
      if (thumbCount) thumbCount.textContent = images.length;
      if (images.length === 0) {
        thumbGrid.innerHTML = `<span class="text-[11px] text-slate-400 italic py-2 px-1">Belum ada gambar yang dipilih.</span>`;
        return;
      }

      thumbGrid.innerHTML = images.map((url, idx) => `
        <div class="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs group shrink-0">
          <img src="${escapeHtml(url)}" class="w-full h-full object-cover" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-2xl\\'><i class=\\'bi bi-images\\'></i></div>';" />
          ${idx === 0 ? `
            <span class="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs pointer-events-none z-10">
              Foto Utama
            </span>
          ` : ''}
          <button type="button" class="btn-remove-thumb absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md transition z-20" data-idx="${idx}" title="Hapus gambar">
            <i data-lucide="x" class="w-3 h-3"></i>
          </button>
        </div>
      `).join('');

      if (window.lucide) window.lucide.createIcons();

      thumbGrid.querySelectorAll('.btn-remove-thumb').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idxToRemove = parseInt(btn.getAttribute('data-idx'), 10);
          images.splice(idxToRemove, 1);
          renderThumbs();
          if (onChange) onChange(images);
        });
      });
    };

    renderThumbs();

    // Dropzone click
    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => {
        fileInput.click();
      });

      // Drag & drop
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('border-emerald-500', 'bg-emerald-50/40');
      });
      dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-emerald-500', 'bg-emerald-50/40');
      });
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-emerald-500', 'bg-emerald-50/40');
        if (e.dataTransfer && e.dataTransfer.files) {
          processFiles(e.dataTransfer.files);
        }
      });
    }

    const processFiles = (files) => {
      if (!files || files.length === 0) return;
      const fileArr = Array.from(files);

      for (const file of fileArr) {
        if (file.size > 500 * 1024) {
          toastWarning('Ukuran gambar melebihi batas 500 KB!');
          return;
        }
      }

      let readRemaining = fileArr.length;
      fileArr.forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ev.target.result;
          if (!isMulti) {
            images = [result];
          } else {
            if (images.length < 10) images.push(result);
          }
          readRemaining--;
          if (readRemaining === 0) {
            renderThumbs();
            if (onChange) onChange(images);
          }
        };
        reader.readAsDataURL(file);
      });
      if (fileInput) fileInput.value = '';
    };

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        processFiles(e.target.files);
      });
    }

    const handleAddUrl = () => {
      if (!urlInput) return;
      const urlVal = urlInput.value.trim();
      if (!urlVal) return;
      if (!isMulti) {
        images = [urlVal];
      } else {
        if (images.length >= 10) {
          toastWarning('Maksimal 10 slide gambar!');
          return;
        }
        images.push(urlVal);
      }
      urlInput.value = '';
      renderThumbs();
      if (onChange) onChange(images);
    };

    if (btnUseUrl) {
      btnUseUrl.addEventListener('click', handleAddUrl);
    }
    if (urlInput) {
      urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddUrl();
        }
      });
    }

    return {
      getImages: () => images,
      setImages: (newImages) => {
        images = Array.isArray(newImages) ? [...newImages].filter(Boolean) : (newImages ? [newImages] : []);
        renderThumbs();
      }
    };
  }

  function startAdminCarouselRotation(slidesCount, interval = 3500, animType = 'slide') {
    clearSponsorPreviewTimer();
    if (slidesCount <= 1 || animType === 'manual') return;
    let currentIdx = 0;
    sponsorCarouselPreviewTimer = setInterval(() => {
      currentIdx = (currentIdx + 1) % slidesCount;
      const track = document.getElementById('sponsor-carousel-preview-track');
      const fadeSlides = document.querySelectorAll('.admin-carousel-preview-slide');
      const dots = document.querySelectorAll('.admin-carousel-preview-dot');
      
      if (animType === 'fade' || animType === 'scale') {
        fadeSlides.forEach((sl, idx) => {
          if (idx === currentIdx) {
            sl.style.opacity = '1';
            sl.style.zIndex = '10';
            if (animType === 'scale') sl.style.transform = 'scale(1.03)';
          } else {
            sl.style.opacity = '0';
            sl.style.zIndex = '0';
            if (animType === 'scale') sl.style.transform = 'scale(1)';
          }
        });
      } else if (track) {
        track.style.transform = `translateX(-${currentIdx * 100}%)`;
      }

      dots.forEach((dot, idx) => {
        if (idx === currentIdx) {
          dot.className = 'admin-carousel-preview-dot w-2 h-2 rounded-full bg-white scale-125 transition-all shadow-sm';
        } else {
          dot.className = 'admin-carousel-preview-dot w-1.5 h-1.5 rounded-full bg-white/50 hover:bg-white/80 transition-all';
        }
      });
    }, Math.max(1500, interval));
  }

  function renderCarouselSlideRows(slides) {
    const container = document.getElementById('carousel-slides-container');
    if (!container) return;
    if (!slides || slides.length === 0) {
      container.innerHTML = `<div class="p-3 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">Belum ada slide gambar. Silakan unggah berkas di atas atau tempel URL slide baru (maksimal 5 foto).</div>`;
      return;
    }
    const safeSlides = slides.slice(0, 5);
    container.innerHTML = safeSlides.map((slide, idx) => `
      <div class="carousel-slide-item p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3" data-index="${idx}">
        <div class="shrink-0 w-14 h-14 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <img src="${escapeHtml(slide.image_url || '')}" class="w-full h-full object-cover" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-sm\\'><i class=\\'bi bi-images\\'></i></div>';" />
        </div>
        <div class="flex-1 min-w-0 space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-slate-700">Slide #${idx + 1}</span>
            <button type="button" class="btn-remove-carousel-slide text-rose-500 hover:text-rose-700 p-1 text-xs font-bold transition flex items-center gap-1" data-index="${idx}">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              <span>Hapus Slide</span>
            </button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label class="block text-[10px] font-bold text-slate-700 mb-1">URL / Berkas Gambar Banner (Tampilan):</label>
              <input type="text" value="${escapeHtml(slide.image_url || '')}" placeholder="https://.../gambar-banner.webp atau unggah file" class="slide-image-url w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-[11px] outline-none focus:border-emerald-500 bg-white" />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-700 mb-1">Link Target Tujuan (Saat Gambar Diklik):</label>
              <input type="text" value="${escapeHtml(slide.target_url || '')}" placeholder="https://wa.me/... atau link produk (contoh: product.html?id=123)" class="slide-target-url w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-[11px] font-mono outline-none focus:border-emerald-500 bg-white" />
            </div>
          </div>
        </div>
      </div>
    `).join('');
    if (window.lucide) window.lucide.createIcons();

    // Attach events
    container.querySelectorAll('.btn-remove-carousel-slide').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        currentCarouselSlides.splice(idx, 1);
        renderCarouselSlideRows(currentCarouselSlides);
        updateSponsorPreviews();
      });
    });
    container.querySelectorAll('.slide-image-url').forEach(input => {
      input.addEventListener('input', () => {
        const row = input.closest('.carousel-slide-item');
        const idx = parseInt(row.getAttribute('data-index'), 10);
        if (currentCarouselSlides[idx]) {
          currentCarouselSlides[idx].image_url = input.value.trim();
          const imgEl = row.querySelector('img');
          if (imgEl) imgEl.src = input.value.trim();
          updateSponsorPreviews();
        }
      });
    });
    container.querySelectorAll('.slide-target-url').forEach(input => {
      input.addEventListener('input', () => {
        const row = input.closest('.carousel-slide-item');
        const idx = parseInt(row.getAttribute('data-index'), 10);
        if (currentCarouselSlides[idx]) {
          currentCarouselSlides[idx].target_url = input.value.trim();
        }
      });
    });
  }

  function init(initialTab = null) {
    if (initialTab) {
      if (['promos', 'promo', 'twin', 'monthly', 'special'].includes(initialTab)) {
        activeTab = 'promos';
      } else if (['vouchers', 'voucher'].includes(initialTab)) {
        activeTab = 'vouchers';
      } else if (['sponsors', 'sponsor', 'ad'].includes(initialTab)) {
        activeTab = 'sponsors';
      } else {
        activeTab = initialTab;
      }
    }
    render();
  }

  function render() {
    clearSponsorPreviewTimer();
    const container = document.getElementById('promo-manager-container');
    if (!container) return;

    const promos = DB.getPromos();
    const vouchers = DB.getVouchers();
    const categories = DB.getCategories();
    const products = DB.getAllProducts();

    container.innerHTML = `
      <div class="space-y-6 max-w-6xl mx-auto pb-16">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
              <span>Seller Center</span> <span>/</span> <span class="text-slate-800 font-semibold">Marketing & Promosi</span>
            </div>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Mesin Promosi, Diskon & Voucher</h1>
            <p class="text-xs text-slate-500 mt-0.5">
              Kelola program diskon terpadu, promo tanggal kembar otomatis, kupon voucher belanja, dan kartu sponsor etalase.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" id="btn-save-all-promos" class="btn-primary-brand px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition hover:brightness-105">
              <i data-lucide="save" class="w-4 h-4"></i>
              <span>Simpan Konfigurasi</span>
            </button>
          </div>
        </div>

        <!-- Submenu Navigation Tabs (3 Submenus Aligned with Sidebar) -->
        <div class="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
          <!-- Submenu 1: Promo Toko -->
          <button type="button" class="promo-tab-btn px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === 'promos' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}" data-tab="promos">
            <i data-lucide="ticket-percent" class="w-4 h-4"></i>
            <span>Promo Toko</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'promos' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}">
              ${(promos.twin_date.active ? 1 : 0) + (promos.special.active ? 1 : 0) + (promos.monthly.active ? 1 : 0)} Aktif
            </span>
          </button>

          <!-- Submenu 2: Kupon & Voucher -->
          <button type="button" class="promo-tab-btn px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === 'vouchers' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}" data-tab="vouchers">
            <i data-lucide="badge-percent" class="w-4 h-4"></i>
            <span>Kupon & Voucher</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'vouchers' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}">
              ${vouchers.length} Kupon
            </span>
          </button>

          <!-- Submenu 3: Iklan Sponsor -->
          <button type="button" class="promo-tab-btn px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === 'sponsors' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}" data-tab="sponsors">
            <i data-lucide="image" class="w-4 h-4"></i>
            <span>Iklan Sponsor</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'sponsors' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}">
              2 Slot
            </span>
          </button>
        </div>

        <!-- Submenu Body Content -->
        <div id="promo-tab-content" class="space-y-6">
          ${renderTabContent(promos, vouchers, categories, products)}
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    bindEvents();
  }

  function renderTabContent(promos, vouchers, categories, products) {
    if (activeTab === 'promos') {
      return renderPromoTokoTab(promos, categories, products);
    } else if (activeTab === 'vouchers') {
      return renderVouchersTab(vouchers, categories, products);
    } else if (activeTab === 'sponsors') {
      return renderSponsorsTab(promos);
    }
    return '';
  }

  // ============================================================================
  // SUBMENU 1: PROMO TOKO (STATUS TABLE + EDIT FORM + LIVE CARD PREVIEW)
  // ============================================================================
  // ============================================================================
  // SUBMENU 1: PROMO TOKO (STATUS TABLE + 5-STEP EDIT FORM + LIVE CARD PREVIEW)
  // ============================================================================
  function renderPromoTokoTab(promos, categories, products) {
    const promoList = Array.isArray(promos.promo_list) ? promos.promo_list : [];

    let current = null;
    if (activePromoId === 'new') {
      current = {
        id: 'promo_' + Date.now(),
        type: 'monthly',
        label: 'Promo Bulanan Awal Bulan',
        description: 'Potongan harga spesial untuk pesanan cetak & desain pilihan di awal bulan.',
        card_model: 'variant_1',
        monthly_start_day: 1,
        monthly_end_day: 7,
        start_datetime: '2026-10-01T00:00',
        end_datetime: '2026-10-31T23:59',
        discount_mode: 'all_products',
        discount_type: 'percent',
        discount_value: 15,
        min_spend: 50000,
        target_audience: 'all',
        title_color: '#0f172a',
        discount_color: '#e11d48',
        bg_type: 'solid',
        bg_color1: '#ffffff',
        bg_color2: '#f8fafc',
        bg_angle: 135,
        show_timer: true,
        cta_mode: 'dual',
        cta1_text: 'Ingatkan Saya',
        cta1_bg: '#33b589',
        cta1_text_color: '#ffffff',
        cta1_icon_color: '#ffffff',
        cta2_text: 'Konsultasi Desain & Cetak',
        cta2_bg: '#25d366',
        cta2_text_color: '#ffffff',
        cta2_icon_color: '#ffffff',
        use_theme_default: true,
        active: true,
        image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80'
      };
    } else if (activePromoId) {
      current = promoList.find(p => p.id === activePromoId);
    }

    if (!current && promoList.length > 0) {
      current = promoList[0];
      activePromoId = current.id;
    }

    if (!current) {
      current = {
        id: 'promo_' + Date.now(),
        type: 'monthly',
        label: 'Promo Bulanan Awal Bulan',
        description: 'Potongan harga spesial untuk pesanan cetak & desain pilihan di awal bulan.',
        card_model: 'variant_1',
        monthly_start_day: 1,
        monthly_end_day: 7,
        start_datetime: '2026-10-01T00:00',
        end_datetime: '2026-10-31T23:59',
        discount_mode: 'all_products',
        discount_type: 'percent',
        discount_value: 15,
        min_spend: 50000,
        target_audience: 'all',
        title_color: '#0f172a',
        discount_color: '#e11d48',
        bg_type: 'solid',
        bg_color1: '#ffffff',
        bg_color2: '#f8fafc',
        bg_angle: 135,
        show_timer: true,
        cta_mode: 'dual',
        cta1_text: 'Ingatkan Saya',
        cta1_bg: '#33b589',
        cta1_text_color: '#ffffff',
        cta1_icon_color: '#ffffff',
        cta2_text: 'Konsultasi Desain & Cetak',
        cta2_bg: '#25d366',
        cta2_text_color: '#ffffff',
        cta2_icon_color: '#ffffff',
        use_theme_default: true,
        active: true,
        image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80'
      };
    }

    if (!currentPromoImages || currentPromoImages.length === 0) {
      currentPromoImages = [current.image_url || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80'];
    }

    const isMonthly = (current.type || 'monthly') === 'monthly';
    const isSpecial = current.type === 'special';
    const isPerProduct = current.discount_mode === 'per_product';
    const isVariant2 = current.card_model === 'variant_2';

    return `
      <div class="space-y-6">
        
        <!-- 1. TABEL DAFTAR PROMO TOKO AKTIF (BERSIH DARI DATA DUMMY OTOMATIS) -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 class="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <i data-lucide="list-checks" class="w-5 h-5 text-emerald-600"></i>
                <span>Tabel Status Program Promo Toko</span>
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">Daftar seluruh program promosi yang dibuat oleh seller untuk etalase pembeli.</p>
            </div>
            <button type="button" id="btn-add-new-promo" class="btn-primary-brand px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 hover:brightness-105">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Buat Promo Baru</span>
            </button>
          </div>

          <div class="overflow-x-auto border border-slate-100 rounded-2xl">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th class="p-3.5">Nama Program Promo</th>
                  <th class="p-3.5">Model Kartu</th>
                  <th class="p-3.5">Potongan Diskon</th>
                  <th class="p-3.5">Jadwal & Durasi</th>
                  <th class="p-3.5">Target Audiens</th>
                  <th class="p-3.5 text-center">Status</th>
                  <th class="p-3.5 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${promoList.length === 0 ? `
                  <tr>
                    <td colspan="7" class="p-8 text-center text-slate-400">
                      <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                        <i data-lucide="tag" class="w-6 h-6"></i>
                      </div>
                      <p class="font-bold text-slate-700 text-xs">Belum ada program promo toko yang dibuat.</p>
                      <p class="text-[11px] text-slate-400 mt-0.5">Klik tombol <strong>"Buat Promo Baru"</strong> di atas untuk membuat promo pertama toko Anda.</p>
                    </td>
                  </tr>
                ` : promoList.map((p) => {
                  const pMonthly = p.type === 'monthly';
                  const typeLabel = pMonthly ? 'Promo Bulanan Rutin' : 'Promo Khusus / Flash Sale';
                  const modelBadge = p.card_model === 'variant_2' ? 'Varian 2 (UP TO %)' : 'Varian 1 (Gambar + Timer)';
                  const discLabel = p.discount_mode === 'per_product'
                    ? 'Tiap Produk'
                    : (p.discount_type === 'nominal' ? `Rp ${(p.discount_value || 0).toLocaleString('id-ID')}` : `${p.discount_value || 0}% OFF`);
                  const scheduleLabel = pMonthly
                    ? `Tgl ${p.monthly_start_day || 1} - ${p.monthly_end_day || 7} Awal Bulan`
                    : `${(p.start_datetime || '').replace('T', ' ')} s/d ${(p.end_datetime || '').replace('T', ' ')}`;
                  const audienceLabel = p.target_audience === 'new_buyer' ? 'Pelanggan Baru' : (p.target_audience === 'loyal_member' ? 'Member Setia' : 'Semua Pelanggan');
                  const isSelected = activePromoId === p.id;

                  return `
                    <tr class="hover:bg-slate-50/80 transition cursor-pointer promo-row-item ${isSelected ? 'bg-emerald-50/40' : ''}" data-id="${p.id}">
                      <td class="p-3.5">
                        <div class="font-bold text-slate-900 flex items-center gap-2">
                          <span class="w-2.5 h-2.5 rounded-full ${p.active ? 'bg-emerald-500' : 'bg-slate-300'}"></span>
                          <span>${escapeHtml(p.label || typeLabel)}</span>
                        </div>
                        <span class="text-[11px] text-slate-400 block mt-0.5">${typeLabel}</span>
                      </td>
                      <td class="p-3.5">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${p.card_model === 'variant_2' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-rose-50 text-rose-700 border-rose-200'}">
                          ${modelBadge}
                        </span>
                      </td>
                      <td class="p-3.5 font-bold font-mono text-emerald-700">
                        ${discLabel}
                        ${p.min_spend > 0 ? `<span class="block font-normal text-[10px] text-slate-400">Min: Rp ${Math.round(p.min_spend).toLocaleString('id-ID')}</span>` : ''}
                      </td>
                      <td class="p-3.5 text-[11px] text-slate-600">
                        ${scheduleLabel}
                      </td>
                      <td class="p-3.5">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700">
                          ${audienceLabel}
                        </span>
                      </td>
                      <td class="p-3.5 text-center">
                        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${p.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}">
                          ${p.active ? 'AKTIF' : 'NONAKTIF'}
                        </span>
                      </td>
                      <td class="p-3.5 text-center" onclick="event.stopPropagation()">
                        <div class="flex items-center justify-center gap-2">
                          <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" class="sr-only peer toggle-promo-status" data-id="${p.id}" ${p.active ? 'checked' : ''} />
                            <div class="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                          <button type="button" class="btn-delete-promo text-slate-400 hover:text-rose-500 transition" data-id="${p.id}" title="Hapus Promo">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 2. FORM TAMBAH / EDIT PROMO (5 LANGKAH TERPADU) & LIVE PREVIEW CARD -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- KOLOM KIRI: FORM CONFIGURATION 5 LANGKAH (7 COLS) -->
          <div class="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
            
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span class="text-[10px] font-black uppercase tracking-wider text-emerald-600">Alur Pembuatan Promo Toko</span>
                <h3 class="text-base font-bold text-slate-900">
                  ${activePromoId === 'new' ? 'Buat Program Promo Baru (5 Langkah)' : `Edit: ${escapeHtml(current.label || 'Promo Toko')}`}
                </h3>
              </div>
              <div class="flex items-center gap-3">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="promo-active-toggle" ${current.active ? 'checked' : ''} class="sr-only peer" />
                  <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
                <span id="label-promo-active" class="text-xs font-bold ${current.active ? 'text-emerald-700' : 'text-slate-400'}">
                  ${current.active ? 'Program Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>

            <!-- LANGKAH 1: MODEL TAMPILAN KARTU (STANDARISASI ALUR FORM) -->
            <div class="space-y-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">1</span>
                <h4 class="font-bold text-xs sm:text-sm text-slate-900">Langkah 1 - Penentuan Model Tampilan Kartu:</h4>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label class="relative p-3.5 rounded-xl border ${!isVariant2 ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex gap-3 items-start">
                  <input type="radio" name="promo_card_model" value="variant_1" ${!isVariant2 ? 'checked' : ''} class="mt-0.5 text-emerald-600" />
                  <div>
                    <span class="font-bold text-slate-900 text-xs block mb-0.5">Promo Varian 1 (Gambar + Timer)</span>
                    <p class="text-slate-500 text-[11px] leading-relaxed">Gambar di atas + Countdown Timer + Tombol Stacked vertikal di bawah.</p>
                  </div>
                </label>
                <label class="relative p-3.5 rounded-xl border ${isVariant2 ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex gap-3 items-start">
                  <input type="radio" name="promo_card_model" value="variant_2" ${isVariant2 ? 'checked' : ''} class="mt-0.5 text-emerald-600" />
                  <div>
                    <span class="font-bold text-slate-900 text-xs block mb-0.5">Promo Varian 2 (Teks Minimalis)</span>
                    <p class="text-slate-500 text-[11px] leading-relaxed">Minimalis Elegan dengan fokus pada angka persentase UP TO % diskon (Kustomisasi Warna Lengkap).</p>
                  </div>
                </label>
              </div>

              <!-- Upload Gambar Banner Varian 1 -->
              <div id="promo-variant1-uploader-container" class="${!isVariant2 ? 'block' : 'hidden'} space-y-2 pt-2 border-t border-slate-200">
                <label class="block font-bold text-slate-700 text-xs">Gambar Banner Promo Varian 1 (Maksimal 500 KB):</label>
                <p class="text-[11px] text-slate-400 mb-2">Unggah foto promo atau tempel URL link gambar langsung. Jika belum diunggah, otomatis menggunakan ikon placeholder bersih.</p>
                ${renderUnifiedUploaderHtml({
                  id: 'promo-uploader',
                  images: currentPromoImages,
                  isMulti: false,
                  placeholder: 'Tempel link URL gambar promo (https://...)'
                })}
              </div>
            </div>

            <!-- LANGKAH 2: TIPE PROGRAM PROMO & JADWAL -->
            <div class="space-y-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">2</span>
                <h4 class="font-bold text-xs sm:text-sm text-slate-900">Langkah 2 - Tipe Program Promo & Jadwal:</h4>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label class="relative p-3.5 rounded-xl border ${isMonthly ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex gap-3 items-start">
                  <input type="radio" name="promo_type" value="monthly" ${isMonthly ? 'checked' : ''} class="mt-0.5 text-emerald-600" />
                  <div>
                    <span class="font-bold text-slate-900 text-xs block mb-0.5">Promo Bulanan Rutin</span>
                    <p class="text-slate-500 text-[11px] leading-relaxed">Berjalan rutin setiap awal bulan pada rentang tanggal tertentu (misal tgl 1 - 7).</p>
                  </div>
                </label>
                <label class="relative p-3.5 rounded-xl border ${isSpecial ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex gap-3 items-start">
                  <input type="radio" name="promo_type" value="special" ${isSpecial ? 'checked' : ''} class="mt-0.5 text-emerald-600" />
                  <div>
                    <span class="font-bold text-slate-900 text-xs block mb-0.5">Promo Khusus / Flash Sale</span>
                    <p class="text-slate-500 text-[11px] leading-relaxed">Program diskon khusus atau flash sale sewaktu-waktu dengan durasi tanggal & jam bebas.</p>
                  </div>
                </label>
              </div>

              <!-- Input Rentang Tanggal Bulanan -->
              <div id="promo-monthly-dates-box" class="${isMonthly ? 'block' : 'hidden'} pt-2">
                <label class="block font-bold text-slate-700 text-xs mb-1">Rentang Tanggal Awal Bulan (Setiap Bulan):</label>
                <div class="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span class="text-[10px] text-slate-500 block mb-0.5">Tanggal Mulai (1-31):</span>
                    <input type="number" id="promo-monthly-start-day" min="1" max="31" value="${current.monthly_start_day || 1}" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <span class="text-[10px] text-slate-500 block mb-0.5">Tanggal Berakhir (1-31):</span>
                    <input type="number" id="promo-monthly-end-day" min="1" max="31" value="${current.monthly_end_day || 7}" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold outline-none focus:border-emerald-500" />
                  </div>
                </div>
              </div>

              <!-- Input Waktu Khusus / Flash Sale -->
              <div id="promo-special-dates-box" class="${isSpecial ? 'block' : 'hidden'} pt-2">
                <label class="block font-bold text-slate-700 text-xs mb-1">Rentang Tanggal & Waktu Pelaksanaan:</label>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span class="text-[10px] text-slate-500 block mb-0.5">Mulai Tanggal & Jam:</span>
                    <input type="datetime-local" id="promo-start-datetime" value="${current.start_datetime || '2026-10-01T00:00'}" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-500 font-mono" />
                  </div>
                  <div>
                    <span class="text-[10px] text-slate-500 block mb-0.5">Berakhir Tanggal & Jam:</span>
                    <input type="datetime-local" id="promo-end-datetime" value="${current.end_datetime || '2026-10-31T23:59'}" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-500 font-mono" />
                  </div>
                </div>
              </div>
            </div>

            <!-- LANGKAH 3: POTONGAN HARGA & NILAI DISKON -->
            <div class="space-y-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">3</span>
                <h4 class="font-bold text-xs sm:text-sm text-slate-900">Langkah 3 - Potongan Harga & Nilai Diskon:</h4>
              </div>
              <div class="space-y-3 pt-1">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label class="p-3 rounded-xl border ${isPerProduct ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex items-start gap-2.5">
                    <input type="radio" name="promo_discount_mode" value="per_product" ${isPerProduct ? 'checked' : ''} class="mt-0.5 text-emerald-600" />
                    <div>
                      <span class="font-bold text-slate-900 text-xs block">Berdasarkan Diskon Pada Masing-Masing Produk</span>
                      <p class="text-slate-400 text-[10px] mt-0.5">Memakai persentase diskon yang telah diatur pada formulir tiap produk.</p>
                    </div>
                  </label>
                  <label class="p-3 rounded-xl border ${!isPerProduct ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex items-start gap-2.5">
                    <input type="radio" name="promo_discount_mode" value="all_products" ${!isPerProduct ? 'checked' : ''} class="mt-0.5 text-emerald-600" />
                    <div>
                      <span class="font-bold text-slate-900 text-xs block">Diskon Khusus Semua Produk</span>
                      <p class="text-slate-400 text-[10px] mt-0.5">Terapkan satu nilai diskon seragam untuk seluruh produk promo.</p>
                    </div>
                  </label>
                </div>

                <!-- Input Nilai & Satuan Diskon Khusus -->
                <div id="promo-all-products-disc-box" class="${!isPerProduct ? 'block' : 'hidden'} grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label class="block font-bold text-slate-700 text-xs mb-1">Satuan & Nilai Diskon:</label>
                    <div class="flex items-center gap-2">
                      <select id="promo-discount-type" class="px-2.5 py-2.5 rounded-xl border border-slate-300 font-bold outline-none bg-white text-xs">
                        <option value="percent" ${current.discount_type === 'percent' ? 'selected' : ''}>[%] Persen</option>
                        <option value="nominal" ${current.discount_type === 'nominal' ? 'selected' : ''}>[IDR] Nominal</option>
                      </select>
                      <input type="number" id="promo-discount-value" min="1" value="${current.discount_value || 15}" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 font-black text-emerald-700 text-xs" />
                    </div>
                  </div>
                  <div>
                    <label class="block font-bold text-slate-700 text-xs mb-1">Minimal Nilai Transaksi / Order (IDR):</label>
                    <input type="number" id="promo-min-spend" min="0" value="${current.min_spend || 0}" placeholder="Contoh: 50000 (0 jika tanpa min)" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 font-semibold text-xs" />
                  </div>
                </div>
              </div>
            </div>

            <!-- LANGKAH 4: TARGET AUDIENS -->
            <div class="space-y-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">4</span>
                <h4 class="font-bold text-xs sm:text-sm text-slate-900">Langkah 4 - Target Audiens:</h4>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <label class="p-3 rounded-xl border ${(current.target_audience || 'all') === 'all' ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex items-center gap-2">
                  <input type="radio" name="promo_target_audience" value="all" ${(current.target_audience || 'all') === 'all' ? 'checked' : ''} class="text-emerald-600" />
                  <div>
                    <span class="font-bold text-slate-900 text-xs block">Semua Pelanggan</span>
                    <span class="text-[10px] text-slate-400">Pengunjung umum</span>
                  </div>
                </label>
                <label class="p-3 rounded-xl border ${current.target_audience === 'new_buyer' ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex items-center gap-2">
                  <input type="radio" name="promo_target_audience" value="new_buyer" ${current.target_audience === 'new_buyer' ? 'checked' : ''} class="text-emerald-600" />
                  <div>
                    <span class="font-bold text-slate-900 text-xs block">Pelanggan Baru</span>
                    <span class="text-[10px] text-slate-400">Order pertama kali</span>
                  </div>
                </label>
                <label class="p-3 rounded-xl border ${current.target_audience === 'loyal_member' ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex items-center gap-2">
                  <input type="radio" name="promo_target_audience" value="loyal_member" ${current.target_audience === 'loyal_member' ? 'checked' : ''} class="text-emerald-600" />
                  <div>
                    <span class="font-bold text-slate-900 text-xs block">Member Setia</span>
                    <span class="text-[10px] text-slate-400">Pelanggan terdaftar</span>
                  </div>
                </label>
              </div>
            </div>

            <!-- LANGKAH 5: STYLING VISUAL, GRADASI & DUAL CTA -->
            <div class="space-y-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">5</span>
                <h4 class="font-bold text-xs sm:text-sm text-slate-900">Langkah 5 - Styling Visual, Gradasi & Dual CTA:</h4>
              </div>

              <!-- Teks Judul (2 Baris Sesuai Wireframe) & Deskripsi -->
              <div class="space-y-3 pt-1 text-xs">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Judul Baris 1 (Utama):</label>
                    <input type="text" id="promo-title-line1-input" value="${escapeHtml(current.title_line1 || (current.label ? current.label.split(/\s+/)[0] : 'PROMO'))}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 font-bold uppercase" placeholder="Contoh: PROMO" />
                  </div>
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Sub-Judul Baris 2:</label>
                    <input type="text" id="promo-title-line2-input" value="${escapeHtml(current.title_line2 || (current.label ? current.label.split(/\s+/).slice(1).join(' ') : 'BULAN OKTOBER'))}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 font-semibold uppercase" placeholder="Contoh: BULAN OKTOBER" />
                  </div>
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Label Lengkap Promo (Etalase):</label>
                  <input type="text" id="promo-label-input" value="${escapeHtml(current.label || 'Promo Spesial')}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 font-semibold" placeholder="Contoh: Promo Percetakan Awal Bulan" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Deskripsi Singkat Promo:</label>
                  <textarea id="promo-desc-input" rows="2" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 resize-none font-medium text-xs" placeholder="Contoh: Potongan harga berlaku untuk pesanan cetak dan desain pilihan di etalase.">${escapeHtml(current.description || '')}</textarea>
                </div>
              </div>

              <!-- Kontrol Warna Teks & Latar Belakang Gradasi -->
              <div class="pt-2 border-t border-slate-200 space-y-3 text-xs">
                <span class="font-bold text-slate-800 block">Warna Teks & Latar Belakang Kartu:</span>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600 mb-1">Warna Judul Headline:</label>
                    <div class="flex items-center gap-2">
                      <input type="color" id="promo-title-color" value="${current.title_color || '#0f172a'}" class="w-9 h-9 p-0.5 rounded-xl border border-slate-300 cursor-pointer bg-white" />
                      <input type="text" id="promo-title-color-text" value="${current.title_color || '#0f172a'}" class="w-24 px-2 py-1.5 rounded-xl border border-slate-300 font-mono text-xs uppercase" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600 mb-1">Warna Diskon / Aksen:</label>
                    <div class="flex items-center gap-2">
                      <input type="color" id="promo-discount-color" value="${current.discount_color || '#e11d48'}" class="w-9 h-9 p-0.5 rounded-xl border border-slate-300 cursor-pointer bg-white" />
                      <input type="text" id="promo-discount-color-text" value="${current.discount_color || '#e11d48'}" class="w-24 px-2 py-1.5 rounded-xl border border-slate-300 font-mono text-xs uppercase" />
                    </div>
                  </div>
                </div>

                <!-- Tipe Latar & Gradasi -->
                <div class="space-y-3 pt-2">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-[11px] font-semibold text-slate-600 mb-1">Tipe Latar Kartu:</label>
                      <select id="promo-bg-type" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white text-xs">
                        <option value="solid" ${(current.bg_type || 'solid') === 'solid' ? 'selected' : ''}>Warna Solid</option>
                        <option value="linear_gradient" ${current.bg_type === 'linear_gradient' ? 'selected' : ''}>Linier Gradient</option>
                        <option value="radial_gradient" ${current.bg_type === 'radial_gradient' ? 'selected' : ''}>Radial Gradient</option>
                      </select>
                    </div>
                    <div id="promo-bg-angle-box" class="${current.bg_type === 'linear_gradient' ? 'block' : 'hidden'}">
                      <label class="block text-[11px] font-semibold text-slate-600 mb-1">Sudut Gradasi (0° - 360°):</label>
                      <div class="flex items-center gap-2">
                        <input type="range" id="promo-bg-angle" min="0" max="360" value="${current.bg_angle !== undefined ? current.bg_angle : 135}" class="flex-1 accent-emerald-600" />
                        <span id="promo-bg-angle-val" class="font-mono text-xs font-bold text-slate-700 w-10 text-right">${current.bg_angle !== undefined ? current.bg_angle : 135}°</span>
                      </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-[10px] text-slate-500 mb-1">Warna Latar 1 (Utama):</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="promo-bg-color1" value="${current.bg_color1 || '#ffffff'}" class="w-9 h-9 p-0.5 rounded-xl border border-slate-300 cursor-pointer bg-white" />
                        <input type="text" id="promo-bg-color1-text" value="${current.bg_color1 || '#ffffff'}" class="w-24 px-2 py-1.5 rounded-xl border border-slate-300 font-mono text-xs uppercase" />
                      </div>
                    </div>
                    <div id="promo-bg-color2-box" class="${(current.bg_type || 'solid') !== 'solid' ? 'block' : 'hidden'}">
                      <label class="block text-[10px] text-slate-500 mb-1">Warna Latar 2 (Gradasi):</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="promo-bg-color2" value="${current.bg_color2 || '#f8fafc'}" class="w-9 h-9 p-0.5 rounded-xl border border-slate-300 cursor-pointer bg-white" />
                        <input type="text" id="promo-bg-color2-text" value="${current.bg_color2 || '#f8fafc'}" class="w-24 px-2 py-1.5 rounded-xl border border-slate-300 font-mono text-xs uppercase" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Switch Countdown Timer -->
                <div class="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <span class="font-bold text-slate-800 text-xs block">Tampilkan Countdown Timer di Kartu Promo:</span>
                    <span class="text-[10px] text-slate-400">Aktifkan jam hitung mundur waktu tersisa / segera hadir di etalase.</span>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="promo-show-timer" ${current.show_timer !== false ? 'checked' : ''} class="sr-only peer" />
                    <div class="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <!-- Konfigurasi Dual CTA -->
                <div class="pt-3 border-t border-slate-200 space-y-3">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="font-bold text-slate-800 text-xs block">Opsi Tombol Aksi (Dual CTA):</span>
                      <span class="text-[10px] text-slate-400">Tombol Katalog & Konsultasi WhatsApp di bawah kartu promo.</span>
                    </div>
                    <label class="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input type="checkbox" id="promo-cta-theme-default" ${current.use_theme_default ? 'checked' : ''} class="rounded text-emerald-600 focus:ring-emerald-500" />
                      <span class="font-bold text-slate-700 text-[11px]">Gunakan Warna Tema Default</span>
                    </label>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <label class="p-2.5 rounded-xl border ${(current.cta_mode || 'dual') === 'dual' ? 'border-emerald-500 bg-white ring-1 ring-emerald-500/20' : 'border-slate-200 bg-white'} cursor-pointer flex items-center gap-2">
                      <input type="radio" name="promo_cta_mode" value="dual" ${(current.cta_mode || 'dual') === 'dual' ? 'checked' : ''} class="text-emerald-600" />
                      <span class="font-bold text-[11px]">Kedua Tombol (Dual)</span>
                    </label>
                    <label class="p-2.5 rounded-xl border ${current.cta_mode === 'catalog_only' ? 'border-emerald-500 bg-white ring-1 ring-emerald-500/20' : 'border-slate-200 bg-white'} cursor-pointer flex items-center gap-2">
                      <input type="radio" name="promo_cta_mode" value="catalog_only" ${current.cta_mode === 'catalog_only' ? 'checked' : ''} class="text-emerald-600" />
                      <span class="font-bold text-[11px]">Hanya Tombol Katalog</span>
                    </label>
                    <label class="p-2.5 rounded-xl border ${current.cta_mode === 'consultation_only' ? 'border-emerald-500 bg-white ring-1 ring-emerald-500/20' : 'border-slate-200 bg-white'} cursor-pointer flex items-center gap-2">
                      <input type="radio" name="promo_cta_mode" value="consultation_only" ${current.cta_mode === 'consultation_only' ? 'checked' : ''} class="text-emerald-600" />
                      <span class="font-bold text-[11px]">Hanya Tombol WA</span>
                    </label>
                  </div>

                  <!-- Kontrol Mandiri CTA jika Switch Tema Mati -->
                  <div id="promo-custom-cta-box" class="${current.use_theme_default ? 'hidden' : 'block'} space-y-3 pt-2">
                    <div class="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                      <span class="font-bold text-slate-800 text-[11px] block">Tombol 1: Katalog</span>
                      <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div class="sm:col-span-2">
                          <input type="text" id="promo-cta1-text" value="${escapeHtml(current.cta1_text || 'Lihat Semua Katalog')}" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs" placeholder="Teks Tombol 1" />
                        </div>
                        <div>
                          <input type="color" id="promo-cta1-bg" value="${current.cta1_bg || '#33b589'}" class="w-full h-8 p-0.5 rounded-lg border border-slate-300 cursor-pointer" title="Warna Latar Tombol 1" />
                        </div>
                        <div>
                          <input type="color" id="promo-cta1-text-color" value="${current.cta1_text_color || '#ffffff'}" class="w-full h-8 p-0.5 rounded-lg border border-slate-300 cursor-pointer" title="Warna Teks Tombol 1" />
                        </div>
                      </div>
                    </div>
                    <div class="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                      <span class="font-bold text-slate-800 text-[11px] block">Tombol 2: Konsultasi WhatsApp</span>
                      <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div class="sm:col-span-2">
                          <input type="text" id="promo-cta2-text" value="${escapeHtml(current.cta2_text || 'Konsultasi Desain & Cetak')}" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs" placeholder="Teks Tombol 2" />
                        </div>
                        <div>
                          <input type="color" id="promo-cta2-bg" value="${current.cta2_bg || '#25d366'}" class="w-full h-8 p-0.5 rounded-lg border border-slate-300 cursor-pointer" title="Warna Latar Tombol 2" />
                        </div>
                        <div>
                          <input type="color" id="promo-cta2-text-color" value="${current.cta2_text_color || '#ffffff'}" class="w-full h-8 p-0.5 rounded-lg border border-slate-300 cursor-pointer" title="Warna Teks Tombol 2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <!-- Tombol Simpan Program Promo -->
            <div class="pt-4 border-t border-slate-100 flex justify-end">
              <button type="button" id="btn-save-single-promo" class="btn-primary-brand px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition hover:brightness-105 cursor-pointer">
                <i data-lucide="check" class="w-4 h-4"></i>
                <span>Simpan Program Promo Ini</span>
              </button>
            </div>

          </div>

          <!-- KOLOM KANAN: LIVE PREVIEW PROMO CARD IDENTIK DENGAN ETALASE (5 COLS) -->
          <div class="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <span class="text-xs font-bold text-slate-800 flex items-center gap-2">
                <i data-lucide="eye" class="w-4 h-4 text-emerald-600"></i>
                Pratinjau Kartu Promo di Web Etalase:
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                Live Preview
              </span>
            </div>

            <!-- Box Container Live Preview -->
            <div id="promo-card-live-preview-box" class="max-w-[320px] mx-auto w-full">
              <!-- Rendered dynamically via updatePromoCardLivePreview() -->
            </div>

            <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
              <span class="font-bold text-slate-700 block mb-0.5">Penempatan Otomatis di Web Toko:</span>
              Kartu ini muncul pada slot interval etalase toko (ritme 8 produk desktop / 4 mobile) dengan countdown timer aktif dan Dual CTA interaktif.
            </div>
          </div>

        </div>

      </div>
    `;
  }

  function updatePromoCardLivePreview() {
    const box = document.getElementById('promo-card-live-preview-box');
    if (!box) return;

    const labelInput = document.getElementById('promo-label-input');
    const label = labelInput?.value.trim() || 'Promo Toko Pilihan';

    const descInput = document.getElementById('promo-desc-input');
    const desc = descInput?.value.trim() || 'Potongan harga spesial untuk pesanan cetak dan desain pilihan di seluruh etalase.';

    const discModeRadio = document.querySelector('input[name="promo_discount_mode"]:checked');
    const isPerProduct = discModeRadio?.value === 'per_product';

    const discTypeEl = document.getElementById('promo-discount-type');
    const discValEl = document.getElementById('promo-discount-value');
    const discType = discTypeEl?.value || 'percent';
    const discVal = discValEl?.value ? parseFloat(discValEl.value) : 15;
    const discText = isPerProduct
      ? 'TIAP PRODUK'
      : (discType === 'nominal' ? `POTONGAN Rp ${Math.round(discVal).toLocaleString('id-ID')}` : `HEMAT ${discVal}%`);

    const promoImg = (currentPromoImages && currentPromoImages.length > 0 && currentPromoImages[0])
      ? currentPromoImages[0]
      : '';

    const modelRadio = document.querySelector('input[name="promo_card_model"]:checked');
    const model = modelRadio ? modelRadio.value : 'variant_1';

    const titleColor = document.getElementById('promo-title-color')?.value || '#0f172a';
    const discColor = document.getElementById('promo-discount-color')?.value || '#e11d48';

    const bgType = document.getElementById('promo-bg-type')?.value || 'solid';
    const bgColor1 = document.getElementById('promo-bg-color1')?.value || '#ffffff';
    const bgColor2 = document.getElementById('promo-bg-color2')?.value || '#f8fafc';
    const bgAngle = parseInt(document.getElementById('promo-bg-angle')?.value) || 135;

    let bgCss = `background-color: ${bgColor1};`;
    if (bgType === 'linear_gradient') {
      bgCss = `background: linear-gradient(${bgAngle}deg, ${bgColor1} 0%, ${bgColor2} 100%);`;
    } else if (bgType === 'radial_gradient') {
      bgCss = `background: radial-gradient(circle at center, ${bgColor1} 0%, ${bgColor2} 100%);`;
    }

    const showTimer = document.getElementById('promo-show-timer')?.checked ?? true;

    // Dual CTA settings
    const ctaModeRadio = document.querySelector('input[name="promo_cta_mode"]:checked');
    const ctaMode = ctaModeRadio ? ctaModeRadio.value : 'dual';
    const useThemeDefault = document.getElementById('promo-cta-theme-default')?.checked ?? true;

    const settings = (typeof DB !== 'undefined' && DB.getSettings) ? DB.getSettings() : {};

    let cta1Bg = useThemeDefault ? (settings.hero_cta1_bg || settings.primary_color || '#33b589') : (document.getElementById('promo-cta1-bg')?.value || '#33b589');
    let cta1TextColor = useThemeDefault ? (settings.hero_cta1_text_color || '#ffffff') : (document.getElementById('promo-cta1-text-color')?.value || '#ffffff');
    let cta1Text = document.getElementById('promo-cta1-text')?.value.trim() || 'Ingatkan Saya';

    let cta2Bg = useThemeDefault ? (settings.hero_cta2_bg || '#25d366') : (document.getElementById('promo-cta2-bg')?.value || '#25d366');
    let cta2TextColor = useThemeDefault ? (settings.hero_cta2_text_color || '#ffffff') : (document.getElementById('promo-cta2-text-color')?.value || '#ffffff');
    let cta2Text = document.getElementById('promo-cta2-text')?.value.trim() || 'Tanya Admin';

    const cta1Btn = `
      <div class="w-full py-1.5 sm:py-2 px-2.5 rounded-xl text-[10px] sm:text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-xs border border-black/5" style="background-color: ${cta1Bg}; color: ${cta1TextColor};">
        <i class="bi bi-bell-fill text-xs shrink-0"></i>
        <span>${escapeHtml(cta1Text)}</span>
      </div>
    `;

    const cta2Btn = `
      <div class="w-full py-1.5 sm:py-2 px-2.5 rounded-xl text-[10px] sm:text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-sm border border-black/5" style="background-color: ${cta2Bg}; color: ${cta2TextColor};">
        <i class="bi bi-whatsapp text-xs shrink-0"></i>
        <span>${escapeHtml(cta2Text)}</span>
      </div>
    `;

    let ctaContainerHtml = '';
    if (ctaMode === 'catalog_only') {
      ctaContainerHtml = `<div class="mt-auto pt-2 flex flex-col gap-1.5">${cta1Btn}</div>`;
    } else if (ctaMode === 'consultation_only') {
      ctaContainerHtml = `<div class="mt-auto pt-2 flex flex-col gap-1.5">${cta2Btn}</div>`;
    } else {
      ctaContainerHtml = `<div class="mt-auto pt-2 flex flex-col gap-1.5">${cta1Btn}${cta2Btn}</div>`;
    }

    if (model === 'variant_1') {
      const imgContent = promoImg ? `
        <img src="${promoImg}" class="w-full h-full object-cover transition duration-500 group-hover:scale-105" alt="${escapeHtml(label)}" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2\\'><i class=\\'bi bi-images text-2xl\\'></i></div>';" />
      ` : `
        <div class="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2"><i class="bi bi-images text-2xl"></i></div>
      `;

      box.innerHTML = `
        <div class="h-full flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 shadow-xs hover:shadow-xl transition-all duration-300 group relative bg-white" style="${bgCss}">
          <!-- Area Atas: GAMBAR PROMO Rasio 3:4 Bleed to Edge (Menempel Penuh ke Tepi) -->
          <div class="relative w-full aspect-[3/4] overflow-hidden bg-slate-100 shrink-0 block">
            ${imgContent}
            
            <!-- Badge Diskon Melayang di Sudut Atas Kiri -->
            <span class="absolute top-2.5 left-2.5 text-white text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md uppercase tracking-wider z-10" style="background-color: ${discColor};">
              ${discText}
            </span>

            <!-- Badge Timer Melayang di Sudut Bawah Gambar (Jika Varian CD) -->
            ${showTimer ? `
              <div class="absolute bottom-2.5 left-2.5 right-2.5 inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/75 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold shadow-md z-10">
                <i data-lucide="clock" class="w-3.5 h-3.5 text-emerald-400 shrink-0"></i>
                <span class="text-slate-300 font-medium hidden sm:inline">Berakhir Dalam:</span>
                <span class="font-mono text-emerald-300">23j : 59m : 59d</span>
              </div>
            ` : ''}
          </div>

          <!-- Area Bawah: HANYA Tombol CTA Tanpa Judul Teks Sesuai Wireframe -->
          <div class="p-3 sm:p-3.5 flex-1 flex flex-col justify-end">
            ${ctaContainerHtml}
          </div>
        </div>
      `;
    } else {
      const line1 = document.getElementById('promo-title-line1-input')?.value.trim() || 'PROMO';
      const line2 = document.getElementById('promo-title-line2-input')?.value.trim() || 'BULAN OKTOBER';
      const hasDiscount = Boolean(discVal && discVal > 0);
      const discountHtml = hasDiscount ? `
        <div class="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-md" style="color: ${discColor};">
          UPTO ${discVal}%
        </div>
      ` : '';

      let bodyContent = '';
      if (showTimer) {
        // Varian CD: Judul (2 Baris), Diskon (Opsional), Deskripsi, Kotak Countdown
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
            <p class="text-[10px] sm:text-[11px] text-slate-300 line-clamp-2 mt-1 leading-relaxed">
              ${escapeHtml(desc)}
            </p>
          </div>

          <div class="p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-between text-[10px] font-mono text-emerald-300">
            <div class="flex items-center gap-1.5">
              <i data-lucide="clock" class="w-3.5 h-3.5 text-emerald-400"></i>
              <span class="text-slate-300 text-[10px] font-sans">Berakhir Dalam:</span>
            </div>
            <span class="font-mono font-bold text-emerald-300">23j : 59m : 59d</span>
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
              ${escapeHtml(desc)}
            </p>
          </div>
        `;
      }

      box.innerHTML = `
        <div class="h-full flex flex-col justify-between p-3.5 sm:p-4 overflow-hidden shadow-lg relative text-white group transition hover:shadow-2xl rounded-2xl border border-slate-700/60" style="${bgCss}">
          <div class="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none"></div>
          <div class="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-amber-500/10 blur-xl pointer-events-none"></div>

          <div class="relative z-10 flex-1 flex flex-col justify-between">
            ${bodyContent}
          </div>

          <div class="relative z-10 mt-auto pt-2.5 flex flex-col gap-1.5 border-t border-slate-700/60">
            ${ctaContainerHtml}
          </div>
        </div>
      `;
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // ============================================================================
  // SUBMENU 2: KUPON & VOUCHER (INLINE FORM + TABLE AKTIF & ACTION DELETE/TOGGLE)
  // ============================================================================
  function renderVouchersTab(vouchers, categories, products) {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    return `
      <div class="space-y-6">
        
        <!-- 1. FORM PEMBUATAN KUPON BARU (INLINE CARD FORM) -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 class="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <i data-lucide="ticket-plus" class="w-5 h-5 text-emerald-600"></i>
                <span>Buat Kode Kupon & Voucher Baru</span>
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">Kode voucher dapat dimasukkan pelanggan saat checkout pesanan di keranjang belanja.</p>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 w-fit">
              Potongan Langsung Checkout
            </span>
          </div>

          <form id="form-create-voucher" class="space-y-4" onsubmit="event.preventDefault();">
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              
              <!-- Kode Voucher -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">Kode Voucher <span class="text-red-500">*</span>:</label>
                <input type="text" id="voucher-code-input" placeholder="Misal: MEGAHEMAT20" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold uppercase outline-none focus:border-emerald-500" required />
                <span class="text-[10px] text-slate-400 block mt-1">Huruf kapital & angka tanpa spasi.</span>
              </div>

              <!-- Nama Voucher -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">Nama / Keterangan Voucher:</label>
                <input type="text" id="voucher-name-input" placeholder="Voucher Diskon Pelanggan Setia" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold outline-none focus:border-emerald-500" />
              </div>

              <!-- Tipe Diskon -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">Tipe Diskon:</label>
                <select id="voucher-type-select" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold outline-none focus:border-emerald-500 bg-white">
                  <option value="percent">Persentase (%)</option>
                  <option value="nominal">Nominal Rupiah (IDR)</option>
                </select>
              </div>

              <!-- Nilai Diskon -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">Nilai Diskon <span class="text-red-500">*</span>:</label>
                <input type="number" id="voucher-val-input" min="1" placeholder="Misal: 15 atau 25000" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-black text-emerald-700 outline-none focus:border-emerald-500" required />
              </div>

            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              
              <!-- Batas Kuota -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">Batas Kuota Pemakaian:</label>
                <input type="number" id="voucher-quota-input" min="0" value="100" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold outline-none focus:border-emerald-500" />
                <span class="text-[10px] text-slate-400 block mt-1">Isi 0 untuk tanpa batas kuota.</span>
              </div>

              <!-- Min Belanja -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">Minimum Belanja (IDR):</label>
                <input type="number" id="voucher-min-spend-input" min="0" value="50000" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold outline-none focus:border-emerald-500" />
              </div>

              <!-- Tanggal Mulai -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">Tanggal Mulai:</label>
                <input type="date" id="voucher-start-date" value="${today}" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 font-mono" />
              </div>

              <!-- Tanggal Kedaluwarsa -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">Tanggal Kedaluwarsa:</label>
                <input type="date" id="voucher-end-date" value="${nextMonth}" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 font-mono" />
              </div>

            </div>

            <div class="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button type="button" id="btn-submit-new-voucher" class="btn-primary-brand px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition hover:brightness-105">
                <i data-lucide="plus-circle" class="w-4 h-4"></i>
                <span>Terbitkan Voucher Baru</span>
              </button>
            </div>
          </form>
        </div>

        <!-- 2. TABEL DAFTAR KUPON VOUCHER AKTIF -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <i data-lucide="ticket" class="w-5 h-5 text-emerald-600"></i>
                <span>Daftar Kupon & Voucher Toko (${vouchers.length})</span>
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">Kelola kupon yang tersedia, kuota klaim pembeli, dan status keaktifan.</p>
            </div>
          </div>

          ${vouchers.length === 0 ? `
            <div class="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <i data-lucide="ticket" class="w-8 h-8 mx-auto opacity-40"></i>
              <p class="text-xs font-bold text-slate-600">Belum ada kupon voucher dibuat.</p>
              <p class="text-[11px] text-slate-400">Gunakan form di atas untuk membuat kode voucher diskon pertama Anda.</p>
            </div>
          ` : `
            <div class="overflow-x-auto border border-slate-100 rounded-2xl">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th class="p-3.5">Kode & Nama Kupon</th>
                    <th class="p-3.5">Potongan Diskon</th>
                    <th class="p-3.5">Min. Belanja</th>
                    <th class="p-3.5">Kuota / Terpakai</th>
                    <th class="p-3.5">Masa Berlaku</th>
                    <th class="p-3.5 text-center">Status</th>
                    <th class="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${vouchers.map(v => {
                    const isPercent = v.discount_type === 'percent';
                    const discLabel = isPercent ? `${v.discount_value}% OFF` : `Rp ${Math.round(v.discount_value).toLocaleString('id-ID')}`;
                    return `
                      <tr class="hover:bg-slate-50/80 transition ${v.is_active ? '' : 'opacity-60 bg-slate-50/40'}">
                        <td class="p-3.5">
                          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-mono font-extrabold text-xs tracking-wider border border-emerald-200">
                            <i data-lucide="ticket" class="w-3.5 h-3.5 text-emerald-600"></i>
                            <span>${escapeHtml(v.code)}</span>
                          </div>
                          <span class="font-bold text-slate-800 block mt-1.5">${escapeHtml(v.name || 'Voucher Belanja')}</span>
                        </td>
                        <td class="p-3.5 font-black text-emerald-700 text-sm">
                          ${discLabel}
                        </td>
                        <td class="p-3.5 font-semibold text-slate-700">
                          Rp ${Math.round(v.min_spend || 0).toLocaleString('id-ID')}
                        </td>
                        <td class="p-3.5 font-semibold text-slate-700">
                          ${v.used_count || 0} / ${v.quota > 0 ? v.quota : 'âˆž'}
                        </td>
                        <td class="p-3.5 text-[11px] font-mono text-slate-500">
                          <div>${v.start_date || today}</div>
                          <div class="text-slate-400">s/d ${v.end_date || nextMonth}</div>
                        </td>
                        <td class="p-3.5 text-center">
                          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${v.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}">
                            ${v.is_active ? 'AKTIF' : 'NONAKTIF'}
                          </span>
                        </td>
                        <td class="p-3.5 text-center">
                          <div class="flex items-center justify-center gap-1.5">
                            <button type="button" class="btn-toggle-voucher px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${v.is_active ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'}" data-id="${v.id}" data-active="${v.is_active}">
                              ${v.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                            <button type="button" class="btn-delete-voucher p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" data-id="${v.id}" title="Hapus Voucher">
                              <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

      </div>
    `;
  }

  // ============================================================================
  // SUBMENU 3: IKLAN SPONSOR (3 MODEL: STATIS, CAROUSEL MAKS 5 & INTERNAL 2X2)
  // ============================================================================
  function renderSponsorsTab(promos) {
    const sponsorType = (typeof activeSponsorType !== 'undefined' && activeSponsorType) ? activeSponsorType : 'ad1';
    const ads = promos.sponsor_ads || [];
    const ad1 = ads[0] || {};
    const carousel = promos.sponsor_carousel || { is_active: false, active: false, slides: [] };
    const internal = promos.sponsor_internal || { active: true, title: promos.internal_promo_title || 'Sedang Promo', product_ids: [] };
    const carouselSlideCount = Array.isArray(carousel.slides) ? carousel.slides.length : 0;
    const internalProdCount = Array.isArray(internal.product_ids) ? internal.product_ids.length : 0;

    return `
      <div class="space-y-6">
        
        <!-- 1. TABEL DAFTAR SPONSOR (3 MODEL LENGKAP) -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <i data-lucide="image" class="w-5 h-5 text-emerald-600"></i>
                <span>Daftar Slot Iklan Sponsor (3 Model Pilihan)</span>
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">Kelola banner sponsor statis, slider carousel foto, dan mini katalog produk internal toko 2x2.</p>
            </div>
          </div>

          <div class="overflow-x-auto border border-slate-100 rounded-2xl">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th class="p-3.5 w-16">Preview</th>
                  <th class="p-3.5">Judul / Label Sponsor</th>
                  <th class="p-3.5">Model Kartu</th>
                  <th class="p-3.5 text-center">Status Aktif</th>
                  <th class="p-3.5 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                           <!-- ROW: AD1 (SPONSOR STATIS) -->
                <tr class="sponsor-row-item hover:bg-slate-50/80 transition cursor-pointer ${sponsorType === 'ad1' ? 'bg-emerald-50/40' : ''}" data-type="ad1">
                  <td class="p-3.5">
                    <img src="${escapeHtml(ad1.image_url || 'assets/images/logo-songer-creative.png')}" class="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-slate-100" onerror="this.onerror=null; this.outerHTML='<div class=\'w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 text-slate-400 text-sm border border-slate-200\'><i class=\'bi bi-images\'></i></div>';" />
                  </td>
                  <td class="p-3.5">
                    <span class="font-bold text-slate-800 block">${escapeHtml(ad1.title || 'Sponsor Statis')}</span>
                    <span class="inline-block text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-semibold mt-0.5">Saran Skala: 4:3 / 3:2 Landscape (atau 1:1) + 2 CTA</span>
                  </td>
                  <td class="p-3.5 text-slate-600">
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-slate-50 text-slate-700 border-slate-200">Sponsor Statis (1 Gambar)</span>
                  </td>
                  <td class="p-3.5 text-center">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${ad1.active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}">
                      ${ad1.active !== false ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </td>
                  <td class="p-3.5 text-center" onclick="event.stopPropagation()">
                    <div class="flex items-center justify-center gap-2">
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer toggle-sponsor-status" data-type="ad1" ${ad1.active !== false ? 'checked' : ''} />
                        <div class="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                      <button type="button" class="btn-reset-sponsor text-slate-400 hover:text-rose-500 transition" data-type="ad1" title="Reset Sponsor">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- ROW: CAROUSEL -->
                <tr class="sponsor-row-item hover:bg-slate-50/80 transition cursor-pointer ${sponsorType === 'carousel' ? 'bg-emerald-50/40' : ''}" data-type="carousel">
                  <td class="p-3.5">
                    <div class="w-10 h-10 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center text-blue-600">
                      <i data-lucide="images" class="w-5 h-5"></i>
                    </div>
                  </td>
                  <td class="p-3.5">
                    <span class="font-bold text-slate-800 block">Sponsor Slider Carousel (${carouselSlideCount} / 5 Gambar)</span>
                    <span class="inline-block text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-semibold mt-0.5">Saran Skala: 3:4 Portrait (Full Card) Tanpa CTA</span>
                  </td>
                  <td class="p-3.5 text-slate-600">
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-200">Slider Carousel (Otomatis)</span>
                  </td>
                  <td class="p-3.5 text-center">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${(carousel.is_active || carousel.active) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}">
                      ${(carousel.is_active || carousel.active) ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </td>
                  <td class="p-3.5 text-center" onclick="event.stopPropagation()">
                    <div class="flex items-center justify-center gap-2">
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer toggle-sponsor-status" data-type="carousel" ${(carousel.is_active || carousel.active) ? 'checked' : ''} />
                        <div class="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                      <button type="button" class="btn-reset-sponsor text-slate-400 hover:text-rose-500 transition" data-type="carousel" title="Reset Carousel">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- ROW: INTERNAL TOKO (GRID 2x2) -->
                <tr class="sponsor-row-item hover:bg-slate-50/80 transition cursor-pointer ${sponsorType === 'internal' ? 'bg-emerald-50/40' : ''}" data-type="internal">
                  <td class="p-3.5">
                    <div class="w-10 h-10 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center text-emerald-600">
                      <i data-lucide="layout-grid" class="w-5 h-5"></i>
                    </div>
                  </td>
                  <td class="p-3.5">
                    <div class="flex items-center gap-2" onclick="event.stopPropagation()">
                      <input type="text" id="sponsor-internal-title-table-input" value="${escapeHtml(internal.title || 'FLASH SALE 11.11')}" class="px-2.5 py-1 text-xs font-bold border border-slate-300 rounded-lg focus:border-emerald-500 outline-none bg-white w-40 sm:w-48 shadow-2xs" placeholder="Judul Promo (misal: FLASH SALE 11.11)" title="Input Judul Promo Internal Langsung di Tabel" />
                      <span class="text-[10px] text-slate-500 shrink-0">(${internalProdCount} Produk)</span>
                    </div>
                    <span class="inline-block text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold mt-1">Produk Sendiri Grid 2x2 (Dots Dinamis 1-5)</span>
                  </td>
                  <td class="p-3.5 text-slate-600">
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">Sponsor Produk Sendiri (Grid 2x2)</span>
                  </td>
                  <td class="p-3.5 text-center">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${internal.active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}">
                      ${internal.active !== false ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </td>
                  <td class="p-3.5 text-center" onclick="event.stopPropagation()">
                    <div class="flex items-center justify-center gap-2">
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer toggle-sponsor-status" data-type="internal" ${internal.active !== false ? 'checked' : ''} />
                        <div class="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                      <button type="button" class="btn-reset-sponsor text-slate-400 hover:text-rose-500 transition" data-type="internal" title="Reset Sponsor Internal">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                      </button>
                    </div>
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>

        <!-- 2. FORM TAMBAH / EDIT SPONSOR & LIVE PREVIEW -->
        ${renderSponsorForm(promos)}

      </div>
    `;
  }

  function renderSponsorForm(promos) {
    const ads = promos.sponsor_ads || [];
    const ad1 = ads[0] || {};
    const carousel = promos.sponsor_carousel || { is_active: false, active: false, slides: [], auto_slide_interval: 3500 };
    const internal = promos.sponsor_internal || { active: true, title: promos.internal_promo_title || 'Sedang Promo', product_ids: [] };
    const allProducts = (typeof DB !== 'undefined' && DB.getAllProducts) ? DB.getAllProducts().filter(p => p.is_active !== false) : [];

    // State sync
    if (!currentCarouselSlides || currentCarouselSlides.length === 0) {
      currentCarouselSlides = Array.isArray(carousel.slides) ? [...carousel.slides].slice(0, 5) : [];
    }
    if (!currentInternalProductIds || currentInternalProductIds.length === 0) {
      if (Array.isArray(internal.product_ids) && internal.product_ids.length > 0) {
        currentInternalProductIds = [...internal.product_ids];
      } else {
        currentInternalProductIds = allProducts.slice(0, 4).map(p => p.id);
      }
    }
    if (!currentSponsorAdImages || currentSponsorAdImages.length === 0) {
      currentSponsorAdImages = ad1.image_url ? [ad1.image_url] : ['assets/images/logo-songer-creative.png'];
    }

    const settings = (typeof DB !== 'undefined' && DB.getSettings) ? DB.getSettings() : {};
    const cardVariants = settings.card_variants_config || (typeof DB !== 'undefined' && DB.DEFAULT_CARD_VARIANTS_CONFIG) || {};
    const sponsorConfig = cardVariants.sponsor_1 || {};
    const promoSponsorStyle = promos.sponsor_style || {};

    const isStyleCustomEnabled = promoSponsorStyle.enabled !== undefined
      ? promoSponsorStyle.enabled
      : (sponsorConfig.custom_style_enabled === true);

    const currentBgColor = promoSponsorStyle.bg_color || sponsorConfig.bg_color || 'transparent';
    const currentBorderColor = promoSponsorStyle.border_color || sponsorConfig.border_color || '#e2e8f0';
    const currentBorderRadius = promoSponsorStyle.border_radius || sponsorConfig.border_radius || '16px';

    const isCurrentActive = activeSponsorType === 'carousel'
      ? (carousel.is_active || carousel.active)
      : (activeSponsorType === 'internal' ? (internal.active !== false) : (ad1.active !== false));

    const modelName = activeSponsorType === 'carousel'
      ? 'Sponsor Slider Carousel (Maksimal 5 Gambar)'
      : (activeSponsorType === 'internal' ? 'Sponsor Produk Sendiri (Katalog Mini Grid 2x2)' : 'Sponsor Statis (1 Gambar Banner Rasio 3:4)');

    return `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- KOLOM KIRI: FORM CONFIGURATION (7 COLS) -->
        <div class="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider text-emerald-600">Alur Pembuatan Sponsor</span>
              <h3 class="text-base font-bold text-slate-900">${modelName}</h3>
            </div>
            <div class="flex items-center gap-3">
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id="sponsor-active-toggle" ${isCurrentActive ? 'checked' : ''} class="sr-only peer" />
                <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
              <span id="label-sponsor-active" class="text-xs font-bold ${isCurrentActive ? 'text-emerald-700' : 'text-slate-400'}">
                ${isCurrentActive ? 'Slot Aktif' : 'Nonaktif'}
              </span>
            </div>
          </div>

          <!-- LANGKAH 1: PENENTUAN MODEL TAMPILAN KARTU SPONSOR (STANDARISASI ALUR) -->
          <div class="space-y-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">1</span>
              <h4 class="font-bold text-xs sm:text-sm text-slate-900">Langkah 1 - Penentuan Model Tampilan Kartu:</h4>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <label class="relative p-3 rounded-xl border ${activeSponsorType === 'ad1' ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <input type="radio" name="sponsor_card_model" value="ad1" ${activeSponsorType === 'ad1' ? 'checked' : ''} class="text-emerald-600" />
                  <span class="font-bold text-slate-900 text-xs">Sponsor Statis</span>
                </div>
                <p class="text-slate-500 text-[10px] leading-relaxed">1 Banner foto rasio 3:4 dengan 2 tombol aksi langsung.</p>
              </label>
              <label class="relative p-3 rounded-xl border ${activeSponsorType === 'carousel' ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <input type="radio" name="sponsor_card_model" value="carousel" ${activeSponsorType === 'carousel' ? 'checked' : ''} class="text-emerald-600" />
                  <span class="font-bold text-slate-900 text-xs">Slider Carousel</span>
                </div>
                <p class="text-slate-500 text-[10px] leading-relaxed">Maksimal 5 slide gambar + putar otomatis 3.5 detik (Tanpa CTA).</p>
              </label>
              <label class="relative p-3 rounded-xl border ${activeSponsorType === 'internal' ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <input type="radio" name="sponsor_card_model" value="internal" ${activeSponsorType === 'internal' ? 'checked' : ''} class="text-emerald-600" />
                  <span class="font-bold text-slate-900 text-xs">Produk Sendiri</span>
                </div>
                <p class="text-slate-500 text-[10px] leading-relaxed">Katalog Mini Internal Grid 2x2 dari database produk toko.</p>
              </label>
            </div>
          </div>

          <!-- LANGKAH 2: FORM PENGATURAN SPESIFIK MODEL -->
          ${activeSponsorType === 'carousel' ? `
            <!-- FORM CAROUSEL (MAKSIMAL 5 GAMBAR) -->
            <div class="space-y-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">2</span>
                <h4 class="font-bold text-xs sm:text-sm text-slate-900">Langkah 2 - Konfigurasi Slider Carousel (Tanpa CTA):</h4>
              </div>

              <!-- Saran Skala Gambar Versi 2 -->
              <div class="p-3 bg-blue-50/90 rounded-xl border border-blue-200 text-xs text-blue-900 leading-relaxed space-y-1">
                <div class="flex items-center gap-1.5 font-bold">
                  <i data-lucide="info" class="w-4 h-4 text-blue-600 shrink-0"></i>
                  <span>Saran Ukuran & Skala Gambar Carousel:</span>
                </div>
                <p class="text-[11px] text-blue-800">
                  Gunakan rasio <strong>3:4 Portrait</strong> (resolusi ideal <strong>600×800 px</strong>, maksimal 500 KB). Gambar akan mengisi tinggi kartu secara proporsional sesuai baris grid, <strong>tanpa tombol CTA</strong> dengan indikator titik dots dinamis.
                </p>
              </div>

              <!-- Saran Pilihan Animasi Slide Carousel -->
              <div class="p-3 bg-emerald-50/90 rounded-xl border border-emerald-200 text-xs text-emerald-950 leading-relaxed space-y-1.5">
                <div class="flex items-center gap-1.5 font-bold text-emerald-800">
                  <i data-lucide="sparkles" class="w-4 h-4 text-emerald-600 shrink-0"></i>
                  <span>Saran Pilihan Animasi & Transisi Slide:</span>
                </div>
                <p class="text-[11px] text-emerald-900 leading-normal">
                  Untuk kartu sponsor portrait, disarankan menggunakan animasi <strong>Slide Horizontal (3.5s)</strong> agar pembeli langsung menyadari adanya multi-foto produk, atau <strong>Fade In / Out</strong> untuk perpindahan visual yang lembut tanpa jeda tajam.
                </p>
              </div>

              <!-- Pilihan Animasi & Interval Pergantian Slide -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label class="block font-bold text-slate-700 mb-1 text-xs">Interval Putar Otomatis (milidetik):</label>
                  <div class="flex items-center gap-2">
                    <input type="number" id="carousel-interval-input" value="${carousel.auto_slide_interval || 3500}" class="w-28 px-3 py-2 rounded-xl border border-slate-300 font-semibold outline-none focus:border-emerald-500 text-xs bg-white" placeholder="3500" />
                    <span class="text-[11px] text-slate-500">Standar: 3.5 detik</span>
                  </div>
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1 text-xs flex items-center justify-between">
                    <span>Saran Dropdown Animasi Slide:</span>
                    <span class="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-1.5 py-0.2 rounded">Rekomendasi Aktif</span>
                  </label>
                  <select id="carousel-anim-type-select" class="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white font-semibold outline-none focus:border-emerald-500 text-xs ring-1 ring-emerald-500/20">
                    <option value="slide" ${(carousel.animation_type === 'slide' || !carousel.animation_type) ? 'selected' : ''}>✨ Slide Horizontal (Geser Halus) - [Saran Terbaik / Rekomendasi]</option>
                    <option value="fade" ${carousel.animation_type === 'fade' ? 'selected' : ''}>✨ Fade In / Out (Pudar Elegan) - [Saran Rekomendasi]</option>
                    <option value="scale" ${carousel.animation_type === 'scale' ? 'selected' : ''}>Ken Burns Zoom / Scale (Sinematik)</option>
                  </select>
                </div>
              </div>

              <div class="pt-2 border-t border-slate-200 space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <label class="block font-bold text-slate-800 text-xs">Slide Foto Carousel (Maksimal 5 Foto):</label>
                    <p class="text-[11px] text-slate-400">Unggah berkas atau tempel URL link gambar slide.</p>
                  </div>
                  <span id="carousel-slide-counter-badge" class="px-2.5 py-1 rounded-full text-[10px] font-bold ${currentCarouselSlides.length >= 5 ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}">
                    ${currentCarouselSlides.length} / 5 Slide
                  </span>
                </div>

                <!-- Unified uploader for carousel slides -->
                ${renderUnifiedUploaderHtml({
                  id: 'sponsor-carousel-uploader',
                  images: currentCarouselSlides.map(s => s.image_url).filter(Boolean),
                  isMulti: true,
                  placeholder: 'Tempel URL gambar slide baru (https://...)'
                })}

                <!-- Repeater Items with Target URLs -->
                <div class="pt-3 border-t border-slate-200">
                  <div class="flex items-center justify-between mb-2">
                    <h5 class="font-bold text-slate-800 text-xs">Target Link & Detail Tiap Slide:</h5>
                    ${currentCarouselSlides.length < 5 ? `
                      <button type="button" id="btn-add-carousel-slide" class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-xs cursor-pointer">
                        <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                        <span>Tambah Slide Kosong</span>
                      </button>
                    ` : `
                      <span class="text-[11px] font-bold text-slate-400">Maksimal 5 slide tercapai</span>
                    `}
                  </div>
                  <div id="carousel-slides-container" class="space-y-2">
                    <!-- Populated by renderCarouselSlideRows -->
                  </div>
                </div>
              </div>
            </div>
          ` : (activeSponsorType === 'internal' ? `
            <!-- FORM INTERNAL SPONSOR (GRID 2x2 PRODUK SENDIRI) -->
            <div class="space-y-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">2</span>
                <h4 class="font-bold text-xs sm:text-sm text-slate-900">Langkah 2 - Konfigurasi Katalog Mini Internal (Grid 2x2):</h4>
              </div>

              <!-- Saran Format Versi 3 -->
              <div class="p-3 bg-emerald-50/90 rounded-xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed space-y-1">
                <div class="flex items-center gap-1.5 font-bold">
                  <i data-lucide="info" class="w-4 h-4 text-emerald-600 shrink-0"></i>
                  <span>Format & Jumlah Slide Produk Internal:</span>
                </div>
                <p class="text-[11px] text-emerald-800">
                  Pilih produk kelipatan 4 dari database toko (4, 8, 12, 16, hingga 20 produk). Indikator navigasi dots akan <strong>otomatis menyesuaikan</strong>: 4 produk = tanpa dots, 8 produk = 2 dots, 12 produk = 3 dots, dst.
                </p>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1 text-xs">Judul Iklan Promo (Headline):</label>
                <input type="text" id="sponsor-internal-title-input" value="${escapeHtml(internal.title || 'FLASH SALE 11.11')}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold outline-none focus:border-emerald-500 text-xs bg-white" placeholder="Contoh: FLASH SALE 11.11 atau Sedang Promo" />
                <p class="text-[10px] text-slate-400 mt-1">Judul ini langsung tampil di baris atas kartu produk sendiri.</p>
              </div>

              <div class="pt-2 border-t border-slate-200 space-y-2">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label class="block font-bold text-slate-800 text-xs">Pilih Produk dari Database Toko:</label>
                    <p class="text-[11px] text-slate-400">Pilih kelipatan 4 produk untuk navigasi slide interaktif.</p>
                  </div>
                  <span id="internal-selected-count-badge" class="px-2.5 py-1 rounded-full text-xs font-bold ${currentInternalProductIds.length % 4 === 0 && currentInternalProductIds.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'} shrink-0">
                    Terpilih: ${currentInternalProductIds.length} Produk (${Math.ceil(currentInternalProductIds.length / 4)} Slide Batch)
                  </span>
                </div>

                <!-- Input Pencarian / Pemilih Produk Internal -->
                <div class="relative">
                  <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                  <input type="text" id="internal-prod-search-input" placeholder="Cari nama produk internal toko..." class="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-500 bg-white" />
                </div>

                <!-- Product list checklist container -->
                <div class="max-h-72 overflow-y-auto space-y-2 p-2 bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
                  ${allProducts.length === 0 ? `
                    <div class="p-6 text-center text-xs text-slate-400">Belum ada produk aktif di database toko.</div>
                  ` : allProducts.map(prod => {
                    const isChecked = currentInternalProductIds.includes(prod.id);
                    const effDiscount = (typeof DB !== 'undefined' && DB.getProductEffectiveDiscount) ? DB.getProductEffectiveDiscount(prod) : { has_discount: false };
                    const minPrice = prod.price || (prod.starting_price || 0);
                    const finalPrice = effDiscount.has_discount ? effDiscount.discounted_price : minPrice;
                    const imgSrc = (Array.isArray(prod.images) && prod.images.length > 0) ? prod.images[0] : (prod.image_url || 'assets/images/logo-songer-creative.png');

                    return `
                      <label class="internal-prod-item p-2.5 flex items-center gap-3 hover:bg-slate-50 transition rounded-xl cursor-pointer ${isChecked ? 'bg-emerald-50/40' : ''}" data-name="${escapeHtml(prod.name).toLowerCase()}">
                        <input type="checkbox" value="${prod.id}" ${isChecked ? 'checked' : ''} class="internal-prod-checkbox w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
                        <img src="${escapeHtml(imgSrc)}" class="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 text-slate-400 text-xs border border-slate-200\\'><i class=\\'bi bi-image\\'></i></div>';" />
                        <div class="flex-1 min-w-0">
                          <p class="font-bold text-xs text-slate-900 truncate">${escapeHtml(prod.name)}</p>
                          <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-[11px] font-black text-emerald-600">Rp ${Math.round(finalPrice).toLocaleString('id-ID')}</span>
                            ${effDiscount.has_discount ? `<span class="text-[10px] bg-rose-100 text-rose-700 px-1 py-0.2 rounded font-bold">${effDiscount.percent}% OFF</span>` : ''}
                          </div>
                        </div>
                      </label>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>
          ` : `
            <!-- FORM SPONSOR STATIS (1 GAMBAR DENGAN 2 CTA) -->
            <div class="space-y-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 text-xs">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">2</span>
                <h4 class="font-bold text-xs sm:text-sm text-slate-900">Langkah 2 - Konfigurasi Sponsor Statis (1 Gambar 2 CTA):</h4>
              </div>

              <!-- Saran Skala Gambar Versi 1 Sesuai Arahan Gambar 1 -->
              <div class="p-3 bg-amber-50/90 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-1">
                <div class="flex items-center gap-1.5 font-bold">
                  <i data-lucide="info" class="w-4 h-4 text-amber-600 shrink-0"></i>
                  <span>Saran Ukuran & Skala Gambar Banner (Rasio 3:4 Portrait):</span>
                </div>
                <p class="text-[11px] text-amber-800">
                  Gunakan rasio <strong>3:4 Portrait</strong> (resolusi ideal <strong>600×800 px</strong>, maksimal 500 KB) agar gambar mengisi <strong>75% tinggi card sponsor</strong>, dan memberikan ruang 25% untuk <strong>2 Tombol CTA</strong> ("Lihat Tawaran" & "Pasang Iklan WA") di bagian bawah kartu.
                </p>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Judul / Headline Iklan:</label>
                <input type="text" id="sponsor-title-input" value="${escapeHtml(ad1.title || '')}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold outline-none focus:border-emerald-500 bg-white" placeholder="Contoh: Mitra Rekanan Percetakan" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Sub-judul / Keterangan Singkat:</label>
                <input type="text" id="sponsor-subtitle-input" value="${escapeHtml(ad1.subtitle || '')}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium outline-none focus:border-emerald-500 bg-white" placeholder="Contoh: Solusi cetak kemasan dan merchandise" />
              </div>

              <!-- PENGATURAN DURASI & ANIMASI SPONSOR VERSI 1 (STATIS) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label class="block font-bold text-slate-700 mb-1 text-xs">Durasi Animasi / Tayang (milidetik):</label>
                  <div class="flex items-center gap-2">
                    <input type="number" id="sponsor-ad1-duration-input" value="${ad1.animation_duration || ad1.auto_slide_interval || 3500}" class="w-28 px-3 py-2 rounded-xl border border-slate-300 font-semibold outline-none focus:border-emerald-500 text-xs bg-white" placeholder="3500" />
                    <span class="text-[11px] text-slate-500">Standar: 3.5 detik</span>
                  </div>
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1 text-xs">Pilihan Transisi Animasi:</label>
                  <select id="sponsor-ad1-anim-type-select" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold outline-none focus:border-emerald-500 text-xs">
                    <option value="fade" ${(ad1.animation_type === 'fade' || !ad1.animation_type) ? 'selected' : ''}>Fade In / Out (Pudar Halus)</option>
                    <option value="slide" ${ad1.animation_type === 'slide' ? 'selected' : ''}>Slide Horizontal (Geser Halus)</option>
                    <option value="scale" ${ad1.animation_type === 'scale' ? 'selected' : ''}>Scale / Zoom Sinematik</option>
                  </select>
                </div>
              </div>

              <div class="space-y-2 pt-2 border-t border-slate-200">
                <label class="block font-bold text-slate-700">Media Banner Sponsor (Rasio 3:4 Portrait, Tinggi 75% Card):</label>
                <p class="text-[11px] text-slate-400 mb-2">Unggah berkas foto banner atau tempel link URL gambar langsung.</p>
                ${renderUnifiedUploaderHtml({
                  id: 'sponsor-ad1-uploader',
                  images: currentSponsorAdImages,
                  isMulti: false,
                  placeholder: 'Tempel link URL gambar banner sponsor (https://...)'
                })}
                <input type="hidden" id="sponsor-image-input" value="${escapeHtml(currentSponsorAdImages[0] || '')}" />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Tipe CTA Tombol Utama:</label>
                  <select id="sponsor-cta-type" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold outline-none focus:border-emerald-500 bg-white">
                    <option value="external_url" ${ad1.cta_type !== 'whatsapp' ? 'selected' : ''}>Buka Link Tawaran (URL Luar)</option>
                    <option value="whatsapp" ${ad1.cta_type === 'whatsapp' ? 'selected' : ''}>Tanyakan via WhatsApp</option>
                  </select>
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Teks Tombol Utama (CTA 1):</label>
                  <input type="text" id="sponsor-cta-label" value="${escapeHtml(ad1.cta_label || 'Lihat Tawaran')}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold outline-none focus:border-emerald-500 bg-white" />
                </div>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Target Link / Nomor WhatsApp Tujuan CTA 1:</label>
                <input type="text" id="sponsor-cta-target" value="${escapeHtml(ad1.cta_target || '')}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-[11px] outline-none focus:border-emerald-500 bg-white" placeholder="https://... atau 6281234567890" />
              </div>
            </div>
          `)}

          <!-- LANGKAH 3: KUSTOMISASI STYLE CARD SPONSOR -->
          <div class="space-y-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">3</span>
              <h4 class="font-bold text-xs sm:text-sm text-slate-900">Langkah 3 - Kustomisasi Style Card Sponsor:</h4>
            </div>

            <!-- Checkbox Edit Style Card Sponsor (Sebelum mengcustom, tampilkan dahulu checkbox ini) -->
            <div class="p-3.5 bg-white rounded-xl border ${isStyleCustomEnabled ? 'border-emerald-400 bg-emerald-50/20' : 'border-slate-200'} transition-all shadow-2xs">
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" id="chk-edit-sponsor-style" ${isStyleCustomEnabled ? 'checked' : ''} class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                  <div>
                    <span class="text-xs font-bold text-slate-900 block">Edit Style Card Sponsor</span>
                    <span class="text-[10px] text-slate-500 block">Centang untuk membuka akses kustomisasi warna card, border, dan radius.</span>
                  </div>
                </label>
                <span id="badge-sponsor-style-state" class="px-2.5 py-1 rounded-full text-[10px] font-bold ${isStyleCustomEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}">
                  ${isStyleCustomEnabled ? 'Kustomisasi Aktif' : 'Default (Transparan)'}
                </span>
              </div>
            </div>

            <!-- Panel Customisasi Card Sponsor (Akses terbuka setelah checkbox dicentang) -->
            <div id="sponsor-style-custom-panel" class="${isStyleCustomEnabled ? '' : 'hidden'} space-y-4 pt-3 border-t border-slate-200 transition-all">
              
              <!-- 1. Warna Card (Background) - Default: transparent -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="font-bold text-slate-700 text-xs">Warna Background Card:</label>
                  <span class="text-[10px] text-slate-500">Default: <strong class="text-emerald-700 font-mono">transparent</strong></span>
                </div>
                <div class="flex items-center gap-2">
                  <input type="color" id="sponsor-card-bg-picker" value="${currentBgColor === 'transparent' ? '#ffffff' : currentBgColor}" class="w-9 h-9 p-0.5 rounded-lg border border-slate-300 cursor-pointer bg-white shrink-0" />
                  <input type="text" id="sponsor-card-bg-input" value="${escapeHtml(currentBgColor)}" placeholder="transparent atau #ffffff" class="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold outline-none focus:border-emerald-500 bg-white" />
                  <button type="button" id="btn-preset-bg-transparent" class="px-2.5 py-2 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition shrink-0" title="Set Latar Belakang Transparan">
                    Set Transparan
                  </button>
                </div>
                <!-- Preset Cepat Warna Background -->
                <div class="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span class="text-[10px] text-slate-400 mr-1">Preset Cepat:</span>
                  <button type="button" class="btn-preset-sponsor-bg px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-white text-slate-700 border-slate-200 hover:bg-slate-50" data-color="transparent">Transparan (Bawaan)</button>
                  <button type="button" class="btn-preset-sponsor-bg px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-white text-slate-700 border-slate-200 hover:bg-slate-50" data-color="#ffffff">Putih (#ffffff)</button>
                  <button type="button" class="btn-preset-sponsor-bg px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100" data-color="#f8fafc">Slate (#f8fafc)</button>
                  <button type="button" class="btn-preset-sponsor-bg px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100" data-color="#f0fdf4">Emerald Soft (#f0fdf4)</button>
                  <button type="button" class="btn-preset-sponsor-bg px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-slate-900 text-white border-slate-800 hover:bg-slate-800" data-color="#0f172a">Dark (#0f172a)</button>
                </div>
              </div>

              <!-- 2. Warna Border Card -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="font-bold text-slate-700 text-xs">Warna Border Card:</label>
                  <span class="text-[10px] text-slate-500">Default: <strong class="text-slate-600 font-mono">#e2e8f0</strong></span>
                </div>
                <div class="flex items-center gap-2">
                  <input type="color" id="sponsor-card-border-picker" value="${currentBorderColor === 'transparent' ? '#e2e8f0' : currentBorderColor}" class="w-9 h-9 p-0.5 rounded-lg border border-slate-300 cursor-pointer bg-white shrink-0" />
                  <input type="text" id="sponsor-card-border-input" value="${escapeHtml(currentBorderColor)}" placeholder="#e2e8f0 atau transparent" class="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold outline-none focus:border-emerald-500 bg-white" />
                  <button type="button" id="btn-preset-border-transparent" class="px-2.5 py-2 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition shrink-0" title="Set Border Transparan / Tanpa Garis">
                    Tanpa Border
                  </button>
                </div>
                <!-- Preset Cepat Warna Border -->
                <div class="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span class="text-[10px] text-slate-400 mr-1">Preset Cepat:</span>
                  <button type="button" class="btn-preset-sponsor-border px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-white text-slate-700 border-slate-200 hover:bg-slate-50" data-color="transparent">Transparan</button>
                  <button type="button" class="btn-preset-sponsor-border px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200" data-color="#e2e8f0">Abu (#e2e8f0)</button>
                  <button type="button" class="btn-preset-sponsor-border px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100" data-color="#10b981">Emerald (#10b981)</button>
                  <button type="button" class="btn-preset-sponsor-border px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100" data-color="#f59e0b">Amber (#f59e0b)</button>
                  <button type="button" class="btn-preset-sponsor-border px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-slate-800 text-white border-slate-700 hover:bg-slate-700" data-color="#334155">Dark (#334155)</button>
                </div>
              </div>

              <!-- 3. Border Radius Card (Sudut Lengkung) -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="font-bold text-slate-700 text-xs">Sudut Lengkung (Border Radius):</label>
                  <span id="label-sponsor-radius-val" class="text-xs font-mono font-bold text-emerald-700">${currentBorderRadius}</span>
                </div>
                <div class="flex items-center gap-3">
                  <input type="range" id="sponsor-card-radius-range" min="0" max="32" step="2" value="${parseInt(currentBorderRadius) || 16}" class="flex-1 accent-emerald-600 cursor-pointer" />
                  <input type="text" id="sponsor-card-radius-input" value="${escapeHtml(currentBorderRadius)}" class="w-20 px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-center outline-none focus:border-emerald-500 bg-white shrink-0" />
                </div>
                <!-- Preset Radius Cepat -->
                <div class="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span class="text-[10px] text-slate-400 mr-1">Preset Cepat:</span>
                  <button type="button" class="btn-preset-sponsor-radius px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-white text-slate-700 border-slate-200 hover:bg-slate-50" data-radius="0px">0px (Siku)</button>
                  <button type="button" class="btn-preset-sponsor-radius px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-white text-slate-700 border-slate-200 hover:bg-slate-50" data-radius="8px">8px (Kecil)</button>
                  <button type="button" class="btn-preset-sponsor-radius px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100" data-radius="16px">16px (Standar)</button>
                  <button type="button" class="btn-preset-sponsor-radius px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-white text-slate-700 border-slate-200 hover:bg-slate-50" data-radius="24px">24px (Bulat)</button>
                  <button type="button" class="btn-preset-sponsor-radius px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-white text-slate-700 border-slate-200 hover:bg-slate-50" data-radius="32px">32px (Maks)</button>
                </div>
              </div>

            </div>
          </div>

          <!-- Tombol Simpan Sponsor -->
          <div class="pt-4 border-t border-slate-100 flex justify-end">
            <button type="button" id="btn-save-single-sponsor" class="btn-primary-brand px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition hover:brightness-105 cursor-pointer">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Simpan Konfigurasi Sponsor Ini</span>
            </button>
          </div>

        </div>

        <!-- KOLOM KANAN: LIVE PREVIEW IDENTIK DENGAN ETALASE (5 COLS) -->
        <div class="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <span class="text-xs font-bold text-slate-800 flex items-center gap-2">
              <i data-lucide="eye" class="w-4 h-4 text-emerald-600"></i>
              Pratinjau Kartu Sponsor di Etalase:
            </span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider">
              Live Preview
            </span>
          </div>

          <!-- Container Live Preview -->
          <div id="sponsor-card-live-preview" class="max-w-[300px] mx-auto w-full">
            <!-- Rendered dynamically via updateSponsorPreviews() -->
          </div>

          <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
            <span class="font-bold text-slate-700 block mb-0.5">Penempatan Otomatis di Web Toko:</span>
            ${activeSponsorType === 'carousel'
              ? 'Kartu slider carousel akan otomatis memutar pergantian slide tiap 3.5 detik di slot sponsor etalase.'
              : (activeSponsorType === 'internal'
                ? 'Kartu katalog mini 2x2 menampilkan produk internal toko secara interaktif. Klik mini card di etalase akan langsung membuka halaman produk (PDP).'
                : 'Kartu sponsor statis menampilkan gambar banner 3:4 penuh dengan 2 tombol aksi CTA.')}
          </div>
        </div>

      </div>
    `;
  }

  function updateSponsorPreviews() {
    clearSponsorPreviewTimer();
    const box = document.getElementById('sponsor-card-live-preview');
    if (!box) return;

    const isCustomStyle = document.getElementById('chk-edit-sponsor-style')?.checked;
    const bgVal = isCustomStyle ? (document.getElementById('sponsor-card-bg-input')?.value.trim() || 'transparent') : 'transparent';
    const borderVal = isCustomStyle ? (document.getElementById('sponsor-card-border-input')?.value.trim() || '#e2e8f0') : '#e2e8f0';
    const radiusVal = isCustomStyle ? (document.getElementById('sponsor-card-radius-input')?.value.trim() || '16px') : '16px';
    const cardStyleCss = `background-color: ${bgVal}; border: 1px solid ${borderVal}; border-radius: ${radiusVal};`;

    if (activeSponsorType === 'carousel') {
      const slides = currentCarouselSlides || [];
      const interval = parseInt(document.getElementById('carousel-interval-input')?.value) || 3500;
      const animType = document.getElementById('carousel-anim-type-select')?.value || 'slide';

      if (slides.length === 0) {
        box.innerHTML = `
          <div class="h-full flex flex-col justify-between overflow-hidden shadow-md relative group aspect-[3/4]" style="${cardStyleCss}">
            <div class="relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white flex flex-col items-center justify-center p-4 text-center shrink-0">
              <span class="absolute top-2.5 left-2.5 bg-slate-900/85 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm z-10">
                SPONSOR
              </span>
              <div class="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-2 text-amber-400">
                <i class="bi bi-images text-2xl"></i>
              </div>
              <span class="text-xs font-black tracking-widest text-white uppercase">CAROUSEL (TANPA CTA)</span>
              <p class="text-[10px] text-slate-400 mt-1 max-w-[170px]">Belum ada slide gambar. Tambahkan 1-5 slide foto di form samping.</p>
            </div>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      // Dynamic dots: jika 1 tidak ada dots, jika 2 hanya ada 2 dots, jika 3 maka 3, jika 4 maka 4, jika 5 maka 5
      const showDots = slides.length > 1;
      const dotsHtml = showDots ? slides.map((_, idx) => `
        <button type="button" class="admin-carousel-preview-dot w-2 h-2 rounded-full ${idx === 0 ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'} transition-all cursor-pointer shadow-sm" data-idx="${idx}" aria-label="Slide ${idx + 1}"></button>
      `).join('') : '';

      let slidesContentHtml = '';
      if (animType === 'fade' || animType === 'scale') {
        slidesContentHtml = slides.map((slide, idx) => `
          <div class="admin-carousel-preview-slide absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${idx === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}" style="transition: opacity 0.6s ease, transform 0.6s ease;">
            <img src="${escapeHtml(slide.image_url || '')}" alt="Slide ${idx + 1}" class="w-full h-full object-cover" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-300 p-3\\'><i class=\\'bi bi-badge-ad text-3xl mb-1\\'></i><span class=\\'text-[10px] font-bold\\'>SPACE IKLAN AVAILABLE</span></div>';" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20"></div>
          </div>
        `).join('');
      } else {
        slidesContentHtml = `
          <div id="sponsor-carousel-preview-track" class="flex w-full h-full transition-transform duration-500 ease-in-out">
            ${slides.map((slide, idx) => `
              <div class="w-full h-full shrink-0 relative block" style="width: 100%; height: 100%;">
                <img src="${escapeHtml(slide.image_url || '')}" alt="Slide ${idx + 1}" class="w-full h-full object-cover" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-300 p-3\\'><i class=\\'bi bi-badge-ad text-3xl mb-1\\'></i><span class=\\'text-[10px] font-bold\\'>SPACE IKLAN AVAILABLE</span></div>';" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20"></div>
              </div>
            `).join('')}
          </div>
        `;
      }

      // WIREFRAME GAMBAR 1 & 2: FULL IMG CAROUSEL TANPA CTA DENGAN DOTS DI BAWAH
      box.innerHTML = `
        <div class="h-full flex flex-col justify-between overflow-hidden shadow-md relative group aspect-[3/4]" style="${cardStyleCss}">
          <div class="relative w-full h-full bg-slate-900 overflow-hidden block shrink-0 shadow-inner">
            ${slidesContentHtml}
            <span class="absolute top-2.5 left-2.5 bg-slate-900/85 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm z-20">
              SPONSOR
            </span>
            ${showDots ? `
              <div class="absolute bottom-2.5 left-0 right-0 flex items-center justify-center gap-1.5 z-20">
                ${dotsHtml}
              </div>
            ` : ''}
          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
      // Interactive dot clicks on preview
      box.querySelectorAll('.admin-carousel-preview-dot').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetIdx = parseInt(btn.getAttribute('data-idx')) || 0;
          const track = document.getElementById('sponsor-carousel-preview-track');
          const fadeSlides = document.querySelectorAll('.admin-carousel-preview-slide');
          const dots = box.querySelectorAll('.admin-carousel-preview-dot');
          if (animType === 'fade' || animType === 'scale') {
            fadeSlides.forEach((sl, idx) => {
              sl.style.opacity = idx === targetIdx ? '1' : '0';
              sl.style.zIndex = idx === targetIdx ? '10' : '0';
            });
          } else if (track) {
            track.style.transform = `translateX(-${targetIdx * 100}%)`;
          }
          dots.forEach((d, idx) => {
            d.className = `admin-carousel-preview-dot w-2 h-2 rounded-full ${idx === targetIdx ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'} transition-all cursor-pointer shadow-sm`;
          });
        });
      });

      startAdminCarouselRotation(slides.length, interval, animType);
      return;
    }

    if (activeSponsorType === 'internal') {
      const allProducts = (typeof DB !== 'undefined' && DB.getAllProducts) ? DB.getAllProducts().filter(p => p.is_active !== false) : [];
      const titleInputForm = document.getElementById('sponsor-internal-title-input');
      const titleInputTable = document.getElementById('sponsor-internal-title-table-input');
      const title = (titleInputForm?.value || titleInputTable?.value || 'FLASH SALE 11.11').trim();

      const selectedIds = currentInternalProductIds || [];
      let displayProds = [];
      if (Array.isArray(selectedIds) && selectedIds.length > 0) {
        displayProds = selectedIds.map(id => allProducts.find(p => p.id === id)).filter(Boolean);
      }
      if (displayProds.length === 0) {
        const promoProds = allProducts.filter(p => p.has_monthly_discount || p.sales_count > 0);
        displayProds = promoProds.length >= 4 ? promoProds : allProducts;
      }

      // Dinamis: 1 hingga 5 Batches (kelipatan 4 produk)
      const batches = [];
      for (let i = 0; i < displayProds.length && batches.length < 5; i += 4) {
        const chunk = displayProds.slice(i, i + 4);
        if (chunk.length > 0) batches.push(chunk);
      }
      if (batches.length === 0) batches.push(allProducts.slice(0, 4));

      const totalBatches = batches.length;
      const showDots = totalBatches > 1;

      function renderMiniGrid(batchList) {
        if (!batchList || batchList.length === 0) {
          return `<div class="col-span-2 py-6 text-center text-xs text-slate-400">Belum ada produk dipilih.</div>`;
        }
        return batchList.map(prod => {
          const effDiscount = (typeof DB !== 'undefined' && DB.getProductEffectiveDiscount) ? DB.getProductEffectiveDiscount(prod) : { has_discount: false };
          const minPrice = prod.price || (prod.starting_price || 0);
          const finalPrice = effDiscount.has_discount ? effDiscount.discounted_price : minPrice;
          const imgSrc = (Array.isArray(prod.images) && prod.images.length > 0) ? prod.images[0] : (prod.image_url || 'assets/images/logo-songer-creative.png');

          return `
            <div class="group/mini block p-1.5 rounded-xl border border-slate-200/90 bg-white shadow-2xs hover:shadow-sm transition flex flex-col justify-between">
              <div class="relative w-full aspect-square rounded-lg overflow-hidden bg-slate-100 shrink-0 mb-1">
                <img src="${escapeHtml(imgSrc)}" class="w-full h-full object-cover" alt="${escapeHtml(prod.name)}" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-xs\\'><i class=\\'bi bi-image\\'></i></div>';" />
                ${effDiscount.has_discount ? `
                  <span class="absolute top-1 right-1 bg-rose-600 text-white text-[8px] font-black px-1 py-0.2 rounded shadow-xs">
                    ${effDiscount.percent}%
                  </span>
                ` : ''}
              </div>
              <div>
                <p class="text-[10px] font-bold text-slate-800 line-clamp-1 leading-tight" title="${escapeHtml(prod.name)}">${escapeHtml(prod.name)}</p>
                <p class="text-[10px] font-black text-emerald-600 mt-0.5">Rp ${Math.round(finalPrice).toLocaleString('id-ID')}</p>
              </div>
            </div>
          `;
        }).join('');
      }

      const batchesHtml = batches.map((batchList, idx) => `
        <div class="admin-internal-preview-batch batch-${idx + 1} grid grid-cols-2 gap-2 my-auto py-1 ${idx === 0 ? '' : 'hidden'}">
          ${renderMiniGrid(batchList)}
        </div>
      `).join('');

      const dotsHtml = showDots ? `
        <div class="flex items-center justify-center gap-1.5 py-1">
          ${batches.map((_, idx) => `
            <button type="button" class="admin-internal-dot w-2 h-2 rounded-full ${idx === 0 ? 'bg-emerald-600 scale-125' : 'bg-slate-300 hover:bg-slate-400'} transition-all cursor-pointer" data-batch="${idx + 1}" aria-label="Slide ${idx + 1}"></button>
          `).join('')}
        </div>
      ` : '';

      // WIREFRAME GAMBAR 1 & 2: CARD SPONSOR UNTUK PRODUK SENDIRI
      box.innerHTML = `
        <div class="h-full flex flex-col justify-between p-3 sm:p-3.5 shadow-md transition-all duration-300 group relative" style="${cardStyleCss}">
          <!-- Header Judul Promo Sesuai Wireframe Gambar 1 (#3) -->
          <div class="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <h4 class="font-extrabold text-xs text-slate-900 tracking-tight line-clamp-1">${escapeHtml(title)}</h4>
            </div>
            <span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase shrink-0">Pilihan</span>
          </div>

          <!-- Dynamic Batches Grid 2x2 Mini-Card Produk Internal -->
          <div class="flex-1 flex flex-col justify-center">
            ${batchesHtml}
          </div>

          <!-- Dynamic Dots Navigasi Slide (Dinamis 1-5 Dots) -->
          ${dotsHtml}

          <!-- Tombol Aksi Bawah -->
          <div class="pt-2 border-t border-slate-200/80 mt-auto">
            <div class="w-full py-1.5 sm:py-2 px-2.5 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200 text-[10px] sm:text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-xs">
              <span>Lihat Semua Produk</span>
              <i class="bi bi-arrow-right text-xs"></i>
            </div>
          </div>
        </div>
      `;

      if (showDots) {
        box.querySelectorAll('.admin-internal-dot').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            const batchNum = btn.getAttribute('data-batch');
            box.querySelectorAll('.admin-internal-preview-batch').forEach(b => {
              if (b.classList.contains(`batch-${batchNum}`)) {
                b.classList.remove('hidden');
              } else {
                b.classList.add('hidden');
              }
            });
            box.querySelectorAll('.admin-internal-dot').forEach(d => {
              if (d.getAttribute('data-batch') === batchNum) {
                d.className = 'admin-internal-dot w-2 h-2 rounded-full bg-emerald-600 scale-125 transition-all cursor-pointer';
              } else {
                d.className = 'admin-internal-dot w-2 h-2 rounded-full bg-slate-300 hover:bg-slate-400 transition-all cursor-pointer';
              }
            });
          });
        });
      }

      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Default: 'ad1'
    const image = (currentSponsorAdImages && currentSponsorAdImages[0])
      ? currentSponsorAdImages[0]
      : (document.getElementById('sponsor-image-input')?.value.trim() || 'assets/images/logo-songer-creative.png');
    const ctaLabel = document.getElementById('sponsor-cta-label')?.value.trim() || 'Lihat Tawaran';

    box.innerHTML = `
      <div class="h-full flex flex-col justify-between overflow-hidden shadow-md relative group aspect-[3/4]" style="${cardStyleCss}">
        <!-- Area Gambar Rasio 3:4 Portrait (75% Tinggi Card Sponsor) Sesuai Wireframe Gambar 1 -->
        <div class="relative w-full aspect-[3/4] max-h-[75%] bg-slate-100 overflow-hidden block shrink-0">
          <img src="${image}" class="w-full h-full object-cover" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-3\\'><i class=\\'bi bi-badge-ad text-3xl mb-1 text-slate-300\\'></i><span class=\\'text-[10px] font-bold text-slate-400\\'>SPACE IKLAN AVAILABLE</span></div>';" />
          <div class="absolute inset-0 bg-black/10 pointer-events-none"></div>
          <span class="absolute top-2.5 left-2.5 bg-slate-900/85 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm z-10">
            SPONSOR
          </span>
        </div>
        <!-- 2 Tombol Aksi Stacked Vertikal Sesuai Wireframe Gambar 1 & 2 (~25% Tinggi Card) -->
        <div class="p-2 sm:p-2.5 flex-1 flex flex-col justify-end gap-1.5 mt-auto">
          <div class="w-full py-1.5 sm:py-2 px-2.5 rounded-xl text-white text-[10px] sm:text-[11px] font-bold bg-slate-900 flex items-center justify-center gap-1.5 shadow-xs">
            <i class="bi bi-box-arrow-up-right text-xs"></i>
            <span class="truncate">${escapeHtml(ctaLabel)}</span>
          </div>
          <div class="w-full py-1.5 sm:py-2 px-2.5 rounded-xl text-white text-[10px] sm:text-[11px] font-bold bg-emerald-600 flex items-center justify-center gap-1.5 shadow-sm">
            <i class="bi bi-whatsapp text-xs"></i>
            <span class="truncate">Pasang Iklan</span>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  // ============================================================================
  // EVENT BINDINGS
  // ============================================================================
  function bindEvents() {
    // 1. Tab Navigation
    document.querySelectorAll('.promo-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.getAttribute('data-tab');
        render();
      });
    });

    // 2. Select Promo in Promo Toko Tab
    document.querySelectorAll('.promo-row-item').forEach(btn => {
      btn.addEventListener('click', () => {
        activePromoId = btn.getAttribute('data-id') || btn.getAttribute('data-type');
        activePromoType = activePromoId;
        currentPromoImages = [];
        render();
      });
    });

    const btnAddPromo = document.getElementById('btn-add-new-promo');
    if (btnAddPromo) {
      btnAddPromo.addEventListener('click', () => {
        activePromoId = 'new';
        render();
      });
    }

    // 2b. Promo Quick Actions
    document.querySelectorAll('.toggle-promo-status').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        e.stopPropagation();
        const id = e.target.getAttribute('data-id') || e.target.getAttribute('data-type');
        const promos = DB.getPromos();
        let promoList = promos.promo_list || [];
        const item = promoList.find(p => p.id === id);
        if (item) {
          item.active = e.target.checked;
          promos.promo_list = promoList;
        }
        if (promos[id]) {
          promos[id].active = e.target.checked;
        }
        DB.updatePromos(promos);
        render();
      });
    });

    document.querySelectorAll('.btn-delete-promo').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (confirm('Hapus program promo ini secara permanen?')) {
          const promos = DB.getPromos();
          let promoList = promos.promo_list || [];
          promos.promo_list = promoList.filter(p => p.id !== id);
          if (activePromoId === id) {
            activePromoId = promos.promo_list.length > 0 ? promos.promo_list[0].id : 'new';
          }
          DB.updatePromos(promos);
          const toastFn = window.AdminApp?.showToast || window.App?.showToast || alert;
          toastFn('Program promo berhasil dihapus.', 'info');
          render();
        }
      });
    });

    // 3. Save All Promos Button (Top Right)
    const btnSaveAll = document.getElementById('btn-save-all-promos');
    if (btnSaveAll) {
      btnSaveAll.addEventListener('click', saveAllConfigurations);
    }

    const btnSaveSingle = document.getElementById('btn-save-single-promo');
    if (btnSaveSingle) {
      btnSaveSingle.addEventListener('click', saveAllConfigurations);
    }

    // 4. Promo Toko Interactive Live Preview & Uploader Listeners
    if (activeTab === 'promos') {
      initUnifiedUploader({
        id: 'promo-uploader',
        initialImages: currentPromoImages,
        isMulti: false,
        onChange: (imgs) => {
          currentPromoImages = imgs;
          updatePromoCardLivePreview();
        }
      });

      updatePromoCardLivePreview();

      // Step 1: Promo Type Radios
      document.querySelectorAll('input[name="promo_type"]').forEach(r => {
        r.addEventListener('change', (e) => {
          const monthlyBox = document.getElementById('promo-monthly-dates-box');
          const specialBox = document.getElementById('promo-special-dates-box');
          if (monthlyBox) monthlyBox.className = e.target.value === 'monthly' ? 'block pt-2' : 'hidden';
          if (specialBox) specialBox.className = e.target.value === 'special' ? 'block pt-2' : 'hidden';
          updatePromoCardLivePreview();
        });
      });

      // Step 2: Promo Card Model Radios
      document.querySelectorAll('input[name="promo_card_model"]').forEach(r => {
        r.addEventListener('change', (e) => {
          const uploaderBox = document.getElementById('promo-variant1-uploader-container');
          if (uploaderBox) {
            uploaderBox.className = e.target.value === 'variant_1' ? 'block space-y-2 pt-2 border-t border-slate-200' : 'hidden';
          }
          updatePromoCardLivePreview();
        });
      });

      // Step 3: Discount Mode Radios
      document.querySelectorAll('input[name="promo_discount_mode"]').forEach(r => {
        r.addEventListener('change', (e) => {
          const discBox = document.getElementById('promo-all-products-disc-box');
          if (discBox) {
            discBox.className = e.target.value === 'all_products' ? 'block grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2' : 'hidden';
          }
          updatePromoCardLivePreview();
        });
      });

      // Step 5: Visual Styling & Controls
      const textInputs = [
        'promo-title-line1-input',
        'promo-title-line2-input',
        'promo-label-input',
        'promo-desc-input',
        'promo-discount-value',
        'promo-min-spend',
        'promo-monthly-start-day',
        'promo-monthly-end-day',
        'promo-cta1-text',
        'promo-cta2-text'
      ];
      textInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updatePromoCardLivePreview);
      });

      const changeInputs = [
        'promo-discount-type',
        'promo-start-datetime',
        'promo-end-datetime'
      ];
      changeInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', updatePromoCardLivePreview);
      });

      // Color pickers with text field sync
      const colorPairs = [
        { picker: 'promo-title-color', text: 'promo-title-color-text' },
        { picker: 'promo-discount-color', text: 'promo-discount-color-text' },
        { picker: 'promo-bg-color1', text: 'promo-bg-color1-text' },
        { picker: 'promo-bg-color2', text: 'promo-bg-color2-text' },
        { picker: 'promo-cta1-bg' },
        { picker: 'promo-cta1-text-color' },
        { picker: 'promo-cta2-bg' },
        { picker: 'promo-cta2-text-color' }
      ];
      colorPairs.forEach(pair => {
        const pEl = document.getElementById(pair.picker);
        const tEl = pair.text ? document.getElementById(pair.text) : null;
        if (pEl) {
          pEl.addEventListener('input', () => {
            if (tEl) tEl.value = pEl.value;
            updatePromoCardLivePreview();
          });
        }
        if (tEl) {
          tEl.addEventListener('input', () => {
            if (pEl && /^#[0-9A-Fa-f]{6}$/.test(tEl.value)) {
              pEl.value = tEl.value;
            }
            updatePromoCardLivePreview();
          });
        }
      });

      // BG Type selector
      const bgTypeSel = document.getElementById('promo-bg-type');
      if (bgTypeSel) {
        bgTypeSel.addEventListener('change', (e) => {
          const angleBox = document.getElementById('promo-bg-angle-box');
          const color2Box = document.getElementById('promo-bg-color2-box');
          if (angleBox) angleBox.className = e.target.value === 'linear_gradient' ? 'block' : 'hidden';
          if (color2Box) color2Box.className = e.target.value !== 'solid' ? 'block' : 'hidden';
          updatePromoCardLivePreview();
        });
      }

      // BG Angle slider
      const bgAngleInput = document.getElementById('promo-bg-angle');
      const bgAngleVal = document.getElementById('promo-bg-angle-val');
      if (bgAngleInput) {
        bgAngleInput.addEventListener('input', () => {
          if (bgAngleVal) bgAngleVal.textContent = bgAngleInput.value + '°';
          updatePromoCardLivePreview();
        });
      }

      // Timer switch
      const timerToggle = document.getElementById('promo-show-timer');
      if (timerToggle) timerToggle.addEventListener('change', updatePromoCardLivePreview);

      // Dual CTA Theme Default Switch
      const ctaThemeToggle = document.getElementById('promo-cta-theme-default');
      if (ctaThemeToggle) {
        ctaThemeToggle.addEventListener('change', (e) => {
          const customBox = document.getElementById('promo-custom-cta-box');
          if (customBox) customBox.className = e.target.checked ? 'hidden space-y-3 pt-2' : 'block space-y-3 pt-2';
          updatePromoCardLivePreview();
        });
      }

      // Dual CTA mode radios
      document.querySelectorAll('input[name="promo_cta_mode"]').forEach(r => {
        r.addEventListener('change', updatePromoCardLivePreview);
      });

      // Active toggle indicator
      const activeToggle = document.getElementById('promo-active-toggle');
      const activeLabel = document.getElementById('label-promo-active');
      if (activeToggle && activeLabel) {
        activeToggle.addEventListener('change', e => {
          activeLabel.textContent = e.target.checked ? 'Program Aktif' : 'Nonaktif';
          activeLabel.className = `text-xs font-bold ${e.target.checked ? 'text-emerald-700' : 'text-slate-400'}`;
        });
      }
    }

    // 5. Kupon & Voucher Actions
    if (activeTab === 'vouchers') {
      const btnSubmitVoucher = document.getElementById('btn-submit-new-voucher');
      if (btnSubmitVoucher) {
        btnSubmitVoucher.addEventListener('click', handleCreateVoucher);
      }

      // Delete voucher
      document.querySelectorAll('.btn-delete-voucher').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          if (confirm('Hapus kupon voucher belanja ini secara permanen?')) {
            DB.deleteVoucher(id);
            const toastFn = window.AdminApp?.showToast || window.App?.showToast || alert;
            toastFn('Kupon voucher belanja berhasil dihapus.', 'info');
            render();
          }
        });
      });

      // Toggle voucher active status
      document.querySelectorAll('.btn-toggle-voucher').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const isCurrentActive = btn.getAttribute('data-active') === 'true';
          DB.updateVoucher(id, { is_active: !isCurrentActive });
          const toastFn = window.AdminApp?.showToast || window.App?.showToast || alert;
          toastFn(`Status voucher berhasil diubah menjadi ${!isCurrentActive ? 'Aktif' : 'Nonaktif'}.`, 'success');
          render();
        });
      });
    }

    // 6. Iklan Sponsor Actions
    if (activeTab === 'sponsors') {
      document.querySelectorAll('.sponsor-row-item').forEach(r => {
        r.addEventListener('click', () => {
          activeSponsorType = r.getAttribute('data-type');
          render();
        });
      });

      document.querySelectorAll('input[name="sponsor_card_model"]').forEach(r => {
        r.addEventListener('change', (e) => {
          activeSponsorType = e.target.value;
          render();
        });
      });

      // Quick actions: toggle & reset sponsor
      document.querySelectorAll('.toggle-sponsor-status').forEach(toggle => {
        toggle.addEventListener('change', (e) => {
          const type = e.target.getAttribute('data-type');
          const promos = DB.getPromos();
          if (type === 'carousel') {
            if (promos.sponsor_carousel) {
              promos.sponsor_carousel.active = e.target.checked;
              promos.sponsor_carousel.is_active = e.target.checked;
            }
          } else if (type === 'internal') {
            if (!promos.sponsor_internal) promos.sponsor_internal = {};
            promos.sponsor_internal.active = e.target.checked;
          } else {
            if (promos.sponsor_ads && promos.sponsor_ads[0]) {
              promos.sponsor_ads[0].active = e.target.checked;
            }
          }
          DB.updatePromos(promos);
          const toastFn = window.AdminApp?.showToast || window.App?.showToast || alert;
          toastFn(`Status sponsor ${type} berhasil diperbarui.`, 'success');
          render();
        });
      });

      document.querySelectorAll('.btn-reset-sponsor').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const type = btn.getAttribute('data-type');
          if (confirm(`Reset sponsor ini ke pengaturan awal?`)) {
            const promos = DB.getPromos();
            if (type === 'carousel') {
              if (promos.sponsor_carousel) {
                promos.sponsor_carousel.active = false;
                promos.sponsor_carousel.is_active = false;
                promos.sponsor_carousel.slides = [];
              }
            } else if (type === 'internal') {
              if (promos.sponsor_internal) {
                promos.sponsor_internal.active = false;
                promos.sponsor_internal.product_ids = [];
              }
            } else {
              if (promos.sponsor_ads && promos.sponsor_ads[0]) {
                promos.sponsor_ads[0].active = false;
              }
            }
            DB.updatePromos(promos);
            const toastFn = window.AdminApp?.showToast || window.App?.showToast || alert;
            toastFn(`Sponsor ${type} berhasil direset.`, 'info');
            render();
          }
        });
      });

      if (activeSponsorType === 'carousel') {
        renderCarouselSlideRows(currentCarouselSlides);
        initUnifiedUploader({
          id: 'sponsor-carousel-uploader',
          initialImages: currentCarouselSlides.map(s => s.image_url).filter(Boolean),
          isMulti: true,
          onChange: (imgs) => {
            currentCarouselSlides = imgs.slice(0, 5).map((img, idx) => {
              const existing = currentCarouselSlides[idx];
              return {
                image_url: img,
                target_url: existing ? existing.target_url : ''
              };
            });
            renderCarouselSlideRows(currentCarouselSlides);
            const badge = document.getElementById('carousel-slide-counter-badge');
            if (badge) badge.textContent = `${currentCarouselSlides.length} / 5 Slide`;
            updateSponsorPreviews();
          }
        });

        const btnAddSlide = document.getElementById('btn-add-carousel-slide');
        if (btnAddSlide) {
          btnAddSlide.addEventListener('click', () => {
            if (currentCarouselSlides.length < 5) {
              currentCarouselSlides.push({
                image_url: 'assets/images/logo-songer-creative.png',
                target_url: ''
              });
              renderCarouselSlideRows(currentCarouselSlides);
              const badge = document.getElementById('carousel-slide-counter-badge');
              if (badge) badge.textContent = `${currentCarouselSlides.length} / 5 Slide`;
              updateSponsorPreviews();
            }
          });
        }

        const intervalInp = document.getElementById('carousel-interval-input');
        if (intervalInp) intervalInp.addEventListener('input', updateSponsorPreviews);

        const animSelect = document.getElementById('carousel-anim-type-select');
        if (animSelect) animSelect.addEventListener('change', updateSponsorPreviews);
      } else if (activeSponsorType === 'internal') {
        const titleInp = document.getElementById('sponsor-internal-title-input');
        const titleTableInp = document.getElementById('sponsor-internal-title-table-input');
        if (titleInp) {
          titleInp.addEventListener('input', () => {
            if (titleTableInp) titleTableInp.value = titleInp.value;
            updateSponsorPreviews();
          });
        }
        if (titleTableInp) {
          titleTableInp.addEventListener('input', () => {
            if (titleInp) titleInp.value = titleTableInp.value;
            updateSponsorPreviews();
          });
        }

        const prodSearchInp = document.getElementById('internal-prod-search-input');
        if (prodSearchInp) {
          prodSearchInp.addEventListener('input', e => {
            const q = e.target.value.toLowerCase().trim();
            document.querySelectorAll('.internal-prod-item').forEach(item => {
              const name = item.getAttribute('data-name') || '';
              if (!q || name.includes(q)) {
                item.classList.remove('hidden');
              } else {
                item.classList.add('hidden');
              }
            });
          });
        }

        document.querySelectorAll('.internal-prod-checkbox').forEach(cb => {
          cb.addEventListener('change', () => {
            currentInternalProductIds = Array.from(document.querySelectorAll('.internal-prod-checkbox:checked')).map(c => c.value);
            const badge = document.getElementById('internal-selected-count-badge');
            if (badge) {
              const count = currentInternalProductIds.length;
              badge.textContent = `Terpilih: ${count} Produk (${Math.ceil(count / 4)} Slide Batch)`;
              badge.className = `px-2.5 py-1 rounded-full text-xs font-bold ${count % 4 === 0 && count > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'} shrink-0`;
            }
            updateSponsorPreviews();
          });
        });
      } else {
        initUnifiedUploader({
          id: 'sponsor-ad1-uploader',
          initialImages: currentSponsorAdImages,
          isMulti: false,
          onChange: (imgs) => {
            currentSponsorAdImages = imgs;
            const input = document.getElementById('sponsor-image-input');
            if (input) input.value = imgs[0] || '';
            updateSponsorPreviews();
          }
        });

        const sponsorInputs = [
          document.getElementById('sponsor-title-input'),
          document.getElementById('sponsor-subtitle-input'),
          document.getElementById('sponsor-cta-label'),
          document.getElementById('sponsor-cta-target'),
          document.getElementById('sponsor-ad1-duration-input')
        ];
        sponsorInputs.forEach(inp => {
          if (inp) inp.addEventListener('input', updateSponsorPreviews);
        });
        const sponsorAd1Anim = document.getElementById('sponsor-ad1-anim-type-select');
        if (sponsorAd1Anim) {
          sponsorAd1Anim.addEventListener('change', updateSponsorPreviews);
        }
        const sponsorCtaType = document.getElementById('sponsor-cta-type');
        if (sponsorCtaType) {
          sponsorCtaType.addEventListener('change', () => {
            const labelInput = document.getElementById('sponsor-cta-label');
            if (labelInput && (!labelInput.value || labelInput.value === 'Tanyakan via WhatsApp' || labelInput.value === 'Lihat Tawaran')) {
              labelInput.value = sponsorCtaType.value === 'whatsapp' ? 'Tanyakan via WhatsApp' : 'Lihat Tawaran';
            }
            updateSponsorPreviews();
          });
        }
      }

      // Event Listeners: Kustomisasi Style Card Sponsor (Langkah 3)
      const chkStyle = document.getElementById('chk-edit-sponsor-style');
      const panelStyle = document.getElementById('sponsor-style-custom-panel');
      const badgeStyleState = document.getElementById('badge-sponsor-style-state');
      if (chkStyle) {
        chkStyle.addEventListener('change', () => {
          const isChecked = chkStyle.checked;
          if (panelStyle) {
            if (isChecked) panelStyle.classList.remove('hidden');
            else panelStyle.classList.add('hidden');
          }
          if (badgeStyleState) {
            badgeStyleState.textContent = isChecked ? 'Kustomisasi Aktif' : 'Default (Transparan)';
            badgeStyleState.className = `px-2.5 py-1 rounded-full text-[10px] font-bold ${isChecked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`;
          }
          updateSponsorPreviews();
        });
      }

      // Background Color Controls
      const bgPicker = document.getElementById('sponsor-card-bg-picker');
      const bgInput = document.getElementById('sponsor-card-bg-input');
      const btnBgTrans = document.getElementById('btn-preset-bg-transparent');
      if (bgPicker && bgInput) {
        bgPicker.addEventListener('input', () => {
          bgInput.value = bgPicker.value;
          updateSponsorPreviews();
        });
        bgInput.addEventListener('input', () => {
          if (bgInput.value.startsWith('#') && (bgInput.value.length === 4 || bgInput.value.length === 7)) {
            bgPicker.value = bgInput.value;
          }
          updateSponsorPreviews();
        });
      }
      if (btnBgTrans && bgInput) {
        btnBgTrans.addEventListener('click', () => {
          bgInput.value = 'transparent';
          updateSponsorPreviews();
        });
      }
      document.querySelectorAll('.btn-preset-sponsor-bg').forEach(btn => {
        btn.addEventListener('click', () => {
          const col = btn.getAttribute('data-color') || 'transparent';
          if (bgInput) bgInput.value = col;
          if (bgPicker && col.startsWith('#')) bgPicker.value = col;
          updateSponsorPreviews();
        });
      });

      // Border Color Controls
      const borderPicker = document.getElementById('sponsor-card-border-picker');
      const borderInput = document.getElementById('sponsor-card-border-input');
      const btnBorderTrans = document.getElementById('btn-preset-border-transparent');
      if (borderPicker && borderInput) {
        borderPicker.addEventListener('input', () => {
          borderInput.value = borderPicker.value;
          updateSponsorPreviews();
        });
        borderInput.addEventListener('input', () => {
          if (borderInput.value.startsWith('#') && (borderInput.value.length === 4 || borderInput.value.length === 7)) {
            borderPicker.value = borderInput.value;
          }
          updateSponsorPreviews();
        });
      }
      if (btnBorderTrans && borderInput) {
        btnBorderTrans.addEventListener('click', () => {
          borderInput.value = 'transparent';
          updateSponsorPreviews();
        });
      }
      document.querySelectorAll('.btn-preset-sponsor-border').forEach(btn => {
        btn.addEventListener('click', () => {
          const col = btn.getAttribute('data-color') || 'transparent';
          if (borderInput) borderInput.value = col;
          if (borderPicker && col.startsWith('#')) borderPicker.value = col;
          updateSponsorPreviews();
        });
      });

      // Border Radius Controls
      const radiusRange = document.getElementById('sponsor-card-radius-range');
      const radiusInput = document.getElementById('sponsor-card-radius-input');
      const labelRadius = document.getElementById('label-sponsor-radius-val');
      if (radiusRange && radiusInput) {
        radiusRange.addEventListener('input', () => {
          const val = `${radiusRange.value}px`;
          radiusInput.value = val;
          if (labelRadius) labelRadius.textContent = val;
          updateSponsorPreviews();
        });
        radiusInput.addEventListener('input', () => {
          const num = parseInt(radiusInput.value, 10) || 0;
          radiusRange.value = num;
          if (labelRadius) labelRadius.textContent = radiusInput.value;
          updateSponsorPreviews();
        });
      }
      document.querySelectorAll('.btn-preset-sponsor-radius').forEach(btn => {
        btn.addEventListener('click', () => {
          const r = btn.getAttribute('data-radius') || '16px';
          if (radiusInput) radiusInput.value = r;
          if (radiusRange) radiusRange.value = parseInt(r, 10) || 0;
          if (labelRadius) labelRadius.textContent = r;
          updateSponsorPreviews();
        });
      });

      // Tombol Simpan Konfigurasi Sponsor Ini
      const btnSaveSponsor = document.getElementById('btn-save-single-sponsor');
      if (btnSaveSponsor) {
        btnSaveSponsor.addEventListener('click', saveAllConfigurations);
      }

      updateSponsorPreviews();
    }
  }

  // ============================================================================
  // LOGIKA SIMPAN & TAMBAH DATA
  // ============================================================================
  function handleCreateVoucher() {
    const codeIn = document.getElementById('voucher-code-input');
    const nameIn = document.getElementById('voucher-name-input');
    const typeIn = document.getElementById('voucher-type-select');
    const valIn = document.getElementById('voucher-val-input');
    const quotaIn = document.getElementById('voucher-quota-input');
    const minSpendIn = document.getElementById('voucher-min-spend-input');
    const startIn = document.getElementById('voucher-start-date');
    const endIn = document.getElementById('voucher-end-date');

    const code = (codeIn?.value || '').trim().toUpperCase();
    if (!code) {
      alert('Harap isi kode voucher unik.');
      codeIn?.focus();
      return;
    }

    const val = parseFloat(valIn?.value) || 0;
    if (val <= 0) {
      alert('Besaran potongan diskon harus lebih dari 0.');
      valIn?.focus();
      return;
    }

    const name = (nameIn?.value || '').trim() || `Voucher ${code}`;
    const type = typeIn?.value || 'percent';
    const quota = parseInt(quotaIn?.value) || 0;
    const minSpend = parseFloat(minSpendIn?.value) || 0;
    const startDate = startIn?.value || new Date().toISOString().split('T')[0];
    const endDate = endIn?.value || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    try {
      DB.addVoucher({
        code: code,
        name: name,
        discount_type: type,
        discount_value: val,
        quota: quota,
        min_spend: minSpend,
        start_date: startDate,
        end_date: endDate,
        scope: 'all',
        is_active: true
      });

      const toastFn = window.AdminApp?.showToast || window.App?.showToast || alert;
      toastFn(`Kupon voucher [${code}] berhasil diterbitkan!`, 'success');
      render();
    } catch (e) {
      alert('Gagal membuat voucher: ' + e.message);
    }
  }

  function saveAllConfigurations() {
    const current = DB.getPromos();

    // 1. Promo Toko Form Values (Tanpa Dummy Otomatis)
    let promoList = current.promo_list || [];

    if (activeTab === 'promos') {
      // Validasi Kuota Produk Toko (Interval Grid 8 Desktop / 4 Mobile)
      const activeProducts = (typeof DB !== 'undefined' && DB.getProducts) ? DB.getProducts({ status: 'active' }) : [];
      const hasEnoughQuota = activeProducts.length >= 8;

      const active = document.getElementById('promo-active-toggle')?.checked ?? true;
      const type = document.querySelector('input[name="promo_type"]:checked')?.value || 'monthly';
      const monthlyStartDay = parseInt(document.getElementById('promo-monthly-start-day')?.value) || 1;
      const monthlyEndDay = parseInt(document.getElementById('promo-monthly-end-day')?.value) || 7;
      const startDatetime = document.getElementById('promo-start-datetime')?.value || '';
      const endDatetime = document.getElementById('promo-end-datetime')?.value || '';

      const cardModel = document.querySelector('input[name="promo_card_model"]:checked')?.value || 'variant_1';
      const currentPromoImg = (currentPromoImages && currentPromoImages.length > 0) ? currentPromoImages[0] : '';

      const discMode = document.querySelector('input[name="promo_discount_mode"]:checked')?.value || 'all_products';
      const discType = document.getElementById('promo-discount-type')?.value || 'percent';
      const discVal = parseFloat(document.getElementById('promo-discount-value')?.value) || 0;
      const minSpend = parseFloat(document.getElementById('promo-min-spend')?.value) || 0;

      const targetAudience = document.querySelector('input[name="promo_target_audience"]:checked')?.value || 'all';

      const titleLine1 = document.getElementById('promo-title-line1-input')?.value.trim() || 'PROMO';
      const titleLine2 = document.getElementById('promo-title-line2-input')?.value.trim() || '';
      const label = document.getElementById('promo-label-input')?.value.trim() || (titleLine1 + (titleLine2 ? ' ' + titleLine2 : '')).trim() || 'Promo Toko Pilihan';
      const desc = document.getElementById('promo-desc-input')?.value.trim() || '';
      const titleColor = document.getElementById('promo-title-color')?.value || '#0f172a';
      const discColor = document.getElementById('promo-discount-color')?.value || '#e11d48';

      const bgType = document.getElementById('promo-bg-type')?.value || 'solid';
      const bgColor1 = document.getElementById('promo-bg-color1')?.value || '#ffffff';
      const bgColor2 = document.getElementById('promo-bg-color2')?.value || '#f8fafc';
      const bgAngle = parseInt(document.getElementById('promo-bg-angle')?.value) || 135;

      const showTimer = document.getElementById('promo-show-timer')?.checked ?? true;

      const useThemeDefault = document.getElementById('promo-cta-theme-default')?.checked ?? true;
      const ctaMode = document.querySelector('input[name="promo_cta_mode"]:checked')?.value || 'dual';
      const cta1Text = document.getElementById('promo-cta1-text')?.value.trim() || 'Ingatkan Saya';
      const cta1Bg = document.getElementById('promo-cta1-bg')?.value || '#33b589';
      const cta1TextColor = document.getElementById('promo-cta1-text-color')?.value || '#ffffff';
      const cta2Text = document.getElementById('promo-cta2-text')?.value.trim() || 'Konsultasi Desain & Cetak';
      const cta2Bg = document.getElementById('promo-cta2-bg')?.value || '#25d366';
      const cta2TextColor = document.getElementById('promo-cta2-text-color')?.value || '#ffffff';

      const promoData = {
        id: (activePromoId && activePromoId !== 'new') ? activePromoId : ('promo_' + Date.now()),
        active,
        is_active: active,
        title_line1: titleLine1,
        title_line2: titleLine2,
        type,
        monthly_start_day: monthlyStartDay,
        monthly_end_day: monthlyEndDay,
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        card_model: cardModel,
        image_url: currentPromoImg,
        discount_mode: discMode,
        discount_type: discType,
        discount_value: discVal,
        min_spend: minSpend,
        target_audience: targetAudience,
        label,
        description: desc,
        title_color: titleColor,
        discount_color: discColor,
        bg_type: bgType,
        bg_color1: bgColor1,
        bg_color2: bgColor2,
        bg_angle: bgAngle,
        show_timer: showTimer,
        use_theme_default: useThemeDefault,
        cta_mode: ctaMode,
        cta1_text: cta1Text,
        cta1_bg: cta1Bg,
        cta1_text_color: cta1TextColor,
        cta2_text: cta2Text,
        cta2_bg: cta2Bg,
        cta2_text_color: cta2TextColor
      };

      if (!activePromoId || activePromoId === 'new') {
        promoList.push(promoData);
        activePromoId = promoData.id;
      } else {
        const idx = promoList.findIndex(p => p.id === activePromoId);
        if (idx !== -1) {
          promoList[idx] = { ...promoList[idx], ...promoData };
        } else {
          promoList.push(promoData);
        }
      }

      // Sync ke current.monthly / current.special untuk kompatibilitas collision resolver
      if (type === 'monthly') {
        current.monthly = { ...current.monthly, ...promoData };
      } else if (type === 'special') {
        current.special = { ...current.special, ...promoData };
      }

      // Feedback kuota produk
      const toastFn = window.AdminApp?.showToast || window.App?.showToast || alert;
      if (!hasEnoughQuota) {
        toastFn(`Perhatian Kuota: Toko saat ini memiliki ${activeProducts.length} produk aktif. Dibutuhkan minimal 8 produk agar slot banner etalase tampil optimal. Program promo tetap tersimpan.`, 'warning');
      } else {
        toastFn('Program promo toko berhasil disimpan dan langsung aktif!', 'success');
      }
    }

    // 2. Sponsor Ads Form Values (3 Model)
    const existingAds = current.sponsor_ads || [current.ad_banner || {}];
    let sponsor_ads = existingAds;
    let sponsorCarousel = current.sponsor_carousel || { active: false, is_active: false, slides: [] };
    let sponsorInternal = current.sponsor_internal || { active: true, title: 'Koleksi Rekomendasi Toko', product_ids: [] };

    if (activeTab === 'sponsors') {
      // Check if table input has title update
      const tableTitleInp = document.getElementById('sponsor-internal-title-table-input')?.value.trim();
      if (tableTitleInp) {
        sponsorInternal = { ...sponsorInternal, title: tableTitleInp };
        current.internal_promo_title = tableTitleInp;
      }

      if (activeSponsorType === 'carousel') {
        const carouselActive = document.getElementById('sponsor-active-toggle')?.checked ?? (sponsorCarousel.active || sponsorCarousel.is_active);
        const interval = parseInt(document.getElementById('carousel-interval-input')?.value) || 3500;
        const animType = document.getElementById('carousel-anim-type-select')?.value || sponsorCarousel.animation_type || 'slide';
        
        sponsorCarousel = {
          ...sponsorCarousel,
          active: carouselActive,
          is_active: carouselActive,
          auto_slide_interval: interval,
          animation_type: animType,
          slides: (currentCarouselSlides || []).slice(0, 5)
        };
      } else if (activeSponsorType === 'internal') {
        const internalActive = document.getElementById('sponsor-active-toggle')?.checked ?? true;
        const internalTitle = document.getElementById('sponsor-internal-title-input')?.value.trim() || tableTitleInp || 'FLASH SALE 11.11';

        sponsorInternal = {
          active: internalActive,
          title: internalTitle,
          product_ids: currentInternalProductIds || []
        };
        current.internal_promo_title = internalTitle;
      } else {
        const active = document.getElementById('sponsor-active-toggle')?.checked ?? (existingAds[0]?.active ?? true);
        const title = document.getElementById('sponsor-title-input')?.value.trim() || existingAds[0]?.title || '';
        const subtitle = document.getElementById('sponsor-subtitle-input')?.value.trim() || existingAds[0]?.subtitle || '';
        const image = (currentSponsorAdImages && currentSponsorAdImages[0])
          ? currentSponsorAdImages[0]
          : (document.getElementById('sponsor-image-input')?.value.trim() || existingAds[0]?.image_url || '');
        const ctaType = document.getElementById('sponsor-cta-type')?.value || (existingAds[0]?.cta_type || 'whatsapp');
        const ctaLabel = document.getElementById('sponsor-cta-label')?.value.trim() || existingAds[0]?.cta_label || 'Tanyakan via WhatsApp';
        const ctaTarget = document.getElementById('sponsor-cta-target')?.value.trim() || existingAds[0]?.cta_target || '';
        const duration = parseInt(document.getElementById('sponsor-ad1-duration-input')?.value) || 3500;
        const animType = document.getElementById('sponsor-ad1-anim-type-select')?.value || existingAds[0]?.animation_type || 'fade';

        const updatedAd = {
          id: 'sponsor-ad-1',
          title, subtitle, image_url: image, active, cta_type: ctaType, cta_label: ctaLabel, cta_target: ctaTarget,
          animation_duration: duration,
          auto_slide_interval: duration,
          animation_type: animType
        };
        sponsor_ads = [updatedAd, existingAds[1] || {}];
      }

      // Kustomisasi Style Card Sponsor
      const isCustomStyle = document.getElementById('chk-edit-sponsor-style')?.checked ?? false;
      const bgVal = isCustomStyle ? (document.getElementById('sponsor-card-bg-input')?.value.trim() || 'transparent') : 'transparent';
      const borderVal = isCustomStyle ? (document.getElementById('sponsor-card-border-input')?.value.trim() || '#e2e8f0') : '#e2e8f0';
      const radiusVal = isCustomStyle ? (document.getElementById('sponsor-card-radius-input')?.value.trim() || '16px') : '16px';

      const sponsorStyleObj = {
        enabled: isCustomStyle,
        bg_color: bgVal,
        border_color: borderVal,
        border_radius: radiusVal
      };

      // Sinkronisasi ke DB Settings -> card_variants_config.sponsor_1 & sponsor_2
      const curSettings = (typeof DB !== 'undefined' && DB.getSettings) ? DB.getSettings() : {};
      if (!curSettings.card_variants_config) {
        curSettings.card_variants_config = (typeof DB !== 'undefined' && DB.DEFAULT_CARD_VARIANTS_CONFIG)
          ? JSON.parse(JSON.stringify(DB.DEFAULT_CARD_VARIANTS_CONFIG))
          : {};
      }
      curSettings.card_variants_config.sponsor_1 = {
        ...(curSettings.card_variants_config.sponsor_1 || {}),
        bg_color: bgVal,
        border_color: borderVal,
        border_radius: radiusVal,
        custom_style_enabled: isCustomStyle
      };
      curSettings.card_variants_config.sponsor_2 = { ...curSettings.card_variants_config.sponsor_1 };
      if (typeof DB !== 'undefined' && DB.saveSettings) DB.saveSettings(curSettings);

      current.sponsor_style = sponsorStyleObj;
    }

    const updated = {
      ...current,
      promo_list: promoList,
      sponsor_ads: sponsor_ads,
      ad_banner: sponsor_ads[0],
      sponsor_carousel: sponsorCarousel,
      sponsor_internal: sponsorInternal,
      sponsor_style: current.sponsor_style || { enabled: false, bg_color: 'transparent', border_color: '#e2e8f0', border_radius: '16px' },
      internal_promo_title: sponsorInternal.title || current.internal_promo_title
    };

    DB.updatePromos(updated);
    if (activeTab !== 'promos') {
      const toastFn = window.AdminApp?.showToast || window.App?.showToast || alert;
      toastFn('Seluruh konfigurasi promosi & iklan sponsor berhasil disimpan!', 'success');
    }
    render();
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
    render,
    updatePromoCardLivePreview,
    updateSponsorPreviews
  };
})();

window.PromoManager = PromoManager;














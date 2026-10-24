/**
 * Songer Creative - Centralized Promo, Discount & Voucher Engine (Seller Center)
 * Mega Refactor Stage 4 - Complete Marketing Submenus Overhaul
 */

const PromoManager = (() => {
  let activeTab = 'promos'; // 'promos' | 'vouchers' | 'sponsors'
  let activePromoId = null; 
  let activeSponsorId = null;
  let activePromoType = 'twin'; // 'twin' | 'special' | 'monthly'
  let activeSponsorType = 'ad1'; // 'ad1' | 'carousel' | 'internal' | 'double_width'
  let activeSponsorOwnerType = 'third_party'; // 'third_party' | 'self'
  let activeContractModel = 'wholesale'; // 'wholesale' | 'per_slide'
  let currentEditingPromoId = null;
  let currentEditingSponsorId = null;
  let currentEditingSponsorMobileOnly = false;
  let currentPromoImages = [];
  let currentSponsorAdImages = [];
  let currentCarouselSlides = [];
  let currentInternalProductIds = [];
  let currentPromotions = [];
  let currentSponsors = [];
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
          <span class="text-[11px] text-slate-400 mt-1 block">Format didukung: JPG, PNG, WEBP (Otomatis dikompres &amp; dioptimasi)</span>
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

    const processFiles = async (files) => {
      if (!files || files.length === 0) return;
      const fileArr = Array.from(files).filter(f => f.type && f.type.startsWith('image/'));
      if (fileArr.length === 0) return;

      const compressFn = window.autoCompressImage || (typeof DB !== 'undefined' && DB.autoCompressImage);

      for (const file of fileArr) {
        try {
          const result = compressFn ? await compressFn(file, 1200, 1200, 0.8) : await new Promise(res => {
            const r = new FileReader();
            r.onload = ev => res(ev.target.result);
            r.readAsDataURL(file);
          });

          if (!isMulti) {
            images = [result];
            break;
          } else {
            if (images.length < 10) images.push(result);
          }
        } catch (err) {
          console.error('[PromoManager] Gagal mengompres gambar:', err);
        }
      }

      renderThumbs();
      if (onChange) onChange(images);
      if (fileInput) fileInput.value = '';
      if (typeof window.App !== 'undefined' && window.App.showToast) {
        window.App.showToast('Gambar berhasil dioptimasi & ditambahkan.', 'success');
      }
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
    const isDoubleWidth = activeSponsorType === 'double_width';
    const maxLimit = isDoubleWidth ? 10 : 5;
    const allProducts = (typeof DB !== 'undefined' && DB.getAllProducts) ? DB.getAllProducts().filter(p => p.is_active !== false) : ((typeof DB !== 'undefined' && DB.getProducts) ? DB.getProducts().filter(p => p.is_active !== false) : []);

    if (!slides || slides.length === 0) {
      container.innerHTML = `<div class="p-3 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">Belum ada slide gambar. Silakan unggah berkas di atas atau tempel URL slide baru (maksimal ${maxLimit} foto).</div>`;
      return;
    }
    const safeSlides = slides.slice(0, maxLimit);
    container.innerHTML = safeSlides.map((slide, idx) => `
      <div class="carousel-slide-item p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3" data-index="${idx}">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-lg text-[10px] font-black bg-slate-200 text-slate-800">Slide #${idx + 1}</span>
            ${isDoubleWidth ? `<span class="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded font-semibold">2-Kolom Slide</span>` : ''}
            ${activeSponsorOwnerType === 'self' ? `<span class="text-[10px] text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-1.5 py-0.2 rounded font-bold"><i class="bi bi-shop"></i> Produk Sendiri</span>` : ''}
            ${(activeSponsorOwnerType === 'third_party' && activeContractModel === 'per_slide') ? `<span class="text-[10px] text-purple-800 bg-purple-100 border border-purple-200 px-1.5 py-0.2 rounded font-semibold">Slot Eceran</span>` : ''}
          </div>
          <div class="flex items-center gap-1">
            <button type="button" class="btn-move-slide-up p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded transition cursor-pointer ${idx === 0 ? 'opacity-30 pointer-events-none' : ''}" data-index="${idx}" title="Geser Urutan ke Atas">
              <i data-lucide="arrow-up" class="w-3.5 h-3.5"></i>
            </button>
            <button type="button" class="btn-move-slide-down p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded transition cursor-pointer ${idx === safeSlides.length - 1 ? 'opacity-30 pointer-events-none' : ''}" data-index="${idx}" title="Geser Urutan ke Bawah">
              <i data-lucide="arrow-down" class="w-3.5 h-3.5"></i>
            </button>
            <button type="button" class="btn-remove-carousel-slide text-rose-500 hover:text-rose-700 p-1 text-xs font-bold transition flex items-center gap-1 cursor-pointer ml-1" data-index="${idx}" title="Hapus Slide">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              <span>Hapus</span>
            </button>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 items-start">
          <div class="shrink-0 w-16 h-16 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <img src="${escapeHtml(slide.image_url || '')}" class="w-full h-full object-cover" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-sm\\'><i class=\\'bi bi-images\\'></i></div>';" />
          </div>
          <div class="flex-1 w-full min-w-0 space-y-2">
            <!-- FITUR TOKO SENDIRI: TAUTKAN KE PRODUK KATALOG TOKO -->
            ${activeSponsorOwnerType === 'self' ? `
              <div class="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="block text-[10px] font-bold text-emerald-900">
                    <i class="bi bi-link-45deg text-emerald-600"></i> Tautkan Produk Toko (Buka PDP saat Diklik):
                  </label>
                  <button type="button" class="btn-apply-linked-product text-[10px] font-bold text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-lg transition shadow-2xs cursor-pointer" data-index="${idx}">
                    Terapkan Foto & Link Produk
                  </button>
                </div>
                <select class="slide-linked-product-select w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white outline-none focus:border-emerald-500" data-index="${idx}">
                  <option value="">-- Pilih Produk dari Katalog Toko --</option>
                  ${allProducts.map(p => `
                    <option value="${p.id}" ${slide.linked_product_id === String(p.id) ? 'selected' : ''}>
                      ${escapeHtml(p.name)} (Rp ${Math.round(p.price || p.starting_price || 0).toLocaleString('id-ID')})
                    </option>
                  `).join('')}
                </select>
              </div>
            ` : ''}

            <!-- FITUR PIHAK KETIGA: DETAIL KONTRAK PER-SLIDE -->
            ${(activeSponsorOwnerType === 'third_party' && activeContractModel === 'per_slide') ? `
              <div class="p-2.5 bg-indigo-50/80 border border-indigo-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-bold text-indigo-900 mb-0.5">Nama Pemasang Iklan Slide #${idx + 1}:</label>
                  <input type="text" value="${escapeHtml(slide.advertiser_name || '')}" placeholder="Contoh: Toko Mitra Prima" class="slide-advertiser-name w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold outline-none focus:border-indigo-500 bg-white" data-index="${idx}" />
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-indigo-900 mb-0.5">Nilai Kontrak Slide #${idx + 1} (Rp):</label>
                  <input type="number" value="${slide.contract_price || slide.price || 0}" placeholder="Contoh: 250000" class="slide-contract-price w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-mono font-bold outline-none focus:border-indigo-500 bg-white" data-index="${idx}" />
                </div>
              </div>
            ` : ''}

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-[10px] font-bold text-slate-700">URL / Berkas Gambar (Tampilan):</label>
                  <label class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer" title="Unggah file foto gambar (Auto-Compress)">
                    <i data-lucide="upload" class="w-3 h-3"></i>
                    <span>Upload Foto</span>
                    <input type="file" accept="image/*" class="slide-file-upload-input hidden" data-index="${idx}" />
                  </label>
                </div>
                <input type="text" value="${escapeHtml(slide.image_url || '')}" placeholder="https://.../gambar.webp atau klik Upload Foto" class="slide-image-url w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-[11px] outline-none focus:border-emerald-500 bg-white" />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-700 mb-1">Link Target Tujuan (Saat Gambar Diklik):</label>
                <input type="text" value="${escapeHtml(slide.target_url || '')}" placeholder="https://wa.me/... atau link produk / halaman luar" class="slide-target-url w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-[11px] font-mono outline-none focus:border-emerald-500 bg-white" />
              </div>
            </div>

            ${isDoubleWidth ? `
              <!-- FITUR KHUSUS 2-KOLOM: LINK KLIK GAMBAR & FLOATING CTA MANDIRI -->
              <div class="pt-2 border-t border-slate-200/80 space-y-2.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <label class="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                    <input type="checkbox" class="slide-click-img-chk w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" ${slide.click_image_enabled !== false ? 'checked' : ''} />
                    <span>Link Klik Gambar Banner Aktif</span>
                  </label>
                  <label class="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-emerald-800 bg-emerald-50/90 px-2.5 py-1 rounded-xl border border-emerald-200 select-none">
                    <input type="checkbox" class="slide-cta-enabled-chk w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" ${slide.cta_enabled ? 'checked' : ''} />
                    <span>Tombol CTA Melayang (Floating CTA)</span>
                  </label>
                </div>

                <div class="slide-cta-box ${slide.cta_enabled ? '' : 'hidden'} p-3 bg-white border border-emerald-300 rounded-xl space-y-2.5 shadow-2xs">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[10px] font-bold text-slate-700 mb-0.5">Teks Tombol CTA Melayang:</label>
                      <input type="text" value="${escapeHtml(slide.cta_text || 'Lihat Penawaran')}" placeholder="Contoh: Dapatkan Promo" class="slide-cta-text w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-bold outline-none focus:border-emerald-500 bg-white" />
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-700 mb-0.5">Link Khusus Tombol CTA:</label>
                      <input type="text" value="${escapeHtml(slide.cta_link || '')}" placeholder="Kosongkan jika sama dengan target gambar" class="slide-cta-link w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-mono outline-none focus:border-emerald-500 bg-white" />
                    </div>
                  </div>

                  <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <label class="block text-[10px] font-bold text-slate-700 mb-0.5">Warna Tombol (Bg):</label>
                      <div class="flex items-center gap-1">
                        <input type="color" value="${slide.cta_bg_color || '#059669'}" class="slide-cta-bg-picker w-7 h-7 p-0.5 rounded border border-slate-300 cursor-pointer bg-white" />
                        <input type="text" value="${escapeHtml(slide.cta_bg_color || '#059669')}" class="slide-cta-bg-input w-full px-1.5 py-1 rounded border border-slate-300 text-[10px] font-mono font-bold uppercase" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-700 mb-0.5">Warna Teks:</label>
                      <div class="flex items-center gap-1">
                        <input type="color" value="${slide.cta_text_color || '#ffffff'}" class="slide-cta-textcol-picker w-7 h-7 p-0.5 rounded border border-slate-300 cursor-pointer bg-white" />
                        <input type="text" value="${escapeHtml(slide.cta_text_color || '#ffffff')}" class="slide-cta-textcol-input w-full px-1.5 py-1 rounded border border-slate-300 text-[10px] font-mono font-bold uppercase" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-700 mb-0.5">Ikon CTA:</label>
                      <select class="slide-cta-icon-select w-full px-2 py-1 rounded-lg border border-slate-300 text-xs bg-white font-semibold outline-none focus:border-emerald-500">
                        <option value="bi-arrow-right" ${(slide.cta_icon || 'bi-arrow-right') === 'bi-arrow-right' ? 'selected' : ''}>Panah Kanan (bi-arrow-right)</option>
                        <option value="bi-whatsapp" ${slide.cta_icon === 'bi-whatsapp' ? 'selected' : ''}>WhatsApp (bi-whatsapp)</option>
                        <option value="bi-bag-check" ${slide.cta_icon === 'bi-bag-check' ? 'selected' : ''}>Keranjang Cek (bi-bag-check)</option>
                        <option value="bi-cart-fill" ${slide.cta_icon === 'bi-cart-fill' ? 'selected' : ''}>Keranjang Belanja (bi-cart-fill)</option>
                        <option value="bi-box-arrow-up-right" ${slide.cta_icon === 'bi-box-arrow-up-right' ? 'selected' : ''}>Link Eksternal (bi-box-arrow-up-right)</option>
                        <option value="bi-gift-fill" ${slide.cta_icon === 'bi-gift-fill' ? 'selected' : ''}>Hadiah Promo (bi-gift-fill)</option>
                        <option value="bi-stars" ${slide.cta_icon === 'bi-stars' ? 'selected' : ''}>Bintang Spesial (bi-stars)</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-700 mb-0.5">Sudut (Radius):</label>
                      <select class="slide-cta-radius-select w-full px-2 py-1 rounded-lg border border-slate-300 text-xs bg-white font-semibold outline-none focus:border-emerald-500">
                        <option value="8px" ${slide.cta_border_radius === '8px' ? 'selected' : ''}>8px (Kecil)</option>
                        <option value="12px" ${(slide.cta_border_radius === '12px' || !slide.cta_border_radius) ? 'selected' : ''}>12px (Standar)</option>
                        <option value="9999px" ${slide.cta_border_radius === '9999px' ? 'selected' : ''}>Pill (Kapsul)</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-slate-700 mb-0.5">Bayangan (Shadow):</label>
                      <select class="slide-cta-shadow-select w-full px-2 py-1 rounded-lg border border-slate-300 text-xs bg-white font-semibold outline-none focus:border-emerald-500">
                        <option value="none" ${slide.cta_shadow === 'none' ? 'selected' : ''}>Tanpa Shadow (none)</option>
                        <option value="sm" ${slide.cta_shadow === 'sm' ? 'selected' : ''}>Halus (sm)</option>
                        <option value="md" ${(slide.cta_shadow === 'md' || !slide.cta_shadow) ? 'selected' : ''}>Sedang (md)</option>
                        <option value="lg" ${slide.cta_shadow === 'lg' ? 'selected' : ''}>Tegas (lg)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ` : ''}
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
        const badge = document.getElementById('carousel-slide-counter-badge');
        if (badge) badge.textContent = `${currentCarouselSlides.length} / ${maxLimit} Slide`;
        updateSponsorPreviews();
      });
    });

    container.querySelectorAll('.btn-move-slide-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        if (idx > 0 && currentCarouselSlides[idx]) {
          const temp = currentCarouselSlides[idx];
          currentCarouselSlides[idx] = currentCarouselSlides[idx - 1];
          currentCarouselSlides[idx - 1] = temp;
          renderCarouselSlideRows(currentCarouselSlides);
          updateSponsorPreviews();
        }
      });
    });

    container.querySelectorAll('.btn-move-slide-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        if (idx < currentCarouselSlides.length - 1 && currentCarouselSlides[idx]) {
          const temp = currentCarouselSlides[idx];
          currentCarouselSlides[idx] = currentCarouselSlides[idx + 1];
          currentCarouselSlides[idx + 1] = temp;
          renderCarouselSlideRows(currentCarouselSlides);
          updateSponsorPreviews();
        }
      });
    });

    // Linked product actions for self store
    container.querySelectorAll('.btn-apply-linked-product').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        const row = btn.closest('.carousel-slide-item');
        const sel = row ? row.querySelector('.slide-linked-product-select') : null;
        const prodId = sel ? sel.value : (currentCarouselSlides[idx]?.linked_product_id);
        if (!prodId) {
          const toastFn = window.AdminApp?.showToast || window.App?.showToast || alert;
          toastFn('Pilih produk dari dropdown katalog toko terlebih dahulu.', 'warning');
          return;
        }
        const prod = allProducts.find(p => String(p.id) === String(prodId));
        if (prod && currentCarouselSlides[idx]) {
          currentCarouselSlides[idx].linked_product_id = String(prod.id);
          const pImg = (Array.isArray(prod.images) && prod.images.length > 0) ? prod.images[0] : (prod.image_url || '');
          if (pImg) currentCarouselSlides[idx].image_url = pImg;
          currentCarouselSlides[idx].target_url = `product.html?id=${prod.id}`;
          currentCarouselSlides[idx].cta_text = 'Beli Produk Ini';
          currentCarouselSlides[idx].cta_link = `product.html?id=${prod.id}`;
          currentCarouselSlides[idx].cta_enabled = true;
          renderCarouselSlideRows(currentCarouselSlides);
          updateSponsorPreviews();
        }
      });
    });

    container.querySelectorAll('.slide-linked-product-select').forEach(sel => {
      sel.addEventListener('change', () => {
        const idx = parseInt(sel.getAttribute('data-index'), 10);
        if (currentCarouselSlides[idx]) {
          currentCarouselSlides[idx].linked_product_id = sel.value;
          if (sel.value) {
            currentCarouselSlides[idx].target_url = `product.html?id=${sel.value}`;
            currentCarouselSlides[idx].cta_link = `product.html?id=${sel.value}`;
          }
          updateSponsorPreviews();
        }
      });
    });

    // Per-slide advertiser & contract price
    container.querySelectorAll('.slide-advertiser-name').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx = parseInt(inp.getAttribute('data-index'), 10);
        if (currentCarouselSlides[idx]) {
          currentCarouselSlides[idx].advertiser_name = inp.value.trim();
        }
      });
    });

    container.querySelectorAll('.slide-contract-price').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx = parseInt(inp.getAttribute('data-index'), 10);
        const val = parseFloat(inp.value) || 0;
        if (currentCarouselSlides[idx]) {
          currentCarouselSlides[idx].contract_price = val;
          currentCarouselSlides[idx].price = val;
        }
        const priceInput = document.getElementById('sponsor-price-input');
        if (priceInput && activeContractModel === 'per_slide') {
          const sum = currentCarouselSlides.reduce((acc, s) => acc + (parseFloat(s.contract_price || s.price) || 0), 0);
          priceInput.value = sum;
        }
      });
    });

    container.querySelectorAll('.slide-file-upload-input').forEach(fileInp => {
      fileInp.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        try {
          const compressFn = window.autoCompressImage || (typeof DB !== 'undefined' && DB.autoCompressImage);
          const base64 = compressFn ? await compressFn(file, 1200, 1200, 0.8) : await new Promise(res => {
            const r = new FileReader();
            r.onload = ev => res(ev.target.result);
            r.readAsDataURL(file);
          });

          const idx = parseInt(fileInp.getAttribute('data-index'), 10);
          if (currentCarouselSlides[idx]) {
            currentCarouselSlides[idx].image_url = base64;
            const row = fileInp.closest('.carousel-slide-item');
            if (row) {
              const urlInp = row.querySelector('.slide-image-url');
              if (urlInp) urlInp.value = base64;
              const imgEl = row.querySelector('img');
              if (imgEl) imgEl.src = base64;
            }
            updateSponsorPreviews();
          }
          const toastFn = window.AdminApp?.showToast || window.App?.showToast;
          if (toastFn) toastFn('Slide berhasil dioptimasi & diperbarui.', 'success');
        } catch (err) {
          console.error('[PromoManager] Gagal mengompres slide:', err);
        } finally {
          fileInp.value = '';
        }
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
          updateSponsorPreviews();
        }
      });
    });

    if (isDoubleWidth) {
      container.querySelectorAll('.slide-click-img-chk').forEach(chk => {
        chk.addEventListener('change', () => {
          const row = chk.closest('.carousel-slide-item');
          const idx = parseInt(row.getAttribute('data-index'), 10);
          if (currentCarouselSlides[idx]) {
            currentCarouselSlides[idx].click_image_enabled = chk.checked;
            updateSponsorPreviews();
          }
        });
      });
      container.querySelectorAll('.slide-cta-enabled-chk').forEach(chk => {
        chk.addEventListener('change', () => {
          const row = chk.closest('.carousel-slide-item');
          const idx = parseInt(row.getAttribute('data-index'), 10);
          if (currentCarouselSlides[idx]) {
            currentCarouselSlides[idx].cta_enabled = chk.checked;
            const ctaBox = row.querySelector('.slide-cta-box');
            if (ctaBox) {
              if (chk.checked) ctaBox.classList.remove('hidden');
              else ctaBox.classList.add('hidden');
            }
            updateSponsorPreviews();
          }
        });
      });
      container.querySelectorAll('.slide-cta-text').forEach(inp => {
        inp.addEventListener('input', () => {
          const row = inp.closest('.carousel-slide-item');
          const idx = parseInt(row.getAttribute('data-index'), 10);
          if (currentCarouselSlides[idx]) {
            currentCarouselSlides[idx].cta_text = inp.value.trim();
            updateSponsorPreviews();
          }
        });
      });
      container.querySelectorAll('.slide-cta-link').forEach(inp => {
        inp.addEventListener('input', () => {
          const row = inp.closest('.carousel-slide-item');
          const idx = parseInt(row.getAttribute('data-index'), 10);
          if (currentCarouselSlides[idx]) {
            currentCarouselSlides[idx].cta_link = inp.value.trim();
            updateSponsorPreviews();
          }
        });
      });
      container.querySelectorAll('.slide-cta-bg-picker').forEach(picker => {
        picker.addEventListener('input', () => {
          const row = picker.closest('.carousel-slide-item');
          const idx = parseInt(row.getAttribute('data-index'), 10);
          const textInput = row.querySelector('.slide-cta-bg-input');
          if (textInput) textInput.value = picker.value;
          if (currentCarouselSlides[idx]) {
            currentCarouselSlides[idx].cta_bg_color = picker.value;
            updateSponsorPreviews();
          }
        });
      });
      container.querySelectorAll('.slide-cta-bg-input').forEach(textInput => {
        textInput.addEventListener('input', () => {
          const row = textInput.closest('.carousel-slide-item');
          const idx = parseInt(row.getAttribute('data-index'), 10);
          const picker = row.querySelector('.slide-cta-bg-picker');
          if (picker && textInput.value.startsWith('#') && (textInput.value.length === 4 || textInput.value.length === 7)) {
            picker.value = textInput.value;
          }
          if (currentCarouselSlides[idx]) {
            currentCarouselSlides[idx].cta_bg_color = textInput.value.trim();
            updateSponsorPreviews();
          }
        });
      });
      container.querySelectorAll('.slide-cta-textcol-picker').forEach(picker => {
        picker.addEventListener('input', () => {
          const row = picker.closest('.carousel-slide-item');
          const idx = parseInt(row.getAttribute('data-index'), 10);
          const textInput = row.querySelector('.slide-cta-textcol-input');
          if (textInput) textInput.value = picker.value;
          if (currentCarouselSlides[idx]) {
            currentCarouselSlides[idx].cta_text_color = picker.value;
            updateSponsorPreviews();
          }
        });
      });
      container.querySelectorAll('.slide-cta-textcol-input').forEach(textInput => {
        textInput.addEventListener('input', () => {
          const row = textInput.closest('.carousel-slide-item');
          const idx = parseInt(row.getAttribute('data-index'), 10);
          const picker = row.querySelector('.slide-cta-textcol-picker');
          if (picker && textInput.value.startsWith('#') && (textInput.value.length === 4 || textInput.value.length === 7)) {
            picker.value = textInput.value;
          }
          if (currentCarouselSlides[idx]) {
            currentCarouselSlides[idx].cta_text_color = textInput.value.trim();
            updateSponsorPreviews();
          }
        });
      });
      container.querySelectorAll('.slide-cta-icon-select').forEach(sel => {
        sel.addEventListener('change', () => {
          const row = sel.closest('.carousel-slide-item');
          const idx = parseInt(row.getAttribute('data-index'), 10);
          if (currentCarouselSlides[idx]) {
            currentCarouselSlides[idx].cta_icon = sel.value;
            updateSponsorPreviews();
          }
        });
      });
      container.querySelectorAll('.slide-cta-radius-select').forEach(sel => {
        sel.addEventListener('change', () => {
          const row = sel.closest('.carousel-slide-item');
          const idx = parseInt(row.getAttribute('data-index'), 10);
          if (currentCarouselSlides[idx]) {
            currentCarouselSlides[idx].cta_border_radius = sel.value;
            updateSponsorPreviews();
          }
        });
      });
      container.querySelectorAll('.slide-cta-shadow-select').forEach(sel => {
        sel.addEventListener('change', () => {
          const row = sel.closest('.carousel-slide-item');
          const idx = parseInt(row.getAttribute('data-index'), 10);
          if (currentCarouselSlides[idx]) {
            currentCarouselSlides[idx].cta_shadow = sel.value;
            updateSponsorPreviews();
          }
        });
      });
    }
  }

  function init(initialTab = null) {
    currentPromotions = (typeof DB !== 'undefined' && DB.getPromotions) ? DB.getPromotions() : [];
    currentSponsors = (typeof DB !== 'undefined' && DB.getSponsors) ? DB.getSponsors() : [];

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

    currentPromotions = (typeof DB !== 'undefined' && DB.getPromotions) ? DB.getPromotions() : [];
    currentSponsors = (typeof DB !== 'undefined' && DB.getSponsors) ? DB.getSponsors() : [];

    const promos = DB.getPromos();
    const vouchers = DB.getVouchers();
    const categories = DB.getCategories();
    const products = DB.getAllProducts();

    // Hitung akurat kartu promo dan sponsor yang benar-benar aktif (DB.isPromoActive / DB.isSponsorActive)
    const promoListAll = (Array.isArray(promos.promo_list) && promos.promo_list.length > 0)
      ? promos.promo_list
      : (Array.isArray(currentPromotions) ? currentPromotions : []);
    const activePromoCount = promoListAll.filter(p => {
      if (typeof DB !== 'undefined' && typeof DB.isPromoActive === 'function') {
        return DB.isPromoActive(p) && p.active !== false;
      }
      return p.active !== false && p.is_active !== false;
    }).length;

    const sponsorListAll = Array.isArray(promos.sponsor_list) ? promos.sponsor_list : (Array.isArray(currentSponsors) ? currentSponsors : []);
    const activeSponsorCount = sponsorListAll.filter(s => {
      if (typeof DB !== 'undefined' && typeof DB.isSponsorActive === 'function') {
        return DB.isSponsorActive(s) && s.active !== false;
      }
      return s.active !== false && s.is_active !== false;
    }).length;

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
              ${activePromoCount} Aktif
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
              ${activeSponsorCount} Slot Aktif
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
    const promoList = (Array.isArray(promos.promo_list) && promos.promo_list.length > 0)
      ? promos.promo_list
      : (Array.isArray(currentPromotions) ? currentPromotions : []);

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
        style: {
          bg_type: 'solid',
          bg_color1: '#ffffff',
          bg_color2: '#f8fafc',
          bg_angle: 135,
          title_color: '#0f172a',
          desc_color: '#64748b',
          discount_color: '#e11d48',
          border_radius: '16px',
          box_shadow: 'sm',
          border_color: 'transparent'
        },
        title_color: '#0f172a',
        desc_color: '#64748b',
        discount_color: '#e11d48',
        bg_type: 'solid',
        bg_color1: '#ffffff',
        bg_color2: '#f8fafc',
        bg_angle: 135,
        border_radius: '16px',
        box_shadow: 'sm',
        show_timer: true,
        cta_mode: 'dual',
        cta1_text: 'Ingatkan Saya',
        cta1_link: '',
        cta1_bg: '#33b589',
        cta1_text_color: '#ffffff',
        cta1_icon_color: '#ffffff',
        cta2_text: 'Konsultasi Desain & Cetak',
        cta2_link: '',
        cta2_bg: '#25d366',
        cta2_text_color: '#ffffff',
        cta2_icon_color: '#ffffff',
        use_theme_default: true,
        active: true,
        image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80'
      };
    } else if (activePromoId) {
      current = promoList.find(p => String(p.id) === String(activePromoId));
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
        style: {
          bg_type: 'solid',
          bg_color1: '#ffffff',
          bg_color2: '#f8fafc',
          bg_angle: 135,
          title_color: '#0f172a',
          desc_color: '#64748b',
          discount_color: '#e11d48',
          border_radius: '16px',
          box_shadow: 'sm',
          border_color: 'transparent'
        },
        title_color: '#0f172a',
        desc_color: '#64748b',
        discount_color: '#e11d48',
        bg_type: 'solid',
        bg_color1: '#ffffff',
        bg_color2: '#f8fafc',
        bg_angle: 135,
        border_radius: '16px',
        box_shadow: 'sm',
        show_timer: true,
        cta_mode: 'dual',
        cta1_text: 'Ingatkan Saya',
        cta1_link: '',
        cta1_bg: '#33b589',
        cta1_text_color: '#ffffff',
        cta1_icon_color: '#ffffff',
        cta2_text: 'Konsultasi Desain & Cetak',
        cta2_link: '',
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

    // Helper styling extracted from current & current.style
    const curStyle = current.style || {};
    const curTitleColor = curStyle.title_color || current.title_color || '#0f172a';
    const curDescColor = curStyle.desc_color || current.desc_color || '#64748b';
    const curDiscountColor = curStyle.discount_color || current.discount_color || '#e11d48';
    const curBgType = curStyle.bg_type || current.bg_type || 'solid';
    const curBgColor1 = curStyle.bg_color1 || current.bg_color1 || '#ffffff';
    const curBgColor2 = curStyle.bg_color2 || current.bg_color2 || '#f8fafc';
    const curBgAngle = curStyle.bg_angle !== undefined ? curStyle.bg_angle : (current.bg_angle !== undefined ? current.bg_angle : 135);
    const curBorderRadius = curStyle.border_radius || current.border_radius || '16px';
    const curBoxShadow = curStyle.box_shadow || current.box_shadow || 'sm';
    const curShowTimer = (current.show_timer !== false);
    const curCtaMode = (current.cta_mode === 'single' || current.cta_mode === '1_cta' || current.cta_mode === 'catalog_only' || current.cta_mode === 'consultation_only') ? 'single' : 'dual';
    const curCta1Text = current.cta1_text || 'Ingatkan Saya';
    const curCta1Link = current.cta1_link || '';
    const curCta2Text = current.cta2_text || 'Konsultasi Desain & Cetak';
    const curCta2Link = current.cta2_link || '';

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
                  <th class="p-3.5 text-center">Kuota Tampil</th>
                  <th class="p-3.5 text-center">Status</th>
                  <th class="p-3.5 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${promoList.length === 0 ? `
                  <tr>
                    <td colspan="8" class="p-8 text-center text-slate-400">
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
                      <td class="p-3.5 text-center" onclick="event.stopPropagation()">
                        <div class="flex items-center justify-center gap-1">
                          <input type="number" min="1" max="99" value="${p.display_quota || 1}" class="input-promo-quota w-12 px-1.5 py-1 text-center font-bold text-xs rounded-lg border border-slate-300 bg-white outline-none focus:border-emerald-500" data-id="${p.id}" title="Frekuensi kuota kartu promo tampil di etalase pembeli" />
                          <span class="text-[10px] text-slate-400 font-bold">x</span>
                        </div>
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
              <div class="flex items-center gap-3 flex-wrap">
                <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <label for="promo-display-quota-input" class="text-xs font-bold text-slate-700 whitespace-nowrap">Kuota Tampil:</label>
                  <input type="number" id="promo-display-quota-input" min="1" max="99" value="${current.display_quota || 1}" class="w-12 px-1.5 py-0.5 text-center font-bold text-xs rounded-lg border border-slate-300 bg-white outline-none focus:border-emerald-500" title="Berapa kali promo ini ditampilkan di etalase pembeli" />
                  <span class="text-[10px] text-slate-400 font-bold">x</span>
                </div>
                <div class="flex items-center gap-2">
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="promo-active-toggle" ${current.active ? 'checked' : ''} class="sr-only peer" />
                    <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                  <span id="label-promo-active" class="text-xs font-bold ${current.active ? 'text-emerald-700' : 'text-slate-400'}">
                    ${current.active ? 'Program Aktif' : 'Nonaktif'}
                  </span>
                </div>
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
                <label class="block font-bold text-slate-700 text-xs">Gambar Banner Promo Varian 1 (Auto-Compress):</label>
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
                <h4 class="font-bold text-xs sm:text-sm text-slate-900">Langkah 5 - Kustomisasi Desain Card Promo, CTA & Countdown:</h4>
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
                  <p class="text-[10px] text-slate-400 mt-1">*Sesuai matriks tampilan: Deskripsi otomatis tampil saat mode 1 CTA aktif, dan disembunyikan saat mode 2 CTA aktif agar ukuran kartu tetap rapi.</p>
                </div>
              </div>

              <!-- Kontrol Warna Teks & Latar Belakang Gradasi Mandiri -->
              <div class="pt-2 border-t border-slate-200 space-y-3 text-xs">
                <span class="font-bold text-slate-800 block">Kustomisasi Styling Mandiri (Tersimpan Khusus pada Kartu Ini):</span>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600 mb-1">Warna Judul Headline:</label>
                    <div class="flex items-center gap-2">
                      <input type="color" id="promo-title-color" value="${curTitleColor}" class="w-9 h-9 p-0.5 rounded-xl border border-slate-300 cursor-pointer bg-white" />
                      <input type="text" id="promo-title-color-text" value="${curTitleColor}" class="w-20 px-2 py-1.5 rounded-xl border border-slate-300 font-mono text-xs uppercase" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600 mb-1">Warna Teks Deskripsi:</label>
                    <div class="flex items-center gap-2">
                      <input type="color" id="promo-desc-color" value="${curDescColor}" class="w-9 h-9 p-0.5 rounded-xl border border-slate-300 cursor-pointer bg-white" />
                      <input type="text" id="promo-desc-color-text" value="${curDescColor}" class="w-20 px-2 py-1.5 rounded-xl border border-slate-300 font-mono text-xs uppercase" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600 mb-1">Warna Diskon / Aksen:</label>
                    <div class="flex items-center gap-2">
                      <input type="color" id="promo-discount-color" value="${curDiscountColor}" class="w-9 h-9 p-0.5 rounded-xl border border-slate-300 cursor-pointer bg-white" />
                      <input type="text" id="promo-discount-color-text" value="${curDiscountColor}" class="w-20 px-2 py-1.5 rounded-xl border border-slate-300 font-mono text-xs uppercase" />
                    </div>
                  </div>
                </div>

                <!-- Tipe Latar, Gradasi, Border Radius & Box Shadow -->
                <div class="space-y-3 pt-2">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-[11px] font-semibold text-slate-600 mb-1">Tipe Latar Kartu:</label>
                      <select id="promo-bg-type" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white text-xs">
                        <option value="solid" ${curBgType === 'solid' ? 'selected' : ''}>Warna Solid</option>
                        <option value="linear_gradient" ${curBgType === 'linear_gradient' ? 'selected' : ''}>Linier Gradient</option>
                        <option value="radial_gradient" ${curBgType === 'radial_gradient' ? 'selected' : ''}>Radial Gradient</option>
                      </select>
                    </div>
                    <div id="promo-bg-angle-box" class="${curBgType === 'linear_gradient' ? 'block' : 'hidden'}">
                      <label class="block text-[11px] font-semibold text-slate-600 mb-1">Sudut Gradasi (0° - 360°):</label>
                      <div class="flex items-center gap-2">
                        <input type="range" id="promo-bg-angle" min="0" max="360" value="${curBgAngle}" class="flex-1 accent-emerald-600" />
                        <span id="promo-bg-angle-val" class="font-mono text-xs font-bold text-slate-700 w-10 text-right">${curBgAngle}°</span>
                      </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-[10px] text-slate-500 mb-1">Warna Latar 1 (Utama):</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="promo-bg-color1" value="${curBgColor1}" class="w-9 h-9 p-0.5 rounded-xl border border-slate-300 cursor-pointer bg-white" />
                        <input type="text" id="promo-bg-color1-text" value="${curBgColor1}" class="w-24 px-2 py-1.5 rounded-xl border border-slate-300 font-mono text-xs uppercase" />
                      </div>
                    </div>
                    <div id="promo-bg-color2-box" class="${curBgType !== 'solid' ? 'block' : 'hidden'}">
                      <label class="block text-[10px] text-slate-500 mb-1">Warna Latar 2 (Gradasi):</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="promo-bg-color2" value="${curBgColor2}" class="w-9 h-9 p-0.5 rounded-xl border border-slate-300 cursor-pointer bg-white" />
                        <input type="text" id="promo-bg-color2-text" value="${curBgColor2}" class="w-24 px-2 py-1.5 rounded-xl border border-slate-300 font-mono text-xs uppercase" />
                      </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label class="block text-[11px] font-semibold text-slate-600 mb-1">Border Radius (px):</label>
                      <select id="promo-border-radius" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white text-xs">
                        <option value="0px" ${curBorderRadius === '0px' ? 'selected' : ''}>0px (Persegi Lancip)</option>
                        <option value="8px" ${curBorderRadius === '8px' ? 'selected' : ''}>8px (Sedikit Membulat)</option>
                        <option value="12px" ${curBorderRadius === '12px' ? 'selected' : ''}>12px (Membulat Halus)</option>
                        <option value="16px" ${curBorderRadius === '16px' ? 'selected' : ''}>16px (Modern Rounded - Default)</option>
                        <option value="24px" ${curBorderRadius === '24px' ? 'selected' : ''}>24px (Sangat Membulat)</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold text-slate-600 mb-1">Box Shadow:</label>
                      <select id="promo-box-shadow" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white text-xs">
                        <option value="none" ${curBoxShadow === 'none' ? 'selected' : ''}>Tanpa Bayangan (None)</option>
                        <option value="sm" ${curBoxShadow === 'sm' ? 'selected' : ''}>Bayangan Halus (sm - Default)</option>
                        <option value="md" ${curBoxShadow === 'md' ? 'selected' : ''}>Bayangan Sedang (md)</option>
                        <option value="lg" ${curBoxShadow === 'lg' ? 'selected' : ''}>Bayangan Mengambang (lg)</option>
                        <option value="xl" ${curBoxShadow === 'xl' ? 'selected' : ''}>Bayangan Ekstra (xl)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Pilihan Tampilan Timer Countdown (Dropdown Aktif / Nonaktif) -->
                <div class="pt-3 border-t border-slate-200 space-y-1.5">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label class="block font-bold text-slate-800 text-xs">Tampilan Jam Hitung Mundur (Countdown Timer):</label>
                      <span class="text-[10px] text-slate-400">Aktifkan jam hitung mundur waktu tersisa di kartu promo ini.</span>
                    </div>
                    <select id="promo-show-timer" class="px-3 py-1.5 rounded-xl border border-slate-300 font-bold bg-white text-xs outline-none focus:border-emerald-500 shrink-0">
                      <option value="true" ${curShowTimer ? 'selected' : ''}>Aktif</option>
                      <option value="false" ${!curShowTimer ? 'selected' : ''}>Nonaktif</option>
                    </select>
                  </div>
                  <p class="text-[10px] text-slate-400 italic">
                    *Otomasi Sinkronisasi: Jika Countdown Top Bar etalase sedang aktif, jam di kartu ini otomatis dimatikan untuk mencegah duplikasi di layar.
                  </p>
                </div>

                <!-- Konfigurasi Mode CTA & Tombol Fleksibel -->
                <div class="pt-3 border-t border-slate-200 space-y-3">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="font-bold text-slate-800 text-xs block">Pengaturan Tombol Aksi (CTA):</span>
                      <span class="text-[10px] text-slate-400">Pilih mode tombol tunggal (1 CTA) atau ganda (2 CTA) dengan link dinamis.</span>
                    </div>
                    <label class="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input type="checkbox" id="promo-cta-theme-default" ${current.use_theme_default ? 'checked' : ''} class="rounded text-emerald-600 focus:ring-emerald-500" />
                      <span class="font-bold text-slate-700 text-[11px]">Gunakan Warna Tema Default</span>
                    </label>
                  </div>

                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600 mb-1">Pilihan Mode CTA:</label>
                    <select id="promo-cta-mode" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white text-xs outline-none focus:border-emerald-500">
                      <option value="dual" ${curCtaMode === 'dual' ? 'selected' : ''}>2 CTA (Ingatkan Saya + WhatsApp)</option>
                      <option value="single" ${curCtaMode === 'single' ? 'selected' : ''}>1 CTA (Tanya Admin / Link)</option>
                    </select>
                  </div>

                  <!-- Kontrol Detail CTA (Teks, Link Dinamis & Warna) -->
                  <div class="space-y-3 pt-1">
                    <div class="p-3 bg-white rounded-xl border border-slate-200 space-y-2.5">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-slate-800 text-[11px]">Tombol 1: Primary CTA (Katalog / Ingatkan Saya)</span>
                        <span class="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Aktif pada 1 CTA & 2 CTA</span>
                      </div>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label class="block text-[10px] text-slate-500 mb-0.5">Label Teks Tombol 1:</label>
                          <input type="text" id="promo-cta1-text" value="${escapeHtml(curCta1Text)}" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs" placeholder="Contoh: Ingatkan Saya" />
                        </div>
                        <div>
                          <label class="block text-[10px] text-slate-500 mb-0.5">Link Dinamis Tombol 1:</label>
                          <input type="text" id="promo-cta1-link" value="${escapeHtml(curCta1Link)}" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono" placeholder="https://... atau kosongkan untuk modal" />
                        </div>
                      </div>
                      <div id="promo-cta1-color-box" class="${current.use_theme_default ? 'hidden' : 'grid'} grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <div>
                          <label class="block text-[10px] text-slate-500 mb-0.5">Warna Latar Tombol 1:</label>
                          <input type="color" id="promo-cta1-bg" value="${current.cta1_bg || '#33b589'}" class="w-full h-8 p-0.5 rounded-lg border border-slate-300 cursor-pointer" />
                        </div>
                        <div>
                          <label class="block text-[10px] text-slate-500 mb-0.5">Warna Teks Tombol 1:</label>
                          <input type="color" id="promo-cta1-text-color" value="${current.cta1_text_color || '#ffffff'}" class="w-full h-8 p-0.5 rounded-lg border border-slate-300 cursor-pointer" />
                        </div>
                      </div>
                    </div>

                    <div id="promo-cta2-wrapper" class="p-3 bg-white rounded-xl border border-slate-200 space-y-2.5 ${curCtaMode === 'single' ? 'opacity-50' : ''}">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-slate-800 text-[11px]">Tombol 2: Secondary CTA (WhatsApp / Hubungi Kami)</span>
                        <span id="promo-cta2-badge" class="text-[10px] font-semibold ${curCtaMode === 'single' ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'} px-2 py-0.5 rounded-full">
                          ${curCtaMode === 'single' ? 'Disembunyikan saat mode 1 CTA' : 'Aktif pada mode 2 CTA'}
                        </span>
                      </div>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label class="block text-[10px] text-slate-500 mb-0.5">Label Teks Tombol 2:</label>
                          <input type="text" id="promo-cta2-text" value="${escapeHtml(curCta2Text)}" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs" placeholder="Contoh: Konsultasi Desain & Cetak" />
                        </div>
                        <div>
                          <label class="block text-[10px] text-slate-500 mb-0.5">Link Dinamis Tombol 2:</label>
                          <input type="text" id="promo-cta2-link" value="${escapeHtml(curCta2Link)}" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono" placeholder="https://wa.me/... atau URL kustom" />
                        </div>
                      </div>
                      <div id="promo-cta2-color-box" class="${current.use_theme_default ? 'hidden' : 'grid'} grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <div>
                          <label class="block text-[10px] text-slate-500 mb-0.5">Warna Latar Tombol 2:</label>
                          <input type="color" id="promo-cta2-bg" value="${current.cta2_bg || '#25d366'}" class="w-full h-8 p-0.5 rounded-lg border border-slate-300 cursor-pointer" />
                        </div>
                        <div>
                          <label class="block text-[10px] text-slate-500 mb-0.5">Warna Teks Tombol 2:</label>
                          <input type="color" id="promo-cta2-text-color" value="${current.cta2_text_color || '#ffffff'}" class="w-full h-8 p-0.5 rounded-lg border border-slate-300 cursor-pointer" />
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
    const descColor = document.getElementById('promo-desc-color')?.value || '#64748b';
    const discColor = document.getElementById('promo-discount-color')?.value || '#e11d48';

    const bgType = document.getElementById('promo-bg-type')?.value || 'solid';
    const bgColor1 = document.getElementById('promo-bg-color1')?.value || '#ffffff';
    const bgColor2 = document.getElementById('promo-bg-color2')?.value || '#f8fafc';
    const bgAngle = parseInt(document.getElementById('promo-bg-angle')?.value) || 135;
    const borderRadius = document.getElementById('promo-border-radius')?.value || '16px';
    const boxShadow = document.getElementById('promo-box-shadow')?.value || 'sm';
    const boxShadowClass = (boxShadow && boxShadow !== 'none') ? `shadow-${boxShadow}` : 'shadow-none';

    let bgCss = `background-color: ${bgColor1};`;
    if (bgType === 'linear_gradient') {
      bgCss = `background: linear-gradient(${bgAngle}deg, ${bgColor1} 0%, ${bgColor2} 100%);`;
    } else if (bgType === 'radial_gradient') {
      bgCss = `background: radial-gradient(circle at center, ${bgColor1} 0%, ${bgColor2} 100%);`;
    }

    // 2. OTOMASI COUNTDOWN (TOP BAR VS CARD PROMO):
    // Jika Top Bar countdown aktif, paksa false pada card promo.
    const settings = (typeof DB !== 'undefined' && DB.getSettings) ? DB.getSettings() : {};
    const isTopBarCDActive = (settings.topbar_show_countdown !== false && settings.enable_promo_countdown !== false && settings.show_promo_countdown !== false);
    
    const timerSelect = document.getElementById('promo-show-timer');
    const individualShowTimer = timerSelect ? (timerSelect.value === 'true' || timerSelect.value === true) : true;
    const isCD = isTopBarCDActive ? false : individualShowTimer;

    // Mode CTA: 'dual' vs 'single'
    const ctaModeSelect = document.getElementById('promo-cta-mode');
    const ctaMode = ctaModeSelect ? ctaModeSelect.value : 'dual';
    const isDualCTA = (ctaMode === 'dual' || ctaMode === '2_cta');

    // Update status badge on CTA 2 in form
    const cta2Wrapper = document.getElementById('promo-cta2-wrapper');
    const cta2Badge = document.getElementById('promo-cta2-badge');
    if (cta2Wrapper && cta2Badge) {
      if (isDualCTA) {
        cta2Wrapper.classList.remove('opacity-50');
        cta2Badge.textContent = 'Aktif pada mode 2 CTA';
        cta2Badge.className = 'text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full';
      } else {
        cta2Wrapper.classList.add('opacity-50');
        cta2Badge.textContent = 'Disembunyikan saat mode 1 CTA';
        cta2Badge.className = 'text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full';
      }
    }

    // 3.A. MATRIKS VISIBILITAS DESKRIPSI:
    // Kondisi 1: CD = False & 2 CTA = True  --> Deskripsi = FALSE
    // Kondisi 2: CD = False & 1 CTA = True  --> Deskripsi = TRUE
    // Kondisi 3: CD = True  & 2 CTA = True  --> Deskripsi = FALSE
    // Kondisi 4: CD = True  & 1 CTA = True  --> Deskripsi = TRUE
    const showDescription = !isDualCTA;

    const useThemeDefault = document.getElementById('promo-cta-theme-default')?.checked ?? true;

    let cta1Bg = useThemeDefault ? (settings.hero_cta1_bg || settings.primary_color || '#33b589') : (document.getElementById('promo-cta1-bg')?.value || '#33b589');
    let cta1TextColor = useThemeDefault ? (settings.hero_cta1_text_color || '#ffffff') : (document.getElementById('promo-cta1-text-color')?.value || '#ffffff');
    let cta1Text = document.getElementById('promo-cta1-text')?.value.trim() || 'Ingatkan Saya';

    let cta2Bg = useThemeDefault ? (settings.hero_cta2_bg || '#25d366') : (document.getElementById('promo-cta2-bg')?.value || '#25d366');
    let cta2TextColor = useThemeDefault ? (settings.hero_cta2_text_color || '#ffffff') : (document.getElementById('promo-cta2-text-color')?.value || '#ffffff');
    let cta2Text = document.getElementById('promo-cta2-text')?.value.trim() || 'Konsultasi Desain & Cetak';

    const cta1Btn = `
      <div class="w-full py-1.5 sm:py-2 px-2.5 rounded-xl text-[10px] sm:text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-xs" style="background-color: ${cta1Bg}; color: ${cta1TextColor};">
        <i class="bi bi-bell-fill text-xs shrink-0 text-amber-300"></i>
        <span class="truncate">${escapeHtml(cta1Text)}</span>
      </div>
    `;

    const cta2Btn = `
      <div class="w-full py-1.5 sm:py-2 px-2.5 rounded-xl text-[10px] sm:text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-sm" style="background-color: ${cta2Bg}; color: ${cta2TextColor};">
        <i class="bi bi-whatsapp text-xs shrink-0"></i>
        <span class="truncate">${escapeHtml(cta2Text)}</span>
      </div>
    `;

    // 3.B. Pembersihan Garis & Struktur Kartu: TANPA border divider line
    let ctaContainerHtml = '';
    if (isDualCTA) {
      ctaContainerHtml = `<div class="mt-auto pt-2 flex flex-col gap-1.5">${cta1Btn}${cta2Btn}</div>`;
    } else {
      ctaContainerHtml = `<div class="mt-auto pt-2 flex flex-col gap-1.5">${cta1Btn}</div>`;
    }

    if (model === 'variant_1') {
      const imgContent = promoImg ? `
        <img src="${promoImg}" class="w-full h-full object-cover transition duration-500 group-hover:scale-105" alt="${escapeHtml(label)}" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2\\'><i class=\\'bi bi-images text-2xl\\'></i></div>';" />
      ` : `
        <div class="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2"><i class="bi bi-images text-2xl"></i></div>
      `;

      box.innerHTML = `
        <div class="h-full flex flex-col justify-between overflow-hidden border border-transparent ${boxShadowClass} transition-all duration-300 group relative bg-white" style="${bgCss} border-radius: ${borderRadius};">
          <!-- Area Atas: GAMBAR PROMO Rasio 3:4 Bleed to Edge -->
          <div class="relative w-full aspect-[3/4] overflow-hidden bg-slate-100 shrink-0 block">
            ${imgContent}
            
            <!-- Badge Diskon Melayang di Sudut Atas Kiri -->
            <span class="absolute top-2.5 left-2.5 text-white text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md uppercase tracking-wider z-10" style="background-color: ${discColor};">
              ${discText}
            </span>

            <!-- Badge Timer Melayang di Sudut Bawah Gambar (Jika Varian CD) -->
            ${isCD ? `
              <div class="absolute bottom-2.5 left-2.5 right-2.5 inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/75 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold shadow-md z-10">
                <i data-lucide="clock" class="w-3.5 h-3.5 text-emerald-400 shrink-0"></i>
                <span class="text-slate-300 font-medium hidden sm:inline">Berakhir Dalam:</span>
                <span class="font-mono text-emerald-300">23j : 59m : 59d</span>
              </div>
            ` : ''}
          </div>

          <!-- Area Bawah: Deskripsi (jika 1 CTA) + Tombol CTA Bersih Tanpa Divider Line -->
          <div class="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
            ${showDescription && desc ? `
              <p class="text-[11px] line-clamp-2 leading-relaxed mb-2" style="color: ${descColor};">
                ${escapeHtml(desc)}
              </p>
            ` : ''}
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
      if (isCD) {
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
            ${showDescription && desc ? `
              <p class="text-[10px] sm:text-[11px] line-clamp-2 mt-1 leading-relaxed" style="color: ${descColor};">
                ${escapeHtml(desc)}
              </p>
            ` : ''}
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
            ${showDescription && desc ? `
              <p class="text-[10px] sm:text-[11px] line-clamp-4 mt-2 leading-relaxed" style="color: ${descColor};">
                ${escapeHtml(desc)}
              </p>
            ` : ''}
          </div>
        `;
      }

      box.innerHTML = `
        <div class="h-full flex flex-col justify-between p-3.5 sm:p-4 overflow-hidden border border-transparent ${boxShadowClass} relative text-white group transition" style="${bgCss} border-radius: ${borderRadius};">
          <div class="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none"></div>
          <div class="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-amber-500/10 blur-xl pointer-events-none"></div>

          <div class="relative z-10 flex-1 flex flex-col justify-between">
            ${bodyContent}
          </div>

          <div class="relative z-10 mt-auto pt-2.5 flex flex-col gap-1.5">
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
  // =======================================================================  // Helper: Modal Validasi Bertingkat Pembuatan Sponsor Baru
  function showSponsorValidationModal({ type, title, message, productCount, onConfirm }) {
    const existing = document.getElementById('sponsor-validation-modal');
    if (existing) existing.remove();

    const isBlocked = type === 'blocked';
    const modalHtml = `
      <div id="sponsor-validation-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-center space-y-4">
          <div class="w-14 h-14 rounded-2xl ${isBlocked ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'} flex items-center justify-center mx-auto shadow-inner">
            <i data-lucide="${isBlocked ? 'alert-triangle' : 'info'}" class="w-7 h-7"></i>
          </div>
          <div>
            <h3 class="text-base font-extrabold text-slate-900">${escapeHtml(title)}</h3>
            <p class="text-xs text-slate-600 mt-2 leading-relaxed">${escapeHtml(message)}</p>
            <div class="mt-3 inline-block px-3 py-1 rounded-xl bg-slate-100 text-[11px] font-bold text-slate-700">
              Total Produk Aktif Saat Ini: <strong class="text-emerald-700">${productCount} Produk</strong>
            </div>
          </div>
          <div class="pt-3 border-t border-slate-100 flex items-center justify-center gap-3">
            ${isBlocked ? `
              <button type="button" id="btn-close-val-modal" class="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer">
                Mengerti & Tutup
              </button>
            ` : `
              <button type="button" id="btn-cancel-val-modal" class="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer">
                Batal
              </button>
              <button type="button" id="btn-proceed-val-modal" class="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer">
                Lanjutkan (Mobile Only)
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    if (window.lucide) window.lucide.createIcons();

    const modalEl = document.getElementById('sponsor-validation-modal');
    const closeBtn = document.getElementById('btn-close-val-modal');
    const cancelBtn = document.getElementById('btn-cancel-val-modal');
    const proceedBtn = document.getElementById('btn-proceed-val-modal');

    if (closeBtn) closeBtn.onclick = () => modalEl.remove();
    if (cancelBtn) cancelBtn.onclick = () => modalEl.remove();
    if (proceedBtn) {
      proceedBtn.onclick = () => {
        modalEl.remove();
        if (typeof onConfirm === 'function') onConfirm();
      };
    }
  }

  // ============================================================================
  // SUBMENU 3: IKLAN SPONSOR (UNLIMITED CARDS, KUOTA, JADWAL & STYLE INDIVIDUAL)
  // ============================================================================
  function renderSponsorsTab(promos) {
    const sponsorList = (typeof DB !== 'undefined' && DB.getSponsorList) ? DB.getSponsorList() : [];
    if (!currentEditingSponsorId && sponsorList.length > 0) {
      currentEditingSponsorId = sponsorList[0].id;
    }
    const currentSponsor = (currentEditingSponsorId && currentEditingSponsorId !== 'new')
      ? sponsorList.find(s => String(s.id) === String(currentEditingSponsorId))
      : null;
    if (currentSponsor && !activeSponsorType) {
      activeSponsorType = currentSponsor.type || 'ad1';
    }

    return `
      <div class="space-y-6">
        
        <!-- 1. TABEL DAFTAR SPONSOR (UNLIMITED SLOTS & KUOTA INPUT) -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <i data-lucide="image" class="w-5 h-5 text-emerald-600"></i>
                <span>Daftar Slot Iklan Sponsor (${sponsorList.length} Kartu Terdaftar)</span>
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">Kelola banner sponsor statis 3:4, slider carousel foto, dan mini katalog produk internal toko 2x2 tanpa batasan kuantitas.</p>
            </div>
            <button type="button" id="btn-add-new-sponsor" class="btn-primary-brand px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition hover:brightness-105 cursor-pointer shrink-0">
              <i data-lucide="plus-circle" class="w-4 h-4"></i>
              <span>Tambah Card Sponsor Baru</span>
            </button>
          </div>

          <div class="overflow-x-auto border border-slate-100 rounded-2xl">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th class="p-3.5 w-16">Preview</th>
                  <th class="p-3.5">Judul / Label Sponsor</th>
                  <th class="p-3.5">Model Kartu</th>
                  <th class="p-3.5 text-center">Kuota Tampil</th>
                  <th class="p-3.5 text-center">Status Aktif</th>
                  <th class="p-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${sponsorList.length === 0 ? `
                  <tr>
                    <td colspan="6" class="p-8 text-center text-slate-400">
                      Belum ada kartu sponsor. Klik tombol <strong>Tambah Card Sponsor Baru</strong> di atas untuk membuat sponsor.
                    </td>
                  </tr>
                ` : sponsorList.map((s) => {
                  const isSelected = String(currentEditingSponsorId) === String(s.id);
                  let thumbHtml = '';
                  if (s.type === 'double_width' || s.card_model === 'double_width') {
                    thumbHtml = `
                      <div class="w-10 h-10 rounded-lg border border-indigo-200 bg-indigo-950 flex items-center justify-center text-indigo-400">
                        <i class="bi bi-aspect-ratio text-lg"></i>
                      </div>
                    `;
                  } else if (s.type === 'carousel') {
                    thumbHtml = `
                      <div class="w-10 h-10 rounded-lg border border-slate-200 bg-slate-900 flex items-center justify-center text-blue-400">
                        <i data-lucide="images" class="w-5 h-5"></i>
                      </div>
                    `;
                  } else if (s.type === 'internal') {
                    thumbHtml = `
                      <div class="w-10 h-10 rounded-lg border border-slate-200 bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <i data-lucide="layout-grid" class="w-5 h-5"></i>
                      </div>
                    `;
                  } else {
                    thumbHtml = `
                      <img src="${escapeHtml(s.image_url || 'assets/images/logo-songer-creative.png')}" class="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-slate-100" onerror="this.onerror=null; this.src='assets/images/logo-songer-creative.png';" />
                    `;
                  }

                  let modelBadge = '';
                  if (s.type === 'double_width' || s.card_model === 'double_width') {
                    const slideCount = Array.isArray(s.slides) ? s.slides.length : 0;
                    modelBadge = `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">Double-Width 2-Kolom (${slideCount}/10 Foto)</span>`;
                  } else if (s.type === 'carousel') {
                    const slideCount = Array.isArray(s.slides) ? s.slides.length : 0;
                    modelBadge = `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-200">Carousel 1-Kolom (${slideCount}/5 Foto)</span>`;
                  } else if (s.type === 'internal') {
                    const prodCount = Array.isArray(s.product_ids) ? s.product_ids.length : 0;
                    modelBadge = `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">Internal 2x2 (${prodCount} Produk)</span>`;
                  } else {
                    modelBadge = `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-slate-50 text-slate-700 border-slate-200">Statis 3:4 (1 Banner)</span>`;
                  }

                  let scheduleInfo = '';
                  if (s.type === 'internal') {
                    const linkedCount = Array.isArray(s.linked_promo_ids) ? s.linked_promo_ids.length : 0;
                    if (linkedCount > 0) {
                      scheduleInfo = `<span class="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold"><i class="bi bi-clock-history"></i> Auto (${linkedCount} Promo)</span>`;
                    } else {
                      scheduleInfo = `<span class="text-[10px] text-slate-500 font-medium">Selalu Aktif (Manual)</span>`;
                    }
                  } else {
                    if (s.is_always_active !== false) {
                      scheduleInfo = `<span class="text-[10px] text-slate-500 font-medium">Selalu Aktif</span>`;
                    } else if (s.start_datetime || s.end_datetime) {
                      const startStr = s.start_datetime ? s.start_datetime.replace('T', ' ') : 'Mulai';
                      const endStr = s.end_datetime ? s.end_datetime.replace('T', ' ') : 'Selesai';
                      scheduleInfo = `<span class="inline-flex items-center gap-1 text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded font-semibold" title="${startStr} s/d ${endStr}"><i class="bi bi-calendar-event"></i> ${startStr.slice(5, 16)} s/d ${endStr.slice(5, 16)}</span>`;
                    } else {
                      scheduleInfo = `<span class="text-[10px] text-slate-500 font-medium">Selalu Aktif</span>`;
                    }
                  }

                  const isSelf = s.sponsor_owner_type === 'self' || s.type === 'internal';
                  const ownerBadge = isSelf
                    ? `<span class="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-1.5 py-0.2 rounded" title="Promosi produk toko sendiri"><i class="bi bi-shop"></i> Toko Sendiri</span>`
                    : `<span class="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-800 bg-indigo-100/90 border border-indigo-300 px-1.5 py-0.2 rounded" title="Pemasang: ${escapeHtml(s.contract_model === 'per_slide' ? 'Per-Slide Eceran' : (s.advertiser_name || 'Borongan'))}"><i class="bi bi-building"></i> Pihak Ketiga (${s.contract_model === 'per_slide' ? 'Per-Slide' : 'Borongan'})</span>`;

                  const mobileOnlyBadge = s.mobile_only_ready ? `<span class="inline-block text-[9px] font-black uppercase text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.2 rounded ml-1" title="Hanya tampil di versi mobile/ponsel">Mobile Only</span>` : '';
                  const priceVal = (typeof s.price === 'number' && s.price > 0) ? s.price : (s.type === 'double_width' ? 1200000 : (s.type === 'carousel' ? 750000 : (s.type === 'internal' ? 350000 : 500000)));

                  return `
                    <tr class="sponsor-row-item hover:bg-slate-50/80 transition cursor-pointer ${isSelected ? 'bg-emerald-50/50 ring-1 ring-emerald-500/30' : ''}" data-id="${s.id}">
                      <td class="p-3.5">
                        ${thumbHtml}
                      </td>
                      <td class="p-3.5">
                        <div class="flex items-center gap-1.5 flex-wrap">
                          <span class="font-bold text-slate-800">${escapeHtml(s.title || 'Tanpa Judul')}</span>
                          ${ownerBadge}
                          ${mobileOnlyBadge}
                          <span class="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded" title="Nilai Kontrak / Harga Slot Iklan">
                            Rp ${Math.round(priceVal).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div class="mt-0.5 flex items-center gap-2">
                          ${scheduleInfo}
                        </div>
                      </td>
                      <td class="p-3.5 text-slate-600">
                        ${modelBadge}
                      </td>
                      <td class="p-3.5 text-center" onclick="event.stopPropagation()">
                        <div class="inline-flex items-center gap-1">
                          <input type="number" min="1" max="10" value="${s.display_quota || 1}" class="input-sponsor-quota w-14 px-2 py-1 text-center font-bold border border-slate-200 rounded-lg focus:border-emerald-500 outline-none text-xs bg-white shadow-2xs" data-id="${s.id}" title="Jumlah kuota kemunculan kartu ini di etalase toko" />
                          <span class="text-[10px] text-slate-400">x</span>
                        </div>
                      </td>
                      <td class="p-3.5 text-center">
                        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${s.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}">
                          ${s.is_active ? 'AKTIF' : 'NONAKTIF'}
                        </span>
                      </td>
                      <td class="p-3.5 text-center" onclick="event.stopPropagation()">
                        <div class="flex items-center justify-center gap-2">
                          <label class="relative inline-flex items-center cursor-pointer" title="Nyalakan / Matikan Sponsor">
                            <input type="checkbox" class="sr-only peer toggle-sponsor-status" data-id="${s.id}" ${s.active !== false ? 'checked' : ''} />
                            <div class="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                          <button type="button" class="btn-edit-sponsor text-slate-400 hover:text-emerald-600 transition p-1 cursor-pointer" data-id="${s.id}" title="Edit Konfigurasi">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                          </button>
                          <button type="button" class="btn-delete-sponsor text-slate-400 hover:text-rose-500 transition p-1 cursor-pointer" data-id="${s.id}" title="Hapus Sponsor">
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

        <!-- 2. FORM TAMBAH / EDIT SPONSOR & LIVE PREVIEW -->
        ${renderSponsorForm(promos)}

      </div>
    `;
  }

  function renderSponsorForm(promos) {
    const sponsorList = (typeof DB !== 'undefined' && DB.getSponsorList) ? DB.getSponsorList() : [];
    const currentSponsor = (currentEditingSponsorId && currentEditingSponsorId !== 'new')
      ? (typeof DB !== 'undefined' && DB.getSponsorById ? DB.getSponsorById(currentEditingSponsorId) : sponsorList.find(s => String(s.id) === String(currentEditingSponsorId)))
      : null;
    const isCreatingNew = currentEditingSponsorId === 'new';

    if (currentSponsor && !isCreatingNew) {
      if (!activeSponsorType || (activeSponsorType !== currentSponsor.type)) {
        activeSponsorType = currentSponsor.type || 'ad1';
      }
      activeSponsorOwnerType = currentSponsor.sponsor_owner_type || (currentSponsor.type === 'internal' ? 'self' : 'third_party');
      activeContractModel = currentSponsor.contract_model || 'wholesale';
    } else {
      if (activeSponsorType === 'internal') {
        activeSponsorOwnerType = 'self';
      }
    }

    const allProducts = (typeof DB !== 'undefined' && DB.getAllProducts) ? DB.getAllProducts().filter(p => p.is_active !== false) : [];

    // State sync for carousel / double_width slides
    const isMultiSlideModel = (activeSponsorType === 'carousel' || activeSponsorType === 'double_width');
    const maxSlidesLimit = activeSponsorType === 'double_width' ? 10 : 5;
    if (isMultiSlideModel) {
      if (!currentCarouselSlides || currentCarouselSlides.length === 0) {
        if (currentSponsor && Array.isArray(currentSponsor.slides)) {
          currentCarouselSlides = [...currentSponsor.slides].slice(0, maxSlidesLimit);
        } else {
          currentCarouselSlides = [];
        }
      }
    } else {
      if (currentSponsor && Array.isArray(currentSponsor.slides)) {
        currentCarouselSlides = [...currentSponsor.slides].slice(0, 5);
      }
    }

    // State sync for internal products
    if (activeSponsorType === 'internal') {
      if (!currentInternalProductIds || currentInternalProductIds.length === 0) {
        if (currentSponsor && Array.isArray(currentSponsor.product_ids) && currentSponsor.product_ids.length > 0) {
          currentInternalProductIds = [...currentSponsor.product_ids];
        } else {
          currentInternalProductIds = allProducts.slice(0, 4).map(p => p.id);
        }
      }
    } else {
      if (currentSponsor && Array.isArray(currentSponsor.product_ids)) {
        currentInternalProductIds = [...currentSponsor.product_ids];
      }
    }

    // State sync for ad1 image
    if (activeSponsorType === 'ad1') {
      if (!currentSponsorAdImages || currentSponsorAdImages.length === 0) {
        if (currentSponsor && currentSponsor.image_url) {
          currentSponsorAdImages = [currentSponsor.image_url];
        } else {
          currentSponsorAdImages = ['assets/images/logo-songer-creative.png'];
        }
      }
    } else {
      if (currentSponsor && currentSponsor.image_url) {
        currentSponsorAdImages = [currentSponsor.image_url];
      }
    }

    const currentBgColor = currentSponsor?.bg_color || (activeSponsorType === 'internal' ? '#ffffff' : 'transparent');
    const currentBorderColor = currentSponsor?.border_color || '#e2e8f0';
    const currentBorderWidth = currentSponsor?.border_width || '1px';
    const currentBorderRadius = currentSponsor?.border_radius || '16px';
    const currentShadow = currentSponsor?.shadow || 'sm';
    const currentAnim = currentSponsor?.animation || 'none';
    const currentQuota = currentSponsor?.display_quota || 1;
    const isCurrentActive = isCreatingNew ? true : (currentSponsor?.active !== false);

    const modelName = activeSponsorType === 'double_width'
      ? 'Sponsor 2-Kolom (Double-Width Multi-Slide & CTA Mandiri)'
      : (activeSponsorType === 'carousel'
        ? 'Sponsor Slider Carousel (Maksimal 5 Foto)'
        : (activeSponsorType === 'internal' ? 'Sponsor Produk Sendiri (Katalog Mini Grid 2x2)' : 'Sponsor Statis (1 Gambar Banner Rasio 3:4)'));

    const titleVal = currentSponsor?.title || (activeSponsorType === 'double_width' ? 'Sponsor Eksklusif 2-Kolom' : (activeSponsorType === 'carousel' ? 'Sponsor Slider Carousel' : (activeSponsorType === 'internal' ? 'FLASH SALE 11.11' : 'Layanan Mitra & Desain Prioritas')));
    const subtitleVal = currentSponsor?.subtitle || '';
    const isAlwaysActive = currentSponsor ? (currentSponsor.is_always_active !== false) : true;
    const startDatetimeVal = currentSponsor?.start_datetime || '';
    const endDatetimeVal = currentSponsor?.end_datetime || '';

    // Database promo list untuk auto-activation internal sponsor
    const allPromos = (typeof DB !== 'undefined' && DB.getPromotions) ? DB.getPromotions() : [];

    return `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- KOLOM KIRI: FORM CONFIGURATION (7 COLS) -->
        <div class="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                ${isCreatingNew ? 'Pembuatan Card Sponsor Baru' : 'Edit Konfigurasi Sponsor'}
              </span>
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

          <!-- LANGKAH 1: PENENTUAN MODEL TAMPILAN KARTU SPONSOR -->
          <div class="space-y-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">1</span>
              <h4 class="font-bold text-xs sm:text-sm text-slate-900">Langkah 1 - Penentuan Model Tampilan Kartu:</h4>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              <label class="relative p-3 rounded-xl border ${activeSponsorType === 'ad1' ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <input type="radio" name="sponsor_card_model" value="ad1" ${activeSponsorType === 'ad1' ? 'checked' : ''} class="text-emerald-600" />
                  <span class="font-bold text-slate-900 text-xs">Model 1: Statis 3:4</span>
                </div>
                <p class="text-slate-500 text-[10px] leading-relaxed">Kartu Statis Potret 3:4 (1 Kolom + 2 Tombol Aksi Bawah).</p>
              </label>
              <label class="relative p-3 rounded-xl border ${activeSponsorType === 'carousel' ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <input type="radio" name="sponsor_card_model" value="carousel" ${activeSponsorType === 'carousel' ? 'checked' : ''} class="text-emerald-600" />
                  <span class="font-bold text-slate-900 text-xs">Model 2: Carousel 1-Kolom</span>
                </div>
                <p class="text-slate-500 text-[10px] leading-relaxed">Kartu Slider Carousel 1-Kolom (Maks. 5 Gambar Full-Bleed Tanpa CTA).</p>
              </label>
              <label class="relative p-3 rounded-xl border ${activeSponsorType === 'double_width' ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <input type="radio" name="sponsor_card_model" value="double_width" ${activeSponsorType === 'double_width' ? 'checked' : ''} class="text-emerald-600" />
                  <span class="font-bold text-slate-900 text-xs">Model 3: Double-Width 2-Kolom</span>
                </div>
                <p class="text-slate-500 text-[10px] leading-relaxed">Kartu Lebar 2-Kolom (Maks. 10 Slide Gambar + Kustomisasi Tombol CTA per-Slide).</p>
              </label>
              <label class="relative p-3 rounded-xl border ${activeSponsorType === 'internal' ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <input type="radio" name="sponsor_card_model" value="internal" ${activeSponsorType === 'internal' ? 'checked' : ''} class="text-emerald-600" />
                  <span class="font-bold text-slate-900 text-xs">Model 4: Internal 2x2</span>
                </div>
                <p class="text-slate-500 text-[10px] leading-relaxed">Kartu Rekomendasi Produk Toko 2x2 (Maks. 20 Produk / 5 Slide Batch).</p>
              </label>
            </div>
          </div>

          <!-- LANGKAH 1B: KEPEMILIKAN SLOT SPONSOR & MODEL KONTRAK -->
          <div class="space-y-3.5 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs">1B</span>
              <h4 class="font-bold text-xs sm:text-sm text-slate-900">Langkah 1B - Kepemilikan Slot & Model Kontrak Iklan:</h4>
            </div>

            <!-- Pilihan Kepemilikan: Pihak Ketiga vs Toko Sendiri -->
            <div>
              <label class="block font-bold text-slate-700 mb-1.5 text-xs">Kepemilikan Slot Sponsor:</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label class="p-3 rounded-xl border ${activeSponsorOwnerType === 'third_party' ? 'border-indigo-500 bg-white ring-2 ring-indigo-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex flex-col gap-1">
                  <div class="flex items-center gap-2">
                    <input type="radio" name="sponsor_owner_type" value="third_party" ${activeSponsorOwnerType === 'third_party' ? 'checked' : ''} class="text-indigo-600" />
                    <span class="font-bold text-slate-900 text-xs">Pihak Ketiga / Orang Lain</span>
                  </div>
                  <p class="text-slate-500 text-[10px] leading-relaxed">Slot disewakan ke mitra/rekanan bisnis luar (iklan komersial berbayar dengan link eksternal / WhatsApp).</p>
                </label>

                <label class="p-3 rounded-xl border ${activeSponsorOwnerType === 'self' ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex flex-col gap-1">
                  <div class="flex items-center gap-2">
                    <input type="radio" name="sponsor_owner_type" value="self" ${activeSponsorOwnerType === 'self' ? 'checked' : ''} class="text-emerald-600" />
                    <span class="font-bold text-slate-900 text-xs">Toko Sendiri (Produk Internal)</span>
                  </div>
                  <p class="text-slate-500 text-[10px] leading-relaxed">Slot mempromosikan produk katalog toko sendiri. Saat diklik di etalase, langsung membuka halaman PDP produk.</p>
                </label>
              </div>
            </div>

            <!-- Jika Pihak Ketiga: Model Kontrak Space (Borongan Penuh vs Per-Slide) -->
            <div id="box-contract-model" class="${activeSponsorOwnerType === 'third_party' ? '' : 'hidden'} space-y-3 pt-2 border-t border-slate-200/80">
              <label class="block font-bold text-slate-700 mb-1 text-xs">Model Kontrak Slot Iklan:</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label class="p-2.5 rounded-xl border ${activeContractModel === 'wholesale' ? 'border-indigo-500 bg-white ring-1 ring-indigo-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex flex-col gap-0.5">
                  <div class="flex items-center gap-2">
                    <input type="radio" name="sponsor_contract_model" value="wholesale" ${activeContractModel === 'wholesale' ? 'checked' : ''} class="text-indigo-600" />
                    <span class="font-bold text-slate-800 text-xs">Borongan Penuh (1 Pemasang Iklan)</span>
                  </div>
                  <p class="text-slate-400 text-[10px]">Seluruh slot kartu diborong oleh 1 orang/perusahaan rekanan.</p>
                </label>

                <label class="p-2.5 rounded-xl border ${activeContractModel === 'per_slide' ? 'border-indigo-500 bg-white ring-1 ring-indigo-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'} cursor-pointer transition flex flex-col gap-0.5">
                  <div class="flex items-center gap-2">
                    <input type="radio" name="sponsor_contract_model" value="per_slide" ${activeContractModel === 'per_slide' ? 'checked' : ''} class="text-indigo-600" />
                    <span class="font-bold text-slate-800 text-xs">Per-Space / Per-Slide (Beda Orang)</span>
                  </div>
                  <p class="text-slate-400 text-[10px]">Tiap slide gambar diisi oleh pemasang iklan dan nilai kontrak yang berbeda-beda.</p>
                </label>
              </div>

              <!-- Input Nama Pemasang Iklan Utama (jika wholesale) -->
              <div id="box-advertiser-name" class="${activeContractModel === 'wholesale' ? '' : 'hidden'} pt-1">
                <label class="block font-bold text-slate-700 mb-1 text-xs">Nama Pemasang Iklan / Mitra Utama:</label>
                <input type="text" id="sponsor-advertiser-name-input" value="${escapeHtml(currentSponsor?.advertiser_name || '')}" placeholder="Contoh: PT Sumber Grafika Prima" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold outline-none focus:border-indigo-500 text-xs bg-white" />
              </div>
            </div>

            <!-- Jika Toko Sendiri: Banner Notif Info -->
            <div id="box-self-owner-info" class="${activeSponsorOwnerType === 'self' ? '' : 'hidden'} p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
              <i class="bi bi-shop text-emerald-600 mt-0.5 text-sm shrink-0"></i>
              <p class="text-[11px] leading-relaxed">
                Slot ini disetel untuk <strong>Promosi Toko Sendiri</strong>. Anda dapat menautkan slide langsung ke produk katalog toko pada pengaturan slide di bawah. Pembeli yang mengklik slide atau tombol CTA di etalase akan langsung diarahkan ke halaman detail produk terkait.
              </p>
            </div>
          </div>

          <!-- LANGKAH 2: FORM PENGATURAN SPESIFIK MODEL -->
          ${activeSponsorType === 'double_width' ? `
            <!-- FORM SPONSOR 2-KOLOM (DOUBLE-WIDTH CAROUSEL DENGAN HINGGA 10 FOTO & CTA MANDIRI) -->
            <div class="space-y-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs">2</span>
                <h4 class="font-bold text-xs sm:text-sm text-slate-900">Langkah 2 - Konfigurasi Sponsor 2-Kolom (Double-Width Multi-Slide):</h4>
              </div>

              <!-- Saran Skala Gambar & Fitur -->
              <div class="p-3 bg-indigo-50/90 rounded-xl border border-indigo-200 text-xs text-indigo-900 leading-relaxed space-y-1">
                <div class="flex items-center gap-1.5 font-bold">
                  <i class="bi bi-aspect-ratio text-indigo-600 shrink-0"></i>
                  <span>Panduan Dimensi 2-Kolom (col-span-2) & CTA Fleksibel:</span>
                </div>
                <p class="text-[11px] text-indigo-800">
                  Banner membentang selebar <strong>2 kolom etalase</strong> dengan tinggi proporsional sejajar kartu produk sekitar. Mendukung <strong>hingga 10 slide foto</strong> (resolusi ideal <strong>1200×800 px</strong> lanskap atau <strong>800×600 px</strong>, otomatis dikompres &amp; dioptimasi). Pilihan mode putar otomatis (interval waktu) atau manual (panah hover desktop & swipe sentuh mobile), serta tombol CTA melayang kustom per slide.
                </p>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1 text-xs">Judul / Label Sponsor 2-Kolom:</label>
                <input type="text" id="sponsor-title-input" value="${escapeHtml(titleVal)}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold outline-none focus:border-emerald-500 text-xs bg-white" placeholder="Contoh: Sponsor Spesial Rekanan Toko" />
              </div>

              <!-- Mode Navigasi, Animasi & Interval Pergantian Slide -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label class="block font-bold text-slate-700 mb-1 text-xs">Mode Navigasi Slide:</label>
                  <select id="sponsor-slide-mode-select" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold outline-none focus:border-emerald-500 text-xs">
                    <option value="auto" ${(currentSponsor?.slide_mode || 'auto') === 'auto' ? 'selected' : ''}>Putar Otomatis (Interval)</option>
                    <option value="manual" ${currentSponsor?.slide_mode === 'manual' ? 'selected' : ''}>Manual (Panah & Geser Sentuh)</option>
                  </select>
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1 text-xs">Interval Putar (milidetik):</label>
                  <div class="flex items-center gap-1.5">
                    <input type="number" id="carousel-interval-input" value="${currentSponsor?.auto_slide_interval || 4000}" class="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold outline-none focus:border-emerald-500 text-xs bg-white" placeholder="4000" />
                  </div>
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1 text-xs">Animasi Pergantian Slide:</label>
                  <select id="carousel-anim-type-select" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold outline-none focus:border-emerald-500 text-xs">
                    <option value="slide" ${(currentSponsor?.animation_type === 'slide' || !currentSponsor?.animation_type) ? 'selected' : ''}>Slide Horizontal (Geser Halus)</option>
                    <option value="fade" ${currentSponsor?.animation_type === 'fade' ? 'selected' : ''}>Fade In / Out (Pudar Elegan)</option>
                    <option value="scale" ${currentSponsor?.animation_type === 'scale' ? 'selected' : ''}>Scale Sinematik</option>
                  </select>
                </div>
              </div>

              <div class="pt-2 border-t border-slate-200 space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <label class="block font-bold text-slate-800 text-xs">Slide Foto Sponsor (Maksimal 10 Foto):</label>
                    <p class="text-[11px] text-slate-400">Unggah berkas foto atau tempel URL tautan gambar slide (otomatis dikompres &amp; dioptimasi).</p>
                  </div>
                  <span id="carousel-slide-counter-badge" class="px-2.5 py-1 rounded-full text-[10px] font-bold ${currentCarouselSlides.length >= 10 ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}">
                    ${currentCarouselSlides.length} / 10 Slide
                  </span>
                </div>

                <!-- Unified uploader for 2-column carousel slides -->
                ${renderUnifiedUploaderHtml({
                  id: 'sponsor-carousel-uploader',
                  images: currentCarouselSlides.map(s => s.image_url).filter(Boolean),
                  isMulti: true,
                  placeholder: 'Tempel URL gambar slide baru (https://...)'
                })}

                <!-- Repeater Items with Target URLs & Independent CTA -->
                <div class="pt-3 border-t border-slate-200">
                  <div class="flex items-center justify-between mb-2">
                    <h5 class="font-bold text-slate-800 text-xs">Daftar Slide & Pengaturan CTA Mandiri:</h5>
                    ${currentCarouselSlides.length < 10 ? `
                      <button type="button" id="btn-add-carousel-slide" class="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer">
                        <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                        <span>+ Tambah Slide Gambar (Maks 10)</span>
                      </button>
                    ` : `
                      <span class="text-[11px] font-bold text-slate-400">Maksimal 10 slide tercapai</span>
                    `}
                  </div>
                  <div id="carousel-slides-container" class="space-y-3">
                    <!-- Populated by renderCarouselSlideRows -->
                  </div>
                </div>
              </div>
            </div>
          ` : (activeSponsorType === 'carousel' ? `
            <!-- FORM CAROUSEL (MAKSIMAL 5 GAMBAR) -->
            <div class="space-y-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">2</span>
                <h4 class="font-bold text-xs sm:text-sm text-slate-900">Langkah 2 - Konfigurasi Slider Carousel (Tanpa CTA):</h4>
              </div>

              <!-- Saran Skala Gambar -->
              <div class="p-3 bg-blue-50/90 rounded-xl border border-blue-200 text-xs text-blue-900 leading-relaxed space-y-1">
                <div class="flex items-center gap-1.5 font-bold">
                  <i data-lucide="info" class="w-4 h-4 text-blue-600 shrink-0"></i>
                  <span>Saran Ukuran & Skala Gambar Carousel:</span>
                </div>
                <p class="text-[11px] text-blue-800">
                  Gunakan rasio <strong>3:4 Portrait</strong> (resolusi ideal <strong>600×800 px</strong>, otomatis dikompres). Gambar akan mengisi tinggi kartu secara proporsional sesuai baris grid, <strong>tanpa tombol CTA</strong> dengan indikator titik dots dinamis.
                </p>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1 text-xs">Judul / Label Sponsor Carousel:</label>
                <input type="text" id="sponsor-title-input" value="${escapeHtml(titleVal)}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold outline-none focus:border-emerald-500 text-xs bg-white" placeholder="Judul Sponsor Slider Carousel" />
              </div>

              <!-- Pilihan Animasi & Interval Pergantian Slide -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label class="block font-bold text-slate-700 mb-1 text-xs">Interval Putar Otomatis (milidetik):</label>
                  <div class="flex items-center gap-2">
                    <input type="number" id="carousel-interval-input" value="${currentSponsor?.auto_slide_interval || 3500}" class="w-28 px-3 py-2 rounded-xl border border-slate-300 font-semibold outline-none focus:border-emerald-500 text-xs bg-white" placeholder="3500" />
                    <span class="text-[11px] text-slate-500">Standar: 3.5 detik</span>
                  </div>
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1 text-xs">Animasi Pergantian Slide:</label>
                  <select id="carousel-anim-type-select" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold outline-none focus:border-emerald-500 text-xs">
                    <option value="slide" ${(currentSponsor?.animation_type === 'slide' || !currentSponsor?.animation_type) ? 'selected' : ''}>Slide Horizontal (Geser Halus)</option>
                    <option value="fade" ${currentSponsor?.animation_type === 'fade' ? 'selected' : ''}>Fade In / Out (Pudar Elegan)</option>
                    <option value="scale" ${currentSponsor?.animation_type === 'scale' ? 'selected' : ''}>Scale Sinematik</option>
                  </select>
                </div>
              </div>

              <div class="pt-2 border-t border-slate-200 space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <label class="block font-bold text-slate-800 text-xs">Slide Foto Carousel (Maksimal 5 Foto):</label>
                    <p class="text-[11px] text-slate-400">Unggah berkas foto atau tempel URL link gambar slide.</p>
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
                    <h5 class="font-bold text-slate-800 text-xs">Target Link Tiap Slide:</h5>
                    ${currentCarouselSlides.length < 5 ? `
                      <button type="button" id="btn-add-carousel-slide" class="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer">
                        <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                        <span>+ Tambah Slide Gambar (Maks 5)</span>
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

              <!-- Format & Panduan -->
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
                <input type="text" id="sponsor-internal-title-input" value="${escapeHtml(titleVal)}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold outline-none focus:border-emerald-500 text-xs bg-white" placeholder="Contoh: FLASH SALE 11.11 atau Sedang Promo" />
                <p class="text-[10px] text-slate-400 mt-1">Judul ini langsung tampil bersih di baris atas kartu tanpa dot dan tanpa border pemisah.</p>
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

                <!-- Input Pencarian -->
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
            <!-- FORM SPONSOR STATIS (1 GAMBAR DENGAN 2 CTA - 3:4 PORTRAIT MURNI) -->
            <div class="space-y-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 text-xs">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">2</span>
                <h4 class="font-bold text-xs sm:text-sm text-slate-900">Langkah 2 - Konfigurasi Sponsor Statis (1 Gambar Banner 3:4):</h4>
              </div>

              <!-- Saran Skala Gambar -->
              <div class="p-3 bg-amber-50/90 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-1">
                <div class="flex items-center gap-1.5 font-bold">
                  <i data-lucide="info" class="w-4 h-4 text-amber-600 shrink-0"></i>
                  <span>Format Skala Banner (Rasio 3:4 Portrait Murni):</span>
                </div>
                <p class="text-[11px] text-amber-800">
                  Gunakan rasio <strong>3:4 Portrait</strong> murni (resolusi ideal <strong>600×800 px</strong>, otomatis dikompres). Gambar banner terkunci portrait tanpa melar horizontal, dengan 2 tombol aksi stacked di bawahnya.
                </p>
              </div>

              <!-- OPSI TAUTKAN KE PRODUK TOKO (KHUSUS AD1 TOKO SENDIRI) -->
              ${activeSponsorOwnerType === 'self' ? `
                <div class="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="block text-xs font-bold text-emerald-900">
                      <i class="bi bi-shop text-emerald-600"></i> Pilih Produk Toko untuk Diiklankan:
                    </label>
                    <button type="button" id="btn-ad1-apply-product" class="text-[10px] font-bold text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg transition shadow-2xs cursor-pointer">
                      Isi Otomatis Info & Foto Produk
                    </button>
                  </div>
                  <select id="sponsor-ad1-linked-prod" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none focus:border-emerald-500">
                    <option value="">-- Pilih Produk dari Katalog Toko --</option>
                    ${allProducts.map(p => `
                      <option value="${p.id}" ${(currentSponsor?.linked_product_id === String(p.id) || currentSponsor?.target_product_id === String(p.id)) ? 'selected' : ''}>
                        ${escapeHtml(p.name)} - Rp ${Math.round(p.price || p.starting_price || 0).toLocaleString('id-ID')}
                      </option>
                    `).join('')}
                  </select>
                </div>
              ` : ''}

              <div>
                <label class="block font-bold text-slate-700 mb-1">Judul / Headline Iklan:</label>
                <input type="text" id="sponsor-title-input" value="${escapeHtml(titleVal)}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold outline-none focus:border-emerald-500 bg-white" placeholder="Contoh: Mitra Rekanan Percetakan" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Sub-judul / Keterangan Singkat:</label>
                <input type="text" id="sponsor-subtitle-input" value="${escapeHtml(subtitleVal)}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium outline-none focus:border-emerald-500 bg-white" placeholder="Contoh: Solusi cetak kemasan dan merchandise" />
              </div>

              <div class="space-y-2 pt-2 border-t border-slate-200">
                <label class="block font-bold text-slate-700">Media Banner Sponsor (Rasio 3:4 Portrait Murni):</label>
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
                    <option value="external_url" ${(currentSponsor?.cta_type || 'external_url') !== 'whatsapp' ? 'selected' : ''}>Buka Link Tawaran (URL Luar)</option>
                    <option value="whatsapp" ${currentSponsor?.cta_type === 'whatsapp' ? 'selected' : ''}>Tanyakan via WhatsApp</option>
                  </select>
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Teks Tombol Utama (CTA 1):</label>
                  <input type="text" id="sponsor-cta-label" value="${escapeHtml(currentSponsor?.cta_label || 'Lihat Tawaran')}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold outline-none focus:border-emerald-500 bg-white" />
                </div>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Target Link / Nomor WhatsApp Tujuan CTA 1:</label>
                <input type="text" id="sponsor-cta-target" value="${escapeHtml(currentSponsor?.cta_target || '')}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-[11px] outline-none focus:border-emerald-500 bg-white" placeholder="https://... atau 6281234567890" />
              </div>
            </div>
          `))}

          <!-- LANGKAH 3: PENGATURAN MASA AKTIF & PENJADWALAN (AUTO-ACTIVATION & EXPIRATION) -->
          <div class="space-y-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">3</span>
              <h4 class="font-bold text-xs sm:text-sm text-slate-900">
                ${activeSponsorType === 'internal' ? 'Langkah 3 - Auto-Activation Berdasarkan Jadwal Promosi:' : 'Langkah 3 - Jangka Waktu Aktif & Jadwal Penayangan:'}
              </h4>
            </div>

            ${activeSponsorType === 'internal' ? `
              <!-- Logika Auto-Activation dari Database Promo DB.getPromotions() -->
              <div class="space-y-2">
                <label class="block font-bold text-slate-800 text-xs">Tautkan ke Jadwal Promosi Toko:</label>
                ${allPromos.length === 0 ? `
                  <div class="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                    <p class="font-bold">Belum ada jadwal promosi aktif.</p>
                    <p class="text-[11px] mt-0.5 text-amber-800">Buat promosi terlebih dahulu di menu Promosi untuk menggunakan fitur auto-activation.</p>
                  </div>
                ` : `
                  <div class="space-y-1.5 max-h-48 overflow-y-auto p-2.5 bg-white border border-slate-200 rounded-xl">
                    ${allPromos.map(promo => {
                      const isChecked = Array.isArray(currentSponsor?.linked_promo_ids) && currentSponsor.linked_promo_ids.some(lid => String(lid) === String(promo.id));
                      const pStart = promo.start_datetime || promo.start_date || 'Mulai';
                      const pEnd = promo.end_datetime || promo.end_date || 'Selesai';
                      const pName = promo.name || promo.title_line1 || 'Promosi';
                      return `
                        <label class="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer text-xs">
                          <input type="checkbox" value="${String(promo.id)}" class="chk-linked-promo w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" ${isChecked ? 'checked' : ''} />
                          <div class="flex-1 min-w-0">
                            <span class="font-bold text-slate-800 block truncate">${escapeHtml(pName)}</span>
                            <span class="text-[10px] text-slate-400 block">${escapeHtml(pStart)} s/d ${escapeHtml(pEnd)}</span>
                          </div>
                        </label>
                      `;
                    }).join('')}
                  </div>
                  <p class="text-[10px] text-slate-500 mt-1">
                    Jika memilih minimal 1 promo, kartu sponsor otomatis tampil saat promosi aktif. Kosongkan pilihan jika ingin status manual / selalu aktif.
                  </p>
                `}
              </div>
            ` : `
              <!-- Jangka Waktu Aktif: Toggle Selalu Aktif & Rentang Waktu -->
              <div class="space-y-3">
                <div class="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                  <div>
                    <span class="text-xs font-bold text-slate-800 block">Selalu Aktif / Tanpa Batas Waktu</span>
                    <span class="text-[10px] text-slate-500 block">Matikan toggle untuk mengatur jam tayang dan waktu kedaluwarsa otomatis.</span>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="chk-sponsor-always-active" ${isAlwaysActive ? 'checked' : ''} class="sr-only peer" />
                    <div class="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div id="sponsor-datetime-range-box" class="${isAlwaysActive ? 'hidden' : ''} grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-slate-200">
                  <div>
                    <label class="block font-bold text-slate-700 text-xs mb-1">Tanggal & Waktu Mulai:</label>
                    <input type="datetime-local" id="sponsor-start-datetime" value="${escapeHtml(startDatetimeVal)}" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-emerald-500 bg-white" />
                  </div>
                  <div>
                    <label class="block font-bold text-slate-700 text-xs mb-1">Tanggal & Waktu Berakhir:</label>
                    <input type="datetime-local" id="sponsor-end-datetime" value="${escapeHtml(endDatetimeVal)}" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-emerald-500 bg-white" />
                  </div>
                </div>
              </div>
            `}
          </div>

          <!-- LANGKAH 4: KUSTOMISASI STYLE INDIVIDUAL (PER-CARD) -->
          <!-- LANGKAH 4: KUSTOMISASI STYLE INDIVIDUAL (PER-CARD) -->
          <div class="space-y-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">4</span>
              <h4 class="font-bold text-xs sm:text-sm text-slate-900">Langkah 4 - Kustomisasi Tampilan Individual & Kuota:</h4>
            </div>

            <!-- Nilai Kontrak, Kuota Tampil & Animasi Masuk Viewport -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block font-bold text-slate-700 text-xs mb-1">Nilai Kontrak / Harga Slot (Rp):</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input type="number" id="sponsor-price-input" min="0" step="50000" value="${currentSponsor?.price !== undefined ? currentSponsor.price : (activeSponsorType === 'double_width' ? 1200000 : (activeSponsorType === 'carousel' ? 750000 : (activeSponsorType === 'internal' ? 350000 : 500000)))}" class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold font-mono outline-none focus:border-emerald-500 bg-white" placeholder="500000" />
                </div>
                <span class="text-[10px] text-slate-400 mt-0.5 block">Metrik Pendapatan Sponsor</span>
              </div>
              <div>
                <label class="block font-bold text-slate-700 text-xs mb-1">Kuota Tampil di Etalase:</label>
                <div class="flex items-center gap-2">
                  <input type="number" id="sponsor-card-quota-input" min="1" max="10" value="${currentQuota}" class="w-20 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold outline-none focus:border-emerald-500 bg-white" />
                  <span class="text-[11px] text-slate-500">Maks rotasi</span>
                </div>
              </div>
              <div>
                <label class="block font-bold text-slate-700 text-xs mb-1">Animasi Masuk Viewport:</label>
                <select id="sponsor-card-anim-select" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-emerald-500 bg-white">
                  <option value="none" ${currentAnim === 'none' ? 'selected' : ''}>Tanpa Animasi (none)</option>
                  <option value="fade" ${currentAnim === 'fade' ? 'selected' : ''}>Fade In (fade)</option>
                  <option value="slide" ${currentAnim === 'slide' ? 'selected' : ''}>Slide-in (slide)</option>
                  <option value="zoom" ${currentAnim === 'zoom' ? 'selected' : ''}>Smooth Zoom (zoom)</option>
                </select>
              </div>
            </div>

            <!-- Border Radius -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="font-bold text-slate-700 text-xs">Sudut Lengkung (Border Radius):</label>
                <span id="label-sponsor-radius-val" class="text-xs font-mono font-bold text-emerald-700">${currentBorderRadius}</span>
              </div>
              <div class="flex items-center gap-3">
                <input type="range" id="sponsor-card-radius-range" min="0" max="32" step="2" value="${parseInt(currentBorderRadius) || 16}" class="flex-1 accent-emerald-600 cursor-pointer" />
                <input type="text" id="sponsor-card-radius-input" value="${escapeHtml(currentBorderRadius)}" class="w-20 px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-center outline-none focus:border-emerald-500 bg-white shrink-0" />
              </div>
              <div class="flex items-center gap-1.5 mt-2 flex-wrap">
                <span class="text-[10px] text-slate-400 mr-1">Preset:</span>
                <button type="button" class="btn-preset-sponsor-radius px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer" data-radius="0px">0px (Siku)</button>
                <button type="button" class="btn-preset-sponsor-radius px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer" data-radius="8px">8px (Kecil)</button>
                <button type="button" class="btn-preset-sponsor-radius px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer" data-radius="12px">12px (Sedang)</button>
                <button type="button" class="btn-preset-sponsor-radius px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 cursor-pointer" data-radius="16px">16px (Standar)</button>
                <button type="button" class="btn-preset-sponsor-radius px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer" data-radius="24px">24px (Bulat)</button>
                <button type="button" class="btn-preset-sponsor-radius px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer" data-radius="32px">32px (Maks)</button>
              </div>
            </div>

            <!-- Border Color & Width -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 text-xs mb-1">Ketebalan Border:</label>
                <select id="sponsor-card-border-width-select" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-emerald-500 bg-white">
                  <option value="0px" ${currentBorderWidth === '0px' ? 'selected' : ''}>Tanpa Garis Border (0px)</option>
                  <option value="1px" ${(currentBorderWidth === '1px' || !currentBorderWidth) ? 'selected' : ''}>Tipis Standar (1px)</option>
                  <option value="2px" ${currentBorderWidth === '2px' ? 'selected' : ''}>Tebal Menonjol (2px)</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 text-xs mb-1">Warna Garis Border:</label>
                <div class="flex items-center gap-2">
                  <input type="color" id="sponsor-card-border-picker" value="${currentBorderColor === 'transparent' ? '#e2e8f0' : currentBorderColor}" class="w-9 h-9 p-0.5 rounded-lg border border-slate-300 cursor-pointer bg-white shrink-0" />
                  <input type="text" id="sponsor-card-border-input" value="${escapeHtml(currentBorderColor)}" placeholder="#e2e8f0" class="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold outline-none focus:border-emerald-500 bg-white" />
                </div>
              </div>
            </div>

            <!-- Box Shadow Preset -->
            <div>
              <label class="block font-bold text-slate-700 text-xs mb-1">Efek Bayangan (Box Shadow):</label>
              <select id="sponsor-card-shadow-select" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-emerald-500 bg-white">
                <option value="none" ${currentShadow === 'none' ? 'selected' : ''}>Tanpa Shadow (none)</option>
                <option value="sm" ${(currentShadow === 'sm' || !currentShadow) ? 'selected' : ''}>Ringan Elegan (sm)</option>
                <option value="md" ${currentShadow === 'md' ? 'selected' : ''}>Sedang Proporsional (md)</option>
                <option value="lg" ${currentShadow === 'lg' ? 'selected' : ''}>Kuat Tegas (lg)</option>
                <option value="xl" ${currentShadow === 'xl' ? 'selected' : ''}>Ekstra Mengapung (xl)</option>
              </select>
            </div>

            <!-- Warna Background Card (Seragam untuk Ke-4 Model Sponsor) -->
            <div id="sponsor-bg-color-wrapper">
              <div class="flex items-center justify-between mb-1">
                <label class="font-bold text-slate-700 text-xs">Warna Latar Kartu (Card Background):</label>
                <span class="text-[10px] text-slate-500">Default: <strong class="text-emerald-700 font-mono">${activeSponsorType === 'internal' ? '#ffffff' : 'transparent'}</strong></span>
              </div>
              <div class="flex items-center gap-2">
                <input type="color" id="sponsor-card-bg-picker" value="${currentBgColor === 'transparent' ? '#ffffff' : currentBgColor}" class="w-9 h-9 p-0.5 rounded-lg border border-slate-300 cursor-pointer bg-white shrink-0" />
                <input type="text" id="sponsor-card-bg-input" value="${escapeHtml(currentBgColor)}" placeholder="transparent atau #ffffff" class="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold outline-none focus:border-emerald-500 bg-white" />
                <button type="button" id="btn-preset-bg-transparent" class="px-2.5 py-2 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition shrink-0 cursor-pointer" title="Set Latar Belakang Transparan">
                  Set Transparan
                </button>
              </div>
              <div class="flex items-center gap-1.5 mt-2 flex-wrap">
                <span class="text-[10px] text-slate-400 mr-1">Preset:</span>
                <button type="button" class="btn-preset-sponsor-bg px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer" data-color="transparent">Transparan</button>
                <button type="button" class="btn-preset-sponsor-bg px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer" data-color="#ffffff">Putih</button>
                <button type="button" class="btn-preset-sponsor-bg px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer" data-color="#f8fafc">Slate Soft</button>
                <button type="button" class="btn-preset-sponsor-bg px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 cursor-pointer" data-color="#f0fdf4">Emerald Soft</button>
                <button type="button" class="btn-preset-sponsor-bg px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-slate-900 text-white border-slate-800 hover:bg-slate-800 cursor-pointer" data-color="#0f172a">Dark</button>
              </div>
            </div>

          </div>

          <!-- Tombol Simpan Sponsor -->
          <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
            ${isCreatingNew ? `
              <button type="button" id="btn-cancel-create-sponsor" class="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition cursor-pointer">
                Batal
              </button>
            ` : `<div></div>`}
            <button type="button" id="btn-save-single-sponsor" class="btn-primary-brand px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition hover:brightness-105 cursor-pointer">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>${isCreatingNew ? 'Terbitkan Card Sponsor Baru' : 'Simpan Perubahan Sponsor Ini'}</span>
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
          <div id="sponsor-card-live-preview" class="${activeSponsorType === 'double_width' ? 'max-w-[480px]' : 'max-w-[300px]'} mx-auto w-full">
            <!-- Rendered dynamically via updateSponsorPreviews() -->
          </div>

          <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
            <span class="font-bold text-slate-700 block mb-0.5">Penempatan Otomatis di Web Toko:</span>
            ${activeSponsorType === 'double_width'
              ? 'Kartu sponsor 2-kolom membentang selebar 2 kolom etalase dengan navigasi hingga 10 slide gambar, mode putar otomatis/manual panah hover & touch swipe, serta tombol CTA melayang kustom per slide.'
              : (activeSponsorType === 'carousel'
                ? 'Kartu slider carousel akan otomatis memutar pergantian slide tiap interval waktu di slot sponsor etalase tanpa tombol CTA.'
                : (activeSponsorType === 'internal'
                  ? 'Kartu katalog mini 2x2 menampilkan produk internal toko secara interaktif tanpa garis pemisah header. Klik mini card di etalase akan langsung membuka halaman produk (PDP).'
                  : 'Kartu sponsor statis menampilkan gambar banner 3:4 portrait murni dengan 2 tombol aksi CTA di bagian bawah.'))}
          </div>
        </div>

      </div>
    `;
  }

  function updateSponsorPreviews() {
    clearSponsorPreviewTimer();
    const box = document.getElementById('sponsor-card-live-preview');
    if (!box) return;

    const bgInput = document.getElementById('sponsor-card-bg-input');
    const bgVal = bgInput?.value.trim() || (activeSponsorType === 'internal' ? '#ffffff' : 'transparent');
    const borderVal = document.getElementById('sponsor-card-border-input')?.value.trim() || '#e2e8f0';
    const borderWidthVal = document.getElementById('sponsor-card-border-width-select')?.value || '1px';
    const radiusVal = document.getElementById('sponsor-card-radius-input')?.value.trim() || '16px';
    const shadowVal = document.getElementById('sponsor-card-shadow-select')?.value || 'sm';
    const shadowStyle = shadowVal === 'none' ? 'box-shadow: none !important;' : '';
    const shadowClass = shadowVal === 'none' ? 'sponsor-shadow-none' : `sponsor-shadow-${shadowVal}`;

    const cardStyleCss = `background-color: ${bgVal}; border: ${borderWidthVal} solid ${borderVal}; border-radius: ${radiusVal}; ${shadowStyle}`;

    if (activeSponsorType === 'double_width') {
      const slides = (currentCarouselSlides || []).slice(0, 10);
      const interval = parseInt(document.getElementById('carousel-interval-input')?.value) || 4000;
      const animType = document.getElementById('carousel-anim-type-select')?.value || 'slide';
      const slideMode = document.getElementById('sponsor-slide-mode-select')?.value || 'auto';

      if (slides.length === 0) {
        box.innerHTML = `
          <div class="w-full min-h-[220px] h-[240px] flex flex-col justify-between overflow-hidden shadow-md relative group ${shadowClass}" style="${cardStyleCss}">
            <div class="relative w-full h-full overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col items-center justify-center p-5 text-center shrink-0">
              <span class="absolute top-2.5 left-2.5 bg-slate-900/85 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm z-10">
                SPONSOR 2-KOLOM
              </span>
              <div class="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-2 text-indigo-400">
                <i class="bi bi-aspect-ratio text-2xl"></i>
              </div>
              <span class="text-xs font-black tracking-widest text-white uppercase">DOUBLE-WIDTH CAROUSEL</span>
              <p class="text-[10px] text-slate-300 mt-1 max-w-[260px]">Belum ada slide gambar. Silakan unggah hingga 10 foto slide di form samping.</p>
            </div>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      const showDots = slides.length > 1;
      const showArrows = slides.length > 1;
      const dotsHtml = showDots ? slides.map((_, idx) => `
        <button type="button" class="admin-carousel-preview-dot w-2 h-2 rounded-full ${idx === 0 ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'} transition-all cursor-pointer shadow-sm" data-idx="${idx}" aria-label="Slide ${idx + 1}"></button>
      `).join('') : '';

      let slidesContentHtml = '';
      if (animType === 'fade' || animType === 'scale') {
        slidesContentHtml = slides.map((slide, idx) => {
          const ctaShadow = slide.cta_shadow || 'md';
          const ctaShadowClass = ctaShadow === 'none' ? 'shadow-none' : `shadow-${ctaShadow}`;
          const ctaBtnHtml = slide.cta_enabled ? `
            <div class="absolute bottom-3 right-3 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold ${ctaShadowClass} select-none pointer-events-none" style="background-color: ${slide.cta_bg_color || '#059669'}; color: ${slide.cta_text_color || '#ffffff'}; border-radius: ${slide.cta_border_radius || '12px'};">
              <span class="truncate">${escapeHtml(slide.cta_text || 'Lihat Penawaran')}</span>
              <i class="${escapeHtml(slide.cta_icon || 'bi-arrow-right')} text-xs"></i>
            </div>
          ` : '';

          return `
            <div class="admin-carousel-preview-slide absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${idx === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}" style="transition: opacity 0.6s ease, transform 0.6s ease;">
              <img src="${escapeHtml(slide.image_url || '')}" alt="Slide ${idx + 1}" class="w-full h-full object-cover" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-300 p-3\\'><i class=\\'bi bi-badge-ad text-3xl mb-1\\'></i><span class=\\'text-[10px] font-bold\\'>SPACE IKLAN 2-KOLOM</span></div>';" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20"></div>
              ${ctaBtnHtml}
            </div>
          `;
        }).join('');
      } else {
        slidesContentHtml = `
          <div id="sponsor-carousel-preview-track" class="flex w-full h-full transition-transform duration-500 ease-in-out">
            ${slides.map((slide, idx) => {
              const ctaShadow = slide.cta_shadow || 'md';
              const ctaShadowClass = ctaShadow === 'none' ? 'shadow-none' : `shadow-${ctaShadow}`;
              const ctaBtnHtml = slide.cta_enabled ? `
                <div class="absolute bottom-3 right-3 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold ${ctaShadowClass} select-none pointer-events-none" style="background-color: ${slide.cta_bg_color || '#059669'}; color: ${slide.cta_text_color || '#ffffff'}; border-radius: ${slide.cta_border_radius || '12px'};">
                  <span class="truncate">${escapeHtml(slide.cta_text || 'Lihat Penawaran')}</span>
                  <i class="${escapeHtml(slide.cta_icon || 'bi-arrow-right')} text-xs"></i>
                </div>
              ` : '';

              return `
                <div class="w-full h-full shrink-0 relative block" style="width: 100%; height: 100%;">
                  <img src="${escapeHtml(slide.image_url || '')}" alt="Slide ${idx + 1}" class="w-full h-full object-cover" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-300 p-3\\'><i class=\\'bi bi-badge-ad text-3xl mb-1\\'></i><span class=\\'text-[10px] font-bold\\'>SPACE IKLAN 2-KOLOM</span></div>';" />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20"></div>
                  ${ctaBtnHtml}
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      box.innerHTML = `
        <div class="w-full min-h-[220px] h-[240px] flex flex-col justify-between overflow-hidden shadow-md relative group ${shadowClass}" style="${cardStyleCss}">
          <div class="relative w-full h-full ${bgVal !== 'transparent' ? '' : 'bg-slate-900'} overflow-hidden block shrink-0 shadow-inner" style="${bgVal !== 'transparent' ? `background-color: ${bgVal};` : ''}">
            ${slidesContentHtml}
            <span class="absolute top-2.5 left-2.5 bg-slate-900/85 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm z-20">
              SPONSOR 2-KOLOM
            </span>
            ${showArrows ? `
              <button type="button" class="admin-preview-prev-btn absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition opacity-80 hover:opacity-100 z-20 cursor-pointer shadow-md">
                <i class="bi bi-chevron-left text-xs"></i>
              </button>
              <button type="button" class="admin-preview-next-btn absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition opacity-80 hover:opacity-100 z-20 cursor-pointer shadow-md">
                <i class="bi bi-chevron-right text-xs"></i>
              </button>
            ` : ''}
            ${showDots ? `
              <div class="absolute bottom-2.5 left-0 right-0 flex items-center justify-center gap-1.5 z-20">
                ${dotsHtml}
              </div>
            ` : ''}
          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();

      let currentDoubleIdx = 0;
      const updateDoubleSlide = (targetIdx) => {
        currentDoubleIdx = (targetIdx + slides.length) % slides.length;
        const track = document.getElementById('sponsor-carousel-preview-track');
        const fadeSlides = box.querySelectorAll('.admin-carousel-preview-slide');
        const dots = box.querySelectorAll('.admin-carousel-preview-dot');
        if (animType === 'fade' || animType === 'scale') {
          fadeSlides.forEach((sl, idx) => {
            sl.style.opacity = idx === currentDoubleIdx ? '1' : '0';
            sl.style.zIndex = idx === currentDoubleIdx ? '10' : '0';
          });
        } else if (track) {
          track.style.transform = `translateX(-${currentDoubleIdx * 100}%)`;
        }
        dots.forEach((d, idx) => {
          d.className = `admin-carousel-preview-dot w-2 h-2 rounded-full ${idx === currentDoubleIdx ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'} transition-all cursor-pointer shadow-sm`;
        });
      };

      box.querySelectorAll('.admin-carousel-preview-dot').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetIdx = parseInt(btn.getAttribute('data-idx')) || 0;
          updateDoubleSlide(targetIdx);
        });
      });

      const prevBtn = box.querySelector('.admin-preview-prev-btn');
      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          updateDoubleSlide(currentDoubleIdx - 1);
        });
      }
      const nextBtn = box.querySelector('.admin-preview-next-btn');
      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          updateDoubleSlide(currentDoubleIdx + 1);
        });
      }

      if (slideMode === 'auto') {
        startAdminCarouselRotation(slides.length, interval, animType);
      }
      return;
    }

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

      box.innerHTML = `
        <div class="h-full flex flex-col justify-between overflow-hidden shadow-md relative group aspect-[3/4] ${shadowClass}" style="${cardStyleCss}">
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
      const title = (titleInputForm?.value || 'FLASH SALE 11.11').trim();

      const selectedIds = currentInternalProductIds || [];
      let displayProds = [];
      if (Array.isArray(selectedIds) && selectedIds.length > 0) {
        displayProds = selectedIds.map(id => allProducts.find(p => p.id === id)).filter(Boolean);
      }
      if (displayProds.length === 0) {
        const promoProds = allProducts.filter(p => p.has_monthly_discount || p.sales_count > 0);
        displayProds = promoProds.length >= 4 ? promoProds : allProducts;
      }

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
            <div class="group/mini block p-1 sm:p-1.5 rounded-xl border border-slate-200/90 bg-white shadow-2xs hover:shadow-sm transition flex flex-col justify-between">
              <div class="relative w-full aspect-square rounded-lg overflow-hidden bg-slate-100 shrink-0 mb-0.5 sm:mb-1">
                <img src="${escapeHtml(imgSrc)}" class="w-full h-full object-cover" alt="${escapeHtml(prod.name)}" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-xs\\'><i class=\\'bi bi-image\\'></i></div>';" />
                ${effDiscount.has_discount ? `
                  <span class="absolute top-1 right-1 bg-rose-600 text-white text-[8px] font-black px-1 py-0.2 rounded shadow-xs">
                    ${effDiscount.percent}%
                  </span>
                ` : ''}
              </div>
              <div>
                <p class="text-[9px] sm:text-[11px] font-bold text-slate-800 line-clamp-1 leading-tight" title="${escapeHtml(prod.name)}">${escapeHtml(prod.name)}</p>
                <p class="text-[9px] sm:text-[11px] font-black text-emerald-600 mt-0.5">Rp ${Math.round(finalPrice).toLocaleString('id-ID')}</p>
              </div>
            </div>
          `;
        }).join('');
      }

      const batchesHtml = batches.map((batchList, idx) => `
        <div class="admin-internal-preview-batch batch-${idx + 1} grid grid-cols-2 gap-1.5 sm:gap-2 my-auto py-1 ${idx === 0 ? '' : 'hidden'}">
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

      // HEADER BERSIH TANPA DOT, BADGE, & DIVIDER (REFAKTOR PERSYARATAN 1)
      box.innerHTML = `
        <div class="h-full flex flex-col justify-between p-3 sm:p-3.5 shadow-md transition-all duration-300 group relative ${shadowClass}" style="${cardStyleCss}">
          <!-- Header Judul Sponsor Bersih -->
          <div class="flex items-center justify-start pb-1 min-w-0">
            <h4 class="font-extrabold text-xs text-slate-900 tracking-tight line-clamp-1">${escapeHtml(title)}</h4>
          </div>

          <!-- Dynamic Batches Grid 2x2 Mini-Card Produk Internal -->
          <div class="flex-1 flex flex-col justify-center">
            ${batchesHtml}
          </div>

          <!-- Dynamic Dots Navigasi Slide -->
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

    // Default: 'ad1' (Sponsor Statis 1 Banner - 3:4 Portrait Murni)
    const image = (currentSponsorAdImages && currentSponsorAdImages[0])
      ? currentSponsorAdImages[0]
      : (document.getElementById('sponsor-image-input')?.value.trim() || 'assets/images/logo-songer-creative.png');
    const ctaLabel = document.getElementById('sponsor-cta-label')?.value.trim() || 'Lihat Tawaran';

    box.innerHTML = `
      <div class="h-full flex flex-col justify-between overflow-hidden shadow-md relative group aspect-[3/4] ${shadowClass}" style="${cardStyleCss}">
        <!-- Area Gambar Rasio 3:4 Portrait Murni Sesuai Revisi Wireframe -->
        <div class="relative w-full aspect-[3/4] max-h-[75%] bg-slate-100 overflow-hidden block shrink-0" style="border-top-left-radius: inherit; border-top-right-radius: inherit;">
          <img src="${image}" class="aspect-[3/4] w-full h-full object-cover rounded-[inherit]" onerror="this.onerror=null; this.outerHTML='<div class=\\'aspect-[3/4] w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-3 rounded-[inherit]\\'><i class=\\'bi bi-badge-ad text-3xl mb-1 text-slate-300\\'></i><span class=\\'text-[10px] font-bold text-slate-400\\'>SPACE IKLAN AVAILABLE</span></div>';" />
          <div class="absolute inset-0 bg-black/10 pointer-events-none"></div>
          <span class="absolute top-2.5 left-2.5 bg-slate-900/85 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm z-10">
            SPONSOR
          </span>
        </div>
        <!-- 2 Tombol Aksi Stacked Vertikal -->
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
        const item = promoList.find(p => String(p.id) === String(id));
        if (item) {
          item.active = e.target.checked;
          item.is_active = e.target.checked;
          promos.promo_list = promoList;
        }
        if (promos[id]) {
          promos[id].active = e.target.checked;
        }
        DB.updatePromos(promos);
        if (typeof DB.savePromotions === 'function') {
          DB.savePromotions(promos.promo_list);
        }
        currentPromotions = (typeof DB.getPromotions === 'function') ? DB.getPromotions() : promos.promo_list;
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
          promos.promo_list = promoList.filter(p => String(p.id) !== String(id));
          if (String(activePromoId) === String(id)) {
            activePromoId = promos.promo_list.length > 0 ? promos.promo_list[0].id : 'new';
          }
          DB.updatePromos(promos);
          if (typeof DB.savePromotions === 'function') {
            DB.savePromotions(promos.promo_list);
          }
          if (typeof DB.cleanOrphanedPromoLinks === 'function') {
            DB.cleanOrphanedPromoLinks(promos);
          }
          currentPromotions = (typeof DB.getPromotions === 'function') ? DB.getPromotions() : promos.promo_list;
          const toastFn = window.AdminApp?.showToast || window.App?.showToast || alert;
          toastFn('Program promo berhasil dihapus.', 'info');
          render();
        }
      });
    });

    // 2c. Input Kuota Tampil Promo di Tabel
    document.querySelectorAll('.input-promo-quota').forEach(inp => {
      const updateQuota = () => {
        const id = inp.getAttribute('data-id');
        const val = Math.max(1, parseInt(inp.value, 10) || 1);
        inp.value = val;
        if (id && typeof DB !== 'undefined') {
          const promos = DB.getPromos();
          let promoList = promos.promo_list || [];
          const item = promoList.find(p => String(p.id) === String(id));
          if (item) {
            item.display_quota = val;
            promos.promo_list = promoList;
            DB.updatePromos(promos);
            if (typeof DB.savePromotions === 'function') {
              DB.savePromotions(promos.promo_list);
            }
            currentPromotions = (typeof DB.getPromotions === 'function') ? DB.getPromotions() : promos.promo_list;
          }
        }
      };
      inp.addEventListener('change', updateQuota);
      inp.addEventListener('blur', updateQuota);
    });

    // 3. Save All Promos Button (Top Right)
    const btnSaveAll = document.getElementById('btn-save-all-promos');
    if (btnSaveAll) {
      btnSaveAll.addEventListener('click', (e) => saveAllConfigurations(e));
    }

    const btnSaveSingle = document.getElementById('btn-save-single-promo');
    if (btnSaveSingle) {
      btnSaveSingle.addEventListener('click', (e) => saveAllConfigurations(e));
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
        'promo-cta1-link',
        'promo-cta2-text',
        'promo-cta2-link'
      ];
      textInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updatePromoCardLivePreview);
      });

      const changeInputs = [
        'promo-discount-type',
        'promo-start-datetime',
        'promo-end-datetime',
        'promo-border-radius',
        'promo-box-shadow',
        'promo-cta-mode',
        'promo-show-timer'
      ];
      changeInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', updatePromoCardLivePreview);
      });

      // Color pickers with text field sync
      const colorPairs = [
        { picker: 'promo-title-color', text: 'promo-title-color-text' },
        { picker: 'promo-desc-color', text: 'promo-desc-color-text' },
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

      // Timer switch/dropdown
      const timerToggle = document.getElementById('promo-show-timer');
      if (timerToggle) timerToggle.addEventListener('change', updatePromoCardLivePreview);

      // Dual CTA Theme Default Switch
      const ctaThemeToggle = document.getElementById('promo-cta-theme-default');
      if (ctaThemeToggle) {
        ctaThemeToggle.addEventListener('change', (e) => {
          const box1 = document.getElementById('promo-cta1-color-box');
          const box2 = document.getElementById('promo-cta2-color-box');
          if (box1) box1.className = e.target.checked ? 'hidden grid-cols-2 gap-2 pt-1 border-t border-slate-100' : 'grid grid-cols-2 gap-2 pt-1 border-t border-slate-100';
          if (box2) box2.className = e.target.checked ? 'hidden grid-cols-2 gap-2 pt-1 border-t border-slate-100' : 'grid grid-cols-2 gap-2 pt-1 border-t border-slate-100';
          updatePromoCardLivePreview();
        });
      }

      // CTA Mode dropdown
      const ctaModeSel = document.getElementById('promo-cta-mode');
      if (ctaModeSel) {
        ctaModeSel.addEventListener('change', updatePromoCardLivePreview);
      }

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
      // Row click to select/edit sponsor
      document.querySelectorAll('.sponsor-row-item').forEach(r => {
        r.addEventListener('click', () => {
          const id = r.getAttribute('data-id');
          if (id) {
            currentEditingSponsorId = id;
            currentEditingSponsorMobileOnly = false;
            const sp = (typeof DB !== 'undefined' && DB.getSponsorById) ? DB.getSponsorById(id) : null;
            if (sp && sp.type) activeSponsorType = sp.type;
            currentCarouselSlides = [];
            currentInternalProductIds = [];
            currentSponsorAdImages = [];
            render();
            const formEl = document.getElementById('sponsor-title-input') || document.getElementById('sponsor-card-live-preview');
            if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
          }
        });
      });

      // Tombol Tambah Card Sponsor Baru (dengan Validasi Bertingkat Sesuai Spesifikasi)
      const btnAddSponsor = document.getElementById('btn-add-new-sponsor');
      if (btnAddSponsor) {
        btnAddSponsor.addEventListener('click', () => {
          const allProds = (typeof DB !== 'undefined' && DB.getAllProducts) ? DB.getAllProducts().filter(p => p.is_active !== false) : [];
          const prodCount = allProds.length;
          if (prodCount < 5) {
            // Kasus 1: Kurang dari batas minimal global (< 5 produk) - Blokir
            showSponsorValidationModal({
              type: 'blocked',
              title: 'Batas Minimum Produk Belum Terpenuhi',
              message: 'Jumlah produk Anda belum memenuhi batas minimum untuk menambahkan Card Sponsor baru. Silakan tambahkan produk terlebih dahulu.',
              productCount: prodCount
            });
          } else if (prodCount < 11) {
            // Kasus 2: Kuota terpenuhi di mobile saja (5 - 10 produk) - Konfirmasi Mobile Only
            showSponsorValidationModal({
              type: 'confirm',
              title: 'Pemberitahuan Penayangan Sponsor (Mobile Only)',
              message: 'Sponsor ini hanya akan tampil di versi mobile/ponsel karena jumlah produk toko belum mencapai batas minimum untuk menampilkan sponsor baru di versi desktop.',
              productCount: prodCount,
              onConfirm: () => {
                currentEditingSponsorId = 'new';
                currentEditingSponsorMobileOnly = true;
                activeSponsorType = 'ad1';
                currentCarouselSlides = [];
                currentInternalProductIds = [];
                currentSponsorAdImages = [];
                render();
                const formEl = document.getElementById('sponsor-title-input') || document.getElementById('sponsor-card-live-preview');
                if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
              }
            });
          } else {
            // Kasus 3: Kuota terpenuhi penuh (>= 11 produk)
            currentEditingSponsorId = 'new';
            currentEditingSponsorMobileOnly = false;
            activeSponsorType = 'ad1';
            currentCarouselSlides = [];
            currentInternalProductIds = [];
            currentSponsorAdImages = [];
            render();
            const formEl = document.getElementById('sponsor-title-input') || document.getElementById('sponsor-card-live-preview');
            if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }

      // Tombol Batal Buat Sponsor Baru
      const btnCancelSponsor = document.getElementById('btn-cancel-create-sponsor');
      if (btnCancelSponsor) {
        btnCancelSponsor.addEventListener('click', () => {
          const spList = (typeof DB !== 'undefined' && DB.getSponsorList) ? DB.getSponsorList() : [];
          currentEditingSponsorId = spList.length > 0 ? spList[0].id : null;
          currentEditingSponsorMobileOnly = false;
          render();
        });
      }

      // Tombol Edit di tabel
      document.querySelectorAll('.btn-edit-sponsor').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          if (id) {
            currentEditingSponsorId = id;
            currentEditingSponsorMobileOnly = false;
            const sp = (typeof DB !== 'undefined' && DB.getSponsorById) ? DB.getSponsorById(id) : null;
            if (sp && sp.type) activeSponsorType = sp.type;
            currentCarouselSlides = [];
            currentInternalProductIds = [];
            currentSponsorAdImages = [];
            render();
            const formEl = document.getElementById('sponsor-title-input') || document.getElementById('sponsor-card-live-preview');
            if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
          }
        });
      });

      // Tombol Hapus di tabel
      document.querySelectorAll('.btn-delete-sponsor').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          if (id && confirm('Hapus kartu sponsor ini secara permanen?')) {
            if (typeof DB !== 'undefined' && DB.deleteSponsor) {
              DB.deleteSponsor(id);
            }
            const spList = (typeof DB !== 'undefined' && DB.getSponsorList) ? DB.getSponsorList() : [];
            if (currentEditingSponsorId === id) {
              currentEditingSponsorId = spList.length > 0 ? spList[0].id : null;
            }
            const toastFn = window.AdminApp?.showToast || window.App?.showToast || alert;
            toastFn('Kartu sponsor berhasil dihapus.', 'info');
            render();
          }
        });
      });

      // Toggle status aktif langsung dari tabel
      document.querySelectorAll('.toggle-sponsor-status').forEach(toggle => {
        toggle.addEventListener('change', (e) => {
          e.stopPropagation();
          const id = toggle.getAttribute('data-id');
          if (id && typeof DB !== 'undefined' && DB.updateSponsor) {
            DB.updateSponsor(id, { active: toggle.checked, is_active: toggle.checked });
            const toastFn = window.AdminApp?.showToast || window.App?.showToast || alert;
            toastFn(`Status kartu sponsor berhasil diperbarui.`, 'success');
            render();
          }
        });
      });

      // Input Kuota Tampil di tabel
      document.querySelectorAll('.input-sponsor-quota').forEach(inp => {
        const updateQuota = () => {
          const id = inp.getAttribute('data-id');
          const val = Math.max(1, parseInt(inp.value, 10) || 1);
          inp.value = val;
          if (id && typeof DB !== 'undefined' && DB.updateSponsor) {
            DB.updateSponsor(id, { display_quota: val });
          }
        };
        inp.addEventListener('change', updateQuota);
        inp.addEventListener('blur', updateQuota);
      });

      // Pilihan Model Kartu (Radio)
      document.querySelectorAll('input[name="sponsor_card_model"]').forEach(r => {
        r.addEventListener('change', (e) => {
          activeSponsorType = e.target.value;
          render();
        });
      });

      // Pilihan Kepemilikan Slot Sponsor (Radio)
      document.querySelectorAll('input[name="sponsor_owner_type"]').forEach(r => {
        r.addEventListener('change', (e) => {
          activeSponsorOwnerType = e.target.value;
          const boxContract = document.getElementById('box-contract-model');
          const boxSelfInfo = document.getElementById('box-self-owner-info');
          if (boxContract) {
            if (activeSponsorOwnerType === 'third_party') boxContract.classList.remove('hidden');
            else boxContract.classList.add('hidden');
          }
          if (boxSelfInfo) {
            if (activeSponsorOwnerType === 'self') boxSelfInfo.classList.remove('hidden');
            else boxSelfInfo.classList.add('hidden');
          }
          if (activeSponsorType === 'carousel' || activeSponsorType === 'double_width') {
            renderCarouselSlideRows(currentCarouselSlides);
          }
          updateSponsorPreviews();
        });
      });

      // Pilihan Model Kontrak Slot Iklan (Radio)
      document.querySelectorAll('input[name="sponsor_contract_model"]').forEach(r => {
        r.addEventListener('change', (e) => {
          activeContractModel = e.target.value;
          const boxAdv = document.getElementById('box-advertiser-name');
          if (boxAdv) {
            if (activeContractModel === 'wholesale') boxAdv.classList.remove('hidden');
            else boxAdv.classList.add('hidden');
          }
          if (activeSponsorType === 'carousel' || activeSponsorType === 'double_width') {
            renderCarouselSlideRows(currentCarouselSlides);
          }
          updateSponsorPreviews();
        });
      });

      // Autocomplete Produk Toko untuk Model 1 (ad1)
      const btnAd1Apply = document.getElementById('btn-ad1-apply-product');
      if (btnAd1Apply) {
        btnAd1Apply.addEventListener('click', () => {
          const sel = document.getElementById('sponsor-ad1-linked-prod');
          const prodId = sel ? sel.value : null;
          if (!prodId) {
            const toastFn = window.AdminApp?.showToast || window.App?.showToast || alert;
            toastFn('Pilih produk dari katalog toko terlebih dahulu.', 'warning');
            return;
          }
          const allProds = (typeof DB !== 'undefined' && DB.getAllProducts) ? DB.getAllProducts() : ((typeof DB !== 'undefined' && DB.getProducts) ? DB.getProducts() : []);
          const prod = allProds.find(p => String(p.id) === String(prodId));
          if (prod) {
            const titleInp = document.getElementById('sponsor-title-input');
            const subInp = document.getElementById('sponsor-subtitle-input');
            const ctaTargetInp = document.getElementById('sponsor-cta-target');
            const ctaLabelInp = document.getElementById('sponsor-cta-label');
            const imgInp = document.getElementById('sponsor-image-input');
            if (titleInp) titleInp.value = prod.name;
            if (subInp) subInp.value = prod.description ? prod.description.slice(0, 80) : `Dapatkan sekarang hanya Rp ${Math.round(prod.price || prod.starting_price || 0).toLocaleString('id-ID')}`;
            if (ctaTargetInp) ctaTargetInp.value = `product.html?id=${prod.id}`;
            if (ctaLabelInp) ctaLabelInp.value = 'Beli Sekarang';
            const pImg = (Array.isArray(prod.images) && prod.images.length > 0) ? prod.images[0] : (prod.image_url || '');
            if (pImg) {
              if (imgInp) imgInp.value = pImg;
              currentSponsorAdImages = [pImg];
            }
            updateSponsorPreviews();
          }
        });
      }

      // Toggle Status Aktif di Form
      const activeToggle = document.getElementById('sponsor-active-toggle');
      const activeLabel = document.getElementById('label-sponsor-active');
      if (activeToggle && activeLabel) {
        activeToggle.addEventListener('change', (e) => {
          activeLabel.textContent = e.target.checked ? 'Slot Aktif' : 'Nonaktif';
          activeLabel.className = `text-xs font-bold ${e.target.checked ? 'text-emerald-700' : 'text-slate-400'}`;
        });
      }

      // Schedule: Toggle Selalu Aktif vs Rentang Datetime
      const chkAlwaysActive = document.getElementById('chk-sponsor-always-active');
      if (chkAlwaysActive) {
        chkAlwaysActive.addEventListener('change', (e) => {
          const rangeBox = document.getElementById('sponsor-datetime-range-box');
          if (rangeBox) {
            if (e.target.checked) rangeBox.classList.add('hidden');
            else rangeBox.classList.remove('hidden');
          }
          updateSponsorPreviews();
        });
      }
      const startDtInp = document.getElementById('sponsor-start-datetime');
      if (startDtInp) startDtInp.addEventListener('change', updateSponsorPreviews);
      const endDtInp = document.getElementById('sponsor-end-datetime');
      if (endDtInp) endDtInp.addEventListener('change', updateSponsorPreviews);

      // Checkbox Dynamic Promo Auto-Activation
      document.querySelectorAll('.chk-linked-promo').forEach(cb => {
        cb.addEventListener('change', updateSponsorPreviews);
      });

      // Model-specific handlers
      if (activeSponsorType === 'carousel' || activeSponsorType === 'double_width') {
        const isDoubleWidth = activeSponsorType === 'double_width';
        const maxLimit = isDoubleWidth ? 10 : 5;
        renderCarouselSlideRows(currentCarouselSlides);
        initUnifiedUploader({
          id: 'sponsor-carousel-uploader',
          initialImages: currentCarouselSlides.map(s => s.image_url).filter(Boolean),
          isMulti: true,
          onChange: (imgs) => {
            currentCarouselSlides = imgs.slice(0, maxLimit).map((img, idx) => {
              const existing = currentCarouselSlides[idx];
              return {
                image_url: img,
                target_url: existing ? existing.target_url : '',
                click_image_enabled: existing ? existing.click_image_enabled !== false : true,
                cta_enabled: existing ? existing.cta_enabled : false,
                cta_text: existing?.cta_text || 'Lihat Penawaran',
                cta_link: existing?.cta_link || '',
                cta_bg_color: existing?.cta_bg_color || '#059669',
                cta_text_color: existing?.cta_text_color || '#ffffff',
                cta_border_radius: existing?.cta_border_radius || '12px',
                cta_icon: existing?.cta_icon || 'bi-arrow-right',
                cta_shadow: existing?.cta_shadow || 'md'
              };
            });
            renderCarouselSlideRows(currentCarouselSlides);
            const badge = document.getElementById('carousel-slide-counter-badge');
            if (badge) badge.textContent = `${currentCarouselSlides.length} / ${maxLimit} Slide`;
            updateSponsorPreviews();
          }
        });

        const btnAddSlide = document.getElementById('btn-add-carousel-slide');
        if (btnAddSlide) {
          btnAddSlide.addEventListener('click', () => {
            if (currentCarouselSlides.length < maxLimit) {
              currentCarouselSlides.push({
                image_url: 'assets/images/logo-songer-creative.png',
                target_url: '',
                click_image_enabled: true,
                cta_enabled: false,
                cta_text: 'Lihat Penawaran',
                cta_link: '',
                cta_bg_color: '#059669',
                cta_text_color: '#ffffff',
                cta_border_radius: '12px',
                cta_icon: 'bi-arrow-right',
                cta_shadow: 'md'
              });
              renderCarouselSlideRows(currentCarouselSlides);
              const badge = document.getElementById('carousel-slide-counter-badge');
              if (badge) badge.textContent = `${currentCarouselSlides.length} / ${maxLimit} Slide`;
              updateSponsorPreviews();
            }
          });
        }

        const intervalInp = document.getElementById('carousel-interval-input');
        if (intervalInp) intervalInp.addEventListener('input', updateSponsorPreviews);

        const animSelect = document.getElementById('carousel-anim-type-select');
        if (animSelect) animSelect.addEventListener('change', updateSponsorPreviews);

        const slideModeSel = document.getElementById('sponsor-slide-mode-select');
        if (slideModeSel) slideModeSel.addEventListener('change', updateSponsorPreviews);

        const titleInp = document.getElementById('sponsor-title-input');
        if (titleInp) titleInp.addEventListener('input', updateSponsorPreviews);

      } else if (activeSponsorType === 'internal') {
        const titleInp = document.getElementById('sponsor-internal-title-input');
        if (titleInp) titleInp.addEventListener('input', updateSponsorPreviews);

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
        // 'ad1'
        initUnifiedUploader({
          id: 'sponsor-ad1-uploader',
          images: currentSponsorAdImages,
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
          document.getElementById('sponsor-cta-target')
        ];
        sponsorInputs.forEach(inp => {
          if (inp) inp.addEventListener('input', updateSponsorPreviews);
        });

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

      // Kustomisasi Style Individual:
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

      // Border Width Controls
      const borderWidthSel = document.getElementById('sponsor-card-border-width-select');
      if (borderWidthSel) borderWidthSel.addEventListener('change', updateSponsorPreviews);

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

      // Box Shadow Controls
      const shadowSel = document.getElementById('sponsor-card-shadow-select');
      if (shadowSel) shadowSel.addEventListener('change', updateSponsorPreviews);

      // Animation Controls
      const animSel = document.getElementById('sponsor-card-anim-select');
      if (animSel) animSel.addEventListener('change', updateSponsorPreviews);

      // Kuota Input Controls
      const quotaInput = document.getElementById('sponsor-card-quota-input');
      if (quotaInput) quotaInput.addEventListener('input', updateSponsorPreviews);

      // Tombol Simpan Konfigurasi Sponsor Ini
      const btnSaveSponsor = document.getElementById('btn-save-single-sponsor');
      if (btnSaveSponsor) {
        btnSaveSponsor.addEventListener('click', (e) => saveAllConfigurations(e));
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

  function saveAllConfigurations(e) {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    const current = DB.getPromos();

    // 1. Promo Toko Form Values (Tanpa Dummy Otomatis)
    let promoList = (Array.isArray(current.promo_list) && current.promo_list.length > 0)
      ? [...current.promo_list]
      : (Array.isArray(currentPromotions) ? [...currentPromotions] : []);

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

      const descColor = document.getElementById('promo-desc-color')?.value || '#64748b';
      const borderRadius = document.getElementById('promo-border-radius')?.value || '16px';
      const boxShadow = document.getElementById('promo-box-shadow')?.value || 'sm';

      const timerSelect = document.getElementById('promo-show-timer');
      const showTimer = timerSelect ? (timerSelect.value === 'true' || timerSelect.value === true) : (document.getElementById('promo-show-timer')?.checked ?? true);

      const useThemeDefault = document.getElementById('promo-cta-theme-default')?.checked ?? true;
      const ctaModeSelect = document.getElementById('promo-cta-mode');
      const ctaMode = ctaModeSelect ? ctaModeSelect.value : (document.querySelector('input[name="promo_cta_mode"]:checked')?.value || 'dual');
      const cta1Text = document.getElementById('promo-cta1-text')?.value.trim() || 'Ingatkan Saya';
      const cta1Link = document.getElementById('promo-cta1-link')?.value.trim() || '';
      const cta1Bg = document.getElementById('promo-cta1-bg')?.value || '#33b589';
      const cta1TextColor = document.getElementById('promo-cta1-text-color')?.value || '#ffffff';
      const cta2Text = document.getElementById('promo-cta2-text')?.value.trim() || 'Konsultasi Desain & Cetak';
      const cta2Link = document.getElementById('promo-cta2-link')?.value.trim() || '';
      const cta2Bg = document.getElementById('promo-cta2-bg')?.value || '#25d366';
      const cta2TextColor = document.getElementById('promo-cta2-text-color')?.value || '#ffffff';

      const styleObj = {
        bg_type: bgType,
        bg_color1: bgColor1,
        bg_color2: bgColor2,
        bg_angle: bgAngle,
        title_color: titleColor,
        desc_color: descColor,
        discount_color: discColor,
        border_radius: borderRadius,
        box_shadow: boxShadow,
        border_color: 'transparent'
      };

      const promoData = {
        id: String((activePromoId && activePromoId !== 'new') ? activePromoId : ('promo_' + Date.now())),
        active,
        is_active: active,
        display_quota: Math.max(1, parseInt(document.getElementById('promo-display-quota-input')?.value, 10) || 1),
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
        style: styleObj,
        title_color: titleColor,
        desc_color: descColor,
        discount_color: discColor,
        bg_type: bgType,
        bg_color1: bgColor1,
        bg_color2: bgColor2,
        bg_angle: bgAngle,
        border_radius: borderRadius,
        box_shadow: boxShadow,
        show_timer: showTimer,
        use_theme_default: useThemeDefault,
        cta_mode: ctaMode,
        cta1_text: cta1Text,
        cta1_link: cta1Link,
        cta1_bg: cta1Bg,
        cta1_text_color: cta1TextColor,
        cta2_text: cta2Text,
        cta2_link: cta2Link,
        cta2_bg: cta2Bg,
        cta2_text_color: cta2TextColor
      };

      if (typeof DB !== 'undefined' && typeof DB.savePromo === 'function') {
        DB.savePromo(promoData);
      }

      if (!activePromoId || activePromoId === 'new') {
        promoList.push(promoData);
        activePromoId = promoData.id;
      } else {
        const idx = promoList.findIndex(p => String(p.id) === String(activePromoId));
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

      // Pemanggilan DB.savePromotions() benar-benar melakukan penulisan ke localStorage
      if (typeof DB.savePromotions === 'function') {
        DB.savePromotions(promoList);
      } else {
        DB.updatePromos({ promo_list: promoList });
        try {
          localStorage.setItem('pos_promotions', JSON.stringify(promoList));
        } catch (err) {}
      }

      // Sinkronisasi state memori (currentPromotions) secara langsung setelah simpan
      currentPromotions = (typeof DB.getPromotions === 'function') ? DB.getPromotions() : promoList;

      // Feedback kuota produk
      const toastFn = window.AdminApp?.showToast || window.App?.showToast || alert;
      if (!hasEnoughQuota) {
        toastFn(`Perhatian Kuota: Toko saat ini memiliki ${activeProducts.length} produk aktif. Dibutuhkan minimal 8 produk agar slot banner etalase tampil optimal. Program promo tetap tersimpan.`, 'warning');
      } else {
        toastFn('Program promo toko berhasil disimpan dan langsung aktif!', 'success');
      }
      render();
      return;
    }

    // 2. Sponsor Ads Form Values (Unlimited Cards, Kuota, Schedule & Style Individual)
    if (activeTab === 'sponsors') {
      const active = document.getElementById('sponsor-active-toggle')?.checked ?? true;
      const quota = parseInt(document.getElementById('sponsor-card-quota-input')?.value, 10) || 1;
      const price = parseFloat(document.getElementById('sponsor-price-input')?.value) || 0;
      const anim = document.getElementById('sponsor-card-anim-select')?.value || 'none';
      const radius = document.getElementById('sponsor-card-radius-input')?.value.trim() || '16px';
      const borderWidth = document.getElementById('sponsor-card-border-width-select')?.value || '1px';
      const borderColor = document.getElementById('sponsor-card-border-input')?.value.trim() || '#e2e8f0';
      const shadow = document.getElementById('sponsor-card-shadow-select')?.value || 'sm';
      const bgInput = document.getElementById('sponsor-card-bg-input');
      const bgColor = bgInput?.value.trim() || (activeSponsorType === 'internal' ? '#ffffff' : 'transparent');

      const ownerType = document.querySelector('input[name="sponsor_owner_type"]:checked')?.value || activeSponsorOwnerType || (activeSponsorType === 'internal' ? 'self' : 'third_party');
      const contractModel = document.querySelector('input[name="sponsor_contract_model"]:checked')?.value || activeContractModel || 'wholesale';
      const advertiserName = document.getElementById('sponsor-advertiser-name-input')?.value.trim() || '';

      const sponsorData = {
        type: activeSponsorType || 'ad1',
        card_model: activeSponsorType || 'ad1',
        sponsor_owner_type: ownerType,
        contract_model: contractModel,
        advertiser_name: advertiserName,
        active: active,
        is_active: active,
        display_quota: quota,
        price: price,
        animation: anim,
        border_radius: radius,
        border_width: borderWidth,
        border_color: borderColor,
        shadow: shadow,
        bg_color: bgColor
      };

      if (activeSponsorType === 'double_width') {
        sponsorData.title = document.getElementById('sponsor-title-input')?.value.trim() || 'Sponsor Spesial 2-Kolom';
        sponsorData.slide_mode = document.getElementById('sponsor-slide-mode-select')?.value || 'auto';
        sponsorData.auto_slide_interval = parseInt(document.getElementById('carousel-interval-input')?.value, 10) || 4000;
        sponsorData.animation_type = document.getElementById('carousel-anim-type-select')?.value || 'slide';
        sponsorData.slides = (currentCarouselSlides || []).slice(0, 10);
        sponsorData.is_always_active = document.getElementById('chk-sponsor-always-active')?.checked ?? true;
        sponsorData.start_datetime = document.getElementById('sponsor-start-datetime')?.value || '';
        sponsorData.end_datetime = document.getElementById('sponsor-end-datetime')?.value || '';
        if (contractModel === 'per_slide' && Array.isArray(sponsorData.slides)) {
          const sumSlidePrice = sponsorData.slides.reduce((acc, s) => acc + (parseFloat(s.contract_price || s.price) || 0), 0);
          if (sumSlidePrice > 0) sponsorData.price = sumSlidePrice;
        }
      } else if (activeSponsorType === 'carousel') {
        sponsorData.title = document.getElementById('sponsor-title-input')?.value.trim() || 'Sponsor Slider Carousel';
        sponsorData.slide_mode = 'auto';
        sponsorData.auto_slide_interval = parseInt(document.getElementById('carousel-interval-input')?.value, 10) || 4000;
        sponsorData.animation_type = document.getElementById('carousel-anim-type-select')?.value || 'slide';
        sponsorData.slides = (currentCarouselSlides || []).slice(0, 5);
        sponsorData.is_always_active = document.getElementById('chk-sponsor-always-active')?.checked ?? true;
        sponsorData.start_datetime = document.getElementById('sponsor-start-datetime')?.value || '';
        sponsorData.end_datetime = document.getElementById('sponsor-end-datetime')?.value || '';
        if (contractModel === 'per_slide' && Array.isArray(sponsorData.slides)) {
          const sumSlidePrice = sponsorData.slides.reduce((acc, s) => acc + (parseFloat(s.contract_price || s.price) || 0), 0);
          if (sumSlidePrice > 0) sponsorData.price = sumSlidePrice;
        }
      } else if (activeSponsorType === 'internal') {
        sponsorData.title = document.getElementById('sponsor-internal-title-input')?.value.trim() || 'FLASH SALE 11.11';
        sponsorData.product_ids = currentInternalProductIds || [];
        sponsorData.is_always_active = true;
        // String ID consistency
        sponsorData.linked_promo_ids = Array.from(document.querySelectorAll('.chk-linked-promo:checked')).map(cb => String(cb.value));
      } else {
        // 'ad1'
        sponsorData.title = document.getElementById('sponsor-title-input')?.value.trim() || 'Layanan Mitra & Desain Prioritas';
        sponsorData.subtitle = document.getElementById('sponsor-subtitle-input')?.value.trim() || '';
        sponsorData.image_url = (currentSponsorAdImages && currentSponsorAdImages[0])
          ? currentSponsorAdImages[0]
          : (document.getElementById('sponsor-image-input')?.value.trim() || 'assets/images/logo-songer-creative.png');
        sponsorData.cta_type = document.getElementById('sponsor-cta-type')?.value || 'whatsapp';
        sponsorData.cta_label = document.getElementById('sponsor-cta-label')?.value.trim() || 'Lihat Tawaran';
        sponsorData.cta_target = document.getElementById('sponsor-cta-target')?.value.trim() || '';
        sponsorData.is_always_active = document.getElementById('chk-sponsor-always-active')?.checked ?? true;
        sponsorData.start_datetime = document.getElementById('sponsor-start-datetime')?.value || '';
        sponsorData.end_datetime = document.getElementById('sponsor-end-datetime')?.value || '';
        const linkedProdId = document.getElementById('sponsor-ad1-linked-prod')?.value || '';
        if (linkedProdId) {
          sponsorData.linked_product_id = linkedProdId;
          sponsorData.target_product_id = linkedProdId;
        }
      }

      if (currentEditingSponsorId === 'new') {
        sponsorData.mobile_only_ready = currentEditingSponsorMobileOnly;
        const newSponsor = DB.addSponsor(sponsorData);
        currentEditingSponsorId = newSponsor.id;
        currentEditingSponsorMobileOnly = false;
      } else if (currentEditingSponsorId) {
        const existing = DB.getSponsorById(currentEditingSponsorId);
        sponsorData.mobile_only_ready = existing ? existing.mobile_only_ready : false;
        DB.updateSponsor(currentEditingSponsorId, sponsorData);
      } else {
        const newSponsor = DB.addSponsor(sponsorData);
        currentEditingSponsorId = newSponsor.id;
      }

      const allSponsors = (typeof DB.getSponsors === 'function') ? DB.getSponsors() : (DB.getSponsorList ? DB.getSponsorList() : []);
      if (typeof DB.saveSponsors === 'function') {
        DB.saveSponsors(allSponsors);
      }

      // Sinkronisasi state memori (currentSponsors) secara langsung setelah simpan
      currentSponsors = (typeof DB.getSponsors === 'function') ? DB.getSponsors() : allSponsors;

      const toastFn = window.AdminApp?.showToast || window.App?.showToast || alert;
      toastFn('Konfigurasi kartu sponsor berhasil disimpan!', 'success');
      render();
      return;
    }

    if (typeof DB.savePromotions === 'function') {
      DB.savePromotions(promoList);
    } else {
      DB.updatePromos({ promo_list: promoList });
      try {
        localStorage.setItem('pos_promotions', JSON.stringify(promoList));
      } catch (e) {}
    }
    currentPromotions = (typeof DB.getPromotions === 'function') ? DB.getPromotions() : promoList;
    render();
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
    render,
    updatePromoCardLivePreview,
    updateSponsorPreviews
  };
})();

window.PromoManager = PromoManager;














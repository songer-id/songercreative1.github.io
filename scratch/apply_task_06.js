const fs = require('fs');

// --- 1. EDIT css/admin.css ---
let css = fs.readFileSync('css/admin.css', 'utf8');

const oldCssTarget = `  /* Mobile Live Preview Overlay & Sheet (Z-index Stack: Backdrop 90, Sheet 95, Scoped Modal 100) */
  #mobile-preview-backdrop {
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100dvh !important;
    background-color: rgba(15, 23, 42, 0.72) !important;
    backdrop-filter: blur(2px) !important;
    z-index: 90 !important;
  }

  #mobile-preview-sheet {
    z-index: 95 !important;
  }`;

const newCssReplacement = `  /* Saat mobile preview aktif, naikkan stacking context viewport di atas topbar header (z-40) */
  #admin-main-viewport.mobile-preview-active,
  #admin-main-viewport:has(#mobile-preview-backdrop:not(.hidden)) {
    z-index: 90 !important;
  }

  /* Mobile Live Preview Overlay & Sheet (Z-index Stack: Backdrop 90, Sheet 95, Scoped Modal 100) */
  #mobile-preview-backdrop {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    min-height: 100vh !important;
    min-height: 100dvh !important;
    min-height: -webkit-fill-available !important;
    background-color: rgba(15, 23, 42, 0.72) !important;
    backdrop-filter: blur(2px) !important;
    -webkit-backdrop-filter: blur(2px) !important;
    z-index: 90 !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  #mobile-preview-sheet {
    position: fixed !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    inset-x: 0 !important;
    max-height: 88dvh !important;
    max-height: min(88vh, 88dvh) !important;
    z-index: 95 !important;
    display: flex !important;
    flex-direction: column !important;
    overscroll-behavior: contain !important;
  }

  #mobile-preview-body {
    flex: 1 1 auto !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    overscroll-behavior: contain !important;
    padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px)) !important;
  }

  /* Step 1 Mobile Live Preview: Latar area pratinjau mengikuti warna Body tema aktif */
  #view-product-form[data-step="1"] #mobile-preview-sheet,
  #view-product-form[data-step="1"] #mobile-preview-body,
  #product-form-wrapper[data-step="1"] #mobile-preview-sheet,
  #product-form-wrapper[data-step="1"] #mobile-preview-body {
    background-color: var(--color-body-bg, #f8fafc);
  }`;

const normalizeLFs = str => str.replace(/\r\n/g, '\n');
const isCRLF = css.includes('\r\n');

let normCss = normalizeLFs(css);
if (normCss.includes(normalizeLFs(oldCssTarget))) {
  normCss = normCss.replace(normalizeLFs(oldCssTarget), normalizeLFs(newCssReplacement));
  if (isCRLF) {
    normCss = normCss.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync('css/admin.css', normCss, 'utf8');
  console.log('SUCCESS: Updated css/admin.css');
} else {
  console.log('NOTICE: css/admin.css already updated or target changed.');
}

// --- 2. EDIT js/product-form.js ---
let pf = fs.readFileSync('js/product-form.js', 'utf8');
let normPf = normalizeLFs(pf);
const isPfCRLF = pf.includes('\r\n');

// 2A. Remove Breadcrumb and clean wrapper
const oldBreadcrumbTarget = `<div class="w-full max-w-none \${currentStep === 2 ? 'space-y-0' : 'space-y-5 sm:space-y-6'} pb-8 sm:pb-12" id="product-form-wrapper">

        <!-- Header Top Bar (Hanya tampil di Step 1) -->
        <div id="product-form-top-bar" class="\${currentStep === 2 ? 'hidden' : 'flex'} items-center justify-between border-b border-slate-200 pb-3 gap-3">
          <div class="flex items-center gap-2 text-sm text-slate-500">
            <button type="button" id="btn-back-to-list" class="hover:text-[var(--color-primary)] transition flex items-center gap-1 font-medium cursor-pointer">
              <i data-lucide="arrow-left" class="w-4 h-4"></i> Daftar Produk
            </button>
            <span>/</span>
            <span class="text-slate-800 font-semibold">\${formMode === 'edit' ? 'Edit Produk' : 'Tambah Produk Baru'}</span>
          </div>
        </div>`;

const newBreadcrumbReplacement = `<div class="w-full max-w-none space-y-0 pb-8 sm:pb-12" id="product-form-wrapper" data-step="\${currentStep}">`;

if (normPf.includes(normalizeLFs(oldBreadcrumbTarget))) {
  normPf = normPf.replace(normalizeLFs(oldBreadcrumbTarget), normalizeLFs(newBreadcrumbReplacement));
  console.log('SUCCESS: Removed breadcrumb from js/product-form.js');
}

// 2B. Update updateStepVisibility to remove topBar references and update data-step
const oldUsvTarget = `function updateStepVisibility() {
    const p1 = document.getElementById('step-pane-1');
    const p2 = document.getElementById('step-pane-2');
    const topBar = document.getElementById('product-form-top-bar');
    const wrapper = document.getElementById('product-form-wrapper');
    const wizardCol = document.getElementById('wizard-form-col');

    if (topBar) {
      if (currentStep === 2) {
        topBar.classList.add('hidden');
        topBar.classList.remove('flex');
      } else {
        topBar.classList.remove('hidden');
        topBar.classList.add('flex');
      }
    }

    if (wrapper) {
      if (currentStep === 2) {
        wrapper.classList.remove('space-y-5', 'sm:space-y-6');
        wrapper.classList.add('space-y-0');
      } else {
        wrapper.classList.add('space-y-5', 'sm:space-y-6');
        wrapper.classList.remove('space-y-0');
      }
    }`;

const newUsvReplacement = `function updateStepVisibility() {
    const p1 = document.getElementById('step-pane-1');
    const p2 = document.getElementById('step-pane-2');
    const wrapper = document.getElementById('product-form-wrapper');
    const wizardCol = document.getElementById('wizard-form-col');

    if (wrapper) {
      wrapper.setAttribute('data-step', String(currentStep));
    }`;

if (normPf.includes(normalizeLFs(oldUsvTarget))) {
  normPf = normPf.replace(normalizeLFs(oldUsvTarget), normalizeLFs(newUsvReplacement));
  console.log('SUCCESS: Updated updateStepVisibility in js/product-form.js');
}

// 2C. Update mobile-preview-sheet & mobile-preview-body in template
const oldSheetDeclTarget = `<div id="mobile-preview-sheet" class="lg:hidden fixed inset-x-0 bottom-0 z-[95] bg-white rounded-t-2xl shadow-2xl border-t border-slate-200 max-h-[88vh] flex flex-col transform translate-y-full transition-transform duration-300 ease-out" style="\${currentStep === 1 ? \`background-color: \${getThemeBodyColor()};\` : ''}">
          <div class="p-2.5 px-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/95 gap-2">
            <div id="mobile-preview-header-content" class="w-full max-w-[210px]">
              \${getPreviewHeaderHtml(currentStep, true)}
            </div>
            <button type="button" id="btn-close-mobile-preview" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer shrink-0">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
          <div id="mobile-preview-body" class="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col items-center transition-colors" style="\${currentStep === 1 ? \`background-color: \${getThemeBodyColor()};\` : ''}">`;

const newSheetDeclReplacement = `<div id="mobile-preview-sheet" class="lg:hidden fixed inset-x-0 bottom-0 z-[95] \${currentStep === 1 ? '' : 'bg-white'} rounded-t-2xl shadow-2xl border-t border-slate-200 max-h-[88dvh] flex flex-col transform translate-y-full transition-transform duration-300 ease-out" style="\${currentStep === 1 ? \`background-color: \${getThemeBodyColor()};\` : ''}">
          <div class="p-2.5 px-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/95 gap-2">
            <div id="mobile-preview-header-content" class="w-full max-w-[210px]">
              \${getPreviewHeaderHtml(currentStep, true)}
            </div>
            <button type="button" id="btn-close-mobile-preview" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer shrink-0">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
          <div id="mobile-preview-body" class="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col items-center transition-colors" style="padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px)); \${currentStep === 1 ? \`background-color: \${getThemeBodyColor()};\` : ''}">`;

if (normPf.includes(normalizeLFs(oldSheetDeclTarget))) {
  normPf = normPf.replace(normalizeLFs(oldSheetDeclTarget), normalizeLFs(newSheetDeclReplacement));
  console.log('SUCCESS: Updated mobile sheet & body template in js/product-form.js');
}

// 2D. Update openMobilePreview and closeMobilePreview
const oldOpenCloseTarget = `openMobilePreview = function () {
      if (!primaryState.is_active) return;
      // Aturan Saling Tutup: Jika Sidebar Menu Toko sedang terbuka di layar kecil/mobile, otomatis tutup
      const sidebarEl = document.getElementById('admin-main-sidebar');
      const backdropSidebar = document.getElementById('sidebar-mobile-backdrop');
      if (sidebarEl && !sidebarEl.classList.contains('-translate-x-full')) {
        sidebarEl.classList.add('-translate-x-full');
      }
      if (backdropSidebar && !backdropSidebar.classList.contains('hidden')) {
        backdropSidebar.classList.add('hidden');
      }

      updateProductCardLivePreview();
      if (btnFabLivePreview) btnFabLivePreview.classList.add('hidden');
      const btnSubnav = document.getElementById('btn-subnav-toggle-preview');
      if (btnSubnav) {
        btnSubnav.classList.add('hidden');
        btnSubnav.style.display = 'none';
      }
      document.body.classList.add('overflow-hidden');
      const vp = document.getElementById('admin-main-viewport');
      if (vp) vp.classList.add('overflow-hidden');

      if (mobileBackdrop) mobileBackdrop.classList.remove('hidden');
      if (mobileSheet) mobileSheet.classList.remove('translate-y-full');
    };

    closeMobilePreview = function () {
      if (mobileSheet) mobileSheet.classList.add('translate-y-full');
      if (mobileBackdrop) mobileBackdrop.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
      const vp = document.getElementById('admin-main-viewport');
      if (vp) vp.classList.remove('overflow-hidden');
      if (btnFabLivePreview && primaryState.is_active) {
        btnFabLivePreview.classList.remove('hidden');
      }
      const btnSubnav = document.getElementById('btn-subnav-toggle-preview');
      if (btnSubnav && primaryState.is_active && currentStep === 2 && !isLivePreviewOpen) {
        btnSubnav.classList.remove('hidden');
        btnSubnav.style.display = '';
      }
    }`;

const newOpenCloseReplacement = `openMobilePreview = function () {
      if (!primaryState.is_active) return;
      // Aturan Saling Tutup: Jika Sidebar Menu Toko sedang terbuka di layar kecil/mobile, otomatis tutup
      const sidebarEl = document.getElementById('admin-main-sidebar');
      const backdropSidebar = document.getElementById('sidebar-mobile-backdrop');
      if (sidebarEl && !sidebarEl.classList.contains('-translate-x-full')) {
        sidebarEl.classList.add('-translate-x-full');
      }
      if (backdropSidebar && !backdropSidebar.classList.contains('hidden')) {
        backdropSidebar.classList.add('hidden');
      }

      updateProductCardLivePreview();
      if (btnFabLivePreview) btnFabLivePreview.classList.add('hidden');
      const btnSubnav = document.getElementById('btn-subnav-toggle-preview');
      if (btnSubnav) {
        btnSubnav.classList.add('hidden');
        btnSubnav.style.display = 'none';
      }
      document.body.classList.add('overflow-hidden');
      const vp = document.getElementById('admin-main-viewport');
      if (vp) {
        vp.classList.add('overflow-hidden');
        vp.classList.add('mobile-preview-active');
      }

      if (mobileBackdrop) mobileBackdrop.classList.remove('hidden');
      if (mobileSheet) {
        mobileSheet.classList.remove('translate-y-full');
        if (currentStep === 1) {
          const themeBodyColor = getThemeBodyColor();
          mobileSheet.style.backgroundColor = themeBodyColor;
          mobileSheet.classList.remove('bg-white');
          const mobBodyEl = document.getElementById('mobile-preview-body');
          if (mobBodyEl) mobBodyEl.style.backgroundColor = themeBodyColor;
        }
      }
    };

    closeMobilePreview = function () {
      if (mobileSheet) mobileSheet.classList.add('translate-y-full');
      if (mobileBackdrop) mobileBackdrop.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
      const vp = document.getElementById('admin-main-viewport');
      if (vp) {
        vp.classList.remove('overflow-hidden');
        vp.classList.remove('mobile-preview-active');
      }
      if (btnFabLivePreview && primaryState.is_active) {
        btnFabLivePreview.classList.remove('hidden');
      }
      const btnSubnav = document.getElementById('btn-subnav-toggle-preview');
      if (btnSubnav && primaryState.is_active && currentStep === 2 && !isLivePreviewOpen) {
        btnSubnav.classList.remove('hidden');
        btnSubnav.style.display = '';
      }
    };`;

if (normPf.includes(normalizeLFs(oldOpenCloseTarget))) {
  normPf = normPf.replace(normalizeLFs(oldOpenCloseTarget), normalizeLFs(newOpenCloseReplacement));
  console.log('SUCCESS: Updated openMobilePreview & closeMobilePreview in js/product-form.js');
} else {
  console.error('ERROR: oldOpenCloseTarget not found in js/product-form.js');
  process.exit(1);
}

// 2E. Update updateProductCardLivePreview background assignment
const oldLiveBgTarget = `    if (currentStep === 1) {
      if (deskBody) deskBody.style.backgroundColor = themeBodyColor;
      if (mobBody) mobBody.style.backgroundColor = themeBodyColor;
      if (deskSidebar) deskSidebar.style.backgroundColor = themeBodyColor;
      if (mobSheet) mobSheet.style.backgroundColor = themeBodyColor;
    } else {
      // Step 2: Isolasi total, kembalikan ke background bawaan (bg-white)
      if (deskBody) deskBody.style.backgroundColor = '';
      if (mobBody) mobBody.style.backgroundColor = '';
      if (deskSidebar) deskSidebar.style.backgroundColor = '';
      if (mobSheet) mobSheet.style.backgroundColor = '';
    }`;

const newLiveBgReplacement = `    if (currentStep === 1) {
      if (deskBody) deskBody.style.backgroundColor = themeBodyColor;
      if (mobBody) mobBody.style.backgroundColor = themeBodyColor;
      if (deskSidebar) deskSidebar.style.backgroundColor = themeBodyColor;
      if (mobSheet) {
        mobSheet.style.backgroundColor = themeBodyColor;
        mobSheet.classList.remove('bg-white');
      }
    } else {
      // Step 2: Isolasi total, kembalikan ke background bawaan (bg-white)
      if (deskBody) deskBody.style.backgroundColor = '';
      if (mobBody) mobBody.style.backgroundColor = '';
      if (deskSidebar) deskSidebar.style.backgroundColor = '';
      if (mobSheet) {
        mobSheet.style.backgroundColor = '';
        mobSheet.classList.add('bg-white');
      }
    }`;

if (normPf.includes(normalizeLFs(oldLiveBgTarget))) {
  normPf = normPf.replace(normalizeLFs(oldLiveBgTarget), normalizeLFs(newLiveBgReplacement));
  console.log('SUCCESS: Updated updateProductCardLivePreview in js/product-form.js');
} else {
  console.error('ERROR: oldLiveBgTarget not found in js/product-form.js');
  process.exit(1);
}

if (isPfCRLF) {
  normPf = normPf.replace(/\n/g, '\r\n');
}
fs.writeFileSync('js/product-form.js', normPf, 'utf8');
console.log('ALL UPDATES APPLIED SUCCESSFULLY TO js/product-form.js');

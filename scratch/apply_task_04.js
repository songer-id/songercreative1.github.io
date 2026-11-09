const fs = require('fs');

const path = 'js/product-form.js';
let content = fs.readFileSync(path, 'utf8');

function safeReplace(str, target, replacement, label) {
  const normStr = str.replace(/\r\n/g, '\n');
  const normTarget = target.replace(/\r\n/g, '\n');
  const normReplacement = replacement.replace(/\r\n/g, '\n');

  if (!normStr.includes(normTarget)) {
    throw new Error(`Target not found for: ${label}`);
  }

  const isCRLF = str.includes('\r\n');
  const result = normStr.replace(normTarget, normReplacement);
  return isCRLF ? result.replace(/\n/g, '\r\n') : result;
}

// 1. syncThemeCSSVariables & getThemeBodyColor
const target1 = `        root.style.setProperty('--color-secondary', secondaryColor);
        root.style.setProperty('--color-secondary-hover', secondaryHover);
        root.style.setProperty('--color-secondary-subtle', secondarySubtle);
      }
    } catch (err) {
      console.warn('ProductForm: Gagal sinkronisasi variabel tema CSS', err);
    }
  }

  /**
   * Mengambil warna tema utama aktif dari settings / :root CSS
   */
  function getPrimaryThemeColor() {`;

const replace1 = `        root.style.setProperty('--color-secondary', secondaryColor);
        root.style.setProperty('--color-secondary-hover', secondaryHover);
        root.style.setProperty('--color-secondary-subtle', secondarySubtle);

        const bodyColor = settings.body_bg_color || '#f8fafc';
        root.style.setProperty('--color-body-bg', bodyColor);
      }
    } catch (err) {
      console.warn('ProductForm: Gagal sinkronisasi variabel tema CSS', err);
    }
  }

  /**
   * Mengambil warna tema Body aktif dari settings / :root CSS (SC-ADMIN-CARD-DESIGN-04)
   */
  function getThemeBodyColor() {
    try {
      if (typeof DB !== 'undefined' && DB.getSettings) {
        const s = DB.getSettings();
        if (s && s.body_bg_color) {
          syncThemeCSSVariables();
          return s.body_bg_color;
        }
      }
      const rootColor = getComputedStyle(document.documentElement).getPropertyValue('--color-body-bg').trim();
      if (rootColor) return rootColor;
    } catch (_) { }
    return '#f8fafc';
  }

  /**
   * Mengambil warna tema utama aktif dari settings / :root CSS
   */
  function getPrimaryThemeColor() {`;

// 2. State & Snapshot functions in top-level state section
const target2 = `  let isPreviewTestMode = false;
  let previewStep1Tab = 'preview'; // 'preview' | 'design'`;

const replace2 = `  let isPreviewTestMode = false;
  let previewStep1Tab = 'preview'; // 'preview' | 'design'

  // State Snapshot Desain Kartu (SC-ADMIN-CARD-DESIGN-04: Tombol Batal & Pemulihan Desain)
  let cardDesignSnapshot = null;
  let cardDesignSnapshotKey = null;

  function getCurrentCardDesignKey() {
    return \`\${currentEditingId || 'new'}__\${primaryState.card_variant || 'A'}\`;
  }

  function captureCardDesignSnapshot(force = false) {
    const currentKey = getCurrentCardDesignKey();
    if (!force && cardDesignSnapshot && cardDesignSnapshotKey === currentKey) {
      return;
    }
    cardDesignSnapshot = {
      card_variant: primaryState.card_variant || 'A',
      use_default_card_design: primaryState.use_default_card_design,
      card_config: primaryState.card_config ? JSON.parse(JSON.stringify(primaryState.card_config)) : null,
      custom_footer_1: primaryState.custom_footer_1 ? JSON.parse(JSON.stringify(primaryState.custom_footer_1)) : null,
      custom_footer_2: primaryState.custom_footer_2 ? JSON.parse(JSON.stringify(primaryState.custom_footer_2)) : null,
      footer_bg_color: primaryState.footer_bg_color,
      footer_text_color: primaryState.footer_text_color,
      card_footer_text: primaryState.card_footer_text,
      footer_badge_icon: primaryState.footer_badge_icon,
      footer_2_bg_color: primaryState.footer_2_bg_color,
      footer_2_text_color: primaryState.footer_2_text_color,
      card_footer_2_text: primaryState.card_footer_2_text,
      footer_2_badge_icon: primaryState.footer_2_badge_icon,
      countdown_radius: primaryState.countdown_radius,
      countdown_bg_color: primaryState.countdown_bg_color,
      countdown_text_color: primaryState.countdown_text_color,
      countdown_icon_color: primaryState.countdown_icon_color,
      countdown_border_color: primaryState.countdown_border_color,
      enable_countdown: primaryState.enable_countdown
    };
    cardDesignSnapshotKey = currentKey;
  }`;

// 3. resetFormState and editProduct snapshot reset
const target3a = `    currentStep = 1;
    isPreviewTestMode = false;
    previewStep1Tab = 'preview';
    previewTestState.sidebarTab = 'preview';`;

const replace3a = `    currentStep = 1;
    isPreviewTestMode = false;
    previewStep1Tab = 'preview';
    cardDesignSnapshot = null;
    cardDesignSnapshotKey = null;
    previewTestState.sidebarTab = 'preview';`;

const target3b = `    currentStep = 1;
    isPreviewTestMode = false;
    previewStep1Tab = 'preview';
    previewTestState.sidebarTab = 'preview';
    previewTestState.isDrawerOpen = false;
    previewTestState.drawerActionType = 'buy';
    previewTestState.isInlineSizeGuideOpen = false;
    previewTestState.selectedTier1Id = null;
    previewTestState.selectedTier2Id = null;
    previewTestState.selectedTier3Id = null;
    previewTestState.selectedTier4Id = null;
    previewTestState.selectedExtras = {};
    previewTestState.extraQty = {};
    previewTestState.qty = 1;

    const imgs = Array.isArray(prod.images)`;

const replace3b = `    currentStep = 1;
    isPreviewTestMode = false;
    previewStep1Tab = 'preview';
    cardDesignSnapshot = null;
    cardDesignSnapshotKey = null;
    previewTestState.sidebarTab = 'preview';
    previewTestState.isDrawerOpen = false;
    previewTestState.drawerActionType = 'buy';
    previewTestState.isInlineSizeGuideOpen = false;
    previewTestState.selectedTier1Id = null;
    previewTestState.selectedTier2Id = null;
    previewTestState.selectedTier3Id = null;
    previewTestState.selectedTier4Id = null;
    previewTestState.selectedExtras = {};
    previewTestState.extraQty = {};
    previewTestState.qty = 1;

    const imgs = Array.isArray(prod.images)`;

// 4. Desktop outer wrapper in renderProductForm template
const target4 = `            <!-- Card Live Box Container -->
            <div class="flex justify-center w-full">
              <div id="preview-card-outer-wrapper" class="w-full \${currentStep === 1 ? 'max-w-[284px] p-3 rounded-xl bg-slate-100/70' : 'max-w-[260px]'} flex justify-center transition-colors">
                <div id="product-card-preview-container" class="w-full max-w-[260px] relative overflow-hidden">`;

const replace4 = `            <!-- Card Live Box Container -->
            <div class="flex justify-center w-full">
              <div id="preview-card-outer-wrapper" class="w-full max-w-[260px] flex justify-center transition-colors" style="\${currentStep === 1 ? \`background-color: \${getThemeBodyColor()};\` : ''}">
                <div id="product-card-preview-container" class="w-full max-w-[260px] relative overflow-hidden">`;

// 5. Desktop Cancel & Save buttons in card customization editor
const target5 = `                <!-- Save as Default Options & Button -->
                <div class="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                  <label class="flex items-center gap-2 text-[11px] font-bold text-emerald-800 cursor-pointer select-none">
                    <input type="checkbox" id="cfg-save-as-default-toggle" class="w-3.5 h-3.5 text-emerald-600 rounded cursor-pointer" />
                    <span id="label-save-as-default-desk">Gunakan Tema Sebagai Default \${primaryState.card_variant === 'B' ? 'Kartu Minimalis' : (primaryState.card_variant === 'C' ? 'Kartu Detail' : 'Kartu Klasik')}</span>
                  </label>
                  <button type="button" id="btn-save-card-design" class="btn-primary-brand w-full py-2 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
                    <i class="bi bi-check-lg"></i>
                    <span>Simpan Perubahan</span>
                  </button>
                </div>`;

const replace5 = `                <!-- Save as Default Options & Button -->
                <div class="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                  <label class="flex items-center gap-2 text-[11px] font-bold text-emerald-800 cursor-pointer select-none">
                    <input type="checkbox" id="cfg-save-as-default-toggle" class="w-3.5 h-3.5 text-emerald-600 rounded cursor-pointer" />
                    <span id="label-save-as-default-desk">Gunakan Tema Sebagai Default \${primaryState.card_variant === 'B' ? 'Kartu Minimalis' : (primaryState.card_variant === 'C' ? 'Kartu Detail' : 'Kartu Klasik')}</span>
                  </label>
                  <div class="flex items-center gap-2 w-full">
                    <button type="button" id="btn-cancel-card-design" class="w-1/3 py-2 px-2.5 border border-slate-300 rounded-md bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-98" title="Batalkan perubahan desain ke kondisi awal sesi">
                      <span>Batal</span>
                    </button>
                    <button type="button" id="btn-save-card-design" class="btn-primary-brand flex-1 py-2 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-98">
                      <i class="bi bi-check-lg"></i>
                      <span>Simpan Perubahan</span>
                    </button>
                  </div>
                </div>`;

// 6. Mobile outer wrapper in renderProductForm template
const target6 = `            <!-- Card Preview Box -->
            <div id="preview-card-outer-wrapper-mob" class="w-full \${currentStep === 1 ? 'max-w-[284px] p-3 rounded-xl bg-slate-100/70' : 'max-w-[260px]'} flex justify-center transition-colors">
              <div class="w-full max-w-[260px] relative overflow-hidden">`;

const replace6 = `            <!-- Card Preview Box -->
            <div id="preview-card-outer-wrapper-mob" class="w-full max-w-[260px] flex justify-center transition-colors" style="\${currentStep === 1 ? \`background-color: \${getThemeBodyColor()};\` : ''}">
              <div class="w-full max-w-[260px] relative overflow-hidden">`;

// 7. Mobile Cancel & Save buttons in card customization editor
const target7 = `                <!-- Save Default Options & Button Mobile -->
                <div class="pt-3 border-t border-slate-200 flex flex-col gap-2.5">
                  <label class="flex items-center gap-2 text-[11px] font-bold text-emerald-800 cursor-pointer select-none">
                    <input type="checkbox" id="cfg-save-as-default-toggle-mob" class="w-3.5 h-3.5 text-emerald-600 rounded cursor-pointer" />
                    <span id="label-save-as-default-mob">Gunakan Tema Sebagai Default \${primaryState.card_variant === 'B' ? 'Kartu Minimalis' : (primaryState.card_variant === 'C' ? 'Kartu Detail' : 'Kartu Klasik')}</span>
                  </label>
                  <button type="button" id="btn-save-card-design-mob" class="btn-primary-brand w-full py-2 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
                    <i class="bi bi-check-lg"></i>
                    <span>Simpan Perubahan</span>
                  </button>
                </div>`;

const replace7 = `                <!-- Save Default Options & Button Mobile -->
                <div class="pt-3 border-t border-slate-200 flex flex-col gap-2.5">
                  <label class="flex items-center gap-2 text-[11px] font-bold text-emerald-800 cursor-pointer select-none">
                    <input type="checkbox" id="cfg-save-as-default-toggle-mob" class="w-3.5 h-3.5 text-emerald-600 rounded cursor-pointer" />
                    <span id="label-save-as-default-mob">Gunakan Tema Sebagai Default \${primaryState.card_variant === 'B' ? 'Kartu Minimalis' : (primaryState.card_variant === 'C' ? 'Kartu Detail' : 'Kartu Klasik')}</span>
                  </label>
                  <div class="flex items-center gap-2 w-full">
                    <button type="button" id="btn-cancel-card-design-mob" class="w-1/3 py-2 px-2.5 border border-slate-300 rounded-md bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-98" title="Batalkan perubahan desain ke kondisi awal sesi">
                      <span>Batal</span>
                    </button>
                    <button type="button" id="btn-save-card-design-mob" class="btn-primary-brand flex-1 py-2 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-98">
                      <i class="bi bi-check-lg"></i>
                      <span>Simpan Perubahan</span>
                    </button>
                  </div>
                </div>`;

// 8. Capture snapshot in loadCardConfigInputs
const target8 = `    setChk('cfg-save-as-default-toggle', false);
    updateDesignChoiceButtonsState();
  }`;

const replace8 = `    setChk('cfg-save-as-default-toggle', false);
    updateDesignChoiceButtonsState();
    captureCardDesignSnapshot();
  }`;

// 9. updateProductCardLivePreview wrapper classes
const target9 = `    // Pembungkus Area Kartu (SC-ADMIN-PREVIEW-LAYOUT-03-R1: latar abu-abu netral sangat muda + padding 12px di Step 1)
    const outerWrapDesk = document.getElementById('preview-card-outer-wrapper');
    const outerWrapMob = document.getElementById('preview-card-outer-wrapper-mob');
    const isStep1WithCard = Boolean(currentStep === 1 && variant);
    [outerWrapDesk, outerWrapMob].forEach(wrap => {
      if (!wrap) return;
      if (isStep1WithCard) {
        wrap.classList.add('p-3', 'rounded-xl', 'bg-slate-100/70', 'max-w-[284px]');
        wrap.classList.remove('max-w-[260px]');
      } else {
        wrap.classList.remove('p-3', 'rounded-xl', 'bg-slate-100/70', 'max-w-[284px]');
        wrap.classList.add('max-w-[260px]');
      }
    });`;

const replace9 = `    // Pembungkus Area Kartu (SC-ADMIN-CARD-DESIGN-04: Latar mengikuti tema Body, tanpa padding)
    const outerWrapDesk = document.getElementById('preview-card-outer-wrapper');
    const outerWrapMob = document.getElementById('preview-card-outer-wrapper-mob');
    const isStep1WithCard = Boolean(currentStep === 1 && variant);
    const themeBodyColor = getThemeBodyColor();

    [outerWrapDesk, outerWrapMob].forEach(wrap => {
      if (!wrap) return;
      wrap.classList.remove('p-3', 'rounded-xl', 'bg-slate-100/70', 'max-w-[284px]');
      wrap.classList.add('max-w-[260px]');
      if (isStep1WithCard) {
        wrap.style.backgroundColor = themeBodyColor;
      } else {
        wrap.style.backgroundColor = '';
      }
    });`;

// 10. setCardCustomizationView, handleSaveCardDesign, and handleCancelCardDesign
const target10 = `    function setCardCustomizationView(isCustomMode) {
      const modelName = primaryState.card_variant === 'B' ? 'Kartu Minimalis' : (primaryState.card_variant === 'C' ? 'Kartu Detail' : 'Kartu Klasik');
      if (isCustomMode) {
        // [Ubah Kartu]: Menampilkan panel kustomisasi warna/elemen
        panelCustDesk?.classList.remove('hidden');
        panelCustMob?.classList.remove('hidden');

        tabCustDesk?.classList.remove('text-slate-600');
        tabCustDesk?.classList.add('bg-white', 'text-emerald-800', 'shadow-2xs');
        tabDefDesk?.classList.remove('bg-white', 'text-emerald-800', 'shadow-2xs');
        tabDefDesk?.classList.add('text-slate-600');

        tabCustMob?.classList.remove('text-slate-600');
        tabCustMob?.classList.add('bg-slate-100', 'text-emerald-800', 'shadow-2xs');
        tabDefMob?.classList.remove('bg-slate-100', 'text-emerald-800', 'shadow-2xs');
        tabDefMob?.classList.add('text-slate-600');

        // Pastikan checkbox default selalu false (unchecked)
        if (saveDefToggle) saveDefToggle.checked = false;
        if (saveDefToggleMob) saveDefToggleMob.checked = false;

        const deskLbl = document.getElementById('label-save-as-default-desk');
        const mobLbl = document.getElementById('label-save-as-default-mob');
        if (deskLbl) deskLbl.textContent = \`Gunakan Tema Sebagai Default \${modelName}\`;
        if (mobLbl) mobLbl.textContent = \`Gunakan Tema Sebagai Default \${modelName}\`;
      } else {
        // [Default]: Menyembunyikan panel kustomisasi
        panelCustDesk?.classList.add('hidden');
        panelCustMob?.classList.add('hidden');

        tabDefDesk?.classList.remove('text-slate-600');
        tabDefDesk?.classList.add('bg-white', 'text-emerald-800', 'shadow-2xs');
        tabCustDesk?.classList.remove('bg-white', 'text-emerald-800', 'shadow-2xs');
        tabCustDesk?.classList.add('text-slate-600');

        tabDefMob?.classList.remove('text-slate-600');
        tabDefMob?.classList.add('bg-slate-100', 'text-emerald-800', 'shadow-2xs');
        tabCustMob?.classList.remove('bg-slate-100', 'text-emerald-800', 'shadow-2xs');
        tabCustMob?.classList.add('text-slate-600');

        // Pastikan checkbox default selalu false (unchecked)
        if (saveDefToggle) saveDefToggle.checked = false;
        if (saveDefToggleMob) saveDefToggleMob.checked = false;

        // Reset to default preset
        primaryState.use_default_card_design = true;
        loadCardConfigInputs(primaryState.card_variant || 'A', true);
        saveCardConfigInputs();
        updateProductCardLivePreview();
      }
    }

    if (tabDefDesk) tabDefDesk.addEventListener('click', () => setCardCustomizationView(false));
    if (tabCustDesk) tabCustDesk.addEventListener('click', () => setCardCustomizationView(true));
    if (tabDefMob) tabDefMob.addEventListener('click', () => setCardCustomizationView(false));
    if (tabCustMob) tabCustMob.addEventListener('click', () => setCardCustomizationView(true));

    // Save as Default Toggle (Desktop & Mobile Sync)
    const saveDefToggle = document.getElementById('cfg-save-as-default-toggle');
    const saveDefToggleMob = document.getElementById('cfg-save-as-default-toggle-mob');
    if (saveDefToggle) {
      saveDefToggle.addEventListener('change', () => {
        if (saveDefToggleMob) saveDefToggleMob.checked = saveDefToggle.checked;
        saveCardConfigInputs();
      });
    }
    if (saveDefToggleMob) {
      saveDefToggleMob.addEventListener('change', () => {
        if (saveDefToggle) saveDefToggle.checked = saveDefToggleMob.checked;
        saveCardConfigInputs();
      });
    }

    function handleSaveCardDesign() {
      saveCardConfigInputs();
      const isSaveDefault = (saveDefToggle?.checked || saveDefToggleMob?.checked);
      if (isSaveDefault) {
        try {
          if (typeof DB !== 'undefined' && DB.saveCardModelPreset) {
            DB.saveCardModelPreset(primaryState.card_variant, primaryState.card_config);
          }
        } catch (e) {
          console.warn('Gagal menyimpan default model preset:', e);
        }
      }
      if (saveDefToggle) saveDefToggle.checked = false;
      if (saveDefToggleMob) saveDefToggleMob.checked = false;
      if (typeof App !== 'undefined' && App.showToast) {
        const mLabel = primaryState.card_variant === 'B' ? 'Kartu Minimalis' : (primaryState.card_variant === 'C' ? 'Kartu Detail' : 'Kartu Klasik');
        App.showToast(\`Desain kartu \${mLabel} berhasil disimpan!\`, 'success');
      }
      updateProductCardLivePreview();
    }

    if (btnSaveCardDesk) btnSaveCardDesk.addEventListener('click', handleSaveCardDesign);
    if (btnSaveCardMob) btnSaveCardMob.addEventListener('click', handleSaveCardDesign);`;

const replace10 = `    function updateCardCustomizationTabVisuals(isCustomMode) {
      const modelName = primaryState.card_variant === 'B' ? 'Kartu Minimalis' : (primaryState.card_variant === 'C' ? 'Kartu Detail' : 'Kartu Klasik');
      if (isCustomMode) {
        panelCustDesk?.classList.remove('hidden');
        panelCustMob?.classList.remove('hidden');

        tabCustDesk?.classList.remove('text-slate-600');
        tabCustDesk?.classList.add('bg-white', 'text-emerald-800', 'shadow-2xs');
        tabDefDesk?.classList.remove('bg-white', 'text-emerald-800', 'shadow-2xs');
        tabDefDesk?.classList.add('text-slate-600');

        tabCustMob?.classList.remove('text-slate-600');
        tabCustMob?.classList.add('bg-slate-100', 'text-emerald-800', 'shadow-2xs');
        tabDefMob?.classList.remove('bg-slate-100', 'text-emerald-800', 'shadow-2xs');
        tabDefMob?.classList.add('text-slate-600');

        if (saveDefToggle) saveDefToggle.checked = false;
        if (saveDefToggleMob) saveDefToggleMob.checked = false;

        const deskLbl = document.getElementById('label-save-as-default-desk');
        const mobLbl = document.getElementById('label-save-as-default-mob');
        if (deskLbl) deskLbl.textContent = \`Gunakan Tema Sebagai Default \${modelName}\`;
        if (mobLbl) mobLbl.textContent = \`Gunakan Tema Sebagai Default \${modelName}\`;
      } else {
        panelCustDesk?.classList.add('hidden');
        panelCustMob?.classList.add('hidden');

        tabDefDesk?.classList.remove('text-slate-600');
        tabDefDesk?.classList.add('bg-white', 'text-emerald-800', 'shadow-2xs');
        tabCustDesk?.classList.remove('bg-white', 'text-emerald-800', 'shadow-2xs');
        tabCustDesk?.classList.add('text-slate-600');

        tabDefMob?.classList.remove('text-slate-600');
        tabDefMob?.classList.add('bg-slate-100', 'text-emerald-800', 'shadow-2xs');
        tabCustMob?.classList.remove('bg-slate-100', 'text-emerald-800', 'shadow-2xs');
        tabCustMob?.classList.add('text-slate-600');

        if (saveDefToggle) saveDefToggle.checked = false;
        if (saveDefToggleMob) saveDefToggleMob.checked = false;
      }
    }

    function setCardCustomizationView(isCustomMode) {
      captureCardDesignSnapshot();
      updateCardCustomizationTabVisuals(isCustomMode);
      if (isCustomMode) {
        primaryState.use_default_card_design = false;
        saveCardConfigInputs();
        updateProductCardLivePreview();
      } else {
        primaryState.use_default_card_design = true;
        loadCardConfigInputs(primaryState.card_variant || 'A', true);
        saveCardConfigInputs();
        updateProductCardLivePreview();
      }
    }

    if (tabDefDesk) tabDefDesk.addEventListener('click', () => setCardCustomizationView(false));
    if (tabCustDesk) tabCustDesk.addEventListener('click', () => setCardCustomizationView(true));
    if (tabDefMob) tabDefMob.addEventListener('click', () => setCardCustomizationView(false));
    if (tabCustMob) tabCustMob.addEventListener('click', () => setCardCustomizationView(true));

    // Save as Default Toggle (Desktop & Mobile Sync)
    const saveDefToggle = document.getElementById('cfg-save-as-default-toggle');
    const saveDefToggleMob = document.getElementById('cfg-save-as-default-toggle-mob');
    if (saveDefToggle) {
      saveDefToggle.addEventListener('change', () => {
        captureCardDesignSnapshot();
        if (saveDefToggleMob) saveDefToggleMob.checked = saveDefToggle.checked;
        saveCardConfigInputs();
      });
    }
    if (saveDefToggleMob) {
      saveDefToggleMob.addEventListener('change', () => {
        captureCardDesignSnapshot();
        if (saveDefToggle) saveDefToggle.checked = saveDefToggleMob.checked;
        saveCardConfigInputs();
      });
    }

    function handleSaveCardDesign() {
      try {
        saveCardConfigInputs();
        const isSaveDefault = (saveDefToggle?.checked || saveDefToggleMob?.checked);
        if (isSaveDefault) {
          if (typeof DB !== 'undefined' && DB.saveCardModelPreset) {
            DB.saveCardModelPreset(primaryState.card_variant, primaryState.card_config);
          }
        }
        if (saveDefToggle) saveDefToggle.checked = false;
        if (saveDefToggleMob) saveDefToggleMob.checked = false;

        // Simpan berhasil -> hasil simpan menjadi nilai awal untuk pengeditan berikutnya
        captureCardDesignSnapshot(true);

        if (typeof App !== 'undefined' && App.showToast) {
          const mLabel = primaryState.card_variant === 'B' ? 'Kartu Minimalis' : (primaryState.card_variant === 'C' ? 'Kartu Detail' : 'Kartu Klasik');
          App.showToast(\`Desain kartu \${mLabel} berhasil disimpan!\`, 'success');
        }
        updateProductCardLivePreview();
      } catch (e) {
        console.warn('Gagal menyimpan desain kartu:', e);
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast('Gagal menyimpan desain kartu.', 'error');
        }
      }
    }

    let isCancellingCardDesign = false;
    function handleCancelCardDesign() {
      if (isCancellingCardDesign) return;
      isCancellingCardDesign = true;
      try {
        const currentKey = getCurrentCardDesignKey();
        if (!cardDesignSnapshot || cardDesignSnapshotKey !== currentKey) {
          return;
        }

        // 1. Pulihkan state primaryState dari snapshot
        primaryState.use_default_card_design = cardDesignSnapshot.use_default_card_design;
        if (cardDesignSnapshot.card_config) {
          primaryState.card_config = JSON.parse(JSON.stringify(cardDesignSnapshot.card_config));
        } else {
          delete primaryState.card_config;
        }

        if (cardDesignSnapshot.custom_footer_1) {
          primaryState.custom_footer_1 = JSON.parse(JSON.stringify(cardDesignSnapshot.custom_footer_1));
        } else {
          delete primaryState.custom_footer_1;
        }
        if (cardDesignSnapshot.custom_footer_2) {
          primaryState.custom_footer_2 = JSON.parse(JSON.stringify(cardDesignSnapshot.custom_footer_2));
        } else {
          delete primaryState.custom_footer_2;
        }

        primaryState.footer_bg_color = cardDesignSnapshot.footer_bg_color;
        primaryState.footer_text_color = cardDesignSnapshot.footer_text_color;
        primaryState.card_footer_text = cardDesignSnapshot.card_footer_text;
        primaryState.footer_badge_icon = cardDesignSnapshot.footer_badge_icon;

        primaryState.footer_2_bg_color = cardDesignSnapshot.footer_2_bg_color;
        primaryState.footer_2_text_color = cardDesignSnapshot.footer_2_text_color;
        primaryState.card_footer_2_text = cardDesignSnapshot.card_footer_2_text;
        primaryState.footer_2_badge_icon = cardDesignSnapshot.footer_2_badge_icon;

        primaryState.countdown_radius = cardDesignSnapshot.countdown_radius;
        primaryState.countdown_bg_color = cardDesignSnapshot.countdown_bg_color;
        primaryState.countdown_text_color = cardDesignSnapshot.countdown_text_color;
        primaryState.countdown_icon_color = cardDesignSnapshot.countdown_icon_color;
        primaryState.countdown_border_color = cardDesignSnapshot.countdown_border_color;
        primaryState.enable_countdown = cardDesignSnapshot.enable_countdown;

        // 2. Pulihkan input editor & tampilan tab Default vs Ubah Kartu
        const isDef = primaryState.use_default_card_design !== false;
        loadCardConfigInputs(primaryState.card_variant || 'A', isDef);
        updateCardCustomizationTabVisuals(!isDef);

        // Pulihkan input footer 1 & 2 di DOM
        const f1Text = primaryState.card_footer_text || '';
        const f1Bg = primaryState.footer_bg_color || getThemeBodyColor();
        const f1TextCol = primaryState.footer_text_color || '#ffffff';
        [inpF1Text, inpF1TextSide, inpF1TextMob].forEach(x => { if (x) x.value = f1Text; });
        [cfgF1Bg, cfgF1BgHex, cfgF1BgSide, cfgF1BgHexSide, cfgF1BgMob, cfgF1BgHexMob].forEach(x => { if (x) x.value = f1Bg; });
        [cfgF1Text, cfgF1TextHex, cfgF1TextSide, cfgF1TextHexSide, cfgF1TextMob, cfgF1TextHexMob].forEach(x => { if (x) x.value = f1TextCol; });
        if (selF1Icon && primaryState.footer_badge_icon) selF1Icon.value = primaryState.footer_badge_icon;

        const f2Text = primaryState.card_footer_2_text || '';
        const f2Bg = primaryState.footer_2_bg_color || getThemeBodyColor();
        const f2TextCol = primaryState.footer_2_text_color || '#ffffff';
        [inpF2Text, inpF2TextSide, inpF2TextMob].forEach(x => { if (x) x.value = f2Text; });
        [cfgF2Bg, cfgF2BgHex, cfgF2BgSide, cfgF2BgHexSide, cfgF2BgMob, cfgF2BgHexMob].forEach(x => { if (x) x.value = f2Bg; });
        [cfgF2Text, cfgF2TextHex, cfgF2TextSide, cfgF2TextHexSide, cfgF2TextMob, cfgF2TextHexMob].forEach(x => { if (x) x.value = f2TextCol; });
        if (selF2Icon && primaryState.footer_2_badge_icon) selF2Icon.value = primaryState.footer_2_badge_icon;

        if (saveDefToggle) saveDefToggle.checked = false;
        if (saveDefToggleMob) saveDefToggleMob.checked = false;

        saveCardConfigInputs();
        updateProductCardLivePreview();

        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast('Perubahan desain kartu dibatalkan.', 'info');
        }
      } finally {
        isCancellingCardDesign = false;
      }
    }

    const btnCancelCardDesk = document.getElementById('btn-cancel-card-design');
    const btnCancelCardMob = document.getElementById('btn-cancel-card-design-mob');

    if (btnCancelCardDesk) btnCancelCardDesk.addEventListener('click', handleCancelCardDesign);
    if (btnCancelCardMob) btnCancelCardMob.addEventListener('click', handleCancelCardDesign);

    if (btnSaveCardDesk) btnSaveCardDesk.addEventListener('click', handleSaveCardDesign);
    if (btnSaveCardMob) btnSaveCardMob.addEventListener('click', handleSaveCardDesign);`;

// 11. Export on ProductForm
const target11 = `    getPreviewHeaderHtml,
    getPreviewStep1Tab: () => previewStep1Tab,
    setPreviewStep1Tab: (t) => { previewStep1Tab = t; }
  };
})();

window.ProductForm = ProductForm;`;

const replace11 = `    getPreviewHeaderHtml,
    getPreviewStep1Tab: () => previewStep1Tab,
    setPreviewStep1Tab: (t) => { previewStep1Tab = t; },
    getThemeBodyColor,
    captureCardDesignSnapshot,
    handleCancelCardDesign,
    handleSaveCardDesign,
    getCardDesignSnapshot: () => cardDesignSnapshot
  };
})();

window.ProductForm = ProductForm;
window.getThemeBodyColor = ProductForm.getThemeBodyColor;
window.handleCancelCardDesign = ProductForm.handleCancelCardDesign;
window.handleSaveCardDesign = ProductForm.handleSaveCardDesign;`;

try {
  content = safeReplace(content, target1, replace1, 'Target 1: syncThemeCSSVariables & getThemeBodyColor');
  content = safeReplace(content, target2, replace2, 'Target 2: Snapshot state definition');
  content = safeReplace(content, target3a, replace3a, 'Target 3a: resetFormState snapshot clear');
  content = safeReplace(content, target3b, replace3b, 'Target 3b: editProduct snapshot clear');
  content = safeReplace(content, target4, replace4, 'Target 4: Desktop outer wrapper');
  content = safeReplace(content, target5, replace5, 'Target 5: Desktop Cancel & Save buttons');
  content = safeReplace(content, target6, replace6, 'Target 6: Mobile outer wrapper');
  content = safeReplace(content, target7, replace7, 'Target 7: Mobile Cancel & Save buttons');
  content = safeReplace(content, target8, replace8, 'Target 8: loadCardConfigInputs snapshot');
  content = safeReplace(content, target9, replace9, 'Target 9: updateProductCardLivePreview wrapper classes');
  content = safeReplace(content, target10, replace10, 'Target 10: setCardCustomizationView & handlers');
  content = safeReplace(content, target11, replace11, 'Target 11: Export on ProductForm');

  fs.writeFileSync(path, content, 'utf8');
  console.log('[SUCCESS] All targets safely applied to js/product-form.js');
} catch (e) {
  console.error('[ERROR]', e.message);
  process.exit(1);
}


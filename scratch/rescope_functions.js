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

// 1. Move functions to module level right after saveCardConfigInputs
const targetAfterSave = `    const shouldSaveDefault = forceSaveAsDefault || (document.getElementById("cfg-save-as-default-toggle")?.checked === true) || (document.getElementById("cfg-save-as-default-toggle-mob")?.checked === true);
    if (shouldSaveDefault) {
      sets.card_variants_config[key] = {
        ...sets.card_variants_config[key],
        ...cfg
      };
      DB.saveSettings(sets);
    }
  }`;

const replaceAfterSave = `    const shouldSaveDefault = forceSaveAsDefault || (document.getElementById("cfg-save-as-default-toggle")?.checked === true) || (document.getElementById("cfg-save-as-default-toggle-mob")?.checked === true);
    if (shouldSaveDefault) {
      sets.card_variants_config[key] = {
        ...sets.card_variants_config[key],
        ...cfg
      };
      DB.saveSettings(sets);
    }
  }

  function updateCardCustomizationTabVisuals(isCustomMode) {
    const tabDefDesk = document.getElementById('tab-card-design-default');
    const tabCustDesk = document.getElementById('tab-card-design-custom');
    const panelCustDesk = document.getElementById('panel-card-custom-content');
    const tabDefMob = document.getElementById('tab-card-design-default-mob');
    const tabCustMob = document.getElementById('tab-card-design-custom-mob');
    const panelCustMob = document.getElementById('panel-card-custom-content-mob');
    const saveDefToggle = document.getElementById('cfg-save-as-default-toggle');
    const saveDefToggleMob = document.getElementById('cfg-save-as-default-toggle-mob');

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

  function handleSaveCardDesign() {
    try {
      saveCardConfigInputs();
      const saveDefToggle = document.getElementById('cfg-save-as-default-toggle');
      const saveDefToggleMob = document.getElementById('cfg-save-as-default-toggle-mob');
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
      const inpF1Text = document.getElementById('input-card-footer-text');
      const inpF1TextSide = document.getElementById('input-card-footer-text-side');
      const inpF1TextMob = document.getElementById('input-card-footer-text-mob');
      const cfgF1Bg = document.getElementById('cfg-footer-bg-color');
      const cfgF1BgHex = document.getElementById('cfg-footer-bg-hex');
      const cfgF1BgSide = document.getElementById('cfg-footer-bg-color-side');
      const cfgF1BgHexSide = document.getElementById('cfg-footer-bg-hex-side');
      const cfgF1BgMob = document.getElementById('cfg-footer-bg-color-mob');
      const cfgF1BgHexMob = document.getElementById('cfg-footer-bg-hex-mob');
      const cfgF1Text = document.getElementById('cfg-footer-text-color');
      const cfgF1TextHex = document.getElementById('cfg-footer-text-hex');
      const cfgF1TextSide = document.getElementById('cfg-footer-text-color-side');
      const cfgF1TextHexSide = document.getElementById('cfg-footer-text-hex-side');
      const cfgF1TextMob = document.getElementById('cfg-footer-text-color-mob');
      const cfgF1TextHexMob = document.getElementById('cfg-footer-text-hex-mob');
      const selF1Icon = document.getElementById('select-card-footer-icon');

      [inpF1Text, inpF1TextSide, inpF1TextMob].forEach(x => { if (x) x.value = f1Text; });
      [cfgF1Bg, cfgF1BgHex, cfgF1BgSide, cfgF1BgHexSide, cfgF1BgMob, cfgF1BgHexMob].forEach(x => { if (x) x.value = f1Bg; });
      [cfgF1Text, cfgF1TextHex, cfgF1TextSide, cfgF1TextHexSide, cfgF1TextMob, cfgF1TextHexMob].forEach(x => { if (x) x.value = f1TextCol; });
      if (selF1Icon && primaryState.footer_badge_icon) selF1Icon.value = primaryState.footer_badge_icon;

      const f2Text = primaryState.card_footer_2_text || '';
      const f2Bg = primaryState.footer_2_bg_color || getThemeBodyColor();
      const f2TextCol = primaryState.footer_2_text_color || '#ffffff';
      const inpF2Text = document.getElementById('input-card-footer-2-text');
      const inpF2TextSide = document.getElementById('input-card-footer-2-text-side');
      const inpF2TextMob = document.getElementById('input-card-footer-2-text-mob');
      const cfgF2Bg = document.getElementById('cfg-footer-2-bg-color');
      const cfgF2BgHex = document.getElementById('cfg-footer-2-bg-hex');
      const cfgF2BgSide = document.getElementById('cfg-footer-2-bg-color-side');
      const cfgF2BgHexSide = document.getElementById('cfg-footer-2-bg-hex-side');
      const cfgF2BgMob = document.getElementById('cfg-footer-2-bg-color-mob');
      const cfgF2BgHexMob = document.getElementById('cfg-footer-2-bg-hex-mob');
      const cfgF2Text = document.getElementById('cfg-footer-2-text-color');
      const cfgF2TextHex = document.getElementById('cfg-footer-2-text-hex');
      const cfgF2TextSide = document.getElementById('cfg-footer-2-text-color-side');
      const cfgF2TextHexSide = document.getElementById('cfg-footer-2-text-hex-side');
      const cfgF2TextMob = document.getElementById('cfg-footer-2-text-color-mob');
      const cfgF2TextHexMob = document.getElementById('cfg-footer-2-text-hex-mob');
      const selF2Icon = document.getElementById('select-card-footer-2-icon');

      [inpF2Text, inpF2TextSide, inpF2TextMob].forEach(x => { if (x) x.value = f2Text; });
      [cfgF2Bg, cfgF2BgHex, cfgF2BgSide, cfgF2BgHexSide, cfgF2BgMob, cfgF2BgHexMob].forEach(x => { if (x) x.value = f2Bg; });
      [cfgF2Text, cfgF2TextHex, cfgF2TextSide, cfgF2TextHexSide, cfgF2TextMob, cfgF2TextHexMob].forEach(x => { if (x) x.value = f2TextCol; });
      if (selF2Icon && primaryState.footer_2_badge_icon) selF2Icon.value = primaryState.footer_2_badge_icon;

      const saveDefToggle = document.getElementById('cfg-save-as-default-toggle');
      const saveDefToggleMob = document.getElementById('cfg-save-as-default-toggle-mob');
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
  }`;

// 2. In bindProductFormEvents, simplify to event wiring:
const targetInBind = `    function updateCardCustomizationTabVisuals(isCustomMode) {
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

const replaceInBind = `    if (tabDefDesk) tabDefDesk.addEventListener('click', () => setCardCustomizationView(false));
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

    const btnCancelCardDesk = document.getElementById('btn-cancel-card-design');
    const btnCancelCardMob = document.getElementById('btn-cancel-card-design-mob');

    if (btnCancelCardDesk) btnCancelCardDesk.addEventListener('click', handleCancelCardDesign);
    if (btnCancelCardMob) btnCancelCardMob.addEventListener('click', handleCancelCardDesign);

    if (btnSaveCardDesk) btnSaveCardDesk.addEventListener('click', handleSaveCardDesign);
    if (btnSaveCardMob) btnSaveCardMob.addEventListener('click', handleSaveCardDesign);`;

try {
  content = safeReplace(content, targetAfterSave, replaceAfterSave, 'Module-level functions');
  content = safeReplace(content, targetInBind, replaceInBind, 'Event listeners in bindProductFormEvents');
  fs.writeFileSync(path, content, 'utf8');
  console.log('[SUCCESS] Re-scoped module-level functions cleanly.');
} catch (e) {
  console.error('[ERROR]', e.message);
  process.exit(1);
}


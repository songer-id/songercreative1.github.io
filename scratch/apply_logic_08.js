const fs = require('fs');

let content = fs.readFileSync('js/product-form.js', 'utf8');

// Section A: Card functions around lines 3465 - 3870
// Replace from `function getCardConfigFromDOM() {` to end of `handleCancelCardDesign()`
const funcTargetStart = '  function getCardConfigFromDOM() {';
const funcTargetEnd = '  // --- HELPER OTOMASI KAPASITAS BARIS LABEL PINTAR (2 vs 3 Label) ---';

const startIdx = content.indexOf(funcTargetStart);
const endIdx = content.indexOf(funcTargetEnd);

if (startIdx === -1 || endIdx === -1) {
  throw new Error('Functions target not found');
}

const newFunctionsCode = `  // --- ACCORDION STATE & HELPERS FOR CARD DESIGN EDITOR (STEP 1) ---
  let cardAccordionState = {
    colors: true,
    elements: false,
    footer: false,
    countdown: false
  };

  function toggleCardAccordion(groupKey) {
    if (cardAccordionState[groupKey] !== undefined) {
      cardAccordionState[groupKey] = !cardAccordionState[groupKey];
      syncCardAccordionDOM();
    }
  }

  function syncCardAccordionDOM() {
    const groups = ['colors', 'elements', 'footer', 'countdown'];
    groups.forEach(key => {
      const isOpen = Boolean(cardAccordionState[key]);
      const btnDesk = document.getElementById(\`btn-accordion-\${key}\`);
      const bodyDesk = document.getElementById(\`accordion-body-\${key}\`);
      const iconDesk = document.getElementById(\`accordion-icon-\${key}\`);
      const btnMob = document.getElementById(\`btn-accordion-\${key}-mob\`);
      const bodyMob = document.getElementById(\`accordion-body-\${key}-mob\`);
      const iconMob = document.getElementById(\`accordion-icon-\${key}-mob\`);

      [btnDesk, btnMob].forEach(b => {
        if (b) b.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
      [bodyDesk, bodyMob].forEach(body => {
        if (body) {
          if (isOpen) body.classList.remove('hidden');
          else body.classList.add('hidden');
        }
      });
      [iconDesk, iconMob].forEach(icon => {
        if (icon) {
          if (isOpen) icon.classList.add('rotate-180');
          else icon.classList.remove('rotate-180');
        }
      });
    });

    const isModelC = primaryState.card_variant === 'C';
    const groupFooterDesk = document.getElementById('accordion-group-footer');
    const groupFooterMob = document.getElementById('accordion-group-footer-mob');
    if (groupFooterDesk) {
      if (isModelC) groupFooterDesk.classList.remove('hidden');
      else groupFooterDesk.classList.add('hidden');
    }
    if (groupFooterMob) {
      if (isModelC) groupFooterMob.classList.remove('hidden');
      else groupFooterMob.classList.add('hidden');
    }

    const isModelB = primaryState.card_variant === 'B';
    const badgeContainerDesk = document.getElementById('cfg-badge-container-desk');
    const badgeContainerMob = document.getElementById('cfg-badge-container-mob');
    if (badgeContainerDesk) {
      if (isModelB) badgeContainerDesk.classList.add('hidden');
      else badgeContainerDesk.classList.remove('hidden');
    }
    if (badgeContainerMob) {
      if (isModelB) badgeContainerMob.classList.remove('hidden');
      else badgeContainerMob.classList.remove('hidden');
    }

    updateSaveAsDefaultLabels();
  }

  function syncEyeToggleIcons() {
    const toggleIds = [
      'cfg-show-rating',
      'cfg-show-sales',
      'cfg-show-strike',
      'cfg-show-discount-badge',
      'cfg-show-ticket-icon',
      'cfg-show-badge',
      'cfg-enable-countdown'
    ];

    toggleIds.forEach(baseId => {
      ['', '-mob'].forEach(suffix => {
        const chk = document.getElementById(baseId + suffix);
        if (!chk) return;
        const isChecked = Boolean(chk.checked);
        const iconOn = document.getElementById(\`\${baseId}\${suffix}-icon-on\`);
        const iconOff = document.getElementById(\`\${baseId}\${suffix}-icon-off\`);
        if (iconOn && iconOff) {
          if (isChecked) {
            iconOn.classList.remove('hidden');
            iconOff.classList.add('hidden');
          } else {
            iconOn.classList.add('hidden');
            iconOff.classList.remove('hidden');
          }
        }
      });
    });
  }

  function updateSaveAsDefaultLabels() {
    const modelName = primaryState.card_variant === 'B' ? 'Kartu Minimalis' : (primaryState.card_variant === 'C' ? 'Kartu Detail' : 'Kartu Klasik');
    const deskLbl = document.getElementById('label-save-as-default-desk');
    const mobLbl = document.getElementById('label-save-as-default-mob');
    if (deskLbl) deskLbl.textContent = \`Gunakan Tema Sebagai Default \${modelName}\`;
    if (mobLbl) mobLbl.textContent = \`Gunakan Tema Sebagai Default \${modelName}\`;
  }

  function markCardDesignAsCustom() {
    captureCardDesignSnapshot();
    primaryState.use_default_card_design = false;
    saveCardConfigInputs();
    syncEyeToggleIcons();
    updateProductCardLivePreview();
  }

  function handleApplyDefaultCardDesign() {
    captureCardDesignSnapshot();
    const variant = primaryState.card_variant || 'A';
    primaryState.use_default_card_design = true;
    loadCardConfigInputs(variant, true);
    saveCardConfigInputs();
    syncEyeToggleIcons();
    updateProductCardLivePreview();
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast('Desain bawaan diterapkan.', 'info');
    }
  }

  function getCardConfigFromDOM() {
    const badgeMain = document.getElementById('cfg-show-badge');
    const badgeMob = document.getElementById('cfg-show-badge-mob');
    const badgeBlokA = document.getElementById('cfg-show-badge-blok-a');
    let showBadgeVal = true;
    if (badgeMain) showBadgeVal = badgeMain.checked;
    else if (badgeMob) showBadgeVal = badgeMob.checked;
    else if (badgeBlokA) showBadgeVal = badgeBlokA.checked;

    const getVal = (id1, id2, fallback) => {
      const el1 = document.getElementById(id1);
      if (el1 && el1.value) return el1.value;
      const el2 = document.getElementById(id2);
      if (el2 && el2.value) return el2.value;
      return fallback;
    };
    const getChk = (id1, id2) => {
      const el1 = document.getElementById(id1);
      if (el1) return el1.checked !== false;
      const el2 = document.getElementById(id2);
      if (el2) return el2.checked !== false;
      return true;
    };

    const defThemeColor = getPrimaryThemeColor();

    return {
      bg_color: getVal('cfg-bg-color', 'cfg-bg-color-mob', '#ffffff'),
      border_color: getVal('cfg-border-color', 'cfg-border-color-mob', '#e2e8f0'),
      border_radius: getVal('cfg-border-radius', 'cfg-border-radius-mob', '16px'),
      title_color: getVal('cfg-title-color', 'cfg-title-color-mob', '#0f172a'),
      price_color: getVal('cfg-price-color', 'cfg-price-color-mob', defThemeColor),
      btn_color: getVal('cfg-btn-color', 'cfg-btn-color-mob', defThemeColor),
      show_rating: getChk('cfg-show-rating', 'cfg-show-rating-mob'),
      show_sales_count: getChk('cfg-show-sales', 'cfg-show-sales-mob'),
      show_strikethrough_price: getChk('cfg-show-strike', 'cfg-show-strike-mob'),
      show_discount_badge: getChk('cfg-show-discount-badge', 'cfg-show-discount-badge-mob'),
      show_ticket_icon: getChk('cfg-show-ticket-icon', 'cfg-show-ticket-icon-mob'),
      show_badge: showBadgeVal,
      show_category_badge: showBadgeVal,
      discount_badge_radius: document.getElementById('cfg-discount-badge-radius')?.value || '8px',
      discount_badge_text_color: document.getElementById('cfg-discount-badge-text-color')?.value || '#ffffff',
      discount_badge_bg_color: document.getElementById('cfg-discount-badge-bg-color')?.value || defThemeColor,
      discount_badge_border_color: document.getElementById('cfg-discount-badge-border-color')?.value || defThemeColor,
      badge_radius: document.getElementById('cfg-badge-radius')?.value || '6px',
      badge_text_color: document.getElementById('cfg-badge-text-color')?.value || defThemeColor,
      badge_bg_color: document.getElementById('cfg-badge-bg-color')?.value || '#ecfdf5',
      badge_border_color: document.getElementById('cfg-badge-border-color')?.value || '#a7f3d0',
      enable_countdown: getChk('cfg-enable-countdown', 'cfg-enable-countdown-mob'),
      countdown_radius: getVal('cfg-countdown-radius', 'cfg-countdown-radius-mob', '9999px'),
      countdown_bg_color: getVal('cfg-countdown-bg-color', 'cfg-countdown-bg-color-mob', defThemeColor),
      countdown_text_color: getVal('cfg-countdown-text-color', 'cfg-countdown-text-color-mob', '#ffffff'),
      countdown_icon_color: getVal('cfg-countdown-icon-color', 'cfg-countdown-icon-color-mob', '#ffffff'),
      countdown_border_color: getVal('cfg-countdown-border-color', 'cfg-countdown-border-color-mob', defThemeColor)
    };
  }

  function loadCardConfigInputs(variantCode, forceDefault = false) {
    const sets = DB.getSettings();
    const configGroup = sets.card_variants_config || {};
    const key = variantCode === 'A' ? 'variant_a' : variantCode === 'B' ? 'variant_b' : 'variant_c';

    const useDefault = forceDefault || primaryState.use_default_card_design !== false;
    primaryState.use_default_card_design = useDefault;

    const defaultCfg = configGroup[key] || {};
    const cfg = (!useDefault && primaryState.card_config) ? primaryState.card_config : defaultCfg;
    const defThemeColor = getPrimaryThemeColor();

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
      const elMob = document.getElementById(id + '-mob');
      if (elMob) elMob.value = val || '';
    };
    const setChk = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.checked = val === true;
      const elMob = document.getElementById(id + '-mob');
      if (elMob) elMob.checked = val === true;
    };

    setVal('cfg-bg-color', cfg.bg_color || '#ffffff');
    setVal('cfg-bg-text', cfg.bg_color || '#ffffff');
    setVal('cfg-border-color', cfg.border_color || '#e2e8f0');
    setVal('cfg-border-text', cfg.border_color || '#e2e8f0');
    setVal('cfg-border-radius', cfg.border_radius || '16px');
    setVal('cfg-title-color', cfg.title_color || '#0f172a');
    setVal('cfg-title-text', cfg.title_color || '#0f172a');
    setVal('cfg-price-color', cfg.price_color || defThemeColor);
    setVal('cfg-price-text', cfg.price_color || defThemeColor);
    setVal('cfg-btn-color', cfg.btn_color || defThemeColor);
    setVal('cfg-btn-text', cfg.btn_color || defThemeColor);

    let showRatingVal = cfg.show_rating !== false;
    let showSalesVal = cfg.show_sales !== false && cfg.show_sales_count !== false;
    if (variantCode === 'B' && showRatingVal && showSalesVal) {
      showSalesVal = false;
    }
    setChk('cfg-show-rating', showRatingVal);
    setChk('cfg-show-sales', showSalesVal);
    setChk('cfg-show-strike', cfg.show_strikethrough_price !== false);
    setChk('cfg-show-discount-badge', cfg.show_discount_badge !== false);
    setChk('cfg-show-ticket-icon', cfg.show_ticket_icon !== false);
    const showBadgeVal = cfg.show_badge !== false && cfg.show_category_badge !== false;
    setChk('cfg-show-badge', showBadgeVal);
    setChk('cfg-show-badge-blok-a', showBadgeVal);

    // Discount badge styling tokens (pada foto produk)
    setVal('cfg-discount-badge-radius', cfg.discount_badge_radius || '8px');
    setVal('cfg-discount-badge-text-color', cfg.discount_badge_text_color || '#ffffff');
    setVal('cfg-discount-badge-text-hex', cfg.discount_badge_text_color || '#ffffff');
    setVal('cfg-discount-badge-bg-color', cfg.discount_badge_bg_color || defThemeColor);
    setVal('cfg-discount-badge-bg-hex', cfg.discount_badge_bg_color || defThemeColor);
    setVal('cfg-discount-badge-border-color', cfg.discount_badge_border_color || defThemeColor);
    setVal('cfg-discount-badge-border-hex', cfg.discount_badge_border_color || defThemeColor);

    // Badge styling tokens
    const defBadgeText = variantCode === 'B' ? '#6b21a8' : defThemeColor;
    const defBadgeBg = variantCode === 'B' ? '#faf5ff' : '#ecfdf5';
    const defBadgeBorder = variantCode === 'B' ? '#e9d5ff' : '#a7f3d0';

    setVal('cfg-badge-radius', cfg.badge_radius || '6px');
    setVal('cfg-badge-text-color', cfg.badge_text_color || defBadgeText);
    setVal('cfg-badge-text-hex', cfg.badge_text_color || defBadgeText);
    setVal('cfg-badge-bg-color', cfg.badge_bg_color || defBadgeBg);
    setVal('cfg-badge-bg-hex', cfg.badge_bg_color || defBadgeBg);
    setVal('cfg-badge-border-color', cfg.badge_border_color || defBadgeBorder);
    setVal('cfg-badge-border-hex', cfg.badge_border_color || defBadgeBorder);

    // Countdown styling tokens
    const cRadius = primaryState.countdown_radius || cfg.countdown_radius || '9999px';
    const cBg = primaryState.countdown_bg_color || cfg.countdown_bg_color || defThemeColor;
    const cTxt = primaryState.countdown_text_color || cfg.countdown_text_color || '#ffffff';
    const cIco = primaryState.countdown_icon_color || cfg.countdown_icon_color || '#ffffff';
    const cBrd = primaryState.countdown_border_color || cfg.countdown_border_color || defThemeColor;
    setVal('cfg-countdown-radius', cRadius);
    setVal('cfg-countdown-bg-color', cBg);
    setVal('cfg-countdown-bg-hex', cBg);
    setVal('cfg-countdown-text-color', cTxt);
    setVal('cfg-countdown-text-hex', cTxt);
    setVal('cfg-countdown-icon-color', cIco);
    setVal('cfg-countdown-icon-hex', cIco);
    setVal('cfg-countdown-border-color', cBrd);
    setVal('cfg-countdown-border-hex', cBrd);
    setChk('cfg-enable-countdown', primaryState.enable_countdown !== false && cfg.enable_countdown !== false);

    // Footer 1 styling tokens (khusus Versi C)
    const fBg = primaryState.footer_bg_color || cfg.footer_bg_color || defThemeColor;
    const fTxt = primaryState.footer_text_color || cfg.footer_text_color || '#ffffff';
    ['cfg-footer-bg-color', 'cfg-footer-bg-color-side', 'cfg-footer-bg-color-mob'].forEach(i => {
      const el = document.getElementById(i);
      if (el) el.value = fBg;
    });
    ['cfg-footer-bg-hex', 'cfg-footer-bg-hex-side', 'cfg-footer-bg-hex-mob'].forEach(i => {
      const el = document.getElementById(i);
      if (el) el.value = fBg;
    });
    ['cfg-footer-text-color', 'cfg-footer-text-color-side', 'cfg-footer-text-color-mob'].forEach(i => {
      const el = document.getElementById(i);
      if (el) el.value = fTxt;
    });
    ['cfg-footer-text-hex', 'cfg-footer-text-hex-side', 'cfg-footer-text-hex-mob'].forEach(i => {
      const el = document.getElementById(i);
      if (el) el.value = fTxt;
    });

    // Footer 2 styling tokens (khusus Versi C)
    const f2Bg = primaryState.footer_2_bg_color || cfg.footer_2_bg_color || defThemeColor;
    const f2Txt = primaryState.footer_2_text_color || cfg.footer_2_text_color || '#ffffff';
    ['cfg-footer-2-bg-color', 'cfg-footer-2-bg-color-side', 'cfg-footer-2-bg-color-mob'].forEach(i => {
      const el = document.getElementById(i);
      if (el) el.value = f2Bg;
    });
    ['cfg-footer-2-bg-hex', 'cfg-footer-2-bg-hex-side', 'cfg-footer-2-bg-hex-mob'].forEach(i => {
      const el = document.getElementById(i);
      if (el) el.value = f2Bg;
    });
    ['cfg-footer-2-text-color', 'cfg-footer-2-text-color-side', 'cfg-footer-2-text-color-mob'].forEach(i => {
      const el = document.getElementById(i);
      if (el) el.value = f2Txt;
    });
    ['cfg-footer-2-text-hex', 'cfg-footer-2-text-hex-side', 'cfg-footer-2-text-hex-mob'].forEach(i => {
      const el = document.getElementById(i);
      if (el) el.value = f2Txt;
    });

    setChk('cfg-save-as-default-toggle', false);
    setChk('cfg-save-as-default-toggle-mob', false);
    updateDesignChoiceButtonsState();
    captureCardDesignSnapshot();
    syncEyeToggleIcons();
    syncCardAccordionDOM();
  }

  function saveCardConfigInputs(forceSaveAsDefault = false) {
    const variantCode = primaryState.card_variant || 'A';
    const key = variantCode === 'A' ? 'variant_a' : variantCode === 'B' ? 'variant_b' : 'variant_c';
    const sets = DB.getSettings();
    if (!sets.card_variants_config) sets.card_variants_config = {};
    if (!sets.card_variants_config[key]) sets.card_variants_config[key] = {};

    const cfg = getCardConfigFromDOM();

    if (primaryState.use_default_card_design === false) {
      primaryState.card_config = { ...cfg };
    } else {
      delete primaryState.card_config;
    }

    const shouldSaveDefault = forceSaveAsDefault || (document.getElementById("cfg-save-as-default-toggle")?.checked === true) || (document.getElementById("cfg-save-as-default-toggle-mob")?.checked === true);
    if (shouldSaveDefault) {
      sets.card_variants_config[key] = {
        ...sets.card_variants_config[key],
        ...cfg
      };
      DB.saveSettings(sets);
    }
  }

  function updateCardCustomizationTabVisuals(isCustomMode) {
    updateSaveAsDefaultLabels();
    syncEyeToggleIcons();
    syncCardAccordionDOM();
  }

  function setCardCustomizationView(isCustomMode) {
    if (isCustomMode) {
      primaryState.use_default_card_design = false;
      saveCardConfigInputs();
      updateProductCardLivePreview();
    } else {
      handleApplyDefaultCardDesign();
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

      // Simpan berhasil -> hasil simpan menjadi nilai baseline untuk pengeditan berikutnya
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

      // 2. Pulihkan input editor
      const isDef = primaryState.use_default_card_design !== false;
      loadCardConfigInputs(primaryState.card_variant || 'A', isDef);
      previewStep1Tab = 'design';

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

      // Pulihkan input countdown di DOM
      const cRadius = primaryState.countdown_radius || '9999px';
      const cBg = primaryState.countdown_bg_color || getThemeBodyColor();
      const cTxt = primaryState.countdown_text_color || '#ffffff';
      const cIco = primaryState.countdown_icon_color || '#ffffff';
      const cBrd = primaryState.countdown_border_color || getThemeBodyColor();
      const cEnable = primaryState.enable_countdown !== false;

      [document.getElementById('cfg-countdown-radius'), document.getElementById('cfg-countdown-radius-mob')].forEach(x => { if (x) x.value = cRadius; });
      [document.getElementById('cfg-countdown-bg-color'), document.getElementById('cfg-countdown-bg-hex'), document.getElementById('cfg-countdown-bg-color-mob'), document.getElementById('cfg-countdown-bg-hex-mob')].forEach(x => { if (x) x.value = cBg; });
      [document.getElementById('cfg-countdown-text-color'), document.getElementById('cfg-countdown-text-hex'), document.getElementById('cfg-countdown-text-color-mob'), document.getElementById('cfg-countdown-text-hex-mob')].forEach(x => { if (x) x.value = cTxt; });
      [document.getElementById('cfg-countdown-icon-color'), document.getElementById('cfg-countdown-icon-hex'), document.getElementById('cfg-countdown-icon-color-mob'), document.getElementById('cfg-countdown-icon-hex-mob')].forEach(x => { if (x) x.value = cIco; });
      [document.getElementById('cfg-countdown-border-color'), document.getElementById('cfg-countdown-border-hex'), document.getElementById('cfg-countdown-border-color-mob'), document.getElementById('cfg-countdown-border-hex-mob')].forEach(x => { if (x) x.value = cBrd; });
      [document.getElementById('cfg-enable-countdown'), document.getElementById('cfg-enable-countdown-mob')].forEach(x => { if (x) x.checked = cEnable; });

      const saveDefToggle = document.getElementById('cfg-save-as-default-toggle');
      const saveDefToggleMob = document.getElementById('cfg-save-as-default-toggle-mob');
      if (saveDefToggle) saveDefToggle.checked = false;
      if (saveDefToggleMob) saveDefToggleMob.checked = false;

      syncEyeToggleIcons();
      syncCardAccordionDOM();
      saveCardConfigInputs();
      updateProductCardLivePreview();

      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('Perubahan desain kartu dibatalkan.', 'info');
      }
    } finally {
      isCancellingCardDesign = false;
    }
  }

  `;

content = content.substring(0, startIdx) + newFunctionsCode + content.substring(endIdx);
fs.writeFileSync('js/product-form.js', content, 'utf8');
console.log('Section A applied successfully!');


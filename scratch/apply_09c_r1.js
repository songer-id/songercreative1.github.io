const fs = require('fs');

let pf = fs.readFileSync('js/product-form.js', 'utf8');
const isCrlf = pf.includes('\r\n');
const eol = isCrlf ? '\r\n' : '\n';

function replaceExact(name, target, replacement) {
  const normTarget = target.replace(/\r\n/g, '\n').replace(/\n/g, eol);
  const normReplacement = replacement.replace(/\r\n/g, '\n').replace(/\n/g, eol);
  if (!pf.includes(normTarget)) {
    console.error(`Target not found for: ${name}`);
    process.exit(1);
  }
  pf = pf.replace(normTarget, normReplacement);
  console.log(`Replaced: ${name}`);
}

// 5. Update getCardConfigFromDOM
const getCardConfigTarget = `      show_strikethrough_price: getChk('cfg-show-strike', 'cfg-show-strike-mob'),
      show_discount_badge: getChk('cfg-show-discount-badge', 'cfg-show-discount-badge-mob'),
      show_ticket_icon: getChk('cfg-show-ticket-icon', 'cfg-show-ticket-icon-mob'),
      show_badge: showBadgeVal,
      show_category_badge: showBadgeVal,
      discount_badge_radius: document.getElementById('cfg-discount-badge-radius')?.value || '8px',
      discount_badge_text_color: document.getElementById('cfg-discount-badge-text-color')?.value || '#ffffff',
      discount_badge_bg_color: document.getElementById('cfg-discount-badge-bg-color')?.value || defThemeColor,
      discount_badge_border_color: document.getElementById('cfg-discount-badge-border-color')?.value || defThemeColor,
      badge_style: getVal('cfg-badge-style', 'cfg-badge-style-mob', 'bg'),
      badge_radius: \`\${parseBadgeRadius(getVal('cfg-badge-radius', 'cfg-badge-radius-mob', '6'), 6)}px\`,
      badge_text_color: getVal('cfg-badge-text-color', 'cfg-badge-text-color-mob', getThemeDefaultBadgeColors(primaryState.card_variant || 'A').text),
      badge_bg_color: getVal('cfg-badge-bg-color', 'cfg-badge-bg-color-mob', getThemeDefaultBadgeColors(primaryState.card_variant || 'A').bg),
      badge_border_color: getVal('cfg-badge-border-color', 'cfg-badge-border-color-mob', getThemeDefaultBadgeColors(primaryState.card_variant || 'A').border),
      enable_countdown: getChk('cfg-enable-countdown', 'cfg-enable-countdown-mob'),
      countdown_radius: getVal('cfg-countdown-radius', 'cfg-countdown-radius-mob', '9999px'),
      countdown_bg_color: getVal('cfg-countdown-bg-color', 'cfg-countdown-bg-color-mob', defThemeColor),
      countdown_text_color: getVal('cfg-countdown-text-color', 'cfg-countdown-text-color-mob', '#ffffff'),
      countdown_icon_color: getVal('cfg-countdown-icon-color', 'cfg-countdown-icon-color-mob', '#ffffff'),
      countdown_border_color: getVal('cfg-countdown-border-color', 'cfg-countdown-border-color-mob', defThemeColor)`;

const getCardConfigReplacement = `      show_strikethrough_price: getChk('cfg-show-strike', 'cfg-show-strike-mob'),
      strike_price_color: getVal('cfg-strike-color', 'cfg-strike-color-mob', '#94a3b8'),
      show_discount_badge: getChk('cfg-show-discount-badge', 'cfg-show-discount-badge-mob'),
      discount_badge_radius: \`\${parseDiscountBadgeRadius(getVal('cfg-discount-badge-radius', 'cfg-discount-badge-radius-mob', '8'), 8)}px\`,
      discount_badge_position: getVal('cfg-discount-badge-position', 'cfg-discount-badge-position-mob', 'top-right'),
      discount_badge_text_color: getVal('cfg-discount-badge-text-color', 'cfg-discount-badge-text-color-mob', '#ffffff'),
      discount_badge_bg_color: getVal('cfg-discount-badge-bg-color', 'cfg-discount-badge-bg-color-mob', defThemeColor),
      discount_badge_border_color: getVal('cfg-discount-badge-border-color', 'cfg-discount-badge-border-color-mob', defThemeColor),
      show_ticket_icon: getChk('cfg-show-ticket-icon', 'cfg-show-ticket-icon-mob'),
      show_badge: showBadgeVal,
      show_category_badge: showBadgeVal,
      badge_style: getVal('cfg-badge-style', 'cfg-badge-style-mob', 'bg'),
      badge_radius: \`\${parseBadgeRadius(getVal('cfg-badge-radius', 'cfg-badge-radius-mob', '6'), 6)}px\`,
      badge_text_color: getVal('cfg-badge-text-color', 'cfg-badge-text-color-mob', getThemeDefaultBadgeColors(primaryState.card_variant || 'A').text),
      badge_bg_color: getVal('cfg-badge-bg-color', 'cfg-badge-bg-color-mob', getThemeDefaultBadgeColors(primaryState.card_variant || 'A').bg),
      badge_border_color: getVal('cfg-badge-border-color', 'cfg-badge-border-color-mob', getThemeDefaultBadgeColors(primaryState.card_variant || 'A').border),
      enable_countdown: getChk('cfg-enable-countdown', 'cfg-enable-countdown-mob'),
      countdown_radius: \`\${parseCountdownRadius(getVal('cfg-countdown-radius', 'cfg-countdown-radius-mob', '6'), 6)}px\`,
      countdown_bg_color: getVal('cfg-countdown-bg-color', 'cfg-countdown-bg-color-mob', defThemeColor),
      countdown_text_color: getVal('cfg-countdown-text-color', 'cfg-countdown-text-color-mob', '#ffffff'),
      countdown_icon_color: getVal('cfg-countdown-icon-color', 'cfg-countdown-icon-color-mob', '#ffffff'),
      countdown_border_color: getVal('cfg-countdown-border-color', 'cfg-countdown-border-color-mob', defThemeColor)`;

replaceExact('getCardConfigFromDOM-09cr1', getCardConfigTarget, getCardConfigReplacement);

// 6. Update loadCardConfigInputs
const loadConfigTarget = `    setChk('cfg-show-strike', cfg.show_strikethrough_price !== false);
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
    setVal('cfg-discount-badge-border-hex', cfg.discount_badge_border_color || defThemeColor);`;

const loadConfigReplacement = `    setChk('cfg-show-strike', cfg.show_strikethrough_price !== false);
    const strikeCol = cfg.strike_price_color || '#94a3b8';
    setVal('cfg-strike-color', strikeCol);
    setVal('cfg-strike-hex', strikeCol);

    setChk('cfg-show-discount-badge', cfg.show_discount_badge !== false);
    const discRadNum = parseDiscountBadgeRadius(cfg.discount_badge_radius, 8);
    setVal('cfg-discount-badge-radius', discRadNum);
    updateDiscountBadgeRadiusPresetButtons(discRadNum);

    const discPos = cfg.discount_badge_position || 'top-right';
    setDiscountBadgePosition(discPos);

    setVal('cfg-discount-badge-text-color', cfg.discount_badge_text_color || '#ffffff');
    setVal('cfg-discount-badge-text-hex', cfg.discount_badge_text_color || '#ffffff');
    setVal('cfg-discount-badge-bg-color', cfg.discount_badge_bg_color || defThemeColor);
    setVal('cfg-discount-badge-bg-hex', cfg.discount_badge_bg_color || defThemeColor);
    setVal('cfg-discount-badge-border-color', cfg.discount_badge_border_color || defThemeColor);
    setVal('cfg-discount-badge-border-hex', cfg.discount_badge_border_color || defThemeColor);

    setChk('cfg-show-ticket-icon', cfg.show_ticket_icon !== false);
    const showBadgeVal = cfg.show_badge !== false && cfg.show_category_badge !== false;
    setChk('cfg-show-badge', showBadgeVal);
    setChk('cfg-show-badge-blok-a', showBadgeVal);`;

replaceExact('loadCardConfigInputs-strike-and-disc', loadConfigTarget, loadConfigReplacement);

const loadConfigCdTarget = `    // Countdown styling tokens
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
    setChk('cfg-enable-countdown', primaryState.enable_countdown !== false && cfg.enable_countdown !== false);`;

const loadConfigCdReplacement = `    // Countdown styling tokens
    const cdRadNum = parseCountdownRadius(primaryState.countdown_radius || cfg.countdown_radius, 6);
    setVal('cfg-countdown-radius', cdRadNum);
    updateCountdownRadiusPresetButtons(cdRadNum);

    const cBg = primaryState.countdown_bg_color || cfg.countdown_bg_color || defThemeColor;
    const cTxt = primaryState.countdown_text_color || cfg.countdown_text_color || '#ffffff';
    const cIco = primaryState.countdown_icon_color || cfg.countdown_icon_color || '#ffffff';
    const cBrd = primaryState.countdown_border_color || cfg.countdown_border_color || defThemeColor;
    setVal('cfg-countdown-bg-color', cBg);
    setVal('cfg-countdown-bg-hex', cBg);
    setVal('cfg-countdown-text-color', cTxt);
    setVal('cfg-countdown-text-hex', cTxt);
    setVal('cfg-countdown-icon-color', cIco);
    setVal('cfg-countdown-icon-hex', cIco);
    setVal('cfg-countdown-border-color', cBrd);
    setVal('cfg-countdown-border-hex', cBrd);
    setChk('cfg-enable-countdown', primaryState.enable_countdown !== false && cfg.enable_countdown !== false);`;

replaceExact('loadCardConfigInputs-countdown-radius', loadConfigCdTarget, loadConfigCdReplacement);

// 7. Update markCardDesignAsCustom & handleApplyDefaultCardDesign to call syncFeatureSubpanels
replaceExact('markCardDesignAsCustom-sync',
`    saveCardConfigInputs();
    syncEyeToggleIcons();
    updateProductCardLivePreview();`,
`    saveCardConfigInputs();
    syncEyeToggleIcons();
    syncFeatureSubpanels();
    updateProductCardLivePreview();`
);

replaceExact('handleApplyDefaultCardDesign-sync',
`    saveCardConfigInputs();
    syncEyeToggleIcons();
    updateProductCardLivePreview();
    if (typeof App !== 'undefined' && App.showToast) {`,
`    saveCardConfigInputs();
    syncEyeToggleIcons();
    syncFeatureSubpanels();
    updateProductCardLivePreview();
    if (typeof App !== 'undefined' && App.showToast) {`
);

// Also add syncFeatureSubpanels at the end of loadCardConfigInputs
replaceExact('loadCardConfigInputs-end-sync',
`    updateDesignChoiceButtonsState();
    captureCardDesignSnapshot();
    syncEyeToggleIcons();
    syncCardAccordionDOM();`,
`    updateDesignChoiceButtonsState();
    captureCardDesignSnapshot();
    syncEyeToggleIcons();
    syncFeatureSubpanels();
    syncCardAccordionDOM();`
);

// 8. Update updateProductCardLivePreview:
// - renderCardPhoto with discount badge position and radius
// - cfg properties (show_strike, strike_price_color, discount_badge_position, etc.)
// - sample simulation preview for Harga Coret, Label Diskon, Label Khusus
const livePreviewPhotoTarget = `            \${(effHasDiscount && cfg.show_discount_badge) ? \`
              <div class="absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 shadow-md uppercase tracking-wider flex items-center justify-center z-10 leading-none" style="\${discBadgeStyle}">
                <span>- % \${effDiscPercent}</span>
              </div>
            \` : ''}`;

const livePreviewPhotoReplacement = `            \${cfg.show_discount_badge ? \`
              <div class="absolute \${discBadgePosClass} text-[10px] font-black px-2 py-0.5 shadow-md uppercase tracking-wider flex items-center justify-center z-10 leading-none" style="\${discBadgeStyle}">
                <span>- % \${effDiscPercent}</span>
              </div>
            \` : ''}`;

replaceExact('livePreview-renderCardPhoto-1', livePreviewPhotoTarget, livePreviewPhotoReplacement);
replaceExact('livePreview-renderCardPhoto-2', livePreviewPhotoTarget, livePreviewPhotoReplacement);

// Update cfg object & discount badge styles in updateProductCardLivePreview
const livePreviewCfgTarget = `      show_strike: document.getElementById('cfg-show-strike')?.checked !== false,
      show_discount_badge: document.getElementById('cfg-show-discount-badge')?.checked !== false,
      show_ticket_icon: document.getElementById('cfg-show-ticket-icon')?.checked !== false,
      show_badge: showBadgeChecked
    };

    const cardStyle = \`background-color: \${cfg.bg_color}; \${cardBorderStyle} border-radius: \${cfg.border_radius}; box-sizing: border-box;\`;
    const titleStyle = \`color: \${cfg.title_color};\`;
    const priceStyle = \`color: \${cfg.price_color};\`;
    const salesCount = (primaryState.sales_count !== undefined && primaryState.sales_count !== null && !isNaN(parseInt(primaryState.sales_count)))
      ? parseInt(primaryState.sales_count, 10)
      : 0;

    // Discount Badge Custom Styles (pada foto produk)
    const discBadgeRadius = document.getElementById('cfg-discount-badge-radius')?.value || '8px';
    const discBadgeTextColor = document.getElementById('cfg-discount-badge-text-color')?.value || '#ffffff';
    const discBadgeBgColor = document.getElementById('cfg-discount-badge-bg-color')?.value || defCardThemeColor;
    const discBadgeBorderColor = document.getElementById('cfg-discount-badge-border-color')?.value || discBadgeBgColor;
    const discBadgeStyle = \`background-color: \${discBadgeBgColor}; color: \${discBadgeTextColor}; border: 1px solid \${discBadgeBorderColor}; border-radius: \${discBadgeRadius};\`;`;

const livePreviewCfgReplacement = `      show_strike: document.getElementById('cfg-show-strike') ? document.getElementById('cfg-show-strike').checked : (primaryState.card_config ? primaryState.card_config.show_strikethrough_price !== false : true),
      show_discount_badge: document.getElementById('cfg-show-discount-badge') ? document.getElementById('cfg-show-discount-badge').checked : (primaryState.card_config ? primaryState.card_config.show_discount_badge !== false : true),
      show_ticket_icon: document.getElementById('cfg-show-ticket-icon') ? document.getElementById('cfg-show-ticket-icon').checked : (primaryState.card_config ? primaryState.card_config.show_ticket_icon !== false : true),
      show_badge: showBadgeChecked
    };

    const cardStyle = \`background-color: \${cfg.bg_color}; \${cardBorderStyle} border-radius: \${cfg.border_radius}; box-sizing: border-box;\`;
    const titleStyle = \`color: \${cfg.title_color};\`;
    const priceStyle = \`color: \${cfg.price_color};\`;
    const salesCount = (primaryState.sales_count !== undefined && primaryState.sales_count !== null && !isNaN(parseInt(primaryState.sales_count)))
      ? parseInt(primaryState.sales_count, 10)
      : 0;

    // Strike Price Styling
    const strikePriceColor = document.getElementById('cfg-strike-color')?.value || primaryState.card_config?.strike_price_color || '#94a3b8';

    // Discount Badge Custom Styles (pada foto produk)
    const rawDiscRadius = document.getElementById('cfg-discount-badge-radius')?.value ?? primaryState.card_config?.discount_badge_radius;
    const discBadgeRadius = \`\${parseDiscountBadgeRadius(rawDiscRadius, 8)}px\`;
    const discBadgePos = document.getElementById('cfg-discount-badge-position')?.value || primaryState.card_config?.discount_badge_position || 'top-right';
    const discBadgePosClass = getDiscountBadgePositionClass(discBadgePos);
    const discBadgeTextColor = document.getElementById('cfg-discount-badge-text-color')?.value || primaryState.card_config?.discount_badge_text_color || '#ffffff';
    const discBadgeBgColor = document.getElementById('cfg-discount-badge-bg-color')?.value || defCardThemeColor;
    const discBadgeBorderColor = document.getElementById('cfg-discount-badge-border-color')?.value || discBadgeBgColor;
    const discBadgeStyle = \`background-color: \${discBadgeBgColor}; color: \${discBadgeTextColor}; border: 1px solid \${discBadgeBorderColor}; border-radius: \${discBadgeRadius};\`;`;

replaceExact('livePreview-cfg-and-disc', livePreviewCfgTarget, livePreviewCfgReplacement);

// Update countdown radius in updateProductCardLivePreview
const livePreviewCdTarget = `    // Countdown Badge Custom Styles
    const countdownRadius = document.getElementById('cfg-countdown-radius')?.value || document.getElementById('cfg-countdown-radius-mob')?.value || primaryState.countdown_radius || '9999px';`;

const livePreviewCdReplacement = `    // Countdown Badge Custom Styles
    const rawCdRadius = document.getElementById('cfg-countdown-radius')?.value ?? document.getElementById('cfg-countdown-radius-mob')?.value ?? primaryState.countdown_radius;
    const countdownRadius = \`\${parseCountdownRadius(rawCdRadius, 6)}px\`;`;

replaceExact('livePreview-countdown-radius', livePreviewCdTarget, livePreviewCdReplacement);

// Update strike price calculation in preview
const livePreviewStrikeCalcTarget = `    // Hitung harga normal, harga coret & harga final di live preview (tanpa default semu 25.000 / 50.000)
    let origStrikePrice = basePrice;
    let effFinalPrice = basePrice;
    if (effHasDiscount) {
      if (hasDiscount && discountedPrice < basePrice) {
        origStrikePrice = basePrice;
        effFinalPrice = discountedPrice;
      } else {
        // Mode simulasi diskon 50%
        if (basePrice > 0) {
          origStrikePrice = basePrice * 2;
          effFinalPrice = basePrice;
        } else {
          origStrikePrice = 0;
          effFinalPrice = 0;
        }
      }
    }`;

const livePreviewStrikeCalcReplacement = `    // Hitung harga normal, harga coret & harga final di live preview
    let origStrikePrice = basePrice;
    let effFinalPrice = basePrice;
    if (hasDiscount && discountedPrice < basePrice) {
      origStrikePrice = basePrice;
      effFinalPrice = discountedPrice;
    } else if (effHasDiscount) {
      // Mode simulasi diskon 50%
      if (basePrice > 0) {
        origStrikePrice = basePrice * 2;
        effFinalPrice = basePrice;
      } else {
        origStrikePrice = 150000;
        effFinalPrice = 75000;
      }
    } else if (cfg.show_strike) {
      // Jika harga coret aktif dan tidak ada diskon promo tersimpan, sediakan harga pembanding simulasi untuk preview
      if (basePrice > 0) {
        origStrikePrice = Math.round(basePrice * 1.3);
        effFinalPrice = basePrice;
      } else {
        origStrikePrice = 150000;
        effFinalPrice = 115000;
      }
    }`;

replaceExact('livePreview-strike-calc', livePreviewStrikeCalcTarget, livePreviewStrikeCalcReplacement);

// Update custom badges fallback in preview
const livePreviewBadgesTarget = `    primaryState.custom_labels = rawCustomLabels.slice(0, 2);

    const customBadges = getSmartVisibleBadges(name, rawCustomLabels);`;

const livePreviewBadgesReplacement = `    primaryState.custom_labels = rawCustomLabels.slice(0, 2);

    let displayBadges = rawCustomLabels;
    if (displayBadges.length === 0 && cfg.show_badge) {
      displayBadges = ['Label Khusus'];
    }
    const customBadges = getSmartVisibleBadges(name, displayBadges);`;

replaceExact('livePreview-badges-fallback', livePreviewBadgesTarget, livePreviewBadgesReplacement);

// Update Strike Price styling in Variant B, C, A templates
replaceExact('strike-template-variantB',
`                  <span class="text-[10px] line-through text-slate-400 font-normal leading-none">
                    \${formatIDR(origStrikePrice)}
                  </span>`,
`                  <span class="text-[10px] line-through font-normal leading-none" style="color: \${strikePriceColor};">
                    \${formatIDR(origStrikePrice)}
                  </span>`
);

replaceExact('strike-template-variantC',
`                \${(effHasDiscount && cfg.show_strike) ? \`
                  <span class="text-[10px] sm:text-[11px] line-through text-slate-400 font-normal leading-none mb-1">
                    \${formatIDR(origStrikePrice)}
                  </span>
                \` : ''}`,
`                \${(cfg.show_strike && origStrikePrice > 0) ? \`
                  <span class="text-[10px] sm:text-[11px] line-through font-normal leading-none mb-1" style="color: \${strikePriceColor};">
                    \${formatIDR(origStrikePrice)}
                  </span>
                \` : ''}`
);

replaceExact('strike-template-variantA',
`                \${(effHasDiscount && cfg.show_strike) ? \`
                  <span class="text-[10px] sm:text-[11px] line-through text-slate-400 font-normal leading-none mb-1">
                    \${formatIDR(origStrikePrice)}
                  </span>
                \` : ''}`,
`                \${(cfg.show_strike && origStrikePrice > 0) ? \`
                  <span class="text-[10px] sm:text-[11px] line-through font-normal leading-none mb-1" style="color: \${strikePriceColor};">
                    \${formatIDR(origStrikePrice)}
                  </span>
                \` : ''}`
);

// 9. Update event listeners in bindCardConfigEvents
const eventListenersTarget = `    // Feature Toggles (Desktop & Mobile Sync)
    ['show-rating', 'show-sales', 'show-strike', 'show-discount-badge', 'show-ticket-icon', 'show-badge'].forEach(feat => {`;

const eventListenersReplacement = `    // Strike Price Color Listeners (Desktop & Mobile Sync)
    const strikeColorPairs = [
      { color: 'cfg-strike-color', hex: 'cfg-strike-hex' }
    ];
    strikeColorPairs.forEach(pair => {
      const deskColor = document.getElementById(pair.color);
      const deskHex = document.getElementById(pair.hex);
      const mobColor = document.getElementById(\`\${pair.color}-mob\`);
      const mobHex = document.getElementById(\`\${pair.hex}-mob\`);

      const syncAllStrikeColors = (val) => {
        if (deskColor) deskColor.value = val;
        if (deskHex) deskHex.value = val;
        if (mobColor) mobColor.value = val;
        if (mobHex) mobHex.value = val;
        markCardDesignAsCustom();
      };

      if (deskColor) deskColor.addEventListener('input', e => syncAllStrikeColors(e.target.value));
      if (deskHex) deskHex.addEventListener('input', e => syncAllStrikeColors(e.target.value));
      if (mobColor) mobColor.addEventListener('input', e => syncAllStrikeColors(e.target.value));
      if (mobHex) mobHex.addEventListener('input', e => syncAllStrikeColors(e.target.value));
    });

    // Discount Badge Radius Sliders and Presets (Desktop & Mobile Sync)
    const discRadiusDesk = document.getElementById('cfg-discount-badge-radius');
    const discRadiusMob = document.getElementById('cfg-discount-badge-radius-mob');

    const handleDiscRadiusInput = (val) => {
      const num = parseDiscountBadgeRadius(val, 8);
      if (discRadiusDesk) discRadiusDesk.value = num;
      if (discRadiusMob) discRadiusMob.value = num;
      updateDiscountBadgeRadiusPresetButtons(num);
      markCardDesignAsCustom();
    };

    if (discRadiusDesk) {
      discRadiusDesk.addEventListener('input', (e) => handleDiscRadiusInput(e.target.value));
    }
    if (discRadiusMob) {
      discRadiusMob.addEventListener('input', (e) => handleDiscRadiusInput(e.target.value));
    }

    document.querySelectorAll('.btn-disc-radius-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleDiscRadiusInput(btn.dataset.value);
      });
    });

    // Discount Badge Position Buttons (Desktop & Mobile Sync)
    document.querySelectorAll('.btn-disc-pos').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const pos = btn.dataset.pos;
        setDiscountBadgePosition(pos);
        markCardDesignAsCustom();
      });
    });

    // Discount Badge Colors (Desktop & Mobile Sync)
    const discColorPairs = [
      { color: 'cfg-discount-badge-text-color', hex: 'cfg-discount-badge-text-hex' },
      { color: 'cfg-discount-badge-bg-color', hex: 'cfg-discount-badge-bg-hex' }
    ];
    discColorPairs.forEach(pair => {
      const deskColor = document.getElementById(pair.color);
      const deskHex = document.getElementById(pair.hex);
      const mobColor = document.getElementById(\`\${pair.color}-mob\`);
      const mobHex = document.getElementById(\`\${pair.hex}-mob\`);

      const syncAllDiscColors = (val) => {
        if (deskColor) deskColor.value = val;
        if (deskHex) deskHex.value = val;
        if (mobColor) mobColor.value = val;
        if (mobHex) mobHex.value = val;
        markCardDesignAsCustom();
      };

      if (deskColor) deskColor.addEventListener('input', e => syncAllDiscColors(e.target.value));
      if (deskHex) deskHex.addEventListener('input', e => syncAllDiscColors(e.target.value));
      if (mobColor) mobColor.addEventListener('input', e => syncAllDiscColors(e.target.value));
      if (mobHex) mobHex.addEventListener('input', e => syncAllDiscColors(e.target.value));
    });

    // Countdown Radius Sliders and Presets (Desktop & Mobile Sync)
    const cdRadiusDesk = document.getElementById('cfg-countdown-radius');
    const cdRadiusMob = document.getElementById('cfg-countdown-radius-mob');

    const handleCdRadiusInput = (val) => {
      const num = parseCountdownRadius(val, 6);
      if (cdRadiusDesk) cdRadiusDesk.value = num;
      if (cdRadiusMob) cdRadiusMob.value = num;
      updateCountdownRadiusPresetButtons(num);
      markCardDesignAsCustom();
    };

    if (cdRadiusDesk) {
      cdRadiusDesk.addEventListener('input', (e) => handleCdRadiusInput(e.target.value));
    }
    if (cdRadiusMob) {
      cdRadiusMob.addEventListener('input', (e) => handleCdRadiusInput(e.target.value));
    }

    document.querySelectorAll('.btn-countdown-radius-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleCdRadiusInput(btn.dataset.value);
      });
    });

    // Feature Toggles (Desktop & Mobile Sync)
    ['show-rating', 'show-sales', 'show-strike', 'show-discount-badge', 'show-ticket-icon', 'show-badge'].forEach(feat => {`;

replaceExact('bindCardConfigEvents-feature-subpanels-wiring', eventListenersTarget, eventListenersReplacement);

// Also in cdEnable listener, call syncFeatureSubpanels
replaceExact('cdEnable-sync',
`    if (cdEnable) {
      cdEnable.addEventListener('change', (e) => {
        if (cdEnableMob) cdEnableMob.checked = e.target.checked;
        markCardDesignAsCustom();
      });
    }`,
`    if (cdEnable) {
      cdEnable.addEventListener('change', (e) => {
        if (cdEnableMob) cdEnableMob.checked = e.target.checked;
        syncFeatureSubpanels();
        markCardDesignAsCustom();
      });
    }`
);

replaceExact('cdEnableMob-sync',
`    if (cdEnableMob) {
      cdEnableMob.addEventListener('change', (e) => {
        if (cdEnable) cdEnable.checked = e.target.checked;
        markCardDesignAsCustom();
      });
    }`,
`    if (cdEnableMob) {
      cdEnableMob.addEventListener('change', (e) => {
        if (cdEnable) cdEnable.checked = e.target.checked;
        syncFeatureSubpanels();
        markCardDesignAsCustom();
      });
    }`
);

fs.writeFileSync('js/product-form.js', pf, 'utf8');
console.log('js/product-form.js updated successfully for Task 09C-R1');

const fs = require('fs');
let content = fs.readFileSync('js/product-form.js', 'utf8');
const isCrlf = content.includes('\r\n');
const eol = isCrlf ? '\r\n' : '\n';

function replaceExact(name, target, replacement) {
  const normTarget = target.replace(/\n/g, eol);
  const normReplacement = replacement.replace(/\n/g, eol);
  if (!content.includes(normTarget)) {
    console.error(`Target not found for: ${name}`);
    process.exit(1);
  }
  content = content.replace(normTarget, normReplacement);
  console.log(`Replaced: ${name}`);
}

// 1. Desktop Accordion Bingkai Kartu replacement
replaceExact('desktop-frame-markup',
`<div class="col-span-2">
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Radius Sudut</label>
                        <select id="cfg-border-radius" class="w-full px-1.5 py-1 text-[11px] font-normal border border-slate-200 rounded outline-none bg-white">
                          <option value="0px">0px (Kotak)</option>
                          <option value="8px">8px (Kecil)</option>
                          <option value="16px">16px (Sedang)</option>
                          <option value="24px">24px (Besar)</option>
                        </select>
                      </div>`,
`<div class="col-span-2 space-y-1.5 pt-1">
                        <div class="flex items-center justify-between">
                          <label for="cfg-border-width" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Ketebalan Garis Tepi</label>
                          <span id="cfg-border-width-val" class="text-[11px] font-mono font-normal text-slate-700">1 px</span>
                        </div>
                        <input type="range" id="cfg-border-width" min="0" max="3" step="1" value="1" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                        <div class="flex items-center gap-1 pt-0.5">
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="1">1 px</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="2">2 px</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="3">3 px</button>
                        </div>
                      </div>
                      <div class="col-span-2 space-y-1.5 pt-1">
                        <div class="flex items-center justify-between">
                          <label for="cfg-border-radius" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                          <span id="cfg-border-radius-val" class="text-[11px] font-mono font-normal text-slate-700">16 px</span>
                        </div>
                        <input type="range" id="cfg-border-radius" min="0" max="24" step="1" value="16" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                        <div class="flex items-center gap-1 pt-0.5">
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="8">8 px</button>
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="16">16 px</button>
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="24">24 px</button>
                        </div>
                      </div>`
);

// 2. Mobile Accordion Bingkai Kartu replacement
replaceExact('mobile-frame-markup',
`<div class="col-span-2">
                        <label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Radius Sudut</label>
                        <select id="cfg-border-radius-mob" class="w-full px-1.5 py-1 text-[11px] font-normal border border-slate-200 rounded outline-none bg-white">
                          <option value="0px">0px (Kotak)</option>
                          <option value="8px">8px (Kecil)</option>
                          <option value="16px">16px (Sedang)</option>
                          <option value="24px">24px (Besar)</option>
                        </select>
                      </div>`,
`<div class="col-span-2 space-y-1.5 pt-1">
                        <div class="flex items-center justify-between">
                          <label for="cfg-border-width-mob" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Ketebalan Garis Tepi</label>
                          <span id="cfg-border-width-val-mob" class="text-[11px] font-mono font-normal text-slate-700">1 px</span>
                        </div>
                        <input type="range" id="cfg-border-width-mob" min="0" max="3" step="1" value="1" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                        <div class="flex items-center gap-1 pt-0.5">
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="1">1 px</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="2">2 px</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="3">3 px</button>
                        </div>
                      </div>
                      <div class="col-span-2 space-y-1.5 pt-1">
                        <div class="flex items-center justify-between">
                          <label for="cfg-border-radius-mob" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                          <span id="cfg-border-radius-val-mob" class="text-[11px] font-mono font-normal text-slate-700">16 px</span>
                        </div>
                        <input type="range" id="cfg-border-radius-mob" min="0" max="24" step="1" value="16" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                        <div class="flex items-center gap-1 pt-0.5">
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="8">8 px</button>
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="16">16 px</button>
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="24">24 px</button>
                        </div>
                      </div>`
);

// 3. Helper functions before getCardConfigFromDOM
replaceExact('helper-functions',
"  function getCardConfigFromDOM() {",
`  function parseBorderWidth(val, defaultVal = 1) {
    if (val === undefined || val === null || val === '') return defaultVal;
    const num = parseInt(val, 10);
    if (isNaN(num)) return defaultVal;
    return Math.max(0, Math.min(3, num));
  }

  function parseBorderRadius(val, defaultVal = 16) {
    if (val === undefined || val === null || val === '') return defaultVal;
    const num = parseInt(val, 10);
    if (isNaN(num)) return defaultVal;
    return Math.max(0, Math.min(24, num));
  }

  function updateBorderWidthPresetButtons(val) {
    const num = parseBorderWidth(val, 1);
    document.querySelectorAll('.btn-border-width-preset').forEach(btn => {
      const btnVal = parseInt(btn.dataset.value, 10);
      if (btnVal === num) {
        btn.className = 'btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer';
      } else {
        btn.className = 'btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer';
      }
    });
    const valLabelDesk = document.getElementById('cfg-border-width-val');
    const valLabelMob = document.getElementById('cfg-border-width-val-mob');
    if (valLabelDesk) valLabelDesk.textContent = \`\${num} px\`;
    if (valLabelMob) valLabelMob.textContent = \`\${num} px\`;
  }

  function updateBorderRadiusPresetButtons(val) {
    const num = parseBorderRadius(val, 16);
    document.querySelectorAll('.btn-border-radius-preset').forEach(btn => {
      const btnVal = parseInt(btn.dataset.value, 10);
      if (btnVal === num) {
        btn.className = 'btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer';
      } else {
        btn.className = 'btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer';
      }
    });
    const valLabelDesk = document.getElementById('cfg-border-radius-val');
    const valLabelMob = document.getElementById('cfg-border-radius-val-mob');
    if (valLabelDesk) valLabelDesk.textContent = \`\${num} px\`;
    if (valLabelMob) valLabelMob.textContent = \`\${num} px\`;
  }

  function getCardConfigFromDOM() {`
);

// 4. Update getCardConfigFromDOM to read border_width and border_radius
replaceExact('getCardConfigFromDOM-fields',
`    return {
      bg_color: getVal('cfg-bg-color', 'cfg-bg-color-mob', '#ffffff'),
      border_color: getVal('cfg-border-color', 'cfg-border-color-mob', '#e2e8f0'),
      border_radius: getVal('cfg-border-radius', 'cfg-border-radius-mob', '16px'),`,
`    const rawBw = getVal('cfg-border-width', 'cfg-border-width-mob', '1');
    const bwVal = parseBorderWidth(rawBw, 1);
    const rawBr = getVal('cfg-border-radius', 'cfg-border-radius-mob', '16');
    const brVal = parseBorderRadius(rawBr, 16);

    return {
      bg_color: getVal('cfg-bg-color', 'cfg-bg-color-mob', '#ffffff'),
      border_color: getVal('cfg-border-color', 'cfg-border-color-mob', '#e2e8f0'),
      border_width: \`\${bwVal}px\`,
      border_radius: \`\${brVal}px\`,`
);

// 5. Update loadCardConfigInputs
replaceExact('loadCardConfigInputs-fields',
`    const defaultCfg = configGroup[key] || {};
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
    setVal('cfg-border-radius', cfg.border_radius || '16px');`,
`    const fallbackDefault = (typeof DB !== 'undefined' && DB.DEFAULT_CARD_VARIANTS_CONFIG) ? DB.DEFAULT_CARD_VARIANTS_CONFIG[key] : {};
    const defaultCfg = { ...fallbackDefault, ...(configGroup[key] || {}) };
    const cfg = (!useDefault && primaryState.card_config) ? { ...defaultCfg, ...primaryState.card_config } : defaultCfg;
    const defThemeColor = getPrimaryThemeColor();

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = (val !== undefined && val !== null) ? val : '';
      const elMob = document.getElementById(id + '-mob');
      if (elMob) elMob.value = (val !== undefined && val !== null) ? val : '';
    };
    const setChk = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.checked = val === true;
      const elMob = document.getElementById(id + '-mob');
      if (elMob) elMob.checked = val === true;
    };

    setVal('cfg-bg-color', cfg.bg_color || defaultCfg.bg_color || '#ffffff');
    setVal('cfg-bg-text', cfg.bg_color || defaultCfg.bg_color || '#ffffff');
    setVal('cfg-border-color', cfg.border_color || defaultCfg.border_color || '#e2e8f0');
    setVal('cfg-border-text', cfg.border_color || defaultCfg.border_color || '#e2e8f0');

    const bwNum = parseBorderWidth(cfg.border_width, 1);
    setVal('cfg-border-width', bwNum);
    updateBorderWidthPresetButtons(bwNum);

    const brNum = parseBorderRadius(cfg.border_radius, 16);
    setVal('cfg-border-radius', brNum);
    updateBorderRadiusPresetButtons(brNum);`
);

// 6. Update renderCardPhoto in updateProductCardLivePreview to inherit top border-radius
replaceExact('renderCardPhoto-box-1',
'<div class="relative w-full ${aspectRatioClass} bg-slate-100 overflow-hidden cursor-pointer shrink-0">',
'<div class="relative w-full ${aspectRatioClass} bg-slate-100 overflow-hidden cursor-pointer shrink-0" style="border-top-left-radius: inherit; border-top-right-radius: inherit;">'
);

replaceExact('renderCardPhoto-img',
'<img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300"',
'<img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" style="border-top-left-radius: inherit; border-top-right-radius: inherit;"'
);

replaceExact('renderCardPhoto-box-2',
'<div class="relative w-full ${aspectRatioClass} bg-slate-100 overflow-hidden flex flex-col items-center justify-center text-slate-400 shrink-0">',
'<div class="relative w-full ${aspectRatioClass} bg-slate-100 overflow-hidden flex flex-col items-center justify-center text-slate-400 shrink-0" style="border-top-left-radius: inherit; border-top-right-radius: inherit;">'
);

// 7. Update updateProductCardLivePreview color resolution, border_width, border_radius, cardStyle
replaceExact('preview-config-resolution',
`    // Cek apakah panel kustomisasi kartu sedang aktif dalam mode Ubah Kartu
    const isCustomDesignActive = document.getElementById('panel-card-custom-content') && !document.getElementById('panel-card-custom-content').classList.contains('hidden');

    let rawBg = document.getElementById('cfg-bg-color')?.value;
    let rawBorder = document.getElementById('cfg-border-color')?.value;
    let rawTitle = document.getElementById('cfg-title-color')?.value;
    let rawPrice = document.getElementById('cfg-price-color')?.value;
    let rawBtn = document.getElementById('cfg-btn-color')?.value;

    const defCardThemeColor = getPrimaryThemeColor();

    // Pastikan jika mode default atau belum diubah, bg_color = #ffffff (putih bersih), tidak pernah #000000!
    const safeBg = (!isCustomDesignActive || !rawBg || rawBg.toLowerCase() === '#000000') ? '#ffffff' : rawBg;
    const safeBorder = (!isCustomDesignActive || !rawBorder || rawBorder.toLowerCase() === '#000000') ? '#e2e8f0' : rawBorder;
    const safeTitle = (!isCustomDesignActive || !rawTitle || rawTitle.toLowerCase() === '#000000') ? '#0f172a' : rawTitle;
    const safePrice = (!isCustomDesignActive || !rawPrice || rawPrice.toLowerCase() === '#000000') ? defCardThemeColor : rawPrice;
    const safeBtn = (!isCustomDesignActive || !rawBtn || rawBtn.toLowerCase() === '#000000') ? defCardThemeColor : rawBtn;

    const showRatingChecked = document.getElementById('cfg-show-rating')
      ? document.getElementById('cfg-show-rating').checked
      : (document.getElementById('cfg-show-rating-mob')
          ? document.getElementById('cfg-show-rating-mob').checked
          : (primaryState.card_config ? primaryState.card_config.show_rating !== false : true));

    const showSalesChecked = document.getElementById('cfg-show-sales')
      ? document.getElementById('cfg-show-sales').checked
      : (document.getElementById('cfg-show-sales-mob')
          ? document.getElementById('cfg-show-sales-mob').checked
          : (primaryState.card_config ? (primaryState.card_config.show_sales !== false && primaryState.card_config.show_sales_count !== false) : true));

    const cfg = {
      bg_color: safeBg,
      border_color: safeBorder,
      border_radius: document.getElementById('cfg-border-radius')?.value || '16px',
      title_color: safeTitle,
      price_color: safePrice,
      btn_color: safeBtn,
      show_rating: showRatingChecked,
      show_sales: showSalesChecked,
      show_sales_count: showSalesChecked,
      show_strike: document.getElementById('cfg-show-strike')?.checked !== false,
      show_discount_badge: document.getElementById('cfg-show-discount-badge')?.checked !== false,
      show_ticket_icon: document.getElementById('cfg-show-ticket-icon')?.checked !== false,
      show_badge: showBadgeChecked
    };

    const cardStyle = \`background-color: \${cfg.bg_color}; border-color: \${cfg.border_color}; border-radius: \${cfg.border_radius};\`;`,
`    const vCode = primaryState.card_variant || 'A';
    const vKey = vCode === 'A' ? 'variant_a' : (vCode === 'B' ? 'variant_b' : 'variant_c');
    const sets = (typeof DB !== 'undefined' && DB.getSettings) ? DB.getSettings() : {};
    const variantsConfig = sets.card_variants_config || (typeof DB !== 'undefined' && DB.DEFAULT_CARD_VARIANTS_CONFIG) || {};
    const modelDefault = variantsConfig[vKey] || (typeof DB !== 'undefined' && DB.DEFAULT_CARD_VARIANTS_CONFIG ? DB.DEFAULT_CARD_VARIANTS_CONFIG[vKey] : {}) || {};

    const defCardThemeColor = getPrimaryThemeColor();
    const defaultBorderColor = modelDefault.border_color || (vCode === 'B' ? '#e9d5ff' : (vCode === 'C' ? '#fed7aa' : '#e2e8f0'));
    const defaultBgColor = modelDefault.bg_color || '#ffffff';
    const defaultTitleColor = modelDefault.title_color || '#0f172a';
    const defaultPriceColor = modelDefault.price_color || defCardThemeColor;
    const defaultBtnColor = modelDefault.btn_color || defCardThemeColor;
    const defaultBorderWidth = parseBorderWidth(modelDefault.border_width, 1);
    const defaultBorderRadius = parseBorderRadius(modelDefault.border_radius, 16);

    const isCustomMode = primaryState.use_default_card_design === false;

    let rawBg = document.getElementById('cfg-bg-color')?.value;
    let rawBorder = document.getElementById('cfg-border-color')?.value;
    let rawTitle = document.getElementById('cfg-title-color')?.value;
    let rawPrice = document.getElementById('cfg-price-color')?.value;
    let rawBtn = document.getElementById('cfg-btn-color')?.value;

    const safeBg = (isCustomMode && rawBg && rawBg.toLowerCase() !== '#000000') ? rawBg : (primaryState.card_config?.bg_color || defaultBgColor);
    const safeBorder = (isCustomMode && rawBorder && rawBorder.toLowerCase() !== '#000000') ? rawBorder : (primaryState.card_config?.border_color || defaultBorderColor);
    const safeTitle = (isCustomMode && rawTitle && rawTitle.toLowerCase() !== '#000000') ? rawTitle : (primaryState.card_config?.title_color || defaultTitleColor);
    const safePrice = (isCustomMode && rawPrice && rawPrice.toLowerCase() !== '#000000') ? rawPrice : (primaryState.card_config?.price_color || defaultPriceColor);
    const safeBtn = (isCustomMode && rawBtn && rawBtn.toLowerCase() !== '#000000') ? rawBtn : (primaryState.card_config?.btn_color || defaultBtnColor);

    const domBw = document.getElementById('cfg-border-width')?.value ?? document.getElementById('cfg-border-width-mob')?.value;
    const rawBw = (domBw !== undefined && domBw !== null && domBw !== '') ? domBw : primaryState.card_config?.border_width;
    const borderWidthNum = isCustomMode
      ? parseBorderWidth(rawBw, defaultBorderWidth)
      : defaultBorderWidth;

    const domBr = document.getElementById('cfg-border-radius')?.value ?? document.getElementById('cfg-border-radius-mob')?.value;
    const rawBr = (domBr !== undefined && domBr !== null && domBr !== '') ? domBr : primaryState.card_config?.border_radius;
    const borderRadiusNum = isCustomMode
      ? parseBorderRadius(rawBr, defaultBorderRadius)
      : defaultBorderRadius;

    const cardBorderStyle = borderWidthNum === 0
      ? 'border: none; border-width: 0px;'
      : \`border: \${borderWidthNum}px solid \${safeBorder};\`;

    const showRatingChecked = document.getElementById('cfg-show-rating')
      ? document.getElementById('cfg-show-rating').checked
      : (document.getElementById('cfg-show-rating-mob')
          ? document.getElementById('cfg-show-rating-mob').checked
          : (primaryState.card_config ? primaryState.card_config.show_rating !== false : true));

    const showSalesChecked = document.getElementById('cfg-show-sales')
      ? document.getElementById('cfg-show-sales').checked
      : (document.getElementById('cfg-show-sales-mob')
          ? document.getElementById('cfg-show-sales-mob').checked
          : (primaryState.card_config ? (primaryState.card_config.show_sales !== false && primaryState.card_config.show_sales_count !== false) : true));

    const cfg = {
      bg_color: safeBg,
      border_color: safeBorder,
      border_width: \`\${borderWidthNum}px\`,
      border_radius: \`\${borderRadiusNum}px\`,
      title_color: safeTitle,
      price_color: safePrice,
      btn_color: safeBtn,
      show_rating: showRatingChecked,
      show_sales: showSalesChecked,
      show_sales_count: showSalesChecked,
      show_strike: document.getElementById('cfg-show-strike')?.checked !== false,
      show_discount_badge: document.getElementById('cfg-show-discount-badge')?.checked !== false,
      show_ticket_icon: document.getElementById('cfg-show-ticket-icon')?.checked !== false,
      show_badge: showBadgeChecked
    };

    const cardStyle = \`background-color: \${cfg.bg_color}; \${cardBorderStyle} border-radius: \${cfg.border_radius}; box-sizing: border-box;\`;`
);

// 8. Model B & Model C card preview outer markup
replaceExact('model-b-outer',
`<div class="h-full flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 group relative bg-white rounded-2xl" style="\${cardStyle}">
          \${renderCardPhoto('aspect-[3/4] rounded-t-lg')}`,
`<div class="h-full flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 group relative bg-white" style="\${cardStyle}">
          \${renderCardPhoto('aspect-[3/4]')}`
);

replaceExact('model-c-outer',
"${renderCardPhoto('aspect-[4/3] rounded-t-2xl')}",
"${renderCardPhoto('aspect-[4/3]')}"
);

// 9. Update event listeners in bindCardConfigEvents
replaceExact('listeners-binding',
`    // Card Config Listeners (Desktop & Mobile Sync)
    const cfgInputs = ['bg', 'border', 'title', 'price', 'btn'].flatMap(prefix => [\`cfg-\${prefix}-color\`, \`cfg-\${prefix}-text\`]);
    cfgInputs.push('cfg-border-radius');
    cfgInputs.forEach(id => {
      const el = document.getElementById(id);
      const elMob = document.getElementById(\`\${id}-mob\`);

      if (el) {
        el.addEventListener('input', (e) => {
          if (id.endsWith('-color')) {
            const textId = id.replace('-color', '-text');
            const textEl = document.getElementById(textId);
            if (textEl) textEl.value = e.target.value;
            const mobColor = document.getElementById(\`\${id}-mob\`);
            if (mobColor) mobColor.value = e.target.value;
            const mobText = document.getElementById(\`\${textId}-mob\`);
            if (mobText) mobText.value = e.target.value;
          } else if (id.endsWith('-text')) {
            const colorId = id.replace('-text', '-color');
            const colorEl = document.getElementById(colorId);
            if (colorEl) colorEl.value = e.target.value;
            const mobText = document.getElementById(\`\${id}-mob\`);
            if (mobText) mobText.value = e.target.value;
            const mobColor = document.getElementById(\`\${colorId}-mob\`);
            if (mobColor) mobColor.value = e.target.value;
          } else if (id === 'cfg-border-radius') {
            const mobRadius = document.getElementById('cfg-border-radius-mob');
            if (mobRadius) mobRadius.value = e.target.value;
          }
          markCardDesignAsCustom();
        });
      }

      if (elMob) {
        elMob.addEventListener('input', (e) => {
          if (id.endsWith('-color')) {
            const textId = id.replace('-color', '-text');
            const mobText = document.getElementById(\`\${textId}-mob\`);
            if (mobText) mobText.value = e.target.value;
            const deskColor = document.getElementById(id);
            if (deskColor) deskColor.value = e.target.value;
            const deskText = document.getElementById(textId);
            if (deskText) deskText.value = e.target.value;
          } else if (id.endsWith('-text')) {
            const colorId = id.replace('-text', '-color');
            const mobColor = document.getElementById(\`\${colorId}-mob\`);
            if (mobColor) mobColor.value = e.target.value;
            const deskText = document.getElementById(id);
            if (deskText) deskText.value = e.target.value;
            const deskColor = document.getElementById(colorId);
            if (deskColor) deskColor.value = e.target.value;
          } else if (id === 'cfg-border-radius') {
            const deskRadius = document.getElementById('cfg-border-radius');
            if (deskRadius) deskRadius.value = e.target.value;
          }
          markCardDesignAsCustom();
        });
      }
    });`,
`    // Card Config Listeners (Desktop & Mobile Sync)
    const cfgInputs = ['bg', 'border', 'title', 'price', 'btn'].flatMap(prefix => [\`cfg-\${prefix}-color\`, \`cfg-\${prefix}-text\`]);
    cfgInputs.forEach(id => {
      const el = document.getElementById(id);
      const elMob = document.getElementById(\`\${id}-mob\`);

      if (el) {
        el.addEventListener('input', (e) => {
          if (id.endsWith('-color')) {
            const textId = id.replace('-color', '-text');
            const textEl = document.getElementById(textId);
            if (textEl) textEl.value = e.target.value;
            const mobColor = document.getElementById(\`\${id}-mob\`);
            if (mobColor) mobColor.value = e.target.value;
            const mobText = document.getElementById(\`\${textId}-mob\`);
            if (mobText) mobText.value = e.target.value;
          } else if (id.endsWith('-text')) {
            const colorId = id.replace('-text', '-color');
            const colorEl = document.getElementById(colorId);
            if (colorEl) colorEl.value = e.target.value;
            const mobText = document.getElementById(\`\${id}-mob\`);
            if (mobText) mobText.value = e.target.value;
            const mobColor = document.getElementById(\`\${colorId}-mob\`);
            if (mobColor) mobColor.value = e.target.value;
          }
          markCardDesignAsCustom();
        });
      }

      if (elMob) {
        elMob.addEventListener('input', (e) => {
          if (id.endsWith('-color')) {
            const textId = id.replace('-color', '-text');
            const mobText = document.getElementById(\`\${textId}-mob\`);
            if (mobText) mobText.value = e.target.value;
            const deskColor = document.getElementById(id);
            if (deskColor) deskColor.value = e.target.value;
            const deskText = document.getElementById(textId);
            if (deskText) deskText.value = e.target.value;
          } else if (id.endsWith('-text')) {
            const colorId = id.replace('-text', '-color');
            const mobColor = document.getElementById(\`\${colorId}-mob\`);
            if (mobColor) mobColor.value = e.target.value;
            const deskText = document.getElementById(id);
            if (deskText) deskText.value = e.target.value;
            const deskColor = document.getElementById(colorId);
            if (deskColor) deskColor.value = e.target.value;
          }
          markCardDesignAsCustom();
        });
      }
    });

    // Border Width & Radius Sliders and Presets (Desktop & Mobile Sync)
    const bwSliderDesk = document.getElementById('cfg-border-width');
    const bwSliderMob = document.getElementById('cfg-border-width-mob');
    const brSliderDesk = document.getElementById('cfg-border-radius');
    const brSliderMob = document.getElementById('cfg-border-radius-mob');

    const handleBwInput = (val) => {
      const num = parseBorderWidth(val, 1);
      if (bwSliderDesk) bwSliderDesk.value = num;
      if (bwSliderMob) bwSliderMob.value = num;
      updateBorderWidthPresetButtons(num);
      markCardDesignAsCustom();
    };

    if (bwSliderDesk) {
      bwSliderDesk.addEventListener('input', (e) => handleBwInput(e.target.value));
    }
    if (bwSliderMob) {
      bwSliderMob.addEventListener('input', (e) => handleBwInput(e.target.value));
    }

    const handleBrInput = (val) => {
      const num = parseBorderRadius(val, 16);
      if (brSliderDesk) brSliderDesk.value = num;
      if (brSliderMob) brSliderMob.value = num;
      updateBorderRadiusPresetButtons(num);
      markCardDesignAsCustom();
    };

    if (brSliderDesk) {
      brSliderDesk.addEventListener('input', (e) => handleBrInput(e.target.value));
    }
    if (brSliderMob) {
      brSliderMob.addEventListener('input', (e) => handleBrInput(e.target.value));
    }

    document.querySelectorAll('.btn-border-width-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleBwInput(btn.dataset.value);
      });
    });

    document.querySelectorAll('.btn-border-radius-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleBrInput(btn.dataset.value);
      });
    });`
);

fs.writeFileSync('js/product-form.js', content, 'utf8');
console.log('ALL product-form.js updates successfully written!');

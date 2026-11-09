const fs = require('fs');

let content = fs.readFileSync('js/product-form.js', 'utf8');

// 1. Update updateProductCardLivePreview
const prevTarget1 = `    // Kotak Simulasi Diskon & Panel Desain Kartu
    const simDiscountDesk = document.getElementById('cfg-simulate-countdown-preview')?.closest('label');
    const simDiscountMob = document.getElementById('cfg-simulate-countdown-preview-mob')?.closest('label');
    const customSectionDesk = document.getElementById('card-customization-section');
    const customSectionMob = document.getElementById('card-customization-section-mob');

    // Jika card_variant masih kosong (belum dipilih oleh seller):
    if (!variant) {
      if (simDiscountDesk) simDiscountDesk.classList.add('hidden');
      if (simDiscountMob) simDiscountMob.classList.add('hidden');
      if (customSectionDesk) customSectionDesk.classList.add('hidden');
      if (customSectionMob) customSectionMob.classList.add('hidden');

      const placeholderHtml = \`
        <div class="p-8 rounded-lg border border-slate-200 bg-slate-50/70 text-center space-y-2 my-4">
          <div class="w-10 h-10 rounded-full bg-slate-200/70 text-slate-500 flex items-center justify-center mx-auto">
            <i class="bi bi-layout-wtf text-base"></i>
          </div>
          <p class="text-xs font-bold text-slate-700">Jenis Kartu Belum Ditentukan</p>
          <p class="text-[11px] text-slate-500 leading-relaxed">Pilih salah satu model kartu produk pada formulir di samping untuk menampilkan pratinjau kartu etalase.</p>
        </div>
      \`;
      if (previewContainer) previewContainer.innerHTML = placeholderHtml;
      if (mobilePreviewContainer) mobilePreviewContainer.innerHTML = placeholderHtml;
      return;
    }

    if (simDiscountDesk) simDiscountDesk.classList.remove('hidden');
    if (simDiscountMob) simDiscountMob.classList.remove('hidden');
    if (customSectionDesk) customSectionDesk.classList.remove('hidden');
    if (customSectionMob) customSectionMob.classList.remove('hidden');`;

const newPrevCode1 = `    // Kotak Simulasi Diskon & Panel Desain Kartu
    const simDiscountDesk = document.getElementById('cfg-simulate-countdown-preview')?.closest('label');
    const simDiscountMob = document.getElementById('cfg-simulate-countdown-preview-mob')?.closest('label');
    const customSectionDesk = document.getElementById('card-customization-section');
    const customSectionMob = document.getElementById('card-customization-section-mob');

    // Jika card_variant masih kosong (belum dipilih oleh seller):
    if (!variant) {
      if (simDiscountDesk) simDiscountDesk.classList.add('hidden');
      if (simDiscountMob) simDiscountMob.classList.add('hidden');
      if (customSectionDesk) customSectionDesk.classList.add('hidden');
      if (customSectionMob) customSectionMob.classList.add('hidden');
      if (outerWrapDesk) outerWrapDesk.classList.add('hidden');
      if (outerWrapMob) outerWrapMob.classList.add('hidden');

      const placeholderHtml = \`
        <div class="p-8 rounded-lg border border-slate-200 bg-slate-50/70 text-center space-y-2 my-4">
          <div class="w-10 h-10 rounded-full bg-slate-200/70 text-slate-500 flex items-center justify-center mx-auto">
            <i class="bi bi-layout-wtf text-base"></i>
          </div>
          <p class="text-xs font-bold text-slate-700">Jenis Kartu Belum Ditentukan</p>
          <p class="text-[11px] text-slate-500 leading-relaxed">Pilih salah satu model kartu produk pada formulir di samping untuk menampilkan pratinjau kartu etalase.</p>
        </div>
      \`;
      if (previewContainer) previewContainer.innerHTML = placeholderHtml;
      if (mobilePreviewContainer) mobilePreviewContainer.innerHTML = placeholderHtml;
      return;
    }

    if (currentStep === 1) {
      if (previewStep1Tab === 'design') {
        if (outerWrapDesk) outerWrapDesk.classList.add('hidden');
        if (outerWrapMob) outerWrapMob.classList.add('hidden');
        if (simDiscountDesk) simDiscountDesk.classList.add('hidden');
        if (simDiscountMob) simDiscountMob.classList.add('hidden');
        if (customSectionDesk) customSectionDesk.classList.remove('hidden');
        if (customSectionMob) customSectionMob.classList.remove('hidden');
      } else {
        if (outerWrapDesk) outerWrapDesk.classList.remove('hidden');
        if (outerWrapMob) outerWrapMob.classList.remove('hidden');
        if (simDiscountDesk) simDiscountDesk.classList.remove('hidden');
        if (simDiscountMob) simDiscountMob.classList.remove('hidden');
        if (customSectionDesk) customSectionDesk.classList.add('hidden');
        if (customSectionMob) customSectionMob.classList.add('hidden');
      }
    } else {
      if (outerWrapDesk) outerWrapDesk.classList.add('hidden');
      if (outerWrapMob) outerWrapMob.classList.add('hidden');
      if (simDiscountDesk) simDiscountDesk.classList.add('hidden');
      if (simDiscountMob) simDiscountMob.classList.add('hidden');
      if (customSectionDesk) customSectionDesk.classList.add('hidden');
      if (customSectionMob) customSectionMob.classList.add('hidden');
    }

    syncCardAccordionDOM();
    syncEyeToggleIcons();`;

if (!content.includes(prevTarget1)) {
  throw new Error('prevTarget1 not found');
}
content = content.replace(prevTarget1, newPrevCode1);

// 2. Remove redundant toggle block at lines 8562
const prevTarget2 = `    // Toggle Customization Section (Hanya tampil saat di Step 1 pada tab Desain Kartu)
    const cardCustomizationSection = document.getElementById('card-customization-section');
    const cardCustomizationSectionMob = document.getElementById('card-customization-section-mob');
    const showDesignSection = Boolean(currentStep === 1 && previewStep1Tab === 'design' && variant);
    if (cardCustomizationSection) {
      if (showDesignSection) cardCustomizationSection.classList.remove('hidden');
      else cardCustomizationSection.classList.add('hidden');
    }
    if (cardCustomizationSectionMob) {
      if (showDesignSection) cardCustomizationSectionMob.classList.remove('hidden');
      else cardCustomizationSectionMob.classList.add('hidden');
    }`;

if (!content.includes(prevTarget2)) {
  throw new Error('prevTarget2 not found');
}
content = content.replace(prevTarget2, '    // Customization Section visibility managed centrally at top of updateProductCardLivePreview');

// 3. Countdown style fallback support for mobile
const prevTarget3 = `    // Countdown Badge Custom Styles
    const countdownRadius = document.getElementById('cfg-countdown-radius')?.value || primaryState.countdown_radius || '9999px';
    const countdownBgColor = document.getElementById('cfg-countdown-bg-color')?.value || primaryState.countdown_bg_color || defCardThemeColor;
    const countdownTextColor = document.getElementById('cfg-countdown-text-color')?.value || primaryState.countdown_text_color || '#ffffff';
    const countdownIconColor = document.getElementById('cfg-countdown-icon-color')?.value || primaryState.countdown_icon_color || '#ffffff';
    const countdownBorderColor = document.getElementById('cfg-countdown-border-color')?.value || primaryState.countdown_border_color || defCardThemeColor;`;

const newPrevCode3 = `    // Countdown Badge Custom Styles
    const countdownRadius = document.getElementById('cfg-countdown-radius')?.value || document.getElementById('cfg-countdown-radius-mob')?.value || primaryState.countdown_radius || '9999px';
    const countdownBgColor = document.getElementById('cfg-countdown-bg-color')?.value || document.getElementById('cfg-countdown-bg-color-mob')?.value || primaryState.countdown_bg_color || defCardThemeColor;
    const countdownTextColor = document.getElementById('cfg-countdown-text-color')?.value || document.getElementById('cfg-countdown-text-color-mob')?.value || primaryState.countdown_text_color || '#ffffff';
    const countdownIconColor = document.getElementById('cfg-countdown-icon-color')?.value || document.getElementById('cfg-countdown-icon-color-mob')?.value || primaryState.countdown_icon_color || '#ffffff';
    const countdownBorderColor = document.getElementById('cfg-countdown-border-color')?.value || document.getElementById('cfg-countdown-border-color-mob')?.value || primaryState.countdown_border_color || defCardThemeColor;`;

if (!content.includes(prevTarget3)) {
  throw new Error('prevTarget3 not found');
}
content = content.replace(prevTarget3, newPrevCode3);

// 4. Update listeners in bindFormEvents
// Old tabs block replacement:
const listenersTarget = `    // Card Customization Design Panel: [Default] dan [Ubah Kartu] (Desktop & Mobile Sync)
    const tabDefDesk = document.getElementById('tab-card-design-default');
    const tabCustDesk = document.getElementById('tab-card-design-custom');
    const panelCustDesk = document.getElementById('panel-card-custom-content');
    const tabDefMob = document.getElementById('tab-card-design-default-mob');
    const tabCustMob = document.getElementById('tab-card-design-custom-mob');
    const panelCustMob = document.getElementById('panel-card-custom-content-mob');
    const btnSaveCardDesk = document.getElementById('btn-save-card-design');
    const btnSaveCardMob = document.getElementById('btn-save-card-design-mob');

    if (tabDefDesk) tabDefDesk.addEventListener('click', () => setCardCustomizationView(false));
    if (tabCustDesk) tabCustDesk.addEventListener('click', () => setCardCustomizationView(true));
    if (tabDefMob) tabDefMob.addEventListener('click', () => setCardCustomizationView(false));
    if (tabCustMob) tabCustMob.addEventListener('click', () => setCardCustomizationView(true));`;

const newListenersCode = `    // Card Accordion Trigger click listeners (Desktop & Mobile)
    document.querySelectorAll('.card-accordion-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const group = btn.getAttribute('data-group');
        if (group) {
          toggleCardAccordion(group);
        }
      });
    });

    // Gunakan Desain Bawaan Buttons (Desktop & Mobile)
    const btnApplyDefDesk = document.getElementById('btn-apply-default-card-design');
    const btnApplyDefMob = document.getElementById('btn-apply-default-card-design-mob');
    if (btnApplyDefDesk) btnApplyDefDesk.addEventListener('click', handleApplyDefaultCardDesign);
    if (btnApplyDefMob) btnApplyDefMob.addEventListener('click', handleApplyDefaultCardDesign);

    // Countdown Inputs (Desktop & Mobile Sync)
    const cdEnable = document.getElementById('cfg-enable-countdown');
    const cdEnableMob = document.getElementById('cfg-enable-countdown-mob');
    if (cdEnable) {
      cdEnable.addEventListener('change', (e) => {
        if (cdEnableMob) cdEnableMob.checked = e.target.checked;
        markCardDesignAsCustom();
      });
    }
    if (cdEnableMob) {
      cdEnableMob.addEventListener('change', (e) => {
        if (cdEnable) cdEnable.checked = e.target.checked;
        markCardDesignAsCustom();
      });
    }

    const cdTokens = ['bg', 'text', 'icon', 'border'].flatMap(prefix => [\`cfg-countdown-\${prefix}-color\`, \`cfg-countdown-\${prefix}-hex\`]);
    cdTokens.push('cfg-countdown-radius');

    cdTokens.forEach(id => {
      const el = document.getElementById(id);
      const elMob = document.getElementById(\`\${id}-mob\`);

      if (el) {
        el.addEventListener('input', (e) => {
          if (id.endsWith('-color')) {
            const hexId = id.replace('-color', '-hex');
            const hexEl = document.getElementById(hexId);
            if (hexEl) hexEl.value = e.target.value;
            const mobColor = document.getElementById(\`\${id}-mob\`);
            if (mobColor) mobColor.value = e.target.value;
            const mobHex = document.getElementById(\`\${hexId}-mob\`);
            if (mobHex) mobHex.value = e.target.value;
          } else if (id.endsWith('-hex')) {
            const colorId = id.replace('-hex', '-color');
            const colorEl = document.getElementById(colorId);
            if (colorEl) colorEl.value = e.target.value;
            const mobHex = document.getElementById(\`\${id}-mob\`);
            if (mobHex) mobHex.value = e.target.value;
            const mobColor = document.getElementById(\`\${colorId}-mob\`);
            if (mobColor) mobColor.value = e.target.value;
          } else if (id === 'cfg-countdown-radius') {
            const mobRadius = document.getElementById('cfg-countdown-radius-mob');
            if (mobRadius) mobRadius.value = e.target.value;
          }
          markCardDesignAsCustom();
        });
      }

      if (elMob) {
        elMob.addEventListener('input', (e) => {
          if (id.endsWith('-color')) {
            const hexId = id.replace('-color', '-hex');
            const mobHex = document.getElementById(\`\${hexId}-mob\`);
            if (mobHex) mobHex.value = e.target.value;
            const deskColor = document.getElementById(id);
            if (deskColor) deskColor.value = e.target.value;
            const deskHex = document.getElementById(hexId);
            if (deskHex) deskHex.value = e.target.value;
          } else if (id.endsWith('-hex')) {
            const colorId = id.replace('-hex', '-color');
            const mobColor = document.getElementById(\`\${colorId}-mob\`);
            if (mobColor) mobColor.value = e.target.value;
            const deskHex = document.getElementById(id);
            if (deskHex) deskHex.value = e.target.value;
            const deskColor = document.getElementById(colorId);
            if (deskColor) deskColor.value = e.target.value;
          } else if (id === 'cfg-countdown-radius') {
            const deskRadius = document.getElementById('cfg-countdown-radius');
            if (deskRadius) deskRadius.value = e.target.value;
          }
          markCardDesignAsCustom();
        });
      }
    });

    const btnSaveCardDesk = document.getElementById('btn-save-card-design');
    const btnSaveCardMob = document.getElementById('btn-save-card-design-mob');`;

if (!content.includes(listenersTarget)) {
  throw new Error('listenersTarget not found');
}
content = content.replace(listenersTarget, newListenersCode);

// 5. Replace `saveCardConfigInputs(); updateProductCardLivePreview();` with `markCardDesignAsCustom();` in card config & feature toggle listeners
const oldCfgSave1 = `          saveCardConfigInputs();
          updateProductCardLivePreview();
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
          saveCardConfigInputs();
          updateProductCardLivePreview();`;

const newCfgSave1 = `          markCardDesignAsCustom();
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
          markCardDesignAsCustom();`;

if (!content.includes(oldCfgSave1)) {
  throw new Error('oldCfgSave1 not found');
}
content = content.replace(oldCfgSave1, newCfgSave1);

// Replace for feature toggles
const oldFeatSave = `          if (feat === 'show-badge') {
            const bA = document.getElementById('cfg-show-badge-blok-a');
            if (bA) bA.checked = e.target.checked;
          }
          saveCardConfigInputs();
          updateProductCardLivePreview();
        });
      }

      if (elMob) {
        elMob.addEventListener('change', (e) => {
          if (el) el.checked = e.target.checked;
          if (primaryState.card_variant === 'B') {
            if (feat === 'show-rating' && e.target.checked) {
              const salesEl = document.getElementById('cfg-show-sales');
              const salesElMob = document.getElementById('cfg-show-sales-mob');
              if (salesEl) salesEl.checked = false;
              if (salesElMob) salesElMob.checked = false;
            } else if (feat === 'show-sales' && e.target.checked) {
              const ratingEl = document.getElementById('cfg-show-rating');
              const ratingElMob = document.getElementById('cfg-show-rating-mob');
              if (ratingEl) ratingEl.checked = false;
              if (ratingElMob) ratingElMob.checked = false;
            }
          }
          if (feat === 'show-badge') {
            const bA = document.getElementById('cfg-show-badge-blok-a');
            if (bA) bA.checked = e.target.checked;
          }
          saveCardConfigInputs();
          updateProductCardLivePreview();`;

const newFeatSave = `          if (feat === 'show-badge') {
            const bA = document.getElementById('cfg-show-badge-blok-a');
            if (bA) bA.checked = e.target.checked;
          }
          markCardDesignAsCustom();
        });
      }

      if (elMob) {
        elMob.addEventListener('change', (e) => {
          if (el) el.checked = e.target.checked;
          if (primaryState.card_variant === 'B') {
            if (feat === 'show-rating' && e.target.checked) {
              const salesEl = document.getElementById('cfg-show-sales');
              const salesElMob = document.getElementById('cfg-show-sales-mob');
              if (salesEl) salesEl.checked = false;
              if (salesElMob) salesElMob.checked = false;
            } else if (feat === 'show-sales' && e.target.checked) {
              const ratingEl = document.getElementById('cfg-show-rating');
              const ratingElMob = document.getElementById('cfg-show-rating-mob');
              if (ratingEl) ratingEl.checked = false;
              if (ratingElMob) ratingElMob.checked = false;
            }
          }
          if (feat === 'show-badge') {
            const bA = document.getElementById('cfg-show-badge-blok-a');
            if (bA) bA.checked = e.target.checked;
          }
          markCardDesignAsCustom();`;

if (!content.includes(oldFeatSave)) {
  throw new Error('oldFeatSave not found');
}
content = content.replace(oldFeatSave, newFeatSave);

// Also for badgeBlokA
const oldBadgeA = `    const badgeBlokA = document.getElementById('cfg-show-badge-blok-a');
    if (badgeBlokA) {
      badgeBlokA.addEventListener('change', e => {
        const bMain = document.getElementById('cfg-show-badge');
        const bMob = document.getElementById('cfg-show-badge-mob');
        if (bMain) bMain.checked = e.target.checked;
        if (bMob) bMob.checked = e.target.checked;
        saveCardConfigInputs();
        updateProductCardLivePreview();
      });
    }`;

const newBadgeA = `    const badgeBlokA = document.getElementById('cfg-show-badge-blok-a');
    if (badgeBlokA) {
      badgeBlokA.addEventListener('change', e => {
        const bMain = document.getElementById('cfg-show-badge');
        const bMob = document.getElementById('cfg-show-badge-mob');
        if (bMain) bMain.checked = e.target.checked;
        if (bMob) bMob.checked = e.target.checked;
        markCardDesignAsCustom();
      });
    }`;

if (!content.includes(oldBadgeA)) {
  throw new Error('oldBadgeA not found');
}
content = content.replace(oldBadgeA, newBadgeA);

fs.writeFileSync('js/product-form.js', content, 'utf8');
console.log('Listeners and preview updates applied successfully!');


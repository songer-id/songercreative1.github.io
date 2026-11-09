const fs = require('fs');

let pf = fs.readFileSync('js/product-form.js', 'utf8');
const isCrlf = pf.includes('\r\n');
const eol = isCrlf ? '\r\n' : '\n';

const targetAnchor = `    if (valLabelDesk) valLabelDesk.textContent = \`\${num} px\`;
    if (valLabelMob) valLabelMob.textContent = \`\${num} px\`;
  }

  function getCardConfigFromDOM() {`;

const newHelpers = `    if (valLabelDesk) valLabelDesk.textContent = \`\${num} px\`;
    if (valLabelMob) valLabelMob.textContent = \`\${num} px\`;
  }

  function parseDiscountBadgeRadius(val, defaultVal = 8) {
    if (val === undefined || val === null || val === '') return defaultVal;
    const num = parseInt(val, 10);
    if (isNaN(num)) return defaultVal;
    return Math.max(0, Math.min(12, num));
  }

  function updateDiscountBadgeRadiusPresetButtons(val) {
    const num = parseDiscountBadgeRadius(val, 8);
    document.querySelectorAll('.btn-disc-radius-preset').forEach(btn => {
      const btnVal = parseInt(btn.dataset.value, 10);
      if (btnVal === num) {
        btn.className = 'btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer';
      } else {
        btn.className = 'btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer';
      }
    });
    const valLabelDesk = document.getElementById('cfg-discount-badge-radius-val');
    const valLabelMob = document.getElementById('cfg-discount-badge-radius-val-mob');
    if (valLabelDesk) valLabelDesk.textContent = \`\${num} px\`;
    if (valLabelMob) valLabelMob.textContent = \`\${num} px\`;
  }

  function setDiscountBadgePosition(pos) {
    const valid = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    const safePos = valid.includes(pos) ? pos : 'top-right';
    const inpDesk = document.getElementById('cfg-discount-badge-position');
    const inpMob = document.getElementById('cfg-discount-badge-position-mob');
    if (inpDesk) inpDesk.value = safePos;
    if (inpMob) inpMob.value = safePos;

    ['', '-mob'].forEach(suffix => {
      const group = document.getElementById(\`cfg-discount-badge-position-group\${suffix}\`);
      if (group) {
        group.querySelectorAll('.btn-disc-pos').forEach(btn => {
          const bPos = btn.dataset.pos;
          if (bPos === safePos) {
            btn.className = 'btn-disc-pos py-1 px-1.5 text-[10.5px] font-normal rounded-md bg-white text-slate-800 shadow-2xs transition cursor-pointer text-center';
          } else {
            btn.className = 'btn-disc-pos py-1 px-1.5 text-[10.5px] font-normal rounded-md text-slate-500 hover:text-slate-800 transition cursor-pointer text-center';
          }
        });
      }
    });
  }

  function getDiscountBadgePositionClass(pos) {
    if (pos === 'top-left') return 'top-2 left-2';
    if (pos === 'bottom-left') return 'bottom-2 left-2';
    if (pos === 'bottom-right') return 'bottom-2 right-2';
    return 'top-2 right-2'; // default top-right
  }

  function parseCountdownRadius(val, defaultVal = 6) {
    if (val === undefined || val === null || val === '') return defaultVal;
    if (typeof val === 'string' && val.includes('9999')) return 12; // sanitize legacy pill
    const num = parseInt(val, 10);
    if (isNaN(num)) return defaultVal;
    return Math.max(0, Math.min(12, num));
  }

  function updateCountdownRadiusPresetButtons(val) {
    const num = parseCountdownRadius(val, 6);
    document.querySelectorAll('.btn-countdown-radius-preset').forEach(btn => {
      const btnVal = parseInt(btn.dataset.value, 10);
      if (btnVal === num) {
        btn.className = 'btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer';
      } else {
        btn.className = 'btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer';
      }
    });
    const valLabelDesk = document.getElementById('cfg-countdown-radius-val');
    const valLabelMob = document.getElementById('cfg-countdown-radius-val-mob');
    if (valLabelDesk) valLabelDesk.textContent = \`\${num} px\`;
    if (valLabelMob) valLabelMob.textContent = \`\${num} px\`;
  }

  function syncFeatureSubpanels() {
    // 1. Strike price subpanel
    const showStrike = Boolean(document.getElementById('cfg-show-strike')?.checked || document.getElementById('cfg-show-strike-mob')?.checked);
    const strikeDesk = document.getElementById('cfg-strike-panel-desk');
    const strikeMob = document.getElementById('cfg-strike-panel-mob');
    if (strikeDesk) {
      if (showStrike) strikeDesk.classList.remove('hidden');
      else strikeDesk.classList.add('hidden');
    }
    if (strikeMob) {
      if (showStrike) strikeMob.classList.remove('hidden');
      else strikeMob.classList.add('hidden');
    }

    // 2. Discount badge subpanel
    const showDisc = Boolean(document.getElementById('cfg-show-discount-badge')?.checked || document.getElementById('cfg-show-discount-badge-mob')?.checked);
    const discDesk = document.getElementById('cfg-discount-badge-panel-desk');
    const discMob = document.getElementById('cfg-discount-badge-panel-mob');
    if (discDesk) {
      if (showDisc) discDesk.classList.remove('hidden');
      else discDesk.classList.add('hidden');
    }
    if (discMob) {
      if (showDisc) discMob.classList.remove('hidden');
      else discMob.classList.add('hidden');
    }

    // 3. Countdown subpanel
    const showCd = Boolean(document.getElementById('cfg-enable-countdown')?.checked || document.getElementById('cfg-enable-countdown-mob')?.checked);
    const cdDesk = document.getElementById('cfg-countdown-panel-desk');
    const cdMob = document.getElementById('cfg-countdown-panel-mob');
    if (cdDesk) {
      if (showCd) cdDesk.classList.remove('hidden');
      else cdDesk.classList.add('hidden');
    }
    if (cdMob) {
      if (showCd) cdMob.classList.remove('hidden');
      else cdMob.classList.add('hidden');
    }

    // 4. Special badge subpanel
    const showBadge = Boolean(document.getElementById('cfg-show-badge')?.checked || document.getElementById('cfg-show-badge-mob')?.checked);
    const badgeDesk = document.getElementById('cfg-badge-panel-desk');
    const badgeMob = document.getElementById('cfg-badge-panel-mob');
    if (badgeDesk) {
      if (showBadge) badgeDesk.classList.remove('hidden');
      else badgeDesk.classList.add('hidden');
    }
    if (badgeMob) {
      if (showBadge) badgeMob.classList.remove('hidden');
      else badgeMob.classList.add('hidden');
    }
  }

  function getCardConfigFromDOM() {`;

const normTargetAnchor = targetAnchor.replace(/\r\n/g, '\n').replace(/\n/g, eol);
const normNewHelpers = newHelpers.replace(/\r\n/g, '\n').replace(/\n/g, eol);

if (!pf.includes(normTargetAnchor)) {
  console.error('Target anchor not found!');
  process.exit(1);
}

pf = pf.replace(normTargetAnchor, normNewHelpers);

// Update return object of ProductForm
const returnAnchor = `    syncEyeToggleIcons,
    handleApplyDefaultCardDesign,`;

const newReturn = `    syncEyeToggleIcons,
    syncFeatureSubpanels,
    parseDiscountBadgeRadius,
    updateDiscountBadgeRadiusPresetButtons,
    setDiscountBadgePosition,
    getDiscountBadgePositionClass,
    parseCountdownRadius,
    updateCountdownRadiusPresetButtons,
    handleApplyDefaultCardDesign,`;

const normReturnAnchor = returnAnchor.replace(/\r\n/g, '\n').replace(/\n/g, eol);
const normNewReturn = newReturn.replace(/\r\n/g, '\n').replace(/\n/g, eol);

if (!pf.includes(normReturnAnchor)) {
  console.error('Return anchor not found!');
  process.exit(1);
}

pf = pf.replace(normReturnAnchor, normNewReturn);

// Update window assignments
const winAnchor = `window.syncEyeToggleIcons = ProductForm.syncEyeToggleIcons;`;
const newWin = `window.syncEyeToggleIcons = ProductForm.syncEyeToggleIcons;
window.syncFeatureSubpanels = ProductForm.syncFeatureSubpanels;
window.parseDiscountBadgeRadius = ProductForm.parseDiscountBadgeRadius;
window.updateDiscountBadgeRadiusPresetButtons = ProductForm.updateDiscountBadgeRadiusPresetButtons;
window.setDiscountBadgePosition = ProductForm.setDiscountBadgePosition;
window.getDiscountBadgePositionClass = ProductForm.getDiscountBadgePositionClass;
window.parseCountdownRadius = ProductForm.parseCountdownRadius;
window.updateCountdownRadiusPresetButtons = ProductForm.updateCountdownRadiusPresetButtons;`;

const normWinAnchor = winAnchor.replace(/\r\n/g, '\n').replace(/\n/g, eol);
const normNewWin = newWin.replace(/\r\n/g, '\n').replace(/\n/g, eol);

if (!pf.includes(normWinAnchor)) {
  console.error('Win anchor not found!');
  process.exit(1);
}

pf = pf.replace(normWinAnchor, normNewWin);

fs.writeFileSync('js/product-form.js', pf, 'utf8');
console.log('Helpers inserted successfully into js/product-form.js!');


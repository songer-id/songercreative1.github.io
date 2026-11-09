const fs = require('fs');

// 1. Update js/product-form.js
let pfCode = fs.readFileSync('js/product-form.js', 'utf8');
pfCode = pfCode.replace(/\r\n/g, '\n');

const startIdx = pfCode.indexOf('id="card-customization-section-mob"');
const endIdx = pfCode.indexOf('<!-- Pinned Footer Section Mobile', startIdx);
if (startIdx === -1 || endIdx === -1) {
  throw new Error('Mobile customization section boundaries not found');
}

let mobSection = pfCode.substring(startIdx, endIdx);

// Ganti label input tools di mobile section
// Pola 1: class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5"
mobSection = mobSection.replaceAll(
  'class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5"',
  'class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500 mb-0.5"'
);

// Pola 2: class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider"
mobSection = mobSection.replaceAll(
  'class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider"',
  'class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500"'
);

// Pola 3: class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5"
mobSection = mobSection.replaceAll(
  'class="block text-[9px] font-normal text-slate-500 uppercase tracking-wider mb-0.5"',
  'class="block card-tool-label text-[11px] leading-4 font-normal text-slate-500 mb-0.5"'
);

// Pastikan tidak ada uppercase tracking-wider yang tersisa pada label di mobSection
const remainingUppercaseLabels = mobSection.match(/<label[^>]*uppercase[^>]*>/gi);
if (remainingUppercaseLabels) {
  console.log('WARNING: remaining uppercase labels:', remainingUppercaseLabels);
} else {
  console.log('All 28 tool labels in mobile section updated cleanly!');
}

pfCode = pfCode.substring(0, startIdx) + mobSection + pfCode.substring(endIdx);

// Juga rapikan Simulasi Diskon mobile checkbox label agar font-normal (konsisten dengan desktop)
const simDiscMobTarget = `<label class="w-full max-w-[260px] flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none py-1 transition-colors">`;
const simDiscMobRepl = `<label class="w-full max-w-[260px] flex items-center gap-2 text-xs font-normal text-slate-700 cursor-pointer select-none py-1 transition-colors">`;
if (pfCode.includes(simDiscMobTarget)) {
  pfCode = pfCode.replace(simDiscMobTarget, simDiscMobRepl);
  console.log('Simulasi Diskon mobile label updated to font-normal');
}

fs.writeFileSync('js/product-form.js', pfCode, 'utf8');

// 2. Update css/admin.css
let cssCode = fs.readFileSync('css/admin.css', 'utf8');
cssCode = cssCode.replace(/\r\n/g, '\n');

const cssRule = `
/* Scoped Mobile Input Tools Typography for Card Customization Section (Task SC-ADMIN-CARD-MOBILE-TYPOGRAPHY-09C-R7) */
@media (max-width: 639.98px) {
  #card-customization-section-mob .card-tool-label {
    font-size: 11px !important;
    line-height: 16px !important;
    font-weight: 400 !important;
    letter-spacing: normal !important;
    text-transform: none !important;
  }
}
`;

if (!cssCode.includes('Task SC-ADMIN-CARD-MOBILE-TYPOGRAPHY-09C-R7')) {
  cssCode = cssCode.trimEnd() + '\n' + cssRule;
  fs.writeFileSync('css/admin.css', cssCode, 'utf8');
  console.log('Successfully added scoped typography rule to css/admin.css');
} else {
  console.log('CSS rule already present in css/admin.css');
}


const fs = require('fs');

// 1. Transform css/admin.css
let css = fs.readFileSync('css/admin.css', 'utf8');

const oldCssRule1 = `  /* Label Field Input */
  #view-product-form label:not(.cursor-pointer):not(.relative):not(.sr-only),
  .step2-section-card label:not(.cursor-pointer):not(.relative):not(.sr-only),
  .step1-section-card label:not(.cursor-pointer):not(.relative):not(.sr-only),
  #view-product-form .input-field-label {
    font-size: 0.75rem !important;
    /* 12px */
    font-weight: 600 !important;
    color: #334155 !important;
    /* slate-700 */
    line-height: 1.35 !important;
  }`;

const newCssRule1 = `  /* Label Field Input */
  #view-product-form label:not(.cursor-pointer):not(.relative):not(.sr-only):not(.card-tool-label):not(.card-custom-label),
  .step2-section-card label:not(.cursor-pointer):not(.relative):not(.sr-only),
  .step1-section-card label:not(.cursor-pointer):not(.relative):not(.sr-only):not(.card-tool-label):not(.card-custom-label),
  #view-product-form .input-field-label:not(.card-tool-label):not(.card-custom-label) {
    font-size: 0.75rem !important;
    /* 12px */
    font-weight: 600 !important;
    color: #334155 !important;
    /* slate-700 */
    line-height: 1.35 !important;
  }`;

if (!css.includes(oldCssRule1)) {
  console.error('ERROR: oldCssRule1 not found!');
  process.exit(1);
}
css = css.replace(oldCssRule1, newCssRule1);

const oldCssRule2 = `/* Scoped Typography for Card Customization Section (Task SC-ADMIN-CARD-EDITOR-GROUPING-09A) */
#card-customization-section,
#card-customization-section button,
#card-customization-section label,
#card-customization-section input,
#card-customization-section select,
#card-customization-section span,
#card-customization-section p,
#card-customization-section .card-accordion-trigger,
#card-customization-section-mob,
#card-customization-section-mob button,
#card-customization-section-mob label,
#card-customization-section-mob input,
#card-customization-section-mob select,
#card-customization-section-mob span,
#card-customization-section-mob p,
#card-customization-section-mob .card-accordion-trigger {
  font-weight: 400 !important;
}

/* Scoped Mobile Input Tools Typography for Card Customization Section (Task SC-ADMIN-CARD-MOBILE-TYPOGRAPHY-09C-R7) */
@media (max-width: 639.98px) {
  #card-customization-section-mob .card-tool-label {
    font-size: 11px !important;
    line-height: 16px !important;
    font-weight: 400 !important;
    letter-spacing: normal !important;
    text-transform: none !important;
  }
}`;

const newCssRule2 = `/* Scoped Typography for Card Customization Section (Task SC-ADMIN-CARD-TOOLS-UI-12A) */
#view-product-form #card-customization-section,
#view-product-form #card-customization-section *,
#view-product-form #card-customization-section label,
#view-product-form #card-customization-section button,
#view-product-form #card-customization-section input,
#view-product-form #card-customization-section select,
#view-product-form #card-customization-section span,
#view-product-form #card-customization-section p,
#view-product-form #card-customization-section div,
#view-product-form #card-customization-section .card-accordion-trigger,
#view-product-form #card-customization-section .card-tool-label,
#card-customization-section,
#card-customization-section *,
#card-customization-section button,
#card-customization-section label,
#card-customization-section input,
#card-customization-section select,
#card-customization-section span,
#card-customization-section p,
#card-customization-section div,
#card-customization-section .card-accordion-trigger,
#card-customization-section .card-tool-label,
#view-product-form #card-customization-section-mob,
#view-product-form #card-customization-section-mob *,
#view-product-form #card-customization-section-mob label,
#view-product-form #card-customization-section-mob button,
#view-product-form #card-customization-section-mob input,
#view-product-form #card-customization-section-mob select,
#view-product-form #card-customization-section-mob span,
#view-product-form #card-customization-section-mob p,
#view-product-form #card-customization-section-mob div,
#view-product-form #card-customization-section-mob .card-accordion-trigger,
#view-product-form #card-customization-section-mob .card-tool-label,
#card-customization-section-mob,
#card-customization-section-mob *,
#card-customization-section-mob button,
#card-customization-section-mob label,
#card-customization-section-mob input,
#card-customization-section-mob select,
#card-customization-section-mob span,
#card-customization-section-mob p,
#card-customization-section-mob div,
#card-customization-section-mob .card-accordion-trigger,
#card-customization-section-mob .card-tool-label {
  font-weight: 400 !important;
}

/* Scoped Mobile Input Tools Typography for Card Customization Section (Task SC-ADMIN-CARD-TOOLS-UI-12A) */
@media (max-width: 639.98px) {
  #view-product-form #card-customization-section-mob .card-tool-label,
  #card-customization-section-mob .card-tool-label {
    font-size: 11px !important;
    line-height: 16px !important;
    font-weight: 400 !important;
    letter-spacing: normal !important;
    text-transform: none !important;
  }
}`;

if (!css.includes(oldCssRule2)) {
  console.error('ERROR: oldCssRule2 not found!');
  process.exit(1);
}
css = css.replace(oldCssRule2, newCssRule2);

fs.writeFileSync('css/admin.css', css);
console.log('Successfully updated css/admin.css!');


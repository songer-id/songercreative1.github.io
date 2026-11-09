const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');

const target1 = `  /* Label Field Input */
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

console.log('Target 1 exists in admin.css:', css.includes(target1));

const target2 = `/* Scoped Typography for Card Customization Section (Task SC-ADMIN-CARD-EDITOR-GROUPING-09A) */
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

console.log('Target 2 exists in admin.css:', css.includes(target2));


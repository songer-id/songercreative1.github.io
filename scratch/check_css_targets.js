const fs = require('fs');
let css = fs.readFileSync('css/admin.css', 'utf8');

console.log('Line endings:', css.includes('\r\n') ? 'CRLF' : 'LF');

// 1. Replace media 641px and 1024px top-bar padding
const target1 = `  #product-form-top-bar {
    padding: 1.25rem 1.5rem 0.75rem 1.5rem !important;
  }`;
const replace1 = `  #step-pane-1 {
    padding-top: 1.25rem !important;
  }`;

const target2 = `  #product-form-top-bar {
    padding: 1.5rem 1.5rem 0.75rem 1.5rem !important;
  }`;
const replace2 = `  #step-pane-1 {
    padding-top: 1.25rem !important;
  }`;

// 2. Replace mobile top-bar padding
const target3 = `  #product-form-top-bar {
    padding: 0.75rem 0.375rem 0.5rem 0.375rem !important;
    /* px-1.5 */
    width: 100% !important;
  }

  #step-pane-1,
  #step2-cards-container {
    padding-left: 0.375rem !important;
    /* px-1.5 tipis */
    padding-right: 0.375rem !important;
    /* px-1.5 tipis */
    padding-top: 0 !important;
    padding-bottom: 2rem !important;`;

const replace3 = `  #step-pane-1 {
    padding-top: 0.75rem !important;
  }

  #step-pane-1,
  #step2-cards-container {
    padding-left: 0.375rem !important;
    /* px-1.5 tipis */
    padding-right: 0.375rem !important;
    /* px-1.5 tipis */
    padding-bottom: 2rem !important;`;

// 3. Remove #btn-back-to-list:hover
const target4 = `,
#btn-back-to-list:hover,
#view-product-form #btn-back-to-list:hover`;

console.log('target1 found:', css.includes(target1) || css.replace(/\r\n/g, '\n').includes(target1));
console.log('target2 found:', css.includes(target2) || css.replace(/\r\n/g, '\n').includes(target2));
console.log('target3 found:', css.includes(target3) || css.replace(/\r\n/g, '\n').includes(target3));
console.log('target4 found:', css.includes(target4) || css.replace(/\r\n/g, '\n').includes(target4));


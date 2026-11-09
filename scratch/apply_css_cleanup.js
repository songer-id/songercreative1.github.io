const fs = require('fs');
let css = fs.readFileSync('css/admin.css', 'utf8');

const isCRLF = css.includes('\r\n');
const nl = isCRLF ? '\r\n' : '\n';

// Normalize for replacement
let norm = css.replace(/\r\n/g, '\n');

// 1. Replace 641px
const t1 = `  #product-form-top-bar {
    padding: 1.25rem 1.5rem 0.75rem 1.5rem !important;
  }`;
const r1 = `  #step-pane-1 {
    padding-top: 1.25rem !important;
  }`;
if (!norm.includes(t1)) throw new Error('t1 not found');
norm = norm.replace(t1, r1);

// 2. Replace 1024px
const t2 = `  #product-form-top-bar {
    padding: 1.5rem 1.5rem 0.75rem 1.5rem !important;
  }`;
const r2 = `  #step-pane-1 {
    padding-top: 1.25rem !important;
  }`;
if (!norm.includes(t2)) throw new Error('t2 not found');
norm = norm.replace(t2, r2);

// 3. Replace mobile
const t3 = `  #product-form-top-bar {
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

const r3 = `  #step-pane-1 {
    padding-top: 0.75rem !important;
  }

  #step-pane-1,
  #step2-cards-container {
    padding-left: 0.375rem !important;
    /* px-1.5 tipis */
    padding-right: 0.375rem !important;
    /* px-1.5 tipis */
    padding-bottom: 2rem !important;`;
if (!norm.includes(t3)) throw new Error('t3 not found');
norm = norm.replace(t3, r3);

// 4. Replace hover
const t4 = `,
#btn-back-to-list:hover,
#view-product-form #btn-back-to-list:hover`;
if (!norm.includes(t4)) throw new Error('t4 not found');
norm = norm.replace(t4, '');

// Restore CRLF
const finalCss = isCRLF ? norm.replace(/\n/g, '\r\n') : norm;
fs.writeFileSync('css/admin.css', finalCss, 'utf8');
console.log('Successfully updated css/admin.css');


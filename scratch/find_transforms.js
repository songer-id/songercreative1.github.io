const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');
const css = fs.readFileSync('css/admin.css', 'utf8');
const formJs = fs.readFileSync('js/product-form.js', 'utf8');

// Let's check all classes on ancestors in product-form.js:
// product-form-wrapper
// form-container
// view-product-form
// admin-main-viewport

console.log('--- Checking CSS for transform/filter/backdrop-filter on ancestors ---');
['view-product-form', 'form-container', 'product-form-wrapper', 'wizard-form-col', 'admin-main-viewport'].forEach(id => {
  const lines = css.split('\n');
  lines.forEach((l, i) => {
    if (l.includes(id) && (l.includes('transform') || l.includes('filter') || l.includes('contain') || l.includes('z-index') || l.includes('overflow'))) {
      console.log(`css:${i + 1}: ${l.trim()}`);
    }
  });
});

console.log('\n--- Checking JS classes on ancestors ---');
const re = /class="([^"]*)"/g;
// check in product-form.js around mobile-preview-backdrop
const s = formJs.indexOf('container.innerHTML = `');
const e = formJs.indexOf('id="mobile-preview-backdrop"');
const formHtml = formJs.slice(s, e);
// find open tags
const tags = formHtml.match(/<[a-z0-9]+[^>]*>/gi);
tags.forEach(t => {
  if (t.includes('transform') || t.includes('filter') || t.includes('relative') || t.includes('z-') || t.includes('transition')) {
    console.log('Tag with potential containing block:', t);
  }
});


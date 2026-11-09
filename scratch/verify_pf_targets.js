const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// Check updateFooterCharCounter target
const counterTarget = `    if (len > 32) {
      counterEl.classList.add('text-red-600', 'font-semibold');
      counterEl.classList.remove('text-slate-400');
      if (inputEl) {
        inputEl.classList.add('border-red-400', 'focus:border-red-500');
        inputEl.classList.remove('border-slate-200');
      }
    } else {
      counterEl.classList.remove('text-red-600', 'font-semibold');
      counterEl.classList.add('text-slate-400');`;
console.log('counterTarget exists:', pf.includes(counterTarget));

// Check Desktop Footer Body
const deskFooterStart = pf.indexOf('id="accordion-body-footer"');
const deskFooterSnippet = pf.slice(deskFooterStart - 25, deskFooterStart + 3500);
console.log('deskFooterSnippet exists:', deskFooterSnippet.length > 100);

// Check Mobile Footer Body
const mobFooterStart = pf.indexOf('id="accordion-body-footer-mob"');
const mobFooterSnippet = pf.slice(mobFooterStart - 25, mobFooterStart + 3500);
console.log('mobFooterSnippet exists:', mobFooterSnippet.length > 100);


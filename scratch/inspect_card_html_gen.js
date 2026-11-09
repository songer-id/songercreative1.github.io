const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const cardHtmlIdx = pf.indexOf('const cardHtml =');
console.log(pf.slice(cardHtmlIdx - 200, cardHtmlIdx + 1200));


const fs = require('fs');

let pf = fs.readFileSync('js/product-form.js', 'utf8');

const regexLoadEdit = /const inheritedFooter = getLastProductFooterConfig\(\);\s*const f1Prod = prod\.custom_footer_1 \? \{ \.\.\.prod\.custom_footer_1 \} : \([\s\S]*?const f2Prod = prod\.custom_footer_2 \? \{ \.\.\.prod\.custom_footer_2 \} : \([\s\S]*?text_color: '#ffffff'\s*\}\)\s*\);/;

console.log('regexLoadEdit matches:', regexLoadEdit.test(pf));


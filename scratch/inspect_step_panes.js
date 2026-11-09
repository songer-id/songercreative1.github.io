const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const pane1Idx = pf.indexOf('id="step-pane-1"');
console.log(pf.slice(pane1Idx - 200, pane1Idx + 300));

const pane2Idx = pf.indexOf('id="step-pane-2"');
console.log(pf.slice(pane2Idx - 200, pane2Idx + 300));


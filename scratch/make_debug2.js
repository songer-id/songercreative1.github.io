const fs = require('fs');

let code = fs.readFileSync('scratch/debug_test.js', 'utf8');

const target = `console.log('cfg-show-strike desktop checked:', mockDoc.getElementById('cfg-show-strike')?.checked);`;
const repl = `
const origUpdate = ProductForm.updateProductCardLivePreview;
console.log('--- BEFORE CALLING updateProductCardLivePreview ---');
`;

code = code.replace(target, repl);

const targetLog = `const sh = mockDoc.getElementById('cfg-strike-promo-hint');`;
const replLog = `
console.log('document.getElementById(cfg-show-strike):', mockDoc.getElementById('cfg-show-strike'));
const sh = mockDoc.getElementById('cfg-strike-promo-hint');
`;

code = code.replace(targetLog, replLog);
fs.writeFileSync('scratch/debug_test2.js', code, 'utf8');


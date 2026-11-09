const fs = require('fs');

// Jalankan test_card_promo_09c_r6.js sampai 2.2 tapi dengan console.log
let code = fs.readFileSync('scratch/test_card_promo_09c_r6.js', 'utf8');

const target = `// Promo is inactive, sim is inactive, all 4 toggles are ON
ProductForm.updateProductCardLivePreview();`;

const repl = `// Promo is inactive, sim is inactive, all 4 toggles are ON
console.log('cfg-show-strike desktop checked:', mockDoc.getElementById('cfg-show-strike')?.checked);
console.log('cfg-show-strike mob checked:', mockDoc.getElementById('cfg-show-strike-mob')?.checked);
ProductForm.updateProductCardLivePreview();
const sh = mockDoc.getElementById('cfg-strike-promo-hint');
console.log('strikeHint classes:', Array.from(sh.classList.classes));
`;

code = code.replace(target, repl);
fs.writeFileSync('scratch/debug_test.js', code, 'utf8');


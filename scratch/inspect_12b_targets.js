const fs = require('fs');

const db = fs.readFileSync('js/db.js', 'utf8');
const bs = fs.readFileSync('js/buyer-store.js', 'utf8');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

console.log('db contains saveCardModelPreset:', db.includes('saveCardModelPreset(variantCode, config)'));
console.log('db contains getFooterTextsHistory:', db.includes('getFooterTextsHistory()'));
console.log('bs contains footer2Bg:', bs.includes("const footer2Bg = f2Obj.bg_color || prod.footer_2_bg_color || config.footer_2_bg_color || '#047857';"));
console.log('pf contains getPrimaryThemeColor:', pf.includes('function getPrimaryThemeColor()'));
console.log('pf contains handleSaveCardDesign:', pf.includes('function handleSaveCardDesign()'));


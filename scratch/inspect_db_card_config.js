const fs = require('fs');
const dbCode = fs.readFileSync('js/db.js', 'utf8');

const updateIdx = 126384;
const updateFn = dbCode.substring(updateIdx, updateIdx + 18000);
console.log('card_config in updateProduct:', updateFn.includes('card_config'));
console.log('use_default_card_design in updateProduct:', updateFn.includes('use_default_card_design'));

// Cari match card_config
const m = updateFn.match(/card_config[^\n]*/g);
console.log('card_config lines:', m);


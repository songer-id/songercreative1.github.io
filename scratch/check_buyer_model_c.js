const fs = require('fs');
const bs = fs.readFileSync('js/buyer-store.js', 'utf8');

const fnIdx = bs.indexOf('function renderCardModelC');
console.log(bs.slice(fnIdx, fnIdx + 1200));


const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');

const fnStart = pf.indexOf('function updateProductCardLivePreview()');
const sub = pf.substring(fnStart);
const modelCPos = sub.indexOf("variant === 'C'");
console.log(sub.substring(modelCPos - 1500, modelCPos));

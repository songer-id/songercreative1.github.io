const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');

const fnStart = pf.indexOf('function updateProductCardLivePreview()');
const sub = pf.substring(fnStart);
const modelCPos = sub.indexOf("variant === 'C'");
console.log('Model C inside live preview pos:', modelCPos);
if (modelCPos !== -1) {
  console.log(sub.substring(modelCPos, modelCPos + 4000));
}

const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const deskFooterStart = pf.indexOf('id="accordion-body-footer"');
const deskFooterEnd = pf.indexOf('</div>\n                  </div>\n                </div>\n              </div>', deskFooterStart) || deskFooterStart + 5000;
console.log('--- Desktop full footer:');
console.log(pf.slice(deskFooterStart, deskFooterStart + 4500));


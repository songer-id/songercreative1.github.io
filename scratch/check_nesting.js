const fs = require('fs');
const content = fs.readFileSync('js/product-form.js', 'utf8');

const s = content.indexOf('<div class="w-full relative">');
const backdrop = content.indexOf('id="mobile-preview-backdrop"');
console.log('w-full relative is at:', s);
console.log('backdrop is at:', backdrop);

// Is backdrop inside w-full relative?
// Let's trace all <div> and </div> between s and backdrop
let depth = 0;
let pos = s;
while (pos < backdrop) {
  const nextOpen = content.indexOf('<div', pos);
  const nextClose = content.indexOf('</div>', pos);
  if (nextClose !== -1 && (nextOpen === -1 || nextClose < nextOpen) && nextClose < backdrop) {
    depth--;
    pos = nextClose + 6;
  } else if (nextOpen !== -1 && nextOpen < backdrop) {
    depth++;
    pos = nextOpen + 4;
  } else {
    break;
  }
}
console.log('Depth of div nesting at backdrop:', depth);


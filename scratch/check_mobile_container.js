const fs = require('fs');
const content = fs.readFileSync('js/product-form.js', 'utf8');

const startMob = content.indexOf('<div id="mobile-preview-sheet"');
const endMob = content.indexOf('</div>\n\n      </div>', startMob); // or similar
// Let's find where mobile-preview-sheet closing tag is
let depth = 0;
let pos = startMob;
let foundEnd = -1;
while (pos < content.length) {
  const nextOpen = content.indexOf('<div', pos);
  const nextClose = content.indexOf('</div>', pos);
  if (nextClose === -1) break;
  if (nextOpen !== -1 && nextOpen < nextClose) {
    depth++;
    pos = nextOpen + 4;
  } else {
    depth--;
    if (depth === 0) {
      foundEnd = nextClose + 6;
      break;
    }
    pos = nextClose + 6;
  }
}
console.log('Found mobile-preview-sheet end at:', foundEnd);
console.log('Mobile sheet snippet:');
console.log(content.slice(startMob, startMob + 600));
console.log('--- END PART ---');
console.log(content.slice(foundEnd - 500, foundEnd + 100));

const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

function findClosingDiv(str, startPos) {
  let depth = 0;
  for (let i = startPos; i < str.length; i++) {
    if (str[i] === '<') {
      const match = str.slice(i).match(/^<\/?([a-zA-Z0-9_-]+)/);
      if (match) {
        const tagName = match[1].toLowerCase();
        const isClosing = str[i+1] === '/';
        if (tagName === 'div') {
          if (isClosing) depth--;
          else depth++;
          if (depth === 0) return i + match[0].length + 1;
        }
      }
    }
  }
  return -1;
}

const deskHtml = pf.slice(pf.indexOf('id="card-customization-section"'), findClosingDiv(pf, pf.indexOf('id="card-customization-section"')));
const lines = deskHtml.split('\n');

console.log('--- Context of line 468:');
for (let i = 460; i < 480; i++) console.log(`${i+1}: ${lines[i]}`);

console.log('--- Context of line 520:');
for (let i = 510; i < 535; i++) console.log(`${i+1}: ${lines[i]}`);


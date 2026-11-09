const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

function findClosingDiv(str, startPos) {
  let depth = 0;
  let inTag = false;
  let tagStart = -1;
  for (let i = startPos; i < str.length; i++) {
    if (str[i] === '<') {
      const match = str.slice(i).match(/^<\/?([a-zA-Z0-9_-]+)/);
      if (match) {
        const tagName = match[1].toLowerCase();
        const isClosing = str[i+1] === '/';
        if (tagName === 'div') {
          if (isClosing) depth--;
          else depth++;
          if (depth === 0) {
            return i + match[0].length + 1; // position after </div>
          }
        }
      }
    }
  }
  return -1;
}

const deskStart = pf.indexOf('id="card-customization-section"');
const deskEnd = findClosingDiv(pf, deskStart);
console.log('Desk start:', deskStart, 'Desk end:', deskEnd);

const mobStart = pf.indexOf('id="card-customization-section-mob"');
const mobEnd = findClosingDiv(pf, mobStart);
console.log('Mob start:', mobStart, 'Mob end:', mobEnd);

const deskHtml = pf.slice(deskStart, deskEnd);
const mobHtml = pf.slice(mobStart, mobEnd);

console.log('Desk exact HTML length:', deskHtml.length);
console.log('Mob exact HTML length:', mobHtml.length);


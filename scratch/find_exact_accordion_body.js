const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

function findMatchingClosingDiv(str, startPos) {
  let depth = 0;
  for (let i = startPos; i < str.length; i++) {
    if (str[i] === '<') {
      const match = str.slice(i).match(/^<\/?([a-zA-Z0-9_-]+)/);
      if (match) {
        const tagName = match[1].toLowerCase();
        const isClosing = str[i+1] === '/';
        if (tagName === 'div') {
          if (isClosing) {
            depth--;
            if (depth === 0) {
              return i + 6; // index right after </div>
            }
          } else {
            depth++;
          }
        }
      }
    }
  }
  return -1;
}

const deskStart = pf.indexOf('<div id="accordion-body-footer"');
const deskEnd = findMatchingClosingDiv(pf, deskStart);
console.log('Desk start:', deskStart, 'Desk end:', deskEnd, 'Length:', deskEnd - deskStart);
const deskExact = pf.slice(deskStart, deskEnd);

const mobStart = pf.indexOf('<div id="accordion-body-footer-mob"');
const mobEnd = findMatchingClosingDiv(pf, mobStart);
console.log('Mob start:', mobStart, 'Mob end:', mobEnd, 'Length:', mobEnd - mobStart);
const mobExact = pf.slice(mobStart, mobEnd);

fs.writeFileSync('scratch/desk_exact_full.html', deskExact);
fs.writeFileSync('scratch/mob_exact_full.html', mobExact);
console.log('Saved exact blocks.');


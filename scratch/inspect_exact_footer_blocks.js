const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

function getAccordionFooter(bodyId) {
  const start = pf.indexOf(`id="${bodyId}"`);
  // find closing </div> of this accordion body
  let depth = 0;
  for (let i = start; i < pf.length; i++) {
    if (pf[i] === '<') {
      const match = pf.slice(i).match(/^<\/?([a-zA-Z0-9_-]+)/);
      if (match) {
        const tagName = match[1].toLowerCase();
        const isClosing = pf[i+1] === '/';
        if (tagName === 'div') {
          if (isClosing) depth--;
          else depth++;
          if (depth === 0) {
            return pf.slice(start, i + 6);
          }
        }
      }
    }
  }
  return '';
}

const deskFooter = getAccordionFooter('accordion-body-footer');
console.log('--- Desk footer exact length:', deskFooter.length);
console.log(deskFooter.slice(0, 300));
console.log('...');
console.log(deskFooter.slice(-300));

const mobFooter = getAccordionFooter('accordion-body-footer-mob');
console.log('--- Mob footer exact length:', mobFooter.length);
console.log(mobFooter.slice(0, 300));
console.log('...');
console.log(mobFooter.slice(-300));


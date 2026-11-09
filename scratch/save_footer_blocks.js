const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

function getAccordionFooter(bodyId) {
  const start = pf.indexOf(`id="${bodyId}"`);
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
          if (depth === 0) return pf.slice(start, i + 6);
        }
      }
    }
  }
  return '';
}

fs.writeFileSync('scratch/desk_footer.html', getAccordionFooter('accordion-body-footer'));
fs.writeFileSync('scratch/mob_footer.html', getAccordionFooter('accordion-body-footer-mob'));
console.log('Saved desk_footer.html and mob_footer.html');


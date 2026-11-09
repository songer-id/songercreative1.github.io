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
const mobHtml = pf.slice(pf.indexOf('id="card-customization-section-mob"'), findClosingDiv(pf, pf.indexOf('id="card-customization-section-mob"')));

function scanSection(name, html) {
  console.log(`\n=== Scanning ${name} ===`);
  const lines = html.split('\n');
  lines.forEach((l, idx) => {
    if (l.match(/font-(bold|semibold|medium)/) || l.match(/text-(xs|sm|base|lg)\s+font-(bold|semibold|medium)/)) {
      console.log(`Line ${idx+1}: ${l.trim()}`);
    }
  });
}

scanSection('Desk', deskHtml);
scanSection('Mob', mobHtml);


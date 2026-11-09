const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');

console.log('=== SEARCHING FOOTER ICON IN product-form.js ===');

// Cari kemunculan badge_icon atau footer_badge_icon
const matches = [];
let m;
const re = /(?:footer_badge_icon|footer_2_badge_icon|badge_icon|footer.*icon)/gi;
while ((m = re.exec(pf)) !== null) {
  matches.push({
    match: m[0],
    pos: m.index,
    snippet: pf.substring(Math.max(0, m.index - 60), Math.min(pf.length, m.index + 120)).replace(/\n\s+/g, ' ')
  });
}
console.log('Total matches:', matches.length);
console.log(matches.slice(0, 15));

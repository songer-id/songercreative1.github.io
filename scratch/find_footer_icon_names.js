const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const db = fs.readFileSync('js/db.js', 'utf8');
const bs = fs.readFileSync('js/buyer-store.js', 'utf8');

function findMatches(name, content) {
  const re = /(footer[a-zA-Z0-9_]*icon|card_footer[a-zA-Z0-9_]*)/gi;
  const set = new Set();
  let m;
  while ((m = re.exec(content)) !== null) {
    set.add(m[0]);
  }
  console.log(`=== Matches in ${name} ===`);
  console.log([...set].sort());
}

findMatches('product-form.js', pf);
findMatches('db.js', db);
findMatches('buyer-store.js', bs);

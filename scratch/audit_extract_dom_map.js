const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const adminHtml = fs.readFileSync('admin.html', 'utf8');

// Find all id="..." inside product-form.js and admin.html
const idRegex = /id=["']([a-zA-Z0-9_\-]+)["']/g;
const ids = new Map();

let m;
while ((m = idRegex.exec(pf)) !== null) {
  const id = m[1];
  if (!ids.has(id)) ids.set(id, { id, source: 'product-form.js', occurrences: 0 });
  ids.get(id).occurrences++;
}

while ((m = idRegex.exec(adminHtml)) !== null) {
  const id = m[1];
  if (!ids.has(id)) {
    ids.set(id, { id, source: 'admin.html', occurrences: 1 });
  } else {
    ids.get(id).inAdminHtml = true;
  }
}

console.log(`Found ${ids.size} unique IDs across product-form.js and admin.html`);

// Now let's analyze each ID for event bindings in pf
const idList = Array.from(ids.values());
idList.forEach(item => {
  const id = item.id;
  // Check getElementById('id')
  const gebiRegex = new RegExp(`getElementById\\(['"]${id}['"]\\)`, 'g');
  const gebiMatches = (pf.match(gebiRegex) || []).length;
  item.gebiCalls = gebiMatches;

  // Check event bindings on this element
  const eventMatches = [];
  const patterns = [
    new RegExp(`${id}['"]\\)\\s*\\.\\s*(oninput|onchange|onclick|onblur|onfocus)\\s*=`, 'g'),
    new RegExp(`document\\.getElementById\\(['"]${id}['"]\\)\\s*\\.\\s*addEventListener\\(['"]([^'"]+)['"]`, 'g')
  ];
  patterns.forEach(p => {
    let em;
    while ((em = p.exec(pf)) !== null) {
      eventMatches.push(em[1]);
    }
  });
  item.events = eventMatches;
});

fs.writeFileSync('scratch/inventory_dom_ids.json', JSON.stringify(idList, null, 2));
console.log('Saved scratch/inventory_dom_ids.json');


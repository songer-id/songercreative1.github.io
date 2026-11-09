const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const start = pf.indexOf('id="card-customization-section"');
const end = pf.indexOf('</aside>');
const deskSection = pf.slice(start, end);

// Proper HTML id attribute matcher: must be preceded by whitespace (e.g. ' id="...')
const regex = /\sid="([^"]+)"/g;
let m;
const found = [];
while ((m = regex.exec(deskSection)) !== null) {
  found.push(m[1]);
}

const counts = {};
found.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
const dups = Object.keys(counts).filter(id => counts[id] > 1);
console.log('Actual duplicated IDs in Desktop section:', dups);

const mobStart = pf.indexOf('id="card-customization-section-mob"');
const mobEnd = pf.indexOf('<!-- MODAL MINI:');
const mobSection = pf.slice(mobStart, mobEnd);

const mobRegex = /\sid="([^"]+)"/g;
let mobM;
const mobFound = [];
while ((mobM = mobRegex.exec(mobSection)) !== null) {
  mobFound.push(mobM[1]);
}

const mobCounts = {};
mobFound.forEach(id => { mobCounts[id] = (mobCounts[id] || 0) + 1; });
const mobDups = Object.keys(mobCounts).filter(id => mobCounts[id] > 1);
console.log('Actual duplicated IDs in Mobile section:', mobDups);

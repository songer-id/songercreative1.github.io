const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const initialProps = JSON.parse(fs.readFileSync('scratch/inventory_primary_state.json', 'utf8')).map(p => p.key);

const assignRegex = /\bprimaryState\.([a-zA-Z0-9_]+)\s*=/g;
const allAssignedProps = new Set();
let m;
while ((m = assignRegex.exec(pf)) !== null) {
  allAssignedProps.add(m[1]);
}

const notInInitial = [...allAssignedProps].filter(p => !initialProps.includes(p));
console.log('Properties assigned to primaryState that were not in initial block:', notInInitial);

// Also check read properties
const readRegex = /\bprimaryState\.([a-zA-Z0-9_]+)\b/g;
const allReadProps = new Set();
while ((m = readRegex.exec(pf)) !== null) {
  allReadProps.add(m[1]);
}
const notInInitialRead = [...allReadProps].filter(p => !initialProps.includes(p));
console.log('Properties read from primaryState that were not in initial block:', notInInitialRead);


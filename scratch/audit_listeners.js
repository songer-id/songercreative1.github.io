const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split('\n');

console.log('=== EVENT LISTENER BINDINGS IN product-form.js ===');
const listenerCalls = [];
lines.forEach((l, idx) => {
  if (l.match(/addEventListener|bindFormEvents|bindStep|initForm|resetForm/)) {
    if (l.includes('function ') || l.includes('addEventListener') || l.includes('bindFormEvents(')) {
      listenerCalls.push(`L${idx+1}: ${l.trim()}`);
    }
  }
});
console.log(`Found ${listenerCalls.length} listener/binding lines:`);
console.log(listenerCalls.slice(0, 35).join('\n'));


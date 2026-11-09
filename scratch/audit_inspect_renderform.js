const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split('\n');

console.log('=== renderForm lines 2420 - 2750 structure ===');
for (let i = 2420; i < 2750; i++) {
  const l = lines[i];
  if (l.includes('id=') || l.includes('function ') || l.includes('step-1') || l.includes('step-2') || l.includes('class="grid') || l.includes('<!--') || l.includes('data-')) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
}


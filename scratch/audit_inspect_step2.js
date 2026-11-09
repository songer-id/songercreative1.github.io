const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split('\n');

console.log('=== renderStep2Content lines 14590 - 15000 ===');
const cards = [];
for (let i = 14590; i < 21000; i++) {
  const l = lines[i];
  if (l.includes('id="card-step2-') || l.includes('id="section-') || l.includes('<!-- KARTU') || l.includes('<!-- SEKSI') || l.includes('<!-- 2.')) {
    cards.push(`L${i+1}: ${l.trim()}`);
  }
}
console.log(cards.join('\n'));


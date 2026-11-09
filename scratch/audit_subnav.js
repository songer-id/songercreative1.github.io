const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split('\n');

const subnavLines = [];
lines.forEach((l, idx) => {
  if (l.includes('step2-subnav') || l.includes('subnav-tab') || l.includes('initStep2SubnavObserver')) {
    subnavLines.push(`L${idx+1}: ${l.trim()}`);
  }
});
console.log(subnavLines.slice(0, 30).join('\n'));


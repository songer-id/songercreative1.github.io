const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// Find where form-container is used or where render() is defined
const matches = [];
const lines = pf.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('form-container') || l.match(/function\s+render\b|renderForm|renderStep/)) {
    matches.push(`L${idx+1}: ${l.trim()}`);
  }
});
console.log(matches.slice(0, 40).join('\n'));

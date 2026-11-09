const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const sub = pf.substring(244000, 275000);
const lines = sub.split('\n');
console.log('Lines in range 244000-275000:', lines.length);

lines.forEach((l, idx) => {
  if (l.includes('function ') || l.includes('syncEye') || l.includes('addEventListener') || l.includes('bind') || l.includes('initCardCustomization')) {
    console.log(`L${idx}: ${l.trim().substring(0, 120)}`);
  }
});


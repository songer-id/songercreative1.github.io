const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const matches = pf.match(/<input[^>]*id="[^"]*radius[^"]*"[^>]*>[\s\S]*?<\/div>/g) || [];
console.log('Radius inputs found:', matches.length);
matches.slice(0, 4).forEach((m, i) => {
  console.log(`Radius ${i+1}:`);
  console.log(m);
});


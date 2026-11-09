const fs = require('fs');

const pfContent = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pfContent.split('\n');

console.log('Finding cardHtml start and structure in product-form.js:');
let inCard = false;
let count = 0;
for (let i = 8010; i < 8365; i++) {
  const line = lines[i];
  if (line.includes('const cardHtml =') || line.includes('cardHtml =')) {
    inCard = true;
  }
  if (inCard && count < 50) {
    console.log(`L${i+1}: ${line}`);
    count++;
  }
}


const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

console.log('--- Inspecting lines around 530000-550000 ---');
// Cari deklarasi fungsi di sekitar 530000
const snippet = pf.substring(525000, 550000);
const lines = snippet.split('\n');
console.log('Total lines in snippet:', lines.length);

// Cari deklarasi fungsi atau komentar besar
lines.forEach((line, i) => {
  if (line.includes('function ') || line.includes('renderCard') || line.includes('Model A') || line.includes('Model B') || line.includes('Model C') || line.includes('salesCount') || line.includes('cfg.show_rating')) {
    console.log(`L${i}: ${line.trim().substring(0, 120)}`);
  }
});


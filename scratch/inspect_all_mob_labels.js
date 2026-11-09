const fs = require('fs');
const content = fs.readFileSync('js/product-form.js', 'utf8');

// Ambil substring #card-customization-section-mob
const startIdx = content.indexOf('id="card-customization-section-mob"');
const endIdx = content.indexOf('<!-- Pinned Footer Section Mobile', startIdx);
const mobSection = content.substring(startIdx, endIdx);

// Cari semua tag <label
const labelRegex = /<label[^>]*>([\s\S]*?)<\/label>/gi;
let match;
let count = 0;
while ((match = labelRegex.exec(mobSection)) !== null) {
  count++;
  const fullTag = match[0];
  const inner = match[1].replace(/<[^>]+>/g, '').trim();
  const openTag = fullTag.substring(0, fullTag.indexOf('>') + 1);
  console.log(`[${count}] TAG: ${openTag}`);
  console.log(`     TEXT: "${inner}"`);
}


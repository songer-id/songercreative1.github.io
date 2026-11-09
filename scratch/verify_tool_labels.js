const fs = require('fs');
const content = fs.readFileSync('js/product-form.js', 'utf8');

const startIdx = content.indexOf('id="card-customization-section-mob"');
const endIdx = content.indexOf('<!-- Pinned Footer Section Mobile', startIdx);
const mobSection = content.substring(startIdx, endIdx);

const labelRegex = /<label([^>]*)>([\s\S]*?)<\/label>/gi;
let match;
const toolLabels = [];
while ((match = labelRegex.exec(mobSection)) !== null) {
  const attrs = match[1];
  const inner = match[2].trim();
  if (!attrs.includes('cfg-eye-toggle') && !attrs.includes('hover:bg-slate-50')) {
    toolLabels.push({ attrs, text: inner });
  }
}

console.log('Total tool input labels found:', toolLabels.length);
toolLabels.forEach((l, i) => {
  console.log(`${i+1}. [${l.text}] => attrs: ${l.attrs.trim()}`);
});


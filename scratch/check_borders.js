const fs = require('fs');
const content = fs.readFileSync('js/product-form.js', 'utf8');

const s = content.indexOf('<div class="w-full max-w-none');
const e = content.indexOf('<!-- Body Sidebar (Scrollable) -->');
const snippet = content.slice(s, e);

const lines = snippet.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('border') || l.includes('top-bar') || l.includes('sidebar')) {
    console.log((idx + 1) + ': ' + l.trim());
  }
});


const fs = require('fs');
const formJs = fs.readFileSync('js/product-form.js', 'utf8');
const adminCss = fs.readFileSync('css/admin.css', 'utf8');

console.log('--- DESKTOP PREVIEW SIDEBAR IN JS ---');
const asideMatch = formJs.match(/<aside id="desktop-preview-sidebar"[^>]*>/);
console.log(asideMatch ? asideMatch[0] : 'Not found');

const headerMatch = formJs.match(/<aside id="desktop-preview-sidebar"[\s\S]*?<div class="p-2\.5 px-3[^>]*>/);
console.log(headerMatch ? headerMatch[0] : 'Not found');

console.log('\n--- DESKTOP PREVIEW SIDEBAR IN CSS ---');
const lines = adminCss.split('\n');
let capturing = false;
let block = [];
lines.forEach((l, idx) => {
  if (l.includes('#desktop-preview-sidebar')) {
    capturing = true;
  }
  if (capturing) {
    block.push((idx + 1) + ': ' + l);
    if (l.includes('}') && block.length > 2) {
      console.log(block.join('\n'));
      block = [];
      capturing = false;
    }
  }
});


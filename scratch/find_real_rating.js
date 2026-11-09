const fs = require('fs');

function searchInFile(filepath, regex) {
  if (!fs.existsSync(filepath)) return [];
  const content = fs.readFileSync(filepath, 'utf8');
  const matches = [];
  let m;
  while ((m = regex.exec(content)) !== null) {
    matches.push(content.substring(Math.max(0, m.index - 50), Math.min(content.length, m.index + m[0].length + 100)).replace(/\n\s+/g, ' '));
  }
  return matches;
}

console.log('=== buyer-store.js rating ===');
console.log(searchInFile('js/buyer-store.js', /rating/gi).slice(0, 10));

console.log('=== db.js rating ===');
console.log(searchInFile('js/db.js', /rating/gi).slice(0, 10));

console.log('=== product-form.js prod.rating or primaryState.rating ===');
console.log(searchInFile('js/product-form.js', /(?:prod|product|primaryState)\.rating/gi));


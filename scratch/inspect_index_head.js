const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const lines = indexHtml.split('\n');
lines.slice(0, 50).forEach((l, i) => console.log(`${i+1}: ${l}`));

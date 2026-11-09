const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const lines = indexHtml.split('\n');
lines.slice(50, 100).forEach((l, i) => console.log(`${i+51}: ${l}`));

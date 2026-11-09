const fs = require('fs');
const desk = fs.readFileSync('scratch/desk_exact_full.html', 'utf8');
const lines = desk.split('\n');
console.log('--- Total lines:', lines.length);
console.log('--- First 15 lines:');
lines.slice(0, 15).forEach((l, i) => console.log(`${i+1}: ${l}`));
console.log('--- Last 15 lines:');
lines.slice(-15).forEach((l, i) => console.log(`${lines.length - 15 + i + 1}: ${l}`));


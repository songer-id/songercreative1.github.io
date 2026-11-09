const fs = require('fs');
const css = fs.readFileSync('css/theme-editor.css', 'utf8');
const lines = css.split('\n');
console.log('--- L130-150:');
for (let i = 130; i < 150; i++) console.log(`${i+1}: ${lines[i]}`);
console.log('--- L190-210:');
for (let i = 190; i < 210; i++) console.log(`${i+1}: ${lines[i]}`);
console.log('--- L640-660:');
for (let i = 640; i < 660; i++) console.log(`${i+1}: ${lines[i]}`);


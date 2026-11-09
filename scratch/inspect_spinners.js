const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');

const matches = css.match(/[^{}]*spinner[^{}]*\{[^}]*\}/gi) || [];
console.log('Spinner CSS rules:', matches);


const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split('\n');
lines.forEach((l, i) => {
  if (l.includes('show_ticket_icon') || l.includes('ticket-check') || l.includes('cfg-show-ticket-icon') || l.includes('ticket')) {
    console.log(`Line ${i+1}: ${l.trim()}`);
  }
});

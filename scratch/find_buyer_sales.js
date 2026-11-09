const fs = require('fs');
const bs = fs.readFileSync('js/buyer-store.js', 'utf8').split('\n');

for (let i = 0; i < bs.length; i++) {
  if (bs[i].includes('show_sales') || bs[i].includes('sales_count')) {
    console.log((i + 1) + ': ' + bs[i].trim());
  }
}


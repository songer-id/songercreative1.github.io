const fs = require('fs');
const db = fs.readFileSync('js/db.js', 'utf8');
const lines = db.split('\n');

console.log('=== CREATE ORDER & STOCK DEDUCTION IN DB.JS ===');
lines.forEach((l, idx) => {
  if (l.match(/createOrder|reduceStock|mutateStock|StockMutation|deduct/i)) {
    console.log(`db.js L${idx+1}: ${l.trim()}`);
  }
});


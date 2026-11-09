const fs = require('fs');
const content = fs.readFileSync('js/product-form.js', 'utf8');

function showContext(str, beforeLines = 5, afterLines = 15) {
  const idx = content.indexOf(str);
  if (idx === -1) {
    console.log('NOT FOUND:', str);
    return;
  }
  const lines = content.slice(0, idx).split('\n');
  const lineNum = lines.length;
  const allLines = content.split('\n');
  console.log(`\n=== Context for "${str}" around line ${lineNum} ===`);
  const start = Math.max(0, lineNum - beforeLines - 1);
  const end = Math.min(allLines.length, lineNum + afterLines);
  for (let i = start; i < end; i++) {
    console.log((i + 1) + ': ' + allLines[i]);
  }
}

showContext('id="cfg-discount-badge-position-group"', 5, 20);
showContext('id="cfg-discount-badge-position-group-mob"', 5, 20);
showContext('function setDiscountBadgePosition(pos) {', 2, 25);
showContext("const ticketHintDesk = document.getElementById('cfg-ticket-promo-hint');", 5, 30);
showContext('// Discount Badge Position Buttons (Desktop & Mobile Sync)', 2, 15);
showContext("if (pEndInp) pEndInp.addEventListener('change',", 3, 10);

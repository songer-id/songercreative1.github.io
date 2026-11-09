const fs = require('fs');
const content = fs.readFileSync('js/product-form.js', 'utf8');

function showAround(str, linesBefore = 5, linesAfter = 10) {
  const idx = content.indexOf(str);
  if (idx === -1) {
    console.log('NOT FOUND:', str);
    return;
  }
  const lines = content.slice(0, idx).split('\n');
  const lineNum = lines.length;
  const allLines = content.split('\n');
  console.log(`\n=== Around line ${lineNum}: "${str}" ===`);
  for (let i = Math.max(0, lineNum - linesBefore - 1); i < Math.min(allLines.length, lineNum + linesAfter); i++) {
    console.log((i + 1) + ': ' + allLines[i]);
  }
}

showAround('id="cfg-strike-panel-desk"', 3, 12);
showAround('id="cfg-strike-panel-mob"', 3, 12);
showAround('id="cfg-countdown-panel-desk"', 3, 50);
showAround('id="cfg-countdown-panel-mob"', 3, 50);
showAround('const renderCardPhoto = (aspectRatioClass) => {', 2, 25);


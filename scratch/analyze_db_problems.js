const fs = require('fs');
const content = fs.readFileSync('C:/Users/Ubaidillah/.gemini/antigravity/brain/db2af6ad-b91f-4846-8499-28858fef96fe/.system_generated/steps/13139/output.txt', 'utf8');
const lines = content.split('\n');
const errorLines = lines.filter(l => l.includes('error TS'));
console.log('Total TS errors:', errorLines.length);

const errorCodes = {};
errorLines.forEach(l => {
  const match = l.match(/error (TS\d+): (.*)/);
  if (match) {
    const code = match[1];
    const msg = match[2];
    if (!errorCodes[code]) errorCodes[code] = { count: 0, sample: msg };
    errorCodes[code].count++;
  }
});

console.log(JSON.stringify(errorCodes, null, 2));


const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split(/\r?\n/);

let currentFn = '';
let fnStart = 0;
let declLine = -1;
let cfgUsagesInFn = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const m = line.match(/^\s*(?:async\s+)?function\s+([a-zA-Z0-9_]+)/);
  if (m) {
    if (currentFn && declLine !== -1) {
      const beforeDecl = cfgUsagesInFn.filter(u => u.line < declLine);
      if (beforeDecl.length > 0) {
        console.log(`\nERROR FOUND in Function [${currentFn}] (lines ${fnStart}-${i})!`);
        console.log(`cfg declared at line ${declLine}: ${lines[declLine - 1].trim()}`);
        console.log(`Usages BEFORE declaration:`);
        beforeDecl.forEach(u => console.log(`  Line ${u.line}: ${u.text}`));
      }
    }
    currentFn = m[1];
    fnStart = i + 1;
    declLine = -1;
    cfgUsagesInFn = [];
  }

  const strippedLine = line
    .replace(/'[^']*'/g, "''")
    .replace(/"[^"]*"/g, '""');

  if (/\b(const|let|var)\s+cfg\b/.test(strippedLine)) {
    if (declLine === -1) declLine = i + 1;
  }
  if (/(?:\bcfg\s*\.|\bcfg\s*\[|\bcfg\s*===|\bcfg\s*!==|\bcfg\s*\?|\bcfg\s*&&|\bcfg\s*\|\||[\(\s,]cfg[\s,\):;])/.test(strippedLine)) {
    if (!strippedLine.includes("cfg-")) {
      cfgUsagesInFn.push({ line: i + 1, text: line.trim() });
    }
  }
}

if (currentFn && declLine !== -1) {
  const beforeDecl = cfgUsagesInFn.filter(u => u.line < declLine);
  if (beforeDecl.length > 0) {
    console.log(`\nERROR FOUND in Function [${currentFn}]!`);
    console.log(`cfg declared at line ${declLine}: ${lines[declLine - 1].trim()}`);
    console.log(`Usages BEFORE declaration:`);
    beforeDecl.forEach(u => console.log(`  Line ${u.line}: ${u.text}`));
  }
}


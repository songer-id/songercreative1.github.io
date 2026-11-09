const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const lines = pf.split(/\r?\n/);

let currentFn = '';
let fnStart = 0;
let hasCfgDecl = false;
let cfgUsagesInFn = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const m = line.match(/^\s*(?:async\s+)?function\s+([a-zA-Z0-9_]+)/);
  if (m) {
    if (currentFn && cfgUsagesInFn.length > 0 && !hasCfgDecl) {
      console.log(`Function [${currentFn}] (lines ${fnStart}-${i}) uses cfg on lines: ${cfgUsagesInFn.join(', ')} BUT has no decl!`);
    }
    currentFn = m[1];
    fnStart = i + 1;
    hasCfgDecl = false;
    cfgUsagesInFn = [];
  }
  // Remove string literals from line to only check code
  const strippedLine = line
    .replace(/'[^']*'/g, "''")
    .replace(/"[^"]*"/g, '""');

  if (/\b(const|let|var)\s+cfg\b/.test(strippedLine)) {
    hasCfgDecl = true;
  }
  // Check if variable cfg is used
  if (/(?:\bcfg\s*\.|\bcfg\s*\[|\bcfg\s*===|\bcfg\s*!==|\bcfg\s*\?|\bcfg\s*&&|\bcfg\s*\|\||[\(\s,]cfg[\s,\):;])/.test(strippedLine)) {
    // Exclude css class or id prefixes if any left
    if (!strippedLine.includes("cfg-")) {
      cfgUsagesInFn.push(i + 1);
    }
  }
}

if (currentFn && cfgUsagesInFn.length > 0 && !hasCfgDecl) {
  console.log(`Function [${currentFn}] (lines ${fnStart}-${lines.length}) uses cfg on lines: ${cfgUsagesInFn.join(', ')} BUT has no decl!`);
}

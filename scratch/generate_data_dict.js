const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const linesPf = pf.split('\n');

// Find line of primaryState
let startLine = 408;

// Function to find line of property declaration in primaryState
function findPropLine(prop) {
  for (let i = 407; i < 600; i++) {
    if (linesPf[i].match(new RegExp(`^\\s*${prop}\\s*:`))) {
      return i + 1;
    }
  }
  return 408;
}

// Function to find writer functions
function findWriters(prop) {
  const writers = new Set();
  const regex = new RegExp(`primaryState\\.${prop}\\s*=`, 'g');
  linesPf.forEach((l, idx) => {
    if (l.match(regex)) {
      // Find enclosing function
      for (let j = idx; j >= Math.max(0, idx - 80); j--) {
        const fnM = linesPf[j].match(/(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:function|\([^)]*\)\s*=>))/);
        if (fnM) {
          writers.add(fnM[1] || fnM[2]);
          break;
        }
      }
    }
  });
  return Array.from(writers);
}

// Function to find reader functions
function findReaders(prop) {
  const readers = new Set();
  const regex = new RegExp(`\\bprimaryState\\.${prop}\\b(?!\\s*=)`, 'g');
  linesPf.forEach((l, idx) => {
    if (l.match(regex)) {
      for (let j = idx; j >= Math.max(0, idx - 80); j--) {
        const fnM = linesPf[j].match(/(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:function|\([^)]*\)\s*=>))/);
        if (fnM) {
          readers.add(fnM[1] || fnM[2]);
          break;
        }
      }
    }
  });
  return Array.from(readers);
}

console.log('Script helper ready');

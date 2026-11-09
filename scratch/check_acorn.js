const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');

// Use babel or simple regex / parser or acorn to detect reference before declaration
// Let's use acorn or espree if available, or write a custom AST walker.
let acorn;
try {
  acorn = require('acorn');
} catch (e) {
  // Acorn might not be installed, let's check
}

console.log('Acorn available?', Boolean(acorn));


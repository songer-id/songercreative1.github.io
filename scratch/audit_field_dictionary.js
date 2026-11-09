const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const db = fs.readFileSync('js/db.js', 'utf8');
const prisma = fs.readFileSync('prisma/schema.prisma', 'utf8');

console.log('=== FIELD INVENTORY & DICTIONARY SCRIPT ===');

// Extract properties from primaryState default object
const primaryStateMatch = pf.match(/let\s+primaryState\s*=\s*(\{[\s\S]*?\n\s*\};)/);
let primaryStateKeys = [];
if (primaryStateMatch) {
  const block = primaryStateMatch[1];
  const keyMatches = block.match(/^\s*([a-zA-Z0-9_]+)\s*:/gm) || [];
  primaryStateKeys = keyMatches.map(k => k.trim().replace(':', ''));
}
console.log(`primaryState has ${primaryStateKeys.length} properties:`);
console.log(primaryStateKeys.join(', '));

// Extract properties from DB.createProduct
const createProductMatch = db.match(/const\s+newProduct\s*=\s*(\{[\s\S]*?\n\s*\};)/);
let dbProductKeys = [];
if (createProductMatch) {
  const block = createProductMatch[1];
  const keyMatches = block.match(/^\s*([a-zA-Z0-9_]+)\s*:/gm) || [];
  dbProductKeys = keyMatches.map(k => k.trim().replace(':', ''));
}
console.log(`\nDB newProduct has ${dbProductKeys.length} fields:`);
console.log(dbProductKeys.join(', '));

// Find keys in primaryState not in DB
const notInDb = primaryStateKeys.filter(k => !dbProductKeys.includes(k));
console.log(`\nKeys in primaryState not explicitly in DB newProduct (${notInDb.length}):`);
console.log(notInDb.join(', '));

// Find keys in DB not in primaryState
const notInState = dbProductKeys.filter(k => !primaryStateKeys.includes(k));
console.log(`\nKeys in DB newProduct not in primaryState (${notInState.length}):`);
console.log(notInState.join(', '));


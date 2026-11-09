const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// Check desktop customization section
const deskSectionMatch = pf.match(/<div id="card-customization-section"[\s\S]*?<\/aside>/);
if (!deskSectionMatch) {
  console.error('Desktop section not found');
  process.exit(1);
}
const deskHtml = deskSectionMatch[0];

// Check mobile customization section
const mobSectionMatch = pf.match(/<div id="card-customization-section-mob"[\s\S]*?<!-- MODAL MINI:/);
if (!mobSectionMatch) {
  console.error('Mobile section not found');
  process.exit(1);
}
const mobHtml = mobSectionMatch[0];

// Extract exact id attributes (word-boundary \bid="...") in desktop and mobile sections
const deskIds = Array.from(deskHtml.matchAll(/\bid="([^"]+)"/g)).map(m => m[1]);
const mobIds = Array.from(mobHtml.matchAll(/\bid="([^"]+)"/g)).map(m => m[1]);

console.log('Desktop unique IDs count: ' + new Set(deskIds).size + ', total IDs: ' + deskIds.length);
console.log('Mobile unique IDs count: ' + new Set(mobIds).size + ', total IDs: ' + mobIds.length);

const deskDups = deskIds.filter((item, index) => deskIds.indexOf(item) !== index);
const mobDups = mobIds.filter((item, index) => mobIds.indexOf(item) !== index);

if (deskDups.length > 0) {
  console.error('Desktop duplicate IDs:', deskDups);
  process.exit(1);
} else {
  console.log('✓ Zero duplicate IDs in Desktop editor section');
}

if (mobDups.length > 0) {
  console.error('Mobile duplicate IDs:', mobDups);
  process.exit(1);
} else {
  console.log('✓ Zero duplicate IDs in Mobile editor section');
}

// Check collision between desktop and mobile IDs
const commonIds = deskIds.filter(id => mobIds.includes(id));
if (commonIds.length > 0) {
  console.error('Shared IDs between desktop and mobile:', commonIds);
  process.exit(1);
} else {
  console.log('✓ Zero shared IDs between Desktop and Mobile editor sections');
}

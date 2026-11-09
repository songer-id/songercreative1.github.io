const fs = require('fs');
let content = fs.readFileSync('css/admin.css', 'utf8');
const isCrlf = content.includes('\r\n');
const eol = isCrlf ? '\r\n' : '\n';

// 1. Update width: 300px !important to 320px !important in #desktop-preview-sidebar
const widthTarget = `    width: 300px !important;\r\n    z-index: 35 !important;`;
const widthTargetLf = `    width: 300px !important;\n    z-index: 35 !important;`;
const widthReplacement = `    width: 320px !important;\r\n    z-index: 35 !important;`;
const widthReplacementLf = `    width: 320px !important;\n    z-index: 35 !important;`;

if (content.includes(widthTarget)) {
  content = content.replace(widthTarget, widthReplacement);
  console.log('Replaced sidebar width CRLF');
} else if (content.includes(widthTargetLf)) {
  content = content.replace(widthTargetLf, widthReplacementLf);
  console.log('Replaced sidebar width LF');
} else {
  console.error('widthTarget not found');
  process.exit(1);
}

// 2. Add panel transparent styling for #card-customization-section and #card-customization-section-mob
const typoTarget = `/* Scoped Typography for Card Customization Section (Task SC-ADMIN-CARD-EDITOR-GROUPING-09A) */`;
const typoReplacement = `/* Scoped Typography & Panel Styling for Card Customization Section (Task 09A / 09C) */
#card-customization-section,
#card-customization-section-mob {
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  max-width: 100% !important;
  width: 100% !important;
}
`.replace(/\n/g, eol) + typoTarget;

if (content.includes(typoTarget)) {
  content = content.replace(typoTarget, typoReplacement);
  console.log('Added panel transparent styling');
} else {
  console.error('typoTarget not found');
  process.exit(1);
}

fs.writeFileSync('css/admin.css', content, 'utf8');
console.log('css/admin.css updated successfully');


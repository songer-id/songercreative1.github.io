const fs = require('fs');
const adminCss = fs.readFileSync('css/admin.css', 'utf8');
const themeCss = fs.readFileSync('css/theme-editor.css', 'utf8');

function findSelectors(css, name) {
  console.log(`\n=== Finding matching selectors in ${name} ===`);
  const regex = /([^{}]+)\{([^}]+)\}/g;
  let match;
  while ((match = regex.exec(css)) !== null) {
    const sel = match[1].trim();
    const body = match[2].trim();
    if (body.includes('font-weight') || body.includes('bold') || body.includes('600') || body.includes('700') || body.includes('500')) {
      if (
        sel.includes('label') ||
        sel.includes('button') ||
        sel.includes('input') ||
        sel.includes('card') ||
        sel.includes('step1') ||
        sel.includes('view-product-form') ||
        sel.includes('form-container') ||
        sel.includes('accordion') ||
        sel.includes('tool') ||
        sel.includes('custom')
      ) {
        console.log(`SEL: ${sel.replace(/\s+/g, ' ')}\nBODY: ${body.replace(/\s+/g, ' ')}\n---`);
      }
    }
  }
}

findSelectors(adminCss, 'admin.css');
findSelectors(themeCss, 'theme-editor.css');


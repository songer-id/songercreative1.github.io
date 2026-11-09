const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');
const themeCss = fs.readFileSync('css/theme-editor.css', 'utf8');

// Let's check every single rule in admin.css and theme-editor.css that could match:
// #card-customization-section or #card-customization-section-mob and their descendants:
// label, button, span, p, input, div

function testMatch(selector, tag, id, classes = [], parentIds = [], parentClasses = []) {
  // simple selector matcher
}

console.log('Searching all rules in admin.css matching label or button or span in view-product-form:');
const rules = css.match(/([^{}]+)\{([^}]+)\}/g) || [];
rules.forEach(r => {
  const parts = r.split('{');
  const sel = parts[0].trim();
  const body = parts[1].trim();
  if (body.includes('font-weight') || body.includes('text-transform') || body.includes('uppercase')) {
    if (sel.includes('label') || sel.includes('button') || sel.includes('card') || sel.includes('input') || sel.includes('step1')) {
      console.log(`SEL: ${sel.replace(/\s+/g, ' ')}`);
      console.log(`BODY: ${body.replace(/\s+/g, ' ')}\n`);
    }
  }
});


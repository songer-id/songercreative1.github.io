const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');

// Let's find all rules with font-weight or bold or semibold in admin.css
const regex = /([^{}]+)\{([^}]+)\}/g;
let match;
while ((match = regex.exec(css)) !== null) {
  const sel = match[1].trim();
  const body = match[2].trim();
  if (body.includes('font-weight') || body.includes('bold') || body.includes('600') || body.includes('700') || body.includes('500')) {
    // print selector and font-weight
    const fw = body.match(/font-weight\s*:\s*([^;!]+)(!important)?/);
    if (fw) {
      console.log(`${sel.replace(/\s+/g, ' ')} -> ${fw[0]}`);
    }
  }
}


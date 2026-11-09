const fs = require('fs');
const path = require('path');

function searchFiles(dir, filter, pattern) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'brain') {
        searchFiles(full, filter, pattern);
      }
    } else if (filter(entry.name)) {
      const content = fs.readFileSync(full, 'utf8');
      if (pattern.test(content)) {
        console.log(`Matched in: ${full}`);
        const lines = content.split('\n');
        lines.forEach((l, i) => {
          if (pattern.test(l)) {
            console.log(`  L${i+1}: ${l.trim()}`);
          }
        });
      }
    }
  }
}

console.log('Searching for theme definitions and body colors...');
searchFiles('.', (name) => name.endsWith('.js') || name.endsWith('.css') || name.endsWith('.html'), /--color-body|theme.*body|body_color|bg_color|background_color|getTheme|themeSettings|getPrimaryThemeColor/i);


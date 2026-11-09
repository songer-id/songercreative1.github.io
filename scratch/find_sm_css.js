const fs = require('fs');
const files = ['css/admin.css', 'admin.html'];
for (const f of files) {
  if (fs.existsSync(f)) {
    const content = fs.readFileSync(f, 'utf8');
    content.split('\n').forEach((l, i) => {
      if (l.includes('sm:inline') || l.includes('sm:hidden') || l.includes('hidden sm:')) {
        console.log(f, i+1, l.trim());
      }
    });
  }
}

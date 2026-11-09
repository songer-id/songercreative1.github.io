const fs = require('fs');
const files = ['js/db.js', 'js/buyer-store.js'];
for (const f of files) {
  if (fs.existsSync(f)) {
    const content = fs.readFileSync(f, 'utf8');
    content.split('\n').forEach((l, i) => {
      if (l.includes('DEFAULT_CARD_VARIANTS_CONFIG')) console.log(f, i+1, l);
    });
  }
}


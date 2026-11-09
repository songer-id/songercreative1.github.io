const fs = require('fs');
if (fs.existsSync('tests')) {
  fs.readdirSync('tests').forEach(f => {
    const c = fs.readFileSync('tests/' + f, 'utf8');
    if (c.includes('product-form-top-bar') || c.includes('btn-back-to-list')) {
      console.log('Found in tests/' + f);
    }
  });
}


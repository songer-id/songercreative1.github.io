const fs = require('fs');
const files = fs.readdirSync('scratch');
files.forEach(f => {
  if (f.startsWith('test_') && f.endsWith('.js')) {
    const c = fs.readFileSync('scratch/' + f, 'utf8');
    if (c.includes('product-form-top-bar') || c.includes('btn-back-to-list')) {
      console.log('Test file references top-bar:', f);
    }
  }
});


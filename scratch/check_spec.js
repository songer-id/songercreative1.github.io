const fs = require('fs');
if (fs.existsSync('tests/product-crud.spec.js')) {
  const c = fs.readFileSync('tests/product-crud.spec.js', 'utf8');
  console.log('Includes product-form-top-bar:', c.includes('product-form-top-bar'));
  console.log('Includes btn-back-to-list:', c.includes('btn-back-to-list'));
}


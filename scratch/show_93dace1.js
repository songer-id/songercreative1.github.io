const { execSync } = require('child_process');
const diff = execSync('git show 93dace1 -- js/product-form.js', { encoding: 'utf8' });
console.log(diff);

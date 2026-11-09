const { execSync } = require('child_process');
const diff = execSync('git log -n 1 -p 078ab5e -- js/product-form.js', { encoding: 'utf8' });
const lines = diff.split('\n');
lines.forEach((l, i) => {
  if (l.includes('simDiscountDesk') || l.includes('outerWrapDesk')) {
    console.log(lines.slice(Math.max(0, i-5), i+15).join('\n'));
  }
});

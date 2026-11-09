const { execSync } = require('child_process');
const diff = execSync('git log -S "simDiscountDesk" -p -n 2', { encoding: 'utf8' });
console.log(diff.slice(0, 3000));

const { execSync } = require('child_process');
const log = execSync('git log -S "simDiscountDesk.classList.add" --oneline', { encoding: 'utf8' });
console.log(log);

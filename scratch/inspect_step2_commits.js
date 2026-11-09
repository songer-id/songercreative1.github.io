const { execSync } = require('child_process');
const log = execSync('git log -n 10 --oneline', { encoding: 'utf8' });
console.log('Recent commits:\n', log);

const commits = log.trim().split('\n').map(l => l.split(' ')[0]);
for (const c of commits) {
  try {
    const file = execSync(`git show ${c}:js/product-form.js`, { encoding: 'utf8', maxBuffer: 10*1024*1024 });
    const match = file.match(/if\s*\(currentStep === 1\)\s*\{[\s\S]*?\}\s*else\s*\{([\s\S]*?)\}/);
    if (match) {
      console.log(`Commit ${c} else block:\n`, match[0].slice(0, 400));
    }
  } catch (e) {
    console.log(`Commit ${c}: error`, e.message);
  }
}

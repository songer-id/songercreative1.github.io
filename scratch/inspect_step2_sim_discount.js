const { execSync } = require('child_process');
const commits = ['bb3f9f2', '078ab5e', '0bfbb4f', 'feb586d'];
for (const c of commits) {
  try {
    const diff = execSync(`git grep -n "cfg-simulate-countdown-preview" ${c} -- js/product-form.js`, { encoding: 'utf8' });
    console.log(`Commit ${c}:`);
    console.log(diff);
  } catch (e) {
    console.log(`Commit ${c} error`);
  }
}

const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');

const regexes = [
  /mobile-preview-body/g,
  /mobile-preview-sheet/g,
  /mobile-card-preview/g,
  /preview-card-outer-wrapper-mob/g
];

regexes.forEach(re => {
  let match;
  console.log(`\n=== Testing ${re} ===`);
  while ((match = re.exec(css)) !== null) {
    console.log(css.slice(Math.max(0, match.index - 100), Math.min(css.length, match.index + 200)));
    console.log('---');
  }
});


const fs = require('fs');
const css = fs.readFileSync('css/admin.css', 'utf8');

const lines = css.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('step-pane-1') || l.includes('step2-cards-container')) {
    console.log((idx + 1) + ': ' + l.trim());
  }
});


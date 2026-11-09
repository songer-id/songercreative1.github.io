const fs = require('fs');

if (fs.existsSync('js/db.js')) {
  const db = fs.readFileSync('js/db.js', 'utf8');
  const sIdx = db.indexOf('body_bg_color');
  if (sIdx !== -1) {
    console.log(db.slice(sIdx - 100, sIdx + 200));
  } else {
    console.log('body_bg_color not found in db.js');
  }
}


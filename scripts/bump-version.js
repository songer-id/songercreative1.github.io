/**
 * Asset Cache-Busting & Versioning Tool
 * Automatically updates query parameter `?v=TIMESTAMP` across HTML files
 * to ensure clients always fetch fresh JavaScript and CSS assets.
 */
const fs = require('fs');
const path = require('path');

function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const min = pad(now.getMinutes());
  return `${yyyy}${mm}${dd}${hh}${min}`;
}

function bumpAssets(targetVersion) {
  const v = targetVersion || getTimestamp();
  const files = ['admin.html', 'product.html', 'index.html'];
  const root = path.resolve(__dirname, '..');

  files.forEach(file => {
    const filePath = path.join(root, file);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    // Replace ?v=... in script src and link href
    const updated = content.replace(/(\?v=)[0-9a-zA-Z._-]+/g, `$1${v}`);
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`[Cache-Buster] Updated assets in ${file} to ?v=${v}`);
  });
}

if (require.main === module) {
  const customV = process.argv[2];
  bumpAssets(customV);
}

module.exports = { bumpAssets, getTimestamp };


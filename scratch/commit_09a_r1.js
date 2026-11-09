/**
 * commit_09a_r1.js
 */
const { execSync } = require('child_process');

const d = new Date();
const wibOffset = 7 * 60;
const localOffset = d.getTimezoneOffset();
const wibDate = new Date(d.getTime() + (wibOffset + localOffset) * 60000);

const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const dayName = days[wibDate.getDay()];
const date = String(wibDate.getDate()).padStart(2, '0');
const monthName = months[wibDate.getMonth()];
const year = wibDate.getFullYear();
const hours = String(wibDate.getHours()).padStart(2, '0');
const mins = String(wibDate.getMinutes()).padStart(2, '0');

const msg = `Update [${dayName}, ${date} ${monthName} ${year} ${hours}:${mins} WIB]: Perbaikan Visibilitas dan Nilai Terjual pada Pratinjau Kartu Produk`;

console.log('Commit message: ' + msg);

// Explicitly stage only docs/PRD_MASTER.md and js/product-form.js
console.log('Staging files...');
execSync('git add docs/PRD_MASTER.md js/product-form.js', { stdio: 'inherit' });

console.log('Checking staged status...');
execSync('git status --short', { stdio: 'inherit' });

console.log('Running git diff --cached --stat...');
execSync('git diff --cached --stat', { stdio: 'inherit' });

console.log('Committing...');
execSync(`git commit -m "${msg}"`, { stdio: 'inherit' });

console.log('Commit successful!');


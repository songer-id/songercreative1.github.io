const { execSync } = require('child_process');

const now = new Date();
const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
const wib = new Date(utc + (3600000 * 7));

const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const dayName = days[wib.getDay()];
const date = String(wib.getDate()).padStart(2, '0');
const monthName = months[wib.getMonth()];
const year = wib.getFullYear();
const hours = String(wib.getHours()).padStart(2, '0');
const minutes = String(wib.getMinutes()).padStart(2, '0');

const commitMsg = `Update [${dayName}, ${date} ${monthName} ${year} ${hours}:${minutes} WIB]: Pengaturan Bingkai Kartu Produk`;

console.log('Staging files...');
execSync('git add docs/PRD_MASTER.md js/product-form.js js/db.js js/buyer-store.js', { stdio: 'inherit' });

console.log('Committing with message:', commitMsg);
execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });

console.log('Commit completed successfully!');


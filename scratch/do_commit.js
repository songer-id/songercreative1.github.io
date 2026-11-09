const { execSync } = require('child_process');

const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const now = new Date();
const dayName = days[now.getDay()];
const dateNum = String(now.getDate()).padStart(2, '0');
const monthName = months[now.getMonth()];
const year = now.getFullYear();
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');

const commitMsg = `Update [${dayName}, ${dateNum} ${monthName} ${year} ${hours}:${minutes} WIB]: Penyempurnaan Layout Form Produk dan Pratinjau`;
console.log('Commit message:', commitMsg);

const output = execSync(`git commit -m "${commitMsg}"`, { encoding: 'utf8' });
console.log(output);


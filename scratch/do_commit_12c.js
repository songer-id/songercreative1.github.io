const { execSync } = require('child_process');

const d = new Date();
const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
const wibDate = new Date(utc + (3600000 * 7));

const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const dayName = days[wibDate.getDay()];
const dayNum = String(wibDate.getDate()).padStart(2, '0');
const monthName = months[wibDate.getMonth()];
const year = wibDate.getFullYear();
const hours = String(wibDate.getHours()).padStart(2, '0');
const mins = String(wibDate.getMinutes()).padStart(2, '0');

const msg = `Update ${dayName}, ${dayNum} ${monthName} ${year} ${hours}:${mins} WIB: Penyelarasan Input Pilih dan Contoh Footer Pratinjau`;
console.log('Committing with message:', msg);
execSync(`git commit -m "${msg}"`, { stdio: 'inherit' });


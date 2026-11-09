const d = new Date();
const wib = new Date(d.getTime() + (7 * 60 + d.getTimezoneOffset()) * 60000);
const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const dayName = days[wib.getDay()];
const date = String(wib.getDate()).padStart(2, '0');
const monthName = months[wib.getMonth()];
const year = wib.getFullYear();
const hours = String(wib.getHours()).padStart(2, '0');
const minutes = String(wib.getMinutes()).padStart(2, '0');
const msg = `Update [${dayName}, ${date} ${monthName} ${year} ${hours}:${minutes} WIB]: Pemulihan Pratinjau Step 2 dan Informasi Terjual`;
console.log(msg);
const fs = require('fs');
fs.writeFileSync('scratch/commit_msg.txt', msg, 'utf8');


const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const t1 = '// 3. Hitung diskon promo harian / bulanan & simulasi';
const t2 = '<label for="cfg-border-width" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Ketebalan Garis Tepi</label>';
const t3 = '<label for="cfg-border-width-mob" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Ketebalan Garis Tepi</label>';
const t4 = '<label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Judul</label>';
const t5 = '<label class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider mb-0.5">Warna Harga</label>';
const t6 = 'data-style="bg">Latar</button>';
const t7 = 'data-style="border">Garis Tepi</button>';

console.log('t1:', pf.includes(t1));
console.log('t2:', pf.includes(t2));
console.log('t3:', pf.includes(t3));
console.log('t4 count:', pf.split(t4).length - 1);
console.log('t5 count:', pf.split(t5).length - 1);
console.log('t6 count:', pf.split(t6).length - 1);
console.log('t7 count:', pf.split(t7).length - 1);


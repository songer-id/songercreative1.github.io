const fs = require('fs');

['scratch/test_detail_card_footer_11.js', 'scratch/test_card_mobile_typography_09c_r7.js'].forEach(file => {
  if (fs.existsSync(file)) {
    const c = fs.readFileSync(file, 'utf8');
    console.log(`=== ${file} ===`);
    // Search for Teks Footer, Latar Footer, Warna Teks, or specific label assertions
    const lines = c.split('\n');
    lines.forEach((l, i) => {
      if (l.includes('Footer') || l.includes('card-tool-label') || l.includes('placeholder') || l.includes('font-normal')) {
        console.log(`L${i+1}: ${l.trim()}`);
      }
    });
  }
});


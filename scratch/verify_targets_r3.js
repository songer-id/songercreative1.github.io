const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// Verify exact target lines for editing
const t1 = `    // Jika card_variant masih kosong (belum dipilih oleh seller):
    if (!variant) {`;

const t2 = `    if (currentStep === 1) {
      if (outerWrapDesk) outerWrapDesk.classList.remove('hidden');
      if (outerWrapMob) outerWrapMob.classList.remove('hidden');
      if (simDiscountDesk) simDiscountDesk.classList.remove('hidden');
      if (simDiscountMob) simDiscountMob.classList.remove('hidden');

      if (previewStep1Tab === 'design') {
        if (customSectionDesk) customSectionDesk.classList.remove('hidden');
        if (customSectionMob) customSectionMob.classList.remove('hidden');
      } else {
        if (customSectionDesk) customSectionDesk.classList.add('hidden');
        if (customSectionMob) customSectionMob.classList.add('hidden');
      }
    } else {
      if (outerWrapDesk) outerWrapDesk.classList.add('hidden');
      if (outerWrapMob) outerWrapMob.classList.add('hidden');
      if (simDiscountDesk) simDiscountDesk.classList.add('hidden');
      if (simDiscountMob) simDiscountMob.classList.add('hidden');
      if (customSectionDesk) customSectionDesk.classList.add('hidden');
      if (customSectionMob) customSectionMob.classList.add('hidden');
    }`;

console.log('Target 1 exists?', pf.includes(t1));
console.log('Target 2 exists?', pf.includes(t2));

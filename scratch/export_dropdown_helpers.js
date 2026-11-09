const fs = require('fs');
let code = fs.readFileSync('js/product-form.js', 'utf8');
code = code.replace(/\r\n/g, '\n');

const target1 = `    setDiscountBadgePosition,
    getDiscountBadgePositionClass,`;

const repl1 = `    setDiscountBadgePosition,
    getDiscountBadgePositionClass,
    toggleDiscountBadgePosDropdown,
    closeAllDiscountBadgePosDropdowns,`;

if (!code.includes(target1)) throw new Error('target1 not found');
code = code.replace(target1, repl1);

const target2 = `window.setDiscountBadgePosition = ProductForm.setDiscountBadgePosition;
window.getDiscountBadgePositionClass = ProductForm.getDiscountBadgePositionClass;`;

const repl2 = `window.setDiscountBadgePosition = ProductForm.setDiscountBadgePosition;
window.getDiscountBadgePositionClass = ProductForm.getDiscountBadgePositionClass;
window.toggleDiscountBadgePosDropdown = ProductForm.toggleDiscountBadgePosDropdown;
window.closeAllDiscountBadgePosDropdowns = ProductForm.closeAllDiscountBadgePosDropdowns;`;

if (!code.includes(target2)) throw new Error('target2 not found');
code = code.replace(target2, repl2);

fs.writeFileSync('js/product-form.js', code, 'utf8');
console.log('Successfully exported toggleDiscountBadgePosDropdown and closeAllDiscountBadgePosDropdowns');


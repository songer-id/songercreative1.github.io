const fs = require('fs');
let code = fs.readFileSync('scratch/test_card_promo_09c_r6.js', 'utf8');

const target = `global.getComputedStyle = () => ({
  getPropertyValue: () => '#059669'
});`;

const repl = `global.getComputedStyle = () => ({
  getPropertyValue: () => '#059669'
});
global.requestAnimationFrame = (fn) => { if (typeof fn === 'function') fn(); };
global.window.requestAnimationFrame = global.requestAnimationFrame;`;

code = code.replace(target, repl);
fs.writeFileSync('scratch/test_card_promo_09c_r6.js', code, 'utf8');
console.log('Added requestAnimationFrame mock');


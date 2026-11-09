const fs = require('fs');
let code = fs.readFileSync('scratch/test_card_promo_09c_r6.js', 'utf8');

const target = `  focus() { this._focused = true; }`;
const repl = `  closest(sel) {
    let curr = this;
    while (curr) {
      if (sel.startsWith('.') && curr.classList.contains(sel.slice(1))) return curr;
      if (sel.startsWith('#') && curr.id === sel.slice(1)) return curr;
      if (curr.tagName && curr.tagName.toLowerCase() === sel.toLowerCase()) return curr;
      curr = curr.parentElement;
    }
    return new MockElement('closest-' + sel);
  }
  focus() { this._focused = true; }`;

code = code.replace(target, repl);
fs.writeFileSync('scratch/test_card_promo_09c_r6.js', code, 'utf8');
console.log('Added closest method to MockElement');


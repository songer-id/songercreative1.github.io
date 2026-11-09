const fs = require('fs');
let code = fs.readFileSync('js/product-form.js', 'utf8');
code = code.replace(
  'const showStrikeHint = Boolean(cfg.show_strike && !effHasDiscount);',
  `const showStrikeHint = Boolean(cfg.show_strike && !effHasDiscount); console.log("DEBUG inside updateProductCardLivePreview:", { show_strike: cfg.show_strike, effHasDiscount, showStrikeHint, strikeHintDesk: Boolean(strikeHintDesk), strikeHintMob: Boolean(strikeHintMob) });`
);
fs.writeFileSync('js/product-form.js', code, 'utf8');
console.log('Added log');


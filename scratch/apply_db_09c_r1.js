const fs = require('fs');

let db = fs.readFileSync('js/db.js', 'utf8');
const isCrlf = db.includes('\r\n');
const eol = isCrlf ? '\r\n' : '\n';

function replaceExact(name, target, replacement) {
  const normTarget = target.replace(/\r\n/g, '\n').replace(/\n/g, eol);
  const normReplacement = replacement.replace(/\r\n/g, '\n').replace(/\n/g, eol);
  if (!db.includes(normTarget)) {
    console.error(`Target not found for: ${name}`);
    process.exit(1);
  }
  db = db.replace(normTarget, normReplacement);
  console.log(`Replaced: ${name}`);
}

const targetA = `      show_strikethrough_price: true,
      show_ticket_icon: true,
      show_discount_badge: true,
      discount_badge_radius: '8px',`;

const replA = `      show_strikethrough_price: true,
      strike_price_color: '#94a3b8',
      show_ticket_icon: true,
      show_discount_badge: true,
      discount_badge_radius: '8px',
      discount_badge_position: 'top-right',`;

replaceExact('db-variant_a', targetA, replA);

const targetB = `      show_strikethrough_price: true,
      show_ticket_icon: true,
      show_discount_badge: true,
      discount_badge_radius: '8px',`;

const replB = `      show_strikethrough_price: true,
      strike_price_color: '#94a3b8',
      show_ticket_icon: true,
      show_discount_badge: true,
      discount_badge_radius: '8px',
      discount_badge_position: 'top-right',`;

replaceExact('db-variant_b', targetB, replB);

const targetC = `      show_strikethrough_price: true,
      show_ticket_icon: false,
      show_discount_badge: true,
      discount_badge_radius: '8px',`;

const replC = `      show_strikethrough_price: true,
      strike_price_color: '#94a3b8',
      show_ticket_icon: false,
      show_discount_badge: true,
      discount_badge_radius: '8px',
      discount_badge_position: 'top-right',`;

replaceExact('db-variant_c', targetC, replC);

fs.writeFileSync('js/db.js', db, 'utf8');
console.log('js/db.js updated successfully for Task 09C-R1');


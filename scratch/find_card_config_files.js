const fs = require('fs');

const files = fs.readdirSync('js').filter(f => f.endsWith('.js'));
for (const f of files) {
  const content = fs.readFileSync('js/' + f, 'utf8');
  if (content.includes('saveCardModelPreset')) {
    console.log(`saveCardModelPreset found in js/${f}`);
  }
  if (content.includes('card_config')) {
    console.log(`card_config found in js/${f}`);
  }
}


const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const saveDraft = pf.match(/function saveDraftToStorage\(\) \{([\s\S]*?)\n  \}/);
if (saveDraft) {
  console.log('saveDraft lines:');
  saveDraft[1].split('\n').filter(l => l.includes('card_') || l.includes('sales')).forEach(l => console.log(l));
}

const loadDraft = pf.match(/function loadDraftFromStorage\(\) \{([\s\S]*?)\n  \}/);
if (loadDraft) {
  console.log('loadDraft lines:');
  loadDraft[1].split('\n').filter(l => l.includes('card_') || l.includes('sales')).forEach(l => console.log(l));
}


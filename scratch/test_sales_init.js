const fs = require('fs');

// Create mock browser DOM
const { JSDOM } = require('jsdom');
const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="form-container"></div></body></html>`, {
  url: 'http://localhost'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Event = dom.window.Event;
global.CustomEvent = dom.window.CustomEvent;

// Mock DB
global.DB = {
  getSettings: () => ({
    card_variants_config: {
      variant_a: { show_rating: true, show_sales_count: true },
      variant_b: { show_rating: true, show_sales_count: true },
      variant_c: { show_rating: true, show_sales_count: true }
    }
  }),
  DEFAULT_CARD_VARIANTS_CONFIG: {
    variant_a: { show_rating: true, show_sales_count: true },
    variant_b: { show_rating: true, show_sales_count: true },
    variant_c: { show_rating: true, show_sales_count: true }
  },
  getCategories: () => [{ id: 'cat1', name: 'Kategori 1' }],
  getSubCategories: () => [],
  saveSettings: () => {},
  getCustomLabelsHistory: () => [],
  getFooterTextsHistory: () => [],
  generateUUID: () => 'uuid-1'
};

// Load product-form.js
const pfCode = fs.readFileSync('js/product-form.js', 'utf8');
eval(pfCode);

console.log('Testing ProductForm.init()...');
ProductForm.init();

const salesDesk = document.getElementById('cfg-show-sales');
const salesMob = document.getElementById('cfg-show-sales-mob');

console.log('salesDesk exists:', Boolean(salesDesk));
console.log('salesDesk.checked:', salesDesk ? salesDesk.checked : null);
console.log('salesMob exists:', Boolean(salesMob));
console.log('salesMob.checked:', salesMob ? salesMob.checked : null);

// Check rendered live preview HTML
const previewBox = document.getElementById('card-live-preview-box');
console.log('previewBox innerHTML has "terjual":', previewBox ? previewBox.innerHTML.includes('terjual') : false);
if (previewBox) {
  console.log('previewBox snippet:\n', previewBox.innerHTML.slice(0, 500));
}

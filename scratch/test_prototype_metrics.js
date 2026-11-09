const assert = require('assert');

// Test metadata structure
const defaultMetrics = {
  rating: { source: 'auto', manual_value: null },
  sales: { source: 'auto', manual_value: null }
};

// Test independent selection
const state = {
  admin_card_preview_metrics: JSON.parse(JSON.stringify(defaultMetrics))
};

state.admin_card_preview_metrics.rating.source = 'manual';
state.admin_card_preview_metrics.rating.manual_value = 4.7;

assert.strictEqual(state.admin_card_preview_metrics.rating.source, 'manual');
assert.strictEqual(state.admin_card_preview_metrics.rating.manual_value, 4.7);
assert.strictEqual(state.admin_card_preview_metrics.sales.source, 'auto');
assert.strictEqual(state.admin_card_preview_metrics.sales.manual_value, null);

console.log('Independent selection test passed!');


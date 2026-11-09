const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// Target 3: loadProductForEdit primaryState
const t3 = `      card_variant: prod.card_variant || 'A',
      card_variant_override: prod.card_variant_override !== undefined ? prod.card_variant_override : true,`;

// Target 4: renderForm end
const t4 = `    if (typeof bindCleanDatalistPopovers === 'function') {
      bindCleanDatalistPopovers(document.getElementById('step-pane-1') || document);
    }
    updateProductCardLivePreview();`;

// Target 5: getChk
const t5 = `    const getChk = (id1, id2) => {
      const el1 = document.getElementById(id1);
      if (el1) return el1.checked !== false;
      const el2 = document.getElementById(id2);
      if (el2) return el2.checked !== false;
      return true;
    };`;

// Target 6: showSalesChecked & showRatingChecked
const t6 = `    const showRatingChecked = document.getElementById('cfg-show-rating')
      ? document.getElementById('cfg-show-rating').checked
      : (document.getElementById('cfg-show-rating-mob')
        ? document.getElementById('cfg-show-rating-mob').checked
        : (primaryState.card_config ? primaryState.card_config.show_rating !== false : true));

    const showSalesChecked = document.getElementById('cfg-show-sales')
      ? document.getElementById('cfg-show-sales').checked
      : (document.getElementById('cfg-show-sales-mob')
        ? document.getElementById('cfg-show-sales-mob').checked
        : (primaryState.card_config ? (primaryState.card_config.show_sales !== false && primaryState.card_config.show_sales_count !== false) : true));`;

console.log('Target 3 exists?', pf.includes(t3));
console.log('Target 4 exists?', pf.includes(t4));
console.log('Target 5 exists?', pf.includes(t5));
console.log('Target 6 exists?', pf.includes(t6));

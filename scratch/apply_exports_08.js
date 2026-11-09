const fs = require('fs');

let content = fs.readFileSync('js/product-form.js', 'utf8');

const target = `    loadCardConfigInputs,
    getCardDesignSnapshot: () => cardDesignSnapshot
  };
})();

window.ProductForm = ProductForm;`;

const replacement = `    loadCardConfigInputs,
    getCardDesignSnapshot: () => cardDesignSnapshot,
    getCardAccordionState: () => cardAccordionState,
    toggleCardAccordion,
    syncCardAccordionDOM,
    syncEyeToggleIcons,
    handleApplyDefaultCardDesign
  };
})();

window.ProductForm = ProductForm;
window.handleApplyDefaultCardDesign = ProductForm.handleApplyDefaultCardDesign;
window.toggleCardAccordion = ProductForm.toggleCardAccordion;
window.syncCardAccordionDOM = ProductForm.syncCardAccordionDOM;
window.syncEyeToggleIcons = ProductForm.syncEyeToggleIcons;`;

if (!content.includes(target)) {
  throw new Error('Target for exports not found');
}

content = content.replace(target, replacement);
fs.writeFileSync('js/product-form.js', content, 'utf8');
console.log('Exports added successfully!');


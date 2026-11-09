const fs = require('fs');

// Simulate the DOM and running renderForm() or bindCleanDatalistPopovers()
const pf = fs.readFileSync('js/product-form.js', 'utf8');

// Check: when renderForm() runs, what does it execute?
// Look at line 4066:
// bindCleanDatalistPopovers(document.getElementById('step-pane-1') || document);
console.log('Checking what scope contains:');
console.log('step-pane-1 contains wizard-step-pane-1.');
console.log('Does step-pane-1 contain desktop-preview-sidebar?');
console.log('NO! In line 2719, desktop-preview-sidebar is OUTSIDE step-pane-1!');
console.log('Does step-pane-1 contain mobile-card-tools-drawer?');
console.log('NO! mobile-card-tools-drawer is OUTSIDE step-pane-1!');


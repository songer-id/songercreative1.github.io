const fs = require('fs');

// Check all parents in admin.html and product-form.js
// 1. html
// 2. body (class="bg-slate-100 text-slate-900 font-sans antialiased text-sm")
// 3. div (class="flex h-screen w-screen overflow-hidden bg-[#f8fafc]")
// 4. div (class="flex-1 flex flex-col h-screen min-w-0 overflow-hidden")
// 5. main#admin-main-viewport (class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f8fafc]")
// 6. section#view-product-form (class="hidden")
// 7. div#form-container
// 8. div#product-form-wrapper (class="w-full max-w-none space-y-0 pb-8 sm:pb-12")
// 9. div#mobile-preview-backdrop

console.log('Inspecting all CSS rules affecting these ancestors...');
const css = fs.readFileSync('css/admin.css', 'utf8');

const ancestors = [
  'body',
  'flex h-screen',
  'admin-main-viewport',
  'view-product-form',
  'form-container',
  'product-form-wrapper',
  'mobile-preview-backdrop',
  'mobile-preview-sheet'
];

// Let's check for any transform or will-change or contain in css:
const lines = css.split('\n');
lines.forEach((l, i) => {
  if (l.includes('will-change') || l.includes('contain:') || l.includes('isolation:')) {
    console.log(`Line ${i + 1}: ${l.trim()}`);
  }
});


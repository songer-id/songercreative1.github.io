const fs = require('fs');

const html = fs.readFileSync('admin.html', 'utf8');
const css = fs.readFileSync('css/admin.css', 'utf8');

console.log('--- Ancestors in admin.html ---');
// Let's trace from body down to #form-container:
// body
//   div (flex h-screen overflow-hidden)
//     aside (admin-main-sidebar)
//     div.flex-1.flex.flex-col.h-screen.min-w-0.overflow-hidden
//       header#admin-main-topbar (h-16 shrink-0 z-40)
//       main#admin-main-viewport (flex-1 overflow-y-auto)
//         section#view-product-form
//           div#form-container
//             div#product-form-wrapper
//               div#mobile-preview-backdrop
//               div#mobile-preview-sheet

console.log('Check if header has z-40:', html.includes('id="admin-main-topbar"'));
console.log('Sidebar mobile backdrop in admin.html:');
const sbBackdropIdx = html.indexOf('sidebar-mobile-backdrop');
console.log(html.slice(sbBackdropIdx - 100, sbBackdropIdx + 200));


const fs = require('fs');

console.log('--- Applying TASK SC-ADMIN-CARD-METRIC-SOURCES-10 ---');

// ==========================================
// 1. UPDATE js/db.js
// ==========================================
let dbCode = fs.readFileSync('js/db.js', 'utf8').replace(/\r\n/g, '\n');

// 1.1 In DB.createProduct: add admin_card_preview_metrics
const createTarget = `sales_count: parseInt(productData.sales_count) || 0,`;
const createRepl = `sales_count: parseInt(productData.sales_count) || 0,
        admin_card_preview_metrics: (productData.admin_card_preview_metrics && typeof productData.admin_card_preview_metrics === 'object') ? JSON.parse(JSON.stringify(productData.admin_card_preview_metrics)) : null,`;

if (!dbCode.includes('admin_card_preview_metrics') && dbCode.includes(createTarget)) {
  dbCode = dbCode.replace(createTarget, createRepl);
  console.log('✓ Added admin_card_preview_metrics to DB.createProduct');
}

// 1.2 In DB.updateProduct: add admin_card_preview_metrics & preserve real stats
const updateTarget = `sales_count: productData.sales_count !== undefined ? parseInt(productData.sales_count) : products[index].sales_count,`;
const updateRepl = `sales_count: (products[index] && products[index].sales_count !== undefined) ? products[index].sales_count : (parseInt(productData.sales_count) || 0),
        admin_card_preview_metrics: productData.admin_card_preview_metrics !== undefined ? ((productData.admin_card_preview_metrics && typeof productData.admin_card_preview_metrics === 'object') ? JSON.parse(JSON.stringify(productData.admin_card_preview_metrics)) : null) : (products[index].admin_card_preview_metrics || null),`;

if (dbCode.includes(updateTarget)) {
  dbCode = dbCode.replace(updateTarget, updateRepl);
  console.log('✓ Added admin_card_preview_metrics & preserved stats in DB.updateProduct');
}

fs.writeFileSync('js/db.js', dbCode, 'utf8');

console.log('db.js updated successfully!');


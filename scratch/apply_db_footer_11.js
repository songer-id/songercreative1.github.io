const fs = require('fs');

let db = fs.readFileSync('js/db.js', 'utf8');

// 1. Default config
db = db.replace("footer_text: 'Proses Hanya Dalam 1Jam',", "footer_text: '',");
db = db.replace("footer_2_text: 'Variasi Paket Tersedia/tidak tersedia',", "footer_2_text: '',");

// 2. addProduct
const targetAddF1 = `custom_footer_1: productData.custom_footer_1 || {
          text: productData.card_footer_text ? productData.card_footer_text.trim() : 'Proses Hanya Dalam 1Jam',
          icon: productData.footer_badge_icon ? productData.footer_badge_icon.trim() : 'truck',
          bg_color: productData.footer_bg_color || null,
          text_color: productData.footer_text_color || null
        },`;

const replAddF1 = `custom_footer_1: productData.custom_footer_1 || {
          text: productData.card_footer_text ? productData.card_footer_text.trim() : '',
          icon: productData.footer_badge_icon ? productData.footer_badge_icon.trim() : 'truck',
          bg_color: productData.footer_bg_color || null,
          text_color: productData.footer_text_color || null
        },`;

if (!db.includes(targetAddF1)) throw new Error('targetAddF1 not found');
db = db.replace(targetAddF1, replAddF1);

const targetAddF2 = `custom_footer_2: productData.custom_footer_2 || {
          text: productData.card_footer_2_text ? productData.card_footer_2_text.trim() : 'Variasi Paket Tersedia/tidak tersedia',
          icon: productData.footer_2_badge_icon ? productData.footer_2_badge_icon.trim() : 'minus',
          bg_color: productData.footer_2_bg_color || null,
          text_color: productData.footer_2_text_color || null
        },`;

const replAddF2 = `custom_footer_2: productData.custom_footer_2 || {
          text: productData.card_footer_2_text ? productData.card_footer_2_text.trim() : '',
          icon: productData.footer_2_badge_icon ? productData.footer_2_badge_icon.trim() : 'minus',
          bg_color: productData.footer_2_bg_color || null,
          text_color: productData.footer_2_text_color || null
        },`;

if (!db.includes(targetAddF2)) throw new Error('targetAddF2 not found');
db = db.replace(targetAddF2, replAddF2);

const targetAddTexts = `card_footer_text: productData.card_footer_text ? productData.card_footer_text.trim() : 'Proses Hanya Dalam 1Jam',
        footer_badge_icon: productData.footer_badge_icon ? productData.footer_badge_icon.trim() : 'truck',
        footer_bg_color: productData.footer_bg_color || null,
        footer_text_color: productData.footer_text_color || null,
        card_footer_2_text: productData.card_footer_2_text ? productData.card_footer_2_text.trim() : 'Variasi Paket Tersedia/tidak tersedia',`;

const replAddTexts = `card_footer_text: productData.card_footer_text ? productData.card_footer_text.trim() : '',
        footer_badge_icon: productData.footer_badge_icon ? productData.footer_badge_icon.trim() : 'truck',
        footer_bg_color: productData.footer_bg_color || null,
        footer_text_color: productData.footer_text_color || null,
        card_footer_2_text: productData.card_footer_2_text ? productData.card_footer_2_text.trim() : '',`;

if (!db.includes(targetAddTexts)) throw new Error('targetAddTexts not found');
db = db.replace(targetAddTexts, replAddTexts);

// 3. updateProduct
const targetUpdF1 = `custom_footer_1: productData.custom_footer_1 !== undefined ? productData.custom_footer_1 : (products[index].custom_footer_1 || {
          text: products[index].card_footer_text || 'Proses Hanya Dalam 1Jam',
          icon: products[index].footer_badge_icon || 'truck',
          bg_color: products[index].footer_bg_color || null,
          text_color: products[index].footer_text_color || null
        }),`;

const replUpdF1 = `custom_footer_1: productData.custom_footer_1 !== undefined ? productData.custom_footer_1 : (products[index].custom_footer_1 || {
          text: products[index].card_footer_text || '',
          icon: products[index].footer_badge_icon || 'truck',
          bg_color: products[index].footer_bg_color || null,
          text_color: products[index].footer_text_color || null
        }),`;

if (!db.includes(targetUpdF1)) throw new Error('targetUpdF1 not found');
db = db.replace(targetUpdF1, replUpdF1);

const targetUpdF2 = `custom_footer_2: productData.custom_footer_2 !== undefined ? productData.custom_footer_2 : (products[index].custom_footer_2 || {
          text: products[index].card_footer_2_text || 'Variasi Paket Tersedia/tidak tersedia',
          icon: products[index].footer_2_badge_icon || 'minus',
          bg_color: products[index].footer_2_bg_color || null,
          text_color: products[index].footer_2_text_color || null
        }),`;

const replUpdF2 = `custom_footer_2: productData.custom_footer_2 !== undefined ? productData.custom_footer_2 : (products[index].custom_footer_2 || {
          text: products[index].card_footer_2_text || '',
          icon: products[index].footer_2_badge_icon || 'minus',
          bg_color: products[index].footer_2_bg_color || null,
          text_color: products[index].footer_2_text_color || null
        }),`;

if (!db.includes(targetUpdF2)) throw new Error('targetUpdF2 not found');
db = db.replace(targetUpdF2, replUpdF2);

const targetUpdTexts = `card_footer_text: productData.card_footer_text !== undefined ? productData.card_footer_text.trim() : (products[index].card_footer_text || 'Proses Hanya Dalam 1Jam'),
        footer_badge_icon: productData.footer_badge_icon !== undefined ? productData.footer_badge_icon.trim() : (products[index].footer_badge_icon || 'truck'),
        footer_bg_color: productData.footer_bg_color !== undefined ? productData.footer_bg_color : (products[index].footer_bg_color || null),
        footer_text_color: productData.footer_text_color !== undefined ? productData.footer_text_color : (products[index].footer_text_color || null),
        card_footer_2_text: productData.card_footer_2_text !== undefined ? productData.card_footer_2_text.trim() : (products[index].card_footer_2_text || 'Variasi Paket Tersedia/tidak tersedia'),`;

const replUpdTexts = `card_footer_text: productData.card_footer_text !== undefined ? productData.card_footer_text.trim() : (products[index].card_footer_text || ''),
        footer_badge_icon: productData.footer_badge_icon !== undefined ? productData.footer_badge_icon.trim() : (products[index].footer_badge_icon || 'truck'),
        footer_bg_color: productData.footer_bg_color !== undefined ? productData.footer_bg_color : (products[index].footer_bg_color || null),
        footer_text_color: productData.footer_text_color !== undefined ? productData.footer_text_color : (products[index].footer_text_color || null),
        card_footer_2_text: productData.card_footer_2_text !== undefined ? productData.card_footer_2_text.trim() : (products[index].card_footer_2_text || ''),`;

if (!db.includes(targetUpdTexts)) throw new Error('targetUpdTexts not found');
db = db.replace(targetUpdTexts, replUpdTexts);

fs.writeFileSync('js/db.js', db, 'utf8');
console.log('Successfully updated js/db.js');


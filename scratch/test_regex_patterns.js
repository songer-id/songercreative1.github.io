const fs = require('fs');

let pf = fs.readFileSync('js/product-form.js', 'utf8');

const regexGetPrimary = /(function getPrimaryThemeColor\(\) \{[\s\S]*?return '#33b589';\s*\})/;
console.log('regexGetPrimary matches:', regexGetPrimary.test(pf));

const regexMaterialsState = /(let materialsState = \[\];)/;
console.log('regexMaterialsState matches:', regexMaterialsState.test(pf));

const regexUnicodeLen = /function getUnicodeLength\(str\) \{\s*return str \? \[\.\.\.str\]\.length : 0;\s*\}/;
console.log('regexUnicodeLen matches:', regexUnicodeLen.test(pf));

const regexLastProd = /const f1 = p\.custom_footer_1 \? \{ \.\.\.p\.custom_footer_1 \} : \{[\s\S]*?text_color: p\.footer_2_text_color \|\| '#ffffff'\s*\};\s*return \{ f1, f2 \};/;
console.log('regexLastProd matches:', regexLastProd.test(pf));

const regexDatalistFooter = /\} else if \(listId === 'footer-texts-history-list'\) \{[\s\S]*?defaultFooters\.forEach\(f => \{[\s\S]*?\}\s*\}\s*\} else if \(listId === 'datalist-stock-unlimited'\)/;
console.log('regexDatalistFooter matches:', regexDatalistFooter.test(pf));

const regexInitCreate = /const inheritedFooter = getLastProductFooterConfig\(\);\s*const f1Default = inheritedFooter\?\.f1 \|\| \{[\s\S]*?const f2Default = inheritedFooter\?\.f2 \|\| \{[\s\S]*?text_color: '#ffffff'\s*\};/;
console.log('regexInitCreate matches:', regexInitCreate.test(pf));

const regexLoadEdit = /const inheritedFooter = getLastProductFooterConfig\(\);\s*const f1Prod = prod\.custom_footer_1 \? \{ \.\.\.prod\.custom_footer_1 \} : \([\s\S]*?const f2Prod = prod\.custom_footer_2 \? \{ \.\.\.prod\.custom_footer_2 \} : \([\s\S]*?bg_color: getPrimaryThemeColor\(\),[\s\S]*?text_color: '#ffffff'\s*\)\s*\);/;
console.log('regexLoadEdit matches:', regexLoadEdit.test(pf));

const regexSyncF1 = /const syncF1Str = \(val\) => \{[\s\S]*?updateFooterCharCounter\(inpF1TextMob, document\.getElementById\('footer-text-char-count-mob'\)\);\s*\};/;
console.log('regexSyncF1 matches:', regexSyncF1.test(pf));

const regexSyncF2 = /const syncF2Str = \(val\) => \{[\s\S]*?updateFooterCharCounter\(inpF2TextMob, document\.getElementById\('footer-2-text-char-count-mob'\)\);\s*\};/;
console.log('regexSyncF2 matches:', regexSyncF2.test(pf));

const regexHandleSave = /function handleSaveCardDesign\(\) \{[\s\S]*?captureCardDesignSnapshot\(true\);[\s\S]*?updateProductCardLivePreview\(\);[\s\S]*?catch \(e\) \{[\s\S]*?\}\s*\}/;
console.log('regexHandleSave matches:', regexHandleSave.test(pf));

const regexCancelCounters = /updateFooterCharCounter\(inpF2TextMob, document\.getElementById\('footer-2-text-char-count-mob'\)\);/;
console.log('regexCancelCounters matches:', regexCancelCounters.test(pf));

const regexValidateFooter = /if \(!draftMode && primaryState\.card_variant === 'C'\) \{[\s\S]*?addError\(`Teks Footer 2 melebihi batas 32 karakter[\s\S]*?\}\s*\}/;
console.log('regexValidateFooter matches:', regexValidateFooter.test(pf));


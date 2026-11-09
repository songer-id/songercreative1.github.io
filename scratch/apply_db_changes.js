const fs = require('fs');
let content = fs.readFileSync('js/db.js', 'utf8');

// 1. Add border_width: '1px' to variant_a
content = content.replace(
  "variant_a: {\r\n      bg_color: '#ffffff',\r\n      border_color: '#e2e8f0',\r\n      border_radius: '16px',",
  "variant_a: {\r\n      bg_color: '#ffffff',\r\n      border_color: '#e2e8f0',\r\n      border_width: '1px',\r\n      border_radius: '16px',"
);

// 2. Add border_width: '1px' to variant_b
content = content.replace(
  "variant_b: {\r\n      bg_color: '#ffffff',\r\n      border_color: '#e9d5ff',\r\n      border_radius: '16px',",
  "variant_b: {\r\n      bg_color: '#ffffff',\r\n      border_color: '#e9d5ff',\r\n      border_width: '1px',\r\n      border_radius: '16px',"
);

// 3. Add border_width: '1px' to variant_c
content = content.replace(
  "variant_c: {\r\n      bg_color: '#ffffff',\r\n      border_color: '#fed7aa',\r\n      border_radius: '16px',",
  "variant_c: {\r\n      bg_color: '#ffffff',\r\n      border_color: '#fed7aa',\r\n      border_width: '1px',\r\n      border_radius: '16px',"
);

// 4. Add saveCardModelPreset in DB object after saveSettings
const saveSettingsTarget = "    saveSettings(newSettings) {\r\n      return this.updateSettings(newSettings);\r\n    },";
const saveSettingsReplacement = `    saveSettings(newSettings) {
      return this.updateSettings(newSettings);
    },
    saveCardModelPreset(variantCode, config) {
      if (!variantCode || !config) return;
      const key = variantCode === 'A' ? 'variant_a' : (variantCode === 'B' ? 'variant_b' : 'variant_c');
      const sets = this.getSettings();
      if (!sets.card_variants_config) sets.card_variants_config = {};
      sets.card_variants_config[key] = {
        ...(sets.card_variants_config[key] || {}),
        ...config
      };
      this.saveSettings(sets);
      return sets.card_variants_config[key];
    },`.replace(/\n/g, '\r\n');

content = content.replace(saveSettingsTarget, saveSettingsReplacement);

fs.writeFileSync('js/db.js', content, 'utf8');
console.log('db.js updated successfully');


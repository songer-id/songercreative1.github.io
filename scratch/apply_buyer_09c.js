const fs = require('fs');
let content = fs.readFileSync('js/buyer-store.js', 'utf8');
const isCrlf = content.includes('\r\n');
const eol = isCrlf ? '\r\n' : '\n';

function replaceExact(name, target, replacement) {
  const normTarget = target.replace(/\n/g, eol);
  const normReplacement = replacement.replace(/\n/g, eol);
  if (!content.includes(normTarget)) {
    console.error(`Target not found for: ${name}`);
    process.exit(1);
  }
  content = content.replace(normTarget, normReplacement);
  console.log(`Replaced: ${name}`);
}

const targetA = `    const badgeRadius = config.badge_radius || '6px';
    const badgeTextColor = config.badge_text_color || '#047857';
    const badgeBgColor = config.badge_bg_color || '#ecfdf5';
    const badgeBorderColor = config.badge_border_color || '#a7f3d0';
    const badgeStyle = \`color: \${badgeTextColor}; background-color: \${badgeBgColor}; border: 1px solid \${badgeBorderColor}; border-radius: \${badgeRadius};\`;`;

const replacementA = `    const rawBadgeRadius = config.badge_radius !== undefined && config.badge_radius !== null ? parseInt(config.badge_radius, 10) : 6;
    const badgeRadiusNum = isNaN(rawBadgeRadius) ? 6 : Math.max(0, Math.min(12, rawBadgeRadius));
    const badgeRadius = \`\${badgeRadiusNum}px\`;
    const badgeTextColor = config.badge_text_color || '#047857';
    const badgeBgColor = config.badge_bg_color || '#ecfdf5';
    const badgeBorderColor = config.badge_border_color || '#a7f3d0';
    const badgeStyleMode = config.badge_style;

    let badgeStyle = '';
    if (badgeStyleMode === 'border') {
      badgeStyle = \`color: \${badgeTextColor}; background-color: transparent; border: 1px solid \${badgeBorderColor}; border-radius: \${badgeRadius};\`;
    } else if (badgeStyleMode === 'bg') {
      badgeStyle = \`color: \${badgeTextColor}; background-color: \${badgeBgColor}; border: none; border-radius: \${badgeRadius};\`;
    } else {
      // Legacy compatibility
      badgeStyle = \`color: \${badgeTextColor}; background-color: \${badgeBgColor}; border: 1px solid \${badgeBorderColor}; border-radius: \${badgeRadius};\`;
    }`;

replaceExact('variantA-badge', targetA, replacementA);

const targetC = `    const badgeRadius = config.badge_radius || '6px';
    const badgeTextColor = config.badge_text_color || '#047857';
    const badgeBgColor = config.badge_bg_color || '#ecfdf5';
    const badgeBorderColor = config.badge_border_color || '#a7f3d0';
    const badgeStyle = \`color: \${badgeTextColor}; background-color: \${badgeBgColor}; border: 1px solid \${badgeBorderColor}; border-radius: \${badgeRadius};\`;`;

replaceExact('variantC-badge', targetC, replacementA);

fs.writeFileSync('js/buyer-store.js', content, 'utf8');
console.log('js/buyer-store.js updated successfully for Task 09C');


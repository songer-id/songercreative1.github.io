const fs = require('fs');

let bs = fs.readFileSync('js/buyer-store.js', 'utf8');
const isCrlf = bs.includes('\r\n');
const eol = isCrlf ? '\r\n' : '\n';

function replaceExact(name, target, replacement) {
  const normTarget = target.replace(/\r\n/g, '\n').replace(/\n/g, eol);
  const normReplacement = replacement.replace(/\r\n/g, '\n').replace(/\n/g, eol);
  if (!bs.includes(normTarget)) {
    console.error(`Target not found for: ${name}`);
    process.exit(1);
  }
  bs = bs.replace(normTarget, normReplacement);
  console.log(`Replaced: ${name}`);
}

// 1. Variant A updates
const targetA_disc = `    // Discount badge styling on image
    const discBadgeRadius = config.discount_badge_radius || '8px';
    const discBadgeBg = config.discount_badge_bg_color || '#059669';
    const discBadgeText = config.discount_badge_text_color || '#ffffff';
    const discBadgeBorder = config.discount_badge_border_color || discBadgeBg;
    const discBadgeStyle = \`background-color: \${discBadgeBg}; color: \${discBadgeText}; border: 1px solid \${discBadgeBorder}; border-radius: \${discBadgeRadius};\`;`;

const replacementA_disc = `    // Discount badge styling on image
    const rawDiscRad = config.discount_badge_radius !== undefined && config.discount_badge_radius !== null ? parseInt(config.discount_badge_radius, 10) : 8;
    const discBadgeRadius = \`\${isNaN(rawDiscRad) ? 8 : Math.max(0, Math.min(12, rawDiscRad))}px\`;
    const discBadgeBg = config.discount_badge_bg_color || '#059669';
    const discBadgeText = config.discount_badge_text_color || '#ffffff';
    const discBadgeBorder = config.discount_badge_border_color || discBadgeBg;
    const discBadgeStyle = \`background-color: \${discBadgeBg}; color: \${discBadgeText}; border: 1px solid \${discBadgeBorder}; border-radius: \${discBadgeRadius};\`;
    const rawDiscPos = config.discount_badge_position || 'top-right';
    const discPosClass = (rawDiscPos === 'top-left' ? 'top-2 left-2' : rawDiscPos === 'bottom-left' ? 'bottom-2 left-2' : rawDiscPos === 'bottom-right' ? 'bottom-2 right-2' : 'top-2 right-2');
    const strikePriceColor = config.strike_price_color || '#94a3b8';`;

replaceExact('variantA-tokens', targetA_disc, replacementA_disc);

replaceExact('variantA-img-pos',
`<div class="absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 shadow-md uppercase tracking-wider flex items-center justify-center z-10 leading-none" style="\${discBadgeStyle}">`,
`<div class="absolute \${discPosClass} text-[10px] font-black px-2 py-0.5 shadow-md uppercase tracking-wider flex items-center justify-center z-10 leading-none" style="\${discBadgeStyle}">`
);

replaceExact('variantA-strike-color',
`                <span class="text-[10px] sm:text-[11px] line-through text-slate-400 font-normal leading-none mb-1">
                  \${formatIDR(effDiscount.original_price)}
                </span>`,
`                <span class="text-[10px] sm:text-[11px] line-through font-normal leading-none mb-1" style="color: \${strikePriceColor};">
                  \${formatIDR(effDiscount.original_price)}
                </span>`
);

// 2. Variant B updates
const targetB_disc = `    // Discount badge styling on image
    const discBadgeRadius = config.discount_badge_radius || '8px';
    const discBadgeBg = config.discount_badge_bg_color || '#059669';
    const discBadgeText = config.discount_badge_text_color || '#ffffff';
    const discBadgeBorder = config.discount_badge_border_color || discBadgeBg;
    const discBadgeStyle = \`background-color: \${discBadgeBg}; color: \${discBadgeText}; border: 1px solid \${discBadgeBorder}; border-radius: \${discBadgeRadius};\`;`;

const replacementB_disc = `    // Discount badge styling on image
    const rawDiscRad = config.discount_badge_radius !== undefined && config.discount_badge_radius !== null ? parseInt(config.discount_badge_radius, 10) : 8;
    const discBadgeRadius = \`\${isNaN(rawDiscRad) ? 8 : Math.max(0, Math.min(12, rawDiscRad))}px\`;
    const discBadgeBg = config.discount_badge_bg_color || '#059669';
    const discBadgeText = config.discount_badge_text_color || '#ffffff';
    const discBadgeBorder = config.discount_badge_border_color || discBadgeBg;
    const discBadgeStyle = \`background-color: \${discBadgeBg}; color: \${discBadgeText}; border: 1px solid \${discBadgeBorder}; border-radius: \${discBadgeRadius};\`;
    const rawDiscPos = config.discount_badge_position || 'top-right';
    const discPosClass = (rawDiscPos === 'top-left' ? 'top-2 left-2' : rawDiscPos === 'bottom-left' ? 'bottom-2 left-2' : rawDiscPos === 'bottom-right' ? 'bottom-2 right-2' : 'top-2 right-2');
    const strikePriceColor = config.strike_price_color || '#94a3b8';`;

replaceExact('variantB-tokens', targetB_disc, replacementB_disc);

replaceExact('variantB-img-pos',
`<div class="absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 shadow-md uppercase tracking-wider flex items-center justify-center z-10 leading-none" style="\${discBadgeStyle}">`,
`<div class="absolute \${discPosClass} text-[10px] font-black px-2 py-0.5 shadow-md uppercase tracking-wider flex items-center justify-center z-10 leading-none" style="\${discBadgeStyle}">`
);

replaceExact('variantB-strike-color',
`              \${showStrike ? \`
                <span class="text-[10px] line-through text-slate-400 font-normal leading-none">
                  \${formatIDR(origPrice)}
                </span>
              \` : ''}`,
`              \${showStrike ? \`
                <span class="text-[10px] line-through font-normal leading-none" style="color: \${strikePriceColor};">
                  \${formatIDR(origPrice)}
                </span>
              \` : ''}`
);

// 3. Variant C updates
const targetC_disc = `    // Discount badge styling on image
    const discBadgeRadius = config.discount_badge_radius || '8px';
    const discBadgeBg = config.discount_badge_bg_color || '#059669';
    const discBadgeText = config.discount_badge_text_color || '#ffffff';
    const discBadgeBorder = config.discount_badge_border_color || discBadgeBg;
    const discBadgeStyle = \`background-color: \${discBadgeBg}; color: \${discBadgeText}; border: 1px solid \${discBadgeBorder}; border-radius: \${discBadgeRadius};\`;`;

const replacementC_disc = `    // Discount badge styling on image
    const rawDiscRad = config.discount_badge_radius !== undefined && config.discount_badge_radius !== null ? parseInt(config.discount_badge_radius, 10) : 8;
    const discBadgeRadius = \`\${isNaN(rawDiscRad) ? 8 : Math.max(0, Math.min(12, rawDiscRad))}px\`;
    const discBadgeBg = config.discount_badge_bg_color || '#059669';
    const discBadgeText = config.discount_badge_text_color || '#ffffff';
    const discBadgeBorder = config.discount_badge_border_color || discBadgeBg;
    const discBadgeStyle = \`background-color: \${discBadgeBg}; color: \${discBadgeText}; border: 1px solid \${discBadgeBorder}; border-radius: \${discBadgeRadius};\`;
    const rawDiscPos = config.discount_badge_position || 'top-right';
    const discPosClass = (rawDiscPos === 'top-left' ? 'top-2 left-2' : rawDiscPos === 'bottom-left' ? 'bottom-2 left-2' : rawDiscPos === 'bottom-right' ? 'bottom-2 right-2' : 'top-2 right-2');
    const strikePriceColor = config.strike_price_color || '#94a3b8';`;

replaceExact('variantC-tokens', targetC_disc, replacementC_disc);

replaceExact('variantC-img-pos',
`<div class="absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 shadow-md uppercase tracking-wider flex items-center justify-center z-10 leading-none" style="\${discBadgeStyle}">`,
`<div class="absolute \${discPosClass} text-[10px] font-black px-2 py-0.5 shadow-md uppercase tracking-wider flex items-center justify-center z-10 leading-none" style="\${discBadgeStyle}">`
);

replaceExact('variantC-strike-color',
`              \${(effDiscount.has_discount && showStrike) ? \`
                <span class="text-[10px] sm:text-[11px] line-through text-slate-400 font-normal leading-none mb-1">
                  \${formatIDR(effDiscount.original_price)}
                </span>
              \` : ''}`,
`              \${(effDiscount.has_discount && showStrike) ? \`
                <span class="text-[10px] sm:text-[11px] line-through font-normal leading-none mb-1" style="color: \${strikePriceColor};">
                  \${formatIDR(effDiscount.original_price)}
                </span>
              \` : ''}`
);

fs.writeFileSync('js/buyer-store.js', bs, 'utf8');
console.log('js/buyer-store.js updated successfully for Task 09C-R1');


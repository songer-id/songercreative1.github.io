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

// 1. Variant A config
replaceExact('variant-a-config',
`    const bgColor = config.bg_color || '#ffffff';
    const borderColor = config.border_color || '#e2e8f0';
    const borderRadius = config.border_radius || '16px';`,
`    const bgColor = config.bg_color || '#ffffff';
    const borderColor = config.border_color || '#e2e8f0';
    const rawBw = config.border_width !== undefined && config.border_width !== null ? parseInt(config.border_width, 10) : 1;
    const borderWidth = isNaN(rawBw) ? 1 : Math.max(0, Math.min(3, rawBw));
    const cardBorderStyle = borderWidth === 0 ? 'border: none; border-width: 0px;' : \`border: \${borderWidth}px solid \${borderColor};\`;
    const rawBr = config.border_radius !== undefined && config.border_radius !== null ? parseInt(config.border_radius, 10) : 16;
    const borderRadius = \`\${isNaN(rawBr) ? 16 : Math.max(0, Math.min(24, rawBr))}px\`;`
);

// 2. Variant A outer markup
replaceExact('variant-a-markup',
`    return \`
      <div class="h-full flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-xs hover:shadow-lg transition-all cursor-pointer group relative" onclick="window.location.href='product.html?id=\${prod.id}'" style="background-color: \${bgColor}; border: 1px solid \${borderColor}; border-radius: \${borderRadius};" data-id="\${prod.id}">
        <!-- Image Box (1:1 Persegi) -->
        <a href="product.html?id=\${prod.id}" class="block relative w-full aspect-square bg-slate-100 overflow-hidden cursor-pointer shrink-0 rounded-t-2xl">`,
`    return \`
      <div class="h-full flex flex-col justify-between overflow-hidden bg-white shadow-xs hover:shadow-lg transition-all cursor-pointer group relative" onclick="window.location.href='product.html?id=\${prod.id}'" style="background-color: \${bgColor}; \${cardBorderStyle} border-radius: \${borderRadius}; box-sizing: border-box;" data-id="\${prod.id}">
        <!-- Image Box (1:1 Persegi) -->
        <a href="product.html?id=\${prod.id}" class="block relative w-full aspect-square bg-slate-100 overflow-hidden cursor-pointer shrink-0" style="border-top-left-radius: inherit; border-top-right-radius: inherit;">`
);

// 3. Variant B config
replaceExact('variant-b-config',
`    const bgColor = config.bg_color || '#ffffff';
    const borderColor = config.border_color || '#e2e8f0';
    const borderRadius = config.border_radius || '16px';`,
`    const bgColor = config.bg_color || '#ffffff';
    const borderColor = config.border_color || '#e9d5ff';
    const rawBw = config.border_width !== undefined && config.border_width !== null ? parseInt(config.border_width, 10) : 1;
    const borderWidth = isNaN(rawBw) ? 1 : Math.max(0, Math.min(3, rawBw));
    const cardBorderStyle = borderWidth === 0 ? 'border: none; border-width: 0px;' : \`border: \${borderWidth}px solid \${borderColor};\`;
    const rawBr = config.border_radius !== undefined && config.border_radius !== null ? parseInt(config.border_radius, 10) : 16;
    const borderRadius = \`\${isNaN(rawBr) ? 16 : Math.max(0, Math.min(24, rawBr))}px\`;`
);

// 4. Variant B outer markup
replaceExact('variant-b-markup',
`    return \`
      <div class="h-full flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-xs hover:shadow-lg transition-all cursor-pointer group relative" onclick="window.location.href='product.html?id=\${prod.id}'" style="background-color: \${bgColor}; border: 1px solid \${borderColor}; border-radius: \${borderRadius};" data-id="\${prod.id}">
        <!-- Image Box - Rasio 3:4 Portrait -->
        <a href="product.html?id=\${prod.id}" class="block relative w-full aspect-[3/4] bg-slate-100 overflow-hidden cursor-pointer shrink-0 rounded-t-lg">`,
`    return \`
      <div class="h-full flex flex-col justify-between overflow-hidden bg-white shadow-xs hover:shadow-lg transition-all cursor-pointer group relative" onclick="window.location.href='product.html?id=\${prod.id}'" style="background-color: \${bgColor}; \${cardBorderStyle} border-radius: \${borderRadius}; box-sizing: border-box;" data-id="\${prod.id}">
        <!-- Image Box - Rasio 3:4 Portrait -->
        <a href="product.html?id=\${prod.id}" class="block relative w-full aspect-[3/4] bg-slate-100 overflow-hidden cursor-pointer shrink-0" style="border-top-left-radius: inherit; border-top-right-radius: inherit;">`
);

// 5. Variant C config
replaceExact('variant-c-config',
`    const bgColor = config.bg_color || '#ffffff';
    const borderColor = config.border_color || '#fed7aa';
    const borderRadius = config.border_radius || '16px';`,
`    const bgColor = config.bg_color || '#ffffff';
    const borderColor = config.border_color || '#fed7aa';
    const rawBw = config.border_width !== undefined && config.border_width !== null ? parseInt(config.border_width, 10) : 1;
    const borderWidth = isNaN(rawBw) ? 1 : Math.max(0, Math.min(3, rawBw));
    const cardBorderStyle = borderWidth === 0 ? 'border: none; border-width: 0px;' : \`border: \${borderWidth}px solid \${borderColor};\`;
    const rawBr = config.border_radius !== undefined && config.border_radius !== null ? parseInt(config.border_radius, 10) : 16;
    const borderRadius = \`\${isNaN(rawBr) ? 16 : Math.max(0, Math.min(24, rawBr))}px\`;`
);

// 6. Variant C outer markup
replaceExact('variant-c-markup',
`    return \`
      <div class="h-full flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-xs hover:shadow-lg transition-all cursor-pointer group relative" onclick="window.location.href='product.html?id=\${prod.id}'" style="background-color: \${bgColor}; border: 1px solid \${borderColor}; border-radius: \${borderRadius};" data-id="\${prod.id}">
        <!-- Image Box - Wadah Gambar Rasio Lanskap 4:3 (Lebih Pendek) -->
        <a href="product.html?id=\${prod.id}" class="block relative w-full aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer shrink-0 rounded-t-2xl">`,
`    return \`
      <div class="h-full flex flex-col justify-between overflow-hidden bg-white shadow-xs hover:shadow-lg transition-all cursor-pointer group relative" onclick="window.location.href='product.html?id=\${prod.id}'" style="background-color: \${bgColor}; \${cardBorderStyle} border-radius: \${borderRadius}; box-sizing: border-box;" data-id="\${prod.id}">
        <!-- Image Box - Wadah Gambar Rasio Lanskap 4:3 (Lebih Pendek) -->
        <a href="product.html?id=\${prod.id}" class="block relative w-full aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer shrink-0" style="border-top-left-radius: inherit; border-top-right-radius: inherit;">`
);

fs.writeFileSync('js/buyer-store.js', content, 'utf8');
console.log('ALL buyer-store.js updates successfully written!');


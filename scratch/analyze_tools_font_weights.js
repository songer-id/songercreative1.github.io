const fs = require('fs');
const pf = fs.readFileSync('js/product-form.js', 'utf8');

const deskStart = pf.indexOf('id="card-customization-section"');
const deskEnd = pf.indexOf('id="card-customization-section-mob"');
const deskMarkup = pf.slice(deskStart, deskEnd);

// Let's find end of mobile section
const mobStart = deskEnd;
// Find where mob section closes
const mobEnd = pf.indexOf('</div>\n        </div>\n      </div>', mobStart) || mobStart + 100000;
const mobMarkup = pf.slice(mobStart, mobStart + 80000);

console.log('=== Desktop markup length:', deskMarkup.length);
console.log('=== Mobile markup length:', mobMarkup.length);

function analyzeMarkup(name, html) {
  console.log(`\n================= Analyzing ${name} =================`);
  // Find any font-medium, font-semibold, font-bold, font-bold/700/600/500
  const boldClasses = html.match(/class="[^"]*(font-(?:medium|semibold|bold|extrabold|black)|font-\[\d+\])[^"]*"/g) || [];
  console.log(`Elements with bold/medium classes in ${name}:`, boldClasses.length);
  const classCounts = {};
  boldClasses.forEach(c => {
    classCounts[c] = (classCounts[c] || 0) + 1;
  });
  console.log(classCounts);

  // Check inline styles with font-weight
  const inlineStyles = html.match(/style="[^"]*font-weight[^"]*"/g) || [];
  console.log(`Elements with inline font-weight in ${name}:`, inlineStyles);

  // Check all labels and their classes
  const labels = html.match(/<label[^>]*>[\s\S]*?<\/label>/g) || [];
  console.log(`Total labels in ${name}:`, labels.length);
  labels.forEach(l => {
    const textMatch = l.replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
    const classMatch = l.match(/class="([^"]*)"/);
    const cls = classMatch ? classMatch[1] : '(no class)';
    if (cls.includes('font-medium') || cls.includes('font-semibold') || cls.includes('font-bold') || !cls.includes('font-normal')) {
      console.log(`  LABEL: "${textMatch}" -> class="${cls}"`);
    }
  });

  // Check all spans and their classes
  const spans = html.match(/<span[^>]*class="([^"]*)"[^>]*>/g) || [];
  spans.forEach(s => {
    if (s.includes('font-medium') || s.includes('font-semibold') || s.includes('font-bold')) {
      console.log(`  SPAN: ${s}`);
    }
  });

  // Check all buttons and their classes
  const buttons = html.match(/<button[^>]*class="([^"]*)"[^>]*>/g) || [];
  buttons.forEach(b => {
    if (b.includes('font-medium') || b.includes('font-semibold') || b.includes('font-bold')) {
      console.log(`  BUTTON: ${b}`);
    }
  });

  // Check all p and their classes
  const ps = html.match(/<p[^>]*class="([^"]*)"[^>]*>/g) || [];
  ps.forEach(p => {
    if (p.includes('font-medium') || p.includes('font-semibold') || p.includes('font-bold')) {
      console.log(`  P: ${p}`);
    }
  });
}

analyzeMarkup('Desktop', deskMarkup);
analyzeMarkup('Mobile', mobMarkup);


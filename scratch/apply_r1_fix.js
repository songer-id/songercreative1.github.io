const fs = require('fs');

const path = 'js/product-form.js';
let content = fs.readFileSync(path, 'utf8');

// Target 1: Desktop preview sidebar
const target1 = `            <!-- Card Live Box Container -->
            <div class="flex justify-center w-full">
              <div id="product-card-preview-container" class="w-full max-w-[260px] relative overflow-hidden">
                <div id="card-live-preview-box">
                  <!-- Rendered dynamically -->
                </div>
                <!-- Scoped Preview Simulation Modal (Scoped inside Desktop Preview Container) -->
                <div id="preview-scoped-modal-root" class="absolute inset-0 z-50 hidden flex items-center justify-center p-2 bg-slate-900/50 backdrop-blur-xs">
                  <!-- Rendered dynamically -->
                </div>
              </div>
            </div>`;

const replace1 = `            <!-- Card Live Box Container -->
            <div class="flex justify-center w-full">
              <div id="preview-card-outer-wrapper" class="w-full \${currentStep === 1 ? 'max-w-[284px] p-3 rounded-xl bg-slate-100/70' : 'max-w-[260px]'} flex justify-center transition-colors">
                <div id="product-card-preview-container" class="w-full max-w-[260px] relative overflow-hidden">
                  <div id="card-live-preview-box">
                    <!-- Rendered dynamically -->
                  </div>
                  <!-- Scoped Preview Simulation Modal (Scoped inside Desktop Preview Container) -->
                  <div id="preview-scoped-modal-root" class="absolute inset-0 z-50 hidden flex items-center justify-center p-2 bg-slate-900/50 backdrop-blur-xs">
                    <!-- Rendered dynamically -->
                  </div>
                </div>
              </div>
            </div>`;

// Target 2: Mobile preview drawer
const target2 = `            <!-- Card Preview Box -->
            <div class="w-full max-w-[260px] relative overflow-hidden">
              <div id="mobile-card-preview-container">
                <!-- Rendered dynamically -->
              </div>
              <!-- Scoped Preview Simulation Modal (Mobile Scoped inside Preview Container) -->
              <div id="preview-scoped-modal-root-mob" class="absolute inset-0 z-[100] hidden flex items-center justify-center p-2 bg-slate-900/50 backdrop-blur-xs">
                <!-- Rendered dynamically -->
              </div>
            </div>`;

const replace2 = `            <!-- Card Preview Box -->
            <div id="preview-card-outer-wrapper-mob" class="w-full \${currentStep === 1 ? 'max-w-[284px] p-3 rounded-xl bg-slate-100/70' : 'max-w-[260px]'} flex justify-center transition-colors">
              <div class="w-full max-w-[260px] relative overflow-hidden">
                <div id="mobile-card-preview-container">
                  <!-- Rendered dynamically -->
                </div>
                <!-- Scoped Preview Simulation Modal (Mobile Scoped inside Preview Container) -->
                <div id="preview-scoped-modal-root-mob" class="absolute inset-0 z-[100] hidden flex items-center justify-center p-2 bg-slate-900/50 backdrop-blur-xs">
                  <!-- Rendered dynamically -->
                </div>
              </div>
            </div>`;

// Target 3: Inside updateProductCardLivePreview()
const target3 = `    const variantRadio = document.querySelector('input[name="card_variant_radio"]:checked');
    const variant = variantRadio ? variantRadio.value : (primaryState.card_variant || '');

    // Kotak Simulasi Diskon & Panel Desain Kartu
    const simDiscountDesk = document.getElementById('cfg-simulate-countdown-preview')?.closest('label');
    const simDiscountMob = document.getElementById('cfg-simulate-countdown-preview-mob')?.closest('label');
    const customSectionDesk = document.getElementById('card-customization-section');
    const customSectionMob = document.getElementById('card-customization-section-mob');`;

const replace3 = `    const variantRadio = document.querySelector('input[name="card_variant_radio"]:checked');
    const variant = variantRadio ? variantRadio.value : (primaryState.card_variant || '');

    // Pembungkus Area Kartu (SC-ADMIN-PREVIEW-LAYOUT-03-R1: latar abu-abu netral sangat muda + padding 12px di Step 1)
    const outerWrapDesk = document.getElementById('preview-card-outer-wrapper');
    const outerWrapMob = document.getElementById('preview-card-outer-wrapper-mob');
    const isStep1WithCard = Boolean(currentStep === 1 && variant);
    [outerWrapDesk, outerWrapMob].forEach(wrap => {
      if (!wrap) return;
      if (isStep1WithCard) {
        wrap.classList.add('p-3', 'rounded-xl', 'bg-slate-100/70', 'max-w-[284px]');
        wrap.classList.remove('max-w-[260px]');
      } else {
        wrap.classList.remove('p-3', 'rounded-xl', 'bg-slate-100/70', 'max-w-[284px]');
        wrap.classList.add('max-w-[260px]');
      }
    });

    // Kotak Simulasi Diskon & Panel Desain Kartu
    const simDiscountDesk = document.getElementById('cfg-simulate-countdown-preview')?.closest('label');
    const simDiscountMob = document.getElementById('cfg-simulate-countdown-preview-mob')?.closest('label');
    const customSectionDesk = document.getElementById('card-customization-section');
    const customSectionMob = document.getElementById('card-customization-section-mob');`;

// Helper to normalize line breaks for replacement
function safeReplace(str, search, replacement, label) {
  const normStr = str.replace(/\r\n/g, '\n');
  const normSearch = search.replace(/\r\n/g, '\n');
  const normReplace = replacement.replace(/\r\n/g, '\n');

  if (!normStr.includes(normSearch)) {
    throw new Error(`Target not found for: ${label}`);
  }

  // Determine if original used CRLF
  const isCRLF = str.includes('\r\n');
  const result = normStr.replace(normSearch, normReplace);
  return isCRLF ? result.replace(/\n/g, '\r\n') : result;
}

try {
  content = safeReplace(content, target1, replace1, 'Target 1 (Desktop preview sidebar)');
  content = safeReplace(content, target2, replace2, 'Target 2 (Mobile preview drawer)');
  content = safeReplace(content, target3, replace3, 'Target 3 (updateProductCardLivePreview)');

  fs.writeFileSync(path, content, 'utf8');
  console.log('[SUCCESS] All targets replaced in js/product-form.js');
} catch (e) {
  console.error('[ERROR]', e.message);
  process.exit(1);
}


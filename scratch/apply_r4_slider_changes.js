const fs = require('fs');

let code = fs.readFileSync('js/product-form.js', 'utf8');

// 1. Desktop HTML: Card Radius
const oldCardRadiusDesk = `                      <div class="col-span-2 space-y-1.5 pt-1">
                        <div class="flex items-center justify-between">
                          <label for="cfg-border-radius" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                          <span id="cfg-border-radius-val" class="text-[11px] font-mono font-normal text-slate-700">16 px</span>
                        </div>
                        <input type="range" id="cfg-border-radius" min="0" max="24" step="1" value="16" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                        <div class="flex items-center gap-1 pt-0.5">
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="8">8 px</button>
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="16">16 px</button>
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="24">24 px</button>
                        </div>
                      </div>`;

const newCardRadiusDesk = `                      <div class="col-span-2 space-y-1.5 pt-1">
                        <div class="flex items-center justify-between">
                          <label for="cfg-border-radius" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                          <div class="relative flex items-center w-20">
                            <input type="number" id="cfg-border-radius" min="0" max="24" step="1" value="16" class="w-full pl-2 pr-6 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                            <span class="absolute right-2 text-[10px] font-normal text-slate-400 pointer-events-none select-none">px</span>
                          </div>
                        </div>
                        <div class="flex items-center gap-1 pt-0.5">
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="8">8 px</button>
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="16">16 px</button>
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="24">24 px</button>
                        </div>
                      </div>`;

if (!code.includes(oldCardRadiusDesk)) {
  console.error('ERROR: oldCardRadiusDesk not found');
} else {
  code = code.replace(oldCardRadiusDesk, newCardRadiusDesk);
  console.log('✓ Desktop Card Radius replaced');
}

// 2. Desktop HTML: Discount Badge Radius
const oldDiscRadiusDesk = `                        <!-- Radius Sudut Label Diskon -->
                        <div class="space-y-1.5">
                          <div class="flex items-center justify-between">
                            <label for="cfg-discount-badge-radius" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                            <span id="cfg-discount-badge-radius-val" class="text-[11px] font-mono font-normal text-slate-700">8 px</span>
                          </div>
                          <input type="range" id="cfg-discount-badge-radius" min="0" max="12" step="1" value="8" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                          <div class="flex items-center gap-1 pt-0.5">
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="4">4 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="6">6 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="8">8 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="12">12 px</button>
                          </div>
                        </div>`;

const newDiscRadiusDesk = `                        <!-- Radius Sudut Label Diskon -->
                        <div class="space-y-1.5">
                          <div class="flex items-center justify-between">
                            <label for="cfg-discount-badge-radius" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                            <div class="relative flex items-center w-20">
                              <input type="number" id="cfg-discount-badge-radius" min="0" max="12" step="1" value="8" class="w-full pl-2 pr-6 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                              <span class="absolute right-2 text-[10px] font-normal text-slate-400 pointer-events-none select-none">px</span>
                            </div>
                          </div>
                          <div class="flex items-center gap-1 pt-0.5">
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="4">4 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="6">6 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="8">8 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="12">12 px</button>
                          </div>
                        </div>`;

if (!code.includes(oldDiscRadiusDesk)) {
  console.error('ERROR: oldDiscRadiusDesk not found');
} else {
  code = code.replace(oldDiscRadiusDesk, newDiscRadiusDesk);
  console.log('✓ Desktop Discount Badge Radius replaced');
}

// 3. Desktop HTML: Countdown Radius
const oldCdRadiusDesk = `                        <!-- Radius Sudut Countdown Slider 0-12 px + Presets 0, 4, 6, 8, 12 px -->
                        <div class="space-y-1.5">
                          <div class="flex items-center justify-between">
                            <label for="cfg-countdown-radius" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                            <span id="cfg-countdown-radius-val" class="text-[11px] font-mono font-normal text-slate-700">6 px</span>
                          </div>
                          <input type="range" id="cfg-countdown-radius" min="0" max="12" step="1" value="6" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                          <div class="flex items-center gap-1 pt-0.5">
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="4">4 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="6">6 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="8">8 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="12">12 px</button>
                          </div>
                        </div>`;

const newCdRadiusDesk = `                        <!-- Radius Sudut Countdown Slider 0-12 px + Presets 0, 4, 6, 8, 12 px -->
                        <div class="space-y-1.5">
                          <div class="flex items-center justify-between">
                            <label for="cfg-countdown-radius" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                            <div class="relative flex items-center w-20">
                              <input type="number" id="cfg-countdown-radius" min="0" max="12" step="1" value="6" class="w-full pl-2 pr-6 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                              <span class="absolute right-2 text-[10px] font-normal text-slate-400 pointer-events-none select-none">px</span>
                            </div>
                          </div>
                          <div class="flex items-center gap-1 pt-0.5">
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="4">4 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="6">6 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="8">8 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="12">12 px</button>
                          </div>
                        </div>`;

if (!code.includes(oldCdRadiusDesk)) {
  console.error('ERROR: oldCdRadiusDesk not found');
} else {
  code = code.replace(oldCdRadiusDesk, newCdRadiusDesk);
  console.log('✓ Desktop Countdown Radius replaced');
}

// 4. Desktop HTML: Label Khusus (Badge) Radius
const oldBadgeRadiusDesk = `                        <!-- Radius Sudut Label Khusus (Slider 0-12 px + Pilihan Cepat 0, 4, 6, 8, 12 px) -->
                        <div class="space-y-1.5 pt-0.5">
                          <div class="flex items-center justify-between">
                            <label for="cfg-badge-radius" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                            <span id="cfg-badge-radius-val" class="text-[11px] font-mono font-normal text-slate-700">6 px</span>
                          </div>
                          <input type="range" id="cfg-badge-radius" min="0" max="12" step="1" value="6" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                          <div class="flex items-center gap-1 pt-0.5">
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="4">4 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="6">6 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="8">8 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="12">12 px</button>
                          </div>
                        </div>`;

const newBadgeRadiusDesk = `                        <!-- Radius Sudut Label Khusus (Input 0-12 px + Pilihan Cepat 0, 4, 6, 8, 12 px) -->
                        <div class="space-y-1.5 pt-0.5">
                          <div class="flex items-center justify-between">
                            <label for="cfg-badge-radius" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                            <div class="relative flex items-center w-20">
                              <input type="number" id="cfg-badge-radius" min="0" max="12" step="1" value="6" class="w-full pl-2 pr-6 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                              <span class="absolute right-2 text-[10px] font-normal text-slate-400 pointer-events-none select-none">px</span>
                            </div>
                          </div>
                          <div class="flex items-center gap-1 pt-0.5">
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="4">4 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="6">6 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="8">8 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="12">12 px</button>
                          </div>
                        </div>`;

if (!code.includes(oldBadgeRadiusDesk)) {
  console.error('ERROR: oldBadgeRadiusDesk not found');
} else {
  code = code.replace(oldBadgeRadiusDesk, newBadgeRadiusDesk);
  console.log('✓ Desktop Label Khusus Radius replaced');
}

// 5. Mobile HTML: Outline
const oldBwMob = `                      <div class="col-span-2 space-y-1.5 pt-1">
                        <div class="flex items-center justify-between">
                          <label for="cfg-border-width-mob" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Outline</label>
                          <span id="cfg-border-width-val-mob" class="text-[11px] font-mono font-normal text-slate-700" title="1 px" aria-label="Tipis (1 px)">Tipis</span>
                        </div>
                        <input type="range" id="cfg-border-width-mob" min="0" max="3" step="1" value="1" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                        <div class="flex items-center gap-1 pt-0.5">
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0" title="None (0 px)" aria-label="None (0 px)">None</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="1" title="Tipis (1 px)" aria-label="Tipis (1 px)">Tipis</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="2" title="Sedang (2 px)" aria-label="Sedang (2 px)">Sedang</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="3" title="Tebal (3 px)" aria-label="Tebal (3 px)">Tebal</button>
                        </div>
                      </div>`;

const newBwMob = `                      <div class="col-span-2 space-y-1.5 pt-1">
                        <div class="flex items-center justify-between">
                          <label for="cfg-border-width-mob" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Outline</label>
                          <span id="cfg-border-width-val-mob" class="text-[11px] font-mono font-normal text-slate-700" title="1 px" aria-label="Tipis (1 px)">Tipis</span>
                        </div>
                        <input type="hidden" id="cfg-border-width-mob" value="1" />
                        <div class="flex items-center gap-1 pt-0.5">
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0" title="None (0 px)" aria-label="None (0 px)">None</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="1" title="Tipis (1 px)" aria-label="Tipis (1 px)">Tipis</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="2" title="Sedang (2 px)" aria-label="Sedang (2 px)">Sedang</button>
                          <button type="button" class="btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="3" title="Tebal (3 px)" aria-label="Tebal (3 px)">Tebal</button>
                        </div>
                      </div>`;

if (!code.includes(oldBwMob)) {
  console.error('ERROR: oldBwMob not found');
} else {
  code = code.replace(oldBwMob, newBwMob);
  console.log('✓ Mobile Outline replaced');
}

// 6. Mobile HTML: Card Radius
const oldCardRadiusMob = `                      <div class="col-span-2 space-y-1.5 pt-1">
                        <div class="flex items-center justify-between">
                          <label for="cfg-border-radius-mob" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                          <span id="cfg-border-radius-val-mob" class="text-[11px] font-mono font-normal text-slate-700">16 px</span>
                        </div>
                        <input type="range" id="cfg-border-radius-mob" min="0" max="24" step="1" value="16" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                        <div class="flex items-center gap-1 pt-0.5">
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="8">8 px</button>
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="16">16 px</button>
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="24">24 px</button>
                        </div>
                      </div>`;

const newCardRadiusMob = `                      <div class="col-span-2 space-y-1.5 pt-1">
                        <div class="flex items-center justify-between">
                          <label for="cfg-border-radius-mob" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                          <div class="relative flex items-center w-20">
                            <input type="number" id="cfg-border-radius-mob" min="0" max="24" step="1" value="16" class="w-full pl-2 pr-6 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                            <span class="absolute right-2 text-[10px] font-normal text-slate-400 pointer-events-none select-none">px</span>
                          </div>
                        </div>
                        <div class="flex items-center gap-1 pt-0.5">
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="8">8 px</button>
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="16">16 px</button>
                          <button type="button" class="btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="24">24 px</button>
                        </div>
                      </div>`;

if (!code.includes(oldCardRadiusMob)) {
  console.error('ERROR: oldCardRadiusMob not found');
} else {
  code = code.replace(oldCardRadiusMob, newCardRadiusMob);
  console.log('✓ Mobile Card Radius replaced');
}

// 7. Mobile HTML: Discount Badge Radius
const oldDiscRadiusMob = `                        <!-- Radius Sudut Label Diskon Mobile -->
                        <div class="space-y-1.5">
                          <div class="flex items-center justify-between">
                            <label for="cfg-discount-badge-radius-mob" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                            <span id="cfg-discount-badge-radius-val-mob" class="text-[11px] font-mono font-normal text-slate-700">8 px</span>
                          </div>
                          <input type="range" id="cfg-discount-badge-radius-mob" min="0" max="12" step="1" value="8" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                          <div class="flex items-center gap-1 pt-0.5">
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="4">4 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="6">6 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="8">8 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="12">12 px</button>
                          </div>
                        </div>`;

const newDiscRadiusMob = `                        <!-- Radius Sudut Label Diskon Mobile -->
                        <div class="space-y-1.5">
                          <div class="flex items-center justify-between">
                            <label for="cfg-discount-badge-radius-mob" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                            <div class="relative flex items-center w-20">
                              <input type="number" id="cfg-discount-badge-radius-mob" min="0" max="12" step="1" value="8" class="w-full pl-2 pr-6 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                              <span class="absolute right-2 text-[10px] font-normal text-slate-400 pointer-events-none select-none">px</span>
                            </div>
                          </div>
                          <div class="flex items-center gap-1 pt-0.5">
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="4">4 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="6">6 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="8">8 px</button>
                            <button type="button" class="btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="12">12 px</button>
                          </div>
                        </div>`;

if (!code.includes(oldDiscRadiusMob)) {
  console.error('ERROR: oldDiscRadiusMob not found');
} else {
  code = code.replace(oldDiscRadiusMob, newDiscRadiusMob);
  console.log('✓ Mobile Discount Badge Radius replaced');
}

// 8. Mobile HTML: Countdown Radius
const oldCdRadiusMob = `                        <!-- Radius Sudut Countdown Mobile Slider 0-12 px + Presets 0, 4, 6, 8, 12 px -->
                        <div class="space-y-1.5">
                          <div class="flex items-center justify-between">
                            <label for="cfg-countdown-radius-mob" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                            <span id="cfg-countdown-radius-val-mob" class="text-[11px] font-mono font-normal text-slate-700">6 px</span>
                          </div>
                          <input type="range" id="cfg-countdown-radius-mob" min="0" max="12" step="1" value="6" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                          <div class="flex items-center gap-1 pt-0.5">
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="4">4 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="6">6 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="8">8 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="12">12 px</button>
                          </div>
                        </div>`;

const newCdRadiusMob = `                        <!-- Radius Sudut Countdown Mobile Slider 0-12 px + Presets 0, 4, 6, 8, 12 px -->
                        <div class="space-y-1.5">
                          <div class="flex items-center justify-between">
                            <label for="cfg-countdown-radius-mob" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                            <div class="relative flex items-center w-20">
                              <input type="number" id="cfg-countdown-radius-mob" min="0" max="12" step="1" value="6" class="w-full pl-2 pr-6 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                              <span class="absolute right-2 text-[10px] font-normal text-slate-400 pointer-events-none select-none">px</span>
                            </div>
                          </div>
                          <div class="flex items-center gap-1 pt-0.5">
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="4">4 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="6">6 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="8">8 px</button>
                            <button type="button" class="btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="12">12 px</button>
                          </div>
                        </div>`;

if (!code.includes(oldCdRadiusMob)) {
  console.error('ERROR: oldCdRadiusMob not found');
} else {
  code = code.replace(oldCdRadiusMob, newCdRadiusMob);
  console.log('✓ Mobile Countdown Radius replaced');
}

// 9. Mobile HTML: Label Khusus Radius
const oldBadgeRadiusMob = `                        <div class="space-y-1.5 pt-0.5">
                          <div class="flex items-center justify-between">
                            <label for="cfg-badge-radius-mob" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                            <span id="cfg-badge-radius-val-mob" class="text-[11px] font-mono font-normal text-slate-700">6 px</span>
                          </div>
                          <input type="range" id="cfg-badge-radius-mob" min="0" max="12" step="1" value="6" class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                          <div class="flex items-center gap-1 pt-0.5">
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="4">4 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="6">6 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="8">8 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="12">12 px</button>
                          </div>
                        </div>`;

const newBadgeRadiusMob = `                        <div class="space-y-1.5 pt-0.5">
                          <div class="flex items-center justify-between">
                            <label for="cfg-badge-radius-mob" class="block text-[10px] font-normal text-slate-500 uppercase tracking-wider">Radius Sudut</label>
                            <div class="relative flex items-center w-20">
                              <input type="number" id="cfg-badge-radius-mob" min="0" max="12" step="1" value="6" class="w-full pl-2 pr-6 py-1 text-xs font-mono font-normal border border-slate-200 rounded-[6px] bg-white text-right focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                              <span class="absolute right-2 text-[10px] font-normal text-slate-400 pointer-events-none select-none">px</span>
                            </div>
                          </div>
                          <div class="flex items-center gap-1 pt-0.5">
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="0">0 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="4">4 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer" data-value="6">6 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="8">8 px</button>
                            <button type="button" class="btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer" data-value="12">12 px</button>
                          </div>
                        </div>`;

if (!code.includes(oldBadgeRadiusMob)) {
  console.error('ERROR: oldBadgeRadiusMob not found');
} else {
  code = code.replace(oldBadgeRadiusMob, newBadgeRadiusMob);
  console.log('✓ Mobile Label Khusus Radius replaced');
}

// 10. Helper functions for presets
const oldUpdateBw = `  function updateBorderWidthPresetButtons(val) {
    const num = parseBorderWidth(val, 1);
    document.querySelectorAll('.btn-border-width-preset').forEach(btn => {
      const btnVal = parseInt(btn.dataset.value, 10);
      if (btnVal === num) {
        btn.className = 'btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer';
      } else {
        btn.className = 'btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer';
      }
    });
    const valLabelDesk = document.getElementById('cfg-border-width-val');
    const valLabelMob = document.getElementById('cfg-border-width-val-mob');
    const term = getBorderWidthLabel(num);
    if (valLabelDesk) {
      valLabelDesk.textContent = term;
      valLabelDesk.title = \`\${num} px\`;
      valLabelDesk.setAttribute('aria-label', \`\${term} (\${num} px)\`);
    }
    if (valLabelMob) {
      valLabelMob.textContent = term;
      valLabelMob.title = \`\${num} px\`;
      valLabelMob.setAttribute('aria-label', \`\${term} (\${num} px)\`);
    }
    updateOutlineColorControlsState(num);
  }`;

const newUpdateBw = `  function updateBorderWidthPresetButtons(val) {
    const num = parseBorderWidth(val, 1);
    document.querySelectorAll('.btn-border-width-preset').forEach(btn => {
      const btnVal = parseInt(btn.dataset.value, 10);
      if (btnVal === num) {
        btn.className = 'btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer';
      } else {
        btn.className = 'btn-border-width-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer';
      }
    });
    const valLabelDesk = document.getElementById('cfg-border-width-val');
    const valLabelMob = document.getElementById('cfg-border-width-val-mob');
    const term = getBorderWidthLabel(num);
    if (valLabelDesk) {
      valLabelDesk.textContent = term;
      valLabelDesk.title = \`\${num} px\`;
      valLabelDesk.setAttribute('aria-label', \`\${term} (\${num} px)\`);
    }
    if (valLabelMob) {
      valLabelMob.textContent = term;
      valLabelMob.title = \`\${num} px\`;
      valLabelMob.setAttribute('aria-label', \`\${term} (\${num} px)\`);
    }
    const bwInpDesk = document.getElementById('cfg-border-width');
    const bwInpMob = document.getElementById('cfg-border-width-mob');
    if (bwInpDesk && bwInpDesk.value !== String(num)) bwInpDesk.value = num;
    if (bwInpMob && bwInpMob.value !== String(num)) bwInpMob.value = num;
    updateOutlineColorControlsState(num);
  }`;

if (!code.includes(oldUpdateBw)) {
  console.error('ERROR: oldUpdateBw not found');
} else {
  code = code.replace(oldUpdateBw, newUpdateBw);
  console.log('✓ updateBorderWidthPresetButtons updated');
}

const oldUpdateBr = `  function updateBorderRadiusPresetButtons(val) {
    const num = parseBorderRadius(val, 16);
    document.querySelectorAll('.btn-border-radius-preset').forEach(btn => {
      const btnVal = parseInt(btn.dataset.value, 10);
      if (btnVal === num) {
        btn.className = 'btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer';
      } else {
        btn.className = 'btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer';
      }
    });
    const valLabelDesk = document.getElementById('cfg-border-radius-val');
    const valLabelMob = document.getElementById('cfg-border-radius-val-mob');
    if (valLabelDesk) valLabelDesk.textContent = \`\${num} px\`;
    if (valLabelMob) valLabelMob.textContent = \`\${num} px\`;
  }`;

const newUpdateBr = `  function updateBorderRadiusPresetButtons(val) {
    const isValProvided = val !== undefined && val !== null && val !== '';
    const num = isValProvided ? parseBorderRadius(val, 16) : null;
    document.querySelectorAll('.btn-border-radius-preset').forEach(btn => {
      const btnVal = parseInt(btn.dataset.value, 10);
      if (num !== null && btnVal === num) {
        btn.className = 'btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer';
      } else {
        btn.className = 'btn-border-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer';
      }
    });
    const inpDesk = document.getElementById('cfg-border-radius');
    const inpMob = document.getElementById('cfg-border-radius-mob');
    if (num !== null) {
      if (inpDesk && (typeof document === 'undefined' || document.activeElement !== inpDesk) && inpDesk.value !== String(num)) inpDesk.value = num;
      if (inpMob && (typeof document === 'undefined' || document.activeElement !== inpMob) && inpMob.value !== String(num)) inpMob.value = num;
    }
  }`;

if (!code.includes(oldUpdateBr)) {
  console.error('ERROR: oldUpdateBr not found');
} else {
  code = code.replace(oldUpdateBr, newUpdateBr);
  console.log('✓ updateBorderRadiusPresetButtons updated');
}

const oldUpdateDisc = `  function updateDiscountBadgeRadiusPresetButtons(val) {
    const num = parseDiscountBadgeRadius(val, 8);
    document.querySelectorAll('.btn-disc-radius-preset').forEach(btn => {
      const btnVal = parseInt(btn.dataset.value, 10);
      if (btnVal === num) {
        btn.className = 'btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer';
      } else {
        btn.className = 'btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer';
      }
    });
    const valLabelDesk = document.getElementById('cfg-discount-badge-radius-val');
    const valLabelMob = document.getElementById('cfg-discount-badge-radius-val-mob');
    if (valLabelDesk) valLabelDesk.textContent = \`\${num} px\`;
    if (valLabelMob) valLabelMob.textContent = \`\${num} px\`;
  }`;

const newUpdateDisc = `  function updateDiscountBadgeRadiusPresetButtons(val) {
    const isValProvided = val !== undefined && val !== null && val !== '';
    const num = isValProvided ? parseDiscountBadgeRadius(val, 8) : null;
    document.querySelectorAll('.btn-disc-radius-preset').forEach(btn => {
      const btnVal = parseInt(btn.dataset.value, 10);
      if (num !== null && btnVal === num) {
        btn.className = 'btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer';
      } else {
        btn.className = 'btn-disc-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer';
      }
    });
    const inpDesk = document.getElementById('cfg-discount-badge-radius');
    const inpMob = document.getElementById('cfg-discount-badge-radius-mob');
    if (num !== null) {
      if (inpDesk && (typeof document === 'undefined' || document.activeElement !== inpDesk) && inpDesk.value !== String(num)) inpDesk.value = num;
      if (inpMob && (typeof document === 'undefined' || document.activeElement !== inpMob) && inpMob.value !== String(num)) inpMob.value = num;
    }
  }`;

if (!code.includes(oldUpdateDisc)) {
  console.error('ERROR: oldUpdateDisc not found');
} else {
  code = code.replace(oldUpdateDisc, newUpdateDisc);
  console.log('✓ updateDiscountBadgeRadiusPresetButtons updated');
}

const oldUpdateCd = `  function updateCountdownRadiusPresetButtons(val) {
    const num = parseCountdownRadius(val, 6);
    document.querySelectorAll('.btn-countdown-radius-preset').forEach(btn => {
      const btnVal = parseInt(btn.dataset.value, 10);
      if (btnVal === num) {
        btn.className = 'btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer';
      } else {
        btn.className = 'btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer';
      }
    });
    const valLabelDesk = document.getElementById('cfg-countdown-radius-val');
    const valLabelMob = document.getElementById('cfg-countdown-radius-val-mob');
    if (valLabelDesk) valLabelDesk.textContent = \`\${num} px\`;
    if (valLabelMob) valLabelMob.textContent = \`\${num} px\`;
  }`;

const newUpdateCd = `  function updateCountdownRadiusPresetButtons(val) {
    const isValProvided = val !== undefined && val !== null && val !== '';
    const num = isValProvided ? parseCountdownRadius(val, 6) : null;
    document.querySelectorAll('.btn-countdown-radius-preset').forEach(btn => {
      const btnVal = parseInt(btn.dataset.value, 10);
      if (num !== null && btnVal === num) {
        btn.className = 'btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer';
      } else {
        btn.className = 'btn-countdown-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer';
      }
    });
    const inpDesk = document.getElementById('cfg-countdown-radius');
    const inpMob = document.getElementById('cfg-countdown-radius-mob');
    if (num !== null) {
      if (inpDesk && (typeof document === 'undefined' || document.activeElement !== inpDesk) && inpDesk.value !== String(num)) inpDesk.value = num;
      if (inpMob && (typeof document === 'undefined' || document.activeElement !== inpMob) && inpMob.value !== String(num)) inpMob.value = num;
    }
  }`;

if (!code.includes(oldUpdateCd)) {
  console.error('ERROR: oldUpdateCd not found');
} else {
  code = code.replace(oldUpdateCd, newUpdateCd);
  console.log('✓ updateCountdownRadiusPresetButtons updated');
}

const oldUpdateBadge = `  function updateBadgeRadiusPresetButtons(val) {
    const num = parseBadgeRadius(val, 6);
    document.querySelectorAll('.btn-badge-radius-preset').forEach(btn => {
      const btnVal = parseInt(btn.dataset.value, 10);
      if (btnVal === num) {
        btn.className = 'btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer';
      } else {
        btn.className = 'btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer';
      }
    });
    const valLabelDesk = document.getElementById('cfg-badge-radius-val');
    const valLabelMob = document.getElementById('cfg-badge-radius-val-mob');
    if (valLabelDesk) valLabelDesk.textContent = \`\${num} px\`;
    if (valLabelMob) valLabelMob.textContent = \`\${num} px\`;
  }`;

const newUpdateBadge = `  function updateBadgeRadiusPresetButtons(val) {
    const isValProvided = val !== undefined && val !== null && val !== '';
    const num = isValProvided ? parseBadgeRadius(val, 6) : null;
    document.querySelectorAll('.btn-badge-radius-preset').forEach(btn => {
      const btnVal = parseInt(btn.dataset.value, 10);
      if (num !== null && btnVal === num) {
        btn.className = 'btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-emerald-500 bg-emerald-50 text-emerald-700 transition cursor-pointer';
      } else {
        btn.className = 'btn-badge-radius-preset flex-1 py-1 text-[10px] font-normal rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer';
      }
    });
    const inpDesk = document.getElementById('cfg-badge-radius');
    const inpMob = document.getElementById('cfg-badge-radius-mob');
    if (num !== null) {
      if (inpDesk && (typeof document === 'undefined' || document.activeElement !== inpDesk) && inpDesk.value !== String(num)) inpDesk.value = num;
      if (inpMob && (typeof document === 'undefined' || document.activeElement !== inpMob) && inpMob.value !== String(num)) inpMob.value = num;
    }
  }`;

if (!code.includes(oldUpdateBadge)) {
  console.error('ERROR: oldUpdateBadge not found');
} else {
  code = code.replace(oldUpdateBadge, newUpdateBadge);
  console.log('✓ updateBadgeRadiusPresetButtons updated');
}

// 11. Event Listeners for Outline & 4 Radius controls
const oldListenersBlock = `    // Border Width & Radius Sliders and Presets (Desktop & Mobile Sync)
    const bwSliderDesk = document.getElementById('cfg-border-width');
    const bwSliderMob = document.getElementById('cfg-border-width-mob');
    const brSliderDesk = document.getElementById('cfg-border-radius');
    const brSliderMob = document.getElementById('cfg-border-radius-mob');

    const handleBwInput = (val) => {
      const num = parseBorderWidth(val, 1);
      if (bwSliderDesk) bwSliderDesk.value = num;
      if (bwSliderMob) bwSliderMob.value = num;
      updateBorderWidthPresetButtons(num);
      markCardDesignAsCustom();
    };

    if (bwSliderDesk) {
      bwSliderDesk.addEventListener('input', (e) => handleBwInput(e.target.value));
    }
    if (bwSliderMob) {
      bwSliderMob.addEventListener('input', (e) => handleBwInput(e.target.value));
    }

    const handleBrInput = (val) => {
      const num = parseBorderRadius(val, 16);
      if (brSliderDesk) brSliderDesk.value = num;
      if (brSliderMob) brSliderMob.value = num;
      updateBorderRadiusPresetButtons(num);
      markCardDesignAsCustom();
    };

    if (brSliderDesk) {
      brSliderDesk.addEventListener('input', (e) => handleBrInput(e.target.value));
    }
    if (brSliderMob) {
      brSliderMob.addEventListener('input', (e) => handleBrInput(e.target.value));
    }

    document.querySelectorAll('.btn-border-width-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleBwInput(btn.dataset.value);
      });
    });

    document.querySelectorAll('.btn-border-radius-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleBrInput(btn.dataset.value);
      });
    });

    // Badge Radius Sliders and Presets (Desktop & Mobile Sync)
    const badgeRadiusDesk = document.getElementById('cfg-badge-radius');
    const badgeRadiusMob = document.getElementById('cfg-badge-radius-mob');

    const handleBadgeRadiusInput = (val) => {
      const num = parseBadgeRadius(val, 6);
      if (badgeRadiusDesk) badgeRadiusDesk.value = num;
      if (badgeRadiusMob) badgeRadiusMob.value = num;
      updateBadgeRadiusPresetButtons(num);
      markCardDesignAsCustom();
    };

    if (badgeRadiusDesk) {
      badgeRadiusDesk.addEventListener('input', (e) => handleBadgeRadiusInput(e.target.value));
    }
    if (badgeRadiusMob) {
      badgeRadiusMob.addEventListener('input', (e) => handleBadgeRadiusInput(e.target.value));
    }

    document.querySelectorAll('.btn-badge-radius-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleBadgeRadiusInput(btn.dataset.value);
      });
    });`;

const newListenersBlock = `    // Outline Presets & Hidden Inputs (Desktop & Mobile Sync)
    const handleBwSelect = (val) => {
      const num = parseBorderWidth(val, 1);
      const bwInpDesk = document.getElementById('cfg-border-width');
      const bwInpMob = document.getElementById('cfg-border-width-mob');
      if (bwInpDesk) bwInpDesk.value = num;
      if (bwInpMob) bwInpMob.value = num;
      updateBorderWidthPresetButtons(num);
      markCardDesignAsCustom();
    };

    document.querySelectorAll('.btn-border-width-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleBwSelect(btn.dataset.value);
      });
    });

    // Reusable binding helper for radius number inputs and suggestion buttons
    const bindRadiusControl = ({ deskId, mobId, presetClass, parser, defaultVal, minVal, maxVal, updater }) => {
      const deskInp = document.getElementById(deskId);
      const mobInp = document.getElementById(mobId);

      const syncInputsOnTyping = (sourceEl, targetEl) => {
        const raw = sourceEl.value;
        if (targetEl && targetEl.value !== raw) targetEl.value = raw;
        if (raw.trim() === '') {
          // Nilai kosong sementara saat mengetik: jangan paksa jadi 0, jangan aktifkan saran
          updater(null);
          return;
        }
        const parsed = parseInt(raw, 10);
        if (!isNaN(parsed)) {
          updater(parsed);
          markCardDesignAsCustom();
        }
      };

      const validateOnBlur = (el) => {
        const raw = el.value.trim();
        let num;
        if (raw === '' || isNaN(parseInt(raw, 10))) {
          num = defaultVal;
        } else {
          num = Math.max(minVal, Math.min(maxVal, parseInt(raw, 10)));
        }
        if (deskInp) deskInp.value = num;
        if (mobInp) mobInp.value = num;
        updater(num);
        markCardDesignAsCustom();
      };

      if (deskInp) {
        deskInp.addEventListener('input', () => syncInputsOnTyping(deskInp, mobInp));
        deskInp.addEventListener('blur', () => validateOnBlur(deskInp));
        deskInp.addEventListener('change', () => validateOnBlur(deskInp));
      }
      if (mobInp) {
        mobInp.addEventListener('input', () => syncInputsOnTyping(mobInp, deskInp));
        mobInp.addEventListener('blur', () => validateOnBlur(mobInp));
        mobInp.addEventListener('change', () => validateOnBlur(mobInp));
      }

      document.querySelectorAll(\`.\${presetClass}\`).forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const num = parseInt(btn.dataset.value, 10);
          if (deskInp) deskInp.value = num;
          if (mobInp) mobInp.value = num;
          updater(num);
          markCardDesignAsCustom();
        });
      });
    };

    // 1. Radius Kartu (0-24 px, default 16)
    bindRadiusControl({
      deskId: 'cfg-border-radius',
      mobId: 'cfg-border-radius-mob',
      presetClass: 'btn-border-radius-preset',
      parser: parseBorderRadius,
      defaultVal: 16,
      minVal: 0,
      maxVal: 24,
      updater: updateBorderRadiusPresetButtons
    });

    // 2. Radius Label Khusus (0-12 px, default 6)
    bindRadiusControl({
      deskId: 'cfg-badge-radius',
      mobId: 'cfg-badge-radius-mob',
      presetClass: 'btn-badge-radius-preset',
      parser: parseBadgeRadius,
      defaultVal: 6,
      minVal: 0,
      maxVal: 12,
      updater: updateBadgeRadiusPresetButtons
    });`;

if (!code.includes(oldListenersBlock)) {
  console.error('ERROR: oldListenersBlock not found');
} else {
  code = code.replace(oldListenersBlock, newListenersBlock);
  console.log('✓ Border & Badge listeners replaced');
}

// 12. Discount Badge & Countdown listeners
const oldDiscAndCdListeners = `    // Discount Badge Radius Sliders and Presets (Desktop & Mobile Sync)
    const discRadiusDesk = document.getElementById('cfg-discount-badge-radius');
    const discRadiusMob = document.getElementById('cfg-discount-badge-radius-mob');

    const handleDiscRadiusInput = (val) => {
      const num = parseDiscountBadgeRadius(val, 8);
      if (discRadiusDesk) discRadiusDesk.value = num;
      if (discRadiusMob) discRadiusMob.value = num;
      updateDiscountBadgeRadiusPresetButtons(num);
      markCardDesignAsCustom();
    };

    if (discRadiusDesk) {
      discRadiusDesk.addEventListener('input', (e) => handleDiscRadiusInput(e.target.value));
    }
    if (discRadiusMob) {
      discRadiusMob.addEventListener('input', (e) => handleDiscRadiusInput(e.target.value));
    }

    document.querySelectorAll('.btn-disc-radius-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleDiscRadiusInput(btn.dataset.value);
      });
    });

    // Discount Badge Position Buttons (Desktop & Mobile Sync)
    document.querySelectorAll('.btn-disc-pos').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const pos = btn.dataset.pos;
        setDiscountBadgePosition(pos);
        markCardDesignAsCustom();
      });
    });

    // Discount Badge Colors (Desktop & Mobile Sync)
    const discColorPairs = [
      { color: 'cfg-discount-badge-text-color', hex: 'cfg-discount-badge-text-hex' },
      { color: 'cfg-discount-badge-bg-color', hex: 'cfg-discount-badge-bg-hex' }
    ];
    discColorPairs.forEach(pair => {
      const deskColor = document.getElementById(pair.color);
      const deskHex = document.getElementById(pair.hex);
      const mobColor = document.getElementById(\`\${pair.color}-mob\`);
      const mobHex = document.getElementById(\`\${pair.hex}-mob\`);

      const syncAllDiscColors = (val) => {
        if (deskColor) deskColor.value = val;
        if (deskHex) deskHex.value = val;
        if (mobColor) mobColor.value = val;
        if (mobHex) mobHex.value = val;
        markCardDesignAsCustom();
      };

      if (deskColor) deskColor.addEventListener('input', e => syncAllDiscColors(e.target.value));
      if (deskHex) deskHex.addEventListener('input', e => syncAllDiscColors(e.target.value));
      if (mobColor) mobColor.addEventListener('input', e => syncAllDiscColors(e.target.value));
      if (mobHex) mobHex.addEventListener('input', e => syncAllDiscColors(e.target.value));
    });

    // Countdown Radius Sliders and Presets (Desktop & Mobile Sync)
    const cdRadiusDesk = document.getElementById('cfg-countdown-radius');
    const cdRadiusMob = document.getElementById('cfg-countdown-radius-mob');

    const handleCdRadiusInput = (val) => {
      const num = parseCountdownRadius(val, 6);
      if (cdRadiusDesk) cdRadiusDesk.value = num;
      if (cdRadiusMob) cdRadiusMob.value = num;
      updateCountdownRadiusPresetButtons(num);
      markCardDesignAsCustom();
    };

    if (cdRadiusDesk) {
      cdRadiusDesk.addEventListener('input', (e) => handleCdRadiusInput(e.target.value));
    }
    if (cdRadiusMob) {
      cdRadiusMob.addEventListener('input', (e) => handleCdRadiusInput(e.target.value));
    }

    document.querySelectorAll('.btn-countdown-radius-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleCdRadiusInput(btn.dataset.value);
      });
    });`;

const newDiscAndCdListeners = `    // 3. Radius Label Diskon (0-12 px, default 8)
    bindRadiusControl({
      deskId: 'cfg-discount-badge-radius',
      mobId: 'cfg-discount-badge-radius-mob',
      presetClass: 'btn-disc-radius-preset',
      parser: parseDiscountBadgeRadius,
      defaultVal: 8,
      minVal: 0,
      maxVal: 12,
      updater: updateDiscountBadgeRadiusPresetButtons
    });

    // Discount Badge Position Buttons (Desktop & Mobile Sync)
    document.querySelectorAll('.btn-disc-pos').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const pos = btn.dataset.pos;
        setDiscountBadgePosition(pos);
        markCardDesignAsCustom();
      });
    });

    // Discount Badge Colors (Desktop & Mobile Sync)
    const discColorPairs = [
      { color: 'cfg-discount-badge-text-color', hex: 'cfg-discount-badge-text-hex' },
      { color: 'cfg-discount-badge-bg-color', hex: 'cfg-discount-badge-bg-hex' }
    ];
    discColorPairs.forEach(pair => {
      const deskColor = document.getElementById(pair.color);
      const deskHex = document.getElementById(pair.hex);
      const mobColor = document.getElementById(\`\${pair.color}-mob\`);
      const mobHex = document.getElementById(\`\${pair.hex}-mob\`);

      const syncAllDiscColors = (val) => {
        if (deskColor) deskColor.value = val;
        if (deskHex) deskHex.value = val;
        if (mobColor) mobColor.value = val;
        if (mobHex) mobHex.value = val;
        markCardDesignAsCustom();
      };

      if (deskColor) deskColor.addEventListener('input', e => syncAllDiscColors(e.target.value));
      if (deskHex) deskHex.addEventListener('input', e => syncAllDiscColors(e.target.value));
      if (mobColor) mobColor.addEventListener('input', e => syncAllDiscColors(e.target.value));
      if (mobHex) mobHex.addEventListener('input', e => syncAllDiscColors(e.target.value));
    });

    // 4. Radius Countdown (0-12 px, default 6)
    bindRadiusControl({
      deskId: 'cfg-countdown-radius',
      mobId: 'cfg-countdown-radius-mob',
      presetClass: 'btn-countdown-radius-preset',
      parser: parseCountdownRadius,
      defaultVal: 6,
      minVal: 0,
      maxVal: 12,
      updater: updateCountdownRadiusPresetButtons
    });`;

if (!code.includes(oldDiscAndCdListeners)) {
  console.error('ERROR: oldDiscAndCdListeners not found');
} else {
  code = code.replace(oldDiscAndCdListeners, newDiscAndCdListeners);
  console.log('✓ Discount & Countdown listeners replaced');
}

fs.writeFileSync('js/product-form.js', code, 'utf8');
console.log('All changes written to js/product-form.js successfully!');


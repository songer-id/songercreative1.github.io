const fs = require('fs');
let code = fs.readFileSync('js/product-form.js', 'utf8');
const lines = code.split('\n');
const targetSlice = lines.slice(2695, 2708).join('\n');
console.log('Target found:', code.includes(targetSlice));

const replacement = `                      <div class="col-span-2 space-y-1.5 pt-1">
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

code = code.replace(targetSlice, replacement);
fs.writeFileSync('js/product-form.js', code, 'utf8');
console.log('✓ Desktop Card Radius replaced!');


const fs = require('fs');

let bs = fs.readFileSync('js/buyer-store.js', 'utf8');

const target1 = `    // Konfigurasi Footer 1 (Strip Atas) - Utamakan custom_footer_1 per-produk
    const f1Obj = prod.custom_footer_1 || {};
    const footer1Text = f1Obj.text || prod.card_footer_text || prod.footer_badge_text || config.footer_text || 'Proses Hanya Dalam 1Jam';
    const footer1Icon = f1Obj.icon || prod.footer_badge_icon || config.footer_icon || 'truck';
    const footer1Bg = f1Obj.bg_color || prod.footer_bg_color || config.footer_bg_color || '#059669';
    const footer1TextColor = f1Obj.text_color || prod.footer_text_color || config.footer_text_color || '#ffffff';

    // Konfigurasi Footer 2 (Strip Bawah / Wadah Countdown) - Utamakan custom_footer_2 per-produk
    const f2Obj = prod.custom_footer_2 || {};
    const footer2Text = f2Obj.text || prod.card_footer_2_text || config.footer_2_text || 'Variasi Paket Tersedia/tidak tersedia';
    const footer2Icon = f2Obj.icon || prod.footer_2_badge_icon || config.footer_2_icon || 'minus';
    const footer2Bg = f2Obj.bg_color || prod.footer_2_bg_color || config.footer_2_bg_color || '#047857';
    const footer2TextColor = f2Obj.text_color || prod.footer_2_text_color || config.footer_2_text_color || '#ffffff';`;

const repl1 = `    // Konfigurasi Footer 1 (Strip Atas) - Utamakan custom_footer_1 per-produk
    const f1Obj = prod.custom_footer_1 || {};
    const footer1Text = (f1Obj.text !== undefined ? f1Obj.text : (prod.card_footer_text !== undefined ? prod.card_footer_text : (prod.footer_badge_text || config.footer_text || ''))).trim();
    const footer1Icon = f1Obj.icon || prod.footer_badge_icon || config.footer_icon || 'truck';
    const footer1Bg = f1Obj.bg_color || prod.footer_bg_color || config.footer_bg_color || '#059669';
    const footer1TextColor = f1Obj.text_color || prod.footer_text_color || config.footer_text_color || '#ffffff';

    // Konfigurasi Footer 2 (Strip Bawah / Wadah Countdown) - Utamakan custom_footer_2 per-produk
    const f2Obj = prod.custom_footer_2 || {};
    const footer2Text = (f2Obj.text !== undefined ? f2Obj.text : (prod.card_footer_2_text !== undefined ? prod.card_footer_2_text : (config.footer_2_text || ''))).trim();
    const footer2Icon = f2Obj.icon || prod.footer_2_badge_icon || config.footer_2_icon || 'minus';
    const footer2Bg = f2Obj.bg_color || prod.footer_2_bg_color || config.footer_2_bg_color || '#047857';
    const footer2TextColor = f2Obj.text_color || prod.footer_2_text_color || config.footer_2_text_color || '#ffffff';

    const hasFooter1 = Boolean(footer1Text);
    const hasFooter2 = countdownInfo.is_active || Boolean(footer2Text);

    let footerHtml = '';
    if (hasFooter1 || hasFooter2) {
      footerHtml = \`
        <!-- Dua Strip Horizontal Footer di Bagian Bawah Kartu (Tinggi Tetap Presisi Sama) -->
        <div class="w-full shrink-0 mt-auto flex flex-col">
          <!-- Footer 1 (Atas): Proses Cepat -->
          \${hasFooter1 ? \`
            <div class="w-full text-[10px] sm:text-[11px] font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5 tracking-wide shrink-0 \${hasFooter2 ? 'border-b border-black/10' : 'rounded-b-2xl'}" style="background-color: \${footer1Bg}; color: \${footer1TextColor};">
              \${(footer1Icon && footer1Icon !== 'none') ? \`<i data-lucide="\${escapeHtml(footer1Icon)}" class="w-3.5 h-3.5 shrink-0"></i>\` : ''}
              <span class="truncate">\${escapeHtml(footer1Text)}</span>
            </div>
          \` : ''}

          <!-- Footer 2 (Bawah): Bilah Diskon Countdown saat Promo Aktif, atau Info Paket saat Promo Off -->
          \${hasFooter2 ? (
            countdownInfo.is_active ? \`
              <div class="w-full text-[10px] sm:text-[11px] font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5 rounded-b-2xl tracking-wide shrink-0" style="background-color: \${countdownBg}; color: \${countdownTextColor};" title="\${escapeHtml(countdownInfo.label_full)}">
                <i data-lucide="ticket-percent" class="w-3.5 h-3.5 shrink-0" style="color: \${countdownIconColor};"></i>
                <span class="truncate">\${escapeHtml(countdownInfo.footer_label)}</span>
              </div>
            \` : \`
              <div class="w-full text-[10px] sm:text-[11px] font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5 rounded-b-2xl tracking-wide shrink-0" style="background-color: \${footer2Bg}; color: \${footer2TextColor};">
                \${(footer2Icon && footer2Icon !== 'none') ? \`<i data-lucide="\${escapeHtml(footer2Icon)}" class="w-3.5 h-3.5 shrink-0"></i>\` : ''}
                <span class="truncate">\${escapeHtml(footer2Text)}</span>
              </div>
            \`
          ) : ''}
        </div>
      \`;
    }`;

if (!bs.includes(target1)) throw new Error('target1 in buyer-store.js not found');
bs = bs.replace(target1, repl1);

const target2 = `        <!-- Dua Strip Horizontal Footer di Bagian Bawah Kartu (Tinggi Tetap Presisi Sama) -->
        <div class="w-full shrink-0 mt-auto flex flex-col">
          <!-- Footer 1 (Atas): Proses Cepat -->
          <div class="w-full text-[10px] sm:text-[11px] font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5 tracking-wide shrink-0 border-b border-black/10" style="background-color: \${footer1Bg}; color: \${footer1TextColor};">
            <i data-lucide="\${escapeHtml(footer1Icon)}" class="w-3.5 h-3.5 shrink-0"></i>
            <span class="truncate">\${escapeHtml(footer1Text)}</span>
          </div>

          <!-- Footer 2 (Bawah): Bilah Diskon Countdown saat Promo Aktif, atau Info Paket saat Promo Off -->
          \${countdownInfo.is_active ? \`
            <div class="w-full text-[10px] sm:text-[11px] font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5 rounded-b-2xl tracking-wide shrink-0" style="background-color: \${countdownBg}; color: \${countdownTextColor};" title="\${escapeHtml(countdownInfo.label_full)}">
              <i data-lucide="ticket-percent" class="w-3.5 h-3.5 shrink-0" style="color: \${countdownIconColor};"></i>
              <span class="truncate">\${escapeHtml(countdownInfo.footer_label)}</span>
            </div>
          \` : \`
            <div class="w-full text-[10px] sm:text-[11px] font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5 rounded-b-2xl tracking-wide shrink-0" style="background-color: \${footer2Bg}; color: \${footer2TextColor};">
              <i data-lucide="\${escapeHtml(footer2Icon)}" class="w-3.5 h-3.5 shrink-0"></i>
              <span class="truncate">\${escapeHtml(footer2Text)}</span>
            </div>
          \`}
        </div>`;

const repl2 = `        \${footerHtml}`;

if (!bs.includes(target2)) throw new Error('target2 in buyer-store.js not found');
bs = bs.replace(target2, repl2);

fs.writeFileSync('js/buyer-store.js', bs, 'utf8');
console.log('Successfully updated js/buyer-store.js');


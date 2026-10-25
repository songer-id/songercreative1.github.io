/**
 * ==============================================================================
 * POS BY SONGER CREATIVE - STANDALONE SETTINGS CONTROLLER (SETTINGS.JS)
 * Manages Store Identity, Dual-Color Theme, Visual Branding & Thermal POS Format
 * Location: D:\pos-songer-creative\js\settings.js
 * ==============================================================================
 */

(function () {
  'use strict';

  // Temporary Image Upload States (Base64 Data URLs)
  let currentWebLogo = null;
  let currentFavicon = null;

  // Initialize Page
  document.addEventListener('DOMContentLoaded', () => {
    loadSettingsIntoForm();
    bindColorListeners();
    bindImageUploadListeners();
    bindPrinterWidthListeners();
    bindActionButtons();
    if (window.lucide) window.lucide.createIcons();
  });

  // --- 1. LOAD SETTINGS FROM DB ---

  function loadSettingsIntoForm() {
    const s = DB.getSettings();

    // Identitas Toko
    setValue('settings-store-name', s.store_name || 'Songer Creative');
    setValue('settings-store-tagline', s.store_tagline || 'Digital Printing & Percetakan Terpadu');
    setValue('settings-store-address', s.store_address || 'Jl. Raya Percetakan Kreatif No. 88, Kota Anda');
    setValue('settings-store-phone', s.store_phone || '0888-5844-380');

    // Sistem 2 Warna
    const primary = s.primary_color || '#33b589';
    const secondary = s.secondary_color || '#f59e0b';

    setValue('settings-primary-color', primary);
    setValue('settings-primary-color-text', primary);
    setValue('settings-secondary-color', secondary);
    setValue('settings-secondary-color-text', secondary);

    updateLiveThemeColors(primary, secondary);

    // Visual Branding
    currentWebLogo = s.web_logo || 'assets/images/logo-songer-creative.png';
    currentFavicon = s.browser_icon || 'assets/images/songer-logo.png';

    const webLogoImg = document.getElementById('preview-settings-weblogo');
    if (webLogoImg) webLogoImg.src = currentWebLogo;

    const faviconImg = document.getElementById('preview-settings-favicon');
    if (faviconImg) faviconImg.src = currentFavicon;

    // Header Logo & Favicon
    const headerLogo = document.getElementById('header-brand-logo');
    if (headerLogo) headerLogo.src = currentWebLogo;

    const appFav = document.getElementById('app-favicon');
    if (appFav) appFav.href = currentFavicon;

    // Format Struk Thermal
    const paperWidth = s.printer_paper_width || '58mm';
    const radios = document.querySelectorAll('input[name="printer_paper_width"]');
    radios.forEach(r => {
      r.checked = (r.value === paperWidth);
    });
    updatePrinterWidthCards(paperWidth);

    setValue('settings-receipt-footer', s.receipt_footer || 'Terima kasih atas pesanan Anda!\nBarang yang sudah dicetak tidak dapat ditukar/dikembalikan.');
  }

  // --- 2. DUAL-COLOR THEME & LIVE PREVIEW ---

  function bindColorListeners() {
    const primaryPicker = document.getElementById('settings-primary-color');
    const primaryText = document.getElementById('settings-primary-color-text');
    const secondaryPicker = document.getElementById('settings-secondary-color');
    const secondaryText = document.getElementById('settings-secondary-color-text');

    // Primary Picker -> Text & Live Preview
    if (primaryPicker) {
      primaryPicker.addEventListener('input', (e) => {
        const val = e.target.value;
        if (primaryText) primaryText.value = val.toUpperCase();
        updateLiveThemeColors(val, getSecondaryColor());
      });
    }

    // Primary Text -> Picker & Live Preview
    if (primaryText) {
      primaryText.addEventListener('input', (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          if (primaryPicker) primaryPicker.value = val;
          updateLiveThemeColors(val, getSecondaryColor());
        }
      });
    }

    // Secondary Picker -> Text & Live Preview
    if (secondaryPicker) {
      secondaryPicker.addEventListener('input', (e) => {
        const val = e.target.value;
        if (secondaryText) secondaryText.value = val.toUpperCase();
        updateLiveThemeColors(getPrimaryColor(), val);
      });
    }

    // Secondary Text -> Picker & Live Preview
    if (secondaryText) {
      secondaryText.addEventListener('input', (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          if (secondaryPicker) secondaryPicker.value = val;
          updateLiveThemeColors(getPrimaryColor(), val);
        }
      });
    }

    // 6 Preset Pasangan Warna Siap Pakai
    document.querySelectorAll('.btn-dual-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.getAttribute('data-primary');
        const s = btn.getAttribute('data-secondary');
        if (p && s) {
          if (primaryPicker) primaryPicker.value = p;
          if (primaryText) primaryText.value = p.toUpperCase();
          if (secondaryPicker) secondaryPicker.value = s;
          if (secondaryText) secondaryText.value = s.toUpperCase();
          updateLiveThemeColors(p, s);
          showToast(`Preset warna diterapkan: ${p} & ${s}`, 'info');
        }
      });
    });

    // Reset Color Default
    const btnResetCol = document.getElementById('btn-reset-color-default');
    if (btnResetCol) {
      btnResetCol.addEventListener('click', () => {
        const p = '#33b589';
        const s = '#f59e0b';
        if (primaryPicker) primaryPicker.value = p;
        if (primaryText) primaryText.value = p;
        if (secondaryPicker) secondaryPicker.value = s;
        if (secondaryText) secondaryText.value = s;
        updateLiveThemeColors(p, s);
        showToast('Tema warna dikembalikan ke Mint + Amber (Default).', 'info');
      });
    }
  }

  function getPrimaryColor() {
    const p = document.getElementById('settings-primary-color');
    return p ? p.value : '#33b589';
  }

  function getSecondaryColor() {
    const s = document.getElementById('settings-secondary-color');
    return s ? s.value : '#f59e0b';
  }

  function updateLiveThemeColors(primary, secondary) {
    // 1. Root CSS Variables
    const root = document.documentElement;
    const primaryHover = adjustColorBrightness(primary, -15);
    const primarySubtle = hexToRgba(primary, 0.12);

    const secondaryHover = adjustColorBrightness(secondary, -15);
    const secondarySubtle = hexToRgba(secondary, 0.14);

    root.style.setProperty('--color-primary', primary);
    root.style.setProperty('--color-primary-hover', primaryHover);
    root.style.setProperty('--color-primary-subtle', primarySubtle);

    root.style.setProperty('--color-secondary', secondary);
    root.style.setProperty('--color-secondary-hover', secondaryHover);
    root.style.setProperty('--color-secondary-subtle', secondarySubtle);

    // 2. Indicators & Live Preview Boxes
    const indP = document.getElementById('indicator-primary');
    if (indP) indP.style.backgroundColor = primary;

    const indS = document.getElementById('indicator-secondary');
    if (indS) indS.style.backgroundColor = secondary;

    const boxP = document.getElementById('preview-box-primary');
    if (boxP) boxP.style.backgroundColor = primary;

    const badgeS = document.getElementById('preview-badge-secondary');
    if (badgeS) badgeS.style.backgroundColor = secondary;

    const btnS = document.getElementById('preview-btn-secondary');
    if (btnS) btnS.style.backgroundColor = secondary;
  }

  // --- 3. VISUAL BRANDING UPLOADS ---

  function bindImageUploadListeners() {
    // Web Logo Upload
    const inputWebLogo = document.getElementById('input-settings-weblogo');
    if (inputWebLogo) {
      inputWebLogo.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            currentWebLogo = evt.target.result;
            const preview = document.getElementById('preview-settings-weblogo');
            if (preview) preview.src = currentWebLogo;
            const headerLogo = document.getElementById('header-brand-logo');
            if (headerLogo) headerLogo.src = currentWebLogo;
            showToast('Logo website terpilih! Klik "Simpan Perubahan" untuk menyimpan.', 'info');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Reset Web Logo Default
    const btnResetWebLogo = document.getElementById('btn-reset-weblogo-default');
    if (btnResetWebLogo) {
      btnResetWebLogo.addEventListener('click', () => {
        currentWebLogo = 'assets/images/logo-songer-creative.png';
        const preview = document.getElementById('preview-settings-weblogo');
        if (preview) preview.src = currentWebLogo;
        const headerLogo = document.getElementById('header-brand-logo');
        if (headerLogo) headerLogo.src = currentWebLogo;
        const fileInput = document.getElementById('input-settings-weblogo');
        if (fileInput) fileInput.value = '';
        showToast('Logo website dikembalikan ke bawaan.', 'info');
      });
    }

    // Favicon Upload
    const inputFavicon = document.getElementById('input-settings-favicon');
    if (inputFavicon) {
      inputFavicon.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            currentFavicon = evt.target.result;
            const preview = document.getElementById('preview-settings-favicon');
            if (preview) preview.src = currentFavicon;
            const appFav = document.getElementById('app-favicon');
            if (appFav) appFav.href = currentFavicon;
            showToast('Favicon browser terpilih! Klik "Simpan Perubahan" untuk menyimpan.', 'info');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Reset Favicon Default
    const btnResetFavicon = document.getElementById('btn-reset-favicon-default');
    if (btnResetFavicon) {
      btnResetFavicon.addEventListener('click', () => {
        currentFavicon = 'assets/images/songer-logo.png';
        const preview = document.getElementById('preview-settings-favicon');
        if (preview) preview.src = currentFavicon;
        const appFav = document.getElementById('app-favicon');
        if (appFav) appFav.href = currentFavicon;
        const fileInput = document.getElementById('input-settings-favicon');
        if (fileInput) fileInput.value = '';
        showToast('Favicon browser dikembalikan ke bawaan.', 'info');
      });
    }
  }

  // --- 4. FORMAT STRUK THERMAL POS ---

  function bindPrinterWidthListeners() {
    const radios = document.querySelectorAll('input[name="printer_paper_width"]');
    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        updatePrinterWidthCards(e.target.value);
      });
    });
  }

  function updatePrinterWidthCards(activeVal) {
    document.querySelectorAll('.label-printer-width').forEach(lbl => {
      const val = lbl.getAttribute('data-val');
      if (val === activeVal) {
        lbl.className = 'label-printer-width relative p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20 cursor-pointer transition flex items-start gap-3';
      } else {
        lbl.className = 'label-printer-width relative p-4 rounded-2xl border-2 border-slate-200 hover:border-slate-300 bg-white cursor-pointer transition flex items-start gap-3';
      }
    });
  }

  // --- 5. SAVE & RESET BUTTONS ---

  function bindActionButtons() {
    // Simpan Perubahan
    const btnSave = document.getElementById('btn-save-settings');
    if (btnSave) {
      btnSave.addEventListener('click', saveSettings);
    }

    // Reset All Settings ke Bawaan
    const btnResetAll = document.getElementById('btn-reset-all-settings');
    if (btnResetAll) {
      btnResetAll.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin mengembalikan seluruh pengaturan toko ke data bawaan awal?')) {
          DB.resetSettings();
          loadSettingsIntoForm();
          showToast('Seluruh pengaturan toko berhasil dikembalikan ke default!', 'success');
        }
      });
    }
  }

  function saveSettings() {
    const storeName = getValue('settings-store-name').trim() || 'Songer Creative';
    const storeTagline = getValue('settings-store-tagline').trim();
    const storeAddress = getValue('settings-store-address').trim();
    const storePhone = getValue('settings-store-phone').trim() || '0888-5844-380';

    const primaryColor = getPrimaryColor();
    const secondaryColor = getSecondaryColor();
    const primaryHover = adjustColorBrightness(primaryColor, -15);
    const secondaryHover = adjustColorBrightness(secondaryColor, -15);

    let paperWidth = '58mm';
    const checkedRadio = document.querySelector('input[name="printer_paper_width"]:checked');
    if (checkedRadio) paperWidth = checkedRadio.value;

    const receiptFooter = getValue('settings-receipt-footer').trim();

    const payload = {
      store_name: storeName,
      store_tagline: storeTagline,
      store_address: storeAddress,
      store_phone: storePhone,
      primary_color: primaryColor,
      primary_hover_color: primaryHover,
      secondary_color: secondaryColor,
      secondary_hover_color: secondaryHover,
      web_logo: currentWebLogo,
      browser_icon: currentFavicon,
      printer_paper_width: paperWidth,
      receipt_footer: receiptFooter
    };

    // Save directly to DB
    const saved = DB.updateSettings(payload);

    // Apply Live Changes Immediately
    updateLiveThemeColors(saved.primary_color, saved.secondary_color);

    // Update document title & favicon
    document.title = `Pengaturan Toko - ${saved.store_name}`;
    const appFav = document.getElementById('app-favicon');
    if (appFav && saved.browser_icon) appFav.href = saved.browser_icon;

    // Show SUCCESS Toast Notification
    showToast('Pengaturan Berhasil Disimpan!', 'success');
  }

  // --- HELPERS ---

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-slide-in pointer-events-auto border transition-all duration-300 ${
      type === 'success' 
        ? 'bg-emerald-800 text-white border-emerald-700 shadow-emerald-900/20' 
        : type === 'error'
        ? 'bg-red-800 text-white border-red-700'
        : 'bg-slate-800 text-white border-slate-700'
    }`;

    const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info';
    toast.innerHTML = `
      <i data-lucide="${iconName}" class="w-5 h-5 text-emerald-300 shrink-0"></i>
      <span class="flex-1">${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.classList.add('opacity-0', '-translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function adjustColorBrightness(hex, percent = -15) {
    if (typeof Utils !== 'undefined' && typeof Utils.adjustColorBrightness === 'function') {
      return Utils.adjustColorBrightness(hex, percent);
    }
    if (!hex || typeof hex !== 'string') return '#28916d';
    let clean = hex.replace('#', '').trim();
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    if (clean.length !== 6) return '#28916d';
    let num = parseInt(clean, 16);
    if (isNaN(num)) return '#28916d';
    let amt = Math.round(2.55 * percent);
    let R = (num >> 16) + amt;
    let G = (num >> 8 & 0x00FF) + amt;
    let B = (num & 0x0000FF) + amt;
    return '#' + (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
  }

  function hexToRgba(hex, alpha = 1) {
    if (typeof Utils !== 'undefined' && typeof Utils.hexToRgba === 'function') {
      return Utils.hexToRgba(hex, alpha);
    }
    let c = hex.replace('#', '');
    if (c.length === 3) {
      c = c.split('').map(x => x + x).join('');
    }
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function escapeHtml(str) {
    if (typeof Utils !== 'undefined' && typeof Utils.escapeHtml === 'function') {
      return Utils.escapeHtml(str);
    }
    if (!str) return '';
    return str.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

})();

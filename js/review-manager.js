/**
 * Songer Creative - Seller Review & Testimonial Moderation Manager
 * Mega Refactor Stage 4:
 *  - Actions: Setujui (Approve), Tolak (Reject), Hapus (Delete)
 *  - Support for Anonymous Reviewer Masking
 */

const ReviewManager = (() => {
  let filterStatus = 'all'; // 'all' | 'pending' | 'approved' | 'rejected'

  function init() {
    render();
    bindEvents();
  }

  function render() {
    const container = document.getElementById('review-manager-container');
    if (!container) return;

    let reviews = DB.getReviews(null, false);
    const totalCount = reviews.length;
    const approvedCount = reviews.filter(r => r.is_approved).length;
    const pendingCount = reviews.filter(r => !r.is_approved && r.status !== 'rejected').length;
    const rejectedCount = reviews.filter(r => r.status === 'rejected').length;

    // Filter list
    if (filterStatus === 'pending') {
      reviews = reviews.filter(r => !r.is_approved && r.status !== 'rejected');
    } else if (filterStatus === 'approved') {
      reviews = reviews.filter(r => r.is_approved);
    } else if (filterStatus === 'rejected') {
      reviews = reviews.filter(r => r.status === 'rejected');
    }

    const avgRating = totalCount > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)).toFixed(1)
      : '5.0';

    container.innerHTML = `
      <div class="space-y-6 max-w-6xl mx-auto pb-16">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
              <span>Seller Center</span> <span>/</span> <span class="text-slate-800 font-semibold">Toko</span>
            </div>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Ulasan & Testimoni</h1>
            <p class="text-xs text-slate-500 mt-0.5">Moderasi ulasan bintang pembeli. Aksi: Setujui untuk tampil di web, Tolak, atau Hapus.</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-slate-600">Filter Status:</span>
            <select id="select-review-filter" class="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none bg-white focus:border-emerald-500">
              <option value="all" ${filterStatus === 'all' ? 'selected' : ''}>Semua Ulasan (${totalCount})</option>
              <option value="pending" ${filterStatus === 'pending' ? 'selected' : ''}>Menunggu Moderasi (${pendingCount})</option>
              <option value="approved" ${filterStatus === 'approved' ? 'selected' : ''}>Sudah Disetujui (${approvedCount})</option>
              <option value="rejected" ${filterStatus === 'rejected' ? 'selected' : ''}>Ditolak (${rejectedCount})</option>
            </select>
          </div>
        </div>

        <!-- Metric Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span class="text-[11px] font-semibold text-slate-400 block uppercase">Total Ulasan Masuk</span>
            <div class="text-2xl font-black text-slate-900">${totalCount}</div>
          </div>
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span class="text-[11px] font-semibold text-emerald-600 block uppercase">Tampil di Web</span>
            <div class="text-2xl font-black text-emerald-600">${approvedCount}</div>
          </div>
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span class="text-[11px] font-semibold text-amber-600 block uppercase">Perlu Moderasi</span>
            <div class="text-2xl font-black text-amber-600">${pendingCount}</div>
          </div>
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span class="text-[11px] font-semibold text-yellow-600 block uppercase">Rata-rata Rating</span>
            <div class="text-2xl font-black text-slate-900 flex items-center gap-1">
              <span class="text-amber-500">★</span> <span>${avgRating}</span>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                  <th class="p-4 w-44">Nama Pembeli & Waktu</th>
                  <th class="p-4 w-48">Produk Terkait</th>
                  <th class="p-4 w-28">Rating</th>
                  <th class="p-4">Komentar & Foto</th>
                  <th class="p-4 w-32 text-center">Status Moderasi</th>
                  <th class="p-4 w-36 text-center">Aksi Moderasi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${reviews.length === 0 ? `
                  <tr>
                    <td colspan="6" class="p-10 text-center text-slate-400 text-xs">
                      Tidak ada ulasan ditemukan untuk filter ini.
                    </td>
                  </tr>
                ` : reviews.map(renderReviewRow).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  function renderReviewRow(rev) {
    const stars = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
    const dateFormatted = new Date(rev.created_at).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    let statusBadge = '';
    if (rev.is_approved) {
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
          <i data-lucide="check-circle-2" class="w-3 h-3 text-emerald-600"></i>
          Disetujui
        </span>
      `;
    } else if (rev.status === 'rejected') {
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-800">
          <i data-lucide="x-circle" class="w-3 h-3 text-red-600"></i>
          Ditolak
        </span>
      `;
    } else {
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
          <i data-lucide="clock" class="w-3 h-3 text-amber-600"></i>
          Menunggu
        </span>
      `;
    }

    return `
      <tr class="hover:bg-slate-50/80 transition" data-id="${rev.id}">
        <!-- Pembeli & Waktu -->
        <td class="p-4">
          <div class="font-bold text-slate-900">${escapeHtml(rev.customer_name)}</div>
          ${rev.is_anonymous ? '<span class="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">Anonim</span>' : ''}
          <div class="text-[11px] text-slate-400 mt-0.5">${dateFormatted}</div>
        </td>

        <!-- Produk -->
        <td class="p-4">
          <span class="font-semibold text-emerald-700 hover:underline line-clamp-2">
            ${escapeHtml(rev.product_name)}
          </span>
        </td>

        <!-- Rating -->
        <td class="p-4">
          <div class="text-amber-500 font-bold text-sm tracking-widest">${stars}</div>
          <span class="text-[10px] text-slate-400 font-semibold">${rev.rating} dari 5 Bintang</span>
        </td>

        <!-- Komentar & Foto -->
        <td class="p-4">
          <p class="text-slate-700 leading-relaxed">${escapeHtml(rev.comment)}</p>
          ${rev.image_url ? `
            <div class="mt-2 w-14 h-14 rounded-lg border border-slate-200 overflow-hidden shadow-xs cursor-pointer group" onclick="window.open('${rev.image_url}', '_blank')">
              <img src="${rev.image_url}" class="w-full h-full object-cover group-hover:scale-110 transition" alt="Foto Ulasan" />
            </div>
          ` : ''}

          <!-- Balasan Seller (Jika ada) -->
          ${rev.seller_reply ? `
            <div class="mt-2.5 p-2.5 bg-emerald-50/80 border-l-2 border-emerald-500 rounded-r-xl text-xs space-y-1">
              <div class="flex items-center justify-between text-[10px] font-bold text-emerald-800">
                <span class="flex items-center gap-1">
                  <i data-lucide="message-square" class="w-3 h-3 text-emerald-600"></i> Balasan Toko (Tampil di Web):
                </span>
                <span class="text-[9px] text-slate-400 font-normal">
                  ${rev.seller_reply_at ? new Date(rev.seller_reply_at).toLocaleDateString('id-ID') : ''}
                </span>
              </div>
              <p class="text-slate-700 leading-relaxed text-[11px]">${escapeHtml(rev.seller_reply)}</p>
            </div>
          ` : ''}

          <!-- Form Balas Ulasan (Collapsible) -->
          <div id="reply-box-${rev.id}" class="hidden mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label class="block text-[11px] font-bold text-slate-700">Tulis Balasan Toko untuk Pelanggan:</label>
            <textarea id="reply-input-${rev.id}" class="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-white" rows="2" placeholder="Contoh: Terima kasih banyak atas ulasannya kak! Ditunggu orderan berikutnya ya...">${rev.seller_reply || ''}</textarea>
            <div class="flex items-center justify-end gap-2">
              <button type="button" class="btn-cancel-reply px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-200 text-xs font-semibold" data-id="${rev.id}">
                Batal
              </button>
              <button type="button" class="btn-submit-reply px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1" data-id="${rev.id}">
                <i data-lucide="send" class="w-3 h-3"></i> Simpan Balasan
              </button>
            </div>
          </div>
        </td>

        <!-- Status Moderasi -->
        <td class="p-4 text-center">
          ${statusBadge}
        </td>

        <!-- Aksi: Setujui, Tolak, Balas, Hapus -->
        <td class="p-4 text-center">
          <div class="flex flex-col gap-1.5 items-center justify-center">
            <div class="flex items-center gap-1">
              <!-- Setujui (Approve) -->
              <button type="button" class="btn-approve-review px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 transition font-bold text-[10px]" data-id="${rev.id}" title="Setujui dan tampilkan di toko web">
                Setujui
              </button>

              <!-- Tolak (Reject) -->
              <button type="button" class="btn-reject-review px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white border border-amber-200 transition font-bold text-[10px]" data-id="${rev.id}" title="Tolak dan sembunyikan dari etalase">
                Tolak
              </button>
            </div>

            <div class="flex items-center gap-1">
              <!-- Balas Ulasan Toggle -->
              <button type="button" class="btn-toggle-reply px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white border border-sky-200 transition font-bold text-[10px] flex items-center gap-1" data-id="${rev.id}" title="Balas ulasan pelanggan">
                <i data-lucide="message-circle" class="w-3 h-3"></i>
                <span>${rev.seller_reply ? 'Ubah Balasan' : 'Balas'}</span>
              </button>

              <!-- Hapus (Delete) -->
              <button type="button" class="btn-delete-review p-1 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition" data-id="${rev.id}" title="Hapus ulasan secara permanen">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
        </td>
      </tr>
    `;
  }

  function bindEvents() {
    // Filter change
    const selectFilter = document.getElementById('select-review-filter');
    if (selectFilter) {
      selectFilter.addEventListener('change', e => {
        filterStatus = e.target.value;
        render();
        bindEvents();
      });
    }

    // Toggle Balas Box
    document.querySelectorAll('.btn-toggle-reply').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const box = document.getElementById(`reply-box-${id}`);
        if (box) {
          box.classList.toggle('hidden');
          const input = document.getElementById(`reply-input-${id}`);
          if (input && !box.classList.contains('hidden')) input.focus();
        }
      });
    });

    // Batal Balas
    document.querySelectorAll('.btn-cancel-reply').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const box = document.getElementById(`reply-box-${id}`);
        if (box) box.classList.add('hidden');
      });
    });

    // Simpan Balasan
    document.querySelectorAll('.btn-submit-reply').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const input = document.getElementById(`reply-input-${id}`);
        const replyText = input ? input.value.trim() : '';

        if (!replyText) {
          alert('Mohon ketikkan kalimat balasan untuk pelanggan.');
          return;
        }

        DB.replyReview(id, replyText);
        const toastFn = window.AdminApp?.showToast || window.App?.showToast || alert;
        toastFn('Balasan ulasan berhasil disimpan & akan tampil di halaman produk!', 'success');
        if (window.AdminApp?.updateSidebarBadgeCounts) {
          window.AdminApp.updateSidebarBadgeCounts();
        }
        render();
        bindEvents();
      });
    });

    // Setujui (Approve) Button
    document.querySelectorAll('.btn-approve-review').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        DB.updateReviewStatus(id, 'approved');
        const toastFn = window.AdminApp?.showToast || window.App?.showToast || alert;
        toastFn('Ulasan disetujui & sekarang tampil di etalase toko web!', 'success');
        if (window.AdminApp?.updateSidebarBadgeCounts) {
          window.AdminApp.updateSidebarBadgeCounts();
        }
        render();
        bindEvents();
      });
    });

    // Tolak (Reject) Button
    document.querySelectorAll('.btn-reject-review').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        DB.updateReviewStatus(id, 'rejected');
        const toastFn = window.AdminApp?.showToast || window.App?.showToast || alert;
        toastFn('Ulasan ditolak dan disembunyikan dari etalase pembeli.', 'info');
        if (window.AdminApp?.updateSidebarBadgeCounts) {
          window.AdminApp.updateSidebarBadgeCounts();
        }
        render();
        bindEvents();
      });
    });

    // Hapus (Delete) Button
    document.querySelectorAll('.btn-delete-review').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Hapus ulasan ini secara permanen dari database?')) {
          DB.deleteReview(id);
          const toastFn = window.AdminApp?.showToast || window.App?.showToast || alert;
          toastFn('Ulasan berhasil dihapus secara permanen.', 'info');
          if (window.AdminApp?.updateSidebarBadgeCounts) {
            window.AdminApp.updateSidebarBadgeCounts();
          }
          render();
          bindEvents();
        }
      });
    });
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

  return {
    init
  };
})();

window.ReviewManager = ReviewManager;

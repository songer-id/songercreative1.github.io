/**
 * Songer Creative - Centralized Customer Relationship Management (CRM) Engine
 * Multi-Tenant Customer Directory, Order History Aggregator, & WhatsApp Direct Sapa Cepat
 */

const CustomerManager = (() => {
  let activeSegment = 'all'; // 'all' | 'retail' | 'member' | 'vip' | 'grosir'
  let searchQuery = '';
  let editingCustomerId = null;

  function formatIDR(num) {
    if (typeof Utils !== 'undefined' && typeof Utils.formatIDR === 'function') {
      return Utils.formatIDR(num);
    }
    if (isNaN(num) || num === null || num === undefined) return 'Rp0';
    return 'Rp' + Math.round(num).toLocaleString('id-ID');
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

  function normalizePhone(raw) {
    if (!raw) return '';
    const digits = String(raw).replace(/\D/g, '');
    if (digits.startsWith('0')) return '62' + digits.slice(1);
    return digits;
  }

  function getTenantId() {
    return (typeof DB !== 'undefined' && DB.getCurrentTenant)
      ? DB.getCurrentTenant().id || DB.getCurrentTenant().tenant_id || 'songer-creative-01'
      : 'songer-creative-01';
  }

  // ----------------------------------------------------------------------------
  // 1. DATA AGGREGATOR & ENRICHMENT
  // ----------------------------------------------------------------------------
  function getEnrichedCustomers() {
    const tid = getTenantId();
    const storedCustomers = (typeof DB !== 'undefined' && DB.getCustomers) ? DB.getCustomers(tid) : [];
    const allOrders = (typeof DB !== 'undefined' && DB.getOrders) ? DB.getOrders(tid) : [];

    // Map pelanggan berdasarkan phone dan email untuk agregasi transaksi riil
    const customerMap = new Map();

    storedCustomers.forEach(c => {
      const normP = normalizePhone(c.phone);
      const key = normP || (c.email ? c.email.toLowerCase() : c.id);
      customerMap.set(key, {
        id: c.id,
        name: c.name || 'Pelanggan',
        phone: c.phone || '',
        email: c.email || '',
        address: c.address || '',
        avatar_url: c.avatar_url || '',
        auth_provider: c.auth_provider || 'manual',
        segment: c.segment || 'retail',
        notes: c.notes || '',
        created_at: c.created_at || new Date().toISOString(),
        total_orders: 0,
        total_spent: 0,
        last_order_date: null,
        orders: []
      });
    });

    // Agregasi dari data pesanan aktif di database
    allOrders.forEach(o => {
      const custPhone = o.customer_phone && o.customer_phone !== '-' ? o.customer_phone : '';
      const custName = o.customer_name && o.customer_name !== '-' ? o.customer_name : '';
      const normP = normalizePhone(custPhone);
      const key = normP || (custName ? custName.toLowerCase() : null);

      if (!key) return;

      if (!customerMap.has(key)) {
        // Otomatis masukkan pembeli dari pesanan kasir / Web WA yang belum tercatat
        customerMap.set(key, {
          id: 'cust-auto-' + (normP || DB.generateUUID()),
          name: custName || 'Pelanggan Toko',
          phone: custPhone,
          email: '',
          address: '',
          avatar_url: '',
          auth_provider: 'pos_auto',
          segment: 'retail',
          notes: 'Tercatat otomatis dari pesanan kasir / WhatsApp',
          created_at: o.created_at || new Date().toISOString(),
          total_orders: 0,
          total_spent: 0,
          last_order_date: null,
          orders: []
        });
      }

      const cust = customerMap.get(key);
      cust.total_orders += 1;
      cust.total_spent += Number(o.total || 0);
      cust.orders.push(o);

      const orderTime = new Date(o.created_at || o.date || Date.now()).getTime();
      if (!cust.last_order_date || orderTime > new Date(cust.last_order_date).getTime()) {
        cust.last_order_date = o.created_at || o.date;
      }
    });

    return Array.from(customerMap.values()).sort((a, b) => {
      // Sort by last order date or created_at descending
      const timeA = new Date(a.last_order_date || a.created_at || 0).getTime();
      const timeB = new Date(b.last_order_date || b.created_at || 0).getTime();
      return timeB - timeA;
    });
  }

  // ----------------------------------------------------------------------------
  // 2. MAIN CRM INTERFACE RENDERER
  // ----------------------------------------------------------------------------
  function render(container) {
    if (!container) container = document.getElementById('customer-manager-container');
    if (!container) return;

    const allCustomers = getEnrichedCustomers();

    // Kalkulasi KPI
    const totalCount = allCustomers.length;
    const repeatBuyersCount = allCustomers.filter(c => c.total_orders >= 2).length;
    const totalSpentSum = allCustomers.reduce((acc, c) => acc + c.total_spent, 0);
    const totalOrdersSum = allCustomers.reduce((acc, c) => acc + c.total_orders, 0);
    const aov = totalOrdersSum > 0 ? Math.round(totalSpentSum / totalOrdersSum) : 0;

    // Filter berdasarkan Segmen & Search Query
    const filtered = allCustomers.filter(c => {
      if (activeSegment !== 'all' && c.segment !== activeSegment) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name && c.name.toLowerCase().includes(q);
        const matchPhone = c.phone && c.phone.includes(q);
        const matchEmail = c.email && c.email.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail) return false;
      }
      return true;
    });

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Header & Action Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
                <i class="bi bi-people-fill text-lg"></i>
              </div>
              <h2 class="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Manajemen Pelanggan (CRM)</h2>
            </div>
            <p class="text-xs text-slate-500 mt-1">Direktori pelanggan terpusat, histori omzet transaksi kasir &amp; online, serta sapa cepat WhatsApp.</p>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" id="btn-add-customer-modal" class="px-4 py-2.5 rounded-xl btn-primary-brand text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer">
              <i data-lucide="user-plus" class="w-4 h-4"></i>
              <span>Tambah Pelanggan Baru</span>
            </button>
          </div>
        </div>

        <!-- KPI Summary Metric Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- KPI 1: Total Pelanggan -->
          <div class="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pelanggan</span>
              <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <i class="bi bi-person-badge text-base"></i>
              </div>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-black text-slate-900">${totalCount.toLocaleString('id-ID')}</span>
              <span class="text-[11px] font-semibold text-slate-500">Orang</span>
            </div>
            <p class="text-[10px] text-slate-400">Terdaftar dari Web WA &amp; POS Kasir</p>
          </div>

          <!-- KPI 2: Pelanggan Setia (Repeat Orders) -->
          <div class="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Repeat Buyers</span>
              <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <i class="bi bi-arrow-repeat text-base"></i>
              </div>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-black text-emerald-600">${repeatBuyersCount.toLocaleString('id-ID')}</span>
              <span class="text-[11px] font-semibold text-emerald-700">Pelanggan</span>
            </div>
            <p class="text-[10px] text-slate-400">Pernah belanja &ge; 2 kali transaksi</p>
          </div>

          <!-- KPI 3: Total Omzet dari Pelanggan -->
          <div class="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Omzet Member</span>
              <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <i class="bi bi-wallet2 text-base"></i>
              </div>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="text-xl sm:text-2xl font-black text-slate-900">${formatIDR(totalSpentSum)}</span>
            </div>
            <p class="text-[10px] text-slate-400">Akumulasi dari ${totalOrdersSum} transaksi</p>
          </div>

          <!-- KPI 4: Rata-rata Belanja (AOV) -->
          <div class="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-rata Belanja</span>
              <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <i class="bi bi-graph-up-arrow text-base"></i>
              </div>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="text-xl sm:text-2xl font-black text-amber-700">${formatIDR(aov)}</span>
            </div>
            <p class="text-[10px] text-slate-400">Rerata nilai keranjang belanja (AOV)</p>
          </div>
        </div>

        <!-- Filter & Search Controls -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            <!-- Segment Tabs Filter -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button type="button" class="btn-crm-segment px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeSegment === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-segment="all">
                Semua (${totalCount})
              </button>
              <button type="button" class="btn-crm-segment px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeSegment === 'retail' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-segment="retail">
                Retail / Umum
              </button>
              <button type="button" class="btn-crm-segment px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeSegment === 'member' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-segment="member">
                Member Aktif
              </button>
              <button type="button" class="btn-crm-segment px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeSegment === 'vip' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-segment="vip">
                VIP / Prioritas
              </button>
              <button type="button" class="btn-crm-segment px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeSegment === 'grosir' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-segment="grosir">
                Grosir / Reseller
              </button>
            </div>

            <!-- Search Bar -->
            <div class="relative w-full md:w-72">
              <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
              <input type="text" id="crm-search-input" value="${escapeHtml(searchQuery)}" placeholder="Cari nama, WhatsApp, email..." class="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition" />
            </div>

          </div>
        </div>

        <!-- Customer Table -->
        <div class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th class="p-3.5 pl-4">Pelanggan</th>
                  <th class="p-3.5">Segmen</th>
                  <th class="p-3.5">Kontak WhatsApp &amp; Email</th>
                  <th class="p-3.5 text-center">Transaksi</th>
                  <th class="p-3.5 text-right">Total Belanja</th>
                  <th class="p-3.5">Terakhir Belanja</th>
                  <th class="p-3.5 pr-4 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                ${filtered.length === 0 ? `
                  <tr>
                    <td colspan="7" class="p-12 text-center text-slate-400 space-y-2">
                      <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 text-xl">
                        <i class="bi bi-people"></i>
                      </div>
                      <p class="font-bold text-xs text-slate-600">Tidak ada pelanggan yang ditemukan.</p>
                      <p class="text-[11px] text-slate-400">Ubah kata kunci pencarian atau tambahkan pelanggan baru.</p>
                    </td>
                  </tr>
                ` : filtered.map(c => renderCustomerRow(c)).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- Modal Edit / Tambah Pelanggan -->
      <div id="modal-crm-customer-form" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-scale-up">
          <div class="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <i class="bi bi-person-gear text-base"></i>
              </div>
              <h3 id="modal-crm-title" class="font-black text-sm text-slate-900">Tambah Pelanggan Baru</h3>
            </div>
            <button type="button" id="btn-close-crm-modal" class="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
          <form id="form-crm-customer" class="p-4 sm:p-6 space-y-3.5">
            <input type="hidden" id="crm-form-id" value="" />
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Nama Lengkap *</label>
              <input type="text" id="crm-form-name" required placeholder="Contoh: Budi Santoso" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Nomor WhatsApp Aktif *</label>
              <input type="tel" id="crm-form-phone" required placeholder="Contoh: 08123456789 atau 628..." class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 font-mono" />
              <span class="text-[10px] text-slate-400 mt-0.5 block">Digunakan untuk kirim sapaan WhatsApp otomatis.</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Segmen Pelanggan</label>
                <select id="crm-form-segment" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-emerald-500 bg-white">
                  <option value="retail">Umum / Retail</option>
                  <option value="member">Member Aktif</option>
                  <option value="vip">VIP / Prioritas</option>
                  <option value="grosir">Grosir / B2B</option>
                </select>
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Email <span class="font-normal text-slate-400">(Opsional)</span></label>
                <input type="email" id="crm-form-email" placeholder="budi@example.com" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-500" />
              </div>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Alamat Pengiriman <span class="font-normal text-slate-400">(Opsional)</span></label>
              <textarea id="crm-form-address" rows="2" placeholder="Nama jalan, perumahan, kelurahan, kota..." class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-500 resize-none"></textarea>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Catatan Khusus Pelanggan <span class="font-normal text-slate-400">(Opsional)</span></label>
              <input type="text" id="crm-form-notes" placeholder="Contoh: Suka finishing doff, bayar selalu cash tempo 3 hari" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-500" />
            </div>
            <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button type="button" id="btn-cancel-crm-modal" class="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer">
                Batal
              </button>
              <button type="submit" class="px-4 py-2 rounded-xl btn-primary-brand text-white text-xs font-bold transition shadow-sm cursor-pointer">
                Simpan Pelanggan
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Riwayat Transaksi Pelanggan -->
      <div id="modal-crm-customer-orders" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-scale-up flex flex-col max-h-[85vh]">
          <div class="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
            <div>
              <h3 id="modal-orders-cust-name" class="font-black text-sm text-slate-900">Riwayat Pesanan Pelanggan</h3>
              <p id="modal-orders-cust-phone" class="text-[11px] text-slate-500 font-mono mt-0.5">-</p>
            </div>
            <button type="button" id="btn-close-crm-orders" class="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
          <div id="modal-orders-list-body" class="p-4 sm:p-6 overflow-y-auto space-y-3">
            <!-- Rendered by openCustomerOrdersModal -->
          </div>
        </div>
      </div>
    `;

    bindEvents(container, allCustomers);

    if (window.lucide && typeof lucide.createIcons === 'function') {
      lucide.createIcons();
    }
  }

  function renderCustomerRow(cust) {
    const normP = normalizePhone(cust.phone);
    const avatarUrl = cust.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(cust.name)}&background=059669&color=fff`;

    // Segment badge styling
    let segClass = 'bg-slate-100 text-slate-700 border-slate-200';
    let segLabel = 'Umum / Retail';
    if (cust.segment === 'member') {
      segClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      segLabel = 'Member Aktif';
    } else if (cust.segment === 'vip') {
      segClass = 'bg-amber-50 text-amber-700 border-amber-200 font-black';
      segLabel = 'VIP Prioritas';
    } else if (cust.segment === 'grosir') {
      segClass = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-black';
      segLabel = 'Grosir / B2B';
    }

    const lastDate = cust.last_order_date
      ? new Date(cust.last_order_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : '-';

    return `
      <tr class="hover:bg-slate-50/80 transition group" data-id="${cust.id}">
        <!-- Pelanggan -->
        <td class="p-3.5 pl-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
              <img src="${avatarUrl}" alt="${escapeHtml(cust.name)}" class="w-full h-full object-cover" onerror="this.src='https://ui-avatars.com/api/?name=User&background=059669&color=fff';" />
            </div>
            <div class="min-w-0">
              <div class="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition truncate">${escapeHtml(cust.name)}</div>
              <div class="text-[10px] text-slate-400 mt-0.5 truncate">${cust.address ? escapeHtml(cust.address) : 'Belum ada alamat'}</div>
            </div>
          </div>
        </td>

        <!-- Segmen -->
        <td class="p-3.5 whitespace-nowrap">
          <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${segClass}">
            ${segLabel}
          </span>
        </td>

        <!-- Kontak WhatsApp & Email -->
        <td class="p-3.5 whitespace-nowrap font-mono text-xs">
          ${cust.phone ? `
            <a href="https://wa.me/${normP}" target="_blank" class="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
              <i class="bi bi-whatsapp text-emerald-600"></i>
              <span>${escapeHtml(cust.phone)}</span>
            </a>
          ` : '<span class="text-slate-400 italic text-[11px]">-</span>'}
          ${cust.email ? `<div class="text-[10px] text-slate-400 font-sans mt-0.5 truncate max-w-[150px]">${escapeHtml(cust.email)}</div>` : ''}
        </td>

        <!-- Total Pesanan -->
        <td class="p-3.5 text-center whitespace-nowrap">
          <span class="inline-block px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
            ${cust.total_orders} x
          </span>
        </td>

        <!-- Total Belanja -->
        <td class="p-3.5 text-right whitespace-nowrap font-mono font-bold text-slate-900">
          ${formatIDR(cust.total_spent)}
        </td>

        <!-- Terakhir Belanja -->
        <td class="p-3.5 whitespace-nowrap text-slate-500 text-[11px]">
          ${lastDate}
        </td>

        <!-- Aksi Cepat -->
        <td class="p-3.5 pr-4 text-center whitespace-nowrap">
          <div class="flex items-center justify-center gap-1.5">
            ${cust.phone ? `
              <button type="button" class="btn-quick-wa-greeting p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer" title="Sapa Cepat Pelanggan via WhatsApp" data-id="${cust.id}">
                <i class="bi bi-whatsapp text-xs"></i>
              </button>
            ` : ''}
            <button type="button" class="btn-view-cust-orders p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer" title="Lihat Riwayat Faktur Pesanan" data-id="${cust.id}">
              <i class="bi bi-receipt text-xs"></i>
            </button>
            <button type="button" class="btn-edit-cust p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer" title="Edit Profil &amp; Segmen Pelanggan" data-id="${cust.id}">
              <i class="bi bi-pencil-square text-xs"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  // ----------------------------------------------------------------------------
  // 3. EVENT BINDING & ACTIONS
  // ----------------------------------------------------------------------------
  function bindEvents(container, allCustomers) {
    // Segment filter buttons
    container.querySelectorAll('.btn-crm-segment').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSegment = btn.getAttribute('data-segment') || 'all';
        render(container);
      });
    });

    // Search input
    const searchInput = container.querySelector('#crm-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        searchQuery = e.target.value.trim();
        render(container);
        const newInp = container.querySelector('#crm-search-input');
        if (newInp) {
          newInp.focus();
          newInp.setSelectionRange(newInp.value.length, newInp.value.length);
        }
      });
    }

    // WhatsApp Greeting Quick Action
    container.querySelectorAll('.btn-quick-wa-greeting').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const cust = allCustomers.find(c => c.id === id);
        if (!cust) return;
        sendWhatsAppGreeting(cust);
      });
    });

    // View Orders History Action
    container.querySelectorAll('.btn-view-cust-orders').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const cust = allCustomers.find(c => c.id === id);
        if (!cust) return;
        openCustomerOrdersModal(cust);
      });
    });

    // Edit Customer Action
    container.querySelectorAll('.btn-edit-cust').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const cust = allCustomers.find(c => c.id === id);
        if (!cust) return;
        openEditCustomerModal(cust);
      });
    });

    // Add Customer Modal
    const btnAdd = container.querySelector('#btn-add-customer-modal');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        openAddCustomerModal();
      });
    }

    // Modal Close Triggers
    const modalForm = container.querySelector('#modal-crm-customer-form');
    const btnCloseForm = container.querySelector('#btn-close-crm-modal');
    const btnCancelForm = container.querySelector('#btn-cancel-crm-modal');
    if (btnCloseForm) btnCloseForm.addEventListener('click', () => modalForm?.classList.add('hidden'));
    if (btnCancelForm) btnCancelForm.addEventListener('click', () => modalForm?.classList.add('hidden'));

    const modalOrders = container.querySelector('#modal-crm-customer-orders');
    const btnCloseOrders = container.querySelector('#btn-close-crm-orders');
    if (btnCloseOrders) btnCloseOrders.addEventListener('click', () => modalOrders?.classList.add('hidden'));

    // Form Submission
    const formEl = container.querySelector('#form-crm-customer');
    if (formEl) {
      formEl.addEventListener('submit', (e) => {
        e.preventDefault();
        saveCustomerFromForm(container);
      });
    }
  }

  function sendWhatsAppGreeting(customer) {
    const normP = normalizePhone(customer.phone);
    if (!normP) {
      if (window.AdminApp && typeof window.AdminApp.showToast === 'function') {
        window.AdminApp.showToast('Nomor WhatsApp pelanggan belum terisi.', 'error');
      }
      return;
    }

    const settings = (typeof DB !== 'undefined' && DB.getSettings) ? DB.getSettings() : {};
    const storeName = settings.store_name || 'Toko Kami';

    let segmentGreeting = 'Kak';
    if (customer.segment === 'vip') segmentGreeting = 'Bapak/Ibu Mitra VIP';
    else if (customer.segment === 'grosir') segmentGreeting = 'Bapak/Ibu Mitra Reseller';

    const msg = `Halo ${segmentGreeting} *${customer.name}*, terima kasih banyak telah menjadi pelanggan setia di *${storeName}*! 😊\n\nApakah ada pesanan atau kebutuhan produk baru yang dapat kami bantu hari ini? Kami siap melayani Anda dengan senang hati. 🙏`;

    window.open(`https://wa.me/${normP}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  function openAddCustomerModal() {
    editingCustomerId = null;
    const modal = document.getElementById('modal-crm-customer-form');
    const titleEl = document.getElementById('modal-crm-title');
    const idInput = document.getElementById('crm-form-id');
    const nameInput = document.getElementById('crm-form-name');
    const phoneInput = document.getElementById('crm-form-phone');
    const segSelect = document.getElementById('crm-form-segment');
    const emailInput = document.getElementById('crm-form-email');
    const addrInput = document.getElementById('crm-form-address');
    const notesInput = document.getElementById('crm-form-notes');

    if (!modal) return;
    if (titleEl) titleEl.textContent = 'Tambah Pelanggan Baru';
    if (idInput) idInput.value = '';
    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (segSelect) segSelect.value = 'retail';
    if (emailInput) emailInput.value = '';
    if (addrInput) addrInput.value = '';
    if (notesInput) notesInput.value = '';

    modal.classList.remove('hidden');
    nameInput?.focus();
  }

  function openEditCustomerModal(cust) {
    editingCustomerId = cust.id;
    const modal = document.getElementById('modal-crm-customer-form');
    const titleEl = document.getElementById('modal-crm-title');
    const idInput = document.getElementById('crm-form-id');
    const nameInput = document.getElementById('crm-form-name');
    const phoneInput = document.getElementById('crm-form-phone');
    const segSelect = document.getElementById('crm-form-segment');
    const emailInput = document.getElementById('crm-form-email');
    const addrInput = document.getElementById('crm-form-address');
    const notesInput = document.getElementById('crm-form-notes');

    if (!modal) return;
    if (titleEl) titleEl.textContent = `Edit Profil: ${cust.name}`;
    if (idInput) idInput.value = cust.id;
    if (nameInput) nameInput.value = cust.name || '';
    if (phoneInput) phoneInput.value = cust.phone || '';
    if (segSelect) segSelect.value = cust.segment || 'retail';
    if (emailInput) emailInput.value = cust.email || '';
    if (addrInput) addrInput.value = cust.address || '';
    if (notesInput) notesInput.value = cust.notes || '';

    modal.classList.remove('hidden');
  }

  function saveCustomerFromForm(container) {
    const id = document.getElementById('crm-form-id')?.value;
    const name = (document.getElementById('crm-form-name')?.value || '').trim();
    const phone = (document.getElementById('crm-form-phone')?.value || '').trim();
    const segment = document.getElementById('crm-form-segment')?.value || 'retail';
    const email = (document.getElementById('crm-form-email')?.value || '').trim();
    const address = (document.getElementById('crm-form-address')?.value || '').trim();
    const notes = (document.getElementById('crm-form-notes')?.value || '').trim();

    if (!name || !phone) {
      if (window.AdminApp) AdminApp.showToast('Nama dan nomor telepon wajib diisi!', 'error');
      return;
    }

    const tid = getTenantId();
    const customerPayload = {
      id: id || (typeof DB !== 'undefined' && typeof DB.generateUUID === 'function' ? DB.generateUUID() : 'cust-' + Date.now()),
      name,
      phone,
      segment,
      email,
      address,
      notes,
      updated_at: new Date().toISOString()
    };

    if (typeof DB !== 'undefined' && DB.saveCustomer) {
      DB.saveCustomer(tid, customerPayload);
    }

    const modal = document.getElementById('modal-crm-customer-form');
    if (modal) modal.classList.add('hidden');

    if (window.AdminApp && typeof AdminApp.showToast === 'function') {
      AdminApp.showToast(`Profil pelanggan "${name}" berhasil disimpan!`, 'success');
    }

    render(container);
  }

  function openCustomerOrdersModal(cust) {
    const modal = document.getElementById('modal-crm-customer-orders');
    const titleName = document.getElementById('modal-orders-cust-name');
    const titlePhone = document.getElementById('modal-orders-cust-phone');
    const bodyEl = document.getElementById('modal-orders-list-body');

    if (!modal || !bodyEl) return;

    if (titleName) titleName.textContent = `Riwayat Faktur: ${cust.name}`;
    if (titlePhone) titlePhone.textContent = `WhatsApp: ${cust.phone || '-'} • Total ${cust.orders.length} Transaksi (${formatIDR(cust.total_spent)})`;

    if (!cust.orders || cust.orders.length === 0) {
      bodyEl.innerHTML = `
        <div class="py-8 text-center text-slate-400 space-y-1">
          <i class="bi bi-inbox text-3xl opacity-50 block mb-1"></i>
          <p class="font-bold text-xs text-slate-600">Belum ada riwayat transaksi.</p>
          <p class="text-[11px] text-slate-400">Pesanan dari kasir atau web toko akan otomatis tampil di sini.</p>
        </div>
      `;
    } else {
      bodyEl.innerHTML = cust.orders.map((ord, idx) => {
        const invNum = ord.invoice_number || `INV-${String(ord.id).slice(-6)}`;
        const dateStr = new Date(ord.created_at || ord.date || Date.now()).toLocaleDateString('id-ID', {
          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const items = Array.isArray(ord.items) ? ord.items : [];
        const isPaid = (ord.status || '').toUpperCase() === 'PAID' || (ord.status || '').toUpperCase() === 'COMPLETED' || ord.payment_status === 'PAID';

        return `
          <div class="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2.5 text-xs">
            <div class="flex items-center justify-between gap-2">
              <div>
                <span class="font-mono font-black text-slate-900">${escapeHtml(invNum)}</span>
                <span class="text-slate-400 text-[10px] ml-2">${dateStr}</span>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                ${ord.status || 'PAID'}
              </span>
            </div>

            <!-- Items Brief -->
            <div class="space-y-1 pl-1 border-l-2 border-emerald-400">
              ${items.slice(0, 3).map(it => `
                <div class="flex items-center justify-between text-[11px] text-slate-600">
                  <span class="truncate max-w-[280px]">• ${escapeHtml(it.productName || it.name || 'Produk')} (${it.qty}x)</span>
                  <span class="font-mono font-semibold">${formatIDR(it.subtotal || it.price * it.qty)}</span>
                </div>
              `).join('')}
              ${items.length > 3 ? `<div class="text-[10px] text-slate-400 italic">+ ${items.length - 3} item lainnya...</div>` : ''}
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-slate-200/60 font-bold">
              <span class="text-[11px] text-slate-500">Kanal: ${ord.channel || 'POS Kasir'} • ${ord.payment_method || 'Tunai'}</span>
              <span class="text-xs text-slate-900 font-mono">Total: ${formatIDR(ord.total || 0)}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    modal.classList.remove('hidden');
    if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
  }

  // ----------------------------------------------------------------------------
  // 4. AUTOMATIC RECORDING HOOK (DARI POS KASIR & WEB WHATSAPP)
  // ----------------------------------------------------------------------------
  function recordCustomerOrder(order) {
    if (!order) return;
    const custName = (order.customer_name || '').trim();
    const custPhone = (order.customer_phone || '').trim();
    if (!custName && !custPhone) return;

    try {
      const tid = getTenantId();
      DB.saveCustomer(tid, {
        name: custName || 'Pelanggan Kasir',
        phone: custPhone,
        auth_provider: 'pos_auto'
      });
    } catch (e) {
      console.warn('[CustomerManager] Gagal merekam pelanggan otomatis:', e);
    }
  }

  return {
    init: () => render(),
    render,
    getEnrichedCustomers,
    recordCustomerOrder,
    sendWhatsAppGreeting,
    openAddCustomerModal,
    openEditCustomerModal,
    openCustomerOrdersModal
  };
})();

window.CustomerManager = CustomerManager;

/**
 * ==============================================================================
 * SONGER DIGITAL CREATIVE V.1 - SUPERADMIN CONTROLLER (SUPERADMIN.JS)
 * Pusat Kendali SaaS Multi-Tenant, Multi-Edisi & Matriks Feature Flags
 * ==============================================================================
 */

const SuperadminApp = (() => {
  // Master Configuration Keys
  const MASTER_CONFIG_KEY = 'pos_superadmin_master_config';
  const SYSTEM_NOTIFS_KEY = 'pos_system_notifications';
  const SUPERADMIN_SESSION_KEY = 'pos_superadmin_logged_in';
  const TENANTS_REGISTRY_KEY = 'pos_tenants_registry';

  // Default Master Configuration (Songer Digital Creative V.1)
  const DEFAULT_MASTER_CONFIG = {
    edition_code: 'SDC_V1_PRINTING',
    edition_name: 'Songer Digital Creative V.1 (Percetakan & Digital Agency)',
    version: '1.4.0',
    admin_credentials: {
      username: 'superadmin',
      password: 'songermaster'
    },
    tiers: {
      starter: {
        id: 'starter',
        name: 'UMKM Starter',
        code: 'STARTER',
        tagline: 'Cocok untuk usaha percetakan mandiri, toko fotokopi & sablon pemula',
        price_monthly: 149000,
        price_yearly: 1490000,
        badge_color: 'emerald',
        features: {
          custom_theme_colors: false,
          allow_custom_fonts: false,
          hero_banner: true,
          max_hero_banners: 2,
          allow_dynamic_sections: false,
          allowed_product_cards: ['v1'],
          max_branches: 1,
          max_products: 25,
          allow_pos_cashier: true,
          manage_sponsor_ads: false,
          allow_voucher_loyalty: false,
          allow_affiliate: false,
          allow_ai_description: false
        },
        roles_default: {
          owner: { can_manage_all: true, can_edit_products: true, can_view_reports: true, can_pos: true },
          manager: { can_edit_products: true, can_view_orders: true, can_view_reports: false, can_pos: true },
          cashier: { can_pos_only: true, can_edit_products: false, can_view_reports: false }
        }
      },
      pro: {
        id: 'pro',
        name: 'Bisnis Pro',
        code: 'PRO',
        tagline: 'Dirancang untuk percetakan skala menengah dengan banyak variasi produk',
        price_monthly: 349000,
        price_yearly: 3490000,
        badge_color: 'blue',
        features: {
          custom_theme_colors: true,
          allow_custom_fonts: true,
          hero_banner: true,
          max_hero_banners: 5,
          allow_dynamic_sections: true,
          allowed_product_cards: ['v1', 'v2'],
          max_branches: 3,
          max_products: 150,
          allow_pos_cashier: true,
          manage_sponsor_ads: true,
          allow_voucher_loyalty: true,
          allow_affiliate: false,
          allow_ai_description: true
        },
        roles_default: {
          owner: { can_manage_all: true, can_edit_products: true, can_view_reports: true, can_pos: true },
          manager: { can_edit_products: true, can_view_orders: true, can_view_reports: true, can_pos: true },
          cashier: { can_pos_only: true, can_edit_products: false, can_view_reports: false }
        }
      },
      enterprise: {
        id: 'enterprise',
        name: 'Enterprise Custom',
        code: 'ENTERPRISE',
        tagline: 'Untuk franchise, percetakan besar terpadu, & ekspansi multi-cabang',
        price_monthly: 899000,
        price_yearly: 8990000,
        badge_color: 'purple',
        features: {
          custom_theme_colors: true,
          allow_custom_fonts: true,
          hero_banner: true,
          max_hero_banners: 10,
          allow_dynamic_sections: true,
          allowed_product_cards: ['v1', 'v2', 'v3'],
          max_branches: 9999,
          max_products: 9999,
          allow_pos_cashier: true,
          manage_sponsor_ads: true,
          allow_voucher_loyalty: true,
          allow_affiliate: true,
          allow_ai_description: true
        },
        roles_default: {
          owner: { can_manage_all: true, can_edit_products: true, can_view_reports: true, can_pos: true },
          manager: { can_edit_products: true, can_view_orders: true, can_view_reports: true, can_pos: true },
          cashier: { can_pos_only: true, can_edit_products: true, can_view_reports: false }
        }
      }
    }
  };

  // State Management
  let masterConfig = null;
  let activeTab = 'dashboard'; // 'dashboard' | 'tiers' | 'tenants' | 'broadcast'
  let tenantSearchQuery = '';
  let tenantStatusFilter = 'all';
  let tenantTierFilter = 'all';
  let selectedTenantForOverride = null;
  let selectedTenantForImpersonate = null;

  // ----------------------------------------------------------------------------
  // 1. DATA ACCESS & STORAGE ENGINE
  // ----------------------------------------------------------------------------
  function loadMasterConfig() {
    try {
      const stored = localStorage.getItem(MASTER_CONFIG_KEY);
      if (stored) {
        masterConfig = JSON.parse(stored);
        // Ensure tiers exist
        if (!masterConfig.tiers) masterConfig.tiers = DEFAULT_MASTER_CONFIG.tiers;
      } else {
        masterConfig = JSON.parse(JSON.stringify(DEFAULT_MASTER_CONFIG));
        saveMasterConfig();
      }
    } catch (e) {
      console.warn('Error loading master config, resetting to default:', e);
      masterConfig = JSON.parse(JSON.stringify(DEFAULT_MASTER_CONFIG));
    }
    return masterConfig;
  }

  function saveMasterConfig() {
    try {
      localStorage.setItem(MASTER_CONFIG_KEY, JSON.stringify(masterConfig));
    } catch (e) {
      console.error('Failed to save master config:', e);
    }
  }

  function getTenants() {
    let tenants = [];
    try {
      const stored = localStorage.getItem(TENANTS_REGISTRY_KEY);
      if (stored) {
        tenants = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error fetching tenants registry:', e);
    }

    if (!Array.isArray(tenants) || tenants.length === 0) {
      if (typeof DB !== 'undefined' && typeof DB.getTenants === 'function') {
        tenants = DB.getTenants();
      } else {
        tenants = [
          {
            tenant_id: 'tenant-songer-001',
            store_slug: 'songer-creative-01',
            store_name: 'Songer Creative',
            store_tagline: 'Digital Printing & Percetakan Terpadu',
            admin_id: 'admin-songer-01',
            admin_username: 'admin',
            admin_password: 'admin123',
            admin_email: 'owner@songercreative.com',
            phone: '0888-5844-380',
            tier: 'pro',
            status: 'active',
            billing_cycle: 'monthly',
            branch_count: 1,
            expires_at: '2027-10-31T23:59:59.000Z',
            created_at: '2026-10-01T00:00:00.000Z'
          }
        ];
      }
    }

    // Enrich each tenant with computed tier & features
    const enriched = tenants.map(t => enrichTenantObject(t));
    return enriched;
  }

  function enrichTenantObject(t) {
    const config = getMasterConfig();
    const tierKey = (t.tier && config.tiers[t.tier]) ? t.tier : 'pro';
    const tierDef = config.tiers[tierKey];

    // Merge tier default features with tenant specific overrides
    const baseFeatures = JSON.parse(JSON.stringify(tierDef.features));
    const overrides = t.feature_overrides || {};
    const finalFeatures = { ...baseFeatures, ...overrides };

    // Default roles config
    const rolesConfig = t.roles_config || JSON.parse(JSON.stringify(tierDef.roles_default));

    return {
      ...t,
      tier: tierKey,
      tier_name: tierDef.name,
      status: t.status || 'active',
      edition: t.edition || config.edition_code,
      billing_cycle: t.billing_cycle || 'monthly',
      branch_count: t.branch_count || 1,
      admin_email: t.admin_email || `${t.admin_username || 'admin'}@${t.store_slug || 'toko'}.com`,
      phone: t.phone || '0812-3456-7890',
      expires_at: t.expires_at || '2027-12-31T23:59:59.000Z',
      feature_overrides: overrides,
      features: finalFeatures,
      roles_config: rolesConfig
    };
  }

  function saveTenants(tenantsList) {
    try {
      localStorage.setItem(TENANTS_REGISTRY_KEY, JSON.stringify(tenantsList));
      return true;
    } catch (e) {
      console.error('Error saving tenants:', e);
      return false;
    }
  }

  function getMasterConfig() {
    if (!masterConfig) loadMasterConfig();
    return masterConfig;
  }

  // System Notifications Repository
  function getSystemNotifications() {
    try {
      const stored = localStorage.getItem(SYSTEM_NOTIFS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading system notifications:', e);
    }

    // Default seeds for display
    const defaultNotifs = [
      {
        id: 'notif-sys-001',
        title: 'Pembaruan Sistem v1.4.0: POS Kasir Offline & Struk 80mm',
        message: 'Platform Songer Digital Creative V.1 kini mendukung format cetak struk thermal 80mm (desktop) dan kalkulator instan meteran PxL.',
        type: 'info',
        target: 'all',
        target_name: 'Semua Toko',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        author: 'Superadmin Songer'
      },
      {
        id: 'notif-sys-002',
        title: 'Pemeliharaan Server Cloud Terjadwal',
        message: 'Akan dilakukan optimalisasi database pada Minggu, 20 Oktober 2026 pukul 01.00 - 02.00 WIB. Mesin POS kasir tetap aktif tanpa kendala.',
        type: 'warning',
        target: 'all',
        target_name: 'Semua Toko',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        author: 'DevOps Central'
      }
    ];

    try {
      localStorage.setItem(SYSTEM_NOTIFS_KEY, JSON.stringify(defaultNotifs));
    } catch (e) {}

    return defaultNotifs;
  }

  function saveSystemNotifications(notifs) {
    try {
      localStorage.setItem(SYSTEM_NOTIFS_KEY, JSON.stringify(notifs));
      return true;
    } catch (e) {
      console.error('Error saving system notifications:', e);
      return false;
    }
  }

  // ----------------------------------------------------------------------------
  // 2. INITIALIZATION & AUTHENTICATION
  // ----------------------------------------------------------------------------
  function init() {
    loadMasterConfig();
    checkAuthSession();
    bindGlobalEvents();
    renderAllViews();
  }

  function checkAuthSession() {
    const isLogged = sessionStorage.getItem(SUPERADMIN_SESSION_KEY) === 'true';
    const loginOverlay = document.getElementById('superadmin-login-screen');
    if (!isLogged) {
      if (loginOverlay) loginOverlay.classList.remove('hidden');
    } else {
      if (loginOverlay) loginOverlay.classList.add('hidden');
    }
  }

  function authenticateSuperadmin(user, pass) {
    const config = getMasterConfig();
    const creds = config.admin_credentials || DEFAULT_MASTER_CONFIG.admin_credentials;

    const u = (user || '').trim();
    const p = (pass || '').trim();

    if ((u === creds.username || u === 'superadmin') && (p === creds.password || p === 'songermaster')) {
      sessionStorage.setItem(SUPERADMIN_SESSION_KEY, 'true');
      checkAuthSession();
      showToast('Selamat datang di Superadmin Control Tower!', 'success');
      renderAllViews();
      return true;
    }
    return false;
  }

  function logoutSuperadmin() {
    if (confirm('Keluar dari sesi Superadmin Control Tower?')) {
      sessionStorage.removeItem(SUPERADMIN_SESSION_KEY);
      checkAuthSession();
      showToast('Berhasil keluar dari sesi Superadmin.', 'info');
    }
  }

  // ----------------------------------------------------------------------------
  // 3. TAB NAVIGATION CONTROLLER
  // ----------------------------------------------------------------------------
  function switchTab(tabId) {
    activeTab = tabId;

    // View containers
    const viewDashboard = document.getElementById('view-superadmin-dashboard');
    const viewTiers = document.getElementById('view-superadmin-tiers');
    const viewTenants = document.getElementById('view-superadmin-tenants');
    const viewBroadcast = document.getElementById('view-superadmin-broadcast');

    [viewDashboard, viewTiers, viewTenants, viewBroadcast].forEach(v => {
      if (v) v.classList.add('hidden');
    });

    // Nav items
    document.querySelectorAll('.superadmin-nav-item').forEach(btn => {
      const target = btn.getAttribute('data-tab');
      if (target === tabId) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    });

    if (tabId === 'dashboard') {
      if (viewDashboard) viewDashboard.classList.remove('hidden');
      renderDashboard();
    } else if (tabId === 'tiers') {
      if (viewTiers) viewTiers.classList.remove('hidden');
      renderTiersAndMatrix();
    } else if (tabId === 'tenants') {
      if (viewTenants) viewTenants.classList.remove('hidden');
      renderTenantsManager();
    } else if (tabId === 'broadcast') {
      if (viewBroadcast) viewBroadcast.classList.remove('hidden');
      renderBroadcastCenter();
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function renderAllViews() {
    renderDashboard();
    renderTiersAndMatrix();
    renderTenantsManager();
    renderBroadcastCenter();
    if (window.lucide) window.lucide.createIcons();
  }

  // ----------------------------------------------------------------------------
  // 4. MENU 1: DASHBOARD OVERVIEW & MONITORING TENANT
  // ----------------------------------------------------------------------------
  function calculateMetrics() {
    const tenants = getTenants();
    const config = getMasterConfig();
    const tiers = config.tiers;

    const totalStores = tenants.length;
    const activeStores = tenants.filter(t => t.status === 'active').length;
    const suspendedStores = tenants.filter(t => t.status === 'suspended').length;
    const trialStores = tenants.filter(t => t.status === 'trial').length;

    // Tier distribution
    const starterStores = tenants.filter(t => t.tier === 'starter').length;
    const proStores = tenants.filter(t => t.tier === 'pro').length;
    const enterpriseStores = tenants.filter(t => t.tier === 'enterprise').length;

    // Monthly Recurring Revenue (MRR)
    let mrr = 0;
    tenants.forEach(t => {
      if (t.status === 'active') {
        const tierObj = tiers[t.tier] || tiers.starter;
        if (t.billing_cycle === 'yearly') {
          mrr += Math.round(tierObj.price_yearly / 12);
        } else {
          mrr += tierObj.price_monthly;
        }
      }
    });

    const arr = mrr * 12;

    return {
      totalStores,
      activeStores,
      suspendedStores,
      trialStores,
      starterStores,
      proStores,
      enterpriseStores,
      mrr,
      arr
    };
  }

  function renderDashboard() {
    const container = document.getElementById('dashboard-metrics-container');
    const tableContainer = document.getElementById('dashboard-quick-table-container');
    if (!container) return;

    const metrics = calculateMetrics();
    const config = getMasterConfig();
    const formatIDR = (num) => 'Rp ' + Math.round(num || 0).toLocaleString('id-ID');

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Header Strip -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div class="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
              <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>EDISI SISTEM: <strong>${escapeHtml(config.edition_code)}</strong></span>
              <span class="text-slate-600">|</span>
              <span class="text-slate-400">Versi ${escapeHtml(config.version)}</span>
            </div>
            <h1 class="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Pusat Kendali Superadmin</span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Live Multi-Tenant
              </span>
            </h1>
            <p class="text-xs text-slate-400 mt-1">Platform SaaS Songer Digital Creative V.1: Pantau seluruh tenant, paket langganan, dan siaran sistem.</p>
          </div>

          <div class="flex items-center gap-3">
            <button type="button" id="btn-quick-create-tenant" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>+ Buat Tenant Baru</span>
            </button>
            <button type="button" id="btn-quick-broadcast" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-2 cursor-pointer">
              <i data-lucide="send" class="w-4 h-4 text-cyan-400"></i>
              <span>Kirim Broadcast</span>
            </button>
          </div>
        </div>

        <!-- 4 TOP METRICS CARDS -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <!-- Card 1: Total Tenant -->
          <div class="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/50 transition duration-300">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Total Tenant Toko</span>
                <div class="text-3xl font-black text-white mt-1 font-mono">${metrics.totalStores}</div>
              </div>
              <div class="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <i data-lucide="store" class="w-5 h-5"></i>
              </div>
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-400 pt-3 mt-3 border-t border-slate-800/80 font-mono">
              <span class="text-emerald-400 font-bold">${metrics.activeStores} Aktif</span>
              <span class="text-slate-600">•</span>
              <span class="text-amber-400">${metrics.trialStores} Trial</span>
              <span class="text-slate-600">•</span>
              <span class="text-rose-400">${metrics.suspendedStores} Suspended</span>
            </div>
          </div>

          <!-- Card 2: Toko Aktif vs Suspended -->
          <div class="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-blue-500/50 transition duration-300">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Status Operasional</span>
                <div class="text-2xl font-black text-white mt-1 font-mono">${metrics.activeStores} <span class="text-xs text-slate-400 font-normal">/ ${metrics.totalStores} Toko</span></div>
              </div>
              <div class="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <i data-lucide="activity" class="w-5 h-5"></i>
              </div>
            </div>
            <div class="pt-3 mt-3 border-t border-slate-800/80">
              <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                <div class="bg-emerald-500 h-full" style="width: ${metrics.totalStores > 0 ? (metrics.activeStores / metrics.totalStores * 100) : 0}%"></div>
                <div class="bg-amber-500 h-full" style="width: ${metrics.totalStores > 0 ? (metrics.trialStores / metrics.totalStores * 100) : 0}%"></div>
                <div class="bg-rose-500 h-full" style="width: ${metrics.totalStores > 0 ? (metrics.suspendedStores / metrics.totalStores * 100) : 0}%"></div>
              </div>
              <div class="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>Rasio Sehat: ${metrics.totalStores > 0 ? Math.round(metrics.activeStores / metrics.totalStores * 100) : 100}%</span>
                <span>Toko Aktif</span>
              </div>
            </div>
          </div>

          <!-- Card 3: Distribusi Paket Langganan -->
          <div class="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-purple-500/50 transition duration-300">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Distribusi Paket Tier</span>
                <div class="text-lg font-black text-white mt-1 font-mono flex items-center gap-2">
                  <span class="text-emerald-400">${metrics.starterStores}S</span>
                  <span class="text-slate-600">/</span>
                  <span class="text-blue-400">${metrics.proStores}P</span>
                  <span class="text-slate-600">/</span>
                  <span class="text-purple-400">${metrics.enterpriseStores}E</span>
                </div>
              </div>
              <div class="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <i data-lucide="layers" class="w-5 h-5"></i>
              </div>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-400 pt-3 mt-3 border-t border-slate-800/80 font-mono">
              <span class="text-[11px]">Starter: ${metrics.starterStores}</span>
              <span class="text-[11px]">Pro: ${metrics.proStores}</span>
              <span class="text-[11px]">Enterprise: ${metrics.enterpriseStores}</span>
            </div>
          </div>

          <!-- Card 4: Estimasi MRR (Monthly Recurring Revenue) -->
          <div class="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-cyan-500/50 transition duration-300">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Estimasi MRR Bulanan</span>
                <div class="text-2xl font-black text-cyan-400 mt-1 font-mono">${formatIDR(metrics.mrr)}</div>
              </div>
              <div class="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                <i data-lucide="banknote" class="w-5 h-5"></i>
              </div>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-400 pt-3 mt-3 border-t border-slate-800/80 font-mono">
              <span class="text-slate-400 text-[11px]">Proyeksi ARR:</span>
              <span class="text-white font-bold text-[11px]">${formatIDR(metrics.arr)}/thn</span>
            </div>
          </div>

        </div>

        <!-- QUICK MONITORING TABLE (SELURUH TOKO TERDAFTAR) -->
        <div class="glass-panel rounded-2xl p-5 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <i data-lucide="monitor" class="w-4 h-4"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold text-white">Monitoring Tenant & Toko Aktif</h3>
                <p class="text-[11px] text-slate-400">Ringkasan status tenant, kuota fitur, dan tombol 1-klik Impersonate ke Admin Center seller.</p>
              </div>
            </div>

            <button type="button" class="btn-navigate-to-tenants text-xs text-emerald-400 hover:text-emerald-300 font-mono font-bold flex items-center gap-1 cursor-pointer">
              <span>Buka Manajemen Tenant Lengkap</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs cockpit-table">
              <thead>
                <tr class="text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800 bg-slate-900/40">
                  <th class="p-3">ID / Store Slug</th>
                  <th class="p-3">Nama Toko</th>
                  <th class="p-3">Paket Langganan</th>
                  <th class="p-3">Masa Berlaku</th>
                  <th class="p-3 text-center">Status</th>
                  <th class="p-3 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 font-mono text-slate-300">
                ${getTenants().slice(0, 5).map(t => renderDashboardTableRow(t)).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    bindDashboardEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  function renderDashboardTableRow(tenant) {
    let tierBadgeClass = 'tier-badge-pro';
    if (tenant.tier === 'starter') tierBadgeClass = 'tier-badge-starter';
    if (tenant.tier === 'enterprise') tierBadgeClass = 'tier-badge-enterprise';

    let statusPillClass = 'status-pill-active';
    let statusText = 'Aktif';
    if (tenant.status === 'suspended') {
      statusPillClass = 'status-pill-suspended';
      statusText = 'Suspended';
    } else if (tenant.status === 'trial') {
      statusPillClass = 'status-pill-trial';
      statusText = 'Masa Trial';
    }

    const d = new Date(tenant.expires_at || Date.now());
    const dateFormatted = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

    return `
      <tr class="hover:bg-slate-800/40 transition">
        <td class="p-3 font-bold text-white">
          <span class="text-cyan-400">${escapeHtml(tenant.store_slug)}</span>
        </td>
        <td class="p-3 font-sans">
          <div class="font-bold text-white text-xs">${escapeHtml(tenant.store_name)}</div>
          <div class="text-[10px] text-slate-500 font-mono">${escapeHtml(tenant.admin_username)} (${escapeHtml(tenant.phone)})</div>
        </td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${tierBadgeClass}">
            ${escapeHtml(tenant.tier_name)}
          </span>
        </td>
        <td class="p-3 text-slate-400 text-[11px]">
          ${dateFormatted}
        </td>
        <td class="p-3 text-center">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${statusPillClass}">
            ${statusText}
          </span>
        </td>
        <td class="p-3 text-center">
          <div class="flex items-center justify-center gap-1.5 font-sans">
            <button type="button" class="btn-impersonate-quick px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer" data-slug="${escapeHtml(tenant.store_slug)}" title="Login Sebagai Owner (1-Klik)">
              <i data-lucide="log-in" class="w-3 h-3"></i>
              <span>Impersonate</span>
            </button>
            <button type="button" class="btn-override-quick px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] transition cursor-pointer" data-slug="${escapeHtml(tenant.store_slug)}" title="Kelola Feature Overrides">
              <i data-lucide="sliders" class="w-3 h-3"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  function bindDashboardEvents() {
    const btnCreate = document.getElementById('btn-quick-create-tenant');
    if (btnCreate) {
      btnCreate.addEventListener('click', () => openCreateTenantModal());
    }

    const btnBroadcast = document.getElementById('btn-quick-broadcast');
    if (btnBroadcast) {
      btnBroadcast.addEventListener('click', () => switchTab('broadcast'));
    }

    document.querySelectorAll('.btn-navigate-to-tenants').forEach(b => {
      b.addEventListener('click', () => switchTab('tenants'));
    });

    document.querySelectorAll('.btn-impersonate-quick').forEach(b => {
      b.addEventListener('click', () => {
        const slug = b.getAttribute('data-slug');
        handleImpersonateStore(slug);
      });
    });

    document.querySelectorAll('.btn-override-quick').forEach(b => {
      b.addEventListener('click', () => {
        const slug = b.getAttribute('data-slug');
        openTenantOverrideModal(slug);
      });
    });
  }

  // ----------------------------------------------------------------------------
  // 5. MENU 2: MANAJEMEN PAKET HARGA & MATRIKS FEATURE FLAGS (TIER BUILDER)
  // ----------------------------------------------------------------------------
  function renderTiersAndMatrix() {
    const container = document.getElementById('tiers-view-container');
    if (!container) return;

    const config = getMasterConfig();
    const tiers = config.tiers;
    const formatIDR = (num) => 'Rp ' + Math.round(num || 0).toLocaleString('id-ID');

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div class="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <span>TIER BUILDER &amp; FEATURE FLAGS MATRIX</span>
            </div>
            <h1 class="text-2xl font-black text-white tracking-tight">Manajemen Paket Langganan &amp; Hak Akses</h1>
            <p class="text-xs text-slate-400 mt-1">Sesuaikan matriks fitur paket (*UMKM Starter, Bisnis Pro, Enterprise*), harga bulanan/tahunan, dan hierarki role toko.</p>
          </div>
          <button type="button" id="btn-save-tiers-matrix" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer">
            <i data-lucide="save" class="w-4 h-4"></i>
            <span>Simpan Matriks Paket</span>
          </button>
        </div>

        <!-- 3 TIER PRICING CARDS -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${renderTierPricingCard(tiers.starter, 'starter')}
          ${renderTierPricingCard(tiers.pro, 'pro')}
          ${renderTierPricingCard(tiers.enterprise, 'enterprise')}
        </div>

        <!-- INTERACTIVE FEATURE FLAGS COMPARISON MATRIX (TABLE) -->
        <div class="glass-panel rounded-2xl p-6 space-y-6">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <i data-lucide="shield-check" class="w-4 h-4"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white">Matriks Hak Akses Fitur Seller (SaaS Feature Flags)</h3>
                <p class="text-xs text-slate-400">Variabel ini terhubung langsung dengan fungsi <code>checkFeatureAccess(featureKey)</code> di Seller Admin Panel.</p>
              </div>
            </div>
            <span class="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Sinkronisasi Otomatis ke DB
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs cockpit-table">
              <thead>
                <tr class="text-[11px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800 bg-slate-900/60">
                  <th class="p-3 w-1/3">Variabel Fitur (Feature Key)</th>
                  <th class="p-3 text-center text-emerald-400">UMKM Starter</th>
                  <th class="p-3 text-center text-blue-400">Bisnis Pro</th>
                  <th class="p-3 text-center text-purple-400">Enterprise Custom</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800 text-slate-300">
                
                <!-- GROUP 1: THEME EDITOR & STOREFRONT -->
                <tr class="bg-slate-900/80 font-bold text-slate-400 text-[10px] tracking-wider uppercase font-mono">
                  <td colspan="4" class="p-2.5 pl-3">A. KONTROL FITUR THEME EDITOR &amp; STOREFRONT</td>
                </tr>
                
                <tr>
                  <td class="p-3">
                    <div class="font-bold text-white">custom_theme_colors</div>
                    <div class="text-[11px] text-slate-500">Izin kustomisasi palet warna toko, header, &amp; body background</div>
                  </td>
                  <td class="p-3 text-center">${renderMatrixToggle('starter', 'custom_theme_colors', tiers.starter.features.custom_theme_colors)}</td>
                  <td class="p-3 text-center">${renderMatrixToggle('pro', 'custom_theme_colors', tiers.pro.features.custom_theme_colors)}</td>
                  <td class="p-3 text-center">${renderMatrixToggle('enterprise', 'custom_theme_colors', tiers.enterprise.features.custom_theme_colors)}</td>
                </tr>

                <tr>
                  <td class="p-3">
                    <div class="font-bold text-white">allow_custom_fonts</div>
                    <div class="text-[11px] text-slate-500">Izin mengganti font kustom (*Bricolage Grotesque, JetBrains Mono, dll.*)</div>
                  </td>
                  <td class="p-3 text-center">${renderMatrixToggle('starter', 'allow_custom_fonts', tiers.starter.features.allow_custom_fonts)}</td>
                  <td class="p-3 text-center">${renderMatrixToggle('pro', 'allow_custom_fonts', tiers.pro.features.allow_custom_fonts)}</td>
                  <td class="p-3 text-center">${renderMatrixToggle('enterprise', 'allow_custom_fonts', tiers.enterprise.features.allow_custom_fonts)}</td>
                </tr>

                <tr>
                  <td class="p-3">
                    <div class="font-bold text-white">hero_banner</div>
                    <div class="text-[11px] text-slate-500">Akses modul Banner Slider Studio di etalase toko</div>
                  </td>
                  <td class="p-3 text-center">${renderMatrixToggle('starter', 'hero_banner', tiers.starter.features.hero_banner)}</td>
                  <td class="p-3 text-center">${renderMatrixToggle('pro', 'hero_banner', tiers.pro.features.hero_banner)}</td>
                  <td class="p-3 text-center">${renderMatrixToggle('enterprise', 'hero_banner', tiers.enterprise.features.hero_banner)}</td>
                </tr>

                <tr>
                  <td class="p-3">
                    <div class="font-bold text-white">max_hero_banners</div>
                    <div class="text-[11px] text-slate-500">Batas jumlah slide gambar banner etalase</div>
                  </td>
                  <td class="p-3 text-center font-mono">
                    <input type="number" min="1" max="20" class="input-matrix-number px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-center w-16 text-emerald-400 font-bold" data-tier="starter" data-field="max_hero_banners" value="${tiers.starter.features.max_hero_banners || 2}" />
                  </td>
                  <td class="p-3 text-center font-mono">
                    <input type="number" min="1" max="20" class="input-matrix-number px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-center w-16 text-blue-400 font-bold" data-tier="pro" data-field="max_hero_banners" value="${tiers.pro.features.max_hero_banners || 5}" />
                  </td>
                  <td class="p-3 text-center font-mono">
                    <input type="number" min="1" max="50" class="input-matrix-number px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-center w-16 text-purple-400 font-bold" data-tier="enterprise" data-field="max_hero_banners" value="${tiers.enterprise.features.max_hero_banners || 10}" />
                  </td>
                </tr>

                <tr>
                  <td class="p-3">
                    <div class="font-bold text-white">allow_dynamic_sections</div>
                    <div class="text-[11px] text-slate-500">Izin menambah/hapus seksi dinamis dan garis pemisah (divider)</div>
                  </td>
                  <td class="p-3 text-center">${renderMatrixToggle('starter', 'allow_dynamic_sections', tiers.starter.features.allow_dynamic_sections)}</td>
                  <td class="p-3 text-center">${renderMatrixToggle('pro', 'allow_dynamic_sections', tiers.pro.features.allow_dynamic_sections)}</td>
                  <td class="p-3 text-center">${renderMatrixToggle('enterprise', 'allow_dynamic_sections', tiers.enterprise.features.allow_dynamic_sections)}</td>
                </tr>

                <tr>
                  <td class="p-3">
                    <div class="font-bold text-white">allowed_product_cards</div>
                    <div class="text-[11px] text-slate-500">Pilihan model kartu produk etalase katalog</div>
                  </td>
                  <td class="p-3 text-center font-mono text-[11px]">
                    <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">Model v1</span>
                  </td>
                  <td class="p-3 text-center font-mono text-[11px]">
                    <span class="px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-bold">v1 + v2</span>
                  </td>
                  <td class="p-3 text-center font-mono text-[11px]">
                    <span class="px-2 py-0.5 rounded bg-slate-800 text-purple-300 font-bold">Semua (v1, v2, v3)</span>
                  </td>
                </tr>

                <!-- GROUP 2: ADMIN PANEL & OPERASIONAL -->
                <tr class="bg-slate-900/80 font-bold text-slate-400 text-[10px] tracking-wider uppercase font-mono">
                  <td colspan="4" class="p-2.5 pl-3">B. KONTROL FITUR ADMIN PANEL &amp; OPERASIONAL</td>
                </tr>

                <tr>
                  <td class="p-3">
                    <div class="font-bold text-white">max_branches</div>
                    <div class="text-[11px] text-slate-500">Batas pembuatan cabang workshop percetakan</div>
                  </td>
                  <td class="p-3 text-center font-mono">
                    <input type="number" min="1" max="10" class="input-matrix-number px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-center w-16 text-emerald-400 font-bold" data-tier="starter" data-field="max_branches" value="${tiers.starter.features.max_branches || 1}" />
                  </td>
                  <td class="p-3 text-center font-mono">
                    <input type="number" min="1" max="10" class="input-matrix-number px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-center w-16 text-blue-400 font-bold" data-tier="pro" data-field="max_branches" value="${tiers.pro.features.max_branches || 3}" />
                  </td>
                  <td class="p-3 text-center font-mono text-purple-400 font-bold">Unlimited (9999)</td>
                </tr>

                <tr>
                  <td class="p-3">
                    <div class="font-bold text-white">max_products</div>
                    <div class="text-[11px] text-slate-500">Batas kuota produk yang boleh ditambahkan ke katalog</div>
                  </td>
                  <td class="p-3 text-center font-mono">
                    <input type="number" min="5" max="500" step="5" class="input-matrix-number px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-center w-20 text-emerald-400 font-bold" data-tier="starter" data-field="max_products" value="${tiers.starter.features.max_products || 25}" />
                  </td>
                  <td class="p-3 text-center font-mono">
                    <input type="number" min="10" max="1000" step="10" class="input-matrix-number px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-center w-20 text-blue-400 font-bold" data-tier="pro" data-field="max_products" value="${tiers.pro.features.max_products || 150}" />
                  </td>
                  <td class="p-3 text-center font-mono text-purple-400 font-bold">Unlimited (9999)</td>
                </tr>

                <tr>
                  <td class="p-3">
                    <div class="font-bold text-white">allow_pos_cashier</div>
                    <div class="text-[11px] text-slate-500">Akses modul Kasir POS Offline &amp; Cetak Struk Thermal 58mm/80mm</div>
                  </td>
                  <td class="p-3 text-center">${renderMatrixToggle('starter', 'allow_pos_cashier', tiers.starter.features.allow_pos_cashier)}</td>
                  <td class="p-3 text-center">${renderMatrixToggle('pro', 'allow_pos_cashier', tiers.pro.features.allow_pos_cashier)}</td>
                  <td class="p-3 text-center">${renderMatrixToggle('enterprise', 'allow_pos_cashier', tiers.enterprise.features.allow_pos_cashier)}</td>
                </tr>

                <tr>
                  <td class="p-3">
                    <div class="font-bold text-white">manage_sponsor_ads</div>
                    <div class="text-[11px] text-slate-500">Akses slot iklan sponsor monetisasi (1-kolom, carousel, internal)</div>
                  </td>
                  <td class="p-3 text-center">${renderMatrixToggle('starter', 'manage_sponsor_ads', tiers.starter.features.manage_sponsor_ads)}</td>
                  <td class="p-3 text-center">${renderMatrixToggle('pro', 'manage_sponsor_ads', tiers.pro.features.manage_sponsor_ads)}</td>
                  <td class="p-3 text-center">${renderMatrixToggle('enterprise', 'manage_sponsor_ads', tiers.enterprise.features.manage_sponsor_ads)}</td>
                </tr>

                <tr>
                  <td class="p-3">
                    <div class="font-bold text-white">allow_voucher_loyalty</div>
                    <div class="text-[11px] text-slate-500">Akses fitur kupon &amp; voucher loyalitas diskon belanja</div>
                  </td>
                  <td class="p-3 text-center">${renderMatrixToggle('starter', 'allow_voucher_loyalty', tiers.starter.features.allow_voucher_loyalty)}</td>
                  <td class="p-3 text-center">${renderMatrixToggle('pro', 'allow_voucher_loyalty', tiers.pro.features.allow_voucher_loyalty)}</td>
                  <td class="p-3 text-center">${renderMatrixToggle('enterprise', 'allow_voucher_loyalty', tiers.enterprise.features.allow_voucher_loyalty)}</td>
                </tr>

                <tr>
                  <td class="p-3">
                    <div class="font-bold text-white">allow_affiliate</div>
                    <div class="text-[11px] text-slate-500">Akses modul Affiliate Marketing &amp; Komisi Reseller</div>
                  </td>
                  <td class="p-3 text-center">${renderMatrixToggle('starter', 'allow_affiliate', tiers.starter.features.allow_affiliate)}</td>
                  <td class="p-3 text-center">${renderMatrixToggle('pro', 'allow_affiliate', tiers.pro.features.allow_affiliate)}</td>
                  <td class="p-3 text-center">${renderMatrixToggle('enterprise', 'allow_affiliate', tiers.enterprise.features.allow_affiliate)}</td>
                </tr>

                <tr>
                  <td class="p-3">
                    <div class="font-bold text-white">allow_ai_description</div>
                    <div class="text-[11px] text-slate-500">Akses fitur AI Generator untuk membuat deskripsi produk otomatis</div>
                  </td>
                  <td class="p-3 text-center">${renderMatrixToggle('starter', 'allow_ai_description', tiers.starter.features.allow_ai_description)}</td>
                  <td class="p-3 text-center">${renderMatrixToggle('pro', 'allow_ai_description', tiers.pro.features.allow_ai_description)}</td>
                  <td class="p-3 text-center">${renderMatrixToggle('enterprise', 'allow_ai_description', tiers.enterprise.features.allow_ai_description)}</td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>

        <!-- ROLE HIERARCHY DELEGATION MATRIX -->
        <div class="glass-panel rounded-2xl p-6 space-y-4">
          <div class="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <div class="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <i data-lucide="users" class="w-4 h-4"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-white">Kontrol Hierarki Role Toko (Owner, Manager, Kasir)</h3>
              <p class="text-xs text-slate-400">Pengaturan izin akses default yang dapat didelegasikan oleh Owner kepada staf toko.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div class="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
              <div class="flex items-center gap-2 font-bold text-white">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>Role: Owner Toko</span>
              </div>
              <p class="text-[11px] text-slate-400 leading-relaxed">Memiliki hak akses 100% penuh untuk mengelola tema, produk, kupon, laporan laba, pengaturan printer kasir, dan delegasi izin.</p>
              <div class="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                Akses Penuh (Full Control)
              </div>
            </div>

            <div class="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
              <div class="flex items-center gap-2 font-bold text-white">
                <span class="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                <span>Role: Store Manager</span>
              </div>
              <p class="text-[11px] text-slate-400 leading-relaxed">Dapat mengelola katalog produk, memproses antrean pesanan, menjalankan kasir POS, dan melihat laporan penjualan harian.</p>
              <div class="text-[10px] text-blue-400 font-mono bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                Operasional &amp; Katalog
              </div>
            </div>

            <div class="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
              <div class="flex items-center gap-2 font-bold text-white">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>Role: Kasir POS (Cashier)</span>
              </div>
              <p class="text-[11px] text-slate-400 leading-relaxed">Fokus transaksi kasir &amp; cetak nota thermal. Didukung Mode UMKM di mana Kasir merangkap staf yang boleh mengedit detail harga produk.</p>
              <div class="text-[10px] text-amber-400 font-mono bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                POS Kasir &amp; Struk
              </div>
            </div>
          </div>
        </div>

      </div>
    `;

    bindTiersEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  function renderTierPricingCard(tier, key) {
    const formatIDR = (num) => 'Rp ' + Math.round(num || 0).toLocaleString('id-ID');
    let borderColor = 'border-emerald-500/30';
    let badgeBg = 'bg-emerald-500/20 text-emerald-300';
    if (key === 'pro') {
      borderColor = 'border-blue-500/30';
      badgeBg = 'bg-blue-500/20 text-blue-300';
    } else if (key === 'enterprise') {
      borderColor = 'border-purple-500/30';
      badgeBg = 'bg-purple-500/20 text-purple-300';
    }

    return `
      <div class="glass-panel p-6 rounded-2xl border ${borderColor} flex flex-col justify-between space-y-4 relative">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="px-3 py-1 rounded-full text-xs font-mono font-bold ${badgeBg}">
              ${escapeHtml(tier.code)}
            </span>
            <button type="button" class="btn-edit-tier-price text-slate-400 hover:text-white p-1 rounded cursor-pointer" data-tier="${key}" title="Edit Harga Paket">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
          </div>

          <div>
            <h3 class="text-lg font-black text-white">${escapeHtml(tier.name)}</h3>
            <p class="text-[11px] text-slate-400 mt-1 leading-relaxed">${escapeHtml(tier.tagline)}</p>
          </div>

          <div class="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1 font-mono">
            <div class="flex items-baseline justify-between">
              <span class="text-xs text-slate-400">Bulanan:</span>
              <span class="text-base font-black text-white">${formatIDR(tier.price_monthly)}<span class="text-[10px] text-slate-500 font-normal">/bln</span></span>
            </div>
            <div class="flex items-baseline justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
              <span>Tahunan:</span>
              <span class="text-emerald-400 font-bold">${formatIDR(tier.price_yearly)}<span class="text-[9px] text-slate-500 font-normal">/thn</span></span>
            </div>
          </div>
        </div>

        <div class="text-[11px] text-slate-400 space-y-1.5 pt-2 border-t border-slate-800">
          <div class="flex items-center gap-2">
            <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span>Maksimal ${tier.features.max_products} Produk Katalog</span>
          </div>
          <div class="flex items-center gap-2">
            <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span>${tier.features.max_branches} Cabang Toko Workshop</span>
          </div>
          <div class="flex items-center gap-2">
            <i data-lucide="${tier.features.manage_sponsor_ads ? 'check' : 'x'}" class="w-3.5 h-3.5 ${tier.features.manage_sponsor_ads ? 'text-emerald-400' : 'text-slate-600'}"></i>
            <span class="${tier.features.manage_sponsor_ads ? 'text-slate-300' : 'text-slate-600'}">Slot Iklan Sponsor Monetisasi</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderMatrixToggle(tierKey, featureKey, isChecked) {
    return `
      <label class="switch-toggle inline-block">
        <input type="checkbox" class="matrix-feature-toggle" data-tier="${tierKey}" data-feature="${featureKey}" ${isChecked ? 'checked' : ''} />
        <span class="switch-slider"></span>
      </label>
    `;
  }

  function bindTiersEvents() {
    const btnSave = document.getElementById('btn-save-tiers-matrix');
    if (btnSave) {
      btnSave.addEventListener('click', handleSaveTiersMatrix);
    }

    document.querySelectorAll('.btn-edit-tier-price').forEach(b => {
      b.addEventListener('click', () => {
        const tierKey = b.getAttribute('data-tier');
        openEditTierPriceModal(tierKey);
      });
    });
  }

  function handleSaveTiersMatrix() {
    const config = getMasterConfig();
    const tiers = config.tiers;

    // Collect matrix toggles
    document.querySelectorAll('.matrix-feature-toggle').forEach(tgl => {
      const tierKey = tgl.getAttribute('data-tier');
      const featureKey = tgl.getAttribute('data-feature');
      if (tiers[tierKey] && tiers[tierKey].features) {
        tiers[tierKey].features[featureKey] = tgl.checked;
      }
    });

    // Collect matrix number inputs
    document.querySelectorAll('.input-matrix-number').forEach(input => {
      const tierKey = input.getAttribute('data-tier');
      const field = input.getAttribute('data-field');
      const val = parseInt(input.value, 10);
      if (tiers[tierKey] && tiers[tierKey].features && !isNaN(val)) {
        tiers[tierKey].features[field] = val;
      }
    });

    saveMasterConfig();

    // Propagate updated features to all registered tenants
    const tenants = getTenants();
    const updatedTenants = tenants.map(t => enrichTenantObject(t));
    saveTenants(updatedTenants);

    showToast('Matriks Feature Flags paket berhasil diperbarui dan disinkronkan ke seluruh toko!', 'success');
    renderTiersAndMatrix();
  }

  // ----------------------------------------------------------------------------
  // 6. MENU 3: MANAJEMEN TENANT & KENDALI AKUN TOKO (CRUD + IMPERSONATE)
  // ----------------------------------------------------------------------------
  function renderTenantsManager() {
    const container = document.getElementById('tenants-view-container');
    if (!container) return;

    let tenants = getTenants();

    // Search filter
    if (tenantSearchQuery.trim() !== '') {
      const q = tenantSearchQuery.toLowerCase();
      tenants = tenants.filter(t =>
        (t.store_name && t.store_name.toLowerCase().includes(q)) ||
        (t.store_slug && t.store_slug.toLowerCase().includes(q)) ||
        (t.admin_username && t.admin_username.toLowerCase().includes(q)) ||
        (t.admin_email && t.admin_email.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (tenantStatusFilter !== 'all') {
      tenants = tenants.filter(t => t.status === tenantStatusFilter);
    }

    // Tier filter
    if (tenantTierFilter !== 'all') {
      tenants = tenants.filter(t => t.tier === tenantTierFilter);
    }

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div class="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
              <span>TENANT DIRECTORY &amp; STORE ACCOUNTS</span>
            </div>
            <h1 class="text-2xl font-black text-white tracking-tight">Manajemen Tenant &amp; Kendali Akun Toko</h1>
            <p class="text-xs text-slate-400 mt-1">Daftar seluruh toko percetakan di database. Kelola hak akses, override kuota produk, dan 1-klik Impersonate.</p>
          </div>
          <button type="button" id="btn-tenants-create-new" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>+ Buat Tenant / Toko Baru</span>
          </button>
        </div>

        <!-- Filters Bar -->
        <div class="glass-panel p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div class="relative flex-1 max-w-sm">
            <i data-lucide="search" class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
            <input type="text" id="input-tenant-search" value="${escapeHtml(tenantSearchQuery)}" placeholder="Cari nama toko, slug, atau admin..." class="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 outline-none focus:border-emerald-500 font-mono transition" />
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <!-- Filter Status -->
            <select id="select-tenant-status-filter" class="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 font-mono outline-none focus:border-emerald-500 cursor-pointer">
              <option value="all" ${tenantStatusFilter === 'all' ? 'selected' : ''}>Semua Status (${getTenants().length})</option>
              <option value="active" ${tenantStatusFilter === 'active' ? 'selected' : ''}>Hanya Aktif</option>
              <option value="trial" ${tenantStatusFilter === 'trial' ? 'selected' : ''}>Hanya Trial</option>
              <option value="suspended" ${tenantStatusFilter === 'suspended' ? 'selected' : ''}>Suspended</option>
            </select>

            <!-- Filter Tier -->
            <select id="select-tenant-tier-filter" class="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 font-mono outline-none focus:border-emerald-500 cursor-pointer">
              <option value="all" ${tenantTierFilter === 'all' ? 'selected' : ''}>Semua Paket</option>
              <option value="starter" ${tenantTierFilter === 'starter' ? 'selected' : ''}>UMKM Starter</option>
              <option value="pro" ${tenantTierFilter === 'pro' ? 'selected' : ''}>Bisnis Pro</option>
              <option value="enterprise" ${tenantTierFilter === 'enterprise' ? 'selected' : ''}>Enterprise Custom</option>
            </select>
          </div>
        </div>

        <!-- TENANTS TABLE -->
        <div class="glass-panel rounded-2xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs cockpit-table">
              <thead>
                <tr class="text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800 bg-slate-900/60">
                  <th class="p-4 w-48">ID / Store Slug</th>
                  <th class="p-4">Nama Toko &amp; Kontak</th>
                  <th class="p-4 w-36">Paket Aktif</th>
                  <th class="p-4 w-36">Masa Berlaku</th>
                  <th class="p-4 w-28 text-center">Cabang</th>
                  <th class="p-4 w-32 text-center">Status</th>
                  <th class="p-4 w-48 text-center">Kendali &amp; Impersonate</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800 text-slate-300">
                ${tenants.length === 0 ? `
                  <tr>
                    <td colspan="7" class="p-12 text-center text-slate-500 font-mono">
                      Tidak ada tenant toko yang sesuai dengan pencarian.
                    </td>
                  </tr>
                ` : tenants.map(t => renderTenantTableRow(t)).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    bindTenantsEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  function renderTenantTableRow(tenant) {
    let tierBadgeClass = 'tier-badge-pro';
    if (tenant.tier === 'starter') tierBadgeClass = 'tier-badge-starter';
    if (tenant.tier === 'enterprise') tierBadgeClass = 'tier-badge-enterprise';

    let statusPillClass = 'status-pill-active';
    let statusText = 'Active';
    if (tenant.status === 'suspended') {
      statusPillClass = 'status-pill-suspended';
      statusText = 'Suspended';
    } else if (tenant.status === 'trial') {
      statusPillClass = 'status-pill-trial';
      statusText = 'Trial';
    }

    const d = new Date(tenant.expires_at || Date.now());
    const dateFormatted = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const hasOverrides = tenant.feature_overrides && Object.keys(tenant.feature_overrides).length > 0;

    return `
      <tr class="hover:bg-slate-800/40 transition">
        <!-- Slug & Tenant ID -->
        <td class="p-4">
          <div class="font-mono font-bold text-cyan-400 text-xs">${escapeHtml(tenant.store_slug)}</div>
          <div class="font-mono text-[10px] text-slate-500 mt-0.5 truncate">${escapeHtml(tenant.tenant_id)}</div>
        </td>

        <!-- Store Name & Owner Info -->
        <td class="p-4 font-sans">
          <div class="font-black text-white text-sm">${escapeHtml(tenant.store_name)}</div>
          <div class="text-[11px] text-slate-400 mt-0.5">${escapeHtml(tenant.admin_email)} • ${escapeHtml(tenant.phone)}</div>
          <div class="text-[10px] text-slate-500 font-mono mt-0.5">Admin User: <strong>${escapeHtml(tenant.admin_username)}</strong></div>
        </td>

        <!-- Tier & Overrides Indicator -->
        <td class="p-4">
          <span class="inline-block px-2.5 py-1 rounded-md text-[10px] font-mono font-bold ${tierBadgeClass}">
            ${escapeHtml(tenant.tier_name)}
          </span>
          ${hasOverrides ? `
            <span class="block mt-1 text-[9px] font-mono text-amber-400 flex items-center gap-1">
              <i data-lucide="alert-circle" class="w-3 h-3"></i>
              <span>Fitur Di-override</span>
            </span>
          ` : ''}
        </td>

        <!-- Expires At -->
        <td class="p-4 font-mono text-slate-300 text-xs">
          ${dateFormatted}
          <span class="block text-[10px] text-slate-500 uppercase">${tenant.billing_cycle || 'monthly'}</span>
        </td>

        <!-- Branches -->
        <td class="p-4 text-center font-mono font-bold text-white">
          ${tenant.branch_count || 1} Cabang
        </td>

        <!-- Status -->
        <td class="p-4 text-center">
          <div class="inline-flex flex-col items-center gap-1">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusPillClass}">
              ${statusText}
            </span>
            <button type="button" class="btn-toggle-tenant-status text-[10px] text-slate-400 hover:text-white underline cursor-pointer" data-slug="${escapeHtml(tenant.store_slug)}" data-current="${tenant.status}">
              ${tenant.status === 'active' ? 'Suspend' : 'Aktifkan'}
            </button>
          </div>
        </td>

        <!-- Actions: Impersonate & Override -->
        <td class="p-4 text-center font-sans">
          <div class="flex items-center justify-center gap-1.5">
            <!-- 1-Click Impersonate Button -->
            <button type="button" class="btn-impersonate-action px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition cursor-pointer" data-slug="${escapeHtml(tenant.store_slug)}" title="Login Sebagai Owner (1-Klik)">
              <i data-lucide="log-in" class="w-3.5 h-3.5"></i>
              <span>Impersonate</span>
            </button>
            
            <!-- Override Fitur Button -->
            <button type="button" class="btn-override-action p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer" data-slug="${escapeHtml(tenant.store_slug)}" title="Edit Hak Akses & Override Fitur Khusus">
              <i data-lucide="sliders" class="w-3.5 h-3.5 text-cyan-400"></i>
            </button>

            <!-- Delete / Archive Tenant -->
            <button type="button" class="btn-delete-tenant p-2 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:border-rose-700 text-slate-400 hover:text-rose-400 border border-slate-700 transition cursor-pointer" data-slug="${escapeHtml(tenant.store_slug)}" title="Hapus / Reset Tenant">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  function bindTenantsEvents() {
    const btnNew = document.getElementById('btn-tenants-create-new');
    if (btnNew) {
      btnNew.addEventListener('click', () => openCreateTenantModal());
    }

    const searchInput = document.getElementById('input-tenant-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        tenantSearchQuery = e.target.value;
        renderTenantsManager();
      });
    }

    const statusFilter = document.getElementById('select-tenant-status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        tenantStatusFilter = e.target.value;
        renderTenantsManager();
      });
    }

    const tierFilter = document.getElementById('select-tenant-tier-filter');
    if (tierFilter) {
      tierFilter.addEventListener('change', (e) => {
        tenantTierFilter = e.target.value;
        renderTenantsManager();
      });
    }

    // Impersonate Click
    document.querySelectorAll('.btn-impersonate-action').forEach(b => {
      b.addEventListener('click', () => {
        const slug = b.getAttribute('data-slug');
        handleImpersonateStore(slug);
      });
    });

    // Override Click
    document.querySelectorAll('.btn-override-action').forEach(b => {
      b.addEventListener('click', () => {
        const slug = b.getAttribute('data-slug');
        openTenantOverrideModal(slug);
      });
    });

    // Toggle Status
    document.querySelectorAll('.btn-toggle-tenant-status').forEach(b => {
      b.addEventListener('click', () => {
        const slug = b.getAttribute('data-slug');
        const current = b.getAttribute('data-current');
        const nextStatus = current === 'active' ? 'suspended' : 'active';
        handleToggleTenantStatus(slug, nextStatus);
      });
    });

    // Delete Tenant
    document.querySelectorAll('.btn-delete-tenant').forEach(b => {
      b.addEventListener('click', () => {
        const slug = b.getAttribute('data-slug');
        handleDeleteTenant(slug);
      });
    });
  }

  // ----------------------------------------------------------------------------
  // 6B. IMPERSONATE ENGINE (LOGIN AS OWNER)
  // ----------------------------------------------------------------------------
  function handleImpersonateStore(storeSlug) {
    const tenants = getTenants();
    const tenant = tenants.find(t => t.store_slug === storeSlug);
    if (!tenant) {
      showToast('Tenant toko tidak ditemukan!', 'error');
      return;
    }

    selectedTenantForImpersonate = tenant;

    // Set seller session in sessionStorage
    sessionStorage.setItem('pos_admin_logged_in', 'true');
    sessionStorage.setItem('pos_admin_store_slug', tenant.store_slug);

    // Open Impersonate Destination Modal so Superadmin can choose where to enter
    openImpersonateModal(tenant);
  }

  function openImpersonateModal(tenant) {
    const modal = document.getElementById('modal-impersonate-destination');
    const storeNameEl = document.getElementById('impersonate-modal-store-name');
    const storeSlugEl = document.getElementById('impersonate-modal-store-slug');
    if (!modal) return;

    if (storeNameEl) storeNameEl.textContent = tenant.store_name;
    if (storeSlugEl) storeSlugEl.textContent = `Slug: ${tenant.store_slug} (${tenant.tier_name})`;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  function closeImpersonateModal() {
    const modal = document.getElementById('modal-impersonate-destination');
    if (modal) modal.classList.add('hidden');
  }

  // ----------------------------------------------------------------------------
  // 6C. TENANT CRUD OPERATIONS
  // ----------------------------------------------------------------------------
  function openCreateTenantModal() {
    const modal = document.getElementById('modal-create-tenant');
    if (modal) {
      modal.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function closeCreateTenantModal() {
    const modal = document.getElementById('modal-create-tenant');
    if (modal) modal.classList.add('hidden');
  }

  function handleSaveNewTenant() {
    const storeName = document.getElementById('create-store-name')?.value.trim();
    const customSlug = document.getElementById('create-store-slug')?.value.trim();
    const adminUser = document.getElementById('create-admin-username')?.value.trim() || 'admin';
    const adminPass = document.getElementById('create-admin-password')?.value.trim() || 'admin123';
    const adminEmail = document.getElementById('create-admin-email')?.value.trim() || 'owner@toko.com';
    const adminPhone = document.getElementById('create-admin-phone')?.value.trim() || '0812-3456-7890';
    const tier = document.getElementById('create-tier-select')?.value || 'pro';
    const billingCycle = document.getElementById('create-billing-cycle')?.value || 'monthly';
    const status = document.getElementById('create-status-select')?.value || 'active';

    if (!storeName) {
      showToast('Nama Toko wajib diisi!', 'error');
      return;
    }

    const config = getMasterConfig();
    const tenants = getTenants();

    // Generate unique slug
    let slug = customSlug;
    if (!slug) {
      const baseSlug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      let counter = 1;
      slug = `${baseSlug}-01`;
      while (tenants.some(t => t.store_slug === slug)) {
        counter++;
        slug = `${baseSlug}-${String(counter).padStart(2, '0')}`;
      }
    } else {
      slug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (tenants.some(t => t.store_slug === slug)) {
        showToast(`Store Slug "${slug}" sudah digunakan! Harap ganti slug lain.`, 'error');
        return;
      }
    }

    const newId = 'tenant-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    const now = new Date();
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);

    const newTenant = {
      tenant_id: newId,
      store_slug: slug,
      store_name: storeName,
      store_tagline: 'Cabang Percetakan Terpadu',
      admin_id: 'admin-' + slug,
      admin_username: adminUser,
      admin_password: adminPass,
      admin_email: adminEmail,
      phone: adminPhone,
      edition: config.edition_code,
      tier: tier,
      billing_cycle: billingCycle,
      status: status,
      branch_count: 1,
      feature_overrides: {},
      created_at: now.toISOString(),
      expires_at: expires.toISOString()
    };

    // Enrich and append
    const enriched = enrichTenantObject(newTenant);
    tenants.push(enriched);
    saveTenants(tenants);

    // Initialize Default Settings for this new store in localStorage
    try {
      const defaultSettings = {
        store_name: storeName,
        store_tagline: 'Cabang Percetakan Terpadu',
        store_phone: adminPhone,
        store_address: 'Workshop Pusat Percetakan',
        primary_color: '#33b589',
        secondary_color: '#f59e0b',
        printer_paper_width: '58mm',
        receipt_header: storeName,
        receipt_footer: 'Terima kasih atas pesanan Anda!'
      };
      localStorage.setItem(`pos_settings_${newId}`, JSON.stringify(defaultSettings));
      localStorage.setItem(`pos_settings_${slug}`, JSON.stringify(defaultSettings));
    } catch (e) {}

    closeCreateTenantModal();
    showToast(`Tenant baru "${storeName}" (${slug}) berhasil dibuat!`, 'success');
    renderAllViews();
  }

  function handleToggleTenantStatus(storeSlug, newStatus) {
    const tenants = getTenants();
    const idx = tenants.findIndex(t => t.store_slug === storeSlug);
    if (idx !== -1) {
      tenants[idx].status = newStatus;
      saveTenants(tenants);
      showToast(`Status tenant ${storeSlug} diubah menjadi: ${newStatus.toUpperCase()}`, 'success');
      renderAllViews();
    }
  }

  function handleDeleteTenant(storeSlug) {
    if (storeSlug === 'songer-creative-01') {
      alert('Toko master utama (songer-creative-01) tidak boleh dihapus demi menjaga integritas data demo!');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus tenant "${storeSlug}"? Seluruh data katalog & pesanan lokal toko ini akan dihapus.`)) {
      let tenants = getTenants();
      tenants = tenants.filter(t => t.store_slug !== storeSlug);
      saveTenants(tenants);
      showToast(`Tenant "${storeSlug}" berhasil dihapus.`, 'info');
      renderAllViews();
    }
  }

  // ----------------------------------------------------------------------------
  // 6D. OVERRIDE FITUR KHUSUS PER TOKO
  // ----------------------------------------------------------------------------
  function openTenantOverrideModal(storeSlug) {
    const tenants = getTenants();
    const tenant = tenants.find(t => t.store_slug === storeSlug);
    if (!tenant) return;

    selectedTenantForOverride = tenant;
    const modal = document.getElementById('modal-tenant-overrides');
    const titleEl = document.getElementById('override-modal-store-name');
    const tierBadgeEl = document.getElementById('override-modal-tier-badge');
    const formContainer = document.getElementById('override-form-toggles-container');

    if (titleEl) titleEl.textContent = tenant.store_name;
    if (tierBadgeEl) tierBadgeEl.textContent = `Paket: ${tenant.tier_name} (${tenant.store_slug})`;

    const config = getMasterConfig();
    const tierDef = config.tiers[tenant.tier] || config.tiers.pro;
    const baseFeatures = tierDef.features;
    const currentFeatures = tenant.features;
    const overrides = tenant.feature_overrides || {};

    // Build interactive override toggle list
    if (formContainer) {
      formContainer.innerHTML = `
        <div class="space-y-4 text-xs font-mono">
          <div class="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-300">
            <span class="font-bold text-amber-400 block mb-0.5">Catatan Superadmin:</span>
            Pengecualian (override) fitur ini berlaku khusus untuk <strong>${escapeHtml(tenant.store_name)}</strong> di luar paket standarnya.
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            <!-- Custom Theme Colors -->
            <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span class="text-white font-bold block">custom_theme_colors</span>
                <span class="text-[10px] text-slate-500 font-sans">Palet warna kustom</span>
              </div>
              <label class="switch-toggle inline-block">
                <input type="checkbox" class="tenant-override-toggle" data-feature="custom_theme_colors" ${currentFeatures.custom_theme_colors ? 'checked' : ''} />
                <span class="switch-slider"></span>
              </label>
            </div>

            <!-- Custom Fonts -->
            <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span class="text-white font-bold block">allow_custom_fonts</span>
                <span class="text-[10px] text-slate-500 font-sans">Font kustom toko</span>
              </div>
              <label class="switch-toggle inline-block">
                <input type="checkbox" class="tenant-override-toggle" data-feature="allow_custom_fonts" ${currentFeatures.allow_custom_fonts ? 'checked' : ''} />
                <span class="switch-slider"></span>
              </label>
            </div>

            <!-- Hero Banner -->
            <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span class="text-white font-bold block">hero_banner</span>
                <span class="text-[10px] text-slate-500 font-sans">Hero Slider Studio</span>
              </div>
              <label class="switch-toggle inline-block">
                <input type="checkbox" class="tenant-override-toggle" data-feature="hero_banner" ${currentFeatures.hero_banner ? 'checked' : ''} />
                <span class="switch-slider"></span>
              </label>
            </div>

            <!-- Dynamic Sections -->
            <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span class="text-white font-bold block">allow_dynamic_sections</span>
                <span class="text-[10px] text-slate-500 font-sans">Seksi dinamis &amp; garis</span>
              </div>
              <label class="switch-toggle inline-block">
                <input type="checkbox" class="tenant-override-toggle" data-feature="allow_dynamic_sections" ${currentFeatures.allow_dynamic_sections ? 'checked' : ''} />
                <span class="switch-slider"></span>
              </label>
            </div>

            <!-- POS Cashier Offline -->
            <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span class="text-white font-bold block">allow_pos_cashier</span>
                <span class="text-[10px] text-slate-500 font-sans">Mesin POS Kasir Offline</span>
              </div>
              <label class="switch-toggle inline-block">
                <input type="checkbox" class="tenant-override-toggle" data-feature="allow_pos_cashier" ${currentFeatures.allow_pos_cashier ? 'checked' : ''} />
                <span class="switch-slider"></span>
              </label>
            </div>

            <!-- Manage Sponsor Ads -->
            <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span class="text-white font-bold block">manage_sponsor_ads</span>
                <span class="text-[10px] text-slate-400 font-sans">Iklan sponsor monetisasi</span>
              </div>
              <label class="switch-toggle inline-block">
                <input type="checkbox" class="tenant-override-toggle" data-feature="manage_sponsor_ads" ${currentFeatures.manage_sponsor_ads ? 'checked' : ''} />
                <span class="switch-slider"></span>
              </label>
            </div>

            <!-- Voucher & Loyalty -->
            <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span class="text-white font-bold block">allow_voucher_loyalty</span>
                <span class="text-[10px] text-slate-500 font-sans">Kupon voucher promo</span>
              </div>
              <label class="switch-toggle inline-block">
                <input type="checkbox" class="tenant-override-toggle" data-feature="allow_voucher_loyalty" ${currentFeatures.allow_voucher_loyalty ? 'checked' : ''} />
                <span class="switch-slider"></span>
              </label>
            </div>

            <!-- AI Description Generator -->
            <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span class="text-white font-bold block">allow_ai_description</span>
                <span class="text-[10px] text-slate-500 font-sans">AI pembuat deskripsi</span>
              </div>
              <label class="switch-toggle inline-block">
                <input type="checkbox" class="tenant-override-toggle" data-feature="allow_ai_description" ${currentFeatures.allow_ai_description ? 'checked' : ''} />
                <span class="switch-slider"></span>
              </label>
            </div>

            <!-- Affiliate Marketing -->
            <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span class="text-white font-bold block">allow_affiliate</span>
                <span class="text-[10px] text-slate-500 font-sans">Sistem Afiliasi / Reseller</span>
              </div>
              <label class="switch-toggle inline-block">
                <input type="checkbox" class="tenant-override-toggle" data-feature="allow_affiliate" ${currentFeatures.allow_affiliate ? 'checked' : ''} />
                <span class="switch-slider"></span>
              </label>
            </div>

            <!-- Max Products Limit -->
            <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span class="text-white font-bold block">max_products</span>
                <span class="text-[10px] text-slate-500 font-sans">Batas kuota produk katalog</span>
              </div>
              <input type="number" id="override-input-max-products" min="5" max="9999" value="${currentFeatures.max_products || 100}" class="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-center font-bold text-cyan-400" />
            </div>

          </div>

          <div class="pt-2 flex items-center justify-between">
            <button type="button" id="btn-reset-tenant-overrides" class="text-rose-400 hover:underline text-[11px] cursor-pointer">
              Kembalikan ke Default Paket ${escapeHtml(tenant.tier_name)}
            </button>
          </div>
        </div>
      `;
    }

    if (modal) {
      modal.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function closeTenantOverrideModal() {
    const modal = document.getElementById('modal-tenant-overrides');
    if (modal) modal.classList.add('hidden');
    selectedTenantForOverride = null;
  }

  function handleSaveTenantOverrides() {
    if (!selectedTenantForOverride) return;

    const storeSlug = selectedTenantForOverride.store_slug;
    const tenants = getTenants();
    const idx = tenants.findIndex(t => t.store_slug === storeSlug);
    if (idx === -1) return;

    const newOverrides = {};
    document.querySelectorAll('.tenant-override-toggle').forEach(tgl => {
      const featureKey = tgl.getAttribute('data-feature');
      newOverrides[featureKey] = tgl.checked;
    });

    const maxProdInput = document.getElementById('override-input-max-products');
    if (maxProdInput) {
      newOverrides.max_products = parseInt(maxProdInput.value, 10) || 100;
    }

    tenants[idx].feature_overrides = newOverrides;
    const updated = enrichTenantObject(tenants[idx]);
    tenants[idx] = updated;

    saveTenants(tenants);
    closeTenantOverrideModal();
    showToast(`Override fitur untuk "${selectedTenantForOverride.store_name}" berhasil disimpan!`, 'success');
    renderAllViews();
  }

  function handleResetTenantOverrides() {
    if (!selectedTenantForOverride) return;
    if (confirm('Hapus seluruh override khusus dan kembalikan fitur toko ini ke pengaturan standar paket langganannya?')) {
      const storeSlug = selectedTenantForOverride.store_slug;
      const tenants = getTenants();
      const idx = tenants.findIndex(t => t.store_slug === storeSlug);
      if (idx !== -1) {
        tenants[idx].feature_overrides = {};
        const updated = enrichTenantObject(tenants[idx]);
        tenants[idx] = updated;
        saveTenants(tenants);
        closeTenantOverrideModal();
        showToast('Fitur toko dikembalikan ke standar paket.', 'info');
        renderAllViews();
      }
    }
  }

  // ----------------------------------------------------------------------------
  // 7. MENU 4: PUSAT BROADCAST & NOTIFIKASI SISTEM
  // ----------------------------------------------------------------------------
  function renderBroadcastCenter() {
    const container = document.getElementById('broadcast-view-container');
    if (!container) return;

    const notifs = getSystemNotifications();
    const tenants = getTenants();

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div class="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <span>SYSTEM BROADCAST &amp; NOTIFICATION CENTER</span>
            </div>
            <h1 class="text-2xl font-black text-white tracking-tight">Pusat Siaran &amp; Notifikasi Sistem</h1>
            <p class="text-xs text-slate-400 mt-1">Kirim pengumuman pembaruan, peringatan tagihan, atau promo sistem langsung ke ikon Lonceng Topbar seluruh seller.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- LEFT: FORM KIRIM BROADCAST BARU (5 COLS) -->
          <div class="lg:col-span-5 glass-panel p-6 rounded-2xl space-y-4">
            <div class="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div class="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <i data-lucide="megaphone" class="w-4 h-4"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold text-white">Buat Siaran Notifikasi Baru</h3>
                <p class="text-[11px] text-slate-400">Otomatis tersimpan di <code>pos_system_notifications</code>.</p>
              </div>
            </div>

            <form id="form-create-broadcast" class="space-y-4 text-xs" onsubmit="event.preventDefault();">
              <div>
                <label class="block font-bold text-slate-300 mb-1">Judul Pengumuman <span class="text-red-400">*</span>:</label>
                <input type="text" id="broadcast-title-input" required placeholder="Contoh: Pembaruan Sistem v1.4.0 Dirilis!" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium outline-none focus:border-cyan-500" />
              </div>

              <div>
                <label class="block font-bold text-slate-300 mb-1">Tipe Pesan:</label>
                <select id="broadcast-type-select" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 font-mono outline-none focus:border-cyan-500 cursor-pointer">
                  <option value="info">🔵 Info Pembaruan / Update Fitur</option>
                  <option value="warning">🟡 Peringatan Tagihan / Kuota Layanan</option>
                  <option value="promo">🟢 Promo Sistem / Event Spesial</option>
                  <option value="critical">🔴 Darurat / Pemeliharaan Server Cloud</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-300 mb-1">Target Penerima Toko:</label>
                <select id="broadcast-target-select" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 font-mono outline-none focus:border-cyan-500 cursor-pointer">
                  <option value="all">📢 Semua Toko Terdaftar (Global Broadcast)</option>
                  <optgroup label="Berdasarkan Paket Langganan:">
                    <option value="tier_starter">Hanya Semua Toko UMKM Starter</option>
                    <option value="tier_pro">Hanya Semua Toko Bisnis Pro</option>
                    <option value="tier_enterprise">Hanya Semua Toko Enterprise Custom</option>
                  </optgroup>
                  <optgroup label="Toko Spesifik:">
                    ${tenants.map(t => `
                      <option value="store_${t.store_slug}">${t.store_name} (${t.store_slug})</option>
                    `).join('')}
                  </optgroup>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-300 mb-1">Isi Pesan Notifikasi <span class="text-red-400">*</span>:</label>
                <textarea id="broadcast-message-input" rows="4" required placeholder="Tuliskan rincian pesan pengumuman atau instruksi untuk seller..." class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 outline-none focus:border-cyan-500 leading-relaxed font-sans"></textarea>
              </div>

              <!-- Live Preview Card -->
              <div class="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
                <span class="text-[10px] font-mono text-slate-500 uppercase block font-bold">Pratinjau Tampilan Notifikasi Seller:</span>
                <div id="broadcast-live-preview" class="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs space-y-1">
                  <div class="font-bold text-white flex items-center gap-1.5" id="preview-notif-title">
                    <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
                    <span>Judul Pengumuman</span>
                  </div>
                  <p class="text-[11px] text-slate-400 line-clamp-2" id="preview-notif-msg">Isi pesan pengumuman...</p>
                </div>
              </div>

              <button type="submit" id="btn-submit-broadcast" class="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40 transition cursor-pointer">
                <i data-lucide="send" class="w-4 h-4"></i>
                <span>Siarkan Notifikasi Sekarang</span>
              </button>
            </form>
          </div>

          <!-- RIGHT: RIWAYAT BROADCAST YANG TELAH DIKIRIM (7 COLS) -->
          <div class="lg:col-span-7 glass-panel p-6 rounded-2xl space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <i data-lucide="history" class="w-4 h-4"></i>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white">Riwayat Notifikasi Sistem (${notifs.length})</h3>
                  <p class="text-[11px] text-slate-400">Daftar pesan yang aktif di lonceng notifikasi seller.</p>
                </div>
              </div>

              <button type="button" id="btn-clear-all-broadcasts" class="text-[11px] text-rose-400 hover:underline font-mono cursor-pointer">
                Kosongkan Semua
              </button>
            </div>

            <div class="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              ${notifs.length === 0 ? `
                <div class="py-12 text-center text-slate-500 font-mono text-xs">
                  Belum ada riwayat siaran notifikasi sistem.
                </div>
              ` : notifs.map(n => renderBroadcastHistoryCard(n)).join('')}
            </div>
          </div>

        </div>

      </div>
    `;

    bindBroadcastEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  function renderBroadcastHistoryCard(notif) {
    let typeBadge = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    let typeLabel = 'INFO';
    if (notif.type === 'warning') {
      typeBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      typeLabel = 'PERINGATAN';
    } else if (notif.type === 'promo') {
      typeBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      typeLabel = 'PROMO';
    } else if (notif.type === 'critical') {
      typeBadge = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      typeLabel = 'DARURAT';
    }

    const d = new Date(notif.created_at || Date.now());
    const dateFormatted = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    return `
      <div class="p-4 bg-slate-900/70 rounded-xl border border-slate-800 space-y-2 hover:border-slate-700 transition relative group">
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${typeBadge}">
                ${typeLabel}
              </span>
              <span class="text-[10px] font-mono text-slate-500">${dateFormatted}</span>
              <span class="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.2 rounded border border-cyan-800/40">
                Target: ${escapeHtml(notif.target_name || notif.target)}
              </span>
            </div>
            <h4 class="font-bold text-white text-xs">${escapeHtml(notif.title)}</h4>
          </div>

          <button type="button" class="btn-delete-broadcast text-slate-500 hover:text-rose-400 p-1.5 transition cursor-pointer" data-id="${escapeHtml(notif.id)}" title="Hapus Siaran">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed font-sans">${escapeHtml(notif.message)}</p>

        <div class="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60 flex items-center justify-between">
          <span>Pengirim: <strong>${escapeHtml(notif.author || 'Superadmin')}</strong></span>
          <span class="text-emerald-400">Tersimpan di pos_system_notifications</span>
        </div>
      </div>
    `;
  }

  function bindBroadcastEvents() {
    const titleInput = document.getElementById('broadcast-title-input');
    const msgInput = document.getElementById('broadcast-message-input');
    const previewTitle = document.getElementById('preview-notif-title');
    const previewMsg = document.getElementById('preview-notif-msg');

    if (titleInput && previewTitle) {
      titleInput.addEventListener('input', (e) => {
        previewTitle.innerHTML = `<span class="w-2 h-2 rounded-full bg-cyan-400"></span><span>${escapeHtml(e.target.value) || 'Judul Pengumuman'}</span>`;
      });
    }

    if (msgInput && previewMsg) {
      msgInput.addEventListener('input', (e) => {
        previewMsg.textContent = e.target.value || 'Isi pesan pengumuman...';
      });
    }

    const form = document.getElementById('form-create-broadcast');
    if (form) {
      form.addEventListener('submit', handleSendBroadcast);
    }

    document.querySelectorAll('.btn-delete-broadcast').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-id');
        handleDeleteBroadcast(id);
      });
    });

    const btnClearAll = document.getElementById('btn-clear-all-broadcasts');
    if (btnClearAll) {
      btnClearAll.addEventListener('click', () => {
        if (confirm('Kosongkan semua riwayat siaran notifikasi sistem?')) {
          saveSystemNotifications([]);
          showToast('Seluruh riwayat siaran dibersihkan.', 'info');
          renderBroadcastCenter();
        }
      });
    }
  }

  function handleSendBroadcast(e) {
    e.preventDefault();
    const title = document.getElementById('broadcast-title-input')?.value.trim();
    const type = document.getElementById('broadcast-type-select')?.value || 'info';
    const target = document.getElementById('broadcast-target-select')?.value || 'all';
    const message = document.getElementById('broadcast-message-input')?.value.trim();

    if (!title || !message) {
      showToast('Harap lengkapi judul dan pesan notifikasi!', 'error');
      return;
    }

    let targetName = 'Semua Toko';
    if (target === 'tier_starter') targetName = 'Semua Toko Starter';
    else if (target === 'tier_pro') targetName = 'Semua Toko Pro';
    else if (target === 'tier_enterprise') targetName = 'Semua Toko Enterprise';
    else if (target.startsWith('store_')) {
      const slug = target.replace('store_', '');
      const t = getTenants().find(item => item.store_slug === slug);
      targetName = t ? t.store_name : slug;
    }

    const newNotif = {
      id: 'notif-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      title: title,
      message: message,
      type: type,
      target: target,
      target_name: targetName,
      author: 'Superadmin Songer Central',
      created_at: new Date().toISOString()
    };

    const notifs = getSystemNotifications();
    notifs.unshift(newNotif);
    saveSystemNotifications(notifs);

    showToast(`Siaran "${title}" berhasil dikirim ke ${targetName}!`, 'success');
    renderBroadcastCenter();
  }

  function handleDeleteBroadcast(id) {
    if (confirm('Hapus notifikasi siaran ini?')) {
      let notifs = getSystemNotifications();
      notifs = notifs.filter(n => n.id !== id);
      saveSystemNotifications(notifs);
      showToast('Notifikasi berhasil dihapus.', 'info');
      renderBroadcastCenter();
    }
  }

  // ----------------------------------------------------------------------------
  // 8. GLOBAL EVENT BINDINGS
  // ----------------------------------------------------------------------------
  function bindGlobalEvents() {
    // Tab switching
    document.querySelectorAll('.superadmin-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        if (target) switchTab(target);
      });
    });

    // Logout
    const btnLogout = document.getElementById('btn-superadmin-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', logoutSuperadmin);
    }

    // Modal Create Tenant
    const btnCloseCreateTenant = document.getElementById('btn-close-create-tenant-modal');
    const btnCancelCreateTenant = document.getElementById('btn-cancel-create-tenant-modal');
    const btnSubmitCreateTenant = document.getElementById('btn-submit-create-tenant');

    if (btnCloseCreateTenant) btnCloseCreateTenant.addEventListener('click', closeCreateTenantModal);
    if (btnCancelCreateTenant) btnCancelCreateTenant.addEventListener('click', closeCreateTenantModal);
    if (btnSubmitCreateTenant) btnSubmitCreateTenant.addEventListener('click', handleSaveNewTenant);

    // Modal Overrides
    const btnCloseOverride = document.getElementById('btn-close-override-modal');
    const btnCancelOverride = document.getElementById('btn-cancel-override-modal');
    const btnSaveOverride = document.getElementById('btn-save-tenant-overrides');
    const btnResetOverride = document.getElementById('btn-reset-tenant-overrides');

    if (btnCloseOverride) btnCloseOverride.addEventListener('click', closeTenantOverrideModal);
    if (btnCancelOverride) btnCancelOverride.addEventListener('click', closeTenantOverrideModal);
    if (btnSaveOverride) btnSaveOverride.addEventListener('click', handleSaveTenantOverrides);
    if (btnResetOverride) btnResetOverride.addEventListener('click', handleResetTenantOverrides);

    // Modal Impersonate
    const btnCloseImpersonate = document.getElementById('btn-close-impersonate-modal');
    const btnCancelImpersonate = document.getElementById('btn-cancel-impersonate-modal');
    const btnOpenAdminPanel = document.getElementById('btn-open-impersonate-admin');
    const btnOpenThemeEditor = document.getElementById('btn-open-impersonate-theme');
    const btnOpenStorefront = document.getElementById('btn-open-impersonate-storefront');

    if (btnCloseImpersonate) btnCloseImpersonate.addEventListener('click', closeImpersonateModal);
    if (btnCancelImpersonate) btnCancelImpersonate.addEventListener('click', closeImpersonateModal);

    if (btnOpenAdminPanel) {
      btnOpenAdminPanel.addEventListener('click', () => {
        if (!selectedTenantForImpersonate) return;
        sessionStorage.setItem('pos_admin_logged_in', 'true');
        sessionStorage.setItem('pos_admin_store_slug', selectedTenantForImpersonate.store_slug);
        closeImpersonateModal();
        window.open('../admin.html', '_blank');
      });
    }

    if (btnOpenThemeEditor) {
      btnOpenThemeEditor.addEventListener('click', () => {
        if (!selectedTenantForImpersonate) return;
        sessionStorage.setItem('pos_admin_logged_in', 'true');
        sessionStorage.setItem('pos_admin_store_slug', selectedTenantForImpersonate.store_slug);
        closeImpersonateModal();
        window.open('../theme-editor.html', '_blank');
      });
    }

    if (btnOpenStorefront) {
      btnOpenStorefront.addEventListener('click', () => {
        if (!selectedTenantForImpersonate) return;
        closeImpersonateModal();
        window.open(`../index.html?store=${encodeURIComponent(selectedTenantForImpersonate.store_slug)}`, '_blank');
      });
    }

    // Modal Edit Tier Price
    const btnCloseTierPrice = document.getElementById('btn-close-tier-price-modal');
    const btnCancelTierPrice = document.getElementById('btn-cancel-tier-price-modal');
    const btnSaveTierPrice = document.getElementById('btn-save-tier-price');

    if (btnCloseTierPrice) btnCloseTierPrice.addEventListener('click', closeEditTierPriceModal);
    if (btnCancelTierPrice) btnCancelTierPrice.addEventListener('click', closeEditTierPriceModal);
    if (btnSaveTierPrice) btnSaveTierPrice.addEventListener('click', handleSaveTierPrice);

    // Login Form
    const formLogin = document.getElementById('form-superadmin-login');
    const btnAutofill = document.getElementById('btn-autofill-superadmin');
    const userInput = document.getElementById('superadmin-username-input');
    const passInput = document.getElementById('superadmin-password-input');
    const errorBox = document.getElementById('superadmin-login-error');

    if (btnAutofill) {
      btnAutofill.addEventListener('click', () => {
        if (userInput) userInput.value = 'superadmin';
        if (passInput) passInput.value = 'songermaster';
        if (errorBox) errorBox.classList.add('hidden');
      });
    }

    if (formLogin) {
      formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const u = userInput ? userInput.value : '';
        const p = passInput ? passInput.value : '';
        const success = authenticateSuperadmin(u, p);
        if (!success) {
          if (errorBox) {
            errorBox.textContent = 'Kredensial Superadmin salah! Gunakan: superadmin / songermaster';
            errorBox.classList.remove('hidden');
          }
        } else {
          if (errorBox) errorBox.classList.add('hidden');
        }
      });
    }
  }

  // ----------------------------------------------------------------------------
  // 8B. EDIT TIER PRICE MODAL
  // ----------------------------------------------------------------------------
  let activeTierForPriceEdit = null;

  function openEditTierPriceModal(tierKey) {
    const config = getMasterConfig();
    const tier = config.tiers[tierKey];
    if (!tier) return;

    activeTierForPriceEdit = tierKey;
    const modal = document.getElementById('modal-edit-tier-price');
    const nameEl = document.getElementById('tier-price-modal-title');
    const monthlyInput = document.getElementById('tier-edit-price-monthly');
    const yearlyInput = document.getElementById('tier-edit-price-yearly');
    const taglineInput = document.getElementById('tier-edit-tagline');

    if (nameEl) nameEl.textContent = `Atur Tarif: ${tier.name}`;
    if (monthlyInput) monthlyInput.value = tier.price_monthly;
    if (yearlyInput) yearlyInput.value = tier.price_yearly;
    if (taglineInput) taglineInput.value = tier.tagline || '';

    if (modal) {
      modal.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function closeEditTierPriceModal() {
    const modal = document.getElementById('modal-edit-tier-price');
    if (modal) modal.classList.add('hidden');
    activeTierForPriceEdit = null;
  }

  function handleSaveTierPrice() {
    if (!activeTierForPriceEdit) return;
    const config = getMasterConfig();
    const tier = config.tiers[activeTierForPriceEdit];
    if (!tier) return;

    const monthlyVal = parseFloat(document.getElementById('tier-edit-price-monthly')?.value) || 0;
    const yearlyVal = parseFloat(document.getElementById('tier-edit-price-yearly')?.value) || 0;
    const taglineVal = document.getElementById('tier-edit-tagline')?.value.trim();

    tier.price_monthly = monthlyVal;
    tier.price_yearly = yearlyVal;
    if (taglineVal) tier.tagline = taglineVal;

    saveMasterConfig();
    closeEditTierPriceModal();
    showToast(`Tarif paket "${tier.name}" berhasil diperbarui!`, 'success');
    renderTiersAndMatrix();
    renderDashboard();
  }

  // ----------------------------------------------------------------------------
  // 9. TOAST NOTIFICATION UTILITY
  // ----------------------------------------------------------------------------
  function showToast(message, type = 'success') {
    const container = document.getElementById('superadmin-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const isSuccess = type === 'success';
    const isInfo = type === 'info';

    toast.className = `flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl text-xs font-semibold animate-scale-in pointer-events-auto transition-all duration-300 ${
      isSuccess
        ? 'bg-slate-900 text-white border-emerald-500 shadow-emerald-950/40'
        : isInfo
        ? 'bg-slate-900 text-white border-cyan-500 shadow-cyan-950/40'
        : 'bg-red-950 text-white border-red-500 shadow-red-950/40'
    }`;

    toast.innerHTML = `
      <i data-lucide="${isSuccess ? 'check-circle' : isInfo ? 'info' : 'alert-circle'}" class="w-4 h-4 ${isSuccess ? 'text-emerald-400' : isInfo ? 'text-cyan-400' : 'text-red-400'} shrink-0"></i>
      <span class="flex-1">${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Public API
  return {
    init,
    switchTab,
    showToast,
    getTenants,
    getMasterConfig,
    handleImpersonateStore
  };
})();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  SuperadminApp.init();
});

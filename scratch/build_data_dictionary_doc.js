const fs = require('fs');

const pf = fs.readFileSync('js/product-form.js', 'utf8');
const linesPf = pf.split('\n');

// Read JSON inventory
const primaryProps = JSON.parse(fs.readFileSync('scratch/inventory_primary_state.json', 'utf8'));

// Build dictionary entries
const entries = primaryProps.map((p, idx) => {
  const key = p.key;
  let type = 'String';
  let desc = '';
  let classification = 'Active';

  // Determine type and classification
  if (p.defaultValue === 'false' || p.defaultValue === 'true') {
    type = 'Boolean';
  } else if (p.defaultValue === 'null') {
    type = 'Nullable';
  } else if (p.defaultValue.startsWith('[') || p.defaultValue.startsWith('[]')) {
    type = 'Array';
  } else if (p.defaultValue.startsWith('{') || p.defaultValue.startsWith('(function')) {
    type = 'Object';
  } else if (!isNaN(Number(p.defaultValue)) && p.defaultValue !== "''" && p.defaultValue !== '""') {
    type = 'Number';
  }

  // Classifications
  if (['has_layer_2', 'has_layer_3', 'has_layer_4', 'has_layer_5'].includes(key)) {
    classification = 'Legacy / Redundant (Mirror of has_variation_*)';
    desc = `Flag layer warisan arsitektur terdahulu. Selalu disinkronkan secara redundan dengan flag has_variation_*.`;
  } else if (['scope_main', 'scope_extra_1', 'scope_extra_2', 'scope_extra_3'].includes(key)) {
    classification = 'Redundant (Duplikat variation_scopes)';
    desc = `Properti flat redundan yang menyimpan nilai cakupan variasi yang sama dengan objek variation_scopes.`;
  } else if (['has_daily_promo', 'has_monthly_discount'].includes(key)) {
    classification = 'Alias Ganda (Kompatibilitas)';
    desc = `Toggle promo harian produk. has_daily_promo digunakan di UI, sedangkan has_monthly_discount disimpan di database/POS.`;
  } else if (['auto_monthly_promo', 'include_in_monthly_promo'].includes(key)) {
    classification = 'Alias Ganda (Kompatibilitas)';
    desc = `Toggle partisipasi produk dalam promo bulanan toko. auto_monthly_promo digunakan di UI, include_in_monthly_promo adalah alias kompatibilitas.`;
  } else if (['affiliate_commission_mode', 'affiliate_commission_type'].includes(key)) {
    classification = 'Alias Ganda (Kompatibilitas)';
    desc = `Mode perhitungan komisi afiliasi ('single' atau 'tiered'). affiliate_commission_type adalah alias legacy.`;
  } else if (key === '_savedNonVariantPrice' || key === '_savedNonVariantCostPrice') {
    classification = 'UI Memory (In-Memory Only)';
    desc = `Penyimpan sementara nilai harga jual/modal saat berganti-ganti antara mode tanpa variasi dan dengan variasi.`;
  } else {
    desc = `Properti konfigurasi produk untuk kebutuhan data bisnis dan operasional.`;
  }

  // Default value string formatting
  let defValStr = p.defaultValue;
  if (defValStr.length > 50) {
    defValStr = defValStr.substring(0, 47) + '...';
  }

  return {
    no: idx + 1,
    key,
    type,
    defaultVal: defValStr,
    desc,
    classification,
    saved: p.savedInDb ? 'Tabel `products`' : 'Hanya di State / Sub-objek'
  };
});

console.log(`Generated ${entries.length} structured dictionary entries.`);
fs.writeFileSync('scratch/structured_data_dict_entries.json', JSON.stringify(entries, null, 2));


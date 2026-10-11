/**
 * POS BY SONGER CREATIVE - SEED DATABASE SCRIPT
 * Mengisi data awal Tenant Songer Creative, Branding (#33b589), Kategori & Label Order
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- [SEEDING] Inisialisasi Data Default POS Songer Creative ---');

  // 1. Buat Tenant Utama
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'songer-creative' },
    update: {},
    create: {
      slug: 'songer-creative',
      name: 'Songer Creative',
      plan: 'PAKET_B_PRO_CALCULATOR',
      status: 'ACTIVE'
    }
  });

  console.log(`[OK] Tenant terdaftar: ${tenant.name} (${tenant.id})`);

  // 2. Buat Tenant Settings (Branding & Warna #33b589)
  await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      storeName: 'Songer Creative',
      storeTagline: 'Digital Printing & Percetakan Terpadu',
      primaryColor: '#33b589',
      defaultOrderLabel: 'DnC',
      invoiceNumberMode: 'custom',
      invoiceCounter: 1,
      allowCod: true,
      printerType: 'thermal_58mm',
      printerName: 'POS-58',
      waAutoSendOnDone: true
    }
  });

  console.log('[OK] Pengaturan branding toko berhasil disimpan');

  // 3. Buat Label Order Kasir (Prefix Invoice)
  const labels = [
    { code: 'DnC', name: 'Desain & Cetak', isDefault: true, sortOrder: 1 },
    { code: 'CtK', name: 'Cetak Saja', isDefault: false, sortOrder: 2 },
    { code: 'DsN', name: 'Jasa Desain Grafis', isDefault: false, sortOrder: 3 },
    { code: 'SpL', name: 'Spanduk / Banner Kilat', isDefault: false, sortOrder: 4 }
  ];

  for (const lbl of labels) {
    await prisma.orderLabel.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: lbl.code
        }
      },
      update: {},
      create: {
        tenantId: tenant.id,
        code: lbl.code,
        name: lbl.name,
        isDefault: lbl.isDefault,
        sortOrder: lbl.sortOrder
      }
    });
  }

  console.log('[OK] Label order kasir (DnC, CtK, DsN, SpL) siap');

  // 4. Buat Kategori & Sub-Kategori Default
  const catPrinting = await prisma.category.upsert({
    where: {
      tenantId_slug: {
        tenantId: tenant.id,
        slug: 'digital-printing'
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Digital Printing',
      slug: 'digital-printing',
      icon: 'printer',
      sortOrder: 1
    }
  });

  await prisma.subCategory.upsert({
    where: {
      tenantId_categoryId_slug: {
        tenantId: tenant.id,
        categoryId: catPrinting.id,
        slug: 'spanduk-banner'
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      categoryId: catPrinting.id,
      name: 'Spanduk / Banner',
      slug: 'spanduk-banner',
      defaultCardVariant: 'A'
    }
  });

  console.log('[OK] Kategori etalase berhasil disiapkan');
  console.log('--- [SEEDING COMPLETE] Database siap digunakan! ---');
}

main()
  .catch((e) => {
    console.error('Error saat seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

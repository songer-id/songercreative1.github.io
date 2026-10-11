-- ============================================================================
-- SONGERSHOPP / SONGER CREATIVE - RELATIONAL DATABASE SCHEMA (PHASE 2 UPGRADE)
-- Dialect: PostgreSQL / Supabase
-- Target: Dynamic Categories, Multi-Card Variants, Order vs Store Categories, Reviews
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if recreating
DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS product_finishings CASCADE;
DROP TABLE IF EXISTS product_materials CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS sub_categories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- ----------------------------------------------------------------------------
-- 1. TABLE: categories (Kategori Utama Etalase - Fleksibel CRUD Admin)
-- ----------------------------------------------------------------------------
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    icon VARCHAR(100) DEFAULT 'layers',
    description TEXT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. TABLE: sub_categories (Sub-Kategori Etalase - Child of categories)
-- ----------------------------------------------------------------------------
CREATE TABLE sub_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    default_card_variant VARCHAR(5) DEFAULT 'A' CHECK (default_card_variant IN ('A', 'B', 'C')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sub_categories_category_id ON sub_categories(category_id);

-- ----------------------------------------------------------------------------
-- 3. TABLE: products (Master Produk)
-- ----------------------------------------------------------------------------
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    
    -- Kategori Order Kasir (Prefix Khusus dinamis atau 'manual' untuk invoice 00001)
    order_category VARCHAR(30) NOT NULL DEFAULT 'manual',
    
    -- Kategori Etalase Pembeli (Dinamis ke tabel categories & sub_categories)
    category_id UUID NULL REFERENCES categories(id) ON DELETE CASCADE,
    sub_category_id UUID NULL REFERENCES sub_categories(id) ON DELETE CASCADE,
    
    -- Variasi Desain Card di Grid Katalog:
    -- 'A': Tipe Cetak/Spesifikasi Kustom
    -- 'B': Tipe Jasa Kreatif / Portofolio Desain
    -- 'C': Tipe Retail / Souvenir / Barang Jadi (Shopee Style)
    card_variant VARCHAR(5) NOT NULL DEFAULT 'A' CHECK (card_variant IN ('A', 'B', 'C')),

    price_type INT NOT NULL CHECK (price_type BETWEEN 1 AND 7), 
    -- 1: Meter, 2: KombF, 3: Fixed, 4: Paket, 5: Kg, 6: Lt, 7: KombStep
    stock INT NULL CHECK (stock IS NULL OR stock >= 0),
    is_unlimited_stock BOOLEAN NOT NULL DEFAULT TRUE,
    has_monthly_discount BOOLEAN NOT NULL DEFAULT FALSE,
    discount_type VARCHAR(20) NULL CHECK (discount_type IN ('percent', 'nominal') OR discount_type IS NULL),
    discount_value DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_value >= 0),
    min_order INT NOT NULL DEFAULT 1 CHECK (min_order >= 1),
    max_order INT NULL CHECK (max_order IS NULL OR max_order >= min_order),
    image_url TEXT NULL,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Metrik Penjualan & Ulasan
    sales_count INT NOT NULL DEFAULT 0 CHECK (sales_count >= 0),
    rating_avg DECIMAL(3, 2) NOT NULL DEFAULT 5.00 CHECK (rating_avg BETWEEN 0 AND 5),
    review_count INT NOT NULL DEFAULT 0 CHECK (review_count >= 0),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_order_category ON products(order_category);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_sub_category_id ON products(sub_category_id);
CREATE INDEX idx_products_card_variant ON products(card_variant);
CREATE INDEX idx_products_price_type ON products(price_type);
CREATE INDEX idx_products_is_active ON products(is_active);

-- ----------------------------------------------------------------------------
-- 4. TABLE: product_materials (Repeater Poin C & N)
-- ----------------------------------------------------------------------------
CREATE TABLE product_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),          -- Harga Jual Bahan
    cost_price DECIMAL(12, 2) NOT NULL CHECK (cost_price >= 0), -- Harga Modal Bahan (HPP)
    step_multiplier INT NOT NULL DEFAULT 1 CHECK (step_multiplier >= 1), -- Poin N: Kelipatan (KombStep)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_materials_product_id ON product_materials(product_id);

-- ----------------------------------------------------------------------------
-- 5. TABLE: product_finishings (Repeater Poin D, E, F, G)
-- ----------------------------------------------------------------------------
CREATE TABLE product_finishings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('main', 'extra_1', 'extra_2', 'extra_3')),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
    cost_price DECIMAL(12, 2) NOT NULL CHECK (cost_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_finishings_product_id ON product_finishings(product_id);
CREATE INDEX idx_product_finishings_tier ON product_finishings(tier);

-- ----------------------------------------------------------------------------
-- 6. TABLE: product_reviews (Sistem Rating & Ulasan dengan Moderasi Seller)
-- ----------------------------------------------------------------------------
CREATE TABLE product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_name VARCHAR(150) NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    image_url TEXT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE, -- Moderasi admin: harus disetujui untuk tampil di web
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_is_approved ON product_reviews(is_approved);

-- ----------------------------------------------------------------------------
-- TRIGGER: Auto updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_sub_categories_updated_at BEFORE UPDATE ON sub_categories FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

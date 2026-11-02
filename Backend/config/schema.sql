-- Pharsyde Database Schema for MySQL
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS pharsyde_db;
USE pharsyde_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Products Table (matching POS inventory schema)
CREATE TABLE IF NOT EXISTS products (
    pk VARCHAR(50) PRIMARY KEY,
    active BOOLEAN DEFAULT TRUE,
    modified VARCHAR(50) NULL,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NULL,
    category VARCHAR(100) NULL,
    subCategory VARCHAR(100) NULL,
    subsubCategory VARCHAR(100) NULL,
    other_category VARCHAR(100) NULL,
    size VARCHAR(50) NULL,
    cost DECIMAL(10, 2) NULL,
    retail_price VARCHAR(50) NULL,
    membership_price VARCHAR(50) NULL,
    premium_membership_price VARCHAR(50) DEFAULT 'N.A.',
    inventoried BOOLEAN DEFAULT TRUE,
    taxable BOOLEAN DEFAULT FALSE,
    discountable BOOLEAN DEFAULT FALSE,
    sale_price VARCHAR(50) DEFAULT 'N.A.',
    default_units_per_case DECIMAL(10, 2) NULL,
    qty_available DECIMAL(10, 3) DEFAULT 0.000,
    equivalent_g DECIMAL(10, 2) NULL,
    thC_Range VARCHAR(100) NULL,
    cbD_Range VARCHAR(100) NULL,
    thC_LEVEL DECIMAL(6, 2) NULL,
    cbD_LEVEL DECIMAL(6, 2) NULL,
    supplier VARCHAR(150) NULL,
    sub_supplier VARCHAR(150) NULL,
    long_description TEXT NULL,
    imageUrl VARCHAR(500) NULL,
    secondImageUrl VARCHAR(500) NULL,
    web_name VARCHAR(255) NULL,
    brand VARCHAR(100) NULL,
    barcode VARCHAR(100) NULL,
    storeId INT DEFAULT 1,
    strain VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_brand (brand),
    INDEX idx_sku (sku),
    INDEX idx_barcode (barcode)
);

-- 3. TechPOS Product Images Sync Table (Lean image repository)
CREATE TABLE IF NOT EXISTS techpos_product_images (
    id VARCHAR(50) PRIMARY KEY,
    sku VARCHAR(100) NULL,
    name VARCHAR(255) NULL,
    imageUrl VARCHAR(500) NULL,
    secondImageUrl VARCHAR(500) NULL,
    raw_images_urls TEXT NULL,
    source_page INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_image_sku (sku)
);

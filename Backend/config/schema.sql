-- Pharsyde Database Schema for MySQL
-- Compatible with MySQL 5.7+ / 8.0+ and MariaDB 10.3+

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    user_type_id INT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
);

-- 2. User Types Table
CREATE TABLE IF NOT EXISTS user_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. User Type Permissions Table
CREATE TABLE IF NOT EXISTS user_type_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_type_id INT NOT NULL,
    master_name VARCHAR(100) NOT NULL,
    can_read TINYINT(1) DEFAULT 0,
    can_write TINYINT(1) DEFAULT 0,
    can_update TINYINT(1) DEFAULT 0,
    can_delete TINYINT(1) DEFAULT 0,
    can_approve TINYINT(1) DEFAULT 0,
    UNIQUE KEY uq_ut_master (user_type_id, master_name),
    FOREIGN KEY (user_type_id) REFERENCES user_types(id) ON DELETE CASCADE
);

-- 4. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    username VARCHAR(255) DEFAULT NULL,
    master_name VARCHAR(100) NOT NULL,
    change_type VARCHAR(50) NOT NULL,
    before_data LONGTEXT NULL,
    after_data LONGTEXT NULL,
    ip_address VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_master (master_name),
    INDEX idx_type (change_type),
    INDEX idx_created (created_at)
);

-- 5. Products Table (matching POS inventory schema)
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

-- 6. TechPOS Product Images Sync Table
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

-- 7. System & App Settings Table
CREATE TABLE IF NOT EXISTS app_settings (
    `key` VARCHAR(100) PRIMARY KEY,
    `value` TEXT NOT NULL,
    `label` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `category` VARCHAR(100) DEFAULT 'general',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed default settings
INSERT INTO app_settings (`key`, `value`, `label`, `description`, `category`) VALUES
('show_best_sellers', 'true', 'Show Best Sellers Section on Home Page', 'Toggle switch to show or hide the Best Sellers section on the customer storefront home page.', 'storefront'),
('show_new_arrivals', 'true', 'Show New Arrivals Section on Home Page', 'Toggle switch to show or hide the New Arrivals section on the customer storefront home page.', 'storefront'),
('new_arrivals_limit', '24', 'New Arrivals Display Limit', 'Number of latest products to display on the customer storefront New Arrivals page by default.', 'storefront'),
('best_seller_product_ids', '[]', 'Best Seller Products', 'JSON array of selected product IDs to display on the customer storefront Best Sellers page.', 'storefront'),
('gov_id_mandatory', 'false', 'Government ID Mandatory at Checkout', 'When enabled, customers must upload a valid government-approved ID before completing checkout.', 'compliance'),
('cannabis_max_grams', '30.0', 'Cannabis Purchase Limit (Grams)', 'Maximum allowed dried cannabis equivalent in grams (DFE) per customer order/transaction.', 'compliance'),
('free_delivery_threshold', '75.0', 'Free Delivery Minimum Threshold ($ CAD)', 'Minimum product subtotal required for a customer order to qualify for free courier delivery.', 'storefront'),
('mobile_latest_version', '1.0.0', 'Latest Mobile App Version', 'The active latest production version code of the mobile app (e.g. 1.0.0).', 'mobile_app'),
('mobile_min_supported_version', '1.0.0', 'Minimum Supported Mobile Version', 'Any mobile app version strictly below this will always be forced to update immediately.', 'mobile_app'),
('mobile_apk_url', 'https://pharsyde.ca/apk/app-release.apk', 'Mobile APK Download URL', 'Direct public URL to download the latest Android application package (APK).', 'mobile_app'),
('mobile_force_update', 'true', 'Force Mobile App Update', 'When enabled, users with an outdated or mismatched version cannot dismiss the update screen.', 'mobile_app'),
('mobile_release_notes', 'Performance improvements, checkout optimizations, and bug fixes.', 'Mobile Release Notes', 'Release changelog notes displayed to the user inside the update modal.', 'mobile_app'),
('reward_points_per_cad_spent', '1.0', 'Reward Points Earned per $1 CAD Spent', 'Number of reward points a customer earns for each $1 CAD spent on completed purchases (1 CAD = 1 point).', 'storefront'),
('reward_points_redemption_rate', '1000', 'Reward Points per $1 CAD Redemption', 'Number of reward points required to redeem $1.00 CAD instant discount at checkout (1,000 points = $1.00 CAD).', 'storefront'),
('reward_point_dollar_rate', '0.001', 'Reward Point Dollar Value ($ CAD per Point)', 'Cash discount value of 1 reward point in CAD ($0.001 CAD per point).', 'storefront')
ON DUPLICATE KEY UPDATE `key`=`key`;

-- 8. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    user_id INT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50) NULL,
    fulfillment_type ENUM('pickup', 'delivery') DEFAULT 'pickup',
    address TEXT NULL,
    city VARCHAR(100) DEFAULT 'Winnipeg',
    postal_code VARCHAR(30) NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    shipping DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) DEFAULT 'credit',
    payment_status VARCHAR(50) DEFAULT 'Pending',
    order_status VARCHAR(50) DEFAULT 'Pending',
    notes TEXT NULL,
    gov_id_url VARCHAR(500) NULL,
    techpos_order_id VARCHAR(100) NULL,
    techpos_external_identifier VARCHAR(100) NULL,
    sync_status VARCHAR(50) DEFAULT 'pending',
    sync_error TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_user (user_id),
    INDEX idx_order_number (order_number),
    INDEX idx_order_email (customer_email)
);

-- 9. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id VARCHAR(50) NULL,
    techpos_product_id INT NULL,
    sku VARCHAR(100) NULL,
    product_name VARCHAR(255) NOT NULL,
    variant_label VARCHAR(100) NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    line_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    image_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_item_order_id (order_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 10. Dynamic Home Sections Table
CREATE TABLE IF NOT EXISTS home_sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    heading VARCHAR(255) NOT NULL,
    sub_heading TEXT NULL,
    product_ids JSON NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active_order (active, display_order)
);

-- 11. Contact Inquiries Table
CREATE TABLE IF NOT EXISTS contact_inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL,
    subject VARCHAR(255) NOT NULL DEFAULT 'General Inquiry',
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    admin_notes TEXT NULL,
    ip_address VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ci_status (status),
    INDEX idx_ci_email (email),
    INDEX idx_ci_created (created_at)
);

-- 12. Newsletter Subscriptions Table
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    consent TINYINT(1) NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'subscribed',
    source VARCHAR(100) DEFAULT 'homepage',
    ip_address VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nl_status (status),
    INDEX idx_nl_created (created_at)
);

-- 13. Email OTPs Table
CREATE TABLE IF NOT EXISTS email_otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token VARCHAR(255) NULL,
    expires_at DATETIME NOT NULL,
    verified_at DATETIME NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_purpose (email, purpose),
    INDEX idx_token (verification_token),
    INDEX idx_expires_at (expires_at)
);

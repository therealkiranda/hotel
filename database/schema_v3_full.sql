-- ============================================================
-- GRAND LUMIÈRE HOTEL — Database Schema v3 (Full / Merged)
-- Includes: All v2 tables + v3 migration changes baked in
-- NEW: HR Module, OTA Channel Manager (Expedia/Booking.com),
--      QR Payment + Proof Upload, Channel Sync Log,
--      Media Uploads, Room Amenity Types, HR Roles,
--      Blog Images, Blog SEO Fields
-- Compatible: MySQL 8.0+ / MariaDB 10.5+
-- Author: Kiran Khadka
-- © 2026 Kiran Khadka
--
-- NOTE: CREATE DATABASE and USE statements are commented out
--       below. Create your database via CloudPanel first,
--       then import this file directly into that database.
-- ============================================================

-- CREATE DATABASE IF NOT EXISTS hotel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE hotel_db;

-- ─────────────────────────────────────────────────
-- 1. THEME SETTINGS
-- ─────────────────────────────────────────────────
CREATE TABLE theme_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    color_scheme VARCHAR(50) NOT NULL DEFAULT 'dark-green',
    primary_color VARCHAR(20) DEFAULT '#1a3c2e',
    secondary_color VARCHAR(20) DEFAULT '#c9a96e',
    accent_color VARCHAR(20) DEFAULT '#ffffff',
    background_color VARCHAR(20) DEFAULT '#f8f5f0',
    text_color VARCHAR(20) DEFAULT '#1a1a1a',
    font_heading VARCHAR(100) DEFAULT 'Cormorant Garamond',
    font_body VARCHAR(100) DEFAULT 'Jost',
    font_accent VARCHAR(100) DEFAULT 'Playfair Display',
    animation_speed ENUM('slow','normal','fast') DEFAULT 'normal',
    animations_enabled TINYINT(1) DEFAULT 1,
    hero_type ENUM('video','animated','particles','image') DEFAULT 'animated',
    hero_video_url VARCHAR(500) DEFAULT NULL,
    hero_overlay_opacity DECIMAL(3,2) DEFAULT 0.45,
    custom_css TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO theme_settings (id, color_scheme, primary_color, secondary_color, hero_type)
VALUES (1, 'dark-green', '#1a3c2e', '#c9a96e', 'animated');

-- ─────────────────────────────────────────────────
-- 2. HOTEL INFO (with QR payment fields + v3 payment/currency fields)
-- ─────────────────────────────────────────────────
CREATE TABLE hotel_info (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL DEFAULT 'Grand Lumière Hotel',
    tagline VARCHAR(300),
    description TEXT,
    address VARCHAR(500),
    city VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(50),
    phone_secondary VARCHAR(50),
    email VARCHAR(200),
    email_reservations VARCHAR(200),
    website VARCHAR(300),
    check_in_time TIME DEFAULT '14:00:00',
    check_out_time TIME DEFAULT '11:00:00',
    cancellation_policy TEXT,
    pet_policy TEXT,
    children_policy TEXT,
    smoking_policy TEXT,
    facebook_url VARCHAR(300),
    instagram_url VARCHAR(300),
    twitter_url VARCHAR(300),
    tripadvisor_url VARCHAR(300),
    google_maps_embed TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    logo_path VARCHAR(500),
    favicon_path VARCHAR(500),
    qr_payment_enabled TINYINT(1) DEFAULT 0,
    qr_code_image_path VARCHAR(500) DEFAULT NULL,
    qr_payment_instructions TEXT DEFAULT NULL,
    qr_bank_name VARCHAR(200) DEFAULT NULL,
    qr_account_name VARCHAR(200) DEFAULT NULL,
    qr_account_number VARCHAR(100) DEFAULT NULL,
    qr_payment_deadline_hours INT DEFAULT 24,
    default_currency VARCHAR(10) DEFAULT 'USD',
    currency_symbol VARCHAR(5) DEFAULT '$',
    cash_payment_enabled TINYINT(1) DEFAULT 1,
    qr_payment_title VARCHAR(200) DEFAULT 'QR / Bank Transfer',
    online_payment_enabled TINYINT(1) DEFAULT 0,
    online_payment_provider VARCHAR(50) DEFAULT NULL,
    online_payment_key VARCHAR(500) DEFAULT NULL,
    online_payment_secret VARCHAR(500) DEFAULT NULL,
    booking_system_enabled TINYINT(1) DEFAULT 1,
    maintenance_message TEXT DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO hotel_info (name, tagline, description, address, city, country, phone, email,
    check_in_time, check_out_time, qr_payment_enabled)
VALUES ('Grand Lumière Hotel','Where Luxury Meets Serenity',
    'An iconic retreat offering world-class hospitality since 1987.',
    '123 Grand Avenue, Luxury District','New York','USA',
    '+1 (555) 000-0000','reservations@grandlumiere.com',
    '14:00:00','11:00:00',0);

-- ─────────────────────────────────────────────────
-- 3. USERS (with v3 preferred_currency + preferred_language)
-- ─────────────────────────────────────────────────
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255),
    phone VARCHAR(50),
    nationality VARCHAR(100),
    preferred_currency VARCHAR(10) DEFAULT NULL,
    preferred_language VARCHAR(10) DEFAULT 'en',
    date_of_birth DATE,
    address TEXT,
    avatar_path VARCHAR(500),
    auth_provider ENUM('local','google','facebook') DEFAULT 'local',
    auth_provider_id VARCHAR(300),
    newsletter_subscribed TINYINT(1) DEFAULT 0,
    total_stays INT DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    loyalty_points INT DEFAULT 0,
    status ENUM('active','suspended','banned') DEFAULT 'active',
    remember_token VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- ─────────────────────────────────────────────────
-- 4. ADMINS (with v3 role_code field)
-- ─────────────────────────────────────────────────
CREATE TABLE admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('super_admin','admin','receptionist','manager','hr_manager') DEFAULT 'receptionist',
    role_code VARCHAR(50) DEFAULT 'receptionist',
    avatar_path VARCHAR(500),
    permissions JSON,
    last_login TIMESTAMP NULL,
    status ENUM('active','inactive') DEFAULT 'active',
    remember_token VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- password = Admin@123456
INSERT INTO admins (name, email, password, role) VALUES
('Super Admin','admin@grandlumiere.com','SETUP:Admin@123456','super_admin');

-- ─────────────────────────────────────────────────
-- 5. ROOM CATEGORIES (with OTA mapping)
-- ─────────────────────────────────────────────────
CREATE TABLE room_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    short_description VARCHAR(500),
    base_price DECIMAL(10,2) NOT NULL,
    weekend_price DECIMAL(10,2),
    peak_price DECIMAL(10,2),
    max_adults INT DEFAULT 2,
    max_children INT DEFAULT 1,
    max_occupancy INT DEFAULT 2,
    size_sqm DECIMAL(8,2),
    bed_type VARCHAR(100),
    bed_count INT DEFAULT 1,
    view_type VARCHAR(100),
    floor_range VARCHAR(100),
    amenities JSON,
    highlights JSON,
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    expedia_rate_plan_id VARCHAR(100) DEFAULT NULL,
    booking_com_room_type_id VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO room_categories (name,slug,description,short_description,base_price,max_adults,size_sqm,bed_type,amenities,highlights) VALUES
('Deluxe Room','deluxe-room','Our beautifully appointed Deluxe Rooms offer a perfect blend of comfort and elegance, featuring premium furnishings and modern amenities with stunning city views.','Elegant comfort with city views',250.00,2,42.00,'King Bed','["Free WiFi","Mini Bar","Rain Shower","Smart TV","Room Service","Safe","Air Conditioning"]','["City View","King Bed","42 sqm","Floor 5-10"]'),
('Junior Suite','junior-suite','Spacious Junior Suites with a separate living area, offering panoramic views and exclusive Club Lounge access with complimentary breakfast and evening cocktails.','Spacious suite with lounge access',420.00,2,68.00,'King Bed','["Free WiFi","Mini Bar","Jacuzzi","Smart TV","Room Service","Safe","Club Lounge","Complimentary Breakfast","Evening Cocktails"]','["Panoramic View","Club Lounge Access","68 sqm","Floor 15-20"]'),
('Executive Suite','executive-suite','The pinnacle of luxury — grand living room, private dining, butler service, and sweeping skyline views.','Ultimate luxury with butler service',750.00,3,110.00,'King Bed','["Free WiFi","Mini Bar","Jacuzzi","Smart TV","Butler Service","Private Dining","Room Service","Safe","Club Lounge","Limousine Transfer"]','["Skyline View","Butler Service","110 sqm","Floor 25-30"]'),
('Presidential Suite','presidential-suite','An extraordinary 200 sqm masterpiece — two bedrooms, grand piano, private chef, helicopter transfers.','The ultimate presidential experience',2500.00,4,200.00,'Two King Beds','["Free WiFi","Mini Bar","Private Pool","Smart TV","Private Chef","Butler Service","Helicopter Transfer","Grand Piano","Private Terrace"]','["Private Terrace","Personal Chef","200 sqm","Top Floor"]');

-- ─────────────────────────────────────────────────
-- 6. ROOMS (with OTA identifiers)
-- ─────────────────────────────────────────────────
CREATE TABLE rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    category_id INT NOT NULL,
    floor INT NOT NULL,
    wing VARCHAR(50),
    current_price DECIMAL(10,2),
    status ENUM('available','occupied','maintenance','housekeeping') DEFAULT 'available',
    housekeeping_status ENUM('clean','dirty','in_progress') DEFAULT 'clean',
    notes TEXT,
    is_active TINYINT(1) DEFAULT 1,
    expedia_room_id VARCHAR(100) DEFAULT NULL,
    booking_com_room_id VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES room_categories(id) ON DELETE RESTRICT,
    INDEX idx_status (status),
    INDEX idx_category (category_id)
);
INSERT INTO rooms (room_number,category_id,floor,wing) VALUES
('101',1,1,'North'),('102',1,1,'North'),('103',1,1,'South'),('104',1,1,'South'),
('201',1,2,'North'),('202',1,2,'South'),('203',2,2,'North'),
('501',2,5,'North'),('502',2,5,'South'),('503',2,5,'Ocean'),
('1501',2,15,'North'),('1502',3,15,'South'),
('2501',3,25,'North'),('2502',3,25,'South'),
('3001',4,30,'Penthouse');

-- ─────────────────────────────────────────────────
-- 7. ROOM IMAGES
-- ─────────────────────────────────────────────────
CREATE TABLE room_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_category_id INT NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    alt_text VARCHAR(300),
    is_primary TINYINT(1) DEFAULT 0,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (room_category_id) REFERENCES room_categories(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────
-- 8. BOOKINGS (with OTA fields + QR payment status)
-- ─────────────────────────────────────────────────
CREATE TABLE bookings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_reference VARCHAR(20) NOT NULL UNIQUE,
    user_id BIGINT,
    room_id INT NOT NULL,
    room_category_id INT NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    nights INT NOT NULL,
    adults INT NOT NULL DEFAULT 1,
    children INT DEFAULT 0,
    room_rate DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    taxes DECIMAL(12,2) DEFAULT 0.00,
    service_charge DECIMAL(12,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status ENUM('pending','confirmed','checked_in','checked_out','cancelled','no_show') DEFAULT 'pending',
    payment_status ENUM('unpaid','proof_submitted','proof_verified','partial','paid','refunded') DEFAULT 'unpaid',
    payment_method ENUM('cash','qr_transfer','card','bank_transfer','expedia','booking_com') DEFAULT 'cash',
    special_requests TEXT,
    internal_notes TEXT,
    source ENUM('direct','walk_in','phone','expedia','booking_com','airbnb') DEFAULT 'direct',
    ota_booking_id VARCHAR(200) DEFAULT NULL,
    ota_confirmation_code VARCHAR(200) DEFAULT NULL,
    ota_commission_pct DECIMAL(5,2) DEFAULT 0.00,
    ota_commission_amount DECIMAL(10,2) DEFAULT 0.00,
    ota_net_amount DECIMAL(12,2) DEFAULT NULL,
    ota_raw_payload JSON DEFAULT NULL,
    guest_first_name VARCHAR(100) NOT NULL,
    guest_last_name VARCHAR(100) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(50),
    guest_nationality VARCHAR(100),
    confirmation_sent_at TIMESTAMP NULL,
    checked_in_at TIMESTAMP NULL,
    checked_out_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT,
    FOREIGN KEY (room_category_id) REFERENCES room_categories(id) ON DELETE RESTRICT,
    INDEX idx_reference (booking_reference),
    INDEX idx_dates (check_in_date, check_out_date),
    INDEX idx_status (status),
    INDEX idx_user (user_id),
    INDEX idx_ota (ota_booking_id)
);

-- ─────────────────────────────────────────────────
-- 9. PAYMENTS (with proof upload)
-- ─────────────────────────────────────────────────
CREATE TABLE payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    method ENUM('cash','qr_transfer','card','bank_transfer','online') NOT NULL,
    status ENUM('pending','proof_submitted','verified','failed','refunded') DEFAULT 'pending',
    transaction_id VARCHAR(300),
    proof_image_path VARCHAR(500) DEFAULT NULL,
    proof_file_type VARCHAR(50) DEFAULT NULL,
    proof_uploaded_at TIMESTAMP NULL,
    proof_verified_at TIMESTAMP NULL,
    proof_verified_by INT DEFAULT NULL,
    proof_rejection_reason TEXT DEFAULT NULL,
    gateway_response JSON,
    notes TEXT,
    processed_by INT,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
    FOREIGN KEY (processed_by) REFERENCES admins(id) ON DELETE SET NULL,
    FOREIGN KEY (proof_verified_by) REFERENCES admins(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────
-- 10. OTA CHANNEL MANAGER (with v3 sync_schedule + next_sync_at)
-- ─────────────────────────────────────────────────
CREATE TABLE ota_channels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    channel ENUM('expedia','booking_com','airbnb','hotels_com') NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    is_enabled TINYINT(1) DEFAULT 0,
    hotel_id VARCHAR(200) DEFAULT NULL,
    api_key VARCHAR(500) DEFAULT NULL,
    api_secret VARCHAR(500) DEFAULT NULL,
    api_endpoint VARCHAR(500) DEFAULT NULL,
    username VARCHAR(200) DEFAULT NULL,
    password_encrypted VARCHAR(500) DEFAULT NULL,
    last_sync_at TIMESTAMP NULL,
    last_sync_status ENUM('success','failed','partial') DEFAULT NULL,
    sync_interval_minutes INT DEFAULT 15,
    sync_schedule ENUM('5min','10min','15min','30min','1hour','manual') DEFAULT '15min',
    next_sync_at TIMESTAMP NULL,
    auto_confirm_bookings TINYINT(1) DEFAULT 1,
    default_commission_pct DECIMAL(5,2) DEFAULT 15.00,
    markup_pct DECIMAL(5,2) DEFAULT 0.00,
    availability_buffer INT DEFAULT 0,
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO ota_channels (channel, display_name, is_enabled, default_commission_pct) VALUES
('expedia','Expedia',0,18.00),
('booking_com','Booking.com',0,15.00),
('airbnb','Airbnb',0,3.00),
('hotels_com','Hotels.com',0,18.00);

-- ─────────────────────────────────────────────────
-- 11. OTA SYNC LOG
-- ─────────────────────────────────────────────────
CREATE TABLE ota_sync_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    channel ENUM('expedia','booking_com','airbnb','hotels_com') NOT NULL,
    sync_type ENUM('availability_push','rate_push','booking_pull','cancellation_pull','full_sync') NOT NULL,
    status ENUM('success','failed','partial') NOT NULL,
    rooms_synced INT DEFAULT 0,
    bookings_imported INT DEFAULT 0,
    cancellations_processed INT DEFAULT 0,
    error_message TEXT DEFAULT NULL,
    request_payload JSON DEFAULT NULL,
    response_payload JSON DEFAULT NULL,
    duration_ms INT DEFAULT NULL,
    triggered_by ENUM('auto','manual','webhook') DEFAULT 'auto',
    triggered_by_admin INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (triggered_by_admin) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_channel (channel),
    INDEX idx_created (created_at)
);

-- ─────────────────────────────────────────────────
-- 12. OTA RATE OVERRIDES
-- ─────────────────────────────────────────────────
CREATE TABLE ota_rate_overrides (
    id INT PRIMARY KEY AUTO_INCREMENT,
    channel ENUM('expedia','booking_com','airbnb','hotels_com') NOT NULL,
    room_category_id INT NOT NULL,
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    override_price DECIMAL(10,2) NOT NULL,
    min_stay_nights INT DEFAULT 1,
    max_stay_nights INT DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_category_id) REFERENCES room_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────
-- 13. BLOG POSTS (with v3 SEO fields)
-- ─────────────────────────────────────────────────
CREATE TABLE blog_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    excerpt TEXT,
    content LONGTEXT NOT NULL,
    featured_image VARCHAR(500),
    featured_image_alt VARCHAR(300) DEFAULT NULL,
    og_image VARCHAR(500) DEFAULT NULL,
    schema_markup JSON DEFAULT NULL,
    reading_time_mins INT DEFAULT NULL,
    category VARCHAR(100) DEFAULT 'News',
    tags JSON,
    author_id INT,
    author_name VARCHAR(200),
    status ENUM('draft','published','archived') DEFAULT 'draft',
    featured TINYINT(1) DEFAULT 0,
    views INT DEFAULT 0,
    meta_title VARCHAR(300),
    meta_description TEXT,
    meta_keywords VARCHAR(500),
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_slug (slug)
);
INSERT INTO blog_posts (title,slug,excerpt,content,category,author_name,status,featured,published_at) VALUES
('Unveiling Our New Rooftop Terrace Experience','unveiling-rooftop-terrace','Step into the clouds with our newly renovated rooftop terrace, offering panoramic city views and a curated cocktail menu.','<p>We are thrilled to announce the grand opening of our spectacular rooftop terrace...</p>','News','Grand Lumière Team','published',1,NOW()),
('A Guide to the City''s Hidden Culinary Gems','city-culinary-gems-guide','Our concierge team has curated the most extraordinary dining experiences the city has to offer.','<p>Exploring a city through its food is one of the most rewarding travel experiences...</p>','Travel Guide','Grand Lumière Concierge','published',0,NOW()),
('Wellness at Grand Lumière: Our Spa Philosophy','wellness-spa-philosophy','Discover how our world-class spa team has crafted an immersive wellness journey.','<p>At Grand Lumière, we believe that true luxury begins with your wellbeing...</p>','Wellness','Spa Director','published',0,NOW());

-- ─────────────────────────────────────────────────
-- 14. AMENITIES
-- ─────────────────────────────────────────────────
CREATE TABLE amenities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    short_description VARCHAR(500),
    icon VARCHAR(100),
    image_path VARCHAR(500),
    category ENUM('dining','wellness','recreation','business','services') DEFAULT 'services',
    opening_hours VARCHAR(200),
    location VARCHAR(200),
    price_info VARCHAR(300),
    is_featured TINYINT(1) DEFAULT 0,
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    meta_title VARCHAR(300),
    meta_description TEXT
);
INSERT INTO amenities (name,slug,description,short_description,icon,category,opening_hours,is_featured,sort_order) VALUES
('Le Jardin Restaurant','le-jardin-restaurant','Award-winning fine dining with seasonal menu by our Executive Chef.','Fine dining with seasonal menus','UtensilsCrossed','dining','7:00 AM - 11:00 PM',1,1),
('Lumière Spa & Wellness','lumiere-spa','A 2,000 sqm sanctuary offering signature treatments and thermal pools.','Luxury spa & thermal pools','Sparkles','wellness','9:00 AM - 9:00 PM',1,2),
('Infinity Pool & Terrace','infinity-pool','Rooftop infinity pool with panoramic views, cabana service, and poolside dining.','Rooftop infinity pool & cabanas','Waves','recreation','7:00 AM - 10:00 PM',1,3),
('Sky Lounge Bar','sky-lounge','28th floor cocktail bar with breathtaking skyline views and live jazz nightly.','Cocktails & jazz on the 28th floor','GlassWater','dining','4:00 PM - 2:00 AM',1,4),
('Grand Ballroom','grand-ballroom','Magnificent event space for up to 800 guests with state-of-the-art AV.','Premier event venue for 800+ guests','Star','business','By reservation',0,5),
('Fitness Center','fitness-center','24-hour fitness center with personal trainers and Technogym equipment.','24-hour state-of-the-art gym','Dumbbell','recreation','24 hours',0,6);

-- ─────────────────────────────────────────────────
-- 15. SEO SETTINGS
-- ─────────────────────────────────────────────────
CREATE TABLE seo_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    page_identifier VARCHAR(200) NOT NULL UNIQUE,
    meta_title VARCHAR(300),
    meta_description TEXT,
    meta_keywords VARCHAR(500),
    og_title VARCHAR(300),
    og_description TEXT,
    og_image VARCHAR(500),
    canonical_url VARCHAR(500),
    robots VARCHAR(100) DEFAULT 'index,follow',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO seo_settings (page_identifier, meta_title, meta_description) VALUES
('home','Grand Lumière Hotel | Luxury Stays','Experience unparalleled luxury at Grand Lumière Hotel.'),
('rooms','Luxury Rooms & Suites | Grand Lumière Hotel','Discover our curated collection of deluxe rooms and exclusive suites.'),
('booking','Book Your Stay | Grand Lumière Hotel','Reserve your room at Grand Lumière Hotel. Best rate guaranteed.'),
('amenities','Hotel Amenities & Services | Grand Lumière Hotel','Explore world-class amenities at Grand Lumière.'),
('blog','Hotel News & Travel Guides | Grand Lumière Hotel','Explore travel guides, hotel news, and curated local experiences.');

-- ─────────────────────────────────────────────────
-- 16. SOCIAL AUTH
-- ─────────────────────────────────────────────────
CREATE TABLE social_auth_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    provider ENUM('google','facebook','apple') NOT NULL UNIQUE,
    is_enabled TINYINT(1) DEFAULT 0,
    client_id VARCHAR(500),
    client_secret VARCHAR(500),
    redirect_uri VARCHAR(500),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO social_auth_settings (provider, is_enabled) VALUES ('google',0),('facebook',0),('apple',0);

-- ─────────────────────────────────────────────────
-- 17. REVIEWS
-- ─────────────────────────────────────────────────
CREATE TABLE reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT,
    user_id BIGINT,
    guest_name VARCHAR(200),
    guest_country VARCHAR(100),
    rating_overall DECIMAL(3,1) NOT NULL,
    rating_cleanliness DECIMAL(3,1),
    rating_service DECIMAL(3,1),
    rating_location DECIMAL(3,1),
    rating_value DECIMAL(3,1),
    title VARCHAR(300),
    comment TEXT,
    admin_response TEXT,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    is_featured TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
INSERT INTO reviews (guest_name,guest_country,rating_overall,rating_cleanliness,rating_service,rating_location,title,comment,status,is_featured) VALUES
('Alexandra M.','United Kingdom',9.8,10.0,9.5,9.8,'Absolutely breathtaking experience','From the moment we arrived, every detail was perfect. The Executive Suite was beyond our expectations.','approved',1),
('James & Sarah T.','Australia',9.5,9.5,10.0,9.0,'Service that sets the gold standard','The concierge arranged private rooftop dining for our anniversary. Truly magical.','approved',1),
('Hiroshi K.','Japan',9.7,10.0,9.5,9.5,'Impeccable in every way','Having stayed at many luxury hotels worldwide, Grand Lumière stands apart.','approved',1);

-- ─────────────────────────────────────────────────
-- 18. PROMO CODES
-- ─────────────────────────────────────────────────
CREATE TABLE promo_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(300),
    discount_type ENUM('percentage','fixed') DEFAULT 'percentage',
    discount_value DECIMAL(10,2) NOT NULL,
    min_stay_nights INT DEFAULT 1,
    min_booking_amount DECIMAL(10,2) DEFAULT 0,
    max_uses INT,
    current_uses INT DEFAULT 0,
    valid_from DATE,
    valid_until DATE,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO promo_codes (code,description,discount_type,discount_value,valid_until) VALUES
('WELCOME15','15% off for new guests','percentage',15.00,DATE_ADD(CURDATE(),INTERVAL 1 YEAR)),
('SUMMER2026','Summer special - $50 off per night','fixed',50.00,'2026-08-31');

-- ─────────────────────────────────────────────────
-- 19. NOTIFICATIONS
-- ─────────────────────────────────────────────────
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    type VARCHAR(100) NOT NULL,
    notifiable_type VARCHAR(100),
    notifiable_id BIGINT,
    title VARCHAR(300),
    message TEXT,
    data JSON,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifiable (notifiable_type, notifiable_id)
);

-- ─────────────────────────────────────────────────
-- 20. AVAILABILITY BLOCKS
-- ─────────────────────────────────────────────────
CREATE TABLE availability_blocks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason ENUM('maintenance','renovation','reserved','event','ota_hold','other') DEFAULT 'other',
    notes TEXT,
    channel ENUM('direct','expedia','booking_com','airbnb') DEFAULT 'direct',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────
-- 21. ANALYTICS EVENTS
-- ─────────────────────────────────────────────────
CREATE TABLE analytics_events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    event_type VARCHAR(100),
    page VARCHAR(200),
    user_id BIGINT,
    session_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer VARCHAR(500),
    data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type),
    INDEX idx_created (created_at)
);

-- ─────────────────────────────────────────────────
-- 22. API TOKENS
-- ─────────────────────────────────────────────────
CREATE TABLE api_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    token_hash VARCHAR(500) NOT NULL,
    abilities JSON,
    last_used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    tokenable_type VARCHAR(100),
    tokenable_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token_hash(100))
);

-- ═══════════════════════════════════════════════════
-- HR MODULE
-- ═══════════════════════════════════════════════════

-- ─────────────────────────────────────────────────
-- 23. DEPARTMENTS
-- ─────────────────────────────────────────────────
CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    manager_employee_id INT DEFAULT NULL,
    parent_department_id INT DEFAULT NULL,
    budget DECIMAL(12,2) DEFAULT NULL,
    location VARCHAR(200),
    headcount INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_department_id) REFERENCES departments(id) ON DELETE SET NULL
);
INSERT INTO departments (name, code, description, location) VALUES
('Front Office','FO','Reception, concierge, and guest services','Lobby Level'),
('Housekeeping','HK','Room cleaning, laundry, and public areas','Basement B1'),
('Food & Beverage','FB','Restaurant, bar, room service, and banquets','Ground Floor'),
('Maintenance','MT','Engineering, repairs, and facilities','Basement B2'),
('Sales & Marketing','SM','Revenue management, OTA, and promotions','Floor 2'),
('Human Resources','HR','Recruitment, payroll, training, and compliance','Floor 2'),
('Finance','FIN','Accounting, billing, and financial reporting','Floor 3'),
('Security','SEC','Hotel security and safety','Lobby Level'),
('Spa & Wellness','SPA','Spa treatments and fitness center','Floor 4'),
('Information Technology','IT','Technology infrastructure and support','Floor 2');

-- ─────────────────────────────────────────────────
-- 24. EMPLOYEES
-- ─────────────────────────────────────────────────
CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    date_of_birth DATE,
    gender ENUM('male','female','other','prefer_not_to_say'),
    nationality VARCHAR(100),
    national_id VARCHAR(100),
    passport_number VARCHAR(100),
    address TEXT,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relation VARCHAR(100),
    avatar_path VARCHAR(500),
    department_id INT,
    job_title VARCHAR(200) NOT NULL,
    job_level ENUM('intern','junior','mid','senior','lead','manager','director','executive') DEFAULT 'junior',
    employment_type ENUM('full_time','part_time','contract','temporary','intern') DEFAULT 'full_time',
    employment_status ENUM('active','on_leave','suspended','terminated','resigned') DEFAULT 'active',
    hire_date DATE NOT NULL,
    probation_end_date DATE,
    termination_date DATE,
    termination_reason TEXT,
    base_salary DECIMAL(12,2),
    salary_currency VARCHAR(10) DEFAULT 'USD',
    pay_frequency ENUM('weekly','biweekly','monthly') DEFAULT 'monthly',
    bank_name VARCHAR(200),
    bank_account_number VARCHAR(100),
    bank_routing_number VARCHAR(100),
    tax_id VARCHAR(100),
    admin_id INT DEFAULT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_dept (department_id),
    INDEX idx_status (employment_status),
    INDEX idx_employee_id (employee_id)
);

-- ─────────────────────────────────────────────────
-- 25. EMPLOYEE DOCUMENTS
-- ─────────────────────────────────────────────────
CREATE TABLE employee_documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    document_type ENUM('contract','id_copy','passport','certificate','nda','performance_review','other') NOT NULL,
    title VARCHAR(300) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    expiry_date DATE,
    notes TEXT,
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES admins(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────
-- 26. ATTENDANCE
-- ─────────────────────────────────────────────────
CREATE TABLE attendance (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    break_minutes INT DEFAULT 0,
    worked_hours DECIMAL(5,2) DEFAULT 0,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    status ENUM('present','absent','half_day','late','on_leave','holiday','remote') DEFAULT 'present',
    check_in_method ENUM('manual','biometric','app','card') DEFAULT 'manual',
    notes TEXT,
    approved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES admins(id) ON DELETE SET NULL,
    UNIQUE KEY uniq_emp_date (employee_id, date),
    INDEX idx_date (date),
    INDEX idx_employee (employee_id)
);

-- ─────────────────────────────────────────────────
-- 27. LEAVE TYPES
-- ─────────────────────────────────────────────────
CREATE TABLE leave_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    days_allowed_per_year INT DEFAULT 0,
    is_paid TINYINT(1) DEFAULT 1,
    carry_forward TINYINT(1) DEFAULT 0,
    max_carry_forward_days INT DEFAULT 0,
    requires_document TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1
);
INSERT INTO leave_types (name,code,days_allowed_per_year,is_paid,carry_forward,max_carry_forward_days) VALUES
('Annual Leave','AL',21,1,1,10),
('Sick Leave','SL',10,1,0,0),
('Maternity Leave','ML',90,1,0,0),
('Paternity Leave','PL',14,1,0,0),
('Unpaid Leave','UL',30,0,0,0),
('Emergency Leave','EL',3,1,0,0),
('Public Holiday','PH',0,1,0,0),
('Compensatory Off','CO',0,1,0,5);

-- ─────────────────────────────────────────────────
-- 28. LEAVE REQUESTS
-- ─────────────────────────────────────────────────
CREATE TABLE leave_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested DECIMAL(4,1) NOT NULL,
    reason TEXT,
    document_path VARCHAR(500),
    status ENUM('pending','approved','rejected','cancelled') DEFAULT 'pending',
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    FOREIGN KEY (reviewed_by) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_employee (employee_id),
    INDEX idx_status (status)
);

-- ─────────────────────────────────────────────────
-- 29. LEAVE BALANCES
-- ─────────────────────────────────────────────────
CREATE TABLE leave_balances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    year YEAR NOT NULL,
    allocated_days DECIMAL(5,1) DEFAULT 0,
    used_days DECIMAL(5,1) DEFAULT 0,
    carried_forward DECIMAL(5,1) DEFAULT 0,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    UNIQUE KEY uniq_emp_leave_year (employee_id, leave_type_id, year)
);

-- ─────────────────────────────────────────────────
-- 30. PAYROLL
-- ─────────────────────────────────────────────────
CREATE TABLE payroll (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    pay_date DATE,
    basic_salary DECIMAL(12,2) NOT NULL,
    overtime_pay DECIMAL(10,2) DEFAULT 0,
    bonus DECIMAL(10,2) DEFAULT 0,
    allowances DECIMAL(10,2) DEFAULT 0,
    allowance_details JSON,
    gross_salary DECIMAL(12,2) NOT NULL,
    tax_deduction DECIMAL(10,2) DEFAULT 0,
    insurance_deduction DECIMAL(10,2) DEFAULT 0,
    other_deductions DECIMAL(10,2) DEFAULT 0,
    deduction_details JSON,
    net_salary DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status ENUM('draft','approved','paid','cancelled') DEFAULT 'draft',
    payment_method ENUM('bank_transfer','cash','cheque') DEFAULT 'bank_transfer',
    transaction_reference VARCHAR(200),
    notes TEXT,
    approved_by INT,
    approved_at TIMESTAMP NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES admins(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_employee (employee_id),
    INDEX idx_period (pay_period_start, pay_period_end),
    INDEX idx_status (status)
);

-- ─────────────────────────────────────────────────
-- 31. PERFORMANCE REVIEWS
-- ─────────────────────────────────────────────────
CREATE TABLE performance_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    review_type ENUM('probation','quarterly','annual','pip') DEFAULT 'annual',
    overall_rating DECIMAL(3,1),
    rating_scale VARCHAR(50) DEFAULT '1-5',
    attendance_rating DECIMAL(3,1),
    performance_rating DECIMAL(3,1),
    teamwork_rating DECIMAL(3,1),
    initiative_rating DECIMAL(3,1),
    strengths TEXT,
    areas_for_improvement TEXT,
    goals_next_period TEXT,
    reviewer_comments TEXT,
    employee_comments TEXT,
    status ENUM('draft','submitted','acknowledged','completed') DEFAULT 'draft',
    reviewer_id INT,
    reviewed_at TIMESTAMP NULL,
    acknowledged_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES admins(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────
-- 32. TRAINING RECORDS
-- ─────────────────────────────────────────────────
CREATE TABLE training_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    training_name VARCHAR(300) NOT NULL,
    training_type ENUM('onboarding','safety','skill','compliance','leadership','other') DEFAULT 'skill',
    provider VARCHAR(200),
    start_date DATE,
    end_date DATE,
    duration_hours DECIMAL(6,2),
    cost DECIMAL(10,2),
    status ENUM('scheduled','in_progress','completed','cancelled') DEFAULT 'scheduled',
    certificate_path VARCHAR(500),
    score DECIMAL(5,2),
    pass_mark DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────
-- 33. HR ANNOUNCEMENTS
-- ─────────────────────────────────────────────────
CREATE TABLE hr_announcements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    category ENUM('policy','event','training','general','urgent') DEFAULT 'general',
    target_departments JSON,
    target_employment_types JSON,
    attachment_path VARCHAR(500),
    is_pinned TINYINT(1) DEFAULT 0,
    published_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL
);

-- ═══════════════════════════════════════════════════
-- v3 NEW TABLES
-- ═══════════════════════════════════════════════════

-- ─────────────────────────────────────────────────
-- 34. MEDIA UPLOADS
-- ─────────────────────────────────────────────────
CREATE TABLE media_uploads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    file_name VARCHAR(300) NOT NULL,
    original_name VARCHAR(300),
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    mime_type VARCHAR(100),
    category ENUM('hero_video','hero_image','qr_code','room_image','blog_image','logo','general') DEFAULT 'general',
    is_active TINYINT(1) DEFAULT 1,
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_category (category)
);

-- ─────────────────────────────────────────────────
-- 35. ROOM AMENITY TYPES
-- ─────────────────────────────────────────────────
CREATE TABLE room_amenity_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    category ENUM('bedroom','bathroom','technology','comfort','kitchen','services','outdoor') DEFAULT 'bedroom',
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1
);
INSERT INTO room_amenity_types (name, icon, category, sort_order) VALUES
('King Bed','🛏','bedroom',1),('Queen Bed','🛏','bedroom',2),('Twin Beds','🛏','bedroom',3),
('Extra Bed Available','🛏','bedroom',4),('Wardrobe','👔','bedroom',5),('Safe','🔒','bedroom',6),
('Blackout Curtains','🌙','bedroom',7),('Iron & Board','👔','bedroom',8),
('Attached Bathroom','🚿','bathroom',10),('Bathtub','🛁','bathroom',11),('Rain Shower','🚿','bathroom',12),
('Hot Water / Geyser','♨️','bathroom',13),('Hair Dryer','💨','bathroom',14),
('Toiletries','🧴','bathroom',15),('Towels & Robes','🧖','bathroom',16),('Bidet','🚽','bathroom',17),
('Smart TV','📺','technology',20),('Cable / Satellite TV','📡','technology',21),
('Free WiFi','📶','technology',22),('High-Speed Internet','🌐','technology',23),
('Telephone','☎️','technology',24),('Bluetooth Speaker','🔊','technology',25),
('USB Charging Ports','🔌','technology',26),('Universal Power Outlets','🔌','technology',27),
('Air Conditioning','❄️','comfort',30),('Ceiling Fan','🌀','comfort',31),
('Heating','🔥','comfort',32),('Soundproofing','🔇','comfort',33),
('Sofa / Sitting Area','🛋️','comfort',34),('Work Desk','💼','comfort',35),
('Balcony / Terrace','🌅','comfort',36),('City View','🌆','comfort',37),
('Mountain View','⛰️','comfort',38),('Ocean / Sea View','🌊','comfort',39),
('Mini Bar','🍸','kitchen',40),('Refrigerator','🧊','kitchen',41),
('Electric Kettle','☕','kitchen',42),('Coffee Machine','☕','kitchen',43),
('Microwave','📦','kitchen',44),('Kitchenette','🍳','kitchen',45),
('Room Service (24hr)','🍽️','services',50),('Daily Housekeeping','🧹','services',51),
('Laundry Service','🧺','services',52),('Butler Service','🤵','services',53),
('Concierge','🗝️','services',54),('Airport Transfer','🚗','services',55),
('Baby Cot Available','👶','services',56),('Pet Friendly','🐾','services',57),
('Private Pool','🏊','outdoor',60),('Jacuzzi','🛁','outdoor',61),
('Garden Access','🌿','outdoor',62),('Beach Access','🏖️','outdoor',63);

-- ─────────────────────────────────────────────────
-- 36. ROOM CATEGORY AMENITIES (junction)
-- ─────────────────────────────────────────────────
CREATE TABLE room_category_amenities (
    room_category_id INT NOT NULL,
    amenity_type_id INT NOT NULL,
    PRIMARY KEY (room_category_id, amenity_type_id),
    FOREIGN KEY (room_category_id) REFERENCES room_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (amenity_type_id) REFERENCES room_amenity_types(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────
-- 37. HR ROLES
-- ─────────────────────────────────────────────────
CREATE TABLE hr_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSON,
    is_active TINYINT(1) DEFAULT 1
);
INSERT INTO hr_roles (name, code, description, permissions) VALUES
('Super Admin','super_admin','Full system access','{"all":true}'),
('Hotel Manager','manager','Manage bookings, rooms, staff','{"bookings":true,"rooms":true,"customers":true,"reports":true,"staff_view":true}'),
('Receptionist','receptionist','Handle check-in/out and bookings','{"bookings":true,"rooms":{"status_only":true},"customers":{"view":true}}'),
('HR Manager','hr_manager','Manage all HR operations','{"hr":true,"employees":true,"payroll":true,"leave":true,"attendance":true,"reports":true}'),
('Finance Manager','finance_manager','Manage payments and financial reports','{"payments":true,"payroll":{"view":true,"approve":true},"reports":true}'),
('Housekeeping Manager','housekeeping_manager','Manage room housekeeping','{"rooms":{"status_only":true,"housekeeping":true}}'),
('Marketing Manager','marketing_manager','Manage blog, amenities, OTA','{"blog":true,"amenities":true,"ota":true,"seo":true,"theme":true}');

-- ─────────────────────────────────────────────────
-- 38. BLOG IMAGES
-- ─────────────────────────────────────────────────
CREATE TABLE blog_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT,
    file_path VARCHAR(500) NOT NULL,
    alt_text VARCHAR(300),
    caption TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE SET NULL
);

-- ═══════════════════════════════════════════════════
-- ANALYTICS VIEWS
-- ═══════════════════════════════════════════════════
CREATE VIEW booking_analytics AS
SELECT
    DATE_FORMAT(check_in_date, '%Y-%m') AS month,
    COUNT(*) AS total_bookings,
    SUM(CASE WHEN status IN ('confirmed','checked_in','checked_out') THEN 1 ELSE 0 END) AS confirmed_bookings,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_bookings,
    SUM(CASE WHEN source = 'direct' THEN total_amount ELSE 0 END) AS direct_revenue,
    SUM(CASE WHEN source = 'expedia' THEN total_amount ELSE 0 END) AS expedia_revenue,
    SUM(CASE WHEN source = 'booking_com' THEN total_amount ELSE 0 END) AS booking_com_revenue,
    SUM(total_amount) AS total_revenue,
    AVG(nights) AS avg_stay_nights,
    AVG(total_amount) AS avg_booking_value
FROM bookings
GROUP BY DATE_FORMAT(check_in_date, '%Y-%m');

CREATE VIEW room_occupancy AS
SELECT
    r.id, r.room_number, rc.name AS category, rc.base_price,
    COUNT(b.id) AS total_bookings,
    SUM(b.nights) AS total_nights_booked,
    SUM(b.total_amount) AS total_revenue
FROM rooms r
JOIN room_categories rc ON r.category_id = rc.id
LEFT JOIN bookings b ON b.room_id = r.id AND b.status NOT IN ('cancelled','no_show')
GROUP BY r.id, r.room_number, rc.name, rc.base_price;

CREATE VIEW hr_summary AS
SELECT
    (SELECT COUNT(*) FROM employees WHERE employment_status = 'active') AS total_active,
    (SELECT COUNT(*) FROM employees WHERE employment_status = 'on_leave') AS on_leave,
    (SELECT COUNT(*) FROM leave_requests WHERE status = 'pending') AS pending_leave,
    (SELECT COUNT(*) FROM employees WHERE hire_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) AS new_hires_30d,
    (SELECT COUNT(*) FROM payroll WHERE status = 'draft') AS payroll_pending,
    (SELECT COUNT(*) FROM performance_reviews WHERE status IN ('draft','submitted')) AS reviews_pending;

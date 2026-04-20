-- ============================================================
-- Migration v4: custom_pages table for Page Builder & PMS
-- Run this SQL in your hotel database before deploying
-- Author: Kiran Khadka — © 2026 Kiran Khadka
-- ============================================================

CREATE TABLE IF NOT EXISTS custom_pages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(300) NOT NULL UNIQUE,
    content LONGTEXT,
    meta_title VARCHAR(300),
    meta_description TEXT,
    meta_keywords VARCHAR(500),
    og_title VARCHAR(300),
    og_description TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_active (is_active)
);

-- Default pages
INSERT IGNORE INTO custom_pages (title, slug, content, meta_title, meta_description, is_active) VALUES
('Check-in & Check-out Policy', 'check-in-policy',
 '<h2>Check-in &amp; Check-out Policy</h2><p>Standard check-in time is <strong>2:00 PM</strong>. Standard check-out time is <strong>11:00 AM</strong>.</p><p>Early check-in and late check-out are subject to availability and may incur additional charges. Please contact reception to arrange.</p>',
 'Check-in & Check-out Policy | Grand Lumière Hotel', 'Hotel check-in time is 2PM and check-out is 11AM. Learn about our policies.', 1),
('Privacy Policy', 'privacy-policy',
 '<h2>Privacy Policy</h2><p>We are committed to protecting your personal information and your right to privacy.</p><h3>Information We Collect</h3><p>We collect information you provide when making a reservation, including your name, email, phone number, and payment details.</p><h3>How We Use Your Information</h3><p>Your information is used solely to process your reservation and improve your stay experience. We do not sell your data to third parties.</p>',
 'Privacy Policy | Grand Lumière Hotel', 'How Grand Lumière Hotel handles and protects your personal data.', 1),
('Terms & Conditions', 'terms-and-conditions',
 '<h2>Terms &amp; Conditions</h2><p>By making a reservation at Grand Lumière Hotel, you agree to the following terms and conditions.</p><h3>Reservations</h3><p>All bookings are subject to availability. A confirmed booking reference will be sent to your email.</p><h3>Cancellation Policy</h3><p>Cancellations made more than 48 hours before check-in are fully refunded. Cancellations within 48 hours may incur a one-night charge.</p>',
 'Terms & Conditions | Grand Lumière Hotel', 'Terms and conditions for booking and staying at Grand Lumière Hotel.', 1);


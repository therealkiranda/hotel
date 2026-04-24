-- ============================================================
-- Migration v5 — PMS: Consumption Charges & Guest IDs
-- Author: Kiran Khadka — © 2026 Kiran Khadka
-- Run this ONCE on your existing hotel_db
-- ============================================================

-- Add amount_paid column to bookings if not exists
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(12,2) DEFAULT 0.00 AFTER total_amount;

-- Guest ID documents (passport, national ID, driving license, etc.)
CREATE TABLE IF NOT EXISTS booking_guest_ids (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  booking_id  INT NOT NULL,
  id_type     VARCHAR(50) NOT NULL COMMENT 'passport|national_id|driving_license|other',
  id_number   VARCHAR(100) NOT NULL,
  address     TEXT,
  dob         DATE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_booking (booking_id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Consumption / extra charges per booking (restaurant, bar, spa, room service, amenity, etc.)
CREATE TABLE IF NOT EXISTS booking_charges (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  booking_id  INT NOT NULL,
  category    ENUM('restaurant','bar','spa','room_service','amenity','laundry','transport','minibar','other') NOT NULL,
  description VARCHAR(255) NOT NULL,
  quantity    DECIMAL(8,2) NOT NULL DEFAULT 1,
  unit_price  DECIMAL(10,2) NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  notes       TEXT,
  added_by    INT COMMENT 'admin id',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_booking (booking_id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Add processed_by and notes to payments if not exists
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS processed_by INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

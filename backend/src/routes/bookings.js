// ============================================================
// src/routes/bookings.js — Bookings API
// ============================================================
const express = require('express');
const { verifyUser, verifyAdmin, optionalAuth } = require('../middleware/auth');
const router = express.Router();

function generateRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'GL';
  for (let i = 0; i < 8; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

// POST /api/bookings/check-availability
router.post('/check-availability', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { room_category_id, check_in_date, check_out_date, adults = 1, children = 0 } = req.body;
    if (!room_category_id || !check_in_date || !check_out_date)
      return res.status(400).json({ error: 'room_category_id, check_in_date, check_out_date required' });

    const checkIn = new Date(check_in_date); const checkOut = new Date(check_out_date);
    if (checkIn >= checkOut) return res.status(400).json({ error: 'check_out must be after check_in' });
    if (checkIn < new Date()) return res.status(400).json({ error: 'check_in cannot be in the past' });

    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    // Find an available room
    const [rooms] = await db.query(`
      SELECT r.id, r.room_number, rc.base_price, rc.weekend_price, rc.name AS category_name
      FROM rooms r
      JOIN room_categories rc ON r.category_id = rc.id
      WHERE r.category_id = ? AND r.is_active = 1 AND r.status = 'available'
        AND rc.max_adults >= ?
        AND r.id NOT IN (
          SELECT room_id FROM bookings
          WHERE status NOT IN ('cancelled','no_show')
            AND check_in_date < ? AND check_out_date > ?
        )
      LIMIT 1`,
      [room_category_id, parseInt(adults), check_out_date, check_in_date]
    );

    if (rooms.length === 0) return res.json({ available: false, message: 'No rooms available for selected dates' });

    const room = rooms[0];
    const subtotal = room.base_price * nights;
    const taxes = subtotal * 0.15;
    const total = subtotal + taxes;

    res.json({
      available: true,
      room_id: room.id,
      room_number: room.room_number,
      nights,
      room_rate: room.base_price,
      subtotal: subtotal.toFixed(2),
      taxes: taxes.toFixed(2),
      total: total.toFixed(2),
    });
  } catch (err) { next(err); }
});

// POST /api/bookings — Create booking
router.post('/', optionalAuth, async (req, res, next) => {
  const db = req.app.locals.db;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      room_id, room_category_id, check_in_date, check_out_date,
      adults, children, room_rate, special_requests, promo_code,
      guest_first_name, guest_last_name, guest_email, guest_phone, guest_nationality,
      payment_method
    } = req.body;

    // Double-check availability with lock
    const [conflict] = await conn.query(`
      SELECT id FROM bookings
      WHERE room_id = ? AND status NOT IN ('cancelled','no_show')
        AND check_in_date < ? AND check_out_date > ?
      FOR UPDATE`, [room_id, check_out_date, check_in_date]);

    if (conflict.length > 0) {
      await conn.rollback();
      return res.status(409).json({ error: 'Room is no longer available for selected dates' });
    }

    const nights = Math.ceil((new Date(check_out_date) - new Date(check_in_date)) / 86400000);
    const subtotal = parseFloat(room_rate) * nights;
    let discount = 0;

    // Validate promo code
    if (promo_code) {
      const [promos] = await conn.query(
        `SELECT * FROM promo_codes WHERE code = ? AND is_active = 1
         AND (valid_from IS NULL OR valid_from <= CURDATE())
         AND (valid_until IS NULL OR valid_until >= CURDATE())
         AND (max_uses IS NULL OR current_uses < max_uses)`, [promo_code]
      );
      if (promos.length > 0) {
        const promo = promos[0];
        if (promo.discount_type === 'percentage') discount = subtotal * (promo.discount_value / 100);
        else discount = Math.min(promo.discount_value, subtotal);
        await conn.query('UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = ?', [promo.id]);
      }
    }

    const taxes = (subtotal - discount) * 0.15;
    const service_charge = (subtotal - discount) * 0.05;
    const total_amount = subtotal - discount + taxes + service_charge;

    let ref; let tries = 0;
    do { ref = generateRef(); tries++; } while (tries < 5);

    // Normalize payment_method to DB ENUM: 'cash','qr_transfer','card','bank_transfer','expedia','booking_com'
    const PM_MAP = { 'qr_code': 'qr_transfer', 'qr-transfer': 'qr_transfer', 'credit_card': 'card', 'online': 'card' };
    const rawPM = (payment_method || 'cash').toLowerCase();
    const safePaymentMethod = PM_MAP[rawPM] || (['cash','qr_transfer','card','bank_transfer','expedia','booking_com'].includes(rawPM) ? rawPM : 'cash');

    const [result] = await conn.query(`
      INSERT INTO bookings (
        booking_reference, user_id, room_id, room_category_id,
        check_in_date, check_out_date, nights, adults, children,
        room_rate, subtotal, taxes, service_charge, discount_amount, total_amount,
        payment_method, special_requests, source,
        guest_first_name, guest_last_name, guest_email, guest_phone, guest_nationality
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [ref, req.user?.id || null, room_id, room_category_id,
       check_in_date, check_out_date, nights, adults || 1, children || 0,
       room_rate, subtotal.toFixed(2), taxes.toFixed(2), service_charge.toFixed(2),
       discount.toFixed(2), total_amount.toFixed(2),
       safePaymentMethod, special_requests || null, 'direct',
       guest_first_name, guest_last_name, guest_email, guest_phone || null, guest_nationality || null]
    );

    await conn.commit();

    // Update user stats if logged in
    if (req.user?.id) {
      await db.query(`UPDATE users SET total_stays = total_stays + 1,
        total_spent = total_spent + ?, loyalty_points = loyalty_points + ?
        WHERE id = ?`, [total_amount.toFixed(2), Math.floor(total_amount / 10), req.user.id]);
    }

    // Auto-create guest account if not logged in
    let guestAccountCreated = false;
    let tempPassword = null;
    if (!req.user?.id && guest_email) {
      try {
        const bcrypt = require('bcryptjs');
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [guest_email]);
        if (existing.length === 0) {
          tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
          const hashed = await bcrypt.hash(tempPassword, 12);
          await db.query(
            `INSERT INTO users (first_name, last_name, email, password, phone, nationality, email_verified_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [guest_first_name, guest_last_name, guest_email, hashed, guest_phone||null, guest_nationality||null]
          );
          guestAccountCreated = true;
        }
      } catch {} // non-critical — booking succeeds regardless
    }

    res.status(201).json({
      booking_id: result.insertId,
      booking_reference: ref,
      total_amount: total_amount.toFixed(2),
      status: 'pending',
      message: 'Booking created successfully. We will confirm shortly.',
      guest_account_created: guestAccountCreated,
      temp_password: tempPassword,
    });
  } catch (err) { await conn.rollback(); next(err); }
  finally { conn.release(); }
});

// GET /api/bookings/my — Current user's bookings
router.get('/my', verifyUser, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(`
      SELECT b.*, rc.name AS room_name, r.room_number
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN room_categories rc ON b.room_category_id = rc.id
      WHERE b.user_id = ? ORDER BY b.created_at DESC`, [req.user.id]);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/bookings/:ref — Get booking by reference
router.get('/:ref', optionalAuth, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(`
      SELECT b.*, rc.name AS room_name, rc.description AS room_description, r.room_number, r.floor
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN room_categories rc ON b.room_category_id = rc.id
      WHERE b.booking_reference = ?`, [req.params.ref]);

    if (rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    const booking = rows[0];

    // If not admin, only owner can view
    if (req.user && booking.user_id !== req.user.id && !req.user.isAdmin)
      return res.status(403).json({ error: 'Access denied' });

    res.json(booking);
  } catch (err) { next(err); }
});

// ADMIN: GET /api/bookings — all bookings
router.get('/', verifyAdmin, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { status, page = 1, per_page = 20, search, date_from, date_to } = req.query;
    const limit = Math.min(parseInt(per_page), 100);
    const offset = (parseInt(page) - 1) * limit;
    const conditions = []; const params = [];

    if (status) { conditions.push('b.status = ?'); params.push(status); }
    if (search) { conditions.push('(b.booking_reference LIKE ? OR b.guest_email LIKE ? OR b.guest_last_name LIKE ?)'); params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
    if (date_from) { conditions.push('b.check_in_date >= ?'); params.push(date_from); }
    if (date_to) { conditions.push('b.check_in_date <= ?'); params.push(date_to); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const [rows] = await db.query(
      `SELECT b.*, rc.name AS room_name, r.room_number
       FROM bookings b JOIN rooms r ON b.room_id = r.id JOIN room_categories rc ON b.room_category_id = rc.id
       ${where} ORDER BY b.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [[{total}]] = await db.query(`SELECT COUNT(*) as total FROM bookings b ${where}`, params);
    res.json({ data: rows, total, page: parseInt(page), per_page: limit, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// ADMIN: PUT /api/bookings/:id/status
router.put('/:id/status', verifyAdmin, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { status, notes } = req.body;
    const validStatuses = ['pending','confirmed','checked_in','checked_out','cancelled','no_show'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const updates = { status, internal_notes: notes || null };
    if (status === 'checked_in') updates.checked_in_at = new Date();
    if (status === 'checked_out') updates.checked_out_at = new Date();
    if (status === 'cancelled') { updates.cancelled_at = new Date(); updates.cancellation_reason = notes; }

    await db.query('UPDATE bookings SET ? WHERE id = ?', [updates, req.params.id]);
    // Update room status
    if (status === 'checked_in') await db.query('UPDATE rooms r JOIN bookings b ON b.room_id = r.id SET r.status = "occupied" WHERE b.id = ?', [req.params.id]);
    if (status === 'checked_out') await db.query('UPDATE rooms r JOIN bookings b ON b.room_id = r.id SET r.status = "housekeeping" WHERE b.id = ?', [req.params.id]);
    res.json({ message: `Booking status updated to ${status}` });
  } catch (err) { next(err); }
});

module.exports = router;

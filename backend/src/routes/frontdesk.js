// ============================================================
// src/routes/frontdesk.js — Full PMS / Front Desk
// Counter booking, room assignment, check-in/out,
// guest invoices, restaurant & amenity consumption billing
// Author: Kiran Khadka — © 2026 Kiran Khadka
// ============================================================
const express = require('express');
const { verifyAdmin } = require('../middleware/auth');
const router = express.Router();
router.use(verifyAdmin);

function genRef() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let r = 'WI';
  for (let i = 0; i < 8; i++) r += c[Math.floor(Math.random() * c.length)];
  return r;
}

// ─────────────────────────────────────────────────────────────
// ROOM GRID
// ─────────────────────────────────────────────────────────────
router.get('/room-grid', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(`
      SELECT r.id, r.room_number, r.floor, r.wing, r.status, r.housekeeping_status, r.notes,
             rc.name AS category_name, rc.base_price, rc.max_adults, rc.bed_type,
             b.id AS booking_id, b.booking_reference, b.guest_first_name, b.guest_last_name,
             b.guest_phone, b.check_in_date, b.check_out_date, b.status AS booking_status,
             b.payment_status, b.total_amount, b.amount_paid
      FROM rooms r
      JOIN room_categories rc ON r.category_id = rc.id
      LEFT JOIN bookings b ON b.room_id = r.id
        AND b.status IN ('confirmed','checked_in')
        AND b.check_in_date <= CURDATE() AND b.check_out_date > CURDATE()
      WHERE r.is_active = 1
      ORDER BY r.floor, r.room_number`);
    res.json(rows);
  } catch (e) { next(e); }
});

// ─────────────────────────────────────────────────────────────
// AVAILABLE ROOMS
// ─────────────────────────────────────────────────────────────
router.get('/available-rooms', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { check_in, check_out } = req.query;
    if (!check_in || !check_out) return res.status(400).json({ error: 'check_in and check_out required' });
    const [rooms] = await db.query(`
      SELECT r.id, r.room_number, r.floor, r.wing,
             rc.id AS category_id, rc.name AS category_name, rc.base_price,
             rc.max_adults, rc.max_children, rc.bed_type, rc.size_sqm
      FROM rooms r JOIN room_categories rc ON r.category_id = rc.id
      WHERE r.is_active = 1 AND r.status != 'maintenance'
        AND r.id NOT IN (
          SELECT room_id FROM bookings
          WHERE status NOT IN ('cancelled','no_show')
          AND check_in_date < ? AND check_out_date > ?
        )
      ORDER BY rc.base_price, r.room_number`, [check_out, check_in]);
    res.json(rooms);
  } catch (e) { next(e); }
});

// ─────────────────────────────────────────────────────────────
// TODAY'S ARRIVALS & DEPARTURES
// ─────────────────────────────────────────────────────────────
router.get('/today', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [arrivals] = await db.query(`
      SELECT b.id, b.booking_reference, b.guest_first_name, b.guest_last_name,
             b.guest_phone, b.check_in_date, b.check_out_date, b.adults, b.status,
             b.payment_status, r.room_number, rc.name AS room_name
      FROM bookings b JOIN rooms r ON b.room_id = r.id JOIN room_categories rc ON b.room_category_id = rc.id
      WHERE DATE(b.check_in_date) = CURDATE() AND b.status IN ('confirmed','checked_in')
      ORDER BY b.check_in_date`);
    const [departures] = await db.query(`
      SELECT b.id, b.booking_reference, b.guest_first_name, b.guest_last_name,
             b.guest_phone, b.check_in_date, b.check_out_date, b.total_amount,
             b.status, b.payment_status, r.room_number, rc.name AS room_name
      FROM bookings b JOIN rooms r ON b.room_id = r.id JOIN room_categories rc ON b.room_category_id = rc.id
      WHERE DATE(b.check_out_date) = CURDATE() AND b.status IN ('confirmed','checked_in','checked_out')
      ORDER BY b.check_out_date`);
    res.json({ arrivals, departures });
  } catch (e) { next(e); }
});

// ─────────────────────────────────────────────────────────────
// WALK-IN / COUNTER BOOKING
// ─────────────────────────────────────────────────────────────
router.post('/walk-in', async (req, res, next) => {
  const db = req.app.locals.db;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const {
      room_id, check_in_date, check_out_date,
      guest_first_name, guest_last_name, guest_email, guest_phone,
      guest_nationality, guest_id_type, guest_id_number,
      guest_address, guest_dob,
      adults, children, payment_method, amount_paid,
      special_requests, internal_notes, discount_amount
    } = req.body;

    if (!room_id || !check_in_date || !check_out_date || !guest_first_name || !guest_last_name)
      return res.status(400).json({ error: 'room_id, dates, guest name required' });

    const [conflict] = await conn.query(
      `SELECT id FROM bookings WHERE room_id = ? AND status NOT IN ('cancelled','no_show')
       AND check_in_date < ? AND check_out_date > ? FOR UPDATE`,
      [room_id, check_out_date, check_in_date]);
    if (conflict.length) { await conn.rollback(); return res.status(409).json({ error: 'Room not available for selected dates' }); }

    const [[room]] = await conn.query(
      `SELECT r.*, rc.base_price, rc.id AS category_id
       FROM rooms r JOIN room_categories rc ON r.category_id = rc.id WHERE r.id = ?`, [room_id]);
    if (!room) { await conn.rollback(); return res.status(404).json({ error: 'Room not found' }); }

    const nights = Math.ceil((new Date(check_out_date) - new Date(check_in_date)) / 86400000);
    const subtotal = room.base_price * nights;
    const discount = parseFloat(discount_amount || 0);
    const taxable = Math.max(0, subtotal - discount);
    const taxes = taxable * 0.13;
    const sc = taxable * 0.10;
    const total = taxable + taxes + sc;

    const PM_MAP = { qr_code:'qr_transfer', credit_card:'card', online:'card' };
    const rawPM = (payment_method || 'cash').toLowerCase();
    const safePM = PM_MAP[rawPM] || (['cash','qr_transfer','card','bank_transfer'].includes(rawPM) ? rawPM : 'cash');

    const paid = parseFloat(amount_paid || 0);
    const pStatus = paid >= total ? 'paid' : paid > 0 ? 'partial' : 'unpaid';

    let ref; let t = 0;
    do { ref = genRef(); t++; } while (t < 5);

    const [result] = await conn.query(`
      INSERT INTO bookings (
        booking_reference, room_id, room_category_id, check_in_date, check_out_date,
        nights, adults, children, room_rate, subtotal, taxes, service_charge,
        discount_amount, total_amount, amount_paid, payment_method, payment_status, status,
        special_requests, internal_notes, source,
        guest_first_name, guest_last_name, guest_email, guest_phone, guest_nationality
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [ref, room_id, room.category_id, check_in_date, check_out_date,
       nights, adults || 1, children || 0, room.base_price,
       subtotal.toFixed(2), taxes.toFixed(2), sc.toFixed(2),
       discount.toFixed(2), total.toFixed(2), paid.toFixed(2),
       safePM, pStatus, 'checked_in',
       special_requests || null,
       internal_notes || `Counter booking by ${req.admin.name}`,
       'walk_in',
       guest_first_name, guest_last_name, guest_email || null, guest_phone || null, guest_nationality || null]);

    await conn.query(`UPDATE rooms SET status='occupied' WHERE id=?`, [room_id]);

    if (paid > 0) {
      await conn.query(
        `INSERT INTO payments (booking_id, amount, currency, method, status, processed_by, processed_at)
         VALUES (?, ?, 'NPR', ?, 'verified', ?, NOW())`,
        [result.insertId, paid.toFixed(2), safePM, req.admin.id]);
    }

    if (guest_id_type && guest_id_number) {
      await conn.query(
        `INSERT INTO booking_guest_ids (booking_id, id_type, id_number, address, dob, created_at)
         VALUES (?,?,?,?,?,NOW())
         ON DUPLICATE KEY UPDATE id_number=VALUES(id_number)`,
        [result.insertId, guest_id_type, guest_id_number, guest_address || null, guest_dob || null]
      ).catch(() => {});
    }

    await conn.commit();

    if (guest_email) {
      try {
        const bcrypt = require('bcryptjs');
        const [ex] = await db.query('SELECT id FROM users WHERE email=?', [guest_email]);
        if (!ex.length) {
          const tp = Math.random().toString(36).slice(-8) + '!A1';
          await db.query(
            `INSERT INTO users (first_name,last_name,email,password,phone,nationality,email_verified_at) VALUES (?,?,?,?,?,?,NOW())`,
            [guest_first_name, guest_last_name, guest_email, await bcrypt.hash(tp, 12), guest_phone || null, guest_nationality || null]);
        }
      } catch {}
    }

    res.status(201).json({
      booking_id: result.insertId, booking_reference: ref,
      total_amount: total.toFixed(2), nights, message: 'Counter booking created & checked in'
    });
  } catch (e) { await conn.rollback(); next(e); }
  finally { conn.release(); }
});

// ─────────────────────────────────────────────────────────────
// CHECK-IN
// ─────────────────────────────────────────────────────────────
router.post('/check-in/:id', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query('SELECT * FROM bookings WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    await db.query(`UPDATE bookings SET status='checked_in', checked_in_at=NOW() WHERE id=?`, [req.params.id]);
    await db.query(`UPDATE rooms SET status='occupied' WHERE id=?`, [rows[0].room_id]);
    res.json({ message: 'Checked in' });
  } catch (e) { next(e); }
});

// ─────────────────────────────────────────────────────────────
// CHECK-OUT
// ─────────────────────────────────────────────────────────────
router.post('/check-out/:id', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query('SELECT * FROM bookings WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    await db.query(`UPDATE bookings SET status='checked_out', checked_out_at=NOW() WHERE id=?`, [req.params.id]);
    await db.query(`UPDATE rooms SET status='housekeeping', housekeeping_status='dirty' WHERE id=?`, [rows[0].room_id]);
    res.json({ message: 'Checked out' });
  } catch (e) { next(e); }
});

// ─────────────────────────────────────────────────────────────
// ROOM STATUS UPDATE
// ─────────────────────────────────────────────────────────────
router.put('/room-status/:id', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { status, housekeeping_status, notes } = req.body;
    const u = []; const v = [];
    if (status) { u.push('status=?'); v.push(status); }
    if (housekeeping_status) { u.push('housekeeping_status=?'); v.push(housekeeping_status); }
    if (notes !== undefined) { u.push('notes=?'); v.push(notes); }
    if (!u.length) return res.status(400).json({ error: 'Nothing to update' });
    await db.query(`UPDATE rooms SET ${u.join(',')} WHERE id=?`, [...v, req.params.id]);
    res.json({ message: 'Updated' });
  } catch (e) { next(e); }
});

// ─────────────────────────────────────────────────────────────
// GET BOOKING DETAILS (for invoice / folio)
// ─────────────────────────────────────────────────────────────
router.get('/booking/:id', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [[booking]] = await db.query(`
      SELECT b.*, r.room_number, rc.name AS room_type, rc.bed_type,
             h.name AS hotel_name, h.address AS hotel_address,
             h.phone AS hotel_phone, h.email AS hotel_email,
             h.currency_symbol, h.default_currency
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN room_categories rc ON b.room_category_id = rc.id
      CROSS JOIN hotel_info h WHERE h.id=1
      WHERE b.id = ?`, [req.params.id]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const [charges] = await db.query(
      `SELECT * FROM booking_charges WHERE booking_id = ? ORDER BY created_at`, [req.params.id]);
    const [payments] = await db.query(
      `SELECT * FROM payments WHERE booking_id = ? ORDER BY processed_at`, [req.params.id]);

    const totalCharges = charges.reduce((s, c) => s + parseFloat(c.amount), 0);
    const totalPaid = payments.filter(p => p.status === 'verified').reduce((s, p) => s + parseFloat(p.amount), 0);

    res.json({ booking, charges, payments, totalCharges, totalPaid, balance: (parseFloat(booking.total_amount) + totalCharges - totalPaid).toFixed(2) });
  } catch (e) { next(e); }
});

// ─────────────────────────────────────────────────────────────
// ADD CONSUMPTION CHARGE (restaurant, bar, spa, amenity, etc.)
// ─────────────────────────────────────────────────────────────
router.post('/booking/:id/charge', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { category, description, quantity, unit_price, notes } = req.body;
    if (!category || !description || !quantity || !unit_price)
      return res.status(400).json({ error: 'category, description, quantity, unit_price required' });

    const [[booking]] = await db.query('SELECT id FROM bookings WHERE id=? AND status IN (?,?)', [req.params.id, 'confirmed', 'checked_in']);
    if (!booking) return res.status(404).json({ error: 'Active booking not found' });

    const amount = (parseFloat(quantity) * parseFloat(unit_price)).toFixed(2);
    const [r] = await db.query(
      `INSERT INTO booking_charges (booking_id, category, description, quantity, unit_price, amount, notes, added_by, created_at)
       VALUES (?,?,?,?,?,?,?,?,NOW())`,
      [req.params.id, category, description, quantity, parseFloat(unit_price).toFixed(2), amount, notes || null, req.admin.id]);

    res.status(201).json({ id: r.insertId, amount, message: 'Charge added' });
  } catch (e) { next(e); }
});

// ─────────────────────────────────────────────────────────────
// DELETE CHARGE
// ─────────────────────────────────────────────────────────────
router.delete('/charge/:id', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    await db.query('DELETE FROM booking_charges WHERE id=?', [req.params.id]);
    res.json({ message: 'Charge removed' });
  } catch (e) { next(e); }
});

// ─────────────────────────────────────────────────────────────
// RECORD PAYMENT
// ─────────────────────────────────────────────────────────────
router.post('/booking/:id/payment', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { amount, method, notes } = req.body;
    if (!amount || !method) return res.status(400).json({ error: 'amount and method required' });

    const [[booking]] = await db.query('SELECT * FROM bookings WHERE id=?', [req.params.id]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const [charges] = await db.query('SELECT SUM(amount) as tc FROM booking_charges WHERE booking_id=?', [req.params.id]);
    const [prev] = await db.query('SELECT SUM(amount) as tp FROM payments WHERE booking_id=? AND status=?', [req.params.id, 'verified']);

    const totalDue = parseFloat(booking.total_amount) + parseFloat(charges[0].tc || 0);
    const alreadyPaid = parseFloat(prev[0].tp || 0);
    const newPaid = alreadyPaid + parseFloat(amount);
    const pStatus = newPaid >= totalDue ? 'paid' : 'partial';

    await db.query(
      `INSERT INTO payments (booking_id, amount, currency, method, status, notes, processed_by, processed_at)
       VALUES (?,?,'NPR',?,'verified',?,?,NOW())`,
      [req.params.id, parseFloat(amount).toFixed(2), method, notes || null, req.admin.id]);

    await db.query(
      `UPDATE bookings SET payment_status=?, amount_paid=? WHERE id=?`,
      [pStatus, newPaid.toFixed(2), req.params.id]);

    res.json({ message: 'Payment recorded', payment_status: pStatus, total_paid: newPaid.toFixed(2) });
  } catch (e) { next(e); }
});

// ─────────────────────────────────────────────────────────────
// ASSIGN / CHANGE ROOM
// ─────────────────────────────────────────────────────────────
router.put('/booking/:id/assign-room', async (req, res, next) => {
  const db = req.app.locals.db;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { new_room_id } = req.body;
    const [[booking]] = await conn.query('SELECT * FROM bookings WHERE id=?', [req.params.id]);
    if (!booking) { await conn.rollback(); return res.status(404).json({ error: 'Booking not found' }); }

    const [conflict] = await conn.query(
      `SELECT id FROM bookings WHERE room_id=? AND id!=? AND status NOT IN ('cancelled','no_show')
       AND check_in_date < ? AND check_out_date > ?`,
      [new_room_id, req.params.id, booking.check_out_date, booking.check_in_date]);
    if (conflict.length) { await conn.rollback(); return res.status(409).json({ error: 'Room not available' }); }

    const [[newRoom]] = await conn.query(
      `SELECT r.*, rc.base_price, rc.id AS cat_id FROM rooms r JOIN room_categories rc ON r.category_id=rc.id WHERE r.id=?`,
      [new_room_id]);

    await conn.query(`UPDATE rooms SET status='available' WHERE id=?`, [booking.room_id]);
    await conn.query(`UPDATE bookings SET room_id=?, room_category_id=?, room_rate=? WHERE id=?`,
      [new_room_id, newRoom.cat_id, newRoom.base_price, req.params.id]);
    if (booking.status === 'checked_in') {
      await conn.query(`UPDATE rooms SET status='occupied' WHERE id=?`, [new_room_id]);
    }
    await conn.commit();
    res.json({ message: 'Room assigned', room_number: newRoom.room_number });
  } catch (e) { await conn.rollback(); next(e); }
  finally { conn.release(); }
});

// ─────────────────────────────────────────────────────────────
// SEARCH BOOKING BY REFERENCE / NAME / ROOM
// ─────────────────────────────────────────────────────────────
router.get('/search', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const like = `%${q}%`;
    const [rows] = await db.query(`
      SELECT b.id, b.booking_reference, b.guest_first_name, b.guest_last_name,
             b.guest_phone, b.check_in_date, b.check_out_date, b.status, b.payment_status,
             b.total_amount, r.room_number, rc.name AS room_type
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN room_categories rc ON b.room_category_id = rc.id
      WHERE b.booking_reference LIKE ? OR b.guest_first_name LIKE ?
        OR b.guest_last_name LIKE ? OR b.guest_phone LIKE ? OR r.room_number LIKE ?
      ORDER BY b.created_at DESC LIMIT 20`,
      [like, like, like, like, like]);
    res.json(rows);
  } catch (e) { next(e); }
});

module.exports = router;

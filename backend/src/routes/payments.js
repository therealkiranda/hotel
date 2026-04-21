// ============================================================
// src/routes/payments.js — Payment Management
// QR payment proof upload, verification, cash handling
// ============================================================
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyAdmin, verifyUser, optionalAuth } = require('../middleware/auth');
const router = express.Router();

// ─── File Upload Config ─────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.env.UPLOAD_DIR || 'uploads', 'payment-proofs');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `proof_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only JPG, PNG, PDF, WebP files are allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || 10485760) }, // 10MB
});

// ─── GET /api/payments/qr-info ──────────────────────────────
// Returns QR code info for display at checkout (public)
router.get('/qr-info', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(`
      SELECT qr_payment_enabled, qr_code_image_path, qr_payment_instructions,
             qr_bank_name, qr_account_name, qr_account_number, qr_payment_deadline_hours
      FROM hotel_info WHERE id = 1`);
    if (!rows.length || !rows[0].qr_payment_enabled) {
      return res.json({ enabled: false });
    }
    res.json({ enabled: true, ...rows[0] });
  } catch (err) { next(err); }
});

// ─── POST /api/payments/upload-proof ────────────────────────
// Customer uploads payment screenshot/bank statement
router.post('/upload-proof', optionalAuth, upload.single('proof'), async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { booking_id, booking_reference, amount, transaction_id } = req.body;
    if (!booking_reference && !booking_id)
      return res.status(400).json({ error: 'booking_reference or booking_id required' });

    // Find booking
    const query = booking_id
      ? 'SELECT * FROM bookings WHERE id = ?'
      : 'SELECT * FROM bookings WHERE booking_reference = ?';
    const [bookings] = await db.query(query, [booking_id || booking_reference]);
    if (!bookings.length) return res.status(404).json({ error: 'Booking not found' });
    const booking = bookings[0];

    // Create or update payment record
    const proofPath = req.file.path.replace(/\\/g, '/');
    const [existing] = await db.query(
      `SELECT id FROM payments WHERE booking_id = ? AND method = 'qr_transfer' ORDER BY created_at DESC LIMIT 1`,
      [booking.id]);

    if (existing.length > 0) {
      await db.query(
        `UPDATE payments SET proof_image_path = ?, proof_file_type = ?,
         proof_uploaded_at = NOW(), status = 'proof_submitted',
         transaction_id = COALESCE(?, transaction_id), amount = COALESCE(?, amount)
         WHERE id = ?`,
        [proofPath, req.file.mimetype, transaction_id || null, amount || null, existing[0].id]);
    } else {
      await db.query(`
        INSERT INTO payments (booking_id, amount, method, status, proof_image_path,
          proof_file_type, proof_uploaded_at, transaction_id)
        VALUES (?, ?, 'qr_transfer', 'proof_submitted', ?, ?, NOW(), ?)`,
        [booking.id, amount || booking.total_amount, proofPath, req.file.mimetype, transaction_id || null]);
    }

    // Update booking payment status
    await db.query(
      `UPDATE bookings SET payment_status = 'proof_submitted' WHERE id = ?`,
      [booking.id]);

    // Notify admins
    await db.query(`
      INSERT INTO notifications (type, notifiable_type, title, message, data)
      VALUES ('payment_proof', 'admin', 'Payment Proof Submitted', ?, ?)`,
      [`Booking ${booking.booking_reference} — payment proof uploaded and awaiting verification.`,
       JSON.stringify({ booking_id: booking.id, reference: booking.booking_reference })]);

    res.json({
      message: 'Payment proof uploaded successfully. We will verify within 24 hours.',
      file_name: req.file.filename,
      booking_reference: booking.booking_reference,
    });
  } catch (err) { next(err); }
});

// ─── GET /api/payments/pending-proofs ───────────────────────
// Admin: list all unverified payment proofs
router.get('/pending-proofs', verifyAdmin, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.booking_id, p.amount, p.method, p.status,
             p.proof_image_path, p.proof_file_type, p.proof_uploaded_at, p.transaction_id,
             b.booking_reference, b.guest_first_name, b.guest_last_name, b.guest_email,
             b.total_amount, b.check_in_date, b.check_out_date
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      WHERE p.status = 'proof_submitted'
      ORDER BY p.proof_uploaded_at ASC`);
    res.json(rows);
  } catch (err) { next(err); }
});

// ─── PUT /api/payments/:id/verify ───────────────────────────
// Admin: verify or reject a payment proof
router.put('/:id/verify', verifyAdmin, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { action, notes } = req.body;
    if (!['verify','reject'].includes(action)) return res.status(400).json({ error: 'action must be verify or reject' });

    const [payments] = await db.query('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    if (!payments.length) return res.status(404).json({ error: 'Payment not found' });
    const payment = payments[0];

    if (action === 'verify') {
      await db.query(
        `UPDATE payments SET status = 'verified', proof_verified_at = NOW(),
         proof_verified_by = ?, proof_notes = ? WHERE id = ?`,
        [req.admin.id, notes || null, req.params.id]);
      await db.query(
        `UPDATE bookings SET payment_status = 'proof_verified', status = 'confirmed'
         WHERE id = ? AND status = 'pending'`,
        [payment.booking_id]);
    } else {
      await db.query(
        `UPDATE payments SET status = 'pending', proof_image_path = NULL,
         proof_rejection_reason = ? WHERE id = ?`,
        [notes || 'Proof rejected — please re-upload', req.params.id]);
      await db.query(
        `UPDATE bookings SET payment_status = 'unpaid' WHERE id = ?`,
        [payment.booking_id]);
    }

    res.json({ message: action === 'verify' ? 'Payment verified — booking confirmed' : 'Payment proof rejected' });
  } catch (err) { next(err); }
});

// ─── GET /api/payments/booking/:bookingId ───────────────────
router.get('/booking/:bookingId', optionalAuth, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(
      `SELECT id, amount, method, status, proof_image_path, proof_uploaded_at,
              proof_verified_at, transaction_id, created_at
       FROM payments WHERE booking_id = ? ORDER BY created_at DESC`,
      [req.params.bookingId]);
    res.json(rows);
  } catch (err) { next(err); }
});

// ─── POST /api/payments/record-cash ─────────────────────────
// Admin: record cash payment at check-in/checkout
router.post('/record-cash', verifyAdmin, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { booking_id, amount, notes } = req.body;
    if (!booking_id || !amount) return res.status(400).json({ error: 'booking_id and amount required' });

    const [r] = await db.query(`
      INSERT INTO payments (booking_id, amount, method, status, notes, processed_by, processed_at)
      VALUES (?, ?, 'cash', 'verified', ?, ?, NOW())`,
      [booking_id, amount, notes || null, req.admin.id]);

    const [[{total_amount}]] = await db.query('SELECT total_amount FROM bookings WHERE id = ?', [booking_id]);
    const [[{total_paid}]] = await db.query(
      `SELECT COALESCE(SUM(amount),0) AS total_paid FROM payments
       WHERE booking_id = ? AND status = 'verified'`, [booking_id]);

    const paymentStatus = parseFloat(total_paid) >= parseFloat(total_amount) ? 'paid' : 'partial';
    await db.query('UPDATE bookings SET payment_status = ? WHERE id = ?', [paymentStatus, booking_id]);

    res.status(201).json({ id: r.insertId, payment_status: paymentStatus, total_paid });
  } catch (err) { next(err); }
});

// ─── GET /api/payments (admin) ──────────────────────────────
router.get('/', verifyAdmin, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { method, status, page = 1, per_page = 20 } = req.query;
    const limit = Math.min(parseInt(per_page), 100);
    const offset = (parseInt(page) - 1) * limit;
    const conditions = ['1=1'];
    const params = [];
    if (method) { conditions.push('p.method = ?'); params.push(method); }
    if (status) { conditions.push('p.status = ?'); params.push(status); }
    const where = conditions.join(' AND ');
    const [rows] = await db.query(`
      SELECT p.*, b.booking_reference, b.guest_first_name, b.guest_last_name
      FROM payments p JOIN bookings b ON p.booking_id = b.id
      WHERE ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]);
    const [[{total}]] = await db.query(`SELECT COUNT(*) as total FROM payments p WHERE ${where}`, params);
    res.json({ data: rows, total });
  } catch (err) { next(err); }
});

module.exports = router;

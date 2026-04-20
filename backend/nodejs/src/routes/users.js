// ============================================================
// src/routes/users.js — User profile & booking history
// ============================================================
const express = require('express');
const { verifyUser } = require('../middleware/auth');
const router = express.Router();

router.use(verifyUser);

// GET /api/users/profile
router.get('/profile', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(
      `SELECT id, first_name, last_name, email, phone, nationality, date_of_birth, address,
              avatar_path, auth_provider, newsletter_subscribed, total_stays, total_spent, loyalty_points, created_at
       FROM users WHERE id = ?`, [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/users/profile
router.put('/profile', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const allowed = ['first_name','last_name','phone','nationality','date_of_birth','address','newsletter_subscribed'];
    const updates = []; const vals = [];
    allowed.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); vals.push(req.body[f]); } });
    if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
    await db.query(`UPDATE users SET ${updates.join(',')} WHERE id = ?`, [...vals, req.user.id]);
    res.json({ message: 'Profile updated successfully' });
  } catch (err) { next(err); }
});

// GET /api/users/bookings
router.get('/bookings', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(`
      SELECT b.booking_reference, b.check_in_date, b.check_out_date, b.nights,
             b.total_amount, b.status, b.payment_status, b.special_requests, b.created_at,
             rc.name AS room_name, rc.slug AS room_slug
      FROM bookings b
      JOIN room_categories rc ON b.room_category_id = rc.id
      WHERE b.user_id = ? ORDER BY b.created_at DESC`, [req.user.id]);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/users/loyalty
router.get('/loyalty', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(
      'SELECT total_stays, total_spent, loyalty_points FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];
    let tier = 'Silver';
    if (user.total_stays >= 20 || user.total_spent >= 10000) tier = 'Platinum';
    else if (user.total_stays >= 10 || user.total_spent >= 5000) tier = 'Gold';
    res.json({ ...user, tier });
  } catch (err) { next(err); }
});

module.exports = router;

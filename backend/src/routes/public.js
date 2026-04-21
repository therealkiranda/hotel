// ============================================================
// src/routes/public.js — Public data endpoints (no auth)
// ============================================================
const express = require('express');
const router = express.Router();

const tryParse = (v, d) => { try { return JSON.parse(v); } catch { return d; } };

// GET /api/public/settings — theme + hotel info for frontend
router.get('/settings', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [theme] = await db.query('SELECT * FROM theme_settings WHERE id = 1');
    const [hotel] = await db.query('SELECT * FROM hotel_info WHERE id = 1');
    const h = hotel[0] || {};
    const publicHotel = {
      name: h.name, tagline: h.tagline, description: h.description,
      address: h.address, city: h.city, country: h.country,
      phone: h.phone, email: h.email,
      check_in_time: h.check_in_time, check_out_time: h.check_out_time,
      cancellation_policy: h.cancellation_policy, pet_policy: h.pet_policy,
      children_policy: h.children_policy, smoking_policy: h.smoking_policy,
      facebook_url: h.facebook_url, instagram_url: h.instagram_url,
      twitter_url: h.twitter_url, tripadvisor_url: h.tripadvisor_url,
      google_maps_embed: h.google_maps_embed,
      logo_path: h.logo_path, favicon_path: h.favicon_path,
      default_currency: h.default_currency || 'USD',
      currency_symbol: h.currency_symbol || '$',
      cash_payment_enabled: h.cash_payment_enabled != null ? h.cash_payment_enabled : 1,
      qr_payment_enabled: h.qr_payment_enabled || 0,
      qr_payment_title: h.qr_payment_title || 'QR / Bank Transfer',
      qr_bank_name: h.qr_bank_name,
      qr_account_name: h.qr_account_name,
      qr_account_number: h.qr_account_number,
      qr_payment_instructions: h.qr_payment_instructions,
      qr_payment_deadline_hours: h.qr_payment_deadline_hours || 24,
      qr_code_image_path: h.qr_code_image_path,
      online_payment_enabled: h.online_payment_enabled || 0,
      online_payment_provider: h.online_payment_provider,
      booking_system_enabled: h.booking_system_enabled != null ? h.booking_system_enabled : 1,
      maintenance_message: h.maintenance_message,
    };
    res.json({ theme: theme[0] || {}, hotel: publicHotel });
  } catch (err) { next(err); }
});

// GET /api/public/seo/:page
router.get('/seo/:page', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query('SELECT * FROM seo_settings WHERE page_identifier = ?', [req.params.page]);
    res.json(rows[0] || {});
  } catch (err) { next(err); }
});

// GET /api/public/amenities
router.get('/amenities', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { featured } = req.query;
    const where = featured ? 'WHERE is_featured = 1 AND is_active = 1' : 'WHERE is_active = 1';
    const [rows] = await db.query(`SELECT * FROM amenities ${where} ORDER BY sort_order, id`);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/public/amenities/:slug
router.get('/amenities/:slug', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query('SELECT * FROM amenities WHERE slug = ? AND is_active = 1', [req.params.slug]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// GET /api/public/blog
router.get('/blog', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { page = 1, per_page = 9, category, featured } = req.query;
    const limit = Math.min(parseInt(per_page), 50);
    const offset = (parseInt(page) - 1) * limit;
    const conditions = ["status = 'published'"];
    const params = [];
    if (category) { conditions.push('category = ?'); params.push(category); }
    if (featured) { conditions.push('featured = 1'); }
    const where = 'WHERE ' + conditions.join(' AND ');
    const [rows] = await db.query(
      `SELECT id, title, slug, excerpt, featured_image, category, tags, author_name, featured, views, published_at
       FROM blog_posts ${where} ORDER BY featured DESC, published_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]);
    const [[{total}]] = await db.query(`SELECT COUNT(*) as total FROM blog_posts ${where}`, params);
    res.json({ data: rows.map(r => ({ ...r, tags: tryParse(r.tags, []) })), total, page: parseInt(page), per_page: limit });
  } catch (err) { next(err); }
});

// GET /api/public/blog/:slug
router.get('/blog/:slug', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(`SELECT * FROM blog_posts WHERE slug = ? AND status = 'published'`, [req.params.slug]);
    if (!rows.length) return res.status(404).json({ error: 'Post not found' });
    await db.query('UPDATE blog_posts SET views = views + 1 WHERE id = ?', [rows[0].id]);
    const post = { ...rows[0], tags: tryParse(rows[0].tags, []) };
    res.json(post);
  } catch (err) { next(err); }
});

// GET /api/public/reviews
router.get('/reviews', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { featured } = req.query;
    const where = featured ? "WHERE status = 'approved' AND is_featured = 1" : "WHERE status = 'approved'";
    const [rows] = await db.query(`SELECT id, guest_name, guest_country, rating_overall, rating_cleanliness,
      rating_service, rating_location, rating_value, title, comment, admin_response, is_featured, created_at
      FROM reviews ${where} ORDER BY is_featured DESC, created_at DESC LIMIT 20`);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/public/reviews
router.post('/reviews', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { booking_id, guest_name, guest_country, rating_overall, rating_cleanliness,
            rating_service, rating_location, rating_value, title, comment } = req.body;
    if (!guest_name || !rating_overall) return res.status(400).json({ error: 'Name and overall rating required' });
    await db.query(
      `INSERT INTO reviews (booking_id, guest_name, guest_country, rating_overall, rating_cleanliness,
       rating_service, rating_location, rating_value, title, comment, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,'pending')`,
      [booking_id || null, guest_name, guest_country, rating_overall, rating_cleanliness,
       rating_service, rating_location, rating_value, title, comment]);
    res.status(201).json({ message: 'Review submitted successfully and is pending approval.' });
  } catch (err) { next(err); }
});

module.exports = router;

// ============================================================
// src/routes/users.js — User profile management
// ============================================================
// (Saved to separate file below)

// ============================================================
// src/middleware/validate.js — Input validation
// ============================================================
// Exported from this file for convenience

// ============================================================
// src/middleware/errorHandler.js — Global error handler
// ============================================================
// Exported from this file for convenience

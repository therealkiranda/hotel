// ============================================================
// src/routes/admin.js — Admin API Routes
// ============================================================
const express = require('express');
const { verifyAdmin } = require('../middleware/auth');
const router = express.Router();

// All admin routes protected
router.use(verifyAdmin);

// ─── DASHBOARD ANALYTICS ────────────────────────────────────
router.get('/dashboard', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [[stats]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM bookings WHERE status IN ('confirmed','checked_in','checked_out')) AS total_bookings,
        (SELECT COUNT(*) FROM bookings WHERE status = 'pending') AS pending_bookings,
        (SELECT COUNT(*) FROM bookings WHERE status = 'checked_in') AS active_guests,
        (SELECT COUNT(*) FROM bookings WHERE DATE(check_in_date) = CURDATE()) AS arrivals_today,
        (SELECT COUNT(*) FROM bookings WHERE DATE(check_out_date) = CURDATE()) AS departures_today,
        (SELECT COALESCE(SUM(total_amount),0) FROM bookings WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) AND status NOT IN ('cancelled')) AS revenue_this_month,
        (SELECT COALESCE(SUM(total_amount),0) FROM bookings WHERE YEAR(created_at) = YEAR(NOW()) AND status NOT IN ('cancelled')) AS revenue_this_year,
        (SELECT COUNT(*) FROM users WHERE status = 'active') AS total_customers,
        (SELECT COUNT(*) FROM users WHERE MONTH(created_at) = MONTH(NOW())) AS new_customers_this_month,
        (SELECT COUNT(*) FROM rooms WHERE status = 'available') AS available_rooms,
        (SELECT COUNT(*) FROM rooms WHERE status = 'occupied') AS occupied_rooms,
        (SELECT COUNT(*) FROM rooms WHERE is_active = 1) AS total_rooms
    `);

    // Monthly revenue trend (last 12 months)
    const [monthlyRevenue] = await db.query(`
      SELECT DATE_FORMAT(check_in_date, '%Y-%m') AS month,
             SUM(total_amount) AS revenue, COUNT(*) AS bookings
      FROM bookings WHERE status NOT IN ('cancelled','no_show')
        AND check_in_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(check_in_date, '%Y-%m')
      ORDER BY month`);

    // Bookings by source
    const [bySource] = await db.query(`
      SELECT source, COUNT(*) AS count FROM bookings
      WHERE status NOT IN ('cancelled') GROUP BY source`);

    // Occupancy rate per category
    const [occupancy] = await db.query(`
      SELECT rc.name,
             COUNT(DISTINCT r.id) AS total_rooms,
             COUNT(DISTINCT CASE WHEN r.status = 'occupied' THEN r.id END) AS occupied
      FROM room_categories rc JOIN rooms r ON r.category_id = rc.id
      WHERE r.is_active = 1 GROUP BY rc.id, rc.name`);

    // Recent bookings
    const [recentBookings] = await db.query(`
      SELECT b.booking_reference, b.guest_first_name, b.guest_last_name,
             b.guest_email, b.check_in_date, b.check_out_date, b.total_amount, b.status,
             rc.name AS room_name
      FROM bookings b JOIN room_categories rc ON b.room_category_id = rc.id
      ORDER BY b.created_at DESC LIMIT 10`);

    res.json({ stats, monthlyRevenue, bySource, occupancy, recentBookings });
  } catch (err) { next(err); }
});

// ─── THEME SETTINGS ─────────────────────────────────────────
router.get('/theme', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query('SELECT * FROM theme_settings WHERE id = 1');
    res.json(rows[0] || {});
  } catch (err) { next(err); }
});

router.put('/theme', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const allowed = ['color_scheme','primary_color','secondary_color','accent_color','background_color',
                     'text_color','font_heading','font_body','font_accent','animation_speed',
                     'animations_enabled','hero_type','hero_video_url','hero_overlay_opacity','custom_css'];
    const updates = []; const vals = [];
    allowed.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); vals.push(req.body[f]); } });
    if (!updates.length) return res.status(400).json({ error: 'No valid fields provided' });
    await db.query(`UPDATE theme_settings SET ${updates.join(',')} WHERE id = 1`, vals);
    res.json({ message: 'Theme updated successfully' });
  } catch (err) { next(err); }
});

// ─── HOTEL INFO ──────────────────────────────────────────────
router.get('/hotel-info', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query('SELECT * FROM hotel_info WHERE id = 1');
    res.json(rows[0] || {});
  } catch (err) { next(err); }
});

router.put('/hotel-info', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const allowed = ['name','tagline','description','address','city','country','postal_code','phone',
                     'phone_secondary','email','email_reservations','check_in_time','check_out_time',
                     'cancellation_policy','pet_policy','children_policy','smoking_policy',
                     'facebook_url','instagram_url','twitter_url','google_maps_embed',
                     // Currency & Payment settings
                     'default_currency','currency_symbol',
                     'cash_payment_enabled','qr_payment_enabled','qr_payment_title',
                     'qr_bank_name','qr_account_name','qr_account_number',
                     'qr_payment_instructions','qr_payment_deadline_hours',
                     'qr_code_image_path',
                     'online_payment_enabled','online_payment_provider',
                     'online_payment_key','online_payment_secret',
                     // System
                     'booking_system_enabled','maintenance_message','logo_path','favicon_path'];
    const updates = []; const vals = [];
    allowed.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); vals.push(req.body[f]); } });
    if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
    await db.query(`UPDATE hotel_info SET ${updates.join(',')} WHERE id = 1`, vals);
    res.json({ message: 'Hotel info updated' });
  } catch (err) { next(err); }
});

// ─── SEO SETTINGS ───────────────────────────────────────────
router.get('/seo', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query('SELECT * FROM seo_settings ORDER BY page_identifier');
    res.json(rows);
  } catch (err) { next(err); }
});

router.put('/seo/:page', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { meta_title, meta_description, meta_keywords, og_title, og_description, og_image, robots } = req.body;
    await db.query(`INSERT INTO seo_settings (page_identifier, meta_title, meta_description, meta_keywords, og_title, og_description, og_image, robots)
      VALUES (?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE meta_title=VALUES(meta_title), meta_description=VALUES(meta_description),
      meta_keywords=VALUES(meta_keywords), og_title=VALUES(og_title), og_description=VALUES(og_description),
      og_image=VALUES(og_image), robots=VALUES(robots)`,
      [req.params.page, meta_title, meta_description, meta_keywords, og_title, og_description, og_image, robots || 'index,follow']);
    res.json({ message: 'SEO settings updated' });
  } catch (err) { next(err); }
});

// ─── SOCIAL AUTH SETTINGS ───────────────────────────────────
router.get('/social-auth', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query('SELECT id, provider, is_enabled, redirect_uri FROM social_auth_settings');
    res.json(rows);
  } catch (err) { next(err); }
});

router.put('/social-auth/:provider', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { is_enabled, client_id, client_secret, redirect_uri } = req.body;
    await db.query(
      'UPDATE social_auth_settings SET is_enabled=?, client_id=?, client_secret=?, redirect_uri=? WHERE provider=?',
      [is_enabled ? 1 : 0, client_id || null, client_secret || null, redirect_uri || null, req.params.provider]
    );
    res.json({ message: 'Social auth settings updated' });
  } catch (err) { next(err); }
});

// ─── CUSTOMERS MANAGEMENT ───────────────────────────────────
router.get('/customers', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { page = 1, per_page = 20, search } = req.query;
    const limit = Math.min(parseInt(per_page), 100);
    const offset = (parseInt(page) - 1) * limit;
    const where = search ? `WHERE email LIKE ? OR first_name LIKE ? OR last_name LIKE ?` : '';
    const params = search ? [`%${search}%`,`%${search}%`,`%${search}%`] : [];
    const [rows] = await db.query(
      `SELECT id, first_name, last_name, email, phone, nationality, total_stays, total_spent, loyalty_points, status, created_at
       FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
    const [[{total}]] = await db.query(`SELECT COUNT(*) as total FROM users ${where}`, params);
    res.json({ data: rows, total, page: parseInt(page), per_page: limit });
  } catch (err) { next(err); }
});

router.put('/customers/:id/status', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { status } = req.body;
    if (!['active','suspended','banned'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    await db.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: `Customer status updated to ${status}` });
  } catch (err) { next(err); }
});

// ─── AMENITIES MANAGEMENT ───────────────────────────────────
router.post('/amenities', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { name, slug, description, short_description, icon, category, opening_hours, price_info, is_featured, sort_order } = req.body;
    const [r] = await db.query(
      `INSERT INTO amenities (name, slug, description, short_description, icon, category, opening_hours, price_info, is_featured, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [name, slug, description, short_description, icon, category, opening_hours, price_info, is_featured ? 1 : 0, sort_order || 0]);
    res.status(201).json({ id: r.insertId });
  } catch (err) { next(err); }
});

router.put('/amenities/:id', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const fields = ['name','slug','description','short_description','icon','category','opening_hours','price_info','is_featured','sort_order','is_active'];
    const updates = []; const vals = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); vals.push(req.body[f]); } });
    await db.query(`UPDATE amenities SET ${updates.join(',')} WHERE id = ?`, [...vals, req.params.id]);
    res.json({ message: 'Amenity updated' });
  } catch (err) { next(err); }
});

// ─── BLOG MANAGEMENT ────────────────────────────────────────
router.post('/blog', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { title, slug, excerpt, content, category, tags, featured_image, status, featured, meta_title, meta_description } = req.body;
    const [r] = await db.query(
      `INSERT INTO blog_posts (title, slug, excerpt, content, category, tags, featured_image, status, featured, author_id, author_name, meta_title, meta_description, published_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [title, slug, excerpt, content, category, JSON.stringify(tags || []), featured_image, status || 'draft',
       featured ? 1 : 0, req.admin.id, req.admin.name || 'Admin', meta_title, meta_description,
       status === 'published' ? new Date() : null]);
    res.status(201).json({ id: r.insertId });
  } catch (err) { next(err); }
});

router.put('/blog/:id', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { title, slug, excerpt, content, category, tags, featured_image, status, featured, meta_title, meta_description } = req.body;
    await db.query(
      `UPDATE blog_posts SET title=?, slug=?, excerpt=?, content=?, category=?, tags=?, featured_image=?,
       status=?, featured=?, meta_title=?, meta_description=?,
       published_at = CASE WHEN status = 'published' AND published_at IS NULL THEN NOW() ELSE published_at END
       WHERE id = ?`,
      [title, slug, excerpt, content, category, JSON.stringify(tags || []), featured_image,
       status, featured ? 1 : 0, meta_title, meta_description, req.params.id]);
    res.json({ message: 'Post updated' });
  } catch (err) { next(err); }
});

router.delete('/blog/:id', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    await db.query('UPDATE blog_posts SET status = "archived" WHERE id = ?', [req.params.id]);
    res.json({ message: 'Post archived' });
  } catch (err) { next(err); }
});

// ─── ROOMS MANAGEMENT ───────────────────────────────────────
router.get('/rooms', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(`
      SELECT r.*, rc.name AS category_name, rc.base_price
      FROM rooms r JOIN room_categories rc ON r.category_id = rc.id
      ORDER BY r.floor, r.room_number`);
    res.json(rows);
  } catch (err) { next(err); }
});

router.put('/rooms/:id/status', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { status, housekeeping_status, notes } = req.body;
    const updates = {}; const vals = [];
    if (status) { updates.status = status; }
    if (housekeeping_status) { updates.housekeeping_status = housekeeping_status; }
    if (notes !== undefined) { updates.notes = notes; }
    await db.query('UPDATE rooms SET ? WHERE id = ?', [updates, req.params.id]);
    res.json({ message: 'Room updated' });
  } catch (err) { next(err); }
});

// ─── REVIEWS MANAGEMENT ─────────────────────────────────────
router.get('/reviews', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { status } = req.query;
    const where = status ? `WHERE status = '${db.escape(status).replace(/'/g,"''")}'` : '';
    const [rows] = await db.query(`SELECT * FROM reviews ${status ? 'WHERE status = ?' : ''} ORDER BY created_at DESC`, status ? [status] : []);
    res.json(rows);
  } catch (err) { next(err); }
});

router.put('/reviews/:id', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { status, admin_response, is_featured } = req.body;
    await db.query('UPDATE reviews SET status=?, admin_response=?, is_featured=? WHERE id=?',
      [status, admin_response, is_featured ? 1 : 0, req.params.id]);
    res.json({ message: 'Review updated' });
  } catch (err) { next(err); }
});

// ─── ADMIN PROFILE ──────────────────────────────────────────
router.get('/profile', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, avatar_path, last_login, created_at FROM admins WHERE id = ?',
      [req.admin.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Admin not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/profile', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { name, email } = req.body;
    if (!name && !email) return res.status(400).json({ error: 'name or email required' });
    const updates = []; const vals = [];
    if (name) { updates.push('name = ?'); vals.push(name.trim()); }
    if (email) {
      const [existing] = await db.query(
        'SELECT id FROM admins WHERE email = ? AND id != ?', [email, req.admin.id]
      );
      if (existing.length) return res.status(409).json({ error: 'Email already in use' });
      updates.push('email = ?'); vals.push(email.trim());
    }
    await db.query(`UPDATE admins SET ${updates.join(', ')} WHERE id = ?`, [...vals, req.admin.id]);
    res.json({ message: 'Profile updated successfully' });
  } catch (err) { next(err); }
});

router.put('/profile/password', async (req, res, next) => {
  const db = req.app.locals.db;
  const bcrypt = require('bcryptjs');
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password)
      return res.status(400).json({ error: 'Both current and new password are required' });
    if (new_password.length < 8)
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    const [rows] = await db.query('SELECT password FROM admins WHERE id = ?', [req.admin.id]);
    if (!rows.length) return res.status(404).json({ error: 'Admin not found' });
    let hash = rows[0].password;
    if (hash.startsWith('SETUP:')) {
      if (current_password !== hash.slice(6))
        return res.status(400).json({ error: 'Current password is incorrect' });
    } else {
      if (hash.startsWith('$2y$')) hash = '$2b$' + hash.slice(4);
      const valid = await bcrypt.compare(current_password, hash);
      if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
    }
    const newHash = await bcrypt.hash(new_password, 12);
    await db.query('UPDATE admins SET password = ? WHERE id = ?', [newHash, req.admin.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) { next(err); }
});

// ─── NOTIFICATIONS ──────────────────────────────────────────
router.get('/notifications', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(
      `SELECT * FROM notifications WHERE notifiable_type = 'admin' ORDER BY created_at DESC LIMIT 50`);
    res.json(rows);
  } catch (err) { next(err); }
});

router.put('/notifications/read-all', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    await db.query(`UPDATE notifications SET read_at = NOW() WHERE notifiable_type = 'admin' AND read_at IS NULL`);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) { next(err); }
});


// ─── HOMEPAGE CONTENT ────────────────────────────────────────
router.get('/homepage-content', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query("SELECT * FROM custom_pages WHERE slug='__homepage__' LIMIT 1");
    res.json(rows[0] || { slug: '__homepage__', content: '{}' });
  } catch (err) { next(err); }
});

router.put('/homepage-content', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { content } = req.body;
    const [ex] = await db.query("SELECT id FROM custom_pages WHERE slug='__homepage__'");
    if (ex.length) {
      await db.query("UPDATE custom_pages SET content=?,updated_at=NOW() WHERE slug='__homepage__'", [content]);
    } else {
      await db.query(
        "INSERT INTO custom_pages (title,slug,content,is_active,created_by) VALUES ('Homepage','__homepage__',?,1,?)",
        [content, req.admin.id]);
    }
    res.json({ message: 'Saved' });
  } catch (err) { next(err); }
});

module.exports = router;

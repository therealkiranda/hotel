// ============================================================
// src/routes/rooms.js — Rooms API
// ============================================================
const express = require('express');
const { verifyAdmin, optionalAuth } = require('../middleware/auth');
const router = express.Router();

// GET /api/rooms — list all categories with availability
router.get('/', optionalAuth, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { check_in, check_out, adults = 1, children = 0 } = req.query;
    let query = `
      SELECT rc.*, 
             GROUP_CONCAT(ri.image_path ORDER BY ri.sort_order SEPARATOR '|||') AS images,
             GROUP_CONCAT(ri.alt_text ORDER BY ri.sort_order SEPARATOR '|||') AS image_alts
      FROM room_categories rc
      LEFT JOIN room_images ri ON ri.room_category_id = rc.id
      WHERE rc.is_active = 1 AND rc.max_adults >= ?`;
    const params = [parseInt(adults)];

    const [rows] = await db.query(query + ' GROUP BY rc.id ORDER BY rc.sort_order, rc.base_price', params);

    // Check availability if dates given
    let availabilityMap = {};
    if (check_in && check_out) {
      const [avail] = await db.query(`
        SELECT r.category_id,
               COUNT(r.id) AS total_rooms,
               COUNT(r.id) - COUNT(b.id) AS available_rooms
        FROM rooms r
        LEFT JOIN bookings b ON b.room_id = r.id
          AND b.status NOT IN ('cancelled','no_show')
          AND b.check_in_date < ? AND b.check_out_date > ?
        WHERE r.is_active = 1
        GROUP BY r.category_id`, [check_out, check_in]);
      avail.forEach(a => { availabilityMap[a.category_id] = a; });
    }

    const result = rows.map(r => ({
      ...r,
      amenities: tryParse(r.amenities, []),
      highlights: tryParse(r.highlights, []),
      images: r.images ? r.images.split('|||') : [],
      image_alts: r.image_alts ? r.image_alts.split('|||') : [],
      availability: availabilityMap[r.id] || null,
    }));

    res.json(result);
  } catch (err) { next(err); }
});

// GET /api/rooms/:slug
router.get('/:slug', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(
      `SELECT rc.*, GROUP_CONCAT(ri.image_path ORDER BY ri.sort_order SEPARATOR '|||') AS images
       FROM room_categories rc
       LEFT JOIN room_images ri ON ri.room_category_id = rc.id
       WHERE rc.slug = ? AND rc.is_active = 1 GROUP BY rc.id`, [req.params.slug]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Room category not found' });
    const r = rows[0];
    res.json({ ...r, amenities: tryParse(r.amenities, []), highlights: tryParse(r.highlights, []), images: r.images?.split('|||') || [] });
  } catch (err) { next(err); }
});

// GET /api/rooms/:id/availability — get available dates
router.get('/:id/availability', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { year, month } = req.query;
    const startDate = `${year || new Date().getFullYear()}-${String(month || new Date().getMonth() + 1).padStart(2,'0')}-01`;
    const endDate = new Date(startDate); endDate.setMonth(endDate.getMonth() + 2);

    const [bookings] = await db.query(`
      SELECT b.check_in_date, b.check_out_date, COUNT(*) as booked_count,
             (SELECT COUNT(*) FROM rooms WHERE category_id = ? AND is_active = 1) as total_rooms
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE r.category_id = ? AND b.status NOT IN ('cancelled','no_show')
        AND b.check_out_date >= ? AND b.check_in_date <= ?
      GROUP BY b.check_in_date, b.check_out_date`,
      [req.params.id, req.params.id, startDate, endDate.toISOString().split('T')[0]]
    );
    res.json({ bookings, start: startDate, end: endDate.toISOString().split('T')[0] });
  } catch (err) { next(err); }
});

// ADMIN: POST /api/rooms (create category)
router.post('/', verifyAdmin, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { name, slug, description, short_description, base_price, weekend_price, peak_price,
            max_adults, max_children, max_occupancy, size_sqm, bed_type, bed_count, amenities, highlights } = req.body;
    const [result] = await db.query(
      `INSERT INTO room_categories (name, slug, description, short_description, base_price, weekend_price, peak_price,
        max_adults, max_children, max_occupancy, size_sqm, bed_type, bed_count, amenities, highlights)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [name, slug, description, short_description, base_price, weekend_price, peak_price,
       max_adults, max_children, max_occupancy, size_sqm, bed_type, bed_count,
       JSON.stringify(amenities || []), JSON.stringify(highlights || [])]
    );
    res.status(201).json({ id: result.insertId, message: 'Room category created' });
  } catch (err) { next(err); }
});

// ADMIN: PUT /api/rooms/:id
router.put('/:id', verifyAdmin, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const fields = ['name','slug','description','short_description','base_price','weekend_price','peak_price',
                    'max_adults','max_children','max_occupancy','size_sqm','bed_type','bed_count','is_active'];
    const updates = []; const vals = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); vals.push(req.body[f]); } });
    if (req.body.amenities) { updates.push('amenities = ?'); vals.push(JSON.stringify(req.body.amenities)); }
    if (req.body.highlights) { updates.push('highlights = ?'); vals.push(JSON.stringify(req.body.highlights)); }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    await db.query(`UPDATE room_categories SET ${updates.join(',')} WHERE id = ?`, [...vals, req.params.id]);
    res.json({ message: 'Room category updated' });
  } catch (err) { next(err); }
});

function tryParse(val, fallback) { try { return JSON.parse(val); } catch { return fallback; } }
module.exports = router;

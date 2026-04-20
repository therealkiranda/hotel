// ============================================================
// src/routes/roomCategories.js
// Full CRUD for room categories + amenity type management
// ============================================================
const express = require('express');
const { verifyAdmin } = require('../middleware/auth');
const router = express.Router();

const tryParse = (v, d) => { try { return JSON.parse(v); } catch { return d; } };

// ─── GET /api/room-categories ────────────────────────────────
router.get('/', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [cats] = await db.query(`
      SELECT rc.*,
             GROUP_CONCAT(ri.image_path ORDER BY ri.sort_order SEPARATOR '|||') AS images
      FROM room_categories rc
      LEFT JOIN room_images ri ON ri.room_category_id = rc.id
      WHERE rc.is_active = 1
      GROUP BY rc.id ORDER BY rc.sort_order, rc.base_price`);

    // For each category, get linked amenity type IDs
    const [amenityLinks] = await db.query(`
      SELECT rca.room_category_id, rca.amenity_type_id,
             rat.name, rat.icon, rat.category AS amenity_category
      FROM room_category_amenities rca
      JOIN room_amenity_types rat ON rca.amenity_type_id = rat.id`);

    const amenityMap = {};
    amenityLinks.forEach(a => {
      if (!amenityMap[a.room_category_id]) amenityMap[a.room_category_id] = [];
      amenityMap[a.room_category_id].push(a);
    });

    res.json(cats.map(c => ({
      ...c,
      amenities:      tryParse(c.amenities, []),
      highlights:     tryParse(c.highlights, []),
      images:         c.images ? c.images.split('|||') : [],
      amenity_types:  amenityMap[c.id] || [],
    })));
  } catch (err) { next(err); }
});

// ─── GET /api/room-categories/:id ───────────────────────────
router.get('/:id', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(
      `SELECT rc.*, GROUP_CONCAT(ri.image_path ORDER BY ri.sort_order SEPARATOR '|||') AS images
       FROM room_categories rc
       LEFT JOIN room_images ri ON ri.room_category_id = rc.id
       WHERE rc.id = ? GROUP BY rc.id`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    const [amenityLinks] = await db.query(`
      SELECT rat.* FROM room_category_amenities rca
      JOIN room_amenity_types rat ON rca.amenity_type_id = rat.id
      WHERE rca.room_category_id = ? ORDER BY rat.sort_order`, [req.params.id]);

    const r = rows[0];
    res.json({
      ...r,
      amenities:     tryParse(r.amenities, []),
      highlights:    tryParse(r.highlights, []),
      images:        r.images ? r.images.split('|||') : [],
      amenity_types: amenityLinks,
    });
  } catch (err) { next(err); }
});

// ─── POST /api/room-categories ───────────────────────────────
router.post('/', verifyAdmin, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const {
      name, slug, description, short_description, base_price,
      weekend_price, peak_price, max_adults, max_children, max_occupancy,
      size_sqm, bed_type, bed_count, view_type, floor_range,
      amenities, highlights, sort_order, amenity_type_ids,
      expedia_rate_plan_id, booking_com_room_type_id,
    } = req.body;
    if (!name || !slug || !base_price)
      return res.status(400).json({ error: 'name, slug, base_price required' });

    const [result] = await db.query(`
      INSERT INTO room_categories (name, slug, description, short_description,
        base_price, weekend_price, peak_price, max_adults, max_children, max_occupancy,
        size_sqm, bed_type, bed_count, view_type, floor_range,
        amenities, highlights, sort_order,
        expedia_rate_plan_id, booking_com_room_type_id)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [name, slug, description, short_description,
       base_price, weekend_price || null, peak_price || null,
       max_adults || 2, max_children || 1, max_occupancy || 2,
       size_sqm || null, bed_type || null, bed_count || 1,
       view_type || null, floor_range || null,
       JSON.stringify(amenities || []),
       JSON.stringify(highlights || []),
       sort_order || 0,
       expedia_rate_plan_id || null, booking_com_room_type_id || null]);

    const newId = result.insertId;

    // Link amenity types
    if (amenity_type_ids?.length) {
      for (const aid of amenity_type_ids) {
        await db.query(
          'INSERT IGNORE INTO room_category_amenities (room_category_id, amenity_type_id) VALUES (?,?)',
          [newId, aid]);
      }
    }

    res.status(201).json({ id: newId, message: 'Room category created' });
  } catch (err) { next(err); }
});

// ─── PUT /api/room-categories/:id ───────────────────────────
router.put('/:id', verifyAdmin, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const scalar = [
      'name','slug','description','short_description','base_price',
      'weekend_price','peak_price','max_adults','max_children','max_occupancy',
      'size_sqm','bed_type','bed_count','view_type','floor_range',
      'sort_order','is_active','expedia_rate_plan_id','booking_com_room_type_id',
    ];
    const updates = []; const vals = [];
    scalar.forEach(f => {
      if (req.body[f] !== undefined) { updates.push(`${f} = ?`); vals.push(req.body[f]); }
    });
    if (req.body.amenities  !== undefined) { updates.push('amenities = ?');  vals.push(JSON.stringify(req.body.amenities)); }
    if (req.body.highlights !== undefined) { updates.push('highlights = ?'); vals.push(JSON.stringify(req.body.highlights)); }

    if (updates.length) {
      await db.query(`UPDATE room_categories SET ${updates.join(',')} WHERE id = ?`,
        [...vals, req.params.id]);
    }

    // Update amenity type links if provided
    if (req.body.amenity_type_ids !== undefined) {
      await db.query('DELETE FROM room_category_amenities WHERE room_category_id = ?', [req.params.id]);
      for (const aid of (req.body.amenity_type_ids || [])) {
        await db.query(
          'INSERT IGNORE INTO room_category_amenities (room_category_id, amenity_type_id) VALUES (?,?)',
          [req.params.id, aid]);
      }
    }

    res.json({ message: 'Room category updated' });
  } catch (err) { next(err); }
});

// ─── DELETE /api/room-categories/:id ────────────────────────
router.delete('/:id', verifyAdmin, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    await db.query('UPDATE room_categories SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Room category deactivated' });
  } catch (err) { next(err); }
});

// ─── GET /api/room-categories/amenity-types/all ─────────────
router.get('/amenity-types/all', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(
      'SELECT * FROM room_amenity_types WHERE is_active = 1 ORDER BY category, sort_order');
    // Group by category
    const grouped = {};
    rows.forEach(r => {
      if (!grouped[r.category]) grouped[r.category] = [];
      grouped[r.category].push(r);
    });
    res.json({ flat: rows, grouped });
  } catch (err) { next(err); }
});

// ─── Individual Room CRUD ────────────────────────────────────
router.get('/:categoryId/rooms', verifyAdmin, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(
      'SELECT * FROM rooms WHERE category_id = ? ORDER BY floor, room_number',
      [req.params.categoryId]);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/:categoryId/rooms', verifyAdmin, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { room_number, floor, wing, current_price, notes } = req.body;
    if (!room_number || !floor) return res.status(400).json({ error: 'room_number and floor required' });
    const [r] = await db.query(
      'INSERT INTO rooms (room_number, category_id, floor, wing, current_price, notes) VALUES (?,?,?,?,?,?)',
      [room_number, req.params.categoryId, floor, wing || null, current_price || null, notes || null]);
    res.status(201).json({ id: r.insertId });
  } catch (err) { next(err); }
});

router.put('/:categoryId/rooms/:roomId', verifyAdmin, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const allowed = ['room_number','floor','wing','current_price','status',
                     'housekeeping_status','notes','is_active',
                     'expedia_room_id','booking_com_room_id'];
    const updates = []; const vals = [];
    allowed.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); vals.push(req.body[f]); } });
    if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
    await db.query(`UPDATE rooms SET ${updates.join(',')} WHERE id = ? AND category_id = ?`,
      [...vals, req.params.roomId, req.params.categoryId]);
    res.json({ message: 'Room updated' });
  } catch (err) { next(err); }
});

router.delete('/:categoryId/rooms/:roomId', verifyAdmin, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    await db.query('UPDATE rooms SET is_active = 0 WHERE id = ?', [req.params.roomId]);
    res.json({ message: 'Room deactivated' });
  } catch (err) { next(err); }
});

module.exports = router;

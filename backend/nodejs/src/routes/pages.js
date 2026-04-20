// ============================================================
// src/routes/pages.js — Custom Page Builder API
// Author: Kiran Khadka — © 2026 Kiran Khadka
// ============================================================
const express = require('express');
const { verifyAdmin } = require('../middleware/auth');
const router = express.Router();

const toSlug = s => s.toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');

// PUBLIC: GET /api/pages/public/:slug
router.get('/public/:slug', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(
      `SELECT id,title,slug,content,meta_title,meta_description,meta_keywords,og_title,og_description,updated_at
       FROM custom_pages WHERE slug=? AND is_active=1`, [req.params.slug]);
    if (!rows.length) return res.status(404).json({ error:'Page not found' });
    res.json(rows[0]);
  } catch(e){next(e);}
});

// ADMIN: GET /api/pages
router.get('/', verifyAdmin, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(`SELECT id,title,slug,is_active,created_at,updated_at FROM custom_pages ORDER BY created_at DESC`);
    res.json(rows);
  } catch(e){next(e);}
});

// ADMIN: GET /api/pages/:id
router.get('/:id', verifyAdmin, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query('SELECT * FROM custom_pages WHERE id=?',[req.params.id]);
    if (!rows.length) return res.status(404).json({error:'Not found'});
    res.json(rows[0]);
  } catch(e){next(e);}
});

// ADMIN: POST /api/pages
router.post('/', verifyAdmin, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const {title,slug,content,meta_title,meta_description,meta_keywords,og_title,og_description,is_active} = req.body;
    if (!title||!slug) return res.status(400).json({error:'title and slug required'});
    const s = toSlug(slug);
    const [ex] = await db.query('SELECT id FROM custom_pages WHERE slug=?',[s]);
    if (ex.length) return res.status(409).json({error:'Slug already exists'});
    const [r] = await db.query(
      `INSERT INTO custom_pages (title,slug,content,meta_title,meta_description,meta_keywords,og_title,og_description,is_active,created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [title,s,content||'',meta_title||title,meta_description||'',meta_keywords||'',og_title||title,og_description||'',is_active?1:0,req.admin.id]);
    res.status(201).json({id:r.insertId,slug:s});
  } catch(e){next(e);}
});

// ADMIN: PUT /api/pages/:id
router.put('/:id', verifyAdmin, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const {title,slug,content,meta_title,meta_description,meta_keywords,og_title,og_description,is_active} = req.body;
    const s = slug ? toSlug(slug) : null;
    if (s) {
      const [ex] = await db.query('SELECT id FROM custom_pages WHERE slug=? AND id!=?',[s,req.params.id]);
      if (ex.length) return res.status(409).json({error:'Slug already in use'});
    }
    await db.query(
      `UPDATE custom_pages SET title=?,slug=COALESCE(?,slug),content=?,meta_title=?,meta_description=?,
       meta_keywords=?,og_title=?,og_description=?,is_active=?,updated_at=NOW() WHERE id=?`,
      [title,s,content||'',meta_title||title,meta_description||'',meta_keywords||'',og_title||title,og_description||'',is_active?1:0,req.params.id]);
    res.json({message:'Updated'});
  } catch(e){next(e);}
});

// ADMIN: DELETE /api/pages/:id
router.delete('/:id', verifyAdmin, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    await db.query('DELETE FROM custom_pages WHERE id=?',[req.params.id]);
    res.json({message:'Deleted'});
  } catch(e){next(e);}
});

module.exports = router;

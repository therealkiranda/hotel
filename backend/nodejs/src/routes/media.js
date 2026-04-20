// ============================================================
// src/routes/media.js — File Upload Management
// Handles: QR codes, hero images/videos, blog images, room images
// ============================================================
const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { verifyAdmin } = require('../middleware/auth');
const router = express.Router();

const ALLOWED_IMAGES = ['.jpg','.jpeg','.png','.webp','.gif'];
const ALLOWED_VIDEOS = ['.mp4','.webm','.mov','.avi'];
const ALLOWED_DOCS   = ['.pdf'];
const ALL_ALLOWED    = [...ALLOWED_IMAGES, ...ALLOWED_VIDEOS, ...ALLOWED_DOCS];

const CATEGORY_DIRS = {
  hero_video:   'uploads/hero',
  hero_image:   'uploads/hero',
  qr_code:      'uploads/qr-codes',
  room_image:   'uploads/rooms',
  blog_image:   'uploads/blog',
  logo:         'uploads/branding',
  general:      'uploads/general',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const cat = req.body.category || req.query.category || 'general';
    const dir = path.join(process.cwd(), CATEGORY_DIRS[cat] || 'uploads/general');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 40);
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALL_ALLOWED.includes(ext)) cb(null, true);
  else cb(new Error(`File type ${ext} not allowed. Use: ${ALL_ALLOWED.join(', ')}`), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB (for videos)
});

// ─── POST /api/media/upload ──────────────────────────────────
router.post('/upload', verifyAdmin, upload.single('file'), async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { category = 'general', alt_text, post_id } = req.body;
    const filePath = req.file.path.replace(/\\/g, '/').replace(process.cwd() + '/', '');
    const ext      = path.extname(req.file.originalname).toLowerCase();
    const fileType = ALLOWED_VIDEOS.includes(ext) ? 'video' : ALLOWED_IMAGES.includes(ext) ? 'image' : 'document';

    // Save to media_uploads table
    const [result] = await db.query(`
      INSERT INTO media_uploads (file_name, original_name, file_path, file_type, file_size, mime_type, category, uploaded_by)
      VALUES (?,?,?,?,?,?,?,?)`,
      [req.file.filename, req.file.originalname, filePath, fileType,
       req.file.size, req.file.mimetype, category, req.admin.id]);

    // Auto-update hotel_info if it's a QR or hero upload
    if (category === 'qr_code') {
      await db.query('UPDATE hotel_info SET qr_code_image_path = ? WHERE id = 1', [filePath]);
    } else if (category === 'hero_image') {
      await db.query('UPDATE theme_settings SET hero_video_url = ? WHERE id = 1', [filePath]);
    } else if (category === 'hero_video') {
      await db.query('UPDATE theme_settings SET hero_video_url = ?, hero_type = "video" WHERE id = 1', [filePath]);
    } else if (category === 'logo') {
      await db.query('UPDATE hotel_info SET logo_path = ? WHERE id = 1', [filePath]);
    }

    // If blog image, link to post
    if (category === 'blog_image' && post_id) {
      await db.query(
        'INSERT INTO blog_images (post_id, file_path, alt_text) VALUES (?,?,?)',
        [post_id, filePath, alt_text || req.file.originalname]);
    }

    const baseUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 4000}`;
    res.status(201).json({
      id:            result.insertId,
      file_path:     filePath,
      url:           `${baseUrl}/${filePath}`,
      file_name:     req.file.filename,
      original_name: req.file.originalname,
      file_type:     fileType,
      mime_type:     req.file.mimetype,
      file_size:     req.file.size,
      category,
    });
  } catch (err) { next(err); }
});

// ─── GET /api/media ──────────────────────────────────────────
router.get('/', verifyAdmin, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { category, page = 1, per_page = 30 } = req.query;
    const limit  = Math.min(parseInt(per_page), 100);
    const offset = (parseInt(page) - 1) * limit;
    const where  = category ? 'WHERE category = ?' : '';
    const params = category ? [category] : [];
    const [rows] = await db.query(
      `SELECT m.*, a.name AS uploader_name FROM media_uploads m
       LEFT JOIN admins a ON m.uploaded_by = a.id
       ${where} ORDER BY m.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]);
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM media_uploads ${where}`, params);

    const baseUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 4000}`;
    res.json({
      data: rows.map(r => ({ ...r, url: `${baseUrl}/${r.file_path}` })),
      total,
    });
  } catch (err) { next(err); }
});

// ─── DELETE /api/media/:id ───────────────────────────────────
router.delete('/:id', verifyAdmin, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query('SELECT * FROM media_uploads WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'File not found' });
    // Delete from disk
    const fullPath = path.join(process.cwd(), rows[0].file_path);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    await db.query('DELETE FROM media_uploads WHERE id = ?', [req.params.id]);
    res.json({ message: 'File deleted' });
  } catch (err) { next(err); }
});

// ─── GET /api/media/blog/:postId ────────────────────────────
router.get('/blog/:postId', verifyAdmin, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const baseUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 4000}`;
    const [rows] = await db.query(
      'SELECT *, CONCAT(?, "/", file_path) AS url FROM blog_images WHERE post_id = ? ORDER BY created_at',
      [baseUrl, req.params.postId]);
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;

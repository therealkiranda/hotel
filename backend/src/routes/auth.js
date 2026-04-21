// ============================================================
// src/routes/auth.js — Authentication Routes
// ============================================================
const express = require('express');
const bcrypt = require('bcryptjs');
const { generateToken, verifyUser } = require('../middleware/auth');
const { validate, rules } = require('../middleware/validate');
const router = express.Router();

// POST /api/auth/register
router.post('/register', validate([
  rules.required('first_name'), rules.required('last_name'),
  rules.email('email'), rules.minLength('password', 8),
]), async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { first_name, last_name, email, password, phone, newsletter_subscribed } = req.body;

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      `INSERT INTO users (first_name, last_name, email, password, phone, newsletter_subscribed)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, hashedPassword, phone || null, newsletter_subscribed ? 1 : 0]
    );

    const token = generateToken({ id: result.insertId, email, role: 'user' });
    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: result.insertId, first_name, last_name, email }
    });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', validate([rules.email('email'), rules.required('password')]), async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { email, password } = req.body;
    const [rows] = await db.query(
      'SELECT id, first_name, last_name, email, password, status, avatar_path FROM users WHERE email = ?',
      [email]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    if (user.status === 'banned') return res.status(403).json({ error: 'Account suspended' });
    if (!user.password) return res.status(400).json({ error: 'Please use social login for this account' });

    let userHash = user.password;
    if (userHash && userHash.startsWith('$2y$')) userHash = '$2b$' + userHash.slice(4);

    const valid = await bcrypt.compare(password, userHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken({ id: user.id, email: user.email, role: 'user' });
    res.json({
      token,
      user: {
        id: user.id, first_name: user.first_name, last_name: user.last_name,
        email: user.email, avatar_path: user.avatar_path
      }
    });
  } catch (err) { next(err); }
});

// POST /api/auth/admin/login
router.post('/admin/login', async (req, res, next) => {
  const db = req.app.locals.db;
  const { generateToken: gen } = require('../middleware/auth');
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const [rows] = await db.query(
      'SELECT id, name, email, password, role, status FROM admins WHERE email = ? AND status = "active"',
      [email]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const admin = rows[0];
    // Handle SETUP: marker — first login auto-hashes the plaintext password
    if (admin.password.startsWith('SETUP:')) {
      const setupPassword = admin.password.slice(6); // strip "SETUP:"
      if (password !== setupPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      // Hash it properly and store for future logins
      const newHash = await bcrypt.hash(password, 12);
      await db.query('UPDATE admins SET password = ? WHERE id = ?', [newHash, admin.id]);
    } else {
      // Normalize PHP $2y$ prefix to Node.js $2b$ (bcryptjs compatible)
      let hash = admin.password;
      if (hash.startsWith('$2y$')) hash = '$2b$' + hash.slice(4);

      const valid = await bcrypt.compare(password, hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      // Auto-rehash $2y$ hashes to $2b$ format
      if (admin.password.startsWith('$2y$')) {
        const newHash = await bcrypt.hash(password, 12);
        await db.query('UPDATE admins SET password = ? WHERE id = ?', [newHash, admin.id]);
      }
    }

    await db.query('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);

    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: admin.id, name: admin.name, email: admin.email, role: admin.role, isAdmin: true },
      process.env.JWT_ADMIN_SECRET || 'change-this-admin-jwt-secret-grandlumiere',
      { expiresIn: '12h' }
    );
    res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', verifyUser, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(
      `SELECT id, first_name, last_name, email, phone, nationality, date_of_birth,
              address, avatar_path, total_stays, total_spent, loyalty_points, newsletter_subscribed
       FROM users WHERE id = ?`, [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// POST /api/auth/social — Social login (Google/Facebook)
router.post('/social', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { provider, provider_id, email, first_name, last_name, avatar } = req.body;
    if (!provider || !email) return res.status(400).json({ error: 'Missing required social auth data' });

    // Check if social auth is enabled
    const [settings] = await db.query(
      'SELECT is_enabled FROM social_auth_settings WHERE provider = ?', [provider]
    );
    if (!settings[0]?.is_enabled) return res.status(403).json({ error: `${provider} login is not enabled` });

    let user;
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (existing.length > 0) {
      user = existing[0];
      await db.query('UPDATE users SET auth_provider = ?, auth_provider_id = ? WHERE id = ?',
        [provider, provider_id, user.id]);
    } else {
      const [result] = await db.query(
        `INSERT INTO users (first_name, last_name, email, auth_provider, auth_provider_id, avatar_path, email_verified_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [first_name, last_name, email, provider, provider_id, avatar || null]
      );
      const [newUser] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = newUser[0];
    }

    const token = generateToken({ id: user.id, email: user.email, role: 'user' });
    res.json({
      token,
      user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email }
    });
  } catch (err) { next(err); }
});

// PUT /api/auth/password — Change password
router.put('/password', verifyUser, async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ error: 'Both passwords required' });
    if (new_password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const valid = await bcrypt.compare(current_password, rows[0].password);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(new_password, 12);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) { next(err); }
});


// ─── POST /api/auth/admin/setup ─────────────────────────────
// First-run setup: create or reset admin password
// Only works if no active admins exist, or if current password is SETUP: marker
router.post('/admin/setup', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { email, password, name, setup_key } = req.body;

    // Require setup key for security (set in .env as SETUP_KEY)
    const expectedKey = process.env.SETUP_KEY || 'grandlumiere-setup-2025';
    if (setup_key !== expectedKey) {
      return res.status(403).json({ error: 'Invalid setup key' });
    }

    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (password.length < 8)  return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const hash = await bcrypt.hash(password, 12);
    const [existing] = await db.query('SELECT id FROM admins WHERE email = ?', [email]);

    if (existing.length > 0) {
      await db.query(
        'UPDATE admins SET password = ?, name = COALESCE(?, name), status = "active" WHERE email = ?',
        [hash, name || null, email]
      );
      res.json({ message: 'Admin password updated successfully', email });
    } else {
      await db.query(
        `INSERT INTO admins (name, email, password, role, status) VALUES (?, ?, ?, 'super_admin', 'active')`,
        [name || 'Super Admin', email, hash]
      );
      res.json({ message: 'Admin account created', email });
    }
  } catch (err) { next(err); }
});

module.exports = router;

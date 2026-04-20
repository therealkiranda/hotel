// ============================================================
// src/middleware/auth.js — JWT Authentication Middleware
// ============================================================
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production-jwt-secret-grandlumiere';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || 'change-this-admin-jwt-secret-grandlumiere';

function generateToken(payload, isAdmin = false) {
  return jwt.sign(payload, isAdmin ? JWT_ADMIN_SECRET : JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function verifyUser(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const token = auth.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function verifyAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, JWT_ADMIN_SECRET);
    if (!decoded.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired admin token' });
  }
}

function optionalAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    } catch { /* ignore */ }
  }
  next();
}

module.exports = { generateToken, verifyUser, verifyAdmin, optionalAuth, JWT_SECRET, JWT_ADMIN_SECRET };

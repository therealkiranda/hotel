// ============================================================
// src/middleware/errorHandler.js
// ============================================================
function errorHandler(err, req, res, next) {
  console.error('[API Error]', err.message, err.stack);
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Duplicate entry' });
  if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Invalid reference' });
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = { errorHandler };

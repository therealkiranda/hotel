// ============================================================
// src/middleware/validate.js — Input validation middleware
// ============================================================
const { body, validationResult } = require('express-validator');

const rules = {
  required: (field) => body(field).notEmpty().withMessage(`${field} is required`),
  email: (field) => body(field).isEmail().normalizeEmail().withMessage('Valid email required'),
  minLength: (field, len) => body(field).isLength({ min: len }).withMessage(`${field} must be at least ${len} chars`),
  maxLength: (field, len) => body(field).isLength({ max: len }).withMessage(`${field} too long`),
  optional: (field) => body(field).optional(),
};

function validate(validations) {
  return async (req, res, next) => {
    for (const v of validations) await v.run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  };
}

module.exports = { validate, rules };

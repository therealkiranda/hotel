// ============================================================
// src/routes/hr.js — HR Module API
// Covers: Employees, Departments, Attendance, Leave,
//         Payroll, Performance Reviews, Training, Announcements
// ============================================================
const express = require('express');
const { verifyAdmin } = require('../middleware/auth');
const router = express.Router();

router.use(verifyAdmin);

// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [[summary]] = await db.query('SELECT * FROM hr_summary');
    const [byDept] = await db.query(`
      SELECT d.name AS department, d.code,
             COUNT(e.id) AS headcount,
             SUM(CASE WHEN e.employment_type = 'full_time' THEN 1 ELSE 0 END) AS full_time,
             SUM(CASE WHEN e.employment_type = 'part_time' THEN 1 ELSE 0 END) AS part_time,
             AVG(e.base_salary) AS avg_salary
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id AND e.employment_status = 'active'
      WHERE d.is_active = 1
      GROUP BY d.id, d.name, d.code ORDER BY d.name`);
    const [recentHires] = await db.query(`
      SELECT e.id, e.employee_id, e.first_name, e.last_name, e.job_title,
             d.name AS department, e.hire_date, e.employment_type
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY e.hire_date DESC LIMIT 5`);
    const [pendingLeaves] = await db.query(`
      SELECT lr.id, e.first_name, e.last_name, lt.name AS leave_type,
             lr.start_date, lr.end_date, lr.days_requested, lr.created_at
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      WHERE lr.status = 'pending' ORDER BY lr.created_at ASC LIMIT 10`);
    const [upcomingBirthdays] = await db.query(`
      SELECT first_name, last_name, job_title, date_of_birth
      FROM employees
      WHERE employment_status = 'active'
        AND DATE_FORMAT(date_of_birth,'%m-%d') BETWEEN
            DATE_FORMAT(NOW(),'%m-%d') AND
            DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 30 DAY),'%m-%d')
      ORDER BY DATE_FORMAT(date_of_birth,'%m-%d') LIMIT 5`);

    res.json({ summary, byDept, recentHires, pendingLeaves, upcomingBirthdays });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// DEPARTMENTS
// ─────────────────────────────────────────────────────────────
router.get('/departments', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(`
      SELECT d.*,
             COUNT(e.id) AS headcount,
             mgr.first_name AS manager_first_name, mgr.last_name AS manager_last_name
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id AND e.employment_status = 'active'
      LEFT JOIN employees mgr ON d.manager_employee_id = mgr.id
      WHERE d.is_active = 1
      GROUP BY d.id ORDER BY d.name`);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/departments', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { name, code, description, location, budget } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'Name and code required' });
    const [r] = await db.query(
      'INSERT INTO departments (name, code, description, location, budget) VALUES (?,?,?,?,?)',
      [name, code.toUpperCase(), description || null, location || null, budget || null]);
    res.status(201).json({ id: r.insertId });
  } catch (err) { next(err); }
});

router.put('/departments/:id', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const fields = ['name','code','description','location','budget','manager_employee_id','is_active'];
    const updates = []; const vals = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); vals.push(req.body[f]); } });
    await db.query(`UPDATE departments SET ${updates.join(',')} WHERE id = ?`, [...vals, req.params.id]);
    res.json({ message: 'Department updated' });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// EMPLOYEES
// ─────────────────────────────────────────────────────────────
router.get('/employees', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { page = 1, per_page = 25, search, dept, status, employment_type } = req.query;
    const limit = Math.min(parseInt(per_page), 100);
    const offset = (parseInt(page) - 1) * limit;
    const conditions = ['1=1'];
    const params = [];
    if (search) {
      conditions.push('(e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_id LIKE ? OR e.email LIKE ?)');
      ['%'+search+'%','%'+search+'%','%'+search+'%','%'+search+'%'].forEach(p => params.push(p));
    }
    if (dept) { conditions.push('e.department_id = ?'); params.push(dept); }
    if (status) { conditions.push('e.employment_status = ?'); params.push(status); }
    if (employment_type) { conditions.push('e.employment_type = ?'); params.push(employment_type); }

    const where = 'WHERE ' + conditions.join(' AND ');
    const [rows] = await db.query(`
      SELECT e.id, e.employee_id, e.first_name, e.last_name, e.email, e.phone,
             e.job_title, e.job_level, e.employment_type, e.employment_status,
             e.hire_date, e.base_salary, e.salary_currency, e.avatar_path,
             d.name AS department_name, d.code AS department_code
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      ${where} ORDER BY e.first_name, e.last_name LIMIT ? OFFSET ?`,
      [...params, limit, offset]);
    const [[{total}]] = await db.query(`SELECT COUNT(*) as total FROM employees e ${where}`, params);
    res.json({ data: rows, total, page: parseInt(page), per_page: limit });
  } catch (err) { next(err); }
});

router.get('/employees/:id', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(`
      SELECT e.*, d.name AS department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Employee not found' });
    // Get documents, leave balance summary
    const [docs] = await db.query(
      'SELECT id, document_type, title, expiry_date, created_at FROM employee_documents WHERE employee_id = ?',
      [req.params.id]);
    const [leaveBalance] = await db.query(`
      SELECT lt.name, lb.allocated_days, lb.used_days, lb.carried_forward,
             (lb.allocated_days + lb.carried_forward - lb.used_days) AS remaining
      FROM leave_balances lb
      JOIN leave_types lt ON lb.leave_type_id = lt.id
      WHERE lb.employee_id = ? AND lb.year = YEAR(CURDATE())`, [req.params.id]);
    res.json({ ...rows[0], documents: docs, leave_balance: leaveBalance });
  } catch (err) { next(err); }
});

router.post('/employees', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const required = ['first_name','last_name','email','job_title','hire_date'];
    for (const f of required) {
      if (!req.body[f]) return res.status(400).json({ error: `${f} is required` });
    }
    // Generate employee ID
    const [[{ count }]] = await db.query('SELECT COUNT(*) as count FROM employees');
    const employee_id = `EMP${String(count + 1).padStart(5, '0')}`;

    const fields = ['employee_id','first_name','last_name','email','phone','date_of_birth',
                    'gender','nationality','national_id','passport_number','address',
                    'emergency_contact_name','emergency_contact_phone','emergency_contact_relation',
                    'department_id','job_title','job_level','employment_type','employment_status',
                    'hire_date','probation_end_date','base_salary','salary_currency','pay_frequency',
                    'bank_name','bank_account_number','bank_routing_number','tax_id','notes'];
    const values = { employee_id, ...req.body };
    const cols = fields.filter(f => values[f] !== undefined);
    const vals = cols.map(f => values[f]);

    const [result] = await db.query(
      `INSERT INTO employees (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`, vals);

    // Initialize leave balances for this year
    const [leaveTypes] = await db.query('SELECT id, days_allowed_per_year FROM leave_types WHERE is_active = 1');
    const year = new Date().getFullYear();
    for (const lt of leaveTypes) {
      await db.query(
        'INSERT IGNORE INTO leave_balances (employee_id, leave_type_id, year, allocated_days) VALUES (?,?,?,?)',
        [result.insertId, lt.id, year, lt.days_allowed_per_year]);
    }

    res.status(201).json({ id: result.insertId, employee_id, message: 'Employee created' });
  } catch (err) { next(err); }
});

router.put('/employees/:id', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const allowed = ['first_name','last_name','email','phone','date_of_birth','gender',
                     'nationality','address','emergency_contact_name','emergency_contact_phone',
                     'department_id','job_title','job_level','employment_type','employment_status',
                     'hire_date','termination_date','termination_reason','base_salary',
                     'salary_currency','pay_frequency','bank_name','bank_account_number','notes'];
    const updates = []; const vals = [];
    allowed.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); vals.push(req.body[f]); } });
    if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
    await db.query(`UPDATE employees SET ${updates.join(',')} WHERE id = ?`, [...vals, req.params.id]);
    res.json({ message: 'Employee updated' });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────────────────
router.get('/attendance', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { employee_id, date_from, date_to, dept } = req.query;
    const conditions = ['1=1'];
    const params = [];
    if (employee_id) { conditions.push('a.employee_id = ?'); params.push(employee_id); }
    if (date_from) { conditions.push('a.date >= ?'); params.push(date_from); }
    if (date_to) { conditions.push('a.date <= ?'); params.push(date_to); }
    if (dept) { conditions.push('e.department_id = ?'); params.push(dept); }
    const [rows] = await db.query(`
      SELECT a.*, e.first_name, e.last_name, e.employee_id AS emp_code, d.name AS department
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ${conditions.join(' AND ')} ORDER BY a.date DESC, e.first_name LIMIT 500`,
      params);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/attendance', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { employee_id, date, check_in, check_out, status, break_minutes, notes } = req.body;
    if (!employee_id || !date) return res.status(400).json({ error: 'employee_id and date required' });

    let worked_hours = 0;
    let overtime = 0;
    if (check_in && check_out) {
      const inTime = new Date(`1970-01-01T${check_in}`);
      const outTime = new Date(`1970-01-01T${check_out}`);
      const totalMins = (outTime - inTime) / 60000 - (break_minutes || 0);
      worked_hours = Math.max(0, totalMins / 60);
      overtime = Math.max(0, worked_hours - 8);
    }

    await db.query(`
      INSERT INTO attendance (employee_id, date, check_in, check_out, break_minutes,
        worked_hours, overtime_hours, status, notes)
      VALUES (?,?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE check_in=VALUES(check_in), check_out=VALUES(check_out),
        break_minutes=VALUES(break_minutes), worked_hours=VALUES(worked_hours),
        overtime_hours=VALUES(overtime_hours), status=VALUES(status), notes=VALUES(notes)`,
      [employee_id, date, check_in || null, check_out || null, break_minutes || 0,
       worked_hours.toFixed(2), overtime.toFixed(2), status || 'present', notes || null]);
    res.json({ message: 'Attendance recorded', worked_hours: worked_hours.toFixed(2) });
  } catch (err) { next(err); }
});

// Bulk attendance upload
router.post('/attendance/bulk', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { records } = req.body;
    if (!Array.isArray(records)) return res.status(400).json({ error: 'records array required' });
    let inserted = 0;
    for (const r of records) {
      if (!r.employee_id || !r.date) continue;
      await db.query(`
        INSERT INTO attendance (employee_id, date, check_in, check_out, status, notes)
        VALUES (?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE check_in=VALUES(check_in), check_out=VALUES(check_out), status=VALUES(status)`,
        [r.employee_id, r.date, r.check_in || null, r.check_out || null, r.status || 'present', r.notes || null]);
      inserted++;
    }
    res.json({ message: `${inserted} attendance records saved` });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// LEAVE
// ─────────────────────────────────────────────────────────────
router.get('/leave-requests', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { status, employee_id } = req.query;
    const where = [];
    const params = [];
    if (status) { where.push('lr.status = ?'); params.push(status); }
    if (employee_id) { where.push('lr.employee_id = ?'); params.push(employee_id); }
    const [rows] = await db.query(`
      SELECT lr.*, e.first_name, e.last_name, e.employee_id AS emp_code,
             d.name AS department, lt.name AS leave_type_name, lt.is_paid
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY lr.created_at DESC LIMIT 200`, params);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/leave-requests', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { employee_id, leave_type_id, start_date, end_date, reason } = req.body;
    if (!employee_id || !leave_type_id || !start_date || !end_date)
      return res.status(400).json({ error: 'employee_id, leave_type_id, start_date, end_date required' });
    const days = Math.ceil((new Date(end_date) - new Date(start_date)) / 86400000) + 1;
    const [r] = await db.query(
      `INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, days_requested, reason)
       VALUES (?,?,?,?,?,?)`,
      [employee_id, leave_type_id, start_date, end_date, days, reason || null]);
    res.status(201).json({ id: r.insertId, days_requested: days });
  } catch (err) { next(err); }
});

router.put('/leave-requests/:id/review', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { status, review_notes } = req.body;
    if (!['approved','rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const [rows] = await db.query('SELECT * FROM leave_requests WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Leave request not found' });
    const lr = rows[0];

    await db.query(
      'UPDATE leave_requests SET status=?, reviewed_by=?, reviewed_at=NOW(), review_notes=? WHERE id=?',
      [status, req.admin.id, review_notes || null, req.params.id]);

    // If approved, update leave balance
    if (status === 'approved') {
      await db.query(`
        INSERT INTO leave_balances (employee_id, leave_type_id, year, allocated_days, used_days)
        VALUES (?, ?, YEAR(?), 0, ?)
        ON DUPLICATE KEY UPDATE used_days = used_days + VALUES(used_days)`,
        [lr.employee_id, lr.leave_type_id, lr.start_date, lr.days_requested]);

      // Mark attendance as on_leave for the period
      const current = new Date(lr.start_date);
      const end = new Date(lr.end_date);
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        await db.query(`
          INSERT IGNORE INTO attendance (employee_id, date, status)
          VALUES (?, ?, 'on_leave')`, [lr.employee_id, dateStr]);
        current.setDate(current.getDate() + 1);
      }
    }

    res.json({ message: `Leave request ${status}` });
  } catch (err) { next(err); }
});

router.get('/leave-types', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query('SELECT * FROM leave_types WHERE is_active = 1 ORDER BY name');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/leave-balances/:employeeId', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(`
      SELECT lb.*, lt.name AS leave_type_name, lt.is_paid,
             (lb.allocated_days + lb.carried_forward - lb.used_days) AS remaining
      FROM leave_balances lb
      JOIN leave_types lt ON lb.leave_type_id = lt.id
      WHERE lb.employee_id = ? AND lb.year = YEAR(CURDATE())
      ORDER BY lt.name`, [req.params.employeeId]);
    res.json(rows);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// PAYROLL
// ─────────────────────────────────────────────────────────────
router.get('/payroll', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { status, month, employee_id } = req.query;
    const conditions = ['1=1'];
    const params = [];
    if (status) { conditions.push('p.status = ?'); params.push(status); }
    if (month) { conditions.push('DATE_FORMAT(p.pay_period_start, "%Y-%m") = ?'); params.push(month); }
    if (employee_id) { conditions.push('p.employee_id = ?'); params.push(employee_id); }
    const [rows] = await db.query(`
      SELECT p.*, e.first_name, e.last_name, e.employee_id AS emp_code,
             d.name AS department, e.bank_name, e.bank_account_number
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ${conditions.join(' AND ')} ORDER BY p.pay_period_start DESC, e.first_name LIMIT 500`,
      params);
    const [[totals]] = await db.query(`
      SELECT SUM(gross_salary) AS total_gross, SUM(net_salary) AS total_net,
             SUM(tax_deduction) AS total_tax, COUNT(*) AS count
      FROM payroll p WHERE ${conditions.join(' AND ')}`, params);
    res.json({ data: rows, totals });
  } catch (err) { next(err); }
});

router.post('/payroll', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { employee_id, pay_period_start, pay_period_end, pay_date,
            overtime_pay, bonus, allowances, tax_deduction,
            insurance_deduction, other_deductions, notes } = req.body;
    if (!employee_id || !pay_period_start || !pay_period_end)
      return res.status(400).json({ error: 'employee_id, pay_period_start, pay_period_end required' });

    const [emp] = await db.query('SELECT base_salary, salary_currency FROM employees WHERE id = ?', [employee_id]);
    if (!emp.length) return res.status(404).json({ error: 'Employee not found' });

    const basic = parseFloat(emp[0].base_salary || 0);
    const gross = basic + parseFloat(overtime_pay||0) + parseFloat(bonus||0) + parseFloat(allowances||0);
    const deductions = parseFloat(tax_deduction||0) + parseFloat(insurance_deduction||0) + parseFloat(other_deductions||0);
    const net = gross - deductions;

    const [r] = await db.query(`
      INSERT INTO payroll (employee_id, pay_period_start, pay_period_end, pay_date,
        basic_salary, overtime_pay, bonus, allowances, gross_salary,
        tax_deduction, insurance_deduction, other_deductions, net_salary,
        currency, notes, created_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [employee_id, pay_period_start, pay_period_end, pay_date || null,
       basic.toFixed(2), parseFloat(overtime_pay||0).toFixed(2),
       parseFloat(bonus||0).toFixed(2), parseFloat(allowances||0).toFixed(2),
       gross.toFixed(2), parseFloat(tax_deduction||0).toFixed(2),
       parseFloat(insurance_deduction||0).toFixed(2), parseFloat(other_deductions||0).toFixed(2),
       net.toFixed(2), emp[0].salary_currency || 'USD', notes || null, req.admin.id]);
    res.status(201).json({ id: r.insertId, gross: gross.toFixed(2), net: net.toFixed(2) });
  } catch (err) { next(err); }
});

// Generate payroll for all employees in a period
router.post('/payroll/generate', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { pay_period_start, pay_period_end } = req.body;
    if (!pay_period_start || !pay_period_end)
      return res.status(400).json({ error: 'pay_period_start and pay_period_end required' });

    const [employees] = await db.query(
      `SELECT id, base_salary, salary_currency FROM employees
       WHERE employment_status = 'active' AND base_salary > 0`);

    let created = 0;
    for (const emp of employees) {
      const gross = parseFloat(emp.base_salary);
      const tax = gross * 0.1;
      const net = gross - tax;
      try {
        await db.query(`
          INSERT IGNORE INTO payroll
          (employee_id, pay_period_start, pay_period_end, basic_salary, gross_salary,
           tax_deduction, net_salary, currency, status, created_by)
          VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [emp.id, pay_period_start, pay_period_end, gross.toFixed(2), gross.toFixed(2),
           tax.toFixed(2), net.toFixed(2), emp.salary_currency || 'USD', 'draft', req.admin.id]);
        created++;
      } catch (e) { /* skip duplicates */ }
    }
    res.json({ message: `Generated ${created} payroll records for ${pay_period_start} to ${pay_period_end}` });
  } catch (err) { next(err); }
});

router.put('/payroll/:id/status', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { status, transaction_reference } = req.body;
    if (!['approved','paid','cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const updates = { status };
    if (status === 'approved') { updates.approved_by = req.admin.id; updates.approved_at = new Date(); }
    if (transaction_reference) updates.transaction_reference = transaction_reference;
    await db.query('UPDATE payroll SET ? WHERE id = ?', [updates, req.params.id]);
    res.json({ message: `Payroll ${status}` });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// PERFORMANCE REVIEWS
// ─────────────────────────────────────────────────────────────
router.get('/performance-reviews', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { employee_id, status } = req.query;
    const where = [];
    const params = [];
    if (employee_id) { where.push('pr.employee_id = ?'); params.push(employee_id); }
    if (status) { where.push('pr.status = ?'); params.push(status); }
    const [rows] = await db.query(`
      SELECT pr.*, e.first_name, e.last_name, e.employee_id AS emp_code,
             d.name AS department, rev.name AS reviewer_name
      FROM performance_reviews pr
      JOIN employees e ON pr.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN admins rev ON pr.reviewer_id = rev.id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY pr.created_at DESC LIMIT 200`, params);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/performance-reviews', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { employee_id, review_period_start, review_period_end, review_type,
            overall_rating, attendance_rating, performance_rating, teamwork_rating,
            initiative_rating, strengths, areas_for_improvement, goals_next_period,
            reviewer_comments } = req.body;
    if (!employee_id || !review_period_start || !review_period_end)
      return res.status(400).json({ error: 'Missing required fields' });
    const [r] = await db.query(`
      INSERT INTO performance_reviews
      (employee_id, review_period_start, review_period_end, review_type,
       overall_rating, attendance_rating, performance_rating, teamwork_rating,
       initiative_rating, strengths, areas_for_improvement, goals_next_period,
       reviewer_comments, reviewer_id, status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [employee_id, review_period_start, review_period_end, review_type || 'annual',
       overall_rating, attendance_rating, performance_rating, teamwork_rating,
       initiative_rating, strengths, areas_for_improvement, goals_next_period,
       reviewer_comments, req.admin.id, 'submitted']);
    res.status(201).json({ id: r.insertId });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// TRAINING RECORDS
// ─────────────────────────────────────────────────────────────
router.get('/training', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { employee_id } = req.query;
    const where = employee_id ? 'WHERE tr.employee_id = ?' : '';
    const params = employee_id ? [employee_id] : [];
    const [rows] = await db.query(`
      SELECT tr.*, e.first_name, e.last_name, d.name AS department
      FROM training_records tr
      JOIN employees e ON tr.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${where} ORDER BY tr.start_date DESC LIMIT 200`, params);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/training', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { employee_id, training_name, training_type, provider, start_date, end_date,
            duration_hours, cost, status, notes } = req.body;
    if (!employee_id || !training_name) return res.status(400).json({ error: 'employee_id and training_name required' });
    const [r] = await db.query(`
      INSERT INTO training_records
      (employee_id, training_name, training_type, provider, start_date, end_date, duration_hours, cost, status, notes)
      VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [employee_id, training_name, training_type || 'skill', provider, start_date, end_date,
       duration_hours, cost, status || 'scheduled', notes]);
    res.status(201).json({ id: r.insertId });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// HR ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────────
router.get('/announcements', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(`
      SELECT ha.*, a.name AS created_by_name FROM hr_announcements ha
      LEFT JOIN admins a ON ha.created_by = a.id
      WHERE (ha.expires_at IS NULL OR ha.expires_at > NOW())
      ORDER BY ha.is_pinned DESC, ha.published_at DESC LIMIT 50`);
    res.json(rows.map(r => ({
      ...r,
      target_departments: tryParse(r.target_departments, null),
      target_employment_types: tryParse(r.target_employment_types, null),
    })));
  } catch (err) { next(err); }
});

router.post('/announcements', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { title, content, category, target_departments, target_employment_types,
            is_pinned, expires_at } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'title and content required' });
    const [r] = await db.query(`
      INSERT INTO hr_announcements
      (title, content, category, target_departments, target_employment_types, is_pinned, expires_at, published_at, created_by)
      VALUES (?,?,?,?,?,?,?,NOW(),?)`,
      [title, content, category || 'general',
       target_departments ? JSON.stringify(target_departments) : null,
       target_employment_types ? JSON.stringify(target_employment_types) : null,
       is_pinned ? 1 : 0, expires_at || null, req.admin.id]);
    res.status(201).json({ id: r.insertId });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────
router.get('/reports/headcount', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(`
      SELECT d.name AS department, d.code,
             COUNT(e.id) AS total,
             SUM(CASE WHEN e.employment_type='full_time' THEN 1 ELSE 0 END) AS full_time,
             SUM(CASE WHEN e.employment_type='part_time' THEN 1 ELSE 0 END) AS part_time,
             SUM(CASE WHEN e.employment_type='contract' THEN 1 ELSE 0 END) AS contract,
             SUM(CASE WHEN e.gender='male' THEN 1 ELSE 0 END) AS male,
             SUM(CASE WHEN e.gender='female' THEN 1 ELSE 0 END) AS female,
             AVG(e.base_salary) AS avg_salary,
             SUM(e.base_salary) AS total_salary_cost
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id AND e.employment_status = 'active'
      GROUP BY d.id, d.name, d.code ORDER BY d.name`);
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/reports/attendance-summary', async (req, res, next) => {
  const db = req.app.locals.db;
  try {
    const { month = new Date().toISOString().slice(0,7) } = req.query;
    const [rows] = await db.query(`
      SELECT e.employee_id AS emp_code, e.first_name, e.last_name,
             d.name AS department,
             COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS present_days,
             COUNT(CASE WHEN a.status = 'absent' THEN 1 END) AS absent_days,
             COUNT(CASE WHEN a.status = 'late' THEN 1 END) AS late_days,
             COUNT(CASE WHEN a.status = 'on_leave' THEN 1 END) AS leave_days,
             SUM(a.worked_hours) AS total_hours,
             SUM(a.overtime_hours) AS overtime_hours
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN attendance a ON a.employee_id = e.id
        AND DATE_FORMAT(a.date, '%Y-%m') = ?
      WHERE e.employment_status = 'active'
      GROUP BY e.id, e.employee_id, e.first_name, e.last_name, d.name
      ORDER BY d.name, e.first_name`, [month]);
    res.json(rows);
  } catch (err) { next(err); }
});

function tryParse(v, d) { try { return JSON.parse(v); } catch { return d; } }

module.exports = router;

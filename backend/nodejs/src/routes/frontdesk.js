// ============================================================
// src/routes/frontdesk.js — Front Desk / PMS
// Room grid, walk-in bookings, check-in/out, today's arrivals
// Author: Kiran Khadka — © 2026 Kiran Khadka
// ============================================================
const express = require('express');
const { verifyAdmin } = require('../middleware/auth');
const router = express.Router();
router.use(verifyAdmin);

function genRef(){const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let r='WI';for(let i=0;i<8;i++)r+=c[Math.floor(Math.random()*c.length)];return r;}

// GET /api/frontdesk/room-grid
router.get('/room-grid', async (req,res,next) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.query(`
      SELECT r.id,r.room_number,r.floor,r.wing,r.status,r.housekeeping_status,r.notes,
             rc.name AS category_name,rc.base_price,rc.max_adults,rc.bed_type,
             b.id AS booking_id,b.booking_reference,b.guest_first_name,b.guest_last_name,
             b.guest_phone,b.check_in_date,b.check_out_date,b.status AS booking_status,b.payment_status
      FROM rooms r JOIN room_categories rc ON r.category_id=rc.id
      LEFT JOIN bookings b ON b.room_id=r.id AND b.status IN ('confirmed','checked_in')
        AND b.check_in_date<=CURDATE() AND b.check_out_date>CURDATE()
      WHERE r.is_active=1 ORDER BY r.floor,r.room_number`);
    res.json(rows);
  } catch(e){next(e);}
});

// GET /api/frontdesk/available-rooms?check_in=&check_out=
router.get('/available-rooms', async (req,res,next) => {
  const db = req.app.locals.db;
  try {
    const {check_in,check_out} = req.query;
    if (!check_in||!check_out) return res.status(400).json({error:'check_in and check_out required'});
    const [rooms] = await db.query(`
      SELECT r.id,r.room_number,r.floor,r.wing,
             rc.id AS category_id,rc.name AS category_name,rc.base_price,rc.max_adults,rc.max_children,rc.bed_type,rc.size_sqm
      FROM rooms r JOIN room_categories rc ON r.category_id=rc.id
      WHERE r.is_active=1 AND r.status!='maintenance'
        AND r.id NOT IN (SELECT room_id FROM bookings WHERE status NOT IN ('cancelled','no_show') AND check_in_date<? AND check_out_date>?)
      ORDER BY rc.base_price,r.room_number`,[check_out,check_in]);
    res.json(rooms);
  } catch(e){next(e);}
});

// GET /api/frontdesk/today
router.get('/today', async (req,res,next) => {
  const db = req.app.locals.db;
  try {
    const [arrivals] = await db.query(`
      SELECT b.id,b.booking_reference,b.guest_first_name,b.guest_last_name,b.guest_phone,
             b.check_in_date,b.check_out_date,b.adults,b.status,b.payment_status,r.room_number,rc.name AS room_name
      FROM bookings b JOIN rooms r ON b.room_id=r.id JOIN room_categories rc ON b.room_category_id=rc.id
      WHERE DATE(b.check_in_date)=CURDATE() AND b.status IN ('confirmed','checked_in') ORDER BY b.check_in_date`);
    const [departures] = await db.query(`
      SELECT b.id,b.booking_reference,b.guest_first_name,b.guest_last_name,b.guest_phone,
             b.check_in_date,b.check_out_date,b.total_amount,b.status,b.payment_status,r.room_number,rc.name AS room_name
      FROM bookings b JOIN rooms r ON b.room_id=r.id JOIN room_categories rc ON b.room_category_id=rc.id
      WHERE DATE(b.check_out_date)=CURDATE() AND b.status IN ('confirmed','checked_in','checked_out') ORDER BY b.check_out_date`);
    res.json({arrivals,departures});
  } catch(e){next(e);}
});

// POST /api/frontdesk/walk-in
router.post('/walk-in', async (req,res,next) => {
  const db = req.app.locals.db;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const {room_id,check_in_date,check_out_date,guest_first_name,guest_last_name,
           guest_email,guest_phone,guest_nationality,adults,children,
           special_requests,internal_notes,payment_method,amount_paid} = req.body;
    if (!room_id||!check_in_date||!check_out_date||!guest_first_name||!guest_last_name)
      return res.status(400).json({error:'room_id, dates, guest name required'});
    const [conflict] = await conn.query(
      `SELECT id FROM bookings WHERE room_id=? AND status NOT IN ('cancelled','no_show')
       AND check_in_date<? AND check_out_date>? FOR UPDATE`,[room_id,check_out_date,check_in_date]);
    if (conflict.length){await conn.rollback();return res.status(409).json({error:'Room not available'});}
    const [[room]] = await conn.query(
      `SELECT r.*,rc.base_price,rc.id AS category_id FROM rooms r JOIN room_categories rc ON r.category_id=rc.id WHERE r.id=?`,[room_id]);
    if (!room){await conn.rollback();return res.status(404).json({error:'Room not found'});}
    const nights=Math.ceil((new Date(check_out_date)-new Date(check_in_date))/86400000);
    const subtotal=room.base_price*nights;
    const taxes=subtotal*0.15; const sc=subtotal*0.05; const total=subtotal+taxes+sc;
    const PM_MAP={'qr_code':'qr_transfer','credit_card':'card','online':'card'};
    const rawPM=(payment_method||'cash').toLowerCase();
    const safePM=PM_MAP[rawPM]||(['cash','qr_transfer','card','bank_transfer'].includes(rawPM)?rawPM:'cash');
    let ref; let t=0; do{ref=genRef();t++;}while(t<5);
    const paid=parseFloat(amount_paid||0);
    const pStatus=paid>=total?'paid':paid>0?'partial':'unpaid';
    const [result]=await conn.query(`
      INSERT INTO bookings (booking_reference,room_id,room_category_id,check_in_date,check_out_date,
        nights,adults,children,room_rate,subtotal,taxes,service_charge,discount_amount,total_amount,
        payment_method,payment_status,status,special_requests,internal_notes,source,
        guest_first_name,guest_last_name,guest_email,guest_phone,guest_nationality)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [ref,room_id,room.category_id,check_in_date,check_out_date,nights,adults||1,children||0,
       room.base_price,subtotal.toFixed(2),taxes.toFixed(2),sc.toFixed(2),'0.00',total.toFixed(2),
       safePM,pStatus,'confirmed',special_requests||null,
       internal_notes||`Walk-in by ${req.admin.name}`,'walk_in',
       guest_first_name,guest_last_name,guest_email||'',guest_phone||null,guest_nationality||null]);
    if (paid>0){
      await conn.query(
        `INSERT INTO payments (booking_id,amount,currency,method,status,processed_by,processed_at)
         VALUES (?,?,'USD',?,'verified',?,NOW())`,[result.insertId,paid.toFixed(2),safePM,req.admin.id]);
    }
    await conn.commit();
    if (guest_email){
      try{
        const bcrypt=require('bcryptjs');
        const [ex]=await db.query('SELECT id FROM users WHERE email=?',[guest_email]);
        if (!ex.length){
          const tp=Math.random().toString(36).slice(-8)+'!A1';
          await db.query(
            `INSERT INTO users (first_name,last_name,email,password,phone,nationality,email_verified_at) VALUES (?,?,?,?,?,?,NOW())`,
            [guest_first_name,guest_last_name,guest_email,await bcrypt.hash(tp,12),guest_phone||null,guest_nationality||null]);
        }
      }catch{}
    }
    res.status(201).json({booking_id:result.insertId,booking_reference:ref,total_amount:total.toFixed(2),nights,message:'Walk-in booking created'});
  } catch(e){await conn.rollback();next(e);}
  finally{conn.release();}
});

// PUT /api/frontdesk/room-status/:id
router.put('/room-status/:id', async (req,res,next) => {
  const db = req.app.locals.db;
  try {
    const {status,housekeeping_status,notes}=req.body;
    const u=[];const v=[];
    if(status){u.push('status=?');v.push(status);}
    if(housekeeping_status){u.push('housekeeping_status=?');v.push(housekeeping_status);}
    if(notes!==undefined){u.push('notes=?');v.push(notes);}
    if(!u.length) return res.status(400).json({error:'Nothing to update'});
    await db.query(`UPDATE rooms SET ${u.join(',')} WHERE id=?`,[...v,req.params.id]);
    res.json({message:'Updated'});
  } catch(e){next(e);}
});

// POST /api/frontdesk/check-in/:id
router.post('/check-in/:id', async (req,res,next) => {
  const db = req.app.locals.db;
  try {
    const [rows]=await db.query('SELECT * FROM bookings WHERE id=?',[req.params.id]);
    if(!rows.length) return res.status(404).json({error:'Not found'});
    await db.query(`UPDATE bookings SET status='checked_in',checked_in_at=NOW() WHERE id=?`,[req.params.id]);
    await db.query(`UPDATE rooms SET status='occupied' WHERE id=?`,[rows[0].room_id]);
    res.json({message:'Checked in'});
  } catch(e){next(e);}
});

// POST /api/frontdesk/check-out/:id
router.post('/check-out/:id', async (req,res,next) => {
  const db = req.app.locals.db;
  try {
    const [rows]=await db.query('SELECT * FROM bookings WHERE id=?',[req.params.id]);
    if(!rows.length) return res.status(404).json({error:'Not found'});
    await db.query(`UPDATE bookings SET status='checked_out',checked_out_at=NOW() WHERE id=?`,[req.params.id]);
    await db.query(`UPDATE rooms SET status='housekeeping',housekeeping_status='dirty' WHERE id=?`,[rows[0].room_id]);
    res.json({message:'Checked out'});
  } catch(e){next(e);}
});

module.exports = router;

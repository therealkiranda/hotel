<div align="center">

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║          ✦  G R A N D  L U M I È R E  H O T E L  ✦          ║
║                                                               ║
║              Full-Stack Hotel Booking & PMS System            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.18-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)
[![JWT](https://img.shields.io/badge/JWT-Auth-FB015B?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io)

**A production-ready, full-stack luxury hotel booking & PMS platform**  
React frontend · Node.js/Express REST API · MySQL database · Full admin & receptionist panel

---

*Built for Kiran Khadka · Grand Lumière Hotel Project · 2026*

</div>

---

## 🆕 Changelog

### v1.1.0 — PMS Update (April 2026)

**New Features:**
- **Full Receptionist PMS** — counter booking (4-step), room assignment, check-in/out from Front Desk
- **Guest Details Capture** — ID type (passport/NID/driving license), address, date of birth
- **Consumption Billing** — add restaurant, bar, spa, room service, amenity, laundry, transport, minibar charges per booking
- **Folio Panel** — per-booking ledger with charge management, payment recording, running balance
- **Printable Invoice** — full hotel letterhead invoice with all charges, taxes, payments; opens browser print dialog
- **Quick Search** — find any booking by name, room, reference, or phone from Front Desk
- **Mobile-Responsive Admin** — hamburger drawer menu, works correctly on phone/tablet desktop-site mode
- **Role-Based Nav** — receptionists only see relevant menu items; config/content items hidden
- **MP4 Video Streaming Fix** — server now sends proper `Content-Type`, `Accept-Ranges`, and byte-range headers for hero video background

**Database Changes (run migration_v5_pms.sql):**
- Added `booking_charges` table (restaurant/amenity/etc. consumption)
- Added `booking_guest_ids` table (passport/NID document capture)
- Added `amount_paid` column to `bookings`
- Added `processed_by` and `notes` columns to `payments`

---

## 📁 Changed Files (v1.1.0)

| File | Change |
|:---|:---|
| `backend/nodejs/server.js` | Video streaming middleware with proper MIME + Range headers |
| `backend/nodejs/src/routes/frontdesk.js` | Full rewrite — walk-in, charges, payments, assign-room, search, invoice data |
| `frontend/src/components/admin/AdminLayout.jsx` | Mobile drawer, role-based nav filtering, `100dvh` fix |
| `frontend/src/pages/admin/AdminFrontDesk.jsx` | Full PMS — counter booking, folio, consumption, invoice print |
| `database/migration_v5_pms.sql` | New tables + columns (run once on live DB) |

---

## 🏨 Receptionist Login & PMS Usage

### Adding a Receptionist Account

In Admin → HR Module → Add Employee, or directly in MySQL:

```sql
INSERT INTO admins (name, email, password, role) VALUES
('Reception Staff', 'reception@grandlumiere.com', 'SETUP:Reception@2026', 'receptionist');
```

Or use the existing Admin → Settings to create admin accounts.

### What Receptionists Can Do

| Feature | Available |
|:---|:---|
| View room grid (availability) | ✅ |
| Counter booking (walk-in) | ✅ |
| Check-in / Check-out | ✅ |
| Add restaurant / amenity charges | ✅ |
| Record cash / card / QR payments | ✅ |
| Print guest invoice | ✅ |
| Search bookings | ✅ |
| View customers | ✅ |
| Manage rooms / OTA / theme / SEO | ❌ |

### Counter Booking Flow

```
Front Desk → ➕ Counter Booking

Step 1: Select dates (check-in, check-out)
         → Click "Find Rooms" → sees available rooms

Step 2: Choose room (click room card)

Step 3: Enter guest details
         → Name, phone, email, nationality
         → ID type + number (passport, NID, etc.)
         → DOB, address, adults, children

Step 4: Payment
         → Method: Cash / Card / QR / Bank Transfer
         → Discount amount
         → Amount paid now
         → Shows full breakdown (room + tax + service)

→ Click "Create Counter Booking & Check In"
→ Booking created, room marked Occupied, receipt shown
```

### Adding Consumption Charges

```
Front Desk → Room Grid → click occupied room → "🧾 Folio"
OR
Front Desk → Quick Search → find guest → click "Folio ↗"

In Folio → "📦 Charges" tab:
→ Category: Restaurant / Bar / Spa / Room Service / Amenity / etc.
→ Description: e.g. "Club Sandwich"
→ Quantity: 2
→ Unit Price: NPR 450
→ Click "Add Charge"

→ Charge appears in list with running total
→ Can remove charges with ✕
```

### Printing an Invoice

```
In any Folio → Click "🧾 Invoice" (gold button)
→ Invoice preview appears showing:
   • Hotel letterhead (name, address, contact)
   • Guest details + stay details
   • Room charges breakdown
   • All consumption charges
   • Tax (13%) + Service Charge (10%)
   • Total, paid, balance due
→ Click "🖨 Print" → browser print dialog opens
```

---

## 🎥 Video Background — How to Enable

The video background was broken due to missing MIME and byte-range headers on the server. This is now fixed in `server.js`.

**To activate video background:**

1. Admin → Theme → Hero Section
2. Select "🎬 Video Background"
3. Click "🎬 Click to upload hero video" → upload your `.mp4`
4. Click "Save All Changes"
5. Refresh the homepage — video should now play

**Video requirements for best results:**
- Format: `.mp4` (H.264 codec)
- Duration: 15–60 seconds, looping
- Resolution: 1920×1080 recommended
- File size: under 50MB for fast loading
- No audio needed (it autoplays muted)

---

## ⚡ Deployment — v1.1.0 Update Steps

### Step 1 — Run the database migration

```sql
-- Run on your live database (hotel.primelogic.com.np)
-- Via phpMyAdmin or CloudPanel → Database Tools

-- Source: database/migration_v5_pms.sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(12,2) DEFAULT 0.00 AFTER total_amount;

CREATE TABLE IF NOT EXISTS booking_guest_ids ( ... );
CREATE TABLE IF NOT EXISTS booking_charges ( ... );

ALTER TABLE payments ADD COLUMN IF NOT EXISTS processed_by INT DEFAULT NULL, ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;
```

### Step 2 — Push to GitHub (auto-deploy)

```bash
git add .
git commit -m "feat: PMS v1.1.0 — receptionist module, consumption billing, invoice print, mobile admin, video fix"
git push origin main
```

### Step 3 — Restart PM2 (backend only)

```bash
pm2 restart grand-lumiere-api
# or
pm2 restart all
```

Frontend auto-deploys via your CI/CD on push.

---

## 🗄 Database Schema (v3 + v5 migration)

```
hotel_db
│
├── theme_settings        ← Colors, fonts, hero type/video
├── hotel_info            ← Hotel name, address, contact, policies
│
├── users                 ← Guest accounts
├── admins                ← Admin/receptionist/manager accounts
│                            roles: super_admin, admin, receptionist, manager, hr_manager
│
├── room_categories       ← Room types + pricing
├── rooms                 ← Physical rooms (floor, wing, status)
├── room_images           ← Gallery images per category
│
├── bookings              ← All reservations (walk-in, OTA, online)
│                            status: pending, confirmed, checked_in, checked_out, cancelled
├── booking_charges  [v5] ← Restaurant, bar, spa, amenity consumption per booking
├── booking_guest_ids[v5] ← Guest ID documents (passport, NID, etc.)
├── payments              ← Payment records per booking
│
├── blog_posts
├── amenities
├── reviews
├── pages
├── media_uploads
│
├── hr_roles
├── employees
├── departments
├── attendance
├── leave_requests
├── payroll
├── performance_reviews
├── announcements
│
└── ota_channels + channel_sync_log
```

---

## 🔒 Role Permissions

| Feature | super_admin | admin | manager | receptionist | hr_manager |
|:---|:---:|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Front Desk / PMS | ✅ | ✅ | ✅ | ✅ | — |
| Bookings | ✅ | ✅ | ✅ | ✅ | — |
| Customers | ✅ | ✅ | ✅ | ✅ | — |
| Rooms manager | ✅ | ✅ | ✅ | — | — |
| Payments | ✅ | ✅ | ✅ | — | — |
| Reviews | ✅ | ✅ | ✅ | — | — |
| Blog / Amenities | ✅ | ✅ | ✅ | — | — |
| OTA Manager | ✅ | ✅ | ✅ | — | — |
| HR Module | ✅ | ✅ | ✅ | — | ✅ |
| Theme / SEO / Settings | ✅ | ✅ | — | — | — |

---

## 📡 New API Endpoints (v1.1.0)

All require Admin JWT.

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/frontdesk/room-grid` | All rooms with current guest |
| `GET` | `/api/frontdesk/available-rooms?check_in=&check_out=` | Available rooms for dates |
| `GET` | `/api/frontdesk/today` | Today's arrivals + departures |
| `POST` | `/api/frontdesk/walk-in` | Create counter booking + check in |
| `POST` | `/api/frontdesk/check-in/:id` | Check in a booking |
| `POST` | `/api/frontdesk/check-out/:id` | Check out a booking |
| `PUT` | `/api/frontdesk/room-status/:id` | Update room status |
| `GET` | `/api/frontdesk/booking/:id` | Full folio data (booking + charges + payments) |
| `POST` | `/api/frontdesk/booking/:id/charge` | Add consumption charge |
| `DELETE` | `/api/frontdesk/charge/:id` | Remove a charge |
| `POST` | `/api/frontdesk/booking/:id/payment` | Record a payment |
| `PUT` | `/api/frontdesk/booking/:id/assign-room` | Move guest to different room |
| `GET` | `/api/frontdesk/search?q=` | Search bookings by name/room/ref/phone |

---

<div align="center">

---

```
╔════════════════════════════════════════════════════╗
║                                                    ║
║   Built with care for Kiran Khadka                 ║
║   Grand Lumière Hotel — 2026                       ║
║                                                    ║
║   React  ·  Node.js  ·  MySQL  ·  JWT              ║
║   Framer Motion  ·  Vite  ·  Express               ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

**v1.1.0 — PMS · Mobile Admin · Video Fix · Receptionist Module**

</div>

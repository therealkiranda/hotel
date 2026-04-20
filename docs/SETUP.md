# 🏨 Grand Lumière Hotel — Complete Setup & Deployment Guide

## Project Structure

```
hotel-project/
├── frontend/                   # React + Vite application
│   ├── src/
│   │   ├── App.jsx             # Root router with all routes
│   │   ├── main.jsx            # React entry point
│   │   ├── index.css           # Global CSS with CSS variables
│   │   ├── context/
│   │   │   ├── ThemeContext.jsx # Dynamic theming + color schemes
│   │   │   ├── AuthContext.jsx  # User authentication state
│   │   │   └── BookingContext.jsx # Booking flow state
│   │   ├── pages/
│   │   │   ├── HomePage.jsx     # Landing page (hero, rooms, amenities, blog, reviews)
│   │   │   ├── RoomsPage.jsx    # Room listing with availability
│   │   │   ├── RoomDetailPage.jsx # Single room page
│   │   │   ├── BookingPage.jsx  # 3-step booking flow
│   │   │   ├── BookingConfirmPage.jsx # Confirmation
│   │   │   ├── AmenitiesPage.jsx
│   │   │   ├── AmenityDetailPage.jsx
│   │   │   ├── BlogPage.jsx
│   │   │   ├── BlogPostPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx # Customer account
│   │   │   ├── NotFoundPage.jsx
│   │   │   └── admin/
│   │   │       ├── AdminLoginPage.jsx
│   │   │       ├── AdminDashboard.jsx # Analytics + stats
│   │   │       ├── AdminBookings.jsx  # Full CRUD
│   │   │       ├── AdminRooms.jsx     # Room status management
│   │   │       ├── AdminCustomers.jsx
│   │   │       ├── AdminBlog.jsx      # WYSIWYG blog editor
│   │   │       ├── AdminAmenities.jsx
│   │   │       ├── AdminReviews.jsx
│   │   │       ├── AdminTheme.jsx     # Color schemes, fonts, animation
│   │   │       ├── AdminSEO.jsx       # Per-page meta tags
│   │   │       └── AdminSettings.jsx  # Hotel info + social auth
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.jsx
│   │   │   │   ├── Header.jsx  # Sticky, transparent→solid, mobile drawer
│   │   │   │   └── Footer.jsx
│   │   │   ├── booking/
│   │   │   │   └── BookingBar.jsx  # Availability search widget
│   │   │   ├── ui/
│   │   │   │   └── RoomCard.jsx    # + AmenityCard, ReviewCard, BlogCard, SEOHead
│   │   │   └── auth/
│   │   │       ├── ProtectedRoute.jsx
│   │   │       └── AdminRoute.jsx
│   │   └── utils/
│   │       └── api.js          # Axios client + admin client
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   └── nodejs/                 # Express REST API
│       ├── server.js           # Entry point
│       ├── src/
│       │   ├── routes/
│       │   │   ├── auth.js     # Login, register, social, JWT
│       │   │   ├── rooms.js    # Public + admin CRUD
│       │   │   ├── bookings.js # Availability, create, manage
│       │   │   ├── users.js    # Profile, history, loyalty
│       │   │   ├── admin.js    # Dashboard, theme, SEO, settings
│       │   │   └── public.js   # No-auth data (amenities, blog, reviews)
│       │   └── middleware/
│       │       ├── auth.js     # JWT verify (user + admin)
│       │       ├── validate.js # express-validator helpers
│       │       └── errorHandler.js
│       ├── package.json
│       └── .env.example
│
└── database/
    └── schema.sql              # Full MySQL schema + seed data
```

---

## Prerequisites

- **Node.js** 18+ and npm
- **MySQL** 8.0+ or MariaDB 10.5+
- **Git**

---

## 1. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Run schema (creates DB, tables, and seed data)
mysql -u root -p < database/schema.sql

# Verify
mysql -u root -p -e "USE hotel_db; SHOW TABLES;"
```

**Default admin credentials:**
- Email: `admin@grandlumiere.com`
- Password: `Admin@123456`

---

## 2. Backend (Node.js API) Setup

```bash
cd backend/nodejs

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env
```

**Required `.env` values:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hotel_db
JWT_SECRET=your-secure-random-32-char-string
JWT_ADMIN_SECRET=different-secure-random-string
```

```bash
# Start development server
npm run dev

# Or production
npm start
```

API will run at: **http://localhost:4000**

Verify: `curl http://localhost:4000/health`

---

## 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:4000/api
```

```bash
# Start development server
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

## 4. Access Points

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | Guest-facing website |
| http://localhost:3000/admin | Admin panel |
| http://localhost:3000/admin/login | Admin login |
| http://localhost:4000/api | REST API |
| http://localhost:4000/health | Health check |

---

## 5. Key Admin Features

### Theme Customization (Admin → Theme)
- **10 color schemes**: Forest & Gold, Navy & Champagne, Charcoal, Burgundy, Sage, Midnight, Ocean, Terracotta, Slate, Noir
- **Custom hex colors**: Override any color individually
- **8+ fonts** for headings and 7+ for body (loaded from Google Fonts dynamically)
- **Animation controls**: Speed (slow/normal/fast), enable/disable
- **Hero type**: Video, image, parallax
- **Custom CSS**: Inject custom overrides
- **Live preview**: See changes before saving

### SEO (Admin → SEO)
- Per-page meta title, description, keywords
- Open Graph title, description, and image
- Robots directives
- Google preview mockup

### Bookings (Admin → Bookings)
- View all bookings with search and filters
- Confirm, Check-In, Check-Out, Cancel, No-Show
- Side panel with full guest and booking details
- Revenue analytics on dashboard

### Social Login (Admin → Settings)
- Toggle Google/Facebook/Apple login on/off
- Configure OAuth keys per provider

---

## 6. API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create user account |
| POST | `/api/auth/login` | User login → JWT |
| POST | `/api/auth/admin/login` | Admin login → JWT |
| GET  | `/api/auth/me` | Get current user |
| POST | `/api/auth/social` | Social OAuth login |
| PUT  | `/api/auth/password` | Change password |

### Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rooms` | All categories (with availability if dates given) |
| GET | `/api/rooms/:slug` | Single room category |
| GET | `/api/rooms/:id/availability` | Monthly availability calendar |
| POST | `/api/rooms` | Create category (admin) |
| PUT | `/api/rooms/:id` | Update category (admin) |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings/check-availability` | Check & price a room |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/my` | Current user's bookings |
| GET | `/api/bookings/:ref` | Get by reference |
| GET | `/api/bookings` | All bookings (admin) |
| PUT | `/api/bookings/:id/status` | Update status (admin) |

### Public (No Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/settings` | Theme + hotel info |
| GET | `/api/public/amenities` | Amenities list |
| GET | `/api/public/blog` | Blog posts |
| GET | `/api/public/blog/:slug` | Single post (increments view) |
| GET | `/api/public/reviews` | Approved reviews |
| POST | `/api/public/reviews` | Submit review |

---

## 7. Production Deployment (AWS EC2 / cPanel)

### EC2 (Linux)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Build frontend
cd frontend && npm run build

# Serve frontend with nginx
# Point nginx /var/www/html to frontend/dist/
# Proxy /api to localhost:4000

# Start API
cd backend/nodejs
pm2 start server.js --name hotel-api
pm2 save
pm2 startup
```

**Sample nginx config:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/html;
    index index.html;

    location /api {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### cPanel
1. Upload `frontend/dist/` to `public_html/`
2. Create a Node.js app in cPanel pointing to `backend/nodejs/server.js`
3. Set environment variables in cPanel Node.js manager
4. Import `database/schema.sql` via phpMyAdmin

---

## 8. Future Extensions

### Online Payments (Stripe/PayPal)
```bash
npm install stripe
```
Add payment route in `backend/nodejs/src/routes/bookings.js` — the `payment_method` column already supports `'online'`.

### Email Confirmations
```bash
npm install nodemailer
```
Add `MAIL_HOST`, `MAIL_USER`, `MAIL_PASS` to `.env` — the server.js already imports dotenv.

### Mobile App (React Native)
The REST API is already JWT-based and CORS-configured for any origin. Add your mobile app URL to `ALLOWED_ORIGINS`.

### Expedia/Booking.com Integration
Add OTA channels to the `source` ENUM in the `bookings` table. Map external booking webhooks to `POST /api/bookings`.

---

## 9. Security Notes

- All passwords hashed with **bcrypt** (cost factor 12)
- JWT tokens signed with **separate secrets** for users and admins
- **Rate limiting**: 200 req/15min general, 10 req/15min for auth
- **Helmet.js** for HTTP security headers
- **SQL injection** prevented via parameterized queries (mysql2)
- **XSS** protection via React's default escaping + Helmet CSP
- All admin routes require valid **admin JWT** with `isAdmin: true` claim

---

## 10. Default Data Reference

**Room Categories created:**
1. Deluxe Room — $250/night
2. Junior Suite — $420/night
3. Executive Suite — $750/night
4. Presidential Suite — $2,500/night

**Sample Amenities:**
- Le Jardin Restaurant (dining)
- Lumière Spa & Wellness (wellness)
- Infinity Pool & Terrace (recreation)
- Sky Lounge Bar (dining)
- Grand Ballroom (business)
- Fitness Center (recreation)

**Sample Blog Posts:** 3 published posts

**Sample Reviews:** 3 featured approved reviews

**Promo Codes:**
- `WELCOME15` — 15% off (new guests)
- `SUMMER2026` — $50 off per night

---

*Built for Kiran Khadka's Hotel Project — Grand Lumière Hotel*

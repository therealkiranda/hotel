# Grand Lumière Hotel — CloudPanel Production Deployment Guide
# Frontend: hotel.primelogic.com.np
# Backend:  admin.primelogic.com.np

---

## OVERVIEW

```
CloudPanel Server
├── hotel.primelogic.com.np    ← React frontend (static files from /dist)
└── admin.primelogic.com.np    ← Node.js backend (API on port 4000)
        ↕
    MySQL Database (hotel_db)
```

---

## STEP 1 — DATABASE SETUP

In CloudPanel → Databases → Create Database:
- **Database name:** `hotel_db`
- **Username:** `hotel_user` (or any name you choose)
- **Password:** (save this — needed for .env)

Import the schema via phpMyAdmin or SSH:
```bash
mysql -u hotel_user -p hotel_db < database/schema.sql
```

Then run the migration to add new fields:
```bash
mysql -u hotel_user -p hotel_db < database/migration_v2_to_v3.sql
```

---

## STEP 2 — BACKEND SETUP (admin.primelogic.com.np)

### 2a. Create website in CloudPanel
- CloudPanel → Sites → Add Site
- Domain: `admin.primelogic.com.np`
- Site Type: **Node.js**
- Node.js Version: **18 LTS** or **20 LTS**
- Root: leave default

### 2b. Upload backend files
Upload the entire contents of `backend/nodejs/` to:
```
/home/grandlumiere/htdocs/admin.primelogic.com.np/
```

Your folder structure should look like:
```
/home/grandlumiere/htdocs/admin.primelogic.com.np/
├── server.js
├── package.json
├── ecosystem.config.js
├── .env                    ← you create this (see 2c)
├── src/
│   ├── routes/
│   └── middleware/
├── uploads/                ← auto-created on first upload
│   ├── hero/
│   ├── qr-codes/
│   ├── blog/
│   └── payment-proofs/
└── logs/                   ← auto-created by PM2
```

### 2c. Create .env file
SSH into your server and create the .env file:
```bash
cd /home/grandlumiere/htdocs/admin.primelogic.com.np
cp .env.example .env
nano .env
```

Fill in your values:
```env
NODE_ENV=production
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=hotel_user
DB_PASSWORD=YOUR_DB_PASSWORD_HERE
DB_NAME=hotel_db
JWT_SECRET=PASTE_RANDOM_64_CHARS_HERE
JWT_ADMIN_SECRET=PASTE_DIFFERENT_RANDOM_64_CHARS_HERE
ALLOWED_ORIGINS=https://hotel.primelogic.com.np,https://admin.primelogic.com.np
FRONTEND_URL=https://hotel.primelogic.com.np
SETUP_KEY=choose-your-own-secret-phrase
UPLOAD_DIR=uploads
MAX_FILE_SIZE=104857600
```

Generate JWT secrets (run in terminal):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Run it twice — one for JWT_SECRET, one for JWT_ADMIN_SECRET.

### 2d. Install dependencies
```bash
cd /home/grandlumiere/htdocs/admin.primelogic.com.np
npm install --production
```

### 2e. Create required directories
```bash
mkdir -p uploads/hero uploads/qr-codes uploads/blog uploads/rooms \
         uploads/branding uploads/payment-proofs uploads/general logs
chmod 755 uploads -R
```

### 2f. Configure Nginx reverse proxy in CloudPanel
In CloudPanel → Sites → admin.primelogic.com.np → Vhost Editor

Replace/add the location block with the contents of:
`deployment/nginx-backend.conf`

Key part — add inside your `server {}` block:
```nginx
location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 100M;
    proxy_read_timeout 300s;
}

location /uploads/ {
    alias /home/grandlumiere/htdocs/admin.primelogic.com.np/uploads/;
    expires 30d;
}
```

### 2g. Start with PM2
```bash
cd /home/grandlumiere/htdocs/admin.primelogic.com.np

# Update ecosystem.config.js cwd path if needed
# Then start:
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # follow the instructions it prints
```

Verify it's running:
```bash
pm2 status
curl http://localhost:4000/health
```

You should see: `{"status":"ok","database":"connected",...}`

---

## STEP 3 — FRONTEND SETUP (hotel.primelogic.com.np)

### 3a. Build locally (on your computer)
```bash
cd frontend

# The .env.production file already has the correct URL:
# VITE_API_URL=https://admin.primelogic.com.np/api

npm install
npm run build
```

This creates a `frontend/dist/` folder with all static files.

### 3b. Create website in CloudPanel
- CloudPanel → Sites → Add Site
- Domain: `hotel.primelogic.com.np`
- Site Type: **Static / PHP** (just for serving static files)
- Root: leave default

### 3c. Upload dist/ contents
Upload everything INSIDE `frontend/dist/` to:
```
/home/grandlumiere/htdocs/hotel.primelogic.com.np/
```

⚠️ Upload the **contents** of dist/ (not the dist folder itself).
Your folder should contain:
```
/home/grandlumiere/htdocs/hotel.primelogic.com.np/
├── index.html
├── .htaccess         ← from frontend/.htaccess
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── vendor-[hash].js
└── vite.svg
```

Also upload the `.htaccess` file from `frontend/.htaccess`.

### 3d. Configure Nginx for React Router
In CloudPanel → Sites → hotel.primelogic.com.np → Vhost Editor

Add inside your `server {}` block:
```nginx
root /home/grandlumiere/htdocs/hotel.primelogic.com.np;
index index.html;

location / {
    try_files $uri $uri/ /index.html;
}

location /assets/ {
    expires max;
    add_header Cache-Control "public, max-age=31536000, immutable";
    access_log off;
}
```

---

## STEP 4 — SSL CERTIFICATES

In CloudPanel → Sites → each domain → SSL/TLS → Let's Encrypt:
1. Enable SSL for `hotel.primelogic.com.np`
2. Enable SSL for `admin.primelogic.com.np`

CloudPanel handles renewal automatically.

---

## STEP 5 — CREATE ADMIN ACCOUNT

After backend is running and SSL is active:

```bash
curl -X POST https://admin.primelogic.com.np/api/auth/admin/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@grandlumiere.com",
    "password": "Admin@123456",
    "name": "Super Admin",
    "setup_key": "YOUR_SETUP_KEY_FROM_ENV"
  }'
```

Expected response:
```json
{"message":"Admin account created","email":"admin@grandlumiere.com"}
```

⚠️ Change the password immediately after first login:
Admin Panel → Settings → My Profile → Change Password

---

## STEP 6 — VERIFY EVERYTHING

Run these checks:

```bash
# 1. API health check
curl https://admin.primelogic.com.np/health

# 2. Admin login
curl -X POST https://admin.primelogic.com.np/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@grandlumiere.com","password":"Admin@123456"}'

# 3. Public API
curl https://admin.primelogic.com.np/api/public/settings
```

---

## ADMIN LOGIN URL

```
https://hotel.primelogic.com.np/admin/login
```
Default credentials:
- Email: `admin@grandlumiere.com`
- Password: `Admin@123456`

---

## QUICK TROUBLESHOOTING

| Problem | Fix |
|---------|-----|
| API returns 502 | PM2 not running — `pm2 restart grandlumiere-api` |
| Can't login | Run the setup curl command in Step 5 |
| CORS error | Check ALLOWED_ORIGINS in .env includes both domains |
| Images not showing | Check `/uploads/` nginx location block |
| React routes 404 | Check `.htaccess` is uploaded / nginx try_files |
| DB connection refused | Verify DB_HOST=localhost and credentials |

## PM2 USEFUL COMMANDS

```bash
pm2 status                    # check status
pm2 logs grandlumiere-api     # view logs
pm2 restart grandlumiere-api  # restart
pm2 reload grandlumiere-api   # zero-downtime reload
pm2 stop grandlumiere-api     # stop
```

---

*Grand Lumière Hotel Management System v2.0*

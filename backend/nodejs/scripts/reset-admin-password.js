// ============================================================
// scripts/reset-admin-password.js
// Run this once to set the correct admin password:
//   node scripts/reset-admin-password.js
// ============================================================
require('dotenv').config({ path: '../.env' });
const mysql   = require('mysql2/promise');
const bcrypt  = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(r => rl.question(q, r));

async function main() {
  console.log('\n🏨  Grand Lumière Hotel — Admin Password Reset\n');

  const email    = await ask('Admin email [admin@grandlumiere.com]: ') || 'admin@grandlumiere.com';
  const password = await ask('New password [Admin@123456]: ')           || 'Admin@123456';
  rl.close();

  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters');
    process.exit(1);
  }

  const db = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'hotel_db',
  });

  try {
    const hash = await bcrypt.hash(password, 12);

    // Check if admin exists
    const [rows] = await db.query('SELECT id, name, email FROM admins WHERE email = ?', [email]);

    if (rows.length === 0) {
      // Create admin
      await db.query(
        `INSERT INTO admins (name, email, password, role, status) VALUES (?, ?, ?, 'super_admin', 'active')`,
        ['Super Admin', email, hash]
      );
      console.log(`\n✅ Admin account created`);
    } else {
      // Update existing
      await db.query('UPDATE admins SET password = ?, status = "active" WHERE email = ?', [hash, email]);
      console.log(`\n✅ Password updated for: ${rows[0].name} (${rows[0].email})`);
    }

    console.log(`\n🔑 Login credentials:`);
    console.log(`   URL:      http://localhost:3000/admin/login`);
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n⚠️  Change this password after first login via Settings → My Profile\n');
  } finally {
    await db.end();
  }
}

main().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });

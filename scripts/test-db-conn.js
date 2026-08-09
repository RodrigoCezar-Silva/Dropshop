require('dotenv').config();
const mysql = require('mysql2/promise');

const candidates = [];

// primary from .env
candidates.push({
  name: 'env',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mix_promocao'
});

// root with empty password
candidates.push({
  name: 'root-empty',
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: process.env.DB_NAME || 'mix_promocao'
});

// attempt root with current DB_NAME and same password as env (in case user is root but env user was changed)
candidates.push({
  name: 'root-with-env-pass',
  host: 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mix_promocao'
});

(async () => {
  for (const c of candidates) {
    try {
      console.log('Trying candidate:', c.name, `${c.user}@${c.host}:${c.port} db=${c.database}`);
      const pool = mysql.createPool({ host: c.host, port: c.port, user: c.user, password: c.password, database: c.database, waitForConnections: true, connectionLimit: 2 });
      const conn = await pool.getConnection();
      await conn.query('SELECT 1');
      console.log('  -> Connection OK for', c.name);

      // check if admins table exists
      try {
        const [rows] = await conn.query("SELECT COUNT(*) AS cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'admins'", [c.database]);
        const hasAdmins = rows && rows[0] && rows[0].cnt > 0;
        if (hasAdmins) {
          console.log('  -> `admins` table exists. Listing up to 10 admins:');
          const [admins] = await conn.query('SELECT id, usuario, nome, sobrenome, role FROM admins LIMIT 10');
          console.table(admins);
        } else {
          console.log('  -> `admins` table NOT found in database', c.database);
        }
      } catch (e) {
        console.warn('  -> Failed to check admins table:', e.message);
      }

      await conn.release();
      await pool.end();
      return;
    } catch (err) {
      console.log('  -> Candidate failed:', err.code || err.message);
      // continue
    }
  }
  console.error('All candidate credentials failed. Please verify your MySQL credentials and that the DB server is running.');
  process.exit(1);
})();

const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const DB_HOST = process.env.DB_HOST || 'localhost';
  const DB_USER = process.env.DB_USER || 'root';
  const DB_PASS = process.env.DB_PASS || '';
  const DB_NAME = process.env.DB_NAME || process.env.DATABASE || 'dropshop';
  const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
  const EXPORT_TABLES = process.env.EXPORT_TABLES ? process.env.EXPORT_TABLES.split(',').map(s=>s.trim()) : [
    'produtos','clientes','admins','pedidos','compras','comentarios'
  ];
  const SENSITIVE = process.env.SENSITIVE_FIELDS ? process.env.SENSITIVE_FIELDS.split(',').map(s=>s.trim()) : ['senha','password','token','secret'];

  const outDir = path.join(__dirname, '..', 'docs', 'data');
  await fs.mkdir(outDir, { recursive: true });

  const conn = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    port: DB_PORT,
    multipleStatements: false
  });

  console.log('Conectado ao DB', DB_HOST, DB_NAME);

  for (const table of EXPORT_TABLES) {
    try {
      const [rows] = await conn.execute(`SELECT * FROM \`${table}\``);
      const sanitized = rows.map(row => {
        const copy = { ...row };
        for (const field of SENSITIVE) {
          for (const key of Object.keys(copy)) {
            if (key.toLowerCase().includes(field.toLowerCase())) {
              delete copy[key];
            }
          }
        }
        return copy;
      });

      const outPath = path.join(outDir, `${table}.json`);
      await fs.writeFile(outPath, JSON.stringify(sanitized, null, 2), 'utf8');
      console.log(`Exportado ${table} -> ${path.relative(process.cwd(), outPath)}`);
    } catch (err) {
      console.error(`Erro exportando tabela ${table}:`, err.message);
    }
  }

  await conn.end();
  console.log('Exportação finalizada.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

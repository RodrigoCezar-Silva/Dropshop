#!/usr/bin/env node
// Usage: node scripts/fill-default-foto.js --file ./default.jpg [--url http://localhost:3000] [--user adminToken]
// This script updates all clientes with NULL foto to the provided image BLOB.

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const argv = require('minimist')(process.argv.slice(2));
const file = argv.file || argv.f;
if (!file) {
  console.error('Usage: node scripts/fill-default-foto.js --file ./default.jpg');
  process.exit(1);
}
const abs = path.resolve(file);
if (!fs.existsSync(abs)) {
  console.error('File not found:', abs);
  process.exit(1);
}
const data = fs.readFileSync(abs);
const ext = path.extname(abs).toLowerCase().replace('.', '') || 'jpg';
const mime = ext === 'png' ? 'image/png' : (ext === 'webp' ? 'image/webp' : 'image/jpeg');

(async ()=>{
  const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mix_promocao',
    waitForConnections: true,
    connectionLimit: 5
  };
  const pool = mysql.createPool(poolConfig);
  const conn = await pool.getConnection();
  try {
    console.log('Procurando clientes sem foto...');
    const [rows] = await conn.execute('SELECT id FROM clientes WHERE foto IS NULL OR foto = ""');
    if (!rows.length) {
      console.log('Nenhum cliente sem foto encontrado.');
      return process.exit(0);
    }

    console.log(`Encontrados ${rows.length} clientes. Atualizando...`);
    for (const r of rows) {
      try {
        const [res] = await conn.execute('UPDATE clientes SET foto = ?, foto_mime = ? WHERE id = ?', [data, mime, r.id]);
        console.log(`Cliente ${r.id}: updated (affected: ${res.affectedRows})`);
      } catch (e) {
        console.error(`Erro ao atualizar cliente ${r.id}:`, e.message);
      }
    }
    console.log('Pronto.');
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    try { conn.release(); } catch(e){}
    process.exit(0);
  }
})();

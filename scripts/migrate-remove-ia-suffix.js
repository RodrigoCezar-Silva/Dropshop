#!/usr/bin/env node
// Script: remove retroativamente o sufixo " (Atendente IA)" dos autores em respostas
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mix_promocao'
};

async function run() {
  console.log('[migrate] Iniciando migração: remover sufixo " (Atendente IA)"');
  try {
    const pool = mysql.createPool({ ...dbConfig, connectionLimit: 5 });
    const conn = await pool.getConnection();
    const [rows] = await conn.execute('SELECT id, respostas_json FROM reclamacoes');
    let updated = 0;
    for (const r of rows || []) {
      if (!r.respostas_json) continue;
      let respostas;
      try { respostas = JSON.parse(r.respostas_json); } catch { respostas = null; }
      if (!Array.isArray(respostas)) continue;
      let changed = false;
      for (const resp of respostas) {
        if (!resp || !resp.autor) continue;
        if (String(resp.autor).endsWith(' (Atendente IA)')) {
          resp.autor = String(resp.autor).replace(/\s*\(Atendente IA\)\s*$/, '').trim();
          changed = true;
        }
      }
      if (changed) {
        await conn.execute('UPDATE reclamacoes SET respostas_json = ? WHERE id = ?', [JSON.stringify(respostas), r.id]);
        updated++;
      }
    }
    conn.release();
    await pool.end();
    console.log(`[migrate] Atualizado ${updated} registros no banco.`);
  } catch (e) {
    console.warn('[migrate] Falha ao acessar o DB (tenta arquivo fallback):', e && e.message);
  }

  // fallback arquivo
  try {
    const dataFile = path.join(__dirname, '..', 'data', 'reclamacoes.json');
    if (fs.existsSync(dataFile)) {
      const raw = fs.readFileSync(dataFile, 'utf8');
      const lista = JSON.parse(raw || '[]');
      let changedCount = 0;
      for (const item of lista) {
        if (!item.respostas || !Array.isArray(item.respostas)) continue;
        let changed = false;
        for (const resp of item.respostas) {
          if (resp && resp.autor && String(resp.autor).endsWith(' (Atendente IA)')) {
            resp.autor = String(resp.autor).replace(/\s*\(Atendente IA\)\s*$/, '').trim();
            changed = true;
          }
        }
        if (changed) changedCount++;
      }
      if (changedCount) {
        fs.writeFileSync(dataFile, JSON.stringify(lista, null, 2), 'utf8');
        console.log(`[migrate] Atualizado ${changedCount} registros no arquivo ${dataFile}`);
      } else {
        console.log('[migrate] Nenhuma alteração necessária no arquivo fallback.');
      }
    } else {
      console.log('[migrate] Arquivo de fallback não encontrado, ignorando.');
    }
  } catch (e) {
    console.error('[migrate] Erro no processamento do arquivo fallback:', e && e.message);
  }

  console.log('[migrate] Concluído.');
}

run().catch(err => { console.error('Erro:', err && err.message); process.exit(1); });

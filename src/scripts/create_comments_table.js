require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  try {
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mix_promocao',
      waitForConnections: true,
      connectionLimit: 1
    };

    const pool = mysql.createPool(dbConfig);
    const conn = await pool.getConnection();

    console.log('Conectado ao banco:', dbConfig.database);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS comentarios (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        produto_id INT NOT NULL,
        autor VARCHAR(255),
        cliente_id BIGINT NULL,
        texto LONGTEXT NOT NULL,
        nota INT NULL,
        fotos_json LONGTEXT,
        video_json LONGTEXT,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (produto_id),
        INDEX (cliente_id)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS comentario_attachments (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        comentario_id BIGINT NOT NULL,
        filename VARCHAR(500),
        mimetype VARCHAR(120),
        tamanho INT,
        data LONGBLOB,
        url VARCHAR(1000),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (comentario_id)
      )
    `);

    console.log('Tabelas `comentarios` e `comentario_attachments` criadas (ou já existiam).');
    conn.release();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Erro ao criar tabelas de comentarios:', err && err.message);
    process.exit(1);
  }
})();

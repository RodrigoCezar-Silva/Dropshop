require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');

const OUTPUT_DIR = path.resolve(__dirname, '..', 'docs', 'data');

function splitCsv(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasRequiredCiConfig() {
  return Boolean(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);
}

function shouldSkipInCi() {
  return process.env.GITHUB_ACTIONS === 'true' && !hasRequiredCiConfig();
}

function getDbConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? '',
    database: process.env.DB_NAME || 'mix_promocao'
  };
}

function isSensitiveField(columnName, sensitiveFields) {
  const normalizedName = String(columnName || '').toLowerCase();
  return sensitiveFields.some((field) => normalizedName.includes(field));
}

function normalizeValue(value) {
  if (Buffer.isBuffer(value)) {
    return value.toString('base64');
  }

  return value;
}

function sanitizeRow(row, sensitiveFields) {
  return Object.fromEntries(
    Object.entries(row)
      .filter(([columnName]) => !isSensitiveField(columnName, sensitiveFields))
      .map(([columnName, value]) => [columnName, normalizeValue(value)])
  );
}

function getTableFileName(tableName) {
  return `${String(tableName).replace(/[^\w.-]+/g, '_')}.json`;
}

async function getTables(connection, configuredTables) {
  if (configuredTables.length > 0) {
    return configuredTables;
  }

  const [rows] = await connection.query('SHOW TABLES');
  return rows.map((row) => Object.values(row)[0]).filter(Boolean);
}

async function exportTable(connection, tableName, sensitiveFields) {
  const [rows] = await connection.query('SELECT * FROM ??', [tableName]);
  const sanitizedRows = rows.map((row) => sanitizeRow(row, sensitiveFields));
  const outputPath = path.join(OUTPUT_DIR, getTableFileName(tableName));

  await fs.writeFile(outputPath, `${JSON.stringify(sanitizedRows, null, 2)}\n`, 'utf8');
  console.log(`Exported ${sanitizedRows.length} row(s) from ${tableName} to ${path.relative(process.cwd(), outputPath)}`);
}

async function main() {
  if (shouldSkipInCi()) {
    console.log('Skipping DB export because the required database secrets are not configured for this workflow run.');
    return;
  }

  const config = getDbConfig();
  const configuredTables = splitCsv(process.env.EXPORT_TABLES);
  const sensitiveFields = splitCsv(process.env.SENSITIVE_FIELDS).map((field) => field.toLowerCase());

  const connection = await mysql.createConnection(config);

  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const tables = await getTables(connection, configuredTables);

    if (tables.length === 0) {
      console.log('No tables configured for export.');
      return;
    }

    for (const tableName of tables) {
      await exportTable(connection, tableName, sensitiveFields);
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Failed to export database tables to JSON.');
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});

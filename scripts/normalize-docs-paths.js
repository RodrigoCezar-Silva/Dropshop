const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'docs');

function walk(dir, cb) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

function normalizeContent(content) {
  // Remove occurrences of src/public or /src/public
  return content.replace(/("|')?(\/)?src\/public\//g, '$1');
}

try {
  walk(docsDir, (file) => {
    const ext = path.extname(file).toLowerCase();
    if (!['.html', '.htm', '.js', '.css'].includes(ext)) return;
    const content = fs.readFileSync(file, 'utf8');
    const normalized = normalizeContent(content);
    if (normalized !== content) {
      fs.writeFileSync(file, normalized, 'utf8');
      console.log('Normalized:', path.relative(docsDir, file));
    }
  });
} catch (err) {
  console.error('Erro ao normalizar caminhos em docs:', err);
  process.exit(1);
}

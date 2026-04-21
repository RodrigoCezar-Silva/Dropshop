const fs = require('fs');
const path = require('path');

function walk(dir, cb) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

function normalizeFile(file) {
  const ext = path.extname(file).toLowerCase();
  if (!['.html', '.htm', '.css', '.js'].includes(ext)) return;
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace href/src attributes that start with a single slash (but not // or http(s)://)
  content = content.replace(/(href|src)=("|')\/(?!\/|https?:)([^"']*)\2/g, (m, attr, q, p) => {
    return `${attr}=${q}.${path.posix.sep}${p}${q}`;
  });

  // Replace url(/path...) in CSS (avoid urls that are absolute // or http)
  content = content.replace(/url\(\s*\/(?!\/|https?:)([^)]+)\)/g, (m, p1) => {
    return `url(./${p1})`;
  });

  // Also replace occurrences of "/html/", "/css/", "/js/" in strings
  content = content.replace(/("|')\/(html|css|js|assets|images|img|fonts)\//g, (m, q, p) => `${q}.${path.posix.sep}${p}/`);

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Normalized paths in', file);
  }
}

const docsDir = path.resolve(__dirname, '..', 'docs');
if (!fs.existsSync(docsDir)) {
  console.error('docs/ directory not found. Run prepare:docs first.');
  process.exit(1);
}

walk(docsDir, normalizeFile);
console.log('Normalization complete.');

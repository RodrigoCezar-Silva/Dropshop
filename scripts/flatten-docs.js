const fs = require('fs');
const path = require('path');

const docsDir = path.resolve(__dirname, '..', 'docs');
if (!fs.existsSync(docsDir)) {
  console.error('docs/ directory not found. Run prepare:docs first.');
  process.exit(1);
}

function copyAll(srcDir) {
  if (!fs.existsSync(srcDir)) return [];
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  const copied = [];
  for (const e of entries) {
    if (e.isDirectory()) continue;
    const src = path.join(srcDir, e.name);
    const dest = path.join(docsDir, e.name);
    try {
      fs.copyFileSync(src, dest);
      copied.push({ src, dest });
    } catch (err) {
      console.warn('Could not copy', src, err.message);
    }
  }
  return copied;
}

// 1) Copy files from html, css, js into docs root
const htmlDir = path.join(docsDir, 'html');
const cssDir = path.join(docsDir, 'css');
const jsDir = path.join(docsDir, 'js');

const copied = [];
copied.push(...copyAll(htmlDir));
copied.push(...copyAll(cssDir));
copied.push(...copyAll(jsDir));

// 2) Update references inside HTML files in docs root to point to flattened files
function updateHtmlReferences(file) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Replace occurrences like href="html/x.html" or href='html/x.html' -> href="./x.html"
  content = content.replace(/(href|src)=("|')html\/(.+?)\2/g, (m, attr, q, p) => `${attr}=${q}./${p}${q}`);

  // Replace css/ and js/ paths
  content = content.replace(/(href|src)=("|')((css|js)\/[^"']+)\2/g, (m, attr, q, p) => `${attr}=${q}./${path.basename(p)}${q}`);

  // Also fix relative links to start with ./ if missing
  content = content.replace(/(href|src)=("|')([^\.\/\"']+\.(css|js|html))\2/g, (m, attr, q, p) => `${attr}=${q}./${p}${q}`);

  if (content !== original) fs.writeFileSync(file, content, 'utf8');
}

const docsRootFiles = fs.readdirSync(docsDir, { withFileTypes: true })
  .filter(e => e.isFile() && ['.html', '.htm'].includes(path.extname(e.name).toLowerCase()))
  .map(e => path.join(docsDir, e.name));

for (const f of docsRootFiles) updateHtmlReferences(f);

console.log('Flatten complete. Files copied:', copied.map(c => path.basename(c.dest)).join(', '));
console.log('Remember to remove empty folders docs/html, docs/css, docs/js if desired.');

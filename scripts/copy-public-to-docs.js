const fs = require('fs');
const path = require('path');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'src', 'public');
const docsDir = path.join(projectRoot, 'docs');

try {
  // remove docs if exists
  if (fs.existsSync(docsDir)) {
    fs.rmSync(docsDir, { recursive: true, force: true });
  }
  copyRecursive(publicDir, docsDir);
  console.log('Docs prepared in', docsDir);
} catch (e) {
  console.error('Erro ao preparar docs:', e);
  process.exit(1);
}

const fs = require('fs').promises;
const path = require('path');

const targets = [
  path.resolve(__dirname, '..', 'src', 'public', 'css'),
  path.resolve(__dirname, '..', 'docs')
];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const e of entries) {
    const res = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...await walk(res));
    else if (e.isFile() && res.toLowerCase().endsWith('.css')) files.push(res);
  }
  return files;
}

function trimTrailingSpaces(content) {
  return content.replace(/[ \t]+$/gm, '');
}

function collapseBlankLines(content) {
  return content.replace(/\n{3,}/g, '\n\n');
}

function ensureFinalNewline(content) {
  if (!content.endsWith('\n')) return content + '\n';
  return content;
}

async function processFile(file) {
  let content = await fs.readFile(file, 'utf8');
  const orig = content;
  content = content.replace(/\r\n?/g, '\n');
  content = trimTrailingSpaces(content);
  content = collapseBlankLines(content);
  content = ensureFinalNewline(content);
  if (content !== orig) await fs.writeFile(file, content, 'utf8');
  return content !== orig;
}

async function main() {
  const files = new Set();
  for (const t of targets) {
    const f = await walk(t);
    f.forEach(x => files.add(x));
  }
  const report = [];
  for (const f of files) {
    const changed = await processFile(f);
    report.push({ file: f, changed });
  }
  console.log('Targeted CSS fix finished. Files processed:', report.length);
  for (const r of report) console.log(r.changed ? 'FIXED: ' + r.file : 'OK: ' + r.file);
}

main().catch(e => { console.error(e); process.exit(1); });

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

function parseBlocks(content) {
  const blocks = [];
  // naive split by '}'
  const parts = content.split('}');
  for (let p of parts) {
    p = p.trim();
    if (!p) continue;
    const idx = p.indexOf('{');
    if (idx === -1) continue;
    const sel = p.slice(0, idx).trim();
    const body = p.slice(idx + 1).trim();
    blocks.push({ selector: sel, body });
  }
  return blocks;
}

function extractProps(body) {
  const props = {};
  const lines = body.split(/;\s*/).map(l => l.trim()).filter(Boolean);
  for (const l of lines) {
    const idx = l.indexOf(':');
    if (idx === -1) continue;
    const k = l.slice(0, idx).trim();
    const v = l.slice(idx + 1).trim();
    props[k] = v;
  }
  return props;
}

async function main() {
  const files = new Set();
  for (const t of targets) {
    const f = await walk(t);
    f.forEach(x => files.add(x));
  }

  const map = new Map(); // selector -> [{file, props}]

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const blocks = parseBlocks(content);
    for (const b of blocks) {
      // a selector group can have multiple selectors separated by ','
      const sels = b.selector.split(',').map(s => s.trim()).filter(Boolean);
      const props = extractProps(b.body);
      for (const s of sels) {
        if (!map.has(s)) map.set(s, []);
        map.get(s).push({ file, props });
      }
    }
  }

  const duplicates = [];
  for (const [selector, entries] of map.entries()) {
    if (entries.length > 1) {
      // check if all props equal
      const first = JSON.stringify(entries[0].props);
      const diffs = entries.map(e => ({ file: e.file, props: e.props }));
      const allSame = entries.every(e => JSON.stringify(e.props) === first);
      if (!allSame) duplicates.push({ selector, occurrences: diffs });
    }
  }

  const out = [];
  out.push('Duplicate selector report');
  out.push('Found ' + duplicates.length + ' selectors declared multiple times with different properties.');
  for (const d of duplicates) {
    out.push('\nSelector: ' + d.selector);
    for (const occ of d.occurrences) {
      out.push('  - ' + occ.file + '\n    ' + Object.keys(occ.props).slice(0,10).map(k => k + ': ' + occ.props[k]).join('; '));
    }
  }

  const reportPath = path.resolve(__dirname, '..', 'reports');
  await fs.mkdir(reportPath, { recursive: true });
  const outFile = path.join(reportPath, 'duplicate-selectors.txt');
  await fs.writeFile(outFile, out.join('\n'), 'utf8');
  console.log('Report written to', outFile);
}

main().catch(e => { console.error(e); process.exit(1); });

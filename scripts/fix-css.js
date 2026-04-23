const fs = require('fs').promises;
const path = require('path');

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const res = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...await walk(res));
    else if (e.isFile() && res.toLowerCase().endsWith('.css')) files.push(res);
  }
  return files;
}

function dedupeImports(content) {
  const lines = content.split(/\r?\n/);
  const seen = new Set();
  const out = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('@import')) {
      if (seen.has(trimmed)) continue;
      seen.add(trimmed);
    }
    out.push(line);
  }
  return out.join('\n');
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

function fixBraces(content) {
  const open = (content.match(/\{/g) || []).length;
  const close = (content.match(/\}/g) || []).length;
  if (open === close) return { content, changed: false };
  let newContent = content;
  if (open > close) {
    const diff = open - close;
    newContent = content + '\n' + '}'.repeat(diff) + '\n';
    return { content: newContent, changed: true, note: `added ${diff} closing brace(s)` };
  } else {
    // more closing than opening: try to remove trailing } characters
    const trailingCloses = (newContent = content).match(/(}\s*)+$/);
    if (trailingCloses) {
      // remove as many trailing } as needed (but not more than diff)
      const diff = close - open;
      newContent = content.replace(new RegExp('}(\s*)$'), '');
      // safer approach: remove up to diff trailing } characters
      let removed = 0;
      while (removed < diff && newContent.endsWith('}')) {
        newContent = newContent.slice(0, -1);
        removed++;
      }
      return { content: newContent, changed: removed > 0, note: `removed ${removed} trailing closing brace(s)` };
    }
    return { content, changed: false, note: 'unbalanced braces but unable to auto-fix safely' };
  }
}

async function processFile(file) {
  try {
    let content = await fs.readFile(file, 'utf8');
    const original = content;
    content = content.replace(/\r\n?/g, '\n');
    content = dedupeImports(content);
    content = trimTrailingSpaces(content);
    content = collapseBlankLines(content);
    const braceResult = fixBraces(content);
    content = braceResult.content;
    content = ensureFinalNewline(content);

    const changed = content !== original;
    return { file, changed, note: braceResult.note || null, content };
  } catch (e) {
    return { file, changed: false, error: e.message };
  }
}

async function main() {
  const root = path.resolve(__dirname, '..');
  const files = await walk(root);
  const report = [];
  for (const f of files) {
    const res = await processFile(f);
    if (res.error) {
      report.push({ file: f, error: res.error });
      continue;
    }
    if (res.changed) {
      await fs.writeFile(f, res.content, 'utf8');
      report.push({ file: f, changed: true, note: res.note || null });
    } else {
      report.push({ file: f, changed: false });
    }
  }
  console.log('CSS fix script finished. Summary:');
  for (const r of report) {
    if (r.error) console.log(`ERROR: ${r.file} -> ${r.error}`);
    else if (r.changed) console.log(`FIXED: ${r.file}${r.note ? ' ('+r.note+')' : ''}`);
    else console.log(`OK: ${r.file}`);
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });

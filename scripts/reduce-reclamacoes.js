const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'reclamacoes.json');
const backupPath = filePath + '.bak.' + Date.now();
const outPath = path.join(__dirname, '..', 'data', 'reclamacoes.trimmed.json');
const MAX_BYTES = 100 * 1024 * 1024; // 100 MB

function sizeOf(p) {
  try { return fs.statSync(p).size; } catch (e) { return 0; }
}

if (!fs.existsSync(filePath)) {
  console.error('Arquivo não encontrado:', filePath);
  process.exit(1);
}

console.log('Tamanho atual:', sizeOf(filePath), 'bytes');
// backup
fs.copyFileSync(filePath, backupPath);
console.log('Backup criado em', backupPath);

let raw = fs.readFileSync(filePath, 'utf8');
let arr;
try { arr = JSON.parse(raw); } catch (e) { console.error('Erro ao parsear JSON:', e.message); process.exit(2); }

if (!Array.isArray(arr)) {
  console.error('Formato inesperado: espera-se um array de reclamações. Saindo.');
  process.exit(3);
}

// strip heavy fields from an entry
function stripEntry(e) {
  // remove fotos base64
  if (e.fotoBase64) delete e.fotoBase64;
  if (e.fotoMime) delete e.fotoMime;
  // attachments: keep only metadata
  if (Array.isArray(e.anexos)) {
    e.anexos = e.anexos.map(a => {
      if (!a || typeof a === 'string') return a;
      return {
        id: a.id || null,
        originalName: a.originalName || a.name || a.filename || null,
        filename: a.filename || null,
        mimetype: a.mimetype || a.type || null,
        size: a.size || a.tamanho || null,
        url: a.url || null
      };
    });
  }
  if (Array.isArray(e.attachments)) {
    e.attachments = e.attachments.map(a => {
      if (!a || typeof a === 'string') return a;
      return {
        id: a.id || null,
        filename: a.filename || null,
        mimetype: a.mimetype || a.type || null,
        size: a.size || a.tamanho || null,
        url: a.url || null
      };
    });
  }
  // respostas: keep as-is but avoid very long historics? keep
  return e;
}

// sort by id desc (assume newer have larger id) and strip
arr.sort((a,b)=> (b.id||0) - (a.id||0));
arr = arr.map(stripEntry);

function tryWrite(list) {
  fs.writeFileSync(outPath, JSON.stringify(list, null, 2), 'utf8');
  return sizeOf(outPath);
}

let kept = arr.length;
let writtenSize = tryWrite(arr);
console.log('Tamanho após remover campos pesados:', writtenSize, 'bytes (registros kept=', kept, ')');

// if still too big, progressively reduce number of records kept (keep newest first)
let working = arr.slice();
while (writtenSize > MAX_BYTES && kept > 10) {
  // reduce to 80% of current
  kept = Math.max(10, Math.floor(kept * 0.8));
  working = arr.slice(0, kept);
  writtenSize = tryWrite(working);
  console.log('Reduzido para', kept, 'registros -> tamanho', writtenSize);
}

if (writtenSize <= MAX_BYTES) {
  // replace original file with trimmed (after renaming original is already backed up)
  fs.renameSync(outPath, filePath);
  console.log('Arquivo reduzido com sucesso para', writtenSize, 'bytes e salvo em', filePath);
  console.log('Backup original em', backupPath);
} else {
  console.error('Não foi possível reduzir abaixo de', MAX_BYTES, 'bytes. Saindo.');
  // keep trimmed separate
  console.log('Arquivo reduzido parcial salvo em', outPath, 'tamanho', writtenSize);
  process.exit(4);
}

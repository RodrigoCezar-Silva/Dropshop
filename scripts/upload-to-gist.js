const fs = require('fs');
const path = require('path');
const axios = require('axios');

function usage() {
  console.log('Usage: node scripts/upload-to-gist.js --dir <dir> [--create|--gist-id <id>] [--public]');
  process.exit(1);
}

const args = require('minimist')(process.argv.slice(2));
const dir = args.dir || args.d;
const gistId = args['gist-id'] || args.gistId || args.g;
const create = args.create || (!gistId);
const isPublic = args.public || false;

if (!dir) usage();

function walkDir(base) {
  const files = {};
  const entries = fs.readdirSync(base, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(base, e.name);
    if (e.isDirectory()) {
      Object.assign(files, walkDir(full));
    } else if (e.isFile()) {
      const rel = path.relative(dir, full).replace(/\\/g, '/');
      files[rel] = { content: fs.readFileSync(full, 'utf8') };
    }
  }
  return files;
}

const payload = {
  description: `Upload from ${path.basename(process.cwd())} at ${new Date().toISOString()}`,
  public: !!isPublic,
  files: walkDir(dir),
};

const GH_TOKEN = process.env.GH_TOKEN;

if (!GH_TOKEN) {
  const outDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'gist-payload.json');
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), 'utf8');
  console.log('GH_TOKEN not set. Payload written to', outFile);
  console.log('Set GH_TOKEN env var to actually create/update the Gist.');
  process.exit(0);
}

const headers = {
  Authorization: `token ${GH_TOKEN}`,
  'User-Agent': 'dropshop-gist-uploader',
};

async function run() {
  try {
    if (gistId) {
      console.log('Updating gist', gistId);
      const res = await axios.patch(`https://api.github.com/gists/${gistId}`, payload, { headers });
      console.log('Gist updated:', res.data.html_url);
    } else {
      console.log('Creating new gist...');
      const res = await axios.post('https://api.github.com/gists', payload, { headers });
      console.log('Gist created:', res.data.html_url);
    }
  } catch (err) {
    console.error('Erro ao criar/atualizar gist:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

run();

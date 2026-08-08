const fs = require('fs');
const path = require('path');
const axios = require('axios');

function usage() {
  console.log('Usage: node scripts/update-github-file.js --owner owner --repo repo --path repo/path/file --file local/file --branch branch --message "commit message"');
  process.exit(1);
}

const args = require('minimist')(process.argv.slice(2));
const owner = args.owner;
const repo = args.repo;
const repoPath = args.path || args['repo-path'];
const localFile = args.file;
const branch = args.branch || 'main';
const message = args.message || 'Update via script';

if (!owner || !repo || !repoPath || !localFile) usage();

if (!fs.existsSync(localFile)) {
  console.error('Local file not found:', localFile);
  process.exit(1);
}

const content = fs.readFileSync(localFile, 'utf8');
const GH_TOKEN = process.env.GH_TOKEN;

const payload = {
  owner,
  repo,
  path: repoPath,
  message,
  branch,
  content_base64: Buffer.from(content, 'utf8').toString('base64'),
};

if (!GH_TOKEN) {
  const outDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'github-update-payload.json');
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), 'utf8');
  console.log('GH_TOKEN not set. Payload written to', outFile);
  console.log('Set GH_TOKEN env var to actually update the GitHub file.');
  process.exit(0);
}

const headers = {
  Authorization: `token ${GH_TOKEN}`,
  'User-Agent': 'dropshop-github-updater',
  Accept: 'application/vnd.github+json',
};

async function run() {
  try {
    // fetch existing file to get sha
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(repoPath)}?ref=${encodeURIComponent(branch)}`;
    let sha = null;
    try {
      const getRes = await axios.get(getUrl, { headers });
      sha = getRes.data.sha;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log('File does not exist in repo; will create new file.');
      } else {
        throw err;
      }
    }

    const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(repoPath)}`;
    const body = {
      message,
      content: payload.content_base64,
      branch,
    };
    if (sha) body.sha = sha;

    const res = await axios.put(putUrl, body, { headers });
    console.log('Updated file:', res.data.content.html_url || `${owner}/${repo}/${repoPath}`);
  } catch (err) {
    console.error('Erro ao atualizar arquivo no GitHub:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

run();

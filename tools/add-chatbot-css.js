const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'src', 'public', 'html');

function walk(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results.push(...walk(filePath));
    } else {
      if (filePath.endsWith('.html')) results.push(filePath);
    }
  });
  return results;
}

const files = walk(root);
const modified = [];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('/css/chatbot-widget.css')) return;
  const idx = content.indexOf('</head>');
  if (idx === -1) return;
  const insert = '  <link rel="stylesheet" href="/css/chatbot-widget.css" />\n';
  const before = content.slice(0, idx);
  const after = content.slice(idx);
  content = before + insert + after;
  fs.writeFileSync(f, content, 'utf8');
  modified.push(f);
});

console.log('Modified files:', modified.length);
modified.forEach(f => console.log(f));
if (modified.length === 0) console.log('No files modified.');

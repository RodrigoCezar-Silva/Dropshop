const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else if (f.endsWith('.html')) {
      fixFile(full);
    }
  });
}

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  const before = content;
  // Replace href="/css/..." => href="./css/..."
  content = content.replace(/href=\"\/(css\/[^\"]*)\"/g, 'href="./$1"');
  // Replace src="/js/..." => src="./js/..."
  content = content.replace(/src=\"\/(js\/[^\"]*)\"/g, 'src="./$1"');
  // Replace href="/html/..." -> ./html/...
  content = content.replace(/href=\"\/(html\/[^\"]*)\"/g, 'href="./$1"');
  // Replace src="/images/..." -> ./images/...
  content = content.replace(/src=\"\/(images\/[^\"]*)\"/g, 'src="./$1"');

  if (content !== before) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed paths in ${file}`);
  }
}

const docsDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(docsDir)) {
  console.error('docs directory not found');
  process.exit(1);
}
walk(docsDir);
console.log('Done.');

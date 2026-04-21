const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'src', 'public', 'html');
if (!fs.existsSync(root)) {
  console.error('Diretório não encontrado:', root);
  process.exit(1);
}

const files = fs.readdirSync(root).filter(f => f.endsWith('.html'));
let changed = 0;
for (const file of files) {
  const filePath = path.join(root, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const updated = content.replace(/\/src\/public\//g, '/');
  if (updated !== content) {
    // criar backup
    try {
      fs.copyFileSync(filePath, filePath + '.bak');
    } catch (e) {}
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log('Atualizado:', file);
    changed++;
  }
}
console.log(`Concluído. Arquivos atualizados: ${changed}`);

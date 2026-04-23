const fs = require('fs');
const vm = require('vm');
const path = 'd:/IDE/VScode/Dropshop/src/public/js/meu-perfil.js';
try {
  const code = fs.readFileSync(path, 'utf8');
  new vm.Script(code, { filename: path });
  console.log('OK');
} catch (e) {
  console.error('ERROR:', e && e.message);
  if (e && e.stack) console.error(e.stack);
  process.exit(1);
}

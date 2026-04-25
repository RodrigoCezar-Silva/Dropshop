const fs = require('fs');
const p = 'd:\\IDE\\VScode\\Dropshop\\src\\public\\js\\admin-chat-center.js';
try {
  const s = fs.readFileSync(p, 'utf8');
  try {
    new Function(s);
    console.log('OK: syntax valid');
  } catch (e) {
    console.error('SYNTAX_ERROR:', e && e.message);
    if (e && e.stack) console.error(e.stack);
    process.exit(2);
  }
} catch (e) {
  console.error('READ_ERROR', e && e.message);
  process.exit(3);
}

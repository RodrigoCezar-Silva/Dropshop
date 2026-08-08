const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'public');
const destDir = path.join(__dirname, '..', 'docs');

async function copyRecursive(src, dest) {
  const entries = await fs.promises.readdir(src, { withFileTypes: true });
  await fs.promises.mkdir(dest, { recursive: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  try {
    const srcExists = fs.existsSync(srcDir);
    if (!srcExists) {
      console.log(`Fonte não encontrada: ${srcDir}`);
      process.exit(0);
    }

    console.log('Copiando arquivos de public para docs...');
    await copyRecursive(srcDir, destDir);
    console.log('Cópia concluída.');
  } catch (err) {
    console.error('Erro ao copiar public para docs:', err);
    process.exit(1);
  }
}

main();

Como publicar o site via GitHub Pages (docs/)

1) Sincronizar `docs/html` para `docs/` (apenas se seu site estiver em `docs/html`):

Linux / Mac / Git Bash:

```bash
./scripts/copy_docs.sh
```

Windows PowerShell:

```powershell
.\scripts\copy_docs.ps1
```

2) Commit + push:

```bash
git add -A
git commit -m "Publica site: sincroniza docs"
git push origin main
```

3) Workflow CI
- O workflow `.github/workflows/deploy-docs.yml` publica `docs/` para a branch `gh-pages` usando `peaceiris/actions-gh-pages`.

Se muitos arquivos estão retornando 404 por caminhos absolutos (ex.: `/css/style.css`), rode o script que corrige caminhos:

```bash
# instala dependências do Node se ainda não tiver
npm install
node scripts/fix_paths.js
```

4) Configurar GitHub Pages
- Vá em Settings → Pages
- Se estiver usando o workflow, defina Source: Branch `gh-pages` / Folder `/ (root)`
- Se preferir, aponte direto para `main`/`docs` (Branch `main` / Folder `/docs`).

5) Verificação
- Abra https://rodrigocezar-silva.github.io/Dropshop/ e force refresh (Ctrl+F5).
# Dropshop

Projeto web completo de e-commerce com frontend estático, backend Node.js/Express, banco de dados MySQL e deploy para GitHub Pages + Cloud Run.

## Visão geral

- Frontend principal: arquivos HTML/CSS/JS em `src/public`.
- Backend: servidor Express em `src/server.js` com rotas REST e suporte a uploads, CORS, autenticação JWT e integração com banco de dados MySQL.
- Deploy do site estático: `docs/` e `gh-pages` via `gh-pages` ou GitHub Pages.
- Deploy da API: `cloud-run-deploy.sh` para Google Cloud Run.
- Autenticação social: GitHub OAuth com configuração em `docs/auth-config.json`.

## Estrutura do projeto

- `src/server.js` - servidor Express principal, middleware, rotas estáticas e rotas de API.
- `src/public/` - frontend público com páginas HTML, CSS e JavaScript.
- `docs/` - versão preparada do site para GitHub Pages.
- `scripts/` - scripts de apoio, incluindo abertura automática do navegador.
- `cloud-run-deploy.sh` - script de build/deploy para Google Cloud Run.
- `.env.example` - exemplo de variáveis de ambiente para desenvolvimento e produção.
- `package.json` - dependências, scripts e configuração do projeto.

## Dependências principais

- `node >= 18`
- `express` para o servidor HTTP
- `mysql2` para conexão com MySQL
- `dotenv` para carregar variáveis de ambiente
- `jsonwebtoken` para emissão/validação de JWT
- `bcrypt` para hashing de senhas
- `multer` para upload de arquivos
- `cors` para controle de origens permitidas
- `axios` para chamadas HTTP externas
- `sharp` para processamento de imagens
- `gh-pages` e `live-server` para build e testes locais

## Scripts úteis

- `npm start` - inicia o backend em `src/server.js`.
- `npm run dev` - executa live-server em `src/public` na porta 5501, inicia o backend e abre automaticamente o navegador.
- `npm run dev:open` - abre o navegador para o endereço configurado.
- `npm run dev:node5501` - inicia o servidor Node em `PORT=5501`.
- `npm run start:5501:win` - inicia o backend em Windows na porta 5501.
- `npm run start:5501:unix` - inicia o backend em Unix na porta 5501.
- `npm run prepare:docs` - prepara os arquivos estáticos para publicação em `docs/`.
- `npm run build:docs` - mesmo que `prepare:docs`.
- `npm run predeploy` - prepara o site antes do deploy.
- `npm run deploy` - publica a pasta `docs/` usando `gh-pages`.
- `npm run export-db` - exporta dados do banco para JSON (script de apoio).

> Não há testes automatizados configurados no momento.

## Configuração local

1. Instale dependências:

```bash
npm install
```

2. Copie o arquivo de exemplo para um `.env` local:

```bash
copy .env.example .env
```

3. Preencha as variáveis necessárias no `.env`:

- `NODE_ENV` (ex: `sandbox` ou `production`)
- `PORT` (ex: `3000`)
- `SITE_URL` (ex: `http://localhost:3000` ou URL pública da API)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- `CPF_SECRET` (usado para criptografia de CPF)
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (para login GitHub)
- `ALLOWED_ORIGINS` (lista CSV de origens permitidas para CORS)
- `OPENAI_API_KEY` (opcional, para respostas IA automáticas)

4. Inicie em modo de desenvolvimento:

```bash
npm run dev
```

Acesse o site em `http://127.0.0.1:5501/html/index.html` e o backend em `http://localhost:3000`.

## Backend e API

O backend serve:

- arquivos estáticos de `src/public`
- a rota raiz redireciona para `/html/index.html`
- APIs REST para funcionalidades como cadastro, login, produtos, carrinho, pedidos, reclamações, chat e IA
- endpoints opcionais de geração de resposta usando OpenAI via `OPENAI_API_KEY`
- suporte a upload de arquivos de imagem e vídeo

### Rotas importantes

- `/api/reclamacao/generate-response` - gera resposta automática para reclamações
- `/api/cliente/cep/:cep` - busca endereço do cliente pelo CEP e e-mail
- `/api/conversations` e `/api/conversations/:id/messages` - endpoints de chat/atendimento

### Banco de dados

O servidor é configurado para MySQL via `mysql2`.
As variáveis principais são:

- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

O projeto cria e utiliza tabelas para produtos, reclamações, comentários, chat e dados de clientes.

## GitHub Pages / `docs/`

O site estático é preparado em `docs/` e publicado com GitHub Pages.

Para publicar o conteúdo estático:

```bash
npm run deploy
```

Ou, para apenas preparar o site antes de deploy:

```bash
npm run prepare:docs
```

### Configuração do GitHub Pages

- Coloque `docs/auth-config.json` configurado com a URL da API pública
- Se usar workflow CI, configure GitHub Pages para `gh-pages` ou `main/docs`
- Para evitar problemas de caminhos, use os scripts de normalização quando necessário

## Deploy da API no Google Cloud Run

O deploy de exemplo está em `cloud-run-deploy.sh`.

Antes de usar, configure no arquivo ou no ambiente:

- `PROJECT_ID`
- `REGION`
- `SERVICE_NAME`

Exemplo de execução:

```bash
bash cloud-run-deploy.sh
```

O script usa `gcloud builds submit` e `gcloud run deploy`.

Após o deploy, atualize os valores de `SITE_URL`, `JWT_SECRET`, `DB_*` e outras variáveis no Cloud Run.

## GitHub OAuth e login social

O frontend usa `docs/auth-config.json` e `src/public/js/auth-links.js` para montar links de login do GitHub.

Para funcionar corretamente:

- crie um GitHub OAuth App
- configure os callbacks em `https://SEU_API_DOMAIN/auth/github/callback`
- atualize `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET`
- publique o site com `auth-config.json` apontando para a API

## Observações extras

- `package.json` define `type: "commonjs"`, então o projeto usa módulos CommonJS.
- `scripts/open-browser.js` abre o navegador automaticamente após o servidor estar disponível.
- `cloud-run-deploy.sh` está preparado para deploy no Google Cloud Run com imagem Docker.
- Há arquivos de documentação específicos: `README_DEPLOY.md` e `README-PAGES.md`.

## Próximos passos recomendados

- Verificar se o banco MySQL está configurado e se as tabelas estão criadas
- Confirmar que `docs/auth-config.json` aponta para a URL correta da API
- Testar login GitHub localmente com `npm run dev`
- Validar os caminhos estáticos antes de publicar no GitHub Pages

---

<<<<<<< HEAD
Esse README reúne os principais detalhes do seu projeto Dropshop e serve como referência para desenvolvimento, deploy e manutenção.
=======
Esse README reúne os principais detalhes do seu projeto Dropshop e serve como referência para desenvolvimento, deploy e manutenção.
>>>>>>> origin/main

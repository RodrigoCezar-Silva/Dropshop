Guia rápido para deploy da API (Cloud Run)

1) Preparar variáveis de ambiente
- Copie `.env.example` para `.env` e preencha os valores reais.

2) Build local (opcional)
```bash
docker build -t mix-promocao-api .
docker run -p 8080:8080 --env-file .env mix-promocao-api
```

3) Deploy para Google Cloud Run (exemplo)
- Edite `cloud-run-deploy.sh`, definindo `PROJECT_ID`, `REGION` e `SERVICE_NAME`.
- Execute:
```bash
bash cloud-run-deploy.sh
```

4) Ajustes no GitHub OAuth
- No GitHub Developer Settings → OAuth Apps, defina o `Authorization callback URL` como:
  `https://SEU_API_DOMAIN/auth/github/callback` e `https://SEU_API_DOMAIN/auth/github-client/callback`.

5) Configurar `auth-config.json` no GitHub Pages
- No arquivo `docs/auth-config.json` substitua `https://COLOQUE_SUA_API_AQUI` pela URL pública da API (Cloud Run).
- Refaça deploy do GitHub Pages (`npm run deploy` no repo) para que o login nas páginas aponte para a API.

6) Verificação
- Abra o site no GitHub Pages, clique em "Entrar com GitHub" e observe logs do servidor (Cloud Run logs) para ver callbacks e possíveis 404s.

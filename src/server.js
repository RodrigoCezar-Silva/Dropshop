// ...existing code...
// ---------------- CRIPTOGRAFIA DE CPF ---------------- //
const crypto = require("crypto");
const CPF_SECRET = process.env.CPF_SECRET || "chave_super_secreta_cpf";
function encryptCPF(cpf) {
  if (!cpf) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", CPF_SECRET.padEnd(32, "0"), iv);
  let encrypted = cipher.update(cpf, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}
function decryptCPF(encrypted) {
  if (!encrypted) return null;
  const [ivHex, encryptedData] = encrypted.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", CPF_SECRET.padEnd(32, "0"), iv);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
// ---------------- DEPENDÊNCIAS ---------------- //
require("dotenv").config();

const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Usar memória para evitar salvar arquivos físicos no servidor (anexos serão embutidos como data-URI)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB cap por arquivo
  fileFilter: (req, file, cb) => {
    if (!file || !file.mimetype) return cb(null, false);
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) return cb(null, true);
    return cb(new Error('Apenas imagens e vídeos são permitidos.'));
  }
});
const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const axios = require("axios");
// const nodemailer = require("nodemailer"); // Removido para evitar duplicidade

const app = express();
const PORT = Number(process.env.PORT || 3000);
const SECRET = process.env.JWT_SECRET || "dev_secret_mix_promocao";
const NODE_ENV = (process.env.NODE_ENV || "sandbox").toLowerCase();
const EM_PRODUCAO = NODE_ENV === "production";

// ---------------- BANCO / AMBIENTE ---------------- //
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "mix_promocao",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

async function createDbConnection() {
  const connection = await pool.getConnection();
  const release = connection.release.bind(connection);
  connection.end = async () => release();
  return connection;
}

function extrairPrecoNumero(valor) {
  if (typeof valor === "number") return valor;
  if (!valor) return 0;
  return Number.parseFloat(String(valor).replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
}

function formatarPrecoBanco(valor) {
  const numero = Number(valor || 0);
  if (!numero) return "";
  return `R$ ${numero.toFixed(2).replace(".", ",")}`;
}

function parseJsonSeguro(valor, fallback = []) {
  if (!valor) return fallback;
  try {
    return JSON.parse(valor);
  } catch {
    return fallback;
  }
}

function parseDataCadastro(valor) {
  if (!valor) return null;
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) return valor;

  const texto = String(valor).trim();
  const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (br) {
    const [, dia, mes, ano, hora = "00", minuto = "00"] = br;
    return new Date(`${ano}-${mes}-${dia}T${hora}:${minuto}:00`);
  }

  const data = new Date(texto);
  return Number.isNaN(data.getTime()) ? null : data;
}

function formatarDataCadastro(valor) {
  if (!valor) return "";
  const data = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function mapearProdutoBanco(produto) {
  return {
    id: produto.id,
    nome: produto.nome,
    nomeDetalhes: produto.nome_detalhes || "",
    categoria: produto.categoria || "outros",
    subcategoria: produto.subcategoria || "",
    precoAntigo: formatarPrecoBanco(produto.preco_antigo),
    precoAtual: formatarPrecoBanco(produto.preco_atual),
    desconto: produto.desconto || "",
    imagem: produto.imagem || "",
    video: produto.video || "",
    descricao: produto.descricao || "",
    pagamento: parseJsonSeguro(produto.pagamento_json, []),
    imagensExtras: parseJsonSeguro(produto.imagens_extras_json, []),
    quantidade: produto.quantidade || 1,
    dataCadastro: formatarDataCadastro(produto.data_cadastro),
    visualizacoes: produto.visualizacoes || 0
  };
}

function exigirAdmin(req, res, next) {
  if (req.usuario?.role !== "admin") {
    return res.status(403).json({ sucesso: false, mensagem: "Apenas administradores podem alterar produtos." });
  }
  next();
}

async function garantirTabelas() {
  const connection = await createDbConnection();
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      nome_detalhes VARCHAR(255),
      categoria VARCHAR(100) NOT NULL DEFAULT 'outros',
      subcategoria VARCHAR(100),
      preco_antigo DECIMAL(10,2) NULL,
      preco_atual DECIMAL(10,2) NOT NULL,
      desconto VARCHAR(60),
      imagem VARCHAR(500),
      video VARCHAR(500),
      descricao TEXT,
      pagamento_json LONGTEXT,
      imagens_extras_json LONGTEXT,
      quantidade INT NOT NULL DEFAULT 1,
      visualizacoes INT NOT NULL DEFAULT 0,
      data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  await connection.execute(`
    ALTER TABLE produtos
    ADD COLUMN IF NOT EXISTS visualizacoes INT NOT NULL DEFAULT 0
  `);
  // Tabela para reclamações de clientes
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS reclamacoes (
      id BIGINT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      telefone VARCHAR(60),
      assunto VARCHAR(255) NOT NULL,
      reclamacao LONGTEXT NOT NULL,
      anexos_json LONGTEXT,
      data_reclamacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(40) DEFAULT 'pendente',
      respostas_json LONGTEXT,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  // Tabela para anexos de reclamações (opcional: armazena em BLOB quando configurado)
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS reclamacao_attachments (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      reclamacao_id BIGINT NOT NULL,
      filename VARCHAR(500),
      mimetype VARCHAR(120),
      tamanho INT,
      data LONGBLOB,
      url VARCHAR(1000),
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX (reclamacao_id)
    )
  `);
  // Tabela para comentários/avaliacoes de produtos
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS comentarios (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      produto_id INT NOT NULL,
      autor VARCHAR(255),
      cliente_id BIGINT NULL,
      texto LONGTEXT NOT NULL,
      nota INT NULL,
      fotos_json LONGTEXT,
      video_json LONGTEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX (produto_id),
      INDEX (cliente_id)
    )
  `);
  // Tabela para anexos dos comentarios (opcional)
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS comentario_attachments (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      comentario_id BIGINT NOT NULL,
      filename VARCHAR(500),
      mimetype VARCHAR(120),
      tamanho INT,
      data LONGBLOB,
      url VARCHAR(1000),
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX (comentario_id)
    )
  `);
  // Tabela para pedidos
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      cliente_id BIGINT NULL,
      cliente_nome VARCHAR(255),
      cliente_email VARCHAR(255),
      total DECIMAL(12,2) NOT NULL DEFAULT 0,
      subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
      itens_json LONGTEXT,
      frete_json LONGTEXT,
      forma_pagamento VARCHAR(80),
      status VARCHAR(80) DEFAULT 'pendente',
      data_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX (cliente_id)
    )
  `);
  // Tabela adicional 'compras' para histórico detalhado de compras
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS compras (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      pedido_id BIGINT NULL,
      cliente_id BIGINT NULL,
      cliente_json LONGTEXT,
      itens_json LONGTEXT,
      pagamento_json LONGTEXT,
      frete_json LONGTEXT,
      total DECIMAL(12,2) NOT NULL DEFAULT 0,
      subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
      status VARCHAR(80) DEFAULT 'pendente',
      data_compra DATETIME DEFAULT CURRENT_TIMESTAMP,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX (cliente_id),
      INDEX (pedido_id)
    )
  `);
  await connection.end();
}

function validarPagBankConfig(res) {
  if (PAGBANK_TOKEN) return true;
  // Em ambiente de desenvolvimento permitimos um modo fake para testes locais
  if (typeof PAGBANK_FAKE !== 'undefined' && PAGBANK_FAKE) {
    console.warn('PagBank: token não configurado — modo FAKE ativado para desenvolvimento');
    return true;
  }
  res.status(500).json({
    sucesso: false,
    mensagem: "PagBank não configurado. Defina o token no arquivo .env antes de hospedar."
  });
  return false;
}

// ---------------- PAGBANK CONFIG ---------------- //
const PAGBANK_TOKEN = EM_PRODUCAO
  ? process.env.PAGBANK_TOKEN_PRODUCTION
  : process.env.PAGBANK_TOKEN_SANDBOX;
const PAGBANK_API = EM_PRODUCAO
  ? "https://api.pagseguro.com"
  : "https://sandbox.api.pagseguro.com";
// Se não houver token em desenvolvimento, ativar modo fake para testes locais
const PAGBANK_FAKE = (! (process.env.PAGBANK_TOKEN_PRODUCTION || process.env.PAGBANK_TOKEN_SANDBOX) && !EM_PRODUCAO);
const PAGBANK_NOTIFICATION_URL = process.env.PAGBANK_NOTIFICATION_URL || `http://localhost:${PORT}/api/pagbank/notificacao`;
const SITE_URL = process.env.SITE_URL || `http://localhost:${PORT}`;

const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://127.0.0.1:5501",
  "http://localhost:5501",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  SITE_URL
].filter(Boolean);

// ---------------- MIDDLEWARES ---------------- //
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------- AUTENTICAÇÃO ---------------- //
function autenticarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ sucesso: false, mensagem: "Token não fornecido!" });

  jwt.verify(token, SECRET, (err, usuario) => {
    if (err) return res.status(403).json({ sucesso: false, mensagem: "Token inválido ou expirado!" });
    req.usuario = usuario;
    next();
  });
}

// Rota de auto-login para desenvolvimento: gera token de teste
app.get('/dev/auto-login', (req, res) => {
  if (EM_PRODUCAO) return res.status(404).json({ sucesso: false, mensagem: 'Unavailable in production' });
  try {
    const usuarioTeste = {
      id: Number(process.env.DEV_CLIENTE_ID || 99999),
      nome: process.env.DEV_CLIENTE_NOME || 'Dev',
      sobrenome: process.env.DEV_CLIENTE_SOBRENOME || 'Tester',
      email: process.env.DEV_CLIENTE_EMAIL || 'dev@local',
      role: 'cliente'
    };
    const token = jwt.sign({ usuario: usuarioTeste.email, id: usuarioTeste.id, nome: usuarioTeste.nome, sobrenome: usuarioTeste.sobrenome, role: 'cliente' }, SECRET, { expiresIn: '7d' });
    // aceitar param returnTo para redirecionar de volta após login
    const { returnTo } = req.query || {};
    return res.json({ sucesso: true, token, usuario: usuarioTeste, returnTo: returnTo || null });
  } catch (e) {
    console.error('Erro /dev/auto-login', e && e.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao gerar token dev' });
  }
});

// ---------------- ROTAS PROTEGIDAS ---------------- //
app.get("/area-restrita", autenticarToken, (req, res) => {
  res.json({ sucesso: true, mensagem: `Bem-vindo, ${req.usuario.usuario || req.usuario.email}!` });
});

// ---------------- SERVIR ARQUIVOS ESTÁTICOS ---------------- //
// Serve em /src/public/* (compatível com os caminhos usados nos HTMLs)
app.use("/src/public", express.static(path.join(__dirname, "public")));
// Serve também na raiz (para /html/*, /css/*, /js/*)
app.use(express.static(path.join(__dirname, "public")));

// ---------------- ROTAS HTML ---------------- //
// Redireciona a raiz para /html/index.html (navegação relativa funciona)
app.get("/", (req, res) => res.redirect("/html/index.html"));
app.get("/trocas-devolucoes", (req, res) => res.sendFile(path.join(__dirname, "public/html/trocas-devolucoes.html")));

// ---------------- ROTAS DE API ---------------- //

// Endpoint para gerar resposta automática via IA (opcional: usa OPENAI_API_KEY)
app.post('/api/reclamacao/generate-response', async (req, res) => {
  try {
    const { id, text, save } = req.body || {};
    let complaintText = text || '';
    let clientName = 'cliente';
    // buscar reclamação no banco se id fornecido
    if (id) {
      try {
        const conn = await createDbConnection();
        const [rows] = await conn.execute('SELECT nome, reclamacao FROM reclamacoes WHERE id = ? LIMIT 1', [id]);
        await conn.end();
        if (rows && rows[0]) {
          clientName = rows[0].nome || clientName;
          complaintText = complaintText || rows[0].reclamacao || complaintText;
        }
      } catch (e) {
        console.warn('Falha ao buscar reclamacao para IA:', e && e.message);
      }
    }

    const systemPrompt = `Você é um atendente virtual amigável que responde clientes em Português (pt-BR). Seja empático, objetivo e ofereça próximos passos.`;
    const userPrompt = `Cliente: ${clientName}\nMensagem: ${complaintText}\nGere uma resposta curta, clara, e profissional em português. Assine com nome completo do atendente e sugira prazo de resposta de até 48 horas.`;

    // Se houver chave OpenAI, chamar API externa
    if (process.env.OPENAI_API_KEY) {
      try {
        const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
        const payload = {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 500,
          temperature: 0.3
        };
        const resp = await axios.post('https://api.openai.com/v1/chat/completions', payload, {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
        });
        const textOut = resp.data?.choices?.[0]?.message?.content || '';
        const autorMatch = textOut.match(/Atenciosamente,?\s*\n*([^\n]+)/i);
        const autor = (autorMatch && autorMatch[1]) ? autorMatch[1].trim() : (process.env.IA_NAME || 'Sofia Lima');

        // opcionalmente salvar resposta no banco
        if (save && id) {
          try {
            const conn2 = await createDbConnection();
            const [rows] = await conn2.execute('SELECT respostas_json FROM reclamacoes WHERE id = ? LIMIT 1', [id]);
            let respostas = [];
            if (rows && rows[0] && rows[0].respostas_json) respostas = JSON.parse(rows[0].respostas_json || '[]');
            respostas.push({ texto: textOut, data: new Date().toLocaleString('pt-BR'), autor });
            await conn2.execute('UPDATE reclamacoes SET respostas_json = ?, status = ? WHERE id = ?', [JSON.stringify(respostas), 'respondida', id]);
            await conn2.end();
          } catch (e) { console.warn('Falha ao salvar resposta IA no DB:', e && e.message); }
        }

        return res.json({ sucesso: true, texto: textOut, autor, origem: 'openai' });
      } catch (e) {
        console.error('Erro chamada OpenAI:', e && (e.response?.data || e.message));
        // cair para fallback
      }
    }

    // Fallback: resposta gerada localmente
    const iaName = process.env.IA_NAME || 'Sofia Lima';
    const textoAuto = `Olá ${clientName},\n\nObrigado por entrar em contato sobre "${complaintText}". Lamento que você tenha passado por isso. Recebi sua mensagem: "${complaintText}". Vamos analisar e tomar as providências necessárias o mais rápido possível. Entraremos em contato com atualizações em até 48 horas.\n\nAtenciosamente,\n${iaName}`;

    if (save && id) {
      try {
        const conn3 = await createDbConnection();
        const [rows] = await conn3.execute('SELECT respostas_json FROM reclamacoes WHERE id = ? LIMIT 1', [id]);
        let respostas = [];
        if (rows && rows[0] && rows[0].respostas_json) respostas = JSON.parse(rows[0].respostas_json || '[]');
        respostas.push({ texto: textoAuto, data: new Date().toLocaleString('pt-BR'), autor: iaName });
        await conn3.execute('UPDATE reclamacoes SET respostas_json = ?, status = ? WHERE id = ?', [JSON.stringify(respostas), 'respondida', id]);
        await conn3.end();
      } catch (e) { console.warn('Falha ao salvar resposta fallback no DB:', e && e.message); }
    }

    return res.json({ sucesso: true, texto: textoAuto, autor: iaName, origem: 'fallback' });
  } catch (err) {
    console.error('Erro /api/reclamacao/generate-response:', err && err.message);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao gerar resposta IA', detalhes: err && err.message });
  }
});

// Buscar endereço do cliente pelo CEP e e-mail
app.get("/api/cliente/cep/:cep", async (req, res) => {
  try {
    const { cep } = req.params;
    const { email } = req.query;
    if (!cep || !email) return res.status(400).json({ sucesso: false, mensagem: "CEP e e-mail obrigatórios." });
    const connection = await createDbConnection();
    const [rows] = await connection.execute(
      "SELECT rua, bairro, numero, complemento, estado, cep FROM clientes WHERE email = ? AND cep = ? LIMIT 1",
      [email, cep]
    );
    await connection.end();
    if (!rows.length) return res.status(404).json({ sucesso: false, mensagem: "Endereço não encontrado para este CEP." });
    const endereco = rows[0];
    res.json({ sucesso: true, endereco });
  } catch (error) {
    res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar endereço.", detalhes: error.message });
  }
});

// Endpoint para receber reclamação com anexos (até 5 imagens e 1 vídeo)
app.post('/api/reclamacao', upload.array('anexos', 6), async (req, res) => {
  try {
    const { nome, email, telefone, assunto, reclamacao } = req.body;
    console.debug('[server] POST /api/reclamacao recebida:', { nome, email, telefone, assunto, anexosCount: (req.files || []).length });
    if (!nome || !email || !assunto || !reclamacao) {
      return res.status(400).json({ sucesso: false, mensagem: 'Campos obrigatórios ausentes.' });
    }

    const files = req.files || [];
    // Validações: imagens <=5 (max 5), videos <=1
    let imgCount = 0, videoCount = 0;
    for (const f of files) {
      if (f.mimetype.startsWith('image/')) imgCount++;
      if (f.mimetype.startsWith('video/')) videoCount++;
    }
    if (imgCount > 5) return res.status(400).json({ sucesso: false, mensagem: 'Máximo 5 imagens permitido.' });
    if (videoCount > 1) return res.status(400).json({ sucesso: false, mensagem: 'Máximo 1 vídeo permitido.' });

    // Construir objeto de anexos: não salvar em disco — iremos persistir os dados no banco (BLOB)
    const anexos = [];
    if (files && files.length) {
      for (const f of files) {
        anexos.push({ originalName: f.originalname, mimetype: f.mimetype, size: f.size, url: null });
      }
    }

    const novo = {
      id: Date.now(),
      nome,
      email,
      telefone: telefone || null,
      assunto,
      reclamacao,
      anexos,
      data: new Date().toISOString(),
      status: 'pendente',
      respostas: []
    };

    // Garantir que exista um registro em clientes (upsert por email)
    try {
      const connClient = await createDbConnection();
      try {
        const [rows] = await connClient.execute("SELECT id, telefone FROM clientes WHERE email = ?", [email]);
        if (rows && rows.length) {
          // Atualiza nome/telefone se necessário
          await connClient.execute("UPDATE clientes SET nome = ?, telefone = ? WHERE email = ?", [nome || rows[0].nome, telefone || rows[0].telefone, email]);
        } else {
          const senhaAleatoria = crypto.randomBytes(16).toString('hex');
          const hash = await bcrypt.hash(senhaAleatoria, 10);
          await connClient.execute(
            "INSERT INTO clientes (nome, sobrenome, email, telefone, senha_hash) VALUES (?, ?, ?, ?, ?)",
            [nome || '', '', email, telefone || null, hash]
          );
        }
      } catch (e) {
        console.warn('Falha ao sincronizar cliente por email (não bloqueante):', e && e.message);
      }
      await connClient.end();
    } catch (e) {
      console.warn('Sem conexão com DB para upsert cliente (seguindo com fallback):', e && e.message);
    }

    // Adicionar resposta automática de desculpas e prazo de até 5 dias úteis
    try {
      // nomes completos para a atendente IA (primeiro + sobrenome)
      const atendentes = [
        'Sofia Martins', 'Lucas Almeida', 'Ana Costa', 'Miguel Pereira',
        'Beatriz Rocha', 'Rafael Oliveira', 'Camila Sousa', 'Mariana Lima',
        'Eduardo Carvalho', 'Fernanda Araújo'
      ];
      const escolhido = atendentes[Math.floor(Math.random() * atendentes.length)];
      const nomeAtendente = escolhido; // mostrar apenas o nome do atendente sem rótulo "(Atendente IA)"
      const prazo = 'até 5 dias úteis';
      const textoAuto = `Olá ${nome},\n\nObrigado por entrar em contato sobre "${assunto}". Lamento que você tenha passado por isso. Recebi sua mensagem: "${reclamacao}". Vamos analisar e tomar as providências necessárias o mais rápido possível. Entraremos em contato com atualizações em até 48 horas.\n\nAtenciosamente,\n${nomeAtendente}`;
      const respostaAuto = { texto: textoAuto, data: new Date().toLocaleString('pt-BR'), autor: nomeAtendente };
      novo.respostas.push(respostaAuto);
      // marcar como respondida automaticamente para refletir no admin/cliente
      novo.status = 'respondida';
    } catch (e) {
      console.warn('Erro ao gerar resposta automática:', e && e.message);
    }

    // Tenta inserir no banco de dados; se falhar, grava em arquivo como fallback
    try {
      const connection = await createDbConnection();
      await connection.execute(
        `INSERT INTO reclamacoes (id, nome, email, telefone, assunto, reclamacao, anexos_json, data_reclamacao, status, respostas_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [novo.id, novo.nome, novo.email, novo.telefone, novo.assunto, novo.reclamacao, JSON.stringify(novo.anexos), novo.data, novo.status, JSON.stringify(novo.respostas)]
      );
      await connection.end();

      // Persistir metadados dos anexos na tabela `reclamacao_attachments` e atualizar anexos_json
        try {
          // Persistir todos os anexos no banco como BLOB (evita problemas de paths/servidor estático)
          if (files && files.length) {
            const connAtt = await createDbConnection();
            const attachmentsMeta = [];
            for (const f of files) {
              try {
                const dataBuffer = f.buffer;
                const [result] = await connAtt.execute(
                  `INSERT INTO reclamacao_attachments (reclamacao_id, filename, mimetype, tamanho, data, url) VALUES (?, ?, ?, ?, ?, ?)`,
                  [novo.id, f.originalname, f.mimetype, f.size, dataBuffer, null]
                );
                const insertId = result && (result.insertId || result[0] && result[0].insertId) ? (result.insertId || (result[0] && result[0].insertId)) : null;
                // construir URL que será servida pelo endpoint /api/reclamacao/attachment/:id
                const url = insertId ? `/api/reclamacao/attachment/${insertId}` : null;
                attachmentsMeta.push({ id: insertId, filename: f.originalname, mimetype: f.mimetype, size: f.size, url: url, storedInDb: true, enviadoPor: { nome: novo.nome, email: novo.email } });
              } catch (e) { console.warn('Falha ao inserir anexo em reclamacao_attachments (silencioso):', e && e.message); }
            }
            await connAtt.end();

            // Atualiza o campo anexos_json da reclamação com os metadados finais
            try {
              const connUpd = await createDbConnection();
              await connUpd.execute(`UPDATE reclamacoes SET anexos_json = ? WHERE id = ?`, [JSON.stringify(attachmentsMeta), novo.id]);
              await connUpd.end();
              // atualizar objeto que será retornado ao cliente
              novo.anexos = attachmentsMeta;
            } catch (e) {
              console.warn('Falha ao atualizar anexos_json na reclamacoes (silencioso):', e && e.message);
            }
          }
        } catch (e) {
          console.warn('Erro ao persistir attachments no DB (silencioso):', e && e.message);
        }

      // tentar enviar e-mail automático de confirmação/desculpas (silencioso se SMTP não configurado)
      (async () => {
        try {
          if (transporter && process.env.SMTP_USER) {
            const assuntoEmail = `Recebemos sua reclamação - MIX-PROMOÇÃO`;
            const textoSimples = novo.respostas && novo.respostas.length ? novo.respostas[0].texto : `Recebemos sua reclamação e vamos analisá-la.`;
            await transporter.sendMail({
              from: process.env.SMTP_FROM || process.env.SMTP_USER,
              to: novo.email,
              subject: assuntoEmail,
              text: textoSimples,
              html: `<p>${textoSimples.replace(/\n/g,'<br>')}</p><p>Prazo estimado: <strong>até 5 dias úteis</strong>.</p>`
            }).catch(err => console.warn('Falha ao enviar e-mail automático (silencioso):', err && err.message));
          }
        } catch (e) { console.warn('Erro no envio de email automático:', e && e.message); }
      })();

      return res.json({ sucesso: true, mensagem: 'Reclamação enviada e armazenada no banco.', reclamacao: novo, gravadoNoBanco: true });
    } catch (dbErr) {
      console.warn('Falha ao inserir reclamacao no DB, usando fallback para arquivo:', dbErr && dbErr.message, dbErr && dbErr.stack);
      // fallback para arquivo
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const dataFile = path.join(dataDir, 'reclamacoes.json');
      let lista = [];
      try { lista = JSON.parse(fs.readFileSync(dataFile, 'utf8') || '[]'); } catch { lista = JSON.parse(localStorageFallback() || '[]') || []; }
      lista.push(novo);
      fs.writeFileSync(dataFile, JSON.stringify(lista, null, 2), 'utf8');

      // enviar e-mail também no fallback (silencioso)
      (async () => {
        try {
          if (transporter && process.env.SMTP_USER) {
            const assuntoEmail = `Recebemos sua reclamação - MIX-PROMOÇÃO`;
            const textoSimples = novo.respostas && novo.respostas.length ? novo.respostas[0].texto : `Recebemos sua reclamação e vamos analisá-la.`;
            await transporter.sendMail({
              from: process.env.SMTP_FROM || process.env.SMTP_USER,
              to: novo.email,
              subject: assuntoEmail,
              text: textoSimples,
              html: `<p>${textoSimples.replace(/\n/g,'<br>')}</p><p>Prazo estimado: <strong>até 5 dias úteis</strong>.</p>`
            }).catch(err => console.warn('Falha ao enviar e-mail automático (silencioso):', err && err.message));
          }
        } catch (e) { console.warn('Erro no envio de email automático (fallback):', e && e.message); }
      })();

      return res.json({ sucesso: true, mensagem: 'Reclamação enviada (salva em arquivo).', reclamacao: novo, gravadoNoBanco: false });
    }
  } catch (err) {
    console.error('Erro /api/reclamacao:', err);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao processar reclamação.' });
  }
});

// Listar reclamações (API pública para admin consumir)
app.get('/api/reclamacoes', async (req, res) => {
  try {
    // tenta buscar do banco
    try {
      const connection = await createDbConnection();
      const { email } = req.query || {};
      let rows;
      if (email) {
        const lower = (String(email || '')).trim().toLowerCase();
        const [r] = await connection.execute('SELECT * FROM reclamacoes WHERE LOWER(email) = ? ORDER BY data_reclamacao DESC', [lower]);
        rows = r;
      } else {
        const [r] = await connection.execute('SELECT * FROM reclamacoes ORDER BY data_reclamacao DESC');
        rows = r;
      }
      await connection.end();
      const lista = (rows || []).map(r => ({
        id: r.id,
        nome: r.nome,
        email: r.email,
        telefone: r.telefone,
        assunto: r.assunto,
        reclamacao: r.reclamacao,
        anexos: parseJsonSeguro(r.anexos_json, []),
        data: r.data_reclamacao ? new Date(r.data_reclamacao).toLocaleString('pt-BR') : '',
        status: r.status || 'pendente',
        respostas: parseJsonSeguro(r.respostas_json, [])
      }));

      // buscar attachments armazenados na tabela separada e anexar metadados
      try {
        const connAtt = await createDbConnection();
        for (const item of lista) {
          try {
            const [atts] = await connAtt.execute('SELECT id, filename, mimetype, tamanho, url, OCTET_LENGTH(data) as data_length FROM reclamacao_attachments WHERE reclamacao_id = ?', [item.id]);
                if (atts && atts.length) {
                  const baseUrl = (process.env.SITE_URL && process.env.SITE_URL !== '') ? process.env.SITE_URL : `${req.protocol}://${req.get('host')}`;
                  item.attachments = atts.map(a => {
                    let url = a.url || (a.data_length ? `/api/reclamacao/attachment/${a.id}` : null);
                    if (url && url.startsWith('/')) url = `${baseUrl}${url}`;
                    return { id: a.id, filename: a.filename, mimetype: a.mimetype, size: a.tamanho, url: url, storedInDb: !!a.data_length };
                  });
                } else {
                  item.attachments = [];
                }
          } catch (e) { item.attachments = []; }
        }
        await connAtt.end();
      } catch (e) { console.warn('Erro ao buscar attachments para reclamacoes:', e && e.message); }
      // buscar fotos dos clientes relacionados (por email) e anexar fotoBase64/fotoMime quando disponível
      try {
        const emails = Array.from(new Set(lista.map(i => (i.email || '').toLowerCase()).filter(Boolean)));
        if (emails.length) {
          const connCli = await createDbConnection();
          // construir placeholders
          const placeholders = emails.map(() => '?').join(',');
          const [clientes] = await connCli.execute(`SELECT email, foto, foto_mime FROM clientes WHERE LOWER(email) IN (${placeholders})`, emails);
          await connCli.end();
          const mapa = {};
          for (const c of clientes || []) {
            try {
              if (c.foto) {
                const b64 = Buffer.from(c.foto).toString('base64');
                mapa[(c.email||'').toLowerCase()] = { fotoBase64: b64, fotoMime: c.foto_mime || null };
              } else {
                mapa[(c.email||'').toLowerCase()] = null;
              }
            } catch (e) { mapa[(c.email||'').toLowerCase()] = null; }
          }
          for (const item of lista) {
            const m = mapa[(item.email||'').toLowerCase()];
            if (m && m.fotoBase64) { item.fotoBase64 = m.fotoBase64; item.fotoMime = m.fotoMime || 'image/jpeg'; }
          }
        }
      } catch (e) { console.warn('Erro ao anexar fotos de clientes nas reclamacoes:', e && e.message); }

      return res.json(lista);
    } catch (dbErr) {
      console.warn('Falha ao consultar reclamacoes no DB, usando fallback arquivo:', dbErr && dbErr.message);
      const dataFile = path.join(__dirname, '..', 'data', 'reclamacoes.json');
      if (!fs.existsSync(dataFile)) return res.json([]);
      const lista = JSON.parse(fs.readFileSync(dataFile, 'utf8') || '[]');
      return res.json(lista);
    }
  } catch (err) {
    console.error('Erro /api/reclamacoes:', err);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao listar reclamacoes.' });
  }
});

// Atualizar reclamação (PUT) - usado para editar/reenviar
app.put('/api/reclamacoes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    // campos permitidos: assunto, reclamacao, status, anexos, respostas
    const campos = {};
    if (body.assunto !== undefined) campos.assunto = body.assunto;
    if (body.reclamacao !== undefined) campos.reclamacao = body.reclamacao;
    if (body.status !== undefined) campos.status = body.status;
    if (body.anexos !== undefined) campos.anexos_json = JSON.stringify(body.anexos);
    if (body.respostas !== undefined) campos.respostas_json = JSON.stringify(body.respostas);

    if (!Object.keys(campos).length) return res.status(400).json({ sucesso: false, mensagem: 'Nenhum campo para atualizar.' });

    try {
      const connection = await createDbConnection();
      const sets = Object.keys(campos).map(k => `${k} = ?`).join(', ');
      const values = Object.keys(campos).map(k => campos[k]);
      values.push(id);
      await connection.execute(`UPDATE reclamacoes SET ${sets} WHERE id = ?`, values);
      await connection.end();
      return res.json({ sucesso: true, mensagem: 'Reclamação atualizada no banco.' });
    } catch (dbErr) {
      console.warn('Falha ao atualizar reclamacao no DB, fallback para arquivo:', dbErr && dbErr.message);
      // fallback arquivo
      const dataFile = path.join(__dirname, '..', 'data', 'reclamacoes.json');
      let lista = [];
      try { lista = JSON.parse(fs.readFileSync(dataFile, 'utf8') || '[]'); } catch { lista = []; }
      const idx = lista.findIndex(x => String(x.id) === String(id));
      if (idx === -1) return res.status(404).json({ sucesso: false, mensagem: 'Reclamação não encontrada.' });
      if (body.assunto !== undefined) lista[idx].assunto = body.assunto;
      if (body.reclamacao !== undefined) lista[idx].reclamacao = body.reclamacao;
      if (body.status !== undefined) lista[idx].status = body.status;
      if (body.anexos !== undefined) lista[idx].anexos = body.anexos;
      if (body.respostas !== undefined) lista[idx].respostas = body.respostas;
      fs.writeFileSync(dataFile, JSON.stringify(lista, null, 2), 'utf8');
      return res.json({ sucesso: true, mensagem: 'Reclamação atualizada (arquivo).' });
    }
  } catch (err) {
    console.error('Erro PUT /api/reclamacoes/:id', err);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar reclamacao.' });
  }
});

// Deletar reclamação e anexos associados
app.delete('/api/reclamacoes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // tentar remover do DB
    try {
      const connection = await createDbConnection();
      // apagar attachments relacionados
      await connection.execute('DELETE FROM reclamacao_attachments WHERE reclamacao_id = ?', [id]);
      // apagar a reclamação
      const [result] = await connection.execute('DELETE FROM reclamacoes WHERE id = ?', [id]);
      await connection.end();
      if (result && result.affectedRows) return res.json({ sucesso: true, mensagem: 'Reclamação removida do banco.' });
      return res.status(404).json({ sucesso: false, mensagem: 'Reclamação não encontrada.' });
    } catch (dbErr) {
      console.warn('Falha ao deletar reclamacao no DB, tentando fallback arquivo:', dbErr && dbErr.message);
      // fallback em arquivo
      const dataFile = path.join(__dirname, '..', 'data', 'reclamacoes.json');
      if (!fs.existsSync(dataFile)) return res.status(404).json({ sucesso: false, mensagem: 'Reclamação não encontrada.' });
      let lista = [];
      try { lista = JSON.parse(fs.readFileSync(dataFile, 'utf8') || '[]'); } catch { lista = []; }
      const idx = lista.findIndex(x => String(x.id) === String(id));
      if (idx === -1) return res.status(404).json({ sucesso: false, mensagem: 'Reclamação não encontrada.' });
      lista.splice(idx, 1);
      fs.writeFileSync(dataFile, JSON.stringify(lista, null, 2), 'utf8');
      return res.json({ sucesso: true, mensagem: 'Reclamação removida (arquivo fallback).' });
    }
  } catch (err) {
    console.error('Erro DELETE /api/reclamacoes/:id', err && err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao remover reclamacao.' });
  }
});

// Servir attachment armazenado em DB (stream)
app.get('/api/reclamacao/attachment/:attId', async (req, res) => {
  try {
    const { attId } = req.params;
    const connection = await createDbConnection();
    const [rows] = await connection.execute('SELECT filename, mimetype, data, url FROM reclamacao_attachments WHERE id = ?', [attId]);
    await connection.end();
    if (!rows.length) return res.status(404).send('Attachment não encontrado');
    const att = rows[0];
    if (att.data) {
      const dataBuf = att.data;
      const total = dataBuf.length;
      const range = req.headers.range;
      res.setHeader('Content-Type', att.mimetype || 'application/octet-stream');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Disposition', `inline; filename="${att.filename || 'attachment'}"`);
      if (range) {
        // Parse Range header, e.g. 'bytes=0-499'
        const matches = /^bytes=(\d*)-(\d*)/.exec(range);
        if (!matches) {
          return res.status(416).setHeader('Content-Range', `bytes */${total}`).end();
        }
        let start = matches[1] ? parseInt(matches[1], 10) : 0;
        let end = matches[2] ? parseInt(matches[2], 10) : total - 1;
        if (Number.isNaN(start) || Number.isNaN(end) || start > end || start < 0) {
          return res.status(416).setHeader('Content-Range', `bytes */${total}`).end();
        }
        end = Math.min(end, total - 1);
        const chunkSize = (end - start) + 1;
        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
        res.setHeader('Content-Length', String(chunkSize));
        return res.send(dataBuf.slice(start, end + 1));
      }
      // No range - send entire file
      res.setHeader('Content-Length', String(total));
      return res.send(dataBuf);
    }
    if (att.url) return res.redirect(att.url);
    return res.status(404).send('Attachment sem dados');
  } catch (e) {
    console.error('Erro ao servir attachment:', e && e.message);
    res.status(500).send('Erro ao servir attachment');
  }
});

// Gerar/servir poster (thumbnail) para attachment
app.get('/api/reclamacao/attachment/:attId/poster', async (req, res) => {
  try {
    const { attId } = req.params;
    const connection = await createDbConnection();
    const [rows] = await connection.execute('SELECT filename, mimetype, data FROM reclamacao_attachments WHERE id = ?', [attId]);
    await connection.end();
    if (!rows.length) return res.status(404).send('Attachment não encontrado');
    const att = rows[0];
    if (!att.data) return res.status(404).send('Sem dados para gerar poster');

    // tentar usar sharp para imagens; ffmpeg para vídeos
    const isImage = (att.mimetype || '').startsWith('image/');
    const isVideo = (att.mimetype || '').startsWith('video/');

    if (isImage) {
      try {
        const sharp = require('sharp');
        const thumb = await sharp(att.data).resize({ width: 480 }).jpeg({ quality: 80 }).toBuffer();
        res.setHeader('Content-Type', 'image/jpeg');
        return res.send(thumb);
      } catch (e) {
        console.warn('sharp não disponível ou falha ao processar imagem:', e && e.message);
        res.setHeader('Content-Type', att.mimetype || 'application/octet-stream');
        return res.send(att.data);
      }
    }

    if (isVideo) {
      try {
        // tenta extrair frame com ffmpeg (deve estar instalado no sistema)
        const { spawn } = require('child_process');
        const tmp = require('os').tmpdir();
        const inPath = path.join(tmp, `att_${attId}`);
        const outPath = path.join(tmp, `att_${attId}_thumb.jpg`);
        // gravar buffer temporário
        require('fs').writeFileSync(inPath, att.data);
        // extrair frame (00:00:01)
        await new Promise((resolve, reject) => {
          const args = ['-y', '-ss', '00:00:01', '-i', inPath, '-frames:v', '1', '-q:v', '2', outPath];
          const p = spawn('ffmpeg', args);
          p.on('exit', (code) => { if (code === 0) resolve(); else reject(new Error('ffmpeg exit ' + code)); });
          p.on('error', reject);
        });
        const buf = require('fs').readFileSync(outPath);
        // cleanup
        try { require('fs').unlinkSync(inPath); } catch(e){}
        try { require('fs').unlinkSync(outPath); } catch(e){}
        res.setHeader('Content-Type', 'image/jpeg');
        return res.send(buf);
      } catch (e) {
        console.warn('ffmpeg não disponível ou falha ao gerar poster:', e && e.message);
        return res.status(501).send('Poster não disponível (ffmpeg/sharp ausentes)');
      }
    }

    // fallback: retornar dados originais se for imagem
    res.setHeader('Content-Type', att.mimetype || 'application/octet-stream');
    return res.send(att.data);
  } catch (e) {
    console.error('Erro ao gerar poster:', e && e.message);
    res.status(500).send('Erro ao gerar poster');
  }
});

function localStorageFallback() {
  // fallback vazio; ambiente servidor não tem localStorage
  return '[]';
}

// Cadastro de administrador
app.post("/admins", async (req, res) => {
  try {
    const { usuario, senha, nome, sobrenome } = req.body;
    if (!usuario || !senha || !nome || !sobrenome) {
      return res.status(400).json({ sucesso: false, mensagem: "Preencha usuario, senha, nome e sobrenome." });
    }
    const hash = await bcrypt.hash(senha, 10);
    const connection = await createDbConnection();
    await connection.execute("INSERT INTO admins (usuario, senhaHash, nome, sobrenome) VALUES (?, ?, ?, ?)", [usuario, hash, nome, sobrenome]);
    await connection.end();
    res.json({ sucesso: true, mensagem: "Administrador cadastrado com sucesso!" });
  } catch (error) {
    console.error("Erro no cadastro admin:", error.message);
    if (error.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({ sucesso: false, mensagem: "A tabela 'admins' nao existe no banco 'mix_promocao'." });
    }
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ sucesso: false, mensagem: "Este usuario ja esta cadastrado." });
    }
    if (error.code === "ER_BAD_DB_ERROR") {
      return res.status(500).json({ sucesso: false, mensagem: "O banco de dados 'mix_promocao' nao foi encontrado." });
    }
    res.status(500).json({ sucesso: false, mensagem: `Erro no servidor: ${error.message}` });
  }
});

app.get("/api/produtos", async (req, res) => {
  try {
    const connection = await createDbConnection();
    const [rows] = await connection.execute("SELECT * FROM produtos ORDER BY data_cadastro DESC, id DESC");
    await connection.end();
    res.json({ sucesso: true, produtos: rows.map(mapearProdutoBanco) });
  } catch (error) {
    console.error("Erro ao listar produtos:", error.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar produtos." });
  }
});

app.get("/api/produtos/estatisticas", autenticarToken, exigirAdmin, async (req, res) => {
  try {
    const connection = await createDbConnection();
    const [rows] = await connection.execute(`
      SELECT id, nome, categoria, preco_atual, imagem, visualizacoes, data_cadastro
      FROM produtos
      ORDER BY visualizacoes DESC, nome ASC
    `);
    await connection.end();
    res.json({
      sucesso: true,
      produtos: rows.map(produto => ({
        id: produto.id,
        nome: produto.nome,
        categoria: produto.categoria || "outros",
        precoAtual: formatarPrecoBanco(produto.preco_atual),
        imagem: produto.imagem || "",
        visualizacoes: produto.visualizacoes || 0,
        dataCadastro: formatarDataCadastro(produto.data_cadastro)
      }))
    });
  } catch (error) {
    console.error("Erro ao buscar estatisticas de produtos:", error.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar estatisticas de produtos." });
  }
});

app.post("/api/produtos/:id/visualizacao", async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await createDbConnection();
    const [result] = await connection.execute(
      "UPDATE produtos SET visualizacoes = visualizacoes + 1 WHERE id = ?",
      [id]
    );

    if (!result.affectedRows) {
      await connection.end();
      return res.status(404).json({ sucesso: false, mensagem: "Produto nao encontrado." });
    }

    const [rows] = await connection.execute(
      "SELECT visualizacoes FROM produtos WHERE id = ?",
      [id]
    );
    await connection.end();

    res.json({ sucesso: true, visualizacoes: rows[0]?.visualizacoes || 0 });
  } catch (error) {
    console.error("Erro ao registrar visualizacao:", error.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao registrar visualizacao." });
  }
});

app.post("/api/produtos", autenticarToken, exigirAdmin, async (req, res) => {
  try {
    const {
      nome,
      nomeDetalhes,
      categoria,
      subcategoria,
      precoAntigo,
      precoAtual,
      desconto,
      imagem,
      video,
      descricao,
      pagamento,
      imagensExtras,
      quantidade,
      dataCadastro
    } = req.body;

    if (!nome || !precoAtual) {
      return res.status(400).json({ sucesso: false, mensagem: "Nome e preco atual sao obrigatorios." });
    }

    const connection = await createDbConnection();
    const dataCadastroFormatada = parseDataCadastro(dataCadastro) || new Date();
    const [result] = await connection.execute(
      `INSERT INTO produtos
       (nome, nome_detalhes, categoria, subcategoria, preco_antigo, preco_atual, desconto, imagem, video, descricao, pagamento_json, imagens_extras_json, quantidade, data_cadastro)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome,
        nomeDetalhes || null,
        categoria || "outros",
        subcategoria || null,
        extrairPrecoNumero(precoAntigo) || null,
        extrairPrecoNumero(precoAtual),
        desconto || null,
        imagem || null,
        video || null,
        descricao || null,
        JSON.stringify(Array.isArray(pagamento) ? pagamento : []),
        JSON.stringify(Array.isArray(imagensExtras) ? imagensExtras : []),
        Number(quantidade) > 0 ? Number(quantidade) : 1,
        dataCadastroFormatada
      ]
    );

    const [rows] = await connection.execute("SELECT * FROM produtos WHERE id = ?", [result.insertId]);
    await connection.end();

    res.status(201).json({ sucesso: true, produto: mapearProdutoBanco(rows[0]) });
  } catch (error) {
    console.error("Erro ao criar produto:", error.message);
    res.status(500).json({ sucesso: false, mensagem: `Erro ao salvar produto: ${error.message}` });
  }
});

// Listar comentários de um produto
app.get('/api/comentarios', async (req, res) => {
  try {
    const produtoId = Number(req.query.produtoId || req.query.produto || 0) || 0;
    const connection = await createDbConnection();
    if (!produtoId) {
      const [rows] = await connection.execute(`SELECT * FROM comentarios ORDER BY criado_em DESC LIMIT 200`);
      await connection.end();
      return res.json((rows || []).map(r => ({ id: r.id, produtoId: r.produto_id, autor: r.autor, clienteId: r.cliente_id, texto: r.texto, nota: r.nota, fotos: parseJsonSeguro(r.fotos_json, []), video: parseJsonSeguro(r.video_json, null), criadoEm: r.criado_em })));
    }
    const [rows] = await connection.execute('SELECT * FROM comentarios WHERE produto_id = ? ORDER BY criado_em DESC', [produtoId]);
    await connection.end();
    return res.json((rows || []).map(r => ({ id: r.id, produtoId: r.produto_id, autor: r.autor, clienteId: r.cliente_id, texto: r.texto, nota: r.nota, fotos: parseJsonSeguro(r.fotos_json, []), video: parseJsonSeguro(r.video_json, null), criadoEm: r.criado_em })));
  } catch (e) {
    console.error('Erro GET /api/comentarios', e && e.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar comentarios.' });
  }
});

// Receber/armazenar comentário (aceita até 5 imagens e 1 vídeo)
app.post('/api/comentarios', upload.fields([{ name: 'fotos', maxCount: 5 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  try {
    const { autor, texto, nota, produtoId, clienteId } = req.body || {};
    const pid = Number(produtoId) || 0;
    if (!pid || !texto) return res.status(400).json({ sucesso: false, mensagem: 'produtoId e texto são obrigatórios.' });

    const files = req.files || {};
    const fotosFiles = files.fotos || [];
    const videoFiles = files.video || [];

    // converter em data-URI para armazenamento simples
    const fotosArr = [];
    for (const f of fotosFiles) {
      try { fotosArr.push(`data:${f.mimetype};base64,${f.buffer.toString('base64')}`); } catch(e){}
    }
    let videoObj = null;
    if (videoFiles.length) {
      const vf = videoFiles[0];
      try { videoObj = { mimetype: vf.mimetype, dataUri: `data:${vf.mimetype};base64,${vf.buffer.toString('base64')}` }; } catch(e){}
    }

    const connection = await createDbConnection();
    const [result] = await connection.execute(
      `INSERT INTO comentarios (produto_id, autor, cliente_id, texto, nota, fotos_json, video_json) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [pid, autor || null, clienteId || null, texto, nota ? Number(nota) : null, JSON.stringify(fotosArr), videoObj ? JSON.stringify(videoObj) : null]
    );
    await connection.end();

    return res.json({ sucesso: true, mensagem: 'Comentário armazenado.', id: result && result.insertId ? result.insertId : null });
  } catch (e) {
    console.error('Erro POST /api/comentarios', e && e.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao salvar comentário.' });
  }
});

// Deletar comentário (apenas admin)
app.delete('/api/comentarios/:id', autenticarToken, exigirAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await createDbConnection();
    const [result] = await connection.execute('DELETE FROM comentarios WHERE id = ?', [id]);
    await connection.end();
    if (result && result.affectedRows) return res.json({ sucesso: true, mensagem: 'Comentário removido.' });
    return res.status(404).json({ sucesso: false, mensagem: 'Comentário não encontrado.' });
  } catch (e) {
    console.error('Erro DELETE /api/comentarios/:id', e && e.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao remover comentário.' });
  }
});

app.put("/api/produtos/:id", autenticarToken, exigirAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      nomeDetalhes,
      categoria,
      subcategoria,
      precoAntigo,
      precoAtual,
      desconto,
      imagem,
      video,
      descricao,
      pagamento,
      imagensExtras,
      quantidade,
      dataCadastro
    } = req.body;

    if (!nome || !precoAtual) {
      return res.status(400).json({ sucesso: false, mensagem: "Nome e preco atual sao obrigatorios." });
    }

    const connection = await createDbConnection();
    await connection.execute(
      `UPDATE produtos
       SET nome = ?, nome_detalhes = ?, categoria = ?, subcategoria = ?, preco_antigo = ?, preco_atual = ?, desconto = ?, imagem = ?, video = ?, descricao = ?, pagamento_json = ?, imagens_extras_json = ?, quantidade = ?, data_cadastro = ?
       WHERE id = ?`,
      [
        nome,
        nomeDetalhes || null,
        categoria || "outros",
        subcategoria || null,
        extrairPrecoNumero(precoAntigo) || null,
        extrairPrecoNumero(precoAtual),
        desconto || null,
        imagem || null,
        video || null,
        descricao || null,
        JSON.stringify(Array.isArray(pagamento) ? pagamento : []),
        JSON.stringify(Array.isArray(imagensExtras) ? imagensExtras : []),
        Number(quantidade) > 0 ? Number(quantidade) : 1,
        parseDataCadastro(dataCadastro) || new Date(),
        id
      ]
    );

    const [rows] = await connection.execute("SELECT * FROM produtos WHERE id = ?", [id]);
    await connection.end();

    if (!rows.length) {
      return res.status(404).json({ sucesso: false, mensagem: "Produto nao encontrado." });
    }

    res.json({ sucesso: true, produto: mapearProdutoBanco(rows[0]) });
  } catch (error) {
    console.error("Erro ao atualizar produto:", error.message);
    res.status(500).json({ sucesso: false, mensagem: `Erro ao atualizar produto: ${error.message}` });
  }
});

// Cadastro de cliente com foto e data de nascimento
app.post("/cliente/cadastro", upload.single("foto"), async (req, res) => {
  try {
    // LOG para depuração dos dados recebidos
    // Log detalhado de todos os campos recebidos
    console.log('--- DADOS RECEBIDOS NO CADASTRO DE CLIENTE ---');
    Object.entries(req.body).forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
    if (req.file) {
      console.log('foto: arquivo recebido (tamanho:', req.file.size, 'bytes), mimetype:', req.file.mimetype);
    } else {
      console.log('foto: não enviado');
    }
    console.log('----------------------------------------------');
    // Garante que todos os campos estejam definidos ou null
    function safe(v) {
      return (v === undefined || v === "") ? null : v;
    }
    const { nome, sobrenome, email, telefone, senha, rua, bairro, numero, complemento, estado, cidade, cep, dataNascimento, cpf } = req.body;
    const hash = await bcrypt.hash(safe(senha), 10);
    const fotoBuffer = req.file ? req.file.buffer : null;
    const cpfCriptografado = encryptCPF(safe(cpf));

    const connection = await createDbConnection();

    await connection.execute(
      "INSERT INTO clientes (nome, sobrenome, email, telefone, cpf, senha_hash, rua, bairro, numero, complemento, estado, cidade, cep, data_nascimento, foto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [safe(nome), safe(sobrenome), safe(email), safe(telefone), cpfCriptografado, hash, safe(rua), safe(bairro), safe(numero), safe(complemento), safe(estado), safe(cidade), safe(cep), safe(dataNascimento), fotoBuffer]
    );

    await connection.end();
    res.json({ sucesso: true, mensagem: "Cliente cadastrado com sucesso!" });
  } catch (error) {
    console.error("Erro no cadastro cliente:", error.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro no servidor!" });
  }
});

// Login de administrador
// Rota para buscar a foto do cliente. Permite acesso público quando não há token,
// e valida o token quando fornecido (só o próprio cliente ou admin podem também acessar).
app.get("/api/cliente/:id/foto", async (req, res) => {
  try {
    const { id } = req.params;

    // Tenta extrair e verificar token, se fornecido
    let requester = null;
    try {
      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (token) requester = jwt.verify(token, SECRET);
    } catch (e) {
      // token inválido — considerar como não autenticado (não bloqueia acesso público)
      console.debug('[server] foto: token inválido ou expirado (será tratado como acesso público)');
      requester = null;
    }

    // Se houver requester e não for admin nem dono, negar (mantém proteção para tokens válidos)
    if (requester && requester.role !== 'admin' && String(requester.id) !== String(id)) {
      return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado.' });
    }

    const connection = await createDbConnection();
    const [rows] = await connection.execute("SELECT foto FROM clientes WHERE id = ?", [id]);
    await connection.end();
    if (!rows.length || !rows[0].foto) {
      return res.status(404).json({ sucesso: false, mensagem: 'Foto não encontrada.' });
    }

    const fotoBuffer = rows[0].foto;
    let contentType = 'image/jpeg';
    if (fotoBuffer && fotoBuffer[0] === 0x89 && fotoBuffer[1] === 0x50) contentType = 'image/png';
    else if (fotoBuffer && fotoBuffer[0] === 0xFF && fotoBuffer[1] === 0xD8) contentType = 'image/jpeg';
    else if (fotoBuffer && fotoBuffer.slice(0,4).toString() === 'RIFF' && fotoBuffer.slice(8,12).toString() === 'WEBP') contentType = 'image/webp';

    res.setHeader('Content-Type', contentType);
    res.send(fotoBuffer);
  } catch (error) {
    console.error('Erro ao buscar foto do cliente:', error && error.message);
    res.status(500).json({ sucesso: false, mensagem: 'Erro no servidor!' });
  }
});
app.post("/login-admin", async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    const connection = await createDbConnection();
    const [rows] = await connection.execute("SELECT * FROM admins WHERE usuario = ?", [usuario]);
    await connection.end();

    if (rows.length === 0) return res.status(401).json({ sucesso: false, mensagem: "Usuário não encontrado!" });

    const admin = rows[0];
    const senhaValida = await bcrypt.compare(senha, admin.senhaHash);
    if (!senhaValida) return res.status(401).json({ sucesso: false, mensagem: "Senha incorreta!" });

    const token = jwt.sign({ id: admin.id, usuario: admin.usuario, role: "admin" }, SECRET, { expiresIn: "1h" });

    res.json({
      sucesso: true,
      mensagem: "Login realizado com sucesso!",
      token,
      tipoUsuario: "Administrador",
      nome: admin.nome,
      sobrenome: admin.sobrenome
    });
  } catch (error) {
    console.error("Erro no login admin:", error.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro no servidor!" });
  }
});

// Login de cliente
app.post("/login-cliente", async (req, res) => {
  try {
    const { email, senha } = req.body;
    const connection = await createDbConnection();
    const [rows] = await connection.execute("SELECT * FROM clientes WHERE email = ?", [email]);
    await connection.end();

    if (rows.length === 0) return res.status(401).json({ sucesso: false, mensagem: "Cliente não encontrado!" });
    const cliente = rows[0];
    const senhaValida = await bcrypt.compare(senha, cliente.senha_hash);
    if (!senhaValida) return res.status(401).json({ sucesso: false, mensagem: "Senha incorreta!" });

    const token = jwt.sign({ id: cliente.id, email: cliente.email, role: "cliente" }, SECRET, { expiresIn: "1h" });

    res.json({
      sucesso: true,
      mensagem: "Login de cliente realizado com sucesso!",
      token,
      id: cliente.id,
      nome: cliente.nome,
      sobrenome: cliente.sobrenome,
      email: cliente.email,
      dataNascimento: cliente.data_nascimento,
      foto: cliente.foto ? Buffer.from(cliente.foto).toString("base64") : null
    });
  } catch (error) {
    console.error("Erro no login cliente:", error.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro no servidor!" });
  }
});

// ✅ Login Social (Google, Facebook, Instagram)
app.post("/login/social", async (req, res) => {
  try {
    const { provider, nome, sobrenome, email, foto } = req.body;

    if (!email) {
      return res.status(400).json({ sucesso: false, mensagem: "Email é obrigatório para login social!" });
    }

    const connection = await createDbConnection();

    // Verificar se o cliente já existe pelo email
    const [rows] = await connection.execute("SELECT * FROM clientes WHERE email = ?", [email]);

    let cliente;
    let novaConta = false;

    if (rows.length > 0) {
      // Cliente já existe — fazer login direto
      cliente = rows[0];
    } else {
      // Cliente não existe — criar conta nova com dados do provedor social
      const senhaAleatoria = require("crypto").randomBytes(16).toString("hex");
      const hash = await bcrypt.hash(senhaAleatoria, 10);

      const [result] = await connection.execute(
        "INSERT INTO clientes (nome, sobrenome, email, telefone, senha_hash, rua, bairro, numero, complemento, estado, data_nascimento) VALUES (?, ?, ?, '', ?, '', '', '', '', '', NULL)",
        [nome || "", sobrenome || "", email, hash]
      );

      const [novoCliente] = await connection.execute("SELECT * FROM clientes WHERE id = ?", [result.insertId]);
      cliente = novoCliente[0];
      novaConta = true;
    }

    await connection.end();

    const token = jwt.sign({ id: cliente.id, email: cliente.email, role: "cliente" }, SECRET, { expiresIn: "1h" });

    res.json({
      sucesso: true,
      mensagem: novaConta ? "Conta criada via " + provider : "Login social realizado!",
      novaConta,
      token,
      id: cliente.id,
      nome: cliente.nome,
      sobrenome: cliente.sobrenome,
      email: cliente.email,
      dataNascimento: cliente.data_nascimento || null,
      foto: cliente.foto ? Buffer.from(cliente.foto).toString("base64") : (foto || null)
    });

  } catch (error) {
    console.error("Erro no login social:", error.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro no servidor!" });
  }
});

// ✅ Buscar dados de cliente pelo ID (NÃO retorna foto por segurança)
app.get("/api/cliente/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await createDbConnection();
    const [rows] = await connection.execute("SELECT * FROM clientes WHERE id = ?", [id]);
    await connection.end();

    if (rows.length === 0) return res.status(404).json({ sucesso: false, mensagem: "Cliente não encontrado!" });

    const cliente = rows[0];
    // Se existir foto no banco, inclua como base64 + tente inferir MIME para compatibilidade com dados antigos
    let fotoBase64 = null;
    let fotoMime = null;
    try {
      if (cliente.foto) {
        const buf = Buffer.from(cliente.foto);
        fotoBase64 = buf.toString('base64');
        // inferir MIME pelo header
        if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) fotoMime = 'image/png';
        else if (buf[0] === 0xFF && buf[1] === 0xD8) fotoMime = 'image/jpeg';
        else if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) fotoMime = 'image/gif';
        else if (buf.slice(0,4).toString() === 'RIFF' && buf.slice(8,12).toString() === 'WEBP') fotoMime = 'image/webp';
        else fotoMime = 'application/octet-stream';
      }
    } catch (e) {
      console.warn('Erro lendo foto do cliente:', e && e.message);
    }

    res.json({
      sucesso: true,
      id: cliente.id,
      nome: cliente.nome,
      sobrenome: cliente.sobrenome,
      email: cliente.email,
      telefone: cliente.telefone,
      data_nascimento: cliente.data_nascimento,
      rua: cliente.rua,
      bairro: cliente.bairro,
      numero: cliente.numero,
      complemento: cliente.complemento,
      estado: cliente.estado,
      cidade: cliente.cidade,
      cep: cliente.cep,
      cpf: decryptCPF(cliente.cpf),
      fotoBase64,
      fotoMime
    });
  } catch (error) {
    console.error("Erro ao buscar cliente:", error.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro no servidor!" });
  }
});

// ✅ Buscar dados do cliente autenticado (PROTEGIDO) - evita expor dados de outros clientes
app.get("/api/cliente/me", autenticarToken, async (req, res) => {
  try {
    const id = req.usuario?.id;
    if (!id) return res.status(400).json({ sucesso: false, mensagem: "ID do usuário ausente no token." });
    const connection = await createDbConnection();
    const [rows] = await connection.execute("SELECT * FROM clientes WHERE id = ?", [id]);
    await connection.end();

    if (rows.length === 0) return res.status(404).json({ sucesso: false, mensagem: "Cliente não encontrado!" });

    const cliente = rows[0];
    let fotoBase64 = null;
    let fotoMime = null;
    try {
      if (cliente.foto) {
        const buf = Buffer.from(cliente.foto);
        fotoBase64 = buf.toString('base64');
        if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) fotoMime = 'image/png';
        else if (buf[0] === 0xFF && buf[1] === 0xD8) fotoMime = 'image/jpeg';
        else if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) fotoMime = 'image/gif';
        else if (buf.slice(0,4).toString() === 'RIFF' && buf.slice(8,12).toString() === 'WEBP') fotoMime = 'image/webp';
        else fotoMime = 'application/octet-stream';
      }
    } catch (e) {
      console.warn('Erro lendo foto do cliente (me):', e && e.message);
    }

    res.json({
      sucesso: true,
      id: cliente.id,
      nome: cliente.nome,
      sobrenome: cliente.sobrenome,
      email: cliente.email,
      telefone: cliente.telefone,
      data_nascimento: cliente.data_nascimento,
      rua: cliente.rua,
      bairro: cliente.bairro,
      numero: cliente.numero,
      complemento: cliente.complemento,
      estado: cliente.estado,
      cidade: cliente.cidade,
      cep: cliente.cep,
      cpf: decryptCPF(cliente.cpf),
      fotoBase64,
      fotoMime
    });
  } catch (error) {
    console.error('Erro ao buscar cliente (me):', error.message);
    res.status(500).json({ sucesso: false, mensagem: 'Erro no servidor!' });
  }
});

// Atualizar/Salvar foto do cliente (aceita image/*)
app.put('/api/cliente/:id/foto', upload.single('foto'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ sucesso: false, mensagem: 'Arquivo de foto não enviado.' });
    const fotoBuffer = req.file.buffer;
    const fotoMime = req.file.mimetype || null;

    const connection = await createDbConnection();
    // tenta atualizar coluna foto_mime, mas não falha se a coluna não existir
    try {
      await connection.execute('UPDATE clientes SET foto = ?, foto_mime = ? WHERE id = ?', [fotoBuffer, fotoMime, id]);
    } catch (e) {
      // coluna foto_mime possivelmente ausente — atualizar apenas foto
      await connection.execute('UPDATE clientes SET foto = ? WHERE id = ?', [fotoBuffer, id]);
    }
    await connection.end();
    res.json({ sucesso: true, mensagem: 'Foto atualizada com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar foto do cliente:', error.message);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar foto.' });
  }
});

// ✅ Atualizar dados do cliente
app.put("/api/cliente/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, sobrenome, email, telefone, data_nascimento, rua, bairro, numero, complemento, estado } = req.body;

    const connection = await createDbConnection();

    await connection.execute(
      `UPDATE clientes 
       SET nome=?, sobrenome=?, email=?, telefone=?, data_nascimento=?, rua=?, bairro=?, numero=?, complemento=?, estado=? 
       WHERE id=?`,
      [nome, sobrenome, email, telefone, data_nascimento, rua, bairro, numero, complemento, estado, id]
    );

    await connection.end();
    res.json({ sucesso: true, mensagem: "Dados atualizados com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro no servidor!" });
  }
});

// Deletar conta do cliente (apenas o próprio cliente ou admin)
app.delete('/api/cliente/:id', autenticarToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.usuario) return res.status(401).json({ sucesso: false, mensagem: 'Token inválido.' });
    if (req.usuario.role !== 'admin' && String(req.usuario.id) !== String(id)) {
      return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado.' });
    }

    const connection = await createDbConnection();
    try {
      await connection.beginTransaction();

      // Tentar remover dados relacionados primeiro (se existirem). Se a tabela não existir,
      // o erro será capturado e continuamos — isso garante compatibilidade com esquemas variados.
      try {
        await connection.execute('DELETE FROM pedidos WHERE cliente_id = ?', [id]);
      } catch (e) {
        if (e && e.code === 'ER_NO_SUCH_TABLE') {
          // tabela pedidos não existe — ignorar
        } else {
          throw e;
        }
      }

      // Remover o próprio cliente
      const [result] = await connection.execute('DELETE FROM clientes WHERE id = ?', [id]);

      await connection.commit();
      await connection.end();

      if (result && result.affectedRows && result.affectedRows > 0) {
        return res.json({ sucesso: true, mensagem: 'Conta excluída com sucesso.' });
      }
      return res.status(404).json({ sucesso: false, mensagem: 'Cliente não encontrado.' });
    } catch (errTrans) {
      try { await connection.rollback(); } catch (e) { /* ignorar rollback errors */ }
      await connection.end();
      throw errTrans;
    }
  } catch (error) {
    console.error('Erro ao deletar cliente:', error.message);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao excluir conta.' });
  }
});

// Excluir conta com validação por senha (útil quando o token expirou)
app.post('/api/cliente/:id/excluir-com-senha', async (req, res) => {
  try {
    console.debug('[server] POST /api/cliente/:id/excluir-com-senha called', { params: req.params, bodyPreview: typeof req.body === 'object' ? Object.keys(req.body) : typeof req.body });
    const { id } = req.params;
    const { senha } = req.body || {};
    if (!senha) return res.status(400).json({ sucesso: false, mensagem: 'Senha obrigatória.' });

    const connection = await createDbConnection();
    try {
      const [rows] = await connection.execute('SELECT * FROM clientes WHERE id = ?', [id]);
      console.debug('[server] excluir-com-senha - clientes rows length:', rows && rows.length);
      if (!rows.length) {
        await connection.end();
        return res.status(404).json({ sucesso: false, mensagem: 'Cliente não encontrado.' });
      }
      const cliente = rows[0];

      const senhaValida = await bcrypt.compare(senha, cliente.senha_hash);
      if (!senhaValida) {
        await connection.end();
        return res.status(401).json({ sucesso: false, mensagem: 'Senha incorreta.' });
      }

      // Realiza deleção em transação, removendo dados relacionados quando possível
      await connection.beginTransaction();
      try {
        try {
          await connection.execute('DELETE FROM pedidos WHERE cliente_id = ?', [id]);
        } catch (e) {
          if (e && e.code !== 'ER_NO_SUCH_TABLE') throw e;
        }
        const [result] = await connection.execute('DELETE FROM clientes WHERE id = ?', [id]);
        await connection.commit();
        await connection.end();

        if (result && result.affectedRows && result.affectedRows > 0) {
          return res.json({ sucesso: true, mensagem: 'Conta excluída com sucesso.' });
        }
        return res.status(404).json({ sucesso: false, mensagem: 'Cliente não encontrado.' });
      } catch (e) {
        try { await connection.rollback(); } catch (er) { }
        await connection.end();
        throw e;
      }
    } catch (err) {
      await connection.end();
      throw err;
    }
  } catch (error) {
    console.error('Erro ao excluir cliente por senha:', error.message);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao excluir conta.' });
  }
});

// ✅ Alterar senha do cliente
app.put("/api/cliente/:id/senha", async (req, res) => {
  try {
    const { id } = req.params;
    const { senha } = req.body;

    if (!senha) {
      return res.json({ sucesso: false, mensagem: "Senha não informada." });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const connection = await createDbConnection();

    await connection.execute("UPDATE clientes SET senha_hash=? WHERE id=?", [senhaCriptografada, id]);
    await connection.end();

    res.json({ sucesso: true, mensagem: "Senha atualizada com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar senha:", error.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro no servidor!" });
  }
});

// Buscar pedidos do cliente (retorna array vazio se tabela ausente)
app.get("/api/cliente/:id/pedidos", async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await createDbConnection();
    const [rows] = await connection.execute(
      `SELECT id, cliente_id, cliente_nome, cliente_email, total, subtotal, itens_json, frete_json, forma_pagamento, data_pedido, status
       FROM pedidos WHERE cliente_id = ? ORDER BY data_pedido DESC`,
      [id]
    );
    await connection.end();

    const pedidos = (rows || []).map(p => ({
      id: p.id,
      clienteId: p.cliente_id,
      cliente: { nome: p.cliente_nome, email: p.cliente_email },
      total: formatarPrecoBanco(p.total),
      subtotal: formatarPrecoBanco(p.subtotal),
      itens: (p.itens_json ? JSON.parse(p.itens_json) : []),
      frete: (p.frete_json ? JSON.parse(p.frete_json) : {}),
      formaPagamento: p.forma_pagamento,
      dataPedido: formatarDataCadastro(p.data_pedido),
      status: p.status || 'pendente'
    }));

    res.json({ sucesso: true, pedidos });
  } catch (error) {
    if (error && error.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ sucesso: true, pedidos: [] });
    }
    console.error('Erro ao buscar pedidos do cliente:', error.message);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar pedidos.' });
  }
});

// Criar pedido (API simples usada para testes e criação de pedidos)
app.post('/api/pedidos', async (req, res) => {
  try {
    const body = req.body || {};
    const clienteId = body.clienteId || null;
    const clienteNome = body.cliente?.nome || null;
    const clienteEmail = body.cliente?.email || null;
    const total = Number(body.total || 0);
    const subtotal = Number(body.subtotal || 0);
    const itensJson = JSON.stringify(body.itens || []);
    const freteJson = JSON.stringify(body.frete || {});
    const formaPagamento = body.formaPagamento || null;
    const status = body.status || 'pendente';

    const connection = await createDbConnection();
    const [result] = await connection.execute(
      `INSERT INTO pedidos (cliente_id, cliente_nome, cliente_email, total, subtotal, itens_json, frete_json, forma_pagamento, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [clienteId, clienteNome, clienteEmail, total, subtotal, itensJson, freteJson, formaPagamento, status]
    );

    // recuperar pedido criado (campos completos)
    const [rows] = await connection.execute(
      `SELECT id, cliente_id, cliente_nome, cliente_email, total, subtotal, itens_json, frete_json, forma_pagamento, data_pedido, status
       FROM pedidos WHERE id = ?`,
      [result.insertId]
    );
    await connection.end();

    const pedido = rows && rows[0] ? rows[0] : null;
    // Também gravar registro detalhado em 'compras' para histórico
    try {
      const connection2 = await createDbConnection();
      const clienteJson = JSON.stringify(body.cliente || {});
      const pagamentoJson = JSON.stringify(body.pagamento || {});
      await connection2.execute(
        `INSERT INTO compras (pedido_id, cliente_id, cliente_json, itens_json, pagamento_json, frete_json, total, subtotal, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [result.insertId, clienteId, clienteJson, itensJson, pagamentoJson, freteJson, total, subtotal, status]
      );
      await connection2.end();
    } catch (ex) {
      // não bloquear a resposta principal se a tabela compras não existir
      console.warn('Não foi possível gravar em compras:', ex && ex.message);
    }
    return res.status(201).json({ sucesso: true, pedido });
  } catch (e) {
    console.error('Erro POST /api/pedidos', e && e.message);
    if (e && e.code === 'ER_NO_SUCH_TABLE') return res.status(500).json({ sucesso: false, mensagem: 'Tabela pedidos não existe no banco.' });
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao criar pedido.' });
  }
});

// Buscar compras do cliente (histórico detalhado)
app.get('/api/cliente/:id/compras', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await createDbConnection();
    const [rows] = await connection.execute(
      `SELECT id, pedido_id, cliente_id, cliente_json, itens_json, pagamento_json, frete_json, total, subtotal, status, data_compra
       FROM compras WHERE cliente_id = ? ORDER BY data_compra DESC`,
      [id]
    );
    await connection.end();

    const compras = (rows || []).map(r => ({
      id: r.id,
      pedidoId: r.pedido_id,
      clienteId: r.cliente_id,
      cliente: (r.cliente_json ? JSON.parse(r.cliente_json) : {}),
      itens: (r.itens_json ? JSON.parse(r.itens_json) : []),
      pagamento: (r.pagamento_json ? JSON.parse(r.pagamento_json) : {}),
      frete: (r.frete_json ? JSON.parse(r.frete_json) : {}),
      total: formatarPrecoBanco(r.total),
      subtotal: formatarPrecoBanco(r.subtotal),
      status: r.status,
      dataCompra: formatarDataCadastro(r.data_compra)
    }));

    res.json({ sucesso: true, compras });
  } catch (e) {
    if (e && e.code === 'ER_NO_SUCH_TABLE') return res.json({ sucesso: true, compras: [] });
    console.error('Erro ao buscar compras:', e && e.message);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar compras.' });
  }
});

// ---------------- PAGBANK - ROTAS DE PAGAMENTO ---------------- //

// Criar pedido PIX
app.post("/api/pagbank/pix", async (req, res) => {
  try {
    const origem = req.get('origin') || req.get('referer') || '';
    const fromLiveServer = /:(5500|5501)(?:\/|$)/.test(origem) || req.get('x-live-server') === '1';
    const useFake = PAGBANK_FAKE || fromLiveServer || req.get('x-use-pagbank-fake') === '1' || (req.body && req.body._fake);
    if (!useFake && !validarPagBankConfig(res)) return;

    const { referencia, cliente, itens, frete } = req.body;
    const totalItens = itens.reduce((acc, i) => acc + i.quantidade * i.precoUnitario, 0);
    const totalCentavos = Math.round((totalItens + (frete || 0)) * 100);

    const body = {
      reference_id: referencia,
      customer: {
        name: cliente.nome,
        email: cliente.email,
        tax_id: cliente.cpf || "00000000000",
        phones: [{
          country: "55",
          area: (cliente.telefone || "").replace(/\D/g, "").substring(0, 2),
          number: (cliente.telefone || "").replace(/\D/g, "").substring(2, 11),
          type: "MOBILE"
        }]
      },
      items: itens.map(i => ({
        reference_id: String(i.id || "item"),
        name: i.nome.substring(0, 64),
        quantity: i.quantidade,
        unit_amount: Math.round(i.precoUnitario * 100)
      })),
      qr_codes: [{
        amount: { value: totalCentavos },
        expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }],
      shipping: {
        address: {
          street: cliente.endereco.rua || "Rua",
          number: cliente.endereco.numero || "0",
          complement: cliente.endereco.complemento || "",
          locality: cliente.endereco.bairro || "Bairro",
          city: "Cidade",
          region_code: (cliente.endereco.estado || "RJ").substring(0, 2).toUpperCase(),
          country: "BRA",
          postal_code: (cliente.cep || "00000000").replace(/\D/g, "")
        }
      },
      notification_urls: [PAGBANK_NOTIFICATION_URL]
    };

    // Em modo fake não chamamos a API externa
    if (useFake) {
      const fakeOrderId = `FAKE-${Date.now()}`;
      console.warn('[PagBank FAKE] criando PIX simulado', { referencia, fakeOrderId });
      return res.json({
        sucesso: true,
        pedidoId: fakeOrderId,
        status: 'PAID',
        qrCode: { texto: '000201...', imagemBase64: null, expiracao: null }
      });
    }

    const response = await axios.post(`${PAGBANK_API}/orders`, body, {
      headers: {
        "Authorization": `Bearer ${PAGBANK_TOKEN}`,
        "Content-Type": "application/json",
        "x-idempotency-key": referencia
      }
    });

    const order = response.data;
    const qrCode = order.qr_codes && order.qr_codes[0];

    res.json({
      sucesso: true,
      pedidoId: order.id,
      status: order.status,
      qrCode: qrCode ? {
        texto: qrCode.text,
        imagemBase64: qrCode.links ? qrCode.links.find(l => l.media === "image/png")?.href : null,
        expiracao: qrCode.expiration_date
      } : null
    });
  } catch (error) {
    console.error("Erro PagBank PIX:", error.response?.data || error.message);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao gerar PIX",
      detalhes: error.response?.data?.error_messages || error.message
    });
  }
});

// Criar pedido Boleto
app.post("/api/pagbank/boleto", async (req, res) => {
  try {
    const origem = req.get('origin') || req.get('referer') || '';
    const fromLiveServer = /:(5500|5501)(?:\/|$)/.test(origem) || req.get('x-live-server') === '1';
    const useFake = PAGBANK_FAKE || fromLiveServer || req.get('x-use-pagbank-fake') === '1' || (req.body && req.body._fake);
    if (!useFake && !validarPagBankConfig(res)) return;

    const { referencia, cliente, itens, frete } = req.body;
    const totalItens = itens.reduce((acc, i) => acc + i.quantidade * i.precoUnitario, 0);
    const totalCentavos = Math.round((totalItens + (frete || 0)) * 100);

    const vencimento = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const dueDate = vencimento.toISOString().split("T")[0];

    const body = {
      reference_id: referencia,
      customer: {
        name: cliente.nome,
        email: cliente.email,
        tax_id: cliente.cpf || "00000000000",
        phones: [{
          country: "55",
          area: (cliente.telefone || "").replace(/\D/g, "").substring(0, 2),
          number: (cliente.telefone || "").replace(/\D/g, "").substring(2, 11),
          type: "MOBILE"
        }]
      },
      items: itens.map(i => ({
        reference_id: String(i.id || "item"),
        name: i.nome.substring(0, 64),
        quantity: i.quantidade,
        unit_amount: Math.round(i.precoUnitario * 100)
      })),
      charges: [{
        reference_id: referencia,
        description: "Pedido MIX-PROMOÇÃO",
        amount: { value: totalCentavos, currency: "BRL" },
        payment_method: {
          type: "BOLETO",
          boleto: {
            due_date: dueDate,
            instruction_lines: {
              line_1: "Pagamento referente ao pedido MIX-PROMOÇÃO",
              line_2: "Não receber após o vencimento"
            },
            holder: {
              name: cliente.nome,
              tax_id: cliente.cpf || "00000000000",
              email: cliente.email,
              address: {
                street: cliente.endereco.rua || "Rua",
                number: cliente.endereco.numero || "0",
                complemento: cliente.endereco.complemento || "",
                locality: cliente.endereco.bairro || "Bairro",
                city: "Cidade",
                region: cliente.endereco.estado || "RJ",
                region_code: (cliente.endereco.estado || "RJ").substring(0, 2).toUpperCase(),
                country: "BRA",
                postal_code: (cliente.cep || "00000000").replace(/\D/g, "")
              }
            }
          }
        }
      }],
      notification_urls: [PAGBANK_NOTIFICATION_URL]
    };

    // Em modo fake (desenvolvimento) retornamos um boleto simulado
    if (useFake) {
      const fakeOrderId = `FAKE-${Date.now()}`;
      console.warn('[PagBank FAKE] criando BOLETO simulado', { referencia, fakeOrderId });
      return res.json({
        sucesso: true,
        pedidoId: fakeOrderId,
        status: 'PAID',
        boleto: { codigoBarras: '00000000000000000000000000000000000000000000', formatted: '', linkPdf: '', vencimento: new Date(Date.now()+3*24*60*60*1000).toISOString() }
      });
    }

    const response = await axios.post(`${PAGBANK_API}/orders`, body, {
      headers: {
        "Authorization": `Bearer ${PAGBANK_TOKEN}`,
        "Content-Type": "application/json",
        "x-idempotency-key": referencia
      }
    });

    const order = response.data;
    const charge = order.charges && order.charges[0];
    const boleto = charge?.payment_method?.boleto;
    const linkPdf = charge?.links?.find(l => l.media === "application/pdf");

    res.json({
      sucesso: true,
      pedidoId: order.id,
      status: charge?.status || order.status,
      boleto: {
        codigoBarras: boleto?.barcode || "",
        linhaDigitavel: boleto?.formatted_barcode || "",
        linkPdf: linkPdf?.href || "",
        vencimento: boleto?.due_date || dueDate
      }
    });
  } catch (error) {
    console.error("Erro PagBank Boleto:", error.response?.data || error.message);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao gerar boleto",
      detalhes: error.response?.data?.error_messages || error.message
    });
  }
});

// Criar pedido Cartão (crédito ou débito)
app.post("/api/pagbank/cartao", async (req, res) => {
  try {
    // permitir modo fake se a requisição vier do Live Server (porta 5500/5501)
    const origem = req.get('origin') || req.get('referer') || '';
    const fromLiveServer = /:(5500|5501)(?:\/|$)/.test(origem) || req.get('x-live-server') === '1';
    const useFake = PAGBANK_FAKE || fromLiveServer || req.get('x-use-pagbank-fake') === '1';
    if (!useFake && !validarPagBankConfig(res)) return;

    const { referencia, cliente, itens, frete, cartao, tipo } = req.body;
    const totalItens = itens.reduce((acc, i) => acc + i.quantidade * i.precoUnitario, 0);
    const totalCentavos = Math.round((totalItens + (frete || 0)) * 100);

    const paymentType = tipo === "debito" ? "DEBIT_CARD" : "CREDIT_CARD";

    const chargeObj = {
      reference_id: referencia,
      description: "Pedido MIX-PROMOÇÃO",
      amount: { value: totalCentavos, currency: "BRL" },
      payment_method: {
        type: paymentType,
        installments: 1,
        capture: true,
        card: {
          encrypted: cartao.encrypted
        }
      }
    };

    if (paymentType === "DEBIT_CARD") {
      chargeObj.payment_method.authentication_method = {
        type: "THREEDS",
        id: cartao.authenticationId || ""
      };
    }

    const body = {
      reference_id: referencia,
      customer: {
        name: cliente.nome,
        email: cliente.email,
        tax_id: cliente.cpf || "00000000000",
        phones: [{
          country: "55",
          area: (cliente.telefone || "").replace(/\D/g, "").substring(0, 2),
          number: (cliente.telefone || "").replace(/\D/g, "").substring(2, 11),
          type: "MOBILE"
        }]
      },
      items: itens.map(i => ({
        reference_id: String(i.id || "item"),
        name: i.nome.substring(0, 64),
        quantity: i.quantidade,
        unit_amount: Math.round(i.precoUnitario * 100)
      })),
      charges: [chargeObj],
      notification_urls: [PAGBANK_NOTIFICATION_URL]
    };

    // Em modo fake (desenvolvimento sem token ou origem Live Server) não chamamos API externa
    if (useFake) {
      const fakeOrderId = `FAKE-${Date.now()}`;
      console.warn('[PagBank FAKE] criando pedido simulado', { referencia, fakeOrderId });
      return res.json({
        sucesso: true,
        pedidoId: fakeOrderId,
        status: 'PAID',
        pagamento: { tipo: paymentType, status: 'PAID' }
      });
    }

    const response = await axios.post(`${PAGBANK_API}/orders`, body, {
      headers: {
        "Authorization": `Bearer ${PAGBANK_TOKEN}`,
        "Content-Type": "application/json",
        "x-idempotency-key": referencia
      }
    });

    const order = response.data;
    const charge = order.charges && order.charges[0];

    res.json({
      sucesso: true,
      pedidoId: order.id,
      status: charge?.status || order.status,
      pagamento: {
        tipo: paymentType,
        status: charge?.status
      }
    });
  } catch (error) {
    console.error("Erro PagBank Cartão:", error.response?.data || error.message);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao processar pagamento com cartão",
      detalhes: error.response?.data?.error_messages || error.message
    });
  }
});

// Consultar status do pedido
app.get("/api/pagbank/pedido/:id", async (req, res) => {
  try {
    if (!validarPagBankConfig(res)) return;

    const response = await axios.get(`${PAGBANK_API}/orders/${req.params.id}`, {
      headers: { "Authorization": `Bearer ${PAGBANK_TOKEN}` }
    });
    res.json({ sucesso: true, pedido: response.data });
  } catch (error) {
    console.error("Erro consultar pedido PagBank:", error.response?.data || error.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao consultar pedido" });
  }
});

// Chave pública PagBank (para encriptar cartão no frontend)
app.get("/api/pagbank/public-key", async (req, res) => {
  try {
    const origem = req.get('origin') || req.get('referer') || '';
    const fromLiveServer = /:(5500|5501)(?:\/|$)/.test(origem) || req.get('x-live-server') === '1';
    const useFake = PAGBANK_FAKE || fromLiveServer;
    if (!useFake && !validarPagBankConfig(res)) return;

    // Em modo fake (desenvolvimento sem token ou origem Live Server), retornamos uma chave pública de teste
    if (useFake) {
      const fakeKey = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvFakePublicKeyForDev\n-----END PUBLIC KEY-----';
      return res.json({ sucesso: true, publicKey: fakeKey });
    }

    const response = await axios.post(`${PAGBANK_API}/public-keys`, {
      type: "card"
    }, {
      headers: {
        "Authorization": `Bearer ${PAGBANK_TOKEN}`,
        "Content-Type": "application/json"
      }
    });
    res.json({ sucesso: true, publicKey: response.data.public_key });
  } catch (error) {
    console.error("Erro ao obter chave pública PagBank:", error.response?.data || error.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao obter chave pública" });
  }
});

// Webhook de notificações do PagBank
app.post("/api/pagbank/notificacao", (req, res) => {
  console.log("Notificação PagBank recebida:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

// ---------------- RECUPERAÇÃO E REDEFINIÇÃO DE SENHA ---------------- //
const nodemailer = require("nodemailer");
// Criação da tabela de tokens de redefinição, se não existir
(async () => {
  const connection = await createDbConnection();
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS redefinicao_senha (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      token VARCHAR(255) NOT NULL,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      usado TINYINT(1) DEFAULT 0
    )
  `);
  await connection.end();
})();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "seu_email@gmail.com",
    pass: process.env.SMTP_PASS || "sua_senha"
  }
});

// Enviar link de redefinição
app.post("/api/enviar-redefinicao", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ sucesso: false, mensagem: "E-mail obrigatório." });
  try {
    const connection = await createDbConnection();
    const [rows] = await connection.execute("SELECT id FROM clientes WHERE email = ?", [email]);
    if (!rows.length) {
      await connection.end();
      // Não revela se existe ou não
      return res.json({ sucesso: true });
    }
    // Gera token seguro
    const token = crypto.randomBytes(32).toString("hex");
    await connection.execute("INSERT INTO redefinicao_senha (email, token) VALUES (?, ?)", [email, token]);
    await connection.end();

    // Link para redefinir senha
    const url = `${SITE_URL}/html/redefinir-senha.html?token=${token}`;
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Mix Promoção <no-reply@mixpromocao.com>',
      to: email,
      subject: "Redefinição de senha - Mix Promoção",
      html: `<p>Você solicitou a redefinição de senha.</p><p><a href='${url}'>Clique aqui para redefinir sua senha</a></p><p>Se não foi você, ignore este e-mail.</p>`
    });
    res.json({ sucesso: true });
  } catch (error) {
    console.error("Erro ao enviar e-mail de redefinição:", error.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao enviar e-mail." });
  }
});

// Redefinir senha
app.post("/api/redefinir-senha", async (req, res) => {
  const { token, novaSenha } = req.body;
  if (!token || !novaSenha) return res.status(400).json({ sucesso: false, mensagem: "Token e nova senha obrigatórios." });
  try {
    const connection = await createDbConnection();
    // Busca token válido e não usado (válido por 1h)
    const [rows] = await connection.execute(
      "SELECT email, usado, criado_em FROM redefinicao_senha WHERE token = ?",
      [token]
    );
    if (!rows.length || rows[0].usado) {
      await connection.end();
      return res.status(400).json({ sucesso: false, mensagem: "Token inválido ou expirado." });
    }
    const criadoEm = new Date(rows[0].criado_em);
    if (Date.now() - criadoEm.getTime() > 60 * 60 * 1000) { // 1 hora
      await connection.end();
      return res.status(400).json({ sucesso: false, mensagem: "Token expirado." });
    }
    const email = rows[0].email;
    // Atualiza senha
    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await connection.execute("UPDATE clientes SET senha_hash = ? WHERE email = ?", [senhaHash, email]);
    // Marca token como usado
    await connection.execute("UPDATE redefinicao_senha SET usado = 1 WHERE token = ?", [token]);
    await connection.end();
    res.json({ sucesso: true, mensagem: "Senha redefinida com sucesso!" });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao redefinir senha." });
  }
});

// ---------------- INICIAR SERVIDOR ---------------- //
(async () => {
  try {
    await garantirTabelas();
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
      console.log(`Ambiente: ${NODE_ENV}`);
      console.log(`PagBank API: ${PAGBANK_API}`);
      console.log(`Webhook: ${PAGBANK_NOTIFICATION_URL}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar servidor:", error.message);
    process.exit(1);
  }
})();


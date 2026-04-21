

DROP TABLE clientes;


ALTER TABLE imagensextras DROP FOREIGN KEY imagensextras_ibfk_1;

ALTER TABLE clientes ADD COLUMN cpf VARCHAR(20);

SELECT * FROM clientes;

USE mixpromocaodb;

CREATE TABLE produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Dados da vitrine
  nome VARCHAR(255) NOT NULL,
  preco_antigo DECIMAL(10,2),
  preco_atual DECIMAL(10,2) NOT NULL,
  imagem_principal VARCHAR(255),

  -- Detalhes do produto
  nome_detalhes VARCHAR(255),
  video VARCHAR(255),
  imagem_extra1 VARCHAR(255),
  imagem_extra2 VARCHAR(255),
  imagem_extra3 VARCHAR(255),
  imagem_extra4 VARCHAR(255),
  imagem_extra5 VARCHAR(255),

  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,              -- Nome do Usuário
  sobrenome VARCHAR(100) NOT NULL,         -- Sobrenome do Usuário
  email VARCHAR(150) NOT NULL UNIQUE,      -- E-mail
  telefone VARCHAR(20) NOT NULL,           -- Telefone
  cpf VARCHAR(14) NOT NULL UNIQUE,         -- CPF do cliente (formato 000.000.000-00)
  senha_hash VARCHAR(255) NOT NULL,        -- Senha criptografada (bcrypt)
  rua VARCHAR(150) NOT NULL,               -- Rua
  bairro VARCHAR(100) NOT NULL,            -- Bairro
  numero VARCHAR(10) NOT NULL,             -- Número
  complemento VARCHAR(100),                -- Complemento
  estado VARCHAR(50) NOT NULL,             -- Estado
  data_nascimento DATE NOT NULL,           -- Data de Nascimento
  foto LONGBLOB                            -- Foto do cliente (binário)
);

-- Cria tabela de comentários
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
);

-- Cria tabela de attachments de comentários
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
);

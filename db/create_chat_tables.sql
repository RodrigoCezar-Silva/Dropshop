-- Cria tabelas de chat para persistir conversas e mensagens
-- Execute este script no seu banco (phpMyAdmin) se preferir aplicar manualmente.

CREATE TABLE IF NOT EXISTS `chat_conversations` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(255) DEFAULT 'Cliente',
  `status` VARCHAR(40) DEFAULT 'open',
  `unread` INT DEFAULT 0,
  `last_message_preview` VARCHAR(1000),
  `online` TINYINT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `chat` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `conversation_id` BIGINT NOT NULL,
  `sender` VARCHAR(40) DEFAULT 'visitor',
  `sender_name` VARCHAR(255),
  `text` LONGTEXT,
  `sent_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`conversation_id`),
  CONSTRAINT `fk_chat_conv` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

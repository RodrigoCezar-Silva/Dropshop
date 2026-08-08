const bcrypt = require("bcrypt");

// copie o hash da tabela Admins
const hash = "$2b$10$qAbOFKhV6FTLFKoc75tNVeKAYBU6Mb.QES9j4Re1..."; 
const senha = "1234"; // senha que você quer testar

bcrypt.compare(senha, hash).then(result => {
  console.log("Senha válida?", result);
});
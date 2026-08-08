const bcrypt = require("bcrypt");

(async () => {
  const hash = "$2b$10$AbDFKhV6FTLExoz75tNVeKAYBUi6Mb.QE58jR4e12SNcckKzHDi"; // hash do banco
  const senha = "1234"; // senha que você quer testar
  const ok = await bcrypt.compare(senha, hash);
  console.log("Senha confere?", ok);
})();
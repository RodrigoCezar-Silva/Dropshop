const bcrypt = require("bcrypt");

async function gerarHash() {
  const senha = "1234"; // senha escolhida
  const hash = await bcrypt.hash(senha, 10);
  console.log(hash);
}

gerarHash();
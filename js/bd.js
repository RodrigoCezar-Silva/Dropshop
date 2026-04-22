// Rota para buscar dados do cliente
app.get("/api/cliente/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "123456",
      database: "mix_promocao"
    });

    const [rows] = await connection.execute("SELECT * FROM clientes WHERE id = ?", [id]);
    await connection.end();

    if (rows.length === 0) {
      return res.status(404).json({ sucesso: false, mensagem: "Cliente não encontrado!" });
    }

    const cliente = rows[0];
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
      foto: cliente.foto ? Buffer.from(cliente.foto).toString("base64") : null
    });
  } catch (error) {
    console.error("Erro ao buscar cliente:", error.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro no servidor!" });
  }
});

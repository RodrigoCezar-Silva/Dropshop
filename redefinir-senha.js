document.getElementById('redefinirSenhaForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const novaSenha = document.getElementById('novaSenha').value;
    const repitaSenha = document.getElementById('repitaSenha').value;
    const mensagem = document.getElementById('mensagem');

    if(novaSenha !== repitaSenha) {
        mensagem.textContent = 'As senhas não coincidem.';
        mensagem.style.color = '#d32f2f';
        return;
    }
    // Aqui você faria uma requisição para o backend atualizar a senha
    // Exemplo fictício:
    const currentPort = window.location.port;
    const apiBase = (currentPort && currentPort !== '3000') ? 'http://localhost:3000' : '';
    fetch(`${apiBase}/api/redefinir-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novaSenha })
    })
    .then(res => res.json())
    .then(data => {
        if(data.sucesso) {
            mensagem.textContent = 'Senha redefinida com sucesso!';
            mensagem.style.color = '#388e3c';
        } else {
            mensagem.textContent = 'Erro ao redefinir senha.';
            mensagem.style.color = '#d32f2f';
        }
    })
    .catch(() => {
        mensagem.textContent = 'Erro ao redefinir senha.';
        mensagem.style.color = '#d32f2f';
    });
});

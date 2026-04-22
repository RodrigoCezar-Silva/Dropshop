document.getElementById('esqueciSenhaForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    // Aqui você faria uma requisição para o backend enviar o e-mail
    // Exemplo fictício:
    const currentPort = window.location.port;
    const apiBase = (currentPort && currentPort !== '3000') ? 'http://localhost:3000' : '';
    fetch(`${apiBase}/api/enviar-redefinicao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    })
    .then(res => res.json())
    .then(data => {
        if(data.sucesso) {
            document.getElementById('mensagem').textContent = 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.';
        } else {
            document.getElementById('mensagem').textContent = 'Erro ao enviar e-mail. Tente novamente.';
        }
    })
    .catch(() => {
        document.getElementById('mensagem').textContent = 'Erro ao enviar e-mail. Tente novamente.';
    });
});

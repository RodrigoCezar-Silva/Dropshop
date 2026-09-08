/**
 * Cadastro de clientes.
 * Gerencia validação de senhas, força da senha digitada e máscaras.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Se houver token/clienteId, buscar dados do cliente e preencher o formulário (editar perfil)
  (async function prefillIfLogged(){
    try{
      const token = localStorage.getItem('token');
      const clienteId = localStorage.getItem('clienteId') || localStorage.getItem('id');
      if(!token || !clienteId) return;
      const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? `${window.location.protocol}//${window.location.hostname}:3000`
        : window.location.origin;
      // Preferir o endpoint protegido /api/cliente/me quando houver token
      let res;
      try {
        res = await fetch(`${apiBase}/api/cliente/me`, { headers: { 'Authorization': 'Bearer '+token } });
      } catch (e) {
        res = await fetch(`${apiBase}/api/cliente/${clienteId}`, { headers: { 'Authorization': 'Bearer '+token } });
      }
      if(!res.ok) return;
      const json = await res.json();
      if(!json.sucesso) return;
      const data = json;
      // Preencher campos
      const map = {
        nome: 'nome',
        cpf: 'cpf',
        data_nascimento: 'dataNascimento',
        email: 'email',
        telefone: 'telefone',
        cep: 'cep',
        rua: 'rua',
        numero: 'numero',
        complemento: 'complemento',
        bairro: 'bairro',
        cidade: 'cidade',
        estado: 'estado'
      };
      Object.keys(map).forEach(k=>{
        if(data[k] !== undefined && document.getElementById(map[k])){
          if(k === 'data_nascimento'){
            document.getElementById(map[k]).value = data[k] ? new Date(data[k]).toISOString().split('T')[0] : '';
          } else {
            document.getElementById(map[k]).value = data[k] || '';
          }
        }
      });

      // Foto: usar fotoBase64 se disponível, senão tentar buscar /foto (protegido)
      const previewImg = document.getElementById('fotoCirculoPreview');
      const icone = document.getElementById('iconeFotoCirculo');
      if(data.fotoBase64){
        if(previewImg){ previewImg.src = `data:${data.fotoMime || 'image/jpeg'};base64,${data.fotoBase64}`; previewImg.style.display='block'; }
        if(icone) icone.style.display='none';
      } else {
        // tenta GET /api/cliente/:id/foto
        try{
          const fotoRes = await fetch(`${apiBase}/api/cliente/${clienteId}/foto`, { headers: { 'Authorization': 'Bearer '+token } });
          if(fotoRes.ok){
            const blob = await fotoRes.blob();
            const url = URL.createObjectURL(blob);
            if(previewImg){ previewImg.src = url; previewImg.style.display='block'; }
            if(icone) icone.style.display='none';
          }
        }catch(e){ /* ignorar */ }
      }
    }catch(e){ console.warn('Não foi possível preencher dados do cliente', e); }
  })();
    // Envio AJAX do formulário de cadastro de cliente
    const form = document.querySelector('.cadastro-form-novo');
    if (form) {
      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(form);
        // Ajuste: backend espera o campo 'foto', não 'fotoCliente'
        const fotoInput = document.getElementById('fotoCliente');
        if (fotoInput && fotoInput.files && fotoInput.files[0]) {
          formData.set('foto', fotoInput.files[0]);
          formData.delete('fotoCliente');
        }
        try {
          // Detecta se está rodando via Live Server (porta 5500/5501) e usa o backend na porta 3000
          const backendUrl = window.location.port === '5500' || window.location.port === '5501'
            ? 'http://localhost:3000/cliente/cadastro'
            : '/cliente/cadastro';
          const response = await fetch(backendUrl, {
            method: 'POST',
            body: formData
          });
          const result = await response.json();
          if (result.sucesso) {
            mostrarMensagemSucesso('Cadastro realizado com sucesso! Redirecionando para login...');
            setTimeout(() => {
              window.location.href = 'login-cliente.html';
            }, 2000);
            form.reset();
            // Limpa preview da foto
            const previewImg = document.getElementById('fotoCirculoPreview');
            const icone = document.getElementById('iconeFotoCirculo');
            if (previewImg && icone) {
              previewImg.style.display = 'none';
              icone.style.display = 'block';
            }
          } else {
            mostrarMensagemErro('Erro ao cadastrar: ' + (result.mensagem || 'Tente novamente.'));
          }
        } catch (err) {
          mostrarMensagemErro('Erro de conexão com o servidor.');
        }
      });
    }

    // Mensagem estilosa de sucesso
    function mostrarMensagemSucesso(msg) {
      let div = document.getElementById('mensagemCadastroSucesso');
      if (!div) {
        div = document.createElement('div');
        div.id = 'mensagemCadastroSucesso';
        div.className = 'mensagem-cadastro-sucesso';
        document.body.appendChild(div);
      }
      div.textContent = msg;
      div.style.display = 'block';
      setTimeout(() => { div.style.display = 'none'; }, 4000);
    }
    // Mensagem estilosa de erro
    function mostrarMensagemErro(msg) {
      let div = document.getElementById('mensagemCadastroErro');
      if (!div) {
        div = document.createElement('div');
        div.id = 'mensagemCadastroErro';
        div.className = 'mensagem-cadastro-erro';
        document.body.appendChild(div);
      }
      div.textContent = msg;
      div.style.display = 'block';
      setTimeout(() => { div.style.display = 'none'; }, 4000);
    }
  const formCadastro = document.getElementById("cadastroClienteForm");
  const senhaInput = document.getElementById("senha");
  const confirmarSenhaInput = document.getElementById("confirmaSenha");
  const toggleSenha = document.getElementById("toggleSenha");
  const toggleConfirmarSenha = document.getElementById("toggleConfirmarSenha");
  const msgSenha = document.getElementById("mensagemSenha");

  // Medidor de força de senha
  function medirForcaSenha(senha) {
    let forca = 0;
    if (senha.length >= 6) forca++;
    if (/[A-Z]/.test(senha)) forca++;
    if (/[a-z]/.test(senha)) forca++;
    if (/[0-9]/.test(senha)) forca++;
    if (/[^A-Za-z0-9]/.test(senha)) forca++;
    return forca;
  }
  function atualizarMedidorSenha() {
    const senha = senhaInput ? senhaInput.value : '';
    const barra = document.getElementById('medidorSenhaBarra');
    const texto = document.getElementById('medidorSenhaTexto');
    const forca = medirForcaSenha(senha);
    let cor = '#e74c3c', label = 'Muito Fraca';
    if (forca === 2) { cor = '#f39c12'; label = 'Fraca'; }
    if (forca === 3) { cor = '#f1c40f'; label = 'Média'; }
    if (forca === 4) { cor = '#27ae60'; label = 'Forte'; }
    if (forca === 5) { cor = '#2ecc71'; label = 'Muito Forte'; }
    if (barra) {
      barra.style.width = (forca * 20) + '%';
      barra.style.background = cor;
    }
    if (texto) {
      texto.textContent = label;
      texto.style.color = cor;
    }
  }

  // Mostrar/ocultar senha principal
  if (toggleSenha && senhaInput) {
    toggleSenha.addEventListener("click", () => {
      senhaInput.type = senhaInput.type === "password" ? "text" : "password";
      toggleSenha.classList.toggle('fa-eye');
      toggleSenha.classList.toggle('fa-eye-slash');
    });
  }
  // Mostrar/ocultar confirmar senha
  if (toggleConfirmarSenha && confirmarSenhaInput) {
    toggleConfirmarSenha.addEventListener("click", () => {
      confirmarSenhaInput.type = confirmarSenhaInput.type === "password" ? "text" : "password";
      toggleConfirmarSenha.classList.toggle('fa-eye');
      toggleConfirmarSenha.classList.toggle('fa-eye-slash');
    });
  }

  // Máscara simples para CPF
  const cpfInput = document.getElementById("cpf");
  if (cpfInput) {
    cpfInput.addEventListener("input", () => {
      let v = cpfInput.value.replace(/\D/g, "");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      cpfInput.value = v;
    });
  }

  // Máscara simples para telefone
  const telInput = document.getElementById("telefone");
  if (telInput) {
    telInput.addEventListener("input", () => {
      let v = telInput.value.replace(/\D/g, "");
      v = v.replace(/(\d{2})(\d)/, "($1) $2");
      v = v.replace(/(\d{5})(\d)/, "$1-$2");
      telInput.value = v;
    });
  }

  // Validação de senha e confirmação
  function validarSenhas() {
    const mensagemDiv = document.getElementById("mensagemSenha");
    if (!senhaInput || !confirmarSenhaInput) return true;
    if (senhaInput.value.length < 6) {
      if (mensagemDiv) {
        mensagemDiv.textContent = "A senha deve ter pelo menos 6 caracteres.";
        mensagemDiv.style.color = "#ef4444";
      }
      return false;
    }
    if (senhaInput.value !== confirmarSenhaInput.value) {
      if (mensagemDiv) {
        mensagemDiv.textContent = "As senhas não coincidem.";
        mensagemDiv.style.color = "#ef4444";
      }
      return false;
    }
    if (mensagemDiv) mensagemDiv.textContent = "";
    return true;
  }
  if (senhaInput) {
    senhaInput.addEventListener("input", validarSenhas);
    senhaInput.addEventListener("input", atualizarMedidorSenha);
  }
  if (confirmarSenhaInput) confirmarSenhaInput.addEventListener("input", validarSenhas);

  // Envio do formulário de cadastro (apenas se existir)
  if (formCadastro) {
    formCadastro.addEventListener("submit", function(e) {
      if (!validarSenhas()) {
        e.preventDefault();
        return false;
      }
      // Aqui pode colocar o envio AJAX ou submit normal
    });
  }
});
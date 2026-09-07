document.addEventListener("DOMContentLoaded", () => {
  const tipoUsuario = localStorage.getItem("tipoUsuario");

  if (tipoUsuario !== "Administrador") {
    window.location.href = "admin-login.html";
    return;
  }

  const nav = document.querySelector('nav.menu');
  const loginButtons = document.getElementById('loginButtons');
  const menuToggle = document.getElementById('menuToggle');

  if (nav) nav.style.display = 'none';
  if (loginButtons) loginButtons.style.display = 'none';
  if (menuToggle) menuToggle.style.display = 'none';

  // 1. Personalização do Nome do Administrador
  try {
    const nome = (localStorage.getItem("nome") || "").trim();
    const sobrenome = (localStorage.getItem("sobrenome") || "").trim();
    const nomeCompleto = [nome, sobrenome].filter(Boolean).join(" ").trim() || "Rodrigo Cezar";

    const heroNomeEl = document.getElementById("heroAdminNome");
    if (heroNomeEl) heroNomeEl.textContent = nomeCompleto;

    const nomeUsuarioEl = document.getElementById("nomeUsuario");
    if (nomeUsuarioEl) nomeUsuarioEl.textContent = nomeCompleto;
  } catch (err) {
    console.warn("Erro ao carregar dados do admin:", err);
  }

  // 2. Data formatada em Português Brasileiro (ex: Domingo, 6 de Setembro de 2026)
  try {
    const dateEl = document.getElementById("adminCurrentDate");
    if (dateEl) {
      const hoje = new Date();
      const formatador = new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });
      const dataExtenso = formatador.format(hoje);
      // Capitaliza a primeira letra
      dateEl.textContent = dataExtenso.charAt(0).toUpperCase() + dataExtenso.slice(1);
    }
  } catch (err) {
    console.warn("Erro ao formatar data:", err);
  }

  // 3. Contagem real de produtos para o KPI do Hero
  async function carregarContadorProdutos() {
    const kpiEl = document.getElementById("kpiTotalProdutos");
    if (!kpiEl) return;

    try {
      // Tenta buscar da API Node primeiro
      const res = await fetch("/api/produtos");
      if (res.ok) {
        const dados = await res.json();
        if (dados && Array.isArray(dados.produtos)) {
          kpiEl.textContent = String(dados.produtos.length);
          return;
        }
      }
    } catch (e) {
      // Falha de rede suave, tenta ler do localStorage
    }

    try {
      const locais = JSON.parse(localStorage.getItem("produtosLoja") || localStorage.getItem("loja") || "[]");
      if (Array.isArray(locais) && locais.length) {
        kpiEl.textContent = String(locais.length);
        return;
      }
    } catch (e) {}

    kpiEl.textContent = "12"; // valor padrão caso o banco ainda esteja inicializando
  }
  carregarContadorProdutos();

  // 4. Sistema Interativo de Filtro por Categorias
  try {
    const tabs = document.querySelectorAll(".filter-tab");
    const cards = document.querySelectorAll("#adminCardsGrid .admin-card");

    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        const filter = tab.getAttribute("data-filter") || "all";

        cards.forEach(card => {
          const category = card.getAttribute("data-category") || "";
          if (filter === "all" || category.includes(filter)) {
            card.style.display = "flex";
            card.style.opacity = "0";
            card.style.transform = "scale(0.96)";
            requestAnimationFrame(() => {
              card.style.transition = "opacity 0.28s ease, transform 0.28s ease";
              card.style.opacity = "1";
              card.style.transform = "scale(1)";
            });
          } else {
            card.style.display = "none";
          }
        });
      });
    });
  } catch (err) {
    console.warn("Erro ao configurar filtros:", err);
  }

  // 5. Limpeza de botões duplicados e configuração de Logout
  function removerBotoesDuplicados() {
    try {
      const exits = document.querySelectorAll("#btnExitAdminPage, #btnExitOutside, #btnExitNearStatus, #btnExitRight, .btn-exit-admin:not(#adminBadgeExit)");
      exits.forEach(el => el.remove());
    } catch (e) {}
  }
  removerBotoesDuplicados();
  setTimeout(removerBotoesDuplicados, 100);
  setTimeout(removerBotoesDuplicados, 300);

  const logoutButtons = document.querySelectorAll("#adminBadgeExit, #btnExitAdminPage, #btnExitHeader, #logout");
  logoutButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("tipoUsuario");
      localStorage.removeItem("token");
      localStorage.removeItem("nome");
      localStorage.removeItem("sobrenome");
      localStorage.removeItem("isAdmin");
      window.location.href = "index.html";
    });
  });
});
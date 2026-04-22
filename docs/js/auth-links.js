// Sets GitHub OAuth links on login pages using /auth-config.json
(async function(){
  try{
    // resolve sensible candidate URLs: relative to the script, page, repo base, and root
    function candidateUrls(){
      const out = [];
      const scriptUrl = (document.currentScript && document.currentScript.src) || window.location.href;
      try { out.push(new URL('auth-config.json', scriptUrl).href); } catch(e){}
      try { out.push(new URL('auth-config.json', window.location.href).href); } catch(e){}
      const parts = window.location.pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        const repoBase = '/' + parts[0];
        out.push(window.location.origin + repoBase + '/auth-config.json');
      }
      // common fallbacks
      ['auth-config.json','./auth-config.json','../auth-config.json','/auth-config.json'].forEach(p=>{
        try{ const u = new URL(p, window.location.href).href; if (!out.includes(u)) out.push(u); }catch(e){}
      });
      return out;
    }

    const urls = candidateUrls();
    let cfg = null;
    for (const u of urls) {
      try {
        const r = await fetch(u, { cache: 'no-store' });
        if (r.ok) { cfg = await r.json(); break; }
        if (r.status === 404) {
          console.debug(`auth-links: not found at ${u} (404)`);
          continue;
        }
        console.warn(`auth-links: unexpected status ${r.status} when fetching ${u}`);
      } catch (e) {
        console.debug(`auth-links: fetch failed for ${u}`, e && e.message);
      }
    }

    if (!cfg) cfg = { authServer: window.location.origin, mockAdmin: { enabled: true, user: 'AdminMaster', pass: 'admin123' } };
    const authServer = (cfg && cfg.authServer) ? cfg.authServer.replace(/\/$/, '') : window.location.origin;

    // expose for other scripts (login handlers) to use as API base
    window.AUTH_CONFIG = cfg;
    window.AUTH_SERVER = authServer;

    const btnClient = document.getElementById('githubLoginClient');
    if (btnClient) btnClient.href = `${authServer}/auth/github-client`;

    const btnAdmin = document.getElementById('githubLoginAdmin');
    if (btnAdmin) btnAdmin.href = `${authServer}/auth/github`;
  }catch(e){
    console.error('auth-links: could not load auth-config.json. Se estiver usando GitHub Pages, verifique se auth-config.json está em `docs/` e acessível. Erro original:', e && e.message);
  }
})();

// Sets GitHub OAuth links on login pages using /auth-config.json
(async function(){
  try{
    const tryPaths = [
      './auth-config.json',
      '../auth-config.json',
      '../../auth-config.json',
      '../../../auth-config.json',
      '/auth-config.json'
    ];
    let cfg = null;
    for (const p of tryPaths) {
      try {
        const r = await fetch(p, { cache: 'no-store' });
        if (r.ok) { cfg = await r.json(); break; }
      } catch (e) { /* try next */ }
    }
    if (!cfg) cfg = { authServer: window.location.origin };
    const authServer = (cfg && cfg.authServer) ? cfg.authServer.replace(/\/$/, '') : window.location.origin;

    // expose for other scripts (login handlers) to use as API base
    window.AUTH_SERVER = authServer;

    const btnClient = document.getElementById('githubLoginClient');
    if (btnClient) btnClient.href = `${authServer}/auth/github-client`;

    const btnAdmin = document.getElementById('githubLoginAdmin');
    if (btnAdmin) btnAdmin.href = `${authServer}/auth/github`;
  }catch(e){
    console.debug('auth-links: could not load auth-config.json', e && e.message);
  }
})();

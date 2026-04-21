// Sets GitHub OAuth links on login pages using /auth-config.json
(async function(){
  try{
    const resp = await fetch('/auth-config.json');
    const cfg = resp.ok ? await resp.json() : { authServer: window.location.origin };
    const authServer = (cfg && cfg.authServer) ? cfg.authServer.replace(/\/$/, '') : window.location.origin;

    const btnClient = document.getElementById('githubLoginClient');
    if (btnClient) btnClient.href = `${authServer}/auth/github-client`;

    const btnAdmin = document.getElementById('githubLoginAdmin');
    if (btnAdmin) btnAdmin.href = `${authServer}/auth/github`;
  }catch(e){
    console.debug('auth-links: could not load auth-config.json', e && e.message);
  }
})();

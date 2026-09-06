(function(){
  'use strict';
  if (!('WebSocket' in window)) return;

  function refreshCSS() {
    try {
      var sheets = Array.prototype.slice.call(document.getElementsByTagName('link'));
      var head = document.getElementsByTagName('head')[0];
      for (var i = 0; i < sheets.length; ++i) {
        var elem = sheets[i];
        try { head.removeChild(elem); } catch(e) {}
        var rel = elem.rel;
        try {
          if (elem.href && (typeof rel !== 'string' || rel.length === 0 || rel.toLowerCase() === 'stylesheet')) {
            var url = elem.href.replace(/(&|\?)_cacheOverride=\d+/, '');
            elem.href = url + (url.indexOf('?') >= 0 ? '&' : '?') + '_cacheOverride=' + (new Date().valueOf());
          }
        } catch(e) {}
        try { head.appendChild(elem); } catch(e) {}
      }
    } catch (e) { console.debug('refreshCSS error', e); }
  }

  try {
    var protocol = window.location.protocol === 'http:' ? 'ws://' : 'wss://';
    var address = protocol + window.location.host + window.location.pathname + '/ws';
    var socket = new WebSocket(address);
    socket.onmessage = function(msg) {
      try {
        if (msg.data === 'reload') window.location.reload();
        else if (msg.data === 'refreshcss') refreshCSS();
      } catch (e) { console.error('live-reload msg handler error', e); }
    };
    socket.onopen = function(){ console.log('Live reload: connected to', address); };
    socket.onclose = function(){ console.log('Live reload: connection closed'); };
    socket.onerror = function(err){ console.debug('Live reload socket error', err); };
  } catch (e) {
    console.debug('Live reload init failed', e);
  }
})();

/* DOGANA RUSH — kill switch di emergenza.
 *
 * Controllo SOLO all'avvio (nessun polling: non appesantisce il gioco).
 * Se il telecomando pubblico dice `disabled: true`, il flag viene salvato in
 * localStorage: ai successivi avvii offline il gioco resta bloccato.
 *
 * Config separata dal canale release: vive sul branch `killswitch` del repo
 * pubblico, quindi una nuova release non la sovrascrive.
 *
 * Fail-open: se la rete non risponde e non c'è un blocco salvato, il gioco
 * parte. Fail-closed solo con `disabled: true` esplicito o flag già salvato.
 *
 * Query di servizio:
 *   ?killswitch=off  disabilita il controllo in questa sessione (QA/debug)
 *   ?killswitch=1    forza il check anche su localhost
 */
(function () {
  'use strict';
  if (window.DOGANA_KILLSWITCH) return;

  var CONFIG = {
    url: 'https://raw.githubusercontent.com/gstorelli/dogana-rush-updates/killswitch/killswitch.json',
    storageKey: 'dogana.killswitch.v1',
    timeoutMs: 2000,
    defaultMessage: 'DOGANA RUSH è temporaneamente sospeso. Riprova più tardi.'
  };

  var params = null;
  try { params = new URLSearchParams(location.search); } catch (e) { params = null; }
  var mode = params ? params.get('killswitch') : null;
  var force = mode === '1';

  var screen = document.getElementById('killswitch-screen');
  var msgEl = document.getElementById('killswitch-message');
  var retryEl = document.getElementById('killswitch-retry');
  var titleBefore = document.title;
  var state = { blocked: false, source: 'none', message: '', since: null, error: null };
  var finished = false;
  var resolveReady = null;
  var ready = new Promise(function (resolve) { resolveReady = resolve; });

  function readSaved() {
    try {
      var raw = localStorage.getItem(CONFIG.storageKey);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return data && data.disabled === true ? data : null;
    } catch (e) { return null; }
  }
  function saveSaved(info) {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify({
        disabled: true,
        message: info.message,
        since: info.since || new Date().toISOString(),
        version: info.version || null
      }));
    } catch (e) { /* storage pieno/privato: resta bloccato in memoria */ }
  }
  function clearSaved() {
    try { localStorage.removeItem(CONFIG.storageKey); } catch (e) {}
  }
  function show(info) {
    if (!screen) return;
    if (msgEl) msgEl.textContent = info.message || CONFIG.defaultMessage;
    screen.hidden = false;
    screen.setAttribute('aria-hidden', 'false');
    document.body.classList.add('killswitch-active');
    document.title = 'SERVIZIO SOSPESO — DOGANA RUSH';
    var panel = screen.querySelector('.killswitch-panel');
    if (panel) panel.setAttribute('role', 'alertdialog');
  }
  function hide() {
    if (!screen) return;
    screen.hidden = true;
    screen.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('killswitch-active');
    document.title = titleBefore;
  }
  function settle(blocked, source, message, error) {
    state.blocked = !!blocked;
    state.source = source;
    state.message = message || '';
    state.error = error ? String(error) : null;
    if (finished) return;
    finished = true;
    if (blocked) show(state); else hide();
    resolveReady({
      blocked: state.blocked,
      source: state.source,
      message: state.message,
      error: state.error
    });
  }
  function resolveAllow(source) {
    state.blocked = false;
    state.source = source;
    if (finished) return;
    finished = true;
    hide();
    resolveReady({ blocked: false, source: source, message: '', error: null });
  }

  window.DOGANA_KILLSWITCH = {
    config: CONFIG,
    ready: ready,
    state: state,
    isBlocked: function () { return state.blocked; },
    show: show,
    hide: hide
  };

  if (mode === 'off') {
    resolveAllow('disabled');
    return;
  }

  var saved = readSaved();
  if (saved) {
    state.blocked = true;
    state.source = 'local';
    state.message = saved.message || CONFIG.defaultMessage;
    state.since = saved.since || null;
    show(state);
  }

  if (retryEl) {
    retryEl.addEventListener('click', function () { location.reload(); });
  }

  var isHttp = location.protocol === 'http:' || location.protocol === 'https:';
  var host = location.hostname;
  var isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  if (!isHttp || (isLocalhost && !force)) {
    settle(!!saved, saved ? 'local' : 'skipped', saved && saved.message);
    return;
  }

  var controller = null;
  var timer = null;
  try { controller = new AbortController(); } catch (e) { controller = null; }
  if (controller) {
    timer = setTimeout(function () { try { controller.abort(); } catch (e) {} }, CONFIG.timeoutMs);
  } else {
    // Browser senza AbortController: non lasciare mai il boot appeso.
    timer = setTimeout(function () {
      if (saved) settle(true, 'local', saved.message, 'timeout');
      else resolveAllow('timeout');
    }, CONFIG.timeoutMs);
  }

  var url = CONFIG.url + '?t=' + Date.now();
  fetch(url, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'omit',
    signal: controller ? controller.signal : undefined
  }).then(function (res) {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }).then(function (data) {
    if (timer) clearTimeout(timer);
    if (data && data.disabled === true) {
      var info = {
        message: typeof data.message === 'string' && data.message.trim() ? data.message.trim() : CONFIG.defaultMessage,
        since: typeof data.since === 'string' ? data.since : new Date().toISOString(),
        version: data.version || null
      };
      saveSaved(info);
      settle(true, 'remote', info.message);
      return;
    }
    if (data && data.disabled === false) {
      clearSaved();
      resolveAllow('remote');
      return;
    }
    // JSON presente ma senza un boolean esplicito: non è un blocco.
    if (saved) settle(true, 'local', saved.message);
    else resolveAllow('remote-invalid');
  }).catch(function (err) {
    if (timer) clearTimeout(timer);
    if (saved) settle(true, 'local', saved.message, err);
    else resolveAllow('offline');
  });

})();

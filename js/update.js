/* DOGANA RUSH — client di aggiornamento per web/PWA e Android (WebView Capacitor).
   Script autonomo, nessuna dipendenza: legge la release configurata in
   js/update-config.js, confronta la versione remota con `window.DOGANA.version`
   e propone un aggiornamento NON bloccante. Se il canale non risponde (repo
   privato, 404, rate-limit, offline) resta silenzioso e non blocca mai l'avvio.

   Aggiunge al DOM:
   - #update-banner (role="status", aria-live="polite", dismissibile) in #stage;
   - #btn-update-check (chip "AGGIORNAMENTI") in #utility-bar .utility-actions;
   - #update-toast, toast minimale per l'esito del check manuale.
   Espone `window.DOGANA_UPDATE` { check(), versionUrl(), state, ... } per QA/test. */
(function () {
  'use strict';

  var DEFAULTS = {
    enabled: true,
    channel: 'gstorelli/dogana-rush-updates',
    asset: 'version.json',
    baseUrl: 'https://raw.githubusercontent.com/gstorelli/dogana-rush-updates/gh-pages',
    checkIntervalHours: 6,
    allowLocalhost: false,
    timeoutMs: 6000,
    delayMs: 2500
  };
  var KEY_LAST = 'dogana.update.lastCheck';
  var KEY_DISMISSED = 'dogana.update.dismissed';

  var CFG = Object.assign({}, DEFAULTS, window.DOGANA_UPDATE_CONFIG || {});
  window.DOGANA_UPDATE_CONFIG = CFG;

  var params = null;
  try { params = new URLSearchParams(location.search); } catch (e) { params = null; }
  function q(name) { return params ? params.get(name) : null; }
  var FORCE = q('updatecheck') === '1' || q('updatecheck') === 'true';
  var OFF = q('update-off') === '1' || q('update-off') === 'true';

  var state = {
    status: 'idle',
    reason: null,
    remote: null,
    local: versionLocale(),
    error: null,
    lastCheck: 0,
    checking: null
  };
  var banner = null;
  var bannerKind = null;
  var toastEl = null;
  var toastTimer = null;
  var swWatchTimer = null;

  /* ---------- utility ---------- */

  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function storageSet(key, val) {
    try { window.localStorage.setItem(key, val); } catch (e) { /* storage negato */ }
  }
  function storageDel(key) {
    try { window.localStorage.removeItem(key); } catch (e) { /* storage negato */ }
  }
  function sleep(ms) {
    return new Promise(function (resolve) { window.setTimeout(resolve, ms); });
  }
  function stageEl() {
    return document.getElementById('stage') || document.body;
  }
  function versionLocale() {
    var d = window.DOGANA;
    return (d && typeof d.version === 'string' && d.version) ? d.version : null;
  }

  /** URL del manifest di versione: `${baseUrl}/version.json` oppure la latest release GitHub. */
  function versionUrl() {
    var base = String(CFG.baseUrl || '').trim().replace(/\/+$/, '');
    var asset = String(CFG.asset || 'version.json').trim().replace(/^\/+/, '') || 'version.json';
    if (base) return base + '/' + asset;
    var channel = String(CFG.channel || '').trim().replace(/^\/+|\/+$/g, '');
    if (!channel) return '';
    return 'https://github.com/' + channel + '/releases/latest/download/' + asset;
  }

  function isLocalHost() {
    var h = String(location.hostname || '').toLowerCase();
    return h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '[::1]' || h === '0.0.0.0';
  }

  function isAndroidNative() {
    try {
      var cap = window.Capacitor;
      if (cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) return true;
      if (cap && typeof cap.getPlatform === 'function' && cap.getPlatform() === 'android') return true;
    } catch (e) { /* bridge assente */ }
    var bridge = window.DoganaNative;
    return !!(bridge && (typeof bridge.openUrl === 'function'
      || typeof bridge.downloadApk === 'function'
      || typeof bridge.getVersionName === 'function'));
  }

  /** Versione installata letta dal bridge nativo, se disponibile. */
  function installedAndroidVersion() {
    var bridge = window.DoganaNative;
    if (!bridge) return '';
    var name = '';
    var code = '';
    try {
      if (typeof bridge.getVersionName === 'function') name = String(bridge.getVersionName() || '');
      if (typeof bridge.getVersionCode === 'function') code = String(bridge.getVersionCode() || '');
    } catch (e) { /* bridge difettoso: ignora */ }
    if (!name && !code) return '';
    return 'INSTALLATO ' + (name || '?') + (code ? ' (' + code + ')' : '');
  }

  /* ---------- semver ---------- */

  function parseVersion(v) {
    var raw = String(v == null ? '' : v).trim().replace(/^v/i, '').split('-')[0];
    var parts = raw.split('.');
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var n = parseInt(parts[i], 10);
      out.push(isFinite(n) ? n : 0);
    }
    return out;
  }
  /** -1 remoto più vecchio, 0 uguali, 1 remoto più recente (confronto numerico). */
  function compareVersions(remote, local) {
    var a = parseVersion(remote);
    var b = parseVersion(local);
    var len = Math.max(a.length, b.length);
    for (var i = 0; i < len; i++) {
      var x = a[i] || 0;
      var y = b[i] || 0;
      if (x !== y) return x > y ? 1 : -1;
    }
    return 0;
  }

  /* ---------- skip ---------- */

  function skipReason(force) {
    if (OFF || !CFG.enabled) return 'disabled';
    if (location.protocol === 'file:') return 'file';
    if (!versionUrl()) return 'no-channel';
    if (isLocalHost() && !CFG.allowLocalhost && !force) return 'localhost';
    if (!force) {
      var last = parseInt(storageGet(KEY_LAST) || '0', 10) || 0;
      var hours = Number(CFG.checkIntervalHours) || 0;
      if (last > 0 && hours > 0 && Date.now() - last < hours * 3600 * 1000) return 'interval';
    }
    return null;
  }

  /* ---------- fetch ---------- */

  function fetchVersion() {
    var url = versionUrl();
    var timeout = Math.max(1000, Number(CFG.timeoutMs) || DEFAULTS.timeoutMs);
    var ctrl = (typeof AbortController === 'function') ? new AbortController() : null;
    var timer = ctrl ? window.setTimeout(function () { try { ctrl.abort(); } catch (e) { /* già abortito */ } }, timeout) : null;
    var opts = {
      cache: 'no-store',
      credentials: 'omit',
      headers: { Accept: 'application/json' },
      signal: ctrl ? ctrl.signal : undefined
    };
    return fetch(url, opts).then(function (res) {
      if (!res || !res.ok) throw new Error('HTTP ' + (res ? res.status : '?'));
      return res.text();
    }).then(function (text) {
      var data = null;
      try { data = JSON.parse(text); } catch (e) { throw new Error('version.json non valido'); }
      if (!data || typeof data !== 'object') throw new Error('version.json non valido');
      if (typeof data.version !== 'string' || !data.version.trim()) throw new Error('version mancante');
      return data;
    }).then(function (data) {
      if (timer) window.clearTimeout(timer);
      return data;
    }, function (err) {
      if (timer) window.clearTimeout(timer);
      throw err;
    });
  }

  /* ---------- banner ---------- */

  function ensureBanner() {
    if (banner && banner.isConnected) return banner;
    banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.className = 'dogana-update-banner';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-atomic', 'true');
    banner.hidden = true;
    stageEl().appendChild(banner);
    return banner;
  }

  function clearBanner() {
    if (!banner) return;
    banner.textContent = '';
    bannerKind = null;
    banner.dataset.kind = '';
  }

  function hideBanner() {
    if (!banner) return;
    var hadFocus = banner.contains(document.activeElement);
    banner.hidden = true;
    banner.classList.remove('show');
    bannerKind = null;
    if (hadFocus) {
      var back = document.getElementById('btn-update-check');
      if (back && typeof back.focus === 'function') { try { back.focus(); } catch (e) { /* noop */ } }
    }
  }

  function bannerTitle(text) {
    var p = document.createElement('p');
    p.className = 'dub-title';
    p.textContent = text;
    return p;
  }
  function bannerLine(cls, text) {
    var p = document.createElement('p');
    p.className = cls;
    p.textContent = text;
    return p;
  }
  function bannerButton(label, id, primary) {
    var b = document.createElement('button');
    b.type = 'button';
    b.id = id;
    b.className = 'dub-btn' + (primary ? ' dub-primary' : '');
    b.textContent = label;
    return b;
  }
  function mountBanner(kind) {
    var el = ensureBanner();
    el.dataset.kind = kind;
    bannerKind = kind;
    el.hidden = false;
    el.classList.add('show');
    return el;
  }

  function notesText(remote) {
    var n = remote && remote.notes;
    if (Array.isArray(n)) n = n.slice(0, 3).join(' · ');
    if (typeof n !== 'string') return '';
    n = n.replace(/\s+/g, ' ').trim();
    if (n.length > 160) n = n.slice(0, 157).trim() + '…';
    return n;
  }

  function androidInfo(remote) {
    var a = remote && remote.android;
    if (!a || typeof a !== 'object') return '';
    var parts = [];
    var v = (typeof a.version === 'string' && a.version) ? a.version : remote.version;
    if (a.versionCode != null && a.versionCode !== '') parts.push('APK v' + v + ' · BUILD ' + a.versionCode);
    else parts.push('APK v' + v);
    if (typeof a.sha256 === 'string' && a.sha256) parts.push('SHA256 ' + a.sha256.slice(0, 12) + '…');
    var installed = installedAndroidVersion();
    if (installed) parts.push(installed);
    return parts.join(' · ');
  }

  function dismiss(version) {
    storageSet(KEY_DISMISSED, String(version));
  }

  function showVersionBanner(remote, manual) {
    if (bannerKind === 'update' && banner && !banner.hidden && banner.dataset.version === remote.version) return;
    if (manual) storageDel(KEY_DISMISSED);
    var el = ensureBanner();
    el.textContent = '';
    el.dataset.version = remote.version;
    el.appendChild(bannerTitle('AGGIORNAMENTO v' + remote.version + ' DISPONIBILE'));
    var notes = notesText(remote);
    if (notes) el.appendChild(bannerLine('dub-notes', notes));
    var info = androidInfo(remote);
    if (info) {
      var line = bannerLine('dub-info', info);
      line.title = 'APK Android' + (remote.android && remote.android.sha256 ? ' · sha256 ' + remote.android.sha256 : '');
      if (remote.android && remote.android.sha256) line.dataset.sha256 = remote.android.sha256;
      el.appendChild(line);
    }
    var actions = document.createElement('div');
    actions.className = 'dub-actions';
    var go = bannerButton('AGGIORNA', 'update-banner-apply', true);
    go.addEventListener('click', function () { applyUpdate(state.remote || remote, go); });
    var later = bannerButton('PIÙ TARDI', 'update-banner-dismiss', false);
    later.setAttribute('aria-label', 'Più tardi: non mostrare più questo aggiornamento');
    later.addEventListener('click', function () {
      dismiss(remote.version);
      hideBanner();
      toast('AGGIORNAMENTO RIMANDATO');
    });
    actions.appendChild(go);
    actions.appendChild(later);
    el.appendChild(actions);
    el.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && bannerKind === 'update') {
        ev.stopPropagation();
        dismiss(remote.version);
        hideBanner();
      }
    });
    mountBanner('update');
  }

  function showSwBanner() {
    if (bannerKind === 'update' && banner && !banner.hidden) return; // non duplicare
    if (bannerKind === 'sw' && banner && !banner.hidden) return;
    var el = ensureBanner();
    el.textContent = '';
    el.appendChild(bannerTitle('NUOVA VERSIONE PRONTA'));
    el.appendChild(bannerLine('dub-notes', 'Ricarica per applicare i file aggiornati. I dati di gioco restano.'));
    var actions = document.createElement('div');
    actions.className = 'dub-actions';
    var reload = bannerButton('RICARICA ORA', 'update-banner-reload', true);
    reload.addEventListener('click', function () { applyServiceWorkerUpdate(reload); });
    var later = bannerButton('PIÙ TARDI', 'update-banner-dismiss', false);
    later.addEventListener('click', function () {
      hideBanner();
      toast('RICARICA QUANDO VUOI');
    });
    actions.appendChild(reload);
    actions.appendChild(later);
    el.appendChild(actions);
    mountBanner('sw');
  }

  /* ---------- toast ---------- */

  function toast(msg, duration) {
    var host = stageEl();
    if (!host) return;
    if (!toastEl || !toastEl.isConnected) {
      toastEl = document.createElement('div');
      toastEl.id = 'update-toast';
      toastEl.className = 'toast update-toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      host.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove('show');
    }, Math.max(1500, Number(duration) || 4200));
  }

  /* ---------- aggiornamento: web/PWA ---------- */

  function waitControllerChange(nav, ms) {
    return new Promise(function (resolve) {
      if (!nav || !nav.controller) { resolve(false); return; }
      var done = false;
      var timer = window.setTimeout(function () {
        if (done) return;
        done = true;
        nav.removeEventListener('controllerchange', onChange);
        resolve(false);
      }, ms);
      function onChange() {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        nav.removeEventListener('controllerchange', onChange);
        resolve(true);
      }
      nav.addEventListener('controllerchange', onChange);
    });
  }

  function clearCaches() {
    if (!window.caches || typeof window.caches.keys !== 'function') return Promise.resolve(0);
    return window.caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        return window.caches.delete(key).catch(function () { return false; });
      }));
    }).then(function (res) { return res.length; }).catch(function () { return 0; });
  }

  function reloadWithVersion(version) {
    try {
      var url = new URL(location.href);
      url.searchParams.set('v', String(version || Date.now()));
      location.replace(url.toString());
    } catch (e) {
      try { location.reload(); } catch (e2) { /* noop */ }
    }
  }

  function applyWeb(remote, go) {
    var nav = navigator.serviceWorker;
    var chain = Promise.resolve(null);
    if (nav && typeof nav.getRegistration === 'function') {
      chain = nav.getRegistration().then(function (reg) {
        if (!reg) return null;
        var changed = waitControllerChange(nav, 4000);
        return Promise.resolve()
          .then(function () { return reg.update(); })
          .catch(function () { /* offline: si prosegue con la cache pulita */ })
          .then(function () {
            // dà al browser il tempo di mettere il nuovo worker in installing/waiting
            var tries = 0;
            function poll() {
              if (reg.waiting || reg.installing || tries++ >= 4) return Promise.resolve();
              return sleep(150).then(poll);
            }
            return poll();
          })
          .then(function () {
            if (reg.waiting) {
              try { reg.waiting.postMessage({ type: 'SKIP_WAITING' }); } catch (e) { /* noop */ }
              return changed;
            }
            if (reg.installing) return changed;
            return null;
          });
      });
    }
    return chain.then(function () {
      return clearCaches();
    }).then(function () {
      reloadWithVersion(remote.version);
    });
  }

  /* ---------- aggiornamento: Android (Capacitor / WebView) ---------- */

  function apkFileName(remote) {
    var a = (remote && remote.android) || {};
    var version = a.versionName || a.version || remote.version;
    return 'DOGANA_RUSH_ANDROID_' + version + '-debug.apk';
  }

  function applyAndroid(remote) {
    var info = (remote && remote.android) || {};
    var url = info.url || remote.url;
    if (typeof url !== 'string' || !url) {
      toast('LINK APK NON DISPONIBILE');
      return false;
    }
    var bridge = window.DoganaNative;
    var via = '';
    // 1) bridge nativo: DownloadManager (notifica → download manager → installer)
    if (bridge && typeof bridge.downloadApk === 'function') {
      try {
        bridge.downloadApk(url, apkFileName(remote));
        via = 'download';
      } catch (e) { via = ''; }
    }
    // 2) bridge nativo: apertura nel browser di sistema
    if (!via && bridge && typeof bridge.openUrl === 'function') {
      try { bridge.openUrl(url); via = 'browser'; } catch (e) { via = ''; }
    }
    // 3) Capacitor Browser plugin
    if (!via) {
      var cap = window.Capacitor;
      var browserPlugin = cap && cap.Plugins && cap.Plugins.Browser;
      if (browserPlugin && typeof browserPlugin.open === 'function') {
        try {
          var p = browserPlugin.open({ url: url });
          if (p && typeof p.catch === 'function') p.catch(function () {});
          via = 'browser';
        } catch (e) { via = ''; }
      }
    }
    // 4) ultima spiaggia: nuova finestra del browser
    if (!via) {
      try { if (window.open(url, '_blank', 'noopener')) via = 'browser'; } catch (e) { via = ''; }
    }
    if (via === 'download') toast('Download avviato: apri la notifica per installare', 7000);
    else if (via === 'browser') toast("Scarica e installa l'APK: i dati di gioco restano", 6000);
    else toast('AGGIORNAMENTO NON DISPONIBILE');
    return !!via;
  }

  function applyUpdate(remote, go) {
    if (!remote) return;
    if (go) {
      go.disabled = true;
      go.textContent = 'AGGIORNAMENTO…';
    }
    if (isAndroidNative()) {
      applyAndroid(remote);
      if (go) {
        window.setTimeout(function () {
          go.disabled = false;
          go.textContent = 'AGGIORNA';
        }, 1500);
      }
      return;
    }
    applyWeb(remote, go).catch(function (err) {
      console.info('[DOGANA UPDATE] aggiornamento web non completato:', err && err.message);
      reloadWithVersion(remote.version);
    });
  }

  function applyServiceWorkerUpdate(btn) {
    if (btn) { btn.disabled = true; btn.textContent = 'RICARICA…'; }
    var nav = navigator.serviceWorker;
    var ready = (nav && typeof nav.getRegistration === 'function')
      ? nav.getRegistration().catch(function () { return null; })
      : Promise.resolve(null);
    ready.then(function (reg) {
      var changed = waitControllerChange(nav, 4000);
      if (reg && reg.waiting) {
        try { reg.waiting.postMessage({ type: 'SKIP_WAITING' }); } catch (e) { /* noop */ }
        return changed;
      }
      return null;
    }).then(function () {
      return clearCaches();
    }).then(function () {
      reloadWithVersion(Date.now());
    }).catch(function () {
      reloadWithVersion(Date.now());
    });
  }

  /* ---------- check ---------- */

  function check(opts) {
    opts = opts || {};
    if (state.checking) return state.checking;
    var local = versionLocale();
    state.local = local;
    var force = !!opts.force || !!opts.manual;
    var reason = skipReason(force);
    if (reason) {
      state.status = 'skipped';
      state.reason = reason;
      return Promise.resolve({ status: 'skipped', reason: reason, local: local });
    }
    state.status = 'checking';
    state.error = null;
    state.checking = fetchVersion().then(function (remote) {
      state.remote = remote;
      state.lastCheck = Date.now();
      storageSet(KEY_LAST, String(state.lastCheck));
      if (!local) {
        state.status = 'unknown';
        return { status: 'unknown', remote: remote, local: null };
      }
      var cmp = compareVersions(remote.version, local);
      if (cmp > 0) {
        state.status = 'newer';
        var dismissed = storageGet(KEY_DISMISSED);
        if (opts.manual || dismissed !== String(remote.version)) showVersionBanner(remote, !!opts.manual);
        return { status: 'newer', remote: remote, local: local };
      }
      state.status = cmp === 0 ? 'current' : 'older';
      if (bannerKind === 'update') hideBanner();
      return { status: state.status, remote: remote, local: local };
    }).catch(function (err) {
      state.status = 'error';
      state.error = (err && err.message) ? err.message : 'errore di rete';
      state.remote = null;
      console.info('[DOGANA UPDATE] controllo non disponibile:', state.error);
      return { status: 'error', error: state.error, local: local };
    }).then(function (res) {
      state.checking = null;
      return res;
    });
    return state.checking;
  }

  function manualCheck(btn) {
    if (btn) btn.disabled = true;
    toast('CONTROLLO AGGIORNAMENTI…', 2500);
    return check({ manual: true, force: true }).then(function (res) {
      if (btn) btn.disabled = false;
      if (res.status === 'newer') toast('NUOVA VERSIONE DISPONIBILE: v' + res.remote.version);
      else if (res.status === 'current' || res.status === 'older') toast('SEI AGGIORNATO v' + (res.local || '?'));
      else if (res.status === 'unknown') toast('VERSIONE LOCALE NON DISPONIBILE');
      else if (res.status === 'skipped' && res.reason === 'file') toast('COPIA LOCALE: APRI LA VERSIONE WEB PER AGGIORNARTI', 5000);
      else if (res.status === 'skipped') toast('CONTROLLO NON DISPONIBILE');
      else toast('CONTROLLO NON DISPONIBILE');
      return res;
    });
  }

  /* ---------- pulsante manuale in utility-bar ---------- */

  function mountManualButton() {
    if (OFF || !CFG.enabled) return;
    if (document.getElementById('btn-update-check')) return;
    // Preferisce la utility-bar (visibile su titolo/select/pausa); se la UI
    // cambia, ricade sulle azioni della modale di pausa e infine sul palco.
    var host = document.querySelector('#utility-bar .utility-actions')
      || document.querySelector('#pause-modal .modal-actions')
      || document.getElementById('stage');
    if (!host) return;
    var btn = document.createElement('button');
    btn.id = 'btn-update-check';
    btn.type = 'button';
    btn.className = 'chip-btn update-check-btn';
    btn.textContent = 'AGGIORNAMENTI';
    btn.setAttribute('aria-label', 'Verifica se è disponibile una nuova versione');
    btn.addEventListener('click', function () { manualCheck(btn); });
    host.appendChild(btn);
  }

  /* ---------- service worker in attesa ---------- */

  function watchServiceWorker() {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker) return;
    var nav = navigator.serviceWorker;
    var attempts = 0;
    function poll() {
      if (typeof nav.getRegistration !== 'function') return;
      nav.getRegistration().then(function (reg) {
        if (reg) {
          if (reg.waiting && nav.controller) { showSwBanner(); return; }
          if (typeof reg.addEventListener === 'function') {
            reg.addEventListener('updatefound', function () {
              var sw = reg.installing;
              if (!sw) return;
              sw.addEventListener('statechange', function () {
                if (sw.state === 'installed' && nav.controller) showSwBanner();
              });
            });
          }
          return;
        }
        if (++attempts < 20) swWatchTimer = window.setTimeout(poll, 500);
      }).catch(function () { /* SW non disponibile */ });
    }
    poll();
    // v2.3.2 — un sito ospitato su Pages non deve aspettare il prossimo avvio:
    // controlla il worker quando la pagina torna visibile e ogni 30 minuti.
    var kickUpdate = function () {
      if (typeof nav.getRegistration !== 'function') return;
      nav.getRegistration().then(function (reg) {
        if (reg && typeof reg.update === 'function') reg.update().catch(function () {});
      }).catch(function () {});
    };
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) kickUpdate();
    });
    window.addEventListener('online', kickUpdate);
    swWatchTimer = window.setInterval(kickUpdate, 30 * 60 * 1000);
  }

  /* ---------- avvio ---------- */

  function start() {
    mountManualButton();
    watchServiceWorker();
    var delay = Math.max(0, Number(CFG.delayMs) || DEFAULTS.delayMs);
    waitForGame(function () {
      state.local = versionLocale();
      window.setTimeout(function () {
        var reason = skipReason(FORCE);
        if (reason) {
          state.status = 'skipped';
          state.reason = reason;
          return;
        }
        check({ force: FORCE });
      }, delay);
    });
  }

  function waitForGame(cb) {
    if (window.DOGANA) { cb(); return; }
    var done = false;
    var startedAt = Date.now();
    function fire() {
      if (done) return;
      done = true;
      document.removeEventListener('dogana:ready', fire);
      window.clearInterval(interval);
      cb();
    }
    document.addEventListener('dogana:ready', fire);
    var interval = window.setInterval(function () {
      if (window.DOGANA || Date.now() - startedAt > 10000) fire();
    }, 200);
  }

  /* ---------- API pubblica (QA/test) ---------- */

  window.DOGANA_UPDATE = {
    config: CFG,
    versionUrl: versionUrl,
    check: check,
    manualCheck: function () { return manualCheck(document.getElementById('btn-update-check')); },
    state: state,
    compareVersions: compareVersions,
    isAndroidNative: isAndroidNative,
    showBanner: function (manual) { if (state.remote) showVersionBanner(state.remote, manual !== false); },
    showServiceWorkerBanner: showSwBanner,
    hideBanner: hideBanner,
    apply: function () { if (state.remote) applyUpdate(state.remote, null); return !!state.remote; },
    skipReason: skipReason,
    forceOverride: FORCE,
    disabledOverride: OFF
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

/* DOGANA RUSH — configurazione del controllo aggiornamenti.
   Modifica SOLO questo file per cambiare canale/sorgente delle release.
   Nessuna dipendenza, nessuna build: viene letto da js/update.js.

   channel: repository GitHub pubblico da cui leggere la release più recente
            (`owner/repo`). Il file version.json deve essere allegato alla
            release e pubblicato come asset "latest release".
            Esempi: 'gstorelli/dogana-rush' oppure un mirror pubblico.
   baseUrl: se valorizzato (es. 'https://mirror.example.com/dogana'), il check
            usa `${baseUrl}/version.json` e `channel` viene ignorato: utile per
            servire il file da un CDN o da una release mirror.
   asset:   nome del file JSON allegato alla release (default `version.json`).
   checkIntervalHours: intervallo minimo tra due check automatici (localStorage
            `dogana.update.lastCheck`). Il pulsante "AGGIORNAMENTI" ignora
            l'intervallo.
   allowLocalhost: false = su localhost/127.0.0.1 il check automatico è saltato
            (per QA usare `?updatecheck=1`).
   timeoutMs / delayMs: extra facoltativi usati da update.js (timeout della fetch
            e ritardo del check automatico dopo l'avvio).
   Override via query string: `?updatecheck=1` forza il check anche su localhost,
   `?update-off=1` disabilita del tutto il sistema in questa sessione.
   Ogni chiave può essere sovrascritta prima del caricamento impostando
   `window.DOGANA_UPDATE_CONFIG = { ... }` (viene fatto il merge con i default). */
(function () {
  'use strict';
  var DEFAULTS = {
    enabled: true,
    // v2.3.2 — canale pubblico di distribuzione: il repo sorgente resta privato.
    // Le release e il sito Pages sono pubblici e non richiedono token nel client.
    channel: 'gstorelli/dogana-rush-updates',
    asset: 'version.json',
    // Manifest servito da raw.githubusercontent.com: è pubblico e manda
    // Access-Control-Allow-Origin:*, quindi funziona sia dal sito Pages sia
    // dalla WebView Android. GitHub Pages non manda header CORS.
    baseUrl: 'https://raw.githubusercontent.com/gstorelli/dogana-rush-updates/gh-pages',
    checkIntervalHours: 6,
    allowLocalhost: false,
    timeoutMs: 6000,
    delayMs: 2500
  };
  var prev = (window.DOGANA_UPDATE_CONFIG && typeof window.DOGANA_UPDATE_CONFIG === 'object')
    ? window.DOGANA_UPDATE_CONFIG
    : {};
  var cfg = {};
  for (var k in DEFAULTS) if (Object.prototype.hasOwnProperty.call(DEFAULTS, k)) cfg[k] = DEFAULTS[k];
  for (var p in prev) if (Object.prototype.hasOwnProperty.call(prev, p)) cfg[p] = prev[p];
  window.DOGANA_UPDATE_CONFIG = cfg;
})();

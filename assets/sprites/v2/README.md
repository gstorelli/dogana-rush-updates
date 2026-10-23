# Sprite PNG v2.0 — pipeline di integrazione

Questa cartella contiene gli **sprite PNG generati esternamente** (es. Google
Nano Banana Pro) per i nuovi livelli di DOGANA RUSH v2.0. Il gioco li sostituisce
automaticamente all'arte procedurale di `js/art.js` **senza modificare
`js/game.js`**: basta copiare i PNG e aggiornare il manifest
`window.SPRITE_MANIFEST_V2` in `js/sprites.js`.

> Regola d'oro: **se un PNG manca o l'entry del manifest è incompleta, resta
> l'arte procedurale attuale** (nessun crash, nessun errore console). Con il
> manifest vuoto non viene fatta alcuna richiesta di rete: zero 404.

---

## 1. Struttura delle cartelle

```
assets/sprites/v2/
├── README.md          ← questo file
├── enemies/           ← 13 nemici nuovi (6 PNG per tipo)
├── boss/              ← cesare, ursula, ceo (5 PNG per boss)
├── ambient/           ← sogeiMonkey, sogeiBird, sogeiCash (frame vari)
├── items/             ← pickup (scontrino, spritz, caffe, …)
├── props/             ← colonna, fontana, crate, … (appoggiati a terra)
├── bg/                ← sky 640×360 e arene boss 640×360
└── car/               ← Fiat Tipo 3 volumi: 4 frame 220×100
```

## 2. Nemici — file attesi

Per ogni tipo servono **6 PNG**: 4 frame di camminata + attacco + hurt.
Il nome è convenzione pura (il manifest decide i percorsi), ma per coerenza si
usa `<tipo>-walk0..3.png`, `<tipo>-attack.png`, `<tipo>-hurt.png`.

| tipo | livello | file attesi |
|---|---|---|
| `centurione` | 4 Roma | `enemies/centurione-walk0..3.png`, `centurione-attack.png`, `centurione-hurt.png` |
| `boomerTossico` | 4 Roma | `enemies/boomerTossico-walk0..3.png`, `-attack.png`, `-hurt.png` |
| `meccanico` | 4 Roma | `enemies/meccanico-walk0..3.png`, `-attack.png`, `-hurt.png` |
| `cuoco` | 4 Roma | `enemies/cuoco-walk0..3.png`, `-attack.png`, `-hurt.png` |
| `merkel` | 5 Europa | `enemies/merkel-walk0..3.png`, `-attack.png`, `-hurt.png` |
| `francese` | 5 Europa | `enemies/francese-walk0..3.png`, `-attack.png`, `-hurt.png` |
| `bottiglia` | 5 Europa | `enemies/bottiglia-walk0..3.png`, `-attack.png`, `-hurt.png` |
| `software` | 8 SOGEI | `enemies/software-walk0..3.png`, `-attack.png`, `-hurt.png` |
| `programma` | 8 SOGEI | `enemies/programma-walk0..3.png`, `-attack.png`, `-hurt.png` |
| `bug` | 8 SOGEI | `enemies/bug-walk0..3.png`, `-attack.png`, `-hurt.png` |
| `errore` | 8 SOGEI | `enemies/errore-walk0..3.png`, `-attack.png`, `-hurt.png` |
| `crash` | 8 SOGEI | `enemies/crash-walk0..3.png`, `-attack.png`, `-hurt.png` |
| `computer` | 8 SOGEI | `enemies/computer-walk0..3.png`, `-attack.png`, `-hurt.png` |

### Specifiche nemici
- **Formato consigliato: 84 × 90 px**, PNG RGBA **trasparente**, un personaggio
  per file (stessa geometria degli asset v1 in `assets/sprites/enemies/`).
- **Personaggio rivolto a destra** (in gioco viene specchiato quando cammina a
  sinistra), piedi sulla riga **y = 84** (gli ultimi 6 px in basso restano
  trasparenti), centro sul rigo x = 42.
- Nessuna ombra disegnata nel PNG (l'ombra la disegna il gioco).
- Se il PNG ha dimensioni diverse, viene scalato mantenendo le proporzioni e
  appoggiato in basso entro il box 84×90 (con `imageSmoothing` attivo solo in
  riduzione). Per pixel art perfetta usare 84×90 esatti.
- In game `Art.enemyFrames[tipo] = [walk0, walk1, walk2, walk3, attack, hurt]`:
  questi indici sono usati da `js/game.js` (`enemyFrame()`), non cambiarli.

## 3. Boss — file attesi

| boss | file attesi |
|---|---|
| `cesare` (Roma) | `boss/cesare-idle0.png`, `cesare-idle1.png`, `cesare-attack.png`, `cesare-hurt.png`, `cesare-rage.png` |
| `ursula` (Europa) | `boss/ursula-idle0.png`, `ursula-idle1.png`, `ursula-attack.png`, `ursula-hurt.png`, `ursula-rage.png` |
| `ceo` (SOGEI) | `boss/ceo-idle0.png`, `ceo-idle1.png`, `ceo-attack.png`, `ceo-hurt.png`, `ceo-rage.png` |

### Specifiche boss
- **Formato consigliato: 240 × 300 px**, PNG RGBA trasparente, un frame per file.
- Il boss è disegnato in gioco a dimensione nativa: `x = boss.x - ax`,
  `y = GROUND - ay`. Anchor di default: **`ax = larghezza / 2`**,
  **`ay = altezza - 8`** (piedi 8 px sopra il bordo inferiore, come l'arte
  procedurale: 240×300 → ax 120, ay 292).
- Tutti i frame dello stesso boss devono avere **la stessa dimensione** canvas
  (o passare `meta.w`/`meta.h`); altrimenti vengono ricampionati sul frame idle0.
- Frame richiesti: `idle` (1 o 2), `attack`, `hurt`; `rage` è opzionale (se manca
  si usa `attack`). `idle` può essere stringa singola o array.
- `meta` opzionale per fare override: `{ ax, ay, w, h, quantize }`.
  `quantize: true` riduce il PNG alla palette 32-bit del gioco (per uno stile
  ancora più coerente).

## 4. Sprite ambientali (livello 8 SOGEI)

| chiave | file consigliati | note |
|---|---|---|
| `sogeiMonkey` | `ambient/sogei-monkey0..3.png` | scimmia alla tastiera, 4 frame di digitazione, 92×88, anchor 46/88 |
| `sogeiBird` | `ambient/sogei-bird0..3.png` | uccellino che becca i tasti, 4 frame, 72×64, anchor 36/63 |
| `sogeiCash` | `ambient/sogei-cash0..1.png` | contanti sotto il tappeto, 2 frame, 96×62, anchor 48/60 |

`Art.sogeiMonkey` / `Art.sogeiBird` / `Art.sogeiCash` diventano
`{ w, h, ax, ay, frames: [...] }`. `meta` sovrascrive `w/h/ax/ay`.

---

## 4-bis. Pickup (`items`)

Mappa `items: { chiave: 'percorso.png' }`: il PNG sostituisce
`Art.pickups[chiave]`. `js/game.js` li disegna a **dimensione nativa, centrati**
sul punto del pickup (l'alone/glow e le stelline restano procedurali).

| chiave | file consigliato | dimensione consigliata |
|---|---|---|
| `scontrino` | `items/scontrino.png` | **18 × 24** |
| `spritz` | `items/spritz.png` | **20 × 26** |
| `caffe` | `items/caffe.png` | **18 × 20** |
| altre chiavi (`pizza`, `health`, `mascara`, `grenade`, …) | `items/<chiave>.png` | nativa (es. 54×54 come gli asset v1) |

- PNG RGBA **trasparente**, nessuna ombra disegnata (la ombreggia il gioco).
- Se il PNG ha una taglia diversa da quella consigliata viene ridimensionato
  mantenendo le proporzioni e centrato nel box (es. un'immagine 1024×1024 di
  `scontrino` diventa 18×24). Per forzare una taglia diversa:
  `{ src: '...', meta: { w: 30, h: 40 } }`.

## 4-ter. Props (`props`)

Mappa `props: { chiave: 'percorso.png' }`: il PNG sostituisce
`Art.props[chiave]`. `js/game.js` appoggia il prop a terra con
`y = GROUND - altezza` e larghezza nativa, con ombra procedurale sotto.

| chiave | dimensione consigliata | chiave | dimensione consigliata |
|---|---|---|---|
| `crate` | 40 × 36 | `colonna` | 58 × 124 |
| `barrel` | 30 × 40 | `fontana` | 96 × 66 |
| `stall` | 100 × 78 | `cartelloRoma` | 56 × 68 |
| `sign` | 44 × 55 | `bandieraEU` | 50 × 108 |
| `bollard` | 20 × 28 | `totemEU` | 36 × 66 |
| `bench` | 62 × 34 | `ombrellone` | 76 × 82 |
| `sdraio` | 64 × 40 | `cartelloPescara` | 60 × 62 |
| `rack` | 58 × 120 | `monitor` | 48 × 50 |
| `pilaSoldi` | 60 × 34 | | |

- Il **contenuto opaco deve appoggiare sul bordo inferiore** del PNG (piedi/base
  a y = altezza), così il prop si posa sul terreno; margini trasparenti ai lati
  sono ok.
- Taglia nativa consigliata (colonne sopra): con altre taglie il prop resta
  com'è (game.js usa `img.width/img.height`); per ridimensionare usare
  `meta: { w, h }`.
- **v2.1 — props UI classici con target fissi**: per i props del gioco base
  (`crate`, `barrel`, `stall`, `sign`, `bollard`, `bench`, `desk`, `archive`,
  `plant`, `cooler`) il loader ha una mappa target (`Art.propsTargets`, identica
  alle hitbox di `PROP_META` in game.js) e, **solo se il PNG differisce**,
  ridimensiona in nearest mantenendo le proporzioni, centrato in orizzontale e
  appoggiato in basso (i props stanno a terra). I PNG nativi della taglia
  giusta vengono usati pixel-per-pixel.

## 4-quater. Sfondi (`bg`)

Mappa `bg: { chiave: 'percorso.png' }`: il PNG sostituisce `Art.bg[chiave]`.
In questa fase si generano **solo le sky e le arene boss**, tutte 640×360:

| chiave | file consigliato | uso |
|---|---|---|
| `romaSky` | `bg/romaSky.png` | sky livello 4 (fase attuale) |
| `europaSky` | `bg/europaSky.png` | sky livello 5 |
| `pescaraSky` | `bg/pescaraSky.png` | sky livello 6 |
| `pescaraNightSky` | `bg/pescaraNightSky.png` | sky livello 7 |
| `sogeiSky` | `bg/sogeiSky.png` | sky livello 8 |
| `bossRoma` | `bg/bossRoma.png` | arena boss Cesare |
| `bossEuropa` | `bg/bossEuropa.png` | arena boss Ursula |
| `bossSogei` | `bg/bossSogei.png` | arena boss Ex CEO |

- Se il PNG non è esattamente **640 × 360** viene ridimensionato a 640×360 con
  interpolazione **nearest** (e viene stampato un `console.info` di avviso):
  consigliato generare direttamente 640×360.
- I layer parallasse (`romaFar`/`romaMid`/`romaNear`, …) **non** fanno parte di
  questa fase: se in futuro venissero aggiunti al manifest resterebbero alla
  loro dimensione nativa (servono larghezze > 640 per il crop di game.js),
  salvo `meta: { w, h }` esplicito.
- Le boss arena sostituiscono solo l'immagine di sfondo: boss/AI restano
  invariati.

---

## 4-quinquies. Auto Fiat Tipo (`tipoCar`)

Sezione dedicata (l'auto **non è un prop**): `tipoCar: { frames: [...], meta: {...} }`
sostituisce `Art.tipoCar`, usata da `carMetrics()`/`getCarFgFrames()` di
`js/game.js` per la sezione "a bordo" del livello 7 (`?stage=bonusCar`).

| campo | valori |
|---|---|
| frame consigliati | `car/tipo-0.png`, `tipo-1.png`, `tipo-2.png`, `tipo-3.png` |
| dimensione consigliata | **220 × 100** RGBA trasparente (accettati anche 440×200 @2x: riscalati a 220×100 mantenendo il layout) |
| numero frame | 1 minimo, **4 consigliati** (ruote a rotazione diversa; game.js cicla su frames.length) |
| margine inferiore | ~8 px trasparenti sotto i pneumatici: piedi ruote a **y = 92** su 100 |
| anchor | `meta: { w: 220, h: 100, ax: 60, ay: 92 }` — default del loader: w/h = primo frame, ax=60, ay=92 |
| finestrino | `meta: { window: { x, y, w, h } }` opzionale |

```js
tipoCar: {
  frames: [
    'assets/sprites/v2/car/tipo-0.png',
    'assets/sprites/v2/car/tipo-1.png',
    'assets/sprites/v2/car/tipo-2.png',
    'assets/sprites/v2/car/tipo-3.png'
  ],
  meta: {
    w: 220, h: 100, ax: 60, ay: 92,
    window: { x: 76, y: 25, w: 76, h: 28 }
  }
}
```

⚠️ **Nota finestrino / CAR_WINDOW**: `js/game.js` ritaglia un "buco
finestrino" a coordinate **fisse** `CAR_WINDOW = { x: 76, y: 25, w: 76, h: 28 }`
(sul frame 220×100) per far vedere il giocatore dentro l'auto. Se i PNG AI
hanno il finestrino in un'altra posizione:
- passare le coordinate nel manifest con `meta.window` → il loader le espone in
  `Art.tipoCar.window` (e alias `Art.tipoCarWindow`, con `console.info`);
- chiedere a **level-gameplay** di leggere `Art.tipoCar.window` al posto della
  costante: finché `CAR_WINDOW` resta fisso, il buco non seguirà il PNG.

Fallback: sezione assente/vuota o frame mancanti → resta l'auto procedurale
grigia già presente (`Art.buildPescaraArt`).

---

## 4-sexies. Sfondi dei livelli v1 e layer (`bg`) — v2.1

La sezione `bg` serve anche a sostituire gli sfondi dei **livelli 1–3**.

> **Strategia scelta dal pilot v2.1: FULL-SCENE.** Per i livelli 1–2 si usano
> solo `portSky` / `bariSky` **640×360** (scena completa); i layer AI
> trasparenti (`portFar/Mid/Near`, `bariFar/Mid/Near`) sono stati **scartati**
> come strategia artistica. Il loader continua a supportarli per compatibilità
> (se un giorno servissero), ma `js/game.js` in modalità full-scene li salta
> quando lo sky è AI. Per l'arena boss restano `bossPort` / `bossBasilica`, per
> il livello 3 `direzioneExt` / `bossDirezione` (tutti 640×360).

Il loader distingue due famiglie:

| famiglia | chiavi | regola di normalizzazione |
|---|---|---|
| **schermo** (disegnate 1:1) | `portSky`, `bariSky`, `bossPort`, `bossBasilica`, `direzioneExt`, `bossDirezione` (+ le 8 chiavi v2) | resize **nearest a 640×360** se il PNG è diverso (console.info) |
| **layer parallasse** | `portFar`, `portMid`, `portNear`, `bariFar`, `bariMid`, `bariNear` | **altezza normalizzata a 360** (nearest), **larghezza libera** (consigliata 1440–2048; minimo 640, altrimenti warning) |

Perché: `js/game.js` disegna le sky/arene con `drawImage(img, 0, 0)` (quindi
devono essere 640×360) e i layer con un crop `(sx, 0, 640, 360)` (quindi
l'altezza **deve** essere esattamente 360; la larghezza può essere qualsiasi,
più è larga più il parallasse è profondo).

```js
bg: {
  portSky:   'assets/sprites/v2/bg/port-sky.png',      // 640×360
  portFar:   'assets/sprites/v2/bg/port-far.png',      // es. 2048×360
  bossPort:  'assets/sprites/v2/bg/port-boss.png',     // 640×360
  direzioneExt: 'assets/sprites/v2/bg/direzione-est.png',
  bossDirezione: 'assets/sprites/v2/bg/direzione-boss.png'
}
```

- `reapplyV2()` è chiamato anche dalle (ri)costruzioni v1 e dalle build lazy:
  gli override AI non vengono sovrascritti dall'arte procedurale.
- `Art.hasV2Sprite('bg', 'portSky')` → game.js usa questo per decidere la
  modalità full-scene (sky AI) e per `direzioneExt`/`bossDirezione`.
- `direzioneExt`/`bossDirezione` sono le chiavi per l'esterno e l'arena boss
  del livello 3 (le consuma level-gameplay nel suo renderer dedicato).

## 4-septies. Stanze Direzione (`direzioneRooms`) — v2.1

Nuova sezione: una vignetta AI per tipo di stanza del corridoio della
Direzione Territoriale (livello 3). Sostituisce `Art.direzioneRoomArt[tipo]`
e il tipo viene marcato AI in `Art.direzioneRoomAI` (l'NPC è già dentro
l'immagine: niente overlay/effetti procedurali duplicati).

| campo | valori |
|---|---|
| tipo (chiavi) | `sportello`, `segreteria`, `darts`, `photocopy`, `beans`, `waiting`, `tennis`, `golf`, `meeting`, `training`, `coffee`, `vending`, `archive`, `server`, `centralino`, `protocollo`, `mensa` |
| file consigliato | `direzione/rooms/<tipo>.png` |
| dimensione | **48 × 88** (accettato anche **96 × 176** @2x). Altri formati vengono ridimensionati nearest a 48×88. |
| trasparenza | PNG RGBA; la vignetta è la scena completa della stanza dentro la finestra (48×88) |

```js
direzioneRooms: {
  sportello:  'assets/sprites/v2/direzione/rooms/sportello.png',
  segreteria: 'assets/sprites/v2/direzione/rooms/segreteria.png',
  darts:      'assets/sprites/v2/direzione/rooms/darts.png'
}
```

- Entry mancante/valore vuoto/file invalido → per QUEL tipo resta la stanza
  procedurale (fallback silenzioso; sezione vuota = 0 richieste).
- La ricomposizione delle stanze dopo il caricamento PNG v1 non cancella le
  stanze AI (vengono ripristinate).
- **Disegno**: `drawDirezioneWindow` disegna la cornice procedurale, poi la
  vignetta AI dentro il clip 48×88; per le stanze AI salta gli effetti
  procedurali (`dirRoomFx`: vapore, LED, ecc.) e l'NPC eventualmente già
  incluso nell'immagine. Se il PNG ha zone trasparenti vengono coperte da un
  fondo stanza (clip + gradiente scuro) per non lasciar vedere "buchi".
- Formati accettati: 48×88 nativo oppure 96×176 (riscalato nearest a 48×88);
  altri formati vengono riportati a 48×88.
- Diagnostica: `Art.v2SpriteStatus.rooms`, `Art.hasV2Sprite('room', 'sportello')`,
  `A.direzioneRoomAI[tipo] === true`.

---

## 5. Come attivare gli sprite PNG (2 passi)

1. Copia i PNG in `assets/sprites/v2/...` con i nomi sopra.
2. In `js/sprites.js`, aggiungi le voci a `window.SPRITE_MANIFEST_V2` e
   togli il commento agli esempi. Esempio completo:

```js
window.SPRITE_MANIFEST_V2 = {
  version: 2,
  enemies: {
    centurione: {
      walk: [
        'assets/sprites/v2/enemies/centurione-walk0.png',
        'assets/sprites/v2/enemies/centurione-walk1.png',
        'assets/sprites/v2/enemies/centurione-walk2.png',
        'assets/sprites/v2/enemies/centurione-walk3.png'
      ],
      attack: 'assets/sprites/v2/enemies/centurione-attack.png',
      hurt:   'assets/sprites/v2/enemies/centurione-hurt.png'
    }
  },
  bosses: {
    cesare: {
      idle: [
        'assets/sprites/v2/boss/cesare-idle0.png',
        'assets/sprites/v2/boss/cesare-idle1.png'
      ],
      attack: 'assets/sprites/v2/boss/cesare-attack.png',
      hurt:   'assets/sprites/v2/boss/cesare-hurt.png',
      rage:   'assets/sprites/v2/boss/cesare-rage.png',
      meta: { ax: 120, ay: 292 }
    }
  },
  ambient: {
    sogeiMonkey: {
      frames: [
        'assets/sprites/v2/ambient/sogei-monkey0.png',
        'assets/sprites/v2/ambient/sogei-monkey1.png',
        'assets/sprites/v2/ambient/sogei-monkey2.png',
        'assets/sprites/v2/ambient/sogei-monkey3.png'
      ],
      meta: { ax: 46, ay: 88 }
    }
  },
  items: {
    scontrino: 'assets/sprites/v2/items/scontrino.png',
    spritz:    'assets/sprites/v2/items/spritz.png',
    caffe:     'assets/sprites/v2/items/caffe.png'
  },
  props: {
    colonna: 'assets/sprites/v2/props/colonna.png',
    fontana: 'assets/sprites/v2/props/fontana.png'
  },
  bg: {
    romaSky:  'assets/sprites/v2/bg/romaSky.png',
    bossRoma: 'assets/sprites/v2/bg/bossRoma.png'
  },
  tipoCar: {
    frames: [
      'assets/sprites/v2/car/tipo-0.png',
      'assets/sprites/v2/car/tipo-1.png',
      'assets/sprites/v2/car/tipo-2.png',
      'assets/sprites/v2/car/tipo-3.png'
    ],
    meta: { w: 220, h: 100, ax: 60, ay: 92 }
  },
  // v2.1 — sfondi dei livelli v1 (sky/arena 640x360, layer con altezza 360)
  bg: {
    portSky: 'assets/sprites/v2/bg/port-sky.png',
    portFar: 'assets/sprites/v2/bg/port-far.png',
    bossPort: 'assets/sprites/v2/bg/port-boss.png'
  },
  // v2.1 — vignette AI delle stanze della Direzione (48x88)
  direzioneRooms: {
    sportello: 'assets/sprites/v2/direzione/rooms/sportello.png',
    segreteria: 'assets/sprites/v2/direzione/rooms/segreteria.png'
  }
};
```

Il caricamento avviene durante il boot (dopo l'arte procedurale) tramite
`Art.loadGeneratedSprites()` → `Art.loadV2Sprites()`; se il gioco è già avviato
si può forzare da console: `await Art.loadV2Sprites()`.

> Nota PWA: gli asset v2 non sono pre-cachati dal service worker. Online vengono
> scaricati al boot; offline la `fetch` fallisce e si continua con l'arte
> procedurale (nessun errore bloccante). Per l'offline, aggiungerli alla lista
> del service worker (`sw.js`) come per gli altri asset.

---

## 6. Regole di fallback (riassunto)

| situazione | risultato |
|---|---|
| manifest vuoto / assente | nessuna richiesta, arte procedurale |
| sezione vuota (es. `items: {}`) | nessuna richiesta per quella sezione |
| tutti i file presenti | `Art.enemyFrames[tipo]` / `Art.cesare|ursula|ceo` / `Art.pickups` / `Art.props` / `Art.bg` dai PNG |
| entry incompleta o file non elencato | nessuna richiesta, resta il procedurale per quella voce |
| boss senza `rage` | usa `attack` come frame rage |
| `tipoCar` assente/vuoto o frame mancanti | resta la Fiat Tipo procedurale |
| sky/arena v1 con dimensioni diverse | resize nearest a 640×360 |
| layer v1 con altezza ≠ 360 | altezza portata a 360 (nearest), larghezza invariata |
| stanza `direzioneRooms` mancante/invalida | resta la vignetta procedurale per quel tipo + nessun effetto AI |
| PNG con dimensioni non standard | nemici: box 84×90; boss: frame idle0 + anchor h-8; item: box consigliato; sky/arena: resize 640×360 nearest |
| file elencato ma assente su disco (404) | fallback procedurale; il browser può comunque loggare un errore di rete: aggiungere l'entry solo dopo aver copiato il PNG |

## 7. Verifica rapida

- Scene debug: `?stage=roma`, `?stage=europa`, `?stage=pescara`, `?stage=sogei`,
  `?stage=bossRoma`, `?stage=bossEuropa`, `?stage=bossSogei&instant=1`.
- In console: `Art.v2SpriteStatus` → `{ loaded, missing, enemies, bosses, ambient, errors }`.
- `Art.hasV2Sprite('enemy', 'centurione')`, `('boss','cesare')`, `('item','scontrino')`, `('prop','colonna')`, `('bg','portSky')`, `('car','tipoCar')`, `('room','sportello')` → `true/false`.
- I PNG di prova **non vanno committati**: per i test automatici si usa
  l'intercettazione di rete (Playwright `page.route`), vedi report del team.

## 8. Errori comuni

- **Sprite che affonda nel terreno**: i piedi non sono a y=84 (nemici) o
  `meta.ay` errato (boss/ambientali).
- **Sprite sfocato**: PNG con dimensioni non standard scalato con smoothing;
  usare 84×90 / 240×300 nativi oppure `meta.quantize: true`.
- **Frame che saltano**: dimensioni canvas diverse tra i frame; uniformarle o
  usare `meta.w/meta.h`.
- **404 in console**: significa che il manifest elenca un file non copiato;
  rimuovere l'entry (il fallback procedurale resta).

---

## 9. Bootstrap lazy dell'arte v2 (perf boot)

Dalla v2.0 l'arte procedurale dei nuovi temi viene costruita **in modo lazy**,
così il boot (soprattutto WebView Android) non paga più gli ~23 canvas dei
fondali v2 già al titolo.

### API (`js/art.js`)

| API | quando si usa | comportamento |
|---|---|---|
| `Art.buildBootArt()` | boot del gioco | costruisce **solo asset v1** (player, nemici/boss v1, props/pickup/icone v1, fondali porto/Bari/Direzione, ground 1–3). Idempotente. |
| `Art.ensureTheme(theme)` | primo ingresso in un tema | costruisce in modo **sincrono** tutto il tema: sky+layer+boss arena, ground, nemici, boss, props/pickup/icone/ambient. `theme = 'roma' | 'europa' | 'pescara' | 'pescaraNight' | 'sogei'`. Ritorna `true` se ha costruito qualcosa, `false` se era già pronto (idempotente). `'pescaraNight'` condivide gli asset con `'pescara'` (giorno+notte+ground6+Fiat Tipo). |
| `Art.ensureLevelArt(level)` | `startLevel(index)` di game.js | mappa il livello → tema (`level.customBg`, altrimenti `level.id`; accetta anche indice 0-based/id 1-based) e chiama `ensureTheme`. Ritorna il tema risolto (`'v1'`, `'roma'`, …). |
| `Art.themeForLevel(level)` | diagnostica/test | solo risoluzione tema, nessuna build. |
| `Art.buildAll(opts)` | test/preview | default costruisce TUTTO (boot + tutti i temi). `{ themes: 'boot' }` solo v1; `{ themes: ['roma'] }` boot + tema. Accetta anche `onProgress(i, label)` come prima. |
| `Art.themeStatus` | diagnostica/test | `{ boot, bootMs, themes: {roma:true,…}, ms: {roma:146,…} }`. |

Mappa livelli → temi (`Art.THEME_BY_LEVEL_INDEX`, indice 0-based):
`0 porto, 1 bari, 2 direzione, 3 roma, 4 europa, 5 pescara, 6 pescaraNight, 7 sogei`.

### Numeri indicativi (misurati, desktop headless)

Benchmark "puro" (solo `js/art.js`, pagina vuota senza PNG/loader), same machine:

| metrica | prima (eager `buildAll`) | dopo (lazy `buildBootArt`) |
|---|---|---|
| tempo build arte | **~654 ms** | **~247 ms** (-62%) |
| canvas arte | 335 | **174** |
| memoria canvas | ~88 MB | **~34 MB** (-54 MB) |
| fondali v2 al boot | 23 canvas (15 layer parallasse) | **0** |
| build tema al primo ingresso | — | roma ~75 ms, europa ~54 ms, pescara ~25 ms, sogei ~107 ms |

Nel gioco reale, al titolo, l'inventario (compresi i PNG v2 caricati da
`loadV2Sprites`) passa da **351 canvas / ~91 MB a 313 canvas / ~51,5 MB**, con
0 layer parallasse v2 costruiti. Il tempo di boot end-to-end in headless è
rumoroso (±), ma il costo CPU evitato al boot è ~400 ms desktop: su WebView
Android (canvas molto più lenti) il risparmio è maggiore, che è l'obiettivo QA
(< 4 s).

### PNG v2 e build lazy

`Art.loadV2Sprites()` gira dopo `buildBootArt()` (come prima): gli override PNG
di nemici/boss/ambientali/items/props vengono applicati subito; quando più tardi
`ensureTheme()` costruisce l'arte procedurale di un tema, `Art.reapplyV2()`
**riapplica** gli override PNG già caricati sopra l'arte appena costruita, così
non si perde nessuna sostituzione.

> Nota: la sezione `bg` del manifest PNG viene applicata subito da
> `loadV2Sprites` (non è lazy). Se in futuro gli sfondi AI saranno tutti in PNG,
> tenerli fuori dal boot richiede un follow-up dedicato (caricamento per tema).

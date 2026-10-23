/* Asset degli sprite ridisegnati con Google Nano Banana Pro.
   Sono PNG locali, caricati una sola volta all'avvio. */
window.SPRITE_MANIFEST = {
  player: {
    run: [
      'assets/sprites/player/run0.png',
      'assets/sprites/player/run1.png',
      'assets/sprites/player/run2.png',
      'assets/sprites/player/run3.png'
    ],
    idle: [
      'assets/sprites/player/idle0.png',
      'assets/sprites/player/idle1.png'
    ],
    jump: [
      'assets/sprites/player/jump0.png',
      'assets/sprites/player/jump1.png'
    ],
    shoot: 'assets/sprites/player/shoot.png',
    aimup: 'assets/sprites/player/aimup.png',
    crouch: 'assets/sprites/player/crouch.png',
    mascaraIdle: 'assets/sprites/player/mascara-idle.png',
    mascaraRun: 'assets/sprites/player/mascara-run.png',
    mascaraCrouch: 'assets/sprites/player/mascara-crouch.png'
  },
  playerRocco: {
    run: [
      'assets/sprites/player/rocco-run0.png',
      'assets/sprites/player/rocco-run1.png',
      'assets/sprites/player/rocco-run2.png',
      'assets/sprites/player/rocco-run3.png'
    ],
    idle: [
      'assets/sprites/player/rocco-idle.png',
      'assets/sprites/player/rocco-idle1.png'
    ],
    jump: [
      'assets/sprites/player/rocco-jump0.png',
      'assets/sprites/player/rocco-jump1.png'
    ],
    shoot: 'assets/sprites/player/rocco-shoot.png',
    aimup: 'assets/sprites/player/rocco-aimup.png',
    crouch: 'assets/sprites/player/rocco-crouch.png',
    remote: 'assets/sprites/player/rocco-remote.png'
  },
  enemies: {
    pretender: {
      walk: ['assets/sprites/enemies/pretender-walk0.png', 'assets/sprites/enemies/pretender-walk1.png', 'assets/sprites/enemies/pretender-walk2.png', 'assets/sprites/enemies/pretender-walk3.png'],
      attack: 'assets/sprites/enemies/pretender-attack.png',
      hurt: 'assets/sprites/enemies/pretender-hurt.png'
    },
    boomer: {
      walk: ['assets/sprites/enemies/boomer-walk0.png', 'assets/sprites/enemies/boomer-walk1.png', 'assets/sprites/enemies/boomer-walk2.png', 'assets/sprites/enemies/boomer-walk3.png'],
      attack: 'assets/sprites/enemies/boomer-attack.png',
      hurt: 'assets/sprites/enemies/boomer-hurt.png'
    },
    utente: {
      walk: ['assets/sprites/enemies/utente-walk0.png', 'assets/sprites/enemies/utente-walk1.png', 'assets/sprites/enemies/utente-walk2.png', 'assets/sprites/enemies/utente-walk3.png'],
      attack: 'assets/sprites/enemies/utente-attack.png',
      hurt: 'assets/sprites/enemies/utente-hurt.png'
    },
    finanziere: {
      walk: ['assets/sprites/enemies/finanziere-walk0.png', 'assets/sprites/enemies/finanziere-walk1.png', 'assets/sprites/enemies/finanziere-walk2.png', 'assets/sprites/enemies/finanziere-walk3.png'],
      attack: 'assets/sprites/enemies/finanziere-attack.png',
      hurt: 'assets/sprites/enemies/finanziere-hurt.png'
    },
    collega: {
      walk: ['assets/sprites/enemies/collega-walk0.png', 'assets/sprites/enemies/collega-walk1.png', 'assets/sprites/enemies/collega-walk2.png', 'assets/sprites/enemies/collega-walk3.png'],
      attack: 'assets/sprites/enemies/collega-attack.png',
      hurt: 'assets/sprites/enemies/collega-hurt.png'
    },
    bidella: {
      walk: ['assets/sprites/enemies/bidella-walk0.png', 'assets/sprites/enemies/bidella-walk1.png', 'assets/sprites/enemies/bidella-walk2.png', 'assets/sprites/enemies/bidella-walk3.png'],
      attack: 'assets/sprites/enemies/bidella-attack.png',
      hurt: 'assets/sprites/enemies/bidella-hurt.png'
    },
    formatore: {
      walk: ['assets/sprites/enemies/formatore-walk0.png', 'assets/sprites/enemies/formatore-walk1.png', 'assets/sprites/enemies/formatore-walk2.png', 'assets/sprites/enemies/formatore-walk3.png'],
      attack: 'assets/sprites/enemies/formatore-attack.png',
      hurt: 'assets/sprites/enemies/formatore-hurt.png'
    }
  },
  bosses: {
    octo: [
      'assets/sprites/boss/octo0.png',
      'assets/sprites/boss/octo1.png',
      'assets/sprites/boss/octo2.png',
      'assets/sprites/boss/octo3.png'
    ],
    mecha: {
      idle: ['assets/sprites/boss/mecha-idle0.png', 'assets/sprites/boss/mecha-idle1.png'],
      staff: 'assets/sprites/boss/mecha-staff.png',
      orb: 'assets/sprites/boss/mecha-orb.png',
      phase2: 'assets/sprites/boss/mecha-phase2.png',
      hurt: 'assets/sprites/boss/mecha-hurt.png'
    },
    direttore: {
      idle0: 'assets/sprites/boss/direttore-idle0.png',
      idle1: 'assets/sprites/boss/direttore-idle1.png',
      stamp: 'assets/sprites/boss/direttore-stamp.png',
      point: 'assets/sprites/boss/direttore-point.png',
      rage: 'assets/sprites/boss/direttore-rage.png',
      hurt: 'assets/sprites/boss/direttore-hurt.png'
    }
  },
  npcs: {
    darts: 'assets/sprites/npc/darts.png',
    beans: 'assets/sprites/npc/beans.png',
    tennis: 'assets/sprites/npc/tennis.png',
    golf: 'assets/sprites/npc/golf.png'
  },
  items: {
    pesce: 'assets/items/pesce.png',
    mela: 'assets/items/mela.png',
    giocattolo: 'assets/items/giocattolo.png'
  }
};

/* =========================================================================
   DOGANA RUSH v2.0 — SPRITE PNG GENERATI (pipeline opzionale)
   -------------------------------------------------------------------------
   Gli sprite dei nuovi livelli (nemici, boss e ambientali) possono essere
   sostituiti da PNG generati esternamente (Nano Banana Pro / altri tool)
   SENZA toccare js/game.js. Regole:
     - se un PNG manca o l'entry del manifest è incompleta, il gioco usa
       l'arte procedurale già costruita in js/art.js (nessun crash/errore);
     - con enemies/bosses/ambient vuoti NON viene fatta alcuna richiesta di
       rete (zero 404): si gioca con il fallback procedurale.
   Documentazione completa: assets/sprites/v2/README.md
   ========================================================================= */
/* ── v2.0 MANIFEST — popolato da asset-forge con i PNG approvati ─────
   Regola: entry SOLO per file esistenti; i mancanti -> fallback procedurale.
   Documentazione: docs/asset-generation.md + assets/sprites/v2/README.md */
window.SPRITE_MANIFEST_V2 = {
  version: 2,
  enemies: {
    centurione: {
      walk: [
        'assets/sprites/v2/enemies/centurione-walk0.png',
        'assets/sprites/v2/enemies/centurione-walk1.png',
        'assets/sprites/v2/enemies/centurione-walk2.png',
        'assets/sprites/v2/enemies/centurione-walk3.png',
      ],
      attack: 'assets/sprites/v2/enemies/centurione-attack.png',
      hurt: 'assets/sprites/v2/enemies/centurione-hurt.png'
    },
    boomerTossico: {
      walk: [
        'assets/sprites/v2/enemies/boomerTossico-walk0.png',
        'assets/sprites/v2/enemies/boomerTossico-walk1.png',
        'assets/sprites/v2/enemies/boomerTossico-walk2.png',
        'assets/sprites/v2/enemies/boomerTossico-walk3.png',
      ],
      attack: 'assets/sprites/v2/enemies/boomerTossico-attack.png',
      hurt: 'assets/sprites/v2/enemies/boomerTossico-hurt.png'
    },
    meccanico: {
      walk: [
        'assets/sprites/v2/enemies/meccanico-walk0.png',
        'assets/sprites/v2/enemies/meccanico-walk1.png',
        'assets/sprites/v2/enemies/meccanico-walk2.png',
        'assets/sprites/v2/enemies/meccanico-walk3.png',
      ],
      attack: 'assets/sprites/v2/enemies/meccanico-attack.png',
      hurt: 'assets/sprites/v2/enemies/meccanico-hurt.png'
    },
    cuoco: {
      walk: [
        'assets/sprites/v2/enemies/cuoco-walk0.png',
        'assets/sprites/v2/enemies/cuoco-walk1.png',
        'assets/sprites/v2/enemies/cuoco-walk2.png',
        'assets/sprites/v2/enemies/cuoco-walk3.png',
      ],
      attack: 'assets/sprites/v2/enemies/cuoco-attack.png',
      hurt: 'assets/sprites/v2/enemies/cuoco-hurt.png'
    },
    merkel: {
      walk: [
        'assets/sprites/v2/enemies/merkel-walk0.png',
        'assets/sprites/v2/enemies/merkel-walk1.png',
        'assets/sprites/v2/enemies/merkel-walk2.png',
        'assets/sprites/v2/enemies/merkel-walk3.png',
      ],
      attack: 'assets/sprites/v2/enemies/merkel-attack.png',
      hurt: 'assets/sprites/v2/enemies/merkel-hurt.png'
    },
    francese: {
      walk: [
        'assets/sprites/v2/enemies/francese-walk0.png',
        'assets/sprites/v2/enemies/francese-walk1.png',
        'assets/sprites/v2/enemies/francese-walk2.png',
        'assets/sprites/v2/enemies/francese-walk3.png',
      ],
      attack: 'assets/sprites/v2/enemies/francese-attack.png',
      hurt: 'assets/sprites/v2/enemies/francese-hurt.png'
    },
    bottiglia: {
      walk: [
        'assets/sprites/v2/enemies/bottiglia-walk0.png',
        'assets/sprites/v2/enemies/bottiglia-walk1.png',
        'assets/sprites/v2/enemies/bottiglia-walk2.png',
        'assets/sprites/v2/enemies/bottiglia-walk3.png',
      ],
      attack: 'assets/sprites/v2/enemies/bottiglia-attack.png',
      hurt: 'assets/sprites/v2/enemies/bottiglia-hurt.png'
    },
    software: {
      walk: [
        'assets/sprites/v2/enemies/software-walk0.png',
        'assets/sprites/v2/enemies/software-walk1.png',
        'assets/sprites/v2/enemies/software-walk2.png',
        'assets/sprites/v2/enemies/software-walk3.png',
      ],
      attack: 'assets/sprites/v2/enemies/software-attack.png',
      hurt: 'assets/sprites/v2/enemies/software-hurt.png'
    },
    programma: {
      walk: [
        'assets/sprites/v2/enemies/programma-walk0.png',
        'assets/sprites/v2/enemies/programma-walk1.png',
        'assets/sprites/v2/enemies/programma-walk2.png',
        'assets/sprites/v2/enemies/programma-walk3.png',
      ],
      attack: 'assets/sprites/v2/enemies/programma-attack.png',
      hurt: 'assets/sprites/v2/enemies/programma-hurt.png'
    },
    bug: {
      walk: [
        'assets/sprites/v2/enemies/bug-walk0.png',
        'assets/sprites/v2/enemies/bug-walk1.png',
        'assets/sprites/v2/enemies/bug-walk2.png',
        'assets/sprites/v2/enemies/bug-walk3.png',
      ],
      attack: 'assets/sprites/v2/enemies/bug-attack.png',
      hurt: 'assets/sprites/v2/enemies/bug-hurt.png'
    },
    errore: {
      walk: [
        'assets/sprites/v2/enemies/errore-walk0.png',
        'assets/sprites/v2/enemies/errore-walk1.png',
        'assets/sprites/v2/enemies/errore-walk2.png',
        'assets/sprites/v2/enemies/errore-walk3.png',
      ],
      attack: 'assets/sprites/v2/enemies/errore-attack.png',
      hurt: 'assets/sprites/v2/enemies/errore-hurt.png'
    },
    crash: {
      walk: [
        'assets/sprites/v2/enemies/crash-walk0.png',
        'assets/sprites/v2/enemies/crash-walk1.png',
        'assets/sprites/v2/enemies/crash-walk2.png',
        'assets/sprites/v2/enemies/crash-walk3.png',
      ],
      attack: 'assets/sprites/v2/enemies/crash-attack.png',
      hurt: 'assets/sprites/v2/enemies/crash-hurt.png'
    },
    computer: {
      walk: [
        'assets/sprites/v2/enemies/computer-walk0.png',
        'assets/sprites/v2/enemies/computer-walk1.png',
        'assets/sprites/v2/enemies/computer-walk2.png',
        'assets/sprites/v2/enemies/computer-walk3.png',
      ],
      attack: 'assets/sprites/v2/enemies/computer-attack.png',
      hurt: 'assets/sprites/v2/enemies/computer-hurt.png'
    },
    nonna: {
      walk: [
        'assets/sprites/v2/enemies/nonna-walk0.png',
        'assets/sprites/v2/enemies/nonna-walk1.png',
        'assets/sprites/v2/enemies/nonna-walk2.png',
        'assets/sprites/v2/enemies/nonna-walk3.png',
      ],
      attack: 'assets/sprites/v2/enemies/nonna-attack.png',
      hurt: 'assets/sprites/v2/enemies/nonna-hurt.png'
    },
    scippatore: {
      walk: [
        'assets/sprites/v2/enemies/scippatore-walk0.png',
        'assets/sprites/v2/enemies/scippatore-walk1.png',
        'assets/sprites/v2/enemies/scippatore-walk2.png',
        'assets/sprites/v2/enemies/scippatore-walk3.png',
      ],
      attack: 'assets/sprites/v2/enemies/scippatore-attack.png',
      hurt: 'assets/sprites/v2/enemies/scippatore-hurt.png'
    },
    friggitrice: {
      walk: [
        'assets/sprites/v2/enemies/friggitrice-walk0.png',
        'assets/sprites/v2/enemies/friggitrice-walk1.png',
        'assets/sprites/v2/enemies/friggitrice-walk2.png',
        'assets/sprites/v2/enemies/friggitrice-walk3.png',
      ],
      attack: 'assets/sprites/v2/enemies/friggitrice-attack.png',
      hurt: 'assets/sprites/v2/enemies/friggitrice-hurt.png'
    },
    bagnino: {
      walk: [
        'assets/sprites/v2/enemies/bagnino-walk0.png',
        'assets/sprites/v2/enemies/bagnino-walk1.png',
        'assets/sprites/v2/enemies/bagnino-walk2.png',
        'assets/sprites/v2/enemies/bagnino-walk3.png',
      ],
      attack: 'assets/sprites/v2/enemies/bagnino-attack.png',
      hurt: 'assets/sprites/v2/enemies/bagnino-hurt.png'
    },
    animatore: {
      walk: [
        'assets/sprites/v2/enemies/animatore-walk0.png',
        'assets/sprites/v2/enemies/animatore-walk1.png',
        'assets/sprites/v2/enemies/animatore-walk2.png',
        'assets/sprites/v2/enemies/animatore-walk3.png',
      ],
      attack: 'assets/sprites/v2/enemies/animatore-attack.png',
      hurt: 'assets/sprites/v2/enemies/animatore-hurt.png'
    },
  },
  bosses: {
    cesare: {
      idle: [
        'assets/sprites/v2/boss/cesare-idle0.png',
        'assets/sprites/v2/boss/cesare-idle1.png',
      ],
      attack: 'assets/sprites/v2/boss/cesare-attack.png',
      hurt: 'assets/sprites/v2/boss/cesare-hurt.png',
      rage: 'assets/sprites/v2/boss/cesare-rage.png',
      meta: { ax: 120, ay: 292 }
    },
    ursula: {
      idle: [
        'assets/sprites/v2/boss/ursula-idle0.png',
        'assets/sprites/v2/boss/ursula-idle1.png',
      ],
      attack: 'assets/sprites/v2/boss/ursula-attack.png',
      hurt: 'assets/sprites/v2/boss/ursula-hurt.png',
      rage: 'assets/sprites/v2/boss/ursula-rage.png',
      meta: { ax: 120, ay: 292 }
    },
    ceo: {
      idle: [
        'assets/sprites/v2/boss/ceo-idle0.png',
        'assets/sprites/v2/boss/ceo-idle1.png',
      ],
      attack: 'assets/sprites/v2/boss/ceo-attack.png',
      hurt: 'assets/sprites/v2/boss/ceo-hurt.png',
      rage: 'assets/sprites/v2/boss/ceo-rage.png',
      meta: { ax: 120, ay: 292 }
    },
  },
  ambient: {
    sogeiMonkey: {
      frames: [
        'assets/sprites/v2/ambient/sogei-monkey0.png',
        'assets/sprites/v2/ambient/sogei-monkey1.png',
        'assets/sprites/v2/ambient/sogei-monkey2.png',
        'assets/sprites/v2/ambient/sogei-monkey3.png',
      ],
      meta: { ax: 46, ay: 88 }
    },
    sogeiBird: {
      frames: [
        'assets/sprites/v2/ambient/sogei-bird0.png',
        'assets/sprites/v2/ambient/sogei-bird1.png',
        'assets/sprites/v2/ambient/sogei-bird2.png',
        'assets/sprites/v2/ambient/sogei-bird3.png',
      ],
      meta: { ax: 36, ay: 63 }
    },
    sogeiCash: {
      frames: [
        'assets/sprites/v2/ambient/sogei-cash0.png',
        'assets/sprites/v2/ambient/sogei-cash1.png',
      ],
      meta: { ax: 48, ay: 60 }
    }
  },
  items: {
    scontrino: 'assets/sprites/v2/items/scontrino.png',
    spritz: 'assets/sprites/v2/items/spritz.png',
    caffe: 'assets/sprites/v2/items/caffe.png',
    mascara: 'assets/sprites/v2/items/mascara.png',
    powder: 'assets/sprites/v2/items/cipria.png',
    lipstick: 'assets/sprites/v2/items/lipstick.png',
    timbro: 'assets/sprites/v2/items/timbro.png'
  },
  props: {
    crate: 'assets/sprites/v2/props/crate.png',
    stall: 'assets/sprites/v2/props/stall.png',
    barrel: 'assets/sprites/v2/props/barrel.png',
    sign: 'assets/sprites/v2/props/sign.png',
    bollard: 'assets/sprites/v2/props/bollard.png',
    bench: 'assets/sprites/v2/props/bench.png',
    desk: 'assets/sprites/v2/props/desk.png',
    archive: 'assets/sprites/v2/props/archive.png',
    plant: 'assets/sprites/v2/props/plant.png',
    cooler: 'assets/sprites/v2/props/cooler.png',
  },
  bg: {
    portSky: 'assets/sprites/v2/bg/port-sky.png',
    bossPort: 'assets/sprites/v2/bg/port-boss.png',
    bariSky: 'assets/sprites/v2/bg/bari-sky.png',
    bossBasilica: 'assets/sprites/v2/bg/bari-boss.png',
    direzioneExt: 'assets/sprites/v2/bg/direzione-ext.png',
    bossDirezione: 'assets/sprites/v2/bg/direzione-boss.png',
    romaSky: 'assets/sprites/v2/bg/roma-sky.png',
    europaSky: 'assets/sprites/v2/bg/europa-sky.png',
    pescaraSky: 'assets/sprites/v2/bg/pescara-sky.png',
    pescaraNightSky: 'assets/sprites/v2/bg/pescara-night-sky.png',
    sogeiSky: 'assets/sprites/v2/bg/sogei-sky.png',
    bossRoma: 'assets/sprites/v2/bg/roma-boss.png',
    bossEuropa: 'assets/sprites/v2/bg/europa-boss.png',
    bossSogei: 'assets/sprites/v2/bg/sogei-boss.png'
  },
  direzioneRooms: {
    sportello: 'assets/sprites/v2/direzione/rooms/sportello.png',
    segreteria: 'assets/sprites/v2/direzione/rooms/segreteria.png',
    darts: 'assets/sprites/v2/direzione/rooms/darts.png',
    photocopy: 'assets/sprites/v2/direzione/rooms/photocopy.png',
    beans: 'assets/sprites/v2/direzione/rooms/beans.png',
    waiting: 'assets/sprites/v2/direzione/rooms/waiting.png',
    tennis: 'assets/sprites/v2/direzione/rooms/tennis.png',
    golf: 'assets/sprites/v2/direzione/rooms/golf.png',
    meeting: 'assets/sprites/v2/direzione/rooms/meeting.png',
    training: 'assets/sprites/v2/direzione/rooms/training.png',
    coffee: 'assets/sprites/v2/direzione/rooms/coffee.png',
    vending: 'assets/sprites/v2/direzione/rooms/vending.png',
    archive: 'assets/sprites/v2/direzione/rooms/archive.png',
    server: 'assets/sprites/v2/direzione/rooms/server.png',
    centralino: 'assets/sprites/v2/direzione/rooms/centralino.png',
    protocollo: 'assets/sprites/v2/direzione/rooms/protocollo.png',
    mensa: 'assets/sprites/v2/direzione/rooms/mensa.png',
  },
  tipoCar: {
    frames: ['assets/sprites/v2/props/fiat-tipo-frame0.png'],
    meta: { w: 220, h: 100, ax: 60, ay: 92, window: { x: 62, y: 18, w: 76, h: 26 } }
  }
};

/* DOGANA RUSH: PORTO FRANCO — gioco arcade run-and-gun
   Motore, livelli, nemici, boss e interfaccia in italiano. */
(function () {
  'use strict';

  const W = 640, H = 360, GROUND = 306;
  const TAU = Math.PI * 2;
  /* Scala visiva v1.2: sprite più grandi mantenendo i piedi a GROUND.
     Le hitbox vengono scalate con lo stesso fattore per restare coerenti con il disegno. */
  const PLAYER_SCALE = 1.12;
  const ENEMY_SCALE = 1.2;
  const OCTO_SCALE = 1.06;
  const DIRECTOR_SCALE = .95;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const approach = (cur, target, delta) => cur < target ? Math.min(cur + delta, target) : Math.max(cur - delta, target);
  const mod = (n, m) => ((n % m) + m) % m;
  const rand = (a, b) => a + Math.random() * (b - a);
  const choose = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* =========================================================
     DATI LIVELLI
     ========================================================= */
  const LEVELS = [
    {
      id: 1,
      code: 'LIVELLO 01',
      title: 'PORTO E DOGANA DI BARI',
      subtitle: 'MOLO SAN NICOLA · ORE 08:00',
      introLine: 'APRIRE UN VARCO DOGANALE',
      width: 4400,
      arena: 3760,
      bossTrigger: 3900,
      sky: 'portSky',
      ground: 1,
      music: 'level1',
      /* v2.1 — sfondo AI FULL-SCENE (decisione pilot): se il loader v2 porta
         portSky come immagine AI, viene disegnata a schermo intero e i layer
         procedurali portFar/Mid/Near sono saltati. Senza AI: percorso a layer
         identico a prima. Override QA: bgMode:'full'|'layers'/bgFullScene/bgLayers. */
      bgMode: 'auto',
      layers: [
        { key: 'portFar', factor: .12, alpha: 1 },
        { key: 'portMid', factor: .35, alpha: 1 },
        { key: 'portNear', factor: .62, alpha: 1 }
      ],
      boss: 'octo',
      bossBg: 'bossPort',
      bossName: 'POLPO MUTANTE',
      bossSub: 'CONTROLLO TENTACOLI · MOLO 3',
      bossQuote: 'Il polpo ha rifiutato il modulo. E ha tentacoli.',
      waves: [
        { x: 250, types: ['pretender'] },
        { x: 560, types: ['pretender', 'pretender'] },
        { x: 880, types: ['boomer', 'pretender', 'finanziere'] },
        { x: 1180, types: ['utente'] },
        { x: 1430, types: ['pretender', 'pretender'] },
        { x: 1720, types: ['boomer', 'utente', 'finanziere'] },
        { x: 2040, types: ['pretender', 'pretender', 'pretender'] },
        { x: 2360, types: ['utente', 'boomer', 'finanziere'] },
        { x: 2690, types: ['pretender', 'pretender', 'boomer'] },
        { x: 3040, types: ['utente', 'utente'] },
        { x: 3320, types: ['pretender', 'boomer', 'utente', 'finanziere'] },
        { x: 3590, types: ['pretender', 'pretender', 'boomer', 'utente'] }
      ],
      props: [
        { type: 'sign', x: 300 },
        { type: 'crate', x: 430, loot: 'grenade' },
        { type: 'barrel', x: 474 },
        { type: 'bollard', x: 620 },
        { type: 'bench', x: 815 },
        { type: 'crate', x: 970, loot: 'points' },
        { type: 'barrel', x: 1010, loot: 'health' },
        { type: 'sign', x: 1280 },
        { type: 'crate', x: 1500, loot: 'mascara' },
        { type: 'barrel', x: 1540 },
        { type: 'crate', x: 1805 },
        { type: 'bollard', x: 1920 },
        { type: 'bench', x: 2110 },
        { type: 'crate', x: 2350, loot: 'health' },
        { type: 'barrel', x: 2390, loot: 'grenade' },
        { type: 'crate', x: 2650 },
        { type: 'barrel', x: 2692 },
        { type: 'sign', x: 2930 },
        { type: 'crate', x: 3150, loot: 'mascara' },
        { type: 'crate', x: 3190, loot: 'health' },
        { type: 'bollard', x: 3350 },
        { type: 'bench', x: 3560 }
      ],
      pickups: [
        { type: 'grenade', x: 1320 },
        { type: 'health', x: 2225 },
        { type: 'mascara', x: 3410 }
      ],
      platforms: [
        { x: 690, y: 248, w: 90 },
        { x: 2060, y: 244, w: 104 },
        { x: 3260, y: 250, w: 86 }
      ]
    },
    {
      id: 2,
      code: 'LIVELLO 02',
      title: 'BARI VECCHIA',
      subtitle: 'LUNGOMARE → VICOLI → BASILICA',
      introLine: 'IL CENTRO STORICO È IN RIVOLTA',
      width: 5400,
      arena: 4760,
      bossTrigger: 4900,
      sky: 'bariSky',
      ground: 2,
      music: 'level2',
      /* v2.1 — vedi livello 1: bariSky AI → full-scene, layer saltati. */
      bgMode: 'auto',
      layers: [
        { key: 'bariFar', factor: .10, alpha: 1 },
        { key: 'bariMid', factor: .35, alpha: 1 },
        { key: 'bariNear', factor: .56, alpha: 1 }
      ],
      boss: 'mecha',
      bossBg: 'bossBasilica',
      bossName: 'MECHA SAN NICOLA',
      bossSub: 'GUARDIANO DELLA BASILICA · FASE FINALE',
      bossQuote: 'La Basilica è occupata. Il pellegrinaggio è sospeso.',
      waves: [
        { x: 280, types: ['nonna', 'scippatore'] },
        { x: 620, types: ['friggitrice', 'pretender'] },
        { x: 1050, types: ['nonna', 'scippatore', 'utente'] },
        { x: 1470, types: ['friggitrice', 'scippatore', 'boomer'] },
        { x: 1920, types: ['scippatore', 'scippatore', 'nonna', 'finanziere'] },
        { x: 2400, types: ['nonna', 'friggitrice', 'boomer', 'utente'] },
        { x: 2880, types: ['scippatore', 'friggitrice'] },
        { x: 3300, types: ['nonna', 'scippatore', 'pretender'] },
        { x: 3730, types: ['friggitrice', 'nonna', 'boomer', 'finanziere'] },
        { x: 4180, types: ['scippatore', 'nonna', 'friggitrice', 'boomer'] },
        { x: 4510, types: ['nonna', 'scippatore', 'friggitrice'] }
      ],
      props: [
        { type: 'sign', x: 260 },
        { type: 'crate', x: 440, loot: 'health' },
        { type: 'stall', x: 760, loot: 'mascara' },
        { type: 'barrel', x: 860 },
        { type: 'bench', x: 1070 },
        { type: 'crate', x: 1310 },
        { type: 'stall', x: 1650, loot: 'grenade' },
        { type: 'sign', x: 1900 },
        { type: 'barrel', x: 2060, loot: 'health' },
        { type: 'bench', x: 2280 },
        { type: 'crate', x: 2530 },
        { type: 'stall', x: 2860, loot: 'mascara' },
        { type: 'stall', x: 3080, loot: 'health' },
        { type: 'barrel', x: 3160 },
        { type: 'sign', x: 3340 },
        { type: 'bench', x: 3560 },
        { type: 'stall', x: 3790, loot: 'grenade' },
        { type: 'crate', x: 4050, loot: 'mascara' },
        { type: 'crate', x: 4088, loot: 'health' },
        { type: 'bollard', x: 4240 },
        { type: 'bench', x: 4420 }
      ],
      pickups: [
        { type: 'mascara', x: 1440 },
        { type: 'health', x: 2410 },
        { type: 'grenade', x: 3370 },
        { type: 'health', x: 4160 }
      ],
      platforms: [
        { x: 910, y: 246, w: 94 },
        { x: 2450, y: 242, w: 108 },
        { x: 4040, y: 250, w: 88 }
      ]
    },
    {
      id: 3,
      code: 'LIVELLO 03',
      title: 'DIREZIONE TERRITORIALE',
      subtitle: 'VIA AMENDOLA · BARI · ORE 12:30',
      introLine: 'LA PRATICA DEVE SALIRE AL PIANO ALTO',
      width: 4600,
      arena: 4020,
      bossTrigger: 4170,
      sky: null,
      ground: 3,
      music: 'level3',
      layers: [],
      boss: 'direttore',
      bossBg: 'bossDirezione',
      bossName: 'MEGA DIRETTORE',
      bossSub: 'TERRITORIALE · PIANO ALTO',
      bossQuote: 'Il Direttore ha spostato l’ufficio. E anche voi.',
      waves: [
        { x: 1080, types: ['collega'] },
        { x: 1320, types: ['bidella', 'collega'] },
        { x: 1580, types: ['formatore', 'collega'] },
        { x: 1860, types: ['collega', 'utente'] },
        { x: 2140, types: ['bidella', 'formatore'] },
        { x: 2440, types: ['collega', 'collega', 'bidella'] },
        { x: 2760, types: ['formatore', 'utente'] },
        { x: 3080, types: ['bidella', 'collega', 'finanziere'] },
        { x: 3400, types: ['formatore', 'formatore', 'collega'] },
        { x: 3720, types: ['collega', 'bidella', 'utente', 'finanziere'] },
        { x: 3980, types: ['formatore', 'collega', 'bidella'] }
      ],
      props: [
        { type: 'sign', x: 320 },
        { type: 'plant', x: 620 },
        { type: 'bench', x: 840 },
        { type: 'desk', x: 1180, loot: 'health' },
        { type: 'archive', x: 1320 },
        { type: 'plant', x: 1450 },
        { type: 'cooler', x: 1600 },
        { type: 'desk', x: 1840, loot: 'grenade' },
        { type: 'bench', x: 2040 },
        { type: 'archive', x: 2260, loot: 'mascara' },
        { type: 'desk', x: 2520, loot: 'health' },
        { type: 'plant', x: 2700 },
        { type: 'archive', x: 2940 },
        { type: 'cooler', x: 3110, loot: 'grenade' },
        { type: 'desk', x: 3380, loot: 'mascara' },
        { type: 'bench', x: 3560 },
        { type: 'plant', x: 3740 },
        { type: 'sign', x: 3980 }
      ],
      pickups: [
        { type: 'health', x: 1260 },
        { type: 'grenade', x: 2180 },
        { type: 'mascara', x: 2960 },
        { type: 'health', x: 3660 }
      ],
      platforms: [
        { x: 1470, y: 246, w: 104 },
        { x: 2420, y: 242, w: 108 },
        { x: 3290, y: 248, w: 96 },
        { x: 3880, y: 242, w: 112 }
      ]
    },
    {
      /* v2.0 — LIVELLO 4: DIREZIONE CENTRALE, PIAZZA MASTAI (ROMA).
         customBg: il renderer dedicato drawRomaBackground(); se Art.bg.roma*
         non è ancora pronto gameplay usa il fallback procedurale. */
      id: 4,
      code: 'LIVELLO 04',
      title: 'DIREZIONE CENTRALE',
      subtitle: 'ROMA · PIAZZA MASTAI · ORE 10:20',
      introLine: 'LA PRATICA SALE A ROMA. IL PATRIZIO ATTENDE.',
      width: 5200,
      arena: 4560,
      bossTrigger: 4700,
      sky: null,
      ground: 4,
      music: 'roma',
      customBg: 'roma',
      bgMode: 'full',
      layers: [],
      boss: 'cesare',
      bossBg: 'bossRoma',
      bossMusic: 'bossRoma',
      bossName: 'GIULIO CESARE',
      bossSub: 'PATRIZIO SNOB · DIREZIONE CENTRALE',
      bossQuote: 'Lei è in ritardo di duemila anni. Mi firmi il papiro.',
      waves: [
        { x: 300, types: ['meccanico', 'centurione'] },
        { x: 620, types: ['boomerTossico', 'cuoco'] },
        { x: 980, types: ['centurione', 'meccanico', 'meccanico'] },
        { x: 1340, types: ['cuoco', 'boomerTossico'] },
        { x: 1720, types: ['centurione', 'centurione'] },
        { x: 2080, types: ['meccanico', 'cuoco', 'boomerTossico'] },
        { x: 2460, types: ['centurione', 'meccanico'] },
        { x: 2860, types: ['cuoco', 'cuoco', 'boomerTossico'] },
        { x: 3260, types: ['centurione', 'meccanico', 'centurione'] },
        { x: 3680, types: ['boomerTossico', 'cuoco', 'meccanico'] },
        { x: 4080, types: ['centurione', 'centurione', 'meccanico'] },
        { x: 4430, types: ['cuoco', 'boomerTossico', 'meccanico', 'centurione'] }
      ],
      props: [
        { type: 'sign', x: 280 },
        { type: 'plant', x: 460 },
        { type: 'bench', x: 640 },
        { type: 'bollard', x: 820 },
        { type: 'crate', x: 1010, loot: 'health' },
        { type: 'barrel', x: 1050 },
        { type: 'plant', x: 1240 },
        { type: 'bench', x: 1460 },
        { type: 'sign', x: 1660 },
        { type: 'crate', x: 1880, loot: 'grenade' },
        { type: 'bollard', x: 2020 },
        { type: 'plant', x: 2240 },
        { type: 'bench', x: 2460, loot: 'mascara' },
        { type: 'crate', x: 2680, loot: 'health' },
        { type: 'sign', x: 2900 },
        { type: 'plant', x: 3120 },
        { type: 'bollard', x: 3300 },
        { type: 'bench', x: 3520 },
        { type: 'crate', x: 3740, loot: 'grenade' },
        { type: 'barrel', x: 3780 },
        { type: 'plant', x: 4000 },
        { type: 'sign', x: 4240 },
        { type: 'bench', x: 4460, loot: 'health' }
      ],
      pickups: [
        { type: 'health', x: 1180 },
        { type: 'mascara', x: 2320 },
        { type: 'timbro', x: 2620 },
        { type: 'grenade', x: 3450 },
        { type: 'health', x: 4300 }
      ],
      platforms: [
        { x: 880, y: 246, w: 100 },
        { x: 2180, y: 242, w: 108 },
        { x: 3380, y: 248, w: 96 },
        { x: 4220, y: 242, w: 104 }
      ]
    },
    {
      /* v2.0 — LIVELLO 5: DOGANA EUROPEA, QUARTIERE UE (BRUXELLES). */
      id: 5,
      code: 'LIVELLO 05',
      title: 'DOGANA EUROPEA',
      subtitle: 'BRUXELLES · QUARTIERE UE · ORE 15:40',
      introLine: 'LA COMMISSIONE ESAMINA LA PRATICA.',
      width: 5400,
      arena: 4780,
      bossTrigger: 4920,
      sky: null,
      ground: 5,
      music: 'europa',
      customBg: 'europa',
      bgMode: 'full',
      layers: [],
      boss: 'ursula',
      bossBg: 'bossEuropa',
      bossMusic: 'bossEuropa',
      bossName: 'URSULA VON DER LEYEN',
      bossSub: 'PRESIDENTE DELLA COMMISSIONE · BERLAYMONT',
      bossQuote: 'La sua pratica non rispetta il regolamento (CE) n. 1/2026.',
      waves: [
        { x: 300, types: ['merkel', 'francese'] },
        { x: 640, types: ['bottiglia', 'francese'] },
        { x: 1000, types: ['merkel', 'bottiglia', 'francese'] },
        { x: 1380, types: ['francese', 'francese'] },
        { x: 1760, types: ['merkel', 'bottiglia'] },
        { x: 2140, types: ['bottiglia', 'bottiglia', 'francese'] },
        { x: 2520, types: ['merkel', 'francese'] },
        { x: 2900, types: ['francese', 'bottiglia', 'merkel'] },
        { x: 3300, types: ['merkel', 'merkel', 'bottiglia'] },
        { x: 3700, types: ['francese', 'bottiglia', 'francese'] },
        { x: 4120, types: ['merkel', 'bottiglia', 'francese', 'bottiglia'] },
        { x: 4520, types: ['merkel', 'francese', 'bottiglia'] }
      ],
      props: [
        { type: 'sign', x: 300 },
        { type: 'bench', x: 520 },
        { type: 'plant', x: 720 },
        { type: 'bollard', x: 900 },
        { type: 'crate', x: 1090, loot: 'health' },
        { type: 'plant', x: 1300 },
        { type: 'bench', x: 1520 },
        { type: 'sign', x: 1740 },
        { type: 'bollard', x: 1940 },
        { type: 'crate', x: 2160, loot: 'grenade' },
        { type: 'barrel', x: 2200 },
        { type: 'plant', x: 2420 },
        { type: 'bench', x: 2640, loot: 'mascara' },
        { type: 'sign', x: 2880 },
        { type: 'plant', x: 3100 },
        { type: 'bollard', x: 3320 },
        { type: 'crate', x: 3540, loot: 'health' },
        { type: 'bench', x: 3780 },
        { type: 'plant', x: 4000 },
        { type: 'sign', x: 4220 },
        { type: 'crate', x: 4440, loot: 'grenade' },
        { type: 'bench', x: 4640, loot: 'health' }
      ],
      pickups: [
        { type: 'health', x: 1240 },
        { type: 'mascara', x: 2380 },
        { type: 'grenade', x: 3520 },
        { type: 'health', x: 4380 }
      ],
      platforms: [
        { x: 940, y: 246, w: 104 },
        { x: 2260, y: 242, w: 108 },
        { x: 3460, y: 248, w: 96 },
        { x: 4320, y: 242, w: 104 }
      ]
    },
    {
      /* v2.0 — LIVELLO 6 (BONUS): FORMAZIONE A PESCARA.
         Nessun boss: si chiude al traguardo (o esauriti i giorni) con obiettivo
         scontrini. HUD "GIORNI ALLA FINE". Nemici v1 in versione psichedelica. */
      id: 6,
      code: 'LIVELLO 06 · BONUS',
      title: 'FORMAZIONE A PESCARA',
      subtitle: 'HOTEL SUL MARE · PESCARA · ORE 09:00',
      introLine: 'CINQUE GIORNI ALLA FINE. RACCOGLI GLI SCONTRINI.',
      width: 4600,
      sky: null,
      ground: 6,
      music: 'pescara',
      customBg: 'pescara',
      bgMode: 'full',
      layers: [],
      bonus: { kind: 'formazione', daysTotal: 5, receiptGoal: 20, carSection: false },
      waves: [
        { x: 320, types: ['bagnino', 'animatore'] },
        { x: 680, types: ['animatore', 'pretender', 'bagnino'] },
        { x: 1060, types: ['bagnino', 'utente', 'animatore'] },
        { x: 1460, types: ['animatore', 'bagnino', 'boomer'] },
        { x: 1880, types: ['bagnino', 'collega', 'animatore'] },
        { x: 2300, types: ['animatore', 'bagnino', 'finanziere'] },
        { x: 2740, types: ['bagnino', 'bagnino', 'animatore'] },
        { x: 3180, types: ['animatore', 'bagnino', 'collega'] },
        { x: 3620, types: ['bagnino', 'animatore', 'boomer'] },
        { x: 4040, types: ['animatore', 'bagnino', 'finanziere', 'utente'] }
      ],
      props: [
        { type: 'sign', x: 300 },
        { type: 'bench', x: 520 },
        { type: 'plant', x: 720 },
        { type: 'crate', x: 940, loot: 'scontrino' },
        { type: 'stall', x: 1180, loot: 'scontrino' },
        { type: 'bench', x: 1420 },
        { type: 'barrel', x: 1640, loot: 'health' },
        { type: 'sign', x: 1860 },
        { type: 'stall', x: 2100, loot: 'scontrino' },
        { type: 'plant', x: 2340 },
        { type: 'crate', x: 2580, loot: 'spritz' },
        { type: 'bench', x: 2820 },
        { type: 'sign', x: 3060 },
        { type: 'stall', x: 3300, loot: 'scontrino' },
        { type: 'barrel', x: 3540, loot: 'grenade' },
        { type: 'plant', x: 3780 },
        { type: 'crate', x: 4020, loot: 'caffe' },
        { type: 'bench', x: 4260 }
      ],
      pickups: [
        { type: 'scontrino', x: 620 }, { type: 'scontrino', x: 880 },
        { type: 'scontrino', x: 1130 }, { type: 'scontrino', x: 1380 },
        { type: 'scontrino', x: 1630 }, { type: 'spritz', x: 1780 },
        { type: 'scontrino', x: 1980 }, { type: 'scontrino', x: 2230 },
        { type: 'health', x: 2450 }, { type: 'scontrino', x: 2680 },
        { type: 'scontrino', x: 2930 }, { type: 'caffe', x: 3150 },
        { type: 'scontrino', x: 3380 }, { type: 'scontrino', x: 3630 },
        { type: 'mascara', x: 3850 }, { type: 'scontrinoGun', x: 3920 }, { type: 'scontrino', x: 4080 },
        { type: 'grenade', x: 4280 }
      ],
      platforms: [
        { x: 980, y: 248, w: 100 },
        { x: 2380, y: 244, w: 104 },
        { x: 3560, y: 250, w: 96 }
      ]
    },
    {
      /* v2.0 — LIVELLO 7 (BONUS): PESCARA BY NIGHT.
         Scontrini/spritz e sezione finale a bordo della FIAT TIPO 3 VOLUMI
         (carSection: sparo dal finestrino, camera veloce, clear senza boss). */
      id: 7,
      code: 'LIVELLO 07 · BONUS',
      title: 'PESCARA BY NIGHT',
      subtitle: 'LUNGOMARE · RISTORANTI · ORE 23:30',
      introLine: 'SCONTRINI, SPRITZ E UNA FIAT TIPO TRE VOLUMI.',
      width: 5000,
      sky: null,
      ground: 6,
      music: 'pescaraNight',
      customBg: 'pescaraNight',
      bgMode: 'full',
      layers: [],
      bonus: { kind: 'serata', daysTotal: 2, receiptGoal: 12, carSection: true },
      carSectionX: 3300,
      waves: [
        { x: 280, types: ['animatore', 'bagnino'] },
        { x: 600, types: ['bagnino', 'animatore', 'pretender'] },
        { x: 980, types: ['animatore', 'bagnino', 'finanziere'] },
        { x: 1360, types: ['bagnino', 'animatore', 'boomer'] },
        { x: 1740, types: ['animatore', 'bagnino', 'collega'] },
        { x: 2140, types: ['bagnino', 'animatore', 'utente'] },
        { x: 2540, types: ['animatore', 'bagnino', 'collega'] },
        { x: 2940, types: ['bagnino', 'animatore', 'finanziere'] },
        { x: 3340, types: ['animatore', 'bagnino', 'boomer'] },
        { x: 3720, types: ['bagnino', 'animatore', 'collega'] },
        { x: 4100, types: ['animatore', 'bagnino', 'utente'] },
        { x: 4480, types: ['bagnino', 'animatore', 'finanziere', 'boomer'] }
      ],
      props: [
        { type: 'sign', x: 280 },
        { type: 'bench', x: 500, loot: 'scontrino' },
        { type: 'stall', x: 720, loot: 'scontrino' },
        { type: 'barrel', x: 940, loot: 'spritz' },
        { type: 'plant', x: 1160 },
        { type: 'stall', x: 1380, loot: 'scontrino' },
        { type: 'bench', x: 1600 },
        { type: 'sign', x: 1820 },
        { type: 'crate', x: 2040, loot: 'caffe' },
        { type: 'stall', x: 2260, loot: 'scontrino' },
        { type: 'plant', x: 2480 },
        { type: 'barrel', x: 2700, loot: 'grenade' },
        { type: 'bench', x: 2920, loot: 'health' },
        { type: 'stall', x: 3140, loot: 'scontrino' },
        { type: 'sign', x: 3360 },
        { type: 'plant', x: 3580 },
        { type: 'bench', x: 3800 },
        { type: 'stall', x: 4020, loot: 'scontrino' },
        { type: 'crate', x: 4240, loot: 'spritz' },
        { type: 'bench', x: 4460 }
      ],
      pickups: [
        { type: 'scontrino', x: 540 }, { type: 'scontrino', x: 780 },
        { type: 'spritz', x: 900 }, { type: 'scontrino', x: 1240 },
        { type: 'scontrino', x: 1490 }, { type: 'caffe', x: 1720 },
        { type: 'scontrino', x: 1960 }, { type: 'health', x: 2180 },
        { type: 'scontrino', x: 2420 }, { type: 'scontrino', x: 2680 },
        { type: 'spritz', x: 2900 }, { type: 'spritzGun', x: 3140 },
        { type: 'scontrino', x: 3400 }, { type: 'mascara', x: 3620 },
        { type: 'scontrino', x: 3860 }, { type: 'grenade', x: 4080 },
        { type: 'scontrino', x: 4300 }, { type: 'health', x: 4520 }
      ],
      platforms: [
        { x: 1060, y: 248, w: 100 },
        { x: 2500, y: 244, w: 104 },
        { x: 3900, y: 250, w: 96 }
      ]
    },
    {
      /* v2.0 — LIVELLO 8: INCUBO SOGEI. Ultima pratica, ultimo boss. */
      id: 8,
      code: 'LIVELLO 08',
      title: 'INCUBO SOGEI',
      subtitle: 'SEDE SOGEI · SERVER ROOM · ORE 03:33',
      introLine: 'ULTIMA PRATICA. L’ULTIMO BOSS. LA FINE DELL’INCUBO.',
      width: 5600,
      arena: 4960,
      bossTrigger: 5100,
      sky: null,
      ground: 7,
      music: 'sogei',
      customBg: 'sogei',
      bgMode: 'layers',
      layers: [],
      boss: 'ceo',
      bossBg: 'bossSogei',
      bossMusic: 'bossSogei',
      bossName: 'EX CEO SOGEI',
      bossSub: 'DOMICILIARI · MANETTE AI POLSI',
      bossQuote: 'Lei non ha i permessi. Io ho i milioni. E le manette.',
      waves: [
        { x: 320, types: ['software', 'bug'] },
        { x: 700, types: ['programma', 'errore'] },
        { x: 1100, types: ['bug', 'bug', 'software'] },
        { x: 1500, types: ['crash', 'errore'] },
        { x: 1900, types: ['computer'] },
        { x: 2300, types: ['software', 'programma'] },
        { x: 2700, types: ['bug', 'crash', 'bug'] },
        { x: 3100, types: ['errore', 'computer', 'software'] },
        { x: 3500, types: ['programma', 'crash'] },
        { x: 3900, types: ['bug', 'software', 'errore'] },
        { x: 4300, types: ['computer', 'crash', 'bug'] },
        { x: 4700, types: ['software', 'programma', 'errore', 'bug'] }
      ],
      props: [
        { type: 'sign', x: 300 },
        { type: 'cooler', x: 520 },
        { type: 'crate', x: 740, loot: 'health' },
        { type: 'archive', x: 980 },
        { type: 'desk', x: 1220, loot: 'scontrino' },
        { type: 'sign', x: 1460 },
        { type: 'cooler', x: 1680 },
        { type: 'archive', x: 1920, loot: 'grenade' },
        { type: 'desk', x: 2160 },
        { type: 'crate', x: 2400, loot: 'mascara' },
        { type: 'sign', x: 2640 },
        { type: 'archive', x: 2880 },
        { type: 'cooler', x: 3120, loot: 'health' },
        { type: 'desk', x: 3360 },
        { type: 'crate', x: 3600, loot: 'grenade' },
        { type: 'archive', x: 3840, loot: 'spritz' },
        { type: 'sign', x: 4080 },
        { type: 'desk', x: 4320, loot: 'health' },
        { type: 'cooler', x: 4560 },
        { type: 'crate', x: 4800 }
      ],
      pickups: [
        { type: 'health', x: 1180 },
        { type: 'mascara', x: 2420 },
        { type: 'grenade', x: 3540 },
        { type: 'health', x: 4600 }
      ],
      platforms: [
        { x: 1060, y: 246, w: 104 },
        { x: 2520, y: 242, w: 108 },
        { x: 3980, y: 248, w: 96 },
        { x: 4780, y: 242, w: 104 }
      ]
    }
  ];

  const CHARACTERS = {
    adele: {
      name: 'ADELE', fullName: 'Adele', role: 'Ufficio Protocollo',
      tagline: 'MILF LEGGENDARIA',
      bio: 'Aspirante TikToker e regina di Instagram, tra una pratica e l’altra.',
      hp: 100, speed: 1, weapon: 'lipstick', grenades: 8,
      bullet: 'lipstick', grenadeName: 'CIPRIA', ammoLabel: 'TRUCCHI',
      weaponLabel: 'ROSSETTO', grenadeLabel: 'CIPRIA'
    },
    rocco: {
      name: 'ROCCO', fullName: 'Rocco', role: 'Assistente Doganale · ex Croce Rossa',
      hp: 126, speed: .9, weapon: 'bolt', grenades: 6,
      bullet: 'bolt', grenadeName: 'TELECOMANDO', ammoLabel: 'VITI',
      weaponLabel: 'BULLONIERA', grenadeLabel: 'TELECOM.'
    }
  };

  /* =========================================================
     DIFFICOLTÀ E IMPOSTAZIONI (accessibilità)
     ========================================================= */
  const DIFFICULTIES = {
    easy: {
      key: 'easy', label: 'FACILE',
      enemyHp: .8, dmgTaken: .7, enemySpeed: .92, attackRate: .85,
      bossHp: .8, bossRate: .85, lives: 5, scoreMul: .8
    },
    normal: {
      key: 'normal', label: 'NORMALE',
      enemyHp: 1, dmgTaken: 1, enemySpeed: 1, attackRate: 1,
      bossHp: 1, bossRate: 1, lives: 4, scoreMul: 1
    },
    hard: {
      key: 'hard', label: 'DIFFICILE',
      enemyHp: 1.25, dmgTaken: 1.3, enemySpeed: 1.08, attackRate: 1.2,
      bossHp: 1.3, bossRate: 1.18, lives: 3, scoreMul: 1.4
    }
  };
  const DIFFICULTY_ORDER = ['easy', 'normal', 'hard'];
  const SETTINGS_KEY = 'dogana.settings';
  const DEFAULT_BINDINGS = {
    left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS',
    shoot: 'KeyZ', jump: 'KeyX', grenade: 'KeyC', switch: 'KeyH', pause: 'KeyP'
  };
  const DEFAULT_SETTINGS = {
    difficulty: 'normal', reduceFlash: false, reduceShake: false,
    pauseOnBlur: true, subtitles: false, bindings: {}
  };
  const BOOL_SETTINGS = ['reduceFlash', 'reduceShake', 'pauseOnBlur', 'subtitles'];

  /* Mappa tasti effettiva: default + eventuali rimappature salvate.
     Un'azione rimappata sostituisce tutti i codici di default della stessa azione.
     (Calcolata al boot: KEYMAP è dichiarata più sotto.) */
  let KEYMAP_ACTIVE = null;
  function rebuildKeyMap() {
    const map = { ...KEYMAP };
    const custom = (S.settings && S.settings.bindings) || {};
    for (const [action, code] of Object.entries(custom)) {
      if (!code || !(action in DEFAULT_BINDINGS)) continue;
      for (const k of Object.keys(map)) if (map[k] === action) delete map[k];
      map[code] = action;
    }
    KEYMAP_ACTIVE = map;
  }

  function normalizeSettings(raw) {
    const out = { ...DEFAULT_SETTINGS, bindings: {} };
    if (!raw || typeof raw !== 'object') return out;
    out.difficulty = DIFFICULTIES[raw.difficulty] ? raw.difficulty : 'normal';
    for (const k of BOOL_SETTINGS) if (typeof raw[k] === 'boolean') out[k] = raw[k];
    if (raw.bindings && typeof raw.bindings === 'object') {
      for (const [action, code] of Object.entries(raw.bindings)) {
        if (action in DEFAULT_BINDINGS && typeof code === 'string' && code.length < 32) {
          out.bindings[action] = code;
        }
      }
    }
    return out;
  }

  function loadSettings() {
    let raw = null;
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) raw = JSON.parse(saved);
    } catch (e) { raw = null; }
    S.settings = normalizeSettings(raw);
    S.difficulty = S.settings.difficulty;
    rebuildKeyMap();
  }

  function saveSettings() {
    if (!S.settings) return;
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(S.settings)); } catch (e) {}
  }

  function diff() { return DIFFICULTIES[S.difficulty] || DIFFICULTIES.normal; }
  function difficultyLabel() { return diff().label; }
  function scoreMul() { return diff().scoreMul; }

  function syncDifficultyUI() {
    document.querySelectorAll('[data-difficulty]').forEach(btn => {
      const active = btn.dataset.difficulty === S.difficulty;
      btn.classList.toggle('is-active', active);
      btn.classList.toggle('is-selected', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    const label = $('difficulty-label');
    if (label) label.textContent = difficultyLabel();
    if (document.body) document.body.dataset.difficulty = S.difficulty;
  }

  function setDifficulty(key, opts = {}) {
    if (!DIFFICULTIES[key]) key = 'normal';
    const changed = key !== S.difficulty;
    S.difficulty = key;
    if (S.settings) { S.settings.difficulty = key; saveSettings(); }
    syncDifficultyUI();
    if (changed && !opts.silent) {
      showToast('DIFFICOLTÀ ' + difficultyLabel() + ' · ' + (key === 'easy' ? 'VITE EXTRA' : key === 'hard' ? 'PUNTI x' + scoreMul().toFixed(1) : 'BILANCIATA'), 1800);
    }
    return S.difficulty;
  }

  function setSetting(key, value) {
    if (!S.settings) loadSettings();
    if (key === 'difficulty') return setDifficulty(value);
    if (key === 'bindings' && value && typeof value === 'object') {
      for (const [action, code] of Object.entries(value)) setBinding(action, code, { silent: true });
      return true;
    }
    if (!BOOL_SETTINGS.includes(key)) return false;
    S.settings[key] = !!value;
    saveSettings();
    return true;
  }

  function setBinding(action, code, opts = {}) {
    if (!S.settings) loadSettings();
    if (!(action in DEFAULT_BINDINGS) || typeof code !== 'string' || !code) return false;
    S.settings.bindings[action] = code;
    rebuildKeyMap();
    saveSettings();
    return true;
  }

  function applySettingsPatch(patch) {
    if (!patch || typeof patch !== 'object') return false;
    if (!S.settings) loadSettings();
    if (patch.difficulty != null) setDifficulty(patch.difficulty, { silent: true });
    for (const k of BOOL_SETTINGS) if (typeof patch[k] === 'boolean') S.settings[k] = patch[k];
    if (patch.bindings && typeof patch.bindings === 'object') {
      for (const [action, code] of Object.entries(patch.bindings)) {
        if (action in DEFAULT_BINDINGS && typeof code === 'string' && code) S.settings.bindings[action] = code;
      }
    }
    rebuildKeyMap();
    saveSettings();
    syncDifficultyUI();
    return true;
  }

  /* Consumo del contratto UI (index.html): eventi + fallback bottoni difficoltà. */
  function setupSettingsUI() {
    document.addEventListener('dogana:settings', (e) => applySettingsPatch(e.detail));
    document.addEventListener('click', (e) => {
      const btn = e.target && e.target.closest ? e.target.closest('.difficulty-btn[data-difficulty]') : null;
      if (!btn) return;
      const key = btn.dataset.difficulty;
      if (DIFFICULTIES[key] && key !== S.difficulty) setDifficulty(key);
    });
    syncDifficultyUI();
  }

  /* Controller: polling una volta per frame, edge detection come la tastiera. */
  const gpState = {
    left: false, right: false, up: false, down: false, shoot: false,
    jump: false, grenade: false, switch: false, pause: false
  };
  function pollGamepad() {
    if (!navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    let pad = null;
    for (let i = 0; i < pads.length; i++) {
      if (pads[i] && pads[i].connected) { pad = pads[i]; break; }
    }
    if (!pad) return;
    const ax = pad.axes || [], bt = pad.buttons || [];
    const press = (i) => !!(bt[i] && (bt[i].pressed || bt[i].value > .5));
    const dead = .3;
    const left = (ax[0] || 0) < -dead || press(14);
    const right = (ax[0] || 0) > dead || press(15);
    const up = (ax[1] || 0) < -dead || press(12);
    const down = (ax[1] || 0) > dead || press(13);
    const shoot = press(0);
    const jump = press(1);
    const grenade = press(2);
    const sw = press(3);
    const pause = press(9);
    if (S.mode === 'playing') {
      if (left !== gpState.left) { input.left = left; gpState.left = left; }
      if (right !== gpState.right) { input.right = right; gpState.right = right; }
      if (up !== gpState.up) { input.up = up; gpState.up = up; }
      if (down !== gpState.down) { input.down = down; gpState.down = down; }
      if (shoot !== gpState.shoot) { input.shoot = shoot; gpState.shoot = shoot; }
      if (jump && !gpState.jump) { input.jumpEdge = true; input.jump = true; }
      else if (!jump && gpState.jump) input.jump = false;
      gpState.jump = jump;
      if (grenade && !gpState.grenade) input.grenadeEdge = true;
      gpState.grenade = grenade;
      if (sw && !gpState.switch) input.switchEdge = true;
      gpState.switch = sw;
    } else {
      gpState.left = gpState.right = gpState.up = gpState.down = gpState.shoot = gpState.jump = gpState.grenade = gpState.switch = false;
    }
    if (pause && !gpState.pause) {
      if (S.mode === 'playing') openPause();
      else if (S.mode === 'paused') resumeGame();
    }
    gpState.pause = pause;
  }

  const PROP_META = {
    crate: { img: 'crate', w: 40, h: 36, hp: 22, destructible: true, label: 'CASSA DOGANALE' },
    barrel: { img: 'barrel', w: 30, h: 40, hp: 20, destructible: true, label: 'BARILE' },
    stall: { img: 'stall', w: 100, h: 78, hp: 38, destructible: true, label: 'BANCHETTO' },
    sign: { img: 'sign', w: 44, h: 55, destructible: false },
    bollard: { img: 'bollard', w: 20, h: 28, destructible: false },
    bench: { img: 'bench', w: 62, h: 34, destructible: false },
    desk: { img: 'desk', w: 76, h: 38, hp: 34, destructible: true, label: 'SCRIVANIA' },
    archive: { img: 'archive', w: 38, h: 72, hp: 26, destructible: true, label: 'ARCHIVIO' },
    plant: { img: 'plant', w: 28, h: 52, destructible: false },
    cooler: { img: 'cooler', w: 24, h: 48, destructible: false }
  };

  /* =========================================================
     STATO
     ========================================================= */
  const S = {
    mode: 'loading',
    time: 0,
    titleTime: 0,
    levelIndex: 0,
    character: 'adele',
    difficulty: 'normal',
    gameCompleted: false,
    disclaimerOpen: false,
    settings: null,
    barkCd: 8,
    saidStart: false,
    saidLow: false,
    saidBoss: false,
    saidCollega: false,
    level: null,
    levelStartScore: 0,
    player: null,
    camera: { x: 0, target: 0 },
    enemies: [],
    bullets: [],
    eBullets: [],
    grenades: [],
    pickups: [],
    props: [],
    pendingSpawns: [],
    particles: [],
    hazards: [],
    boss: null,
    bossActive: false,
    bossIntro: 0,
    bossBgBlend: 0,
    score: 0,
    highScore: 0,
    lives: 4,
    combo: 0,
    comboTimer: 0,
    comboBest: 0,
    shots: 0,
    kills: 0,
    shake: 0,
    hitstop: 0,
    flash: 0,
    levelTime: 0,
    levelIntro: 0,
    callout: null,
    quip: null,
    quipCooldown: 0,
    endTimer: 0,
    confetti: [],
    titleParticles: [],
    defeated: false,
    audioPaused: false,
    lastMusic: null,
    /* v2.0 — livelli bonus Pescara: giorni/scontrini, sezione auto, effetti */
    bonus: null,
    car: null,
    brillo: 0,
    caffeBoost: 0
  };

  const input = {
    left: false, right: false, up: false, down: false,
    shoot: false, jump: false, jumpEdge: false,
    grenadeEdge: false, switchEdge: false, pauseEdge: false
  };

  const UI = {
    title: $('screen-title'),
    select: $('screen-select'),
    levels: $('screen-levels'),
    briefing: $('screen-briefing'),
    clear: $('screen-levelclear'),
    gameover: $('screen-gameover'),
    victory: $('screen-victory'),
    how: $('how-modal'),
    disclaimer: $('disclaimer-modal'),
    pause: $('pause-modal'),
    loading: $('loading'),
    toast: $('toast'),
    live: $('aria-live')
  };
  let toastTimer = null;

  function setMode(mode) {
    S.mode = mode;
    const inGame = ['playing', 'paused', 'levelclear', 'gameover', 'victory'].includes(mode);
    document.body.classList.toggle('is-playing', inGame);
    document.body.classList.toggle('playing', mode === 'playing');
    document.body.classList.toggle('paused', mode === 'paused');
  }

  function hideScreens() {
    document.querySelectorAll('.screen.active').forEach(el => el.classList.remove('active'));
  }

  function showScreen(el) {
    hideScreens();
    if (el) el.classList.add('active');
  }

  function showToast(msg, duration = 2600) {
    if (!msg) return;
    UI.toast.textContent = msg;
    UI.toast.classList.add('show');
    UI.live.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => UI.toast.classList.remove('show'), duration);
  }

  function updateAudioButtons() {
    const audioOn = !SoundEngine.muted;
    const btn = $('btn-audio');
    btn.textContent = audioOn ? 'AUDIO ATTIVO' : 'AUDIO MUTO';
    btn.setAttribute('aria-pressed', audioOn ? 'true' : 'false');
    btn.setAttribute('aria-label', audioOn ? 'Disattiva audio' : 'Attiva audio');
    const modalAudio = $('btn-audio-modal');
    if (modalAudio) {
      modalAudio.querySelector('strong').textContent = audioOn ? 'ATTIVO' : 'MUTO';
      modalAudio.classList.toggle('off', !audioOn);
    }
    const modalVoice = $('btn-voice-modal');
    if (modalVoice) {
      modalVoice.querySelector('strong').textContent = SoundEngine.voiceOn ? 'ATTIVA' : 'MUTA';
      modalVoice.classList.toggle('off', !SoundEngine.voiceOn);
    }
  }

  function loadHighScore() {
    try {
      S.highScore = parseInt(localStorage.getItem('dogana_highscore') || '0', 10) || 0;
    } catch (e) { S.highScore = 0; }
    updateRecordLabels();
  }

  /* v2.3.1 — la selezione livello si sblocca solo dopo la vittoria finale.
     Il flag è locale al dispositivo, come il record. */
  function loadArchiveProgress() {
    try { S.gameCompleted = localStorage.getItem('dogana_rush_completed') === '1'; }
    catch (e) { S.gameCompleted = false; }
    updateArchiveButton();
  }

  function saveArchiveProgress() {
    S.gameCompleted = true;
    try { localStorage.setItem('dogana_rush_completed', '1'); } catch (e) {}
    updateArchiveButton();
  }

  function updateArchiveButton() {
    const btn = $('btn-levels');
    if (btn) btn.hidden = !S.gameCompleted;
  }

  function saveHighScore() {
    if (S.score > S.highScore) S.highScore = S.score;
    try { localStorage.setItem('dogana_highscore', String(S.highScore)); } catch (e) {}
    updateRecordLabels();
  }

  function formatScore(n) {
    return String(Math.max(0, Math.floor(n))).padStart(6, '0');
  }

  function updateRecordLabels() {
    const ids = ['title-record', 'gameover-record', 'victory-record'];
    ids.forEach(id => {
      const el = $(id);
      if (!el) return;
      el.textContent = id === 'title-record'
        ? 'RECORD ' + formatScore(S.highScore)
        : formatScore(S.highScore);
    });
  }

  function announce(title, sub, voiceKey, color = '#ffc84b', duration = 2.5) {
    S.callout = { title, sub, color, life: duration, maxLife: duration };
    // il callout è già disegnato sul canvas: niente sottotitolo DOM duplicato
    if (voiceKey) SoundEngine.say(voiceKey, null, { priority: 2, subtitle: false });
    if (sub) UI.live.textContent = title + '. ' + sub;
  }

  /* =========================================================
     AUDIO UI + SCHERMATE
     ========================================================= */
  function unlockAudio() {
    if (SoundEngine.unlocked && SoundEngine.ctx) {
      if (SoundEngine.ctx.state === 'suspended') SoundEngine.ctx.resume().catch(() => {});
      return;
    }
    SoundEngine.unlock();
    SoundEngine.applyMute();
    updateAudioButtons();
  }

  function setMusicForMode(mode) {
    if (SoundEngine.muted) return;
    if (mode === 'menu') SoundEngine.setScene('menu');
    else if (mode === 'title') SoundEngine.setScene('menu');
  }

  /* v2.0 — cambio traccia con fallback: se level-audio non ha ancora aggiunto la
     traccia nuova (setScene ignora i nomi sconosciuti) si tiene una traccia v1
     adatta al livello, invece di lasciare la musica della schermata precedente. */
  function setSceneSafe(name, fallback) {
    if (!SoundEngine.ctx) { SoundEngine.setScene(name); return; }
    const before = SoundEngine._track;
    SoundEngine.setScene(name);
    if (SoundEngine._track === before && name !== before && fallback && fallback !== before) {
      SoundEngine.setScene(fallback);
    }
  }

  const LEVEL_MUSIC_FALLBACK = {
    3: 'level3', 4: 'level3', 5: 'level2', 6: 'level2', 7: 'level3'
  };
  function bossMusicFallback(kind) {
    if (kind === 'mecha' || kind === 'ursula') return 'boss2';
    if (kind === 'direttore' || kind === 'cesare' || kind === 'ceo') return 'boss3';
    return 'boss1';
  }

  function showDisclaimer() {
    const params = new URLSearchParams(location.search);
    if (params.has('stage') || params.get('disclaimer') === '0') return;
    if (!UI.disclaimer) return;
    UI.disclaimer.hidden = false;
    S.disclaimerOpen = true;
    const btn = $('btn-disclaimer-ok');
    if (btn) setTimeout(() => btn.focus(), 120);
  }

  function acceptDisclaimer() {
    S.disclaimerOpen = false;
    if (UI.disclaimer) UI.disclaimer.hidden = true;
    unlockAudio();
    goTitle(false);
    SoundEngine.setScene('menu');
    const start = $('btn-start');
    if (start) setTimeout(() => start.focus(), 100);
  }

  function goTitle(withMusic = true) {
    closePause();
    closeHow(false);
    hideScreens();
    showScreen(UI.title);
    setMode('title');
    S.level = null;
    S.player = null;
    S.boss = null;
    S.titleTime = 0;
    unlockAudio();
    updateRecordLabels();
    updateArchiveButton();
    if (withMusic) SoundEngine.setScene('menu');
  }

  function goSelect() {
    unlockAudio();
    SoundEngine.setScene('menu');
    UI.toast.classList.remove('show');
    hideScreens();
    showScreen(UI.select);
    setMode('select');
    updateLoadout(S.character);
    S.titleTime = 0;
    SoundEngine.say('select', 'Seleziona il tuo funzionario.');
    setTimeout(() => $('btn-deploy').focus(), 80);
  }

  function goLevels() {
    if (!S.gameCompleted) return;
    closePause();
    closeHow(false);
    unlockAudio();
    hideScreens();
    showScreen(UI.levels);
    setMode('levels');
    S.level = null;
    S.player = null;
    S.boss = null;
    S.titleTime = 0;
    const who = $('levels-character');
    if (who) who.textContent = (S.character === 'rocco' ? 'ROCCO' : 'ADELE');
    SoundEngine.setScene('menu');
    setTimeout(() => {
      const first = document.querySelector('#screen-levels .level-card');
      if (first) first.focus();
    }, 80);
  }

  function startArchivedLevel(index) {
    const i = Number(index);
    if (!Number.isInteger(i) || i < 0 || i >= LEVELS.length) return;
    unlockAudio();
    S.score = 0;
    S.comboBest = 0;
    S.kills = 0;
    S.shots = 0;
    if (Art.useCharacter) Art.useCharacter(S.character);
    startLevel(i, { keepScore: false, resetLives: true });
  }

  function updateLoadout(char) {
    const label = document.querySelector('.loadout-label');
    const loadout = document.querySelector('.loadout');
    const gear = document.querySelectorAll('.gear-item');
    if (!label || gear.length < 3) return;
    if (char === 'rocco') {
      label.innerHTML = 'DOTAZIONE DA CAMPO <span>DI ROCCO</span>';
      if (loadout) loadout.setAttribute('aria-label', 'Dotazione di Rocco');
      gear[0].querySelector('strong').textContent = 'BULLONIERA';
      gear[0].querySelector('small').textContent = 'Viti e bulloni ad alta velocità';
      gear[1].querySelector('strong').textContent = 'TELECOMANDO';
      gear[1].querySelector('small').textContent = 'Lancio + cambio canale stordente';
      gear[2].querySelector('strong').textContent = 'CROCE ROSSA';
      gear[2].querySelector('small').textContent = 'Borsa medica, una volta per livello';
    } else {
      label.innerHTML = 'ARSENALE MAKE-UP <span>DI ADELE</span>';
      if (loadout) loadout.setAttribute('aria-label', 'Arsenale di Adele');
      gear[0].querySelector('strong').textContent = 'ROSSETTO';
      gear[0].querySelector('small').textContent = 'Pistola laser fucsia';
      gear[1].querySelector('strong').textContent = 'MASCARA';
      gear[1].querySelector('small').textContent = 'Gatling inchiostro nero';
      gear[2].querySelector('strong').textContent = 'CIPRIA';
      gear[2].querySelector('small').textContent = 'Granata accecante';
    }
  }

  function goBriefing() {
    hideScreens();
    showScreen(UI.briefing);
    setMode('briefing');
    SoundEngine.uiSelect();
    const c = CHARACTERS[S.character] || CHARACTERS.adele;
    const copy = document.querySelector('.briefing-copy');
    if (copy) {
      copy.innerHTML = S.character === 'rocco'
        ? '<p><strong>Ore 08:00. Molo San Nicola.</strong> Rocco è qui per due motivi: il pesce della mensa e la pratica che nessuno vuole firmare.</p><p>Ex Croce Rossa, assistente doganale, permaloso certificato. Ha una bulloniera e un telecomando. E pretende una regalia.</p>'
        : '<p><strong>Ore 08:00. Molo San Nicola.</strong> Il porto è bloccato da pretendenti molesti, utenti furiosi e un polpo con problemi di gestione delle code.</p><p>Adele, dall’Ufficio Protocollo, ha una sola direttiva: aprire un varco fino alla Basilica. A colpi di rossetto, se necessario.</p>';
    }
    const controls = document.querySelector('.briefing .controls-strip');
    if (controls) controls.textContent = S.character === 'rocco'
      ? 'A / D MUOVI · Z BULLONIERA · X SALTA · C TELECOMANDO'
      : 'A / D MUOVI · Z SPARA · X SALTA · C CIPRIA';
    SoundEngine.say(S.character === 'rocco' ? 'rocco' : 'briefing',
      S.character === 'rocco'
        ? 'Rocco. Assistente doganale, ex Croce Rossa. E ho una lista di regalie.'
        : 'Missione uno. Porto franco. Adele, in azione.',
      { force: true, priority: 3 });
  }

  function showHow() {
    UI.how.hidden = false;
    $('btn-how-close').focus();
  }
  function closeHow(restoreFocus = true) {
    UI.how.hidden = true;
    if (restoreFocus && S.mode === 'title') $('btn-how').focus();
  }

  function openPause() {
    if (S.mode !== 'playing') return;
    setMode('paused');
    clearInput();
    UI.pause.hidden = false;
    updateAudioButtons();
    $('btn-resume').focus();
    if (SoundEngine.ctx && SoundEngine.ctx.state === 'running') SoundEngine.ctx.suspend();
  }

  function closePause() {
    UI.pause.hidden = true;
    if (S.mode === 'paused') setMode('playing');
    if (SoundEngine.ctx && SoundEngine.ctx.state === 'suspended') SoundEngine.ctx.resume();
  }

  function resumeGame() {
    UI.pause.hidden = true;
    setMode('playing');
    if (SoundEngine.ctx && SoundEngine.ctx.state === 'suspended') SoundEngine.ctx.resume();
    if (document.activeElement && typeof document.activeElement.blur === 'function') document.activeElement.blur();
    clearInput();
  }

  /* Tasto indietro Android: true = evento consumato. */
  function handleBack() {
    if (!UI.how.hidden) { closeHow(false); return true; }
    if (!UI.pause.hidden || S.mode === 'paused') {
      UI.pause.hidden = true;
      goTitle();
      return true;
    }
    if (S.mode === 'playing') { openPause(); return true; }
    if (S.mode === 'select') { goTitle(); return true; }
    if (S.mode === 'briefing') { goSelect(); return true; }
    if (S.mode === 'levelclear' || S.mode === 'gameover' || S.mode === 'victory') { goTitle(); return true; }
    return false;
  }

  function clearInput() {
    Object.keys(input).forEach(k => input[k] = false);
  }

  /* =========================================================
     SETUP UI EVENTS
     ========================================================= */
  function setupUI() {
    UI.title.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      unlockAudio();
      SoundEngine.uiSelect();
      goSelect();
    });
    $('btn-start').addEventListener('click', () => {
      unlockAudio();
      SoundEngine.uiSelect();
      goSelect();
    });
    $('btn-levels').addEventListener('click', () => {
      unlockAudio();
      SoundEngine.uiSelect();
      goLevels();
    });
    $('btn-levels-back').addEventListener('click', () => { SoundEngine.uiMove(); goTitle(); });
    document.querySelectorAll('#screen-levels .level-card').forEach(card => {
      card.addEventListener('click', () => {
        unlockAudio();
        SoundEngine.uiSelect();
        startArchivedLevel(card.dataset.level);
      });
    });
    $('btn-disclaimer-ok').addEventListener('click', () => { SoundEngine.uiSelect(); acceptDisclaimer(); });
    $('btn-victory-levels').addEventListener('click', () => { SoundEngine.uiSelect(); goLevels(); });
    $('btn-how').addEventListener('click', () => { unlockAudio(); SoundEngine.uiMove(); showHow(); });
    $('btn-how-close').addEventListener('click', () => { SoundEngine.uiMove(); closeHow(); });
    $('btn-how-ok').addEventListener('click', () => { SoundEngine.uiSelect(); closeHow(); });
    $('btn-back-title').addEventListener('click', () => { SoundEngine.uiMove(); goTitle(); });
    $('btn-deploy').addEventListener('click', () => {
      unlockAudio();
      $('btn-deploy').blur();
      goBriefing();
    });
    $('btn-briefing').addEventListener('click', () => {
      unlockAudio();
      if (S.mode !== 'briefing') return;
      SoundEngine.uiSelect();
      startNewRun();
    });
    $('btn-briefing-back').addEventListener('click', () => {
      SoundEngine.uiMove();
      if (S.mode === 'briefing') goSelect();
    });
    document.querySelectorAll('.fighter-card').forEach(card => {
      card.addEventListener('click', () => {
        unlockAudio();
        const char = card.dataset.char;
        if (CHARACTERS[char]) {
          S.character = char;
          SoundEngine.uiSelect();
          document.querySelectorAll('.fighter-card').forEach(c => c.classList.toggle('is-selected', c === card));
          if (Art.useCharacter) Art.useCharacter(char);
          updateLoadout(char);
          const c = CHARACTERS[char];
          showToast(c.fullName.toUpperCase() + ' · ' + c.role.toUpperCase(), 1800);
          SoundEngine.say(char, char === 'adele'
            ? 'Adele. Ufficio protocollo. Grinta fuori scala.'
            : 'Rocco. Assistente doganale, ex Croce Rossa. E ho una lista di regalie.',
            { force: true });
        } else {
          SoundEngine.locked();
          const name = card.querySelector('.fighter-name').textContent;
          showToast(name + ': FASCICOLO RISERVATO. ARRUOLAMENTO IN CORSO.');
          SoundEngine.say('locked', 'Fascicolo riservato. Personaggio in arrivo.', { force: true });
        }
      });
    });
    $('btn-next-level').addEventListener('click', () => {
      SoundEngine.uiSelect();
      startLevel(S.nextLevel == null ? 1 : S.nextLevel, { keepScore: true });
    });
    $('btn-retry').addEventListener('click', () => {
      SoundEngine.uiSelect();
      startLevel(S.levelIndex, { keepScore: false, resetLives: true });
    });
    $('btn-gameover-menu').addEventListener('click', () => { SoundEngine.uiSelect(); goTitle(); });
    $('btn-replay').addEventListener('click', () => { SoundEngine.uiSelect(); stateResetToMenuSelect(); });
    $('btn-victory-menu').addEventListener('click', () => { SoundEngine.uiSelect(); goTitle(); });
    $('btn-audio').addEventListener('click', () => {
      unlockAudio();
      SoundEngine.toggleMute();
      updateAudioButtons();
      if (!SoundEngine.muted) {
        if (S.mode === 'playing') SoundEngine.setScene(S.bossActive ? bossMusicKey() : S.level.music);
        else if (S.mode === 'title' || S.mode === 'select') SoundEngine.setScene('menu');
      }
    });
    $('btn-fullscreen').addEventListener('click', toggleFullscreen);
    $('btn-audio-modal').addEventListener('click', () => {
      SoundEngine.toggleMute();
      updateAudioButtons();
      if (!SoundEngine.muted && S.level) SoundEngine.setScene(S.bossActive ? bossMusicKey() : S.level.music);
    });
    $('btn-voice-modal').addEventListener('click', () => {
      SoundEngine.toggleVoice();
      updateAudioButtons();
      if (SoundEngine.voiceOn) SoundEngine.say('voiceon', 'Voce annunciatore attiva.', { force: true });
    });
    $('btn-resume').addEventListener('click', () => { SoundEngine.uiSelect(); resumeGame(); });
    $('btn-restart').addEventListener('click', () => {
      SoundEngine.uiSelect();
      UI.pause.hidden = true;
      if (SoundEngine.ctx && SoundEngine.ctx.state === 'suspended') SoundEngine.ctx.resume();
      startLevel(S.levelIndex, { keepScore: false, resetLives: true });
    });
    $('btn-pause-menu').addEventListener('click', () => {
      SoundEngine.uiSelect();
      UI.pause.hidden = true;
      if (SoundEngine.ctx && SoundEngine.ctx.state === 'suspended') SoundEngine.ctx.resume();
      goTitle();
    });
    $('touch-pause').addEventListener('click', openPause);
    $('touch-pause').addEventListener('pointerdown', (e) => e.preventDefault());
    // Touchbuttons
    document.querySelectorAll('#touch-controls .tbtn[data-key]').forEach(btn => {
      const key = btn.dataset.key;
      const down = (e) => {
        e.preventDefault();
        unlockAudio();
        btn.classList.add('pressed');
        if (key === 'jump') { input.jump = true; input.jumpEdge = true; }
        else if (key === 'grenade') input.grenadeEdge = true;
        else if (key === 'switch') input.switchEdge = true;
        else if (key === 'shoot') input.shoot = true;
        else input[key] = true;
        if (btn.setPointerCapture && e.pointerId !== undefined) {
          try { btn.setPointerCapture(e.pointerId); } catch (err) {}
        }
      };
      const up = (e) => {
        e.preventDefault();
        btn.classList.remove('pressed');
        if (key === 'jump') input.jump = false;
        else if (key === 'shoot') input.shoot = false;
        else if (key !== 'grenade' && key !== 'switch') input[key] = false;
      };
      btn.addEventListener('pointerdown', down);
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('pointerleave', (e) => { if (e.buttons === 0) up(e); });
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });
    canvas.addEventListener('pointerdown', () => { if (S.mode === 'playing') unlockAudio(); });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('blur', () => {
      clearInput();
      if (S.settings && S.settings.pauseOnBlur && S.mode === 'playing') openPause();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearInput();
        if (S.settings && S.settings.pauseOnBlur && S.mode === 'playing') openPause();
      }
    });
    window.addEventListener('resize', updateViewportClass);
    updateViewportClass();
  }

  function stateResetToMenuSelect() {
    S.lives = diff().lives;
    S.score = 0;
    S.combo = 0;
    S.kills = 0;
    S.shots = 0;
    S.comboBest = 0;
    S.level = null;
    goSelect();
  }

  function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        const el = document.getElementById('stage');
        (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
      } else {
        (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
      }
    } catch (e) { /* ignora */ }
  }

  function updateViewportClass() {
    const touch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    document.body.classList.toggle('touch-mode', !!touch);
  }

  /* =========================================================
     INPUT GLOBALE
     ========================================================= */
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    KeyZ: 'shoot', KeyJ: 'shoot',
    KeyX: 'jump', KeyK: 'jump', Space: 'jump',
    KeyC: 'grenade', KeyL: 'grenade',
    KeyH: 'switch',
    KeyP: 'pause', Escape: 'pause'
  };

  function setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      const targetButton = e.target && typeof e.target.closest === 'function'
        ? e.target.closest('button, a, [role="button"]')
        : null;
      const liveControl = targetButton && targetButton.closest('.screen.active, .modal-layer:not([hidden]), #utility-bar');
      // Lascia che Invio e Spazio attivino il controllo visibile che ha il focus.
      if (liveControl && (code === 'Enter' || code === 'Space')) return;
      // Il disclaimer iniziale assorbe i tasti finché non viene accettato.
      if (!UI.disclaimer.hidden) {
        if (code === 'Escape') e.preventDefault();
        return;
      }
      // Le finestre di servizio assorbono i tasti.
      if (!UI.how.hidden) {
        if (code === 'Escape' || code === 'Enter') { e.preventDefault(); closeHow(); }
        return;
      }
      if (!UI.pause.hidden) {
        if (code === 'Escape' || code === 'KeyP') { e.preventDefault(); resumeGame(); }
        return;
      }
      const action = (KEYMAP_ACTIVE || KEYMAP)[code];
      if (action) {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(code)) e.preventDefault();
        if (action === 'pause') {
          if (e.repeat) return;
          if (S.mode === 'playing') openPause();
          else if (S.mode === 'paused') resumeGame();
          return;
        }
        if (S.mode !== 'playing') return;
        if (action === 'jump') { if (!e.repeat) { input.jumpEdge = true; input.jump = true; } }
        else if (action === 'grenade') { if (!e.repeat) input.grenadeEdge = true; }
        else if (action === 'switch') { if (!e.repeat) input.switchEdge = true; }
        else input[action] = true;
        if (S.mode === 'playing') unlockAudio();
        return;
      }
      if (code === 'Enter') {
        if (S.mode === 'title' && UI.how.hidden) { e.preventDefault(); unlockAudio(); goSelect(); }
        else if (S.mode === 'select') { e.preventDefault(); if (UI.how.hidden) goBriefing(); }
        else if (S.mode === 'briefing') { e.preventDefault(); startNewRun(); }
        else if (S.mode === 'paused') { e.preventDefault(); resumeGame(); }
        else if (S.mode === 'levelclear') { e.preventDefault(); startLevel(S.nextLevel == null ? 1 : S.nextLevel, { keepScore: true }); }
        else if (S.mode === 'gameover') { e.preventDefault(); $('btn-retry').click(); }
        else if (S.mode === 'victory') { e.preventDefault(); $('btn-replay').click(); }
      }
      if (code === 'Escape') {
        if (!UI.how.hidden) closeHow();
        else if (!UI.pause.hidden) resumeGame();
        else if (S.mode === 'select') goTitle();
        else if (S.mode === 'levels') goTitle();
        else if (S.mode === 'briefing') goSelect();
        else if (S.mode === 'playing') openPause();
      }
      if (code === 'KeyF' && S.mode !== 'playing') toggleFullscreen();
    });
    window.addEventListener('keyup', (e) => {
      const action = (KEYMAP_ACTIVE || KEYMAP)[e.code];
      if (!action) return;
      if (action === 'jump') input.jump = false;
      else if (action === 'pause') return;
      else input[action] = false;
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearInput();
    });
  }

  /* =========================================================
     AVVIO + COSTRUZIONE ASSET
     ========================================================= */
  function setLoadingText(msg, pct) {
    const copy = $('loading-copy');
    if (copy) copy.textContent = msg;
    const bar = document.querySelector('.loading-bar i');
    if (bar) {
      bar.style.animation = 'none';
      bar.style.width = pct + '%';
    }
  }

  const wait = (ms) => new Promise(res => setTimeout(res, ms));

  async function boot() {
    try {
      /* v2.5.0 — kill switch: attende SOLO il controllo d'avvio (max 2s).
         Se il telecomando è disabilitato o c'è un blocco salvato, il gioco
         non viene inizializzato. */
      if (window.DOGANA_KILLSWITCH && window.DOGANA_KILLSWITCH.ready) {
        const gate = await window.DOGANA_KILLSWITCH.ready;
        if (gate && gate.blocked) {
          setLoadingText('SERVIZIO SOSPESO', 100);
          return;
        }
      }
      SoundEngine.init();
      loadHighScore();
      loadSettings();
      setupUI();
      setupKeyboard();
      setupSettingsUI();
      updateAudioButtons();
      setLoadingText('CARICAMENTO FONT ARCADE...', 4);
      try {
        await Promise.all([
          document.fonts.load('12px "Press Start 2P"'),
          document.fonts.load('16px "VT323"')
        ]);
        await document.fonts.ready;
      } catch (e) { /* fallback ai font di sistema */ }
      setLoadingText('APERTURA PRATICHE...', 10);
      await wait(80);

      if (typeof Art.buildBootArt === 'function') {
        /* v2.0 (task-17) — boot LAZY: art.js costruisce solo l'essenziale per
           titolo/UI/giocatori; i fondali e i temi dei livelli vengono costruiti
           sincronicamente da Art.ensureLevelArt(level) al primo ingresso
           (startLevel). Riduce canvas/CPU all'avvio (boot Android < 4s). */
        setLoadingText('CUCITURA DIVISA — ADELE...', 30);
        await wait(35);
        Art.buildBootArt();
        setLoadingText('PRATICHE IN ARCHIVIO...', 74);
        await wait(20);
        setLoadingText('APERTURA DEI FONDALI...', 88);
        await wait(35);
      } else {
        // fallback compatibilità: art.js older senza API lazy → boot eager come prima
        const steps = [
          ['CUCITURA DIVISA — ADELE...', 18, () => Art.buildPlayerFrames()],
          ['RITRATTO SEGNALETICO...', 27, () => { /* ritratto key art precaricato via <img> */ }],
          ['ARRUOLAMENTO NEMICI...', 41, () => Art.buildEnemyFrames()],
          ['CATTURA POLPO MUTANTE...', 52, () => Art.buildOctoFrames()],
          ['ATTIVAZIONE MECHA SAN NICOLA...', 65, () => { Art.buildMechaFrames(); Art.buildHaloFrames(); }],
          ['TIMBRATURA CASSE E PICK-UP...', 74, () => { Art.buildProps(); Art.buildPickups(); Art.buildIcons(); }],
          ['COSTRUZIONE DI BARI...', 88, () => Art.buildBackgrounds()],
          ['ULTIMO CONTROLLO DOGANALE...', 96, () => {}]
        ];
        for (const [msg, pct, fn] of steps) {
          setLoadingText(msg, pct);
          await wait(35);
          fn();
        }
      }
      setLoadingText('SPRITE GOOGLE IN ARRIVO...', 96);
      try { await Art.loadGeneratedSprites(); }
      catch (e) { console.warn('Sprite Google non disponibili, uso il fallback procedurale.', e); }
      setLoadingText('PRATICHE PRONTE. INSERISCI GETTONE.', 100);
      await wait(320);
      UI.loading.classList.add('done');
      setTimeout(() => { UI.loading.style.display = 'none'; }, 600);
      setMode('title');
      goTitle(false);
      loadArchiveProgress();
      showDisclaimer();
      handleDebugQuery();
      requestAnimationFrame(loop);
    } catch (err) {
      console.error(err);
      setLoadingText('ERRORE DI SISTEMA: RICARICA LA PAGINA', 100);
      const copy = $('loading-copy');
      if (copy) copy.textContent = 'ERRORE DI CARICAMENTO — APRI CON CHROME / EDGE AGGIORNATO';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* =========================================================
     AVVIO PARTITA / LIVELLI
     ========================================================= */
  function startNewRun() {
    unlockAudio();
    S.score = 0;
    S.lives = diff().lives;
    S.comboBest = 0;
    S.kills = 0;
    S.shots = 0;
    if (Art.useCharacter) Art.useCharacter(S.character);
    startLevel(0);
  }

  /* v2.0 — annunci vocali d'inizio livello. Le chiavi level4..level8 non sono
     nel manifest MP3: SoundEngine.say ricade sul TTS italiano con questo testo. */
  const LEVEL_START_VOICES = [
    {
      key: 'level1', roccoKey: 'level1_rocco',
      text: 'Livello uno. Porto e Dogana di Bari. Apri la pratica!',
      roccoText: 'Livello uno. Porto e Dogana di Bari. Rocco apre la pratica!'
    },
    { key: 'level2', text: 'Livello due. Bari Vecchia. Attenzione ai vicoli!' },
    { key: 'level3', text: 'Livello tre. Direzione Territoriale, Via Amendola. La pratica deve salire al piano alto.' },
    { key: 'level4', text: 'Livello quattro. Direzione Centrale, Roma, Piazza Mastai. Il patrizio attende il papiro.' },
    { key: 'level5', text: 'Livello cinque. Dogana Europea, Bruxelles. La Commissione esamina la pratica.' },
    { key: 'level6', text: 'Livello sei, bonus. Formazione a Pescara: cinque giorni alla fine, raccogli gli scontrini!' },
    { key: 'level7', text: 'Livello sette, bonus. Pescara by Night. Scontrini, spritz e una Fiat Tipo tre volumi.' },
    { key: 'level8', text: 'Livello otto. Incubo SOGEI. Server room, bug e l’ex CEO. Ultima pratica.' }
  ];

  /* v2.0 — testi delle schermate di clear (dinamici) e prossimo livello.
     v1: gli indici 0/1 mantengono testi e bottoni originali (test di accettazione). */
  const LEVEL_CLEAR_INFO = [
    {
      title: 'MOLO LIBERATO!',
      copy: {
        adele: 'Il polpo ha ritirato la pratica. Il porto respira. Ma Bari Vecchia è già in rivolta.',
        rocco: 'Il polpo ha ritirato la pratica. Il porto respira. Rocco però non ha ancora visto il pesce promesso.'
      },
      button: 'VAI A BARI VECCHIA', micro: 'VERBALE N. 01',
      voiceKey: 'clear1', voice: 'Molo liberato! Missione uno completata!'
    },
    {
      title: 'BASILICA LIBERATA!',
      copy: {
        adele: 'Il Mecha è in tilt. Ma la pratica ora sale al piano alto: Direzione Territoriale, Via Amendola.',
        rocco: 'Il Mecha è in tilt. Ora la pratica sale al piano alto: Direzione Territoriale, Via Amendola. Rocco ha già preparato il badge.'
      },
      button: 'SALI IN DIREZIONE', micro: 'VERBALE N. 02',
      voiceKey: 'level3', voice: 'Livello tre. Direzione Territoriale, Via Amendola. La pratica deve salire al piano alto.'
    },
    {
      title: 'DIREZIONE CONQUISTATA!',
      copy: {
        adele: 'Il Mega Direttore è in pensione anticipata. La pratica sale a Roma: Direzione Centrale, Piazza Mastai. Adele ha già scelto il filtro per la foto.',
        rocco: 'Il Mega Direttore è in pensione anticipata. La pratica sale a Roma: Direzione Centrale, Piazza Mastai. Rocco guida, Adele fa i reel.'
      },
      button: 'VAI A ROMA', micro: 'VERBALE N. 03',
      voiceKey: 'clear4', voice: 'Direzione Territoriale liberata! La pratica vola a Roma, Direzione Centrale, Piazza Mastai.'
    },
    {
      title: 'PIAZZA MASTAI LIBERATA!',
      copy: {
        adele: 'Giulio Cesare è sfiduciato: il papiro è archiviato. Ora la pratica passa alla Dogana Europea, Bruxelles. Adele cerca un filtro UE.',
        rocco: 'Giulio Cesare è sfiduciato: il papiro è archiviato. Ora si vola alla Dogana Europea, Bruxelles. Rocco prepara i panini per il viaggio.'
      },
      button: 'VOLA A BRUXELLES', micro: 'VERBALE N. 04',
      voiceKey: 'clearRoma', voice: 'Piazza Mastai liberata! Il patrizio è sfiduciato. La pratica vola alla Dogana Europea, Bruxelles.'
    },
    {
      title: 'COMMISSIONE CONVINTA!',
      copy: {
        adele: 'Ursula ha ritirato la procedura: il regolamento è a posto. Destinazione Pescara: formazione obbligatoria. Adele porta il costume.',
        rocco: 'Ursula ha ritirato la procedura. Destinazione Pescara: formazione obbligatoria. Rocco porta l’ombrellone e la Bulloniera.'
      },
      button: 'VAI A PESCARA', micro: 'VERBALE N. 05',
      voiceKey: 'clearEuropa', voice: 'Commissione convinta! Bruxelles è libera. La pratica va a Pescara per la formazione.'
    },
    {
      title: 'FORMAZIONE COMPLETATA!',
      copy: {
        adele: 'Cinque giorni, venti scontrini, un solo rossetto. La formazione è chiusa: Pescara by Night aspetta. Adele ha già la storia pronta.',
        rocco: 'Cinque giorni, venti scontrini, un solo panino. La formazione è chiusa: Pescara by Night aspetta. Rocco ha fame.'
      },
      button: 'PESCARA BY NIGHT', micro: 'VERBALE N. 06',
      voiceKey: 'clearPescara', voice: 'Formazione completata! Scontrini archiviati. Ora Pescara by Night: la serata è appena iniziata.'
    },
    {
      title: 'SERATA PERFETTA!',
      copy: {
        adele: 'Spritz, scontrini e Fiat Tipo tre volumi. La serata è finita, ma c’è un’ultima pratica: l’Incubo SOGEI. Adele è pronta.',
        rocco: 'Spritz, scontrini e Fiat Tipo tre volumi. La serata è finita, ma c’è un’ultima pratica: l’Incubo SOGEI. Rocco non ha bevuto.'
      },
      button: 'ULTIMA PRATICA: SOGEI', micro: 'VERBALE N. 07',
      voiceKey: 'clearSerata', voice: 'Serata perfetta! Pescara è salva. Ultima pratica: l’Incubo SOGEI. Che il timbro sia con noi.'
    }
  ];

  /* v2.0 — testi dinamici dei clear bonus (scontrini/obiettivo). */
  function bonusClearCopy(bonus, baseCopy) {
    if (!bonus) return baseCopy;
    const got = bonus.receipts || 0;
    const goal = bonus.receiptGoal || 0;
    let text;
    if (bonus.kind === 'formazione') {
      text = got >= goal
        ? 'Obiettivo raggiunto: ' + got + ' scontrini su ' + goal + '. La formazione è archiviata e il rimborso pure.'
        : 'Scontrini ' + got + '/' + goal + ': il rimborso è a rischio, ma la pratica della formazione è chiusa comunque.';
    } else {
      text = got >= goal
        ? 'Serata da record: ' + got + ' scontrini su ' + goal + '. Il rimborso cena è approvato, la Fiat Tipo pure.'
        : 'Scontrini ' + got + '/' + goal + ': serata chiusa, rimborso parziale. La Fiat Tipo però è tornata intera.';
    }
    return baseCopy ? text + ' ' + baseCopy : text;
  }

  function startLevel(index, opts = {}) {
    const level = LEVELS[index];
    if (!level) return;
    /* v2.0 (task-17) — arte LAZY: assicura gli asset del livello/tema in modo
       SINCRONO prima di creare player e renderizzare. Se art.js non espone le
       API lazy si continua con l'arte già costruita al boot (fallback). */
    try {
      if (typeof Art.ensureLevelArt === 'function') Art.ensureLevelArt(level);
      else if (typeof Art.ensureTheme === 'function') Art.ensureTheme(level.customBg || null);
    } catch (e) {
      console.warn('Arte del livello non disponibile, uso i fallback procedurali.', e);
    }
    S.spawnEpoch = (S.spawnEpoch || 0) + 1;
    if (opts.resetScore) S.score = 0;
    if (opts.resetLives) S.lives = diff().lives;
    closePause();
    closeHow(false);
    UI.pause.hidden = true;
    UI.how.hidden = true;
    UI.toast.classList.remove('show');
    hideScreens();
    setMode('playing');
    if (document.activeElement && typeof document.activeElement.blur === 'function') document.activeElement.blur();
    clearInput();

    S.levelIndex = index;
    S.level = level;
    S.levelStartScore = S.score;
    S.levelTime = 0;
    S.levelIntro = 3.15;
    S.bossActive = false;
    S.boss = null;
    S.bossIntro = 0;
    S.bossBgBlend = 0;
    S.defeated = false;
    S.ending = false;
    /* v2.0 — stato dei livelli bonus (giorni/scontrini/sezione auto) */
    S.bonus = level.bonus ? {
      kind: level.bonus.kind || 'formazione',
      daysTotal: level.bonus.daysTotal || 5,
      daysLeft: level.bonus.daysTotal || 5,
      receiptGoal: level.bonus.receiptGoal || 10,
      receipts: 0,
      carSection: !!level.bonus.carSection,
      ending: false
    } : null;
    S.car = null;
    S.brillo = 0;
    S.caffeBoost = 0;
    S.combo = 0;
    S.comboTimer = 0;
    S.shake = 0;
    S.hitstop = 0;
    S.flash = 0;
    S.callout = null;
    S.quip = null;
    S.quipCooldown = 0;
    S.barkCd = 4.2;
    S.saidStart = false;
    S.saidLow = false;
    S.saidBoss = false;
    S.saidCollega = false;
    S.camera.x = 0;
    S.enemies = [];
    S.bullets = [];
    S.eBullets = [];
    S.grenades = [];
    S.pickups = [];
    S.pendingSpawns = [];
    S.particles = [];
    S.hazards = [];
    S.confetti = [];
    S.waves = level.waves.map(w => ({ ...w, spawned: false }));
    S.props = level.props.map(p => makeProp(p));
    S.pickups = level.pickups.map(p => makePickup(p.type, p.x, GROUND - 27, false));
    S.player = makePlayer(74);
    S.camera.x = clamp(S.player.x - 250, 0, level.width - W);
    S.player.invuln = 1.1;

    updateRecordLabels();
    setSceneSafe(level.music, LEVEL_MUSIC_FALLBACK[index] || 'level1');
    const rocco = S.character === 'rocco';
    /* v2.0 — annunci di inizio livello (le chiavi nuove non sono nel manifest
       voci: SoundEngine.say usa il fallback TTS italiano con il testo qui sotto). */
    const startVoice = LEVEL_START_VOICES[index];
    if (startVoice) {
      const key = (index === 0 && rocco) ? startVoice.roccoKey : startVoice.key;
      const text = (index === 0 && rocco) ? startVoice.roccoText : startVoice.text;
      SoundEngine.say(key, text, { force: true, priority: 3 });
    }
    showStageIntro();
    S.particles.push({
      type: 'ring', x: S.player.x, y: GROUND - 20, vx: 0, vy: 0,
      life: .5, maxLife: .5, size: 12, color: '#ffc84b', gravity: 0, world: true
    });
  }

  function makePlayer(x) {
    const c = CHARACTERS[S.character] || CHARACTERS.adele;
    return {
      x, y: GROUND, vx: 0, vy: 0,
      w: 19 * PLAYER_SCALE, h: 53 * PLAYER_SCALE, facing: 1,
      character: S.character, config: c,
      health: c.hp, maxHealth: c.hp,
      onGround: true, crouching: false, platform: null,
      aimUp: false, aimDown: false,
      fireCd: 0, grenadeCd: 0, recoil: 0, muzzle: 0,
      invuln: 0, dead: false, respawnTimer: 0,
      animT: 0, weapon: c.weapon,
      mascaraAmmo: 0, mascaraTime: 0,
      weaponAmmo: 0, weaponTime: 0,
      grenades: c.grenades, weaponSwitchFlash: 0,
      anger: 0, angerTime: 0, regalia: 0, redCrossUsed: false,
      dropTimer: 0, hitFlash: 0
    };
  }

  function makeProp(data) {
    const meta = PROP_META[data.type];
    return {
      type: data.type, x: data.x, y: GROUND,
      w: meta.w, h: meta.h,
      hp: meta.hp || 0, maxHp: meta.hp || 0,
      destructible: meta.destructible, loot: data.loot || null,
      flash: 0, alive: true, shake: 0
    };
  }

  function pickupForCharacter(type) {
    if (S.character !== 'rocco') return type;
    if (type === 'grenade') return 'telecomando';
    if (type === 'mascara') return 'pensierino';
    if (type === 'health') return 'panino';
    // Rocco non usa le armi da ufficio: le converte in telecomandi.
    if (type === 'timbro' || type === 'scontrinoGun' || type === 'spritzGun') return 'telecomando';
    return type;
  }

  /* v2.3.7 — loot casuale per livello. I pickup fissi restano garanzia di
     progressione; i drop dei nemici usano questa tabella. */
  const LOOT_TABLES = [
    { common: ['health', 'grenade', 'caffe'], weapons: ['mascara'] },
    { common: ['health', 'grenade', 'caffe'], weapons: ['mascara'] },
    { common: ['health', 'grenade', 'caffe'], weapons: ['mascara'] },
    { common: ['health', 'grenade', 'caffe'], weapons: ['timbro'] },
    { common: ['health', 'grenade', 'caffe', 'spritz'], weapons: ['timbro'] },
    { common: ['health', 'grenade', 'spritz', 'caffe'], weapons: ['scontrinoGun'] },
    { common: ['health', 'grenade', 'spritz', 'caffe'], weapons: ['spritzGun'] },
    { common: ['health', 'grenade', 'caffe'], weapons: ['scontrinoGun'] }
  ];

  function rollEnemyLoot() {
    if (S.bonus && Math.random() < .22) return 'scontrino';
    const table = LOOT_TABLES[S.levelIndex] || LOOT_TABLES[0];
    const r = Math.random();
    if (r < .035) return choose(table.weapons);
    if (r < .16) return choose(table.common);
    return null;
  }

  function makePickup(type, x, y, dropped) {
    const mapped = pickupForCharacter(type);
    return {
      type: mapped, sourceType: type, x, baseY: y, y: dropped ? y - 22 : y,
      variant: mapped === 'pensierino' ? choose(['pesce', 'mela', 'giocattolo']) : null,
      vy: dropped ? -130 : 0,
      phase: Math.random() * TAU,
      life: 0, alive: true, landed: false
    };
  }

  function showStageIntro() {
    UI.live.textContent = S.level.code + '. ' + S.level.title + '. ' + S.level.introLine;
    S.levelIntro = 3.15;
  }

  /* =========================================================
     PARTICELLE / EFFETTI
     ========================================================= */
  function addParticle(p) {
    if (S.particles.length > 620) S.particles.shift();
    p.life = p.life || .5;
    p.maxLife = p.maxLife || p.life;
    p.vx = p.vx || 0;
    p.vy = p.vy || 0;
    p.gravity = p.gravity || 0;
    p.rot = p.rot || 0;
    p.spin = p.spin || 0;
    p.size = p.size || 3;
    p.world = p.world !== false;
    S.particles.push(p);
  }

  function sparkBurst(x, y, count, color, speed = 150) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU), sp = rand(speed * .35, speed);
      addParticle({
        type: 'spark', x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
        life: rand(.18, .46), size: rand(1.5, 4),
        color: color || choose(['#fff3a6', '#ffc84b', '#ff90b8', '#fff8e7']),
        gravity: 250
      });
    }
  }

  function smokePuff(x, y, color = '#ffbfd8', size = 10) {
    addParticle({
      type: 'smoke', x, y,
      vx: rand(-18, 18), vy: rand(-42, -12),
      life: rand(.4, .9), maxLife: .9, size: rand(size * .7, size * 1.4),
      color, gravity: -8, alpha: .8
    });
  }

  function comicWord(x, y, forced) {
    const words = ['BOOM!', 'SBAM!', 'CIAK!', 'BAM!', 'POW!', 'SMACK!', 'TIMBRO!'];
    addParticle({
      type: 'text', x: x + rand(-8, 8), y: y - 16,
      vx: rand(-12, 12), vy: -36, gravity: 34,
      life: .9, maxLife: .9, size: rand(8, 11),
      color: choose(['#ffc84b', '#ff90b8', '#fff8e7']),
      text: forced || choose(words), rot: rand(-.15, .15), spin: 0
    });
  }

  function scorePopup(x, y, amount, color = '#fff3a6') {
    addParticle({
      type: 'text', x, y: y - 8,
      vx: rand(-8, 8), vy: -34, gravity: 13,
      life: .85, maxLife: .85, size: 6,
      color, text: '+' + amount, rot: 0, shadow: true
    });
  }

  function explodeAt(x, y, size = 28, big = false) {
    S.shake = Math.max(S.shake, big ? 10 : Math.min(6, size * .12));
    S.hitstop = Math.max(S.hitstop, big ? .08 : .025);
    addParticle({
      type: 'boom', x, y, vx: 0, vy: 0,
      life: big ? .42 : .3, maxLife: big ? .42 : .3,
      size: sScale(size), img: big ? Art.explosionBig : (size > 32 ? Art.explosionPink : Art.explosion),
      rot: rand(0, TAU), spin: rand(-2, 2), world: true
    });
    for (let i = 0; i < (big ? 8 : 4); i++) smokePuff(x + rand(-size * .4, size * .4), y + rand(-size * .3, size * .3), choose(['#ffbfd8', '#ff90b8', '#fff3a6', '#4d2c4e']), size * .36);
    sparkBurst(x, y, big ? 24 : 10, choose(['#ffc84b', '#ff845d', '#fff3a6']), big ? 250 : 160);
    if (Math.random() < (big ? 1 : .32)) comicWord(x, y, big ? choose(['BADABOOM!', 'BOOM!']) : null);
    SoundEngine.explosion(big);
    if (big) triggerScreenFlash();
  }

  function sScale(size) { return clamp(size, 20, 110); }

  function triggerScreenFlash() {
    if (S.settings && S.settings.reduceFlash) return;
    const flash = $('flash');
    flash.classList.remove('fire');
    void flash.offsetWidth;
    flash.classList.add('fire');
  }

  function addRing(x, y, color, size = 20, life = .35) {
    addParticle({ type: 'ring', x, y, vx: 0, vy: 0, life, maxLife: life, size, color, gravity: 0 });
  }

  function updateParticles(dt) {
    for (let i = S.particles.length - 1; i >= 0; i--) {
      const p = S.particles[i];
      p.life -= dt;
      if (p.life <= 0) { S.particles.splice(i, 1); continue; }
      p.x += (p.vx || 0) * dt;
      p.y += (p.vy || 0) * dt;
      p.vy += (p.gravity || 0) * dt;
      p.rot += (p.spin || 0) * dt;
      if (p.type === 'smoke') p.size += dt * 8;
    }
  }

  /* =========================================================
     NEMICI — CREAZIONE E COMPORTAMENTO
     ========================================================= */
  const ENEMY_STATS = {
    pretender: { hp: 30, speed: 47, range: 178, cdMin: 1.5, cdMax: 2.3, score: 100, contact: 10, h: 55, w: 23 },
    boomer: { hp: 55, speed: 28, range: 250, cdMin: 2.1, cdMax: 3.0, score: 160, contact: 13, h: 57, w: 27 },
    utente: { hp: 43, speed: 38, range: 305, cdMin: 1.8, cdMax: 2.5, score: 190, contact: 11, h: 57, w: 24 },
    finanziere: { hp: 64, speed: 40, range: 285, cdMin: 2.0, cdMax: 2.8, score: 230, contact: 13, h: 66, w: 28 },
    collega: { hp: 50, speed: 29, range: 250, cdMin: 2.2, cdMax: 3.2, score: 180, contact: 11, h: 56, w: 25 },
    bidella: { hp: 64, speed: 34, range: 195, cdMin: 1.9, cdMax: 2.7, score: 210, contact: 14, h: 54, w: 27 },
    formatore: { hp: 46, speed: 37, range: 305, cdMin: 2.0, cdMax: 2.8, score: 195, contact: 10, h: 57, w: 24 },
    /* v2.0 — LIV. 4 ROMA */
    centurione: { hp: 105, speed: 25, range: 78, cdMin: 1.7, cdMax: 2.5, score: 260, contact: 16, h: 62, w: 27 },
    boomerTossico: { hp: 62, speed: 24, range: 265, cdMin: 2.3, cdMax: 3.2, score: 220, contact: 12, h: 57, w: 27 },
    meccanico: { hp: 58, speed: 66, range: 70, cdMin: 1.2, cdMax: 1.8, score: 210, contact: 13, h: 55, w: 24 },
    cuoco: { hp: 70, speed: 30, range: 290, cdMin: 2.0, cdMax: 2.9, score: 240, contact: 12, h: 58, w: 27 },
    /* v2.0 — LIV. 5 BRUXELLES */
    merkel: { hp: 96, speed: 22, range: 300, cdMin: 2.4, cdMax: 3.2, score: 280, contact: 14, h: 58, w: 28, armor: .85 },
    francese: { hp: 54, speed: 58, range: 265, cdMin: 1.6, cdMax: 2.2, score: 250, contact: 12, h: 56, w: 25 },
    bottiglia: { hp: 46, speed: 34, range: 190, cdMin: 1.9, cdMax: 2.6, score: 230, contact: 13, h: 48, w: 24 },
    /* v2.0 — LIV. 8 SOGEI */
    software: { hp: 44, speed: 40, range: 300, cdMin: 1.8, cdMax: 2.6, score: 240, contact: 10, h: 48, w: 24, flying: true },
    programma: { hp: 120, speed: 20, range: 130, cdMin: 2.2, cdMax: 3.0, score: 300, contact: 15, h: 60, w: 30, shield: 45 },
    bug: { hp: 20, speed: 95, range: 70, cdMin: 1.0, cdMax: 1.6, score: 140, contact: 8, h: 34, w: 18 },
    errore: { hp: 52, speed: 30, range: 330, cdMin: 1.9, cdMax: 2.7, score: 250, contact: 11, h: 50, w: 26 },
    crash: { hp: 40, speed: 25, range: 60, cdMin: 1.4, cdMax: 2.0, score: 200, contact: 20, h: 52, w: 28 },
    computer: { hp: 90, speed: 0, range: 360, cdMin: 1.6, cdMax: 2.4, score: 260, contact: 10, h: 62, w: 34 },
    /* v2.3 — BARI VECCHIA */
    nonna: { hp: 70, speed: 27, range: 285, cdMin: 2.0, cdMax: 2.9, score: 220, contact: 12, h: 58, w: 26, ai: 'cuoco' },
    scippatore: { hp: 58, speed: 78, range: 72, cdMin: 1.2, cdMax: 1.8, score: 230, contact: 13, h: 56, w: 26, ai: 'meccanico' },
    friggitrice: { hp: 68, speed: 29, range: 300, cdMin: 2.1, cdMax: 3.0, score: 235, contact: 12, h: 58, w: 27, ai: 'cuoco' },
    /* v2.3 — PESCARA */
    bagnino: { hp: 64, speed: 36, range: 290, cdMin: 2.0, cdMax: 2.8, score: 225, contact: 12, h: 58, w: 26, ai: 'cuoco' },
    animatore: { hp: 55, speed: 42, range: 310, cdMin: 1.9, cdMax: 2.7, score: 215, contact: 11, h: 57, w: 25, ai: 'cuoco' }
  };

  /* v2.0 — durate di caricamento (windup) dei nemici nuovi; i v1 restano
     nel ramo storico di updateEnemies per non alterarne il bilanciamento. */
  const ENEMY_WINDUP = {
    centurione: .62, boomerTossico: .8, meccanico: .42, cuoco: .7,
    merkel: .78, francese: .55, bottiglia: .5,
    software: .6, programma: .72, bug: .38, errore: .7, crash: .3, computer: .75,
    nonna: .7, scippatore: .38, friggitrice: .72, bagnino: .62, animatore: .58
  };

  const DEFEAT_QUIPS = {
    pretender: [
      ['pret1', 'Adele, ti amo! Sei bellissima!'],
      ['pret2', 'Ehi bella, che fai la modella?'],
      ['pret3', 'Perché mi respingi? Sono un partito!'],
      ['pret4', 'Ti offro una focaccia... con vista mare!']
    ],
    boomer: [
      ['boom1', 'Ai miei tempi si rispettava la fila!'],
      ['boom2', 'Mi manca il modulo C dodici!'],
      ['boom3', 'Non si timbra così, signorina!'],
      ['boom4', 'Ho una raccomandata per il direttore!']
    ],
    utente: [
      ['user1', 'Voglio parlare col direttore! Subito!'],
      ['user2', 'Mi fate fare tre ore di coda!'],
      ['user3', 'Questo servizio è vergognoso! Apro un reclamo!'],
      ['user4', 'Il modulo non era scaricabile!']
    ],
    merkel: [
      ['merkel1', 'L’austerity è finita, cara signora.'],
      ['merkel2', 'Il mio pacchetto era pluriennale!']
    ],
    francese: [
      ['franc1', 'Zut alors! La baguette non è un’arma doganale!'],
      ['franc2', 'Formaggio! Formaggio ovunque!']
    ],
    bottiglia: [
      ['bott1', 'Il tappo era bloccato!'],
      ['bott2', 'Sono riciclabile, mi scusi!']
    ],
    software: [
      ['soft1', 'Finestra non risponde! Chiudo tutto!'],
      ['soft2', 'Aggiornamento obbligatorio: riavvio!']
    ],
    programma: [
      ['prog1', 'Installazione in corso: 99%... da tre anni.'],
      ['prog2', 'Attendere prego: la pratica è in coda.']
    ],
    bug: [
      ['bug1', 'Non sono un bug, sono una feature!'],
      ['bug2', 'ZzZz! Mi sono infilato nel modulo!']
    ],
    errore: [
      ['err1', 'ERRORE 404: pratica non trovata!'],
      ['err2', 'Errore 500: il server ha la nausea!']
    ],
    crash: [
      ['crash1', 'Schermata blu! Ci vediamo all’inferno!'],
      ['crash2', 'Kernel panic! Addio!']
    ],
    computer: [
      ['pc1', 'Monitor acceso: pratica respinta!'],
      ['pc2', 'Tastiera bloccata dal caffè!']
    ],
    finanziere: [
      ['fin1', 'Fermi tutti! Fiamme Gialle! Verifica fiscale!'],
      ['fin2', 'Ha la ricevuta del rossetto?'],
      ['fin3', 'Questo trucco non è dichiarato!'],
      ['fin4', 'Gettone mancante! Sanzione!'],
      ['fin5', 'La prego, esibisca il documento!']
    ],
    /* v2.3.5 — nemici che prima non avevano né frase né voce */
    nonna: [
      ['nonna1', 'Ai miei tempi le orecchiette si facevano a mano!'],
      ['nonna2', 'Mo\' te le do io le orecchiette!']
    ],
    scippatore: [
      ['scippatore1', 'Fermo! Questo è uno scippo doganale!'],
      ['scippatore2', 'Motorino, borsa e via!']
    ],
    friggitrice: [
      ['friggitrice1', 'Le sgagliozze sono pronte!'],
      ['friggitrice2', 'Bollenti! Te le tiro io!']
    ],
    bagnino: [
      ['bagnino1', 'Acqua alle ginocchia! Butta il pallone!'],
      ['bagnino2', 'Ti manca la respirazione bocca a bocca!']
    ],
    animatore: [
      ['animatore1', 'E adesso il pezzo che tutti aspettavano!'],
      ['animatore2', 'Microfono aperto, dogana chiusa!']
    ],
    cuoco: [
      ['cuoco1', 'Pizza! Padella! Ordine! Ordine!'],
      ['cuoco2', 'La cucina è più veloce della dogana!']
    ],
    meccanico: [
      ['meccanico1', 'Chiave inglese! Officina chiusa!'],
      ['meccanico2', 'Questo ingresso va lubrificato!']
    ],
    boomerTossico: [
      ['boomerTossico1', 'Ai miei tempi non c\'era tutta questa tossicità!'],
      ['boomerTossico2', 'La nuvola me la mandò il comune!']
    ],
    centurione: [
      ['centurione_quip1', 'Ave, cittadino! Presenta il papiro o subirai la lancia!'],
      ['centurione_quip2', 'Roma non paga la dogana: la impone!']
    ]
  };

  const PLAYER_BARKS = {
    adele: {
      start: ['adele_start', 'Ufficio protocollo, Adele. Dove mi mandate stavolta?'],
      starts: [
        ['adele_start', 'Ufficio protocollo, Adele. Dove mi mandate stavolta?'],
        ['adele_start2', 'Protocollo, pratica, proiettili. E filtro tramonto.']
      ],
      idle: [
        ['adele_idle1', 'Altro che protocollo: qui volano i proiettili.'],
        ['adele_idle2', 'Bella giornata per timbrare qualcuno.'],
        ['adele_idle3', 'Protocollo, pratica, proiettili. Che giornata.'],
        ['adele_idle4', 'Nessuno timbra più, qui.'],
        ['adele_tiktok1', 'Nuovo reel: dogana in fiamme, filtro tramonto. Trend?'],
        ['adele_tiktok2', 'Settecento follower in più. Il rossetto funziona.'],
        ['adele_tiktok3', 'Live dal molo: timbrate il cuore, non siate timidi.'],
        ['adele_ig1', 'Regina di Instagram, regina di Bari. Che ne dite del filtro?'],
        ['adele_ig2', 'Questa la posto: Dogana Rush, milf leggendaria.']
      ],
      low: ['adele_low', 'Mi hanno rovinato il rossetto. La pagheranno.'],
      lows: [
        ['adele_low', 'Mi hanno rovinato il rossetto. La pagheranno.'],
        ['adele_low2', 'Rossetto rovinato, ma dignità intatta.']
      ],
      boss: ['adele_boss', 'Capo, la pratica è scaduta. E pure tu.'],
      bossExtra: [
        ['adele_boss_tiktok', 'Un boss in diretta? Raga, sto registrando.'],
        ['adele_boss_ig', 'Questa la posto: capo umiliato, filtro drammatico.'],
        ['adele_boss2', 'Capo, questa la posto. Filtro drammatico.']
      ],
      clear: ['adele_clear', 'Protocollo chiuso. Per oggi.'],
      clearExtra: [
        ['adele_clear_tiktok', 'Reel pronto: dogana liberata, filtro tramonto. Trend?'],
        ['adele_clear_ig', 'Regina di Bari, regina di Instagram. Pratica chiusa.']
      ]
    },
    rocco: {
      start: ['rocco_start', 'Rocco, assistente doganale. Ex Croce Rossa. Non chiedetemi il pesce.'],
      starts: [
        ['rocco_start', 'Rocco, assistente doganale. Ex Croce Rossa. Non chiedetemi il pesce.'],
        ['rocco_start2', 'Rocco. Ex Croce Rossa. Il pesce lo pretendo dopo.']
      ],
      idle: [
        ['rocco_idle1', 'Nessuno mi offre un caffè, qui.'],
        ['rocco_idle2', 'La nipotina voleva un pesce. Vabbè.'],
        ['rocco_idle3', 'Un telecomando e via.'],
        ['rocco_idle4', 'Non guardarmi male, ho la Bulloniera.'],
        ['rocco_idle5', 'Il mare oggi era meglio. Molto meglio.'],
        ['rocco_idle6', 'Ex Croce Rossa, mica ex dogana.'],
        ['rocco_idle7', 'La nipotina ha già preparato la lista.']
      ],
      low: ['rocco_low', 'Mi hanno preso in pieno. Che dolore.'],
      boss: ['rocco_boss', 'Direttore, lei ha firmato la sua condanna.'],
      bossExtra: [
        ['rocco_boss', 'Direttore, lei ha firmato la sua condanna.'],
        ['rocco_boss2', 'Direttore, il pesce non si tocca.']
      ],
      clear: ['rocco_clear', 'Pratica evasa. E adesso il pesce.'],
      clearExtra: [
        ['rocco_clear', 'Pratica evasa. E adesso il pesce.'],
        ['rocco_clear2', 'Pratica chiusa. Pesce, regalia, nipotina.']
      ]
    }
  };

  function playerBark(key, text, opts = {}) {
    const p = S.player;
    if (!p || !text) return;
    // v2.3.5 — niente fumetto se la voce non parte: evita il caso
    // "frase annunciata ma muta". Con audio spento il fumetto resta
    // per accessibilità (sottotitoli visivi).
    const started = SoundEngine.say(key, text, {
      priority: opts.priority == null ? 1 : opts.priority,
      force: !!opts.force,
      subtitle: false
    });
    if (!started && SoundEngine.voiceOn && !SoundEngine.muted) return false;
    S.quip = {
      text, x: p.x, y: p.y - 78, life: 2.5, maxLife: 2.5,
      color: p.character === 'rocco' ? '#9fd7ff' : '#ff90b8'
    };
    return true;
  }

  const ROCCO_DEFEAT_QUIPS = {
    pretender: [
      ['pret_rocco1', 'Rocco, mi presti il badge?'],
      ['pret_rocco2', 'Anche tu ex Croce Rossa? Che tenerezza.']
    ],
    boomer: [
      ['boom_rocco1', 'Rocco, hai portato il pesce?'],
      ['boom_rocco2', 'Ai miei tempi i raccomandati portavano frutta.']
    ],
    utente: [
      ['utente_rocco1', 'Rocco, mi firmi questa pratica?']
    ],
    finanziere: [
      ['fin_rocco1', 'Rocco, è in regola con le regalie?'],
      ['fin_rocco2', 'Anche lei ha il badge scaduto?']
    ],
    collega: [
      ['collega2', 'Scusa, sai dov\'è l\'aula formazione?']
    ],
    bidella: [
      ['bidella1', 'Non calpestare il pavimento appena lavato!']
    ],
    formatore: [
      ['formatore1', 'Questa è una lezione obbligatoria!']
    ]
  };

  const NEW_DEFEAT_QUIPS = {
    collega: [
      ['collega1', 'Uèèè da quanto tempo!'],
      ['collega2', 'Scusa, sai dov\'è l\'aula formazione?']
    ],
    bidella: [
      ['bidella1', 'Non calpestare il pavimento appena lavato!']
    ],
    formatore: [
      ['formatore1', 'Questa è una lezione obbligatoria!']
    ]
  };

  function enemyQuipList(type) {
    if (S.character === 'rocco') return ROCCO_DEFEAT_QUIPS[type] || NEW_DEFEAT_QUIPS[type] || DEFEAT_QUIPS[type];
    return DEFEAT_QUIPS[type] || (type === 'collega' ? NEW_DEFEAT_QUIPS.collega : null);
  }

  function maybeEnemyQuip(e) {
    if (S.quipCooldown > 0 || Math.random() > (e.type === 'pretender' ? .38 : .3)) return;
    const list = enemyQuipList(e.type);
    if (!list || !list.length) return;
    const [key, text] = choose(list);
    // Forza la clip: le frasi dei nemici sono brevi e non devono restare mute
    // se un altro effetto vocale è in corso.
    const started = SoundEngine.say(key, text, { priority: 1, force: true, subtitle: false });
    if (!started && SoundEngine.voiceOn && !SoundEngine.muted) return;
    S.quip = { text, x: e.x, y: e.y - 64, life: 2.4, maxLife: 2.4, color: e.type === 'pretender' ? '#ff90b8' : e.type === 'finanziere' || e.type === 'bidella' ? '#ffc84b' : e.type === 'formatore' ? '#9fd7ff' : e.type === 'utente' ? '#51c7a3' : '#ff845d' };
    S.quipCooldown = 5.5 + Math.random() * 2.5;
  }

  function spawnEnemy(type, x, y = GROUND, summoned = false) {
    const stat = ENEMY_STATS[type];
    if (!stat) return;
    // v2.0 — i nemici volanti (software) nascono a mezz'aria, non a terra
    const flyY = stat.flying ? GROUND - rand(38, 66) : y;
    const e = {
      type,
      ai: stat.ai || type,
      visual: type,
      x: clamp(x, 20, S.level.width - 20),
      y: flyY,
      vx: 0, vy: 0,
      dir: S.player && S.player.x < x ? -1 : 1,
      hp: Math.round(stat.hp * diff().enemyHp), maxHp: Math.round(stat.hp * diff().enemyHp),
      speed: stat.speed * diff().enemySpeed, range: stat.range * (ENEMY_SCALE * .45 + .55),
      contact: stat.contact, score: stat.score,
      w: stat.w * ENEMY_SCALE, h: stat.h * ENEMY_SCALE,
      hitFlash: 0, slowTimer: 0, stunTimer: 0,
      windup: 0, pending: null, attackCd: rand(.7, 1.6) / diff().attackRate,
      attackIndex: Math.random() < .5 ? 0 : 1,
      animT: Math.random() * 2,
      alive: true, summoned, grounded: true,
      /* v2.0 — stato AI per i nemici nuovi (i v1 lo ignorano) */
      vy: 0, dashTime: 0, dashDir: 0, specialCd: rand(.9, 2.2),
      jumpCooldown: rand(.6, 1.8), baseY: flyY, flying: !!stat.flying,
      hoverT: Math.random() * TAU, shieldHp: stat.shield || 0
    };
    S.enemies.push(e);
    addRing(e.x, GROUND - 25, '#ff90b8', 16, .32);
    for (let i = 0; i < 3; i++) smokePuff(e.x + rand(-10, 10), GROUND - 10, '#c598e0', 5);
  }

  function triggerWaves() {
    if (!S.waves || S.bossActive) return;
    for (const wave of S.waves) {
      if (wave.spawned || S.player.x < wave.x) continue;
      wave.spawned = true;
      const types = wave.types || [];
      const epoch = S.spawnEpoch;
      types.forEach((type, i) => {
        S.pendingSpawns.push({
          type, at: S.levelTime + i * .15, epoch,
          offset: W + 34 + i * 53
        });
      });
      S.shake = Math.max(S.shake, 1);
    }
  }

  function updatePendingSpawns() {
    if (!S.pendingSpawns || S.bossActive) return;
    for (let i = S.pendingSpawns.length - 1; i >= 0; i--) {
      const pending = S.pendingSpawns[i];
      if (pending.epoch !== S.spawnEpoch) { S.pendingSpawns.splice(i, 1); continue; }
      if (pending.at > S.levelTime) continue;
      let x = Math.min(S.level.width - 30, S.camera.x + pending.offset);
      // v2.0 — le torrette fisse (computer) devono apparire a schermo, non restare fuori
      const stat = ENEMY_STATS[pending.type];
      if (stat && stat.speed <= 0) x = Math.min(S.level.width - 30, S.camera.x + W - 55);
      spawnEnemy(pending.type, x);
      S.pendingSpawns.splice(i, 1);
    }
  }

  function updateEnemies(dt) {
    const p = S.player;
    for (let i = S.enemies.length - 1; i >= 0; i--) {
      const e = S.enemies[i];
      if (!e.alive) { S.enemies.splice(i, 1); continue; }
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      e.slowTimer = Math.max(0, e.slowTimer - dt);
      e.stunTimer = Math.max(0, e.stunTimer - dt);
      e.attackCd -= dt;
      e.animT += dt;
      if (e.windup > 0) {
        e.windup -= dt;
        if (e.windup <= 0) {
          doEnemyAttack(e);
          e.attackCd = rand(ENEMY_STATS[e.type].cdMin, ENEMY_STATS[e.type].cdMax) / diff().attackRate + (e.slowTimer > 0 ? .4 : 0);
          e.windup = 0;
          e.pending = null;
        }
        continue;
      }
      const dist = Math.abs(p.x - e.x);
      e.dir = p.x < e.x ? -1 : 1;
      /* v2.0 — fisica verticale per nemici saltatori (meccanico) e volanti (software). */
      if (e.flying) {
        e.hoverT = (e.hoverT || 0) + dt;
        e.y = clamp((e.baseY || GROUND) + Math.sin(e.hoverT * 1.7) * 12, 40, GROUND);
      } else if (!e.grounded) {
        e.vy += 1500 * dt;
        e.y += e.vy * dt;
        if (e.y >= GROUND) { e.y = GROUND; e.vy = 0; e.grounded = true; }
      }
      if (e.dashTime > 0) {
        e.dashTime -= dt;
        e.x += e.dashDir * e.speed * 3.4 * dt;
      } else if (e.stunTimer <= 0 && !p.dead) {
        /* I nemici v1 continuano col ramo storico; i nuovi hanno AI dedicata. */
        if (!updateSpecialEnemy(e, dt, dist, p)) {
          const slowMul = e.slowTimer > 0 ? .43 : 1;
          const attitude = S.character === 'rocco'
            ? (e.type === 'finanziere' ? 1.08 : e.type === 'pretender' ? .94 : 1)
            : (e.type === 'pretender' ? 1.04 : e.type === 'boomer' ? .96 : 1);
          if (dist > e.range) {
            e.x += e.dir * e.speed * slowMul * attitude * dt;
          } else if (dist < 52) {
            e.x -= e.dir * e.speed * .5 * dt;
          } else if (e.attackCd <= 0) {
            e.windup = (e.type === 'utente' ? .58 : e.type === 'boomer' ? .72 : e.type === 'finanziere' ? .64
              : e.type === 'collega' ? .7 : e.type === 'bidella' ? .62 : e.type === 'formatore' ? .55 : .52) / diff().attackRate;
            e.pending = e.type === 'pretender' ? (e.attackIndex++ % 2 ? 'rose' : 'kiss')
              : e.type === 'boomer' ? 'stamp' : e.type === 'finanziere' ? 'ticket'
              : e.type === 'collega' ? 'paper' : e.type === 'bidella' ? 'soap' : e.type === 'formatore' ? 'pointer' : 'phone';
            e.attackCd = 99;
            SoundEngine.enemyHit();
          }
        }
      } else if (e.stunTimer > 0 && Math.random() < dt * 4) {
        addParticle({
          type: 'star', x: e.x + rand(-12, 12), y: e.y - e.h - rand(0, 10),
          vx: rand(-6, 6), vy: rand(-22, -6), life: .55, size: rand(2, 4),
          color: '#ffc84b', gravity: 0
        });
      }
      e.x = clamp(e.x, 16, S.level.width - 20);
      if (!p.dead && p.invuln <= 0) {
        // Sovrapposizione dei corpi (centri): evita che un nemico a terra colpisca
        // il giocatore che sta sulla piattaforma sopra di lui solo con la testa.
        const pCy = p.y - (p.crouching ? p.h * .35 : p.h * .5);
        const eCy = e.y - e.h * .5;
        const vOverlap = Math.abs(pCy - eCy) < (p.h + e.h) * .4;
        if (vOverlap && Math.abs(p.x - e.x) < (p.w * .5 + e.w * .5 + 5)) {
          if (e.type === 'crash') {
            // v2.0 — il crash esplode al contatto (kamikaze)
            e.hp = 0;
            explodeAt(e.x, e.y - 26, 52, true);
            enemyExplode(e.x, e.y - 20, 66, 22, '#2a6db5');
            if (SoundEngine.crashError) SoundEngine.crashError();
            killEnemy(e);
            e.alive = false;
            continue;
          }
          damagePlayer(e.contact, e.x, 'contact');
        }
      }
      if (e.slowTimer > 0 && Math.random() < dt * 2) {
        addParticle({
          type: 'inkDrip', x: e.x + rand(-8, 8), y: e.y - rand(15, 55),
          vx: rand(-4, 4), vy: rand(18, 40), life: .4, size: rand(1.5, 3),
          color: '#4d2c4e', gravity: 60
        });
      }
    }
  }

  /* v2.0 — AI dei nemici nuovi. Ritorna false se il tipo non è gestito qui
     (i nemici v1 restano nel ramo storico di updateEnemies, bilanciamento intatto). */
  function updateSpecialEnemy(e, dt, dist, p) {
    const stat = ENEMY_STATS[e.type];
    if (!stat || ENEMY_WINDUP[e.type] == null) return false;
    const slowMul = e.slowTimer > 0 ? .43 : 1;
    const rate = diff().attackRate;
    const beginAttack = (pending) => {
      e.windup = ENEMY_WINDUP[e.type] / rate;
      e.pending = pending;
      e.attackCd = 99;
      SoundEngine.enemyHit();
    };
    e.specialCd = Math.max(0, (e.specialCd || 0) - dt);
    e.jumpCooldown = Math.max(0, (e.jumpCooldown || 0) - dt);
    switch (e.ai || e.type) {
      case 'centurione':
        // melee lento: avanza e ogni tanto carica di scudo
        if (dist > e.range) e.x += e.dir * e.speed * slowMul * dt;
        else if (dist < 46) e.x -= e.dir * e.speed * .35 * dt;
        else if (e.attackCd <= 0) beginAttack('charge');
        break;
      case 'boomerTossico':
        // lento, tiene le distanze e lancia nuvole tossiche
        if (dist < 140) e.x -= e.dir * e.speed * slowMul * dt;
        else if (dist > e.range) e.x += e.dir * e.speed * slowMul * dt;
        else if (e.attackCd <= 0) beginAttack('cloud');
        break;
      case 'meccanico':
        // velocissimo, salta e mena la chiave inglese
        if (e.grounded && e.jumpCooldown <= 0 && dist > 46 && dist < 300) {
          e.vy = -320;
          e.grounded = false;
          e.jumpCooldown = rand(1.5, 2.6);
        }
        if (dist > e.range) e.x += e.dir * e.speed * slowMul * (e.grounded ? 1 : .55) * dt;
        else if (e.attackCd <= 0) beginAttack('wrench');
        break;
      case 'cuoco':
        // lancia padelle e pizze ad arco
        if (dist < 150) e.x -= e.dir * e.speed * slowMul * dt;
        else if (dist > e.range) e.x += e.dir * e.speed * slowMul * dt;
        else if (e.attackCd <= 0) beginAttack(choose(['pan', 'pizza']));
        break;
      case 'merkel':
        // lenta e resistente: tiene le distanze e lancia pacchetti austerity
        if (dist < 165) e.x -= e.dir * e.speed * slowMul * dt;
        else if (dist > e.range) e.x += e.dir * e.speed * slowMul * dt;
        else if (e.attackCd <= 0) beginAttack('austerity');
        break;
      case 'francese':
        // snob velocissimo: salta e lancia baguette a parabola
        if (e.grounded && e.jumpCooldown <= 0 && dist > 70 && dist < 330) {
          e.vy = -285;
          e.grounded = false;
          e.jumpCooldown = rand(1.1, 2.0);
        }
        if (dist > e.range) e.x += e.dir * e.speed * slowMul * (e.grounded ? 1 : .6) * dt;
        else if (dist < 120) e.x -= e.dir * e.speed * .5 * slowMul * dt;
        else if (e.attackCd <= 0) beginAttack('baguette');
        break;
      case 'bottiglia':
        // rotola a saltelli; il tappo si stacca e rimbalza
        if (e.grounded && e.specialCd <= 0 && dist > 60) {
          e.vy = -155;
          e.grounded = false;
          e.specialCd = rand(.7, 1.3);
        }
        if (dist > e.range) e.x += e.dir * e.speed * slowMul * dt;
        else if (e.attackCd <= 0) beginAttack('cap');
        break;
      case 'software':
        // fluttua e spara finestre applicazione
        if (dist > e.range) e.x += e.dir * e.speed * slowMul * dt;
        else if (dist < 170) e.x -= e.dir * e.speed * slowMul * dt;
        else if (e.attackCd <= 0) beginAttack('window');
        break;
      case 'programma':
        // lento e corazzato: si avvicina e sferra l'installazione
        if (dist > e.range) e.x += e.dir * e.speed * slowMul * dt;
        else if (e.attackCd <= 0) beginAttack('install');
        break;
      case 'bug':
        // piccolo, velocissimo, zig-zag
        e.x += e.dir * e.speed * slowMul * dt;
        e.x += Math.sin(e.animT * 13) * e.speed * .55 * dt;
        if (dist < e.range && e.attackCd <= 0) beginAttack('bite');
        break;
      case 'errore':
        // a distanza: tiene le distanze e lancia pannelli ERRORE 404
        if (dist < 200) e.x -= e.dir * e.speed * slowMul * dt;
        else if (dist > e.range) e.x += e.dir * e.speed * slowMul * dt;
        else if (e.attackCd <= 0) beginAttack('error404');
        break;
      case 'crash':
        // kamikaze: si lancia verso il giocatore
        e.x += e.dir * e.speed * 1.7 * slowMul * dt;
        if (dist < e.range && e.attackCd <= 0) beginAttack('boom');
        break;
      case 'computer':
        // torretta fissa con monitor
        if (dist < e.range && e.attackCd <= 0) beginAttack('monitor');
        break;
      default:
        return false;
    }
    return true;
  }

  function doEnemyAttack(e) {
    const p = S.player;
    if (!p || p.dead) return;
    const dir = p.x < e.x ? -1 : 1;
    const ai = e.ai || e.type;
    if (ai === 'pretender') {
      if (e.pending === 'rose') {
        S.eBullets.push({
          kind: 'rose', x: e.x + dir * 22, y: GROUND - 55,
          vx: dir * 155, vy: -255, gravity: 470, life: 3,
          rot: 0, spin: dir * 7, damage: 11, size: 22
        });
        addParticle({ type: 'heart', x: e.x + dir * 22, y: GROUND - 64, vx: dir * 15, vy: -40, life: .6, size: 4, color: '#ff5b9d' });
        SoundEngine.orbLaunch();
      } else {
        S.eBullets.push({
          kind: 'heart', x: e.x + dir * 24, y: GROUND - 48,
          vx: dir * 155, vy: 0, baseY: GROUND - 48, t: 0,
          life: 3, damage: 10, size: 20
        });
        for (let i = 0; i < 3; i++) {
          addParticle({ type: 'heart', x: e.x + dir * (18 + i * 7), y: GROUND - 59, vx: dir * rand(10, 30), vy: rand(-50, -20), life: .6, size: 3, color: '#ff90b8' });
        }
        SoundEngine.orbLaunch();
      }
    } else if (ai === 'boomer') {
      S.eBullets.push({
        kind: 'stamp', x: e.x + dir * 18, y: GROUND - 61,
        vx: dir * 190, vy: -320, gravity: 690, life: 3,
        rot: 0, spin: dir * 9, damage: 14, size: 28
      });
      addParticle({ type: 'text', x: e.x + dir * 8, y: GROUND - 72, vx: dir * 8, vy: -35, life: .75, size: 6, color: '#ff845d', text: 'MODULO!', gravity: 6 });
      SoundEngine.orbLaunch();
    } else if (ai === 'utente') {
      S.eBullets.push({
        kind: 'phone', x: e.x + dir * 16, y: GROUND - 14,
        vx: dir * 195, vy: 0, life: 1.8,
        damage: 12, size: 22, t: 0
      });
      addParticle({ type: 'text', x: e.x + dir * 8, y: GROUND - 75, vx: dir * 8, vy: -30, life: .8, size: 5, color: '#51c7a3', text: 'RECLAMO!', gravity: 4 });
      SoundEngine.orbLaunch();
    } else if (ai === 'finanziere') {
      S.eBullets.push({
        kind: 'ticket', x: e.x + dir * 20, y: GROUND - 52, baseY: GROUND - 52,
        vx: dir * 238, vy: 0, life: 2.6, damage: 11, size: 20, t: 0
      });
      addParticle({ type: 'text', x: e.x + dir * 10, y: GROUND - 78, vx: dir * 8, vy: -32, life: .95, size: 6, color: '#ffc84b', text: 'VERBALE!', gravity: 4 });
      SoundEngine.orbLaunch();
    } else if (ai === 'collega') {
      for (let i = 0; i < 2; i++) {
        S.eBullets.push({
          kind: 'paper', x: e.x + dir * 18, y: GROUND - 62 - i * 8,
          vx: dir * (150 + i * 22), vy: -240 + i * 40, gravity: 420, life: 3.2,
          rot: 0, spin: dir * (5 + i), damage: 11, size: 18
        });
      }
      addParticle({ type: 'text', x: e.x + dir * 8, y: GROUND - 78, vx: dir * 8, vy: -30, life: .85, size: 5, color: '#c3d0d8', text: 'PRATICA!', gravity: 4 });
      SoundEngine.orbLaunch();
    } else if (ai === 'bidella') {
      S.eBullets.push({
        kind: 'soap', x: e.x + dir * 20, y: GROUND - 26,
        vx: dir * 150, vy: -130, gravity: 420, life: 2.8,
        rot: 0, spin: dir * 8, damage: 12, size: 24
      });
      addParticle({ type: 'text', x: e.x + dir * 8, y: GROUND - 70, vx: dir * 8, vy: -30, life: .8, size: 5, color: '#9fd7ff', text: 'PAVIMENTO!', gravity: 4 });
      SoundEngine.orbLaunch();
    } else if (ai === 'formatore') {
      S.eBullets.push({
        kind: 'pointer', x: e.x + dir * 20, y: GROUND - 48,
        vx: dir * 330, vy: 0, life: 1.3, damage: 9, size: 8, t: 0
      });
      addParticle({ type: 'text', x: e.x + dir * 8, y: GROUND - 78, vx: dir * 8, vy: -30, life: .8, size: 5, color: '#9fd7ff', text: 'SLIDE!', gravity: 4 });
      SoundEngine.orbLaunch();
    } else if (ai === 'centurione') {
      // carica di scudo: scatto rapido in avanti con telegrafo
      e.dashTime = .55;
      e.dashDir = dir;
      addParticle({ type: 'text', x: e.x + dir * 10, y: e.y - e.h - 12, vx: dir * 10, vy: -30, life: .8, size: 6, color: '#ff845d', text: 'CARICA!', gravity: 4 });
      sparkBurst(e.x + dir * 20, e.y - 22, 8, '#ffc84b', 130);
      S.shake = Math.max(S.shake, 2);
      if (SoundEngine.centurion) SoundEngine.centurion();
      else if (SoundEngine.charge) SoundEngine.charge();
      else SoundEngine.enemyHit();
    } else if (ai === 'boomerTossico') {
      // nuvola tossica a distanza: si gonfia, poi lascia una nube persistente
      S.eBullets.push({
        kind: 'cloud', x: e.x + dir * 22, y: e.y - 78,
        vx: dir * 88, vy: -46, gravity: 185, life: 3.4,
        rot: 0, spin: dir * 1.2, damage: 11, size: 30, toxic: true
      });
      addParticle({ type: 'text', x: e.x + dir * 8, y: e.y - 96, vx: dir * 8, vy: -30, life: .85, size: 5, color: '#8fd14f', text: 'AI MIEI TEMPI!', gravity: 4 });
      SoundEngine.orbLaunch();
    } else if (ai === 'meccanico') {
      // fendente di chiave inglese: telegrafo corto e colpo ravvicinato
      S.hazards.push({
        kind: 'column', x: clamp(e.x + dir * 44, S.camera.x + 25, S.camera.x + W - 25),
        width: 66, telegraph: .16, active: .26, timer: 0,
        damage: 13, hit: false, color: '#9fd7ff', label: 'CHIAVE!'
      });
      addParticle({ type: 'text', x: e.x + dir * 10, y: e.y - e.h - 10, vx: dir * 8, vy: -30, life: .7, size: 5, color: '#9fd7ff', text: 'VITE!', gravity: 4 });
      SoundEngine.enemyHit();
    } else if (ai === 'cuoco') {
      // padella/pizza ad arco
      S.eBullets.push({
        kind: e.visual === 'nonna' ? 'orecchiette' : e.visual === 'friggitrice' ? 'sgagliozze' : e.visual === 'bagnino' ? 'beach' : e.visual === 'animatore' ? 'mic' : (e.pending === 'pizza' ? 'pizza' : 'pan'), x: e.x + dir * 20, y: e.y - 58,
        vx: dir * rand(130, 185), vy: -255, gravity: 520, life: 3,
        rot: 0, spin: dir * 8, damage: 12, size: 26
      });
      const cookText = e.visual === 'nonna' ? 'ORECCHIETTE!' : e.visual === 'friggitrice' ? 'SGAGLIOZZE!' : e.visual === 'bagnino' ? 'PALLONE!' : e.visual === 'animatore' ? 'RITORNELLO!' : (e.pending === 'pizza' ? 'PIZZA!' : 'ORDINE!');
      addParticle({ type: 'text', x: e.x + dir * 8, y: e.y - 84, vx: dir * 8, vy: -30, life: .85, size: 5, color: '#ffc84b', text: cookText, gravity: 4 });
      SoundEngine.orbLaunch();
    } else if (ai === 'merkel') {
      // pacchetto austerity lento ma pesante
      S.eBullets.push({
        kind: 'austerity', x: e.x + dir * 22, y: e.y - 62,
        vx: dir * 125, vy: -75, gravity: 190, life: 3.6,
        rot: 0, spin: dir * 2, damage: 12, size: 24
      });
      addParticle({ type: 'text', x: e.x + dir * 8, y: e.y - 88, vx: dir * 8, vy: -28, life: .9, size: 5, color: '#9fd7ff', text: 'AUSTERITY!', gravity: 4 });
      SoundEngine.orbLaunch();
    } else if (ai === 'francese') {
      // baguette a parabola
      S.eBullets.push({
        kind: 'baguette', x: e.x + dir * 20, y: e.y - 60,
        vx: dir * rand(170, 215), vy: -245, gravity: 520, life: 3,
        rot: 0, spin: dir * 9, damage: 12, size: 24
      });
      addParticle({ type: 'text', x: e.x + dir * 8, y: e.y - 86, vx: dir * 8, vy: -28, life: .85, size: 5, color: '#ffc84b', text: 'BAGUETTE!', gravity: 4 });
      SoundEngine.orbLaunch();
    } else if (ai === 'bottiglia') {
      // il tappo si stacca e rimbalza verso il giocatore
      S.eBullets.push({
        kind: 'cap', x: e.x + dir * 18, y: e.y - 42,
        vx: dir * 205, vy: -175, gravity: 470, life: 3.2,
        rot: 0, spin: dir * 12, damage: 11, size: 18, bounces: 0
      });
      addParticle({ type: 'text', x: e.x + dir * 8, y: e.y - 66, vx: dir * 8, vy: -28, life: .85, size: 5, color: '#9fd7ff', text: 'TAPPI!', gravity: 4 });
      if (SoundEngine.bottlePop) SoundEngine.bottlePop();
      else SoundEngine.orbLaunch();
    } else if (ai === 'software') {
      // due finestre applicazione: puntate all'altezza del giocatore
      const shotY = Math.min(GROUND - 26, e.y + 16);
      for (let i = 0; i < 2; i++) {
        S.eBullets.push({
          kind: 'window', x: e.x + dir * 22, y: shotY - i * 16,
          vx: dir * (170 + i * 20), vy: 0, life: 2.6,
          rot: 0, spin: dir * 2, damage: 10, size: 20
        });
      }
      addParticle({ type: 'text', x: e.x + dir * 8, y: e.y - e.h - 12, vx: dir * 8, vy: -28, life: .85, size: 5, color: '#9fd7ff', text: 'FINESTRA!', gravity: 4 });
      SoundEngine.orbLaunch();
    } else if (ai === 'programma') {
      // shockwave di installazione
      S.hazards.push({
        kind: 'column', x: clamp(e.x + dir * 46, S.camera.x + 25, S.camera.x + W - 25),
        width: 96, telegraph: .55, active: .32, timer: 0,
        damage: 14, hit: false, color: '#7280b3', label: 'INSTALL...'
      });
      addParticle({ type: 'text', x: e.x + dir * 8, y: e.y - e.h - 10, vx: dir * 6, vy: -26, life: .8, size: 5, color: '#9fd7ff', text: 'INSTALL!', gravity: 4 });
      SoundEngine.alarm();
    } else if (ai === 'bug') {
      // morso rapidissimo
      S.hazards.push({
        kind: 'column', x: clamp(e.x + dir * 30, S.camera.x + 20, S.camera.x + W - 20),
        width: 46, telegraph: .16, active: .2, timer: 0,
        damage: 9, hit: false, color: '#8fd14f', label: 'ZAP!'
      });
      SoundEngine.enemyHit();
    } else if (ai === 'errore') {
      // pannello ERRORE 404 ad arco
      S.eBullets.push({
        kind: 'error', x: e.x + dir * 20, y: e.y - 44,
        vx: dir * rand(210, 250), vy: -115, gravity: 390, life: 3.2,
        rot: 0, spin: dir * 7, damage: 12, size: 22
      });
      addParticle({ type: 'text', x: e.x + dir * 8, y: e.y - 84, vx: dir * 8, vy: -28, life: .9, size: 5, color: '#ff5b9d', text: '404!', gravity: 4 });
      if (SoundEngine.crashError) SoundEngine.crashError();
      else SoundEngine.orbLaunch();
    } else if (ai === 'crash') {
      // esplosione kamikaze: killEnemy assegna punti/FX e imposta alive=false
      e.hp = 0;
      explodeAt(e.x, e.y - 26, 54, true);
      enemyExplode(e.x, e.y - 20, 72, 24, '#2a6db5');
      if (SoundEngine.crashError) SoundEngine.crashError();
      killEnemy(e);
    } else if (ai === 'computer') {
      // raffica di monitor dalla torretta
      S.eBullets.push({
        kind: 'window', x: e.x + dir * 24, y: GROUND - 46,
        vx: dir * 320, vy: 0, life: 2.2,
        rot: 0, spin: 0, damage: 11, size: 18
      });
      addParticle({ type: 'text', x: e.x + dir * 6, y: e.y - e.h - 8, vx: dir * 6, vy: -26, life: .8, size: 5, color: '#9fd7ff', text: 'MONITOR!', gravity: 4 });
      SoundEngine.orbLaunch();
    }
  }

  /* =========================================================
     PROIETTILI
     ========================================================= */
  function getMuzzle(p) {
    const heavy = p.weapon === 'mascara';
    const rocco = p.character === 'rocco';
    let ox = heavy ? 38 : rocco ? 36 : 34;
    let oy = rocco ? -41 : -38;
    if (p.aimUp) { ox = heavy ? 25 : rocco ? 27 : 21; oy = heavy ? -73 : rocco ? -76 : -73; }
    else if (p.aimDown && !p.onGround) { ox = 34; oy = -25; }
    else if (p.crouching) { oy = rocco ? -30 : -28; }
    return { x: p.x + p.facing * ox * PLAYER_SCALE, y: p.y + oy * PLAYER_SCALE, dir: p.facing };
  }

  function tryShoot() {
    const p = S.player;
    if (!p || p.dead || p.fireCd > 0) return;
    const heavy = p.weapon === 'mascara' && p.mascaraAmmo > 0;
    const m = getMuzzle(p);
    let vx, vy;
    if (p.aimUp) { vx = 0; vy = -530; }
    else if (p.aimDown && !p.onGround) { vx = p.facing * 350; vy = 390; }
    else { vx = p.facing * (heavy ? 500 : 560); vy = 0; }
    if (p.character === 'rocco') {
      vx = p.aimUp ? 0 : p.aimDown && !p.onGround ? p.facing * 350 : p.facing * 640;
      vy = p.aimUp ? -540 : p.aimDown && !p.onGround ? 390 : 0;
      S.bullets.push({
        kind: 'bolt', x: m.x, y: m.y, vx, vy, life: .9,
        damage: 15 + (p.anger || 0) * 2, heavy: false, w: 5, h: 5, rot: 0, spin: p.facing * 14, trail: 0
      });
      p.fireCd = .245;
      p.recoil = Math.min(1, p.recoil + .32);
      p.muzzle = .07;
      addParticle({ type: 'muzzle', x: m.x, y: m.y, vx: 0, vy: 0, life: .06, size: 1, img: Art.icons.muzzleGold, world: true, dir: p.facing });
      S.shots++;
      SoundEngine.shoot(false);
      return;
    }
    if (p.weapon === 'spritz') {
      p.weaponAmmo--;
      for (let i = 0; i < 3; i++) {
        S.bullets.push({
          kind: 'spritz', x: m.x, y: m.y + (i - 1) * 6,
          vx: p.facing * (470 + i * 22), vy: (p.aimUp ? -390 : 0) + (i - 1) * 55,
          life: .75, damage: 10, heavy: false, w: 8, h: 8,
          rot: rand(0, TAU), spin: p.facing * 12, trail: 0
        });
      }
      p.fireCd = .19;
      p.recoil = Math.min(1, p.recoil + .2);
      p.muzzle = .06;
      addParticle({ type: 'muzzle', x: m.x, y: m.y, vx: 0, vy: 0, life: .055, size: 1, img: Art.icons.muzzlePink, world: true, dir: p.facing });
      addParticle({ type: 'text', x: m.x, y: m.y - 16, vx: p.facing * 24, vy: -32, life: .55, size: 5, color: '#ff845d', text: 'SPRITZ!', gravity: 4 });
      S.shots++;
      SoundEngine.shoot(false);
      if (p.weaponAmmo <= 0) {
        p.weapon = 'lipstick';
        showToast('SPRITZ FINITO · ROSSETTO', 22);
      }
      return;
    }
    if (p.weapon === 'timbro' || p.weapon === 'scontrino') {
      const isStamp = p.weapon === 'timbro';
      p.weaponAmmo--;
      const count = isStamp ? 3 : 1;
      for (let i = 0; i < count; i++) {
        const spread = isStamp ? (i - 1) * 55 : rand(-14, 14);
        S.bullets.push({
          kind: isStamp ? 'timbro' : 'receipt',
          x: m.x, y: m.y + (isStamp ? (i - 1) * 8 : 0),
          vx: p.facing * (isStamp ? 520 : 620),
          vy: (p.aimUp ? -500 : p.aimDown && !p.onGround ? 350 : 0) + spread,
          life: isStamp ? .95 : .8,
          damage: isStamp ? 14 : 7,
          heavy: false, w: isStamp ? 8 : 5, h: isStamp ? 8 : 6,
          rot: rand(0, TAU), spin: p.facing * (isStamp ? 9 : 16), trail: 0
        });
      }
      p.fireCd = isStamp ? .27 : .075;
      p.recoil = Math.min(1, p.recoil + (isStamp ? .34 : .14));
      p.muzzle = .06;
      addParticle({ type: 'muzzle', x: m.x, y: m.y, vx: 0, vy: 0, life: .055, size: 1, img: isStamp ? Art.icons.muzzleGold : Art.icons.muzzlePink, world: true, dir: p.facing });
      addParticle({ type: 'text', x: m.x, y: m.y - 16, vx: p.facing * 24, vy: -32, life: .55, size: 5, color: isStamp ? '#ffc84b' : '#c3d0d8', text: isStamp ? 'TIMBRA!' : 'SCONTRINO!', gravity: 4 });
      S.shots++;
      SoundEngine.shoot(isStamp);
      if (p.weaponAmmo <= 0) {
        p.weapon = 'lipstick';
        showToast(isStamp ? 'TIMBRO ESAUSTO · ROSSETTO' : 'SCONTRINI FINITI · ROSSETTO', 22);
      }
      return;
    }
    if (heavy) {
      vy += rand(-26, 26);
      p.mascaraAmmo--;
      S.bullets.push({
        x: m.x, y: m.y, vx, vy, life: 1.25, damage: 7,
        heavy: true, w: 7, h: 7, trail: 0
      });
      p.fireCd = .068;
      p.recoil = Math.min(1, p.recoil + .28);
      addParticle({ type: 'muzzle', x: m.x, y: m.y, vx: 0, vy: 0, life: .06, size: 1, img: Art.icons.muzzleDark, world: true, dir: p.facing });
      addParticle({ type: 'inkDrip', x: m.x, y: m.y, vx: rand(-30, 30), vy: rand(-20, 20), life: .25, size: 2, color: '#1a1222', gravity: 200 });
      addParticle({
        type: 'paper', x: m.x - p.facing * 6, y: m.y + 1,
        vx: -p.facing * rand(26, 60), vy: rand(-70, -25), gravity: 460,
        life: .65, maxLife: .65, size: rand(2, 3.3),
        color: '#ffc84b', rot: rand(0, TAU), spin: rand(-12, 12)
      });
      if (p.mascaraAmmo <= 0) {
        p.mascaraTime = 0;
        p.weapon = 'lipstick';
        announce('MASCARA ESAUSTO', 'Torna il rossetto. Sempre elegante.', null, '#c598e0', 2);
        SoundEngine.say('mascaraout', 'Mascara esaurito. Torna il rossetto.');
      }
    } else {
      vx = p.facing * 560;
      vy = p.aimUp ? -530 : (p.aimDown && !p.onGround ? 390 : 0);
      S.bullets.push({
        x: m.x, y: m.y, vx, vy, life: .95, damage: 9,
        heavy: false, w: 4, h: 4, trail: 0
      });
      p.fireCd = .105;
      p.recoil = Math.min(1, p.recoil + .2);
      addParticle({ type: 'muzzle', x: m.x, y: m.y, vx: 0, vy: 0, life: .055, size: 1, img: Art.icons.muzzlePink, world: true, dir: p.facing });
    }
    p.muzzle = .06;
    S.shots++;
    SoundEngine.shoot(heavy);
  }

  function updatePlayer(dt) {
    const p = S.player;
    if (!p) return;
    p.invuln = Math.max(0, p.invuln - dt);
    p.fireCd = Math.max(0, p.fireCd - dt);
    p.grenadeCd = Math.max(0, p.grenadeCd - dt);
    p.muzzle = Math.max(0, p.muzzle - dt);
    p.recoil = Math.max(0, p.recoil - dt * 6);
    p.weaponSwitchFlash = Math.max(0, p.weaponSwitchFlash - dt);
    p.angerTime = Math.max(0, (p.angerTime || 0) - dt);
    if (p.angerTime <= 0) p.anger = 0;
    if (p.character === 'rocco' && !p.redCrossUsed && p.health > 0 && p.health < p.maxHealth * .3) {
      p.redCrossUsed = true;
      p.health = Math.min(p.maxHealth, p.health + 26);
      announce('BORSA CROCE ROSSA', 'Rocco si medica da solo. Non è ancora finita.', null, '#ff6b7a', 2.2);
      playerBark('rocco_croce', 'Croce Rossa, borsa pronta. Non è ancora finita.', { priority: 2, force: true });
    }
    if (p.mascaraTime > 0) {
      p.mascaraTime -= dt;
      if (p.mascaraTime <= 0) {
        p.mascaraTime = 0;
        p.mascaraAmmo = 0;
        if (p.weapon === 'mascara') {
          p.weapon = 'lipstick';
          announce('MASCARA ESAUSTO', 'La pratica chiede il rossetto.', null, '#c598e0', 2);
        }
      }
    }
    if ((p.weapon === 'timbro' || p.weapon === 'scontrino' || p.weapon === 'spritz') && p.weaponTime > 0) {
      p.weaponTime -= dt;
      if (p.weaponTime <= 0) {
        p.weaponTime = 0;
        p.weaponAmmo = 0;
        const expiredWeapon = p.weapon;
        p.weapon = 'lipstick';
        announce(expiredWeapon === 'spritz' ? 'SPRITZ FINITO' : 'UFFICIO CHIUSO',
          expiredWeapon === 'spritz' ? 'Bicchiere vuoto. Torna il rossetto.' : 'Torna il rossetto. La pratica resta aperta.',
          null, '#ff90b8', 2);
      }
    }
    if (p.dead) {
      p.respawnTimer -= dt;
      if (p.respawnTimer <= 0) {
        if (S.lives <= 0) {
          if (!S.ending) {
            S.ending = true;
            S.endTimer = 1.1;
          }
        } else {
          respawnPlayer();
        }
      }
      return;
    }
    if (S.bossIntro > 1.35) {
      p.vx = approach(p.vx, 0, 1200 * dt);
    } else {
      const inCar = !!(S.car && S.car.active);
      const down = input.down;
      p.crouching = down && p.onGround && !input.up;
      p.aimUp = input.up && !p.crouching;
      p.aimDown = down && !p.onGround && !input.up;
      const move = inCar ? 0 : (input.right ? 1 : 0) - (input.left ? 1 : 0);
      if (move !== 0) p.facing = move;
      // v2.0: spritz ("brillo") altera la velocità, il caffè dà uno scatto breve
      const bonusSpeed = (S.brillo > 0 ? 1.3 : 1) * (S.caffeBoost > 0 ? 1.15 : 1);
      const speed = (p.crouching ? 68 : 168) * (p.config ? p.config.speed : 1) * bonusSpeed;
      const target = move * speed;
      p.vx = approach(p.vx, target, (p.onGround ? 1700 : 950) * dt);
      if (input.jumpEdge && p.onGround && !inCar) {
        if (input.down && p.platform) {
          p.dropTimer = .24;
          p.onGround = false;
          p.platform = null;
          p.y += 2;
          SoundEngine.uiMove();
        } else {
          p.vy = -355;
          p.onGround = false;
          p.platform = null;
          SoundEngine.jump();
          for (let i = 0; i < 4; i++) smokePuff(p.x + rand(-8, 8), p.y - 2, '#d4e5ee', 4);
        }
      }
      input.jumpEdge = false;
      if (input.shoot) tryShoot();
      if (input.grenadeEdge && p.grenadeCd <= 0) {
        throwGrenade();
        input.grenadeEdge = false;
      }
      if (input.switchEdge) {
        toggleWeapon();
        input.switchEdge = false;
      }
    }
    const prevFeet = p.y;
    p.dropTimer = Math.max(0, (p.dropTimer || 0) - dt);
    p.vy += 1020 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    let landedPlatform = null;
    if (p.vy >= 0 && !p.dropTimer && S.level.platforms) {
      for (const pl of S.level.platforms) {
        if (p.x <= pl.x - 13 || p.x >= pl.x + pl.w + 13) continue;
        // Atterraggio "swept": copre sia il riposo sulla piattaforma sia le cadute
        // veloci (prima si usava una finestra fissa di 26px e si attraversava la piattaforma).
        const standing = Math.abs(prevFeet - pl.y) < 1.5;
        const crossed = prevFeet <= pl.y + 1 && p.y >= pl.y;
        if (standing || crossed) { landedPlatform = pl; break; }
      }
    }
    if (p.y >= GROUND) {
      if (!p.onGround && p.vy > 170) {
        SoundEngine.land();
        for (let i = 0; i < 3; i++) smokePuff(p.x + rand(-8, 8), GROUND - 2, '#e6d5b0', 4);
      }
      p.y = GROUND;
      p.vy = 0;
      p.onGround = true;
      p.platform = null;
    } else if (landedPlatform) {
      if (!p.onGround && p.vy > 170) SoundEngine.land();
      p.y = landedPlatform.y;
      p.vy = 0;
      p.onGround = true;
      p.platform = landedPlatform;
    } else {
      p.onGround = false;
      p.platform = null;
    }
    const minX = S.camera.x + 16;
    const maxX = Math.min(S.level.width - 25, S.camera.x + W - 25);
    if (p.x < minX) { p.x = minX; p.vx = Math.max(0, p.vx); }
    if (p.x > maxX) { p.x = maxX; p.vx = Math.min(0, p.vx); }
    p.animT += dt * (3 + Math.abs(p.vx) / 38);
    if (p.onGround && Math.abs(p.vx) > 90 && Math.random() < dt * 11) {
      addParticle({
        type: 'smoke', x: p.x - p.facing * rand(11, 20), y: p.y - rand(1, 4),
        vx: -p.facing * rand(8, 26), vy: rand(-18, -4),
        life: rand(.25, .5), maxLife: .5, size: rand(2, 4.5),
        color: '#e6d5b0', gravity: -4
      });
    }
    if (p.weaponSwitchFlash > 0 && Math.random() < dt * 12) {
      addParticle({ type: 'spark', x: p.x + rand(-12, 12), y: p.y - rand(28, 60), vx: rand(-20, 20), vy: rand(-30, 5), life: .35, size: 2, color: '#ffc84b', gravity: 20 });
    }
    if (p.health < 30 && Math.random() < dt * 6) {
      addParticle({ type: 'spark', x: p.x + rand(-8, 8), y: p.y - rand(20, 60), vx: rand(-8, 8), vy: rand(-30, -8), life: .35, size: 1.5, color: '#ef367f', gravity: -12 });
    }
  }

  function toggleWeapon() {
    const p = S.player;
    if (p && p.character === 'rocco') {
      showToast('BULLONIERA SEMPRE CARICA — NIENTE MASCARA PER ROCCO', 1400);
      return;
    }
    if (!p || p.mascaraAmmo <= 0 || p.mascaraTime <= 0) {
      SoundEngine.uiMove();
      return;
    }
    p.weapon = p.weapon === 'mascara' ? 'lipstick' : 'mascara';
    p.weaponSwitchFlash = .4;
    SoundEngine.uiMove();
    showToast(p.weapon === 'mascara' ? 'MASCARA GATLING EQUIPAGGIATA' : 'ROSSETTO LASER EQUIPAGGIATO', 1200);
  }

  function throwGrenade() {
    const p = S.player;
    const remote = p.character === 'rocco';
    if (p.grenades <= 0) {
      showToast(remote ? 'TELECOMANDI ESAURITI — CERCA UN COLLEGA' : 'CIPRIA ESAURITA — CERCA UN BANCHETTO', 1000);
      SoundEngine.uiMove();
      return;
    }
    p.grenades--;
    p.grenadeCd = remote ? .62 : .48;
    S.grenades.push({
      kind: remote ? 'remote' : 'powder',
      x: p.x + p.facing * 18, y: p.y - 50,
      vx: p.facing * (p.crouching ? 160 : remote ? 205 : 220), vy: -245,
      rot: 0, spin: p.facing * 6, life: remote ? 1.25 : .95, bounces: 0
    });
    if (remote) {
      addParticle({ type: 'text', x: p.x, y: p.y - 72, vx: 0, vy: -26, life: .7, size: 5, color: '#9fd7ff', text: 'CAMBIO CANALE!', gravity: 0 });
      if (Math.random() < .65) SoundEngine.say('rocco_remote', 'Cambio canale!', { priority: 1, subtitle: false });
    }
    SoundEngine.grenadeThrow();
  }

  function respawnPlayer() {
    const p = S.player;
    const x = clamp(S.camera.x + (S.bossActive ? 120 : 170), S.camera.x + 40, S.camera.x + W - 60);
    p.x = x; p.y = GROUND; p.vx = 0; p.vy = 0;
    p.health = p.maxHealth;
    p.dead = false;
    p.invuln = 2.2;
    p.grenades = Math.max(p.grenades, p.character === 'rocco' ? 4 : 6);
    p.weapon = p.config ? p.config.weapon : 'lipstick';
    p.mascaraAmmo = 0;
    p.mascaraTime = 0;
    p.weaponAmmo = 0;
    p.weaponTime = 0;
    p.anger = 0;
    p.angerTime = 0;
    p.fireCd = .2;
    S.eBullets = [];
    clearInput();
    addRing(p.x, GROUND - 30, '#51c7a9', 30, .5);
    for (let i = 0; i < 8; i++) smokePuff(p.x + rand(-18, 18), GROUND - rand(0, 40), '#51c7a9', 7);
    showToast(p.character === 'rocco' ? 'RIMPIAZZO OPERATIVO — BULLONIERA CARICA' : 'RIMPIAZZO OPERATIVO — ROSSETTO CARICO', 1800);
    SoundEngine.checkpoint();
  }

  function damagePlayer(amount, sourceX, kind) {
    const p = S.player;
    if (!p || p.dead || p.invuln > 0) return;
    const taken = amount * diff().dmgTaken * (p.character === 'rocco' ? .9 : 1);
    p.health -= taken;
    p.invuln = 1.08;
    if (p.character === 'rocco') {
      p.anger = Math.min(3, (p.anger || 0) + 1);
      p.angerTime = 6;
      if (p.anger === 1) playerBark('rocco_angry', 'Permaloso io? Adesso ti faccio vedere.', { priority: 1 });
    }
    S.combo = 0;
    S.comboTimer = 0;
    S.shake = Math.max(S.shake, 5);
    SoundEngine.playerHurt();
    addParticle({
      type: 'text', x: p.x, y: p.y - 68, vx: 0, vy: -45, gravity: 22,
      life: .8, maxLife: .8, size: 8, color: '#ef367f',
      text: choose(['AHI!', 'MA CHE...!', 'NO!', 'EHI!']), rot: -.06
    });
    sparkBurst(p.x, p.y - 36, 8, '#ef367f', 145);
    if (sourceX != null) p.vx = (p.x < sourceX ? -1 : 1) * 130;
    if (p.health <= 0) {
      p.health = 0;
      loseLife();
    }
  }

  function loseLife() {
    const p = S.player;
    if (p.dead) return;
    p.dead = true;
    p.respawnTimer = 1.55;
    p.vy = -180;
    p.onGround = false;
    S.lives--;
    explodeAt(p.x, p.y - 32, 48, true);
    for (let i = 0; i < 3; i++) {
      addParticle({ type: 'heart', x: p.x, y: p.y - 30, vx: rand(-70, 70), vy: rand(-120, -50), life: 1, size: 5, color: '#ff90b8', gravity: 250 });
    }
    if (S.lives <= 0) {
      S.endTimer = 1.75;
    } else {
      showToast('VITA PERSA — ' + S.lives + ' RIMPIAZZI DISPONIBILI', 1600);
    }
  }

  /* =========================================================
     AGGIORNAMENTO PROIETTILI / GRANATE / PICK-UP
     ========================================================= */
  function updatePlayerBullets(dt) {
    for (let i = S.bullets.length - 1; i >= 0; i--) {
      const b = S.bullets[i];
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.trail = (b.trail || 0) + dt;
      if (b.trail > (b.heavy ? .03 : .055)) {
        b.trail = 0;
        addParticle({
          type: 'bulletTrail', x: b.x, y: b.y, vx: rand(-8, 8), vy: rand(-8, 8),
          life: .14, size: b.heavy ? 2.5 : 1.7,
          color: b.heavy ? '#4d2c4e' : '#ff90b8', gravity: 0
        });
      }
      let hit = false;
      if (S.bossActive && S.boss && S.boss.state !== 'dying' && !S.boss.invuln) {
        const hb = getBossHitbox();
        if (hb && b.x > hb.x && b.x < hb.x + hb.w && b.y > hb.y && b.y < hb.y + hb.h) {
          hitBoss(b.damage, b.x, b.y, b.heavy);
          hit = true;
        }
      }
      if (!hit) {
        for (const e of S.enemies) {
          if (!e.alive) continue;
          const left = e.x - e.w * .55, right = e.x + e.w * .55;
          if (b.x > left && b.x < right && b.y > e.y - e.h && b.y < e.y - 3) {
            hitEnemy(e, b.damage, b.heavy, b.x, b.y);
            hit = true;
            break;
          }
        }
      }
      if (!hit) {
        for (const prop of S.props) {
          if (!prop.alive || !prop.destructible) continue;
          if (b.x > prop.x - prop.w * .5 && b.x < prop.x + prop.w * .5 && b.y > GROUND - prop.h && b.y < GROUND) {
            hitProp(prop, b.damage);
            hit = true;
            break;
          }
        }
      }
      if (hit || b.life <= 0 || b.x < S.camera.x - 40 || b.x > S.camera.x + W + 40) S.bullets.splice(i, 1);
    }
  }

  function hitEnemy(e, damage, heavy, bx, by) {
    // v2.0 — armor (es. merkel resistente): riduce i danni in arrivo
    let dmg = damage * (e.armor || 1);
    // v2.0 — scudo del programma SOGEI ("installazione in corso")
    if (e.shieldHp > 0) {
      e.shieldHp -= dmg;
      sparkBurst(bx, by, 4, '#9fd7ff', 90);
      addRing(bx, by, '#9fd7ff', 12, .2);
      if (SoundEngine.enemyHit) SoundEngine.enemyHit();
      if (e.shieldHp <= 0) {
        e.shieldHp = 0;
        addParticle({ type: 'text', x: e.x, y: e.y - e.h - 14, vx: 0, vy: -30, life: .9, size: 6, color: '#9fd7ff', text: 'SCUDO ROTTO!', gravity: 0 });
        sparkBurst(e.x, e.y - e.h * .5, 12, '#9fd7ff', 160);
        e.hitFlash = .18;
      }
      return;
    }
    e.hp -= dmg;
    e.hitFlash = .12;
    if (heavy) e.slowTimer = Math.max(e.slowTimer, 2.4);
    sparkBurst(bx, by, 3, heavy ? '#e8d6ff' : '#ffc84b', 80);
    SoundEngine.enemyHit();
    addRing(bx, by, heavy ? '#c598e0' : '#ff90b8', 7, .17);
    if (e.hp <= 0) killEnemy(e);
  }

  function killEnemy(e) {
    if (!e.alive) return;
    e.alive = false;
    const p = S.player;
    S.combo++;
    S.comboBest = Math.max(S.comboBest, S.combo);
    S.comboTimer = 2.5;
    const mult = comboMultiplier();
    const points = Math.round(e.score * mult * scoreMul());
    S.score += points;
    S.kills++;
    explodeAt(e.x, e.y - 26, e.type === 'boomer' ? 38 : 30, e.type === 'boomer');
    scorePopup(e.x, e.y - 50, points);
    if (e.type === 'pretender') {
      for (let i = 0; i < 4; i++) addParticle({ type: 'heart', x: e.x + rand(-10, 10), y: e.y - 35, vx: rand(-80, 80), vy: rand(-130, -40), life: rand(.6, 1.1), size: rand(3, 6), color: '#ff90b8', gravity: 150 });
    } else if (e.type === 'utente' || e.type === 'boomer' || e.type === 'finanziere'
      || e.type === 'merkel' || e.type === 'collega' || e.type === 'formatore') {
      for (let i = 0; i < 5; i++) addParticle({ type: 'paper', x: e.x + rand(-12, 12), y: e.y - 38, vx: rand(-90, 90), vy: rand(-180, -40), life: rand(.7, 1.4), size: rand(4, 8), color: e.type === 'finanziere' ? '#ffe8a3' : '#fff8e7', gravity: 380, spin: rand(-8, 8) });
    } else if (e.type === 'bottiglia') {
      for (let i = 0; i < 6; i++) addParticle({ type: 'debris', x: e.x, y: e.y - 30, vx: rand(-120, 120), vy: rand(-200, -60), gravity: 600, life: rand(.5, .9), size: rand(2, 5), color: choose(['#2a6db5', '#9fd7ff', '#b7e36a']), rot: rand(0, TAU), spin: rand(-8, 8) });
    } else if (e.type === 'francese') {
      for (let i = 0; i < 4; i++) addParticle({ type: 'debris', x: e.x, y: e.y - 40, vx: rand(-80, 80), vy: rand(-160, -40), gravity: 500, life: rand(.5, .9), size: rand(3, 6), color: '#d9a25a', rot: rand(0, TAU), spin: rand(-7, 7) });
    } else if (['software', 'programma', 'bug', 'errore', 'crash', 'computer'].includes(e.type)) {
      // v2.0 — frammenti digitali verdi/ciano
      for (let i = 0; i < 6; i++) addParticle({ type: 'debris', x: e.x, y: e.y - 30, vx: rand(-140, 140), vy: rand(-220, -60), gravity: 620, life: rand(.5, 1), size: rand(2, 5), color: choose(['#8fd14f', '#9fd7ff', '#b7e36a', '#ff5b9d']), rot: rand(0, TAU), spin: rand(-9, 9) });
    }
    maybeEnemyQuip(e);
    const loot = rollEnemyLoot();
    if (loot && p) {
      // v2.3.7 — drop casuale per livello (scontrini bonus inclusi).
      spawnPickupAt(loot, e.x);
    }
    if (p && p.character === 'rocco' && Math.random() < .3) {
      spawnPickupAt('pensierino', e.x + rand(-8, 8));
    }
  }

  function comboMultiplier() {
    return clamp(1 + Math.floor(Math.max(0, S.combo - 1) / 3), 1, 8);
  }

  function hitProp(prop, damage) {
    if (!prop.destructible || !prop.alive) return;
    prop.hp -= damage;
    prop.flash = .1;
    prop.shake = .14;
    sparkBurst(prop.x, GROUND - prop.h * .5, 3, '#c87b1e', 80);
    if (prop.hp <= 0) {
      prop.alive = false;
      explodeAt(prop.x, GROUND - prop.h * .5, prop.type === 'stall' ? 44 : 28, prop.type === 'stall');
      for (let i = 0; i < 5; i++) {
        addParticle({
          type: 'debris', x: prop.x + rand(-18, 18), y: GROUND - prop.h * .4,
          vx: rand(-110, 110), vy: rand(-170, -30), gravity: 620,
          life: rand(.5, 1), size: rand(2, 5),
          color: prop.type === 'stall' ? '#fff8e7' : '#8d5016', rot: rand(0, TAU), spin: rand(-7, 7)
        });
      }
      S.score += Math.round(50 * scoreMul());
      if (prop.loot) {
        if (prop.loot === 'points') {
          const bonus = Math.round(350 * scoreMul());
          S.score += bonus;
          scorePopup(prop.x, GROUND - 50, bonus, '#ffc84b');
          for (let i = 0; i < 4; i++) addParticle({ type: 'star', x: prop.x, y: GROUND - 25, vx: rand(-50, 50), vy: rand(-160, -80), life: .8, size: rand(3, 5), color: '#ffc84b', gravity: 200 });
        } else {
          spawnPickupAt(prop.loot, prop.x);
        }
      }
    }
  }

  function explodeRemote(x, y) {
    SoundEngine.powder();
    explodeAt(x, y, 42, false);
    triggerScreenFlash();
    S.shake = Math.max(S.shake, 4);
    addRing(x, y, '#9fd7ff', 64, .45);
    for (let i = 0; i < 7; i++) smokePuff(x + rand(-36, 36), y + rand(-24, 12), choose(['#9fd7ff', '#e8f6ff', '#ffc84b']), 12);
    addParticle({ type: 'text', x, y: y - 18, vx: 0, vy: -34, life: .9, size: 7, color: '#9fd7ff', text: 'CANALE 3', gravity: 0 });
    for (const e of S.enemies) {
      if (!e.alive) continue;
      if (Math.abs(e.x - x) < 88 && Math.abs(e.y - 30 - y) < 95) {
        hitEnemy(e, 24, true, e.x, e.y - 35);
        e.stunTimer = Math.max(e.stunTimer, 2.6);
        e.windup = 0;
        e.attackCd = Math.max(e.attackCd, 1.1);
      }
    }
    if (S.bossActive && S.boss && !S.boss.invuln && S.boss.state !== 'dying') {
      const hb = getBossHitbox();
      if (hb && x > hb.x - 20 && x < hb.x + hb.w + 20 && y > hb.y - 20) {
        hitBoss(38, x, y, true);
        S.boss.stunTimer = Math.max(S.boss.stunTimer || 0, 1.1);
      }
    }
  }

  function updateGrenades(dt) {
    for (let i = S.grenades.length - 1; i >= 0; i--) {
      const gr = S.grenades[i];
      gr.life -= dt;
      gr.vy += 760 * dt;
      gr.x += gr.vx * dt;
      gr.y += gr.vy * dt;
      gr.rot += gr.spin * dt;
      if (gr.y > GROUND - 8) {
        gr.y = GROUND - 8;
        if (Math.abs(gr.vy) > 60) { gr.vy *= -.38; gr.vx *= .7; gr.bounces++; SoundEngine.land(); }
        else { gr.vy = 0; gr.vx *= .8; }
      }
      if (Math.random() < dt * 20) {
        addParticle({ type: 'smoke', x: gr.x + rand(-3, 3), y: gr.y - rand(0, 5), vx: rand(-8, 8), vy: rand(-20, -4), life: .35, size: rand(2, 5), color: '#ffbfd8', gravity: -5 });
      }
      if (gr.life <= 0) {
        if (gr.kind === 'remote') explodeRemote(gr.x, gr.y - 7);
        else explodePowder(gr.x, gr.y - 7);
        S.grenades.splice(i, 1);
      }
    }
  }

  function explodePowder(x, y) {
    SoundEngine.powder();
    explodeAt(x, y, 54, false);
    triggerScreenFlash();
    S.shake = Math.max(S.shake, 5);
    for (let i = 0; i < 8; i++) {
      smokePuff(x + rand(-45, 45), y + rand(-30, 15), choose(['#ffbfd8', '#ff90b8', '#fff8e7']), 16);
    }
    addRing(x, y, '#ff90b8', 70, .5);
    for (const e of S.enemies) {
      if (!e.alive) continue;
      if (Math.abs(e.x - x) < 92 && Math.abs(e.y - 30 - y) < 100) {
        hitEnemy(e, 30, true, e.x, e.y - 35);
        e.stunTimer = Math.max(e.stunTimer, 3);
        e.windup = 0;
        e.attackCd = Math.max(e.attackCd, 1.2);
      }
    }
    if (S.bossActive && S.boss && !S.boss.invuln && S.boss.state !== 'dying') {
      const hb = getBossHitbox();
      if (hb && x > hb.x - 20 && x < hb.x + hb.w + 20 && y > hb.y - 20) {
        hitBoss(45, x, y, true);
        S.boss.stunTimer = Math.max(S.boss.stunTimer || 0, 1.2);
      }
    }
    S.eBullets = S.eBullets.filter(b => Math.abs(b.x - x) > 70);
  }

  function updateEBullets(dt) {
    const p = S.player;
    for (let i = S.eBullets.length - 1; i >= 0; i--) {
      const b = S.eBullets[i];
      b.life -= dt;
      b.t = (b.t || 0) + dt;
      if (b.kind === 'heart') {
        b.x += b.vx * dt;
        b.y = b.baseY + Math.sin(b.t * 7) * 14;
      } else if (b.kind === 'phone') {
        b.x += b.vx * dt;
        b.y = GROUND - 16 + Math.sin(b.t * 4) * 2;
      } else if (b.kind === 'ticket') {
        b.x += b.vx * dt;
        b.y = b.baseY + Math.sin(b.t * 5) * 3;
      } else {
        b.vy += (b.gravity || 0) * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.rot += (b.spin || 0) * dt;
        if (b.kind === 'rose' && Math.random() < dt * 16) {
          addParticle({ type: 'heart', x: b.x, y: b.y, vx: rand(-10, 10), vy: rand(-15, 0), life: .35, size: 2, color: '#ff90b8', gravity: 0 });
        }
        if ((b.kind === 'cap' || b.kind === 'money') && b.y >= GROUND - 7 && b.vy > 0
          && (b.bounces || 0) < (b.kind === 'money' ? 1 : 2)) {
          // v2.0 — il tappo rimbalza due volte prima di scoppiare
          b.bounces = (b.bounces || 0) + 1;
          b.y = GROUND - 8;
          b.vy = -265;
          b.vx *= .82;
          sparkBurst(impactXSafe(b), GROUND - 8, 3, '#9fd7ff', 90);
          SoundEngine.bottlePop ? SoundEngine.bottlePop() : SoundEngine.land();
        } else if (b.y >= GROUND - 7 && b.vy > 0) {
          const impactX = b.x;
          if (b.kind === 'orb') enemyExplode(impactX, GROUND - 12, 52, 15);
          else if (b.kind === 'ink') enemyExplode(impactX, GROUND - 10, 30, 9, '#9c62c8');
          else if (b.kind === 'rose') enemyExplode(impactX, GROUND - 12, 32, 8, '#ff5b9d');
          else if (b.kind === 'cloud') {
            // v2.0 — la nube tossica resta a terra come area a danno continuo
            S.hazards.push({
              kind: 'toxic', x: clamp(impactX, S.camera.x + 30, S.camera.x + W - 30),
              width: 96, telegraph: 0, active: 3.6, timer: 0,
              damage: 5, tick: .55, hit: false, color: '#8fd14f'
            });
            for (let i = 0; i < 7; i++) smokePuff(impactX + rand(-26, 26), GROUND - rand(4, 30), '#8fd14f', 14);
            SoundEngine.bottlePop ? SoundEngine.bottlePop() : SoundEngine.land();
          } else if (b.kind === 'pan' || b.kind === 'pizza') {
            enemyExplode(impactX, GROUND - 12, 34, 10, '#ffc84b');
          } else if (b.kind === 'cap') {
            enemyExplode(impactX, GROUND - 12, 30, 9, '#9fd7ff');
            SoundEngine.bottlePop ? SoundEngine.bottlePop() : SoundEngine.land();
          } else if (b.kind === 'austerity') {
            enemyExplode(impactX, GROUND - 12, 32, 9, '#9fd7ff');
          } else if (b.kind === 'baguette') {
            enemyExplode(impactX, GROUND - 12, 28, 8, '#ffc84b');
          } else if (b.kind === 'window' || b.kind === 'error') {
            enemyExplode(impactX, GROUND - 12, 34, 10, '#ff5b9d');
            if (SoundEngine.crashError) SoundEngine.crashError();
          } else if (b.kind === 'money') {
            enemyExplode(impactX, GROUND - 12, 26, 8, '#b7e36a');
            if (SoundEngine.moneyRain) SoundEngine.moneyRain();
          } else { sparkBurst(impactX, GROUND - 6, 6, '#ffc84b', 110); SoundEngine.land(); }
          S.eBullets.splice(i, 1);
          continue;
        }
      }
      // le casse e i banchetti fanno da copertura distruggibile
      let blocked = false;
      for (const prop of S.props) {
        if (!prop.alive || !prop.destructible) continue;
        if (b.x > prop.x - prop.w * .5 && b.x < prop.x + prop.w * .5 && b.y > GROUND - prop.h && b.y < GROUND) {
          hitProp(prop, b.kind === 'orb' ? 18 : 9);
          sparkBurst(b.x, b.y, 5, '#ffc84b', 100);
          blocked = true;
          break;
        }
      }
      if (blocked) {
        S.eBullets.splice(i, 1);
        continue;
      }
      if (!p.dead && p.invuln <= 0 && b.x > p.x - 12 && b.x < p.x + 12 && b.y > p.y - (p.crouching ? p.h * .7 : p.h) && b.y < p.y) {
        damagePlayer(b.damage, b.x, b.kind);
        S.eBullets.splice(i, 1);
        continue;
      }
      if (b.life <= 0 || b.x < S.camera.x - 90 || b.x > S.camera.x + W + 90) S.eBullets.splice(i, 1);
    }
  }


  function impactXSafe(b) { return b.x; }
  function enemyExplode(x, y, radius, damage, color = '#ffc84b') {
    explodeAt(x, y, radius, false);
    if (!S.player.dead && S.player.invuln <= 0) {
      const dx = S.player.x - x, dy = (S.player.y - 28) - y;
      if (dx * dx + dy * dy < radius * radius) damagePlayer(damage, x, 'explosion');
    }
  }

  function updatePickups(dt) {
    const p = S.player;
    for (let i = S.pickups.length - 1; i >= 0; i--) {
      const it = S.pickups[i];
      if (!it.alive) { S.pickups.splice(i, 1); continue; }
      it.life += dt;
      if (!it.landed) {
        it.vy += 500 * dt;
        it.y += it.vy * dt;
        if (it.y >= it.baseY) { it.y = it.baseY; it.vy = 0; it.landed = true; }
      }
      const bobY = it.y + Math.sin(S.time * 3 + it.phase) * 2.5;
      if (!p.dead && Math.abs(p.x - it.x) < 27 && Math.abs(p.y - 25 - bobY) < 44) {
        collectPickup(it);
        it.alive = false;
        S.pickups.splice(i, 1);
      }
    }
  }

  function spawnPickupAt(type, x) {
    S.pickups.push(makePickup(type, clamp(x, 20, S.level.width - 20), GROUND - 27, true));
  }

  function collectPickup(it) {
    const p = S.player;
    S.score += Math.round(150 * scoreMul());
    SoundEngine.pickup(it.type === 'health' ? 'health' : 'power');
    addRing(it.x, it.y, it.type === 'health' ? '#51c7a9' : '#ffc84b', 24, .35);
    if (it.type === 'health') {
      p.health = Math.min(p.maxHealth, p.health + 35);
      const healthLines = S.character === 'rocco'
        ? [['ESPRESSO DOPPIO', 'Energia ripristinata. Il porto può attendere.', 'health'],
           ['BORRACCIA DOGANALE', 'Acqua, sali e orgoglio. Rocco approva.', 'pickup_health2']]
        : [['ESPRESSO DOPPIO', 'Energia ripristinata. Il porto può attendere.', 'health'],
           ['RIPRESA LAMPO', 'Rossetto salvo, pratica ancora aperta.', 'pickup_health1']];
      const [ht, hs, hk] = choose(healthLines);
      announce(ht, hs, hk, '#51c7a9', 2);
      for (let i = 0; i < 6; i++) addParticle({ type: 'spark', x: it.x, y: it.y, vx: rand(-60, 60), vy: rand(-120, -30), life: .6, size: 2.5, color: '#51c7a9', gravity: 90 });
    } else if (it.type === 'mascara') {
      if (p.character === 'rocco') {
        p.regalia = (p.regalia || 0) + 1;
        p.health = Math.min(p.maxHealth, p.health + 18);
        announce('PENSIERINO', 'Rocco incassa il trucco e lo rivende. La nipotina approva.', null, '#9fd7ff', 2.1);
        return;
      }
      p.mascaraAmmo = Math.min(320, p.mascaraAmmo + 130);
      p.mascaraTime = Math.max(p.mascaraTime, 28);
      p.weapon = 'mascara';
      p.weaponSwitchFlash = .6;
      announce('MASCARA GATLING!', 'Inchiostro nero rallentante. Premi H per alternare.', 'mascara', '#c598e0', 2.8);
      for (let i = 0; i < 10; i++) addParticle({ type: 'star', x: it.x, y: it.y, vx: rand(-90, 90), vy: rand(-160, -40), life: .8, size: rand(2, 4), color: choose(['#c598e0', '#ffc84b', '#ff90b8']), gravity: 200 });
    } else if (it.type === 'telecomando') {
      p.grenades = Math.min(15, p.grenades + 3);
      announce('TELECOMANDI +3', 'Pile incluse. Il direttore cambia canale.', 'rocco_remote', '#9fd7ff', 2);
    } else if (it.type === 'panino') {
      p.health = Math.min(p.maxHealth, p.health + 35);
      announce('PANINO', 'Pane, tonno e cipolla. Rocco approva.', null, '#ffc84b', 2);
      for (let i = 0; i < 6; i++) addParticle({ type: 'spark', x: it.x, y: it.y, vx: rand(-60, 60), vy: rand(-120, -30), life: .6, size: 2.5, color: '#ffc84b', gravity: 90 });
    } else if (it.type === 'grenade') {
      p.grenades = Math.min(15, p.grenades + 3);
      announce('CIPRIA +3', 'Piumini esplosivi freschi di giornata.', 'powder', '#ffc84b', 2);
    } else if (it.type === 'spritzGun') {
      p.weapon = 'spritz';
      p.weaponAmmo = 54;
      p.weaponTime = 45;
      p.weaponSwitchFlash = .6;
      p.mascaraAmmo = 0; p.mascaraTime = 0;
      announce('SPRITZ SPRING', 'Tre bollicine per colpo. La riviera è servita.', null, '#ff845d', 2.4);
      SoundEngine.pickup('power');
    } else if (it.type === 'timbro' || it.type === 'scontrinoGun') {
      const isStamp = it.type === 'timbro';
      p.weapon = isStamp ? 'timbro' : 'scontrino';
      p.weaponAmmo = isStamp ? 42 : 90;
      p.weaponTime = 45;
      p.weaponSwitchFlash = .6;
      p.mascaraAmmo = 0; p.mascaraTime = 0;
      const wk = isStamp
        ? (S.character === 'rocco' ? 'pickup_timbro2' : 'pickup_timbro1')
        : (S.character === 'rocco' ? 'pickup_scontrino1' : 'pickup_scontrino2');
      announce(isStamp ? 'TIMBRO D\'UFFICIO' : 'SCONTRINO RAPIDO', isStamp ? 'Tre timbri per colpo. La pratica trema.' : 'Raffica di scontrini. Il rimborso è automatico.', wk, '#ffc84b', 2.4);
      SoundEngine.pickup('power');
    } else if (it.type === 'scontrino') {
      // v2.0 — obiettivo dei livelli bonus
      const bonus = Math.round(250 * scoreMul());
      S.score += bonus;
      scorePopup(it.x, it.y - 12, bonus, '#51c7a9');
      if (S.bonus) {
        S.bonus.receipts++;
        if (SoundEngine.receipt) SoundEngine.receipt();
        if (S.bonus.receipts === S.bonus.receiptGoal) {
          announce('OBIETTIVO SCONTRINI!', S.bonus.receipts + '/' + S.bonus.receiptGoal + ': rimborso assicurato.', null, '#51c7a9', 2.4);
          S.score += Math.round(1200 * scoreMul());
        }
      }
      for (let i = 0; i < 4; i++) addParticle({ type: 'paper', x: it.x, y: it.y, vx: rand(-60, 60), vy: rand(-140, -40), gravity: 320, life: .7, size: rand(2, 4), color: '#fff8e7', rot: rand(0, TAU), spin: rand(-6, 6) });
    } else if (it.type === 'spritz') {
      // v2.0 — effetto "brillo" psichedelico temporaneo
      S.brillo = Math.max(S.brillo, 8);
      p.health = Math.min(p.maxHealth, p.health + 8);
      announce('BRILLO!', 'Spritz: la dogana si colora. Occhio alla mira.', null, '#ff845d', 2.2);
      if (SoundEngine.spritz) SoundEngine.spritz();
      for (let i = 0; i < 10; i++) addParticle({ type: 'star', x: it.x, y: it.y, vx: rand(-90, 90), vy: rand(-160, -40), life: .9, size: rand(2, 4), color: choose(['#ff5b9d', '#ffc84b', '#51c7a9', '#9fd7ff']), gravity: 200 });
    } else if (it.type === 'caffe') {
      // v2.0 — boost breve (velocità + energia)
      S.caffeBoost = Math.max(S.caffeBoost, 6);
      p.health = Math.min(p.maxHealth, p.health + 10);
      const caffeKey = S.character === 'rocco' ? 'pickup_caffe1' : 'pickup_caffe2';
      const caffeText = S.character === 'rocco'
        ? 'Caffè doppio: scatto e mira sveglia per 6 secondi.'
        : 'Caffè doppio: la dogana si sveglia. Filtro incluso.';
      announce('CAFFÈ', caffeText, caffeKey, '#ffc84b', 2.2);
      if (SoundEngine.pickup) SoundEngine.pickup('power');
      for (let i = 0; i < 6; i++) addParticle({ type: 'spark', x: it.x, y: it.y, vx: rand(-60, 60), vy: rand(-140, -40), life: .6, size: 2.5, color: '#ffc84b', gravity: 120 });
    } else if (it.type === 'points') {
      const bonus = Math.round(500 * scoreMul());
      S.score += bonus;
      scorePopup(it.x, it.y - 12, bonus, '#ffc84b');
    } else if (it.type === 'pensierino' || it.type === 'regalia') {
      const variant = it.variant || 'pesce';
      p.regalia = (p.regalia || 0) + 1;
      p.health = Math.min(p.maxHealth, p.health + 8);
      S.score += Math.round(300 * scoreMul());
      const labels = {
        pesce: ['PESCE PER LA NIPOTINA', 'Un pesce! La nipotina sarà contenta.', 'rocco_gift_fish'],
        mela: ['UNA MELA', 'Una mela. Gentile.', 'rocco_gift_fruit'],
        giocattolo: ['GIOCATTOLO', 'Un giocattolo! Che pensierino.', 'rocco_gift_toy']
      };
      const [title, text, key] = labels[variant] || labels.pesce;
      announce(title, text, null, '#9fd7ff', 2);
      if (Math.random() < .45) playerBark(key, text, { priority: 1 });
      if (p.regalia % 3 === 0) {
        p.health = Math.min(p.maxHealth, p.health + 20);
        p.anger = 0; p.angerTime = 0;
        announce('TRIS DI REGALIE', 'Rocco si calma. Per ora.', null, '#51c7a9', 2);
      }
      for (let i = 0; i < 7; i++) addParticle({ type: 'star', x: it.x, y: it.y, vx: rand(-70, 70), vy: rand(-140, -30), life: .7, size: rand(2, 4), color: choose(['#9fd7ff', '#ffc84b', '#ff90b8']), gravity: 180 });
    }
  }

  function updateHazards(dt) {
    const p = S.player;
    for (let i = S.hazards.length - 1; i >= 0; i--) {
      const h = S.hazards[i];
      h.timer += dt;
      if (h.telegraph > 0) {
        h.telegraph -= dt;
      } else {
        h.active -= dt;
        if (h.kind === 'toxic') {
          // v2.0 — nube tossica: danno a tick finché il giocatore resta dentro
          h.tickTimer = (h.tickTimer || 0) - dt;
          const inX = p.x > h.x - h.width * .5 && p.x < h.x + h.width * .5;
          if (!p.dead && p.invuln <= 0 && inX && h.tickTimer <= 0) {
            damagePlayer(h.damage, h.x, 'toxic');
            h.tickTimer = h.tick || .6;
          }
        } else if (!h.hit && !p.dead && p.invuln <= 0) {
          if (p.x > h.x - h.width * .5 && p.x < h.x + h.width * .5) {
            damagePlayer(h.damage, h.x, 'boss');
            h.hit = true;
          }
        }
      }
      if (h.active <= 0) S.hazards.splice(i, 1);
    }
  }

  /* =========================================================
     v2.0 — MECCANICHE LIVELLI BONUS (Pescara 6-7)
     Giorni alla fine, obiettivo scontrini, "brillo" spritz, caffè,
     sezione Fiat Tipo 3 volumi con camera veloce e sparo dal finestrino.
     ========================================================= */
  function updateBonusLevel(dt) {
    const b = S.bonus;
    const p = S.player;
    if (!b || !p || !S.level) return;
    S.brillo = Math.max(0, S.brillo - dt);
    S.caffeBoost = Math.max(0, S.caffeBoost - dt);
    // Giorni alla fine: scendono con l'avanzamento del livello (1 ogni 1/daysTotal).
    const prog = clamp((p.x - 74) / Math.max(1, S.level.width - 260), 0, 1);
    const days = Math.max(0, Math.ceil(b.daysTotal * (1 - prog)));
    if (days !== b.daysLeft) {
      b.daysLeft = days;
      if (days <= 2 && !b.ending) {
        showToast('GIORNI ALLA FINE: ' + days, 1200);
        SoundEngine.uiMove();
      }
    }
    // Sezione speciale Fiat Tipo (livello 7): parte solo a banner livello finito,
    // così intro/callout non coprono l'auto.
    if (b.carSection && S.level.carSectionX != null && !S.car
      && S.levelIntro <= .05 && p.x >= S.level.carSectionX) {
      startCarSection();
      return;
    }
    if (S.car && S.car.active) { updateCarSection(dt); return; }
    // Traguardo: fine del livello bonus (clear dedicato, nessun boss)
    if (!b.ending && p.x > S.level.width - 240) endBonusLevel();
  }

  function startCarSection() {
    const p = S.player;
    if (!p) return;
    S.car = { active: true, t: 0, duration: 18, scrollSpeed: 265, startX: S.camera.x, wheel: 0 };
    S.enemies = S.enemies.filter(e => Math.abs(e.x - p.x) < W);
    p.x = S.camera.x + 150;
    p.y = GROUND - 7;
    p.vx = 0; p.vy = 0; p.onGround = true; p.platform = null;
    p.invuln = Math.max(p.invuln, 1.2);
    S.caffeBoost = Math.max(S.caffeBoost, 1);
    // niente announce/callout: solo un toast breve dopo il banner di livello
    showToast('FIAT TIPO 3 VOLUMI · SPARA DAL FINESTRINO', 1800);
    if (SoundEngine.carEngine) SoundEngine.carEngine();
  }

  function updateCarSection(dt) {
    const car = S.car, p = S.player, lvl = S.level;
    car.t += dt;
    car.wheel += dt * 18;
    S.camera.x = clamp(S.camera.x + car.scrollSpeed * dt, 0, lvl.width - W);
    // il giocatore resta al finestrino: si può mirare e sparare, non correre
    p.x = S.camera.x + 150;
    p.y = GROUND - 7;
    p.vx = 0; p.vy = 0; p.onGround = true; p.platform = null;
    if (Math.random() < dt * 26) {
      addParticle({
        type: 'smoke', x: p.x - 120 + rand(0, 280), y: GROUND - 6 + rand(0, 26),
        vx: -rand(120, 260), vy: rand(-14, 14), life: rand(.2, .45),
        size: rand(2, 4), color: choose(['#ff90b8', '#ffc84b', '#fff8e7']), gravity: 0, world: true, alpha: .7
      });
    }
    // durante la corsa lasciamo il giocatore invulnerabile ai contatti? no: sfida normale
    if (car.t > car.duration || S.camera.x >= lvl.width - W - 1) {
      car.active = false;
      p.y = GROUND;
      endBonusLevel();
    }
  }

  function endBonusLevel() {
    const b = S.bonus;
    if (!b || b.ending || S.defeated) return;
    b.ending = true;
    const got = b.receipts || 0;
    const goal = b.receiptGoal || 0;
    if (got >= goal) {
      S.score += Math.round(2500 * scoreMul());
      announce('OBIETTIVO RAGGIUNTO!', got + ' scontrini su ' + goal + '. Rimborso approvato.', null, '#51c7a9', 2.6);
    } else {
      S.score += Math.round(got * 60 * scoreMul());
      announce('SCONTRINI INSUFFICIENTI', got + '/' + goal + '. Rimborso a rischio.', null, '#ff845d', 2.6);
    }
    finishLevel();
  }

  /* Overlay psichedelico dell'effetto "brillo" (spritz). */
  function drawBrilloOverlay() {
    if (S.brillo <= 0) return;
    const amp = clamp(S.brillo / 2, 0, 1);
    const reduce = S.settings && S.settings.reduceFlash;
    ctx.save();
    if (reduce) {
      // accessibilità: solo una leggera vignetta colourata, niente flash
      ctx.globalAlpha = .08 * amp;
      ctx.fillStyle = '#ff90b8';
      ctx.fillRect(0, 0, W, H);
    } else {
      const cols = ['rgba(255,91,157,', 'rgba(255,200,75,', 'rgba(81,199,169,', 'rgba(159,215,255,'];
      for (let i = 0; i < 4; i++) {
        ctx.globalAlpha = (.05 + .035 * Math.sin(S.time * 3 + i)) * amp;
        ctx.fillStyle = cols[i] + '.55)';
        ctx.beginPath();
        ctx.ellipse(
          W / 2 + Math.sin(S.time * .7 + i * 1.6) * 220,
          H / 2 + Math.cos(S.time * .9 + i) * 90,
          260, 120, S.time * .3 + i, 0, TAU
        );
        ctx.fill();
      }
      // onde di colore ai bordi
      for (let i = 0; i < 6; i++) {
        ctx.globalAlpha = .06 * amp;
        ctx.fillStyle = cols[i % cols.length] + '.8)';
        ctx.fillRect(0, (S.time * 40 + i * 64) % H, W, 10);
      }
    }
    ctx.restore();
  }

  /* =========================================================
     v2.0 — SEZIONE FIAT TIPO 3 VOLUMI (livello 7)
     Composizione: strada → abitacolo scuro → giocatore al finestrino →
     carrozzeria disegnata SOPRA con il finestrino ritagliato (così Adele/Rocco
     sembrano dentro l'auto, non appesi al tetto). Usa Art.tipoCar (frames 4
     animati 220x100, ax/ay 60/92) con fallback procedurale.
     ========================================================= */
  const CAR_SCREEN_X = 150;           // posizione orizzontale del finestrino
  /* Finestrino di fallback nel frame car 220x100. level-art può fornire il meta
     Art.tipoCar.window {x,y,w,h} per il foro/esposizione del giocatore: se c'è
     (e ha numeri validi) ha precedenza, altrimenti si usa questa costante. */
  const CAR_WINDOW_FALLBACK = { x: 76, y: 25, w: 76, h: 28 };
  let carFgCache = { art: null, key: null, frames: [] };

  function carWindowRect() {
    const meta = Art.tipoCar && Art.tipoCar.window;
    if (meta && [meta.x, meta.y, meta.w, meta.h].every((v) => typeof v === 'number' && isFinite(v))
      && meta.w > 0 && meta.h > 0) {
      return { x: meta.x, y: meta.y, w: meta.w, h: meta.h };
    }
    return CAR_WINDOW_FALLBACK;
  }

  function carWindowKey(win) {
    return win.x + ',' + win.y + ',' + win.w + ',' + win.h;
  }

  function carMetrics() {
    const art = Art.tipoCar;
    if (art && art.frames && art.frames.length) {
      return { art, w: art.w || 220, h: art.h || 100, ax: art.ax != null ? art.ax : 60, ay: art.ay != null ? art.ay : 92 };
    }
    return { art: null, w: 220, h: 100, ax: 60, ay: 92 };
  }

  /* Cache dei frame auto con il finestrino "bucato" (destination-out).
     La chiave di cache include il rettangolo finestrino: se Art.tipoCar.window
     cambia (hot-reload/override) i frame vengono rigenerati. */
  function getCarFgFrames(art) {
    const win = carWindowRect();
    const key = carWindowKey(win);
    if (carFgCache.art === art && carFgCache.key === key && carFgCache.frames.length === art.frames.length) {
      return carFgCache.frames;
    }
    const frames = [];
    for (const frame of art.frames) {
      const c = document.createElement('canvas');
      c.width = art.w || frame.width;
      c.height = art.h || frame.height;
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.drawImage(frame, 0, 0);
      g.globalCompositeOperation = 'destination-out';
      g.fillRect(win.x, win.y, win.w, win.h);
      g.globalCompositeOperation = 'source-over';
      frames.push(c);
    }
    carFgCache = { art, key, frames };
    return frames;
  }

  function carScreenPos() {
    const m = carMetrics();
    // allinea il centro del finestrino (meta o fallback) al giocatore
    const win = carWindowRect();
    const center = win.x + win.w / 2;
    return { m, win, dx: Math.round(CAR_SCREEN_X - center), dy: Math.round(GROUND - m.ay) };
  }

  /* Passo 1: strada e abitacolo scuro (prima del giocatore). */
  function drawCarSectionBack() {
    const car = S.car;
    if (!car || !car.active) return;
    const t = S.time;
    // strada che scorre veloce
    ctx.fillStyle = 'rgba(8,6,14,.35)';
    ctx.fillRect(0, GROUND - 14, W, H - GROUND + 14);
    for (let i = 0; i < 14; i++) {
      const x = W - ((t * 900 + i * 72) % (W + 160));
      ctx.globalAlpha = .3 + (i % 3) * .12;
      ctx.fillStyle = i % 2 ? '#ffc84b' : '#fff8e7';
      ctx.fillRect(x, GROUND - 4, 52, 2);
      ctx.globalAlpha = 1;
    }
    for (let i = 0; i < 6; i++) {
      const y = 96 + i * 26;
      const len = 26 + (i % 3) * 22;
      ctx.globalAlpha = .08 + (i % 3) * .05;
      ctx.fillStyle = i % 2 ? '#9fd7ff' : '#fff8e7';
      ctx.fillRect(W - 40 - len, y, len, 2);
      ctx.globalAlpha = 1;
    }
    // abitacolo scuro visibile dal finestrino (dietro al giocatore)
    const { dx, dy, win } = carScreenPos();
    const wx = dx + win.x, wy = dy + win.y;
    ctx.fillStyle = '#14161e';
    ctx.fillRect(wx - 2, wy - 2, win.w + 4, win.h + 6);
    ctx.fillStyle = '#232833';
    ctx.fillRect(wx - 2, wy + win.h - 5, win.w + 4, 5);
    // sedile/cruscotto stilizzati
    ctx.fillStyle = '#1c2029';
    ctx.fillRect(wx + 4, wy + 12, 22, 14);
    ctx.fillStyle = '#0d0f14';
    ctx.beginPath(); ctx.arc(wx + win.w - 12, wy + 15, 6, 0, TAU); ctx.fill();
    // piccolo volante
    ctx.strokeStyle = '#0d0f14'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(wx + 20, wy + 19, 6, 0, TAU); ctx.stroke();
    // strumentazione accesa (tachimetro)
    ctx.fillStyle = 'rgba(143,209,79,.5)';
    ctx.fillRect(wx + 30, wy + 6, 8, 2);
    ctx.fillRect(wx + 44, wy + 6, 5, 2);

  }

  /* Passo 2 (dopo il giocatore): carrozzeria sopra, finestrino bucato e vetro. */
  function drawCarSectionFront() {
    const car = S.car;
    if (!car || !car.active) return;
    const t = S.time;
    const { m, dx, dy, win } = carScreenPos();
    const wx = dx + win.x, wy = dy + win.y;
    if (m.art) {
      const frames = getCarFgFrames(m.art);
      const fr = frames[Math.floor(t * 9) % frames.length];
      // ombra a terra
      ctx.globalAlpha = .3;
      ctx.fillStyle = '#0b0812';
      ctx.beginPath(); ctx.ellipse(dx + 110, GROUND - 2, 96, 6, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.drawImage(fr, dx, dy);
    } else {
      // fallback procedurale: carrozzeria grigia con finestrino bucato
      ctx.fillStyle = '#a9b6c1';
      ctx.fillRect(dx + 14, dy + 28, 184, 54);
      ctx.fillStyle = '#8a97a4';
      ctx.beginPath();
      ctx.moveTo(dx + 24, dy + 46); ctx.lineTo(dx + 66, dy + 44);
      ctx.lineTo(dx + 80, dy + 30); ctx.lineTo(dx + 126, dy + 28);
      ctx.lineTo(dx + 146, dy + 46); ctx.lineTo(dx + 168, dy + 50);
      ctx.lineTo(dx + 202, dy + 54); ctx.lineTo(dx + 208, dy + 62);
      ctx.lineTo(dx + 210, dy + 76); ctx.lineTo(dx + 206, dy + 82);
      ctx.lineTo(dx + 14, dy + 82); ctx.closePath(); ctx.fill();
      // tetto e montanti attorno al finestrino (meta o fallback)
      ctx.fillStyle = '#a9b6c1';
      ctx.fillRect(dx + win.x - 6, dy + win.y - 3, win.w + 12, 5);
      ctx.fillRect(dx + win.x - 8, dy + win.y, 8, win.h);
      ctx.fillRect(dx + win.x + win.w, dy + win.y, 8, win.h);
      ctx.fillRect(dx + win.x - 2, dy + win.y + win.h, win.w + 4, 34);
      // ruote
      for (const off of [{ x: 48, y: 77 }, { x: 172, y: 77 }]) {
        ctx.fillStyle = '#16181c';
        ctx.beginPath(); ctx.arc(dx + off.x, dy + off.y, 15, 0, TAU); ctx.fill();
        ctx.fillStyle = '#a7adb3';
        ctx.beginPath(); ctx.arc(dx + off.x, dy + off.y, 7, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#3a3f44'; ctx.lineWidth = 2;
        for (let k = 0; k < 4; k++) {
          const a = car.wheel + k / 4 * Math.PI;
          ctx.beginPath(); ctx.moveTo(dx + off.x, dy + off.y);
          ctx.lineTo(dx + off.x + Math.cos(a) * 13, dy + off.y + Math.sin(a) * 13); ctx.stroke();
        }
      }
      // paraurti/stripe
      ctx.fillStyle = '#41505f';
      ctx.fillRect(dx + 20, dy + 66, 184, 3);
    }
    // vetro del finestrino (leggera tinta) + cornice
    ctx.globalAlpha = .16;
    ctx.fillStyle = '#9fd7ff';
    ctx.fillRect(wx, wy, win.w, win.h);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(11,8,18,.8)'; ctx.lineWidth = 2;
    ctx.strokeRect(wx + 1, wy + 1, win.w - 2, win.h - 2);
    // riflesso
    ctx.globalAlpha = .18;
    ctx.fillStyle = '#fff8e7';
    ctx.beginPath();
    ctx.moveTo(wx + 10, wy + win.h - 4);
    ctx.lineTo(wx + 30, wy + 4);
    ctx.lineTo(wx + 38, wy + 4);
    ctx.lineTo(wx + 18, wy + win.h - 4);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    // velocità: linee davanti all'auto
    for (let i = 0; i < 8; i++) {
      const y = 120 + i * 22;
      const len = 22 + (i % 4) * 16;
      ctx.globalAlpha = .1 + (i % 3) * .06;
      ctx.fillStyle = i % 2 ? '#9fd7ff' : '#fff8e7';
      ctx.fillRect(W - 20 - len, y, len, 2);
      ctx.globalAlpha = 1;
    }
  }

  function updateCombo(dt) {
    if (S.comboTimer > 0) {
      S.comboTimer -= dt;
      if (S.comboTimer <= 0) S.combo = 0;
    }
  }

  function updateCamera(dt) {
    if (!S.level || !S.player) return;
    // nella sezione Fiat Tipo la camera scorre da sola (vedi updateCarSection)
    if (S.car && S.car.active) return;
    let target;
    if (S.bossActive && S.level.arena != null) target = S.level.arena;
    else target = clamp(S.player.x - 250, 0, S.level.width - W);
    S.camera.x = lerp(S.camera.x, target, 1 - Math.exp(-5.5 * dt));
  }

  /* =========================================================
     BOSS
     ========================================================= */
  /* v2.0 — anagrafica boss: testi, chiavi voce (fallback TTS per i nuovi),
     musica, bounty e altezza del fumetto. Un solo punto da estendere. */
  const BOSS_VOICES = {
    octo: {
      music: 'boss1', speakY: 158, color: '#c598e0', bounty: 3500,
      warnKey: 'octo', warn: 'Attenzione! Polpo mutante!',
      toast: 'ALLARME MOLO 3 — POLPO IN AVVICINAMENTO',
      introKey: 'octo_intro', intro: 'Blub! Nessuno supera il molo senza il timbro del polpo!',
      rageKey: 'octo_rage', rage: 'Basta! Vi avvolgo tutti!',
      lowKey: 'octo_low', low: 'Il mio passaporto è invincibile!',
      deathKey: 'octo_death', death: 'Glu... glu... la pratica è respinta...',
      deathLine: 'Il polpo è fuori servizio.'
    },
    mecha: {
      music: 'boss2', speakY: 188, color: '#ffc84b', bounty: 6000,
      warnKey: 'mecha', warn: 'Attenzione! Mecha San Nicola!',
      toast: 'ALLARME BASILICA — MECHA SAN NICOLA ATTIVO',
      introKey: 'mecha_intro', intro: 'Fermi! San Nicola non approva questa pratica!',
      rageKey: 'mecha_rage', rage: 'Fase due: ira celeste!',
      lowKey: 'mecha_low', low: 'Il patrono protegge i miei circuiti!',
      deathKey: 'mecha_death', death: 'Errore... la pratica è... evasa...',
      deathLine: 'Mecha San Nicola: sistema in tilt.'
    },
    direttore: {
      music: 'boss3', speakY: 165, color: '#ffc84b', bounty: 9000,
      warnKey: 'dir_intro', warn: 'Attenzione! Il Mega Direttore Territoriale!',
      toast: 'PIANO ALTO — IL DIRETTORE HA APERTO LA PRATICA',
      introKey: 'dir_intro', intro: 'Lei è in ritardo di tre settimane. Mi firmi la presenza.',
      rageKey: 'dir_rage', rage: 'Fase due: riorganizzazione!',
      lowKey: 'dir_low', low: 'Non posso andare in pensione adesso!',
      deathKey: 'dir_death', death: 'La pratica è... archiviata...',
      deathLine: 'Il Direttore è stato trasferito. In pensione.'
    },
    /* v2.0 — LIV. 4 ROMA */
    cesare: {
      music: 'bossRoma', speakY: 200, color: '#ffc84b', bounty: 11000,
      warnKey: 'cesare_warn', warn: 'Attenzione! Giulio Cesare, patrizio snob!',
      toast: 'PIAZZA MASTAI — IL PATRIZIO HA APERTO IL PAPIRO',
      introKey: 'cesare_intro', intro: 'Lei è in ritardo di duemila anni. Mi firmi il papiro.',
      rageKey: 'cesare_rage', rage: 'DECRETO! D’ora in poi timbro solo io!',
      lowKey: 'cesare_low', low: 'Il mio cursus honorum non finisce qui!',
      deathKey: 'cesare_death', death: 'Et tu... pratica? La mia toga è... archiviata...',
      deathLine: 'Il patrizio è stato sfiduciato. SPQR: Senato e Popolo Rimandano la Pratica.'
    },
    /* v2.0 — LIV. 5 BRUXELLES */
    ursula: {
      music: 'bossEuropa', speakY: 200, color: '#9fd7ff', bounty: 12000,
      warnKey: 'ursula_warn', warn: 'Attenzione! Ursula von der Leyen, Presidente della Commissione!',
      toast: 'BERLAYMONT — LA COMMISSIONE HA APERTO LA PROCEDURA',
      introKey: 'ursula_intro', intro: 'La sua pratica non rispetta il regolamento (CE) n. 1/2026.',
      rageKey: 'ursula_rage', rage: 'Green Deal d’emergenza! Regolamenti a pioggia!',
      lowKey: 'ursula_low', low: 'La Commissione non si arrende: è nel mandato!',
      deathKey: 'ursula_death', death: 'La procedura è... archiviata... in tutte le lingue...',
      deathLine: 'La Commissione ha ritirato la proposta: Bruxelles è libera.'
    },
    /* v2.0 — LIV. 8 SOGEI */
    ceo: {
      music: 'bossSogei', speakY: 200, color: '#b7e36a', bounty: 15000,
      warnKey: 'ceo_warn', warn: 'Attenzione! L’ex CEO SOGEI, evaso e incatenato!',
      toast: 'SERVER ROOM — IL BOSS FINALE HA APERTO LA VALIGETTA',
      introKey: 'ceo_intro', intro: 'Lei non ha i permessi. Io ho le manette. E i milioni.',
      rageKey: 'ceo_rage', rage: 'ARRESTO! Licenzio tutti, pure lei!',
      lowKey: 'ceo_low', low: 'Ho il fondo nero: non finisce qui!',
      deathKey: 'ceo_death', death: 'I miei... milioni... sono... nei server...',
      deathLine: 'Il CEO è ai domiciliari. Le mazzette sono sequestrate.'
    }
  };

  function bossVoice(kind) { return BOSS_VOICES[kind] || BOSS_VOICES.octo; }

  function bossMusicKey() {
    if (S.level && S.level.bossMusic) return S.level.bossMusic;
    return bossVoice(S.level && S.level.boss).music;
  }

  function bossSpeak(key, text, opts = {}) {
    const b = S.boss;
    if (!b || !text) return;
    const voice = b.kind ? bossVoice(b.kind) : null;
    if (opts.rageTrigger) b.saidRage = true;
    let qy = GROUND - (voice ? voice.speakY : 188);
    // se un callout (es. DECRETO) è a schermo, abbassa il fumetto per non sovrapporlo
    if (S.callout) qy = Math.max(qy, 174);
    S.quip = {
      text, x: b.x, y: qy,
      life: 2.6, maxLife: 2.6,
      color: voice ? voice.color : '#ffc84b'
    };
    SoundEngine.say(key, text, {
      priority: opts.priority == null ? 2 : opts.priority,
      force: !!opts.force,
      subtitle: false
    });
  }

  function startBoss() {
    if (S.bossActive || !S.level || !S.level.boss) return;
    S.bossActive = true;
    S.bossIntro = 2.5;
    S.bossBgBlend = 0;
    const level = S.level;
    const voice = bossVoice(level.boss);
    S.enemies.forEach(e => {
      explodeAt(e.x, e.y - 25, 24, false);
    });
    S.enemies = [];
    S.eBullets = [];
    S.hazards = [];
    S.pendingSpawns = [];
    S.boss = makeBoss(level.boss);
    S.shake = Math.max(S.shake, 8);
    triggerScreenFlash();
    /* Musica boss: chiave del livello con fallback su una traccia boss v1 finché
       level-audio non ha aggiunto bossRoma/bossEuropa/bossSogei. */
    setSceneSafe(bossMusicKey(), bossMusicFallback(level.boss));
    SoundEngine.alarm();
    SoundEngine.say(voice.warnKey, voice.warn, { force: true, priority: 3 });
    showToast(voice.toast, 2600);
    // v2.0 — Adele commenta l'ingresso del boss con una battuta social
    if (S.character !== 'rocco' && S.player) {
      const extras = (PLAYER_BARKS[S.character] && PLAYER_BARKS[S.character].bossExtra)
        || (PLAYER_BARKS.adele && PLAYER_BARKS.adele.bossExtra) || null;
      if (extras && extras.length) {
        const [key, text] = choose(extras);
        SoundEngine.say(key, text, { priority: 1, subtitle: false });
      }
    }
  }

  /* Bilanciamento boss v1.2 (prima → dopo):
     octo:      460 HP → 760 HP (scontro troppo breve: ~5s di fuoco continuo)
     mecha:    1450 HP → 1380 HP + fase 2 a 55% (2s invulnerabile) — resta il più lungo
     direttore:1650 HP → 1520 HP, fase 2 a 50% con pattern più rapido
     v2.0 — cesare/ursula/ceo: 1650/1750/1900 HP con fase 2 dedicata.
     Le HP base vengono scalate per difficoltà (bossHp: facile .8 / normale 1 / difficile 1.3). */
  const BOSS_BASE_HP = { octo: 760, mecha: 1380, direttore: 1520, cesare: 1650, ursula: 1750, ceo: 1900 };
  const BOSS_INTRO_TIME = { octo: 2.6, mecha: 2.9, direttore: 3.1, cesare: 3.0, ursula: 3.0, ceo: 3.2 };
  const BOSS_X_OFFSET = { octo: 505, mecha: 515, direttore: 455, cesare: 440, ursula: 445, ceo: 450 };
  function makeBoss(kind) {
    const baseHp = Math.round((BOSS_BASE_HP[kind] || 1000) * diff().bossHp);
    const base = {
      kind, state: 'intro', timer: BOSS_INTRO_TIME[kind] || 2.9,
      attack: null, invuln: true, hitFlash: 0, phase: 1,
      bob: 0, contactCd: 0, deathTick: 0, emerge: 0,
      x: S.level.arena + (BOSS_X_OFFSET[kind] || 480),
      stunTimer: 0, voiceCd: 0,
      saidIntro: false, saidRage: false, saidLow: false, saidDeath: false,
      hp: baseHp, maxHp: baseHp
    };
    base.name = S.level.bossName;
    base.sub = S.level.bossSub;
    return base;
  }

  function getBossHitbox() {
    const b = S.boss;
    if (!b) return null;
    if (b.kind === 'octo') {
      const hbX = b.x - 128, hbY = GROUND - 228;
      return { x: hbX, y: hbY, w: 256, h: 220 };
    }
    if (b.kind === 'direttore') return { x: b.x - 150, y: GROUND - 296, w: 300, h: 288 };
    if (b.kind === 'cesare') return { x: b.x - 120, y: GROUND - 262, w: 240, h: 254 };
    if (b.kind === 'ursula') return { x: b.x - 112, y: GROUND - 266, w: 224, h: 258 };
    if (b.kind === 'ceo') return { x: b.x - 118, y: GROUND - 272, w: 236, h: 264 };
    return { x: b.x - 112, y: 20, w: 222, h: 280 };
  }

  function updateBoss(dt) {
    const b = S.boss;
    if (!b) return;
    b.bob += dt;
    b.contactCd = Math.max(0, b.contactCd - dt);
    b.hitFlash = Math.max(0, b.hitFlash - dt);
    b.stunTimer = Math.max(0, (b.stunTimer || 0) - dt);
    b.voiceCd = Math.max(0, (b.voiceCd || 0) - dt);
    if (b.kind === 'octo') b.emerge = clamp(b.emerge + dt * .65, 0, 1);

    if (b.state === 'dying') {
      b.timer -= dt;
      b.deathTick -= dt;
      if (b.deathTick <= 0) {
        b.deathTick = b.kind === 'octo' ? .19 : .15;
        const ex = b.x - S.camera.x + rand(-80, 80);
        const ey = b.kind === 'octo' ? rand(110, 285) : rand(40, 285);
        explodeAt(ex + S.camera.x, ey, rand(25, 42), Math.random() < .28);
        // le esplosioni sono in coordinate mondo
        S.particles[S.particles.length - 1].world = true;
      }
      if (b.timer <= 0) {
        b.state = 'dead';
        finishLevel();
      }
      return;
    }

    if (b.state === 'intro') {
      b.timer -= dt;
      if (b.timer <= 0) {
        b.state = 'idle';
        b.timer = .9;
        b.invuln = false;
        if (!b.saidIntro) {
          b.saidIntro = true;
          const voice = bossVoice(b.kind);
          bossSpeak(voice.introKey, voice.intro, { priority: 2 });
        }
      }
      return;
    }

    if (b.kind === 'mecha') {
      updateMechaBoss(dt);
    } else if (b.kind === 'direttore') {
      updateDirettoreBoss(dt);
    } else if (b.kind === 'cesare') {
      updateCesareBoss(dt);
    } else if (b.kind === 'ursula') {
      updateUrsulaBoss(dt);
    } else if (b.kind === 'ceo') {
      updateCeoBoss(dt);
    } else {
      updateOctoBoss(dt);
      if (!b.saidRage && b.hp <= b.maxHp * .5) {
        b.saidRage = true;
        bossSpeak(bossVoice('octo').rageKey, bossVoice('octo').rage, { priority: 2 });
      }
    }
    if (!b.saidLow && b.hp <= b.maxHp * .25) {
      b.saidLow = true;
      const voice = bossVoice(b.kind);
      bossSpeak(voice.lowKey, voice.low, { priority: 2 });
    }
    if (b.contactCd <= 0 && !S.player.dead && S.player.invuln <= 0) {
      const hb = getBossHitbox();
      if (hb && S.player.x > hb.x - 30 && S.player.x < hb.x + hb.w + 20 && S.player.y > hb.y + hb.h - 40) {
        damagePlayer(b.kind === 'octo' ? 14 : b.kind === 'direttore' ? 18 : 17, b.x, 'boss');
        b.contactCd = 1.2;
      }
    }
  }

  function updateOctoBoss(dt) {
    const b = S.boss;
    const p = S.player;
    const rate = diff().bossRate;
    if (b.stunTimer > 0) return;
    if (b.state === 'idle') {
      b.timer -= dt * rate;
      if (b.timer <= 0) {
        const phase2 = b.hp < b.maxHp * .5;
        const attacks = phase2 ? ['ink', 'slam', 'bubbles', 'summon', 'ink'] : ['ink', 'slam', 'bubbles', 'slam'];
        b.attack = choose(attacks);
        b.state = 'windup';
        b.timer = b.attack === 'slam' ? .7 : b.attack === 'summon' ? .85 : .95;
        b.attackFrame = b.attack;
        spawnBossInkCharge();
        if (b.voiceCd <= 0) {
          b.voiceCd = 11;
          bossSpeak(b.attack === 'ink' || b.attack === 'bubbles' ? 'octo_ink' : 'octo_attack',
            b.attack === 'ink' || b.attack === 'bubbles' ? 'Inchiostro doganale!' : 'Presa tentacolare!',
            { priority: 2 });
        }
      }
      return;
    }
    if (b.state === 'windup') {
      b.timer -= dt * rate;
      if (b.timer <= 0) {
        performOctoAttack(b);
        b.state = 'recover';
        b.timer = b.hp < b.maxHp * .5 ? .8 : 1.2;
      }
      return;
    }
    if (b.state === 'recover') {
      b.timer -= dt * rate;
      if (b.timer <= 0) {
        b.state = 'idle';
        b.timer = b.hp < b.maxHp * .5 ? 1.05 : 1.5;
      }
    }
  }

  function spawnBossInkCharge() {
    const b = S.boss;
    for (let i = 0; i < 5; i++) {
      addParticle({
        type: 'inkDrip', x: b.x - 40 + rand(-24, 24), y: GROUND - 130 + rand(-32, 32),
        vx: rand(-18, 18), vy: rand(-34, 12), life: .5, size: rand(2, 5),
        color: '#9c62c8', gravity: 100
      });
    }
    SoundEngine.charge();
  }

  function performOctoAttack(b) {
    const p = S.player;
    const dir = p.x < b.x ? -1 : 1;
    if (b.attack === 'ink' || b.attack === 'bubbles') {
      const count = b.attack === 'bubbles' ? 7 : 5;
      for (let i = 0; i < count; i++) {
        const tx = p.x + rand(-80, 70);
        const dx = tx - (b.x - 40);
        const speed = rand(120, 190);
        const vy = rand(-320, -190);
        S.eBullets.push({
          kind: 'ink', x: b.x - 46, y: GROUND - 140,
          vx: clamp(dx * .7, -speed, speed), vy,
          gravity: 430, life: 4, damage: 10, size: 18, rot: 0, spin: rand(-5, 5)
        });
      }
      S.shake = Math.max(S.shake, 4);
      SoundEngine.orbLaunch();
      addParticle({ type: 'text', x: b.x, y: GROUND - 180, vx: 0, vy: -40, life: .8, size: 7, color: '#c598e0', text: 'BLURP!', gravity: 0 });
    } else if (b.attack === 'slam') {
      const positions = b.hp < b.maxHp * .5 ? [p.x - 70, p.x + 70] : [p.x];
      for (const x of positions) {
        S.hazards.push({
          kind: 'slam', x: clamp(x, S.camera.x + 30, S.camera.x + W - 30),
          width: 64, telegraph: .6, active: .4, timer: 0,
          damage: 16, hit: false, color: '#9c62c8'
        });
      }
      SoundEngine.alarm();
    } else if (b.attack === 'summon') {
      for (let i = 0; i < 2; i++) {
        spawnEnemy('pretender', S.camera.x + W - 40 - i * 46, GROUND, true);
        addRing(S.camera.x + W - 40 - i * 46, GROUND - 20, '#ff90b8', 24, .4);
      }
      SoundEngine.say('reinforce', 'Pretendenti in rinforzo!');
    }
  }

  function updateMechaBoss(dt) {
    const b = S.boss;
    const p = S.player;
    const rate = diff().bossRate;
    if (b.state === 'rage') {
      b.timer -= dt;
      b.invuln = true;
      S.shake = Math.max(S.shake, 2);
      if (Math.random() < dt * 15) {
        const sx = b.x - S.camera.x + rand(-80, 80);
        sparkBurst(sx + S.camera.x, rand(70, 260), 2, '#ff5b9d', 100);
      }
      if (b.timer <= 0) {
        b.phase = 2;
        b.state = 'idle';
        b.timer = .75;
        b.invuln = false;
        b.attack = null;
        announce('FASE DUE', 'Il Mecha si è arrabbiato. La Basilica trema.', null, '#ff5b9d', 2.2);
      }
      return;
    }
    // beam attivo
    if (b.beam && b.beam.time > 0) {
      b.beam.time -= dt;
      b.beam.tick = Math.max(0, b.beam.tick - dt);
      if (!p.dead && p.invuln <= 0 && b.beam.tick <= 0) {
        /* Bug v1.1: x2 = -20 (bordo sinistro) e il test usava x2, quindi il laser
           non colpiva mai. Il raggio va dal pastorale (x1) al bordo schermo (x2). */
        const screenX = p.x - S.camera.x;
        const inBeamX = screenX < b.beam.x1 && screenX > b.beam.x2;
        const inBeamY = p.y > b.beam.y - 17 && p.y - p.h < b.beam.y + 20;
        if (inBeamX && inBeamY) {
          damagePlayer(14, b.x, 'beam');
          b.beam.tick = .55;
        }
      }
      if (Math.random() < dt * 35) {
        addParticle({
          type: 'spark', x: b.beam.x1 + S.camera.x - rand(0, 280), y: b.beam.y + rand(-12, 12),
          vx: rand(-120, 30), vy: rand(-60, 60), life: .22, size: rand(1, 3),
          color: choose(['#ffe6a3', '#ffc84b', '#ff5b9d']), gravity: 0
        });
      }
    }
    if (b.stunTimer > 0) return;
    if (b.state === 'idle') {
      b.timer -= dt * rate;
      if (b.timer <= 0) {
        const attacks = b.phase === 2
          ? ['laser', 'orbs', 'columns', 'halo', 'laser', 'orbs']
          : ['laser', 'orbs', 'halo', 'orbs'];
        b.attack = choose(attacks);
        b.state = 'windup';
        b.timer = b.attack === 'laser' ? .95 : b.attack === 'columns' ? .9 : .8;
        // rimuovi ripetizioni troppo ravvicinate
        if (b.attack === b.lastAttack && b.phase === 1) b.timer += .2;
        b.lastAttack = b.attack;
        if (b.voiceCd <= 0) {
          b.voiceCd = 12;
          bossSpeak(b.attack === 'laser' ? 'mecha_laser' : 'mecha_orbs',
            b.attack === 'laser' ? 'Penitenza laser!' : 'Decime e tributi!', { priority: 2 });
        }
        SoundEngine.charge();
        addParticle({ type: 'text', x: b.x + 70, y: 65, vx: 0, vy: -5, life: .8, size: 6, color: '#ffc84b', text: '!', gravity: 0 });
      }
      return;
    }
    if (b.state === 'windup') {
      b.timer -= dt * rate;
      if (b.timer <= 0) {
        performMechaAttack(b);
        b.state = 'recover';
        b.timer = b.phase === 2 ? .8 : 1.15;
      }
      return;
    }
    if (b.state === 'recover') {
      b.timer -= dt * rate;
      if (b.timer <= 0) {
        b.state = 'idle';
        b.timer = b.phase === 2 ? .7 : 1.25;
      }
    }
  }

  function updateDirettoreBoss(dt) {
    const b = S.boss;
    const rate = diff().bossRate * (b.speedMul || 1);
    if (b.stunTimer > 0) return;
    if (b.phase === 1 && b.hp <= b.maxHp * .5) {
      b.phase = 2;
      b.saidRage = true;
      b.speedMul = 1.25;
      S.shake = Math.max(S.shake, 10);
      triggerScreenFlash();
      bossSpeak('dir_rage', 'Fase due: riorganizzazione!', { priority: 3, force: true });
      announce('RIORGANIZZAZIONE', 'Il Direttore ha spostato tutto. Di nuovo.', null, '#ffc84b', 2.4);
    }
    if (b.state === 'idle') {
      b.timer -= dt * rate;
      if (b.timer <= 0) {
        const attacks = b.phase === 2
          ? ['pratiche', 'timbro', 'trasferimento', 'riunione', 'pratiche']
          : ['pratiche', 'timbro', 'riunione', 'trasferimento'];
        b.attack = choose(attacks);
        b.state = 'windup';
        b.timer = b.attack === 'trasferimento' ? .92 : 1.0;
        if (b.voiceCd <= 0) {
          b.voiceCd = 13;
          const line = b.attack === 'pratiche' ? ['dir_pratiche', 'Pratiche! Pratiche ovunque!']
            : b.attack === 'timbro' ? ['dir_timbro', 'Timbro io, decido io!']
            : b.attack === 'trasferimento' ? ['dir_trasferimento', 'Trasferimento d’ufficio! Via, al piano terra!']
            : ['dir_intro', 'Lei è in ritardo di tre settimane. Mi firmi la presenza.'];
          bossSpeak(line[0], line[1], { priority: 2 });
        }
        SoundEngine.charge();
      }
      return;
    }
    if (b.state === 'windup') {
      b.timer -= dt * rate;
      if (b.timer <= 0) {
        performDirettoreAttack(b);
        b.state = 'recover';
        b.timer = b.phase === 2 ? .7 : .95;
      }
      return;
    }
    if (b.state === 'recover') {
      b.timer -= dt * rate;
      if (b.timer <= 0) { b.state = 'idle'; b.timer = b.phase === 2 ? .7 : 1.2; }
    }
  }

  function performDirettoreAttack(b) {
    const p = S.player;
    if (!p) return;
    if (b.attack === 'pratiche') {
      const n = b.phase === 2 ? 6 : 4;
      for (let i = 0; i < n; i++) {
        S.eBullets.push({
          kind: 'paper', x: b.x - 80 - i * 5, y: GROUND - 120 - i * 7,
          vx: -120 - i * 12, vy: -180 - i * 22, gravity: 390, life: 3.4,
          rot: 0, spin: -5 - i, damage: 10, size: 18
        });
      }
      addParticle({ type: 'text', x: b.x - 80, y: GROUND - 220, vx: 0, vy: -40, life: .9, size: 7, color: '#ffc84b', text: 'PRATICHE!', gravity: 0 });
      SoundEngine.orbLaunch();
    } else if (b.attack === 'timbro') {
      const xs = b.phase === 2 ? [p.x - 90, p.x, p.x + 90] : [p.x - 55, p.x + 55];
      for (const x of xs) {
        S.hazards.push({
          kind: 'slam', x: clamp(x, S.camera.x + 30, S.camera.x + W - 30),
          width: 62, telegraph: .62, active: .4, timer: 0,
          damage: 16, hit: false, color: '#ffc84b'
        });
      }
      S.shake = Math.max(S.shake, 8);
      SoundEngine.alarm();
    } else if (b.attack === 'trasferimento') {
      triggerScreenFlash();
      S.shake = Math.max(S.shake, 10);
      const px = clamp(b.x - 265, S.camera.x + 50, S.camera.x + W - 50);
      p.x = px; p.y = GROUND; p.vy = 0;
      addRing(p.x, p.y - 30, '#ffc84b', 48, .55);
      addParticle({ type: 'text', x: p.x, y: p.y - 90, vx: 0, vy: -40, life: 1.1, size: 7, color: '#ffc84b', text: 'TRASFERITO!', gravity: 0 });
      SoundEngine.teleport ? SoundEngine.teleport() : SoundEngine.uiMove();
    } else if (b.attack === 'riunione') {
      for (let i = 0; i < 2; i++) {
        spawnEnemy('collega', clamp(b.x - 90 - i * 42, S.camera.x + 30, S.camera.x + W - 40), GROUND, true);
      }
      addParticle({ type: 'text', x: b.x - 80, y: GROUND - 220, vx: 0, vy: -34, life: .9, size: 6, color: '#9fd7ff', text: 'RIUNIONE!', gravity: 0 });
      SoundEngine.orbLaunch();
    }
  }

  /* =========================================================
     v2.0 — BOSS LIV. 4: GIULIO CESARE, PATRIZIO SNOB
     Attacchi: direttive (ventaglio di fogli), circolari (pioggia di fogli
     telegrafata), norme (timbro gigante a terra), leggi (colonne "articolo 1
     comma 2"). Fase 2 DECRETO: pattern combinato + 2s di invulnerabilità.
     ========================================================= */
  function updateCesareBoss(dt) {
    const b = S.boss;
    const p = S.player;
    const rate = diff().bossRate * (b.speedMul || 1);
    const voice = bossVoice('cesare');
    // Fase 2 al 50%: DECRETO
    if (b.phase === 1 && b.hp <= b.maxHp * .5) {
      b.phase = 2;
      b.state = 'rage';
      b.timer = 2.0;
      b.invuln = true;
      b.saidRage = true;
      b.speedMul = 1.22;
      S.eBullets = [];
      S.hazards = [];
      S.shake = Math.max(S.shake, 12);
      triggerScreenFlash();
      bossSpeak(voice.rageKey, voice.rage, { force: true, priority: 3 });
      announce('DECRETO', 'Il patrizio timbra tutto. E pure voi.', null, '#ffc84b', 2.4);
      addParticle({ type: 'ring', x: b.x - S.camera.x + S.camera.x, y: GROUND - 150, vx: 0, vy: 0, life: .8, maxLife: .8, size: 90, color: '#ffc84b', gravity: 0 });
      return;
    }
    if (b.state === 'rage') {
      b.timer -= dt;
      b.invuln = true;
      S.shake = Math.max(S.shake, 2);
      if (Math.random() < dt * 16) {
        sparkBurst(b.x - S.camera.x + S.camera.x + rand(-90, 90), rand(60, 270), 2, '#ffc84b', 120);
      }
      if (b.timer <= 0) {
        b.state = 'idle';
        b.timer = .7;
        b.invuln = false;
        b.attack = null;
      }
      return;
    }
    if (b.stunTimer > 0) return;
    if (b.state === 'idle') {
      b.timer -= dt * rate;
      if (b.timer <= 0) {
        const attacks = b.phase === 2
          ? ['direttive', 'circolari', 'norme', 'leggi', 'direttive', 'leggi']
          : ['direttive', 'circolari', 'norme', 'leggi'];
        b.attack = choose(attacks);
        b.state = 'windup';
        b.timer = (b.attack === 'leggi' ? .95 : b.attack === 'norme' ? .85 : .8) / rate;
        if (b.voiceCd <= 0) {
          b.voiceCd = 12;
          const lines = {
            direttive: ['cesare_direttive', 'Direttive a ventaglio!'],
            circolari: ['cesare_circolari', 'Circolari dal cielo!'],
            norme: ['cesare_norme', 'Timbro! Norma numero uno!'],
            leggi: ['cesare_leggi', 'Articolo uno, comma due!']
          };
          const line = lines[b.attack] || lines.direttive;
          bossSpeak(line[0], line[1], { priority: 2 });
        }
        SoundEngine.charge();
      }
      return;
    }
    if (b.state === 'windup') {
      b.timer -= dt * rate;
      if (b.timer <= 0) {
        performCesareAttack(b);
        b.state = 'recover';
        b.timer = (b.phase === 2 ? .65 : .95) / diff().bossRate;
      }
      return;
    }
    if (b.state === 'recover') {
      b.timer -= dt * rate;
      if (b.timer <= 0) {
        b.state = 'idle';
        b.phase === 2 ? (b.speedMul = 1.22) : null;
        b.timer = b.phase === 2 ? .65 : 1.1;
      }
    }
  }

  function cesareHazardX(x) {
    return clamp(x, S.camera.x + 30, S.camera.x + W - 30);
  }

  function performCesareAttack(b) {
    const p = S.player;
    if (!p) return;
    if (b.attack === 'direttive') {
      const n = b.phase === 2 ? 7 : 5;
      for (let i = 0; i < n; i++) {
        S.eBullets.push({
          kind: 'paper', x: b.x - 70 - i * 5, y: GROUND - 150 - i * 9,
          vx: -150 - i * 12, vy: -130 - i * 16, gravity: 300, life: 3.6,
          rot: 0, spin: -5 - i, damage: 10, size: 18
        });
      }
      addParticle({ type: 'text', x: b.x - 130, y: GROUND - 230, vx: 0, vy: -40, life: .9, size: 7, color: '#ffc84b', text: 'DIRETTIVE!', gravity: 0 });
      S.shake = Math.max(S.shake, 3);
      SoundEngine.orbLaunch();
    } else if (b.attack === 'circolari') {
      const xs = b.phase === 2 ? [p.x - 120, p.x, p.x + 120] : [p.x - 70, p.x + 70];
      for (const x of xs) {
        const hx = cesareHazardX(x);
        S.hazards.push({
          kind: 'circolare', x: hx, width: 26, telegraph: .78, active: .3, timer: 0,
          damage: 14, hit: false, color: '#fff8e7'
        });
        // fogli visivi che cadono sulla colonna telegrafata
        for (let k = 0; k < 3; k++) {
          S.eBullets.push({
            kind: 'paper', x: hx + rand(-14, 14), y: -20 - k * 36,
            vx: rand(-8, 8), vy: 150, gravity: 420, life: 1.6,
            rot: rand(0, TAU), spin: rand(-5, 5), damage: 0, size: 16
          });
        }
      }
      addParticle({ type: 'text', x: b.x - 120, y: GROUND - 220, vx: 0, vy: -34, life: .9, size: 6, color: '#fff8e7', text: 'CIRCOLARI!', gravity: 0 });
      SoundEngine.alarm();
    } else if (b.attack === 'norme') {
      const xs = b.phase === 2 ? [p.x - 110, p.x, p.x + 110] : [p.x - 60, p.x + 60];
      for (const x of xs) {
        S.hazards.push({
          kind: 'stamp', x: cesareHazardX(x), width: 92, telegraph: .82, active: .3, timer: 0,
          damage: 17, hit: false, color: '#ffc84b', label: 'NORMA!'
        });
      }
      S.shake = Math.max(S.shake, 7);
      // v2.0 — SFX dedicato del timbro (feature detection)
      if (SoundEngine.cesareStamp) SoundEngine.cesareStamp();
      else SoundEngine.alarm();
    } else if (b.attack === 'leggi') {
      const xs = b.phase === 2 ? [p.x - 130, p.x, p.x + 130] : [p.x - 80, p.x + 80];
      xs.forEach((x, i) => {
        S.hazards.push({
          kind: 'column', x: cesareHazardX(x), width: 44,
          telegraph: .9 + i * .08, active: .42, timer: 0,
          damage: 16, hit: false, color: '#ff90b8', label: 'ART. 1 COMMA 2'
        });
      });
      addParticle({ type: 'text', x: b.x - 110, y: GROUND - 220, vx: 0, vy: -34, life: .95, size: 6, color: '#ff90b8', text: 'LEGGE!', gravity: 0 });
      SoundEngine.laser ? SoundEngine.laser() : SoundEngine.alarm();
    }
  }

  /* =========================================================
     v2.0 — BOSS LIV. 5: URSULA VON DER LEYEN, PRESIDENTE DELLA COMMISSIONE.
     Attacchi: regolamenti (pile di fogli a ventaglio), tappi (tappi a
     rimbalzo), commissione (evoca merkel/francese), greenDeal (colonne verdi
     telegrafate). Fase 2: GREEN DEAL con pattern più rapido.
     ========================================================= */
  function updateUrsulaBoss(dt) {
    const b = S.boss;
    const p = S.player;
    const rate = diff().bossRate * (b.speedMul || 1);
    const voice = bossVoice('ursula');
    if (b.phase === 1 && b.hp <= b.maxHp * .5) {
      b.phase = 2;
      b.state = 'rage';
      b.timer = 2.0;
      b.invuln = true;
      b.saidRage = true;
      b.speedMul = 1.22;
      S.eBullets = [];
      S.hazards = [];
      S.shake = Math.max(S.shake, 12);
      triggerScreenFlash();
      bossSpeak(voice.rageKey, voice.rage, { force: true, priority: 3 });
      announce('GREEN DEAL', 'La Commissione approva la mozione d’emergenza.', null, '#8fd14f', 2.4);
      addParticle({ type: 'ring', x: b.x - S.camera.x + S.camera.x, y: GROUND - 160, vx: 0, vy: 0, life: .8, maxLife: .8, size: 100, color: '#8fd14f', gravity: 0 });
      return;
    }
    if (b.state === 'rage') {
      b.timer -= dt;
      b.invuln = true;
      S.shake = Math.max(S.shake, 2);
      if (Math.random() < dt * 16) {
        sparkBurst(b.x - S.camera.x + S.camera.x + rand(-90, 90), rand(50, 270), 2, '#8fd14f', 120);
      }
      if (b.timer <= 0) {
        b.state = 'idle';
        b.timer = .7;
        b.invuln = false;
        b.attack = null;
      }
      return;
    }
    if (b.stunTimer > 0) return;
    if (b.state === 'idle') {
      b.timer -= dt * rate;
      if (b.timer <= 0) {
        const attacks = b.phase === 2
          ? ['regolamenti', 'tappi', 'greenDeal', 'commissione', 'tappi', 'greenDeal']
          : ['regolamenti', 'tappi', 'commissione', 'greenDeal'];
        b.attack = choose(attacks);
        b.state = 'windup';
        b.timer = (b.attack === 'greenDeal' ? .95 : b.attack === 'commissione' ? .9 : .82) / rate;
        if (b.voiceCd <= 0) {
          b.voiceCd = 12;
          const lines = {
            regolamenti: ['ursula_regolamenti', 'Regolamenti! Pile di regolamenti!'],
            tappi: ['ursula_tappi', 'Tappi! Directive 2026/33 sui tappi!'],
            commissione: ['ursula_commissione', 'Riunione di commissione!'],
            greenDeal: ['ursula_greenDeal', 'Green Deal! Colonne di sostenibilità!']
          };
          const line = lines[b.attack] || lines.regolamenti;
          bossSpeak(line[0], line[1], { priority: 2 });
        }
        SoundEngine.charge();
      }
      return;
    }
    if (b.state === 'windup') {
      b.timer -= dt * rate;
      if (b.timer <= 0) {
        performUrsulaAttack(b);
        b.state = 'recover';
        b.timer = (b.phase === 2 ? .65 : .95) / diff().bossRate;
      }
      return;
    }
    if (b.state === 'recover') {
      b.timer -= dt * rate;
      if (b.timer <= 0) {
        b.state = 'idle';
        b.timer = b.phase === 2 ? .65 : 1.1;
      }
    }
  }

  function performUrsulaAttack(b) {
    const p = S.player;
    if (!p) return;
    const hazardX = (x) => clamp(x, S.camera.x + 30, S.camera.x + W - 30);
    if (b.attack === 'regolamenti') {
      const n = b.phase === 2 ? 8 : 6;
      for (let i = 0; i < n; i++) {
        S.eBullets.push({
          kind: 'paper', x: b.x - 60 - i * 4, y: GROUND - 130 - i * 12,
          vx: -145 - i * 9, vy: -250 + i * 24, gravity: 300, life: 3.8,
          rot: 0, spin: -4 - i, damage: 10, size: 18
        });
      }
      addParticle({ type: 'text', x: b.x - 120, y: GROUND - 235, vx: 0, vy: -40, life: .9, size: 7, color: '#9fd7ff', text: 'REGOLAMENTI!', gravity: 0 });
      S.shake = Math.max(S.shake, 3);
      // v2.0 — SFX dedicato ai regolamenti UE (feature detection)
      if (SoundEngine.ursulaRegulation) SoundEngine.ursulaRegulation();
      else SoundEngine.orbLaunch();
    } else if (b.attack === 'tappi') {
      const n = b.phase === 2 ? 4 : 3;
      for (let i = 0; i < n; i++) {
        S.eBullets.push({
          kind: 'cap', x: b.x - 80, y: GROUND - 90 - i * 26,
          vx: -rand(150, 235), vy: -rand(150, 250), gravity: 470, life: 3.4,
          rot: 0, spin: rand(-10, 10), damage: 11, size: 18, bounces: 0
        });
      }
      addParticle({ type: 'text', x: b.x - 110, y: GROUND - 220, vx: 0, vy: -34, life: .9, size: 6, color: '#9fd7ff', text: 'TAPPI!', gravity: 0 });
      if (SoundEngine.bottlePop) SoundEngine.bottlePop();
      else SoundEngine.orbLaunch();
    } else if (b.attack === 'commissione') {
      const kinds = ['merkel', 'francese'];
      for (let i = 0; i < 2; i++) {
        const type = choose(kinds);
        const x = clamp(b.x - 110 - i * 56, S.camera.x + 30, S.camera.x + W - 40);
        spawnEnemy(type, x, GROUND, true);
        addRing(x, GROUND - 22, '#9fd7ff', 26, .4);
      }
      addParticle({ type: 'text', x: b.x - 130, y: GROUND - 220, vx: 0, vy: -34, life: .9, size: 6, color: '#9fd7ff', text: 'COMMISSIONE!', gravity: 0 });
      SoundEngine.say('ursula_reinforce', 'Commissione in seduta!', { priority: 1, subtitle: false });
    } else if (b.attack === 'greenDeal') {
      const xs = b.phase === 2 ? [p.x - 130, p.x, p.x + 130] : [p.x - 80, p.x + 80];
      xs.forEach((x, i) => {
        S.hazards.push({
          kind: 'column', x: hazardX(x), width: 50,
          telegraph: .9 + i * .1, active: .45, timer: 0,
          damage: 17, hit: false, color: '#8fd14f', label: 'GREEN DEAL'
        });
      });
      S.shake = Math.max(S.shake, 5);
      if (SoundEngine.laser) SoundEngine.laser();
      else SoundEngine.alarm();
    }
  }

  /* =========================================================
     v2.0 — BOSS FINALE: EX CEO SOGEI.
     Attacchi: soldi (mazzette a ventaglio che rimbalzano), bonus (pioggia di
     monetine), manette (fasce/catene telegrafate a terra), licenziamento
     (evoca bug e crash). Fase 2 ARRESTO: manette ai polsi, pattern combinato.
     ========================================================= */
  function updateCeoBoss(dt) {
    const b = S.boss;
    const p = S.player;
    const rate = diff().bossRate * (b.speedMul || 1);
    const voice = bossVoice('ceo');
    if (b.phase === 1 && b.hp <= b.maxHp * .5) {
      b.phase = 2;
      b.state = 'rage';
      b.timer = 2.2;
      b.invuln = true;
      b.saidRage = true;
      b.speedMul = 1.25;
      S.eBullets = [];
      S.hazards = [];
      S.shake = Math.max(S.shake, 14);
      triggerScreenFlash();
      bossSpeak(voice.rageKey, voice.rage, { force: true, priority: 3 });
      announce('ARRESTO', 'Manette ai polsi: il CEO passa all’attacco.', null, '#b7e36a', 2.4);
      addParticle({ type: 'ring', x: b.x - S.camera.x + S.camera.x, y: GROUND - 160, vx: 0, vy: 0, life: .9, maxLife: .9, size: 110, color: '#b7e36a', gravity: 0 });
      if (SoundEngine.moneyRain) SoundEngine.moneyRain();
      return;
    }
    if (b.state === 'rage') {
      b.timer -= dt;
      b.invuln = true;
      S.shake = Math.max(S.shake, 2);
      if (Math.random() < dt * 18) {
        sparkBurst(b.x - S.camera.x + S.camera.x + rand(-100, 100), rand(50, 270), 2, '#b7e36a', 130);
      }
      if (b.timer <= 0) {
        b.state = 'idle';
        b.timer = .65;
        b.invuln = false;
        b.attack = null;
      }
      return;
    }
    if (b.stunTimer > 0) return;
    if (b.state === 'idle') {
      b.timer -= dt * rate;
      if (b.timer <= 0) {
        const attacks = b.phase === 2
          ? ['soldi', 'manette', 'bonus', 'licenziamento', 'soldi', 'manette']
          : ['soldi', 'bonus', 'manette', 'licenziamento'];
        b.attack = choose(attacks);
        b.state = 'windup';
        b.timer = (b.attack === 'manette' ? 1.0 : b.attack === 'licenziamento' ? .9 : .8) / rate;
        if (b.voiceCd <= 0) {
          b.voiceCd = 12;
          const lines = {
            soldi: ['ceo_soldi', 'Mazzette! A pioggia!'],
            bonus: ['ceo_bonus', 'Bonus! Monetine per tutti!'],
            manette: ['ceo_manette', 'Manette! Catene per la dogana!'],
            licenziamento: ['ceo_licenziamento', 'Licenziamento! Fuori tutti!']
          };
          const line = lines[b.attack] || lines.soldi;
          bossSpeak(line[0], line[1], { priority: 2 });
        }
        SoundEngine.charge();
      }
      return;
    }
    if (b.state === 'windup') {
      b.timer -= dt * rate;
      if (b.timer <= 0) {
        performCeoAttack(b);
        b.state = 'recover';
        b.timer = (b.phase === 2 ? .6 : .95) / diff().bossRate;
      }
      return;
    }
    if (b.state === 'recover') {
      b.timer -= dt * rate;
      if (b.timer <= 0) {
        b.state = 'idle';
        b.timer = b.phase === 2 ? .6 : 1.05;
      }
    }
  }

  function performCeoAttack(b) {
    const p = S.player;
    if (!p) return;
    const hazardX = (x) => clamp(x, S.camera.x + 30, S.camera.x + W - 30);
    if (b.attack === 'soldi') {
      const n = b.phase === 2 ? 7 : 5;
      for (let i = 0; i < n; i++) {
        S.eBullets.push({
          kind: 'money', x: b.x - 70 - i * 4, y: GROUND - 120 - i * 10,
          vx: -150 - i * 12, vy: -190 + i * 12, gravity: 280, life: 3.8,
          rot: 0, spin: -6 - i, damage: 11, size: 22, bounces: 0
        });
      }
      addParticle({ type: 'text', x: b.x - 120, y: GROUND - 225, vx: 0, vy: -40, life: .9, size: 7, color: '#b7e36a', text: 'SOLDI!', gravity: 0 });
      S.shake = Math.max(S.shake, 3);
      if (SoundEngine.moneyRain) SoundEngine.moneyRain();
      else SoundEngine.orbLaunch();
    } else if (b.attack === 'bonus') {
      const n = b.phase === 2 ? 14 : 10;
      for (let i = 0; i < n; i++) {
        const x = clamp(p.x + rand(-190, 190), S.camera.x + 20, S.camera.x + W - 20);
        S.eBullets.push({
          kind: 'coin', x, y: -20 - i * 26,
          vx: rand(-20, 20), vy: rand(90, 170), gravity: 520, life: 4,
          rot: rand(0, TAU), spin: rand(-8, 8), damage: 8, size: 14
        });
      }
      addParticle({ type: 'text', x: b.x - 120, y: GROUND - 225, vx: 0, vy: -34, life: .9, size: 6, color: '#ffc84b', text: 'BONUS!', gravity: 0 });
      if (SoundEngine.moneyRain) SoundEngine.moneyRain();
    } else if (b.attack === 'manette') {
      const xs = b.phase === 2 ? [p.x - 100, p.x, p.x + 100] : [p.x - 60, p.x + 60];
      for (const x of xs) {
        S.hazards.push({
          kind: 'cuff', x: hazardX(x), width: 90, telegraph: 1.0, active: .35, timer: 0,
          damage: 18, hit: false, color: '#b7e36a'
        });
      }
      addParticle({ type: 'text', x: b.x - 120, y: GROUND - 220, vx: 0, vy: -34, life: .95, size: 6, color: '#b7e36a', text: 'MANETTE!', gravity: 0 });
      S.shake = Math.max(S.shake, 4);
      SoundEngine.alarm();
    } else if (b.attack === 'licenziamento') {
      for (let i = 0; i < 2; i++) {
        const x = clamp(b.x - 120 - i * 54, S.camera.x + 30, S.camera.x + W - 40);
        spawnEnemy(i === 0 ? 'bug' : 'crash', x, GROUND, true);
        addRing(x, GROUND - 22, '#b7e36a', 26, .4);
      }
      addParticle({ type: 'text', x: b.x - 130, y: GROUND - 220, vx: 0, vy: -34, life: .9, size: 6, color: '#ff845d', text: 'LICENZIATO!', gravity: 0 });
      SoundEngine.say('ceo_fire', 'Licenziato! Fuori dai server!', { priority: 1, subtitle: false });
    }
  }

  function performMechaAttack(b) {
    const p = S.player;
    if (b.attack === 'laser') {
      /* Mecha è specchiato: il pastorale è sul lato destro dello schermo. */
      const staffX = b.x - S.camera.x + 118;
      b.beam = {
        time: b.phase === 2 ? 1.5 : 1.2,
        tick: 0,
        x1: staffX, x2: -20,
        y: GROUND - 28
      };
      SoundEngine.laser();
      S.shake = Math.max(S.shake, 7);
      triggerScreenFlash();
    } else if (b.attack === 'orbs') {
      const count = b.phase === 2 ? 5 : 3;
      for (let i = 0; i < count; i++) {
        const startX = b.x + 100 + i * 7;
        const targetX = p.x + rand(-100, 100);
        const t = 1.2;
        const vx = clamp((targetX - startX) / t, -220, 220);
        S.eBullets.push({
          kind: 'orb', x: startX, y: 120 + i * 9,
          vx, vy: -110 - i * 25, gravity: 470,
          life: 3.5, damage: 15, size: 24, rot: 0, spin: rand(-2, 2)
        });
      }
      addParticle({ type: 'text', x: b.x - S.camera.x, y: 110, vx: 0, vy: -30, life: .8, size: 7, color: '#ffc84b', text: 'SANTI NUMERI!', gravity: 0 });
      SoundEngine.orbLaunch();
    } else if (b.attack === 'columns') {
      const spots = b.phase === 2 ? [p.x - 100, p.x, p.x + 100] : [p.x - 60, p.x + 60];
      for (const x of spots) {
        S.hazards.push({
          kind: 'column', x: clamp(x, S.camera.x + 25, S.camera.x + W - 25),
          width: 48, telegraph: .8, active: .45, timer: 0,
          damage: 17, hit: false, color: '#ffc84b'
        });
      }
      SoundEngine.orbLaunch();
      S.shake = Math.max(S.shake, 3);
    } else if (b.attack === 'halo') {
      const count = b.phase === 2 ? 7 : 5;
      for (let i = 0; i < count; i++) {
        const a = Math.PI * (.45 + i / (count - 1) * .7);
        const speed = 170;
        S.eBullets.push({
          kind: 'orb', x: b.x + 120, y: 115,
          vx: -Math.cos(a) * speed, vy: -Math.sin(a) * speed + 20, gravity: 90,
          life: 4, damage: 13, size: 22, rot: 0, spin: rand(-3, 3)
        });
      }
      addParticle({ type: 'ring', x: b.x - S.camera.x + S.camera.x, y: 85, vx: 0, vy: 0, life: .6, size: 60, color: '#ffc84b', gravity: 0 });
      SoundEngine.orbLaunch();
    }
  }

  function hitBoss(damage, x, y, heavy) {
    const b = S.boss;
    if (!b || b.invuln || b.state === 'dying') return;
    b.hp -= damage;
    b.hitFlash = .1;
    sparkBurst(x, y, heavy ? 5 : 3, heavy ? '#e8d6ff' : '#ffc84b', 110);
    SoundEngine.enemyHit();
    if (b.kind === 'mecha' && b.phase === 1 && b.hp <= b.maxHp * .55 && b.state !== 'rage' && b.state !== 'dying') {
      b.state = 'rage';
      b.timer = 2.0;
      b.invuln = true;
      b.beam = null;
      b.saidRage = true;
      S.eBullets = [];
      S.hazards = [];
      S.shake = 14;
      triggerScreenFlash();
      SoundEngine.alarm();
      bossSpeak('mecha_rage', 'Fase due: ira celeste!', { force: true, priority: 3 });
      for (let i = 0; i < 20; i++) {
        sparkBurst(b.x - S.camera.x + S.camera.x + rand(-100, 100), rand(30, 280), 2, '#ff5b9d', 180);
      }
      return;
    }
    if (b.hp <= 0) {
      startBossDeath();
    }
  }

  function startBossDeath() {
    const b = S.boss;
    if (!b || b.state === 'dying') return;
    b.hp = 0;
    b.state = 'dying';
    b.timer = b.kind === 'octo' ? 3.6 : b.kind === 'direttore' ? 4.2 : 4.6;
    b.deathTick = 0;
    b.invuln = true;
    S.combo = 0;
    S.eBullets = [];
    S.hazards = [];
    S.bullets = [];
    S.grenades = [];
    S.shake = 16;
    S.hitstop = .12;
    triggerScreenFlash();
    SoundEngine.explosion(true);
    SoundEngine.stopMusic();
    const voice = bossVoice(b.kind);
    const bounty = Math.round(voice.bounty * scoreMul());
    S.score += bounty;
    scorePopup(b.x - S.camera.x + S.camera.x, GROUND - 150, bounty, '#ffc84b');
    // bonus energetici: restano raccoglibili durante l'esplosione finale
    spawnPickupAt('health', b.x - 185);
    spawnPickupAt('mascara', b.x - 135);
    spawnPickupAt('grenade', b.x - 85);
    announce('PRATICA EVASA!', voice.deathLine, null, '#ffc84b', 3.2);
    b.saidDeath = true;
    bossSpeak(voice.deathKey, voice.death, { force: true, priority: 3 });
    if (b.kind !== 'octo') {
      for (let i = 0; i < 30; i++) addParticle({ type: 'confetti', x: b.x - S.camera.x + S.camera.x + rand(-200, 200), y: rand(60, 260), vx: rand(-90, 90), vy: rand(-160, 40), life: rand(1.5, 3), maxLife: 3, size: rand(2, 5), color: choose(['#ffc84b', '#ff5b9d', '#51c7a9', '#fff8e7']), gravity: 80, rot: rand(0, TAU), spin: rand(-4, 4) });
    }
  }

  function finishLevel() {
    if (S.defeated) return;
    S.defeated = true;
    saveHighScore();
    S.enemies = [];
    S.eBullets = [];
    S.hazards = [];
    S.bullets = [];
    S.grenades = [];
    clearInput();
    setMode('levelclear');
    hideScreens();
    S.nextLevel = S.levelIndex + 1;
    // v2.0 — ultimo livello (indice 7, Incubo SOGEI) → vittoria finale
    if (S.levelIndex >= LEVELS.length - 1) {
      completeGame();
      document.body.classList.remove('playing');
      return;
    }
    const info = LEVEL_CLEAR_INFO[S.levelIndex];
    const rocco = S.character === 'rocco';
    if (info) {
      $('clear-title').textContent = info.title;
      let copy = (info.copy && (rocco ? info.copy.rocco : info.copy.adele)) || '';
      // v2.0 — usa lo stato di gioco del bonus (scontrini raccolti), non i dati statici
      if (S.bonus) copy = bonusClearCopy(S.bonus, copy);
      $('clear-copy').textContent = copy;
      // Bottone e micro-label statici in index.html: vanno aggiornati a ogni livello.
      const verbo = document.querySelector('#screen-levelclear .micro-label');
      if (verbo) verbo.textContent = info.micro;
      const nextBtn = $('btn-next-level');
      if (nextBtn) nextBtn.innerHTML = info.button + ' <span>→</span>';
      $('clear-score').textContent = formatScore(S.score);
      $('clear-combo').textContent = 'x' + S.comboBest;
      $('clear-shots').textContent = String(S.shots);
      showScreen(UI.clear);
      SoundEngine.setScene('victory');
      SoundEngine.say(info.voiceKey, info.voice, { force: true, priority: 3 });
      // v2.0 — Adele commenta il clear con una battuta social (TTS di fallback)
      if (!rocco) {
        const extras = (PLAYER_BARKS[S.character] && PLAYER_BARKS[S.character].clearExtra)
          || (PLAYER_BARKS.adele && PLAYER_BARKS.adele.clearExtra) || null;
        if (extras && extras.length) {
          const [key, text] = choose(extras);
          setTimeout(() => SoundEngine.say(key, text, { priority: 1, subtitle: false }), 900);
        }
      }
    } else {
      completeGame();
    }
    document.body.classList.remove('playing');
  }

  function completeGame() {
    setMode('victory');
    hideScreens();
    showScreen(UI.victory);
    S.score += Math.round(5000 * scoreMul());
    saveHighScore();
    saveArchiveProgress();
    const rocco = S.character === 'rocco';
    $('victory-score').textContent = formatScore(S.score);
    $('victory-record').textContent = formatScore(S.highScore);
    $('victory-rank').textContent = computeRank(S.score, S.character);
    // v2.0 — vittoria finale: tutti i boss sconfitti, da Bari a Roma, Bruxelles,
    // Pescara e SOGEI. Chiavi non nel manifest → fallback TTS con testo aggiornato.
    const vMicro = document.querySelector('#screen-victory .micro-label');
    if (vMicro) vMicro.textContent = 'ATTO FINALE · DIREZIONE CENTRALE · TUTTI I BOSS SCONFITTI';
    const vCopy = document.querySelector('#screen-victory .victory-card > p:not(.victory-quote)');
    if (vCopy) vCopy.innerHTML = 'Polpo, Mecha, Mega Direttore, Giulio Cesare, Ursula e l’ex CEO SOGEI sono in archivio. La pratica è <strong>APPROVATA</strong>: Bari, la Direzione Territoriale, Roma, Bruxelles, Pescara e la SOGEI sono salvi.'
      + (rocco ? ' Rocco ora pretende la regalia promessa e un pesce per la nipotina.' : ' Adele ha già il reel pronto: #DoganaRush #MilfLeggendaria.');
    const vQuote = document.querySelector('#screen-victory .victory-quote');
    if (vQuote) vQuote.textContent = rocco
      ? '«La pratica è chiusa. Il pesce, per la nipotina, resta un diritto.»'
      : '«Regina di Instagram, regina di Bari, regina della dogana. Non male per una milf leggendaria.»';
    SoundEngine.setScene('victory');
    SoundEngine.say(rocco ? 'victory_finale_rocco' : 'victory_finale',
      rocco
        ? 'Missione completata! Tutti i boss sono in archivio. Rocco ora pretende la regalia!'
        : 'Missione completata! Tutti i boss sono in archivio. Da Bari a Roma, da Bruxelles a Pescara fino alla SOGEI: la dogana è salva!',
      { force: true, priority: 3 });
    S.confetti = [];
    for (let i = 0; i < 90; i++) {
      S.confetti.push({
        x: rand(0, W), y: rand(-H, 0), vy: rand(30, 100), vx: rand(-30, 30),
        size: rand(2, 5), color: choose(['#ffc84b', '#ff5b9d', '#51c7a9', '#fff8e7']),
        rot: rand(0, TAU), spin: rand(-4, 4)
      });
    }
    document.body.classList.remove('playing');
  }

  function computeRank(score, character) {
    const rocco = character === 'rocco';
    if (score >= 24000) return 'LEGGENDA DELLA DOGANA';
    if (score >= 16000) return 'COMMANDANTE';
    if (score >= 10000) return rocco ? 'ISPETTORE' : 'ISPETTRICE';
    if (score >= 5000) return rocco ? 'FUNZIONARIO' : 'FUNZIONARIA';
    return 'TIROCINANTE';
  }

  function triggerGameOver() {
    if (S.mode === 'gameover') return;
    setMode('gameover');
    hideScreens();
    showScreen(UI.gameover);
    saveHighScore();
    $('gameover-score').textContent = formatScore(S.score);
    $('gameover-record').textContent = formatScore(S.highScore);
    const rocco = S.character === 'rocco';
    $('gameover-copy').textContent = S.levelIndex === 1
      ? 'La Basilica resiste. Il Mecha ha ancora un modulo da compilare. La pratica chiede vendetta.'
      : S.levelIndex === 2
        ? 'La Direzione ha respinto la pratica. Il Mega Direttore ha già spostato l’ufficio.'
        : (rocco ? 'Il porto ha vinto questa volta. Rocco chiede una regalia e una seconda possibilità.' : 'Il porto ha vinto questa volta. Il rossetto chiede vendetta.');
    SoundEngine.gameOver();
    SoundEngine.say('gameover', 'Pratica respinta. Inserisci un gettone per riprovare.', { force: true, priority: 3 });
    document.body.classList.remove('playing');
    setTimeout(() => $('btn-retry').focus(), 60);
  }

  /* =========================================================
     LOOP DI AGGIORNAMENTO
     ========================================================= */
  function updateGame(dt) {
    if (S.mode !== 'playing') return;
    S.time += dt;
    S.levelTime += dt;
    S.levelIntro = Math.max(0, S.levelIntro - dt);
    S.bossIntro = Math.max(0, S.bossIntro - dt);
    S.shake = Math.max(0, S.shake - dt * 34);
    if (S.callout) {
      S.callout.life -= dt;
      if (S.callout.life <= 0) S.callout = null;
    }
    if (S.quipCooldown > 0) S.quipCooldown = Math.max(0, S.quipCooldown - dt);
    if (S.quip) {
      S.quip.life -= dt;
      if (S.quip.life <= 0) S.quip = null;
    }
    if (S.hitstop > 0) {
      S.hitstop -= dt;
      updateParticles(dt * .35);
      return;
    }
    if (S.bossActive) S.bossBgBlend = Math.min(1, S.bossBgBlend + dt * 2.2);
    for (const pr of S.props) {
      pr.flash = Math.max(0, pr.flash - dt);
      pr.shake = Math.max(0, pr.shake - dt);
    }
    updatePlayer(dt);
    if (S.mode !== 'playing') return;
    // v2.0 — livelli bonus: giorni, scontrini, effetti e sezione Fiat Tipo
    if (S.bonus) {
      updateBonusLevel(dt);
      if (S.mode !== 'playing') return;
    }
    const barkP = S.player;
    if (barkP && !barkP.dead) {
      S.barkCd = Math.max(0, (S.barkCd || 0) - dt);
      if (!S.saidStart && S.levelIntro <= .05) {
        const b = PLAYER_BARKS[S.character] || PLAYER_BARKS.adele;
        const starts = b.starts || [b.start];
        const startLine = starts[Math.floor(Math.random() * starts.length)];
        if (playerBark(startLine[0], startLine[1], { priority: 1 })) {
          S.saidStart = true;
          S.barkCd = 26 + Math.random() * 12;
        }
      }
      if (!S.saidLow && barkP.health < barkP.maxHealth * .3) {
        const b = PLAYER_BARKS[S.character] || PLAYER_BARKS.adele;
        const lows = b.lows || [b.low];
        const lowLine = lows[Math.floor(Math.random() * lows.length)];
        if (playerBark(lowLine[0], lowLine[1], { priority: 2 })) S.saidLow = true;
      }
      if (S.barkCd <= 0 && !S.quip && !S.bossIntro) {
        const b = PLAYER_BARKS[S.character] || PLAYER_BARKS.adele;
        const line = b.idle[Math.floor(Math.random() * b.idle.length)];
        if (playerBark(line[0], line[1], { priority: 1 })) S.barkCd = 28 + Math.random() * 17;
      }
    }
    if (S.level && S.level.id === 3 && barkP && !S.saidCollega && barkP.x > 1180) {
      S.saidCollega = true;
      S.quip = { text: 'Uèèè da quanto tempo!', x: 1225, y: GROUND - 95, life: 2.8, maxLife: 2.8, color: '#ffc84b' };
      SoundEngine.say('collega1', 'Uèèè da quanto tempo!', { priority: 2, force: true, subtitle: false });
    }
    updateCamera(dt);
    triggerWaves();
    updatePendingSpawns();
    if (!S.bossActive && !S.defeated && S.level.boss && S.level.bossTrigger != null && S.player.x > S.level.bossTrigger) {
      startBoss();
      triggerScreenFlash();
      S.shake = Math.max(S.shake, 9);
    }
    updateEnemies(dt);
    // v2.0 — SOGEI: scimmie alla tastiera (SFX ambient, feature detection)
    if (S.level && S.level.customBg === 'sogei' && !S.bossActive && Math.random() < dt * .55 && SoundEngine.monkeyType) {
      SoundEngine.monkeyType();
    }
    updateBoss(dt);
    if (S.mode !== 'playing') return;
    updatePlayerBullets(dt);
    updateGrenades(dt);
    updateEBullets(dt);
    updateHazards(dt);
    updatePickups(dt);
    updateParticles(dt);
    updateCombo(dt);
    if (S.ending) {
      S.endTimer -= dt;
      if (S.endTimer <= 0) triggerGameOver();
    }
  }

  function updateTitle(dt) {
    S.titleTime += dt;
    if (S.titleParticles.length > 70) S.titleParticles.shift();
    if (Math.random() < dt * 2.4) {
      S.titleParticles.push({
        x: rand(370, 620), y: rand(120, 340),
        vx: rand(-8, 10), vy: rand(-28, -10),
        life: rand(2, 4), maxLife: 4, size: rand(2, 5),
        color: choose(['#ff90b8', '#ffc84b', '#fff8e7', '#51c7a9']),
        type: Math.random() < .35 ? 'heart' : 'spark',
        rot: rand(-.5, .5), spin: rand(-1, 1)
      });
    }
    for (let i = S.titleParticles.length - 1; i >= 0; i--) {
      const p = S.titleParticles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 4 * dt;
      p.rot += p.spin * dt;
      if (p.life <= 0) S.titleParticles.splice(i, 1);
    }
  }

  function updateVictory(dt) {
    for (const c of S.confetti) {
      c.y += c.vy * dt;
      c.x += Math.sin((c.y + c.size) * .03) * 12 * dt + c.vx * dt;
      c.rot += c.spin * dt;
      if (c.y > H + 10) { c.y = -10; c.x = rand(0, W); }
    }
    if (Math.random() < dt * 6) {
      addParticle({
        type: 'confetti', x: rand(0, W), y: -5, vx: rand(-25, 25), vy: rand(40, 100),
        life: 4, maxLife: 4, size: rand(2, 5), color: choose(['#ffc84b', '#ff5b9d', '#51c7a9', '#fff8e7']),
        gravity: 20, rot: rand(0, TAU), spin: rand(-4, 4), world: false
      });
    }
    updateParticles(dt);
  }

  /* =========================================================
     DIEGETICO — PARTICELLE / SFONDI
     ========================================================= */
  let lastLoop = 0;
  function loop(now) {
    if (!lastLoop) lastLoop = now;
    const dt = Math.min(.033, Math.max(0, (now - lastLoop) / 1000));
    lastLoop = now;
    pollGamepad();
    if (S.mode === 'title' || S.mode === 'select' || S.mode === 'levels' || S.mode === 'briefing') updateTitle(dt);
    else if (S.mode === 'playing') updateGame(dt);
    else if (S.mode === 'victory') updateVictory(dt);
    render();
    requestAnimationFrame(loop);
  }

  /* =========================================================
     RENDERING — helper
     ========================================================= */
  const PS_FONT = '"Press Start 2P", monospace';
  const VT_FONT = '"VT323", monospace';

  function drawText(text, x, y, size, color, align, shadow = true) {
    ctx.font = size + 'px ' + PS_FONT;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'top';
    if (shadow) {
      ctx.fillStyle = 'rgba(6,6,12,.9)';
      ctx.fillText(text, Math.round(x) + Math.max(1, Math.round(size * .16)), Math.round(y) + Math.max(1, Math.round(size * .16)));
    }
    ctx.fillStyle = color;
    ctx.fillText(text, Math.round(x), Math.round(y));
  }

  function pixelPanel(x, y, w, h, fill = 'rgba(6,8,16,.78)', border = 'rgba(255,248,231,.24)', accent = null) {
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.fillRect(x + 2, y + 2, w, h);
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
    if (accent) {
      ctx.fillStyle = accent;
      ctx.fillRect(x, y, 3, h);
      ctx.fillRect(x, y, w, 2);
    }
    // angoli pixel
    ctx.fillStyle = '#05060c';
    ctx.fillRect(x, y, 3, 3);
    ctx.fillRect(x + w - 3, y, 3, 3);
    ctx.fillRect(x, y + h - 3, 3, 3);
    ctx.fillRect(x + w - 3, y + h - 3, 3, 3);
  }

  function drawHeart(x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, size * .4);
    ctx.bezierCurveTo(-size, -size * .35, -size * .55, -size, 0, -size * .4);
    ctx.bezierCurveTo(size * .55, -size, size, -size * .35, 0, size * .4);
    ctx.fill();
    ctx.restore();
  }

  function drawStar(x, y, size, color, points = 4) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const a = i / (points * 2) * TAU - Math.PI / 2;
      const r = i % 2 ? size * .42 : size;
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function roundRectFill(x, y, w, h, color, r = 3) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.fill();
  }

  /* =========================================================
     TITLE / MENU
     ========================================================= */
  function renderTitle() {
    const t = S.titleTime;
    if (Art.titleScene) ctx.drawImage(Art.titleScene, 0, 0);
    else { ctx.fillStyle = '#0a1120'; ctx.fillRect(0, 0, W, H); }
    // alone
    const g = ctx.createRadialGradient(494, 210, 10, 494, 210, 185);
    g.addColorStop(0, 'rgba(255,122,167,.18)');
    g.addColorStop(.55, 'rgba(255,90,140,.07)');
    g.addColorStop(1, 'rgba(255,90,140,0)');
    ctx.fillStyle = g;
    ctx.fillRect(300, 20, 340, 340);
    // small animated gulls
    ctx.strokeStyle = 'rgba(49,36,55,.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const bx = mod(t * (20 + i * 4) + i * 210, 860) - 100;
      const by = 96 + i * 22 + Math.sin(t * 1.1 + i) * 4;
      ctx.beginPath();
      ctx.moveTo(bx - 4, by);
      ctx.quadraticCurveTo(bx - 2, by - 3, bx, by);
      ctx.quadraticCurveTo(bx + 2, by - 3, bx + 4, by);
      ctx.stroke();
    }
    // sparkles over the sea
    for (let i = 0; i < 12; i++) {
      const x = 365 + (i * 53 % 245);
      const y = 287 + (i * 17 % 46);
      ctx.globalAlpha = .18 + Math.sin(t * 2 + i) * .12;
      ctx.fillStyle = '#ffe4a3';
      ctx.fillRect(x, y, 2 + (i % 3), 1);
      ctx.globalAlpha = 1;
    }
    // large Adele showcase
    const phase = (Math.floor(t * 2.7) % 4) / 4;
    const generatedIdle = Art.generatedSpritesReady && Art.playerFrames && Art.playerFrames.idle;
    const frame = generatedIdle
      ? generatedIdle[Math.floor(t * 2.7) % generatedIdle.length]
      : Art.getPlayerFrame({ mode: 'idle', phase });
    const sc = 2.62;
    const bob = Math.sin(t * 1.8) * 1.8;
    const ax = 484, feet = 351 + bob;
    // shadow on the dock
    ctx.save();
    ctx.globalAlpha = .45;
    ctx.fillStyle = '#0a0812';
    ctx.beginPath();
    ctx.ellipse(ax, 350, 72, 12, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    // halo / rim
    ctx.save();
    ctx.globalAlpha = .2;
    ctx.fillStyle = '#ffd16f';
    ctx.beginPath();
    ctx.ellipse(ax, feet - 95, 98, 128, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(Math.round(ax), Math.round(feet));
    ctx.scale(sc, sc);
    ctx.drawImage(frame, -Art.PLAYER.ax, -Art.PLAYER.ay + 4);
    ctx.restore();
    // floating particles
    for (const p of S.titleParticles) {
      const a = clamp(p.life / 1.2, 0, 1);
      ctx.globalAlpha = a * .85;
      if (p.type === 'heart') drawHeart(p.x, p.y, p.size + 2, p.color);
      else drawStar(p.x, p.y, p.size, p.color, 4);
      ctx.globalAlpha = 1;
    }
    // little lipstick glint
    const glint = (Math.sin(t * 2.3) + 1) / 2;
    if (glint > .72) {
      ctx.globalAlpha = (glint - .72) * 2;
      drawStar(564, 196, 6, '#fff3a6', 4);
      drawStar(588, 214, 3, '#ff90b8', 4);
      ctx.globalAlpha = 1;
    }
  }

  /* =========================================================
     SFONDO DI GIOCO
     ========================================================= */
  /* v2.0 — mappa dei fondali custom: chiavi Art.bg bloccate con level-art. */
  const CUSTOM_BG_ART = {
    roma: { sky: 'romaSky', layers: [{ key: 'romaFar', factor: .12 }, { key: 'romaMid', factor: .35 }, { key: 'romaNear', factor: .6 }] },
    europa: { sky: 'europaSky', layers: [{ key: 'europaFar', factor: .12 }, { key: 'europaMid', factor: .35 }, { key: 'europaNear', factor: .6 }] },
    pescara: { sky: 'pescaraSky', layers: [{ key: 'pescaraFar', factor: .12 }, { key: 'pescaraMid', factor: .35 }, { key: 'pescaraNear', factor: .6 }] },
    pescaraNight: { sky: 'pescaraNightSky', layers: [{ key: 'pescaraNightFar', factor: .12 }, { key: 'pescaraNightMid', factor: .35 }, { key: 'pescaraNightNear', factor: .6 }] },
    sogei: { sky: 'sogeiSky', layers: [{ key: 'sogeiFar', factor: .12 }, { key: 'sogeiMid', factor: .35 }, { key: 'sogeiNear', factor: .6 }] }
  };

  /* v2.1 — feature detection degli sfondi AI (loader v2, Art.hasV2Sprite).
     isAiBg: true se il manifest PNG v2 ha fornito l'immagine AI per la chiave.
     hasBg:  la chiave esiste in Art.bg (AI o procedurale), utile per le chiavi
             nuove (direzioneExt/bossDirezione) che non hanno fallback canvas. */
  function isAiBg(key) {
    return !!(key && typeof Art.hasV2Sprite === 'function' && Art.hasV2Sprite('bg', key));
  }

  function hasBg(key) {
    return !!(key && Art.bg && Art.bg[key]);
  }

  function drawWorldBackground() {
    const lvl = S.level;
    if (lvl.customBg) {
      drawCustomBackground(lvl);
    } else if (S.bossActive) {
      const bg = Art.bg;
      const a = clamp(S.bossBgBlend, 0, 1);
      if (lvl.id === 3) {
        // v2.1 — arena boss Direzione: se il loader fornisce bossDirezione la
        // usiamo con un blend dal corridoio (stesso feeling delle altre arene);
        // altrimenti resta l'arena/corridoio procedurale di drawDirezioneBackground.
        if (hasBg(lvl.bossBg)) {
          if (a < 1) drawDirezioneBackground();
          if (a > 0) {
            ctx.globalAlpha = a;
            ctx.drawImage(bg[lvl.bossBg], 0, 0);
            ctx.globalAlpha = 1;
          }
        } else {
          drawDirezioneBackground();
        }
      } else {
        if (S.bossBgBlend < 1) drawNormalBackground(lvl);
        if (a > 0 && hasBg(lvl.bossBg)) {
          ctx.globalAlpha = a;
          ctx.drawImage(bg[lvl.bossBg], 0, 0);
          ctx.globalAlpha = 1;
        }
      }
    } else {
      drawNormalBackground(lvl);
    }
    drawGroundSafe(lvl);
    drawGroundGlow(lvl);
    if (S.bossActive) drawBossAtmosphere();
    drawWeather(lvl);
    drawHazardWarnings();
  }

  /* v2.0 — sfondi dedicati. Se level-art non ha ancora creato le chiavi Art.bg
     del livello si usa il renderer procedurale di fallback (nessun crash). */
  function drawCustomBackground(lvl) {
    const bg = Art.bg || {};
    if (S.bossActive) {
      if (bg[lvl.bossBg]) {
        ctx.drawImage(bg[lvl.bossBg], 0, 0);
        if (lvl.customBg === 'sogei') drawSogeiAmbient();
        return;
      }
      if (S.bossBgBlend < 1) drawCustomFallback(lvl, true);
      const a = clamp(S.bossBgBlend, 0, 1);
      const arenaKey = CUSTOM_BG_ART[lvl.customBg];
      if (arenaKey && a < 1) {
        ctx.globalAlpha = a;
        drawCustomFallback(lvl, true);
        ctx.globalAlpha = 1;
      }
      return;
    }
    const set = CUSTOM_BG_ART[lvl.customBg];
    /* v2.2 — FULL-SCENE anche per i livelli custom: content-art rigenera i
       *-sky.png come scene complete (edifici/primo piano inclusi), quindi se lo
       sky è un'immagine AI lo disegniamo a schermo intero e SALTIAMO i layer
       procedurali. Senza sky AI resta identico il percorso sky+layer; il boss
       arena e drawCustomAmbience/drawSogeiAmbient restano invariati.
       Override QA: bgMode:'full'|'layers', bgFullScene, bgLayers. */
    const skyAi = !!(set && isAiBg(set.sky));
    let mode = 'auto';
    if (lvl.bgFullScene === true) mode = 'full';
    else if (lvl.bgLayers === true) mode = 'layers';
    else if (lvl.bgMode === 'full' || lvl.bgMode === 'layers') mode = lvl.bgMode;
    if (mode === 'auto') mode = skyAi ? 'full' : 'layers';
    let drew = false;
    if (set && bg[set.sky]) { ctx.drawImage(bg[set.sky], 0, 0); drew = true; }
    if (set && mode !== 'full') {
      for (const layer of set.layers) {
        const img = bg[layer.key];
        if (!img) continue;
        drew = true;
        const sx = clamp(Math.floor(S.camera.x * layer.factor), 0, Math.max(0, img.width - W));
        ctx.drawImage(img, sx, 0, W, H, 0, 0, W, H);
      }
    }
    if (!drew) drawCustomFallback(lvl, false);
    else drawCustomAmbience(lvl);
    if (lvl.customBg === 'sogei') drawSogeiAmbient();
  }

  function drawCustomAmbience(lvl) {
    // pulviscolo/particelle leggere davanti ai fondali forniti da art.js
    const t = S.time;
    const palette = lvl.customBg === 'roma' ? ['#ffd572', '#fff8e7']
      : lvl.customBg === 'europa' ? ['#9fd7ff', '#fff8e7']
      : lvl.customBg === 'sogei' ? ['#8fd14f', '#9fd7ff']
      : ['#ff90b8', '#ffc84b', '#51c7a9'];
    for (let i = 0; i < 18; i++) {
      const x = mod(i * 61 + t * (3 + i % 5) - S.camera.x * .25, 700) - 30;
      const y = 60 + mod(i * 41 + t * 6, 220);
      ctx.globalAlpha = .12 + .16 * (Math.sin(t * 2 + i) * .5 + .5);
      ctx.fillStyle = palette[i % palette.length];
      ctx.fillRect(x, y, 2, 2);
      ctx.globalAlpha = 1;
    }
  }

  function drawCustomFallback(lvl, arena) {
    switch (lvl.customBg) {
      case 'roma': drawRomaFallback(arena); break;
      case 'europa': drawEuropaFallback(arena); break;
      case 'pescara': drawPescaraFallback(arena, false); break;
      case 'pescaraNight': drawPescaraFallback(arena, true); break;
      case 'sogei': drawSogeiFallback(arena); break;
      default: ctx.fillStyle = '#1b1524'; ctx.fillRect(0, 0, W, GROUND);
    }
    if (lvl.customBg === 'sogei') drawSogeiAmbient();
  }

  function drawGroundSafe(lvl) {
    const g = lvl.ground;
    if (Art.groundTiles && Art.groundTiles[g]) {
      try { Art.drawGround(ctx, g, S.camera.x); return; }
      catch (e) { /* fallback sotto */ }
    }
    if (g >= 4) { drawProceduralGround(g); return; }
    try { Art.drawGround(ctx, g, S.camera.x); }
    catch (e) { drawProceduralGround(g); }
  }

  /* v2.0 — terreni procedurali per gli stili 4–7, usati finché art.js non
     fornisce Art.groundTiles[4..7]. */
  function drawProceduralGround(style) {
    const t = S.time;
    const cam = S.camera.x;
    if (style === 4) {
      // piazza romana: sampietrini di porfido
      ctx.fillStyle = '#6d5c50'; ctx.fillRect(0, GROUND, W, H - GROUND);
      for (let row = 0; row < 4; row++) {
        for (let x = -((cam + row * 14) % 42) - 42; x < W + 42; x += 42) {
          ctx.fillStyle = (row + Math.floor((cam + x) / 42)) % 3 === 0 ? '#8a7462' : '#7b6555';
          ctx.fillRect(x + (row % 2) * 21, GROUND + row * 14, 40, 12);
          ctx.fillStyle = 'rgba(255,232,190,.12)';
          ctx.fillRect(x + (row % 2) * 21, GROUND + row * 14, 40, 2);
        }
      }
      ctx.fillStyle = '#4a3d35'; ctx.fillRect(0, GROUND, W, 2);
      ctx.fillStyle = 'rgba(255,214,140,.16)'; ctx.fillRect(0, GROUND + 1, W, 5);
    } else if (style === 5) {
      // Bruxelles: vetro/asfalto con stelle UE
      ctx.fillStyle = '#2b3440'; ctx.fillRect(0, GROUND, W, H - GROUND);
      for (let x = -((cam * .6) % 64) - 64; x < W + 64; x += 64) {
        ctx.fillStyle = 'rgba(159,215,255,.12)'; ctx.fillRect(x, GROUND, 30, 6);
        ctx.fillStyle = 'rgba(255,248,231,.06)'; ctx.fillRect(x + 34, GROUND + 8, 26, 3);
      }
      ctx.fillStyle = '#1b2430'; ctx.fillRect(0, GROUND, W, 2);
      for (let i = 0; i < 8; i++) drawStar(mod(i * 70 - cam * .5, 620) + 12, GROUND + 22, 2.6, 'rgba(255,216,102,.38)', 4);
    } else if (style === 6) {
      // Pescara: moquette psichedelica
      const cols = ['#ff5b9d', '#ffc84b', '#51c7a9', '#c598e0', '#9fd7ff'];
      ctx.fillStyle = '#2a1636'; ctx.fillRect(0, GROUND, W, H - GROUND);
      for (let i = 0; i < 16; i++) {
        const x = mod(i * 44 - cam * .9, 700) - 20;
        const a = Math.sin((cam + x) * .02 + t * 1.6) * .5 + .5;
        ctx.globalAlpha = .28 + a * .22;
        ctx.fillStyle = cols[i % cols.length];
        ctx.beginPath();
        ctx.ellipse(x, GROUND + 14 + (i % 3) * 12, 22, 8, 0, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = '#ff90b8'; ctx.fillRect(0, GROUND, W, 2);
    } else if (style === 7) {
      // SOGEI: piastrelle fredde + glitch
      ctx.fillStyle = '#141c24'; ctx.fillRect(0, GROUND, W, H - GROUND);
      for (let row = 0; row < 3; row++) {
        for (let x = -((cam + row * 20) % 56) - 56; x < W + 56; x += 56) {
          ctx.fillStyle = row % 2 ? '#1e2a34' : '#22303c';
          ctx.fillRect(x + (row % 2) * 28, GROUND + 2 + row * 18, 52, 16);
        }
      }
      ctx.fillStyle = '#0b0f14'; ctx.fillRect(0, GROUND, W, 2);
      if (Math.sin(t * 3.1) > .94) {
        ctx.fillStyle = 'rgba(143,209,79,.28)';
        ctx.fillRect(rand(0, W), GROUND, rand(20, 90), 2);
      }
      ctx.fillStyle = 'rgba(159,215,255,.14)'; ctx.fillRect(0, GROUND + 1, W, 3);
    } else {
      ctx.fillStyle = '#b9a67f'; ctx.fillRect(0, GROUND, W, H - GROUND);
    }
  }



  function drawNormalBackground(lvl) {
    if (lvl.id === 3) { drawDirezioneBackground(); return; }
    const bg = Art.bg;
    /* v2.1 — strategia scelta dal pilot: FULL-SCENE.
       Se il loader v2 ha caricato un'immagine AI per lo sky (portSky/bariSky)
       la disegniamo a schermo intero e SALTIAMO i layer procedurali
       (portFar/Mid/Near, bariFar/Mid/Near) per evitare sovrapposizioni.
       Senza sky AI resta identico il percorso procedurale a layer.
       Override espliciti per QA: bgMode:'full'|'layers', bgFullScene, bgLayers. */
    const skyAi = isAiBg(lvl.sky);
    let mode = lvl.bgMode || 'auto';
    if (lvl.bgFullScene === true) mode = 'full';
    else if (lvl.bgLayers === true) mode = 'layers';
    if (mode === 'auto') mode = skyAi ? 'full' : 'layers';
    if (bg[lvl.sky]) ctx.drawImage(bg[lvl.sky], 0, 0);
    if (mode !== 'full') {
      for (const layer of lvl.layers) {
        const img = bg[layer.key];
        if (!img) continue;
        const sx = clamp(Math.floor(S.camera.x * layer.factor), 0, Math.max(0, img.width - W));
        ctx.globalAlpha = layer.alpha == null ? 1 : layer.alpha;
        ctx.drawImage(img, sx, 0, W, H, 0, 0, W, H);
        ctx.globalAlpha = 1;
      }
    }
    drawBirds(lvl);
  }

  /* =========================================================
     v2.0 — SFONDI PROCEDURALI DI FALLBACK (usati finché art.js
     non fornisce Art.bg.roma*, europa*, pescara*, sogei* e boss*).
     ========================================================= */
  function drawRomaFallback(arena) {
    const cam = S.camera.x, t = S.time;
    // cielo romano
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, arena ? '#241a3a' : '#6f9fc4');
    sky.addColorStop(.5, arena ? '#4a2f52' : '#c9d6d2');
    sky.addColorStop(1, arena ? '#c98a4a' : '#f0dfba');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, GROUND);
    // sole / controluce
    ctx.globalAlpha = .35;
    ctx.fillStyle = arena ? '#ffc84b' : '#fff3c4';
    ctx.beginPath(); ctx.arc(498, 78, 34, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    // cupola lontana
    const dx = 250 - cam * .06;
    ctx.fillStyle = arena ? 'rgba(120,96,140,.55)' : 'rgba(168,178,182,.55)';
    ctx.fillRect(dx - 70, 168, 140, 90);
    ctx.beginPath(); ctx.arc(dx, 168, 52, Math.PI, 0); ctx.fill();
    ctx.fillRect(dx - 5, 96, 10, 26);
    ctx.fillRect(dx - 16, 108, 32, 6);
    // tetti e campanili
    for (let i = 0; i < 9; i++) {
      const x = mod(i * 118 - cam * .12, 760) - 80;
      const h = 54 + (i * 29 % 58);
      ctx.fillStyle = arena ? 'rgba(86,60,78,.72)' : 'rgba(176,150,118,.72)';
      ctx.fillRect(x, GROUND - 46 - h, 92, h + 46);
      ctx.fillStyle = arena ? 'rgba(58,40,58,.8)' : 'rgba(148,120,92,.8)';
      ctx.fillRect(x, GROUND - 52 - h, 92, 6);
    }
    // palazzi ocra in primo piano
    for (let i = 0; i < 6; i++) {
      const x = mod(i * 172 - cam * .3, 900) - 140;
      const h = 128 + (i * 23 % 46);
      ctx.fillStyle = i % 2 ? (arena ? '#8a5a3c' : '#c98f5c') : (arena ? '#7a4c34' : '#b87e4e');
      ctx.fillRect(x, GROUND - h, 150, h);
      ctx.fillStyle = arena ? '#5c3428' : '#a06a3e';
      ctx.fillRect(x, GROUND - h, 150, 8);
      // finestre
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        const lit = (i + r + c) % 5 === 0;
        ctx.fillStyle = lit ? 'rgba(255,214,120,.85)' : (arena ? 'rgba(40,28,36,.7)' : 'rgba(84,70,60,.55)');
        ctx.fillRect(x + 16 + c * 32, GROUND - h + 18 + r * 26, 16, 18);
      }
      // balconi
      ctx.fillStyle = arena ? '#4a2a26' : '#7d5636';
      for (let r = 0; r < 3; r++) ctx.fillRect(x + 8, GROUND - h + 42 + r * 26, 134, 3);
    }
    // stendardi / festoni
    const flagCol = ['#ffc84b', '#b91832', '#fff8e7', '#3f7a58'];
    for (let x = -((cam * .5) % 46) - 46; x < W + 46; x += 46) {
      const i = Math.floor((cam * .5 + x) / 46);
      ctx.fillStyle = flagCol[mod(i, flagCol.length)];
      ctx.beginPath();
      ctx.moveTo(x, 44); ctx.lineTo(x + 26, 44); ctx.lineTo(x + 13, 60);
      ctx.closePath(); ctx.fill();
    }
    // piazza / ringhiera
    ctx.fillStyle = arena ? 'rgba(58,40,44,.9)' : 'rgba(122,100,80,.85)';
    ctx.fillRect(0, GROUND - 46, W, 4);
    for (let x = mod(-cam * .7, 34); x < W; x += 34) {
      ctx.fillStyle = arena ? '#3a2a30' : '#6d5a48';
      ctx.fillRect(x, GROUND - 44, 4, 30);
    }
    if (arena) {
      // podio del patrizio: colonne, drappo rosso, cataste di pratiche
      ctx.fillStyle = 'rgba(24,16,30,.55)'; ctx.fillRect(0, 0, W, 24);
      for (let i = 0; i < 4; i++) {
        const x = 40 + i * 160 - (cam * .4 % 160);
        ctx.fillStyle = '#d8cdb4'; ctx.fillRect(x, 120, 26, GROUND - 120);
        ctx.fillStyle = '#efe6d2'; ctx.fillRect(x - 5, 114, 36, 10);
        ctx.fillStyle = '#b9ac90'; ctx.fillRect(x - 3, GROUND - 8, 32, 8);
      }
      ctx.fillStyle = '#8c1c2b'; ctx.fillRect(0, GROUND - 34, W, 12);
      ctx.fillStyle = '#ffc84b';
      for (let x = mod(-cam * .8, 40); x < W; x += 40) ctx.fillRect(x, GROUND - 34, 20, 3);
      for (let i = 0; i < 5; i++) {
        const x = mod(i * 210 + 60 - cam * .55, 760) - 60;
        ctx.fillStyle = '#fff8e7';
        for (let k = 0; k < 4; k++) ctx.fillRect(x + k * 3, GROUND - 26 - k * 3, 44 - k * 2, 4);
      }
      drawText('PIAZZA MASTAI · DIREZIONE CENTRALE', 320, 70, 6, 'rgba(255,232,180,.5)', 'center');
    } else {
      // fontanella e cartello
      const fx = 430 - cam * .55;
      if (fx > -60 && fx < W + 60) {
        ctx.fillStyle = '#9aa0a0'; ctx.fillRect(fx, GROUND - 34, 18, 34);
        ctx.fillStyle = '#7d8484'; ctx.fillRect(fx - 8, GROUND - 40, 34, 8);
        ctx.fillStyle = '#9fd7ff'; ctx.fillRect(fx + 12, GROUND - 26, 6, 6);
      }
      drawText('PIAZZA MASTAI · ROMA', 320, 88, 7, 'rgba(70,48,38,.45)', 'center');
    }
  }

  function drawEuropaFallback(arena) {
    const cam = S.camera.x, t = S.time;
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, arena ? '#0d1a2c' : '#5879a8');
    sky.addColorStop(.5, arena ? '#183049' : '#9cb8d4');
    sky.addColorStop(1, arena ? '#2e5068' : '#e2ecf2');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, GROUND);
    // grattacieli di vetro lontani
    for (let i = 0; i < 10; i++) {
      const x = mod(i * 96 - cam * .1, 860) - 100;
      const h = 90 + (i * 37 % 110);
      ctx.fillStyle = arena ? 'rgba(40,74,102,.75)' : 'rgba(126,158,186,.6)';
      ctx.fillRect(x, GROUND - h, 74, h);
      ctx.fillStyle = arena ? 'rgba(120,190,230,.5)' : 'rgba(226,240,250,.55)';
      for (let r = 0; r < Math.floor(h / 16); r++) for (let c = 0; c < 3; c++) {
        if ((i + r + c) % 3) continue;
        ctx.fillRect(x + 8 + c * 22, GROUND - h + 8 + r * 16, 12, 6);
      }
    }
    // Berlaymont: edificio a croce di vetro
    const bx = 190 - cam * .18;
    ctx.fillStyle = arena ? '#1d3a52' : '#8fb2c9';
    ctx.fillRect(bx, 96, 300, 200);
    ctx.fillStyle = arena ? '#2a5570' : '#b9d3e2';
    ctx.fillRect(bx + 110, 60, 80, 240);
    for (let r = 0; r < 8; r++) for (let c = 0; c < 12; c++) {
      const lit = (r * 12 + c) % 7 === 0;
      ctx.fillStyle = lit ? 'rgba(210,240,255,.9)' : (arena ? 'rgba(60,105,135,.55)' : 'rgba(90,130,160,.5)');
      if ((c > 4 && c < 7) || r > 5) ctx.fillRect(bx + 16 + c * 23, 106 + r * 22, 15, 12);
    }
    // bandiere UE
    for (let i = 0; i < 6; i++) {
      const x = 60 + i * 100 - (cam * .32 % 100);
      ctx.fillStyle = '#2a4a8f'; ctx.fillRect(x, 200, 34, 22);
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + (k - 2) * .5;
        ctx.fillStyle = '#ffd866';
        ctx.fillRect(x + 17 + Math.cos(a) * 9, 211 + Math.sin(a) * 9, 2, 2);
      }
      ctx.fillStyle = '#c3d0d8'; ctx.fillRect(x + 16, 222, 2, 60);
    }
    // stelle UE a terra
    ctx.fillStyle = 'rgba(255,216,102,.2)';
    for (let i = 0; i < 10; i++) drawStar(mod(i * 74 - cam * .55, 740) + 20, GROUND - 6, 3, 'rgba(255,216,102,.3)', 4);
    if (arena) {
      ctx.fillStyle = 'rgba(12,26,42,.5)'; ctx.fillRect(0, 0, W, 22);
      ctx.fillStyle = '#14283c'; ctx.fillRect(0, GROUND - 42, W, 16);
      ctx.fillStyle = '#ffd866'; ctx.fillRect(0, GROUND - 42, W, 3);
      drawText('COMMISSIONE EUROPEA · BERLAYMONT', 320, 74, 6, 'rgba(210,240,255,.55)', 'center');
      ctx.fillStyle = '#2a4a8f';
      for (let i = 0; i < 3; i++) ctx.fillRect(90 + i * 200, 150, 40, 26);
    } else {
      drawText('QUARTIERE EUROPEO · BRUXELLES', 320, 84, 7, 'rgba(40,66,92,.5)', 'center');
    }
  }

  function drawPescaraFallback(arena, night) {
    const cam = S.camera.x, t = S.time;
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    if (night) {
      sky.addColorStop(0, '#160a2c'); sky.addColorStop(.55, '#4a1450'); sky.addColorStop(1, '#a03a5a');
    } else {
      sky.addColorStop(0, '#3a2a8c'); sky.addColorStop(.5, '#ff5b9d'); sky.addColorStop(1, '#ffc84b');
    }
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, GROUND);
    // sole/luna psichedelica e raggi
    ctx.save();
    ctx.globalAlpha = .5;
    ctx.fillStyle = night ? '#fff3a6' : '#ffe066';
    ctx.beginPath(); ctx.arc(500, 80, 30, 0, TAU); ctx.fill();
    ctx.globalAlpha = .16;
    for (let i = 0; i < 10; i++) {
      const a = t * .2 + i / 10 * TAU;
      ctx.fillStyle = i % 2 ? '#ff90b8' : '#51c7a9';
      ctx.beginPath();
      ctx.moveTo(500, 80);
      ctx.lineTo(500 + Math.cos(a) * 300, 80 + Math.sin(a) * 300);
      ctx.lineTo(500 + Math.cos(a + .18) * 300, 80 + Math.sin(a + .18) * 300);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // mare
    ctx.fillStyle = night ? '#1b2a5c' : '#2a8ca8';
    ctx.fillRect(0, 216, W, 52);
    for (let i = 0; i < 12; i++) {
      const x = mod(i * 68 - cam * .25, 760) - 60;
      ctx.fillStyle = night ? 'rgba(255,144,184,.3)' : 'rgba(255,232,140,.55)';
      ctx.fillRect(x, 224 + (i % 4) * 10 + Math.sin(t * 1.6 + i) * 2, 34, 2);
    }
    // hotel e palazzi sul lungomare
    for (let i = 0; i < 7; i++) {
      const x = mod(i * 150 - cam * .35, 900) - 120;
      const h = 110 + (i * 26 % 60);
      ctx.fillStyle = night ? ['#3a1a52', '#58205e', '#2a1450'][i % 3] : ['#ffd1e0', '#ffe6b8', '#c8f2e0'][i % 3];
      ctx.fillRect(x, GROUND - h, 118, h);
      ctx.fillStyle = night ? '#6b2a70' : '#ff90b8';
      ctx.fillRect(x, GROUND - h, 118, 5);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        const lit = (i + r + c) % 4 !== 0;
        ctx.fillStyle = lit ? (night ? 'rgba(255,214,120,.9)' : 'rgba(90,120,160,.6)') : 'rgba(40,30,60,.5)';
        ctx.fillRect(x + 12 + c * 26, GROUND - h + 18 + r * 24, 14, 14);
      }
      if (i % 2 === 0) {
        ctx.fillStyle = night ? '#ff5b9d' : '#51c7a9';
        ctx.beginPath(); ctx.arc(x + 16, GROUND - h - 12, 5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff8e7'; ctx.fillRect(x + 10, GROUND - h - 10, 12, 2);
      }
    }
    // palme
    for (let i = 0; i < 4; i++) {
      const x = mod(i * 260 + 40 - cam * .6, 980) - 100;
      ctx.strokeStyle = night ? '#5c4a2a' : '#8a6a3a'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x, GROUND); ctx.quadraticCurveTo(x + 10, GROUND - 50, x + 4, GROUND - 92); ctx.stroke();
      ctx.strokeStyle = night ? '#2a6b4a' : '#3f9a58'; ctx.lineWidth = 4;
      for (let k = 0; k < 5; k++) {
        const a = Math.PI + k / 4 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(x + 4, GROUND - 92);
        ctx.quadraticCurveTo(x + 4 + Math.cos(a) * 30, GROUND - 104, x + 4 + Math.cos(a) * 44, GROUND - 86);
        ctx.stroke();
      }
    }
    // palla da discoteca
    if (!night) {
      const bx = 320 - cam * .2;
      ctx.fillStyle = 'rgba(220,240,255,.8)';
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        ctx.fillStyle = `rgba(255,255,255,${.35 + ((r + c) % 3) * .2})`;
        ctx.fillRect(bx + c * 7, 54 + r * 7, 6, 6);
      }
      ctx.strokeStyle = '#c3d0d8'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(bx + 14, 44); ctx.lineTo(bx + 14, 54); ctx.stroke();
    }
    if (arena) {
      ctx.fillStyle = 'rgba(20,8,30,.5)'; ctx.fillRect(0, 0, W, 20);
      ctx.fillStyle = '#ff5b9d'; ctx.fillRect(0, GROUND - 40, W, 8);
      ctx.fillStyle = '#ffc84b'; ctx.fillRect(0, GROUND - 32, W, 3);
      drawText(night ? 'PESCARA BY NIGHT · LUNGOMARE' : 'FORMAZIONE · HOTEL SUL MARE', 320, 60, 6, 'rgba(255,240,200,.65)', 'center');
    } else {
      drawText(night ? 'PESCARA · RISTORANTI SUL MARE' : 'PESCARA · SPIAGGIA E HOTEL', 320, 96, 7, 'rgba(255,248,231,.55)', 'center');
    }
  }

  /* v2.0 — ambient SOGEI: scimmie alla tastiera, uccellino, contanti sotto i tappeti.
     Usa Art.sogeiMonkey / Art.sogeiBird / Art.sogeiCash (feature detection). */
  function drawSogeiAmbient() {
    const t = S.time, cam = S.camera.x;
    const A = Art;
    if (A.sogeiMonkey && A.sogeiMonkey.frames && A.sogeiMonkey.frames.length) {
      const m = A.sogeiMonkey;
      for (let i = 0; i < 2; i++) {
        const fr = m.frames[Math.floor(t * 2.2 + i * 2) % m.frames.length];
        const wx = mod(210 + i * 300 - cam * .25, 980) - 140;
        if (wx < -120 || wx > W + 40) continue;
        ctx.drawImage(fr, Math.round(wx), 30, 66, Math.round(66 * (m.h / m.w)));
        // tastiera stilizzata
        ctx.fillStyle = 'rgba(20,28,36,.8)';
        ctx.fillRect(wx + 2, 92, 60, 12);
        ctx.fillStyle = 'rgba(143,209,79,.35)';
        for (let k = 0; k < 8; k++) ctx.fillRect(wx + 6 + k * 7, 96, 4, 2);
      }
    }
    if (A.sogeiBird && A.sogeiBird.frames && A.sogeiBird.frames.length) {
      const b = A.sogeiBird;
      const fr = b.frames[Math.floor(t * 6) % b.frames.length];
      const bx = mod(t * 46 - cam * .5, W + 160) - 80;
      const by = 132 + Math.sin(t * 1.6) * 10;
      ctx.save();
      ctx.translate(Math.round(bx), Math.round(by));
      ctx.scale(-1, 1); // becca i tasti verso sinistra
      ctx.drawImage(fr, 0, 0, 46, Math.round(46 * (b.h / b.w)));
      ctx.restore();
      if (Math.random() < .2) sparkBurst(bx + S.camera.x, by + 16, 1, '#ffc84b', 40);
    }
    if (A.sogeiCash && A.sogeiCash.frames && A.sogeiCash.frames.length) {
      const c = A.sogeiCash;
      for (let i = 0; i < 3; i++) {
        const wx = mod(150 + i * 310 - cam * .6, 900) - 90;
        if (wx < -100 || wx > W + 60) continue;
        const fr = c.frames[Math.floor(t * 2 + i) % c.frames.length];
        const cy = GROUND - 26 + Math.sin(t * 2 + i * 2) * 2;
        ctx.drawImage(fr, Math.round(wx), Math.round(cy), 58, Math.round(58 * (c.h / c.w)));
        if (Math.random() < .1) addParticle({ type: 'star', x: wx + S.camera.x + 10, y: cy, vx: rand(-8, 8), vy: -20, life: .5, size: 2.5, color: '#b7e36a', gravity: 0 });
      }
    }
  }

  function drawSogeiFallback(arena) {
    const cam = S.camera.x, t = S.time;
    ctx.fillStyle = '#070d12'; ctx.fillRect(0, 0, W, GROUND);
    // parete server
    for (let i = 0; i < 12; i++) {
      const x = mod(i * 96 - cam * .3, 900) - 120;
      const h = 190 + (i * 17 % 40);
      ctx.fillStyle = i % 2 ? '#101c26' : '#0c1620';
      ctx.fillRect(x, GROUND - h, 78, h);
      ctx.fillStyle = '#1d3a4a'; ctx.fillRect(x, GROUND - h, 78, 5);
      for (let r = 0; r < 13; r++) {
        ctx.fillStyle = '#0a1218'; ctx.fillRect(x + 6, GROUND - h + 12 + r * 13, 66, 8);
        const blink = Math.sin(t * 3 + i * 1.7 + r) > .2;
        ctx.fillStyle = blink ? (r % 4 === 0 ? '#8fd14f' : r % 3 === 0 ? '#ff845d' : '#51c7a9') : '#183040';
        ctx.fillRect(x + 10, GROUND - h + 14 + r * 13, 3, 3);
        ctx.fillStyle = 'rgba(159,215,255,.18)'; ctx.fillRect(x + 18, GROUND - h + 15 + r * 13, 22, 2);
      }
    }
    // cavi a soffitto
    ctx.strokeStyle = '#22303a'; ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(-20, 20 + i * 12);
      ctx.bezierCurveTo(180, 40 + i * 20 + Math.sin(t + i) * 3, 430, 8 + i * 16, W + 20, 30 + i * 14);
      ctx.stroke();
    }
    // schermata gigante con occhi (allusione scimmie alla tastiera)
    const mx = 300 - cam * .2;
    ctx.fillStyle = '#0b1a14'; ctx.fillRect(mx, 60, 230, 118);
    ctx.strokeStyle = '#8fd14f'; ctx.lineWidth = 2; ctx.strokeRect(mx + 3, 63, 224, 112);
    ctx.fillStyle = '#8fd14f';
    for (let r = 0; r < 6; r++) ctx.fillRect(mx + 14, 76 + r * 15, 60 + (r * 37 % 120), 4);
    ctx.fillStyle = '#b7e36a'; ctx.fillRect(mx + 24, 88, 4, 4); ctx.fillRect(mx + 40, 88, 4, 4);
    ctx.fillStyle = '#8fd14f'; ctx.fillRect(mx + 30, 96, 10, 2);
    // glitch scanline
    const glitchY = mod(t * 90, GROUND);
    ctx.fillStyle = 'rgba(143,209,79,.12)'; ctx.fillRect(0, glitchY, W, 2);
    if (Math.sin(t * 2.7) > .95) {
      ctx.fillStyle = 'rgba(255,91,157,.18)'; ctx.fillRect(rand(0, W - 120), rand(20, GROUND - 40), rand(30, 120), rand(2, 10));
    }
    // contanti sotto i tappeti
    for (let i = 0; i < 3; i++) {
      const x = mod(i * 260 - cam * .55, 800) - 60;
      ctx.fillStyle = '#1c2a1c'; ctx.fillRect(x, GROUND - 8, 60, 8);
      ctx.fillStyle = '#3f8f5c'; ctx.fillRect(x + 8, GROUND - 12, 18, 7);
      ctx.fillStyle = '#b7e36a'; ctx.fillRect(x + 12, GROUND - 10, 10, 3);
    }
    if (arena) {
      ctx.fillStyle = 'rgba(4,8,6,.55)'; ctx.fillRect(0, 0, W, 20);
      ctx.fillStyle = '#1d3a1d'; ctx.fillRect(0, GROUND - 40, W, 8);
      ctx.fillStyle = '#8fd14f'; ctx.fillRect(0, GROUND - 40, W, 2);
      drawText('INCUBO SOGEI · SERVER ROOM', 320, 54, 6, 'rgba(183,227,106,.7)', 'center');
    } else {
      drawText('SOGEI · SALA SERVER', 320, 196, 7, 'rgba(143,209,79,.5)', 'center');
    }
  }

  function drawDirezioneBackground() {
    const cam = S.camera.x;
    const inside = S.player && S.player.x > 980;
    if (!inside) {
      /* v2.1 — esterno: se il manifest v2 ha caricato l'immagine AI
         direzioneExt la disegniamo full-scene con leggera parallasse
         (cover, nessun bordo scoperto); altrimenti resta il procedurale. */
      const extAi = hasBg('direzioneExt') ? Art.bg.direzioneExt : null;
      if (extAi) {
        const par = clamp(cam * .18, 0, 48);
        const dw = W + par;
        const dh = H * dw / W;
        ctx.drawImage(extAi, -par * .5, (H - dh) * .5, dw, dh);
      } else {
        const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
        sky.addColorStop(0, '#7ea8ba'); sky.addColorStop(.45, '#b8cbd0'); sky.addColorStop(1, '#e8d5b4');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, GROUND);
        // skyline lontano
        ctx.fillStyle = 'rgba(125,145,150,.5)';
        for (let i = 0; i < 16; i++) {
          const x = mod(i * 74 - cam * .08, 900) - 140;
          const h = 42 + (i * 19 % 64);
          ctx.fillRect(x, GROUND - h - 48, 56, h);
        }
        // palazzo alto direzionale
        const bx = 120 - cam * .18;
        ctx.fillStyle = '#e8e4d5'; ctx.fillRect(bx, 82, 410, 224);
        ctx.fillStyle = '#d4d0c1'; ctx.fillRect(bx, 82, 410, 12);
        ctx.fillStyle = '#a9b6b8';
        for (let r = 0; r < 6; r++) for (let c = 0; c < 9; c++) {
          ctx.fillStyle = (r + c) % 4 === 0 ? '#7f9aa1' : '#b8c8c9';
          ctx.fillRect(bx + 26 + c * 42, 108 + r * 30, 22, 16);
        }
        ctx.fillStyle = '#b7a98c'; ctx.fillRect(bx + 150, 246, 112, 60);
        ctx.fillStyle = '#4d6b73'; ctx.fillRect(bx + 162, 252, 88, 38);
        ctx.fillStyle = '#8fb4bd'; ctx.fillRect(bx + 168, 258, 76, 12);
        ctx.fillStyle = '#2b3a40'; ctx.fillRect(bx, 300, 410, 6);
        drawText('DIREZIONE TERRITORIALE', bx + 205, 68, 7, '#2f4850', 'center');
        drawText('VIA AMENDOLA · BARI', bx + 205, 78, 5, '#7e8a86', 'center');
        // piazza e cordoli
        ctx.fillStyle = '#c9c1ad'; ctx.fillRect(0, GROUND - 6, W, 8);
        ctx.fillStyle = '#a89f8a'; for (let x = mod(-cam, 70); x < W; x += 70) ctx.fillRect(x, GROUND - 6, 2, 8);
        drawText('INGRESSO · PIANO ALTO', 300, GROUND - 42, 6, 'rgba(43,58,64,.7)', 'center');
      }
    } else {
      // corridoio direzionale: pareti chiare, porte su un solo lato
      const wall = ctx.createLinearGradient(0, 0, 0, GROUND);
      wall.addColorStop(0, '#d9d5c6'); wall.addColorStop(.55, '#c8c5b8'); wall.addColorStop(1, '#9fa39a');
      ctx.fillStyle = wall; ctx.fillRect(0, 0, W, GROUND);
      ctx.fillStyle = '#e9e6da'; ctx.fillRect(0, 0, W, 34);
      ctx.fillStyle = '#aeb2a8'; ctx.fillRect(0, 34, W, 3);
      // luci a soffitto
      for (let x = mod(-cam, 220); x < W; x += 220) {
        ctx.fillStyle = '#f7f2d8'; ctx.fillRect(x + 40, 12, 54, 5);
        ctx.fillStyle = 'rgba(255,244,190,.18)'; ctx.fillRect(x + 24, 17, 86, 42);
      }
      // porte e stanze sul lato alto: arte dedicata di content-art (17 stanze),
      // con fallback locale se art.js non è ancora aggiornato.
      if (typeof Art.drawDirezioneRooms === 'function') {
        Art.drawDirezioneRooms(ctx, cam, S.time);
      } else {
        drawDirezioneRoomsFallback(cam);
      }
      if (typeof Art.drawDirezioneAmbience === 'function') {
        Art.drawDirezioneAmbience(ctx, cam, S.time);
      } else {
        drawDirezioneAmbienceFallback(cam);
      }
      // zoccolo e passatoia
      ctx.fillStyle = '#7d827b'; ctx.fillRect(0, GROUND - 42, W, 42);
      ctx.fillStyle = '#5e6b6c'; ctx.fillRect(0, GROUND - 4, W, 4);
      ctx.fillStyle = '#4e5b5e'; ctx.fillRect(0, GROUND - 1, W, 4);
      drawText('CORRIDOIO AMMINISTRATIVO · PIANO 4', 320, 64, 6, 'rgba(59,70,64,.55)', 'center');
    }
    // cornice luminosa

  }

  /* Fallback stanze Direzione: usato solo se Art.drawDirezioneRooms non esiste.
     Se Art.direzioneRooms è già presente usa i suoi dati, altrimenti la griglia base. */
  const DIREZIONE_FALLBACK_TYPES = [
    'sportello', 'segreteria', 'darts', 'photocopy', 'beans', 'waiting', 'tennis', 'golf',
    'meeting', 'training', 'coffee', 'vending', 'archive', 'server', 'centralino', 'protocollo', 'mensa'
  ];
  function drawDirezioneRoomsFallback(cam) {
    const list = (Art.direzioneRooms && Art.direzioneRooms.length) ? Art.direzioneRooms : null;
    for (let i = 0; i < 17; i++) {
      const entry = list ? (list[i] || null) : { x: 1020 + i * 205, type: DIREZIONE_FALLBACK_TYPES[i], label: 'STANZA ' + (i + 1) };
      const wx = entry && entry.x != null ? entry.x : 1020 + i * 205;
      const x = wx - cam;
      if (x < -90 || x > W + 30) continue;
      ctx.fillStyle = '#8b8e84'; ctx.fillRect(x, 118, 58, 100);
      ctx.fillStyle = entry && entry.door ? '#2c3a3f' : '#3d4d54'; ctx.fillRect(x + 5, 124, 48, 88);
      drawRoomVignette(x + 5, 124, entry ? entry.type : 'office', wx, entry);
      if (entry && entry.label) {
        drawText(entry.label, x + 29, 214, 4, 'rgba(235,235,220,.8)', 'center');
      } else {
        ctx.fillStyle = '#a9aba0'; ctx.fillRect(x + 22, 158, 16, 3);
        drawText(String(102 + i), x + 29, 136, 4, 'rgba(235,235,220,.75)', 'center');
      }
    }
  }

  /* Fallback arredo corridoio: piante e bacheche (art.js v1.2 ha drawDirezioneAmbience). */
  function drawDirezioneAmbienceFallback(cam) {
    for (let x = mod(-cam, 300); x < W; x += 300) {
      ctx.fillStyle = '#6d3e2e'; ctx.fillRect(x + 18, GROUND - 30, 12, 16);
      ctx.strokeStyle = '#3f7a58'; ctx.lineWidth = 2;
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.moveTo(x + 24, GROUND - 30);
        ctx.quadraticCurveTo(x + 12 + k * 7, GROUND - 52, x + 14 + k * 6, GROUND - 62);
        ctx.stroke();
      }
      ctx.fillStyle = '#d9d2bb'; ctx.fillRect(x + 160, 92, 62, 42);
      ctx.fillStyle = '#7280b3';
      for (let k = 0; k < 4; k++) ctx.fillRect(x + 166, 98 + k * 8, 48, 2);
    }
  }

  function drawRoomVignette(x, y, type, wx, entry) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, 48, 88); ctx.clip();
    ctx.fillStyle = '#202a2f'; ctx.fillRect(x, y, 48, 88);
    if (type === 'darts') {
      ctx.fillStyle = '#e8e2d2'; ctx.beginPath(); ctx.arc(x + 30, y + 26, 13, 0, TAU); ctx.fill();
      ctx.fillStyle = '#c62265'; ctx.beginPath(); ctx.arc(x + 30, y + 26, 8, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffc84b'; ctx.beginPath(); ctx.arc(x + 30, y + 26, 3, 0, TAU); ctx.fill();
    } else if (type === 'training') {
      ctx.fillStyle = '#e8e2d2'; ctx.fillRect(x + 3, y + 14, 42, 30);
      ctx.fillStyle = '#4d6b73'; ctx.fillRect(x + 6, y + 17, 36, 24);
      ctx.fillStyle = '#ffc84b'; ctx.fillRect(x + 12, y + 22, 24, 2);
      ctx.fillStyle = '#ff5b9d'; ctx.fillRect(x + 12, y + 28, 16, 2);
      ctx.fillStyle = '#d7b18c'; ctx.beginPath(); ctx.arc(x + 24, y + 66, 7, 0, TAU); ctx.fill();
      ctx.fillStyle = '#566b70'; ctx.fillRect(x + 16, y + 72, 16, 14);
    } else {
      ctx.fillStyle = '#d9d2bb'; ctx.fillRect(x + 4, y + 54, 40, 18);
      ctx.fillStyle = '#fff8e7'; ctx.fillRect(x + 9, y + 58, 8, 8);
      ctx.fillStyle = '#6d4a32'; ctx.fillRect(x + 24, y + 58, 10, 8);
    }
    if (entry && entry.subject && typeof Art.drawDirezioneSubject === 'function') {
      try {
        Art.drawDirezioneSubject(ctx, entry.subject, x, y, { scale: 1, time: S.time });
      } catch (e) { /* soggetto non disponibile */ }
    } else {
      const npc = Art.npcs && Art.npcs[type];
      if (npc) ctx.drawImage(npc, x, y);
    }
    ctx.restore();
  }

  function drawGroundGlow(lvl) {
    // luce calda sul lastrico, per staccare i personaggi
    const grad = ctx.createLinearGradient(0, GROUND - 2, 0, GROUND + 24);
    grad.addColorStop(0, lvl.ground === 1 ? 'rgba(255,224,166,.11)' : 'rgba(255,238,198,.15)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, GROUND, W, 28);
  }

  function drawBossAtmosphere() {
    const lvl = S.level;
    const bg = lvl.customBg;
    ctx.fillStyle = bg === 'roma' ? 'rgba(30,16,10,.24)'
      : bg === 'europa' ? 'rgba(8,20,36,.26)'
        : bg === 'sogei' ? 'rgba(4,12,8,.3)'
          : bg ? 'rgba(30,8,36,.22)'
            : lvl.id === 1 ? 'rgba(15,10,28,.22)' : 'rgba(24,11,30,.19)';
    ctx.fillRect(0, 0, W, H);
    const grad = ctx.createRadialGradient(W * .54, H * .46, H * .18, W * .54, H * .46, H * .75);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(7,4,14,.38)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // raggi di collegamento tra cielo e Basilica
    if (lvl.id === 2) {
      ctx.save();
      ctx.globalAlpha = .08 + Math.sin(S.time * 1.3) * .025;
      ctx.fillStyle = '#ffe6a5';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(420 + i * 70, 0);
        ctx.lineTo(330 + i * 70, GROUND);
        ctx.lineTo(390 + i * 70, GROUND);
        ctx.lineTo(480 + i * 70, 0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawBirds(lvl) {
    if (S.bossActive) return;
    const t = S.time;
    ctx.strokeStyle = lvl.id === 1 ? 'rgba(54,45,77,.48)' : 'rgba(81,63,69,.34)';
    ctx.lineWidth = 1;
    const birds = lvl.id === 1
      ? [[.035, 62, 1], [.03, 84, .7], [.026, 110, .5]]
      : [[.025, 102, .8], [.022, 80, .5]];
    for (let i = 0; i < birds.length; i++) {
      const [speed, baseY, scale] = birds[i];
      const x = mod(t * 9 * speed + i * 210 - S.camera.x * .05, 880) - 120;
      const y = baseY + Math.sin(t * .7 + i * 2) * 5;
      const wing = Math.sin(t * 4 + i) * 2;
      ctx.beginPath();
      ctx.moveTo(x - 5 * scale, y);
      ctx.quadraticCurveTo(x - 2 * scale, y - 3 * scale - wing, x, y);
      ctx.quadraticCurveTo(x + 2 * scale, y - 3 * scale - wing, x + 5 * scale, y);
      ctx.stroke();
    }
  }

  /* v2.0 — meteo/atmosfera dei livelli nuovi. */
  function drawCustomWeather(lvl) {
    const t = S.time;
    const bg = lvl.customBg;
    if (bg === 'roma') {
      // pulviscolo dorato e foglietti di pratiche
      for (let i = 0; i < 16; i++) {
        const x = mod(i * 71 + t * (4 + i % 5) - S.camera.x * .2, 700) - 30;
        const y = 90 + mod(i * 39 + t * 6, 200);
        ctx.globalAlpha = .12 + .16 * (Math.sin(t * 2 + i) * .5 + .5);
        ctx.fillStyle = i % 3 ? '#ffd572' : '#fff8e7';
        ctx.fillRect(x, y, 2, i % 4 === 0 ? 3 : 2);
        ctx.globalAlpha = 1;
      }
    } else if (bg === 'europa') {
      // fiocchi freddi e stelle UE
      for (let i = 0; i < 20; i++) {
        const x = mod(i * 53 - t * (6 + i % 5), 700) + 10;
        const y = mod(i * 41 + t * (14 + i % 6), 260) + 40;
        ctx.globalAlpha = .16 + .2 * (Math.sin(t + i) * .5 + .5);
        ctx.fillStyle = i % 5 ? '#dcefff' : '#ffd866';
        ctx.fillRect(x, y, 2, 2);
        ctx.globalAlpha = 1;
      }
    } else if (bg === 'pescara' || bg === 'pescaraNight') {
      // coriandoli psichedelici e bolle di spritz
      const cols = ['#ff5b9d', '#ffc84b', '#51c7a9', '#c598e0', '#9fd7ff'];
      for (let i = 0; i < 22; i++) {
        const x = mod(i * 61 - t * (10 + i % 7) - S.camera.x * .15, 720) + 5;
        const y = mod(i * 33 + t * (12 + i % 8), 250) + 56;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * .9 + i);
        ctx.globalAlpha = .35 + (i % 3) * .15;
        ctx.fillStyle = cols[i % cols.length];
        ctx.fillRect(-2, -1, 4, 3);
        ctx.restore();
      }
      for (let i = 0; i < 8; i++) {
        const x = mod(i * 97 + Math.sin(t * .8 + i) * 20, 700) - 20;
        const y = 120 + mod(i * 47 + t * 9, 170);
        ctx.globalAlpha = .14 + .12 * Math.sin(t * 2 + i);
        ctx.strokeStyle = '#fff8e7';
        ctx.beginPath(); ctx.arc(x, y, 4 + (i % 3) * 3, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    } else if (bg === 'sogei') {
      // glitch verdi, scanline e bit che cadono
      for (let i = 0; i < 18; i++) {
        const x = mod(i * 43 + t * (8 + i % 6), 700);
        const y = mod(i * 29 + t * (24 + i % 9), 300);
        ctx.globalAlpha = .10 + .2 * (Math.sin(t * 4 + i) * .5 + .5);
        ctx.fillStyle = i % 5 ? '#8fd14f' : '#9fd7ff';
        ctx.fillRect(x, y, i % 3 ? 2 : 1, i % 4 === 0 ? 6 : 3);
        ctx.globalAlpha = 1;
      }
      const scan = mod(t * 46, H);
      ctx.fillStyle = 'rgba(143,209,79,.05)';
      ctx.fillRect(0, scan, W, 3);
      if (Math.sin(t * 2.3) > .96) {
        ctx.fillStyle = 'rgba(255,91,157,.12)';
        ctx.fillRect(rand(0, W - 100), rand(30, GROUND - 30), rand(40, 140), rand(2, 8));
      }
    }
  }

  function drawWeather(lvl) {
    const t = S.time;
    if (S.bossActive) {
      // pulviscolo dorato e scintille liturgiche
      for (let i = 0; i < 24; i++) {
        const x = mod(i * 61 + t * (4 + i % 5), 700) - 30;
        const y = 68 + mod(i * 37 + t * 7, 225);
        const a = .15 + .2 * (Math.sin(t * 2 + i) * .5 + .5);
        ctx.globalAlpha = a;
        ctx.fillStyle = i % 4 ? '#ffd572' : '#ffb1c9';
        ctx.fillRect(x, y, 1 + (i % 2), 1 + (i % 2));
        ctx.globalAlpha = 1;
      }
      return;
    }
    if (lvl.customBg) { drawCustomWeather(lvl); return; }
    if (lvl.id === 2) {
      // petali di Bari Vecchia
      for (let i = 0; i < 18; i++) {
        const x = mod(i * 47 - t * (8 + i % 6) - S.camera.x * .15, 700) + 10;
        const y = mod(i * 29 + t * (11 + i % 7), 250) + 60;
        const rot = t * .8 + i;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.globalAlpha = .32 + (i % 3) * .12;
        ctx.fillStyle = i % 4 ? '#ffbfd8' : '#ffd586';
        ctx.fillRect(-1, -2, 3, 2);
        ctx.globalAlpha = 1;
        ctx.restore();
      }
      // polvere di sole
      for (let i = 0; i < 12; i++) {
        const x = mod(i * 79 + t * 3, 700);
        const y = 110 + mod(i * 41 + Math.sin(t + i) * 6, 170);
        ctx.globalAlpha = .10 + .1 * Math.sin(t * 2 + i);
        ctx.fillStyle = '#fff4d2';
        ctx.fillRect(x, y, 1, 1);
        ctx.globalAlpha = 1;
      }
    } else {
      // pulviscolo portuale + schiuma
      for (let i = 0; i < 16; i++) {
        const x = mod(i * 71 + t * 5, 700);
        const y = 215 + mod(i * 23 + Math.sin(t + i) * 7, 70);
        ctx.globalAlpha = .13 + .1 * Math.sin(t * 1.7 + i);
        ctx.fillStyle = i % 3 ? '#e5f5ec' : '#ffe3aa';
        ctx.fillRect(x, y, 2, 1);
        ctx.globalAlpha = 1;
      }
    }
  }

  /* =========================================================
     OGGETTI DI SCENA
     ========================================================= */
  function drawPlatforms() {
    if (!S.level || !S.level.platforms) return;
    for (const pl of S.level.platforms) {
      const x = Math.round(pl.x - S.camera.x);
      if (x + pl.w < -20 || x > W + 20) continue;
      const office = S.level.id === 3;
      ctx.save();
      ctx.fillStyle = 'rgba(8,7,14,.35)';
      ctx.fillRect(x + 3, pl.y + 5, pl.w, 5);
      ctx.fillStyle = office ? '#5b6670' : '#5a4b35';
      ctx.fillRect(x, pl.y, pl.w, 6);
      ctx.fillStyle = office ? '#aab4b8' : '#b59b72';
      ctx.fillRect(x, pl.y, pl.w, 2);
      ctx.fillStyle = office ? '#2f3940' : '#32281d';
      for (let i = 8; i < pl.w - 4; i += 16) ctx.fillRect(x + i, pl.y + 6, 3, 3);
      ctx.fillStyle = 'rgba(255,248,231,.18)';
      ctx.fillRect(x + 2, pl.y + 1, pl.w - 4, 1);
      ctx.restore();
    }
  }

  function drawProps() {
    for (const prop of S.props) {
      if (!prop.alive) continue;
      const img = Art.props[prop.type];
      if (!img) continue;
      const sx = Math.round(prop.x - S.camera.x - img.width / 2 + (prop.shake > 0 ? rand(-1, 1) : 0));
      const sy = GROUND - img.height;
      // ombra
      ctx.globalAlpha = .25;
      ctx.fillStyle = '#0b0812';
      ctx.beginPath();
      ctx.ellipse(sx + img.width / 2, GROUND - 2, img.width * .34, 4, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      if (prop.flash > 0) {
        ctx.globalAlpha = .35;
        ctx.fillStyle = '#fff8e7';
        ctx.fillRect(sx, sy, img.width, img.height);
        ctx.globalAlpha = 1;
      }
      ctx.drawImage(img, sx, sy);
      if (prop.destructible && prop.hp < prop.maxHp && prop.hp > 0) {
        const pct = prop.hp / prop.maxHp;
        ctx.fillStyle = 'rgba(5,6,12,.7)';
        ctx.fillRect(sx + 3, sy - 5, img.width - 6, 3);
        ctx.fillStyle = pct > .5 ? '#51c7a9' : '#ef367f';
        ctx.fillRect(sx + 3, sy - 5, (img.width - 6) * pct, 3);
      }
    }
  }

  /* v2.0 — icone di fallback per scontrino/spritz/caffe (finché Art.pickups non le ha). */
  function drawPickupFallback(type, sx, sy, pulse) {
    if (type === 'scontrino') {
      ctx.fillStyle = '#0b0812'; ctx.fillRect(sx - 8, sy - 12, 16, 24);
      ctx.fillStyle = '#fff8e7'; ctx.fillRect(sx - 7, sy - 11, 14, 22);
      ctx.fillStyle = '#7280b3';
      for (let i = 0; i < 4; i++) ctx.fillRect(sx - 4, sy - 7 + i * 4, 8, 1);
      ctx.fillStyle = '#b91832'; ctx.fillRect(sx - 4, sy + 6, 8, 2);
    } else if (type === 'spritz') {
      ctx.fillStyle = '#ffc84b'; ctx.fillRect(sx - 8, sy - 4, 16, 3);
      ctx.fillStyle = '#ff845d';
      ctx.beginPath(); ctx.moveTo(sx - 6, sy - 2); ctx.lineTo(sx + 6, sy - 2); ctx.lineTo(sx + 3, sy + 10); ctx.lineTo(sx - 3, sy + 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff5b9d'; ctx.beginPath(); ctx.arc(sx + 1, sy + 2, 2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff8e7'; ctx.fillRect(sx + 4, sy - 12, 2, 10);
    } else if (type === 'caffe') {
      ctx.fillStyle = '#fff8e7'; ctx.fillRect(sx - 7, sy - 4, 12, 10);
      ctx.fillStyle = '#6d4a32'; ctx.fillRect(sx - 5, sy - 3, 8, 3);
      ctx.strokeStyle = '#fff8e7'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(sx + 7, sy + 2, 3, -.8, .8); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(sx - 2, sy - 12, 2, 5);
    } else {
      ctx.fillStyle = '#ffc84b'; ctx.fillRect(sx - 5, sy - 5, 10, 10);
    }
  }

  function drawPickups() {
    for (const it of S.pickups) {
      if (!it.alive) continue;
      let icon = Art.pickups[it.type];
      if (it.type === 'pensierino' && Art.items && Art.items[it.variant]) icon = Art.items[it.variant];
      const sx = Math.round(it.x - S.camera.x);
      const bob = Math.sin(S.time * 3 + it.phase) * 3;
      const sy = it.y + bob;
      const pulse = .7 + Math.sin(S.time * 4 + it.phase) * .3;
      ctx.save();
      ctx.globalAlpha = .22 + pulse * .15;
      ctx.fillStyle = it.type === 'health' || it.type === 'panino' ? '#51c7a9'
        : it.type === 'mascara' ? '#c598e0'
        : it.type === 'regalia' || it.type === 'pensierino' || it.type === 'telecomando' ? '#9fd7ff'
        : '#ffc84b';
      ctx.beginPath();
      ctx.ellipse(sx, sy, 21 + pulse * 6, 25 + pulse * 7, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      drawStar(sx - 14, sy - 13, 3 + pulse * 2, '#fff3a6', 4);
      drawStar(sx + 15, sy - 2, 2 + pulse, '#ff90b8', 4);
      if (icon) {
        ctx.drawImage(icon, Math.round(sx - icon.width / 2), Math.round(sy - icon.height / 2));
      } else {
        // v2.0 — icone procedurali per i pickup nuovi se art non le ha ancora
        drawPickupFallback(it.type, sx, sy, pulse);
      }
      ctx.restore();
    }
  }

  /* =========================================================
     PARTICELLE
     ========================================================= */
  function drawParticles() {
    for (const p of S.particles) {
      const x = Math.round(p.world ? p.x - S.camera.x : p.x);
      const y = Math.round(p.world ? p.y : p.y);
      const fade = clamp(p.life / Math.min(.35, p.maxLife), 0, 1);
      if (p.type === 'boom') {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.rot || 0);
        ctx.globalAlpha = clamp(p.life / p.maxLife * 1.35, 0, 1);
        const d = (p.size || 40) * 1.35;
        ctx.drawImage(p.img, -d / 2, -d / 2, d, d);
        ctx.globalAlpha = 1;
        ctx.restore();
      } else if (p.type === 'smoke') {
        ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1) * .5;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1, p.size), 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (p.type === 'spark') {
        ctx.globalAlpha = fade;
        ctx.fillStyle = p.color;
        const s = Math.max(1, Math.round(p.size * .7));
        ctx.fillRect(x, y, s, s);
        if (p.size > 2.6) {
          ctx.fillRect(x - 1, y + 1, 1, 1);
          ctx.fillRect(x + s, y - 1, 1, 1);
        }
        ctx.globalAlpha = 1;
      } else if (p.type === 'heart') {
        ctx.globalAlpha = clamp(p.life / .25, 0, 1) * .9;
        drawHeart(x, y, p.size, p.color);
        ctx.globalAlpha = 1;
      } else if (p.type === 'star') {
        ctx.globalAlpha = clamp(p.life / .2, 0, 1);
        drawStar(x, y, p.size, p.color, 4);
        ctx.globalAlpha = 1;
      } else if (p.type === 'ring') {
        const progress = 1 - p.life / p.maxLife;
        ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1) * .8;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, p.size * (.35 + progress * 1.3), 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (p.type === 'muzzle') {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(p.dir || 1, 1);
        ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
        ctx.drawImage(p.img, -p.img.width / 2, -p.img.height / 2);
        ctx.restore();
      } else if (p.type === 'bulletTrail') {
        ctx.globalAlpha = .4;
        ctx.fillStyle = p.color;
        ctx.fillRect(x, y, p.size, p.size);
        ctx.globalAlpha = 1;
      } else if (p.type === 'inkDrip') {
        ctx.globalAlpha = clamp(p.life / .2, 0, 1);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(x, y, p.size, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
      } else if (p.type === 'paper' || p.type === 'debris' || p.type === 'confetti') {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.rot || 0);
        ctx.globalAlpha = clamp(p.life / p.maxLife * 1.4, 0, 1);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, Math.max(2, p.size * .66));
        if (p.type === 'paper') {
          ctx.fillStyle = 'rgba(55,70,95,.45)';
          ctx.fillRect(-p.size / 2 + 1, -p.size / 3 + 1, p.size - 2, 1);
        }
        ctx.restore();
      } else if (p.type === 'text') {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.rot || 0);
        ctx.globalAlpha = clamp(p.life / p.maxLife * 1.6, 0, 1);
        ctx.font = Math.round(p.size) + 'px ' + PS_FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(5,5,10,.85)';
        ctx.fillText(p.text, 1.5, 1.5);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, 0, 0);
        ctx.restore();
      }
    }
  }

  function drawForeground() {
    const lvl = S.level;
    if (!lvl) return;
    // leve di primo piano, senza coprire il gameplay
    if (lvl.id === 1) {
      ctx.globalAlpha = .22;
      ctx.fillStyle = '#0a0812';
      for (let i = 0; i < 5; i++) {
        const x = mod(900 + i * 260 - S.camera.x * .85, 1100) - 200;
        if (x > -80 && x < W + 80) {
          ctx.beginPath();
          ctx.ellipse(x, H + 8, 80, 34, .2, 0, TAU);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  /* =========================================================
     ADELE — DISEGNO
     ========================================================= */
  function pickPlayerFrame(p) {
    const pf = Art.playerFrames;
    if (!pf || !pf.idle) return Art.getPlayerFrame({ mode: 'idle', phase: 0 });
    const heavy = p.weapon === 'mascara' && p.mascaraAmmo > 0;
    const moving = Math.abs(p.vx) > 24;
    const runFrame = pf.run[Math.floor(p.animT * 1.35) % 8];
    const idleFrame = pf.idle[Math.floor(p.animT * .55) % 4];
    if (p.crouching) return heavy ? pf.mascaraCrouch : pf.crouch[Math.floor(p.animT * 2) % 2];
    if (!p.onGround) {
      if (p.aimUp) return heavy ? pf.mascaraUp : pf.jumpUp;
      if (heavy) return pf.mascaraJump;
      if (p.aimDown) return pf.idleDown;
      return pf.jump[p.vy < -90 ? 0 : 1];
    }
    if (p.aimUp) {
      if (heavy) return pf.mascaraUp;
      return moving ? pf.runUp : pf.idleUp;
    }
    if (!heavy && input.shoot && pf.shoot) return pf.shoot;
    if (moving) return heavy ? pf.mascaraRun : runFrame;
    return heavy ? pf.mascaraIdle : idleFrame;
  }

  function drawPlayer() {
    const p = S.player;
    if (!p || p.dead) return;
    const sx = Math.round(p.x - S.camera.x);
    const sy = Math.round(p.y);
    const frame = pickPlayerFrame(p);
    const blink = p.invuln > 0 && Math.floor(S.time * 22) % 2 === 0;
    // ombra dinamica
    ctx.globalAlpha = .3;
    ctx.fillStyle = '#0b0812';
    ctx.beginPath();
    const shadowY = p.onGround && p.platform ? p.platform.y : GROUND - 1;
    ctx.ellipse(sx, shadowY, (p.onGround ? 19 : 14) * PLAYER_SCALE, 4, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    // alone mascara
    if (p.weapon === 'mascara' && p.mascaraAmmo > 0) {
      const pulse = .09 + Math.sin(S.time * 4) * .035;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#c598e0';
      ctx.beginPath();
      ctx.ellipse(sx, sy - 34 * PLAYER_SCALE, 26 * PLAYER_SCALE, 46 * PLAYER_SCALE, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (p.weaponSwitchFlash > 0) {
      ctx.globalAlpha = .25;
      drawStar(sx, sy - 55 * PLAYER_SCALE, 24, '#ffc84b', 6);
      ctx.globalAlpha = 1;
    }
    ctx.save();
    ctx.globalAlpha = blink ? .3 : 1;
    ctx.translate(sx - (p.recoil > .3 ? p.facing : 0) * PLAYER_SCALE, sy + 4 * PLAYER_SCALE);
    ctx.scale(p.facing * PLAYER_SCALE, PLAYER_SCALE);
    ctx.drawImage(frame, -Art.PLAYER.ax, -Art.PLAYER.ay);
    ctx.restore();
    ctx.globalAlpha = 1;
    // scia rossetto
    if (p.muzzle > 0 && !p.aimUp && !p.crouching) {
      const m = getMuzzle(p);
      ctx.save();
      ctx.globalAlpha = .32;
      ctx.strokeStyle = p.character === 'rocco' ? '#9fd7ff' : p.weapon === 'mascara' ? '#c598e0' : '#ff90b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(m.x - S.camera.x, m.y);
      ctx.lineTo(m.x - S.camera.x - p.facing * 23 * PLAYER_SCALE, m.y + rand(-3, 3));
      ctx.stroke();
      ctx.restore();
    }
  }

  /* =========================================================
     PROIETTILI — DISEGNO
     ========================================================= */
  function drawPlayerBullets() {
    for (const b of S.bullets) {
      const x = b.x - S.camera.x;
      if (x < -30 || x > W + 30) continue;
      if (b.kind === 'spritz') {
        ctx.save();
        ctx.translate(x, b.y);
        ctx.rotate((b.rot || 0) + S.time * 5);
        ctx.globalAlpha = .22; ctx.fillStyle = '#ff845d';
        ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ff845d'; ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ffc84b'; ctx.beginPath(); ctx.arc(-2, -2, 2.5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff8e7'; ctx.beginPath(); ctx.arc(-3, -3, 1.2, 0, TAU); ctx.fill();
        ctx.restore();
      } else if (b.kind === 'timbro') {
        ctx.save();
        ctx.translate(x, b.y);
        ctx.rotate((b.rot || 0) + S.time * 8);
        ctx.globalAlpha = .25; ctx.fillStyle = '#ffc84b';
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#8d5016'; ctx.fillRect(-7, -6, 14, 12);
        ctx.fillStyle = '#c62265'; ctx.fillRect(-5, -4, 10, 8);
        ctx.fillStyle = '#ffc84b'; ctx.fillRect(-2, -1, 4, 2);
        ctx.restore();
      } else if (b.kind === 'receipt') {
        ctx.save();
        ctx.translate(x, b.y);
        ctx.rotate((b.rot || 0) + S.time * 10);
        ctx.fillStyle = '#fff8e7'; ctx.fillRect(-4, -8, 8, 16);
        ctx.fillStyle = '#7280b3';
        for (let k = 0; k < 4; k++) ctx.fillRect(-3, -6 + k * 3, 6, 1);
        ctx.fillStyle = '#c62265'; ctx.fillRect(-1, 5, 2, 2);
        ctx.restore();
      } else if (b.kind === 'bolt') {
        ctx.save();
        ctx.translate(x, b.y);
        ctx.rotate((b.rot || 0) + S.time * 12);
        ctx.fillStyle = '#d8e1e8';
        ctx.fillRect(-4, -2, 8, 4);
        ctx.fillStyle = '#7b8b97';
        ctx.fillRect(-5, -1, 3, 2);
        ctx.fillStyle = '#fff8e7';
        ctx.fillRect(1, -1, 2, 1);
        ctx.globalAlpha = .28;
        ctx.strokeStyle = '#9fd7ff';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-b.vx * .02, 0); ctx.lineTo(0, 0); ctx.stroke();
        ctx.restore();
      } else if (b.heavy) {
        ctx.save();
        ctx.globalAlpha = .35;
        ctx.fillStyle = '#4d2c4e';
        ctx.beginPath(); ctx.ellipse(x - b.vx * .012, b.y, 18, 4, 0, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#1a1222';
        ctx.beginPath(); ctx.arc(x, b.y, 5.5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#9c62c8';
        ctx.beginPath(); ctx.arc(x - 1, b.y - 1, 3, 0, TAU); ctx.fill();
        ctx.fillStyle = '#e8d6ff';
        ctx.fillRect(x - 2, b.y - 3, 2, 2);
        ctx.restore();
      } else {
        ctx.save();
        ctx.globalAlpha = .32;
        ctx.strokeStyle = '#ff5b9d';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - b.vx * .025, b.y - b.vy * .025);
        ctx.lineTo(x, b.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#ff90b8';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(x - b.vx * .014, b.y - b.vy * .014);
        ctx.lineTo(x, b.y);
        ctx.stroke();
        ctx.fillStyle = '#fff3a6';
        ctx.fillRect(x - 1, b.y - 1, 2, 2);
        ctx.restore();
      }
    }
  }

  function drawGrenades() {
    for (const gr of S.grenades) {
      const x = gr.x - S.camera.x;
      const y = gr.y;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(gr.rot);
      if (gr.kind === 'remote') {
        ctx.fillStyle = '#0b0812';
        ctx.fillRect(-7, -11, 14, 22);
        ctx.fillStyle = '#25343f';
        ctx.fillRect(-6, -10, 12, 20);
        ctx.fillStyle = '#9fd7ff';
        ctx.fillRect(-4, -7, 8, 5);
        ctx.fillStyle = '#ff5b9d';
        ctx.beginPath(); ctx.arc(-2, 1, 1.7, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ffc84b';
        ctx.beginPath(); ctx.arc(2, 1, 1.7, 0, TAU); ctx.fill();
        ctx.fillStyle = '#51c7a9';
        ctx.beginPath(); ctx.arc(-2, 5, 1.7, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff8e7';
        ctx.beginPath(); ctx.arc(2, 5, 1.7, 0, TAU); ctx.fill();
        ctx.restore();
        continue;
      }
      // piumino da cipria
      ctx.fillStyle = '#0b0812';
      ctx.beginPath(); ctx.ellipse(0, 1, 12, 9, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffbfd8';
      ctx.beginPath(); ctx.ellipse(0, 0, 10, 8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ff90b8';
      ctx.beginPath(); ctx.ellipse(-3, -2, 6, 3, -.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff8e7';
      ctx.beginPath(); ctx.ellipse(0, -7, 7, 3.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffc84b';
      ctx.fillRect(-2, -11, 4, 4);
      ctx.restore();
      ctx.globalAlpha = .3;
      ctx.fillStyle = '#ff90b8';
      ctx.beginPath(); ctx.ellipse(x, y + 8, 15, 3, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawEBullets() {
    for (const b of S.eBullets) {
      const x = Math.round(b.x - S.camera.x);
      const y = Math.round(b.y);
      if (x < -60 || x > W + 60) continue;
      ctx.save();
      if (b.kind === 'orecchiette') {
        ctx.translate(x, y);
        ctx.rotate(b.rot || 0);
        ctx.fillStyle = 'rgba(255,200,75,.22)';
        ctx.beginPath(); ctx.ellipse(-6, 2, b.size * .9, b.size * .35, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#e8c98b';
        ctx.beginPath(); ctx.ellipse(0, 0, b.size * .46, b.size * .3, .2, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#a8743f'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, b.size * .29, .3, TAU - .3); ctx.stroke();
        ctx.fillStyle = '#fff8e7'; ctx.fillRect(-2, -2, 3, 2);
      } else if (b.kind === 'sgagliozze') {
        ctx.translate(x, y);
        ctx.rotate(b.rot || 0);
        ctx.fillStyle = 'rgba(255,200,75,.2)';
        ctx.beginPath(); ctx.arc(0, 0, b.size * .9, 0, TAU); ctx.fill();
        ctx.fillStyle = '#d99b3c';
        ctx.fillRect(-b.size * .42, -b.size * .34, b.size * .84, b.size * .68);
        ctx.fillStyle = '#ffd77a';
        ctx.fillRect(-b.size * .3, -b.size * .24, b.size * .6, b.size * .28);
        ctx.fillStyle = '#8d5016';
        ctx.fillRect(-b.size * .22, b.size * .12, b.size * .2, b.size * .1);
        ctx.globalAlpha = .45; ctx.strokeStyle = '#fff8e7'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-b.size * .3, -b.size * .55); ctx.quadraticCurveTo(0, -b.size * .8, b.size * .25, -b.size * .55); ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (b.kind === 'beach') {
        ctx.translate(x, y);
        ctx.rotate((b.rot || 0) + S.time * 4);
        ctx.fillStyle = '#fff8e7';
        ctx.beginPath(); ctx.arc(0, 0, b.size * .55, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ff5b9d';
        ctx.beginPath(); ctx.arc(0, 0, b.size * .55, -.4, .35); ctx.lineTo(0, 0); ctx.fill();
        ctx.fillStyle = '#51c7a9';
        ctx.beginPath(); ctx.arc(0, 0, b.size * .55, 1.15, 1.9); ctx.lineTo(0, 0); ctx.fill();
        ctx.strokeStyle = '#1a1222'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, b.size * .55, 0, TAU); ctx.stroke();
      } else if (b.kind === 'mic') {
        ctx.translate(x, y);
        ctx.rotate(-.35);
        ctx.fillStyle = '#2a2f38'; ctx.fillRect(-3, -b.size * .12, 6, b.size * .55);
        ctx.fillStyle = '#c3d0d8'; ctx.beginPath(); ctx.arc(0, -b.size * .2, b.size * .25, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(197,152,224,.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, -b.size * .2, b.size * .55, -.7, .7); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -b.size * .2, b.size * .8, -.6, .6); ctx.stroke();
      } else if (b.kind === 'heart') {
        ctx.translate(x, y);
        ctx.globalAlpha = .24;
        drawHeart(0, 0, b.size * 1.2, '#ff90b8');
        ctx.globalAlpha = 1;
        ctx.drawImage(Art.icons.heart, -b.size / 2 - 2, -b.size / 2 - 2, b.size + 4, b.size + 4);
      } else if (b.kind === 'rose') {
        ctx.translate(x, y);
        ctx.rotate(b.rot || 0);
        ctx.drawImage(Art.icons.rose, -b.size / 2, -b.size / 2, b.size, b.size);
      } else if (b.kind === 'stamp') {
        ctx.translate(x, y);
        ctx.rotate(b.rot || 0);
        ctx.drawImage(Art.icons.stamp, -b.size / 2, -b.size / 2, b.size, b.size);
      } else if (b.kind === 'phone') {
        ctx.translate(x, y);
        ctx.globalAlpha = .55;
        ctx.strokeStyle = '#51c7a3';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, 0, 18 + Math.sin(b.t * 8) * 3, -.7, .7); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 27 + Math.sin(b.t * 8) * 4, -.6, .6); ctx.stroke();
        ctx.globalAlpha = .9;
        ctx.drawImage(Art.icons.phone, -21, -13);
        ctx.fillStyle = 'rgba(255,132,93,.5)';
        ctx.fillRect(-10, 13, 20, 2);
      } else if (b.kind === 'ticket') {
        ctx.translate(x, y);
        ctx.rotate(Math.sin(b.t * 5) * .12 + .05);
        ctx.globalAlpha = .18;
        ctx.fillStyle = '#ffc84b';
        ctx.fillRect(-b.size - 5, -b.size * .35, b.size * 2 + 10, b.size * .7);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff8e7'; ctx.fillRect(-b.size * .55, -b.size * .4, b.size * 1.1, b.size * .8);
        ctx.strokeStyle = '#1a1222'; ctx.lineWidth = 1; ctx.strokeRect(-b.size * .55, -b.size * .4, b.size * 1.1, b.size * .8);
        ctx.fillStyle = '#7280b3';
        for (let i = 0; i < 3; i++) ctx.fillRect(-b.size * .4, -b.size * .24 + i * 3, b.size * .45, 1);
        ctx.fillStyle = '#c62265'; ctx.beginPath(); ctx.arc(b.size * .3, b.size * .15, 2.8, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ffc84b'; ctx.beginPath(); ctx.arc(b.size * .3, b.size * .15, 1.7, 0, TAU); ctx.fill();
      } else if (b.kind === 'paper') {
        ctx.translate(x, y);
        ctx.rotate(b.rot || 0);
        ctx.globalAlpha = .2;
        ctx.fillStyle = '#c3d0d8';
        ctx.fillRect(-b.size * .7 - 4, -b.size * .5, b.size * 1.4 + 8, b.size);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff8e7';
        ctx.fillRect(-b.size * .5, -b.size * .42, b.size, b.size * .84);
        ctx.strokeStyle = '#1a1222'; ctx.lineWidth = 1;
        ctx.strokeRect(-b.size * .5, -b.size * .42, b.size, b.size * .84);
        ctx.fillStyle = '#7280b3';
        for (let k = 0; k < 3; k++) ctx.fillRect(-b.size * .36, -b.size * .22 + k * 4, b.size * .55, 1);
        ctx.fillStyle = '#c62265';
        ctx.fillRect(b.size * .2, b.size * .18, b.size * .22, b.size * .22);
      } else if (b.kind === 'soap') {
        ctx.translate(x, y);
        ctx.rotate(b.rot || 0);
        ctx.globalAlpha = .3;
        ctx.fillStyle = '#9fd7ff';
        ctx.beginPath(); ctx.arc(0, 0, b.size * .9, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#8b98a0';
        ctx.fillRect(-b.size * .55, -b.size * .35, b.size * 1.1, b.size * .7);
        ctx.fillStyle = '#e8f6ff';
        ctx.fillRect(-b.size * .4, -b.size * .25, b.size * .8, b.size * .2);
        ctx.fillStyle = '#9fd7ff';
        ctx.beginPath(); ctx.arc(b.size * .35, -b.size * .15, 2.5, 0, TAU); ctx.fill();
      } else if (b.kind === 'pointer') {
        ctx.translate(x, y);
        ctx.globalAlpha = .7;
        ctx.strokeStyle = '#ff4d6d';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-b.vx * .018, 0); ctx.lineTo(0, 0); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ff4d6d';
        ctx.beginPath(); ctx.arc(0, 0, b.size * .55 + Math.sin(b.t * 18) * 2, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff8e7';
        ctx.beginPath(); ctx.arc(0, 0, 2, 0, TAU); ctx.fill();
      } else if (b.kind === 'ink') {
        ctx.translate(x, y);
        ctx.globalAlpha = .35;
        ctx.fillStyle = '#9c62c8';
        ctx.beginPath(); ctx.arc(0, 0, b.size, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.drawImage(Art.icons.ink, -b.size * .7, -b.size * .7, b.size * 1.4, b.size * 1.4);
      } else if (b.kind === 'pan') {
        ctx.translate(x, y);
        ctx.rotate(b.rot || 0);
        ctx.fillStyle = '#2a2f38';
        ctx.beginPath(); ctx.arc(0, 0, b.size * .62, 0, TAU); ctx.fill();
        ctx.fillStyle = '#4a5260';
        ctx.beginPath(); ctx.arc(0, 0, b.size * .5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#6d7686';
        ctx.beginPath(); ctx.arc(0, 0, b.size * .3, 0, TAU); ctx.fill();
        ctx.fillStyle = '#2a2f38';
        ctx.fillRect(b.size * .55, -3, b.size * .62, 6);
      } else if (b.kind === 'pizza') {
        ctx.translate(x, y);
        ctx.rotate(b.rot || 0);
        ctx.fillStyle = '#e0a34e';
        ctx.beginPath();
        ctx.moveTo(-b.size * .6, -b.size * .5);
        ctx.lineTo(b.size * .6, -b.size * .1);
        ctx.lineTo(-b.size * .2, b.size * .55);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#b4202f';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(-b.size * .2 + i * b.size * .18, -b.size * .12 + i * b.size * .1, b.size * .08, 0, TAU);
          ctx.fill();
        }
      } else if (b.kind === 'cloud') {
        ctx.translate(x, y);
        ctx.globalAlpha = .82;
        const puff = 1 + Math.sin((b.t || 0) * 6) * .08;
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = i % 2 ? '#8fd14f' : '#5f9c34';
          ctx.beginPath();
          ctx.arc((i - 1.5) * b.size * .28, Math.sin(i * 2 + b.t * 3) * 5, b.size * .34 * puff, 0, TAU);
          ctx.fill();
        }
        ctx.globalAlpha = .9;
        ctx.fillStyle = '#2b3f1c';
        ctx.fillRect(-8, -4, 3, 3);
        ctx.fillRect(6, -4, 3, 3);
        ctx.fillRect(-5, 5, 11, 2);
      } else if (b.kind === 'austerity') {
        ctx.translate(x, y);
        ctx.rotate(b.rot || 0);
        ctx.fillStyle = '#e8e4d5';
        ctx.fillRect(-b.size * .5, -b.size * .38, b.size, b.size * .76);
        ctx.strokeStyle = '#4a5589'; ctx.lineWidth = 1;
        ctx.strokeRect(-b.size * .5, -b.size * .38, b.size, b.size * .76);
        ctx.fillStyle = '#7280b3';
        for (let i = 0; i < 3; i++) ctx.fillRect(-b.size * .34, -b.size * .2 + i * 5, b.size * .55, 1);
        ctx.fillStyle = '#c62265';
        ctx.beginPath(); ctx.arc(b.size * .32, b.size * .24, 2.5, 0, TAU); ctx.fill();
      } else if (b.kind === 'baguette') {
        ctx.translate(x, y);
        ctx.rotate(b.rot || 0);
        ctx.fillStyle = '#d9a25a';
        ctx.fillRect(-b.size * .55, -b.size * .16, b.size * 1.1, b.size * .32);
        ctx.fillStyle = '#f2c87e';
        for (let i = 0; i < 3; i++) {
          ctx.save();
          ctx.translate(-b.size * .34 + i * b.size * .34, 0);
          ctx.rotate(.5);
          ctx.fillRect(-2, -b.size * .2, 4, b.size * .1);
          ctx.restore();
        }
      } else if (b.kind === 'cap') {
        ctx.translate(x, y);
        ctx.rotate(b.rot || 0);
        ctx.fillStyle = '#2a6db5';
        ctx.beginPath(); ctx.arc(0, 0, b.size * .5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#4f96d9';
        ctx.beginPath(); ctx.arc(0, 0, b.size * .34, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#173e66'; ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * TAU;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * b.size * .5, Math.sin(a) * b.size * .5);
          ctx.lineTo(Math.cos(a) * b.size * .66, Math.sin(a) * b.size * .66);
          ctx.stroke();
        }
      } else if (b.kind === 'window') {
        ctx.translate(x, y);
        ctx.fillStyle = '#d8e6f2';
        ctx.fillRect(-b.size * .5, -b.size * .42, b.size, b.size * .84);
        ctx.fillStyle = '#4a5589';
        ctx.fillRect(-b.size * .5, -b.size * .42, b.size, b.size * .2);
        ctx.fillStyle = '#fff8e7';
        ctx.fillRect(-b.size * .5, -b.size * .42, b.size, 2);
        for (let i = 0; i < 3; i++) ctx.fillRect(b.size * .34 - i * 4, -b.size * .36, 3, 3);
        ctx.fillStyle = '#7d8fa6';
        for (let k = 0; k < 3; k++) ctx.fillRect(-b.size * .34, -b.size * .1 + k * 6, b.size * .5, 2);
      } else if (b.kind === 'error') {
        ctx.translate(x, y);
        ctx.rotate(b.rot || 0);
        ctx.fillStyle = '#b91832';
        ctx.beginPath();
        ctx.moveTo(0, -b.size * .52);
        ctx.lineTo(b.size * .5, b.size * .42);
        ctx.lineTo(-b.size * .5, b.size * .42);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff8e7';
        ctx.fillRect(-2, -b.size * .22, 4, b.size * .34);
        ctx.fillRect(-2, b.size * .2, 4, 4);
      } else if (b.kind === 'money') {
        ctx.translate(x, y);
        ctx.rotate(b.rot || 0);
        ctx.fillStyle = '#3f8f5c';
        ctx.fillRect(-b.size * .55, -b.size * .3, b.size * 1.1, b.size * .6);
        ctx.strokeStyle = '#b7e36a'; ctx.lineWidth = 1;
        ctx.strokeRect(-b.size * .55, -b.size * .3, b.size * 1.1, b.size * .6);
        ctx.fillStyle = '#e8f6d4';
        ctx.fillRect(-b.size * .08, -b.size * .12, b.size * .16, b.size * .24);
      } else if (b.kind === 'coin') {
        ctx.translate(x, y);
        ctx.rotate(b.rot || 0);
        ctx.fillStyle = '#5c4a12';
        ctx.beginPath(); ctx.arc(0, 0, b.size * .46, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ffc84b';
        ctx.beginPath(); ctx.arc(0, 0, b.size * .36, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff3a6';
        ctx.fillRect(-2, -b.size * .18, 4, b.size * .36);
      } else if (b.kind === 'orb') {
        const pulse = 1 + Math.sin(b.t * 9) * .12;
        ctx.translate(x, y);
        ctx.globalAlpha = .24;
        ctx.fillStyle = '#ffc84b';
        ctx.beginPath(); ctx.arc(0, 0, b.size * pulse, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.rotate(b.rot || 0);
        ctx.drawImage(Art.icons.orb, -b.size * .8, -b.size * .8, b.size * 1.6, b.size * 1.6);
      }
      ctx.restore();
    }
  }

  /* =========================================================
     NEMICI — DISEGNO
     ========================================================= */
  const whiteCache = new WeakMap();
  function getWhite(img) {
    if (!whiteCache.has(img)) whiteCache.set(img, Art.silhouette(img, '#fff8e7'));
    return whiteCache.get(img);
  }
  const tintCache = new WeakMap();
  function getTint(img, color) {
    let byColor = tintCache.get(img);
    if (!byColor) { byColor = new Map(); tintCache.set(img, byColor); }
    if (!byColor.has(color)) byColor.set(color, Art.silhouette(img, color));
    return byColor.get(color);
  }

  function enemyFrame(e) {
    const frames = Art.enemyFrames && Art.enemyFrames[e.visual || e.type];
    if (!frames || !frames.length) return null;
    // v2.0 — indici protetti: se art fornisce meno frame del previsto si usa l'ultimo
    // disponibile, così il gioco non crasha mentre level-art completa gli sprite.
    const pick = (i) => frames[clamp(i, 0, frames.length - 1)];
    if (e.hitFlash > 0) {
      if (e.type === 'pretender') return pick(6);
      if (e.type === 'boomer') return pick(5);
      return pick(5);
    }
    if (e.windup > 0) {
      if (e.type === 'pretender') return e.pending === 'rose' ? pick(5) : pick(4);
      if (e.type === 'boomer') return pick(4);
      return pick(4);
    }
    return pick(Math.floor(e.animT * 6) % 4);
  }

  /* v2.0 — fallback procedurale per i nemici nuovi: usato solo se
     Art.enemyFrames[type] non esiste ancora (art in corso). */
  function drawEnemyFallback(e) {
    const h = e.h / ENEMY_SCALE, w = e.w / ENEMY_SCALE;
    const cy = -h;
    ctx.save();
    switch (e.type) {
      case 'centurione':
        // tunica rossa + elmo crestato + scudo con timbro
        ctx.fillStyle = '#8c1c2b'; ctx.fillRect(-w * .5, cy + h * .34, w, h * .5);
        ctx.fillStyle = '#b91832'; ctx.fillRect(-w * .5, cy + h * .34, w, h * .12);
        ctx.fillStyle = '#e8c9a0'; ctx.beginPath(); ctx.arc(0, cy + h * .2, w * .34, 0, TAU); ctx.fill();
        ctx.fillStyle = '#c8a24a'; ctx.fillRect(-w * .52, cy + h * .08, w * 1.04, h * .1);
        ctx.fillStyle = '#b91832'; ctx.fillRect(-2, cy + h * .02, 4, h * .12);
        ctx.fillStyle = '#c8a24a'; ctx.fillRect(-w * .62, cy + h * .3, w * .34, h * .42);
        ctx.fillStyle = '#5c4a12'; ctx.fillRect(-w * .56, cy + h * .42, w * .22, 3);
        ctx.fillStyle = '#8d5016'; ctx.fillRect(-w * .1, cy + h * .84, w * .2, h * .16);
        break;
      case 'boomerTossico':
        // boomer con telefono e nube verde in mano
        ctx.fillStyle = '#4a5589'; ctx.fillRect(-w * .46, cy + h * .36, w * .92, h * .5);
        ctx.fillStyle = '#e8c9a0'; ctx.beginPath(); ctx.arc(0, cy + h * .2, w * .34, 0, TAU); ctx.fill();
        ctx.fillStyle = '#c3d0d8'; ctx.fillRect(-w * .4, cy + h * .04, w * .8, h * .12);
        ctx.fillStyle = '#8fd14f'; ctx.globalAlpha = .75;
        ctx.beginPath(); ctx.arc(w * .5, cy + h * .5 + Math.sin(S.time * 5 + e.animT) * 3, w * .3, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#2a2f38'; ctx.fillRect(w * .22, cy + h * .48, w * .18, h * .26);
        break;
      case 'meccanico':
        // tuta blu + chiave inglese
        ctx.fillStyle = '#2a6db5'; ctx.fillRect(-w * .46, cy + h * .34, w * .92, h * .52);
        ctx.fillStyle = '#4f96d9'; ctx.fillRect(-w * .46, cy + h * .34, w * .92, h * .12);
        ctx.fillStyle = '#e8c9a0'; ctx.beginPath(); ctx.arc(0, cy + h * .19, w * .32, 0, TAU); ctx.fill();
        ctx.fillStyle = '#c3d0d8'; ctx.fillRect(-w * .36, cy + h * .05, w * .72, h * .1);
        ctx.fillStyle = '#9aa4b0';
        ctx.fillRect(w * .3, cy + h * .4, w * .18, h * .34);
        ctx.fillRect(w * .24, cy + h * .34, w * .3, h * .12);
        break;
      case 'cuoco':
        // cappello bianco, pancia, padella
        ctx.fillStyle = '#f2fbff'; ctx.fillRect(-w * .46, cy + h * .36, w * .92, h * .5);
        ctx.fillStyle = '#e8c9a0'; ctx.beginPath(); ctx.arc(0, cy + h * .21, w * .34, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff8e7'; ctx.fillRect(-w * .5, cy + h * .02, w, h * .14);
        ctx.fillRect(-w * .38, cy - h * .04, w * .76, h * .1);
        ctx.fillStyle = '#2a2f38';
        ctx.beginPath(); ctx.arc(w * .42, cy + h * .56, w * .24, 0, TAU); ctx.fill();
        ctx.fillRect(w * .5, cy + h * .5, w * .34, 3);
        break;
      case 'merkel':
        // caschetto grigio, tailleur, cartellina
        ctx.fillStyle = '#3d5280'; ctx.fillRect(-w * .46, cy + h * .36, w * .92, h * .5);
        ctx.fillStyle = '#e8e4d5'; ctx.fillRect(-w * .12, cy + h * .36, w * .24, h * .4);
        ctx.fillStyle = '#f0d2ae'; ctx.beginPath(); ctx.arc(0, cy + h * .2, w * .32, 0, TAU); ctx.fill();
        ctx.fillStyle = '#c3d0d8';
        ctx.beginPath(); ctx.arc(0, cy + h * .16, w * .36, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#c62265'; ctx.fillRect(w * .32, cy + h * .5, w * .24, h * .16);
        break;
      case 'francese':
        // basco, smorfia, baguette
        ctx.fillStyle = '#2e3a50'; ctx.fillRect(-w * .44, cy + h * .38, w * .88, h * .46);
        ctx.fillStyle = '#f0d2ae'; ctx.beginPath(); ctx.arc(0, cy + h * .2, w * .33, 0, TAU); ctx.fill();
        ctx.fillStyle = '#b91832'; ctx.beginPath(); ctx.arc(0, cy + h * .07, w * .4, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#d9a25a'; ctx.fillRect(w * .3, cy + h * .52, w * .5, h * .08);
        break;
      case 'bottiglia':
        // bottiglia PET con tappo attaccato
        ctx.fillStyle = '#2a6db5'; ctx.fillRect(-w * .34, cy + h * .2, w * .68, h * .7);
        ctx.fillStyle = '#4f96d9'; ctx.fillRect(-w * .28, cy + h * .24, w * .3, h * .58);
        ctx.fillStyle = '#2a6db5'; ctx.fillRect(-w * .16, cy + h * .04, w * .32, h * .18);
        ctx.fillStyle = '#b7e36a'; ctx.fillRect(-w * .2, cy + h * .0, w * .4, h * .08);
        ctx.fillStyle = '#e8f6ff'; ctx.fillRect(-w * .2, cy + h * .42, w * .16, h * .2);
        break;
      default:
        ctx.fillStyle = '#c598e0'; ctx.fillRect(-w * .5, cy + h * .3, w, h * .56);
        ctx.fillStyle = '#2b3440'; ctx.fillRect(-w * .5, cy + h * .2, w, h * .14);
        break;
    }
    ctx.restore();
  }

  function drawEnemies() {
    const AURA = {
      utente: '#51c7a3', boomer: '#ff845d', finanziere: '#ffc84b',
      centurione: '#ff845d', boomerTossico: '#8fd14f', meccanico: '#9fd7ff', cuoco: '#ffc84b',
      merkel: '#9fd7ff', francese: '#ff90b8', bottiglia: '#4f96d9',
      software: '#9fd7ff', programma: '#7280b3', bug: '#8fd14f', errore: '#b91832',
      crash: '#2a6db5', computer: '#9fd7ff'
    };
    for (const e of S.enemies) {
      if (!e.alive) continue;
      const sx = Math.round(e.x - S.camera.x);
      if (sx < -100 || sx > W + 110) continue;
      const frame = enemyFrame(e);
      const bob = e.stunTimer > 0 ? Math.sin(S.time * 9) * 1.2
        : e.flying ? 0 : Math.abs(Math.sin(e.animT * 4)) * .8;
      // ombra a terra (resta sul terreno anche per i nemici volanti)
      ctx.globalAlpha = e.flying ? .18 : .3;
      ctx.fillStyle = '#0b0812';
      ctx.beginPath(); ctx.ellipse(sx, GROUND - 1, 15 * ENEMY_SCALE, 4, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
      if (e.slowTimer > 0) {
        ctx.globalAlpha = .16;
        ctx.fillStyle = '#4d2c4e';
        ctx.beginPath(); ctx.ellipse(sx, e.y - 28 * ENEMY_SCALE, 25 * ENEMY_SCALE, 34 * ENEMY_SCALE, 0, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
      }
      // v2.0 — scudo "installazione in corso" del programma SOGEI
      if (e.shieldHp > 0) {
        const sp = .32 + Math.sin(S.time * 5 + e.animT) * .12;
        ctx.globalAlpha = sp;
        ctx.strokeStyle = '#9fd7ff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(sx, e.y - e.h * .5, e.w * .95, e.h * .72, 0, 0, TAU); ctx.stroke();
        ctx.globalAlpha = sp * .5;
        ctx.fillStyle = '#9fd7ff';
        ctx.beginPath(); ctx.ellipse(sx, e.y - e.h * .5, e.w * .95, e.h * .72, 0, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
      }
      // aura attacco
      if (e.windup > 0) {
        const pulse = .35 + Math.sin(S.time * 16) * .2;
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = AURA[e.type] || '#ff90b8';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(sx, e.y - 36 * ENEMY_SCALE, 23 * ENEMY_SCALE, 40 * ENEMY_SCALE, 0, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.save();
      ctx.translate(sx, e.y + 2 + bob);
      ctx.scale(e.dir * ENEMY_SCALE, ENEMY_SCALE);
      if (frame) {
        if (e.hitFlash > 0) {
          ctx.globalAlpha = .38;
          ctx.drawImage(getWhite(frame), -Art.ENEMY.ax, -Art.ENEMY.ay);
          ctx.globalAlpha = 1;
        }
        ctx.drawImage(frame, -Art.ENEMY.ax, -Art.ENEMY.ay);
        // v2.0 — livelli bonus: nemici v1 in versione psichedelica (tinta arcobaleno)
        if (S.bonus) {
          const hue = ['#ff5b9d', '#ffc84b', '#51c7a9', '#9fd7ff', '#c598e0'][Math.floor(S.time * 3 + e.animT) % 5];
          ctx.globalAlpha = .16 + Math.sin(S.time * 4 + e.animT) * .07;
          ctx.drawImage(getTint(frame, hue), -Art.ENEMY.ax, -Art.ENEMY.ay);
          ctx.globalAlpha = 1;
        }
      } else {
        // art non ancora disponibile: sagoma procedurale colorata
        if (e.hitFlash > 0) { ctx.globalAlpha = .45; ctx.fillStyle = '#fff8e7'; ctx.fillRect(-e.w * .5, -e.h, e.w, e.h); ctx.globalAlpha = 1; }
        drawEnemyFallback(e);
      }
      ctx.restore();
      if (e.windup > 0) {
        const sym = ['utente', 'boomer', 'finanziere', 'boomerTossico', 'cuoco', 'merkel', 'errore'].includes(e.type) ? '!' : '♥';
        const color = AURA[e.type] || '#ff90b8';
        ctx.globalAlpha = .75 + Math.sin(S.time * 16) * .25;
        ctx.fillStyle = 'rgba(5,6,12,.75)';
        ctx.fillRect(sx - 8, e.y - e.h - 20, 16, 14);
        drawText(sym, sx, e.y - e.h - 19, 8, color, 'center');
        ctx.globalAlpha = 1;
      }
      if (e.stunTimer > 0) {
        for (let i = 0; i < 3; i++) {
          const a = S.time * 5 + i / 3 * TAU;
          drawStar(sx + Math.cos(a) * 13, e.y - 73 * ENEMY_SCALE + Math.sin(a) * 3, 2.5, '#ffc84b', 4);
        }
      }
    }
  }

  /* =========================================================
     BOSS + ATTACCHI — DISEGNO
     ========================================================= */
  function drawHazardWarnings() {
    const t = S.time;
    for (const h of S.hazards) {
      if (h.telegraph <= 0) continue;
      const sx = Math.round(h.x - S.camera.x);
      const pulse = .45 + Math.sin(t * 18) * .3;
      if (h.kind === 'column') {
        const col = h.color || '#ffc84b';
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 5]);
        ctx.beginPath(); ctx.moveTo(sx, 34); ctx.lineTo(sx, GROUND - 4); ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = .25;
        ctx.fillStyle = col;
        ctx.fillRect(sx - h.width / 2, 34, h.width, GROUND - 38);
        ctx.globalAlpha = pulse;
        drawStar(sx, GROUND - 6, 10, col, 4);
        ctx.strokeStyle = col;
        ctx.beginPath(); ctx.ellipse(sx, GROUND - 3, h.width / 2 + 8, 6, 0, 0, TAU); ctx.stroke();
        if (h.label) drawText(h.label, sx, GROUND - 70, 5, col, 'center');
        ctx.restore();
      } else if (h.kind === 'slam') {
        ctx.save();
        ctx.globalAlpha = pulse * .9;
        ctx.strokeStyle = '#c598e0';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(sx, GROUND - 3, h.width / 2 + 12, 8, 0, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(sx, GROUND - 3, h.width / 4, 4, 0, 0, TAU); ctx.stroke();
        ctx.fillStyle = 'rgba(155,93,189,.15)';
        ctx.fillRect(sx - h.width / 2, 70, h.width, GROUND - 73);
        ctx.globalAlpha = .65;
        ctx.setLineDash([3, 7]);
        ctx.strokeStyle = '#9c62c8';
        ctx.beginPath(); ctx.moveTo(sx, 70); ctx.lineTo(sx, GROUND - 10); ctx.stroke();
        ctx.setLineDash([]);
        drawText('!', sx, GROUND - 32, 8, '#ff90b8', 'center');
        ctx.restore();
      } else if (h.kind === 'stamp') {
        // v2.0 — timbro gigante di Cesare: rettangolo tratteggiato che scende
        const col = h.color || '#ffc84b';
        const progress = clamp(h.telegraph / .8, 0, 1);
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(sx - h.width / 2, 40, h.width, GROUND - 46);
        ctx.setLineDash([]);
        ctx.globalAlpha = .18;
        ctx.fillStyle = col;
        ctx.fillRect(sx - h.width / 2, 40 + (1 - progress) * 30, h.width, GROUND - 76);
        ctx.globalAlpha = .8;
        drawText(h.label || 'TIMBRO!', sx, 26, 6, col, 'center');
        ctx.restore();
      } else if (h.kind === 'cuff') {
        // v2.0 — manette telegrafate (boss CEO SOGEI)
        const col = h.color || '#b7e36a';
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.moveTo(sx - 20, 26); ctx.lineTo(sx - 20, GROUND - 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx + 20, 26); ctx.lineTo(sx + 20, GROUND - 20); ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = .2;
        ctx.fillStyle = col;
        ctx.fillRect(sx - h.width / 2, 40, h.width, GROUND - 44);
        ctx.globalAlpha = .9;
        drawText('MANETTE', sx, 30, 6, col, 'center');
        ctx.beginPath(); ctx.ellipse(sx, GROUND - 4, h.width / 2 + 12, 7, 0, 0, TAU); ctx.stroke();
        ctx.restore();
      } else if (h.kind === 'circolare') {
        // v2.0 — fogli che piovono dall'alto con ombra a terra
        ctx.save();
        ctx.globalAlpha = pulse * .85;
        ctx.strokeStyle = '#9fd7ff';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(sx, 30); ctx.lineTo(sx, GROUND - 4); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.ellipse(sx, GROUND - 3, h.width / 2 + 10, 6, 0, 0, TAU); ctx.stroke();
        ctx.globalAlpha = .9;
        drawText('CIRCOLARE', sx, 34, 5, '#fff8e7', 'center');
        ctx.restore();
      }
    }
    // telegrafo laser del Mecha
    if (S.boss && S.boss.kind === 'mecha' && S.boss.state === 'windup' && S.boss.attack === 'laser') {
      const y = GROUND - 28;
      const sx = S.boss.x - S.camera.x + 118;
      const flicker = Math.sin(t * 28) > 0;
      ctx.save();
      ctx.globalAlpha = .5 + Math.sin(t * 20) * .25;
      ctx.strokeStyle = flicker ? '#ff5b9d' : '#ffc84b';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(sx, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = .15;
      ctx.fillStyle = '#ffc84b';
      ctx.fillRect(0, y - 8, sx, 16);
      ctx.globalAlpha = .7;
      drawText('PENITENZA!', sx - 120, y - 22, 6, '#ffc84b', 'center');
      ctx.restore();
    }
  }

  /* v2.0 — helper per i boss v2 (art con frames idle/attack/hurt/rage).
     Regge sia oggetti {idle:[...]} sia array piatti, e restituisce null se
     level-art non ha ancora fornito lo sprite (fallback procedurale). */
  function bossArtList(frames, name) {
    if (!frames) return null;
    const v = frames[name];
    if (!v) return null;
    return Array.isArray(v) ? v : [v];
  }

  function pickBossArtFrame(art, b, t) {
    if (!art) return null;
    const frames = art.frames || art;
    if (!frames || Array.isArray(frames)) return null;
    const idle = bossArtList(frames, 'idle') || bossArtList(frames, 'idle0');
    const attack = bossArtList(frames, 'attack') || bossArtList(frames, 'windup');
    const hurt = bossArtList(frames, 'hurt') || bossArtList(frames, 'hit');
    const rage = bossArtList(frames, 'rage');
    const pick = (list) => (list && list.length) ? list[Math.floor(t * 2.2) % list.length] : null;
    if (b.state === 'dying' || b.hitFlash > 0) return pick(hurt) || pick(idle) || pick(attack);
    if (b.state === 'rage') return pick(rage) || pick(attack) || pick(idle);
    if (b.state === 'windup') return pick(attack) || pick(idle);
    return pick(idle) || pick(attack);
  }

  /* Disegno comune boss v2: art se presente, altrimenti fallback procedurale.
     art = { frames:{...}, w, h, ax, ay }; l'ancora segue il pattern di Art.OCTO. */
  function drawArtBoss(b, sx, t, art, fallback, metrics) {
    const frame = pickBossArtFrame(art, b, t);
    if (frame) {
      const ax = art.ax != null ? art.ax : (art.w || metrics.w) * .5;
      const ay = art.ay != null ? art.ay : (art.h || metrics.h);
      const dx = Math.round(sx - ax);
      const dy = Math.round(GROUND - ay + Math.sin(t * 1.6) * 1.5);
      /* Cesare, Ursula e l'ex CEO guardano verso sinistra: il giocatore arriva
         da sinistra, quindi specchiamo l'immagine attorno all'ancora. */
      const flip = b.kind === 'cesare' || b.kind === 'ursula' || b.kind === 'ceo'
        || b.kind === 'mecha' || b.kind === 'direttore';
      const reduceShake = S.settings && S.settings.reduceShake;
      const shakeX = b.state === 'dying' && !reduceShake ? rand(-3, 3) : 0;
      const shakeY = b.state === 'dying' && !reduceShake ? rand(-3, 3) : 0;
      const blit = (img, alpha = 1) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(dx + shakeX, dy + shakeY);
        if (flip) { ctx.translate(ax, 0); ctx.scale(-1, 1); }
        ctx.drawImage(img, 0, 0);
        ctx.restore();
      };
      blit(frame);
      if (b.hitFlash > 0 && b.state !== 'dying') blit(getWhite(frame), .42);
      if (b.phase === 2 && b.state !== 'dying') {
        blit(getTint(frame, b.kind === 'ursula' ? '#51c7a9' : b.kind === 'ceo' ? '#b7e36a' : '#ffc84b'), .12 + Math.sin(t * 7) * .05);
      }
      return true;
    }
    fallback(b, sx, t);
    return false;
  }

  function drawBoss() {
    const b = S.boss;
    if (!b || b.state === 'dead') return;
    const sx = b.x - S.camera.x;
    const t = S.time;
    if (b.kind === 'octo') drawOctoBoss(b, sx, t);
    else if (b.kind === 'direttore') drawDirettoreBoss(b, sx, t);
    else if (b.kind === 'mecha') drawMechaBoss(b, sx, t);
    else if (b.kind === 'cesare') drawCesareBoss(b, sx, t);
    else if (b.kind === 'ursula') drawUrsulaBoss(b, sx, t);
    else if (b.kind === 'ceo') drawCeoBoss(b, sx, t);
  }

  /* Liv. 4 — GIULIO CESARE: toga bianca con bordo porpora, alloro, sandali,
     naso aquilino, sguardo annoiato. Usato se Art.cesare non è disponibile. */
  function drawCesareBoss(b, sx, t) {
    const reduced = S.settings && S.settings.reduceShake;
    ctx.save();
    ctx.globalAlpha = .15 + Math.sin(t * 2.1) * .03;
    const glow = ctx.createRadialGradient(sx, 150, 20, sx, 150, 250);
    glow.addColorStop(0, b.phase === 2 ? 'rgba(255,200,75,.34)' : 'rgba(197,152,224,.26)');
    glow.addColorStop(1, 'rgba(255,200,75,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    if (drawArtBoss(b, sx, t, Art.cesare, drawCesareFallback, { w: 240, h: 254 })) return;
  }

  function drawCesareFallback(b, sx, t) {
    const reduceShake = S.settings && S.settings.reduceShake;
    const shake = b.state === 'dying' && !reduceShake ? rand(-4, 4) : 0;
    const x = sx - 5 + shake;
    const bob = Math.sin(t * 1.8) * 2;
    const y = GROUND + bob;
    ctx.save();
    // ombra
    ctx.globalAlpha = .3; ctx.fillStyle = '#0b0812';
    ctx.beginPath(); ctx.ellipse(x, GROUND - 2, 64, 10, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    // toga bianca + bordo porpora
    ctx.fillStyle = '#f2ede0';
    ctx.beginPath();
    ctx.moveTo(x - 58, y - 6); ctx.lineTo(x - 40, y - 168);
    ctx.lineTo(x + 40, y - 168); ctx.lineTo(x + 58, y - 6);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8c1c2b';
    ctx.beginPath();
    ctx.moveTo(x - 58, y - 6); ctx.lineTo(x - 52, y - 42);
    ctx.lineTo(x + 52, y - 42); ctx.lineTo(x + 58, y - 6);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#dcd2bf';
    ctx.fillRect(x - 26, y - 166, 10, 122);
    // fascia/timone sottobraccio
    ctx.fillStyle = '#e8c9a0'; ctx.fillRect(x + 34, y - 120, 26, 12);
    ctx.fillStyle = '#fff8e7'; ctx.fillRect(x + 52, y - 132, 18, 26);
    ctx.fillStyle = '#7280b3'; ctx.fillRect(x + 55, y - 126, 12, 2);
    ctx.fillRect(x + 55, y - 120, 12, 2);
    // testa + naso aquilino
    ctx.fillStyle = '#e8c9a0';
    ctx.beginPath(); ctx.arc(x + 2, y - 190, 30, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 26, y - 194); ctx.lineTo(x + 42, y - 186); ctx.lineTo(x + 26, y - 178); ctx.closePath(); ctx.fill();
    // occhi annoiati
    ctx.strokeStyle = '#2b1d22'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 14, y - 196); ctx.lineTo(x - 2, y - 194); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 10, y - 194); ctx.lineTo(x + 20, y - 196); ctx.stroke();
    // bocca seccata
    ctx.beginPath(); ctx.moveTo(x + 4, y - 172); ctx.lineTo(x + 22, y - 172); ctx.stroke();
    // alloro
    ctx.fillStyle = '#3f7a58';
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (1.05 + i / 9 * .9);
      ctx.save();
      ctx.translate(x + 2 + Math.cos(a) * 28, y - 190 + Math.sin(a) * 26);
      ctx.rotate(a + .9);
      ctx.beginPath(); ctx.ellipse(0, 0, 6, 3, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
    // fase 2: aureola di decreti
    if (b.phase === 2 || b.state === 'rage') {
      ctx.globalAlpha = .5 + Math.sin(t * 6) * .2;
      ctx.strokeStyle = '#ffc84b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x + 2, y - 190, 44, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // fumetti "fogli" fluttuanti
    for (let i = 0; i < 3; i++) {
      const fx = x - 80 + Math.sin(t * 1.6 + i * 2) * 12;
      const fy = 92 + i * 40 + Math.cos(t * 1.2 + i) * 6;
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(Math.sin(t + i) * .3);
      ctx.fillStyle = '#fff8e7'; ctx.fillRect(-10, -13, 20, 26);
      ctx.fillStyle = '#7280b3';
      for (let k = 0; k < 3; k++) ctx.fillRect(-6, -6 + k * 6, 12, 1);
      ctx.restore();
    }
    ctx.restore();
  }



  function drawDirettoreBoss(b, sx, t) {
    const reduceShake = S.settings && S.settings.reduceShake;
    const shake = b.state === 'dying' ? (reduceShake ? 0 : rand(-4, 4)) : 0;
    const DS = DIRECTOR_SCALE;
    /* Frames idle0/idle1/stamp hanno il contenuto allineato in alto; rage/point/hurt
       nell'asset sono disegnati ~75px più in basso (framing diverso): per evitare il
       salto verticale durante i colpi uso i frame allineati + overlay di fase. */
    const dx = sx - 5 - 190 * DS + shake;
    const dy = GROUND - 318 * DS + Math.sin(t * 1.7) * 1.5;
    ctx.save();
    ctx.globalAlpha = .16 + Math.sin(t * 2.2) * .03;
    const glow = ctx.createRadialGradient(sx, 130, 20, sx, 130, 260);
    glow.addColorStop(0, b.phase === 2 ? 'rgba(255,91,157,.34)' : 'rgba(255,200,75,.26)');
    glow.addColorStop(1, 'rgba(255,200,75,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    const d = Art.directorFrames;
    let frame = d && d.idle0;
    if (d) {
      if (b.state === 'windup' && b.attack === 'timbro' && d.stamp) frame = d.stamp;
      else frame = [d.idle0, d.idle1][Math.floor(t * 2.2) % 2] || frame;
    }
    if (frame) {
      ctx.save();
      if (b.state === 'dying') ctx.translate(dx + rand(-3, 3), dy + rand(-3, 3));
      else ctx.translate(dx, dy);
      ctx.scale(DS, DS);
      // v2.3.5 — il Mega Direttore deve guardare il giocatore (a sinistra).
      ctx.translate(frame.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(frame, 0, 0);
      if (b.hitFlash > 0 && b.state !== 'dying') {
        ctx.globalAlpha = .45;
        ctx.drawImage(getWhite(frame), 0, 0);
        ctx.globalAlpha = 1;
      }
      if (b.phase === 2 || b.state === 'dying') {
        ctx.globalAlpha = .14 + Math.sin(t * 7) * .05;
        ctx.drawImage(getTint(frame, '#ff3d6e'), 0, 0);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    } else {
      ctx.fillStyle = '#2b3440'; ctx.fillRect(sx - 70, GROUND - 240, 140, 240);
    }
  }

  /* Liv. 5 — URSULA: tailleur, bandiera UE, occhiali. */
  function drawUrsulaBoss(b, sx, t) {
    ctx.save();
    ctx.globalAlpha = .15 + Math.sin(t * 2.0) * .03;
    const glow = ctx.createRadialGradient(sx, 150, 20, sx, 150, 250);
    glow.addColorStop(0, b.phase === 2 ? 'rgba(143,209,79,.34)' : 'rgba(159,215,255,.28)');
    glow.addColorStop(1, 'rgba(159,215,255,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    drawArtBoss(b, sx, t, Art.ursula, drawUrsulaFallback, { w: 240, h: 258 });
  }

  function drawUrsulaFallback(b, sx, t) {
    const reduceShake = S.settings && S.settings.reduceShake;
    const shake = b.state === 'dying' && !reduceShake ? rand(-4, 4) : 0;
    const x = sx - 5 + shake;
    const bob = Math.sin(t * 1.9) * 2;
    const y = GROUND + bob;
    ctx.save();
    ctx.globalAlpha = .3; ctx.fillStyle = '#0b0812';
    ctx.beginPath(); ctx.ellipse(x, GROUND - 2, 58, 9, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    // tailleur blu scuro
    ctx.fillStyle = '#2b3a5c';
    ctx.fillRect(x - 44, y - 150, 88, 146);
    ctx.fillStyle = '#3d5280';
    ctx.fillRect(x - 44, y - 150, 88, 12);
    ctx.fillStyle = '#e8e4d5';
    ctx.fillRect(x - 14, y - 144, 28, 66);
    // bandiera UE appesa
    ctx.fillStyle = '#2a4a8f'; ctx.fillRect(x + 46, y - 180, 40, 26);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = '#ffd866';
      ctx.fillRect(x + 64 + (i - 2) * 7, y - 167 + Math.abs(i - 2) * -3, 2, 2);
    }
    ctx.fillStyle = '#c3d0d8'; ctx.fillRect(x + 64, y - 154, 2, 100);
    // testa
    ctx.fillStyle = '#f0d2ae';
    ctx.beginPath(); ctx.arc(x + 2, y - 178, 26, 0, TAU); ctx.fill();
    // capelli biondo corto
    ctx.fillStyle = '#e3c169';
    ctx.beginPath(); ctx.arc(x + 2, y - 186, 28, Math.PI, 0); ctx.fill();
    ctx.fillRect(x - 26, y - 188, 8, 22);
    ctx.fillRect(x + 20, y - 188, 8, 22);
    // occhiali
    ctx.strokeStyle = '#1a1222'; ctx.lineWidth = 2;
    ctx.strokeRect(x - 18, y - 184, 16, 11);
    ctx.strokeRect(x + 4, y - 184, 16, 11);
    ctx.beginPath(); ctx.moveTo(x - 2, y - 179); ctx.lineTo(x + 4, y - 179); ctx.stroke();
    // bocca
    ctx.fillStyle = '#b91832'; ctx.fillRect(x - 4, y - 162, 14, 4);
    // fase 2: aureola green deal
    if (b.phase === 2 || b.state === 'rage') {
      ctx.globalAlpha = .5 + Math.sin(t * 6) * .2;
      ctx.strokeStyle = '#8fd14f'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x + 2, y - 178, 42, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  /* Liv. 8 — EX CEO SOGEI: giacca scura, manette ai polsi, valigetta, ghigno. */
  function drawCeoBoss(b, sx, t) {
    ctx.save();
    ctx.globalAlpha = .16 + Math.sin(t * 2.4) * .04;
    const glow = ctx.createRadialGradient(sx, 150, 20, sx, 150, 260);
    glow.addColorStop(0, b.phase === 2 ? 'rgba(183,227,106,.36)' : 'rgba(143,209,79,.26)');
    glow.addColorStop(1, 'rgba(183,227,106,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    drawArtBoss(b, sx, t, Art.ceo, drawCeoFallback, { w: 240, h: 264 });
  }

  function drawCeoFallback(b, sx, t) {
    const reduceShake = S.settings && S.settings.reduceShake;
    const shake = b.state === 'dying' && !reduceShake ? rand(-4, 4) : 0;
    const x = sx - 5 + shake;
    const bob = Math.sin(t * 1.7) * 2;
    const y = GROUND + bob;
    ctx.save();
    ctx.globalAlpha = .3; ctx.fillStyle = '#0b0812';
    ctx.beginPath(); ctx.ellipse(x, GROUND - 2, 60, 9, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    // giacca scura
    ctx.fillStyle = '#1c2029';
    ctx.fillRect(x - 48, y - 158, 96, 154);
    ctx.fillStyle = '#2b3440';
    ctx.fillRect(x - 48, y - 158, 96, 10);
    ctx.fillStyle = '#f2ede0';
    ctx.beginPath();
    ctx.moveTo(x - 16, y - 156); ctx.lineTo(x + 16, y - 156);
    ctx.lineTo(x + 10, y - 96); ctx.lineTo(x - 10, y - 96);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b91832'; ctx.fillRect(x - 5, y - 150, 10, 52);
    // valigetta
    ctx.fillStyle = '#4a3a22'; ctx.fillRect(x + 48, y - 88, 40, 30);
    ctx.fillStyle = '#c8a24a'; ctx.fillRect(x + 54, y - 80, 8, 4);
    ctx.strokeStyle = '#2b1d12'; ctx.lineWidth = 2; ctx.strokeRect(x + 48, y - 88, 40, 30);
    // testa + capelli impomatati
    ctx.fillStyle = '#e8c9a0';
    ctx.beginPath(); ctx.arc(x + 2, y - 186, 28, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2b1d22';
    ctx.beginPath(); ctx.arc(x + 2, y - 194, 29, Math.PI, 0); ctx.fill();
    ctx.fillRect(x - 26, y - 196, 8, 14);
    // ghigno
    ctx.strokeStyle = '#1a1222'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 8, y - 178); ctx.quadraticCurveTo(x + 4, y - 168, x + 18, y - 180); ctx.stroke();
    // occhi
    ctx.fillStyle = '#1a1222';
    ctx.fillRect(x - 12, y - 192, 5, 4);
    ctx.fillRect(x + 8, y - 192, 5, 4);
    // manette ai polsi
    const cuff = (cx, cy) => {
      ctx.strokeStyle = '#c8a24a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(cx, cy, 9, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#8a6a2a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, 9, 0, TAU); ctx.stroke();
    };
    cuff(x - 40, y - 96);
    cuff(x + 40, y - 96);
    ctx.strokeStyle = '#8a6a2a'; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.ellipse(x - 8 + i * 5, y - 66 + i * 1.5, 3, 2, 0, 0, TAU); ctx.stroke();
    }
    // fase 2 ARRESTO: catene animate
    if (b.phase === 2 || b.state === 'rage') {
      ctx.globalAlpha = .6 + Math.sin(t * 5) * .2;
      ctx.strokeStyle = '#b7e36a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x + 2, y - 186, 44, 0, TAU); ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const cx = x - 46 + i * 18;
        ctx.strokeRect(cx, y - 176 + Math.sin(t * 4 + i) * 3, 10, 6);
      }
      ctx.globalAlpha = 1;
    }
    // banconote che volano
    for (let i = 0; i < 3; i++) {
      const fx = x - 80 + Math.sin(t * 1.4 + i * 2) * 14;
      const fy = 86 + i * 38 + Math.cos(t * 1.1 + i) * 6;
      ctx.save();
      ctx.translate(fx, fy); ctx.rotate(Math.sin(t + i) * .4);
      ctx.fillStyle = '#3f8f5c'; ctx.fillRect(-10, -6, 20, 12);
      ctx.fillStyle = '#b7e36a'; ctx.fillRect(-7, -3, 14, 1);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawOctoBoss(b, sx, t) {
    const emerge = clamp(b.emerge, 0, 1);
    const OS = OCTO_SCALE;
    const offset = (1 - emerge) * 150;
    const bob = Math.sin(t * 2.2) * 4 + b.bob * .3;
    const dx = sx - Art.OCTO.ax * OS;
    const dy = GROUND - Art.OCTO.ay * OS + bob + offset;
    // schiuma e cerchi nell'acqua
    ctx.save();
    ctx.globalAlpha = .5;
    ctx.strokeStyle = '#b8dce7';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const rr = 28 + i * 19 + Math.sin(t * 3 + i) * 3;
      ctx.beginPath();
      ctx.ellipse(sx - 10, GROUND - 4, rr, 6 + i, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = .18;
    ctx.fillStyle = '#9c62c8';
    ctx.beginPath(); ctx.ellipse(sx - 20, GROUND - 35, 110, 110, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    let frame;
    if (Art.generatedSpritesReady) {
      const fr = Art.octoFrames;
      if (b.hitFlash > 0 || b.state === 'dying') frame = fr[3];
      else if (b.state === 'windup') frame = (b.attack === 'ink' || b.attack === 'bubbles') ? fr[2] : fr[1];
      else frame = fr[Math.floor(t * 2) % 2];
    } else {
      frame = Art.octoFrames[Math.floor(t * 3) % 4];
    }
    if (!frame) frame = Art.octoFrames[0];
    if (b.state === 'dying') {
      ctx.save();
      ctx.translate(dx + rand(-3, 3), dy + rand(-3, 3));
      if (Math.random() < .4) ctx.globalAlpha = .75;
      ctx.scale(OS, OS);
      ctx.drawImage(frame, 0, 0);
      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }
    ctx.save();
    ctx.translate(Math.round(dx), Math.round(dy));
    ctx.scale(OS, OS);
    ctx.drawImage(frame, 0, 0);
    if (b.hitFlash > 0) {
      ctx.globalAlpha = .34;
      ctx.drawImage(getWhite(frame), 0, 0);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    // bagliore occhio durante la carica
    if (b.state === 'windup') {
      const glow = 8 + Math.sin(t * 18) * 4;
      const eyeX = sx - 28 * OS;
      const eyeY = dy + 84 * OS;
      ctx.globalAlpha = .4;
      ctx.fillStyle = '#ffc84b';
      ctx.beginPath(); ctx.arc(eyeX, eyeY, 28 + glow, 0, TAU); ctx.fill();
      ctx.globalAlpha = .9;
      ctx.fillStyle = '#fff3a6';
      ctx.beginPath(); ctx.arc(eyeX, eyeY, 8, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawMechaBoss(b, sx, t) {
    const reduceShake = S.settings && S.settings.reduceShake;
    const damageShake = !reduceShake ? (b.state === 'dying' ? rand(-4, 4) : (b.hitFlash > 0 ? rand(-1.5, 1.5) : 0)) : 0;
    const drawX = sx - Art.MECHA.ax + damageShake;
    const drawY = GROUND - Art.MECHA.ay + damageShake * .4;
    const phase2 = b.phase === 2 || b.state === 'rage';
    // alone e luce divina
    const hx = sx - 90;
    const hy = -25 + Math.sin(t * 1.7) * 2;
    ctx.save();
    ctx.globalAlpha = .16 + Math.sin(t * 2) * .035;
    const glow = ctx.createRadialGradient(sx, 120, 12, sx, 120, 210);
    glow.addColorStop(0, phase2 ? 'rgba(255,91,157,.34)' : 'rgba(255,200,75,.35)');
    glow.addColorStop(1, 'rgba(255,200,75,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // aureola rotante
    const halos = phase2 ? Art.haloPhase2 : Art.haloFrames;
    const halo = halos[Math.floor(t * 8) % 12];
    if (halo) {
      ctx.save();
      ctx.globalAlpha = .88 + Math.sin(t * 4) * .08;
      ctx.drawImage(halo, hx, hy);
      ctx.restore();
    }
    let frame;
    if (b.state === 'rage' || phase2) frame = Art.mechaFrames.phase2;
    else if (b.state === 'windup' && b.attack === 'laser') frame = Art.mechaFrames.staff;
    else if (b.state === 'windup' && b.attack === 'orbs') frame = Art.mechaFrames.orb;
    else frame = Art.mechaFrames.idle[Math.floor(t * 2.2) % 2];
    if (!frame) return;
    ctx.save();
    if (b.state === 'dying') {
      ctx.globalAlpha = .92;
      ctx.translate(rand(-4, 4), Math.random() < .3 ? rand(-3, 0) : 0);
    }
    // v2.3.5 — Mecha San Nicola rivolto verso il giocatore (a sinistra).
    const bx = Math.round(drawX), by = Math.round(drawY);
    ctx.drawImage(frame, bx + frame.width, by, -frame.width, frame.height);
    if (b.hitFlash > 0) {
      ctx.globalAlpha = .3;
      ctx.drawImage(getWhite(frame), bx + frame.width, by, -frame.width, frame.height);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    // scintille e gemme
    if (phase2) {
      for (let i = 0; i < 5; i++) {
        const a = t * 1.6 + i * 1.8;
        const px = sx - 70 + Math.cos(a) * (74 + i * 9);
        const py = 120 + Math.sin(a * 1.3) * 90;
        drawStar(px, py, 2 + (i % 2), i % 2 ? '#ff90b8' : '#ffc84b', 4);
      }
    }
    // carica del pastorale
    if (b.state === 'windup') {
      const tx = sx + 118, ty = 102;
      const pulse = .45 + Math.sin(t * 20) * .3;
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.fillStyle = phase2 ? '#ff5b9d' : '#ffc84b';
      ctx.beginPath(); ctx.arc(tx, ty, 18 + Math.sin(t * 14) * 5, 0, TAU); ctx.fill();
      ctx.globalAlpha = pulse * .4;
      ctx.beginPath(); ctx.arc(tx, ty, 36, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
      drawText('!', tx, ty - 30, 9, '#fff8e7', 'center');
      ctx.restore();
    }
  }

  function drawHazardsActive() {
    const t = S.time;
    for (const h of S.hazards) {
      if (h.telegraph > 0) continue;
      const sx = Math.round(h.x - S.camera.x);
      if (h.kind === 'column') {
        const col = h.color || '#ffc84b';
        ctx.save();
        ctx.globalAlpha = .8;
        ctx.fillStyle = 'rgba(255,200,75,.2)';
        ctx.fillRect(sx - h.width / 2, 0, h.width, GROUND);
        ctx.fillStyle = col;
        ctx.fillRect(sx - h.width * .18, 0, h.width * .36, GROUND);
        ctx.fillStyle = '#fff8e7';
        ctx.fillRect(sx - h.width * .07, 0, h.width * .14, GROUND);
        ctx.globalAlpha = .5;
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = i % 2 ? col : '#ff90b8';
          ctx.fillRect(sx + rand(-h.width / 2, h.width / 2), rand(20, GROUND), 2, 4);
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(255,200,75,.3)';
        ctx.beginPath(); ctx.ellipse(sx, GROUND - 2, h.width, 9, 0, 0, TAU); ctx.fill();
        ctx.restore();
      } else if (h.kind === 'slam') {
        ctx.save();
        // tentacolo che cala dall'alto
        const progress = 1 - h.active / .4;
        const endY = GROUND - 10;
        ctx.strokeStyle = '#0b0812';
        ctx.lineWidth = 22;
        ctx.beginPath();
        ctx.moveTo(sx + 70, -20);
        ctx.bezierCurveTo(sx + 44, 70, sx + 10, 130, sx, endY);
        ctx.stroke();
        ctx.strokeStyle = '#6e3e8f';
        ctx.lineWidth = 16;
        ctx.stroke();
        ctx.strokeStyle = '#9c62c8';
        ctx.lineWidth = 8;
        ctx.stroke();
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = '#e8d6ff';
          ctx.beginPath(); ctx.arc(sx + 7 - i * 4, 55 + i * 48, 3, 0, TAU); ctx.fill();
        }
        ctx.fillStyle = 'rgba(197,152,224,.28)';
        ctx.beginPath(); ctx.ellipse(sx, GROUND - 2, 52, 12, 0, 0, TAU); ctx.fill();
        ctx.globalAlpha = .7;
        ctx.strokeStyle = '#ff90b8';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(sx, GROUND - 2, 44 + progress * 20, 8, 0, 0, TAU); ctx.stroke();
        ctx.restore();
      } else if (h.kind === 'stamp') {
        // v2.0 — timbro gigante che sbatte a terra (norme di Cesare)
        const col = h.color || '#ffc84b';
        const progress = clamp(1 - h.active / .3, 0, 1);
        ctx.save();
        ctx.globalAlpha = .85;
        const sy = GROUND - 90 + progress * 62;
        ctx.fillStyle = '#2b1d22';
        ctx.fillRect(sx - h.width * .38, sy, h.width * .76, 46);
        ctx.fillStyle = col;
        ctx.fillRect(sx - h.width * .3, sy + 4, h.width * .6, 8);
        ctx.fillStyle = '#8c1c2b';
        ctx.fillRect(sx - h.width * .46, sy + 44, h.width * .92, 12);
        ctx.fillStyle = '#1a1014';
        ctx.fillRect(sx - 8, sy - 30, 16, 32);
        ctx.globalAlpha = .4;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.ellipse(sx, GROUND - 2, h.width * .7, 12, 0, 0, TAU); ctx.fill();
        drawText(h.label || 'NORMA!', sx, sy - 22, 6, col, 'center');
        ctx.restore();
      } else if (h.kind === 'circolare') {
        // v2.0 — colata di circolari dal cielo
        ctx.save();
        ctx.globalAlpha = .9;
        for (let i = 0; i < 5; i++) {
          const fy = (h.timer * 420 + i * 58) % GROUND;
          ctx.fillStyle = '#fff8e7';
          ctx.save();
          ctx.translate(sx + rand(-h.width / 3, h.width / 3), fy);
          ctx.rotate(Math.sin(h.timer * 6 + i) * .5);
          ctx.fillRect(-7, -9, 14, 18);
          ctx.fillStyle = '#7280b3';
          for (let k = 0; k < 3; k++) ctx.fillRect(-4, -5 + k * 5, 8, 1);
          ctx.restore();
        }
        ctx.globalAlpha = .4;
        ctx.fillStyle = '#fff8e7';
        ctx.beginPath(); ctx.ellipse(sx, GROUND - 2, h.width * .8, 10, 0, 0, TAU); ctx.fill();
        ctx.restore();
      } else if (h.kind === 'cuff') {
        // v2.0 — le manette si chiudono e salgono (boss CEO SOEGI)
        const col = h.color || '#b7e36a';
        ctx.save();
        ctx.globalAlpha = .9;
        ctx.strokeStyle = col;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(sx - 20, 26); ctx.lineTo(sx - 20, GROUND - 26); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx + 20, 26); ctx.lineTo(sx + 20, GROUND - 26); ctx.stroke();
        ctx.fillStyle = col;
        for (const off of [-20, 20]) {
          ctx.beginPath(); ctx.ellipse(sx + off, GROUND - 18, 12, 8, 0, 0, TAU); ctx.stroke();
        }
        ctx.fillStyle = '#0b0812';
        ctx.fillRect(sx - 34, GROUND - 12, 28, 4);
        ctx.fillRect(sx + 6, GROUND - 12, 28, 4);
        ctx.globalAlpha = .4;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.ellipse(sx, GROUND - 2, h.width * .8, 10, 0, 0, TAU); ctx.fill();
        ctx.restore();
      } else if (h.kind === 'toxic') {
        // v2.0 — nube tossica persistente del boomer tossico
        const col = h.color || '#8fd14f';
        const alpha = clamp(h.active / 1.2, 0, 1);
        ctx.save();
        ctx.globalAlpha = alpha * (.3 + Math.sin(t * 5) * .06);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.ellipse(sx, GROUND - 26 + Math.sin(t * 3) * 3, h.width * .55, 34, 0, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = alpha * .55;
        for (let i = 0; i < 6; i++) {
          const bx = sx + Math.sin(t * 1.6 + i * 1.7) * h.width * .38;
          const by = GROUND - 12 - ((t * 26 + i * 17) % 44);
          ctx.fillStyle = i % 2 ? '#b7e36a' : '#5f9c34';
          ctx.beginPath(); ctx.arc(bx, by, 6 + (i % 3) * 3, 0, TAU); ctx.fill();
        }
        ctx.restore();
      }
    }
    // raggio del Mecha
    const b = S.boss;
    if (b && b.kind === 'mecha' && b.beam && b.beam.time > 0) {
      const y = b.beam.y;
      const x1 = b.beam.x1;
      const flicker = Math.sin(t * 55) * 2;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = .24;
      ctx.fillStyle = '#ff5b9d';
      ctx.fillRect(-20, y - 31, x1 + 20, 62);
      ctx.globalAlpha = .55;
      ctx.fillStyle = '#ffc84b';
      ctx.fillRect(-20, y - 17 + flicker, x1 + 20, 34);
      ctx.globalAlpha = .95;
      ctx.fillStyle = '#fff8e7';
      ctx.fillRect(-20, y - 5, x1 + 20, 10);
      ctx.globalAlpha = .8;
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = i % 2 ? '#ffc84b' : '#ff90b8';
        ctx.fillRect(rand(0, x1), y + rand(-28, 28), rand(3, 12), 2);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.restore();
      // punto di emissione
      drawStar(x1, y, 15 + Math.sin(t * 20) * 3, '#fff8e7', 6);
    }
  }

  /* =========================================================
     HUD ARCADE
     ========================================================= */
  function drawInfinity(x, y, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + 3.5, y, 3.3, 0, TAU);
    ctx.arc(x + 10.2, y, 3.3, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(x + 5, y - 1, 3.5, 1.5);
    ctx.globalAlpha = .5;
    ctx.strokeStyle = '#fff8e7';
    ctx.lineWidth = .6;
    ctx.beginPath();
    ctx.arc(x + 3.5, y - .5, 3, 3.5, 5.7);
    ctx.stroke();
    ctx.restore();
  }

  function drawHUD() {
    const p = S.player;
    if (!p) return;
    drawLowHealth();
    // Su viewport piccoli il canvas viene rimpicciolito: pannelli più opachi e testo +1px.
    const compact = window.innerHeight < 560 || window.innerWidth < 900;
    const panelBase = compact ? 'rgba(4,6,12,.94)' : 'rgba(6,8,16,.84)';
    const panelSub = compact ? 'rgba(4,6,12,.92)' : 'rgba(6,8,16,.82)';
    const fs = (n) => compact ? n + 1 : n;
    // --- pannello salute
    pixelPanel(8, 7, 228, 35, panelBase, 'rgba(255,248,231,.28)', '#ff5b9d');
    const face = p.character === 'rocco' ? Art.icons.roccoFace : Art.icons.adeleFace;
    if (p.character === 'rocco' && Art.characterFrames && Art.characterFrames.rocco) {
      const fimg = Art.characterFrames.rocco.idle[0];
      ctx.fillStyle = '#0b0812'; ctx.fillRect(11, 9, 29, 29);
      if (fimg) ctx.drawImage(fimg, 18, 0, 58, 58, 12, 10, 27, 27);
      ctx.strokeStyle = '#9fd7ff'; ctx.lineWidth = 1; ctx.strokeRect(11.5, 9.5, 28, 28);
    } else if (face) {
      ctx.fillStyle = '#0b0812';
      ctx.fillRect(11, 9, 29, 29);
      ctx.drawImage(face, 12, 10, 27, 27);
      ctx.strokeStyle = '#ffc84b';
      ctx.lineWidth = 1;
      ctx.strokeRect(11.5, 9.5, 28, 28);
    }
    drawText(p.config ? p.config.name : 'ADELE', 45, 11, 7, p.character === 'rocco' ? '#9fd7ff' : '#ffc84b');
    ctx.fillStyle = 'rgba(81,199,169,.72)';
    ctx.fillRect(45, 20, 43, 2);
    ctx.fillStyle = 'rgba(255,91,157,.55)';
    ctx.fillRect(90, 20, 12, 2);
    const hbX = 45, hbY = 27, hbW = 132, hbH = 8;
    ctx.fillStyle = '#0b0812'; ctx.fillRect(hbX - 1, hbY - 1, hbW + 2, hbH + 2);
    ctx.fillStyle = '#38192b'; ctx.fillRect(hbX, hbY, hbW, hbH);
    const pct = clamp(p.health / p.maxHealth, 0, 1);
    const col = pct > .55 ? '#51c7a9' : pct > .28 ? '#ffc84b' : '#ef367f';
    const segs = 20;
    for (let i = 0; i < segs; i++) {
      if (i / segs >= pct + .002) break;
      const sw = hbW / segs;
      ctx.fillStyle = col;
      ctx.fillRect(hbX + i * sw, hbY, sw - 1, hbH);
      ctx.fillStyle = 'rgba(255,255,255,.24)';
      ctx.fillRect(hbX + i * sw, hbY, sw - 1, 2);
    }
    if (p.health < 30 && Math.floor(S.time * 6) % 2 === 0) {
      ctx.fillStyle = 'rgba(239,54,127,.42)';
      ctx.fillRect(hbX, hbY, hbW, hbH);
    }
    drawText('VITE', 185, 11, fs(7), 'rgba(255,248,231,.52)');
    const maxLives = Math.max(diff().lives, S.lives, 4);
    for (let i = 0; i < maxLives; i++) {
      drawHeart(188 + i * 10, compact ? 24 : 23, 3.5, i < S.lives ? '#ff5b9d' : '#43213a');
    }

    // --- munizioni
    const isHeavy = p.weapon === 'mascara' && p.mascaraAmmo > 0;
    const special = p.weapon === 'timbro' || p.weapon === 'scontrino' || p.weapon === 'spritz';
    const rocco = p.character === 'rocco';
    const weaponColor = rocco ? '#9fd7ff' : isHeavy ? '#c598e0' : special ? '#ffc84b' : '#ff90b8';
    pixelPanel(8, 46, 156, 27, panelSub, 'rgba(255,248,231,.22)', weaponColor);
    const weaponIcon = rocco ? Art.pickups.bolt : isHeavy ? Art.pickups.mascara : special ? Art.pickups[p.weapon] : Art.pickups.lipstick;
    if (weaponIcon) ctx.drawImage(weaponIcon, 10, 49, 22, 22);
    const weaponName = p.weapon === 'timbro' ? 'TIMBRO' : p.weapon === 'scontrino' ? 'SCONTRINI' : p.weapon === 'spritz' ? 'SPRITZ' : '';
    drawText(rocco ? 'VITI' : special ? 'UFFICIO' : 'TRUCCHI', 35, 49, 7, 'rgba(255,248,231,.55)');
    drawText(rocco ? 'BULLONIERA' : isHeavy ? 'MASCARA' : special ? weaponName : 'ROSSETTO', 143, 50, rocco ? 5 : special ? 6 : 6, weaponColor, 'right');
    if (isHeavy && !rocco) {
      drawText(String(p.mascaraAmmo), 35, 58, 9, '#e8d6ff');
      const ratio = clamp(p.mascaraTime / 28, 0, 1);
      ctx.fillStyle = 'rgba(255,248,231,.12)'; ctx.fillRect(92, 60, 51, 3);
      ctx.fillStyle = '#c598e0'; ctx.fillRect(92, 60, 51 * ratio, 3);
    } else if (special && !rocco) {
      drawText(String(p.weaponAmmo), 35, 58, 9, '#ffc84b');
      const ratio = clamp(p.weaponTime / 45, 0, 1);
      ctx.fillStyle = 'rgba(255,248,231,.12)'; ctx.fillRect(92, 60, 51, 3);
      ctx.fillStyle = '#ffc84b'; ctx.fillRect(92, 60, 51 * ratio, 3);
    } else {
      drawInfinity(35, 62, rocco ? '#9fd7ff' : '#ff90b8');
    }
    pixelPanel(168, 46, 76, 27, panelSub, 'rgba(255,248,231,.22)', rocco ? '#9fd7ff' : '#ffc84b');
    const grenadeIcon = rocco ? Art.pickups.remote : Art.pickups.powder;
    if (grenadeIcon) ctx.drawImage(grenadeIcon, 170, 50, 19, 19);
    drawText(rocco ? 'TELECOM.' : 'CIPRIA', 191, 49, rocco ? 5 : 7, 'rgba(255,248,231,.55)');
    drawText('×' + String(p.grenades).padStart(2, '0'), 191, 58, 9, '#ffc84b');
    if (rocco) {
      // Rancore in un pannello dedicato: prima finiva dentro la riga di VITI/BULLONIERA.
      pixelPanel(8, 80, 128, 18, panelSub, 'rgba(255,248,231,.22)', '#9fd7ff');
      drawText('RANCORE', 14, 86, 5, 'rgba(255,248,231,.78)');
      for (let i = 0; i < 3; i++) {
        drawStar(80 + i * 13, 89, 4, i < (p.anger || 0) ? '#9fd7ff' : 'rgba(255,248,231,.28)', 4);
      }
    }

    // --- punteggio
    pixelPanel(478, 7, 154, 35, panelBase, 'rgba(255,248,231,.24)', '#51c7a9');
    drawText('PUNTI', 486, 11, 7, 'rgba(255,248,231,.55)');
    drawText(formatScore(S.score), 624, 9, 8, '#fff8e7', 'right');
    drawText('RECORD', 486, 24, 7, 'rgba(255,248,231,.42)');
    drawText(formatScore(Math.max(S.highScore, S.score)), 624, 22, 6, '#ffc84b', 'right');

    // --- serie / combo
    if (S.combo > 1) {
      pixelPanel(528, 46, 104, 25, 'rgba(15,6,18,.86)', 'rgba(255,144,184,.44)', '#ff5b9d');
      drawText('SERIE', 535, 50, 7, 'rgba(255,248,231,.55)');
      drawText('x' + comboMultiplier(), 552, 58, 10, '#ff90b8');
      const ratio = clamp(S.comboTimer / 2.5, 0, 1);
      ctx.fillStyle = 'rgba(255,248,231,.12)'; ctx.fillRect(580, 52, 44, 3);
      ctx.fillStyle = '#ffc84b'; ctx.fillRect(580, 52, 44 * ratio, 3);
    }

    // --- v2.0 BONUS: giorni alla fine + scontrini
    if (S.level && S.level.bonus) drawBonusHUD();

    // --- AVANTI / BOSS
    if (S.bossActive && S.boss) {
      drawBossBar();
    } else if (S.levelIntro < 2.55) {
      const blink = .55 + Math.abs(Math.sin(S.time * 4.2)) * .45;
      ctx.save();
      ctx.globalAlpha = blink;
      ctx.fillStyle = 'rgba(7,9,17,.76)';
      ctx.fillRect(248, 7, 144, 27);
      ctx.fillStyle = '#ffc84b';
      ctx.fillRect(248, 7, 3, 27);
      ctx.fillRect(389, 7, 3, 27);
      drawText('AVANTI!', 320, 14, 8, '#ffc84b', 'center');
      ctx.fillStyle = '#ff90b8';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(260 + i * 5, 17 - i * 2, 2, 4 + i * 3);
      }
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(371 - i * 5, 17 - i * 2, 2, 4 + i * 3);
      }
      ctx.restore();
    }

    // --- difficoltà (visibile in gioco; il boss bar ha la precedenza)
    if (!S.bossActive) {
      ctx.fillStyle = compact ? 'rgba(4,6,12,.9)' : 'rgba(7,9,17,.62)';
      ctx.fillRect(252, 36, 136, 13);
      drawText('DIFF. ' + difficultyLabel(), 320, 38, fs(6), S.difficulty === 'hard' ? '#ff845d' : S.difficulty === 'easy' ? '#51c7a9' : '#ffc84b', 'center');
    }

    // --- suggerimento comandi
    if (S.levelTime < 8 && !S.bossActive && !document.body.classList.contains('touch-mode')) {
      ctx.globalAlpha = clamp(Math.min(S.levelTime, 8 - S.levelTime), 0, 1) * .84;
      ctx.fillStyle = 'rgba(5,6,12,.7)';
      ctx.fillRect(137, H - 24, 366, 17);
      drawText(p.character === 'rocco'
        ? 'Z BULLONIERA  ·  X SALTA  ·  C TELECOMANDO  ·  P PAUSA'
        : 'Z SPARA  ·  X SALTA  ·  C CIPRIA  ·  H ARMA  ·  P PAUSA',
        320, H - 21, 6, 'rgba(255,248,231,.82)', 'center');
      ctx.globalAlpha = 1;
    }
  }

  /* v2.0 — HUD dei livelli bonus: GIORNI ALLA FINE + progresso scontrini. */
  function drawBonusHUD() {
    const b = S.bonus;
    if (!b || !S.player) return;
    const compact = window.innerHeight < 560 || window.innerWidth < 900;
    const fs = (n) => compact ? n + 1 : n;
    const x = 248, y = 52, w = 144, h = 34;
    const goal = b.receiptGoal || 0;
    pixelPanel(x, y, w, h, compact ? 'rgba(4,6,12,.94)' : 'rgba(6,8,16,.86)', 'rgba(255,248,231,.26)', '#51c7a9');
    drawText('GIORNI ALLA FINE: ' + b.daysLeft, x + w / 2, y + 5, fs(6), b.daysLeft <= 1 ? '#ff845d' : '#ffc84b', 'center');
    const ratio = goal > 0 ? clamp((b.receipts || 0) / goal, 0, 1) : 0;
    ctx.fillStyle = 'rgba(255,248,231,.12)';
    ctx.fillRect(x + 8, y + 16, w - 16, 5);
    ctx.fillStyle = ratio >= 1 ? '#51c7a9' : '#ff90b8';
    ctx.fillRect(x + 8, y + 16, (w - 16) * ratio, 5);
    drawText('SCONTRINI ' + (b.receipts || 0) + '/' + goal, x + w / 2, y + 23, fs(5), 'rgba(255,248,231,.72)', 'center');
    // icone/effetti attivi
    if (S.brillo > 0) {
      drawText('BRILLO ' + Math.ceil(S.brillo) + 's', x + w / 2, y + h + 3, 5, '#ff90b8', 'center');
    } else if (S.caffeBoost > 0) {
      drawText('CAFFÈ ' + Math.ceil(S.caffeBoost) + 's', x + w / 2, y + h + 3, 5, '#ffc84b', 'center');
    }
    if (S.car && S.car.active) {
      // v2.0 — pannello dedicato a destra (niente testo sovrapposto al centro)
      const px = 398, py = 52, pw = 104, ph = 34;
      pixelPanel(px, py, pw, ph, compact ? 'rgba(4,6,12,.94)' : 'rgba(6,8,16,.86)', 'rgba(255,248,231,.26)', '#ffc84b');
      drawText('FIAT TIPO', px + pw / 2, py + 6, 6, '#ffc84b', 'center');
      drawText('3 VOLUMI · LUNGOMARE', px + pw / 2, py + 17, 4, 'rgba(255,248,231,.75)', 'center');
      drawText('SPARA DAL FINESTRINO', px + pw / 2, py + 24, 4, 'rgba(255,144,184,.85)', 'center');
    }
  }

  function drawBossBar() {
    const b = S.boss;
    const x = 242, y = 5, w = 234, h = 42;
    pixelPanel(x, y, w, h, window.innerHeight < 560 ? 'rgba(6,3,10,.96)' : 'rgba(10,5,14,.9)', 'rgba(255,200,75,.46)', '#ff5b9d');
    // v2.0 — nomi lunghi (es. URSULA VON DER LEYEN): font ridotto, FASE a sinistra
    const name = b.name || '';
    const nameSize = name.length > 18 ? 6 : name.length > 15 ? 7 : (b.kind === 'direttore' ? 6 : 8);
    const phase2 = b.phase === 2;
    ctx.globalAlpha = .72 + Math.sin(S.time * 5) * .2;
    drawText(phase2 ? 'FASE 2' : 'FASE 1', x + 7, y + 7, 5, phase2 ? '#ff90b8' : '#51c7a9');
    ctx.globalAlpha = 1;
    drawText(name, x + w / 2, y + 6, nameSize, '#ffc84b', 'center');
    const sub = b.sub || '';
    drawText(sub, x + w / 2, y + 18, sub.length > 34 ? 5 : 6, 'rgba(255,248,231,.52)', 'center');
    const bx = x + 7, by = y + 30, bw = w - 14, bh = 6;
    ctx.fillStyle = '#0b0812'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = '#361424'; ctx.fillRect(bx, by, bw, bh);
    const pct = clamp(b.hp / b.maxHp, 0, 1);
    const color = pct > .5 ? (phase2 ? '#ff5b9d' : '#ffc84b') : pct > .25 ? '#ff845d' : '#ef367f';
    const segs = 26;
    for (let i = 0; i < segs; i++) {
      if (i / segs >= pct + .002) break;
      ctx.fillStyle = color;
      ctx.fillRect(bx + i * (bw / segs), by, (bw / segs) - 1, bh);
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.fillRect(bx + i * (bw / segs), by, (bw / segs) - 1, 2);
    }
  }

  function drawLowHealth() {
    const p = S.player;
    if (!p || p.health > 30 || p.dead) return;
    const intensity = (.1 + Math.sin(S.time * 7) * .05) * (1 - p.health / 100);
    const grad = ctx.createRadialGradient(W / 2, H / 2, H * .2, W / 2, H / 2, H * .72);
    grad.addColorStop(0, 'rgba(239,54,127,0)');
    grad.addColorStop(1, 'rgba(239,54,127,' + intensity + ')');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  function drawEnemyQuip() {
    const q = S.quip;
    if (!q) return;
    const x = Math.round(q.x - S.camera.x);
    const y = Math.round(q.y);
    if (x < -80 || x > W + 80) return;
    const fade = clamp(q.life / .32, 0, 1) * clamp((q.maxLife - q.life) / .14, 0, 1);
    if (fade <= 0) return;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.font = '13px "VT323", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const tw = Math.min(250, ctx.measureText(q.text).width);
    const bw = tw + 16;
    const bh = 19;
    const bx = clamp(x - bw / 2, 5, W - bw - 5);
    const by = y - bh - 9;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 3);
    else ctx.rect(bx, by, bw, bh);
    ctx.fillStyle = 'rgba(5,6,12,.9)'; ctx.fill();
    ctx.strokeStyle = q.color; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 5, by + bh);
    ctx.lineTo(x + 2, by + bh + 7);
    ctx.lineTo(x + 6, by + bh);
    ctx.closePath();
    ctx.fillStyle = 'rgba(5,6,12,.9)'; ctx.fill();
    ctx.strokeStyle = q.color; ctx.stroke();
    ctx.fillStyle = '#fff8e7';
    ctx.fillText(q.text, bx + bw / 2, by + bh / 2 + .5, bw - 10);
    ctx.restore();
  }

  function drawCallout() {
    const c = S.callout;
    if (!c) return;
    const age = c.maxLife - c.life;
    const slide = age < .18 ? 1 - age / .18 : 1;
    const fade = c.life < .3 ? c.life / .3 : 1;
    ctx.save();
    ctx.globalAlpha = clamp(fade, 0, 1);
    ctx.font = '8px ' + PS_FONT;
    const titleW = ctx.measureText(c.title).width;
    ctx.font = '6px ' + PS_FONT;
    const subW = c.sub ? ctx.measureText(c.sub).width : 0;
    const tw = Math.min(W - 20, Math.max(titleW + 36, subW + 34, 220));
    const bx = W / 2 - tw / 2;
    const by = 81 - (1 - slide) * 14;
    ctx.fillStyle = 'rgba(5,6,12,.82)';
    ctx.fillRect(bx, by, tw, 30);
    ctx.fillStyle = c.color;
    ctx.fillRect(bx, by, tw, 2);
    ctx.fillRect(bx, by + 28, tw, 2);
    ctx.fillRect(bx, by, 3, 30);
    ctx.fillRect(bx + tw - 3, by, 3, 30);
    drawText(c.title, W / 2, by + 6, 8, c.color, 'center');
    if (c.sub) drawText(c.sub, W / 2, by + 18, 6, 'rgba(255,248,231,.72)', 'center');
    ctx.restore();
  }

  function drawLevelIntro() {
    if (S.levelIntro <= 0 || S.bossActive) return;
    const total = 3.15;
    const elapsed = total - S.levelIntro;
    if (elapsed < .2) return;
    const fadeOut = clamp(S.levelIntro / .45, 0, 1);
    ctx.save();
    ctx.globalAlpha = fadeOut;
    // banda diagonale
    ctx.fillStyle = 'rgba(5,6,12,.86)';
    ctx.fillRect(0, 112, W, 101);
    ctx.fillStyle = '#ff5b9d';
    ctx.fillRect(0, 112, W, 2);
    ctx.fillStyle = '#ffc84b';
    ctx.fillRect(0, 211, W, 2);
    // strisce laterali
    ctx.save();
    ctx.translate(0, 112);
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(255,200,75,.11)' : 'rgba(255,91,157,.11)';
      ctx.beginPath();
      ctx.moveTo(i * 46, 0); ctx.lineTo(i * 46 + 24, 0); ctx.lineTo(i * 46 + 8, 101); ctx.lineTo(i * 46 - 16, 101); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    drawText(S.level.code, W / 2, 122, 7, '#ffc84b', 'center');
    drawText(S.level.title, W / 2, 139, 14, '#fff8e7', 'center');
    drawText(S.level.subtitle, W / 2, 160, 6, 'rgba(255,248,231,.6)', 'center');
    drawText('« ' + S.level.introLine + ' »', W / 2, 177, 6, '#ff90b8', 'center');
    ctx.restore();
  }

  function drawBossIntro() {
    if (S.bossIntro <= 0 || !S.boss) return;
    const total = 2.5;
    const elapsed = total - S.bossIntro;
    let alpha = 1;
    if (elapsed < .18) alpha = elapsed / .18;
    if (S.bossIntro < .28) alpha = S.bossIntro / .28;
    const shake = Math.sin(S.time * 40) * 1.5;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(shake, 0);
    // bande nere
    const topH = 52, midTop = 122, midH = 94;
    ctx.fillStyle = 'rgba(5,5,10,.9)';
    ctx.fillRect(0, 0, W, topH);
    ctx.fillRect(0, H - topH, W, topH);
    ctx.fillStyle = '#b91832';
    ctx.fillRect(0, midTop, W, midH);
    ctx.fillStyle = '#ffc84b';
    ctx.fillRect(0, midTop, W, 3);
    ctx.fillRect(0, midTop + midH - 3, W, 3);
    // strisce hazard
    ctx.save();
    ctx.beginPath(); ctx.rect(0, midTop + 4, W, 7); ctx.clip();
    for (let x = -40; x < W + 40; x += 22) {
      ctx.fillStyle = '#1a0a0e';
      ctx.beginPath(); ctx.moveTo(x, midTop + 4); ctx.lineTo(x + 10, midTop + 4); ctx.lineTo(x + 3, midTop + 11); ctx.lineTo(x - 7, midTop + 11); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    drawText('ATTENZIONE', W / 2, midTop + 18, 8, '#ffc84b', 'center');
    drawText(S.level.bossName, W / 2, midTop + 34, 17, '#fff8e7', 'center');
    drawText(S.level.bossSub, W / 2, midTop + 59, 6, 'rgba(255,248,231,.75)', 'center');
    drawText('« ' + S.level.bossQuote + ' »', W / 2, midTop + 73, 6, '#ffb7c9', 'center');
    ctx.restore();
  }

  function drawConfetti() {
    for (const c of S.confetti) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.size / 2, -c.size / 3, c.size, c.size * .66);
      ctx.restore();
    }
  }

  /* =========================================================
     FRAME DI GIOCO
     ========================================================= */
  function renderGame() {
    ctx.fillStyle = '#080b15';
    ctx.fillRect(0, 0, W, H);
    const wantShake = !(S.settings && S.settings.reduceShake);
    const shake = wantShake && S.shake > .25 ? S.shake : 0;
    const sx = shake ? Math.round(rand(-shake, shake)) : 0;
    const sy = shake ? Math.round(rand(-shake, shake) * .65) : 0;
    ctx.save();
    ctx.translate(sx, sy);
    drawWorldBackground();
    drawProps();
    drawPlatforms();
    drawPickups();
    drawBoss();
    drawEnemies();
    if (S.car && S.car.active) {
      drawCarSectionBack();
      drawPlayer();
      drawCarSectionFront();
    } else {
      drawPlayer();
    }
    drawEBullets();
    drawPlayerBullets();
    drawGrenades();
    drawHazardsActive();
    drawParticles();
    drawForeground();
    if (S.mode === 'victory') drawConfetti();
    // segnale direzione a bordo schermo
    if (!S.bossActive && !S.defeated && S.levelIntro < 2.4) {
      const pulse = .25 + Math.abs(Math.sin(S.time * 3)) * .4;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#ffc84b';
      for (let i = 0; i < 2; i++) {
        const ax = W - 20 + i * 8;
        const ay = GROUND - 78;
        ctx.beginPath();
        ctx.moveTo(ax, ay - 12);
        ctx.lineTo(ax + 10, ay);
        ctx.lineTo(ax, ay + 12);
        ctx.lineTo(ax + 3, ay);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    // v2.0 — effetto "brillo" dello spritz nei livelli bonus
    drawBrilloOverlay();
    // flash arancio boss
    if (S.bossActive && S.boss && (S.boss.state === 'rage' || S.boss.state === 'wrap')) {
      ctx.globalAlpha = .08 + Math.sin(S.time * 7) * .03;
      ctx.fillStyle = '#ff5b9d';
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    drawEnemyQuip();
    drawHUD();
    drawCallout();
    drawLevelIntro();
    drawBossIntro();
    if (S.mode === 'paused') {
      ctx.fillStyle = 'rgba(3,5,11,.42)';
      ctx.fillRect(0, 0, W, H);
    }
    if (S.mode === 'levelclear' || S.mode === 'gameover') {
      ctx.fillStyle = 'rgba(3,5,11,.18)';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function render() {
    const hasGame = S.player && S.level && ['playing', 'paused', 'levelclear', 'gameover', 'victory'].includes(S.mode);
    if (hasGame) renderGame();
    else renderTitle();
  }

  /* =========================================================
     TOGGLE / DEBUG
     ========================================================= */
  // Permette di testare rapidamente le schermate: index.html?stage=select
  // (la modalità normale resta invariata).
  /* v2.0 — helper per le scene debug dei livelli nuovi (stesso contratto di ?stage). */
  function debugStartLevel(index, params) {
    S.lives = diff().lives;
    S.score = 0;
    startLevel(index);
    if (params && params.get('px')) {
      const px = clamp(parseFloat(params.get('px')) || 0, 80, LEVELS[index].width - 100);
      S.player.x = px;
      S.camera.x = clamp(px - W * .38, 0, LEVELS[index].width - W);
    }
  }

  function debugStartBoss(index) {
    S.lives = diff().lives;
    S.score = 0;
    startLevel(index);
    const lvl = LEVELS[index];
    if (!lvl || !lvl.boss) return;
    S.player.x = lvl.bossTrigger - 20;
    S.camera.x = lvl.arena;
    startBoss();
  }

  function handleDebugQuery() {
    const params = new URLSearchParams(location.search);
    const stage = params.get('stage');
    if (params.get('instant') === '1') document.documentElement.classList.add('no-anim');
    const charParam = params.get('char');
    if (CHARACTERS[charParam]) { S.character = charParam; if (Art.useCharacter) Art.useCharacter(charParam); }
    /* v2.0 — nuovi stage: roma/europa/pescara/pescara2/sogei + boss + bonusCar.
       Gli stage v1 restano identici. */
    const LEVEL_STAGES = { roma: 3, europa: 4, pescara: 5, pescara2: 6, sogei: 7 };
    const BOSS_STAGES = {
      bossRoma: 3, bossCesare: 3, bossEuropa: 4, bossUrsula: 4, bossSogei: 7, bossCeo: 7
    };
    if (stage === 'select') goSelect();
    else if (stage === 'level1') startNewRun();
    else if (stage === 'level2') { S.lives = 4; S.score = 0; startLevel(1); }
    else if (stage === 'level3') {
      S.lives = diff().lives; S.score = 0; startLevel(2);
      if (params.get('px')) {
        const px = clamp(parseFloat(params.get('px')) || 0, 80, LEVELS[2].width - 100);
        S.player.x = px; S.camera.x = clamp(px - W * .38, 0, LEVELS[2].width - W);
      }
    }
    else if (stage === 'rooms3') { S.lives = diff().lives; S.score = 0; startLevel(2); S.player.x = 2250; S.camera.x = clamp(2250 - W * .38, 0, LEVELS[2].width - W); }
    else if (stage === 'rocco3') { S.character = 'rocco'; if (Art.useCharacter) Art.useCharacter('rocco'); S.lives = diff().lives; S.score = 0; startLevel(2); S.player.x = 2250; S.camera.x = clamp(2250 - W * .38, 0, LEVELS[2].width - W); }
    else if (stage === 'boss3') { S.lives = diff().lives; S.score = 0; startLevel(2); S.player.x = LEVELS[2].bossTrigger - 20; S.camera.x = LEVELS[2].arena; startBoss(); }
    else if (stage === 'boss1') { S.lives = diff().lives; S.score = 0; startLevel(0); S.player.x = LEVELS[0].bossTrigger - 20; S.camera.x = LEVELS[0].arena; startBoss(); }
    else if (stage === 'boss2') { S.lives = diff().lives; S.score = 0; startLevel(1); S.player.x = LEVELS[1].bossTrigger - 20; S.camera.x = LEVELS[1].arena; startBoss(); }
    else if (LEVEL_STAGES[stage] != null && LEVELS[LEVEL_STAGES[stage]]) debugStartLevel(LEVEL_STAGES[stage], params);
    else if (BOSS_STAGES[stage] != null && LEVELS[BOSS_STAGES[stage]]) debugStartBoss(BOSS_STAGES[stage]);
    else if (stage === 'bonusCar') {
      const carIndex = 6;
      debugStartLevel(carIndex, null);
      const lvl = LEVELS[carIndex];
      if (lvl) {
        const carX = lvl.carSectionX != null ? lvl.carSectionX : Math.floor(lvl.width * .66);
        S.player.x = carX + 40;
        S.camera.x = clamp(carX - W * .38, 0, lvl.width - W);
        // scena di test: salta il banner di livello e avvia subito la sezione auto
        S.levelIntro = 0;
        S.saidStart = true;
      }
    }
    else if (stage === 'victory') { S.lives = diff().lives; S.score = 0; startLevel(1); S.score = 15400; S.bossActive = true; S.boss = makeBoss('mecha'); S.boss.hp = 0; S.boss.state = 'dead'; completeGame(); }
    else if (stage === 'gameover') { S.lives = diff().lives; S.score = 0; startLevel(0); S.score = 3450; S.lives = 0; triggerGameOver(); }
    else if (stage === 'clear') { S.lives = diff().lives; S.score = 6200; startLevel(0); S.score = 6200; S.shots = 88; S.comboBest = 6; finishLevel(); }
    else if (stage === 'pause') { S.lives = diff().lives; S.score = 0; startLevel(0); openPause(); }
    else if (stage === 'touch') { document.body.classList.add('touch-mode'); S.lives = diff().lives; S.score = 0; startLevel(0); document.body.classList.add('playing'); }
    else if (stage === 'how') { goSelect(); showHow(); }
  }

  const DEBUG = {
    spawn(type, offset = 440) {
      if (!S.level || !S.player) return;
      spawnEnemy(type, S.camera.x + Math.min(offset, W - 30));
    },
    spawnAll() {
      if (!S.player) return;
      ['pretender', 'boomer', 'utente', 'finanziere'].forEach((type, i) => {
        spawnEnemy(type, S.camera.x + 310 + i * 95);
      });
    },
    killBoss() {
      if (S.boss) {
        S.boss.hp = 0;
        startBossDeath();
      }
    },
    damageBoss(amount = 100) {
      if (S.boss) hitBoss(amount, S.boss.x, GROUND - 120, true);
    },
    hurt(amount = 25) {
      if (S.player) damagePlayer(amount, S.player.x + 20, 'debug');
    },
    setInvincible(v = 999) {
      if (S.player) S.player.invuln = v;
    },
    killOne(type = 'pretender') {
      const e = S.enemies.find(en => en.alive && en.type === type);
      if (!e) return false;
      e.hp = 0;
      killEnemy(e);
      return true;
    },
    giveMascara() {
      if (S.player) {
        S.player.mascaraAmmo = 180;
        S.player.mascaraTime = 28;
        S.player.weapon = 'mascara';
      }
    },
    giveWeapon(kind = 'timbro') {
      if (!S.player) return;
      const isStamp = kind === 'timbro';
      const isSpritz = kind === 'spritz';
      S.player.weapon = isStamp ? 'timbro' : isSpritz ? 'spritz' : 'scontrino';
      S.player.weaponAmmo = isStamp ? 42 : isSpritz ? 54 : 90;
      S.player.weaponTime = 45;
      S.player.weaponSwitchFlash = .6;
    },
    clear: finishLevel,
    victory: completeGame,
    gameover: triggerGameOver,
    finishBoss: () => { if (S.boss) { S.boss.invuln = false; S.boss.hp = 1; } },
    /* v2.1 — introspezione del percorso sfondo scelto (per QA/full-scene vs layer). */
    bgInfo() {
      if (!S.level) return null;
      const lvl = S.level;
      /* v2.2 — diagnostica unificata: livelli classici (sky+layers) e custom
         (customBg con CUSTOM_BG_ART: roma/europa/pescara/pescaraNight/sogei). */
      const set = lvl.customBg ? CUSTOM_BG_ART[lvl.customBg] : null;
      const skyKey = set ? set.sky : lvl.sky;
      const layerList = set ? set.layers : (lvl.layers || []);
      const skyAi = !!(set ? isAiBg(set.sky) : isAiBg(lvl.sky));
      const layerAi = layerList.map(l => !!isAiBg(l.key));
      const layersLoaded = layerList.filter(l => !!(Art.bg && Art.bg[l.key])).length;
      let mode = 'auto';
      if (lvl.bgFullScene === true) mode = 'full';
      else if (lvl.bgLayers === true) mode = 'layers';
      else if (lvl.bgMode === 'full' || lvl.bgMode === 'layers') mode = lvl.bgMode;
      if (mode === 'auto') mode = skyAi ? 'full' : 'layers';
      return {
        level: lvl.id,
        customBg: lvl.customBg || null,
        sky: skyKey,
        skyAi,
        layerAi,
        layersLoaded,
        mode,
        bossBg: lvl.bossBg,
        bossBgLoaded: hasBg(lvl.bossBg),
        direzioneExt: hasBg('direzioneExt')
      };
    }
  };

  window.DOGANA = {
    state: S,
    input,
    startLevel,
    startBoss,
    goTitle,
    goSelect,
    setDifficulty,
    setSetting,
    setBinding,
    handleBack,
    debug: DEBUG,
    handleDebugQuery,
    version: '2.5.0',
    get level() { return S.level; },
    get difficulty() { return S.difficulty; },
    get settings() { return S.settings; },
    get inputBindings() {
      const map = KEYMAP_ACTIVE || KEYMAP;
      const out = {};
      for (const action of Object.keys(DEFAULT_BINDINGS)) out[action] = [];
      for (const [code, action] of Object.entries(map)) {
        if (out[action] && !out[action].includes(code)) out[action].push(code);
      }
      return out;
    }
  };
  // Bridge con la UI/accessibilità: segnala che l'API motore è pronta.
  try { document.dispatchEvent(new CustomEvent('dogana:ready')); } catch (e) { /* IE */ }

})();

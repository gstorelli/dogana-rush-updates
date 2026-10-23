/* DOGANA RUSH — colonna sonora originale, mixaggio WebAudio, voci Cartesia */
(function () {
  'use strict';

  const TAU = Math.PI * 2;
  const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  function midiHz(n) { return 440 * Math.pow(2, (n - 69) / 12); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  /* Accordi (MIDI). Le progressioni sono originali, con sapori di tarantella,
     banda di paese, campane di San Nicola e italo-disco pugliese. */
  const CH = {
    Am: [57, 60, 64], F: [53, 57, 60], G: [55, 59, 62], E: [52, 56, 59],
    Dm: [50, 53, 57], C: [48, 52, 55], Bb: [46, 50, 53], A: [45, 49, 52],
    Gm: [43, 46, 50], Fhigh: [53, 57, 60], Ah: [57, 61, 64],
    /* v2.0: accordi per Roma/Europa/Pescara/SOGEI (stessa convenzione MIDI). */
    Em: [52, 55, 59], D: [50, 54, 57], Eb: [51, 55, 58], Ab: [44, 48, 51],
    Bm: [47, 50, 54], Fm: [53, 56, 60], Db: [49, 53, 56]
  };

  const TRACKS = {
    menu: {
      bpm: 116, steps: 64, style: 'menu', leadTimbre: 'croon', padStyle: 'strings',
      padOct: 0, padVol: .038, gain: .42, leadVol: .043,
      chords: [CH.Am, CH.F, CH.G, CH.E],
      bassPattern: [0, 0, 12, null, 0, 0, 7, null, 0, 0, 12, null, 0, 7, 12, null],
      leadNotes: [
        [0, 69, 4], [4, 72, 2], [6, 76, 2], [8, 74, 2], [10, 72, 2], [12, 69, 2], [14, 67, 2],
        [16, 65, 4], [20, 69, 2], [22, 72, 2], [24, 71, 2], [26, 69, 2], [28, 65, 2], [30, 64, 2],
        [32, 67, 4], [36, 71, 2], [38, 74, 2], [40, 72, 2], [42, 71, 2], [44, 67, 2], [46, 66, 2],
        [48, 64, 4], [52, 68, 2], [54, 71, 2], [56, 76, 3], [59, 74, 2], [61, 71, 2], [63, 68, 1]
      ],
      arpEvery: 2, arpPattern: [0, 1, 2, 1], arpVol: .009,
      chimeNotes: [[0, 86, 1.2], [16, 84, 1.2], [32, 88, 1.2], [48, 83, 1.2]]
    },
    level1: {
      bpm: 149, steps: 64, style: 'drive', leadTimbre: 'brass', padStyle: 'strings',
      padOct: 0, padVol: .036, gain: .46, leadVol: .052,
      chords: [CH.Am, CH.F, CH.G, CH.E],
      bassPattern: [0, 0, 12, null, 0, 12, 0, 7, 0, 0, 12, null, 0, 12, 7, 0],
      leadNotes: [
        [0, 69, 2], [2, 72, 1], [4, 76, 2], [6, 74, 1], [8, 72, 2], [10, 69, 1], [12, 67, 2], [14, 69, 1],
        [16, 65, 2], [18, 69, 1], [20, 72, 2], [22, 71, 1], [24, 69, 2], [26, 65, 1], [28, 64, 2], [30, 65, 1],
        [32, 67, 2], [34, 71, 1], [36, 74, 2], [38, 72, 1], [40, 71, 2], [42, 67, 1], [44, 66, 2], [46, 67, 1],
        [48, 64, 2], [50, 68, 1], [52, 71, 2], [54, 76, 2], [56, 74, 2], [58, 71, 1], [60, 68, 2], [62, 64, 1]
      ],
      arpEvery: 2, arpPattern: [0, 2, 1, 2], arpVol: .008,
      stabSteps: [7, 15], stabVol: .026
    },
    level2: {
      bpm: 134, steps: 64, style: 'tarantella', leadTimbre: 'accordion', padStyle: 'strings',
      padOct: 12, padVol: .028, gain: .48, leadVol: .05,
      chords: [CH.Dm, CH.C, CH.Bb, CH.A],
      bassPattern: [0, 0, 7, 12, 0, 7, 0, 12, 0, 0, 7, 12, 0, 7, 12, 0],
      leadNotes: [
        [0, 62, 2], [2, 65, 1], [3, 69, 1], [4, 74, 2], [6, 72, 1], [8, 69, 2], [10, 65, 1], [12, 64, 1], [14, 62, 1],
        [16, 60, 2], [18, 64, 1], [19, 67, 1], [20, 72, 2], [22, 70, 1], [24, 67, 2], [26, 64, 1], [28, 62, 1], [30, 60, 1],
        [32, 58, 2], [34, 62, 1], [35, 65, 1], [36, 70, 2], [38, 69, 1], [40, 65, 2], [42, 62, 1], [44, 60, 1], [46, 58, 1],
        [48, 57, 2], [50, 61, 1], [51, 64, 1], [52, 69, 2], [54, 67, 1], [56, 64, 2], [58, 61, 1], [60, 57, 2], [62, 64, 1]
      ],
      arpEvery: 1, arpPattern: [0, 1, 2, 1], arpVol: .0065,
      bellNotes: [[0, 74, 2.6, .035], [32, 70, 2.4, .03]]
    },
    boss1: {
      bpm: 156, steps: 64, style: 'bossSea', leadTimbre: 'brass', padStyle: 'strings',
      padOct: 0, padVol: .038, gain: .50, leadVol: .054,
      chords: [CH.Dm, CH.Bb, CH.Gm, CH.A],
      bassPattern: [0, 0, 0, 12, 0, 0, 12, 0, 0, 0, 0, 12, 0, 7, 12, 0],
      leadNotes: [
        [0, 50, 4], [4, 53, 2], [6, 57, 2], [8, 62, 3], [11, 60, 2], [13, 57, 2], [15, 53, 1],
        [16, 46, 4], [20, 50, 2], [22, 53, 2], [24, 58, 3], [27, 57, 2], [29, 53, 2], [31, 50, 1],
        [32, 43, 4], [36, 46, 2], [38, 50, 2], [40, 55, 3], [43, 53, 2], [45, 50, 2], [47, 46, 1],
        [48, 45, 4], [52, 49, 2], [54, 52, 2], [56, 57, 3], [59, 55, 2], [61, 52, 2], [63, 49, 1]
      ],
      arpEvery: 2, arpPattern: [0, 2, 1, 2], arpVol: .01,
      stabSteps: [2, 6, 10, 14], stabVol: .03,
      bellNotes: [[0, 50, 3.4, .04], [32, 46, 3.2, .035]]
    },
    boss2: {
      bpm: 142, steps: 64, style: 'san', leadTimbre: 'hymn', padStyle: 'organ',
      padOct: 12, padVol: .045, padEvery: 8, gain: .52, leadVol: .047,
      chords: [CH.Dm, CH.Bb, CH.F, CH.A],
      bassPattern: [0, 0, 12, null, 0, 0, 12, null, 0, 0, 12, null, 0, 7, 12, null],
      leadNotes: [
        [0, 62, 4], [4, 69, 3], [8, 65, 2], [10, 64, 2], [12, 62, 2], [14, 57, 1],
        [16, 58, 4], [20, 62, 3], [24, 65, 2], [26, 69, 2], [28, 65, 2], [30, 62, 1],
        [32, 53, 4], [36, 57, 3], [40, 60, 2], [42, 65, 2], [44, 60, 2], [46, 57, 1],
        [48, 57, 4], [52, 61, 3], [56, 64, 3], [59, 69, 2], [61, 64, 2], [63, 61, 1]
      ],
      arpEvery: 0,
      bellNotes: [[0, 50, 4.2, .06], [16, 46, 4.0, .05], [32, 53, 4.2, .06], [48, 57, 4.0, .055]],
      chimeNotes: [[8, 74, 1.5], [24, 77, 1.5], [40, 74, 1.5], [56, 81, 1.6]]
    },
    level3: {
      bpm: 121, steps: 64, style: 'drive', leadTimbre: 'croon', padStyle: 'strings',
      padOct: 0, padVol: .03, gain: .43, leadVol: .044,
      chords: [CH.C, CH.Am, CH.F, CH.G],
      bassPattern: [0, 0, 7, null, 12, 0, 7, null, 0, 0, 7, 12, 0, 7, 12, null],
      leadNotes: [
        [0, 64, 4], [4, 67, 2], [6, 72, 2], [8, 71, 2], [10, 67, 2], [12, 64, 2], [14, 62, 2],
        [16, 60, 4], [20, 64, 2], [22, 67, 2], [24, 69, 2], [26, 67, 2], [28, 64, 2], [30, 60, 2],
        [32, 65, 4], [36, 69, 2], [38, 72, 2], [40, 71, 2], [42, 69, 2], [44, 65, 2], [46, 64, 2],
        [48, 67, 4], [52, 71, 2], [54, 74, 2], [56, 72, 2], [58, 71, 2], [60, 67, 2], [62, 64, 2]
      ],
      arpEvery: 2, arpPattern: [0, 1, 2, 1], arpVol: .007,
      stabSteps: [3, 11], stabVol: .022
    },
    boss3: {
      bpm: 139, steps: 64, style: 'san', leadTimbre: 'hymn', padStyle: 'organ',
      padOct: 12, padVol: .042, padEvery: 8, gain: .5, leadVol: .052,
      chords: [CH.C, CH.G, CH.Am, CH.E],
      bassPattern: [0, 0, 12, null, 0, 0, 12, null, 0, 0, 12, null, 0, 7, 12, null],
      leadNotes: [
        [0, 60, 4], [4, 64, 3], [8, 67, 2], [10, 72, 2], [12, 71, 2], [14, 67, 1],
        [16, 65, 4], [20, 67, 3], [24, 71, 2], [26, 74, 2], [28, 71, 2], [30, 67, 1],
        [32, 60, 4], [36, 64, 3], [40, 69, 2], [42, 72, 2], [44, 71, 2], [46, 64, 1],
        [48, 62, 4], [52, 66, 3], [56, 69, 3], [59, 74, 2], [61, 69, 2], [63, 66, 1]
      ],
      arpEvery: 0,
      bellNotes: [[0, 48, 4.2, .05], [32, 55, 4.0, .045]],
      chimeNotes: [[8, 76, 1.4], [24, 79, 1.4], [40, 76, 1.4], [56, 84, 1.5]]
    },
    /* ==================== v2.0 — ROMA / EUROPA / PESCARA / SOGEI ====================
       Stesso formato sequencer delle tracce v1 (64 step = 4 battute, un accordo per
       battuta, pattern 16esimi). Volumi (gain .43–.51) allineati alle tracce esistenti:
       nessuna traccia nuova è più forte delle v1. */
    roma: {
      bpm: 118, steps: 64, style: 'march', leadTimbre: 'trumpet', padStyle: 'strings',
      padOct: 0, padVol: .03, padEvery: 8, gain: .44, leadVol: .05,
      /* Marcia pomposa e snob in Do maggiore: I–V–IV–V, fanfara di ottoni. */
      chords: [CH.C, CH.G, CH.F, CH.G],
      bassPattern: [0, null, 0, null, 7, null, 0, null, 0, null, 0, null, 7, null, 12, null],
      leadNotes: [
        [0, 67, 2], [2, 67, 1], [4, 72, 3], [8, 76, 2], [10, 72, 1], [12, 67, 2], [14, 64, 1],
        [16, 62, 2], [18, 67, 1], [20, 71, 3], [24, 74, 2], [26, 71, 1], [28, 67, 2], [30, 62, 1],
        [32, 65, 2], [34, 69, 1], [36, 72, 3], [40, 77, 2], [42, 74, 1], [44, 69, 2], [46, 65, 1],
        [48, 67, 2], [50, 71, 1], [52, 74, 3], [56, 79, 2], [58, 74, 1], [60, 71, 2], [62, 67, 1]
      ],
      arpEvery: 2, arpPattern: [0, 1, 2, 1], arpVol: .0065,
      stabSteps: [4, 12, 20, 28, 36, 44, 52, 60], stabVol: .018,
      bellNotes: [[0, 84, 3.4, .03], [16, 79, 3.0, .026], [32, 84, 3.4, .03], [48, 86, 3.0, .028]]
    },
    europa: {
      bpm: 124, steps: 64, style: 'euro', leadTimbre: 'synth', padStyle: 'strings',
      padOct: 0, padVol: .03, padEvery: 8, gain: .45, leadVol: .048,
      /* Eurodisco istituzionale in Do: giro I–V–VI–IV, melodia "inno" originale
         (citazione dell'Inno alla Gioia, di pubblico dominio) su synth distorto. */
      chords: [CH.C, CH.G, CH.Am, CH.F],
      bassPattern: [0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 7, 12],
      leadNotes: [
        [0, 76, 2], [2, 76, 2], [4, 77, 2], [6, 79, 2], [8, 79, 2], [10, 77, 2], [12, 76, 2], [14, 74, 1],
        [16, 72, 2], [18, 72, 2], [20, 74, 2], [22, 76, 2], [24, 76, 4], [28, 74, 3], [31, 74, 1],
        [32, 76, 2], [34, 76, 2], [36, 77, 2], [38, 79, 2], [40, 79, 2], [42, 77, 2], [44, 76, 2], [46, 74, 1],
        [48, 72, 2], [50, 72, 2], [52, 74, 2], [54, 76, 2], [56, 76, 4], [60, 74, 4]
      ],
      arpEvery: 1, arpPattern: [0, 1, 2, 1], arpVol: .0065,
      stabSteps: [4, 12, 20, 28, 36, 44, 52, 60], stabVol: .02,
      chimeNotes: [[0, 84, 1.4], [8, 88, 1.4], [16, 91, 1.4], [24, 88, 1.4],
        [32, 84, 1.4], [40, 91, 1.4], [48, 88, 1.4], [56, 96, 1.6]]
    },
    bossRoma: {
      bpm: 150, steps: 64, style: 'triumph', leadTimbre: 'trumpet', padStyle: 'organ',
      padOct: 0, padVol: .038, gain: .49, leadVol: .054,
      /* Marcia trionfale in Re minore: timpani, ottoni, fanfara di Cesare. */
      chords: [CH.Dm, CH.Bb, CH.F, CH.A],
      bassPattern: [0, 0, 0, 12, 0, 0, 7, 0, 0, 0, 0, 12, 0, 7, 0, 12],
      leadNotes: [
        [0, 74, 2], [2, 74, 1], [4, 77, 3], [8, 81, 2], [10, 79, 1], [12, 77, 2], [14, 74, 1],
        [16, 70, 2], [18, 74, 1], [20, 77, 3], [24, 82, 2], [26, 81, 1], [28, 77, 2], [30, 74, 1],
        [32, 72, 2], [34, 77, 1], [36, 81, 3], [40, 84, 2], [42, 81, 1], [44, 77, 2], [46, 72, 1],
        [48, 73, 2], [50, 76, 1], [52, 81, 3], [56, 85, 2], [58, 81, 1], [60, 76, 2], [62, 73, 1]
      ],
      arpEvery: 2, arpPattern: [0, 2, 1, 2], arpVol: .009,
      stabSteps: [6, 14, 22, 30, 38, 46, 54, 62], stabVol: .024,
      bellNotes: [[0, 50, 4.2, .045], [16, 46, 4.0, .04], [32, 53, 4.2, .045], [48, 57, 4.0, .04]],
      chimeNotes: [[8, 86, 1.4], [24, 84, 1.4], [40, 86, 1.4], [56, 89, 1.5]]
    },
    bossEuropa: {
      bpm: 142, steps: 64, style: 'bossEuro', leadTimbre: 'hymn', padStyle: 'organ',
      padOct: 12, padVol: .042, padEvery: 8, gain: .51, leadVol: .05,
      /* Ursula: inno europeo solenne + burocrazia in quattro quarti. */
      chords: [CH.C, CH.G, CH.Am, CH.F],
      bassPattern: [0, 0, 12, 0, 0, 0, 12, 0, 0, 0, 12, 0, 0, 7, 12, 0],
      leadNotes: [
        [0, 76, 3], [4, 76, 1], [6, 77, 2], [8, 79, 4], [12, 79, 1], [13, 77, 2],
        [16, 76, 3], [20, 74, 1], [21, 72, 4], [25, 72, 1], [26, 74, 2], [28, 76, 4],
        [32, 76, 3], [36, 76, 1], [37, 77, 2], [39, 79, 4], [43, 79, 1], [44, 77, 2],
        [48, 76, 3], [52, 74, 1], [53, 72, 4], [57, 72, 1], [58, 74, 2], [60, 74, 4]
      ],
      arpEvery: 2, arpPattern: [0, 2, 1, 2], arpVol: .009,
      stabSteps: [4, 12, 20, 28, 36, 44, 52, 60], stabVol: .026,
      bellNotes: [[0, 48, 4.4, .05], [16, 55, 4.0, .045], [32, 57, 4.4, .05], [48, 53, 4.0, .045]],
      chimeNotes: [[8, 88, 1.5], [24, 91, 1.5], [40, 88, 1.5], [56, 96, 1.6]]
    },
    pescara: {
      bpm: 126, steps: 64, style: 'psy', leadTimbre: 'acid', padStyle: 'strings',
      padOct: 12, padVol: .032, padEvery: 8, gain: .45, leadVol: .046,
      /* Formazione a Pescara: psichedelia anni '80, arpeggi acidi, giro minore. */
      chords: [CH.Am, CH.F, CH.G, CH.E],
      bassPattern: [0, 0, 12, null, 0, 0, 12, null, 0, 0, 7, 12, 0, 7, 12, null],
      leadNotes: [
        [0, 69, 2], [2, 72, 1], [3, 76, 2], [6, 74, 1], [7, 72, 1], [8, 69, 1], [10, 67, 1], [12, 69, 2], [14, 71, 1],
        [16, 65, 2], [18, 69, 1], [19, 72, 2], [22, 71, 1], [23, 69, 1], [24, 65, 1], [26, 64, 1], [28, 65, 2], [30, 67, 1],
        [32, 67, 2], [34, 71, 1], [35, 74, 2], [38, 72, 1], [39, 71, 1], [40, 67, 1], [42, 66, 1], [44, 67, 2], [46, 69, 1],
        [48, 64, 2], [50, 68, 1], [51, 71, 2], [54, 69, 1], [55, 68, 1], [56, 64, 1], [58, 62, 1], [60, 64, 2], [62, 66, 1]
      ],
      arpEvery: 1, arpPattern: [0, 1, 2, 1, 2, 1], arpVol: .0085,
      stabSteps: [4, 12, 20, 28, 36, 44, 52, 60], stabVol: .018,
      bellNotes: [[0, 76, 3.0, .03], [16, 72, 2.7, .028], [32, 79, 3.0, .03], [48, 74, 2.7, .028]],
      chimeNotes: [[8, 88, 1.4], [24, 91, 1.4], [40, 88, 1.4], [56, 96, 1.5]]
    },
    pescaraNight: {
      /* v2.3.1 — “Nebbia sulla riviera”: tema ORIGINALE in mood post-punk /
         new-wave notturno. Non riproduce né cita la melodia di A Forest: solo
         l'atmosfera scura, il basso pulsante e i tom sono un riferimento di genere. */
      bpm: 122, steps: 64, style: 'nightDrive', leadTimbre: 'synth', padStyle: 'strings',
      padOct: 0, padVol: .03, padEvery: 8, gain: .46, leadVol: .05,
      chords: [CH.Dm, CH.Bb, CH.F, CH.C],
      bassPattern: [0, 0, 12, 0, 0, 7, 0, 12, 0, 0, 12, 0, 0, 7, 12, null],
      leadNotes: [
        [0, 74, 4], [4, 77, 2], [6, 76, 2], [8, 74, 2], [10, 72, 2], [12, 69, 4],
        [16, 70, 4], [20, 74, 2], [22, 72, 2], [24, 70, 2], [26, 67, 2], [28, 65, 4],
        [32, 72, 4], [36, 76, 2], [38, 74, 2], [40, 72, 2], [42, 69, 2], [44, 67, 2], [46, 65, 2],
        [48, 67, 4], [52, 71, 2], [54, 74, 2], [56, 76, 4], [60, 74, 2], [62, 71, 2]
      ],
      arpEvery: 2, arpPattern: [0, 2, 1, 2], arpVol: .008,
      stabSteps: [4, 12, 20, 28, 36, 44, 52, 60], stabVol: .016,
      bellNotes: [[0, 50, 4.2, .038], [32, 46, 4.0, .033]],
      chimeNotes: [[8, 84, 1.4], [16, 86, 1.4], [24, 89, 1.4], [40, 84, 1.4],
        [48, 86, 1.4], [56, 91, 1.4]]
    },
    sogei: {
      bpm: 134, steps: 64, style: 'industrial', leadTimbre: 'glitch', padStyle: 'choir',
      padOct: 0, padVol: .028, padEvery: 8, gain: .45, leadVol: .046,
      /* Incubo SOGEI: server room, arpeggi tesi, errori, glitch, niente respiro. */
      chords: [CH.Dm, CH.Bb, CH.Gm, CH.A],
      bassPattern: [0, 0, null, 0, 12, null, 0, null, 0, null, 0, 12, null, 0, 12, null],
      leadNotes: [
        [0, 62, 1], [1, 65, 1], [2, 69, 2], [5, 65, 1], [6, 62, 1], [8, 61, 1], [10, 62, 1], [12, 65, 1], [14, 70, 1],
        [16, 58, 1], [17, 62, 1], [18, 65, 2], [21, 62, 1], [22, 58, 1], [24, 57, 1], [26, 58, 1], [28, 62, 1], [30, 65, 1],
        [32, 55, 1], [33, 58, 1], [34, 62, 2], [37, 58, 1], [38, 55, 1], [40, 53, 1], [42, 55, 1], [44, 58, 1], [46, 62, 1],
        [48, 57, 1], [49, 61, 1], [50, 64, 2], [53, 61, 1], [54, 57, 1], [56, 55, 1], [58, 57, 1], [60, 61, 1], [62, 64, 1]
      ],
      arpEvery: 1, arpPattern: [0, 2, 1, 2, 0, 1], arpVol: .0075,
      stabSteps: [3, 7, 15, 23, 31, 39, 47, 55, 63], stabVol: .02,
      bellNotes: [[0, 50, 2.6, .04], [16, 46, 2.4, .035], [32, 43, 2.6, .04], [48, 45, 2.4, .035]],
      chimeNotes: [[8, 74, 1.2], [24, 77, 1.2], [40, 74, 1.2], [56, 81, 1.2]]
    },
    bossSogei: {
      bpm: 152, steps: 64, style: 'bossIndustrial', leadTimbre: 'glitch', padStyle: 'organ',
      padOct: 0, padVol: .038, gain: .50, leadVol: .05,
      /* Ex CEO SOGEI: soldi, caos, manette. Marcia industriale tesa in Re minore. */
      chords: [CH.Dm, CH.Bb, CH.Gm, CH.A],
      bassPattern: [0, 0, 12, 0, 0, 12, 0, 7, 0, 0, 12, 0, 0, 12, 7, 12],
      leadNotes: [
        [0, 74, 2], [2, 74, 1], [4, 77, 2], [6, 81, 2], [8, 84, 3], [11, 81, 1], [12, 77, 1], [14, 74, 1],
        [16, 70, 2], [18, 70, 1], [20, 74, 2], [22, 77, 2], [24, 82, 3], [27, 77, 1], [28, 74, 1], [30, 70, 1],
        [32, 67, 2], [34, 67, 1], [36, 70, 2], [38, 74, 2], [40, 79, 3], [43, 74, 1], [44, 70, 1], [46, 67, 1],
        [48, 73, 2], [50, 73, 1], [52, 76, 2], [54, 81, 2], [56, 85, 3], [59, 81, 1], [60, 76, 1], [62, 73, 1]
      ],
      arpEvery: 1, arpPattern: [0, 2, 1, 2], arpVol: .008,
      stabSteps: [2, 6, 10, 14, 34, 38, 42, 46], stabVol: .026,
      bellNotes: [[0, 50, 3.6, .045], [16, 46, 3.4, .04], [32, 43, 3.6, .045], [48, 45, 3.4, .04]],
      chimeNotes: [[4, 88, 1.2], [12, 91, 1.2], [20, 88, 1.2], [28, 96, 1.3],
        [36, 88, 1.2], [44, 91, 1.2], [52, 88, 1.2], [60, 96, 1.3]]
    },
    victory: {
      bpm: 126, steps: 64, style: 'victory', leadTimbre: 'brass', padStyle: 'strings',
      padOct: 12, padVol: .04, gain: .46, leadVol: .058,
      chords: [CH.C, CH.G, CH.Am, CH.F],
      bassPattern: [0, 0, 12, null, 0, 0, 12, null, 0, 0, 12, null, 0, 7, 12, null],
      leadNotes: [
        [0, 72, 4], [4, 76, 2], [6, 79, 2], [8, 84, 4], [12, 79, 2], [14, 76, 2],
        [16, 74, 4], [20, 79, 2], [22, 83, 2], [24, 86, 4], [28, 83, 2], [30, 79, 2],
        [32, 72, 4], [36, 76, 2], [38, 79, 2], [40, 84, 4], [44, 88, 2], [46, 84, 2],
        [48, 81, 4], [52, 84, 2], [54, 88, 2], [56, 91, 4], [60, 86, 2], [62, 79, 2]
      ],
      arpEvery: 2, arpPattern: [0, 1, 2, 1], arpVol: .01,
      chimeNotes: [[0, 88, 1.4], [32, 91, 1.4], [56, 96, 1.6]],
      loop: false
    }
  };
  TRACKS.boss = TRACKS.boss2;

  const Sound = window.SoundEngine = {
    ctx: null, master: null, compressor: null, musicGain: null, sfxGain: null,
    voiceGain: null, convolver: null, musicWet: null, delay: null, delayWet: null,
    unlocked: false, muted: false, voiceOn: true,
    _track: null, _step: 0, _next: 0, _timer: null, _loop: true,
    _noise: null, _musicLevel: .42, _voiceEls: {}, _voiceMeta: {},
    _voiceCurrent: null, _voicePriority: 0, _voiceKey: null, _voiceTimer: null,
    _voices: [], _lastSpeak: 0, _initialized: false,

    init() {
      try {
        this.muted = localStorage.getItem('dogana_muted') === '1';
        this.voiceOn = localStorage.getItem('dogana_voice') !== '0';
      } catch (e) { /* modalità privata */ }
      this._prepareTracks();
      this._prepareVoices();
      if ('speechSynthesis' in window) {
        const load = () => { this._voices = window.speechSynthesis.getVoices() || []; };
        load();
        window.speechSynthesis.addEventListener?.('voiceschanged', load);
      }
      this._initialized = true;
    },

    _prepareTracks() {
      for (const track of Object.values(TRACKS)) {
        if (track._ready) continue;
        track._lead = new Map();
        for (const [step, note, dur] of (track.leadNotes || [])) track._lead.set(step, { note, dur });
        track._bells = new Map();
        for (const [step, note, dur, vol] of (track.bellNotes || [])) track._bells.set(step, { note, dur, vol });
        track._chimes = new Map();
        for (const [step, note, dur] of (track.chimeNotes || [])) track._chimes.set(step, { note, dur });
        track._stabs = new Set(track.stabSteps || []);
        track._ready = true;
      }
    },

    _prepareVoices() {
      const manifest = window.VOICE_MANIFEST || {};
      for (const [key, meta] of Object.entries(manifest)) {
        this._voiceMeta[key] = meta;
        if (!meta || !meta.file || typeof Audio === 'undefined') continue;
        try {
          const el = new Audio(meta.file);
          el.preload = 'auto';
          el.volume = .93;
          el.addEventListener('error', () => { el._doganaFailed = true; });
          el.load();
          this._voiceEls[key] = el;
        } catch (e) { /* la voce resta un bonus */ }
      }
    },

    unlock() {
      if (!this._initialized) this.init();
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const ctx = this.ctx = new AC();
        this.master = ctx.createGain();
        this.master.gain.value = this.muted ? 0 : .78;
        this.compressor = ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -18;
        this.compressor.knee.value = 12;
        this.compressor.ratio.value = 3;
        this.compressor.attack.value = .004;
        this.compressor.release.value = .22;
        this.master.connect(this.compressor);
        this.compressor.connect(ctx.destination);

        this.musicGain = ctx.createGain();
        this.musicGain.gain.value = 0;
        this.musicGain.connect(this.master);
        // riverbero caldo per la banda e le campane
        this.convolver = ctx.createConvolver();
        this.convolver.buffer = this._makeImpulse(1.7, 2.8);
        this.musicWet = ctx.createGain();
        this.musicWet.gain.value = .14;
        this.musicGain.connect(this.convolver);
        this.convolver.connect(this.musicWet);
        this.musicWet.connect(this.master);

        this.sfxGain = ctx.createGain();
        this.sfxGain.gain.value = .78;
        this.sfxGain.connect(this.master);

        this.voiceGain = ctx.createGain();
        this.voiceGain.gain.value = .95;
        this.voiceGain.connect(this.master);

        // eco per la melodia
        this.delay = ctx.createDelay(1.2);
        this.delay.delayTime.value = .28;
        const fb = ctx.createGain(); fb.gain.value = .24;
        this.delay.connect(fb); fb.connect(this.delay);
        this.delayWet = ctx.createGain(); this.delayWet.gain.value = .15;
        this.delay.connect(this.delayWet); this.delayWet.connect(this.musicGain);

        this._makeNoise();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      this.unlocked = true;
      this.applyMute();
    },

    _makeNoise() {
      const len = Math.floor(this.ctx.sampleRate * 2.2);
      const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + .016 * white) / 1.016;
        data[i] = white * .42 + last * 1.7;
      }
      this._noise = buffer;
    },

    _makeImpulse(seconds, decay) {
      const rate = this.ctx.sampleRate;
      const len = Math.floor(rate * seconds);
      const buf = this.ctx.createBuffer(2, len, rate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) {
          const t = i / len;
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * .5;
        }
      }
      return buf;
    },

    applyMute() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(this.muted ? 0 : .78, now, .025);
      if (this.muted) {
        this._stopVoice(false);
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      }
    },

    toggleMute() {
      this.muted = !this.muted;
      try { localStorage.setItem('dogana_muted', this.muted ? '1' : '0'); } catch (e) {}
      this.applyMute();
      return !this.muted;
    },

    toggleVoice() {
      this.voiceOn = !this.voiceOn;
      try { localStorage.setItem('dogana_voice', this.voiceOn ? '1' : '0'); } catch (e) {}
      if (!this.voiceOn) this._stopVoice(false);
      return this.voiceOn;
    },

    get audioOn() { return !this.muted; },

    /* ---------------- voce ---------------- */
    /* Personaggio selezionato, per non far parlare Adele quando gioca Rocco.
       Lo stato è esposto da game.js tramite window.DOGANA.state. */
    characterNow() {
      try {
        const st = window.DOGANA && window.DOGANA.state;
        return st && st.character ? st.character : null;
      } catch (e) { return null; }
    },

    /* Regole dichiarate in js/voices.js:
       - { character: 'adele', textRocco: '...' }  clip registrata per un solo personaggio
       - { tts: true }                              clip non più coerente col contesto:
                                                    si usa il fallback italiano (speechSynthesis)
       Restituisce null se la clip è utilizzabile così com'è. */
    voiceSuitability(key, text) {
      const rules = window.VOICE_SUITABILITY || null;
      if (!rules) return null;
      const rule = rules[key];
      if (!rule) return null;
      const character = this.characterNow();
      if (rule.character && character && rule.character !== character) {
        return { tts: true, text: (character === 'rocco' && rule.textRocco) || text };
      }
      if (rule.tts) return { tts: true, text: rule.text || text };
      return null;
    },

    /* Sottotitoli: emesso SOLO quando la voce parte davvero.
       La UI ascolta 'dogana:subtitle' e mostra #subtitles se l'opzione è attiva. */
    _subtitle(key, text) {
      if (!text) return;
      try {
        document.dispatchEvent(new CustomEvent('dogana:subtitle', { detail: { key, text } }));
      } catch (e) { /* browsing context senza CustomEvent */ }
    },

    say(key, fallbackText, opts = {}) {
      const meta = this._voiceMeta[key];
      const text = fallbackText || (meta && meta.text) || '';
      // Sottotitoli: attivi di default, disattivabili per le battute che hanno
      // già il testo nel fumetto/callout canvas (opts.subtitle === false).
      const wantSubtitle = opts.subtitle !== false;
      // Accessibilità: con audio muto o voce disattivata i sottotitoli devono
      // comunque arrivare (utente non udente). Nessuna voce = un solo evento,
      // emesso qui e non anche dal percorso di riproduzione.
      if (!this.voiceOn || this.muted) {
        if (wantSubtitle && text) this._subtitle(key, text);
        return false;
      }
      const priority = opts.priority == null ? 2 : opts.priority;
      if (this._voiceCurrent && !opts.force && priority <= this._voicePriority) return false;
      const alt = this.voiceSuitability(key, text);
      if (alt && alt.tts) {
        // Clip non idonea al personaggio/contesto: voce italiana di fallback,
        // chiaramente identificabile via _voiceKey 'key#tts'.
        this._stopVoice(true);
        this._voiceKey = key + '#tts';
        this.speak(alt.text, { force: true, key, priority, subtitle: wantSubtitle });
        return false;
      }
      this._stopVoice(true);
      const el = this._voiceEls[key];
      if (el && !el._doganaFailed) {
        try {
          el.currentTime = 0;
          el.volume = .93;
          const dur = isFinite(el.duration) && el.duration > .2 ? el.duration : Math.max(1.6, text.length * .07);
          this._duckFor(dur + .35);
          this._voiceCurrent = el;
          this._voicePriority = priority;
          this._voiceKey = key;
          const finish = () => {
            if (this._voiceCurrent !== el) return;
            this._voiceCurrent = null;
            this._voicePriority = 0;
            this._voiceKey = null;
            el.onended = null;
            if (this._voiceTimer) { clearTimeout(this._voiceTimer); this._voiceTimer = null; }
            this._restoreMusic(.45);
          };
          el.onended = finish;
          el.onerror = () => {
            if (this._voiceCurrent === el) { this._voiceCurrent = null; this._voicePriority = 0; }
            this.speak(text, { force: true, noDuck: true, key, subtitle: wantSubtitle });
          };
          const promise = el.play();
          if (promise && promise.then) {
            promise.then(() => {
              // MP3 realmente partito: solo ora il sottotitolo è valido.
              if (this._voiceCurrent === el && wantSubtitle) this._subtitle(key, text);
            }).catch(() => {
              if (this._voiceCurrent === el) { this._voiceCurrent = null; this._voicePriority = 0; }
              this.speak(text, { force: true, noDuck: true, key, subtitle: wantSubtitle });
            });
          } else if (wantSubtitle) {
            this._subtitle(key, text);
          }
          this._voiceTimer = setTimeout(() => {
            if (this._voiceCurrent === el) finish();
          }, (dur + 1.4) * 1000);
          return true;
        } catch (e) { /* fallback */ }
      }
      this.speak(text, { force: true, ...opts, key, subtitle: wantSubtitle });
      return false;
    },

    speak(text, opts = {}) {
      if (!this.voiceOn || this.muted || !text || !('speechSynthesis' in window)) return;
      const now = performance.now();
      if (!opts.force && now - this._lastSpeak < 380) return;
      this._lastSpeak = now;
      try {
        const synth = window.speechSynthesis;
        synth.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        const voices = synth.getVoices ? synth.getVoices() : this._voices;
        const v = voices.find(v => /it[-_]IT/i.test(v.lang)) || voices.find(v => /italian/i.test(v.name)) || null;
        if (v) utter.voice = v;
        utter.lang = 'it-IT';
        utter.rate = opts.rate || 1.02;
        utter.pitch = opts.pitch || .94;
        utter.volume = .96;
        const estimate = clamp(text.length * .072 + 1.1, 1.4, 8);
        if (!opts.noDuck) this._duckFor(estimate);
        utter.onend = () => this._restoreMusic(.4);
        utter.onerror = () => this._restoreMusic(.4);
        if (opts.key && opts.subtitle !== false) this._subtitle(opts.key, text);
        synth.speak(utter);
      } catch (e) { /* la voce è un bonus */ }
    },

    _stopVoice(silent = false) {
      if (this._voiceCurrent) {
        try { this._voiceCurrent.pause(); this._voiceCurrent.currentTime = 0; this._voiceCurrent.onended = null; } catch (e) {}
        this._voiceCurrent = null;
      }
      this._voicePriority = 0;
      this._voiceKey = null;
      if (this._voiceTimer) { clearTimeout(this._voiceTimer); this._voiceTimer = null; }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (!silent) this._restoreMusic(.3);
    },

    _duckFor(seconds) {
      if (!this.ctx || !this.musicGain) return;
      const now = this.ctx.currentTime;
      const level = this._musicLevel || .42;
      const g = this.musicGain.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(Math.max(.0001, g.value), now);
      g.linearRampToValueAtTime(level * .3, now + .09);
      g.setValueAtTime(level * .3, now + Math.max(.65, seconds));
      g.linearRampToValueAtTime(level, now + Math.max(.65, seconds) + .42);
    },

    _restoreMusic(time = .35) {
      if (!this.ctx || !this.musicGain) return;
      const now = this.ctx.currentTime;
      const g = this.musicGain.gain;
      g.cancelScheduledValues(now);
      g.setTargetAtTime(this._musicLevel || .42, now, time);
    },

    /* ---------------- musica ---------------- */
    setScene(name) {
      if (!this.ctx) return;
      const track = TRACKS[name];
      if (!track) return;
      if (this._track === name) return;
      this._track = name;
      this._step = 0;
      this._next = this.ctx.currentTime + .08;
      this._loop = track.loop !== false;
      this._musicLevel = track.gain || .14;
      if (this._timer) { clearInterval(this._timer); this._timer = null; }
      const now = this.ctx.currentTime;
      if (this.delay) this.delay.delayTime.setTargetAtTime(clamp(60 / track.bpm * .75, .16, .5), now, .06);
      const g = this.musicGain.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(Math.max(.0001, g.value), now);
      const target = this._voiceCurrent ? this._musicLevel * .3 : this._musicLevel;
      g.linearRampToValueAtTime(target, now + .4);
      this._scheduler();
      this._timer = setInterval(() => this._scheduler(), 25);
    },

    stopMusic() {
      if (this._timer) clearInterval(this._timer);
      this._timer = null;
      this._track = null;
      if (this.ctx && this.musicGain) {
        const now = this.ctx.currentTime;
        this.musicGain.gain.cancelScheduledValues(now);
        this.musicGain.gain.setTargetAtTime(0, now, .1);
      }
    },

    _scheduler() {
      if (!this.ctx || !this._track) return;
      if (this.muted) {
        this._next = this.ctx.currentTime + .06;
        return;
      }
      const track = TRACKS[this._track];
      const stepDur = 60 / track.bpm / 4;
      while (this._next < this.ctx.currentTime + .19) {
        this._playStep(track, this._step, this._next, stepDur);
        this._step++;
        if (this._step >= track.steps) {
          if (!this._loop) {
            this._step = 0;
            this._track = null;
            clearInterval(this._timer);
            this._timer = null;
            break;
          }
          this._step = 0;
        }
        this._next += stepDur;
      }
    },

    _playStep(track, step, t, stepDur) {
      const tick = step % 16;
      const bar = Math.floor(step / 16) % track.chords.length;
      const chord = track.chords[bar];
      this._playDrums(track.style, tick, step, t);

      const bassInterval = track.bassPattern[tick];
      if (bassInterval !== null && bassInterval !== undefined) {
        this._bass(t, midiHz(chord[0] - 12 + bassInterval), stepDur * 1.7, .115, track.style);
      }

      const note = track._lead.get(step);
      if (note) this._lead(t, midiHz(note.note), Math.max(.1, note.dur * stepDur * .92), track.leadVol || .05, track.leadTimbre, .16);

      if (track.arpEvery && tick % track.arpEvery === 0) {
        const p = track.arpPattern || [0, 1, 2, 1];
        const idx = p[(step / track.arpEvery) % p.length | 0] || 0;
        const n = chord[idx % chord.length] + 12 + (idx >= chord.length ? 12 : 0);
        this._pluck(t, midiHz(n), .11, track.arpVol || .008, -.22);
      }

      if (tick === 0 || (track.padEvery && tick % track.padEvery === 0)) {
        const dur = stepDur * (track.padEvery || 16) * 1.05;
        this._pad(t, chord, dur, track.padStyle, track.padVol || .035, track.padOct || 0);
      }

      if (track._stabs.has(tick)) this._stab(t, chord, track.stabVol || .026);

      const bell = track._bells.get(step);
      if (bell) this._bell(t, midiHz(bell.note), bell.dur || 3, bell.vol || .04, -.1);
      const chime = track._chimes.get(step);
      if (chime) this._glock(t, midiHz(chime.note), chime.dur || 1.2, .028, .28);
    },

    _playDrums(style, d, step, t) {
      if (style === 'menu') {
        if (d === 0 || d === 4 || d === 8 || d === 12) this._kick(t, .44);
        if (d === 4 || d === 12) this._clap(t, .17);
        if (d % 2 === 0) this._hat(t, .026, d === 14);
        if (d === 2 || d === 6 || d === 10 || d === 14) this._tamb(t, .065);
        if (step % 32 === 0) this._crash(t, .08);
      } else if (style === 'drive') {
        if (d === 0 || d === 3 || d === 8 || d === 11) this._kick(t, .48);
        if (d === 4 || d === 12) this._snare(t, .24);
        if (d % 2 === 0) this._hat(t, .025, d === 14);
        if (d === 6 || d === 14) this._tamb(t, .07);
        if (step % 32 === 0) this._crash(t, .1);
        if (step % 64 >= 60) this._tom(t, 130 - (step % 64 - 60) * 12, .09);
      } else if (style === 'tarantella') {
        if (d === 0 || d === 6 || d === 8 || d === 14) this._kick(t, .3);
        if (d === 0 || d === 3 || d === 6 || d === 8 || d === 11 || d === 14) this._tamb(t, .085);
        if (d === 4 || d === 12) this._clap(t, .12);
        if (d === 2 || d === 10) this._wood(t, .045);
        if (d % 2 === 1) this._hat(t, .018, false);
        if (step % 64 === 62) this._tamb(t, .12);
      } else if (style === 'bossSea') {
        if (d === 0 || d === 3 || d === 6 || d === 8 || d === 11) this._kick(t, .54);
        if (d === 4 || d === 12) this._snare(t, .32);
        if (d % 2 === 0) this._hat(t, .03, d === 14);
        if (step % 32 === 0) this._crash(t, .12);
        if (step % 64 >= 60) this._tom(t, 160 - (step % 64 - 60) * 22, .12);
      } else if (style === 'san') {
        if (d === 0) this._timpani(t, midiHz(38), .36);
        if (d === 8) this._timpani(t, midiHz(45), .22);
        if (d === 0 || d === 4 || d === 8 || d === 12) this._kick(t, .42);
        if (d === 4 || d === 12) this._snare(t, .28);
        if (d % 2 === 0) this._hat(t, .022, d === 14);
        if (d === 6 || d === 14) this._metal(t, .06);
        if (step % 32 === 0) this._crash(t, .09);
      } else if (style === 'victory') {
        if (d === 0 || d === 4 || d === 8 || d === 12) this._kick(t, .46);
        if (d === 4 || d === 12) this._snare(t, .24);
        if (d % 2 === 0) this._hat(t, .026, d === 14);
        if (d % 4 === 2) this._tamb(t, .075);
        if (d === 0) this._clap(t, .1);
        if (step % 32 === 0) this._crash(t, .08);
        if (step % 64 >= 60) this._tom(t, 150 - (step % 64 - 60) * 20, .1);
      } else if (style === 'march') {
        /* Roma: passo di marcia, timpani, rullata di tamburo a fine battuta. */
        if (d === 0) this._timpani(t, midiHz(38), .32);
        if (d === 8) this._timpani(t, midiHz(45), .18);
        if (d === 0 || d === 4 || d === 8 || d === 12) this._kick(t, .34);
        if (d === 4 || d === 12) this._snare(t, .2);
        if (d === 2 || d === 6 || d === 10 || d === 14) this._tamb(t, .05);
        if (d >= 13) this._snare(t, .05 + (d - 13) * .018);
        if (step % 32 === 0) this._crash(t, .07);
      } else if (style === 'triumph') {
        /* Boss Roma: marcia trionfale, più pesante e con tom finale. */
        if (d === 0) this._timpani(t, midiHz(38), .42);
        if (d === 8) this._timpani(t, midiHz(45), .26);
        if (d === 0 || d === 4 || d === 8 || d === 12) this._kick(t, .5);
        if (d === 4 || d === 12) this._snare(t, .3);
        if (d === 2 || d === 6 || d === 10 || d === 14) this._snare(t, .08);
        if (d % 2 === 0) this._hat(t, .024, d === 14);
        if (step % 32 === 0) this._crash(t, .12);
        if (step % 64 >= 60) this._tom(t, 150 - (step % 64 - 60) * 18, .11);
      } else if (style === 'euro') {
        /* Europa: eurodisco, cassa in quattro, clap e hat aperti in levare. */
        if (d % 4 === 0) this._kick(t, .46);
        if (d === 4 || d === 12) this._clap(t, .17);
        if (d % 2 === 0) this._hat(t, .024, d === 14);
        if (d === 2 || d === 6 || d === 10 || d === 14) this._hat(t, .016, true);
        if (step % 32 === 0) this._crash(t, .08);
        if (step % 64 >= 60) this._tom(t, 140 - (step % 64 - 60) * 16, .08);
      } else if (style === 'bossEuro') {
        /* Boss Europa: quattro quarti istituzionali + timpani + metal burocratico. */
        if (d % 4 === 0) this._kick(t, .52);
        if (d === 0 || d === 8) this._timpani(t, midiHz(38), .2);
        if (d === 4 || d === 12) this._clap(t, .24);
        if (d % 2 === 0) this._hat(t, .026, d === 14);
        if (d === 6 || d === 14) this._metal(t, .05);
        if (step % 32 === 0) this._crash(t, .11);
        if (step % 64 >= 60) this._tom(t, 155 - (step % 64 - 60) * 20, .1);
      } else if (style === 'psy') {
        /* Pescara: ritmo allegro e sghembo, woodblock e tamburello psichedelico. */
        if (d === 0 || d === 3 || d === 8 || d === 11) this._kick(t, .42);
        if (d === 4 || d === 12) this._clap(t, .16);
        if (d % 2 === 0) this._hat(t, .022, d === 14);
        else this._hat(t, .013, false);
        if (d === 2 || d === 10) this._wood(t, .04);
        if (d === 6 || d === 14) this._tamb(t, .06);
        if (step % 32 === 0) this._crash(t, .07);
      } else if (style === 'nightDrive') {
        /* Pescara by Night: cassa in quattro, tom tribali e basso in levare.
           Pattern originale, mood post-punk, nessuna citazione melodica. */
        if (d === 0 || d === 4 || d === 8 || d === 12) this._kick(t, .43);
        if (d === 4 || d === 12) this._snare(t, .21);
        if (d % 2 === 0) this._hat(t, .018, d === 14);
        if (d === 6 || d === 14) this._tamb(t, .045);
        if (d === 14) this._tom(t, 135, .095);
        if (step % 32 === 0) this._crash(t, .065);
        if (step % 64 >= 60) this._tom(t, 145 - (step % 64 - 60) * 16, .1);
      } else if (style === 'night') {
        /* Pescara by Night: groove da riviera, spazzole e legnetti. */
        if (d === 0 || d === 4 || d === 8 || d === 12) this._kick(t, .4);
        if (d === 4 || d === 12) this._snare(t, .22);
        if (d % 2 === 0) this._hat(t, .02, d === 14);
        if (d % 4 === 2) this._tamb(t, .05);
        if (step % 32 === 0) this._crash(t, .06);
        if (step % 64 >= 62) this._wood(t, .03);
      } else if (style === 'industrial') {
        /* SOGEI: glitch, metal, cassa irregolare da sala server. */
        if (d === 0 || d === 3 || d === 6 || d === 8 || d === 11 || d === 14) this._kick(t, .4);
        if (d === 4 || d === 12) this._snare(t, .26);
        if (d === 7 || d === 15) this._metal(t, .05);
        if (d % 2 === 0) this._hat(t, .02, d === 14);
        if (step % 32 === 0) this._crash(t, .07);
        if (step % 16 === 13) this._wood(t, .02);
      } else if (style === 'bossIndustrial') {
        /* Boss SOGEI: la stessa sala server, ma in fiamme. */
        if (d === 0 || d === 3 || d === 6 || d === 8 || d === 11) this._kick(t, .52);
        if (d === 4 || d === 12) this._snare(t, .32);
        if (d === 2 || d === 7 || d === 10 || d === 15) this._metal(t, .06);
        if (d % 2 === 0) this._hat(t, .026, d === 14);
        if (step % 32 === 0) this._crash(t, .12);
        if (step % 64 >= 60) this._tom(t, 160 - (step % 64 - 60) * 22, .12);
      }
    },

    _out(pan, delaySend = 0) {
      const p = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : this.ctx.createGain();
      if (p.pan) p.pan.value = pan || 0;
      p.connect(this.musicGain);
      if (delaySend > 0 && this.delay) {
        const s = this.ctx.createGain(); s.gain.value = delaySend;
        p.connect(s); s.connect(this.delay);
      }
      return p;
    },

    _env(g, t, attack, dur, peak) {
      const end = t + Math.max(.04, dur);
      g.gain.setValueAtTime(.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + Math.max(.004, attack));
      g.gain.setValueAtTime(peak * .82, t + Math.max(attack, (end - t) * .58));
      g.gain.exponentialRampToValueAtTime(.0001, end);
    },

    _bass(t, f, dur, vol, style) {
      const p = this._out(0);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      /* Il filtro segue il carattere della traccia: scuro per boss/industriale,
         brillante per eurodisco e acid. Default invariato per le tracce v1. */
      const dark = style === 'bossSea' || style === 'san' || style === 'industrial' || style === 'bossIndustrial';
      const bright = style === 'euro' || style === 'bossEuro';
      filter.frequency.setValueAtTime(dark ? 260 : bright ? 680 : style === 'psy' ? 760 : 520, t);
      const filterEnd = style === 'bossSea' || style === 'industrial' || style === 'bossIndustrial' ? 90
        : bright ? 190 : 140;
      filter.frequency.exponentialRampToValueAtTime(filterEnd, t + Math.max(.06, dur));
      filter.Q.value = 1.2;
      const g = this.ctx.createGain();
      this._env(g, t, .008, dur, vol);
      filter.connect(g); g.connect(p);
      for (const [type, det, mult] of [['triangle', 0, 1], ['sawtooth', 8, 1], ['sine', 0, .5]]) {
        const o = this.ctx.createOscillator();
        o.type = type; o.frequency.setValueAtTime(f * mult, t); o.detune.value = det;
        o.connect(filter); o.start(t); o.stop(t + Math.max(.06, dur) + .06);
      }
    },

    _lead(t, f, dur, vol, timbre, pan) {
      const p = this._out(pan || 0, timbre === 'croon' ? .22 : .13);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.value = .8;
      const g = this.ctx.createGain();
      const attack = timbre === 'organ' || timbre === 'hymn' ? .09
        : timbre === 'croon' ? .035
          : timbre === 'synth' ? .028
            : timbre === 'trumpet' ? .02
              : timbre === 'acid' ? .006
                : timbre === 'glitch' ? .005
                  : .012;
      this._env(g, t, attack, dur, vol);
      filter.connect(g); g.connect(p);
      let oscs = [];
      if (timbre === 'croon') {
        filter.frequency.setValueAtTime(1900, t);
        oscs = [['sawtooth', -5], ['triangle', 7], ['sine', 0]];
        oscs.push(['sine', 0, 2]);
      } else if (timbre === 'accordion') {
        filter.frequency.setValueAtTime(2600, t);
        oscs = [['square', -4], ['sawtooth', 6], ['triangle', 0]];
      } else if (timbre === 'organ' || timbre === 'hymn') {
        filter.frequency.setValueAtTime(4200, t);
        oscs = [['sine', 0], ['sine', 0, 2], ['sawtooth', 5], ['triangle', -4]];
        if (timbre === 'hymn') oscs.push(['square', -9, .5]);
      } else if (timbre === 'trumpet') {
        /* Ottoni di fanfara (Roma/Cesare): sega+quadra, attacco pronto. */
        filter.frequency.setValueAtTime(3200, t);
        oscs = [['sawtooth', -6], ['sawtooth', 6], ['square', 0, .5]];
      } else if (timbre === 'synth') {
        /* Lead eurodisco (Europa/Ursula): tre oscillatori larghi e brillanti. */
        filter.frequency.setValueAtTime(2600, t);
        oscs = [['sawtooth', -10], ['sawtooth', 10], ['square', 0, .5], ['triangle', 0, .25]];
      } else if (timbre === 'acid') {
        /* Arpeggio acido psichedelico (Pescara): risonanza alta, decadimento secco. */
        filter.frequency.setValueAtTime(5200, t);
        filter.Q.value = 6.5;
        oscs = [['sawtooth', 0], ['square', 9]];
      } else if (timbre === 'glitch') {
        /* Ottoni/glitch industriali (SOGEI): quadre detunate e dure. */
        filter.frequency.setValueAtTime(2400, t);
        oscs = [['square', -12], ['square', 12], ['sawtooth', 0, .5]];
      } else {
        filter.frequency.setValueAtTime(3400, t);
        oscs = [['sawtooth', -8], ['sawtooth', 8], ['square', 0, .5]];
      }
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = timbre === 'croon' ? 5.2 : timbre === 'acid' ? 6.8 : timbre === 'glitch' ? 7.6 : 5.8;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = timbre === 'organ' || timbre === 'hymn' ? 2.4
        : timbre === 'acid' ? 5.8
          : timbre === 'glitch' ? 6.4
            : timbre === 'synth' ? 3.6
              : timbre === 'trumpet' ? 4
                : 4.2;
      lfo.connect(lfoGain);
      for (const [type, det, mult] of oscs) {
        const o = this.ctx.createOscillator();
        o.type = type; o.frequency.setValueAtTime(f * (mult || 1), t); o.detune.value = det;
        lfoGain.connect(o.frequency);
        o.connect(filter); o.start(t); o.stop(t + dur + .1);
      }
      lfo.start(t); lfo.stop(t + dur + .1);
    },

    _pluck(t, f, dur, vol, pan) {
      const p = this._out(pan || 0);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = clamp(f * 2.2, 500, 5200);
      filter.Q.value = .65;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      filter.connect(g); g.connect(p);
      for (const [type, det] of [['triangle', 0], ['square', 9]]) {
        const o = this.ctx.createOscillator();
        o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = det;
        o.connect(filter); o.start(t); o.stop(t + dur + .04);
      }
    },

    _pad(t, chord, dur, style, vol, oct = 0) {
      const notes = chord.map(n => n + oct);
      for (let i = 0; i < notes.length; i++) {
        const p = this._out(i === 0 ? -.2 : i === notes.length - 1 ? .2 : 0);
        const filter = this.ctx.createBiquadFilter();
        filter.type = style === 'choir' ? 'bandpass' : 'lowpass';
        filter.frequency.value = style === 'organ' ? 3000 : style === 'choir' ? 900 : 1400;
        filter.Q.value = style === 'choir' ? 1.4 : .7;
        const g = this.ctx.createGain();
        const attack = style === 'organ' ? .14 : .09;
        g.gain.setValueAtTime(.0001, t);
        g.gain.linearRampToValueAtTime(vol, t + attack);
        g.gain.setValueAtTime(vol * .75, t + dur * .7);
        g.gain.exponentialRampToValueAtTime(.0001, t + dur);
        filter.connect(g); g.connect(p);
        for (const [type, det, mult] of (style === 'organ'
          ? [['sine', 0, 1], ['sawtooth', 4, 1], ['sine', 0, 2]]
          : style === 'choir'
            ? [['triangle', -4, 1], ['sawtooth', 5, 1]]
            : [['sawtooth', -5, 1], ['sawtooth', 5, 1]])) {
          const o = this.ctx.createOscillator();
          o.type = type; o.frequency.value = midiHz(notes[i] * 1 + 0) * (mult || 1); o.detune.value = det;
          o.connect(filter); o.start(t); o.stop(t + dur + .15);
        }
      }
    },

    _stab(t, chord, vol) {
      for (let i = 0; i < chord.length; i++) {
        const p = this._out(i === 0 ? -.18 : i === chord.length - 1 ? .18 : 0);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = 2400; filter.Q.value = .8;
        const g = this.ctx.createGain();
        this._env(g, t, .006, .18, vol);
        filter.connect(g); g.connect(p);
        for (const [type, det] of [['sawtooth', -6], ['square', 7]]) {
          const o = this.ctx.createOscillator();
          o.type = type; o.frequency.value = midiHz(chord[i]); o.detune.value = det;
          o.connect(filter); o.start(t); o.stop(t + .24);
        }
      }
    },

    _bell(t, f, dur, vol, pan) {
      const p = this._out(pan || 0);
      const carrier = this.ctx.createOscillator();
      carrier.type = 'sine'; carrier.frequency.value = f;
      const mod = this.ctx.createOscillator();
      mod.type = 'sine'; mod.frequency.value = f * 2.01;
      const modGain = this.ctx.createGain();
      modGain.gain.setValueAtTime(f * 1.25, t);
      modGain.gain.exponentialRampToValueAtTime(1, t + Math.min(1.2, dur * .55));
      mod.connect(modGain); modGain.connect(carrier.frequency);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + .006);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      carrier.connect(g); g.connect(p);
      carrier.start(t); mod.start(t); carrier.stop(t + dur + .1); mod.stop(t + dur + .1);
    },

    _glock(t, f, dur, vol, pan) {
      const p = this._out(pan || 0);
      const o = this.ctx.createOscillator();
      o.type = 'sine'; o.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g); g.connect(p); o.start(t); o.stop(t + dur + .04);
      const o2 = this.ctx.createOscillator();
      o2.type = 'triangle'; o2.frequency.value = f * 2.76;
      const g2 = this.ctx.createGain();
      g2.gain.setValueAtTime(vol * .35, t);
      g2.gain.exponentialRampToValueAtTime(.0001, t + dur * .55);
      o2.connect(g2); g2.connect(p); o2.start(t); o2.stop(t + dur * .6);
    },

    _noiseBurst(t, dur, vol, freq, type, q, dest) {
      if (!this._noise) return;
      const src = this.ctx.createBufferSource();
      src.buffer = this._noise;
      const f = this.ctx.createBiquadFilter();
      f.type = type || 'highpass'; f.frequency.value = freq || 4000; f.Q.value = q || .7;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(dest || this.musicGain);
      src.start(t); src.stop(t + dur + .03);
    },

    _kick(t, vol) {
      const o = this.ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(155, t);
      o.frequency.exponentialRampToValueAtTime(46, t + .15);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(.001, t + .19);
      o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + .21);
      this._noiseBurst(t, .025, vol * .14, 1100, 'highpass', .6, this.musicGain);
    },

    _snare(t, vol) {
      this._noiseBurst(t, .12, vol, 1000, 'bandpass', .8, this.musicGain);
      const o = this.ctx.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(185, t); o.frequency.exponentialRampToValueAtTime(95, t + .09);
      const g = this.ctx.createGain(); g.gain.setValueAtTime(vol * .35, t); g.gain.exponentialRampToValueAtTime(.001, t + .1);
      o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + .11);
    },

    _clap(t, vol) {
      for (let i = 0; i < 3; i++) this._noiseBurst(t + i * .012, .035, vol * (i ? .55 : 1), 1800, 'bandpass', 1.3, this.musicGain);
    },

    _hat(t, vol, open) {
      this._noiseBurst(t, open ? .1 : .028, vol, 7800, 'highpass', .6, this.musicGain);
    },

    _tamb(t, vol) {
      this._noiseBurst(t, .055, vol, 6200, 'bandpass', 1.8, this.musicGain);
      this._noiseBurst(t + .014, .04, vol * .55, 9000, 'highpass', .7, this.musicGain);
    },

    _wood(t, vol) {
      const o = this.ctx.createOscillator(); o.type = 'square';
      o.frequency.setValueAtTime(1150, t);
      const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + .055);
      o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + .07);
    },

    _crash(t, vol) {
      this._noiseBurst(t, .7, vol, 5200, 'highpass', .5, this.musicGain);
    },

    _tom(t, f, vol) {
      const o = this.ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .55, t + .16);
      const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + .2);
      o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + .22);
    },

    _timpani(t, f, vol) {
      const o = this.ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .8, t + .18);
      const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + .4);
      o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + .42);
      this._noiseBurst(t, .12, vol * .12, 220, 'lowpass', .5, this.musicGain);
    },

    _metal(t, vol) {
      this._noiseBurst(t, .12, vol, 3200, 'bandpass', 2.2, this.musicGain);
      const o = this.ctx.createOscillator(); o.type = 'square'; o.frequency.value = 720;
      const g = this.ctx.createGain(); g.gain.setValueAtTime(vol * .25, t); g.gain.exponentialRampToValueAtTime(.0001, t + .18);
      o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + .2);
    },

    /* ---------------- SFX ---------------- */
    _sfxOsc(type, f0, f1, dur, vol, t, filterFreq) {
      if (!this.ctx || this.muted) return;
      t = t || this.ctx.currentTime;
      const o = this.ctx.createOscillator(); o.type = type;
      o.frequency.setValueAtTime(f0, t);
      if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      let last = o;
      if (filterFreq) {
        const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filterFreq;
        o.connect(f); last = f;
      }
      last.connect(g); g.connect(this.sfxGain); o.start(t); o.stop(t + dur + .02);
    },

    _sfxNoise(dur, vol, freq, type, t) {
      if (!this.ctx || this.muted || !this._noise) return;
      t = t || this.ctx.currentTime;
      const src = this.ctx.createBufferSource(); src.buffer = this._noise;
      const f = this.ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq || 1400; f.Q.value = .7;
      const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(this.sfxGain); src.start(t); src.stop(t + dur + .02);
    },

    shoot(heavy) {
      if (!this.ctx || this.muted) return;
      if (!heavy) {
        this._sfxOsc('square', 1600 + Math.random() * 240, 420, .052, .045);
        this._sfxOsc('sawtooth', 2300, 700, .032, .014);
      } else {
        this._sfxNoise(.05, .1, 900, 'lowpass');
        this._sfxOsc('square', 200 + Math.random() * 30, 70, .07, .045);
      }
    },
    enemyHit() {
      this._sfxNoise(.04, .06, 2600, 'bandpass');
      this._sfxOsc('square', 260, 100, .04, .02);
    },
    explosion(big) {
      if (!this.ctx || this.muted) return;
      this._sfxNoise(big ? .55 : .26, big ? .27 : .19, big ? 700 : 1200, 'lowpass');
      this._sfxOsc('sine', big ? 120 : 160, 34, big ? .48 : .24, big ? .26 : .16);
      if (big) this._sfxOsc('sawtooth', 90, 30, .38, .08);
    },
    powder() {
      this._sfxNoise(.4, .11, 900, 'bandpass');
      this._sfxOsc('sine', 340, 90, .32, .06);
    },
    jump() { this._sfxOsc('square', 220, 540, .1, .032); },
    land() { this._sfxNoise(.05, .03, 400, 'lowpass'); },
    pickup(kind) {
      if (kind === 'health') {
        [523, 659, 784].forEach((f, i) => setTimeout(() => this._sfxOsc('triangle', f, f, .12, .06), i * 55));
      } else {
        [440, 554, 659, 880].forEach((f, i) => setTimeout(() => this._sfxOsc('square', f, f, .09, .038), i * 45));
      }
    },
    uiMove() { this._sfxOsc('square', 520, 660, .04, .022); },
    uiSelect() { [523, 659, 1046].forEach((f, i) => setTimeout(() => this._sfxOsc('square', f, f, .07, .03), i * 55)); },
    locked() { this._sfxOsc('square', 160, 110, .16, .035); },
    playerHurt() {
      this._sfxNoise(.16, .1, 950, 'lowpass');
      this._sfxOsc('sawtooth', 210, 70, .2, .085);
    },
    grenadeThrow() { this._sfxOsc('triangle', 330, 880, .16, .03); },
    charge() { this._sfxOsc('sawtooth', 80, 460, .9, .045, null, 1200); },
    laser() {
      this._sfxNoise(.6, .14, 3000, 'bandpass');
      this._sfxOsc('sawtooth', 900, 90, .55, .1);
      this._sfxOsc('square', 320, 60, .5, .05);
    },
    orbLaunch() { this._sfxOsc('triangle', 260, 740, .2, .045); },
    alarm() {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      [0, .22, .44].forEach((d, i) => {
        this._sfxOsc('square', i % 2 ? 440 : 620, i % 2 ? 620 : 440, .19, .07, t + d);
      });
    },
    checkpoint() { [392, 523, 659, 784].forEach((f, i) => setTimeout(() => this._sfxOsc('triangle', f, f, .11, .05), i * 70)); },

    /* ---------------- SFX v2.0 (Roma / Europa / Pescara / SOGEI) ----------------
       Sintetizzati come i v1, volumi bassi (.018–.08) e sempre dentro il bus sfxGain
       (quindi sotto il compressore master, senza clipping). Il gameplay li chiama con
       feature detection: if (SoundEngine.centurion) SoundEngine.centurion(). */
    centurion() {
      /* Passo pesante del centurione: tonfo + clangore di scudo e lancia. */
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      this._sfxOsc('sine', 120, 46, .22, .07, t);
      this._sfxNoise(.1, .035, 700, 'bandpass', t);
      this._sfxOsc('square', 320, 180, .09, .02, t + .05);
      this._sfxNoise(.06, .018, 3200, 'highpass', t + .06);
    },
    bottlePop() {
      /* Tappo che salta: pop secco, frizzante, poi la bottiglia sfrigola. */
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      this._sfxNoise(.03, .055, 2400, 'bandpass', t);
      this._sfxOsc('sine', 900, 240, .06, .045, t);
      this._sfxNoise(.24, .016, 5200, 'highpass', t + .02);
    },
    crashError() {
      /* Pannello "ERRORE 404" del livello SOGEI: bip d'errore a due toni + glitch. */
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      this._sfxOsc('square', 880, 880, .11, .038, t);
      this._sfxOsc('square', 660, 660, .15, .038, t + .13);
      this._sfxNoise(.1, .035, 1800, 'bandpass', t + .02);
      this._sfxOsc('sawtooth', 110, 58, .24, .028, t + .05);
    },
    moneyRain() {
      /* Pioggia di monetine del boss SOGEI: cascata di triangoli + scintillio. */
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      [1046, 1318, 1568, 1318, 1046, 784, 1046, 1568].forEach((f, i) => {
        this._sfxOsc('triangle', f, f, .09, .024, t + i * .055);
      });
      this._sfxNoise(.5, .022, 6000, 'highpass', t);
      this._sfxOsc('sine', 180, 90, .3, .028, t);
    },
    monkeyType() {
      /* Scimmia alla tastiera (SOGEI): raffica di click meccanici irregolari. */
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      for (let i = 0; i < 5; i++) {
        this._sfxNoise(.022, .028, 3400 + Math.random() * 1400, 'bandpass', t + i * .052 + Math.random() * .012);
      }
    },
    receipt() {
      /* Scontrino del livello Pescara: stampante a gettoni + strappo finale. */
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      for (let i = 0; i < 8; i++) this._sfxNoise(.018, .022, 1800 + i * 120, 'bandpass', t + i * .03);
      this._sfxNoise(.12, .02, 2800, 'highpass', t + .24);
      this._sfxOsc('square', 520, 380, .05, .018, t + .28);
    },
    carEngine() {
      /* Fiat Tipo (Pescara by Night): ONE-SHOT, nessun loop persistente da fermare.
         Avvio + due sgasate, ~0.7s, sotto il volume degli altri SFX. */
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(42, t);
      o.frequency.linearRampToValueAtTime(96, t + .18);
      o.frequency.linearRampToValueAtTime(70, t + .34);
      o.frequency.linearRampToValueAtTime(150, t + .5);
      o.frequency.linearRampToValueAtTime(90, t + .62);
      const lfo = this.ctx.createOscillator();
      lfo.type = 'square'; lfo.frequency.value = 26;
      const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 16;
      lfo.connect(lfoGain); lfoGain.connect(o.frequency);
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 640; f.Q.value = 2.2;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(.0001, t);
      g.gain.linearRampToValueAtTime(.055, t + .06);
      g.gain.setValueAtTime(.05, t + .5);
      g.gain.exponentialRampToValueAtTime(.0001, t + .68);
      o.connect(f); f.connect(g); g.connect(this.sfxGain);
      o.start(t); lfo.start(t); o.stop(t + .7); lfo.stop(t + .7);
      this._sfxNoise(.08, .028, 320, 'lowpass', t);
    },
    spritz() {
      /* Spritz: bolle che salgono, frizzio e ghiaccio nel bicchiere. */
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      for (let i = 0; i < 6; i++) {
        const f = 420 + Math.random() * 520;
        this._sfxOsc('sine', f, f * 1.6, .05 + Math.random() * .04, .02, t + i * .045);
      }
      this._sfxNoise(.3, .03, 5600, 'highpass', t);
      this._sfxOsc('triangle', 240, 120, .16, .018, t + .04);
    },
    cesareStamp() {
      /* Timbro di Cesare: colpo secco, carta e rimbombo "imperiale". */
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      this._sfxNoise(.05, .055, 900, 'bandpass', t);
      this._sfxOsc('sine', 150, 42, .3, .075, t);
      this._sfxOsc('sawtooth', 120, 36, .18, .028, t + .02);
      this._sfxNoise(.14, .028, 2200, 'highpass', t + .06);
    },
    ursulaRegulation() {
      /* Regolamento UE di Ursula: carta che si apre + timbro burocratico + sospiro. */
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      this._sfxNoise(.22, .035, 2500, 'highpass', t);
      this._sfxOsc('sine', 130, 50, .26, .055, t + .12);
      this._sfxOsc('square', 740, 560, .1, .02, t + .16);
      this._sfxOsc('triangle', 520, 330, .18, .022, t + .26);
    },
    gameOver() {
      this.stopMusic();
      this._stopVoice(true);
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      [392, 349, 311, 262, 196].forEach((f, i) => this._sfxOsc('square', f, f * .98, .26, .05, t + i * .19));
      this._sfxOsc('triangle', 196, 60, 1.3, .06, t + .85);
    },
    victory() {
      this.setScene('victory');
    }
  };

  Sound.init();
})();

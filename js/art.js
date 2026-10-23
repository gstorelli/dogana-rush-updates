/* DOGANA RUSH: PORTO FRANCO — pixel art engine
   Tutte le grafiche sono disegnate proceduralmente e quantizzate su una palette 32-bit. */
(function () {
  'use strict';

  // Compatibilità per browser più datati: il disegno delle armature usa roundRect.
  if (window.CanvasRenderingContext2D && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      const rr = Math.min(typeof r === 'number' ? r : 0, Math.abs(w) / 2, Math.abs(h) / 2);
      this.moveTo(x + rr, y);
      this.lineTo(x + w - rr, y);
      this.quadraticCurveTo(x + w, y, x + w, y + rr);
      this.lineTo(x + w, y + h - rr);
      this.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
      this.lineTo(x + rr, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - rr);
      this.lineTo(x, y + rr);
      this.quadraticCurveTo(x, y, x + rr, y);
      return this;
    };
  }

  const A = window.Art = {};
  A.W = 640;
  A.H = 360;
  A.GROUND = 306;

  const TAU = Math.PI * 2;
  const R = Math.random;

  /* ---------------- palette ---------------- */
  const PALETTE = [
    '#0b0812', '#120b17', '#1a1222', '#26182f', '#3a2343', '#4d2c4e',
    '#fffdf2', '#fff8e7', '#f5e9cc', '#e6d5b0', '#cbb98e', '#9e8c68',
    '#ffe7c6', '#ffd5ad', '#f6c7a3', '#e7a67d', '#cb7c5f', '#9a514e',
    '#6f3542', '#ffbfd8', '#ff90b8', '#ff5b9d', '#ef367f', '#c62265',
    '#8f154d', '#5a0c30',
    '#fff3a6', '#ffe165', '#ffc84b', '#efa72f', '#c87b1e', '#8d5016',
    '#5c3415', '#38220f',
    '#667a8e', '#48576e', '#2e3a50', '#1d2538', '#13202f',
    '#7eb6d9', '#4f91bd', '#2d648c', '#1d4467', '#122d49',
    '#73c8d4', '#3ba4b9', '#217a91', '#153f54',
    '#a9e7d1', '#51c7a9', '#2b8e82', '#17655f', '#0d4444',
    '#f2fbff', '#d9f0f5', '#b8dce7',
    '#8eef7c', '#5ac457', '#2f8a3f', '#1c562a',
    '#ff845d', '#d54c42', '#9d2833', '#66192a',
    '#c598e0', '#9c62c8', '#6e3e8f', '#4b2a63', '#2e1a3f',
    '#a6b0d8', '#7280b3', '#4a5589', '#30375c',
    '#5b6fa8', '#3f528a', '#293a6b', '#1a264a',
    '#8777b5', '#624d94', '#443067', '#2b1e47',
    '#cfe3ff', '#9fc1ea', '#6e8dbb', '#4a678f',
    '#ffcf94', '#e59e5d', '#b5683c', '#78402b',
    '#d4e5ee', '#93aab8', '#657a8b', '#41505f',
    '#e8d6ff', '#ba9ae0'
  ];
  const PAL_RGB = PALETTE.map(hexToRgb);
  A.PALETTE = PALETTE;
  A.C = {
    ink: '#0b0812', ink2: '#1a1222', cream: '#fff8e7', paper: '#f5e9cc',
    pink: '#ff5b9d', pinkHi: '#ff90b8', pinkDark: '#c62265', red: '#ef367f',
    gold: '#ffc84b', goldDark: '#efa72f', hair: '#ffe165', hairHi: '#fff3a6',
    skin: '#ffd5ad', skinDark: '#e7a67d', denim: '#5b6fa8', denimDark: '#3f528a',
    white: '#fffdf2', shadow: '#22304a', teal: '#51c7a9', purple: '#9c62c8',
    orange: '#ff845d', sea: '#3ba4b9', stone: '#e6d5b0'
  };

  function hexToRgb(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /* ---------------- basic canvas helpers ---------------- */
  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    return c;
  }
  A.canvas = canvas;

  function rect(c, x, y, w, h, color) {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function ellipse(c, x, y, rx, ry, color) {
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, TAU);
    c.fillStyle = color;
    c.fill();
  }
  function circle(c, x, y, r, color) {
    ellipse(c, x, y, r, r, color);
  }
  function line(c, x1, y1, x2, y2, color, width) {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
  }
  function poly(c, pts, color) {
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath();
    c.fillStyle = color;
    c.fill();
  }
  function outlinedPoly(c, pts, fill, outline, width = 2.4) {
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath();
    c.lineJoin = 'round';
    c.strokeStyle = outline;
    c.lineWidth = width;
    c.stroke();
    c.fillStyle = fill;
    c.fill();
  }
  function blob(c, x, y, rx, ry, fill, outline, width = 2) {
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, TAU);
    c.fillStyle = fill;
    c.fill();
    if (outline) {
      c.strokeStyle = outline;
      c.lineWidth = width;
      c.stroke();
    }
  }
  function outlinedLimb(c, x1, y1, x2, y2, width, fill, outline) {
    line(c, x1, y1, x2, y2, outline, width + 2.6);
    line(c, x1, y1, x2, y2, fill, width);
  }
  function heartShape(c, x, y, s, color, rot = 0) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.beginPath();
    c.moveTo(0, s * .35);
    c.bezierCurveTo(-s * .9, -s * .35, -s * .55, -s, 0, -s * .45);
    c.bezierCurveTo(s * .55, -s, s * .9, -s * .35, 0, s * .35);
    c.closePath();
    c.fillStyle = color;
    c.fill();
    c.restore();
  }
  A.heartShape = heartShape;

  const QUANT_CACHE = new Map();
  function quantize(c, palette = PAL_RGB) {
    const w = c.width, h = c.height;
    const ctx = c.getContext('2d');
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 100) { d[i + 3] = 0; continue; }
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const key = (r << 16) | (g << 8) | b;
      let packed = QUANT_CACHE.get(key);
      if (packed === undefined) {
        let best = 0, bd = 1e12;
        for (let p = 0; p < palette.length; p++) {
          const pc = palette[p];
          const dr = r - pc[0], dg = g - pc[1], db = b - pc[2];
          const dist = dr * dr + dg * dg + db * db;
          if (dist < bd) { bd = dist; best = p; if (dist < 3) break; }
        }
        const col = palette[best];
        packed = (col[0] << 16) | (col[1] << 8) | col[2];
        QUANT_CACHE.set(key, packed);
      }
      d[i] = (packed >> 16) & 255;
      d[i + 1] = (packed >> 8) & 255;
      d[i + 2] = packed & 255;
      d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }
  A.quantize = quantize;

  function silhouette(src, color) {
    const c = canvas(src.width, src.height);
    const x = c.getContext('2d');
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = color;
    x.fillRect(0, 0, c.width, c.height);
    return c;
  }
  A.silhouette = silhouette;

  /* ---------------- ADELE — construction ---------------- */
  const PLAYER_W = 96, PLAYER_H = 96, PLAYER_AX = 48, PLAYER_AY = 90;
  A.PLAYER = { w: PLAYER_W, h: PLAYER_H, ax: PLAYER_AX, ay: PLAYER_AY };

  function drawHairBack(c, sway, bob) {
    const s = sway;
    c.save();
    c.translate(0, bob * .3);
    // Silhouette a onde, non un casco: ciocche distinte sul dietro.
    c.beginPath();
    c.moveTo(45, 12);
    c.bezierCurveTo(36, 11, 29, 16, 28, 25);
    c.bezierCurveTo(24, 30, 23, 37, 26, 42);
    c.bezierCurveTo(21 + s * .7, 47, 22 + s, 53, 27 + s, 58);
    c.bezierCurveTo(25 + s * .8, 62, 28 + s * .6, 67, 33 + s * .5, 67);
    c.bezierCurveTo(35 + s * .3, 61, 38, 58, 42, 58);
    c.lineTo(57, 59);
    c.bezierCurveTo(62 + s * .3, 55, 66 + s * .4, 51, 66 + s * .2, 45);
    c.bezierCurveTo(71 + s * .4, 40, 70, 31, 65, 24);
    c.bezierCurveTo(62, 16, 54, 10, 45, 12);
    c.closePath();
    c.fillStyle = '#b5683c';
    c.fill();
    c.strokeStyle = '#0b0812';
    c.lineWidth = 2.5;
    c.lineJoin = 'round';
    c.stroke();

    // massa bionda
    c.beginPath();
    c.moveTo(45, 14);
    c.bezierCurveTo(37, 13, 31, 19, 31, 26);
    c.bezierCurveTo(27, 31, 27, 38, 29, 42);
    c.bezierCurveTo(25 + s * .4, 48, 27 + s * .6, 53, 31 + s * .4, 57);
    c.bezierCurveTo(31 + s * .3, 60, 33 + s * .2, 63, 36 + s * .2, 64);
    c.bezierCurveTo(37, 59, 40, 56, 44, 56);
    c.lineTo(57, 57);
    c.bezierCurveTo(61, 53, 64 + s * .2, 49, 63 + s * .1, 43);
    c.bezierCurveTo(67, 39, 66, 32, 62, 26);
    c.bezierCurveTo(59, 18, 52, 13, 45, 14);
    c.closePath();
    c.fillStyle = '#efa72f';
    c.fill();

    // ciocca centrale più chiara
    c.beginPath();
    c.moveTo(43, 15);
    c.bezierCurveTo(35, 18, 34, 27, 36, 34);
    c.bezierCurveTo(33, 40, 35, 46, 34, 51);
    c.bezierCurveTo(37, 49, 40, 52, 42, 57);
    c.lineTo(51, 57);
    c.bezierCurveTo(48, 48, 49, 40, 51, 34);
    c.bezierCurveTo(51, 25, 49, 17, 43, 15);
    c.closePath();
    c.fillStyle = '#ffe165';
    c.fill();

    // fasce e riflessi
    c.strokeStyle = '#f5c44a';
    c.lineWidth = 3.1;
    c.beginPath();
    c.moveTo(38, 18); c.bezierCurveTo(32, 24, 35, 33, 33, 41);
    c.stroke();
    c.strokeStyle = '#c87b1e';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(47, 17); c.bezierCurveTo(48, 27, 51, 36, 49, 47); c.lineTo(44, 56);
    c.stroke();
    c.beginPath();
    c.moveTo(58, 23); c.bezierCurveTo(62, 30, 61, 38, 59, 45); c.lineTo(53, 55);
    c.stroke();
    c.strokeStyle = '#fff3a6';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(37, 21); c.bezierCurveTo(33, 28, 37, 33, 35, 41);
    c.stroke();
    c.beginPath();
    c.moveTo(54, 18); c.bezierCurveTo(57, 22, 59, 27, 58, 31);
    c.stroke();

    // punte mosse
    line(c, 28 + s, 51, 29 + s, 58, '#0b0812', 5.2);
    line(c, 28 + s, 51, 29 + s, 58, '#ffe165', 2.8);
    line(c, 34, 62, 31 + s, 68, '#0b0812', 4.8);
    line(c, 34, 62, 31 + s, 68, '#efa72f', 2.5);
    line(c, 64, 42, 67 + s, 52, '#0b0812', 5.2);
    line(c, 64, 42, 67 + s, 52, '#f5c44a', 2.8);
    line(c, 61, 52, 64 + s, 61, '#0b0812', 4.2);
    line(c, 61, 52, 64 + s, 61, '#ffd860', 2);
    c.restore();
  }

  function drawBackLeg(c, x, y, kneeX, kneeY, ankleX, ankleY, flip) {
    outlinedLimb(c, x, y, kneeX, kneeY, 6.2, '#e7a67d', '#1a1222');
    outlinedLimb(c, kneeX, kneeY, ankleX, ankleY, 5.2, '#ffd5ad', '#1a1222');
    // shoe
    c.save();
    c.translate(ankleX, ankleY);
    c.beginPath();
    c.moveTo(-4, -1); c.lineTo(3, -1); c.lineTo(8, 3); c.lineTo(7, 5);
    c.lineTo(-4, 5); c.closePath();
    c.fillStyle = '#fffdf2'; c.fill();
    c.strokeStyle = '#1a1222'; c.lineWidth = 2.2; c.stroke();
    c.fillStyle = '#ff5b9d'; c.fillRect(-4, 3, 12, 2);
    c.restore();
  }

  function drawGun(c, hx, hy, weapon, angle, trigger, recoil) {
    c.save();
    c.translate(hx, hy);
    c.rotate(angle);
    c.translate(-recoil * 2, 0);
    if (weapon === 'mascara') {
      // giant mascara gatling: black bristle spool, silver wand, gold collar
      line(c, 0, 0, 15, 0, '#0b0812', 8);
      line(c, 1, 0, 15, 0, '#48576e', 5);
      // casing
      rect(c, 8, -5, 12, 10, '#1a1222');
      rect(c, 9, -4, 10, 8, '#2d648c');
      rect(c, 11, -4, 2, 8, '#7eb6d9');
      rect(c, 17, -5, 4, 10, '#ffc84b');
      rect(c, 20, -4, 2, 8, '#8d5016');
      // giant brush head
      c.beginPath();
      c.ellipse(26, 0, 9, 7, 0, 0, TAU);
      c.fillStyle = '#0b0812'; c.fill();
      c.beginPath();
      c.ellipse(27, 0, 8, 6, 0, 0, TAU);
      c.fillStyle = '#1a1222'; c.fill();
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * TAU;
        line(c, 25 + Math.cos(a) * 4, Math.sin(a) * 3, 25 + Math.cos(a) * 11, Math.sin(a) * 9, i % 3 ? '#1a1222' : '#4d2c4e', 2.4);
      }
      line(c, 20, -4, 33, 4, '#7280b3', 1.4);
      // tiny heart charm
      heartShape(c, 12, 6, 2.5, '#ff5b9d');
      // muzzle
      rect(c, 31, -3, 3, 6, '#ff5b9d');
    } else {
      // lipstick pistol
      line(c, 0, 0, 10, 0, '#0b0812', 8);
      line(c, 0, 0, 10, 0, '#ffd5ad', 5);
      // grip and barrel
      c.beginPath();
      c.moveTo(4, -1); c.lineTo(13, -2); c.lineTo(14, 2); c.lineTo(5, 3); c.closePath();
      c.fillStyle = '#ffc84b'; c.fill();
      c.strokeStyle = '#38220f'; c.lineWidth = 1.4; c.stroke();
      rect(c, 12, -4, 8, 8, '#fffdf2');
      rect(c, 13, -3, 6, 6, '#f5e9cc');
      rect(c, 18, -4, 3, 8, '#ffc84b');
      // lipstick cartridge
      rect(c, 20, -3, 5, 6, '#ff5b9d');
      rect(c, 21, -3, 2, 6, '#ff90b8');
      c.beginPath();
      c.moveTo(25, -3); c.lineTo(31, -1); c.lineTo(31, 2); c.lineTo(25, 3); c.closePath();
      c.fillStyle = '#ef367f'; c.fill();
      c.strokeStyle = '#5a0c30'; c.lineWidth = 1.5; c.stroke();
      rect(c, 29, -1, 2, 2, '#fff3a6');
      if (trigger) rect(c, 9, 4, 2, 4, '#ffc84b');
    }
    c.restore();
  }

  function drawArmFront(c, sx, sy, hx, hy, elbowX, elbowY, bracelets = true) {
    outlinedLimb(c, sx, sy, elbowX, elbowY, 5.7, '#ffd5ad', '#1a1222');
    outlinedLimb(c, elbowX, elbowY, hx, hy, 4.8, '#f6c7a3', '#1a1222');
    if (bracelets) {
      line(c, elbowX + (hx - elbowX) * .45, elbowY + (hy - elbowY) * .45, elbowX + (hx - elbowX) * .58, elbowY + (hy - elbowY) * .58, '#2d648c', 3.8);
      line(c, elbowX + (hx - elbowX) * .62, elbowY + (hy - elbowY) * .62, elbowX + (hx - elbowX) * .74, elbowY + (hy - elbowY) * .74, '#d4e5ee', 2.5);
      line(c, elbowX + (hx - elbowX) * .77, elbowY + (hy - elbowY) * .77, elbowX + (hx - elbowX) * .87, elbowY + (hy - elbowY) * .87, '#ffc84b', 2.1);
    }
    circle(c, hx, hy, 3.2, '#ffd5ad');
    c.strokeStyle = '#1a1222'; c.lineWidth = 1.4; c.beginPath(); c.arc(hx, hy, 3.2, 0, TAU); c.stroke();
  }

  function paintAdele(opts) {
    const o = Object.assign({
      mode: 'idle', phase: 0, weapon: 'lipstick', aimUp: false, aimDown: false, recoil: 0
    }, opts || {});
    const c = canvas(PLAYER_W, PLAYER_H);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const crouch = o.mode === 'crouch';
    const jump = o.mode === 'jump';
    const run = o.mode === 'run';
    const t = o.phase || 0;
    const runSin = run ? Math.sin(t * TAU) : 0;
    const bobRaw = run ? Math.abs(Math.sin(t * TAU)) * 1.4 : Math.sin(t * TAU) * .55;
    const bob = crouch ? 13 : bobRaw;
    const sway = run ? Math.sin(t * TAU + .7) * 1.5 : Math.sin(t * TAU * .8) * .8;
    const lean = run ? 1.4 : (jump ? -1 : 0);
    const baseY = 87 - bob;

    g.save();
    g.translate(0, bob * .22);

    /* back hair first */
    drawHairBack(g, sway, bob);

    /* back leg */
    let backFootX = 44, backFootY = 86;
    let frontFootX = 54, frontFootY = 86;
    if (run) {
      backFootX = 46 + runSin * 7;
      backFootY = 86 - Math.max(0, runSin) * 9;
      frontFootX = 52 - runSin * 7;
      frontFootY = 86 - Math.max(0, -runSin) * 9;
    } else if (jump) {
      backFootX = 43; backFootY = 82;
      frontFootX = 57; frontFootY = 77;
    } else if (crouch) {
      backFootX = 38; backFootY = 87;
      frontFootX = 58; frontFootY = 87;
    }
    drawBackLeg(g, 44, 60 + (crouch ? 11 : 0), 42 + (run ? runSin * 3 : 0), 73, backFootX, backFootY);

    /* torso and hip */
    const hipY = 60 + (crouch ? 10 : 0);
    const shoulderY = 41 + (crouch ? 12 : 0) + bob * .2;
    const torsoLean = lean;
    // neck
    line(g, 49 + torsoLean, shoulderY - 5, 49, shoulderY + 2, '#e7a67d', 5.2);

    // denim skirt
    g.beginPath();
    g.moveTo(40 + torsoLean, hipY - 5);
    g.lineTo(58 + torsoLean, hipY - 5);
    g.lineTo(62 + torsoLean + sway * .5, hipY + 9);
    g.lineTo(56 + torsoLean, hipY + 13);
    g.lineTo(52 + torsoLean, hipY + 10);
    g.lineTo(47 + torsoLean, hipY + 14);
    g.lineTo(37 + torsoLean - sway * .3, hipY + 8);
    g.closePath();
    g.fillStyle = '#5b6fa8'; g.fill();
    g.strokeStyle = '#0b0812'; g.lineWidth = 2.1; g.stroke();
    // skirt shade and stitch
    g.fillStyle = '#3f528a';
    g.fillRect(40 + torsoLean, hipY + 1, 4, 7);
    g.fillRect(56 + torsoLean, hipY + 2, 3, 7);
    g.fillStyle = '#9fc1ea';
    g.fillRect(44 + torsoLean, hipY - 3, 11, 1);
    // belt
    rect(g, 39 + torsoLean, hipY - 6, 20, 4, '#38220f');
    for (let i = 0; i < 5; i++) rect(g, 41 + torsoLean + i * 4, hipY - 5, 1, 2, '#ffc84b');
    rect(g, 47 + torsoLean, hipY - 7, 4, 5, '#d8952a');
    rect(g, 48 + torsoLean, hipY - 6, 2, 3, '#38220f');
    // leg fronts cover skirt partly
    if (crouch) {
      outlinedLimb(g, 43, 70, 39, 80, 7, '#e7a67d', '#1a1222');
      outlinedLimb(g, 39, 80, 37, 87, 5.4, '#ffd5ad', '#1a1222');
      outlinedLimb(g, 54, 71, 61, 79, 7, '#f6c7a3', '#1a1222');
      outlinedLimb(g, 61, 79, 58, 87, 5.4, '#ffd5ad', '#1a1222');
      rect(g, 32, 85, 12, 4, '#fffdf2');
      rect(g, 32, 87, 12, 2, '#ff5b9d');
      rect(g, 53, 85, 13, 4, '#fffdf2');
      rect(g, 53, 87, 13, 2, '#ff5b9d');
    } else {
      // front leg
      outlinedLimb(g, 53, hipY + 4, 55 + (run ? -runSin * 2 : 0), 73, 7.1, '#f6c7a3', '#1a1222');
      outlinedLimb(g, 55 + (run ? -runSin * 2 : 0), 73, frontFootX, frontFootY, 5.6, '#ffd5ad', '#1a1222');
      // thigh highlight
      line(g, 50, hipY + 7, 52, 70, '#ffd5ad', 1.2);
      // shoe
      g.save();
      g.translate(frontFootX, frontFootY);
      g.beginPath();
      g.moveTo(-4, -1); g.lineTo(3, -1); g.lineTo(9, 3); g.lineTo(8, 6);
      g.lineTo(-4, 6); g.closePath();
      g.fillStyle = '#fffdf2'; g.fill();
      g.strokeStyle = '#0b0812'; g.lineWidth = 2.2; g.stroke();
      g.fillStyle = '#ff5b9d'; g.fillRect(-4, 4, 13, 2);
      g.fillStyle = '#f5e9cc'; g.fillRect(-2, 1, 4, 1);
      g.restore();
    }

    /* torso top — white ruched crop top */
    g.save();
    g.translate(torsoLean, 0);
    const topBottom = hipY - 5;
    g.beginPath();
    g.moveTo(38, shoulderY + 2);
    g.bezierCurveTo(34, shoulderY + 9, 37, topBottom - 3, 39, topBottom);
    g.lineTo(59, topBottom);
    g.bezierCurveTo(61, topBottom - 5, 64, shoulderY + 9, 61, shoulderY + 2);
    g.closePath();
    g.fillStyle = '#fffdf2'; g.fill();
    g.strokeStyle = '#0b0812'; g.lineWidth = 2.1; g.stroke();
    // shadows
    g.fillStyle = '#e6d5b0';
    g.beginPath(); g.moveTo(39, topBottom); g.lineTo(46, topBottom); g.lineTo(44, shoulderY + 7); g.lineTo(38, shoulderY + 9); g.closePath(); g.fill();
    g.fillStyle = '#f5e9cc';
    g.fillRect(50, shoulderY + 4, 3, topBottom - shoulderY - 7);
    // ruched gathers
    for (let i = 0; i < 5; i++) {
      const xx = 42 + i * 4;
      g.strokeStyle = '#cbb98e'; g.lineWidth = .8;
      g.beginPath(); g.moveTo(xx, shoulderY + 5); g.lineTo(xx - 1, topBottom - 2); g.stroke();
    }
    // neckline and ruffle
    g.beginPath();
    g.moveTo(43, shoulderY + 1);
    g.quadraticCurveTo(49, shoulderY + 6, 56, shoulderY);
    g.strokeStyle = '#9e8c68'; g.lineWidth = 1.1; g.stroke();
    for (let i = 0; i < 6; i++) {
      circle(g, 40 + i * 3.4, topBottom + (i % 2 ? 1 : 0), 1.8, '#fffdf2');
      circle(g, 40 + i * 3.4, topBottom + (i % 2 ? 1 : 0), 1.8, 'transparent');
    }
    // puff sleeves
    function sleeve(x, y, w, h, dir) {
      g.beginPath();
      g.ellipse(x, y, w, h, dir * .2, 0, TAU);
      g.fillStyle = '#fffdf2'; g.fill();
      g.strokeStyle = '#0b0812'; g.lineWidth = 2; g.stroke();
      g.beginPath();
      g.ellipse(x + dir * 1, y + 2, w * .7, h * .45, dir * .25, 0, TAU);
      g.fillStyle = '#f5e9cc'; g.fill();
      g.strokeStyle = '#cbb98e'; g.lineWidth = .9;
      g.beginPath(); g.arc(x, y + h * .2, w * .6, .1, Math.PI - .1); g.stroke();
      for (let i = 0; i < 3; i++) {
        line(g, x - w * .6 + i * w * .42, y + h * .55, x - w * .5 + i * w * .4, y + h * .85, '#cbb98e', .8);
      }
    }
    sleeve(60, shoulderY + 7, 7.5, 8, 1);
    sleeve(37, shoulderY + 8, 6.3, 7, -1);
    // necklace pearls
    for (let i = 0; i < 7; i++) {
      const a = -2.8 + i * .55;
      circle(g, 49 + Math.cos(a) * 9.5, shoulderY + Math.sin(a) * 4.4 + 1.4, 1.25, '#fffdf2');
      circle(g, 49 + Math.cos(a) * 9.5, shoulderY + Math.sin(a) * 4.4 + 1.4, .55, '#e6d5b0');
    }
    g.restore();

    /* head */
    g.save();
    g.translate(torsoLean, 0);
    const headY = shoulderY - 12 + (jump ? -1 : 0);
    // collo e girocollo
    rect(g, 45, shoulderY - 5, 7, 7, '#e7a67d');
    rect(g, 45, shoulderY - 5, 2, 7, '#cb7c5f');
    // orecchie e orecchini grandi (dietro al viso)
    circle(g, 39.5, headY + 2.5, 3.1, '#e7a67d');
    circle(g, 59.5, headY + 2.5, 3.1, '#e7a67d');
    for (const ex of [37.8, 61.2]) {
      g.strokeStyle = '#0b0812'; g.lineWidth = 4.8;
      g.beginPath(); g.arc(ex, headY + 9, 5.2, -.1, 3.2); g.stroke();
      g.strokeStyle = '#ffc84b'; g.lineWidth = 2.7;
      g.beginPath(); g.arc(ex, headY + 9, 5.2, -.1, 3.2); g.stroke();
      g.strokeStyle = '#fff3a6'; g.lineWidth = .9;
      g.beginPath(); g.arc(ex, headY + 9, 5.8, .1, 2.0); g.stroke();
    }
    // viso
    g.beginPath();
    g.moveTo(40.2, headY - 4);
    g.bezierCurveTo(41.5, headY - 11.5, 50, headY - 13.5, 55.5, headY - 10);
    g.bezierCurveTo(60, headY - 7, 61.2, headY - 1, 59.2, headY + 4);
    g.bezierCurveTo(57.2, headY + 9.5, 52.5, headY + 12, 48, headY + 10.8);
    g.bezierCurveTo(43, headY + 9.5, 39.4, headY + 5, 40.2, headY - 4);
    g.closePath();
    g.fillStyle = '#ffd5ad'; g.fill();
    g.strokeStyle = '#1a1222'; g.lineWidth = 2.0; g.stroke();
    // ombreggiatura morbida guance/mascella
    g.fillStyle = '#f6c7a3';
    g.beginPath(); g.ellipse(45, headY + 3, 5.5, 6.5, -.15, 0, TAU); g.fill();
    g.fillStyle = '#e7a67d';
    g.fillRect(43, headY + 8, 4, 2);
    rect(g, 51, headY + 9, 4, 1, '#cb7c5f');
    // ciuffo laterale sinistro
    g.beginPath();
    g.moveTo(43, headY - 8);
    g.bezierCurveTo(36, headY - 8, 34, headY + 1, 37, headY + 9);
    g.bezierCurveTo(33, headY + 15, 37, headY + 23, 34, headY + 29);
    g.bezierCurveTo(38, headY + 26, 40, headY + 28, 42, headY + 31);
    g.bezierCurveTo(42, headY + 22, 45, headY + 14, 43, headY + 8);
    g.bezierCurveTo(42, headY + 3, 41, headY - 3, 43, headY - 8);
    g.closePath();
    g.fillStyle = '#f5c44a'; g.fill();
    g.strokeStyle = '#5c3415'; g.lineWidth = 1.15; g.stroke();
    line(g, 38.5, headY + 3, 37.5, headY + 17, '#ffe165', 1.3);
    line(g, 40.5, headY - 6, 40, headY + 2, '#fff3a6', 1);
    // frangia mossa sulla fronte
    g.beginPath();
    g.moveTo(39, headY - 5);
    g.bezierCurveTo(40, headY - 12, 49, headY - 15, 57, headY - 9);
    g.bezierCurveTo(61, headY - 6, 61, headY - 2, 58, headY - 1);
    g.bezierCurveTo(57, headY - 5, 54, headY - 6.5, 51, headY - 5);
    g.bezierCurveTo(49, headY - 3, 45, headY - 3.5, 44, headY - 6.5);
    g.bezierCurveTo(43, headY - 3, 42, headY - 1, 41, headY + 1);
    g.closePath();
    g.fillStyle = '#ffe165'; g.fill();
    g.strokeStyle = '#5c3415'; g.lineWidth = 1.1; g.stroke();
    g.beginPath();
    g.moveTo(44, headY - 10);
    g.quadraticCurveTo(50, headY - 13, 55, headY - 9);
    g.strokeStyle = '#fff3a6'; g.lineWidth = 1.7; g.stroke();
    line(g, 46, headY - 12, 53, headY - 11, '#fff8d7', 1);
    // sopracciglia
    line(g, 44, headY - 3.2, 49, headY - 4, '#8d5016', 1.2);
    line(g, 52.5, headY - 4, 57, headY - 3, '#8d5016', 1.15);
    // occhi grandi con ombretto rosa
    g.fillStyle = '#ff90b8';
    g.fillRect(43.7, headY - 2.8, 5.2, 2.2);
    g.fillRect(52.2, headY - 2.8, 5.3, 2.2);
    g.fillStyle = '#fffdf2';
    g.fillRect(44.2, headY - 1.3, 4.1, 2.6);
    g.fillRect(52.7, headY - 1.3, 4.3, 2.6);
    g.fillStyle = '#2d648c';
    g.fillRect(45.4, headY - .9, 1.9, 2);
    g.fillRect(54.2, headY - .9, 1.9, 2);
    g.fillStyle = '#0b0812';
    g.fillRect(46, headY - .5, .9, 1.2);
    g.fillRect(54.8, headY - .5, .9, 1.2);
    g.fillStyle = '#fff8e7';
    g.fillRect(45.6, headY - .8, .7, .7);
    g.fillRect(54.4, headY - .8, .7, .7);
    // ciglia
    line(g, 43.8, headY - 1.2, 42.6, headY - 2.4, '#1a1222', .9);
    line(g, 57.2, headY - 1.2, 58.3, headY - 2.5, '#1a1222', .9);
    // naso
    line(g, 57.3, headY + 1, 58.2, headY + 4, '#cb7c5f', 1.05);
    rect(g, 57.6, headY + 4, 1.2, .8, '#9a514e');
    // rossetto acceso e stanghetta morsa
    g.beginPath();
    g.moveTo(50.8, headY + 6.7);
    g.quadraticCurveTo(53, headY + 5.2, 55.1, headY + 6);
    g.quadraticCurveTo(57.2, headY + 5.4, 58.8, headY + 6.9);
    g.quadraticCurveTo(55.8, headY + 10.3, 52.4, headY + 9.6);
    g.quadraticCurveTo(50.4, headY + 8.9, 50.8, headY + 6.7);
    g.closePath();
    g.fillStyle = '#ef367f'; g.fill();
    g.strokeStyle = '#66192a'; g.lineWidth = .8; g.stroke();
    g.fillStyle = '#ffbfd8';
    g.fillRect(52.3, headY + 7, 3.5, .8);
    rect(g, 53.6, headY + 7.9, 2.2, .5, '#fff8e7');
    g.fillStyle = '#5a0c30';
    g.fillRect(51.5, headY + 8.2, 3, .6);
    // blush
    circle(g, 47.5, headY + 4.5, 1.5, '#ff90b8');
    // occhiali: montatura leggera e tempia verso la bocca
    g.strokeStyle = '#4d2c4e'; g.lineWidth = 1.05;
    g.beginPath(); g.roundRect(43, headY - 3.2, 6.3, 5.1, 1.1); g.stroke();
    g.beginPath(); g.roundRect(51.8, headY - 3.2, 6.4, 5.1, 1.1); g.stroke();
    g.beginPath(); g.moveTo(49.3, headY - 1.1); g.quadraticCurveTo(50.5, headY - 2.2, 51.8, headY - 1.1); g.stroke();
    g.strokeStyle = '#38220f'; g.lineWidth = 1.25;
    g.beginPath();
    g.moveTo(58.2, headY - 1.5);
    g.lineTo(60, headY + .5);
    g.quadraticCurveTo(59.8, headY + 3.4, 58.5, headY + 6.7);
    g.stroke();
    g.fillStyle = '#ffc84b'; g.fillRect(59, headY - .6, 2.4, 1);
    // riflessi lenti
    g.fillStyle = '#f2fbff';
    g.fillRect(43.9, headY - 2.4, 1.1, .9);
    g.fillRect(52.7, headY - 2.4, 1.1, .9);
    g.fillStyle = '#f6c7a3';
    g.fillRect(50, headY + 2.5, 5.5, 1);
    // girocollo di perle
    for (let i = 0; i < 3; i++) {
      circle(g, 45.5 + i * 3.2, shoulderY - 2.5 + Math.abs(i - 1) * .8, 1.35, '#fff8e7');
      circle(g, 45.5 + i * 3.2, shoulderY - 2.5 + Math.abs(i - 1) * .8, 1.35, '#e6d5b0');
      circle(g, 45.2 + i * 3.2, shoulderY - 2.9 + Math.abs(i - 1) * .8, .45, '#fffdf2');
    }
    g.restore();

    /* front arm + weapon */
    g.save();
    g.translate(torsoLean, 0);
    let sx = 59, sy = shoulderY + 9;
    let hx, hy, ex, ey;
    if (crouch) {
      hx = 72; hy = shoulderY + 21; ex = 65; ey = shoulderY + 17;
    } else if (jump) {
      hx = 72; hy = shoulderY + 7; ex = 66; ey = shoulderY + 10;
    } else if (run) {
      hx = 69 + Math.abs(runSin) * 2; hy = shoulderY + 14; ex = 64; ey = shoulderY + 13;
    } else {
      hx = 70; hy = shoulderY + 14; ex = 65; ey = shoulderY + 14;
    }
    let gunAngle = 0;
    if (o.aimUp) {
      hx = 64; hy = shoulderY - 1; ex = 61; ey = shoulderY + 8;
      gunAngle = -Math.PI / 2;
    } else if (o.aimDown) {
      hx = 68; hy = shoulderY + 20; ex = 64; ey = shoulderY + 18;
      gunAngle = .38;
    }
    drawArmFront(g, sx, sy, hx, hy, ex, ey);
    // micro hand / sleeve cuff
    circle(g, hx, hy, 2.8, '#ffd5ad');
    drawGun(g, hx + 1, hy, o.weapon, gunAngle, true, o.recoil);
    // bracelet sparkle
    rect(g, ex + 2, ey - 3, 1, 1, '#fff3a6');
    g.restore();

    /* small skirt sway highlight + bouncing hair over shoulders */
    g.restore();
    c.getContext('2d').imageSmoothingEnabled = false;
    quantize(c);
    return c;
  }

  /* =========================================================
     ADELE V2 — silhouette adulta, volto leggibile, pistola compatta
     ========================================================= */
  const A2 = {
    hairDark: '#c07a1c', hairBase: '#f5c44a', hairLight: '#ffe06a', hairHi: '#fff3a6',
    hairLine: '#4a2b18', skin: '#ffd5ad', skinShade: '#f0b98f', skinDeep: '#d99377',
    skinLine: '#5a3023', denim: '#4b6fa8', denimDark: '#34507e', denimLight: '#9fc1ea',
    top: '#fffdf2', topShade: '#e8dcc0', topDeep: '#cbb98e', lip: '#ef367f', lipDark: '#9c2451'
  };

  function hairLock(g, pts, base, shade, lineW = 1.9) {
    g.beginPath();
    g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 6) {
      g.bezierCurveTo(pts[i], pts[i + 1], pts[i + 2], pts[i + 3], pts[i + 4], pts[i + 5]);
    }
    g.closePath();
    g.fillStyle = base; g.fill();
    g.strokeStyle = A2.hairLine; g.lineWidth = lineW; g.lineJoin = 'round'; g.stroke();
    if (shade) {
      g.strokeStyle = shade; g.lineWidth = 1.1;
      g.beginPath();
      g.moveTo(pts[0] + 2, pts[1] + 5);
      g.quadraticCurveTo(pts[2] + 1, pts[3] + 6, pts[4] - 1, pts[5] - 2);
      g.stroke();
    }
  }

  function drawAdeleHairBack(g, sway, lift, run) {
    const s = sway;
    g.save();
    g.translate(0, lift);
    // mezza coda alta: corona dietro la testa
    hairLock(g, [
      42, 7, 35, 7, 32, 12, 33, 18,
      34, 24, 39, 26, 42, 24,
      42, 19, 43, 14, 48, 11,
      53, 13, 55, 19, 53, 24,
      57, 25, 61, 21, 60, 15,
      59, 9, 51, 5, 42, 7
    ], A2.hairBase, A2.hairDark, 1.7);
    // coda lunga e mossa, dietro la spalla sinistra
    g.beginPath();
    g.moveTo(37, 12);
    g.bezierCurveTo(30, 11, 25, 15, 25, 21);
    g.bezierCurveTo(25, 26, 20, 29, 20 + s * .7, 36);
    g.bezierCurveTo(20, 42, 23 + s * .5, 46, 21 + s, 51);
    g.bezierCurveTo(20 + s, 56, 24, 59, 29 + s * .3, 57);
    g.bezierCurveTo(33, 54, 32, 49, 30, 46);
    g.bezierCurveTo(34, 43, 36, 38, 34, 34);
    g.bezierCurveTo(38, 31, 40, 26, 38, 22);
    g.bezierCurveTo(42, 19, 41, 14, 37, 12);
    g.closePath();
    g.fillStyle = A2.hairBase; g.fill();
    g.strokeStyle = A2.hairLine; g.lineWidth = 1.8; g.lineJoin = 'round'; g.stroke();
    // ciocca esterna e ombre della coda
    g.beginPath();
    g.moveTo(34, 14);
    g.bezierCurveTo(27, 18, 27, 25, 23, 30);
    g.bezierCurveTo(22, 36, 25, 40, 23, 45);
    g.strokeStyle = A2.hairDark; g.lineWidth = 2; g.lineCap = 'round'; g.stroke();
    g.strokeStyle = A2.hairLight; g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(31, 14);
    g.bezierCurveTo(27, 20, 29, 26, 25, 32);
    g.bezierCurveTo(23, 38, 26, 43, 25, 49);
    g.stroke();
    g.strokeStyle = A2.hairHi; g.lineWidth = 1;
    g.beginPath();
    g.moveTo(35, 15);
    g.bezierCurveTo(31, 22, 34, 30, 30, 38);
    g.bezierCurveTo(29, 44, 31, 50, 28, 55);
    g.stroke();
    // ciuffo folto sopra la nuca
    hairLock(g, [
      41, 7, 35, 8, 33, 13, 36, 17,
      40, 18, 44, 14, 47, 9,
      45, 5, 43, 5, 41, 7
    ], A2.hairLight, A2.hairDark, 1.2);
    // elastico / fermaglio
    g.strokeStyle = '#5a0c30'; g.lineWidth = 3.2;
    g.beginPath(); g.arc(37.4, 14.4, 3.2, -.4, 2.6); g.stroke();
    g.strokeStyle = '#ff5b9d'; g.lineWidth = 1.9;
    g.beginPath(); g.arc(37.4, 14.4, 3.2, -.4, 2.6); g.stroke();
    g.strokeStyle = '#ffbfd8'; g.lineWidth = .6;
    g.beginPath(); g.arc(37.4, 14.4, 3.7, .2, 1.4); g.stroke();
    // ciuffo sciolto sul lato destro del collo
    g.beginPath();
    g.moveTo(55, 16);
    g.bezierCurveTo(61, 19, 62, 26, 60, 31);
    g.bezierCurveTo(59, 34, 57, 34, 56, 31);
    g.bezierCurveTo(58, 27, 57, 21, 54, 18);
    g.closePath();
    g.fillStyle = A2.hairLight; g.fill();
    g.strokeStyle = A2.hairLine; g.lineWidth = 1.2; g.stroke();
    // punte e riflessi
    line(g, 29 + s * .3, 57, 27 + s, 61, A2.hairLine, 3.0);
    line(g, 29 + s * .3, 57, 28 + s, 60, A2.hairLight, 1.5);
    line(g, 25 + s, 52, 22 + s, 56, A2.hairBase, 1.8);
    g.strokeStyle = A2.hairHi; g.lineWidth = .9;
    g.beginPath(); g.moveTo(43, 9); g.bezierCurveTo(40, 13, 42, 17, 45, 20); g.stroke();
    g.restore();
  }

  function adeleLeg(g, hipX, hipY, kneeX, kneeY, ankleX, ankleY, back, footDir = 1) {
    const skin = back ? A2.skinShade : A2.skin;
    const skin2 = back ? '#e7a67d' : A2.skin;
    const outline = back ? '#3b2119' : A2.skinLine;
    outlinedLimb(g, hipX, hipY, kneeX, kneeY, back ? 7.5 : 8.3, skin, outline);
    outlinedLimb(g, kneeX, kneeY, ankleX, ankleY, back ? 5.7 : 6.1, skin2, outline);
    // ginocchio e polpaccio
    circle(g, kneeX, kneeY, back ? 2.9 : 3.3, skin);
    line(g, kneeX + (ankleX - kneeX) * .2, kneeY + 2, kneeX + (ankleX - kneeX) * .2 + .8, kneeY + 6, back ? '#d99377' : '#e7a67d', .8);
    // scarpa
    g.save();
    g.translate(ankleX, ankleY);
    g.rotate(footDir * .04);
    g.beginPath();
    g.moveTo(-3.5, -3); g.lineTo(2.5, -3); g.lineTo(7.5, .5); g.lineTo(6.8, 4.5); g.lineTo(-3.5, 4.5);
    g.closePath();
    g.fillStyle = back ? '#e8dcc0' : '#fffdf2'; g.fill();
    g.strokeStyle = '#1a1222'; g.lineWidth = 1.6; g.lineJoin = 'round'; g.stroke();
    g.fillStyle = '#ff5b9d'; g.fillRect(-3.5, 2.8, 10.8, 1.6);
    g.fillStyle = back ? '#e6d5b0' : '#f5e9cc'; g.fillRect(-2, 0, 3.5, 1);
    g.fillStyle = '#ffc84b'; g.fillRect(2.3, .8, 1.7, .9);
    g.restore();
  }

  function adeleSkirt(g, hipY, sway) {
    const y0 = hipY - 5;
    g.beginPath();
    g.moveTo(40.5, y0);
    g.lineTo(57, y0);
    g.lineTo(61 + sway * .4, y0 + 9);
    g.quadraticCurveTo(52, y0 + 13.2, 36.5 + sway * .2, y0 + 9.4);
    g.lineTo(39.5, y0 + 2);
    g.closePath();
    g.fillStyle = A2.denim; g.fill();
    g.strokeStyle = '#1a1222'; g.lineWidth = 1.7; g.lineJoin = 'round'; g.stroke();
    // ombre e cuciture
    g.fillStyle = A2.denimDark;
    g.beginPath(); g.moveTo(41.5, y0 + 1); g.lineTo(45.5, y0 + 1); g.lineTo(38.5, y0 + 7); g.lineTo(37.2, y0 + 7); g.closePath(); g.fill();
    g.fillStyle = '#5d80b9';
    g.fillRect(43, y0 + 2.8, 12, 1);
    g.strokeStyle = A2.denimLight; g.lineWidth = .7;
    g.beginPath(); g.moveTo(40.5, y0 + 2); g.lineTo(39.5, y0 + 8.5); g.stroke();
    g.beginPath(); g.moveTo(56.6, y0 + 1); g.lineTo(58.5, y0 + 7); g.stroke();
    g.beginPath(); g.moveTo(44, y0 + 10.5); g.quadraticCurveTo(50, y0 + 12, 56, y0 + 9); g.stroke();
    // spacco laterale
    g.strokeStyle = '#1a1222'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(58.2, y0 + 5); g.lineTo(59.3, y0 + 11); g.stroke();
    // cintura bassa e decorata, lascia scoperta la vita
    rect(g, 40, y0 - .5, 17.5, 3.4, '#38220f');
    for (let i = 0; i < 5; i++) { rect(g, 41.5 + i * 3.2, y0 + .2, 1, 1.8, '#ffc84b'); }
    rect(g, 46.3, y0 - 1.2, 4.3, 5, '#d8952a');
    rect(g, 47.2, y0, 2.3, 3, '#38220f');
    g.strokeStyle = '#fff3a6'; g.lineWidth = .55; g.strokeRect(47.1, y0 - .2, 2.5, 3.2);
  }

  function adeleTop(g, shoulderY, waistY) {
    // pelle del busto (fianchi e vita)
    g.beginPath();
    g.moveTo(40, shoulderY + 2);
    g.lineTo(56, shoulderY + 2);
    g.lineTo(54, waistY + 4);
    g.lineTo(42, waistY + 4);
    g.closePath();
    g.fillStyle = A2.skinShade; g.fill();
    // top bianco arricciato
    g.beginPath();
    g.moveTo(38.5, shoulderY + 3);
    g.bezierCurveTo(35.5, shoulderY + 8, 36, waistY - 2, 38.5, waistY);
    g.lineTo(57.5, waistY);
    g.bezierCurveTo(61.5, waistY - 2, 61, shoulderY + 8, 58.5, shoulderY + 3);
    g.quadraticCurveTo(48.5, shoulderY + 7, 38.5, shoulderY + 3);
    g.closePath();
    g.fillStyle = A2.top; g.fill();
    g.strokeStyle = '#1a1222'; g.lineWidth = 1.8; g.lineJoin = 'round'; g.stroke();
    // scollo e seno
    g.fillStyle = A2.topShade;
    g.beginPath();
    g.moveTo(40, shoulderY + 5);
    g.quadraticCurveTo(43, shoulderY + 11, 41, waistY - 1);
    g.lineTo(38.5, waistY);
    g.quadraticCurveTo(37, shoulderY + 7, 40, shoulderY + 5);
    g.fill();
    g.fillStyle = '#fff7e2';
    g.beginPath(); g.moveTo(49, shoulderY + 6); g.quadraticCurveTo(54, shoulderY + 8, 55, shoulderY + 13); g.lineTo(50, shoulderY + 13); g.closePath(); g.fill();
    // pieghe arricciate
    for (let i = 0; i < 5; i++) {
      const x = 41 + i * 3.8;
      g.strokeStyle = i === 2 ? '#cbb98e' : '#e8dcc0'; g.lineWidth = .8;
      g.beginPath(); g.moveTo(x, shoulderY + 6); g.quadraticCurveTo(x - 1.5, waistY - 2, x + .5, waistY); g.stroke();
    }
    // bordo inferiore
    g.strokeStyle = '#cbb98e'; g.lineWidth = .9;
    g.beginPath(); g.moveTo(38.8, waistY - 1); g.quadraticCurveTo(48, waistY + 1.5, 57.2, waistY - 1); g.stroke();
    // vita scoperta
    rect(g, 41, waistY, 15, 3.5, A2.skin);
    rect(g, 42.5, waistY + 1, 1, 1, '#d99377');
    // maniche a sbuffo, più piccole e con polsino
    adelePuff(g, 38.4, shoulderY, -1);
    adelePuff(g, 58.4, shoulderY, 1);
  }

  function adelePuff(g, x, shoulderY, dir) {
    g.beginPath();
    g.moveTo(x - dir * 1.2, shoulderY + 1.5);
    g.bezierCurveTo(x - 4.8, shoulderY + 2, x - 5, shoulderY + 4.6, x - 2.7, shoulderY + 6.4);
    g.lineTo(x + 2.7, shoulderY + 6.4);
    g.bezierCurveTo(x + 5, shoulderY + 4.6, x + 4.8, shoulderY + 2, x + dir * 1.2, shoulderY + 1.5);
    g.quadraticCurveTo(x, shoulderY - .8, x - dir * 1.2, shoulderY + 1.5);
    g.closePath();
    g.fillStyle = A2.top; g.fill();
    g.strokeStyle = '#1a1222'; g.lineWidth = 1.3; g.stroke();
    // pieghe
    g.strokeStyle = '#cbb98e'; g.lineWidth = .65;
    g.beginPath(); g.moveTo(x - 2.6, shoulderY + 2.3); g.quadraticCurveTo(x - 3.3, shoulderY + 4.2, x - 1.8, shoulderY + 5.8); g.stroke();
    g.beginPath(); g.moveTo(x + 1.2, shoulderY + 2.2); g.quadraticCurveTo(x + 2.5, shoulderY + 4, x + 1.4, shoulderY + 5.9); g.stroke();
    // polsino
    g.fillStyle = A2.topShade;
    g.beginPath(); g.ellipse(x, shoulderY + 6.3, 3.3, 1.05, 0, 0, TAU); g.fill();
    g.strokeStyle = '#d8c6a2'; g.lineWidth = .7;
    g.beginPath(); g.moveTo(x - 3.3, shoulderY + 6.3); g.lineTo(x + 3.3, shoulderY + 6.3); g.stroke();
  }

  function adeleHead(g, headY, opts) {
    const tilt = opts.tilt || 0;
    g.save();
    g.translate(tilt, 0);
    // collo
    outlinedLimb(g, 47, headY + 6, 47.8, headY + 12, 5.2, A2.skinShade, A2.skinLine);
    g.fillStyle = A2.skinDeep; g.fillRect(51, headY + 7, 1.1, 4.5);
    // orecchie
    circle(g, 40.2, headY + .5, 2.8, A2.skinShade);
    circle(g, 57.8, headY + .5, 2.8, A2.skin);
    g.strokeStyle = A2.skinLine; g.lineWidth = .7;
    g.beginPath(); g.arc(40.2, headY + .5, 2, -.8, 1.5); g.stroke();
    g.beginPath(); g.arc(57.8, headY + .5, 2, 1.7, 4); g.stroke();
    // volto (15 x 18)
    g.beginPath();
    g.moveTo(43, headY - 7);
    g.bezierCurveTo(41, headY - 3.5, 41.2, headY + 1.8, 43, headY + 5.2);
    g.bezierCurveTo(44.8, headY + 8.4, 48.3, headY + 9.4, 50.4, headY + 7.9);
    g.bezierCurveTo(54.4, headY + 7.3, 57, headY + 3, 57.5, headY - 1.4);
    g.bezierCurveTo(57.8, headY - 5.8, 53.5, headY - 8.8, 48.5, headY - 8.4);
    g.bezierCurveTo(45.5, headY - 8.4, 44, headY - 8, 43, headY - 7);
    g.closePath();
    g.fillStyle = A2.skin; g.fill();
    g.strokeStyle = A2.skinLine; g.lineWidth = 1.35; g.lineJoin = 'round'; g.stroke();
    // guance, mascella, luce sul mento
    g.fillStyle = A2.skinShade;
    g.beginPath(); g.ellipse(44, headY + 1.5, 3.4, 4.3, -.12, 0, TAU); g.fill();
    g.fillStyle = '#f6c7a3'; g.fillRect(47.8, headY + 7.4, 2.8, .9);
    // sopracciglia
    line(g, 43.6, headY - 4.2, 47.8, headY - 4.9, '#8d5016', 1.1);
    line(g, 51.5, headY - 4.8, 55.7, headY - 3.9, '#8d5016', 1.05);
    // occhi a mandorla, sguardo deciso
    for (const [x, w] of [[43.8, 4.8], [51.4, 4.5]]) {
      g.fillStyle = '#ff90b8'; g.fillRect(x + .2, headY - 2.9, w, .9);
      g.fillStyle = '#fffdf2';
      g.beginPath();
      g.moveTo(x, headY - 1.2); g.quadraticCurveTo(x + w * .5, headY - 3.2, x + w, headY - 1.2);
      g.quadraticCurveTo(x + w * .5, headY + 1, x, headY - 1.2); g.fill();
      g.fillStyle = '#3f7a9e';
      g.fillRect(x + w * .5, headY - 1.9, 2, 2.4);
      g.fillStyle = '#0b0812';
      g.fillRect(x + w * .6, headY - 1.4, 1, 1.6);
      g.fillStyle = '#fff8e7';
      g.fillRect(x + w * .53, headY - 1.8, .8, .8);
      g.strokeStyle = '#1a1222'; g.lineWidth = .8;
      g.beginPath(); g.moveTo(x, headY - 1.2); g.quadraticCurveTo(x + w * .5, headY - 3.2, x + w, headY - 1.2); g.stroke();
      // ala di eyeliner
      line(g, x + w - .1, headY - 1.5, x + w + 1.1, headY - 2.4, '#1a1222', .8);
    }
    // naso piccolo, profilo a destra
    g.strokeStyle = A2.skinDeep; g.lineWidth = .8;
    g.beginPath(); g.moveTo(55.7, headY - .7); g.quadraticCurveTo(56.8, headY + 1.4, 55.4, headY + 2.1); g.stroke();
    g.fillStyle = '#9a514e'; g.fillRect(55.2, headY + 1.9, 1.1, .6);
    // blush
    g.fillStyle = 'rgba(255,120,150,.34)';
    g.fillRect(44.4, headY + .6, 2.8, 1);
    // bocca rossa
    g.beginPath();
    g.moveTo(51.2, headY + 4.2);
    g.quadraticCurveTo(53.2, headY + 3.1, 55.1, headY + 4);
    g.quadraticCurveTo(57, headY + 3.6, 58, headY + 4.9);
    g.quadraticCurveTo(56, headY + 7.4, 53.3, headY + 7.1);
    g.quadraticCurveTo(51, headY + 6.7, 51.2, headY + 4.2);
    g.closePath();
    g.fillStyle = A2.lip; g.fill();
    g.strokeStyle = '#66192a'; g.lineWidth = .7; g.stroke();
    g.fillStyle = '#ffbfd8'; g.fillRect(52.5, headY + 4.3, 2.9, .7);
    g.fillStyle = '#fff8e7'; g.fillRect(53.8, headY + 5.1, 1.5, .4);
    g.fillStyle = A2.lipDark; g.fillRect(52.1, headY + 5.8, 2.2, .45);
    // occhiali cat-eye indossati: montatura oro, sguardo visibile
    const lensL = new Path2D();
    lensL.moveTo(43.1, headY - 2.6);
    lensL.quadraticCurveTo(43.1, headY - 3.5, 45, headY - 3.3);
    lensL.lineTo(48.2, headY - 2.9);
    lensL.quadraticCurveTo(48.4, headY + .4, 46.7, headY + .8);
    lensL.quadraticCurveTo(43.5, headY + 1, 43.1, headY - 2.6);
    const lensR = new Path2D();
    lensR.moveTo(51.3, headY - 2.7);
    lensR.quadraticCurveTo(51.4, headY - 3.4, 53, headY - 3.2);
    lensR.lineTo(56, headY - 2.7);
    lensR.quadraticCurveTo(56.4, headY + .5, 54.5, headY + .9);
    lensR.quadraticCurveTo(51.7, headY + 1, 51.3, headY - 2.7);
    g.strokeStyle = '#c07a1c'; g.lineWidth = 1.15;
    g.stroke(lensL); g.stroke(lensR);
    g.strokeStyle = '#ffc84b'; g.lineWidth = .55;
    g.stroke(lensL); g.stroke(lensR);
    line(g, 48.2, headY - 2.1, 51.3, headY - 2.1, '#c07a1c', .9);
    line(g, 48.2, headY - 2.2, 51.3, headY - 2.2, '#ffc84b', .4);
    // cerniere oro e stanghetta morsa dalle labbra
    g.strokeStyle = '#ffc84b'; g.lineWidth = .8;
    line(g, 56, headY - 2.5, 56.8, headY - 1.8, '#ffc84b', .9);
    line(g, 43.1, headY - 2.2, 42.4, headY - 1.6, '#ffc84b', .8);
    g.strokeStyle = '#b07918'; g.lineWidth = .95;
    g.beginPath();
    g.moveTo(56.6, headY - 2.1);
    g.lineTo(57.8, headY - .2);
    g.quadraticCurveTo(58.2, headY + 2.6, 56.1, headY + 4.3);
    g.stroke();
    g.strokeStyle = '#ffe08a'; g.lineWidth = .4;
    g.beginPath(); g.moveTo(56.8, headY - 1.9); g.lineTo(57.9, headY - .2); g.quadraticCurveTo(58, headY + 2.2, 56.6, headY + 3.7); g.stroke();
    // riflessi lenti
    g.strokeStyle = 'rgba(220,245,255,.7)'; g.lineWidth = .55;
    g.beginPath(); g.moveTo(43.8, headY - 2.2); g.lineTo(44.9, headY - 2.5); g.stroke();
    g.beginPath(); g.moveTo(51.6, headY - 2.2); g.lineTo(52.7, headY - 2.5); g.stroke();
    // orecchini a cerchio
    for (const ex of [38.9, 59.1]) {
      g.strokeStyle = '#0b0812'; g.lineWidth = 2.5;
      g.beginPath(); g.arc(ex, headY + 6.2, 2.8, -.3, 3.4); g.stroke();
      g.strokeStyle = '#ffc84b'; g.lineWidth = 1.3;
      g.beginPath(); g.arc(ex, headY + 6.2, 2.8, -.3, 3.4); g.stroke();
      g.strokeStyle = '#fff3a6'; g.lineWidth = .45;
      g.beginPath(); g.arc(ex - .2, headY + 6.2, 3.2, .1, 1.5); g.stroke();
    }
    // girocollo di perle
    g.strokeStyle = '#cbb98e'; g.lineWidth = .55;
    g.beginPath(); g.arc(49, headY + 10.2, 6.2, .25, Math.PI - .25); g.stroke();
    for (let i = 0; i < 7; i++) {
      const x = 44.1 + i * 1.65;
      const y = headY + 10.1 + Math.sin(i / 6 * Math.PI) * .75;
      circle(g, x, y, .8, '#fff8e7');
      g.fillStyle = '#e6d5b0'; g.fillRect(x - .3, y + .5, .6, .3);
    }
    // ciuffi sottili davanti, non tende
    g.strokeStyle = A2.hairLine; g.lineWidth = 2.8; g.lineCap = 'round';
    g.beginPath(); g.moveTo(42.4, headY - 6); g.quadraticCurveTo(40.6, headY, 41.4, headY + 7.5); g.stroke();
    g.beginPath(); g.moveTo(57.8, headY - 6); g.quadraticCurveTo(59.6, headY, 58.4, headY + 6.5); g.stroke();
    g.strokeStyle = A2.hairLight; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(42.3, headY - 6); g.quadraticCurveTo(41, headY, 41.5, headY + 6.5); g.stroke();
    g.beginPath(); g.moveTo(57.9, headY - 6); g.quadraticCurveTo(59.2, headY, 58.4, headY + 5.5); g.stroke();
    g.strokeStyle = A2.hairHi; g.lineWidth = .5;
    g.beginPath(); g.moveTo(41.9, headY - 4); g.lineTo(41.2, headY + 1); g.stroke();
    g.beginPath(); g.moveTo(58.5, headY - 4); g.lineTo(59, headY + 1); g.stroke();
    // frangia mossa, sopra le sopracciglia
    g.beginPath();
    g.moveTo(41.7, headY - 6);
    g.bezierCurveTo(42.8, headY - 11.8, 51, headY - 12.8, 56.8, headY - 6.8);
    g.bezierCurveTo(58.2, headY - 4.8, 57.4, headY - 3.8, 55.8, headY - 3.8);
    g.bezierCurveTo(53.9, headY - 5, 51, headY - 5.6, 48.1, headY - 4.8);
    g.bezierCurveTo(46, headY - 4.2, 43.6, headY - 4, 42.6, headY - 5.2);
    g.bezierCurveTo(42.1, headY - 3.5, 41.8, headY - 1.7, 41.4, headY + .2);
    g.closePath();
    g.fillStyle = A2.hairLight; g.fill();
    g.strokeStyle = A2.hairLine; g.lineWidth = 1.15; g.stroke();
    g.strokeStyle = A2.hairHi; g.lineWidth = .8;
    g.beginPath(); g.moveTo(44.2, headY - 9); g.bezierCurveTo(47, headY - 10.4, 50.8, headY - 9.9, 53.2, headY - 8.1); g.stroke();
    // separazioni della frangia
    g.strokeStyle = A2.hairDark; g.lineWidth = .7;
    g.beginPath(); g.moveTo(49.2, headY - 10.2); g.quadraticCurveTo(46.2, headY - 7.2, 44.4, headY - 4.4); g.stroke();
    g.beginPath(); g.moveTo(52.8, headY - 9); g.quadraticCurveTo(51.6, headY - 6.2, 50.4, headY - 4); g.stroke();
    g.strokeStyle = A2.hairHi; g.lineWidth = .5;
    g.beginPath(); g.moveTo(46.4, headY - 9.6); g.quadraticCurveTo(45.2, headY - 7, 44.8, headY - 4.8); g.stroke();
    // ciuffo ribelle
    line(g, 56, headY - 7, 61.7, headY - 9, A2.hairLine, 2.2);
    line(g, 56, headY - 7, 61.2, headY - 8.7, A2.hairLight, 1.2);
    g.restore();
  }

  function adeleGunV2(g, hx, hy, weapon, angle, recoil) {
    g.save();
    g.translate(hx, hy);
    g.rotate(angle);
    g.translate(-recoil * 1.8, 0);
    if (weapon === 'mascara') {
      // impugnatura
      rect(g, -2.2, -2, 4.5, 7.5, '#1a1222');
      rect(g, -1.1, -1, 2.8, 6, '#8d5016');
      rect(g, -1.1, -1, 1, 3, '#ffc84b');
      // corpo in metallo
      rect(g, 1.5, -3.4, 8.5, 6.8, '#1a1222');
      rect(g, 2.2, -2.6, 7.2, 5.2, '#7280b3');
      rect(g, 3, -2.6, 1.2, 5.2, '#d9e8f2');
      rect(g, 8.3, -3.2, 3.5, 6.4, '#ffc84b');
      rect(g, 9, -2.2, 1.4, 4.4, '#8d5016');
      // asta e spazzola gigante
      line(g, 11.5, 0, 17.2, 0, '#1a1222', 4.4);
      line(g, 11.5, 0, 17.2, 0, '#48576e', 2.4);
      g.beginPath(); g.ellipse(20.3, 0, 5.7, 4.4, 0, 0, TAU); g.fillStyle = '#1a1222'; g.fill();
      g.beginPath(); g.ellipse(20.3, 0, 4.8, 3.5, 0, 0, TAU); g.fillStyle = '#2d2238'; g.fill();
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * TAU;
        line(g, 20.3 + Math.cos(a) * 3.5, Math.sin(a) * 2.5, 20.3 + Math.cos(a) * 6.8, Math.sin(a) * 4.8, i % 2 ? '#4d2c4e' : '#1a1222', 1.3);
      }
      rect(g, 23, -1.8, 1.8, 3.6, '#ff5b9d');
      heartShape(g, 6.5, 4.6, 1.8, '#ff5b9d');
    } else {
      // pistola rossetto compatta: impugnatura inclinata e grilletto
      g.beginPath();
      g.moveTo(-1.2, 1);
      g.lineTo(1.8, 1.4);
      g.lineTo(.2, 8.4);
      g.lineTo(-3.2, 7.2);
      g.closePath();
      g.fillStyle = '#1a1222'; g.fill();
      g.strokeStyle = '#0b0812'; g.lineWidth = 1; g.stroke();
      g.beginPath();
      g.moveTo(-.4, 2.1);
      g.lineTo(1.4, 2.4);
      g.lineTo(.4, 6.8);
      g.lineTo(-1.8, 6.1);
      g.closePath();
      g.fillStyle = '#ffc84b'; g.fill();
      g.strokeStyle = '#8d5016'; g.lineWidth = .7; g.stroke();
      g.strokeStyle = '#ffc84b'; g.lineWidth = 1;
      g.beginPath(); g.arc(3.8, 4.4, 2.2, -.2, 2.2); g.stroke();
      // corpo bianco con banda oro
      rect(g, 1.5, -2.8, 9.5, 5.6, '#1a1222');
      rect(g, 2.2, -2.1, 8.2, 4.2, '#fffdf2');
      rect(g, 3, -2.1, 1.2, 4.2, '#d9e8f2');
      rect(g, 9.7, -2.5, 2.2, 5, '#ffc84b');
      rect(g, 9.7, -2.5, .8, 5, '#8d5016');
      // tacca di mira
      rect(g, 6.4, -3.6, 1.5, 1.2, '#1a1222');
      rect(g, 6.6, -3.4, .9, .6, '#ffc84b');
      // cartuccia e punta
      rect(g, 11.5, -2.2, 4.2, 4.4, '#ff5b9d');
      rect(g, 12.2, -2.2, 1.2, 4.4, '#ffbfd8');
      g.beginPath(); g.moveTo(15.6, -2.2); g.lineTo(19.8, -.6); g.lineTo(19.8, 1); g.lineTo(15.6, 2.2); g.closePath();
      g.fillStyle = '#ef367f'; g.fill();
      g.strokeStyle = '#5a0c30'; g.lineWidth = .9; g.stroke();
      rect(g, 18.9, -.5, 1.2, 1, '#fff3a6');
      // anello bocca di fuoco
      g.strokeStyle = '#ffc84b'; g.lineWidth = .7;
      g.beginPath(); g.arc(19.8, .2, 1.4, -1.2, 1.2); g.stroke();
      rect(g, 3.6, 3.5, 1.7, 2.7, '#ffc84b');
      rect(g, 5, -1.3, 1.6, 1, '#ff90b8');
    }
    g.restore();
  }

  function adeleArmFront(g, sx, sy, hx, hy, ex, ey) {
    outlinedLimb(g, sx, sy, ex, ey, 5.0, A2.skin, A2.skinLine);
    outlinedLimb(g, ex, ey, hx, hy, 4.1, A2.skin, A2.skinLine);
    // bracciali
    const dx = hx - ex, dy = hy - ey;
    for (const [t, col, w] of [[.52, '#2d648c', 1.4], [.64, '#d4e5ee', 1.0], [.76, '#ffc84b', .9]]) {
      const bx = ex + dx * t, by = ey + dy * t;
      line(g, bx - 1.8, by + .5, bx + 1.5, by - .5, col, w + 1.2);
    }
    circle(g, hx, hy, 3.4, A2.skin);
    g.strokeStyle = A2.skinLine; g.lineWidth = .9; g.beginPath(); g.arc(hx, hy, 3.4, 0, TAU); g.stroke();
    line(g, hx + 1, hy - 2, hx + 2.8, hy - 1.5, '#e7a67d', .7);
  }

  function paintAdeleV2(opts) {
    const o = Object.assign({ mode: 'idle', phase: 0, weapon: 'lipstick', aimUp: false, aimDown: false, recoil: 0 }, opts || {});
    const c = canvas(PLAYER_W, PLAYER_H);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const crouch = o.mode === 'crouch';
    const jump = o.mode === 'jump';
    const run = o.mode === 'run';
    const t = o.phase || 0;
    const s = Math.sin(t * TAU);
    const cphase = Math.cos(t * TAU);
    const bob = run ? -Math.abs(s) * 1.2 : (jump ? -1 : Math.sin(t * TAU) * .45);
    const sway = (run ? s * 1.7 : Math.sin(t * TAU + .6) * .8) * (jump ? .4 : 1);
    const hipY = (crouch ? 63 : jump ? 51 : 54) + bob;
    const shoulderY = (crouch ? 45 : jump ? 34 : 35) + bob;
    const headY = (crouch ? 35 : jump ? 23.5 : 23.5) + bob;
    const waistY = shoulderY + 10;
    const lean = run ? 1.2 : jump ? -.8 : 0;

    drawAdeleHairBack(g, sway, bob, run);

    // gambe
    let backFootX, backFootY, frontFootX, frontFootY;
    if (run) {
      const a = s, b = Math.max(0, s), b2 = Math.max(0, -s);
      backFootX = 44 - a * 7; backFootY = 80 - b * 6;
      frontFootX = 54 + a * 8; frontFootY = 80 - b2 * 6;
      adeleLeg(g, 45, hipY, 43 - a * 3, 67 - b * 2, backFootX, backFootY, true, 1);
      adeleLeg(g, 52, hipY, 55 + a * 4, 67 - b2 * 2, frontFootX, frontFootY, false, 1);
    } else if (jump) {
      adeleLeg(g, 46, hipY, 42, 66, 38, 74, true, 1);
      adeleLeg(g, 52, hipY, 57, 63, 62, 73, false, 1);
    } else if (crouch) {
      adeleLeg(g, 45, hipY, 37, 71, 38, 81, true, 1);
      adeleLeg(g, 53, hipY, 63, 70, 61, 81, false, 1);
    } else {
      const idleShift = Math.sin(t * TAU) * .35;
      adeleLeg(g, 45, hipY, 43 + idleShift, 68, 42 + idleShift, 81, true, 1);
      adeleLeg(g, 52, hipY, 56 + idleShift, 68, 57 + idleShift, 81, false, 1);
    }

    adeleSkirt(g, hipY, sway);

    // braccio posteriore (appena visibile)
    if (run) {
      outlinedLimb(g, 40, shoulderY + 4, 34 - s * 4, shoulderY + 11, 4.4, A2.skinShade, A2.skinLine);
      outlinedLimb(g, 34 - s * 4, shoulderY + 11, 37 - s * 5, shoulderY + 17, 3.6, A2.skinShade, A2.skinLine);
      circle(g, 37 - s * 5, shoulderY + 17, 2.5, A2.skinShade);
    }

    g.save();
    g.translate(lean, 0);
    adeleTop(g, shoulderY, waistY);
    // pelle della vita viene sopra al top per il crop
    rect(g, 41, waistY, 15, 4, A2.skin);
    rect(g, 42.5, waistY + 1.6, .9, .9, '#d99377');
    // ombra del seno/spalline
    g.strokeStyle = '#cbb98e'; g.lineWidth = .8;
    g.beginPath(); g.moveTo(42, shoulderY + 3); g.quadraticCurveTo(48, shoulderY + 6, 55, shoulderY + 3); g.stroke();
    g.restore();

    // testa
    g.save();
    g.translate(lean, 0);
    adeleHead(g, headY, { tilt: run ? s * .25 : 0 });
    g.restore();

    // braccio e arma
    g.save();
    g.translate(lean, 0);
    let sx = 57, sy = shoulderY + 4;
    let hx, hy, ex, ey, gunAngle;
    if (crouch) {
      hx = 64; hy = 55 + bob; ex = 61; ey = 51 + bob; gunAngle = .25;
    } else if (jump) {
      hx = 65; hy = 47.5 + bob; ex = 62; ey = 43 + bob; gunAngle = -.02;
    } else if (o.aimUp) {
      hx = 64; hy = 31 + bob; ex = 61; ey = 35 + bob; gunAngle = -1.32;
    } else if (o.aimDown) {
      hx = 64; hy = 51 + bob; ex = 62; ey = 47 + bob; gunAngle = .62;
    } else if (run) {
      hx = 65; hy = 48 + bob; ex = 62; ey = 44 + bob; gunAngle = .02;
    } else {
      hx = 65; hy = 48 + bob; ex = 62; ey = 45 + bob; gunAngle = .02;
    }
    adeleArmFront(g, sx, sy, hx, hy, ex, ey);
    // la manica destra copre l'attacco del braccio
    adelePuff(g, 58.4, shoulderY, 1);
    // mano e arma
    adeleGunV2(g, hx, hy, o.weapon, gunAngle, o.recoil || 0);
    g.beginPath();
    g.ellipse(hx - .2, hy + .9, 3.1, 3.6, -.15, 0, TAU);
    g.fillStyle = A2.skin; g.fill();
    g.strokeStyle = A2.skinLine; g.lineWidth = .8; g.stroke();
    line(g, hx - 2, hy + 1.7, hx + 1.2, hy + 2.5, A2.skinDeep, .7);
    line(g, hx - 1.8, hy + 3, hx + .8, hy + 3.6, A2.skinDeep, .7);
    // anello d'oro al dito
    rect(g, hx + .2, hy + 2.5, 1.4, .7, '#ffc84b');
    g.restore();

    // dettagli: polvere/calore, riflesso capelli
    if (run) {
      line(g, 29 + sway, 48, 25 + sway, 52, A2.hairBase, 1.2);
      line(g, 66 + sway, 44, 69 + sway, 48, A2.hairLight, 1.2);
    }
    quantize(c);
    return c;
  }

  const playerCache = new Map();
  A.getPlayerFrame = function (opts) {
    const o = Object.assign({ mode: 'idle', phase: 0, weapon: 'lipstick', aimUp: false, aimDown: false }, opts);
    const key = [o.mode, o.phase.toFixed(3), o.weapon, !!o.aimUp, !!o.aimDown].join('|');
    if (!playerCache.has(key)) {
      playerCache.set(key, paintAdeleV2(o));
    }
    return playerCache.get(key);
  };

  A.playerFrames = {};
  A.buildPlayerFrames = function () {
    const idle = [], run = [], jump = [];
    for (let i = 0; i < 4; i++) idle.push(A.getPlayerFrame({ mode: 'idle', phase: i / 4 }));
    for (let i = 0; i < 8; i++) run.push(A.getPlayerFrame({ mode: 'run', phase: i / 8 }));
    jump.push(A.getPlayerFrame({ mode: 'jump', phase: 0 }));
    jump.push(A.getPlayerFrame({ mode: 'jump', phase: .5 }));
    A.playerFrames = {
      idle, run, jump,
      idleUp: A.getPlayerFrame({ mode: 'idle', phase: 0, aimUp: true }),
      runUp: A.getPlayerFrame({ mode: 'run', phase: .25, aimUp: true }),
      jumpUp: A.getPlayerFrame({ mode: 'jump', phase: 0, aimUp: true }),
      idleDown: A.getPlayerFrame({ mode: 'jump', phase: 0, aimDown: true }),
      crouch: [
        A.getPlayerFrame({ mode: 'crouch', phase: 0 }),
        A.getPlayerFrame({ mode: 'crouch', phase: .5 })
      ],
      mascaraIdle: A.getPlayerFrame({ mode: 'idle', phase: 0, weapon: 'mascara' }),
      mascaraRun: A.getPlayerFrame({ mode: 'run', phase: .25, weapon: 'mascara' }),
      mascaraJump: A.getPlayerFrame({ mode: 'jump', phase: 0, weapon: 'mascara' }),
      mascaraUp: A.getPlayerFrame({ mode: 'idle', phase: 0, weapon: 'mascara', aimUp: true }),
      mascaraCrouch: A.getPlayerFrame({ mode: 'crouch', phase: 0, weapon: 'mascara' })
    };
  };

  A.generatedSpritesReady = false;
  A.loadGeneratedSprites = async function () {
    const m = window.SPRITE_MANIFEST;
    if (!m) {
      try { await A.loadV2Sprites(); } catch (e) { console.warn('Sprite PNG v2 non caricati:', e); }
      return false;
    }
    const paths = new Set();
    const collect = v => {
      if (typeof v === 'string') paths.add(v);
      else if (Array.isArray(v)) v.forEach(collect);
      else if (v && typeof v === 'object') Object.values(v).forEach(collect);
    };
    collect(m);
    paths.add('assets/adele-portrait.png');
    paths.add('assets/rocco-portrait.png');
    const load = src => new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve([src, im]);
      im.onerror = () => reject(new Error(src));
      im.src = src;
    });
    const settled = await Promise.allSettled(Array.from(paths).map(load));
    const got = new Map();
    const failed = [];
    for (const r of settled) {
      if (r.status === 'fulfilled') got.set(r.value[0], r.value[1]);
      else failed.push(String(r.reason && r.reason.message || r.reason));
    }
    if (failed.length) console.warn('Sprite Google non caricati:', failed);
    const g = src => got.get(src);
    const group = list => list.map(g);
    const all = list => list.every(Boolean);

    A.characterFrames = A.characterFrames || {};
    const p = m.player;
    if (p && all([...p.run, ...p.idle, ...p.jump, p.shoot, p.aimup, p.crouch, p.mascaraIdle, p.mascaraRun, p.mascaraCrouch])) {
      A.characterFrames.adele = {
        idle: [g(p.idle[0]), g(p.idle[1]), g(p.idle[0]), g(p.idle[1])],
        run: [...group(p.run), ...group(p.run)],
        jump: group(p.jump),
        shoot: g(p.shoot),
        idleUp: g(p.aimup), runUp: g(p.aimup), jumpUp: g(p.aimup),
        idleDown: g(p.crouch),
        crouch: [g(p.crouch), g(p.crouch)],
        mascaraIdle: g(p.mascaraIdle),
        mascaraRun: g(p.mascaraRun),
        mascaraJump: g(p.mascaraIdle),
        mascaraUp: g(p.mascaraIdle),
        mascaraCrouch: g(p.mascaraCrouch)
      };
    }
    const r = m.playerRocco;
    if (r && all([...r.run, ...r.idle, ...r.jump, r.shoot, r.aimup, r.crouch, r.remote])) {
      A.characterFrames.rocco = {
        idle: [g(r.idle[0]), g(r.idle[1]), g(r.idle[0]), g(r.idle[1])],
        run: [...group(r.run), ...group(r.run)],
        jump: group(r.jump),
        shoot: g(r.shoot), remote: g(r.remote),
        idleUp: g(r.aimup), runUp: g(r.aimup), jumpUp: g(r.aimup),
        idleDown: g(r.crouch),
        crouch: [g(r.crouch), g(r.crouch)],
        mascaraIdle: g(r.idle[0]), mascaraRun: g(r.run[2]), mascaraJump: g(r.jump[0]),
        mascaraUp: g(r.aimup), mascaraCrouch: g(r.crouch)
      };
    }
    A.useCharacter = name => {
      A.currentCharacter = name;
      A.playerFrames = A.characterFrames[name] || A.characterFrames.adele || A.playerFrames;
    };
    A.useCharacter(A.currentCharacter || 'adele');

    for (const [type, spec] of Object.entries(m.enemies || {})) {
      if (!spec || !all([...spec.walk, spec.attack, spec.hurt])) continue;
      A.enemyFrames[type] = [...group(spec.walk), g(spec.attack), g(spec.hurt)];
    }

    // NPC PNG (darts/beans/tennis/golf) + fallback procedurali delle stanze Direzione
    A.npcLoaded = {};
    A.npcs = Object.assign({}, A.procNpcs || {});
    for (const [type, src] of Object.entries(m.npcs || {})) {
      if (g(src)) { A.npcs[type] = g(src); A.npcLoaded[type] = true; }
    }
    A.items = {};
    for (const [type, src] of Object.entries(m.items || {})) {
      if (g(src)) A.items[type] = g(src);
    }

    if (m.bosses && m.bosses.octo && all(m.bosses.octo)) {
      A.octoFrames = group(m.bosses.octo);
    }
    const mb = m.bosses && m.bosses.mecha;
    if (mb && all([...mb.idle, mb.staff, mb.orb, mb.phase2, mb.hurt])) {
      A.mechaFrames = {
        idle: group(mb.idle),
        staff: g(mb.staff),
        orb: g(mb.orb),
        phase2: g(mb.phase2),
        hurt: g(mb.hurt)
      };
    }
    const db = m.bosses && m.bosses.direttore;
    if (db && all(Object.values(db))) {
      A.directorFrames = {
        idle0: g(db.idle0), idle1: g(db.idle1), stamp: g(db.stamp),
        point: g(db.point), rage: g(db.rage), hurt: g(db.hurt)
      };
    }
    A.generatedSpritesReady = !!(A.playerFrames && A.playerFrames.idle && A.playerFrames.idle[0]);
    A.spriteErrors = failed;
    const portrait = g('assets/adele-portrait.png');
    if (portrait && A.icons) {
      try {
        const face = canvas(34, 34);
        const fx = face.getContext('2d');
        fx.imageSmoothingEnabled = true;
        fx.drawImage(portrait, 250, 150, 340, 340, 0, 0, 34, 34);
        quantize(face);
        A.icons.adeleFace = face;
      } catch (e) { console.warn('Ritratto HUD non aggiornato:', e); }
    }
    if (A.characterFrames.rocco && A.icons) {
      try {
        const im = A.characterFrames.rocco.idle[0];
        const face = canvas(34, 34);
        const fx = face.getContext('2d');
        fx.imageSmoothingEnabled = true;
        fx.drawImage(im, 22, 2, 54, 54, 0, 0, 34, 34);
        quantize(face);
        A.icons.roccoFace = face;
      } catch (e) { console.warn('Ritratto Rocco HUD non aggiornato:', e); }
    }
    // Le stanze della Direzione usano ora gli sprite PNG appena caricati
    // (e restano valide anche se qualche PNG manca). Ricomposizione una tantum.
    try {
      if (typeof A.buildDirezioneRooms === 'function') {
        A.buildDirezioneRooms();
        A.npcs = Object.assign({}, A.procNpcs || {}, A.npcs || {});
      }
    } catch (e) { console.warn('Stanze Direzione non ricomposte:', e); }
    // v2.0 — sostituzione PNG degli sprite nuovi (se presenti nel manifest)
    try { await A.loadV2Sprites(); } catch (e) { console.warn('Sprite PNG v2 non caricati:', e); }
    return A.generatedSpritesReady;
  };

  /* =========================================================
     v2.0 — PIPELINE PNG DEGLI SPRITE GENERATI (Nano Banana Pro o simili)
     -----------------------------------------------------------------
     Legge window.SPRITE_MANIFEST_V2 (js/sprites.js) e, per ogni voce:
       enemies  -> Art.enemyFrames[type] = [walk0..3, attack, hurt] (84x90)
       bosses   -> Art.cesare / Art.ursula / Art.ceo = { frames, w, h, ax, ay }
       ambient  -> Art.sogeiMonkey / Art.sogeiBird / Art.sogeiCash (frames+meta)
     Se un file manca o l'entry è incompleta NON sovrascrive nulla: resta il
     fallback procedurale costruito al boot. Con manifest vuoto non viene
     effettuata alcuna richiesta di rete (zero 404 in console).
     Documentazione: assets/sprites/v2/README.md
     ========================================================= */
  A.V2_ROOT = 'assets/sprites/v2/';
  A.V2_ENEMY_BOX = { w: 84, h: 90, ay: 84 };
  A.v2SpriteStatus = { enabled: false, loaded: 0, missing: 0, enemies: [], bosses: [], ambient: [], errors: [] };
  A.v2SpriteManifest = null;

  function v2ToCanvas(img) {
    const w = img.width || img.naturalWidth || 1;
    const h = img.height || img.naturalHeight || 1;
    const c = canvas(w, h);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(img, 0, 0);
    return c;
  }

  function v2ImageFromBlob(blob, resolve, reject) {
    const url = URL.createObjectURL(blob);
    const im = new Image();
    im.onload = () => {
      const c = v2ToCanvas(im);
      URL.revokeObjectURL(url);
      resolve(c);
    };
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('PNG non decodificabile')); };
    im.src = url;
  }

  function v2ImageFromURL(src) {
    // Fallback per file://: lì fetch() è bloccato dal browser, ma <img> locale
    // funziona. Senza questo fallback tutti i PNG v2 sparivano e il gioco
    // ricadeva sull'arte procedurale (sfondo "vecchio").
    return new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(v2ToCanvas(im));
      im.onerror = () => reject(new Error('PNG non caricabile — ' + src));
      im.src = src;
    });
  }

  function v2LoadImage(src) {
    // Su file:// niente fetch: il browser blocca le richieste locali.
    if (typeof location !== 'undefined' && location.protocol === 'file:') {
      return v2ImageFromURL(src);
    }
    // Su HTTP fetch + decode: un 404 diventa una promise fallita silenziosa,
    // senza "Failed to load resource" in console (a differenza di <img>.src).
    return fetch(src, { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status + ' — ' + src);
        return res.blob();
      })
      .then(blob => new Promise((resolve, reject) => {
        if (typeof createImageBitmap === 'function') {
          createImageBitmap(blob).then(img => resolve(v2ToCanvas(img)), () => v2ImageFromBlob(blob, resolve, reject));
        } else {
          v2ImageFromBlob(blob, resolve, reject);
        }
      }));
  }

  // Nemici: normalizza al box 84x90 con i piedi a y=84 (stessa geometria v1).
  // Se il PNG è già 84x90 lo usa pixel-per-pixel; altrimenti lo scala
  // mantenendo le proporzioni e appoggiando il contenuto in basso.
  function v2NormalizeEnemy(img, meta) {
    const box = A.V2_ENEMY_BOX;
    const quant = !!(meta && meta.quantize);
    const iw = img.width, ih = img.height;
    if (iw === box.w && ih === box.h) {
      if (!quant) return img;
      const c0 = canvas(box.w, box.h);
      c0.getContext('2d').drawImage(img, 0, 0);
      quantize(c0);
      return c0;
    }
    const c = canvas(box.w, box.h);
    const g = c.getContext('2d');
    const scale = Math.min(box.w / iw, box.ay / ih);
    const dw = Math.max(1, Math.round(iw * scale));
    const dh = Math.max(1, Math.round(ih * scale));
    g.imageSmoothingEnabled = scale < .999;
    g.drawImage(img, Math.round((box.w - dw) / 2), Math.round(box.ay - dh), dw, dh);
    g.imageSmoothingEnabled = false;
    if (quant) quantize(c);
    return c;
  }

  function v2NormalizeBossFrame(img, w, h, ay, meta) {
    const quant = !!(meta && meta.quantize);
    if (img.width === w && img.height === h) {
      if (!quant) return img;
      const c0 = canvas(w, h);
      c0.getContext('2d').drawImage(img, 0, 0);
      quantize(c0);
      return c0;
    }
    const c = canvas(w, h);
    const g = c.getContext('2d');
    const scale = Math.min(w / img.width, ay / img.height);
    const dw = Math.max(1, Math.round(img.width * scale));
    const dh = Math.max(1, Math.round(img.height * scale));
    g.imageSmoothingEnabled = scale < .999;
    g.drawImage(img, Math.round((w - dw) / 2), Math.round(ay - dh), dw, dh);
    g.imageSmoothingEnabled = false;
    if (quant) quantize(c);
    return c;
  }

  // Items/props: se il PNG ha già la taglia giusta viene usato così com'è
  // (game.js li disegna a dimensione nativa). Se `meta.w/h` o la taglia
  // consigliata per un item sono diversi, si ridimensiona in modo contenuto
  // (proporzioni preservate, centrato nel box target).
  const V2_ITEM_TARGETS = { scontrino: [18, 24], spritz: [20, 26], caffe: [18, 20] };
  function v2FitCanvas(img, targetW, targetH, smooth) {
    if (img.width === targetW && img.height === targetH) return img;
    const c = canvas(targetW, targetH);
    const g = c.getContext('2d');
    const scale = Math.min(targetW / img.width, targetH / img.height);
    const dw = Math.max(1, Math.round(img.width * scale));
    const dh = Math.max(1, Math.round(img.height * scale));
    g.imageSmoothingEnabled = smooth != null ? !!smooth : (scale < .999);
    g.drawImage(img, Math.round((targetW - dw) / 2), Math.round((targetH - dh) / 2), dw, dh);
    g.imageSmoothingEnabled = false;
    return c;
  }
  // Sfondi: le sky e le arene boss devono essere esattamente 640x360
  // (game.js le disegna a schermo intero). I layer parallasse eventuali
  // restano alla dimensione nativa (servono larghezze > 640 per il crop).
  const V2_BG_SCREEN = {
    romaSky: 1, europaSky: 1, pescaraSky: 1, pescaraNightSky: 1, sogeiSky: 1,
    bossRoma: 1, bossEuropa: 1, bossSogei: 1,
    // v2.1 — sfondi "schermo" dei livelli v1 (disegnati 1:1 a 640x360)
    portSky: 1, bariSky: 1, bossPort: 1, bossBasilica: 1,
    direzioneExt: 1, bossDirezione: 1
  };
  // v2.1 — layer parallasse v1: il motore disegna con crop (sx,0,640,360),
  // quindi l'ALTEZZA deve essere esattamente 360; la larghezza resta libera.
  const V2_BG_LAYERS = {
    portFar: 1, portMid: 1, portNear: 1,
    bariFar: 1, bariMid: 1, bariNear: 1
  };
  function v2ResizeScreen(img, targetW, targetH) {
    const c = canvas(targetW, targetH);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false; // nearest anche in ridimensionamento (pixel art)
    g.drawImage(img, 0, 0, img.width, img.height, 0, 0, targetW, targetH);
    return c;
  }
  // v2.1 — layer parallasse: normalizza SOLO l'altezza a 360 (nearest),
  // larghezza invariata (deve restare libera, >= 640 per il crop di game.js).
  function v2NormalizeBgLayer(img) {
    if (img.height === 360) return img;
    const c = canvas(img.width, 360);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(img, 0, 0, img.width, img.height, 0, 0, img.width, 360);
    return c;
  }
  // v2.1 — stanze Direzione: vignette 48x88 (accettato anche 96x176 @2x).
  function v2NormalizeRoom(img) {
    if (img.width === 48 && img.height === 88) return img;
    const c = canvas(48, 88);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(img, 0, 0, img.width, img.height, 0, 0, 48, 88);
    return c;
  }
  // v2.1 — props: target noti (stesse dimensioni/hitbox di PROP_META in
  // game.js). Se il PNG differisce, resize NEAREST con proporzioni preservate
  // e appoggio in basso (i props stanno a terra).
  const V2_PROP_TARGETS = {
    crate: [40, 36], barrel: [30, 40], stall: [100, 78], sign: [44, 55],
    bollard: [20, 28], bench: [62, 34], desk: [76, 38], archive: [38, 72],
    plant: [28, 52], cooler: [24, 48]
  };
  A.propsTargets = V2_PROP_TARGETS;
  function v2FitProp(img, targetW, targetH) {
    if (img.width === targetW && img.height === targetH) return img;
    const c = canvas(targetW, targetH);
    const g = c.getContext('2d');
    const scale = Math.min(targetW / img.width, targetH / img.height);
    const dw = Math.max(1, Math.round(img.width * scale));
    const dh = Math.max(1, Math.round(img.height * scale));
    g.imageSmoothingEnabled = false;
    g.drawImage(img, Math.round((targetW - dw) / 2), Math.round(targetH - dh), dw, dh);
    return c;
  }

  // Auto (Fiat Tipo): frame 220x100 con ruote animate e margine trasparente
  // sotto i pneumatici (come l'arte procedurale: ax=60, ay=92).
  // - stesso aspect ratio del target: riscala a w x h esatti (layout identico)
  // - aspect diverso: contiene e appoggia in basso a y=ay, centrato
  function v2NormalizeCarFrame(img, w, h, ay, meta) {
    const quant = !!(meta && meta.quantize);
    if (img.width === w && img.height === h) {
      if (!quant) return img;
      const c0 = canvas(w, h); c0.getContext('2d').drawImage(img, 0, 0); quantize(c0); return c0;
    }
    const c = canvas(w, h);
    const g = c.getContext('2d');
    const arI = img.width / img.height, arT = w / h;
    if (Math.abs(arI - arT) / arT < .02) {
      g.imageSmoothingEnabled = scaleDownSmooth(img.width, w);
      g.drawImage(img, 0, 0, img.width, img.height, 0, 0, w, h);
    } else {
      const scale = Math.min(w / img.width, ay / img.height);
      const dw = Math.max(1, Math.round(img.width * scale));
      const dh = Math.max(1, Math.round(img.height * scale));
      g.imageSmoothingEnabled = scale < .999;
      g.drawImage(img, Math.round((w - dw) / 2), Math.round(ay - dh), dw, dh);
    }
    g.imageSmoothingEnabled = false;
    if (quant) quantize(c);
    return c;
  }
  function scaleDownSmooth(srcW, dstW) { return srcW > dstW; }

  A.loadV2Sprites = async function (manifest) {
    const m = manifest || window.SPRITE_MANIFEST_V2 || null;
    A.v2SpriteManifest = m;
    const st = { enabled: !!m, loaded: 0, missing: 0, enemies: [], bosses: [], ambient: [], items: [], props: [], bg: [], rooms: [], car: [], errors: [] };
    A.v2SpriteStatus = st;
    if (!m) return false;
    const cache = new Map();
    const load = src => {
      if (!src || typeof src !== 'string') return Promise.resolve(null);
      if (!cache.has(src)) {
        cache.set(src, v2LoadImage(src).catch(e => { st.errors.push(String(e && e.message || e)); return null; }));
      }
      return cache.get(src);
    };

    // --- NEMICI: servono 4 walk + attack + hurt, altrimenti fallback
    for (const type of Object.keys(m.enemies || {})) {
      const spec = m.enemies[type] || {};
      const walk = Array.isArray(spec.walk) ? spec.walk.slice(0, 4) : [];
      if (walk.length < 4 || !spec.attack || !spec.hurt) { st.missing++; continue; }
      const imgs = await Promise.all([...walk.map(load), load(spec.attack), load(spec.hurt)]);
      if (imgs.some(x => !x)) { st.missing++; continue; }
      A.enemyFrames[type] = imgs.map(img => v2NormalizeEnemy(img, spec.meta));
      st.loaded++;
      st.enemies.push(type);
    }

    // --- BOSS: idle (almeno 1, consigliate 2) + attack + hurt, rage opzionale
    const BOSS_KEYS = { cesare: 'cesare', ursula: 'ursula', ceo: 'ceo' };
    for (const kind of Object.keys(m.bosses || {})) {
      const spec = m.bosses[kind] || {};
      const idlePaths = Array.isArray(spec.idle) ? spec.idle : (spec.idle ? [spec.idle] : []);
      if (!idlePaths.length || !spec.attack || !spec.hurt) { st.missing++; continue; }
      const idleImgs = await Promise.all(idlePaths.map(load));
      const extraImgs = await Promise.all([load(spec.attack), load(spec.hurt), spec.rage ? load(spec.rage) : Promise.resolve(null)]);
      if (idleImgs.some(x => !x) || !extraImgs[0] || !extraImgs[1]) { st.missing++; continue; }
      const meta = spec.meta || {};
      const base = idleImgs[0];
      const w = meta.w || base.width;
      const h = meta.h || base.height;
      const ax = meta.ax != null ? meta.ax : Math.round(w / 2);
      const ay = meta.ay != null ? meta.ay : Math.max(0, h - 8);
      const norm = img => v2NormalizeBossFrame(img, w, h, ay, meta);
      const frames = {
        idle: idleImgs.map(norm),
        attack: norm(extraImgs[0]),
        hurt: norm(extraImgs[1]),
        rage: extraImgs[2] ? norm(extraImgs[2]) : norm(extraImgs[0])
      };
      const art = { w, h, ax, ay, frames };
      if (BOSS_KEYS[kind]) {
        A[kind] = art;
        A[kind + 'Frames'] = frames;
      } else {
        A[kind] = art;
      }
      st.loaded++;
      st.bosses.push(kind);
    }

    // --- AMBIENTALI (SOGEI ecc.): frames + meta anchor
    for (const key of Object.keys(m.ambient || {})) {
      const spec = m.ambient[key] || {};
      const paths = Array.isArray(spec.frames) ? spec.frames : (spec.frames ? [spec.frames] : []);
      if (!paths.length) { st.missing++; continue; }
      const imgs = await Promise.all(paths.map(load));
      if (imgs.some(x => !x)) { st.missing++; continue; }
      const meta = spec.meta || {};
      const base = imgs[0];
      const w = meta.w || base.width;
      const h = meta.h || base.height;
      const ax = meta.ax != null ? meta.ax : Math.round(w / 2);
      const ay = meta.ay != null ? meta.ay : h;
      const frames = imgs.map(img => {
        if (img.width === w && img.height === h) return img;
        const c = canvas(w, h);
        const g = c.getContext('2d');
        const scale = Math.min(w / img.width, h / img.height);
        const dw = Math.max(1, Math.round(img.width * scale));
        const dh = Math.max(1, Math.round(img.height * scale));
        g.imageSmoothingEnabled = scale < .999;
        g.drawImage(img, Math.round((w - dw) / 2), Math.round(h - dh), dw, dh);
        return c;
      });
      const art = { w, h, ax, ay, frames };
      if (key === 'sogeiMonkey' || key === 'sogeiBird' || key === 'sogeiCash') A[key] = art;
      else { A.ambient = A.ambient || {}; A.ambient[key] = art; }
      st.loaded++;
      st.ambient.push(key);
    }

    // --- ITEMS (pickup): game.js li disegna nativi e centrati sul punto
    for (const key of Object.keys(m.items || {})) {
      const spec = m.items[key];
      const src = typeof spec === 'string' ? spec : (spec && spec.src);
      if (!src) { st.missing++; continue; }
      const img = await load(src);
      if (!img) { st.missing++; continue; }
      const meta = (spec && spec.meta) || {};
      // v2.1 — target: meta > taglia consigliata > dimensione procedurale già
      // presente (mantiene le icone compatte per pickup/HUD, 18-30px).
      const base = V2_ITEM_TARGETS[key] || (A.pickups[key] && A.pickups[key].width ? [A.pickups[key].width, A.pickups[key].height] : null);
      const target = (meta.w && meta.h) ? [meta.w, meta.h] : base;
      A.pickups[key] = target ? v2FitCanvas(img, target[0], target[1], meta.smooth) : img;
      st.loaded++;
      st.items.push(key);
    }

    // --- PROPS: game.js li appoggia a terra (y = GROUND - altezza) alla
    // larghezza del PNG: si preservano proporzioni e trasparenza.
    for (const key of Object.keys(m.props || {})) {
      const spec = m.props[key];
      const src = typeof spec === 'string' ? spec : (spec && spec.src);
      if (!src) { st.missing++; continue; }
      const img = await load(src);
      if (!img) { st.missing++; continue; }
      const meta = (spec && spec.meta) || {};
      const target = (meta.w && meta.h) ? [meta.w, meta.h] : V2_PROP_TARGETS[key];
      A.props[key] = target ? v2FitProp(img, target[0], target[1]) : img;
      st.loaded++;
      st.props.push(key);
    }

    // --- BG: sky e arene boss ridimensionate a 640x360; altri fondali
    // (layer parallasse) lasciati nativi perché usano larghezze proprie.
    for (const key of Object.keys(m.bg || {})) {
      const spec = m.bg[key];
      const src = typeof spec === 'string' ? spec : (spec && spec.src);
      if (!src) { st.missing++; continue; }
      const img = await load(src);
      if (!img) { st.missing++; continue; }
      const meta = (spec && spec.meta) || {};
      const screen = !!V2_BG_SCREEN[key] || (meta.width === 640 && meta.height === 360);
      if (screen) {
        A.bg[key] = v2ResizeScreen(img, 640, 360);
        if (img.width !== 640 || img.height !== 360) {
          console.info('[Art] bg PNG v2 "' + key + '" ridimensionato a 640x360 (sorgente ' + img.width + 'x' + img.height + ')');
        }
      } else if (V2_BG_LAYERS[key] || meta.layer) {
        A.bg[key] = v2NormalizeBgLayer(img);
        if (img.height !== 360) {
          console.info('[Art] bg layer PNG v2 "' + key + '": altezza ' + img.height + ' -> 360 (nearest), larghezza ' + img.width);
        }
        if (A.bg[key].width < 640) {
          console.warn('[Art] bg layer PNG v2 "' + key + '" largo ' + A.bg[key].width + 'px (< 640): il crop parallasse potrebbe mostrare bordi vuoti.');
        }
      } else if (meta.w && meta.h) {
        A.bg[key] = v2FitCanvas(img, meta.w, meta.h, meta.smooth);
      } else {
        A.bg[key] = img;
      }
      st.loaded++;
      st.bg.push(key);
    }

    // --- STANZE DIREZIONE (v2.1): vignette AI 48x88 per tipo stanza.
    // Sostituiscono A.direzioneRoomArt[tipo] e vengono marcate AI per saltare
    // gli effetti procedurali (l'NPC è già dentro l'immagine).
    A.direzioneRoomArt = A.direzioneRoomArt || {};
    A.direzioneRoomAIArt = A.direzioneRoomAIArt || {};
    A.direzioneRoomAI = A.direzioneRoomAI || {};
    for (const type of Object.keys(m.direzioneRooms || {})) {
      const spec = m.direzioneRooms[type];
      const src = typeof spec === 'string' ? spec : (spec && spec.src);
      if (!src) { st.missing++; continue; }
      const img = await load(src);
      if (!img) { st.missing++; continue; }
      const roomCanvas = v2NormalizeRoom(img);
      A.direzioneRoomArt[type] = roomCanvas;
      A.direzioneRoomAIArt[type] = roomCanvas;
      A.direzioneRoomAI[type] = true;
      st.loaded++;
      st.rooms.push(type);
    }

    // --- AUTO (Fiat Tipo 3 volumi): frames animati + anchor + finestrino
    // opzionale (meta.window) per level-gameplay (CAR_WINDOW in game.js).
    // Sezione assente/vuota -> resta l'auto procedurale di Art.buildPescaraArt.
    const carSpec = m.tipoCar && (Array.isArray(m.tipoCar) ? { frames: m.tipoCar } : m.tipoCar);
    if (carSpec) {
      const carFrames = Array.isArray(carSpec.frames) ? carSpec.frames : (carSpec.frames ? [carSpec.frames] : []);
      if (!carFrames.length) {
        st.missing++;
      } else {
        const imgs = await Promise.all(carFrames.map(load));
        if (imgs.some(x => !x)) {
          st.missing++;
        } else {
          const meta = carSpec.meta || {};
          const base = imgs[0];
          const w = meta.w || base.width;
          const h = meta.h || base.height;
          const ax = meta.ax != null ? meta.ax : 60;
          const ay = meta.ay != null ? meta.ay : 92;
          const frames = imgs.map(img => v2NormalizeCarFrame(img, w, h, ay, meta));
          const art = { w, h, ax, ay, frames };
          if (meta.window) {
            const win = meta.window;
            art.window = {
              x: Number(win.x) || 0, y: Number(win.y) || 0,
              w: Number(win.w) || 0, h: Number(win.h) || 0
            };
            // alias piatto per il gameplay (game.js ha CAR_WINDOW fisso:
            // finché non lo legge, il "buco finestrino" resta alle coord. attuali)
            A.tipoCarWindow = art.window;
          } else {
            A.tipoCarWindow = null;
          }
          A.tipoCar = art;
          st.loaded++;
          st.car.push('tipoCar');
          if (art.window) {
            console.info('[Art] tipoCar PNG v2: finestrino da manifest', JSON.stringify(art.window),
              '— game.js usa ancora CAR_WINDOW fisso finché level-gameplay non lo legge.');
          }
        }
      }
    }

    // Cache degli artefatti PNG caricati: serve a RIAPPLICARE gli override
    // quando l'arte procedurale di un tema viene costruita più tardi (build
    // lazy). Le build lazy non devono perdere i PNG v2 già caricati al boot.
    const loadedCache = { enemies: {}, bosses: {}, ambient: {}, items: {}, props: {}, bg: {}, rooms: {}, car: null };
    for (const t of st.enemies) if (A.enemyFrames && A.enemyFrames[t]) loadedCache.enemies[t] = A.enemyFrames[t];
    for (const k of st.bosses) { if (A[k]) loadedCache.bosses[k] = A[k]; }
    for (const k of st.ambient) { if (A[k]) loadedCache.ambient[k] = A[k]; }
    for (const k of st.items) if (A.pickups && A.pickups[k]) loadedCache.items[k] = A.pickups[k];
    if (loadedCache.items.scontrino) loadedCache.items.scontrinoGun = loadedCache.items.scontrino;
    if (loadedCache.items.spritz) loadedCache.items.spritzGun = loadedCache.items.spritz;
    for (const k of st.props) if (A.props && A.props[k]) loadedCache.props[k] = A.props[k];
    for (const k of st.bg) if (A.bg && A.bg[k]) loadedCache.bg[k] = A.bg[k];
    for (const t of st.rooms) if (A.direzioneRoomAIArt && A.direzioneRoomAIArt[t]) loadedCache.rooms[t] = A.direzioneRoomAIArt[t];
    if (st.car.length && A.tipoCar) loadedCache.car = A.tipoCar;
    A.v2Loaded = loadedCache;

    if (st.loaded) {
      console.info('[Art] Sprite PNG v2 attivi:', st.loaded, '| fallback procedurali:', st.missing);
    } else if (st.missing) {
      console.info('[Art] Sprite PNG v2 assenti: uso i fallback procedurali.');
    }
    return st.loaded > 0;
  };

  /* Riapplica gli override PNG v2 dopo una build lazy: Art.ensureTheme(tema)
     costruisce l'arte procedurale e potrebbe sovrascrivere i frame PNG già
     caricati. Questa funzione rimette i PNG caricati sopra l'arte procedurale. */
  A.reapplyV2 = function () {
    const v = A.v2Loaded;
    if (!v || !A.v2SpriteStatus || !A.v2SpriteStatus.loaded) return 0;
    let n = 0;
    for (const k of Object.keys(v.enemies || {})) { A.enemyFrames[k] = v.enemies[k]; n++; }
    for (const k of Object.keys(v.bosses || {})) {
      A[k] = v.bosses[k];
      if (A[k].frames) A[k + 'Frames'] = A[k].frames;
      n++;
    }
    for (const k of Object.keys(v.ambient || {})) { A[k] = v.ambient[k]; n++; }
    for (const k of Object.keys(v.items || {})) { A.pickups[k] = v.items[k]; n++; }
    if (A.pickups.scontrino) A.pickups.scontrinoGun = A.pickups.scontrino;
    if (A.pickups.spritz) A.pickups.spritzGun = A.pickups.spritz;
    for (const k of Object.keys(v.props || {})) { A.props[k] = v.props[k]; n++; }
    for (const k of Object.keys(v.bg || {})) { A.bg[k] = v.bg[k]; n++; }
    // v2.1 — le stanze AI non devono essere sovrascritte dalla ricomposizione
    // procedurale (buildDirezioneRooms può essere richiamata dopo i PNG v1).
    for (const t of Object.keys(v.rooms || {})) {
      A.direzioneRoomArt = A.direzioneRoomArt || {};
      A.direzioneRoomAI = A.direzioneRoomAI || {};
      A.direzioneRoomAIArt = A.direzioneRoomAIArt || {};
      A.direzioneRoomArt[t] = v.rooms[t];
      A.direzioneRoomAIArt[t] = v.rooms[t];
      A.direzioneRoomAI[t] = true;
      n++;
    }
    if (v.car) {
      A.tipoCar = v.car;
      A.tipoCarWindow = v.car.window || null;
      n++;
    }
    return n;
  };

  A.hasV2Sprite = function (kind, name) {
    const st = A.v2SpriteStatus || {};
    if (kind === 'enemy') return (st.enemies || []).indexOf(name) >= 0;
    if (kind === 'boss') return (st.bosses || []).indexOf(name) >= 0;
    if (kind === 'ambient') return (st.ambient || []).indexOf(name) >= 0;
    if (kind === 'item' || kind === 'pickup') return (st.items || []).indexOf(name) >= 0;
    if (kind === 'prop') return (st.props || []).indexOf(name) >= 0;
    if (kind === 'bg') return (st.bg || []).indexOf(name) >= 0;
    if (kind === 'car' || kind === 'tipoCar') return (st.car || []).indexOf('tipoCar') >= 0;
    if (kind === 'room' || kind === 'direzioneRoom') return (st.rooms || []).indexOf(name) >= 0;
    return false;
  };

  A.makeAdelePortrait = function (target) {
    const ctx = target.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, target.width, target.height);
    // poster background
    const grad = ctx.createLinearGradient(0, 0, target.width, target.height);
    grad.addColorStop(0, '#4a174b');
    grad.addColorStop(.55, '#1f1a3f');
    grad.addColorStop(1, '#0b1020');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, target.width, target.height);
    // sunburst
    ctx.save();
    ctx.translate(target.width * .52, target.height * .45);
    for (let i = 0; i < 14; i++) {
      ctx.rotate(TAU / 14);
      ctx.fillStyle = i % 2 ? 'rgba(255,78,157,.09)' : 'rgba(255,200,75,.055)';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(150, -22); ctx.lineTo(150, 22); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // halftone dots
    ctx.fillStyle = 'rgba(255,248,231,.14)';
    for (let y = 10; y < target.height; y += 13) {
      for (let x = (y / 13 % 2) * 6; x < target.width; x += 13) {
        ctx.fillRect(x, y, 2, 2);
      }
    }
    // floor / frame stripe
    ctx.fillStyle = '#ffc84b';
    ctx.fillRect(0, target.height - 12, target.width, 3);
    ctx.fillStyle = '#ff5b9d';
    ctx.fillRect(0, target.height - 8, target.width, 2);
    // figura intera: la scheda deve mostrare divisa, arma e scarpe
    const frame = A.getPlayerFrame({ mode: 'idle', phase: .12 });
    const scale = 2.0;
    const dw = PLAYER_W * scale, dh = PLAYER_H * scale;
    const dx = target.width / 2 - PLAYER_AX * scale + 5;
    const dy = 4;
    ctx.fillStyle = 'rgba(255,200,75,.08)';
    ctx.beginPath();
    ctx.ellipse(target.width * .52, target.height - 26, 45, 11, 0, 0, TAU);
    ctx.fill();
    // ombra ai piedi
    ctx.fillStyle = 'rgba(6,5,12,.45)';
    ctx.beginPath();
    ctx.ellipse(target.width * .52, target.height - 17, 28, 6, 0, 0, TAU);
    ctx.fill();
    ctx.drawImage(frame, dx, dy, dw, dh);
    // foreground graphic lines
    ctx.fillStyle = 'rgba(10,8,18,.8)';
    ctx.fillRect(0, 0, 5, target.height);
    ctx.fillRect(target.width - 5, 0, 5, target.height);
    ctx.fillStyle = 'rgba(255,248,231,.2)';
    ctx.fillRect(0, 0, target.width, 1);
    // pixel shine
    ctx.fillStyle = '#ff90b8';
    ctx.fillRect(target.width - 27, 16, 8, 2);
    ctx.fillRect(target.width - 21, 16, 2, 8);
  };

  /* =========================================================
     NEMICI — pretendenti, boomer, utenti, polpo
     ========================================================= */

  const ENEMY_W = 84, ENEMY_H = 88, ENEMY_AY = 84;
  A.ENEMY = { w: ENEMY_W, h: ENEMY_H, ax: 42, ay: ENEMY_AY };

  function suitOutline(g, color = '#0b0812') {
    g.lineJoin = 'round';
    g.strokeStyle = color;
  }

  function paintPretender(o) {
    const g = canvas(84, 90).getContext('2d');
    const img = g.canvas;
    const mode = o.mode || 'walk';
    const t = o.phase || 0;
    const walk = Math.sin(t * TAU);
    const lean = mode === 'kiss' ? 3 : mode === 'throw' ? -1 : 0;
    const bob = mode === 'walk' ? Math.abs(walk) * 1.2 : Math.sin(t * TAU) * .5;
    g.save();
    g.translate(lean, bob * .2);

    // back leg and front leg (tight burgundy trousers)
    if (mode === 'walk') {
      outlinedLimb(g, 42, 62, 40, 73, 10, '#5a0c30', '#0b0812');
      outlinedLimb(g, 40, 73, 36 + walk * 4, 84, 8, '#8f154d', '#0b0812');
      rect(g, 30 + walk * 4, 82, 13, 5, '#1a1222');
      outlinedLimb(g, 49, 62, 54, 73, 10, '#5a0c30', '#0b0812');
      outlinedLimb(g, 54, 73, 59 - walk * 4, 84, 8, '#8f154d', '#0b0812');
      rect(g, 54 - walk * 4, 82, 13, 5, '#1a1222');
    } else {
      outlinedLimb(g, 42, 63, 41, 75, 9, '#5a0c30', '#0b0812');
      outlinedLimb(g, 41, 75, 38, 84, 7, '#8f154d', '#0b0812');
      rect(g, 32, 82, 13, 5, '#1a1222');
      outlinedLimb(g, 49, 63, 53, 75, 9, '#5a0c30', '#0b0812');
      outlinedLimb(g, 53, 75, 58, 84, 7, '#8f154d', '#0b0812');
      rect(g, 53, 82, 13, 5, '#1a1222');
    }

    // torso — unbuttoned shirt and hairy chest
    g.beginPath();
    g.moveTo(32, 38); g.lineTo(56, 38); g.lineTo(61, 60); g.lineTo(29, 62); g.closePath();
    g.fillStyle = '#a31e46'; g.fill();
    g.strokeStyle = '#0b0812'; g.lineWidth = 2.2; g.stroke();
    // chest
    g.beginPath();
    g.moveTo(39, 39); g.lineTo(50, 39); g.lineTo(54, 58); g.lineTo(37, 59); g.closePath();
    g.fillStyle = '#d99672'; g.fill();
    g.fillStyle = '#cb7c5f';
    g.fillRect(42, 45, 2, 5); g.fillRect(47, 43, 2, 6); g.fillRect(44, 51, 5, 1.5);
    // shirt lapels
    poly(g, [[31, 38], [40, 38], [36, 52], [28, 58]], '#c62265');
    poly(g, [[56, 38], [48, 38], [53, 55], [62, 59]], '#c62265');
    line(g, 39, 39, 37, 57, '#5a0c30', 1.2);
    line(g, 50, 39, 53, 56, '#5a0c30', 1.2);
    // chest hair curls
    g.strokeStyle = '#38220f'; g.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.arc(43 + i * 2.5, 44 + (i % 2) * 3, 2, 0, Math.PI * 1.5); g.stroke();
    }
    // gold chain
    g.strokeStyle = '#ffc84b'; g.lineWidth = 1.8;
    g.beginPath(); g.arc(45, 40, 8, .5, Math.PI - .3); g.stroke();
    circle(g, 45, 48, 2, '#ffc84b');
    circle(g, 45, 48, 1, '#8d5016');
    // shirt buttons
    for (let i = 0; i < 3; i++) rect(g, 44, 52 + i * 3, 2, 2, '#ffe7c6');
    // belt
    rect(g, 34, 58, 24, 4, '#1a1222');
    rect(g, 45, 58, 4, 4, '#ffc84b');

    // arms: one holding rose, other making a kiss/finger gun
    if (mode === 'throw') {
      outlinedLimb(g, 55, 43, 65, 35, 6, '#d99672', '#0b0812');
      outlinedLimb(g, 65, 35, 68, 21, 5, '#f0b98f', '#0b0812');
      circle(g, 68, 20, 3.5, '#f0b98f');
      // rose
      line(g, 68, 20, 68, 13, '#2f8a3f', 1.8);
      g.beginPath(); g.ellipse(65, 14, 5, 3, -.5, 0, TAU); g.fillStyle = '#2f8a3f'; g.fill();
      circle(g, 69, 11, 4, '#c62265');
      circle(g, 69, 10, 2.6, '#ff5b9d');
      circle(g, 69, 9, 1.2, '#ffbfd8');
    } else {
      outlinedLimb(g, 55, 44, 63, 50, 6, '#d99672', '#0b0812');
      outlinedLimb(g, 63, 50, 70, 47, 5, '#f0b98f', '#0b0812');
      circle(g, 71, 47, 3.4, '#f0b98f');
      if (mode === 'kiss') {
        heartShape(g, 77, 40, 4.5, '#ff5b9d', .2);
        heartShape(g, 31, 33, 3, '#ff90b8', -.4);
      }
      // left arm on hip
      outlinedLimb(g, 34, 43, 26, 49, 6, '#d99672', '#0b0812');
      outlinedLimb(g, 26, 49, 31, 57, 5, '#f0b98f', '#0b0812');
      circle(g, 31, 57, 3, '#f0b98f');
    }

    // head — greasy pompadour and heart eyes
    g.save();
    const hy = 26;
    // neck
    g.fillStyle = '#cb7c5f'; g.fillRect(41, 34, 8, 6);
    // face long and sleazy
    g.beginPath();
    g.moveTo(32, hy - 5);
    g.bezierCurveTo(33, hy - 14, 51, hy - 15, 55, hy - 5);
    g.bezierCurveTo(58, hy + 2, 55, hy + 10, 48, hy + 12);
    g.bezierCurveTo(41, hy + 13, 34, hy + 7, 32, hy - 5);
    g.closePath();
    g.fillStyle = '#f0b98f'; g.fill();
    g.strokeStyle = '#0b0812'; g.lineWidth = 2.2; g.stroke();
    // stubble
    g.fillStyle = '#cb7c5f';
    g.fillRect(36, hy + 7, 12, 3);
    for (let i = 0; i < 9; i++) g.fillRect(37 + (i * 3) % 11, hy + 7 + (i % 2), 1, 1);
    // ears
    circle(g, 32, hy + 1, 3, '#d99672');
    circle(g, 56, hy + 1, 3, '#d99672');
    // heart eyes
    if (mode === 'hurt') {
      line(g, 36, hy - 1, 41, hy + 2, '#1a1222', 1.5);
      line(g, 48, hy + 2, 53, hy - 1, '#1a1222', 1.5);
    } else {
      g.fillStyle = '#fff8e7';
      g.fillRect(35.5, hy - 3, 6, 4.2);
      g.fillRect(48.5, hy - 3, 6, 4.2);
      g.strokeStyle = '#0b0812'; g.lineWidth = .9;
      g.strokeRect(35.5, hy - 3, 6, 4.2);
      g.strokeRect(48.5, hy - 3, 6, 4.2);
      heartShape(g, 38.5, hy - .7, 2.5, '#ef367f', 0);
      heartShape(g, 51.5, hy - .7, 2.5, '#ef367f', 0);
      // ciglia e sopracciglia
      line(g, 35.2, hy - 3.2, 41.6, hy - 3.4, '#1a1222', .9);
      line(g, 48.2, hy - 3.4, 54.8, hy - 3.2, '#1a1222', .9);
      line(g, 35, hy - 5, 42, hy - 6, '#5c3415', 2);
      line(g, 48, hy - 6, 55, hy - 5, '#5c3415', 2);
      // sorriso sfrontato
      line(g, 43, hy + 9, 52, hy + 8, '#8f154d', 1.2);
    }
    // nose
    g.beginPath(); g.moveTo(45, hy + 1); g.lineTo(43, hy + 5); g.lineTo(47, hy + 5); g.strokeStyle = '#cb7c5f'; g.lineWidth = 1.1; g.stroke();
    // lips
    if (mode === 'kiss') {
      ellipse(g, 49, hy + 9, 4.3, 3.2, '#c62265');
      ellipse(g, 49, hy + 9, 2, 1.4, '#8f154d');
      g.strokeStyle = '#5a0c30'; g.lineWidth = .8; g.stroke();
    } else {
      g.beginPath(); g.moveTo(41, hy + 9); g.quadraticCurveTo(49, hy + 12, 54, hy + 8);
      g.strokeStyle = '#8f154d'; g.lineWidth = 1.6; g.stroke();
    }
    // hair pompadour
    g.beginPath();
    g.moveTo(31, hy - 5);
    g.bezierCurveTo(28, hy - 15, 39, hy - 19, 46, hy - 14);
    g.bezierCurveTo(53, hy - 19, 59, hy - 10, 56, hy - 4);
    g.bezierCurveTo(51, hy - 8, 40, hy - 7, 34, hy - 2);
    g.closePath();
    g.fillStyle = '#1a1222'; g.fill();
    g.strokeStyle = '#0b0812'; g.lineWidth = 1.5; g.stroke();
    line(g, 36, hy - 11, 43, hy - 13, '#4a2b44', 1.4);
    // sideburns
    rect(g, 31, hy + 2, 2, 4, '#1a1222');
    rect(g, 55, hy + 2, 2, 4, '#1a1222');
    // big gold hoop
    g.strokeStyle = '#0b0812'; g.lineWidth = 3.2; g.beginPath(); g.arc(57, hy + 6, 3.2, -.2, 3.5); g.stroke();
    g.strokeStyle = '#ffc84b'; g.lineWidth = 1.8; g.beginPath(); g.arc(57, hy + 6, 3.2, -.2, 3.5); g.stroke();
    g.restore();

    // smell lines and little hearts
    if (mode === 'kiss' || mode === 'throw') {
      g.strokeStyle = '#ff90b8'; g.lineWidth = 1.1;
      g.beginPath(); g.arc(64, 18, 4, -.6, 1.4); g.stroke();
      g.beginPath(); g.arc(69, 13, 5, -.8, 1.2); g.stroke();
      heartShape(g, 72, 24, 2.2, '#ff5b9d', .4);
    }

    g.restore();
    quantize(img);
    return img;
  }

  function paintBoomer(o) {
    const g = canvas(86, 92).getContext('2d');
    const img = g.canvas;
    const mode = o.mode || 'walk';
    const t = o.phase || 0;
    const walk = Math.sin(t * TAU);
    const bob = mode === 'walk' ? Math.abs(walk) * 1.2 : Math.sin(t * TAU) * .5;
    g.save();
    g.translate(0, bob * .2);

    // slippers and trousers
    const legOffset = mode === 'walk' ? walk * 4 : 0;
    line(g, 42, 64, 39 + legOffset, 82, '#0b0812', 11);
    line(g, 42, 64, 39 + legOffset, 82, '#9e8c68', 8);
    line(g, 54, 64, 56 - legOffset, 82, '#0b0812', 11);
    line(g, 54, 64, 56 - legOffset, 82, '#cbb98e', 8);
    // slippers
    g.beginPath(); g.ellipse(37 + legOffset, 83, 8, 4, 0, 0, TAU); g.fillStyle = '#5a0c30'; g.fill();
    g.strokeStyle = '#0b0812'; g.lineWidth = 1.6; g.stroke();
    g.beginPath(); g.ellipse(59 - legOffset, 83, 8, 4, 0, 0, TAU); g.fillStyle = '#5a0c30'; g.fill(); g.stroke();
    // socks
    rect(g, 36 + legOffset, 77, 7, 4, '#fffdf2');

    // stout torso with beige cardigan
    g.beginPath();
    g.moveTo(28, 39); g.lineTo(58, 39);
    g.bezierCurveTo(66, 45, 65, 60, 59, 66);
    g.lineTo(30, 66);
    g.bezierCurveTo(23, 55, 23, 46, 28, 39);
    g.closePath();
    g.fillStyle = '#cbb98e'; g.fill();
    g.strokeStyle = '#0b0812'; g.lineWidth = 2.2; g.stroke();
    // undershirt
    g.beginPath(); g.moveTo(38, 39); g.lineTo(50, 39); g.lineTo(48, 58); g.lineTo(40, 58); g.closePath();
    g.fillStyle = '#fff8e7'; g.fill();
    g.fillStyle = '#e6d5b0'; g.fillRect(42, 42, 1, 13);
    // cravatta e catena dell'orologio
    poly(g, [[42, 41], [47, 41], [46, 52], [44, 56], [42, 52]], '#7a3146');
    g.strokeStyle = '#ffc84b'; g.lineWidth = .7;
    g.beginPath(); g.arc(44, 49, 8, .4, 2.5); g.stroke();
    circle(g, 35, 55, 1.5, '#ffc84b');
    // cardigan buttons
    for (let i = 0; i < 3; i++) { circle(g, 43, 45 + i * 6, 1.2, '#5c3415'); }
    // pockets
    g.strokeStyle = '#9e8c68'; g.lineWidth = 1; g.strokeRect(31, 52, 7, 5); g.strokeRect(55, 52, 7, 5);
    // belly
    ellipse(g, 43, 60, 11, 7, '#e6d5b0');
    g.strokeStyle = '#0b0812'; g.lineWidth = 2; g.beginPath(); g.arc(43, 60, 11, 0, Math.PI); g.stroke();
    // belt under belly
    rect(g, 31, 64, 27, 3, '#38220f');

    // left arm with printed module
    outlinedLimb(g, 28, 44, 22, 53, 6, '#cbb98e', '#0b0812');
    outlinedLimb(g, 22, 53, 25, 62, 5, '#e7a67d', '#0b0812');
    g.save();
    g.translate(26, 61); g.rotate(-.15);
    g.fillStyle = '#fff8e7'; g.fillRect(0, 0, 10, 13);
    g.strokeStyle = '#1a1222'; g.lineWidth = 1; g.strokeRect(0, 0, 10, 13);
    for (let i = 0; i < 4; i++) { g.fillStyle = i === 3 ? '#c62265' : '#7280b3'; g.fillRect(2, 2 + i * 3, 5, .8); }
    g.restore();

    // right arm and giant stamp
    const raise = mode === 'throw' ? 1 : 0;
    if (raise) {
      outlinedLimb(g, 57, 43, 69, 31, 6.5, '#cbb98e', '#0b0812');
      outlinedLimb(g, 69, 31, 70, 18, 5.2, '#e7a67d', '#0b0812');
      circle(g, 70, 17, 3.5, '#f0b98f');
      // giant rubber stamp raised
      g.save();
      g.translate(70, 16); g.rotate(-.35);
      rect(g, -6, -12, 13, 8, '#8d5016');
      rect(g, -4, -16, 9, 4, '#5c3415');
      rect(g, -8, -4, 18, 4, '#1a1222');
      rect(g, -10, 0, 22, 7, '#c62265');
      rect(g, -8, 1, 18, 4, '#8f154d');
      g.fillStyle = '#ffe7c6'; g.font = 'bold 3px monospace'; g.fillText('TIMBRA', -7, 5);
      g.restore();
    } else {
      outlinedLimb(g, 58, 44, 62, 54, 6, '#cbb98e', '#0b0812');
      outlinedLimb(g, 62, 54, 65, 63, 5, '#e7a67d', '#0b0812');
      circle(g, 65, 64, 3, '#f0b98f');
      // stamp at rest
      g.save(); g.translate(65, 69); g.rotate(.08);
      rect(g, -8, -7, 16, 5, '#8d5016');
      rect(g, -10, -2, 20, 6, '#c62265');
      rect(g, -9, -1, 18, 3, '#8f154d');
      g.restore();
    }

    // head — bald with white side tufts
    const hy = 25;
    // face
    g.beginPath();
    g.moveTo(31, hy - 4);
    g.bezierCurveTo(32, hy - 12, 50, hy - 13, 55, hy - 4);
    g.bezierCurveTo(58, hy + 3, 54, hy + 9, 49, hy + 11);
    g.bezierCurveTo(42, hy + 12, 34, hy + 7, 31, hy - 4);
    g.closePath();
    g.fillStyle = '#f0b98f'; g.fill();
    g.strokeStyle = '#0b0812'; g.lineWidth = 2.2; g.stroke();
    // ears
    circle(g, 31, hy + 1, 3.3, '#e7a67d'); circle(g, 55, hy + 1, 3.3, '#e7a67d');
    // bald crown
    g.beginPath(); g.ellipse(43, hy - 8, 11, 6, 0, Math.PI, TAU);
    g.fillStyle = '#f0b98f'; g.fill(); g.strokeStyle = '#0b0812'; g.lineWidth = 1.4; g.stroke();
    // white hair tufts
    let tuft = '';
    for (let i = 0; i < 4; i++) {
      g.beginPath(); g.arc(31 + i * 1.4, hy - 6, 2.4, 2.9, 6.2); g.fillStyle = '#fffdf2'; g.fill();
      g.beginPath(); g.arc(55 - i * 1.2, hy - 6, 2.3, 3.1, 0); g.fillStyle = '#fffdf2'; g.fill();
    }
    // wrinkles
    g.strokeStyle = '#cb7c5f'; g.lineWidth = .7;
    g.beginPath(); g.moveTo(36, hy + 1); g.lineTo(40, hy + 1.5); g.stroke();
    g.beginPath(); g.moveTo(46, hy + 1.5); g.lineTo(51, hy + 1); g.stroke();
    g.beginPath(); g.moveTo(35, hy + 5); g.lineTo(39, hy + 6); g.stroke();
    g.beginPath(); g.moveTo(47, hy + 6); g.lineTo(52, hy + 5); g.stroke();
    // angry eyebrows
    line(g, 34, hy - 3, 41, hy - 1.4, '#e6d5b0', 2.2);
    line(g, 47, hy - 1.4, 54, hy - 3, '#e6d5b0', 2.2);
    // round glasses
    g.strokeStyle = '#38220f'; g.lineWidth = 1.2;
    g.beginPath(); g.arc(38, hy + 1.8, 4.5, 0, TAU); g.stroke();
    g.beginPath(); g.arc(50, hy + 1.8, 4.5, 0, TAU); g.stroke();
    line(g, 42.5, hy + 1.8, 45.5, hy + 1.8, '#38220f', 1.2);
    g.fillStyle = 'rgba(159,193,234,.55)'; g.beginPath(); g.arc(38, hy + 1.8, 3.8, 0, TAU); g.fill();
    g.beginPath(); g.arc(50, hy + 1.8, 3.8, 0, TAU); g.fill();
    g.fillStyle = '#1a1222'; g.fillRect(37, hy + 1, 2, 2); g.fillRect(49, hy + 1, 2, 2);
    // mustache
    g.beginPath(); g.moveTo(37, hy + 8); g.quadraticCurveTo(43, hy + 6, 46, hy + 8); g.quadraticCurveTo(50, hy + 6, 54, hy + 8);
    g.strokeStyle = '#fffdf2'; g.lineWidth = 2.2; g.stroke();
    // mouth frown
    g.beginPath(); g.arc(45, hy + 13, 4, 3.4, 6.0); g.strokeStyle = '#8f154d'; g.lineWidth = 1.2; g.stroke();
    g.restore();

    if (mode === 'throw') {
      g.strokeStyle = '#ff845d'; g.lineWidth = 1;
      g.beginPath(); g.arc(72, 10, 4, .2, 1.9); g.stroke();
    }
    quantize(img);
    return img;
  }

  function paintUtente(o) {
    const g = canvas(84, 90).getContext('2d');
    const img = g.canvas;
    const mode = o.mode || 'walk';
    const t = o.phase || 0;
    const walk = Math.sin(t * TAU);
    const bob = mode === 'walk' ? Math.abs(walk) * 1.1 : Math.sin(t * TAU) * .5;
    g.save();
    g.translate(0, bob * .2);
    // sensible shoes and dark trousers
    outlinedLimb(g, 41, 62, 40 + walk * 4, 82, 8, '#2e3a50', '#0b0812');
    rect(g, 33 + walk * 4, 81, 13, 4, '#1a1222');
    outlinedLimb(g, 52, 62, 55 - walk * 4, 82, 8, '#2e3a50', '#0b0812');
    rect(g, 53 - walk * 4, 81, 13, 4, '#1a1222');

    // jacket torso
    g.beginPath();
    g.moveTo(28, 38); g.lineTo(58, 38); g.lineTo(60, 64); g.lineTo(26, 64); g.closePath();
    g.fillStyle = '#293a6b'; g.fill();
    g.strokeStyle = '#0b0812'; g.lineWidth = 2.2; g.stroke();
    // white shirt and angry tie
    poly(g, [[38, 38], [48, 38], [46, 55], [36, 55]], '#fff8e7');
    poly(g, [[41, 39], [46, 39], [45, 48], [43, 54], [41, 48]], '#c62265');
    // lapels
    poly(g, [[28, 38], [38, 38], [34, 51], [27, 56]], '#3f528a');
    poly(g, [[58, 38], [48, 38], [52, 51], [61, 56]], '#3f528a');
    // badge lanyard with dogana ID
    g.strokeStyle = '#37d6c3'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(36, 39); g.lineTo(30, 48); g.stroke();
    rect(g, 27, 47, 8, 10, '#fff8e7');
    rect(g, 28, 48, 6, 3, '#37d6c3');
    for (let i = 0; i < 3; i++) rect(g, 28, 52 + i * 1.7, 5, .8, '#7280b3');
    // shoulder seams
    g.strokeStyle = '#1a264a'; g.lineWidth = 1.2; g.lineWidth = 1;
    line(g, 28, 46, 31, 45, '#1a264a', 1);
    line(g, 58, 46, 55, 45, '#1a264a', 1);

    // left hand clutching forms
    outlinedLimb(g, 28, 43, 22, 52, 6, '#293a6b', '#0b0812');
    outlinedLimb(g, 22, 52, 24, 61, 4.8, '#ffd5ad', '#0b0812');
    g.save(); g.translate(20, 56); g.rotate(-.16);
    for (let i = 0; i < 3; i++) {
      g.fillStyle = i === 0 ? '#fff8e7' : '#e6d5b0';
      g.fillRect(i * 1.4, i * 1.7, 10, 13);
      g.strokeStyle = '#7280b3'; g.lineWidth = .7; g.strokeRect(i * 1.4, i * 1.7, 10, 13);
      g.fillStyle = '#c62265'; g.fillRect(i * 1.4 + 2, i * 1.7 + 2, 4, 1);
    }
    g.restore();

    // smartphone arm
    if (mode === 'shoot') {
      outlinedLimb(g, 58, 42, 66, 46, 6, '#293a6b', '#0b0812');
      outlinedLimb(g, 66, 46, 72, 45, 4.8, '#ffd5ad', '#0b0812');
      g.save(); g.translate(72, 40); g.rotate(-.1);
      // phone glow
      g.fillStyle = 'rgba(55,214,195,.28)'; g.beginPath(); g.arc(0, 3, 10, 0, TAU); g.fill();
      rect(g, -3, -3, 8, 13, '#1a1222');
      rect(g, -2, -2, 6, 10, '#37d6c3');
      for (let i = 0; i < 3; i++) rect(g, 0, 0 + i * 2.2, 2.5, 1, '#0b0812');
      g.restore();
      circle(g, 72, 45, 2.8, '#ffd5ad');
      // bureaucratic shockwave rings
      g.strokeStyle = '#ff845d'; g.lineWidth = 1.5;
      g.beginPath(); g.arc(77, 42, 8, -.9, .9); g.stroke();
      g.strokeStyle = '#ffc84b'; g.lineWidth = .9;
      g.beginPath(); g.arc(77, 42, 13, -.7, .7); g.stroke();
    } else {
      outlinedLimb(g, 58, 43, 64, 51, 6, '#293a6b', '#0b0812');
      outlinedLimb(g, 64, 51, 61, 60, 4.8, '#ffd5ad', '#0b0812');
      circle(g, 61, 61, 3, '#ffd5ad');
      g.save(); g.translate(61, 55);
      rect(g, -1, -3, 5, 9, '#1a1222');
      rect(g, 0, -2, 3, 6, '#37d6c3');
      g.restore();
    }

    // head (angry, receding hairline, stubble)
    const hy = 25;
    rect(g, 43, 33, 7, 6, '#e7a67d');
    g.beginPath();
    g.moveTo(31, hy - 5);
    g.bezierCurveTo(32, hy - 13, 52, hy - 14, 55, hy - 5);
    g.bezierCurveTo(58, hy + 2, 55, hy + 9, 49, hy + 11);
    g.bezierCurveTo(41, hy + 12, 34, hy + 7, 31, hy - 5);
    g.closePath();
    g.fillStyle = '#f6c7a3'; g.fill();
    g.strokeStyle = '#0b0812'; g.lineWidth = 2.2; g.stroke();
    // receding hairline dark brown
    g.beginPath();
    g.moveTo(32, hy - 4);
    g.bezierCurveTo(34, hy - 12, 45, hy - 13, 48, hy - 8);
    g.bezierCurveTo(44, hy - 10, 38, hy - 7, 35, hy - 2);
    g.closePath();
    g.fillStyle = '#5c3415'; g.fill();
    g.beginPath(); g.arc(54, hy - 4, 6, 3.4, 5.5); g.fillStyle = '#5c3415'; g.fill();
    // stubble
    g.fillStyle = 'rgba(92,52,21,.4)'; g.fillRect(35, hy + 7, 15, 3);
    // ears
    circle(g, 31, hy + 1, 3, '#e7a67d'); circle(g, 55, hy + 1, 3, '#e7a67d');
    // angry eyebrows
    line(g, 34, hy - 3, 41, hy - .5, '#38220f', 2.4);
    line(g, 46, hy - .5, 53, hy - 3, '#38220f', 2.4);
    // eyes
    rect(g, 35, hy - .6, 5, 3, '#fffdf2');
    rect(g, 47, hy - .6, 5, 3, '#fffdf2');
    rect(g, 37, hy, 2, 2, '#1a1222');
    rect(g, 49, hy, 2, 2, '#1a1222');
    // nose
    g.beginPath(); g.moveTo(44, hy + 1); g.lineTo(42, hy + 6); g.lineTo(46, hy + 6); g.strokeStyle = '#cb7c5f'; g.lineWidth = 1.3; g.stroke();
    // angry mouth
    g.beginPath(); g.moveTo(38, hy + 9); g.quadraticCurveTo(44, hy + 6, 50, hy + 9); g.strokeStyle = '#66192a'; g.lineWidth = 1.5; g.stroke();
    // forehead veins
    g.strokeStyle = '#c62265'; g.lineWidth = .8;
    g.beginPath(); g.moveTo(46, hy - 8); g.lineTo(48, hy - 6); g.lineTo(46, hy - 5); g.stroke();
    g.restore();
    quantize(img);
    return img;
  }

  function paintFinanziere(o) {
    const g = canvas(84, 90).getContext('2d');
    const img = g.canvas;
    const mode = o.mode || 'walk';
    const t = o.phase || 0;
    const walk = mode === 'walk' ? Math.sin(t * TAU) : 0;
    const bob = mode === 'walk' ? Math.abs(walk) * 1.1 : Math.sin(t * TAU) * .4;
    g.save();
    g.translate(0, bob * .2);

    const navy = '#2a3f61', navyDark = '#182941', navyLight = '#3e5c82';
    const gold = '#ffc84b', goldDark = '#b0781f';
    const skin = '#f2bd93', skinDark = '#d99672', ink = '#0b0812';

    // stivali e pantaloni con banda gialla
    const stride = mode === 'walk' ? walk * 4 : 0;
    outlinedLimb(g, 42, 59, 39 - stride, 72, 8.2, navy, ink);
    outlinedLimb(g, 39 - stride, 72, 37 - stride * 1.3, 82, 6.5, navy, ink);
    outlinedLimb(g, 50, 59, 54 + stride, 72, 8.2, navy, ink);
    outlinedLimb(g, 54 + stride, 72, 56 + stride * 1.3, 82, 6.5, navy, ink);
    line(g, 40 - stride, 65, 38 - stride, 79, gold, 0.9);
    line(g, 53 + stride, 65, 55 + stride, 79, gold, 0.9);
    // stivali neri
    for (const [x, y, dir] of [[37 - stride * 1.3, 82, 1], [56 + stride * 1.3, 82, 1]]) {
      g.beginPath();
      g.moveTo(x - 4, y - 3); g.lineTo(x + 3, y - 3); g.lineTo(x + 8, y + 1); g.lineTo(x + 7, y + 4); g.lineTo(x - 4, y + 4);
      g.closePath();
      g.fillStyle = '#111827'; g.fill();
      g.strokeStyle = ink; g.lineWidth = 1.6; g.stroke();
      g.fillStyle = goldDark; g.fillRect(x - 4, y + 2, 11, 1.2);
    }

    // giacca lunga
    g.beginPath();
    g.moveTo(35, 34); g.lineTo(58, 34);
    g.lineTo(62, 59); g.lineTo(59, 63); g.lineTo(31, 63); g.lineTo(28, 59);
    g.closePath();
    g.fillStyle = navy; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2; g.lineJoin = 'round'; g.stroke();
    // ombra e spacchi
    g.fillStyle = navyDark;
    g.beginPath(); g.moveTo(32, 39); g.lineTo(36, 35); g.lineTo(31, 59); g.lineTo(29, 58); g.closePath(); g.fill();
    line(g, 44, 48, 45, 62, '#111827', .8);
    // camicia bianca e cravatta
    poly(g, [[40, 34], [52, 34], [49, 48], [45, 55], [40, 48]], '#fff8e7');
    poly(g, [[44, 35], [49, 35], [48, 43], [46, 52], [43, 43]], '#4b1c2d');
    strokePoly(g, [[40, 34], [52, 34], [49, 48], [45, 55], [40, 48]], '#cbb98e', .7);
    // bottoni e mostrine
    for (let i = 0; i < 4; i++) { circle(g, 47, 45 + i * 4, 1.05, gold); }
    rect(g, 36, 36, 6, 2.4, gold); rect(g, 52, 36, 6, 2.4, gold);
    rect(g, 36, 38.5, 4, 1.1, goldDark); rect(g, 54, 38.5, 4, 1.1, goldDark);
    // cintura
    rect(g, 31, 56, 26, 4, '#111827');
    rect(g, 42, 55.5, 6, 5, gold); rect(g, 43.2, 56.7, 3.5, 2.6, '#38220f');
    // tasche
    g.strokeStyle = navyDark; g.lineWidth = 1;
    g.strokeRect(34, 48, 8, 5); g.strokeRect(53, 48, 7, 5);
    // fiamme gialle sul petto
    g.fillStyle = gold;
    g.beginPath(); g.arc(37.5, 45, 2.2, 0, TAU); g.fill();
    g.fillStyle = '#c62265'; g.fillRect(37, 43.6, 1, 3);
    g.fillStyle = goldDark; g.fillRect(35.8, 47, 3.5, .7);

    // braccio sinistro con verbale
    outlinedLimb(g, 35, 39, 29, 49, 5.6, navy, ink);
    outlinedLimb(g, 29, 49, 27, 57, 4.6, skin, ink);
    g.save(); g.translate(24, 55); g.rotate(-.18);
    rect(g, 0, 0, 10, 13, '#fff8e7');
    g.strokeStyle = '#1a1222'; g.lineWidth = .9; g.strokeRect(0, 0, 10, 13);
    g.fillStyle = '#c62265'; g.fillRect(2, 2, 4, 1); g.fillRect(2, 4, 6, .8); g.fillRect(2, 6, 5, .8);
    g.fillStyle = '#7280b3'; g.fillRect(2, 9, 5, .7);
    g.fillStyle = '#ff5b9d'; g.beginPath(); g.arc(8, 10.8, 2, 0, TAU); g.fill();
    g.restore();
    circle(g, 27, 57, 2.8, skin);
    g.strokeStyle = ink; g.lineWidth = .8; g.beginPath(); g.arc(27, 57, 2.8, 0, TAU); g.stroke();

    // braccio destro: manganello alzato durante l'attacco
    if (mode === 'attack') {
      outlinedLimb(g, 58, 38, 66, 30, 5.8, navy, ink);
      outlinedLimb(g, 66, 30, 70, 25, 4.8, skin, ink);
      circle(g, 70, 24, 3, skin);
      // manganello
      g.save(); g.translate(71, 23); g.rotate(-.6);
      rect(g, 0, -2, 14, 4, '#111827');
      rect(g, 1, -1, 12, 2, '#2d2238');
      rect(g, 0, -2, 3, 4, gold);
      rect(g, 13, -2.5, 3, 5, '#c62265');
      g.restore();
      // verbale lanciato
      g.save(); g.translate(76, 16); g.rotate(.3);
      rect(g, 0, 0, 9, 12, '#fff8e7'); g.strokeStyle = '#1a1222'; g.lineWidth = .8; g.strokeRect(0, 0, 9, 12);
      g.fillStyle = '#c62265'; g.fillRect(2, 2, 4, 1); g.fillRect(2, 4, 5, .8);
      g.restore();
    } else {
      outlinedLimb(g, 58, 39, 64, 50, 5.6, navy, ink);
      outlinedLimb(g, 64, 50, 67, 58, 4.6, skin, ink);
      circle(g, 67, 58, 2.8, skin);
      // manganello a riposo
      g.save(); g.translate(68, 61); g.rotate(.18);
      rect(g, 0, -2, 15, 4, '#111827');
      rect(g, 1, -1, 13, 2, '#2d2238');
      rect(g, 0, -2, 3, 4, gold);
      rect(g, 14, -2.5, 3, 5, '#c62265');
      g.restore();
    }

    // testa e berretto
    const hy = 28;
    // collo
    rect(g, 41, 34, 8, 5, skinDark);
    // viso squadrato
    g.beginPath();
    g.moveTo(32, hy - 7);
    g.bezierCurveTo(33, hy - 14, 50, hy - 15, 55, hy - 7);
    g.bezierCurveTo(58, hy - 2, 56, hy + 7, 51, hy + 10);
    g.bezierCurveTo(46, hy + 12, 36, hy + 10, 33, hy + 4);
    g.bezierCurveTo(31, hy, 31, hy - 4, 32, hy - 7);
    g.closePath();
    g.fillStyle = skin; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2; g.stroke();
    // guance e mento
    g.fillStyle = skinDark;
    g.fillRect(35, hy + 6, 15, 3);
    // orecchie
    circle(g, 32, hy, 3, skinDark); circle(g, 56, hy, 3, skin);
    // occhi severi
    rect(g, 35, hy - 2.2, 6, 3.2, '#fffdf2');
    rect(g, 47, hy - 2.2, 6, 3.2, '#fffdf2');
    rect(g, 38, hy - 1.8, 2.2, 2.6, '#1a1222');
    rect(g, 50, hy - 1.8, 2.2, 2.6, '#1a1222');
    line(g, 34, hy - 5, 42, hy - 3, '#38220f', 2.2);
    line(g, 47, hy - 3, 55, hy - 5, '#38220f', 2.2);
    // naso
    line(g, 47, hy + .5, 45, hy + 5, skinDark, 1.4);
    // baffi e bocca
    g.beginPath();
    g.moveTo(38, hy + 6.5); g.quadraticCurveTo(44, hy + 4.3, 47, hy + 6.5);
    g.quadraticCurveTo(51, hy + 4.3, 55, hy + 6.5);
    g.strokeStyle = '#5c3415'; g.lineWidth = 2; g.stroke();
    line(g, 41, hy + 9.5, 50, hy + 9, '#66192a', 1.2);
    // berretto: fascia oro, visiera e fiamma
    g.beginPath();
    g.moveTo(31, hy - 7);
    g.bezierCurveTo(31, hy - 17, 48, hy - 22, 57, hy - 11);
    g.lineTo(56, hy - 6);
    g.lineTo(31, hy - 6);
    g.closePath();
    g.fillStyle = navy; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2; g.stroke();
    g.fillStyle = navyLight;
    g.fillRect(34, hy - 14, 13, 3);
    rect(g, 30.5, hy - 8.5, 27, 3.2, gold);
    rect(g, 31.5, hy - 7.8, 25, 1.2, '#ffe08a');
    // visiera
    g.beginPath();
    g.moveTo(28, hy - 5.4); g.quadraticCurveTo(43, hy - 7, 58, hy - 5);
    g.lineTo(57, hy - 2.8); g.quadraticCurveTo(43, hy - 4.2, 29, hy - 3.2);
    g.closePath();
    g.fillStyle = '#111827'; g.fill();
    g.strokeStyle = ink; g.lineWidth = 1.2; g.stroke();
    // fiamma / distintivo
    g.fillStyle = gold;
    g.beginPath(); g.moveTo(44, hy - 13); g.lineTo(47, hy - 10); g.lineTo(44, hy - 7); g.lineTo(41, hy - 10); g.closePath(); g.fill();
    g.fillStyle = '#c62265'; g.fillRect(43.4, hy - 10.6, 1.2, 2.8);
    g.restore();

    quantize(img);
    return img;
  }

  function strokePoly(g, pts, color, width) {
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
    g.strokeStyle = color; g.lineWidth = width; g.stroke();
  }

  const enemyCache = {};
  A.enemyFrames = { pretender: [], boomer: [], utente: [], finanziere: [] };
  A.buildV1EnemyFrames = function () {
    if (A._v1Enemies) return;
    A._v1Enemies = true;
    for (let i = 0; i < 4; i++) {
      A.enemyFrames.pretender.push(paintPretender({ mode: 'walk', phase: i / 4 }));
      A.enemyFrames.boomer.push(paintBoomer({ mode: 'walk', phase: i / 4 }));
      A.enemyFrames.utente.push(paintUtente({ mode: 'walk', phase: i / 4 }));
      A.enemyFrames.finanziere.push(paintFinanziere({ mode: 'walk', phase: i / 4 }));
    }
    A.enemyFrames.pretender.push(paintPretender({ mode: 'kiss', phase: .1 }));
    A.enemyFrames.pretender.push(paintPretender({ mode: 'throw', phase: .2 }));
    A.enemyFrames.pretender.push(paintPretender({ mode: 'hurt', phase: 0 }));
    A.enemyFrames.boomer.push(paintBoomer({ mode: 'throw', phase: .25 }));
    A.enemyFrames.boomer.push(paintBoomer({ mode: 'hurt', phase: 0 }));
    A.enemyFrames.utente.push(paintUtente({ mode: 'shoot', phase: .2 }));
    A.enemyFrames.utente.push(paintUtente({ mode: 'hurt', phase: 0 }));
    A.enemyFrames.finanziere.push(paintFinanziere({ mode: 'attack', phase: .2 }));
    A.enemyFrames.finanziere.push(paintFinanziere({ mode: 'hurt', phase: 0 }));
  };
  /* Compatibilità v1/v2: costruisce i nemici di TUTTI i livelli (eager).
     Per il boot lazy usare A.buildBootArt() + A.ensureTheme(tema). */
  A.buildEnemyFrames = function () {
    A.buildV1EnemyFrames();
    A._buildThemeParts(['roma', 'europa', 'sogei'], 'enemies');
  };

  /* ---------- polpo mutante ---------- */
  const OCTO_W = 300, OCTO_H = 250;
  A.OCTO = { w: OCTO_W, h: OCTO_H, ax: 170, ay: 220 };

  function paintOcto(frame) {
    const c = canvas(OCTO_W, OCTO_H);
    const g = c.getContext('2d');
    const t = frame / 4 * TAU;
    g.save();
    g.translate(0, Math.sin(t) * 4);
    // tentacles behind
    const colors = ['#4b2a63', '#6e3e8f', '#9c62c8'];
    for (let k = 0; k < 6; k++) {
      const baseX = 125 + k * 12;
      const dir = k % 2 ? 1 : -1;
      const phase = t + k * .9;
      const reach = 55 + k * 8;
      const y0 = 155;
      g.beginPath();
      g.moveTo(baseX, y0);
      g.bezierCurveTo(
        baseX + dir * (18 + Math.sin(phase) * 12), y0 + 22,
        baseX + dir * (reach * .6 + Math.sin(phase + 1) * 20), y0 + 48,
        baseX + dir * (reach + Math.cos(phase) * 10), 210 + Math.sin(phase) * 9
      );
      g.strokeStyle = '#0b0812'; g.lineWidth = 30 - k * 1.7; g.lineCap = 'round'; g.stroke();
      g.strokeStyle = k % 3 === 0 ? '#6e3e8f' : k % 3 === 1 ? '#9c62c8' : '#4b2a63';
      g.lineWidth = 25 - k * 1.6; g.stroke();
      g.strokeStyle = 'rgba(232,214,255,.18)'; g.lineWidth = 3; g.stroke();
      // suckers
      for (let s = 0; s < 5; s++) {
        const u = (s + 1) / 6;
        const sx = baseX + dir * (reach * u) + Math.sin(phase + u * 3) * 10 * u;
        const sy = y0 + 50 * u + Math.sin(phase + u * 2) * 7;
        circle(g, sx, sy, 2.8 - u * 1.5, '#e8d6ff');
        circle(g, sx, sy, 1.2 - u * .4, '#4b2a63');
      }
    }
    // curled front tentacle
    g.beginPath();
    g.moveTo(162, 165);
    g.bezierCurveTo(195, 180, 260, 145, 244 + Math.sin(t) * 5, 105);
    g.strokeStyle = '#0b0812'; g.lineWidth = 26; g.lineCap = 'round'; g.stroke();
    g.strokeStyle = '#c598e0'; g.lineWidth = 21; g.stroke();
    g.beginPath();
    g.moveTo(244, 105);
    g.bezierCurveTo(228, 75, 198, 90, 210, 113);
    g.strokeStyle = '#0b0812'; g.lineWidth = 18; g.stroke();
    g.strokeStyle = '#c598e0'; g.lineWidth = 13; g.stroke();
    for (let i = 0; i < 5; i++) {
      circle(g, 235 - i * 6, 111 - Math.sin(i) * 7, 2.8, '#e8d6ff');
    }
    // body main
    g.beginPath();
    g.ellipse(152, 100, 72, 76, -.08, 0, TAU);
    g.fillStyle = '#0b0812'; g.fill();
    g.beginPath();
    g.ellipse(152, 99, 68, 73, -.08, 0, TAU);
    g.fillStyle = '#6e3e8f'; g.fill();
    g.beginPath(); g.ellipse(136, 90, 50, 56, -.18, 0, TAU); g.fillStyle = '#9c62c8'; g.fill();
    g.beginPath(); g.ellipse(122, 76, 36, 42, -.2, 0, TAU); g.fillStyle = '#c598e0'; g.fill();
    // blotches
    for (let i = 0; i < 8; i++) {
      const a = i * 1.7;
      ellipse(g, 135 + Math.cos(a) * 43, 105 + Math.sin(a) * 42, 10 + (i % 3) * 4, 6 + (i % 2) * 4, i % 2 ? '#4b2a63' : '#9c62c8');
    }
    // mantle
    g.beginPath();
    g.moveTo(92, 104);
    g.quadraticCurveTo(84, 152, 126, 165);
    g.lineTo(195, 160);
    g.quadraticCurveTo(226, 135, 216, 93);
    g.quadraticCurveTo(180, 118, 153, 111);
    g.quadraticCurveTo(116, 125, 92, 104);
    g.closePath();
    g.fillStyle = '#9c62c8'; g.fill();
    g.strokeStyle = '#0b0812'; g.lineWidth = 3; g.stroke();
    // huge eye
    g.beginPath(); g.ellipse(139, 84, 32, 27, .08, 0, TAU); g.fillStyle = '#0b0812'; g.fill();
    g.beginPath(); g.ellipse(139, 83, 27, 22, .08, 0, TAU); g.fillStyle = '#fff3a6'; g.fill();
    g.beginPath(); g.ellipse(139, 83, 19, 16, .08, 0, TAU); g.fillStyle = '#ffc84b'; g.fill();
    g.beginPath(); g.ellipse(139 + Math.sin(t) * 4, 84, 5, 16, .08, 0, TAU); g.fillStyle = '#1a1222'; g.fill();
    g.beginPath(); g.ellipse(145 + Math.sin(t) * 4, 77, 3, 5, .3, 0, TAU); g.fillStyle = '#fffdf2'; g.fill();
    // angry brow
    g.beginPath(); g.moveTo(102, 63); g.quadraticCurveTo(136, 50, 171, 64); g.strokeStyle = '#4b2a63'; g.lineWidth = 10; g.stroke();
    g.strokeStyle = '#2e1a3f'; g.lineWidth = 4; g.stroke();
    // beak / mouth
    g.beginPath();
    g.moveTo(120, 131);
    g.quadraticCurveTo(152, 153, 183, 128);
    g.quadraticCurveTo(159, 171, 120, 131);
    g.fillStyle = '#0b0812'; g.fill();
    g.beginPath();
    g.moveTo(130, 138); g.quadraticCurveTo(150, 146, 170, 137); g.strokeStyle = '#ff5b9d'; g.lineWidth = 4; g.stroke();
    // teeth
    for (let i = 0; i < 3; i++) poly(g, [[134 + i * 12, 137], [142 + i * 12, 138], [138 + i * 12, 143]], '#fff8e7');
    // customs cap
    g.save();
    g.translate(142, 29); g.rotate(-.08);
    g.beginPath(); g.ellipse(0, 0, 45, 17, 0, Math.PI, TAU); g.fillStyle = '#293a6b'; g.fill();
    g.strokeStyle = '#0b0812'; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#1a264a'; g.fillRect(-46, -2, 92, 7);
    g.fillStyle = '#ffc84b'; g.fillRect(-46, 3, 92, 3);
    g.beginPath(); g.moveTo(-42, 4); g.quadraticCurveTo(-67, 8, -62, 18); g.quadraticCurveTo(-38, 13, -27, 8); g.closePath(); g.fillStyle = '#1a1222'; g.fill();
    g.strokeStyle = '#ffc84b'; g.lineWidth = 2; g.beginPath(); g.arc(-46, 18, 5, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(-50, 18); g.lineTo(-42, 18); g.moveTo(-46, 14); g.lineTo(-46, 22); g.stroke();
    // badge
    g.fillStyle = '#ffc84b'; g.beginPath(); g.moveTo(0, -11); g.lineTo(7, -5); g.lineTo(0, 1); g.lineTo(-7, -5); g.closePath(); g.fill();
    g.restore();
    // ink drips and scars
    for (let i = 0; i < 6; i++) {
      const x = 100 + i * 19;
      const h = 10 + (i * 7) % 20;
      g.fillStyle = '#4b2a63'; g.fillRect(x, 160, 3, h);
      circle(g, x + 1.5, 160 + h, 2.5, '#4b2a63');
    }
    g.strokeStyle = '#e8d6ff'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(179, 49); g.lineTo(191, 74); g.lineTo(182, 81); g.stroke();
    // bubbles
    for (let i = 0; i < 4; i++) {
      g.strokeStyle = 'rgba(184,220,231,.38)'; g.lineWidth = 1.2;
      g.beginPath(); g.arc(90 + i * 15 + Math.sin(t + i) * 5, 118 + i * 9, 3 + i, 0, TAU); g.stroke();
    }
    g.restore();
    quantize(c);
    return c;
  }

  A.octoFrames = [];
  A.buildOctoFrames = function () {
    for (let i = 0; i < 4; i++) A.octoFrames.push(paintOcto(i));
  };

  /* =========================================================
     MECHA SAN NICOLA — boss finale
     ========================================================= */
  const MECHA_W = 380, MECHA_H = 340;
  A.MECHA = { w: MECHA_W, h: MECHA_H, ax: 195, ay: 318 };

  function drawWing(g, side, phase) {
    const dir = side;
    const baseX = 190 + dir * 62;
    const baseY = 166;
    g.save();
    g.translate(baseX, baseY);
    for (let i = 0; i < 5; i++) {
      const a = dir * (-.2 - i * .17);
      g.save();
      g.rotate(a);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(dir * (95 - i * 9), -12 - i * 4);
      g.lineTo(dir * (78 - i * 10), 16 - i * 3);
      g.lineTo(0, 18);
      g.closePath();
      g.fillStyle = i % 2 ? '#cbb98e' : '#e6d5b0';
      g.fill();
      g.strokeStyle = '#0b0812'; g.lineWidth = 2.2; g.stroke();
      g.strokeStyle = '#8d5016'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(dir * 12, 2); g.lineTo(dir * (65 - i * 7), -4 - i * 2); g.stroke();
      g.restore();
    }
    g.restore();
  }

  function paintMecha(o) {
    const g = canvas(MECHA_W, MECHA_H).getContext('2d');
    const img = g.canvas;
    const mode = o.mode || 'idle';
    const t = o.phase || 0;
    const bob = Math.sin(t * TAU) * 2;
    const charge = mode === 'staff' || mode === 'orb';
    const phase2 = mode === 'phase2';
    g.save();
    g.translate(0, bob);

    // wings (behind everything)
    drawWing(g, -1, t);
    drawWing(g, 1, t);

    // staff — held on the left side
    g.save();
    g.translate(70, 208);
    g.rotate(-.03 + Math.sin(t * TAU) * .008);
    line(g, 0, 130, 0, -88, '#0b0812', 13);
    line(g, 0, 130, 0, -88, '#c87b1e', 9);
    line(g, 2, 126, 2, -84, '#ffc84b', 4);
    g.strokeStyle = '#0b0812'; g.lineWidth = 16;
    g.beginPath(); g.arc(0, -93, 18, -Math.PI * .15, Math.PI * 1.3); g.stroke();
    g.strokeStyle = '#ffc84b'; g.lineWidth = 11;
    g.beginPath(); g.arc(0, -93, 18, -Math.PI * .15, Math.PI * 1.3); g.stroke();
    g.strokeStyle = '#fff3a6'; g.lineWidth = 3;
    g.beginPath(); g.arc(0, -93, 18, Math.PI * .1, Math.PI * .95); g.stroke();
    g.fillStyle = '#0b0812'; g.beginPath(); g.arc(0, -93, 10, 0, TAU); g.fill();
    g.fillStyle = '#ffc84b'; g.beginPath(); g.arc(0, -93, 5, 0, TAU); g.fill();
    // charging jewel
    if (charge) {
      g.fillStyle = '#fff3a6'; g.beginPath(); g.arc(0, -93, 13 + Math.sin(t * TAU * 4) * 2, 0, TAU); g.fill();
      g.fillStyle = '#ff5b9d'; g.beginPath(); g.arc(0, -93, 6, 0, TAU); g.fill();
    }
    rect(g, -5, 112, 10, 18, '#8d5016');
    rect(g, -3, 114, 6, 12, '#ffc84b');
    g.restore();

    // legs
    function leg(x, tilt, shade) {
      g.save();
      g.translate(x, 232);
      g.rotate(tilt);
      // thigh
      g.beginPath(); g.roundRect(-19, 0, 38, 54, 12); g.fillStyle = shade ? '#cbb98e' : '#e6d5b0'; g.fill();
      g.strokeStyle = '#0b0812'; g.lineWidth = 3; g.stroke();
      // knee
      g.beginPath(); g.ellipse(0, 50, 22, 15, 0, 0, TAU); g.fillStyle = '#c87b1e'; g.fill(); g.strokeStyle = '#0b0812'; g.lineWidth = 2.6; g.stroke();
      g.beginPath(); g.ellipse(0, 49, 13, 8, 0, 0, TAU); g.fillStyle = '#ffc84b'; g.fill();
      g.fillStyle = '#8d5016'; g.fillRect(-12, 46, 24, 2);
      // shin
      g.beginPath(); g.roundRect(-16, 58, 32, 30, 8); g.fillStyle = '#f5e9cc'; g.fill(); g.strokeStyle = '#0b0812'; g.lineWidth = 2.8; g.stroke();
      g.fillStyle = '#cbb98e'; g.fillRect(-13, 62, 7, 22);
      // foot
      g.beginPath(); g.moveTo(-20, 85); g.lineTo(25, 85); g.lineTo(34, 94); g.lineTo(-25, 94); g.closePath(); g.fillStyle = '#c87b1e'; g.fill(); g.strokeStyle = '#0b0812'; g.lineWidth = 2.6; g.stroke();
      g.fillStyle = '#ffc84b'; g.fillRect(-22, 89, 54, 3);
      g.restore();
    }
    leg(148, .03, false);
    leg(242, -.04, true);
    // base shadow block / steps
    g.fillStyle = '#1a1222'; g.fillRect(100, 300, 190, 12);
    g.fillStyle = '#38220f'; g.fillRect(104, 300, 182, 4);

    // cassock and armored skirt
    g.beginPath();
    g.moveTo(126, 210);
    g.lineTo(276, 210);
    g.lineTo(300, 250);
    g.lineTo(262, 268);
    g.lineTo(230, 254);
    g.lineTo(196, 270);
    g.lineTo(162, 250);
    g.lineTo(112, 264);
    g.closePath();
    g.fillStyle = '#66192a'; g.fill();
    g.strokeStyle = '#0b0812'; g.lineWidth = 3; g.stroke();
    // metal skirt plates
    for (let i = 0; i < 5; i++) {
      const x = 130 + i * 27;
      g.beginPath();
      g.moveTo(x, 210); g.lineTo(x + 25, 210); g.lineTo(x + 25, 238); g.lineTo(x + 13, 248); g.lineTo(x, 238); g.closePath();
      g.fillStyle = i % 2 ? '#e6d5b0' : '#cbb98e'; g.fill();
      g.strokeStyle = '#0b0812'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#ffc84b'; g.fillRect(x + 5, 232, 14, 3);
      g.fillStyle = '#c87b1e'; g.fillRect(x + 11, 216, 3, 10);
    }
    // belt with big gem
    g.fillStyle = '#0b0812'; g.fillRect(120, 200, 160, 16);
    g.fillStyle = '#c87b1e'; g.fillRect(123, 203, 154, 9);
    g.fillStyle = '#ffc84b'; g.fillRect(125, 204, 150, 3);
    g.fillStyle = '#ff5b9d'; g.beginPath(); g.moveTo(200, 195); g.lineTo(214, 207); g.lineTo(200, 219); g.lineTo(186, 207); g.closePath(); g.fill();
    g.strokeStyle = '#0b0812'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#ffe7c6'; g.fillRect(197, 202, 6, 5);

    // torso
    g.beginPath();
    g.moveTo(137, 122);
    g.quadraticCurveTo(200, 100, 263, 122);
    g.quadraticCurveTo(282, 162, 268, 211);
    g.lineTo(132, 211);
    g.quadraticCurveTo(118, 161, 137, 122);
    g.closePath();
    g.fillStyle = '#f5e9cc'; g.fill();
    g.strokeStyle = '#0b0812'; g.lineWidth = 3.2; g.stroke();
    // torso plates shading
    g.fillStyle = '#cbb98e'; g.beginPath(); g.moveTo(137, 210); g.lineTo(164, 210); g.lineTo(156, 133); g.lineTo(137, 122); g.closePath(); g.fill();
    g.fillStyle = '#e6d5b0'; g.beginPath(); g.moveTo(263, 210); g.lineTo(236, 210); g.lineTo(244, 133); g.lineTo(263, 122); g.closePath(); g.fill();
    g.fillStyle = '#ffc84b'; g.fillRect(142, 126, 116, 4);
    g.fillStyle = '#c87b1e'; g.fillRect(142, 131, 116, 2);
    // central stained-glass arch
    g.beginPath();
    g.moveTo(166, 207);
    g.lineTo(166, 160);
    g.quadraticCurveTo(166, 128, 200, 120);
    g.quadraticCurveTo(234, 128, 234, 160);
    g.lineTo(234, 207);
    g.closePath();
    g.fillStyle = '#0b0812'; g.fill();
    g.beginPath();
    g.moveTo(171, 203);
    g.lineTo(171, 161);
    g.quadraticCurveTo(171, 133, 200, 126);
    g.quadraticCurveTo(229, 133, 229, 161);
    g.lineTo(229, 203);
    g.closePath();
    g.fillStyle = '#2e1a3f'; g.fill();
    // glass mosaic
    const mosaic = ['#9c62c8', '#2d648c', '#ff5b9d', '#ffc84b', '#51c7a9', '#c62265', '#4f91bd', '#c87b1e'];
    let mi = 0;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 4; col++) {
        const x = 174 + col * 14;
        const y = 135 + row * 13;
        g.fillStyle = mosaic[(mi++) % mosaic.length];
        g.fillRect(x, y, 12, 10);
        g.fillStyle = 'rgba(255,248,231,.12)';
        g.fillRect(x, y, 12, 1);
      }
    }
    g.strokeStyle = '#0b0812'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(200, 126); g.lineTo(200, 203); g.moveTo(171, 168); g.lineTo(229, 168); g.stroke();
    // core
    g.fillStyle = '#0b0812'; g.beginPath(); g.arc(200, 169, 16, 0, TAU); g.fill();
    const coreColor = phase2 ? '#ff5b9d' : '#ffc84b';
    g.fillStyle = coreColor; g.beginPath(); g.arc(200, 169, 12 + Math.sin(t * TAU * 2) * 1.5, 0, TAU); g.fill();
    g.fillStyle = phase2 ? '#fff3a6' : '#fff8e7'; g.beginPath(); g.arc(200, 169, 6, 0, TAU); g.fill();
    // ribs
    g.strokeStyle = '#c87b1e'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(178, 199); g.lineTo(222, 199); g.stroke();
    g.beginPath(); g.moveTo(164, 183); g.quadraticCurveTo(151, 190, 145, 205); g.stroke();
    g.beginPath(); g.moveTo(236, 183); g.quadraticCurveTo(249, 190, 255, 205); g.stroke();

    // shoulders
    function shoulder(x, side) {
      g.save();
      g.translate(x, 137);
      g.rotate(side * .1);
      g.beginPath(); g.ellipse(0, 0, 39, 32, 0, 0, TAU); g.fillStyle = '#e6d5b0'; g.fill();
      g.strokeStyle = '#0b0812'; g.lineWidth = 3.2; g.stroke();
      g.beginPath(); g.ellipse(0, -6, 31, 16, 0, 0, TAU); g.fillStyle = '#ffc84b'; g.fill();
      g.strokeStyle = '#8d5016'; g.lineWidth = 1.8; g.stroke();
      g.fillStyle = '#c87b1e'; g.fillRect(-4, -30, 8, 22);
      g.fillRect(-15, -23, 30, 7);
      g.fillStyle = '#c62265'; g.beginPath(); g.arc(0, 8, 6, 0, TAU); g.fill();
      g.restore();
    }
    shoulder(132, -1);
    shoulder(268, 1);

    // arms
    // right cannon arm (screen right)
    outlinedLimb(g, 280, 152, 306, 188, 27, '#e6d5b0', '#0b0812');
    g.beginPath(); g.ellipse(312, 204, 26, 31, -.2, 0, TAU); g.fillStyle = '#cbb98e'; g.fill(); g.strokeStyle = '#0b0812'; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#c87b1e'; g.fillRect(299, 196, 26, 4);
    g.beginPath(); g.arc(313, 212, 12, 0, TAU); g.fillStyle = '#ffc84b'; g.fill(); g.strokeStyle = '#0b0812'; g.lineWidth = 2; g.stroke();
    g.beginPath(); g.arc(313, 212, 6, 0, TAU); g.fillStyle = '#1a1222'; g.fill();

    // left arm to staff (screen left)
    const armAngle = mode === 'staff' ? -0.15 : mode === 'orb' ? -.35 : -.05;
    outlinedLimb(g, 118, 154, 80, 184, 26, '#f5e9cc', '#0b0812');
    g.save();
    g.translate(78, 188); g.rotate(armAngle);
    g.beginPath(); g.ellipse(0, 0, 23, 30, .1, 0, TAU); g.fillStyle = '#e6d5b0'; g.fill(); g.strokeStyle = '#0b0812'; g.lineWidth = 3; g.stroke();
    // articulated fingers around staff
    for (let i = 0; i < 3; i++) {
      g.beginPath(); g.roundRect(-15 + i * 10, 16, 9, 15, 4); g.fillStyle = '#cbb98e'; g.fill(); g.strokeStyle = '#0b0812'; g.lineWidth = 2; g.stroke();
    }
    g.restore();
    // charge glow at staff hand
    if (charge) {
      g.fillStyle = 'rgba(255,200,75,.26)'; g.beginPath(); g.arc(70, 205, 30 + Math.sin(t * TAU * 3) * 5, 0, TAU); g.fill();
    }

    // neck
    g.fillStyle = '#38220f'; g.fillRect(181, 96, 38, 30);
    g.fillStyle = '#c87b1e'; g.fillRect(185, 100, 6, 22);
    g.fillStyle = '#c87b1e'; g.fillRect(209, 100, 6, 22);

    // head
    g.beginPath();
    g.moveTo(162, 93);
    g.quadraticCurveTo(166, 102, 158, 122);
    g.quadraticCurveTo(200, 138, 242, 122);
    g.quadraticCurveTo(234, 102, 238, 93);
    g.quadraticCurveTo(200, 73, 162, 93);
    g.closePath();
    g.fillStyle = '#e6d5b0'; g.fill();
    g.strokeStyle = '#0b0812'; g.lineWidth = 3; g.stroke();
    // helmet side gold
    g.fillStyle = '#ffc84b';
    g.beginPath(); g.moveTo(160, 95); g.quadraticCurveTo(170, 76, 200, 72); g.lineTo(200, 86); g.quadraticCurveTo(174, 89, 168, 110); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(240, 95); g.quadraticCurveTo(230, 76, 200, 72); g.lineTo(200, 86); g.quadraticCurveTo(226, 89, 232, 110); g.closePath(); g.fill();
    // eye slit
    g.fillStyle = '#0b0812'; g.fillRect(172, 101, 56, 12);
    g.fillStyle = phase2 ? '#ff845d' : '#51c7a9';
    g.fillRect(177 + Math.sin(t * TAU) * 2, 105, 17, 4);
    g.fillRect(207 - Math.sin(t * TAU) * 2, 105, 17, 4);
    g.fillStyle = '#f2fbff'; g.fillRect(186, 106, 4, 2); g.fillRect(212, 106, 4, 2);
    // cheek guards
    g.fillStyle = '#cbb98e'; g.fillRect(162, 115, 12, 12); g.fillRect(226, 115, 12, 12);
    g.strokeStyle = '#0b0812'; g.lineWidth = 2; g.strokeRect(162, 115, 12, 12); g.strokeRect(226, 115, 12, 12);
    // chin/jaw
    g.fillStyle = '#cbb98e'; g.fillRect(181, 119, 38, 13);
    for (let i = 0; i < 4; i++) g.fillStyle = '#8d5016', g.fillRect(184 + i * 9, 122, 5, 7);

    // mitre
    g.beginPath();
    g.moveTo(167, 82);
    g.quadraticCurveTo(166, 58, 177, 40);
    g.lineTo(189, 22);
    g.quadraticCurveTo(200, 12, 211, 22);
    g.lineTo(223, 40);
    g.quadraticCurveTo(234, 58, 233, 82);
    g.quadraticCurveTo(200, 96, 167, 82);
    g.closePath();
    g.fillStyle = '#f5e9cc'; g.fill();
    g.strokeStyle = '#0b0812'; g.lineWidth = 3; g.stroke();
    // gold trim
    g.strokeStyle = '#ffc84b'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(169, 79); g.quadraticCurveTo(200, 93, 231, 79); g.stroke();
    g.strokeStyle = '#c87b1e'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(171, 75); g.quadraticCurveTo(200, 89, 229, 75); g.stroke();
    // central cross
    g.fillStyle = '#c87b1e'; g.fillRect(196, 28, 8, 46);
    g.fillRect(183, 39, 34, 7);
    g.fillStyle = '#ffc84b'; g.fillRect(198, 29, 4, 44);
    g.fillRect(184, 40, 32, 3);
    // jewels
    const jewels = [[200, 60, '#ff5b9d'], [200, 71, '#2d648c'], [181, 56, '#51c7a9'], [219, 56, '#ff845d']];
    for (const [x, y, col] of jewels) {
      g.beginPath(); g.moveTo(x, y - 4); g.lineTo(x + 4, y); g.lineTo(x, y + 4); g.lineTo(x - 4, y); g.closePath();
      g.fillStyle = col; g.fill(); g.strokeStyle = '#0b0812'; g.lineWidth = 1.2; g.stroke();
    }
    // crown/circlet
    g.fillStyle = '#ffc84b'; g.fillRect(169, 80, 62, 6);
    for (let i = 0; i < 5; i++) {
      g.beginPath(); g.moveTo(174 + i * 13, 80); g.lineTo(178 + i * 13, 72); g.lineTo(182 + i * 13, 80); g.fillStyle = i === 2 ? '#ff5b9d' : '#ffc84b'; g.fill();
    }

    // energetic garlands around arms
    if (phase2 || charge) {
      g.strokeStyle = phase2 ? 'rgba(255,91,157,.55)' : 'rgba(255,200,75,.52)';
      g.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.arc(92 + i * 8, 163 + Math.sin(t * TAU + i) * 6, 12 + i * 8, -.4, 1.7);
        g.stroke();
      }
    }

    g.restore();
    quantize(img);
    return img;
  }

  A.mechaFrames = {};
  A.buildMechaFrames = function () {
    A.mechaFrames = {
      idle: [paintMecha({ mode: 'idle', phase: 0 }), paintMecha({ mode: 'idle', phase: .5 })],
      staff: paintMecha({ mode: 'staff', phase: .25 }),
      orb: paintMecha({ mode: 'orb', phase: .4 }),
      phase2: paintMecha({ mode: 'phase2', phase: .1 }),
      hurt: paintMecha({ mode: 'idle', phase: .75 })
    };
  };

  function paintHalo(frame, total, phase2) {
    const c = canvas(190, 190);
    const g = c.getContext('2d');
    g.translate(95, 95);
    const rot = frame / total * TAU;
    const col = phase2 ? '#ff845d' : '#ffc84b';
    const col2 = phase2 ? '#ff5b9d' : '#fff3a6';
    // outer scallops
    for (let i = 0; i < 16; i++) {
      const a = rot + i / 16 * TAU;
      g.save(); g.rotate(a);
      g.beginPath();
      g.moveTo(-5, -72); g.lineTo(5, -72); g.lineTo(4, -60); g.lineTo(-4, -60); g.closePath();
      g.fillStyle = col; g.fill();
      g.strokeStyle = '#0b0812'; g.lineWidth = 1.2; g.stroke();
      g.restore();
    }
    // rings
    g.strokeStyle = '#0b0812'; g.lineWidth = 9; g.beginPath(); g.arc(0, 0, 57, 0, TAU); g.stroke();
    g.strokeStyle = col; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 57, 0, TAU); g.stroke();
    g.strokeStyle = '#8d5016'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 51, 0, TAU); g.stroke();
    g.strokeStyle = col2; g.lineWidth = 1.4; g.beginPath(); g.arc(0, 0, 63, 0, TAU); g.stroke();
    // rotating runes
    for (let i = 0; i < 8; i++) {
      const a = rot * 1.4 + i / 8 * TAU;
      g.save(); g.rotate(a); g.translate(0, -45);
      g.fillStyle = col2;
      g.fillRect(-1.4, -5, 2.8, 10);
      g.fillRect(-5, -1, 10, 2);
      g.restore();
    }
    // rays
    for (let i = 0; i < 8; i++) {
      const a = -rot + i / 8 * TAU;
      g.save(); g.rotate(a);
      g.beginPath(); g.moveTo(-4, -66); g.lineTo(0, -86); g.lineTo(4, -66); g.closePath();
      g.fillStyle = i % 2 ? col : '#fff3a6'; g.fill();
      g.strokeStyle = '#8d5016'; g.lineWidth = .8; g.stroke();
      g.restore();
    }
    // center energy haze ring
    g.strokeStyle = 'rgba(255,248,231,.45)'; g.lineWidth = 2;
    g.beginPath(); g.arc(0, 0, 34, rot, rot + 1.4); g.stroke();
    g.beginPath(); g.arc(0, 0, 34, rot + Math.PI, rot + Math.PI + 1.1); g.stroke();
    quantize(c);
    return c;
  }
  A.haloFrames = [];
  A.haloPhase2 = [];
  A.buildHaloFrames = function () {
    for (let i = 0; i < 12; i++) {
      A.haloFrames.push(paintHalo(i, 12, false));
      A.haloPhase2.push(paintHalo(i, 12, true));
    }
  };

  /* =========================================================
     PROPS, PICK-UP, ICONE ED EFFETTI
     ========================================================= */
  function propCrate() {
    const c = canvas(40, 36), g = c.getContext('2d');
    rect(g, 2, 4, 36, 30, '#0b0812');
    rect(g, 4, 6, 32, 26, '#8d5016');
    rect(g, 6, 8, 28, 22, '#c87b1e');
    for (let i = 0; i < 4; i++) { rect(g, 8 + i * 7, 9, 2, 20, '#8d5016'); }
    rect(g, 4, 6, 32, 4, '#b5683c');
    rect(g, 7, 15, 26, 3, '#5c3415');
    rect(g, 7, 25, 26, 3, '#5c3415');
    rect(g, 11, 10, 18, 12, '#f5e9cc');
    rect(g, 12, 11, 16, 10, '#fff8e7');
    g.fillStyle = '#66192a'; g.font = 'bold 5px monospace'; g.textAlign = 'center'; g.fillText('DOGANA', 20, 17);
    g.fillStyle = '#c62265'; g.font = 'bold 4px monospace'; g.fillText('BARI', 20, 21);
    g.strokeStyle = '#c62265'; g.lineWidth = 1; g.strokeRect(13, 12, 14, 8);
    rect(g, 29, 29, 4, 2, '#ffc84b');
    quantize(c);
    return c;
  }

  function propBarrel() {
    const c = canvas(30, 40), g = c.getContext('2d');
    rect(g, 4, 2, 22, 36, '#0b0812');
    rect(g, 6, 4, 18, 32, '#2d648c');
    rect(g, 6, 4, 6, 32, '#4f91bd');
    rect(g, 5, 8, 20, 3, '#7280b3');
    rect(g, 5, 28, 20, 3, '#7280b3');
    rect(g, 5, 16, 20, 2, '#1d4467');
    ellipse(g, 15, 4, 10, 3, '#9fc1ea');
    ellipse(g, 15, 4, 7, 1.7, '#4f91bd');
    rect(g, 9, 12, 4, 5, '#ffc84b');
    g.fillStyle = '#38220f'; g.font = 'bold 4px monospace'; g.textAlign = 'center'; g.fillText('OLIO', 16, 14);
    quantize(c);
    return c;
  }

  function propStall() {
    const c = canvas(100, 78), g = c.getContext('2d');
    // legs
    rect(g, 8, 52, 6, 24, '#5c3415');
    rect(g, 86, 52, 6, 24, '#5c3415');
    rect(g, 2, 48, 96, 8, '#8d5016');
    // counter
    rect(g, 2, 44, 96, 20, '#0b0812');
    rect(g, 5, 47, 90, 14, '#c87b1e');
    rect(g, 7, 49, 86, 5, '#e59e5d');
    for (let i = 0; i < 4; i++) rect(g, 13 + i * 21, 55, 14, 5, '#8d5016');
    // canopy poles
    rect(g, 6, 6, 4, 46, '#5c3415');
    rect(g, 89, 6, 4, 46, '#5c3415');
    // striped canopy
    for (let i = 0; i < 6; i++) {
      const col = i % 2 ? '#fff8e7' : '#c62265';
      poly(g, [[2 + i * 16, 3], [18 + i * 16, 3], [23 + i * 16, 26], [12 + i * 16, 34], [0 + i * 16, 26]], col);
    }
    // scalloped edge
    for (let i = 0; i < 7; i++) {
      g.beginPath(); g.arc(7 + i * 15, 29, 7, 0, Math.PI); g.fillStyle = i % 2 ? '#fff8e7' : '#c62265'; g.fill();
    }
    // orecchiette trays
    ellipse(g, 31, 43, 20, 6, '#cbb98e');
    ellipse(g, 31, 42, 18, 4, '#e6d5b0');
    for (let i = 0; i < 10; i++) ellipse(g, 17 + (i % 5) * 7, 41 + Math.floor(i / 5) * 2, 2.4, 1.2, '#f5e9cc');
    ellipse(g, 68, 43, 17, 5, '#8798a8');
    ellipse(g, 68, 42, 15, 3.5, '#d4e5ee');
    rect(g, 55, 37, 26, 3, '#9fc1ea');
    // hanging orecchiette strings
    for (let i = 0; i < 4; i++) {
      line(g, 12 + i * 7, 34, 12 + i * 7, 40, '#9e8c68', .8);
      ellipse(g, 12 + i * 7, 41, 2, 1.5, '#f5e9cc');
    }
    // sign
    rect(g, 34, 32, 33, 10, '#fff8e7');
    rect(g, 35, 33, 31, 8, '#f5e9cc');
    g.fillStyle = '#66192a'; g.font = 'bold 5px monospace'; g.textAlign = 'center'; g.fillText('ORECCHIETTE', 50, 39);
    quantize(c);
    return c;
  }

  function propSign() {
    const c = canvas(44, 55), g = c.getContext('2d');
    rect(g, 19, 27, 5, 27, '#0b0812');
    rect(g, 20, 27, 3, 27, '#7280b3');
    rect(g, 3, 6, 38, 24, '#0b0812');
    rect(g, 5, 8, 34, 20, '#ffc84b');
    rect(g, 7, 10, 30, 16, '#1a264a');
    g.fillStyle = '#fff8e7'; g.font = 'bold 6px monospace'; g.textAlign = 'center'; g.fillText('DOGANA', 22, 17);
    g.fillStyle = '#ffc84b'; g.font = 'bold 5px monospace'; g.fillText('→', 22, 24);
    rect(g, 3, 30, 38, 3, '#c62265');
    quantize(c);
    return c;
  }

  function propBollard() {
    const c = canvas(20, 28), g = c.getContext('2d');
    rect(g, 3, 5, 14, 22, '#0b0812');
    rect(g, 5, 7, 10, 19, '#48576e');
    rect(g, 7, 8, 6, 16, '#7280b3');
    ellipse(g, 10, 6, 6, 3, '#0b0812');
    ellipse(g, 10, 5, 5, 2.5, '#7280b3');
    rect(g, 6, 12, 8, 3, '#ffc84b');
    rect(g, 2, 25, 16, 2, '#1a1222');
    quantize(c);
    return c;
  }

  function propBench() {
    const c = canvas(62, 34), g = c.getContext('2d');
    rect(g, 2, 6, 58, 5, '#38220f');
    rect(g, 4, 2, 54, 4, '#8d5016');
    rect(g, 6, 12, 50, 4, '#c87b1e');
    rect(g, 8, 19, 6, 13, '#0b0812');
    rect(g, 48, 19, 6, 13, '#0b0812');
    rect(g, 9, 20, 4, 10, '#48576e');
    rect(g, 49, 20, 4, 10, '#48576e');
    quantize(c);
    return c;
  }

  A.props = {};
  function propDesk() {
    const c = canvas(76, 38), g = c.getContext('2d');
    g.fillStyle = '#2b1d17'; g.fillRect(3, 14, 70, 4);
    g.fillStyle = '#6d4a32'; g.fillRect(2, 8, 72, 7);
    g.fillStyle = '#9b6d45'; g.fillRect(2, 8, 72, 2);
    g.fillStyle = '#4a3225'; g.fillRect(6, 15, 5, 20); g.fillRect(65, 15, 5, 20);
    g.fillStyle = '#fff8e7'; g.fillRect(15, 3, 13, 8); g.fillRect(31, 4, 12, 7); g.fillRect(48, 2, 14, 9);
    g.fillStyle = '#7280b3'; for (let i = 0; i < 3; i++) g.fillRect(17, 5 + i * 2, 8, 1);
    g.fillStyle = '#c62265'; g.fillRect(52, 5, 4, 3);
    return c;
  }
  function propArchive() {
    const c = canvas(38, 72), g = c.getContext('2d');
    g.fillStyle = '#25343b'; g.fillRect(1, 2, 36, 68);
    g.fillStyle = '#59676e'; g.fillRect(3, 4, 32, 64);
    g.fillStyle = '#2f3c42'; for (let i = 0; i < 3; i++) g.fillRect(4, 8 + i * 21, 30, 17);
    g.fillStyle = '#c3a26b'; for (let i = 0; i < 3; i++) { g.fillRect(7, 11 + i * 21, 21, 8); g.fillStyle = '#7d6744'; g.fillRect(31, 14 + i * 21, 2, 3); g.fillStyle = '#c3a26b'; }
    return c;
  }
  function propPlant() {
    const c = canvas(28, 52), g = c.getContext('2d');
    g.fillStyle = '#6d3e2e'; g.fillRect(8, 38, 12, 13);
    g.fillStyle = '#a66246'; g.fillRect(8, 38, 12, 3);
    g.strokeStyle = '#2f7a4d'; g.lineWidth = 2;
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(14, 40); g.quadraticCurveTo(5 + i * 5, 20 - i * 3, 4 + i * 6, 8 + (i % 2) * 6); g.stroke(); }
    g.fillStyle = '#51c7a9'; for (let i = 0; i < 4; i++) g.fillRect(4 + i * 6, 8 + (i % 2) * 7, 5, 3);
    return c;
  }
  function propCooler() {
    const c = canvas(24, 48), g = c.getContext('2d');
    g.fillStyle = '#d8e1e8'; g.fillRect(4, 3, 16, 24);
    g.fillStyle = '#8fd4ef'; g.fillRect(6, 5, 12, 12);
    g.fillStyle = '#e8f6ff'; g.fillRect(7, 6, 3, 9);
    g.fillStyle = '#5b6670'; g.fillRect(3, 27, 18, 18);
    g.fillStyle = '#9fd7ff'; g.fillRect(7, 31, 4, 3); g.fillStyle = '#ff5b9d'; g.fillRect(14, 31, 4, 3);
    return c;
  }
  function iconBolt() {
    const { c, g, ox, oy } = pickupBase(26, 26, '#9fd7ff');
    g.save(); g.translate(ox + 13, oy + 13); g.rotate(-.5);
    g.fillStyle = '#0b0812'; g.fillRect(-10, -4, 20, 8);
    g.fillStyle = '#d8e1e8'; g.fillRect(-8, -3, 15, 6);
    g.fillStyle = '#7b8b97'; g.fillRect(-11, -2, 5, 4);
    g.fillStyle = '#fff8e7'; g.fillRect(2, -1, 3, 1);
    g.fillStyle = '#7b8b97'; for (let i = 0; i < 3; i++) g.fillRect(-3 + i * 4, -3, 1, 6);
    g.restore();
    return c;
  }
  function iconRemote() {
    const { c, g, ox, oy } = pickupBase(26, 26, '#9fd7ff');
    g.save(); g.translate(ox + 13, oy + 13); g.rotate(-.15);
    g.fillStyle = '#0b0812'; g.fillRect(-7, -11, 14, 22);
    g.fillStyle = '#25343f'; g.fillRect(-6, -10, 12, 20);
    g.fillStyle = '#9fd7ff'; g.fillRect(-4, -7, 8, 4);
    g.fillStyle = '#ff5b9d'; g.beginPath(); g.arc(-2, 0, 1.5, 0, TAU); g.fill();
    g.fillStyle = '#ffc84b'; g.beginPath(); g.arc(2, 0, 1.5, 0, TAU); g.fill();
    g.fillStyle = '#51c7a9'; g.beginPath(); g.arc(-2, 4, 1.5, 0, TAU); g.fill();
    g.fillStyle = '#fff8e7'; g.beginPath(); g.arc(2, 4, 1.5, 0, TAU); g.fill();
    g.restore();
    return c;
  }
  function iconPanino() {
    const { c, g, ox, oy } = pickupBase(28, 28, '#ffc84b');
    g.save(); g.translate(ox, oy);
    g.fillStyle = '#d9a45b'; g.beginPath(); g.ellipse(14, 14, 11, 5, .1, 0, TAU); g.fill();
    g.fillStyle = '#b77b3f'; g.fillRect(5, 15, 18, 4);
    g.fillStyle = '#f0c36d'; g.beginPath(); g.ellipse(14, 11, 10, 4, -.1, 0, TAU); g.fill();
    g.fillStyle = '#51c7a9'; g.fillRect(7, 10, 12, 2);
    g.fillStyle = '#ff5b9d'; g.fillRect(9, 8, 8, 2);
    g.fillStyle = '#fff8e7'; g.fillRect(12, 12, 4, 2);
    g.restore();
    return c;
  }
  function iconRegalia() {
    const { c, g, ox, oy } = pickupBase(28, 28, '#9fd7ff');
    g.save(); g.translate(ox, oy);
    // pesce
    g.fillStyle = '#9fd7ff'; g.beginPath(); g.ellipse(12, 11, 9, 5, -.2, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(20, 8); g.lineTo(27, 4); g.lineTo(26, 14); g.closePath(); g.fill();
    g.fillStyle = '#0b0812'; g.fillRect(6, 9, 2, 2);
    // mela
    g.fillStyle = '#ef367f'; g.beginPath(); g.arc(12, 23, 5, 0, TAU); g.fill();
    g.fillStyle = '#51c7a9'; g.fillRect(13, 17, 2, 3); g.fillRect(15, 17, 3, 1);
    // giocattolo
    g.fillStyle = '#ffc84b'; g.fillRect(28, 20, 7, 7);
    g.fillStyle = '#ff5b9d'; g.fillRect(30, 22, 3, 3);
    g.restore();
    return c;
  }
  A.buildV1Props = function () {
    if (A._v1Props) return;
    A._v1Props = true;
    A.props.crate = propCrate();
    A.props.barrel = propBarrel();
    A.props.stall = propStall();
    A.props.sign = propSign();
    A.props.bollard = propBollard();
    A.props.bench = propBench();
    A.props.desk = propDesk();
    A.props.archive = propArchive();
    A.props.plant = propPlant();
    A.props.cooler = propCooler();
  };
  A.buildProps = function () {
    A.buildV1Props();
    A._buildThemeParts(['roma', 'europa', 'pescara', 'sogei'], 'props');
    A._buildThemeParts(['sogei'], 'ambient');
  };

  function pickupBase(w, h, color) {
    const c = canvas(w + 26, h + 26), g = c.getContext('2d');
    // glow halo + frame
    g.fillStyle = color + '22';
    g.beginPath(); g.arc((w + 26) / 2, (h + 26) / 2, w * .64, 0, TAU); g.fill();
    g.strokeStyle = color; g.lineWidth = 1;
    g.beginPath(); g.arc((w + 26) / 2, (h + 26) / 2, w * .56, 0, TAU); g.stroke();
    g.strokeStyle = color + '88';
    g.beginPath(); g.arc((w + 26) / 2, (h + 26) / 2, w * .46, .4, 2.4); g.stroke();
    return { c, g, ox: 13, oy: 13 };
  }

  function iconLipstick() {
    const { c, g, ox, oy } = pickupBase(26, 26, '#ff90b8');
    g.save(); g.translate(ox + 13, oy + 15); g.rotate(-.5);
    rect(g, -6, -7, 12, 18, '#fff8e7');
    rect(g, -5, 1, 10, 8, '#ffc84b');
    rect(g, -5, 1, 3, 8, '#fff3a6');
    rect(g, -4, -12, 8, 10, '#c62265');
    poly(g, [[-4, -12], [4, -12], [6, -18], [0, -21], [-5, -16]], '#ff5b9d');
    rect(g, -4, -12, 2, 10, '#ff90b8');
    g.fillStyle = '#ffc84b'; g.fillRect(-5, 9, 10, 2);
    g.restore();
    quantize(c);
    return c;
  }
  function iconMascara() {
    const { c, g, ox, oy } = pickupBase(32, 26, '#ba9ae0');
    g.save(); g.translate(ox + 16, oy + 13); g.rotate(-.55);
    rect(g, -9, -2, 18, 6, '#1a1222');
    rect(g, -8, -1, 16, 4, '#48576e');
    rect(g, 7, -4, 6, 10, '#ffc84b');
    rect(g, -14, -5, 9, 12, '#2d648c');
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      line(g, -10 + Math.cos(a) * 4, Math.sin(a) * 3, -10 + Math.cos(a) * 9, Math.sin(a) * 7, i % 3 ? '#1a1222' : '#5b4666', 1.5);
    }
    heartShape(g, 1, 1, 2.5, '#ff5b9d');
    g.restore();
    quantize(c);
    return c;
  }
  function iconPowder() {
    const { c, g, ox, oy } = pickupBase(26, 26, '#ffc84b');
    g.save(); g.translate(ox + 13, oy + 14);
    ellipse(g, 0, 3, 11, 9, '#c62265');
    ellipse(g, 0, 2, 10, 7, '#ff90b8');
    ellipse(g, -2, 0, 6, 3, '#ffbfd8');
    ellipse(g, 0, -6, 8, 4, '#fff8e7');
    ellipse(g, 0, -6, 6, 2, '#e6d5b0');
    rect(g, -3, -8, 6, 3, '#ffc84b');
    for (let i = 0; i < 4; i++) {
      g.fillStyle = 'rgba(255,144,184,.7)';
      g.fillRect(-12 + i * 7, -12 - (i % 2) * 3, 2, 2);
    }
    g.restore();
    quantize(c);
    return c;
  }
  function iconHealth() {
    const { c, g, ox, oy } = pickupBase(26, 30, '#51c7a9');
    g.save(); g.translate(ox + 13, oy + 14);
    // espresso cup
    rect(g, -8, -5, 16, 13, '#fff8e7');
    rect(g, -7, -4, 14, 4, '#e6d5b0');
    ellipse(g, -1, -4, 7, 2, '#38220f');
    ellipse(g, -1, -4, 5, 1.2, '#8d5016');
    g.strokeStyle = '#fff8e7'; g.lineWidth = 2.5;
    g.beginPath(); g.arc(8, 1, 4, -.8, 1.9); g.stroke();
    // saucer
    ellipse(g, -1, 10, 13, 3, '#cbb98e');
    rect(g, -6, 13, 12, 2, '#e6d5b0');
    // steam
    g.strokeStyle = '#d4e5ee'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(-4, -10); g.quadraticCurveTo(-7, -15, -4, -19); g.stroke();
    g.beginPath(); g.moveTo(2, -11); g.quadraticCurveTo(5, -16, 2, -21); g.stroke();
    // green cross badge
    rect(g, 5, -16, 8, 8, '#17655f');
    rect(g, 8, -15, 2, 6, '#51c7a9');
    rect(g, 6, -13, 6, 2, '#51c7a9');
    g.restore();
    quantize(c);
    return c;
  }
  function iconGrenade() {
    const { c, g, ox, oy } = pickupBase(24, 24, '#ffc84b');
    g.save(); g.translate(ox + 13, oy + 14);
    ellipse(g, 0, 2, 9, 8, '#c62265');
    ellipse(g, 0, 1, 8, 6, '#ff90b8');
    ellipse(g, 0, -6, 7, 4, '#fff8e7');
    rect(g, -2, -11, 4, 5, '#ffc84b');
    for (let i = 0; i < 3; i++) circle(g, -7 + i * 7, -1, 2.5, '#ffbfd8');
    g.restore();
    quantize(c);
    return c;
  }

  A.pickups = {};
  A.buildV1Pickups = function () {
    if (A._v1Pickups) return;
    A._v1Pickups = true;
    A.pickups.lipstick = iconLipstick();
    A.pickups.mascara = iconMascara();
    A.pickups.powder = iconPowder();
    A.pickups.health = iconHealth();
    A.pickups.grenade = iconGrenade();
    A.pickups.regalia = iconRegalia();
    A.pickups.pensierino = A.pickups.regalia;
    A.pickups.bolt = iconBolt();
    A.pickups.remote = iconRemote();
    A.pickups.telecomando = A.pickups.remote;
    A.pickups.panino = iconPanino();
  };
  A.buildPickups = function () {
    A.buildV1Pickups();
    A._buildThemeParts(['roma', 'pescara'], 'pickups');
  };

  A.makeExplosion = function (size, hot) {
    const c = canvas(size, size), g = c.getContext('2d');
    const cx = size / 2, cy = size / 2;
    const pts = 11 + (size % 5);
    g.beginPath();
    for (let i = 0; i < pts * 2; i++) {
      const a = i / (pts * 2) * TAU;
      const rr = i % 2 ? size * .2 : size * (.33 + ((i * 7) % 5) / 30);
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      if (!i) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.closePath();
    g.fillStyle = '#0b0812'; g.fill();
    g.beginPath();
    for (let i = 0; i < pts * 2; i++) {
      const a = i / (pts * 2) * TAU;
      const rr = i % 2 ? size * .15 : size * (.27 + ((i * 7) % 5) / 36);
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      if (!i) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.closePath();
    g.fillStyle = hot ? '#ffd35c' : '#ff5b9d'; g.fill();
    g.beginPath(); g.arc(cx, cy, size * .21, 0, TAU); g.fillStyle = hot ? '#fff8e7' : '#ffc84b'; g.fill();
    // comic puffs
    const puffs = [[-.31, .1, .17], [.29, -.12, .14], [.12, .32, .12], [-.22, -.25, .11], [.32, .22, .1]];
    for (const [dx, dy, r] of puffs) {
      ellipse(g, cx + dx * size, cy + dy * size, r * size, r * size * .8, hot ? '#ff845d' : '#ffbfd8');
      ellipse(g, cx + dx * size - 2, cy + dy * size - 2, r * size * .55, r * size * .4, hot ? '#ffc84b' : '#fff8e7');
    }
    quantize(c);
    return c;
  };
  A.explosion = null;
  A.explosionPink = null;
  A.explosionBig = null;

  A.makeMuzzle = function (color) {
    const c = canvas(26, 26), g = c.getContext('2d');
    g.translate(13, 13);
    g.fillStyle = '#fff8e7';
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * TAU;
      const r = i % 2 ? 3 : 12;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (!i) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.closePath(); g.fill();
    g.fillStyle = color;
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      const r = i % 2 ? 2 : 8;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (!i) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.closePath(); g.fill();
    g.fillStyle = '#fff8e7'; g.beginPath(); g.arc(0, 0, 3, 0, TAU); g.fill();
    quantize(c);
    return c;
  };

  A.makeOrb = function (color, dark) {
    const c = canvas(30, 30), g = c.getContext('2d');
    g.translate(15, 15);
    g.fillStyle = 'rgba(255,200,75,.2)'; g.beginPath(); g.arc(0, 0, 14, 0, TAU); g.fill();
    g.fillStyle = dark; g.beginPath(); g.arc(0, 0, 10, 0, TAU); g.fill();
    g.fillStyle = color; g.beginPath(); g.arc(0, 0, 8, 0, TAU); g.fill();
    g.fillStyle = '#fff3a6'; g.beginPath(); g.arc(-2, -2, 4, 0, TAU); g.fill();
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * TAU;
      g.fillStyle = '#ffc84b';
      g.fillRect(Math.cos(a) * 12 - 1, Math.sin(a) * 12 - 1, 2, 2);
    }
    quantize(c);
    return c;
  };

  A.makeInk = function () {
    const c = canvas(22, 22), g = c.getContext('2d');
    g.translate(11, 11);
    g.fillStyle = '#1a1222'; g.beginPath(); g.arc(0, 0, 7, 0, TAU); g.fill();
    g.fillStyle = '#4d2c4e'; g.beginPath(); g.arc(-2, -2, 4, 0, TAU); g.fill();
    g.fillStyle = '#9c62c8'; g.beginPath(); g.arc(-3, -3, 1.5, 0, TAU); g.fill();
    quantize(c);
    return c;
  };

  A.makeHeartProjectile = function () {
    const c = canvas(24, 24), g = c.getContext('2d');
    g.translate(12, 12);
    heartShape(g, 0, 0, 9, '#0b0812');
    heartShape(g, 0, -.5, 7.5, '#ff5b9d');
    heartShape(g, -2, -2, 3, '#ffbfd8');
    quantize(c);
    return c;
  };

  A.makeRose = function () {
    const c = canvas(24, 24), g = c.getContext('2d');
    g.translate(12, 12);
    line(g, 2, 6, 2, -2, '#2f8a3f', 2);
    ellipse(g, -3, 3, 5, 3, '#1c562a', -.5);
    ellipse(g, 6, 5, 4, 2.5, '#2f8a3f', .4);
    circle(g, 2, -4, 8, '#0b0812');
    circle(g, 2, -4, 6.5, '#c62265');
    circle(g, 1, -5, 4.5, '#ff5b9d');
    circle(g, 0, -6, 2.4, '#ffbfd8');
    quantize(c);
    return c;
  };

  A.makeStampProjectile = function () {
    const c = canvas(30, 30), g = c.getContext('2d');
    g.translate(15, 15); g.rotate(-.3);
    rect(g, -8, -8, 16, 10, '#5c3415');
    rect(g, -10, 0, 20, 5, '#0b0812');
    rect(g, -12, 5, 24, 8, '#c62265');
    rect(g, -10, 6, 20, 4, '#8f154d');
    g.fillStyle = '#ffe7c6'; g.font = 'bold 4px monospace'; g.textAlign = 'center'; g.fillText('TIMBRA', 0, 11);
    quantize(c);
    return c;
  };

  A.makePhoneWave = function (color) {
    const c = canvas(42, 26), g = c.getContext('2d');
    g.translate(4, 13);
    for (let r = 18; r > 2; r -= 6) {
      g.strokeStyle = r > 12 ? color : '#ff845d';
      g.lineWidth = 2.5;
      g.beginPath(); g.arc(0, 0, r, -.9, .9); g.stroke();
    }
    g.fillStyle = '#fff8e7'; g.font = 'bold 4px monospace'; g.textAlign = 'center'; g.fillText('RECLAMO', 0, 1);
    quantize(c);
    return c;
  };

  A.icons = {};
  A.buildV1Icons = function () {
    if (A._v1Icons) return;
    A._v1Icons = true;
    A.icons.muzzlePink = A.makeMuzzle('#ff5b9d');
    A.icons.muzzleGold = A.makeMuzzle('#ffc84b');
    A.icons.muzzleDark = A.makeMuzzle('#9c62c8');
    A.icons.orb = A.makeOrb('#ffc84b', '#8d5016');
    A.icons.orbPink = A.makeOrb('#ff5b9d', '#8f154d');
    A.icons.ink = A.makeInk();
    A.icons.heart = A.makeHeartProjectile();
    A.icons.rose = A.makeRose();
    A.icons.stamp = A.makeStampProjectile();
    A.icons.phone = A.makePhoneWave('#51c7a9');
    A.icons.crate = A.props.crate;
    A.icons.barrel = A.props.barrel;

    // HUD face icon constructed from the baked sprite
    const face = canvas(34, 34);
    const fg = face.getContext('2d');
    fg.imageSmoothingEnabled = false;
    const spr = A.getPlayerFrame({ mode: 'idle', phase: .1 });
    // crop around the head of the 96px sprite
    fg.drawImage(spr, 26, 12, 34, 34, 2, 1, 30, 30);
    fg.fillStyle = '#ff5b9d';
    fg.fillRect(0, 30, 34, 4);
    quantize(face);
    A.icons.adeleFace = face;

    // rank medals / stamps
    A.explosion = A.makeExplosion(42, false);
    A.explosionPink = A.makeExplosion(54, false);
    A.explosionBig = A.makeExplosion(86, true);
  };
  A.buildIcons = function () {
    A.buildV1Icons();
    A._buildThemeParts(['roma', 'europa', 'sogei'], 'icons');
  };

  /* =========================================================
     SFONDI — Porto di Bari + Bari Vecchia
     ========================================================= */
  function bandedGradient(g, w, y0, y1, colors, step = 4) {
    const n = colors.length - 1;
    const total = y1 - y0;
    for (let y = y0; y < y1; y += step) {
      const t = (y - y0) / total;
      const idx = Math.min(n - 1, Math.floor(t * n));
      g.fillStyle = colors[idx];
      g.fillRect(0, y, w, step);
      if (idx < n - 1) {
        const local = (t * n) % 1;
        if (local > .62) {
          g.fillStyle = colors[idx + 1];
          const dy = (y / step) % 2;
          for (let x = dy * 2; x < w; x += 4) g.fillRect(x, y, 2, 1);
        }
      }
    }
  }

  function cloud(g, x, y, s, col = '#fff8e7', shade = '#d9e5e3') {
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    g.fillStyle = shade;
    ellipse(g, 0, 6, 34, 10, shade);
    ellipse(g, 23, 2, 19, 11, shade);
    ellipse(g, -25, 2, 16, 9, shade);
    g.fillStyle = col;
    ellipse(g, 0, 0, 28, 10, col);
    ellipse(g, 20, -3, 17, 10, col);
    ellipse(g, -22, -2, 14, 8, col);
    ellipse(g, 5, -9, 18, 10, col);
    ellipse(g, 27, 3, 12, 5, col);
    ellipse(g, -30, 4, 10, 4, col);
    g.fillStyle = '#ffffff';
    ellipse(g, 2, -11, 12, 5, '#ffffff');
    g.restore();
  }

  function bariWaterfront(g, w, baseline) {
    let x = 0;
    const rand = mulberry32(19);
    while (x < w) {
      const bw = 38 + Math.floor(rand() * 48);
      const bh = 22 + Math.floor(rand() * 38);
      const top = baseline - bh;
      g.fillStyle = '#e8dcc2';
      g.fillRect(x, top, bw, bh);
      g.fillStyle = '#fff2d2';
      g.fillRect(x + 2, top + 2, bw - 4, Math.max(3, bh * .3));
      g.fillStyle = '#c9b58f';
      g.fillRect(x, baseline - 2, bw, 2);
      if (rand() > .72) {
        g.fillStyle = '#d9c7a2';
        g.fillRect(x + bw * .3, top - 10, bw * .4, 10);
        g.fillStyle = '#b5683c';
        g.fillRect(x + bw * .2, top - 12, bw * .6, 3);
        g.fillStyle = '#665269';
        g.fillRect(x + bw * .46, top - 19, 4, 8);
      }
      g.fillStyle = '#665269';
      for (let wy = top + 8; wy < baseline - 6; wy += 10) {
        for (let wx = x + 6; wx < x + bw - 5; wx += 11) {
          g.fillStyle = '#665269';
          g.fillRect(wx, wy, 3, 5);
          g.fillStyle = '#9a7d64';
          g.fillRect(wx, wy, 3, 1);
        }
      }
      x += bw + 4 + Math.floor(rand() * 6);
    }
    g.fillStyle = '#f4ead4'; g.fillRect(380, baseline - 46, 118, 46);
    g.fillStyle = '#fff8e7'; g.fillRect(386, baseline - 42, 106, 8);
    for (let i = 0; i < 7; i++) { g.fillStyle = '#7b6870'; g.fillRect(392 + i * 14, baseline - 30, 4, 17); }
    g.fillStyle = '#d7c7a4'; g.fillRect(376, baseline - 50, 126, 6);
    g.fillStyle = '#b8a17e'; g.fillRect(376, baseline - 4, 126, 4);
    g.fillStyle = '#d9c7a2'; g.fillRect(660, baseline - 34, 80, 34);
    g.beginPath(); g.ellipse(700, baseline - 35, 38, 19, 0, Math.PI, TAU); g.fillStyle = '#c39a6b'; g.fill();
    g.fillStyle = '#8d6c58'; g.fillRect(696, baseline - 57, 7, 13);
    g.beginPath(); g.arc(699, baseline - 60, 5, 0, TAU); g.fillStyle = '#e0b87b'; g.fill();
    g.fillStyle = '#fff2d2'; g.fillRect(666, baseline - 28, 68, 12);
    for (let i = 0; i < 5; i++) { g.fillStyle = '#8f7d73'; g.fillRect(670 + i * 13, baseline - 24, 3, 8); }
    g.fillStyle = '#efe6d0'; g.fillRect(1090, baseline - 76, 13, 76);
    g.fillStyle = '#d8c7a5'; g.fillRect(1090, baseline - 76, 4, 76);
    g.fillStyle = '#9a3d3b'; g.fillRect(1088, baseline - 80, 17, 7);
    g.fillStyle = '#ffe7a2'; g.fillRect(1092, baseline - 89, 9, 9);
    g.strokeStyle = '#d2b36f'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(1091, baseline - 83); g.lineTo(1075, baseline - 94); g.moveTo(1102, baseline - 83); g.lineTo(1118, baseline - 94); g.stroke();
    g.fillStyle = '#dbc8aa'; g.fillRect(1320, baseline - 59, 34, 59);
    g.fillStyle = '#b27c55'; g.beginPath(); g.moveTo(1318, baseline - 59); g.lineTo(1337, baseline - 83); g.lineTo(1356, baseline - 59); g.closePath(); g.fill();
    g.fillStyle = '#6e554f'; g.fillRect(1333, baseline - 50, 7, 12);
  }

  function crane(g, x, baseY, h, col = '#c87b1e', dark = '#5c3415', alpha = 1) {
    g.save();
    g.globalAlpha = alpha;
    g.strokeStyle = '#13202f'; g.lineWidth = 9;
    g.beginPath(); g.moveTo(x - 14, baseY); g.lineTo(x - 5, baseY - h * .7); g.lineTo(x - 2, baseY - h); g.stroke();
    g.beginPath(); g.moveTo(x + 16, baseY); g.lineTo(x + 6, baseY - h * .7); g.lineTo(x + 2, baseY - h); g.stroke();
    g.strokeStyle = col; g.lineWidth = 5;
    g.beginPath(); g.moveTo(x - 14, baseY); g.lineTo(x - 5, baseY - h * .7); g.lineTo(x - 2, baseY - h); g.stroke();
    g.beginPath(); g.moveTo(x + 16, baseY); g.lineTo(x + 6, baseY - h * .7); g.lineTo(x + 2, baseY - h); g.stroke();
    g.strokeStyle = dark; g.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const yy = baseY - 16 - i * 18;
      if (yy < baseY - h * .72) break;
      g.beginPath(); g.moveTo(x - 14 + i * 2, yy); g.lineTo(x + 16 - i * 2, yy - 18); g.stroke();
    }
    g.fillStyle = '#13202f'; g.fillRect(x - 17, baseY - h - 2, 38, 15);
    g.fillStyle = col; g.fillRect(x - 15, baseY - h, 34, 10);
    g.fillStyle = '#d4e5ee'; g.fillRect(x - 10, baseY - h + 2, 12, 5);
    g.fillStyle = dark; g.fillRect(x + 9, baseY - h + 2, 7, 5);
    g.strokeStyle = '#13202f'; g.lineWidth = 8;
    g.beginPath(); g.moveTo(x + 8, baseY - h - 5); g.lineTo(x - 82, baseY - h - 23); g.stroke();
    g.beginPath(); g.moveTo(x + 8, baseY - h - 5); g.lineTo(x + 64, baseY - h - 17); g.stroke();
    g.strokeStyle = col; g.lineWidth = 4;
    g.beginPath(); g.moveTo(x + 8, baseY - h - 5); g.lineTo(x - 82, baseY - h - 23); g.stroke();
    g.beginPath(); g.moveTo(x + 8, baseY - h - 5); g.lineTo(x + 64, baseY - h - 17); g.stroke();
    g.strokeStyle = dark; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x + 8, baseY - h - 5); g.lineTo(x + 64, baseY - h - 35); g.stroke();
    g.beginPath(); g.moveTo(x - 60, baseY - h - 22); g.lineTo(x - 60, baseY - 44); g.stroke();
    g.strokeStyle = '#13202f'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(x - 60, baseY - h - 23); g.lineTo(x - 60, baseY - 42); g.stroke();
    g.strokeRect(x - 63, baseY - 43, 6, 5);
    g.fillStyle = '#ef367f'; g.fillRect(x - 3, baseY - h - 20, 3, 3);
    g.fillStyle = '#ffc84b'; g.fillRect(x + 52, baseY - h - 22, 2, 2);
    g.restore();
  }

  function warehouse(g, x, baseY, w, h, wall, roof) {
    g.fillStyle = '#13202f'; g.fillRect(x - 2, baseY - h - 2, w + 4, h + 2);
    g.fillStyle = wall; g.fillRect(x, baseY - h, w, h);
    g.fillStyle = roof; g.beginPath();
    g.moveTo(x - 6, baseY - h); g.lineTo(x + w * .25, baseY - h - 15); g.lineTo(x + w * .8, baseY - h - 15); g.lineTo(x + w + 6, baseY - h); g.closePath(); g.fill();
    g.fillStyle = shadeColor(wall, -18);
    for (let i = 0; i < Math.floor(w / 22); i++) g.fillRect(x + 12 + i * 22, baseY - h + 12, 9, h - 18);
    g.fillStyle = '#48576e'; g.fillRect(x + 8, baseY - h + 8, w - 16, 4);
    g.fillStyle = '#f5e9cc'; g.fillRect(x + w * .5 - 22, baseY - h + 6, 44, 9);
    g.fillStyle = '#66192a'; g.font = 'bold 5px monospace'; g.textAlign = 'center';
    g.fillText('DOGANA', x + w * .5, baseY - h + 13);
  }

  function container(g, x, y, w, h, color, label = 'DOGANA', dark) {
    g.fillStyle = '#0b0812'; g.fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle = color; g.fillRect(x, y, w, h);
    g.fillStyle = shadeColor(color, -24); g.fillRect(x, y + h - 5, w, 5);
    g.fillStyle = shadeColor(color, 16); g.fillRect(x, y, w, 3);
    for (let i = 0; i < w; i += 7) {
      g.fillStyle = shadeColor(color, -13);
      g.fillRect(x + i, y + 3, 1, h - 8);
    }
    g.fillStyle = '#13202f';
    g.fillRect(x + 2, y + 4, w - 4, h - 10);
    g.fillStyle = color;
    g.fillRect(x + 5, y + 7, w - 10, h - 16);
    g.fillStyle = '#f5e9cc'; g.font = 'bold 5px monospace'; g.textAlign = 'center';
    g.fillText(label, x + w / 2, y + h / 2 + 2);
    g.fillStyle = shadeColor(color, -32);
    g.fillRect(x + 1, y + h - 2, 4, 2);
    g.fillRect(x + w - 5, y + h - 2, 4, 2);
  }

  function shadeColor(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
    const gg = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    const b = Math.max(0, Math.min(255, (n & 255) + amt));
    return '#' + ((1 << 24) + (r << 16) + (gg << 8) + b).toString(16).slice(1);
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function palm(g, x, baseY, h, scale) {
    g.save();
    g.translate(x, baseY);
    g.strokeStyle = '#5c3415'; g.lineWidth = 6 * scale; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(4 * scale, -h * .5, -2 * scale, -h); g.stroke();
    g.strokeStyle = '#8d5016'; g.lineWidth = 3 * scale;
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(4 * scale, -h * .5, -2 * scale, -h); g.stroke();
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI + i * Math.PI / 7;
      g.save(); g.translate(-2 * scale, -h); g.rotate(a);
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(16 * scale, -8 * scale, 32 * scale, 1 * scale); g.quadraticCurveTo(17 * scale, 3 * scale, 0, 5 * scale); g.closePath();
      g.fillStyle = i % 2 ? '#1c562a' : '#2f8a3f'; g.fill();
      g.strokeStyle = '#13202f'; g.lineWidth = 1; g.stroke();
      g.restore();
    }
    circle(g, 0, -h, 3 * scale, '#5c3415');
    g.restore();
  }

  function buildPortSky() {
    const c = canvas(640, 360), g = c.getContext('2d');
    bandedGradient(g, 640, 0, 216, ['#4b83ae', '#6fa9c6', '#9bccda', '#cbe5e1', '#f3e0ba', '#ffd19a'], 3);
    g.fillStyle = 'rgba(255,246,190,.16)'; g.beginPath(); g.arc(494, 76, 58, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,243,166,.22)'; g.beginPath(); g.arc(494, 76, 43, 0, TAU); g.fill();
    circle(g, 494, 76, 28, '#ffe8a3');
    circle(g, 494, 76, 23, '#fff5c7');
    circle(g, 494, 76, 18, '#fffbe4');
    for (let i = 0; i < 11; i++) {
      const a = i / 11 * TAU;
      g.fillStyle = 'rgba(255,246,190,.38)';
      g.fillRect(494 + Math.cos(a) * 36, 76 + Math.sin(a) * 36, 3, 3);
    }
    cloud(g, 92, 74, .78, '#fffaf0', '#dce2d8');
    cloud(g, 258, 49, .52, '#fffaf0', '#dde5df');
    cloud(g, 571, 126, .62, '#fff8ea', '#d9e1dd');
    cloud(g, 352, 130, .34, '#fff8ea', '#dbe4dc');
    g.strokeStyle = '#645269'; g.lineWidth = 1;
    for (const [x, y, s] of [[168, 100, 5], [182, 92, 3], [430, 58, 4], [440, 53, 2]]) {
      g.beginPath(); g.moveTo(x - s, y); g.quadraticCurveTo(x - s * .5, y - 3, x, y); g.quadraticCurveTo(x + s * .5, y - 3, x + s, y); g.stroke();
    }
    bandedGradient(g, 640, 207, 360, ['#568fa2', '#43869d', '#387990', '#2d697f', '#22566d', '#1a465e'], 3);
    g.fillStyle = 'rgba(255,236,192,.3)'; g.fillRect(0, 206, 640, 3);
    const rand = mulberry32(91);
    for (let i = 0; i < 150; i++) {
      const x = Math.floor(rand() * 640), y = 214 + Math.floor(rand() * 143);
      const len = 4 + Math.floor(rand() * 18);
      const col = y < 250 ? 'rgba(207,239,238,.43)' : y < 290 ? 'rgba(194,232,235,.24)' : 'rgba(215,243,240,.18)';
      g.fillStyle = col; g.fillRect(x, y, len, 1);
    }
    for (let i = 0; i < 16; i++) {
      g.fillStyle = 'rgba(255,238,186,.35)';
      g.fillRect(430 + rand() * 120, 224 + rand() * 80, 2 + rand() * 8, 1);
    }
    g.fillStyle = '#b7a17d'; g.fillRect(0, 204, 80, 12);
    g.fillStyle = '#937f65'; g.fillRect(0, 213, 80, 4);
    return c;
  }

  function buildPortFar() {
    const w = 1500;
    const c = canvas(w, 360), g = c.getContext('2d');
    bariWaterfront(g, w, 208);
    g.fillStyle = 'rgba(252,227,190,.22)'; g.fillRect(0, 168, w, 46);
    g.fillStyle = '#6c7b8d'; g.fillRect(0, 206, w, 5);
    g.fillStyle = '#435772'; g.fillRect(0, 211, w, 4);
    g.globalAlpha = .38;
    crane(g, 1180, 220, 92, '#5a6a84', '#354656');
    g.globalAlpha = 1;
    const rand = mulberry32(121);
    for (let i = 0; i < 130; i++) {
      const x = rand() * w, y = 218 + rand() * 82;
      g.fillStyle = rand() > .5 ? 'rgba(255,244,211,.3)' : 'rgba(197,234,237,.2)';
      g.fillRect(x, y, 2 + rand() * 9, 1);
    }
    for (const [x, y, s] of [[230, 231, .8], [470, 245, .55], [860, 227, .7], [1320, 238, .5]]) {
      g.fillStyle = '#f5e9cc'; g.beginPath(); g.moveTo(x, y - 17 * s); g.lineTo(x + 12 * s, y); g.lineTo(x, y); g.closePath(); g.fill();
      g.fillStyle = '#d7c7a4'; g.fillRect(x - 12 * s, y, 28 * s, 3);
      g.strokeStyle = '#13202f'; g.lineWidth = .8; g.strokeRect(x - 12 * s, y, 28 * s, 3);
    }
    return c;
  }

  function buildPortMid() {
    const w = 2400;
    const c = canvas(w, 360), g = c.getContext('2d');
    // banchina continua dietro le strutture: dà appoggio a gru e capannoni
    g.fillStyle = '#314052'; g.fillRect(0, 256, w, 104);
    g.fillStyle = '#536074'; g.fillRect(0, 256, w, 6);
    g.fillStyle = '#6b7584'; g.fillRect(0, 256, w, 2);
    g.fillStyle = '#253241'; g.fillRect(0, 292, w, 68);
    g.fillStyle = '#1e2a38'; g.fillRect(0, 302, w, 58);
    const quayRand = mulberry32(713);
    for (let i = 0; i < 160; i++) {
      const x = quayRand() * w, y = 262 + quayRand() * 42;
      g.fillStyle = quayRand() > .5 ? 'rgba(222,229,222,.08)' : 'rgba(5,12,20,.18)';
      g.fillRect(x, y, 1 + quayRand() * 4, 1);
    }
    for (let x = 20; x < w; x += 88) {
      g.fillStyle = 'rgba(16,27,41,.45)';
      g.fillRect(x, 262, 1, 42);
    }
    g.fillStyle = 'rgba(255,213,137,.15)'; g.fillRect(0, 284, w, 2);
    warehouse(g, 60, 270, 210, 58, '#687589', '#4c5a6f');
    warehouse(g, 980, 270, 260, 66, '#5e6c80', '#46556b');
    warehouse(g, 1900, 270, 290, 52, '#69768a', '#4a586c');
    container(g, 380, 238, 74, 30, '#a34b55', 'BARI', '#5c1e2e');
    container(g, 452, 238, 74, 30, '#496a84', 'DOGANA', '#283b4d');
    container(g, 382, 210, 68, 26, '#6e7a56', 'MOLO', '#3d472f');
    container(g, 1430, 238, 82, 34, '#ad7540', 'PORTO', '#5d3e21');
    container(g, 1510, 238, 62, 34, '#576f8b', 'BARI', '#2d3d50');
    container(g, 2070, 234, 88, 34, '#567a77', 'DOGANA', '#2b4745');
    g.fillStyle = '#1b2a3e'; g.beginPath();
    g.moveTo(560, 242); g.lineTo(900, 242); g.lineTo(866, 274); g.lineTo(592, 274); g.closePath(); g.fill();
    g.fillStyle = '#a24d46'; g.fillRect(560, 268, 307, 8);
    g.fillStyle = '#efe4cf'; g.fillRect(690, 216, 132, 25);
    g.fillStyle = '#d9c9ae'; g.fillRect(694, 219, 124, 7);
    for (let i = 0; i < 7; i++) { g.fillStyle = '#5a6776'; g.fillRect(703 + i * 16, 227, 7, 7); }
    g.fillStyle = '#ef367f'; g.fillRect(804, 215, 13, 13);
    g.fillStyle = '#8d5016'; g.fillRect(806, 218, 9, 2);
    crane(g, 260, 278, 158, '#b5833e', '#5f4522');
    crane(g, 790, 278, 195, '#bd8b43', '#5f4522');
    crane(g, 1280, 278, 174, '#a97436', '#5f4522');
    crane(g, 1830, 278, 205, '#b5833e', '#5f4522');
    crane(g, 2280, 278, 165, '#9e7c47', '#5f4522');
    for (const x of [126, 1000, 1990]) {
      g.fillStyle = '#ffc84b';
      g.fillRect(x, 250, 3, 3);
      g.fillStyle = 'rgba(255,200,75,.22)'; g.beginPath(); g.arc(x + 1, 251, 10, 0, TAU); g.fill();
      g.fillStyle = '#ffc84b';
    }
    g.strokeStyle = '#3d475e'; g.lineWidth = 1;
    for (let x = 0; x < w; x += 42) { g.beginPath(); g.moveTo(x, 270); g.lineTo(x, 284); g.stroke(); }
    g.fillStyle = '#3d475e'; g.fillRect(0, 272, w, 1);
    g.fillStyle = 'rgba(207,231,228,.12)'; g.fillRect(0, 270, w, 12);
    return c;
  }

  function buildPortNear() {
    const w = 3200;
    const c = canvas(w, 360), g = c.getContext('2d');
    g.fillStyle = '#22304a'; g.fillRect(156, 210, 152, 92);
    g.fillStyle = '#f1e6ce'; g.fillRect(160, 214, 144, 84);
    g.fillStyle = '#e2d3b1'; g.fillRect(160, 214, 144, 9);
    g.fillStyle = '#22304a'; g.fillRect(178, 232, 49, 34); g.fillRect(246, 232, 40, 34);
    g.fillStyle = '#7fa7b4'; g.fillRect(181, 235, 43, 28); g.fillRect(249, 235, 34, 28);
    g.fillStyle = 'rgba(255,250,230,.34)'; g.fillRect(183, 237, 11, 24); g.fillRect(251, 237, 8, 24);
    g.fillStyle = '#13202f'; g.fillRect(176, 230, 53, 2); g.fillRect(244, 230, 44, 2);
    g.fillStyle = '#263957'; g.fillRect(194, 272, 26, 26);
    g.fillStyle = '#4f91bd'; g.fillRect(197, 275, 20, 23);
    g.fillStyle = '#ffc84b'; g.fillRect(214, 286, 2, 2);
    g.fillStyle = '#17334a'; g.fillRect(152, 196, 164, 24);
    g.fillStyle = '#ffc84b'; g.fillRect(155, 199, 158, 18);
    g.fillStyle = '#66192a'; g.font = 'bold 10px monospace'; g.textAlign = 'center';
    g.fillText('DOGANA DEL PORTO', 232, 211);
    g.fillStyle = '#fff8e7'; g.fillRect(160, 205, 144, 1);
    g.font = 'bold 5px monospace'; g.fillStyle = '#7d3f35'; g.fillText('BARI · MOLO SAN NICOLA', 232, 216);
    g.fillStyle = '#435772'; g.fillRect(146, 189, 174, 8);
    g.fillStyle = '#6e8296'; g.fillRect(150, 184, 166, 5);
    g.fillStyle = '#22304a'; g.fillRect(320, 240, 7, 66);
    g.fillStyle = '#f5e9cc'; g.fillRect(324, 242, 5, 60);
    g.fillStyle = '#c62265'; g.fillRect(320, 252, 10, 10);
    g.fillStyle = '#fff8e7'; g.fillRect(320, 262, 10, 10);
    g.fillStyle = '#c62265'; g.fillRect(320, 272, 10, 10);
    g.save(); g.translate(322, 250); g.rotate(-.12);
    g.fillStyle = '#f5e9cc'; g.fillRect(0, 0, 105, 6);
    for (let i = 0; i < 5; i++) { g.fillStyle = '#c62265'; g.fillRect(10 + i * 21, 0, 11, 6); }
    g.fillStyle = '#38220f'; g.fillRect(0, -2, 3, 10);
    g.restore();
    function fence(x, width, top = 252) {
      g.fillStyle = '#2e3a50'; g.fillRect(x, top, 3, 318 - top);
      g.fillStyle = '#2e3a50'; g.fillRect(x + width, top, 3, 318 - top);
      g.fillStyle = '#35455d'; g.fillRect(x, top + 4, width + 3, 2); g.fillRect(x, top + 22, width + 3, 2);
      for (let xx = x + 6; xx < x + width; xx += 12) {
        g.fillStyle = '#26354c'; g.fillRect(xx, top + 5, 1, 17);
      }
      g.strokeStyle = '#1d2538'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, top + 4); g.lineTo(x + width, top + 23); g.stroke();
    }
    fence(0, 90, 254);
    fence(680, 180, 258);
    container(g, 540, 268, 94, 38, '#a24d46', 'BARI', '#5c2325');
    container(g, 638, 268, 76, 38, '#3f7f82', 'MOLO 3', '#214747');
    container(g, 544, 234, 86, 32, '#b37f43', 'DOGANA', '#5e4424');
    container(g, 918, 260, 112, 46, '#496a84', 'PORTO FRANCO', '#283b4d');
    container(g, 1034, 260, 78, 46, '#a24d46', 'BARI', '#5c2325');
    container(g, 1140, 276, 60, 30, '#7e8653', 'MOLO', '#444a2a');
    // traghetto ormeggiato al molo — Bari / Durazzo
    g.save();
    g.translate(1290, 120);
    // scafo
    g.fillStyle = '#0f1b2d';
    g.beginPath();
    g.moveTo(22, 162); g.lineTo(548, 162); g.lineTo(510, 190); g.lineTo(58, 190);
    g.closePath(); g.fill();
    g.fillStyle = '#20364e'; g.fillRect(28, 142, 502, 23);
    g.fillStyle = '#f1e6ce'; g.fillRect(30, 72, 490, 74);
    g.fillStyle = '#dfcfae'; g.fillRect(30, 72, 490, 6);
    g.fillStyle = '#c9b894'; g.fillRect(30, 136, 490, 8);
    // fascia blu e rossa
    g.fillStyle = '#2d648c'; g.fillRect(30, 108, 490, 12);
    g.fillStyle = '#a24d46'; g.fillRect(30, 126, 490, 6);
    // cabina superiore
    g.fillStyle = '#f7ecd5'; g.fillRect(118, 38, 292, 40);
    g.fillStyle = '#d9c9ae'; g.fillRect(118, 38, 292, 5);
    g.fillStyle = '#8e7e66'; g.fillRect(108, 30, 316, 10);
    g.fillStyle = '#22384e'; g.fillRect(124, 48, 280, 16);
    for (let i = 0; i < 13; i++) {
      g.fillStyle = i % 4 === 0 ? '#9fc1ea' : '#56708b';
      g.fillRect(132 + i * 21, 51, 12, 9);
      g.fillStyle = 'rgba(255,248,231,.35)';
      g.fillRect(133 + i * 21, 52, 4, 7);
    }
    // oblò
    for (let i = 0; i < 18; i++) {
      g.fillStyle = '#0b0812';
      g.beginPath(); g.arc(54 + i * 26, 90, 6, 0, TAU); g.fill();
      g.fillStyle = '#7fa7b4';
      g.beginPath(); g.arc(54 + i * 26, 90, 4.5, 0, TAU); g.fill();
      g.fillStyle = '#d4e5ee';
      g.fillRect(52 + i * 26, 88, 2, 2);
    }
    // fumaiolo
    g.fillStyle = '#293a50'; g.fillRect(470, 16, 28, 68);
    g.fillStyle = '#c74c4c'; g.fillRect(466, 20, 36, 16);
    g.fillStyle = '#f5e9cc'; g.fillRect(466, 20, 36, 4);
    g.fillStyle = '#c87b1e'; g.fillRect(464, 40, 40, 5);
    // fascione con nome
    g.fillStyle = '#f1e6ce'; g.fillRect(48, 146, 462, 13);
    g.fillStyle = '#293a50'; g.font = 'bold 10px monospace'; g.textAlign = 'center'; g.fillText('BARI · TRAGHETTO DEL PORTO', 278, 156);
    // salvagenti
    for (const x of [58, 478]) {
      g.strokeStyle = '#c74c4c'; g.lineWidth = 5;
      g.beginPath(); g.arc(x, 104, 7, 0, TAU); g.stroke();
      g.strokeStyle = '#fff8e7'; g.lineWidth = 2;
      g.beginPath(); g.arc(x, 104, 7, 0, TAU); g.stroke();
    }
    // cime di ormeggio
    g.strokeStyle = '#8a7459'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(38, 170); g.quadraticCurveTo(4, 205, 0, 242); g.stroke();
    g.beginPath(); g.moveTo(506, 170); g.quadraticCurveTo(548, 204, 540, 245); g.stroke();
    g.restore();
    g.fillStyle = '#8d5016'; g.fillRect(1180, 286, 34, 6); g.fillRect(1184, 292, 6, 10); g.fillRect(1202, 292, 6, 10);
    g.fillStyle = '#cbb98e'; g.fillRect(1490, 278, 28, 22); g.fillRect(1492, 270, 24, 9);
    g.save(); g.translate(790, 300);
    g.fillStyle = '#22304a'; g.fillRect(-22, -34, 20, 26);
    g.fillStyle = '#ffc84b'; g.fillRect(-18, -32, 14, 18);
    g.fillStyle = '#22304a'; g.fillRect(4, -42, 3, 36); g.fillRect(4, -42, 25, 3); g.fillRect(27, -42, 3, 15);
    g.fillStyle = '#3d4b5e'; g.fillRect(-10, 2, 10, 10);
    g.beginPath(); g.arc(-5, 12, 6, 0, TAU); g.fillStyle = '#1a1222'; g.fill();
    g.beginPath(); g.arc(16, 12, 6, 0, TAU); g.fill();
    g.fillStyle = '#ffc84b'; g.fillRect(2, -6, 20, 4);
    g.restore();
    for (const x of [380, 1290, 2180, 2840]) {
      g.fillStyle = '#26354c'; g.fillRect(x, 210, 4, 100);
      g.fillStyle = '#48576e'; g.fillRect(x - 5, 205, 14, 5);
      g.fillStyle = '#ffe39a'; g.fillRect(x - 3, 198, 10, 7);
      g.fillStyle = 'rgba(255,216,125,.25)'; g.beginPath(); g.arc(x + 2, 202, 24, 0, TAU); g.fill();
    }
    crane(g, 2450, 308, 228, '#c68d41', '#6e4c22');
    container(g, 2360, 268, 136, 44, '#567a77', 'DOGANA', '#2b4745');
    g.strokeStyle = '#8a7459'; g.lineWidth = 2;
    for (const x of [440, 1680, 2580]) {
      g.beginPath(); g.moveTo(x, 300); g.quadraticCurveTo(x + 20, 286, x + 40, 300); g.stroke();
      g.beginPath(); g.moveTo(x + 12, 300); g.quadraticCurveTo(x + 20, 291, x + 28, 300); g.stroke();
    }
    g.fillStyle = 'rgba(255,200,75,.20)'; g.fillRect(400, 299, 320, 3);
    g.fillStyle = 'rgba(255,200,75,.12)'; g.fillRect(1500, 300, 500, 2);
    for (const x of [82, 660, 1220, 1850, 2920]) {
      for (let i = 0; i < 5; i++) {
        g.strokeStyle = i % 2 ? '#5c7a48' : '#3f5e3b'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(x + i * 3, 306); g.quadraticCurveTo(x + i * 3 - 3, 296 - (i % 3) * 3, x + i * 3 + 2, 291 - (i % 2) * 4); g.stroke();
      }
    }
    return c;
  }

  function buildBariSky() {
    const c = canvas(640, 360), g = c.getContext('2d');
    bandedGradient(g, 640, 0, 230, ['#4a82b8', '#70a8cb', '#a4cddd', '#d7dfd0', '#f7e2b7', '#ffd59d'], 3);
    g.fillStyle = 'rgba(255,235,176,.28)'; g.beginPath(); g.arc(520, 92, 66, 0, TAU); g.fill();
    circle(g, 520, 92, 26, '#ffe4a2');
    circle(g, 520, 92, 19, '#fff6cf');
    cloud(g, 100, 66, .7, '#fffaf0', '#dfe3d7');
    cloud(g, 330, 44, .42, '#fff9ee', '#e1e5dc');
    cloud(g, 600, 135, .5, '#fff5e8', '#e0dfdc');
    bandedGradient(g, 640, 218, 300, ['#5e98a7', '#4b8b9f', '#3d7b90', '#2f6678'], 3);
    g.fillStyle = 'rgba(255,235,196,.36)'; g.fillRect(0, 218, 640, 2);
    const rand = mulberry32(44);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = 'rgba(228,248,240,.30)';
      g.fillRect(rand() * 640, 226 + rand() * 64, 2 + rand() * 7, 1);
    }
    g.strokeStyle = '#5d5468'; g.lineWidth = 1;
    for (const [x, y, s] of [[160, 120, 5], [175, 110, 3], [490, 58, 4]]) {
      g.beginPath(); g.moveTo(x - s, y); g.quadraticCurveTo(x - s / 2, y - 3, x, y); g.quadraticCurveTo(x + s / 2, y - 3, x + s, y); g.stroke();
    }
    return c;
  }

  function buildBariFar() {
    const w = 1500;
    const c = canvas(w, 360), g = c.getContext('2d');
    g.fillStyle = 'rgba(255,238,201,.25)'; g.fillRect(0, 200, w, 28);
    g.fillStyle = '#307287'; g.fillRect(0, 226, 290, 44);
    g.fillStyle = '#4e8fa1'; g.fillRect(0, 226, 290, 6);
    const rand = mulberry32(61);
    for (let i = 0; i < 36; i++) g.fillRect(rand() * 290, 236 + rand() * 28, 2 + rand() * 8, 1);
    g.fillStyle = '#cbb98e'; g.fillRect(0, 250, 302, 8);
    for (let x = 8; x < 300; x += 24) { g.fillStyle = '#e6d5b0'; g.fillRect(x, 258, 12, 30); g.fillStyle = '#a8976e'; g.fillRect(x + 3, 262, 3, 22); }
    g.fillStyle = '#b7a17d'; g.fillRect(0, 286, 302, 6);
    palm(g, 110, 254, 92, 1.1);
    palm(g, 238, 254, 72, .8);
    const buildings = [
      [310, 60, 95, '#efe2c4'], [410, 86, 75, '#e7d8b9'], [490, 54, 110, '#f4e7c9'],
      [606, 76, 88, '#dfd0b2'], [700, 48, 126, '#f2e6ca'], [830, 92, 63, '#e8d8ba'],
      [900, 68, 100, '#f6ead0'], [1002, 104, 75, '#e4d4b3'], [1082, 56, 125, '#f1e3c4'],
      [1210, 82, 84, '#dfcfb0'], [1300, 62, 110, '#f4e5c7']
    ];
    for (const [x, h, bw, col] of buildings) {
      g.fillStyle = '#8a7b6c'; g.fillRect(x - 2, 212 - h, bw + 4, h + 4);
      g.fillStyle = col; g.fillRect(x, 214 - h, bw, h);
      g.fillStyle = '#f9efdb'; g.fillRect(x + 3, 214 - h + 3, bw - 6, 5);
      g.fillStyle = '#b68c65'; g.fillRect(x - 4, 214 - h, bw + 8, 5);
      for (let wy = 220 - h + 10; wy < 202; wy += 16) {
        for (let wx = x + 8; wx < x + bw - 8; wx += 18) {
          g.fillStyle = '#887b73'; g.fillRect(wx, wy, 6, 9);
          g.fillStyle = '#d6c8a8'; g.fillRect(wx, wy, 6, 2);
        }
      }
    }
    g.fillStyle = '#cbb78e'; g.fillRect(1038, 130, 94, 84);
    g.fillStyle = '#e6d5b0'; g.fillRect(1040, 134, 90, 78);
    g.beginPath(); g.ellipse(1085, 132, 56, 35, 0, Math.PI, TAU); g.fillStyle = '#b7a17d'; g.fill();
    g.beginPath(); g.ellipse(1085, 132, 48, 30, 0, Math.PI, TAU); g.fillStyle = '#d8c5a0'; g.fill();
    g.fillStyle = '#8d7a66'; g.fillRect(1081, 91, 8, 13);
    g.fillStyle = '#ffc84b'; g.fillRect(1084, 84, 2, 8); g.fillRect(1081, 87, 8, 2);
    for (let i = 0; i < 4; i++) {
      g.fillStyle = '#6f665f'; g.fillRect(1054 + i * 18, 158, 7, 26);
      g.fillStyle = '#8c7e70'; g.fillRect(1054 + i * 18, 158, 7, 3);
    }
    g.fillStyle = '#d8c7a5'; g.fillRect(940, 112, 26, 100);
    g.fillStyle = '#ae8a67'; g.beginPath(); g.moveTo(936, 112); g.lineTo(953, 83); g.lineTo(970, 112); g.closePath(); g.fill();
    g.fillStyle = '#5d5468'; g.fillRect(947, 124, 12, 16);
    g.fillStyle = 'rgba(255,236,201,.24)'; g.fillRect(0, 200, w, 24);
    for (let i = 0; i < 30; i++) {
      g.fillStyle = i % 3 ? 'rgba(255,200,75,.24)' : 'rgba(255,91,157,.2)';
      g.fillRect(rand() * w, 50 + rand() * 150, 2, 2);
    }
    return c;
  }

  function buildBariMid() {
    const w = 2500;
    const c = canvas(w, 360), g = c.getContext('2d');
    g.fillStyle = '#b7a17d'; g.fillRect(0, 238, 480, 70);
    g.fillStyle = '#d8c7a5'; g.fillRect(0, 238, 480, 8);
    g.fillStyle = '#9e8c68'; g.fillRect(0, 256, 480, 3);
    for (let x = 10; x < 480; x += 32) { g.fillStyle = '#a8976e'; g.fillRect(x, 262, 3, 44); }
    for (const x of [64, 332]) {
      g.fillStyle = '#5c3415'; g.fillRect(x, 270, 64, 5); g.fillRect(x + 3, 260, 58, 4);
      g.fillStyle = '#8d5016'; g.fillRect(x + 8, 276, 5, 20); g.fillRect(x + 52, 276, 5, 20);
    }
    palm(g, 452, 308, 118, 1.35);
    palm(g, 20, 306, 100, 1.15);
    let x = 500;
    const rand = mulberry32(202);
    while (x < w - 700) {
      const bw = 150 + Math.floor(rand() * 110);
      const bh = 150 + Math.floor(rand() * 80);
      const base = 308;
      const col = rand() > .6 ? '#e7d7b7' : rand() > .3 ? '#dccaa8' : '#f0e1c3';
      g.fillStyle = '#8e7e66'; g.fillRect(x - 3, base - bh - 3, bw + 6, bh + 3);
      g.fillStyle = col; g.fillRect(x, base - bh, bw, bh);
      g.fillStyle = '#f8eed7'; g.fillRect(x + 2, base - bh + 2, bw - 4, 5);
      g.fillStyle = '#ac9473'; g.fillRect(x - 6, base - bh - 2, bw + 12, 7);
      g.fillStyle = '#c3ad87'; g.fillRect(x, base - bh + 12, bw, 3);
      const cols = Math.max(2, Math.floor(bw / 42));
      for (let r = 0; r < 3; r++) {
        for (let cc = 0; cc < cols; cc++) {
          const wx = x + 20 + cc * (bw - 36) / Math.max(1, cols - 1) - 8;
          const wy = base - bh + 34 + r * 36;
          if (wy > base - 38) continue;
          g.fillStyle = '#4d2f26'; g.fillRect(wx - 2, wy - 2, 20, 28);
          g.fillStyle = '#2a4350'; g.fillRect(wx, wy, 16, 24);
          g.fillStyle = '#78989b'; g.fillRect(wx + 1, wy + 1, 6, 20);
          g.fillStyle = '#4a6a5a'; g.fillRect(wx - 5, wy, 5, 24); g.fillRect(wx + 16, wy, 5, 24);
          g.fillStyle = '#6f8c7b'; g.fillRect(wx - 5, wy, 2, 24); g.fillRect(wx + 19, wy, 2, 24);
          g.fillStyle = '#ddd0ae'; g.fillRect(wx - 3, wy + 24, 22, 3);
        }
      }
      if (rand() > .36) {
        g.fillStyle = '#6a5747'; g.fillRect(x + 14, base - 74, bw - 28, 4);
        g.fillStyle = '#2f2b29';
        for (let bx = x + 18; bx < x + bw - 22; bx += 8) g.fillRect(bx, base - 88, 2, 15);
        g.fillRect(x + 14, base - 88, bw - 28, 2);
      }
      if (rand() > .45) {
        const ax = x + bw * .5 - 22;
        g.fillStyle = '#4a372e'; g.fillRect(ax, base - 64, 44, 64);
        g.beginPath(); g.arc(ax + 22, base - 64, 22, Math.PI, TAU); g.fillStyle = '#4a372e'; g.fill();
        g.fillStyle = '#19171b'; g.fillRect(ax + 5, base - 57, 34, 57);
        g.beginPath(); g.arc(ax + 22, base - 57, 17, Math.PI, TAU); g.fillStyle = '#19171b'; g.fill();
      }
      for (let i = 0; i < 3; i++) {
        const fx = x + 18 + i * 33;
        g.fillStyle = '#8d5016'; g.fillRect(fx, base - 52, 18, 7);
        g.fillStyle = '#2f8a3f'; g.fillRect(fx + 2, base - 57, 5, 6); g.fillRect(fx + 10, base - 59, 6, 8);
        g.fillStyle = '#ef367f'; g.fillRect(fx + 5, base - 60, 3, 3); g.fillRect(fx + 13, base - 61, 2, 2);
      }
      x += bw + 8 + Math.floor(rand() * 10);
    }
    for (let i = 0; i < 2; i++) {
      const ax = 2020 + i * 230;
      g.fillStyle = '#a58c68'; g.fillRect(ax, 120, 200, 188);
      g.fillStyle = '#d8c7a5'; g.fillRect(ax + 8, 128, 184, 180);
      g.fillStyle = '#4a372e'; g.beginPath(); g.arc(ax + 100, 238, 58, Math.PI, TAU); g.fill(); g.fillRect(ax + 42, 238, 116, 70);
      g.fillStyle = '#2d2528'; g.beginPath(); g.arc(ax + 100, 238, 48, Math.PI, TAU); g.fill(); g.fillRect(ax + 52, 238, 96, 70);
      g.fillStyle = '#ffc84b'; g.fillRect(ax + 94, 120, 12, 9); g.fillRect(ax + 20, 155, 4, 4); g.fillRect(ax + 174, 155, 4, 4);
    }
    for (const [lx, ly, length] of [[680, 128, 200], [1420, 116, 250], [2100, 140, 160]]) {
      g.strokeStyle = '#5a4b39'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(lx, ly); g.quadraticCurveTo(lx + length / 2, ly + 14, lx + length, ly); g.stroke();
      const cloths = ['#fff8e7', '#ff90b8', '#4f91bd', '#ffc84b', '#51c7a9'];
      for (let i = 0; i < 6; i++) {
        const cx = lx + 18 + i * (length - 28) / 6;
        const cy = ly + 5 + Math.sin(i / 6 * Math.PI) * 9;
        g.fillStyle = cloths[i % cloths.length];
        g.fillRect(cx, cy, 15, 18 + (i % 3) * 4);
        g.fillStyle = '#cfbca4'; g.fillRect(cx, cy, 15, 2);
        g.fillStyle = 'rgba(22,30,42,.35)'; g.fillRect(cx + 10, cy + 2, 5, 16 + (i % 3) * 4);
        g.fillStyle = '#8e7e66'; g.fillRect(cx + 3, cy - 2, 2, 2);
      }
    }
    return c;
  }

  function buildBariNear() {
    const w = 3400;
    const c = canvas(w, 360), g = c.getContext('2d');
    g.fillStyle = '#a78f69'; g.fillRect(0, 268, 460, 38);
    g.fillStyle = '#cbb98e'; g.fillRect(0, 262, 460, 8);
    for (let x = 0; x < 460; x += 26) { g.fillStyle = '#b7a17d'; g.fillRect(x, 252, 12, 18); }
    g.fillStyle = '#d8c7a5'; g.fillRect(0, 246, 460, 6);
    for (const x of [70, 380]) {
      g.fillStyle = '#1e2430'; g.fillRect(x, 180, 4, 88);
      g.fillStyle = '#2e3a50'; g.beginPath(); g.arc(x + 2, 180, 10, 0, TAU); g.fill();
      g.fillStyle = '#ffedb1'; g.beginPath(); g.arc(x + 2, 180, 6, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,222,135,.16)'; g.beginPath(); g.arc(x + 2, 180, 28, 0, TAU); g.fill();
      g.fillStyle = '#1e2430'; g.fillRect(x - 7, 194, 18, 3);
    }
    g.fillStyle = '#7f6d55'; g.fillRect(460, 36, 320, 280);
    g.fillStyle = '#e1cfae'; g.fillRect(466, 42, 308, 274);
    g.fillStyle = '#f5e8ce'; g.fillRect(466, 42, 308, 7);
    g.fillStyle = '#b29a73'; g.fillRect(466, 70, 308, 4);
    g.fillStyle = '#604839'; g.fillRect(514, 110, 90, 136);
    g.beginPath(); g.arc(559, 110, 45, Math.PI, TAU); g.fillStyle = '#604839'; g.fill();
    g.fillStyle = '#22303e'; g.fillRect(522, 118, 74, 128);
    g.beginPath(); g.arc(559, 118, 37, Math.PI, TAU); g.fillStyle = '#22303e'; g.fill();
    g.fillStyle = '#4e6d72'; g.fillRect(526, 122, 28, 124);
    g.fillStyle = '#6f918d'; g.fillRect(530, 125, 10, 120);
    g.strokeStyle = '#8a7459'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(559, 84); g.lineTo(559, 246); g.moveTo(522, 170); g.lineTo(596, 170); g.stroke();
    g.fillStyle = '#426854'; g.fillRect(502, 110, 12, 130); g.fillRect(604, 110, 12, 130);
    g.fillStyle = '#5e8971'; g.fillRect(504, 114, 3, 122); g.fillRect(606, 114, 3, 122);
    g.fillStyle = '#8d5016'; g.fillRect(505, 208, 108, 10);
    for (let i = 0; i < 10; i++) {
      g.fillStyle = i % 3 ? '#2f8a3f' : '#ef367f';
      g.fillRect(508 + i * 10, 202 - (i % 2) * 4, 5, 8);
    }
    g.fillStyle = '#66513d'; g.fillRect(670, 236, 72, 80);
    g.beginPath(); g.arc(706, 236, 36, Math.PI, TAU); g.fillStyle = '#66513d'; g.fill();
    g.fillStyle = '#1a191b'; g.fillRect(680, 242, 52, 74);
    g.beginPath(); g.arc(706, 242, 26, Math.PI, TAU); g.fillStyle = '#1a191b'; g.fill();
    for (const [lx, ly, len] of [[480, 78, 280], [1640, 74, 310], [2620, 92, 340]]) {
      g.strokeStyle = '#473a2d'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(lx, ly); g.quadraticCurveTo(lx + len / 2, ly + 15, lx + len, ly); g.stroke();
      const cloths = ['#fff8e7', '#ff90b8', '#4f91bd', '#ffc84b', '#51c7a9', '#c62265'];
      for (let i = 0; i < 8; i++) {
        const cx = lx + 14 + i * (len - 24) / 8;
        const cy = ly + 4 + Math.sin((i + .5) / 8 * Math.PI) * 9;
        const cw = 17 + (i % 3) * 5, ch = 24 + (i % 2) * 10;
        g.fillStyle = cloths[(i + Math.floor(lx)) % cloths.length];
        g.fillRect(cx, cy, cw, ch);
        g.fillStyle = 'rgba(27,30,40,.28)'; g.fillRect(cx + cw - 5, cy + 2, 4, ch - 2);
        g.fillStyle = '#a8976e'; g.fillRect(cx + 2, cy - 2, 2, 2);
      }
    }
    let x = 820;
    const rand = mulberry32(411);
    while (x < 3200) {
      const bw = 210 + Math.floor(rand() * 170);
      const bh = 100 + Math.floor(rand() * 90);
      const base = 304;
      g.fillStyle = '#786850'; g.fillRect(x - 4, base - bh - 4, bw + 8, bh + 4);
      g.fillStyle = rand() > .5 ? '#d8c7a5' : '#e4d3b2'; g.fillRect(x, base - bh, bw, bh);
      g.fillStyle = '#f5e8ce'; g.fillRect(x, base - bh, bw, 5);
      g.fillStyle = '#ad9572'; g.fillRect(x - 6, base - bh - 2, bw + 12, 6);
      for (let r = 0; r < 2; r++) {
        for (let cc = 0; cc < Math.floor(bw / 52); cc++) {
          const wx = x + 24 + cc * 52;
          const wy = base - bh + 24 + r * 45;
          g.fillStyle = '#67523d'; g.fillRect(wx - 2, wy - 2, 24, 31);
          g.fillStyle = '#334a4e'; g.fillRect(wx, wy, 20, 27);
          g.fillStyle = '#6f918d'; g.fillRect(wx + 2, wy + 2, 7, 23);
          g.fillStyle = '#485e50'; g.fillRect(wx - 7, wy, 7, 27); g.fillRect(wx + 20, wy, 7, 27);
        }
      }
      if (rand() > .5) {
        const ax = x + bw * .5;
        g.fillStyle = '#5c4734'; g.fillRect(ax - 30, base - 66, 60, 66);
        g.beginPath(); g.arc(ax, base - 66, 30, Math.PI, TAU); g.fillStyle = '#5c4734'; g.fill();
        g.fillStyle = '#171619'; g.fillRect(ax - 22, base - 58, 44, 58);
        g.beginPath(); g.arc(ax, base - 58, 22, Math.PI, TAU); g.fillStyle = '#171619'; g.fill();
      }
      for (let i = 0; i < 2; i++) {
        g.fillStyle = '#2f8a3f'; g.fillRect(x + 20 + i * 80, base - bh + 15, 12, 7);
        g.fillStyle = '#5ac457'; g.fillRect(x + 24 + i * 80, base - bh + 9, 5, 9);
      }
      x += bw + 14;
    }
    g.save(); g.translate(1510, 288);
    g.fillStyle = '#0b0812'; g.beginPath(); g.arc(-16, 20, 10, 0, TAU); g.fill();
    g.beginPath(); g.arc(22, 20, 10, 0, TAU); g.fill();
    g.fillStyle = '#48576e'; g.beginPath(); g.arc(-16, 20, 6, 0, TAU); g.fill(); g.beginPath(); g.arc(22, 20, 6, 0, TAU); g.fill();
    g.fillStyle = '#74b39a'; g.beginPath(); g.ellipse(1, 7, 24, 9, -.08, 0, TAU); g.fill();
    g.fillStyle = '#a9e7d1'; g.beginPath(); g.ellipse(-2, 5, 17, 4, -.05, 0, TAU); g.fill();
    g.fillStyle = '#cbb98e'; g.fillRect(-12, -6, 19, 9);
    g.fillStyle = '#1a1222'; g.fillRect(14, -16, 3, 22);
    g.beginPath(); g.arc(15, -18, 8, Math.PI, TAU); g.strokeStyle = '#1a1222'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#ffe7c6'; g.fillRect(16, -16, 5, 4);
    g.restore();
    g.save(); g.translate(2050, 292);
    g.fillStyle = '#5c3415'; g.fillRect(-42, 0, 84, 5); g.fillRect(-35, 5, 5, 16); g.fillRect(30, 5, 5, 16);
    g.fillStyle = '#fff8e7'; g.fillRect(-38, -4, 36, 5);
    g.fillStyle = '#e6d5b0'; g.fillRect(-36, -6, 32, 3);
    for (let i = 0; i < 6; i++) ellipse(g, -30 + i * 5, -7, 2.8, 1.3, '#fff3d0');
    g.fillStyle = '#c62265'; g.fillRect(8, -16, 28, 12);
    g.fillStyle = '#ffc84b'; g.font = 'bold 5px monospace'; g.textAlign = 'center'; g.fillText('ORECCHIETTE', 22, -8);
    g.restore();
    for (const px of [760, 1310, 1860, 2440, 3010]) {
      g.fillStyle = '#9a514e'; g.fillRect(px, 286, 22, 20);
      g.fillStyle = '#c16b5d'; g.fillRect(px + 2, 288, 18, 5);
      for (let i = 0; i < 6; i++) {
        g.strokeStyle = i % 2 ? '#1c562a' : '#2f8a3f'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(px + 11, 286); g.quadraticCurveTo(px + 4 + i * 4, 266 - (i % 3) * 6, px + 2 + i * 4, 256 - (i % 2) * 9); g.stroke();
      }
    }
    g.fillStyle = 'rgba(18,12,22,.18)'; g.fillRect(0, 300, w, 6);
    return c;
  }

  function buildGround(level) {
    const c = canvas(320, 58), g = c.getContext('2d');
    const rand = mulberry32(level === 1 ? 777 : 901);
    if (level === 1) {
      g.fillStyle = '#1a1222'; g.fillRect(0, 0, 320, 58);
      g.fillStyle = '#e6d5b0'; g.fillRect(0, 0, 320, 3);
      g.fillStyle = '#b7a88d'; g.fillRect(0, 3, 320, 5);
      g.fillStyle = '#ffc84b'; g.fillRect(0, 8, 320, 7);
      for (let x = 0; x < 320; x += 28) {
        g.fillStyle = '#1a1222';
        g.beginPath(); g.moveTo(x, 8); g.lineTo(x + 12, 8); g.lineTo(x + 20, 15); g.lineTo(x + 8, 15); g.closePath(); g.fill();
      }
      g.fillStyle = '#6e6c77'; g.fillRect(0, 15, 320, 8);
      g.fillStyle = '#54525d'; g.fillRect(0, 23, 320, 35);
      for (let x = 0; x < 320; x += 80) {
        g.fillStyle = '#3f3d47'; g.fillRect(x, 15, 2, 31);
        g.fillStyle = '#7e7c85'; g.fillRect(x + 2, 16, 1, 27);
      }
      g.fillStyle = '#3f3d47'; g.fillRect(0, 28, 320, 1);
      for (let i = 0; i < 70; i++) {
        const x = Math.floor(rand() * 318), y = 18 + Math.floor(rand() * 35);
        g.fillStyle = rand() > .5 ? 'rgba(230,213,176,.12)' : 'rgba(9,8,15,.18)';
        g.fillRect(x, y, 1 + rand() * 3, 1);
      }
      ellipse(g, 230, 36, 13, 3, '#3d3b44');
      ellipse(g, 230, 36, 11, 2, '#4e4c56');
      g.strokeStyle = '#393741'; g.lineWidth = 1;
      for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(230 + i * 5 - 10, 37); g.lineTo(230 + i * 5 - 8, 40); g.stroke(); }
      g.strokeStyle = '#343944'; g.beginPath(); g.moveTo(60, 30); g.lineTo(66, 37); g.lineTo(63, 42); g.stroke();
      g.fillStyle = '#17151d'; g.fillRect(0, 53, 320, 5);
      g.fillStyle = '#d2a63b'; g.fillRect(0, 50, 320, 1);
    } else if (level === 3) {
      g.fillStyle = '#1a1820'; g.fillRect(0, 0, 320, 58);
      g.fillStyle = '#e8e2d2'; g.fillRect(0, 0, 320, 3);
      g.fillStyle = '#b9b7a9'; g.fillRect(0, 3, 320, 4);
      g.fillStyle = '#758086'; g.fillRect(0, 7, 320, 1);
      g.fillStyle = '#6f7b80'; g.fillRect(0, 8, 320, 47);
      for (let x = 0; x < 320; x += 80) {
        g.fillStyle = '#5b666b'; g.fillRect(x, 8, 1, 45);
        g.fillStyle = 'rgba(255,248,231,.16)'; g.fillRect(x + 1, 9, 1, 40);
      }
      for (let y = 18; y < 54; y += 14) {
        g.fillStyle = 'rgba(38,45,49,.42)'; g.fillRect(0, y, 320, 1);
        g.fillStyle = 'rgba(255,248,231,.08)'; g.fillRect(0, y + 1, 320, 1);
      }
      for (let i = 0; i < 45; i++) {
        const x = Math.floor(rand() * 318), y = 10 + Math.floor(rand() * 40);
        g.fillStyle = rand() > .5 ? 'rgba(255,248,231,.1)' : 'rgba(15,18,22,.18)';
        g.fillRect(x, y, 1 + rand() * 4, 1);
      }
      g.fillStyle = '#3b4449'; g.fillRect(0, 55, 320, 3);
    } else {
      g.fillStyle = '#1a1222'; g.fillRect(0, 0, 320, 58);
      g.fillStyle = '#f5e9cc'; g.fillRect(0, 0, 320, 3);
      g.fillStyle = '#d8c7a5'; g.fillRect(0, 3, 320, 7);
      g.fillStyle = '#c8b691'; g.fillRect(0, 10, 320, 43);
      g.fillStyle = '#b9a67f'; g.fillRect(0, 10, 320, 2);
      for (let row = 0; row < 3; row++) {
        const y = 12 + row * 14;
        g.fillStyle = '#a89671'; g.fillRect(0, y + 12, 320, 2);
        const off = row % 2 ? 40 : 0;
        for (let x = off; x < 320; x += 80) {
          g.fillStyle = '#a89671'; g.fillRect(x, y, 2, 13);
          g.fillStyle = '#e6d5b0'; g.fillRect(x + 2, y, 1, 12);
        }
      }
      g.fillStyle = '#9c8a66'; g.fillRect(0, 46, 320, 9);
      for (let x = 0; x < 320; x += 16) {
        g.fillStyle = '#cbb98e';
        g.beginPath(); g.moveTo(x, 50); g.lineTo(x + 8, 46); g.lineTo(x + 16, 50); g.lineTo(x + 8, 54); g.closePath(); g.fill();
      }
      g.fillStyle = '#6c5d45'; g.fillRect(0, 55, 320, 3);
      for (let i = 0; i < 80; i++) {
        const x = Math.floor(rand() * 318), y = 12 + Math.floor(rand() * 32);
        g.fillStyle = rand() > .5 ? 'rgba(255,248,231,.15)' : 'rgba(79,63,45,.13)';
        g.fillRect(x, y, 1 + rand() * 2, 1);
      }
      for (let i = 0; i < 10; i++) {
        g.fillStyle = i % 3 ? 'rgba(198,34,101,.38)' : 'rgba(200,123,30,.3)';
        g.fillRect(rand() * 320, 18 + rand() * 30, 2, 1);
      }
    }
    return c;
  }

  function buildBossPort() {
    const c = canvas(640, 360), g = c.getContext('2d');
    g.fillStyle = '#1b2337'; g.fillRect(0, 0, 640, 360);
    bandedGradient(g, 640, 0, 232, ['#1c3558', '#3b557b', '#776e89', '#c48a87', '#e8ab87', '#ffd09a'], 3);
    g.fillStyle = 'rgba(255,180,132,.22)'; g.beginPath(); g.arc(466, 160, 90, 0, TAU); g.fill();
    circle(g, 466, 160, 50, '#ffbf82');
    circle(g, 466, 160, 42, '#ffd39a');
    circle(g, 466, 160, 33, '#ffe6b5');
    cloud(g, 100, 100, 1.1, '#867b92', '#6c647f');
    cloud(g, 500, 70, .9, '#9c8594', '#7b6d83');
    cloud(g, 300, 160, .55, '#e3b193', '#c69485');
    crane(g, 130, 272, 190, '#463f58', '#2b2a40');
    crane(g, 760, 272, 160, '#403b52', '#2b2a40');
    g.fillStyle = '#22334c'; g.beginPath();
    g.moveTo(0, 214); g.lineTo(256, 214); g.lineTo(220, 290); g.lineTo(0, 290); g.closePath(); g.fill();
    g.fillStyle = '#f1e3c7'; g.fillRect(0, 170, 180, 46);
    g.fillStyle = '#d8c7a5'; g.fillRect(0, 170, 180, 6);
    g.fillStyle = '#293a50';
    for (let i = 0; i < 8; i++) g.fillRect(9 + i * 20, 183, 11, 15);
    g.fillStyle = '#e14949'; g.fillRect(84, 160, 15, 12);
    g.fillStyle = '#f1e3c7'; g.fillRect(120, 148, 7, 24);
    g.fillStyle = '#ffc84b'; g.fillRect(121, 150, 5, 3);
    g.fillStyle = '#1b3045'; g.fillRect(0, 213, 260, 8);
    g.fillStyle = '#c74c4c'; g.fillRect(0, 280, 221, 6);
    for (let i = 0; i < 6; i++) { g.fillStyle = '#f5e9cc'; g.fillRect(10 + i * 26, 240, 13, 2); }
    // riempimento opaco: evita che il livello sottostante trasparisca
    bandedGradient(g, 640, 232, 274, ['#3c435b', '#344257', '#2c3c53'], 3);
    bandedGradient(g, 640, 274, 360, ['#6a5d77', '#514b65', '#3c435b', '#2c3c53'], 3);
    const rand = mulberry32(577);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = i % 4 ? 'rgba(255,201,141,.2)' : 'rgba(242,173,142,.36)';
      g.fillRect(rand() * 640, 280 + rand() * 80, 2 + rand() * 12, 1);
    }
    g.fillStyle = '#2a2537'; g.fillRect(330, 274, 18, 86);
    g.fillStyle = '#5c4a57'; g.fillRect(333, 274, 12, 60);
    g.fillStyle = '#c87b1e'; g.fillRect(330, 268, 18, 8);
    for (const x of [286, 550]) {
      g.fillStyle = '#2a2537'; g.fillRect(x, 302, 3, 30);
      g.fillStyle = '#ef367f'; g.fillRect(x - 3, 296, 9, 7);
      g.fillStyle = 'rgba(239,54,127,.23)'; g.beginPath(); g.arc(x + 2, 300, 20, 0, TAU); g.fill();
    }
    g.strokeStyle = 'rgba(255,212,151,.4)'; g.lineWidth = 1;
    for (let i = 0; i < 20; i++) { g.beginPath(); g.moveTo(430 + i * 2, 195 + i * 7); g.lineTo(500 - i * 2, 195 + i * 7); g.stroke(); }
    return c;
  }

  function buildBossBasilica() {
    const c = canvas(640, 360), g = c.getContext('2d');
    g.fillStyle = '#2c2130'; g.fillRect(0, 0, 640, 360);
    bandedGradient(g, 640, 0, 240, ['#1f2647', '#3c3e63', '#7b647c', '#c98b8c', '#edbb9b', '#ffdda9'], 3);
    const rand = mulberry32(818);
    for (let i = 0; i < 55; i++) {
      g.fillStyle = rand() > .7 ? 'rgba(255,244,205,.7)' : 'rgba(255,244,205,.35)';
      g.fillRect(rand() * 640, rand() * 100, 1, 1);
    }
    g.fillStyle = 'rgba(255,200,75,.16)'; g.beginPath(); g.arc(458, 185, 170, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,226,148,.2)'; g.beginPath(); g.arc(458, 185, 110, 0, TAU); g.fill();
    // piazza e scalinata: base opaca sotto la Basilica
    g.fillStyle = '#4a3d37'; g.fillRect(0, 240, 640, 120);
    g.fillStyle = '#6d5a4b'; g.fillRect(0, 248, 640, 112);
    g.fillStyle = '#8a735c'; g.fillRect(0, 264, 640, 96);
    g.fillStyle = '#75614d'; g.fillRect(0, 300, 640, 60);
    const piazzaRand = mulberry32(699);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = piazzaRand() > .5 ? 'rgba(255,232,194,.1)' : 'rgba(36,24,24,.15)';
      g.fillRect(piazzaRand() * 640, 248 + piazzaRand() * 55, 1 + piazzaRand() * 4, 1);
    }
    for (let y = 254; y < 304; y += 13) {
      g.fillStyle = 'rgba(48,35,33,.28)';
      g.fillRect(0, y, 640, 1);
      for (let x = (y / 13 % 2) * 30; x < 640; x += 60) g.fillRect(x, y, 1, 13);
    }
    g.fillStyle = '#a58b6d'; g.fillRect(0, 296, 640, 4);
    g.fillStyle = '#5a473b'; g.fillRect(0, 302, 640, 58);
    // ombre porticate ai piedi della facciata
    g.fillStyle = 'rgba(35,24,27,.32)'; g.fillRect(270, 294, 370, 14);
    g.fillStyle = '#d8c7a5'; g.fillRect(0, 208, 240, 86);
    g.fillStyle = '#b7a17d'; g.fillRect(0, 202, 240, 8);
    for (let i = 0; i < 5; i++) {
      g.fillStyle = i % 2 ? '#f0e1c3' : '#e0d0af'; g.fillRect(i * 50, 178 + (i % 3) * 7, 46, 40);
      g.fillStyle = '#b68c65'; g.fillRect(i * 50 - 2, 176 + (i % 3) * 7, 50, 4);
    }
    g.fillStyle = '#9d8768'; g.fillRect(270, 115, 370, 188);
    g.fillStyle = '#e8d8b9'; g.fillRect(278, 122, 354, 181);
    g.fillStyle = '#f7ecd5'; g.fillRect(278, 122, 354, 7);
    g.fillStyle = '#c0a983'; g.fillRect(278, 182, 354, 4);
    g.fillStyle = '#d8c6a2'; g.fillRect(278, 264, 354, 5);
    g.fillStyle = '#d8c6a2'; g.fillRect(366, 72, 170, 50);
    g.fillStyle = '#e9d9bb'; g.fillRect(372, 78, 158, 44);
    g.beginPath(); g.moveTo(350, 74); g.lineTo(451, 45); g.lineTo(552, 74); g.closePath(); g.fillStyle = '#c8b28b'; g.fill();
    g.strokeStyle = '#8e775b'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#6d5746'; g.beginPath(); g.arc(451, 143, 44, 0, TAU); g.fill();
    g.fillStyle = '#3f3f5c'; g.beginPath(); g.arc(451, 143, 37, 0, TAU); g.fill();
    const glass = ['#8e5c8d', '#4f7d95', '#c87a5f', '#e0b76e', '#668f7f'];
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      g.beginPath(); g.moveTo(451, 143); g.arc(451, 143, 34, a, a + TAU / 12); g.closePath();
      g.fillStyle = glass[i % glass.length]; g.fill();
    }
    g.fillStyle = '#e4c276'; g.beginPath(); g.arc(451, 143, 13, 0, TAU); g.fill();
    g.fillStyle = '#f7e2b0'; g.beginPath(); g.arc(451, 143, 7, 0, TAU); g.fill();
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      g.strokeStyle = '#bda171'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(451 + Math.cos(a) * 13, 143 + Math.sin(a) * 13); g.lineTo(451 + Math.cos(a) * 37, 143 + Math.sin(a) * 37); g.stroke();
    }
    g.strokeStyle = '#f1dbab'; g.lineWidth = 2; g.beginPath(); g.arc(451, 143, 42, 0, TAU); g.stroke();
    for (const x of [308, 350, 552, 594]) {
      g.fillStyle = '#cbb692'; g.fillRect(x, 158, 13, 106);
      g.fillStyle = '#f0e2c6'; g.fillRect(x + 2, 160, 5, 101);
      g.fillStyle = '#b19a76'; g.fillRect(x - 3, 153, 19, 7);
      g.fillStyle = '#b19a76'; g.fillRect(x - 3, 259, 19, 7);
      g.fillStyle = '#796451'; g.fillRect(x + 4, 174, 5, 50);
    }
    g.fillStyle = '#7a624d'; g.fillRect(399, 218, 104, 82);
    g.beginPath(); g.arc(451, 218, 52, Math.PI, TAU); g.fillStyle = '#7a624d'; g.fill();
    g.fillStyle = '#2e2a2d'; g.fillRect(410, 228, 82, 72);
    g.beginPath(); g.arc(451, 228, 41, Math.PI, TAU); g.fillStyle = '#2e2a2d'; g.fill();
    g.fillStyle = '#4e4042'; g.fillRect(416, 236, 70, 64);
    g.fillStyle = '#d3b06e'; g.fillRect(450, 236, 2, 64);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = '#1f1c20'; g.fillRect(418 + i * 12, 246, 8, 54);
      g.beginPath(); g.arc(422 + i * 12, 246, 4, Math.PI, TAU); g.fill();
    }
    g.strokeStyle = '#b7a17d'; g.lineWidth = 2;
    g.beginPath(); g.arc(451, 218, 62, Math.PI, TAU); g.stroke();
    g.fillStyle = '#e4c276'; g.fillRect(447, 24, 8, 32); g.fillRect(437, 34, 28, 7);
    g.fillStyle = '#b89a5d'; g.fillRect(450, 25, 2, 30);
    for (const x of [390, 511]) {
      g.fillStyle = '#d8c6a2'; g.fillRect(x - 12, 86, 24, 34);
      g.fillStyle = '#f0e2c6'; g.beginPath(); g.arc(x, 79, 8, 0, TAU); g.fill();
      g.fillStyle = '#f0e2c6'; g.fillRect(x - 9, 87, 18, 32);
      g.fillStyle = '#b19a76'; g.fillRect(x - 9, 112, 18, 4);
      g.fillStyle = '#e4c276'; g.fillRect(x - 2, 88, 4, 17);
    }
    for (const [x, col] of [[372, '#b7283e'], [528, '#b7283e'], [454, '#e4c276']]) {
      g.fillStyle = col; g.beginPath(); g.moveTo(x - 13, 200); g.lineTo(x + 13, 200); g.lineTo(x + 10, 260); g.lineTo(x, 250); g.lineTo(x - 10, 260); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,248,231,.6)'; g.fillRect(x - 5, 216, 10, 2); g.fillRect(x - 3, 232, 6, 6);
    }
    for (let i = 0; i < 3; i++) {
      g.fillStyle = '#7a624d'; g.fillRect(296 + i * 24, 282, 14, 18); g.fillStyle = '#332d2c'; g.fillRect(298 + i * 24, 284, 10, 14);
    }
    g.fillStyle = 'rgba(255,194,117,.07)'; g.fillRect(0, 0, 640, 360);
    const pigeon = (x, y, s) => {
      g.fillStyle = '#3c3547'; g.fillRect(x, y, 5 * s, 4 * s); g.fillRect(x + 4 * s, y - 2 * s, 3 * s, 3 * s);
      g.fillStyle = '#65738a'; g.fillRect(x + 1 * s, y + 3 * s, 2 * s, 2 * s);
      g.fillStyle = '#d0b18a'; g.fillRect(x + 6 * s, y + 1 * s, 2 * s, 1 * s);
    };
    pigeon(90, 291, 1); pigeon(118, 283, .8); pigeon(260, 289, 1); pigeon(500, 291, 1.1);
    for (let i = 0; i < 35; i++) {
      g.fillStyle = i % 3 === 0 ? '#ffd977' : i % 3 === 1 ? '#ff9fba' : '#d7cff3';
      g.fillRect(rand() * 640, 100 + rand() * 200, 2, 2);
    }
    return c;
  }

  function buildTitleScene() {
    const c = canvas(640, 360), g = c.getContext('2d');
    bandedGradient(g, 640, 0, 240, ['#182f51', '#365a7d', '#7a788c', '#d58d7e', '#efb482', '#ffd7a2'], 3);
    g.fillStyle = 'rgba(255,178,116,.18)'; g.beginPath(); g.arc(485, 124, 112, 0, TAU); g.fill();
    circle(g, 485, 124, 70, '#f5a875');
    circle(g, 485, 124, 61, '#ffc78d');
    circle(g, 485, 124, 53, '#ffe0a8');
    cloud(g, 110, 85, 1.05, '#7f7892', '#675f7e');
    cloud(g, 325, 58, .7, '#9e8795', '#84717f');
    cloud(g, 585, 178, .64, '#e4b193', '#c18f7e');
    bariWaterfront(g, 700, 222);
    g.fillStyle = 'rgba(255,222,174,.2)'; g.fillRect(0, 195, 700, 32);
    bandedGradient(g, 640, 227, 360, ['#5b556e', '#484b63', '#363f58', '#28374f'], 3);
    const rand = mulberry32(318);
    for (let i = 0; i < 110; i++) {
      g.fillStyle = i % 4 ? 'rgba(255,199,144,.22)' : 'rgba(255,225,175,.42)';
      g.fillRect(rand() * 640, 235 + rand() * 120, 2 + rand() * 13, 1);
    }
    crane(g, 52, 290, 180, '#3d3852', '#27263a');
    crane(g, 249, 300, 144, '#38344c', '#27263a');
    g.fillStyle = '#322b3d'; g.fillRect(0, 284, 640, 76);
    g.fillStyle = '#51445a'; g.fillRect(0, 284, 640, 8);
    g.fillStyle = '#8d6c68'; g.fillRect(0, 292, 640, 3);
    g.fillStyle = '#211d2c'; g.fillRect(0, 340, 640, 20);
    container(g, 360, 292, 116, 52, '#5d61a0', 'PORTO FRANCO', '#34375e');
    container(g, 476, 300, 88, 44, '#a24d55', 'BARI', '#5c2325');
    container(g, 408, 252, 90, 40, '#567a77', 'DOGANA', '#2b4745');
    g.fillStyle = '#201b2b'; g.fillRect(0, 314, 100, 46);
    g.fillStyle = '#31283c'; g.fillRect(14, 300, 66, 36);
    g.fillStyle = '#44354c'; g.fillRect(18, 304, 58, 28);
    g.strokeStyle = '#242030'; g.lineWidth = 2;
    for (let x = 40; x < 92; x += 12) { g.beginPath(); g.moveTo(x, 300); g.lineTo(x, 334); g.stroke(); }
    const grd = g.createLinearGradient(0, 0, 450, 0);
    grd.addColorStop(0, 'rgba(8,10,19,.78)');
    grd.addColorStop(.5, 'rgba(8,10,19,.36)');
    grd.addColorStop(1, 'rgba(8,10,19,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 640, 360);
    return c;
  }

  /* =========================================================
     DIREZIONE TERRITORIALE — CORRIDOIO, STANZE, SOGGETTI (v1.2)
     ---------------------------------------------------------
     SCHEMA Art.direzioneRooms — versione 1
     Ogni voce descrive una stanza/finestra del corridoio del livello 3:
     {
       x: number,        // world x del bordo sinistro della finestra.
                         // Griglia ufficiale: 1020 + i * 205 (i = 0..16).
       type: string,     // chiave stanza; Art.direzioneRoomArt[type] è il canvas
                         // 48x88 prerenderizzato (fallback scuro se assente).
       subject: string,  // personaggio/soggetto presente in scena: chiave di
                         // Art.direzioneCharacters (procedurale), Art.npcs
                         // (darts/beans/tennis/golf), Art.enemyFrames
                         // (collega/bidella/utente/formatore/finanziere) o
                         // Art.direzioneSubjects (oggetti/persone d'attesa).
       variant: string,  // 'a' | 'b' | 'c' — variante cromatica/props
       label: string,    // cartellino sopra la porta (MAIUSCOLO, <= 10 char)
       door: 'open' | 'closed'  // porta aperta (vignetta visibile) o chiusa
     }
     Geometria: finestra 58x100 a (x, 118); vignetta 48x88 a (x+5, 124).
     API per il renderer (js/game.js):
       Art.drawDirezioneRooms(ctx, cam, time)   -> cornici + vignette + etichette
       Art.drawDirezioneAmbience(ctx, cam, time)-> piante, bacheche, orologio,
         cartelli, estintori, panche e persone in attesa tra le finestre
       Art.drawDirezioneSubject(ctx, key, x, y, { scale, flip })
         (x, y) = punto di ancoraggio (ax/ay) dichiarato nel soggetto
       Art.direzioneRoomAt(worldX)              -> stanza più vicina a worldX
     Tutto è generato una sola volta al load (canvas 48x88 e sprite piccoli),
     quantizzato sulla palette esistente: nessun canvas grande, nessuna
     richiesta esterna, nessun TTS/asset remoto.
  ========================================================= */
  const DIR_RW = 48, DIR_RH = 88;
  const DIR_WIN_W = 58, DIR_WIN_H = 100, DIR_WIN_Y = 118;
  const DIR_GRID_X0 = 1020, DIR_GRID_STEP = 205, DIR_GRID_COUNT = 17;

  A.DIREZIONE = {
    roomW: DIR_RW, roomH: DIR_RH,
    windowW: DIR_WIN_W, windowH: DIR_WIN_H, windowY: DIR_WIN_Y,
    insetX: 5, insetY: 6,
    gridX0: DIR_GRID_X0, gridStep: DIR_GRID_STEP, gridCount: DIR_GRID_COUNT
  };
  A.direzioneWindowX = function (i) { return DIR_GRID_X0 + i * DIR_GRID_STEP; };

  const DP = {
    ink: '#0b0812', ink2: '#1a1222', shadow: '#13202f',
    wallA: '#e9e6da', wallB: '#d9d5c6', wallC: '#c8c5b8', wallD: '#a9b6b8',
    wallMint: '#a9e7d1', wallBlue: '#b8dce7', wallWarm: '#e6d5b0',
    floor: '#758086', floorHi: '#8f9a9e', floorDk: '#5b666b', floorWood: '#9a514e',
    wood: '#8d5016', woodHi: '#c87b1e', woodDk: '#5c3415',
    metal: '#7280b3', metalDk: '#48576e', metalLt: '#9fc1ea', steel: '#93aab8',
    paper: '#f5e9cc', cream: '#fff8e7', white: '#fffdf2',
    red: '#c62265', pink: '#ff5b9d', pinkHi: '#ff90b8', gold: '#ffc84b',
    teal: '#51c7a9', green: '#2f8a3f', greenLt: '#8eef7c', blue: '#4f91bd',
    skin: '#ffd5ad', skinDk: '#e7a67d', hair: '#5c3415', hairDk: '#38220f',
    dark: '#2e3a50', darker: '#1d2538', gray: '#8b8e84'
  };

  function dirText(g, str, x, y, px, color, align) {
    g.font = 'bold ' + px + 'px monospace';
    g.textAlign = align || 'center';
    g.textBaseline = 'alphabetic';
    g.fillStyle = color;
    g.fillText(str, Math.round(x), Math.round(y));
    return g;
  }

  function dirBase(g, o = {}) {
    const wall = o.wall || [DP.wallA, DP.wallB, DP.wallC];
    rect(g, 0, 0, DIR_RW, DIR_RH, DP.ink);
    bandedGradient(g, DIR_RW, 0, 66, wall, 3);
    // lampada a soffitto
    rect(g, 15, 2, 18, 2, '#fff3a6');
    g.fillStyle = 'rgba(255,244,190,.12)';
    g.beginPath(); g.moveTo(15, 4); g.lineTo(33, 4); g.lineTo(43, 64); g.lineTo(5, 64); g.closePath(); g.fill();
    // battiscopa
    rect(g, 0, 62, DIR_RW, 4, o.skirt || '#a9aba0');
    rect(g, 0, 65, DIR_RW, 1, '#8b8e84');
    // pavimento
    rect(g, 0, 66, DIR_RW, 22, o.floor || DP.floor);
    rect(g, 0, 66, DIR_RW, 2, o.floorHi || DP.floorHi);
    for (let x = 5; x < DIR_RW; x += 12) rect(g, x, 69, 1, 17, 'rgba(59,70,64,.32)');
    rect(g, 0, 76, DIR_RW, 1, 'rgba(59,70,64,.26)');
    rect(g, 0, 86, DIR_RW, 2, '#3b4449');
    // bordi vignetta
    g.fillStyle = 'rgba(12,10,18,.26)';
    g.fillRect(0, 0, 2, DIR_RH); g.fillRect(DIR_RW - 2, 0, 2, DIR_RH);
    g.fillRect(0, 0, DIR_RW, 2); g.fillRect(0, DIR_RH - 2, DIR_RW, 2);
    return g;
  }

  function dirPoster(g, x, y, w, h, col, col2) {
    rect(g, x - 1, y - 1, w + 2, h + 2, DP.ink2);
    rect(g, x, y, w, h, col || DP.cream);
    if (col2) rect(g, x, y, w, 3, col2);
    for (let i = 0; i < 3; i++) rect(g, x + 2, y + 6 + i * 4, Math.max(3, w - 5 - (i % 2) * 3), 1, 'rgba(29,37,56,.5)');
    return g;
  }

  function dirShelf(g, x, y, w, h, rows, tone) {
    const t = tone || DP.metal;
    rect(g, x - 1, y - 1, w + 2, h + 2, DP.ink2);
    rect(g, x, y, w, h, t);
    const rowH = h / rows;
    for (let r = 0; r < rows; r++) {
      const ry = Math.round(y + r * rowH);
      rect(g, x + 1, ry + 1, w - 2, Math.round(rowH) - 2, DP.darker);
      for (let i = 0; i < Math.floor((w - 4) / 4); i++) {
        rect(g, x + 2 + i * 4, ry + 2, 3, Math.round(rowH) - 4, i % 3 === 0 ? DP.red : i % 3 === 1 ? DP.gold : DP.paper);
        rect(g, x + 2 + i * 4, ry + 2, 3, 1, 'rgba(255,255,255,.35)');
      }
    }
    return g;
  }

  function dirDesk(g, x, y, w) {
    rect(g, x, y - 4, w, 4, DP.woodHi);
    rect(g, x, y, w, 3, DP.woodDk);
    rect(g, x + 2, y + 3, 3, 9, DP.woodDk);
    rect(g, x + w - 5, y + 3, 3, 9, DP.woodDk);
    return g;
  }

  function dirMonitor(g, x, y, on, w, h) {
    const mw = w || 12, mh = h || 8;
    rect(g, x, y, mw, mh, DP.ink2);
    rect(g, x + 1, y + 1, mw - 2, mh - 2, on === false ? '#41505f' : '#4f91bd');
    if (on !== false) {
      rect(g, x + 2, y + 2, mw - 5, 1, '#9fd7ff');
      rect(g, x + 2, y + 4, mw - 4, 1, 'rgba(255,248,231,.6)');
    }
    rect(g, x + Math.floor(mw / 2) - 1, y + mh, 2, 2, DP.metalDk);
    rect(g, x + Math.floor(mw / 2) - 3, y + mh + 2, 6, 1, DP.metalDk);
    return g;
  }

  function dirChair(g, x, baseY, col) {
    const c = col || DP.metal;
    rect(g, x - 4, baseY - 9, 9, 2, c);
    rect(g, x + 3, baseY - 16, 3, 9, c);
    rect(g, x - 3, baseY - 8, 2, 8, DP.metalDk);
    rect(g, x + 1, baseY - 8, 2, 8, DP.metalDk);
    return g;
  }

  function dirPlant(g, x, baseY, s) {
    const k = s || 1;
    rect(g, x - 5 * k, baseY - 9 * k, 10 * k, 9 * k, '#6d3e2e');
    rect(g, x - 5 * k, baseY - 9 * k, 10 * k, 2 * k, '#a66246');
    g.strokeStyle = DP.green; g.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      g.moveTo(x, baseY - 9 * k);
      g.quadraticCurveTo(x - 6 * k + i * 3 * k, baseY - 22 * k - (i % 2) * 4 * k, x - 7 * k + i * 3.5 * k, baseY - 30 * k - (i % 3) * 3 * k);
      g.stroke();
    }
    for (let i = 0; i < 5; i++) rect(g, x - 8 * k + i * 3.4 * k, baseY - 32 * k - (i % 3) * 3 * k, 3 * k, 2 * k, i % 2 ? DP.teal : DP.greenLt);
    return g;
  }

  function dirPile(g, x, y, w) {
    rect(g, x, y, w || 10, 2, DP.cream);
    rect(g, x + 1, y + 1, (w || 10) - 1, 1, DP.paper);
    return g;
  }

  function dirDartboard(g, cx, cy, r) {
    circle(g, cx, cy, r + 1, DP.ink2);
    circle(g, cx, cy, r, DP.cream);
    circle(g, cx, cy, r * .72, DP.red);
    circle(g, cx, cy, r * .48, DP.cream);
    circle(g, cx, cy, r * .24, DP.gold);
    rect(g, cx - .5, cy - r, 1, r * 2, 'rgba(29,37,56,.65)');
    rect(g, cx - r, cy - .5, r * 2, 1, 'rgba(29,37,56,.65)');
    return g;
  }

  function dirCopier(g, x, baseY) {
    rect(g, x, baseY - 30, 28, 30, DP.ink2);
    rect(g, x + 1, baseY - 29, 26, 28, DP.steel);
    rect(g, x + 2, baseY - 27, 24, 5, DP.dark);
    rect(g, x + 3, baseY - 26, 22, 3, '#41505f');
    rect(g, x + 2, baseY - 21, 24, 9, '#d4e5ee');
    rect(g, x + 3, baseY - 20, 22, 2, DP.cream);
    rect(g, x + 2, baseY - 11, 24, 7, DP.metalDk);
    rect(g, x + 4, baseY - 9, 8, 4, '#2e3a50');
    rect(g, x + 15, baseY - 9, 8, 4, DP.ink2);
    rect(g, x + 3, baseY - 4, 22, 3, '#a9aba0');
    rect(g, x + 2, baseY - 24, 3, 2, '#8eef7c');
    return g;
  }

  function dirCoffeeMachine(g, x, baseY) {
    rect(g, x, baseY - 26, 16, 26, DP.ink2);
    rect(g, x + 1, baseY - 25, 14, 24, '#48576e');
    rect(g, x + 2, baseY - 23, 12, 6, '#9fd7ff');
    rect(g, x + 3, baseY - 21, 5, 2, DP.cream);
    rect(g, x + 5, baseY - 15, 6, 7, DP.metalDk);
    rect(g, x + 7, baseY - 13, 2, 4, DP.ink2);
    rect(g, x + 4, baseY - 7, 8, 2, '#41505f');
    rect(g, x + 5, baseY - 17, 6, 1, DP.gold);
    return g;
  }

  function dirVending(g, x, baseY) {
    rect(g, x, baseY - 46, 26, 46, DP.ink2);
    rect(g, x + 1, baseY - 45, 24, 44, '#30375c');
    rect(g, x + 2, baseY - 43, 15, 30, '#1a264a');
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      rect(g, x + 3 + c * 5, baseY - 42 + r * 9, 4, 6, [DP.gold, DP.pink, DP.teal, DP.cream, DP.orange || '#ff845d', DP.metalLt][(r * 3 + c) % 6]);
    }
    rect(g, x + 18, baseY - 40, 6, 12, DP.steel);
    rect(g, x + 19, baseY - 38, 4, 2, '#8eef7c');
    rect(g, x + 2, baseY - 10, 24, 6, '#41505f');
    rect(g, x + 4, baseY - 8, 20, 3, DP.ink2);
    return g;
  }

  function dirServerRack(g, x, baseY) {
    rect(g, x, baseY - 54, 18, 54, DP.ink2);
    rect(g, x + 1, baseY - 53, 16, 52, '#2e3a50');
    for (let i = 0; i < 7; i++) {
      const y = baseY - 50 + i * 7;
      rect(g, x + 2, y, 14, 5, '#41505f');
      rect(g, x + 3, y + 1, 8, 2, '#1d2538');
      rect(g, x + 13, y + 1, 2, 2, i % 2 ? DP.greenLt : DP.gold);
    }
    rect(g, x + 2, baseY - 4, 14, 3, DP.metalDk);
    return g;
  }

  function dirPerson(g, x, baseY, o = {}) {
    const skin = o.skin || DP.skin, skinD = o.skinD || DP.skinDk;
    const shirt = o.shirt || '#cfe3ff', shirtD = o.shirtD || '#9fc1ea';
    const pants = o.pants || '#48576e', pantsD = o.pantsD || DP.dark;
    const hair = o.hair || DP.hair, hairD = o.hairD || DP.hairDk;
    const h = o.h || 40;
    const hr = o.headR || 5;
    const headY = Math.round(baseY - h + hr + 1);
    const torsoTop = Math.round(headY + hr + 1);
    const hipY = o.sit ? Math.round(baseY - 15) : Math.round(baseY - h * .42);
    // gambe
    if (o.sit) {
      rect(g, x - 6, hipY, 7, 4, pants);
      rect(g, x + 1, hipY, 8, 4, pantsD);
      rect(g, x - 7, hipY + 4, 4, Math.max(2, baseY - hipY - 4), pantsD);
      rect(g, x + 7, hipY + 4, 3, Math.max(2, baseY - hipY - 4), pants);
      rect(g, x - 9, baseY - 2, 6, 2, DP.ink);
      rect(g, x + 6, baseY - 2, 6, 2, DP.ink);
    } else {
      const legH = Math.max(4, baseY - hipY - 2);
      rect(g, x - 6, hipY, 5, legH, pants);
      rect(g, x + 1, hipY, 5, legH, pantsD);
      rect(g, x - 7, baseY - 2, 7, 2, DP.ink);
      rect(g, x + 1, baseY - 2, 7, 2, DP.ink);
    }
    // busto
    const torsoH = Math.max(6, hipY - torsoTop + 2);
    rect(g, x - 6, torsoTop, 12, torsoH, shirt);
    rect(g, x + 2, torsoTop, 4, torsoH, shirtD);
    if (o.vest) { rect(g, x - 6, torsoTop, 3, torsoH, o.vest); rect(g, x + 4, torsoTop, 2, torsoH, o.vest); }
    if (o.tie) { rect(g, x - 1, torsoTop + 1, 2, Math.max(4, Math.min(9, torsoH - 2)), o.tie); }
    if (o.lanyard) { rect(g, x - 4, torsoTop, 2, Math.max(4, torsoH - 3), DP.red); rect(g, x + 3, torsoTop, 2, Math.max(4, torsoH - 3), DP.red); rect(g, x - 2, torsoTop + 8, 4, 5, DP.cream); }
    if (o.apron) { rect(g, x - 5, torsoTop + Math.round(torsoH * .35), 10, Math.round(torsoH * .65), '#d4e5ee'); rect(g, x - 5, torsoTop + Math.round(torsoH * .35), 10, 1, DP.steel); }
    // braccia
    if (o.arms !== false) {
      rect(g, x - 8, torsoTop + 2, 3, 11, shirtD);
      rect(g, x + 6, torsoTop + 2, 3, 11, shirtD);
      if (o.hold && o.hold !== 'pointer') {
        rect(g, x - 8, torsoTop + 12, 3, 3, skin);
        rect(g, x + 6, torsoTop + 12, 3, 3, skin);
      }
    }
    // collo + testa
    rect(g, x - 1, torsoTop - 2, 3, 3, skinD);
    circle(g, x, headY, hr, skin);
    circle(g, x - 1, headY - 1, hr - 1, o.skinHi || '#ffe7c6');
    // volto: occhi, naso, bocca (pixel legibili anche nella vignetta 48x88)
    rect(g, x - 2, headY - 1, 1, 2, DP.ink2);
    rect(g, x + 2, headY - 1, 1, 2, DP.ink2);
    rect(g, x, headY + 1, 1, 1, skinD);
    rect(g, x - 1, headY + 3, 3, 1, 'rgba(154,81,78,.62)');
    // capelli
    if (o.hairStyle === 'bald') {
      rect(g, x - 3, headY - hr - 1, 6, 1, skinD);
      rect(g, x - hr + 1, headY - hr + 1, 2, 2, hair);
      rect(g, x + hr - 3, headY - hr + 1, 2, 2, hair);
    } else if (o.hairStyle === 'bun') {
      circle(g, x, headY - hr - 1, 3, hair);
      rect(g, x - hr + 1, headY - hr + 1, hr * 2 - 2, 3, hair);
      rect(g, x - hr + 1, headY - hr + 1, hr * 2 - 2, 1, 'rgba(255,255,255,.18)');
    } else if (o.hairStyle === 'long') {
      rect(g, x - hr, headY - hr + 1, 3, hr * 2, hair);
      rect(g, x + hr - 2, headY - hr + 1, 3, hr * 2, hair);
      rect(g, x - hr + 1, headY - hr, hr * 2 - 2, 3, hair);
    } else if (o.hairStyle === 'gray') {
      rect(g, x - hr + 1, headY - hr, hr * 2 - 2, 3, hair);
      rect(g, x - hr, headY - hr + 2, 2, 3, hairD);
      rect(g, x + hr - 2, headY - hr + 2, 2, 3, hairD);
    } else {
      rect(g, x - hr + 1, headY - hr, hr * 2 - 2, 3, hair);
      rect(g, x - hr + 1, headY - hr, 2, 2, hairD);
    }
    // accessori
    if (o.glasses) {
      rect(g, x - 4, headY - 1, 8, 1, DP.ink2);
      rect(g, x - 4, headY, 2, 2, DP.ink2);
      rect(g, x + 2, headY, 2, 2, DP.ink2);
    }
    if (o.hat) {
      rect(g, x - 7, headY - hr - 1, 14, 2, o.hat);
      rect(g, x - 4, headY - hr - 5, 8, 4, o.hat);
      rect(g, x - 4, headY - hr - 5, 8, 1, 'rgba(255,255,255,.25)');
    }
    if (o.headset) {
      rect(g, x - hr - 1, headY - 2, 2, 4, DP.ink2);
      rect(g, x - hr - 3, headY - 2, 2, 2, DP.metal);
      rect(g, x - hr - 4, headY - 4, 3, 1, DP.ink2);
    }
    if (o.hold === 'folder') {
      rect(g, x + 5, torsoTop + 8, 8, 10, DP.cream);
      rect(g, x + 5, torsoTop + 8, 8, 1, DP.gold);
      rect(g, x + 7, torsoTop + 11, 5, 1, 'rgba(29,37,56,.5)');
      rect(g, x + 7, torsoTop + 13, 4, 1, 'rgba(29,37,56,.4)');
    } else if (o.hold === 'box') {
      rect(g, x - 8, hipY - 13, 16, 12, DP.woodDk);
      rect(g, x - 8, hipY - 13, 16, 2, DP.woodHi);
      rect(g, x - 1, hipY - 11, 2, 8, DP.ink2);
      rect(g, x - 1, hipY - 11, 8, 2, DP.ink2);
    } else if (o.hold === 'laptop') {
      rect(g, x + 5, torsoTop + 9, 10, 2, DP.ink2);
      rect(g, x + 6, torsoTop + 5, 8, 5, DP.metalDk);
      rect(g, x + 7, torsoTop + 6, 6, 3, '#9fd7ff');
    } else if (o.hold === 'cup') {
      rect(g, x + 7, torsoTop + 10, 3, 3, DP.cream);
      rect(g, x + 7, torsoTop + 10, 3, 1, DP.woodDk);
    } else if (o.hold === 'stamp') {
      rect(g, x + 5, torsoTop + 11, 5, 2, DP.woodDk);
      rect(g, x + 6, torsoTop + 13, 3, 2, DP.ink2);
    } else if (o.hold === 'pointer') {
      line(g, x + 8, torsoTop + 12, x + 15, torsoTop - 2, DP.woodDk, 1);
    } else if (o.hold === 'ticket') {
      rect(g, x + 6, torsoTop + 12, 5, 2, DP.cream);
    } else if (o.hold === 'ladle') {
      line(g, x + 8, torsoTop + 10, x + 14, torsoTop + 2, DP.steel, 1.4);
      circle(g, x + 14, torsoTop + 2, 2, DP.steel);
    }
    return g;
  }

  const DIR_CHAR_PRESETS = {
    impiegato: { shirt: '#f2fbff', shirtD: '#b8dce7', pants: '#48576e', tie: '#9d2833', hair: DP.hair },
    dirigente: { shirt: '#93aab8', shirtD: '#657a8b', pants: '#41505f', tie: '#1d2538', hair: '#d4e5ee', hairStyle: 'bald', glasses: true, skin: '#ffcf94', skinD: '#e59e5d' },
    collega: { shirt: '#cbb98e', shirtD: '#9e8c68', pants: '#4a3225', hair: DP.hair, tie: '#8d5016' },
    tirocinante: { shirt: '#9fd7ff', shirtD: '#4f91bd', pants: '#3f528a', hair: DP.hairDk, lanyard: true },
    archivista: { shirt: '#d4e5ee', shirtD: '#93aab8', pants: '#48576e', vest: '#8d5016', hair: DP.hair },
    it: { shirt: '#51c7a9', shirtD: '#2b8e82', pants: '#2e3a50', hair: DP.hairDk, headset: true },
    centralinista: { shirt: '#ffbfd8', shirtD: '#ff90b8', pants: '#4a5589', hair: '#8d5016', hairStyle: 'bun', headset: true },
    cuoco: { shirt: '#f2fbff', shirtD: '#d4e5ee', pants: '#41505f', hat: '#fff8e7', hair: DP.hair },
    formatore: { shirt: '#7280b3', shirtD: '#4a5589', pants: '#30375c', tie: '#ffc84b', hair: DP.hairDk, glasses: true },
    bidella: { shirt: '#9fc1ea', shirtD: '#5b6fa8', pants: '#48576e', hair: DP.hair, hairStyle: 'bun' },
    utente: { shirt: '#ff845d', shirtD: '#d54c42', pants: '#30375c', hair: DP.hairDk }
  };

  function dirChar(g, kind, x, baseY, o = {}) {
    const preset = DIR_CHAR_PRESETS[kind] || DIR_CHAR_PRESETS.impiegato;
    return dirPerson(g, x, baseY, Object.assign({}, preset, o));
  }

  function dirEnemy(g, type, cx, baseY, scale) {
    const f = A.enemyFrames && A.enemyFrames[type] && A.enemyFrames[type][0];
    if (!f) return false;
    const s = scale || .54;
    const w = 84 * s, h = 90 * s;
    g.drawImage(f, Math.round(cx - w / 2), Math.round(baseY - h + 2), Math.round(w), Math.round(h));
    return true;
  }

  function dirNpcOverlay(g, type) {
    if (!(A.npcLoaded && A.npcLoaded[type]) || !A.npcs || !A.npcs[type]) return false;
    g.drawImage(A.npcs[type], 0, 0, DIR_RW, DIR_RH);
    return true;
  }

  /* ---------------- stanze (48x88) ---------------- */
  const DIR_ROOM_PAINTERS = {
    sportello(g) {
      dirBase(g, { wall: ['#e9e6da', '#d9d5c6', '#bfc3b6'], floor: '#8f9a9e' });
      dirPoster(g, 30, 8, 15, 18, DP.wallBlue, DP.blue);
      rect(g, 3, 6, 20, 12, DP.ink2); rect(g, 4, 7, 18, 10, '#13202f');
      dirText(g, 'A-127', 13, 15, 6, DP.gold);
      rect(g, 1, 22, 34, 2, DP.gray);
      dirChar(g, 'impiegato', 16, 63, { sit: true, h: 38 });
      g.fillStyle = 'rgba(159,215,255,.16)'; g.fillRect(2, 26, 40, 36);
      rect(g, 2, 26, 40, 1, '#d9f0f5');
      rect(g, 0, 60, DIR_RW, 16, DP.woodDk);
      rect(g, 0, 60, DIR_RW, 3, DP.woodHi);
      rect(g, 2, 65, 44, 8, DP.wood);
      for (let x = 4; x < 46; x += 8) rect(g, x, 65, 1, 8, DP.woodDk);
      line(g, 41, 40, 46, 66, DP.metal, 1);
      dirPile(g, 5, 62, 11);
      dirText(g, 'SPORTELLO', 24, 86, 4, 'rgba(255,248,231,.5)');
    },
    segreteria(g) {
      dirBase(g, { wall: ['#e9e6da', '#d9d5c6', '#c8c5b8'] });
      dirPoster(g, 34, 8, 12, 16, DP.cream, DP.pink);
      dirShelf(g, 35, 28, 12, 34, 3, DP.wood);
      dirDesk(g, 4, 48, 28);
      dirMonitor(g, 7, 36, true, 11, 7);
      dirPhone(g, 24, 40);
      dirChar(g, 'collega', 18, 62, { sit: true, h: 38, hold: 'folder' });
      dirPile(g, 7, 44, 9); dirPile(g, 8, 41, 7);
      dirChair(g, 37, 64, DP.metalDk);
      dirText(g, 'SEGRETERIA', 24, 86, 4, 'rgba(255,248,231,.5)');
    },
    darts(g) {
      dirBase(g, { wall: ['#b8dce7', '#9fc1ea', '#6e8dbb'], floor: '#5b666b' });
      if (!dirNpcOverlay(g, 'darts')) {
        dirDartboard(g, 30, 26, 13);
        dirChar(g, 'collega', 14, 82, { h: 42, hold: 'cup' });
        dirText(g, 'FRECCETTE', 24, 86, 4, 'rgba(255,248,231,.5)');
      }
    },
    photocopy(g) {
      dirBase(g, { wall: ['#e9e6da', '#d9d5c6', '#bfc3b6'] });
      dirPoster(g, 2, 8, 15, 17, DP.cream, DP.teal);
      dirCopier(g, 24, 64);
      dirPile(g, 25, 33, 12);
      dirChar(g, 'tirocinante', 12, 82, { h: 42, hold: 'folder' });
      dirText(g, 'FOTOCOPIE', 24, 86, 4, 'rgba(255,248,231,.5)');
    },
    beans(g) {
      dirBase(g, { wall: ['#a9e7d1', '#7eb6d9', '#4f91bd'], floor: '#8f9a9e' });
      if (!dirNpcOverlay(g, 'beans')) {
        rect(g, 4, 52, 16, 10, DP.woodHi);
        rect(g, 4, 52, 16, 2, DP.wood);
        circle(g, 12, 58, 3, DP.green);
        dirChar(g, 'bidella', 30, 82, { h: 42, sit: true });
        dirText(g, 'FAGIOLINI', 24, 86, 4, 'rgba(255,248,231,.5)');
      }
    },
    waiting(g) {
      dirBase(g, { wall: ['#e6d5b0', '#cbb98e', '#b9a67f'] });
      dirPoster(g, 2, 8, 13, 16, DP.cream, DP.pink);
      rect(g, 16, 10, 16, 12, DP.ink2); rect(g, 17, 11, 14, 10, DP.cream);
      dirText(g, 'T-204', 24, 19, 6, DP.red);
      dirChair(g, 8, 66, DP.wood); dirChair(g, 20, 66, DP.wood); dirChair(g, 32, 66, DP.wood);
      dirPlant(g, 43, 66, .8);
      dirChar(g, 'utente', 20, 66, { sit: true, h: 37, hold: 'ticket' });
      dirText(g, 'ATTESA', 24, 86, 4, 'rgba(255,248,231,.5)');
    },
    tennis(g) {
      dirBase(g, { wall: ['#a9e7d1', '#7eb6d9', '#4f91bd'], floor: '#2f8a3f' });
      if (!dirNpcOverlay(g, 'tennis')) {
        rect(g, 2, 8, 44, 32, '#2f8a3f');
        rect(g, 2, 8, 44, 2, DP.cream); rect(g, 2, 23, 44, 1, DP.cream);
        rect(g, 23, 8, 1, 32, DP.cream); rect(g, 4, 8, 1, 32, DP.cream); rect(g, 43, 8, 1, 32, DP.cream);
        dirChar(g, 'collega', 20, 84, { h: 44 });
        line(g, 30, 40, 38, 30, DP.woodDk, 2);
        circle(g, 39, 29, 3, DP.cream);
        dirText(g, 'TENNIS', 24, 86, 4, 'rgba(255,248,231,.5)');
      }
    },
    golf(g) {
      dirBase(g, { wall: ['#e9e6da', '#d9d5c6', '#bfc3b6'], floor: '#2f8a3f' });
      if (!dirNpcOverlay(g, 'golf')) {
        circle(g, 32, 74, 4, DP.dark);
        rect(g, 32, 48, 1, 26, DP.cream);
        poly(g, [[33, 48], [42, 52], [33, 56]], DP.red);
        dirChar(g, 'dirigente', 16, 82, { h: 42 });
        line(g, 24, 66, 31, 76, DP.metal, 1.4);
        dirText(g, 'GOLF', 24, 86, 4, 'rgba(255,248,231,.5)');
      }
    },
    meeting(g) {
      dirBase(g, { wall: ['#d9d5c6', '#c8c5b8', '#a9aba0'] });
      rect(g, 6, 8, 30, 20, DP.ink2);
      rect(g, 7, 9, 28, 18, '#d4e5ee');
      rect(g, 9, 12, 24, 12, DP.cream);
      for (let i = 0; i < 4; i++) rect(g, 11 + i * 5, 22 - i * 2, 3, 2 + i * 2, i % 2 ? DP.blue : DP.red);
      rect(g, 38, 10, 8, 16, DP.cream);
      rect(g, 39, 12, 6, 1, DP.ink2); rect(g, 39, 15, 5, 1, DP.ink2);
      dirDesk(g, 2, 56, 44);
      dirChar(g, 'dirigente', 12, 62, { sit: true, h: 38, hold: 'pointer' });
      dirChar(g, 'collega', 30, 62, { sit: true, h: 38, hold: 'folder' });
      rect(g, 20, 50, 3, 5, DP.cream); rect(g, 24, 50, 3, 5, DP.cream);
      dirText(g, 'RIUNIONI', 24, 86, 4, 'rgba(255,248,231,.5)');
    },
    training(g) {
      dirBase(g, { wall: ['#cfe3ff', '#9fc1ea', '#6e8dbb'] });
      rect(g, 5, 7, 34, 21, DP.ink2);
      rect(g, 6, 8, 32, 19, DP.cream);
      rect(g, 8, 11, 28, 12, '#f2fbff');
      rect(g, 9, 13, 16, 2, DP.blue); rect(g, 9, 17, 24, 1, 'rgba(29,37,56,.4)');
      rect(g, 9, 20, 20, 1, 'rgba(29,37,56,.3)');
      dirChar(g, 'formatore', 12, 84, { h: 44, hold: 'pointer' });
      dirChair(g, 26, 64, DP.metal); dirChair(g, 36, 64, DP.metal);
      dirChar(g, 'impiegato', 26, 64, { sit: true, h: 34 });
      dirChar(g, 'tirocinante', 36, 64, { sit: true, h: 34 });
      dirText(g, 'FORMAZIONE', 24, 86, 4, 'rgba(255,248,231,.5)');
    },
    coffee(g) {
      dirBase(g, { wall: ['#d4e5ee', '#b8dce7', '#93aab8'] });
      dirCoffeeMachine(g, 6, 66);
      dirPlant(g, 42, 66, .8);
      rect(g, 0, 60, 20, 9, DP.woodDk); rect(g, 0, 60, 20, 2, DP.woodHi);
      rect(g, 24, 9, 14, 12, DP.cream); rect(g, 25, 10, 12, 10, DP.pinkHi);
      dirText(g, 'CAFFÈ', 31, 17, 4, DP.red);
      dirChar(g, 'collega', 31, 84, { h: 42, hold: 'cup' });
      dirText(g, 'CAFFÈ', 24, 86, 4, 'rgba(255,248,231,.5)');
    },
    vending(g) {
      dirBase(g, { wall: ['#e9e6da', '#d9d5c6', '#bfc3b6'] });
      dirVending(g, 5, 68);
      dirChar(g, 'bidella', 37, 84, { h: 42, hold: 'ticket' });
      rect(g, 22, 78, 8, 8, DP.metalDk);
      dirPoster(g, 34, 8, 12, 15, DP.cream, DP.blue);
      dirText(g, 'DISTRIBUTORE', 24, 86, 4, 'rgba(255,248,231,.5)');
    },
    archive(g) {
      dirBase(g, { wall: ['#d9d5c6', '#c8c5b8', '#a9aba0'], floor: '#5b666b' });
      dirShelf(g, 1, 8, 13, 56, 5, DP.wood);
      dirShelf(g, 34, 8, 13, 56, 5, DP.wood);
      rect(g, 15, 12, 2, 50, DP.metal); rect(g, 16, 12, 6, 2, DP.metal); rect(g, 16, 14, 2, 48, DP.metal);
      dirChar(g, 'archivista', 24, 84, { h: 42, hold: 'box' });
      dirPile(g, 19, 80, 10);
      dirText(g, 'ARCHIVIO', 24, 86, 4, 'rgba(255,248,231,.5)');
    },
    server(g) {
      dirBase(g, { wall: ['#667a8e', '#48576e', '#2e3a50'], floor: '#41505f' });
      dirServerRack(g, 2, 68);
      dirServerRack(g, 22, 68);
      rect(g, 0, 12, 48, 2, '#41505f');
      for (let i = 0; i < 5; i++) rect(g, 4 + i * 9, 12, 6, 1, i % 2 ? '#9fd7ff' : '#48576e');
      dirChar(g, 'it', 39, 84, { h: 42, hold: 'laptop' });
      dirText(g, 'SERVER', 24, 86, 4, 'rgba(255,248,231,.5)');
    },
    centralino(g) {
      dirBase(g, { wall: ['#e6d5b0', '#cbb98e', '#b9a67f'] });
      rect(g, 2, 8, 44, 6, DP.ink2); rect(g, 3, 9, 42, 4, DP.gold);
      dirText(g, 'CENTRALINO', 24, 13, 4, DP.ink2);
      dirDesk(g, 2, 52, 44);
      dirPhone(g, 11, 42); dirPhone(g, 27, 42);
      rect(g, 40, 30, 6, 22, DP.ink2);
      for (let i = 0; i < 5; i++) rect(g, 41, 32 + i * 4, 4, 1, i % 2 ? DP.red : DP.teal);
      dirChar(g, 'centralinista', 22, 62, { sit: true, h: 38 });
      dirText(g, 'CENTRALINO', 24, 86, 4, 'rgba(255,248,231,.5)');
    },
    protocollo(g) {
      dirBase(g, { wall: ['#e9e6da', '#d9d5c6', '#c8c5b8'] });
      rect(g, 2, 8, 20, 10, DP.ink2); rect(g, 3, 9, 18, 8, DP.cream);
      dirText(g, 'PROTOCOLLO', 12, 15, 3, DP.ink2);
      dirShelf(g, 36, 8, 10, 40, 4, DP.wood);
      dirDesk(g, 2, 56, 42);
      rect(g, 8, 48, 5, 8, DP.cream); rect(g, 9, 50, 3, 1, DP.ink2);
      rect(g, 14, 44, 6, 12, DP.cream); rect(g, 15, 46, 4, 1, DP.ink2);
      dirPile(g, 24, 52, 11); dirPile(g, 26, 49, 8);
      dirChar(g, 'impiegato', 15, 64, { sit: true, h: 38, hold: 'stamp' });
      dirPile(g, 3, 62, 9);
      dirText(g, 'PROTOCOLLO', 24, 86, 4, 'rgba(255,248,231,.5)');
    },
    mensa(g) {
      dirBase(g, { wall: ['#e6d5b0', '#cbb98e', '#b9a67f'], floor: '#8f9a9e' });
      rect(g, 3, 7, 20, 14, DP.ink2); rect(g, 4, 8, 18, 12, DP.woodDk);
      dirText(g, 'MENU', 13, 13, 4, DP.gold);
      dirText(g, 'PASTA', 13, 17, 3, DP.cream);
      rect(g, 0, 56, DIR_RW, 14, DP.steel); rect(g, 0, 56, DIR_RW, 2, DP.cream);
      rect(g, 6, 52, 10, 4, DP.cream); rect(g, 8, 51, 6, 1, DP.gold);
      rect(g, 20, 51, 8, 5, DP.cream); rect(g, 22, 50, 4, 1, DP.green);
      dirChar(g, 'cuoco', 36, 74, { h: 40, hold: 'ladle' });
      dirChar(g, 'impiegato', 14, 84, { h: 40 });
      dirText(g, 'MENSA', 24, 86, 4, 'rgba(255,248,231,.5)');
    }
  };

  function dirPhone(g, x, y) {
    rect(g, x, y, 7, 3, DP.ink2);
    rect(g, x + 1, y + 1, 5, 1, DP.metalLt);
    rect(g, x + 2, y - 2, 3, 2, DP.metalDk);
  }

  function dirRoomFx(ctx, type, x, y, t) {
    if (type === 'coffee' || type === 'mensa') {
      for (let i = 0; i < 3; i++) {
        const k = (t * .55 + i * .33) % 1;
        ctx.fillStyle = 'rgba(255,248,231,' + (0.16 * (1 - k)).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(x + 13 + Math.sin(k * 6 + i) * 2, y + 34 - k * 24, 1.5 + k * 3, 0, TAU);
        ctx.fill();
      }
    } else if (type === 'photocopy') {
      if (Math.sin(t * 7) > 0) rect(ctx, x + 40, y + 15, 2, 2, '#8eef7c');
      if (Math.sin(t * 3 + 1) > 0) rect(ctx, x + 30, y + 33, 12, 1, 'rgba(255,255,255,.5)');
    } else if (type === 'server') {
      for (let i = 0; i < 10; i++) {
        const on = Math.sin(t * (3.5 + i * .6) + i * 2.1) > 0;
        const rx = x + 3 + (i % 2) * 20;
        const ry = y + 15 + Math.floor(i / 2) * 7;
        rect(ctx, rx, ry, 2, 1, on ? '#8eef7c' : '#2f8a3f');
      }
    } else if (type === 'training' || type === 'meeting') {
      ctx.fillStyle = 'rgba(255,248,231,' + (0.05 + Math.sin(t * 2.1) * 0.03).toFixed(3) + ')';
      ctx.fillRect(x + 6, y + 9, 28, 18);
    } else if (type === 'sportello') {
      if (Math.sin(t * 1.7) > 0) dirText(ctx, 'A-127', x + 14, y + 15, 6, '#ffc84b');
    } else if (type === 'centralino') {
      if (Math.sin(t * 5) > 0) rect(ctx, x + 41, y + 32, 4, 1, '#ff5b9d');
    } else if (type === 'vending') {
      if (Math.sin(t * 2.4) > 0) rect(ctx, x + 7, y + 30, 3, 1, '#8eef7c');
    }
  }

  /* ---------------- soggetti ambientali ---------------- */
  const DIR_SUBJECT_DEFS = {
    plantTall: {
      w: 34, h: 64, ax: 17, ay: 64,
      paint(g) {
        rect(g, 12, 52, 10, 12, '#6d3e2e');
        rect(g, 12, 52, 10, 2, '#a66246');
        g.strokeStyle = DP.green; g.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
          g.beginPath(); g.moveTo(17, 53);
          g.quadraticCurveTo(4 + i * 5, 30 - i * 3, 2 + i * 5.5, 14 + (i % 3) * 5);
          g.stroke();
        }
        for (let i = 0; i < 6; i++) {
          ellipse(g, 4 + i * 5, 12 + (i % 3) * 5, 3.4, 2.2, i % 2 ? DP.teal : DP.greenLt);
          ellipse(g, 4 + i * 5, 12 + (i % 3) * 5, 2.4, 1.3, 'rgba(255,255,255,.14)');
        }
        rect(g, 0, 54, 34, 1, 'rgba(12,10,18,.35)');
      }
    },
    plantSmall: {
      w: 24, h: 40, ax: 12, ay: 40,
      paint(g) {
        rect(g, 8, 32, 8, 8, '#6d3e2e');
        g.strokeStyle = DP.green; g.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(12, 33); g.quadraticCurveTo(5 + i * 4, 20 - i * 2, 3 + i * 5, 10 + (i % 2) * 4); g.stroke(); }
        for (let i = 0; i < 4; i++) ellipse(g, 4 + i * 5, 9 + (i % 2) * 4, 2.8, 1.8, i % 2 ? DP.teal : DP.greenLt);
      }
    },
    bacheca: {
      w: 64, h: 42, ax: 32, ay: 42,
      paint(g) {
        rect(g, 0, 0, 64, 42, DP.ink2);
        rect(g, 2, 2, 60, 38, '#b7a88d');
        for (let i = 0; i < 26; i++) rect(g, 3 + (i * 7) % 57, 3 + (i * 11) % 34, 1, 1, 'rgba(92,52,21,.5)');
        rect(g, 2, 2, 60, 5, '#8d5016');
        dirText(g, 'AVVISI', 32, 6, 4, DP.cream);
        dirPoster(g, 5, 10, 14, 17, DP.cream, DP.red);
        dirPoster(g, 23, 12, 12, 14, DP.cream, DP.blue);
        dirPoster(g, 39, 9, 13, 18, DP.gold, DP.ink2);
        rect(g, 3, 31, 58, 7, 'rgba(245,233,204,.55)');
      }
    },
    orologio: {
      w: 26, h: 26, ax: 13, ay: 13,
      paint(g) {
        circle(g, 13, 13, 12, DP.ink2);
        circle(g, 13, 13, 10, DP.cream);
        for (let i = 0; i < 12; i++) {
          const a = i / 12 * TAU;
          rect(g, 13 + Math.cos(a) * 8 - .5, 13 + Math.sin(a) * 8 - .5, 1, 1, DP.ink2);
        }
        rect(g, 12.5, 13, 1, -5, DP.ink2);
        rect(g, 13, 12.5, 4, 1, DP.red);
        circle(g, 13, 13, 1, DP.red);
      }
    },
    cartello: {
      w: 36, h: 26, ax: 18, ay: 26,
      paint(g) {
        rect(g, 1, 2, 34, 22, DP.ink2);
        rect(g, 2, 3, 32, 20, DP.gold);
        rect(g, 3, 4, 30, 18, '#1a264a');
        dirText(g, 'PIANO 4', 18, 11, 4, DP.cream);
        dirText(g, '→ PIANO ALTO', 18, 18, 3, DP.gold);
        rect(g, 3, 5, 30, 1, 'rgba(255,248,231,.35)');
        rect(g, 5, 24, 2, 2, DP.metalDk);
        rect(g, 29, 24, 2, 2, DP.metalDk);
      }
    },
    estintore: {
      w: 18, h: 30, ax: 9, ay: 30,
      paint(g) {
        rect(g, 4, 5, 10, 24, DP.ink2);
        rect(g, 5, 6, 8, 22, DP.red);
        rect(g, 6, 7, 2, 18, 'rgba(255,255,255,.18)');
        rect(g, 6, 3, 6, 3, DP.ink2);
        rect(g, 8, 1, 2, 2, DP.metalDk);
        rect(g, 4, 12, 10, 4, DP.cream);
        dirText(g, 'EST', 9, 15, 2.5, DP.red);
      }
    },
    panca: {
      w: 64, h: 30, ax: 32, ay: 30,
      paint(g) {
        rect(g, 2, 4, 60, 4, DP.woodDk);
        rect(g, 2, 8, 60, 4, DP.woodHi);
        rect(g, 2, 13, 60, 4, DP.wood);
        rect(g, 6, 17, 4, 13, DP.metalDk);
        rect(g, 54, 17, 4, 13, DP.metalDk);
        rect(g, 2, 27, 60, 3, 'rgba(12,10,18,.3)');
      }
    },
    attesa: {
      w: 50, h: 64, ax: 25, ay: 64,
      paint(g) {
        // sedia da sala d'attesa vista di fronte: montanti e schienale DIETRO,
        // seduta all'altezza del bacino, gambe della sedia ai lati di quelle della persona.
        ellipse(g, 25, 62, 20, 3, 'rgba(12,10,18,.30)');
        // schienale (dietro alla persona)
        rect(g, 9, 24, 4, 25, DP.woodDk);
        rect(g, 37, 24, 4, 25, DP.woodDk);
        rect(g, 9, 24, 32, 5, DP.woodDk);
        rect(g, 11, 31, 28, 2, DP.wood);
        rect(g, 11, 36, 28, 2, DP.wood);
        // seduta + gambe della sedia (frontali, ai lati della persona)
        rect(g, 8, 46, 34, 4, DP.wood);
        rect(g, 8, 46, 34, 1, DP.woodHi);
        rect(g, 10, 50, 3, 12, DP.metalDk);
        rect(g, 37, 50, 3, 12, DP.metalDk);
        rect(g, 14, 50, 2, 12, DP.woodDk);
        rect(g, 34, 50, 2, 12, DP.woodDk);
        // persona seduta: bacino sulla seduta, gambe che scendono davanti
        dirPerson(g, 25, 63, Object.assign({}, DIR_CHAR_PRESETS.utente, { sit: true, h: 37, hold: 'ticket', hair: DP.hairDk }));
        // biglietto del turno in mano
        rect(g, 32, 42, 6, 3, DP.cream);
        rect(g, 33, 43, 3, 1, 'rgba(29,37,56,.55)');
        dirText(g, 'T-204', 33, 21, 3, DP.gold);
      }
    },
    fotocopiatrice: {
      w: 46, h: 54, ax: 23, ay: 54,
      paint(g) {
        dirCopier(g, 9, 54);
        dirPlant(g, 40, 54, .7);
      }
    },
    quadro: {
      w: 42, h: 30, ax: 21, ay: 30,
      paint(g) {
        rect(g, 0, 0, 42, 30, DP.ink2);
        rect(g, 2, 2, 38, 26, DP.woodDk);
        rect(g, 3, 3, 36, 24, DP.woodHi);
        rect(g, 5, 5, 32, 20, DP.wallBlue);
        rect(g, 5, 15, 32, 10, DP.sea);
        circle(g, 30, 10, 4, DP.gold);
        poly(g, [[5, 15], [12, 9], [18, 15]], DP.green);
        poly(g, [[14, 15], [21, 10], [27, 15]], DP.teal);
        rect(g, 5, 17, 32, 1, 'rgba(255,248,231,.25)');
        for (let i = 0; i < 4; i++) rect(g, 7 + i * 8, 18, 5, 1, 'rgba(255,248,231,.28)');
        rect(g, 8, 20, 8, 4, DP.cream);
        rect(g, 9, 22, 6, 1, DP.red);
        rect(g, 1, 1, 40, 1, 'rgba(255,248,231,.16)');
      }
    },
    cestino: {
      w: 18, h: 28, ax: 9, ay: 28,
      paint(g) {
        ellipse(g, 9, 27, 7, 2, 'rgba(12,10,18,.30)');
        rect(g, 3, 6, 12, 20, DP.ink2);
        rect(g, 4, 7, 10, 18, DP.metalDk);
        rect(g, 5, 8, 2, 16, 'rgba(255,255,255,.14)');
        rect(g, 2, 4, 14, 3, DP.steel);
        rect(g, 4, 4, 2, 2, DP.ink2);
        rect(g, 12, 4, 2, 2, DP.ink2);
        rect(g, 5, 9, 8, 3, DP.cream);
        rect(g, 6, 10, 6, 1, 'rgba(29,37,56,.5)');
      }
    },
    segnale: {
      w: 34, h: 20, ax: 17, ay: 20,
      paint(g) {
        rect(g, 0, 0, 34, 20, DP.ink2);
        rect(g, 1, 1, 32, 18, DP.green);
        rect(g, 2, 2, 30, 16, '#3ba4b9');
        dirText(g, 'USCITA', 15, 10, 4, DP.cream);
        dirText(g, '→', 27, 16, 6, DP.cream);
        rect(g, 3, 3, 28, 1, 'rgba(255,248,231,.3)');
        rect(g, 3, 16, 28, 1, 'rgba(12,10,18,.35)');
      }
    },
    distributore: {
      w: 30, h: 50, ax: 15, ay: 50,
      paint(g) {
        dirVending(g, 2, 50);
        ellipse(g, 15, 49, 13, 2, 'rgba(12,10,18,.28)');
      }
    },
    pancaPersone: {
      w: 92, h: 64, ax: 46, ay: 64,
      paint(g) {
        // panca della sala d'attesa con due persone sedute
        ellipse(g, 46, 62, 41, 3, 'rgba(12,10,18,.30)');
        rect(g, 6, 22, 80, 4, DP.woodDk);
        rect(g, 6, 28, 80, 4, DP.woodHi);
        rect(g, 6, 34, 80, 4, DP.wood);
        rect(g, 4, 42, 84, 5, DP.wood);
        rect(g, 4, 42, 84, 1, DP.woodHi);
        rect(g, 8, 47, 4, 15, DP.metalDk);
        rect(g, 80, 47, 4, 15, DP.metalDk);
        rect(g, 12, 47, 2, 15, DP.woodDk);
        rect(g, 78, 47, 2, 15, DP.woodDk);
        dirPerson(g, 30, 61, Object.assign({}, DIR_CHAR_PRESETS.utente, { sit: true, h: 36, hold: 'ticket', hair: DP.hairDk }));
        dirPerson(g, 62, 61, Object.assign({}, DIR_CHAR_PRESETS.bidella, { sit: true, h: 36, hair: '#8d5016' }));
        rect(g, 37, 42, 6, 3, DP.cream);
        rect(g, 69, 42, 6, 3, DP.cream);
        dirText(g, 'T-205', 46, 18, 3, DP.gold);
      }
    }
  };

  /* ---------------- personaggi procedurali (fallback / nuovi NPC) ---------------- */
  const DIR_CHAR_DEFS = {
    impiegato(g) { dirPerson(g, 24, 86, Object.assign({}, DIR_CHAR_PRESETS.impiegato, { h: 44 })); },
    dirigente(g) { dirPerson(g, 24, 86, Object.assign({}, DIR_CHAR_PRESETS.dirigente, { h: 44, hold: 'folder' })); },
    collega(g) { dirPerson(g, 24, 86, Object.assign({}, DIR_CHAR_PRESETS.collega, { h: 44, hold: 'folder' })); },
    tirocinante(g) { dirPerson(g, 24, 86, Object.assign({}, DIR_CHAR_PRESETS.tirocinante, { h: 44, hold: 'ticket' })); },
    archivista(g) { dirPerson(g, 24, 86, Object.assign({}, DIR_CHAR_PRESETS.archivista, { h: 44, hold: 'box' })); },
    it(g) { dirPerson(g, 24, 86, Object.assign({}, DIR_CHAR_PRESETS.it, { h: 44, hold: 'laptop' })); },
    centralinista(g) { dirPerson(g, 24, 86, Object.assign({}, DIR_CHAR_PRESETS.centralinista, { h: 44, headset: true })); },
    cuoco(g) { dirPerson(g, 24, 86, Object.assign({}, DIR_CHAR_PRESETS.cuoco, { h: 44, hold: 'ladle' })); },
    formatore(g) { dirPerson(g, 24, 86, Object.assign({}, DIR_CHAR_PRESETS.formatore, { h: 44, hold: 'pointer' })); },
    bidella(g) { dirPerson(g, 24, 86, Object.assign({}, DIR_CHAR_PRESETS.bidella, { h: 44 })); },
    utente(g) { dirPerson(g, 24, 86, Object.assign({}, DIR_CHAR_PRESETS.utente, { h: 44 })); }
  };

  /* ---------------- dataset stanze ---------------- */
  A.direzioneRooms = [
    { x: A.direzioneWindowX(0), type: 'sportello', subject: 'impiegato', variant: 'c', label: 'SPORTELLO', door: 'open' },
    { x: A.direzioneWindowX(1), type: 'segreteria', subject: 'collega', variant: 'b', label: 'SEGRETERIA', door: 'open' },
    { x: A.direzioneWindowX(2), type: 'darts', subject: 'darts', variant: 'a', label: 'FRECCETTE', door: 'open' },
    { x: A.direzioneWindowX(3), type: 'photocopy', subject: 'tirocinante', variant: 'b', label: 'FOTOCOPIE', door: 'open' },
    { x: A.direzioneWindowX(4), type: 'beans', subject: 'beans', variant: 'a', label: 'FAGIOLINI', door: 'open' },
    { x: A.direzioneWindowX(5), type: 'waiting', subject: 'attesa', variant: 'a', label: 'ATTESA', door: 'open' },
    { x: A.direzioneWindowX(6), type: 'tennis', subject: 'tennis', variant: 'c', label: 'TENNIS', door: 'open' },
    { x: A.direzioneWindowX(7), type: 'golf', subject: 'golf', variant: 'b', label: 'GOLF', door: 'open' },
    { x: A.direzioneWindowX(8), type: 'meeting', subject: 'dirigente', variant: 'c', label: 'RIUNIONI', door: 'open' },
    { x: A.direzioneWindowX(9), type: 'training', subject: 'formatore', variant: 'b', label: 'FORMAZIONE', door: 'open' },
    { x: A.direzioneWindowX(10), type: 'coffee', subject: 'collega', variant: 'b', label: 'CAFFÈ', door: 'open' },
    { x: A.direzioneWindowX(11), type: 'vending', subject: 'bidella', variant: 'c', label: 'DISTRIBUTORE', door: 'open' },
    { x: A.direzioneWindowX(12), type: 'archive', subject: 'archivista', variant: 'b', label: 'ARCHIVIO', door: 'open' },
    { x: A.direzioneWindowX(13), type: 'server', subject: 'it', variant: 'a', label: 'SERVER', door: 'open' },
    { x: A.direzioneWindowX(14), type: 'centralino', subject: 'centralinista', variant: 'b', label: 'CENTRALINO', door: 'open' },
    { x: A.direzioneWindowX(15), type: 'protocollo', subject: 'impiegato', variant: 'b', label: 'PROTOCOLLO', door: 'open' },
    { x: A.direzioneWindowX(16), type: 'mensa', subject: 'cuoco', variant: 'c', label: 'MENSA', door: 'open' }
  ];

  A.direzioneRoomAt = function (worldX) {
    let best = null, bd = 1e9;
    for (const r of A.direzioneRooms) {
      const d = Math.abs(r.x - worldX);
      if (d < bd) { bd = d; best = r; }
    }
    return best;
  };

  /* ---------------- soggetti ambientali del corridoio ---------------- */
  /* 31 elementi nei gap tra le 17 finestre (finestra i: x=1020+i*205, larga 58):
     i centri dei gap sono 1020 + i*205 + 131.5. Parete alta y 106-112, a terra
     y = GROUND-40/-41. Nessun elemento invade la finestra (58x100 a y=118). */
  A.direzioneAmbience = [
    // --- parete ---
    { key: 'bacheca', x: 1151, y: 112 },
    { key: 'orologio', x: 1356, y: 106 },
    { key: 'quadro', x: 1561, y: 110 },
    { key: 'cartello', x: 1766, y: 112 },
    { key: 'segnale', x: 1971, y: 106 },
    { key: 'bacheca', x: 2381, y: 112, scale: 1.05 },
    { key: 'orologio', x: 2586, y: 106 },
    { key: 'quadro', x: 2791, y: 110 },
    { key: 'cartello', x: 2996, y: 112 },
    { key: 'bacheca', x: 3201, y: 112, scale: .92 },
    { key: 'orologio', x: 3406, y: 106 },
    { key: 'quadro', x: 3611, y: 110, scale: .9 },
    { key: 'segnale', x: 3816, y: 106 },
    { key: 'cartello', x: 4021, y: 112 },
    { key: 'orologio', x: 4226, y: 106, scale: 1.1 },
    // --- a terra ---
    { key: 'plantTall', x: 1105, y: A.GROUND - 40, scale: 1.05 },
    { key: 'estintore', x: 1356, y: A.GROUND - 40 },
    { key: 'cestino', x: 1520, y: A.GROUND - 40 },
    { key: 'pancaPersone', x: 1766, y: A.GROUND - 41 },
    { key: 'plantSmall', x: 1971, y: A.GROUND - 40, scale: 1.15 },
    { key: 'attesa', x: 2176, y: A.GROUND - 41 },
    { key: 'plantTall', x: 2381, y: A.GROUND - 40, scale: .9 },
    { key: 'fotocopiatrice', x: 2586, y: A.GROUND - 40 },
    { key: 'cestino', x: 2791, y: A.GROUND - 40 },
    { key: 'pancaPersone', x: 2996, y: A.GROUND - 41 },
    { key: 'plantSmall', x: 3201, y: A.GROUND - 40 },
    { key: 'attesa', x: 3445, y: A.GROUND - 41 },
    { key: 'plantTall', x: 3611, y: A.GROUND - 40, scale: 1.1 },
    { key: 'estintore', x: 3816, y: A.GROUND - 40 },
    { key: 'pancaPersone', x: 4226, y: A.GROUND - 41 },
    { key: 'distributore', x: 4431, y: A.GROUND - 40 },
    { key: 'plantSmall', x: 4021, y: A.GROUND - 40, scale: .9 }
  ];

  A.buildDirezioneRooms = function () {
    const variants = {};
    for (const r of (A.direzioneRooms || [])) variants[r.type] = r.variant || 'a';
    A.direzioneRoomArt = {};
    A.procNpcs = A.procNpcs || {};
    for (const [type, paint] of Object.entries(DIR_ROOM_PAINTERS)) {
      const c = canvas(DIR_RW, DIR_RH);
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      try { paint(g); } catch (e) { dirBase(g); }
      const variant = variants[type] || 'a';
      if (variant === 'b') { g.fillStyle = 'rgba(255,196,120,.07)'; g.fillRect(0, 0, DIR_RW, DIR_RH); }
      else if (variant === 'c') { g.fillStyle = 'rgba(126,182,217,.08)'; g.fillRect(0, 0, DIR_RW, DIR_RH); }
      quantize(c);
      A.direzioneRoomArt[type] = c;
      A.procNpcs[type] = c;
    }
    // v2.1 — ripristina le vignette AI già caricate (la ricomposizione
    // procedurale avviene anche dopo il caricamento PNG v1 e non deve
    // cancellare le stanze generate con AI).
    A.direzioneRoomAI = A.direzioneRoomAI || {};
    if (A.direzioneRoomAIArt) {
      for (const t of Object.keys(A.direzioneRoomAIArt)) {
        A.direzioneRoomArt[t] = A.direzioneRoomAIArt[t];
        A.direzioneRoomAI[t] = true;
      }
    }
    A.direzioneCharacters = {};
    for (const [key, paint] of Object.entries(DIR_CHAR_DEFS)) {
      const c = canvas(DIR_RW, DIR_RH);
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      try { paint(g); } catch (e) { /* soggetto non disponibile */ }
      A.direzioneCharacters[key] = c;
    }
    A.direzioneSubjects = {};
    for (const [key, def] of Object.entries(DIR_SUBJECT_DEFS)) {
      const c = canvas(def.w, def.h);
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      try { def.paint(g); } catch (e) { /* soggetto non disponibile */ }
      A.direzioneSubjects[key] = {
        canvas: c, w: def.w, h: def.h,
        ax: def.ax == null ? def.w / 2 : def.ax,
        ay: def.ay == null ? def.h : def.ay,
        kind: def.kind || 'prop'
      };
    }
  };

  A.drawDirezioneSubject = function (ctx, key, x, y, opts = {}) {
    const s = A.direzioneSubjects && A.direzioneSubjects[key];
    if (!s || !s.canvas) return false;
    const scale = opts.scale || 1;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(x), Math.round(y));
    if (opts.flip) ctx.scale(-1, 1);
    ctx.drawImage(s.canvas, Math.round(-s.ax * scale), Math.round(-s.ay * scale), Math.round(s.w * scale), Math.round(s.h * scale));
    ctx.restore();
    return true;
  };

  A.drawDirezioneAmbience = function (ctx, cam, time) {
    if (!A.direzioneSubjects) return;
    const t = time == null ? (performance.now() / 1000) : time;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    for (const it of A.direzioneAmbience) {
      const sx = it.x - cam;
      if (sx < -80 || sx > A.W + 80) continue;
      const s = A.direzioneSubjects[it.key];
      if (!s) continue;
      const scale = it.scale || 1;
      const x = Math.round(sx);
      const y = Math.round(it.y);
      ctx.drawImage(s.canvas, Math.round(x - s.ax * scale), Math.round(y - s.ay * scale), Math.round(s.w * scale), Math.round(s.h * scale));
      if (it.key === 'orologio') {
        const cx = x, cy = y - s.ay * scale + 13 * scale;
        const a = t * (TAU / 60) - Math.PI / 2;
        rect(ctx, cx, cy, 1, 1, DP.ink2);
        line(ctx, cx, cy, cx + Math.cos(t * (TAU / 60) * 60) * 4, cy + Math.sin(t * (TAU / 60) * 60) * 4, DP.ink2, 1);
        line(ctx, cx, cy, cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, DP.red, 1);
      }
    }
    ctx.restore();
  };

  A.drawDirezioneWindow = function (ctx, x, y, room, time) {
    const t = time == null ? (performance.now() / 1000) : time;
    const wx = Math.round(x), wy = y == null ? DIR_WIN_Y : y;
    // cornice
    rect(ctx, wx, wy, DIR_WIN_W, DIR_WIN_H, '#0b0812');
    rect(ctx, wx + 1, wy + 1, DIR_WIN_W - 2, DIR_WIN_H - 2, '#8b8e84');
    rect(ctx, wx + 3, wy + 3, DIR_WIN_W - 6, DIR_WIN_H - 6, '#5e6b6c');
    if (room && room.door === 'closed') {
      rect(ctx, wx + 5, wy + 6, DIR_RW, DIR_RH, '#737a72');
      rect(ctx, wx + 6, wy + 7, DIR_RW - 2, DIR_RH - 2, '#8b8e84');
      rect(ctx, wx + 26, wy + 42, 3, 8, '#d9d2bb');
      dirText(ctx, 'CHIUSO', wx + 29, wy + 58, 4, 'rgba(43,58,64,.75)');
      return;
    }
    const art = room && A.direzioneRoomArt && A.direzioneRoomArt[room.type];
    const aiRoom = !!(room && A.direzioneRoomAI && A.direzioneRoomAI[room.type]);
    ctx.save();
    ctx.beginPath();
    ctx.rect(wx + 5, wy + 6, DIR_RW, DIR_RH);
    ctx.clip();
    if (aiRoom) {
      // v2.1 — vignetta AI: fondo stanza (clip) per evitare "buchi" se il PNG
      // ha zone trasparenti ai bordi; la cornice resta quella procedurale.
      rect(ctx, wx + 5, wy + 6, DIR_RW, DIR_RH, '#232830');
      ctx.fillStyle = 'rgba(255,244,220,.05)';
      ctx.fillRect(wx + 5, wy + 6, DIR_RW, 26);
      ctx.fillStyle = 'rgba(6,6,12,.28)';
      ctx.fillRect(wx + 5, wy + 6 + DIR_RH - 18, DIR_RW, 18);
    } else {
      rect(ctx, wx + 5, wy + 6, DIR_RW, DIR_RH, '#202a2f');
    }
    if (art) ctx.drawImage(art, wx + 5, wy + 6);
    else {
      rect(ctx, wx + 5, wy + 6, DIR_RW, DIR_RH, '#3d4d54');
      dirText(ctx, '?', wx + 29, wy + 52, 14, 'rgba(239,235,220,.35)');
    }
    // v2.1 — vignette AI: NPC/ombre sono già nell'immagine, niente effetti
    // procedurali sovrapposti (vapore, LED, ecc.).
    if (!aiRoom) dirRoomFx(ctx, room && room.type, wx + 5, wy + 6, t);
    ctx.restore();
    // etichetta porta
    if (room && room.label) dirText(ctx, room.label, wx + DIR_WIN_W / 2, wy - 4, 4, 'rgba(235,235,220,.78)');
  };

  A.drawDirezioneRooms = function (ctx, cam, time) {
    if (!A.direzioneRooms) return;
    const t = time == null ? (performance.now() / 1000) : time;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    for (const room of A.direzioneRooms) {
      const sx = Math.round(room.x - cam);
      if (sx < -DIR_WIN_W - 4 || sx > A.W + 4) continue;
      A.drawDirezioneWindow(ctx, sx, DIR_WIN_Y, room, t);
    }
    ctx.restore();
  };

  /* =========================================================
     v2.0 — HELPERS CONDIVISI PER I NUOVI TEMI (Roma, Europa,
     Pescara, SOGEI). Tutto procedurale, stile pixel 32-bit.
     ========================================================= */
  function pinoMarittimo(g, x, baseY, h, s = 1) {
    g.strokeStyle = '#5c3415'; g.lineWidth = 4.6 * s; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, baseY); g.quadraticCurveTo(x + 5 * s, baseY - h * .55, x - 3 * s, baseY - h * .78); g.stroke();
    g.strokeStyle = '#8d5016'; g.lineWidth = 2.2 * s;
    g.beginPath(); g.moveTo(x, baseY); g.quadraticCurveTo(x + 5 * s, baseY - h * .55, x - 3 * s, baseY - h * .78); g.stroke();
    const cy = baseY - h * .8;
    ellipse(g, x - 2 * s, cy + 3 * s, h * .44, h * .15, '#154a24');
    ellipse(g, x - 2 * s, cy, h * .42, h * .16, '#1c562a');
    ellipse(g, x + 6 * s, cy - 5 * s, h * .3, h * .12, '#2f8a3f');
    ellipse(g, x - 24 * s, cy + 2 * s, h * .17, h * .08, '#154a24');
    ellipse(g, x - 6 * s, cy - 8 * s, h * .2, h * .07, '#3f9a4d');
  }

  function campanileRomano(g, x, baseY, w, h, wall = '#e6d5b0', roof = '#9a514e') {
    rect(g, x - w / 2, baseY - h, w, h, '#b7a17d');
    rect(g, x - w / 2 + 1, baseY - h, w - 3, h - 1, wall);
    rect(g, x - w / 2 + 1, baseY - h, 2, h - 1, '#f5e9cc');
    rect(g, x + w / 2 - 4, baseY - h, 2, h - 1, shadeColor(wall, -22));
    for (let i = 0; i < 3; i++) {
      const yy = baseY - h + 8 + i * Math.max(10, (h - 14) / 3);
      rect(g, x - w / 4, yy, w / 2, 4, '#4d2c4e');
      rect(g, x - w / 4 + 1, yy + 1, w / 4 - 1, 2, '#8d5016');
      rect(g, x, yy + 1, w / 4 - 1, 2, '#c87b1e');
    }
    poly(g, [[x - w / 2 - 3, baseY - h], [x, baseY - h - 13], [x + w / 2 + 3, baseY - h]], roof);
    rect(g, x - w / 2 - 3, baseY - h, w + 6, 2, shadeColor(roof, -18));
    rect(g, x - 1, baseY - h - 19, 2, 7, '#8d5016');
  }

  function cupolaRomana(g, x, baseY, r, tone = 1) {
    const wall = tone ? '#e3d3b0' : '#d8c7a5';
    // tamburo
    rect(g, x - r * .84, baseY - r * .86, r * 1.68, r * .86, wall);
    rect(g, x - r * .84, baseY - r * .86, r * .22, r * .86, shadeColor(wall, 12));
    rect(g, x + r * .6, baseY - r * .86, r * .24, r * .86, shadeColor(wall, -16));
    for (let i = 0; i < 5; i++) {
      rect(g, x - r * .6 + i * r * .27, baseY - r * .68, r * .11, r * .3, '#9d8768');
      rect(g, x - r * .6 + i * r * .27, baseY - r * .68, r * .11, r * .04, shadeColor(wall, 16));
    }
    rect(g, x - r * .95, baseY - r * .93, r * 1.9, r * .09, shadeColor(wall, 10));
    // calotta
    g.beginPath(); g.ellipse(x, baseY - r * .95, r * .8, r * .74, 0, Math.PI, TAU);
    g.fillStyle = '#cbb692'; g.fill();
    g.beginPath(); g.ellipse(x - r * .12, baseY - r * 1, r * .52, r * .5, 0, Math.PI, TAU);
    g.fillStyle = shadeColor(wall, 8); g.fill();
    for (let i = 1; i < 5; i++) {
      g.strokeStyle = 'rgba(109,90,64,.4)'; g.lineWidth = 1;
      g.beginPath(); g.ellipse(x, baseY - r * .95, r * .8 * i / 5, r * .74 * i / 5, 0, Math.PI, TAU); g.stroke();
    }
    // lanterna
    rect(g, x - r * .15, baseY - r * 1.82, r * .3, r * .2, wall);
    rect(g, x - r * .15, baseY - r * 1.82, r * .3, r * .04, '#9d8768');
    g.beginPath(); g.ellipse(x, baseY - r * 1.82, r * .19, r * .15, 0, Math.PI, TAU);
    g.fillStyle = '#cdb894'; g.fill();
    line(g, x, baseY - r * 1.97, x, baseY - r * 2.12, '#8d5016', 1.4);
    line(g, x - r * .05, baseY - r * 2.04, x + r * .05, baseY - r * 2.04, '#8d5016', 1.2);
  }

  function tricolore(g, x, y, w, h, wave = 0) {
    line(g, x, y - 2, x, y + h + 22, '#8d5016', 1.5);
    line(g, x + 1, y - 2, x + 1, y + h + 22, '#c87b1e', .7);
    const cols = ['#1c8a4a', '#fffdf2', '#c62265'];
    for (let i = 0; i < 3; i++) {
      const bend = Math.sin(wave + i * .7) * 1.4;
      poly(g, [[x + 1 + i * w / 3, y], [x + 1 + (i + 1) * w / 3, y + bend], [x + 1 + (i + 1) * w / 3, y + h + bend], [x + 1 + i * w / 3, y + h]], cols[i]);
    }
    g.strokeStyle = 'rgba(11,8,18,.35)'; g.lineWidth = .8;
    g.strokeRect(x + 1, y, w, h);
  }

  function bandieraEU(g, x, y, w, h, wave = 0) {
    line(g, x, y - 2, x, y + h + 22, '#8d5016', 1.5);
    const bend = Math.sin(wave) * 1.2;
    poly(g, [[x + 1, y], [x + 1 + w, y + bend], [x + 1 + w, y + h + bend], [x + 1, y + h]], '#1d3f8f');
    g.fillStyle = '#ffc84b';
    const cx = x + 1 + w / 2, cy = y + h / 2 + bend / 2;
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      const px = Math.round(cx + Math.cos(a) * w * .3), py = Math.round(cy + Math.sin(a) * h * .3);
      g.fillRect(px - 1, py, 2, 1); g.fillRect(px, py - 1, 1, 3); g.fillRect(px - 1, py + 2, 2, 1);
    }
    g.strokeStyle = 'rgba(11,8,18,.35)'; g.lineWidth = .8;
    g.strokeRect(x + 1, y, w, h);
  }

  function lampione(g, x, baseY, h) {
    rect(g, x - 4, baseY - 5, 9, 5, '#1d2538');
    line(g, x, baseY, x, baseY - h, '#1d2538', 3.2);
    line(g, x + 1, baseY - 2, x + 1, baseY - h + 2, '#41505f', 1.2);
    rect(g, x - 1, baseY - 9, 3, 4, '#41505f');
    line(g, x, baseY - h + 2, x + 7, baseY - h + 2, '#1d2538', 2);
    g.beginPath(); g.moveTo(x + 5, baseY - h + 2); g.lineTo(x + 15, baseY - h + 2); g.lineTo(x + 13, baseY - h + 7); g.lineTo(x + 7, baseY - h + 7); g.closePath();
    g.fillStyle = '#2e3a50'; g.fill();
    rect(g, x + 7, baseY - h + 3, 6, 4, '#ffedb1');
    g.fillStyle = 'rgba(255,222,135,.18)';
    g.beginPath(); g.arc(x + 10, baseY - h + 5, 12, 0, TAU); g.fill();
  }

  function obelisco(g, x, baseY, h, w) {
    const top = baseY - h;
    rect(g, x - w * .95, baseY - 12, w * 1.9, 12, '#b7a17d');
    rect(g, x - w * .95, baseY - 12, w * 1.9, 3, '#d8c7a5');
    rect(g, x - w * .8, baseY - 24, w * 1.6, 12, '#cbb98e');
    rect(g, x - w * .8, baseY - 24, w * 1.6, 3, '#e6d5b0');
    poly(g, [[x - w * .55, baseY - 24], [x - w * .3, top], [x + w * .3, top], [x + w * .55, baseY - 24]], '#e6d5b0');
    poly(g, [[x - w * .55, baseY - 24], [x - w * .3, top], [x - w * .06, top], [x - w * .16, baseY - 24]], '#f5e9cc');
    poly(g, [[x + w * .3, top], [x + w * .55, baseY - 24], [x + w * .4, baseY - 24], [x + w * .22, top]], '#cbb98e');
    for (let i = 0; i < 6; i++) {
      g.fillStyle = 'rgba(120,96,64,.5)';
      g.fillRect(x - w * .26, top + 12 + i * (h - 44) / 6, w * .5, 1);
      g.fillRect(x - w * .2 + (i % 2) * 3, top + 14 + i * (h - 44) / 6, 1, 3);
    }
    // piramidione
    poly(g, [[x - w * .3, top], [x, top - 16], [x + w * .3, top]], '#d8c7a5');
    poly(g, [[x - w * .3, top], [x, top - 16], [x - w * .02, top]], '#fff3d0');
    line(g, x, top - 17, x, top - 24, '#8d5016', 1.4);
    line(g, x - 3, top - 21, x + 3, top - 21, '#8d5016', 1.2);
  }

  function colonnaTravertino(g, x, baseY, h, w, tone = 1) {
    const body = tone ? '#e6d5b0' : '#d8c7a5';
    rect(g, x - w * .9, baseY - 8, w * 1.8, 8, '#b7a17d');
    rect(g, x - w * .9, baseY - 8, w * 1.8, 2, '#e6d5b0');
    rect(g, x - w / 2, baseY - h, w, h - 8, body);
    rect(g, x - w / 2, baseY - h, w * .34, h - 8, '#f5e9cc');
    rect(g, x + w * .2, baseY - h, w * .3, h - 8, shadeColor(body, -18));
    g.fillStyle = 'rgba(120,96,64,.34)';
    for (let i = 0; i < 5; i++) g.fillRect(x - w * .22 + i * w * .12, baseY - h + 6, 1, h - 18);
    rect(g, x - w * .72, baseY - h - 7, w * 1.44, 7, '#d8c7a5');
    rect(g, x - w * .72, baseY - h - 7, w * .5, 2, '#f5e9cc');
    rect(g, x - w * .9, baseY - h - 12, w * 1.8, 5, '#e6d5b0');
    rect(g, x - w * .9, baseY - h - 12, w * .6, 2, '#fff3d0');
  }

  function bicicletta(g, x, baseY, s = 1, col = '#2e3a50') {
    g.save(); g.translate(x, baseY); g.scale(s, s);
    g.strokeStyle = '#0b0812'; g.lineWidth = 2.4;
    for (const wx of [-15, 15]) {
      g.beginPath(); g.arc(wx, -11, 7.5, 0, TAU); g.stroke();
      g.strokeStyle = col; g.lineWidth = 1.1;
      g.beginPath(); g.arc(wx, -11, 7.5, 0, TAU); g.stroke();
      g.strokeStyle = '#0b0812'; g.lineWidth = 2.4;
      line(g, wx, -11, wx, -11, '#0b0812', 1);
      g.beginPath(); g.moveTo(wx, -18.5); g.lineTo(wx, -3.5); g.moveTo(wx - 7.5, -11); g.lineTo(wx + 7.5, -11); g.stroke();
    }
    g.strokeStyle = col; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(-15, -11); g.lineTo(-2, -11); g.lineTo(6, -21); g.lineTo(15, -11); g.moveTo(-2, -11); g.lineTo(6, -21); g.stroke();
    g.strokeStyle = '#0b0812'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(6, -21); g.lineTo(8, -25); g.moveTo(5, -25); g.lineTo(11, -25); g.stroke();
    g.beginPath(); g.moveTo(-15, -11); g.lineTo(-17, -17); g.moveTo(-20, -17); g.lineTo(-14, -17); g.stroke();
    g.restore();
  }

  function vespa(g, x, baseY, s = 1, col = '#3ba4b9') {
    g.save(); g.translate(x, baseY); g.scale(s, s);
    for (const wx of [-14, 13]) {
      g.fillStyle = '#0b0812';
      g.beginPath(); g.arc(wx, -6, 7, 0, TAU); g.fill();
      g.fillStyle = '#1d2538';
      g.beginPath(); g.arc(wx, -6, 5, 0, TAU); g.fill();
      g.fillStyle = '#7280b3';
      g.beginPath(); g.arc(wx, -6, 2, 0, TAU); g.fill();
    }
    g.fillStyle = '#0b0812';
    g.beginPath();
    g.moveTo(-16, -10); g.quadraticCurveTo(-8, -24, 6, -22); g.quadraticCurveTo(18, -20, 18, -12);
    g.lineTo(15, -8); g.lineTo(-10, -6); g.closePath(); g.fill();
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(-14, -11); g.quadraticCurveTo(-8, -22, 5, -20); g.quadraticCurveTo(16, -18, 16, -12);
    g.lineTo(14, -10); g.lineTo(-9, -8); g.closePath(); g.fill();
    g.fillStyle = shadeColor(col, 22);
    g.fillRect(-6, -20, 10, 3);
    g.fillStyle = '#fffdf2';
    rect(g, 7, -18, 8, 5, '#fffdf2');
    rect(g, 8, -17, 6, 3, '#9fc1ea');
    rect(g, -13, -16, 6, 4, '#1a1222');
    g.fillStyle = '#ffc84b'; g.beginPath(); g.arc(16, -11, 2, 0, TAU); g.fill();
    line(g, -16, -12, -21, -20, '#1d2538', 2);
    line(g, -21, -20, -16, -22, '#1d2538', 1.4);
    g.restore();
  }

  function sampietriniBand(g, w, y0, y1, rand, base = '#8b7f72') {
    rect(g, 0, y0, w, y1 - y0, base);
    const step = 7;
    for (let r = 0, y = y0; y < y1 - 2; r++, y += step) {
      const off = (r % 2) * 6;
      for (let x = -off; x < w; x += 12) {
        const tone = rand();
        rect(g, x + 1, y + 1, 10, step - 3, tone > .85 ? '#a89a87' : tone > .6 ? '#9c8e7d' : '#938575');
        rect(g, x + 1, y + step - 2, 10, 1, 'rgba(70,60,50,.5)');
        rect(g, x + 1, y + 1, 10, 1, 'rgba(255,244,220,.14)');
      }
    }
  }

  /* ---------------- ROMA: cielo, lontananze, piazza, arena ---------------- */
  function buildRomaSky() {
    const c = canvas(640, 360), g = c.getContext('2d');
    bandedGradient(g, 640, 0, 224, ['#3d6fa6', '#5b93c2', '#8ebfd6', '#c7dde0', '#f0e2c0', '#ffd9a0'], 3);
    g.fillStyle = 'rgba(255,226,160,.2)'; g.beginPath(); g.arc(474, 116, 92, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,236,180,.26)'; g.beginPath(); g.arc(474, 116, 62, 0, TAU); g.fill();
    circle(g, 474, 116, 26, '#ffe8a3');
    circle(g, 474, 116, 20, '#fff5c7');
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      g.fillStyle = 'rgba(255,246,190,.4)';
      g.fillRect(474 + Math.cos(a) * 34, 116 + Math.sin(a) * 34, 2, 2);
    }
    cloud(g, 104, 78, .72, '#fffaf0', '#dfe3d7');
    cloud(g, 306, 52, .46, '#fff9ee', '#e1e5dc');
    cloud(g, 596, 140, .5, '#fff5e8', '#e0dfdc');
    g.strokeStyle = '#645269'; g.lineWidth = 1;
    for (const [x, y, s] of [[186, 96, 5], [200, 88, 3], [436, 62, 4], [448, 56, 2], [540, 100, 3]]) {
      g.beginPath(); g.moveTo(x - s, y); g.quadraticCurveTo(x - s * .5, y - 3, x, y); g.quadraticCurveTo(x + s * .5, y - 3, x + s, y); g.stroke();
    }
    // velo caldo verso l'orizzonte
    bandedGradient(g, 640, 200, 300, ['rgba(247,231,199,.55)', 'rgba(240,220,184,.7)', 'rgba(230,208,170,.85)'], 3);
    g.fillStyle = '#e6d5b0'; g.fillRect(0, 296, 640, 64);
    g.fillStyle = '#d8c7a5'; g.fillRect(0, 296, 640, 3);
    return c;
  }

  function buildRomaFar() {
    const w = 1400;
    const c = canvas(w, 360), g = c.getContext('2d');
    const rand = mulberry32(3121);
    // foschia atmosferica
    g.fillStyle = 'rgba(247,231,199,.42)'; g.fillRect(0, 148, w, 112);
    // cupola di San Pietro e cupole minori
    cupolaRomana(g, 470, 258, 74, 1);
    cupolaRomana(g, 660, 266, 34, 0);
    cupolaRomana(g, 1040, 262, 40, 1);
    // tetti e palazzi lontani
    let x = -20;
    while (x < w) {
      const bw = 46 + Math.floor(rand() * 70);
      const bh = 20 + Math.floor(rand() * 34);
      const base = 262;
      g.fillStyle = rand() > .5 ? '#dccbaa' : '#d2c1a0';
      g.fillRect(x, base - bh, bw, bh + 40);
      g.fillStyle = '#e6d5b0';
      g.fillRect(x + 1, base - bh, bw - 2, 3);
      // tetto
      g.fillStyle = rand() > .55 ? '#b5683c' : '#9a514e';
      g.fillRect(x - 1, base - bh - 5, bw + 2, 5);
      g.fillStyle = 'rgba(255,248,231,.22)';
      g.fillRect(x - 1, base - bh - 5, bw + 2, 1);
      // finestre
      g.fillStyle = '#a58d6d';
      for (let wy = base - bh + 8; wy < base + 2; wy += 11) {
        for (let wx = x + 6; wx < x + bw - 6; wx += 12) g.fillRect(wx, wy, 4, 6);
      }
      x += bw + 4 + Math.floor(rand() * 5);
    }
    // campanili
    campanileRomano(g, 190, 264, 20, 76);
    campanileRomano(g, 880, 268, 17, 62);
    campanileRomano(g, 1240, 262, 22, 84);
    // pini marittimi in controluce
    pinoMarittimo(g, 90, 266, 92, 1);
    pinoMarittimo(g, 300, 268, 74, .85);
    pinoMarittimo(g, 760, 268, 88, .95);
    pinoMarittimo(g, 1120, 264, 104, 1.05);
    pinoMarittimo(g, 1350, 266, 80, .8);
    // massa opaca dei tetti fino a terra
    g.fillStyle = '#c3b090'; g.fillRect(0, 296, w, 64);
    g.fillStyle = '#b7a17d'; g.fillRect(0, 300, w, 60);
    const rand2 = mulberry32(445);
    for (let i = 0; i < 120; i++) {
      g.fillStyle = rand2() > .5 ? 'rgba(255,244,220,.18)' : 'rgba(70,58,42,.14)';
      g.fillRect(rand2() * w, 300 + rand2() * 56, 1 + rand2() * 5, 1);
    }
    g.fillStyle = 'rgba(255,240,205,.14)'; g.fillRect(0, 0, w, 140);
    return c;
  }

  function buildRomaMid() {
    const w = 2100;
    const c = canvas(w, 360), g = c.getContext('2d');
    const rand = mulberry32(9021);
    // marciapiede/piazza di fondo
    g.fillStyle = '#b7a17d'; g.fillRect(0, 236, w, 124);
    g.fillStyle = '#a89671'; g.fillRect(0, 236, w, 6);
    g.fillStyle = '#9c8a66'; g.fillRect(0, 262, w, 5);
    sampietriniBand(g, w, 268, 306, rand, '#938575');
    // fila di palazzi
    const pal = (px, pw, ph, wall, roof, label) => {
      rect(g, px, 240 - ph, pw, ph + 20, '#8b7358');
      rect(g, px + 2, 240 - ph, pw - 4, ph + 18, wall);
      rect(g, px + 2, 240 - ph, 4, ph + 18, shadeColor(wall, 12));
      rect(g, px + pw - 8, 240 - ph, 4, ph + 18, shadeColor(wall, -16));
      rect(g, px - 2, 240 - ph - 6, pw + 4, 8, roof);
      rect(g, px - 2, 240 - ph - 6, pw + 4, 2, shadeColor(roof, 22));
      // cornicione
      rect(g, px + 1, 240 - ph + 8, pw - 2, 3, shadeColor(wall, -10));
      // finestre con persiane
      const rows = Math.max(2, Math.floor((ph - 26) / 24));
      for (let r = 0; r < rows; r++) {
        const wy = 240 - ph + 18 + r * 24;
        for (let wx = px + 10; wx < px + pw - 12; wx += 20) {
          rect(g, wx, wy, 10, 14, '#4d2c4e');
          rect(g, wx + 1, wy + 1, 8, 12, rand() > .8 ? '#ffedb1' : '#7e8a86');
          rect(g, wx - 2, wy, 2, 14, '#2f8a3f');
          rect(g, wx + 10, wy, 2, 14, '#2f8a3f');
          rect(g, wx - 2, wy + 6, 14, 1, '#17655f');
        }
      }
      // portone
      rect(g, px + pw / 2 - 12, 240 - 30, 24, 30, '#4a3225');
      rect(g, px + pw / 2 - 10, 240 - 28, 20, 26, '#6d4a32');
      rect(g, px + pw / 2 - 1, 240 - 28, 2, 26, '#4a3225');
      if (label) {
        g.fillStyle = '#66192a';
        g.font = 'bold 7px monospace'; g.textAlign = 'center';
        g.fillText(label, px + pw / 2, 240 - ph - 12);
        g.textAlign = 'left';
      }
    };
    const pal2 = (px, pw, ph, wall, roof, label) => pal(px, pw, ph, wall, roof, label);
    // quinta di case a sinistra
    pal(0, 180, 118, '#e8d8b9', '#9a514e', 'TRATTORIA');
    pal(184, 150, 96, '#e0d0af', '#b5683c', '');
    // CAMPANILE di Santa Maria in Trastevere
    campanileRomano(g, 420, 240, 34, 148, '#e3d3b0', '#9a514e');
    // chiesa con mosaico
    rect(g, 480, 150, 220, 96, '#b7a17d');
    rect(g, 484, 154, 212, 90, '#e8d8b9');
    rect(g, 484, 154, 212, 7, '#f5e9cc');
    poly(g, [[472, 154], [590, 110], [708, 154]], '#9a514e');
    poly(g, [[480, 152], [590, 114], [700, 152]], '#b5683c');
    rect(g, 540, 166, 100, 26, '#2e3a50');
    g.fillStyle = '#ffc84b';
    for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) {
      g.fillRect(548 + i * 18, 170 + j * 7, 5, 4);
      g.fillStyle = i % 2 ? '#ff90b8' : '#ffe165';
      g.fillRect(550 + i * 18, 172 + j * 7, 2, 2);
      g.fillStyle = '#ffc84b';
    }
    rect(g, 584, 200, 22, 46, '#4a3225');
    rect(g, 587, 203, 16, 41, '#6d4a32');
    for (let i = 0; i < 3; i++) {
      rect(g, 500 + i * 62, 200, 12, 46, '#d8c7a5');
      rect(g, 502 + i * 62, 202, 4, 42, '#f5e9cc');
      rect(g, 500 + i * 62, 198, 14, 4, '#b7a17d');
    }
    // PALAZZO DELLA DIREZIONE CENTRALE (Piazza Mastai)
    const bx = 760, bw = 420, bh = 170;
    rect(g, bx - 6, 240 - bh - 10, bw + 12, bh + 30, '#8b7358');
    rect(g, bx, 240 - bh, bw, bh + 20, '#efe3c6');
    rect(g, bx, 240 - bh, 7, bh + 20, '#fff3d0');
    rect(g, bx + bw - 9, 240 - bh, 9, bh + 20, '#d8c6a2');
    rect(g, bx - 4, 240 - bh - 10, bw + 8, 11, '#cbb692');
    rect(g, bx - 4, 240 - bh - 10, bw + 8, 3, '#fff3d0');
    // timpano con scritta
    poly(g, [[bx + 40, 240 - bh - 10], [bx + bw / 2, 240 - bh - 44], [bx + bw - 40, 240 - bh - 10]], '#e6d5b0');
    poly(g, [[bx + 52, 240 - bh - 12], [bx + bw / 2, 240 - bh - 38], [bx + bw - 52, 240 - bh - 12]], '#d8c6a2');
    g.fillStyle = '#66192a'; g.font = 'bold 11px monospace'; g.textAlign = 'center';
    g.fillText('DIREZIONE CENTRALE', bx + bw / 2, 240 - bh + 16);
    g.font = 'bold 7px monospace';
    g.fillStyle = '#7a5a3a';
    g.fillText('PIAZZA MASTAI · ROMA', bx + bw / 2, 240 - bh + 28);
    g.textAlign = 'left';
    // finestre del palazzo
    for (let r = 0; r < 4; r++) {
      for (let cx = 0; cx < 7; cx++) {
        const wx = bx + 26 + cx * 56, wy = 240 - bh + 44 + r * 30;
        rect(g, wx - 2, wy - 2, 26, 24, '#b7a17d');
        rect(g, wx, wy, 22, 20, '#4d2c4e');
        rect(g, wx + 2, wy + 2, 18, 16, (r + cx) % 5 === 0 ? '#ffedb1' : '#9fc1ea');
        rect(g, wx + 2, wy + 2, 8, 16, 'rgba(255,255,255,.2)');
        rect(g, wx - 5, wy, 4, 20, '#2f8a3f');
        rect(g, wx + 23, wy, 4, 20, '#2f8a3f');
        rect(g, wx - 5, wy + 9, 32, 1, '#17655f');
      }
    }
    // scalinata d'ingresso
    rect(g, bx + bw / 2 - 46, 240 - 16, 92, 18, '#cbb692');
    rect(g, bx + bw / 2 - 44, 240 - 30, 88, 16, '#d8c6a2');
    rect(g, bx + bw / 2 - 40, 240 - 42, 80, 14, '#e6d5b0');
    rect(g, bx + bw / 2 - 20, 240 - 66, 40, 26, '#4a3225');
    rect(g, bx + bw / 2 - 17, 240 - 63, 34, 23, '#6d4a32');
    // bandiere sul palazzo
    tricolore(g, bx + 18, 240 - bh - 36, 18, 12, .2);
    bandieraEU(g, bx + bw - 38, 240 - bh - 36, 18, 12, 1.1);
    // altri palazzi a destra
    pal(1250, 190, 128, '#e3d3b0', '#9a514e', 'DOGANA');
    pal(1444, 160, 104, '#e8d8b9', '#b5683c', 'TABACCHI');
    // obelisco e fontana
    obelisco(g, 1730, 240, 138, 17);
    ellipse(g, 1650, 244, 70, 10, '#b7a17d');
    ellipse(g, 1650, 241, 58, 8, '#8fb4bd');
    ellipse(g, 1650, 240, 50, 6, '#73c8d4');
    rect(g, 1620, 246, 60, 10, '#cbb692');
    rect(g, 1626, 250, 48, 6, '#e6d5b0');
    // palazzi finali
    pal(1780, 160, 112, '#e0d0af', '#9a514e', '');
    pal(1944, 156, 132, '#e6d5b0', '#b5683c', '');
    // lampioni e bandierine
    for (const lx of [340, 720, 1210, 1420, 1700, 1930, 2080]) lampione(g, lx, 246, 62);
    g.strokeStyle = '#1d2538'; g.lineWidth = 1;
    for (const [x0, x1] of [[248, 720], [1210, 1420]]) {
      g.beginPath(); g.moveTo(x0, 176); g.quadraticCurveTo((x0 + x1) / 2, 186, x1, 176); g.stroke();
      for (let i = 0; i < 8; i++) {
        const px = x0 + (x1 - x0) * (i + 1) / 9;
        const py = 176 + Math.sin((i + 1) / 9 * Math.PI) * 8;
        poly(g, [[px - 2, py], [px + 2, py], [px, py + 4]], i % 2 ? '#c62265' : '#ffc84b');
      }
    }
    // pini dietro i palazzi
    pinoMarittimo(g, 118, 244, 96, 1);
    pinoMarittimo(g, 1240, 244, 84, .9);
    pinoMarittimo(g, 1980, 244, 92, .95);
    // foschia in basso per fondere
    g.fillStyle = 'rgba(255,240,205,.12)'; g.fillRect(0, 240, w, 120);
    return c;
  }

  function buildRomaNear() {
    const w = 2800;
    const c = canvas(w, 360), g = c.getContext('2d');
    const rand = mulberry32(7711);
    // pavimento della piazza in primo piano
    sampietriniBand(g, w, 268, 306, rand, '#8b7f72');
    g.fillStyle = 'rgba(255,244,220,.08)'; g.fillRect(0, 268, w, 4);
    // marciapiede e cordolo
    rect(g, 0, 258, w, 12, '#cbb692');
    rect(g, 0, 258, w, 3, '#e6d5b0');
    rect(g, 0, 267, w, 3, '#a89671');
    // porticato colonnato
    const portico = (px, n) => {
      rect(g, px - 6, 208, n * 54 + 12, 8, '#d8c6a2');
      rect(g, px - 6, 208, n * 54 + 12, 3, '#f5e9cc');
      for (let i = 0; i < n; i++) colonnaTravertino(g, px + i * 54 + 27, 258, 120, 16, i % 2);
      rect(g, px - 4, 258, n * 54 + 8, 6, '#b7a17d');
      // ombra del porticato
      g.fillStyle = 'rgba(40,30,26,.18)'; g.fillRect(px, 216, n * 54, 42);
    };
    portico(60, 4);
    portico(1520, 3);
    // fontana a due vasche
    const fx = 470;
    ellipse(g, fx, 262, 84, 12, 'rgba(40,30,26,.22)');
    ellipse(g, fx, 258, 80, 13, '#b7a17d');
    ellipse(g, fx, 255, 72, 10, '#e6d5b0');
    ellipse(g, fx, 252, 64, 8, '#8fb4bd');
    ellipse(g, fx, 251, 58, 6, '#73c8d4');
    rect(g, fx - 9, 214, 18, 38, '#cbb692');
    rect(g, fx - 6, 214, 5, 38, '#e6d5b0');
    ellipse(g, fx, 214, 30, 7, '#e6d5b0');
    ellipse(g, fx, 212, 25, 5, '#73c8d4');
    for (let i = 0; i < 3; i++) {
      line(g, fx - 4 + i * 4, 210, fx - 12 + i * 13, 240, 'rgba(207,239,238,.75)', 2);
      line(g, fx - 4 + i * 4, 210, fx - 12 + i * 13, 240, 'rgba(255,255,255,.3)', 1);
    }
    for (let i = 0; i < 8; i++) {
      g.fillStyle = 'rgba(207,239,238,.6)';
      g.fillRect(fx - 60 + i * 15, 254 + (i % 3), 2 + (i % 2) * 2, 1);
    }
    // caffè con ombrelloni
    const cafe = (px) => {
      rect(g, px, 226, 150, 32, '#efe3c6');
      rect(g, px, 226, 150, 4, '#cbb692');
      for (let i = 0; i < 4; i++) rect(g, px + 10 + i * 36, 232, 16, 12, '#9fc1ea');
      rect(g, px + 6, 254, 138, 4, '#c87b1e');
      rect(g, px + 10, 258, 4, 8, '#8d5016');
      rect(g, px + 134, 258, 4, 8, '#8d5016');
      // ombrelloni
      for (const ux of [px + 34, px + 108]) {
        line(g, ux, 254, ux, 196, '#8d5016', 2);
        g.fillStyle = '#c62265';
        g.beginPath(); g.moveTo(ux - 34, 206); g.quadraticCurveTo(ux, 186, ux + 34, 206); g.closePath(); g.fill();
        g.fillStyle = '#fff8e7';
        g.beginPath(); g.moveTo(ux - 17, 200); g.quadraticCurveTo(ux, 190, ux + 17, 200); g.closePath(); g.fill();
        g.fillStyle = '#c62265';
        g.beginPath(); g.moveTo(ux - 34, 206); g.lineTo(ux - 17, 200); g.lineTo(ux - 8, 206); g.closePath(); g.fill();
      }
      // tavolini
      for (const tx of [px + 24, px + 62, px + 120]) {
        rect(g, tx, 248, 22, 3, '#fff8e7');
        line(g, tx + 11, 251, tx + 11, 258, '#7280b3', 1.6);
      }
    };
    cafe(640);
    cafe(2280);
    // rastrelliera bici + vespe
    bicicletta(g, 1000, 262, 1.15, '#2e3a50');
    bicicletta(g, 1040, 262, 1.05, '#c62265');
    bicicletta(g, 1080, 262, 1.1, '#3ba4b9');
    for (let i = 0; i < 3; i++) rect(g, 990 + i * 42, 256, 4, 6, '#7280b3');
    vespa(g, 1180, 264, 1.2, '#3ba4b9');
    vespa(g, 1250, 264, 1.15, '#c62265');
    // obelisco in primo piano
    obelisco(g, 1420, 262, 178, 20);
    // bancarella "TIMBRO E TASSA"
    const kx = 1700;
    rect(g, kx, 214, 130, 44, '#8d5016');
    rect(g, kx + 2, 216, 126, 40, '#c87b1e');
    for (let i = 0; i < 5; i++) rect(g, kx + 8 + i * 25, 220, 3, 34, '#8d5016');
    rect(g, kx - 6, 206, 142, 10, '#c62265');
    rect(g, kx - 6, 206, 142, 3, '#ff90b8');
    g.fillStyle = '#fff8e7'; g.font = 'bold 8px monospace'; g.textAlign = 'center';
    g.fillText('TIMBRO E TASSA', kx + 65, 214);
    g.textAlign = 'left';
    for (let i = 0; i < 4; i++) {
      rect(g, kx + 14 + i * 28, 226, 16, 10, '#fff8e7');
      rect(g, kx + 16 + i * 28, 228, 12, 2, '#66192a');
      rect(g, kx + 16 + i * 28, 231, 8, 1, '#8b7f72');
    }
    // cartello PIAZZA MASTAI
    const sx = 1990;
    rect(g, sx + 16, 218, 5, 44, '#1d2538');
    rect(g, sx + 2, 196, 34, 26, '#1d2538');
    rect(g, sx + 4, 198, 30, 22, '#fff8e7');
    g.fillStyle = '#1d2538'; g.font = 'bold 5px monospace'; g.textAlign = 'center';
    g.fillText('PIAZZA', sx + 19, 205);
    g.fillText('MASTAI', sx + 19, 211);
    g.fillStyle = '#c62265'; g.fillRect(sx + 4, 214, 30, 2);
    g.textAlign = 'left';
    // colonna isolata con cartello
    colonnaTravertino(g, 2180, 258, 138, 19, 1);
    // fioriere
    for (let i = 0; i < 5; i++) {
      const px = 880 + i * 260;
      rect(g, px, 252, 34, 12, '#9a514e');
      rect(g, px + 2, 250, 30, 4, '#c16b5d');
      for (let k = 0; k < 4; k++) {
        ellipse(g, px + 6 + k * 7, 246 - (k % 2) * 3, 5, 4, k % 2 ? '#2f8a3f' : '#51c7a9');
        circle(g, px + 7 + k * 7, 242 - (k % 3) * 2, 2, k % 2 ? '#ff5b9d' : '#ffc84b');
      }
    }
    // piccioni
    const piccione = (px, py, s) => {
      rect(g, px, py, 5 * s, 3 * s, '#3c3547');
      rect(g, px + 4 * s, py - 1 * s, 2 * s, 2 * s, '#3c3547');
      rect(g, px + 1 * s, py + 2 * s, 1 * s, 2 * s, '#d54c42');
      rect(g, px + 3 * s, py + 2 * s, 1 * s, 2 * s, '#d54c42');
      rect(g, px + 5 * s, py - 1 * s, 1 * s, 1 * s, '#ffc84b');
    };
    piccione(340, 272, 1); piccione(368, 276, .9); piccione(1350, 274, 1.1);
    piccione(1750, 278, 1); piccione(2450, 272, 1.1); piccione(2600, 276, .9);
    // cordolo e ringhiera in basso
    rect(g, 0, 300, w, 6, '#a89671');
    for (let x = 0; x < w; x += 64) {
      rect(g, x, 292, 2, 8, '#1d2538');
      rect(g, x, 292, 34, 1, '#1d2538');
    }
    return c;
  }

  function buildBossRoma() {
    const c = canvas(640, 360), g = c.getContext('2d');
    const rand = mulberry32(6060);
    // cielo del tramonto romano
    bandedGradient(g, 640, 0, 250, ['#2b1e3f', '#4a2c56', '#7d4362', '#b8626a', '#e0866f', '#ffb98a'], 3);
    // luce divina soffusa dietro il tempio (niente disco netto)
    g.fillStyle = 'rgba(255,196,120,.16)'; g.beginPath(); g.arc(320, 150, 210, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,226,148,.14)'; g.beginPath(); g.arc(320, 150, 150, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,240,200,.1)'; g.beginPath(); g.arc(320, 150, 96, 0, TAU); g.fill();
    // raggi divini
    g.save();
    g.translate(320, 150);
    for (let i = 0; i < 18; i++) {
      g.rotate(TAU / 18);
      g.fillStyle = i % 2 ? 'rgba(255,224,150,.055)' : 'rgba(255,196,120,.04)';
      g.beginPath(); g.moveTo(0, 0); g.lineTo(240, -26); g.lineTo(240, 26); g.closePath(); g.fill();
    }
    g.restore();
    // nuvola pliniana
    cloud(g, 90, 92, 1.1, '#b98a94', '#9a7182');
    cloud(g, 550, 68, .9, '#c28f95', '#9f7281');
    cloud(g, 300, 58, .6, '#e0a88f', '#bd877f');
    // tempio di Cesare
    const tx = 320;
    // podio e scalinata
    rect(g, tx - 260, 236, 520, 72, '#6d5a4b');
    rect(g, tx - 250, 238, 500, 70, '#8a735c');
    for (let i = 0; i < 5; i++) {
      rect(g, tx - 246 + i * 4, 246 + i * 12, 492 - i * 8, 12, i % 2 ? '#a58b6d' : '#b7a17d');
      rect(g, tx - 246 + i * 4, 246 + i * 12, 492 - i * 8, 2, '#d8c7a5');
    }
    // colonne del tempio
    for (let i = 0; i < 6; i++) {
      colonnaTravertino(g, tx - 210 + i * 84, 250, 168, 20, i % 2);
    }
    // trabeazione e frontone
    rect(g, tx - 268, 74, 536, 18, '#e6d5b0');
    rect(g, tx - 268, 74, 536, 4, '#fff3d0');
    rect(g, tx - 256, 92, 512, 8, '#cbb692');
    poly(g, [[tx - 280, 74], [tx, 18], [tx + 280, 74]], '#d8c6a2');
    poly(g, [[tx - 250, 72], [tx, 30], [tx + 250, 72]], '#cbb692');
    poly(g, [[tx - 250, 72], [tx, 30], [tx - 10, 72]], '#e6d5b0');
    // timpano con corona d'alloro
    g.fillStyle = '#8f154d'; g.font = 'bold 16px monospace'; g.textAlign = 'center';
    g.fillText('DIVO IVLIO', tx, 62);
    g.font = 'bold 8px monospace'; g.fillStyle = '#66192a';
    g.fillText('PADRE DELLA PATRIA · TIMBRO SUPREMO', tx, 72);
    g.textAlign = 'left';
    // fregio
    rect(g, tx - 250, 96, 500, 10, '#b7a17d');
    for (let i = 0; i < 16; i++) rect(g, tx - 244 + i * 31, 98, 3, 6, i % 2 ? '#8d5016' : '#c87b1e');
    // porte bronzee
    rect(g, tx - 46, 170, 92, 66, '#5c3415');
    rect(g, tx - 42, 174, 84, 62, '#8d5016');
    rect(g, tx - 2, 174, 4, 62, '#5c3415');
    g.fillStyle = '#ffc84b';
    for (let i = 0; i < 4; i++) { g.fillRect(tx - 34 + i * 18, 186, 10, 10); g.fillRect(tx - 34 + i * 18, 208, 10, 10); }
    // statue nelle nicchie
    for (const sx of [tx - 210, tx + 210]) {
      rect(g, sx - 22, 140, 44, 96, '#a58b6d');
      rect(g, sx - 18, 144, 36, 92, '#6d5a4b');
      rect(g, sx - 12, 172, 24, 58, '#e6d5b0');
      rect(g, sx - 8, 176, 16, 50, '#d8c6a2');
      circle(g, sx, 160, 10, '#e6d5b0');
      circle(g, sx, 160, 8, '#d8c6a2');
      line(g, sx - 8, 178, sx + 6, 210, '#b7a17d', 4);
      rect(g, sx - 14, 228, 28, 5, '#cbb692');
    }
    // vessilli SPQR
    for (const [bx, dir] of [[tx - 300, 1], [tx + 300, -1]]) {
      line(g, bx, 100, bx, 236, '#5c3415', 4);
      line(g, bx + 1, 100, bx + 1, 236, '#c87b1e', 1.4);
      rect(g, bx - 34, 104, 68, 52, '#0b0812');
      rect(g, bx - 32, 106, 64, 48, '#8f154d');
      g.fillStyle = '#ffc84b'; g.font = 'bold 14px monospace'; g.textAlign = 'center';
      g.fillText('SPQR', bx, 128);
      g.font = 'bold 5px monospace'; g.fillStyle = '#ffe7c6';
      g.fillText('SENATVS', bx, 140); g.fillText('POPVLVSQVE', bx, 146);
      g.textAlign = 'left';
      poly(g, [[bx - 34, 156], [bx + 34, 156], [bx + 26, 176], [bx - 26, 176]], '#8f154d');
      g.fillStyle = '#ffc84b'; g.beginPath(); g.arc(bx, 166, 5, 0, TAU); g.fill();
    }
    // bracieri (fiamme alte e leggibili)
    for (const bx of [78, 562]) {
      rect(g, bx - 4, 236, 8, 62, '#1d2538');
      rect(g, bx - 16, 236, 32, 9, '#2e3a50');
      rect(g, bx - 12, 230, 24, 7, '#41505f');
      g.fillStyle = 'rgba(255,140,60,.28)'; g.beginPath(); g.arc(bx, 200, 52, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,200,75,.25)'; g.beginPath(); g.arc(bx, 196, 30, 0, TAU); g.fill();
      poly(g, [[bx - 14, 232], [bx - 8, 190], [bx - 2, 206], [bx + 2, 176], [bx + 7, 198], [bx + 13, 184], [bx + 15, 232]], '#ff845d');
      poly(g, [[bx - 9, 232], [bx - 4, 198], [bx + 1, 214], [bx + 4, 188], [bx + 9, 210], [bx + 10, 232]], '#ffc84b');
      poly(g, [[bx - 4, 232], [bx, 202], [bx + 3, 212], [bx + 5, 232]], '#fff8e7');
      g.fillStyle = 'rgba(255,140,60,.5)';
      g.fillRect(bx - 18, 224, 36, 2);
    }
    // corona d'alloro gigante sul fondo (dietro il frontone ma leggibile)
    g.save();
    g.translate(tx, 138);
    g.strokeStyle = 'rgba(255,200,75,.2)'; g.lineWidth = 34;
    g.beginPath(); g.arc(0, 0, 196, -.15, Math.PI + .15); g.stroke();
    g.strokeStyle = 'rgba(255,226,148,.26)'; g.lineWidth = 20;
    g.beginPath(); g.arc(0, 0, 196, -.15, Math.PI + .15); g.stroke();
    g.strokeStyle = 'rgba(255,248,231,.18)'; g.lineWidth = 6;
    g.beginPath(); g.arc(0, 0, 196, -.15, Math.PI + .15); g.stroke();
    for (let i = 0; i < 16; i++) {
      const a = -.1 + i / 15 * (Math.PI + .2);
      g.save(); g.translate(Math.cos(a) * 196, Math.sin(a) * 196); g.rotate(a + Math.PI / 2);
      g.fillStyle = 'rgba(255,200,75,.3)';
      g.beginPath(); g.ellipse(0, -7, 7, 14, 0, 0, TAU); g.fill();
      g.restore();
    }
    g.restore();
    // ghirlande di lauro tra le colonne
    for (let i = 0; i < 5; i++) {
      const x0 = tx - 210 + i * 84, x1 = x0 + 84;
      g.strokeStyle = 'rgba(47,138,63,.55)'; g.lineWidth = 5;
      g.beginPath(); g.moveTo(x0, 152); g.quadraticCurveTo((x0 + x1) / 2, 186, x1, 152); g.stroke();
      g.strokeStyle = 'rgba(90,196,87,.5)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x0, 150); g.quadraticCurveTo((x0 + x1) / 2, 182, x1, 150); g.stroke();
      for (let k = 1; k < 6; k++) {
        const tt = k / 6, xx = x0 + (x1 - x0) * tt;
        const yy = 152 + Math.sin(tt * Math.PI) * 30;
        g.fillStyle = k % 2 ? '#2f8a3f' : '#5ac457';
        g.beginPath(); g.ellipse(xx, yy + 3, 3, 5, tt * 1.2, 0, TAU); g.fill();
      }
      g.fillStyle = '#c62265';
      g.beginPath(); g.arc(x0 + 42, 172, 3.6, 0, TAU); g.fill();
      g.fillStyle = '#ff90b8';
      g.beginPath(); g.arc(x0 + 42, 171, 2, 0, TAU); g.fill();
    }
    // piazza e mosaici
    rect(g, 0, 296, 640, 64, '#6d5a4b');
    rect(g, 0, 296, 640, 5, '#8a735c');
    for (let y = 302; y < 360; y += 12) {
      g.fillStyle = (y / 12 % 2) ? '#7a624d' : '#6d5a4b';
      for (let x = ((y / 12) % 2) * 24; x < 640; x += 48) g.fillRect(x, y, 46, 10);
    }
    for (let i = 0; i < 6; i++) {
      const qx = 60 + i * 100, qy = 306 + (i % 3) * 14;
      g.fillStyle = 'rgba(38,26,22,.3)'; g.fillRect(qx, qy, 62, 16);
      g.fillStyle = 'rgba(255,226,148,.22)'; g.fillRect(qx + 2, qy + 2, 58, 2);
    }
    // fogli e direttive sparse
    for (let i = 0; i < 12; i++) {
      const px = 40 + rand() * 560, py = 300 + rand() * 48, rot = (rand() - .5) * .8;
      g.save(); g.translate(px, py); g.rotate(rot);
      rect(g, -6, -4, 13, 9, '#fff8e7');
      rect(g, -4, -2, 8, 1, '#8b7f72');
      rect(g, -4, 0, 6, 1, '#8b7f72');
      rect(g, 1, 1, 4, 3, '#c62265');
      g.restore();
    }
    // pulviscolo dorato
    for (let i = 0; i < 50; i++) {
      g.fillStyle = i % 3 ? 'rgba(255,224,150,.5)' : 'rgba(255,248,231,.65)';
      g.fillRect(rand() * 640, rand() * 300, 1, 1 + (i % 2));
    }
    g.fillStyle = 'rgba(255,170,110,.06)'; g.fillRect(0, 0, 640, 360);
    return c;
  }

  /* =========================================================
     v2.0 — NEMICI ROMA (84x90 come i nemici v1: 4 walk + attack
     + hurt nell'ordine atteso da enemyFrame di game.js)
     ========================================================= */
  function paintCenturione(o) {
    const g = canvas(84, 90).getContext('2d');
    const img = g.canvas;
    const mode = o.mode || 'walk';
    const t = o.phase || 0;
    const walk = Math.sin(t * TAU);
    const step = mode === 'walk' ? walk : 0;
    const bob = mode === 'walk' ? Math.abs(walk) * 1.3 : 0;
    const ink = '#0b0812';
    const steel = '#93aab8', steelLt = '#d4e5ee', steelDk = '#48576e';
    const red = '#9d2833', redLt = '#c62265', redDk = '#66192a';
    const leather = '#8d5016';
    g.save();
    g.translate(0, bob * .25);
    // --- gambe con caligae
    if (mode === 'hurt') {
      outlinedLimb(g, 40, 60, 33, 72, 8, '#e7a67d', ink);
      outlinedLimb(g, 33, 72, 30, 82, 6, '#e7a67d', ink);
      rect(g, 22, 82, 14, 4, leather);
      outlinedLimb(g, 50, 60, 57, 72, 8, '#e7a67d', ink);
      outlinedLimb(g, 57, 72, 61, 82, 6, '#e7a67d', ink);
      rect(g, 56, 82, 14, 4, leather);
    } else {
      outlinedLimb(g, 40, 60, 40 + step * 3, 72, 8, '#e7a67d', ink);
      outlinedLimb(g, 40 + step * 3, 72, 38 + step * 8, 82, 6, '#e7a67d', ink);
      rect(g, 30 + step * 8, 82, 15, 4, leather);
      rect(g, 32 + step * 8, 84, 13, 2, '#5c3415');
      outlinedLimb(g, 50, 60, 51 - step * 3, 72, 8, '#e7a67d', ink);
      outlinedLimb(g, 51 - step * 3, 72, 53 - step * 8, 82, 6, '#e7a67d', ink);
      rect(g, 47 - step * 8, 82, 15, 4, leather);
      rect(g, 49 - step * 8, 84, 13, 2, '#5c3415');
      // cinghie caligae
      g.strokeStyle = '#5c3415'; g.lineWidth = 1;
      for (let i = 0; i < 2; i++) {
        g.beginPath(); g.moveTo(36 + step * 5, 76 + i * 3); g.lineTo(43 + step * 5, 74 + i * 3); g.stroke();
        g.beginPath(); g.moveTo(49 - step * 5, 76 + i * 3); g.lineTo(56 - step * 5, 74 + i * 3); g.stroke();
      }
    }
    // --- gonnellino a strisce (pteruges)
    for (let i = 0; i < 6; i++) {
      const px = 34 + i * 4;
      rect(g, px, 56, 3, 9 + (i % 2) * 2, i % 2 ? redLt : red);
      rect(g, px, 63 + (i % 2) * 2, 3, 2, '#c87b1e');
    }
    // --- lorica segmentata
    rect(g, 33, 34, 28, 24, ink);
    for (let i = 0; i < 3; i++) {
      rect(g, 34, 36 + i * 7, 26, 6, i % 2 ? steel : steelLt);
      rect(g, 34, 36 + i * 7, 26, 2, '#f2fbff');
      rect(g, 34, 41 + i * 7, 26, 1, steelDk);
      for (let k = 0; k < 4; k++) circle(g, 37 + k * 6, 39 + i * 7, .9, '#7280b3');
    }
    rect(g, 33, 55, 28, 4, leather);
    rect(g, 44, 55, 6, 4, '#ffc84b');
    // spallacci
    for (const sx of [34, 52]) {
      rect(g, sx, 33, 8, 4, steel);
      rect(g, sx, 33, 8, 1, steelLt);
    }
    // mantello rosso dietro
    poly(g, [[33, 37], [28, 40], [25, 58], [33, 60]], '#8f154d');
    poly(g, [[33, 37], [29, 41], [27, 54], [33, 58]], redDk);
    // --- scudo (scutum) sul braccio sinistro
    const shX = 6, shY = 34;
    g.save();
    if (mode === 'attack') { g.translate(shX, shY); g.rotate(-.12); g.translate(-shX, -shY); }
    rect(g, shX - 1, shY - 1, 29, 44, ink);
    rect(g, shX + 1, shY, 25, 42, red);
    rect(g, shX + 1, shY, 25, 3, redLt);
    rect(g, shX + 1, shY + 38, 25, 4, redDk);
    // borchie
    for (const [bx, by] of [[shX + 5, shY + 6], [shX + 21, shY + 6], [shX + 5, shY + 34], [shX + 21, shY + 34]]) {
      circle(g, bx, by, 2, '#ffc84b'); circle(g, bx, by, 1, '#8d5016');
    }
    // umbone centrale con timbro
    circle(g, shX + 13, shY + 21, 7, '#ffc84b');
    circle(g, shX + 13, shY + 21, 5.5, '#c62265');
    rect(g, shX + 9, shY + 17, 8, 8, '#fff8e7');
    rect(g, shX + 10, shY + 18, 6, 2, '#66192a');
    rect(g, shX + 10, shY + 21, 4, 1, '#8b7f72');
    rect(g, shX + 12, shY + 23, 4, 2, '#c62265');
    // bordo dorato
    g.strokeStyle = '#c87b1e'; g.lineWidth = 1.2;
    g.strokeRect(shX + 1.5, shY + 1, 24, 40);
    g.restore();
    // --- braccio destro e pilum
    if (mode === 'attack') {
      outlinedLimb(g, 59, 38, 68, 33, 6, '#e7a67d', ink);
      outlinedLimb(g, 68, 33, 76, 36, 5, '#ffcf94', ink);
      circle(g, 77, 36, 3, '#ffcf94');
      // pilum orizzontale (spinta)
      line(g, 58, 36, 82, 36, '#0b0812', 2.4);
      line(g, 58, 36, 82, 36, '#5c3415', 1.6);
      poly(g, [[60, 34], [48, 36], [60, 38]], steelLt);
      g.strokeStyle = '#93aab8'; g.lineWidth = .8;
      g.beginPath(); g.moveTo(60, 34); g.lineTo(48, 36); g.lineTo(60, 38); g.stroke();
    } else if (mode === 'hurt') {
      outlinedLimb(g, 60, 38, 70, 28, 6, '#e7a67d', ink);
      outlinedLimb(g, 70, 28, 76, 22, 5, '#ffcf94', ink);
      circle(g, 77, 21, 3, '#ffcf94');
      line(g, 56, 60, 74, 10, '#0b0812', 2.2);
      line(g, 56, 60, 74, 10, '#5c3415', 1.4);
      poly(g, [[76, 8], [72, 18], [80, 16]], steelLt);
    } else {
      outlinedLimb(g, 59, 38, 66, 47, 6, '#e7a67d', ink);
      outlinedLimb(g, 66, 47, 68, 58, 5, '#ffcf94', ink);
      circle(g, 68, 59, 3, '#ffcf94');
      // pilum a riposo
      line(g, 68, 8, 66, 84, '#0b0812', 2.2);
      line(g, 68, 8, 66, 84, '#5c3415', 1.4);
      poly(g, [[68, 6], [64, 16], [72, 14]], steelLt);
      line(g, 68, 10, 64, 20, steelDk, .8);
      rect(g, 64, 78, 6, 5, '#8d5016');
    }
    // --- testa + elmo
    const hy = 20;
    rect(g, 44, 30, 12, 6, '#e7a67d');
    // viso
    g.beginPath();
    g.moveTo(40, hy - 3);
    g.bezierCurveTo(42, hy - 12, 58, hy - 13, 62, hy - 4);
    g.bezierCurveTo(64, hy + 3, 61, hy + 9, 56, hy + 10);
    g.bezierCurveTo(49, hy + 11, 43, hy + 7, 40, hy - 3);
    g.closePath();
    g.fillStyle = '#e7a67d'; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2; g.stroke();
    if (mode === 'hurt') {
      // occhi chiusi/sofferenti
      line(g, 44, hy - 1, 50, hy + 1, ink, 1.6);
      line(g, 53, hy + 1, 59, hy - 1, ink, 1.6);
      g.strokeStyle = '#8f154d'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(46, hy + 6); g.lineTo(52, hy + 5); g.lineTo(56, hy + 7); g.stroke();
      // stelle
      for (let i = 0; i < 3; i++) {
        const a = i / 3 * TAU + .4;
        g.fillStyle = '#ffc84b';
        g.fillRect(50 + Math.cos(a) * 13, 6 + Math.sin(a) * 4, 2, 2);
      }
    } else {
      // occhi severi
      rect(g, 44, hy - 1, 6, 3, '#fffdf2');
      rect(g, 53, hy - 1, 6, 3, '#fffdf2');
      rect(g, 47, hy - .5, 2.4, 2.4, '#1a1222');
      rect(g, 55, hy - .5, 2.4, 2.4, '#1a1222');
      line(g, 42, hy - 4, 50, hy - 2, '#38220f', 2);
      line(g, 54, hy - 2, 62, hy - 4, '#38220f', 2);
      // bocca decisa
      line(g, 48, hy + 6, 58, hy + 6, '#8f154d', 1.6);
    }
    // naso
    line(g, 56, hy + 1, 58, hy + 5, '#cb7c5f', 1.2);
    // elmo
    g.beginPath();
    g.moveTo(38, hy - 2);
    g.bezierCurveTo(38, hy - 14, 60, hy - 17, 64, hy - 3);
    g.lineTo(62, hy + 2);
    g.bezierCurveTo(58, hy - 6, 44, hy - 7, 40, hy + 1);
    g.closePath();
    g.fillStyle = steel; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2; g.stroke();
    // riflesso
    poly(g, [[42, hy - 5], [48, hy - 10], [52, hy - 9], [45, hy - 3]], steelLt);
    // paraschiena/cresta
    g.fillStyle = steelDk;
    rect(g, 37, hy - 1, 5, 12, steelDk);
    rect(g, 36, hy + 2, 4, 8, steel);
    // crista rossa
    const cresta = mode === 'walk' ? Math.sin(t * TAU * 2) * 1.2 : 0;
    g.beginPath();
    g.moveTo(41, hy - 8);
    g.quadraticCurveTo(30, hy - 20 + cresta, 34, hy + 4);
    g.quadraticCurveTo(38, hy - 6, 47, hy - 9);
    g.closePath();
    g.fillStyle = red; g.fill();
    g.strokeStyle = ink; g.lineWidth = 1.6; g.stroke();
    g.beginPath();
    g.moveTo(40, hy - 8);
    g.quadraticCurveTo(33, hy - 17 + cresta, 35, hy - 2);
    g.quadraticCurveTo(37, hy - 9, 44, hy - 10);
    g.closePath();
    g.fillStyle = redLt; g.fill();
    // fermaglio cresta
    rect(g, 39, hy - 9, 3, 4, '#ffc84b');
    // guanciali
    poly(g, [[60, hy + 1], [64, hy + 2], [63, hy + 9], [59, hy + 8]], steel);
    g.restore();
    quantize(img);
    return img;
  }

  function paintBoomerTossico(o) {
    const g = canvas(84, 90).getContext('2d');
    const img = g.canvas;
    const mode = o.mode || 'walk';
    const t = o.phase || 0;
    const walk = Math.sin(t * TAU);
    const step = mode === 'walk' ? walk : 0;
    const ink = '#0b0812';
    const suit = '#2f8a3f', suitDk = '#1c562a', suitLt = '#5ac457';
    const skin = '#e7a67d', skinLt = '#ffcf94';
    const grey = '#d4e5ee';
    const puff = (px, py, r, col) => {
      g.fillStyle = col;
      g.beginPath(); g.arc(px, py, r, 0, TAU); g.fill();
    };
    g.save();
    // ciabatte
    for (const [fx, dir] of [[35, 1], [55, -1]]) {
      const off = mode === 'walk' ? step * 4 * dir : 0;
      rect(g, fx - 8 + off, 82, 17, 4, '#5a0c30');
      rect(g, fx - 7 + off, 83, 15, 2, '#9d2833');
      rect(g, fx - 6 + off, 80, 9, 3, '#cbb98e');
    }
    // pantaloni tuta
    outlinedLimb(g, 41, 62, 38 + step * 5, 73, 10, suit, ink);
    outlinedLimb(g, 38 + step * 5, 73, 36 + step * 8, 81, 8, suitDk, ink);
    outlinedLimb(g, 52, 62, 55 - step * 5, 73, 10, suit, ink);
    outlinedLimb(g, 55 - step * 5, 73, 57 - step * 8, 81, 8, suitDk, ink);
    rect(g, 36 + step * 8, 78, 8, 3, '#fffdf2');
    // pancia e felpa
    g.beginPath();
    g.moveTo(27, 39); g.lineTo(58, 39);
    g.bezierCurveTo(66, 46, 65, 62, 58, 68);
    g.lineTo(29, 68);
    g.bezierCurveTo(21, 57, 21, 47, 27, 39);
    g.closePath();
    g.fillStyle = suit; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2.2; g.stroke();
    // pancia col tondo
    ellipse(g, 43, 59, 14, 8, suitLt);
    g.strokeStyle = ink; g.lineWidth = 1.8;
    g.beginPath(); g.arc(43, 59, 14, 0, Math.PI); g.stroke();
    // zip felpa
    rect(g, 42, 39, 2, 25, suitDk);
    rect(g, 42, 39, 1, 25, '#8eef7c');
    rect(g, 30, 65, 26, 3, '#1a1222');
    // stemma tossico sul petto
    circle(g, 33, 46, 5, '#8eef7c');
    circle(g, 33, 46, 3.6, '#1c562a');
    g.fillStyle = '#8eef7c';
    g.beginPath(); g.arc(33, 46, 2, .4, 2.7); g.fill();
    rect(g, 32.3, 44.4, 1.4, 1.4, '#8eef7c');
    // braccio sinistro con straccio/tastiera
    outlinedLimb(g, 28, 45, 22, 54, 6, suit, ink);
    outlinedLimb(g, 22, 54, 24, 62, 5, skin, ink);
    if (mode === 'attack') {
      // braccio destro alzato col telefono
      outlinedLimb(g, 57, 43, 68, 33, 6, suit, ink);
      outlinedLimb(g, 68, 33, 70, 21, 5, skin, ink);
      circle(g, 70, 20, 3.4, skinLt);
      g.save(); g.translate(70, 18); g.rotate(-.18);
      rect(g, -4, -9, 9, 17, '#0b0812');
      rect(g, -3, -8, 7, 15, '#25343f');
      rect(g, -2, -7, 5, 11, '#8eef7c');
      rect(g, -1, -6, 3, 1, '#1c562a');
      g.fillStyle = 'rgba(142,239,124,.3)';
      g.beginPath(); g.arc(0.5, -1, 9, 0, TAU); g.fill();
      g.restore();
      // nube tossica
      puff(64, 8, 8, 'rgba(90,196,87,.85)');
      puff(74, 4, 6, 'rgba(142,239,124,.8)');
      puff(57, 3, 5, 'rgba(47,138,63,.85)');
      puff(70, 12, 4, 'rgba(142,239,124,.6)');
      // fumetto RECLAMO
      rect(g, 55, 0, 26, 8, '#0b0812');
      rect(g, 56, 1, 24, 6, '#8eef7c');
      g.fillStyle = '#1c562a'; g.font = 'bold 4px monospace'; g.textAlign = 'center';
      g.fillText('COMMENTO', 68, 5);
      g.textAlign = 'left';
    } else if (mode === 'hurt') {
      outlinedLimb(g, 57, 43, 66, 51, 6, suit, ink);
      outlinedLimb(g, 66, 51, 70, 44, 5, skin, ink);
      circle(g, 71, 43, 3, skinLt);
      // telefono che vola
      g.save(); g.translate(78, 30); g.rotate(.6);
      rect(g, -3, -6, 6, 12, '#25343f');
      rect(g, -2, -5, 4, 8, '#8eef7c');
      g.restore();
      puff(76, 38, 5, 'rgba(90,196,87,.75)');
      puff(72, 46, 3, 'rgba(142,239,124,.6)');
    } else {
      outlinedLimb(g, 57, 43, 62, 52, 6, suit, ink);
      outlinedLimb(g, 62, 52, 64, 61, 5, skin, ink);
      circle(g, 64, 62, 3, skinLt);
      g.save(); g.translate(65, 64); g.rotate(.1);
      rect(g, -3, -7, 7, 14, '#25343f');
      rect(g, -2, -6, 5, 9, '#8eef7c');
      g.fillStyle = 'rgba(142,239,124,.22)';
      g.beginPath(); g.arc(0, 0, 9, 0, TAU); g.fill();
      g.restore();
    }
    // testa calva con ciuffi
    const hy = 24;
    g.beginPath();
    g.moveTo(30, hy - 3);
    g.bezierCurveTo(31, hy - 12, 50, hy - 13, 55, hy - 4);
    g.bezierCurveTo(58, hy + 3, 54, hy + 10, 48, hy + 11);
    g.bezierCurveTo(41, hy + 12, 33, hy + 7, 30, hy - 3);
    g.closePath();
    g.fillStyle = skin; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2.2; g.stroke();
    circle(g, 30, hy + 1, 3.2, skin);
    circle(g, 55, hy + 1, 3.2, skin);
    // calvizie
    g.beginPath(); g.ellipse(43, hy - 7, 10, 5.5, 0, Math.PI, TAU);
    g.fillStyle = skinLt; g.fill();
    // ciuffi bianchi
    for (let i = 0; i < 4; i++) {
      g.beginPath(); g.arc(30 + i * 1.5, hy - 5, 2.4, 2.9, 6.2); g.fillStyle = grey; g.fill();
      g.beginPath(); g.arc(55 - i * 1.3, hy - 5, 2.3, 3.1, 0); g.fillStyle = grey; g.fill();
    }
    // occhiali
    rect(g, 34, hy - 1, 8, 5, '#0b0812');
    rect(g, 35, hy, 6, 3, 'rgba(142,239,124,.55)');
    rect(g, 46, hy - 1, 8, 5, '#0b0812');
    rect(g, 47, hy, 6, 3, 'rgba(142,239,124,.55)');
    line(g, 42, hy + 1, 46, hy + 1, '#0b0812', 1.4);
    if (mode === 'hurt') {
      line(g, 36, hy + 1, 41, hy + 1, '#c62265', 1);
      line(g, 48, hy + 1, 53, hy + 1, '#c62265', 1);
    }
    // sopracciglia arrabbiate
    line(g, 33, hy - 4, 41, hy - 4, '#d4e5ee', 2.2);
    line(g, 47, hy - 4, 56, hy - 4, '#d4e5ee', 2.2);
    // naso e bocca storta
    line(g, 45, hy + 2, 44, hy + 5, '#cb7c5f', 1.2);
    if (mode === 'attack') {
      g.fillStyle = '#8f154d';
      g.beginPath(); g.ellipse(44, hy + 8, 5, 4, 0, 0, TAU); g.fill();
      rect(g, 42, hy + 6, 5, 2, '#fffdf2');
    } else {
      line(g, 38, hy + 8, 50, hy + 6, '#8f154d', 1.6);
      line(g, 38, hy + 8, 50, hy + 6, '#5a0c30', .6);
    }
    // sigaretta
    line(g, 50, hy + 8, 58, hy + 2, '#fff8e7', 1.8);
    line(g, 55, hy + 4, 58, hy + 2, '#ff845d', 1.8);
    // nuvoletta tossica permanente
    g.fillStyle = 'rgba(142,239,124,.28)';
    g.beginPath(); g.arc(60, hy - 6, 5, 0, TAU); g.fill();
    g.beginPath(); g.arc(64, hy - 10, 3.5, 0, TAU); g.fill();
    g.restore();
    quantize(img);
    return img;
  }

  function paintMeccanico(o) {
    const g = canvas(84, 90).getContext('2d');
    const img = g.canvas;
    const mode = o.mode || 'walk';
    const t = o.phase || 0;
    const walk = Math.sin(t * TAU);
    const step = mode === 'walk' ? walk : 0;
    const bob = mode === 'walk' ? Math.abs(walk) * 1.6 : 0;
    const ink = '#0b0812';
    const blue = '#2d648c', blueLt = '#4f91bd', blueDk = '#1d4467';
    const skin = '#f0b98f', skinDk = '#e7a67d';
    g.save();
    g.translate(0, -bob * .3);
    // scarponi
    for (const [fx, dir] of [[37, 1], [55, -1]]) {
      const off = mode === 'walk' ? step * 5 * dir : 0;
      rect(g, fx - 9 + off, 80, 19, 6, '#2e3a50');
      rect(g, fx - 7 + off, 82, 15, 4, '#48576e');
      rect(g, fx - 8 + off, 84, 17, 2, '#1a1222');
    }
    // gambe tuta blu
    outlinedLimb(g, 41, 60, 38 + step * 6, 72, 10, blue, ink);
    outlinedLimb(g, 38 + step * 6, 72, 36 + step * 10, 82, 8, blueDk, ink);
    outlinedLimb(g, 51, 60, 54 - step * 6, 72, 10, blue, ink);
    outlinedLimb(g, 54 - step * 6, 72, 57 - step * 10, 82, 8, blueDk, ink);
    // fasce catarifrangenti
    rect(g, 34 + step * 10, 76, 6, 2, '#ffc84b');
    rect(g, 56 - step * 10, 76, 5, 2, '#ffc84b');
    // torso tuta
    g.beginPath();
    g.moveTo(31, 36); g.lineTo(56, 36);
    g.quadraticCurveTo(63, 44, 60, 62);
    g.lineTo(29, 62);
    g.quadraticCurveTo(25, 46, 31, 36);
    g.closePath();
    g.fillStyle = blue; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2.2; g.stroke();
    // pettorina
    rect(g, 36, 36, 15, 12, blueLt);
    rect(g, 36, 36, 15, 2, '#9fc1ea');
    // macchie d'olio
    ellipse(g, 52, 51, 4, 2.6, '#1a1222');
    ellipse(g, 34, 55, 3, 2, '#38220f');
    circle(g, 55, 44, 1.6, '#38220f');
    // tasche e zip
    rect(g, 32, 48, 9, 8, blueDk);
    rect(g, 33, 49, 7, 6, blueLt);
    rect(g, 34, 50, 5, 2, '#ffc84b');
    line(g, 47, 48, 47, 60, '#1a1222', 1.2);
    // cintura con chiave inglese appesa
    rect(g, 30, 60, 30, 4, '#1a1222');
    rect(g, 44, 60, 4, 4, '#ffc84b');
    // braccio sinistro con straccio
    outlinedLimb(g, 31, 42, 25, 51, 6, blue, ink);
    outlinedLimb(g, 25, 51, 27, 59, 5, skin, ink);
    circle(g, 27, 60, 3, skin);
    g.save(); g.translate(27, 62); g.rotate(.3);
    rect(g, -4, 0, 8, 6, '#d4e5ee');
    rect(g, -3, 1, 6, 4, '#93aab8');
    rect(g, -1, 2, 2, 2, '#66192a');
    g.restore();
    // braccio destro con chiave inglese
    if (mode === 'attack') {
      outlinedLimb(g, 56, 40, 66, 31, 6, blue, ink);
      outlinedLimb(g, 66, 31, 69, 18, 5, skin, ink);
      circle(g, 69, 17, 3.2, skin);
      g.save(); g.translate(69, 14); g.rotate(-.5);
      line(g, 0, 0, 0, 16, '#93aab8', 3.2);
      line(g, 0, 0, 0, 16, '#d4e5ee', 1.6);
      g.fillStyle = '#93aab8';
      g.beginPath(); g.arc(0, 0, 6, 0, TAU); g.fill();
      g.fillStyle = '#0b0812';
      g.beginPath(); g.arc(0, 0, 3.4, 0, TAU); g.fill();
      g.fillStyle = '#41505f';
      g.fillRect(-6, -1, 3, 2); g.fillRect(3, -1, 3, 2);
      // alone colpo
      g.strokeStyle = '#ffc84b'; g.lineWidth = 1.4;
      g.beginPath(); g.arc(6, 6, 12, -.6, 1.9); g.stroke();
      g.restore();
    } else if (mode === 'hurt') {
      outlinedLimb(g, 56, 40, 67, 48, 6, blue, ink);
      outlinedLimb(g, 67, 48, 74, 41, 5, skin, ink);
      circle(g, 75, 40, 3, skin);
      // chiave che sfugge
      g.save(); g.translate(78, 28); g.rotate(.9);
      line(g, 0, 0, 0, 14, '#93aab8', 3);
      g.beginPath(); g.arc(0, 0, 5, 0, TAU); g.fillStyle = '#93aab8'; g.fill();
      g.beginPath(); g.arc(0, 0, 2.8, 0, TAU); g.fillStyle = '#0b0812'; g.fill();
      g.restore();
      // cappello che vola
      g.save(); g.translate(76, 12); g.rotate(.5);
      rect(g, -8, -3, 16, 5, '#c62265');
      rect(g, -5, -8, 10, 5, '#c62265');
      rect(g, -5, -8, 10, 2, '#ff90b8');
      g.restore();
    } else {
      outlinedLimb(g, 56, 41, 63, 50, 6, blue, ink);
      outlinedLimb(g, 63, 50, 65, 60, 5, skin, ink);
      circle(g, 65, 61, 3, skin);
      g.save(); g.translate(66, 63); g.rotate(.22);
      line(g, 0, 0, 0, 18, '#93aab8', 3.2);
      line(g, 0, 0, 0, 18, '#d4e5ee', 1.6);
      g.fillStyle = '#93aab8'; g.beginPath(); g.arc(0, 0, 5.5, 0, TAU); g.fill();
      g.fillStyle = '#0b0812'; g.beginPath(); g.arc(0, 0, 3, 0, TAU); g.fill();
      g.fillStyle = '#41505f'; g.fillRect(-5.5, -1, 2.6, 2); g.fillRect(3, -1, 2.6, 2);
      g.restore();
    }
    // testa
    const hy = 22;
    g.beginPath();
    g.moveTo(34, hy - 2);
    g.bezierCurveTo(35, hy - 11, 53, hy - 12, 58, hy - 3);
    g.bezierCurveTo(61, hy + 4, 57, hy + 10, 51, hy + 11);
    g.bezierCurveTo(44, hy + 12, 36, hy + 7, 34, hy - 2);
    g.closePath();
    g.fillStyle = skin; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2.2; g.stroke();
    circle(g, 34, hy + 1, 3.2, skinDk);
    circle(g, 58, hy + 1, 3.2, skin);
    // occhi vispi
    rect(g, 38, hy - 1, 6, 3, '#fffdf2');
    rect(g, 49, hy - 1, 6, 3, '#fffdf2');
    rect(g, 41, hy - .5, 2.2, 2.2, '#1a1222');
    rect(g, 51, hy - .5, 2.2, 2.2, '#1a1222');
    line(g, 36, hy - 4, 44, hy - 3, '#5c3415', 1.8);
    line(g, 50, hy - 3, 58, hy - 4, '#5c3415', 1.8);
    // naso e sorriso
    line(g, 52, hy + 1, 54, hy + 4, skinDk, 1.2);
    if (mode === 'hurt') {
      line(g, 42, hy + 8, 52, hy + 7, '#8f154d', 1.4);
      // benda/cerotto
      rect(g, 36, hy + 4, 6, 2, '#fff8e7');
    } else {
      g.strokeStyle = '#8f154d'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(42, hy + 7); g.quadraticCurveTo(47, hy + 10, 53, hy + 6); g.stroke();
      // dente d'oro
      rect(g, 48, hy + 7, 2, 2, '#ffc84b');
    }
    // barba incolta
    g.fillStyle = 'rgba(92,52,21,.5)';
    g.fillRect(36, hy + 8, 14, 3);
    g.fillRect(54, hy + 5, 3, 4);
    // cappellino rosso
    g.beginPath();
    g.moveTo(33, hy - 3);
    g.bezierCurveTo(34, hy - 15, 55, hy - 16, 60, hy - 3);
    g.lineTo(58, hy - 1);
    g.bezierCurveTo(52, hy - 10, 40, hy - 10, 36, hy - 1);
    g.closePath();
    g.fillStyle = '#c62265'; g.fill();
    g.strokeStyle = ink; g.lineWidth = 1.8; g.stroke();
    g.fillStyle = '#8f154d';
    rect(g, 36, hy - 3, 20, 2, '#8f154d');
    // visiera
    g.beginPath();
    g.moveTo(56, hy - 2.5); g.quadraticCurveTo(68, hy - 2, 70, hy + 1);
    g.lineTo(69, hy + 3); g.quadraticCurveTo(62, hy + 1, 56, hy + 1);
    g.closePath();
    g.fillStyle = '#8f154d'; g.fill();
    g.strokeStyle = ink; g.lineWidth = 1.2; g.stroke();
    // logo chiave sul cappello
    g.fillStyle = '#ffc84b'; g.fillRect(42, hy - 9, 5, 2); g.fillRect(46, hy - 9, 2, 4);
    g.restore();
    quantize(img);
    return img;
  }

  function paintCuoco(o) {
    const g = canvas(84, 90).getContext('2d');
    const img = g.canvas;
    const mode = o.mode || 'walk';
    const t = o.phase || 0;
    const walk = Math.sin(t * TAU);
    const step = mode === 'walk' ? walk : 0;
    const bob = mode === 'walk' ? Math.abs(walk) * 1.4 : 0;
    const ink = '#0b0812';
    const white = '#fffdf2', whiteDk = '#d9e0e2', whiteSh = '#b8c4c8';
    const skin = '#f0b98f', skinDk = '#e7a67d';
    g.save();
    g.translate(0, -bob * .2);
    // scarpe
    for (const [fx, dir] of [[38, 1], [54, -1]]) {
      const off = mode === 'walk' ? step * 4 * dir : 0;
      rect(g, fx - 8 + off, 82, 17, 5, '#1a1222');
      rect(g, fx - 6 + off, 83, 13, 3, '#2e3a50');
    }
    // pantaloni a scacchi
    outlinedLimb(g, 41, 62, 39 + step * 5, 74, 11, '#6d7a84', ink);
    outlinedLimb(g, 39 + step * 5, 74, 37 + step * 9, 82, 9, '#59676e', ink);
    outlinedLimb(g, 51, 62, 54 - step * 5, 74, 11, '#6d7a84', ink);
    outlinedLimb(g, 54 - step * 5, 74, 57 - step * 9, 82, 9, '#59676e', ink);
    rect(g, 34 + step * 9, 78, 6, 2, '#fffdf2');
    rect(g, 54 - step * 9, 78, 6, 2, '#fffdf2');
    // pancia e giacca bianca
    g.beginPath();
    g.moveTo(28, 37); g.lineTo(59, 37);
    g.bezierCurveTo(69, 46, 68, 62, 60, 70);
    g.lineTo(29, 70);
    g.bezierCurveTo(21, 58, 20, 46, 28, 37);
    g.closePath();
    g.fillStyle = white; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2.2; g.stroke();
    // ombra giacca
    g.fillStyle = whiteDk;
    g.beginPath(); g.moveTo(53, 38); g.bezierCurveTo(64, 46, 64, 60, 58, 68); g.lineTo(53, 68); g.closePath(); g.fill();
    ellipse(g, 43, 58, 15, 9, white);
    g.strokeStyle = ink; g.lineWidth = 1.6;
    g.beginPath(); g.arc(43, 58, 15, 0, Math.PI); g.stroke();
    // doppio petto e bottoni
    line(g, 34, 38, 30, 64, whiteSh, 1.4);
    line(g, 36, 38, 33, 64, whiteSh, 1.4);
    for (let i = 0; i < 4; i++) {
      circle(g, 34, 44 + i * 6, 1.5, '#1a1222');
      circle(g, 39, 44 + i * 6, 1.5, '#1a1222');
    }
    // foulard rosso
    poly(g, [[38, 36], [50, 36], [46, 44], [42, 44]], '#c62265');
    poly(g, [[38, 36], [44, 36], [41, 40]], '#ff90b8');
    poly(g, [[46, 42], [50, 37], [52, 46], [48, 50]], '#c62265');
    // grembiule
    rect(g, 38, 62, 14, 10, '#f5e9cc');
    rect(g, 38, 62, 14, 2, '#e6d5b0');
    // braccio sinistro con mestolo
    outlinedLimb(g, 29, 42, 22, 52, 6, white, ink);
    outlinedLimb(g, 22, 52, 24, 61, 5, skin, ink);
    circle(g, 24, 62, 3, skin);
    g.save(); g.translate(24, 64); g.rotate(.35);
    line(g, 0, 0, 0, 14, '#93aab8', 2.2);
    g.fillStyle = '#93aab8';
    g.beginPath(); g.arc(0, 15, 4, 0, Math.PI); g.fill();
    g.strokeStyle = ink; g.lineWidth = 1;
    g.beginPath(); g.arc(0, 15, 4, 0, Math.PI); g.stroke();
    g.restore();
    // braccio destro con padella (o pizza in attacco)
    if (mode === 'attack') {
      outlinedLimb(g, 58, 40, 68, 31, 6, white, ink);
      outlinedLimb(g, 68, 31, 70, 20, 5, skin, ink);
      circle(g, 70, 19, 3.2, skin);
      g.save(); g.translate(73, 17); g.rotate(-.35);
      // padella
      g.fillStyle = '#1a1222';
      g.beginPath(); g.ellipse(0, 0, 12, 5.5, 0, 0, TAU); g.fill();
      g.fillStyle = '#41505f';
      g.beginPath(); g.ellipse(0, -1, 10.5, 4.5, 0, 0, TAU); g.fill();
      g.fillStyle = '#59676e';
      g.beginPath(); g.ellipse(-1, -2, 8, 3, 0, 0, TAU); g.fill();
      rect(g, 10, -2, 12, 3, '#1a1222');
      // pizza che vola
      g.save(); g.translate(28, -8); g.rotate(.2);
      g.fillStyle = '#ffc84b'; g.beginPath(); g.arc(0, 0, 7, 0, TAU); g.fill();
      g.fillStyle = '#f5e9cc'; g.beginPath(); g.arc(0, 0, 6, 0, TAU); g.fill();
      g.fillStyle = '#ff845d'; g.beginPath(); g.arc(-2, -2, 2, 0, TAU); g.fill();
      g.beginPath(); g.arc(3, 1, 2.2, 0, TAU); g.fill();
      g.beginPath(); g.arc(-1, 3, 1.6, 0, TAU); g.fill();
      g.fillStyle = '#2f8a3f'; g.fillRect(-3, 1, 2, 1); g.fillRect(2, -3, 1, 2);
      g.restore();
      g.restore();
    } else if (mode === 'hurt') {
      outlinedLimb(g, 58, 41, 67, 50, 6, white, ink);
      outlinedLimb(g, 67, 50, 74, 45, 5, skin, ink);
      circle(g, 75, 44, 3, skin);
      g.save(); g.translate(78, 32); g.rotate(.7);
      g.fillStyle = '#41505f'; g.beginPath(); g.ellipse(0, 0, 8, 4, 0, 0, TAU); g.fill();
      rect(g, 7, -1, 9, 2.6, '#1a1222');
      g.restore();
      // cappello che salta
      g.save(); g.translate(70, 8); g.rotate(.4);
      rect(g, -10, 0, 20, 4, white);
      rect(g, -7, -9, 14, 10, white);
      rect(g, -7, -9, 14, 2, '#fff8e7');
      g.strokeStyle = ink; g.lineWidth = 1;
      g.strokeRect(-7, -9, 14, 10);
      g.restore();
    } else {
      outlinedLimb(g, 58, 41, 64, 51, 6, white, ink);
      outlinedLimb(g, 64, 51, 66, 60, 5, skin, ink);
      circle(g, 66, 61, 3, skin);
      g.save(); g.translate(67, 63); g.rotate(.25);
      g.fillStyle = '#1a1222'; g.beginPath(); g.ellipse(0, 0, 10, 5, 0, 0, TAU); g.fill();
      g.fillStyle = '#41505f'; g.beginPath(); g.ellipse(0, -1, 8.5, 4, 0, 0, TAU); g.fill();
      rect(g, 8, -1, 11, 2.6, '#1a1222');
      g.restore();
    }
    // testa con baffi
    const hy = 23;
    g.beginPath();
    g.moveTo(31, hy - 2);
    g.bezierCurveTo(32, hy - 12, 51, hy - 13, 56, hy - 3);
    g.bezierCurveTo(59, hy + 4, 55, hy + 10, 49, hy + 11);
    g.bezierCurveTo(41, hy + 12, 33, hy + 7, 31, hy - 2);
    g.closePath();
    g.fillStyle = skin; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2.2; g.stroke();
    circle(g, 31, hy + 1, 3.2, skinDk);
    circle(g, 56, hy + 1, 3.2, skin);
    // occhi
    if (mode === 'hurt') {
      line(g, 35, hy, 41, hy + 2, ink, 1.6);
      line(g, 47, hy + 2, 53, hy, ink, 1.6);
    } else {
      rect(g, 35, hy - 1, 6, 3, '#fffdf2');
      rect(g, 46, hy - 1, 6, 3, '#fffdf2');
      rect(g, 38, hy - .5, 2.2, 2.2, '#1a1222');
      rect(g, 48, hy - .5, 2.2, 2.2, '#1a1222');
      line(g, 33, hy - 4, 41, hy - 3, '#38220f', 2);
      line(g, 46, hy - 3, 54, hy - 4, '#38220f', 2);
    }
    // naso tondo
    ellipse(g, 47, hy + 3, 3.4, 2.8, skinDk);
    g.strokeStyle = ink; g.lineWidth = 1;
    g.beginPath(); g.arc(47, hy + 3, 3.4, 0, TAU); g.stroke();
    // baffi
    g.fillStyle = '#38220f';
    g.beginPath();
    g.moveTo(36, hy + 6); g.quadraticCurveTo(42, hy + 3, 46, hy + 6);
    g.quadraticCurveTo(52, hy + 3, 58, hy + 6);
    g.quadraticCurveTo(52, hy + 9, 46, hy + 7);
    g.quadraticCurveTo(42, hy + 9, 36, hy + 6);
    g.fill();
    if (mode === 'attack') {
      g.fillStyle = '#8f154d';
      g.beginPath(); g.ellipse(47, hy + 10, 3, 2.4, 0, 0, TAU); g.fill();
    } else {
      line(g, 42, hy + 10, 52, hy + 10, '#8f154d', 1.4);
    }
    // cappello da chef
    g.beginPath();
    g.moveTo(31, hy - 3);
    g.bezierCurveTo(28, hy - 14, 36, hy - 20, 43, hy - 16);
    g.bezierCurveTo(46, hy - 23, 58, hy - 21, 58, hy - 14);
    g.bezierCurveTo(64, hy - 15, 65, hy - 5, 58, hy - 3);
    g.closePath();
    g.fillStyle = white; g.fill();
    g.strokeStyle = ink; g.lineWidth = 1.8; g.stroke();
    // pieghe
    g.strokeStyle = whiteSh; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(38, hy - 8); g.quadraticCurveTo(40, hy - 14, 45, hy - 13); g.stroke();
    g.beginPath(); g.moveTo(47, hy - 10); g.quadraticCurveTo(52, hy - 16, 56, hy - 12); g.stroke();
    rect(g, 31, hy - 5, 26, 3, whiteDk);
    rect(g, 31, hy - 5, 26, 1, '#fff8e7');
    g.restore();
    quantize(img);
    return img;
  }

  /* =========================================================
     v2.0 — CESARE (boss Roma): 240x300, piedi a y=292.
     Anchor: ax=120, ay=292. frame: idle[2], attack, hurt, rage.
     ========================================================= */
  const CESARE_W = 240, CESARE_H = 300;
  function paintCesare(o) {
    const c = canvas(CESARE_W, CESARE_H), g = c.getContext('2d');
    const mode = o.mode || 'idle';
    const t = o.phase || 0;
    const ink = '#0b0812';
    const toga = '#fffdf2', togaSh = '#f0e4cf', togaDk = '#d8c7a5';
    const purple = '#6e3e8f', purpleLt = '#9c62c8';
    const skin = '#f6c7a3', skinDk = '#e7a67d', skinLine = '#cb7c5f';
    const grey = '#d4e5ee', greyDk = '#93aab8';
    const gold = '#ffc84b', goldDk = '#efa72f', leaf = '#2f8a3f';
    const breath = mode === 'idle' ? Math.sin(t * TAU) : 0;
    const sway = Math.sin(t * TAU + .7);
    const rage = mode === 'rage';
    const attack = mode === 'attack';
    const hurt = mode === 'hurt';
    const bob = rage ? -3 : hurt ? 3 : Math.round(breath * 1.5);

    g.save();
    g.translate(0, bob);
    if (hurt) g.translate(5, 0);

    // alone (rage / attack)
    if (rage || attack) {
      const col = rage ? 'rgba(198,34,101,.2)' : 'rgba(255,200,75,.16)';
      g.fillStyle = col;
      g.beginPath(); g.arc(CESARE_W / 2, 170, 118, 0, TAU); g.fill();
      g.fillStyle = rage ? 'rgba(255,91,157,.12)' : 'rgba(255,226,148,.1)';
      g.beginPath(); g.arc(CESARE_W / 2, 170, 92, 0, TAU); g.fill();
    }

    // ombra a terra
    g.fillStyle = 'rgba(11,8,18,.35)';
    g.beginPath(); g.ellipse(120, 292, 52, 7, 0, 0, TAU); g.fill();

    // anelli d'aura in rage (dietro al corpo)
    if (rage) {
      g.strokeStyle = 'rgba(255,61,110,.55)'; g.lineWidth = 3;
      g.beginPath(); g.arc(120, 160, 104, 0, TAU); g.stroke();
      g.strokeStyle = 'rgba(255,200,75,.3)'; g.lineWidth = 1.4;
      g.beginPath(); g.arc(120, 160, 116, 0, TAU); g.stroke();
      g.strokeStyle = 'rgba(198,34,101,.35)'; g.lineWidth = 2;
      g.beginPath(); g.arc(120, 160, 92, .3, Math.PI * 1.4); g.stroke();
    }

    // ---- retro della toga (mantello)
    g.beginPath();
    g.moveTo(78, 120);
    g.bezierCurveTo(56, 150, 48, 210, 52, 282);
    g.lineTo(188, 282);
    g.bezierCurveTo(192, 210, 184, 150, 162, 120);
    g.closePath();
    g.fillStyle = togaDk; g.fill();

    // ---- gambe e sandali
    const legSway = hurt ? 4 : 0;
    for (const [lx, dir] of [[104, 1], [136, -1]]) {
      g.save();
      g.translate(lx + legSway * dir, 0);
      // polpaccio
      g.fillStyle = skin;
      g.fillRect(-9, 236, 18, 46);
      g.fillStyle = skinDk;
      g.fillRect(1, 236, 8, 46);
      // caligae: cinghie
      g.strokeStyle = '#5c3415'; g.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        g.beginPath(); g.moveTo(-9, 244 + i * 10); g.lineTo(9, 248 + i * 10); g.stroke();
      }
      // suola e piede (visibili sotto la falda della toga)
      rect(g, -13, 280, 27, 10, '#8d5016');
      rect(g, -13, 286, 27, 5, '#5c3415');
      rect(g, -12, 281, 25, 4, '#c87b1e');
      rect(g, -8, 292, 6, 2, '#e7a67d');
      rect(g, 0, 292, 6, 2, '#e7a67d');
      rect(g, 7, 292, 5, 2, '#e7a67d');
      g.restore();
    }

    // ---- toga bianca: falda posteriore, corpo, drappeggio, balza
    // falda dietro la spalla sinistra
    g.beginPath();
    g.moveTo(94, 114);
    g.bezierCurveTo(72, 138, 66, 196, 70, 258);
    g.lineTo(86, 266);
    g.bezierCurveTo(80, 206, 84, 152, 100, 120);
    g.closePath();
    g.fillStyle = togaSh; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2; g.stroke();
    // corpo della toga
    g.beginPath();
    g.moveTo(94, 112);
    g.bezierCurveTo(76, 126, 70, 176, 74, 234);
    g.bezierCurveTo(80, 256, 106, 268, 120, 268);
    g.bezierCurveTo(134, 268, 160, 256, 166, 234);
    g.bezierCurveTo(170, 176, 164, 126, 146, 112);
    g.bezierCurveTo(132, 102, 108, 102, 94, 112);
    g.closePath();
    g.fillStyle = toga; g.fill();
    g.strokeStyle = ink; g.lineWidth = 3; g.stroke();
    // pieghe verticali
    g.strokeStyle = togaSh; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(100, 128); g.bezierCurveTo(90, 168, 88, 218, 94, 252); g.stroke();
    g.beginPath(); g.moveTo(142, 126); g.bezierCurveTo(154, 168, 156, 218, 150, 254); g.stroke();
    g.strokeStyle = '#cbb692'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(104, 184); g.quadraticCurveTo(116, 194, 130, 184); g.stroke();
    g.beginPath(); g.moveTo(96, 218); g.quadraticCurveTo(112, 228, 134, 218); g.stroke();
    g.beginPath(); g.moveTo(94, 244); g.quadraticCurveTo(112, 254, 146, 244); g.stroke();
    // ombra laterale destra
    g.fillStyle = 'rgba(203,182,146,.32)';
    g.beginPath(); g.moveTo(146, 118); g.bezierCurveTo(166, 150, 168, 198, 162, 244); g.lineTo(154, 254); g.bezierCurveTo(156, 198, 152, 150, 138, 118); g.closePath(); g.fill();
    // drappeggio diagonale sul torso (toga avvolta)
    g.beginPath();
    g.moveTo(96, 118);
    g.bezierCurveTo(114, 140, 140, 166, 156, 188);
    g.lineTo(148, 198);
    g.bezierCurveTo(132, 176, 108, 150, 90, 130);
    g.closePath();
    g.fillStyle = togaSh; g.fill();
    g.strokeStyle = '#cbb692'; g.lineWidth = 1;
    g.stroke();
    // balza porpora in basso
    g.beginPath();
    g.moveTo(74, 234);
    g.bezierCurveTo(80, 256, 106, 268, 120, 268);
    g.bezierCurveTo(134, 268, 160, 256, 166, 234);
    g.lineTo(164, 250);
    g.bezierCurveTo(152, 264, 134, 272, 120, 272);
    g.bezierCurveTo(106, 272, 88, 264, 76, 250);
    g.closePath();
    g.fillStyle = purple; g.fill();
    g.fillStyle = purpleLt;
    g.fillRect(84, 246, 20, 2.6);
    g.fillRect(136, 246, 20, 2.6);
    g.fillStyle = gold;
    g.fillRect(116, 244, 9, 3);
    // fascia in vita
    g.fillStyle = purple;
    g.fillRect(84, 172, 72, 12);
    g.fillStyle = purpleLt;
    g.fillRect(84, 172, 72, 2);
    g.fillStyle = gold;
    g.fillRect(116, 170, 9, 16);
    g.fillRect(111, 175, 19, 3);
    g.fillStyle = '#fff3a6';
    g.fillRect(118, 172, 5, 5);
    // latus clavus (banda porpora sul petto)
    g.fillStyle = purple;
    g.beginPath();
    g.moveTo(111, 118); g.lineTo(124, 118); g.lineTo(126, 172); g.lineTo(113, 172);
    g.closePath(); g.fill();
    g.fillStyle = purpleLt; g.fillRect(113, 120, 3, 50);
    // bordo porpora sul collo (lato toga)
    g.beginPath();
    g.moveTo(96, 110);
    g.quadraticCurveTo(120, 132, 144, 110);
    g.quadraticCurveTo(138, 144, 120, 148);
    g.quadraticCurveTo(102, 144, 96, 110);
    g.closePath();
    g.fillStyle = purple; g.fill();
    g.beginPath();
    g.moveTo(101, 114);
    g.quadraticCurveTo(120, 128, 139, 114);
    g.quadraticCurveTo(132, 136, 120, 139);
    g.quadraticCurveTo(108, 136, 101, 114);
    g.closePath();
    g.fillStyle = togaSh; g.fill();
    // fibula d'oro sulla spalla sinistra
    circle(g, 96, 118, 6, gold);
    circle(g, 96, 118, 4, goldDk);
    circle(g, 96, 118, 2.4, '#8f154d');
    g.strokeStyle = ink; g.lineWidth = 1.2;
    g.beginPath(); g.arc(96, 118, 6, 0, TAU); g.stroke();

    // ---- braccio sinistro (scroll)
    const scrollArm = (mode === 'attack') ? [[92, 126], [64, 98], [54, 74], 70, 62] : [[92, 126], [66, 156], [58, 184], 52, 196];
    outlinedLimb(g, scrollArm[0][0], scrollArm[0][1], scrollArm[1][0], scrollArm[1][1], 13, toga, ink);
    outlinedLimb(g, scrollArm[1][0], scrollArm[1][1], scrollArm[2][0], scrollArm[2][1], 11, toga, ink);
    // avambraccio nudo
    outlinedLimb(g, scrollArm[2][0], scrollArm[2][1], scrollArm[3], scrollArm[4], 9, skin, ink);
    circle(g, scrollArm[3], scrollArm[4], 7, skin);
    g.strokeStyle = skinLine; g.lineWidth = 1.2;
    g.beginPath(); g.arc(scrollArm[3], scrollArm[4], 7, 0, TAU); g.stroke();
    // rotolo di direttive
    g.save();
    g.translate(scrollArm[3] - 6, scrollArm[4] + (mode === 'attack' ? -6 : 2));
    g.rotate(mode === 'attack' ? -.7 : .18);
    rect(g, -4, -18, 26, 36, '#f5e9cc');
    rect(g, -4, -18, 26, 4, '#e6d5b0');
    rect(g, -4, 14, 26, 4, '#e6d5b0');
    rect(g, -6, -18, 5, 36, '#8d5016');
    rect(g, 16, -18, 5, 36, '#8d5016');
    g.fillStyle = '#8b7f72'; g.font = 'bold 5px monospace'; g.textAlign = 'center';
    g.fillText('DIRETTIVA', 9, -2);
    g.fillText('N. MMXXIV', 9, 7);
    g.fillStyle = '#c62265'; g.fillRect(3, 10, 12, 3);
    g.textAlign = 'left';
    g.restore();

    // ---- braccio destro con timbro gigante
    const armUp = attack || rage;
    if (armUp) {
      outlinedLimb(g, 146, 126, 180, 92, 13, toga, ink);
      outlinedLimb(g, 180, 92, 192, 58, 11, toga, ink);
      outlinedLimb(g, 192, 58, 197, 34, 9, skin, ink);
      circle(g, 198, 30, 7, skin);
      // manico del timbro
      g.save(); g.translate(201, 22); g.rotate(.16);
      rect(g, -5, -34, 10, 38, '#8d5016');
      rect(g, -5, -34, 3, 38, '#c87b1e');
      rect(g, -9, -6, 18, 8, '#5c3415');
      rect(g, -16, 2, 34, 14, '#0b0812');
      rect(g, -15, 3, 32, 10, '#c62265');
      rect(g, -13, 5, 28, 5, '#8f154d');
      g.fillStyle = '#ffe7c6'; g.font = 'bold 6px monospace'; g.textAlign = 'center';
      g.fillText('TIMBRA', 1, 10);
      g.textAlign = 'left';
      g.restore();
      // fogli che volano
      for (let i = 0; i < 5; i++) {
        const px = 50 + i * 34 + Math.sin(t * TAU + i) * 6;
        const py = 20 + (i % 3) * 22;
        g.save(); g.translate(px, py); g.rotate(-.5 + i * .28);
        rect(g, -8, -11, 17, 23, '#fff8e7');
        rect(g, -8, -11, 17, 2, '#e6d5b0');
        rect(g, -6, -6, 12, 1, '#8b7f72');
        rect(g, -6, -3, 9, 1, '#8b7f72');
        rect(g, 2, 4, 6, 4, '#c62265');
        g.restore();
      }
    } else if (hurt) {
      outlinedLimb(g, 146, 126, 170, 146, 13, toga, ink);
      outlinedLimb(g, 170, 146, 176, 168, 11, toga, ink);
      outlinedLimb(g, 176, 168, 182, 188, 9, skin, ink);
      circle(g, 182, 190, 7, skin);
      g.save(); g.translate(190, 206); g.rotate(.8);
      rect(g, -5, -30, 10, 32, '#8d5016');
      rect(g, -16, 1, 34, 13, '#c62265');
      rect(g, -14, 3, 30, 8, '#8f154d');
      g.restore();
      // rotolo caduto
      g.save(); g.translate(208, 266); g.rotate(.5);
      rect(g, -3, -13, 20, 26, '#f5e9cc');
      rect(g, -5, -13, 4, 26, '#8d5016');
      g.restore();
    } else {
      outlinedLimb(g, 146, 126, 172, 154, 13, toga, ink);
      outlinedLimb(g, 172, 154, 178, 180, 11, toga, ink);
      outlinedLimb(g, 178, 180, 182, 202, 9, skin, ink);
      circle(g, 182, 204, 7, skin);
      g.save(); g.translate(184, 220); g.rotate(.12);
      rect(g, -5, -40, 11, 42, '#8d5016');
      rect(g, -5, -40, 4, 42, '#c87b1e');
      rect(g, -5, -40, 11, 3, '#5c3415');
      rect(g, -12, -2, 25, 8, '#5c3415');
      rect(g, -19, 6, 39, 15, '#0b0812');
      rect(g, -18, 7, 37, 12, '#c62265');
      rect(g, -16, 9, 33, 6, '#8f154d');
      rect(g, -16, 9, 33, 2, '#ff90b8');
      g.fillStyle = '#ffe7c6'; g.font = 'bold 6px monospace'; g.textAlign = 'center';
      g.fillText('TIMBRA', 0, 16);
      g.textAlign = 'left';
      g.restore();
    }

    // ---- collo e testa
    rect(g, 108, 96, 24, 14, skinDk);
    const headY = 72 + (hurt ? 5 : 0);
    // capelli grigi radi dietro (calvizie incipiente)
    g.fillStyle = greyDk;
    g.beginPath(); g.ellipse(120, headY - 6, 23, 24, 0, Math.PI * 1.02, TAU * .98); g.fill();
    g.beginPath(); g.ellipse(97, headY + 3, 6, 13, .25, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(143, headY + 3, 6, 13, -.25, 0, TAU); g.fill();
    // viso
    g.beginPath();
    g.moveTo(96, headY - 10);
    g.bezierCurveTo(98, headY - 28, 142, headY - 30, 146, headY - 8);
    g.bezierCurveTo(148, headY + 8, 142, headY + 24, 128, headY + 28);
    g.bezierCurveTo(108, headY + 32, 94, headY + 18, 96, headY - 10);
    g.closePath();
    g.fillStyle = skin; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2.6; g.stroke();
    // orecchie
    circle(g, 95, headY + 2, 6, skin);
    circle(g, 146, headY + 2, 6, skinDk);
    g.strokeStyle = ink; g.lineWidth = 1.4;
    g.beginPath(); g.arc(95, headY + 2, 6, 0, TAU); g.stroke();
    g.beginPath(); g.arc(146, headY + 2, 6, 0, TAU); g.stroke();
    // tempie grigie e attaccatura alta
    g.fillStyle = grey;
    g.beginPath(); g.ellipse(98, headY + 1, 4.4, 8, .2, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(142, headY + 1, 4.4, 8, -.2, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(147,170,184,.75)'; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(104, headY - 14); g.quadraticCurveTo(120, headY - 19, 136, headY - 14); g.stroke();
    g.beginPath(); g.moveTo(101, headY - 10); g.quadraticCurveTo(110, headY - 13, 116, headY - 12); g.stroke();
    g.beginPath(); g.moveTo(124, headY - 12); g.quadraticCurveTo(132, headY - 13, 139, headY - 10); g.stroke();
    // sopracciglia cesaree
    g.strokeStyle = greyDk; g.lineWidth = 3;
    g.beginPath(); g.moveTo(102, headY - 4); g.quadraticCurveTo(110, headY - 7, 118, headY - 4); g.stroke();
    g.beginPath(); g.moveTo(124, headY - 4); g.quadraticCurveTo(132, headY - 7, 140, headY - 5); g.stroke();
    // occhi annoiati/snob
    if (rage) {
      g.fillStyle = '#ff3d6e';
      g.fillRect(104, headY - 1, 12, 5);
      g.fillRect(126, headY - 1, 12, 5);
      g.fillStyle = '#fff8e7';
      g.fillRect(107, headY + 1, 6, 2);
      g.fillRect(129, headY + 1, 6, 2);
    } else if (hurt) {
      line(g, 103, headY, 114, headY + 3, ink, 2.4);
      line(g, 128, headY + 3, 139, headY, ink, 2.4);
    } else {
      g.fillStyle = '#fffdf2';
      g.beginPath(); g.ellipse(111, headY + 1, 8, 4.5, 0, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(133, headY + 1, 8, 4.5, 0, 0, TAU); g.fill();
      g.fillStyle = '#4a678f';
      g.beginPath(); g.ellipse(112, headY + 2, 4, 3.6, 0, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(134, headY + 2, 4, 3.6, 0, 0, TAU); g.fill();
      g.fillStyle = ink;
      g.beginPath(); g.arc(112, headY + 2, 2, 0, TAU); g.fill();
      g.beginPath(); g.arc(134, headY + 2, 2, 0, TAU); g.fill();
      // palpebre pesanti
      g.strokeStyle = skinLine; g.lineWidth = 2;
      g.beginPath(); g.moveTo(102, headY - 3); g.lineTo(119, headY - 2); g.stroke();
      g.beginPath(); g.moveTo(124, headY - 2); g.lineTo(141, headY - 3); g.stroke();
      g.fillStyle = 'rgba(240,228,207,.35)';
      g.fillRect(104, headY - 1, 15, 2);
      g.fillRect(126, headY - 1, 15, 2);
    }
    // naso aquilino
    g.strokeStyle = skinLine; g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(120, headY + 1);
    g.quadraticCurveTo(126, headY + 9, 122, headY + 14);
    g.quadraticCurveTo(118, headY + 16, 114, headY + 14);
    g.stroke();
    g.fillStyle = skinDk;
    g.beginPath(); g.ellipse(122, headY + 15, 5, 3, .2, 0, TAU); g.fill();
    // bocca: sorriso snob/storto
    if (attack) {
      g.strokeStyle = '#8f154d'; g.lineWidth = 2.4;
      g.beginPath(); g.moveTo(112, headY + 22); g.quadraticCurveTo(123, headY + 26, 134, headY + 20); g.stroke();
      g.fillStyle = '#8f154d';
      g.beginPath(); g.ellipse(124, headY + 23, 5, 3, 0, 0, TAU); g.fill();
    } else if (hurt) {
      g.strokeStyle = '#8f154d'; g.lineWidth = 2.2;
      g.beginPath(); g.moveTo(112, headY + 24); g.quadraticCurveTo(123, headY + 20, 134, headY + 23); g.stroke();
    } else {
      g.strokeStyle = '#9d2833'; g.lineWidth = 2.2;
      g.beginPath(); g.moveTo(111, headY + 21); g.quadraticCurveTo(122, headY + 25, 133, headY + 19); g.stroke();
      g.fillStyle = 'rgba(159,40,51,.35)';
      g.beginPath(); g.ellipse(122, headY + 23, 9, 2, .08, 0, TAU); g.fill();
    }
    // rughe e guance
    g.strokeStyle = 'rgba(203,124,95,.6)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(104, headY + 8); g.quadraticCurveTo(108, headY + 11, 108, headY + 14); g.stroke();
    g.beginPath(); g.moveTo(140, headY + 8); g.quadraticCurveTo(136, headY + 11, 136, headY + 14); g.stroke();
    g.beginPath(); g.moveTo(110, headY + 18); g.lineTo(114, headY + 19); g.stroke();
    g.beginPath(); g.moveTo(132, headY + 18); g.lineTo(128, headY + 19); g.stroke();
    // ---- corona d'alloro
    g.save();
    g.translate(120, headY - 10);
    for (let side of [-1, 1]) {
      g.save();
      g.scale(side, 1);
      g.strokeStyle = goldDk; g.lineWidth = 3;
      g.beginPath(); g.arc(0, 0, 30, Math.PI * .78, Math.PI * 1.98); g.stroke();
      g.strokeStyle = gold; g.lineWidth = 1.4;
      g.beginPath(); g.arc(0, 0, 30, Math.PI * .78, Math.PI * 1.98); g.stroke();
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * .84 + i * .17;
        const lx = Math.cos(a) * 30, ly = Math.sin(a) * 30;
        g.save(); g.translate(lx, ly); g.rotate(a + Math.PI / 2);
        g.fillStyle = leaf;
        g.beginPath(); g.ellipse(0, -3, 3.4, 6.6, 0, 0, TAU); g.fill();
        g.fillStyle = i % 2 ? '#3f9a4d' : '#5ac457';
        g.beginPath(); g.ellipse(-1, -4, 1.6, 4, 0, 0, TAU); g.fill();
        g.restore();
      }
      g.restore();
    }
    // foglie centrali
    g.fillStyle = leaf;
    g.beginPath(); g.ellipse(0, -30, 4, 7, 0, 0, TAU); g.fill();
    g.fillStyle = '#5ac457';
    g.beginPath(); g.ellipse(-1, -31, 2, 4.4, 0, 0, TAU); g.fill();
    g.restore();

    // ---- ciuffo sulla nuca
    if (!rage) {
      g.fillStyle = grey;
      g.beginPath(); g.ellipse(134, headY - 18, 8, 4, -.3, 0, TAU); g.fill();
      g.fillStyle = greyDk;
      g.beginPath(); g.ellipse(138, headY - 16, 4, 2.4, -.3, 0, TAU); g.fill();
    } else {
      // capelli scompigliati in rage
      g.fillStyle = grey;
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI * .8 + i * .35;
        g.beginPath();
        g.moveTo(120 + Math.cos(a) * 24, headY - 6 + Math.sin(a) * 26);
        g.lineTo(120 + Math.cos(a) * 40, headY - 6 + Math.sin(a) * 44);
        g.lineTo(120 + Math.cos(a + .12) * 24, headY - 6 + Math.sin(a + .12) * 26);
        g.closePath(); g.fill();
      }
      // fogli che bruciano
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * TAU + t * TAU;
        const px = 120 + Math.cos(a) * (86 + (i % 3) * 16);
        const py = 150 + Math.sin(a) * (70 + (i % 2) * 20);
        g.save(); g.translate(px, py); g.rotate(a);
        rect(g, -6, -8, 12, 17, '#fff8e7');
        g.fillStyle = '#ff845d'; g.fillRect(-5, -2, 10, 4);
        g.fillStyle = '#c62265'; g.fillRect(-4, 4, 7, 3);
        g.restore();
      }
    }

    g.restore();
    quantize(c);
    return c;
  }

  A.buildRomaBoss = function () {
    const idle = [];
    for (let i = 0; i < 2; i++) idle.push(paintCesare({ mode: 'idle', phase: i / 2 }));
    const frames = {
      idle,
      attack: paintCesare({ mode: 'attack', phase: 0 }),
      hurt: paintCesare({ mode: 'hurt', phase: 0 }),
      rage: paintCesare({ mode: 'rage', phase: 0 })
    };
    A.cesareFrames = frames;
    A.cesare = { w: CESARE_W, h: CESARE_H, ax: 120, ay: 292, frames };
  };

  /* =========================================================
     v2.0 — SFONDI/SPRITE ROMA: builders (chiamati dal boot)
     ========================================================= */
  A.buildRomaEnemies = function () {
    const painters = {
      centurione: paintCenturione,
      boomerTossico: paintBoomerTossico,
      meccanico: paintMeccanico,
      cuoco: paintCuoco
    };
    for (const [type, paint] of Object.entries(painters)) {
      const frames = [];
      for (let i = 0; i < 4; i++) frames.push(paint({ mode: 'walk', phase: i / 4 }));
      frames.push(paint({ mode: 'attack', phase: .2 }));
      frames.push(paint({ mode: 'hurt', phase: 0 }));
      A.enemyFrames[type] = frames;
    }
  };

  function buildGroundRoma() {
    const c = canvas(320, 58), g = c.getContext('2d');
    const rand = mulberry32(4040);
    // cordolo in travertino
    g.fillStyle = '#e6d5b0'; g.fillRect(0, 0, 320, 3);
    g.fillStyle = '#cbb692'; g.fillRect(0, 3, 320, 5);
    g.fillStyle = '#e6d5b0'; g.fillRect(0, 3, 320, 1);
    g.fillStyle = '#a89671'; g.fillRect(0, 8, 320, 1);
    // sampietrini (porfido)
    sampietriniBand(g, 320, 9, 48, rand, '#8b7f72');
    // disegno a ventaglio in porfido chiaro
    g.strokeStyle = 'rgba(255,244,220,.16)'; g.lineWidth = 1;
    for (let x = 20; x < 320; x += 64) {
      g.beginPath(); g.arc(x, 46, 26, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
      g.beginPath(); g.arc(x, 46, 32, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    }
    // toppe e macchie
    for (let i = 0; i < 26; i++) {
      g.fillStyle = rand() > .5 ? 'rgba(255,244,220,.13)' : 'rgba(50,42,34,.15)';
      g.fillRect(rand() * 316, 11 + rand() * 34, 1 + rand() * 3, 1);
    }
    // chiusino
    ellipse(g, 244, 28, 13, 5, '#4a4440');
    ellipse(g, 244, 28, 11.5, 4, '#5d5650');
    ellipse(g, 244, 27.5, 10, 3.2, '#6b6459');
    for (let i = 0; i < 3; i++) { g.fillStyle = '#4a4440'; g.fillRect(238 + i * 5, 25, 2, 6); }
    g.strokeStyle = '#3d3733'; g.lineWidth = 1;
    g.beginPath(); g.arc(244, 28, 12, 0, TAU); g.stroke();
    // tombino quadrato
    rect(g, 84, 22, 22, 14, '#4a4440');
    rect(g, 86, 24, 18, 10, '#5d5650');
    for (let i = 0; i < 3; i++) rect(g, 88 + i * 5, 25, 2, 8, '#3d3733');
    // cordolo scuro in basso
    g.fillStyle = '#6c5d45'; g.fillRect(0, 48, 320, 4);
    g.fillStyle = '#5a4b38'; g.fillRect(0, 52, 320, 6);
    g.fillStyle = '#4a3d2e'; g.fillRect(0, 54, 320, 4);
    // erba tra le pietre
    for (let i = 0; i < 4; i++) {
      const x = 40 + rand() * 240;
      g.fillStyle = '#3f7a3f';
      g.fillRect(x, 44, 1, 3); g.fillRect(x + 2, 43, 1, 4);
    }
    return c;
  }

  /* ---- props romani ---- */
  function propColonna() {
    const c = canvas(58, 124), g = c.getContext('2d');
    rect(g, 4, 112, 50, 10, '#8b7358');
    rect(g, 6, 113, 46, 8, '#cbb692');
    rect(g, 6, 113, 46, 2, '#e6d5b0');
    colonnaTravertino(g, 29, 112, 96, 17, 1);
    // capitello corinzio semplificato
    rect(g, 13, 12, 32, 6, '#d8c6a2');
    rect(g, 15, 8, 28, 5, '#e6d5b0');
    rect(g, 15, 8, 10, 2, '#fff3d0');
    for (let i = 0; i < 4; i++) rect(g, 16 + i * 8, 13, 4, 4, '#b7a17d');
    // ombra a terra
    ellipse(g, 29, 122, 26, 3, 'rgba(11,8,18,.3)');
    quantize(c);
    return c;
  }

  function propFontanaRoma() {
    const c = canvas(96, 66), g = c.getContext('2d');
    ellipse(g, 48, 60, 44, 5, 'rgba(11,8,18,.28)');
    rect(g, 4, 48, 88, 12, '#b7a17d');
    rect(g, 4, 48, 88, 3, '#d8c7a5');
    rect(g, 8, 51, 80, 7, '#cbb692');
    ellipse(g, 48, 47, 44, 9, '#cbb692');
    ellipse(g, 48, 45, 38, 6, '#8fb4bd');
    ellipse(g, 48, 44, 31, 4.4, '#73c8d4');
    // vasca superiore
    rect(g, 42, 26, 12, 18, '#cbb692');
    rect(g, 44, 26, 4, 18, '#e6d5b0');
    ellipse(g, 48, 26, 20, 5, '#cbb692');
    ellipse(g, 48, 24.5, 16, 3.6, '#73c8d4');
    // getti d'acqua
    for (let i = 0; i < 3; i++) {
      line(g, 44 + i * 4, 22, 34 + i * 14, 38, 'rgba(207,239,238,.8)', 2);
      line(g, 44 + i * 4, 22, 34 + i * 14, 38, 'rgba(255,255,255,.35)', 1);
    }
    for (let i = 0; i < 8; i++) {
      g.fillStyle = 'rgba(207,239,238,.65)';
      g.fillRect(14 + i * 9, 43 + (i % 3), 2 + (i % 2) * 2, 1);
    }
    quantize(c);
    return c;
  }

  function propCartelloRoma() {
    const c = canvas(56, 68), g = c.getContext('2d');
    rect(g, 25, 24, 5, 42, '#1d2538');
    rect(g, 26, 24, 2, 42, '#41505f');
    rect(g, 2, 4, 52, 26, '#0b0812');
    rect(g, 4, 6, 48, 22, '#f5e9cc');
    rect(g, 4, 6, 48, 3, '#fffdf2');
    g.fillStyle = '#66192a'; g.font = 'bold 5px monospace'; g.textAlign = 'center';
    g.fillText('PIAZZA', 28, 14);
    g.fillText('MASTAI', 28, 20);
    g.fillStyle = '#c62265'; g.fillRect(4, 22, 48, 4);
    g.fillStyle = '#8b7f72'; g.font = 'bold 3px monospace';
    g.fillText('DIREZ. CENTRALE →', 28, 27);
    g.textAlign = 'left';
    // freccia
    g.fillStyle = '#ffc84b';
    g.beginPath(); g.moveTo(40, 12); g.lineTo(48, 16); g.lineTo(40, 20); g.closePath(); g.fill();
    ellipse(g, 28, 66, 14, 3, 'rgba(11,8,18,.3)');
    quantize(c);
    return c;
  }

  function iconPizza() {
    const { c, g, ox, oy } = pickupBase(28, 28, '#ffc84b');
    g.save(); g.translate(ox, oy);
    // spicchio di pizza
    poly(g, [[14, 4], [26, 24], [2, 24]], '#f0c36d');
    poly(g, [[14, 6], [23, 22], [5, 22]], '#ffd88a');
    // crosta
    poly(g, [[14, 4], [26, 24], [21, 23], [14, 8]], '#d9a45b');
    // pomodoro e mozzarella
    circle(g, 13, 13, 3, '#d54c42');
    circle(g, 17, 18, 2.6, '#fffdf2');
    circle(g, 9, 19, 2.4, '#d54c42');
    circle(g, 12, 17, 1.8, '#fffdf2');
    // basilico
    ellipse(g, 15, 16, 2.4, 1.3, '#2f8a3f');
    g.restore();
    return c;
  }

  A.buildRomaProps = function () {
    A.props.colonna = propColonna();
    A.props.fontana = propFontanaRoma();
    A.props.cartelloRoma = propCartelloRoma();
  };

  A.buildRomaPickups = function () {
    A.pickups.pizza = iconPizza();
  };

  A.makeFoglio = function (seal = '#c62265', label = 'TIMBRA') {
    const c = canvas(22, 28), g = c.getContext('2d');
    rect(g, 1, 1, 20, 26, '#0b0812');
    rect(g, 2, 2, 18, 24, '#fff8e7');
    rect(g, 2, 2, 18, 2, '#fffdf2');
    g.fillStyle = '#8b7f72'; g.font = 'bold 4px monospace'; g.textAlign = 'center';
    g.fillText('DIREZIONE', 11, 8);
    g.fillText('CENTRALE', 11, 12);
    rect(g, 4, 14, 14, 1, '#a89671');
    rect(g, 4, 16, 10, 1, '#a89671');
    rect(g, 4, 18, 12, 1, '#a89671');
    rect(g, 4, 20, 8, 1, '#a89671');
    rect(g, 9, 21, 12, 6, '#0b0812');
    rect(g, 10, 22, 10, 4, seal);
    g.fillStyle = '#ffe7c6'; g.font = 'bold 3px monospace';
    g.fillText(label, 15, 25);
    g.textAlign = 'left';
    quantize(c);
    return c;
  };
  A.buildRomaIcons = function () {
    A.icons.foglio = A.makeFoglio('#c62265', 'TIMBRA');
    A.icons.direttiva = A.makeFoglio('#8f154d', 'DIRETT.');
  };

  A.buildRomaArt = function () {
    if (A.romaBuilt) return;
    A.romaBuilt = true;
    A.bg.romaSky = buildRomaSky();
    A.bg.romaFar = buildRomaFar();
    A.bg.romaMid = buildRomaMid();
    A.bg.romaNear = buildRomaNear();
    A.bg.bossRoma = buildBossRoma();
    A.groundTiles[4] = buildGroundRoma();
  };


  /* =========================================================
     v2.0 — EUROPA / BRUXELLES (livello 5)
     ========================================================= */
  function stellaEU(g, x, y, r, col = '#ffc84b') {
    g.fillStyle = col;
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i / 10 * TAU;
      const rr = i % 2 ? r * .42 : r;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      if (!i) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath(); g.fill();
  }

  function cerchioStelleEU(g, cx, cy, r, size = 4) {
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU - Math.PI / 2;
      stellaEU(g, cx + Math.cos(a) * r, cy + Math.sin(a) * r, size);
    }
  }

  function palazzoVetro(g, x, baseY, w, h, tone = 0) {
    const glassCols = [['#4f7d95', '#9fc1ea'], ['#3d6b8a', '#8fb8d9'], ['#456a7e', '#a8c8dd']][tone % 3];
    rect(g, x - 2, baseY - h - 2, w + 4, h + 4, '#13202f');
    rect(g, x, baseY - h, w, h, glassCols[0]);
    rect(g, x, baseY - h, w, 5, '#d4e5ee');
    rect(g, x, baseY - h, 4, h, '#a8c8dd');
    const cols = Math.max(2, Math.floor(w / 14));
    const rows = Math.max(2, Math.floor(h / 12));
    for (let r = 0; r < rows; r++) {
      const yy = baseY - h + 10 + r * (h - 16) / rows;
      for (let c = 0; c < cols; c++) {
        const xx = x + 7 + c * (w - 12) / cols;
        const lit = (r * 7 + c * 3 + tone) % 9 === 0;
        rect(g, xx, yy, (w - 12) / cols - 2, (h - 16) / rows - 3, lit ? '#ffe9a8' : glassCols[1]);
        rect(g, xx, yy, (w - 12) / cols - 2, 1, 'rgba(255,255,255,.28)');
      }
    }
    // fasce orizzontali e riflesso diagonale
    g.fillStyle = 'rgba(212,229,238,.5)';
    for (let r = 0; r <= rows; r++) {
      const yy = baseY - h + 8 + r * (h - 16) / rows;
      g.fillRect(x, yy, w, 1);
    }
    poly(g, [[x + w * .1, baseY], [x + w * .32, baseY - h], [x + w * .44, baseY - h], [x + w * .22, baseY]], 'rgba(255,255,255,.08)');
    rect(g, x - 2, baseY - h - 2, w + 4, 2, '#d4e5ee');
  }

  function atomium(g, x, baseY, s = 1) {
    g.save(); g.translate(x, baseY); g.scale(s, s);
    g.strokeStyle = '#48576e'; g.lineWidth = 3;
    const pts = [[0, -76], [-26, -34], [26, -34], [-12, 0], [14, 0], [0, 32]];
    for (let i = 0; i < pts.length; i++) {
      for (let k = i + 1; k < pts.length; k++) {
        if (Math.abs(pts[i][1] - pts[k][1]) > 32) continue;
        g.beginPath(); g.moveTo(pts[i][0], pts[i][1]); g.lineTo(pts[k][0], pts[k][1]); g.stroke();
      }
    }
    for (const [px, py] of pts) {
      circle(g, px, py, 9, '#0b0812');
      circle(g, px, py, 7.5, '#93aab8');
      circle(g, px - 2, py - 2, 4, '#d4e5ee');
      circle(g, px - 3, py - 3, 2, '#fffdf2');
      g.strokeStyle = '#48576e'; g.lineWidth = 1;
      g.beginPath(); g.arc(px, py, 7.5, 0, TAU); g.stroke();
    }
    g.restore();
  }

  function gruEdile(g, x, baseY, h, col = '#ffc84b') {
    g.strokeStyle = '#13202f'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x, baseY); g.lineTo(x, baseY - h); g.stroke();
    g.strokeStyle = col; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(x, baseY); g.lineTo(x, baseY - h); g.stroke();
    const top = baseY - h;
    g.strokeStyle = '#13202f'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x - 30, top + 6); g.lineTo(x + 52, top + 6); g.stroke();
    g.strokeStyle = col; g.lineWidth = 1.8;
    g.beginPath(); g.moveTo(x - 30, top + 6); g.lineTo(x + 52, top + 6); g.stroke();
    for (let i = 0; i < 5; i++) {
      g.strokeStyle = 'rgba(19,32,47,.6)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x - 24 + i * 14, top + 6); g.lineTo(x - 10 + i * 14, top - 8); g.stroke();
    }
    g.strokeStyle = '#13202f'; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(x - 26, top + 6); g.lineTo(x - 26, top + 40); g.stroke();
    g.fillStyle = '#c62265'; g.fillRect(x - 30, top + 40, 9, 6);
    g.fillStyle = '#ffc84b'; g.fillRect(x + 46, top + 2, 3, 3);
    g.restore && g.restore;
  }

  function buildEuropaSky() {
    const c = canvas(640, 360), g = c.getContext('2d');
    bandedGradient(g, 640, 0, 226, ['#4a6a94', '#6b8db3', '#93b3c8', '#c3d5d9', '#e6e8dc', '#ffedc8'], 3);
    g.fillStyle = 'rgba(255,240,200,.2)'; g.beginPath(); g.arc(452, 96, 70, 0, TAU); g.fill();
    circle(g, 452, 96, 24, '#fff3c4');
    circle(g, 452, 96, 18, '#fffbe4');
    cloud(g, 96, 84, .9, '#fffdf4', '#dfe7e4');
    cloud(g, 250, 54, .56, '#fffdf4', '#e2e9e6');
    cloud(g, 430, 140, .72, '#f8fbf5', '#dbe4e2');
    cloud(g, 566, 62, .6, '#f8fbf5', '#dde5e2');
    cloud(g, 170, 160, .44, '#f4f8f2', '#dfe6e2');
    // aerei di linea
    g.strokeStyle = '#5b789f'; g.lineWidth = 1;
    for (const [x, y, s] of [[300, 112, 6], [320, 106, 4]]) {
      g.beginPath(); g.moveTo(x - s, y); g.lineTo(x, y - 1); g.lineTo(x + s, y); g.stroke();
    }
    // velo basso
    bandedGradient(g, 640, 210, 300, ['rgba(230,232,220,.4)', 'rgba(214,218,206,.6)', 'rgba(200,204,192,.78)'], 3);
    g.fillStyle = '#c8ccc0'; g.fillRect(0, 294, 640, 66);
    g.fillStyle = '#b8bcb0'; g.fillRect(0, 294, 640, 3);
    return c;
  }

  function buildEuropaFar() {
    const w = 1300;
    const c = canvas(w, 360), g = c.getContext('2d');
    const rand = mulberry32(5151);
    // foschia nordica
    g.fillStyle = 'rgba(230,232,220,.4)'; g.fillRect(0, 150, w, 120);
    // atomium in lontananza
    g.globalAlpha = .55;
    atomium(g, 250, 268, 1.1);
    g.globalAlpha = 1;
    // torri di vetro
    let x = -20;
    let i = 0;
    while (x < w) {
      const bw = 58 + Math.floor(rand() * 52);
      const bh = 58 + Math.floor(rand() * 108);
      palazzoVetro(g, x, 268, bw, bh, i++);
      x += bw + 10 + Math.floor(rand() * 18);
    }
    // bandiera UE sulla torre più alta
    g.globalAlpha = .8;
    palazzoVetro(g, 960, 272, 90, 172, 1);
    g.globalAlpha = 1;
    rect(g, 1002, 84, 2, 18, '#8b8e84');
    poly(g, [[1004, 86], [1026, 89], [1024, 100], [1004, 97]], '#1d3f8f');
    stellaEU(g, 1012, 91, 2.4);
    // gru edili
    gruEdile(g, 510, 268, 104, '#ffc84b');
    gruEdile(g, 820, 272, 88, '#ff5b9d');
    gruEdile(g, 1180, 270, 118, '#51c7a9');
    // tetti bassi e parchi
    g.fillStyle = '#7f8f7a'; g.fillRect(0, 274, w, 86);
    g.fillStyle = '#8f9f88'; g.fillRect(0, 278, w, 82);
    const rand2 = mulberry32(933);
    for (let k = 0; k < 150; k++) {
      const px = rand2() * w, py = 278 + rand2() * 60;
      g.fillStyle = rand2() > .5 ? 'rgba(214,229,206,.22)' : 'rgba(60,74,58,.18)';
      g.fillRect(px, py, 1 + rand2() * 5, 1);
    }
    // alberi spogli
    for (const px of [120, 380, 690, 1040, 1260]) {
      const h = 26 + (px % 17);
      line(g, px, 290, px, 290 - h, '#5c4a3a', 2);
      for (let k = 0; k < 4; k++) line(g, px, 290 - h + 6 + k * 5, px - 8 + k * 5, 290 - h - 2 + k * 2, '#5c4a3a', 1.2);
      g.fillStyle = '#6f8a5e';
      ellipse(g, px - 2, 290 - h - 2, 12, 9, '#6f8a5e');
      ellipse(g, px + 6, 290 - h + 2, 8, 6, '#7f9a6e');
    }
    g.fillStyle = 'rgba(240,244,232,.12)'; g.fillRect(0, 0, w, 150);
    return c;
  }

  function buildEuropaMid() {
    const w = 1900;
    const c = canvas(w, 360), g = c.getContext('2d');
    const rand = mulberry32(6420);
    // basamento piazza
    g.fillStyle = '#8b93a0'; g.fillRect(0, 252, w, 108);
    g.fillStyle = '#9aa2ae'; g.fillRect(0, 252, w, 6);
    g.fillStyle = '#7a828e'; g.fillRect(0, 280, w, 5);
    // lastricato chiaro
    for (let yy = 286; yy < 306; yy += 10) {
      g.fillStyle = '#a3aab5'; g.fillRect(0, yy, w, 8);
      g.fillStyle = '#8e96a1';
      for (let xx = ((yy / 10) % 2) * 30; xx < w; xx += 60) g.fillRect(xx, yy, 2, 8);
    }
    // BERLAYMONT / palazzo Commissione
    const bx = 560, bw = 620, bh = 182;
    rect(g, bx - 8, 252 - bh - 10, bw + 16, bh + 20, '#13202f');
    palazzoVetro(g, bx, 252, bw, bh, 1);
    // struttura a stelle sul tetto
    cerchioStelleEU(g, bx + bw / 2, 252 - bh - 22, 16, 3.4);
    // monolite d'ingresso
    rect(g, bx + bw / 2 - 70, 252 - 58, 140, 58, '#93aab8');
    rect(g, bx + bw / 2 - 66, 252 - 54, 132, 52, '#d4e5ee');
    for (let k = 0; k < 6; k++) rect(g, bx + bw / 2 - 58 + k * 20, 252 - 46, 10, 40, '#9fc1ea');
    // insegna
    g.fillStyle = '#fff8e7'; g.font = 'bold 13px monospace'; g.textAlign = 'center';
    g.fillText('COMMISSIONE EUROPEA', bx + bw / 2, 252 - bh + 26);
    g.fillStyle = '#ffc84b'; g.font = 'bold 7px monospace';
    g.fillText('DOGANA EUROPEA · BRUXELLES', bx + bw / 2, 252 - bh + 38);
    g.textAlign = 'left';
    // bandiere nazionali in fila
    const flags = [
      ['#1c8a4a', '#fffdf2', '#c62265'], ['#1d3f8f'], ['#ffc84b', '#c62265'], ['#51c7a9', '#fffdf2']
    ];
    for (let k = 0; k < 8; k++) {
      const fx = 60 + k * 62;
      line(g, fx, 210, fx, 254, '#8b8e84', 1.6);
      const f = flags[k % flags.length];
      if (f.length === 3) {
        for (let b = 0; b < 3; b++) rect(g, fx + 1, 210 + b * 4, 16, 4, f[b]);
      } else if (f.length === 2) {
        rect(g, fx + 1, 210, 16, 8, f[0]);
        rect(g, fx + 1, 214, 8, 4, f[1]);
      } else {
        rect(g, fx + 1, 210, 16, 12, f[0]);
        cerchioStelleEU(g, fx + 9, 216, 4, 1.2);
      }
      g.strokeStyle = 'rgba(11,8,18,.4)'; g.lineWidth = .7; g.strokeRect(fx + 1, 210, 16, 12);
    }
    // ali del palazzo
    palazzoVetro(g, 0, 252, 300, 130, 0);
    palazzoVetro(g, 1240, 252, 300, 118, 2);
    palazzoVetro(g, 1560, 252, 340, 142, 1);
    // centro commerciale / galleria
    const gx = 1540;
    rect(g, gx, 176, 220, 76, '#13202f');
    rect(g, gx + 4, 180, 212, 72, '#d4e5ee');
    rect(g, gx + 4, 180, 212, 6, '#fffdf2');
    for (let k = 0; k < 6; k++) {
      rect(g, gx + 10 + k * 34, 190, 26, 56, k % 2 ? '#9fc1ea' : '#8fb8d9');
      rect(g, gx + 12 + k * 34, 194, 8, 48, 'rgba(255,255,255,.18)');
    }
    g.fillStyle = '#66192a'; g.font = 'bold 9px monospace'; g.textAlign = 'center';
    g.fillText('GALLERIA STELLA', gx + 110, 172);
    g.textAlign = 'left';
    // bike lane e rastrelliere
    rect(g, 0, 258, w, 22, '#5b6a7a');
    rect(g, 0, 258, w, 3, '#8b93a0');
    g.fillStyle = 'rgba(255,253,242,.55)';
    for (let xx = 30; xx < w; xx += 150) {
      g.fillRect(xx, 268, 26, 2); g.fillRect(xx + 30, 268, 26, 2);
      g.fillRect(xx, 273, 60, 1);
    }
    for (const bx2 of [200, 1000, 1450]) {
      bicicletta(g, bx2, 264, .9, '#2e3a50');
      bicicletta(g, bx2 + 34, 264, .9, '#1d3f8f');
    }
    // manifestanti con cartelli
    for (const [mx, label, col] of [[380, 'NO TAPPI!', '#51c7a9'], [1180, 'GIÙ I REGOLAMENTI', '#ffc84b'], [1700, 'GREEN DEAL ORA', '#5ac457']]) {
      // figurina
      rect(g, mx, 224, 10, 26, '#2e3a50');
      circle(g, mx + 5, 218, 5, '#e7a67d');
      line(g, mx + 2, 252, mx + 1, 264, '#1d2538', 2.6);
      line(g, mx + 8, 252, mx + 9, 264, '#1d2538', 2.6);
      line(g, mx + 10, 228, mx + 14, 214, '#1d2538', 1.8);
      g.save(); g.translate(mx + 18, 200); g.rotate(-.06);
      rect(g, -3, -8, 34, 17, '#0b0812');
      rect(g, -1, -6, 30, 13, col);
      g.fillStyle = '#1d2538'; g.font = 'bold 4px monospace'; g.textAlign = 'center';
      g.fillText(label, 14, 3);
      g.textAlign = 'left';
      g.restore();
    }
    // lampioni moderni
    for (const lx of [140, 480, 900, 1320, 1600, 1850]) {
      line(g, lx, 258, lx, 200, '#48576e', 2);
      line(g, lx, 200, lx + 12, 196, '#48576e', 2);
      rect(g, lx + 8, 194, 10, 5, '#ffedb1');
      g.fillStyle = 'rgba(255,237,177,.14)';
      g.beginPath(); g.arc(lx + 13, 196, 14, 0, TAU); g.fill();
    }
    return c;
  }

  function buildEuropaNear() {
    const w = 2400;
    const c = canvas(w, 360), g = c.getContext('2d');
    const rand = mulberry32(8182);
    // marciapiede e asfalto
    sampietriniBand(g, w, 262, 288, rand, '#7f8794');
    g.fillStyle = '#5b6a7a'; g.fillRect(0, 288, w, 18);
    g.fillStyle = '#6b7a8a'; g.fillRect(0, 288, w, 3);
    g.fillStyle = 'rgba(255,253,242,.5)';
    for (let xx = 40; xx < w; xx += 140) g.fillRect(xx, 296, 40, 3);
    // bike-share
    const rack = (rx) => {
      rect(g, rx - 8, 250, 118, 5, '#93aab8');
      rect(g, rx - 8, 250, 118, 1, '#d4e5ee');
      for (let k = 0; k < 3; k++) {
        rect(g, rx + k * 40, 240, 4, 14, '#7280b3');
        bicicletta(g, rx + 16 + k * 40, 262, 1, k % 2 ? '#1d3f8f' : '#c62265');
      }
      rect(g, rx + 14, 232, 62, 11, '#1d3f8f');
      g.fillStyle = '#ffc84b'; g.font = 'bold 5px monospace'; g.textAlign = 'center';
      g.fillText('BIKE UE', rx + 45, 240);
      g.textAlign = 'left';
    };
    rack(120);
    rack(1220);
    // bistrot con tenda
    const bistro = (px) => {
      rect(g, px, 222, 190, 40, '#efe3c6');
      rect(g, px, 222, 190, 4, '#cbb692');
      for (let k = 0; k < 4; k++) rect(g, px + 16 + k * 44, 232, 26, 16, '#9fc1ea');
      rect(g, px, 218, 190, 8, '#13202f');
      for (let k = 0; k < 10; k++) {
        poly(g, [[px + k * 19, 218], [px + 19 + k * 19, 218], [px + 15 + k * 19, 238], [px + 4 + k * 19, 238]], k % 2 ? '#1d3f8f' : '#fffdf2');
      }
      rect(g, px + 6, 258, 178, 4, '#c87b1e');
      rect(g, px + 10, 262, 4, 6, '#8d5016');
      rect(g, px + 176, 262, 4, 6, '#8d5016');
      g.fillStyle = '#1d3f8f'; g.font = 'bold 8px monospace'; g.textAlign = 'center';
      g.fillText('BISTROT', px + 95, 214);
      g.textAlign = 'left';
      for (const tx of [px + 40, px + 96, px + 144]) {
        rect(g, tx, 248, 26, 3, '#fff8e7');
        line(g, tx + 13, 251, tx + 13, 258, '#7280b3', 1.6);
        // consumazione
        rect(g, tx + 6, 244, 5, 4, '#c62265');
        line(g, tx + 8, 240, tx + 8, 244, '#c62265', 1);
      }
    };
    bistro(420);
    bistro(1720);
    // chiosco info UE
    const kx = 900;
    rect(g, kx, 206, 130, 56, '#13202f');
    rect(g, kx + 3, 209, 124, 50, '#d4e5ee');
    rect(g, kx + 3, 209, 124, 8, '#1d3f8f');
    g.fillStyle = '#ffc84b'; g.font = 'bold 7px monospace'; g.textAlign = 'center';
    g.fillText('INFO UE', kx + 65, 216);
    cerchioStelleEU(g, kx + 65, 230, 12, 2.6);
    g.fillStyle = '#1d3f8f'; g.font = 'bold 4px monospace';
    g.fillText('REGOLAMENTI · TAPPI', kx + 65, 250);
    g.fillText('ORARIO 9:00-∞', kx + 65, 255);
    g.textAlign = 'left';
    rect(g, kx + 14, 218, 8, 8, '#9fc1ea');
    // totem bike
    const tx2 = 700;
    rect(g, tx2, 226, 26, 36, '#1d3f8f');
    rect(g, tx2 + 3, 229, 20, 22, '#9fd7ff');
    g.strokeStyle = '#fffdf2'; g.lineWidth = 1.4;
    g.beginPath(); g.arc(tx2 + 8, 242, 4, 0, TAU); g.stroke();
    g.beginPath(); g.arc(tx2 + 18, 242, 4, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(tx2 + 8, 242); g.lineTo(tx2 + 13, 235); g.lineTo(tx2 + 18, 242); g.stroke();
    // monopattini
    for (const [sx2, col] of [[1060, '#51c7a9'], [1100, '#1d3f8f'], [1140, '#ff5b9d']]) {
      line(g, sx2, 258, sx2 + 4, 232, '#48576e', 2.4);
      line(g, sx2 + 4, 232, sx2 + 12, 232, '#48576e', 2);
      rect(g, sx2 - 8, 256, 20, 3, col);
      circle(g, sx2 - 7, 259, 3.4, '#1a1222');
      circle(g, sx2 + 10, 259, 3.4, '#1a1222');
    }
    // monumento al regolamento (pile di carta su piedistallo)
    const mx = 1420;
    ellipse(g, mx + 40, 262, 46, 7, 'rgba(11,8,18,.28)');
    rect(g, mx, 238, 80, 24, '#b7a17d');
    rect(g, mx, 238, 80, 4, '#d8c7a5');
    rect(g, mx + 8, 222, 64, 16, '#cbb692');
    for (let k = 0; k < 7; k++) {
      const yy = 218 - k * 6, ox = (k % 3 - 1) * 3;
      rect(g, mx + 14 + ox, yy, 52, 6, k % 2 ? '#fff8e7' : '#f5e9cc');
      rect(g, mx + 14 + ox, yy, 52, 1, '#e6d5b0');
      rect(g, mx + 16 + ox, yy + 3, 30, 1, '#a89671');
      rect(g, mx + 40 + ox, yy + 2, 12, 3, '#1d3f8f');
    }
    g.fillStyle = '#1d3f8f'; g.font = 'bold 6px monospace'; g.textAlign = 'center';
    g.fillText('MOMUMENTO', mx + 40, 250);
    g.fillText('AL REGOLAMENTO', mx + 40, 256);
    g.textAlign = 'left';
    // fioriere con stelle
    for (let k = 0; k < 5; k++) {
      const px = 260 + k * 430;
      rect(g, px, 254, 36, 12, '#8b93a0');
      rect(g, px + 2, 252, 32, 4, '#a3aab5');
      for (let j = 0; j < 4; j++) {
        ellipse(g, px + 7 + j * 8, 248 - (j % 2) * 3, 5, 4, j % 2 ? '#5ac457' : '#3f9a4d');
        stellaEU(g, px + 8 + j * 8, 242 - (j % 3) * 2, 1.8, '#ffc84b');
      }
    }
    // cartello DOGANA EUROPEA
    const sx3 = 2140;
    rect(g, sx3 + 18, 214, 6, 48, '#48576e');
    rect(g, sx3, 186, 42, 32, '#13202f');
    rect(g, sx3 + 2, 188, 38, 28, '#1d3f8f');
    rect(g, sx3 + 2, 188, 38, 3, '#ffc84b');
    cerchioStelleEU(g, sx3 + 21, 200, 7, 1.6);
    g.fillStyle = '#fff8e7'; g.font = 'bold 4px monospace'; g.textAlign = 'center';
    g.fillText('DOGANA', sx3 + 21, 213);
    g.fillText('EUROPEA', sx3 + 21, 217);
    g.textAlign = 'left';
    // cordolo riflettente
    rect(g, 0, 300, w, 6, '#48576e');
    rect(g, 0, 300, w, 1, '#93aab8');
    for (let xx = 0; xx < w; xx += 96) rect(g, xx, 292, 2, 10, '#93aab8');
    return c;
  }

  function buildBossEuropa() {
    const c = canvas(640, 360), g = c.getContext('2d');
    const rand = mulberry32(9090);
    // atrio di vetro
    bandedGradient(g, 640, 0, 200, ['#20304a', '#2d4868', '#3f6688', '#6b8aa3', '#a8c4d4', '#d6e3e3'], 3);
    // griglia del lucernario
    g.save();
    for (let i = 0; i <= 10; i++) {
      const xx = i * 64;
      g.strokeStyle = 'rgba(19,32,47,.55)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(320, -20); g.lineTo(xx, 200); g.stroke();
    }
    for (let j = 1; j <= 5; j++) {
      const yy = 200 * j / 6;
      g.strokeStyle = 'rgba(19,32,47,.35)'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(0, yy); g.lineTo(640, yy); g.stroke();
    }
    g.restore();
    // raggi di luce
    for (let i = 0; i < 6; i++) {
      g.fillStyle = 'rgba(255,246,210,.05)';
      poly(g, [[40 + i * 100, 0], [90 + i * 100, 0], [300 + i * 30, 250], [230 + i * 30, 250]], 'rgba(255,246,210,.05)');
    }
    // parete di fondo con cerchio di stelle
    g.fillStyle = '#1d3f8f'; g.fillRect(0, 200, 640, 60);
    g.fillStyle = '#16306e'; g.fillRect(0, 240, 640, 20);
    g.fillStyle = '#13202f'; g.fillRect(0, 196, 640, 5);
    g.fillStyle = '#1d3f8f'; g.fillRect(0, 201, 640, 44);
    g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(0, 201, 640, 44);
    g.fillStyle = '#16306e';
    for (let x = 0; x < 640; x += 64) g.fillRect(x, 201, 2, 44);
    cerchioStelleEU(g, 320, 224, 34, 5.2);
    // arazzi con bandiere
    for (let i = 0; i < 6; i++) {
      const fx = 26 + i * 106;
      rect(g, fx, 130, 44, 64, '#13202f');
      rect(g, fx + 2, 132, 40, 60, i % 2 ? '#fff8e7' : '#f5e9cc');
      if (i % 2) {
        for (let b = 0; b < 3; b++) rect(g, fx + 2, 132 + b * 20, 40, 20, ['#1c8a4a', '#fffdf2', '#c62265'][b]);
      } else {
        rect(g, fx + 2, 132, 40, 60, '#ffc84b');
        rect(g, fx + 2, 132, 40, 8, '#c62265');
        cerchioStelleEU(g, fx + 22, 166, 12, 2.4);
      }
      line(g, fx, 130, fx, 124, '#8b8e84', 2);
      for (let k = 0; k < 4; k++) poly(g, [[fx - 2, 130 + k * 16], [fx + 46, 130 + k * 16], [fx + 42, 138 + k * 16], [fx, 138 + k * 16]], k % 2 ? '#c62265' : '#8f154d');
    }
    // scalinata e podio
    for (let i = 0; i < 4; i++) {
      rect(g, 190 - i * 22, 258 + i * 12, 260 + i * 44, 12, i % 2 ? '#8a93a0' : '#9aa2ae');
      rect(g, 190 - i * 22, 258 + i * 12, 260 + i * 44, 2, '#c3ccd6');
    }
    rect(g, 258, 244, 124, 18, '#13202f');
    rect(g, 261, 246, 118, 14, '#d4e5ee');
    rect(g, 258, 240, 124, 4, '#1d3f8f');
    // microfoni
    for (const mx of [288, 320, 352]) {
      line(g, mx, 242, mx - 3, 218, '#1d2538', 1.6);
      circle(g, mx - 4, 215, 3.4, '#1d2538');
      circle(g, mx - 4, 215, 2, '#48576e');
    }
    // pile di regolamenti
    for (const [px, n] of [[70, 6], [520, 5]]) {
      for (let k = 0; k < n; k++) {
        rect(g, px - 26 + (k % 3) * 2, 258 - k * 7, 54, 7, k % 2 ? '#fff8e7' : '#f5e9cc');
        rect(g, px - 24 + (k % 3) * 2, 258 - k * 7 + 2, 32, 1, '#a89671');
        rect(g, px + 4, 258 - k * 7 + 2, 16, 3, '#1d3f8f');
      }
    }
    // piante
    for (const px of [40, 590]) {
      rect(g, px - 14, 238, 28, 20, '#8b7358');
      for (let k = 0; k < 5; k++) {
        ellipse(g, px - 8 + k * 4, 232 - (k % 2) * 6, 9, 12, k % 2 ? '#2f8a3f' : '#3f9a4d');
      }
    }
    // bandiera UE grande a sinistra
    line(g, 480, 60, 480, 258, '#8b8e84', 3);
    poly(g, [[482, 62], [572, 66], [568, 118], [482, 116]], '#1d3f8f');
    g.fillStyle = 'rgba(255,255,255,.06)'; poly(g, [[482, 62], [526, 64], [524, 116], [482, 116]], 'rgba(255,255,255,.06)');
    cerchioStelleEU(g, 527, 90, 18, 3.6);
    // pavimento in marmo lucido
    rect(g, 0, 296, 640, 64, '#8a93a0');
    rect(g, 0, 296, 640, 4, '#c3ccd6');
    for (let y = 302; y < 360; y += 12) {
      for (let x = ((y / 12) % 2) * 40; x < 640; x += 80) {
        rect(g, x, y, 78, 10, y % 24 ? '#848d9a' : '#8f98a5');
        rect(g, x, y, 78, 1, 'rgba(255,255,255,.16)');
      }
    }
    // riflessi del cerchio di stelle
    g.fillStyle = 'rgba(255,200,75,.12)';
    g.beginPath(); g.ellipse(320, 320, 120, 16, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(29,63,143,.2)';
    g.beginPath(); g.ellipse(320, 336, 180, 20, 0, 0, TAU); g.fill();
    // coriandoli di protocollo
    for (let i = 0; i < 40; i++) {
      g.fillStyle = i % 3 === 0 ? 'rgba(255,200,75,.55)' : i % 3 === 1 ? 'rgba(255,91,157,.4)' : 'rgba(159,215,255,.45)';
      g.fillRect(rand() * 640, 30 + rand() * 250, 1, 2);
    }
    return c;
  }


  /* =========================================================
     v2.0 — NEMICI EUROPA (84x90: 4 walk + attack + hurt)
     ========================================================= */
  function paintMerkel(o) {
    const g = canvas(84, 90).getContext('2d');
    const img = g.canvas;
    const mode = o.mode || 'walk';
    const t = o.phase || 0;
    const walk = Math.sin(t * TAU);
    const step = mode === 'walk' ? walk : 0;
    const bob = mode === 'walk' ? Math.abs(walk) * 1.1 : 0;
    const ink = '#0b0812';
    const hair = '#a9b6c1', hairDk = '#657a8b', hairLt = '#d4e5ee';
    const blazer = '#9c62c8', blazerLt = '#c598e0', blazerDk = '#6e3e8f';
    const skin = '#f6c7a3', skinDk = '#e7a67d', skinLine = '#cb7c5f';
    g.save();
    g.translate(0, bob * .2);
    // scarpe comode
    for (const [fx, dir] of [[38, 1], [54, -1]]) {
      const off = mode === 'walk' ? step * 4 * dir : 0;
      rect(g, fx - 8 + off, 82, 17, 4, '#1a1222');
      rect(g, fx - 7 + off, 82, 15, 3, '#2e3a50');
    }
    // pantaloni scuri
    outlinedLimb(g, 41, 62, 39 + step * 4, 73, 10, '#2e3a50', ink);
    outlinedLimb(g, 39 + step * 4, 73, 38 + step * 7, 82, 8, '#1d2538', ink);
    outlinedLimb(g, 51, 62, 54 - step * 4, 73, 10, '#2e3a50', ink);
    outlinedLimb(g, 54 - step * 4, 73, 56 - step * 7, 82, 8, '#1d2538', ink);
    // blazer
    g.beginPath();
    g.moveTo(31, 38); g.lineTo(56, 38);
    g.quadraticCurveTo(63, 46, 61, 63);
    g.lineTo(29, 63);
    g.quadraticCurveTo(26, 47, 31, 38);
    g.closePath();
    g.fillStyle = blazer; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2.2; g.stroke();
    // camicia bianca
    poly(g, [[41, 38], [48, 38], [46.5, 52], [42.5, 52]], '#fffdf2');
    // bavero
    poly(g, [[38, 38], [44, 38], [41, 48], [35, 46]], blazerLt);
    poly(g, [[49, 38], [43, 38], [46, 48], [52, 46]], blazerLt);
    // bottoni
    circle(g, 46, 50, 1.5, '#ffc84b');
    circle(g, 45, 56, 1.5, '#ffc84b');
    // perle
    for (let k = 0; k < 5; k++) circle(g, 40 + k * 2, 37 + Math.abs(k - 2) * .8, 1.2, '#fffdf2');
    g.strokeStyle = '#d4e5ee'; g.lineWidth = .8;
    g.beginPath(); g.arc(43, 36, 6, .3, Math.PI - .3); g.stroke();
    // braccio sinistro con cartellina
    if (mode === 'attack') {
      outlinedLimb(g, 31, 43, 24, 34, 6, blazer, ink);
      outlinedLimb(g, 24, 34, 20, 22, 5, skin, ink);
      circle(g, 19, 21, 3, skin);
      // pacco austerity
      g.save(); g.translate(22, 12); g.rotate(-.2);
      rect(g, -8, -9, 16, 12, '#f5e9cc');
      rect(g, -8, -9, 16, 2, '#cbb98e');
      rect(g, -3, -13, 6, 5, '#c62265');
      g.fillStyle = '#66192a'; g.font = 'bold 4px monospace'; g.textAlign = 'center';
      g.fillText('AUSTERITY', 0, 0);
      g.fillStyle = '#ffc84b'; g.beginPath(); g.arc(0, 4, 2.5, 0, TAU); g.fill();
      g.textAlign = 'left';
      g.restore();
      // linee di lancio
      g.strokeStyle = 'rgba(255,200,75,.6)'; g.lineWidth = 1;
      for (let k = 0; k < 3; k++) {
        g.beginPath(); g.moveTo(30 + k * 2, 6 + k * 4); g.lineTo(38 + k * 2, 2 + k * 4); g.stroke();
      }
    } else if (mode === 'hurt') {
      outlinedLimb(g, 31, 43, 22, 48, 6, blazer, ink);
      outlinedLimb(g, 22, 48, 16, 44, 5, skin, ink);
      circle(g, 15, 43, 3, skin);
      // cartellina che vola
      g.save(); g.translate(10, 26); g.rotate(.7);
      rect(g, -7, -9, 14, 16, '#f5e9cc');
      rect(g, -7, -9, 14, 3, '#cbb98e');
      rect(g, -4, -6, 8, 1, '#8b7f72');
      rect(g, -4, -3, 6, 1, '#8b7f72');
      g.restore();
    } else {
      outlinedLimb(g, 31, 43, 25, 53, 6, blazer, ink);
      outlinedLimb(g, 25, 53, 27, 61, 5, skin, ink);
      circle(g, 28, 62, 3, skin);
      // cartellina tenuta in mano
      g.save(); g.translate(30, 66); g.rotate(.12);
      rect(g, -9, -6, 18, 12, '#f5e9cc');
      rect(g, -9, -6, 18, 2, '#cbb98e');
      rect(g, -5, -3, 8, 1, '#8b7f72');
      rect(g, -5, 0, 6, 1, '#8b7f72');
      rect(g, -3, 3, 6, 2, '#1d3f8f');
      g.restore();
    }
    // braccio destro
    if (mode === 'attack') {
      outlinedLimb(g, 57, 44, 66, 52, 6, blazer, ink);
      outlinedLimb(g, 66, 52, 70, 62, 5, skin, ink);
      circle(g, 71, 63, 3, skin);
    } else {
      outlinedLimb(g, 57, 44, 63, 54, 6, blazer, ink);
      outlinedLimb(g, 63, 54, 65, 62, 5, skin, ink);
      circle(g, 66, 63, 3, skin);
    }
    // testa con caschetto grigio
    const hy = 23;
    // volume posteriore del caschetto (dietro al viso)
    g.fillStyle = hairDk;
    g.beginPath(); g.ellipse(46, hy - 3, 14, 12.5, 0, 0, TAU); g.fill();
    g.fillStyle = hair;
    g.beginPath(); g.ellipse(46, hy - 4, 12.8, 11, 0, 0, TAU); g.fill();
    // viso (più ampio e leggibile)
    g.beginPath();
    g.moveTo(34, hy - 2);
    g.bezierCurveTo(36, hy - 11, 56, hy - 12, 58, hy - 2);
    g.bezierCurveTo(59, hy + 5, 55, hy + 11, 46, hy + 12);
    g.bezierCurveTo(38, hy + 12, 33, hy + 6, 34, hy - 2);
    g.closePath();
    g.fillStyle = skin; g.fill();
    g.strokeStyle = ink; g.lineWidth = 1.8; g.stroke();
    // guance e mento
    g.fillStyle = 'rgba(231,166,125,.5)';
    g.fillRect(37, hy + 7, 6, 2); g.fillRect(49, hy + 7, 6, 2);
    // caschetto: frangia con riga laterale + laterali sottili
    g.fillStyle = hair;
    g.beginPath();
    g.moveTo(33, hy - 1);
    g.bezierCurveTo(34, hy - 14, 58, hy - 16, 59, hy - 1);
    g.bezierCurveTo(57, hy - 6, 50, hy - 8, 45, hy - 6.6);
    g.bezierCurveTo(41, hy - 5.4, 37, hy - 7, 33, hy - 1);
    g.closePath(); g.fill();
    g.strokeStyle = ink; g.lineWidth = 1.3;
    g.beginPath(); g.moveTo(33, hy - 1); g.bezierCurveTo(34, hy - 14, 58, hy - 16, 59, hy - 1); g.stroke();
    g.beginPath(); g.ellipse(33.2, hy + 2, 2.4, 6, .12, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(58.8, hy + 2, 2.4, 6, -.12, 0, TAU); g.fill();
    g.strokeStyle = ink; g.lineWidth = 1;
    g.beginPath(); g.ellipse(33.2, hy + 2, 2.4, 6, .12, 0, TAU); g.stroke();
    g.beginPath(); g.ellipse(58.8, hy + 2, 2.4, 6, -.12, 0, TAU); g.stroke();
    // riga e riflessi
    g.strokeStyle = hairDk; g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(45, hy - 11); g.quadraticCurveTo(43, hy - 8, 44, hy - 5); g.stroke();
    g.strokeStyle = hairLt; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(36, hy - 8); g.quadraticCurveTo(39, hy - 11, 43, hy - 10); g.stroke();
    g.beginPath(); g.moveTo(48, hy - 10); g.quadraticCurveTo(53, hy - 10, 57, hy - 7); g.stroke();
    // occhi
    if (mode === 'hurt') {
      line(g, 37, hy, 42, hy + 2, ink, 1.6);
      line(g, 49, hy + 2, 55, hy, ink, 1.6);
    } else {
      rect(g, 37, hy - 1, 6, 3, '#fffdf2');
      rect(g, 48, hy - 1, 6, 3, '#fffdf2');
      rect(g, 39, hy - .5, 2.2, 2.2, '#1a1222');
      rect(g, 50, hy - .5, 2.2, 2.2, '#1a1222');
      g.strokeStyle = hairDk; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(36, hy - 3.4); g.lineTo(43, hy - 3); g.stroke();
      g.beginPath(); g.moveTo(48, hy - 3); g.lineTo(55, hy - 3.4); g.stroke();
      // borse sotto gli occhi
      g.strokeStyle = 'rgba(203,124,95,.55)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(38, hy + 3); g.quadraticCurveTo(40, hy + 4.4, 43, hy + 3); g.stroke();
      g.beginPath(); g.moveTo(49, hy + 3); g.quadraticCurveTo(52, hy + 4.4, 54, hy + 3); g.stroke();
    }
    // naso
    line(g, 47, hy + 1, 46, hy + 5, skinLine, 1.3);
    line(g, 45, hy + 5, 48, hy + 5.4, skinLine, 1);
    // bocca (sottile, sorriso trattenuto)
    if (mode === 'attack') {
      g.fillStyle = '#8f154d';
      g.beginPath(); g.ellipse(45.5, hy + 8, 3, 2, 0, 0, TAU); g.fill();
      rect(g, 43.4, hy + 7, 4.2, 1, '#fffdf2');
    } else {
      g.strokeStyle = '#8f154d'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(41, hy + 8.2); g.quadraticCurveTo(45.5, hy + 9.4, 51, hy + 7.6); g.stroke();
      g.strokeStyle = 'rgba(203,124,95,.55)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(39.5, hy + 10); g.quadraticCurveTo(42, hy + 11, 44, hy + 10); g.stroke();
      g.beginPath(); g.moveTo(47, hy + 10); g.quadraticCurveTo(49.5, hy + 11, 51.5, hy + 9.8); g.stroke();
    }
    // orecchini di perle
    circle(g, 33.6, hy + 8, 1.7, '#fffdf2');
    circle(g, 58.4, hy + 8, 1.7, '#fffdf2');
    g.restore();
    quantize(img);
    return img;
  }

  function paintFrancese(o) {
    const g = canvas(84, 90).getContext('2d');
    const img = g.canvas;
    const mode = o.mode || 'walk';
    const t = o.phase || 0;
    const walk = Math.sin(t * TAU);
    const step = mode === 'walk' ? walk : 0;
    const bob = mode === 'walk' ? Math.abs(walk) * 1.3 : 0;
    const ink = '#0b0812';
    const navy = '#1d3f8f', navyDk = '#122d49', white = '#fffdf2';
    const skin = '#f6c7a3', skinDk = '#e7a67d', skinLine = '#cb7c5f';
    g.save();
    g.translate(0, -bob * .25);
    // scarpe eleganti
    for (const [fx, dir] of [[38, 1], [54, -1]]) {
      const off = mode === 'walk' ? step * 5 * dir : 0;
      rect(g, fx - 8 + off, 82, 17, 4, '#1a1222');
      rect(g, fx - 7 + off, 82, 15, 3, '#38220f');
      rect(g, fx - 8 + off, 85, 17, 2, '#0b0812');
    }
    // pantaloni a righe? no: pantaloni scuri
    outlinedLimb(g, 41, 62, 39 + step * 5, 73, 10, '#2e3a50', ink);
    outlinedLimb(g, 39 + step * 5, 73, 37 + step * 8, 82, 8, '#1d2538', ink);
    outlinedLimb(g, 51, 62, 54 - step * 5, 73, 10, '#2e3a50', ink);
    outlinedLimb(g, 54 - step * 5, 73, 57 - step * 8, 82, 8, '#1d2538', ink);
    // maglia a righe (marinière)
    g.beginPath();
    g.moveTo(31, 36); g.lineTo(56, 36);
    g.quadraticCurveTo(63, 44, 60, 64);
    g.lineTo(30, 64);
    g.quadraticCurveTo(27, 46, 31, 36);
    g.closePath();
    g.fillStyle = white; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2.2; g.stroke();
    g.save();
    g.beginPath(); g.moveTo(31, 38); g.lineTo(56, 38); g.quadraticCurveTo(63, 44, 60, 64); g.lineTo(30, 64); g.quadraticCurveTo(27, 46, 31, 38); g.closePath();
    g.clip();
    for (let i = 0; i < 5; i++) {
      g.fillStyle = navy;
      g.fillRect(26, 40 + i * 6, 40, 3);
    }
    g.restore();
    // fazzoletto rosso al collo
    poly(g, [[38, 36], [50, 36], [45, 43], [41, 43]], '#c62265');
    poly(g, [[44, 40], [48, 37], [52, 44], [48, 50]], '#c62265');
    poly(g, [[44, 40], [48, 37], [47, 42]], '#ff90b8');
    // bretelle/bavero
    line(g, 36, 38, 40, 62, navy, 1.4);
    line(g, 51, 38, 47, 62, navy, 1.4);
    // braccio sinistro (dietro) con baguette
    if (mode === 'hurt') {
      outlinedLimb(g, 31, 42, 24, 50, 6, white, ink);
      outlinedLimb(g, 24, 50, 20, 58, 5, skin, ink);
      circle(g, 19, 59, 3, skin);
      // baguette che vola
      g.save(); g.translate(6, 44); g.rotate(-.7);
      g.fillStyle = '#c87b1e';
      g.beginPath(); g.ellipse(0, 0, 12, 4.4, 0, 0, TAU); g.fill();
      g.fillStyle = '#e59e5d';
      g.beginPath(); g.ellipse(-1, -1, 10, 2.6, 0, 0, TAU); g.fill();
      g.strokeStyle = '#8d5016'; g.lineWidth = .8;
      for (let k = 0; k < 3; k++) {
        g.beginPath(); g.moveTo(-5 + k * 5, -2); g.lineTo(-2 + k * 5, 2); g.stroke();
      }
      g.restore();
    } else {
      outlinedLimb(g, 31, 42, 24, 51, 6, white, ink);
      outlinedLimb(g, 24, 51, 22, 59, 5, skin, ink);
      circle(g, 21, 60, 3, skin);
      // baguette sottobraccio
      g.save(); g.translate(26, 60); g.rotate(-.28);
      g.fillStyle = '#c87b1e';
      g.beginPath(); g.ellipse(0, 0, 14, 4.6, 0, 0, TAU); g.fill();
      g.fillStyle = '#e59e5d';
      g.beginPath(); g.ellipse(-1, -1.4, 12, 2.8, 0, 0, TAU); g.fill();
      g.strokeStyle = '#8d5016'; g.lineWidth = .9;
      for (let k = 0; k < 4; k++) {
        g.beginPath(); g.moveTo(-7 + k * 5, -2); g.lineTo(-4 + k * 5, 3); g.stroke();
      }
      g.restore();
    }
    // braccio destro
    if (mode === 'attack') {
      outlinedLimb(g, 57, 41, 68, 34, 6, white, ink);
      outlinedLimb(g, 68, 34, 72, 22, 5, skin, ink);
      circle(g, 73, 20, 3, skin);
      // baguette lanciata + formaggi
      g.save(); g.translate(76, 12); g.rotate(-.6);
      g.fillStyle = '#c87b1e';
      g.beginPath(); g.ellipse(0, 0, 13, 4.6, 0, 0, TAU); g.fill();
      g.fillStyle = '#e59e5d';
      g.beginPath(); g.ellipse(-1, -1.4, 11, 2.8, 0, 0, TAU); g.fill();
      g.strokeStyle = '#8d5016'; g.lineWidth = .9;
      for (let k = 0; k < 4; k++) {
        g.beginPath(); g.moveTo(-6 + k * 4.6, -2); g.lineTo(-3 + k * 4.6, 3); g.stroke();
      }
      g.restore();
      // camembert
      g.save(); g.translate(66, 4); g.rotate(.2);
      poly(g, [[0, 0], [10, 0], [5, 7]], '#fff3a6');
      poly(g, [[2, 1], [8, 1], [5, 4]], '#ffe165');
      g.strokeStyle = '#8d5016'; g.lineWidth = .6; g.stroke();
      g.restore();
      g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1;
      for (let k = 0; k < 3; k++) line(g, 58 + k * 3, 28 + k * 2, 50 + k * 3, 22 + k * 2, 'rgba(255,255,255,.6)', 1);
    } else {
      outlinedLimb(g, 57, 41, 63, 51, 6, white, ink);
      outlinedLimb(g, 63, 51, 66, 59, 5, skin, ink);
      circle(g, 67, 60, 3, skin);
      // bicchiere di vino
      if (mode !== 'hurt') {
        poly(g, [[66, 58], [72, 58], [69, 64]], '#e8d6ff');
        line(g, 69, 64, 69, 68, '#e8d6ff', 1);
        g.fillStyle = '#8f154d';
        g.fillRect(66, 59, 6, 2);
      }
    }
    // testa con basco
    const hy = 22;
    g.beginPath();
    g.moveTo(33, hy - 3);
    g.bezierCurveTo(35, hy - 12, 55, hy - 12, 58, hy - 3);
    g.bezierCurveTo(60, hy + 4, 55, hy + 10, 48, hy + 10);
    g.bezierCurveTo(41, hy + 10, 34, hy + 5, 33, hy - 3);
    g.closePath();
    g.fillStyle = skin; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2; g.stroke();
    // naso all'insù da snob
    g.strokeStyle = skinLine; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(48, hy + 1); g.quadraticCurveTo(53, hy + 1, 52, hy - 2); g.stroke();
    g.fillStyle = skinDk;
    g.beginPath(); g.ellipse(52, hy - 2, 2.4, 1.6, .3, 0, TAU); g.fill();
    // occhi socchiusi e snob
    if (mode === 'hurt') {
      line(g, 39, hy + 1, 44, hy + 2, ink, 1.5);
      line(g, 48, hy + 2, 53, hy + 1, ink, 1.5);
    } else {
      rect(g, 38, hy, 6, 2.4, '#fffdf2');
      rect(g, 47, hy, 6, 2.4, '#fffdf2');
      rect(g, 40, hy + .6, 2, 1.6, '#1a1222');
      rect(g, 49, hy + .6, 2, 1.6, '#1a1222');
      line(g, 36, hy - 3, 44, hy - 1.4, '#38220f', 1.8);
      line(g, 47, hy - 1.4, 55, hy - 3, '#38220f', 1.8);
    }
    // baffi
    g.fillStyle = '#38220f';
    g.beginPath();
    g.moveTo(40, hy + 6); g.quadraticCurveTo(45, hy + 3.6, 48, hy + 6);
    g.quadraticCurveTo(52, hy + 3.6, 56, hy + 6);
    g.quadraticCurveTo(52, hy + 8, 48, hy + 6.6);
    g.quadraticCurveTo(44, hy + 8, 40, hy + 6);
    g.fill();
    // bocca annoiata
    line(g, 42, hy + 9, 52, hy + 8.4, '#9d2833', 1.3);
    // basco
    g.save();
    if (mode === 'hurt') { g.translate(74, 8); g.rotate(.5); }
    else { g.translate(0, 0); }
    g.fillStyle = '#1d2538';
    g.beginPath();
    g.moveTo(30, hy - 4);
    g.bezierCurveTo(28, hy - 15, 60, hy - 17, 61, hy - 5);
    g.bezierCurveTo(60, hy - 2, 50, hy - 1, 44, hy - 3);
    g.bezierCurveTo(38, hy - 4, 33, hy - 3, 30, hy - 4);
    g.closePath(); g.fill();
    g.strokeStyle = ink; g.lineWidth = 1.6; g.stroke();
    g.fillStyle = '#2e3a50';
    g.beginPath(); g.ellipse(45, hy - 10, 10, 4.6, -.12, 0, TAU); g.fill();
    // pendaglietto del basco
    rect(g, 45, hy - 16, 2, 3, '#1d2538');
    g.restore();
    g.restore();
    quantize(img);
    return img;
  }

  function paintBottiglia(o) {
    const g = canvas(84, 90).getContext('2d');
    const img = g.canvas;
    const mode = o.mode || 'walk';
    const t = o.phase || 0;
    const walk = Math.sin(t * TAU);
    const bob = mode === 'walk' ? Math.abs(walk) * 2.2 : 0;
    const squash = mode === 'walk' ? Math.abs(walk) : mode === 'hurt' ? 1 : .4;
    const ink = '#0b0812';
    const pet = '#73c8d4', petLt = '#d9f0f5', petDk = '#2d8ea4', petDeep = '#17655f';
    const cap = '#5ac457', capDk = '#2f8a3f';
    g.save();
    g.translate(0, bob * .35);
    // ombra elastica (l'oggetto rimbalza)
    g.fillStyle = 'rgba(11,8,18,.28)';
    g.beginPath(); g.ellipse(42, 86, 20 - bob, 3.4, 0, 0, TAU); g.fill();
    // gambette
    const lx = mode === 'walk' ? walk * 4 : 0;
    outlinedLimb(g, 36, 64, 33 + lx, 80, 7, petDk, ink);
    outlinedLimb(g, 48, 64, 51 - lx, 80, 7, petDk, ink);
    rect(g, 28 + lx, 78, 12, 5, '#1d2538');
    rect(g, 46 - lx, 78, 12, 5, '#1d2538');
    // corpo bottiglia con schiacciamento elastico
    g.save();
    g.translate(42, 64);
    g.scale(1 + squash * .08, 1 - squash * .06);
    g.translate(-42, -64);
    // corpo
    g.beginPath();
    g.moveTo(28, 32);
    g.lineTo(56, 32);
    g.quadraticCurveTo(58, 44, 57, 52);
    g.quadraticCurveTo(56, 64, 52, 68);
    g.lineTo(32, 68);
    g.quadraticCurveTo(28, 64, 27, 52);
    g.quadraticCurveTo(26, 44, 28, 32);
    g.closePath();
    g.fillStyle = pet; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2; g.stroke();
    // trasparenza e riflessi
    g.fillStyle = 'rgba(217,240,245,.5)';
    g.fillRect(31, 36, 6, 28);
    g.fillStyle = 'rgba(255,255,255,.35)';
    g.fillRect(33, 38, 2, 22);
    g.fillStyle = petLt;
    g.fillRect(48, 36, 5, 26);
    g.fillStyle = 'rgba(23,101,95,.35)';
    g.fillRect(53, 36, 3, 28);
    // costole della bottiglia PET
    for (let k = 0; k < 3; k++) {
      g.strokeStyle = petLt; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(29, 54 + k * 4); g.quadraticCurveTo(42, 57 + k * 4, 55, 54 + k * 4); g.stroke();
      g.strokeStyle = petDeep; g.lineWidth = .7;
      g.beginPath(); g.moveTo(30, 55.4 + k * 4); g.quadraticCurveTo(42, 58.4 + k * 4, 54, 55.4 + k * 4); g.stroke();
    }
    // etichetta
    rect(g, 32, 38, 20, 13, '#fffdf2');
    rect(g, 32, 38, 20, 2, '#9fc1ea');
    g.fillStyle = '#1d3f8f'; g.font = 'bold 4px monospace'; g.textAlign = 'center';
    g.fillText('ACQUA', 42, 45);
    g.fillText('UE', 42, 49);
    g.fillStyle = '#c62265'; g.font = 'bold 3px monospace';
    g.fillText('PET', 42, 52);
    g.textAlign = 'left';
    // faccina sulla bottiglia
    rect(g, 34, 34, 5, 3, '#fffdf2');
    rect(g, 45, 34, 5, 3, '#fffdf2');
    if (mode === 'hurt') {
      line(g, 34, 34, 39, 37, ink, 1.2);
      line(g, 45, 37, 50, 34, ink, 1.2);
    } else {
      rect(g, 36, 34.6, 2, 2, '#1a1222');
      rect(g, 46, 34.6, 2, 2, '#1a1222');
    }
    // bocca
    if (mode === 'attack') {
      g.fillStyle = petDeep;
      g.beginPath(); g.ellipse(42, 68, 5, 4, 0, 0, TAU); g.fill();
    } else {
      line(g, 37, 68, 47, 68, petDeep, 1.4);
    }
    // collo e tappo legato (ring)
    g.fillStyle = petLt;
    g.fillRect(34, 24, 16, 9);
    g.strokeStyle = ink; g.lineWidth = 1.6;
    g.strokeRect(34, 24, 16, 9);
    g.strokeStyle = petDk; g.lineWidth = 1;
    for (let k = 0; k < 3; k++) g.strokeRect(35 + k * 5, 25, 4, 7);
    // anello di plastica del tappo
    g.strokeStyle = '#d4e5ee'; g.lineWidth = 2;
    g.beginPath(); g.arc(42, 22, 9, .1, Math.PI - .1); g.stroke();
    g.strokeStyle = '#93aab8'; g.lineWidth = .8;
    g.beginPath(); g.arc(42, 22, 9, .1, Math.PI - .1); g.stroke();
    if (mode === 'attack') {
      // tappo che schizza via con spruzzo
      g.save(); g.translate(58, 8); g.rotate(-.5);
      rect(g, -5, -3, 10, 6, '#0b0812');
      rect(g, -4, -2, 8, 4, cap);
      rect(g, -4, -2, 8, 1, '#8eef7c');
      for (let k = 0; k < 4; k++) rect(g, -4 + k * 2.4, 1, 1, 2, capDk);
      g.restore();
      // schiuma e gocce
      for (let k = 0; k < 7; k++) {
        g.fillStyle = k % 2 ? 'rgba(217,240,245,.9)' : 'rgba(255,255,255,.75)';
        g.beginPath(); g.arc(42 + Math.sin(k * 2.1) * 8, 18 - k * 2.4, 1.6 + (k % 3), 0, TAU); g.fill();
      }
      g.strokeStyle = 'rgba(217,240,245,.7)'; g.lineWidth = 1.4;
      for (let k = 0; k < 3; k++) {
        g.beginPath();
        g.moveTo(38 + k * 4, 20);
        g.quadraticCurveTo(30 + k * 6, 8, 34 + k * 7, 2);
        g.stroke();
      }
    } else if (mode === 'hurt') {
      // tappo ammaccato e bollicine
      rect(g, 33, 20, 18, 5, '#0b0812');
      rect(g, 34, 21, 16, 3, capDk);
      g.fillStyle = 'rgba(255,255,255,.5)';
      g.beginPath(); g.arc(30, 40, 1.4, 0, TAU); g.fill();
      g.beginPath(); g.arc(52, 30, 1.2, 0, TAU); g.fill();
      // ammaccatura
      g.strokeStyle = '#93aab8'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(44, 42); g.lineTo(50, 46); g.lineTo(46, 50); g.stroke();
    } else {
      rect(g, 34, 20, 16, 5, '#0b0812');
      rect(g, 35, 21, 14, 3, cap);
      rect(g, 35, 21, 14, 1, '#8eef7c');
      for (let k = 0; k < 4; k++) rect(g, 36 + k * 3, 22, 1, 2, capDk);
      // etichetta di sicurezza attaccata
      g.strokeStyle = 'rgba(255,253,242,.8)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(34, 24); g.quadraticCurveTo(30, 30, 33, 34); g.stroke();
    }
    g.restore();
    g.restore();
    quantize(img);
    return img;
  }


  /* =========================================================
     v2.0 — URSULA (boss Europa): 240x300, piedi y=292.
     Anchor ax=120, ay=292. frames: idle[2], attack, hurt, rage.
     ========================================================= */
  const URSULA_W = 240, URSULA_H = 300;
  function paintUrsula(o) {
    const c = canvas(URSULA_W, URSULA_H), g = c.getContext('2d');
    const mode = o.mode || 'idle';
    const t = o.phase || 0;
    const ink = '#0b0812';
    const blazer = '#2b8e82', blazerLt = '#51c7a9', blazerDk = '#17655f';
    const blouse = '#fffdf2', skirt = '#2e3a50', skirtDk = '#1d2538';
    const skin = '#f6c7a3', skinDk = '#e7a67d', skinLine = '#cb7c5f';
    const hair = '#fff3a6', hairSh = '#ffc84b', hairDk = '#cbb98e';
    const gold = '#ffc84b', euBlue = '#1d3f8f';
    const breath = mode === 'idle' ? Math.sin(t * TAU) : 0;
    const rage = mode === 'rage';
    const attack = mode === 'attack';
    const hurt = mode === 'hurt';
    const bob = rage ? -3 : hurt ? 4 : Math.round(breath * 1.4);
    g.save();
    g.translate(0, bob);
    if (hurt) g.translate(-5, 0);

    // aura
    if (rage || attack) {
      g.fillStyle = rage ? 'rgba(90,196,87,.2)' : 'rgba(159,215,255,.14)';
      g.beginPath(); g.arc(120, 165, 120, 0, TAU); g.fill();
      g.fillStyle = rage ? 'rgba(255,200,75,.12)' : 'rgba(29,63,143,.1)';
      g.beginPath(); g.arc(120, 165, 90, 0, TAU); g.fill();
    }
    if (rage) {
      g.strokeStyle = 'rgba(90,196,87,.5)'; g.lineWidth = 3;
      g.beginPath(); g.arc(120, 160, 104, 0, TAU); g.stroke();
      g.strokeStyle = 'rgba(255,200,75,.3)'; g.lineWidth = 1.4;
      g.beginPath(); g.arc(120, 160, 116, 0, TAU); g.stroke();
    }

    // ombra
    g.fillStyle = 'rgba(11,8,18,.35)';
    g.beginPath(); g.ellipse(120, 292, 50, 7, 0, 0, TAU); g.fill();

    // ---- bandiera UE dietro (asta a sinistra)
    const poleX = 62;
    line(g, poleX, 272, poleX, 62, '#8b8e84', 3.4);
    line(g, poleX + 1, 272, poleX + 1, 62, '#d4e5ee', 1.2);
    circle(g, poleX, 60, 4.4, gold);
    circle(g, poleX, 60, 2.6, '#fff3a6');
    const wave = Math.sin(t * TAU) * 2;
    poly(g, [[poleX + 2, 66], [poleX + 74, 72 + wave], [poleX + 70, 124 + wave], [poleX + 2, 118]], euBlue);
    poly(g, [[poleX + 2, 66], [poleX + 40, 69 + wave * .6], [poleX + 38, 121 + wave * .6], [poleX + 2, 118]], '#16306e');
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * TAU;
      stellaEU(g, poleX + 38 + Math.cos(a) * 22, 95 + Math.sin(a) * 22, 3.2);
    }
    g.strokeStyle = 'rgba(11,8,18,.35)'; g.lineWidth = 1;
    g.strokeRect(poleX + 2, 66, 72, 58);

    // ---- gambe e tacchi
    for (const [lx, dir] of [[104, 1], [136, -1]]) {
      g.save(); g.translate(lx + (hurt ? 3 * dir : 0), 0);
      g.fillStyle = skin;
      g.fillRect(-7, 246, 14, 34);
      g.fillStyle = skinDk;
      g.fillRect(1, 246, 6, 34);
      // scarpa con tacco
      rect(g, -10, 276, 22, 7, '#1a1222');
      rect(g, -10, 280, 22, 4, skirtDk);
      rect(g, 6, 283, 4, 9, '#1a1222');
      rect(g, -10, 276, 22, 2, '#38220f');
      g.restore();
    }

    // ---- gonna a tubino
    g.beginPath();
    g.moveTo(88, 196); g.lineTo(152, 196);
    g.bezierCurveTo(158, 220, 156, 244, 152, 256);
    g.lineTo(88, 256);
    g.bezierCurveTo(84, 244, 82, 220, 88, 196);
    g.closePath();
    g.fillStyle = skirt; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2.6; g.stroke();
    g.fillStyle = 'rgba(212,229,238,.12)';
    g.fillRect(108, 202, 4, 50);
    g.fillStyle = skirtDk;
    g.fillRect(88, 250, 64, 6);
    // cintura
    g.fillStyle = '#1a1222'; g.fillRect(86, 192, 68, 8);
    g.fillStyle = gold; g.fillRect(116, 191, 8, 10);

    // ---- blazer
    g.beginPath();
    g.moveTo(92, 112);
    g.lineTo(148, 112);
    g.bezierCurveTo(164, 128, 166, 164, 160, 202);
    g.lineTo(80, 202);
    g.bezierCurveTo(74, 164, 76, 128, 92, 112);
    g.closePath();
    g.fillStyle = blazer; g.fill();
    g.strokeStyle = ink; g.lineWidth = 3; g.stroke();
    // camicia
    poly(g, [[112, 110], [128, 110], [126, 168], [114, 168]], blouse);
    // revers
    poly(g, [[110, 110], [96, 112], [110, 156], [120, 140]], blazerLt);
    poly(g, [[130, 110], [144, 112], [130, 156], [120, 140]], blazerLt);
    g.strokeStyle = blazerDk; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(97, 113); g.lineTo(112, 154); g.stroke();
    g.beginPath(); g.moveTo(143, 113); g.lineTo(128, 154); g.stroke();
    // bottoni dorati
    for (let k = 0; k < 3; k++) {
      circle(g, 113, 164 + k * 0, 2.2, gold);
    }
    circle(g, 113, 166, 2.4, gold);
    circle(g, 128, 168, 2.4, gold);
    // perle
    for (let k = 0; k < 9; k++) {
      const a = Math.PI * (k / 8);
      circle(g, 120 - Math.cos(a) * 17, 112 + Math.sin(a) * 9, 2.2, '#fffdf2');
    }
    // spilla stella UE
    stellaEU(g, 143, 132, 5, gold);
    // tasche
    g.strokeStyle = blazerDk; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(86, 184); g.lineTo(104, 184); g.stroke();
    g.beginPath(); g.moveTo(136, 184); g.lineTo(154, 184); g.stroke();
    // ombra laterale
    g.fillStyle = 'rgba(23,101,95,.35)';
    g.beginPath(); g.moveTo(150, 118); g.bezierCurveTo(164, 150, 166, 180, 160, 200); g.lineTo(152, 200); g.bezierCurveTo(156, 176, 154, 146, 142, 118); g.closePath(); g.fill();

    // ---- braccio sinistro (regge la bandiera) ----
    outlinedLimb(g, 94, 122, 76, 152, 12, blazer, ink);
    outlinedLimb(g, 76, 152, 70, 182, 10, blazer, ink);
    outlinedLimb(g, 70, 182, 66, 196, 8, skin, ink);
    circle(g, 65, 199, 6, skin);
    g.strokeStyle = 'rgba(11,8,18,.6)'; g.lineWidth = 1.4;
    g.beginPath(); g.arc(65, 199, 6, 0, TAU); g.stroke();

    // ---- braccio destro con pila di regolamenti ----
    const armUp = attack || rage;
    if (armUp) {
      outlinedLimb(g, 148, 122, 176, 96, 12, blazer, ink);
      outlinedLimb(g, 176, 96, 184, 64, 10, blazer, ink);
      outlinedLimb(g, 184, 64, 188, 42, 8, skin, ink);
      circle(g, 189, 38, 6, skin);
      // pila che si apre a ventaglio
      for (let k = 0; k < 7; k++) {
        const a = -1.1 + k * .32 + Math.sin(t * TAU + k) * .05;
        g.save(); g.translate(192, 34); g.rotate(a);
        rect(g, -5, -26, 12, 28, k % 2 ? '#fff8e7' : '#f5e9cc');
        rect(g, -5, -26, 12, 2, '#e6d5b0');
        rect(g, -4, -20, 8, 1, '#8b7f72');
        rect(g, -4, -16, 6, 1, '#8b7f72');
        rect(g, 0, -10, 5, 3, '#1d3f8f');
        g.restore();
      }
    } else if (hurt) {
      outlinedLimb(g, 148, 122, 170, 146, 12, blazer, ink);
      outlinedLimb(g, 170, 146, 176, 170, 10, blazer, ink);
      outlinedLimb(g, 176, 170, 180, 188, 8, skin, ink);
      circle(g, 181, 192, 6, skin);
      // regolamenti che volano
      for (let k = 0; k < 5; k++) {
        g.save(); g.translate(30 + k * 26, 40 + (k % 2) * 30); g.rotate(-.6 + k * .3);
        rect(g, -7, -10, 15, 21, '#fff8e7');
        rect(g, -7, -10, 15, 2, '#e6d5b0');
        rect(g, -5, -5, 10, 1, '#8b7f72');
        rect(g, 1, 5, 6, 3, '#1d3f8f');
        g.restore();
      }
    } else {
      outlinedLimb(g, 148, 122, 164, 148, 12, blazer, ink);
      outlinedLimb(g, 164, 148, 168, 172, 10, blazer, ink);
      outlinedLimb(g, 168, 172, 170, 186, 8, skin, ink);
      circle(g, 171, 190, 6, skin);
      // pila di regolamenti al fianco
      for (let k = 0; k < 5; k++) {
        rect(g, 160 + (k % 2) * 2, 188 - k * 6, 46, 6, k % 2 ? '#fff8e7' : '#f5e9cc');
        rect(g, 162 + (k % 2) * 2, 190 - k * 6, 30, 1, '#a89671');
        rect(g, 192, 190 - k * 6, 12, 3, '#1d3f8f');
      }
    }

    // ---- collo e testa
    rect(g, 112, 96, 18, 14, skinDk);
    const headY = 72 + (hurt ? 5 : 0);
    // capelli corti biondi dietro
    g.fillStyle = hairDk;
    g.beginPath(); g.ellipse(120, headY - 4, 26, 26, 0, 0, TAU); g.fill();
    // viso
    g.beginPath();
    g.moveTo(98, headY - 8);
    g.bezierCurveTo(100, headY - 24, 138, headY - 26, 143, headY - 7);
    g.bezierCurveTo(145, headY + 8, 139, headY + 22, 126, headY + 26);
    g.bezierCurveTo(108, headY + 30, 96, headY + 16, 98, headY - 8);
    g.closePath();
    g.fillStyle = skin; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2.6; g.stroke();
    // orecchie + orecchini
    circle(g, 97, headY + 3, 5, skin);
    circle(g, 144, headY + 3, 5, skinDk);
    g.strokeStyle = ink; g.lineWidth = 1.2;
    g.beginPath(); g.arc(97, headY + 3, 5, 0, TAU); g.stroke();
    g.beginPath(); g.arc(144, headY + 3, 5, 0, TAU); g.stroke();
    circle(g, 96, headY + 9, 2, gold);
    circle(g, 145, headY + 9, 2, gold);
    // capelli: caschetto biondo con riga laterale
    g.fillStyle = hair;
    g.beginPath();
    g.moveTo(95, headY + 2);
    g.bezierCurveTo(92, headY - 24, 146, headY - 30, 146, headY - 2);
    g.bezierCurveTo(146, headY + 4, 142, headY + 6, 140, headY + 3);
    g.bezierCurveTo(140, headY - 14, 102, headY - 16, 99, headY + 3);
    g.closePath(); g.fill();
    g.strokeStyle = ink; g.lineWidth = 1.6; g.stroke();
    g.fillStyle = hairSh;
    g.beginPath(); g.ellipse(100, headY - 6, 5, 12, .2, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(141, headY - 6, 5, 12, -.2, 0, TAU); g.fill();
    g.strokeStyle = '#fff3a6'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(102, headY - 18); g.quadraticCurveTo(118, headY - 26, 136, headY - 18); g.stroke();
    g.strokeStyle = hairDk; g.lineWidth = 1;
    g.beginPath(); g.moveTo(120, headY - 24); g.quadraticCurveTo(122, headY - 18, 119, headY - 12); g.stroke();
    // occhiali (montatura)
    if (hurt) {
      g.strokeStyle = '#1d2538'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(100, headY - 1); g.lineTo(115, headY + 4); g.stroke();
      g.beginPath(); g.moveTo(128, headY + 4); g.lineTo(141, headY - 2); g.stroke();
    } else {
      g.strokeStyle = '#1d2538'; g.lineWidth = 2.4;
      g.strokeRect(101, headY - 2, 17, 11);
      g.strokeRect(125, headY - 2, 17, 11);
      g.beginPath(); g.moveTo(118, headY + 2); g.lineTo(125, headY + 2); g.stroke();
      g.beginPath(); g.moveTo(101, headY + 1); g.lineTo(96, headY - 2); g.stroke();
      g.beginPath(); g.moveTo(142, headY + 1); g.lineTo(146, headY - 2); g.stroke();
      g.fillStyle = 'rgba(159,215,255,.25)';
      g.fillRect(103, headY, 13, 7); g.fillRect(127, headY, 13, 7);
      // occhi dietro le lenti
      g.fillStyle = '#1d2538';
      if (rage) {
        g.fillStyle = '#5ac457';
        g.fillRect(105, headY, 9, 5); g.fillRect(129, headY, 9, 5);
        g.fillStyle = '#fff8e7';
        g.fillRect(106, headY + 1, 7, 1); g.fillRect(130, headY + 1, 7, 1);
      } else {
        g.fillRect(107, headY + 1, 5, 4); g.fillRect(131, headY + 1, 5, 4);
        g.fillStyle = '#4a678f';
        g.fillRect(108, headY + 1, 2, 2); g.fillRect(132, headY + 1, 2, 2);
      }
    }
    // sopracciglia
    g.strokeStyle = hairDk; g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(102, headY - 5); g.quadraticCurveTo(109, headY - 7, 116, headY - 5); g.stroke();
    g.beginPath(); g.moveTo(126, headY - 5); g.quadraticCurveTo(133, headY - 7, 140, headY - 5); g.stroke();
    // naso
    line(g, 121, headY + 2, 119, headY + 11, skinLine, 1.8);
    line(g, 119, headY + 11, 122, headY + 12, skinLine, 1.4);
    // bocca / sorriso istituzionale
    if (attack) {
      g.fillStyle = '#8f154d';
      g.beginPath(); g.ellipse(122, headY + 19, 7, 4, 0, 0, TAU); g.fill();
      rect(g, 116, headY + 17, 12, 2, '#fffdf2');
    } else if (hurt) {
      g.strokeStyle = '#8f154d'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(113, headY + 20); g.quadraticCurveTo(122, headY + 16, 132, headY + 20); g.stroke();
    } else {
      g.strokeStyle = '#9d2833'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(114, headY + 18); g.quadraticCurveTo(122, headY + 22, 131, headY + 17); g.stroke();
      g.fillStyle = 'rgba(159,40,51,.3)';
      g.beginPath(); g.ellipse(122, headY + 20, 9, 2, .06, 0, TAU); g.fill();
    }
    // rughe sorriso
    g.strokeStyle = 'rgba(203,124,95,.6)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(110, headY + 15); g.lineTo(113, headY + 16); g.stroke();
    g.beginPath(); g.moveTo(133, headY + 15); g.lineTo(130, headY + 16); g.stroke();

    // ---- rage: Green Deal (stelle e foglie verdi)
    if (rage) {
      for (let k = 0; k < 10; k++) {
        const a = k / 10 * TAU + t * TAU * .4;
        const px = 120 + Math.cos(a) * (86 + (k % 3) * 12);
        const py = 160 + Math.sin(a) * (76 + (k % 2) * 16);
        stellaEU(g, px, py, 4, k % 2 ? '#5ac457' : '#ffc84b');
      }
      for (let k = 0; k < 8; k++) {
        g.save(); g.translate(30 + k * 24, 268 - (k % 3) * 10); g.rotate(-.4 + k * .12);
        rect(g, -6, -9, 13, 19, '#fff8e7');
        rect(g, -6, -9, 13, 2, '#d4e5ee');
        rect(g, 1, 4, 6, 4, '#1d3f8f');
        g.restore();
      }
    }
    g.restore();
    quantize(c);
    return c;
  }

  A.buildUrsula = function () {
    const idle = [];
    for (let i = 0; i < 2; i++) idle.push(paintUrsula({ mode: 'idle', phase: i / 2 }));
    const frames = {
      idle,
      attack: paintUrsula({ mode: 'attack', phase: 0 }),
      hurt: paintUrsula({ mode: 'hurt', phase: 0 }),
      rage: paintUrsula({ mode: 'rage', phase: 0 })
    };
    A.ursulaFrames = frames;
    A.ursula = { w: URSULA_W, h: URSULA_H, ax: 120, ay: 292, frames };
  };

  /* ---- ground stile 5: vetro/asfalto europeo ---- */
  function buildGroundEuropa() {
    const c = canvas(320, 58), g = c.getContext('2d');
    const rand = mulberry32(5050);
    // cordolo in pietra chiara
    g.fillStyle = '#d4e5ee'; g.fillRect(0, 0, 320, 3);
    g.fillStyle = '#c3ccd6'; g.fillRect(0, 3, 320, 4);
    g.fillStyle = '#a3aab5'; g.fillRect(0, 7, 320, 2);
    // asfalto lucido
    g.fillStyle = '#48576e'; g.fillRect(0, 9, 320, 41);
    g.fillStyle = '#3f4d63'; g.fillRect(0, 12, 320, 35);
    const rand2 = mulberry32(515);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = rand2() > .5 ? 'rgba(159,215,255,.12)' : 'rgba(15,22,32,.2)';
      g.fillRect(rand2() * 318, 11 + rand2() * 36, 1 + rand2() * 4, 1);
    }
    // riflessi di vetro (strisce verticali)
    for (let x = 20; x < 320; x += 76) {
      g.fillStyle = 'rgba(110,141,187,.2)';
      g.fillRect(x, 10, 14, 38);
      g.fillStyle = 'rgba(255,255,255,.1)';
      g.fillRect(x + 2, 10, 4, 38);
    }
    // strisce pedonali / segnaletica blu UE
    for (let x = 0; x < 320; x += 80) {
      g.fillStyle = 'rgba(212,229,238,.75)';
      g.fillRect(x + 14, 34, 44, 3);
      g.fillStyle = 'rgba(29,63,143,.9)';
      g.fillRect(x + 18, 22, 36, 3);
      g.fillStyle = 'rgba(255,200,75,.7)';
      g.fillRect(x + 18, 22, 8, 3);
    }
    // stelle UE dipinte sull'asfalto
    for (const [sx, sy] of [[60, 16], [190, 20], [280, 15]]) {
      stellaEU(g, sx, sy, 4.4, 'rgba(255,200,75,.5)');
    }
    // vetro rotto/piastrelle lucide in basso
    g.fillStyle = '#2e3a50'; g.fillRect(0, 50, 320, 3);
    g.fillStyle = '#3f4d63'; g.fillRect(0, 53, 320, 5);
    for (let x = 0; x < 320; x += 40) {
      g.fillStyle = x % 80 ? 'rgba(212,229,238,.16)' : 'rgba(255,200,75,.12)';
      g.fillRect(x, 51, 38, 1);
    }
    for (let i = 0; i < 3; i++) {
      const x = 40 + i * 110;
      g.strokeStyle = 'rgba(212,229,238,.4)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, 46); g.lineTo(x + 7, 40); g.lineTo(x + 13, 47); g.stroke();
    }
    return c;
  }

  /* ---- props/icone Europa ---- */
  function propBandieraEU() {
    const c = canvas(50, 108), g = c.getContext('2d');
    ellipse(g, 25, 106, 16, 3, 'rgba(11,8,18,.3)');
    rect(g, 22, 18, 6, 88, '#48576e');
    rect(g, 23, 18, 2, 88, '#93aab8');
    circle(g, 25, 16, 5, '#ffc84b');
    circle(g, 25, 16, 3, '#fff3a6');
    line(g, 25, 10, 25, 4, '#8b8e84', 1.4);
    poly(g, [[27, 12], [47, 15], [46, 42], [27, 39]], '#1d3f8f');
    poly(g, [[27, 12], [36, 13.4], [35.4, 40.4], [27, 39]], '#16306e');
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * TAU;
      stellaEU(g, 37 + Math.cos(a) * 8, 26 + Math.sin(a) * 8, 1.6);
    }
    quantize(c);
    return c;
  }

  function propTotemEU() {
    const c = canvas(36, 66), g = c.getContext('2d');
    ellipse(g, 18, 64, 14, 3, 'rgba(11,8,18,.3)');
    rect(g, 4, 26, 28, 38, '#13202f');
    rect(g, 6, 28, 24, 34, '#d4e5ee');
    rect(g, 6, 6, 24, 22, '#1d3f8f');
    cerchioStelleEU(g, 18, 17, 7, 1.5);
    rect(g, 8, 32, 20, 3, '#1d3f8f');
    rect(g, 8, 37, 16, 1, '#8b93a0');
    rect(g, 8, 40, 18, 1, '#8b93a0');
    rect(g, 8, 43, 12, 1, '#8b93a0');
    g.fillStyle = '#1d3f8f'; g.font = 'bold 4px monospace'; g.textAlign = 'center';
    g.fillText('INFO UE', 18, 51);
    g.textAlign = 'left';
    rect(g, 4, 24, 28, 3, '#93aab8');
    quantize(c);
    return c;
  }

  function iconTappo() {
    const c = canvas(20, 18), g = c.getContext('2d');
    rect(g, 2, 3, 16, 10, '#0b0812');
    rect(g, 3, 4, 14, 8, '#5ac457');
    rect(g, 3, 4, 14, 2, '#8eef7c');
    for (let k = 0; k < 5; k++) rect(g, 4 + k * 3, 9, 1, 3, '#2f8a3f');
    // anello
    g.strokeStyle = 'rgba(212,229,238,.85)'; g.lineWidth = 1.6;
    g.beginPath(); g.arc(10, 13, 6, .2, Math.PI - .2); g.stroke();
    quantize(c);
    return c;
  }

  function iconRegolamentoEU() {
    const c = canvas(24, 28), g = c.getContext('2d');
    rect(g, 2, 6, 20, 20, '#f5e9cc');
    rect(g, 1, 4, 20, 20, '#fff8e7');
    rect(g, 1, 4, 20, 3, '#1d3f8f');
    cerchioStelleEU(g, 11, 13, 4, 1.1);
    g.fillStyle = '#1d3f8f'; g.font = 'bold 3px monospace'; g.textAlign = 'center';
    g.fillText('REGOLAMENTO', 20, 22);
    g.textAlign = 'left';
    rect(g, 4, 21, 12, 1, '#a89671');
    quantize(c);
    return c;
  }

  A.buildEuropaProps = function () {
    A.props.bandieraEU = propBandieraEU();
    A.props.totemEU = propTotemEU();
  };
  A.buildEuropaIcons = function () {
    A.icons.tappo = iconTappo();
    A.icons.regolamento = iconRegolamentoEU();
  };
  A.buildEuropaEnemies = function () {
    const painters = { merkel: paintMerkel, francese: paintFrancese, bottiglia: paintBottiglia };
    for (const [type, paint] of Object.entries(painters)) {
      const frames = [];
      for (let i = 0; i < 4; i++) frames.push(paint({ mode: 'walk', phase: i / 4 }));
      frames.push(paint({ mode: 'attack', phase: .2 }));
      frames.push(paint({ mode: 'hurt', phase: 0 }));
      A.enemyFrames[type] = frames;
    }
  };
  A.buildEuropaArt = function () {
    if (A.europaBuilt) return;
    A.europaBuilt = true;
    A.bg.europaSky = buildEuropaSky();
    A.bg.europaFar = buildEuropaFar();
    A.bg.europaMid = buildEuropaMid();
    A.bg.europaNear = buildEuropaNear();
    A.bg.bossEuropa = buildBossEuropa();
    A.groundTiles[5] = buildGroundEuropa();
  };
  // alias stabili per il boot di game.js / feature detection
  A.buildEuropaBoss = A.buildUrsula;
  A.buildUrsulaFrames = A.buildUrsula;
  A.buildCesareFrames = A.buildRomaBoss;


  /* =========================================================
     v2.0 — PESCARA (livelli 6-7): tema diurno psichedelico e
     riviera notturna. Gli stessi builder generano entrambe le
     varianti con palette diverse.
     ========================================================= */
  const PESCARA_DAY = {
    night: false,
    sky: ['#2b1e47', '#6e3e8f', '#c62265', '#ff5b9d', '#ff845d', '#ffc84b'],
    sea: ['#51c7a9', '#3ba4b9', '#2d8ea4', '#217a91', '#17655f'],
    sand: '#ffd88a', sandDk: '#efa72f',
    wallA: '#ffbfd8', wallB: '#f5e9cc', wallC: '#c598e0', wallD: '#ff90b8',
    roof: '#c62265', trim: '#ffc84b', glass: '#9fc1ea', dark: '#4d2c4e',
    neon: '#ff5b9d', neon2: '#51c7a9', glow: 'rgba(255,91,157,.22)'
  };
  const PESCARA_NIGHT = {
    night: true,
    sky: ['#0b1020', '#131a3a', '#1d2538', '#3a2343', '#4b2a63', '#6e3e8f'],
    sea: ['#173a5e', '#122d49', '#1d4467', '#0d2a44', '#0b2238'],
    sand: '#8b7f9e', sandDk: '#4b2a63',
    wallA: '#2b1e47', wallB: '#26182f', wallC: '#3a2343', wallD: '#443067',
    roof: '#6e3e8f', trim: '#ffc84b', glass: '#7280b3', dark: '#1a1222',
    neon: '#ff5b9d', neon2: '#51c7a9', glow: 'rgba(255,91,157,.3)'
  };

  function pescaraSeaGlitter(g, w, y0, y1, pal, rand) {
    for (let i = 0; i < 130; i++) {
      const yy = y0 + rand() * (y1 - y0);
      const len = 2 + rand() * 12;
      g.fillStyle = pal.night
        ? (rand() > .5 ? 'rgba(255,200,75,.28)' : 'rgba(159,215,255,.2)')
        : (rand() > .5 ? 'rgba(255,255,255,.5)' : 'rgba(217,240,245,.32)');
      g.fillRect(rand() * w, yy, len, 1);
    }
  }

  function buildPescaraSky(pal) {
    const c = canvas(640, 360), g = c.getContext('2d');
    const night = pal.night;
    bandedGradient(g, 640, 0, 230, pal.sky, 3);
    const rand = mulberry32(night ? 707 : 313);
    if (!night) {
      // sole synthwave a strisce
      const sx = 472, sy = 150, r = 62;
      g.fillStyle = 'rgba(255,132,93,.2)'; g.beginPath(); g.arc(sx, sy, 110, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,200,75,.22)'; g.beginPath(); g.arc(sx, sy, 84, 0, TAU); g.fill();
      for (let yy = -r; yy < r; yy += 3) {
        const half = Math.sqrt(r * r - yy * yy);
        const cut = yy > 2 && (Math.floor((yy + 2) / 8) % 2 === 1);
        if (cut) continue;
        g.fillStyle = yy < -26 ? '#fff3a6' : yy < 4 ? '#ffe165' : '#ffc84b';
        g.fillRect(Math.round(sx - half), Math.round(sy + yy), Math.round(half * 2), 3);
      }
      // nuvole rosa
      cloud(g, 110, 74, .8, '#ffbfd8', '#c56a9e');
      cloud(g, 300, 48, .5, '#ffbfd8', '#c56a9e');
      cloud(g, 584, 120, .6, '#ff90b8', '#a84e84');
      // gabbiani
      g.strokeStyle = '#66192a'; g.lineWidth = 1;
      for (const [x, y, s] of [[170, 96, 5], [186, 88, 3], [520, 70, 4]]) {
        g.beginPath(); g.moveTo(x - s, y); g.quadraticCurveTo(x - s * .5, y - 3, x, y); g.quadraticCurveTo(x + s * .5, y - 3, x + s, y); g.stroke();
      }
      // coriandoli in cielo
      for (let i = 0; i < 26; i++) {
        g.fillStyle = ['#ff5b9d', '#51c7a9', '#ffc84b', '#c598e0'][i % 4];
        const x = rand() * 640, y = rand() * 200;
        g.save(); g.translate(x, y); g.rotate(rand() * 3);
        g.fillRect(-2, -1, 4, 2); g.restore();
      }
    } else {
      // stelle e luna
      for (let i = 0; i < 90; i++) {
        g.fillStyle = i % 7 === 0 ? 'rgba(255,200,75,.9)' : 'rgba(255,248,231,.6)';
        g.fillRect(rand() * 640, rand() * 190, 1, 1);
      }
      g.fillStyle = 'rgba(255,248,231,.14)'; g.beginPath(); g.arc(492, 78, 46, 0, TAU); g.fill();
      circle(g, 492, 78, 27, '#fff3c4');
      circle(g, 484, 72, 24, '#fff8e7');
      // luna crescente: mordente di cielo
      g.fillStyle = pal.sky[2]; g.beginPath(); g.arc(502, 70, 22, 0, TAU); g.fill();
      // scie di stelle
      g.strokeStyle = 'rgba(255,248,231,.4)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(140, 42); g.lineTo(170, 52); g.stroke();
      g.beginPath(); g.moveTo(370, 96); g.lineTo(394, 104); g.stroke();
      cloud(g, 120, 130, .6, '#3a2343', '#2b1e47');
      cloud(g, 400, 60, .45, '#3a2343', '#2b1e47');
    }
    // mare
    bandedGradient(g, 640, 226, 360, pal.sea, 3);
    g.fillStyle = night ? 'rgba(255,200,75,.2)' : 'rgba(255,243,166,.45)';
    g.fillRect(0, 226, 640, 2);
    pescaraSeaGlitter(g, 640, 232, 350, pal, rand);
    // riflesso del sole/luna
    const rx = night ? 492 : 472;
    for (let i = 0; i < 16; i++) {
      const w = 8 + (i % 3) * 5;
      g.fillStyle = night ? 'rgba(255,243,196,.35)' : 'rgba(255,200,75,.5)';
      g.fillRect(rx - w + Math.sin(i * 1.7) * 7, 232 + i * 7, w * 2, 2);
    }
    // onde
    for (let i = 0; i < 10; i++) {
      g.strokeStyle = night ? 'rgba(159,215,255,.14)' : 'rgba(255,255,255,.22)';
      g.lineWidth = 1;
      const yy = 240 + i * 11;
      g.beginPath();
      for (let x = 0; x <= 640; x += 32) {
        const y = yy + Math.sin((x + i * 40) / 60) * 2;
        if (!x) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
    }
    // battigia
    g.fillStyle = pal.sandDk; g.fillRect(0, 354, 640, 6);
    g.fillStyle = pal.sand; g.fillRect(0, 357, 640, 3);
    return c;
  }

  function pescaraHotel(g, x, w, h, walls, roof, sign, pal) {
    const night = pal.night;
    rect(g, x - 2, 252 - h - 6, w + 4, h + 8, '#13202f');
    rect(g, x, 252 - h, w, h, walls);
    rect(g, x, 252 - h, 5, h, shadeColor(walls, 14));
    rect(g, x + w - 6, 252 - h, 6, h, shadeColor(walls, -18));
    rect(g, x - 3, 252 - h - 7, w + 6, 9, roof);
    rect(g, x - 3, 252 - h - 7, w + 6, 2, shadeColor(roof, 24));
    // balconi e finestre
    const rows = Math.max(3, Math.floor((h - 20) / 22));
    for (let r = 0; r < rows; r++) {
      const wy = 252 - h + 12 + r * 22;
      for (let c2 = 0; c2 < Math.max(2, Math.floor(w / 22)); c2++) {
        const wx = x + 9 + c2 * 22;
        if (wx > x + w - 18) break;
        rect(g, wx, wy, 12, 13, night ? '#131a3a' : '#4d2c4e');
        if (night) {
          const lit = (r * 5 + c2 * 3) % 7 < 3;
          rect(g, wx + 1, wy + 1, 10, 11, lit ? '#ffc84b' : '#1d2538');
          if (lit) rect(g, wx + 4, wy + 1, 3, 11, '#ffe165');
        } else {
          rect(g, wx + 1, wy + 1, 10, 11, pal.glass);
          rect(g, wx + 2, wy + 2, 4, 9, 'rgba(255,255,255,.3)');
        }
        // ringhiera balcone
        rect(g, wx - 1, wy + 14, 14, 2, night ? '#3a2343' : '#fffdf2');
        g.fillStyle = night ? '#2b1e47' : '#ffbfd8';
        g.fillRect(wx - 1, wy + 16, 14, 3);
      }
    }
    // insegna
    if (sign) {
      rect(g, x + w / 2 - 42, 252 - h - 20, 84, 13, '#13202f');
      rect(g, x + w / 2 - 40, 252 - h - 18, 80, 9, night ? '#1d2538' : '#c62265');
      g.fillStyle = night ? pal.neon : '#ffc84b';
      g.font = 'bold 7px monospace'; g.textAlign = 'center';
      g.fillText(sign, x + w / 2, 252 - h - 11);
      g.textAlign = 'left';
      if (night) {
        g.fillStyle = 'rgba(255,91,157,.15)';
        g.beginPath(); g.arc(x + w / 2, 252 - h - 13, 28, 0, TAU); g.fill();
      }
    }
  }

  function construisciPescara(tipo) {
    const pal = tipo;
    const far = canvas(1400, 360), gf = far.getContext('2d');
    const mid = canvas(1900, 360), gm = mid.getContext('2d');
    const near = canvas(2400, 360), gn = near.getContext('2d');
    const rand = mulberry32(tipo.night ? 771 : 422);
    const night = tipo.night;

    /* ---------- FAR: skyline sull'acqua, ruota panoramica ---------- */
    gf.fillStyle = night ? 'rgba(19,26,58,.5)' : 'rgba(255,191,216,.22)';
    gf.fillRect(0, 170, 1400, 80);
    // ruota panoramica
    const wx = 300, wy = 300, wr = 76;
    gf.strokeStyle = night ? '#3a2343' : '#9c62c8'; gf.lineWidth = 3;
    gf.beginPath(); gf.arc(wx, wy - 96, wr, 0, TAU); gf.stroke();
    gf.strokeStyle = night ? '#4d2c4e' : '#c598e0'; gf.lineWidth = 1.4;
    gf.beginPath(); gf.arc(wx, wy - 96, wr - 6, 0, TAU); gf.stroke();
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * TAU;
      const cx = wx + Math.cos(a) * wr, cy = wy - 96 + Math.sin(a) * wr;
      gf.strokeStyle = night ? '#443067' : '#9c62c8'; gf.lineWidth = 1.4;
      gf.beginPath(); gf.moveTo(wx, wy - 96); gf.lineTo(cx, cy); gf.stroke();
      gf.fillStyle = night ? (i % 2 ? '#ffc84b' : '#ff5b9d') : (i % 2 ? '#ff5b9d' : '#51c7a9');
      gf.fillRect(cx - 3, cy - 3, 6, 6);
      if (night) {
        gf.fillStyle = 'rgba(255,91,157,.18)';
        gf.beginPath(); gf.arc(cx, cy, 8, 0, TAU); gf.fill();
      }
    }
    // basamento ruota
    gf.fillStyle = '#13202f'; gf.fillRect(wx - 18, wy - 26, 36, 30);
    gf.fillStyle = night ? '#2b1e47' : '#f5e9cc'; gf.fillRect(wx - 14, wy - 22, 28, 24);
    // skyline hotel sul lungomare
    let x = -20;
    let idx = 0;
    while (x < 1400) {
      const bw = 62 + Math.floor(rand() * 70);
      const bh = 46 + Math.floor(rand() * 90);
      const wall = night ? ['.26182f', '#2b1e47', '#3a2343', '#443067'][idx % 4] : ['#ffbfd8', '#f5e9cc', '#c598e0', '#ff90b8'][idx % 4];
      gf.fillStyle = '#13202f'; gf.fillRect(x - 1, wy - bh - 1, bw + 2, bh + 2);
      gf.fillStyle = wall; gf.fillRect(x, wy - bh, bw, bh);
      gf.fillStyle = night ? '#443067' : shadeColor(wall, 18);
      gf.fillRect(x, wy - bh, bw, 4);
      for (let r = 0; r < Math.floor(bh / 16); r++) {
        for (let c2 = 0; c2 < Math.floor(bw / 14); c2++) {
          const wx2 = x + 5 + c2 * 14, wy2 = wy - bh + 8 + r * 16;
          const lit = night && (r * 3 + c2) % 5 < 2;
          gf.fillStyle = night ? (lit ? '#ffc84b' : '#131a3a') : (rand() > .5 ? '#9fc1ea' : '#ffedb1');
          gf.fillRect(wx2, wy2, 7, 8);
        }
      }
      if (idx % 3 === 0) {
        gf.fillStyle = night ? '#ff5b9d' : '#c62265';
        gf.fillRect(x + bw / 2 - 12, wy - bh + 2, 24, 9);
      }
      x += bw + 4 + Math.floor(rand() * 12);
      idx++;
    }
    // palme in controluce
    for (const px of [140, 560, 880, 1180, 1330]) {
      const ph = 54 + (px % 5) * 10;
      pinoPalm(gf, px, wy + 22, ph, .9, night);
    }
    // ombrelloni sulla spiaggia
    for (let i = 0; i < 9; i++) {
      const ux = 40 + i * 150 + rand() * 30;
      gf.fillStyle = night ? '#2b1e47' : '#fff8e7';
      gf.fillRect(ux, 322, 2, 20);
      gf.fillStyle = night ? '#3a2343' : ['#ff5b9d', '#51c7a9', '#ffc84b'][i % 3];
      gf.beginPath(); gf.moveTo(ux - 18, 324); gf.quadraticCurveTo(ux, 312, ux + 18, 324); gf.closePath(); gf.fill();
    }
    // battigia far
    gf.fillStyle = tipo.sandDk; gf.fillRect(0, 330, 1400, 30);
    gf.fillStyle = tipo.sand; gf.fillRect(0, 330, 1400, 6);
    if (night) {
      for (let i = 0; i < 8; i++) {
        gf.strokeStyle = 'rgba(255,200,75,.18)'; gf.lineWidth = 1;
        gf.beginPath(); gf.arc(70 + i * 180, 320, 22, Math.PI, TAU); gf.stroke();
      }
      // luci del lungomare
      for (let i = 0; i < 14; i++) {
        const lx = 30 + i * 100;
        gf.fillStyle = '#ffc84b'; gf.fillRect(lx, 288, 2, 2);
        gf.fillStyle = 'rgba(255,200,75,.16)';
        gf.beginPath(); gf.arc(lx + 1, 289, 9, 0, TAU); gf.fill();
      }
    }
    // foschia colore sulla falda
    gf.fillStyle = night ? 'rgba(11,16,32,.5)' : 'rgba(255,132,93,.12)';
    gf.fillRect(0, 0, 1400, 200);

    /* ---------- MID: lungomare, hotel, locali ---------- */
    gm.fillStyle = night ? '#131a3a' : '#efa72f'; gm.fillRect(0, 250, 1900, 110);
    gm.fillStyle = night ? '#1d2538' : '#ffd88a'; gm.fillRect(0, 250, 1900, 8);
    gm.fillStyle = night ? '#1a1222' : '#ffc84b'; gm.fillRect(0, 256, 1900, 2);
    pescaraHotel(gm, 60, 250, 150, tipo.wallA, tipo.roof, 'HOTEL MARE', tipo);
    pescaraHotel(gm, 420, 200, 128, tipo.wallB, '#ff5b9d', 'HOTEL SOLE', tipo);
    // discoteca con disco gigante
    const dx = 760;
    rect(gm, dx, 100, 230, 154, '#13202f');
    rect(gm, dx + 3, 103, 224, 148, tipo.wallC);
    rect(gm, dx + 3, 103, 224, 8, '#6e3e8f');
    for (let r = 0; r < 4; r++) {
      for (let c2 = 0; c2 < 7; c2++) {
        const wx2 = dx + 14 + c2 * 30, wy2 = 120 + r * 28;
        rect(gm, wx2, wy2, 18, 16, night ? (r + c2) % 3 === 0 ? '#ff5b9d' : '#131a3a' : '#9fc1ea');
        rect(gm, wx2 + 2, wy2 + 2, 6, 12, 'rgba(255,255,255,.22)');
      }
    }
    // insegna neon DISCOTECA + disco ball sopra
    rect(gm, dx + 46, 84, 138, 18, '#13202f');
    gm.fillStyle = night ? '#ff5b9d' : '#ffc84b';
    gm.font = 'bold 11px monospace'; gm.textAlign = 'center';
    gm.fillText('DISCO CLUB', dx + 115, 97);
    gm.textAlign = 'left';
    if (night) {
      gm.fillStyle = 'rgba(255,91,157,.18)';
      gm.beginPath(); gm.arc(dx + 115, 93, 42, 0, TAU); gm.fill();
    }
    gm.strokeStyle = '#8b8e84'; gm.lineWidth = 1;
    gm.beginPath(); gm.moveTo(dx + 115, 10); gm.lineTo(dx + 115, 60); gm.stroke();
    discoball(gm, dx + 115, 74, 15, night);
    // gelateria
    const gx = 1060;
    rect(gm, gx, 178, 170, 76, '#13202f');
    rect(gm, gx + 3, 181, 164, 72, tipo.wallD);
    for (let k = 0; k < 7; k++) {
      poly(gm, [[gx + k * 24, 181], [gx + 24 + k * 24, 181], [gx + 20 + k * 24, 196], [gx + 4 + k * 24, 196]], k % 2 ? '#fffdf2' : '#ff5b9d');
    }
    rect(gm, gx + 18, 206, 134, 40, '#4d2c4e');
    rect(gm, gx + 18, 206, 134, 3, '#c598e0');
    gm.fillStyle = '#fff8e7'; gm.font = 'bold 8px monospace'; gm.textAlign = 'center';
    gm.fillText('GELATERIA', gx + 85, 176);
    gm.textAlign = 'left';
    for (let k = 0; k < 5; k++) circle(gm, gx + 34 + k * 26, 224, 7, ['#ffbfd8', '#f5e9cc', '#51c7a9', '#ffc84b', '#c598e0'][k]);
    // ingresso spiaggia
    const sx2 = 1300;
    rect(gm, sx2, 196, 120, 58, '#13202f');
    rect(gm, sx2 + 3, 199, 114, 52, night ? '#2b1e47' : '#51c7a9');
    gm.fillStyle = '#fff8e7'; gm.font = 'bold 7px monospace'; gm.textAlign = 'center';
    gm.fillText('SPIAGGIA', sx2 + 60, 214);
    gm.fillStyle = '#ffc84b'; gm.fillRect(sx2 + 30, 222, 60, 3);
    gm.textAlign = 'left';
    // palme sul lungomare
    for (const px of [340, 700, 990, 1270, 1460, 1620, 1800]) {
      pinoPalm(gm, px, 254, 90 + (px % 7) * 6, 1, night);
    }
    // ombrelloni e sdraio in spiaggia
    for (let i = 0; i < 8; i++) {
      const ux = 30 + i * 236 + (i % 2) * 30;
      gm.fillStyle = night ? '#3a2343' : '#fff8e7';
      gm.fillRect(ux, 270, 2, 34);
      gm.fillStyle = night ? (i % 2 ? '#6e3e8f' : '#2b8e82') : ['#ff5b9d', '#51c7a9', '#ffc84b', '#c598e0'][i % 4];
      gm.beginPath(); gm.moveTo(ux - 22, 272); gm.quadraticCurveTo(ux, 256, ux + 22, 272); gm.closePath(); gm.fill();
      gm.fillStyle = night ? 'rgba(19,26,58,.6)' : 'rgba(255,208,138,.7)';
      gm.fillRect(ux - 16, 292, 32, 8);
    }
    // locale sulla spiaggia con lucine
    const bb = 1540;
    rect(gm, bb, 208, 190, 46, night ? '#26182f' : '#8d5016');
    rect(gm, bb, 208, 190, 6, night ? '#443067' : '#c87b1e');
    for (let k = 0; k < 8; k++) {
      rect(gm, bb + 10 + k * 22, 220, 14, 24, night ? '#131a3a' : '#4d2c4e');
      if (night) {
        rect(gm, bb + 12 + k * 22, 222, 10, 20, '#ffc84b');
        gm.fillStyle = 'rgba(255,200,75,.2)';
        gm.beginPath(); gm.arc(bb + 17 + k * 22, 232, 16, 0, TAU); gm.fill();
      }
    }
    gm.fillStyle = night ? '#51c7a9' : '#fff8e7'; gm.font = 'bold 8px monospace'; gm.textAlign = 'center';
    gm.fillText('SPRITZ & TRAPANI', bb + 95, 204);
    gm.textAlign = 'left';
    // lucine tra i lampioni
    for (let i = 0; i < 6; i++) {
      const x0 = 40 + i * 310, x1 = x0 + 250;
      gm.strokeStyle = night ? 'rgba(255,200,75,.45)' : 'rgba(255,248,231,.65)';
      gm.lineWidth = 1;
      gm.beginPath(); gm.moveTo(x0, 190); gm.quadraticCurveTo((x0 + x1) / 2, 206, x1, 190); gm.stroke();
      for (let k = 0; k < 7; k++) {
        const t2 = (k + 1) / 8;
        const px = x0 + (x1 - x0) * t2;
        const py = 190 + Math.sin(t2 * Math.PI) * 14;
        gm.fillStyle = k % 2 ? '#ffc84b' : '#ff5b9d';
        gm.fillRect(px - 1, py, 2, 3);
        if (night) {
          gm.fillStyle = 'rgba(255,200,75,.16)';
          gm.beginPath(); gm.arc(px, py, 5, 0, TAU); gm.fill();
        }
      }
    }
    // cartello PESCARA
    const px2 = 1180;
    rect(gm, px2 + 20, 158, 5, 42, '#1d2538');
    rect(gm, px2 + 2, 138, 42, 24, '#13202f');
    rect(gm, px2 + 4, 140, 38, 20, night ? '#1d3f8f' : '#ff5b9d');
    gm.fillStyle = '#fff8e7'; gm.font = 'bold 6px monospace'; gm.textAlign = 'center';
    gm.fillText('PESCARA', px2 + 23, 148);
    gm.fillText('MARE', px2 + 23, 155);
    gm.textAlign = 'left';
    // foschia/vibrazione psichedelica
    gm.fillStyle = night ? 'rgba(11,16,32,.28)' : 'rgba(255,91,157,.06)';
    gm.fillRect(0, 0, 1900, 260);
    disegnaPescaraNear(gn, pal);

    return { far, mid, near, pal };
  }

  function disegnaPescaraNear(gn, pal) {
    const night = pal.night;
    const rand = mulberry32(night ? 882 : 355);
    // pavimento lungomare
    gn.fillStyle = night ? '#1d2538' : '#ffc84b'; gn.fillRect(0, 258, 2400, 48);
    gn.fillStyle = night ? '#26182f' : '#ffd88a'; gn.fillRect(0, 258, 2400, 8);
    for (let x = 0; x < 2400; x += 48) {
      gn.fillStyle = night ? (x / 48 % 2 ? '#2b1e47' : '#221a33') : (x / 48 % 2 ? '#ffbfd8' : '#ff90b8');
      gn.fillRect(x, 266, 46, 8);
      gn.fillStyle = night ? '#443067' : '#fff8e7';
      gn.fillRect(x, 258, 46, 2);
    }
    // cordolo
    gn.fillStyle = night ? '#131a3a' : '#c62265'; gn.fillRect(0, 300, 2400, 6);
    // palme
    for (const [px, s] of [[90, 1.2], [700, 1], [1360, 1.15], [2050, 1.05]]) {
      pinoPalm(gn, px, 262, 132 * s, s, night);
    }
    // beach bar tiki (capanna con pali, non sospesa)
    const bx = 220;
    rect(gn, bx + 8, 244, 6, 18, night ? '#3a2343' : '#5c3415');
    rect(gn, bx + 226, 244, 6, 18, night ? '#3a2343' : '#5c3415');
    rect(gn, bx, 204, 240, 42, night ? '#26182f' : '#8d5016');
    rect(gn, bx, 204, 240, 5, night ? '#443067' : '#c87b1e');
    rect(gn, bx + 6, 236, 228, 9, night ? '#3a2343' : '#c87b1e');
    rect(gn, bx + 6, 236, 228, 2, night ? '#6e3e8f' : '#e59e5d');
    // tetto di paglia con sporgenza
    poly(gn, [[bx - 16, 206], [bx + 120, 182], [bx + 256, 206], [bx + 240, 212], [bx + 120, 196], [bx, 212]], night ? '#443067' : '#cbb98e');
    for (let k = 0; k < 10; k++) {
      poly(gn, [[bx - 10 + k * 27, 205], [bx + 3 + k * 27, 188], [bx + 10 + k * 27, 190], [bx + 2 + k * 27, 207]], k % 2 ? (night ? '#3a2343' : '#9e8c68') : (night ? '#2b1e47' : '#cbb98e'));
    }
    // boccali e bottiglie sul bancone
    for (let k = 0; k < 6; k++) {
      rect(gn, bx + 30 + k * 32, 228, 3, 9, night ? '#443067' : '#fffdf2');
      if (night) {
        gn.fillStyle = '#ffc84b';
        gn.fillRect(bx + 34 + k * 32, 222, 5, 6);
        gn.fillStyle = 'rgba(255,200,75,.16)';
        gn.beginPath(); gn.arc(bx + 36 + k * 32, 225, 8, 0, TAU); gn.fill();
      }
    }
    gn.fillStyle = night ? '#51c7a9' : '#66192a'; gn.font = 'bold 10px monospace'; gn.textAlign = 'center';
    gn.fillText('TIKI BAR', bx + 120, 220);
    gn.textAlign = 'left';
    // sgabelli
    for (let k = 0; k < 3; k++) {
      const sx3 = bx + 40 + k * 64;
      gn.fillStyle = '#13202f'; gn.fillRect(sx3, 246, 26, 5);
      gn.fillStyle = night ? '#ff5b9d' : '#c62265'; gn.fillRect(sx3 + 2, 247, 22, 3);
      gn.fillStyle = '#7280b3'; gn.fillRect(sx3 + 11, 251, 3, 11);
      gn.fillStyle = '#13202f'; gn.fillRect(sx3 + 4, 260, 18, 2);
    }
    // dischi in vinile giganti appoggiati
    const vinile = (vx, vy, r, col) => {
      circle(gn, vx, vy, r, '#13202f');
      circle(gn, vx, vy, r - 3, col);
      gn.strokeStyle = 'rgba(11,8,18,.4)'; gn.lineWidth = 1;
      for (let k = 1; k <= 4; k++) { gn.beginPath(); gn.arc(vx, vy, r - 3 - k * 5, 0, TAU); gn.stroke(); }
      circle(gn, vx, vy, r * .28, '#ffc84b');
      circle(gn, vx, vy, r * .14, '#13202f');
      if (night) {
        gn.fillStyle = 'rgba(255,91,157,.18)';
        gn.beginPath(); gn.arc(vx, vy, r + 12, 0, TAU); gn.fill();
      }
    };
    vinile(640, 200, 54, night ? '#6e3e8f' : '#ff5b9d');
    vinile(1900, 214, 44, night ? '#2b8e82' : '#51c7a9');
    // tavolini con spritz
    for (let k = 0; k < 4; k++) {
      const tx3 = 760 + k * 130;
      gn.fillStyle = '#13202f'; gn.fillRect(tx3, 246, 30, 4);
      gn.fillStyle = night ? '#443067' : '#fffdf2'; gn.fillRect(tx3 + 2, 244, 26, 3);
      gn.fillStyle = '#7280b3'; gn.fillRect(tx3 + 13, 250, 3, 12);
      gn.fillStyle = '#ff845d'; gn.fillRect(tx3 + 8, 236, 6, 8);
      gn.fillStyle = '#ffc84b'; gn.fillRect(tx3 + 15, 234, 5, 10);
      if (night) {
        gn.fillStyle = 'rgba(255,200,75,.2)';
        gn.beginPath(); gn.arc(tx3 + 12, 240, 8, 0, TAU); gn.fill();
      }
    }
    // insegna neon SPRITZ (notte) / gelati (giorno)
    const neonSign = (nx, ny, label, col, glowCol) => {
      rect(gn, nx, ny, 116, 22, '#13202f');
      gn.fillStyle = col; gn.font = 'bold 12px monospace'; gn.textAlign = 'center';
      gn.fillText(label, nx + 58, ny + 16);
      gn.textAlign = 'left';
      if (night) {
        gn.fillStyle = glowCol;
        gn.beginPath(); gn.arc(nx + 58, ny + 11, 34, 0, TAU); gn.fill();
        gn.fillStyle = '#fff8e7'; gn.font = 'bold 12px monospace'; gn.textAlign = 'center';
        gn.fillText(label, nx + 57, ny + 15);
        gn.textAlign = 'left';
      }
    };
    neonSign(1160, 174, night ? 'SPRITZ' : 'GELATI', night ? '#ff5b9d' : '#66192a', 'rgba(255,91,157,.26)');
    neonSign(2180, 190, night ? 'APERITIVO' : 'RICCIONE', night ? '#51c7a9' : '#66192a', 'rgba(81,199,169,.22)');
    // cartellone anni 80 con forme
    const px3 = 980;
    rect(gn, px3, 196, 120, 62, '#13202f');
    rect(gn, px3 + 3, 199, 114, 56, night ? '#1d2538' : '#fffdf2');
    for (let k = 0; k < 5; k++) {
      gn.fillStyle = ['#ff5b9d', '#ffc84b', '#51c7a9', '#c598e0', '#ff845d'][k];
      if (k % 2) {
        gn.beginPath(); gn.arc(px3 + 18 + k * 21, 214 + (k % 3) * 10, 9, 0, TAU); gn.fill();
        gn.fillStyle = 'rgba(255,255,255,.4)';
        gn.beginPath(); gn.arc(px3 + 15 + k * 21, 211 + (k % 3) * 10, 3, 0, TAU); gn.fill();
      } else {
        gn.save(); gn.translate(px3 + 18 + k * 21, 220 + (k % 2) * 12); gn.rotate(.6);
        gn.fillRect(-7, -7, 14, 14); gn.restore();
      }
    }
    gn.fillStyle = '#66192a'; gn.font = 'bold 5px monospace'; gn.textAlign = 'center';
    gn.fillText('PIACEVOLEZZA', px3 + 60, 252);
    gn.textAlign = 'left';
    // coriandoli / lucciole
    for (let i = 0; i < 46; i++) {
      const px = rand() * 2400, py = 120 + rand() * 130;
      if (night) {
        gn.fillStyle = i % 3 ? 'rgba(255,200,75,.7)' : 'rgba(255,91,157,.6)';
        gn.fillRect(px, py, 2, 2);
        gn.fillStyle = 'rgba(255,200,75,.1)';
        gn.beginPath(); gn.arc(px + 1, py + 1, 4, 0, TAU); gn.fill();
      } else {
        gn.save(); gn.translate(px, py); gn.rotate(rand() * 3);
        gn.fillStyle = ['#ff5b9d', '#51c7a9', '#ffc84b', '#c598e0', '#ff845d'][i % 5];
        gn.fillRect(-2, -1, 4, 2); gn.restore();
      }
    }
    // festoni di luci
    for (let i = 0; i < 5; i++) {
      const x0 = 60 + i * 470, x1 = x0 + 380;
      gn.strokeStyle = night ? 'rgba(255,200,75,.5)' : 'rgba(198,34,101,.5)';
      gn.lineWidth = 1.4;
      gn.beginPath(); gn.moveTo(x0, 150); gn.quadraticCurveTo((x0 + x1) / 2, 178, x1, 150); gn.stroke();
      for (let k = 0; k < 9; k++) {
        const t2 = (k + 1) / 10;
        const px = x0 + (x1 - x0) * t2;
        const py = 150 + Math.sin(t2 * Math.PI) * 26;
        gn.fillStyle = ['#ffc84b', '#ff5b9d', '#51c7a9'][k % 3];
        gn.fillRect(px - 1, py, 2, 3);
        if (night) {
          gn.fillStyle = 'rgba(255,200,75,.18)';
          gn.beginPath(); gn.arc(px, py, 6, 0, TAU); gn.fill();
        }
      }
    }
    // pavimento psichedelico in primo piano
    for (let x = 0; x < 2400; x += 32) {
      const col = night ? (x / 32 % 2 ? '#221a33' : '#1a1222') : (x / 32 % 2 ? '#ff90b8' : '#ffbfd8');
      gn.fillStyle = col; gn.fillRect(x, 304, 30, 2);
    }
    // bagnanti/ombrelloni lontano
    for (let i = 0; i < 5; i++) {
      const ux = 300 + i * 430 + rand() * 60;
      gn.fillStyle = night ? '#2b1e47' : '#fff8e7'; gn.fillRect(ux, 276, 2, 26);
      gn.fillStyle = night ? '#3a2343' : ['#ff5b9d', '#51c7a9', '#ffc84b'][i % 3];
      gn.beginPath(); gn.moveTo(ux - 16, 278); gn.quadraticCurveTo(ux, 266, ux + 16, 278); gn.closePath(); gn.fill();
    }
    return gn.canvas;
  }

  function pinoPalm(g, x, baseY, h, s = 1, night = false) {
    g.save(); g.translate(x, baseY); g.scale(s, s);
    g.strokeStyle = night ? '#2b1e47' : '#8d5016'; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(5, -h * .5, -4, -h); g.stroke();
    g.strokeStyle = night ? '#443067' : '#c87b1e'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(5, -h * .5, -4, -h); g.stroke();
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI + i * Math.PI / 7;
      g.save(); g.translate(-4, -h); g.rotate(a);
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(16, -9, 32, 1);
      g.quadraticCurveTo(17, 4, 0, 6);
      g.closePath();
      g.fillStyle = night ? (i % 2 ? '#2b8e82' : '#17655f') : (i % 2 ? '#1c562a' : '#2f8a3f');
      g.fill();
      g.strokeStyle = night ? 'rgba(81,199,169,.3)' : 'rgba(19,32,47,.6)';
      g.lineWidth = 1; g.stroke();
      g.restore();
    }
    circle(g, -4, -h, 3, night ? '#443067' : '#5c3415');
    g.restore();
  }

  function discoball(g, x, y, r, night) {
    g.fillStyle = 'rgba(255,255,255,.12)';
    g.beginPath(); g.arc(x, y, r + 8, 0, TAU); g.fill();
    circle(g, x, y, r, night ? '#7280b3' : '#d4e5ee');
    g.strokeStyle = 'rgba(19,32,47,.5)'; g.lineWidth = 1;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 5; j++) {
        const px = x - r + 3 + i * (r * 2 - 6) / 6;
        const py = y - r + 3 + j * (r * 2 - 6) / 4;
        const d2 = (px - x) * (px - x) + (py - y) * (py - y);
        if (d2 < (r - 2) * (r - 2)) {
          g.fillStyle = (i + j) % 2 ? '#fffdf2' : '#93aab8';
          g.fillRect(px, py, 3, 3);
        }
      }
    }
    line(g, x, y - r - 8, x, y - r - 18, '#8b8e84', 1.2);
  }


  /* ---- ground stile 6: moquette psichedelica/hotel ---- */
  function buildGroundPescara() {
    const c = canvas(320, 58), g = c.getContext('2d');
    const rand = mulberry32(6061);
    // bordo oro
    g.fillStyle = '#ffc84b'; g.fillRect(0, 0, 320, 3);
    g.fillStyle = '#efa72f'; g.fillRect(0, 3, 320, 3);
    g.fillStyle = '#8d5016'; g.fillRect(0, 6, 320, 1);
    // moquette viola
    g.fillStyle = '#4b2a63'; g.fillRect(0, 7, 320, 42);
    g.fillStyle = '#3a2343'; g.fillRect(0, 12, 320, 32);
    // onde psichedeliche
    const waves = ['#ff5b9d', '#c62265', '#ff845d', '#ffc84b', '#51c7a9', '#9c62c8'];
    for (let wv = 0; wv < 6; wv++) {
      g.strokeStyle = waves[wv];
      g.lineWidth = 2.4;
      g.beginPath();
      for (let x = 0; x <= 320; x += 8) {
        const y = 14 + wv * 5 + Math.sin((x + wv * 20) / 38) * 3.4;
        if (!x) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
      if (wv % 2 === 0) {
        g.strokeStyle = 'rgba(255,255,255,.25)';
        g.lineWidth = .9;
        g.beginPath();
        for (let x = 0; x <= 320; x += 8) {
          const y = 14 + wv * 5 + Math.sin((x + wv * 20) / 38) * 3.4 - 1.4;
          if (!x) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.stroke();
      }
    }
    // cerchi e stelle
    for (let i = 0; i < 7; i++) {
      const cx = 16 + i * 46 + rand() * 10, cy = 18 + rand() * 22;
      g.strokeStyle = i % 2 ? 'rgba(255,200,75,.5)' : 'rgba(81,199,169,.45)';
      g.lineWidth = 1.6;
      g.beginPath(); g.arc(cx, cy, 4 + (i % 3), 0, TAU); g.stroke();
      if (i % 2) stellaEU(g, cx, cy, 3, 'rgba(255,200,75,.6)');
    }
    // coriandoli incastonati
    for (let i = 0; i < 30; i++) {
      g.fillStyle = ['#ff5b9d', '#51c7a9', '#ffc84b', '#c598e0'][i % 4];
      g.fillRect(rand() * 318, 10 + rand() * 34, 2, 1);
    }
    // bordo scuro
    g.fillStyle = '#2b1e47'; g.fillRect(0, 49, 320, 4);
    g.fillStyle = '#221a33'; g.fillRect(0, 53, 320, 5);
    g.fillStyle = 'rgba(255,200,75,.3)'; g.fillRect(0, 49, 320, 1);
    return c;
  }

  /* ---- FIAT TIPO 3 VOLUMI GRIGIA (vista laterale) ---- */
  function drawTipoWheel(g, cx, cy, angle) {
    circle(g, cx, cy, 16.5, '#0b0812');
    circle(g, cx, cy, 15, '#1a1222');
    circle(g, cx, cy, 14, '#1d2538');
    circle(g, cx, cy, 9.5, '#d4e5ee');
    circle(g, cx, cy, 8.6, '#93aab8');
    g.save();
    g.translate(cx, cy);
    g.rotate(angle);
    g.strokeStyle = '#48576e'; g.lineWidth = 1.8;
    for (let i = 0; i < 5; i++) {
      g.rotate(TAU / 5);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -6.6); g.stroke();
    }
    circle(g, 0, 0, 3.2, '#41505f');
    circle(g, 0, 0, 1.7, '#d4e5ee');
    g.restore();
    g.strokeStyle = 'rgba(11,8,18,.6)'; g.lineWidth = 1;
    g.beginPath(); g.arc(cx, cy, 14, 0, TAU); g.stroke();
  }

  function disegnaTipoBody(g) {
    const ink = '#0b0812';
    const body = '#93aab8', bodyDk = '#657a8b', bodyLt = '#d4e5ee', trim = '#41505f';
    // sagoma 3 volumi: baule, abitacolo (finestrino ritagliato da gameplay
    // su x76..152 y25..53), cofano
    g.beginPath();
    g.moveTo(14, 82);
    g.lineTo(11, 76);
    g.lineTo(9, 70);
    g.lineTo(11, 62);
    g.lineTo(15, 57);
    g.lineTo(16, 54);
    g.lineTo(64, 54);
    g.lineTo(70, 26);
    g.lineTo(76, 16);
    g.lineTo(150, 16);
    g.lineTo(158, 26);
    g.lineTo(161, 54);
    g.lineTo(204, 58);
    g.lineTo(208, 66);
    g.lineTo(210, 78);
    g.lineTo(206, 82);
    g.closePath();
    g.fillStyle = body; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2.4; g.stroke();
    // tetto e montanti (restano sopra/sotto il ritaglio del finestrino)
    rect(g, 80, 17, 64, 3, bodyLt);
    rect(g, 74, 20, 80, 5, body);
    poly(g, [[64, 54], [70, 26], [76, 26], [70, 54]], bodyDk);
    poly(g, [[150, 26], [158, 26], [161, 54], [152, 54]], body);
    // cristalli (lo sfondo abitacolo lo disegna gameplay)
    poly(g, [[71, 27], [151, 27], [156, 53], [67, 53]], '#6e8dbb');
    poly(g, [[74, 28], [100, 28], [100, 52], [70, 52]], '#9fc1ea');
    poly(g, [[122, 28], [150, 28], [154, 52], [122, 52]], '#9fc1ea');
    g.fillStyle = 'rgba(255,255,255,.35)';
    poly(g, [[78, 30], [88, 30], [84, 50], [76, 50]], 'rgba(255,255,255,.3)');
    poly(g, [[126, 30], [136, 30], [132, 50], [126, 50]], 'rgba(255,255,255,.25)');
    // fiancata: parte bassa sotto la linea di cintura
    rect(g, 20, 54, 184, 26, body);
    rect(g, 20, 54, 184, 2, bodyDk);
    rect(g, 20, 66, 184, 8, bodyDk);
    rect(g, 20, 66, 184, 1, trim);
    // passaruota
    for (const wx of [48, 172]) {
      circle(g, wx, 77, 19, '#13202f');
      g.strokeStyle = bodyDk; g.lineWidth = 3.4;
      g.beginPath(); g.arc(wx, 77, 20, Math.PI * .92, Math.PI * 2.08); g.stroke();
      g.strokeStyle = bodyLt; g.lineWidth = 1.2;
      g.beginPath(); g.arc(wx, 76, 20, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    }
    // porte, maniglie, specchietto
    line(g, 96, 55, 96, 80, 'rgba(19,32,47,.35)', 1.2);
    line(g, 148, 55, 148, 80, 'rgba(19,32,47,.35)', 1.2);
    rect(g, 104, 58, 12, 3, trim);
    rect(g, 158, 59, 12, 3, trim);
    rect(g, 104, 58, 12, 1, bodyLt);
    rect(g, 158, 59, 12, 1, bodyLt);
    rect(g, 152, 47, 9, 5, bodyDk);
    rect(g, 153, 48, 6, 2, '#9fc1ea');
    // fari, fanalini, frecce
    rect(g, 200, 60, 8, 7, '#fff3a6');
    rect(g, 201, 61, 5, 4, '#ffe165');
    rect(g, 13, 62, 6, 9, '#c62265');
    rect(g, 14, 63, 4, 3, '#ff5b9d');
    rect(g, 202, 71, 5, 3, '#ff845d');
    rect(g, 15, 73, 4, 3, '#ff845d');
    // targa
    rect(g, 170, 70, 24, 8, ink);
    rect(g, 171, 71, 22, 6, '#fffdf2');
    g.fillStyle = '#1d3f8f'; g.font = 'bold 5px monospace'; g.textAlign = 'center';
    g.fillText('DR 001', 182, 76);
    g.textAlign = 'left';
    // logo, badge, cromature, scarico
    g.fillStyle = trim;
    g.beginPath(); g.arc(126, 59, 5, 0, TAU); g.fill();
    g.strokeStyle = bodyLt; g.lineWidth = 1;
    g.beginPath(); g.arc(126, 59, 5, 0, TAU); g.stroke();
    rect(g, 26, 58, 20, 4, '#c62265');
    g.fillStyle = '#fff8e7'; g.font = 'bold 4px monospace'; g.textAlign = 'center';
    g.fillText('TIPO', 36, 61);
    g.textAlign = 'left';
    rect(g, 22, 62, 180, 1, 'rgba(255,255,255,.35)');
    rect(g, 78, 17, 66, 1, 'rgba(255,255,255,.4)');
    rect(g, 14, 84, 194, 2, trim);
    rect(g, 8, 80, 7, 4, '#93aab8');
    rect(g, 8, 80, 7, 1, '#d4e5ee');
    // profilo finestrino: cornice scura che gameplay ritaglia
    g.strokeStyle = trim; g.lineWidth = 1.4;
    g.strokeRect(76.2, 25.2, 75.6, 27.6);
  }

  function buildTipoCar() {
    const W = 220, H = 100;
    const bodyCanvas = canvas(W, H);
    const bg = bodyCanvas.getContext('2d');
    bg.imageSmoothingEnabled = false;
    disegnaTipoBody(bg);
    const frames = [];
    for (let i = 0; i < 4; i++) {
      const c = canvas(W, H);
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.drawImage(bodyCanvas, 0, 0);
      drawTipoWheel(g, 48, 77, i / 4 * TAU);
      drawTipoWheel(g, 172, 77, i / 4 * TAU);
      // ombra a terra sotto i pneumatici
      g.fillStyle = 'rgba(11,8,18,.28)';
      g.beginPath(); g.ellipse(110, 92, 92, 5, 0, 0, TAU); g.fill();
      quantize(c);
      frames.push(c);
    }
    const wheelFrames = [];
    for (let i = 0; i < 4; i++) {
      const c = canvas(40, 40);
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      drawTipoWheel(g, 20, 20, i / 4 * TAU);
      quantize(c);
      wheelFrames.push(c);
    }
    A.tipoCar = {
      w: W, h: H, ax: 60, ay: 92,
      wheelR: 15,
      wheelOffsets: [{ x: 48, y: 77 }, { x: 172, y: 77 }],
      body: bodyCanvas,
      wheels: wheelFrames,
      frames
    };
    return A.tipoCar;
  }

  /* ---- pickup Pescara ---- */
  function iconScontrino() {
    const { c, g, ox, oy } = pickupBase(24, 28, '#ffc84b');
    g.save(); g.translate(ox, oy);
    // scontrino con bordo zigzag
    poly(g, [[4, 2], [20, 2], [20, 26], [17, 22], [14, 26], [11, 22], [8, 26], [4, 22]], '#0b0812');
    poly(g, [[5, 3], [19, 3], [19, 24.4], [16.6, 20.8], [13.6, 24.4], [10.6, 20.8], [8, 24.4], [5, 20.8]], '#fffdf2');
    g.fillStyle = '#1d3f8f'; g.font = 'bold 3px monospace'; g.textAlign = 'center';
    g.fillText('DOGANA', 12, 8);
    g.fillText('EUROPEA', 12, 11.5);
    g.fillStyle = '#8b7f72';
    g.fillRect(7, 14, 10, 1); g.fillRect(7, 16.4, 8, 1); g.fillRect(7, 18.8, 11, 1);
    g.fillStyle = '#66192a'; g.font = 'bold 4px monospace';
    g.fillText('€ 8,50', 12, 25);
    g.fillStyle = '#c62265'; g.fillRect(6, 20, 12, 1);
    // rotolino
    ellipse(g, 19, 8, 2, 3, '#e6d5b0');
    g.textAlign = 'left';
    g.restore();
    return c;
  }

  function iconSpritz() {
    const { c, g, ox, oy } = pickupBase(24, 26, '#ff845d');
    g.save(); g.translate(ox, oy);
    // calice
    poly(g, [[4, 4], [20, 4], [13, 16], [11, 16]], 'rgba(255,248,231,.6)');
    g.strokeStyle = '#d4e5ee'; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(4, 4); g.lineTo(13, 16); g.lineTo(20, 4); g.stroke();
    line(g, 12, 16, 12, 21, '#d4e5ee', 1.4);
    ellipse(g, 12, 21.5, 5, 1.6, '#d4e5ee');
    // liquido arancione
    poly(g, [[5.4, 6], [18.6, 6], [12, 15], [12, 15]], '#ff845d');
    poly(g, [[7, 7], [17, 7], [12, 13]], '#ff5b9d');
    // ghiaccio e bollicine
    rect(g, 9, 8, 3, 3, 'rgba(255,255,255,.7)');
    rect(g, 13, 9, 2, 2, 'rgba(255,255,255,.55)');
    circle(g, 11, 19, 1, 'rgba(255,255,255,.6)');
    circle(g, 15, 20, .8, 'rgba(255,255,255,.5)');
    // fetta d'arancia sul bordo
    circle(g, 18, 5, 3.4, '#ffc84b');
    circle(g, 18, 5, 2.6, '#ff845d');
    circle(g, 18, 5, 1.4, '#ffe165');
    // cannuccia
    line(g, 15, 1, 12, 10, '#51c7a9', 1.6);
    line(g, 15, 1, 12, 10, 'rgba(255,255,255,.4)', .6);
    g.restore();
    return c;
  }

  function iconCaffe() {
    const { c, g, ox, oy } = pickupBase(22, 22, '#8d5016');
    g.save(); g.translate(ox, oy);
    // piattino
    ellipse(g, 14, 20, 9, 2.4, '#d4e5ee');
    ellipse(g, 14, 19.4, 7.4, 1.6, '#fffdf2');
    // tazzina
    rect(g, 7, 10, 12, 9, '#fffdf2');
    rect(g, 7, 10, 12, 1.4, '#e6d5b0');
    ellipse(g, 13, 10, 6, 1.6, '#8d5016');
    rect(g, 19, 12, 3, 4, '#fffdf2');
    rect(g, 19, 12, 1, 4, '#e6d5b0');
    // caffè e schiuma
    ellipse(g, 13, 11, 4.4, 1.1, '#c87b1e');
    ellipse(g, 13, 11, 2.6, .7, '#e59e5d');
    // vapore
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(11, 7); g.quadraticCurveTo(13, 4, 11, 1.4); g.stroke();
    g.beginPath(); g.moveTo(15, 7); g.quadraticCurveTo(17, 4, 15, 1.8); g.stroke();
    g.restore();
    return c;
  }

  /* ---- props Pescara ---- */
  function propOmbrellone() {
    const c = canvas(76, 82), g = c.getContext('2d');
    ellipse(g, 38, 80, 26, 4, 'rgba(11,8,18,.28)');
    rect(g, 36, 20, 4, 60, '#13202f');
    rect(g, 37, 20, 2, 60, '#cbb98e');
    for (let i = 0; i < 6; i++) {
      poly(g, [[4 + i * 12, 34], [16 + i * 12, 34], [38, 8], [38, 8]], i % 2 ? '#ff5b9d' : '#fffdf2');
    }
    g.beginPath(); g.moveTo(2, 34); g.quadraticCurveTo(38, 2, 74, 34); g.closePath();
    g.strokeStyle = '#13202f'; g.lineWidth = 1.6; g.stroke();
    // strisce
    for (let i = 0; i < 6; i++) {
      g.save();
      g.beginPath(); g.moveTo(38, 8); g.arc(38, 34, 36, Math.PI + i * .26, Math.PI + (i + 1) * .26); g.closePath();
      g.clip();
      if (i % 2) { g.fillStyle = '#ff5b9d'; g.fillRect(0, 0, 76, 40); }
      g.restore();
    }
    g.beginPath(); g.moveTo(2, 34); g.quadraticCurveTo(38, 2, 74, 34); g.closePath();
    g.strokeStyle = '#13202f'; g.lineWidth = 1.6; g.stroke();
    g.fillStyle = '#ffc84b'; g.beginPath(); g.arc(38, 8, 2.4, 0, TAU); g.fill();
    quantize(c);
    return c;
  }

  function propSdraio() {
    const c = canvas(64, 40), g = c.getContext('2d');
    ellipse(g, 32, 38, 26, 3, 'rgba(11,8,18,.25)');
    // tela a strisce
    for (let i = 0; i < 5; i++) {
      rect(g, 8 + i * 9, 10 + i * 3, 12, 16, i % 2 ? '#51c7a9' : '#fffdf2');
    }
    g.strokeStyle = '#13202f'; g.lineWidth = 1.8;
    g.beginPath(); g.moveTo(6, 12); g.lineTo(28, 30); g.lineTo(58, 34); g.stroke();
    g.strokeStyle = '#8d5016'; g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(8, 12); g.lineTo(28, 28); g.stroke();
    g.beginPath(); g.moveTo(28, 28); g.lineTo(58, 32); g.stroke();
    g.strokeStyle = '#7280b3'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(14, 16); g.lineTo(12, 36); g.stroke();
    g.beginPath(); g.moveTo(50, 30); g.lineTo(50, 38); g.stroke();
    quantize(c);
    return c;
  }

  function propCartelloPescara() {
    const c = canvas(60, 62), g = c.getContext('2d');
    rect(g, 27, 20, 5, 40, '#1d2538');
    rect(g, 28, 20, 2, 40, '#41505f');
    rect(g, 2, 2, 56, 20, '#0b0812');
    rect(g, 4, 4, 52, 16, '#ff5b9d');
    rect(g, 4, 4, 52, 3, '#ffc84b');
    g.fillStyle = '#fff8e7'; g.font = 'bold 6px monospace'; g.textAlign = 'center';
    g.fillText('PESCARA', 30, 13);
    g.fillStyle = '#fff3a6'; g.font = 'bold 4px monospace';
    g.fillText('SPIAGGIA →', 30, 19);
    g.textAlign = 'left';
    ellipse(g, 30, 60, 16, 3, 'rgba(11,8,18,.3)');
    quantize(c);
    return c;
  }

  /* ---- builder Pescara ---- */
  A.buildPescaraArt = function () {
    if (A.pescaraBuilt) return;
    A.pescaraBuilt = true;
    const day = construisciPescara(PESCARA_DAY);
    A.bg.pescaraSky = buildPescaraSky(PESCARA_DAY);
    A.bg.pescaraFar = day.far;
    A.bg.pescaraMid = day.mid;
    A.bg.pescaraNear = day.near;
    const night = construisciPescara(PESCARA_NIGHT);
    A.bg.pescaraNightSky = buildPescaraSky(PESCARA_NIGHT);
    A.bg.pescaraNightFar = night.far;
    A.bg.pescaraNightMid = night.mid;
    A.bg.pescaraNightNear = night.near;
    A.groundTiles[6] = buildGroundPescara();
    buildTipoCar();
  };
  A.buildPescaraProps = function () {
    A.props.ombrellone = propOmbrellone();
    A.props.sdraio = propSdraio();
    A.props.cartelloPescara = propCartelloPescara();
  };
  A.buildPescaraPickups = function () {
    A.pickups.scontrino = iconScontrino();
    A.pickups.spritz = iconSpritz();
    A.pickups.caffe = iconCaffe();
  };
  A.buildPescaraNightArt = A.buildPescaraArt;


  /* =========================================================
     v2.0 — INCUBO SOGEI (livello 8): server room, glitch,
     ufficio del boss con i soldi.
     ========================================================= */
  function scanlines(g, w, h, alpha = .12, step = 3) {
    g.fillStyle = 'rgba(0,0,0,' + alpha + ')';
    for (let y = 0; y < h; y += step) g.fillRect(0, y, w, 1);
  }

  function glitchBar(g, x, y, w, h, col) {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(255,255,255,.25)';
    g.fillRect(x, y, Math.min(4, w), h);
    g.fillStyle = 'rgba(0,0,0,.3)';
    for (let k = 0; k < 3; k++) g.fillRect(x + 2 + k * 9, y + 1, 3, 1);
  }

  function rackServer(g, x, baseY, w, h, rand, tone = 0) {
    rect(g, x - 2, baseY - h - 2, w + 4, h + 4, '#050a12');
    rect(g, x, baseY - h, w, h, tone ? '#1d2538' : '#13202f');
    rect(g, x, baseY - h, w, 4, '#2e3a50');
    rect(g, x + 2, baseY - h + 5, w - 4, h - 9, '#0b1020');
    const rows = Math.max(3, Math.floor((h - 8) / 9));
    for (let r = 0; r < rows; r++) {
      const yy = baseY - h + 8 + r * 9;
      if (yy > baseY - 4) break;
      rect(g, x + 3, yy, w - 6, 6, '#1a2433');
      // led
      const lit = rand() > .45;
      circle(g, x + 6, yy + 3, 1.1, lit ? (rand() > .6 ? '#8eef7c' : '#51c7a9') : '#2f8a3f');
      if (rand() > .7) circle(g, x + 10, yy + 3, 1, '#ffc84b');
      if (rand() > .8) circle(g, x + w - 6, yy + 3, 1, '#c62265');
      // fessure
      g.fillStyle = '#0b1020';
      for (let k = 0; k < 4; k++) g.fillRect(x + 14 + k * 5, yy + 1, 3, 4);
    }
    // cavi che scendono
    g.strokeStyle = tone ? '#443067' : '#1c562a';
    g.lineWidth = 1.2;
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      g.moveTo(x + 4 + k * (w - 8) / 2, baseY - 2);
      g.quadraticCurveTo(x + 2 + k * 6, baseY + 4, x - 2 + k * 5, baseY + 9);
      g.stroke();
    }
  }

  function buildSogeiSky() {
    const c = canvas(640, 360), g = c.getContext('2d');
    const rand = mulberry32(1337);
    // soffitto/ambiente scuro
    bandedGradient(g, 640, 0, 240, ['#05080f', '#0b1020', '#13202f', '#0d2a44', '#153245'], 3);
    // plafoniere al neon
    for (const [lx, col] of [[90, '#51c7a9'], [320, '#9fd7ff'], [560, '#c62265']]) {
      rect(g, lx - 34, 16, 68, 5, '#0b1020');
      rect(g, lx - 30, 18, 60, 3, col);
      g.fillStyle = col + '22';
      poly(g, [[lx - 26, 21], [lx + 26, 21], [lx + 60, 232], [lx - 60, 232]], col + '14');
      g.fillStyle = col + '33';
      g.beginPath(); g.ellipse(lx, 220, 120, 14, 0, 0, TAU); g.fill();
    }
    // rack lontani e monitor
    for (let i = 0; i < 9; i++) {
      const x = 20 + i * 72 + rand() * 12;
      const h = 42 + rand() * 54;
      rackServer(g, x, 232, 34 + rand() * 16, h, rand, i % 2);
    }
    // monitor appesi
    for (const mx of [150, 470, 590]) {
      rect(g, mx, 70, 44, 30, '#050a12');
      rect(g, mx + 2, 72, 40, 26, '#0b1020');
      rect(g, mx + 4, 74, 36, 22, '#13202f');
      g.fillStyle = '#51c7a9'; g.font = 'bold 5px monospace'; g.textAlign = 'center';
      g.fillText('SOGEI', mx + 22, 84);
      g.fillStyle = '#8eef7c'; g.font = 'bold 3px monospace';
      g.fillText('ONLINE', mx + 22, 90);
      g.textAlign = 'left';
      g.fillStyle = 'rgba(81,199,169,.12)';
      g.beginPath(); g.arc(mx + 22, 85, 26, 0, TAU); g.fill();
    }
    // glitch nel cielo (righe)
    for (let i = 0; i < 9; i++) {
      glitchBar(g, rand() * 560, 24 + rand() * 150, 20 + rand() * 70, 2 + (i % 3), i % 2 ? 'rgba(81,199,169,.5)' : 'rgba(198,34,101,.4)');
    }
    // fondo pavimento server room
    bandedGradient(g, 640, 232, 360, ['#0d2a44', '#0b2238', '#0b1020', '#05080f'], 3);
    for (let y = 240; y < 360; y += 12) {
      g.fillStyle = 'rgba(81,199,169,.05)';
      g.fillRect(0, y, 640, 1);
    }
    scanlines(g, 640, 360, .1, 3);
    return c;
  }

  function buildSogeiFar() {
    const w = 1200;
    const c = canvas(w, 360), g = c.getContext('2d');
    const rand = mulberry32(2468);
    // sala server in prospettiva: rack allineati
    g.fillStyle = '#0b1020'; g.fillRect(0, 210, w, 150);
    for (let i = 0; i < 26; i++) {
      const x = i * 48 + (i % 2) * 6;
      rackServer(g, x, 236, 30, 60 + (i * 37 % 58), rand, i % 3 === 0 ? 1 : 0);
    }
    // travi e tubi sul soffitto
    for (let x = 0; x < w; x += 160) {
      rect(g, x, 44, 12, 100, '#0d2a44');
      rect(g, x, 44, 12, 6, '#1d4467');
    }
    g.strokeStyle = '#1d4467'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(0, 64); g.lineTo(w, 64); g.stroke();
    g.strokeStyle = '#153f54'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, 70); g.lineTo(w, 70); g.stroke();
    // cartelli DOGANA/SOGEI
    for (const [sx, label] of [[180, 'SERVER A'], [640, 'SERVER B'], [1040, 'SERVER C']]) {
      rect(g, sx, 140, 84, 22, '#050a12');
      rect(g, sx + 2, 142, 80, 18, '#13202f');
      g.fillStyle = '#8eef7c'; g.font = 'bold 6px monospace'; g.textAlign = 'center';
      g.fillText(label, sx + 42, 152);
      g.fillStyle = '#51c7a9'; g.font = 'bold 4px monospace';
      g.fillText('SOGEI · ONLINE', sx + 42, 158);
      g.textAlign = 'left';
    }
    // pennacchi di cavi
    for (let i = 0; i < 12; i++) {
      const cx = 40 + i * 100;
      g.strokeStyle = i % 3 === 0 ? '#c62265' : i % 3 === 1 ? '#51c7a9' : '#9fd7ff';
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(cx, 80);
      g.bezierCurveTo(cx + 20, 120, cx - 20, 160, cx + 10, 208);
      g.stroke();
    }
    // monitor sospesi
    for (let i = 0; i < 5; i++) {
      const mx = 120 + i * 240;
      line(g, mx, 44, mx, 84, '#1d2538', 1.4);
      rect(g, mx - 24, 84, 48, 32, '#050a12');
      rect(g, mx - 21, 87, 42, 26, '#0b1020');
      rect(g, mx - 19, 89, 38, 22, i % 2 ? '#13202f' : '#122d49');
      g.fillStyle = i % 2 ? '#ff845d' : '#8eef7c'; g.font = 'bold 4px monospace'; g.textAlign = 'center';
      g.fillText(i % 2 ? 'ERRORE' : 'TIMBRA', mx, 98);
      g.fillText(i % 2 ? '404' : 'OK', mx, 104);
      g.textAlign = 'left';
      g.fillStyle = 'rgba(142,239,124,.1)';
      g.beginPath(); g.arc(mx, 100, 30, 0, TAU); g.fill();
    }
    // base opaca
    g.fillStyle = '#0b1020'; g.fillRect(0, 300, w, 60);
    g.fillStyle = '#0d2a44'; g.fillRect(0, 300, w, 5);
    g.fillStyle = 'rgba(81,199,169,.16)';
    for (let x = 0; x < w; x += 24) g.fillRect(x, 304, 20, 1);
    // glitch
    for (let i = 0; i < 16; i++) {
      glitchBar(g, rand() * w, 60 + rand() * 220, 16 + rand() * 80, 2, rand() > .5 ? 'rgba(81,199,169,.45)' : 'rgba(198,34,101,.35)');
    }
    scanlines(g, w, 360, .09, 3);
    return c;
  }

  function buildSogeiMid() {
    const w = 1700;
    const c = canvas(w, 360), g = c.getContext('2d');
    const rand = mulberry32(9753);
    // parete della sala
    g.fillStyle = '#13202f'; g.fillRect(0, 80, w, 230);
    g.fillStyle = '#0d2a44'; g.fillRect(0, 80, w, 8);
    rect(g, 0, 80, w, 2, '#1d4467');
    // fascia dati (binari) e LED lungo la parete
    for (let x = 0; x < w; x += 120) {
      rect(g, x, 92, 112, 5, '#1a2433');
      for (let k = 0; k < 8; k++) circle(g, x + 8 + k * 13, 94, 1.2, rand() > .5 ? '#8eef7c' : '#2f8a3f');
    }
    // grandi rack in primo piano
    for (const [rx, rw, rh] of [[40, 96, 196], [420, 110, 182], [860, 100, 202], [1290, 104, 186]]) {
      rackServer(g, rx, 306, rw, rh, rand, (rx / 40) % 2);
      // etichetta rack
      rect(g, rx + 8, 306 - rh + 8, rw - 16, 14, '#050a12');
      rect(g, rx + 10, 306 - rh + 10, rw - 20, 10, '#0b1020');
      g.fillStyle = '#51c7a9'; g.font = 'bold 5px monospace'; g.textAlign = 'center';
      g.fillText('SOGEI', rx + rw / 2, 306 - rh + 17);
      g.textAlign = 'left';
    }
    // scrivania con tastiere e schermi
    for (const dx of [240, 640, 1060, 1480]) {
      rect(g, dx, 268, 140, 6, '#3a2343');
      rect(g, dx + 4, 274, 6, 30, '#2b1e47');
      rect(g, dx + 128, 274, 6, 30, '#2b1e47');
      // monitor
      rect(g, dx + 8, 220, 62, 44, '#050a12');
      rect(g, dx + 11, 223, 56, 36, '#0b1020');
      rect(g, dx + 13, 225, 52, 32, '#122d49');
      g.fillStyle = '#8eef7c'; g.font = 'bold 4px monospace'; g.textAlign = 'center';
      g.fillText('GESTIONE', dx + 39, 236);
      g.fillText('PRATICHE', dx + 39, 242);
      g.fillStyle = '#ff845d';
      g.fillText('IN CORSO...', dx + 39, 250);
      g.textAlign = 'left';
      g.fillStyle = 'rgba(142,239,124,.1)';
      g.beginPath(); g.arc(dx + 39, 240, 34, 0, TAU); g.fill();
      // tastiera + topo
      rect(g, dx + 16, 262, 48, 5, '#0b1020');
      rect(g, dx + 18, 263, 44, 3, '#1a2433');
      for (let k = 0; k < 9; k++) rect(g, dx + 19 + k * 5, 263, 3, 1, '#2e3a50');
      rect(g, dx + 70, 263, 8, 4, '#1a2433');
      // lampada da tavolo
      line(g, dx + 120, 268, dx + 112, 250, '#41505f', 2);
      ellipse(g, dx + 110, 248, 9, 4, '#ffc84b');
      g.fillStyle = 'rgba(255,200,75,.16)';
      g.beginPath(); g.arc(dx + 110, 252, 22, 0, TAU); g.fill();
    }
    // poster e cartelli
    g.fillStyle = '#13202f'; g.fillRect(600, 110, 120, 70, '#13202f');
    rect(g, 600, 110, 120, 70, '#050a12');
    rect(g, 603, 113, 114, 64, '#f5e9cc');
    g.fillStyle = '#66192a'; g.font = 'bold 8px monospace'; g.textAlign = 'center';
    g.fillText('SICUREZZA', 660, 130);
    g.fillStyle = '#1d3f8f'; g.font = 'bold 5px monospace';
    g.fillText('TIMBRARE TUTTO', 660, 140);
    g.fillStyle = '#8eef7c'; g.font = 'bold 4px monospace';
    g.fillText('SOGEI S.p.A.', 660, 150);
    circle(g, 660, 162, 10, '#c62265');
    circle(g, 660, 162, 7.5, '#ff5b9d');
    g.fillStyle = '#fff8e7'; g.font = 'bold 6px monospace';
    g.fillText('!', 660, 165);
    g.textAlign = 'left';
    // cavi che penzolano dal soffitto
    const cavi = ['#c62265', '#51c7a9', '#9fd7ff', '#ffc84b'];
    for (let i = 0; i < 20; i++) {
      const cx = i * 88 + 16;
      g.strokeStyle = cavi[i % 4]; g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(cx, 84);
      g.bezierCurveTo(cx + 24, 120, cx - 18, 160, cx + 8, 196 + (i % 3) * 12);
      g.stroke();
      g.fillStyle = 'rgba(0,0,0,.3)';
      g.fillRect(cx + 5, 196 + (i % 3) * 12, 4, 6);
    }
    // strisce di avvertimento a terra
    rect(g, 0, 292, w, 14, '#ffc84b');
    for (let x = -20; x < w; x += 40) poly(g, [[x, 292], [x + 20, 292], [x + 10, 306], [x - 10, 306]], '#13202f');
    // glitch e scanline
    for (let i = 0; i < 14; i++) {
      glitchBar(g, rand() * w, 100 + rand() * 180, 20 + rand() * 60, 1 + (i % 2), rand() > .5 ? 'rgba(81,199,169,.4)' : 'rgba(198,34,101,.3)');
    }
    for (let i = 0; i < 8; i++) {
      g.fillStyle = 'rgba(81,199,169,.1)';
      g.fillRect(rand() * w, 90 + rand() * 180, 30, 1);
    }
    scanlines(g, w, 360, .08, 3);
    return c;
  }

  function buildSogeiNear() {
    const w = 2200;
    const c = canvas(w, 360), g = c.getContext('2d');
    const rand = mulberry32(8642);
    // pavimento a grigliato
    g.fillStyle = '#0b1020'; g.fillRect(0, 290, w, 70);
    g.fillStyle = '#0d2a44'; g.fillRect(0, 290, w, 8);
    for (let y = 300; y < 360; y += 14) {
      rect(g, 0, y, w, 10, '#13202f');
      rect(g, 0, y, w, 1, '#1d4467');
      for (let x = (y / 14 % 2) * 20; x < w; x += 40) rect(g, x, y, 1, 10, '#0b1020');
    }
    // tappeti con soldi sotto (posizionati anche in game come sprite)
    for (const cx of [700, 1500, 2000]) {
      rect(g, cx, 276, 120, 12, '#66192a');
      rect(g, cx + 2, 274, 116, 10, '#8f154d');
      rect(g, cx + 4, 274, 116, 2, '#c62265');
      for (let k = 0; k < 3; k++) {
        rect(g, cx + 18 + k * 30, 280, 14, 3, '#ffc84b');
      }
    }
    // rack in primo piano a sinistra
    rackServer(g, 30, 300, 88, 190, rand, 0);
    rackServer(g, 130, 300, 70, 160, rand, 1);
    // scrivania con tastiera e scimmia (l'art ambientale arriva dopo)
    const dx = 300;
    rect(g, dx, 272, 240, 8, '#3a2343');
    rect(g, dx + 4, 280, 8, 26, '#2b1e47');
    rect(g, dx + 228, 280, 8, 26, '#2b1e47');
    rect(g, dx + 30, 262, 80, 8, '#0b1020');
    rect(g, dx + 33, 263, 72, 5, '#1a2433');
    for (let k = 0; k < 14; k++) rect(g, dx + 35 + k * 5, 264, 3, 2, '#2e3a50');
    rect(g, dx + 150, 258, 24, 16, '#0b1020');
    rect(g, dx + 152, 260, 20, 12, '#122d49');
    // casse di faldoni
    for (const bx of [880, 1160, 1860]) {
      rect(g, bx, 246, 90, 54, '#0b1020');
      rect(g, bx + 3, 249, 84, 48, '#8d5016');
      rect(g, bx + 3, 249, 84, 4, '#c87b1e');
      g.fillStyle = '#f5e9cc'; g.font = 'bold 6px monospace'; g.textAlign = 'center';
      g.fillText('PRATICHE', bx + 45, 268);
      g.fillStyle = '#66192a'; g.font = 'bold 4px monospace';
      g.fillText('ARCHIVIO SOGEI', bx + 45, 278);
      g.textAlign = 'left';
    }
    // pila di monitor rotti
    for (const [mx, my] of [[560, 268], [600, 288]]) {
      rect(g, mx, my, 56, 26, '#050a12');
      rect(g, mx + 3, my + 3, 50, 20, '#0b1020');
      g.strokeStyle = '#c62265'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(mx + 8, my + 8); g.lineTo(mx + 18, my + 16); g.lineTo(mx + 14, my + 20); g.stroke();
      glitchBar(g, mx + 8, my + 6, 26, 2, 'rgba(198,34,101,.4)');
    }
    // nastro "NON TOCCARE"
    for (let i = 0; i < 4; i++) {
      const tx4 = 1480 + i * 60;
      rect(g, tx4, 246, 56, 12, '#ffc84b');
      g.save(); g.translate(tx4, 252); g.rotate(-.05);
      g.fillStyle = '#13202f';
      for (let k = 0; k < 3; k++) g.fillRect(k * 20, -6, 10, 12);
      g.restore();
    }
    // cartello "SERVER ROOM"
    rect(g, 1660, 150, 150, 42, '#050a12');
    rect(g, 1663, 153, 144, 36, '#13202f');
    g.fillStyle = '#8eef7c'; g.font = 'bold 9px monospace'; g.textAlign = 'center';
    g.fillText('SERVER ROOM', 1735, 172);
    g.fillStyle = '#51c7a9'; g.font = 'bold 5px monospace';
    g.fillText('ACCESSO VIETATO · SOGEI', 1735, 182);
    g.textAlign = 'left';
    // lucine di emergenza
    for (const ex of [100, 1000, 2060]) {
      ellipse(g, ex, 296, 16, 4, '#c62265');
      g.fillStyle = 'rgba(198,34,101,.2)';
      g.beginPath(); g.arc(ex, 296, 30, 0, TAU); g.fill();
    }
    // glitch e scanline
    for (let i = 0; i < 14; i++) {
      glitchBar(g, rand() * w, 40 + rand() * 220, 24 + rand() * 70, 2, rand() > .5 ? 'rgba(81,199,169,.4)' : 'rgba(198,34,101,.3)');
    }
    scanlines(g, w, 360, .1, 3);
    return c;
  }

  function buildBossSogei() {
    const c = canvas(640, 360), g = c.getContext('2d');
    const rand = mulberry32(4242);
    // ufficio buio
    bandedGradient(g, 640, 0, 250, ['#05080f', '#0b1020', '#13202f', '#1d2538'], 3);
    // vetrata con trama di server
    for (let x = 0; x < 640; x += 64) {
      rect(g, x + 4, 30, 56, 170, '#0b1020');
      rect(g, x + 6, 32, 52, 166, '#13202f');
      for (let r = 0; r < 16; r++) {
        rect(g, x + 9, 36 + r * 10, 46, 5, '#1a2433');
        if (rand() > .6) circle(g, x + 13, 38 + r * 10, 1.2, rand() > .5 ? '#8eef7c' : '#c62265');
      }
      rect(g, x + 4, 30, 56, 3, '#2e3a50');
    }
    // lampade da soffitto
    for (const lx of [150, 320, 490]) {
      rect(g, lx - 26, 8, 52, 4, '#050a12');
      rect(g, lx - 22, 11, 44, 3, '#ffc84b');
      g.fillStyle = 'rgba(255,200,75,.1)';
      poly(g, [[lx - 18, 14], [lx + 18, 14], [lx + 46, 250], [lx - 46, 250]], 'rgba(255,200,75,.07)');
    }
    // scrivania del CEO
    rect(g, 120, 248, 400, 16, '#1a1222');
    rect(g, 124, 242, 392, 8, '#3a2343');
    rect(g, 128, 242, 392, 2, '#66192a');
    // pannello frontale scrivania
    rect(g, 130, 264, 380, 46, '#13202f');
    rect(g, 134, 268, 372, 38, '#0b1020');
    g.fillStyle = '#ffc84b'; g.font = 'bold 8px monospace'; g.textAlign = 'center';
    g.fillText('EX CEO', 320, 288);
    g.fillStyle = '#c62265'; g.font = 'bold 5px monospace';
    g.fillText('IN ATTESA DI GIUDIZIO', 320, 297);
    g.textAlign = 'left';
    // monitor sulla scrivania
    for (const mx of [180, 280, 380]) {
      rect(g, mx, 206, 64, 38, '#050a12');
      rect(g, mx + 3, 209, 58, 30, '#0b1020');
      rect(g, mx + 5, 211, 54, 26, '#122d49');
      g.fillStyle = '#8eef7c'; g.font = 'bold 4px monospace'; g.textAlign = 'center';
      g.fillText('SOGEI', mx + 32, 222);
      g.fillStyle = '#ff845d';
      g.fillText('BONUS', mx + 32, 230);
      g.textAlign = 'left';
      g.fillStyle = 'rgba(81,199,169,.1)';
      g.beginPath(); g.arc(mx + 32, 222, 28, 0, TAU); g.fill();
    }
    // pila di mazzette
    for (const [px, n] of [[80, 7], [520, 8], [560, 4]]) {
      for (let k = 0; k < n; k++) {
        rect(g, px - 24 + (k % 3) * 2, 254 - k * 5, 48, 5, k % 2 ? '#ffc84b' : '#ffe165');
        rect(g, px - 22 + (k % 3) * 2, 255 - k * 5, 30, 1, '#8d5016');
        rect(g, px - 22 + (k % 3) * 2, 255 - k * 5, 8, 3, '#fffdf2');
      }
    }
    // cassaforte aperta a destra
    rect(g, 540, 170, 92, 96, '#050a12');
    rect(g, 543, 173, 86, 90, '#41505f');
    rect(g, 546, 176, 80, 84, '#2e3a50');
    circle(g, 586, 218, 16, '#0b1020');
    circle(g, 586, 218, 12, '#93aab8');
    circle(g, 586, 218, 5, '#1d2538');
    rect(g, 560, 196, 10, 10, '#ffc84b');
    rect(g, 562, 198, 6, 6, '#8d5016');
    // soldi che volano (fase rage si anima in gameplay, qui cornice)
    for (let i = 0; i < 14; i++) {
      const bx = 60 + rand() * 520, by = 60 + rand() * 140;
      g.save(); g.translate(bx, by); g.rotate(rand() * 1.2 - .6);
      rect(g, -9, -5, 18, 10, i % 3 ? '#ffc84b' : '#ffe165');
      rect(g, -9, -5, 18, 2, '#fff3a6');
      rect(g, -5, -2, 8, 4, '#8d5016');
      circle(g, 2, 0, 2, '#c87b1e');
      g.restore();
    }
    // lampada a terra
    for (const lx of [70, 580]) {
      rect(g, lx - 2, 190, 4, 60, '#1d2538');
      poly(g, [[lx - 12, 190], [lx + 12, 190], [lx + 8, 176], [lx - 8, 176]], '#13202f');
      g.fillStyle = 'rgba(255,200,75,.2)';
      g.beginPath(); g.arc(lx, 184, 20, 0, TAU); g.fill();
    }
    // pavimento lucido
    rect(g, 0, 306, 640, 54, '#0b1020');
    g.fillStyle = '#13202f'; g.fillRect(0, 306, 640, 4);
    for (let y = 314; y < 360; y += 12) {
      for (let x = ((y / 12) % 2) * 40; x < 640; x += 80) {
        rect(g, x, y, 78, 10, y % 24 ? '#0d2a44' : '#122d49');
        rect(g, x, y, 78, 1, 'rgba(81,199,169,.12)');
      }
    }
    // riflesso rosso d'emergenza
    g.fillStyle = 'rgba(198,34,101,.08)';
    g.fillRect(0, 0, 640, 360);
    for (let i = 0; i < 10; i++) {
      glitchBar(g, rand() * 580, 20 + rand() * 250, 16 + rand() * 60, 1 + (i % 2), rand() > .5 ? 'rgba(81,199,169,.4)' : 'rgba(198,34,101,.3)');
    }
    scanlines(g, 640, 360, .1, 3);
    return c;
  }

  /* ---- ground stile 7: piastrelle fredde + glitch ---- */
  function buildGroundSogei() {
    const c = canvas(320, 58), g = c.getContext('2d');
    const rand = mulberry32(7097);
    // bordo metallico
    g.fillStyle = '#93aab8'; g.fillRect(0, 0, 320, 2);
    g.fillStyle = '#41505f'; g.fillRect(0, 2, 320, 4);
    g.fillStyle = '#1d2538'; g.fillRect(0, 6, 320, 1);
    // piastrelle fredde
    g.fillStyle = '#13202f'; g.fillRect(0, 7, 320, 40);
    for (let r = 0; r < 4; r++) {
      const y = 8 + r * 10;
      for (let x = (r % 2) * 20; x < 320; x += 40) {
        rect(g, x, y, 38, 8, (r + x / 40) % 3 === 0 ? '#1a2433' : '#153245');
        rect(g, x, y, 38, 1, 'rgba(159,215,255,.12)');
        rect(g, x, y + 7, 38, 1, 'rgba(0,0,0,.35)');
      }
    }
    // fughe luminose
    for (let x = 0; x < 320; x += 40) {
      g.fillStyle = 'rgba(81,199,169,.16)';
      g.fillRect(x, 7, 1, 40);
    }
    // grate di aerazione
    for (const gx of [60, 210]) {
      rect(g, gx, 22, 30, 14, '#050a12');
      rect(g, gx + 2, 24, 26, 10, '#0b1020');
      for (let k = 0; k < 5; k++) rect(g, gx + 4 + k * 5, 24, 2, 10, '#1a2433');
    }
    // glitch a blocchi colorati
    for (let i = 0; i < 7; i++) {
      glitchBar(g, rand() * 300, 10 + rand() * 30, 10 + rand() * 30, 2, rand() > .5 ? 'rgba(81,199,169,.5)' : 'rgba(198,34,101,.4)');
    }
    // linea di avvertimento
    g.fillStyle = '#ffc84b'; g.fillRect(0, 47, 320, 2);
    g.fillStyle = '#c62265'; g.fillRect(0, 49, 320, 2);
    g.fillStyle = '#0b1020'; g.fillRect(0, 51, 320, 7);
    for (let x = 0; x < 320; x += 20) {
      g.fillStyle = x % 40 ? '#13202f' : '#1d2538';
      g.fillRect(x, 51, 18, 7);
    }
    // scanline
    scanlines(g, 320, 58, .12, 3);
    return c;
  }


  /* =========================================================
     v2.0 — NEMICI SOGEI (84x90: 4 walk + attack + hurt)
     ========================================================= */
  function paintSoftware(o) {
    const g = canvas(84, 90).getContext('2d');
    const img = g.canvas;
    const mode = o.mode || 'walk';
    const t = o.phase || 0;
    const bob = mode === 'walk' ? Math.sin(t * TAU) * 3 : Math.sin(t * TAU * 2) * 1;
    const ink = '#0b0812';
    const win = '#f2fbff', winDk = '#b8dce7', title = '#2d648c', titleLt = '#4f91bd';
    g.save();
    g.translate(0, bob);
    // scia/pixel fluttuanti
    for (let i = 0; i < 4; i++) {
      g.fillStyle = i % 2 ? 'rgba(81,199,169,.5)' : 'rgba(159,215,255,.4)';
      g.fillRect(10 + i * 18, 78 + Math.sin(t * TAU + i) * 3, 4, 2);
    }
    // finestra applicazione
    const wx = 12, wy = 22, ww = 60, wh = 46;
    rect(g, wx - 2, wy - 2, ww + 4, wh + 4, ink);
    rect(g, wx, wy, ww, wh, '#fffdf2');
    rect(g, wx + 1, wy + 1, ww - 2, wh - 2, win);
    // barra del titolo
    rect(g, wx, wy, ww, 10, title);
    rect(g, wx + 1, wy + 1, ww - 2, 8, titleLt);
    rect(g, wx + 1, wy + 1, ww - 2, 2, '#9fd7ff');
    // pallini finestra
    for (let k = 0; k < 3; k++) {
      circle(g, wx + ww - 8 - k * 7, wy + 5, 2.2, ['#ff5b9d', '#ffc84b', '#8eef7c'][k]);
    }
    g.fillStyle = '#1d2538'; g.font = 'bold 4px monospace'; g.textAlign = 'left';
    g.fillText('NUOVA_PRATICA.EXE', wx + 3, wy + 7);
    // contenuto: occhi e bocca
    rect(g, wx + 6, wy + 14, ww - 12, wh - 19, '#e8f6ff');
    const look = mode === 'hurt' ? 0 : Math.sin(t * TAU) > 0 ? 1 : -1;
    if (mode === 'hurt') {
      // finestra crashata
      rect(g, wx + 8, wy + 16, ww - 16, wh - 23, '#1d3f8f');
      g.fillStyle = '#9fd7ff'; g.font = 'bold 4px monospace'; g.textAlign = 'center';
      g.fillText('NON RISPONDE', wx + ww / 2, wy + 26);
      g.fillText('(0x8007)', wx + ww / 2, wy + 32);
      g.textAlign = 'left';
      g.strokeStyle = '#ff845d'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(wx + 10, wy + 15); g.lineTo(wx + ww - 10, wy + 38); g.stroke();
      g.beginPath(); g.moveTo(wx + ww - 10, wy + 15); g.lineTo(wx + 10, wy + 38); g.stroke();
    } else {
      // occhi grandi
      rect(g, wx + 12, wy + 20, 12, 10, '#fffdf2');
      rect(g, wx + 30, wy + 20, 12, 10, '#fffdf2');
      rect(g, wx + 16 + look * 2, wy + 23, 5, 5, '#1a1222');
      rect(g, wx + 34 + look * 2, wy + 23, 5, 5, '#1a1222');
      g.fillStyle = '#4f91bd';
      g.fillRect(wx + 17 + look * 2, wy + 24, 2, 2);
      g.fillRect(wx + 35 + look * 2, wy + 24, 2, 2);
      // bocca
      if (mode === 'attack') {
        rect(g, wx + 18, wy + 33, 20, 5, '#8f154d');
        rect(g, wx + 20, wy + 34, 16, 2, '#fffdf2');
      } else {
        g.strokeStyle = '#8f154d'; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(wx + 18, wy + 35); g.quadraticCurveTo(wx + 26, wy + 38, wx + 36, wy + 34); g.stroke();
      }
    }
    // braccia cursore
    if (mode === 'attack') {
      // lancia floppy
      g.save(); g.translate(70, 34); g.rotate(-.25);
      rect(g, -9, -8, 18, 16, ink);
      rect(g, -8, -7, 16, 14, '#2e3a50');
      rect(g, -8, -7, 16, 4, '#93aab8');
      rect(g, -4, -6, 7, 3, '#1a1222');
      rect(g, -8, 2, 16, 5, '#41505f');
      g.fillStyle = '#fffdf2'; g.font = 'bold 3px monospace'; g.textAlign = 'center';
      g.fillText('DOS', 0, 6);
      g.textAlign = 'left';
      g.restore();
      g.strokeStyle = '#51c7a9'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(64, 40); g.lineTo(74, 44); g.stroke();
    } else {
      // mani pixellose ai lati
      g.fillStyle = '#9fc1ea';
      g.fillRect(wx - 5, wy + 24, 5, 7);
      g.fillRect(wx + ww, wy + 24, 5, 7);
      g.fillStyle = '#d4e5ee';
      g.fillRect(wx - 5, wy + 24, 5, 2);
      g.fillRect(wx + ww, wy + 24, 5, 2);
      if (mode === 'hurt') {
        g.fillStyle = '#c62265';
        g.fillRect(wx - 4, wy + 30, 3, 3);
        g.fillRect(wx + ww + 1, wy + 30, 3, 3);
      }
    }
    // barra attività
    rect(g, wx + 8, wy + 40, ww - 16, 3, '#b8dce7');
    rect(g, wx + 8, wy + 40, (ww - 16) * (mode === 'attack' ? .9 : .45), 3, '#51c7a9');
    // glitch ai bordi
    if (mode !== 'walk' || Math.sin(t * TAU * 3) > .6) {
      glitchBar(g, wx - 4, wy + 12, 8, 2, 'rgba(81,199,169,.7)');
      glitchBar(g, wx + ww - 4, wy + 30, 8, 2, 'rgba(198,34,101,.6)');
    }
    g.restore();
    quantize(img);
    return img;
  }

  function paintProgramma(o) {
    const g = canvas(84, 90).getContext('2d');
    const img = g.canvas;
    const mode = o.mode || 'walk';
    const t = o.phase || 0;
    const walk = Math.sin(t * TAU);
    const step = mode === 'walk' ? walk : 0;
    const ink = '#0b0812';
    const armor = '#93aab8', armorLt = '#d4e5ee', armorDk = '#48576e';
    const app = '#2d648c', appDk = '#1d4467';
    g.save();
    // gambe corte e pesanti
    for (const [fx, dir] of [[34, 1], [52, -1]]) {
      const off = mode === 'walk' ? step * 4 * dir : 0;
      rect(g, fx - 6 + off, 78, 14, 6, '#1d2538');
      rect(g, fx - 5 + off, 78, 12, 4, '#2e3a50');
      rect(g, fx - 6 + off, 84, 14, 2, '#0b1020');
    }
    // icona programma corazzata
    const bx = 12, by = 14, bw = 60, bh = 64;
    // piastre angolari
    rect(g, bx - 2, by - 2, bw + 4, bh + 4, ink);
    rect(g, bx, by, bw, bh, app);
    rect(g, bx + 2, by + 2, bw - 4, bh - 4, appDk);
    rect(g, bx + 2, by + 2, bw - 4, 6, app);
    // icona applicazione dentro
    rect(g, bx + 10, by + 14, bw - 20, 22, '#9fc1ea');
    rect(g, bx + 12, by + 16, bw - 24, 18, '#d4e5ee');
    // "ingranaggio"
    circle(g, bx + bw / 2, by + 25, 8, appDk);
    circle(g, bx + bw / 2, by + 25, 5.4, '#9fc1ea');
    circle(g, bx + bw / 2, by + 25, 2.4, '#1d4467');
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * TAU;
      rect(g, bx + bw / 2 + Math.cos(a) * 9 - 1.6, by + 25 + Math.sin(a) * 9 - 1.6, 3.2, 3.2, appDk);
    }
    // barra installazione
    rect(g, bx + 8, by + 42, bw - 16, 6, ink);
    rect(g, bx + 9, by + 43, bw - 18, 4, '#0b1020');
    const prog = mode === 'attack' ? 1 : 0.55 + Math.abs(walk) * .1;
    rect(g, bx + 9, by + 43, (bw - 18) * prog, 4, '#8eef7c');
    rect(g, bx + 9, by + 43, (bw - 18) * prog, 1, '#fff8e7');
    g.fillStyle = '#8eef7c'; g.font = 'bold 3px monospace'; g.textAlign = 'center';
    g.fillText(mode === 'attack' ? 'INSTALLAZ. COMPLETATA' : 'INSTALLAZIONE IN CORSO', bx + bw / 2, by + 54);
    g.fillText(Math.round(prog * 100) + '%', bx + bw / 2, by + 59);
    g.textAlign = 'left';
    // piastre di corazza
    for (const [px, py, pw, ph] of [[bx - 3, by + 6, 6, 16], [bx + bw - 3, by + 6, 6, 16], [bx - 3, by + bh - 22, 6, 16], [bx + bw - 3, by + bh - 22, 6, 16]]) {
      rect(g, px, py, pw, ph, armorDk);
      rect(g, px, py, pw, 2, armorLt);
      circle(g, px + pw / 2, py + 4, 1, armor);
      circle(g, px + pw / 2, py + ph - 4, 1, armor);
    }
    // scudo "INSTALLAZIONE" davanti
    const shieldX = mode === 'attack' ? 56 : 18;
    if (mode === 'hurt') {
      // icona rotta
      rect(g, 18, 30, 8, 8, '#c62265');
      rect(g, 46, 42, 10, 6, '#c62265');
      glitchBar(g, 20, 50, 30, 3, 'rgba(255,132,93,.8)');
      g.fillStyle = '#ff845d'; g.font = 'bold 4px monospace'; g.textAlign = 'center';
      g.fillText('ERRORE', 42, 24);
      g.textAlign = 'left';
    } else {
      g.save();
      g.translate(shieldX + 8, 52);
      g.rotate(mode === 'attack' ? -.2 : 0);
      rect(g, -16, -20, 32, 40, ink);
      rect(g, -14, -18, 28, 36, armorDk);
      rect(g, -12, -16, 24, 32, armor);
      rect(g, -12, -16, 24, 3, armorLt);
      circle(g, 0, -6, 4, '#8eef7c');
      circle(g, 0, -6, 2.2, '#2f8a3f');
      g.fillStyle = '#1d2538'; g.font = 'bold 3px monospace'; g.textAlign = 'center';
      g.fillText('SCUDO', 0, 4);
      g.fillText('UE', 0, 8);
      g.fillStyle = '#ffc84b';
      g.fillRect(-9, 11, 18, 3);
      g.textAlign = 'left';
      g.restore();
    }
    g.restore();
    quantize(img);
    return img;
  }

  function paintBug(o) {
    const g = canvas(84, 90).getContext('2d');
    const img = g.canvas;
    const mode = o.mode || 'walk';
    const t = o.phase || 0;
    const walk = Math.sin(t * TAU);
    const ink = '#0b0812';
    const shell = '#2f8a3f', shellLt = '#8eef7c', shellDk = '#1c562a';
    g.save();
    g.translate(42, 74 + Math.abs(walk) * 2);
    if (mode === 'walk') g.rotate(walk * .06);
    if (mode === 'hurt') { g.translate(0, 4); g.rotate(.12); }
    // zampe
    g.strokeStyle = ink; g.lineWidth = 2.4;
    for (let k = 0; k < 3; k++) {
      const ph = Math.sin(t * TAU * 2 + k * 1.4) * 3;
      g.beginPath(); g.moveTo(-8, -4 + k * 3); g.lineTo(-16, 2 + k * 3 + ph); g.stroke();
      g.beginPath(); g.moveTo(8, -4 + k * 3); g.lineTo(16, 2 + k * 3 - ph); g.stroke();
    }
    g.strokeStyle = shellDk; g.lineWidth = 1;
    for (let k = 0; k < 3; k++) {
      const ph = Math.sin(t * TAU * 2 + k * 1.4) * 3;
      g.beginPath(); g.moveTo(-8, -4 + k * 3); g.lineTo(-16, 2 + k * 3 + ph); g.stroke();
      g.beginPath(); g.moveTo(8, -4 + k * 3); g.lineTo(16, 2 + k * 3 - ph); g.stroke();
    }
    // corpo
    g.beginPath(); g.ellipse(0, 0, 13, 10, 0, 0, TAU);
    g.fillStyle = shellDk; g.fill();
    g.beginPath(); g.ellipse(0, -1, 11.5, 8.5, 0, 0, TAU);
    g.fillStyle = shell; g.fill();
    g.beginPath(); g.ellipse(-2, -3, 6, 4, -.2, 0, TAU);
    g.fillStyle = shellLt; g.fill();
    // guscio a pixel
    g.fillStyle = shellDk;
    g.fillRect(-8, -2, 2, 2); g.fillRect(2, 1, 2, 2); g.fillRect(-2, 3, 2, 1);
    // ali (fase walk)
    if (mode === 'walk') {
      g.fillStyle = 'rgba(217,240,245,.6)';
      g.beginPath(); g.ellipse(-10, -6, 7, 4, -.7, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(10, -6, 7, 4, .7, 0, TAU); g.fill();
    }
    // testa
    circle(g, 12, -4, 6, shellDk);
    circle(g, 12, -4, 5, shell);
    // occhi
    if (mode === 'hurt') {
      line(g, 9, -6, 12, -3, ink, 1.2);
      line(g, 12, -3, 15, -6, ink, 1.2);
    } else {
      circle(g, 10, -6, 2.2, '#fffdf2');
      circle(g, 14, -5, 2.2, '#fffdf2');
      circle(g, 10.6, -6, 1.2, '#1a1222');
      circle(g, 14.6, -5, 1.2, '#1a1222');
    }
    // antenne
    line(g, 14, -9, 18, -15 + Math.sin(t * TAU * 2) * 1.5, ink, 1.2);
    line(g, 11, -10, 12, -16 + Math.sin(t * TAU * 2 + 1) * 1.5, ink, 1.2);
    circle(g, 18, -16 + Math.sin(t * TAU * 2) * 1.5, 1.4, shellLt);
    circle(g, 12, -17 + Math.sin(t * TAU * 2 + 1) * 1.5, 1.4, shellLt);
    // bocca / attacco
    if (mode === 'attack') {
      g.fillStyle = '#c62265';
      g.beginPath(); g.ellipse(15, 0, 3, 2, 0, 0, TAU); g.fill();
      // getto di pixel
      for (let k = 0; k < 4; k++) {
        g.fillStyle = k % 2 ? '#8eef7c' : '#5ac457';
        g.fillRect(19 + k * 4, -2 - k, 3, 2);
      }
    } else {
      line(g, 13, 2, 17, 2, '#1c562a', 1.2);
    }
    g.restore();
    quantize(img);
    return img;
  }

  function paintErrore(o) {
    const g = canvas(84, 90).getContext('2d');
    const img = g.canvas;
    const mode = o.mode || 'walk';
    const t = o.phase || 0;
    const walk = Math.sin(t * TAU);
    const ink = '#0b0812';
    const red = '#c62265', redLt = '#ff5b9d', redDk = '#8f154d';
    g.save();
    g.translate(0, mode === 'walk' ? Math.abs(walk) * 1.6 : Math.sin(t * TAU) * .8);
    if (mode === 'walk') g.rotate(walk * .035);
    // gambe
    for (const [fx, dir] of [[36, 1], [48, -1]]) {
      const off = mode === 'walk' ? walk * 3 * dir : 0;
      rect(g, fx - 4 + off, 80, 8, 5, '#1d2538');
      rect(g, fx - 5 + off, 85, 10, 2, '#0b1020');
    }
    // triangolo
    g.beginPath(); g.moveTo(42, 8); g.lineTo(70, 78); g.lineTo(14, 78); g.closePath();
    g.fillStyle = ink; g.fill();
    g.beginPath(); g.moveTo(42, 12); g.lineTo(66, 75); g.lineTo(18, 75); g.closePath();
    g.fillStyle = red; g.fill();
    g.beginPath(); g.moveTo(42, 16); g.lineTo(60, 71); g.lineTo(24, 71); g.closePath();
    g.fillStyle = redLt; g.fill();
    g.beginPath(); g.moveTo(42, 22); g.lineTo(56, 68); g.lineTo(28, 68); g.closePath();
    g.fillStyle = red; g.fill();
    // punto esclamativo
    g.fillStyle = '#fffdf2';
    g.fillRect(38, 32, 8, 22);
    g.fillRect(38, 58, 8, 8);
    g.fillStyle = 'rgba(143,21,77,.35)';
    g.fillRect(43, 32, 3, 22);
    g.fillRect(43, 58, 3, 8);
    // occhietti laterali
    if (mode === 'hurt') {
      line(g, 24, 62, 30, 66, ink, 1.6);
      line(g, 54, 66, 60, 62, ink, 1.6);
    } else {
      circle(g, 26, 64, 2.4, '#fffdf2');
      circle(g, 58, 64, 2.4, '#fffdf2');
      circle(g, 26, 64, 1.2, '#1a1222');
      circle(g, 58, 64, 1.2, '#1a1222');
    }
    // braccia: attacco = pannello 404
    if (mode === 'attack') {
      outlinedLimb(g, 62, 66, 72, 56, 5, redDk, ink);
      circle(g, 73, 54, 3, redDk);
      g.save(); g.translate(76, 44); g.rotate(.2);
      rect(g, -12, -10, 25, 17, ink);
      rect(g, -11, -9, 23, 15, '#fffdf2');
      g.fillStyle = '#c62265'; g.font = 'bold 5px monospace'; g.textAlign = 'center';
      g.fillText('404', 0, -1);
      g.fillStyle = '#8b7f72'; g.font = 'bold 3px monospace';
      g.fillText('NOT FOUND', 0, 4);
      g.textAlign = 'left';
      g.fillStyle = '#c62265'; g.fillRect(-10, -7, 20, 1);
      g.restore();
    } else if (mode === 'hurt') {
      outlinedLimb(g, 20, 64, 10, 58, 5, redDk, ink);
      outlinedLimb(g, 62, 66, 72, 62, 5, redDk, ink);
      for (let k = 0; k < 3; k++) {
        g.fillStyle = k % 2 ? '#ff5b9d' : '#ffc84b';
        g.fillRect(8 + k * 4, 48 - k * 5, 3, 3);
      }
    } else {
      outlinedLimb(g, 22, 66, 14, 62, 5, redDk, ink);
      outlinedLimb(g, 62, 66, 70, 62, 5, redDk, ink);
      circle(g, 13, 61, 2.6, redDk);
      circle(g, 71, 61, 2.6, redDk);
    }
    g.restore();
    quantize(img);
    return img;
  }

  function paintCrash(o) {
    const g = canvas(84, 90).getContext('2d');
    const img = g.canvas;
    const mode = o.mode || 'walk';
    const t = o.phase || 0;
    const walk = Math.sin(t * TAU);
    const ink = '#0b0812';
    const blue = '#1d3f8f', blueLt = '#4f91bd', blueDk = '#122d49';
    g.save();
    g.translate(0, mode === 'walk' ? Math.abs(walk) * 2 : 0);
    if (mode === 'walk') g.rotate(walk * .05);
    // gambe
    for (const [fx, dir] of [[32, 1], [52, -1]]) {
      const off = mode === 'walk' ? walk * 5 * dir : 0;
      outlinedLimb(g, fx, 68, fx + off, 80, 5, '#2e3a50', ink);
      rect(g, fx - 5 + off, 80, 12, 4, '#1a1222');
    }
    // schermata blu
    const wx = 10, wy = 16, ww = 64, wh = 52;
    rect(g, wx - 2, wy - 2, ww + 4, wh + 4, ink);
    rect(g, wx, wy, ww, wh, blueDk);
    rect(g, wx + 1, wy + 1, ww - 2, wh - 2, blue);
    if (mode === 'hurt' || mode === 'attack') {
      // glitch: righe sfasate
      for (let i = 0; i < 7; i++) {
        g.fillStyle = i % 2 ? '#c62265' : '#ff5b9d';
        g.fillRect(wx + 2 + (i * 13) % 30, wy + 4 + i * 6, 36 + (i * 7) % 22, 3);
      }
      g.fillStyle = '#0b1020';
      g.font = 'bold 5px monospace'; g.textAlign = 'center';
      g.fillText('FATAL ERROR', wx + ww / 2, wy + 24);
      g.fillStyle = '#fffdf2'; g.font = 'bold 4px monospace';
      g.fillText('0x00000404', wx + ww / 2, wy + 32);
    } else {
      g.fillStyle = '#fffdf2'; g.font = 'bold 5px monospace'; g.textAlign = 'center';
      g.fillText(':(', wx + ww / 2, wy + 18);
      g.fillStyle = '#9fd7ff'; g.font = 'bold 4px monospace';
      g.fillText('SI È VERIFICATO', wx + ww / 2, wy + 28);
      g.fillText('UN ERRORE', wx + ww / 2, wy + 34);
      g.fillStyle = '#ffc84b'; g.font = 'bold 3px monospace';
      g.fillText('PREMI UN TASTO', wx + ww / 2, wy + 44);
    }
    g.textAlign = 'left';
    // faccina sulla schermata (occhi)
    if (mode !== 'hurt') {
      rect(g, wx + 20, wy + 8, 6, 4, '#9fd7ff');
      rect(g, wx + 38, wy + 8, 6, 4, '#9fd7ff');
    } else {
      g.fillStyle = '#fffdf2'; g.font = 'bold 10px monospace'; g.textAlign = 'center';
      g.fillText('X', wx + 23, wy + 14);
      g.fillText('X', wx + 41, wy + 14);
      g.textAlign = 'left';
    }
    // braccine
    if (mode === 'attack') {
      outlinedLimb(g, wx + ww, wy + 22, 76, 14, 4, blueLt, ink);
      circle(g, 77, 12, 2.6, blueLt);
      // scintille
      for (let k = 0; k < 5; k++) {
        g.fillStyle = k % 2 ? '#ffc84b' : '#ff5b9d';
        g.fillRect(70 + k * 3, 4 + (k % 3) * 4, 2, 2);
      }
    } else {
      outlinedLimb(g, wx, wy + 22, 4, 32, 4, blueLt, ink);
      outlinedLimb(g, wx + ww, wy + 22, 80, 32, 4, blueLt, ink);
      circle(g, 3, 33, 2.4, blueLt);
      circle(g, 81, 33, 2.4, blueLt);
    }
    // monitor stand (kamikaze con base)
    rect(g, 36, 68, 12, 6, '#41505f');
    rect(g, 30, 74, 24, 3, '#2e3a50');
    g.restore();
    quantize(img);
    return img;
  }

  function paintComputer(o) {
    const g = canvas(84, 90).getContext('2d');
    const img = g.canvas;
    const mode = o.mode || 'walk';
    const t = o.phase || 0;
    const ink = '#0b0812';
    const caseD = '#93aab8', caseL = '#d4e5ee', caseS = '#48576e';
    g.save();
    // tastiera alla base
    rect(g, 14, 78, 56, 8, ink);
    rect(g, 16, 79, 52, 6, '#8b8e84');
    for (let r = 0; r < 2; r++) {
      for (let k = 0; k < 11; k++) rect(g, 18 + k * 4.6, 80 + r * 2.4, 3.4, 1.6, '#d4e5ee');
    }
    rect(g, 64, 80, 5, 3.4, '#41505f');
    // piedistallo
    rect(g, 34, 66, 16, 12, caseS);
    rect(g, 30, 74, 24, 4, '#41505f');
    // CRT
    const cx = 10, cy = 20, cw = 64, ch = 48;
    rect(g, cx - 2, cy - 2, cw + 4, ch + 4, ink);
    rect(g, cx, cy, cw, ch, caseS);
    rect(g, cx + 3, cy + 3, cw - 6, ch - 8, caseD);
    rect(g, cx + 3, cy + 3, cw - 6, 3, caseL);
    // schermo
    const sx = cx + 7, sy = cy + 8, sw = cw - 22, sh = ch - 16;
    rect(g, sx - 1, sy - 1, sw + 2, sh + 2, ink);
    rect(g, sx, sy, sw, sh, '#0b1020');
    const scan = Math.floor(t * 8) % 3;
    if (mode === 'attack') {
      rect(g, sx + 1, sy + 1, sw - 2, sh - 2, '#c62265');
      g.fillStyle = '#fff8e7'; g.font = 'bold 6px monospace'; g.textAlign = 'center';
      g.fillText('FUOCO', sx + sw / 2, sy + sh / 2 + 2);
      g.textAlign = 'left';
      // cannone dal monitor
      rect(g, sx + sw, sy + sh / 2 - 5, 16, 10, ink);
      rect(g, sx + sw + 1, sy + sh / 2 - 4, 15, 8, caseS);
      rect(g, sx + sw + 12, sy + sh / 2 - 3, 4, 6, '#c62265');
      for (let k = 0; k < 5; k++) {
        g.fillStyle = k % 2 ? '#ffc84b' : '#ff5b9d';
        g.fillRect(78 + k * 2, sy + sh / 2 - 6 + (k % 3) * 3, 2, 2);
      }
    } else if (mode === 'hurt') {
      rect(g, sx + 1, sy + 1, sw - 2, sh - 2, '#13202f');
      g.strokeStyle = '#ff845d'; g.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) {
        g.beginPath(); g.moveTo(sx + 3 + i * 8, sy + 2); g.lineTo(sx + 8 + i * 6, sy + sh - 3); g.stroke();
      }
      g.fillStyle = '#ff5b9d';
      for (let i = 0; i < 6; i++) g.fillRect(sx + 2 + i * 6, sy + 3 + i * 4, 5, 2);
    } else {
      g.fillStyle = '#0d2a44'; g.fillRect(sx + 1, sy + 1, sw - 2, sh - 2);
      g.fillStyle = '#8eef7c'; g.font = 'bold 4px monospace'; g.textAlign = 'left';
      const lines = ['C:\\SOGEI>', 'TIMBRA', 'PRATICA', 'OK'];
      for (let i = 0; i < 4; i++) {
        g.fillText(lines[(i + scan) % 4], sx + 3, sy + 8 + i * 7);
      }
      g.fillStyle = '#51c7a9'; g.fillRect(sx + 2, sy + sh - 4, sw - 4, 2);
      // riflesso
      g.fillStyle = 'rgba(255,255,255,.12)';
      poly(g, [[sx + 3, sy + sh - 3], [sx + sw * .55, sy + 2], [sx + sw * .8, sy + 2], [sx + sw * .3, sy + sh - 3]], 'rgba(255,255,255,.1)');
      g.textAlign = 'left';
    }
    // targhetta
    rect(g, cx + cw - 14, cy + ch - 8, 10, 4, '#41505f');
    circle(g, cx + cw - 9, cy + ch - 6, 1.2, '#8eef7c');
    // antenna
    line(g, cx + 10, cy, cx - 4, cy - 20, '#41505f', 1.6);
    line(g, cx + 14, cy, cx + 22, cy - 16, '#41505f', 1.4);
    circle(g, cx - 4, cy - 21, 1.8, '#ff5b9d');
    circle(g, cx + 22, cy - 17, 1.8, '#ffc84b');
    g.restore();
    quantize(img);
    return img;
  }


  /* =========================================================
     v2.0 — SPRITE AMBIENTALI SOGEI: scimmia alla tastiera,
     uccellino che becca i tasti, contanti sotto il tappeto.
     ========================================================= */
  function paintSogeiMonkey(o) {
    const fr = o.frame || 0;
    const c = canvas(92, 88), g = c.getContext('2d');
    const ink = '#0b0812';
    const fur = '#8d5016', furLt = '#c87b1e', furDk = '#5c3415';
    const skin = '#e7a67d', skinLt = '#f6c7a3';
    // scrivania
    rect(g, 4, 78, 84, 8, '#3a2343');
    rect(g, 4, 78, 84, 2, '#66192a');
    rect(g, 10, 86, 6, 2, '#1a1222');
    rect(g, 76, 86, 6, 2, '#1a1222');
    // tastiera
    rect(g, 22, 72, 48, 7, ink);
    rect(g, 23, 73, 46, 5, '#8b8e84');
    for (let r = 0; r < 2; r++) for (let k = 0; k < 10; k++) rect(g, 25 + k * 4.3, 74 + r * 2.2, 3.2, 1.4, '#d4e5ee');
    // monitor dietro
    rect(g, 58, 30, 30, 24, ink);
    rect(g, 60, 32, 26, 20, '#0b1020');
    rect(g, 62, 34, 22, 16, '#122d49');
    g.fillStyle = '#8eef7c'; g.font = 'bold 3px monospace'; g.textAlign = 'center';
    g.fillText('SOGEI', 73, 40);
    g.fillStyle = '#ff845d'; g.fillText('ERR', 73, 45);
    g.textAlign = 'left';
    g.fillStyle = 'rgba(142,239,124,.12)';
    g.beginPath(); g.arc(73, 42, 22, 0, TAU); g.fill();
    // corpo scimmia
    g.beginPath();
    g.moveTo(28, 44); g.lineTo(56, 44);
    g.quadraticCurveTo(64, 54, 62, 72);
    g.lineTo(24, 72);
    g.quadraticCurveTo(20, 54, 28, 44);
    g.closePath();
    g.fillStyle = fur; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2; g.stroke();
    // pancia chiara
    ellipse(g, 43, 60, 12, 10, skinLt);
    // braccia verso tastiera
    const tap = [fr % 2 === 0 ? 2 : -1, fr % 2 === 0 ? -1 : 2];
    outlinedLimb(g, 30, 50, 30, 62, 7, fur, ink);
    outlinedLimb(g, 30, 62, 34 - tap[0], 71, 6, skin, ink);
    outlinedLimb(g, 56, 50, 56, 62, 7, fur, ink);
    outlinedLimb(g, 56, 62, 52 + tap[1], 71, 6, skin, ink);
    circle(g, 34 - tap[0], 72, 3.4, skin);
    circle(g, 52 + tap[1], 72, 3.4, skin);
    // coda arricciata
    g.strokeStyle = fur; g.lineWidth = 4;
    g.beginPath(); g.moveTo(60, 68); g.bezierCurveTo(78, 70, 86, 60, 78, 50); g.stroke();
    g.strokeStyle = furDk; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(60, 68); g.bezierCurveTo(78, 70, 86, 60, 78, 50); g.stroke();
    // testa
    const hy = 30;
    circle(g, 30, hy + 4, 7, furDk);
    circle(g, 58, hy + 4, 7, furDk);
    circle(g, 30, hy + 4, 4.6, skin);
    circle(g, 58, hy + 4, 4.6, skin);
    g.beginPath(); g.ellipse(44, hy, 16, 15, 0, 0, TAU);
    g.fillStyle = fur; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2; g.stroke();
    // muso
    g.beginPath(); g.ellipse(44, hy + 5, 11, 9, 0, 0, TAU);
    g.fillStyle = skinLt; g.fill();
    // occhi
    circle(g, 38, hy - 2, 3.4, '#fffdf2');
    circle(g, 50, hy - 2, 3.4, '#fffdf2');
    circle(g, 39, hy - 1.6, 1.8, ink);
    circle(g, 51, hy - 1.6, 1.8, ink);
    if (fr % 2) { g.fillStyle = skin; g.fillRect(36, hy - 6, 5, 2); g.fillRect(47, hy - 6, 5, 2); }
    // sopracciglia
    line(g, 34, hy - 7, 41, hy - 6, furDk, 1.8);
    line(g, 47, hy - 6, 54, hy - 7, furDk, 1.8);
    // narici e bocca
    circle(g, 42, hy + 4, 1, ink);
    circle(g, 46, hy + 4, 1, ink);
    if (fr % 2) {
      g.strokeStyle = '#8f154d'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(40, hy + 8); g.quadraticCurveTo(44, hy + 10, 48, hy + 8); g.stroke();
    } else {
      g.strokeStyle = '#8f154d'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(41, hy + 9); g.quadraticCurveTo(44, hy + 7.4, 47, hy + 9); g.stroke();
    }
    // cuffia da ufficio
    g.strokeStyle = '#41505f'; g.lineWidth = 1.6;
    g.beginPath(); g.arc(44, hy, 17, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    rect(g, 60, hy - 1, 4, 6, '#41505f');
    quantize(c);
    return c;
  }

  function paintSogeiBird(o) {
    const fr = o.frame || 0;
    const c = canvas(72, 64), g = c.getContext('2d');
    const ink = '#0b0812';
    const body = '#ffc84b', bodyDk = '#efa72f', belly = '#fff3a6';
    // tastiera
    rect(g, 8, 54, 56, 8, ink);
    rect(g, 10, 55, 52, 6, '#8b8e84');
    for (let r = 0; r < 2; r++) for (let k = 0; k < 11; k++) {
      rect(g, 12 + k * 4.5, 56 + r * 2.6, 3.4, 1.6, '#d4e5ee');
    }
    // tasti premuti (animazione)
    if (fr % 2 === 0) {
      rect(g, 30, 55, 4, 3, '#41505f');
      rect(g, 42, 55, 4, 3, '#41505f');
    }
    // zampe sul bordo tastiera
    line(g, 30, 48, 28, 56, '#c87b1e', 2);
    line(g, 44, 48, 46, 56, '#c87b1e', 2);
    line(g, 27, 56, 24, 57, '#c87b1e', 1.4);
    line(g, 47, 56, 50, 57, '#c87b1e', 1.4);
    // corpo panciuto
    g.beginPath(); g.ellipse(37, 34, 17, 16, 0, 0, TAU);
    g.fillStyle = body; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2; g.stroke();
    g.beginPath(); g.ellipse(37, 38, 11, 11, 0, 0, TAU);
    g.fillStyle = belly; g.fill();
    // ala
    g.beginPath(); g.ellipse(24, 34, 8, 11, -.3, 0, TAU);
    g.fillStyle = bodyDk; g.fill();
    g.strokeStyle = ink; g.lineWidth = 1.4; g.stroke();
    // colletto da impiegato
    rect(g, 29, 22, 16, 3, '#9fc1ea');
    rect(g, 35, 23, 4, 5, '#c62265');
    // testa con becco che becca
    const hy = 16 + (fr % 2 ? 0 : 4);
    circle(g, 37, hy, 12, body);
    g.strokeStyle = ink; g.lineWidth = 2;
    g.beginPath(); g.arc(37, hy, 12, 0, TAU); g.stroke();
    // occhi grandi stile cartone
    circle(g, 32, hy - 3, 5, '#fffdf2');
    circle(g, 43, hy - 3, 5, '#fffdf2');
    circle(g, 33, hy - 3, 2.2, ink);
    circle(g, 42, hy - 3, 2.2, ink);
    g.fillStyle = '#fffdf2';
    circle(g, 34, hy - 4, 1, '#fffdf2');
    circle(g, 43, hy - 4, 1, '#fffdf2');
    // sopracciglio corrucciato (impegno)
    line(g, 28, hy - 8, 35, hy - 7, '#8d5016', 2);
    line(g, 39, hy - 7, 46, hy - 8, '#8d5016', 2);
    // becco
    poly(g, [[37, hy + 3], [50, hy + 6 + (fr % 2 ? 3 : 0)], [37, hy + 9]], '#ff845d');
    poly(g, [[37, hy + 5], [47, hy + 7 + (fr % 2 ? 3 : 0)], [37, hy + 8]], '#d54c42');
    // ciuffo
    g.strokeStyle = bodyDk; g.lineWidth = 2;
    line(g, 36, hy - 12, 33, hy - 17, bodyDk, 2);
    line(g, 38, hy - 12, 38, hy - 18, bodyDk, 2);
    quantize(c);
    return c;
  }

  function paintSogeiCash(o) {
    const fr = o.frame || 0;
    const c = canvas(96, 62), g = c.getContext('2d');
    const ink = '#0b0812';
    const rug = '#8f154d', rugLt = '#c62265', rugDk = '#66192a';
    // ombra
    ellipse(g, 48, 58, 44, 4, 'rgba(11,8,18,.4)');
    // banconote che spuntano sotto il tappeto
    const shift = fr % 2 ? 2 : 0;
    for (let i = 0; i < 5; i++) {
      const bx = 6 + i * 18 + shift;
      g.save(); g.translate(bx, 46 + shift);
      g.rotate(-.3 + i * .12);
      rect(g, -8, -6, 20, 10, '#ffc84b');
      rect(g, -8, -6, 20, 2, '#fff3a6');
      rect(g, -3, -3, 8, 4, '#8d5016');
      circle(g, 4, -1, 1.6, '#c87b1e');
      g.restore();
    }
    // tappeto arrotolato
    rect(g, 6, 30, 84, 22, ink);
    rect(g, 8, 32, 80, 18, rug);
    rect(g, 8, 32, 80, 4, rugLt);
    rect(g, 8, 44, 80, 4, rugDk);
    // motivo del tappeto
    for (let x = 14; x < 84; x += 14) {
      rect(g, x, 36, 8, 7, 'rgba(255,200,75,.6)');
      rect(g, x + 2, 38, 4, 3, rugDk);
    }
    // frange
    for (let x = 6; x < 92; x += 5) {
      g.fillStyle = rugLt;
      g.fillRect(x, 52, 2, 4);
    }
    // angolo rialzato con mazzette
    poly(g, [[6, 30], [30, 24], [34, 34], [8, 38]], rugLt);
    poly(g, [[6, 30], [30, 24], [30, 28], [7, 33]], rugDk);
    // monete
    circle(g, 78, 26, 4, '#ffc84b');
    circle(g, 78, 26, 2.6, '#ffe165');
    circle(g, 86, 30, 3, '#ffc84b');
    circle(g, 86, 30, 1.8, '#ffe165');
    // etichetta "SOTTO IL TAPPETO"
    g.fillStyle = '#ffc84b'; g.font = 'bold 3px monospace'; g.textAlign = 'center';
    g.fillText('SOTTO IL TAPPETO', 48, 42);
    g.textAlign = 'left';
    quantize(c);
    return c;
  }

  A.buildSogeiAmbient = function () {
    const monkey = [];
    for (let i = 0; i < 4; i++) monkey.push(paintSogeiMonkey({ frame: i }));
    A.sogeiMonkey = { w: 92, h: 88, ax: 46, ay: 88, frames: monkey };
    const bird = [];
    for (let i = 0; i < 4; i++) bird.push(paintSogeiBird({ frame: i }));
    A.sogeiBird = { w: 72, h: 64, ax: 36, ay: 63, frames: bird };
    const cash = [];
    for (let i = 0; i < 2; i++) cash.push(paintSogeiCash({ frame: i }));
    A.sogeiCash = { w: 96, h: 62, ax: 48, ay: 60, frames: cash };
  };

  /* =========================================================
     v2.0 — EX CEO SOGEI (boss 8): 240x300, ax=120, ay=292.
     frames: idle[2], attack, hurt, rage.
     ========================================================= */
  const CEO_W = 240, CEO_H = 300;
  function paintCeo(o) {
    const c = canvas(CEO_W, CEO_H), g = c.getContext('2d');
    const mode = o.mode || 'idle';
    const t = o.phase || 0;
    const ink = '#0b0812';
    const suit = '#1d2538', suitLt = '#2e3a50', suitDk = '#13202f';
    const shirt = '#fffdf2', tie = '#c62265';
    const skin = '#e7a67d', skinDk = '#cb7c5f', skinLine = '#9a514e';
    const gold = '#ffc84b', goldDk = '#c87b1e';
    const steel = '#93aab8', steelLt = '#d4e5ee', steelDk = '#48576e';
    const breath = mode === 'idle' ? Math.sin(t * TAU) : 0;
    const rage = mode === 'rage';
    const attack = mode === 'attack';
    const hurt = mode === 'hurt';
    const bob = rage ? -3 : hurt ? 4 : Math.round(breath * 1.3);
    g.save();
    g.translate(0, bob);
    if (hurt) g.translate(-4, 0);

    // aura soldi
    if (rage || attack) {
      g.fillStyle = rage ? 'rgba(255,200,75,.18)' : 'rgba(255,200,75,.1)';
      g.beginPath(); g.arc(120, 168, 116, 0, TAU); g.fill();
      g.fillStyle = rage ? 'rgba(142,239,124,.1)' : 'rgba(81,199,169,.07)';
      g.beginPath(); g.arc(120, 168, 88, 0, TAU); g.fill();
    }
    if (rage) {
      g.strokeStyle = 'rgba(255,200,75,.5)'; g.lineWidth = 3;
      g.beginPath(); g.arc(120, 160, 104, 0, TAU); g.stroke();
      g.strokeStyle = 'rgba(198,34,101,.3)'; g.lineWidth = 1.4;
      g.beginPath(); g.arc(120, 160, 118, 0, TAU); g.stroke();
    }

    // ombra
    g.fillStyle = 'rgba(11,8,18,.35)';
    g.beginPath(); g.ellipse(120, 292, 52, 7, 0, 0, TAU); g.fill();

    // ---- gambe e scarpe lucide
    for (const [lx, dir] of [[103, 1], [137, -1]]) {
      g.save(); g.translate(lx + (hurt ? 3 * dir : 0), 0);
      // pantalone
      rect(g, -12, 208, 24, 74, suit);
      rect(g, -12, 208, 5, 74, suitLt);
      rect(g, 4, 208, 8, 74, suitDk);
      // piega
      line(g, -2, 212, -2, 278, 'rgba(72,87,110,.6)', 1);
      // scarpa
      rect(g, -14, 280, 30, 9, ink);
      rect(g, -13, 281, 28, 7, '#0b1020');
      rect(g, -13, 281, 28, 2, '#41505f');
      rect(g, -10, 287, 22, 2, '#050a12');
      g.restore();
    }

    // ---- giacca
    g.beginPath();
    g.moveTo(90, 108);
    g.lineTo(150, 108);
    g.bezierCurveTo(166, 126, 168, 168, 162, 214);
    g.lineTo(78, 214);
    g.bezierCurveTo(72, 168, 74, 126, 90, 108);
    g.closePath();
    g.fillStyle = suit; g.fill();
    g.strokeStyle = ink; g.lineWidth = 3; g.stroke();
    // camicia
    poly(g, [[110, 106], [130, 106], [128, 186], [112, 186]], shirt);
    // baveri
    poly(g, [[108, 106], [92, 110], [110, 170], [120, 150]], suitLt);
    poly(g, [[132, 106], [148, 110], [130, 170], [120, 150]], suitLt);
    g.strokeStyle = suitDk; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(93, 111); g.lineTo(112, 168); g.stroke();
    g.beginPath(); g.moveTo(147, 111); g.lineTo(128, 168); g.stroke();
    // cravatta
    poly(g, [[118, 108], [122, 108], [124, 150], [120, 160], [116, 150]], tie);
    poly(g, [[116, 104], [124, 104], [122, 112], [118, 112]], tie);
    g.fillStyle = 'rgba(255,144,184,.4)';
    g.fillRect(119, 116, 2, 30);
    // bottoni
    circle(g, 116, 174, 2, gold);
    circle(g, 116, 186, 2, gold);
    // pochette
    poly(g, [[138, 124], [152, 124], [150, 132], [142, 130]], '#ff5b9d');
    poly(g, [[140, 126], [150, 126], [147, 130]], '#fff8e7');
    // revers lato scuro
    g.fillStyle = 'rgba(11,8,18,.22)';
    g.beginPath(); g.moveTo(150, 112); g.bezierCurveTo(166, 140, 168, 180, 162, 212); g.lineTo(154, 212); g.bezierCurveTo(158, 178, 156, 140, 144, 112); g.closePath(); g.fill();
    // orologio d'oro al polsino sinistro
    rect(g, 94, 190, 14, 5, goldDk);
    rect(g, 95, 191, 12, 3, gold);
    rect(g, 98, 192, 6, 1, '#fff3a6');

    // ---- braccio sinistro con valigetta
    if (mode === 'hurt') {
      outlinedLimb(g, 92, 122, 72, 152, 13, suit, ink);
      outlinedLimb(g, 72, 152, 66, 180, 11, suit, ink);
      outlinedLimb(g, 66, 180, 64, 196, 9, skin, ink);
      circle(g, 63, 199, 7, skin);
      // valigetta che cade aperta
      g.save(); g.translate(28, 232); g.rotate(-.4);
      rect(g, -22, -14, 44, 28, ink);
      rect(g, -20, -12, 40, 24, '#8d5016');
      rect(g, -20, -12, 40, 4, '#c87b1e');
      rect(g, -8, -16, 16, 4, '#5c3415');
      rect(g, -2, -6, 4, 5, gold);
      // soldi che escono
      for (let k = 0; k < 4; k++) {
        rect(g, -16 + k * 9, -22 - (k % 2) * 4, 8, 5, '#ffc84b');
      }
      g.restore();
    } else {
      outlinedLimb(g, 92, 122, 74, 154, 13, suit, ink);
      outlinedLimb(g, 74, 154, 70, 182, 11, suit, ink);
      outlinedLimb(g, 70, 182, 68, 198, 9, skin, ink);
      circle(g, 67, 201, 7, skin);
      // valigetta
      g.save(); g.translate(64, 218); g.rotate(-.08);
      rect(g, -22, -14, 44, 30, ink);
      rect(g, -20, -12, 40, 26, '#8d5016');
      rect(g, -20, -12, 40, 5, '#c87b1e');
      rect(g, -20, -12, 40, 2, '#e59e5d');
      rect(g, -8, -17, 16, 5, '#5c3415');
      rect(g, -8, -17, 16, 2, '#8d5016');
      rect(g, -2, -9, 4, 6, gold);
      rect(g, 8, 2, 8, 5, gold);
      g.fillStyle = '#ffc84b'; g.font = 'bold 3px monospace'; g.textAlign = 'center';
      g.fillText('SOGEI', 0, 6);
      g.textAlign = 'left';
      g.restore();
      if (attack) {
        // mazzette che volano dalla valigetta
        for (let k = 0; k < 5; k++) {
          const px = 12 + k * 26, py = 30 + (k % 3) * 24;
          g.save(); g.translate(px, py); g.rotate(-.5 + k * .25);
          rect(g, -10, -6, 20, 11, '#ffc84b');
          rect(g, -10, -6, 20, 2, '#fff3a6');
          rect(g, -4, -3, 8, 4, '#8d5016');
          circle(g, 3, -1, 1.6, '#c87b1e');
          g.restore();
        }
      }
    }

    // ---- braccio destro con mazzetta
    if (mode === 'attack') {
      outlinedLimb(g, 148, 122, 178, 96, 13, suit, ink);
      outlinedLimb(g, 178, 96, 190, 64, 11, suit, ink);
      outlinedLimb(g, 190, 64, 196, 40, 9, skin, ink);
      circle(g, 197, 36, 7, skin);
      g.save(); g.translate(200, 30); g.rotate(-.3);
      for (let k = 0; k < 3; k++) {
        rect(g, -22 + k * 2, -10 + k * 6, 44, 8, k % 2 ? '#ffc84b' : '#ffe165');
        rect(g, -22 + k * 2, -10 + k * 6, 44, 2, '#fff3a6');
        rect(g, -6 + k * 2, -8 + k * 6, 12, 5, '#8d5016');
        circle(g, 1 + k * 2, -5.5 + k * 6, 2, '#c87b1e');
      }
      g.restore();
    } else if (mode === 'hurt') {
      outlinedLimb(g, 148, 122, 170, 148, 13, suit, ink);
      outlinedLimb(g, 170, 148, 178, 174, 11, suit, ink);
      outlinedLimb(g, 178, 174, 184, 192, 9, skin, ink);
      circle(g, 185, 195, 7, skin);
      // mazzette che volano
      for (let k = 0; k < 5; k++) {
        g.save(); g.translate(30 + k * 28, 34 + (k % 2) * 30); g.rotate(-.6 + k * .3);
        rect(g, -10, -6, 20, 11, '#ffc84b');
        rect(g, -10, -6, 20, 2, '#fff3a6');
        rect(g, -4, -3, 8, 4, '#8d5016');
        g.restore();
      }
    } else {
      outlinedLimb(g, 148, 122, 170, 150, 13, suit, ink);
      outlinedLimb(g, 170, 150, 176, 176, 11, suit, ink);
      outlinedLimb(g, 176, 176, 180, 192, 9, skin, ink);
      circle(g, 181, 195, 7, skin);
      g.save(); g.translate(184, 206); g.rotate(.1);
      for (let k = 0; k < 2; k++) {
        rect(g, -18, -12 + k * 7, 36, 6, k % 2 ? '#ffe165' : '#ffc84b');
        rect(g, -4, -11 + k * 7, 9, 4, '#8d5016');
      }
      g.restore();
    }

    // ---- manette ai polsi (sopra le mani) + catena
    const cuff = (cx, cy, rot) => {
      g.save(); g.translate(cx, cy); g.rotate(rot);
      g.strokeStyle = ink; g.lineWidth = 6;
      g.beginPath(); g.arc(0, 0, 8.4, 0, TAU); g.stroke();
      g.strokeStyle = steel; g.lineWidth = 3.6;
      g.beginPath(); g.arc(0, 0, 8.4, 0, TAU); g.stroke();
      g.strokeStyle = steelLt; g.lineWidth = 1.3;
      g.beginPath(); g.arc(0, 0, 8.4, -2.4, -.4); g.stroke();
      g.fillStyle = steelDk;
      g.fillRect(-10, -2, 5, 4);
      g.fillStyle = steelLt;
      g.fillRect(-9, -1, 3, 1);
      g.restore();
    };
    const handL = mode === 'hurt' ? [63, 199] : [67, 201];
    const handR = mode === 'attack' ? [197, 36] : mode === 'hurt' ? [185, 195] : [181, 195];
    const midX = (handL[0] + handR[0]) / 2;
    const midY = Math.max(handL[1], handR[1]) + 24;
    g.strokeStyle = steelDk; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(handL[0], handL[1]);
    g.quadraticCurveTo(midX, midY, handR[0], handR[1]);
    g.stroke();
    for (let k = 1; k < 8; k++) {
      const tt = k / 8;
      const qx = (1 - tt) * (1 - tt) * handL[0] + 2 * (1 - tt) * tt * midX + tt * tt * handR[0];
      const qy = (1 - tt) * (1 - tt) * handL[1] + 2 * (1 - tt) * tt * midY + tt * tt * handR[1];
      g.strokeStyle = steel; g.lineWidth = 1.3;
      g.beginPath(); g.arc(qx, qy, 2.5, 0, TAU); g.stroke();
      g.strokeStyle = steelDk; g.lineWidth = .7;
      g.beginPath(); g.moveTo(qx - 2, qy); g.lineTo(qx + 2, qy); g.stroke();
    }
    cuff(handL[0], handL[1], .22);
    cuff(handR[0], handR[1], -.18);

    // ---- testa
    rect(g, 111, 92, 20, 16, skinDk);
    const headY = 74 + (hurt ? 5 : 0);
    // capelli neri impomatati
    g.fillStyle = '#0b1020';
    g.beginPath(); g.ellipse(120, headY - 8, 25, 19, 0, Math.PI * .95, TAU * 1.02); g.fill();
    g.beginPath(); g.ellipse(120, headY - 4, 24, 14, 0, Math.PI, TAU); g.fill();
    // viso
    g.beginPath();
    g.moveTo(99, headY - 6);
    g.bezierCurveTo(101, headY - 22, 140, headY - 24, 144, headY - 5);
    g.bezierCurveTo(146, headY + 8, 140, headY + 20, 128, headY + 24);
    g.bezierCurveTo(110, headY + 28, 97, headY + 14, 99, headY - 6);
    g.closePath();
    g.fillStyle = skin; g.fill();
    g.strokeStyle = ink; g.lineWidth = 2.6; g.stroke();
    // orecchie
    circle(g, 98, headY + 3, 5, skin);
    circle(g, 144, headY + 3, 5, skinDk);
    g.strokeStyle = ink; g.lineWidth = 1.2;
    g.beginPath(); g.arc(98, headY + 3, 5, 0, TAU); g.stroke();
    g.beginPath(); g.arc(144, headY + 3, 5, 0, TAU); g.stroke();
    // capelli: riga e tempie grigie
    g.fillStyle = '#13202f';
    g.beginPath();
    g.moveTo(98, headY - 6);
    g.bezierCurveTo(100, headY - 26, 142, headY - 28, 145, headY - 6);
    g.bezierCurveTo(144, headY - 14, 126, headY - 18, 120, headY - 16);
    g.bezierCurveTo(112, headY - 17, 102, headY - 13, 98, headY - 6);
    g.closePath(); g.fill();
    g.strokeStyle = ink; g.lineWidth = 1.6; g.stroke();
    g.fillStyle = steel;
    g.beginPath(); g.ellipse(101, headY + 1, 3.4, 8, .2, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(142, headY + 1, 3.4, 8, -.2, 0, TAU); g.fill();
    // sopracciglia e occhi da squalo
    if (hurt) {
      line(g, 104, headY - 1, 114, headY + 2, ink, 2.2);
      line(g, 128, headY + 2, 138, headY - 1, ink, 2.2);
    } else {
      g.strokeStyle = '#0b1020'; g.lineWidth = 2.4;
      g.beginPath(); g.moveTo(103, headY - 4); g.lineTo(115, headY - 2); g.stroke();
      g.beginPath(); g.moveTo(129, headY - 2); g.lineTo(139, headY - 4); g.stroke();
      rect(g, 105, headY - 1, 11, 5, '#fffdf2');
      rect(g, 127, headY - 1, 11, 5, '#fffdf2');
      rect(g, 108, headY, 5, 4, rage ? '#c62265' : '#1a1222');
      rect(g, 130, headY, 5, 4, rage ? '#c62265' : '#1a1222');
      g.fillStyle = 'rgba(255,255,255,.7)';
      g.fillRect(109, headY, 2, 2);
      g.fillRect(131, headY, 2, 2);
      // occhiali da sole alzati sulla fronte
      g.fillStyle = '#0b1020';
      g.fillRect(104, headY - 12, 13, 5);
      g.fillRect(124, headY - 12, 13, 5);
      g.fillRect(117, headY - 11, 7, 2);
      g.fillStyle = '#41505f';
      g.fillRect(105, headY - 11, 3, 2);
      g.fillRect(125, headY - 11, 3, 2);
    }
    // naso
    g.strokeStyle = skinLine; g.lineWidth = 1.8;
    g.beginPath(); g.moveTo(124, headY + 1); g.lineTo(122, headY + 10); g.lineTo(126, headY + 11); g.stroke();
    // bocca/ghigno
    if (attack || rage) {
      g.fillStyle = '#5a0c30';
      g.beginPath(); g.ellipse(122, headY + 18, 12, 5, 0, 0, TAU); g.fill();
      g.fillStyle = '#fffdf2';
      g.fillRect(114, headY + 15, 16, 3);
      g.fillStyle = '#ffc84b';
      g.fillRect(116, headY + 16, 3, 2);
      g.fillRect(126, headY + 16, 3, 2);
    } else if (hurt) {
      g.strokeStyle = '#8f154d'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(112, headY + 19); g.quadraticCurveTo(122, headY + 15, 132, headY + 19); g.stroke();
    } else {
      g.strokeStyle = '#8f154d'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(110, headY + 17); g.quadraticCurveTo(122, headY + 22, 134, headY + 16); g.stroke();
      g.strokeStyle = skinLine; g.lineWidth = 1;
      g.beginPath(); g.moveTo(108, headY + 13); g.lineTo(112, headY + 14); g.stroke();
      g.beginPath(); g.moveTo(136, headY + 13); g.lineTo(132, headY + 14); g.stroke();
    }
    // cicatrice sopracciglio
    line(g, 136, headY - 8, 140, headY - 4, 'rgba(203,124,95,.7)', 1);

    // ---- rage: pioggia di soldi
    if (rage) {
      for (let k = 0; k < 10; k++) {
        const px = 18 + (k * 47) % 210;
        const py = 24 + (k * 37) % 120;
        g.save(); g.translate(px, py); g.rotate(-.6 + k * .19);
        rect(g, -9, -5, 18, 10, k % 2 ? '#ffc84b' : '#ffe165');
        rect(g, -9, -5, 18, 2, '#fff3a6');
        rect(g, -4, -2, 8, 4, '#8d5016');
        g.restore();
      }
      for (let k = 0; k < 6; k++) {
        circle(g, 24 + (k * 39) % 200, 40 + (k * 47) % 150, 3, gold);
        circle(g, 24 + (k * 39) % 200, 40 + (k * 47) % 150, 1.8, '#ffe165');
      }
    }
    g.restore();
    quantize(c);
    return c;
  }

  A.buildCeo = function () {
    const idle = [];
    for (let i = 0; i < 2; i++) idle.push(paintCeo({ mode: 'idle', phase: i / 2 }));
    const frames = {
      idle,
      attack: paintCeo({ mode: 'attack', phase: 0 }),
      hurt: paintCeo({ mode: 'hurt', phase: 0 }),
      rage: paintCeo({ mode: 'rage', phase: 0 })
    };
    A.ceoFrames = frames;
    A.ceo = { w: CEO_W, h: CEO_H, ax: 120, ay: 292, frames };
  };
  A.buildCeoFrames = A.buildCeo;
  A.buildSogeiBoss = A.buildCeo;

  /* ---- props/icone SOGEI ---- */
  function propRack() {
    const c = canvas(58, 120), g = c.getContext('2d');
    const rand = mulberry32(3141);
    ellipse(g, 29, 118, 26, 3, 'rgba(11,8,18,.35)');
    rackServer(g, 4, 116, 50, 108, rand, 0);
    rect(g, 10, 12, 38, 10, '#050a12');
    rect(g, 12, 14, 34, 6, '#13202f');
    g.fillStyle = '#8eef7c'; g.font = 'bold 4px monospace'; g.textAlign = 'center';
    g.fillText('SOGEI', 29, 19);
    g.textAlign = 'left';
    quantize(c);
    return c;
  }

  function propMonitorFO() {
    const c = canvas(48, 50), g = c.getContext('2d');
    ellipse(g, 24, 48, 18, 3, 'rgba(11,8,18,.35)');
    rect(g, 4, 26, 40, 20, '#0b0812');
    rect(g, 6, 28, 36, 16, '#1a2433');
    rect(g, 8, 6, 32, 22, '#050a12');
    rect(g, 10, 8, 28, 18, '#0b1020');
    rect(g, 12, 10, 24, 14, '#122d49');
    g.fillStyle = '#8eef7c'; g.font = 'bold 4px monospace'; g.textAlign = 'center';
    g.fillText('SOGEI', 24, 17);
    g.fillStyle = '#ff845d'; g.fillText('ERR', 24, 22);
    g.textAlign = 'left';
    g.fillStyle = 'rgba(142,239,124,.1)';
    g.beginPath(); g.arc(24, 17, 16, 0, TAU); g.fill();
    for (let k = 0; k < 8; k++) rect(g, 10 + k * 4, 29, 3, 2, '#d4e5ee');
    quantize(c);
    return c;
  }

  function propPilaSoldi() {
    const c = canvas(60, 34), g = c.getContext('2d');
    ellipse(g, 30, 32, 24, 3, 'rgba(11,8,18,.32)');
    for (let k = 0; k < 6; k++) {
      rect(g, 8 + (k % 3) * 2, 26 - k * 4, 44, 4, k % 2 ? '#ffc84b' : '#ffe165');
      rect(g, 10 + (k % 3) * 2, 26 - k * 4, 28, 1, '#8d5016');
      rect(g, 10 + (k % 3) * 2, 26 - k * 4, 7, 2, '#fffdf2');
    }
    circle(g, 46, 20, 4, '#ffc84b');
    circle(g, 46, 20, 2.6, '#ffe165');
    quantize(c);
    return c;
  }

  function iconMazzetta() {
    const c = canvas(28, 20), g = c.getContext('2d');
    for (let k = 0; k < 3; k++) {
      rect(g, 1 + k * 1.5, 2 + k * 5, 24, 5, k % 2 ? '#ffe165' : '#ffc84b');
      rect(g, 1 + k * 1.5, 2 + k * 5, 24, 1, '#fff3a6');
      rect(g, 6 + k * 1.5, 3 + k * 5, 8, 3, '#8d5016');
      circle(g, 17 + k * 1.5, 4.5 + k * 5, 1.6, '#c87b1e');
    }
    g.strokeStyle = '#8d5016'; g.lineWidth = 1;
    g.strokeRect(1, 2, 24, 13);
    quantize(c);
    return c;
  }

  function iconMoneta() {
    const c = canvas(20, 20), g = c.getContext('2d');
    circle(g, 10, 10, 8.5, '#8d5016');
    circle(g, 10, 10, 7.4, '#ffc84b');
    circle(g, 10, 10, 5.2, '#ffe165');
    g.strokeStyle = '#efa72f'; g.lineWidth = 1;
    g.beginPath(); g.arc(10, 10, 6.4, 0, TAU); g.stroke();
    g.fillStyle = '#8d5016'; g.font = 'bold 6px monospace'; g.textAlign = 'center';
    g.fillText('€', 10, 12);
    g.textAlign = 'left';
    g.fillStyle = 'rgba(255,255,255,.5)';
    g.fillRect(6, 5, 3, 2);
    quantize(c);
    return c;
  }

  function iconFloppy() {
    const c = canvas(22, 22), g = c.getContext('2d');
    rect(g, 1, 1, 20, 20, '#0b0812');
    rect(g, 2, 2, 18, 18, '#2e3a50');
    rect(g, 5, 2, 11, 7, '#93aab8');
    rect(g, 7, 3, 7, 4, '#d4e5ee');
    rect(g, 14, 2, 4, 7, '#41505f');
    rect(g, 3, 11, 16, 8, '#48576e');
    rect(g, 5, 12, 12, 3, '#fffdf2');
    g.fillStyle = '#8eef7c'; g.font = 'bold 3px monospace'; g.textAlign = 'center';
    g.fillText('DOS', 11, 18);
    g.textAlign = 'left';
    quantize(c);
    return c;
  }

  A.buildSogeiProps = function () {
    A.props.rack = propRack();
    A.props.monitor = propMonitorFO();
    A.props.pilaSoldi = propPilaSoldi();
  };
  A.buildSogeiIcons = function () {
    A.icons.mazzetta = iconMazzetta();
    A.icons.moneta = iconMoneta();
    A.icons.floppy = iconFloppy();
  };
  A.buildSogeiEnemies = function () {
    const painters = {
      software: paintSoftware, programma: paintProgramma, bug: paintBug,
      errore: paintErrore, crash: paintCrash, computer: paintComputer
    };
    for (const [type, paint] of Object.entries(painters)) {
      const frames = [];
      for (let i = 0; i < 4; i++) frames.push(paint({ mode: 'walk', phase: i / 4 }));
      frames.push(paint({ mode: 'attack', phase: .2 }));
      frames.push(paint({ mode: 'hurt', phase: 0 }));
      A.enemyFrames[type] = frames;
    }
  };
  A.buildSogeiArt = function () {
    if (A.sogeiBuilt) return;
    A.sogeiBuilt = true;
    A.bg.sogeiSky = buildSogeiSky();
    A.bg.sogeiFar = buildSogeiFar();
    A.bg.sogeiMid = buildSogeiMid();
    A.bg.sogeiNear = buildSogeiNear();
    A.bg.bossSogei = buildBossSogei();
    A.groundTiles[7] = buildGroundSogei();
  };
  A.buildSogeiAll = function () {
    A.buildSogeiArt();
    if (!A.sogeiAmbientBuilt) { A.sogeiAmbientBuilt = true; A.buildSogeiAmbient(); }
    if (!A.ceo) A.buildCeo();
  };

  /* @@V2_ART@@ */
  A.bg = {};
  A.groundTiles = {};
  A.buildV1Backgrounds = function () {
    if (A._v1Backgrounds) return;
    A._v1Backgrounds = true;
    A.titleScene = buildTitleScene();
    A.bg.portSky = buildPortSky();
    A.bg.portFar = buildPortFar();
    A.bg.portMid = buildPortMid();
    A.bg.portNear = buildPortNear();
    A.bg.bariSky = buildBariSky();
    A.bg.bariFar = buildBariFar();
    A.bg.bariMid = buildBariMid();
    A.bg.bariNear = buildBariNear();
    A.bg.bossPort = buildBossPort();
    A.bg.bossBasilica = buildBossBasilica();
    A.groundTiles[1] = buildGround(1);
    A.groundTiles[2] = buildGround(2);
    A.groundTiles[3] = buildGround(3);
    // Stanze e soggetti della Direzione Territoriale (livello 3)
    try { A.buildDirezioneRooms(); } catch (e) { console.warn('Stanze Direzione non costruite:', e); }
    // v2.1 — se gli override AI (bg v1 / stanze) erano già stati caricati,
    // riapplicali: l'arte procedurale non deve sovrascrivere i PNG AI.
    try { if (typeof A.reapplyV2 === 'function' && A.v2Loaded) A.reapplyV2(); } catch (e) { /* non bloccante */ }
  };
  /* Compatibilità: costruisce ANCHE tutti i fondali/boss v2 (eager, come v1.3).
     Il boot del gioco usa A.buildBootArt() (v1-only) + A.ensureLevelArt(level). */
  A.buildBackgrounds = function () {
    A.buildV1Backgrounds();
    A._buildThemeParts(['roma', 'europa', 'pescara', 'sogei'], 'bg');
  };

  /* =========================================================
     v2.0 — BOOT LAZY PER TEMA (perf Android: boot <4s)
     -----------------------------------------------------------------
     Al boot si costruiscono SOLO gli asset v1 (buildBootArt): player,
     nemici/boss v1, props/pickup/icone v1, fondali porto/Bari/Direzione.
     I temi v2 (roma, europa, pescara, pescaraNight, sogei: fondali, arene
     boss, ground, nemici, props/pickup/icone, sprite ambientali) vengono
     costruiti al primo ingresso nel livello con ensureTheme/ensureLevelArt,
     in modo SINCRONO e IDEMPOTENTE (guardie per tema/parte).
     API motore:
       Art.buildBootArt()        -> costruisce solo v1 (idempotente)
       Art.ensureTheme(theme)    -> costruisce il tema, true se nuovo lavoro
       Art.ensureLevelArt(level) -> mappa level.customBg/id -> tema e lo costruisce
       Art.buildAll(opts)        -> test/preview: default costruisce TUTTO
     ========================================================= */
  A.THEME_BY_LEVEL_INDEX = ['porto', 'bari', 'direzione', 'roma', 'europa', 'pescara', 'pescaraNight', 'sogei'];
  A.V2_THEMES = ['roma', 'europa', 'pescara', 'pescaraNight', 'sogei'];
  A.themeStatus = { boot: false, bootMs: 0, themes: {}, ms: {} };
  A._themeParts = {};

  function nowMs() {
    return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  }

  // esegue un builder UNA volta sola (idempotenza delle build lazy)
  function v2Once(key, fn) {
    if (A._themeParts[key]) return false;
    A._themeParts[key] = true;
    try { fn(); } catch (e) { A._themeParts[key] = false; throw e; }
    return true;
  }

  // Mappa tema -> parti costruibili. 'pescaraNight' condivide gli asset con
  // 'pescara' (i builder costruiscono già giorno+notte+ground6+Fiat Tipo).
  const THEME_ART = {
    roma: {
      bg: () => { A.buildRomaArt(); A.buildRomaBoss(); },
      props: () => A.buildRomaProps(),
      pickups: () => A.buildRomaPickups(),
      icons: () => A.buildRomaIcons(),
      enemies: () => A.buildRomaEnemies()
    },
    europa: {
      bg: () => { A.buildEuropaArt(); A.buildUrsula(); },
      props: () => A.buildEuropaProps(),
      icons: () => A.buildEuropaIcons(),
      enemies: () => A.buildEuropaEnemies()
    },
    pescara: {
      bg: () => A.buildPescaraArt(),
      props: () => A.buildPescaraProps(),
      pickups: () => A.buildPescaraPickups()
    },
    pescaraNight: { shared: 'pescara' },
    sogei: {
      bg: () => { A.buildSogeiArt(); A.buildCeo(); },
      props: () => A.buildSogeiProps(),
      ambient: () => A.buildSogeiAmbient(),
      icons: () => A.buildSogeiIcons(),
      enemies: () => A.buildSogeiEnemies()
    }
  };

  function normalizeTheme(theme) {
    if (theme == null) return null;
    const t = String(theme);
    if (t === 'v1' || t === 'porto' || t === 'bari' || t === 'direzione' || t === 'title') return 'v1';
    if (t === 'pescara2' || t === 'pescaraNight' || t === 'pescaranight' || t === 'night') return 'pescaraNight';
    if (t === 'roma' || t === 'europa' || t === 'pescara' || t === 'sogei') return t;
    return null;
  }

  /** Costruisce le parti di un elenco di temi (helper per i wrapper eager). */
  A._buildThemeParts = function (themes, part) {
    for (const theme of themes) {
      const def = THEME_ART[theme];
      if (!def) continue;
      const group = def.shared || theme;
      const gdef = THEME_ART[group];
      if (!gdef || typeof gdef[part] !== 'function') continue;
      v2Once(group + ':' + part, gdef[part]);
    }
  };

  /** Tema ('roma'|'europa'|'pescara'|'pescaraNight'|'sogei') da un livello
      (oggetto LEVELS o indice 0-based / id 1-based). 'v1' per i livelli base. */
  A.themeForLevel = function (level) {
    const max = A.THEME_BY_LEVEL_INDEX.length;
    if (typeof level === 'number' && isFinite(level)) {
      const idx = Math.trunc(level);
      if (idx >= 0 && idx < max) return A.THEME_BY_LEVEL_INDEX[idx];
      if (idx >= 1 && idx <= max) return A.THEME_BY_LEVEL_INDEX[idx - 1];
      return null;
    }
    if (!level || typeof level !== 'object') return null;
    if (level.customBg) return normalizeTheme(level.customBg);
    if (typeof level.id === 'number' && level.id >= 1 && level.id <= max) {
      return A.THEME_BY_LEVEL_INDEX[level.id - 1];
    }
    if (level.sky || (Array.isArray(level.layers) && level.layers.length)) return 'v1';
    return null;
  };

  /** Costruisce (una volta sola) tutti gli asset del tema indicato. */
  A.ensureTheme = function (theme) {
    const t = normalizeTheme(theme);
    if (!t) return false;
    if (t === 'v1') return true; // gli asset v1 sono già nel boot
    if (A.themeStatus.themes[t]) return false; // già costruito: no-op
    const group = THEME_ART[t].shared || t;
    const def = THEME_ART[group];
    const t0 = nowMs();
    for (const part of ['bg', 'props', 'pickups', 'icons', 'ambient', 'enemies']) {
      if (typeof def[part] !== 'function') continue;
      v2Once(group + ':' + part, def[part]);
    }
    A.themeStatus.themes[t] = true;
    if (group === 'pescara') {
      A.themeStatus.themes.pescara = true;
      A.themeStatus.themes.pescaraNight = true;
    }
    A.themeStatus.ms[t] = Math.round(nowMs() - t0);
    // se dei PNG v2 erano già stati caricati (loadV2Sprites) vanno riapplicati
    // sopra l'arte appena costruita (altrimenti l'override andrebbe perso).
    try { if (typeof A.reapplyV2 === 'function') A.reapplyV2(); } catch (e) { /* non bloccante */ }
    return true;
  };

  /** Costruisce l'arte del livello (accetta l'oggetto LEVELS o indice/id).
      Ritorna il tema risolto ('v1', 'roma', ... oppure null). */
  A.ensureLevelArt = function (level) {
    const theme = A.themeForLevel(level);
    if (!theme) return null;
    if (theme === 'v1') return 'v1';
    A.ensureTheme(theme);
    return theme;
  };

  /** BOOT v1-only (usato da game.js): NON costruisce i temi v2. */
  A.buildBootArt = function (onProgress) {
    if (A._bootArtBuilt) return false;
    A._bootArtBuilt = true;
    const t0 = nowMs();
    const steps = [
      ['Preparazione divisa di Adele...', () => A.buildPlayerFrames()],
      ['Assunzione pretendenti, boomer e finanzieri...', () => A.buildV1EnemyFrames()],
      ['Cattura del polpo mutante...', () => A.buildOctoFrames()],
      ['Attivazione Mecha San Nicola...', () => { A.buildMechaFrames(); A.buildHaloFrames(); }],
      ['Timbratura casse e banchetti...', () => { A.buildV1Props(); A.buildV1Pickups(); A.buildV1Icons(); }],
      ['Costruzione del Porto di Bari...', () => A.buildV1Backgrounds()]
    ];
    steps.forEach(([label, fn], i) => {
      if (onProgress) onProgress(i, label);
      fn();
    });
    if (onProgress) onProgress(steps.length, 'Pratiche pronte.');
    A.themeStatus.boot = true;
    A.themeStatus.bootMs = Math.round(nowMs() - t0);
    return true;
  };

  A.drawGround = function (ctx, level, camX) {
    const tile = A.groundTiles[level];
    const y = A.GROUND;
    const under = { 1: '#221f29', 3: '#252a2e', 4: '#6c5d45', 5: '#3c435b', 6: '#4a174b', 7: '#0b1020' };
    ctx.fillStyle = under[level] || '#b9a67f';
    ctx.fillRect(0, y, A.W, A.H - y);
    const off = -Math.floor(camX) % 320;
    for (let x = off - 320; x < A.W + 320; x += 320) {
      ctx.drawImage(tile, Math.round(x), y);
    }
  };

  /* ---------------------------------------------------------
     API di inizializzazione
     --------------------------------------------------------- */
  A.buildAll = function (opts) {
    const o = (typeof opts === 'function') ? { onProgress: opts } : (opts || {});
    const progress = typeof o.onProgress === 'function' ? o.onProgress : null;
    let themes = A.V2_THEMES.slice();
    if (o.themes === 'boot' || o.themes === 'v1' || o.themes === false) themes = [];
    else if (Array.isArray(o.themes)) themes = o.themes.slice();
    else if (typeof o.themes === 'string' && o.themes !== 'all') themes = [o.themes];
    const steps = [
      ['Preparazione divisa di Adele...', () => A.buildBootArt()],
      ...themes.map(t => ['Costruzione del tema ' + t + '...', () => A.ensureTheme(t)])
    ];
    steps.forEach(([label, fn], i) => {
      if (progress) progress(i, label);
      fn();
    });
    if (progress) progress(steps.length, 'Pratiche pronte.');
    return A.themeStatus;
  };

  A.clamp = function (v, min, max) { return v < min ? min : v > max ? max : v; };
  A.lerp = function (a, b, t) { return a + (b - a) * t; };
  A.easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  A.rand = function (min, max) { return min + Math.random() * (max - min); };

})();

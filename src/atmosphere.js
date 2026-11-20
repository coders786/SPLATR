import { arc, blade, cube, cutFigure, disk, shearInk, line, poly } from './art.js';
import { TAU, INK } from './shapes.js';
import { hash, randomSource, districtIndex, BAND } from './levels.js';

// Ink-print void: orthographic silhouettes, stencil holes and dot screens.
// The backdrop is intentionally quieter during combat than on the title card.
function dotSheet(color) {
  const s = document.createElement('canvas');
  s.width = s.height = 10;
  const p = s.getContext('2d');
  disk(p, color, 2.5, 2.5, 1.45);
  disk(p, color, 7.5, 7.5, 1.45);
  return s;
}
function tower(c, x, y, s, ink) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.strokeStyle = ink;
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(-26, 0);
  c.lineTo(-5, -96);
  c.lineTo(5, -96);
  c.lineTo(26, 0);
  c.moveTo(0, -96);
  c.lineTo(0, -140);
  c.moveTo(-22, -98);
  c.lineTo(22, -98);
  c.moveTo(-16, -114);
  c.lineTo(16, -114);
  c.moveTo(-16, -30);
  c.lineTo(12, -54);
  c.lineTo(-8, -75);
  c.moveTo(17, -27);
  c.lineTo(-12, -52);
  c.lineTo(8, -76);
  c.stroke();
  c.restore();
}
function ruins(c, w, h, offset, datum, scale, seed) {
  // Indexed jagged roofline, not a bitmap stretched to fit portrait screens.
  const pitch = 133 * scale,
    first = Math.floor(offset / pitch) - 2,
    last = first + Math.ceil(w / pitch) + 5;
  for (let plane = 0; plane < 2; plane++) {
    const ink = plane ? '#211626' : '#312035',
      base = datum + (plane ? 62 : 4) * scale;
    for (let j = first; j <= last; j++) {
      const rn = hash(seed, j, plane),
        x = j * pitch - offset,
        hh = (32 + (rn % 112)) * scale,
        ww = (60 + ((rn >>> 9) % 66)) * scale,
        y = base - hh;
      if (x > w + 20 || x + pitch < -20 || y > h + 10) continue;
      const roof =
        rn % 4 === 0
          ? [
              [x, y + 22 * scale],
              [x + ww * 0.37, y],
              [x + ww, y],
            ]
          : rn % 4 === 1
            ? [
                [x, y],
                [x + ww * 0.21, y],
                [x + ww * 0.21, y + 18 * scale],
                [x + ww * 0.73, y + 18 * scale],
                [x + ww * 0.73, y],
                [x + ww, y],
              ]
            : rn % 4 === 2
              ? [
                  [x, y + 13 * scale],
                  [x + ww * 0.27, y + 13 * scale],
                  [x + ww * 0.27, y],
                  [x + ww, y],
                ]
              : [
                  [x, y],
                  [x + ww * 0.86, y],
                  [x + ww, y + 10 * scale],
                ];
      poly(c, ink, [
        [x - 1, base + 190 * scale],
        ...roof,
        [x + ww, y + hh * 0.64],
        [x + pitch + 1, y + hh * 0.64],
        [x + pitch + 1, base + 190 * scale],
      ]);
      if (rn % 7 === 0) tower(c, x + ww * 0.55, y, 0.5 * scale, ink);
      if (plane && (rn & 3) === 1) {
        c.fillStyle = '#563047';
        c.fillRect(x + ww * 0.45, y + 12 * scale, ww * 0.32, 2 * scale);
      }
    }
  }
}
function ticks(c, r, ink, from, count) {
  for (let i = 0; i < count; i++) {
    const a = from + i * 0.042,
      l = i % 5 ? 4 : 10;
    line(
      c,
      ink,
      i % 5 ? 1.4 : 2.8,
      Math.cos(a) * r,
      Math.sin(a) * r,
      Math.cos(a) * (r + l),
      Math.sin(a) * (r + l),
    );
  }
}
export function createBackdrop(c) {
  const dots = c.createPattern(dotSheet('#170f20aa'), 'repeat'),
    // Three depth planes of drifting flecks. One plane of 1.8px specks reads
    // as sensor noise; three planes at different parallax rates read as dust
    // hanging in a deep room.
    glints = Array.from({ length: 190 }, (_, i) => {
      const rand = randomSource(hash(41, i, 9));
      return [rand(), rand(), rand(), rand(), rand()];
    });
  let grad = null,
    key = '';
  function base(w, h, x, y, bright = false, band = 1) {
    const k = `${w}:${h}:${bright}:${band % 4}`;
    if (key !== k) {
      grad = c.createLinearGradient(0, 0, w, h * 0.9);
      grad.addColorStop(0, '#100f19');
      grad.addColorStop(0.43, '#1b1525');
      grad.addColorStop(
        0.78,
        bright ? '#402036' : ['#292034', '#332036', '#30233a', '#202d39'][band % 4],
      );
      grad.addColorStop(1, '#1c1426');
      key = k;
    }
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);
    // A warm haze sitting on the horizon line. Flat gradients give the eye no
    // anchor; a soft glow is what tells you how far away the far plane is.
    if (!bright) {
      const glow = c.createRadialGradient(
        w * 0.5,
        h * 0.78,
        0,
        w * 0.5,
        h * 0.78,
        Math.max(w, h) * 0.62,
      );
      glow.addColorStop(0, ['#4a2740', '#4d2634', '#43263f', '#22333c'][band % 4] + '99');
      glow.addColorStop(0.55, ['#3a2033', '#3d2029', '#352031', '#1b2830'][band % 4] + '55');
      glow.addColorStop(1, '#00000000');
      c.fillStyle = glow;
      c.fillRect(0, 0, w, h);
    }
    // Dust, in three planes. Deeper planes drift slower and draw duller, so
    // the parallax sells depth without any of it competing with a target.
    for (const [u, v, z, n, layer] of glints) {
      // 0.08 / 0.13 / 0.18. The band is deliberately narrow: parallax that is
      // too strong makes the dust read as objects moving behind the playfield,
      // and these are meant to be atmosphere, not things. Three rates inside a
      // tenth of each other still separate the planes -- it is the RATIO that
      // sells depth, and 0.08 vs 0.18 is more than a factor of two.
      const depth = 0.08 + layer * 0.05,
        px2 = ((((u * w - x * z * depth) % (w + 26)) + w + 26) % (w + 26)) - 12,
        py2 = ((((v * h - y * z * depth) % (h + 26)) + h + 26) % (h + 26)) - 12;
      const big = n > 0.965,
        mid = n > 0.86;
      c.globalAlpha = big ? 0.85 : mid ? 0.5 : 0.26 - layer * 0.04;
      c.fillStyle = big ? '#c39aae' : mid ? '#8a6573' : '#6a5872';
      const sz = big ? 3.1 : mid ? 1.9 : 1.3;
      c.fillRect(px2, py2, sz, sz * (big ? 1.6 : 1));
      if (big) {
        // The few bright flecks get a cross so they read as glints, not dust.
        c.globalAlpha = 0.3;
        c.fillRect(px2 - 3, py2 + sz * 0.6, sz + 6, 0.9);
      }
    }
    c.globalAlpha = 1;
    // Vignette: pulls attention to the middle of the field and hides the
    // hard edge of the ruins at the bottom of the viewport.
    const vig = c.createRadialGradient(
      w * 0.5,
      h * 0.52,
      Math.min(w, h) * 0.34,
      w * 0.5,
      h * 0.52,
      Math.max(w, h) * 0.82,
    );
    vig.addColorStop(0, '#00000000');
    vig.addColorStop(1, bright ? '#08060e88' : '#08060ebb');
    c.fillStyle = vig;
    c.fillRect(0, 0, w, h);
  }
  // In the Undercut the sky is an abandoned printing works. The roller has a
  // frame and a paper feed: it mustn't read as another Pulse wind-up circle.
  function press(x, y, r) {
    c.save();
    c.translate(x, y);
    c.scale(r / 180, r / 180);
    c.rotate(-0.09);
    const steel = '#36253a',
      shadow = '#251c2e',
      rim = '#483046';
    // Profile of a reel feeding a broken platen. Spokes, supports and a
    // hanging strip make one machine rather than loose concentric reticles.
    poly(c, shadow, [
      [-245, 63],
      [190, 63],
      [183, 77],
      [-220, 80],
    ]);
    poly(c, steel, [
      [-218, 64],
      [-186, 5],
      [-165, 4],
      [-143, 64],
      [-157, 64],
      [-176, 32],
      [-197, 64],
    ]);
    disk(c, steel, -176, -18, 55);
    disk(c, shadow, -176, -18, 42);
    for (let i = 0; i < 5; i++) {
      const a = (i * TAU) / 5 + 0.35;
      line(c, steel, 9, -176, -18, -176 + Math.cos(a) * 44, -18 + Math.sin(a) * 44);
    }
    disk(c, rim, -176, -18, 10);
    // One continuous web, from the roll through the pinch and out the jaw.
    c.fillStyle = rim;
    c.beginPath();
    c.moveTo(-184, -72);
    c.quadraticCurveTo(-113, -68, -58, -17);
    c.lineTo(145, -20);
    c.lineTo(145, -13);
    c.lineTo(-62, -10);
    c.quadraticCurveTo(-114, -57, -184, -65);
    c.fill();
    for (const yy of [-30, 1]) {
      disk(c, steel, -46, yy, 15);
      disk(c, shadow, -46, yy, 5);
    }
    poly(c, steel, [
      [3, 64],
      [3, -65],
      [27, -85],
      [137, -85],
      [160, -61],
      [159, 64],
      [141, 64],
      [139, -53],
      [126, -65],
      [35, -65],
      [25, -52],
      [24, 64],
    ]);
    c.fillStyle = rim;
    c.fillRect(67, -69, 36, 27);
    c.fillRect(36, -42, 97, 17);
    poly(c, shadow, [
      [32, 6],
      [134, 6],
      [139, 19],
      [26, 19],
    ]);
    poly(c, steel, [
      [151, -19],
      [178, -21],
      [192, 12],
      [180, 49],
      [157, 75],
      [149, 65],
      [133, 75],
      [140, 57],
      [168, 36],
      [175, 12],
    ]);
    for (let j = 0; j < 3; j++) line(c, shadow, 2, 168 + j * 4, 28, 180 + j * 2, 16);
    c.restore();
  }
  /** Mid-ground: the layer the eye needs to judge distance.
   *
   *  The old backdrop jumped straight from empty gradient to a single small
   *  motif, which is why the field read as flat. These are tall, dim, and
   *  near-black: they fill the gap between the far motifs and the ruins at
   *  the bottom without ever competing with a target, because they carry no
   *  bright pixels at all.
   */
  function midground(x, y, w, h, s, seed, band) {
    const pitch = 232 * s,
      first = Math.floor(x / pitch) - 2,
      last = first + Math.ceil(w / pitch) + 3;
    for (let j = first; j <= last; j++) {
      const rn = hash(seed, j, band * 7 + 3),
        px = j * pitch - x,
        ww = (84 + ((rn >>> 5) % 104)) * s,
        hh = (215 + ((rn >>> 11) % 330)) * s,
        // The field scrolls UP as you climb, so structures must enter from
        // the bottom and rise out of frame, not sit just below it forever.
        base = h * 1.02 - y * 0.34,
        top = base - hh;
      if (px > w + 40 || px + pitch < -40) continue;
      if (top > h + 60) continue;
      // Two tones only, both within a few steps of the sky, so they read as
      // distance rather than as scenery you could crash into.
      const ink = rn & 1 ? '#191325' : '#1d1529';
      const kind = rn % 5;
      c.save();
      c.translate(px, top);
      c.fillStyle = ink;
      if (kind === 0) {
        // A needle: thin spine, two drying-rack arms.
        c.fillRect(ww * 0.44, 0, ww * 0.12, hh);
        for (let k = 1; k < 5; k++) {
          const yy = hh * (k / 5);
          c.fillRect(0, yy, ww, 2.2 * s);
        }
      } else if (kind === 1) {
        // A stepped monolith.
        c.fillRect(0, hh * 0.28, ww, hh * 0.72);
        c.fillRect(ww * 0.2, hh * 0.1, ww * 0.6, hh * 0.2);
        c.fillRect(ww * 0.36, 0, ww * 0.28, hh * 0.12);
      } else if (kind === 2) {
        // A broken arch, one shoulder collapsed.
        c.fillRect(0, hh * 0.2, ww * 0.16, hh * 0.8);
        c.fillRect(ww * 0.84, hh * 0.45, ww * 0.16, hh * 0.55);
        c.fillRect(0, hh * 0.2, ww * 0.62, hh * 0.1);
      } else if (kind === 3) {
        // Stacked slabs, cut with one bright seam each.
        for (let k = 0; k < 6; k++) {
          const yy = hh * (k / 6),
            inset = (k % 2) * ww * 0.09;
          c.fillRect(inset, yy, ww - inset * 2, hh / 6 - 3 * s);
        }
      } else {
        // A leaning mast with guy-wires.
        c.save();
        c.rotate(((rn >>> 17) % 5 - 2) * 0.012);
        c.fillRect(ww * 0.46, 0, ww * 0.08, hh);
        for (let k = 1; k <= 3; k++) {
          const yy = hh * (0.6 + k * 0.12);
          c.fillRect(ww * 0.1, yy, ww * 0.8, 1.6 * s);
        }
        c.restore();
      }
      c.restore();
    }
  }
  function relic(theme, x, y, r, n) {
    c.save();
    c.translate(x, y);
    c.scale(r / 180, r / 180);
    const violet = '#46304c',
      deep = '#2f2338',
      light = '#5b3851';
    if (theme === 1) {
      // Static Bloom: remnants of a giant resonator.
      c.rotate((n % 70) * 0.01);
      for (let j = 0; j < 4; j++) {
        arc(
          c,
          j === 0 ? violet : deep,
          j === 1 ? 14 : 3,
          0,
          0,
          90 + j * 27,
          -2.7 + j * 0.23,
          0.9 + j * 0.21,
        );
        arc(c, violet, 2, 0, 0, 115 + j * 25, 1.31, 2.98);
      }
      ticks(c, 169, light, 1.35, 28);
    } else if (theme === 2) {
      // Dead Channel: snapped aerials and hanging wires.
      for (const [xx, yy, scale] of [
        [-100, 96, 1.5],
        [119, -31, 0.97],
      ])
        tower(c, xx, yy, scale, violet);
      c.strokeStyle = violet;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-112, -53);
      c.quadraticCurveTo(35, 21, 119, -133);
      c.stroke();
      for (let i = 0; i < 5; i++) line(c, deep, 2, -240, -85 + i * 13, 200 - i * 23, -86 + i * 13);
    } else if (theme === 3) {
      // Razor Belt: sheared, flat strips of rock.
      c.rotate(-0.35);
      for (let j = 0; j < 5; j++) {
        const xx = -120 + (hash(n, j, 0) % 130),
          yy = (j - 2) * 45;
        poly(c, j % 2 ? deep : violet, [
          [xx - 110, yy + 25],
          [xx + 102, yy - 19],
          [xx + 152, yy - 18],
          [xx - 62, yy + 31],
        ]);
      }
      line(c, light, 2, -175, 134, 215, 27);
    } else if (theme === 4) {
      // Black Circuit: a broken printed trace, not a floor.
      c.rotate(-0.32);
      for (let j = 0; j < 4; j++) {
        const y = j * 17;
        line(
          c,
          violet,
          4,
          -210,
          y + 49,
          -65,
          y + 49,
          -12,
          y - 4,
          64,
          y - 4,
          103,
          y - 43,
          180,
          y - 43,
        );
        arc(c, violet, 3, 187, y - 43, 7);
      }
    } else {
      // Aftershock: a fractured impact contour.
      for (let j = 0; j < 3; j++) {
        c.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * TAU) / 9 + 0.24 * j,
            r = 95 + 27 * j + (hash(n, i, 1) % 24);
          if (!i) c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        c.strokeStyle = j === 1 ? violet : deep;
        c.lineWidth = j === 1 ? 12 : 3;
        c.stroke();
      }
      line(c, light, 2, -48, 94, -15, 33, -27, 4, 32, -83);
    }
    c.restore();
  }
  function world(v, seed, band) {
    const w = v.width,
      h = v.height,
      s = v.scale,
      px = v.panX * s,
      py = v.panY * s;
    base(w, h, px, py, false, districtIndex(seed, band));
    // Depth order: sky, mid-ground structures, far motifs, then ruins.
    midground(px * 0.34, py * 0.55, w, h, s, seed, band);
    // Each backdrop mark belongs to a band in world space. Climbing reveals
    // a new motif rather than tiling identical moons or upside-down skylines.
    const pw = 1510 * s,
      ph = BAND * s * 0.6,
      oy = h * 0.39 - py * 0.6;
    const first = Math.max(0, Math.floor((oy - h - 245 * s) / ph)),
      last = Math.max(0, Math.ceil((oy + 245 * s) / ph));
    for (let row = first; row <= last; row++) {
      const theme = districtIndex(seed, row + 1),
        ox = w * (row % 2 ? 0.24 : 0.74) - px * 0.13;
      for (let ix = Math.floor(-ox / pw) - 1; ix <= Math.ceil((w - ox) / pw); ix++) {
        const n = hash(seed, ix, row),
          x = ox + ix * pw + (ix ? ((n % 160) - 80) * s : 0),
          y = oy - row * ph,
          r = (153 + (n % 34)) * s;
        if (x + r * 1.5 < 0 || x - r * 1.5 > w || y + r * 1.5 < 0 || y - r * 1.5 > h) continue;
        if (!theme) press(x, y, r);
        else relic(theme, x, y, r, n);
      }
    }
    const datum = h * 0.94 - py * 0.18;
    if (datum - 230 * s < h) ruins(c, w, h, px * 0.2, datum, s, seed);
  }
  function title(w, h, time) {
    const tall = w < h * 0.85;
    const short = tall && h < 650;
    const s = tall
      ? Math.min(w / (short ? 720 : 590), h / (short ? 1490 : 920))
      : Math.min(w / 1360, h / 780);
    const x = w * (tall ? 0.53 : 0.742),
      y = h * (short ? 0.175 : tall ? 0.237 : 0.475);
    base(w, h, 0, 0, true);
    ruins(c, w, h, 74 * s, h * 0.97, Math.max(0.52, s), 494);
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.rotate(-0.3);
    // A two-colour flyposter ripped THROUGH its printed subjects. All three
    // silhouettes, the cream cut faces and the forward keyline are game art.
    const air = Math.sin(time * 0.024),
      open = air * 2.7;
    function poster(side) {
      const top = side < 0;
      const edge = top
        ? [
            [-210, -191],
            [-187, -208],
            [24, -208],
            [44, -202],
            [190, -205],
            [210, -183],
            [206, -5],
            [118, -7],
            [72, -3],
            [80, -8],
            [-46, -4],
            [-111, -8],
            [-209, -4],
          ]
        : [
            [-210, 4],
            [-116, 0],
            [-50, 4],
            [56, 0],
            [49, 5],
            [132, 1],
            [205, 4],
            [207, 158],
            [178, 184],
            [93, 179],
            [84, 186],
            [-198, 183],
            [-213, 166],
          ];
      c.save();
      c.translate(top ? 9 : -5, side * (10 + open));
      poly(c, '#7a3a50', edge);
      c.translate(-3, -4);
      poly(c, top ? '#ec5976' : '#cc4564', edge);
      c.beginPath();
      c.moveTo(...edge[0]);
      for (const q of edge.slice(1)) c.lineTo(...q);
      c.closePath();
      c.clip();
      poly(c, '#a12e54', [
        [-250, -210],
        [-142, -210],
        [131, 198],
        [30, 199],
      ]);
      poly(c, dots, [
        [-201, -209],
        [-104, -209],
        [161, 202],
        [113, 202],
      ]);
      // Misregistered plate number, physically interrupted by the same slit.
      c.fillStyle = top ? '#bf3b61' : '#a83757';
      c.font = 'italic 800 270px Riot,Impact,sans-serif';
      c.textAlign = 'left';
      c.fillText('02', -117, 93);
      if (top) {
        line(c, '#6b2a4a', 2, -186, -159, 185, -159);
        c.fillStyle = '#461c36';
        c.font = 'bold 14px Mono,monospace';
        c.fillText('ONE STROKE', -181, -169);
        for (let i = 0; i < 2; i++)
          poly(c, '#692642', [
            [145 + i * 9, -180],
            [151 + i * 9, -180],
            [146 + i * 9, -168],
            [140 + i * 9, -168],
          ]);
        poly(c, '#ffd2b7', [
          [166, -208],
          [199, -206],
          [210, -177],
          [187, -184],
          [179, -179],
        ]);
      } else {
        c.fillStyle = '#51203b';
        c.font = 'italic 800 39px Riot,Impact,sans-serif';
        c.fillText('THROUGHCUT', -183, 152);
        line(c, '#652843', 2, -179, 161, 183, 161);
        c.font = 'italic 800 29px Riot,Impact,sans-serif';
        c.textAlign = 'right';
        c.fillText('+300', 180, 151);
      }
      c.restore();
    }
    poster(-1);
    poster(1);
    // Two direct contacts; the third, plated target is beyond the cube.
    // Leave negative space between silhouettes rather than orbiting spare icons.
    poly(c, '#100e1a', [
      [-370, 27],
      [-275, -6],
      [-43, -10],
      [-74, 26],
      [-319, 51],
      [-259, 27],
    ]);
    poly(c, INK.acid, [
      [-343, 27],
      [-160, 0],
      [-56, -3],
      [-122, 12],
    ]);
    line(c, '#e7bd9e', 2, -315, 41, -185, 23);
    cutFigure(c, 'fang', -206, 4, 46, 2.93, -0.035, 24 + open, { twist: 0.12 });
    cutFigure(c, 'prism', 27, -2, 56, 0.09, -0.035, 18 + open, { twist: 0.1 });
    cutFigure(c, 'bastion', 188, -8, 78, 0.12, -0.035, 19 + open, { torn: true, twist: 0.05 });
    shearInk(c, 16, -1, -0.035, 294, 17);
    blade(c, -64, 3, -0.035, 52);
    cube(c, -71, 5, 52, -0.12, time, 1);
    // Only offcuts shed chips. Match each chip to its source plate.
    for (const [xx, yy, z, a, col] of [
      [185, -112, 15, -0.48, '#ff7088'],
      [238, 84, 13, 0.38, '#ff7088'],
      [29, 86, 9, 0.39, '#c69aff'],
      [-219, -65, 7, -0.53, '#ff506e'],
    ]) {
      c.save();
      c.translate(xx, yy + air * 1.5);
      c.rotate(a);
      poly(c, col, [
        [z, 0],
        [-z, -z * 0.34],
        [-z * 0.6, z * 0.3],
      ]);
      c.restore();
    }
    c.restore();
  }
  // The paper flags hang above a worn cutting mat. Muted knife scores and
  // the holes in two offcuts belong to the bench, not to enemy telegraphs.
  function bench(v) {
    const w = v.width,
      h = v.height,
      u = Math.min(w, h) / 700;
    if (key !== `bench:${w}:${h}`) {
      key = `bench:${w}:${h}`;
      grad = c.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#17292f');
      grad.addColorStop(0.62, '#29403f');
      grad.addColorStop(1, '#16292e');
    }
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);
    const dx = v.panX * v.scale * 0.077,
      dy = v.panY * v.scale * 0.077;
    c.save();
    c.translate(-dx, -dy);
    c.lineWidth = 1;
    const pitch = 83 * u;
    for (let i = Math.floor(dx / pitch); i <= (w + dx) / pitch; i++) {
      line(c, '#304542', 1, i * pitch, dy, i * pitch, h + dy);
      for (let j = Math.floor(dy / pitch); j <= (h + dy) / pitch; j++)
        line(c, '#4a5a50', 1, i * pitch - 3, j * pitch, i * pitch + 4, j * pitch);
    }
    for (let j = Math.floor(dy / pitch); j <= (h + dy) / pitch; j++)
      line(c, '#2d4341', 1, dx, j * pitch, w + dx, j * pitch);
    for (const [xx, yy, n, turn] of [
      [w * 0.94, h * 0.22, 1, -0.43],
      [w * 0.11, h * 0.9, 0.7, 0.31],
    ]) {
      c.save();
      c.translate(xx, yy);
      c.rotate(turn);
      c.scale(n * u, n * u);
      c.beginPath();
      c.moveTo(-132, -80);
      c.lineTo(218, -73);
      c.lineTo(202, 57);
      c.lineTo(120, 59);
      c.lineTo(125, 51);
      c.lineTo(-118, 70);
      c.closePath();
      for (let j = 0; j < 3; j++) {
        const x = -65 + j * 89;
        c.moveTo(x, -41);
        c.lineTo(x - 31, 22);
        c.lineTo(x + 40, 20);
        c.closePath();
      }
      c.fillStyle = '#47554c';
      c.fill('evenodd');
      line(c, '#596357', 2, -125, -70, 194, -64);
      c.restore();
    }
    // Fine cuts catch the light on just one side. A chipped steel straightedge
    // and the triangular waste at the corners leave the working area clear.
    for (const [xx, yy, z, n] of glints) {
      const x = xx * w,
        y = yy * h;
      line(
        c,
        n > 0.75 ? '#43534b' : '#2d4542',
        0.8,
        x,
        y,
        x + (2 + 14 * z) * u,
        y - (1 + 6 * n) * u,
      );
    }
    c.save();
    c.translate(w * 0.95, h * 0.91);
    c.rotate(-0.62);
    c.scale(u, u);
    poly(
      c,
      '#465348',
      [
        [-71, -13],
        [152, -13],
        [159, -8],
        [159, 9],
        [-71, 9],
        [-77, 3],
        [-77, -7],
      ],
      '#283b37',
      1.5,
    );
    line(c, '#798172', 1, -69, -12, 152, -12);
    for (let i = 0; i < 43; i++) {
      const x = -55 + i * 5;
      line(c, '#303f39', 1.3, x, -11, x, i % 5 === 0 ? -1 : -6);
    }
    disk(c, '#233732', -66, -2, 3.4);
    c.restore();
    c.restore();
  }
  return { world, title, bench };
}

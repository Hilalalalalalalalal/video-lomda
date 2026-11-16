// Hand-drawn / sketch style asset generator (SVG -> PNG via sharp)
const sharp = require("sharp");

function mkR(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const f = (n) => n.toFixed(1);
function smooth(pts) {
  if (pts.length < 3) return "M" + pts.map((p) => f(p[0]) + " " + f(p[1])).join(" L");
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q${f(pts[i][0])} ${f(pts[i][1])} ${f(mx)} ${f(my)}`;
  }
  const l = pts[pts.length - 1];
  return d + ` L${f(l[0])} ${f(l[1])}`;
}
function jl(R, x1, y1, x2, y2, amp = 2, ext = 0) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
  x1 -= ux * ext; y1 -= uy * ext; x2 += ux * ext; y2 += uy * ext;
  const n = Math.max(2, Math.round(len / 35));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([x1 + (x2 - x1) * t + (R() - 0.5) * amp * 2, y1 + (y2 - y1) * t + (R() - 0.5) * amp * 2]);
  }
  return pts;
}
const path = (d, color, w, op = 1) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;
// pencil line (two passes)
function line(R, x1, y1, x2, y2, color, w = 5, amp = 2, ext = 0) {
  return path(smooth(jl(R, x1, y1, x2, y2, amp, ext)), color, w) +
    path(smooth(jl(R, x1, y1, x2, y2, amp * 1.2, ext)), color, Math.max(1.5, w * 0.35), 0.45);
}
function poly(R, pts, color, w = 5, closed = false, amp = 1.8, ext = 3) {
  let s = "";
  for (let i = 0; i < pts.length - 1; i++) s += line(R, ...pts[i], ...pts[i + 1], color, w, amp, ext);
  if (closed) s += line(R, ...pts[pts.length - 1], ...pts[0], color, w, amp, ext);
  return s;
}
function ellipse(R, cx, cy, rx, ry, color, w = 5, over = 1.1) {
  const pts = [], n = 22, a0 = R() * 6;
  for (let i = 0; i <= n * over; i++) {
    const a = a0 + (i / n) * Math.PI * 2;
    const k = 1 + (R() - 0.5) * 0.06;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return path(smooth(pts), color, w) + path(smooth(pts.map((p) => [p[0] + (R() - 0.5) * 3, p[1] + (R() - 0.5) * 3])), color, w * 0.35, 0.45);
}
function fillPoly(R, pts, color, op = 1, amp = 3) {
  const p = pts.map((q) => [q[0] + (R() - 0.5) * amp * 2, q[1] + (R() - 0.5) * amp * 2]);
  return `<path d="M${p.map((q) => f(q[0]) + " " + f(q[1])).join(" L")} Z" fill="${color}" stroke="${color}" stroke-width="4" stroke-linejoin="round" opacity="${op}"/>`;
}
function fillEllipse(R, cx, cy, rx, ry, color, op = 1) {
  return `<ellipse cx="${f(cx + (R() - 0.5) * 3)}" cy="${f(cy + (R() - 0.5) * 3)}" rx="${f(rx)}" ry="${f(ry)}" fill="${color}" opacity="${op}"/>`;
}

async function render(svgInner, w, h, file, scale = 2) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * scale}" height="${h * scale}" viewBox="0 0 ${w} ${h}">${svgInner}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(file);
}

const INK = "#14213D", RED = "#E63946", BLUE = "#1D9BF0", YEL = "#FFC933", WHITE = "#FFFFFF";

// ---------- shapes ----------
function card(w, h, o = {}) {
  const { fill = "#FFFFFF", stroke = INK, sw = 4.5, seed = 1, off = 7, shadow = true } = o;
  const R = mkR(seed), m = 14;
  const c = [[m, m], [w - m, m], [w - m, h - m], [m, h - m]];
  let s = "";
  if (shadow) s += fillPoly(R, c.map((p) => [p[0] + off, p[1] + off]), stroke, 0.16, 2);
  s += fillPoly(R, c, fill, 1, 2.5);
  s += poly(R, c, stroke, sw, true, 1.8, 5);
  return s;
}
function arrow(w, h, x0, y0, x1, y1, bend = 0, color = INK, sw = 5, seed = 3) {
  const R = mkR(seed);
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
  const cx = mx - (dy / len) * bend, cy = my + (dx / len) * bend;
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
    pts.push([a * x0 + b * cx + c * x1 + (R() - 0.5) * 2, a * y0 + b * cy + c * y1 + (R() - 0.5) * 2]);
  }
  const ex = x1 - cx, ey = y1 - cy, el = Math.hypot(ex, ey), ux = ex / el, uy = ey / el;
  const hl = Math.min(26, len * 0.35), ang = 0.5;
  const rot = (vx, vy, a) => [vx * Math.cos(a) - vy * Math.sin(a), vx * Math.sin(a) + vy * Math.cos(a)];
  const [a1x, a1y] = rot(-ux, -uy, ang), [a2x, a2y] = rot(-ux, -uy, -ang);
  return path(smooth(pts), color, sw) + path(smooth(pts.map((p) => [p[0] + 1.5, p[1] - 1.2])), color, sw * 0.35, 0.45) +
    line(R, x1, y1, x1 + a1x * hl, y1 + a1y * hl, color, sw, 1.2) + line(R, x1, y1, x1 + a2x * hl, y1 + a2y * hl, color, sw, 1.2);
}
function star(R, cx, cy, r, fill = YEL, stroke = INK, sw = 4) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return fillPoly(R, pts, fill, 1, 1.5) + poly(R, pts, stroke, sw, true, 1.2, 1);
}
function bolt(R, w, h, fill = YEL, stroke = INK) {
  const p = [[w * 0.62, 6], [w * 0.14, h * 0.55], [w * 0.46, h * 0.55], [w * 0.34, h - 6], [w * 0.9, h * 0.38], [w * 0.56, h * 0.38]];
  return fillPoly(R, p.map((q) => [q[0] + 6, q[1] + 6]), stroke, 0.18, 1) + fillPoly(R, p, fill, 1, 1.5) + poly(R, p, stroke, 4.5, true, 1.2, 1);
}
function sparkle(R, cx, cy, r, color = YEL, sw = 5) {
  return line(R, cx - r, cy, cx + r, cy, color, sw, 1) + line(R, cx, cy - r, cx, cy + r, color, sw, 1) +
    line(R, cx - r * 0.6, cy - r * 0.6, cx + r * 0.6, cy + r * 0.6, color, sw * 0.7, 1) + line(R, cx - r * 0.6, cy + r * 0.6, cx + r * 0.6, cy - r * 0.6, color, sw * 0.7, 1);
}
function highlight(R, w, h, color = YEL, op = 0.85) {
  const p = [[6, h * 0.25], [w - 8, 4], [w - 4, h * 0.8], [10, h - 4]];
  return fillPoly(R, p, color, op, 3);
}
function speedLines(R, w, h, color = INK) {
  let s = "";
  for (let i = 0; i < 4; i++) { const y = 10 + (i * (h - 20)) / 3; s += line(R, 6 + (i % 2) * 14, y, w - 6, y, color, 4, 1.5); }
  return s;
}

// ---------- ninja figure ----------
function ninjaHead(R, cx, cy, ink, tailDir = -1, r = 15) {
  const skin = "#FFDDB8";
  let s = fillEllipse(R, cx, cy, r, r, ink) + ellipse(R, cx, cy, r, r, ink, 4);
  s += `<rect x="${cx - 10}" y="${cy - 3}" width="20" height="8" rx="4" fill="${skin}"/>`;
  s += line(R, cx - r + 1, cy - 8, cx + r - 1, cy - 8, RED, 6, 0.8);
  const tx = cx + tailDir * r;
  s += line(R, tx, cy - 8, tx + tailDir * 18, cy - 15, RED, 5, 1) + line(R, tx, cy - 8, tx + tailDir * 20, cy - 2, RED, 5, 1);
  return s;
}
// joints: head, neck, hip, arms:[[p0,p1,p2],..], legs:[[..]]
function person(R, j, ink, tail = -1) {
  let s = "";
  for (const leg of j.legs) s += poly(R, leg, ink, 9, false, 1.5, 0);
  s += line(R, ...j.neck, ...j.hip, ink, 13, 1.5);
  for (const arm of j.arms) s += poly(R, arm, ink, 8, false, 1.5, 0);
  // hands
  for (const arm of j.arms) { const h = arm[arm.length - 1]; s += fillEllipse(R, h[0], h[1], 6, 6, ink); }
  s += ninjaHead(R, j.head[0], j.head[1], ink, tail);
  return s;
}
const bar = (R, x1, x2, y, c = BLUE) => line(R, x1, y, x2, y, c, 9, 1.2) + fillEllipse(R, x1, y, 7, 7, c) + fillEllipse(R, x2, y, 7, 7, c);

const POSES = {
  pullup: (R, ink) => bar(R, 30, 170, 36) + person(R, {
    head: [100, 62], neck: [100, 82], hip: [100, 148],
    arms: [[[100, 84], [66, 72], [80, 38]], [[100, 84], [134, 72], [120, 38]]],
    legs: [[[100, 148], [90, 188], [84, 226]], [[100, 148], [110, 188], [118, 226]]],
  }, ink),
  toes: (R, ink) => bar(R, 30, 170, 24) + person(R, {
    head: [92, 52], neck: [94, 70], hip: [92, 134],
    arms: [[[94, 72], [84, 48], [82, 26]], [[94, 72], [106, 48], [104, 26]]],
    legs: [[[92, 134], [132, 104], [112, 36]], [[92, 134], [138, 100], [120, 34]]],
  }, ink) + star(R, 118, 24, 11, YEL, INK, 3),
  swing: (R, ink) => line(R, 160, 0, 142, 50, "#C9A66B", 8, 1) + person(R, {
    head: [124, 78], neck: [118, 96], hip: [86, 152],
    arms: [[[118, 98], [132, 76], [141, 52]], [[118, 98], [138, 84], [146, 56]]],
    legs: [[[86, 152], [62, 184], [40, 214]], [[86, 152], [74, 190], [58, 226]]],
  }, ink, -1) + arrow(200, 240, 16, 150, 40, 70, -30, YEL, 5, 9),
  wall: (R, ink) => {
    const w = [[40, 232], [150, 225], [170, 22]];
    const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t; pts.push([a * w[0][0] + b * w[1][0] + c * w[2][0], a * w[0][1] + b * w[1][1] + c * w[2][1]]); }
    const fillP = pts.concat([[195, 22], [195, 232]]);
    return fillPoly(R, fillP, "#F6B8BE", 0.9, 1) + path(smooth(pts), RED, 7) + line(R, 170, 22, 195, 22, RED, 9, 1) +
      person(R, {
        head: [116, 80], neck: [112, 100], hip: [92, 152],
        arms: [[[112, 102], [140, 64], [164, 28]], [[112, 102], [90, 124], [74, 140]]],
        legs: [[[92, 152], [112, 172], [124, 180]], [[92, 152], [96, 186], [102, 208]]],
      }, ink);
  },
  rings: (R, ink) => bar(R, 30, 170, 14) +
    line(R, 76, 14, 76, 46, "#C9A66B", 5, 1) + line(R, 124, 14, 124, 46, "#C9A66B", 5, 1) +
    ellipse(R, 76, 62, 13, 17, "#C9A66B", 6) + ellipse(R, 124, 62, 13, 17, "#C9A66B", 6) +
    person(R, {
      head: [100, 100], neck: [100, 118], hip: [100, 172],
      arms: [[[100, 120], [84, 96], [76, 66]], [[100, 120], [116, 96], [124, 66]]],
      legs: [[[100, 172], [95, 205], [94, 232]], [[100, 172], [105, 205], [106, 232]]],
    }, ink),
  hero: (R, ink) => person(R, {
    head: [100, 62], neck: [100, 82], hip: [100, 150],
    arms: [[[100, 86], [68, 62], [46, 28]], [[100, 86], [132, 62], [154, 28]]],
    legs: [[[100, 150], [80, 192], [66, 230]], [[100, 150], [120, 192], [136, 230]]],
  }, ink) + sparkle(R, 30, 30, 12, YEL, 5) + sparkle(R, 172, 40, 10, YEL, 5),
};
async function figure(name, file, ink = INK, seed = 7) {
  const R = mkR(seed);
  await render(POSES[name](R, ink), 200, 240, file);
}

// ---------- icons (200x200 canvas) ----------
const ICONS = {
  tv: (R, ink) => {
    let s = fillPoly(R, [[24, 54], [176, 54], [176, 160], [24, 160]], "#BFE3FF", 1, 2) + poly(R, [[24, 54], [176, 54], [176, 160], [24, 160]], ink, 6, true);
    s += line(R, 100, 54, 66, 22, ink, 5) + line(R, 100, 54, 134, 22, ink, 5);
    s += fillPoly(R, [[84, 80], [84, 134], [128, 107]], RED, 1, 1) + poly(R, [[84, 80], [84, 134], [128, 107]], ink, 4, true, 1, 1);
    s += line(R, 50, 174, 150, 174, ink, 6);
    return s;
  },
  star: (R, ink) => star(R, 100, 104, 78, YEL, ink, 6) + fillPoly(R, [[40, 160], [160, 160], [160, 172], [40, 172]], BLUE, 0.9, 1),
  globe: (R, ink) => fillEllipse(R, 100, 100, 74, 74, "#BFE3FF") + ellipse(R, 100, 100, 74, 74, ink, 6) +
    ellipse(R, 100, 100, 32, 74, ink, 4) + line(R, 26, 100, 174, 100, ink, 4) + line(R, 38, 64, 162, 64, ink, 3.5) + line(R, 38, 136, 162, 136, ink, 3.5) +
    fillPoly(R, [[60, 70], [86, 66], [92, 90], [70, 98]], "#7BD389", 0.85, 2) + fillPoly(R, [[112, 108], [140, 104], [146, 134], [118, 138]], "#7BD389", 0.85, 2),
  medal: (R, ink) => fillPoly(R, [[62, 14], [100, 80], [78, 92], [40, 28]], RED, 1, 1) + fillPoly(R, [[138, 14], [100, 80], [122, 92], [160, 28]], BLUE, 1, 1) +
    poly(R, [[62, 14], [100, 80], [78, 92], [40, 28]], ink, 4, true) + poly(R, [[138, 14], [100, 80], [122, 92], [160, 28]], ink, 4, true) +
    fillEllipse(R, 100, 128, 56, 56, YEL) + ellipse(R, 100, 128, 56, 56, ink, 6) + star(R, 100, 128, 30, "#FFFFFF", ink, 4),
  heart: (R, ink) => {
    const p = "M100 168 C20 110 30 40 78 44 C92 46 98 58 100 66 C102 58 108 46 122 44 C170 40 180 110 100 168 Z";
    return `<path d="${p}" fill="${RED}" stroke="${RED}" stroke-width="3" transform="translate(6,6)" opacity="0.25"/><path d="${p}" fill="${RED}" stroke="${ink}" stroke-width="6" stroke-linejoin="round"/>` +
      bolt(R, 56, 84, YEL, ink).replace("<path", '<g transform="translate(72,70) scale(0.9)"><path') .replace(/$/, "</g>");
  },
  bulb: (R, ink) => fillEllipse(R, 100, 80, 46, 46, YEL) + ellipse(R, 100, 80, 46, 46, ink, 6) +
    fillPoly(R, [[78, 118], [122, 118], [118, 150], [82, 150]], "#D0D6E2", 1, 1) + poly(R, [[78, 118], [122, 118], [118, 150], [82, 150]], ink, 5, true) +
    line(R, 84, 164, 116, 164, ink, 6) + line(R, 90, 76, 100, 96, ink, 4) + line(R, 100, 96, 110, 76, ink, 4) +
    line(R, 100, 12, 100, 0, ink, 5) + line(R, 40, 28, 28, 16, ink, 5) + line(R, 160, 28, 172, 16, ink, 5) + line(R, 36, 80, 18, 80, ink, 5) + line(R, 164, 80, 182, 80, ink, 5),
  dumbbell: (R, ink) => line(R, 40, 100, 160, 100, ink, 10) +
    fillPoly(R, [[30, 56], [58, 56], [58, 144], [30, 144]], RED, 1, 1) + poly(R, [[30, 56], [58, 56], [58, 144], [30, 144]], ink, 5, true) +
    fillPoly(R, [[142, 56], [170, 56], [170, 144], [142, 144]], RED, 1, 1) + poly(R, [[142, 56], [170, 56], [170, 144], [142, 144]], ink, 5, true) +
    fillPoly(R, [[14, 76], [30, 76], [30, 124], [14, 124]], BLUE, 1, 1) + poly(R, [[14, 76], [30, 76], [30, 124], [14, 124]], ink, 4, true) +
    fillPoly(R, [[170, 76], [186, 76], [186, 124], [170, 124]], BLUE, 1, 1) + poly(R, [[170, 76], [186, 76], [186, 124], [170, 124]], ink, 4, true),
  rope: (R, ink) => {
    let s = line(R, 40, 4, 100, 4, ink, 8) + line(R, 100, 4, 100, 12, ink, 5);
    const pts = []; for (let i = 0; i <= 16; i++) pts.push([100 + Math.sin(i / 2.2) * 9, 12 + i * 9.2]);
    s += path(smooth(pts), "#C9A66B", 14) + path(smooth(pts), ink, 3, 0.5);
    for (let i = 1; i < 16; i += 2) s += line(R, 92, 12 + i * 9.2, 108, 22 + i * 9.2, ink, 2.5, 0.5);
    s += fillEllipse(R, 100, 170, 18, 13, "#C9A66B") + ellipse(R, 100, 170, 18, 13, ink, 4);
    return s;
  },
  ladder: (R, ink) => {
    let s = line(R, 56, 6, 56, 196, ink, 9) + line(R, 144, 6, 144, 196, ink, 9);
    [150, 112, 74].forEach((y, i) => { s += line(R, 56, y, 144, y, i === 1 ? RED : BLUE, 8, 1); });
    s += arrow(200, 200, 100, 170, 100, 128, 0, YEL, 7, 5);
    return s;
  },
  buzzer: (R, ink) => fillPoly(R, [[50, 140], [150, 140], [160, 190], [40, 190]], "#9FB3D1", 1, 1) + poly(R, [[50, 140], [150, 140], [160, 190], [40, 190]], ink, 5, true) +
    fillEllipse(R, 100, 120, 58, 32, "#9B1D28") + fillEllipse(R, 100, 100, 58, 40, RED) + ellipse(R, 100, 100, 58, 40, ink, 6) +
    line(R, 78, 84, 96, 78, WHITE, 6, 1) + line(R, 100, 6, 100, 34, YEL, 6) + line(R, 44, 18, 62, 40, YEL, 6) + line(R, 156, 18, 138, 40, YEL, 6),
  bubble: (R, ink) => fillPoly(R, [[10, 10], [190, 10], [190, 130], [60, 130], [30, 170], [38, 130], [10, 130]], "#FFFFFF", 1, 1) + poly(R, [[10, 10], [190, 10], [190, 130], [60, 130], [30, 170], [38, 130], [10, 130]], ink, 5, true),
};
async function icon(name, file, ink = INK, seed = 11) {
  const R = mkR(seed);
  await render(ICONS[name](R, ink), 200, 200, file);
}

module.exports = { mkR, render, card, arrow, star, bolt, sparkle, highlight, speedLines, figure, icon, line, poly, ellipse, fillPoly, fillEllipse, INK, RED, BLUE, YEL, WHITE, path, smooth };

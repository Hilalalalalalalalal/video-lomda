// Generates every image asset used by the deck (sketch art, photo frames, backgrounds, video posters)
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { execSync } = require("child_process");
const A = require("./art");
const { mkR, INK, RED, BLUE, YEL } = A;

const OUT = path.join(__dirname, "assets");
const UP = "/root/.claude/uploads/f227f12d-51ed-5661-b76b-70c94d08dab2";
fs.mkdirSync(OUT, { recursive: true });
const out = (n) => path.join(OUT, n);

// ----- backgrounds -----
async function backgrounds() {
  await sharp({ create: { width: 1334, height: 750, channels: 3, background: "#F7F9FD" } }).jpeg({ quality: 95 }).toFile(out("bg-light.jpg"));
  // title: soft pastel with large translucent circles
  const t = `<rect width="1334" height="750" fill="#E8F1FC"/>
  <circle cx="1230" cy="90" r="260" fill="#FBE3E6"/><circle cx="1100" cy="700" r="230" fill="#FFF1C9"/>
  <circle cx="520" cy="760" r="170" fill="#DDF3E8"/><circle cx="470" cy="40" r="110" fill="#E7E0F7"/>`;
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1334" height="750">${t}</svg>`)).jpeg({ quality: 95 }).toFile(out("bg-dark.jpg"));
}

// ----- photos in sketchy frames -----
async function polaroid(src, crop, file, W = 800, b = 22) {
  const buf = await sharp(src).extract(crop).resize(W).jpeg({ quality: 88 }).toBuffer();
  const m = await sharp(buf).metadata();
  const CW = m.width + 2 * b, CH = m.height + 2 * b;
  const R = mkR(W);
  const outline = A.poly(R, [[2, 2], [CW - 2, 2], [CW - 2, CH - 2], [2, CH - 2]], "#C9D3E6", 4, true, 0, 0);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}">${outline}</svg>`;
  await sharp({ create: { width: CW, height: CH, channels: 3, background: "#FFFFFF" } })
    .composite([{ input: buf, left: b, top: b }, { input: Buffer.from(svg), left: 0, top: 0 }])
    .jpeg({ quality: 88 }).toFile(file);
  return { w: CW, h: CH };
}

async function photos() {
  const dims = {};
  // [photo file, crop(top,height), out]
  dims.p1 = await polaroid(`${UP}/d21e768c-image.jpg`, { left: 0, top: 660, width: 1080, height: 1440 }, out("photo-hang.jpg")); // girl hanging on bars
  dims.p2 = await polaroid(`${UP}/b57045d1-image.jpg`, { left: 0, top: 360, width: 1080, height: 1500 }, out("photo-rings.jpg")); // pink, rings + block
  dims.p3 = await polaroid(`${UP}/4bcb121e-image.jpg`, { left: 0, top: 560, width: 1080, height: 1400 }, out("photo-reach.jpg")); // reaching for ring
  fs.writeFileSync(out("photo-dims.json"), JSON.stringify(dims));
}

// ----- video posters -----
function posters() {
  execSync(`ffmpeg -v error -y -ss 10 -i ${out("video2.mp4")} -frames:v 1 ${out("poster2.jpg")}`);
}

// ----- art -----
async function art() {
  A.setStyle({ j: 0.3, w: 0.62, p: 0 });
  // figures: dark ink for light slides, white ink for dark slides
  for (const p of ["pullup", "toes", "swing", "wall", "rings", "hero"]) await A.figure(p, out(`fig-${p}.png`), INK, 5 + p.length);
  await A.figure("hero", out("fig-hero-white.png"), "#FFFFFF", 21);
  for (const i of ["tv", "star", "globe", "medal", "heart", "bulb", "dumbbell", "rope", "ladder", "buzzer", "bubble"]) await A.icon(i, out(`icon-${i}.png`), INK, 3 + i.length);

  const R = mkR(5);
  await A.render(A.bolt(R, 70, 90), 70, 90, out("bolt.png"));
  await A.render(A.bolt(mkR(8), 160, 200), 160, 200, out("bolt-big.png"));
  await A.render(A.star(R, 50, 50, 40), 100, 100, out("star.png"));
  await A.render(A.sparkle(R, 40, 40, 30, YEL, 7), 80, 80, out("sparkle.png"));
  await A.render(A.sparkle(R, 40, 40, 30, BLUE, 7), 80, 80, out("sparkle-blue.png"));
  await A.render(A.highlight(R, 870, 90, YEL, 0.9), 870, 90, out("hl-wide.png"));
  await A.render(A.highlight(mkR(4), 130, 40, "#FFE680", 0.8), 130, 40, out("tape.png"));

  // arrows (all hand-drawn). name, w,h(px), x0,y0,x1,y1,bend,color
  const arrows = [
    ["arr-left", 70, 60, 64, 36, 8, 24, -12, RED],       // right -> left (RTL flow)
    ["arr-down", 50, 40, 25, 4, 25, 36, 6, RED],
    ["arr-left-s", 55, 55, 50, 28, 6, 28, -8, INK],
    ["arr-left-long", 250, 80, 240, 55, 12, 22, -22, YEL],
    ["arr-left-blue", 90, 60, 84, 34, 8, 26, -12, BLUE],
  ];
  for (const [n, w, h, x0, y0, x1, y1, bend, col] of arrows) await A.render(A.arrow(w, h, x0, y0, x1, y1, bend, col, 5, w), w, h, out(`${n}.png`));
}

(async () => {
  await backgrounds();
  await photos();
  posters();
  await art();
  console.log("assets ok", fs.readdirSync(OUT).length);
})();

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
  // light: graph paper
  let g = `<rect width="1334" height="750" fill="#FFFFFF"/>`;
  for (let x = 0; x <= 1334; x += 50) g += `<line x1="${x}" y1="0" x2="${x}" y2="750" stroke="#DCE8F7" stroke-width="2"/>`;
  for (let y = 0; y <= 750; y += 50) g += `<line x1="0" y1="${y}" x2="1334" y2="${y}" stroke="#DCE8F7" stroke-width="2"/>`;
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1334" height="750">${g}</svg>`)).jpeg({ quality: 92 }).toFile(out("bg-light.jpg"));
  // dark: navy with chalk sketches
  const R = mkR(99);
  let d = `<rect width="1334" height="750" fill="#0B1B3A"/>`;
  for (let x = 0; x <= 1334; x += 50) d += `<line x1="${x}" y1="0" x2="${x}" y2="750" stroke="#16295A" stroke-width="2"/>`;
  for (let y = 0; y <= 750; y += 50) d += `<line x1="0" y1="${y}" x2="1334" y2="${y}" stroke="#16295A" stroke-width="2"/>`;
  d += A.line(R, 480, 690, 1300, 690, "#23407F", 6, 3);
  d += A.line(R, 520, 60, 1320, 60, "#23407F", 6, 3);
  d += A.sparkle(R, 1230, 130, 16, "#FFC933", 5) + A.sparkle(R, 560, 640, 12, "#1D9BF0", 4) + A.sparkle(R, 1280, 620, 10, "#E63946", 4);
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1334" height="750">${d}</svg>`)).jpeg({ quality: 92 }).toFile(out("bg-dark.jpg"));
}

// ----- photos in sketchy frames -----
async function polaroid(src, crop, file, W = 800, b = 22) {
  const buf = await sharp(src).extract(crop).resize(W).jpeg({ quality: 88 }).toBuffer();
  const m = await sharp(buf).metadata();
  const CW = m.width + 2 * b, CH = m.height + 2 * b;
  const R = mkR(W);
  const outline = A.poly(R, [[3, 3], [CW - 3, 3], [CW - 3, CH - 3], [3, CH - 3]], INK, 5, true, 2, 6);
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
  execSync(`ffmpeg -v error -y -ss 30 -i ${out("video1.mp4")} -frames:v 1 ${out("poster1.jpg")}`);
  execSync(`ffmpeg -v error -y -ss 10 -i ${out("video2.mp4")} -frames:v 1 ${out("poster2.jpg")}`);
}

// ----- sketch art -----
async function art() {
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

  // cards  (name, w, h in inches*100)
  const cards = {
    "card-w": [350, 390, "#FFFFFF"], "card-fact": [1210, 130, "#FFF1BF"],
    "card-big": [510, 420, "#FFE3E5"], "card-row": [660, 125, "#FFFFFF"],
    "card-step": [550, 150, "#FFFFFF"], "card-step-y": [550, 150, "#FFF1BF"],
    "card-vid": [340, 540, "#FFFFFF"], "chip-side": [230, 110, "#E4F3FF"],
    "chip-blue": [260, 110, "#D6EDFF"], "chip-red": [260, 110, "#FFD9DC"], "chip-yel": [260, 110, "#FFF1BF"], "chip-grn": [260, 110, "#D8F5DC"],
    "card-skill": [390, 360, "#FFFFFF"], "card-term": [600, 260, "#FFFFFF"], "card-term-b": [600, 260, "#EAF5FF"],
    "card-small": [285, 360, "#FFFFFF"], "card-banner": [1210, 135, "#14213D"], "card-note": [220, 150, "#E4F3FF"],
  };
  let seed = 1;
  for (const [n, [w, h, fill]] of Object.entries(cards)) {
    const dark = fill === "#14213D";
    await A.render(A.card(w, h, { fill, seed: seed++, stroke: dark ? "#FFC933" : INK, shadow: !dark }), w, h, out(`${n}.png`), 2);
  }

  // arrows (all hand-drawn). name, w,h(px), x0,y0,x1,y1,bend,color
  const arrows = [
    ["arr-left", 70, 60, 64, 36, 8, 24, -12, RED],       // right -> left (RTL flow)
    ["arr-down", 50, 40, 25, 4, 25, 36, 6, RED],
    ["arr-left-s", 55, 55, 50, 28, 6, 28, -8, INK],
    ["arr-left-long", 250, 80, 240, 55, 12, 22, -22, YEL],
    ["arr-left-blue", 90, 60, 84, 34, 8, 26, -12, BLUE],
  ];
  for (const [n, w, h, x0, y0, x1, y1, bend, col] of arrows) await A.render(A.arrow(w, h, x0, y0, x1, y1, bend, col, 6, w), w, h, out(`${n}.png`));
}

(async () => {
  await backgrounds();
  await photos();
  posters();
  await art();
  console.log("assets ok", fs.readdirSync(OUT).length);
})();

// בונה את דף ההנצחה של רחל חנן בשני פורמטים:
//   1. פוסטר ארוך (poster.png / poster.pdf)
//   2. פוסטר 35×50 ס"מ להדפסה (poster-35x50.png ב-300dpi / poster-35x50.pdf)
// שימוש: הניחו תמונות בתיקיית photos/ והריצו:  node build.js
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const exts = /\.(jpe?g|png|webp|gif|avif)$/i;
const photosDir = path.join(ROOT, 'photos');
const files = fs.existsSync(photosDir)
  ? fs.readdirSync(photosDir).filter(f => exts.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  : [];

// קורא רוחב/גובה מכותרת JPEG, כדי לבחור תמונות מתאימות לעמודות הצד
function jpegSize(file) {
  try {
    const b = fs.readFileSync(file);
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      i += 2 + b.readUInt16BE(i + 2);
    }
  } catch (e) { /* ignore */ }
  return { w: 4, h: 3 };
}

// הציטוט שמוטמע בתוך מסגרת התמונה המרכזית
const heroQuote = 'תמיד תמצא את עצמך\nעם הראש למעלה…';

// ציטוטים. size: s=קצר ובולט, m=רגיל, l=ארוך.
// side: קצרים שמתאימים לעמודות הצד בכל הפורמטים; c: עמודות צד בפורמט הקטן בלבד
const quotes = [
  { t: 'אף מילה למורגנשטיין.', size: 's', c: 'R' },
  { t: 'תדעי לך דבר אחד, אל תלמדי אחרים.', size: 'm' },
  { t: 'אל תשאיר כלום בבטן. מותר להגיד הכל, רק תלוי איך.', size: 'm' },
  { t: 'מותר שקרים לבנים לטובת שלום בית.', size: 'm' },
  { t: 'אם יש לך שקל, תן שקל. אם יש לך 1000 ש״ח, תן 1000 ש״ח… רק אל תצפה לקבל משהו בתמורה.', size: 'l' },
  { t: 'מילה מילה.', size: 's', side: 'R' },
  { t: 'את תקבלי חתיכת עוגה קטנה כי את צריכה לשמור על עצמך <span class="emo">😅</span>', size: 'm' },
  { t: 'אם קבצן כבר השפיל את עצמו לבקש כסף, אל תשפיל אותו יותר בזה שלא תתן לו.', size: 'l' },
  { t: 'את יודעת מי את?', size: 's', side: 'L' },
  { t: 'להיות מנץ׳ – את יודעת מה זה מנץ׳?', size: 'm' },
  { t: 'אני נותנת משהו ושכחתי שנתתי.', size: 'm' },
  { t: 'לא כואב כשמקבלים מכה, רק כשפוגעים בלב…', size: 'm' },
  { t: 'תמיד עושה תחרות הורדות ידיים… עד היום.', size: 'm' },
  { t: '״אני סבתא מצחיקה…״', size: 's', side: 'R' },
  { t: 'לשנוא זה רגש נוראי…', size: 'm', c: 'L' },
  { t: 'אני לא שונאת. מה זו המילה הזו בכלל, שונאת?', size: 'm' },
  { t: 'אין חיים טובים, יש רגעים טובים.', size: 's', side: 'L' },
  { t: 'אם את מתחתנת עם מישהו בשביל לשנות אותו, אל תתחתני.', size: 'm' },
  { t: 'למדתי מאבא: לפעמים חיבוק הוא יותר ממילה טובה.', size: 'm' },
];

// ───── הגדרות הפורמטים ─────
const FORMATS = [
  { id: 'wide', compact: false, html: 'index.html', png: 'poster.png', pdf: 'poster.pdf', vw: 2400, vh: 1400, sidePh: 2 },
  // 35×50 ס"מ = 1322.83×1889.76 פיקסלי CSS (96dpi); רינדור ב-300dpi => scale 3.125
  { id: 'a35x50', compact: true, html: 'index-35x50.html', png: 'poster-35x50.png', pdf: 'poster-35x50.pdf', vw: 1323, vh: 1890, sidePh: { L: Number(process.env.SIDE_PH_L || 7), R: Number(process.env.SIDE_PH_R || 12) } },
];

let photoPool = files.map(f => ({ src: 'photos/' + encodeURI(f), ...jpegSize(path.join(photosDir, f)) }));
if (!photoPool.length) photoPool = Array.from({ length: 9 }, () => ({ ph: true, w: 4, h: 5 }));

// שזירה אחידה של תמונות וציטוטים
function mix(ps, qs) {
  const out = [], total = ps.length + qs.length;
  let pi = 0, qi = 0, acc = 0;
  for (let i = 0; i < total; i++) {
    acc += qs.length / total;
    if (qi < qs.length && (acc >= 1 || pi >= ps.length)) { out.push({ type: 'q', ...qs[qi++] }); acc -= 1; }
    else out.push({ type: 'p', ...ps[pi++] });
  }
  return out;
}

const br = s => s.replace(/\n/g, '<br>');

function compose(cfg) {
  const sideOf = q => q.side || (cfg.compact ? q.c : null);
  const feature = cfg.compact ? photoPool.find(p => p.src && p.src.includes('family-tree')) : null;
  const pool = feature ? photoPool.filter(p => p !== feature) : photoPool;
  const phCount = sd => (typeof cfg.sidePh === 'number' ? cfg.sidePh : cfg.sidePh[sd]);
  const sideQuotes = { L: quotes.filter(q => sideOf(q) === 'L'), R: quotes.filter(q => sideOf(q) === 'R') };
  const restQuotes = quotes.filter(q => !sideOf(q));

  // תמונות לרוחב לעמודות הצד, קרובות ליחס 1.4
  const landscape = pool.map((p, i) => ({ p, i, d: Math.abs(p.w / p.h - 1.4) }))
    .filter(o => o.p.w / o.p.h > 1.15).sort((a, b) => a.d - b.d);
  const sidePick = { L: [], R: [] };
  for (const o of landscape) {
    const need = { L: phCount('L') - sidePick.L.length, R: phCount('R') - sidePick.R.length };
    if (need.L <= 0 && need.R <= 0) break;
    let sd = need.L >= need.R ? 'L' : 'R'; if (need[sd] <= 0) sd = sd === 'L' ? 'R' : 'L';
    sidePick[sd].push(o.i);
  }
  const used = new Set([...sidePick.L, ...sidePick.R]);
  const sidePhotos = { L: sidePick.L.map(i => pool[i]), R: sidePick.R.map(i => pool[i]) };
  const restPhotos = pool.filter((_, i) => !used.has(i));

  const sideMix = s => (cfg.compact
    ? mix(sidePhotos[s], sideQuotes[s])
    : (() => { const out = [], ps = sidePhotos[s], qs = sideQuotes[s]; const n = Math.max(ps.length, qs.length);
        for (let i = 0; i < n; i++) { if (ps[i]) out.push({ type: 'p', ...ps[i] }); if (qs[i]) out.push({ type: 'q', ...qs[i] }); } return out; })());

  const all = mix(restPhotos, restQuotes);
  const half = Math.ceil(all.length / 2);
  return { top: all.slice(0, half), bottom: all.slice(half), L: sideMix('L'), R: sideMix('R'), feature };
}

const render = list => list.map(it => {
  if (it.type === 'p') {
    return it.src
      ? `<figure class="photo"><div class="mat"><img src="${it.src}" alt=""></div></figure>`
      : `<figure class="photo ph"><div class="mat" style="aspect-ratio:4/5"><span>תמונה</span></div></figure>`;
  }
  return `<blockquote class="quote sz-${it.size}"><div class="qin"><span class="mark">״</span><p>${it.t}</p></div></blockquote>`;
}).join('\n');

// עיצוב לפורמט 35×50: קנבס קבוע בפיקסלים, 8 עמודות
const HERO_AR = process.env.HERO_AR || '0.72';
const compactCss = `
.poster.c{width:35cm;height:50cm;overflow:hidden;padding:34px 42px 26px;display:flex;flex-direction:column;--gap:9px}
.poster.c::before{inset:14px}.poster.c::after{inset:23px}
.c header{padding:2px 0 8px;flex:none}
.c .orn{gap:14px}.c .orn i{width:150px}.c .orn b{font-size:15px}
.c h1{font-size:80px;margin-top:2px}
.c .years{font-size:29px;margin-top:4px;letter-spacing:.32em}
.c header .orn.bottom{margin-top:6px}
.c main{flex:1;display:flex;flex-direction:column;justify-content:space-between;min-height:0}
.c .band{column-count:8;column-gap:var(--gap)}
.c .band > *{margin-bottom:var(--gap)}
.c .mid{grid-template-columns:repeat(8,1fr);column-gap:var(--gap);margin:0}
.c .side{display:flex;flex-direction:column;gap:var(--gap);align-self:start}
.c .sp{column-count:2;column-gap:var(--gap)}
.c .sp > *{break-inside:avoid;margin-bottom:var(--gap)}
.c .feat .photo{padding:3px}.c .feat .photo .mat{padding:6px}
.c .side.l{grid-column:1 / 3}.c .side.r{grid-column:7 / 9}
.c .hero{grid-column:3 / 7;box-shadow:0 0 50px rgba(201,161,92,.38),0 14px 40px -10px rgba(0,0,0,.8)}
.c .hero::before{inset:-9px}
.c .hero .spacer{aspect-ratio:${HERO_AR}}
.c .hero-in{inset:5px}
.c .hero-in .hq{font-size:34px;left:5%;top:22%}
.c .photo{padding:2px}.c .photo .mat{padding:4px}
.c .quote{padding:2px}
.c .qin{padding:16px 12px 9px}
.c .qin::before{inset:4px}
.c .mark{font-size:62px}
.c .sz-s p{font-size:29px;line-height:1.12}
.c .sz-m p{font-size:20.5px;line-height:1.3}
.c .sz-l p{font-size:18.5px;line-height:1.3}
.c footer{flex:none;padding:4px 0 0}
.c footer .big{font-size:34px;margin-top:0;line-height:1.05}
.c footer .small{display:none}
.c footer .orn{display:none}
`;

function makeHtml(cfg, parts) {
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>רחל חנן 1929-2026</title>
<style>
@font-face{font-family:'Heebo';font-weight:300;font-style:normal;src:url('fonts/Heebo-Light.ttf') format('truetype');}
@font-face{font-family:'Gveret Levin';font-weight:400;font-style:normal;src:url('fonts/GveretLevin.ttf') format('truetype');}
:root{
  --night:#120d08; --panel:#140f09; --gold:#c9a15c; --gold-l:#f0dba4; --gold-d:#8a6a2f;
  --foil:linear-gradient(135deg,#7d5f2a 0%,#e9cf8c 22%,#b8903f 45%,#f7e7b8 62%,#a07a35 82%,#6f5322 100%);
  --foil-text:linear-gradient(170deg,#fff3cf 0%,#e8c97f 38%,#c49a4a 62%,#f3dc9d 100%);
  --hand:'Gveret Levin','Heebo',cursive; --light:'Heebo',sans-serif;
  --gap:clamp(18px,2.2vw,52px);
}
*{box-sizing:border-box;margin:0;padding:0}
html{background:var(--night)}
body{font-family:var(--light);font-weight:300;color:var(--gold-l);background:var(--night);overflow-x:hidden}
.poster{position:relative;isolation:isolate;padding:clamp(26px,3.4vw,84px) clamp(22px,3.6vw,88px) clamp(26px,3vw,70px);
  background:
   radial-gradient(ellipse 55% 14% at 50% 0%, rgba(240,205,130,.13), transparent 70%),
   radial-gradient(ellipse 50% 12% at 50% 100%, rgba(240,205,130,.09), transparent 70%),
   var(--night)}
/* מסגרת זהב כפולה סביב הפוסטר */
.poster::before,.poster::after{content:"";position:absolute;pointer-events:none;z-index:6}
.poster::before{inset:clamp(10px,1.3vw,32px);border:2px solid transparent;border-image:var(--foil) 1}
.poster::after{inset:clamp(18px,2.1vw,50px);border:1px solid rgba(201,161,92,.45)}
.stars{position:absolute;inset:0;z-index:-1;opacity:.5;
  background-image:
   radial-gradient(1.5px 1.5px at 8% 4%, #f1dfb9, transparent),radial-gradient(1px 1px at 22% 9%, #f1dfb9, transparent),
   radial-gradient(1.5px 1.5px at 88% 6%, #f1dfb9, transparent),radial-gradient(1px 1px at 76% 12%, #f1dfb9, transparent),
   radial-gradient(1px 1px at 14% 30%, #f1dfb9, transparent),radial-gradient(1px 1px at 93% 38%, #f1dfb9, transparent),
   radial-gradient(1px 1px at 4% 55%, #f1dfb9, transparent),radial-gradient(1.5px 1.5px at 96% 62%, #f1dfb9, transparent),
   radial-gradient(1px 1px at 10% 82%, #f1dfb9, transparent),radial-gradient(1px 1px at 90% 90%, #f1dfb9, transparent),
   radial-gradient(1px 1px at 50% 98%, #f1dfb9, transparent)}

/* ───── כותרת ───── */
header{position:relative;text-align:center;padding:clamp(30px,4vw,100px) 0 clamp(36px,4.6vw,110px)}
.orn{display:flex;align-items:center;justify-content:center;gap:22px;color:var(--gold)}
.orn i{display:block;height:1px;width:clamp(70px,13vw,320px);background:linear-gradient(90deg,transparent,var(--gold))}
.orn i:last-child{background:linear-gradient(270deg,transparent,var(--gold))}
.orn b{font-weight:300;font-size:clamp(16px,1.9vw,44px);line-height:1}
h1{margin-top:clamp(14px,1.8vw,40px);font-weight:300;font-size:clamp(64px,12vw,300px);line-height:1;letter-spacing:.02em;
  background:var(--foil-text);-webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 0 40px rgba(201,161,92,.25))}
.years{margin-top:clamp(8px,1.3vw,30px);font-size:clamp(22px,3.8vw,94px);letter-spacing:.34em;direction:ltr;unicode-bidi:isolate;
  background:var(--foil-text);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
header .orn.bottom{margin-top:clamp(18px,2.2vw,50px)}

/* ───── פריסה: טבעת סביב התמונה המרכזית ───── */
.band{column-count:4;column-gap:var(--gap)}
.band > *{break-inside:avoid;display:block;margin-bottom:var(--gap)}
.mid{display:grid;grid-template-columns:repeat(4,1fr);column-gap:var(--gap);margin:0 0 var(--gap)}
.side{display:flex;flex-direction:column;justify-content:space-between;gap:var(--gap)}
.side.l{grid-column:1}.side.r{grid-column:4}

/* ───── התמונה המרכזית ───── */
.hero{grid-column:2 / 4;position:relative;align-self:stretch;background:var(--foil);
  box-shadow:0 0 clamp(50px,6vw,160px) rgba(201,161,92,.38),0 30px 80px -20px rgba(0,0,0,.8)}
.hero::before{content:"";position:absolute;inset:calc(clamp(5px,.55vw,13px) * -2.4);border:1px solid rgba(201,161,92,.55);pointer-events:none}
.hero .spacer{aspect-ratio:2153/3214;width:100%}
.hero-in{position:absolute;inset:clamp(5px,.55vw,13px);overflow:hidden;background:var(--panel)}
.hero-in img{display:block;width:100%;height:100%;object-fit:cover;object-position:88% 10%}
.hero-in .light{position:absolute;inset:0;mix-blend-mode:screen;pointer-events:none;
  background:radial-gradient(ellipse 60% 45% at 50% 62%, rgba(201,161,92,.20), transparent 70%)}
.hero-in .hq{position:absolute;left:5%;top:23%;width:42%;font-family:var(--hand);font-size:clamp(28px,3.4vw,84px);line-height:1.22;
  transform:rotate(-4deg);background:var(--foil-text);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
  filter:drop-shadow(0 2px 14px rgba(0,0,0,.7))}
.hero-in .hq::after{content:"✦";display:block;margin-top:.45em;font-family:var(--light);font-size:.38em;-webkit-text-fill-color:var(--gold)}
.hero-in::after{content:"";position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 120px rgba(0,0,0,.45)}

/* ───── תמונות במסגרות זהב ───── */
.photo{background:var(--foil);padding:clamp(3px,.3vw,7px);box-shadow:0 18px 40px -14px rgba(0,0,0,.85),0 0 24px rgba(201,161,92,.08)}
.photo .mat{background:var(--panel);padding:clamp(6px,.8vw,18px)}
.photo img{display:block;width:100%;height:auto}
.photo.ph .mat{display:flex;align-items:center;justify-content:center;color:var(--gold);font-family:var(--hand);font-size:2em}

/* ───── ציטוטים ───── */
.quote{position:relative;background:var(--foil);padding:clamp(2px,.2vw,5px);box-shadow:0 18px 40px -14px rgba(0,0,0,.85),0 0 24px rgba(201,161,92,.1)}
.qin{position:relative;background:linear-gradient(165deg,#1f1710,#120d08 70%);padding:clamp(26px,3vw,70px) clamp(24px,2.7vw,64px) clamp(22px,2.4vw,56px);overflow:hidden}
.qin::before{content:"";position:absolute;inset:clamp(7px,.8vw,18px);border:1px solid rgba(201,161,92,.38);pointer-events:none}
.mark{position:absolute;top:-.04em;right:.16em;font-family:var(--hand);font-size:clamp(80px,9vw,230px);line-height:1;color:var(--gold);opacity:.38}
.quote p{position:relative;font-family:var(--hand);line-height:1.38;padding-top:.45em;
  background:var(--foil-text);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.sz-s p{font-size:clamp(34px,4.3vw,108px);line-height:1.18}
.sz-m p{font-size:clamp(26px,3.05vw,76px)}
.sz-l p{font-size:clamp(23px,2.55vw,64px)}

.emo{background:none;-webkit-text-fill-color:initial;font-family:'Noto Color Emoji',sans-serif}
footer{position:relative;text-align:center;padding:clamp(10px,2vw,50px) 0 clamp(26px,3vw,70px)}
footer .big{margin-top:clamp(10px,1.4vw,34px);font-family:var(--hand);font-size:clamp(36px,5.4vw,140px);line-height:1.2;
  background:var(--foil-text);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
footer .small{font-size:clamp(14px,1.5vw,34px);letter-spacing:.3em;margin-top:.5em;color:var(--gold-d)}

${cfg.compact ? '' : `@media (max-width:1500px){.band{column-count:3}}
@media (max-width:1000px){.band{column-count:2}.mid{display:block}.side{margin-bottom:var(--gap)}.hero{margin-bottom:var(--gap)}}
@media (max-width:560px){.band{column-count:1}}`}
${cfg.compact ? compactCss : ''}

/* ───── מצב ארוז: עמודות בגובה שווה, בלי חורים ───── */
.pk{display:flex !important;column-count:auto !important;gap:var(--gap);flex-direction:row !important;justify-content:flex-start !important;align-items:flex-start}
.pk > .col{flex:1 1 0;min-width:0;display:flex !important;flex-direction:column;gap:var(--gap);margin:0 !important}
.pk .col > *{margin:0 !important;flex:none;break-inside:auto}
.pk .photo{display:flex}
.pk .photo .mat{flex:1;min-width:0;min-height:0;display:flex}
.pk .photo img{width:100%;height:100%;object-fit:cover;object-position:50% 28%}
.pk .quote .qin{height:100%;display:flex;flex-direction:column;justify-content:center}
.packed .hero .spacer{display:none}
@page{margin:0}
</style>
</head>
<body>
<div class="poster${cfg.compact ? ' c' : ''}">
  <div class="stars"></div>
  <header>
    <div class="orn"><i></i><b>✦</b><i></i></div>
    <h1>רחל חנן</h1>
    <div class="years">1929 – 2026</div>
    <div class="orn bottom"><i></i><b>◆</b><i></i></div>
  </header>

  <main>
    <section class="band top" data-cols="${cfg.compact ? 8 : 4}">
${render(parts.top)}
    </section>

    <section class="mid">
      <div class="side l"${cfg.compact ? '' : ' data-cols="1"'}>
${parts.feature ? '<div class="feat">' + render([{ type: 'p', ...parts.feature }]) + '</div>' : ''}
${cfg.compact ? '<div class="sp" data-cols="2">' + render(parts.L) + '</div>' : render(parts.L)}
      </div>
      <div class="hero"><div class="spacer"></div><div class="hero-in">
        <img src="assets/hero.jpg" alt="רחל חנן">
        <div class="light"></div>
        <div class="hq">${br(heroQuote)}</div>
      </div></div>
      <div class="side r"${cfg.compact ? '' : ' data-cols="1"'}>
${cfg.compact ? '<div class="sp" data-cols="2">' + render(parts.R) + '</div>' : render(parts.R)}
      </div>
    </section>

    <section class="band bottom" data-cols="${cfg.compact ? 8 : 4}">
${render(parts.bottom)}
    </section>
  </main>

  <footer>
    <div class="orn"><i></i><b>✦</b><i></i></div>
    <div class="big">זכרה לברכה</div>
    <div class="small">סבתא מצחיקה</div>
  </footer>
</div>

<script>
(async function () {
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  const poster = document.querySelector('.poster');
  const compact = poster.classList.contains('c');
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;visibility:hidden;width:var(--gap)';
  poster.appendChild(probe);
  const gap = probe.getBoundingClientRect().width; probe.remove();

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function measure(region, n) {
    const els = [...region.children];
    const w = (region.getBoundingClientRect().width - (n - 1) * gap) / n;
    const m = document.createElement('div');
    m.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;width:' + w + 'px';
    poster.appendChild(m);
    els.forEach(el => { el.style.height = ''; m.appendChild(el); });
    const items = els.map(el => ({ el, q: el.classList.contains('quote'), h: el.getBoundingClientRect().height }));
    m.remove();
    return items;
  }

  // עלות של חלוקה לעמודות: כמה צריך לחתוך/למתוח תמונות כדי שכל העמודות יסתיימו באותו גובה
  function colStats(c, items) {
    let Q = 0, P = 0, qq = 0;
    c.forEach((k, j) => { if (items[k].q) { Q += items[k].h; if (j > 0 && items[c[j - 1]].q) qq++; } else P += items[k].h; });
    return { Q, P, qq, n: c.length };
  }
  function cost(cols, items, Ht) {
    const st = cols.map(c => colStats(c, items));
    const H = Ht || st.reduce((a, s, i) => a + s.Q + s.P + gap * (s.n - 1), 0) / cols.length;
    let total = 0;
    st.forEach(s => {
      if (s.n === 0) { total += 1e6; return; }
      const avail = H - gap * (s.n - 1) - s.Q;
      if (s.P > 0) {
        const r = avail / s.P;
        if (r < 0.72) total += 60 + (0.72 - r) * 600; else if (r > 1.3) total += 100 + (r - 1.3) * 800; else total += Math.pow(Math.log(r), 2) * 12;
      } else {
        const sc = (H - gap * (s.n - 1)) / s.Q;
        if (sc < 0.98) total += 80; else total += Math.pow(Math.log(sc), 2) * 5;
      }
      total += s.qq * 0.6;
    });
    return total;
  }
  function optimize(items, n, Ht) {
    const R = rng(11); let best = null, bestC = 1e18;
    for (let rs = 0; rs < 8; rs++) {
      const order = items.map((_, i) => i);
      if (rs > 0) for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
      let cols = Array.from({ length: n }, () => []); const sums = Array(n).fill(0);
      order.forEach(k => { const c = sums.indexOf(Math.min(...sums)); cols[c].push(k); sums[c] += items[k].h + gap; });
      let cur = cost(cols, items, Ht);
      for (let it = 0; it < 9000; it++) {
        const a = Math.floor(R() * n), b = Math.floor(R() * n);
        if (!cols[a].length) continue;
        const ia = Math.floor(R() * cols[a].length);
        const cand = cols.map(c => c.slice());
        if (R() < 0.5 && cols[b].length && a !== b) { const ib = Math.floor(R() * cols[b].length); [cand[a][ia], cand[b][ib]] = [cand[b][ib], cand[a][ia]]; }
        else { const k = cand[a].splice(ia, 1)[0]; cand[b].splice(Math.floor(R() * (cand[b].length + 1)), 0, k); }
        const c2 = cost(cand, items, Ht); if (c2 < cur) { cols = cand; cur = c2; }
      }
      if (cur < bestC) { bestC = cur; best = cols; }
    }
    const st = best.map(c => colStats(c, items));
    const Hpref = Ht || st.reduce((a, s) => a + s.Q + s.P + gap * (s.n - 1), 0) / n;
    return { cols: best, Hpref, cost: bestC };
  }
  function apply(region, res, items, H) {
    region.classList.add('pk'); region.innerHTML = ''; region.style.height = H + 'px';
    const rs = [];
    res.cols.forEach(c => {
      const col = document.createElement('div'); col.className = 'col'; col.style.height = H + 'px';
      const s = colStats(c, items); const avail = H - gap * (c.length - 1);
      c.forEach(k => {
        const it = items[k]; let h;
        if (s.P > 0) h = it.q ? it.h : it.h * ((avail - s.Q) / s.P); else h = it.h * (avail / s.Q);
        it.el.style.height = h + 'px'; col.appendChild(it.el);
      });
      rs.push(s.P > 0 ? +((avail - s.Q) / s.P).toFixed(2) : +(avail / s.Q).toFixed(2));
      region.appendChild(col);
    });
    return rs;
  }

  const top = document.querySelector('.band.top'), bottom = document.querySelector('.band.bottom');
  const L = document.querySelector('.side.l .sp') || document.querySelector('.side.l'), Rr = document.querySelector('.side.r .sp') || document.querySelector('.side.r');
  const feat = document.querySelector('.side.l .feat'); const featH = feat ? feat.getBoundingClientRect().height : 0;
  const mid = document.querySelector('.mid'), hero = document.querySelector('.hero'), main = document.querySelector('main');
  const heroNat = hero.querySelector('.spacer').getBoundingClientRect().height;

  const iT = measure(top, +top.dataset.cols), iB = measure(bottom, +bottom.dataset.cols);
  const iL = measure(L, +L.dataset.cols), iR = measure(Rr, +Rr.dataset.cols);
  const natSide = it => it.reduce((a, x) => a + x.h, 0);
  const report = {};

  let Hm;
  if (compact) Hm = heroNat; else Hm = Math.max(heroNat, (natSide(iL) + gap * (iL.length - 1) + natSide(iR) + gap * (iR.length - 1)) / 2);
  const HmL = featH ? Hm - featH - gap : Hm;
  const rL = optimize(iL, +L.dataset.cols, HmL), rR = optimize(iR, +Rr.dataset.cols, Hm);
  const rT0 = optimize(iT, +top.dataset.cols), rB0 = optimize(iB, +bottom.dataset.cols);
  let Ha = rT0.Hpref, Hb = rB0.Hpref;
  if (compact) {
    const mh = main.clientHeight, A = mh - 2 * gap - Hm;
    const sa = Ha / (Ha + Hb); Ha = A * sa; Hb = A - Ha;
    main.style.justifyContent = 'flex-start'; main.style.gap = gap + 'px';
  }
  const rT = optimize(iT, +top.dataset.cols, Ha), rB = optimize(iB, +bottom.dataset.cols, Hb);
  report.top = apply(top, rT, iT, Ha); report.bottom = apply(bottom, rB, iB, Hb);
  report.L = apply(L, rL, iL, HmL); report.R = apply(Rr, rR, iR, Hm);
  hero.style.height = Hm + 'px'; mid.style.margin = '0'; mid.style.height = Hm + 'px';
  report.H = { Ha: Math.round(Ha), Hm: Math.round(Hm), Hb: Math.round(Hb) };
  document.documentElement.classList.add('packed');
  window.__pack = report;
  document.body.dataset.packed = '1';
})();
</script>
</body>
</html>
`;
}

const only = process.env.ONLY; // 'wide' | 'a35x50'

(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();

  for (const cfg of FORMATS) {
    if (only && only !== cfg.id) continue;
    const parts = compose(cfg);
    fs.writeFileSync(path.join(ROOT, cfg.html), makeHtml(cfg, parts));
    console.log(`[${cfg.id}] ${cfg.html}: ${photoPool.length} תמונות, ${quotes.length} ציטוטים (למעלה ${parts.top.length}, צדדים ${parts.L.length}+${parts.R.length}, למטה ${parts.bottom.length})`);
    const url = 'file://' + path.join(ROOT, cfg.html);

    const probe = await browser.newPage({ viewport: { width: cfg.vw, height: cfg.vh }, deviceScaleFactor: 1 });
    await probe.goto(url);
    await probe.evaluate(() => document.fonts.ready);
    await probe.waitForFunction(() => document.body.dataset.packed === '1', null, { timeout: 60000 });
    const m = await probe.evaluate(() => {
      const poster = document.querySelector('.poster');
      const main = document.querySelector('main');
      const r = el => el.getBoundingClientRect();
      const hero = r(document.querySelector('.hero'));
      // האם התוכן חורג מהקנבס?
      const sideH = [...document.querySelectorAll('.side')].map(e => Math.round(e.scrollHeight)); const kids = [...document.querySelectorAll('.band, .mid, header, footer')].map(e => Math.round(r(e).height));
      return {
        scrollH: document.documentElement.scrollHeight,
        posterH: Math.round(r(poster).height), mainScroll: main.scrollHeight, mainClient: main.clientHeight,
        heroMid: Math.round(hero.top + scrollY + hero.height / 2), sections: kids, sideH,
        lastBottom: Math.round(Math.max(...[...document.querySelectorAll('.band.bottom > *')].map(e => r(e).bottom + scrollY))),
        footerTop: Math.round(r(document.querySelector('footer')).top + scrollY),
      };
    });
    console.log(`[${cfg.id}]`, JSON.stringify(m));
    console.log(`[${cfg.id}] pack`, JSON.stringify(await probe.evaluate(() => window.__pack)));
    await probe.close();

    if (!cfg.compact) {
      // פוסטר ארוך: להישאר מתחת למגבלת ה-16384 פיקסלים של כרום
      const dsf = Math.min(2, Math.floor((16000 / m.scrollH) * 100) / 100);
      const page = await browser.newPage({ viewport: { width: cfg.vw, height: cfg.vh }, deviceScaleFactor: dsf });
      await page.goto(url); await page.evaluate(() => document.fonts.ready); await page.waitForFunction(() => document.body.dataset.packed === '1', null, { timeout: 60000 }); await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(ROOT, cfg.png), fullPage: true });
      await page.close();
      const pdfPage = await browser.newPage({ viewport: { width: cfg.vw, height: cfg.vh } });
      await pdfPage.goto(url); await pdfPage.evaluate(() => document.fonts.ready); await pdfPage.waitForFunction(() => document.body.dataset.packed === '1', null, { timeout: 60000 });
      await pdfPage.addStyleTag({ content: '@page{margin:0;size:2400px ' + m.scrollH + 'px} html,body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}' });
      await pdfPage.pdf({ path: path.join(ROOT, cfg.pdf), width: '2400px', height: m.scrollH + 'px', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, pageRanges: '1' });
      await pdfPage.close();
    } else {
      // 35×50 ס"מ: PNG ב-300dpi (scale 3.125) ו-PDF בעמוד בגודל המדויק
      const page = await browser.newPage({ viewport: { width: cfg.vw, height: cfg.vh }, deviceScaleFactor: 300 / 96 });
      await page.goto(url); await page.evaluate(() => document.fonts.ready); await page.waitForFunction(() => document.body.dataset.packed === '1', null, { timeout: 60000 }); await page.waitForTimeout(600);
      const el = await page.$('.poster');
      await el.screenshot({ path: path.join(ROOT, cfg.png) });
      await page.close();
      const pdfPage = await browser.newPage({ viewport: { width: cfg.vw, height: cfg.vh } });
      await pdfPage.goto(url); await pdfPage.evaluate(() => document.fonts.ready); await pdfPage.waitForFunction(() => document.body.dataset.packed === '1', null, { timeout: 60000 });
      await pdfPage.addStyleTag({ content: '@page{margin:0;size:35cm 50cm} html,body{margin:0;width:35cm;height:50cm;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact}' });
      await pdfPage.pdf({ path: path.join(ROOT, cfg.pdf), width: '35cm', height: '50cm', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, pageRanges: '1' });
      await pdfPage.close();
    }
    console.log(`[${cfg.id}] ${cfg.png} + ${cfg.pdf} נוצרו`);
  }
  await browser.close();
})();

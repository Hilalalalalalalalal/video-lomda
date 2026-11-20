// בונה את דף ההנצחה של רחל חנן: index.html + poster.png
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

// ציטוטים. size: s=קצר ובולט, m=רגיל, l=ארוך. side: קצרים שמתאימים לעמודות הצד
const quotes = [
  { t: 'אף מילה למורגנשטיין.', size: 's' },
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
  { t: '״אני סבתא מצחיקה…״ כשתרצי לקנות משהו לעצמך, אבל רק לעצמך, תבואי אליי, אני אתן לך כסף.', size: 'l' },
  { t: 'לא, לא, זה לא בסדר.', size: 's', side: 'R' },
  { t: 'את לא יכולה לדבר אליהם ככה.', size: 'm' },
  { t: 'לשנוא זה רגש נוראי…', size: 'm' },
  { t: 'אני לא שונאת. מה זו המילה הזו בכלל, שונאת?', size: 'm' },
  { t: 'אין חיים טובים, יש רגעים טובים.', size: 's', side: 'L' },
  { t: 'אם את מתחתנת עם מישהו בשביל לשנות אותו, אל תתחתני.', size: 'm' },
];

// ───── חלוקת התוכן: טבעת סביב התמונה המרכזית ─────
let photoPool = files.map(f => ({ src: 'photos/' + encodeURI(f), ...jpegSize(path.join(photosDir, f)) }));
if (!photoPool.length) photoPool = Array.from({ length: 9 }, () => ({ ph: true, w: 4, h: 5 }));

const sideQuotes = { L: quotes.filter(q => q.side === 'L'), R: quotes.filter(q => q.side === 'R') };
const restQuotes = quotes.filter(q => !q.side);

// עמודות צד: שתי תמונות לרוחב ושני ציטוטים קצרים בכל צד
const landscape = photoPool.map((p, i) => ({ p, i, d: Math.abs(p.w / p.h - 1.4) }))
  .filter(o => o.p.w / o.p.h > 1.15).sort((a, b) => a.d - b.d);
const sidePick = { L: [], R: [] };
for (const o of landscape) {
  const s = sidePick.L.length <= sidePick.R.length ? 'L' : 'R';
  if (sidePick[s].length < 2) sidePick[s].push(o.i);
  if (sidePick.L.length === 2 && sidePick.R.length === 2) break;
}
const used = new Set([...sidePick.L, ...sidePick.R]);
const sidePhotos = { L: sidePick.L.map(i => photoPool[i]), R: sidePick.R.map(i => photoPool[i]) };
const restPhotos = photoPool.filter((_, i) => !used.has(i));

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
const sideMix = s => {
  const out = [], ps = sidePhotos[s], qs = sideQuotes[s];
  const n = Math.max(ps.length, qs.length);
  for (let i = 0; i < n; i++) { if (ps[i]) out.push({ type: 'p', ...ps[i] }); if (qs[i]) out.push({ type: 'q', ...qs[i] }); }
  return out;
};

const all = mix(restPhotos, restQuotes);
const half = Math.ceil(all.length / 2);
const topItems = all.slice(0, half);
const bottomItems = all.slice(half);

const render = list => list.map(it => {
  if (it.type === 'p') {
    return it.src
      ? `<figure class="photo"><div class="mat"><img src="${it.src}" alt=""></div></figure>`
      : `<figure class="photo ph"><div class="mat" style="aspect-ratio:4/5"><span>תמונה</span></div></figure>`;
  }
  return `<blockquote class="quote sz-${it.size}"><div class="qin"><span class="mark">״</span><p>${it.t}</p></div></blockquote>`;
}).join('\n');

const br = s => s.replace(/\n/g, '<br>');

const html = `<!doctype html>
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
.photo img{display:block;width:100%;height:auto;filter:saturate(.96) contrast(1.02)}
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

@media (max-width:1500px){.band{column-count:3}}
@media (max-width:1000px){.band{column-count:2}.mid{display:block}.side{margin-bottom:var(--gap)}.hero{margin-bottom:var(--gap)}}
@media (max-width:560px){.band{column-count:1}}
</style>
</head>
<body>
<div class="poster">
  <div class="stars"></div>
  <header>
    <div class="orn"><i></i><b>✦</b><i></i></div>
    <h1>רחל חנן</h1>
    <div class="years">1929 – 2026</div>
    <div class="orn bottom"><i></i><b>◆</b><i></i></div>
  </header>

  <main>
    <section class="band top">
${render(topItems)}
    </section>

    <section class="mid">
      <div class="side l">
${render(sideMix('L'))}
      </div>
      <div class="hero"><div class="spacer"></div><div class="hero-in">
        <img src="assets/hero.jpg" alt="רחל חנן">
        <div class="light"></div>
        <div class="hq">${br(heroQuote)}</div>
      </div></div>
      <div class="side r">
${render(sideMix('R'))}
      </div>
    </section>

    <section class="band bottom">
${render(bottomItems)}
    </section>
  </main>

  <footer>
    <div class="orn"><i></i><b>✦</b><i></i></div>
    <div class="big">זכרה לברכה</div>
    <div class="small">סבתא מצחיקה</div>
  </footer>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, 'index.html'), html);
console.log(`index.html נוצר: ${photoPool.length} תמונות, ${quotes.length} ציטוטים (למעלה ${topItems.length}, צדדים ${sideMix('L').length}+${sideMix('R').length}, למטה ${bottomItems.length})`);

// רינדור ל-PNG. מדידת גובה כדי להישאר מתחת למגבלת ה-16384 פיקסלים של כרום
(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const url = 'file://' + path.join(ROOT, 'index.html');
  const probe = await browser.newPage({ viewport: { width: 2400, height: 1400 }, deviceScaleFactor: 1 });
  await probe.goto(url);
  await probe.evaluate(() => document.fonts.ready);
  const cssH = await probe.evaluate(() => document.documentElement.scrollHeight);
  const heroBox = await probe.evaluate(() => { const r = document.querySelector('.hero').getBoundingClientRect(); return { top: r.top + scrollY, h: r.height }; });
  await probe.close();
  const dsf = Math.min(2, Math.floor((16000 / cssH) * 100) / 100);
  console.log(`גובה ${cssH}px, scale ${dsf}, מרכז התמונה ${Math.round(heroBox.top + heroBox.h / 2)} (מרכז הפוסטר ${Math.round(cssH / 2)})`);
  const page = await browser.newPage({ viewport: { width: 2400, height: 1400 }, deviceScaleFactor: dsf });
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ROOT, 'poster.png'), fullPage: true });
  await browser.close();
  console.log('poster.png נוצר');
})();

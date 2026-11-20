// בונה את דף ההנצחה של רחל חנן: index.html + poster.png
// שימוש: הניחו תמונות בתיקיית photos/ והריצו:  node build.js
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const exts = /\.(jpe?g|png|webp|gif|avif)$/i;
const photosDir = path.join(ROOT, 'photos');
const photos = fs.existsSync(photosDir)
  ? fs.readdirSync(photosDir).filter(f => exts.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  : [];

// שני ציטוטים שמלווים את תמונת הגיבור (משני צדי היד המורמת)
const heroQuotes = {
  right: 'אין חיים טובים,\nיש רגעים טובים.',
  left: 'תמיד תמצא את עצמך\nעם הראש למעלה…',
};

// ציטוטים לקולאז׳. size: s=קצר ובולט, m=רגיל, l=ארוך
const quotes = [
  { t: 'אף מילה למורגנשטיין.', size: 's' },
  { t: 'תדעי לך דבר אחד, אל תלמדי אחרים.', size: 'm' },
  { t: 'אל תשאיר כלום בבטן. מותר להגיד הכל, רק תלוי איך.', size: 'm' },
  { t: 'מותר שקרים לבנים לטובת שלום בית.', size: 'm' },
  { t: 'אם יש לך שקל, תן שקל. אם יש לך 1000 ש״ח, תן 1000 ש״ח… רק אל תצפה לקבל משהו בתמורה.', size: 'l' },
  { t: 'מילה מילה.', size: 's' },
  { t: 'את תקבלי חתיכת עוגה קטנה כי את צריכה לשמור על עצמך 😅', size: 'm' },
  { t: 'אם קבצן כבר השפיל את עצמו לבקש כסף, אל תשפיל אותו יותר בזה שלא תתן לו.', size: 'l' },
  { t: 'את יודעת מי את?', size: 's' },
  { t: 'להיות מנץ׳ – את יודעת מה זה מנץ׳?', size: 'm' },
  { t: 'אני נותנת משהו ושכחתי שנתתי.', size: 'm' },
  { t: 'לא כואב כשמקבלים מכה, רק כשפוגעים בלב…', size: 'm' },
  { t: 'תמיד עושה תחרות הורדות ידיים… עד היום.', size: 'm' },
  { t: '״אני סבתא מצחיקה…״ כשתרצי לקנות משהו לעצמך, אבל רק לעצמך, תבואי אליי, אני אתן לך כסף.', size: 'l' },
  { t: 'לא, לא, זה לא בסדר.', size: 's' },
  { t: 'את לא יכולה לדבר אליהם ככה.', size: 'm' },
  { t: 'לשנוא זה רגש נוראי…', size: 'm' },
  { t: 'אני לא שונאת. מה זו המילה הזו בכלל, שונאת?', size: 'm' },
  { t: 'אם את מתחתנת עם מישהו בשביל לשנות אותו, אל תתחתני.', size: 'm' },
];

// אם אין תמונות מציגים מסגרות ריקות (טיוטה)
const ratios = ['4/5', '1/1', '3/4', '4/3', '4/5', '1/1', '3/4', '5/4', '4/5'];
const photoItems = photos.length
  ? photos.map(f => ({ src: 'photos/' + encodeURI(f) }))
  : ratios.map(r => ({ ph: r }));

// שזירה: התמונות מפוזרות באופן אחיד בין הציטוטים
const items = quotes.map(q => ({ type: 'q', ...q }));
const total = photoItems.length + quotes.length;
photoItems.forEach((ph, i) => {
  const pos = Math.round((i + 0.5) * total / photoItems.length) - 1;
  items.splice(Math.min(pos, items.length), 0, { type: 'p', ...ph });
});

const tones = ['t-cream', 't-rose', 't-sage', 't-gold', 't-sand', 't-lined'];
const tilts = [-1.6, 1.2, -0.7, 1.8, -1.2, 0.8, -1.9, 1.4, -0.5, 1.0];
const tapes = ['tape-gold', 'tape-rose', 'tape-sage', 'tape-gold', 'tape-blue'];
let qn = 0, pn = 0, n = 0;
const cards = items.map(it => {
  const r = tilts[n++ % tilts.length];
  if (it.type === 'p') {
    const tape = tapes[pn++ % tapes.length];
    return it.src
      ? `<figure class="photo ${tape}" style="--r:${r}deg"><img src="${it.src}" alt=""></figure>`
      : `<figure class="photo ph ${tape}" style="--r:${r}deg;aspect-ratio:${it.ph}"><span>תמונה</span></figure>`;
  }
  const tone = tones[qn++ % tones.length];
  return `<blockquote class="quote ${tone} sz-${it.size}" style="--r:${r}deg"><span class="mark">״</span><p>${it.t}</p></blockquote>`;
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
  --night:#140f09; --paper:#f3eadc; --ink:#2a3556; --cream:#f6efe6; --gold:#c9a15c; --gold2:#e5c88f;
  --c-cream:#fffaf0; --c-rose:#f4dcd5; --c-sage:#dfe7d4; --c-gold:#f6e6bf; --c-sand:#ecdcc6;
  --hand:'Gveret Levin','Heebo',cursive; --light:'Heebo',sans-serif;
}
*{box-sizing:border-box;margin:0;padding:0}
html{background:var(--night)}
body{font-family:var(--light);font-weight:300;color:var(--ink);background:var(--paper);min-height:100vh;overflow-x:hidden}

/* ───────── גיבורה ───────── */
.hero{position:relative;background:var(--night);color:var(--cream);overflow:hidden;
  padding:clamp(40px,5vw,120px) 0 0;isolation:isolate}
.hero::before{content:"";position:absolute;inset:0;z-index:-1;
  background:
   radial-gradient(ellipse 60% 9% at 50% 0%, rgba(255,226,170,.10), transparent 75%)}
.stars{position:absolute;inset:0;z-index:-1;opacity:.55;
  background-image:
   radial-gradient(1.5px 1.5px at 8% 12%, #f1dfb9, transparent),
   radial-gradient(1px 1px at 22% 30%, #f1dfb9, transparent),
   radial-gradient(1.5px 1.5px at 88% 18%, #f1dfb9, transparent),
   radial-gradient(1px 1px at 76% 40%, #f1dfb9, transparent),
   radial-gradient(1.5px 1.5px at 14% 62%, #f1dfb9, transparent),
   radial-gradient(1px 1px at 92% 70%, #f1dfb9, transparent),
   radial-gradient(1px 1px at 33% 8%, #f1dfb9, transparent),
   radial-gradient(1.5px 1.5px at 66% 6%, #f1dfb9, transparent),
   radial-gradient(1px 1px at 5% 85%, #f1dfb9, transparent),
   radial-gradient(1px 1px at 95% 92%, #f1dfb9, transparent)}
.orn{display:flex;align-items:center;justify-content:center;gap:20px;color:var(--gold);margin-bottom:clamp(14px,2vw,34px)}
.orn i{display:block;height:1px;width:clamp(60px,10vw,240px);background:linear-gradient(90deg,transparent,var(--gold))}
.orn i:last-child{background:linear-gradient(270deg,transparent,var(--gold))}
.orn b{font-weight:300;font-size:clamp(16px,1.8vw,40px);line-height:1}
.titlebox{text-align:center;position:relative;z-index:3}
h1{font-weight:300;font-size:clamp(60px,11.5vw,280px);line-height:1;letter-spacing:.02em;
  background:linear-gradient(180deg,#fff8ea 20%,#e9d3a8 100%);-webkit-background-clip:text;background-clip:text;color:transparent;
  text-shadow:0 0 60px rgba(201,161,92,.25)}
.years{margin-top:clamp(8px,1.4vw,30px);font-size:clamp(22px,3.8vw,92px);letter-spacing:.3em;color:var(--gold);direction:ltr;unicode-bidi:isolate}
.stage{position:relative;display:flex;justify-content:center;margin-top:clamp(-30px,-1vw,-10px)}
.stage img{display:block;width:min(48vw,1150px);height:auto;position:relative;z-index:1;
  -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 10%,#000 90%,transparent 100%),linear-gradient(180deg,transparent 0,#000 4%,#000 88%,transparent 100%);
  -webkit-mask-composite:source-in;mask-image:linear-gradient(90deg,transparent 0,#000 10%,#000 90%,transparent 100%),linear-gradient(180deg,transparent 0,#000 4%,#000 88%,transparent 100%);mask-composite:intersect;
  }
.hq{position:absolute;z-index:2;top:44%;width:23%;font-family:var(--hand);color:var(--gold2);
  font-size:clamp(28px,3.9vw,96px);line-height:1.25;text-shadow:0 2px 30px rgba(0,0,0,.6)}
.hq.right{right:3.5%;text-align:right;transform:rotate(-4deg)}
.hq.left{left:3.5%;text-align:left;transform:rotate(4deg);top:30%}
.hq::after{content:"✦";display:block;font-family:var(--light);font-size:.4em;color:var(--gold);opacity:.8;margin-top:.5em}
.hq.right::after{text-align:right}.hq.left::after{text-align:left}
.fade{position:relative;height:clamp(140px,15vw,360px);z-index:3;margin-top:clamp(-120px,-5vw,-40px);
  background:linear-gradient(180deg,rgba(20,15,9,0),var(--night) 25%,var(--paper))}

/* ───────── קולאז׳ ───────── */
.paper{position:relative;padding:clamp(10px,1vw,24px) clamp(16px,3.5vw,84px) clamp(30px,4vw,90px);
  background-color:var(--paper);
  background-image:
   url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .42  0 0 0 0 .33  0 0 0 0 .22  0 0 0 .09 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>"),
   radial-gradient(1200px 800px at 90% 20%, rgba(255,235,205,.55), transparent 60%),
   radial-gradient(1000px 800px at 5% 80%, rgba(236,215,190,.6), transparent 60%)}
.paper::before{content:"";display:block;height:clamp(0px,1vw,20px)}
.grid{column-count:4;column-gap:clamp(18px,2.2vw,52px);padding-top:clamp(20px,2vw,50px);position:relative;z-index:4}
.grid > *{break-inside:avoid;display:block;margin-bottom:clamp(22px,2.6vw,60px);transform:rotate(var(--r,0deg))}

.photo{position:relative;background:#fffdf8;padding:clamp(7px,.9vw,20px);border-radius:3px;
  box-shadow:0 18px 40px -16px rgba(60,35,15,.5),0 3px 8px rgba(60,35,15,.12)}
.photo img{display:block;width:100%;height:auto}
.photo::before{content:"";position:absolute;top:calc(clamp(7px,.9vw,20px) * -1.9);left:50%;width:34%;height:clamp(18px,2.2vw,50px);
  transform:translateX(-50%) rotate(-3deg);opacity:.82;box-shadow:0 2px 5px rgba(60,35,15,.15);
  background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.18) 0 6px,transparent 6px 12px)}
.tape-gold::before{background-color:#e8cf95}.tape-rose::before{background-color:#e9b9b1}
.tape-sage::before{background-color:#bfd1ae}.tape-blue::before{background-color:#b4c4de}
.photo.ph{display:flex;align-items:center;justify-content:center;background:repeating-linear-gradient(45deg,#fbf6ee,#fbf6ee 14px,#f5ecdd 14px,#f5ecdd 28px);color:#c3ae93;font-family:var(--hand);font-size:2em}

.quote{position:relative;border-radius:6px;padding:clamp(24px,2.8vw,64px) clamp(22px,2.5vw,58px) clamp(20px,2.2vw,50px);
  box-shadow:0 14px 30px -16px rgba(60,35,15,.45),0 2px 5px rgba(60,35,15,.1);color:var(--ink);font-family:var(--hand)}
.quote .mark{position:absolute;top:-.05em;right:.2em;font-family:var(--hand);font-size:clamp(80px,9vw,230px);line-height:1;color:var(--gold);opacity:.45}
.quote p{position:relative;line-height:1.4;padding-top:.5em}
.sz-s p{font-size:clamp(34px,4.4vw,110px);line-height:1.2}
.sz-m p{font-size:clamp(26px,3.1vw,76px)}
.sz-l p{font-size:clamp(23px,2.6vw,64px)}
.t-cream{background:var(--c-cream)} .t-rose{background:var(--c-rose)} .t-sage{background:var(--c-sage)}
.t-gold{background:var(--c-gold)} .t-sand{background:var(--c-sand)}
.t-lined{background:var(--c-cream)}
.t-lined p{background-image:repeating-linear-gradient(to bottom,transparent 0,transparent calc(1.4em - 2px),rgba(110,135,190,.35) calc(1.4em - 2px),rgba(110,135,190,.35) 1.4em);background-position:0 .5em}

footer{position:relative;text-align:center;margin-top:clamp(10px,2vw,50px);color:#8a6d45;z-index:4}
footer .big{font-family:var(--hand);font-size:clamp(34px,5vw,130px);color:#9a7840;line-height:1.2}
footer .small{font-size:clamp(14px,1.5vw,34px);letter-spacing:.22em;margin-top:.4em;color:#9c8260}
footer .orn{margin:0 0 14px}

@media (max-width:1500px){.grid{column-count:3}}
@media (max-width:1000px){.grid{column-count:2}.hq{display:none}.stage img{width:80vw}}
@media (max-width:560px){.grid{column-count:1}}
@media print{.grid{column-count:4}}
</style>
</head>
<body>
<section class="hero">
  <div class="stars"></div>
  <div class="titlebox">
    <div class="orn"><i></i><b>✦</b><i></i></div>
    <h1>רחל חנן</h1>
    <div class="years">1929 – 2026</div>
  </div>
  <div class="stage">
    <div class="hq right">${br(heroQuotes.right)}</div>
    <img src="assets/hero.jpg" alt="רחל חנן">
    <div class="hq left">${br(heroQuotes.left)}</div>
  </div>
  <div class="fade"></div>
</section>
<div class="paper">
  <main class="grid">
${cards}
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
console.log(`index.html נוצר: ${photos.length} תמונות, ${quotes.length} ציטוטים`);

// רינדור ל-PNG. מדידת גובה כדי להישאר מתחת למגבלת ה-16384 פיקסלים של כרום
(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const url = 'file://' + path.join(ROOT, 'index.html');
  const probe = await browser.newPage({ viewport: { width: 2400, height: 1400 }, deviceScaleFactor: 1 });
  await probe.goto(url);
  await probe.evaluate(() => document.fonts.ready);
  const cssH = await probe.evaluate(() => document.documentElement.scrollHeight);
  await probe.close();
  const dsf = Math.min(2, Math.floor((16000 / cssH) * 100) / 100);
  console.log(`גובה ${cssH}px, scale ${dsf}`);
  const page = await browser.newPage({ viewport: { width: 2400, height: 1400 }, deviceScaleFactor: dsf });
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ROOT, 'poster.png'), fullPage: true });
  await browser.close();
  console.log('poster.png נוצר');
})();

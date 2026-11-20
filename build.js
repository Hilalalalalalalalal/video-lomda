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

// ציטוטים (מאוחדים, ללא כפילויות). size: s=קצר ובולט, m=רגיל, l=ארוך
const quotes = [
  { t: 'אף מילה למורגנשטיין.', size: 's' },
  { t: 'תדעי לך דבר אחד, אל תלמדי אחרים.', size: 'm' },
  { t: 'אל תשאיר כלום בבטן. מותר להגיד הכל, רק תלוי איך.', size: 'm' },
  { t: 'מותר שקרים לבנים לטובת שלום בית.', size: 'm' },
  { t: 'תמיד תמצא את עצמך עם הראש למעלה…', size: 'm' },
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
];

// אם אין מספיק תמונות מציגים מסגרות ריקות (טיוטה)
const PLACEHOLDERS = 9;
const ratios = ['4/5', '1/1', '3/4', '4/3', '4/5', '1/1', '3/4', '5/4', '4/5'];
const photoItems = photos.length
  ? photos.map(f => ({ src: 'photos/' + encodeURI(f) }))
  : Array.from({ length: PLACEHOLDERS }, (_, i) => ({ ph: ratios[i % ratios.length] }));

// שזירה: תמונה, ציטוט, ציטוט, תמונה...
const items = [];
let pi = 0, qi = 0;
const pattern = ['p', 'q', 'q', 'p', 'q', 'p', 'q', 'q'];
let k = 0;
while (pi < photoItems.length || qi < quotes.length) {
  const kind = pattern[k++ % pattern.length];
  if (kind === 'p' && pi < photoItems.length) items.push({ type: 'p', ...photoItems[pi++] });
  else if (qi < quotes.length) items.push({ type: 'q', ...quotes[qi++] });
  else if (pi < photoItems.length) items.push({ type: 'p', ...photoItems[pi++] });
}

const tones = ['t-cream', 't-rose', 't-sage', 't-gold', 't-sand'];
let qn = 0;
const cards = items.map(it => {
  if (it.type === 'p') {
    return it.src
      ? `<figure class="photo"><img src="${it.src}" alt=""></figure>`
      : `<figure class="photo ph" style="aspect-ratio:${it.ph}"><span>תמונה</span></figure>`;
  }
  const tone = tones[qn++ % tones.length];
  return `<blockquote class="quote ${tone} sz-${it.size}"><span class="mark">״</span><p>${it.t}</p></blockquote>`;
}).join('\n');

const html = `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>רחל חנן 1929-2026</title>
<style>
@font-face{font-family:'Heebo';font-weight:300;font-style:normal;src:url('fonts/Heebo-Light.ttf') format('truetype');}
:root{
  --bg:#f5eee4; --ink:#3b2f2a; --muted:#8a766a; --gold:#b48a4a;
  --cream:#fffaf2; --rose:#f1d9d3; --sage:#dfe6d6; --goldsoft:#f3e4c2; --sand:#ead9c4;
}
*{box-sizing:border-box;margin:0;padding:0}
html{background:var(--bg)}
body{
  font-family:'Heebo',sans-serif;font-weight:300;color:var(--ink);
  background:
    radial-gradient(1200px 700px at 85% -10%, #fbe9d6 0%, transparent 60%),
    radial-gradient(1000px 700px at 5% 105%, #efdccb 0%, transparent 60%),
    var(--bg);
  min-height:100vh;
}
.page{max-width:1800px;margin:0 auto;padding:clamp(24px,4vw,80px) clamp(16px,3.5vw,72px) clamp(28px,4vw,72px)}

header{text-align:center;padding:clamp(28px,5vw,90px) 0 clamp(36px,5vw,84px)}
.orn{display:flex;align-items:center;justify-content:center;gap:18px;color:var(--gold);margin-bottom:clamp(14px,2vw,28px)}
.orn i{display:block;height:1px;width:clamp(50px,9vw,150px);background:linear-gradient(90deg,transparent,var(--gold))}
.orn i:last-child{background:linear-gradient(270deg,transparent,var(--gold))}
.orn b{font-weight:300;font-size:clamp(14px,1.6vw,26px);line-height:1}
h1{font-weight:300;font-size:clamp(54px,11vw,210px);line-height:1;letter-spacing:.01em}
.years{margin-top:clamp(10px,1.6vw,26px);font-size:clamp(22px,3.6vw,68px);letter-spacing:.28em;color:var(--gold);direction:ltr;unicode-bidi:isolate}
.sub{margin-top:clamp(16px,2vw,34px);font-size:clamp(14px,1.5vw,26px);color:var(--muted);letter-spacing:.08em}

.grid{column-count:3;column-gap:clamp(14px,1.8vw,32px)}
.grid > *{break-inside:avoid;display:block;margin-bottom:clamp(14px,1.8vw,32px)}

.photo{background:#fff;padding:clamp(6px,.8vw,14px);border-radius:6px;box-shadow:0 10px 30px -12px rgba(80,50,30,.35),0 2px 6px rgba(80,50,30,.08)}
.photo img{display:block;width:100%;height:auto;border-radius:2px}
.photo.ph{display:flex;align-items:center;justify-content:center;background:
  repeating-linear-gradient(45deg,#fbf6ee,#fbf6ee 14px,#f5ecdd 14px,#f5ecdd 28px);
  color:#c3ae93;font-size:clamp(14px,1.6vw,28px);letter-spacing:.2em;border:1px dashed #d8c6ab}

.quote{position:relative;border-radius:14px;padding:clamp(22px,2.6vw,48px) clamp(20px,2.4vw,44px);
  box-shadow:0 8px 24px -14px rgba(80,50,30,.3);overflow:hidden}
.quote .mark{position:absolute;top:-.12em;right:.18em;font-size:clamp(70px,8vw,150px);line-height:1;color:var(--gold);opacity:.28}
.quote p{position:relative;line-height:1.5}
.sz-s p{font-size:clamp(26px,3.3vw,62px);line-height:1.25;padding-top:.35em}
.sz-m p{font-size:clamp(20px,2.2vw,40px);padding-top:.45em}
.sz-l p{font-size:clamp(18px,1.9vw,34px);padding-top:.5em}
.t-cream{background:var(--cream)} .t-rose{background:var(--rose)} .t-sage{background:var(--sage)}
.t-gold{background:var(--goldsoft)} .t-sand{background:var(--sand)}

footer{text-align:center;margin-top:clamp(20px,3vw,56px);color:var(--muted);font-size:clamp(14px,1.5vw,26px);letter-spacing:.12em}
footer .orn{margin:0 0 14px}

@media (max-width:1000px){.grid{column-count:2}}
@media (max-width:560px){.grid{column-count:1}}
@media print{.grid{column-count:3}}
</style>
</head>
<body>
<div class="page">
  <header>
    <div class="orn"><i></i><b>✦</b><i></i></div>
    <h1>רחל חנן</h1>
    <div class="years">1929 – 2026</div>
    <div class="sub">סבתא מצחיקה</div>
  </header>
  <main class="grid">
${cards}
  </main>
  <footer>
    <div class="orn"><i></i><b>✦</b><i></i></div>
    זכרה לברכה
  </footer>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, 'index.html'), html);
console.log(`index.html נוצר: ${photos.length} תמונות, ${quotes.length} ציטוטים`);

// רינדור ל-PNG
(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ROOT, 'poster.png'), fullPage: true });
  await browser.close();
  console.log('poster.png נוצר');
})();

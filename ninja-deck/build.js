const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");
const { applyTheme } = require("/root/.claude/skills/synced/a6989dc2-f05c-4e8d-bc9c-903104996810_409acdd9-7fa2-40e8-a303-fcc3bd85b65e/pptx/scripts/apply_theme.js");

const AS = (n) => path.join(__dirname, "assets", n);
const dims = JSON.parse(fs.readFileSync(AS("photo-dims.json")));

const THEME = {
  name: "Ninja Sketch",
  headFontFace: "Calibri",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "14213D", lt1: "FFFFFF", dk2: "0B1B3A", lt2: "F1F5FB",
    accent1: "E63946", accent2: "1D9BF0", accent3: "FFC933", accent4: "2EC4B6", accent5: "7B2CBF", accent6: "FF8C42",
    hlink: "1D9BF0", folHlink: "7B2CBF",
  },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.rtlMode = true;
pres.title = "ספורט נינג'ה - המסע של שרד";
pres.author = "שרד";
pres.theme = { headFontFace: "Calibri", bodyFontFace: "Calibri" };
const C = pres.SchemeColor;
const FONT = "Calibri";

// ---------- layouts ----------
pres.defineSlideMaster({
  title: "NINJA_LIGHT",
  background: { path: AS("bg-light.jpg") },
  objects: [
    { image: { x: 0.65, y: 0.4, w: 0.75, h: 0.96, path: AS("bolt.png") } },
    { placeholder: { options: { name: "title", type: "title", x: 1.6, y: 0.35, w: 11.1, h: 1.05, fontFace: FONT, fontSize: 44, bold: true, color: C.text1, align: "right", valign: "middle", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "NINJA_DARK",
  background: { path: AS("bg-dark.jpg") },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 5.0, y: 1.15, w: 7.7, h: 1.9, fontFace: FONT, fontSize: 88, bold: true, color: C.background1, align: "right", valign: "middle", margin: 0 }, text: "" } },
  ],
});

// ---------- helpers ----------
const IMG = (slide, file, x, y, w, h, name, extra = {}) =>
  slide.addImage({ path: AS(file), x, y, w, h, objectName: name, altText: "", ...extra });
const TXT = (slide, runs, o) =>
  slide.addText(runs, { fontFace: FONT, rtlMode: true, lang: "he-IL", align: "right", valign: "middle", margin: 0, isTextBox: true, color: C.text1, ...o });
const photoH = (key, w) => (w * dims[key].h) / dims[key].w;

// =========== 1. כותרת ===========
pres.addSection({ title: "פתיחה" });
{
  const s = pres.addSlide({ masterName: "NINJA_DARK", sectionTitle: "פתיחה" });
  const pw = 3.75, ph = photoH("p3", pw);
  IMG(s, "photo-reach.jpg", 0.9, 0.85, pw, ph, "A03zoom-photo", { rotate: -4 });
  IMG(s, "tape.png", 2.2, 0.62, 1.35, 0.42, "A04fade-tape", { rotate: -8 });
  s.addText("ספורט נינג'ה", { placeholder: "title", rtlMode: true, lang: "he-IL", objectName: "A01flyR-title" });
  TXT(s, "המסע של שרד בעולם המכשולים", { x: 5.0, y: 3.2, w: 7.7, h: 0.8, fontSize: 36, bold: true, color: C.accent3, objectName: "A02flyR-sub" });
  TXT(s, "כיתה ג׳  ·  חוג נינג'ה במתנ״ס פרדס חנה", { x: 5.0, y: 4.05, w: 7.7, h: 0.6, fontSize: 24, color: C.background1, objectName: "A05fade-sub2" });
  IMG(s, "fig-hero-white.png", 10.6, 4.75, 1.9, 2.28, "A06flyB-hero");
  IMG(s, "arr-left-long.png", 6.6, 5.55, 2.5, 0.8, "A07wipeR-arrow");
  IMG(s, "bolt-big.png", 5.3, 4.9, 1.0, 1.25, "A08zoom-bolt");
  IMG(s, "sparkle.png", 4.9, 0.6, 0.6, 0.6, "A09zoom-sp1");
  s.addNotes("שלום לכולם! קוראים לי שרד, ואני אספר לכם על ספורט שאני אוהבת: נינג'ה.\n\n(אפשר להחליף לגוף ראשון - ״אני״ - אם שרד היא זו שמציגה.)");
}

// =========== 2. היסטוריה ===========
pres.addSection({ title: "היסטוריה" });
{
  const s = pres.addSlide({ masterName: "NINJA_LIGHT", sectionTitle: "היסטוריה" });
  s.addText("מאיפה זה בא? קצת היסטוריה", { placeholder: "title", rtlMode: true, lang: "he-IL", objectName: "A01fade-title" });
  const cards = [
    { x: 9.2, icon: "icon-tv.png", head: "1997  ·  יפן", body: "תוכנית טלוויזיה יפנית בשם ״סאסקה״: מתחרים עוברים מכשולים ענקיים.", col: C.accent1 },
    { x: 4.9, icon: "icon-star.png", head: "2009  ·  ארה״ב", body: "״אמריקן נינג'ה ווריור״ - ופתאום כל העולם רוצה לתלות, לקפוץ ולטפס.", col: C.accent2 },
    { x: 0.6, icon: "icon-globe.png", head: "היום  ·  כל העולם", body: "אולמות נינג'ה לילדים ולמבוגרים, גם כאן בישראל!", col: C.accent4 },
  ];
  cards.forEach((c, i) => {
    const n = 2 + i * 3;
    IMG(s, "card-w.png", c.x, 1.65, 3.5, 3.9, `A${String(n).padStart(2, "0")}flyB-card${i}`);
    IMG(s, c.icon, c.x + 1.0, 1.85, 1.5, 1.5, `A${String(n).padStart(2, "0")}flyB-icon${i}`);
    TXT(s, c.head, { x: c.x + 0.2, y: 3.4, w: 3.1, h: 0.6, fontSize: 28, bold: true, color: c.col, align: "center", objectName: `A${String(n).padStart(2, "0")}flyB-head${i}` });
    TXT(s, c.body, { x: c.x + 0.25, y: 4.0, w: 3.0, h: 1.4, fontSize: 18, valign: "top", objectName: `A${String(n).padStart(2, "0")}flyB-body${i}` });
    if (i < 2) IMG(s, "arr-left.png", c.x - 0.78, 3.15, 0.7, 0.6, `A${String(n + 1).padStart(2, "0")}wipeR-arr${i}`);
  });
  IMG(s, "card-fact.png", 0.6, 5.85, 12.1, 1.3, "A11fade-fact");
  IMG(s, "fig-pullup.png", 0.85, 5.95, 0.9, 1.08, "A12flyL-fig");
  TXT(s, [
    { text: "ידעתם? ", options: { bold: true, color: C.accent1 } },
    { text: "המילה ״נינג'ה״ באה מלוחמים סודיים ביפן העתיקה - זריזים, שקטים ומצוינים בטיפוס!", options: {} },
  ], { x: 2.0, y: 5.95, w: 10.5, h: 1.1, fontSize: 22, objectName: "A12fade-facttext" });
  s.addNotes("הכול התחיל ביפן ב-1997 בתוכנית טלוויזיה שנקראת ״סאסקה״ (בעולם קוראים לה Ninja Warrior). אחר כך הגיעה הגרסה האמריקאית (2009), והספורט התפשט לכל העולם.");
}

// =========== 3. אולימפי ===========
{
  const s = pres.addSlide({ masterName: "NINJA_LIGHT", sectionTitle: "היסטוריה" });
  s.addText("הספורט הזה הולך לאולימפיאדה!", { placeholder: "title", rtlMode: true, lang: "he-IL", objectName: "A01fade-title" });
  IMG(s, "card-big.png", 7.6, 1.7, 5.1, 4.2, "A02zoom-big");
  IMG(s, "icon-medal.png", 9.3, 1.85, 1.7, 1.7, "A03zoom-medal");
  TXT(s, "לוס אנג'לס 2028", { x: 7.8, y: 3.6, w: 4.7, h: 0.75, fontSize: 38, bold: true, color: C.accent1, align: "center", objectName: "A03fade-la" });
  TXT(s, "מסלול מכשולים בסגנון נינג'ה נכנס לאולימפיאדה!", { x: 8.0, y: 4.4, w: 4.3, h: 1.3, fontSize: 22, align: "center", valign: "top", objectName: "A03fade-la2" });
  IMG(s, "star.png", 12.0, 1.4, 0.8, 0.8, "A09zoom-star");
  const rows = [
    { icon: "icon-globe.png", t: "בחמשת הקרב המודרני, ענף אולימפי ותיק, מסלול מכשולים מחליף את הרכיבה על סוסים." },
    { icon: "icon-bolt", t: "זה מרוץ ראש בראש: שני מתחרים רצים, תולים ומטפסים על מסלול מהיר." },
    { icon: "icon-tv.png", t: "המסלול נבנה בהשראת התוכנית היפנית ״סאסקה״ (נינג'ה ווריור)." },
  ];
  rows.forEach((r, i) => {
    const y = 1.7 + i * 1.5, n = 4 + i;
    IMG(s, "card-row.png", 0.6, y, 6.6, 1.25, `A0${n}flyL-row${i}`);
    IMG(s, r.icon === "icon-bolt" ? "bolt.png" : r.icon, 0.85, y + 0.17, r.icon === "icon-bolt" ? 0.75 : 0.9, 0.9, `A0${n}flyL-ic${i}`);
    TXT(s, r.t, { x: 1.9, y: y + 0.1, w: 5.1, h: 1.05, fontSize: 18, objectName: `A0${n}flyL-t${i}` });
  });
  IMG(s, "hl-wide.png", 2.2, 6.15, 8.9, 0.95, "A07wipeR-hl");
  TXT(s, "ילדים כמו שרד יכולים לחלום על האולימפיאדה!", { x: 2.2, y: 6.15, w: 8.9, h: 0.95, fontSize: 30, bold: true, align: "center", objectName: "A08fade-dream" });
  s.addNotes("חשוב לדעת: נינג'ה לא נהיה ענף אולימפי בפני עצמו, אלא מסלול מכשולים בהשראת נינג'ה ווריור ייכנס לחמשת הקרב המודרני באולימפיאדת לוס אנג'לס 2028 (במקום רכיבה על סוסים).\n\nמקורות: UIPM (איגוד חמשת הקרב המודרני), דיווחי NBC Sports ו-Hypebeast, 2026.");
}

// =========== 4. שרד ===========
pres.addSection({ title: "שרד" });
{
  const s = pres.addSlide({ masterName: "NINJA_LIGHT", sectionTitle: "שרד" });
  s.addText("שרד והנינג'ה", { placeholder: "title", rtlMode: true, lang: "he-IL", objectName: "A01fade-title" });
  const w1 = 3.05, w2 = 3.2;
  IMG(s, "photo-hang.jpg", 0.65, 1.75, w1, photoH("p1", w1), "A02zoom-ph1", { rotate: -3 });
  IMG(s, "photo-rings.jpg", 3.6, 2.2, w2, photoH("p2", w2), "A03zoom-ph2", { rotate: 3 });
  IMG(s, "tape.png", 1.5, 1.55, 1.2, 0.38, "A02fade-tp1", { rotate: -8 });
  IMG(s, "tape.png", 4.6, 2.0, 1.2, 0.38, "A03fade-tp2", { rotate: 6 });
  const steps = [
    { h: "לפני שנה וחצי", b: "שרד התחילה חוג נינג'ה במתנ״ס פרדס חנה.", col: C.accent1, card: "card-step.png" },
    { h: "מאז", b: "מתאמנת, מתחזקת ולומדת מכשולים חדשים.", col: C.accent2, card: "card-step.png" },
    { h: "היום", b: "נתלית, תופסת טבעות ומשתפרת כל הזמן!", col: C.accent4, card: "card-step-y.png" },
  ];
  steps.forEach((st, i) => {
    const y = 1.65 + i * 1.85, n = 4 + i * 2;
    IMG(s, st.card, 7.2, y, 5.5, 1.5, `A0${n}flyR-card${i}`);
    TXT(s, [
      { text: st.h, options: { bold: true, fontSize: 26, color: st.col, breakLine: true } },
      { text: st.b, options: { fontSize: 19 } },
    ], { x: 7.45, y: y + 0.12, w: 5.0, h: 1.26, objectName: `A0${n}flyR-text${i}` });
    if (i < 2) IMG(s, "arr-down.png", 9.7, y + 1.5, 0.5, 0.35, `A0${n + 1}wipeD-ar${i}`);
  });
  s.addNotes("לפני שנה וחצי שרד התחילה חוג נינג'ה במתנ״ס פרדס חנה. מאז היא משתפרת כל הזמן. בתמונות אפשר לראות אותה תלויה על המוטות ותופסת טבעות.");
}

// =========== 5. סרטונים ===========
{
  const s = pres.addSlide({ masterName: "NINJA_LIGHT", sectionTitle: "שרד" });
  s.addText("שרד בפעולה", { placeholder: "title", rtlMode: true, lang: "he-IL", objectName: "A01fade-title" });
  const vw = 2.92, vh = 5.2;
  [3.3, 7.1].forEach((x, i) => {
    IMG(s, "card-vid.png", x - 0.24, 1.45, vw + 0.48, vh + 0.54, `A0${2 + i}zoom-vf${i}`);
    s.addMedia({ type: "video", path: AS(`video${i + 1}.mp4`), cover: "data:image/jpeg;base64," + fs.readFileSync(AS(`poster${i + 1}.jpg`)).toString("base64"), x, y: 1.72, w: vw, h: vh });
  });
  // right: what to look for
  const tips = [{ t: "אחיזה חזקה", c: "chip-red.png" }, { t: "תכנון הצעד הבא", c: "chip-blue.png" }, { t: "לא מוותרים!", c: "chip-yel.png" }];
  tips.forEach((tp, i) => {
    const y = 1.9 + i * 1.6, n = 4 + i;
    IMG(s, tp.c, 10.4, y, 2.35, 1.1, `A0${n}flyR-chip${i}`);
    TXT(s, tp.t, { x: 10.5, y: y + 0.1, w: 2.15, h: 0.9, fontSize: 22, bold: true, align: "center", objectName: `A0${n}flyR-chipt${i}` });
    IMG(s, "arr-left-s.png", 9.8, y + 0.28, 0.55, 0.55, `A0${n}wipeR-arr${i}`);
  });
  // left: tip bubble
  IMG(s, "fig-swing.png", 0.8, 1.75, 1.6, 1.92, "A08flyL-swing");
  IMG(s, "icon-bubble.png", 0.6, 4.2, 2.35, 1.6, "A09zoom-bubble");
  TXT(s, "לחצו על התמונה כדי לראות את הסרטון", { x: 0.78, y: 4.3, w: 2.0, h: 1.0, fontSize: 16, align: "center", objectName: "A09fade-bubt" });
  s.addNotes("שני סרטונים של שרד על מסלול הטבעות והמוטות. שימו לב: אוחזים חזק, מתכננים את הצעד הבא, ולא מוותרים!");
}

// =========== 6. נופלים וקמים ===========
{
  const s = pres.addSlide({ masterName: "NINJA_LIGHT", sectionTitle: "שרד" });
  s.addText("נופלים? קמים ומנסים שוב!", { placeholder: "title", rtlMode: true, lang: "he-IL", objectName: "A01fade-title" });
  const chips = [
    { t: "מנסים", c: "chip-blue.png", x: 10.1 }, { t: "נופלים", c: "chip-red.png", x: 6.95 },
    { t: "קמים", c: "chip-grn.png", x: 3.8 }, { t: "מנסים שוב!", c: "chip-yel.png", x: 0.65 },
  ];
  chips.forEach((c, i) => {
    const n = 2 + i * 2;
    IMG(s, c.c, c.x, 1.6, 2.6, 1.1, `A0${n}zoom-chip${i}`);
    TXT(s, c.t, { x: c.x + 0.1, y: 1.7, w: 2.4, h: 0.9, fontSize: 28, bold: true, align: "center", objectName: `A0${n}zoom-chipt${i}` });
    if (i < 3) IMG(s, "arr-left.png", c.x - 0.58, 1.85, 0.55, 0.5, `A0${n + 1}wipeR-ar${i}`);
  });
  const sk = [
    { t: "אומץ", d: "מעזים לעלות על מכשול חדש, גם כשזה קצת מפחיד.", i: "icon-heart.png", x: 8.8, col: C.accent1 },
    { t: "תכנון", d: "חושבים לפני: איפה אוחזים? מה הצעד הבא?", i: "icon-bulb.png", x: 4.7, col: C.accent2 },
    { t: "כוח", d: "ידיים, בטן ואחיזה חזקה - מתאמנים כדי להתחזק.", i: "icon-dumbbell.png", x: 0.6, col: C.accent4 },
  ];
  sk.forEach((k, i) => {
    const n = 10 + i * 2;
    IMG(s, "card-skill.png", k.x, 3.3, 3.9, 3.6, `A${n}flyB-card${i}`);
    IMG(s, k.i, k.x + 1.2, 3.45, 1.5, 1.5, `A${n}flyB-ic${i}`);
    TXT(s, k.t, { x: k.x + 0.2, y: 4.95, w: 3.5, h: 0.65, fontSize: 32, bold: true, color: k.col, align: "center", objectName: `A${n}flyB-t${i}` });
    TXT(s, k.d, { x: k.x + 0.3, y: 5.65, w: 3.3, h: 1.05, fontSize: 18, align: "center", valign: "top", objectName: `A${n}flyB-d${i}` });
  });
  s.addNotes("בנינג'ה לפעמים נופלים - וזה בסדר גמור! העיקר לקום ולנסות שוב. כדי להצליח צריך אומץ, תכנון וכוח.");
}

// =========== 7. מושגים א ===========
pres.addSection({ title: "מושגים" });
{
  const s = pres.addSlide({ masterName: "NINJA_LIGHT", sectionTitle: "מושגים" });
  s.addText("מילון נינג'ה - חלק א׳", { placeholder: "title", rtlMode: true, lang: "he-IL", objectName: "A01fade-title" });
  const terms = [
    { t: "טוס טו באר", en: "Toes to Bar", d: "תלויים במוט ומרימים את הרגליים עד שהבהונות נוגעות במוט.", fig: "fig-toes.png", x: 6.7, y: 1.65, col: C.accent1, card: "card-term.png" },
    { t: "מתח", en: "Pull-up", d: "תלויים במוט ומושכים את הגוף למעלה, עד שהסנטר מעל המוט.", fig: "fig-pullup.png", x: 0.6, y: 1.65, col: C.accent2, card: "card-term-b.png" },
    { t: "קיר", en: "Warped Wall", d: "קיר גבוה ומעוגל. רצים מהר ומטפסים עד הקצה העליון.", fig: "fig-wall.png", x: 6.7, y: 4.4, col: C.accent4, card: "card-term-b.png" },
    { t: "סווינג", en: "Swing", d: "מתנדנדים בין חבלים, טבעות או מוטות ועוברים את המכשול.", fig: "fig-swing.png", x: 0.6, y: 4.4, col: C.accent6, card: "card-term.png" },
  ];
  terms.forEach((k, i) => {
    const n = 2 + i * 2;
    IMG(s, k.card, k.x, k.y, 6.0, 2.6, `A0${n}flyB-card${i}`);
    IMG(s, k.fig, k.x + 0.25, k.y + 0.3, 1.55, 1.86, `A0${n}zoom-fig${i}`);
    TXT(s, [
      { text: k.t, options: { bold: true, fontSize: 32, color: k.col } },
      { text: "   " + k.en, options: { fontSize: 16, color: C.text2, italic: true, breakLine: true } },
      { text: k.d, options: { fontSize: 18 } },
    ], { x: 2.0, y: k.y + 0.2, w: 3.85, h: 2.2, valign: "middle", objectName: `A0${n + 1}fade-txt${i}`, ...{ x: k.x + 1.9 } });
  });
  s.addNotes("ארבעה מושגים חשובים: טוס טו באר, מתח, קיר וסווינג. אפשר לנסות אותם בבית הספר בחצר או בחוג!");
}

// =========== 8. מושגים ב + סיום ===========
{
  const s = pres.addSlide({ masterName: "NINJA_LIGHT", sectionTitle: "מושגים" });
  s.addText("מילון נינג'ה - ועוד מושגים", { placeholder: "title", rtlMode: true, lang: "he-IL", objectName: "A01fade-title" });
  const terms = [
    { t: "טבעות", d: "תופסים טבעות מתנדנדות ועוברים מאחת לשנייה.", i: "fig-rings.png", col: C.accent1, iw: 1.1, ih: 1.32 },
    { t: "חבל", d: "מטפסים על חבל ארוך בעזרת הידיים והרגליים.", i: "icon-rope.png", col: C.accent2, iw: 1.3, ih: 1.3 },
    { t: "סולם סלמון", d: "מזנקים עם מוט מעלה על שני פסים, כמו דג שעולה בנהר.", i: "icon-ladder.png", col: C.accent4, iw: 1.3, ih: 1.3 },
    { t: "באזר", d: "הכפתור האדום בסוף המסלול. לוחצים עליו וסיימתם!", i: "icon-buzzer.png", col: C.accent6, iw: 1.3, ih: 1.3 },
  ];
  terms.forEach((k, i) => {
    const x = 9.85 - i * 3.08, n = 2 + i * 2;
    IMG(s, "card-small.png", x, 1.65, 2.85, 3.6, `A0${n}flyB-card${i}`);
    IMG(s, k.i, x + (2.85 - k.iw) / 2, 1.85, k.iw, k.ih, `A0${n}zoom-ic${i}`);
    TXT(s, k.t, { x: x + 0.2, y: 3.25, w: 2.45, h: 0.55, fontSize: 26, bold: true, color: k.col, align: "center", objectName: `A0${n}flyB-t${i}` });
    TXT(s, k.d, { x: x + 0.25, y: 3.85, w: 2.35, h: 1.25, fontSize: 16, valign: "top", objectName: `A0${n}flyB-d${i}` });
  });
  IMG(s, "card-banner.png", 0.6, 5.6, 12.1, 1.35, "A10flyB-banner");
  TXT(s, "תודה שהקשבתם! מי רוצה לנסות נינג'ה?", { x: 2.6, y: 5.7, w: 9.8, h: 1.15, fontSize: 38, bold: true, color: C.background1, objectName: "A11fade-thanks" });
  IMG(s, "fig-hero-white.png", 0.95, 5.65, 1.1, 1.3, "A12zoom-hero");
  s.addNotes("עוד כמה מושגים: טבעות, חבל, סולם סלמון ובאזר. תודה שהקשבתם!");
}

(async () => {
  const file = path.join(__dirname, "ninja-raw.pptx");
  await pres.writeFile({ fileName: file });
  await applyTheme(file, THEME);
  console.log("written", file);
})();

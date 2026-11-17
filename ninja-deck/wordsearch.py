import random, base64, json, subprocess, os
random.seed(7)
N = 12
WORDS = ["נינגה", "סווינג", "טבעות", "סלמון", "תכנון", "באזר", "אומץ", "מתח", "קיר", "חבל", "כוח"]
DISPLAY = {"נינגה": "נינג'ה"}
FINALS = {"ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ"}
LETTERS = "אבגדהוזחטיכלמנסעפצקרשת"
DIRS = [(0, 1), (1, 0), (1, 1)]  # RTL across, down, diagonal down-left (col index grows to the left)

grid = [[None] * N for _ in range(N)]
placed = {}
def try_place(w):
    for _ in range(500):
        dr, dc = random.choice(DIRS)
        r = random.randrange(N); c = random.randrange(N)
        er, ec = r + dr * (len(w) - 1), c + dc * (len(w) - 1)
        if er >= N or ec >= N: continue
        cells = [(r + dr * i, c + dc * i) for i in range(len(w))]
        if all(grid[a][b] in (None, w[i]) for i, (a, b) in enumerate(cells)):
            for i, (a, b) in enumerate(cells): grid[a][b] = w[i]
            placed[w] = cells
            return True
    return False
for w in sorted(WORDS, key=len, reverse=True):
    assert try_place(w), w
for r in range(N):
    for c in range(N):
        if grid[r][c] is None: grid[r][c] = random.choice(LETTERS)
# letters inside grid: use regular (non-final) forms so finals don't give words away
G = [[FINALS.get(ch, ch) for ch in row] for row in grid]
sol = {cell for cells in placed.values() for cell in cells}

hero = base64.b64encode(open("assets/fig-hero.png", "rb").read()).decode()
def table(show):
    h = '<table dir="rtl">'
    for r in range(N):
        h += "<tr>"
        for c in range(N):
            cls = ' class="hit"' if show and (r, c) in sol else ""
            h += f"<td{cls}>{G[r][c]}</td>"
        h += "</tr>"
    return h + "</table>"
words_html = "".join(f'<li><span class="box"></span>{DISPLAY.get(w, w)}</li>' for w in WORDS)
html = f"""<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><style>
@page {{ size: A4; margin: 0 }}
* {{ box-sizing: border-box }}
body {{ margin:0; font-family: Calibri, 'Liberation Sans', Arial, sans-serif; color:#2F3B5C; }}
.page {{ width:210mm; height:297mm; padding:14mm 16mm; background:#F7F9FD; position:relative; page-break-after:always; overflow:hidden }}
.blob1 {{ position:absolute; width:90mm; height:90mm; border-radius:50%; background:#FBE3E6; left:-30mm; top:-30mm }}
.blob2 {{ position:absolute; width:70mm; height:70mm; border-radius:50%; background:#FFF1C9; right:-25mm; bottom:-25mm }}
.content {{ position:relative }}
h1 {{ font-size:40pt; margin:0 0 2mm; }}
.sub {{ font-size:15pt; color:#5B6B93; margin-bottom:5mm }}
.name {{ font-size:14pt; margin-bottom:6mm }}
.name span {{ display:inline-block; width:70mm; border-bottom:1.5px solid #5B6B93; margin-right:3mm }}
table {{ border-collapse:separate; border-spacing:0; margin:0 auto; background:#fff; border:2px solid #5B6B93; border-radius:4mm; overflow:hidden }}
td {{ width:13.2mm; height:13.2mm; text-align:center; font-size:21pt; font-weight:bold; border:1px solid #DCE4F2 }}
td.hit {{ background:#FFE6A8 }}
.words {{ margin-top:7mm; background:#fff; border:1.5px solid #DCE4F2; border-radius:4mm; padding:5mm 7mm }}
.words h2 {{ margin:0 0 3mm; font-size:17pt; color:#E4767E }}
ul {{ list-style:none; margin:0; padding:0; columns:4; font-size:17pt; font-weight:bold }}
li {{ margin-bottom:2.5mm; break-inside:avoid }}
.box {{ display:inline-block; width:5mm; height:5mm; border:1.5px solid #5B6B93; border-radius:1.2mm; margin-left:2.5mm; vertical-align:-0.5mm }}
.hero {{ position:absolute; left:0; top:2mm; width:24mm }}
.tip {{ margin-top:5mm; text-align:center; font-size:13pt; color:#5B6B93 }}
</style></head><body>
<div class="page"><div class="blob1"></div><div class="blob2"></div><div class="content">
<img class="hero" src="data:image/png;base64,{hero}">
<h1>תפזורת נינג'ה</h1>
<div class="sub">מצאו את המילים במשבצות: מימין לשמאל, מלמעלה למטה או באלכסון.</div>
<div class="name">שם: <span></span></div>
{table(False)}
<div class="words"><h2>המילים שמחפשים</h2><ul>{words_html}</ul></div>
<div class="tip">סמנו כל מילה שמצאתם ✓</div>
</div></div>
<div class="page"><div class="blob1"></div><div class="blob2"></div><div class="content">
<h1>פתרון</h1><div class="sub">דף למורה / להורה: המילים מסומנות בצהוב.</div>
{table(True)}
</div></div></body></html>"""
open("wordsearch.html", "w").write(html)

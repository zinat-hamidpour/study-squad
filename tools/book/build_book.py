#!/usr/bin/env python3
"""Build a week's book from its content JSON.

Usage:
  python3 tools/book/build_book.py content/weeks/week-01-crime.json books/
Outputs:
  books/week-01.html  (flip-book: swipe on phone, arrows on desktop; prints as A5)
  books/week-01.pdf   (only if google-chrome / chromium is installed)
"""
import html, json, re, shutil, subprocess, sys
from pathlib import Path

LEVEL_COLORS = {1: "#6CCB7E", 2: "#C9B6F2", 3: "#F6D772"}


def esc(s):
    return html.escape(str(s), quote=False)


def rich(s):
    """**word** -> <mark>, blank lines -> paragraphs."""
    out = []
    for para in str(s).split("\n\n"):
        p = esc(para)
        p = re.sub(r"\*\*(.+?)\*\*", r"<mark>\1</mark>", p)
        out.append(f"<p>{p}</p>")
    return "".join(out)


def chunks(seq, n):
    return [seq[i:i + n] for i in range(0, len(seq), n)]


def build(d):
    topic = d["topic"].upper()
    case = d.get("caseNo", d["id"].split("-")[-1])
    levels = {l["n"]: l for l in d["levels"]}
    pages = []  # (kind, level|None, inner_html)

    # Cover
    pages.append(("cover", None, f"""
      <div class="cover-top">CASE FILE #{case}</div>
      <div class="cover-title">{esc(topic)}</div>
      <div class="cover-sub">Speaking · {esc(d['start'])} → {esc(d['end'])}</div>
      <div class="cover-line">{esc(d.get('tagline',''))}</div>
      <div class="cover-levels">{''.join(f'<span style="background:{LEVEL_COLORS[n]}">{n} · {esc(l["name"])}<small>band {esc(l["band"])}</small></span>' for n,l in levels.items())}</div>
      <div class="cover-foot">STUDY SQUAD · LIBRARY</div>"""))

    # How to read
    lv = "".join(f"""<div class="howlv"><b style="background:{LEVEL_COLORS[n]}">{n}</b>
        <div><strong>{esc(l['name'])}</strong> · band {esc(l['band'])}<br><span>{esc(l['goal'])} Tested in the <em>{esc(l['test'].title())}</em> word test.</span></div></div>"""
                 for n, l in levels.items())
    pages.append(("plain", None, f"""<h2>How to read this case</h2>
      <p class="lead">Don’t try to learn everything. Find your level, master its words, and only then climb.</p>
      {lv}
      <h3>Every model answer comes in three bands</h3>
      <p>Read the band you are now, then the band above it. Notice exactly what changes: usually one collocation, one reason, one honest hedge. <mark>Highlighted</mark> words are this week’s vocabulary.</p>
      <h3>Try first, then read</h3>
      <p>Record your answer before you open the models. Trying to retrieve a word — even failing — makes it stick far better than reading it twice.</p>"""))

    # Crime map
    groups = "".join(f"<div class='mapg'><h4>{esc(g['group'])}</h4>{''.join(f'<span>{esc(i)}</span>' for i in g['items'])}</div>" for g in d["map"])
    pages.append(("plain", None, f"<h2>The map of crime</h2><p class='lead'>Six families. If you can place a word in its family, you can remember it.</p><div class='map'>{groups}</div>"))

    # Words by level
    for n, l in levels.items():
        ws = [w for w in d["words"] if w["level"] == n]
        parts = chunks(ws, 6)
        for i, part in enumerate(parts):
            items = ""
            for w in part:
                extra = ""
                if w.get("stress"):
                    extra += f"<span class='stress'>stress: {esc(w['stress'])}</span>"
                if w.get("note"):
                    extra += f"<span class='note'>{esc(w['note'])}</span>"
                items += f"""<div class="word"><div class="wh"><b>{esc(w['w'])}</b><i>{esc(w['pos'])}</i></div>
                  <div class="wd">{esc(w['def'])}</div><div class="we">“{esc(w['ex'])}”</div>{extra}</div>"""
            head = f"<div class='lvtag' style='background:{LEVEL_COLORS[n]}'>LEVEL {n} · BAND {esc(l['band'])}</div><h2>{esc(l['name'])}</h2>" if i == 0 else f"<div class='lvtag' style='background:{LEVEL_COLORS[n]}'>LEVEL {n} · continued</div>"
            pages.append(("words", n, head + items))

    # Glossary
    gl = "".join(f"<div class='gl'><b>{esc(g['w'])}</b><span>{esc(g['def'])}</span></div>" for g in d.get("glossary", []))
    pages.append(("plain", None, f"<h2>Recognise only</h2><p class='lead'>Courtroom and serious-crime words. Know them when you read or hear them — you rarely need them to speak.</p><div class='glist'>{gl}</div>"))

    # Mistakes
    ms = "".join(f"<div class='mis'><div class='wrong'>✗ {esc(m['wrong'])}</div><div class='right'>✓ {esc(m['right'])}</div><div class='why'>{esc(m['why'])}</div></div>" for m in d.get("mistakes", []))
    pages.append(("plain", None, f"<h2>Fingerprints</h2><p class='lead'>Small mistakes that give you away. Examiners notice them.</p>{ms}"))

    def models(m):
        return "".join(f"<div class='band b{b}'><span class='bl'>band {b}</span>{rich(t)}</div>" for b, t in m.items())

    # Part 1 — two questions per page
    p1 = d["part1"]
    for i, pair in enumerate(chunks(p1, 2)):
        body = "<div class='parttag'>PART 1 · 20–30 sec each</div>" + ("<h2>Quick questions</h2>" if i == 0 else "")
        for q in pair:
            tip = f"<div class='tip'><b>Tip</b> · {esc(q['tip'])}</div>" if q.get("tip") else ""
            body += f"<div class='q'><h3>{esc(q['q'])}</h3>{tip}{models(q['model'])}</div>"
        pages.append(("qa", None, body))

    # Part 2
    p2 = d["part2"]
    plan = "".join(f"<div class='step'><small>{i+1} · {esc(s)}</small><b>{esc(v)}</b></div>" for i, (s, v) in enumerate(zip(p2["steps"], p2.get("plan", [""] * 4))))
    phrases = "".join(f"<span>{esc(p)}</span>" for p in p2.get("phrases", []))
    pages.append(("qa", None, f"""<div class='parttag'>PART 2 · 1 min prep · 2 min talk</div><h2>The cue card</h2>
      <div class="cue"><b>{esc(p2['cue'])}</b><br>You should say:<ul>{''.join(f'<li>{esc(p)}</li>' for p in p2['points'])}</ul>{esc(p2['explain'])}</div>
      <h3>One minute, four keywords — no sentences</h3><div class="plan">{plan}</div>
      <h3>Phrases to steer with</h3><div class="chips">{phrases}</div>"""))
    for b, t in p2["model"].items():
        pages.append(("qa", None, f"<div class='parttag'>PART 2 · model</div><div class='band b{b} big'><span class='bl'>band {b}</span>{rich(t)}</div>"))

    # Part 3 tools + questions
    steps = "".join(f"<span><b>{i+1}</b> {esc(s)}</span>" for i, s in enumerate(d["structure"]["steps"]))
    ops = "".join(f"<span>{esc(o)}</span>" for o in d.get("openers", []))
    pages.append(("qa", None, f"""<div class='parttag'>PART 3 · 30–45 sec each</div><h2>The defence</h2>
      <h3>Build your answer</h3><div class="build">{steps}</div><p>{esc(d['structure']['note'])}</p>
      <h3>Openers — use a different one each time</h3><div class="chips">{ops}</div>"""))
    for q in d["part3"]:
        pages.append(("qa", None, f"<div class='parttag'>PART 3</div><div class='q'><h3>{esc(q['q'])}</h3>{models(q['model'])}</div>"))

    # Back
    pages.append(("back", None, f"""<div class="stamp">CASE CLOSED</div>
      <p class="closed">Closed by</p><div class="sig">__________________</div>
      <p class="closed small">Three parts recorded · three word tests passed.<br>This book now lives on the squad shelf.</p>"""))
    return pages


CSS = """
@font-face{font-family:Mono;src:local('DejaVu Sans Mono Bold'),local('Menlo-Bold'),local('Consolas Bold');font-weight:700}
:root{--paper:#FBF3E8;--ink:#2E2622;--muted:#7A6A60;--red:#B8322C;--line:#2B2220}
*{box-sizing:border-box}
html,body{margin:0;background:#E9DCC8;color:var(--ink);font-family:Nunito,Inter,-apple-system,'Segoe UI',sans-serif}
.mono,h2,.parttag,.lvtag,.cover-top,.cover-title,.cover-foot,.stamp,.bl{font-family:'Pixelify Sans','DejaVu Sans Mono',Menlo,Consolas,monospace;letter-spacing:.06em}
.book{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:24px;padding:24px calc(50vw - min(46vw,260px));height:100vh;align-items:center;scrollbar-width:none}
.book::-webkit-scrollbar{display:none}
.page{flex:0 0 min(92vw,520px);aspect-ratio:148/210;max-height:92vh;scroll-snap-align:center;background:var(--paper);border:2.5px solid var(--line);border-radius:6px 14px 14px 6px;box-shadow:0 6px 0 var(--line), inset 10px 0 18px -14px rgba(0,0,0,.35);padding:7% 8% 9%;position:relative;overflow-x:hidden;overflow-y:auto;font-size:clamp(12px,3.2vw,14.5px);line-height:1.45}
.page .hdr{position:absolute;top:2.6%;left:8%;right:8%;display:flex;justify-content:space-between;font:700 .68em 'DejaVu Sans Mono',monospace;letter-spacing:.12em;color:var(--muted)}
.page .pno{position:absolute;bottom:3%;right:8%;font:700 .7em 'DejaVu Sans Mono',monospace;color:var(--muted)}
.page .edge{position:absolute;right:0;top:0;bottom:0;width:6px}
h2{font-size:1.55em;margin:.5em 0 .35em}
h3{font-size:1.02em;margin:1em 0 .35em}
p{margin:.35em 0}
.lead{color:var(--muted)}
mark{background:linear-gradient(transparent 55%,#F6D772 55%);color:inherit;font-weight:600;padding:0 1px}
.cover{background:#7A1F1B;color:#F6E7C9;display:flex;flex-direction:column;justify-content:space-between}
.cover-top{font-size:.85em;opacity:.8}
.cover-title{font-size:3.6em;font-weight:700;letter-spacing:.12em;border-top:3px solid #F6E7C9;border-bottom:3px solid #F6E7C9;padding:.15em 0;margin-top:30%}
.cover-sub{font-size:.9em;opacity:.85;margin-top:.6em}
.cover-line{font-style:italic;opacity:.9;margin-top:1.5em;font-size:1.05em;line-height:1.4}
.cover-levels{display:flex;flex-direction:column;gap:6px;margin-top:auto;margin-bottom:1.2em}
.cover-levels span{color:var(--ink);border:2px solid var(--ink);border-radius:8px;padding:5px 9px;font-weight:700;display:flex;justify-content:space-between}
.cover-levels small{font-weight:500}
.cover-foot{font-size:.7em;opacity:.7}
.howlv{display:flex;gap:10px;align-items:flex-start;margin:.55em 0}
.howlv b{flex:0 0 28px;height:28px;border:2px solid var(--ink);border-radius:8px;display:grid;place-items:center}
.howlv span{color:var(--muted);font-size:.93em}
.map{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:.6em}
.mapg{border:2px solid var(--ink);border-radius:10px;padding:7px 9px;background:#fff}
.mapg h4{margin:0 0 4px;font-size:.92em}
.mapg span{display:inline-block;font-size:.8em;border:1px solid #CDBFAE;border-radius:20px;padding:1px 7px;margin:2px 2px 0 0}
.lvtag,.parttag{display:inline-block;font-size:.66em;font-weight:700;border:2px solid var(--ink);border-radius:20px;padding:2px 9px;background:#fff}
.word{border-bottom:1.5px dashed #CDBFAE;padding:.42em 0}
.wh{display:flex;justify-content:space-between;gap:6px}
.wh b{font-size:1.05em}
.wh i{color:var(--muted);font-size:.8em;white-space:nowrap}
.wd{font-size:.93em}
.we{font-size:.88em;color:var(--muted);font-style:italic}
.stress,.note{display:inline-block;font-size:.76em;border-radius:6px;padding:0 6px;margin:3px 4px 0 0;background:#EFE5D6}
.note{background:#FCE3E1;color:#7A1F1B}
.glist{columns:2;column-gap:14px}.gl{break-inside:avoid}
.gl{padding:.3em 0;border-bottom:1px dashed #CDBFAE;font-size:.9em}
.gl b{display:block}
.gl span{color:var(--muted)}
.mis{border:2px solid var(--ink);border-radius:10px;padding:6px 9px;margin:.45em 0;background:#fff;font-size:.92em}
.wrong{color:#B8322C;text-decoration:line-through;text-decoration-thickness:1px}
.right{font-weight:700}
.why{color:var(--muted);font-size:.9em}
.q h3{font-size:1.05em;margin-top:.8em}
.tip{background:#EDE4FB;border-radius:8px;padding:4px 8px;font-size:.88em;margin-bottom:4px}
.band{position:relative;border-left:4px solid;padding:.15em 0 .15em .7em;margin:.45em 0;font-size:.93em}
.band.b6{border-color:#6CCB7E}.band.b7{border-color:#CBB8F2}.band.b8{border-color:#E8B93A}
.band .bl{display:inline-block;font-size:.66em;font-weight:700;text-transform:uppercase;color:var(--muted)}
.band.big{font-size:.98em;border-left-width:5px}
.cue{border:2.5px solid var(--ink);border-radius:10px;padding:10px 12px;background:#fff;box-shadow:0 4px 0 var(--ink)}
.cue ul{margin:.3em 0 .3em 1.2em;padding:0}
.plan{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.step{border:2px solid var(--ink);border-radius:8px;padding:5px 8px;background:#fff}
.step small{display:block;font-size:.7em;color:var(--muted);text-transform:uppercase}
.chips span,.build span{display:inline-block;border:2px solid var(--ink);border-radius:20px;padding:2px 9px;margin:3px 3px 0 0;font-size:.85em;background:#fff}
.build b{display:inline-grid;place-items:center;width:1.3em;height:1.3em;border-radius:50%;background:var(--ink);color:#fff;font-size:.8em;margin-right:3px}
.back{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.stamp{font-size:2.3em;font-weight:700;color:var(--red);border:5px solid var(--red);border-radius:12px;padding:.2em .5em;transform:rotate(-8deg);opacity:.85}
.closed{margin-top:2.2em;font-weight:700}
.closed.small{font-weight:400;color:var(--muted);margin-top:1.4em}
.sig{font-family:'DejaVu Sans Mono',monospace;font-size:1.3em}
.nav{position:fixed;bottom:14px;left:50%;transform:translateX(-50%);display:flex;gap:10px;align-items:center;font:700 13px 'DejaVu Sans Mono',monospace}
.nav button{border:2.5px solid var(--ink);background:#C9B6F2;border-radius:10px;padding:6px 14px;font:inherit;box-shadow:0 3px 0 var(--ink);cursor:pointer}
@media print{
  @page{size:A5;margin:0}
  html,body{background:none}
  .book{display:block;padding:0;height:auto;overflow:visible}
  .page{width:148mm;height:210mm;max-height:none;aspect-ratio:auto;overflow:hidden;border:none;border-radius:0;box-shadow:none;page-break-after:always;font-size:10.8pt}
  .nav{display:none}
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
"""

JS = """
const b=document.querySelector('.book'),pages=[...document.querySelectorAll('.page')],c=document.getElementById('cnt');
function cur(){const x=b.scrollLeft+b.clientWidth/2;let i=0;pages.forEach((p,k)=>{if(p.offsetLeft<x)i=k});return i}
function go(d){const i=Math.max(0,Math.min(pages.length-1,cur()+d));pages[i].scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'})}
b.addEventListener('scroll',()=>{c.textContent=(cur()+1)+' / '+pages.length},{passive:true});
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight')go(1);if(e.key==='ArrowLeft')go(-1)});
c.textContent='1 / '+pages.length;
"""


def render(d):
    pages = build(d)
    topic = d["topic"].upper()
    case = d.get("caseNo", "")
    out = []
    for i, (kind, lvl, inner) in enumerate(pages, 1):
        hdr = "" if kind in ("cover",) else f"<div class='hdr'><span>CASE FILE #{case} · {esc(topic)}</span><span>STUDY SQUAD</span></div>"
        pno = "" if kind == "cover" else f"<div class='pno'>{i}</div>"
        edge = f"<div class='edge' style='background:{LEVEL_COLORS[lvl]}'></div>" if lvl else ""
        out.append(f"<section class='page {kind}'>{hdr}{edge}{inner}{pno}</section>")
    return f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(d['topic'])} · Case File #{case}</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&family=Pixelify+Sans:wght@500;700&display=swap" rel="stylesheet"><style>{CSS}</style></head>
<body><main class="book">{''.join(out)}</main>
<div class="nav"><button onclick="go(-1)">‹</button><span id="cnt"></span><button onclick="go(1)">›</button></div>
<script>{JS}</script></body></html>"""


def main():
    src, outdir = Path(sys.argv[1]), Path(sys.argv[2])
    d = json.loads(src.read_text(encoding="utf-8"))
    outdir.mkdir(parents=True, exist_ok=True)
    html_path = outdir / f"{d['id']}.html"
    html_path.write_text(render(d), encoding="utf-8")
    print("wrote", html_path)
    chrome = shutil.which("google-chrome") or shutil.which("chromium") or shutil.which("chromium-browser")
    if chrome:
        pdf = outdir / f"{d['id']}.pdf"
        subprocess.run([chrome, "--headless", "--disable-gpu", "--no-sandbox", "--no-pdf-header-footer",
                        f"--print-to-pdf={pdf.resolve()}", html_path.resolve().as_uri()],
                       check=True, capture_output=True)
        print("wrote", pdf)
    else:
        print("no chrome found: open the .html and print to PDF (A5, no margins)")


if __name__ == "__main__":
    main()

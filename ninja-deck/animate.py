"""Add entrance animations to a pptx. Shapes named  A<order><effect>-<label>  are animated.
Same order number => start together; groups play one after another automatically on slide start."""
import re, sys, zipfile, shutil, os
from lxml import etree

NS = {"p": "http://schemas.openxmlformats.org/presentationml/2006/main",
      "a": "http://schemas.openxmlformats.org/drawingml/2006/main"}
P = "{%s}" % NS["p"]
DUR = 550
STEP_GAP = 150


class Ids:
    def __init__(self): self.n = 2
    def next(self):
        self.n += 1
        return self.n


def effect_xml(ids, spid, eff, first_node):
    """returns the <p:par> for one effect"""
    node = first_node
    tgt = f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl>'
    def setvis():
        return (f'<p:set><p:cBhvr><p:cTn id="{ids.next()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>{tgt}'
                f'<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>')
    def fade():
        return f'<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="{ids.next()}" dur="{DUR}"/>{tgt}</p:cBhvr></p:animEffect>'
    def anim(attr, frm, to):
        return (f'<p:anim calcmode="lin" valueType="num"><p:cBhvr additive="base"><p:cTn id="{ids.next()}" dur="{DUR}" fill="hold"/>{tgt}'
                f'<p:attrNameLst><p:attrName>{attr}</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst><p:tav tm="0"><p:val>{frm}</p:val></p:tav>'
                f'<p:tav tm="100000"><p:val>{to}</p:val></p:tav></p:tavLst></p:anim>')
    S = lambda v: f'<p:strVal val="{v}"/>'
    if eff == "fade":
        pid, sub, body = 10, 0, setvis() + fade()
    elif eff.startswith("wipe"):
        d = {"L": ("left", 8), "R": ("right", 2), "U": ("up", 1), "D": ("down", 4)}[eff[4]]
        pid, sub = 22, d[1]
        body = setvis() + f'<p:animEffect transition="in" filter="wipe({d[0]})"><p:cBhvr><p:cTn id="{ids.next()}" dur="{DUR}"/>{tgt}</p:cBhvr></p:animEffect>'
    elif eff.startswith("fly"):
        d = eff[3]
        pid = 2
        if d == "B": sub, body = 4, setvis() + anim("ppt_y", S("1+#ppt_h/2"), S("#ppt_y")) + anim("ppt_x", S("#ppt_x"), S("#ppt_x"))
        elif d == "R": sub, body = 2, setvis() + anim("ppt_x", S("1+#ppt_w/2"), S("#ppt_x")) + anim("ppt_y", S("#ppt_y"), S("#ppt_y"))
        elif d == "L": sub, body = 8, setvis() + anim("ppt_x", S("0-#ppt_w/2"), S("#ppt_x")) + anim("ppt_y", S("#ppt_y"), S("#ppt_y"))
        else: sub, body = 1, setvis() + anim("ppt_y", S("0-#ppt_h/2"), S("#ppt_y")) + anim("ppt_x", S("#ppt_x"), S("#ppt_x"))
    elif eff == "zoom":
        pid, sub = 53, 16
        body = setvis() + anim("ppt_w", '<p:fltVal val="0"/>', S("#ppt_w")) + anim("ppt_h", '<p:fltVal val="0"/>', S("#ppt_h")) + fade()
    else:
        raise ValueError(eff)
    return (f'<p:par><p:cTn id="{ids.next()}" presetID="{pid}" presetClass="entr" presetSubtype="{sub}" fill="hold" nodeType="{node}">'
            f'<p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>{body}</p:childTnLst></p:cTn></p:par>')


def timing_for(slide_xml):
    root = etree.fromstring(slide_xml)
    items = []
    for el in root.iter(P + "cNvPr"):
        m = re.match(r"A(\d+)(fade|wipe[LRUD]|fly[BLRT]|zoom)-", el.get("name", ""))
        if m:
            items.append((int(m.group(1)), m.group(2), el.get("id")))
    if not items:
        return None
    items.sort(key=lambda t: t[0])
    ids = Ids()
    groups = []
    for order, eff, spid in items:
        if groups and groups[-1][0] == order: groups[-1][1].append((eff, spid))
        else: groups.append((order, [(eff, spid)]))
    inner = ""
    delay = 0
    for gi, (order, members) in enumerate(groups):
        effs = ""
        for mi, (eff, spid) in enumerate(members):
            node = "afterEffect" if mi == 0 else "withEffect"
            effs += effect_xml(ids, spid, eff, node)
        inner += (f'<p:par><p:cTn id="{ids.next()}" fill="hold"><p:stCondLst><p:cond delay="{delay}"/></p:stCondLst>'
                  f'<p:childTnLst>{effs}</p:childTnLst></p:cTn></p:par>')
        delay += DUR + STEP_GAP
    outer_id = ids.next()
    xml = (f'<p:timing xmlns:p="{NS["p"]}"><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>'
           f'<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>'
           f'<p:par><p:cTn id="{outer_id}" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst>'
           f'<p:childTnLst>{inner}</p:childTnLst></p:cTn></p:par>'
           f'</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
           f'<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>'
           f'</p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>')
    return xml


def main(src, dst):
    zin = zipfile.ZipFile(src)
    zout = zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED)
    for item in zin.infolist():
        if item.filename.endswith("/"): continue
        data = zin.read(item.filename)
        if re.match(r"ppt/slides/slide\d+\.xml$", item.filename):
            t = timing_for(data)
            if t:
                s = data.decode("utf8")
                # insert after clrMapOvr (and transition if any), before extLst
                m = re.search(r"</p:clrMapOvr>|<p:clrMapOvr\s*/>", s)
                pos = m.end()
                tm = re.compile(r"<p:transition.*?(?:</p:transition>|/>)", re.S).match(s, pos)
                if tm: pos = tm.end()
                t = t.replace(f' xmlns:p="{NS["p"]}"', "", 1)
                s = s[:pos] + t + s[pos:]
                data = s.encode("utf8")
        zout.writestr(item, data)
    zout.close()


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])

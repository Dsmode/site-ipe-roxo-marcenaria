import re, glob, os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
for f in sorted(glob.glob("*.html")):
    s = open(f, encoding="utf8").read()
    L = s.split("\n")
    def linha(pos): return s.count("\n", 0, pos) + 1
    out = []
    for m in re.finditer(r"<img [^>]*>", s):
        t = m.group(0)
        if "width=" not in t or "height=" not in t:
            out.append("%s:%d - img sem width/height" % (f, linha(m.start())))
        if "alt=" not in t:
            out.append("%s:%d - img sem alt" % (f, linha(m.start())))
    for m in re.finditer(r'<a [^>]*target="_blank"[^>]*>', s):
        if "noopener" not in m.group(0):
            out.append("%s:%d - target=_blank sem rel=noopener" % (f, linha(m.start())))
    for m in re.finditer(r"<button[^>]*>(.*?)</button>", s, re.S):
        tag = s[m.start():s.index(">", m.start()) + 1]
        txt = re.sub(r"<[^>]+>", "", m.group(1)).strip()
        if not txt and "aria-label" not in tag and "<img" not in m.group(1):
            out.append("%s:%d - botão sem nome" % (f, linha(m.start())))
    ids = re.findall(r'\bid="([^"]+)"', s)
    dup = {i for i in ids if ids.count(i) > 1}
    if dup:
        out.append("%s - ids duplicados: %s" % (f, ", ".join(sorted(dup))))
    for m in re.finditer(r"<(input|select|textarea)\b[^>]*>", s):
        tag = m.group(0)
        mi = re.search(r'\bid="([^"]+)"', tag)
        if mi and ('for="%s"' % mi.group(1)) not in s:
            out.append("%s:%d - campo %s sem label for" % (f, linha(m.start()), mi.group(1)))
    hs = [(int(m.group(1)), linha(m.start())) for m in re.finditer(r"<h([1-6])\b", s)]
    ant = 0
    for n, ln in hs:
        if ant and n > ant + 1:
            out.append("%s:%d - salto de título h%d -> h%d" % (f, ln, ant, n))
        ant = n
    if len(re.findall(r"<h1\b", s)) != 1:
        out.append("%s - número de h1: %d" % (f, len(re.findall(r"<h1\b", s))))
    t = re.search(r"<title>(.*?)</title>", s)
    if t and len(t.group(1)) > 70:
        out.append("%s - título longo (%d)" % (f, len(t.group(1))))
    if 'translate="no"' not in s:
        out.append("%s - marca sem translate=no (sugestão)" % f)
    print(f, "OK" if not out else "")
    for o in out: print("   ", o)

import re, os, glob
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
paginas = sorted(glob.glob("*.html"))
ids = {p: set(re.findall(r'\bid="([^"]+)"', open(p, encoding="utf8").read())) for p in paginas}
problemas = []
total = 0
for p in paginas:
    s = open(p, encoding="utf8").read()
    for attr, val in re.findall(r'\b(href|src|data-full)="([^"]*)"', s):
        if val.startswith(("http", "mailto:", "tel:", "data:")) or val == "":
            continue
        total += 1
        arq, _, ancora = val.partition("#")
        arq = arq.lstrip("/") if arq.startswith("/") else arq
        arq = arq or p
        if not os.path.exists(arq):
            problemas.append((p, val, "arquivo não existe"))
        elif ancora and arq.endswith(".html") and ancora not in ids.get(arq, set()):
            problemas.append((p, val, "âncora não existe"))
print("páginas:", paginas)
print("referências locais checadas:", total)
print("problemas:", problemas)

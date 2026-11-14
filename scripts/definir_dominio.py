"""Troca o endereço de exemplo pelo endereço real do site, em todas as páginas.

Uso (dentro da pasta do site), com o endereço sem barra no final:
    python scripts/definir_dominio.py https://meusite.netlify.app
    python scripts/definir_dominio.py https://www.meudominio.com.br

Altera: canonical, og:url, og:image e twitter:image das páginas, sitemap.xml e robots.txt.
Depois, gere a pasta de publicação de novo.
"""
import glob
import os
import sys

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
EXEMPLO = "https://SEU-SITE.netlify.app"

if len(sys.argv) != 2 or not sys.argv[1].startswith("https://"):
    sys.exit("Uso: python scripts/definir_dominio.py https://seu-endereco")
novo = sys.argv[1].rstrip("/")

alvos = glob.glob(os.path.join(RAIZ, "*.html")) + [os.path.join(RAIZ, n) for n in ("sitemap.xml", "robots.txt")]
total = 0
for caminho in alvos:
    with open(caminho, "r", encoding="utf-8", newline="") as f:
        s = f.read()
    n = s.count(EXEMPLO) + s.count("SEU-SITE.netlify.app")
    if not n:
        continue
    s = s.replace(EXEMPLO, novo).replace("SEU-SITE.netlify.app", novo.split("://", 1)[1])
    with open(caminho, "w", encoding="utf-8", newline="") as f:
        f.write(s)
    total += n
    print("%s: %d troca(s)" % (os.path.basename(caminho), n))
print("Total: %d. Se o endereço mudar de novo, o exemplo já não existe: edite à mão ou use git checkout." % total)

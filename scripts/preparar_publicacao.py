"""Monta a pasta _publicar/ só com o que vai para o ar (Netlify Drop, Hostinger, HostGator).

Uso (dentro da pasta do site):
    python scripts/preparar_publicacao.py

Fica de fora: referências visuais, documentação, scripts, logo original em JPG, SVGs de apoio e arquivos .md.
"""
import os
import shutil

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DEST = os.path.join(RAIZ, "_publicar")

if os.path.exists(DEST):
    shutil.rmtree(DEST)
os.makedirs(DEST)

copiados = []


def copiar(rel):
    origem = os.path.join(RAIZ, rel)
    destino = os.path.join(DEST, rel)
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    shutil.copy2(origem, destino)
    copiados.append(rel)


for nome in sorted(os.listdir(RAIZ)):
    if nome.endswith(".html") or nome in ("robots.txt", "sitemap.xml", "share.jpg", "_headers"):
        copiar(nome)

for pasta, extensoes in (("assets/css", (".css",)), ("assets/js", (".js",)), ("assets/img", (".jpg",)), ("assets/logo", (".png",))):
    for nome in sorted(os.listdir(os.path.join(RAIZ, pasta))):
        if nome.lower().endswith(extensoes):
            copiar(pasta + "/" + nome)

total = sum(os.path.getsize(os.path.join(DEST, c)) for c in copiados)
print("Pasta pronta em:", DEST)
print("Arquivos: %d, tamanho total: %.1f MB" % (len(copiados), total / 1e6))

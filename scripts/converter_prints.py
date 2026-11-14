"""Converte os prints de scripts/_prints para docs/screenshots (JPG leve) e monta as imagens de celular e do esqueleto de carregamento."""
import os
from PIL import Image

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ORIG = os.path.join(RAIZ, "scripts", "_prints")
DEST = os.path.join(RAIZ, "docs", "screenshots")
os.makedirs(DEST, exist_ok=True)

for nome in ["index", "servicos", "galeria", "sobre", "contato"]:
    im = Image.open(os.path.join(ORIG, nome + "-desktop.png")).convert("RGB")
    w = 1200
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    saida = os.path.join(DEST, ("home" if nome == "index" else nome) + "-desktop.jpg")
    im.save(saida, "JPEG", quality=84, optimize=True, progressive=True)
    print(os.path.basename(saida), im.size, os.path.getsize(saida) // 1024, "KB")


def colagem(sufixo, saida_nome):
    telas = [Image.open(os.path.join(ORIG, n + sufixo + ".png")).convert("RGB") for n in ["index", "servicos", "galeria", "contato"]]
    gap, margem = 48, 48
    largura = sum(t.width for t in telas) + gap * (len(telas) - 1) + 2 * margem
    altura = max(t.height for t in telas) + 2 * margem
    fundo = Image.new("RGB", (largura, altura), (237, 227, 210))
    x = margem
    for t in telas:
        fundo.paste(t, (x, margem))
        x += t.width + gap
    fundo = fundo.resize((1600, round(altura * 1600 / largura)), Image.LANCZOS)
    saida = os.path.join(DEST, saida_nome)
    fundo.save(saida, "JPEG", quality=84, optimize=True, progressive=True)
    print(saida_nome, fundo.size, os.path.getsize(saida) // 1024, "KB")


colagem("-mobile", "celular.jpg")
colagem("-esqueleto", "esqueleto.jpg")

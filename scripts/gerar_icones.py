"""Gera o conjunto de favicons a partir de assets/logo/logo-marca.png.

Uso (dentro da pasta do site):
    python scripts/gerar_icones.py

Saída: favicon.ico (16, 32, 48 px), assets/logo/favicon-16.png, favicon-32.png,
icon-192.png e icon-512.png (fundo creme, com margem, para instalar o site no celular).
"""
import os
from PIL import Image

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
LOGO = os.path.join(RAIZ, "assets", "logo")
CREME = (246, 240, 230, 255)

marca = Image.open(os.path.join(LOGO, "logo-marca.png")).convert("RGBA")


def quadrado(tamanho, margem=0.0, fundo=None):
    """Marca centralizada num quadrado; margem é a fração de cada lado."""
    tela = Image.new("RGBA", (tamanho, tamanho), fundo or (0, 0, 0, 0))
    area = int(tamanho * (1 - 2 * margem))
    m = marca.copy()
    m.thumbnail((area, area), Image.LANCZOS)
    tela.alpha_composite(m, ((tamanho - m.width) // 2, (tamanho - m.height) // 2))
    return tela


for t in (16, 32):
    quadrado(t, 0.04).save(os.path.join(LOGO, "favicon-%d.png" % t))

quadrado(256, 0.04).save(
    os.path.join(RAIZ, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)]
)

for t in (192, 512):
    quadrado(t, 0.16, CREME).convert("RGB").save(os.path.join(LOGO, "icon-%d.png" % t), optimize=True)

print("Favicons gerados.")

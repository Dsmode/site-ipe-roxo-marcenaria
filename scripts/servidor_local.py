r"""Servidor local que imita a hospedagem: endereços que não existem mostram o 404.html.

Uso (dentro da pasta do site):
    cd E:\Sistemas\SiteDev\clientes\ipe-roxo-marcenaria
    python scripts/servidor_local.py              # só neste computador, porta 8080
    python scripts/servidor_local.py --celular    # também aparece para o celular na mesma rede Wi-Fi
"""
import os
import socket
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
os.chdir(RAIZ)
PORTA = 8080


class Handler(SimpleHTTPRequestHandler):
    def send_error(self, code, message=None, explain=None):
        if code == 404 and os.path.exists("404.html"):
            corpo = open("404.html", "rb").read()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(corpo)))
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(corpo)
            return
        super().send_error(code, message, explain)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


celular = "--celular" in sys.argv
host = "0.0.0.0" if celular else "127.0.0.1"
print("Site em http://127.0.0.1:%d/index.html" % PORTA)
print("Teste da página 404: http://127.0.0.1:%d/pagina-que-nao-existe" % PORTA)
if celular:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        print("No celular (mesmo Wi-Fi): http://%s:%d/index.html" % (s.getsockname()[0], PORTA))
        s.close()
    except OSError:
        print("Não consegui descobrir o IP; use `ipconfig` e procure o endereço IPv4.")
print("Para parar: Ctrl+C")
class Servidor(ThreadingHTTPServer):
    request_queue_size = 128  # a fila padrão (5) recusa conexões quando a página pede 14 fotos de uma vez


Servidor((host, PORTA), Handler).serve_forever()

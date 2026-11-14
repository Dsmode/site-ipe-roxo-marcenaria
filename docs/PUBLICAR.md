# Como publicar o site (Netlify Drop)

Publicação provisória, para mostrar o projeto. A hospedagem final (Hostinger ou HostGator) segue o mesmo princípio: enviar o conteúdo da pasta `_publicar`.

## 1. Gerar a pasta de publicação
Dentro da pasta do site:

```bash
python scripts/preparar_publicacao.py
```

Cria `_publicar/` só com o que vai para o ar (páginas, CSS, JS, fotos, logo, `robots.txt`, `sitemap.xml`, `_headers`). Não vão referências, documentação nem scripts. A pasta é ignorada pelo Git. Refazer sempre que o site mudar.

## 2. Publicar no Netlify (sua conta)
1. Entre em https://app.netlify.com/drop (crie a conta gratuita se ainda não tiver, pode ser com o Google).
2. Arraste a pasta `_publicar` para a área indicada na página.
3. O Netlify gera um endereço do tipo `https://nome-aleatorio.netlify.app`. Em "Site configuration > Change site name" dá para trocar o nome.

## 3. Depois de ter o endereço, trocar estes pontos
- `sitemap.xml` e `robots.txt`: trocar `SEU-SITE.netlify.app` pelo endereço real.
- Cada página `.html`: o `<meta property="og:image" content="share.jpg">` precisa do endereço completo (`https://seu-site.netlify.app/share.jpg`) para aparecer no preview do WhatsApp/Instagram.
- Opcional: adicionar `<link rel="canonical" href="https://seu-site.netlify.app/...">` em cada página.
- Gerar a pasta de novo e arrastar outra vez (o Netlify Drop atualiza o mesmo site se você arrastar na página "Deploys" do site).

## Atenção: projeto fictício
O site usa telefone, e-mail e endereço de exemplo e os dados estruturados (LocalBusiness) da Home descrevem uma empresa que não existe. Para o portfólio, considere:
- manter a nota "Projeto fictício de portfólio" no rodapé (já está);
- impedir a indexação no Google enquanto for demonstração, adicionando `<meta name="robots" content="noindex">` nas páginas e trocando `Allow: /` por `Disallow: /` no `robots.txt`.

## Não funciona no Netlify Drop
O formulário de contato abre o WhatsApp (não depende do Netlify). Não há back-end. O mapa do Google usa o embed por endereço (sem chave).

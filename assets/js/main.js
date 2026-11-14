/* Ipê Roxo Marcenaria — comportamento comum a todas as páginas */
(function () {
  'use strict';

  // Número do WhatsApp (DDI + DDD + número, só dígitos). Trocar aqui quando houver o real.
  var WHATSAPP = '5549900000000';

  function waLink(texto) {
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
  }

  /* Links diretos para o WhatsApp: <a data-wa="mensagem"> */
  document.querySelectorAll('[data-wa]').forEach(function (a) {
    var msg = a.getAttribute('data-wa') || 'Olá! Gostaria de pedir um orçamento.';
    a.href = waLink(msg);
    a.target = '_blank';
    a.rel = 'noopener';
  });

  /* Foto que ainda não existe: mostra o espaço reservado em vez de imagem quebrada */
  document.querySelectorAll('.ph img').forEach(function (img) {
    function vazio() { img.parentElement.classList.add('is-empty'); img.remove(); }
    if (img.complete && img.naturalWidth === 0) vazio();
    else img.addEventListener('error', vazio, { once: true });
  });

  /* Menu no celular */
  var toggle = document.querySelector('.nav__toggle');
  var links = document.querySelector('.nav__links');
  if (toggle && links) {
    function fechar() { links.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Abrir menu'); }
    toggle.addEventListener('click', function () {
      var aberto = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      toggle.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) fechar(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechar(); });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', fechar);
  }

  /* Item do menu acompanha a rolagem (e o clique) */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a:not(.btn)'));
  var spy = navLinks.map(function (a) {
    var h = a.getAttribute('href') || '';
    return { link: a, target: h.charAt(0) === '#' && h !== '#conteudo' ? document.querySelector(h) : null };
  });
  if (spy.length && document.body.getAttribute('data-page') === 'home') {
    var travado = false, travaTimer = null, ticking = false;
    function marcar(link) {
      navLinks.forEach(function (a) {
        if (a === link) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    }
    function atualizar() {
      ticking = false;
      if (travado) return;
      var nav = document.querySelector('.nav');
      var linha = (nav ? nav.offsetHeight : 0) + window.innerHeight * 0.3;
      var ativo = spy[0].link; // Início
      var melhor = -Infinity;
      spy.forEach(function (s) { // vale a seção mais próxima acima da linha, na ordem da página
        if (!s.target) return;
        var topo = s.target.getBoundingClientRect().top;
        if (topo <= linha && topo > melhor) { melhor = topo; ativo = s.link; }
      });
      var fim = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (fim) ativo = spy[spy.length - 1].link;
      marcar(ativo);
    }
    function pedir() { if (!ticking) { ticking = true; setTimeout(atualizar, 40); } }
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir);
    navLinks.forEach(function (a) {
      a.addEventListener('click', function () {
        marcar(a);
        travado = true; // evita piscar os itens do meio durante a rolagem suave
        clearTimeout(travaTimer);
        travaTimer = setTimeout(function () { travado = false; atualizar(); }, 900);
      });
    });
    atualizar();
  }

  /* Botão do WhatsApp: só o ícone enquanto a página está no topo */
  var flutuante = document.querySelector('.wa-float');
  if (flutuante) {
    function compactar() { flutuante.classList.toggle('is-compact', window.scrollY < 120); }
    window.addEventListener('scroll', compactar, { passive: true });
    compactar();
  }

  /* Galeria com ampliação */
  var dlg = document.querySelector('dialog.lightbox');
  var todos = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
  var itens = todos; // lista usada na ampliação: só as fotos visíveis (muda com o filtro)
  if (dlg && todos.length) {
    var holder = dlg.querySelector('.lightbox__stage');
    var atual = 0;
    function mostrar(i) {
      atual = (i + itens.length) % itens.length;
      var el = itens[atual];
      var src = el.getAttribute('data-full');
      var alt = el.getAttribute('data-alt') || '';
      holder.innerHTML = '';
      var img = new Image();
      img.className = 'lightbox__img';
      img.alt = alt;
      img.onerror = function () {
        var ph = document.createElement('div');
        ph.className = 'ph is-empty lightbox__empty';
        ph.setAttribute('data-slot', alt);
        holder.innerHTML = '';
        holder.appendChild(ph);
      };
      img.src = src;
      holder.appendChild(img);
    }
    todos.forEach(function (el) {
      el.addEventListener('click', function () {
        itens = todos.filter(function (x) { return !x.hidden; });
        mostrar(itens.indexOf(el));
        if (!dlg.open) dlg.showModal();
      });
    });
    dlg.querySelector('.lightbox__close').addEventListener('click', function () { dlg.close(); });
    dlg.querySelector('.lightbox__prev').addEventListener('click', function () { mostrar(atual - 1); });
    dlg.querySelector('.lightbox__next').addEventListener('click', function () { mostrar(atual + 1); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.classList.contains('lightbox__inner')) dlg.close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') mostrar(atual - 1);
      if (e.key === 'ArrowRight') mostrar(atual + 1);
    });
  }

  /* Filtro da galeria: botões com aria-pressed escondem as fotos de outras categorias */
  var filtros = Array.prototype.slice.call(document.querySelectorAll('[data-filtro]'));
  if (filtros.length) {
    var contagem = document.getElementById('galeria-contagem');
    filtros.forEach(function (b) {
      b.addEventListener('click', function () {
        var cat = b.getAttribute('data-filtro');
        filtros.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        var n = 0;
        todos.forEach(function (el) {
          var mostra = cat === 'todos' || el.getAttribute('data-cat') === cat;
          el.hidden = !mostra;
          if (mostra) n++;
        });
        if (contagem) contagem.textContent = n === 1 ? 'Mostrando 1 foto.' : 'Mostrando ' + n + ' fotos.';
        if (window.history && history.replaceState) history.replaceState(null, '', cat === 'todos' ? location.pathname + location.search : '#' + cat);
      });
    });
    // abre já filtrado quando o endereço traz #categoria, e acompanha voltar/avançar do navegador
    function filtroDaUrl() {
      var cat = location.hash.replace('#', '') || 'todos';
      var alvo = filtros.filter(function (b) { return b.getAttribute('data-filtro') === cat; })[0];
      if (alvo && alvo.getAttribute('aria-pressed') !== 'true') alvo.click();
    }
    filtroDaUrl();
    window.addEventListener('hashchange', filtroDaUrl);
  }

  /* Formulário: monta a mensagem e abre o WhatsApp */
  var form = document.getElementById('form-orcamento');
  if (form) {
    function erro(campo, texto) {
      var el = document.getElementById(campo.id + '-erro');
      if (texto) { campo.setAttribute('aria-invalid', 'true'); el.textContent = texto; }
      else { campo.removeAttribute('aria-invalid'); el.textContent = ''; }
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = form.elements.nome, tipo = form.elements.tipo, msg = form.elements.mensagem;
      var primeiro = null;
      erro(nome, ''); erro(tipo, '');
      if (!nome.value.trim()) { erro(nome, 'Escreva o seu nome.'); primeiro = primeiro || nome; }
      if (!tipo.value) { erro(tipo, 'Escolha o tipo de móvel.'); primeiro = primeiro || tipo; }
      var status = document.getElementById('form-status');
      if (primeiro) { primeiro.focus(); status.textContent = 'Revise os campos marcados.'; return; }
      var texto = 'Olá! Meu nome é ' + nome.value.trim() + '. Gostaria de um orçamento de: ' + tipo.value + '.';
      if (msg.value.trim()) texto += '\n\n' + msg.value.trim();
      status.textContent = 'Abrindo o WhatsApp.';
      window.open(waLink(texto), '_blank', 'noopener');
    });
  }

  /* Ano no rodapé */
  document.querySelectorAll('[data-ano]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

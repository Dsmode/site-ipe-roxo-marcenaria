const path = require('path');
const root = require('child_process').execSync('npm root -g').toString().trim();
const { chromium } = require(path.join(root, '@playwright', 'cli', 'node_modules', 'playwright-core'));
const fs = require('fs');
const OUT = path.join(__dirname, '_shots');
fs.mkdirSync(OUT, { recursive: true });

const BASE = 'http://127.0.0.1:8080/';
const PAGINAS = ['index.html', 'servicos.html', 'galeria.html', 'sobre.html', 'contato.html', 'creditos.html', '404.html'];
const LARGURAS = [[390, 844], [768, 1024], [1024, 768], [1440, 900]];
const falhas = [];
const resumo = [];

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const [w, h] of LARGURAS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    for (const pg of PAGINAS) {
      const page = await ctx.newPage();
      const erros = [];
      const ruins = [];
      page.on('console', m => { if (m.type() === 'error') erros.push(m.text().slice(0, 140)); });
      page.on('pageerror', e => erros.push('pageerror: ' + e.message.slice(0, 140)));
      page.on('response', r => { if (r.status() >= 400 && !r.url().includes('google')) ruins.push(r.status() + ' ' + r.url().replace(BASE, '')); });
      await page.goto(BASE + pg, { waitUntil: 'load' });
      await page.addStyleTag({ content: '.enter{animation:none!important} html{scroll-behavior:auto!important}' });
      // força o carregamento das imagens preguiçosas
      await page.evaluate(async () => {
        document.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager');
        await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
      });
      const info = await page.evaluate(() => {
        const sw = document.documentElement.scrollWidth, cw = document.documentElement.clientWidth;
        const quebradas = [...document.images].filter(i => i.naturalWidth === 0).map(i => i.getAttribute('src'));
        const h1 = document.querySelectorAll('h1').length;
        const atual = [...document.querySelectorAll('.nav__links a[aria-current]')].map(a => a.textContent);
        const pequenos = [...document.querySelectorAll('a, button')].filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && (r.height < 24 || r.width < 24) && !e.closest('.sr-only') && !e.classList.contains('skip-link'); }).map(e => (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 25) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
        return { sw, cw, quebradas, h1, atual, pequenos };
      });
      const rotulo = `${w}px ${pg}`;
      if (info.sw > info.cw) falhas.push(`${rotulo}: rolagem lateral (${info.sw} > ${info.cw})`);
      if (info.quebradas.length) falhas.push(`${rotulo}: imagens quebradas ${info.quebradas.join(',')}`);
      if (info.h1 !== 1) falhas.push(`${rotulo}: h1 = ${info.h1}`);
      if (erros.length) falhas.push(`${rotulo}: erros de console ${erros.join(' | ')}`);
      if (ruins.length) falhas.push(`${rotulo}: respostas ruins ${ruins.join(' | ')}`);
      if (info.pequenos.length) falhas.push(`${rotulo}: alvos pequenos (<24px) ${info.pequenos.slice(0, 4).join(', ')}`);
      resumo.push(`${rotulo}: ok=${!falhas.some(f => f.startsWith(rotulo))} menu=${info.atual.join('/')}`);
      if ((w === 390 || w === 1440 || w === 768) && ['index.html', 'galeria.html', 'sobre.html'].includes(pg)) {
        await page.screenshot({ path: path.join(OUT, `${pg.replace('.html', '')}-${w}.png`), fullPage: true });
      }
      await page.close();
    }
    await ctx.close();
  }

  // --- interações ---
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  let page = await ctx.newPage();
  await page.goto(BASE + 'index.html');
  await page.click('.nav__toggle');
  const aberto = await page.getAttribute('.nav__toggle', 'aria-expanded');
  await page.waitForTimeout(400);
  const visivel = await page.isVisible('.nav__links a[href="sobre.html"]');
  if (aberto !== 'true' || !visivel) falhas.push('menu do celular não abriu');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  if ((await page.getAttribute('.nav__toggle', 'aria-expanded')) !== 'false') falhas.push('Esc não fechou o menu');

  // galeria: filtro, URL, ampliação, teclado
  await page.goto(BASE + 'galeria.html');
  await page.click('[data-filtro="cozinha"]');
  const n = await page.locator('[data-lightbox]:not([hidden])').count();
  const url = page.url();
  if (n !== 3) falhas.push('filtro cozinha mostrou ' + n);
  if (!url.endsWith('#cozinha')) falhas.push('URL não reflete o filtro: ' + url);
  await page.locator('[data-lightbox]:not([hidden])').first().click();
  await page.waitForSelector('dialog.lightbox[open]');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');
  const aindaAberto = await page.evaluate(() => document.querySelector('dialog.lightbox').open);
  if (aindaAberto) falhas.push('Esc não fechou a ampliação');
  await page.goto(BASE + 'galeria.html#restauro');
  await page.waitForTimeout(300);
  const nr = await page.locator('[data-lightbox]:not([hidden])').count();
  if (nr !== 2) falhas.push('link com #restauro mostrou ' + nr);

  // formulário
  await page.goto(BASE + 'contato.html');
  await page.evaluate(() => { window.__abertos = []; window.open = (u) => { window.__abertos.push(u); return null; }; });
  await page.click('#form-orcamento button[type=submit]');
  const e1 = await page.textContent('#nome-erro');
  const foco = await page.evaluate(() => document.activeElement.id);
  if (!e1 || foco !== 'nome') falhas.push('formulário: erro/foco inesperado');
  await page.fill('#nome', 'Teste');
  await page.selectOption('#tipo', 'Guarda-roupa sob medida');
  await page.click('#form-orcamento button[type=submit]');
  const aberta = await page.evaluate(() => window.__abertos[0] || '');
  if (!aberta.includes('wa.me/5549900000000') || !decodeURIComponent(aberta).includes('Guarda-roupa sob medida')) falhas.push('formulário: URL do WhatsApp errada ' + aberta);

  // botão flutuante: compacto no topo, expande ao rolar
  await page.goto(BASE + 'index.html');
  const compactoTopo = await page.evaluate(() => document.querySelector('.wa-float').classList.contains('is-compact'));
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(500);
  const compactoRolado = await page.evaluate(() => document.querySelector('.wa-float').classList.contains('is-compact'));
  if (!compactoTopo || compactoRolado) falhas.push(`botão flutuante: topo=${compactoTopo} rolado=${compactoRolado}`);
  await ctx.close();

  // menu marcado ao rolar na Home (desktop, com eventos reais de rolagem)
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  page = await ctx2.newPage();
  await page.goto(BASE + 'index.html');
  const marcados = [];
  for (const id of ['servicos', 'avaliacoes', 'galeria', 'contato']) {
    await page.evaluate((i) => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, document.getElementById(i).offsetTop - 60); }, id);
    await page.waitForTimeout(350);
    marcados.push(id + '=' + (await page.evaluate(() => [...document.querySelectorAll('.nav__links a[aria-current]')].map(a => a.textContent).join('/'))));
  }
  resumo.push('menu na rolagem (Home 1440): ' + marcados.join(', '));
  await ctx2.close();

  await browser.close();
  console.log(resumo.filter(r => r.includes('menu na rolagem')).join('\n'));
  console.log('TOTAL combinações testadas:', LARGURAS.length * PAGINAS.length);
  console.log('FALHAS:', falhas.length);
  falhas.forEach(f => console.log(' -', f));
})().catch(e => { console.error('ERRO NO TESTE', e); process.exit(1); });

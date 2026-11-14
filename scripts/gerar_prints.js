// Gera os prints usados no README (docs/screenshots). Requer o servidor local na porta 8080:
//   python scripts/servidor_local.py
// e o Playwright global (@playwright/cli). Depois converte para JPG com scripts/converter_prints.py.
const path = require('path');
const fs = require('fs');
const root = require('child_process').execSync('npm root -g').toString().trim();
const { chromium } = require(path.join(root, '@playwright', 'cli', 'node_modules', 'playwright-core'));

const BASE = 'http://127.0.0.1:8080/';
const OUT = path.join(__dirname, '_prints');
fs.mkdirSync(OUT, { recursive: true });

const DESKTOP = ['index', 'servicos', 'galeria', 'sobre', 'contato'];
const MOBILE = ['index', 'servicos', 'galeria', 'contato'];

async function preparar(page, url) {
  await page.goto(url, { waitUntil: 'load' });
  await page.addStyleTag({ content: '.enter{animation:none!important} html{scroll-behavior:auto!important}' });
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading=lazy]').forEach(i => (i.loading = 'eager'));
    await Promise.all([...document.images].map(i => (i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
    await document.fonts.ready;
  });
  // no celular e no tablet, espera o esqueleto de carregamento sair antes de capturar
  await page.waitForFunction(() => !document.documentElement.classList.contains('skel'), null, { timeout: 15000 });
  await page.waitForTimeout(500);
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  const d = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  for (const nome of DESKTOP) {
    const page = await d.newPage();
    await preparar(page, BASE + nome + '.html');
    await page.screenshot({ path: path.join(OUT, `${nome}-desktop.png`), fullPage: true });
    await page.close();
  }
  await d.close();

  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  for (const nome of MOBILE) {
    const page = await m.newPage();
    await preparar(page, BASE + nome + '.html');
    await page.screenshot({ path: path.join(OUT, `${nome}-mobile.png`) });
    await page.close();
  }
  // esqueleto de carregamento: a página aberta com ?esqueleto segura o esqueleto por alguns segundos
  for (const nome of MOBILE) {
    const page = await m.newPage();
    await page.goto(BASE + nome + '.html?esqueleto', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, `${nome}-esqueleto.png`) });
    await page.close();
  }
  await m.close();
  await browser.close();
  console.log('prints em', OUT);
})();

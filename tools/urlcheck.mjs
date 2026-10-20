import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--enable-unsafe-swiftshader','--no-sandbox'] });
const urls = [
  ['local', 'http://127.0.0.1:4173/'],
  ['pages', 'https://macabyavaha7-sys.github.io/aranya-light-tide/'],
  ['githack', 'https://rawcdn.githack.com/macabyavaha7-sys/aranya-light-tide/gh-pages/index.html'],
];
for (const [name, url] of urls) {
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('requestfailed', r => errs.push('failed ' + r.url()));
  try {
    const t0 = Date.now();
    await p.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
    const title = await p.title();
    const hasCanvas = await p.evaluate(() => !!document.querySelector('#scene'));
    let model = false;
    try {
      await p.waitForFunction(() => document.querySelector('#loading')?.hasAttribute('hidden') === true, { timeout: 60000 });
      model = await p.evaluate(() => !!window.__aranya?.world?.scene.getObjectByName('Chapel'));
    } catch { model = false; }
    console.log(name, JSON.stringify({ title, hasCanvas, model, ms: Date.now() - t0, errs: errs.slice(0, 2) }));
    if (name === 'githack') await p.screenshot({ path: 'shots/30-githack.png' });
  } catch (e) {
    console.log(name, 'FAIL', e.message.slice(0, 120));
  }
  await p.close();
}
await b.close();

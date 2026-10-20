import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('shots');
fs.mkdirSync(OUT, { recursive: true });
const exe = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));

const browser = await chromium.launch({
  executablePath: exe,
  headless: true,
  args: [
    '--enable-unsafe-swiftshader',
    '--use-angle=swiftshader',
    '--disable-gpu-sandbox',
    '--no-sandbox',
    '--ignore-gpu-blocklist',
  ],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text());
});
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelector('#loading')?.hasAttribute('hidden') === true, { timeout: 90000 });
await page.waitForTimeout(2600);

const times = [
  ['01-dawn', 5.33],
  ['02-day', 11.67],
  ['03-dusk', 18.33],
  ['04-blue', 19.67],
  ['05-night', 23.33],
];

for (const [name, hour] of times) {
  await page.evaluate((h) => window.__aranya.setTime(h, true), hour);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT, name + '.png') });
  console.log('shot', name);
}

// interior
await page.evaluate(() => window.__aranya.setTime(18.33, true));
await page.waitForTimeout(1200);
await page.evaluate(() => window.__aranya.director.goTo(2, { instant: false }));
await page.waitForTimeout(2500);
await page.evaluate(() => window.__aranya.director.skip());
await page.waitForTimeout(1200);
await page.screenshot({ path: path.join(OUT, '06-hall.png') });
console.log('shot hall');

await page.evaluate(() => window.__aranya.director.goTo(3));
await page.waitForTimeout(2200);
await page.evaluate(() => window.__aranya.director.skip());
await page.waitForTimeout(1000);
await page.setViewportSize({ width: 1600, height: 1000 });
await page.screenshot({ path: path.join(OUT, '07-terrace.png') });
console.log('shot terrace');

// notes modal
await page.evaluate(() => window.__aranya.director.goTo(0, { instant: true }));
await page.evaluate(() => document.querySelector('#btn-notes').click());
await page.waitForTimeout(900);
await page.screenshot({ path: path.join(OUT, '08-notes.png') });
await page.evaluate(() => document.querySelector('#modal-notes [data-close]').click());

// postcard
await page.evaluate(() => document.querySelector('#btn-card').click());
await page.waitForTimeout(2600);
await page.screenshot({ path: path.join(OUT, '09-card.png') });
await page.evaluate(() => document.querySelector('#modal-card [data-close]').click());

// mobile
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(1600);
await page.screenshot({ path: path.join(OUT, '10-mobile.png') });

const info = await page.evaluate(() => {
  const r = window.__aranya.world.renderer;
  return { calls: r.info.render.calls, tris: r.info.render.triangles, dpr: window.devicePixelRatio };
});
console.log('info', JSON.stringify(info));
console.log('errors', JSON.stringify(errors.slice(0, 10)));
await browser.close();

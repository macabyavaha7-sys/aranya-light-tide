import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('shots');
fs.mkdirSync(OUT, { recursive: true });
const exe = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--enable-unsafe-swiftshader', '--no-sandbox'] });
const errors = [];

const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelector('#loading')?.hasAttribute('hidden') === true, { timeout: 90000 });
await page.waitForTimeout(1500);

// time slider continuous
await page.evaluate(() => { const s = document.querySelector('#time-slider'); s.value = '7.42'; s.dispatchEvent(new Event('input', { bubbles: true })); });
await page.waitForTimeout(700);
console.log('clock', await page.textContent('#clock'), await page.textContent('#phase'));

// sound
await page.click('#btn-sound');
await page.waitForTimeout(900);
console.log('sound', await page.getAttribute('#btn-sound', 'aria-pressed'));

// hide + tap to restore
await page.click('#btn-hide');
await page.waitForTimeout(900);
console.log('hidden', await page.evaluate(() => document.body.classList.contains('ui-hidden')));
await page.screenshot({ path: path.join(OUT, '11-hidden.png') });
await page.mouse.click(800, 500);
await page.waitForTimeout(700);
console.log('revealed', !(await page.evaluate(() => document.body.classList.contains('ui-hidden'))));

// interior look-around (drag) after entering
await page.evaluate(() => window.__aranya.director.goTo(2));
await page.waitForTimeout(2500);
await page.evaluate(() => window.__aranya.director.skip());
await page.waitForTimeout(900);
await page.mouse.move(800, 500);
await page.mouse.down();
await page.mouse.move(400, 430, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(OUT, '12-look.png') });

// back to beach then postcard with content
await page.evaluate(() => window.__aranya.setTime(18.33, true));
await page.evaluate(() => window.__aranya.director.goTo(0, { instant: true }));
await page.waitForTimeout(900);
await page.click('#btn-card');
await page.waitForTimeout(2600);
await page.fill('#card-to', '小满');
await page.fill('#card-msg', '愿你在每一个黄昏，都记得这片海的颜色。');
await page.waitForTimeout(900);
const dl = page.waitForEvent('download');
await page.click('#card-form button[type=submit]');
const download = await dl;
const target = path.join(OUT, 'card-download.png');
await download.saveAs(target);
const buf = fs.readFileSync(target);
const w = buf.readUInt32BE(16);
const h = buf.readUInt32BE(20);
console.log('card', download.suggestedFilename(), w + 'x' + h, Math.round(buf.length / 1024) + 'KB');
await page.screenshot({ path: path.join(OUT, '13-card-filled.png') });

// mobile first load
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
m.on('pageerror', (e) => errors.push('mobile pageerror: ' + e.message));
await m.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
await m.waitForFunction(() => document.querySelector('#loading')?.hasAttribute('hidden') === true, { timeout: 90000 });
await m.waitForTimeout(2500);
await m.screenshot({ path: path.join(OUT, '14-mobile-fresh.png') });
console.log('mobile size', await m.evaluate(() => ({ w: innerWidth, h: innerHeight, dpr: devicePixelRatio })));

console.log('errors', JSON.stringify(errors.slice(0, 8)));
await browser.close();

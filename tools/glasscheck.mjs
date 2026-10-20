import { chromium } from 'playwright-core';
import fs from 'node:fs';

const exe = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

const state = () => page.evaluate(() => {
  const d = window.__aranya.director;
  const glass = window.__aranya.world.scene.getObjectByName('GlassSlide');
  return { stage: d.stage, mode: d.mode, p: d.controls.object.position.toArray().map((v) => +v.toFixed(2)), glassX: glass ? +glass.position.x.toFixed(2) : null };
});

await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelector('#loading')?.hasAttribute('hidden') === true, { timeout: 90000 });
await page.waitForTimeout(1500);
await page.evaluate(() => window.__aranya.setTime(18.33, true));
await page.waitForTimeout(800);
console.log('start', JSON.stringify(await state()));

// enter: beach -> hall in one continuous move
await page.click('#btn-enter');
await page.waitForTimeout(2400);
console.log('mid-enter', JSON.stringify(await state()));
await page.screenshot({ path: 'shots/20-transition-a.png' });
await page.waitForFunction(() => window.__aranya.director.mode === 'interior', { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1200);
console.log('hall', JSON.stringify(await state()));
await page.screenshot({ path: 'shots/21-hall-glass.png' });

// terrace: glass should slide aside
await page.click('#btn-enter');
await page.waitForTimeout(1900);
console.log('mid-terrace', JSON.stringify(await state()));
await page.screenshot({ path: 'shots/22-transition-b.png' });
await page.waitForFunction(() => window.__aranya.director.stage === 3, { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1600);
console.log('terrace', JSON.stringify(await state()));
await page.screenshot({ path: 'shots/23-terrace-glass.png' });

// back inside: glass closes
await page.evaluate(() => window.__aranya.director.goTo(2));
await page.waitForFunction(() => window.__aranya.director.mode === 'interior', { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1800);
console.log('back', JSON.stringify(await state()));

console.log('errors', JSON.stringify(errors.slice(0, 6)));
await browser.close();

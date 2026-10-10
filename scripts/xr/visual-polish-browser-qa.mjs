// Visual/layout regression against real DOM, GLBs and controllers. Camera video alone is synthetic.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { installHandFixture } from './hand-browser-fixture.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.XR_PLAYWRIGHT_MODULE || process.argv[2] || 'playwright');
const executablePath = process.env.XR_BROWSER_EXECUTABLE || process.argv[3];
const origin = process.env.XR_QA_DEV_ORIGIN || 'http://127.0.0.1:5173';
const output = process.env.XR_QA_OUTPUT || '.cache/xr-visual-polish/visual';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ignoreDefaultArgs: ['--hide-scrollbars'], ...(executablePath ? { executablePath } : {}) });
const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, hasTouch: true, reducedMotion: 'reduce' });
await context.addInitScript(installHandFixture);
const page = await context.newPage(); page.setDefaultTimeout(45000);
const results = [], errors = [], httpErrors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('response', r => { if (r.status() >= 400) httpErrors.push({ status: r.status(), url: r.url() }); });
const control = id => page.locator(`[data-xr-hand-control="${id}"]`);
const inspect = () => page.evaluate(() => window.__med3dXrAtlas());
const shot = name => page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
const ready = () => page.waitForFunction(() => window.__med3dXrAtlas?.().meshes === 205);
async function select() {
  await page.locator('.xr-viewport').scrollIntoViewIfNeeded();
  const points = await page.evaluate(() => {
    const rect = document.querySelector('.xr-viewport canvas').getBoundingClientRect();
    return window.__med3dXrAtlas().parts.filter(p => p.visible).flatMap(p => p.screenSamples.map(([x, y, z]) => ({
      x: rect.left + (x + 1) * rect.width / 2, y: rect.top + (1 - y) * rect.height / 2, z,
    }))).filter(p => p.x > rect.left + 50 && p.x < rect.right - 50 && p.y > rect.top + 80 && p.y < Math.min(innerHeight - 60, rect.bottom - 70) && p.z < 1);
  });
  for (const point of points.slice(0, 160)) {
    await page.mouse.click(point.x, point.y);
    if (await page.locator('.xr-atlas-card').count()) return;
  }
  throw new Error('No educational card opened from a real visible mesh');
}
try {
  await page.goto(origin + '/med3d/experiencia-xr/?xrQa=1'); await ready(); await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => scrollTo(0, 0)); await shot('01-desktop-initial');
  const initial = await inspect(); assert.equal(initial.modules.length, 7);
  await control('muscular-toggle').check(); await control('cardiovascular-toggle').check();
  await page.waitForFunction(() => window.__med3dXrAtlas().modules.some(x => x.includes('cardio')) && window.__med3dXrAtlas().meshes > 500);
  await page.waitForTimeout(500); await page.evaluate(() => scrollTo(0, 0)); await shot('02-multiple-systems');
  await select(); await shot('03-education-card');
  assert.ok(await page.locator('#xr-education-title').textContent());
  assert.equal((await inspect()).sceneId, initial.sceneId);
  await control('close-card').click();
  await page.locator('.xr-atlas-layers').screenshot({ path: `${output}/04-system-panel.png` });
  await page.getByRole('button', { name: 'Activar control con manos', exact: true }).click();
  await page.waitForFunction(() => window.handQa.frames > 3);
  assert.equal(await page.locator('.xr-camera-preview.is-visible').count(), 1); await page.evaluate(() => scrollTo(0, 0)); await shot('05-camera-hands');
  await page.getByRole('button', { name: 'Desactivar control con manos', exact: true }).click();
  await page.waitForFunction(() => window.handQa.stops === window.handQa.calls && !document.querySelector('video').srcObject);
  await control('explosion').focus(); await page.keyboard.press('End'); assert.equal((await inspect()).state.explodedAmount, 1);
  await page.waitForTimeout(300); await page.evaluate(() => scrollTo(0, 0)); await shot('06-explosion');
  await control('reset-view').click(); await control('restore-atlas').click();
  results.push({ test: 'initial skeletal/lazy layers, real selection/card, canvas retained, camera preview/start/stop cleanup, explosion and reset' });
  const responsive = [];
  for (const width of [1366, 1050, 900, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    if (width === 390) { await page.reload(); await ready(); }
    await page.evaluate(() => scrollTo(0, 0));
    const layout = await page.evaluate(() => {
      const view = document.querySelector('.xr-viewport').getBoundingClientRect(), list = document.querySelector('.xr-atlas-system-list');
      return { overflow: document.documentElement.scrollWidth > innerWidth, viewport: { x: view.x, y: view.y, width: view.width, height: view.height },
        viewportBg: getComputedStyle(document.querySelector('.xr-viewport')).backgroundColor,
        listCount: list.querySelectorAll('input[type=checkbox]').length, explosionOutside: !list.contains(document.querySelector('[data-xr-hand-control=explosion]')),
        collapsed: !document.querySelector('.xr-atlas-layers').open, font: getComputedStyle(document.querySelector('h1')).fontFamily };
    });
    assert.equal(layout.overflow, false); assert.equal(layout.listCount, 11); assert.equal(layout.explosionOutside, true);
    assert.equal(layout.viewportBg, 'rgb(5, 6, 7)'); assert.ok(layout.viewport.y < 310); assert.ok(layout.viewport.width > width * .55);
    assert.match(layout.font, /Geist/); responsive.push({ width, ...layout });
    if (width === 900) await shot('07-tablet');
    if (width === 390) {
      assert.equal(layout.collapsed, true); await select();
      assert.ok((await page.locator('.xr-atlas-card').boundingBox()).height <= 900 * .42 + 1); await page.screenshot({ path: `${output}/08-mobile.png` });
      results.push({ test: 'mobile selection viewport', state: await page.evaluate(() => ({ scroll: scrollY, focus: document.activeElement?.className, viewport: document.querySelector('.xr-viewport').getBoundingClientRect().toJSON() })) });
      await control('close-card').click(); await control('layers-panel').click();
      await control('integumentary-toggle').scrollIntoViewIfNeeded(); assert.equal(await control('integumentary-toggle').isVisible(), true);
      await control('layers-panel').focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
      assert.equal(await control('layers-panel').evaluate(el => getComputedStyle(el).outlineStyle), 'solid');
      await page.keyboard.press('Enter'); assert.equal(await page.locator('.xr-atlas-layers').getAttribute('open'), null);
    }
  }
  results.push({ test: 'five responsive widths, native controls, keyboard focus, mobile disclosure/bottom sheet, no horizontal overflow', responsive });
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.getByRole('button', { name: 'Activar control con manos', exact: true }).click(); await page.waitForFunction(() => window.handQa.frames > 3);
  // The wordmark uses client navigation: observe cleanup in the same document, without replacing QA counters.
  await page.getByRole('link', { name: 'MED3D, inicio', exact: true }).click();
  await page.locator('.home-page').waitFor(); await page.waitForFunction(() => window.handQa.stops === window.handQa.calls);
  assert.equal(await page.locator('.xr-hand-cursor').count(), 0);
  results.push({ test: 'route-unmount stops camera tracks and removes the XR cursor' });
  assert.deepEqual(errors, []); assert.deepEqual(httpErrors, []);
} catch (error) { await shot('failure').catch(() => {}); throw error; }
finally { await writeFile(`${output}/visual-results.json`, JSON.stringify({ results, errors, httpErrors }, null, 2)); await browser.close(); }

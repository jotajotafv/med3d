// Browser acceptance for the temporary practice. Playwright is supplied externally.
// Usage: node scripts/practica1-qa.mjs <playwright module> <Chromium executable>
// PRACTICA1_ORIGIN includes /med3d/; PRACTICA1_OUTPUT is an ignored evidence folder.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[2] || 'playwright');
const origin = process.env.PRACTICA1_ORIGIN || 'http://127.0.0.1:5184/med3d/';
const output = process.env.PRACTICA1_OUTPUT || '.cache/practica1/local';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}) });
const results = [], errors = [], warnings = [], httpErrors = [];
console.log('Chromium launched');

async function prepare(width, dpr = 1, reducedMotion = 'no-preference') {
  const page = await browser.newPage({ viewport: { width, height: 960 }, deviceScaleFactor: dpr, reducedMotion });
  page.setDefaultTimeout(60000);
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); if (m.type() === 'warning') warnings.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) httpErrors.push({ status: r.status(), url: r.url() }); });
  // Observe real GPU draws/resources without replacing application rendering.
  await page.addInitScript(() => {
    const stats = window.practiceGPU = { draws: 0, offscreen: 0, textures: 0, framebuffers: 0, alpha: null };
    const proto = WebGL2RenderingContext.prototype;
    let nextPixelSample = 0;
    for (const [kind, key] of [['Texture', 'textures'], ['Framebuffer', 'framebuffers']]) {
      const create = proto['create' + kind], remove = proto['delete' + kind];
      const live = new Set();
      proto['create' + kind] = function (...args) { const value = create.apply(this, args); if (value) { live.add(value); stats[key]++; } return value; };
      proto['delete' + kind] = function (value) { if (live.delete(value)) stats[key]--; return remove.call(this, value); };
    }
    for (const name of ['drawElements', 'drawArrays']) {
      const draw = proto[name];
      proto[name] = function (...args) {
        const result = draw.apply(this, args);
        stats.draws++;
        if (this.getParameter(this.DRAW_FRAMEBUFFER_BINDING)) stats.offscreen++;
        else if (performance.now() > nextPixelSample) { const pixel = new Uint8Array(4); this.readPixels(2, this.drawingBufferHeight - 3, 1, 1, this.RGBA, this.UNSIGNED_BYTE, pixel); stats.alpha = pixel[3]; nextPixelSample = performance.now() + 500; }
        return result;
      };
    }
  });
  return page;
}

async function loaded(page, suffix) {
  console.log('Loading ' + suffix);
  await page.goto(origin + 'anatomia/' + suffix);
  console.log('Page navigated');
  await page.waitForFunction(() => window.__med3dAtlasScene?.().parts.length > 0 && document.querySelector('.atlas-viewport')?.getAttribute('aria-busy') === 'false');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('Anatomy ready');
  assert.equal(await page.locator('canvas').count(), 1);
}

async function sample(page, active) {
  await page.waitForTimeout(500);
  const before = await page.evaluate(() => ({ ...window.practiceGPU }));
  await page.waitForTimeout(650);
  const after = await page.evaluate(() => ({ ...window.practiceGPU }));
  const draws = after.draws - before.draws, offscreen = after.offscreen - before.offscreen;
  assert.equal(draws > 0, active, `draws=${draws}, expected animation=${active}`);
  assert.equal(offscreen > 0, active, `offscreen=${offscreen}`);
  assert.equal(after.alpha, 0, 'transparent background preserved');
  return { draws, offscreen, textures: after.textures, framebuffers: after.framebuffers, alpha: after.alpha };
}

async function layout(page) {
  const state = await page.evaluate(() => {
    const panel = document.querySelector('.practica1-panel').getBoundingClientRect();
    const overlap = [...document.querySelectorAll('.atlas-view-picker, .atlas-view-controls, .atlas-explode-bar, .atlas-mobile-actions, .atlas-viewbar')]
      .filter(e => e.getBoundingClientRect().height > 0).filter(e => { const r = e.getBoundingClientRect(); return panel.left < r.right && panel.right > r.left && panel.top < r.bottom && panel.bottom > r.top; }).map(e => e.className);
    return { overflow: document.documentElement.scrollWidth > innerWidth, overlap, panel: { x: panel.x, y: panel.y, width: panel.width, height: panel.height } };
  });
  assert.equal(state.overflow, false);
  assert.deepEqual(state.overlap, []);
  return state;
}

try {
  for (const [width, dpr] of [[1366, 1], [390, 2]]) {
    const page = await prepare(width, dpr);
    await loaded(page, '?qa=1');
    assert.equal(await page.locator('.practica1-panel').count(), 0);
    const normal = await sample(page, false);
    const normalImage = await page.locator('canvas').screenshot();
    await loaded(page, '?practica1=1&qa=1');
    const initial = await sample(page, false);
    assert.ok((await page.locator('canvas').screenshot({ style: '.practica1-panel { visibility: hidden; }' })).equals(normalImage), 'mode starts with the same rendered image');
    const panel = page.locator('.practica1-panel');
    await page.screenshot({ path: `${output}/${width}-initial.png` });
    await panel.locator('summary').click();
    const film = panel.getByRole('switch', { name: 'FilmPass', exact: true });
    const glitch = panel.getByRole('switch', { name: 'GlitchPass', exact: true });
    const intense = panel.getByRole('checkbox', { name: 'Glitch intenso' });
    assert.equal(await intense.isChecked(), false);
    const states = [];
    for (const [name, f, g] of [['original', false, false], ['film', true, false], ['glitch', false, true], ['both', true, true]]) {
      await film.setChecked(f); await glitch.setChecked(g);
      await page.mouse.move(0, 0);
      states.push({ name, ...await sample(page, f || g), layout: await layout(page) });
      console.log(width + ' ' + name + ' rendered');
      await page.screenshot({ path: `${output}/${width}-${name}.png` });
    }
    await intense.check();
    states.push({ name: 'intense', ...await sample(page, true) });
    await page.screenshot({ path: `${output}/${width}-intense.png` });
    await panel.getByRole('button', { name: 'Restaurar imagen original' }).click();
    await page.mouse.move(0, 0);
    const restored = await sample(page, false);
    assert.equal(restored.textures, initial.textures, 'all practice textures disposed');
    assert.equal(restored.framebuffers, initial.framebuffers, 'all practice framebuffers disposed');
    assert.ok((await page.locator('canvas').screenshot({ style: '.practica1-panel { visibility: hidden; }' })).equals(normalImage), 'restore recovers original pixels');
    await film.check();
    await panel.getByRole('slider', { name: 'Intensidad FilmPass' }).fill('0.75');
    assert.equal(await panel.locator('output').textContent(), '0.75');
    await glitch.check();
    await panel.locator('summary').click();
    const cameraBefore = await page.evaluate(() => window.__med3dAtlasScene().camera);
    const canvas = await page.locator('canvas').boundingBox();
    await page.mouse.move(canvas.x + canvas.width * .57, canvas.y + canvas.height * .5);
    await page.mouse.down(); await page.mouse.move(canvas.x + canvas.width * .7, canvas.y + canvas.height * .56, { steps: 12 }); await page.mouse.up();
    await page.waitForTimeout(1000);
    const rotated = await page.evaluate(() => window.__med3dAtlasScene().camera);
    assert.notDeepEqual(rotated.position, cameraBefore.position, 'OrbitControls rotation');
    await page.getByRole('button', { name: 'Acercar', exact: true }).click();
    await page.waitForTimeout(1000);
    const zoomed = await page.evaluate(() => window.__med3dAtlasScene().camera);
    assert.notDeepEqual(zoomed.position, rotated.position, 'anatomical zoom controls');
    const points = await page.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return window.__med3dAtlasScene().parts.filter(p => p.visible).flatMap(p => p.screenSamples.map(([x, y, z]) => ({ x: r.left + (x + 1) * r.width / 2, y: r.top + (1 - y) * r.height / 2, z }))).filter(p => p.x > r.left + 70 && p.x < r.right - 70 && p.y > r.top + 90 && p.y < Math.min(innerHeight - 80, r.bottom - 70) && p.z < 1); });
    for (const p of points.slice(0, 100)) { await page.mouse.click(p.x, p.y); if (await page.locator('.atlas-viewport').getAttribute('data-selected-id')) break; }
    const selected = await page.locator('.atlas-viewport').getAttribute('data-selected-id');
    assert.ok(selected, 'selection by actual canvas click while both effects run');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await panel.locator('summary').click();
    assert.equal(await film.isDisabled(), true);
    assert.equal(await glitch.isDisabled(), true);
    const reduced = await sample(page, false);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    assert.equal(await film.isChecked(), false);
    assert.equal(await glitch.isChecked(), false);
    await film.check();
    await page.setViewportSize({ width: width === 1366 ? 1050 : 430, height: 880 });
    const resized = await sample(page, true);
    await layout(page);
    const bufferSize = await page.locator('canvas').evaluate(c => ({ width: c.width, height: c.height, cssWidth: c.clientWidth, cssHeight: c.clientHeight }));
    assert.ok(Math.abs(bufferSize.width / bufferSize.cssWidth - Math.min(dpr, 1.5)) < .02);
    await panel.getByRole('button', { name: 'Restaurar imagen original' }).click();
    await sample(page, false);
    results.push({ width, dpr, normal, initial, states, restored, rotation: true, zoom: true, selected, reduced, resized, bufferSize });
    console.log(`PASS ${width}px: four states, intense, restore, resources, motion, selection, orbit, zoom, resize`);
    await page.close();
  }
  const reduced = await prepare(390, 1, 'reduce');
  await loaded(reduced, '?practica1=1&qa=1');
  await reduced.locator('.practica1-panel summary').click();
  assert.equal(await reduced.getByRole('switch', { name: 'FilmPass', exact: true }).isDisabled(), true);
  await sample(reduced, false);
  await reduced.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(httpErrors, []);
} catch (error) {
  for (const context of browser.contexts()) for (const page of context.pages()) {
    await page.screenshot({ path: `${output}/failure-${page.viewportSize().width}.png` }).catch(() => {});
  }
  throw error;
} finally {
  await writeFile(`${output}/results.json`, JSON.stringify({ origin, results, errors, warnings, httpErrors }, null, 2));
  await browser.close();
}

// Production-build navigation/first-paint evidence. Delays and RAF sampling exist only in this harness.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.XR_PLAYWRIGHT_MODULE || process.argv[2] || 'playwright');
const executablePath = process.env.XR_BROWSER_EXECUTABLE || process.argv[3];
const origin = process.env.XR_QA_ORIGIN || 'http://127.0.0.1:5184';
const baseline = process.env.XR_QA_BASELINE === '1';
const output = process.env.XR_QA_OUTPUT || '.cache/xr-visual-polish/fouc';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const results = [], errors = [], httpErrors = [];
try {
  for (const delay of [900, 0]) {
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, reducedMotion: 'reduce' });
    if (delay) await context.route('**/assets/*', async route => {
      if (/\.(css|js)(\?|$)/.test(route.request().url())) await new Promise(resolve => setTimeout(resolve, delay));
      await route.continue().catch(() => {}); // A subsequent document may already have cancelled its old downloads.
    });
    await context.addInitScript(() => {
      const trace = window.styleTrace = { samples: [], frames: 0, paints: [] };
      new PerformanceObserver(list => trace.paints.push(...list.getEntries().map(e => ({ name: e.name, time: e.startTime })))).observe({ type: 'paint', buffered: true });
      const style = element => {
        if (!element) return null;
        const s = getComputedStyle(element);
        return { bg: s.backgroundColor, color: s.color, font: s.fontFamily, size: s.fontSize, minHeight: s.minHeight };
      };
      function frame() {
        if (document.body) {
          const sample = { html: style(document.documentElement), body: style(document.body), root: style(document.getElementById('root')),
            shell: style(document.querySelector('#contenido')), main: style(document.querySelector('main')),
            routeClass: document.querySelector('main')?.className ?? '', header: style(document.querySelector('.site-header')),
            wordmark: style(document.querySelector('.site-wordmark')), fonts: document.fonts.status,
            atlasViewport: style(document.querySelector('.atlas-phase2 .atlas-viewport')),
            atlasBackgroundImage: document.querySelector('.atlas-phase2 .atlas-viewport') ? getComputedStyle(document.querySelector('.atlas-phase2 .atlas-viewport')).backgroundImage : null };
          const key = JSON.stringify(sample), last = trace.samples.at(-1); trace.frames++;
          if (last?.key === key) { last.end = performance.now(); last.frames++; }
          else trace.samples.push({ ...sample, key, start: performance.now(), end: performance.now(), frames: 1 });
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
    const page = await context.newPage(); page.setDefaultTimeout(45000);
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400) httpErrors.push({ status: r.status(), url: r.url() }); });
    const cdp = await context.newCDPSession(page);
    for (const [index, route] of ['', 'anatomia', 'acerca', 'experiencia-xr', 'anatomia', ''].entries()) {
      const name = `${delay ? 'slow' : 'normal'}-${index}-${route || 'inicio'}`;
      if (index === 0) await page.goto(origin + '/med3d/', { waitUntil: 'commit' });
      else {
        // These are the actual header links; SiteLink uses ordinary document navigation.
        const href = '/med3d/' + route;
        await Promise.all([page.waitForURL(url => url.pathname.replace(/\/$/, '') === href.replace(/\/$/, ''), { waitUntil: 'commit' }),
          page.locator('.main-nav a').filter({ hasText: ({ anatomia: 'Anatomía 3D', acerca: 'Acerca del proyecto', 'experiencia-xr': 'Experiencia XR', '': 'Inicio' })[route] }).click({ noWaitAfter: true })]);
      }
      const frames = [];
      for (const ms of [40, 320]) {
        await page.waitForTimeout(ms);
        const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        const filename = `${name}-${ms}ms.png`; await writeFile(`${output}/${filename}`, Buffer.from(shot.data, 'base64')); frames.push(filename);
      }
      await page.locator(({ anatomia: '.atlas-phase2', acerca: '.about-page', 'experiencia-xr': '.xr-atlas-page', '': '.home-page' })[route]).waitFor();
      await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(180);
      const trace = await page.evaluate(() => ({ ...window.styleTrace, samples: window.styleTrace.samples.map(({ key, ...s }) => s),
        overflow: document.documentElement.scrollWidth > innerWidth, theme: document.querySelector('meta[name=theme-color]')?.content,
        css: [...document.querySelectorAll('link[rel=stylesheet]')].map(e => e.href) }));
      const dark = value => ['rgb(5, 6, 7)', 'rgb(5, 5, 5)'].includes(value);
      const transparent = value => value === 'rgba(0, 0, 0, 0)';
      const bad = trace.samples.filter(s => !dark(s.html?.bg) || !dark(s.body?.bg) || !dark(s.root?.bg)
        || (s.shell && !dark(s.shell.bg) && !transparent(s.shell.bg)) || (s.main && !dark(s.main.bg) && !transparent(s.main.bg))
        || (s.header && !/^rgba?\(5, [56], [57],?/.test(s.header.bg))
        || (s.atlasViewport && (!dark(s.atlasViewport.bg) || s.atlasBackgroundImage !== 'none')));
      results.push({ name, delay, frames, ...trace, badFrames: bad.reduce((sum, s) => sum + s.frames, 0) });
      console.log(JSON.stringify({ name, frames: trace.frames, badFrames: results.at(-1).badFrames, classes: [...new Set(trace.samples.map(s => s.routeClass))] }));
      if (!baseline) { assert.equal(bad.length, 0, `${name}: old/transparent base during transition`); assert.equal(trace.overflow, false); }
    }
    await context.close();
  }
  // Isolate the critical HTML rule: no application JS or external stylesheet can provide a background here.
  const bare = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await bare.route('**/assets/*', route => route.abort());
  const entry = await bare.newPage();
  await entry.goto(origin + '/med3d/experiencia-xr/', { waitUntil: 'domcontentloaded' });
  const critical = await entry.evaluate(() => ({
    colors: [document.documentElement, document.body, document.getElementById('root')].map(e => getComputedStyle(e).backgroundColor),
    scheme: getComputedStyle(document.documentElement).colorScheme,
    bodyMargin: getComputedStyle(document.body).margin,
    rootHeight: document.getElementById('root').getBoundingClientRect().height,
  }));
  await entry.screenshot({ path: `${output}/critical-without-external-css.png` });
  results.push({ name: 'critical-without-external-css-or-js', ...critical });
  if (!baseline) { assert.deepEqual(critical.colors, Array(3).fill('rgb(5, 6, 7)')); assert.equal(critical.scheme, 'dark'); assert.equal(critical.bodyMargin, '0px'); assert.ok(critical.rootHeight >= 900); }
  await bare.close();
  assert.deepEqual(errors, []); assert.deepEqual(httpErrors, []);
} finally {
  await writeFile(`${output}/navigation.json`, JSON.stringify({ baseline, results, errors, httpErrors }, null, 2));
  await browser.close();
}

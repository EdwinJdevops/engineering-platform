/* Browser smoke tests against the deployed GitHub Pages site, not the local Hugo build. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE = new URL('https://edwinjdevops.github.io/engineering-platform/');
const REPORT_DIR = path.resolve('production-browser-smoke');
const ROUTES = ['', 'projects/', 'articles/', 'services/', 'contact/'];
const EMAIL = 'edwinjonathanchibuike123@gmail.com';
const observations = [];

async function expectPage(page, relativePath) {
  const url = new URL(relativePath, BASE).href;
  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  assert.equal(response?.status(), 200, 'Production page must return HTTP 200: ' + url);
  assert.equal(new URL(page.url()).origin, BASE.origin, 'Unexpected redirect origin');
  assert.equal(await page.locator('main#main').count(), 1, 'Missing main landmark on ' + url);
  observations.push({ url, status: response.status() });
}

async function checkHomepage(page, name, { reducedMotion, mobile }) {
  await expectPage(page, '');
  const portrait = page.locator('.home-portrait img');
  assert.equal(await portrait.count(), 1, 'Authentic portrait element missing: ' + name);
  const photo = await portrait.evaluate(img => ({
    loaded: img.complete && img.naturalWidth > 0,
    visible: img.getBoundingClientRect().width > 0 && img.getBoundingClientRect().height > 0
  }));
  assert.ok(photo.loaded && photo.visible, 'Portrait not loaded or displayed: ' + name);
  const scene = page.locator('[data-infra-scene]');
  assert.ok(await scene.isVisible(), 'Infrastructure scene absent: ' + name);
  const mode = (await scene.getAttribute('data-render-mode')) || 'css-fallback';
  if (mode === 'webgl') {
    assert.ok(await page.locator('.infra-webgl').isVisible(), 'WebGL reports active without a visible canvas');
  } else {
    assert.ok(await page.locator('.infra-stack').isVisible(), 'CSS infrastructure fallback not visible: ' + name);
    assert.notEqual(await page.locator('.infra-stack').evaluate(el => getComputedStyle(el).transform), 'none',
      'CSS infrastructure fallback has no 3D transform: ' + name);
  }
  if (mobile || reducedMotion === 'reduce') {
    assert.notEqual(mode, 'webgl', 'Mobile or reduced-motion setting incorrectly enables WebGL');
  }
  if (reducedMotion === 'reduce') {
    assert.equal(await page.locator('.home-work').evaluate(el => getComputedStyle(el).animationName), 'none',
      'Reduced motion still animates the home-work section');
  } else {
    const work = page.locator('.home-work');
    await work.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    assert.ok(await work.evaluate(el => el.classList.contains('is-visible')),
      'Scroll-triggered work section was not revealed');
    const item = page.locator('.expertise-list details').first();
    await item.locator('summary').click();
    assert.notEqual(await item.getAttribute('open'), null, 'Expertise panel did not expand');
    await item.locator('summary').click();
    assert.equal(await item.getAttribute('open'), null, 'Expertise panel did not collapse');
    const card = page.locator('.featured-project h3 a').first();
    assert.ok(await card.isVisible(), 'Featured engineering project link is missing');
    await card.focus();
    assert.ok(await page.locator('.featured-project').first().evaluate(el => el.matches(':focus-within')),
      'Featured project card has no keyboard focus containment');
  }
  await page.screenshot({ path: path.join(REPORT_DIR, name + '-homepage.png'), fullPage: true });
  observations.push({ profile: name, portrait: photo, renderMode: mode });
}

async function runProfile(browser, { name, viewport, reducedMotion, mobile }) {
  const context = await browser.newContext({
    viewport, reducedMotion, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1
  });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push('Uncaught JS error: ' + error.message));
    page.on('response', response => {
      if (new URL(response.url()).origin === BASE.origin && response.status() >= 400)
        errors.push('First-party HTTP ' + response.status() + ': ' + response.url());
    });
    await checkHomepage(page, name, { reducedMotion, mobile });
    const overflow = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth
    }));
    assert.ok(overflow.document <= overflow.viewport + 2, 'Homepage horizontal overflow: ' + JSON.stringify(overflow));
    if (mobile) {
      const nav = page.locator('.mobile-nav');
      const summary = nav.locator('summary');
      assert.ok(await summary.isVisible(), 'Mobile navigation toggle not visible');
      await summary.click();
      assert.notEqual(await nav.getAttribute('open'), null, 'Mobile navigation failed to open');
      const project = nav.locator('a[href$="/projects/"]').first();
      assert.ok(await project.isVisible(), 'Projects link missing in open mobile menu');
      assert.ok(await project.evaluate(el => el.getBoundingClientRect().height >= 44),
        'Mobile Projects link touch target is below 44px');
      await page.screenshot({ path: path.join(REPORT_DIR, name + '-menu.png') });
      await summary.click();
      assert.equal(await nav.getAttribute('open'), null, 'Mobile navigation failed to close');
      await summary.focus();
      await page.keyboard.press('Enter');
      assert.notEqual(await nav.getAttribute('open'), null, 'Keyboard did not open mobile menu');
      await page.keyboard.press('Enter');
      assert.equal(await nav.getAttribute('open'), null, 'Keyboard did not close mobile menu');
    } else {
      assert.ok(await page.locator('.desktop-nav').isVisible(), 'Desktop navigation not visible');
    }
    for (const route of ROUTES.slice(1)) await expectPage(page, route);
    const emailLink = page.locator('.contact-methods a[href^="mailto:"]').first();
    assert.equal(await emailLink.count(), 1, 'Contact page missing direct email link');
    assert.ok((await emailLink.getAttribute('href')).startsWith('mailto:' + EMAIL),
      'Production contact email does not match verified address');
    assert.deepEqual(errors, [], 'Browser errors / failed first-party assets');
    observations.push({ profile: name, routesChecked: ROUTES.length, noHorizontalOverflow: true, browserErrors: errors.length });
  } finally {
    await context.close();
  }
}

(async () => {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    await runProfile(browser, {
      name: 'small-mobile-motion', viewport: { width: 320, height: 720 }, reducedMotion: 'no-preference', mobile: true
    });
    await runProfile(browser, {
      name: 'mobile-motion', viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference', mobile: true
    });
    await runProfile(browser, {
      name: 'mobile-reduced-motion', viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', mobile: true
    });
    await runProfile(browser, {
      name: 'desktop-motion', viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference', mobile: false
    });
    await runProfile(browser, {
      name: 'desktop-reduced-motion', viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', mobile: false
    });
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(REPORT_DIR, 'results.json'), JSON.stringify({
      checkedAt: new Date().toISOString(),
      target: BASE.href,
      method: 'Synthetic Chromium; deployed site; no field-user or cross-device guarantee',
      observations
    }, null, 2) + '\n');
  }
  console.log('Production browser smoke passed: homepage, portrait, CSS/WebGL fallback, reduced motion, navigation, expertise, project card and contact links.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

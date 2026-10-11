/* Check full imported articles in built Hugo output; no browser-specific rendering assumptions. */
'use strict';
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const files = fs.readdirSync('content/articles').filter(name => {
  if (!name.endsWith('.md')) return false;
  return fs.readFileSync(path.join('content/articles', name), 'utf8').includes('original_platform: "hashnode"');
});
if (files.length !== 10) throw new Error('Expected exactly ten nonduplicate Hashnode originals, found ' + files.length);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  const results = [];
  try {
    for (const dimensions of [{width:390,height:844},{width:1440,height:900}]) {
      const page = await browser.newPage({viewport:dimensions,reducedMotion:'reduce'});
      page.on('pageerror', error => errors.push(error.message));
      for (const filename of files) {
        const slug = filename.slice(0, -3);
        const url = 'http://127.0.0.1:4173/articles/' + slug + '/';
        const source = fs.readFileSync(path.join('content/articles', filename), 'utf8');
        const original = source.match(/^original_url: "([^"]+)"$/m)?.[1];
        const response = await page.goto(url, { waitUntil: 'load', timeout: 45000 });
        if (response?.status() !== 200) {
          errors.push(slug + ' HTTP ' + (response?.status() || 'no response'));
          continue;
        }
        const observation = await page.evaluate(() => ({
          viewport:document.documentElement.clientWidth,
          document:document.documentElement.scrollWidth,
          headings:document.querySelectorAll('main article h1').length,
          bodyCharacters:(document.querySelector('.prose-body')?.textContent || '').length,
          canonical:document.querySelector('link[rel="canonical"]')?.href || '',
          source:document.querySelector('.article-source a')?.href || '',
          images:document.querySelectorAll('.prose-body img').length
        }));
        if (observation.document > observation.viewport + 2) errors.push(slug + ' horizontal overflow ' + JSON.stringify(dimensions));
        if (observation.headings !== 1) errors.push(slug + ' should have exactly one H1');
        if (observation.bodyCharacters < 300) errors.push(slug + ' article is unexpectedly short');
        if (observation.canonical !== original || observation.source !== original)
          errors.push(slug + ' original/canonical source metadata mismatch');
        if (observation.images && dimensions.width === 390) {
          const first = page.locator('.prose-body img').first();
          await first.scrollIntoViewIfNeeded();
          const image = await first.evaluate(async element => {
            try { await element.decode(); }
            catch (_error) { return {loaded:false,url:element.currentSrc}; }
            return {loaded:element.naturalWidth > 0,url:element.currentSrc};
          });
          if (!image.loaded) errors.push(slug + ' first diagram did not decode: ' + image.url);
        }
        results.push({slug,viewport:dimensions.width,...observation});
      }
      await page.close();
    }
  } finally {
    await browser.close();
    fs.mkdirSync('visual-audit', {recursive:true});
    fs.writeFileSync('visual-audit/hashnode-articles.json', JSON.stringify({results,errors},null,2) + '\n');
  }
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else console.log('Validated ten imported Hashnode articles at mobile and desktop viewports, including source links and first-diagram decoding.');
})().catch(error => {console.error(error); process.exitCode = 1;});

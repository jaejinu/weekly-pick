const assert = require('node:assert/strict');
module.exports = async function checkImages(browser, base) {
  for (const scale of [1, 2, 3]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: scale });
    try {
      await context.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body: 'window.WEEKLY_PICK_CONFIG={};' }));
      const page = await context.newPage();
      await page.goto(base + '/#/discover');
      const img = page.locator('.ex-card--row img').first();
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(el => el.decode());
      const selected = await img.evaluate(el => ({ src: el.currentSrc, rect: el.getBoundingClientRect().toJSON() }));
      const width = Number(selected.src.match(/-(\d+)\.webp$/)?.[1]);
      assert.ok(width >= Math.max(selected.rect.width, selected.rect.height * 4 / 3) * scale - 1,
        'selected source must cover the crop at this pixel density');
      assert.ok(width < 1448, 'small cards should select a smaller source');
      await page.goto(base + '/#/exhibition/ex-01');
      const hero = page.locator('.detail-hero img');
      await hero.evaluate(el => el.decode());
      assert.match(await hero.evaluate(el => el.currentSrc), /\/ex-01-light-room\.webp$/);
    } finally { await context.close(); }
  }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    await context.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body: 'window.WEEKLY_PICK_CONFIG={};' }));
    await context.route('**/assets/images/responsive/**', r => r.abort());
    const page = await context.newPage();
    await page.goto(base + '/#/discover');
    const card = page.locator('.ex-card--row').first();
    await page.waitForFunction(() => {
      const img = document.querySelector('.ex-card--row img');
      return img && !img.hasAttribute('srcset') && img.complete && img.naturalWidth > 0;
    });
    assert.equal(await card.locator('.img-fallback').count(), 0, 'failed variant should load its original');
    await context.route('**/assets/images/*.webp', r => r.abort());
    await page.reload();
    await card.locator('.img-fallback').waitFor();
    assert.equal(await card.locator('img').count(), 0, 'both failures should show the existing placeholder');
  } finally { await context.close(); }
};

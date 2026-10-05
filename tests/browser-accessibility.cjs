const assert = require('node:assert/strict');
module.exports = async function checkKeyboardNavigation(page, go, ready) {
  await go('home');
  await page.locator('.bottom-nav a[href="#/saved"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForURL(/#\/saved$/); await ready();
  assert.equal(await page.locator('main h1').evaluate(el=>el === document.activeElement), true,
    'keyboard navigation must move focus into the destination screen');
  assert.equal(await page.title(), '저장한 전시 — 위클리픽');
  for (const route of ['reviews', 'regions', 'archive', 'account', 'privacy']) {
    await go(route);
    assert.equal(await page.locator('main h1').count(), 1, route + ' needs a page heading');
    assert.equal(await page.title(), (await page.locator('main h1').innerText()) + ' — 위클리픽');
  }
  await go('discover?focus=1');
  assert.equal(await page.evaluate(()=>document.activeElement.id), 'search-input');
  assert.equal(await page.locator('.search-field').evaluate(el=>{
    const style = getComputedStyle(el);
    return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2;
  }), true, 'search focus must have a visible indicator');
  await go('exhibition/ex-01');
  await page.locator('a[href="#/review/new/ex-01"]').click();
  await page.locator('#review-text').waitFor();
  assert.equal(await page.locator('[role="radio"][tabindex="0"]').count(), 1);
  await page.locator('[role="radio"][tabindex="0"]').focus();
  await page.keyboard.press('Space');
  for (const [key, value] of [['ArrowUp','5'], ['ArrowDown','1'], ['ArrowLeft','5'], ['ArrowRight','1']]) {
    await page.keyboard.press(key);
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.value), value);
    assert.equal(await page.locator('[role="radio"][aria-checked="true"]').getAttribute('data-value'), value);
    assert.equal(await page.locator('[role="radio"][tabindex="0"]').count(), 1);
  }
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.id), 'review-text');
  await page.locator('#review-text').fill('키보드로 작성하는 후기');
  for (const action of ['set-day','set-waiting']) {
    await page.locator(`[data-action="${action}"]`).first().focus();
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.action), action);
    assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('aria-pressed')), 'true');
  }
  await page.locator('#review-text').fill('가'.repeat(81));
  assert.equal(await page.locator('#review-text').getAttribute('aria-invalid'), 'true');
  assert.match(await page.locator('#review-text').getAttribute('aria-describedby'), /text-error/);
  assert.equal(await page.locator('[data-action="submit-review"]').isDisabled(), true);
  await page.locator('#review-text').fill('다시 짧게 쓴 후기');
  assert.equal(await page.locator('#review-text').getAttribute('aria-invalid'), null);
  assert.equal(await page.locator('#text-error').innerText(), '');
  assert.equal(await page.locator('[data-action="submit-review"]').isEnabled(), true);

  await page.locator('[data-action="back"]').click();
  await page.locator('[role="dialog"]').waitFor();
  await page.goBack(); await ready();
  assert.match(page.url(), /#\/exhibition\/ex-01$/);
  assert.equal(await page.locator('[role="dialog"]').count(), 0);
  assert.equal(await page.locator('#app').evaluate(el=>el.inert), false);
  assert.equal(await page.locator('#toast-region').evaluate(el=>el.inert), false);
  assert.equal(await page.evaluate(()=>ui.modalConfirm), null);
  await page.goForward(); await ready();
  assert.equal(await page.locator('#review-text').inputValue(), '다시 짧게 쓴 후기');
  await page.locator('[data-action="back"]').click();
  await page.locator('[data-action="modal-confirm"]').click();
  await page.waitForURL(/#\/exhibition\/ex-01$/); await ready();
  await go('discover?bad=%E0%A4%A');
  assert.equal(await page.locator('#search-input').count(), 1);
};

const assert = require('node:assert/strict');

module.exports = async function checkReviewExit(page, go, ready, shot) {
  const edit = async () => {
    await go('review/rv-my-1');
    await page.locator('a[href="#/review/edit/rv-my-1"]').click();
    await page.locator('#review-text').waitFor();
  };
  const waitForDetail = async () => {
    await page.waitForURL(/#\/review\/rv-my-1$/);
    await ready();
    assert.equal(await page.locator('[role="dialog"]').count(), 0);
    assert.equal(await page.locator('.review-detail__text').innerText(), '수정한 후기');
  };

  // Opening an existing review does not count as editing it.
  await edit();
  await page.locator('[data-action="back"]').click();
  await waitForDetail();
  await edit();
  await page.locator('[data-action="cancel-edit"]').click();
  await waitForDetail();

  // Reverting all fields to their original values removes the warning.
  await edit();
  await page.locator('#review-text').fill('저장하지 않을 수정');
  await page.locator('#review-text').fill('수정한 후기');
  await page.locator('[data-action="set-rating"][data-value="3"]').click();
  await page.locator('[data-action="set-rating"][data-value="4"]').click();
  await page.locator('[data-action="cancel-edit"]').click();
  await waitForDetail();

  // Changed text is preserved when dismissing the modal; background cannot receive focus.
  await edit();
  await page.locator('#review-text').fill('아직 저장하지 않은 수정');
  await page.locator('[data-action="cancel-edit"]').click();
  assert.equal(await page.locator('[role="dialog"]').getAttribute('aria-describedby'), 'modal-description');
  assert.equal(await page.locator('#app').evaluate(el => el.inert), true);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.action), 'modal-close');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.action), 'modal-confirm');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.action), 'modal-close');
  await shot('review-exit-confirm');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#app').evaluate(el => el.inert), false);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.action), 'cancel-edit');
  assert.equal(await page.locator('#review-text').inputValue(), '아직 저장하지 않은 수정');
  await page.locator('[data-action="cancel-edit"]').click();
  await page.locator('[data-action="modal-confirm"]').click();
  await waitForDetail();

  // Day-only and waiting-only drafts also require a discard decision.
  for (const selector of ['[data-action="set-day"][data-value="평일"]', '[data-action="set-waiting"][data-value="no"]']) {
    await go('exhibition/ex-01');
    await page.locator('a[href="#/review/new/ex-01"]').click();
    await page.locator('#review-text').waitFor();
    await page.locator(selector).click();
    await page.locator('[data-action="back"]').click();
    await page.locator('[role="dialog"]').waitFor();
    await page.locator('[data-action="modal-close"]').click();
    assert.equal(await page.locator(selector).getAttribute('aria-pressed'), 'true');
    await page.locator('[data-action="back"]').click();
    await page.locator('[data-action="modal-confirm"]').click();
    await page.waitForURL(/#\/exhibition\/ex-01$/);
    await ready();
    assert.equal(await page.evaluate(() => myReviewOf('ex-01')), null);
  }
};

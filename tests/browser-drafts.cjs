const assert = require('node:assert/strict');
module.exports = async function checkDraftRecovery(page, go, ready) {
  await go('exhibition/ex-01');
  await page.locator('a[href="#/review/new/ex-01"]').click();
  await page.locator('#review-text').waitFor();
  await page.locator('#review-text').fill('뒤로 가도 남아 있는 임시 후기');
  await page.locator('[data-action="set-rating"][data-value="3"]').click();
  await page.locator('[data-action="set-day"][data-value="평일"]').click();
  await page.locator('[data-action="set-waiting"][data-value="yes"]').click();
  await page.goBack(); await ready();
  assert.match(page.url(), /#\/exhibition\/ex-01$/);
  await page.goForward(); await ready();
  const checkValues = async () => {
    assert.equal(await page.locator('#review-text').inputValue(), '뒤로 가도 남아 있는 임시 후기');
    assert.equal(await page.locator('[data-action="set-rating"][data-value="3"]').getAttribute('aria-checked'), 'true');
    for (const selector of ['[data-action="set-day"][data-value="평일"]', '[data-action="set-waiting"][data-value="yes"]']) {
      assert.equal(await page.locator(selector).getAttribute('aria-pressed'), 'true');
    }
    assert.match(await page.locator('main').innerText(), /쓰던 후기를 복원/);
  };
  await checkValues();
  await page.reload(); await ready(); await checkValues();
  // Visiting another form cannot show this exhibition's draft.
  await go('review/new/ex-03');
  assert.equal(await page.locator('#review-text').inputValue(), '');
  await go('review/new/ex-01'); await checkValues();
  await page.locator('[data-action="back"]').click();
  await page.locator('[data-action="modal-confirm"]').click();
  await page.waitForURL(/#\/review\/new\/ex-03$/); await ready();
  await go('review/new/ex-01');
  assert.equal(await page.locator('#review-text').inputValue(), '');
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('weeklypick.reviewDraft.ex-01/new')), null);

  // An edit survives reload without changing the registered review; submitting clears it.
  await go('review/edit/rv-my-1');
  await page.locator('#review-text').fill('복원 후 등록한 후기');
  await page.reload(); await ready();
  assert.equal(await page.locator('#review-text').inputValue(), '복원 후 등록한 후기');
  assert.equal(await page.evaluate(()=>myReviewOf('ex-02').text), '수정한 후기');
  await page.locator('[data-action="submit-review"]').click();
  await page.waitForURL(/#\/review\/rv-my-1$/); await ready();
  assert.equal(await page.locator('.review-detail__text').innerText(), '복원 후 등록한 후기');
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('weeklypick.reviewDraft.ex-02/rv-my-1')), null);
};

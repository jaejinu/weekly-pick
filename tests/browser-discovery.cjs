const assert = require('node:assert/strict');
module.exports = async function checkDiscoveryInput(page, go, ready) {
  await go('discover?focus=1');
  await page.locator('#search-input').waitFor();
  // Synthetic IME events verify that intermediate composition does not replace the input.
  const composing = await page.evaluate(() => {
    const input = document.getElementById('search-input');
    input.dispatchEvent(new CompositionEvent('compositionstart', {bubbles:true}));
    input.value = '성';
    input.dispatchEvent(new InputEvent('input', {bubbles:true, isComposing:true, data:'성'}));
    const retained = input === document.getElementById('search-input');
    input.value = '성수';
    input.dispatchEvent(new CompositionEvent('compositionend', {bubbles:true, data:'성수'}));
    return retained;
  });
  assert.equal(composing, true, 'IME composition must not detach the input');
  assert.equal(await page.locator('#search-input').inputValue(), '성수');
  assert.equal(await page.evaluate(()=>ui.discover.term), '성수');
  assert.ok(await page.locator('.ex-card').count() > 0);
  await page.locator('[data-action="clear-term"]').click();
  assert.equal(await page.evaluate(()=>document.activeElement.id), 'search-input');
  assert.equal(await page.locator('#search-input').inputValue(), '');
  for (const selector of ['[data-action="filter-region"][data-value="rg-seongsu"]', '[data-action="filter-tag"][data-value="사진"]', '[data-action="filter-free"]']) {
    await page.locator(selector).focus();
    await page.keyboard.press('Space');
    assert.equal(await page.locator(selector).evaluate(el=>el === document.activeElement), true);
    assert.equal(await page.locator(selector).getAttribute(selector.includes('filter-free') ? 'aria-checked' : 'aria-pressed'), 'true');
  }
  await page.locator('[data-action="reset-filters"]').last().click();
  assert.equal(await page.evaluate(()=>document.activeElement.id), 'search-input');
  assert.equal(await page.locator('.ex-card').count(), 10);
  await go('regions?rg=rg-jongno');
  const region = '[data-action="select-region"][data-value="rg-seongsu"]';
  await page.locator(region).focus(); await page.keyboard.press('Space');
  assert.equal(await page.locator(region).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator(region).evaluate(el=>el === document.activeElement), true);
  assert.equal(await page.evaluate(()=>ui.regionTab), 'rg-seongsu');
  await go('reviews');
  const sort = page.locator('[data-action="sort-reviews"]').last();
  await sort.focus(); await page.keyboard.press('Space');
  assert.equal(await sort.getAttribute('aria-pressed'), 'true');
  assert.equal(await sort.evaluate(el=>el === document.activeElement), true);
  // At a boundary, focus moves to the reverse control on the same exhibition.
  await go('my');
  const original = await page.evaluate(()=>JSON.parse(JSON.stringify(state.plan)));
  await page.evaluate(()=>{state.plan={sat:['ex-01','ex-03'],sun:[]};render();});
  const up = '[data-action="move-plan"][data-id="ex-03"][data-direction="-1"]';
  const down = '[data-action="move-plan"][data-id="ex-03"][data-direction="1"]';
  await page.locator(up).focus(); await page.keyboard.press('Space');
  assert.equal(await page.locator(down).evaluate(el=>el === document.activeElement), true);
  assert.deepEqual(await page.evaluate(()=>state.plan.sat), ['ex-03','ex-01']);
  await page.keyboard.press('Space');
  assert.equal(await page.locator(up).evaluate(el=>el === document.activeElement), true);
  assert.deepEqual(await page.evaluate(()=>state.plan.sat), ['ex-01','ex-03']);
  await page.evaluate(plan=>{state.plan=plan;persist('plan');render();}, original);
};

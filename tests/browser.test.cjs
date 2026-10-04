const { chromium, webkit } = require('playwright');
const engine = process.env.BROWSER || 'chromium';
if (!['chromium', 'webkit'].includes(engine)) throw new Error('BROWSER must be chromium or webkit');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
const artifacts = process.env.TEST_ARTIFACT_DIR || '/tmp/weeklypick-v2-qa-' + engine;
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp'};
const server = http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
 if (!file.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
 fs.readFile(file,(e,data)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(data);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=(process.env.TEST_BASE_URL || 'http://127.0.0.1:'+server.address().port).replace(/\/$/,'');
 const browser=await ({chromium, webkit}[engine]).launch({headless:true});
 try {
 fs.mkdirSync(artifacts,{recursive:true});
 const page=await browser.newPage({viewport:{width:430,height:900}, ...(process.env.TEST_STORAGE_STATE ? {storageState:process.env.TEST_STORAGE_STATE} : {})});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const ready=()=>page.waitForFunction(()=>typeof currentRoute !== 'undefined' && currentRoute === location.hash.slice(1));
 const go=async route=>{await page.goto(base+'/#/'+route);await ready();await page.waitForSelector('main');};
 const shot=async name=>{await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(artifacts,name+'.png'),fullPage:true});};
 await go('saved');
 await page.locator('[data-action="assign"][data-id="ex-02"][data-day="sun"]').click();
 assert.equal(await page.evaluate(()=>plannedDay('ex-02')),'sun');
 await page.evaluate(()=>removeFromPlan('ex-02'));
 await go('my');
 await page.evaluate(()=>{assignToDay('ex-05','sat');assignToDay('ex-04','sat');render();});
 assert.equal((await page.locator('.timeline-total').textContent()).replace(/\s/g,''),'3시간55분');
 assert.equal(await page.locator('[data-action="visit"]').count(),0);
 await shot('planning');
 await page.locator('[data-action="move-plan"][data-id="ex-04"][data-direction="-1"]').click();
 assert.match(await page.locator('.day-slot__warning').innerText(),/반나절/);
 await page.locator('#start-sat').selectOption('15:00');
 assert.match(await page.locator('.timeline-end').innerText(),/19:15/);
 await page.reload();assert.equal(await page.locator('#start-sat').inputValue(),'15:00');
 await go('exhibition/ex-04');assert.equal(await page.locator('a[href="#/review/new/ex-04"]').count(),0);await shot('upcoming');
 await go('review/new/ex-04');assert.match(await page.locator('main').innerText(),/아직 시작 전/);
 await go('my');await page.locator('.demo-settings summary').click();await page.locator('[data-action="demo-date"][data-value="2026-09-14"]').click();
 await go('exhibition/ex-04');assert.match(await page.locator('.closed-notice').innerText(),/끝났어요/);
 await page.locator('[data-action="visit"]').click();assert.match(await page.locator('.visit-status').innerText(),/다녀온/);
 await go('exhibition/ex-02');assert.match(await page.locator('.detail-dday').innerText(),/오늘까지/);
 await go('review/new/ex-02');
 await page.locator('[data-action="set-rating"][data-value="5"]').click();
 await page.locator('#review-text').fill('흑백인데 골목 냄새가 나요. 40분이면 충분');
 await page.locator('[data-action="set-day"][data-value="토요일"]').click();
 await page.locator('[data-action="set-waiting"][data-value="no"]').click();
 await page.locator('[data-action="submit-review"]').click();await page.waitForURL(/#\/review\/rv-my-1$/);await ready();
 await page.reload();assert.match(await page.locator('.review-detail__text').innerText(),/골목/);
 await page.locator('a[href="#/review/edit/rv-my-1"]').click();await page.locator('#review-text').waitFor();
 assert.equal(await page.locator('.rating-input__star.is-on').count(),5);await shot('review-edit');
 await page.locator('#review-text').fill('수정한 후기');await page.locator('[data-action="set-rating"][data-value="4"]').click();
 await page.locator('[data-action="submit-review"]').click();await page.waitForURL(/#\/review\/rv-my-1$/);await ready();
 assert.equal(await page.locator('.review-detail__text').innerText(),'수정한 후기');
 await page.locator('[data-action="delete-review"]').click();assert.equal(await page.locator('[role="dialog"]').count(),1);
 await shot('review-delete');await page.locator('[data-action="modal-close"]').click();assert.equal(await page.locator('[role="dialog"]').count(),0);
 await page.locator('[data-action="delete-review"]').click();await page.locator('[data-action="modal-confirm"]').click();await page.waitForURL(/#\/reviews$/);await ready();
 assert.match(await page.locator('.result-summary').innerText(),/6개/);
 assert.equal(await page.evaluate(()=>!!state.visits['ex-02']),true);
 await page.locator('[data-action="toast-action"]').click();await page.waitForURL(/#\/review\/rv-my-1$/);await ready();
 assert.equal(await page.locator('.review-detail__text').innerText(),'수정한 후기');
 await require('./browser-review.cjs')(page, go, ready, shot);
 await go('review/rv-01');await page.locator('.review-detail__text').waitFor();assert.equal(await page.locator('[data-action="delete-review"]').count(),0);
 for(const width of [360,390,430]){
  await page.setViewportSize({width,height:900});
  for(const route of ['home','discover','saved','my','exhibition/ex-01','article/art-01','reviews','review/edit/rv-my-1','regions','archive']){
   await go(route);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,`${route} overflow at ${width}`);
  }
 }
 await go('discover');await page.locator('#search-input').fill('일치하지않는검색어');assert.match(await page.locator('.empty-state').innerText(),/없어요/);await shot('search-empty');
 await page.locator('[data-action="reset-filters"]').last().click();assert.equal(await page.locator('.ex-card').count(),10);
 await page.evaluate(()=>{state.saved=[];state.plan={sat:[],sun:[]};persist('saved');persist('plan');});
 await go('saved');assert.match(await page.locator('.empty-state').innerText(),/마음에 드는/);await shot('saved-empty');
 assert.deepEqual(errors,[]);
 console.log('PASS: timeline, date states, persistence, review create/edit/delete/undo, sample protection, draft exit and modal keyboard access, empty states, and 10 routes at 360/390/430px.');
 console.log('Browser:',engine,'Target:',base,'Screenshots:',artifacts);
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

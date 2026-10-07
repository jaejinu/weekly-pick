const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..'), engine=process.env.BROWSER||'chromium';
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(e,data)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await ({chromium,webkit}[engine]).launch();
 try{
 const context=await browser.newContext({viewport:{width:390,height:844}});let page=await context.newPage();const errors=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>{errors.push(e.message);console.error('Page error:',e.message);});
 let payload=null, revision=0, failSave=false, otpCount=0, deleteCount=0, failDelete=true;
 const user={id:'11111111-1111-4111-8111-111111111111',email:'test@example.com',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},created_at:new Date().toISOString()};
 await page.context().route('**/js/config.js',r=>r.fulfill({contentType:'text/javascript',body:`window.WEEKLY_PICK_CONFIG={supabaseUrl:'https://account-test.supabase.co',supabasePublishableKey:'test-key',testMode:true,turnstileSiteKey:'test-site-key'};`}));
 await page.context().route('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',r=>r.fulfill({contentType:'text/javascript',body:`window.turnstile={render(node,options){window.testCaptcha=options;return 'test-widget';},remove(){}};`}));
 await page.context().route('https://account-test.supabase.co/**',async route=>{
  const url=new URL(route.request().url());let body={},status=200;
  if(url.pathname.endsWith('/otp')){otpCount++;assert.equal(route.request().postDataJSON().gotrue_meta_security.captcha_token,'test-captcha-token');}
  else if(url.pathname.endsWith('/verify')||url.pathname.endsWith('/token'))body={access_token:'e30.e30.signature',refresh_token:'refresh',token_type:'bearer',expires_in:3600,user};
  else if(url.pathname.endsWith('/logout')){}
  else if(url.pathname.includes('/account_libraries'))body=payload?[{revision,payload}]:[];
  else if(url.pathname.endsWith('/list_public_reviews'))body=[];
  else if(url.pathname.endsWith('/delete_my_account')){deleteCount++;assert.deepEqual(route.request().postDataJSON(),{p_confirmation:'DELETE MY ACCOUNT'});if(failDelete){status=503;body={message:'offline'};}else{body=true;payload=null;revision=0;}}
  else if(url.pathname.endsWith('/save_library')){if(failSave){status=503;body={code:'NETWORK',message:'offline'};}else{const data=route.request().postDataJSON();assert.equal(data.p_revision,revision);payload=data.p_payload;body=++revision;}}
  else {status=400;body={message:'Unexpected mock endpoint '+url.pathname};}
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 });
 // Context is guidance only: canceled guest attempts must never write or carry stale copy.
 for(const scenario of [
  {route:'saved',selector:'[data-action="assign"]',title:'주말 계획을 바꾸려면 로그인해 주세요',next:'다시 진행'},
  {route:'exhibition/ex-09',selector:'[data-action="visit"]',title:'방문 기록을 남기려면 로그인해 주세요',next:'다녀왔어요'}
 ]){
  await page.goto(base+'/#/'+scenario.route);await page.waitForFunction(()=>account.phase==='guest');
  const before=await page.evaluate(()=>JSON.stringify(accountSnapshot()));
  await page.locator(scenario.selector).first().click();await page.waitForURL(/#\/account$/);
  assert.equal(await page.locator('#login-context-title').innerText(),scenario.title);
  assert.match(await page.locator('#login-context-title').locator('..').innerText(),new RegExp(scenario.next));
  assert.equal(await page.evaluate(()=>JSON.stringify(accountSnapshot())),before);assert.equal(payload,null);
  await page.locator('[data-action="account-cancel-login"]').click();
  await page.goto(base+'/#/account');await page.waitForFunction(()=>account.phase==='guest');
  assert.equal(await page.locator('#login-context-title').count(),0);
 }
 await page.goto(base+'/#/my');await page.waitForFunction(()=>account.phase==='guest');
 await page.locator('[data-action="account-login"]').click();await page.waitForURL(/#\/account$/);
 assert.equal(await page.locator('#login-context-title').innerText(),'로그인 후 보던 화면으로 돌아가요');
 await page.locator('[data-action="account-cancel-login"]').click();
 await page.goto(base+'/#/exhibition/ex-05');await page.waitForFunction(()=>account.phase==='guest');
 await page.locator('[data-action=toggle-save]').first().click();await page.waitForURL(/#\/account$/);
 assert.equal(await page.evaluate(()=>loginReturnStore.peek()),'#/exhibition/ex-05');
 assert.equal(await page.locator('#login-context-title').innerText(),'전시를 저장하려면 로그인해 주세요');
 await page.reload();await page.waitForFunction(()=>account.phase==='guest');
 assert.match(await page.locator('#login-context-title').locator('..').innerText(),/저장 버튼을 다시/);
 for(const width of [320,390,430]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}

 await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo(0,0);await new Promise(requestAnimationFrame);});
 await page.screenshot({path:'/tmp/weeklypick-auth-'+engine+'.png',fullPage:true});
 assert.equal(await page.locator('#account-email-error').innerText(),'');
 assert.match(await page.locator('#login-validation-status').innerText(),/이메일 주소.*개인정보.*보안 확인/);
 await page.locator('#account-email').focus();await page.locator('#account-email').blur();
 assert.match(await page.locator('#account-email-error').innerText(),/입력해/);
 await page.locator('#account-email').fill('wrong@');
 assert.equal(await page.locator('#account-email').getAttribute('aria-invalid'),'true');
 assert.match(await page.locator('#account-email-error').innerText(),/형식/);
 await page.locator('#account-login-form').evaluate(form=>form.requestSubmit());
 assert.equal(await page.evaluate(()=>document.activeElement.id),'account-email');assert.equal(otpCount,0);
 await page.locator('#account-email').fill('test@example.com');
 assert.equal(await page.locator('button[type=submit]').isDisabled(),true);
 assert.equal(await page.locator('#account-email').getAttribute('aria-invalid'),null);
 await page.locator('#account-login-form').evaluate(form=>form.requestSubmit());
 assert.equal(await page.evaluate(()=>document.activeElement.id),'account-consent');assert.equal(otpCount,0);
 await page.locator('#account-consent').check();
 assert.equal(await page.locator('button[type=submit]').isDisabled(),true);
 await page.waitForFunction(()=>window.testCaptcha);
 await page.evaluate(()=>window.testCaptcha.callback('test-captcha-token'));
 assert.match(await page.locator('#login-validation-status').innerText(),/모두 확인/);
 assert.equal(await page.locator('button[type=submit]').isDisabled(),false);
 await page.evaluate(()=>window.testCaptcha['expired-callback']());
 assert.equal(await page.locator('button[type=submit]').isDisabled(),true);assert.equal(otpCount,0);
 await page.evaluate(()=>window.testCaptcha.callback('test-captcha-token'));
 await page.locator('button[type=submit]').click();
 await page.getByText('메일함을 확인해 주세요.',{exact:false}).waitFor();assert.equal(otpCount,1);assert.equal(await page.locator('button[type=submit]').isDisabled(),true);
 await page.goto(base+'/?code=fake-test-code');await page.waitForFunction(()=>account.phase==='ready');
 await page.waitForURL(/#\/exhibition\/ex-05$/);
 assert.match(await page.locator('#toast-region').innerText(),/저장 버튼을 다시/);
 assert.equal(new URL(page.url()).search,'');assert.equal(await page.evaluate(()=>state.saved.length),0);assert.equal(payload,null);
 await page.goto(base+'/#/account');
 assert.equal(await page.getByText('이 브라우저의 기록 가져오기',{exact:true}).count(),1);
 await page.locator('[data-action=account-import]').click();await page.locator('[data-action=modal-confirm]').click();
 await page.waitForFunction(()=>account.phase==='ready'&&account.revision===1);assert.ok(payload.saved.length>0);
 await page.reload();await page.waitForFunction(()=>account.phase==='ready');assert.equal(await page.locator('[data-action=account-import]').count(),0);
 await page.goto(base+'/#/review/new/ex-01');await page.waitForFunction(()=>account.phase==='ready');
 await page.locator('[data-action="set-rating"][data-value="5"]').click();await page.locator('#review-text').fill('계정에 저장되는 후기');
 await page.locator('[data-action="set-day"][data-value="토요일"]').click();await page.locator('[data-action="set-waiting"][data-value="no"]').click();
 await page.locator('[data-action="submit-review"]').click();await page.waitForFunction(()=>account.phase==='ready'&&account.revision===2);
 assert.equal(payload.reviews[0].text,'계정에 저장되는 후기');assert.ok(payload.visits['ex-01']);
 await page.goto(base+'/#/exhibition/ex-05');await page.waitForFunction(()=>account.phase==='ready');
 failSave=true;await page.locator('[data-action=toggle-save]').first().click();await page.waitForFunction(()=>account.phase==='error');
 assert.ok(await page.evaluate(()=>account.pending));
 failSave=false;await page.goto(base+'/#/account');await page.waitForFunction(()=>account.phase==='error');
 await page.locator('[data-action=account-retry]').click();await page.waitForFunction(()=>account.phase==='ready'&&account.revision===3);
 await page.locator('[data-action=account-logout]').click();await page.waitForFunction(()=>account.phase==='guest');
 assert.equal(await page.locator('#account-email').count(),1);
 await page.goto(base+'/#/review/new/ex-01');await page.waitForFunction(()=>account.phase==='guest');assert.equal(await page.locator('#review-text').count(),0);
 await page.locator('[data-action=account-login]').click();await page.waitForURL(/#\/account$/);
 assert.equal(await page.locator('#login-context-title').innerText(),'후기를 남기려면 로그인해 주세요');
 assert.match(await page.locator('#login-context-title').locator('..').innerText(),/후기 작성 화면/);
 const previousTab=page;page=await previousTab.context().newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/?token_hash=second-test-token');await page.waitForFunction(()=>account.phase==='ready').catch(async e=>{console.error(await page.evaluate(()=>({phase:account.phase,message:account.message})));throw e;});
 await page.waitForURL(/#\/review\/new\/ex-01$/);assert.equal(revision,3);
 assert.match(await page.locator('#toast-region').innerText(),/후기 작성 화면/);
 assert.equal(await page.evaluate(()=>loginReturnStore.intent()),null);
 await previousTab.close();
 await page.goto(base+'/#/account');await page.waitForFunction(()=>account.phase==='ready');assert.equal(await page.locator('[data-action=account-import]').count(),0);
 await page.goto(base+'/#/account/delete');await page.waitForFunction(()=>currentRoute==='/account/delete'&&account.phase==='ready');
 await page.locator('[data-action=account-delete]').click();assert.equal(deleteCount,0);
 assert.equal(await page.evaluate(()=>document.activeElement.id),'delete-confirm');
 assert.match(await page.locator('#delete-confirm-error').innerText(),/체크/);
 await page.locator('#delete-confirm').check();
 assert.equal(await page.locator('#delete-confirm-error').innerText(),'');await page.locator('[data-action=account-delete]').click();
 await page.locator('[data-action=modal-close]').click();assert.equal(deleteCount,0);
 await page.locator('[data-action=account-delete]').click();await page.locator('[data-action=modal-confirm]').click();
 await page.waitForFunction(()=>account.phase==='error');assert.equal(deleteCount,1);assert.ok(payload);
 failDelete=false;
 await page.evaluate(id=>{
  localStorage.setItem(account.pendingKey(id),JSON.stringify({payload:accountSnapshot(),revision:account.revision}));
  sessionStorage.setItem('weeklypick.reviewDraft.'+id+'/ex-01/new','private draft');
  sessionStorage.setItem('weeklypick.reviewDraft.other/ex-01/new','other draft');
 },user.id);
 await page.locator('#delete-confirm').check();await page.locator('[data-action=account-delete]').click();await page.locator('[data-action=modal-confirm]').click();
 await page.waitForFunction(()=>account.phase==='guest'&&account.message.includes('탈퇴가 완료'));
 assert.equal(deleteCount,2);assert.equal(payload,null);
 assert.equal(await page.evaluate(id=>localStorage.getItem(account.pendingKey(id)),user.id),null);
 assert.equal(await page.evaluate(id=>sessionStorage.getItem('weeklypick.reviewDraft.'+id+'/ex-01/new'),user.id),null);
 assert.equal(await page.evaluate(()=>sessionStorage.getItem('weeklypick.reviewDraft.other/ex-01/new')),'other draft');
 assert.equal(await page.evaluate(()=>localStorage.getItem('weeklypick.auth')),null);
 assert.equal(await page.evaluate(id=>localStorage.getItem(account.importReceiptKey(id)),user.id),null);
 await page.goto(base+'/#/privacy');await page.getByRole('heading',{name:'개인정보 처리 안내',exact:true}).waitFor();
 assert.equal(await page.getByRole('link',{name:'dbwowls12345@naver.com'}).getAttribute('href'),'mailto:dbwowls12345@naver.com');
 await page.screenshot({path:'/tmp/weeklypick-privacy-'+engine+'.png',fullPage:true});
 for(const width of [360,390,430]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
 assert.deepEqual(errors,[]);console.log('PASS account ('+engine+'): email request, callback scrub, explicit import, save recovery across reload, logout, review gate, consent/captcha expiry, delete confirmation/failure/retry/cleanup, privacy, same/new-tab login return without replay, import receipt after reload');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});

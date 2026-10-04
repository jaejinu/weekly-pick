const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..'), engine=process.env.BROWSER||'chromium';
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(e,data)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await ({chromium,webkit}[engine]).launch();
 try{
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let payload=null, revision=0, failSave=false, otpCount=0;
 const user={id:'11111111-1111-4111-8111-111111111111',email:'test@example.com',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},created_at:new Date().toISOString()};
 await page.route('**/js/config.js',r=>r.fulfill({contentType:'text/javascript',body:`window.WEEKLY_PICK_CONFIG={supabaseUrl:'https://account-test.supabase.co',supabasePublishableKey:'test-key',testMode:true};`}));
 await page.route('https://account-test.supabase.co/**',async route=>{
  const url=new URL(route.request().url());let body={},status=200;
  if(url.pathname.endsWith('/otp'))otpCount++;
  else if(url.pathname.endsWith('/verify')||url.pathname.endsWith('/token'))body={access_token:'e30.e30.signature',refresh_token:'refresh',token_type:'bearer',expires_in:3600,user};
  else if(url.pathname.endsWith('/logout')){}
  else if(url.pathname.includes('/account_libraries'))body=payload?[{revision,payload}]:[];
  else if(url.pathname.includes('/member_reviews'))body=[];
  else if(url.pathname.endsWith('/save_library')){if(failSave){status=503;body={code:'NETWORK',message:'offline'};}else{const data=route.request().postDataJSON();assert.equal(data.p_revision,revision);payload=data.p_payload;body=++revision;}}
  else {status=400;body={message:'Unexpected mock endpoint '+url.pathname};}
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 });
 await page.goto(base+'/#/account');await page.waitForFunction(()=>account.phase==='guest');
 await page.screenshot({path:'/tmp/weeklypick-auth-'+engine+'.png',fullPage:true});
 await page.locator('#account-email').fill('test@example.com');await page.locator('button[type=submit]').click();
 await page.getByText('메일함을 확인해 주세요.',{exact:false}).waitFor();assert.equal(otpCount,1);assert.equal(await page.locator('button[type=submit]').isDisabled(),true);
 await page.goto(base+'/?code=fake-test-code');await page.waitForFunction(()=>account.phase==='ready');
 assert.equal(new URL(page.url()).search,'');assert.equal(await page.evaluate(()=>state.saved.length),0);
 assert.equal(await page.getByText('이 브라우저의 기록 가져오기',{exact:true}).count(),1);
 await page.locator('[data-action=account-import]').click();await page.locator('[data-action=modal-confirm]').click();
 await page.waitForFunction(()=>account.phase==='ready'&&account.revision===1);assert.ok(payload.saved.length>0);
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
 assert.deepEqual(errors,[]);console.log('PASS account ('+engine+'): email request, callback scrub, explicit import, save recovery across reload, logout, review gate');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});

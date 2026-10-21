const assert=require('node:assert/strict');
module.exports=async function checkSyncRecovery(browser,base,engine){
 const context=await browser.newContext({viewport:{width:390,height:844}});
 try{
  const page=await context.newPage();page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let library={saved:['ex-01'],plan:{sat:[],sun:[]},reviews:[],visits:{},dayStartTime:{sat:'11:00',sun:'11:00'},nextReviewSeq:1};
  let revision=1,failSave=false,failLoad=false,writes=0;
  const user={id:'22222222-2222-4222-8222-222222222222',email:'sync@example.com',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},created_at:new Date().toISOString()};
  await context.route('**/js/config.js',r=>r.fulfill({contentType:'text/javascript',body:"window.WEEKLY_PICK_CONFIG={supabaseUrl:'https://sync-test.supabase.co',supabasePublishableKey:'test-key'};"}));
  await context.route('https://sync-test.supabase.co/**',async route=>{
   const url=new URL(route.request().url());let body={},status=200;
   if((url.pathname.endsWith('/token')||url.pathname.endsWith('/verify')))body={access_token:'e30.e30.signature',refresh_token:'refresh',token_type:'bearer',expires_in:3600,user};
   else if(url.pathname.includes('/account_libraries')){if(failLoad){status=503;body={message:'offline'};}else body=[{revision,payload:library}];}
   else if(url.pathname.endsWith('/list_public_reviews'))body=[];
   else if(url.pathname.endsWith('/save_library')){
    writes++;const data=route.request().postDataJSON();
    if(failSave){status=503;body={code:'NETWORK'};}
    else if(data.p_revision!==revision){status=409;body={code:'40001'};}
    else{library=data.p_payload;body=++revision;}
   }else if(!url.pathname.endsWith('/logout')){status=400;body={message:'Unexpected endpoint'};}
   await route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  });
  const go=async route=>{await page.goto(base+'/#/'+route);await page.waitForFunction(route=>currentRoute==='/'+route&&['ready','error','conflict'].includes(account.phase),route);};
  await page.goto(base+'/?token_hash=fake-sync-token');await page.waitForFunction(()=>account.phase==='ready').catch(async error=>{console.error(await page.evaluate(()=>({phase:account.phase,message:account.message})));throw error;});
  await go('exhibition/ex-05');failSave=true;
  await page.locator('[data-action="toggle-save"][data-id="ex-05"]').first().click();await page.waitForFunction(()=>account.phase==='error');
  await go('account');assert.match(await page.locator('.account-screen').innerText(),/이 브라우저에 보관/);
  const pending=await page.evaluate(()=>JSON.stringify(account.pending));
  failLoad=true;await page.reload();await page.waitForFunction(()=>account.phase==='error');
  assert.equal(await page.evaluate(()=>JSON.stringify(account.pending)),pending);
  assert.equal(await page.evaluate(()=>state.saved.includes('ex-05')),true,JSON.stringify(await page.evaluate(()=>({saved:state.saved,pending:account.pending,message:account.message}))));
  failLoad=false;failSave=false;await page.locator('[data-action="account-retry"]').click();await page.waitForFunction(()=>account.phase==='ready');
  assert.ok(library.saved.includes('ex-05'));assert.equal(await page.evaluate(()=>account.pending),null);
  // A second device changes the revision before this tab saves.
  await go('exhibition/ex-06');library={...library,saved:['ex-01','ex-03']};revision++;
  await page.locator('[data-action="toggle-save"][data-id="ex-06"]').first().click();await page.waitForFunction(()=>account.phase==='conflict');
  await page.locator('#account-status a').click();await page.waitForURL(/#\/account$/);
  assert.equal(await page.locator('#toast-region').innerText(),'');
  assert.equal(await page.locator('[data-action="account-retry"]').count(),0);
  assert.match(await page.locator('#sync-recovery-title').innerText(),/다른 기기/);
  const conflicted=await page.evaluate(()=>JSON.stringify(account.pending));const writesBefore=writes;
  for(const width of [320,390,430]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'/tmp/weeklypick-sync-conflict-'+engine+'.png',fullPage:true});
  await page.locator('[data-action="account-reload"]').click();await page.locator('[data-action="modal-close"]').click();
  assert.equal(await page.evaluate(()=>JSON.stringify(account.pending)),conflicted);
  failLoad=true;await page.locator('[data-action="account-reload"]').click();await page.locator('[data-action="modal-confirm"]').click();
  await page.waitForFunction(()=>account.phase==='conflict'&&account.message.includes('불러오지 못'));
  assert.equal(await page.evaluate(()=>JSON.stringify(account.pending)),conflicted);assert.equal(writes,writesBefore);
  assert.equal(await page.evaluate(()=>state.saved.includes('ex-06')),true);
  failLoad=false;await page.locator('[data-action="account-reload"]').click();await page.locator('[data-action="modal-confirm"]').click();
  await page.waitForFunction(()=>account.phase==='ready');assert.deepEqual(await page.evaluate(()=>state.saved),library.saved);
  assert.equal(await page.evaluate(()=>account.pending),null);assert.equal(writes,writesBefore);
  // Simulate quota/privacy failure without blocking authentication storage.
  await go('exhibition/ex-05');
  await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.startsWith('weeklypick.account.'))throw new Error('quota');return original.call(this,key,value);};});
  failSave=true;await page.locator('[data-action="toggle-save"][data-id="ex-05"]').first().click();await page.waitForFunction(()=>account.phase==='error');
  await page.locator('#account-status a').click();await page.waitForURL(/#\/account$/);
  assert.match(await page.locator('.account-screen').innerText(),/현재 탭에만/);
  await page.locator('[data-action="account-logout"]').click();await page.locator('[role="dialog"]').waitFor();
  assert.match(await page.locator('[role="dialog"]').innerText(),/잃게 돼요/);
  await page.locator('[data-action="modal-close"]').click();assert.equal(await page.evaluate(()=>!!account.pending),true);
  failSave=false;await page.locator('[data-action="account-retry"]').click();await page.waitForFunction(()=>account.phase==='ready');
  assert.equal(await page.evaluate(()=>account.pending),null);assert.ok(library.saved.includes('ex-05'));assert.deepEqual(errors,[]);
  console.log('PASS sync recovery ('+engine+'): failed load preserves edits, retry, conflict cancel/failure/success, no overwrite, memory-only warning and logout guard.');
 }finally{await context.close();}
};

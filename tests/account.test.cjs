const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function app(){
 const storage=new Map();
 const context=vm.createContext({localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},window:{WEEKLY_PICK_CONFIG:null,addEventListener(){}},document:{getElementById:()=>null},location:{hash:"#/account",replace(route){this.hash=route;}},queueMicrotask,URL,Date,setTimeout,ui:{draft:null},saveReviewDraft(){},hideToast(){},render(){},showToast(){}});
 vm.runInContext(['data','state','form-validation','account-data','account-navigation','account'].map(n=>fs.readFileSync('js/'+n+'.js','utf8')).join('\n')+'\nloadState();',context);
 return {run:code=>vm.runInContext(code,context),json:code=>JSON.parse(JSON.stringify(vm.runInContext(code,context))),storage};
}
test('guest import preserves account choices and allocates unique review IDs',()=>{
 const a=app();a.run(`globalThis.remote=emptyAccountLibrary();remote.saved=['ex-01'];remote.plan.sun=['ex-01'];remote.reviews=[{id:'rv-my-1',exhibitionId:'ex-01',rating:5,text:'서버',day:'평일',waiting:false,createdAt:'2026-10-05',order:1}];remote.visits={'ex-01':'2026-10-05'};remote.nextReviewSeq=2;
 globalThis.guest=emptyAccountLibrary();guest.saved=['ex-01','ex-02'];guest.plan.sat=['ex-01','ex-02'];guest.reviews=[{id:'rv-my-1',exhibitionId:'ex-01',rating:4,text:'로컬',day:'평일',waiting:false,createdAt:'2026-10-04',order:1},{id:'rv-my-2',exhibitionId:'ex-02',rating:5,text:'추가',day:'평일',waiting:false,createdAt:'2026-10-04',order:2}];guest.nextReviewSeq=3;globalThis.merged=mergeGuestLibrary(remote,guest);`);
 assert.deepEqual(a.json('merged.plan'),{sat:['ex-02'],sun:['ex-01']});
 assert.deepEqual(a.json('merged.reviews.map(r=>[r.id,r.text])'),[['rv-my-2','추가'],['rv-my-1','서버']]);
 assert.equal(a.run('merged.visits["ex-01"]'),'2026-10-05');
 assert.equal(a.run('sameAccountLibrary(merged,mergeGuestLibrary(merged,guest))'),true);
});
test('an old account response cannot leak into the next account',async()=>{
 const a=app();a.run(`account.enabled=true;account.guest=emptyAccountLibrary();globalThis.resolveOld=null;account.loadFeed=async()=>{};account.client={from:()=>({select(){return this},eq(){return this},maybeSingle(){return new Promise(resolve=>{resolveOld=resolve;})}})};globalThis.oldRequest=account.switchUser({id:'first'});`);
 await a.run('account.switchUser(null)');
 a.run(`resolveOld({data:{revision:7,payload:{...emptyAccountLibrary(),saved:['ex-01']}},error:null})`);await a.run('oldRequest');
 assert.equal(a.run('account.user'),null);assert.deepEqual(a.json('state.saved'),[]);
});
test('failed writes are retained per owner, retry succeeds, conflicts stay explicit',async()=>{
 const a=app();a.run(`account.enabled=true;account.user={id:'owner'};account.phase='ready';account.loadFeed=async()=>{};account.client={rpc:async()=>({error:{code:'NETWORK'}})};`);
 await a.run('account.save(emptyAccountLibrary(),0)');
 assert.equal(a.run('account.phase'),'error');assert.ok(a.storage.has('weeklypick.account.owner.vol-01.pending'));
 a.run(`account.client.rpc=async()=>({error:null,data:1})`);await a.run('account.retry()');
 assert.equal(a.run('account.phase'),'ready');assert.equal(a.run('account.revision'),1);assert.equal(a.storage.has('weeklypick.account.owner.vol-01.pending'),false);
 a.run(`account.client.rpc=async()=>({error:{code:'40001'}})`);await a.run('account.save(emptyAccountLibrary(),1)');
 assert.equal(a.run('account.phase'),'conflict');assert.ok(a.run('account.pending'));
});
test('remote reload discards pending even when storage removal is unavailable',async()=>{
 const a=app();a.run(`account.enabled=true;account.user={id:'owner'};account.guest=emptyAccountLibrary();account.loadFeed=async()=>{};localStorage.setItem(account.pendingKey('owner'),JSON.stringify({revision:0,payload:{...emptyAccountLibrary(),saved:['ex-02']}}));localStorage.removeItem=()=>{throw Error('blocked')};account.client={from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:{revision:1,payload:{...emptyAccountLibrary(),saved:['ex-01']}}})})};`);
 await a.run('account.reloadRemote()');assert.deepEqual(a.json('state.saved'),['ex-01']);assert.equal(a.run('account.phase'),'ready');
});

test('login return accepts only internal routes, expires, and is consumed across tabs',()=>{
 const a=app();a.run(`globalThis.now=1000;globalThis.first=createLoginReturnStore(()=>localStorage,()=>now);globalThis.second=createLoginReturnStore(()=>localStorage,()=>now);`);
 for(const route of ['https://evil.example/','#//evil.example','#/account/delete','#/review/edit/rv-my-1','#/exhibition/ex-99','#/home#https://evil.example','#/discover?token_hash=private','#/regions?rg=unknown']){
  a.run(`first.remember(${JSON.stringify(route)})`);assert.equal(a.run('first.peek()'),null);
 }
 a.run(`first.remember('#/regions?rg=rg-seongsu');`);
 assert.equal(a.run('second.take()'),'#/regions?rg=rg-seongsu');assert.equal(a.run('first.peek()'),null);
 a.run(`first.remember('#/review/new/ex-01');now+=31*60*1000;`);assert.equal(a.run('first.peek()'),null);
 a.run(`localStorage.setItem=()=>{throw Error('blocked')};first.remember('#/saved');`);assert.equal(a.run('first.take()'),'#/saved');
});
test('return waits for successful account load and never replays a write',()=>{
 const a=app();a.run(`loginReturnStore.remember('#/exhibition/ex-01');account.resumeAfterLogin=true;account.user={id:'owner'};account.phase='conflict';account.finishLoginReturn();`);
 assert.equal(a.run('location.hash'),'#/account');assert.equal(a.run('account.resumeAfterLogin'),true);
 a.run(`account.phase='ready';account.finishLoginReturn();`);assert.equal(a.run('location.hash'),'#/exhibition/ex-01');assert.equal(a.run('loginReturnStore.peek()'),null);
});
test('guest import prompt reflects additions and receipts are owner-specific',()=>{
 const a=app();a.run(`account.user={id:'first'};account.guest={...emptyAccountLibrary(),saved:['ex-01']};applyAccountLibrary(emptyAccountLibrary());`);
 assert.equal(a.run('account.hasGuestImport()'),true);
 a.run(`applyAccountLibrary(mergeGuestLibrary(accountSnapshot(),account.guest));`);assert.equal(a.run('account.hasGuestImport()'),false);
 a.run(`account.rememberImport('first',accountLibraryFingerprint(account.guest));applyAccountLibrary(emptyAccountLibrary());`);assert.equal(a.run('account.hasGuestImport()'),false);
 a.run(`account.user={id:'second'};`);assert.equal(a.run('account.hasGuestImport()'),true);
 a.run(`account.user={id:'first'};account.guest.saved.push('ex-02');`);assert.equal(a.run('account.hasGuestImport()'),true);
});
test('failed import is acknowledged only after successful save retry',async()=>{
 const a=app();a.run(`account.enabled=true;account.user={id:'owner'};account.phase='ready';account.guest={...emptyAccountLibrary(),saved:['ex-01']};applyAccountLibrary(emptyAccountLibrary());account.loadFeed=async()=>{};account.client={rpc:async()=>({error:{code:'NETWORK'}})};`);
 await a.run('account.importGuest()');assert.equal(a.storage.has('weeklypick.imported.owner.vol-01'),false);
 a.run(`account.client.rpc=async()=>({data:1,error:null});`);await a.run('account.retry()');assert.equal(a.storage.has('weeklypick.imported.owner.vol-01'),true);
});

test('existing server records backfill import receipts without a new write',async()=>{
 const a=app();a.run(`account.enabled=true;account.guest={...emptyAccountLibrary(),saved:['ex-01']};account.loadFeed=async()=>{};account.client={from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:{revision:1,payload:account.guest}})})};`);
 await a.run("account.switchUser({id:'owner'})");
 assert.equal(a.storage.has('weeklypick.imported.owner.vol-01'),true);
 a.run('applyAccountLibrary(emptyAccountLibrary())');assert.equal(a.run('account.hasGuestImport()'),false);
});

test('login guidance survives tabs, rejects unknown intent and clears with its route',()=>{
 const a=app();a.run(`globalThis.now=1000;globalThis.first=createLoginReturnStore(()=>localStorage,()=>now);globalThis.second=createLoginReturnStore(()=>localStorage,()=>now);first.remember('#/saved','plan');`);
 assert.equal(a.run('second.intent()'),'plan');assert.equal(a.run('second.take()'),'#/saved');assert.equal(a.run('first.intent()'),null);
 for(const intent of ['__proto__','constructor','<script>',{action:'save'}]){
  a.run(`first.remember('#/saved',${JSON.stringify(intent)})`);assert.equal(a.run('second.intent()'),null);assert.equal(a.run('second.peek()'),'#/saved');
 }
 a.run(`first.remember('#/discover','save');now+=31*60*1000;`);assert.equal(a.run('first.intent()'),null);assert.equal(a.run('first.peek()'),null);
 a.run(`localStorage.setItem('weeklypick.loginReturn',JSON.stringify({route:'#/my',at:now}));`);assert.equal(a.run('second.intent()'),null);assert.equal(a.run('second.take()'),'#/my');
 a.run(`localStorage.setItem=()=>{throw Error('blocked')};first.remember('#/review/new/ex-01','review');`);assert.equal(a.run('first.intent()'),'review');
});
test('guest actions provide guidance without changing the library',()=>{
 for(const [action,intent] of [['toggle-save','save'],['assign','plan'],['start-time','plan'],['visit','visit'],['submit-review','review']]){
  const a=app();const before=a.json('accountSnapshot()');a.run(`account.enabled=true;location.hash='#/exhibition/ex-01';`);
  assert.equal(a.run(`account.allowMutation('${action}')`),false);assert.equal(a.run('loginReturnStore.intent()'),intent);
  assert.equal(a.run('location.hash'),'#/account');assert.deepEqual(a.json('accountSnapshot()'),before);
 }
});

test('email validation rejects empty, malformed and oversized addresses before API calls',async()=>{
 const a=app();
 for(const email of ['', '   ', 'name', 'name@', 'name@host', 'a b@example.com', 'a@example..com', 'a'.repeat(250)+'@example.com'])assert.ok(a.run(`emailValidationMessage(${JSON.stringify(email)})`));
 for(const email of ['name@example.com',' name+tag@sub.example.co.kr '])assert.equal(a.run(`emailValidationMessage(${JSON.stringify(email)})`),'');
 a.run(`globalThis.calls=0;account.client={auth:{signInWithOtp:async()=>{calls++;return {}}}};`);
 await a.run("account.sendLink('bad-email')");assert.equal(a.run('calls'),0);
});
test('review validation names missing fields and handles whitespace and the 80 character boundary',()=>{
 const a=app();
 assert.deepEqual(a.json("Object.keys(reviewValidationErrors({rating:0,text:'   ',day:'',waiting:null}))"),['rating','text','day','waiting']);
 assert.deepEqual(a.json("reviewValidationErrors({rating:5,text:'가'.repeat(80),day:'평일',waiting:'no'})"),{});
 assert.deepEqual(a.json("Object.keys(reviewValidationErrors({rating:5,text:'가'.repeat(81),day:'평일',waiting:'no'}))"),['text']);
});

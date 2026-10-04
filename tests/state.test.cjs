const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = ['js/data.js', 'js/state.js'].map(p => fs.readFileSync(p, 'utf8')).join('\n');
function app(seed = {}) {
  const storage = new Map(Object.entries(seed).map(([k,v]) => ['weeklypick.' + k, JSON.stringify({v:1,data:v})]));
  const context = vm.createContext({ localStorage: {getItem:k=>storage.get(k) ?? null,setItem:(k,v)=>storage.set(k,v)} });
  vm.runInContext(source + '\nloadState();', context);
  return {run: code => JSON.parse(JSON.stringify(vm.runInContext(code, context))), storage};
}
test('all 10 symmetric region pairs include same-region travel', () => {
  const a=app(); assert.equal(a.run('TRAVEL_PAIRS.length'),10);
  assert.equal(a.run('REGIONS.every(a=>REGIONS.every(b=>getTravelMinutes(a.id,b.id)>0 && getTravelMinutes(a.id,b.id)===getTravelMinutes(b.id,a.id)))'),true);
});
test('planning totals include travel, change order and start time', () => {
  const a=app(); a.run("assignToDay('ex-05','sat');assignToDay('ex-04','sat')");
  assert.deepEqual(a.run("calculateTotalDuration('sat')"),{view:195,travel:40,total:235,end:895});
  a.run("movePlan('ex-04',-1)"); assert.equal(a.run("dayTotalMinutes('sat')"),255);
  assert.equal(a.run("isOverLimit('sat')"),true);
  a.run("setDayStartTime('sat','15:00')"); assert.equal(a.run("calculateTotalDuration('sat').end"),1155);
  assert.equal(a.run("setDayStartTime('sat','15:30')"),false);
  assert.equal(a.run("movePlan('ex-01',-1)"),false);
});
test('date transitions distinguish issue badges, upcoming, today and ended', () => {
 const a=app(); assert.equal(a.run("getRuntimeStatus(getExhibition('ex-04'))"),'upcoming');
 assert.equal(a.run("canWriteReview(getExhibition('ex-04'))"),false);
 assert.equal(a.run("assignToDay('ex-04','sun')"),true);
 a.run("setCurrentDate('2026-09-14')");
 assert.equal(a.run("getRuntimeStatus(getExhibition('ex-04'))"),'ended');
 assert.deepEqual(a.run("badgesOf(getExhibition('ex-04'))"),[]);
 assert.equal(a.run("getDaysUntilEnd(getExhibition('ex-05'))"),0);
 assert.equal(a.run("markVisited('ex-04')"),true);
 assert.equal(a.run("assignToDay('ex-04','sat')"),false);
});
test('review edit/delete/undo preserves visits and sample reviews; sequence never reused', () => {
 const a=app(); const input="{exhibitionId:'ex-01',rating:5,text:'좋아요',day:'토요일',waiting:false}";
 const r=a.run('addReview('+input+')'); assert.equal(r.id,'rv-my-1');
 assert.equal(a.run("!!state.visits['ex-01']"),true);
 assert.equal(a.run('addReview('+input+')'),null);
 assert.equal(a.run("updateReview('rv-01',"+input+")"),false);
 a.run("updateReview('rv-my-1',{rating:4,text:'수정',day:'일요일',waiting:true})");
 assert.equal(a.run("getReview('rv-my-1').text"),'수정');
 a.run("globalThis.snapshot=deleteReview('rv-my-1')");
 assert.equal(a.run("allReviews().length"),6); assert.equal(a.run("!!state.visits['ex-01']"),true);
 assert.equal(a.run('restoreReview(snapshot)'),true); assert.equal(a.run('restoreReview(snapshot)'),false);
 a.run("deleteReview('rv-my-1')");assert.equal(a.run('addReview('+input+').id'),'rv-my-2');
});
test('V1 reviews migrate once and preserve order after reload', () => {
 const a=app({reviews:[{id:'rv-my-2-ex-02',exhibitionId:'ex-02',rating:5,text:'새 후기',day:'토요일',waiting:false,order:2},{id:'rv-my-1-ex-01',exhibitionId:'ex-01',rating:4,text:'옛 후기',day:'일요일',waiting:true,order:1}]});
 assert.deepEqual(a.run('state.reviews.map(r=>r.id)'),['rv-my-2','rv-my-1']);
 assert.equal(a.run("Object.keys(state.visits).length"),2);
 a.run('loadState();true'); assert.deepEqual(a.run('state.reviews.map(r=>r.id)'),['rv-my-2','rv-my-1']);
 assert.equal(a.run('state.nextReviewSeq'),3);
});
test('invalid submissions and future exhibitions cannot create visits/reviews', () => {
 const a=app(); assert.equal(a.run("addReview({exhibitionId:'ex-04',rating:5,text:'안됨',day:'토요일',waiting:false})"),null);
 assert.equal(a.run("addReview({exhibitionId:'ex-01',rating:2.5,text:'안됨',day:'토요일',waiting:false})"),null);
 assert.equal(a.run("markVisited('unknown')"),false);
 assert.equal(a.run("assignToDay('ex-01','bad')"),false);
 assert.equal(a.run('state.reviews.length'),0);
});
test('plan migration deduplicates and restores saved invariant', () => {
 const a=app({saved:[],plan:{sat:['ex-01','ex-01'],sun:['ex-01','ex-02','bad']}});
 assert.deepEqual(a.run('state.plan'),{sat:['ex-01'],sun:['ex-02']});
 assert.deepEqual(a.run('state.saved'),['ex-01','ex-02']);
});
test('all article totals use the same travel model', () => {
 const a=app();assert.deepEqual(a.run('ARTICLES.map(articleMoveMinutes)'),[35,65,20]);
 assert.deepEqual(a.run("articleStops(ARTICLES[0]).map(s=>s.time)"),['11:00','12:40','13:50']);
});
test('undo restores only its target and retains intervening plan changes', () => {
 const a=app();a.run("globalThis.savedUndo=removeSaved('ex-01');assignToDay('ex-05','sun');restoreSaved('ex-01',savedUndo);true");
 assert.deepEqual(a.run('state.plan'),{sat:['ex-01'],sun:['ex-05']});
 a.run("globalThis.planUndo=removeFromPlan('ex-01');assignToDay('ex-01','sun')");
 assert.equal(a.run("restoreToPlan('ex-01',planUndo)"),false);
 assert.deepEqual(a.run('state.plan'),{sat:[],sun:['ex-05','ex-01']});
});
test('corrupt storage recovers while unavailable storage keeps the app usable', () => {
 const a=app();a.storage.set('weeklypick.saved','broken');a.run('loadState();true');
 assert.equal(a.run('state.recovered'),true);
 const c=vm.createContext({localStorage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}}});
 vm.runInContext(source+'\nloadState();assignToDay("ex-02","sun");',c);
 assert.equal(vm.runInContext('plannedDay("ex-02")',c),'sun');
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync('js/drafts.js', 'utf8'), context);
const create = context.createReviewDraftStore;
const initial = {rating:0,text:'',day:'',waiting:null};
const values = {rating:4,text:'쓰던 후기',day:'평일',waiting:'no'};
function storage() {
  const data = new Map();
  return {data,getItem:key=>data.get(key) || null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};
}
const plain = value => JSON.parse(JSON.stringify(value));
test('draft survives a new store instance and is isolated by exhibition/review', () => {
  const disk = storage();
  create(()=>disk).write('ex-01/new', values, initial);
  const reopened = create(()=>disk);
  assert.deepEqual(plain(reopened.read('ex-01/new', initial)), values);
  assert.equal(reopened.read('ex-02/new', initial), null);
  assert.equal(reopened.read('ex-01/rv-my-1', initial), null);
});
test('discard and reverting all fields remove the persisted draft', () => {
  const disk = storage(), store = create(()=>disk);
  store.write('one', values, initial); store.clear('one');
  assert.equal(create(()=>disk).read('one', initial), null);
  store.write('one', values, initial); store.write('one', initial, initial);
  assert.equal(create(()=>disk).read('one', initial), null);
});
test('changed original, invalid data and corrupt JSON do not restore stale drafts', () => {
  const disk = storage();
  create(()=>disk).write('one', values, initial);
  assert.equal(create(()=>disk).read('one', {...initial, text:'새 원문'}), null);
  for (const raw of ['{broken', JSON.stringify({v:1,initial,values:{...values,rating:9}}), JSON.stringify({v:2,initial,values})]) {
    disk.setItem('weeklypick.reviewDraft.one', raw);
    assert.equal(create(()=>disk).read('one', initial), null);
    assert.equal(disk.getItem('weeklypick.reviewDraft.one'), null);
  }
});
test('blocked storage retains draft in memory and reports persistence failure', () => {
  const store = create(()=>{throw Error('blocked');});
  assert.equal(store.write('one', values, initial), false);
  assert.deepEqual(plain(store.read('one', initial)), values);
  store.clear('one'); assert.equal(store.read('one', initial), null);
});

test('restoration only returns editable fields from storage', () => {
  const disk = storage();
  disk.setItem('weeklypick.reviewDraft.one', JSON.stringify({v:1,initial,values:{...values,editId:'another-review',initial:values}}));
  assert.deepEqual(plain(create(()=>disk).read('one', initial)), values);
});

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {PGlite}=require('@electric-sql/pglite');
const first='11111111-1111-4111-8111-111111111111',second='22222222-2222-4222-8222-222222222222';
const payload={saved:['ex-01'],plan:{sat:['ex-01'],sun:[]},reviews:[{id:'rv-my-1',exhibitionId:'ex-01',rating:5,text:'계정 후기',day:'평일',waiting:false,createdAt:'2026-10-05',order:1}],visits:{'ex-01':'2026-10-05'},dayStartTime:{sat:'11:00',sun:'11:00'},nextReviewSeq:2};
test('database enforces account isolation, validated writes, conflicts, and public review ownership',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); grant usage on schema public,auth to anon,authenticated; create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$; insert into auth.users values('${first}'),('${second}');`);
  for(const file of fs.readdirSync('supabase/migrations').sort())await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
  const actor=async(id,role='authenticated')=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id||'']);await db.exec('set role '+role);};
  const save=(revision,body=payload)=>db.query("select public.save_library('vol-01',$1,$2::jsonb) as revision",[revision,JSON.stringify(body)]);
  await actor(first);
  assert.equal((await save(0)).rows[0].revision,1);
  await assert.rejects(save(0),/REVISION_CONFLICT/);
  await assert.rejects(db.query("update public.account_libraries set revision=99"),/permission denied/);
  await assert.rejects(db.query("delete from public.member_reviews"),/permission denied/);
  await actor(second);
  assert.equal((await db.query('select * from public.account_libraries')).rows.length,0);
  assert.equal((await db.query('select * from public.list_public_reviews()')).rows.length,1);
  const own={...payload,reviews:[{...payload.reviews[0],text:'다른 계정'}]};
  await save(0,own);
  assert.equal((await db.query('select * from public.list_public_reviews()')).rows.length,2);
  await actor(first);
  await save(1,{...payload,reviews:[]});
  assert.equal((await db.query('select body from public.list_public_reviews()')).rows[0].body,'다른 계정');
  assert.equal((await db.query('select payload from public.account_libraries')).rows[0].payload.visits['ex-01'],'2026-10-05');
  for(const invalid of [{...payload,nextReviewSeq:1},{...payload,plan:{sat:['ex-02'],sun:[]}},{...payload,reviews:[{...payload.reviews[0],text:'가'.repeat(81)}]},{...payload,reviews:[{...payload.reviews[0],day:null}]},{...payload,visits:{'ex-01':null}},{...payload,user_id:second}]) {
    await assert.rejects(save(2,invalid),/INVALID_LIBRARY/);
  }
  await actor(second);
  const feed=(await db.query('select * from public.list_public_reviews()')).rows;
  assert.equal(feed[0].is_own,true);
  assert.equal('user_id' in feed[0],false);
  assert.equal('local_id' in feed[0],false);
  await assert.rejects(db.query('select user_id from public.member_reviews'),/permission denied/);
  await assert.rejects(db.query("select public.delete_my_account('')"),/CONFIRMATION_REQUIRED/);
  await actor(null,'anon');
  await assert.rejects(db.query('select * from public.account_libraries'),/permission denied/);
  await assert.rejects(save(0),/permission denied/);
  assert.equal((await db.query('select body from public.list_public_reviews()')).rows[0].body,'다른 계정');
  assert.equal((await db.query('select is_own from public.list_public_reviews()')).rows[0].is_own,false);
  await assert.rejects(db.query('select user_id from public.member_reviews'),/permission denied/);
  await assert.rejects(db.query("select public.delete_my_account('DELETE MY ACCOUNT')"),/permission denied/);
  await actor(first);
  await db.query("select public.delete_my_account('DELETE MY ACCOUNT')");
  assert.equal((await db.query('select * from public.account_libraries')).rows.length,0);
  // A still-unexpired token cannot resurrect a deleted account's data.
  await assert.rejects(save(0),/foreign key constraint/);
  await db.exec('reset role');
  assert.deepEqual((await db.query('select id from auth.users')).rows,[{id:second}]);
  assert.equal((await db.query('select count(*)::int as n from public.member_reviews')).rows[0].n,1);
  await actor(second);
  await db.query("select public.delete_my_account('DELETE MY ACCOUNT')");
  assert.equal((await db.query('select * from public.list_public_reviews()')).rows.length,0);
  await db.exec('reset role');
  assert.equal((await db.query('select count(*)::int as n from public.account_libraries')).rows[0].n,0);
 }finally{await db.close();}
});

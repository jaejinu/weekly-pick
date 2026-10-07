/* Real Supabase Auth + account storage. Empty config keeps the existing local demo. */
const account = {
  enabled: !!(window.WEEKLY_PICK_CONFIG && WEEKLY_PICK_CONFIG.supabaseUrl && WEEKLY_PICK_CONFIG.supabasePublishableKey),
  client:null, user:null, phase:'boot', revision:0, generation:0, pending:null, guest:null,
  publicReviews:[], feedError:false, email:'', mailSending:false, mailSent:false, message:'', cooldownUntil:0,
  importDismissed:false, initialized:false, resumeAfterLogin:false,
  pendingKey: function(id){return 'weeklypick.account.'+id+'.'+ISSUE.id+'.pending';},
  beginLogin: function(intent){
    loginReturnStore.remember(location.hash||'#/home',intent);
    this.message='';
    loginValidation.reset();
    location.hash='#/account';
  },
  finishLoginReturn: function(){
    if(!this.resumeAfterLogin||!this.user||this.phase!=='ready')return;
    this.resumeAfterLogin=false;
    const intent=loginReturnStore.intent();
    const route=loginReturnStore.take();
    if(route && location.hash==='#/account'){location.replace(route);showToast(intent ? '로그인했어요. '+LOGIN_GUIDANCE[intent].next.replace('로그인 후 ','') : '로그인했어요. 보던 화면에서 계속해 주세요.');}
  },
  importReceiptKey: function(id){return 'weeklypick.imported.'+id+'.'+ISSUE.id;},
  rememberImport: function(id,fingerprint){
    if(typeof fingerprint!=='string')return;
    try{localStorage.setItem(this.importReceiptKey(id),fingerprint);}catch(error){}
  },
  hasGuestImport: function(){
    if(!this.user||!this.guest||this.importDismissed)return false;
    try{
      if(localStorage.getItem(this.importReceiptKey(this.user.id))===accountLibraryFingerprint(this.guest))return false;
    }catch(error){}
    try{return !sameAccountLibrary(accountSnapshot(),mergeGuestLibrary(accountSnapshot(),this.guest));}catch(error){return false;}
  },
  refreshUI: function(){
    const status=document.getElementById('account-status');
    if(status) status.innerHTML=this.enabled && ['boot','loading','saving','error','conflict'].includes(this.phase)
      ? '<div class="account-status"><span>'+esc(this.phase==='saving'?'계정에 저장 중…':this.phase==='loading'||this.phase==='boot'?'계정을 확인하고 있어요…':this.phase==='conflict'?'다른 기기에서 바뀐 내용이 있어요.':'계정 연결을 확인해 주세요.')+'</span><a href="#/account">확인</a></div>' : '';
    if(typeof currentRoute!=='undefined' && ['/account','/account/delete'].includes(currentRoute)) render();
  },
  clearPrivateUI: function(){
    saveReviewDraft(); ui.draft=null; hideToast(); if(ui.modalConfirm) closeModal();
    state.recent=[];
  },
  init: async function(){
    if(!this.enabled){this.phase='demo';return;}
    if(!this.guest)this.guest=accountSnapshot();
    if(this.authSubscription)this.authSubscription.unsubscribe();
    this.refreshUI();
    try {
      const sdk=await import('./vendor/supabase.js');
      this.client=sdk.createClient(WEEKLY_PICK_CONFIG.supabaseUrl,WEEKLY_PICK_CONFIG.supabasePublishableKey,{
        auth:{flowType:'pkce',detectSessionInUrl:false,persistSession:true,autoRefreshToken:true,storageKey:'weeklypick.auth'}
      });
      const url=new URL(location.href), token=url.searchParams.get('token_hash'), code=url.searchParams.get('code'), linkError=url.searchParams.has('error') || new URLSearchParams(url.hash.slice(1)).has('error');
      if(token || code || linkError) {
        history.replaceState(null,'',location.pathname+'#/account');
        if(linkError) throw new Error('LINK_INVALID');
        const result=token ? await this.client.auth.verifyOtp({token_hash:token,type:'email'}) : await this.client.auth.exchangeCodeForSession(code);
        if(result.error) throw result.error;
        this.resumeAfterLogin=true;
      }
      this.authSubscription=this.client.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>this.switchUser(session&&session.user),0);}).data.subscription;
      const result=await this.client.auth.getSession();
      if(result.error) throw result.error;
      await this.switchUser(result.data.session && result.data.session.user);
    } catch(error) {
      this.phase='error'; this.message='로그인 연결을 완료하지 못했어요. 만료된 메일이면 새 링크를 받아 주세요.';
      this.refreshUI();
    }
  },
  switchUser: async function(user, force, ignorePending){
    if(!force && this.initialized && (this.user&&this.user.id)===(user&&user.id)) return;
    const generation=++this.generation;
    this.initialized=true; this.clearPrivateUI();
    this.user=user||null; this.pending=null; this.publicReviews=[]; this.message='';this.importDismissed=false;
    if(!user){applyAccountLibrary(this.guest||emptyAccountLibrary());this.phase='guest';render();this.refreshUI();await this.loadFeed();return;}
    applyAccountLibrary(emptyAccountLibrary()); this.phase='loading';render();this.refreshUI();
    try {
      const result=await this.client.from('account_libraries').select('revision,payload').eq('user_id',user.id).eq('issue_id',ISSUE.id).maybeSingle();
      if(result.error) throw result.error;
      if(generation!==this.generation) return;
      const remote=result.data ? normalizeAccountLibrary(result.data.payload) : emptyAccountLibrary();
      this.revision=result.data ? result.data.revision : 0;
      // Backfill receipts for records already imported before this feature.
      if(this.guest && sameAccountLibrary(remote,mergeGuestLibrary(remote,this.guest)))this.rememberImport(user.id,accountLibraryFingerprint(this.guest));
      applyAccountLibrary(remote);
      let pending=null;
      try{if(!ignorePending)pending=JSON.parse(localStorage.getItem(this.pendingKey(user.id)));}catch(error){/* recover through server */}
      if(pending && pending.payload && Number.isSafeInteger(pending.revision)) {
        try {
          pending.payload=normalizeAccountLibrary(pending.payload);
          if(sameAccountLibrary(remote,pending.payload)){this.rememberImport(user.id,pending.importFingerprint);localStorage.removeItem(this.pendingKey(user.id));}
          else {this.pending=pending;applyAccountLibrary(pending.payload);}
        }catch(error){pending=null;}
      }
      this.phase=this.pending ? (this.pending.revision===this.revision?'error':'conflict') : 'ready';
      this.message=this.pending?'이 기기에 아직 저장하지 못한 변경이 있어요. 다시 저장하거나 계정 내용을 불러와 주세요.':'';
      render();this.refreshUI();await this.loadFeed();
      if(generation===this.generation)this.finishLoginReturn();
    }catch(error){if(generation!==this.generation)return;this.phase='error';this.message='계정 데이터를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.';this.refreshUI();}
  },
  loadFeed: async function(){
    if(!this.client)return;
    const generation=this.generation;
    let result;
    try { result=await this.client.rpc('list_public_reviews',{p_issue:ISSUE.id}); } catch(error) {result={error:error};}
    if(generation!==this.generation)return;
    this.feedError=!!result.error;
    if(!result.error)this.publicReviews=(result.data||[]).filter(r=>validIds.has(r.exhibition_id)).map(r=>({
      id:'member-'+r.id,isOwn:r.is_own===true,exhibitionId:r.exhibition_id,rating:r.rating,text:r.body,day:r.day,waiting:r.waiting,createdAt:r.created_at.slice(0,10),order:Date.parse(r.created_at),mine:false,member:true
    }));
    // Do not replace a form while the user is typing.
    if(!ui.draft)render();
  },
  allowMutation: function(action){
    if(!this.enabled)return true;
    if(!this.user){this.beginLogin(loginIntentForAction(action));this.refreshUI();return false;}
    if(this.phase!=='ready'){showToast(this.phase==='saving'?'저장을 마친 뒤 다시 시도해 주세요.':'계정 연결 상태를 먼저 확인해 주세요.');return false;}
    return true;
  },
  queueSave: function(key){
    if(!this.enabled || !this.user || this.phase!=='ready' || !ACCOUNT_KEYS.includes(key))return;
    this.phase='saving';this.refreshUI();
    const generation=this.generation;
    queueMicrotask(()=>{if(generation===this.generation)this.save(accountSnapshot(),this.revision);});
  },
  save: async function(payload,revision,importFingerprint){
    if(!this.user)return;
    const generation=this.generation, id=this.user.id;
    this.phase='saving';this.pending={revision:revision,payload:clone(payload)};
    if(importFingerprint)this.pending.importFingerprint=importFingerprint;
    try{localStorage.setItem(this.pendingKey(id),JSON.stringify(this.pending));}catch(error){/* beforeunload warns until saved */}
    this.refreshUI();
    try {
      const result=await this.client.rpc('save_library',{p_issue:ISSUE.id,p_revision:revision,p_payload:payload});
      if(result.error)throw result.error;
      if(generation!==this.generation)return;
      this.rememberImport(id,importFingerprint);
      this.revision=result.data;this.pending=null;this.phase='ready';this.message='계정에 저장했어요.';
      try{localStorage.removeItem(this.pendingKey(id));}catch(error){/* reconciliation compares payload on next load */}
      this.refreshUI();await this.loadFeed();
      if(generation===this.generation)this.finishLoginReturn();
    }catch(error){
      if(generation!==this.generation)return;
      this.phase=error.code==='40001'?'conflict':'error';
      this.message=this.phase==='conflict'?'다른 기기에서 먼저 변경했어요. 계정 내용을 다시 불러와 주세요.':'저장하지 못했어요. 이 기기의 변경은 보관 중이며 다시 시도할 수 있어요.';
      this.refreshUI();
    }
  },
  retry: async function(){
    if(this.pending && this.phase!=='conflict')return this.save(this.pending.payload,this.pending.revision,this.pending.importFingerprint);
    if(this.user)return this.switchUser(this.user,true);
    return this.init();
  },
  reloadRemote: async function(){
    if(!this.user)return;
    try{localStorage.removeItem(this.pendingKey(this.user.id));}catch(error){}
    this.pending=null;await this.switchUser(this.user,true,true);
  },
  sendLink: async function(email){
    const validationError=emailValidationMessage(email);
    if(validationError){loginValidation.update(true);return;}
    email=email.trim();
    if(!this.client || this.mailSending || Date.now()<this.cooldownUntil)return;
    if(!loginProtection.consent || (loginProtection.required()&&!loginProtection.token))return;
    const captchaToken=loginProtection.token;
    this.email=email;this.mailSending=true;this.mailSent=false;this.message='';this.refreshUI();
    try{
      const result=await this.client.auth.signInWithOtp({email:email,options:{emailRedirectTo:location.origin+'/',shouldCreateUser:true,captchaToken:captchaToken||undefined}});
      if(result.error)throw result.error;
      this.mailSent=true;this.cooldownUntil=Date.now()+60000;this.message='';
      setTimeout(()=>this.refreshUI(),60010);
    }catch(error){this.message=error.status===429?'요청이 많아 메일 발송을 잠시 쉬고 있어요. 잠시 후 다시 시도하거나 로그인 없이 둘러보세요.':'메일을 보내지 못했어요. 주소와 보안 확인을 확인하고 다시 시도해 주세요.';}
    this.mailSending=false;this.refreshUI();
  },
  signOut: async function(){
    if(!this.client || ['saving','deleting'].includes(this.phase))return;
    const result=await this.client.auth.signOut({scope:'local'});
    if(result.error){this.message='로그아웃하지 못했어요. 다시 시도해 주세요.';this.refreshUI();return;}
    loginReturnStore.clear();this.resumeAfterLogin=false;
    await this.switchUser(null);
  },
  deleteAccount: async function(){
    if(!this.client || !this.user || ['boot','loading','saving','deleting'].includes(this.phase))return;
    const id=this.user.id, generation=this.generation;
    this.phase='deleting';this.message='계정과 기록을 삭제하고 있어요…';this.refreshUI();
    try {
      const result=await this.client.rpc('delete_my_account',{p_confirmation:'DELETE MY ACCOUNT'});
      if(result.error || result.data!==true)throw result.error||new Error('DELETE_FAILED');
      if(generation!==this.generation)return;
      ui.draft=null;reviewDraftStore.clearPrefix(id+'/');
      loginReturnStore.clear();this.resumeAfterLogin=false;
      try{localStorage.removeItem(this.importReceiptKey(id));}catch(error){}
      try{localStorage.removeItem(this.pendingKey(id));}catch(error){/* storage may be unavailable */}
      this.pending=null;this.publicReviews=[];this.email='';
      // Deleted users can no longer refresh. Clear this browser's session even if
      // the sign-out network request fails after the database transaction succeeds.
      try{await this.client.auth.signOut({scope:'local'});}catch(error){/* local fallback below */}
      try{for(const key of Object.keys(localStorage))if(key==='weeklypick.auth'||key.startsWith('weeklypick.auth-'))localStorage.removeItem(key);}catch(error){}
      await this.switchUser(null,true);
      this.message='탈퇴가 완료됐어요. 계정과 서버에 저장된 기록·후기를 삭제했어요.';
      location.hash='#/account';this.refreshUI();
    }catch(error){
      if(generation!==this.generation)return;
      this.phase='error';this.message='탈퇴 완료를 확인하지 못했어요. 연결을 확인하고 다시 시도해 주세요.';this.refreshUI();
    }
  },
  importGuest: async function(){
    if(!this.allowMutation()||!this.guest)return;
    const merged=mergeGuestLibrary(accountSnapshot(),this.guest);
    applyAccountLibrary(merged);this.importDismissed=true;await this.save(merged,this.revision,accountLibraryFingerprint(this.guest));
  }
};
window.addEventListener('beforeunload',function(e){if(account.enabled && (account.pending||account.phase==='saving')){e.preventDefault();e.returnValue='';}});

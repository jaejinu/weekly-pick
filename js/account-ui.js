function accountEntryHTML() {
  if(!account.enabled)return '';
  return '<section class="account-card"><h2>'+(account.user?'내 계정':'기기를 바꿔도 내 주말 그대로')+'</h2><p>'+
    (account.user?esc(account.user.email||'로그인됨'):'로그인하고 저장한 전시와 후기를 이어서 이용하세요.')+'</p><a class="btn btn--outline" href="#/account">'+(account.user?'계정·동기화 관리':'이메일로 로그인')+'</a></section>';
}
function screenAccount() {
  let body='';
  if(!account.enabled)body='<p>계정 연결을 준비하고 있어요.</p><a class="btn btn--outline" href="#/my">내 주말로 돌아가기</a>';
  else if(account.user){
    const pending=!!account.pending, busy=['loading','saving','deleting'].includes(account.phase);
    body='<p class="account-email">'+esc(account.user.email||'로그인됨')+'</p><p>저장 목록·주말 계획·방문 기록은 나만 볼 수 있어요. 등록한 후기는 다른 사람도 볼 수 있어요.</p>'+
      '<p role="status">'+esc(account.message||(busy?'계정 데이터를 연결하고 있어요.':'계정에 연결되어 있어요.'))+'</p>'+
      (['error','conflict'].includes(account.phase)?'<div class="account-actions">'+(account.phase!=='conflict'?'<button class="btn btn--primary" data-action="account-retry">다시 시도</button>':'')+'<button class="btn btn--outline" data-action="account-reload">계정 내용 다시 불러오기</button></div>':'')+
      (!busy&&!pending&&account.phase==='ready'&&!account.importDismissed&&account.guest&&(account.guest.saved.length||account.guest.reviews.length)?
       '<section class="account-card"><h2>이 브라우저의 기록 가져오기</h2><p>저장 '+account.guest.saved.length+'곳 · 내 후기 '+account.guest.reviews.length+'개. 계정에 이미 있는 기록을 우선하고 나머지를 추가해요. 가져온 후기는 공개돼요.</p><button class="btn btn--outline" data-action="account-import">가져오기</button><button class="btn btn--text" data-action="account-skip-import">나중에</button></section>':'')+
      '<a class="btn btn--primary" href="#/my">내 주말 보기</a><button class="btn btn--outline" data-action="account-logout"'+(busy?' disabled':'')+'>로그아웃</button>'+
      '<a class="btn btn--text" href="#/account/delete">계정 탈퇴</a>'+
      (pending?'<p class="form-note">미저장 변경은 이 계정으로 다시 로그인하면 확인할 수 있어요.</p>':'');
  }else{
    const busy=account.mailSending||account.phase==='boot', cooling=Date.now()<account.cooldownUntil;
    body=(WEEKLY_PICK_CONFIG.testMode?'<p class="account-card">테스트 로그인: 현재는 Supabase 프로젝트 팀에 등록된 이메일만 받을 수 있어요.</p>':'')+'<p>메일로 받은 링크를 누르면 로그인돼요. 처음이라면 계정도 함께 만들어져요.</p>'+
      '<form id="account-login-form"><label class="form-block__label" for="account-email">이메일 주소</label><input class="form-textarea account-input" id="account-email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254" value="'+esc(account.email)+'" placeholder="you@example.com">'+
      '<p class="form-note">이메일은 로그인·계정 관리에, 저장·계획·방문·후기는 기록 동기화에 사용하며 탈퇴 시 운영 DB에서 삭제해요. <a class="privacy-link" href="#/privacy">보관·국외 처리 등 자세한 안내</a></p><label class="account-consent"><input id="account-consent" type="checkbox" required'+(loginProtection.consent?' checked':'')+'> 개인정보 수집·이용에 동의해요.</label>'+
      (loginProtection.required()?'<div id="login-captcha"></div><p id="captcha-status" class="form-note" role="status">보안 확인을 진행해 주세요.</p><button type="button" class="btn btn--text" data-action="captcha-retry">보안 확인 다시 시도</button>':'')+
      '<button class="btn btn--primary btn--full" type="submit"'+(busy||cooling||!loginProtection.consent||(loginProtection.required()&&!loginProtection.token)?' disabled':'')+'>'+(account.mailSending?'메일 보내는 중…':cooling?'1분 후 다시 보낼 수 있어요':account.mailSent?'로그인 링크 다시 받기':'로그인 링크 받기')+'</button></form>'+
      (account.mailSent?'<p role="status">메일함을 확인해 주세요. 링크는 한 번만 사용할 수 있어요. 메일을 요청한 브라우저에서 열어 주세요. 메일이 없으면 스팸함도 확인해 주세요.</p>':'')+
      (account.message?'<p role="status">'+esc(account.message)+'</p>':'')+
      (!account.client&&account.phase==='error'?'<button class="btn btn--outline" data-action="account-retry">연결 다시 시도</button>':'')+
      '<a class="btn btn--outline" href="#/discover">로그인 없이 둘러보기</a>';
  }
  return detailHeaderHTML('내 계정')+'<main class="content-container account-screen"><h1>'+(account.user?'내 계정':'이메일로 로그인')+'</h1>'+body+(account.feedError?'<p role="status">회원 후기를 불러오지 못했어요. 새로고침하면 다시 시도해요.</p>':'')+'<a class="privacy-link" href="#/privacy">개인정보 처리 안내</a></main>';
}
function accountReviewGateHTML() {
  return detailHeaderHTML('후기 남기기')+'<main class="content-container"><h1>로그인하고 후기를 남겨 주세요</h1><p>방문한 전시의 이야기를 계정에 보관할 수 있어요.</p><a class="btn btn--primary" href="#/account">이메일로 로그인</a></main>';
}
document.addEventListener('submit',function(e){
  if(e.target.id!=='account-login-form')return;
  e.preventDefault();account.sendLink(document.getElementById('account-email').value.trim());
});
document.addEventListener('input',function(e){if(e.target.id==='account-email')account.email=e.target.value;});
document.addEventListener('click',function(e){
  const target=e.target.closest('[data-action]');if(!target)return;
  switch(target.dataset.action){
    case 'account-delete':
      if(!document.getElementById('delete-confirm')?.checked){showToast('삭제 범위 확인에 체크해 주세요.');return;}
      openConfirm('정말 탈퇴할까요?','이메일 계정, 저장 목록, 계획, 방문 기록과 공개 후기가 삭제돼요. 되돌릴 수 없어요.','취소','계정과 기록 삭제',()=>account.deleteAccount(),target);
      break;
    case 'account-retry':account.retry();break;
    case 'account-logout':account.signOut();break;
    case 'account-reload':
      if(account.pending)openConfirm('계정 내용을 다시 불러올까요?','이 기기의 미저장 변경은 버리고 계정에 저장된 내용으로 바꿔요.','취소','다시 불러오기',()=>account.reloadRemote(),target);
      else account.reloadRemote();break;
    case 'account-import':openConfirm('이 브라우저의 기록을 가져올까요?','저장·계획·방문 기록을 추가하고 내 후기를 공개해요. 계정의 기존 기록은 유지해요.','취소','가져오기',()=>account.importGuest(),target);break;
    case 'account-skip-import':account.importDismissed=true;account.refreshUI();break;
  }
});

function screenDeleteAccount() {
  if(!account.user)return detailHeaderHTML('계정 탈퇴')+'<main class="content-container account-screen"><h1>계정 탈퇴</h1><p>본인 계정으로 로그인한 뒤 탈퇴할 수 있어요.</p><a class="btn btn--primary" href="#/account">로그인하기</a></main>';
  const busy=['boot','loading','saving','deleting'].includes(account.phase);
  return detailHeaderHTML('계정 탈퇴')+'<main class="content-container account-screen"><h1>계정과 기록 삭제</h1><p>'+esc(account.user.email||'현재 로그인한 계정')+'</p><p>이메일 계정과 서버의 저장 목록·계획·방문 기록·공개 후기를 함께 삭제해요. 삭제한 기록은 복구할 수 없어요.</p><p>현재 브라우저의 이 계정 미저장 변경·후기 초안도 지워요. 로그인 전 게스트 기록은 유지돼요. 다른 기기의 로컬 기록은 그 기기에서 사이트 데이터를 지워 주세요.</p><label class="account-consent"><input id="delete-confirm" type="checkbox"'+(busy?' disabled':'')+'> 삭제 범위와 복구할 수 없음을 확인했어요.</label><p role="status">'+esc(account.message)+'</p><button class="btn btn--outline" data-action="account-delete"'+(busy?' disabled':'')+'>'+(account.phase==='deleting'?'삭제 중…':'탈퇴하고 기록 삭제')+'</button><a class="btn btn--text" href="#/account">계속 이용하기</a><a class="privacy-link" href="#/privacy">개인정보 처리 안내</a></main>';
}

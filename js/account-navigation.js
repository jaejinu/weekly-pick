const LOGIN_GUIDANCE = Object.freeze({
  save: {title:'전시를 저장하려면 로그인해 주세요',next:'로그인 후 보던 화면에서 저장 버튼을 다시 눌러 주세요.'},
  plan: {title:'주말 계획을 바꾸려면 로그인해 주세요',next:'로그인 후 보던 화면에서 일정에 넣기·순서·시각 변경을 다시 진행해 주세요.'},
  visit: {title:'방문 기록을 남기려면 로그인해 주세요',next:'로그인 후 보던 화면에서 ‘다녀왔어요’ 버튼을 다시 눌러 주세요.'},
  review: {title:'후기를 남기려면 로그인해 주세요',next:'로그인 후 후기 작성 화면에서 내용을 입력하고 등록해 주세요.'}
});
function validLoginIntent(intent) {
  return typeof intent==='string' && Object.prototype.hasOwnProperty.call(LOGIN_GUIDANCE,intent) ? intent : null;
}
function loginIntentForAction(action) {
  if(action==='toggle-save')return 'save';
  if(['assign','unplan','apply-course','move-plan','start-time'].includes(action))return 'plan';
  if(action==='visit')return 'visit';
  if(['submit-review','delete-review'].includes(action))return 'review';
  return null;
}
/* Same-browser magic links may open a new tab; keep only an internal route and an allowlisted guidance category,
   never an action payload, email, token, or automatically replayed mutation. */
function createLoginReturnStore(getStorage, now) {
  const key='weeklypick.loginReturn', lifetime=30*60*1000;
  let memory=null, persisted=false;
  function valid(route) {
    if(typeof route!=='string'||route.length>500)return false;
    return /^#\/(?:home|discover|saved|my|regions|archive|reviews)$/.test(route)||
      /^#\/discover\?focus=1$/.test(route)||/^#\/regions\?rg=rg-(?:jongno|seongsu|hannam|hongdae)$/.test(route)||
      /^#\/(?:exhibition\/ex-(?:0[1-9]|10)|article\/art-0[1-3]|review\/new\/ex-(?:0[1-9]|10))$/.test(route);
  }
  function clear(){memory=null;persisted=false;try{getStorage().removeItem(key);}catch(error){}}
  function read() {
    let record=memory;
    try{if(persisted||!memory)record=JSON.parse(getStorage().getItem(key));}catch(error){}
    if(!record||!valid(record.route)||!Number.isFinite(record.at)||now()-record.at<0||now()-record.at>lifetime){clear();return null;}
    return {route:record.route,intent:validLoginIntent(record.intent)};
  }
  return {
    clear:clear,
    remember:function(route,intent){
      if(!valid(route)){clear();return;}
      memory={route:route,at:now(),intent:validLoginIntent(intent)};
      persisted=false;
      try{getStorage().setItem(key,JSON.stringify(memory));persisted=true;}catch(error){}
    },
    peek:function(){const record=read();return record ? record.route : null;},
    intent:function(){const record=read();return record ? record.intent : null;},
    take:function(){const route=this.peek();clear();return route;}
  };
}
const loginReturnStore=createLoginReturnStore(()=>localStorage,()=>Date.now());

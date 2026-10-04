/* Same-browser magic links may open a new tab; keep only an internal route,
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
  return {
    clear:clear,
    remember:function(route){
      if(!valid(route)){clear();return;}
      memory={route:route,at:now()};
      persisted=false;
      try{getStorage().setItem(key,JSON.stringify(memory));persisted=true;}catch(error){}
    },
    peek:function(){
      let record=memory;
      try{if(persisted||!memory)record=JSON.parse(getStorage().getItem(key));}catch(error){}
      if(!record||!valid(record.route)||!Number.isFinite(record.at)||now()-record.at<0||now()-record.at>lifetime){clear();return null;}
      return record.route;
    },
    take:function(){const route=this.peek();clear();return route;}
  };
}
const loginReturnStore=createLoginReturnStore(()=>localStorage,()=>Date.now());

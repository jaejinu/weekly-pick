/* Tokens stay in memory. Supabase verifies them; client gating is only UX. */
const loginProtection = {
  token:'', consent:false, widget:null, loading:null,
  required: function(){return !!WEEKLY_PICK_CONFIG.turnstileSiteKey;},
  reset: function(){
    this.token='';
    if(this.widget!==null && window.turnstile){try{window.turnstile.remove(this.widget);}catch(error){} }
    this.widget=null;
  },
  updateButton: function(){
    loginValidation.update(false);
    const button=document.querySelector('#account-login-form button[type="submit"]');
    if(button)button.disabled=account.mailSending||account.phase==='boot'||Date.now()<account.cooldownUntil||!!emailValidationMessage(account.email)||!this.consent||(this.required()&&!this.token);
  },
  load: function(){
    if(window.turnstile)return Promise.resolve();
    if(!this.loading)this.loading=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async=true;
      script.onload=()=>window.turnstile?resolve():reject(new Error('CAPTCHA_UNAVAILABLE'));
      script.onerror=()=>{script.remove();this.loading=null;reject(new Error('CAPTCHA_UNAVAILABLE'));};
      document.head.appendChild(script);
    });
    return this.loading;
  },
  mount: async function(){
    const node=document.getElementById('login-captcha');
    this.updateButton();
    if(!node || !this.required())return;
    const note=document.getElementById('captcha-status');
    const message=text=>{if(node.isConnected&&note)note.textContent=text;};
    try {
      await this.load();
      if(!node.isConnected)return;
      this.widget=window.turnstile.render(node,{
        sitekey:WEEKLY_PICK_CONFIG.turnstileSiteKey, theme:'light', size:'flexible', language:'ko',
        callback:token=>{if(!node.isConnected)return;this.token=token;message('보안 확인이 완료됐어요.');this.updateButton();},
        'expired-callback':()=>{if(!node.isConnected)return;this.token='';message('보안 확인이 만료됐어요. 다시 확인해 주세요.');this.updateButton();},
        'error-callback':()=>{if(!node.isConnected)return;this.token='';message('보안 확인에 연결하지 못했어요. 다시 시도하거나 로그인 없이 둘러볼 수 있어요.');this.updateButton();}
      });
    }catch(error){message('보안 확인을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.');}
  }
};
document.addEventListener('change',function(e){
  if(e.target.id==='account-consent'){loginProtection.consent=e.target.checked;loginProtection.updateButton();}
});
document.addEventListener('click',function(e){
  if(e.target.closest('[data-action="captcha-retry"]')){loginProtection.reset();account.refreshUI();}
});

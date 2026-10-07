/* Shared validation for UI feedback and the final action guard. */
function emailValidationMessage(value) {
  const email=typeof value==='string'?value.trim():'';
  if(!email)return '이메일 주소를 입력해 주세요.';
  if(email.length>254)return '이메일 주소는 254자 이내로 입력해 주세요.';
  const pattern=/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;
  return pattern.test(email)?'':'이메일 형식을 확인해 주세요. 예: name@example.com';
}
function reviewValidationErrors(draft) {
  const errors={};
  if(!Number.isInteger(draft.rating)||draft.rating<1||draft.rating>5)errors.rating='별점을 선택해 주세요.';
  if(!draft.text.trim())errors.text='후기 내용을 입력해 주세요.';
  else if(draft.text.length>80)errors.text='한 줄은 80자까지 쓸 수 있어요. 지금 '+draft.text.length+'자예요.';
  if(!['토요일','일요일','평일'].includes(draft.day))errors.day='방문 요일을 선택해 주세요.';
  if(!['yes','no'].includes(draft.waiting))errors.waiting='웨이팅 여부를 선택해 주세요.';
  return errors;
}
function reviewValidationSummary(draft) {
  const errors=reviewValidationErrors(draft);
  const labels={rating:'별점',text: draft.text.length>80?'후기 80자 이내로 수정':'후기 내용',day:'방문 요일',waiting:'웨이팅 여부'};
  return Object.keys(errors).length?'등록 전 확인: '+Object.keys(errors).map(key=>labels[key]).join(' · '):'필수 항목을 모두 입력했어요. 등록할 수 있어요.';
}
const loginValidation = {
  emailTouched:false,
  reset:function(){this.emailTouched=false;},
  update:function(submitted){
    const input=document.getElementById('account-email');
    if(!input)return false;
    if(submitted)this.emailTouched=true;
    const emailError=emailValidationMessage(input.value);
    const error=document.getElementById('account-email-error');
    const visible=this.emailTouched?emailError:'';
    if(error)error.textContent=visible;
    input.classList.toggle('form-textarea--error',!!visible);
    if(visible)input.setAttribute('aria-invalid','true');else input.removeAttribute('aria-invalid');
    const missing=[];
    if(emailError)missing.push(input.value.trim()?'이메일 형식':'이메일 주소');
    if(!loginProtection.consent)missing.push('개인정보 수집·이용 동의');
    if(loginProtection.required()&&!loginProtection.token)missing.push('보안 확인');
    const summary=document.getElementById('login-validation-status');
    if(summary)summary.textContent=missing.length?'계속하려면 확인해 주세요: '+missing.join(' · '):'필수 항목을 모두 확인했어요. 로그인 링크를 받을 수 있어요.';
    if(submitted&&missing.length){
      const target=emailError?input:!loginProtection.consent?document.getElementById('account-consent'):document.getElementById('captcha-status');
      if(target)target.focus();
    }
    return missing.length===0;
  }
};

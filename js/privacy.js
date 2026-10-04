function screenPrivacy() {
  return detailHeaderHTML('개인정보 처리 안내')+`<main class="content-container account-screen privacy-screen">
    <h1>개인정보 처리 안내</h1><p>위클리픽은 개인 포트폴리오 데모입니다. 로그인 없이 콘텐츠를 둘러볼 수 있으며, 계정 기능 이용 시 아래 정보를 처리합니다. 시행일: 2026년 10월 5일.</p>
    <section><h2>수집 항목과 목적</h2><p>이메일 주소와 계정 식별자는 로그인 링크 발송·본인 계정 확인에 사용합니다. 저장한 전시, 주말 계획, 방문 기록, 후기와 변경 시각은 기록 저장·기기 간 동기화에 사용합니다. 비밀번호를 직접 수집하지 않습니다.</p><p>호스팅·인증·메일·봇 방지 서비스는 요청 처리와 보안을 위해 IP 주소, 브라우저 정보, 접속·발송 기록을 처리할 수 있습니다.</p></section>
    <section><h2>공개되는 정보</h2><p>등록한 후기의 전시, 별점, 본문, 방문 요일, 웨이팅 여부와 작성일은 다른 방문자에게 공개됩니다. 이메일과 내부 계정 식별자는 후기 공개 응답에 포함하지 않습니다. 후기에는 본인이나 타인의 연락처 등 개인정보를 쓰지 마세요.</p><p>저장 목록·계획·방문 기록은 본인 계정에서만 조회할 수 있습니다.</p></section>
    <section><h2>보관과 삭제</h2><p>계정 정보와 연결된 기록은 계정 이용 중 보관하고, 내 계정 → 계정 탈퇴에서 삭제합니다. 후기는 개별 삭제할 수도 있습니다. 탈퇴 시 운영 DB의 계정·저장 목록·계획·방문 기록·공개 후기를 함께 삭제하며 복구할 수 없습니다.</p><p>현재 브라우저의 해당 계정 미저장 변경·초안도 삭제합니다. 게스트 기록은 브라우저에 남고, 다른 기기의 로컬 기록은 해당 기기의 사이트 데이터 삭제로 지울 수 있습니다. 같은 탭의 후기 초안은 sessionStorage, 로그인 세션과 미저장 변경·게스트 기록은 localStorage에 저장됩니다.</p><p>발송 서비스의 이메일·로그는 현재 표준 정책상 30일 보관됩니다. 인프라의 보안 로그·백업은 공급자의 보관·삭제 정책을 따르며 앱 탈퇴와 동시에 모두 삭제되는 것은 아닙니다. 이미 다른 사람이 복사한 공개 후기는 회수할 수 없습니다.</p></section>
    <section><h2>외부 서비스와 국외 처리</h2><ul>
      <li>Supabase: 계정 인증·데이터 저장. 이 프로젝트의 DB 리전은 호주 시드니입니다. <a href="https://supabase.com/privacy">개인정보 정책</a></li>
      <li>Resend: 이메일 주소·인증 메일 본문·발송 기록을 처리하며 데이터는 미국에 저장합니다. <a href="https://resend.com/security/gdpr">보관·처리 정책</a></li>
      <li>Cloudflare Turnstile: 로그인 화면에서 봇 방지 검증을 위해 접속·기기 관련 정보를 처리합니다. <a href="https://www.cloudflare.com/turnstile-privacy-policy/">개인정보 정책</a></li>
      <li>Vercel: 웹사이트 호스팅과 요청 처리. <a href="https://vercel.com/legal/privacy-policy">개인정보 정책</a></li>
    </ul><p>페이지의 외부 폰트·아이콘은 Google Fonts, jsDelivr, cdnjs에서 불러오므로 해당 공급자에게도 접속 정보가 전달될 수 있습니다.</p></section>
    <section><h2>선택과 문의</h2><p>계정 기능에 필요한 수집·이용에 동의하지 않아도 로그인 없이 둘러볼 수 있습니다. 동의하지 않으면 이메일 로그인과 계정 저장은 이용할 수 없습니다. 계정의 기록 확인·정정은 앱에서, 계정 삭제는 탈퇴 화면에서 할 수 있습니다.</p><p>운영·개인정보 담당: jaejinu<br>열람·정정·삭제·처리 정지 문의: <a href="mailto:dbwowls12345@naver.com">dbwowls12345@naver.com</a></p><p>문의 시 인증 링크·비밀번호를 보내지 마세요. weeklypick@jaejinu.co.kr은 발신 전용입니다.</p></section>
    <a class="btn btn--outline" href="#/account">내 계정</a><a class="btn btn--text" href="#/discover">로그인 없이 둘러보기</a>
  </main>`;
}

# 위클리픽 — 세션 인수인계

> 최종 갱신 2026-10-05. 현재 상태는 이 문서, 기능 범위는 `v2/02-v2-scope.md`, 구현·검증 기록은 `v2/04-implementation.md`를 참고하세요.

## 이메일 계정 연결 — 테스트 단계 (2026-10-05)

- 작업 브랜치 `feat/email-account-sync`. 사용자는 이메일 링크 방식과 테스트 로그인 우선 진행을 선택했다. 이후 사용자 Resend 계정에서 기존 인증 도메인 `jaejinu.co.kr`을 확인했고, 사용자가 `weeklypick@jaejinu.co.kr` 발신 사용을 선택했다.
- Supabase `weekly-pick`, ref `ongmhufnmafpzlwpxsvq`. `supabase/migrations/202610050001_accounts.sql`을 새 프로젝트 SQL Editor에서 트랜잭션으로 적용 완료. 로컬 PGlite에서 계정 격리/직접 변경 금지/충돌/공개 후기 소유권 검증. 실제 anon API도 공개 후기 200, 비공개 목록·쓰기 RPC 401 확인.
- `js/config.js`에는 공개 publishable 키만 있다. 비밀 키/DB 비밀번호는 앱에 넣지 않는다. `testMode:false`로 팀 전용 테스트 안내를 해제했다. Resend SMTP 연결 후 실메일 검증을 진행 중이다.
- `supabase/templates/`의 한국어 로그인·가입 확인 템플릿을 Supabase에 적용했다. SDK의 PKCE 요청 → callback `?code=` → `exchangeCodeForSession` 처리. 요청한 브라우저에서 링크를 열어야 한다. 추후 custom SMTP 템플릿용 `token_hash`도 처리한다. 주소의 인증 값은 즉시 제거한다.
- 사용자별 JSON 라이브러리를 RLS로 분리하고, 버전 충돌은 자동 덮어쓰기 없이 계정 화면에서 처리한다. 공개 후기는 저장 RPC가 인증된 사용자 ID로 생성/변경한다. 기존 브라우저 기록은 명시적 가져오기 후 합친다.
- 저장 실패의 pending 데이터와 후기 초안은 사용자별 키로 분리한다. 로그아웃 시 게스트 기록을 복원한다.
- 자동 검사: `npm test` (상태·초안·계정·실제 PostgreSQL 정책), `npm run test:browser` / `npm run test:webkit` (기존 데모), `npm run test:account` 및 `BROWSER=webkit npm run test:account` (실제 SDK + mock HTTP로 메일 요청/PKCE/가져오기/후기/실패 복구/로그아웃).
- 테스트 Preview: https://weekly-pick-bwxg672wg-dbwowls12345-3437s-projects.vercel.app/#/account (Supabase Site URL도 같은 origin).
- 사용자가 실제 이메일 링크 로그인을 완료했다. 실계정에서 전시 ex-10을 저장하고 새 탭에서 서버 복원을 확인한 뒤 검증용 ex-10만 해제하여 기존 2곳/계획 1곳 상태로 복원했다. 실계정의 공개 후기는 임의로 게시하지 않았으며 후기 흐름은 SDK 브라우저 검사와 SQL 정책 테스트로 검증했다. Resend SMTP의 실메일 수신 확인 후 main 병합과 운영 Site URL 전환을 진행한다. 현재 운영은 기존 main을 유지하고 테스트는 Preview에서 진행한다.
- SMTP: `smtp.resend.com:465`, username `resend`, 발신 `위클리픽 <weeklypick@jaejinu.co.kr>`. 키 이름 `weekly-pick-supabase-auth`, Sending access/jaejinu.co.kr 제한. 비밀 값은 브라우저 클립보드로 Supabase 암호 필드에 직접 전달하고 클립보드를 비웠으며 저장소·채팅에 출력하지 않았다.
- GitHub Public 가능 여부 질문에 커밋 기록 114개 blob의 대표 비밀 패턴과 민감 파일명을 검사해 발견 없음. 기획·인수인계 문서도 노출되므로 현재 Private 유지 권장. 저장소 공개 변경은 요청/수행하지 않았다.
- SDK 갱신 시 `npm run build:auth`, `js/vendor/supabase.js`와 license 파일을 함께 커밋한다.

## 현재 상태

- V2 주말 계획·방문·후기 흐름을 구현하고 운영에 반영했다.
- [PR #1](https://github.com/jaejinu/weekly-pick/pull/1)을 원격 `main`에 병합했다. 병합 커밋: `553c2bf`.
- PR 및 main 푸시마다 상태 테스트와 Chromium·WebKit 브라우저 검사를 실행한다. PR #1과 병합 후 main 검사 모두 통과했다.
- `main` 푸시로 Vercel 프로덕션이 자동 배포된다. PR #1 배포 ID: `dpl_DrqdeD3V21PKGiejKV6AZKJoPLzw`.
- 현재 GitHub 요금제에서는 비공개 저장소의 필수 검사/브랜치 보호 설정이 제한된다. 검사 결과를 확인한 뒤 병합한다.

## 접근 정보

| 항목 | 값 |
|---|---|
| 운영 주소 | https://weekly-pick.vercel.app |
| GitHub | https://github.com/jaejinu/weekly-pick (private) |
| Figma | https://www.figma.com/design/yLwb9DYMBoP0xneugWaaJd |
| Vercel | 프로젝트 `weekly-pick` / 계정 `dbwowls12345-3437` |
| Vercel 팀 | `dbwowls12345-3437s-projects` |

현재 작업 디렉터리에서 `git status`, `git branch --show-current`, 원격 상태를 확인하고 이어간다. 별도 로컬 main 작업 디렉터리에는 미공개 문서 커밋이 있으므로 원격 main과 같다고 가정하거나 강제 초기화하지 않는다. `.env*`와 `.vercel/`은 로컬 인증 정보이며 커밋·배포에서 제외한다.

## 코드와 디자인

- 정적 HTML/CSS/JavaScript 앱이다. 빌드·백엔드·로그인이 없으며 데이터는 가상의 전시 10건·기사 3건·샘플 후기 6건이다.
- `js/data.js`: 콘텐츠, `ISSUE_DATE`, 날짜 프리셋, 권역 이동 10쌍.
- `js/state.js`: localStorage, 마이그레이션, 타임라인 계산, 방문·후기.
- `js/drafts.js`: 같은 탭의 후기 임시 입력 복원.
- `js/components.js`: 공용 UI. `js/app.js`: 화면·해시 라우팅·이벤트.
- `css/tokens.css`, `app.css`, `components.css`: 디자인 토큰과 화면 스타일.
- `tests/`: 상태·브라우저 회귀 검사. `.github/workflows/test.yml`: CI.
- `weeklypick/`의 V1 확정 문서는 보존한다. 변경 기록은 `v2/`에 둔다.

기존 작업 기록상 Figma 디자인 시스템, V1 화면 통합, UX 보완 23개 시안이 완료됐다. `03_V2_DESIGN`을 구현 기준으로 사용했고 UX 검토 노드는 `189:2130`이다. Figma 대체 폰트는 Gothic A1, 실제 앱 UI 폰트는 Pretendard다. 과거의 Noto Sans KR 대체 제안이나 V1 이전 미완료 안내를 현재 작업 상태로 해석하지 않는다.

기능 범위와 제외 항목은 `v2/02-v2-scope.md`를 따른다. 지도·예매 API, 실제 전시 데이터, 신규 독립 화면은 현재 범위 밖이다.

## 실행·검증

```bash
python3 -m http.server 8777
# 별도 터미널
npm ci
npx playwright install chromium webkit
npm test
npm run test:browser
npm run test:webkit
```

브라우저 검사는 독립 세션과 임시 서버를 사용한다. 기본 화면 캡처 경로는 `/tmp/weeklypick-v2-qa-{chromium|webkit}`이다. GitHub Actions의 브라우저별 화면 아티팩트는 7일 보관한다.

배포본은 `TEST_BASE_URL=https://weekly-pick.vercel.app npm run test:browser`로 확인할 수 있다. Vercel Preview는 로그인 보호가 적용되므로 공유 시 운영 주소를 사용한다.

## 후속 UX 보완과 남은 확인

후기 화면의 앱 내 뒤로가기·수정 취소에서 실제 변경된 입력만 확인하도록 보완했다. 방문 요일/웨이팅만 선택한 경우도 변경으로 판단하며, 확인창의 배경 포커스 차단·설명 연결·닫은 뒤 포커스 복귀를 브라우저 회귀 검사에 포함한다.

다음 사용성 확인은 실제 iPhone Safari와 사용자 관찰이다. WebKit 자동 검사는 실제 기기 검증과 구분한다. 아래 과제로 진행하고 성공 여부·막힌 위치·사용자 발언을 기록한다.

1. 전시 2곳을 저장하고 토요일 일정에 넣는다.
2. 순서와 시작 시각을 바꿔 종료 예상 시각을 찾는다.
3. 데모 날짜를 9.14로 바꾸고 방문을 기록한다.
4. 후기를 작성·수정·취소·삭제하고 되돌린다.
5. 키보드가 열린 작은 화면에서 입력창·하단 버튼을 확인한다.

입력 변경 확인은 앱 내 뒤로가기와 수정 취소에 적용된다. 브라우저 자체 뒤로가기·앞으로가기·새로고침은 같은 탭의 sessionStorage 임시 입력 복원으로 보호한다. 등록·명시적 취소 시 삭제하며 탭을 닫은 뒤의 복원은 보장하지 않는다. 저장소가 차단되면 메모리로만 유지하고 새로고침 시 유실 가능성을 화면에서 알린다. 실제 사용자나 기기에서 확인하지 않은 결과를 완료로 기록하지 않는다.

후속 키보드 보완: 별점 Tab/방향키, 후기 선택 버튼의 포커스 유지, 글자 수 오류 설명 연결을 검사한다. 확인창이 열린 상태의 브라우저 이동 시 배경 잠금과 이전 확인 콜백을 정리한다. 잘못 인코딩된 URL 쿼리도 화면을 중단하지 않는다. 관련 회귀 검사는 `tests/browser-accessibility.cjs`다. 사용자가 iPhone을 보유하지 않는다고 확인했으므로 실제 기기 검증 요청을 반복하지 않는다.

검색·계획 후속 보완: IME 조합 중 검색창 재생성을 막고, 필터·정렬·동네 선택의 포커스를 유지한다. URL의 검색 포커스/초기 동네 값은 진입 시에만 적용한다. 일정 순서를 끝까지 옮기면 같은 전시의 반대 방향 버튼으로 포커스를 유지한다. `tests/browser-discovery.cjs`가 두 브라우저에서 검사하며 실제 모바일 한글 키보드 검증은 포함하지 않는다.

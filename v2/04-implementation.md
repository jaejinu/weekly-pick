# V2 로컬 구현 기록

2026-10-05. 기존 정적 HTML/CSS/JavaScript 구조에 V2 핵심 동선을 구현했다. 빌드·React 전환 없이 정적 앱으로 구현했다. 2026-10-05 검증된 미리보기 배포를 프로덕션으로 승격했다.

## 디자인 기준

[Figma UX 검토 내역](https://www.figma.com/design/yLwb9DYMBoP0xneugWaaJd?node-id=189-2130)을 기준으로 내 주말, 후기 수정·관리, 상세 액션, 빈 상태를 반영했다. 공용 카드·버튼·이미지·Font Awesome 아이콘과 기존 토큰을 재사용한다. 기존 UI 폰트 Pretendard는 유지한다(Figma에서는 대체 폰트 Gothic A1 사용). 홈·기사 전체의 픽셀 단위 재제작은 이번 변경에 포함하지 않는다.

## 구현

- `js/data.js`: 발행일과 데모 날짜 분리. 같은 권역 4쌍+다른 권역 6쌍의 대칭 이동 모델. 권역 기준 데모 예상값이며 교통수단·실제 길찾기 추정이 아니다.
- `js/state.js`: 순서·시작 시각·관람·이동으로 타임라인 계산. 240분 초과 경고. 시작 전/진행/종료 상태. 방문 기록과 후기의 분리. 후기 저장 시 방문 생성, 삭제 시 방문 유지. 샘플 후기 보호. 단조 증가 후기 ID와 V1 마이그레이션. Undo가 다른 항목의 후속 변경을 덮어쓰지 않도록 처리.
- `js/app.js`: 저장 목록에서 요일 지정, 내 주말 순서·시각 조작, 지난 일정의 방문 버튼, 시작 전 상세 계획 진입, 후기 수정·삭제 확인·복구. 검색/저장 빈 상태. 실제 조작에 맞춘 안내 문구.
- `css/components.css`: 44px 공통 컨트롤, 타임라인·예약 안내·방문 상태·후기 관리 스타일. 상세 하단 안내를 고정 바 안으로 배치. 186px 슬라이더만 정보 라벨 축약.
- 호출되지 않던 skeleton 함수와 CSS 제거. 실제 지연이 없는 정적 앱에 가짜 로딩을 넣지 않는다.

데모 날짜 전환은 사용자 흐름 상단에서 제거하고 **내 주말 하단의 접힌 설정**에 배치했다. 기본 날짜는 9.10이며 9.14로 변경하면 종료 상태·오늘까지·방문 전환을 확인할 수 있다. 날짜 변경은 저장·계획·방문 기록을 초기화하지 않는다.

## 저장 데이터

기존 `weeklypick.saved`, `plan`, `reviews`, `recent`의 `{v:1,data:...}` 형식을 유지한다. 추가 키는 `visits`, `dayStartTime`, `currentDate`, `nextReviewSeq`이다.

기존 후기 ID를 `rv-my-{seq}`로 한 번 변환하고 방문 기록을 보완한다. 이후 재실행·삭제·복구에서 ID를 재사용하지 않는다. 기존 저장 목록·계획은 샘플 시안에 맞추기 위해 덮어쓰지 않는다.

## 검증

- `npm test`: 상태 테스트 10개. 대칭 이동, 타임라인 합계/순서/시각, 날짜 상태, 후기 수정·삭제·복구, 샘플 보호, 기존 데이터 마이그레이션, Undo 정합성, 손상/차단 저장소를 검증한다.
- `npm run test:browser`: Chromium에서 요일 지정·순서·시각 변경, 새로고침 유지, 날짜 전환, 후기 작성→수정→삭제→되돌리기, 샘플 보호, 검색/저장 빈 상태를 실제 조작한다. 주요 10개 경로를 360·390·430px에서 확인한다.
- 화면 캡처: `/tmp/weeklypick-v2-qa-{chromium|webkit}` (환경변수 `TEST_ARTIFACT_DIR`로 변경 가능).

외부 폰트·아이콘 CDN은 V1과 동일하게 사용한다. WebKit 엔진 자동 검증과 미리보기 배포 후 확인까지 완료했다. 실제 iPhone Safari와 사용자 대상 사용성 검증은 별도 단계다.

## 미리보기 배포 검증 (2026-10-05)

- 미리보기: [https://weekly-pick-iq8qxx8aq-dbwowls12345-3437s-projects.vercel.app](https://weekly-pick-iq8qxx8aq-dbwowls12345-3437s-projects.vercel.app)
- 배포 ID: `dpl_8d9PUAZzEwdz9FjrjCkuFhTEhgsr` · Vercel `READY` · Preview 환경
- 프로젝트의 기존 Vercel 로그인 보호가 적용된다. 소유자 계정으로 로그인하여 확인한다.
- 로컬 WebKit: 주요 기능 및 10개 경로 × 360/390/430px 검증 통과. 실제 기기 Safari 검증과는 구분한다.
- 배포본 Chromium: 인증된 테스트 세션으로 같은 시나리오를 검증하여 통과.
- 배포 JS 4개·CSS 3개·이미지 10개: 모두 HTTP 200, 로컬 파일과 바이트 일치.
- 로컬 인증·환경 파일은 `.gitignore`, `.vercelignore`, `.dockerignore`에서 제외한다.
- 이 Preview는 아래 프로덕션 배포로 승격했다.

추가 검증 명령:

```bash
npx playwright install webkit
npm run test:webkit
TEST_BASE_URL=https://your-preview.vercel.app npm run test:browser
```

로그인 보호된 배포의 경우 `TEST_STORAGE_STATE`에 권한 있는 테스트 세션의 Playwright storage state 파일 경로를 전달한다. 인증 파일은 저장소에 넣지 않는다. Vercel 공식 CLI의 `vercel curl`로 인증된 배포 점검을 수행할 수 있다.

## 프로덕션 반영 (2026-10-05)

- 운영 주소: https://weekly-pick.vercel.app
- 배포 ID: `dpl_C6ypJDqppui6eu1xWgBZvjHaHu5s` · Production · Ready
- 검증된 Preview `dpl_8d9PUAZzEwdz9FjrjCkuFhTEhgsr`를 `vercel promote`로 승격했다.
- 운영 주소는 비로그인 요청에서 HTTP 200을 반환한다.
- 운영 주소에서 Chromium 핵심 동선·10개 경로·360/390/430px 검증 통과.
- 검증은 독립 브라우저의 localStorage에서 수행하여 사용자의 기존 저장 데이터에 영향을 주지 않는다.

## Git 통합 및 후속 UX 점검 (2026-10-05)

- [PR #1](https://github.com/jaejinu/weekly-pick/pull/1)으로 main 병합 및 자동 배포 완료. 상태 테스트와 Chromium·WebKit CI가 PR/main에서 통과했다.
- 초기 수정값을 기준으로 별점·후기·방문 요일·웨이팅의 변경 여부를 비교한다. 변경하지 않거나 원래 값으로 되돌린 수정 화면은 앱 내 뒤로가기/취소 시 불필요한 확인창을 띄우지 않는다.
- 요일이나 웨이팅만 선택한 새 후기도 버리기 전에 확인한다. 계속 작성하면 현재 입력을 유지하며, 수정 취소를 확정해도 저장된 원문은 유지한다.
- 확인창에 설명을 연결하고 배경을 inert 처리한다. Tab/Shift+Tab 순환, Escape 닫기, 호출 버튼으로 포커스 복귀를 검사한다. WebKit에서 클릭한 버튼이 activeElement가 아닐 수 있어 호출 버튼을 직접 전달한다.
- `tests/browser-review.cjs`가 위 시나리오를 두 브라우저 공통 검사에 추가한다.
- 브라우저 자체 뒤로가기·새로고침의 미저장 입력 보호와 실제 iPhone 검증은 이번 보완에 포함하지 않는다.

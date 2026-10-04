# 위클리픽 (WEEKLY PICK)

이번 주말 갈 수 있는 서울의 전시·팝업만 골라, 매주 목요일 발행하는 큐레이션 매거진 모바일웹.

**🔗 https://weekly-pick.vercel.app**

> Auto-deploy: `main` 브랜치 push 시 Vercel 자동 배포

| | |
|---|---|
| 배포 | https://weekly-pick.vercel.app |
| 저장소 | https://github.com/jaejinu/weekly-pick (private) |
| 화면 | 11개 · 해시 라우팅 · localStorage |
| 로컬 V2 | 일정 계산 · 방문 기록 · 후기 수정/삭제/되돌리기 구현 |

## 실행

### 1) Docker (권장)

```bash
docker compose up -d --build      # http://localhost:8080
docker compose down               # 종료
```

또는 Compose 없이:

```bash
docker build -t weeklypick:1.0 .
docker run -d --name weeklypick -p 8080:80 weeklypick:1.0
```

- 이미지: `nginx:1.27-alpine` 기반, 약 76MB
- 헬스체크: `GET /healthz`
- 포트 변경은 `docker-compose.yml`의 `"8080:80"`에서 앞 숫자만 바꾸면 됩니다.
- Docker Desktop CLI가 PATH에 없으면:
  `export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"`

### 2) Vercel 배포

정적 사이트라 빌드 설정이 필요 없습니다. 루트의 `vercel.json`이 캐시·보안 헤더와
해시 라우팅 폴백을 처리합니다.

```bash
npx vercel --prod      # 재배포 (로그인은 최초 1회: npx vercel login)
```

**Git 자동 배포를 켜려면** — Vercel GitHub App에 이 저장소 접근 권한을 준 뒤:

```bash
npx vercel git connect
```

권한 부여: https://github.com/apps/vercel → Configure → `jaejinu/weekly-pick` 추가

- Framework Preset은 **Other**로 두면 됩니다 (빌드 명령 없음)
- `.vercelignore`가 문서·Docker 파일을 배포에서 제외합니다
- 로그인 없이 임시 배포만 해보려면: `npx vercel deploy --temporary`

### 3) Docker 없이

```bash
python3 -m http.server 8777       # http://localhost:8777
```

빌드 과정이 없는 정적 사이트라 어떤 정적 서버로도 그대로 뜹니다.

## 구조

```
index.html
css/    tokens.css(디자인 토큰) · app.css(레이아웃) · components.css(컴포넌트)
js/     data.js(콘텐츠) · state.js(상태·파생계산) · components.js(렌더) · app.js(라우팅)
assets/images/   전시 이미지 10장
docker/ nginx.conf
vercel.json  Vercel 배포 설정 (헤더 · 라우팅)
weeklypick/  디자인 규정 · 화면상세 · 이미지 프롬프트 문서
```

## 이미지 교체

`assets/images/`의 10장은 현재 **레이아웃 확인용 임시 이미지**입니다.
`weeklypick/weeklypick-image-prompts.md`의 프롬프트로 생성한 뒤 **같은 파일명으로 덮어쓰면** 됩니다.
코드 수정은 필요 없습니다.

## 문서

| 문서 | 내용 |
|---|---|
| `weeklypick/weeklypick-design-rull.md` | 색상 토큰·타이포·컴포넌트·카드뉴스 규칙·QA 기준 |
| `weeklypick/weeklypick-project.md` | 11개 화면 상세 명세·샘플 데이터·완료 정의 |
| `weeklypick/weeklypick-image-prompts.md` | 이미지 10장 생성 프롬프트 |

## V2 구현 및 검증

Figma UX 정리를 기존 HTML/CSS/JS 구조에 반영했습니다. 2026-10-05 프로덕션에 반영했으며 운영 주소와 로컬에서 확인할 수 있습니다.

- 내 주말: 순서 변경, 10:00~15:00 시작 시각, 관람+이동 합계, 240분 초과 안내
- 저장 목록: 토요일·일요일 계획 추가
- 방문·후기: 시작 전 차단, 방문 기록 자동 저장, 내 후기 수정/삭제/되돌리기
- 후기 입력: 같은 탭에서 뒤로가기·새로고침 후 복원, 등록·취소 시 임시 입력 삭제
- 내 주말 하단의 **데모 날짜 설정**에서 9.10과 9.14를 전환
- V1 localStorage 데이터를 유지하며 후기 ID를 V2 단조 증가 ID로 마이그레이션

앱 실행에는 npm 설치가 필요 없습니다. 자동 검증을 실행할 때만 다음 명령을 사용합니다.

```bash
npm ci
npx playwright install chromium
npm test
npm run test:browser
```

브라우저 검증은 임시 로컬 서버와 독립 브라우저를 사용합니다. 기존 브라우저의 데이터에 영향을 주지 않습니다.
세부 범위와 검증 기록: [V2 구현 기록](v2/04-implementation.md).

V2 [미리보기 배포](https://weekly-pick-iq8qxx8aq-dbwowls12345-3437s-projects.vercel.app)도 준비되어 있습니다(Vercel 로그인 필요). WebKit 로컬 검증과 배포본 Chromium 검증을 통과했으며, 프로덕션 [weekly-pick.vercel.app](https://weekly-pick.vercel.app)에도 반영했습니다(로그인 불필요).

### PR 자동 검증

`main` 대상 PR과 `main` 푸시마다 GitHub Actions의 **V2 checks**가 상태 테스트와 Chromium·WebKit 브라우저 테스트를 실행합니다. 브라우저 검사는 360·390·430px에서 주요 10개 경로와 계획·후기 흐름을 확인하며, 실행 화면은 Actions의 `screenshots-chromium`, `screenshots-webkit` 아티팩트에서 7일간 받을 수 있습니다. 실패한 검사를 해결하고 모두 통과한 뒤 병합합니다.

WebKit을 로컬에서 확인하려면 `npx playwright install webkit` 후 `npm run test:webkit`을 실행하세요.

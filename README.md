# 위클리픽 (WEEKLY PICK)

이번 주말 갈 수 있는 서울의 전시·팝업만 골라, 매주 목요일 발행하는 큐레이션 매거진 모바일웹.

**🔗 https://weekly-pick.vercel.app**

| | |
|---|---|
| 배포 | https://weekly-pick.vercel.app |
| 저장소 | https://github.com/jaejinu/weekly-pick (private) |
| 화면 | 11개 · 해시 라우팅 · localStorage |
| 용량 | 18개 파일 · 1.14MB |

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

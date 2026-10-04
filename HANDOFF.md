# 위클리픽 — 세션 인수인계

> 최종 갱신 2026-10-05 · 다른 세션/도구에서 이어서 작업하기 위한 문서
> **먼저 이 문서를 읽고, 그다음 `v2/02-v2-scope.md`를 읽으세요.**

---

## 1. 지금 어디까지 왔나

| 단계 | 상태 |
|---|---|
| **V1 (Beginner MVP)** | ✅ 완료·배포됨 |
| V2 01. V1 결과물 준비 | ✅ 완료 |
| V2 02. ChatGPT와 V1 진단 | ✅ 범위 확정 (`v2/02-v2-scope.md`) · ⚠️ Codex 전달 프롬프트만 미작성 |
| V2 03. 디자인·UX 정리 | ✅ 디자인 시스템과 V1 통합, UX 보완 포함 23개 시안 |
| V2 로컬 구현 | ✅ 일정·방문·후기 흐름 구현 및 자동 검증. `v2/04-implementation.md` 참고 |
| V2 미리보기 배포 | ✅ Vercel READY · 배포본 Chromium 및 로컬 WebKit 검증 통과. 링크는 `v2/04-implementation.md` |
| V2 프로덕션 | ✅ 2026-10-05 승격 · 운영 주소 비로그인 접근 및 핵심 동선 검증 통과 |

강의 원문: https://design-engineer.net/beginner-mvp-v2.html (수강생 로그인 필요)

---

## 2. 접근 정보

| 항목 | 값 |
|---|---|
| V1 배포 (프로덕션) | https://weekly-pick.vercel.app |
| GitHub | https://github.com/jaejinu/weekly-pick (**private**, `main`) |
| Vercel 프로젝트 | `weekly-pick` / 계정 `dbwowls12345-3437` |
| 자동 배포 | ✅ `main` push → 프로덕션 자동 배포 |
| **Figma 파일** | https://www.figma.com/design/yLwb9DYMBoP0xneugWaaJd |
| Figma fileKey | `yLwb9DYMBoP0xneugWaaJd` |
| Figma 플랜 key | `team::1321723013901189367` |
| 로컬 경로 | `/Users/jaejinu/Documents/jaejinu/jaejinu/project/weekly-pick` |

**Docker 로컬 실행**
```bash
docker compose up -d --build      # http://localhost:8080
# Docker CLI가 PATH에 없으면:
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
```

---

## 3. 프로젝트 구조

```
weekly-pick/
├─ index.html                     V1 앱 (순수 HTML/CSS/JS, 빌드 없음)
├─ css/  tokens.css · app.css · components.css
├─ js/   data.js · state.js · components.js · app.js
├─ assets/images/                 전시 이미지 10장 (WebP 1448×1086)
├─ docker/nginx.conf · Dockerfile · docker-compose.yml · vercel.json
├─ weeklypick/                    ★ V1 확정 문서 (보존 대상)
│   ├─ weeklypick-design-rull.md      디자인 규정 (1,096줄)
│   ├─ weeklypick-project.md          화면상세 명세 11화면 (1,846줄)
│   └─ weeklypick-image-prompts.md    이미지 프롬프트 10개
└─ v2/
    ├─ 01-v1-feedback.md          V1 피드백·아쉬운 점
    ├─ 02-chatgpt-prompt.md       02단계 진단 프롬프트
    └─ 02-v2-scope.md             ★ V2 확정 범위 — 03~09단계의 기준
```

⚠️ **강의 07단계는 V1 문서 보존을 요구합니다.** `weeklypick/`를 덮어쓰지 말고
`docs/v1/`·`docs/v2/`로 분리하거나 동등한 백업 규칙을 따르세요.

---

## 4. V1 요약 (Figma 이전 대상)

- **11개 화면**: 홈 / 전시 탐색 / 전시 상세 / 큐레이션 기사 / 후기 피드 / 후기 상세 /
  후기 작성 / 저장 목록 / 내 주말 / 지역별 모아보기 / 아카이브
- **하단 4탭**: 홈 · 전시 · 저장 · 내 주말 (해시 라우팅 `#/home` 등)
- **기준 폭 430px** (콘텐츠 394px, 좌우 18px · 360px에서 16px)
- **색상**: 잉크 `#111111` / 테라코타 `#C8511B`(마감·경고 전용) / 흰색 `#FFFFFF` + 무채색 파생
  - 액센트 텍스트용 진한 변형 `#A8410F`, muted `#6A6A6A`
- **데이터**: 전시 10건 · 기사 3건 · 후기 6건 · 권역 4 · 태그 5 (전부 가상)
- **기준일 상수** `TODAY = 2026-09-10` (V2에서 `issueDate`/`currentDate`로 분리 예정)

---

## 5. Figma 현재 상태 (03단계)

**완료**
- 파일 생성 (`yLwb9DYMBoP0xneugWaaJd`)
- Page 5개 생성:

| Page | id | 용도 |
|---|---|---|
| `00_REFERENCE` | `0:1` | 브라우저 원본 스크린샷 |
| `01_V1_CURRENT` | `1:2` | **V1 원본 보존 — 개선 금지** |
| `02_V2_WIREFRAME` | `1:3` | V2 추가 화면 구조 |
| `03_V2_DESIGN` | `1:4` | **사용자가 직접 디자인하는 영역** |
| `04_COMPONENTS` | `1:5` | 컴포넌트 |

**미완료 — 여기서 이어서 하면 됨**
1. `00_REFERENCE`에 V1 11개 화면 스크린샷 배치
2. `01_V1_CURRENT`에 11개 화면을 **편집 가능한 Layer**로 재구성
3. 화면마다 `브라우저 원본 → Figma → 동일 크기 비교 → 수정 → 재비교` **최소 3회**

### ⚠️ 폰트 제약 (반드시 알아야 함)

| V1 사용 폰트 | Figma 가용 | 대응 |
|---|---|---|
| **Pretendard** (모든 UI·본문) | ❌ **없음** | **`Noto Sans KR`로 대체** — V1 CSS 폴백 체인에 이미 포함돼 있어 정당함 |
| Noto Serif KR (호 타이틀·전시명 H1·기사 제목) | ✅ Black/Bold/SemiBold/Medium/Regular/Light/ExtraLight | 그대로 |
| Anton (D-N·시간 합계·Vol) | ✅ Regular | 그대로 |

이 대체는 **03단계 예외 기록으로 문서에 남겨야** 합니다.

### Figma 작업 시 주의

- `use_figma` 호출 전 **반드시** `skill://figma/figma-use/SKILL.md` 로드
- `figma.root.name` 설정 불가 (문서명은 API로 변경 안 됨)
- 페이지 전환은 `await figma.setCurrentPageAsync(page)` — 한 스크립트당 1회만
- 한 호출에 논리 연산 10개 이하로 쪼갤 것
- 색상은 0–1 범위

---

## 6. V2 확정 범위 요약

전문은 `v2/02-v2-scope.md`. 핵심만:

**한 문장** — V1이 "갈 전시를 고르는 서비스"였다면, V2는 "고른 전시가 실제 주말 일정과 방문 기록으로 이어지는 서비스".

**P0 — 실행 가능한 주말 계획 + 방문 전환** (14항목)
권역 이동 pair 10개 · 기사 하드코딩 숫자 제거 · 방문 순서 · 첫 시작시각(10:00~15:00) ·
세로 타임라인 · 240분 경고를 전체 소요 기준으로 · 예약 필수 soft constraint ·
`issueDate`/`currentDate` 분리 · `upcoming|active|ended` · 날짜 프리셋(9.10 목 / 9.14 월) ·
방문 완료 · `reviewed ⇒ visited`

**P1** — 후기 수정·삭제(+ id/order 체계 변경·마이그레이션) · 스트립 라벨 정합성 ·
Loading 정합성 · 홈 서비스 메시지

**제외 20건** — 지도 API · 운영시간 · 공유 · 저장 메모 · 정렬 변경 · 온보딩 화면 등

---

## 7. 이번 세션에서 발견한 것 (반복 방지)

**V1 코드의 알려진 문제** — V2에서 처리 예정
- `.ex-card .info-strip__label`이 모든 카드에서 라벨을 숨김 (문서는 186px 슬라이더만)
- `skeletonCardHTML()`·`skeletonRowHTML()`가 `app.js`에서 **한 번도 호출 안 됨**
- `이번 주말, 갈 만한 것만`이 `<title>`에만 있고 화면에 없음
- 후기 `id`·`order`를 `state.reviews.length + 1`로 생성 → 삭제 시 중복
- 기사 산문에 이동 시간이 문장으로 박혀 있음 (`"버스로 25분 거리의..."`)
- `art-01`의 "한남 → 성수 도보 15분"은 물리적으로 불가능한 데이터
- 전시 데이터에 운영시간 필드 없음

**환경 관련**
- Vercel: 배포 URL(`weekly-pick-xxxxx.vercel.app`)은 보호됨. **공유는 `weekly-pick.vercel.app`**
- nginx/vercel 모두 CSS·JS는 `no-cache`, 이미지는 `max-age=3600`
  (파일명 고정이라 캐시하면 배포해도 옛 파일이 남았던 문제 때문)
- 이미지 교체 직후 스크린샷이 빈 화면으로 잡힐 수 있음 → 캡처 지연, 실제로는 정상
- Font Awesome **Free**에 `fa-house`·`fa-calendar-week`의 regular 변형 없음
  → 하단 탭 활성 표시는 점 인디케이터 + 라벨 굵기로 처리

---

## 8. 재개 방법

```bash
cd /Users/jaejinu/Documents/jaejinu/jaejinu/project/weekly-pick
git pull
```

그다음 이렇게 요청하시면 됩니다:

```
HANDOFF.md와 v2/02-v2-scope.md를 읽고 V2 03단계(V1 디자인 Figma 이전)를 이어서 진행해줘.
Figma 파일 키는 yLwb9DYMBoP0xneugWaaJd 이고 Page 5개는 이미 만들어져 있어.
01_V1_CURRENT에 V1 11개 화면을 편집 가능한 Layer로 재구성하면 돼.
```

**남은 작은 일 2건**
1. ChatGPT에 02단계 마지막 산출물(Codex 전달 프롬프트) 요청
2. 소스 zip(`v2/weeklypick-v1-source.zip`)에 이미지 10장이 빠져 있음 — 재생성 필요 시
   `zip -qr v2/weeklypick-v1-source.zip index.html css js assets weeklypick`

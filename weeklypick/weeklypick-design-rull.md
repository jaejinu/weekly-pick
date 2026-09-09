# 위클리픽 디자인 규정 (weeklypick-design-rull.md)

> 서비스: **위클리픽 (WEEKLY PICK)** — 주간 전시·팝업 큐레이션 매거진 모바일웹
> 버전: 1.0 · 2026-09-09
> 기준 문서: `beginner-design-rull.md` v1.0
> 이 문서는 기준 규정의 레이아웃·타이포·간격·형태·접근성·QA 기준을 **그대로 유지**하고, 승인된 3색(대표·액센트·배경)과 그 파생 토큰, 위클리픽 콘텐츠에 맞는 컴포넌트 이름·적용 예시만 교체한 것이다.

---

## 0. 기준 자료와 문서 목적

### 0.1 기준 자료

| 자료 | 역할 |
|---|---|
| `beginner-design-rull.md` | 공통 디자인 규정. 레이아웃·타이포·간격·형태·접근성·QA의 상위 기준 |
| `weeklypick-plan.md` | 학생 기획 문서. 서비스 목적·사용자·콘텐츠의 근거 |
| 이 문서 | 위클리픽 전용 디자인 규정. 색상 체계와 컴포넌트 적용 기준 |

### 0.2 자료 우선순위

1. 접근성 기준 (대비, 터치 영역, 포커스)
2. 기준 규정의 레이아웃·간격·형태 토큰
3. 이 문서의 위클리픽 색상 체계와 컴포넌트
4. 기획 문서의 콘텐츠 표현 요구

충돌하면 위 순서가 높은 쪽을 따르고, 예외는 21장 `예외 기록`에 남긴다.

### 0.3 문서의 목표

- 전시 이미지가 화면의 주인공이 되고 UI는 물러서는 매거진 톤을 만든다.
- "이번 주말에 갈 만한가"를 판단할 정보가 항상 같은 자리에 오게 한다.
- 기준 규정의 컴포넌트 계약을 깨지 않고 위클리픽 콘텐츠에 대응시킨다.

---

## 1. 디자인 방향

### 1.1 핵심 인상

- **잉크와 종이**: 무채색 지면 위에 전시 사진만 색을 낸다.
- **매거진**: 호수·발행일·에디터 한 줄이 서비스의 목소리다.
- **판단 가능한 정보**: 소요 시간·예약·요금이 카드마다 같은 순서로 붙는다.

### 1.2 구현 원칙

- 모바일 웹 우선. 430px 기준 화면을 설계 기준으로 삼는다.
- 색으로 장식하지 않는다. 색은 상태를 말할 때만 쓴다.
- 이미지가 없는 UI(필터·계획 슬롯·요약 숫자)에 억지로 이미지를 넣지 않는다.

### 1.3 네이티브 UI와 모바일 웹의 구분

- iOS 상태바와 Home Indicator를 웹 UI로 그리지 않는다.
- 하단 고정 UI는 `env(safe-area-inset-bottom)`을 반영한다.
- 브라우저 뒤로 가기와 화면 내 뒤로 가기는 같은 history를 사용한다.

---

## 2. 레이아웃 시스템

기준 규정과 **동일하다. 변경 없음.**

### 2.1 기준 폭

| 구간 | 화면 폭 | 좌우 여백 | 콘텐츠 폭 |
|---|---:|---:|---|
| Minimum | 360–389px | 16px | `100% - 32px` |
| Compact | 390–399px | 18px | `100% - 36px` |
| Reference | 400–430px | 18px | `100% - 36px` |
| Wide | 431px 이상 | 중앙 430px 셸 | 최대 394px |

- 기준 화면은 `430px`, 기본 콘텐츠 폭은 `394px`이다.
- 앱 셸은 430px를 초과하지 않고 큰 화면에서 중앙 정렬한다.
- 후기 피드의 미디어처럼 명시된 컴포넌트만 430px 전체 폭을 사용할 수 있다.
- 의도하지 않은 수평 스크롤이 발생하면 안 된다.

### 2.2 페이지 셸

```css
.app-shell {
  width: 100%;
  max-width: 430px;
  min-height: 100dvh;
  margin-inline: auto;
  color: var(--color-text-primary);
  background: var(--color-bg-app);
  overflow-x: clip;
}

.content-container {
  width: 100%;
  padding-inline: var(--space-page-x);
}

@media (max-width: 389px) { :root { --space-page-x: 16px; } }
@media (min-width: 390px) { :root { --space-page-x: 18px; } }
```

431px 이상에서 셸 밖 배경은 `--color-bg-shell-outside`(#EDEDED)를 사용해 셸 경계를 보이게 한다. 흰 배경 위 흰 셸이 경계를 잃는 것을 막기 위한 라이트 테마 파생 규칙이다.

### 2.3 세로 구조

- Header 아래 첫 콘텐츠 간격: 27–31px
- 홈의 주요 섹션 간격: `48px`
- 섹션 헤더와 콘텐츠 간격: `15px`
- 카드 Slider 기본 간격: `12px`
- 세로 리스트 기본 간격: `10–12px`
- 제목과 설명 간격: `7–8px`
- 설명과 CTA 간격: `16px`
- 하단 고정 UI가 있으면 본문에 해당 높이와 safe area만큼 패딩을 추가한다.

### 2.4 기본 섹션 구조

```html
<section class="section" aria-labelledby="pick-title">
  <header class="section-header">
    <h2 id="pick-title">이번 주 픽</h2>
    <a href="#/discover">전체보기</a>
  </header>
  <div class="section-content"><!-- 카드 --></div>
</section>
```

- Section Header의 제목은 필수, 더보기는 필요한 경우에만 둔다.
- 모든 섹션에 설명과 CTA를 강제하지 않는다.

---

## 3. 컬러 토큰

### 3.0 승인된 3색 (기획 5장 A안)

| 역할 | 토큰 | HEX | 흰 배경 대비 |
|---|---|---|---:|
| 대표 컬러 | `--color-brand-primary` | `#111111` | 18.88:1 |
| 액센트 컬러 | `--color-accent` | `#C8511B` | 4.52:1 |
| 배경 컬러 | `--color-bg-app` | `#FFFFFF` | — |

### 3.1 라이트 테마 파생 토큰

기준 규정의 토큰은 다크 기준이므로, 승인된 배경색(#FFFFFF)에 맞춰 **무채색만으로** 파생한다. 파스텔·유채 보조색은 만들지 않는다.

```css
:root {
  /* App background */
  --color-bg-app: #ffffff;
  --color-bg-app-deep: #ffffff;
  --color-bg-shell-outside: #ededed;
  --color-bg-surface: #f5f5f5;
  --color-bg-surface-strong: #ededed;
  --color-bg-surface-subtle: #fafafa;
  --color-bg-overlay: rgba(0, 0, 0, 0.42);
  --color-bg-floating: rgba(255, 255, 255, 0.92);

  /* Brand */
  --color-brand-primary: #111111;
  --color-brand-pressed: #000000;
  --color-brand-foreground: #ffffff;

  /* Accent */
  --color-accent: #c8511b;          /* 면(배지·프로그레스)에 사용 */
  --color-accent-text: #a8410f;     /* 텍스트·아이콘에 사용 (6.12:1) */
  --color-accent-pressed: #a8410f;

  /* Text */
  --color-text-primary: #111111;    /* 18.88:1 */
  --color-text-secondary: #4a4a4a;  /*  8.86:1 */
  --color-text-muted: #6a6a6a;      /*  5.41:1 (흰 배경) · 4.96:1 (회색 면) */
  --color-text-disabled: #a3a3a3;
  --color-text-white: #ffffff;
  --color-text-on-brand: #ffffff;
  --color-text-on-accent: #ffffff;  /*  4.52:1 on #C8511B */

  /* Border */
  --color-border-default: #e3e3e3;  /* 장식적 구분선 */
  --color-border-strong: #8a8a8a;   /* 기능적 경계 (3.45:1) */
  --color-border-subtle: rgba(17, 17, 17, 0.08);
  --color-border-inverse: rgba(255, 255, 255, 0.24);

  /* Semantic */
  --color-danger: #a8410f;
  --color-attention: #c8511b;
  --color-info: #4a4a4a;
}
```

### 3.2 컬러 사용 규칙

- Primary CTA와 선택 상태는 `--color-brand-primary`(잉크)를 사용한다.
- 잉크 배경 위 텍스트는 `--color-text-on-brand`(흰색)를 사용한다.
- **액센트(테라코타)는 "마감·경고"에만 사용한다.** 종료 임박 배지, D-N 수치, 4시간 초과 안내가 전부다.
- 액센트를 **텍스트나 아이콘으로 쓸 때는 반드시 `--color-accent-text`(#A8410F)** 를 사용한다. `#C8511B`는 흰 배경에서 4.52:1, 회색 면(#F5F5F5) 위에서는 4.14:1로 기준 미달이다.
- 본문 배경은 `--color-bg-app`, 카드 기본 면은 `--color-bg-surface`다.
- 더 깊은 면과 Modal은 `--color-bg-surface-strong`을 사용한다.
- 기능적 경계(미선택 칩 테두리, Outline 버튼, 입력 필드)는 `--color-border-strong`을 사용한다. `--color-border-default`는 목록 구분선처럼 장식적 용도에만 쓴다.
- 투명도는 새 색을 만들지 않고 기존 Semantic Color에 opacity를 적용한다.
- 상태를 색상 하나만으로 구분하지 않는다. 라벨, 아이콘 또는 텍스트를 함께 사용한다.

### 3.3 금지

- 승인된 3색과 위 무채색 파생 외의 색을 추가하지 않는다.
- 민트, 연두, 연분홍, 연보라, 하늘색, 연노랑, 피치 등 파스텔을 카드 배경·섹션 배경·배지·장식에 사용하지 않는다.
- 연한 보조 면이 필요하면 `--color-bg-surface` 계열 밝은 회색만 사용한다.
- 기준 규정의 라임(`#D4FF3F`)과 노랑(`#FFCC00`)은 위클리픽에서 사용하지 않는다. 라임 자리는 잉크, 경고 노랑 자리는 액센트로 치환한다.

### 3.4 배지 색상 계약

유채색 배지는 **종료 임박 1종뿐**이다.

| 배지 | 면 | 텍스트 | 아이콘 | 의미 |
|---|---|---|---|---|
| 종료 임박 | `--color-accent` | `--color-text-on-accent` | `fa-hourglass-half` | 종료일이 기준일 + 10일 이내 |
| 무료 | `--color-bg-surface` | `--color-text-primary` | `fa-ticket` | 요금 0원 |
| 예약 필수 | 투명 + `--color-border-strong` 1px | `--color-text-secondary` | `fa-calendar-check` | 사전 예약 없이 입장 불가 |
| 종료됨 | 배지 아님 — 이미지 오버레이 위 텍스트 라벨 | `--color-text-white` | — | 기준일 기준 종료 |

- 한 카드에 배지는 최대 2개까지 노출한다. 우선순위는 `종료 임박 > 무료 > 예약 필수`다.
- 배지 텍스트는 13px/600을 사용한다. 12px/400은 액센트 면 위에서 대비 여유가 부족하다.

---

## 4. 타이포그래피

### 4.1 글꼴

```css
:root {
  --font-family-ui: "Pretendard", -apple-system, BlinkMacSystemFont,
    "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
  --font-family-display: "Noto Serif KR", "Nanum Myeongjo", Georgia, serif;
  --font-family-numeral: "Anton", "Arial Narrow", sans-serif;

  --font-weight-light: 300;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

**기준 규정 4.1에 대한 예외(승인됨)** — 디스플레이 서체를 치환이 아니라 **병행**으로 둔다.

| 서체 | 용도 | 근거 |
|---|---|---|
| Pretendard | 모든 UI, 본문, 버튼, 라벨, 메타 | 기준 규정 유지 |
| Anton (`--font-family-numeral`) | `D-3`, 요일별 소요 시간 합계, 코스 합계 시간, `Vol.01` | 기준 규정의 "숫자 디스플레이" 역할을 그대로 승계 |
| Noto Serif KR (`--font-family-display`) | 호 타이틀, 전시명 H1(상세), 기사 제목 | 매거진 정체성. **추가** 역할이며 기존 역할을 밀어내지 않음 |

- Anton을 일반 본문이나 버튼에 사용하지 않는다.
- Noto Serif KR을 본문·버튼·라벨·메타에 사용하지 않는다. 위 3개 자리에만 쓴다.
- Anton 숫자는 단위와 분리하고 단위는 Pretendard로 표현한다. (`D-` 접두는 Pretendard, `3`은 Anton)
- 서체 3종 이상을 새로 추가하지 않는다.

### 4.2 타입 스케일

기준 규정과 동일한 스케일을 사용한다. 위클리픽에서 쓰지 않는 대형 수치 단계는 정의만 남기고 사용하지 않는다.

```css
:root {
  --font-size-display-count: 64px;   /* 미사용 */
  --font-size-display-stat: 36px;    /* 미사용 */
  --font-size-page-title: 30px;
  --font-size-section-title: 24px;
  --font-size-stat: 26px;
  --font-size-card-title: 20px;
  --font-size-body: 16px;
  --font-size-label: 14px;
  --font-size-meta: 12px;

  --line-height-display: 1;
  --line-height-heading: 1.2;
  --line-height-default: 1.3;
  --line-height-body: 1.45;

  --letter-spacing-heading: -0.02em;
  --letter-spacing-default: -0.03em;
}
```

| 역할 | 글꼴 | 크기/두께 | 행간 | 자간 |
|---|---|---|---:|---:|
| 호 타이틀 (홈) | Noto Serif KR | 30px/600 | 1.2 | -0.02em |
| 전시명 (상세 H1) | Noto Serif KR | 30px/600 | 1.2 | -0.02em |
| 기사 제목 | Noto Serif KR | 24px/600 | 1.3 | -0.02em |
| Hero 카드 전시명 | Noto Serif KR | 24px/600 | 1.3 | -0.02em |
| 섹션·화면 제목 | Pretendard | 24px/600 | 1.3 | -0.02em |
| D-N·시간 합계 | Anton | 26px/Regular | 1–1.3 | -0.02em |
| 카드 제목 | Pretendard | 16–20px/600 | 1.3 | -0.03em |
| 기본 본문·CTA | Pretendard | 16px/400–600 | 1.3–1.45 | -0.03em |
| 에디터 한 줄 | Pretendard | 16px/500 | 1.45 | -0.03em |
| 라벨·보조 정보 | Pretendard | 14px/400–600 | 1.3 | -0.03em |
| 메타 정보·스트립 | Pretendard | 12px/400–500 | 1.3 | -0.03em |
| 배지 | Pretendard | 13px/600 | 1.3 | -0.02em |

### 4.3 금지 및 보정 규칙

- 10px와 11px 텍스트는 사용하지 않고 최소 12px로 보정한다.
- 한 컴포넌트 안에서 같은 역할의 메타 글자 크기를 혼용하지 않는다.
- 긴 전시명 때문에 글자 크기를 줄이지 않는다. 줄 수를 제한한다.
- 기간, 요금, 소요 시간, D-N은 말줄임 처리하지 않는다.
- 전시명은 카드에서 2줄, 상세 H1에서 3줄까지 허용한다.

---

## 5. 간격, 라운드, 아이콘, 모션

기준 규정과 **동일하다. 변경 없음.**

### 5.1 간격 토큰

```css
:root {
  --space-0: 0;  --space-1: 2px;  --space-2: 4px;  --space-3: 6px;
  --space-4: 8px; --space-5: 10px; --space-6: 12px; --space-7: 14px;
  --space-8: 16px; --space-9: 18px; --space-10: 20px; --space-12: 24px;
  --space-16: 32px; --space-24: 48px;

  --space-page-x: 18px;
  --space-section-y: 48px;
  --space-slider-gap: 12px;
}
```

### 5.2 라운드 토큰

```css
:root {
  --radius-sm: 8px;  --radius-md: 12px;  --radius-card: 16px;
  --radius-media: 20px; --radius-modal: 24px;
  --radius-control: 50px; --radius-pill: 999px;
}
```

- 일반 카드: 16px / 사진 중심 카드: 20px / 보조 Surface: 12px
- Modal: 24px / CTA, Chip, Floating Navigation: pill
- 카드마다 유사하지만 다른 라운드를 새로 만들지 않는다.

### 5.3 아이콘

- 프로젝트 전체의 기능 아이콘은 **Font Awesome 6 Free**로 통일한다.
- 기본 시각 크기 24px, BottomNav 26px, 카드 내부 12–16px.
- 아이콘 버튼 터치 영역은 최소 44×44px.
- CSS 도형, 이모지, 텍스트 특수문자를 기능 아이콘으로 쓰지 않는다.
- 아이콘만 있는 버튼은 접근 가능한 이름을 제공한다.

**위클리픽 아이콘 사전** — 같은 기능에는 항상 같은 아이콘을 쓴다.

| 기능 | 아이콘 | 스타일 |
|---|---|---|
| 홈 탭 | `fa-house` | solid 고정 (활성 표시는 점 인디케이터) |
| 전시 탭 | `fa-compass` | solid 고정 |
| 저장 탭 | `fa-bookmark` | solid 고정 |
| 내 주말 탭 | `fa-calendar-week` | solid 고정 |
| 저장 토글 | `fa-bookmark` | 저장됨 solid / 미저장 regular |
| 계획 배치 여부 | `fa-calendar` | 배치됨 solid / 미배치 regular |
| 뒤로 가기 | `fa-chevron-left` | solid |
| 더보기·전체보기 | `fa-chevron-right` | solid |
| 검색 | `fa-magnifying-glass` | solid |
| 필터 초기화 | `fa-rotate-left` | solid |
| 소요 시간 | `fa-clock` | regular |
| 예약 | `fa-calendar-check` | regular |
| 요금 | `fa-won-sign` | solid |
| 무료 | `fa-ticket` | solid |
| 종료 임박 | `fa-hourglass-half` | solid |
| 장소·오시는 길 | `fa-location-dot` | solid |
| 외부 링크 | `fa-arrow-up-right-from-square` | solid |
| 별점(채움/빔) | `fa-star` solid / `fa-star` regular | — |
| 후기 남기기 | `fa-pen` | solid |
| 삭제 | `fa-trash-can` | regular |
| 토요일 배치 | `fa-arrow-right` | solid |
| 안내·주의 | `fa-circle-info` | solid |
| 아카이브 | `fa-box-archive` | solid |
| 관람 팁 | `fa-lightbulb` | regular |

### 5.4 모션

```css
:root {
  --duration-fast: 120ms;
  --duration-base: 220ms;
  --duration-slow: 360ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
}
```

- 눌림 120ms / 선택·Toggle 220ms / Modal·화면 전환 220–360ms / Slider snap 220–360ms
- `prefers-reduced-motion: reduce`에서는 자동재생과 큰 이동을 제거한다.

---

## 6. 공통 내비게이션 컴포넌트

### 6.1 AppHeader

| 속성 | 값 |
|---|---:|
| 전체 폭 | 430px |
| 높이 | 46px |
| 패딩 | 10px 18px |
| 로고 | 약 96×20px |
| 우측 아이콘 | 24px |
| 아이콘 간격 | 18px |

- 좌측에 `WEEKLY PICK` 워드마크를 둔다. 잉크 색, Pretendard 700, 자간 0.08em, 대문자.
- 우측 아이콘은 최대 2개. 홈은 검색 1개만 둔다.
- 아이콘의 실제 버튼 영역은 44×44px 이상으로 확장한다.
- Header가 고정이면 콘텐츠 시작 위치에 Header 높이를 반영한다.
- 흰 배경 위 흰 Header이므로 스크롤 시 `--color-border-default` 1px 하단 보더를 표시한다.

### 6.2 DetailHeader

| 속성 | 값 |
|---|---:|
| 콘텐츠 폭 | 394px |
| 시각 높이 | 32px |
| 실제 높이 | 최소 52px |
| 좌우 위치 | 18px |
| 제목 | 24px/600 (Pretendard) |
| 아이콘 | 24px |

- 좌측은 뒤로 가기, 우측은 화면별 행동(저장·공유)이다.
- 제목은 가운데 정렬, 한 줄 유지, 아이콘 영역을 침범하지 않는 최대 폭을 설정한다.
- 전시 상세는 이미지가 먼저 오므로 Header를 이미지 위에 투명으로 겹치고, 스크롤 시 흰 배경으로 전환한다. 투명 상태에서는 아이콘에 `rgba(0,0,0,0.42)` 원형 배경을 깔아 대비를 확보한다.

### 6.3 SectionHeader

| 속성 | 값 |
|---|---:|
| 폭 | 394px |
| 높이 | 약 30px |
| 제목 | 24px/600 |
| 더보기 | 14px/400 |

- 제목 좌측, 더보기 우측. 더보기는 텍스트 + `fa-chevron-right`.
- 더보기 터치 영역은 최소 44px 높이.
- SectionHeader와 콘텐츠 사이 15px.

### 6.4 BottomNavigation

| 속성 | 값 |
|---|---:|
| 폭 | 398px |
| 높이 | 85px |
| 좌우 여백 | 16px |
| 내부 패딩 | 16px |
| 라운드 | pill |
| 탭 수 | **4개** |

- 탭: **홈 / 전시 / 저장 / 내 주말** (기준 규정 기본값 4탭 유지)
- 아이콘과 라벨을 세로로 배치한다. 라벨 12px, 활성 600, 비활성 500.
- **라이트 테마 처리(파생 규칙)**: 배경 `rgba(255,255,255,0.92)` + `backdrop-filter: blur(12px)` + `1px solid var(--color-border-default)` + 약한 그림자. 흰 배경 위에서 경계를 잃지 않게 한다.
- 활성 탭: 잉크 텍스트 + 라벨 600 + **라벨 아래 4px 점 인디케이터**. 비활성: `--color-text-muted` + 500 + 점 없음.
  색상 하나로 구분하지 않기 위해 굵기와 점 인디케이터를 함께 사용한다.
- 아이콘은 네 탭 모두 solid로 고정한다. Font Awesome 6 **Free**에는 `fa-house`와 `fa-calendar-week`의 regular 변형이 없어
  solid/regular 대비를 활성 표시 수단으로 쓸 수 없다. (구현 검증 결과, 21장 예외 9)
- 실제 터치 영역은 탭마다 최소 44×44px.
- 현재 경로에 해당하는 탭만 활성화한다. 하위 화면(후기 피드·후기 상세·지역별·아카이브)에서는 **어떤 탭도 활성화하지 않는다.**
- `position: fixed`, 하단 safe area 포함, 본문에 하단 패딩 제공.

```css
.bottom-nav {
  position: fixed;
  left: 50%;
  bottom: calc(10px + env(safe-area-inset-bottom));
  width: min(calc(100% - 32px), 398px);
  min-height: 85px;
  transform: translateX(-50%);
  border-radius: var(--radius-pill);
  background: var(--color-bg-floating);
  border: 1px solid var(--color-border-default);
  box-shadow: 0 4px 20px rgba(17, 17, 17, 0.08);
  backdrop-filter: blur(12px);
}
```

---

## 7. 버튼, Chip, Toggle

### 7.1 Button Variant

| Variant | 기본 크기 | 스타일 | 용도 |
|---|---:|---|---|
| Primary | 394×48px | 잉크 배경, 흰 텍스트 | 핵심 CTA (`주말 계획 세우기`) |
| Secondary | 높이 48–53px | `--color-bg-surface` 배경, 잉크 텍스트 | 보조 행동 (`전체 초기화`) |
| Outline | 높이 33–44px | `--color-border-strong` 1px 테두리 | 선택 보조 (`토요일에 넣기`) |
| Compact | 높이 34px | 잉크 또는 Surface | 카드 내부 행동 |
| Text | 최소 44px 터치영역 | 배경 없음 | 더보기, 취소 |
| Icon | 44×44px 이상 | 배경 선택 | 검색, 저장, 공유 |

### 7.2 Primary Button

- 폭 콘텐츠 100%, 높이 48px, 라운드 50px
- 배경 `--color-brand-primary`, 텍스트 16px/600/`--color-text-on-brand`
- Pressed: 배경 `--color-brand-pressed`, `scale(0.99)`
- 버튼 문구는 동사 중심 한 줄. 아이콘이 있으면 간격 8px.

### 7.3 Compact Button

| 이름 | 크기 | 구현 규칙 |
|---|---:|---|
| SaveToggle | 44×44px | 아이콘 버튼. 저장됨 = solid 잉크, 미저장 = regular `--color-text-muted` |
| SlotAssign | 높이 34px | Outline, 14px/600, radius 12px. `토요일에 넣기` |
| ReviewWrite | 높이 34px | 잉크 면, 14px/600, pill. `후기 남기기` |

- 시각 높이가 44px보다 작으면 투명한 hit area를 확장한다.
- 카드 내부 행동은 카드 전체 링크와 중복하지 않는다.

### 7.4 StickyActionBar

- 화면 하단 전체 폭, 높이 88–93px
- 배경: `--color-bg-app` + 상단 `1px solid var(--color-border-default)`
  (라이트 테마 파생: 기준의 `bg-app-deep`가 흰색과 같아지므로 보더로 경계를 만든다)
- 좌우 패딩 18px, 상단 14px, 하단 `20px + safe-area` 이상
- 단일 CTA는 남은 폭 사용, 이중 CTA는 동일 폭
- **BottomNavigation과 동시에 표시하지 않는다.**

### 7.5 FilterChip

- 높이 34px, 패딩 8px 14px, 간격 6px, 글자 14px/500, 라운드 pill
- 선택: 잉크 배경 + 흰 텍스트 + `fa-check` 12px 아이콘
- 미선택: 투명 + `--color-border-strong` 1px + `--color-text-secondary`
- 카테고리가 많으면 가로 스크롤을 사용한다. 첫 칩은 좌측 18px 정렬선을 지킨다.
- 선택 상태를 색상만으로 표시하지 않는다(체크 아이콘 병행).

### 7.6 Badge와 Status Pill

- 높이 24px, 글자 13px/600, 좌우 패딩 10px, 라운드 pill
- 배경과 텍스트를 함께 사용해 상태를 표현한다. 색상 계약은 3.4 참조.
- `D-3`처럼 의미 있는 숫자는 허용한다. 장식용 순번은 사용하지 않는다.
- 카드당 최대 2개.

### 7.7 Toggle

| 속성 | 값 |
|---|---:|
| 크기 | 44×26px |
| Knob | 20×20px |
| 내부 여백 | 3px |
| 라운드 | 13px |

- On: 잉크 배경, Knob 우측 / Off: `--color-border-strong` 배경, Knob 좌측
- `button` + `aria-checked`를 실제 상태와 동기화한다.
- 위클리픽에서는 탐색 화면의 `무료만 보기` 한 곳에서만 사용한다.

### 7.8 Button State

```text
default → pressed → focus
        ↘ disabled
        ↘ loading → success | error
```

- 모바일에서 hover를 핵심 피드백으로 사용하지 않는다.
- Pressed는 밝기 또는 scale을 미세하게 변경한다.
- Focus Ring은 `2px solid var(--color-brand-primary)` + `2px offset`. 제거하지 않는다.
- Loading 상태에서 버튼 폭이 바뀌지 않게 한다.
- Disabled는 시각 상태와 실제 상호작용을 함께 차단한다. (후기 작성 등록 버튼 기본값)

---

## 8. 카드뉴스형 콘텐츠 디자인 규칙 *(위클리픽 신설 장)*

### 8.0 원칙

- **사각 박스 안에 제목과 설명만 넣는 카드를 반복하지 않는다.**
- 전시·기사·후기처럼 "무엇을 보러 가는지"가 핵심인 콘텐츠에는 **반드시 관련 이미지를 함께 쓴다.**
- 아이콘이나 단색 배경으로 이미지 역할을 대신하지 않는다.
- 반대로 필터, 숫자 요약, 계획 슬롯, 입력 폼처럼 이미지가 판단에 도움이 되지 않는 UI는 **이미지 없는 유형**을 쓴다. 억지로 카드뉴스로 만들지 않는다.
- 모든 카드를 같은 박스로 복제하지 않는다. 아래 6가지 유형 중 콘텐츠 역할에 맞는 것을 고른다.

### 8.1 카드 유형 정의

| 유형 | 사용처 | 카드 크기 | 이미지 | 라운드 |
|---|---|---:|---|---:|
| `Card/PickHero` | 홈 픽 1 | 394×426 | 카드 전체 채움 | 20px |
| `Card/ExhibitionVertical` | 홈 픽 2·3, 탐색, 저장, 지역별, 같은 권역 | 폭 186 / 목록형 394 | 상단 4:5 | 20px |
| `Card/StopHorizontal` | 기사 STOP, 최근 본 전시, 아카이브 지난 호 | 394×102 | 좌측 78×78 | 16px |
| `Card/ArticleOverlay` | 홈 기사 배너, 기사 헤드 | 394×250 | 카드 전체 채움 | 20px |
| `Card/ReviewFeed` | 후기 피드, 후기 미리보기 | 394×auto | 좌측 78×78 | 16px |
| `Card/Plain` | 필터, 스트립, 계획 슬롯, 요약 숫자, 첫 호 안내 | 394×auto | **없음** | 16px |

### 8.2 `Card/PickHero`

```text
PickHero (394×426, radius 20)
├─ Background Image (object-fit: cover, object-position: center)
├─ Scrim (하단 58% 영역, linear-gradient to top, rgba(0,0,0,0.86) → 0.58@45% → transparent)
├─ 라벨 "이번 주 픽"      12px/600 흰색, 자간 0.08em
├─ 전시명                 Noto Serif KR 24px/600 흰색, 최대 2줄
├─ 장소 · 기간            14px/400 rgba(255,255,255,0.88), 1줄
└─ 핵심 정보 스트립        높이 32, rgba(255,255,255,0.16) 면, 흰 텍스트 12px
```

- 이미지 위 텍스트는 반드시 Scrim 위에 놓는다. 텍스트 그림자만으로 해결하지 않는다.
- Scrim은 텍스트가 있는 하단 영역에 집중한다. 이미지 전체를 덮지 않는다.
- 카드 전체가 상세 링크다. 저장 버튼은 카드 **우측 상단**에 44×44px로 분리해 링크 중첩을 피한다.
- 라벨은 `PICK 1` 같은 장식 번호를 쓰지 않는다. `이번 주 픽`으로 쓴다.

### 8.3 `Card/ExhibitionVertical`

```text
ExhibitionVertical
├─ Image (4:5, radius 20 상단, object-fit: cover)
│  └─ Badge Row (좌상단 10px, 최대 2개)
├─ 전시명        16px/600, 최대 2줄
├─ 장소 · 기간   12px/400 muted, 1줄
└─ 핵심 정보 스트립 (32px, 그레이 면)
```

- 이미지와 텍스트 간격 10px, 전시명과 메타 간격 4px, 메타와 스트립 간격 8px.
- Slider형(홈 픽 2·3)은 카드 폭 186px, 430px에서 약 2.1개 노출, 간격 12px, Scroll Snap.
- 목록형(탐색·저장·지역별)은 폭 394px, 이미지 4:5를 **좌측 132px 고정 폭**으로 눕혀 세로 공간을 아낀다. 텍스트 위계와 스트립 순서는 동일하게 유지한다.
- 목록형의 텍스트 칸은 이미지 높이(165px)만큼 **늘리고**, 핵심 정보 스트립을 **이미지 하단선에 맞춰 아래로 내린다**. 텍스트가 이미지보다 짧아 카드 오른쪽 아래가 비어 보이는 문제를 막는다. 배치 라벨처럼 스트립 뒤에 오는 요소가 있으면 그 요소가 하단선을 맞춘다.
- 저장 버튼은 이미지 우측 상단 44×44px.

### 8.4 `Card/StopHorizontal`

```text
StopHorizontal (394×102, padding 12 14 12 12, radius 16)
├─ Thumb (78×78, radius 12)
└─ Text
   ├─ 라벨 (예: "첫 번째", "두 번째")  12px/600 muted
   ├─ 전시명                          16px/600, 1줄
   └─ 시각 · 요금                     12px/400, 1줄
```

- 카드 전체를 상세 링크로 사용한다.
- 라벨에 `01`, `02` 같은 장식 번호를 쓰지 않는다. 순서에 의미가 있으므로 `첫 번째`처럼 읽히는 말로 쓴다.

### 8.5 `Card/ArticleOverlay`

```text
ArticleOverlay (394×250, radius 20)
├─ Background Image
├─ Scrim (하단 60%)
├─ 카테고리 "이번 주 코스"  12px/600 흰색, 자간 0.08em
├─ 제목                    Noto Serif KR 20px/600 흰색, 최대 2줄
└─ 메타 (3곳 · 3시간 · 18,000원) 12px/400 rgba(255,255,255,0.88)
```

- 기사 헤드에서는 같은 구조를 394×280으로 확대하고 제목을 24px로 올린다.
- 이미지는 코스의 첫 전시 이미지를 재사용한다. 관련 없는 이미지를 쓰지 않는다.

### 8.6 `Card/ReviewFeed`

```text
ReviewFeed (394×auto, padding 14, radius 16, 하단 구분선)
├─ Thumb (78×78, radius 12)
└─ Text
   ├─ 전시명            14px/500 muted, 1줄
   ├─ 별점 (아이콘 5개) 14px, 숫자 병기 "4.0"
   ├─ 후기 한 줄         16px/500, 최대 2줄
   └─ 메타 (토요일 방문 · 웨이팅 있음) 12px/400 muted
```

- 별점을 색상 없이 solid/regular 아이콘 대비로 표현하고 숫자를 함께 적는다.
- 썸네일은 해당 전시 이미지를 재사용한다(같은 대상이므로 재사용 규칙에 부합).

### 8.7 `Card/Plain` — 이미지를 쓰지 않는 유형

| 사용처 | 구조 |
|---|---|
| 핵심 정보 스트립 | 3칸 균등, 각 칸 `아이콘 12px + 라벨 12px + 값 12px/600` |
| 계획 슬롯 | 요일 라벨 14px/600 + 카드 목록 + 합계(Anton 26px + 단위 Pretendard) |
| 요약 숫자 타일 | 3열, 값 Anton 26px + 라벨 12px |
| 필터 영역 | 칩 2줄 + 결과 수 |
| 첫 호 안내 | 아이콘 24px + 제목 16px/600 + 설명 14px + CTA |

- 이 유형에 장식 이미지를 넣지 않는다.
- 빈 상태에 장식 이미지를 쓸 경우 메시지보다 시각적으로 앞서지 않게 한다.

### 8.8 핵심 정보 스트립 (위클리픽 고유 계약)

```text
[fa-clock] 소요  90분   |   [fa-calendar-check] 예약  권장   |   [fa-won-sign] 요금  18,000원
```

- 순서 **소요 시간 → 예약 → 요금** 고정. 화면마다 순서를 바꾸지 않는다.
- 높이 32px, 면 `--color-bg-surface`, 라운드 8px, 3칸 균등 분할, 칸 사이 1px `--color-border-default`.
- 값은 12px/600 잉크, 라벨은 12px/400 muted.
- 무료는 `무료`, 예약 불필요는 `불필요`로 적는다. 빈칸이나 `-`를 쓰지 않는다.
- 스트립은 말줄임하지 않는다.

### 8.9 종료된 전시 카드

- 카드를 삭제하지 않는다.
- 이미지 위 `rgba(0,0,0,0.40)` 오버레이 + 중앙에 `종료됨` 라벨(16px/600 흰색). 배지가 아니다.
- 전시명과 메타는 `--color-text-muted`로 낮춘다.
- 저장 버튼을 숨긴다. 후기 남기기는 유지한다.
- 목록에서 항상 맨 아래에 배치한다.

---

## 9. 상세 정보와 데이터 컴포넌트

### 9.1 `Info/EditorNote` — 에디터 한 줄

- 섹션 제목을 두지 않고 핵심 정보 스트립 바로 아래(간격 24px)에 붙인다. 첫 화면 안에 들어와야 하기 때문이다.
- 좌측 3px `--color-brand-primary` 세로선 + 좌측 패딩 14px
- 인용 텍스트 16px/500, 최대 2줄, 행간 1.45
- 하단에 `위클리픽 에디터` 12px/400 muted
- 배경 없음. 면을 깔지 않는다.

### 9.2 `Info/TipList` — 관람 팁

- `fa-lightbulb` 16px + 항목 텍스트 14px/400
- 항목 간격 10px, `ul`/`li` 사용
- 전시당 2–3개. 4개 이상 쓰지 않는다.

### 9.3 `Info/DirectionCard` — 오시는 길

- 면 `--color-bg-surface`, 라운드 12px, 패딩 14px
- `fa-location-dot` + 장소명 16px/600 + 주소 14px/400 muted
- 하단에 Outline 버튼 `지도 앱에서 열기` + `fa-arrow-up-right-from-square`
- 실제 지도 API를 쓰지 않는다. 외부 지도 검색 링크로 연결하고 새 창 여부를 알린다.

### 9.4 `Plan/DaySlot` — 요일 슬롯

- 요일 라벨 14px/600 + 날짜 12px muted
- 배치된 전시는 `Card/StopHorizontal` 축약형(썸네일 60×60)
- 합계 행: `합계` 라벨 + Anton 26px 숫자 + Pretendard 단위
- 4시간(240분) 초과 시 합계 행을 `--color-accent-text`로 바꾸고 `fa-circle-info` + 안내 문구를 아래에 표시한다. 색만으로 알리지 않는다.

### 9.5 `Stat/SummaryTile` — 이번 주 요약

- 3열 균등, 각 타일: 값 Anton 26px + 라벨 12px muted
- 면 `--color-bg-surface`, 라운드 12px, 패딩 14px
- 값이 0이어도 타일을 숨기지 않는다.

---

## 10. Modal, Empty, Loading, Error, Toast

### 10.1 `Overlay/ConfirmModal`

| 속성 | 값 |
|---|---:|
| Modal | 340×auto (최대 320) |
| 라운드 | 24px |
| Primary | 292×52px |
| Secondary | 292×44px |

- 배경 `--color-bg-app`, 테두리 `--color-border-default`, Scrim `--color-bg-overlay`
- 제목 20px/700, 설명 14px/400 가운데 정렬
- Primary에 사용자의 현재 과업 지속 행동을 배치하고, 파괴적 행동은 Secondary Text Action으로 낮게 강조한다.
- 포커스 트랩, Escape 닫기, 포커스 복귀를 구현한다.
- 위클리픽 사용처: 저장 목록에서 전체 삭제, 후기 작성 중 이탈.

### 10.2 Loading

- 300ms 이내의 짧은 작업에는 로딩 UI를 노출하지 않는다.
- 카드 목록은 실제 카드와 같은 구조의 Skeleton을 사용한다. Skeleton 면은 `--color-bg-surface`, 애니메이션은 `prefers-reduced-motion`에서 정지한다.
- Button Loading 상태에서도 크기가 바뀌지 않는다.

### 10.3 Empty

- 빈 이유, 현재 상태, 다음 행동을 제공한다.
- 아이콘 32px `--color-text-muted` + 제목 16px/600 + 설명 14px/400 + Primary CTA
- 사용자를 탓하지 않는다. 다음 행동을 알려준다.
- 장식 이미지는 메시지보다 우선하지 않는다.

### 10.4 Error

- 원인과 사용자가 할 수 있는 행동을 함께 설명한다.
- 재시도 가능한 오류에는 재시도 버튼을 제공한다.
- 이미지 실패 시 카드 크기와 텍스트 구조를 유지하고 `--color-bg-surface` 면 + `fa-image` 아이콘으로 대체한다.
- 오류가 BottomNavigation과 화면 이동을 막지 않게 한다.

### 10.5 Toast

- 폭 `min(394px, 100% - 36px)`, 높이 48px, 라운드 pill
- 배경 `--color-brand-primary`, 텍스트 흰색 14px/500
- 하단 고정 UI 위 12px에 뜬다. 3초 후 자동 소멸.
- 되돌릴 수 있는 행동에는 우측에 `되돌리기` Text Action을 둔다.
- **저장 Toast에는 `토요일에 넣기` 액션을 함께 둔다.** (저장 → 계획 지름길)
- `aria-live="polite"` Live Region으로 알린다.

---

## 11. 이미지와 Overlay

- 실제 전시 공간 맥락이 드러나는 이미지를 사용한다.
- 원본은 **1448×1086 (4:3 가로)** 를 자르지 않고 그대로 쓰고, 컴포넌트 비율이 다르면 `object-fit: cover` + 컴포넌트별 `object-position`으로 크롭한다. 원본을 미리 자르지 않아야 화면마다 최적 크롭을 쓸 수 있다.

| 컴포넌트 | 원본에서 잘리는 양 |
|---|---|
| 카드 4:5 | 좌우 40% |
| 픽 히어로 394×426 | 좌우 30.6% |
| 전시 상세 히어로 1:1 | 좌우 25% |
| 기사 배너 394×250 | 상하 15.4% |
| 썸네일 78×78 | 좌우 25% |

| 컴포넌트 | 표시 비율 | object-position |
|---|---|---|
| `Card/PickHero` | 394×426 (≈1:1.08) | `center 40%` |
| `Card/ExhibitionVertical` (Slider) | 4:5 | `center` |
| `Card/ExhibitionVertical` (목록) | 132×165 | `center` |
| `Card/ArticleOverlay` | 394×250 (≈16:10) | `center 45%` |
| `Card/StopHorizontal` · `Card/ReviewFeed` | 78×78 (1:1) | `center` |
| 전시 상세 히어로 | 394×394 (1:1) | `center 40%` |

- 이미지 위 텍스트가 있으면 제한된 Scrim을 사용한다. 기본 Overlay는 검정 42% 기준.
- 텍스트 그림자만으로 대비 문제를 해결하지 않는다.
- WebP를 사용하고 `width`/`height`를 지정해 Layout Shift를 줄인다.
- 첫 Hero 이미지만 우선 로드하고 나머지는 `loading="lazy"`를 사용한다.
- 모든 의미 있는 이미지에 구체적인 한국어 `alt`를 제공한다. 카드 텍스트와 같은 의미를 반복하는 썸네일은 `alt=""`로 처리한다.
- 같은 이미지를 관련 없는 두 섹션에 반복 사용하지 않는다. 같은 전시의 카드·상세·후기 썸네일 재사용은 허용한다.
- 외부 이미지 URL에 의존하지 않는다.

---

## 12. Slider와 인터랙션

- 기본 간격 12px, CSS Scroll Snap 우선.
- 터치 드래그와 키보드 입력을 지원한다.
- 마지막 카드 뒤에 불필요한 빈 영역이 없어야 한다.
- 페이지 전체가 아니라 Slider 컨테이너만 가로 스크롤되어야 한다.
- Scrollbar는 시각적으로 숨기되 스크롤 기능은 유지한다.

| Slider | 카드 폭 | 430px 노출 |
|---|---:|---:|
| 이번 주 픽 (2·3) | 186px | 약 2.1개 |
| 마감 임박 | 186px | 약 2.1개 |
| 같은 권역 전시 | 186px | 약 2.1개 |
| 권역 진입 | 132px | 약 2.9개 |

- **자동재생을 사용하지 않는다.** 위클리픽의 모든 Slider는 사용자 조작 전용이다.
- Carousel은 현재 위치와 전체 개수를 스크린리더에 전달한다.

---

## 13. 화면별 조합 규칙

### 13.1 홈
`AppHeader` → `IssueTitle`(호 타이틀·발행일) → `Card/PickHero` → 픽 Slider(2·3) → `Card/ArticleOverlay` → 마감 임박 Slider → 전시 목록 → 후기 미리보기 → 권역 진입 → `BottomNavigation`
섹션 간격 48px. 첫 화면에 Header + 호 타이틀 + 픽 1의 전시명과 스트립이 들어와야 한다.

### 13.2 전시 탐색
화면 제목 → 검색 → 필터 2줄(권역 / 무료·태그) → 결과 수 → 목록형 카드 → `BottomNavigation`
필터는 sticky로 상단에 고정하고, 결과 수는 항상 보인다.

### 13.3 전시 상세
투명 `DetailHeader` → 히어로 이미지 → 배지 → 전시명(H1) → 장소·기간 → **핵심 정보 스트립** → **에디터 한 줄(섹션 제목 없음)** → 관람 팁 → 오시는 길 → 다녀온 사람들 → 같은 권역 전시 → `StickyActionBar`
430×800 첫 화면에 스트립과 에디터 한 줄까지 들어와야 한다.

### 13.4 큐레이션 기사
`DetailHeader` → `Card/ArticleOverlay`(헤드) → 본문 → STOP 카드 3 → 동선·비용 요약 → 다른 코스 2 → `StickyActionBar`

### 13.5 후기 화면
피드: `DetailHeader` → 정렬 탭 → `Card/ReviewFeed` 목록 → `BottomNavigation`(활성 없음)
상세: `DetailHeader` → 전시 카드 → 별점·한 줄·방문 정보 → 같은 전시 다른 후기 → `BottomNavigation`(활성 없음)
작성: `DetailHeader` → 전시 확인 → 별점 → 한 줄 입력 → 방문 정보 → `StickyActionBar`

### 13.6 저장·내 주말
저장: 화면 제목 → 요약 스트립 → 목록 → **인라인** Primary CTA → `BottomNavigation`
내 주말: 화면 제목 → 요약 타일 3 → 계획(토·일 슬롯) → 내 후기 → 최근 본 전시 → 아카이브 진입 → 서비스 안내 → `BottomNavigation`

**BottomNavigation과 고정 CTA를 같은 화면에 동시에 두지 않는다.** 저장 화면의 `주말 계획 세우기`는 고정 바가 아니라 목록 아래 인라인 버튼이다.

### 13.7 지역별·아카이브
지역별: `DetailHeader` → 권역 탭 → 권역 소개 → 동선 한 줄 → 카드 목록 → 탐색 연결 → `BottomNavigation`(활성 없음)
아카이브: `DetailHeader` → 현재 호 → 지난 호 목록 또는 첫 호 안내 → 발행 안내 → `BottomNavigation`(활성 없음)

---

## 14. 콘텐츠 규칙

| 요소 | 제한 |
|---|---|
| 화면 제목 | 최대 1줄 |
| 섹션 제목 | 최대 1줄 |
| 카드 제목(전시명) | 1–2줄 |
| 상세 H1 전시명 | 최대 3줄 |
| 카드 설명 | 2줄 |
| 에디터 한 줄 | 40자 이내, 2줄 |
| 후기 한 줄 | 80자 이내, 2줄 |
| CTA | 한 줄 |
| 탭 라벨 | 한 줄 |
| 메타 정보 | 한 줄 |

- 기간, 요금, 소요 시간, D-N, 결과 수는 말줄임하지 않는다.
- 장식용 `01`, `02`, `03`을 사용하지 않는다.
- D-N, 별점, 결과 수, 시간 합계처럼 의미가 있는 숫자는 사용한다.
- 버튼 문구는 `저장`, `주말 계획 세우기`, `토요일에 넣기`처럼 결과를 예상할 수 있는 동사로 쓴다.
- 에디터 한 줄은 관찰형·실용형으로 쓰고 감탄사를 쓰지 않는다.

---

## 15. 접근성

- 페이지당 하나의 H1을 사용하고 제목 단계를 건너뛰지 않는다.
- 모든 인터랙션 요소는 키보드 포커스를 받을 수 있어야 한다. Focus Ring을 제거하지 않는다.
- 기본 터치 영역 최소 44×44px, 인접 터치 대상 사이 8px 이상.
- 일반 본문 최소 4.5:1, 큰 텍스트와 UI 경계 최소 3:1.
- 상태를 색상만으로 구분하지 않는다. (배지=아이콘+텍스트, 탭=굵기+아이콘 스타일, 별점=solid/regular+숫자)
- Carousel은 현재 위치와 전체 개수를 전달한다.
- Modal은 포커스 트랩과 포커스 복귀를 구현한다.
- 저장·배치·등록 완료와 오류는 Live Region으로 알린다.
- 글자 확대 200%에서도 전시 선택 → 저장 → 계획 배치를 완료할 수 있어야 한다.
- `prefers-reduced-motion`을 존중한다.

### 15.1 확정 대비값

| 조합 | 대비 | 판정 |
|---|---:|---|
| `#111111` on `#FFFFFF` | 18.88:1 | 통과 |
| `#4A4A4A` on `#FFFFFF` | 8.86:1 | 통과 |
| `#6A6A6A` on `#FFFFFF` | 5.41:1 | 통과 |
| `#6A6A6A` on `#F5F5F5` | 4.96:1 | 통과 (스트립·요약 타일 라벨) |
| `#6A6A6A` on `#EDEDED` | 4.62:1 | 통과 |
| ~~`#767676`~~ on `#F5F5F5` | 4.17:1 | **미달 — QA 1회차에서 교체** |
| `#FFFFFF` on `#111111` | 18.88:1 | 통과 |
| `#FFFFFF` on `#C8511B` | 4.52:1 | 통과 (13px/600 사용) |
| `#A8410F` on `#FFFFFF` | 6.12:1 | 통과 |
| `#A8410F` on `#F5F5F5` | 5.62:1 | 통과 |
| `#C8511B` on `#F5F5F5` | 4.14:1 | **미달 — 텍스트로 사용 금지** |
| `#8A8A8A` on `#FFFFFF` | 3.45:1 | UI 경계 통과 |
| `#E3E3E3` on `#FFFFFF` | 1.28:1 | 장식 구분선 전용 |

---

## 16. 구현 규칙

### 16.1 컴포넌트 이름

```text
Navigation/AppHeader
Navigation/DetailHeader
Navigation/SectionHeader
Navigation/BottomNav
Button/Primary
Button/Secondary
Button/Outline
Button/Compact
Button/Icon
Chip/Filter
Badge/Status
Control/Toggle
Card/PickHero
Card/ExhibitionVertical
Card/StopHorizontal
Card/ArticleOverlay
Card/ReviewFeed
Card/Plain
Info/InfoStrip
Info/EditorNote
Info/TipList
Info/DirectionCard
Plan/DaySlot
Stat/SummaryTile
Review/RatingInput
Overlay/ConfirmModal
State/Empty
State/Skeleton
State/Error
State/Toast
```

`Component 2` 같은 이름을 사용하지 않는다.

### 16.2 HTML

- 링크 이동은 `a`, 상태 변경은 `button`을 사용한다.
- 클릭 가능한 `div`를 만들지 않는다.
- 카드 전체 링크 안에 또 다른 링크나 버튼을 중첩하지 않는다. 저장 버튼은 카드 링크 **밖**에 형제로 둔다.
- 목록은 `ul`/`li`를 사용한다.
- 기간과 발행일은 `time` 요소와 `datetime` 속성을 사용한다.
- 이미지에 `width`/`height`를 지정한다.
- 아이콘만 있는 버튼에 접근 가능한 이름을 제공한다.

### 16.3 CSS

- 이 문서의 토큰을 사용한다. 컴포넌트에 페이지 전용 값을 하드코딩하지 않는다.
- 텍스트 컨테이너에 불필요한 고정 높이를 사용하지 않는다. 고정 높이는 버튼·아이콘·미디어처럼 크기 계약이 명확한 요소에만 쓴다.
- `100vh` 대신 `100dvh`를 우선한다.
- `overflow: hidden`은 필요한 카드 내부에 한정한다.
- 앱 셸 전체를 `overflow-x: auto`로 만들지 않는다.

### 16.4 JavaScript

- 클릭, 터치 드래그, 키보드가 같은 상태 모델을 사용한다.
- Slider 이동값을 카드 개수에 하드코딩하지 않는다.
- 저장·배치·등록은 중복 제출을 방지한다.
- UI를 다시 그린 뒤 이벤트가 중복 등록되지 않게 한다(위임 방식 사용).
- 이미지와 데이터 오류가 전체 내비게이션을 막지 않게 한다.
- 실제 지도·예매가 없는 부분은 실패한 척하지 않고 명시적인 Demo 상태로 처리한다.
- 날짜 판정은 실제 시각이 아니라 **고정 기준일 상수**를 사용한다.

---

## 17. 금지 규칙

- 승인된 3색과 무채색 파생 외의 색을 추가하지 않는다.
- 파스텔톤을 카드 배경, 섹션 배경, 배지, 장식 요소에 사용하지 않는다.
- 라임(`#D4FF3F`)과 노랑(`#FFCC00`)을 사용하지 않는다.
- 액센트(`#C8511B`)를 회색 면 위 텍스트로 사용하지 않는다.
- 액센트를 장식 목적으로 남용하지 않는다. 마감·경고에만 쓴다.
- iOS 상태바와 Home Indicator를 웹 UI로 그리지 않는다.
- 10px와 11px 일반 텍스트를 사용하지 않는다.
- 아이콘의 시각 크기만큼만 터치 영역을 만들지 않는다.
- 카드마다 유사하지만 다른 라운드를 새로 만들지 않는다.
- 이미지 위 텍스트를 Scrim 없이 배치하지 않는다.
- BottomNavigation과 StickyActionBar를 같은 화면 하단에 중복하지 않는다.
- BottomNavigation과 고정 CTA를 동시에 노출하지 않는다.
- 카드뉴스형 콘텐츠를 사각 박스 + 제목 + 설명만으로 반복하지 않는다.
- 이미지가 필요한 카드에 아이콘이나 단색 배경으로 이미지를 대신하지 않는다.
- 이미지가 도움이 되지 않는 UI(필터·슬롯·요약)에 억지로 이미지를 넣지 않는다.
- 자동 Slider를 만들지 않는다.
- 장식용 번호를 정보 구조로 사용하지 않는다.
- 현재 화면과 무관하게 하단 탭을 항상 활성화하지 않는다.
- 이모지를 기능 아이콘으로 사용하지 않는다.
- 외부 이미지 URL에 의존하지 않는다.
- 가상 전시·장소를 실제 정보처럼 표현하지 않는다.

---

## 18. QA 체크리스트

### 18.1 필수 화면 폭
360px / 390×844px / 430×932px / 431px 이상 중앙 430px 셸

### 18.2 시각 QA
- 좌우 18px 정렬선이 일관적인가?
- 홈 섹션 간격이 48px로 유지되는가?
- 카드 폭과 Slider 노출 수가 규정과 맞는가?
- 이미지의 피사체와 텍스트가 잘리지 않는가?
- BottomNavigation이 콘텐츠를 가리지 않는가?
- 핵심 정보 스트립의 3칸 순서가 모든 화면에서 같은가?
- Anton 수치가 바뀌어도 레이아웃이 흔들리지 않는가?
- 흰 배경 위에서 BottomNav와 StickyActionBar의 경계가 보이는가?
- 승인된 3색과 무채색 외의 색이 화면에 없는가?

### 18.3 인터랙션 QA
- 카드 전체 링크와 내부 저장 버튼이 충돌하지 않는가?
- Slider가 터치와 키보드로 동작하는가?
- 마지막 Slider 뒤에 빈 영역이 없는가?
- 뒤로 가기가 올바른 history를 사용하는가?
- 저장 Toast의 `토요일에 넣기`가 실제로 슬롯에 배치되는가?
- 필터 0건에서 버튼 2개가 모두 동작하는가?
- 4시간 초과 안내가 색상 외 텍스트로도 전달되는가?
- 중복 제출이 차단되는가?

### 18.4 접근성 QA
- 터치 영역이 최소 44×44px인가?
- Focus Ring이 보이는가?
- 텍스트와 배경 대비가 15.1 표를 만족하는가?
- 이미지 대체 텍스트가 적절한가?
- 200% 확대에서 핵심 과업을 완료할 수 있는가?
- 모션 감소 설정을 존중하는가?
- 스크린리더가 Slider, Toggle, Modal, 별점, 시간 합계를 이해할 수 있는가?

### 18.5 자동 검증
- 홈 → 전시 → 저장 → 내 주말 기본 이동을 확인한다.
- 390px과 430px에서 수평 스크롤 여부를 확인한다.
- 긴 한글 전시명, 이미지 실패, 빈 데이터를 테스트한다.
- 콘솔 오류 0건을 확인한다.

---

## 19. 완료 정의

- 이 문서의 토큰과 컴포넌트를 사용했다.
- 430px 기준 시각 언어를 유지했다.
- 390px과 360px에서 레이아웃을 검증했다.
- Default, Pressed, Focus, Disabled, Loading 상태를 필요한 범위에서 구현했다.
- 빈 상태와 오류 상태를 구현했다.
- 터치 영역, 대비, 포커스, 대체 텍스트를 확인했다.
- 긴 텍스트와 이미지 실패를 확인했다.
- BottomNavigation과 고정 CTA가 콘텐츠를 가리지 않는다.
- 화면별 예외를 21장에 기록했다.

---

## 20. 변경 관리

- 버전은 `Major.Minor` 형식으로 관리한다.
- 토큰 삭제, 컴포넌트 구조 변경, 접근성 기준 변경은 Major 변경이다.
- Variant 추가, 새 화면 조합, 설명 보완은 Minor 변경이다.
- 변경 시 날짜, 이유, 영향받는 컴포넌트를 기록한다.

---

## 21. 기준 규정 예외 기록

| # | 기준 규정 항목 | 위클리픽 처리 | 근거 | 승인 |
|---|---|---|---|---|
| 1 | 3장 다크 컬러 토큰 | 배경 `#FFFFFF` 기준 라이트 토큰으로 파생. 무채색만 사용 | 승인된 배경색이 흰색이라 다크 토큰이 그대로는 동작하지 않음 | 승인 |
| 2 | 3장 라임 Primary | 잉크 `#111111`로 치환 | 승인된 대표 컬러 | 승인 |
| 3 | 3장 warning `#FFCC00` | 액센트 `#C8511B`로 치환 | 흰 배경 대비 1.51:1로 사용 불가. 선택하지 않은 유채색 추가 금지 | 승인 |
| 4 | 4.1 Anton 단일 디스플레이 | Anton 유지 + Noto Serif KR 병행 | 위클리픽에도 D-N·시간 합계 등 숫자 디스플레이가 실재. 매거진 정체성을 위해 세리프를 추가 역할로 둠 | 승인 |
| 5 | 6.4 BottomNav 배경 `rgba(0,0,0,.72)` | `rgba(255,255,255,.92)` + 보더 + 그림자 | 흰 배경에서 경계 확보 | 승인 |
| 6 | 7.4 StickyActionBar 배경 `bg-app-deep` | `bg-app` + 상단 보더 | 라이트 테마에서 두 값이 같아짐 | 승인 |
| 7 | 저장 화면 하단 CTA | 고정 바가 아닌 목록 아래 인라인 버튼 | 기준 규정 "BottomNav와 하단 CTA 동시 노출 금지" 준수 | 승인 |
| 8 | 신설 8장 카드뉴스형 규칙 | 기준 규정에 없던 장을 신설 | 학생용 지시서 7.1 요구 | 승인 |
| 9 | BottomNav 활성 = solid 아이콘 | 점 인디케이터 + 라벨 600으로 대체, 아이콘은 solid 고정 | FA6 Free에 `fa-house`·`fa-calendar-week`의 regular 변형이 없어 박스 글리프가 표시됨. QA 1회차에서 확인 | 구현 근거 |
| 10 | 좁은 카드의 스트립 라벨 | 186px 슬라이더 카드에서 시각 라벨을 숨기고 값만 노출. `.sr-only` 라벨은 유지 | 3칸 라벨+값이 186px에서 겹침. 스트립 순서와 스크린리더 정보는 그대로 유지 | 구현 근거 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|---|---|---|
| 1.0 | 2026-09-09 | `beginner-design-rull.md` v1.0을 기준으로 위클리픽 전용 디자인 규정 작성. 승인된 3색과 라이트 파생 토큰 적용, 카드뉴스형 콘텐츠 규칙 신설 |

# 03단계 — V1 Figma 이전 및 V2 Wireframe 제작 지시서

> 출처: 02단계 ChatGPT 산출물 · 접수 2026-09-09
> 이 문서는 03·04단계 작업의 단일 기준이다.

## 핵심 원칙 3줄

1. `01_V1_CURRENT`는 **현재 V1의 박제본**이다. 보기 좋게 고치지 않는다.
2. `02_V2_WIREFRAME`은 **확정된 V2 구조 변화만** 검증한다. 새 디자인을 만들지 않는다.
3. 완료 기준: **"V1이 정확히 보존되어 있고, V2에서 달라지는 핵심 구조만 별도로 비교할 수 있는 상태"**

## 자료 우선순위

**V1 이전 시** 배포 URL → V1 소스 → `weeklypick-project.md` → `weeklypick-design-rull.md`
→ 배포본과 문서가 다르면 **배포된 실제 화면을 그대로 기록**한다. 임의로 고치지 않는다.

**V2 Wireframe 시** `v2/02-v2-scope.md` → 이 지시서 → project.md → design-rull.md → V1 구현

## 01_V1_CURRENT — 금지 목록

간격/폰트/색상/위치 수정 · 문구 개선 · 정보 추가·삭제 · V2 기능 선반영 ·
문서에 맞추려 구현 수정 · 보기 좋게 재디자인 · **스크린샷 한 장으로 붙이기**

## V1 Frame 11개

| Frame 이름 | route |
|---|---|
| `V1 / 01 Home` | `#/home` |
| `V1 / 02 Discover` | `#/discover` |
| `V1 / 03 Exhibition Detail` | `#/exhibition/ex-01` |
| `V1 / 04 Article` | `#/article/art-01` |
| `V1 / 05 Review Feed` | `#/reviews` |
| `V1 / 06 Review Detail` | `#/review/rv-01` |
| `V1 / 07 Review Write` | `#/review/new/ex-01` |
| `V1 / 08 Saved` | `#/saved` |
| `V1 / 09 My Weekend` | `#/my` |
| `V1 / 10 Regions` | `#/regions` |
| `V1 / 11 Archive` | `#/archive` |

430px 기준. 긴 화면은 전체 스크롤 영역까지. BottomNav·StickyActionBar·Slider·카드 구조 보존.

## 02_V2_WIREFRAME — 딱 6가지만

세로 타임라인 · 첫 시작 시각 입력 · 방문 완료 상태 · 데모 날짜 프리셋 ·
후기 수정·삭제 · 시작 전 전시 상세 안내

**제외(별도 화면 만들지 않음)**: 스트립 라벨 정합성 · Loading 정합성 · 홈 서비스 메시지 ·
`곧 끝나요` 문구 · D-0 `오늘까지` → 모두 05단계 V2 Design에서 반영

**스타일**: Grayscale · 이미지는 Placeholder · 컬러 금지 · 장식 금지 · 430px · Auto Layout

### Wireframe Frame 10개
```
V2-WF / 01 My Weekend / Planning / 09.10
V2-WF / 02 My Weekend / Recap / 09.14
V2-WF / 03 My Weekend / Visited State
V2-WF / 04 Exhibition Detail / Upcoming
V2-WF / 05 Exhibition Detail / Ended + Not Visited
V2-WF / 06 Exhibition Detail / Visited
V2-WF / 07 Review Detail / Mine
V2-WF / 08 Review / Edit
V2-WF / 09 Review / Delete Confirm
V2-WF / 10 Review / Deleted + Undo
```

### 타임라인 필수 정보
시작 예상 시각 · 전시명 · 관람 시간 · 종료 예상 시각 · 구간 예상 이동 시간 ·
방문 순서 · 순서 변경 · 계획 제거 · 다른 요일 이동
→ **자동 계산값과 사용자 입력값을 시각적으로 구분**

### 일정 요약 (명칭 `관람 합계` 사용 금지)
```
전체 소요 3시간 40분
관람 2시간 45분 / 이동 55분
11:00 시작 → 14:40 종료 예상
```

### 첫 시작 시각
10:00~15:00, 30분 단위. 각 전시 개별 시각 입력 UI 없음.

### 예약 필수
계산에 포함하되 계산된 시각을 실제 예약 시각으로 표현하지 않음. 예약 시각 입력 UI 없음.

### 상태 규칙
`reviewed ⇒ visited` / `visited ≠ reviewed` / 후기 삭제해도 `visited` 유지 /
수정·삭제는 `mine === true`에만

## 03_V2_DESIGN
비워둔다. 상단에 안내 Frame만: `V2 DESIGN / Wireframe 승인 후 진행 / Do not design in this step`

## 04_COMPONENTS

**V1** Navigation/AppHeader · DetailHeader · BottomNav · Card/PickHero ·
Card/ExhibitionVertical · Card/StopHorizontal · Card/ArticleOverlay · Card/ReviewFeed ·
Info/InfoStrip · Info/EditorNote · Plan/DaySlot · State/Empty · State/Toast · Overlay/ConfirmModal

**V2 신규** DemoDatePreset · Plan/StartTimeSelect · Plan/Timeline · Plan/TimelineStop ·
Plan/TravelSegment · Plan/TimelineSummary · Plan/DurationWarning · Visit/Action ·
Visit/CompletedStatus · Exhibition/UpcomingNotice · Exhibition/ReservationNotice ·
Review/MyActions · Review/EditState

## Prototype 흐름 4개
계획(시각 선택→타임라인→순서 변경→종료 시각 변경) / 날짜(9.10→9.14) /
방문(다녀왔어요→완료→후기) / 후기(수정·삭제→피드→Undo)

## 최종 보고 형식
1. 생성한 Figma Page  2. 이전한 V1 화면 11개  3. V1 구현·문서 불일치
4. V2 Wireframe 목록  5. Component·Variant 목록  6. Prototype 흐름  7. 미결정 사항

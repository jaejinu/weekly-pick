# 위클리픽 이미지 생성 프롬프트 (10장)

> 저장 위치: `assets/images/`
> 형식: **WebP**, 원본 **1448×1086 (4:3 가로)** · 전량 200KB 이하
> 개수: **정확히 10장** — 가상 전시 10개와 1:1 대응
>
> **원본 비율 안내**: 최초 계획은 4:5 세로였으나 실제 생성물이 4:3 가로다.
> 원본을 자르지 않고 그대로 두고, 컴포넌트별 크롭은 CSS `object-fit: cover` +
> `object-position`이 처리한다(디자인 규정 11장). 4:3 원본이 기사 배너(16:10)에는
> 오히려 유리하고, 화면마다 다른 크롭을 쓸 수 있어 원본 손실이 없다.

## 공통 규칙 (모든 프롬프트에 적용)

- 사진 스타일. 일러스트, 3D 렌더, 과장된 AI 스타일 금지
- 한국 도심의 실내 전시·팝업 공간 맥락
- **이미지 안에 글자, 로고, 간판 텍스트, 실제 작품 재현 없음**
- 인물은 얼굴이 식별되지 않게(뒷모습, 실루엣, 원경)
- 자연광 또는 전시 조명. 과도한 채도·HDR·비네팅 금지
- 화면에서 4:5, 1:1, 16:10으로 크롭되므로 **중앙에 여유를 두고 구성**
- 4:5 카드에서는 좌우 40%가 잘린다. 핵심 피사체를 가운데 60% 안에 둘 것

**Negative (공통):** `text, letters, korean text, signage, watermark, logo, poster text, distorted faces, extra fingers, oversaturated, HDR, heavy vignette, cartoon, 3d render, illustration`

---

## img-01 · `ex-01-light-room.webp`
**전시:** 빛의 방 — 미디어아트 기획전 (한남·용산, 픽 1)
**용도:** 홈 픽 히어로(394×426), 홈 기사 배너(394×250), 전시 상세(1:1), 아카이브 썸네일

```
Photo of a dark contemporary media art exhibition room in Seoul. Large abstract light patterns
flow across the entire wall, soft blue and warm white gradients projected onto a matte surface.
Two visitors seen only as dark silhouettes from behind, standing apart, looking at the wall.
Polished concrete floor reflecting a little of the projected light. Wide interior shot,
deep shadows, no visible text or signage. Cinematic, calm, 35mm lens, natural exhibition lighting.
```

---

## img-02 · `ex-02-alley-photo.webp`
**전시:** 골목의 기록: 북촌 사진전 (종로·북촌, 픽 2)
**용도:** 홈 픽 2, 마감 임박, 전시 상세, 탐색, 저장, 후기 썸네일

```
Photo of a small photography exhibition inside a renovated Korean hanok gallery in Bukchon, Seoul.
A row of framed black and white photographs hangs evenly on a clean white plaster wall.
Daylight enters from a traditional wooden lattice window on the left, casting soft shadows
on the wooden floor. No people. Quiet, intimate, warm neutral tones, 35mm lens.
The photographs themselves are abstract and indistinct, no readable content.
```

---

## img-03 · `ex-03-paper-popup.webp`
**전시:** 성수 종이 공방 팝업 (성수·건대, 픽 3)
**용도:** 홈 픽 3, 기사 art-03 헤드, 전시 상세, 탐색, 지역별, 기사 STOP

```
Photo of a paper craft pop-up studio inside a converted red brick warehouse in Seongsu, Seoul.
Dozens of folded white and cream paper objects hang from the ceiling on thin threads.
A long wooden worktable below holds paper sheets, scissors and small folded shapes.
Exposed brick wall and steel beams. Warm afternoon daylight from a large window on the right.
No people, no text. Craft, tactile, natural light, 35mm lens.
```

---

## img-04 · `ex-04-hanji-lantern.webp`
**전시:** 한지 등불 워크숍 (종로·북촌)
**용도:** 마감 임박, 전시 상세, 탐색, 지역별

```
Photo of a hanji paper lantern workshop space in a traditional Korean wooden room.
About twenty round and cylindrical paper lanterns glow softly on a dark wooden floor
and low tables, warm amber light passing through the textured paper.
Sliding paper doors in the background, dim ambient light. No people, no text.
Warm, quiet, shallow depth of field, 50mm lens.
```

---

## img-05 · `ex-05-vintage-poster.webp`
**전시:** 한남 빈티지 포스터 마켓 (한남·용산)
**용도:** 마감 임박, 전시 상세, 탐색, 지역별, 기사 STOP, 후기 썸네일

```
Photo of a vintage poster market inside a small hall in Hannam, Seoul.
A wall densely covered with old faded printed posters in muted reds, blues and creams,
their designs abstract and blurred, no readable text. In the foreground a wooden table
holds stacks of loose prints, and a pair of hands is flipping through them.
Only the hands and forearms visible. Warm indoor light, slight film grain, 35mm lens.
```

---

## img-06 · `ex-06-small-book.webp`
**전시:** 연남 작은 책 박람회 (홍대·연남)
**용도:** 기사 art-02 헤드, 전시 상세, 탐색, 지역별, 기사 STOP, 후기 썸네일

```
Photo of a small independent book fair inside a narrow bookshop in Yeonnam-dong, Seoul.
Wooden shelves and tables filled with slim independent publications and zines,
their covers plain and abstract with no readable text. Three or four visitors
seen from behind, browsing at different tables. Warm tungsten light mixed with
daylight from the shop front. Cozy, crowded, 35mm lens, natural candid framing.
```

---

## img-07 · `ex-07-ceramic.webp`
**전시:** 흙과 손 — 도자 소품전 (성수·건대)
**용도:** 전시 상세, 탐색, 지역별, 기사 STOP, 후기 썸네일

```
Photo of a small ceramics exhibition in a minimal concrete gallery in Seongsu, Seoul.
Handmade ceramic cups, small bowls and vases in earth tones — sand, grey, muted terracotta —
arranged with wide spacing on raw concrete shelves. Soft natural daylight from a side window
creating gentle shadows. No people, no text. Quiet, minimal, 50mm lens, shallow depth of field.
```

---

## img-08 · `ex-08-photo-window.webp`
**전시:** 창밖 서울 — 사진 기획전 (홍대·연남)
**용도:** 전시 상세, 탐색, 지역별

```
Photo of a photography gallery interior next to a large floor-to-ceiling window in Seoul.
Several unframed large photographic prints mounted flat on a white wall beside the window,
their images abstract and indistinct. Late afternoon city light comes through the glass,
and a faint reflection of low-rise buildings appears on the print surfaces.
No people, no text. Bright, airy, slightly cool tones, 35mm lens.
```

---

## img-09 · `ex-09-sound.webp`
**전시:** 소리의 방 — 사운드 설치 (한남·용산, 종료됨)
**용도:** 전시 상세(종료 오버레이), 탐색 맨 아래, 지역별

```
Photo of a dark sound installation room in Seoul. Several black speakers and cone-shaped
acoustic elements hang from the ceiling at different heights. One visitor sits alone on a
low bench in the center, seen from behind as a dark silhouette, head slightly tilted up.
Only a faint pool of light on the floor. Deep blacks, minimal, contemplative,
no text, 35mm lens, long exposure feel.
```

---

## img-10 · `ex-10-textile.webp`
**전시:** 실과 결 — 텍스타일 팝업 (성수·건대)
**용도:** 전시 상세, 탐색, 지역별, 기사 STOP

```
Photo of a textile pop-up space in a bright white studio in Seongsu, Seoul.
Large rolls of woven fabric in natural linen, oatmeal and muted rust tones stand upright
against one wall, while two woven tapestries hang from a ceiling rail.
A low table holds folded fabric swatches. Bright, even natural daylight from large windows.
No people, no text. Clean, tactile, material-focused, 35mm lens.
```

---

## 생성 후 적용 절차 (완료됨 · 2026-09-09)

1. 위 프롬프트로 10장을 생성한다.
2. 자르지 말고 원본 그대로 WebP로 변환한다. (파일당 200KB 이하 권장)
   `cwebp -q 80 -m 6 -metadata none 원본.png -o ex-01-light-room.webp`
3. 지정된 파일명 그대로 `assets/images/`에 저장한다.
4. 브라우저에서 홈 → 전시 탐색 → 전시 상세 → 기사 → 후기 순으로 열어 10장이 모두 보이는지 확인한다.
5. 파일이 없어도 레이아웃은 깨지지 않는다. 카드 크기를 유지한 대체 Surface가 표시된다.

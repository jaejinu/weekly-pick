/* 위클리픽 컴포넌트 렌더 — weeklypick-project.md 11장 계약 */

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ---------- 이미지 (실패 시 카드 구조 유지) ---------- */
function imageTag(src, alt, w, h) {
  // Small fixed-size cards crop 4:3 sources with object-fit: cover. Account for
  // the cropped width so high-density screens do not receive undersized images.
  const match = w <= 186 && /^assets\/images\/(ex-[a-z0-9-]+)\.webp$/.exec(src);
  const responsive = match ? ' srcset="' + [320, 640, 960].map(function (width) {
    return 'assets/images/responsive/' + match[1] + '-' + width + '.webp ' + width + 'w';
  }).concat(src + ' 1448w').join(', ') + '" sizes="' + Math.ceil(Math.max(w, h * 4 / 3)) + 'px"' : '';
  return '<img src="' + esc(src) + '" alt="' + esc(alt) + '" width="' + w + '" height="' + h +
    '"' + responsive + ' loading="lazy" decoding="async" onerror="onImageError(this)">';
}
function imageTagEager(src, alt, w, h) {
  return '<img src="' + esc(src) + '" alt="' + esc(alt) + '" width="' + w + '" height="' + h +
    '" decoding="async" onerror="onImageError(this)">';
}
function onImageError(img) {
  if (img.hasAttribute('srcset')) {
    const original = img.getAttribute('src');
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.src = original;
    return;
  }
  const box = img.parentNode;
  if (!box || box.querySelector('.img-fallback')) return;
  img.remove();
  const fb = document.createElement('div');
  fb.className = 'img-fallback';
  fb.setAttribute('role', 'img');
  fb.setAttribute('aria-label', '이미지를 불러오지 못했어요');
  fb.innerHTML = '<i class="fa-regular fa-image" aria-hidden="true"></i>';
  box.appendChild(fb);
}

/* ---------- Badge/Status ---------- */
function badgeHTML(b) {
  return '<span class="badge badge--' + b.kind + '">' +
    '<i class="fa-solid ' + b.icon + '" aria-hidden="true"></i>' + esc(b.label) + '</span>';
}
function badgeRowHTML(ex, onImage) {
  const list = badgesOf(ex);
  if (!list.length) return '';
  return '<div class="badge-row' + (onImage ? ' badge-row--on-image' : '') + '">' +
    list.map(badgeHTML).join('') + '</div>';
}

/* ---------- Info/InfoStrip ---------- */
function infoStripHTML(ex, variant) {
  const cells = [
    { icon: 'fa-regular fa-clock', label: '소요', sr: '소요 시간', value: ex.duration + '분' },
    { icon: 'fa-regular fa-calendar-check', label: '예약', sr: '예약', value: ex.booking },
    { icon: 'fa-solid fa-won-sign', label: '요금', sr: '요금', value: priceLabel(ex) }
  ];
  const cls = 'info-strip' +
    (variant === 'image' ? ' info-strip--on-image' : '') +
    (variant === 'detail' ? ' info-strip--detail' : '');
  return '<div class="' + cls + '">' + cells.map(function (c) {
    return '<div class="info-strip__cell">' +
      '<i class="' + c.icon + '" aria-hidden="true"></i>' +
      '<span class="sr-only">' + c.sr + '</span>' +
      '<span class="info-strip__label" aria-hidden="true">' + c.label + '</span>' +
      '<span class="info-strip__value">' + esc(c.value) + '</span></div>';
  }).join('') + '</div>';
}

/* ---------- 저장 버튼 ---------- */
function saveButtonHTML(ex) {
  if (isClosed(ex)) return '';
  const on = isSaved(ex.id);
  return '<button type="button" class="card-save" data-action="toggle-save" data-id="' + ex.id +
    '" aria-pressed="' + on + '" aria-label="' + esc(ex.title) + ' ' + (on ? '저장 해제' : '저장') + '">' +
    '<i class="fa-' + (on ? 'solid' : 'regular') + ' fa-bookmark" aria-hidden="true"></i></button>';
}

/* ---------- Card/PickHero ---------- */
function pickHeroHTML(ex) {
  return '<div class="pick-hero">' +
    '<a class="pick-hero__link" href="#/exhibition/' + ex.id + '">' +
      imageTagEager(ex.image, ex.alt, 394, 426) +
      '<span class="pick-hero__scrim"></span>' +
      '<span class="pick-hero__body">' +
        '<span class="pick-hero__label">이번 주 픽</span>' +
        '<span class="pick-hero__title">' + esc(ex.title) + '</span>' +
        '<span class="pick-hero__meta">' + esc(venueAndPeriod(ex)) + '</span>' +
        '<span class="pick-hero__strip">' + infoStripHTML(ex, 'image') + '</span>' +
      '</span>' +
    '</a>' + saveButtonHTML(ex) + '</div>';
}

/* ---------- Card/ExhibitionVertical ---------- */
function exhibitionCardHTML(ex, variant, extraHTML) {
  const closed = isClosed(ex);
  const cls = 'ex-card ex-card--' + (variant === 'row' ? 'row' : 'slide') + (closed ? ' ex-card--closed' : '');
  const size = variant === 'row' ? [132, 165] : [186, 232];
  return '<article class="' + cls + '">' +
    '<a class="ex-card__link" href="#/exhibition/' + ex.id + '">' +
      '<span class="ex-card__media">' +
        imageTag(ex.image, ex.alt, size[0], size[1]) +
        (closed ? '<span class="ex-card__closed-label">종료됨</span>' : '') +
        (closed ? '' : '<span class="ex-card__badges">' + badgeRowHTML(ex, true) + '</span>') +
      '</span>' +
      '<span class="ex-card__body">' +
        '<span class="ex-card__title">' + esc(ex.title) + '</span>' +
        '<span class="ex-card__meta">' + esc(venueAndPeriod(ex)) + '</span>' +
        '<span class="ex-card__strip">' + infoStripHTML(ex) + '</span>' +
        (extraHTML || '') +
      '</span>' +
    '</a>' + saveButtonHTML(ex) + '</article>';
}

/* ---------- Card/StopHorizontal ---------- */
function stopCardHTML(ex, label, meta, opts) {
  const o = opts || {};
  const inner =
    '<span class="stop-card__thumb">' + imageTag(ex.image, '', 78, 78) + '</span>' +
    '<span class="stop-card__body">' +
      (label ? '<span class="stop-card__label">' + esc(label) + '</span>' : '') +
      '<span class="stop-card__title">' + esc(ex.title) + '</span>' +
      '<span class="stop-card__meta">' + esc(meta) + '</span>' +
    '</span>';
  const cls = 'stop-card' + (o.compact ? ' stop-card--compact' : '');
  if (o.href === null) return '<div class="' + cls + '">' + inner + '</div>';
  return '<a class="' + cls + '" href="' + (o.href || ('#/exhibition/' + ex.id)) + '">' + inner + '</a>';
}

/* ---------- Card/ArticleOverlay ---------- */
function articleCardHTML(article, isHead) {
  const hero = getExhibition(article.heroExhibitionId);
  const stops = articleStops(article);
  const meta = stops.length + '곳 · 관람 ' + minutesLabel(articleViewMinutes(article)) +
    ' · ' + (articleCost(article) === 0 ? '0원' : articleCost(article).toLocaleString('ko-KR') + '원');
  const body =
    '<span class="article-card__scrim"></span>' +
    '<span class="article-card__body">' +
      '<span class="article-card__cat">' + esc(article.category) + '</span>' +
      '<span class="article-card__title">' + esc(article.title) + '</span>' +
      '<span class="article-card__meta">' + esc(meta) + '</span>' +
    '</span>';
  const img = isHead
    ? imageTagEager(hero.image, hero.alt, 394, 280)
    : imageTag(hero.image, hero.alt, 394, 250);
  if (isHead) {
    return '<div class="article-card article-card--head">' + img + body + '</div>';
  }
  return '<a class="article-card" href="#/article/' + article.id + '">' + img + body + '</a>';
}

/* ---------- 별점 ---------- */
function ratingHTML(value, size) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += '<i class="fa-' + (i <= value ? 'solid' : 'regular') + ' fa-star" aria-hidden="true"></i>';
  }
  return '<span class="rating' + (size === 'lg' ? ' rating--lg' : '') + '">' +
    '<span class="rating__stars">' + stars + '</span>' +
    '<span class="rating__num">' + value + '.0</span>' +
    '<span class="sr-only">5점 만점에 ' + value + '점</span></span>';
}

/* ---------- Card/ReviewFeed ---------- */
function reviewCardHTML(review) {
  const ex = getExhibition(review.exhibitionId);
  if (!ex) return '';
  const meta = review.day + ' 방문 · 웨이팅 ' + (review.waiting ? '있음' : '없음') +
    (review.mine ? ' · 내 후기' : review.member ? ' · 회원 후기' : ' · 샘플 후기');
  return '<a class="review-card" href="#/review/' + review.id + '">' +
    '<span class="review-card__thumb">' + imageTag(ex.image, '', 78, 78) + '</span>' +
    '<span class="review-card__body">' +
      '<span class="review-card__ex">' + esc(ex.title) + '</span>' +
      ratingHTML(review.rating) +
      '<span class="review-card__text">' + esc(review.text) + '</span>' +
      '<span class="review-card__meta">' + esc(meta) + '</span>' +
    '</span></a>';
}

/* ---------- Info/EditorNote ---------- */
function editorNoteHTML(ex) {
  return '<div class="editor-note">' +
    '<p class="editor-note__text">' + esc(ex.editorLine) + '</p>' +
    '<p class="editor-note__by">위클리픽 에디터</p></div>';
}

/* ---------- Info/TipList ---------- */
function tipListHTML(ex) {
  return '<ul class="tip-list">' + ex.tips.map(function (t) {
    return '<li><i class="fa-regular fa-lightbulb" aria-hidden="true"></i><span>' + esc(t) + '</span></li>';
  }).join('') + '</ul>';
}

/* ---------- Info/DirectionCard ---------- */
function directionCardHTML(ex) {
  const q = encodeURIComponent(ex.venue + ' ' + ex.address);
  return '<div class="direction-card">' +
    '<div class="direction-card__head">' +
      '<i class="fa-solid fa-location-dot" aria-hidden="true"></i>' +
      '<div><p class="direction-card__venue">' + esc(ex.venue) + '</p>' +
      '<p class="direction-card__addr">' + esc(ex.address) + '</p></div>' +
    '</div>' +
    '<a class="btn btn--outline" href="https://map.naver.com/p/search/' + q +
      '" target="_blank" rel="noopener noreferrer">지도 앱에서 열기' +
      '<i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>' +
    '<p class="direction-card__note">새 창으로 열립니다. 가상의 주소라 검색 결과가 없을 수 있어요.</p>' +
    '</div>';
}

/* ---------- Chip ---------- */
function chipHTML(label, selected, action, value) {
  return '<button type="button" class="chip" aria-pressed="' + selected + '" data-action="' +
    action + '" data-value="' + esc(value) + '">' +
    (selected ? '<i class="fa-solid fa-check" aria-hidden="true"></i>' : '') +
    esc(label) + '</button>';
}

/* ---------- Toggle ---------- */
function toggleHTML(label, checked, action) {
  return '<button type="button" class="toggle-field" role="switch" aria-checked="' + checked +
    '" data-action="' + action + '"><span class="toggle-track" aria-hidden="true"></span>' +
    esc(label) + '</button>';
}

/* ---------- State/Empty ---------- */
function emptyStateHTML(icon, title, desc, ctaLabel, ctaHref, inline) {
  return '<div class="empty-state' + (inline ? ' empty-state--inline' : '') + '">' +
    '<i class="fa-solid ' + icon + ' empty-state__icon" aria-hidden="true"></i>' +
    '<h2>' + esc(title) + '</h2>' +
    '<p>' + esc(desc) + '</p>' +
    (ctaLabel ? '<a class="btn btn--primary" href="' + ctaHref + '">' + esc(ctaLabel) + '</a>' : '') +
    '</div>';
}

/* ---------- State/Error ---------- */
function errorStateHTML(title, desc, ctaLabel, ctaHref) {
  return '<div class="error-state">' +
    '<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>' +
    '<h2>' + esc(title) + '</h2><p>' + esc(desc) + '</p>' +
    '<a class="btn btn--primary" href="' + ctaHref + '">' + esc(ctaLabel) + '</a></div>';
}

/* ---------- Navigation ---------- */
function appHeaderHTML() {
  return '<header class="app-header" id="app-header">' +
    '<span class="app-header__logo">WEEKLY PICK</span>' +
    '<a class="icon-button" href="#/discover?focus=1" aria-label="전시 검색">' +
    '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i></a></header>';
}

function detailHeaderHTML(title, opts) {
  const o = opts || {};
  return '<header class="detail-header' + (o.overlay ? ' detail-header--overlay' : '') + '" id="detail-header">' +
    '<button type="button" class="icon-button" data-action="back" aria-label="뒤로 가기">' +
    '<i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>' +
    '<span class="detail-header__title">' + esc(title) + '</span>' +
    (o.right || '<span></span>') + '</header>';
}

const NAV_ITEMS = [
  { route: 'home', href: '#/home', label: '홈', icon: 'fa-house' },
  { route: 'discover', href: '#/discover', label: '전시', icon: 'fa-compass' },
  { route: 'saved', href: '#/saved', label: '저장', icon: 'fa-bookmark' },
  { route: 'my', href: '#/my', label: '내 주말', icon: 'fa-calendar-week' }
];

function bottomNavHTML(active) {
  return '<nav class="bottom-nav" aria-label="주요 화면">' + NAV_ITEMS.map(function (n) {
    const on = n.route === active;
    return '<a class="bottom-nav__item" href="' + n.href + '"' + (on ? ' aria-current="page"' : '') + '>' +
      '<i class="fa-solid ' + n.icon + '" aria-hidden="true"></i>' +
      '<span class="bottom-nav__label">' + n.label + '</span>' +
      '<span class="bottom-nav__dot" aria-hidden="true"></span></a>';
  }).join('') + '</nav>';
}

function stickyBarHTML(buttons, note) {
  return '<div class="sticky-bar">' +
    (note ? '<p class="sticky-bar__note">' + esc(note) + '</p>' : '') +
    '<div class="sticky-bar__actions">' + buttons + '</div></div>';
}

/* ---------- 공통 고지 ---------- */
function sampleNoteHTML(text) {
  return '<p class="sample-note">' + esc(text || (typeof account!=='undefined' && account.enabled ? '전시·장소와 기본 후기는 가상 샘플이며, 회원이 작성한 후기도 함께 표시돼요.' : '위클리픽의 전시·장소·후기는 모두 가상의 샘플 콘텐츠입니다.')) + '</p><a class="privacy-link" href="#/privacy">개인정보 처리 안내</a>';
}

function sectionHeaderHTML(title, moreLabel, moreHref) {
  return '<div class="section-header"><h2>' + esc(title) + '</h2>' +
    (moreLabel ? '<a class="section-more" href="' + moreHref + '">' + esc(moreLabel) +
      '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i></a>' : '') + '</div>';
}

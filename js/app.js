/* 위클리픽 앱 — 라우팅, 화면 렌더, 이벤트 위임 */

const app = document.getElementById('app');
const toastRegion = document.getElementById('toast-region');
const modalRoot = document.getElementById('modal-root');

/* 화면 간 유지되는 UI 상태 (localStorage에 저장하지 않는다) */
const ui = {
  discover: { term: '', regionId: '', freeOnly: false, tags: [], searchFocused: false },
  reviewSort: 'latest',
  regionTab: 'rg-jongno',
  draft: null,          // 후기 작성 임시 입력
  scrollMemory: {},
  lastToastTimer: null,
  lastUndo: null,
  articleApplied: {}
};

let currentRoute = null;

/* ============ 라우팅 ============ */

function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/home';
  const [path, queryStr] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  const query = {};
  (queryStr || '').split('&').filter(Boolean).forEach(function (pair) {
    const kv = pair.split('=');
    query[kv[0]] = decodeURIComponent(kv[1] || '');
  });
  return { parts: parts, query: query, raw: raw };
}

function render() {
  const r = parseHash();
  const name = r.parts[0] || 'home';
  const id = r.parts[1];
  if (!(name === 'review' && ['new', 'edit'].includes(id))) ui.draft = null;

  // 목록 화면을 떠날 때 스크롤 위치 기억
  if (currentRoute) ui.scrollMemory[currentRoute] = window.scrollY;

  let html = '';
  let activeTab = null;

  switch (name) {
    case 'home':      html = screenHome(); activeTab = 'home'; break;
    case 'discover':  html = screenDiscover(r.query); activeTab = 'discover'; break;
    case 'exhibition':html = screenExhibition(id); break;
    case 'article':   html = screenArticle(id); break;
    case 'reviews':   html = screenReviewFeed(); break;
    case 'review':
      if (r.parts[1] === 'new') { html = screenReviewWrite(r.parts[2]); }
      else if (r.parts[1] === 'edit') { const review = getReview(r.parts[2]); html = review && review.mine ? screenReviewWrite(review.exhibitionId, review.id) : screenReviewDetail(r.parts[2]); }
      else { html = screenReviewDetail(id); }
      break;
    case 'saved':     html = screenSaved(); activeTab = 'saved'; break;
    case 'my':        html = screenMy(); activeTab = 'my'; break;
    case 'regions':   html = screenRegions(r.query); break;
    case 'archive':   html = screenArchive(); break;
    default:
      location.replace('#/home');
      return;
  }

  const usesBar = ['exhibition', 'article'].indexOf(name) !== -1 ||
    (name === 'review' && ['new', 'edit'].includes(r.parts[1]));
  const navHTML = usesBar ? '' : bottomNavHTML(activeTab);

  app.innerHTML = html + navHTML;
  toastRegion.classList.toggle('toast-region--bar', usesBar);

  currentRoute = r.raw;

  // 스크롤 처리: 뒤로 가기로 목록에 돌아오면 위치 복원
  const remembered = ui.scrollMemory[r.raw];
  window.scrollTo(0, typeof remembered === 'number' ? remembered : 0);

  if (r.query.focus === '1') {
    const input = document.getElementById('search-input');
    if (input) { input.focus(); ui.discover.searchFocused = true; }
  }

  bindScrollHeader();
  announceRecovery();
}

window.addEventListener('hashchange', render);

/* 헤더 스크롤 상태 */
let scrollHandler = null;
function bindScrollHeader() {
  if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
  const header = document.getElementById('app-header') || document.getElementById('detail-header');
  if (!header) { scrollHandler = null; return; }
  const cls = header.classList.contains('app-header') ? 'app-header--scrolled' : 'detail-header--scrolled';
  scrollHandler = function () {
    header.classList.toggle(cls, window.scrollY > 24);
  };
  window.addEventListener('scroll', scrollHandler, { passive: true });
  scrollHandler();
}

/* 손상된 저장소 복구 안내 (1회) */
let recoveryAnnounced = false;
function announceRecovery() {
  if (!state.recovered || recoveryAnnounced) return;
  recoveryAnnounced = true;
  showToast('저장한 내용을 복구했어요. 일부 항목이 사라졌을 수 있어요.');
}

/* ============ 화면: 홈 ============ */

function screenHome() {
  const pickList = picks();
  const hero = pickList[0];
  const rest = pickList.slice(1);
  const ending = endingSoonList();
  const article = ARTICLES[0];
  const listTop = sortExhibitions(EXHIBITIONS).slice(0, 4);
  const reviews = sortedReviews('latest').slice(0, 3);

  return appHeaderHTML() +
    '<main class="content-container screen--with-nav">' +
      '<section class="issue-head">' +
        '<p class="service-message">이번 주말, 갈 만한 것만.</p>' +
        '<h1>' + esc(ISSUE.title) + '</h1>' +
        (ISSUE.isDelayed
          ? '<p class="issue-head__meta issue-head__meta--notice">발행 예정 ' + esc(ISSUE.nextIssueLabel) + ' · 지난 호를 먼저 보세요</p>'
          : '<p class="issue-head__meta">' + esc(ISSUE.publishedLabel) + ' · ' + esc(weekendLabel()) + '</p>') +
        pickHeroHTML(hero) +
      '</section>' +

      '<section class="section" aria-labelledby="sec-pick">' +
        '<div class="section-header"><h2 id="sec-pick">에디터가 고른 세 곳</h2></div>' +
        '<div class="slider" role="group" aria-label="이번 주 픽, 전시 ' + rest.length + '곳">' +
          rest.map(function (e) { return exhibitionCardHTML(e, 'slide'); }).join('') +
        '</div>' +
      '</section>' +

      '<section class="section" aria-labelledby="sec-article">' +
        '<div class="section-header"><h2 id="sec-article">이번 주 코스</h2></div>' +
        articleCardHTML(article, false) +
      '</section>' +

      '<section class="section" aria-labelledby="sec-ending">' +
        '<div class="section-header"><h2 id="sec-ending">곧 끝나요</h2></div>' +
        '<div class="slider" role="group" aria-label="종료 임박 전시 ' + ending.length + '곳">' +
          ending.map(function (e) { return exhibitionCardHTML(e, 'slide'); }).join('') +
        '</div>' +
      '</section>' +

      '<section class="section" aria-labelledby="sec-list">' +
        sectionHeaderHTML('이번 호 전시', '전체보기', '#/discover').replace('<h2>', '<h2 id="sec-list">') +
        '<div class="card-list">' +
          listTop.map(function (e) { return exhibitionCardHTML(e, 'row'); }).join('') +
        '</div>' +
      '</section>' +

      '<section class="section" aria-labelledby="sec-review">' +
        sectionHeaderHTML('다녀온 사람들', '전체보기', '#/reviews').replace('<h2>', '<h2 id="sec-review">') +
        (reviews.length
          ? '<div>' + reviews.map(reviewCardHTML).join('') + '</div>'
          : emptyStateHTML('fa-pen', '아직 후기가 없어요', '다녀오셨다면 첫 줄을 남겨 주세요.', '전시 보러 가기', '#/discover', true)) +
      '</section>' +

      '<section class="section" aria-labelledby="sec-region">' +
        '<div class="section-header"><h2 id="sec-region">동네로 골라보기</h2></div>' +
        '<div class="slider" role="group" aria-label="권역 ' + REGIONS.length + '곳">' +
          REGIONS.map(function (rg) {
            const n = exhibitionsByRegion(rg.id).length;
            return '<a class="region-chip-card" href="#/regions?rg=' + rg.id + '">' +
              '<span class="region-chip-card__name">' + esc(rg.name) + '</span>' +
              '<span class="region-chip-card__lead">' + esc(rg.lead) + '</span>' +
              '<span class="region-chip-card__count">전시 ' + n + '곳</span></a>';
          }).join('') +
        '</div>' +
      '</section>' +

      sampleNoteHTML() +
    '</main>';
}

/* ============ 화면: 전시 탐색 ============ */

function screenDiscover() {
  const q = ui.discover;
  const list = filterExhibitions(q);
  const open = list.filter(function (e) { return !isClosed(e); });
  const closed = list.filter(isClosed);

  const regionChips = [chipHTML('전체', q.regionId === '', 'filter-region', '')]
    .concat(REGIONS.map(function (rg) {
      return chipHTML(rg.name, q.regionId === rg.id, 'filter-region', rg.id);
    })).join('');

  const tagChips = TAGS.map(function (t) {
    return chipHTML(t, q.tags.indexOf(t) !== -1, 'filter-tag', t);
  }).join('');

  const hasFilter = q.term || q.regionId || q.freeOnly || q.tags.length;
  const showSuggest = q.term === '' && ui.discover.searchFocused && !hasFilter;

  let body;
  if (list.length === 0) {
    body = emptyResultHTML();
  } else {
    body =
      '<div class="result-summary" aria-live="polite">' +
        '<strong>전시 ' + list.length + '곳</strong><span>종료 임박 · 이번 주 픽 순</span>' +
      '</div>' +
      '<div class="card-list">' + open.map(function (e) { return exhibitionCardHTML(e, 'row'); }).join('') + '</div>' +
      (closed.length
        ? '<p class="list-divider">종료된 전시</p><div class="card-list">' +
          closed.map(function (e) { return exhibitionCardHTML(e, 'row'); }).join('') + '</div>'
        : '');
  }

  return '<main class="content-container screen--with-nav">' +
      '<div class="screen-head"><h1>전시 탐색</h1></div>' +
      '<div class="filter-bar">' +
        '<div class="search-field">' +
          '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
          '<label class="sr-only" for="search-input">전시 검색</label>' +
          '<input id="search-input" type="search" value="' + esc(q.term) +
            '" placeholder="전시명, 장소, 동네로 찾기" data-action="search" autocomplete="off">' +
          (q.term ? '<button type="button" class="search-clear" data-action="clear-term" aria-label="검색어 지우기">' +
            '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' : '') +
        '</div>' +
        '<div class="filter-row" role="group" aria-label="권역 필터">' + regionChips + '</div>' +
        '<div class="filter-row" role="group" aria-label="요금과 태그 필터">' +
          toggleHTML('무료만 보기', q.freeOnly, 'filter-free') + tagChips +
        '</div>' +
      '</div>' +
      (showSuggest ? suggestHTML() : '') +
      body +
      sampleNoteHTML() +
    '</main>';
}

function suggestHTML() {
  return '<section class="suggest-block"><h2>무엇부터 볼지 모르겠다면 이렇게 찾아보세요</h2>' +
    '<div class="choice-row">' + SEARCH_SUGGESTIONS.map(function (k) {
      return '<button type="button" class="chip" data-action="suggest" data-value="' + esc(k) + '">' + esc(k) + '</button>';
    }).join('') + '</div></section>';
}

function emptyResultHTML() {
  return '<div class="result-summary" aria-live="polite"><strong>전시 0곳</strong></div>' +
    '<div class="empty-state"><h2>조건에 맞는 전시가 없어요</h2>' +
    '<p>검색어를 짧게 바꾸거나 필터를 풀어 보세요.</p>' +
    '<button class="btn btn--primary" data-action="reset-filters">검색·필터 초기화</button></div>';
}

/* ============ 화면: 전시 상세 ============ */

function screenExhibition(id) {
  const ex = getExhibition(id);
  if (!ex) {
    return detailHeaderHTML('전시') +
      '<main class="content-container screen--with-nav">' +
      errorStateHTML('찾는 전시가 없어요', '이번 호 목록에서 다시 골라 주세요.', '이번 호 보기', '#/home') +
      '</main>';
  }
  pushRecent(ex.id);

  const closed = isClosed(ex);
  const soon = !closed && isEndingSoon(ex);
  const saved = isSaved(ex.id);
  const reviews = reviewsOf(ex.id);
  const sameRegion = exhibitionsByRegion(ex.regionId).filter(function (e) { return e.id !== ex.id; });
  const region = getRegion(ex.regionId);

  const upcoming = getRuntimeStatus(ex) === 'upcoming';
  const own = myReviewOf(ex.id);
  const reviewAction = own
    ? '<a class="btn btn--primary" href="#/review/edit/' + own.id + '">내 후기 수정</a>'
    : '<a class="btn btn--primary" href="#/review/new/' + ex.id + '">후기 남기기</a>';
  const saveAction = '<button type="button" class="btn btn--outline" data-action="toggle-save" data-id="' + ex.id + '" aria-pressed="' + saved + '">' + (saved ? '저장됨' : '저장') + '</button>';
  const bar = upcoming ? saveAction + (plannedDay(ex.id)
    ? '<a class="btn btn--primary" href="#/my">주말 계획 보기</a>'
    : '<button type="button" class="btn btn--primary" data-action="assign" data-id="' + ex.id + '" data-day="sat">계획에 넣기</button>')
    : closed ? (state.visits[ex.id] ? '' : '<button type="button" class="btn btn--outline" data-action="visit" data-id="' + ex.id + '">다녀왔어요</button>') + reviewAction
    : saveAction + reviewAction;

  return detailHeaderHTML(ex.title, { overlay: true }) +
    '<div class="detail-hero' + (closed ? ' detail-hero--closed' : '') + '">' +
      imageTagEager(ex.image, ex.alt, 394, 394) +
      (closed ? '<span class="detail-hero__closed-label">종료됨</span>' : '') +
    '</div>' +
    '<main class="content-container detail-body screen--with-bar">' +
      (closed ? '' : '<div>' + badgeRowHTML(ex, false) + '</div>') +
      '<h1 class="detail-title">' + esc(ex.title) + '</h1>' +
      '<p class="detail-meta">' + esc(ex.venue) + ' · ' + esc(region ? region.name : '') + '<br>' +
        '<time datetime="' + ex.start + '">' + esc(shortDate(ex.start)) + '</time>–' +
        '<time datetime="' + ex.end + '">' + esc(shortDate(ex.end)) + '</time></p>' +
      (soon ? (daysLeft(ex) === 0 ? '<p class="detail-dday">오늘까지예요.</p>' : '<p class="detail-dday">종료까지 <strong>' + daysLeft(ex) + '</strong>일</p>') : '') +
      (upcoming ? '<div class="status-notice"><strong>' + longDate(ex.start) + '부터 열려요.</strong><p>시작 전에는 방문과 후기를 기록할 수 없어요. 미리 저장하거나 주말 계획에 넣어 보세요.</p></div>' : '') +
      (closed ? '<div class="closed-notice">이 전시는 ' + longDate(ex.end) + '에 끝났어요. 다녀왔다면 방문과 후기를 남길 수 있어요.</div>' : '') +
      (state.visits[ex.id] ? '<p class="visit-status">✓ 다녀온 전시예요 · ' + esc(state.visits[ex.id]) + ' 기록</p>' : '') +

      infoStripHTML(ex, 'detail') +

      // 에디터 한 줄은 섹션 제목 없이 스트립 바로 아래에 붙인다.
      // 430x800 첫 화면 안에 스트립과 에디터 한 줄이 함께 들어와야 한다 (기획 11장).
      editorNoteHTML(ex) +
      '<section class="detail-section"><h2>' + (closed ? '전시 기록' : '가기 전에 알아두면 좋아요') + '</h2>' + tipListHTML(ex) + '</section>' +
      '<section class="detail-section"><h2>오시는 길</h2>' + directionCardHTML(ex) + '</section>' +

      '<section class="detail-section">' +
        '<div class="detail-section__head"><h2>다녀온 사람들</h2>' +
          (reviews.length ? '<a class="section-more" href="#/reviews">후기 전체보기' +
            '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i></a>' : '') +
        '</div>' +
        (reviews.length
          ? '<div>' + reviews.slice(0, 2).map(reviewCardHTML).join('') + '</div>'
          : '<div class="empty-state empty-state--inline">' +
            '<i class="fa-solid fa-pen empty-state__icon" aria-hidden="true"></i>' +
            '<h2>아직 이 전시 후기가 없어요</h2>' +
            (upcoming ? '<p>아직 시작 전이라 후기가 없어요.</p></div>' : '<p>다녀오셨다면 첫 줄을 남겨 주세요.</p>' + reviewAction + '</div>')) +
      '</section>' +

      (sameRegion.length ? '<section class="detail-section"><h2>같은 동네 전시</h2>' +
        '<div class="slider" role="group" aria-label="' + esc(region.name) + ' 전시 ' + sameRegion.length + '곳">' +
        sameRegion.map(function (e) { return exhibitionCardHTML(e, 'slide'); }).join('') + '</div></section>' : '') +

      sampleNoteHTML('가상의 전시와 장소로 만든 샘플 콘텐츠입니다.') +
    '</main>' +
    stickyBarHTML(bar, upcoming ? longDate(ex.start) + '부터 방문과 후기를 기록할 수 있어요' : null);
}

function longDate(iso) {
  const p = iso.split('-');
  return Number(p[1]) + '월 ' + Number(p[2]) + '일';
}

/* ============ 화면: 큐레이션 기사 ============ */

function screenArticle(id) {
  const article = getArticle(id);
  if (!article) {
    return detailHeaderHTML('코스') +
      '<main class="content-container screen--with-nav">' +
      errorStateHTML('찾는 코스가 없어요', '이번 호에서 다른 코스를 골라 보세요.', '이번 호 보기', '#/home') +
      '</main>';
  }
  const stops = articleStops(article);
  const labels = ['첫 번째', '두 번째', '세 번째', '네 번째'];
  const applied = ui.articleApplied[article.id] || articleIsApplied(article);
  const others = ARTICLES.filter(function (a) { return a.id !== article.id; });

  let stopsHTML = '';
  stops.forEach(function (s, i) {
    const meta = s.time + ' · ' + priceLabel(s.ex) + ' · ' + s.ex.duration + '분';
    stopsHTML += stopCardHTML(s.ex, labels[i], meta);
    if (i < stops.length - 1) {
      stopsHTML += '<p class="article-move"><i class="fa-solid fa-arrow-down" aria-hidden="true"></i>' +
        '예상 이동 ' + getTravelMinutes(s.ex.regionId, stops[i + 1].ex.regionId) + '분' + '</p>';
    }
  });

  const cost = articleCost(article);
  const bar = applied
    ? '<button type="button" class="btn btn--primary btn--full" disabled>계획에 넣었어요</button>'
    : '<button type="button" class="btn btn--primary btn--full" data-action="apply-course" data-id="' +
      article.id + '">이 코스로 계획 만들기</button>';

  return detailHeaderHTML('코스') +
    '<main class="content-container screen--with-bar">' +
      '<div class="article-head">' + articleCardHTML(article, true) + '</div>' +
      '<div class="article-body">' +
        '<h1 class="sr-only">' + esc(article.title) + '</h1>' +
        '<p class="article-body__sub">' + esc(article.subtitle) + '</p>' +
        '<div class="article-body__text">' +
          article.body.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
          '<p>관람 ' + minutesLabel(articleViewMinutes(article)) + ', 예상 이동 ' + minutesLabel(articleMoveMinutes(article)) + '. 전체 ' + minutesLabel(articleViewMinutes(article) + articleMoveMinutes(article)) + ' 코스예요.</p>' +
        '</div>' +
      '</div>' +
      '<section class="detail-section"><h2>이 코스의 순서</h2>' + stopsHTML + '</section>' +
      '<section class="detail-section">' +
        '<div class="summary-list"><h2>이 코스 한눈에</h2><dl>' +
          '<div><dt>관람</dt><dd>' + minutesLabel(articleViewMinutes(article)) + '</dd></div>' +
          '<div><dt>이동</dt><dd>' + minutesLabel(articleMoveMinutes(article)) + '</dd></div>' +
          '<div><dt>비용</dt><dd>' + (cost === 0 ? '0원' : cost.toLocaleString('ko-KR') + '원') + '</dd></div>' +
        '</dl><p class="summary-list__note">관람 시간과 이동 시간은 따로 셌어요.</p></div>' +
      '</section>' +
      '<section class="detail-section"><h2>다른 코스도 있어요</h2>' +
        '<div class="card-list card-list--tight">' + others.map(function (a) {
          const hero = getExhibition(a.heroExhibitionId);
          const meta = a.stops.length + '곳 · 관람 ' + minutesLabel(articleViewMinutes(a));
          return stopCardHTML(hero, a.category, meta, { href: '#/article/' + a.id });
        }).join('') + '</div>' +
      '</section>' +
      sampleNoteHTML() +
    '</main>' +
    stickyBarHTML(bar);
}

/* ============ 화면: 후기 피드 ============ */

function screenReviewFeed() {
  const list = sortedReviews(ui.reviewSort);
  return detailHeaderHTML('다녀온 사람들') +
    '<main class="content-container screen--with-nav">' +
      '<div class="sort-tabs" role="group" aria-label="후기 정렬">' +
        chipHTML('최신순', ui.reviewSort === 'latest', 'sort-reviews', 'latest') +
        chipHTML('별점순', ui.reviewSort === 'rating', 'sort-reviews', 'rating') +
      '</div>' +
      (list.length
        ? '<div class="result-summary" aria-live="polite"><strong>후기 ' + list.length + '개</strong></div>' +
          '<div>' + list.map(reviewCardHTML).join('') + '</div>'
        : emptyStateHTML('fa-pen', '아직 후기가 없어요',
            '이번 호 전시를 다녀오셨다면 한 줄 남겨 주세요.', '전시 보러 가기', '#/discover')) +
      sampleNoteHTML() +
    '</main>';
}

/* ============ 화면: 후기 상세 ============ */

function screenReviewDetail(id) {
  const review = getReview(id);
  if (!review) {
    return detailHeaderHTML('후기') +
      '<main class="content-container screen--with-nav">' +
      errorStateHTML('찾는 후기가 없어요', '후기 목록에서 다시 골라 주세요.', '후기 전체보기', '#/reviews') +
      '</main>';
  }
  const ex = getExhibition(review.exhibitionId);
  const others = reviewsOf(ex.id).filter(function (r) { return r.id !== review.id; });

  return detailHeaderHTML('후기') +
    '<main class="content-container screen--with-nav">' +
      '<div class="detail-body">' +
        '<span class="review-card-label">이 전시를 다녀왔어요</span>' +
        stopCardHTML(ex, null, venueAndPeriod(ex)) +
        '<h1 class="sr-only">' + esc(ex.title) + ' 후기</h1>' +
        '<div class="review-detail__rating">' + ratingHTML(review.rating, 'lg') + '</div>' +
        '<p class="review-detail__text">' + esc(review.text) + '</p>' +
        '<p class="review-detail__meta">' + esc(review.day) + ' 방문 · 웨이팅 ' +
          (review.waiting ? '있음' : '없음') + (review.mine ? ' · 내 후기' : '') + '</p>' +
        (review.mine ? '<p class="visit-status">✓ 다녀온 전시로 기록됨</p><div class="review-actions"><a class="btn btn--outline" href="#/review/edit/' + review.id + '">수정</a><button class="btn btn--text" data-action="delete-review" data-id="' + review.id + '">삭제</button></div><p class="form-note">후기를 수정하거나 삭제할 수 있어요.</p>' : '') +
      '</div>' +
      '<section class="detail-section"><h2>이 전시의 다른 후기</h2>' +
        (others.length
          ? '<div>' + others.map(reviewCardHTML).join('') + '</div>'
          : '<div class="empty-state empty-state--inline">' +
            '<i class="fa-solid fa-pen empty-state__icon" aria-hidden="true"></i>' +
            '<h2>이 전시 후기는 아직 하나예요</h2>' +
            '<p>다른 관람객의 후기도 곧 만나 보세요.</p></div>') +
      '</section>' +
      sampleNoteHTML() +
    '</main>';
}

/* ============ 화면: 후기 작성 ============ */

function screenReviewWrite(exId, editId) {
  const ex = getExhibition(exId);
  if (!ex) {
    return detailHeaderHTML('후기 남기기') +
      '<main class="content-container screen--with-nav">' +
      errorStateHTML('찾는 전시가 없어요', '이번 호 목록에서 다시 골라 주세요.', '이번 호 보기', '#/home') +
      '</main>';
  }
  if (!canWriteReview(ex)) return detailHeaderHTML('후기 남기기') + '<main class="content-container">' +
    emptyStateHTML('fa-calendar', '아직 시작 전인 전시예요', longDate(ex.start) + '부터 후기를 남길 수 있어요.', '전시로 돌아가기', '#/exhibition/' + ex.id) + '</main>';
  const existing = myReviewOf(exId);
  if (!editId && existing) return screenReviewWrite(exId, existing.id);
  if (!ui.draft || ui.draft.exId !== exId || ui.draft.editId !== (editId || null)) {
    const original = editId ? getReview(editId) : null;
    ui.draft = { exId: exId, editId: editId || null, rating: original ? original.rating : 0, text: original ? original.text : '',
      day: original ? original.day : '', waiting: original ? (original.waiting ? 'yes' : 'no') : null, done: false };
  }
  const d = ui.draft;

  const over = d.text.length > 80;
  const canSubmit = d.rating >= 1 && d.text.trim().length > 0 && !over && d.day && d.waiting !== null;

  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += '<button type="button" class="rating-input__star' + (i <= d.rating ? ' is-on' : '') +
      '" role="radio" aria-checked="' + (i === d.rating) + '" data-action="set-rating" data-value="' + i +
      '" aria-label="' + i + '점"><i class="fa-' + (i <= d.rating ? 'solid' : 'regular') +
      ' fa-star" aria-hidden="true"></i></button>';
  }

  const dayChips = ['토요일', '일요일', '평일'].map(function (v) {
    return chipHTML(v, d.day === v, 'set-day', v);
  }).join('');
  const waitChips = [['있었어요', 'yes'], ['없었어요', 'no']].map(function (p) {
    return chipHTML(p[0], d.waiting === p[1], 'set-waiting', p[1]);
  }).join('');

  return detailHeaderHTML(editId ? '후기 수정' : '후기 남기기') +
    '<main class="content-container screen--with-bar">' +
      '<div class="detail-body">' +
        '<h1 class="sr-only">' + esc(ex.title) + ' 후기 남기기</h1>' +
        '<span class="review-card-label">' + (editId ? '내 후기 수정' : '이 전시를 다녀오셨나요?') + '</span>' +
        (editId ? '<p class="review-edit-banner">수정 중 · ' + esc(getReview(editId).createdAt) + ' 작성</p>' : '') +
        stopCardHTML(ex, null, venueAndPeriod(ex), { href: null }) +
      '</div>' +
      '<section class="form-block">' +
        '<p class="form-block__label" id="rating-label">얼마나 좋았나요?</p>' +
        '<p class="form-block__hint">' + (d.rating ? '현재 ' + d.rating + '점 · 별을 눌러 바꿀 수 있어요' : '별을 눌러 점수를 골라 주세요') + '</p>' +
        '<div class="rating-input" role="radiogroup" aria-labelledby="rating-label">' + stars + '</div>' +
      '</section>' +
      '<section class="form-block">' +
        '<label class="form-block__label" for="review-text">한 줄로 남겨 주세요</label>' +
        '<textarea id="review-text" class="form-textarea' + (over ? ' form-textarea--error' : '') +
          '" data-action="review-text" placeholder="40분이면 충분했어요, 오전이 한산해요"' +
          (over ? ' aria-invalid="true" aria-describedby="text-error"' : '') + '>' + esc(d.text) + '</textarea>' +
        '<div class="form-counter">' +
          '<span id="text-error" class="form-counter__error" aria-live="polite">' +
            (over ? '한 줄은 80자까지 쓸 수 있어요. 지금 ' + d.text.length + '자예요.' : '') + '</span>' +
          '<span class="form-counter__num' + (over ? ' form-counter__num--over' : '') + '">' +
            d.text.length + ' / 80</span>' +
        '</div>' +
      '</section>' +
      '<section class="form-block">' +
        '<p class="form-block__label" id="day-label">언제 다녀오셨나요?</p>' +
        '<div class="choice-row" role="group" aria-labelledby="day-label">' + dayChips + '</div>' +
      '</section>' +
      '<section class="form-block">' +
        '<p class="form-block__label" id="wait-label">웨이팅이 있었나요?</p>' +
        '<div class="choice-row" role="group" aria-labelledby="wait-label">' + waitChips + '</div>' +
      '</section>' +
      '<p class="form-note">' + (editId ? '수정해도 방문 완료 상태는 그대로 유지됩니다.' : '후기를 등록하면 방문 기록도 함께 저장돼요.') + '</p>' +
    '</main>' +
    stickyBarHTML(
      '<button type="button" class="btn btn--primary btn--full" data-action="submit-review"' +
      (canSubmit ? '' : ' disabled') + '>' + (editId ? '수정 완료' : '후기 등록') + '</button>' +
      (editId ? '<button class="btn btn--outline" data-action="cancel-edit">취소</button>' : ''),
      canSubmit ? null : '별점·후기·방문 정보를 입력해 주세요'
    );
}

/* ============ 화면: 저장 목록 ============ */

function screenSaved() {
  const list = state.saved.map(getExhibition).filter(Boolean);
  const placed = list.filter(function (e) { return plannedDay(e.id) !== null; }).length;

  if (!list.length) {
    return '<main class="content-container screen--with-nav">' +
      '<div class="screen-head"><h1>저장한 전시</h1></div>' +
      emptyStateHTML('fa-bookmark', '마음에 드는 전시를 저장해 보세요',
        '전시의 북마크를 누르면 여기에 모여요. 저장한 전시로 주말 계획을 만들 수 있어요.', '전시 둘러보기', '#/discover') +
      sampleNoteHTML() + '</main>';
  }

  return '<main class="content-container screen--with-nav">' +
      '<div class="screen-head"><h1>저장한 전시</h1></div>' +
      '<div class="plain-strip"><i class="fa-solid fa-bookmark" aria-hidden="true"></i>' +
        '<span><strong>저장 ' + list.length + '곳</strong> · 계획에 넣은 곳 ' + placed + '</span></div>' +
      '<div class="card-list">' + list.map(function (e) {
        const day = plannedDay(e.id);
        const label = '<span class="ex-card__plan-label' + (day ? ' ex-card__plan-label--placed' : '') + '">' +
          '<i class="fa-' + (day ? 'solid' : 'regular') + ' fa-calendar" aria-hidden="true"></i>' +
          (day === 'sat' ? '토요일에 있어요' : day === 'sun' ? '일요일에 있어요' : '아직 안 넣었어요') + '</span>';
        return '<div>' + exhibitionCardHTML(e, 'row', label) + (!day && !isClosed(e) ? '<div class="saved-plan-actions"><button class="btn btn--outline btn--compact" data-action="assign" data-id="' + e.id + '" data-day="sat">토요일에 넣기</button><button class="btn btn--outline btn--compact" data-action="assign" data-id="' + e.id + '" data-day="sun">일요일에 넣기</button></div>' : '') + '</div>';
      }).join('') + '</div>' +
      '<a class="btn btn--primary btn--full btn--inline-cta" href="#/my">주말 계획 세우기</a>' +
      '<p class="form-note">저장은 이 브라우저에서만 유지돼요.</p>' +
      sampleNoteHTML() +
    '</main>';
}

/* ============ 화면: 내 주말 ============ */

function screenMy() {
  const savedList = state.saved.map(getExhibition).filter(Boolean);
  const myReviews = state.reviews.map(function (r) { return Object.assign({}, r, { mine: true }); });
  const recentList = state.recent.map(getExhibition).filter(Boolean);

  const noSaved = savedList.length === 0;

  return '<main class="content-container screen--with-nav">' +
      '<div class="screen-head"><h1>내 주말</h1>' +
        '<p class="screen-head__sub">' + esc(weekendLabel()) + '</p></div>' +

      '<div class="summary-tiles">' +
        summaryTile(savedList.length, '저장') +
        summaryTile(allPlanned().length, '계획') +
        summaryTile(myReviews.length, '후기') +
      '</div>' +

      (noSaved
        ? emptyStateHTML('fa-calendar-week', '저장한 전시가 없어 계획을 세울 수 없어요',
            '이번 호에서 갈 곳을 먼저 골라 주세요.', '이번 호 보기', '#/home', true)
        : '<section class="section weekend-plan"><div class="section-header"><h2>주말 계획</h2></div><a class="btn btn--outline" href="#/saved">저장한 전시에서 추가</a>' +
            daySlotHTML('sat', '토요일', ISSUE.weekend.sat) +
            daySlotHTML('sun', '일요일', ISSUE.weekend.sun) +
          '</section>') +

      '<section class="section">' +
        sectionHeaderHTML('내 후기', myReviews.length ? '전체보기' : null, '#/reviews') +
        (myReviews.length
          ? '<div>' + myReviews.map(reviewCardHTML).join('') + '</div>'
          : emptyStateHTML('fa-pen', '아직 남긴 후기가 없어요',
              '다녀온 전시가 있다면 한 줄 남겨 주세요.', '전시 보러 가기', '#/discover', true)) +
      '</section>' +

      '<section class="section"><div class="section-header"><h2>최근 본 전시</h2></div>' +
        (recentList.length
          ? '<div class="card-list card-list--tight">' + recentList.map(function (e) {
              return stopCardHTML(e, null, e.venue + ' · ' + e.duration + '분', { compact: true });
            }).join('') + '</div>'
          : emptyStateHTML('fa-compass', '아직 본 전시가 없어요',
              '이번 호부터 둘러보세요.', '이번 호 보기', '#/home', true)) +
      '</section>' +

      '<details class="demo-settings"><summary>데모 날짜 설정</summary><p>가상 전시의 계획 전·방문 후 상태를 확인해 보세요.</p><div class="choice-row">' + DEMO_DATES.map(function (date) { return chipHTML(date === ISSUE_DATE ? '9.10 목 · 계획하는 날' : '9.14 월 · 다녀온 뒤', state.currentDate === date, 'demo-date', date); }).join('') + '</div></details>' +
      '<a class="link-row" href="#/archive"><span>지난 호 보기</span>' +
        '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i></a>' +

      '<p class="service-note">위클리픽은 매주 목요일에 새 호를 냅니다. 저장과 계획은 이 브라우저에만 남아요.</p>' +
      sampleNoteHTML('모든 전시와 장소는 가상의 샘플 콘텐츠입니다.') +
    '</main>';
}

function summaryTile(value, label) {
  return '<div class="summary-tile"><p class="summary-tile__value">' + value + '</p>' +
    '<p class="summary-tile__label">' + esc(label) + '</p></div>';
}

function daySlotHTML(day, dayLabel, dateISO) {
  const rows = calculateTimeline(day), totals = calculateTotalDuration(day);
  const parts = minutesParts(totals.total);
  const totalHTML = (parts.h !== null ? '<span class="day-slot__total-num">' + parts.h + '</span><span class="day-slot__total-unit">시간</span>' : '') +
    (parts.m || parts.h === null ? '<span class="day-slot__total-num">' + parts.m + '</span><span class="day-slot__total-unit">분</span>' : '');
  const other = day === 'sat' ? 'sun' : 'sat', otherLabel = day === 'sat' ? '일요일로' : '토요일로';
  let options = '';
  for (let minutes = 600; minutes <= 900; minutes += 30) {
    const time = clockLabel(minutes);
    options += '<option value="' + time + '"' + (state.dayStartTime[day] === time ? ' selected' : '') + '>' + time + '</option>';
  }
  const items = rows.map(function (row, i) {
    const ex = row.ex, own = myReviewOf(ex.id);
    const visit = state.currentDate >= dateISO && canMarkVisited(ex) ? (state.visits[ex.id]
      ? '<span class="visit-status">✓ 다녀왔어요</span> <a class="btn btn--outline btn--compact" href="#/review/' + (own ? 'edit/' + own.id : 'new/' + ex.id) + '">' + (own ? '후기 수정' : '후기 남기기') + '</a>'
      : '<button class="btn btn--outline btn--compact" data-action="visit" data-id="' + ex.id + '">다녀왔어요</button>') : '';
    return '<li>' + (row.travel ? '<p class="timeline-travel">예상 이동 ' + row.travel + '분 <span>· 권역 기준 예상 시간</span></p>' : '') +
      '<div class="timeline-stop"><div class="timeline-times"><strong>' + clockLabel(row.start) + '</strong><span>' + clockLabel(row.end) + '</span></div>' +
      '<div class="timeline-rail" aria-hidden="true"></div><div class="timeline-content"><a href="#/exhibition/' + ex.id + '"><strong>' + esc(ex.title) + '</strong></a>' +
      '<p class="plan-item__meta">' + ex.duration + '분 · ' + esc(priceLabel(ex)) + (isClosed(ex) ? ' · 종료됨' : '') + '</p>' +
      (ex.booking === '필수' ? '<div class="reservation-notice"><strong>예약 필수</strong><p>예약한 시간에 맞춰 일정을 조정해 주세요. 위 시각은 예상값이에요.</p></div>' : '') +
      (visit ? '<div class="visit-actions">' + visit + '</div>' : '') + '</div></div>' +
      '<div class="timeline-actions">' +
      '<button class="btn btn--outline btn--compact" data-action="move-plan" data-id="' + ex.id + '" data-direction="-1" aria-label="' + esc(ex.title) + ' 위로"' + (i === 0 ? ' disabled' : '') + '>위로</button>' +
      '<button class="btn btn--outline btn--compact" data-action="move-plan" data-id="' + ex.id + '" data-direction="1" aria-label="' + esc(ex.title) + ' 아래로"' + (i === rows.length - 1 ? ' disabled' : '') + '>아래로</button>' +
      '<button class="btn btn--outline btn--compact" data-action="assign" data-id="' + ex.id + '" data-day="' + other + '"' + (isClosed(ex) ? ' disabled' : '') + '>' + otherLabel + '</button>' +
      '<button class="btn btn--outline btn--compact" data-action="unplan" data-id="' + ex.id + '">빼기</button></div></li>';
  }).join('');
  return '<div class="day-slot' + (totals.total > PLAN_LIMIT_MIN ? ' day-slot--over' : '') + '"><div class="day-slot__head"><span class="day-slot__day">' + dayLabel + '</span><time class="day-slot__date" datetime="' + dateISO + '">' + shortDate(dateISO) + '</time></div>' +
    (rows.length ? '<div class="start-time"><label for="start-' + day + '">첫 일정 시작<small>직접 선택 · 10:00~15:00 (30분 단위)</small></label><select id="start-' + day + '" data-action="start-time" data-day="' + day + '">' + options + '</select></div><ol class="day-slot__items">' + items + '</ol>' +
      '<div class="timeline-summary"><p>전체 소요</p><strong class="timeline-total">' + totalHTML + '</strong><p class="day-slot__note">관람 ' + minutesLabel(totals.view) + ' · 이동 ' + totals.travel + '분</p>' +
      '<div class="timeline-end"><strong>' + state.dayStartTime[day] + ' 시작 → ' + clockLabel(totals.end) + ' 종료 예상</strong><small>전체 소요 = 관람 합계 + 이동 합계</small></div></div>' +
      (totals.total > PLAN_LIMIT_MIN ? '<p class="day-slot__warning">반나절을 넘는 일정이에요. 순서를 바꾸거나 한 곳을 덜어보세요.</p>' : '')
      : '<p class="day-slot__empty">이 날은 아직 비어 있어요</p><a class="btn btn--outline" href="#/saved">저장한 전시에서 추가</a>') + '</div>';
}

/* ============ 화면: 지역별 모아보기 ============ */

function screenRegions(query) {
  if (query.rg && getRegion(query.rg)) ui.regionTab = query.rg;
  const region = getRegion(ui.regionTab);
  const list = exhibitionsByRegion(region.id);

  return detailHeaderHTML('동네별로 보기') +
    '<main class="content-container screen--with-nav">' +
      '<div class="filter-row" role="group" aria-label="권역 선택">' +
        REGIONS.map(function (rg) {
          return chipHTML(rg.name, rg.id === region.id, 'select-region', rg.id);
        }).join('') +
      '</div>' +
      '<section class="region-intro">' +
        '<h2>' + esc(region.name) + '</h2>' +
        '<p class="region-intro__lead">' + esc(region.lead) + '</p>' +
        '<p class="region-intro__route"><i class="fa-solid fa-location-dot" aria-hidden="true"></i>' +
          '<span>' + esc(region.route) + '</span></p>' +
        '<p class="region-intro__count">전시 ' + list.length + '곳</p>' +
      '</section>' +
      (list.length
        ? '<div class="card-list" style="margin-top:var(--space-16)">' +
            list.map(function (e) { return exhibitionCardHTML(e, 'row'); }).join('') + '</div>' +
          '<button type="button" class="btn btn--secondary btn--full btn--inline-cta" ' +
            'data-action="region-to-discover" data-value="' + region.id + '">이 권역 전체 보기</button>'
        : emptyStateHTML('fa-compass', '이 동네는 이번 호에 실린 전시가 없어요',
            '다른 동네를 골라 보세요.', null, null)) +
      sampleNoteHTML() +
    '</main>';
}

/* ============ 화면: 아카이브 ============ */

function screenArchive() {
  const hero = getExhibition('ex-01');
  return detailHeaderHTML('지난 호') +
    '<main class="content-container screen--with-nav">' +
      '<section class="archive-current">' +
        '<span class="archive-label">이번 호</span>' +
        '<a class="stop-card" href="#/home">' +
          '<span class="stop-card__thumb">' + imageTag(hero.image, '', 78, 78) + '</span>' +
          '<span class="stop-card__body">' +
            '<span class="stop-card__title">' + esc(ISSUE.title) + '</span>' +
            '<span class="stop-card__meta">' + esc(ISSUE.publishedLabel) + ' · 전시 ' + ISSUE.count + '곳</span>' +
          '</span></a>' +
      '</section>' +
      '<section class="section">' +
        '<div class="section-header"><h2>지난 호</h2></div>' +
        emptyStateHTML('fa-box-archive', '첫 호예요. 다음 주 목요일에 만나요',
          '지난 호는 다음 발행부터 여기에 쌓여요.', null, null, true) +
      '</section>' +
      '<p class="publish-note"><i class="fa-regular fa-calendar" aria-hidden="true"></i>' +
        '<span>다음 호 발행 ' + esc(ISSUE.nextIssueLabel) + '</span></p>' +
      '<a class="btn btn--primary btn--full btn--inline-cta" href="#/home">이번 호 보기</a>' +
      sampleNoteHTML() +
    '</main>';
}

/* ============ Toast ============ */

function showToast(message, actionLabel, actionHandler) {
  clearTimeout(ui.lastToastTimer);
  toastRegion.innerHTML = '<div class="toast">' +
    '<span>' + esc(message) + '</span>' +
    (actionLabel ? '<button type="button" class="toast__action" data-action="toast-action">' +
      esc(actionLabel) + '</button>' : '') + '</div>';
  ui.toastHandler = actionHandler || null;
  ui.lastToastTimer = setTimeout(function () {
    toastRegion.innerHTML = '';
    ui.toastHandler = null;
  }, actionLabel ? 5000 : 3000);
}

function hideToast() {
  clearTimeout(ui.lastToastTimer);
  toastRegion.innerHTML = '';
  ui.toastHandler = null;
}

/* ============ Modal ============ */

let modalReturnFocus = null;

function openConfirm(title, desc, primaryLabel, secondaryLabel, onSecondary) {
  modalReturnFocus = document.activeElement;
  modalRoot.innerHTML = '<div class="modal-scrim" data-action="modal-scrim">' +
    '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
      '<h2 id="modal-title">' + esc(title) + '</h2><p>' + esc(desc) + '</p>' +
      '<div class="modal__actions">' +
        '<button type="button" class="btn btn--primary btn--full" data-action="modal-close">' + esc(primaryLabel) + '</button>' +
        '<button type="button" class="modal__text-action" data-action="modal-confirm">' + esc(secondaryLabel) + '</button>' +
      '</div></div></div>';
  ui.modalConfirm = onSecondary;
  const first = modalRoot.querySelector('.btn--primary');
  if (first) first.focus();
  document.addEventListener('keydown', modalKeydown);
}

function closeModal() {
  modalRoot.innerHTML = '';
  ui.modalConfirm = null;
  document.removeEventListener('keydown', modalKeydown);
  if (modalReturnFocus && document.contains(modalReturnFocus)) modalReturnFocus.focus();
}

function modalKeydown(e) {
  if (e.key === 'Escape') { closeModal(); return; }
  if (e.key !== 'Tab') return;
  const focusables = modalRoot.querySelectorAll('button');
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/* ============ 이벤트 위임 ============ */

document.addEventListener('click', function (e) {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;

  switch (action) {
    case 'back':
      e.preventDefault();
      if (ui.draft && !ui.draft.done && (ui.draft.rating > 0 || ui.draft.text.length > 0)) {
        openConfirm('쓰던 후기가 사라져요. 그만 쓸까요?',
          '지금 나가면 별점과 한 줄이 저장되지 않아요.',
          '계속 쓰기', '그만두기', function () { ui.draft = null; history.back(); });
        return;
      }
      if (history.length > 1) history.back(); else location.hash = '#/home';
      break;

    case 'toggle-save': {
      e.preventDefault();
      if (target.dataset.busy === '1') return;
      target.dataset.busy = '1';
      const id = target.dataset.id;
      const ex = getExhibition(id);
      if (isSaved(id)) {
        const snap = removeSaved(id);
        render();
        showToast('저장을 해제했어요', '되돌리기', function () {
          restoreSaved(id, snap); hideToast(); render();
        });
      } else {
        addSaved(id);
        render();
        showToast('저장했어요', '토요일에 넣기', function () {
          assignToDay(id, 'sat'); hideToast();
          render();
          showToast('토요일에 넣었어요');
        });
      }
      break;
    }

    case 'demo-date':
      if (setCurrentDate(target.dataset.value)) { ui.draft = null; render(); showToast('데모 날짜를 바꿨어요'); }
      break;
    case 'move-plan':
      if (movePlan(target.dataset.id, Number(target.dataset.direction))) {
        render();
        const button = app.querySelector('[data-action="move-plan"][data-id="' + target.dataset.id + '"][data-direction="' + target.dataset.direction + '"]');
        if (button && !button.disabled) button.focus();
        showToast('순서와 예상 시각을 바꿨어요');
      }
      break;
    case 'visit':
      if (markVisited(target.dataset.id)) { render(); showToast('다녀온 전시로 기록했어요'); }
      break;
    case 'cancel-edit': {
      const id = ui.draft && ui.draft.editId;
      if (id) openConfirm('수정을 취소할까요?', '변경한 내용은 저장되지 않아요.', '계속 수정', '수정 취소', function () { ui.draft = null; location.hash = '#/review/' + id; });
      break;
    }
    case 'delete-review': {
      const review = getReview(target.dataset.id);
      if (!review || !review.mine) return;
      openConfirm('후기를 삭제할까요?', '후기를 지워도 다녀온 기록은 남아 있어요.', '취소', '삭제', function () {
        const snapshot = deleteReview(review.id);
        if (!snapshot) return;
        location.hash = '#/reviews';
        showToast('후기를 삭제했어요', '되돌리기', function () {
          if (restoreReview(snapshot)) { hideToast(); location.hash = '#/review/' + review.id; }
          else showToast('이미 이 전시에 남긴 후기가 있어요.');
        });
      });
      break;
    }
    case 'toast-action':
      e.preventDefault();
      if (typeof ui.toastHandler === 'function') { const h = ui.toastHandler; ui.toastHandler = null; h(); }
      break;

    case 'filter-region':
      ui.discover.regionId = target.dataset.value;
      ui.discover.lastChip = target.dataset.value ? getRegion(target.dataset.value).name : null;
      render();
      break;

    case 'filter-tag': {
      const t = target.dataset.value;
      const i = ui.discover.tags.indexOf(t);
      if (i === -1) { ui.discover.tags.push(t); ui.discover.lastChip = t; }
      else { ui.discover.tags.splice(i, 1); ui.discover.lastChip = null; }
      render();
      break;
    }

    case 'filter-free':
      ui.discover.freeOnly = !ui.discover.freeOnly;
      ui.discover.lastChip = ui.discover.freeOnly ? '무료' : null;
      render();
      break;

    case 'suggest':
      ui.discover.term = target.dataset.value;
      ui.discover.searchFocused = false;
      render();
      break;

    case 'clear-term':
      ui.discover.term = '';
      render();
      break;

    case 'release-last': {
      const label = ui.discover.lastChip;
      if (label === '무료') ui.discover.freeOnly = false;
      else if (TAGS.indexOf(label) !== -1) {
        ui.discover.tags = ui.discover.tags.filter(function (x) { return x !== label; });
      } else { ui.discover.regionId = ''; }
      ui.discover.lastChip = null;
      render();
      break;
    }

    case 'reset-filters':
      ui.discover = { term: '', regionId: '', freeOnly: false, tags: [], searchFocused: false, lastChip: null };
      render();
      break;

    case 'sort-reviews':
      ui.reviewSort = target.dataset.value;
      render();
      break;

    case 'select-region':
      ui.regionTab = target.dataset.value;
      render();
      break;

    case 'region-to-discover':
      ui.discover.regionId = target.dataset.value;
      ui.discover.lastChip = getRegion(target.dataset.value).name;
      ui.discover.term = '';
      location.hash = '#/discover';
      break;

    case 'assign': {
      e.preventDefault();
      const id = target.dataset.id;
      const day = target.dataset.day;
      if (assignToDay(id, day)) {
        render();
        showToast(day === 'sat' ? '토요일에 넣었어요' : '일요일에 넣었어요');
      }
      break;
    }

    case 'unplan': {
      e.preventDefault();
      const id = target.dataset.id;
      const snap = removeFromPlan(id);
      if (snap) {
        render();
        showToast('계획에서 뺐어요', '되돌리기', function () {
          restoreToPlan(id, snap); hideToast(); render();
        });
      }
      break;
    }

    case 'apply-course': {
      e.preventDefault();
      if (target.disabled) return;
      target.disabled = true;
      const article = getArticle(target.dataset.id);
      let added = 0;
      articleStops(article).forEach(function (s) {
        if (isClosed(s.ex)) return;
        if (plannedDay(s.ex.id) === null) { assignToDay(s.ex.id, 'sat'); added++; }
        else { addSaved(s.ex.id); }
      });
      ui.articleApplied[article.id] = true;
      render();
      showToast(added > 0 ? added + '곳을 저장하고 토요일에 넣었어요' : '이미 계획에 들어 있어요',
        '내 주말 보기', function () { hideToast(); location.hash = '#/my'; });
      break;
    }

    case 'set-rating':
      ui.draft.rating = Number(target.dataset.value);
      render();
      break;

    case 'set-day':
      ui.draft.day = ui.draft.day === target.dataset.value ? '' : target.dataset.value;
      render();
      break;

    case 'set-waiting':
      ui.draft.waiting = ui.draft.waiting === target.dataset.value ? null : target.dataset.value;
      render();
      break;

    case 'submit-review': {
      e.preventDefault();
      if (target.disabled || target.dataset.busy === '1') return;
      target.dataset.busy = '1';
      const d = ui.draft;
      const values = { exhibitionId: d.exId, rating: d.rating, text: d.text, day: d.day, waiting: d.waiting === 'yes' };
      if (!d.day || d.waiting === null) { target.dataset.busy = ''; return; }
      const result = d.editId ? (updateReview(d.editId, values) && getReview(d.editId)) : addReview(values);
      if (!result) { target.dataset.busy = ''; showToast('내용과 전시 상태를 다시 확인해 주세요.'); return; }
      ui.draft = null;
      location.hash = '#/review/' + result.id;
      showToast(d.editId ? '후기를 수정했어요' : '후기와 방문 기록을 저장했어요');
      break;
    }

    case 'modal-close':
      e.preventDefault();
      closeModal();
      break;

    case 'modal-confirm': {
      e.preventDefault();
      const fn = ui.modalConfirm;
      closeModal();
      if (typeof fn === 'function') fn();
      break;
    }

    case 'modal-scrim':
      if (e.target === target) closeModal();
      break;
  }
});

document.addEventListener('change', function (e) {
  if (e.target.dataset.action === 'start-time' && setDayStartTime(e.target.dataset.day, e.target.value)) {
    const day = e.target.dataset.day; render();
    const select = document.getElementById('start-' + day); if (select) select.focus();
    showToast('시작과 종료 예상 시각을 바꿨어요');
  }
});

/* 입력 이벤트 */
document.addEventListener('input', function (e) {
  const action = e.target.dataset ? e.target.dataset.action : null;
  if (action === 'search') {
    ui.discover.term = e.target.value;
    const pos = e.target.selectionStart;
    renderKeepFocus('search-input', pos);
  } else if (action === 'review-text') {
    ui.draft.text = e.target.value;
    updateCounter();
  }
});

document.addEventListener('focusin', function (e) {
  if (e.target.id === 'search-input' && !ui.discover.searchFocused && ui.discover.term === '') {
    ui.discover.searchFocused = true;
    renderKeepFocus('search-input', 0);
  }
});

function renderKeepFocus(id, pos) {
  render();
  const el = document.getElementById(id);
  if (!el) return;
  el.focus();
  if (typeof pos === 'number' && el.setSelectionRange) {
    try { el.setSelectionRange(pos, pos); } catch (err) { /* type=search 일부 브라우저 */ }
  }
}

/* 후기 글자 수는 리렌더 없이 갱신 (입력 흐름 유지) */
function updateCounter() {
  const d = ui.draft;
  const over = d.text.length > 80;
  const counter = document.querySelector('.form-counter__num');
  const errorEl = document.getElementById('text-error');
  const textarea = document.getElementById('review-text');
  const submit = document.querySelector('[data-action="submit-review"]');
  const note = document.querySelector('.sticky-bar__note');
  if (counter) {
    counter.textContent = d.text.length + ' / 80';
    counter.classList.toggle('form-counter__num--over', over);
  }
  if (errorEl) errorEl.textContent = over ? '한 줄은 80자까지 쓸 수 있어요. 지금 ' + d.text.length + '자예요.' : '';
  if (textarea) {
    textarea.classList.toggle('form-textarea--error', over);
    if (over) textarea.setAttribute('aria-invalid', 'true'); else textarea.removeAttribute('aria-invalid');
  }
  const canSubmit = d.rating >= 1 && d.text.trim().length > 0 && !over && d.day && d.waiting !== null;
  if (submit) submit.disabled = !canSubmit;
  if (note) note.style.display = canSubmit ? 'none' : '';
}

/* 별점 키보드 조작 */
document.addEventListener('keydown', function (e) {
  if (['ArrowLeft', 'ArrowRight'].indexOf(e.key) === -1) return;
  const star = e.target.closest('.rating-input__star');
  if (!star) return;
  e.preventDefault();
  const next = e.key === 'ArrowRight'
    ? Math.min(5, ui.draft.rating + 1)
    : Math.max(1, ui.draft.rating - 1);
  ui.draft.rating = next;
  render();
  const stars = document.querySelectorAll('.rating-input__star');
  if (stars[next - 1]) stars[next - 1].focus();
});

/* ============ 시작 ============ */

loadState();
if (!location.hash) location.replace('#/home');
render();

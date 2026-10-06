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

/* ============ 화면: 지역별 모아보기 ============ */

function screenRegions(query, routeChanged) {
  if (routeChanged && query.rg && getRegion(query.rg)) ui.regionTab = query.rg;
  const region = getRegion(ui.regionTab);
  const list = exhibitionsByRegion(region.id);

  return detailHeaderHTML('동네별로 보기') +
    '<main class="content-container screen--with-nav">' +
      '<h1 class="sr-only">동네별로 보기</h1>' +
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
      '<h1 class="sr-only">지난 호</h1>' +
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

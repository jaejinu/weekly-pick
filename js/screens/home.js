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

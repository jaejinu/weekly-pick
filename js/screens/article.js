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

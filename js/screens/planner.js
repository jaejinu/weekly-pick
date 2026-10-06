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
      '<p class="form-note">' + (account.enabled ? '로그인하면 저장 목록을 계정에서 이어서 이용할 수 있어요.' : '저장은 이 브라우저에서만 유지돼요.') + '</p>' +
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
      accountEntryHTML() + '<div class="screen-head"><h1>내 주말</h1>' +
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

      '<p class="service-note">'+(account.enabled?'로그인한 계정의 저장과 계획은 다른 기기에서도 이어서 볼 수 있어요.':'위클리픽은 매주 목요일에 새 호를 냅니다. 저장과 계획은 이 브라우저에만 남아요.')+'</p>' +
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

/* ============ 화면: 후기 피드 ============ */

function screenReviewFeed() {
  const list = sortedReviews(ui.reviewSort);
  return detailHeaderHTML('다녀온 사람들') +
    '<main class="content-container screen--with-nav">' +
      '<h1 class="sr-only">다녀온 사람들</h1>' +
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
          (review.waiting ? '있음' : '없음') + (review.mine ? ' · 내 후기' : review.member ? ' · 회원 후기' : ' · 샘플 후기') + '</p>' +
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

function reviewDraftValues(draft) {
  return { rating: draft.rating, text: draft.text, day: draft.day, waiting: draft.waiting };
}

function reviewDraftKey(draft) { return (account.enabled && account.user ? account.user.id + '/' : '') + draft.exId + '/' + (draft.editId || 'new'); }
function saveReviewDraft() {
  if (!ui.draft) return;
  ui.draft.persisted = reviewDraftStore.write(reviewDraftKey(ui.draft), reviewDraftValues(ui.draft), ui.draft.initial);
}
function discardReviewDraft() {
  if (ui.draft) reviewDraftStore.clear(reviewDraftKey(ui.draft));
  ui.draft = null;
}

function hasReviewDraftChanges() {
  if (!ui.draft) return false;
  return Object.keys(ui.draft.initial).some(function (key) {
    return ui.draft[key] !== ui.draft.initial[key];
  });
}

function screenReviewWrite(exId, editId) {
  if (account.enabled && (!account.user || account.phase === 'loading' || account.phase === 'boot')) return accountReviewGateHTML();
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
      day: original ? original.day : '', waiting: original ? (original.waiting ? 'yes' : 'no') : null };
    ui.draft.initial = reviewDraftValues(ui.draft);
    const restored = reviewDraftStore.read(reviewDraftKey(ui.draft), ui.draft.initial);
    if (restored) { Object.assign(ui.draft, restored); ui.draft.restored = true; }
    saveReviewDraft();
  }
  const d = ui.draft;

  const over = d.text.length > 80;
  const errors = reviewValidationErrors(d);
  const textError = over || d.textTouched ? errors.text || '' : '';
  const canSubmit = Object.keys(errors).length === 0;

  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += '<button type="button" class="rating-input__star' + (i <= d.rating ? ' is-on' : '') +
      '" role="radio" aria-checked="' + (i === d.rating) + '" data-action="set-rating" data-value="' + i +
      '" tabindex="' + (i === (d.rating || 1) ? '0' : '-1') + '" aria-label="' + i + '점"><i class="fa-' + (i <= d.rating ? 'solid' : 'regular') +
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
        '<h1 class="sr-only">' + esc(ex.title) + (editId ? ' 후기 수정' : ' 후기 남기기') + '</h1>' +
        (d.restored ? '<p class="review-edit-banner" role="status">이 탭에서 쓰던 후기를 복원했어요.</p>' : '') +
        '<span class="review-card-label">' + (editId ? '내 후기 수정' : '이 전시를 다녀오셨나요?') + '</span>' +
        (editId ? '<p class="review-edit-banner">수정 중 · ' + esc(getReview(editId).createdAt) + ' 작성</p>' : '') +
        stopCardHTML(ex, null, venueAndPeriod(ex), { href: null }) +
      '</div>' +
      '<section class="form-block">' +
        '<p class="form-block__label" id="rating-label">얼마나 좋았나요? (필수)</p>' +
        '<p class="form-block__hint">' + (d.rating ? '현재 ' + d.rating + '점 · 별을 눌러 바꿀 수 있어요' : '별을 눌러 점수를 골라 주세요') + '</p>' +
        '<div class="rating-input" role="radiogroup" aria-required="true" aria-labelledby="rating-label">' + stars + '</div>' +
      '</section>' +
      '<section class="form-block">' +
        '<label class="form-block__label" for="review-text">한 줄로 남겨 주세요 (필수, 80자 이내)</label>' +
        '<textarea id="review-text" class="form-textarea' + (textError ? ' form-textarea--error' : '') +
          '" data-action="review-text" placeholder="40분이면 충분했어요, 오전이 한산해요"' +
          ' required aria-describedby="text-error"' + (textError ? ' aria-invalid="true"' : '') + '>' + esc(d.text) + '</textarea>' +
        '<div class="form-counter">' +
          '<span id="text-error" class="form-counter__error" aria-live="polite">' +
            esc(textError) + '</span>' +
          '<span class="form-counter__num' + (over ? ' form-counter__num--over' : '') + '">' +
            d.text.length + ' / 80</span>' +
        '</div>' +
      '</section>' +
      '<section class="form-block">' +
        '<p class="form-block__label" id="day-label">언제 다녀오셨나요? (필수)</p>' +
        '<div class="choice-row" role="group" aria-labelledby="day-label">' + dayChips + '</div>' +
      '</section>' +
      '<section class="form-block">' +
        '<p class="form-block__label" id="wait-label">웨이팅이 있었나요? (필수)</p>' +
        '<div class="choice-row" role="group" aria-labelledby="wait-label">' + waitChips + '</div>' +
      '</section>' +
      '<p class="form-note" id="review-validation-status" role="status">'+esc(reviewValidationSummary(d))+'</p>'+
      '<p class="form-note" id="draft-storage-note">' + (d.persisted === false ? '임시 저장을 사용할 수 없어요. 새로고침하면 입력이 사라질 수 있어요.' : '입력은 이 탭에 임시 저장돼요. 등록해야 후기로 남아요.') + '</p>' +
      '<p class="form-note">' + (editId ? '수정해도 방문 완료 상태는 그대로 유지됩니다.' : '후기를 등록하면 방문 기록도 함께 저장돼요.') + '</p>' +
    '</main>' +
    stickyBarHTML(
      '<button type="button" class="btn btn--primary btn--full" data-action="submit-review" aria-describedby="review-validation-status"' +
      (canSubmit ? '' : ' disabled') + '>' + (editId ? '수정 완료' : '후기 등록') + '</button>' +
      (editId ? '<button class="btn btn--outline" data-action="cancel-edit">취소</button>' : ''),
      canSubmit ? null : Object.values(errors)[0]
    );
}

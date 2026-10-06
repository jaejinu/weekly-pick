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

const reviewDraftStore = createReviewDraftStore(function () { return sessionStorage; });
let currentRoute = null;
let searchComposing = false;

/* ============ 라우팅 ============ */

function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/home';
  const [path, queryStr] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  const query = {};
  (queryStr || '').split('&').filter(Boolean).forEach(function (pair) {
    const kv = pair.split('=');
    try { query[kv[0]] = decodeURIComponent(kv[1] || ''); }
    catch (error) { query[kv[0]] = ''; }
  });
  return { parts: parts, query: query, raw: raw };
}

function render() {
  saveReviewDraft();
  const r = parseHash();
  const routeChanged = currentRoute !== r.raw;
  const navigating = routeChanged && currentRoute !== null;
  if (routeChanged) {
    searchComposing = false;
    if (ui.modalConfirm) closeModal();
  }
  const name = r.parts[0] || 'home';
  const id = r.parts[1];
  if (!(name === 'review' && ['new', 'edit'].includes(id))) ui.draft = null;

  // 목록 화면을 떠날 때 스크롤 위치 기억
  if (currentRoute) ui.scrollMemory[currentRoute] = window.scrollY;

  let html = '';
  let activeTab = null;

  switch (name) {
    case 'account': html = id==='delete'?screenDeleteAccount():screenAccount(); break;
    case 'privacy': html = screenPrivacy(); break;
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
    case 'regions':   html = screenRegions(r.query, routeChanged); break;
    case 'archive':   html = screenArchive(); break;
    default:
      location.replace('#/home');
      return;
  }

  const usesBar = ['exhibition', 'article'].indexOf(name) !== -1 ||
    (name === 'review' && ['new', 'edit'].includes(r.parts[1]));
  const navHTML = usesBar ? '' : bottomNavHTML(activeTab);

  loginProtection.reset();
  app.innerHTML = html + navHTML;
  const heading = app.querySelector('main h1');
  const pageLabel = heading || app.querySelector('.detail-header__title');
  document.title = pageLabel ? pageLabel.textContent.trim() + ' — 위클리픽' : '위클리픽 — 이번 주말, 갈 만한 것만';
  loginProtection.mount();
  toastRegion.classList.toggle('toast-region--bar', usesBar);

  currentRoute = r.raw;

  // 스크롤 처리: 뒤로 가기로 목록에 돌아오면 위치 복원
  const remembered = ui.scrollMemory[r.raw];
  window.scrollTo(0, typeof remembered === 'number' ? remembered : 0);

  if (navigating) {
    const destination = heading || app.querySelector('main');
    if (destination) {
      destination.setAttribute('tabindex', '-1');
      destination.focus({ preventScroll: true });
    }
  }

  if (routeChanged && r.query.focus === '1') {
    const input = document.getElementById('search-input');
    if (input) { input.focus(); ui.discover.searchFocused = true; }
  }

  bindScrollHeader();
  announceRecovery();
}

window.addEventListener('hashchange', render);
window.addEventListener('pagehide', saveReviewDraft);

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

function openConfirm(title, desc, primaryLabel, secondaryLabel, onSecondary, trigger) {
  modalReturnFocus = trigger || document.activeElement;
  modalRoot.innerHTML = '<div class="modal-scrim" data-action="modal-scrim">' +
    '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-description">' +
      '<h2 id="modal-title">' + esc(title) + '</h2><p id="modal-description">' + esc(desc) + '</p>' +
      '<div class="modal__actions">' +
        '<button type="button" class="btn btn--primary btn--full" data-action="modal-close">' + esc(primaryLabel) + '</button>' +
        '<button type="button" class="modal__text-action" data-action="modal-confirm">' + esc(secondaryLabel) + '</button>' +
      '</div></div></div>';
  ui.modalConfirm = onSecondary;
  app.inert = true;
  toastRegion.inert = true;
  const first = modalRoot.querySelector('.btn--primary');
  if (first) first.focus();
  document.addEventListener('keydown', modalKeydown);
}

function closeModal() {
  modalRoot.innerHTML = '';
  ui.modalConfirm = null;
  document.removeEventListener('keydown', modalKeydown);
  app.inert = false;
  toastRegion.inert = false;
  if (modalReturnFocus && document.contains(modalReturnFocus)) modalReturnFocus.focus();
  modalReturnFocus = null;
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
  if (['toggle-save','assign','unplan','apply-course','move-plan','visit','submit-review','delete-review','toast-action'].includes(action) && !account.allowMutation()) { e.preventDefault(); return; }

  switch (action) {
    case 'back':
      e.preventDefault();
      if (hasReviewDraftChanges()) {
        openConfirm(ui.draft.editId ? '수정을 그만둘까요?' : '쓰던 후기가 사라져요. 그만 쓸까요?',
          '지금 나가면 변경한 별점·후기·방문 정보가 저장되지 않아요.',
          ui.draft.editId ? '계속 수정' : '계속 쓰기', '그만두기', function () {
            discardReviewDraft();
            if (history.length > 1) history.back(); else location.hash = '#/home';
          }, target);
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
        const next = button && !button.disabled ? button : app.querySelector('[data-action="move-plan"][data-id="' + target.dataset.id + '"][data-direction="' + (-Number(target.dataset.direction)) + '"]');
        if (next && !next.disabled) next.focus({ preventScroll: true });
        showToast('순서와 예상 시각을 바꿨어요');
      }
      break;
    case 'visit':
      if (markVisited(target.dataset.id)) { render(); showToast('다녀온 전시로 기록했어요'); }
      break;
    case 'cancel-edit': {
      const id = ui.draft && ui.draft.editId;
      if (!id) break;
      const cancel = function () { discardReviewDraft(); location.hash = '#/review/' + id; };
      if (hasReviewDraftChanges()) openConfirm('수정을 취소할까요?', '변경한 내용은 저장되지 않아요.', '계속 수정', '수정 취소', cancel, target);
      else cancel();
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
      }, target);
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
      focusChoice(target.dataset.action, target.dataset.value);
      break;

    case 'filter-tag': {
      const t = target.dataset.value;
      const i = ui.discover.tags.indexOf(t);
      if (i === -1) { ui.discover.tags.push(t); ui.discover.lastChip = t; }
      else { ui.discover.tags.splice(i, 1); ui.discover.lastChip = null; }
      render();
      focusChoice(target.dataset.action, target.dataset.value);
      break;
    }

    case 'filter-free':
      ui.discover.freeOnly = !ui.discover.freeOnly;
      ui.discover.lastChip = ui.discover.freeOnly ? '무료' : null;
      render();
      focusChoice(target.dataset.action, target.dataset.value);
      break;

    case 'suggest':
      ui.discover.term = target.dataset.value;
      ui.discover.searchFocused = true;
      renderKeepFocus('search-input');
      break;

    case 'clear-term':
      ui.discover.term = '';
      ui.discover.searchFocused = true;
      renderKeepFocus('search-input');
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
      ui.discover.searchFocused = true;
      renderKeepFocus('search-input');
      break;

    case 'sort-reviews':
      ui.reviewSort = target.dataset.value;
      render();
      focusChoice(target.dataset.action, target.dataset.value);
      break;

    case 'select-region':
      ui.regionTab = target.dataset.value;
      render();
      focusChoice(target.dataset.action, target.dataset.value);
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
      focusChoice(target.dataset.action, target.dataset.value);
      break;

    case 'set-day':
      ui.draft.day = ui.draft.day === target.dataset.value ? '' : target.dataset.value;
      render();
      focusChoice(target.dataset.action, target.dataset.value);
      break;

    case 'set-waiting':
      ui.draft.waiting = ui.draft.waiting === target.dataset.value ? null : target.dataset.value;
      render();
      focusChoice(target.dataset.action, target.dataset.value);
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
      discardReviewDraft();
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
  if (e.target.dataset.action === 'start-time' && !account.allowMutation()) { render(); return; }
  if (e.target.dataset.action === 'start-time' && setDayStartTime(e.target.dataset.day, e.target.value)) {
    const day = e.target.dataset.day; render();
    const select = document.getElementById('start-' + day); if (select) select.focus();
    showToast('시작과 종료 예상 시각을 바꿨어요');
  }
});

/* 한글 등 IME 조합 중에는 검색 입력 노드를 교체하지 않는다. */
document.addEventListener('compositionstart', function (e) {
  if (e.target.dataset.action === 'search') searchComposing = true;
});
document.addEventListener('compositionend', function (e) {
  if (e.target.dataset.action !== 'search') return;
  searchComposing = false;
  ui.discover.term = e.target.value;
  renderKeepFocus('search-input', e.target.selectionStart);
});

/* 입력 이벤트 */
document.addEventListener('input', function (e) {
  const action = e.target.dataset ? e.target.dataset.action : null;
  if (action === 'search') {
    if (searchComposing || e.isComposing) return;
    ui.discover.term = e.target.value;
    const pos = e.target.selectionStart;
    renderKeepFocus('search-input', pos);
  } else if (action === 'review-text') {
    ui.draft.text = e.target.value;
    saveReviewDraft();
    const storageNote = document.getElementById('draft-storage-note');
    if (storageNote && ui.draft.persisted === false) storageNote.textContent = '임시 저장을 사용할 수 없어요. 새로고침하면 입력이 사라질 수 있어요.';
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

function focusChoice(action, value) {
  const control = Array.from(app.querySelectorAll('[data-action]')).find(function (el) {
    return el.dataset.action === action && (value === undefined || el.dataset.value === String(value));
  });
  if (control) control.focus({ preventScroll: true });
}

/* 별점 키보드 조작: 한 번의 Tab 진입, 방향키로 순환 */
document.addEventListener('keydown', function (e) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
  const star = e.target.closest('.rating-input__star');
  if (!star) return;
  e.preventDefault();
  const direction = ['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : -1;
  const next = (Number(star.dataset.value) - 1 + direction + 5) % 5 + 1;
  ui.draft.rating = next;
  render();
  focusChoice('set-rating', next);
});

/* ============ 시작 ============ */

loadState();
if (!location.hash) location.replace('#/home');
render();
account.init();

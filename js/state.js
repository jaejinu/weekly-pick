/* 위클리픽 상태 — weeklypick-project.md 14장
   localStorage 읽기·쓰기·복구와 파생 계산(배지·정렬·합계) */

const KEYS = {
  saved: 'weeklypick.saved',
  plan: 'weeklypick.plan',
  reviews: 'weeklypick.reviews',
  recent: 'weeklypick.recent',
  visits: 'weeklypick.visits',
  dayStartTime: 'weeklypick.dayStartTime',
  currentDate: 'weeklypick.currentDate',
  nextReviewSeq: 'weeklypick.nextReviewSeq'
};
const STORE_VERSION = 1;

const DEFAULTS = {
  saved: ['ex-01', 'ex-02'],
  plan: { sat: ['ex-01'], sun: [] },
  reviews: [],
  recent: []
};

const state = {
  saved: [],
  plan: { sat: [], sun: [] },
  reviews: [],
  recent: [],
  visits: {},
  dayStartTime: { sat: '11:00', sun: '11:00' },
  currentDate: ISSUE_DATE,
  nextReviewSeq: 1,
  recovered: false
};

const validIds = new Set(EXHIBITIONS.map(function (e) { return e.id; }));

/* ---------- 저장소 ---------- */

function readKey(key, fallback, validate) {
  let raw;
  try {
    raw = localStorage.getItem(KEYS[key]);
  } catch (err) {
    return clone(fallback);
  }
  if (raw === null) return clone(fallback);
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== STORE_VERSION) throw new Error('version');
    const value = validate(parsed.data);
    if (value === null) throw new Error('schema');
    return value;
  } catch (err) {
    state.recovered = true;
    return clone(fallback);
  }
}

function writeKey(key, data) {
  if (typeof account !== 'undefined' && account.enabled && account.user) return;
  try {
    localStorage.setItem(KEYS[key], JSON.stringify({ v: STORE_VERSION, data: data }));
  } catch (err) {
    /* 저장 불가(프라이빗 모드 등)여도 화면 동작은 막지 않는다 */
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function validateIdList(data) {
  if (!Array.isArray(data)) return null;
  return Array.from(new Set(data.filter(function (id) { return typeof id === 'string' && validIds.has(id); })));
}

function validatePlan(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const sat = validateIdList(data.sat);
  const sun = validateIdList(data.sun);
  if (sat === null || sun === null) return null;
  // 같은 전시가 두 요일에 동시에 있을 수 없다
  const filteredSun = sun.filter(function (id) { return sat.indexOf(id) === -1; });
  return { sat: sat, sun: filteredSun };
}

function validateReviews(data) {
  if (!Array.isArray(data)) return null;
  return data.filter(function (r) {
    return r && typeof r.id === 'string' && validIds.has(r.exhibitionId) &&
      validReviewInput(r);
  });
}

function loadState() {
  state.recovered = false;
  state.saved = readKey('saved', DEFAULTS.saved, validateIdList);
  state.plan = readKey('plan', DEFAULTS.plan, validatePlan);
  state.reviews = readKey('reviews', DEFAULTS.reviews, validateReviews);
  state.recent = readKey('recent', DEFAULTS.recent, validateIdList);
  state.currentDate = readKey('currentDate', ISSUE_DATE, function (d) { return DEMO_DATES.includes(d) ? d : null; });
  state.dayStartTime = readKey('dayStartTime', { sat: '11:00', sun: '11:00' }, function (d) {
    return d && validStartTime(d.sat) && validStartTime(d.sun) ? { sat: d.sat, sun: d.sun } : null;
  });
  state.visits = readKey('visits', {}, function (d) {
    if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
    return Object.fromEntries(Object.entries(d).filter(function (p) {
      return validIds.has(p[0]) && /^\d{4}-\d{2}-\d{2}$/.test(p[1]);
    }));
  });
  state.nextReviewSeq = readKey('nextReviewSeq', 1, function (n) { return Number.isSafeInteger(n) && n > 0 ? n : null; });
  // V1 식별자를 한 번만 마이그레이션. 기존 V2 식별자는 재시작해도 유지한다.
  const used = new Set();
  state.reviews.forEach(function (r) {
    if (/^rv-my-\d+$/.test(r.id)) state.nextReviewSeq = Math.max(state.nextReviewSeq, Number(r.id.slice(6)) + 1);
  });
  state.reviews.slice().reverse().forEach(function (r) {
    if (!/^rv-my-\d+$/.test(r.id) || used.has(r.id)) r.id = 'rv-my-' + state.nextReviewSeq++;
    used.add(r.id);
    r.order = Number(r.id.slice(6));
    r.createdAt = r.createdAt || ISSUE_DATE;
    if (!state.visits[r.exhibitionId]) state.visits[r.exhibitionId] = r.createdAt;
  });
  // 계획에 있는데 저장에 없으면 저장에 되살린다 (정합성)
  allPlanned().forEach(function (id) {
    if (state.saved.indexOf(id) === -1) state.saved.push(id);
  });
  ['saved', 'plan', 'reviews', 'visits', 'nextReviewSeq'].forEach(persist);
}

function persist(key) {
  writeKey(key, state[key]);
  if (typeof account !== 'undefined') account.queueSave(key);
}

/* ---------- 저장 ---------- */

function isSaved(id) { return state.saved.indexOf(id) !== -1; }

function addSaved(id) {
  if (!validIds.has(id) || isClosed(getExhibition(id))) return false;
  if (isSaved(id)) return false;
  state.saved.unshift(id);
  persist('saved');
  return true;
}

function removeSaved(id) {
  const i = state.saved.indexOf(id);
  if (i === -1) return null;
  const planBefore = clone(state.plan);
  state.saved.splice(i, 1);
  state.plan.sat = state.plan.sat.filter(function (x) { return x !== id; });
  state.plan.sun = state.plan.sun.filter(function (x) { return x !== id; });
  persist('saved');
  persist('plan');
  return { index: i, plan: planBefore };
}

function restoreSaved(id, snapshot) {
  if (!snapshot || !validIds.has(id)) return;
  if (!isSaved(id)) state.saved.splice(snapshot.index, 0, id);
  if (!plannedDay(id)) ['sat', 'sun'].forEach(function (day) {
    const index = snapshot.plan[day].indexOf(id);
    if (index !== -1) state.plan[day].splice(index, 0, id);
  });
  persist('saved');
  persist('plan');
}

/* ---------- 계획 ---------- */

function allPlanned() {
  return state.plan.sat.concat(state.plan.sun);
}

function plannedDay(id) {
  if (state.plan.sat.indexOf(id) !== -1) return 'sat';
  if (state.plan.sun.indexOf(id) !== -1) return 'sun';
  return null;
}

function assignToDay(id, day) {
  if (!validIds.has(id) || !['sat', 'sun'].includes(day)) return false;
  const ex = getExhibition(id);
  if (isClosed(ex)) return false;
  if (plannedDay(id) === day) return true;
  addSaved(id);
  state.plan.sat = state.plan.sat.filter(function (x) { return x !== id; });
  state.plan.sun = state.plan.sun.filter(function (x) { return x !== id; });
  state.plan[day].push(id);
  persist('plan');
  persist('saved');
  return true;
}

function removeFromPlan(id) {
  const day = plannedDay(id);
  if (!day) return null;
  const index = state.plan[day].indexOf(id);
  state.plan[day].splice(index, 1);
  persist('plan');
  return { day: day, index: index };
}

function restoreToPlan(id, snapshot) {
  if (!snapshot || !validIds.has(id) || plannedDay(id)) return false;
  if (!isSaved(id)) state.saved.push(id);
  state.plan[snapshot.day].splice(snapshot.index, 0, id);
  persist('saved');
  persist('plan');
  return true;
}

function dayTotalMinutes(day) {
  return calculateTotalDuration(day).total;
}

function isOverLimit(day) {
  return dayTotalMinutes(day) > PLAN_LIMIT_MIN;
}

/* ---------- 최근 본 ---------- */

function pushRecent(id) {
  if (!validIds.has(id)) return;
  state.recent = [id].concat(state.recent.filter(function (x) { return x !== id; })).slice(0, 6);
  persist('recent');
}

/* ---------- 후기 ---------- */

function addReview(review) {
  if (!canWriteReview(getExhibition(review.exhibitionId)) || !validReviewInput(review)) return null;
  if (myReviewOf(review.exhibitionId)) return null;
  const seq = state.nextReviewSeq++;
  const saved = Object.assign({}, review, { id: 'rv-my-' + seq, order: seq, text: review.text.trim(), createdAt: typeof account!=='undefined' && account.enabled ? new Date().toISOString().slice(0,10) : state.currentDate });
  state.reviews.unshift(saved);
  persist('nextReviewSeq');
  markVisited(review.exhibitionId);
  persist('reviews');
  return saved;
}

function allReviews() {
  // 내가 쓴 후기 + 샘플 후기
  const mine = state.reviews.map(function (r) {
    return Object.assign({}, r, { mine: true });
  });
  const sample = SAMPLE_REVIEWS.map(function (r) {
    return Object.assign({}, r, { mine: false });
  });
  const members = typeof account !== 'undefined' && account.enabled ? account.publicReviews.filter(function (r) { return !r.isOwn; }) : [];
  return mine.concat(members, sample);
}

function getReview(id) {
  return allReviews().filter(function (r) { return r.id === id; })[0] || null;
}

function reviewsOf(exhibitionId) {
  return allReviews().filter(function (r) { return r.exhibitionId === exhibitionId; });
}

function sortedReviews(mode) {
  const list = allReviews().slice();
  if (mode === 'rating') {
    list.sort(function (a, b) {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return reviewOrder(b) - reviewOrder(a);
    });
  } else {
    list.sort(function (a, b) { return reviewOrder(b) - reviewOrder(a); });
  }
  return list;
}

function reviewOrder(r) {
  // 내가 쓴 후기는 항상 샘플보다 최신
  if (r.member) return r.order || 0;
  if (r.mine && typeof account !== 'undefined' && account.enabled) return Date.parse(r.createdAt) + (r.order || 0);
  return r.mine ? 1000 + (r.order || 0) : (r.order || 0);
}

/* ---------- 전시 파생 계산 ---------- */

function getExhibition(id) {
  return EXHIBITIONS.filter(function (e) { return e.id === id; })[0] || null;
}

function getRegion(id) {
  return REGIONS.filter(function (r) { return r.id === id; })[0] || null;
}

function getArticle(id) {
  return ARTICLES.filter(function (a) { return a.id === id; })[0] || null;
}

function dayDiff(fromISO, toISO) {
  const a = Date.parse(fromISO + 'T00:00:00Z');
  const b = Date.parse(toISO + 'T00:00:00Z');
  return Math.round((b - a) / 86400000);
}

function isClosed(ex) {
  return getRuntimeStatus(ex) === 'ended';
}

function daysLeft(ex) {
  return getDaysUntilEnd(ex);
}

function isEndingSoon(ex) {
  const d = dayDiff(ISSUE_DATE, ex.end);
  return d >= 0 && d <= ENDING_SOON_DAYS;
}

function isFree(ex) { return ex.price === 0; }

/** 카드에 노출할 배지 (최대 2개, 우선순위 종료 임박 > 무료 > 예약 필수) */
function badgesOf(ex) {
  if (isClosed(ex)) return [];
  const list = [];
  if (isEndingSoon(ex)) list.push({ kind: 'ending', label: '종료 임박', icon: 'fa-hourglass-half' });
  if (isFree(ex)) list.push({ kind: 'free', label: '무료', icon: 'fa-ticket' });
  if (ex.booking === '필수') list.push({ kind: 'booking', label: '예약 필수', icon: 'fa-calendar-check' });
  return list.slice(0, 2);
}

function priceLabel(ex) {
  return ex.price === 0 ? '무료' : ex.price.toLocaleString('ko-KR') + '원';
}

function periodLabel(ex) {
  return shortDate(ex.start) + '–' + shortDate(ex.end);
}

function shortDate(iso) {
  const parts = iso.split('-');
  return parts[1] + '.' + parts[2];
}

function venueAndPeriod(ex) {
  return ex.venue + ' · ' + periodLabel(ex);
}

/** 고정 정렬: 종료 임박 → 픽 → 나머지 → 종료됨 */
function sortExhibitions(list) {
  return list.slice().sort(function (a, b) {
    return sortRank(a) - sortRank(b) || tieBreak(a, b);
  });
}

function sortRank(ex) {
  if (isClosed(ex)) return 4;
  if (isEndingSoon(ex)) return 1;
  if (ex.pick > 0) return 2;
  return 3;
}

function tieBreak(a, b) {
  const rank = sortRank(a);
  if (rank === 1) return daysLeft(a) - daysLeft(b);
  if (rank === 2) return a.pick - b.pick;
  if (rank === 4) return dayDiff(a.end, b.end);   // 종료됨: 최근 종료 순
  return dayDiff(b.end, a.end);                    // 나머지: 곧 끝나는 순
}

function picks() {
  return EXHIBITIONS.filter(function (e) { return e.pick > 0; })
    .sort(function (a, b) { return a.pick - b.pick; });
}

function endingSoonList() {
  return sortExhibitions(EXHIBITIONS.filter(function (e) {
    return !isClosed(e) && isEndingSoon(e);
  }));
}

function exhibitionsByRegion(regionId) {
  return sortExhibitions(EXHIBITIONS.filter(function (e) { return e.regionId === regionId; }));
}

/** 검색 + 필터 */
function filterExhibitions(query) {
  let list = EXHIBITIONS.slice();
  const term = (query.term || '').trim().toLowerCase();
  if (term) {
    list = list.filter(function (e) {
      const region = getRegion(e.regionId);
      const haystack = [e.title, e.venue, region ? region.name : '', e.tags.join(' ')]
        .join(' ').toLowerCase().replace(/\s+/g, '');
      return haystack.indexOf(term.replace(/\s+/g, '')) !== -1;
    });
  }
  if (query.regionId) {
    list = list.filter(function (e) { return e.regionId === query.regionId; });
  }
  if (query.freeOnly) {
    list = list.filter(isFree);
  }
  if (query.tags && query.tags.length) {
    list = list.filter(function (e) {
      return query.tags.some(function (t) { return e.tags.indexOf(t) !== -1; });
    });
  }
  return sortExhibitions(list);
}

/* ---------- 기사 파생 ---------- */

function articleStops(article) {
  return timelineForIds(article.stops.map(function (s) { return s.exhibitionId; }), article.stops[0].time)
    .map(function (s) { return { time: clockLabel(s.start), ex: s.ex }; });
}

function articleViewMinutes(article) {
  return articleStops(article).reduce(function (sum, s) { return sum + s.ex.duration; }, 0);
}

function articleCost(article) {
  return articleStops(article).reduce(function (sum, s) { return sum + s.ex.price; }, 0);
}

function articleIsApplied(article) {
  return articleStops(article).every(function (s) {
    return plannedDay(s.ex.id) !== null || isClosed(s.ex);
  });
}

/* ---------- 시간 표기 ---------- */

function minutesLabel(min) {
  if (min < 60) return min + '분';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? h + '시간' : h + '시간 ' + m + '분';
}

function minutesParts(min) {
  // Anton 숫자와 Pretendard 단위를 분리한다 (규정 4.3)
  if (min < 60) return { h: null, m: min };
  return { h: Math.floor(min / 60), m: min % 60 };
}

/* ---------- V2: 시간·방문·후기 ---------- */
function getRuntimeStatus(ex) {
  if (!ex) return null;
  if (state.currentDate > ex.end) return 'ended';
  return state.currentDate < ex.start ? 'upcoming' : 'active';
}
function getDaysUntilEnd(ex) { return dayDiff(state.currentDate, ex.end); }
function isIssueEndingSoon(ex) { return isEndingSoon(ex); }
function canMarkVisited(ex) { return !!ex && getRuntimeStatus(ex) !== 'upcoming'; }
function canWriteReview(ex) { return canMarkVisited(ex); }
function setCurrentDate(date) {
  if (!DEMO_DATES.includes(date)) return false;
  state.currentDate = date; persist('currentDate'); return true;
}
function weekendLabel() {
  return (state.currentDate > WEEKEND_SUN ? '지난 주말' : '이번 주말') + ' 9.12 토 – 9.13 일';
}
function validStartTime(time) { return /^(10|11|12|13|14):(00|30)$|^15:00$/.test(time); }
function setDayStartTime(day, time) {
  if (!['sat', 'sun'].includes(day) || !validStartTime(time)) return false;
  state.dayStartTime[day] = time; persist('dayStartTime'); return true;
}
function getTravelMinutes(a, b) {
  const pair = TRAVEL_PAIRS.find(function (p) { return (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a); });
  if (!pair) throw new Error('알 수 없는 권역 이동');
  return pair[2];
}
function clockMinutes(time) { const p = time.split(':').map(Number); return p[0] * 60 + p[1]; }
function clockLabel(minutes) { return String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0'); }
function timelineForIds(ids, startTime) {
  let cursor = clockMinutes(startTime);
  let previous = null;
  return ids.map(getExhibition).filter(Boolean).map(function (ex) {
    const travel = previous ? getTravelMinutes(previous.regionId, ex.regionId) : 0;
    cursor += travel;
    const row = { ex: ex, start: cursor, end: cursor + ex.duration, travel: travel };
    cursor = row.end; previous = ex; return row;
  });
}
function calculateTimeline(day) { return timelineForIds(state.plan[day], state.dayStartTime[day]); }
function calculateTotalDuration(day) {
  const rows = calculateTimeline(day);
  const view = rows.reduce(function (n, r) { return n + r.ex.duration; }, 0);
  const travel = rows.reduce(function (n, r) { return n + r.travel; }, 0);
  return { view: view, travel: travel, total: view + travel, end: rows.length ? rows[rows.length - 1].end : clockMinutes(state.dayStartTime[day]) };
}
function movePlan(id, direction) {
  const day = plannedDay(id);
  if (!day || ![-1, 1].includes(direction)) return false;
  const list = state.plan[day], from = list.indexOf(id), to = from + direction;
  if (to < 0 || to >= list.length) return false;
  [list[from], list[to]] = [list[to], list[from]];
  persist('plan'); return true;
}
function markVisited(id) {
  if (!canMarkVisited(getExhibition(id))) return false;
  if (!state.visits[id]) state.visits[id] = state.currentDate;
  persist('visits'); return true;
}
function myReviewOf(id) { return state.reviews.find(function (r) { return r.exhibitionId === id; }) || null; }
function validReviewInput(r) {
  return r && Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5 && typeof r.text === 'string' &&
    r.text.trim().length > 0 && r.text.length <= 80 && ['토요일', '일요일', '평일'].includes(r.day) && typeof r.waiting === 'boolean';
}
function updateReview(id, changes) {
  const r = state.reviews.find(function (r) { return r.id === id; });
  if (!r || !canWriteReview(getExhibition(r.exhibitionId)) || !validReviewInput(changes)) return false;
  Object.assign(r, { rating: changes.rating, text: changes.text.trim(), day: changes.day, waiting: changes.waiting });
  persist('reviews'); return true;
}
function deleteReview(id) {
  const index = state.reviews.findIndex(function (r) { return r.id === id; });
  if (index < 0) return null;
  const review = state.reviews.splice(index, 1)[0];
  persist('reviews'); return { review: review, index: index };
}
function restoreReview(snapshot) {
  if (!snapshot || state.reviews.some(function (r) { return r.id === snapshot.review.id || r.exhibitionId === snapshot.review.exhibitionId; })) return false;
  state.reviews.splice(Math.min(snapshot.index, state.reviews.length), 0, snapshot.review);
  state.visits[snapshot.review.exhibitionId] = state.visits[snapshot.review.exhibitionId] || snapshot.review.createdAt;
  persist('reviews'); persist('visits'); return true;
}
function articleMoveMinutes(article) {
  return timelineForIds(article.stops.map(function (s) { return s.exhibitionId; }), article.stops[0].time)
    .reduce(function (n, s) { return n + s.travel; }, 0);
}

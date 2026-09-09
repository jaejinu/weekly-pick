/* 위클리픽 상태 — weeklypick-project.md 14장
   localStorage 읽기·쓰기·복구와 파생 계산(배지·정렬·합계) */

const KEYS = {
  saved: 'weeklypick.saved',
  plan: 'weeklypick.plan',
  reviews: 'weeklypick.reviews',
  recent: 'weeklypick.recent'
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
  return data.filter(function (id) { return typeof id === 'string' && validIds.has(id); });
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
      typeof r.rating === 'number' && r.rating >= 1 && r.rating <= 5 &&
      typeof r.text === 'string' && r.text.length > 0 && r.text.length <= 80;
  });
}

function loadState() {
  state.recovered = false;
  state.saved = readKey('saved', DEFAULTS.saved, validateIdList);
  state.plan = readKey('plan', DEFAULTS.plan, validatePlan);
  state.reviews = readKey('reviews', DEFAULTS.reviews, validateReviews);
  state.recent = readKey('recent', DEFAULTS.recent, validateIdList);
  // 계획에 있는데 저장에 없으면 저장에 되살린다 (정합성)
  allPlanned().forEach(function (id) {
    if (state.saved.indexOf(id) === -1) state.saved.push(id);
  });
}

function persist(key) {
  writeKey(key, state[key]);
}

/* ---------- 저장 ---------- */

function isSaved(id) { return state.saved.indexOf(id) !== -1; }

function addSaved(id) {
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
  if (!isSaved(id)) state.saved.splice(snapshot.index, 0, id);
  state.plan = snapshot.plan;
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
  if (!validIds.has(id)) return false;
  const ex = getExhibition(id);
  if (isClosed(ex)) return false;
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
  state.plan[snapshot.day].splice(snapshot.index, 0, id);
  persist('plan');
}

function dayTotalMinutes(day) {
  return state.plan[day].reduce(function (sum, id) {
    const ex = getExhibition(id);
    return sum + (ex ? ex.duration : 0);
  }, 0);
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
  state.reviews.unshift(review);
  persist('reviews');
}

function allReviews() {
  // 내가 쓴 후기 + 샘플 후기
  const mine = state.reviews.map(function (r) {
    return Object.assign({}, r, { mine: true });
  });
  const sample = SAMPLE_REVIEWS.map(function (r) {
    return Object.assign({}, r, { mine: false });
  });
  return mine.concat(sample);
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
  return dayDiff(TODAY, ex.end) < 0;
}

function daysLeft(ex) {
  return dayDiff(TODAY, ex.end);
}

function isEndingSoon(ex) {
  const d = daysLeft(ex);
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
  return article.stops.map(function (s) {
    return { time: s.time, ex: getExhibition(s.exhibitionId) };
  }).filter(function (s) { return s.ex; });
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

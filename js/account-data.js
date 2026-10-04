const ACCOUNT_KEYS = ['saved', 'plan', 'reviews', 'visits', 'dayStartTime', 'nextReviewSeq'];
function emptyAccountLibrary() {
  return {saved:[],plan:{sat:[],sun:[]},reviews:[],visits:{},dayStartTime:{sat:'11:00',sun:'11:00'},nextReviewSeq:1};
}
function accountSnapshot() {
  return Object.fromEntries(ACCOUNT_KEYS.map(function (key) { return [key, clone(state[key])]; }));
}
function normalizeAccountLibrary(value) {
  if (!value || typeof value !== 'object') throw new Error('INVALID_LIBRARY');
  const saved = validateIdList(value.saved), plan = validatePlan(value.plan), reviews = validateReviews(value.reviews);
  if (!saved || !plan || !reviews || !value.visits || !value.dayStartTime ||
      !validStartTime(value.dayStartTime.sat) || !validStartTime(value.dayStartTime.sun) ||
      !Number.isSafeInteger(value.nextReviewSeq) || value.nextReviewSeq < 1) throw new Error('INVALID_LIBRARY');
  const result = {saved:saved,plan:plan,reviews:reviews,visits:{},dayStartTime:clone(value.dayStartTime),nextReviewSeq:value.nextReviewSeq};
  Object.keys(value.visits).forEach(function (id) {
    if (validIds.has(id) && /^\d{4}-\d{2}-\d{2}$/.test(value.visits[id])) result.visits[id] = value.visits[id];
  });
  result.reviews.forEach(function (review) {
    if (!/^rv-my-[1-9]\d*$/.test(review.id) || !review.createdAt) throw new Error('INVALID_LIBRARY');
    result.visits[review.exhibitionId] = result.visits[review.exhibitionId] || review.createdAt;
    result.nextReviewSeq = Math.max(result.nextReviewSeq, Number(review.id.slice(6)) + 1);
  });
  [...plan.sat,...plan.sun].forEach(function(id){if(!result.saved.includes(id)) result.saved.push(id);});
  return clone(result);
}
function applyAccountLibrary(value) {
  const normalized = normalizeAccountLibrary(value);
  ACCOUNT_KEYS.forEach(function(key){state[key]=normalized[key];});
}
function mergeGuestLibrary(remote, guest) {
  const result = normalizeAccountLibrary(remote), source = normalizeAccountLibrary(guest);
  result.saved = [...new Set([...result.saved,...source.saved])];
  ['sat','sun'].forEach(function(day){source.plan[day].forEach(function(id){
    if(!result.plan.sat.includes(id) && !result.plan.sun.includes(id)) result.plan[day].push(id);
  });});
  result.visits = Object.assign({},source.visits,result.visits);
  source.reviews.slice().reverse().forEach(function(review){
    if(result.reviews.some(function(r){return r.exhibitionId===review.exhibitionId;})) return;
    const seq=result.nextReviewSeq++;
    result.reviews.unshift(Object.assign({},review,{id:'rv-my-'+seq,order:seq}));
  });
  return result;
}
function accountLibraryFingerprint(value) {
  function canonical(value) {
    if(Array.isArray(value)) return value.map(canonical);
    if(value && typeof value==='object') return Object.fromEntries(Object.keys(value).sort().map(function(k){return [k,canonical(value[k])];}));
    return value;
  }
  return JSON.stringify(canonical(value));
}

function sameAccountLibrary(a,b) { return accountLibraryFingerprint(a)===accountLibraryFingerprint(b); }

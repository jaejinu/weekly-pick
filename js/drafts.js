/* 같은 탭의 후기 임시 입력. 저장된 후기와 별도로 관리한다. */
function createReviewDraftStore(getStorage) {
  const prefix = 'weeklypick.reviewDraft.';
  const memory = new Map();
  function valid(values) {
    return values && Number.isInteger(values.rating) && values.rating >= 0 && values.rating <= 5 &&
      typeof values.text === 'string' && values.text.length <= 10000 &&
      ['', '토요일', '일요일', '평일'].includes(values.day) && [null, 'yes', 'no'].includes(values.waiting);
  }
  function equal(a, b) {
    return ['rating', 'text', 'day', 'waiting'].every(function (key) { return a[key] === b[key]; });
  }
  function clear(key) {
    memory.set(key, null);
    try { getStorage().removeItem(prefix + key); } catch (error) { /* 저장소 차단 시 메모리만 유지 */ }
  }
  return {
    clear: clear,
    clearPrefix: function (ownerPrefix) {
      for (const key of memory.keys()) if (key.startsWith(ownerPrefix)) memory.delete(key);
      try {
        const storage=getStorage();
        for (const key of Object.keys(storage)) if (key.startsWith(prefix+ownerPrefix)) storage.removeItem(key);
      } catch (error) { /* in-memory drafts are already removed */ }
    },
    write: function (key, values, initial) {
      if (!valid(values) || !valid(initial)) return false;
      if (equal(values, initial)) { clear(key); return true; }
      const record = { v: 1, values: Object.assign({}, values), initial: Object.assign({}, initial) };
      memory.set(key, record);
      try { getStorage().setItem(prefix + key, JSON.stringify(record)); return true; }
      catch (error) { return false; }
    },
    read: function (key, initial) {
      let record;
      try {
        record = memory.has(key) ? memory.get(key) : JSON.parse(getStorage().getItem(prefix + key));
      } catch (error) { clear(key); return null; }
      if (!record) return null;
      // 원문이 바뀐 후에는 과거 수정 초안으로 덮지 않는다.
      if (record.v !== 1 || !valid(record.values) || !valid(record.initial) || !valid(initial) || !equal(record.initial, initial)) {
        clear(key); return null;
      }
      return { rating: record.values.rating, text: record.values.text, day: record.values.day, waiting: record.values.waiting };
    }
  };
}

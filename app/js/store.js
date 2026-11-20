// Leonida Ledger — progress store.
// Keeps the checklist in localStorage, exports it as a JSON file and reads
// one back. On a first visit (nothing saved yet) it seeds a demo set of 13
// earned trophies so the guide shows a lived-in roadmap in screenshots.

const KEY = 'leonida-ledger-v1';

// The demo set: the early story run plus two activities, 13 of 55 earned.
export const DEMO_EARNED = [
  'just-like-paradise',
  'paradise-lost',
  't-ass-drug-money',
  'vice-city-baby',
  'top-of-the-world-ma',
  'trust',
  'break-the-bank',
  'family-matters',
  'dwnfall',
  'hi-jacked',
  'snow-storm',
  'master-of-none',
  'stick-fiddler',
];

export function defaultState() {
  return {
    earned: [...DEMO_EARNED],
    spoiler: true,
    seeded: true,
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const fresh = defaultState();
      saveState(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw);
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned : [],
      spoiler: parsed.spoiler !== false,
      seeded: !!parsed.seeded,
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode): the guide still works for the visit.
  }
}

export function isEarned(state, id) {
  return state.earned.includes(id);
}

export function toggleEarned(state, id) {
  const at = state.earned.indexOf(id);
  if (at >= 0) state.earned.splice(at, 1);
  else state.earned.push(id);
  saveState(state);
  return state;
}

export function earnedCount(state, trophies) {
  const ids = new Set(trophies.map((t) => t.id));
  return state.earned.filter((id) => ids.has(id)).length;
}

export function resetProgress(state) {
  state.earned = [];
  state.seeded = false;
  saveState(state);
  return state;
}

/** Serialise the progress for export. Returns the JSON text. */
export function exportText(state) {
  return JSON.stringify(
    { app: 'leonida-ledger', version: 1, earned: [...state.earned].sort() },
    null,
    2,
  );
}

/** Parse an imported progress file. Throws on bad input. Returns the id list. */
export function parseImport(text) {
  const doc = JSON.parse(text);
  const list = Array.isArray(doc) ? doc : doc.earned;
  if (!Array.isArray(list)) throw new Error('no earned list in file');
  return list.filter((x) => typeof x === 'string');
}

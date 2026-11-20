// filters.js — the checklist's filter state and the rules that decide what shows.
// Kinds: story, missable, collectibles, activities, online (the official list has no
// online trophies, so that filter always shows an empty list with an explanation).
// The spoiler rule: when the spoiler setting is on, a story trophy that is not yet
// earned is masked — its name and description read as hidden until it is earned.
export const FILTER_STATE = {
  kind: 'all',
  grade: 'all',
  state: 'all',
  search: '',
};

/** Does a trophy pass the current kind/grade/state/search filters? */
export function trophyMatches(trophy, earned) {
  const f = FILTER_STATE;
  if (f.kind === 'missable' && !trophy.missable) return false;
  if (f.kind === 'online') return false;
  if (f.kind !== 'all' && f.kind !== 'missable' && f.kind !== 'online' && trophy.kind !== f.kind) return false;
  if (f.grade !== 'all' && trophy.grade !== f.grade) return false;
  const isEarned = earned.has(trophy.id);
  if (f.state === 'earned' && !isEarned) return false;
  if (f.state === 'remaining' && isEarned) return false;
  if (f.search) {
    const hay = (trophy.name + ' ' + trophy.description).toLowerCase();
    if (!hay.includes(f.search.toLowerCase())) return false;
  }
  return true;
}

/** Count trophies per kind for the filter chips (online is always 0 — the list has none). */
export function kindCounts(trophies) {
  const counts = { all: trophies.length, story: 0, missable: 0, collectibles: 0, activities: 0, online: 0 };
  for (const t of trophies) {
    if (t.kind === 'story') counts.story += 1;
    if (t.kind === 'collectibles') counts.collectibles += 1;
    if (t.kind === 'activities') counts.activities += 1;
    if (t.missable) counts.missable += 1;
  }
  return counts;
}

/** Should this trophy's name and description be masked by the spoiler setting? */
export function isSpoilerMasked(trophy, earned, spoilerOn) {
  return spoilerOn && trophy.kind === 'story' && !earned.has(trophy.id);
}

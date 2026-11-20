// Leonida Ledger — filters.
// Pure functions over the trophy list: search text, kind, grade, earned
// status, and the spoiler mask. Nothing here touches the DOM or storage,
// so the checklist, roadmap and missables pages all share one rule set.

/**
 * Apply the toolbar filters to a trophy list.
 * opts: { q, kind, grade, status, earnedSet }
 *   q: free text matched against name + description (case-insensitive)
 *   kind: 'all' | 'story' | 'missable' | 'collectibles' | 'activities' | 'online'
 *   grade: 'all' | 'platinum' | 'gold' | 'silver' | 'bronze'
 *   status: 'all' | 'earned' | 'remaining'
 * Returns the trophies in list order.
 */
export function applyFilters(trophies, opts) {
  const q = (opts.q || '').trim().toLowerCase();
  const earned = opts.earnedSet || new Set();
  return trophies.filter((t) => {
    if (q) {
      const hay = (t.name + ' ' + t.description).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (opts.kind && opts.kind !== 'all') {
      if (opts.kind === 'missable') {
        if (!t.missable) return false;
      } else if (t.kind !== opts.kind) {
        return false;
      }
    }
    if (opts.grade && opts.grade !== 'all' && t.grade !== opts.grade) return false;
    if (opts.status === 'earned' && !earned.has(t.id)) return false;
    if (opts.status === 'remaining' && earned.has(t.id)) return false;
    return true;
  });
}

/**
 * Should this trophy's name and guide be hidden behind the spoiler mask?
 * Only story trophies the reader has not earned yet are masked, and only
 * while the spoiler setting is on.
 */
export function isMasked(trophy, spoilerOn, earnedSet) {
  if (!spoilerOn) return false;
  if (earnedSet.has(trophy.id)) return false;
  return trophy.kind === 'story' || trophy.grade === 'platinum';
}

/** Count earned trophies inside one roadmap stage. */
export function stageProgress(trophies, stage, earnedSet) {
  const inStage = trophies.filter((t) => t.stage === stage);
  const done = inStage.filter((t) => earnedSet.has(t.id)).length;
  return { done, total: inStage.length };
}

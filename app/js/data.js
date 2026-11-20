// Leonida Ledger — data layer.
// Loads the official trophy list and offers small lookups over it. The JSON
// itself is the source of truth; this module only reads it and derives the
// shapes the views need (grouped by grade, by roadmap stage, by kind).

const DATA_URL = 'data/trophies.json';

export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export const GRADE_LABEL = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

export const KIND_LABEL = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  online: 'Online',
  platinum: 'Platinum',
};

export const ROADMAP_STAGES = [
  { n: 1, title: 'Stage 1 — Play the story', blurb: 'Chapters 1–4 and the finale, in order. Every chapter and story mission trophy lands here.' },
  { n: 2, title: 'Stage 2 — Strangers & activities', blurb: 'Stranger mission strands, then the activity list: ranges, races, fishing, robberies and the one-time events. Do the missables here, while the story is fresh.' },
  { n: 3, title: 'Stage 3 — Collectibles & counts', blurb: 'Stunts, cards, WAiNK spots, meditation, vehicles and exploration. Slow, steady counting — best done with the map open.' },
  { n: 4, title: 'Stage 4 — Cleanup & platinum', blurb: 'Money trophies, 100% completion, then the platinum pops on its own.' },
];

/** Fetch app/data/trophies.json and return { meta, sources, trophies }. */
export async function loadTrophyFile() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error('could not load ' + DATA_URL);
  const doc = await res.json();
  const trophies = Array.isArray(doc) ? doc : doc.trophies;
  const meta = Array.isArray(doc) ? {} : doc.meta || {};
  const sources = Array.isArray(doc) ? [] : doc.sources || [];
  return { meta, sources, trophies };
}

export function trophyById(trophies, id) {
  return trophies.find((t) => t.id === id) || null;
}

export function countByGrade(trophies) {
  const out = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) if (t.grade in out) out[t.grade] += 1;
  return out;
}

export function missableTrophies(trophies) {
  return trophies.filter((t) => t.missable);
}

export function trophiesInStage(trophies, stage) {
  return trophies.filter((t) => t.stage === stage);
}

/** A trophy counts as a story trophy for the spoiler mask. */
export function isStoryTrophy(t) {
  return t.kind === 'story' || t.grade === 'platinum';
}

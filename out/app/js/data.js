// data.js — loads the trophy list (app/data/trophies.json) and exposes it with helpers.
// The file is fetched from this app's own server at run time; nothing is fetched from the network.
export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  online: 'Online',
  platinum: 'Platinum',
};

export const GRADE_LABELS = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

let cache = null;

/** Load the trophy data once; returns { meta, sources, trophies }. */
export async function loadTrophies() {
  if (cache) return cache;
  const res = await fetch('data/trophies.json');
  if (!res.ok) throw new Error('Could not load data/trophies.json (' + res.status + ')');
  const data = await res.json();
  cache = data;
  return data;
}

/** Find a trophy by its numeric id. */
export function trophyById(data, id) {
  return data.trophies.find((t) => t.id === id) || null;
}

/** Count earned trophies per grade. */
export function gradeCounts(data, earned) {
  const counts = {};
  for (const g of GRADE_ORDER) {
    counts[g] = {
      total: data.trophies.filter((t) => t.grade === g).length,
      earned: data.trophies.filter((t) => t.grade === g && earned.has(t.id)).length,
    };
  }
  return counts;
}

/** The four missable trophies, in list order. */
export function missableTrophies(data) {
  return data.trophies.filter((t) => t.missable);
}

/** Trophies of one roadmap stage, in list order. */
export function stageTrophies(data, stage) {
  return data.trophies.filter((t) => t.stage === stage);
}

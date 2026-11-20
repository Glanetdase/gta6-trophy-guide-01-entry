// views.js — renders every screen of the guide from the trophy data and the saved state.
// The checklist shows the official name, description and grade of each trophy; the
// detail pane shows the selected trophy's guide and its sources; the roadmap and
// missables pages are built from the official descriptions.
import { GRADE_LABELS, KIND_LABELS, gradeCounts, missableTrophies, stageTrophies, trophyById } from './data.js';
import { FILTER_STATE, isSpoilerMasked, kindCounts, trophyMatches } from './filters.js';

export const ROADMAP_STAGES = [
  {
    stage: 1,
    title: 'Play the story',
    text: 'Finish Chapters 1 to 4 and the final mission. Every chapter and mission trophy in this stage is unmissable: complete the mission and it pops. While you play, keep the two partner trophies in mind (Hot Together, Retail Therapy) — they need a partner beside you, so attempt them while partners are still around for missions. Also keep a manual save before major story choices: Actions Speak Louder is the one trophy a locked-in choice could affect.',
  },
  {
    stage: 2,
    title: 'Strangers and activities',
    text: 'Clear the stranger strands — Andy, Kenton, Billy, Randy and Tyrone each end in a final mission with its own trophy, and any 8 finished strands earn Strangers & Freaks. Then sample every activity once for Master of None, and work the activity trophies: races, the shooting range (42 challenges for gold), drone races, fishing against Cal, the arcade, bowling, meditation, hunting for Bret and the combat trophies.',
  },
  {
    stage: 3,
    title: 'Collectibles and counts',
    text: 'Sweep the long counts: 250 stunts, 100 vehicles discovered, 100 WAiNK locations, 3 collectible card sets, every meditation spot, every region of Leonida, all garage properties, 10 vehicles registered to Scooter Bros, 50 challenges and 5 bank vaults. These are cumulative across the whole game, so they finish fastest when you fold them into normal travel instead of grinding them in one sitting.',
  },
  {
    stage: 4,
    title: 'Money and 100%',
    text: 'Finish the money goals — $250,000 laundered through your contacts (Dime on the Dollar) and $100,000 spent across all shops (Treat Yo Self) — then use the in-game completion tracker to close out 100% completion for A Long Road. When that gold pops, the platinum (Vice Got a Price!) follows at once.',
  },
];

/** Escape text for safe insertion into HTML. */
export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function gradeTag(t) {
  return '<span class="grade-tag grade-' + t.grade + '">' + GRADE_LABELS[t.grade] + '</span>';
}

function kindTag(t) {
  const label = t.kind === 'platinum' ? 'Platinum' : KIND_LABELS[t.kind];
  return '<span class="kind-tag">' + label + '</span>';
}

/** Render the checklist rows into #trophy-list, and the counts line above it. */
export function renderChecklist(data, earned, settings, selectedId, onSelect) {
  const list = document.getElementById('trophy-list');
  const note = document.getElementById('list-note');
  const visible = data.trophies.filter((t) => trophyMatches(t, earned));
  if (FILTER_STATE.kind === 'online') {
    note.textContent = 'The official PlayStation 5 list has no online trophies — all 55 are earned in single-player. Use the other filters to browse them.';
  } else if (visible.length === data.trophies.length) {
    note.textContent = 'Showing all 55 official trophies. Tick a trophy when you earn it — progress saves in this browser.';
  } else {
    note.textContent = 'Showing ' + visible.length + ' of 55 trophies.';
  }
  if (visible.length === 0) {
    list.innerHTML = '<li class="empty-list">No trophies match these filters. Try clearing the search or picking another kind.</li>';
    return;
  }
  list.innerHTML = visible.map((t) => {
    const isEarned = earned.has(t.id);
    const masked = isSpoilerMasked(t, earned, settings.spoiler);
    const name = masked ? 'Hidden story trophy' : esc(t.name);
    const desc = masked
      ? '<span class="hidden-note">Hidden until earned — turn the spoiler setting off to reveal it.</span>'
      : esc(t.description);
    return '<li><button type="button" class="trophy-row' + (isEarned ? ' earned' : '') + (t.id === selectedId ? ' selected' : '') + '" data-id="' + t.id + '">' +
      '<span class="check" aria-hidden="true">' + (isEarned ? '✓' : '') + '</span>' +
      '<span><span class="trophy-name">' + name + '</span><br><span class="trophy-desc">' + desc + '</span></span>' +
      '<span class="row-tags">' + (t.missable ? '<span class="miss-flag">⚠ Missable</span>' : '') + kindTag(t) + gradeTag(t) + '</span>' +
      '</button></li>';
  }).join('');
  list.querySelectorAll('.trophy-row').forEach((row) => {
    row.addEventListener('click', () => onSelect(Number(row.dataset.id)));
  });
}

/** Render the filter chip counts. */
export function renderChipCounts(data) {
  const counts = kindCounts(data.trophies);
  document.querySelectorAll('.chip-n').forEach((el) => {
    const key = el.dataset.n;
    el.textContent = '(' + (counts[key] ?? 0) + ')';
  });
  const miss = document.getElementById('missable-count');
  if (miss) miss.textContent = String(counts.missable);
}

/** Render the header progress bar and per-grade counts. */
export function renderProgress(data, earned) {
  const total = data.trophies.length;
  const n = earned.size;
  document.getElementById('progress-count').textContent = n + ' / ' + total;
  document.getElementById('progress-pct').textContent = Math.round((n / total) * 100) + '%';
  const fill = document.getElementById('progress-fill');
  fill.style.width = (n / total) * 100 + '%';
  const bar = document.querySelector('.progress-bar');
  bar.setAttribute('aria-valuenow', String(n));
  const counts = gradeCounts(data, earned);
  document.getElementById('progress-grades').textContent =
    'Platinum ' + counts.platinum.earned + '/' + counts.platinum.total +
    ' · Gold ' + counts.gold.earned + '/' + counts.gold.total +
    ' · Silver ' + counts.silver.earned + '/' + counts.silver.total +
    ' · Bronze ' + counts.bronze.earned + '/' + counts.bronze.total;
}

/** Render the detail pane for the selected trophy, with its guide and sources. */
export function renderDetail(data, earned, settings, selectedId, onToggleEarned) {
  const pane = document.getElementById('detail-col');
  const t = trophyById(data, selectedId);
  if (!t) {
    pane.innerHTML = '<div class="detail-card"><h2>Pick a trophy</h2><p>Select any trophy in the checklist to read its guide, see its sources and mark it earned.</p></div>';
    return;
  }
  const isEarned = earned.has(t.id);
  const masked = isSpoilerMasked(t, earned, settings.spoiler);
  const sourceLinks = t.sources.map((key) => {
    const src = data.sources.find((s) => s.key === key);
    if (!src) return '';
    return '<li><a href="' + esc(src.url) + '" target="_blank" rel="noopener">' + esc(src.label) + '</a></li>';
  }).join('');
  const countLine = t.count
    ? '<p><span class="count-pill">PlayStation tracks: ' + Number(t.count).toLocaleString('en-US') + '</span></p>'
    : '';
  const missLine = t.missable && t.missableNote
    ? '<p class="miss-note"><strong>⚠ Missable:</strong> ' + esc(t.missableNote) + '</p>'
    : '';
  // When the spoiler setting masks this trophy, hide the guide too — the guide
  // names story missions, so showing it would spoil the story the setting hides.
  const guideHtml = masked
    ? '<p><span class="hidden-note">Hidden until earned — turn the spoiler setting off to reveal it.</span></p>'
    : '<p>' + esc(t.guide) + '</p>';
  pane.innerHTML = '<div class="detail-card">' +
    '<h2>' + (masked ? 'Hidden story trophy' : esc(t.name)) + '</h2>' +
    '<p class="detail-desc">' + (masked ? 'Its name and description stay hidden until you earn it — the spoiler setting is on.' : '“' + esc(t.description) + '”') + '</p>' +
    '<div class="detail-meta">' + gradeTag(t) + kindTag(t) +
    '<span class="kind-tag">Roadmap stage ' + t.stage + '</span></div>' +
    countLine + missLine +
    '<div class="detail-guide"><h3>Guide</h3>' + guideHtml + '</div>' +
    '<div class="detail-sources"><h3>Sources</h3><ul>' + sourceLinks +
    '<li>Guide: this entry’s own advice, written from the official description — not yet checked in the game.</li></ul>' +
    '<p>Names, descriptions and grades are PlayStation’s official list; the guide never copies another guide’s text.</p></div>' +
    '<button type="button" class="earn-btn' + (isEarned ? ' earned' : '') + '">' + (isEarned ? '✓ Earned — tap to unmark' : 'Mark as earned') + '</button>' +
    '</div>';
  pane.querySelector('.earn-btn').addEventListener('click', () => onToggleEarned(t.id));
}

/** Render the roadmap page. */
export function renderRoadmap(data, earned, onSelect) {
  const col = document.getElementById('roadmap-col');
  const stages = ROADMAP_STAGES.map((s) => {
    const list = stageTrophies(data, s.stage);
    const done = list.filter((t) => earned.has(t.id)).length;
    const buttons = list.map((t) =>
      '<button type="button" data-id="' + t.id + '" class="' + (earned.has(t.id) ? 'done' : '') + '">' +
      (earned.has(t.id) ? '✓ ' : '') + esc(t.name) + ' · ' + GRADE_LABELS[t.grade] + '</button>').join('');
    return '<div class="stage"><div class="stage-head"><span class="stage-num">Stage ' + s.stage + '</span><h3>' + esc(s.title) + '</h3><span class="chip-n">' + done + ' / ' + list.length + ' earned</span></div>' +
      '<p>' + esc(s.text) + '</p><div class="stage-trophies">' + buttons + '</div></div>';
  }).join('');
  col.innerHTML = '<h2>Roadmap to the platinum</h2>' +
    '<p class="lede">Vice Got a Price! — the platinum — unlocks when the other 54 trophies are earned. The order below is built from the official descriptions: story first, then strangers and activities, then collectibles and counts, then money and 100% completion.</p>' +
    '<div class="callout"><strong>Order matters for four trophies only.</strong> Hot Together and Retail Therapy need a partner beside you; Catch Me If You Can is tied to VCIA; Actions Speak Louder may turn on a story choice. Everything else can be finished in free roam after the story.</div>' +
    stages;
  col.querySelectorAll('.stage-trophies button').forEach((b) => {
    b.addEventListener('click', () => onSelect(Number(b.dataset.id)));
  });
}

/** Render the missables page. */
export function renderMissables(data, earned, onSelect) {
  const col = document.getElementById('missables-col');
  const miss = missableTrophies(data);
  const cards = miss.map((t) => {
    const isEarned = earned.has(t.id);
    return '<div class="miss-card"><h3>' + (isEarned ? '✓ ' : '⚠ ') + esc(t.name) + ' ' + gradeTag(t) + '</h3>' +
      '<p class="detail-desc">“' + esc(t.description) + '”</p>' +
      '<p>' + esc(t.missableNote || '') + '</p>' +
      '<p>' + esc(t.guide) + '</p>' +
      '<button type="button" class="btn" data-id="' + t.id + '">Open its guide</button></div>';
  }).join('');
  col.innerHTML = '<h2>Missable trophies — ' + miss.length + ' flagged</h2>' +
    '<p class="lede">These are the trophies the official descriptions suggest could be missed, and why. The flags are built from the descriptions’ wording, not from a played-through verification — the game was a day old when this guide was written, and this page says so plainly.</p>' +
    cards +
    '<div class="callout"><strong>The other 51 cannot be missed.</strong> Chapter and mission trophies pop when you finish the mission; collectibles, counts, races, robberies and money goals all stay available in free roam after the story ends. If you only remember one thing: do the two partner trophies while a partner is still around, and keep a manual save before big story choices.</div>';
  col.querySelectorAll('.miss-card .btn').forEach((b) => {
    b.addEventListener('click', () => onSelect(Number(b.dataset.id)));
  });
}

/** Render the settings and sources page. */
export function renderSettings(data, settings, handlers) {
  const col = document.getElementById('settings-col');
  const earned = handlers.earnedCount();
  col.innerHTML = '<h2>Settings &amp; sources</h2>' +
    '<p class="lede">Your progress lives in this browser (localStorage) and never leaves it. Export a backup file, import it back on another device, or reset and start over.</p>' +
    '<div class="settings-grid">' +
    '<div class="settings-card"><h3>Spoiler-free mode</h3>' +
    '<p>When on, story trophies you have not earned yet show as “Hidden story trophy” — no name, no description — until you earn them. ' + (settings.spoiler ? 'Currently <strong>on</strong>.' : 'Currently <strong>off</strong>.') + '</p>' +
    '<div class="btn-row"><button type="button" class="btn primary" id="settings-spoiler">' + (settings.spoiler ? 'Turn spoilers off' : 'Turn spoilers on') + '</button></div></div>' +
    '<div class="settings-card"><h3>Progress — export &amp; import</h3>' +
    '<p>You have earned <strong>' + earned + ' / ' + data.trophies.length + '</strong> trophies. Export downloads a JSON backup; import reads a backup file back.</p>' +
    '<div class="btn-row"><button type="button" class="btn primary" id="settings-export">Export progress</button>' +
    '<label class="btn" for="settings-import">Import progress</label><input id="settings-import" type="file" accept="application/json,.json" class="visually-hidden">' +
    '<button type="button" class="btn danger" id="settings-reset">Reset all progress</button></div>' +
    '<p id="settings-msg" role="status"></p></div>' +
    '<div class="settings-card"><h3>Sources</h3>' +
    '<p>Every trophy’s name, description and grade comes from the official PlayStation 5 list, as published by the two sources below — they agree on every name, description and grade. Counts (such as the 42 Shooting Range challenges) are the counts PlayStation tracks, as PSNProfiles lists them.</p>' +
    '<ul><li><a href="https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/" target="_blank" rel="noopener">Official trophy list — Exophase</a></li>' +
    '<li><a href="https://psnprofiles.com/trophies/43531-grand-theft-auto-vi" target="_blank" rel="noopener">PSNProfiles — GTA VI trophy list (grades and PSN counts)</a></li></ul>' +
    '<p>Every guide is this entry’s own words, written from the official descriptions. Where a description does not pin down a place or a step, the guide says so instead of inventing one.</p></div>' +
    '<div class="settings-card"><h3>About this guide</h3><dl class="kv">' +
    '<dt>Game</dt><dd>Grand Theft Auto VI — PlayStation 5</dd>' +
    '<dt>Trophies</dt><dd>55 — 1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden on PlayStation until earned</dd>' +
    '<dt>Online trophies</dt><dd>None in the official list</dd>' +
    '<dt>Offline</dt><dd>Yes — every file this page loads is one of its own files; it makes no network requests</dd>' +
    '<dt>License</dt><dd>MIT — free and open source</dd></dl></div>' +
    '</div>';
  document.getElementById('settings-spoiler').addEventListener('click', handlers.onToggleSpoiler);
  document.getElementById('settings-export').addEventListener('click', handlers.onExport);
  document.getElementById('settings-import').addEventListener('change', (e) => handlers.onImport(e.target.files[0]));
  document.getElementById('settings-reset').addEventListener('click', handlers.onReset);
}

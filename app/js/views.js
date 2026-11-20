// Leonida Ledger — views.
// Every screen is rendered from the same trophy list and the same progress
// state, so the checklist, the roadmap, the missables page and the settings
// page can never disagree about what is earned. All markup is built here;
// main.js only wires events.

import { GRADE_LABEL, KIND_LABEL, ROADMAP_STAGES } from './data.js';
import { isMasked, stageProgress } from './filters.js';

function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function gradeChip(grade) {
  return '<span class="chip grade-' + grade + '">' + esc(GRADE_LABEL[grade]) + '</span>';
}

function kindTag(t) {
  const label = t.missable ? 'Missable' : KIND_LABEL[t.kind] || t.kind;
  const cls = t.missable ? 'tag missable' : 'tag';
  return '<span class="' + cls + '">' + esc(label) + '</span>';
}

function countBadge(t) {
  if (t.count == null) return '';
  return '<span class="count">×' + t.count + '</span>';
}

/** One checklist row. Masked story trophies hide name + description. */
export function trophyRow(t, earned, masked, selected) {
  const name = masked ? 'Hidden story trophy' : t.name;
  const desc = masked
    ? 'Earn this trophy to reveal its name and guide.'
    : t.description;
  const cls = ['row', earned ? 'earned' : '', masked ? 'masked' : '', selected ? 'selected' : '']
    .filter(Boolean)
    .join(' ');
  return (
    '<article class="' + cls + '" data-id="' + esc(t.id) + '" tabindex="0">' +
    '<label class="check"><input type="checkbox" data-check="' + esc(t.id) + '"' + (earned ? ' checked' : '') + ' aria-label="Mark ' + esc(name) + ' earned"><span></span></label>' +
    '<div class="row-body"><div class="row-top">' + gradeChip(t.grade) + kindTag(t) + countBadge(t) + '</div>' +
    '<h3>' + esc(name) + '</h3><p>' + esc(desc) + '</p></div></article>'
  );
}

/** The checklist screen: rows plus a count line. */
export function renderChecklist(el, rows, ctx) {
  if (!rows.length) {
    el.innerHTML = '<p class="empty">No trophies match these filters. Clear the search or widen the filters.</p>';
    return;
  }
  const earned = rows.filter((r) => r.earned).length;
  el.innerHTML =
    '<p class="count-line">Showing ' + rows.length + ' of 55 trophies · ' + earned + ' earned in this view</p>' +
    rows.map((r) => trophyRow(r.trophy, r.earned, r.masked, ctx.selectedId === r.trophy.id)).join('');
}

/** The detail panel beside the checklist: one trophy's guide and sources. */
export function renderDetail(el, trophy, earned, masked, sourceByKey) {
  if (!trophy) {
    el.innerHTML =
      '<div class="detail-empty"><h2>Pick a trophy</h2>' +
      '<p>Select any row to read its guide, its sources and when it can be missed.</p></div>';
    return;
  }
  if (masked) {
    el.innerHTML =
      '<div class="detail-masked">' + gradeChip(trophy.grade) +
      '<h2>Hidden story trophy</h2>' +
      '<p>This story trophy is hidden until you earn it. Turn the spoiler setting off in Settings to reveal every name, or tick it off once you have earned it in the game.</p>' +
      '<label class="earn-line"><input type="checkbox" data-check="' + esc(trophy.id) + '"' + (earned ? ' checked' : '') + '> I earned this one</label></div>';
    return;
  }
  const srcs = (trophy.sources || [])
    .map((k) => sourceByKey[k])
    .filter(Boolean)
    .map((s) => '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + '</a></li>')
    .join('');
  el.innerHTML =
    '<div class="detail"><div class="detail-top">' + gradeChip(trophy.grade) + kindTag(trophy) + countBadge(trophy) + '</div>' +
    '<h2>' + esc(trophy.name) + '</h2>' +
    '<p class="official">' + esc(trophy.description) + '</p>' +
    (trophy.missable ? '<p class="warn">⚠ Missable — a one-time chance. See the guide before you play past it.</p>' : '') +
    '<h3>Guide</h3><p>' + esc(trophy.guide) + '</p>' +
    '<h3>Sources</h3><ul class="sources">' + (srcs || '<li>Exophase and PSNProfiles list the official name and grade.</li>') + '</ul>' +
    '<label class="earn-line"><input type="checkbox" data-check="' + esc(trophy.id) + '"' + (earned ? ' checked' : '') + '> Earned</label></div>';
}

/** The roadmap: four stages, each with its own progress bar and chips. */
export function renderRoadmap(el, trophies, earnedSet) {
  el.innerHTML = ROADMAP_STAGES.map((stage) => {
    const inStage = trophies.filter((t) => t.stage === stage.n);
    const prog = stageProgress(trophies, stage.n, earnedSet);
    const pct = prog.total ? Math.round((100 * prog.done) / prog.total) : 0;
    const chips = inStage
      .map((t) => {
        const done = earnedSet.has(t.id);
        return '<li class="' + (done ? 'done' : '') + '" data-id="' + esc(t.id) + '">' +
          '<span class="dot grade-' + t.grade + '"></span>' + esc(t.name) +
          (t.missable ? ' <span class="flag">missable</span>' : '') + '</li>';
      })
      .join('');
    return (
      '<section class="stage"><header><h2>' + esc(stage.title) + '</h2>' +
      '<span class="stage-count">' + prog.done + ' / ' + prog.total + '</span></header>' +
      '<div class="bar"><span style="width:' + pct + '%"></span></div>' +
      '<p class="stage-blurb">' + esc(stage.blurb) + '</p><ul class="stage-list">' + chips + '</ul></section>'
    );
  }).join('');
}

/** The missables page: the four one-time trophies, flagged up front. */
export function renderMissables(el, trophies, earnedSet) {
  const list = trophies.filter((t) => t.missable);
  el.innerHTML =
    '<p class="intro">Four trophies can be missed in a single playthrough. Do these while the story is fresh — each one is a one-time chance, and missing one means a second playthrough for the platinum.</p>' +
    list.map((t) => {
      const done = earnedSet.has(t.id);
      return '<article class="miss-card' + (done ? ' earned' : '') + '">' +
        '<div class="miss-top">' + gradeChip(t.grade) + '<span class="flag big">MISSABLE</span></div>' +
        '<h3>' + esc(t.name) + '</h3><p class="official">' + esc(t.description) + '</p>' +
        '<p>' + esc(t.guide) + '</p>' +
        '<label class="earn-line"><input type="checkbox" data-check="' + esc(t.id) + '"' + (done ? ' checked' : '') + '> Earned</label></article>';
    }).join('');
}

/** Settings & sources: spoiler toggle, export/import/reset, source list. */
export function renderSettings(el, state, sources, earnedTotal) {
  el.innerHTML =
    '<section class="panel"><h2>Spoiler setting</h2>' +
    '<label class="switch-line"><input type="checkbox" id="spoiler-toggle"' + (state.spoiler ? ' checked' : '') + '> Hide story trophy names and guides until earned</label>' +
    '<p class="hint">With spoilers on, un-earned story trophies show as “Hidden story trophy”. Earned ones always show.</p></section>' +
    '<section class="panel"><h2>Your progress</h2>' +
    '<p>' + earnedTotal + ' of 55 trophies earned. Progress is saved in this browser (localStorage).</p>' +
    '<div class="btn-row"><button id="export-btn" type="button">Export progress (.json)</button>' +
    '<label class="btn" for="import-file">Import progress</label><input type="file" id="import-file" accept="application/json" hidden>' +
    '<button id="reset-btn" type="button" class="danger">Reset progress</button></div>' +
    '<p class="hint" id="import-note"></p></section>' +
    '<section class="panel"><h2>Sources</h2>' +
    '<p>Official names, descriptions and grades come from PlayStation, as listed by:</p><ul class="sources">' +
    sources.map((s) => '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + '</a></li>').join('') +
    '</ul><p class="hint">Every guide above is written for this entry in its own words; sources are cited beside each trophy, never copied.</p></section>';
}

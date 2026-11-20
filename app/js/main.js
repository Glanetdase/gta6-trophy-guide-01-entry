// Leonida Ledger — bootstrap.
// Loads the trophy file, restores saved progress, renders the active view
// and wires every control. The app is fully offline: the only fetch is the
// trophy JSON from its own folder, and no request leaves the browser.

import { loadTrophyFile, trophyById } from './data.js';
import {
  loadState,
  saveState,
  toggleEarned,
  earnedCount,
  resetProgress,
  exportText,
  parseImport,
} from './store.js';
import { applyFilters, isMasked } from './filters.js';
import {
  renderChecklist,
  renderDetail,
  renderRoadmap,
  renderMissables,
  renderSettings,
} from './views.js';

const $ = (sel, root = document) => root.querySelector(sel);

const state = {
  trophies: [],
  sources: [],
  meta: {},
  store: loadState(),
  view: 'checklist',
  selectedId: null,
  filters: { q: '', kind: 'all', grade: 'all', status: 'all' },
};

function earnedSet() {
  return new Set(state.store.earned);
}

function visibleRows() {
  const set = earnedSet();
  const list = applyFilters(state.trophies, { ...state.filters, earnedSet: set });
  return list.map((t) => ({
    trophy: t,
    earned: set.has(t.id),
    masked: isMasked(t, state.store.spoiler, set),
  }));
}

function sourceByKey() {
  const out = {};
  for (const s of state.sources) out[s.key] = s;
  return out;
}

function renderAll() {
  const set = earnedSet();
  const done = earnedCount(state.store, state.trophies);
  const pct = state.trophies.length ? Math.round((100 * done) / state.trophies.length) : 0;
  $('#progress-fill').style.width = pct + '%';
  $('#progress-text').textContent = done + ' / ' + state.trophies.length + ' trophies · ' + pct + '%';
  document.querySelectorAll('[data-tab]').forEach((b) =>
    b.classList.toggle('active', b.dataset.tab === state.view),
  );
  const view = $('#view');
  const detail = $('#detail');
  const toolbar = $('#toolbar');
  toolbar.style.display = state.view === 'checklist' ? '' : 'none';
  detail.style.display = state.view === 'checklist' ? '' : 'none';
  if (state.view === 'checklist') {
    renderChecklist(view, visibleRows(), state);
    const sel = state.selectedId ? trophyById(state.trophies, state.selectedId) : null;
    renderDetail(
      detail,
      sel,
      sel ? set.has(sel.id) : false,
      sel ? isMasked(sel, state.store.spoiler, set) : false,
      sourceByKey(),
    );
  } else if (state.view === 'roadmap') {
    renderRoadmap(view, state.trophies, set);
  } else if (state.view === 'missables') {
    renderMissables(view, state.trophies, set);
  } else {
    renderSettings(view, state.store, state.sources, done);
  }
  if (!window.__shotReady) window.__shotReady = true;
}

function wireEvents() {
  document.querySelectorAll('[data-tab]').forEach((b) =>
    b.addEventListener('click', () => {
      state.view = b.dataset.tab;
      renderAll();
    }),
  );
  $('#search').addEventListener('input', (e) => {
    state.filters.q = e.target.value;
    renderAll();
  });
  $('#kind-filter').addEventListener('change', (e) => {
    state.filters.kind = e.target.value;
    renderAll();
  });
  $('#grade-filter').addEventListener('change', (e) => {
    state.filters.grade = e.target.value;
    renderAll();
  });
  $('#status-filter').addEventListener('change', (e) => {
    state.filters.status = e.target.value;
    renderAll();
  });
  // Event delegation: checkbox toggles and row selection, everywhere.
  document.addEventListener('change', (e) => {
    const check = e.target.closest('[data-check]');
    if (check) {
      toggleEarned(state.store, check.dataset.check);
      renderAll();
      return;
    }
    if (e.target.id === 'spoiler-toggle') {
      state.store.spoiler = e.target.checked;
      saveState(state.store);
      renderAll();
    }
  });
  document.addEventListener('click', (e) => {
    const row = e.target.closest('[data-id]');
    if (row && !e.target.closest('[data-check]') && !e.target.closest('label')) {
      state.selectedId = row.dataset.id;
      if (state.view !== 'checklist') state.view = 'checklist';
      renderAll();
      return;
    }
    if (e.target.id === 'export-btn') {
      const blob = new Blob([exportText(state.store)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'leonida-ledger-progress.json';
      a.click();
      URL.revokeObjectURL(a.href);
    }
    if (e.target.id === 'reset-btn') {
      if (window.confirm('Reset all progress? This clears every earned tick.')) {
        resetProgress(state.store);
        state.selectedId = null;
        renderAll();
      }
    }
  });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'import-file' && e.target.files.length) {
      const file = e.target.files[0];
      file.text().then((text) => {
        try {
          const ids = parseImport(text);
          const known = new Set(state.trophies.map((t) => t.id));
          state.store.earned = ids.filter((id) => known.has(id));
          saveState(state.store);
          $('#import-note').textContent = 'Imported ' + state.store.earned.length + ' earned trophies.';
        } catch {
          $('#import-note').textContent = 'That file could not be read as progress.';
        }
        renderAll();
      });
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('[data-id]')) {
      state.selectedId = e.target.dataset.id;
      renderAll();
    }
  });
}

/** Screenshot staging: ?shot=checklist|roadmap|missables|spoiler. */
function applyShotParam() {
  const shot = new URLSearchParams(location.search).get('shot');
  if (!shot) return;
  if (shot === 'roadmap' || shot === 'missables') state.view = shot;
  if (shot === 'spoiler') {
    state.view = 'checklist';
    state.store.spoiler = true;
    saveState(state.store);
    // Open the masked platinum in the detail panel so the shot shows the
    // spoiler mask on both the list and the guide panel.
    state.selectedId = 'vice-got-a-price';
  }
  if (shot === 'checklist') {
    state.view = 'checklist';
    state.selectedId = 'cunning-stunts';
  }
}

async function boot() {
  try {
    const doc = await loadTrophyFile();
    state.trophies = doc.trophies;
    state.sources = doc.sources;
    state.meta = doc.meta;
  } catch (err) {
    $('#view').innerHTML = '<p class="empty">The trophy list could not be loaded. ' + err.message + '</p>';
    return;
  }
  applyShotParam();
  wireEvents();
  renderAll();
}

boot();

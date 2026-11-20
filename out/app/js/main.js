// main.js — boots the Leonida Ledger: loads the trophy data, wires the tabs,
// the filters, the spoiler setting, the checklist, the detail pane, the roadmap,
// the missables page and the settings page. All state lives in localStorage.
import { loadTrophies } from './data.js';
import { exportProgress, importProgress, loadProgress, loadSettings, resetAll, saveProgress, saveSettings } from './store.js';
import { FILTER_STATE } from './filters.js';
import { renderChecklist, renderChipCounts, renderDetail, renderMissables, renderProgress, renderRoadmap, renderSettings } from './views.js';

const state = {
  data: null,
  earned: loadProgress(),
  settings: loadSettings(),
  selectedId: null,
  view: 'checklist',
};

/** Re-render the current view and the header progress. */
function renderAll() {
  const { data, earned, settings } = state;
  renderProgress(data, earned);
  renderChipCounts(data);
  if (state.view === 'checklist') {
    renderChecklist(data, earned, settings, state.selectedId, selectTrophy);
    renderDetail(data, earned, settings, state.selectedId, toggleEarned);
  } else if (state.view === 'roadmap') {
    renderRoadmap(data, earned, selectTrophy);
  } else if (state.view === 'missables') {
    renderMissables(data, earned, selectTrophy);
  } else if (state.view === 'settings') {
    renderSettings(data, settings, {
      earnedCount: () => state.earned.size,
      onToggleSpoiler: () => {
        state.settings.spoiler = !state.settings.spoiler;
        saveSettings(state.settings);
        syncSpoilerBox();
        renderAll();
      },
      onExport: () => exportProgress(state.earned),
      onImport: async (file) => {
        const msg = document.getElementById('settings-msg');
        if (!file) return;
        try {
          const imported = await importProgress(file);
          const valid = new Set([...imported].filter((id) => state.data.trophies.some((t) => t.id === id)));
          state.earned = valid;
          saveProgress(state.earned);
          renderAll();
          const after = document.getElementById('settings-msg');
          if (after) after.textContent = 'Imported ' + valid.size + ' earned trophies.';
        } catch (err) {
          if (msg) msg.textContent = err.message;
        }
      },
      onReset: () => {
        if (!window.confirm('Reset all progress and settings? This cannot be undone.')) return;
        resetAll();
        state.earned = new Set();
        state.settings = { spoiler: false };
        state.selectedId = null;
        syncSpoilerBox();
        renderAll();
      },
    });
  }
}

/** Switch tabs and re-render. */
function switchView(view) {
  state.view = view;
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.view === view);
  });
  document.querySelectorAll('.view').forEach((section) => {
    section.classList.toggle('active', section.id === 'view-' + view);
  });
  renderAll();
}

/** Select a trophy (from the checklist, roadmap or missables) and open its guide. */
function selectTrophy(id) {
  state.selectedId = id;
  if (state.view !== 'checklist') switchView('checklist');
  else renderAll();
  const pane = document.getElementById('detail-col');
  if (pane && window.innerWidth <= 900) pane.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Toggle a trophy's earned state and save it. */
function toggleEarned(id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  saveProgress(state.earned);
  renderAll();
}

/** Keep the toolbar spoiler checkbox in sync with settings. */
function syncSpoilerBox() {
  const box = document.getElementById('spoiler');
  if (box) box.checked = state.settings.spoiler;
}

/** Wire the toolbar: search, kind/grade/state chips, spoiler checkbox. */
function wireToolbar() {
  const search = document.getElementById('search');
  search.addEventListener('input', () => {
    FILTER_STATE.search = search.value.trim();
    renderAll();
  });
  const wireChips = (selector, key) => {
    document.querySelectorAll(selector).forEach((chip) => {
      chip.addEventListener('click', () => {
        FILTER_STATE[key] = chip.dataset[key];
        document.querySelectorAll(selector).forEach((c) => c.classList.toggle('active', c === chip));
        renderAll();
      });
    });
  };
  wireChips('#kind-chips .chip', 'kind');
  wireChips('#grade-chips .chip', 'grade');
  wireChips('#state-chips .chip', 'state');
  document.getElementById('spoiler').addEventListener('change', (e) => {
    state.settings.spoiler = e.target.checked;
    saveSettings(state.settings);
    renderAll();
  });
}

async function boot() {
  try {
    state.data = await loadTrophies();
  } catch (err) {
    document.getElementById('trophy-list').innerHTML =
      '<li class="empty-list">Could not load the trophy list: ' + err.message + '</li>';
    return;
  }
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  });
  wireToolbar();
  syncSpoilerBox();
  renderAll();
}

boot();

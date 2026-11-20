// store.js — saved progress and settings in localStorage, plus export and import.
// Progress is a set of earned trophy ids; settings hold the spoiler switch.
// Export downloads a JSON file; import reads one back. Nothing leaves the browser.
const PROGRESS_KEY = 'leonida-ledger-progress-v1';
const SETTINGS_KEY = 'leonida-ledger-settings-v1';

/** Load the earned set from localStorage (an empty set when nothing is saved). */
export function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((n) => Number.isInteger(n)));
  } catch {
    return new Set();
  }
}

/** Save the earned set to localStorage. */
export function saveProgress(earned) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

/** Load settings ({ spoiler: boolean }). */
export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { spoiler: false };
    const parsed = JSON.parse(raw);
    return { spoiler: parsed.spoiler === true };
  } catch {
    return { spoiler: false };
  }
}

/** Save settings. */
export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/** Download the current progress as a JSON file. */
export function exportProgress(earned) {
  const payload = {
    app: 'leonida-ledger',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophies-progress.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Read a progress file the user picked; resolves to a Set of earned ids. */
export function importProgress(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const list = Array.isArray(parsed) ? parsed : parsed.earned;
        if (!Array.isArray(list)) throw new Error('That file holds no trophy list.');
        resolve(new Set(list.filter((n) => Number.isInteger(n))));
      } catch (err) {
        reject(new Error('That file is not a Leonida Ledger progress file.'));
      }
    };
    reader.readAsText(file);
  });
}

/** Clear all saved progress and settings. */
export function resetAll() {
  localStorage.removeItem(PROGRESS_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}

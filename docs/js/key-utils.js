// ── KEY DISPLAY UTILITIES ────────────────────────────────────────────
// Shared key notation system for all pages
// Usage: Import this file and call formatKey(key) to respect user preference

var _KEY_MAP = {
  'C / Am': 'C / Am',
  '1#': 'C# / A#m', '2#': 'D# / C#m', '3#': 'F / Dm',
  '4#': 'F# / D#m', '5#': 'G# / Fm', '6#': 'A# / Gm', '7#': 'B / G#m',
  '1b': 'F / Dm', '2b': 'Eb / Cm', '3b': 'Db / Bbm',
  '4b': 'Cb / Abm', '5b': 'Bb / Gm', '6b': 'Ab / Fm', '7b': 'Bb / Gm'
};

function getKeyDisplayMode() {
  return localStorage.getItem('keyDisplayMode') || 'number';
}

function setKeyDisplayMode(mode) {
  localStorage.setItem('keyDisplayMode', mode);
}

function formatKey(key, mode) {
  if (!key) return '';
  var displayMode = mode || getKeyDisplayMode();
  if (displayMode === 'letter' && _KEY_MAP[key]) {
    return _KEY_MAP[key];
  }
  return key;
}

function toggleKeyDisplayMode() {
  var current = getKeyDisplayMode();
  var newMode = current === 'number' ? 'letter' : 'number';
  setKeyDisplayMode(newMode);
  return newMode;
}

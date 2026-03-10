
# ═══════════════════════════════════════════════════════════
# Upgrade songs.html — 6 improvements for faster setlist building
# Uses UTF-8 BOM encoding to protect Thai text
# ═══════════════════════════════════════════════════════════

$file = "d:\AI CURSER\Band Management By SoulCiety\docs\songs.html"
$utf8BOM = New-Object System.Text.UTF8Encoding($true)
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$original = $content

# ─── 1. Add new CSS styles before </style> ───
$newCSS = @'

/* ── Artist name in song card ── */
.song-artist{
  font-size:11px;
  color:#6b7280;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  margin-bottom:1px;
}

/* ── Search highlight ── */
.search-hl{background:#fef08a;color:#92400e;border-radius:2px;padding:0 1px}

/* ── Floating Playlist Counter ── */
#playlistFloating{
  position:fixed;
  bottom:16px;
  right:16px;
  background:linear-gradient(135deg,#1a1a2e,#16213e);
  color:#fff;
  border-radius:16px;
  padding:10px 18px;
  display:none;
  align-items:center;
  gap:10px;
  z-index:1500;
  box-shadow:0 8px 32px rgba(0,0,0,.45);
  border:1.5px solid rgba(246,173,85,.35);
  font-size:13px;
  font-weight:600;
  font-family:var(--font-family-body);
  cursor:pointer;
  transition:transform .15s;
  -webkit-tap-highlight-color:transparent;
}
#playlistFloating:hover{transform:translateY(-2px)}
#playlistFloating .pf-count{
  background:var(--premium-gold);
  color:#fff;
  border-radius:50%;
  width:28px;height:28px;
  display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:700;
  flex-shrink:0;
}
#playlistFloating .pf-label{white-space:nowrap}

/* ── Playlist add checkbox mode (for adding to playlist) ── */
.pl-add-mode .result-item{cursor:pointer}
.pl-add-mode .result-item.pl-selected{background:#fffbeb;border-color:var(--premium-gold)}
.pl-add-mode .pl-cb{display:flex !important}
.pl-cb{display:none;align-items:center;justify-content:center;flex-shrink:0;width:36px;height:36px}
.pl-cb input[type=checkbox]{width:20px;height:20px;cursor:pointer;accent-color:var(--premium-gold);margin:0}

/* Floating add-to-playlist bar */
#plAddBar{
  position:fixed;bottom:0;left:0;right:0;
  background:#1e293b;color:#fff;
  padding:12px 20px;
  display:none;
  align-items:center;justify-content:space-between;gap:12px;
  z-index:3100;
  box-shadow:0 -4px 20px rgba(0,0,0,.4);
  flex-wrap:wrap;
}
#plAddBar .pab-count{font-size:14px;font-weight:600;flex:1}
#plAddBar .pab-btn{border-radius:24px;padding:0 18px;height:38px;font-size:14px;font-weight:600;cursor:pointer;border:none;min-height:unset}
#plAddBar .pab-add{background:#38a169;color:#fff}
#plAddBar .pab-add:disabled{opacity:.6;cursor:not-allowed}
#plAddBar .pab-cancel{background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.3)}

/* ── Recently Used Songs ── */
.recent-songs-panel{margin-bottom:var(--spacing-lg)}
.recent-songs-wrap{display:flex;gap:8px;overflow-x:auto;padding:8px 0;-webkit-overflow-scrolling:touch;scrollbar-width:thin}
.recent-chip{
  flex-shrink:0;
  display:flex;align-items:center;gap:6px;
  background:var(--premium-white);
  border:1.5px solid var(--premium-border);
  border-radius:var(--radius-full);
  padding:6px 14px 6px 10px;
  font-size:12px;font-weight:600;
  color:var(--premium-text);
  cursor:pointer;
  transition:border-color .15s,background .15s;
  white-space:nowrap;
  font-family:var(--font-family-body);
}
.recent-chip:hover{border-color:var(--premium-gold);background:#fffdf8}
.recent-chip:active{transform:scale(.97)}
.recent-chip .rc-key{font-size:10px;color:#92400e;background:#fef3c7;border-radius:4px;padding:1px 5px}

@media(max-width:599px){
  #playlistFloating{bottom:12px;right:12px;padding:8px 14px;font-size:12px;border-radius:14px}
  #playlistFloating .pf-count{width:24px;height:24px;font-size:11px}
}
'@

$content = $content.Replace("  </style>", "$newCSS`n  </style>")

# ─── 2. Add Floating Playlist Counter HTML + Playlist Add Bar before </main> ───
# Find the closing </main> tag and add before it
$floatingHTML = @'

<!-- Floating Playlist Counter -->
<div id="playlistFloating" onclick="document.getElementById('playlist').scrollIntoView({behavior:'smooth',block:'start'})">
  <span class="pf-count" id="pfCount">0</span>
  <span class="pf-label" id="pfLabel">&#xe40;&#xe1e;&#xe25;&#xe07;&#xe43;&#xe19;&#xe25;&#xe34;&#xe2a;</span>
</div>

<!-- Playlist Add Bar (batch add to playlist) -->
<div id="plAddBar">
  <div class="pab-count" id="pabCount">&#xe40;&#xe25;&#xe37;&#xe2d;&#xe01;&#xe41;&#xe25;&#xe49;&#xe27; 0 &#xe40;&#xe1e;&#xe25;&#xe07;</div>
  <div style="display:flex;gap:8px">
    <button class="pab-btn pab-add" id="pabAddBtn" onclick="batchAddToPlaylist()" disabled>&#x2795; &#xe40;&#xe1e;&#xe34;&#xe48;&#xe21;&#xe43;&#xe19;&#xe25;&#xe34;&#xe2a;</button>
    <button class="pab-btn pab-cancel" onclick="exitPlAddMode()">&#x2715; &#xe22;&#xe01;&#xe40;&#xe25;&#xe34;&#xe01;</button>
  </div>
</div>
'@

$content = $content.Replace("</main>", "$floatingHTML`n</main>")

# ─── 3. Add "Recently Used" panel + "batch add" button in the filter panel ───
# After the result panel div, add recently used songs section
$recentHTML = @'
<!-- Recently Used Songs -->
<div class="panel recent-songs-panel" id="recentSongsPanel" style="display:none">
  <h3 style="font-size:14px;margin-bottom:8px">&#x23F3; &#xe40;&#xe1e;&#xe25;&#xe07;&#xe17;&#xe35;&#xe48;&#xe43;&#xe0a;&#xe49;&#xe1a;&#xe48;&#xe2d;&#xe22;</h3>
  <div class="recent-songs-wrap" id="recentSongsWrap"></div>
</div>

'@

# Insert recent songs panel before the result panel
$content = $content.Replace('<div class="panel">' + "`n" + '  <h3 id="resultTitle">', $recentHTML + '<div class="panel">' + "`n" + '  <h3 id="resultTitle">')

# ─── 4. Add batch-add button next to filters / search ───
# Add a "multi-select for playlist" button in the action buttons row at header
$batchBtnOld = '<button id="selectModeBtn" onclick="toggleSelectMode()"'
$batchBtnNew = '<button id="plAddModeBtn" onclick="togglePlAddMode()" style="display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#38a169,#2f855a);color:#fff;border:none;border-radius:24px;padding:0 18px;height:38px;font-size:14px;font-weight:700;white-space:nowrap;cursor:pointer;box-shadow:0 2px 8px rgba(56,161,105,.3)">&#x2611;&#xFE0F; &#xe40;&#xe25;&#xe37;&#xe2d;&#xe01;&#xe2b;&#xe25;&#xe32;&#xe22;&#xe40;&#xe1e;&#xe25;&#xe07;</button>' + "`n      " + '<button id="selectModeBtn" onclick="toggleSelectMode()"'
$content = $content.Replace($batchBtnOld, $batchBtnNew)

# ─── 5. Inject the main upgrade script before </body> ───
$upgradeScript = @'
<script>
/* ═══════════════════════════════════════════════════
   UPGRADE: 6 improvements for faster setlist building
   ═══════════════════════════════════════════════════ */

// ── A. Floating Playlist Counter ──
function updatePlaylistFloating() {
  var el = document.getElementById('playlistFloating');
  var countEl = document.getElementById('pfCount');
  var labelEl = document.getElementById('pfLabel');
  if (!el || !countEl) return;
  var songCount = playlistData.filter(function(s){ return !s.break; }).length;
  if (songCount > 0) {
    countEl.textContent = songCount;
    labelEl.textContent = songCount + ' \u0e40\u0e1e\u0e25\u0e07\u0e43\u0e19\u0e25\u0e34\u0e2a';
    el.style.display = 'flex';
  } else {
    el.style.display = 'none';
  }
  // hide floating when plAddBar or selectBar is visible
  var plAddBar = document.getElementById('plAddBar');
  var selectBar = document.getElementById('selectBar');
  if ((plAddBar && plAddBar.style.display === 'flex') || (selectBar && selectBar.style.display === 'flex')) {
    el.style.display = 'none';
  }
}

// Patch renderPlaylist to update floating counter
var _origRenderPlaylist = renderPlaylist;
renderPlaylist = function() {
  _origRenderPlaylist();
  updatePlaylistFloating();
};

// ── B. Search Highlight ──
function highlightText(text, query) {
  if (!query || !text) return escapeHtml(text);
  var escaped = escapeHtml(text);
  // Escape regex special chars in query
  var safeQ = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  try {
    var re = new RegExp('(' + safeQ + ')', 'gi');
    return escaped.replace(re, '<span class="search-hl">$1</span>');
  } catch(e) {
    return escaped;
  }
}

// ── C. Artist name + search highlight in renderPage ──
var _origRenderPage = renderPage;
renderPage = function() {
  // Call original render first
  _origRenderPage();

  // Now enhance: add artist names and search highlights
  var searchEl = document.getElementById('searchText');
  var searchVal = searchEl ? searchEl.value.trim() : '';
  var resultEl = document.getElementById('result');
  if (!resultEl) return;

  var items = resultEl.querySelectorAll('.result-item');
  for (var i = 0; i < items.length; i++) {
    var idx = parseInt(items[i].getAttribute('data-index'), 10);
    if (isNaN(idx) || !_pageData[idx]) continue;
    var s = _pageData[idx];

    // Add artist name if available
    var leftDiv = items[i].querySelector('.result-item-left');
    if (leftDiv && s.artist && !leftDiv.querySelector('.song-artist')) {
      var artistDiv = document.createElement('div');
      artistDiv.className = 'song-artist';
      if (searchVal) {
        artistDiv.innerHTML = highlightText(s.artist, searchVal);
      } else {
        artistDiv.textContent = s.artist;
      }
      var metaDiv = leftDiv.querySelector('.song-meta');
      if (metaDiv) {
        leftDiv.insertBefore(artistDiv, metaDiv);
      } else {
        leftDiv.appendChild(artistDiv);
      }
    }

    // Highlight search in title
    if (searchVal) {
      var titleDiv = leftDiv ? leftDiv.querySelector('.song-title') : null;
      if (titleDiv) {
        // preserve new tag
        var newTagEl = titleDiv.querySelector('.new-tag');
        var inLibEl = titleDiv.querySelector('.in-lib-tag');
        titleDiv.innerHTML = highlightText(s.name, searchVal)
          + (newTagEl ? newTagEl.outerHTML : '')
          + (inLibEl ? inLibEl.outerHTML : '');
      }
      // highlight artist too (if already added)
      var artistEl = leftDiv ? leftDiv.querySelector('.song-artist') : null;
      if (artistEl && s.artist) {
        artistEl.innerHTML = highlightText(s.artist, searchVal);
      }
    }
  }

  // Show/hide plAddMode checkboxes
  if (_plAddMode) {
    items.forEach(function(item) {
      var cbWrap = item.querySelector('.pl-cb');
      if (!cbWrap) {
        var idx2 = parseInt(item.getAttribute('data-index'), 10);
        if (isNaN(idx2) || !_pageData[idx2]) return;
        cbWrap = document.createElement('div');
        cbWrap.className = 'pl-cb';
        cbWrap.style.display = 'flex';
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        var songId = _pageData[idx2].id || _pageData[idx2].songId || '';
        cb.checked = !!_plSelectedForAdd[songId];
        if (cb.checked) item.classList.add('pl-selected');
        cb.onclick = function(e) { e.stopPropagation(); };
        cb.onchange = function() {
          var si = this.closest('.result-item').getAttribute('data-index');
          var sd = _pageData[parseInt(si, 10)];
          if (!sd) return;
          var sid = sd.id || sd.songId || '';
          togglePlSelection(sid, this.closest('.result-item'));
        };
        cbWrap.appendChild(cb);
        item.insertBefore(cbWrap, item.firstChild);
        item.style.cursor = 'pointer';
        item.onclick = function(e) {
          if (e.target.tagName === 'INPUT' || e.target.classList.contains('add-song-btn') || e.target.classList.contains('suggest-song-btn')) return;
          var si2 = this.getAttribute('data-index');
          var sd2 = _pageData[parseInt(si2, 10)];
          if (!sd2) return;
          var sid2 = sd2.id || sd2.songId || '';
          togglePlSelection(sid2, this);
        };
      }
    });
  }

  // Update floating counter
  updatePlaylistFloating();
};

// ── D. Batch Add to Playlist (multi-select mode) ──
var _plAddMode = false;
var _plSelectedForAdd = {};

function togglePlAddMode() {
  if (_plAddMode) exitPlAddMode(); else enterPlAddMode();
}

function enterPlAddMode() {
  _plAddMode = true;
  _plSelectedForAdd = {};
  var btn = document.getElementById('plAddModeBtn');
  if (btn) { btn.style.background = '#2f855a'; btn.textContent = '\u2611\uFE0F \u0e42\u0e2b\u0e21\u0e14\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e2b\u0e25\u0e32\u0e22\u0e40\u0e1e\u0e25\u0e07'; }
  var resultEl = document.getElementById('result');
  if (resultEl) resultEl.classList.add('pl-add-mode');
  var bar = document.getElementById('plAddBar');
  if (bar) bar.style.display = 'flex';
  // Hide floating counter while in this mode
  var fc = document.getElementById('playlistFloating');
  if (fc) fc.style.display = 'none';
  renderPage();
  updatePlAddBar();
}

function exitPlAddMode() {
  _plAddMode = false;
  _plSelectedForAdd = {};
  var btn = document.getElementById('plAddModeBtn');
  if (btn) { btn.style.background = ''; btn.textContent = '\u2611\uFE0F \u0e40\u0e25\u0e37\u0e2d\u0e01\u0e2b\u0e25\u0e32\u0e22\u0e40\u0e1e\u0e25\u0e07'; }
  var resultEl = document.getElementById('result');
  if (resultEl) resultEl.classList.remove('pl-add-mode');
  var bar = document.getElementById('plAddBar');
  if (bar) bar.style.display = 'none';
  // remove checkboxes
  document.querySelectorAll('.pl-cb').forEach(function(cb){ cb.remove(); });
  document.querySelectorAll('.result-item.pl-selected').forEach(function(el){ el.classList.remove('pl-selected'); });
  renderPage();
}

function togglePlSelection(songId, el) {
  if (!songId) return;
  if (_plSelectedForAdd[songId]) {
    delete _plSelectedForAdd[songId];
    if (el) el.classList.remove('pl-selected');
    var cb = el && el.querySelector('.pl-cb input[type=checkbox]');
    if (cb) cb.checked = false;
  } else {
    // Store the full song data
    for (var i = 0; i < _pageData.length; i++) {
      var sid = _pageData[i].id || _pageData[i].songId || '';
      if (sid === songId) {
        _plSelectedForAdd[songId] = _pageData[i];
        break;
      }
    }
    if (el) el.classList.add('pl-selected');
    var cb2 = el && el.querySelector('.pl-cb input[type=checkbox]');
    if (cb2) cb2.checked = true;
  }
  updatePlAddBar();
}

function updatePlAddBar() {
  var count = Object.keys(_plSelectedForAdd).length;
  var countEl = document.getElementById('pabCount');
  var addBtn = document.getElementById('pabAddBtn');
  if (countEl) countEl.textContent = '\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e41\u0e25\u0e49\u0e27 ' + count + ' \u0e40\u0e1e\u0e25\u0e07';
  if (addBtn) addBtn.disabled = count === 0;
}

function batchAddToPlaylist() {
  var ids = Object.keys(_plSelectedForAdd);
  if (!ids.length) return;
  var addedNames = [];
  ids.forEach(function(id) {
    var song = _plSelectedForAdd[id];
    if (song) {
      playlistData.push({
        name: song.name || '',
        key: song.key || '',
        bpm: song.bpm || 0,
        artist: song.artist || '',
        singer: song.singer || '',
        transpose: 0,
        mode: 'major'
      });
      addedNames.push(song.name || '');
      // Save to recently used
      saveRecentSong(song);
    }
  });
  renderPlaylist();
  exitPlAddMode();
  showSongsAlert('\u2705 \u0e40\u0e1e\u0e34\u0e48\u0e21 ' + addedNames.length + ' \u0e40\u0e1e\u0e25\u0e07\u0e43\u0e19\u0e25\u0e34\u0e2a\u0e41\u0e25\u0e49\u0e27');
}

// ── E. Recently Used Songs ──
var RECENT_KEY = 'recentSongs_' + (localStorage.getItem('bandId') || 'default');
var MAX_RECENT = 20;

function getRecentSongs() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch(e) { return []; }
}

function saveRecentSong(song) {
  if (!song || !song.name) return;
  var recent = getRecentSongs();
  var songId = song.id || song.songId || song.name;
  // Remove if already exists
  recent = recent.filter(function(r) { return (r.id || r.songId || r.name) !== songId; });
  // Add to front
  recent.unshift({
    id: song.id || song.songId || '',
    name: song.name,
    key: song.key || '',
    bpm: song.bpm || 0,
    artist: song.artist || '',
    singer: song.singer || ''
  });
  // Cap at MAX_RECENT
  if (recent.length > MAX_RECENT) recent = recent.slice(0, MAX_RECENT);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(recent)); } catch(e) {}
}

function renderRecentSongs() {
  var panel = document.getElementById('recentSongsPanel');
  var wrap = document.getElementById('recentSongsWrap');
  if (!panel || !wrap) return;
  var recent = getRecentSongs();
  if (recent.length === 0) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';
  wrap.innerHTML = '';
  recent.forEach(function(s) {
    var chip = document.createElement('div');
    chip.className = 'recent-chip';
    chip.title = (s.artist ? s.artist + ' - ' : '') + s.name;
    chip.innerHTML = '\u2795 ' + escapeHtml(s.name) + (s.key ? ' <span class="rc-key">' + escapeHtml(typeof formatKey === 'function' ? formatKey(s.key) : s.key) + '</span>' : '');
    chip.onclick = function() {
      playlistData.push({
        name: s.name,
        key: s.key || '',
        bpm: s.bpm || 0,
        artist: s.artist || '',
        singer: s.singer || '',
        transpose: 0,
        mode: 'major'
      });
      renderPlaylist();
      showSongsAlert('\u2795 ' + s.name);
    };
    wrap.appendChild(chip);
  });
}

// Patch addSong to also save to recent
var _origAddSong = addSong;
addSong = function(song) {
  _origAddSong(song);
  if (song) saveRecentSong(song);
  renderRecentSongs();
};

// ── F. Save/Restore Filter State ──
var FILTER_KEY = 'songFilters_' + (localStorage.getItem('bandId') || 'default');

function saveFilterState() {
  var state = {
    singer: (document.getElementById('singer') || {}).value || '',
    era: (document.getElementById('era') || {}).value || '',
    genre: (document.getElementById('genre') || {}).value || '',
    mood: (document.getElementById('mood') || {}).value || '',
    artist: (document.getElementById('artist') || {}).value || '',
    search: (document.getElementById('searchText') || {}).value || ''
  };
  try { sessionStorage.setItem(FILTER_KEY, JSON.stringify(state)); } catch(e) {}
}

function restoreFilterState() {
  try {
    var state = JSON.parse(sessionStorage.getItem(FILTER_KEY) || 'null');
    if (!state) return false;
    if (state.singer) { var el = document.getElementById('singer'); if (el) el.value = state.singer; }
    if (state.era)    { var el2 = document.getElementById('era'); if (el2) el2.value = state.era; }
    if (state.genre)  { var el3 = document.getElementById('genre'); if (el3) el3.value = state.genre; }
    if (state.mood)   { var el4 = document.getElementById('mood'); if (el4) el4.value = state.mood; }
    if (state.search) {
      var el5 = document.getElementById('searchText');
      if (el5) {
        el5.value = state.search;
        var btn = document.getElementById('searchClearBtn');
        if (btn) btn.style.display = 'flex';
      }
    }
    // artist needs to wait for populateArtistFilter, so we store it and apply after
    if (state.artist) window._pendingArtistFilter = state.artist;
    return !!(state.singer || state.era || state.genre || state.mood || state.search);
  } catch(e) { return false; }
}

// Patch filter change functions to save state
var _origOnFilterChange = onFilterChange;
onFilterChange = function() {
  _origOnFilterChange();
  saveFilterState();
};

var _origApplyTextFilter = applyTextFilter;
applyTextFilter = function() {
  _origApplyTextFilter();
  saveFilterState();
};

// Patch populateArtistFilter to restore artist selection
var _origPopulateArtistFilter = populateArtistFilter;
populateArtistFilter = function() {
  _origPopulateArtistFilter();
  // After a delay for async load, apply pending artist filter
  setTimeout(function() {
    if (window._pendingArtistFilter) {
      var sel = document.getElementById('artist');
      if (sel) {
        sel.value = window._pendingArtistFilter;
        delete window._pendingArtistFilter;
      }
    }
  }, 800);
};

// ── Init on load ──
var _origOnload = window.onload;
window.onload = function() {
  // Restore filters BEFORE the original onload calls loadInitial
  var hadFilters = restoreFilterState();

  // Call original onload
  if (_origOnload) _origOnload();

  // Render recent songs
  renderRecentSongs();

  // Show plAddModeBtn always (not dependent on bandId)
  var pabBtn = document.getElementById('plAddModeBtn');
  if (pabBtn) pabBtn.style.display = 'inline-flex';

  // Update floating counter
  updatePlaylistFloating();
};
</script>
'@

$content = $content.Replace("</body>", "$upgradeScript`n</body>")

# ─── Write file with UTF-8 BOM ───
[System.IO.File]::WriteAllText($file, $content, $utf8BOM)

Write-Host "=== songs.html upgraded successfully ===" -ForegroundColor Green
Write-Host "Changes applied:"
Write-Host "  1. Artist name now shown in song cards" -ForegroundColor Cyan
Write-Host "  2. Floating playlist counter (sticky bottom-right)" -ForegroundColor Cyan
Write-Host "  3. Multi-select batch add to playlist" -ForegroundColor Cyan
Write-Host "  4. Search term highlighting in results" -ForegroundColor Cyan
Write-Host "  5. Filter state saved in sessionStorage" -ForegroundColor Cyan
Write-Host "  6. Recently Used Songs section" -ForegroundColor Cyan

# Verify Thai text integrity
$newContent = [System.IO.File]::ReadAllText($file, $utf8BOM)
$questionMarks = ([regex]::Matches($newContent, '\?\?\?\?\?\?')).Count
if ($questionMarks -gt 0) {
  Write-Host "WARNING: Possible Thai text corruption detected ($questionMarks occurrences of '??????')" -ForegroundColor Red
} else {
  Write-Host "Thai text integrity check: PASSED" -ForegroundColor Green
}

# Verify file size is reasonable (original + additions should be larger)
$origSize = $original.Length
$newSize = $newContent.Length
Write-Host "File size: $origSize -> $newSize (+$($newSize - $origSize) chars)" -ForegroundColor Yellow

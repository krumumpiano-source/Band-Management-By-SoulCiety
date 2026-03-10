
# ═══════════════════════════════════════════════════════════
# Fix songs.html — Performance + Clean UI rewrite
# Problem: monkey-patched renderPage causes double DOM render
# Solution: integrate artist/highlight/batch into original renderPage
# ═══════════════════════════════════════════════════════════

$file = "d:\AI CURSER\Band Management By SoulCiety\docs\songs.html"
$utf8BOM = New-Object System.Text.UTF8Encoding($true)
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$original = $content

# ──────────────────────────────────────────────
# 1) Replace old CSS for result-item / song-meta / buttons with cleaner design
# ──────────────────────────────────────────────

# Replace the song grid CSS section
$oldGridCSS = @'
/* 3-column song grid */
.result-columns{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:0;
  contain:layout;
}

.result-item{
  display:flex;
  align-items:center;
  gap:10px;
  padding:10px 12px;
  border-bottom:1px solid var(--premium-light-gray);
  border-right:1px solid var(--premium-light-gray);
  transition:background .15s;
  cursor:default;
}
.result-item:nth-child(3n){border-right:none}
.result-item:hover{background:var(--premium-off-white)}
.result-item-left{flex:1;min-width:0}

.song-title{
  font-size:14px;
  font-weight:700;
  font-family:var(--font-family-display);
  color:var(--premium-text);
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  margin-bottom:2px;
  line-height:1.3;
}
.song-meta{
  font-size:11px;
  color:var(--premium-text-muted);
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
'@

$newGridCSS = @'
/* 3-column song grid */
.result-columns{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:0;
  contain:layout;
  opacity:1;
  transition:opacity .12s ease;
}
.result-columns.fade-out{opacity:0}

.result-item{
  display:flex;
  align-items:center;
  gap:8px;
  padding:8px 10px;
  border-bottom:1px solid var(--premium-light-gray);
  border-right:1px solid var(--premium-light-gray);
  transition:background .12s;
  cursor:default;
  min-height:0;
}
.result-item:nth-child(3n){border-right:none}
.result-item:hover{background:#fafaf9}
.result-item-left{flex:1;min-width:0}

.song-title{
  font-size:13px;
  font-weight:700;
  font-family:var(--font-family-display);
  color:var(--premium-text);
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  margin-bottom:0;
  line-height:1.35;
}
.song-artist{
  font-size:11px;
  color:#9ca3af;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  line-height:1.3;
}
.song-meta{
  display:flex;
  align-items:center;
  gap:6px;
  font-size:10px;
  color:var(--premium-text-muted);
  white-space:nowrap;
  overflow:hidden;
  margin-top:1px;
  line-height:1.4;
}
.song-meta .sm-tag{
  display:inline-flex;
  align-items:center;
  gap:2px;
  padding:1px 6px;
  border-radius:4px;
  font-weight:600;
  font-size:10px;
  line-height:1.5;
}
.sm-key{background:#fef3c7;color:#92400e}
.sm-bpm{background:#f1f5f9;color:#64748b}
.sm-male{background:#dbeafe;color:#1e40af}
.sm-female{background:#fce7f3;color:#9d174d}
.sm-duet{background:#d1fae5;color:#065f46}
'@

$content = $content.Replace($oldGridCSS, $newGridCSS)

# Replace old add-song-btn CSS with compact version
$oldAddBtnCSS = @'
.add-song-btn{
  flex-shrink:0;
  width:36px;
  height:36px;
  border-radius:50%;
  background:var(--premium-gold-light);
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:18px;
  cursor:pointer;
  user-select:none;
  transition:background .15s;
  -webkit-tap-highlight-color:transparent;
  min-width:36px;
  min-height:36px;
  padding:0;
  border:1.5px solid var(--premium-gold);
  color:var(--premium-gold-dark);
}
.add-song-btn:hover{background:var(--premium-gold);color:#fff}
.add-song-btn:active{transform:scale(.92)}

.suggest-song-btn{
  flex-shrink:0;width:36px;height:36px;border-radius:50%;
  background:#ede9fe;display:flex;align-items:center;justify-content:center;
  font-size:16px;cursor:pointer;user-select:none;transition:background .15s;
  -webkit-tap-highlight-color:transparent;
  min-width:36px;min-height:36px;padding:0;border:1.5px solid #c4b5fd;color:#5b21b6;
}
.suggest-song-btn:hover{background:#c4b5fd;color:#fff}
.suggest-song-btn:active{transform:scale(.92)}
'@

$newAddBtnCSS = @'
.song-actions{display:flex;align-items:center;gap:4px;flex-shrink:0}
.add-song-btn{
  flex-shrink:0;
  width:30px;height:30px;
  border-radius:8px;
  background:var(--premium-gold-light);
  display:flex;align-items:center;justify-content:center;
  font-size:15px;
  cursor:pointer;user-select:none;
  transition:background .12s,transform .08s;
  -webkit-tap-highlight-color:transparent;
  min-width:30px;min-height:30px;padding:0;
  border:1px solid var(--premium-gold);
  color:var(--premium-gold-dark);
}
.add-song-btn:hover{background:var(--premium-gold);color:#fff}
.add-song-btn:active{transform:scale(.93)}

.suggest-song-btn{
  flex-shrink:0;width:28px;height:28px;border-radius:8px;
  background:#f5f3ff;display:flex;align-items:center;justify-content:center;
  font-size:13px;cursor:pointer;user-select:none;transition:background .12s;
  -webkit-tap-highlight-color:transparent;
  min-width:28px;min-height:28px;padding:0;border:1px solid #ddd6fe;color:#7c3aed;
}
.suggest-song-btn:hover{background:#ddd6fe;color:#5b21b6}
.suggest-song-btn:active{transform:scale(.93)}
'@

$content = $content.Replace($oldAddBtnCSS, $newAddBtnCSS)

# Replace edit/del button sizes too
$oldEditBtnCSS = @'
.edit-band-btn{
  flex-shrink:0;width:32px;height:32px;border-radius:50%;
  background:#dbeafe;display:flex;align-items:center;justify-content:center;
  font-size:14px;cursor:pointer;user-select:none;transition:background .15s;
  -webkit-tap-highlight-color:transparent;
  min-width:32px;min-height:32px;padding:0;border:1.5px solid #93c5fd;color:#1e40af;
}
.edit-band-btn:hover{background:#93c5fd;color:#fff}
.edit-band-btn:active{transform:scale(.92)}
.del-band-btn{
  flex-shrink:0;width:32px;height:32px;border-radius:50%;
  background:#fee2e2;display:flex;align-items:center;justify-content:center;
  font-size:14px;cursor:pointer;user-select:none;transition:background .15s;
  -webkit-tap-highlight-color:transparent;
  min-width:32px;min-height:32px;padding:0;border:1.5px solid #fca5a5;color:#991b1b;
}
.del-band-btn:hover{background:#fca5a5;color:#fff}
.del-band-btn:active{transform:scale(.92)}
'@

$newEditBtnCSS = @'
.edit-band-btn{
  flex-shrink:0;width:28px;height:28px;border-radius:8px;
  background:#eff6ff;display:flex;align-items:center;justify-content:center;
  font-size:12px;cursor:pointer;user-select:none;transition:background .12s;
  -webkit-tap-highlight-color:transparent;
  min-width:28px;min-height:28px;padding:0;border:1px solid #bfdbfe;color:#1e40af;
}
.edit-band-btn:hover{background:#bfdbfe;color:#1e3a8a}
.edit-band-btn:active{transform:scale(.93)}
.del-band-btn{
  flex-shrink:0;width:28px;height:28px;border-radius:8px;
  background:#fef2f2;display:flex;align-items:center;justify-content:center;
  font-size:12px;cursor:pointer;user-select:none;transition:background .12s;
  -webkit-tap-highlight-color:transparent;
  min-width:28px;min-height:28px;padding:0;border:1px solid #fecaca;color:#991b1b;
}
.del-band-btn:hover{background:#fecaca;color:#7f1d1d}
.del-band-btn:active{transform:scale(.93)}
'@

$content = $content.Replace($oldEditBtnCSS, $newEditBtnCSS)

# Replace pagination CSS for cleaner look
$oldPagCSS = @'
.pagination{
  display:flex;
  justify-content:center;
  align-items:center;
  gap:12px;
  margin-top:12px;
}
.pagination button{
  width:auto;
  background:var(--premium-off-white);
  color:var(--premium-text);
  border:1.5px solid var(--premium-border);
  font-weight:600;
}
.pagination button:hover{background:var(--premium-light-gray)}
.page-info{
  font-size:13px;
  color:var(--premium-text-muted);
  font-family:var(--font-family-body);
}
'@

$newPagCSS = @'
.pagination{
  display:flex;
  justify-content:center;
  align-items:center;
  gap:8px;
  margin-top:10px;
  padding:8px 0;
}
.pagination button{
  width:auto;
  background:#fff;
  color:var(--premium-text);
  border:1px solid var(--premium-border);
  font-weight:600;
  font-size:13px;
  padding:8px 16px;
  min-height:38px;
  border-radius:10px;
  transition:all .12s;
}
.pagination button:hover:not(:disabled){background:#f8f8f6;border-color:var(--premium-gold)}
.pagination button:disabled{opacity:.35}
.page-info{
  font-size:12px;
  color:var(--premium-text-muted);
  font-family:var(--font-family-body);
  padding:0 4px;
}
'@

$content = $content.Replace($oldPagCSS, $newPagCSS)

# Fix mobile responsive for new smaller items
$oldMob1 = @'
@media(max-width:899px){
  .result-columns{grid-template-columns:repeat(2,1fr)}
  .result-item:nth-child(3n){border-right:1px solid var(--premium-light-gray)}
  .result-item:nth-child(2n){border-right:none}
  .container{padding:12px}
  .panel{padding:12px}
  .tp-btn,.move-btn,.del{min-width:36px;min-height:36px;padding:8px;display:inline-flex;align-items:center;justify-content:center}
  .add-song-btn{min-width:40px;min-height:40px}
}
'@

$newMob1 = @'
@media(max-width:899px){
  .result-columns{grid-template-columns:repeat(2,1fr)}
  .result-item:nth-child(3n){border-right:1px solid var(--premium-light-gray)}
  .result-item:nth-child(2n){border-right:none}
  .container{padding:12px}
  .panel{padding:12px}
  .tp-btn,.move-btn,.del{min-width:36px;min-height:36px;padding:8px;display:inline-flex;align-items:center;justify-content:center}
  .add-song-btn{min-width:34px;min-height:34px}
}
'@

$content = $content.Replace($oldMob1, $newMob1)

# Remove old .song-artist CSS from upgrade (already in new grid CSS)
$oldUpgradeArtistCSS = @"
/* â`u{201e}â`u{201e} Artist name in song card â`u{201e}â`u{201e} */
.song-artist{
  font-size:11px;
  color:#6b7280;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  margin-bottom:1px;
}
"@

$content = $content.Replace($oldUpgradeArtistCSS, "")

# ──────────────────────────────────────────────
# 2) REWRITE renderPage() — integrated artist, highlight, batch select, cleaner card
# ──────────────────────────────────────────────

$oldRenderPage = @'
function renderPage() {
  var resultEl = getEl("result");
  var pageInfoEl = getEl("pageInfo");
  var prevBtn = getEl("prevBtn");
  var nextBtn = getEl("nextBtn");
  if (!resultEl) return;
  if (resultEl.classList.contains("is-loading")) return;

  var pageItems = _pageData;
  var totalPages = _totalPages;

  var html = "";
  if (pageItems.length === 0) {
    html = '<div class="result-empty">ไม่พบเพลงที่ตรงกับตัวกรอง</div>';
  } else {
    var buf = [];
    for (var i = 0; i < pageItems.length; i++) {
      var s = pageItems[i];
      var idx = i;
      var nameEscaped = escapeHtml(s.name);
      var newTag = s.isNew ? '<span class="new-tag">New</span>' : '';
      var songId = escapeHtml(s.id || s.songId || '');
      var meta = [];
      if (s.key) meta.push('🎵 ' + escapeHtml(formatKey(s.key)));
      if (s.bpm > 0) meta.push('⏱ ' + s.bpm + ' BPM');
      if (s.singer) {
        var singerLabel = s.singer;
        var singerColor = '#666';
        if (s.singer === 'ชาย' || s.singer === 'male')   { singerLabel = 'ชาย'; singerColor = '#1e3a8a'; }
        if (s.singer === 'หญิง' || s.singer === 'female') { singerLabel = 'หญิง'; singerColor = '#9d174d'; }
        if (s.singer === 'ชาย/หญิง' || s.singer === 'duet' || s.singer === 'คู่') { singerLabel = 'คู่'; singerColor = '#065f46'; }
        meta.push('<span style="color:' + singerColor + '">🎤 ' + singerLabel + '</span>');
      }
      var metaHtml = meta.length ? '<div class="song-meta">' + meta.join(' &nbsp;·&nbsp; ') + '</div>' : '';

      if (_selectMode) {
        var isInLib = !!_bandLibraryIds[songId];
        var isSelected = !!_selectedIds[songId];
        if (isInLib) {
          buf.push(
            '<div class="result-item" data-index="' + idx + '" style="opacity:.55">' +
            '<div class="result-item-left">' +
            '<div class="song-title">' + nameEscaped + newTag + '<span class="in-lib-tag">\u2705 \u0e43\u0e19\u0e04\u0e25\u0e31\u0e07\u0e27\u0e07</span></div>' +
            metaHtml +
            '</div>' +
            '</div>'
          );
        } else {
          buf.push(
            '<div class="result-item' + (isSelected ? ' selected' : '') + '" data-index="' + idx + '" data-songid="' + songId + '" onclick="toggleSelection(\'' + songId + '\',this)" style="cursor:pointer">' +
            '<div class="sel-cb"><input type="checkbox"' + (isSelected ? ' checked' : '') + ' onclick="event.stopPropagation()" onchange="toggleSelection(\'' + songId + '\',this.closest(\'.result-item\'))"></div>' +
            '<div class="result-item-left">' +
            '<div class="song-title">' + nameEscaped + newTag + '</div>' +
            metaHtml +
            '</div>' +
            '</div>'
          );
        }
      } else {
      if (_currentSource === 'band') {
        var libType = s.libType || 'owned';
        if (libType === 'ref') {
          // Referenced global song: edit (detach) + remove from library + add to playlist
          buf.push(
            '<div class="result-item" data-index="' + idx + '">' +
            '<div class="result-item-left">' +
            '<div class="song-title">' + nameEscaped + newTag + '</div>' +
            metaHtml +
            '</div>' +
            '<span class="edit-band-btn" data-songid="' + songId + '" data-libtype="ref" title="\u0e41\u0e01\u0e49\u0e44\u0e02">\u270F\uFE0F</span>' +
            '<span class="del-band-btn" data-songid="' + songId + '" data-name="' + nameEscaped.replace(/"/g,'&quot;') + '" data-libtype="ref" title="นำออกจากคลังวง">✕</span>' +
            '<span class="add-song-btn" data-index="' + idx + '" title="\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e43\u0e19\u0e25\u0e34\u0e2a">\u2795</span>' +
            '</div>'
          );
        } else {
          // Band-owned song: edit + delete + add to playlist
          buf.push(
            '<div class="result-item" data-index="' + idx + '">' +
            '<div class="result-item-left">' +
            '<div class="song-title">' + nameEscaped + newTag + '</div>' +
            metaHtml +
            '</div>' +
            '<span class="edit-band-btn" data-songid="' + songId + '" title="\u0e41\u0e01\u0e49\u0e44\u0e02">\u270F\uFE0F</span>' +
            '<span class="del-band-btn" data-songid="' + songId + '" data-name="' + nameEscaped.replace(/"/g,'&quot;') + '" data-libtype="owned" title="\u0e25\u0e1a">\u2715</span>' +
            '<span class="add-song-btn" data-index="' + idx + '" title="\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e43\u0e19\u0e25\u0e34\u0e2a">\u2795</span>' +
            '</div>'
          );
        }
      } else {
      // Global library: suggest + add to playlist
      buf.push(
        '<div class="result-item" data-index="' + idx + '">' +
        '<div class="result-item-left">' +
        '<div class="song-title">' + nameEscaped + newTag + '</div>' +
        metaHtml +
        '</div>' +
        '<span class="suggest-song-btn" data-songid="' + songId + '" data-index="' + idx + '" title="แนะนำการแก้ไข">💡</span>' +
        '<span class="add-song-btn" data-index="' + idx + '" title="\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e43\u0e19\u0e25\u0e34\u0e2a">\u2795</span>' +
        '</div>'
      );
      }
      } // end _selectMode else
    }
    html = '<div class="result-columns">' + buf.join('') + '</div>';
  }

  resultEl.innerHTML = html;

  if (pageInfoEl) {
    pageInfoEl.textContent = _totalCount === 0
      ? "ไม่มีผลลัพธ์"
      : "หน้า " + currentPage + " / " + totalPages + "  (" + _totalCount + " เพลง)";
  }
  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages || _totalCount === 0;
}
'@

$newRenderPage = @'
function _highlightText(text, query) {
  if (!query || !text) return escapeHtml(text);
  var escaped = escapeHtml(text);
  var safeQ = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  try { return escaped.replace(new RegExp('(' + safeQ + ')', 'gi'), '<span class="search-hl">$1</span>'); }
  catch(e) { return escaped; }
}

function _buildMeta(s) {
  var tags = '';
  if (s.key) tags += '<span class="sm-tag sm-key">' + escapeHtml(formatKey(s.key)) + '</span>';
  if (s.bpm > 0) tags += '<span class="sm-tag sm-bpm">' + s.bpm + '</span>';
  if (s.singer) {
    var cls = 'sm-bpm';
    var lbl = s.singer;
    if (s.singer === '\u0e0a\u0e32\u0e22' || s.singer === 'male')   { cls = 'sm-male'; lbl = '\u0e0a\u0e32\u0e22'; }
    if (s.singer === '\u0e2b\u0e0d\u0e34\u0e07' || s.singer === 'female') { cls = 'sm-female'; lbl = '\u0e2b\u0e0d\u0e34\u0e07'; }
    if (s.singer === '\u0e0a\u0e32\u0e22/\u0e2b\u0e0d\u0e34\u0e07' || s.singer === 'duet' || s.singer === '\u0e04\u0e39\u0e48') { cls = 'sm-duet'; lbl = '\u0e04\u0e39\u0e48'; }
    tags += '<span class="sm-tag ' + cls + '">' + lbl + '</span>';
  }
  return tags ? '<div class="song-meta">' + tags + '</div>' : '';
}

function renderPage() {
  var resultEl = getEl("result");
  var pageInfoEl = getEl("pageInfo");
  var prevBtn = getEl("prevBtn");
  var nextBtn = getEl("nextBtn");
  if (!resultEl) return;
  if (resultEl.classList.contains("is-loading")) return;

  var pageItems = _pageData;
  var totalPages = _totalPages;
  var searchEl = document.getElementById('searchText');
  var searchQ = (searchEl && searchEl.value) ? searchEl.value.trim() : '';
  var useHighlight = searchQ.length > 0;
  var inPlAddMode = (typeof _plAddMode !== 'undefined') && _plAddMode;

  var html = "";
  if (pageItems.length === 0) {
    html = '<div class="result-empty">\u0e44\u0e21\u0e48\u0e1e\u0e1a\u0e40\u0e1e\u0e25\u0e07\u0e17\u0e35\u0e48\u0e15\u0e23\u0e07\u0e01\u0e31\u0e1a\u0e15\u0e31\u0e27\u0e01\u0e23\u0e2d\u0e07</div>';
  } else {
    var buf = [];
    for (var i = 0; i < pageItems.length; i++) {
      var s = pageItems[i];
      var idx = i;
      var nameHtml = useHighlight ? _highlightText(s.name, searchQ) : escapeHtml(s.name);
      var artistHtml = s.artist ? (useHighlight ? _highlightText(s.artist, searchQ) : escapeHtml(s.artist)) : '';
      var newTag = s.isNew ? '<span class="new-tag">New</span>' : '';
      var songId = escapeHtml(s.id || s.songId || '');
      var metaHtml = _buildMeta(s);
      var artistLine = artistHtml ? '<div class="song-artist">' + artistHtml + '</div>' : '';

      // Playlist batch-add mode checkbox
      var plCb = '';
      var plCls = '';
      var plClick = '';
      if (inPlAddMode) {
        var isPlSel = (typeof _plSelectedForAdd !== 'undefined') && !!_plSelectedForAdd[songId];
        plCls = isPlSel ? ' pl-selected' : '';
        plCb = '<div class="pl-cb" style="display:flex"><input type="checkbox"' + (isPlSel ? ' checked' : '') + ' onclick="event.stopPropagation()" onchange="togglePlSelection(\'' + songId + '\',this.closest(\'.result-item\'))"></div>';
        plClick = ' onclick="togglePlSelection(\'' + songId + '\',this)" style="cursor:pointer"';
      }

      if (_selectMode) {
        var isInLib = !!_bandLibraryIds[songId];
        var isSelected = !!_selectedIds[songId];
        if (isInLib) {
          buf.push(
            '<div class="result-item" data-index="' + idx + '" style="opacity:.5">' +
            '<div class="result-item-left">' +
            '<div class="song-title">' + nameHtml + newTag + '<span class="in-lib-tag">\u2705 \u0e43\u0e19\u0e04\u0e25\u0e31\u0e07\u0e27\u0e07</span></div>' +
            artistLine + metaHtml +
            '</div></div>'
          );
        } else {
          buf.push(
            '<div class="result-item' + (isSelected ? ' selected' : '') + '" data-index="' + idx + '" data-songid="' + songId + '" onclick="toggleSelection(\'' + songId + '\',this)" style="cursor:pointer">' +
            '<div class="sel-cb"><input type="checkbox"' + (isSelected ? ' checked' : '') + ' onclick="event.stopPropagation()" onchange="toggleSelection(\'' + songId + '\',this.closest(\'.result-item\'))"></div>' +
            '<div class="result-item-left">' +
            '<div class="song-title">' + nameHtml + newTag + '</div>' +
            artistLine + metaHtml +
            '</div></div>'
          );
        }
      } else if (_currentSource === 'band') {
        var libType = s.libType || 'owned';
        var isRef = libType === 'ref';
        buf.push(
          '<div class="result-item' + plCls + '" data-index="' + idx + '"' + plClick + '>' +
          plCb +
          '<div class="result-item-left">' +
          '<div class="song-title">' + nameHtml + newTag + '</div>' +
          artistLine + metaHtml +
          '</div>' +
          '<div class="song-actions">' +
          '<span class="edit-band-btn" data-songid="' + songId + '"' + (isRef ? ' data-libtype="ref"' : '') + ' title="\u0e41\u0e01\u0e49\u0e44\u0e02">\u270F\uFE0F</span>' +
          '<span class="del-band-btn" data-songid="' + songId + '" data-name="' + escapeHtml(s.name).replace(/"/g,'&quot;') + '" data-libtype="' + libType + '" title="' + (isRef ? '\u0e19\u0e33\u0e2d\u0e2d\u0e01' : '\u0e25\u0e1a') + '">\u2715</span>' +
          '<span class="add-song-btn" data-index="' + idx + '" title="\u0e40\u0e1e\u0e34\u0e48\u0e21">\u2795</span>' +
          '</div></div>'
        );
      } else {
        // Global library
        buf.push(
          '<div class="result-item' + plCls + '" data-index="' + idx + '"' + plClick + '>' +
          plCb +
          '<div class="result-item-left">' +
          '<div class="song-title">' + nameHtml + newTag + '</div>' +
          artistLine + metaHtml +
          '</div>' +
          '<div class="song-actions">' +
          '<span class="suggest-song-btn" data-songid="' + songId + '" data-index="' + idx + '" title="\u0e41\u0e19\u0e30\u0e19\u0e33">\uD83D\uDCA1</span>' +
          '<span class="add-song-btn" data-index="' + idx + '" title="\u0e40\u0e1e\u0e34\u0e48\u0e21">\u2795</span>' +
          '</div></div>'
        );
      }
    }
    html = '<div class="result-columns">' + buf.join('') + '</div>';
  }

  resultEl.innerHTML = html;

  if (pageInfoEl) {
    pageInfoEl.textContent = _totalCount === 0
      ? "\u0e44\u0e21\u0e48\u0e21\u0e35\u0e1c\u0e25\u0e25\u0e31\u0e1e\u0e18\u0e4c"
      : "\u0e2b\u0e19\u0e49\u0e32 " + currentPage + " / " + totalPages + "  (" + _totalCount + " \u0e40\u0e1e\u0e25\u0e07)";
  }
  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages || _totalCount === 0;

  // Update floating playlist counter
  if (typeof updatePlaylistFloating === 'function') updatePlaylistFloating();
}
'@

$content = $content.Replace($oldRenderPage, $newRenderPage)

# ──────────────────────────────────────────────
# 3) Add smooth page transition in loadPage
# ──────────────────────────────────────────────

$oldLoadPageStart = 'function loadPage(page) {
  currentPage = page || 1;
  setLoading(true);'

$newLoadPageStart = 'function loadPage(page) {
  currentPage = page || 1;
  // Fade out current results for smooth transition
  var _rc = document.querySelector(".result-columns");
  if (_rc) { _rc.classList.add("fade-out"); }
  setLoading(true);'

$content = $content.Replace($oldLoadPageStart, $newLoadPageStart)

# ──────────────────────────────────────────────
# 4) Increase PER_PAGE from 15 to 24 for fewer page changes
# ──────────────────────────────────────────────

$content = $content.Replace('const PER_PAGE = 15;', 'const PER_PAGE = 24;')

# ──────────────────────────────────────────────
# 5) Remove the monkey-patched renderPage from upgrade script
#    (it now causes double-render and is no longer needed)
# ──────────────────────────────────────────────

# Remove the old renderPage monkey-patch section
$oldMonkeyPatch = @'
// â"€â"€ B. Search Highlight â"€â"€
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

// â"€â"€ C. Artist name + search highlight in renderPage â"€â"€
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
'@

$content = $content.Replace($oldMonkeyPatch, '')

# Also remove the renderPlaylist monkey-patch (keep only floating counter update)
$oldPlaylistPatch = @'
// Patch renderPlaylist to update floating counter
var _origRenderPlaylist = renderPlaylist;
renderPlaylist = function() {
  _origRenderPlaylist();
  updatePlaylistFloating();
};
'@

$newPlaylistPatch = @'
// Patch renderPlaylist to update floating counter
var _origRenderPlaylist = renderPlaylist;
renderPlaylist = function() {
  _origRenderPlaylist();
  updatePlaylistFloating();
};

// Keep highlightText available for other components
function highlightText(text, query) { return _highlightText ? _highlightText(text, query) : escapeHtml(text); }
'@

$content = $content.Replace($oldPlaylistPatch, $newPlaylistPatch)

# ──────────────────────────────────────────────
# Write file
# ──────────────────────────────────────────────
[System.IO.File]::WriteAllText($file, $content, $utf8BOM)

# ──────────────────────────────────────────────
# Verify
# ──────────────────────────────────────────────
$newContent = [System.IO.File]::ReadAllText($file, $utf8BOM)
$qm = ([regex]::Matches($newContent, '\?\?\?\?\?\?')).Count
$origSize = $original.Length
$newSize = $newContent.Length

Write-Host "=== songs.html performance + UI fix applied ===" -ForegroundColor Green
Write-Host "File size: $origSize -> $newSize chars" -ForegroundColor Yellow

# Verify key features still exist
$checks = @(
  @('renderPage', 'renderPage function'),
  @('_buildMeta', 'integrated meta builder'),
  @('_highlightText', 'integrated highlight'),
  @('song-artist', 'artist CSS'),
  @('search-hl', 'search highlight CSS'),
  @('playlistFloating', 'floating counter'),
  @('plAddBar', 'batch add bar'),
  @('recentSongsPanel', 'recent songs'),
  @('fade-out', 'smooth page transition'),
  @('PER_PAGE = 24', 'increased per-page'),
  @('sm-tag', 'compact meta tags'),
  @('song-actions', 'action button wrapper')
)

$allOk = $true
foreach ($c in $checks) {
  $found = $newContent.Contains($c[0])
  if (!$found) { $allOk = $false }
  Write-Host "$(if($found){'OK'}else{'FAIL'}) : $($c[1])" -ForegroundColor $(if($found){'Green'}else{'Red'})
}

# Verify no double renderPage monkey-patch
$doubleRender = $newContent.Contains('_origRenderPage')
Write-Host "$(if(!$doubleRender){'OK'}else{'FAIL'}) : no double-render monkey-patch" -ForegroundColor $(if(!$doubleRender){'Green'}else{'Red'})

if ($qm -gt 0) {
  Write-Host "WARNING: Possible Thai text corruption ($qm occurrences)" -ForegroundColor Red
} else {
  Write-Host "Thai text: OK" -ForegroundColor Green
}

# Check Thai
$thaiOk = $newContent.Contains('คลังเพลง') -and $newContent.Contains('นักร้อง') -and $newContent.Contains('แนวเพลง')
Write-Host "Thai keywords present: $thaiOk" -ForegroundColor $(if($thaiOk){'Green'}else{'Red'})

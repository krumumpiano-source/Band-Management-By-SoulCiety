/**
 * Band Management By SoulCiety — Navigation
 * renderMainNav() — ไฟล์นี้เป็นที่เดียวที่ renderMainNav ถูกนิยาม
 */

function renderMainNav(containerId) {
  if (typeof ensureDemoSession === 'function') ensureDemoSession();
  var container = document.getElementById(containerId || 'mainNav');
  if (!container) return;

  var bandName = localStorage.getItem('bandName') || (typeof t === 'function' ? t('yourBand') : 'วงของคุณ');
  var userName = localStorage.getItem('userName') || (typeof t === 'function' ? t('user') : 'ผู้ใช้');
  var userRole = localStorage.getItem('userRole') || 'member';
  var isAdmin = userRole === 'admin';
  // admin มีสิทธิ์ทุกอย่างที่ manager มี
  var isManager = !!(localStorage.getItem('bandManager') || userRole === 'manager' || isAdmin);
  var _t = typeof t === 'function' ? t : function(k) { return k; };

  // ตรวจ active page
  var currentPage = '';
  if (typeof google !== 'undefined' && google.script) {
    var params = new URLSearchParams(window.location.search);
    currentPage = params.get('page') || 'dashboard';
  } else {
    currentPage = (window.location.pathname.split('/').pop() || 'dashboard.html').replace('.html','');
  }

  function navLink(page, label) {
    var isActive = currentPage === page ? ' active' : '';
    var href = typeof google !== 'undefined' && google.script ? '?page=' + page : page + '.html';
    return '<li><a href="' + href + '" class="nav-link' + isActive + '">' + label + '</a></li>';
  }

  container.innerHTML =
    '<div class="nav-backdrop" id="navBackdrop"></div>' +
    '<div class="main-nav">' +
      '<div class="nav-inner">' +
        '<div class="nav-brand">' +
          '<a href="' + (typeof google !== 'undefined' && google.script ? '?page=dashboard' : 'dashboard.html') + '">🎵 ' + _escHtml(bandName) + '</a>' +
        '</div>' +
        '<button class="nav-hamburger" id="navHamburger" aria-label="เมนู" aria-expanded="false">' +
          '<span></span><span></span><span></span>' +
        '</button>' +
        '<div class="nav-right">' +
          '<div id="navLangSwitcher"></div>' +
          '<span class="nav-user-name">' + _escHtml(userName) + '</span>' +
          '<a href="' + (typeof google !== 'undefined' && google.script ? '?page=index' : 'index.html') + '" class="nav-logout" onclick="if(typeof doLogout===\'function\')doLogout();return true;">' + _t('logout') + '</a>' +
        '</div>' +
      '</div>' +
      '<div class="nav-menu-wrap" id="navMenuWrap">' +
        '<ul class="nav-menu">' +
          navLink('dashboard', '📊 ' + _t('nav_dashboard')) +
          navLink('songs', '🎵 ' + _t('nav_songs')) +
          navLink('song-insights', '🎙️ ' + _t('nav_songInsights')) +
          (isManager ? navLink('attendance-payroll', '📋 ' + _t('nav_attendance')) : '') +
          navLink('leave', '🔄 ' + _t('nav_leave')) +
          navLink('external-payout', '💵 ' + _t('nav_externalPayout')) +
          (isManager ? navLink('job-calculator', '🧮 ' + _t('nav_jobCalculator')) : '') +
          navLink('schedule', '📅 ' + _t('nav_schedule')) +
          navLink('quotation', '📄 ' + _t('nav_quotation')) +
          navLink('contract', '📜 ' + _t('nav_contract')) +
          (isManager ? navLink('band-fund', '💰 ' + _t('nav_bandFund')) : '') +
          navLink('statistics', '📈 ' + _t('nav_statistics')) +
          navLink('equipment', '🎸 ' + _t('nav_equipment')) +
          navLink('clients', '🤝 ' + _t('nav_clients')) +
          navLink('band-info', '👥 ' + _t('nav_bandInfo')) +
          (isManager ? navLink('band-settings', '⚙️ ' + _t('nav_settings')) : '') +
          navLink('user-manual', '📖 ' + _t('nav_userManual')) +
          (isAdmin ? navLink('admin', '🔧 ' + _t('nav_admin')) : '') +
        '</ul>' +
      '</div>' +
    '</div>';

  // Hamburger toggle
  var hamburger = document.getElementById('navHamburger');
  var menuWrap = document.getElementById('navMenuWrap');
  var backdrop = document.getElementById('navBackdrop');

  function navOpen() {
    hamburger.classList.add('open');
    menuWrap.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
  }
  function navClose() {
    hamburger.classList.remove('open');
    menuWrap.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  if (hamburger && menuWrap) {
    hamburger.addEventListener('click', function(e) {
      e.stopPropagation();
      hamburger.classList.contains('open') ? navClose() : navOpen();
    });
    // Close on backdrop click
    if (backdrop) backdrop.addEventListener('click', navClose);
    // Close when a nav link is clicked
    menuWrap.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', navClose);
    });
  }

  if (typeof renderLangSwitcher === 'function') {
    renderLangSwitcher('navLangSwitcher');
  } else {
    _renderNavLang('navLangSwitcher');
  }

  // ===== Bottom Tab Bar (mobile/tablet) =====
  _renderBottomTabBar(currentPage, isManager);
}

function _renderNavLang(containerId) {
  var el = document.getElementById(containerId);
  if (!el) return;
  var lang = typeof getLang === 'function' ? getLang() : 'th';
  el.innerHTML =
    '<div class="lang-switcher">' +
      '<button type="button" class="lang-btn ' + (lang==='th'?'active':'') + '" data-lang="th">TH</button>' +
      '<button type="button" class="lang-btn ' + (lang==='en'?'active':'') + '" data-lang="en">EN</button>' +
    '</div>';
  el.querySelectorAll('[data-lang]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (typeof setLang === 'function') setLang(btn.dataset.lang);
      renderMainNav('mainNav');
      if (typeof applyTranslations === 'function') applyTranslations();
    });
  });
}

function renderLangSwitcher(containerId) { _renderNavLang(containerId); }

/* ===== Bottom Tab Bar ===== */
function _renderBottomTabBar(currentPage, isManager) {
  // Remove any existing bar first
  var existing = document.getElementById('_bottomTabBar');
  if (existing) existing.parentNode.removeChild(existing);

  var isGas = typeof google !== 'undefined' && google.script;
  function href(page) { return isGas ? '?page=' + page : page + '.html'; }

  // The 5 "main" pages in the bottom bar
  var MAIN_TABS = ['dashboard', 'songs', 'schedule', 'leave', '__more__'];
  var isInMainTabs = MAIN_TABS.indexOf(currentPage) !== -1 && currentPage !== '__more__';

  function tab(page, icon, label) {
    var isActive = currentPage === page;
    if (page === '__more__') {
      var dotClass = isInMainTabs ? '' : ' show';
      return '<button class="btab' + (isActive ? ' active' : '') + '" id="_btabMore" aria-label="เมนูเพิ่มเติม">' +
        '<span class="btab-dot' + dotClass + '"></span>' +
        '<span class="btab-icon">☰</span>' +
        '<span class="btab-label">' + label + '</span>' +
        '</button>';
    }
    return '<a class="btab' + (isActive ? ' active' : '') + '" href="' + href(page) + '" aria-label="' + label + '">' +
      '<span class="btab-icon">' + icon + '</span>' +
      '<span class="btab-label">' + label + '</span>' +
      '</a>';
  }

  var bar = document.createElement('nav');
  bar.id = '_bottomTabBar';
  bar.className = 'bottom-tab-bar';
  bar.setAttribute('aria-label', 'เมนูหลัก');
  bar.innerHTML =
    tab('dashboard', '🏠', 'หน้าหลัก') +
    tab('songs',     '🎵', 'เพลง') +
    tab('schedule',  '📅', 'ตาราง') +
    tab('leave',     '🔄', 'คนลา') +
    tab('__more__',  '☰',  'เพิ่มเติม');

  document.body.appendChild(bar);

  // Wire "เพิ่มเติม" tab → hamburger toggle
  var moreBtn = document.getElementById('_btabMore');
  if (moreBtn) {
    moreBtn.addEventListener('click', function(e) {
      e.preventDefault();
      var hamburger = document.getElementById('navHamburger');
      if (hamburger) hamburger.click();
    });
  }
}

function doLogout() {
  var token = typeof getAuthToken === 'function' ? getAuthToken() : (localStorage.getItem('auth_token') || '');
  if (token && token.indexOf('demo_') !== 0 && typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run.doPostFromClient({ action: 'logout', _token: token });
  }
  ['auth_token','bandId','bandName','bandManager','userRole','userName'].forEach(function(k) {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
}

function _escHtml(text) {
  if (!text) return '';
  var d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

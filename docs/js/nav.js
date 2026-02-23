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
    '<div class="main-nav">' +
      '<div class="nav-inner">' +
        '<div class="nav-brand">' +
          '<a href="' + (typeof google !== 'undefined' && google.script ? '?page=dashboard' : 'dashboard.html') + '">🎵 ' + _escHtml(bandName) + '</a>' +
        '</div>' +
        '<button class="nav-hamburger" id="navHamburger" aria-label="เมนู">' +
          '<span></span><span></span><span></span>' +
        '</button>' +
        '<div class="nav-menu-wrap" id="navMenuWrap">' +
          '<ul class="nav-menu">' +
            navLink('dashboard', '📊 ' + _t('nav_dashboard')) +
            navLink('check-in', '⏰ ' + _t('nav_checkIn')) +
            navLink('songs', '🎵 ' + _t('nav_songs')) +
            (isManager ? navLink('attendance-payroll', '📋 ' + _t('nav_attendance')) : '') +
            navLink('external-payout', '💵 ' + _t('nav_externalPayout')) +
            navLink('schedule', '📅 ' + _t('nav_schedule')) +
            (isManager ? navLink('job-calculator', '🧮 ' + _t('nav_jobCalculator')) : '') +
            navLink('quotation', '📄 ' + _t('nav_quotation')) +
            navLink('contract', '📜 ' + _t('nav_contract')) +
            navLink('statistics', '📈 ' + _t('nav_statistics')) +
            navLink('song-insights', '🎙️ ' + _t('nav_songInsights')) +
            navLink('equipment', '🎸 ' + _t('nav_equipment')) +
            navLink('clients', '🤝 ' + _t('nav_clients')) +
            navLink('band-info', '👥 ' + _t('nav_bandInfo')) +
            (isManager ? navLink('band-fund', '💰 ' + _t('nav_bandFund')) : '') +
            (isManager ? navLink('band-settings', '⚙️ ' + _t('nav_settings')) : '') +
            navLink('user-manual', '📖 ' + _t('nav_userManual')) +
            (isAdmin ? navLink('admin', '🔧 ' + _t('nav_admin')) : '') +
          '</ul>' +
          '<div class="nav-right">' +
            '<div id="navLangSwitcher"></div>' +
            '<span class="nav-user-name">' + _escHtml(userName) + '</span>' +
            '<a href="' + (typeof google !== 'undefined' && google.script ? '?page=index' : 'index.html') + '" class="nav-logout" onclick="if(typeof doLogout===\'function\')doLogout();return true;">' + _t('logout') + '</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  // Hamburger toggle
  var hamburger = document.getElementById('navHamburger');
  var menuWrap = document.getElementById('navMenuWrap');
  if (hamburger && menuWrap) {
    hamburger.addEventListener('click', function() {
      hamburger.classList.toggle('open');
      menuWrap.classList.toggle('open');
    });
    document.addEventListener('click', function(e) {
      if (!container.contains(e.target)) {
        hamburger.classList.remove('open');
        menuWrap.classList.remove('open');
      }
    });
  }

  if (typeof renderLangSwitcher === 'function') {
    renderLangSwitcher('navLangSwitcher');
  } else {
    _renderNavLang('navLangSwitcher');
  }
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

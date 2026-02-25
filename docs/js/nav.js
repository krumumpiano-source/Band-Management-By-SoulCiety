/**
 * Band Management By SoulCiety — Navigation (Sidebar)
 * renderMainNav() — ไฟล์นี้เป็นที่เดียวที่ renderMainNav ถูกนิยาม
 */

function renderMainNav(containerId) {
  if (typeof ensureDemoSession === 'function') ensureDemoSession();
  var container = document.getElementById(containerId || 'mainNav');
  if (!container) return;

  var isGas = typeof google !== 'undefined' && google.script;
  var bandName = localStorage.getItem('bandName') || (typeof t === 'function' ? t('yourBand') : 'วงของคุณ');
  var userName = localStorage.getItem('userName') || (typeof t === 'function' ? t('user') : 'ผู้ใช้');
  var userRole = localStorage.getItem('userRole') || 'member';
  var isAdmin = userRole === 'admin';
  var isManager = !!(localStorage.getItem('bandManager') || userRole === 'manager' || isAdmin);
  var _t = typeof t === 'function' ? t : function(k) { return k; };

  function dashHref() { return isGas ? '?page=dashboard' : 'dashboard.html'; }
  function indexHref() { return isGas ? '?page=index' : 'index.html'; }

  // ── ตรวจ active page ──────────────────────────────────
  var currentPage = '';
  if (isGas) {
    currentPage = new URLSearchParams(window.location.search).get('page') || 'dashboard';
  } else {
    currentPage = (window.location.pathname.split('/').pop() || 'dashboard.html').replace('.html', '');
  }

  function navLink(page, label) {
    var isActive = currentPage === page ? ' active' : '';
    var href = isGas ? '?page=' + page : page + '.html';
    return '<li><a href="' + href + '" class="nav-link' + isActive + '">' + label + '</a></li>';
  }
  function navSection(label) {
    return '<li class="nav-section-title">' + label + '</li>';
  }

  // ── Role display label ────────────────────────────────
  var roleLabel = isAdmin ? '🔧 Admin' : isManager ? '👔 ผู้จัดการวง' : '🎸 สมาชิกวง';

  // ── เมนูสมาชิกวง (ทุกบทบาท) ─────────────────────────
  var memberLinks =
    navSection('🎸 สมาชิกวง') +
    navLink('dashboard',       '📊 ' + _t('nav_dashboard')) +
    navLink('songs',           '🎵 ' + _t('nav_songs')) +
    navLink('song-insights',   '🎙️ ' + _t('nav_songInsights')) +
    navLink('leave',           '🔄 ' + _t('nav_leave')) +
    // navLink('external-payout', '💵 ' + _t('nav_externalPayout')) +  // ปิดชั่วคราว
    navLink('schedule',        '📅 ' + _t('nav_schedule')) +
    // navLink('quotation',       '📄 ' + _t('nav_quotation')) +        // ปิดชั่วคราว
    // navLink('contract',        '📜 ' + _t('nav_contract')) +         // ปิดชั่วคราว
    navLink('statistics',      '📈 ' + _t('nav_statistics')) +
    // navLink('equipment',       '🎸 ' + _t('nav_equipment')) +        // ปิดชั่วคราว
    // navLink('clients',         '🤝 ' + _t('nav_clients')) +          // ปิดชั่วคราว
    navLink('band-info',       '👥 ' + _t('nav_bandInfo')) +
    navLink('user-manual',     '📖 ' + _t('nav_userManual'));

  // ── เมนูผู้จัดการวง ───────────────────────────────────
  var managerLinks = isManager ? (
    navSection('👔 ผู้จัดการวง') +
    navLink('attendance-payroll', '📋 ' + _t('nav_attendance')) +
    navLink('job-calculator',     '🧮 ' + _t('nav_jobCalculator')) +
    navLink('band-fund',          '💰 ' + _t('nav_bandFund')) +
    navLink('band-settings',      '⚙️ ' + _t('nav_settings'))
  ) : '';

  // ── เมนูแอดมิน ────────────────────────────────────────
  var adminLinks = isAdmin ? (
    navSection('🔧 แอดมิน') +
    navLink('admin', '🔧 ' + _t('nav_admin'))
  ) : '';

  container.innerHTML =
    /* ── Topbar (mobile only) ──────────────── */
    '<header class="nav-topbar">' +
      '<button class="nav-hamburger" id="navHamburger" aria-label="เปิดเมนู" aria-expanded="false">' +
        '<span></span><span></span><span></span>' +
      '</button>' +
      '<a href="' + dashHref() + '" class="nav-topbar-brand">🎵 ' + _escHtml(bandName) + '</a>' +
      '<div class="nav-topbar-right">' +
        '<div id="navLangSwitcherTop"></div>' +
        '<span class="nav-user-name">' + _escHtml(userName) + '</span>' +
      '</div>' +
    '</header>' +

    /* ── Backdrop ──────────────────────────── */
    '<div class="nav-backdrop" id="navBackdrop"></div>' +

    /* ── Sidebar ───────────────────────────── */
    '<aside class="nav-sidebar" id="navSidebar" aria-label="เมนูหลัก">' +
      '<div class="sidebar-header">' +
        '<a href="' + dashHref() + '" class="sidebar-brand">🎵 ' + _escHtml(bandName) + '</a>' +
        '<button class="sidebar-close" id="navClose" aria-label="ปิดเมนู">✕</button>' +
      '</div>' +
      '<div class="sidebar-user">' +
        '<div class="sidebar-avatar">🎤</div>' +
        '<div class="sidebar-user-info">' +
          '<div class="sidebar-user-name">' + _escHtml(userName) + '</div>' +
          '<div class="sidebar-user-role">' + roleLabel + '</div>' +
        '</div>' +
      '</div>' +
      '<nav class="sidebar-nav">' +
        '<ul class="nav-menu">' +
          memberLinks +
          managerLinks +
          adminLinks +
        '</ul>' +
      '</nav>' +
      '<div class="sidebar-footer">' +
        '<div id="navLangSwitcher"></div>' +
        '<a href="' + indexHref() + '" class="nav-logout" onclick="if(typeof doLogout===\'function\')doLogout();return true;">' + _t('logout') + '</a>' +
      '</div>' +
    '</aside>';

  // ── Toggle logic ──────────────────────────────────────
  var hamburger = document.getElementById('navHamburger');
  var sidebar   = document.getElementById('navSidebar');
  var backdrop  = document.getElementById('navBackdrop');
  var closeBtn  = document.getElementById('navClose');

  function navOpen() {
    sidebar.classList.add('open');
    backdrop.classList.add('open');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function navClose() {
    sidebar.classList.remove('open');
    backdrop.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (hamburger) hamburger.addEventListener('click', function(e) {
    e.stopPropagation();
    sidebar.classList.contains('open') ? navClose() : navOpen();
  });
  if (closeBtn)  closeBtn.addEventListener('click', navClose);
  if (backdrop)  backdrop.addEventListener('click', navClose);

  // Close sidebar on link click (mobile)
  if (sidebar) sidebar.querySelectorAll('a.nav-link').forEach(function(a) {
    a.addEventListener('click', function() {
      if (window.innerWidth < 1024) navClose();
    });
  });

  // Keyboard: Escape key closes
  document.addEventListener('keydown', function kh(e) {
    if (e.key === 'Escape') { navClose(); document.removeEventListener('keydown', kh); }
  });

  // ── Lang switchers ────────────────────────────────────
  if (typeof renderLangSwitcher === 'function') {
    renderLangSwitcher('navLangSwitcher');
    renderLangSwitcher('navLangSwitcherTop');
  } else {
    _renderNavLang('navLangSwitcher');
    _renderNavLang('navLangSwitcherTop');
  }

  // Remove old bottom tab bar if exists
  var oldBar = document.getElementById('_bottomTabBar');
  if (oldBar) oldBar.parentNode.removeChild(oldBar);
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
  if (token && token.indexOf('demo_') !== 0) {
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      // GAS-embedded context
      google.script.run.doPostFromClient({ action: 'logout', _token: token });
    } else if (typeof gasRun === 'function') {
      // GitHub Pages / standalone context — fire-and-forget
      gasRun('logout', { _token: token }, function() {});
    }
  }
  ['auth_token','bandId','bandName','bandManager','userRole','userName','bandSettings'].forEach(function(k) {
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

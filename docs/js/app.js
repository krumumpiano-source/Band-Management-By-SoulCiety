/**
 * Band Management By SoulCiety — Core App (GitHub Pages version)
 * ใช้ Supabase SDK แทน GAS API
 *
 * Load order:
 *   1. i18n.js
 *   2. app.js  ← ไฟล์นี้ (inject config.js + Supabase SDK + supabase-api.js อัตโนมัติ)
 *   3. nav.js
 */

// ── Auto-inject Supabase SDK + config + supabase-api.js ─────────────
(function () {
  if (document.getElementById('_sb_sdk')) return;

  // 1) Load config.js ก่อน
  function loadScript(src, id, onload) {
    var s = document.createElement('script');
    if (id) s.id = id;
    s.src = src;
    if (onload) s.onload = onload;
    document.head.appendChild(s);
  }

  loadScript('js/config.js', '_sb_cfg', function () {
    // 2) Load Supabase SDK
    loadScript(
      'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
      '_sb_sdk',
      function () {
        // 3) Load supabase-api.js
        loadScript('js/supabase-api.js', '_sb_api', null);
      }
    );
  });
})();

(function(global){
  'use strict';

  // ──────────────────────────────────────────────────────────────────
  // GAS_API_URL ไม่ได้ใช้แล้ว — Supabase แทนที่ทั้งหมดผ่าน supabase-api.js
  // ──────────────────────────────────────────────────────────────────
  var GAS_API_URL = ''; // ไม่ใช้แล้ว

  // ======================================================
  // Auth
  // ======================================================
  function requireAuth() {
    if (!localStorage.getItem('auth_token')) {
      window.location.replace('index.html');
    }
  }
  global.requireAuth = requireAuth;

  function ensureDemoSession() {
    if (localStorage.getItem('auth_token')) return;
    localStorage.setItem('auth_token', 'demo_' + Date.now());
    localStorage.setItem('userName', 'ผู้ใช้');
    localStorage.setItem('bandName', 'วงของคุณ');
  }
  global.ensureDemoSession = ensureDemoSession;

  function getAuthToken() { return localStorage.getItem('auth_token') || ''; }
  global.getAuthToken = getAuthToken;

  // ======================================================
  // gasRun — ถูก override โดย supabase-api.js โดยอัตโนมัติ
  // ฟังก์ชันนี้เป็น placeholder จนกว่า supabase-api.js จะโหลดเสร็จ
  // ======================================================
  function gasRun(action, data, callback) {
    var tries = 0;
    var wait = setInterval(function () {
      tries++;
      if (typeof window.sbRun === 'function') {
        clearInterval(wait);
        window.sbRun(action, data, callback);
      } else if (tries > 100) {
        clearInterval(wait);
        if (callback) callback({ success: false, message: 'ไม่สามารถโหลด Supabase API ได้ กรุณารีเฟรชหน้า' });
      }
    }, 100);
  }
  global.gasRun = gasRun;

  // ======================================================
  // Translations
  // ======================================================
  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(function(node) {
      var key = node.getAttribute('data-i18n');
      if (key && typeof t === 'function') node.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(node) {
      var key = node.getAttribute('data-i18n-placeholder');
      if (key && typeof t === 'function') node.placeholder = t(key);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function(node) {
      var key = node.getAttribute('data-i18n-title');
      if (key && typeof t === 'function') node.title = t(key);
    });
  }
  global.applyTranslations = applyTranslations;

  // ======================================================
  // Toast
  // ======================================================
  function showToast(message, type) {
    type = type || 'success';
    var el = document.getElementById('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
    el.textContent = message;
    el.className = type;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(function() { el.classList.remove('show'); }, 3000);
  }
  global.showToast = showToast;

  // ======================================================
  // Confirm Dialog
  // ======================================================
  function showConfirm(title, message) {
    if (typeof title === 'object') { var o = title; title = o.title; message = o.message; }
    return new Promise(function(resolve) {
      title   = title   || (typeof t === 'function' ? t('confirmDeleteTitle') : 'ยืนยัน');
      message = message || (typeof t === 'function' ? t('confirmDeleteMsg')   : 'ต้องการดำเนินการใช่หรือไม่?');
      var overlay = document.createElement('div');
      overlay.className = 'confirm-overlay active';
      overlay.innerHTML =
        '<div class="confirm-box">' +
          '<h3>' + escapeHtml(title) + '</h3>' +
          '<p>' + escapeHtml(message) + '</p>' +
          '<div class="confirm-actions">' +
            '<button class="btn btn-secondary" id="_confirmCancel">' + (typeof t === 'function' ? t('cancel') : 'ยกเลิก') + '</button>' +
            '<button class="btn btn-danger" id="_confirmOk">' + (typeof t === 'function' ? t('delete') : 'ยืนยัน') + '</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(overlay);
      function cleanup(r) { document.body.removeChild(overlay); resolve(r); }
      overlay.querySelector('#_confirmOk').addEventListener('click', function() { cleanup(true); });
      overlay.querySelector('#_confirmCancel').addEventListener('click', function() { cleanup(false); });
      overlay.addEventListener('click', function(e) { if (e.target === overlay) cleanup(false); });
    });
  }
  global.showConfirm = showConfirm;

  // ======================================================
  // Lang Toggle (auth pages)
  // ======================================================
  function renderLangToggle(containerId) {
    var el = document.getElementById(containerId || 'langToggle');
    if (!el) return;
    var lang = typeof getLang === 'function' ? getLang() : 'th';
    el.innerHTML =
      '<div class="lang-switcher">' +
        '<button type="button" class="lang-btn' + (lang==='th'?' active':'') + '" data-lang="th">TH</button>' +
        '<button type="button" class="lang-btn' + (lang==='en'?' active':'') + '" data-lang="en">EN</button>' +
      '</div>';
    el.querySelectorAll('[data-lang]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (typeof setLang === 'function') setLang(btn.dataset.lang);
        renderLangToggle(containerId);
        if (typeof applyTranslations === 'function') applyTranslations();
      });
    });
  }
  global.renderLangToggle = renderLangToggle;

  // ======================================================
  // Helpers
  // ======================================================
  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }
  global.escapeHtml = escapeHtml;
  if (!global._escHtml) global._escHtml = escapeHtml;

  function formatCurrency(num) {
    num = parseFloat(num) || 0;
    return num.toLocaleString(typeof getLang === 'function' && getLang() === 'en' ? 'en-US' : 'th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  global.formatCurrency = formatCurrency;

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
      var d = new Date(dateStr);
      var lang = typeof getLang === 'function' ? getLang() : 'th';
      return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch(e) { return dateStr; }
  }
  global.formatDate = formatDate;

})(window);

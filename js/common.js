/* common.js — shared across index.html and reader.html
 * No build step, no dependencies. Everything lives under the `manga:` prefix
 * in localStorage so this can sit alongside other sites on the same origin.
 */
(function (global) {
  "use strict";

  var NS = "manga:";
  var THEME_KEY = NS + "theme";
  var SETTINGS_KEY = NS + "settings";
  var PROGRESS_PREFIX = NS + "progress:";
  var LAST_KEY = NS + "last";

  var MANIFEST_URL = "chapters.json";
  var _manifestCache = null;

  // ---------- tiny dom helpers ----------
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ---------- theme ----------
  function systemPrefersLight() {
    return global.matchMedia && global.matchMedia("(prefers-color-scheme: light)").matches;
  }
  function getTheme() {
    try {
      var t = localStorage.getItem(THEME_KEY);
      if (t === "light" || t === "dark") return t;
    } catch (e) { /* storage unavailable */ }
    return systemPrefersLight() ? "light" : "dark";
  }
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
  }
  function setTheme(t) {
    try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* ignore */ }
    applyTheme(t);
  }
  function toggleTheme() {
    var next = getTheme() === "light" ? "dark" : "light";
    setTheme(next);
    return next;
  }

  // ---------- reading settings (mode / direction), shared across chapters ----------
  function getSettings() {
    var defaults = { mode: "scroll", direction: "ltr" };
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return Object.assign(defaults, JSON.parse(raw));
    } catch (e) { /* ignore */ }
    return defaults;
  }
  function setSettings(patch) {
    var next = Object.assign(getSettings(), patch);
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch (e) { /* ignore */ }
    return next;
  }

  // ---------- per-chapter progress + "continue reading" pointer ----------
  function getProgress(chapterId) {
    try {
      var raw = localStorage.getItem(PROGRESS_PREFIX + chapterId);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return null;
  }
  function setProgress(chapterId, page, total) {
    var data = { page: page, total: total, updatedAt: Date.now() };
    try {
      localStorage.setItem(PROGRESS_PREFIX + chapterId, JSON.stringify(data));
      localStorage.setItem(LAST_KEY, JSON.stringify({ chapterId: chapterId, page: page, total: total, updatedAt: data.updatedAt }));
    } catch (e) { /* ignore */ }
    return data;
  }
  function getLast() {
    try {
      var raw = localStorage.getItem(LAST_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return null;
  }

  // ---------- manifest ----------
  function loadManifest() {
    if (_manifestCache) return Promise.resolve(_manifestCache);
    return fetch(MANIFEST_URL, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        data.chapters = data.chapters || [];
        _manifestCache = data;
        return data;
      });
  }

  // ---------- wire up a theme toggle button, if this page has one ----------
  function initThemeToggle(buttonId) {
    var btn = document.getElementById(buttonId || "themeToggle");
    if (!btn) return;
    btn.addEventListener("click", function () { toggleTheme(); });
  }

  applyTheme(getTheme());

  global.Manga = {
    qs: qs,
    qsa: qsa,
    escapeHtml: escapeHtml,
    getTheme: getTheme,
    setTheme: setTheme,
    toggleTheme: toggleTheme,
    initThemeToggle: initThemeToggle,
    getSettings: getSettings,
    setSettings: setSettings,
    getProgress: getProgress,
    setProgress: setProgress,
    getLast: getLast,
    loadManifest: loadManifest,
  };
})(window);

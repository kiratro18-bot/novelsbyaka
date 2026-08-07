// Shared helpers: settings storage, reading progress, manifest loading.
const Manga = (() => {
  const KEYS = {
    theme: 'manga:setting:theme',
    mode: 'manga:setting:mode',       // 'scroll' | 'page'
    direction: 'manga:setting:direction', // 'ltr' | 'rtl'
    progressPrefix: 'manga:progress:',
    lastRead: 'manga:lastRead',
  };

  function getSetting(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch (e) { return fallback; }
  }

  function setSetting(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  function applyTheme() {
    const theme = getSetting(KEYS.theme, 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    return theme;
  }

  function toggleTheme() {
    const current = getSetting(KEYS.theme, 'dark');
    const next = current === 'dark' ? 'light' : 'dark';
    setSetting(KEYS.theme, next);
    document.documentElement.setAttribute('data-theme', next);
    return next;
  }

  function getProgress(chapterId) {
    try {
      const raw = localStorage.getItem(KEYS.progressPrefix + chapterId);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function setProgress(chapterId, page, total) {
    const data = { page, total, ts: Date.now() };
    try {
      localStorage.setItem(KEYS.progressPrefix + chapterId, JSON.stringify(data));
      localStorage.setItem(KEYS.lastRead, JSON.stringify({ chapterId, ...data }));
    } catch (e) {}
  }

  function getLastRead() {
    try {
      const raw = localStorage.getItem(KEYS.lastRead);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  async function loadManifest() {
    const res = await fetch('chapters.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Could not load chapters.json');
    return res.json();
  }

  function pageUrl(chapter, filename) {
    return `${chapter.folder}/${filename}`;
  }

  return { KEYS, getSetting, setSetting, applyTheme, toggleTheme, getProgress, setProgress, getLastRead, loadManifest, pageUrl };
})();

Manga.applyTheme();

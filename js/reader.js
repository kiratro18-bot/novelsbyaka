(async function () {
  const readerMain = document.getElementById('readerMain');
  const chrome = document.getElementById('chrome');
  const chapterTitleEl = document.getElementById('chapterTitle');
  const pageCounterEl = document.getElementById('pageCounter');
  const progressFill = document.getElementById('progressFill');
  const settingsTab = document.getElementById('settingsTab');
  const drawer = document.getElementById('drawer');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  const modeGroup = document.getElementById('modeGroup');
  const directionGroup = document.getElementById('directionGroup');
  const directionRow = document.getElementById('directionRow');
  const themeGroup = document.getElementById('themeGroup');

  function qs(name) {
    return new URLSearchParams(location.search).get(name);
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  const chapterId = qs('chapter');
  const startParam = qs('start'); // 'end' to open at last page

  let manifest;
  try {
    manifest = await Manga.loadManifest();
  } catch (e) {
    readerMain.innerHTML = `<div class="end-panel"><h3>Couldn't load chapters.json</h3><p>Make sure you're running this from the project folder.</p><div class="end-actions"><a href="index.html">Back to library</a></div></div>`;
    return;
  }

  const chapters = manifest.chapters || [];
  const chapterIndex = chapters.findIndex(c => c.id === chapterId);

  if (chapterIndex === -1) {
    readerMain.innerHTML = `<div class="end-panel"><h3>Chapter not found</h3><p>This chapter doesn't exist in chapters.json.</p><div class="end-actions"><a class="primary" href="index.html">Back to library</a></div></div>`;
    chapterTitleEl.textContent = 'Not found';
    return;
  }

  const chapter = chapters[chapterIndex];
  const prevChapter = chapters[chapterIndex - 1] || null;
  const nextChapter = chapters[chapterIndex + 1] || null;
  const pages = chapter.pages || [];
  const total = pages.length;

  chapterTitleEl.textContent = chapter.title;
  document.title = chapter.title;

  // ---- state ----
  let mode = Manga.getSetting(Manga.KEYS.mode, 'scroll');
  let direction = Manga.getSetting(Manga.KEYS.direction, 'ltr');
  let theme = Manga.getSetting(Manga.KEYS.theme, 'dark');
  document.documentElement.setAttribute('data-theme', theme);

  let currentPage = 0;
  if (startParam === 'end') {
    currentPage = Math.max(0, total - 1);
  } else {
    const progress = Manga.getProgress(chapter.id);
    if (progress && typeof progress.page === 'number') currentPage = Math.min(progress.page, Math.max(0, total - 1));
  }

  let chromeVisible = true;
  function setChromeVisible(v) {
    chromeVisible = v;
    chrome.classList.toggle('visible', v);
  }
  setChromeVisible(true);
  function toggleChrome() { setChromeVisible(!chromeVisible); }

  function updateCounter(idx) {
    pageCounterEl.textContent = total ? `${idx + 1} / ${total}` : '';
    progressFill.style.width = total ? `${Math.round(((idx + 1) / total) * 100)}%` : '0%';
  }

  function saveProgress(idx) {
    Manga.setProgress(chapter.id, idx, total);
  }

  function endPanelHtml() {
    return `
      <div class="end-panel">
        <h3>Chapter complete</h3>
        <p>${escapeHtml(chapter.title)}</p>
        <div class="end-actions">
          ${nextChapter ? `<button class="primary" id="goNextChapter">Next: ${escapeHtml(nextChapter.title)}</button>` : ''}
          <a href="index.html">Back to library</a>
        </div>
      </div>`;
  }

  function wireEndPanel(root) {
    const btn = root.querySelector('#goNextChapter');
    if (btn && nextChapter) {
      btn.addEventListener('click', () => { location.href = `reader.html?chapter=${encodeURIComponent(nextChapter.id)}`; });
    }
  }

  // ---------------- SCROLL MODE ----------------
  function renderScroll() {
    readerMain.className = 'pages-scroll';
    if (!total) {
      readerMain.innerHTML = `<div class="end-panel"><h3>No pages in this chapter</h3><div class="end-actions"><a href="index.html">Back to library</a></div></div>`;
      return;
    }
    const frag = document.createDocumentFragment();
    pages.forEach((filename) => {
      const img = document.createElement('img');
      img.className = 'page-img';
      img.loading = 'lazy';
      img.src = Manga.pageUrl(chapter, filename);
      img.alt = '';
      frag.appendChild(img);
    });
    readerMain.innerHTML = '';
    readerMain.appendChild(frag);

    const endDiv = document.createElement('div');
    endDiv.innerHTML = endPanelHtml();
    readerMain.appendChild(endDiv.firstElementChild);
    wireEndPanel(readerMain);

    readerMain.addEventListener('click', (e) => {
      if (e.target.closest('.end-panel')) return;
      toggleChrome();
    });

    const images = Array.from(readerMain.querySelectorAll('.page-img'));
    let ticking = false;
    let saveTimer = null;

    function computeCurrent() {
      const mid = window.innerHeight * 0.5;
      let idx = 0;
      for (let i = 0; i < images.length; i++) {
        if (images[i].getBoundingClientRect().top <= mid) idx = i;
      }
      currentPage = idx;
      updateCounter(idx);
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => saveProgress(idx), 350);
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => { computeCurrent(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });

    updateCounter(currentPage);

    // jump to saved page on open
    if (currentPage > 0 && images[currentPage]) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        images[currentPage].scrollIntoView({ block: 'start' });
      }));
    }
  }

  // ---------------- PAGE (FLIP) MODE ----------------
  function renderPageMode() {
    readerMain.className = 'pages-flip';
    if (!total) {
      readerMain.innerHTML = `<div class="end-panel"><h3>No pages in this chapter</h3><div class="end-actions"><a href="index.html">Back to library</a></div></div>`;
      return;
    }

    readerMain.innerHTML = `
      <img class="page-img" id="flipImg" alt="">
      <div class="tap-zone left" id="zoneLeft"></div>
      <div class="tap-zone right" id="zoneRight"></div>
    `;
    const flipImg = document.getElementById('flipImg');
    const zoneLeft = document.getElementById('zoneLeft');
    const zoneRight = document.getElementById('zoneRight');

    function showPage(idx) {
      currentPage = Math.max(0, Math.min(idx, total - 1));
      flipImg.src = Manga.pageUrl(chapter, pages[currentPage]);
      updateCounter(currentPage);
      saveProgress(currentPage);
      // preload neighbor
      const preloadIdx = currentPage + 1;
      if (preloadIdx < total) { new Image().src = Manga.pageUrl(chapter, pages[preloadIdx]); }
    }

    function goForward() {
      if (currentPage >= total - 1) {
        showEndScreen();
        return;
      }
      showPage(currentPage + 1);
    }
    function goBackward() {
      if (currentPage <= 0) {
        if (prevChapter) location.href = `reader.html?chapter=${encodeURIComponent(prevChapter.id)}&start=end`;
        return;
      }
      showPage(currentPage - 1);
    }

    function onLeftTap() { direction === 'rtl' ? goForward() : goBackward(); }
    function onRightTap() { direction === 'rtl' ? goBackward() : goForward(); }

    zoneLeft.addEventListener('click', (e) => { e.stopPropagation(); onLeftTap(); });
    zoneRight.addEventListener('click', (e) => { e.stopPropagation(); onRightTap(); });
    readerMain.addEventListener('click', (e) => {
      if (e.target === zoneLeft || e.target === zoneRight) return;
      toggleChrome();
    });

    // swipe support
    let touchStartX = null;
    readerMain.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
    readerMain.addEventListener('touchend', (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(dx) < 50) return;
      if (dx < 0) onRightTap(); else onLeftTap();
    }, { passive: true });

    function showEndScreen() {
      readerMain.innerHTML = endPanelHtml();
      wireEndPanel(readerMain);
    }

    showPage(currentPage);

    // keyboard
    reader_keyHandler = (e) => {
      if (e.key === 'ArrowRight') onRightTap();
      else if (e.key === 'ArrowLeft') onLeftTap();
    };
    document.addEventListener('keydown', reader_keyHandler);
  }

  let reader_keyHandler = null;

  function clearKeyHandler() {
    if (reader_keyHandler) { document.removeEventListener('keydown', reader_keyHandler); reader_keyHandler = null; }
  }

  function render() {
    clearKeyHandler();
    if (mode === 'page') renderPageMode(); else renderScroll();
  }

  render();

  // ---------------- settings drawer ----------------
  function syncPillGroups() {
    modeGroup.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.value === mode));
    directionGroup.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.value === direction));
    themeGroup.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.value === theme));
    directionRow.style.display = mode === 'page' ? 'flex' : 'none';
  }
  syncPillGroups();

  function openDrawer() { drawer.classList.add('open'); drawerBackdrop.classList.add('open'); }
  function closeDrawer() { drawer.classList.remove('open'); drawerBackdrop.classList.remove('open'); }

  settingsTab.addEventListener('click', () => openDrawer());
  drawerBackdrop.addEventListener('click', () => closeDrawer());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  modeGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    mode = btn.dataset.value;
    Manga.setSetting(Manga.KEYS.mode, mode);
    syncPillGroups();
    render();
  });
  directionGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    direction = btn.dataset.value;
    Manga.setSetting(Manga.KEYS.direction, direction);
    syncPillGroups();
  });
  themeGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    theme = btn.dataset.value;
    Manga.setSetting(Manga.KEYS.theme, theme);
    document.documentElement.setAttribute('data-theme', theme);
    syncPillGroups();
  });
})();

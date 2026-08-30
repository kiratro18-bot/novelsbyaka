/* reader.js — powers reader.html */
(function () {
  "use strict";
  var M = window.Manga;

  var els = {
    root: document.getElementById("readerRoot"),
    main: document.getElementById("readerMain"),
    chrome: document.getElementById("chrome"),
    bottom: document.querySelector(".reader-bottom"),
    title: document.getElementById("chapterTitle"),
    counter: document.getElementById("pageCounter"),
    progressFill: document.getElementById("progressFill"),
    settingsTab: document.getElementById("settingsTab"),
    drawer: document.getElementById("drawer"),
    drawerBackdrop: document.getElementById("drawerBackdrop"),
    drawerClose: document.getElementById("drawerClose"),
    modeGroup: document.getElementById("modeGroup"),
    directionRow: document.getElementById("directionRow"),
    directionGroup: document.getElementById("directionGroup"),
    themeGroup: document.getElementById("themeGroup"),
  };

  var params = new URLSearchParams(location.search);
  var chapterId = params.get("c");
  var startPage = parseInt(params.get("p"), 10);

  var state = {
    manifest: null,
    chapter: null,
    chapterIndex: -1,
    nextChapter: null,
    settings: M.getSettings(),
    currentPage: 1, // 1-indexed, real pages only
    total: 0,
    io: null,
    touchStartX: null,
    touchStartY: null,
  };

  // ---------------------------------------------------------- bootstrapping
  if (!chapterId) {
    showFatalError("No chapter specified", 'Head back to the <a href="index.html">library</a> and pick a chapter.');
  } else {
    M.loadManifest()
      .then(function (manifest) {
        state.manifest = manifest;
        state.chapterIndex = manifest.chapters.findIndex(function (c) { return c.id === chapterId; });
        state.chapter = manifest.chapters[state.chapterIndex];
        if (!state.chapter) {
          showFatalError("Chapter not found", 'This chapter isn\'t in the library anymore. Back to the <a href="index.html">library</a>.');
          return;
        }
        state.nextChapter = manifest.chapters[state.chapterIndex + 1] || null;
        state.total = state.chapter.pages.length;
        init();
      })
      .catch(function (err) {
        var isLocalFile = location.protocol === "file:";
        showFatalError(
          "Couldn't load chapters.json",
          isLocalFile
            ? "Browsers block local file loads like this one. Serve the folder with <code>python3 -m http.server</code> and open it via <code>http://localhost</code>."
            : M.escapeHtml(err && err.message ? err.message : "Something went wrong.")
        );
      });
  }

  function showFatalError(title, bodyHtml) {
    els.title.textContent = "Error";
    els.main.innerHTML =
      '<div class="reader-end"><div class="k">Manga.</div><div class="t">' + M.escapeHtml(title) + "</div>" +
      '<p class="lib-link" style="margin-top:14px;">' + bodyHtml + "</p></div>";
  }

  // ---------------------------------------------------------------- init
  function init() {
    document.title = state.chapter.title + " · " + (state.manifest.title || "Manga");
    els.title.textContent = state.chapter.title;

    var saved = M.getProgress(state.chapter.id);
    var initial = 1;
    if (!isNaN(startPage) && startPage >= 1) initial = Math.min(startPage, state.total);
    else if (saved && saved.page) initial = Math.min(saved.page, state.total);
    state.currentPage = initial;

    syncSettingsUI();
    renderForMode(initial);
    wireChrome();
    wireDrawer();
    wireKeyboard();
  }

  // ------------------------------------------------------- settings <-> UI
  function syncSettingsUI() {
    setActivePill(els.modeGroup, state.settings.mode);
    setActivePill(els.directionGroup, state.settings.direction);
    setActivePill(els.themeGroup, M.getTheme());
    els.directionRow.classList.toggle("is-disabled", state.settings.mode !== "page");
  }
  function setActivePill(group, value) {
    M.qsa("button", group).forEach(function (b) {
      b.classList.toggle("active", b.dataset.value === value);
    });
  }

  function renderForMode(atPage) {
    els.main.className = state.settings.mode === "page" ? "mode-page" : "mode-scroll";
    els.main.innerHTML = "";
    if (state.settings.mode === "page") renderPageMode(atPage);
    else renderScrollMode(atPage);
    updateCounter(atPage);
    updateProgressBar(atPage);
  }

  // --------------------------------------------------------- scroll mode
  function renderScrollMode(atPage) {
    var frag = document.createDocumentFragment();
    state.chapter.pages.forEach(function (file, i) {
      var wrap = document.createElement("div");
      wrap.className = "page-scroll";
      wrap.dataset.page = i + 1;
      var img = document.createElement("img");
      img.src = state.chapter.folder + "/" + file;
      img.alt = "Page " + (i + 1);
      img.loading = i < 2 ? "eager" : "lazy";
      wrap.appendChild(img);
      frag.appendChild(wrap);
    });
    els.main.appendChild(frag);
    els.main.appendChild(buildEndCard());

    requestAnimationFrame(function () {
      var target = M.qs('.page-scroll[data-page="' + atPage + '"]', els.main);
      if (target) target.scrollIntoView({ block: "start" });
      observeScrollPages();
    });

    els.main.addEventListener("scroll", onScrollMove, { passive: true });
  }

  function observeScrollPages() {
    if (state.io) state.io.disconnect();
    state.io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var p = parseInt(entry.target.dataset.page, 10);
            if (p) setCurrentPage(p);
          }
        });
      },
      { root: els.main, threshold: [0.5] }
    );
    M.qsa(".page-scroll", els.main).forEach(function (el) { state.io.observe(el); });
  }

  var scrollHideTicking = false;
  var lastScrollTop = 0;
  function onScrollMove() {
    updateProgressBarFromScroll();
    if (scrollHideTicking) return;
    scrollHideTicking = true;
    requestAnimationFrame(function () {
      var top = els.main.scrollTop;
      var goingDown = top > lastScrollTop + 4;
      var goingUp = top < lastScrollTop - 4;
      if (top < 40) {
        setChromeHidden(false);
      } else if (goingDown) {
        setChromeHidden(true);
      } else if (goingUp) {
        setChromeHidden(false);
      }
      lastScrollTop = top;
      scrollHideTicking = false;
    });
  }
  function updateProgressBarFromScroll() {
    var max = els.main.scrollHeight - els.main.clientHeight;
    var pct = max > 0 ? Math.min(100, Math.max(0, (els.main.scrollTop / max) * 100)) : 0;
    els.progressFill.style.width = pct + "%";
  }

  // ----------------------------------------------------------- page mode
  function renderPageMode(atPage) {
    var stage = document.createElement("div");
    stage.className = "page-stage";

    var img = document.createElement("img");
    img.id = "pageImg";
    img.alt = "Page " + atPage;
    img.draggable = false;
    stage.appendChild(img);

    var leftZone = buildTapZone("left");
    var rightZone = buildTapZone("right");
    stage.appendChild(leftZone);
    stage.appendChild(rightZone);

    els.main.appendChild(stage);
    setPageImage(atPage);

    leftZone.addEventListener("click", function () { handleZoneTap("left"); });
    rightZone.addEventListener("click", function () { handleZoneTap("right"); });

    els.main.addEventListener("touchstart", onTouchStart, { passive: true });
    els.main.addEventListener("touchend", onTouchEnd, { passive: true });
  }

  function buildTapZone(side) {
    var z = document.createElement("div");
    z.className = "tap-zone " + side;
    var hint = document.createElement("div");
    hint.className = "tap-hint";
    hint.innerHTML = side === "left"
      ? '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>';
    z.appendChild(hint);
    return z;
  }

  function handleZoneTap(side) {
    // middle third toggles chrome; handled by click position, see wireChrome().
    var forward = state.settings.direction === "rtl" ? side === "left" : side === "right";
    if (forward) goToPage(state.currentPage + 1);
    else goToPage(state.currentPage - 1);
  }

  function setPageImage(p) {
    var img = document.getElementById("pageImg");
    if (!img) return;
    var file = state.chapter.pages[p - 1];
    img.src = state.chapter.folder + "/" + file;
    img.alt = "Page " + p;
  }

  function goToPage(p) {
    if (p < 1) return;
    if (p > state.total) {
      if (state.settings.mode === "page") showEndScreen();
      return;
    }
    setCurrentPage(p);
    setPageImage(p);
  }

  function showEndScreen() {
    els.main.innerHTML = "";
    els.main.appendChild(buildEndCard());
    setCurrentPage(state.total, true);
  }

  function buildEndCard() {
    var wrap = document.createElement("div");
    wrap.className = "reader-end";
    var nextHtml = state.nextChapter
      ? '<a class="next-btn" href="reader.html?c=' + encodeURIComponent(state.nextChapter.id) + '">Next chapter <svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></a>'
      : "";
    wrap.innerHTML =
      '<div class="k">End of chapter</div>' +
      '<div class="t">' + M.escapeHtml(state.chapter.title) + "</div>" +
      nextHtml +
      '<a class="lib-link" href="index.html">Back to library</a>';
    return wrap;
  }

  // ---------------------------------------------------------- touch swipe
  function onTouchStart(e) {
    var t = e.changedTouches[0];
    state.touchStartX = t.clientX;
    state.touchStartY = t.clientY;
  }
  function onTouchEnd(e) {
    if (state.touchStartX == null) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - state.touchStartX;
    var dy = t.clientY - state.touchStartY;
    state.touchStartX = null;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    var swipeLeft = dx < 0;
    var forward = state.settings.direction === "rtl" ? !swipeLeft : swipeLeft;
    if (forward) goToPage(state.currentPage + 1);
    else goToPage(state.currentPage - 1);
  }

  // -------------------------------------------------------------- shared
  function setCurrentPage(p, isEnd) {
    state.currentPage = p;
    updateCounter(p, isEnd);
    updateProgressBar(p);
    M.setProgress(state.chapter.id, p, state.total);
  }
  function updateCounter(p, isEnd) {
    els.counter.textContent = isEnd ? "Done" : "Page " + p + " / " + state.total;
  }
  function updateProgressBar(p) {
    if (state.settings.mode === "scroll") return; // driven by scroll position instead
    var pct = state.total ? Math.round((p / state.total) * 100) : 0;
    els.progressFill.style.width = pct + "%";
  }

  // ------------------------------------------------------------ chrome
  function setChromeHidden(hidden) {
    els.chrome.classList.toggle("is-hidden", hidden);
    els.bottom.classList.toggle("is-hidden", hidden);
  }
  function wireChrome() {
    // In page mode, tapping the dead-center of the stage toggles chrome.
    els.main.addEventListener("click", function (e) {
      if (state.settings.mode !== "page") return;
      var rect = els.main.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var pct = x / rect.width;
      if (pct > 0.33 && pct < 0.67) {
        setChromeHidden(!els.chrome.classList.contains("is-hidden"));
      }
    });
  }

  // ------------------------------------------------------------ keyboard
  function wireKeyboard() {
    document.addEventListener("keydown", function (e) {
      if (els.drawer.classList.contains("is-open")) {
        if (e.key === "Escape") closeDrawer();
        return;
      }
      if (state.settings.mode !== "page") return;
      if (e.key === "ArrowRight") handleZoneTap("right");
      else if (e.key === "ArrowLeft") handleZoneTap("left");
    });
  }

  // -------------------------------------------------------------- drawer
  function openDrawer() {
    els.drawer.classList.add("is-open");
    els.drawerBackdrop.classList.add("is-open");
  }
  function closeDrawer() {
    els.drawer.classList.remove("is-open");
    els.drawerBackdrop.classList.remove("is-open");
  }
  function wireDrawer() {
    els.settingsTab.addEventListener("click", openDrawer);
    els.drawerClose.addEventListener("click", closeDrawer);
    els.drawerBackdrop.addEventListener("click", closeDrawer);

    els.modeGroup.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-value]");
      if (!btn || btn.dataset.value === state.settings.mode) return;
      state.settings = M.setSettings({ mode: btn.dataset.value });
      syncSettingsUI();
      var at = state.currentPage;
      setChromeHidden(false);
      renderForMode(at);
    });

    els.directionGroup.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-value]");
      if (!btn) return;
      state.settings = M.setSettings({ direction: btn.dataset.value });
      syncSettingsUI();
    });

    els.themeGroup.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-value]");
      if (!btn) return;
      M.setTheme(btn.dataset.value);
      syncSettingsUI();
    });
  }
})();

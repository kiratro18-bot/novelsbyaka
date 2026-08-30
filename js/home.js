/* home.js — renders the library grid on index.html */
(function () {
  "use strict";
  var M = window.Manga;
  M.initThemeToggle("themeToggle");

  var grid = document.getElementById("grid");
  var countLabel = document.getElementById("countLabel");
  var emptyState = document.getElementById("emptyState");
  var continueSlot = document.getElementById("continueSlot");

  function coverSrc(chapter) {
    if (!chapter.pages || !chapter.pages.length) return "";
    return chapter.folder + "/" + chapter.pages[0];
  }

  function renderContinue(manifest) {
    var last = M.getLast();
    if (!last || !last.chapterId) return;
    var chapter = manifest.chapters.find(function (c) { return c.id === last.chapterId; });
    if (!chapter) return;

    var total = last.total || (chapter.pages ? chapter.pages.length : 0);
    var page = Math.min(last.page || 1, total || 1);
    if (total && page >= total) return; // finished — don't nag to "continue" a chapter that's done

    var pct = total ? Math.round((page / total) * 100) : 0;

    var a = document.createElement("a");
    a.className = "continue-card";
    a.href = "reader.html?c=" + encodeURIComponent(chapter.id) + "&p=" + page;
    a.innerHTML =
      '<div class="continue-cover"><img src="' + M.escapeHtml(coverSrc(chapter)) + '" alt="" loading="lazy"></div>' +
      '<div class="continue-body">' +
        '<div class="continue-eyebrow">Continue reading</div>' +
        '<div class="continue-title">' + M.escapeHtml(chapter.title) + "</div>" +
        '<div class="continue-meta mono">Page ' + page + " of " + total + "</div>" +
        '<div class="continue-bar"><div class="continue-bar-fill" style="width:' + pct + '%"></div></div>' +
      "</div>" +
      '<div class="continue-go"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></div>';
    continueSlot.appendChild(a);
  }

  function renderGrid(manifest) {
    var chapters = manifest.chapters || [];
    countLabel.textContent = chapters.length ? "· " + chapters.length + (chapters.length === 1 ? " chapter" : " chapters") : "";

    if (!chapters.length) {
      emptyState.style.display = "";
      grid.style.display = "none";
      return;
    }

    var frag = document.createDocumentFragment();
    chapters.forEach(function (chapter, i) {
      var progress = M.getProgress(chapter.id);
      var total = chapter.pages ? chapter.pages.length : 0;
      var metaText = total + (total === 1 ? " page" : " pages");
      if (progress && total) {
        if (progress.page >= total) metaText += " · read";
        else metaText += " · p" + progress.page;
      }

      var a = document.createElement("a");
      a.className = "card";
      a.href = "reader.html?c=" + encodeURIComponent(chapter.id);
      a.innerHTML =
        '<div class="card-cover">' +
          '<img src="' + M.escapeHtml(coverSrc(chapter)) + '" alt="" loading="lazy">' +
          '<div class="card-badge mono">Ch ' + (i + 1) + "</div>" +
        "</div>" +
        '<div class="card-title">' + M.escapeHtml(chapter.title) + "</div>" +
        '<div class="card-meta">' + M.escapeHtml(metaText) + "</div>";
      frag.appendChild(a);
    });
    grid.appendChild(frag);
  }

  function renderFetchError(err) {
    var isLocalFile = location.protocol === "file:";
    emptyState.style.display = "";
    grid.style.display = "none";
    emptyState.innerHTML =
      "<h3>Couldn't load chapters.json</h3>" +
      "<p>" + (isLocalFile
        ? "Browsers block local file loads like this one. Serve the folder with a tiny local server, e.g. <code>python3 -m http.server</code>, then open <code>http://localhost:8000</code>."
        : M.escapeHtml(err && err.message ? err.message : "Something went wrong fetching the manifest.")) +
      "</p>";
  }

  M.loadManifest()
    .then(function (manifest) {
      document.title = manifest.title || document.title;
      renderContinue(manifest);
      renderGrid(manifest);
    })
    .catch(renderFetchError);
})();

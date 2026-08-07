(async function () {
  const grid = document.getElementById('grid');
  const emptyState = document.getElementById('emptyState');
  const countLabel = document.getElementById('countLabel');
  const continueSlot = document.getElementById('continueSlot');
  const wordmark = document.getElementById('wordmark');
  const themeToggle = document.getElementById('themeToggle');

  themeToggle.addEventListener('click', () => Manga.toggleTheme());

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  let manifest;
  try {
    manifest = await Manga.loadManifest();
  } catch (e) {
    manifest = { title: 'Manga', chapters: [] };
  }

  wordmark.innerHTML = `${escapeHtml(manifest.title || 'Manga')}<span>.</span>`;
  document.title = manifest.title || 'Manga Library';

  const chapters = manifest.chapters || [];
  countLabel.textContent = chapters.length ? `${chapters.length} chapter${chapters.length === 1 ? '' : 's'}` : '';

  if (!chapters.length) {
    emptyState.style.display = 'block';
    return;
  }

  // Continue reading banner
  const lastRead = Manga.getLastRead();
  if (lastRead) {
    const chap = chapters.find(c => c.id === lastRead.chapterId);
    if (chap) {
      const cover = chap.pages && chap.pages[0] ? Manga.pageUrl(chap, chap.pages[0]) : '';
      const div = document.createElement('div');
      div.className = 'continue';
      div.innerHTML = `
        ${cover ? `<img class="continue-thumb" src="${cover}" alt="">` : ''}
        <div class="continue-meta">
          <p class="continue-eyebrow">Continue reading</p>
          <p class="continue-title">${escapeHtml(chap.title)}</p>
          <p class="continue-sub">Page ${lastRead.page + 1} of ${lastRead.total}</p>
        </div>
        <button class="continue-btn">Resume</button>
      `;
      div.addEventListener('click', () => { location.href = `reader.html?chapter=${encodeURIComponent(chap.id)}`; });
      continueSlot.appendChild(div);
    }
  }

  chapters.forEach((chap, i) => {
    const card = document.createElement('div');
    card.className = 'panel-card';

    const cover = chap.pages && chap.pages[0] ? Manga.pageUrl(chap, chap.pages[0]) : null;
    const progress = Manga.getProgress(chap.id);

    card.innerHTML = `
      ${cover
        ? `<img src="${cover}" alt="" loading="lazy">`
        : `<div class="no-cover"><span>No pages</span></div>`}
      <div class="panel-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="panel-title">${escapeHtml(chap.title)}</div>
      ${progress && progress.total ? `<div class="panel-progress" style="width:${Math.min(100, Math.round((progress.page + 1) / progress.total * 100))}%"></div>` : ''}
    `;
    card.addEventListener('click', () => { location.href = `reader.html?chapter=${encodeURIComponent(chap.id)}`; });
    grid.appendChild(card);
  });
})();
